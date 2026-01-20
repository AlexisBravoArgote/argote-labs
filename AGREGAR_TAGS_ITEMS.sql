-- Script para agregar campo tags a la tabla items
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Agregar columna tags como array de texto
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Crear índice para búsqueda más rápida por tags
CREATE INDEX IF NOT EXISTS idx_items_tags ON items USING GIN (tags);

-- 3. Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'items'
    AND column_name = 'tags';

-- Nota: Los tags válidos son: 'E.MAX', 'RECICLADO', 'SIRONA'
-- Se almacenan como un array de texto, ejemplo: ARRAY['E.MAX', 'RECICLADO']
