-- Agregar columna 'reciclado' a la tabla jobs
-- para rastrear si los materiales de un trabajo ya fueron reciclados.
-- Ejecutar en el SQL Editor de Supabase.

ALTER TABLE jobs ADD COLUMN reciclado BOOLEAN DEFAULT false;
