import { generateInviteCode } from '../utils/format';
import type { Profile, Project, ProjectMember } from '../types';
import { supabase } from './supabase';

interface ProjectMemberRow {
  project_id: string;
  projects: Project | null;
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
  const SERVICE_TIMEOUT = 12000;

  const query = async () => {
    const { data, error } = await supabase
      .from('project_members')
      .select('project_id, projects(*)')
      .eq('user_id', userId);

    if (error) throw error;
    const rows = (data ?? []) as unknown as ProjectMemberRow[];
    return rows.map((pm) => pm.projects).filter((p): p is Project => p != null);
  };

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout ao carregar projetos')), SERVICE_TIMEOUT),
  );

  return Promise.race([query(), timeout]);
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
