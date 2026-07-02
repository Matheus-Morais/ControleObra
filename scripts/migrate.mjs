// Runner de migrations do ControleObra.
//
// Aplica, em ordem, os arquivos .sql de supabase/migrations/ ao projeto Supabase.
// É idempotente: registra o que já rodou na tabela public._migrations e pula o
// que já foi aplicado.
//
// Suporta duas formas de conexão (a primeira disponível é usada):
//   1) SUPABASE_ACCESS_TOKEN  → Management API (recomendado; token pessoal em
//      https://supabase.com/dashboard/account/tokens). O ref é lido de
//      SUPABASE_PROJECT_REF ou derivado de EXPO_PUBLIC_SUPABASE_URL.
//   2) SUPABASE_DB_URL        → conexão direta via pg (porta 5432, não o pooler 6543).
//
// Uso: npm run db:migrate   (lê variáveis do .env, que é gitignored)

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Carrega .env sem depender de flag do Node, sem sobrescrever o ambiente.
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

function migrationFiles() {
  const dir = join(root, 'supabase', 'migrations');
  if (!existsSync(dir)) return { dir, files: [] };
  return {
    dir,
    files: readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort(),
  };
}

const CREATE_TABLE =
  'CREATE TABLE IF NOT EXISTS public._migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())';

// --- Backend: Management API (via access token) -----------------------------
async function runViaManagementApi(token) {
  const ref =
    process.env.SUPABASE_PROJECT_REF ||
    (() => {
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      try {
        return url ? new URL(url).hostname.split('.')[0] : null;
      } catch {
        return null;
      }
    })();
  if (!ref) {
    console.error('[migrate] Não foi possível determinar o project ref. Defina SUPABASE_PROJECT_REF ou EXPO_PUBLIC_SUPABASE_URL no .env.');
    process.exit(1);
  }

  const endpoint = `https://api.supabase.com/v1/projects/${ref}/database/query`;
  async function query(sql) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = text;
      try {
        msg = JSON.parse(text).message ?? text;
      } catch {}
      throw new Error(`HTTP ${res.status}: ${msg}`);
    }
    return text ? JSON.parse(text) : [];
  }

  console.log(`[migrate] backend: Management API (projeto ${ref})`);
  await query(CREATE_TABLE);
  const appliedRows = await query('SELECT name FROM public._migrations');
  const applied = new Set((appliedRows ?? []).map((r) => r.name));

  const { files } = migrationFiles();
  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] já aplicada: ${file}`);
      continue;
    }
    console.log(`[migrate] aplicando: ${file} ...`);
    const sql = readFileSync(join(root, 'supabase', 'migrations', file), 'utf8');
    await query(sql);
    await query(`INSERT INTO public._migrations(name) VALUES ('${file}')`);
    ran++;
    console.log(`[migrate] OK: ${file}`);
  }
  console.log(`[migrate] concluído — ${ran} nova(s), ${files.length - ran} já aplicada(s).`);
}

// --- Backend: conexão direta (via pg) ---------------------------------------
async function runViaPg(connectionString) {
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('[migrate] backend: conexão direta (pg)');
  try {
    await client.query(CREATE_TABLE);
    const { rows } = await client.query('SELECT name FROM public._migrations');
    const applied = new Set(rows.map((r) => r.name));
    const { files } = migrationFiles();
    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] já aplicada: ${file}`);
        continue;
      }
      console.log(`[migrate] aplicando: ${file} ...`);
      const sql = readFileSync(join(root, 'supabase', 'migrations', file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO public._migrations(name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        ran++;
        console.log(`[migrate] OK: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw new Error(`${file}: ${err.message}`);
      }
    }
    console.log(`[migrate] concluído — ${ran} nova(s), ${files.length - ran} já aplicada(s).`);
  } finally {
    await client.end();
  }
}

async function main() {
  const { files } = migrationFiles();
  if (files.length === 0) {
    console.log('[migrate] Nenhuma migration em supabase/migrations. Nada a fazer.');
    return;
  }
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    await runViaManagementApi(process.env.SUPABASE_ACCESS_TOKEN);
  } else if (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL) {
    await runViaPg(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL);
  } else {
    console.error('\n[migrate] Faltou credencial. Defina no .env:');
    console.error('  SUPABASE_ACCESS_TOKEN=...   (recomendado — token em supabase.com/dashboard/account/tokens)');
    console.error('  ou SUPABASE_DB_URL=postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres\n');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('[migrate] erro:', e.message);
  process.exit(1);
});
