-- Script para agregar el rol "doctor" a la restricción CHECK de la tabla profiles
-- Ejecuta este script COMPLETO en el SQL Editor de Supabase

-- PASO 1: Verificar la restricción actual (opcional, para ver qué valores permite)
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'profiles_role_check';

-- PASO 2: Eliminar la restricción existente
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- PASO 3: Crear la nueva restricción que incluye "Staff", "admin" y "doctor"
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'Staff', 'doctor'));
