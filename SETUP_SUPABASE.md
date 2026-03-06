# Setup Supabase — TelecomOps

## Paso 1: Crear proyecto en Supabase

1. Ir a **https://app.supabase.com**
2. Click **"New project"**
3. Completar:
   - **Name**: `telecomops` (o el nombre que quieras)
   - **Database Password**: guardarlo en un lugar seguro
   - **Region**: South America (São Paulo) — más cerca y más rápido
4. Esperar ~2 minutos que el proyecto se crea

---

## Paso 2: Ejecutar el Schema (base de datos)

1. En el panel de Supabase → ir a **SQL Editor** (ícono de código en la barra lateral)
2. Click **"New query"**
3. Copiar y pegar el contenido de `supabase/schema.sql`
4. Click **Run** (o Ctrl+Enter)
5. Deberías ver: *"Success. No rows returned"*

---

## Paso 3: Crear los 6 usuarios

En Supabase → **Authentication** → **Users** → **Invite user**

Crear uno por uno:

| Email | Nombre | Rol a asignar |
|-------|--------|---------------|
| `pmo@tuempresa.com` | Tu nombre | `admin` |
| `alexis@tuempresa.com` | Alexis | `controller` |
| `marcelo@tuempresa.com` | Marcelo | `im_swap` |
| `eduardo@tuempresa.com` | Eduardo | `im_tss` |
| `leandro@tuempresa.com` | Leandro | `backoffice` |
| `jefe@tuempresa.com` | (nombre del jefe) | `viewer` |

> **Importante**: Cada usuario recibirá un email con link para establecer contraseña.
> Si no querés usar email real, podés crear usuarios directamente desde SQL (ver abajo).

### Alternativa: crear usuarios via SQL (sin email real)

En SQL Editor, ejecutar por cada usuario:

```sql
-- Reemplazar email y password según corresponda
SELECT supabase_auth.create_user(
  email := 'pmo@telecomops.com',
  password := 'TuContraseña123!',
  email_confirm := true
);
```

---

## Paso 4: Asignar roles en la tabla `users`

Después de crear los usuarios en Auth, ir a **Table Editor** → tabla `users`.

Si los perfiles no se crearon automáticamente, ejecutar en SQL Editor
(reemplazando los UUIDs con los que aparecen en Authentication → Users):

```sql
INSERT INTO public.users (id, email, name, role) VALUES
  ('UUID-PMO',     'pmo@tuempresa.com',     'Tu Nombre',    'admin'),
  ('UUID-ALEXIS',  'alexis@tuempresa.com',  'Alexis García','controller'),
  ('UUID-MARCELO', 'marcelo@tuempresa.com', 'Marcelo López','im_swap'),
  ('UUID-EDUARDO', 'eduardo@tuempresa.com', 'Eduardo Ruiz', 'im_tss'),
  ('UUID-LEANDRO', 'leandro@tuempresa.com', 'Leandro Sosa', 'backoffice'),
  ('UUID-JEFE',    'jefe@tuempresa.com',    'Nombre Jefe',  'viewer');
```

> Los UUIDs los obtenés de: **Authentication → Users** → click en el usuario → copiar el `User UID`

---

## Paso 5: Cargar datos de ejemplo (opcional)

Para ver la app con datos reales de muestra:

1. SQL Editor → New query
2. Pegar el contenido de `supabase/seed.sql`
3. Run

---

## Paso 6: Configurar variables de entorno

1. En Supabase → **Settings** → **API**
2. Copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

3. Editar el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Paso 7: Levantar la app localmente

```bash
npm run dev
```

Ir a **http://localhost:3000** → te va a redirigir al login.

Ingresar con las credenciales creadas en el Paso 3.

---

## Paso 8: Deploy en Netlify (producción)

1. **Netlify** → tu sitio → **Site settings** → **Environment variables**
2. Agregar las 3 variables de `.env.local`
3. En Netlify → **Deploys** → trigger deploy

---

## Troubleshooting

### "Invalid API key" al iniciar sesión
→ Verificar que las variables en `.env.local` son correctas (sin espacios al final)

### Login muestra error aunque las credenciales son correctas
→ Verificar que el usuario existe en `Authentication → Users` Y en la tabla `public.users`

### Las páginas cargan pero sin datos
→ Ejecutar `supabase/seed.sql` para cargar datos de prueba

### Error 403 al hacer operaciones
→ Revisar las RLS Policies en Supabase → **Authentication → Policies** — verificar que están activas

### La app redirige siempre al login aunque estoy logueado
→ Verificar que el perfil del usuario existe en `public.users` con el mismo UUID de `auth.users`
