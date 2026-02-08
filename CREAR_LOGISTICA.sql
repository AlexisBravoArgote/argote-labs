-- ============================================
-- CREAR SISTEMA DE LOGÍSTICA
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- Este script crea las tablas necesarias para
-- el módulo de logística/inventario odontológico
-- ============================================

-- 1. Agregar valor 'logistica' al rol de profiles (si no existe)
-- Si tu columna role tiene un CHECK constraint, actualízalo:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
--     CHECK (role IN ('admin', 'staff', 'doctor', 'logistica'));

-- 2. Tabla de categorías de logística
CREATE TABLE IF NOT EXISTS logistics_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#6366f1', -- color para la UI
    icon TEXT DEFAULT 'box',      -- icono para la UI
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de items de logística (inventario odontológico tradicional)
CREATE TABLE IF NOT EXISTS logistics_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES logistics_categories(id) ON DELETE SET NULL,
    sku TEXT,                     -- código del producto
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 0,  -- stock mínimo para alertas
    unit TEXT DEFAULT 'unidad',   -- unidad de medida (unidad, caja, paquete, etc.)
    brand TEXT,                   -- marca del producto
    supplier TEXT,                -- proveedor
    cost DECIMAL(10,2),           -- costo unitario
    location TEXT,                -- ubicación en bodega/almacén
    notes TEXT,                   -- notas adicionales
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS logistics_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES logistics_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,                  -- motivo del movimiento
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_logistics_items_category ON logistics_items(category_id);
CREATE INDEX IF NOT EXISTS idx_logistics_items_active ON logistics_items(is_active);
CREATE INDEX IF NOT EXISTS idx_logistics_items_name ON logistics_items(name);
CREATE INDEX IF NOT EXISTS idx_logistics_movements_item ON logistics_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_logistics_movements_date ON logistics_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logistics_movements_type ON logistics_movements(type);

-- 6. Habilitar RLS
ALTER TABLE logistics_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_movements ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS - usuarios autenticados pueden leer y escribir
CREATE POLICY "Authenticated users can view logistics_categories" ON logistics_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage logistics_categories" ON logistics_categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view logistics_items" ON logistics_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage logistics_items" ON logistics_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view logistics_movements" ON logistics_movements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage logistics_movements" ON logistics_movements
    FOR ALL USING (auth.role() = 'authenticated');

-- 8. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_logistics_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_logistics_items_updated_at
    BEFORE UPDATE ON logistics_items
    FOR EACH ROW
    EXECUTE FUNCTION update_logistics_items_updated_at();

-- 9. Insertar categorías iniciales de ejemplo
INSERT INTO logistics_categories (name, description, color, icon) VALUES
    ('Materiales de Impresión', 'Siliconas, alginatos, cubetas', '#3b82f6', 'beaker'),
    ('Cementos y Adhesivos', 'Cementos dentales, adhesivos, primers', '#8b5cf6', 'flask'),
    ('Instrumental Rotatorio', 'Fresas, discos, pulidores', '#ef4444', 'cog'),
    ('Endodoncia', 'Limas, conos, selladores', '#f59e0b', 'tool'),
    ('Resinas y Composites', 'Resinas compuestas, bonding', '#10b981', 'cube'),
    ('Material Desechable', 'Guantes, mascarillas, eyectores', '#6366f1', 'shield'),
    ('Blanqueamiento', 'Geles, cubetas, lámparas', '#ec4899', 'sparkles'),
    ('Ortodoncia', 'Brackets, arcos, ligaduras', '#14b8a6', 'link'),
    ('Cirugía', 'Suturas, bisturís, hemostáticos', '#dc2626', 'scissors'),
    ('Otros', 'Artículos varios', '#6b7280', 'dots')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- CREAR USUARIO DE LOGÍSTICA
-- ============================================
-- Después de ejecutar este script:
-- 1. Crea un usuario en Auth de Supabase (Authentication > Users > Add user)
-- 2. Luego inserta su perfil con role = 'logistica':
--
-- INSERT INTO profiles (id, full_name, role)
-- VALUES ('UUID-DEL-USUARIO', 'Nombre Logística', 'logistica');
-- ============================================
