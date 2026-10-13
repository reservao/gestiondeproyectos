import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FormActividad, FormEntregable, FormHito, FormProyecto, FormTarea } from '../components/formularios'
import { Gantt, SelectorEscala, type Escala, type FilaGantt } from '../components/Gantt'
import { Avatar, Badge, BadgePrioridad, PersonaChip, Vacio, confirmar } from '../components/ui'
import { resumenProyecto } from '../lib/agenda'
import { diasEntre, fmt, hoy, relativo } from '../lib/fechas'
import { useLookups, useStore } from '../lib/store'
import { ESTADOS_PROYECTO, ESTADOS_TAREA, type Actividad, type Entregable, type EstadoTarea, type Hito, type Proyecto, type Tarea } from '../lib/types'
import { Panel } from './Inicio'

const PESTANAS = [
  ['resumen', 'Resumen'],
  ['gantt', 'Gantt'],
  ['hitos', 'Hitos de gestión'],
  ['entregables', 'Entregables'],
  ['tareas', 'Tareas'],
] as const
type Pestana = (typeof PESTANAS)[number][0]

export default function ProyectoDetalle() {
  const { id } = useParams()
  const { db, borrarProyecto } = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const pestana = (params.get('tab') as Pestana) || 'resumen'
  const [editando, setEditando] = useState(false)

  const p = db.proyectos.find((x) => x.id === id)
  if (!p)
    return (
      <div className="py-20 text-center text-slate-500">
        Proyecto no encontrado. <Link to="/proyectos" className="text-indigo-600">Volver a proyectos</Link>
      </div>
    )

  const r = resumenProyecto(db, p.id)

  return (
    <div className="space-y-4">
      <div>
        <Link to="/proyectos" className="text-xs text-slate-500 hover:text-indigo-600">
          ← Proyectos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              {p.codigo && <span className="text-slate-400">{p.codigo} · </span>}
              {p.nombre}
            </h1>
            <p className="text-sm text-slate-500">
              {p.cliente} · {ESTADOS_PROYECTO[p.estado]} · {fmt(p.fechaInicio, 'd MMM yyyy')} → {fmt(p.fechaFin, 'd MMM yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setEditando(true)}>
              Editar proyecto
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                if (confirmar(`¿Eliminar el proyecto "${p.nombre}" con todos sus hitos, entregables, Gantt y tareas?`)) {
                  borrarProyecto(p.id)
                  navigate('/proyectos')
                }
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {PESTANAS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setParams({ tab: k }, { replace: true })}
            className={`-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap ${pestana === k ? 'border-indigo-600 font-medium text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {l}
            {k === 'hitos' && r.hitosVencidos.length > 0 && <span className="ml-1 text-red-600">●</span>}
            {k === 'tareas' && r.tareasAtrasadas.length > 0 && <span className="ml-1 text-red-600">●</span>}
            {k === 'entregables' && r.entregablesAtrasados.length > 0 && <span className="ml-1 text-red-600">●</span>}
          </button>
        ))}
      </nav>

      {pestana === 'resumen' && <Resumen p={p} />}
      {pestana === 'gantt' && <GanttProyecto p={p} />}
      {pestana === 'hitos' && <Hitos p={p} />}
      {pestana === 'entregables' && <Entregables p={p} />}
      {pestana === 'tareas' && <Kanban p={p} />}

      {editando && <FormProyecto proyecto={p} onCerrar={() => setEditando(false)} />}
    </div>
  )
}

// ---------- Resumen ----------

function Resumen({ p }: { p: Proyecto }) {
  const { db } = useStore()
  const { persona } = useLookups()
  const r = resumenProyecto(db, p.id)
  const diasRestantes = diasEntre(hoy(), p.fechaFin)
  const proximos = [
    ...r.hitos.filter((h) => !h.cumplido && h.fechaPlan).map((h) => ({ tipo: 'Hito', nombre: h.nombre, fecha: h.fechaPlan! })),
    ...r.entregables.filter((e) => e.estado !== 'entregado').map((e) => ({ tipo: 'Entregable', nombre: e.nombre, fecha: e.fecha })),
    ...r.tareas.filter((t) => t.estado !== 'hecho' && t.fechaEntrega).map((t) => ({ tipo: 'Tarea', nombre: t.titulo, fecha: t.fechaEntrega! })),
  ]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 10)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-1">
        <Panel titulo="Equipo">
          <div className="space-y-2">
            <div>
              <div className="label">Jefe de proyecto</div>
              <PersonaChip persona={persona(p.jefeId)} />
            </div>
            <div>
              <div className="label">Consultores</div>
              {p.consultoresIds.length === 0 && <span className="text-sm text-slate-400">Sin consultores asignados</span>}
              <div className="space-y-1">
                {p.consultoresIds.map((c) => (
                  <div key={c}>
                    <PersonaChip persona={persona(c)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
        <Panel titulo="Estado">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Plazo</dt>
            <dd className={diasRestantes < 0 && p.estado !== 'cerrado' ? 'text-red-600' : ''}>
              {diasRestantes >= 0 ? `${diasRestantes} días restantes` : `Vencido hace ${-diasRestantes} días`}
            </dd>
            <dt className="text-slate-500">Avance Gantt</dt>
            <dd>{r.avanceGantt ?? '—'}%</dd>
            <dt className="text-slate-500">Hitos cumplidos</dt>
            <dd>
              {r.hitosCumplidos} de {r.hitos.length}
            </dd>
            <dt className="text-slate-500">Tareas hechas</dt>
            <dd>
              {r.tareasHechas} de {r.tareas.length}
            </dd>
            <dt className="text-slate-500">Atrasos</dt>
            <dd className={r.alertas ? 'font-medium text-red-600' : 'text-emerald-600'}>{r.alertas ? `${r.alertas} pendiente(s)` : 'Al día'}</dd>
          </dl>
        </Panel>
        {p.descripcion && (
          <Panel titulo="Notas">
            <p className="text-sm whitespace-pre-wrap text-slate-600">{p.descripcion}</p>
          </Panel>
        )}
      </div>
      <div className="lg:col-span-2">
        <Panel titulo="Próximas fechas">
          {proximos.length === 0 ? (
            <Vacio>No hay fechas pendientes.</Vacio>
          ) : (
            <ul className="divide-y divide-slate-100">
              {proximos.map((x, i) => (
                <li key={i} className="flex items-center gap-3 py-2 text-sm">
                  <span className={`w-28 shrink-0 ${x.fecha < hoy() ? 'font-medium text-red-600' : 'text-slate-500'}`}>
                    {fmt(x.fecha, 'EEE d MMM')}
                    <div className="text-[11px]">{relativo(x.fecha)}</div>
                  </span>
                  <Badge color={x.tipo === 'Hito' ? 'amber' : x.tipo === 'Entregable' ? 'indigo' : 'sky'}>{x.tipo}</Badge>
                  <span className="flex-1">{x.nombre}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

// ---------- Gantt del proyecto ----------

function GanttProyecto({ p }: { p: Proyecto }) {
  const { db, guardar } = useStore()
  const { persona } = useLookups()
  const [escala, setEscala] = useState<Escala>('semana')
  const [form, setForm] = useState<
    { tipo: 'actividad'; x?: Actividad } | { tipo: 'entregable'; x?: Entregable } | { tipo: 'hito'; x?: Hito } | null
  >(null)

  const actividades = db.actividades.filter((a) => a.proyectoId === p.id).sort((a, b) => a.orden - b.orden || a.inicio.localeCompare(b.inicio))
  const entregables = db.entregables.filter((e) => e.proyectoId === p.id).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const hitos = db.hitos.filter((h) => h.proyectoId === p.id && h.fechaPlan).sort((a, b) => a.fechaPlan!.localeCompare(b.fechaPlan!))

  const filas: FilaGantt[] = [
    { tipo: 'grupo', id: 'g-act', etiqueta: `Actividades (${actividades.length})` },
    ...actividades.map(
      (a): FilaGantt => ({
        tipo: 'barra',
        id: a.id,
        etiqueta: a.nombre,
        detalle: <Avatar persona={persona(a.responsableId)} />,
        inicio: a.inicio,
        fin: a.fin,
        avance: a.avance,
        color: a.fin < hoy() && a.avance < 100 ? '#ef4444' : (persona(a.responsableId)?.color ?? '#6366f1'),
        onClick: () => setForm({ tipo: 'actividad', x: a }),
        onMover: (inicio, fin) => guardar('actividades', { ...a, inicio, fin }),
      }),
    ),
    { tipo: 'grupo', id: 'g-ent', etiqueta: `Entregables (${entregables.length})` },
    ...entregables.map(
      (e): FilaGantt => ({
        tipo: 'hito',
        id: e.id,
        etiqueta: e.nombre,
        detalle: <Avatar persona={persona(e.responsableId)} />,
        fecha: e.fecha,
        color: e.estado !== 'entregado' && e.fecha < hoy() ? '#ef4444' : '#6366f1',
        completado: e.estado === 'entregado',
        onClick: () => setForm({ tipo: 'entregable', x: e }),
      }),
    ),
    { tipo: 'grupo', id: 'g-hit', etiqueta: `Hitos de gestión (${hitos.length})` },
    ...hitos.map(
      (h): FilaGantt => ({
        tipo: 'hito',
        id: h.id,
        etiqueta: h.nombre,
        fecha: h.fechaPlan!,
        color: !h.cumplido && h.fechaPlan! < hoy() ? '#ef4444' : '#f59e0b',
        completado: h.cumplido,
        onClick: () => setForm({ tipo: 'hito', x: h }),
      }),
    ),
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={() => setForm({ tipo: 'actividad' })}>
          + Actividad
        </button>
        <button className="btn-secondary" onClick={() => setForm({ tipo: 'entregable' })}>
          + Entregable
        </button>
        <button className="btn-secondary" onClick={() => setForm({ tipo: 'hito' })}>
          + Hito
        </button>
        <span className="ml-auto text-xs text-slate-500">Arrastra las barras para mover fechas, o sus bordes para alargarlas.</span>
        <SelectorEscala escala={escala} onChange={setEscala} />
      </div>
      <Gantt filas={filas} escala={escala} desde={p.fechaInicio} hasta={p.fechaFin} />
      <p className="text-xs text-slate-500">
        ◆ relleno = cumplido / entregado · ◇ vacío = pendiente · rojo = atrasado · línea roja vertical = hoy
      </p>
      {form?.tipo === 'actividad' && <FormActividad actividad={form.x} proyectoId={p.id} onCerrar={() => setForm(null)} />}
      {form?.tipo === 'entregable' && <FormEntregable entregable={form.x} proyectoId={p.id} onCerrar={() => setForm(null)} />}
      {form?.tipo === 'hito' && <FormHito hito={form.x} proyectoId={p.id} onCerrar={() => setForm(null)} />}
    </div>
  )
}

// ---------- Hitos de gestión ----------

function Hitos({ p }: { p: Proyecto }) {
  const { db, guardar } = useStore()
  const [form, setForm] = useState<{ x?: Hito } | null>(null)
  const hitos = db.hitos.filter((h) => h.proyectoId === p.id).sort((a, b) => a.orden - b.orden)

  const mover = (h: Hito, dir: -1 | 1) => {
    const i = hitos.indexOf(h)
    if (!hitos[i + dir]) return
    const nuevo = [...hitos]
    ;[nuevo[i], nuevo[i + dir]] = [nuevo[i + dir], nuevo[i]]
    nuevo.forEach((x, orden) => x.orden !== orden && guardar('hitos', { ...x, orden }))
  }

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center justify-between p-4 pb-2">
        <p className="text-sm text-slate-500">Marca cada hito cuando se cumpla. Usa las notas para el n° de OC, n° de factura, etc.</p>
        <button className="btn-primary" onClick={() => setForm({})}>
          + Hito
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-slate-500">
          <tr>
            <th className="w-10 px-4 py-2" />
            <th className="py-2 font-medium">Hito</th>
            <th className="px-3 font-medium">Fecha planificada</th>
            <th className="px-3 font-medium">Estado</th>
            <th className="px-3 font-medium">Notas</th>
            <th className="w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {hitos.map((h, i) => {
            const vencido = !h.cumplido && h.fechaPlan && h.fechaPlan < hoy()
            return (
              <tr key={h.id} className="group hover:bg-slate-50">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={h.cumplido}
                    onChange={() => guardar('hitos', { ...h, cumplido: !h.cumplido, fechaReal: h.cumplido ? null : hoy() })}
                  />
                </td>
                <td className="cursor-pointer py-2" onClick={() => setForm({ x: h })}>
                  <span className={h.cumplido ? 'text-slate-400 line-through' : 'font-medium'}>{h.nombre}</span>
                </td>
                <td className="px-3">
                  <input
                    type="date"
                    className="rounded border border-transparent bg-transparent px-1 text-sm hover:border-slate-300"
                    value={h.fechaPlan ?? ''}
                    onChange={(e) => guardar('hitos', { ...h, fechaPlan: e.target.value || null })}
                  />
                </td>
                <td className="px-3 whitespace-nowrap">
                  {h.cumplido ? (
                    <Badge color="green">Cumplido {h.fechaReal ? fmt(h.fechaReal) : ''}</Badge>
                  ) : vencido ? (
                    <Badge color="red">Vencido {relativo(h.fechaPlan)}</Badge>
                  ) : h.fechaPlan ? (
                    <Badge color="slate">Pendiente · {relativo(h.fechaPlan)}</Badge>
                  ) : (
                    <Badge color="slate">Sin fecha</Badge>
                  )}
                </td>
                <td className="max-w-xs cursor-pointer truncate px-3 text-xs text-slate-500" onClick={() => setForm({ x: h })}>
                  {h.notas}
                </td>
                <td className="px-2 text-slate-400 opacity-0 group-hover:opacity-100">
                  <button onClick={() => mover(h, -1)} disabled={i === 0} className="px-1 hover:text-slate-700 disabled:opacity-30" title="Subir">
                    ↑
                  </button>
                  <button onClick={() => mover(h, 1)} disabled={i === hitos.length - 1} className="px-1 hover:text-slate-700 disabled:opacity-30" title="Bajar">
                    ↓
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {hitos.length === 0 && <Vacio>Este proyecto no tiene hitos todavía.</Vacio>}
      {form && <FormHito hito={form.x} proyectoId={p.id} onCerrar={() => setForm(null)} />}
    </div>
  )
}

// ---------- Entregables ----------

function Entregables({ p }: { p: Proyecto }) {
  const { db, guardar } = useStore()
  const { persona } = useLookups()
  const [form, setForm] = useState<{ x?: Entregable } | null>(null)
  const lista = db.entregables.filter((e) => e.proyectoId === p.id).sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center justify-between p-4 pb-2">
        <p className="text-sm text-slate-500">Qué hay que entregar y para cuándo. Aparecen en el inicio la semana que corresponda.</p>
        <button className="btn-primary" onClick={() => setForm({})}>
          + Entregable
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-slate-500">
          <tr>
            <th className="w-10 px-4 py-2" />
            <th className="py-2 font-medium">Entregable</th>
            <th className="px-3 font-medium">Fecha</th>
            <th className="px-3 font-medium">Responsable</th>
            <th className="px-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lista.map((e) => {
            const hecho = e.estado === 'entregado'
            return (
              <tr key={e.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setForm({ x: e })}>
                <td className="px-4 py-2" onClick={(ev) => ev.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-indigo-600"
                    checked={hecho}
                    onChange={() => guardar('entregables', { ...e, estado: hecho ? 'pendiente' : 'entregado' })}
                  />
                </td>
                <td className={`py-2 ${hecho ? 'text-slate-400 line-through' : 'font-medium'}`}>{e.nombre}</td>
                <td className="px-3 whitespace-nowrap">
                  {fmt(e.fecha, 'EEE d MMM yyyy')} <span className="text-xs text-slate-400">· {relativo(e.fecha)}</span>
                </td>
                <td className="px-3">
                  <PersonaChip persona={persona(e.responsableId)} />
                </td>
                <td className="px-3">
                  {hecho ? <Badge color="green">Entregado</Badge> : e.fecha < hoy() ? <Badge color="red">Atrasado</Badge> : <Badge>Pendiente</Badge>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {lista.length === 0 && <Vacio>No hay entregables cargados.</Vacio>}
      {form && <FormEntregable entregable={form.x} proyectoId={p.id} onCerrar={() => setForm(null)} />}
    </div>
  )
}

// ---------- Kanban de tareas ----------

const COLUMNAS: EstadoTarea[] = ['por_hacer', 'en_curso', 'revision', 'hecho']
const COLOR_COLUMNA: Record<EstadoTarea, string> = {
  por_hacer: 'border-t-slate-400',
  en_curso: 'border-t-sky-500',
  revision: 'border-t-amber-400',
  hecho: 'border-t-emerald-500',
}

function Kanban({ p }: { p: Proyecto }) {
  const { db, guardar } = useStore()
  const { persona } = useLookups()
  const [form, setForm] = useState<{ x?: Tarea; estado?: EstadoTarea } | null>(null)
  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [sobre, setSobre] = useState<EstadoTarea | null>(null)
  const [filtroPersona, setFiltroPersona] = useState<string>('')

  const tareas = db.tareas
    .filter((t) => t.proyectoId === p.id)
    .filter((t) => !filtroPersona || t.responsableId === filtroPersona)
    .sort((a, b) => a.orden - b.orden)

  const soltar = (estado: EstadoTarea) => {
    const t = db.tareas.find((x) => x.id === arrastrando)
    if (t && t.estado !== estado) guardar('tareas', { ...t, estado })
    setArrastrando(null)
    setSobre(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={() => setForm({})}>
          + Tarea
        </button>
        <select className="input w-auto" value={filtroPersona} onChange={(e) => setFiltroPersona(e.target.value)}>
          <option value="">Todos los responsables</option>
          {db.personas.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nombre}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">Arrastra las tarjetas entre columnas para cambiar su estado.</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNAS.map((col) => {
          const lista = tareas.filter((t) => t.estado === col)
          return (
            <div
              key={col}
              onDragOver={(e) => {
                e.preventDefault()
                setSobre(col)
              }}
              onDragLeave={() => setSobre(null)}
              onDrop={() => soltar(col)}
              className={`rounded-lg border border-t-4 border-slate-200 bg-slate-100/70 p-2 ${COLOR_COLUMNA[col]} ${sobre === col ? 'ring-2 ring-indigo-300' : ''}`}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">
                  {ESTADOS_TAREA[col]} <span className="font-normal text-slate-400">{lista.length}</span>
                </h3>
                <button className="text-lg leading-none text-slate-400 hover:text-indigo-600" onClick={() => setForm({ estado: col })} title="Agregar tarea">
                  +
                </button>
              </div>
              <div className="min-h-16 space-y-2">
                {lista.map((t) => {
                  const atrasada = t.estado !== 'hecho' && t.fechaEntrega && t.fechaEntrega < hoy()
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setArrastrando(t.id)}
                      onDragEnd={() => setArrastrando(null)}
                      onClick={() => setForm({ x: t })}
                      className={`cursor-pointer rounded-md border bg-white p-2.5 shadow-sm hover:border-indigo-300 ${atrasada ? 'border-red-300' : 'border-slate-200'} ${arrastrando === t.id ? 'opacity-50' : ''}`}
                    >
                      <div className={`text-sm ${t.estado === 'hecho' ? 'text-slate-400 line-through' : ''}`}>{t.titulo}</div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <BadgePrioridad p={t.prioridad} />
                        {t.fechaEntrega && (
                          <span className={`text-[11px] ${atrasada ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
                            {fmt(t.fechaEntrega)} {atrasada && '· atrasada'}
                          </span>
                        )}
                        <span className="ml-auto">
                          <Avatar persona={persona(t.responsableId)} />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {form && <FormTarea tarea={form.x} estadoInicial={form.estado} proyectoId={p.id} onCerrar={() => setForm(null)} />}
    </div>
  )
}
