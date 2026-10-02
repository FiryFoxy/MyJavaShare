import LZString from 'lz-string';
import { JavaProject } from '../types';

/**
 * Creates a standalone shareable URL hash with LZString-compressed project data.
 * This works 100% client-side with zero backend, perfect for GitHub Pages free tier!
 */
export function generateShareUrl(project: JavaProject): string {
  try {
    // Exclude large binary if it's over 1.5MB to prevent URL limit issues,
    // but include all code files, metadata, and instructions
    const projectToShare: Partial<JavaProject> = {
      id: project.id,
      title: project.title,
      description: project.description,
      author: project.author,
      createdAt: project.createdAt,
      type: project.type,
      category: project.category,
      instructions: project.instructions,
      files: project.files,
      tags: project.tags,
      binaryFilename: project.binaryFilename,
      jarManifest: project.jarManifest,
    };

    // If binary data is small (< 800 KB base64), we can embed it
    if (project.binaryBase64 && project.binaryBase64.length < 800000) {
      projectToShare.binaryBase64 = project.binaryBase64;
    }

    const json = JSON.stringify(projectToShare);
    const compressed = LZString.compressToEncodedURIComponent(json);
    
    // Construct URL with hash
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#share=${compressed}`;
  } catch (err) {
    console.error('Failed to generate share URL:', err);
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#project=${project.id}`;
  }
}

/**
 * Parses project data from URL hash or query params.
 */
export function parseProjectFromUrl(): JavaProject | string | null {
  const hash = window.location.hash;
  const searchParams = new URLSearchParams(window.location.search);

  // Check query param e.g. ?p=projectId
  const queryId = searchParams.get('p') || searchParams.get('project');
  if (queryId) {
    return queryId;
  }

  if (!hash) return null;

  // Check for compressed share payload
  if (hash.startsWith('#share=')) {
    const compressed = hash.substring(7);
    try {
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      if (json) {
        const parsed = JSON.parse(json) as JavaProject;
        return parsed;
      }
    } catch (err) {
      console.error('Failed to decompress share payload:', err);
    }
  }

  // Check for project ID hash e.g. #project=123 or #p=123
  if (hash.startsWith('#project=')) {
    return hash.substring(9);
  }
  if (hash.startsWith('#p=')) {
    return hash.substring(3);
  }

  return null;
}

/**
 * Generates a ready-to-run Windows .bat script for friends & family
 */
export function generateWindowsLauncherScript(project: JavaProject): string {
  const filename = project.binaryFilename || `${project.title.replace(/\s+/g, '')}.jar`;
  const mainJavaFile = project.files.find(f => f.isMain) || project.files[0];
  const className = mainJavaFile ? mainJavaFile.name.replace('.java', '') : 'Main';

  if (project.type === 'jar') {
    return `@echo off
echo =======================================================
echo Launching ${project.title}
echo Created by: ${project.author || 'Author'}
echo =======================================================
echo Checking Java installation...

where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Java is not installed or not in PATH!
    echo Please download and install free Java from:
    echo https://adoptium.net or https://www.oracle.com/java/technologies/downloads/
    echo.
    pause
    exit /b 1
)

echo Java found! Starting application...
echo.
java -jar "${filename}"
echo.
echo Program finished.
pause
`;
  }

  // Source code project
  return `@echo off
echo =======================================================
echo Compiling and Running ${project.title}
echo Created by: ${project.author || 'Author'}
echo =======================================================
echo Checking Java compiler (javac)...

where javac >nul 2>nul
if %errorlevel% neq 0 (
    echo [NOTE] javac compiler not found. Trying direct java runner...
    java "${className}.java"
    pause
    exit /b
)

echo Compiling Java source...
javac *.java
if %errorlevel% neq 0 (
    echo Compilation failed!
    pause
    exit /b 1
)

echo Running ${className}...
java ${className}
echo.
pause
`;
}

/**
 * Generates a ready-to-run Mac / Linux .sh script for friends & family
 */
export function generateUnixLauncherScript(project: JavaProject): string {
  const filename = project.binaryFilename || `${project.title.replace(/\s+/g, '')}.jar`;
  const mainJavaFile = project.files.find(f => f.isMain) || project.files[0];
  const className = mainJavaFile ? mainJavaFile.name.replace('.java', '') : 'Main';

  if (project.type === 'jar') {
    return `#!/bin/bash
# Launcher for ${project.title} by ${project.author}
echo "======================================================="
echo "Launching ${project.title}"
echo "======================================================="

if ! command -v java &> /dev/null; then
    echo "[ERROR] Java is not installed!"
    echo "On macOS: brew install openjdk"
    echo "On Ubuntu/Debian: sudo apt install default-jre"
    echo "Or visit: https://adoptium.net"
    exit 1
fi

java -jar "${filename}"
`;
  }

  return `#!/bin/bash
# Launcher for ${project.title} by ${project.author}
echo "======================================================="
echo "Running ${project.title}"
echo "======================================================="

if command -v javac &> /dev/null; then
    echo "Compiling Java files..."
    javac *.java
    java ${className}
else
    echo "Running with java..."
    java "${className}.java"
fi
`;
}
