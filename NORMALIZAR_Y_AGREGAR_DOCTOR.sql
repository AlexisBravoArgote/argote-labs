-- Script para normalizar valores y agregar rol doctor
-- Ejecuta este script COMPLETO

-- PASO 1: Normalizar todos los valores de role
-- Eliminar espacios al inicio y final
UPDATE profiles SET role = TRIM(role) WHERE role IS NOT NULL;

-- Asegurar que 'Staff' tenga la S mayúscula (si hay 'staff' con minúscula)
UPDATE profiles SET role = 'Staff' WHERE LOWER(TRIM(role)) = 'staff';

-- Asegurar que 'admin' esté en minúscula
UPDATE profiles SET role = 'admin' WHERE LOWER(TRIM(role)) = 'admin';

-- Si hay valores NULL, establecerlos como 'Staff'
UPDATE profiles SET role = 'Staff' WHERE role IS NULL;

-- PASO 2: Verificar que solo quedan los valores correctos
SELECT role, COUNT(*) as cantidad
FROM profiles
GROUP BY role
ORDER BY role;

-- PASO 3: Crear la restricción
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'Staff', 'doctor'));
