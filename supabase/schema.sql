-- ControleObra - Schema SQL para Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- =============================================================================
-- TABELAS
-- =============================================================================

-- Perfis de usuario (espelho do auth.users com dados extras)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Projetos de obra
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  total_budget NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Membros do projeto
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Comodos
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'home',
  color TEXT DEFAULT '#C1694F',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Itens de cada comodo
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'researching'
    CHECK (status IN ('researching', 'decided', 'purchased', 'installed')),
  quantity INT DEFAULT 1,
  budget NUMERIC(12,2) DEFAULT 0,
  actual_price NUMERIC(12,2),
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Opcoes de produto para cada item
CREATE TABLE IF NOT EXISTS item_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  model_name TEXT NOT NULL,
  brand TEXT,
  price NUMERIC(12,2),
  store TEXT,
  url TEXT,
  notes TEXT,
  rating INT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  is_chosen BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Fotos das opcoes de produto
CREATE TABLE IF NOT EXISTS item_option_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_option_id UUID REFERENCES item_options(id) ON DELETE CASCADE NOT NULL,
  storage_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Comentarios nos itens
CREATE TABLE IF NOT EXISTS item_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Transacoes financeiras
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  paid_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================================
-- INDICES
-- =============================================================================

CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_rooms_project ON rooms(project_id);
CREATE INDEX idx_items_room ON items(room_id);
CREATE INDEX idx_items_project ON items(project_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_item_options_item ON item_options(item_id);
CREATE INDEX idx_item_option_photos_option ON item_option_photos(item_option_id);
CREATE INDEX idx_item_comments_item ON item_comments(item_id);
CREATE INDEX idx_transactions_project ON transactions(project_id);
CREATE INDEX idx_projects_invite_code ON projects(invite_code);

-- =============================================================================
-- FUNCOES AUXILIARES
-- =============================================================================

-- Funcao para verificar se usuario e membro do projeto
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Funcao para buscar projeto por invite code (bypassa RLS para quem ainda nao e membro)
CREATE OR REPLACE FUNCTION find_project_by_invite_code(code TEXT)
RETURNS SETOF projects AS $$
  SELECT * FROM projects WHERE invite_code = UPPER(code) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Funcao para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil no signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_option_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Members can view project member profiles"
  ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_members pm1
    JOIN project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id
  ));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- PROJECTS
CREATE POLICY "Members can view their projects"
  ON projects FOR SELECT USING (is_project_member(id));

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can update their projects"
  ON projects FOR UPDATE USING (is_project_member(id));

CREATE POLICY "Owner can delete project"
  ON projects FOR DELETE USING (auth.uid() = created_by);

-- PROJECT_MEMBERS
CREATE POLICY "Members can view project members"
  ON project_members FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Authenticated users can join projects"
  ON project_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave projects"
  ON project_members FOR DELETE USING (auth.uid() = user_id);

-- ROOMS
CREATE POLICY "Members can view rooms"
  ON rooms FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Members can create rooms"
  ON rooms FOR INSERT WITH CHECK (is_project_member(project_id));

CREATE POLICY "Members can update rooms"
  ON rooms FOR UPDATE USING (is_project_member(project_id));

CREATE POLICY "Members can delete rooms"
  ON rooms FOR DELETE USING (is_project_member(project_id));

-- ITEMS
CREATE POLICY "Members can view items"
  ON items FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Members can create items"
  ON items FOR INSERT WITH CHECK (is_project_member(project_id));

CREATE POLICY "Members can update items"
  ON items FOR UPDATE USING (is_project_member(project_id));

CREATE POLICY "Members can delete items"
  ON items FOR DELETE USING (is_project_member(project_id));

-- ITEM_OPTIONS
CREATE POLICY "Members can view item options"
  ON item_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM items WHERE items.id = item_options.item_id
    AND is_project_member(items.project_id)
  ));

CREATE POLICY "Members can create item options"
  ON item_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM items WHERE items.id = item_options.item_id
    AND is_project_member(items.project_id)
  ));

CREATE POLICY "Members can update item options"
  ON item_options FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM items WHERE items.id = item_options.item_id
    AND is_project_member(items.project_id)
  ));

CREATE POLICY "Members can delete item options"
  ON item_options FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM items WHERE items.id = item_options.item_id
    AND is_project_member(items.project_id)
  ));

-- ITEM_OPTION_PHOTOS
CREATE POLICY "Members can view photos"
  ON item_option_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM item_options
    JOIN items ON items.id = item_options.item_id
    WHERE item_options.id = item_option_photos.item_option_id
    AND is_project_member(items.project_id)
  ));

CREATE POLICY "Members can create photos"
  ON item_option_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM item_options
    JOIN items ON items.id = item_options.item_id
    WHERE item_options.id = item_option_photos.item_option_id
    AND is_project_member(items.project_id)
  ));

CREATE POLICY "Members can delete photos"
  ON item_option_photos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM item_options
    JOIN items ON items.id = item_options.item_id
    WHERE item_options.id = item_option_photos.item_option_id
    AND is_project_member(items.project_id)
  ));

-- ITEM_COMMENTS
CREATE POLICY "Members can view comments"
  ON item_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM items WHERE items.id = item_comments.item_id
    AND is_project_member(items.project_id)
  ));

CREATE POLICY "Members can create comments"
  ON item_comments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM items WHERE items.id = item_comments.item_id
    AND is_project_member(items.project_id)
  ));

CREATE POLICY "Users can delete own comments"
  ON item_comments FOR DELETE
  USING (auth.uid() = user_id);

-- TRANSACTIONS
CREATE POLICY "Members can view transactions"
  ON transactions FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Members can create transactions"
  ON transactions FOR INSERT WITH CHECK (is_project_member(project_id));

CREATE POLICY "Members can update transactions"
  ON transactions FOR UPDATE USING (is_project_member(project_id));

CREATE POLICY "Members can delete transactions"
  ON transactions FOR DELETE USING (is_project_member(project_id));

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'item-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-photos');

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- HABILITAR REALTIME
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE item_options;
ALTER PUBLICATION supabase_realtime ADD TABLE item_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
