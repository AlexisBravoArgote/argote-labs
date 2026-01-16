# Fix para el error "item no existe"

## Problema

Cuando otros usuarios (como workwithdok@gmail.com) intentan remover bloques, reciben el error "item no existe", mientras que tu cuenta (abapax@gmail.com) funciona correctamente.

## Causa del problema

El error ocurre porque:

1. **Políticas RLS restrictivas**: Las políticas de Row Level Security (RLS) en la tabla `items` pueden estar limitando el acceso a items basándose en quién los creó (`created_by`).

2. **Trigger sin SECURITY DEFINER**: El trigger que valida y actualiza el stock cuando se inserta un movimiento está usando una consulta SELECT que está sujeta a las políticas RLS. Cuando otro usuario intenta hacer un movimiento, el trigger no puede "ver" el item porque las políticas RLS lo filtran.

## Solución

### Paso 1: Ejecutar el script SQL

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido completo del archivo `FIX_RLS_ITEMS.sql`
4. Ejecuta el script

Este script:
- Asegura que todos los usuarios autenticados puedan leer todos los items
- Crea o reemplaza la función del trigger con `SECURITY DEFINER` para que pueda acceder a items sin restricciones RLS
- Configura las políticas RLS correctamente para `stock_movements`

### Paso 2: Verificar que funciona

1. Cierra sesión y vuelve a iniciar sesión con una cuenta diferente (como workwithdok@gmail.com)
2. Intenta remover un bloque de "prueba 2"
3. Debería funcionar correctamente ahora

## Cambios en el código

También se agregó validación adicional en el cliente (`src/cerec/Inventario.jsx`) que:
- Verifica que el item existe antes de intentar el movimiento
- Muestra mensajes de error más claros
- Valida el stock disponible antes de permitir retiradas

## Notas importantes

- El script usa `CREATE OR REPLACE` así que es seguro ejecutarlo múltiples veces
- El script elimina y recrea las políticas, así que si tenías políticas personalizadas, necesitarás recrearlas después
- La función del trigger ahora usa `SECURITY DEFINER` que le permite ejecutarse con los permisos del creador de la función, no del usuario que hace la operación

## Si el problema persiste

1. Verifica que el script se ejecutó correctamente sin errores
2. Verifica que todos los usuarios tienen el rol `authenticated` en Supabase
3. Revisa los logs de Supabase para ver si hay otros errores
4. Asegúrate de que la tabla `items` tiene la columna `id` y `current_qty`
