-- Script para crear tabla de reportes de errores/fallas
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear tabla job_reports
CREATE TABLE IF NOT EXISTS public.job_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('error', 'falla')),
    description TEXT NOT NULL,
    reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_job_reports_job_id ON public.job_reports(job_id);
CREATE INDEX IF NOT EXISTS idx_job_reports_type ON public.job_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_job_reports_created_at ON public.job_reports(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.job_reports ENABLE ROW LEVEL SECURITY;

-- 4. Política para que todos los usuarios autenticados puedan leer reportes
CREATE POLICY "Users can read job reports" ON public.job_reports
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 5. Política para que todos los usuarios autenticados puedan crear reportes
CREATE POLICY "Users can create job reports" ON public.job_reports
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reported_by);

-- 6. Política para que solo admins puedan actualizar reportes
CREATE POLICY "Admins can update job reports" ON public.job_reports
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. Política para que solo admins puedan eliminar reportes
CREATE POLICY "Admins can delete job reports" ON public.job_reports
    FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
