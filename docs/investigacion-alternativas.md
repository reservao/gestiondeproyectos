# Investigación: app de gestión de proyectos para el equipo

> Fecha: octubre 2026. Objetivo: centralizar proyectos, ver su carga y estado, controlar la facturación y repartir las tareas del equipo semana a semana.

## 1. Qué necesitamos (requisitos iniciales)

| Necesidad | Detalle |
|---|---|
| Cartera de proyectos | Lista central con cliente, responsable, fechas, presupuesto, estado (propuesta / activo / pausado / cerrado) y semáforo de salud |
| Carga de trabajo | Horas planificadas frente a horas reales por proyecto y por persona |
| Facturación | Hitos facturables, qué está facturado, cobrado o pendiente, y % facturado del presupuesto |
| Planificación semanal | Quién hace qué cada semana: vista persona × semana con su capacidad |
| Avance | % completado, tareas abiertas y cerradas, últimas novedades por proyecto |
| Tareas | Kanban o lista por proyecto, con asignado, fecha y estimación |

## 2. Qué dicen los directorios de "hazlo tú mismo"

**[canivibecodeit.com](https://canivibecodeit.com/)** analiza 1.093 apps y valora si hoy se pueden reemplazar con una app hecha con IA:

- **Gestión de proyectos** (Jira, Trello, Asana, Basecamp, ClickUp, monday, Teamwork, Wrike, Smartsheet): todas salen **"KINDA"**. Se puede hacer una versión interna, pero no conviene intentar igualar todas sus funciones.
- **Tareas** (Todoist, TickTick, Any.do, Fibery): **"YES"**.
- **Control de horas** (Toggl, Harvest, Clockify): **"KINDA"**.
- **Facturación**: Invoice Ninja sale **"YES"** (y es open source). QuickBooks y Xero salen **"NOT REALLY"**: la contabilidad formal no se debe reconstruir.

**Conclusión:** una herramienta interna a medida para nuestro caso es viable. La contabilidad y la emisión legal de facturas deben quedarse en una herramienta existente.

**[gorvgoyl/clone-wars](https://github.com/gorvgoyl/clone-wars)** son clones open source útiles como referencia de código:

| Clon de | Repo | Stack | Utilidad para nosotros |
|---|---|---|---|
| Jira | [sebastianfdz/jira_clone](https://github.com/sebastianfdz/jira_clone) | Next.js, React Query, Radix, Tailwind | Backlog, tablero y UI moderna; buena base visual |
| Jira | [oldboyxx/jira_clone](https://github.com/oldboyxx/jira_clone) | React, Express, TypeORM, Postgres | Kanban con drag & drop clásico |
| Jira | [trungk18/jira-clone-angular](https://github.com/trungk18/jira-clone-angular) | Angular | Solo como referencia |
| Linear | [tuan3w/linearapp_clone](https://github.com/tuan3w/linearapp_clone) | React, Redux, Tailwind | UX rápida de listas e issues |
| Notion/Trello | [mattermost/focalboard](https://github.com/mattermost/focalboard) | Go, React | Tableros y vistas (tabla, kanban, calendario) |
| Trello | [wekan/wekan](https://github.com/wekan/wekan), [kanboard/kanboard](https://github.com/kanboard/kanboard), [taigaio](https://github.com/taigaio/taiga-back) | Meteor, PHP, Django | Kanban maduro autoalojable |
| Airtable | [baserow](https://baserow.io/), [rowy](https://github.com/rowyio/rowy) | Django/Nuxt, Firebase | Alternativa "no-code" para armarlo como base de datos |

## 3. Alternativas open source completas (adoptar y adaptar)

| Herramienta | Licencia | Proyectos/tareas | Carga/planificación del equipo | Horas | Facturación | Encaje |
|---|---|---|---|---|---|---|
| **[Worklenz](https://github.com/Worklenz/worklenz)** | AGPL-3.0 | ✅ | ✅ (planificador de recursos y carga) | ✅ | ⚠️ presupuestos y finanzas por proyecto; facturación según su web | **El más cercano** a lo que pedimos (pensado para agencias) |
| **[Ever Gauzy](https://github.com/ever-co/ever-gauzy)** | AGPL-3.0 | ✅ | ✅ | ✅ | ✅ facturas, presupuestos y pagos | Muy completo (ERP, CRM, RR. HH.); pesado y con curva de aprendizaje |
| **[Leantime](https://github.com/Leantime/leantime)** | AGPL-3.0 | ✅ | ⚠️ | ✅ | ❌ | Simple, orientado a objetivos; equipos pequeños |
| **[Plane](https://github.com/makeplane/plane)** | AGPL-3.0 | ✅ excelente | ⚠️ ciclos y módulos | ❌ | ❌ | Alternativa a Jira o Linear; mejor para equipos de software |
| **[OpenProject](https://github.com/opf/openproject)** | GPL-3.0 | ✅ Gantt fuerte | ⚠️ | ✅ | ❌ | Gestión clásica tipo MS Project; pesado |
| **[Huly](https://github.com/hcengineering/platform)** | EPL-2.0 | ✅ | ⚠️ | ⚠️ | ❌ | Linear, Notion y Slack en uno |
| **[Kimai](https://github.com/kimai/kimai)** / **[solidtime](https://github.com/solidtime-io/solidtime)** | AGPL | ⚠️ proyectos básicos | ❌ | ✅ excelente | ✅ facturas desde horas | Complemento de horas y facturación |
| **[Invoice Ninja](https://github.com/invoiceninja/invoiceninja)** | Elastic/AAL | ❌ | ❌ | ✅ | ✅ excelente | Complemento solo de facturación |
| **[Midday](https://github.com/midday-ai/midday)** | AGPL-3.0 | ❌ | ❌ | ✅ | ✅ | Pensado para freelancers; buen diseño de referencia (Next.js) |

## 4. Bases de código para construir la nuestra

- **[Tack](https://github.com/AAALI/Tack)**: kanban autoalojable con Next.js 15 y Supabase (Auth, Postgres, Realtime).
- **[Kanba](https://github.com/Kanba-co/kanba)**: kanban con Next.js, Tailwind y Supabase (MIT, se puede copiar sin restricciones).
- **[sebastianfdz/jira_clone](https://github.com/sebastianfdz/jira_clone)**: backlog y tablero en Next.js.
- Las vistas de "carga semanal" (persona × semana) no las trae resuelto ningún proyecto open source pequeño. Son la parte que habría que construir; se pueden inspirar en Float, Runn y el planificador de Worklenz.

> ⚠️ Licencias: si copiamos código de proyectos **AGPL** (Worklenz, Plane, Gauzy, Midday) y ofrecemos la app a terceros, hay que publicar nuestro código. Para uso interno no hay problema práctico, pero conviene copiar código literal sobre todo de proyectos **MIT** y tomar solo ideas de diseño de los AGPL.

## 5. Opciones y recomendación

| Opción | Esfuerzo | Ventaja | Riesgo |
|---|---|---|---|
| **A. Adoptar Worklenz** (o Ever Gauzy) autoalojado | Bajo: días | Funciona ya, con muchas funciones | Nos adaptamos nosotros a la herramienta; personalizar implica tocar un código grande |
| **B. App propia ligera** (Next.js + Supabase) | Medio: 3–6 semanas para el MVP | Hecha a nuestra medida: cartera, facturación y carga semanal en una sola pantalla | Hay que mantenerla |
| **C. Híbrido**: app propia de panel y planificación + Invoice Ninja o Kimai para horas y facturas | Medio | No reinventamos la facturación legal | Dos herramientas que integrar |

**Recomendación:**
1. **Probar Worklenz 1–2 semanas** con 2 o 3 proyectos reales (tiene versión en la nube y Docker). Si nos cubre el 80 %, adoptarlo.
2. Si no encaja, construir la **opción B/C**: un MVP propio centrado en lo que ninguna herramienta resuelve bien junto (cartera + estado de facturación + reparto semanal), dejando la emisión de facturas en la herramienta contable actual o en Invoice Ninja.

## 6. Propuesta de MVP propio (si vamos por B/C)

**Stack:** Next.js + Tailwind + shadcn/ui, Supabase (Postgres, Auth, Realtime) y despliegue en Vercel. Coste ≈ 0 € en los planes gratuitos para un equipo pequeño.

**Modelo de datos inicial:**

```
clientes(id, nombre, contacto)
personas(id, nombre, rol, capacidad_semanal_horas, coste_hora?)
proyectos(id, cliente_id, nombre, responsable_id, estado, salud[verde|amarillo|rojo],
          fecha_inicio, fecha_fin, presupuesto, tipo[precio_cerrado|por_horas], notas)
hitos_facturacion(id, proyecto_id, concepto, importe, fecha_prevista,
                  estado[pendiente|facturado|cobrado], fecha_factura, n_factura)
tareas(id, proyecto_id, titulo, asignado_id, estado, estimacion_h, semana, prioridad)
asignaciones_semanales(id, persona_id, proyecto_id, semana_iso, horas_planificadas)
registros_horas(id, persona_id, proyecto_id, tarea_id?, fecha, horas, nota)
actualizaciones(id, proyecto_id, autor_id, fecha, texto, salud)   -- estado semanal
```

**Pantallas:**
1. **Panel de cartera**: todos los proyectos con estado, salud, % avance, % horas consumidas y % facturado.
2. **Ficha de proyecto**: tareas (kanban), hitos de facturación, horas y actualizaciones.
3. **Planificador semanal**: matriz persona × semana con horas por proyecto y alerta de sobrecarga.
4. **Facturación**: hitos pendientes, facturados y cobrados, más previsión mensual.
5. **Mi semana**: vista personal de tareas y horas a registrar.

**Fases:**
- **Fase 1 (MVP):** proyectos, clientes, personas, hitos de facturación y panel de cartera.
- **Fase 2:** planificador semanal y tareas kanban.
- **Fase 3:** registro de horas, informes de rentabilidad e integración con la facturación.

## 7. Preguntas abiertas para el equipo

1. ¿Cuántas personas somos y cuántos proyectos activos llevamos a la vez?
2. ¿Qué usamos hoy para facturar (contabilidad, ERP, Excel)? ¿Necesitamos emitir facturas desde la app o solo ver su estado?
3. ¿Registramos horas reales o solo planificamos?
4. ¿Preferimos probar primero una herramienta existente (Worklenz) o ir directo a una app propia?
5. ¿Alojamiento en la nube (Vercel/Supabase) o en un servidor propio?

## Fuentes

- https://canivibecodeit.com/
- https://github.com/gorvgoyl/clone-wars
- https://worklenz.com/blog/open-source-project-management-software/
- https://openalternative.co/compare/plane/vs/worklenz
- https://openalternative.co/compare/leantime/vs/plane
- https://toolradar.com/guides/best-open-source-project-management-tools
- https://docs.gauzy.co/
- https://openalternative.co/alternatives/kimai
- https://openalternative.co/alternatives/solidtime
- https://openalternative.co/midday
- https://github.com/AAALI/Tack
- https://newreleases.io/project/github/Kanba-co/kanba/release/1.0.0
- https://openproject.org/project-management-software-alternatives/best-float-alternative
