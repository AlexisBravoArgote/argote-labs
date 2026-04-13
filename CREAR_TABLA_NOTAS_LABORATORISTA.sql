-- Notas internas por trabajo: solo laboratorio (Staff) y admin.
-- Ejecutar en Supabase SQL Editor.
-- Opcional: habilitar Realtime para esta tabla (Database > Replication) si quieres sync instantáneo entre pestañas.

CREATE TABLE IF NOT EXISTS job_laboratorista_notes (
    job_id UUID PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_job_laboratorista_notes_updated_at ON public.job_laboratorista_notes(updated_at DESC);

COMMENT ON TABLE public.job_laboratorista_notes IS 'Notas del laboratorista por trabajo; no visibles para doctores.';

ALTER TABLE public.job_laboratorista_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_notes_select_staff_admin" ON public.job_laboratorista_notes;
DROP POLICY IF EXISTS "lab_notes_insert_staff_admin" ON public.job_laboratorista_notes;
DROP POLICY IF EXISTS "lab_notes_update_staff_admin" ON public.job_laboratorista_notes;
DROP POLICY IF EXISTS "lab_notes_delete_staff_admin" ON public.job_laboratorista_notes;

CREATE POLICY "lab_notes_select_staff_admin"
    ON public.job_laboratorista_notes FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR p.role = 'Staff')
        )
    );

CREATE POLICY "lab_notes_insert_staff_admin"
    ON public.job_laboratorista_notes FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR p.role = 'Staff')
        )
    );

CREATE POLICY "lab_notes_update_staff_admin"
    ON public.job_laboratorista_notes FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR p.role = 'Staff')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR p.role = 'Staff')
        )
    );

CREATE POLICY "lab_notes_delete_staff_admin"
    ON public.job_laboratorista_notes FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR p.role = 'Staff')
        )
    );
