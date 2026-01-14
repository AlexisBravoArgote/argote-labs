# Instrucciones para configurar las tablas de Trabajos en Supabase

Para que la funcionalidad de Trabajos Pendientes funcione correctamente, necesitas crear dos tablas en tu base de datos Supabase.

## Paso 1: Crear las tablas

Ve a tu proyecto en Supabase → SQL Editor y ejecuta el siguiente script:

```sql
-- Tabla para trabajos (jobs)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_type TEXT NOT NULL,
    treatment_name TEXT, -- Solo se usa si treatment_type = 'otra'
    patient_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    completed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Tabla para materiales de trabajos (job_materials)
CREATE TABLE IF NOT EXISTS job_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_materials_job_id ON job_materials(job_id);
```

## Paso 2: Configurar Row Level Security (RLS)

Si tu proyecto usa RLS, ejecuta también:

```sql
-- Habilitar RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_materials ENABLE ROW LEVEL SECURITY;

-- Política para jobs: todos los usuarios autenticados pueden leer y crear
CREATE POLICY "Users can view jobs" ON jobs
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create jobs" ON jobs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update jobs" ON jobs
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Política para job_materials: todos los usuarios autenticados pueden leer y crear
CREATE POLICY "Users can view job_materials" ON job_materials
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create job_materials" ON job_materials
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
```

## Notas importantes

1. **Aditamientos**: Para que "Corona sobre implante" funcione correctamente, asegúrate de que los aditamientos en tu inventario:
   - Tengan la categoría `other`, O
   - Tengan la palabra "aditamiento" en su nombre (no importa mayúsculas/minúsculas)

2. **Cubos**: Los cubos deben tener la categoría `bloc` para aparecer en la selección de materiales.

3. **Tratamientos sin materiales**: Los siguientes tratamientos no requieren materiales:
   - Guía quirúrgica
   - Guardas
   - Modelo de ortodoncia

¡Listo! Una vez ejecutado el script, la funcionalidad de Trabajos Pendientes estará disponible.

