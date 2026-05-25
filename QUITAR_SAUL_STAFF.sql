-- Quitar a Saul del sistema (referencias en BD + luego borrar en Authentication).
-- El perfil en `profiles` puede ya estar borrado; el usuario suele seguir en `auth.users`.

-- ═══════════════════════════════════════════════════════════════════
-- PASO A — Ejecuta SOLO esto primero y localiza el UUID de Saul
-- ═══════════════════════════════════════════════════════════════════

SELECT p.id, p.full_name, p.role, u.email
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ORDER BY u.created_at;

-- Usuarios que podrían ser Saul (ajusta el correo si hace falta):
SELECT u.id, u.email, p.full_name, p.role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE LOWER(COALESCE(u.email, '')) LIKE '%saul%'
   OR LOWER(COALESCE(p.full_name, '')) LIKE '%saul%'
   OR LOWER(COALESCE(p.full_name, '')) LIKE '%saúl%'
   OR LOWER(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')) LIKE '%saul%';

-- ═══════════════════════════════════════════════════════════════════
-- PASO B — Limpieza (pega el UUID en saul_id_manual si no lo detecta)
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
    -- UUID de Saul (Authentication → Users)
    saul_id_manual UUID := '4c602656-fe19-412e-b8a0-ea931294b2b9';

    saul_id UUID;
    reemplazo_id UUID;
    n_jobs INT;
    n_movs INT;
BEGIN
    IF saul_id_manual IS NOT NULL THEN
        saul_id := saul_id_manual;
    ELSE
        SELECT p.id INTO saul_id
        FROM profiles p
        WHERE LOWER(TRIM(p.full_name)) LIKE '%saul%'
           OR LOWER(TRIM(p.full_name)) LIKE '%saúl%'
        LIMIT 1;

        IF saul_id IS NULL THEN
            SELECT u.id INTO saul_id
            FROM auth.users u
            LEFT JOIN profiles p ON p.id = u.id
            WHERE LOWER(COALESCE(u.email, '')) LIKE '%saul%'
               OR LOWER(COALESCE(p.full_name, '')) LIKE '%saul%'
               OR LOWER(COALESCE(p.full_name, '')) LIKE '%saúl%'
               OR LOWER(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')) LIKE '%saul%'
            LIMIT 1;
        END IF;
    END IF;

    IF saul_id IS NULL THEN
        RAISE EXCEPTION E'No se encontró a Saul.\n1) Ejecuta el PASO A y copia su UUID desde auth.users.\n2) Pégalo en saul_id_manual en este script (línea comentada) y vuelve a ejecutar el PASO B.';
    END IF;

    SELECT id INTO reemplazo_id
    FROM profiles
    WHERE id <> saul_id
      AND role IN ('admin', 'Staff')
    ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, full_name
    LIMIT 1;

    IF reemplazo_id IS NULL THEN
        RAISE EXCEPTION 'No hay otro usuario admin/Staff para reasignar trabajos/movimientos.';
    END IF;

    RAISE NOTICE 'Limpiando usuario % → reasignando a %', saul_id, reemplazo_id;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_tasks') THEN
        UPDATE staff_tasks SET assigned_to = NULL WHERE assigned_to = saul_id;
        UPDATE staff_tasks SET created_by = NULL WHERE created_by = saul_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_laboratorista_notes') THEN
        UPDATE job_laboratorista_notes SET updated_by = NULL WHERE updated_by = saul_id;
    END IF;

    UPDATE jobs SET created_by = reemplazo_id WHERE created_by = saul_id;
    GET DIAGNOSTICS n_jobs = ROW_COUNT;

    UPDATE jobs SET completed_by = NULL WHERE completed_by = saul_id;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'created_by'
    ) THEN
        UPDATE stock_movements SET created_by = reemplazo_id WHERE created_by = saul_id;
        GET DIAGNOSTICS n_movs = ROW_COUNT;
    ELSE
        n_movs := 0;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_reports') THEN
        UPDATE job_reports SET reported_by = reemplazo_id WHERE reported_by = saul_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'logistics_movements' AND column_name = 'performed_by'
    ) THEN
        UPDATE logistics_movements SET performed_by = NULL WHERE performed_by = saul_id;
    END IF;

    DELETE FROM profiles WHERE id = saul_id;

    RAISE NOTICE 'Listo: % trabajos reasignados, % movimientos reasignados. Perfil borrado (si existía).', n_jobs, n_movs;
    RAISE NOTICE 'Ahora ve a Authentication → Users y elimina al usuario con UUID %', saul_id;
END $$;
