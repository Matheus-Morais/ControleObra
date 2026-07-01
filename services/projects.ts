import { generateInviteCode } from '../utils/format';
import type { Profile, Project, ProjectMember } from '../types';
import { supabase } from './supabase';
import { ProjectMemberWithProfileSchema, ProjectSchema, validate } from './schemas';

interface ProjectMemberIdRow {
  project_id: string;
}

/** Nº de tentativas ao gerar o invite_code, cobrindo colisão de código único. */
const INVITE_CODE_MAX_ATTEMPTS = 5;

/** Detecta violação de unicidade (23505) especificamente no campo invite_code. */
function isInviteCodeCollision(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; details?: string };
  if (e.code !== '23505') return false;
  const haystack = `${e.message ?? ''} ${e.details ?? ''}`.toLowerCase();
  return haystack.includes('invite_code');
}

export async function createProject(name: string, userId: string): Promise<Project> {
  let project: Project | null = null;

  for (let attempt = 0; attempt < INVITE_CODE_MAX_ATTEMPTS; attempt++) {
    const inviteCode = generateInviteCode();

    const { data, error: projectError } = await supabase
      .from('projects')
      .insert({ name, created_by: userId, invite_code: inviteCode })
      .select()
      .single();

    if (!projectError) {
      project = validate(ProjectSchema, data, 'createProject');
      break;
    }

    // Colisão de código: gera outro e tenta de novo. Qualquer outro erro propaga.
    if (isInviteCodeCollision(projectError) && attempt < INVITE_CODE_MAX_ATTEMPTS - 1) {
      continue;
    }
    throw projectError;
  }

  if (!project) throw new Error('Projeto não retornado após criação');

  const { error: memberError } = await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: userId,
    role: 'owner',
  });

  if (memberError) throw memberError;

  return project;
}

export async function joinProject(inviteCode: string, userId: string): Promise<Project> {
  const { data, error: findError } = await supabase
    .rpc('find_project_by_invite_code', { code: inviteCode });

  const rawProject = Array.isArray(data) ? data[0] : data;

  if (findError || !rawProject) throw new Error('Código de convite inválido');

  const project = validate(ProjectSchema, rawProject, 'joinProject');

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

  return project;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const { data: members, error: membersError } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId);

  if (membersError) throw membersError;

  const ids = [...new Set((members ?? []).map((m: ProjectMemberIdRow) => m.project_id))];
  if (ids.length === 0) return [];

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .in('id', ids);

  if (projectsError) throw projectsError;
  return validate(ProjectSchema.array(), projects ?? [], 'user-projects');
}

export async function getProjectMembers(
  projectId: string
): Promise<(ProjectMember & { profiles: Profile | null })[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select('*, profiles(*)')
    .eq('project_id', projectId);

  if (error) throw error;
  return validate(ProjectMemberWithProfileSchema.array(), data ?? [], 'project-members');
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
  return validate(ProjectSchema, data, 'updateProject');
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}
