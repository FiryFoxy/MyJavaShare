import { ExecutionLog } from '../types';

export interface RunnerCallbacks {
  onOutput: (text: string, type: 'stdout' | 'stderr' | 'system' | 'input') => void;
  onClear: () => void;
  onRequestInput: (promptText?: string) => Promise<string>;
  onFinished: (exitCode: number) => void;
}

/**
 * Browser-based Java code transpiler and runtime simulator.
 * Translates standard Java syntax (Scanner, System.out, loops, methods, OOP basics)
 * into an asynchronous execution environment that supports real user terminal input.
 */
export class JavaRuntime {
  private isTerminated = false;
  private currentResolver: ((val: string) => void) | null = null;

  stop() {
    this.isTerminated = true;
    if (this.currentResolver) {
      this.currentResolver('');
      this.currentResolver = null;
    }
  }

  getIsTerminated() {
    return this.isTerminated;
  }

  async run(code: string, callbacks: RunnerCallbacks): Promise<void> {
    this.isTerminated = false;
    callbacks.onOutput('=== Java Virtual Machine Initialized ===\n', 'system');

    try {
      // 1. Preprocess Java source code to executable JS generator / async function
      const executableJs = this.transpileJavaToJs(code);

      // 2. Set up Java standard library mock environment
      const env = this.createJavaEnvironment(callbacks);

      // 3. Execute
      const runFn = new Function('javaEnv', `
        return (async function() {
          const { System, Scanner, Math, Random, Integer, Double, Boolean, StringUtils, Thread, promptInput } = javaEnv;
          ${executableJs}
        })();
      `);

      await runFn(env);

      if (!this.isTerminated) {
        callbacks.onOutput('\n[Program finished with exit code 0]', 'system');
        callbacks.onFinished(0);
      }
    } catch (err: unknown) {
      if (this.isTerminated) {
        callbacks.onOutput('\n[Program execution halted by user]', 'system');
        callbacks.onFinished(130);
      } else {
        const errorMsg = err instanceof Error ? err.message : String(err);
        callbacks.onOutput(`\nException in thread "main" java.lang.RuntimeException: ${errorMsg}\n`, 'stderr');
        callbacks.onFinished(1);
      }
    }
  }

  private createJavaEnvironment(callbacks: RunnerCallbacks) {
    const self = this;

    // Scanner implementation
    class MockScanner {
      private buffer: string[] = [];

      constructor(_src?: any) {}

      private async fillBuffer(promptHint?: string): Promise<void> {
        if (self.isTerminated) throw new Error('Interrupted');
        const line = await callbacks.onRequestInput(promptHint);
        if (self.isTerminated) throw new Error('Interrupted');
        callbacks.onOutput(line + '\n', 'input');
        // split by whitespace
        const tokens = line.trim().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) {
          this.buffer.push('');
        } else {
          this.buffer.push(...tokens);
        }
      }

      async nextLine(): Promise<string> {
        if (self.isTerminated) throw new Error('Interrupted');
        const line = await callbacks.onRequestInput();
        if (self.isTerminated) throw new Error('Interrupted');
        callbacks.onOutput(line + '\n', 'input');
        this.buffer = []; // clear token buffer on whole line
        return line;
      }

      async next(): Promise<string> {
        while (this.buffer.length === 0) {
          await this.fillBuffer();
        }
        return this.buffer.shift() || '';
      }

      async nextInt(): Promise<number> {
        const token = await this.next();
        const num = parseInt(token, 10);
        if (isNaN(num)) {
          throw new Error(`java.util.InputMismatchException: "${token}" is not an integer`);
        }
        return num;
      }

      async nextDouble(): Promise<number> {
        const token = await this.next();
        const num = parseFloat(token);
        if (isNaN(num)) {
          throw new Error(`java.util.InputMismatchException: "${token}" is not a double`);
        }
        return num;
      }

      hasNextInt(): boolean {
        return true;
      }

      hasNextLine(): boolean {
        return true;
      }

      close() {}
    }

    // Java System.out and System.err
    const System = {
      out: {
        println: (arg?: any) => {
          if (self.isTerminated) throw new Error('Interrupted');
          const str = arg === undefined ? '' : String(arg);
          callbacks.onOutput(str + '\n', 'stdout');
        },
        print: (arg?: any) => {
          if (self.isTerminated) throw new Error('Interrupted');
          const str = arg === undefined ? '' : String(arg);
          callbacks.onOutput(str, 'stdout');
        },
        printf: (format: string, ...args: any[]) => {
          if (self.isTerminated) throw new Error('Interrupted');
          let formatted = format;
          for (const a of args) {
            formatted = formatted.replace(/%[sfd]/, String(a));
          }
          callbacks.onOutput(formatted, 'stdout');
        },
      },
      err: {
        println: (arg?: any) => {
          callbacks.onOutput(String(arg) + '\n', 'stderr');
        },
        print: (arg?: any) => {
          callbacks.onOutput(String(arg), 'stderr');
        },
      },
      currentTimeMillis: () => Date.now(),
      nanoTime: () => performance.now() * 1000000,
      exit: (code = 0) => {
        self.stop();
        callbacks.onFinished(code);
      },
    };

    // Java Random class
    class MockRandom {
      nextInt(bound?: number): number {
        if (bound === undefined) {
          return Math.floor(Math.random() * 2147483647);
        }
        return Math.floor(Math.random() * bound);
      }
      nextDouble(): number {
        return Math.random();
      }
      nextBoolean(): boolean {
        return Math.random() >= 0.5;
      }
    }

    return {
      System,
      Scanner: MockScanner,
      Math: {
        ...Math,
        round: Math.round,
        abs: Math.abs,
        max: Math.max,
        min: Math.min,
        sqrt: Math.sqrt,
        pow: Math.pow,
        floor: Math.floor,
        ceil: Math.ceil,
        random: Math.random,
        PI: Math.PI,
        E: Math.E,
      },
      Random: MockRandom,
      Integer: {
        parseInt: (s: string) => parseInt(s, 10),
        MAX_VALUE: 2147483647,
        MIN_VALUE: -2147483648,
        toBinaryString: (n: number) => (n >>> 0).toString(2),
        toHexString: (n: number) => (n >>> 0).toString(16),
      },
      Double: {
        parseDouble: (s: string) => parseFloat(s),
        MAX_VALUE: Number.MAX_VALUE,
        MIN_VALUE: Number.MIN_VALUE,
      },
      Boolean: {
        parseBoolean: (s: string) => s.toLowerCase() === 'true',
      },
      Thread: {
        sleep: async (ms: number) => {
          if (self.isTerminated) throw new Error('Interrupted');
          await new Promise(r => setTimeout(r, ms));
        },
      },
      promptInput: async (promptHint?: string) => {
        return await callbacks.onRequestInput(promptHint);
      },
    };
  }

  /**
   * Transpiles a subset of Java code into clean asynchronous JavaScript.
   */
  private transpileJavaToJs(source: string): string {
    // 1. Remove package declarations and imports
    let code = source
      .replace(/package\s+[\w.]+;/g, '')
      .replace(/import\s+[\w.*]+;/g, '');

    // 2. Transform Scanner instantiations
    code = code.replace(/Scanner\s+(\w+)\s*=\s*new\s+Scanner\([^)]*\);/g, 'const $1 = new Scanner();');

    // 3. Transform Scanner method calls to await calls
    code = code.replace(/(\w+)\.nextLine\(\)/g, 'await $1.nextLine()');
    code = code.replace(/(\w+)\.nextInt\(\)/g, 'await $1.nextInt()');
    code = code.replace(/(\w+)\.nextDouble\(\)/g, 'await $1.nextDouble()');
    code = code.replace(/(\w+)\.next\(\)/g, 'await $1.next()');

    // 4. Transform Thread.sleep
    code = code.replace(/Thread\.sleep\((\d+)\)/g, 'await Thread.sleep($1)');

    // 5. Transform Java type declarations in local variables
    // e.g. int x = 5; -> let x = 5;
    // String name = "Bob"; -> let name = "Bob";
    // boolean hasWon = false; -> let hasWon = false;
    // double rate = 3.14; -> let rate = 3.14;
    // long a = 0; -> let a = 0;
    // char c = 'a'; -> let c = 'a';
    const typeRegex = /\b(?:int|double|float|long|short|byte|boolean|char|String|Random|Scanner)\s+(\w+)(\s*=\s*[^;]+)?;/g;
    code = code.replace(typeRegex, (_match, varName, assignment) => {
      return `let ${varName}${assignment || ''};`;
    });

    // 6. Transform Arrays e.g. String[] enemies = { ... }; -> let enemies = [ ... ];
    code = code.replace(/\b(?:int|String|double|boolean|char)\[\]\s+(\w+)\s*=\s*\{([^}]+)\};/g, 'let $1 = [$2];');
    code = code.replace(/\b(?:int|String|double|boolean|char)\[\]\s+(\w+)\s*=\s*new\s+(?:int|String|double|boolean|char)\[([^\]]+)\];/g, 'let $1 = new Array($2).fill(0);');

    // 7. Transform String methods:
    // .equals(...) -> === ...
    // Note: handle simple .equals
    code = code.replace(/\.equals\(([^)]+)\)/g, ' === $1');
    code = code.replace(/\.equalsIgnoreCase\(([^)]+)\)/g, '.toLowerCase() === String($1).toLowerCase()');

    // 8. Transform Java labels (e.g. GAME: while(...) )
    code = code.replace(/([A-Z_]+):\s*while/g, '/* $1 */ while');

    // 9. Extract methods and main body
    // If there is public static void main(String[] args) { ... }
    const mainMatch = code.match(/public\s+static\s+void\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}/);
    if (mainMatch) {
      // Find class body and static helper methods
      // For helper methods e.g. private static boolean isPrime(int n) { ... }
      const methodRegex = /(?:public|private|protected)?\s*static\s+(?:boolean|int|double|String|void|long)\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\s*\}/g;
      
      let helpers = '';
      let mMatch;
      while ((mMatch = methodRegex.exec(code)) !== null) {
        const methodName = mMatch[1];
        if (methodName !== 'main') {
          const rawParams = mMatch[2];
          // clean param types: int n, String s -> n, s
          const cleanParams = rawParams.split(',').map(p => p.trim().split(/\s+/).pop()).filter(Boolean).join(', ');
          let methodBody = mMatch[3];
          // transform types in helper body
          methodBody = methodBody.replace(typeRegex, (_m, v, a) => `let ${v}${a || ''};`);
          helpers += `function ${methodName}(${cleanParams}) {\n${methodBody}\n}\n`;
        }
      }

      const mainBody = mainMatch[1];
      return `${helpers}\n${mainBody}`;
    }

    // If no explicit main, return transformed code
    return code;
  }
}
