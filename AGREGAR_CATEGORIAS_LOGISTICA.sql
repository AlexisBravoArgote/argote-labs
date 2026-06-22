-- Categorías adicionales para inventario de logística
-- Ejecutar en Supabase SQL Editor

INSERT INTO logistics_categories (name, description, color, icon) VALUES
    ('General', 'Artículos generales', '#6b7280', 'box'),
    ('Limpieza', 'Productos de limpieza e higiene', '#06b6d4', 'sparkles'),
    ('Laboratorio', 'Materiales de laboratorio', '#3b82f6', 'beaker'),
    ('Fresas y pulidores', 'Fresas, discos y pulidores', '#ef4444', 'cog'),
    ('Farmacia', 'Medicamentos y productos farmacéuticos', '#10b981', 'flask')
ON CONFLICT (name) DO NOTHING;
