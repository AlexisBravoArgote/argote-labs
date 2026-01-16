-- Script para verificar que las políticas RLS estén correctamente configuradas
-- Ejecuta este script en Supabase SQL Editor para diagnosticar problemas

-- 1. Verificar políticas en items
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'items'
ORDER BY policyname;

-- 2. Verificar políticas en stock_movements
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'stock_movements'
ORDER BY policyname;

-- 3. Verificar políticas en profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('items', 'stock_movements', 'profiles');

-- 5. Contar registros (esto debería funcionar si las políticas están bien)
-- Nota: Ejecuta esto mientras estás autenticado como un usuario
SELECT 
    (SELECT COUNT(*) FROM items) as items_count,
    (SELECT COUNT(*) FROM stock_movements) as movements_count,
    (SELECT COUNT(*) FROM profiles) as profiles_count;
