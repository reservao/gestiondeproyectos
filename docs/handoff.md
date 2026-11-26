# Handoff — Gestión de Proyectos y futuro hub de herramientas

Documento para retomar el trabajo **en otro computador y en un chat nuevo** con Claude Code.
Actualizado: **26-11-2026**. Estado: **plan aprobado, en pausa**. No se ha empezado a construir el hub.

> **Para Claude (chat nuevo):** lee este archivo completo y luego `README.md`. Las decisiones de la sección 2 ya están tomadas por el responsable: no las vuelvas a discutir salvo que él lo pida. No empieces ninguna etapa del plan (sección 3) sin que el responsable lo indique. La interfaz usa español de Chile con tuteo, sin voseo.

> **Ojo:** este repositorio es **público**. No escribas aquí claves, correos personales ni datos de clientes.

---

## 1. Estado actual

- **La app** es un gestor de proyectos interno (detalle en `README.md`): Inicio, Semana, Gantt general, Proyectos (Gantt, hitos de gestión, entregables, notas, tareas), Equipo, líneas de negocio y enlace de solo lectura para clientes.
- **Stack**: React 19, TypeScript, Vite, Tailwind 4, date-fns, Supabase opcional. Sin pruebas automáticas.
- **Datos**: hoy funciona en **modo demo** (datos en el navegador de cada persona). El modo Supabase existe en el código pero nunca se configuró.
- **Publicación**: GitHub Pages con el workflow `.github/workflows/pages.yml`, en https://reservao.github.io/gestiondeproyectos/. Desde el 24-11-2026 sirve la app compilada (el 23-11 se veía en blanco porque Pages servía el código fuente).
- **Repositorio**: el dueño es `reservao`. El responsable tiene permiso de **escritura**, no de administrador (no puede cambiar Settings, secretos de Actions ni colaboradores).
- **Respaldo**: copia privada completa, con historial, en la cuenta de GitHub del responsable (`gestiondeproyectos`, creada el 26-11-2026). No se sincroniza sola: para actualizarla, `git push` a ese remoto.

## 2. Decisiones tomadas (24-11-2026)

El objetivo es convertir esta app en un **hub**: un gestor de proyectos que además aloje otras herramientas internas, con **un solo inicio de sesión** y un **rol distinto por herramienta**.

| Tema | Decisión |
|---|---|
| Forma | **Una sola app**: cada herramienta es un módulo dentro del mismo código. Nada de apps separadas con inicio de sesión compartido |
| Alcance de la primera versión | **Solo el gestor de proyectos + usuarios y roles + la estructura para integrar herramientas**. Ninguna otra herramienta se integra todavía |
| Repositorio del hub | **Repositorio nuevo en la cuenta del responsable** (nombre por confirmar, propuesta `hub-herramientas`, privado) |
| Base de datos y cuentas | **Proyecto nuevo de Supabase**, región São Paulo. Será el único sistema de cuentas del hub |
| Inicio de sesión | **Solo correo y contraseña**. Sin Google ni Microsoft. Sin registro público: se entra por invitación |
| Correo | **Brevo** (SMTP para invitaciones y recuperación de contraseña), como en la herramienta Solicitudes de Diseño |
| Roles globales | Un **superadmin** (todas las herramientas) y un **admin por herramienta** |
| Permisos de admin de herramienta | Invita personas y da o quita acceso **a su herramienta**. Solo el superadmin desactiva cuentas y nombra admins |
| Cuentas | **Todos** los miembros del equipo tendrán cuenta |
| Modo demo | **Se elimina** |
| Menú | Menú **desplegable** en la barra superior con las herramientas. Muestra las que la persona puede usar; el superadmin ve todas, incluidas las desactivadas o en desarrollo |
| Hosting | Recomendado **Cloudflare (Workers con archivos estáticos)**, dominio gratuito `workers.dev`. No decidido formalmente (sección 6) |

### Roles en Gestión de Proyectos (aprobados)

Hoy la app **no tiene permisos**: el campo "rol" de cada persona es texto libre y jefe/consultores son asignaciones por proyecto. Se reutilizan esos conceptos como roles reales:

| Rol | Ve | Edita |
|---|---|---|
| Superadmin | Todo el hub | Todo; crea usuarios y nombra admins |
| Admin de Gestión | Todo en Gestión | Todo en Gestión; asigna roles en Gestión |
| Jefe de proyecto | Todos los proyectos | Crea proyectos; edita todo en los que dirige |
| Consultor | Todos los proyectos | Tareas, avance de la Gantt y notas de los proyectos donde participa; su planificación semanal |

La pantalla **Equipo** pasa a mostrar los usuarios con acceso a Gestión (desaparece la tabla `personas` como lista aparte).

## 3. Plan por etapas

Trabajar **una rama por etapa** y que el responsable apruebe cada una antes de seguir.

1. **Preparación**
   - Crear el repositorio nuevo y traer este código con su historial.
   - Responsable: crear el proyecto de Supabase (São Paulo, registro público desactivado, contraseña mínima de 8) y tener la clave SMTP de Brevo.
   - Avisar a `reservao` antes de mover el código (es su repositorio y no tiene licencia).
2. **Base técnica**
   - Pasar `supabase/schema.sql` a migraciones versionadas (`supabase/migrations/`) con pruebas de seguridad por rol.
   - Eliminar el modo demo (`BackendLocal`, datos de ejemplo, `npm run build:demo`).
   - Corregir la recarga completa (sección 7, punto 2).
3. **Usuarios**
   - Tablas `perfiles` (con marca de superadmin y `activo`), `herramientas` y `accesos` (usuario, herramienta, rol).
   - Login, invitación, definir contraseña, recuperación, cerrar sesión y cierre por inactividad.
   - Función de servidor (Edge Function) para invitar y desactivar usuarios: crear cuentas exige la clave de servicio, que nunca va al navegador.
   - Panel de usuarios: el superadmin ve todo; cada admin, solo su herramienta.
4. **Estructura del hub**
   - Registro de herramientas: una carpeta por herramienta (`src/herramientas/<slug>/`) con su ficha (nombre, ícono, ruta, roles, tipo).
   - Menú desplegable, página de inicio y protección contra errores por herramienta (si una falla, el resto sigue).
   - Soporte para herramientas **nativas** y **embebidas** (sección 4).
   - Comando y plantilla para crear una herramienta nueva, más una guía corta.
   - Gestión de Proyectos queda como la única herramienta registrada.
5. **Roles en Gestión**: aplicar la tabla de la sección 2 en la base de datos (RLS) y en las pantallas.
6. **Pruebas y publicación**: un usuario de prueba por rol (más uno desactivado) y publicación en Cloudflare.

### Reglas para construirlo

- **Toda autorización en la base de datos** (RLS y funciones SQL). Ocultar botones es comodidad, no seguridad.
- El rol se lee siempre de las tablas, **nunca de `user_metadata`**. Toda política verifica que el perfil esté activo.
- La clave de servicio solo vive en secretos de Edge Functions y en `.env.local`.
- Cada herramienta guarda sus tablas en su propio esquema de Postgres.

## 4. Cómo se integrarán herramientas más adelante

| | Nativa | Embebida |
|---|---|---|
| Qué es | Módulo escrito dentro del hub | App independiente mostrada dentro del hub, con el menú visible |
| Cuándo | Guarda datos, necesita roles o saber quién es el usuario | Solo procesa archivos en el navegador y no guarda nada |
| Código | En el repositorio del hub | En su propio repositorio; el hub copia una versión fija |

Una embebida puede pasar a nativa cuando necesite datos o roles. El código de una página web es público: lo que se protege son los datos. En una embebida sin datos, el acceso consiste en mostrarla o no en el hub.

**Mantenimiento y actualización**

- Todo cambio va por rama y pull request. El CI revisa tipos y corre las pruebas; al aprobarse, Cloudflare publica solo.
- Los cambios de base de datos van como migraciones en el mismo flujo, nunca a mano en el panel.
- Embebidas: una tarea automática detecta versiones nuevas en su repositorio y abre un pull request en el hub.
- Cloudflare guarda versiones anteriores para volver atrás. Las migraciones se corrigen con otra migración.
- El superadmin activa, desactiva o marca "en desarrollo" una herramienta desde la base de datos, sin publicar código.
- En el repositorio del hub conviene exigir pull request para publicar y asignar un responsable por carpeta (`CODEOWNERS`).

**Agregar una herramienta**: crear la carpeta con el comando y la plantilla → migración que la registra (y, si es nativa, sus tablas y RLS) → pull request → aparece "en desarrollo" → el superadmin la activa y su admin da acceso.

### Inventario de herramientas futuras (no integrar todavía)

| Herramienta | Qué es | Tipo previsto | Roles |
|---|---|---|---|
| EquipoTCT (`reservao/EquipoTCT`) | HTML/JS estático, convierte Word de competencias en Excel en el navegador (SOT, Carga, Plano) | Embebida | Solo acceso |
| Analizador de Encuestas (`reservao/Analizador-de-Encuestas`) | Un HTML de ~700 KB con librerías desde CDN | Embebida | Solo acceso |
| Previsión de Consumo (`reservao/prevision-consumo-app`) | Flask + pandas en Render. Cloudflare no ejecuta Python | Nativa, reescrita en JavaScript (~300 líneas) | Solo acceso |
| Solicitudes de Diseño (repositorio privado del responsable) | App completa en piloto (React + Supabase, roles `colaborador`, `disenador`, `admin`) | Nativa, se migra **solo si el piloto funciona** | Sus tres roles, como accesos a esa herramienta |

El repositorio `reservao/prueba` no es una herramienta.

**Solicitudes de Diseño como referencia**: usa el mismo stack y sirve de base para la etapa 3. Su `src/lib/auth`, sus pantallas de login, invitación y recuperación, su función `admin-users`, sus migraciones con pruebas pgTAP y su `docs/guia-cuentas.md` (Supabase, Brevo, Cloudflare) se pueden adaptar. Su decisión J-16 ya preveía integrarse a un hub. Al migrarla habrá que mover tablas, adjuntos, cola de correos, tarea diaria y respaldos; las contraseñas en principio se pueden conservar entre proyectos de Supabase, pero hay que probarlo. Después se elimina su proyecto de Supabase para liberar el cupo gratuito.

## 5. Funciones recientes que el plan debe respetar

- **Enlace para clientes** (`src/lib/compartir.ts`, ruta `#/cliente/...`): la Gantt viaja comprimida dentro del enlace, sin servidor ni login. En el hub debe seguir siendo una ruta pública. Un enlace ya enviado **no se puede revocar** y muestra la foto del momento en que se generó.
- **Líneas de negocio**: tabla `lineas_negocio`, obligatoria al crear un proyecto, con filtro general guardado en el navegador.

## 6. Publicación: Cloudflare frente a Vercel (evaluado 23-11-2026)

**Recomendado Cloudflare.** La app es estática y el responsable ya tiene cuenta.

- **Cloudflare Workers (gratis)**: archivos estáticos sin costo ni tope de peticiones, 100 Workers por cuenta, 3.000 minutos de build al mes. Se puede publicar desde el PC con `wrangler deploy`, sin depender del dueño del repositorio. Cloudflare Access protege la página (gratis hasta 50 usuarios), pero no la API de Supabase.
- **Vercel, descartado**: el plan Hobby es solo para uso personal o no comercial (una herramienta de empresa exige Pro, desde US$20 de crédito al mes) y bloquea despliegues de quien no es dueño de la cuenta.
- Con una sola app, el dominio gratuito `workers.dev` sirve. Un dominio propio solo haría falta para compartir sesión entre apps separadas.

**Límites del plan gratuito de Supabase**

| Límite | Impacto |
|---|---|
| 2 proyectos activos | El responsable ya usa uno (Solicitudes); el hub ocupa el segundo |
| 500 MB de base, 50.000 usuarios al mes, 200 conexiones en tiempo real | Suficiente |
| 5 GB de transferencia al mes | Riesgo por la recarga completa (sección 7) |
| 2 correos de autenticación por hora | Bloqueante sin SMTP propio: se resuelve con Brevo (300 al día gratis) |
| Sin respaldos automáticos | Programar un respaldo semanal con GitHub Actions, como Solicitudes |
| Pausa tras 1 semana sin uso | Riesgo en vacaciones; los datos se conservan |

## 7. Problemas conocidos del código actual

1. **Seguridad**: `schema.sql` da acceso total a cualquier usuario autenticado y el login crea cuentas para cualquier correo. Si se activara Supabase tal cual, cualquiera podría registrarse y ver o borrar todo. Lo resuelven las etapas 1, 3 y 5.
2. **Transferencia**: cada cambio hace que todas las pantallas abiertas descarguen la base completa (`recargar` en `src/lib/store.tsx`). Ejemplo: 1 MB de datos, 8 personas y 50 cambios al día dan unos 9 GB al mes, casi el doble del límite.
3. **Sin cerrar sesión, sin roles** y la cuenta no está vinculada a una persona del equipo.
4. El workflow de Pages **no pasa** `VITE_SUPABASE_URL` ni `VITE_SUPABASE_ANON_KEY`: aunque se configure Supabase, lo publicado seguiría en modo demo.
5. `schema.sql` usa nombres genéricos (`personas`, `proyectos`) y no debe ejecutarse en un proyecto de Supabase que tenga otros datos.

## 8. Pendientes y preguntas abiertas

- Confirmar el nombre del repositorio del hub (propuesta `hub-herramientas`, privado).
- Avisar a `reservao` del plan y del traslado del código.
- ¿Qué roles pueden generar enlaces para clientes? Propuesta: admin de Gestión y jefe del proyecto.
- ¿Las líneas de negocio limitan permisos (por ejemplo, un jefe que solo ve su línea) o son solo un filtro? Hoy son solo un filtro.
- Remitente de Brevo: sin dominio de la empresa, los correos pueden caer en spam.

## 9. Cómo retomar en otro computador

1. Instalar Node.js 22 o superior, Git y GitHub CLI (`gh auth login`).
2. Clonar: `git clone https://github.com/reservao/gestiondeproyectos.git` (o el respaldo privado de la cuenta del responsable).
3. `npm install` y `npm run dev`. Sin `.env`, la app arranca en modo demo.
4. Para revisar Solicitudes de Diseño como referencia, clonar su repositorio privado y leer su `docs/handoff.md`.
5. Abrir Claude Code en la carpeta y pedirle que lea este archivo. Indicarle qué etapa del plan quieres empezar.
