-- Script de diagnóstico para verificar el estado de triggers y políticas RLS
-- Ejecuta este script ANTES de ejecutar FIX_RLS_ITEMS.sql para ver el estado actual

-- 1. Verificar triggers en stock_movements
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'stock_movements';

-- 2. Verificar funciones relacionadas con stock
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
    AND (routine_name LIKE '%stock%' OR routine_name LIKE '%item%' OR routine_name LIKE '%movement%');

-- 3. Verificar políticas RLS en items
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
WHERE tablename = 'items';

-- 4. Verificar políticas RLS en stock_movements
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
WHERE tablename = 'stock_movements';

-- 5. Verificar políticas RLS en profiles
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
WHERE tablename = 'profiles';

-- 6. Verificar si RLS está habilitado en las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('items', 'stock_movements', 'profiles');
