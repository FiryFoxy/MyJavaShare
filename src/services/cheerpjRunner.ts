import JSZip from 'jszip';

declare global {
  interface Window {
    cheerpjInit?: (options?: any) => Promise<void>;
    cheerpjRunJar?: (path: string, ...args: string[]) => Promise<number>;
    cheerpjRunMain?: (mainClass: string, classPath: string, ...args: string[]) => Promise<number>;
    cheerpOSAddStringFile?: (path: string, data: Uint8Array | string) => void;
    cheerpjCreateDisplay?: (width: number, height: number, parentElement?: HTMLElement) => Promise<any>;
  }
}

let cheerpjInitialized = false;
let cheerpjInitPromise: Promise<void> | null = null;

export async function ensureCheerpJLoaded(): Promise<void> {
  if (cheerpjInitialized) return;
  if (cheerpjInitPromise) return cheerpjInitPromise;

  cheerpjInitPromise = (async () => {
    // 1. Check if loader script is already in document
    if (!window.cheerpjInit) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cjrtnc.leaningtech.com/3.0/cj3loader.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load CheerpJ WebAssembly JVM loader from CDN.'));
        document.head.appendChild(script);
      });
    }

    if (!window.cheerpjInit) {
      throw new Error('CheerpJ initialization function not found on window.');
    }

    // 2. Initialize the WebAssembly JVM
    await window.cheerpjInit({
      enableDebug: false,
    });

    cheerpjInitialized = true;
  })();

  return cheerpjInitPromise;
}

/**
 * Runs a Java .jar or .class file in the real WebAssembly OpenJDK JVM
 */
export async function runRealJavaJar({
  binaryBytes,
  isClassFile = false,
  className,
  displayContainer,
  onOutput,
}: {
  binaryBytes: Uint8Array;
  isClassFile?: boolean;
  className?: string;
  displayContainer?: HTMLElement | null;
  onOutput: (text: string, type: 'stdout' | 'stderr' | 'system') => void;
}): Promise<number> {
  onOutput('Starting WebAssembly OpenJDK Java Virtual Machine...\n', 'system');

  try {
    await ensureCheerpJLoaded();
    onOutput('OpenJDK JVM Initialized successfully.\n', 'system');

    let jarData: Uint8Array = binaryBytes;
    let mainClassName = className || 'Main';

    // If it is a raw .class file, package it into a valid JAR on the fly
    if (isClassFile) {
      onOutput(`Packaging compiled bytecode ${mainClassName}.class into executable JAR...\n`, 'system');
      const zip = new JSZip();
      zip.file(
        'META-INF/MANIFEST.MF',
        `Manifest-Version: 1.0\nCreated-By: JavaDrop WebAssembly Runner\nMain-Class: ${mainClassName}\n\n`
      );
      zip.file(`${mainClassName}.class`, binaryBytes);
      jarData = await zip.generateAsync({ type: 'uint8array' });
    }

    // Mount JAR into CheerpJ virtual in-memory filesystem (/str/)
    const vfsPath = `/str/app_${Date.now()}.jar`;
    if (window.cheerpOSAddStringFile) {
      window.cheerpOSAddStringFile(vfsPath, jarData);
    } else {
      throw new Error('CheerpJ Virtual File System not ready.');
    }

    // Mount graphical display if graphical window (Swing / AWT)
    if (displayContainer && window.cheerpjCreateDisplay) {
      try {
        await window.cheerpjCreateDisplay(-1, -1, displayContainer);
      } catch (dispErr) {
        console.warn('Display mount info:', dispErr);
      }
    }

    // Hook console.log to intercept real System.out from JVM
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      onOutput(text + '\n', 'stdout');
    };

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      onOutput(text + '\n', 'stderr');
    };

    onOutput(`Executing real Java application (${jarData.byteLength} bytes)...\n\n`, 'system');

    let exitCode = 0;
    if (window.cheerpjRunJar) {
      exitCode = await window.cheerpjRunJar(vfsPath);
    } else if (window.cheerpjRunMain) {
      exitCode = await window.cheerpjRunMain(mainClassName, vfsPath);
    } else {
      throw new Error('CheerpJ runner function not available.');
    }

    // Restore original console
    console.log = originalLog;
    console.error = originalError;

    onOutput(`\n[Process completed with exit code ${exitCode}]\n`, 'system');
    return exitCode;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    onOutput(`\n[JVM Error]: ${errorMsg}\n`, 'stderr');
    return 1;
  }
}
