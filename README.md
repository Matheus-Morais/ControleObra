<div align="center">

# 🏗️ ControleObra

**Gerencie sua obra ou reforma de forma colaborativa, organizada e inteligente.**

Aplicativo mobile multiplataforma para casais e famílias controlarem compras, materiais e gastos durante uma obra residencial — tudo sincronizado em tempo real.

[![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📋 Sobre o Projeto

O **ControleObra** nasceu de uma necessidade real: gerenciar as centenas de decisões que um casal precisa tomar durante uma reforma. De "qual piso escolher para a sala?" até "quanto já gastamos no banheiro?", o app centraliza tudo em um único lugar, compartilhado em tempo real.

### O problema que resolve

- Planilhas desorganizadas com informações espalhadas
- Falta de visibilidade compartilhada do andamento da obra
- Dificuldade de comparar opções de produtos lado a lado
- Controle financeiro manual e propenso a erros

### A solução

Um app intuitivo que organiza a obra por cômodos, permite salvar e comparar produtos, acompanhar o status de cada item (pesquisando → decidido → comprado → instalado) e manter o controle financeiro — tudo acessível para todos os envolvidos no projeto.

---

## ✨ Funcionalidades

### Gestão de Projetos
- Criar projetos de obra com nome personalizado
- Compartilhar projetos via **código de convite** de 6 caracteres
- Editar nome do projeto a qualquer momento
- Trocar entre projetos diferentes

### Organização por Cômodos
- **12 cômodos pré-configurados** (Sala, Cozinha, Quartos, Banheiros, etc.)
- Criar cômodos personalizados com nomes livres
- Renomear e excluir cômodos
- Ícones e cores distintas para cada cômodo
- Barra de progresso por cômodo

### Gestão de Itens
- Cadastro de itens por cômodo com categorias pré-definidas
- **4 estados de progresso**: Pesquisando → Decidido → Comprado → Instalado
- Filtros por status
- Campo de orçamento e notas por item
- Atividade recente no dashboard

### Comparação de Produtos
- Múltiplas opções de produto por item
- Campos: modelo, marca, preço, loja, URL
- **Upload de fotos** dos produtos
- Avaliação com **estrelas (1-5)**
- Marcar opção escolhida

### Financeiro
- Dashboard com **resumo financeiro** (orçamento vs gasto)
- **Gráfico de gastos por cômodo**
- Registro de pagamentos/transações
- Exportação de **relatório em PDF**
- Progresso geral da obra em percentual

### Colaboração
- **Sincronização em tempo real** via Supabase Realtime
- Comentários por item
- Visualização compartilhada entre membros

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Propósito |
|--------|-----------|-----------|
| **Frontend** | React Native + Expo SDK 55 | App cross-platform (iOS, Android, Web) |
| **Linguagem** | TypeScript (strict mode) | Tipagem estática e segurança |
| **Navegação** | Expo Router | File-based routing |
| **Estilização** | NativeWind (Tailwind CSS) | Utility-first CSS nativo |
| **Estado Global** | Zustand | Store leve e reativo |
| **Data Fetching** | TanStack Query v5 | Cache, retry, invalidação automática |
| **Backend** | Supabase | Auth, PostgreSQL, Realtime, Storage |
| **Segurança** | Row Level Security (RLS) | Isolamento de dados por projeto |

---

## 📐 Arquitetura

```
ControleObra/
├── app/                        # Rotas e telas (Expo Router)
│   ├── (auth)/                 # Login e registro
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                 # Tabs principais
│   │   ├── index.tsx           # Dashboard
│   │   ├── rooms.tsx           # Cômodos
│   │   ├── financial.tsx       # Financeiro
│   │   └── settings.tsx        # Ajustes
│   ├── project/                # Telas de projeto
│   │   └── [id]/room/[roomId]/ # Itens e detalhes
│   ├── project-setup.tsx       # Seleção/criação de projeto
│   └── _layout.tsx             # Auth guard e providers
├── components/ui/              # Componentes reutilizáveis
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── FAB.tsx
│   ├── ProgressBar.tsx
│   ├── StatusChip.tsx
│   ├── StarRating.tsx
│   ├── EmptyState.tsx
│   └── LoadingScreen.tsx
├── services/                   # Camada de dados (Supabase)
│   ├── auth.ts
│   ├── items.ts
│   ├── rooms.ts
│   ├── projects.ts
│   └── supabase.ts             # Client com timeout
├── hooks/                      # React Query hooks
│   ├── useItems.ts
│   ├── useRooms.ts
│   ├── useProject.ts
│   ├── useItemOptions.ts
│   └── useRealtime.ts
├── stores/                     # Zustand stores
│   ├── authStore.ts
│   └── projectStore.ts
├── types/                      # TypeScript interfaces
├── constants/                  # Cômodos padrão, categorias
├── utils/                      # Formatação, alertas
└── supabase/
    └── schema.sql              # Schema completo com RLS
```

---

## 🗄️ Banco de Dados

Schema PostgreSQL com **Row Level Security** habilitado em todas as tabelas:

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário (sincronizado com auth.users via trigger) |
| `projects` | Projetos de obra |
| `project_members` | Membros dos projetos (com roles: owner/member) |
| `rooms` | Cômodos do projeto |
| `items` | Itens de cada cômodo com status e orçamento |
| `item_options` | Opções de produto para comparação |
| `item_option_photos` | Fotos das opções (Supabase Storage) |
| `item_comments` | Comentários por item |
| `transactions` | Pagamentos realizados |

### Funções SQL

- `is_project_member()` — verifica membros (SECURITY DEFINER)
- `find_project_by_invite_code()` — busca projeto por código (bypassa RLS)
- `handle_new_user()` — cria perfil automaticamente no signup (trigger)

---

## 🚀 Como Executar

### Pré-requisitos

- **Node.js** 18+
- **npm** ou **yarn**
- Conta no [Supabase](https://supabase.com) (gratuito)

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/ControleObra.git
cd ControleObra
npm install
```

### 2. Configure o Supabase

1. Crie um projeto no [Supabase Dashboard](https://app.supabase.com)
2. No **SQL Editor**, execute todo o conteúdo de `supabase/schema.sql`
3. Em **Authentication > Providers**, habilite Email
4. Em **Storage**, verifique se o bucket `item-photos` foi criado

### 3. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha com as credenciais do Supabase (Settings > API):

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 4. Execute

```bash
# Iniciar servidor de desenvolvimento
npx expo start

# Abrir no celular via Expo Go
# Escaneie o QR Code com o app Expo Go

# Web
npx expo start --web
```

---

## 📱 Como Usar

1. **Crie uma conta** com e-mail e senha
2. **Crie um projeto** de obra (ex: "Nossa Casa - Rua X")
3. **Compartilhe** o código de convite com seu parceiro(a)
4. **Adicione cômodos** padrão ou personalizados
5. **Cadastre itens** em cada cômodo (piso, móveis, etc.)
6. **Compare produtos** adicionando opções com fotos e preços
7. **Atualize o status** conforme avança (pesquisando → comprado)
8. **Acompanhe os gastos** no painel financeiro

---

## 🌐 Deploy

### Vercel (Web)

```bash
npx expo export -p web
vercel --prod --yes --name controleobra
```

### EAS Build (Android/iOS)

```bash
npx eas build --platform android --profile preview
```

---

## 🤝 Compartilhando o Projeto

Para convidar alguém para o seu projeto de obra:

1. Acesse **Ajustes** no app
2. Copie o **código de convite** de 6 caracteres
3. A pessoa cria uma conta e usa o código em **"Entrar com Código"**
4. Pronto! Ambos veem e editam tudo em tempo real

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

**Desenvolvido com dedicação para simplificar a experiência de reformar.**

</div>
