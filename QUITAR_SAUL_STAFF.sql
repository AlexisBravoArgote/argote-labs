-- Saul ya no trabaja en el laboratorio: quitar perfil Staff.
-- Ejecutar en Supabase SQL Editor.
-- 1) Revisa el registro antes de borrar:

SELECT id, full_name, role, created_at
FROM profiles
WHERE LOWER(TRIM(full_name)) LIKE '%saul%'
   OR LOWER(TRIM(full_name)) LIKE '%saúl%';

-- 2) Elimina el perfil (no borra el usuario de Auth; hazlo aparte si quieres bloquear acceso):
DELETE FROM profiles
WHERE LOWER(TRIM(full_name)) LIKE '%saul%'
   OR LOWER(TRIM(full_name)) LIKE '%saúl%';

-- Opcional: deshabilitar login en Authentication > Users (banear o eliminar usuario).
