# Piloto con datos compartidos

Pasos para que el equipo use la app publicada en https://reservao.github.io/gestiondeproyectos/ con los mismos datos para todos. Todo usa planes gratuitos y no requiere dominio propio.

- **GitHub Pages** publica la app (ya funciona).
- **Supabase** guarda los datos y las cuentas.

Se entra con **correo y contraseña**. Las cuentas las crea el administrador en Supabase; no hay registro público ni se envían correos. Cada persona puede cambiar su contraseña desde la app (menú lateral → **Cambiar contraseña**).

Durante el piloto todas las personas con cuenta ven y editan todo. No hay roles.

> Este repositorio es público: no escribas aquí la contraseña de la base, contraseñas de usuarios ni correos del equipo.

## 1. Crear el proyecto en Supabase

1. Entrar a [supabase.com](https://supabase.com) con la cuenta del piloto → **New project**.
2. Nombre: `gestion-proyectos-piloto`. Región: **South America (São Paulo)**. Plan: **Free**.
3. **Database password**: generar una y guardarla en un lugar seguro (no se usa en la app, pero sirve para administrar la base).
4. Esperar a que el proyecto termine de crearse (un par de minutos).

## 2. Crear las tablas

1. Menú izquierdo → **SQL Editor** → **New query**.
2. Pegar todo el contenido de [`supabase/schema.sql`](../supabase/schema.sql) y presionar **Run**.
3. Debe decir **Success. No rows returned**. En **Table Editor** aparecen las tablas (`proyectos`, `tareas`, etc.).

## 3. Cerrar el registro

**Authentication → Sign In / Providers** (en algunas versiones, **Authentication → Providers**):

- Desactivar **Allow new users to sign up**. Es la protección principal: solo entra quien tenga una cuenta creada por el administrador.
- En el proveedor **Email**: dejarlo activado, **Minimum password length** en `6` y **Secure password change** desactivado.

## 4. Conectar la app con Supabase

La app publicada necesita saber a qué proyecto de Supabase conectarse. Son dos datos:

1. **Project Settings** (engranaje abajo a la izquierda) → **Data API** o **API**: copiar la **Project URL** (`https://xxxx.supabase.co`).
2. **Project Settings → API Keys**: copiar la clave **publishable** (empieza con `sb_publishable_`) o, si no aparece, la **anon public**. **No** usar la `secret` ni la `service_role`.
3. En [`.github/workflows/pages.yml`](../.github/workflows/pages.yml), pegar esos valores en `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, y subir el cambio. GitHub vuelve a publicar la app solo, en unos dos minutos (pestaña **Actions** del repositorio).
4. Al abrir la app debe aparecer la pantalla para ingresar correo y contraseña.

Ambos datos son públicos por diseño: cualquier app web que use Supabase los lleva dentro. Lo que protege los datos es que el registro esté cerrado (paso 3) y que la base solo responda a personas con sesión iniciada.

## 5. Crear las cuentas

Por cada persona: **Authentication → Users → Add user → Create new user**.

- Correo y una contraseña inicial (mínimo 6 caracteres).
- Marcar **Auto Confirm User**.

Enviar a cada persona su contraseña inicial por un canal privado y pedirle que la cambie al entrar (menú lateral → **Cambiar contraseña**).

Después, en la app:

1. Crear las **líneas de negocio** (botón ⚙ del menú lateral).
2. Pantalla **Equipo**: crear a cada persona (nombre, rol, color). Las cuentas y la lista del equipo son independientes: la cuenta sirve para entrar y la persona sirve para asignar proyectos y tareas.

## Mantención de cuentas

- **Alguien olvidó su contraseña**: en **SQL Editor**, ejecutar (cambiando el correo y la contraseña):

  ```sql
  update auth.users
  set encrypted_password = extensions.crypt('ContraseñaNueva123', extensions.gen_salt('bf'))
  where email = 'persona@empresa.com';
  ```

  Otra opción: borrar la cuenta y crearla de nuevo con el mismo correo. Los datos de la app no se pierden, porque no están ligados a la cuenta.

- **Quitar el acceso**: **Authentication → Users → ⋯ → Delete user**. Su sesión abierta deja de funcionar en menos de una hora.

## Qué vigilar durante el piloto

- **Pausa por inactividad**: Supabase pausa el proyecto gratuito tras una semana sin uso. Los datos se conservan y se reactiva desde el panel con **Restore project**.
- **Transferencia** (límite de 5 GB al mes): cada cambio hace que las pantallas abiertas descarguen todos los datos. Con 15 personas debería alcanzar, pero conviene revisar **Usage** en el panel cada cierta cantidad de semanas.
- **Respaldos**: el plan gratuito no los hace. Cada cierto tiempo, exportar las tablas a CSV desde **Table Editor**, sobre todo `proyectos`, `actividades`, `tareas` y `notas`.
- **Datos del modo demo**: lo que cada persona haya ingresado en su navegador no se traspasa a Supabase.
- **Enlaces para clientes**: siguen funcionando sin inicio de sesión, igual que antes.
