-- Tareas internas del laboratorio CEREC (Staff y admin).
-- Ejecutar en Supabase SQL Editor.
-- Opcional: habilitar Realtime para staff_tasks (Database > Replication).

CREATE TABLE IF NOT EXISTS public.staff_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'en_progreso', 'completada')),
    priority TEXT NOT NULL DEFAULT 'media'
        CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_tasks_status ON public.staff_tasks(status);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_due_at ON public.staff_tasks(due_at NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_updated_at ON public.staff_tasks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_assigned_to ON public.staff_tasks(assigned_to);

COMMENT ON TABLE public.staff_tasks IS 'Tareas del equipo de laboratorio CEREC; solo Staff y admin.';

ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_tasks_select" ON public.staff_tasks;
DROP POLICY IF EXISTS "staff_tasks_insert" ON public.staff_tasks;
DROP POLICY IF EXISTS "staff_tasks_update" ON public.staff_tasks;
DROP POLICY IF EXISTS "staff_tasks_delete" ON public.staff_tasks;

CREATE POLICY "staff_tasks_select"
    ON public.staff_tasks FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR p.role = 'Staff')
        )
    );

CREATE POLICY "staff_tasks_insert"
    ON public.staff_tasks FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR p.role = 'Staff')
        )
    );

CREATE POLICY "staff_tasks_update"
    ON public.staff_tasks FOR UPDATE TO authenticated
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

CREATE POLICY "staff_tasks_delete"
    ON public.staff_tasks FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR p.role = 'Staff')
        )
    );
