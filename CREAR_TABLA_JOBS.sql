-- Script para crear la tabla jobs y job_materials con políticas RLS
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear tabla jobs
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_type TEXT NOT NULL,
    treatment_name TEXT, -- Solo se usa si treatment_type = 'otra'
    patient_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    completed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 2. Crear tabla job_materials
CREATE TABLE IF NOT EXISTS job_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_materials_job_id ON job_materials(job_id);
CREATE INDEX IF NOT EXISTS idx_job_materials_item_id ON job_materials(item_id);

-- 4. Habilitar RLS en las tablas
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_materials ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas existentes si las hay (para evitar conflictos)
DROP POLICY IF EXISTS "Users can view jobs" ON jobs;
DROP POLICY IF EXISTS "Users can create jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update jobs" ON jobs;
DROP POLICY IF EXISTS "Users can view job_materials" ON job_materials;
DROP POLICY IF EXISTS "Users can create job_materials" ON job_materials;

-- 6. Crear políticas RLS para jobs
CREATE POLICY "All authenticated users can view jobs" ON jobs
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can create jobs" ON jobs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update jobs" ON jobs
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- 7. Crear políticas RLS para job_materials
CREATE POLICY "All authenticated users can view job_materials" ON job_materials
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can create job_materials" ON job_materials
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 8. Verificar que las tablas se crearon correctamente
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('jobs', 'job_materials')
ORDER BY table_name;
