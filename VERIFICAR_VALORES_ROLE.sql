-- Verificar valores exactos de role (incluyendo espacios y mayúsculas/minúsculas)
SELECT 
    role,
    LENGTH(role) as longitud,
    COUNT(*) as cantidad,
    '"' || role || '"' as con_comillas
FROM profiles
GROUP BY role
ORDER BY role;

-- Verificar si hay valores NULL
SELECT COUNT(*) as cantidad_nulos
FROM profiles
WHERE role IS NULL;

-- Verificar si hay espacios al inicio o final
SELECT 
    id,
    '"' || role || '"' as role_con_comillas,
    LENGTH(role) as longitud
FROM profiles
WHERE role LIKE ' %' OR role LIKE '% ' OR role IS NULL;
