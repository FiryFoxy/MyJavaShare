import { JavaProject } from '../types';

const STORAGE_KEY = 'javadrop_user_projects_v2';

export function getStoredProjects(): JavaProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const projects = JSON.parse(raw) as JavaProject[];
    return projects;
  } catch (err) {
    console.error('Failed to load projects from localStorage:', err);
    return [];
  }
}

/**
 * Fetches projects stored permanently in the GitHub repository (public/projects/projects.json)
 */
export async function fetchRepositoryProjects(): Promise<JavaProject[]> {
  try {
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const res = await fetch(`${cleanBase}projects/projects.json?t=${Date.now()}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map(p => ({
        ...p,
        isRepositoryProtected: true,
      }));
    }
    return [];
  } catch (err) {
    console.warn('Could not fetch repository projects:', err);
    return [];
  }
}

export function saveProject(project: JavaProject): void {
  const existing = getStoredProjects();
  const index = existing.findIndex(p => p.id === project.id);
  let updated: JavaProject[];

  if (index >= 0) {
    updated = [...existing];
    updated[index] = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
  } else {
    updated = [
      {
        ...project,
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...existing,
    ];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

export function deleteProject(id: string): { success: boolean; error?: string } {
  const existing = getStoredProjects();
  const target = existing.find(p => p.id === id);

  if (target?.isRepositoryProtected) {
    return {
      success: false,
      error: 'This project is stored in your GitHub repository folder. Only the repository owner can remove it by deleting it from GitHub.',
    };
  }

  const updated = existing.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return { success: true };
}

export function getProjectById(id: string): JavaProject | undefined {
  const projects = getStoredProjects();
  return projects.find(p => p.id === id);
}

export function exportAllProjectsJson(): string {
  const projects = getStoredProjects();
  return JSON.stringify(projects, null, 2);
}

/**
 * Downloads the projects.json to place into public/projects/projects.json for git commit
 */
export function downloadRepositoryCatalog(projects: JavaProject[]): void {
  const jsonStr = JSON.stringify(projects, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projects.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
