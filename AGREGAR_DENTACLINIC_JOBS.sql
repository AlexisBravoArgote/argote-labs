-- Marcar trabajos registrados en Dentaclinic (solo visible en el portal de Logística).
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS dentaclinic_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dentaclinic_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.jobs.dentaclinic_at IS 'Fecha/hora en que logística marcó el trabajo como registrado en Dentaclinic.';
COMMENT ON COLUMN public.jobs.dentaclinic_by IS 'Usuario de logística que marcó el registro en Dentaclinic.';
