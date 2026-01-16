# Fix para los errores "item no existe" y ver UID en lugar de nombres

## Problemas

1. **Error "item no existe"**: Cuando otros usuarios (como workwithdok@gmail.com) intentan remover bloques, reciben el error "item no existe", mientras que tu cuenta (abapax@gmail.com) funciona correctamente.

2. **Ver UID en lugar de nombres**: Cuando usuarios staff (no admin) ven el historial global, ven el UID en lugar del nombre del usuario (por ejemplo, ven el UUID en lugar de "Alexis").

## Causa de los problemas

### Problema 1: "item no existe"

El error ocurre porque:

1. **Políticas RLS restrictivas**: Las políticas de Row Level Security (RLS) en la tabla `items` pueden estar limitando el acceso a items basándose en quién los creó (`created_by`).

2. **Trigger sin SECURITY DEFINER**: El trigger que valida y actualiza el stock cuando se inserta un movimiento está usando una consulta SELECT que está sujeta a las políticas RLS. Cuando otro usuario intenta hacer un movimiento, el trigger no puede "ver" el item porque las políticas RLS lo filtran.

### Problema 2: Ver UID en lugar de nombres

El problema ocurre porque:

1. **Políticas RLS restrictivas en profiles**: La tabla `profiles` tiene políticas RLS que solo permiten a los usuarios ver su propio perfil, no los perfiles de otros usuarios.

2. **Consulta bloqueada**: Cuando el código intenta obtener los nombres de los usuarios que hicieron movimientos, la consulta a `profiles` está bloqueada por RLS, resultando en que solo se obtiene el UID.

## Solución

### Paso 1: (Opcional) Ejecutar el script de diagnóstico

Si quieres ver el estado actual de tu base de datos antes de aplicar el fix:

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido completo del archivo `DIAGNOSTICO_TRIGGERS.sql`
4. Ejecuta el script para ver qué triggers y políticas existen actualmente

### Paso 2: Ejecutar el script de corrección

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido completo del archivo `FIX_RLS_ITEMS.sql`
4. Ejecuta el script

Este script:
- Asegura que todos los usuarios autenticados puedan leer todos los items
- Elimina todos los triggers existentes en `stock_movements` para evitar conflictos
- Crea o reemplaza la función del trigger con `SECURITY DEFINER` para que pueda acceder a items sin restricciones RLS
- Configura las políticas RLS correctamente para `stock_movements`
- **NUEVO**: Asegura que todos los usuarios autenticados puedan leer todos los perfiles (esto arregla el problema de ver UID en lugar de nombres)

### Paso 3: Verificar que funciona

1. **Para el problema "item no existe"**:
   - Cierra sesión y vuelve a iniciar sesión con una cuenta diferente (como workwithdok@gmail.com)
   - Intenta remover un bloque de "prueba 2"
   - Debería funcionar correctamente ahora

2. **Para el problema de ver UID en lugar de nombres**:
   - Con la cuenta de workwithdok@gmail.com (o cualquier cuenta staff)
   - Ve al historial global
   - Deberías ver los nombres de los usuarios (como "Alexis") en lugar de los UIDs

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
