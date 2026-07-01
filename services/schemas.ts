import { z } from 'zod';

/**
 * Schemas de fronteira (Zod) para validar as respostas do Supabase antes de
 * entregá-las às camadas superiores. Objetivo: falhar cedo, com erro claro,
 * quando o backend devolver algo malformado — no lugar de `as Item` cego.
 *
 * Campos NUMERIC podem chegar como número ou string (dependendo do driver),
 * por isso usamos `z.coerce.number()`. `nullable()` preserva os `null` do banco.
 */

const uuid = z.string();
const timestamp = z.string();
const num = z.coerce.number();

export const ProfileSchema = z.object({
  id: uuid,
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: timestamp,
  updated_at: timestamp,
});

export const ProjectSchema = z.object({
  id: uuid,
  name: z.string(),
  description: z.string().nullable(),
  created_by: uuid,
  invite_code: z.string(),
  total_budget: num,
  created_at: timestamp,
  updated_at: timestamp,
});

export const ProjectMemberSchema = z.object({
  id: uuid,
  project_id: uuid,
  user_id: uuid,
  role: z.enum(['owner', 'member']),
  joined_at: timestamp,
});

export const RoomSchema = z.object({
  id: uuid,
  project_id: uuid,
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  sort_order: num,
  created_at: timestamp,
});

export const ItemSchema = z.object({
  id: uuid,
  room_id: uuid,
  project_id: uuid,
  category: z.string(),
  name: z.string(),
  status: z.enum(['researching', 'decided', 'purchased', 'installed']),
  quantity: num,
  budget: num,
  actual_price: num.nullable(),
  notes: z.string().nullable(),
  updated_by: uuid.nullable(),
  updated_at: timestamp,
  created_at: timestamp,
});

export const ItemOptionSchema = z.object({
  id: uuid,
  item_id: uuid,
  project_id: uuid.nullable().optional(),
  model_name: z.string(),
  brand: z.string().nullable(),
  price: num.nullable(),
  store: z.string().nullable(),
  url: z.string().nullable(),
  notes: z.string().nullable(),
  rating: num.nullable(),
  is_chosen: z.boolean(),
  created_by: uuid.nullable(),
  created_at: timestamp,
});

export const ItemOptionPhotoSchema = z.object({
  id: uuid,
  item_option_id: uuid,
  storage_url: z.string(),
  sort_order: num,
  created_at: timestamp,
});

export const ItemCommentSchema = z.object({
  id: uuid,
  item_id: uuid,
  project_id: uuid.nullable().optional(),
  user_id: uuid,
  message: z.string(),
  created_at: timestamp,
});

export const TransactionSchema = z.object({
  id: uuid,
  project_id: uuid,
  item_id: uuid.nullable(),
  amount: num,
  description: z.string().nullable(),
  paid_at: timestamp,
  notes: z.string().nullable(),
  created_by: uuid.nullable(),
  created_at: timestamp,
});

// Schemas compostos (com relações).
export const ItemOptionWithPhotosSchema = ItemOptionSchema.extend({
  item_option_photos: ItemOptionPhotoSchema.array(),
});

export const ItemWithOptionsSchema = ItemSchema.extend({
  item_options: ItemOptionWithPhotosSchema.array(),
});

export const ProjectMemberWithProfileSchema = ProjectMemberSchema.extend({
  profiles: ProfileSchema.nullable(),
});

export const AmountRowSchema = z.object({ amount: num });

/**
 * Valida `data` contra `schema`. Em caso de falha, lança um erro com um
 * resumo legível do que não bateu (útil para diagnosticar drift de schema).
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const summary = result.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join('.') || '(raiz)'}: ${i.message}`)
      .join('; ');
    throw new Error(`Resposta inesperada do servidor (${label}): ${summary}`);
  }
  return result.data;
}
