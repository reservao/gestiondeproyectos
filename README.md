# Gestión de Proyectos

App interna para gestionar de forma centralizada los proyectos del equipo y el trabajo de cada semana. Todo el equipo tiene el mismo acceso, sin roles.

## Qué incluye (v0.1)

- **Inicio**: entregables, hitos y tareas de esta semana o de la próxima, cosas atrasadas y estado de cada proyecto (avance de la Gantt, hitos cumplidos o vencidos, próximo hito y próximo entregable).
- **Proyectos**: código, cliente, fechas, estado, jefe de proyecto y consultores. Cada proyecto tiene:
  - **Gantt**: actividades con responsable y % de avance. Las barras se arrastran para mover fechas y se estiran desde los bordes. Entregables e hitos aparecen como ◆.
  - **Hitos de gestión**: checklist para marcar si se cumplió cada hito, con fecha planificada, fecha real y notas (n° de OC, n° de factura…). Cada proyecto nuevo trae la plantilla: kick off interno, firma de ficha de inicio, creación de PEP, kick off con cliente, OC, factura, cierre y ficha de cierre. Se pueden agregar más (Factura 2, etc.).
  - **Entregables**: qué se entrega, cuándo y quién es responsable.
  - **Tareas**: kanban (Por hacer / En curso / En revisión / Hecho) con responsable, fecha y prioridad. Las atrasadas se marcan en rojo.
- **Semana**: lo que toca hacer en la semana, **por persona** o **por proyecto**. Junta lo que viene de los proyectos (actividades de la Gantt, entregables, hitos y tareas) con pendientes que se agregan a mano para esa semana. En la semana actual también aparece lo atrasado.
- **Gantt general**: todos los proyectos activos en una sola línea de tiempo, con filtro por persona.
- **Equipo**: personas, sus proyectos (como jefe o consultor) y su carga de la semana.

## Probarla en local

```bash
npm install
npm run dev
```

Sin configurar nada, la app funciona en **modo demo**: guarda los datos en el navegador y arranca con datos de ejemplo. Se pueden borrar con "Reiniciar datos de ejemplo", en el menú lateral.

## Usarla en equipo (datos compartidos con Supabase)

1. Crear un proyecto gratuito en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecutar [`supabase/schema.sql`](supabase/schema.sql).
3. Copiar `.env.example` a `.env` y completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Están en Project Settings → API.
4. En Authentication → URL Configuration, agregar la URL donde se publique la app.
5. `npm run build` y publicar la carpeta `dist/`, por ejemplo en Vercel, Netlify o GitHub Pages.

Cada persona entra con un enlace que le llega al correo. Los cambios de uno se ven en tiempo real en las pantallas de los demás.

## Stack

React + TypeScript + Vite, Tailwind CSS, date-fns y Supabase (opcional). La Gantt y el kanban están hechos a mano, sin librerías externas.

## Documentación

- [Investigación de alternativas](docs/investigacion-alternativas.md)
