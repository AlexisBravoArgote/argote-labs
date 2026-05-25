-- Marcar trabajos recibidos en logística (ubicación + fecha/hora de recepción).
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS logistics_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS logistics_received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_logistics_received_at
    ON public.jobs(logistics_received_at DESC)
    WHERE logistics_received_at IS NOT NULL;

COMMENT ON COLUMN public.jobs.logistics_received_at IS 'Fecha/hora en que logística recibió el trabajo.';
COMMENT ON COLUMN public.jobs.logistics_received_by IS 'Usuario de logística que marcó la recepción.';
