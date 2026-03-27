import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserProjects,
  createProject,
  joinProject,
  getProjectMembers,
  updateProject,
  deleteProject,
} from '../services/projects';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import type { Project } from '../types';

type ProjectUpdates = Partial<Pick<Project, 'name' | 'description' | 'total_budget'>>;

export function useProjects() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: () => getUserProjects(user!.id),
    enabled: !!user,
  });
}

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => getProjectMembers(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const addProject = useProjectStore((s) => s.addProject);

  return useMutation({
    mutationFn: (name: string) => createProject(name, user!.id),
    onSuccess: (project) => {
      addProject(project);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useJoinProject() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const addProject = useProjectStore((s) => s.addProject);

  return useMutation({
    mutationFn: (inviteCode: string) => joinProject(inviteCode, user!.id),
    onSuccess: (project) => {
      addProject(project);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const updateProjectStore = useProjectStore((s) => s.updateProject);

  return useMutation({
    mutationFn: ({ projectId, updates }: { projectId: string; updates: ProjectUpdates }) =>
      updateProject(projectId, updates),
    onSuccess: (data) => {
      updateProjectStore(data.id, data);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const removeProject = useProjectStore((s) => s.removeProject);

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: (_, projectId) => {
      removeProject(projectId);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
