import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormActividad, FormEntregable, FormHito } from '../components/formularios'
import { Gantt, SelectorEscala, type Escala, type FilaGantt } from '../components/Gantt'
import { Avatar } from '../components/ui'
import { hoy } from '../lib/fechas'
import { useLookups, useStore } from '../lib/store'
import type { Actividad, Entregable, Hito } from '../lib/types'

/** Todos los proyectos activos en una sola línea de tiempo. */
export default function GanttGeneral() {
  const { db, guardar } = useStore()
  const { persona } = useLookups()
  const navigate = useNavigate()
  const [escala, setEscala] = useState<Escala>('semana')
  const [personaId, setPersonaId] = useState('')
  const [verHitos, setVerHitos] = useState(true)
  const [verEntregables, setVerEntregables] = useState(true)
  const [form, setForm] = useState<{ tipo: 'actividad'; x: Actividad } | { tipo: 'entregable'; x: Entregable } | { tipo: 'hito'; x: Hito } | null>(null)

  const proyectos = db.proyectos.filter((p) => p.estado !== 'cerrado').sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
  const dePersona = (id: string | null) => !personaId || id === personaId

  const filas: FilaGantt[] = []
  for (const p of proyectos) {
    const acts = db.actividades.filter((a) => a.proyectoId === p.id && dePersona(a.responsableId)).sort((a, b) => a.orden - b.orden)
    const ents = verEntregables ? db.entregables.filter((e) => e.proyectoId === p.id && dePersona(e.responsableId)) : []
    const hits = verHitos ? db.hitos.filter((h) => h.proyectoId === p.id && h.fechaPlan && dePersona(p.jefeId)) : []
    if (personaId && acts.length + ents.length + hits.length === 0) continue

    filas.push({
      tipo: 'grupo',
      id: p.id,
      etiqueta: (
        <span className="flex items-center gap-2" title={p.nombre}>
          <Avatar persona={persona(p.jefeId)} />
          <span className="truncate">
            {p.codigo ? `${p.codigo} · ` : ''}
            {p.nombre}
          </span>
        </span>
      ),
      onClick: () => navigate(`/proyectos/${p.id}?tab=gantt`),
    })
    for (const a of acts)
      filas.push({
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
      })
    for (const e of ents)
      filas.push({
        tipo: 'hito',
        id: e.id,
        etiqueta: `📦 ${e.nombre}`,
        detalle: <Avatar persona={persona(e.responsableId)} />,
        fecha: e.fecha,
        color: e.estado !== 'entregado' && e.fecha < hoy() ? '#ef4444' : '#6366f1',
        completado: e.estado === 'entregado',
        onClick: () => setForm({ tipo: 'entregable', x: e }),
      })
    for (const h of hits)
      filas.push({
        tipo: 'hito',
        id: h.id,
        etiqueta: `🚩 ${h.nombre}`,
        fecha: h.fechaPlan!,
        color: !h.cumplido && h.fechaPlan! < hoy() ? '#ef4444' : '#f59e0b',
        completado: h.cumplido,
        onClick: () => setForm({ tipo: 'hito', x: h }),
      })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Gantt general</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select className="input w-auto" value={personaId} onChange={(e) => setPersonaId(e.target.value)}>
            <option value="">Todo el equipo</option>
            {db.personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={verEntregables} onChange={(e) => setVerEntregables(e.target.checked)} /> Entregables
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={verHitos} onChange={(e) => setVerHitos(e.target.checked)} /> Hitos
          </label>
          <SelectorEscala escala={escala} onChange={setEscala} />
        </div>
      </div>
      <Gantt filas={filas} escala={escala} />
      {form?.tipo === 'actividad' && <FormActividad actividad={form.x} proyectoId={form.x.proyectoId} onCerrar={() => setForm(null)} />}
      {form?.tipo === 'entregable' && <FormEntregable entregable={form.x} proyectoId={form.x.proyectoId} onCerrar={() => setForm(null)} />}
      {form?.tipo === 'hito' && <FormHito hito={form.x} proyectoId={form.x.proyectoId} onCerrar={() => setForm(null)} />}
    </div>
  )
}
