-- Script para permitir que los administradores borren trabajos del historial
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Eliminar política de DELETE existente si existe
DROP POLICY IF EXISTS "Admins can delete jobs" ON jobs;

-- 2. Crear política que permita a usuarios con role = 'admin' borrar trabajos
CREATE POLICY "Admins can delete jobs" ON jobs
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
WHERE tablename = 'jobs' 
    AND policyname = 'Admins can delete jobs';
