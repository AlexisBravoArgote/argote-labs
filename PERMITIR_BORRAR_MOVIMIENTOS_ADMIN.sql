-- Script para permitir que los administradores borren movimientos del historial
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Eliminar política de DELETE existente si existe (por si acaso)
DROP POLICY IF EXISTS "Admins can delete stock movements" ON stock_movements;
DROP POLICY IF EXISTS "All authenticated users can delete stock movements" ON stock_movements;

-- 2. Crear política que permita a usuarios con role = 'admin' borrar movimientos
-- Esta política verifica que el usuario tenga role = 'admin' en la tabla profiles
CREATE POLICY "Admins can delete stock movements" ON stock_movements
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 3. Verificar que la política se creó correctamente
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
    AND policyname = 'Admins can delete stock movements';
