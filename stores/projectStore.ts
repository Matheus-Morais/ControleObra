import { Platform } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { Project } from '../types';

const STORAGE_KEY = 'project-store';

type PersistShape = { activeProject: Project | null; projects: Project[] };

/**
 * Leitura síncrona — só é possível na web (localStorage é síncrono).
 * No nativo (iOS/Android) o SecureStore é assíncrono, então a hidratação
 * acontece via `hydrate()` no boot (ver app/_layout.tsx).
 */
function readStorageSync(): PersistShape | null {
  try {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }
  } catch {}
  return null;
}

async function readStorageAsync(): Promise<PersistShape | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(STORAGE_KEY)
        : await SecureStore.getItemAsync(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistShape) : null;
  } catch {
    return null;
  }
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

const persisted = readStorageSync();

interface ProjectState {
  activeProject: Project | null;
  projects: Project[];
  /** true quando a hidratação inicial já rodou (na web é imediata). */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setActiveProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProject: persisted?.activeProject ?? null,
  projects: persisted?.projects ?? [],
  // Na web já hidratamos de forma síncrona no carregamento do módulo.
  hydrated: Platform.OS === 'web',
  hydrate: async () => {
    if (get().hydrated) return;
    const data = await readStorageAsync();
    // Só restaura se ainda ninguém definiu um projeto ativo neste boot,
    // evitando sobrescrever uma seleção feita antes da hidratação terminar.
    if (data && get().activeProject === null) {
      set({ activeProject: data.activeProject ?? null, projects: data.projects ?? [] });
    }
    set({ hydrated: true });
  },
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
    set({ activeProject: null, projects: [], hydrated: true });
  },
}));

useProjectStore.subscribe((state) => {
  // Não persiste antes de hidratar no nativo, para não gravar o estado vazio
  // inicial por cima do que está no SecureStore.
  if (!state.hydrated) return;
  writeStorage(state.activeProject, state.projects);
});
