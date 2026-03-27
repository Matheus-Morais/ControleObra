# ControleObra

Aplicativo mobile multiplataforma (iOS e Android) para casais e famílias gerenciarem compras e escolhas de materiais durante uma obra ou reforma residencial.

## Stack Tecnológica

- **React Native** com **Expo** (SDK 55)
- **TypeScript** (strict mode)
- **Expo Router** para navegação
- **Supabase** como backend (Auth, PostgreSQL, Realtime, Storage)
- **Zustand** para estado global
- **TanStack Query** para cache e sincronização
- **NativeWind** (Tailwind CSS) para estilização
- **@gorhom/bottom-sheet** para modais
- **@shopify/flash-list** para listas performáticas

## Funcionalidades

- Autenticação (e-mail/senha)
- Projetos compartilhados via código de convite
- Organização por cômodos com categorias pré-definidas
- Gerenciamento de itens com status (Pesquisando → Decidido → Comprado → Instalado)
- Múltiplas opções de produto por item para comparação
- Upload de fotos dos produtos
- Avaliação com estrelas (1-5)
- Comentários por item
- Dashboard com resumo financeiro e progresso
- Gráfico de gastos por cômodo
- Registro de pagamentos/transações
- Exportação de relatório em PDF
- Compartilhamento de item via WhatsApp
- Sincronização em tempo real entre usuários
- Tema claro e escuro

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Conta no [Supabase](https://supabase.com)

## Setup

### 1. Clonar e instalar dependências

```bash
git clone <repo-url>
cd ControleObra
npm install
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase Dashboard](https://app.supabase.com)
2. No **SQL Editor**, execute o conteúdo de `supabase/schema.sql`
3. Em **Authentication > Providers**, habilite Email e (opcionalmente) Google OAuth
4. Em **Storage**, verifique se o bucket `item-photos` foi criado (o script SQL já faz isso)

### 3. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

Essas informações estão em **Settings > API** no dashboard do Supabase.

### 4. Executar

```bash
# Desenvolvimento
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios
```

## Estrutura do Projeto

```
ControleObra/
├── app/                    # Rotas e telas (Expo Router)
│   ├── (auth)/             # Login, registro, setup de projeto
│   ├── (tabs)/             # Tabs principais (Dashboard, Cômodos, Financeiro, Ajustes)
│   ├── project/            # Rotas de projeto (itens por cômodo, detalhe)
│   └── onboarding.tsx      # Telas de onboarding
├── components/
│   └── ui/                 # Componentes reutilizáveis
├── services/               # Chamadas ao Supabase
├── stores/                 # Zustand stores
├── hooks/                  # Custom hooks (React Query)
├── types/                  # TypeScript interfaces
├── constants/              # Cores, cômodos padrão, categorias
├── utils/                  # Formatação, compartilhamento
└── supabase/
    └── schema.sql          # Schema completo com RLS
```

## Banco de Dados

O schema SQL inclui:

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário (sincronizado com auth.users) |
| `projects` | Projetos de obra |
| `project_members` | Membros dos projetos |
| `rooms` | Cômodos do projeto |
| `items` | Itens de cada cômodo |
| `item_options` | Opções de produto para comparação |
| `item_option_photos` | Fotos das opções |
| `item_comments` | Comentários por item |
| `transactions` | Pagamentos realizados |

Todas as tabelas possuem **Row Level Security (RLS)** configurado.

## Compartilhando o Projeto

Para compartilhar com seu parceiro(a):

1. Acesse **Ajustes** no app
2. Copie o **código de convite** de 6 caracteres
3. O parceiro(a) entra no app, cria uma conta e usa o código para entrar no projeto

## Licença

Projeto pessoal - uso privado.
