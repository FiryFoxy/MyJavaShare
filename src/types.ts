export type ProjectType = 'code' | 'jar' | 'class';

export type ProjectCategory = 'game' | 'utility' | 'console' | 'graphics' | 'educational';

export interface JavaFile {
  name: string;
  content: string;
  isMain?: boolean;
}

export interface JarManifest {
  mainClass?: string;
  version?: string;
  entries?: string[];
  vendor?: string;
}

export interface JavaProject {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  type: ProjectType;
  category: ProjectCategory;
  instructions: string; // Project instructions
  files: JavaFile[];
  binaryBase64?: string; // For .jar or .class files
  binaryFilename?: string; // e.g. "MyGame.jar" or "Calculator.class"
  jarManifest?: JarManifest;
  tags: string[];
  isSample?: boolean;
  isRepositoryProtected?: boolean; // Stored in GitHub repository folder (only owner can delete via Git)
}

export interface ExecutionLog {
  id: string;
  type: 'stdout' | 'stderr' | 'system' | 'input';
  text: string;
  timestamp: number;
}

export interface DisassembledClass {
  className: string;
  superClassName: string;
  interfaces: string[];
  majorVersion: number;
  minorVersion: number;
  javaVersionName: string;
  fields: { name: string; type: string; accessFlags: string[] }[];
  methods: {
    name: string;
    descriptor: string;
    accessFlags: string[];
    disassembly?: string[];
  }[];
  decompiledCode: string;
}
