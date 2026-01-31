-- Script para agregar el campo notas_doctor a la tabla jobs
-- Este campo permite que los doctores agreguen notas adicionales al enviar trabajos
-- Ejecuta este script en el SQL Editor de Supabase

-- Agregar columna notas_doctor (opcional, puede ser NULL)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS notas_doctor TEXT;

-- Comentario en la columna para documentación
COMMENT ON COLUMN jobs.notas_doctor IS 'Notas adicionales del doctor para ayudar al laboratorista';

-- ============================================
-- INSTRUCCIONES PARA CREAR UN USUARIO DOCTOR:
-- ============================================
-- 1. Crea el usuario en Supabase Auth (Authentication > Users > Add user)
-- 2. Copia el UUID del usuario (sin corchetes)
-- 3. Ejecuta este INSERT (reemplaza el UUID y el nombre):
--
-- INSERT INTO profiles (id, full_name, role)
-- VALUES ('63a84109-3897-4a00-a206-fef57df0acf3', 'DrAlexis', 'doctor');
--
-- IMPORTANTE: El UUID NO debe tener corchetes []
