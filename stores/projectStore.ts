import { Platform } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { Project } from '../types';

const STORAGE_KEY = 'project-store';

function readStorage(): { activeProject: Project | null; projects: Project[] } | null {
  try {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }
  } catch {}
  return null;
}

function writeStorage(activeProject: Project | null, projects: Project[]) {
  try {
    const data = JSON.stringify({ activeProject, projects });
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY, data);
    } else {
      SecureStore.setItemAsync(STORAGE_KEY, data);
    }
  } catch {}
}

function clearStorage() {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  } catch {}
}

const persisted = readStorage();

interface ProjectState {
  activeProject: Project | null;
  projects: Project[];
  setActiveProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  activeProject: persisted?.activeProject ?? null,
  projects: persisted?.projects ?? [],
  setActiveProject: (activeProject) => set({ activeProject }),
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  removeProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      activeProject:
        state.activeProject?.id === projectId ? null : state.activeProject,
    })),
  updateProject: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
      activeProject:
        state.activeProject?.id === projectId
          ? { ...state.activeProject, ...updates }
          : state.activeProject,
    })),
  reset: () => {
    clearStorage();
    set({ activeProject: null, projects: [] });
  },
}));

useProjectStore.subscribe((state) => {
  writeStorage(state.activeProject, state.projects);
});
