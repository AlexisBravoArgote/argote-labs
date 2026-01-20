-- Script para agregar campos pieza y doctor a la tabla jobs
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Agregar columna pieza
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS pieza TEXT;

-- 2. Agregar columna doctor
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS doctor TEXT;

-- 3. Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'jobs'
    AND column_name IN ('pieza', 'doctor')
ORDER BY column_name;
