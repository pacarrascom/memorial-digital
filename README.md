# Dorsera Memorial

Memoriales digitales accesibles mediante código QR, integrados con el ecosistema Dorsera.

Este repo contiene por ahora la app **`public-memorial`** (la página que abre el QR físico), el esquema de base de datos y la Edge Function de generación de QR. `family-dashboard` y `admin` se añaden como próximo paso siguiendo la misma estructura.

---

## 1. Requisitos

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase` o npm)
- Docker (para correr Supabase localmente)
- Cuenta en [Vercel](https://vercel.com) y en [Supabase](https://supabase.com)

---

## 2. Desarrollo local

### 2.1 Levantar Supabase local
```bash
cd supabase
supabase start
```
Esto levanta Postgres, Auth, Storage y Studio local (`http://localhost:54323`).

### 2.2 Aplicar el esquema
```bash
supabase db push
```
Esto ejecuta `supabase/migrations/0001_schema.sql` (tablas, RLS, funciones).

### 2.3 Crear el bucket de Storage
Desde Studio local (o `supabase storage`), crea el bucket `memorial-assets` con acceso público de lectura (la escritura queda controlada por las políticas RLS ya definidas a nivel de tabla).

### 2.4 Levantar la app
```bash
cd apps/public-memorial
cp .env.example .env.local
# completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
# (supabase start te los imprime en consola)
npm install
npm run dev
```
Abre `http://localhost:3000`. Para ver un memorial de prueba, inserta una fila de ejemplo en `memorials` + `person_profile` desde Studio local y visita `http://localhost:3000/m/{slug}`.

---

## 3. Desplegar a producción

Sigue exactamente el orden de la **estrategia de despliegue** ya definida para el proyecto:

### 3.1 Supabase (producción)
1. Crea un proyecto nuevo en [supabase.com](https://supabase.com) — **uno para staging y otro para producción**, nunca el mismo.
2. Vincula el CLI: `supabase link --project-ref <tu-project-ref>`
3. Aplica el esquema: `supabase db push`
4. Crea el bucket `memorial-assets` en el proyecto de producción (igual que en local).
5. Despliega la función de QR:
   ```bash
   supabase functions deploy generate-qr --project-ref <tu-project-ref>
   supabase secrets set PUBLIC_BASE_URL=https://dorsera.com --project-ref <tu-project-ref>
   ```

### 3.2 Vercel (frontend)
1. Importa el repositorio en Vercel.
2. **Root Directory**: `apps/public-memorial` (clave en un monorepo — así Vercel solo construye esta app).
3. Variables de entorno en Vercel (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Dominio: añade `dorsera.com` en Vercel → Settings → Domains, y configura los registros DNS que Vercel indique.
5. Deploy. Cada push a `main` despliega a producción; cada PR genera un preview.

### 3.3 CI/CD para el backend
Añade el workflow `.github/workflows/supabase-deploy.yml` (ya definido en la estrategia de despliegue) con estos secrets en GitHub:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

Con esto, cada cambio en `supabase/migrations` o `supabase/functions` fusionado a `main` se despliega solo, en el orden correcto (migraciones → functions).

---

## 4. Estructura del proyecto

```
apps/public-memorial/   → landing pública de cada memorial (Next.js)
supabase/migrations/    → esquema de base de datos + RLS
supabase/functions/     → Edge Functions (ej. generate-qr)
docs/api.md             → documentación de la API REST
```

## 5. Próximos pasos de desarrollo
- Scaffold de `apps/family-dashboard` (panel de administración familiar).
- Scaffold de `apps/admin` (Super Administrador / Empresa Funeraria).
- Endpoints REST reales (actualmente el frontend consulta Supabase directo vía RLS; a medida que se sume lógica de negocio compleja — límites de plan, IA — conviene mover esas operaciones a Edge Functions/Route Handlers documentadas en `docs/api.md`).
