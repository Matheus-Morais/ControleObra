-- =============================================================================
-- 3.6 — Realtime filtrado por projeto
-- Desnormaliza project_id em item_options e item_comments para permitir o
-- filtro `postgres_changes` por projeto no cliente (hooks/useRealtime.ts),
-- evitando que o app receba eventos de projetos dos quais não participa.
--
-- COMO APLICAR: rode este script no SQL Editor do Supabase (ou via
-- `supabase db push`) ANTES de publicar a mudança em hooks/useRealtime.ts.
-- Sem a coluna, o filtro `project_id=eq.<id>` deixaria de entregar eventos
-- dessas duas tabelas.
-- =============================================================================

-- 1) Colunas (nullable inicialmente, para permitir o backfill).
ALTER TABLE item_options
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE item_comments
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- 2) Backfill a partir do item pai.
UPDATE item_options o
  SET project_id = i.project_id
  FROM items i
  WHERE o.item_id = i.id AND o.project_id IS NULL;

UPDATE item_comments c
  SET project_id = i.project_id
  FROM items i
  WHERE c.item_id = i.id AND c.project_id IS NULL;

-- 3) Trigger de preenchimento automático no insert (deriva do item pai).
CREATE OR REPLACE FUNCTION set_project_id_from_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_id IS NULL THEN
    SELECT project_id INTO NEW.project_id FROM items WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_item_options_project_id ON item_options;
CREATE TRIGGER set_item_options_project_id
  BEFORE INSERT ON item_options
  FOR EACH ROW EXECUTE FUNCTION set_project_id_from_item();

DROP TRIGGER IF EXISTS set_item_comments_project_id ON item_comments;
CREATE TRIGGER set_item_comments_project_id
  BEFORE INSERT ON item_comments
  FOR EACH ROW EXECUTE FUNCTION set_project_id_from_item();

-- 4) Índices para o filtro por projeto.
CREATE INDEX IF NOT EXISTS idx_item_options_project ON item_options(project_id);
CREATE INDEX IF NOT EXISTS idx_item_comments_project ON item_comments(project_id);

-- 5) NOT NULL após o backfill (FKs com ON DELETE CASCADE garantem que todo
--    registro tem item pai, então nenhuma linha deve ficar sem project_id).
ALTER TABLE item_options ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE item_comments ALTER COLUMN project_id SET NOT NULL;
