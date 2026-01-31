-- Script para agregar la categoría "anillas" a la restricción CHECK de la tabla items
-- Este script elimina la restricción existente y crea una nueva que incluye "anillas"

-- Eliminar la restricción existente
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check;

-- Crear la nueva restricción que incluye "anillas"
ALTER TABLE items ADD CONSTRAINT items_category_check 
    CHECK (category IN ('bloc', 'bur', 'anillas', 'other'));
