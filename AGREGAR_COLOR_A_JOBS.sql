-- Agrega campo color al flujo de trabajos
-- Ejecuta en Supabase SQL Editor

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS color TEXT;

-- Verificacion rapida
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'jobs'
  AND column_name = 'color';
