-- Agregar rol "asistente_dental" a profiles
-- Ejecutar en Supabase SQL Editor

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'Staff', 'doctor', 'logistica', 'asistente_dental'));

-- Verificar
SELECT role, COUNT(*) AS cantidad
FROM profiles
GROUP BY role
ORDER BY role;
