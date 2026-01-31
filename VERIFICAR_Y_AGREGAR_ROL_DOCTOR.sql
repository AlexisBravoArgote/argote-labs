-- Script para verificar y agregar el rol "doctor" a la restricción CHECK de la tabla profiles
-- Ejecuta este script paso a paso en el SQL Editor de Supabase

-- PASO 1: Verificar qué valores de role existen actualmente
SELECT DISTINCT role, COUNT(*) as cantidad
FROM profiles
GROUP BY role;

-- PASO 2: Si hay valores NULL o vacíos, actualízalos a 'personal' (o el valor que prefieras)
-- Descomenta y ejecuta solo si es necesario:
-- UPDATE profiles SET role = 'personal' WHERE role IS NULL OR role = '';

-- PASO 3: Si hay otros valores que no sean 'admin', 'personal' o 'doctor', 
-- actualízalos primero. Por ejemplo:
-- UPDATE profiles SET role = 'personal' WHERE role NOT IN ('admin', 'personal', 'doctor');

-- PASO 4: Eliminar la restricción existente
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- PASO 5: Crear la nueva restricción que incluye "doctor"
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'personal', 'doctor'));

-- PASO 6: Verificar que la restricción se aplicó correctamente
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'profiles_role_check';
