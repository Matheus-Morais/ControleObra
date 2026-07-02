# Deploy & Migrations

Guia rápido para publicar o ControleObra e aplicar mudanças de banco.

## Deploy (web / Vercel)

O `vercel.json` builda com `npx expo export --platform web` e serve `dist/` como SPA.

- **Caminho principal (integração Git):** `git push origin master` → o Vercel builda e
  publica produção automaticamente. Nada mais é necessário.
- **Fallback por CLI:** `npm run deploy` (produção) ou `npm run deploy:preview`.
  Requer `VERCEL_TOKEN` (https://vercel.com/account/tokens) e, na 1ª vez,
  `npx vercel link` para associar o projeto.
- **Sanidade antes de publicar:** `npm run build:web` reproduz o build do Vercel localmente.

## Migrations (Supabase)

As migrations ficam em `supabase/migrations/*.sql`. O runner (`npm run db:migrate`)
é idempotente: registra o aplicado em `public._migrations` e pula o que já rodou.
Aceita duas credenciais (usa a que estiver no `.env`):

- **Recomendado — Personal Access Token (Management API):** gere em
  https://supabase.com/dashboard/account/tokens e ponha no `.env`:
  ```
  SUPABASE_ACCESS_TOKEN=sbp_xxx
  ```
  (o ref do projeto é lido de `EXPO_PUBLIC_SUPABASE_URL`).
- **Alternativa — connection string direta:** **Supabase → Project Settings →
  Database → Connection string (URI)**, modo **Session** (porta 5432; ⚠️ não o
  pooler 6543):
  ```
  SUPABASE_DB_URL=postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres
  ```

Depois: `npm run db:migrate`. (Alternativa manual: colar o `.sql` no SQL Editor.)

## Segredos necessários (ficam só no `.env`, nunca no git)

| Variável                | Para quê                    | Onde obter                              |
|-------------------------|-----------------------------|-----------------------------------------|
| `SUPABASE_ACCESS_TOKEN` | `npm run db:migrate` (rec.) | supabase.com/dashboard/account/tokens   |
| `SUPABASE_DB_URL`       | `npm run db:migrate` (alt.) | Supabase → Database → Connection        |
| `VERCEL_TOKEN`          | `npm run deploy` (opcional) | vercel.com/account/tokens               |

Com esses no lugar, "rodar as migrations e fazer deploy" vira:
`npm run db:migrate && git push origin master`.

## (Opcional) Evitar prompts de permissão do Claude Code

Para que o assistente rode esses comandos sem pedir aprovação a cada vez, adicione
em `.claude/settings.json` (você precisa criar/editar — o assistente não pode
ampliar as próprias permissões):

```json
{
  "permissions": {
    "allow": [
      "Bash(git push:*)",
      "Bash(npm run db:migrate)",
      "Bash(node scripts/migrate.mjs)",
      "Bash(npm run deploy)",
      "Bash(npx vercel:*)",
      "Bash(npx expo export:*)"
    ]
  }
}
```
