-- Script para agregar campos etapa y fecha_espera a la tabla jobs
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Agregar columna etapa (diseño/fresado)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS etapa TEXT DEFAULT 'diseño' CHECK (etapa IN ('diseño', 'fresado'));

-- 2. Agregar columna fecha_espera
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS fecha_espera DATE;

-- 3. Actualizar trabajos existentes para que tengan etapa 'diseño' por defecto
UPDATE jobs 
SET etapa = 'diseño' 
WHERE etapa IS NULL;

-- 4. Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'jobs'
    AND column_name IN ('etapa', 'fecha_espera')
ORDER BY column_name;
