-- ============================================
-- CÓMO CREAR UN USUARIO DOCTOR
-- ============================================

-- PASO 1: Crear el usuario en Supabase Auth
-- Ve a: Authentication > Users > Add user
-- Completa:
--   - Email: (email del doctor)
--   - Password: (contraseña temporal)
--   - Auto Confirm User: ✅ (marcar esta opción)
-- Haz clic en "Create user"

-- PASO 2: Obtener el UUID del usuario recién creado
-- Ve a: Authentication > Users
-- Busca el usuario que acabas de crear
-- Copia el UUID (es un string largo como: 63a84109-3897-4a00-a206-fef57df0acf3)
-- IMPORTANTE: Copia SOLO el UUID, SIN corchetes []

-- PASO 3: Ejecuta este INSERT (reemplaza los valores entre corchetes)
-- ============================================
INSERT INTO profiles (id, full_name, role)
VALUES (
    'AQUI_VA_EL_UUID_SIN_CORCHETES',  -- Reemplaza con el UUID del paso 2
    'Nombre del Doctor',              -- Reemplaza con el nombre completo del doctor
    'doctor'                          -- Este debe ser exactamente 'doctor'
);

-- ============================================
-- EJEMPLO:
-- ============================================
-- INSERT INTO profiles (id, full_name, role)
-- VALUES (
--     '63a84109-3897-4a00-a206-fef57df0acf3',
--     'Dr. Alexis',
--     'doctor'
-- );
