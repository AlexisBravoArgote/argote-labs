-- Permite la nueva etapa "nuevo" para flujo Portal Doctor -> CEREC
-- Ejecuta este script en Supabase SQL Editor

BEGIN;

-- 1) Eliminar constraint actual de etapa, si existe
ALTER TABLE jobs
DROP CONSTRAINT IF EXISTS jobs_etapa_check;

-- 2) Crear constraint actualizado
ALTER TABLE jobs
ADD CONSTRAINT jobs_etapa_check
CHECK (etapa IN ('nuevo', 'diseño', 'fresado'));

-- 3) Establecer default para nuevos registros
ALTER TABLE jobs
ALTER COLUMN etapa SET DEFAULT 'nuevo';

-- 4) Normalizar nulos (si existen)
UPDATE jobs
SET etapa = 'diseño'
WHERE etapa IS NULL;

COMMIT;

-- Verificacion rapida
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'jobs_etapa_check';
