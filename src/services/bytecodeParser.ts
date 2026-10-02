import JSZip from 'jszip';
import { DisassembledClass, JarManifest } from '../types';

const JAVA_VERSIONS: Record<number, string> = {
  45: 'Java 1.1',
  46: 'Java 1.2',
  47: 'Java 1.3',
  48: 'Java 1.4',
  49: 'Java 5',
  50: 'Java 6',
  51: 'Java 7',
  52: 'Java 8',
  53: 'Java 9',
  54: 'Java 10',
  55: 'Java 11 (LTS)',
  56: 'Java 12',
  57: 'Java 13',
  58: 'Java 14',
  59: 'Java 15',
  60: 'Java 16',
  61: 'Java 17 (LTS)',
  62: 'Java 18',
  63: 'Java 19',
  64: 'Java 20',
  65: 'Java 21 (LTS)',
  66: 'Java 22',
  67: 'Java 23',
  68: 'Java 24',
};

const OPCODES: Record<number, string> = {
  0x00: 'nop',
  0x01: 'aconst_null',
  0x02: 'iconst_m1',
  0x03: 'iconst_0',
  0x04: 'iconst_1',
  0x05: 'iconst_2',
  0x06: 'iconst_3',
  0x07: 'iconst_4',
  0x08: 'iconst_5',
  0x09: 'lconst_0',
  0x0a: 'lconst_1',
  0x0b: 'fconst_0',
  0x0c: 'fconst_1',
  0x10: 'bipush',
  0x11: 'sipush',
  0x12: 'ldc',
  0x15: 'iload',
  0x19: 'aload',
  0x1a: 'iload_0',
  0x1b: 'iload_1',
  0x1c: 'iload_2',
  0x1d: 'iload_3',
  0x2a: 'aload_0',
  0x2b: 'aload_1',
  0x2c: 'aload_2',
  0x2d: 'aload_3',
  0x36: 'istore',
  0x3a: 'astore',
  0x3b: 'istore_0',
  0x3c: 'istore_1',
  0x3d: 'istore_2',
  0x3e: 'istore_3',
  0x4b: 'astore_0',
  0x4c: 'astore_1',
  0x4d: 'astore_2',
  0x4e: 'astore_3',
  0x60: 'iadd',
  0x64: 'isub',
  0x68: 'imul',
  0x6c: 'idiv',
  0x70: 'irem',
  0x84: 'iinc',
  0x99: 'ifeq',
  0x9a: 'ifne',
  0x9b: 'iflt',
  0x9c: 'ifge',
  0x9d: 'ifgt',
  0x9e: 'ifle',
  0xa7: 'goto',
  0xac: 'ireturn',
  0xb0: 'areturn',
  0xb1: 'return',
  0xb2: 'getstatic',
  0xb3: 'putstatic',
  0xb4: 'getfield',
  0xb5: 'putfield',
  0xb6: 'invokevirtual',
  0xb7: 'invokespecial',
  0xb8: 'invokestatic',
  0xb9: 'invokeinterface',
  0xbb: 'new',
  0xbc: 'newarray',
  0xbd: 'anewarray',
};

class BinaryReader {
  private view: DataView;
  private offset = 0;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  getOffset() {
    return this.offset;
  }

  readU1(): number {
    const val = this.view.getUint8(this.offset);
    this.offset += 1;
    return val;
  }

  readU2(): number {
    const val = this.view.getUint16(this.offset);
    this.offset += 2;
    return val;
  }

  readU4(): number {
    const val = this.view.getUint32(this.offset);
    this.offset += 4;
    return val;
  }

  readBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, length);
    this.offset += length;
    return bytes;
  }

  readUtf8(length: number): string {
    const bytes = this.readBytes(length);
    return new TextDecoder('utf-8').decode(bytes);
  }

  skip(count: number) {
    this.offset += count;
  }
}

/**
 * Parses raw Java .class bytecode array buffer into structured info and decompiled representation
 */
export function parseClassFile(buffer: ArrayBuffer): DisassembledClass {
  const reader = new BinaryReader(buffer);

  // Check magic number 0xCAFEBABE
  const magic = reader.readU4();
  if (magic !== 0xcafebabe) {
    throw new Error('Not a valid Java .class file (magic 0xCAFEBABE missing).');
  }

  const minor = reader.readU2();
  const major = reader.readU2();
  const javaVersionName = JAVA_VERSIONS[major] || `Java bytecode v${major}.${minor}`;

  // Constant pool
  const cpCount = reader.readU2();
  const constantPool: any[] = [null]; // 1-indexed

  for (let i = 1; i < cpCount; i++) {
    const tag = reader.readU1();
    switch (tag) {
      case 1: { // Utf8
        const len = reader.readU2();
        const str = reader.readUtf8(len);
        constantPool.push({ tag: 1, value: str });
        break;
      }
      case 3: // Integer
        constantPool.push({ tag: 3, value: reader.readU4() });
        break;
      case 4: // Float
        constantPool.push({ tag: 4, value: reader.readU4() });
        break;
      case 5: // Long (takes 2 slots)
        reader.skip(8);
        constantPool.push({ tag: 5, value: 'long' });
        constantPool.push(null);
        i++;
        break;
      case 6: // Double (takes 2 slots)
        reader.skip(8);
        constantPool.push({ tag: 6, value: 'double' });
        constantPool.push(null);
        i++;
        break;
      case 7: // Class
        constantPool.push({ tag: 7, nameIndex: reader.readU2() });
        break;
      case 8: // String
        constantPool.push({ tag: 8, stringIndex: reader.readU2() });
        break;
      case 9: // Fieldref
      case 10: // Methodref
      case 11: // InterfaceMethodref
        constantPool.push({
          tag,
          classIndex: reader.readU2(),
          nameAndTypeIndex: reader.readU2(),
        });
        break;
      case 12: // NameAndType
        constantPool.push({
          tag: 12,
          nameIndex: reader.readU2(),
          descriptorIndex: reader.readU2(),
        });
        break;
      case 15: // MethodHandle
        reader.skip(3);
        constantPool.push({ tag: 15 });
        break;
      case 16: // MethodType
        reader.skip(2);
        constantPool.push({ tag: 16 });
        break;
      case 18: // InvokeDynamic
        reader.skip(4);
        constantPool.push({ tag: 18 });
        break;
      default:
        constantPool.push({ tag });
        break;
    }
  }

  const getUtf8 = (idx: number): string => {
    const item = constantPool[idx];
    if (item && item.tag === 1) return item.value;
    return `[idx:${idx}]`;
  };

  const getClassName = (idx: number): string => {
    const item = constantPool[idx];
    if (item && item.tag === 7) return getUtf8(item.nameIndex);
    return `[class:${idx}]`;
  };

  const accessFlags = reader.readU2();
  const thisClassIdx = reader.readU2();
  const superClassIdx = reader.readU2();

  const className = getClassName(thisClassIdx).replace(/\//g, '.');
  const superClassName = superClassIdx ? getClassName(superClassIdx).replace(/\//g, '.') : 'java.lang.Object';

  // Interfaces
  const interfacesCount = reader.readU2();
  const interfaces: string[] = [];
  for (let i = 0; i < interfacesCount; i++) {
    interfaces.push(getClassName(reader.readU2()).replace(/\//g, '.'));
  }

  // Fields
  const fieldsCount = reader.readU2();
  const fields: DisassembledClass['fields'] = [];
  for (let i = 0; i < fieldsCount; i++) {
    const flags = reader.readU2();
    const nameIdx = reader.readU2();
    const descIdx = reader.readU2();
    const attrCount = reader.readU2();
    for (let a = 0; a < attrCount; a++) {
      reader.skip(2); // attr name
      const len = reader.readU4();
      reader.skip(len);
    }
    fields.push({
      name: getUtf8(nameIdx),
      type: parseDescriptorType(getUtf8(descIdx)),
      accessFlags: parseAccessFlags(flags, false),
    });
  }

  // Methods
  const methodsCount = reader.readU2();
  const methods: DisassembledClass['methods'] = [];
  for (let i = 0; i < methodsCount; i++) {
    const flags = reader.readU2();
    const nameIdx = reader.readU2();
    const descIdx = reader.readU2();
    const attrCount = reader.readU2();

    const methodName = getUtf8(nameIdx);
    const methodDesc = getUtf8(descIdx);
    const disassembly: string[] = [];

    for (let a = 0; a < attrCount; a++) {
      const attrNameIdx = reader.readU2();
      const attrLen = reader.readU4();
      const attrName = getUtf8(attrNameIdx);

      if (attrName === 'Code') {
        const maxStack = reader.readU2();
        const maxLocals = reader.readU2();
        const codeLength = reader.readU4();
        const codeBytes = reader.readBytes(codeLength);

        // Simple bytecode disassembly
        for (let b = 0; b < codeBytes.length; b++) {
          const opcode = codeBytes[b];
          const opName = OPCODES[opcode] || `0x${opcode.toString(16).padStart(2, '0')}`;
          disassembly.push(`${b.toString().padStart(4, ' ')}: ${opName}`);
        }

        // Skip exception table & sub-attributes
        const exCount = reader.readU2();
        reader.skip(exCount * 8);
        const subAttrCount = reader.readU2();
        for (let s = 0; s < subAttrCount; s++) {
          reader.skip(2);
          const subLen = reader.readU4();
          reader.skip(subLen);
        }
      } else {
        reader.skip(attrLen);
      }
    }

    methods.push({
      name: methodName,
      descriptor: methodDesc,
      accessFlags: parseAccessFlags(flags, true),
      disassembly: disassembly.slice(0, 50), // keep top 50 opcodes
    });
  }

  // Generate clean pseudo-Java code representation
  let decompiled = `// Decompiled from Java Bytecode (${javaVersionName})\n`;
  decompiled += `// Source Class: ${className}\n\n`;
  decompiled += `public class ${className.split('.').pop()} ${superClassName !== 'java.lang.Object' ? `extends ${superClassName} ` : ''}`;
  if (interfaces.length > 0) {
    decompiled += `implements ${interfaces.join(', ')} `;
  }
  decompiled += `{\n`;

  // Print fields
  if (fields.length > 0) {
    decompiled += `    // Fields\n`;
    for (const f of fields) {
      decompiled += `    ${f.accessFlags.join(' ')} ${f.type} ${f.name};\n`;
    }
    decompiled += `\n`;
  }

  // Print methods
  for (const m of methods) {
    const isConstructor = m.name === '<init>';
    const isStaticInit = m.name === '<clinit>';
    const name = isConstructor ? className.split('.').pop() : isStaticInit ? 'static' : m.name;
    const { returnType, params } = parseMethodDescriptor(m.descriptor);

    if (isStaticInit) {
      decompiled += `    static {\n        // <class initializer>\n    }\n\n`;
    } else {
      const sig = isConstructor
        ? `${m.accessFlags.join(' ')} ${name}(${params.join(', ')})`
        : `${m.accessFlags.join(' ')} ${returnType} ${name}(${params.join(', ')})`;
      decompiled += `    ${sig.trim()} {\n`;
      if (m.disassembly && m.disassembly.length > 0) {
        decompiled += `        // Bytecode instructions (${m.disassembly.length} steps):\n`;
        for (const op of m.disassembly.slice(0, 15)) {
          decompiled += `        // ${op}\n`;
        }
        if (m.disassembly.length > 15) {
          decompiled += `        // ... (${m.disassembly.length - 15} more instructions)\n`;
        }
      }
      decompiled += `    }\n\n`;
    }
  }

  decompiled += `}\n`;

  return {
    className,
    superClassName,
    interfaces,
    majorVersion: major,
    minorVersion: minor,
    javaVersionName,
    fields,
    methods,
    decompiledCode: decompiled,
  };
}

function parseAccessFlags(flags: number, isMethod: boolean): string[] {
  const result: string[] = [];
  if (flags & 0x0001) result.push('public');
  if (flags & 0x0002) result.push('private');
  if (flags & 0x0004) result.push('protected');
  if (flags & 0x0008) result.push('static');
  if (flags & 0x0010) result.push('final');
  if (flags & 0x0020 && !isMethod) result.push('super');
  if (flags & 0x0400) result.push('abstract');
  return result;
}

function parseDescriptorType(desc: string): string {
  if (desc === 'V') return 'void';
  if (desc === 'I') return 'int';
  if (desc === 'Z') return 'boolean';
  if (desc === 'B') return 'byte';
  if (desc === 'C') return 'char';
  if (desc === 'S') return 'short';
  if (desc === 'J') return 'long';
  if (desc === 'F') return 'float';
  if (desc === 'D') return 'double';
  if (desc.startsWith('L') && desc.endsWith(';')) {
    const raw = desc.substring(1, desc.length - 1).replace(/\//g, '.');
    return raw.split('.').pop() || raw;
  }
  if (desc.startsWith('[')) {
    return parseDescriptorType(desc.substring(1)) + '[]';
  }
  return desc;
}

function parseMethodDescriptor(desc: string): { returnType: string; params: string[] } {
  const match = desc.match(/^\((.*)\)(.*)$/);
  if (!match) return { returnType: 'void', params: [] };

  const paramString = match[1];
  const returnString = match[2];

  const returnType = parseDescriptorType(returnString);
  const params: string[] = [];

  let i = 0;
  let paramIdx = 1;
  while (i < paramString.length) {
    const ch = paramString[i];
    if ('IZBCSJF'.includes(ch)) {
      params.push(`${parseDescriptorType(ch)} arg${paramIdx++}`);
      i++;
    } else if (ch === 'L') {
      const end = paramString.indexOf(';', i);
      if (end !== -1) {
        const typeStr = paramString.substring(i, end + 1);
        params.push(`${parseDescriptorType(typeStr)} arg${paramIdx++}`);
        i = end + 1;
      } else {
        i++;
      }
    } else if (ch === '[') {
      let arrayDepth = 0;
      while (paramString[i] === '[') {
        arrayDepth++;
        i++;
      }
      if (paramString[i] === 'L') {
        const end = paramString.indexOf(';', i);
        const typeStr = '['.repeat(arrayDepth) + paramString.substring(i, end + 1);
        params.push(`${parseDescriptorType(typeStr)} arg${paramIdx++}`);
        i = end + 1;
      } else {
        const typeStr = '['.repeat(arrayDepth) + paramString[i];
        params.push(`${parseDescriptorType(typeStr)} arg${paramIdx++}`);
        i++;
      }
    } else {
      i++;
    }
  }

  return { returnType, params };
}

/**
 * Extracts and inspects a .jar archive using JSZip
 */
export async function parseJarArchive(buffer: ArrayBuffer): Promise<{
  manifest: JarManifest;
  entries: string[];
  decompiledClasses: DisassembledClass[];
  sourceFiles: { name: string; content: string }[];
}> {
  const zip = await JSZip.loadAsync(buffer);
  const entries: string[] = Object.keys(zip.files);
  const manifest: JarManifest = { entries };
  const decompiledClasses: DisassembledClass[] = [];
  const sourceFiles: { name: string; content: string }[] = [];

  // 1. Read META-INF/MANIFEST.MF
  const manifestFile = zip.file('META-INF/MANIFEST.MF') || zip.file('meta-inf/manifest.mf');
  if (manifestFile) {
    const text = await manifestFile.async('text');
    const lines = text.split('\n');
    for (const line of lines) {
      const [key, ...vals] = line.split(':');
      if (key && vals.length > 0) {
        const k = key.trim().toLowerCase();
        const v = vals.join(':').trim();
        if (k === 'main-class') manifest.mainClass = v;
        if (k === 'manifest-version') manifest.version = v;
        if (k === 'created-by') manifest.vendor = v;
      }
    }
  }

  // 2. Read any packaged .java source files
  for (const entry of entries) {
    if (entry.endsWith('.java') && !entry.startsWith('__MACOSX')) {
      const file = zip.file(entry);
      if (file) {
        const content = await file.async('text');
        sourceFiles.push({ name: entry.split('/').pop() || entry, content });
      }
    }
  }

  // 3. Inspect top .class files (up to 5 to avoid slowdown)
  const classEntries = entries.filter(e => e.endsWith('.class') && !e.includes('$') && !e.startsWith('__MACOSX'));
  for (const entry of classEntries.slice(0, 5)) {
    try {
      const file = zip.file(entry);
      if (file) {
        const ab = await file.async('arraybuffer');
        const parsed = parseClassFile(ab);
        decompiledClasses.push(parsed);
      }
    } catch (e) {
      console.warn('Could not parse class file in jar:', entry, e);
    }
  }

  return { manifest, entries, decompiledClasses, sourceFiles };
}
