// Runner de migrations do ControleObra.
//
// Aplica, em ordem, os arquivos .sql de supabase/migrations/ ao banco apontado
// por SUPABASE_DB_URL. É idempotente: registra o que já rodou na tabela
// public._migrations e pula o que já foi aplicado. Cada migration roda dentro
// de uma transação (rollback automático em erro).
//
// Requisito: variável SUPABASE_DB_URL (Supabase Dashboard → Project Settings →
// Database → Connection string → "Direct connection" ou "Session", porta 5432 —
// NÃO use o transaction pooler 6543 para DDL). Pode ficar no .env (gitignored).
//
// Uso: npm run db:migrate

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Carrega .env (gitignored) sem depender de flag do Node, sem sobrescrever
// variáveis já presentes no ambiente.
function loadEnv() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

loadEnv();

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('\n[migrate] Faltou SUPABASE_DB_URL.');
  console.error('Pegue em: Supabase Dashboard → Project Settings → Database → Connection string (URI, porta 5432).');
  console.error('Coloque no .env (gitignored):  SUPABASE_DB_URL="postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres"\n');
  process.exit(1);
}

const migrationsDir = join(root, 'supabase', 'migrations');
if (!existsSync(migrationsDir)) {
  console.log('[migrate] Sem pasta supabase/migrations. Nada a fazer.');
  process.exit(0);
}
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  await client.query(
    'CREATE TABLE IF NOT EXISTS public._migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())'
  );
  const { rows } = await client.query('SELECT name FROM public._migrations');
  const applied = new Set(rows.map((r) => r.name));

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] já aplicada: ${file}`);
      continue;
    }
    console.log(`[migrate] aplicando: ${file} ...`);
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO public._migrations(name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      ran++;
      console.log(`[migrate] OK: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`[migrate] FALHOU: ${file}\n${err.message}`);
      process.exit(1);
    }
  }
  console.log(
    `[migrate] concluído — ${ran} nova(s), ${files.length - ran} já aplicada(s).`
  );
}

main()
  .catch((e) => {
    console.error('[migrate] erro:', e.message);
    process.exit(1);
  })
  .finally(() => client.end());
