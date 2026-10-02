import { ExecutionLog } from '../types';

export interface RunnerCallbacks {
  onOutput: (text: string, type: 'stdout' | 'stderr' | 'system' | 'input') => void;
  onClear: () => void;
  onRequestInput: (promptText?: string) => Promise<string>;
  onFinished: (exitCode: number) => void;
}

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
      // 1. Transpile Java source code to clean async JavaScript
      const executableJs = this.transpileJavaToJs(code);

      // 2. Set up Java standard library mock environment
      const env = this.createJavaEnvironment(callbacks);

      // 3. Execute with scoped variables
      const runFn = new Function('javaEnv', `
        return (async function() {
          const {
            System,
            Scanner,
            Math,
            Random,
            Integer,
            Double,
            Boolean,
            Thread,
            ArrayList,
            List,
            HashMap,
            Map,
            HashSet,
            Set,
            Arrays,
            Collections,
            StringBuilder,
            StringBuffer,
          } = javaEnv;
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

    // Mock Scanner
    class MockScanner {
      private buffer: string[] = [];

      constructor(_src?: any) {}

      private async fillBuffer(promptHint?: string): Promise<void> {
        if (self.isTerminated) throw new Error('Interrupted');
        const line = await callbacks.onRequestInput(promptHint);
        if (self.isTerminated) throw new Error('Interrupted');
        callbacks.onOutput(line + '\n', 'input');
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
        this.buffer = [];
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

      async nextFloat(): Promise<number> {
        return this.nextDouble();
      }

      async nextLong(): Promise<number> {
        return this.nextInt();
      }

      async nextBoolean(): Promise<boolean> {
        const token = await this.next();
        return token.toLowerCase() === 'true';
      }

      hasNextInt(): boolean {
        return true;
      }

      hasNextLine(): boolean {
        return true;
      }

      hasNext(): boolean {
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

    // Java Random
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

    // Java ArrayList
    class MockArrayList<T = any> {
      private items: T[] = [];
      constructor(initial?: T[]) {
        if (Array.isArray(initial)) this.items = [...initial];
      }
      add(item: T) { this.items.push(item); return true; }
      get(index: number): T { return this.items[index]; }
      set(index: number, item: T) { const old = this.items[index]; this.items[index] = item; return old; }
      size(): number { return this.items.length; }
      isEmpty(): boolean { return this.items.length === 0; }
      contains(item: T): boolean { return this.items.includes(item); }
      remove(indexOrItem: any) {
        if (typeof indexOrItem === 'number') {
          return this.items.splice(indexOrItem, 1)[0];
        }
        const idx = this.items.indexOf(indexOrItem);
        if (idx !== -1) { this.items.splice(idx, 1); return true; }
        return false;
      }
      clear() { this.items = []; }
      toArray(): T[] { return [...this.items]; }
      [Symbol.iterator]() { return this.items[Symbol.iterator](); }
      toString(): string { return '[' + this.items.join(', ') + ']'; }
    }

    // Java HashMap
    class MockHashMap<K = any, V = any> {
      private map = new globalThis.Map<K, V>();
      put(key: K, val: V): V { this.map.set(key, val); return val; }
      get(key: K): V | undefined { return this.map.get(key); }
      containsKey(key: K): boolean { return this.map.has(key); }
      size(): number { return this.map.size; }
      remove(key: K): boolean { return this.map.delete(key); }
      clear() { this.map.clear(); }
      keySet(): K[] { return Array.from(this.map.keys()); }
      values(): V[] { return Array.from(this.map.values()); }
    }

    // Java HashSet
    class MockHashSet<T = any> {
      private set = new globalThis.Set<T>();
      add(item: T): boolean { const has = this.set.has(item); this.set.add(item); return !has; }
      contains(item: T): boolean { return this.set.has(item); }
      size(): number { return this.set.size; }
      remove(item: T): boolean { return this.set.delete(item); }
      clear() { this.set.clear(); }
      [Symbol.iterator]() { return this.set[Symbol.iterator](); }
    }

    // Java Arrays
    const MockArrays = {
      toString: (arr: any) => (Array.isArray(arr) ? '[' + arr.join(', ') + ']' : String(arr)),
      sort: (arr: any[]) => {
        if (Array.isArray(arr)) arr.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
      },
      fill: (arr: any[], val: any) => {
        if (Array.isArray(arr)) arr.fill(val);
      },
      asList: (...items: any[]) => new MockArrayList(items),
    };

    // Java Collections
    const MockCollections = {
      sort: (list: any) => {
        if (list && typeof list.toArray === 'function') {
          const arr = list.toArray();
          arr.sort((a: any, b: any) => (a > b ? 1 : a < b ? -1 : 0));
          list.clear();
          arr.forEach((it: any) => list.add(it));
        } else if (Array.isArray(list)) {
          list.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
        }
      },
      reverse: (list: any) => {
        if (list && typeof list.toArray === 'function') {
          const arr = list.toArray().reverse();
          list.clear();
          arr.forEach((it: any) => list.add(it));
        } else if (Array.isArray(list)) {
          list.reverse();
        }
      },
    };

    // Java StringBuilder
    class MockStringBuilder {
      private str = '';
      constructor(initial = '') { this.str = String(initial); }
      append(val: any) { this.str += String(val); return this; }
      toString(): string { return this.str; }
      length(): number { return this.str.length; }
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
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        log: Math.log,
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
      ArrayList: MockArrayList,
      List: MockArrayList,
      HashMap: MockHashMap,
      Map: MockHashMap,
      HashSet: MockHashSet,
      Set: MockHashSet,
      Arrays: MockArrays,
      Collections: MockCollections,
      StringBuilder: MockStringBuilder,
      StringBuffer: MockStringBuilder,
    };
  }

  /**
   * Balanced brace block extractor to prevent accidental trailing closing braces
   */
  private extractBalancedBlock(code: string, startIndex: number): { body: string; endIndex: number } {
    let depth = 0;
    let start = -1;
    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') {
        if (depth === 0) start = i + 1;
        depth++;
      } else if (code[i] === '}') {
        depth--;
        if (depth === 0) {
          return { body: code.substring(start, i), endIndex: i };
        }
      }
    }
    return { body: code.substring(startIndex), endIndex: code.length };
  }

  /**
   * Transpiles standard Java code into clean asynchronous JavaScript.
   */
  private transpileJavaToJs(source: string): string {
    // 1. Remove package declarations and imports
    let code = source
      .replace(/package\s+[\w.]+;/g, '')
      .replace(/import\s+[\w.*]+;/g, '');

    // 2. Transform Scanner instantiations
    code = code.replace(/new\s+Scanner\([^)]*\)/g, 'new Scanner()');

    // 3. Transform Scanner method calls to await calls
    code = code.replace(/(\w+)\.nextLine\(\)/g, 'await $1.nextLine()');
    code = code.replace(/(\w+)\.nextInt\(\)/g, 'await $1.nextInt()');
    code = code.replace(/(\w+)\.nextDouble\(\)/g, 'await $1.nextDouble()');
    code = code.replace(/(\w+)\.nextFloat\(\)/g, 'await $1.nextDouble()');
    code = code.replace(/(\w+)\.nextLong\(\)/g, 'await $1.nextInt()');
    code = code.replace(/(\w+)\.nextBoolean\(\)/g, 'await $1.nextBoolean()');
    code = code.replace(/(\w+)\.next\(\)/g, 'await $1.next()');

    // 4. Transform Thread.sleep
    code = code.replace(/Thread\.sleep\((\d+)\)/g, 'await Thread.sleep($1)');

    // 5. Enhanced for-loop: for (Type x : list) -> for (let x of list)
    code = code.replace(/for\s*\(\s*(?:final\s+)?[\w<>\[\]]+\s+(\w+)\s*:\s*([^)]+)\)/g, 'for (let $1 of $2)');

    // 6. for (int i = 0; ...) -> for (let i = 0; ...)
    code = code.replace(/for\s*\(\s*(?:(?:int|long|double|float|short|byte|var)\s+)+/g, 'for (let ');

    // 7. Transform Java variable declarations into "let variableName ..."
    // Matches primitive types, library types, and ANY capitalized class identifier (e.g. User, Person, Game, MyClass, List<String>, int[], etc.)
    const knownTypes = 'int|long|short|byte|float|double|boolean|char|String|Scanner|Random|Integer|Double|Boolean|List|ArrayList|Map|HashMap|Set|HashSet|StringBuilder|StringBuffer|Object|var';
    const varDeclRegex = new RegExp(
      `(?:^|[;{}\\n])\\s*(?:(?:public|private|protected|static|final)\\s+)*(?:(?:${knownTypes})|[A-Z]\\w*(?:<[^>]+>)?)(?:\\[\\s*\\])*\\s+([a-zA-Z_]\\w*)\\s*([=;,])`,
      'g'
    );

    code = code.replace(varDeclRegex, (match, varName, separator) => {
      const prefix = match.substring(0, match.indexOf(varName));
      const leadingWhitespace = prefix.match(/^[\s;{}\n]*/)?.[0] || '';
      return `${leadingWhitespace}let ${varName} ${separator}`;
    });

    // 8. Arrays
    // int[] arr = { 1, 2, 3 }; -> let arr = [ 1, 2, 3 ];
    code = code.replace(/\[\s*\]\s*=\s*\{([^}]+)\}/g, ' = [$1]');
    code = code.replace(/new\s+(?:int|double|float|long|boolean|char|String)\[([^\]]+)\]/g, 'new Array($1).fill(0)');
    code = code.replace(/new\s+(?:int|double|float|long|boolean|char|String)\[\s*\]\s*\{([^}]+)\}/g, '[$1]');

    // 9. Exception catch blocks: catch (Exception e) -> catch (e)
    code = code.replace(/catch\s*\(\s*(?:final\s+)?[\w.]+\s+(\w+)\s*\)/g, 'catch ($1)');

    // 10. String methods:
    // .equals(...) -> === ...
    code = code.replace(/\.equals\(([^)]+)\)/g, ' === $1');
    code = code.replace(/\.equalsIgnoreCase\(([^)]+)\)/g, '.toLowerCase() === String($1).toLowerCase()');

    // 11. Labels
    code = code.replace(/([A-Z_]+):\s*while/g, '/* $1 */ while');

    // 12. Main Method & Class extraction
    // Look for public static void main
    const mainRegex = /public\s+static\s+(?:void|async\s+void)\s+main\s*\([^)]*\)\s*\{/;
    const mainIndex = code.search(mainRegex);

    if (mainIndex !== -1) {
      const block = this.extractBalancedBlock(code, mainIndex);
      const mainBody = block.body;

      // Extract static helper methods outside main
      const helperRegex = /(?:public|private|protected)?\s*static\s+(?:boolean|int|double|float|String|void|long|[A-Z]\w*)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
      let helpers = '';
      let match;

      while ((match = helperRegex.exec(code)) !== null) {
        const methodName = match[1];
        if (methodName !== 'main') {
          const rawParams = match[2];
          const cleanParams = rawParams
            .split(',')
            .map(p => p.trim().split(/\s+/).pop())
            .filter(Boolean)
            .join(', ');

          const methodBlock = this.extractBalancedBlock(code, match.index);
          helpers += `function ${methodName}(${cleanParams}) {\n${methodBlock.body}\n}\n\n`;
        }
      }

      return `${helpers}\n${mainBody}`;
    }

    // If no explicit main, return transformed body directly
    return code;
  }
}
