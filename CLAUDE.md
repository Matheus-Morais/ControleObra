# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

ControleObra — app cross-platform (iOS/Android/Web) para casais/famílias gerenciarem uma obra residencial de forma colaborativa e em tempo real: projetos → cômodos → itens → opções de produto, mais controle financeiro. Expo SDK 55 + React Native 0.83 + React 19 + TypeScript strict. Backend 100% Supabase (Auth, Postgres com RLS, Realtime, Storage). UI e domínio em **português (pt-BR)**; enums do banco em inglês.

## Comandos

```bash
npm install
npx expo start            # dev server (QR p/ Expo Go); scripts: npm run start/android/ios/web
npx expo start --web      # roda no navegador
npx tsc --noEmit          # ÚNICA verificação estática — não há ESLint nem testes configurados
npx expo export --platform web   # build web → dist/ (deploy Vercel, ver vercel.json: SPA rewrite p/ "/")
npx eas build --platform android --profile preview   # build mobile
```

Não existem testes, linter ou script de build custom. Ao validar mudanças, rode `npx tsc --noEmit`.

## Setup obrigatório

`.env` com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` (ver `.env.example`). Sem elas o app builda mas cai em placeholder e loga erro (`services/supabase.ts`). O schema completo (tabelas, RLS, funções, trigger, bucket `item-photos`) vive em `supabase/schema.sql` e deve ser rodado no SQL Editor do Supabase.

## Arquitetura — fluxo de dados (o padrão central)

Camadas estritas, sempre nesta ordem:

**`services/*`** → funções puras que chamam o cliente Supabase e **lançam erro** (`if (error) throw error`). Sem estado, sem React. Uma função por operação.

**`hooks/*`** → wrappers React Query (`@tanstack/react-query`) sobre os services. Toda leitura é `useQuery`, toda escrita é `useMutation` com invalidação manual em `onSuccess`. **Telas nunca chamam `services/` diretamente — sempre via hooks.**

**`app/*`** (telas Expo Router) → consomem hooks + Zustand.

**`stores/*`** (Zustand) → guarda **apenas** estado global de sessão e projeto ativo, não dados de servidor (esses são cache do React Query).

### Convenção de query keys (crítica)

A invalidação e o realtime dependem destas chaves exatas:

| Key | Conteúdo |
|-----|----------|
| `['items', roomId]` / `['project-items', projectId]` / `['item', itemId]` | itens |
| `['rooms', projectId]` | cômodos |
| `['item-options', itemId]` | opções de produto |
| `['comments', itemId]` | comentários |
| `['transactions', projectId]` / `['total-spent', projectId]` | financeiro |

Ao criar hook novo, siga o padrão `[recurso, id]` e invalide todas as chaves afetadas no `onSuccess` da mutation.

### Realtime (`hooks/useRealtime.ts`)

Um único canal Supabase por projeto (`project-${projectId}`) escuta `postgres_changes` em items/rooms/item_options/item_comments/transactions e faz **invalidação debounced (400ms)** de todas as query keys acima. É assim que a colaboração em tempo real funciona — não há atualização otimista de cache; muda no banco → invalida → refetch. Montado uma vez por projeto ativo.

## Autenticação (`app/_layout.tsx`)

Toda a lógica de auth está concentrada no root layout:
- `initializeAuth()` restaura a sessão no boot; `onAuthStateChange` reage a login/logout/refresh.
- `AuthGuard` redireciona: sem sessão → `(auth)/login`; com sessão dentro de `(auth)` → `(tabs)`.
- `isAuthError()` detecta erros de auth (401/403, JWT expirado, refresh inválido); o `QueryClient` está configurado para **não** dar retry nesses casos e para chamar `forceCleanSession()` (signOut + reset dos stores + `queryClient.clear()`) em erro de auth em qualquer query.
- Perfil é carregado de forma assíncrona e não bloqueia o boot.

## Backend / RLS (`supabase/schema.sql`)

RLS habilitado em **todas** as tabelas; acesso é sempre "sou membro do projeto?". Cuidados ao mexer no schema:
- **`is_project_member(project_id)`** é `SECURITY DEFINER` de propósito — evita recursão infinita de RLS (uma policy que consultasse `project_members` diretamente se auto-referenciaria). Use essa função nas policies, não subqueries diretas.
- **`find_project_by_invite_code(code)`** é `SECURITY DEFINER` para permitir que quem **ainda não é membro** encontre o projeto ao entrar por código (bypassa RLS). Faz `UPPER(code)`.
- **`handle_new_user()`** (trigger em `auth.users`) cria o `profiles` automaticamente no signup — não crie perfil manualmente no client.
- Entrar em projeto duplicado retorna erro Postgres `23505` (unique), tratado em `services/projects.ts` como "já é membro".

Fluxo de convite: código de 6 chars gerado em `utils/format.ts` (`generateInviteCode`, alfabeto sem caracteres ambíguos — sem I/O/0/1).

## Diferenças Web vs Nativo (sempre tratar ambos)

O app roda em web e mobile; vários utilitários fazem branch por `Platform.OS`:
- **Storage de sessão** (`services/supabase.ts`): `localStorage` na web, `expo-secure-store` no nativo.
- **Persistência do projeto** (`stores/projectStore.ts`): persistência **manual** (não usa `zustand/middleware/persist`, por incompatibilidade com Expo web) — grava em localStorage/SecureStore via `subscribe`.
- **Alertas** (`utils/alert.ts`): `Alert.alert` no nativo, `window.confirm`/`window.alert` na web. **Use sempre `showAlert`**, nunca `Alert.alert` direto.
- **Fetch com timeout**: cliente Supabase usa `fetchWithTimeout` (`FETCH_TIMEOUT_MS = 10000`); `hooks/useLoadingTimeout.ts` cobre estados de loading presos.

## Convenções

- **Estilização**: NativeWind (Tailwind via `className`). Paleta custom em `tailwind.config.js`: `sand`, `terracotta`, `moss`, `cream`. `darkMode: 'class'`. `global.css` traz as diretivas Tailwind.
- **Path alias**: `@/*` → raiz do projeto (`tsconfig.json`).
- **Componentes de UI** reutilizáveis em `components/ui/`, exportados pelo barrel `components/ui/index.ts` (Button, Input, Card, StatusChip, ProgressBar, StarRating, FAB, EmptyState, LoadingScreen, ErrorBoundary).
- **Roteamento**: file-based (Expo Router). Grupos: `(auth)` público, `(tabs)` principal, `project/[id]/room/[roomId]/item/[itemId]` para o drill-down.
- **Formatação**: `utils/format.ts` — moeda em BRL, datas pt-BR.
- **Status do item** (`ItemStatus`): `researching → decided → purchased → installed` (valores em inglês no banco; rótulos em português na UI via `StatusChip`).
- **Tipos**: fonte única em `types/database.ts` (reexportado por `types/index.ts`). Tipos com relações (`ItemWithOptions`, `RoomWithProgress`) ficam ali.
- **Constantes de domínio**: `constants/rooms.ts` (12 cômodos padrão com ícones/cores/categorias), `constants/categories.ts` (catálogo de categorias), `constants/colors.ts`.

## Deploy

Web via Vercel: `vercel.json` roda `npx expo export --platform web`, serve `dist/` como SPA (rewrite de tudo para `/`). Segredos vão em env vars do Vercel (prefixo `EXPO_PUBLIC_`), nunca no git. `AGENTS.md` contém boas práticas genéricas da Vercel (a maioria voltada a Vercel Functions — este projeto é export estático, então só a parte de env vars/secrets se aplica).
