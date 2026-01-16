-- Fix para el problema de "item no existe" cuando otros usuarios intentan remover bloques
-- Este script asegura que todos los usuarios autenticados puedan leer todos los items
-- y que los triggers puedan validar la existencia de items

-- IMPORTANTE: Ejecuta este script en el SQL Editor de Supabase

-- 1. Asegurar que RLS está habilitado en items (si no lo está, esto no hará nada)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas restrictivas existentes que puedan limitar el acceso por created_by
DROP POLICY IF EXISTS "Users can only view their own items" ON items;
DROP POLICY IF EXISTS "Users can view items" ON items;
DROP POLICY IF EXISTS "All authenticated users can view all items" ON items;

-- 3. Crear política que permita a todos los usuarios autenticados leer todos los items
CREATE POLICY "All authenticated users can view all items" ON items
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 4. Asegurar que los usuarios autenticados puedan insertar en stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert stock movements" ON stock_movements;
DROP POLICY IF EXISTS "All authenticated users can insert stock movements" ON stock_movements;

CREATE POLICY "All authenticated users can insert stock movements" ON stock_movements
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 5. Asegurar que los usuarios autenticados puedan leer stock_movements
DROP POLICY IF EXISTS "Users can view stock movements" ON stock_movements;
DROP POLICY IF EXISTS "All authenticated users can view stock movements" ON stock_movements;

CREATE POLICY "All authenticated users can view stock movements" ON stock_movements
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 6. Crear o reemplazar la función del trigger con SECURITY DEFINER
-- Esto es CRÍTICO: la función debe usar SECURITY DEFINER para poder acceder a items
-- sin estar restringida por RLS
CREATE OR REPLACE FUNCTION update_item_stock_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Esto permite que la función ejecute con permisos del creador, no del usuario
SET search_path = public
AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Verificar que el item existe (usando SECURITY DEFINER, esto no está restringido por RLS)
    SELECT * INTO item_record FROM items WHERE id = NEW.item_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'item no existe';
    END IF;
    
    -- Actualizar current_qty en items
    UPDATE items
    SET current_qty = current_qty + NEW.delta
    WHERE id = NEW.item_id;
    
    -- Verificar que current_qty no sea negativo
    SELECT current_qty INTO item_record FROM items WHERE id = NEW.item_id;
    IF item_record.current_qty < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente: no se puede retirar más de lo disponible';
    END IF;
    
    RETURN NEW;
END;
$$;

-- 7. Crear o reemplazar el trigger
DROP TRIGGER IF EXISTS trigger_update_item_stock ON stock_movements;

CREATE TRIGGER trigger_update_item_stock
    BEFORE INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_item_stock_on_movement();

-- 8. Verificar que todo está correcto
-- Puedes ejecutar esto para verificar las políticas:
-- SELECT * FROM pg_policies WHERE tablename IN ('items', 'stock_movements');
