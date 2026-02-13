-- Agregar columna 'reciclado' a la tabla jobs
-- para rastrear si los materiales de un trabajo ya fueron reciclados.
-- NOTA: Si ya ejecutaste esto antes, la columna ya existe. Solo corre la parte de abajo.

-- ALTER TABLE jobs ADD COLUMN reciclado BOOLEAN DEFAULT false;  -- Ya ejecutado

-- Permitir que TODOS los usuarios autenticados (admin y staff)
-- puedan crear items de reciclado (nombre que empiece con "RECICLADO ").
-- Esto NO les da permiso de crear items normales, solo reciclados.

DROP POLICY IF EXISTS "Authenticated users can insert recycled items" ON items;

CREATE POLICY "Authenticated users can insert recycled items" ON items
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND name LIKE 'RECICLADO %'
    );
