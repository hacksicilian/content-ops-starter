# Setup Supabase — TelecomOps
## Tiempo estimado: 15 minutos

---

## PASO 1 — Crear proyecto

1. Ir a **https://app.supabase.com** → **New project**
2. Completar:
   - **Name**: `telecomops`
   - **Database Password**: anotarlo
   - **Region**: `South America (São Paulo)`
3. Esperar ~2 min que termine de crear

---

## PASO 2 — Ejecutar el schema

1. Panel Supabase → **SQL Editor** (ícono `</>` en la barra lateral)
2. Click **"New query"**
3. Copiar todo el contenido de `supabase/schema.sql` y pegarlo
4. Click **RUN** (o `Ctrl+Enter`)
5. Resultado esperado: *"Success. No rows returned"*

---

## PASO 3 — Crear los 6 usuarios

Ir a **Authentication → Users → Invite user** y crear cada uno:

| Email | Nombre | Rol |
|-------|--------|-----|
| `pmo@empresa.com` | Tu nombre | `admin` |
| `alexis@empresa.com` | Alexis | `controller` |
| `marcelo@empresa.com` | Marcelo | `im_swap` |
| `eduardo@empresa.com` | Eduardo | `im_tss` |
| `leandro@empresa.com` | Leandro | `backoffice` |
| `jefe@empresa.com` | Nombre del jefe | `viewer` |

> ✅ **El perfil se crea automáticamente** gracias al trigger instalado en el schema.
> Por defecto el rol es `viewer` — hay que cambiarlo para cada usuario.

### Cambiar el rol de cada usuario

En **SQL Editor**, ejecutar (reemplazando el email):

```sql
UPDATE public.users SET name = 'Alexis García', role = 'controller'
WHERE email = 'alexis@empresa.com';

UPDATE public.users SET name = 'Marcelo López', role = 'im_swap'
WHERE email = 'marcelo@empresa.com';

UPDATE public.users SET name = 'Eduardo Ruiz', role = 'im_tss'
WHERE email = 'eduardo@empresa.com';

UPDATE public.users SET name = 'Leandro Sosa', role = 'backoffice'
WHERE email = 'leandro@empresa.com';

-- PMO (vos) — rol admin
UPDATE public.users SET name = 'Tu Nombre', role = 'admin'
WHERE email = 'pmo@empresa.com';
```

O desde la app: loguearte como admin → `/admin/usuarios` → cambiar el rol desde el dropdown.

---

## PASO 4 — Cargar datos de prueba (opcional pero recomendado)

Para ver la app funcionando con datos reales de muestra:

1. SQL Editor → New query
2. Copiar todo el contenido de `supabase/seed.sql`
3. Run

Incluye: 15 despliegues, tareas Kanban, stock, horas improductivas, accesos a sitios, facturas y planificación.

---

## PASO 5 — Configurar variables de entorno

1. En Supabase → **Settings** (⚙️) → **API**
2. Copiar los valores:

```
Project URL        → NEXT_PUBLIC_SUPABASE_URL
anon / public key  → NEXT_PUBLIC_SUPABASE_ANON_KEY
service_role key   → SUPABASE_SERVICE_ROLE_KEY
```

3. Abrir `.env.local` en la raíz del proyecto y reemplazar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## PASO 6 — Levantar la app

```bash
npm run dev
```

Abrir **http://localhost:3000** → Login con tu email y contraseña.

---

## PASO 7 — Deploy en Netlify (producción)

1. **Netlify** → tu sitio → **Site configuration** → **Environment variables**
2. Agregar las mismas 3 variables del `.env.local`
3. **Deploys** → **Trigger deploy**

La URL pública ya funciona para todos los usuarios.

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| "Invalid API key" al login | Verificar que las keys en `.env.local` son correctas (sin espacios) |
| Login OK pero app en blanco | El perfil de usuario no existe en `public.users` — correr el UPDATE de roles |
| Error 403 en operaciones | Las RLS policies están activas — verificar que el rol del usuario es correcto |
| Redirige siempre al login | El perfil en `public.users` tiene el mismo UUID que en `auth.users` — verificar |
| Datos del seed no cargan | Asegurarse de haber creado los usuarios ANTES de correr `seed.sql` |

---

## Roles y permisos

| Rol | Módulos accesibles |
|-----|--------------------|
| `admin` | Todo + Admin de usuarios |
| `controller` | Dashboard, Panel, Kanban, Stock, Inversas, Planif., Horas, RRHH, Facturación |
| `im_swap` | Dashboard, Panel, Kanban, Stock, Inversas, Horas, Planificación |
| `im_tss` | Dashboard, Panel, Kanban, Stock, Inversas, Horas, Planificación |
| `backoffice` | Dashboard, RRHH, Facturación, Accesos, Horas |
| `viewer` | Solo Dashboard (read-only) |
