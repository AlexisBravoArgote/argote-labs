-- ============================================
-- PASO 1: Verificar TODOS los valores de role que existen
-- ============================================
-- Ejecuta esto PRIMERO y comparte los resultados
SELECT role, COUNT(*) as cantidad
FROM profiles
GROUP BY role
ORDER BY role;

-- ============================================
-- PASO 2: Verificar la restricción actual
-- ============================================
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
    AND contype = 'c'
    AND (conname LIKE '%role%' OR pg_get_constraintdef(oid) LIKE '%role%');

-- ============================================
-- PASO 3: Eliminar la restricción (ejecuta esto DESPUÉS del paso 1)
-- ============================================
-- Descomenta y ejecuta esto:
-- ALTER TABLE profiles DROP CONSTRAINT profiles_role_check CASCADE;

-- ============================================
-- PASO 4: Si el paso 3 falla, intenta esto (elimina TODAS las restricciones CHECK)
-- ============================================
-- Descomenta y ejecuta esto si el paso 3 no funciona:
/*
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'profiles'::regclass 
            AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
        RAISE NOTICE 'Eliminada restricción: %', r.conname;
    END LOOP;
END $$;
*/

-- ============================================
-- PASO 5: Crear la nueva restricción (ejecuta esto DESPUÉS de eliminar la anterior)
-- ============================================
-- Descomenta y ejecuta esto:
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
--     CHECK (role IN ('admin', 'Staff', 'doctor'));
