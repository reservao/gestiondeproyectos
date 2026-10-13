import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormProyecto } from '../components/formularios'
import { Avatar, BarraProgreso, Badge } from '../components/ui'
import { resumenProyecto } from '../lib/agenda'
import { fmt } from '../lib/fechas'
import { useLookups, useStore } from '../lib/store'
import { ESTADOS_PROYECTO, type EstadoProyecto } from '../lib/types'

const COLOR_ESTADO: Record<EstadoProyecto, 'sky' | 'green' | 'amber' | 'slate'> = {
  planificacion: 'sky',
  en_curso: 'green',
  pausado: 'amber',
  cerrado: 'slate',
}

export default function Proyectos() {
  const { db } = useStore()
  const { persona } = useLookups()
  const navigate = useNavigate()
  const [nuevo, setNuevo] = useState(false)
  const [filtro, setFiltro] = useState<'activos' | 'todos' | 'cerrados'>('activos')
  const [texto, setTexto] = useState('')

  const lista = db.proyectos
    .filter((p) => (filtro === 'todos' ? true : filtro === 'cerrados' ? p.estado === 'cerrado' : p.estado !== 'cerrado'))
    .filter((p) => `${p.codigo} ${p.nombre} ${p.cliente}`.toLowerCase().includes(texto.toLowerCase()))
    .sort((a, b) => a.fechaFin.localeCompare(b.fechaFin))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <button className="btn-primary" onClick={() => setNuevo(true)}>
          + Nuevo proyecto
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Buscar por nombre, código o cliente…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <select className="input w-auto" value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}>
          <option value="activos">Activos</option>
          <option value="cerrados">Cerrados</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((p) => {
          const r = resumenProyecto(db, p.id)
          return (
            <Link key={p.id} to={`/proyectos/${p.id}`} className="card block p-4 transition hover:border-indigo-300 hover:shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-slate-400">{p.codigo}</div>
                  <div className="truncate font-semibold">{p.nombre}</div>
                  <div className="truncate text-sm text-slate-500">{p.cliente}</div>
                </div>
                <Badge color={COLOR_ESTADO[p.estado]}>{ESTADOS_PROYECTO[p.estado]}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <Avatar persona={persona(p.jefeId)} size="md" />
                <div className="ml-1 flex -space-x-1.5">
                  {p.consultoresIds.map((c) => (
                    <Avatar key={c} persona={persona(c)} />
                  ))}
                </div>
                <span className="ml-auto text-xs text-slate-500">
                  {fmt(p.fechaInicio, 'd MMM yy')} → {fmt(p.fechaFin, 'd MMM yy')}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-16">Hitos</span>
                  <BarraProgreso valor={r.hitos.length ? (r.hitosCumplidos / r.hitos.length) * 100 : 0} color="bg-amber-400" />
                  <span className="w-10 text-right">
                    {r.hitosCumplidos}/{r.hitos.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16">Tareas</span>
                  <BarraProgreso valor={r.tareas.length ? (r.tareasHechas / r.tareas.length) * 100 : 0} color="bg-sky-500" />
                  <span className="w-10 text-right">
                    {r.tareasHechas}/{r.tareas.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16">Gantt</span>
                  <BarraProgreso valor={r.avanceGantt ?? 0} />
                  <span className="w-10 text-right">{r.avanceGantt ?? 0}%</span>
                </div>
              </div>
              {r.alertas > 0 && (
                <div className="mt-3 text-xs font-medium text-red-600">
                  ⚠ {r.alertas} cosa(s) atrasada(s) o vencida(s)
                </div>
              )}
            </Link>
          )
        })}
      </div>
      {lista.length === 0 && <p className="py-10 text-center text-slate-400">No hay proyectos con ese filtro.</p>}
      {nuevo && <FormProyecto onCerrar={() => setNuevo(false)} onCreado={(id) => navigate(`/proyectos/${id}`)} />}
    </div>
  )
}
