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

export function deleteProject(id: string): void {
  const existing = getStoredProjects();
  const updated = existing.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getProjectById(id: string): JavaProject | undefined {
  const projects = getStoredProjects();
  return projects.find(p => p.id === id);
}

export function exportAllProjectsJson(): string {
  const projects = getStoredProjects();
  return JSON.stringify(projects, null, 2);
}

export function importProjectsFromJson(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error('Imported data must be an array of projects.');
    }
    const existing = getStoredProjects();
    const existingIds = new Set(existing.map(p => p.id));
    
    const merged = [...existing];
    let addedCount = 0;

    for (const proj of parsed) {
      if (proj && proj.id && proj.title) {
        if (!existingIds.has(proj.id)) {
          merged.push(proj);
          addedCount++;
        }
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { success: true, count: addedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown parsing error';
    return { success: false, count: 0, error: msg };
  }
}
