-- ============================================
-- CÓMO CREAR UN USUARIO ASISTENTE DENTAL
-- ============================================
-- Requisito: ejecutar antes AGREGAR_ROL_ASISTENTE_DENTAL.sql

-- PASO 1: Crear el usuario en Supabase Auth
-- Authentication > Users > Add user
--   - Email y contraseña
--   - Auto Confirm User: activado

-- PASO 2: Copiar el UUID del usuario (sin corchetes)

-- PASO 3: Ejecutar este INSERT
INSERT INTO profiles (id, full_name, role)
VALUES (
    'AQUI_VA_EL_UUID_SIN_CORCHETES',
    'Nombre del Asistente',
    'asistente_dental'
);

-- EJEMPLO:
-- INSERT INTO profiles (id, full_name, role)
-- VALUES (
--     '63a84109-3897-4a00-a206-fef57df0acf3',
--     'María López',
--     'asistente_dental'
-- );
