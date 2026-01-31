-- Script para agregar el rol "doctor" manteniendo "Staff" como está
-- Ejecuta este script COMPLETO en el SQL Editor de Supabase

-- PASO 1: Ver todas las restricciones CHECK en la tabla profiles
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
    AND contype = 'c';

-- PASO 2: Eliminar TODAS las restricciones CHECK de role (por si hay múltiples)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'profiles'::regclass 
            AND contype = 'c'
            AND pg_get_constraintdef(oid) LIKE '%role%'
    LOOP
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- PASO 3: Crear la nueva restricción que incluye "Staff", "admin" y "doctor"
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'Staff', 'doctor'));

-- PASO 4: Verificar que se creó correctamente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
    AND contype = 'c'
    AND conname = 'profiles_role_check';
