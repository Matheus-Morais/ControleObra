import { generateInviteCode } from '../utils/format';
import type { Profile, Project, ProjectMember } from '../types';
import { supabase } from './supabase';

interface ProjectMemberIdRow {
  project_id: string;
}

export async function createProject(name: string, userId: string): Promise<Project> {
  const inviteCode = generateInviteCode();

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({ name, created_by: userId, invite_code: inviteCode })
    .select()
    .single();

  if (projectError) throw projectError;
  if (!project) throw new Error('Projeto não retornado após criação');

  const { error: memberError } = await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: userId,
    role: 'owner',
  });

  if (memberError) throw memberError;

  return project as Project;
}

export async function joinProject(inviteCode: string, userId: string): Promise<Project> {
  const { data, error: findError } = await supabase
    .rpc('find_project_by_invite_code', { code: inviteCode });

  const project = Array.isArray(data) ? data[0] : data;

  if (findError || !project) throw new Error('Código de convite inválido');

  const { error: joinError } = await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: userId,
    role: 'member',
  });

  if (joinError) {
    if (joinError.code === '23505') {
      throw new Error('Você já é membro deste projeto');
    }
    throw joinError;
  }

  return project as Project;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const { data: members, error: membersError } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId);

  if (membersError) throw membersError;

  const ids = [...new Set((members ?? []).map((m) => (m as ProjectMemberIdRow).project_id))];
  if (ids.length === 0) return [];

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .in('id', ids);

  if (projectsError) throw projectsError;
  return (projects ?? []) as Project[];
}

export async function getProjectMembers(
  projectId: string
): Promise<(ProjectMember & { profiles: Profile | null })[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select('*, profiles(*)')
    .eq('project_id', projectId);

  if (error) throw error;
  return (data ?? []) as (ProjectMember & { profiles: Profile | null })[];
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'total_budget'>>
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}
