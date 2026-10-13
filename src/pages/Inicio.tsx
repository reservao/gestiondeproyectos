import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListaAgenda } from '../components/Agenda'
import { Avatar, BarraProgreso, Badge } from '../components/ui'
import { agendaSemana, resumenProyecto } from '../lib/agenda'
import { fmt, fmtSemana, hoy, lunesDe, relativo, sumarDias } from '../lib/fechas'
import { useLookups, useStore } from '../lib/store'
import { ESTADOS_PROYECTO } from '../lib/types'

const SALUD = { verde: 'bg-emerald-500', amarillo: 'bg-amber-400', rojo: 'bg-red-500' }

export default function Inicio() {
  const { db } = useStore()
  const { persona } = useLookups()
  const [semana, setSemana] = useState<'actual' | 'proxima'>('actual')
  const lunes = semana === 'actual' ? lunesDe(hoy()) : sumarDias(lunesDe(hoy()), 7)

  const agenda = useMemo(() => agendaSemana(db, lunes), [db, lunes])
  const entregables = agenda.filter((i) => i.tipo === 'entregable')
  const hitos = agenda.filter((i) => i.tipo === 'hito')
  const tareas = agenda.filter((i) => i.tipo === 'tarea' || i.tipo === 'manual')

  const activos = db.proyectos.filter((p) => p.estado !== 'cerrado')
  const resumenes = activos.map((p) => ({ p, r: resumenProyecto(db, p.id) }))
  const atrasados = agenda.filter((i) => i.atrasado).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inicio</h1>
          <p className="text-sm text-slate-500">
            Semana {fmt(lunes, 'I')} · {fmtSemana(lunes)}
          </p>
        </div>
        <div className="inline-flex overflow-hidden rounded-md border border-slate-300 bg-white text-sm">
          {(['actual', 'proxima'] as const).map((s) => (
            <button key={s} onClick={() => setSemana(s)} className={`px-3 py-1.5 ${semana === s ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}>
              {s === 'actual' ? 'Esta semana' : 'Próxima semana'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="Proyectos activos" valor={activos.length} />
        <Kpi titulo="Entregables de la semana" valor={entregables.filter((i) => !i.hecho).length} />
        <Kpi titulo="Hitos de la semana" valor={hitos.filter((i) => !i.hecho).length} />
        <Kpi titulo="Cosas atrasadas" valor={atrasados} alerta={atrasados > 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel titulo="📦 Entregables">
          <ListaAgenda items={entregables} vacio="No hay entregables esta semana." />
        </Panel>
        <Panel titulo="🚩 Hitos de gestión">
          <ListaAgenda items={hitos} vacio="No hay hitos esta semana." />
        </Panel>
        <Panel titulo="✅ Tareas y pendientes" link={{ to: '/semana', texto: 'Ver por persona →' }}>
          <ListaAgenda items={tareas} vacio="No hay tareas con fecha esta semana." />
        </Panel>
      </div>

      <Panel titulo="Proyectos en curso" link={{ to: '/proyectos', texto: 'Ver todos →' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-3 font-medium">Proyecto</th>
                <th className="px-3 font-medium">Jefe</th>
                <th className="px-3 font-medium">Avance Gantt</th>
                <th className="px-3 font-medium">Hitos</th>
                <th className="px-3 font-medium">Tareas</th>
                <th className="px-3 font-medium">Próximo hito</th>
                <th className="px-3 font-medium">Próximo entregable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resumenes.map(({ p, r }) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2 pr-3">
                    <Link to={`/proyectos/${p.id}`} className="flex items-center gap-2 font-medium hover:text-indigo-600">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${SALUD[r.salud]}`} title={`${r.alertas} alertas`} />
                      <span>
                        {p.codigo && <span className="text-slate-400">{p.codigo} · </span>}
                        {p.nombre}
                      </span>
                    </Link>
                    <div className="pl-4.5 text-xs text-slate-500">
                      {p.cliente} · {ESTADOS_PROYECTO[p.estado]}
                    </div>
                  </td>
                  <td className="px-3">
                    <Avatar persona={persona(p.jefeId)} />
                  </td>
                  <td className="w-32 px-3">
                    {r.avanceGantt === null ? (
                      <span className="text-xs text-slate-400">Sin Gantt</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <BarraProgreso valor={r.avanceGantt} />
                        <span className="text-xs">{r.avanceGantt}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 whitespace-nowrap">
                    {r.hitosCumplidos}/{r.hitos.length}
                    {r.hitosVencidos.length > 0 && <Badge color="red">{r.hitosVencidos.length} vencido(s)</Badge>}
                  </td>
                  <td className="px-3 whitespace-nowrap">
                    {r.tareasHechas}/{r.tareas.length}
                    {r.tareasAtrasadas.length > 0 && <Badge color="red">{r.tareasAtrasadas.length} atrasada(s)</Badge>}
                  </td>
                  <td className="px-3 text-xs">
                    {r.proximoHito ? (
                      <>
                        <div>{r.proximoHito.nombre}</div>
                        <div className={r.proximoHito.fechaPlan! < hoy() ? 'text-red-600' : 'text-slate-500'}>
                          {fmt(r.proximoHito.fechaPlan)} · {relativo(r.proximoHito.fechaPlan)}
                        </div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 text-xs">
                    {r.proximoEntregable ? (
                      <>
                        <div>{r.proximoEntregable.nombre}</div>
                        <div className={r.proximoEntregable.fecha < hoy() ? 'text-red-600' : 'text-slate-500'}>
                          {fmt(r.proximoEntregable.fecha)} · {relativo(r.proximoEntregable.fecha)}
                        </div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resumenes.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No hay proyectos activos.</p>}
        </div>
      </Panel>
    </div>
  )
}

function Kpi({ titulo, valor, alerta }: { titulo: string; valor: number; alerta?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{titulo}</div>
      <div className={`text-2xl font-bold ${alerta ? 'text-red-600' : ''}`}>{valor}</div>
    </div>
  )
}

export function Panel({ titulo, children, link, acciones }: { titulo: string; children: React.ReactNode; link?: { to: string; texto: string }; acciones?: React.ReactNode }) {
  return (
    <section className="card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-semibold">{titulo}</h2>
        {link && (
          <Link to={link.to} className="text-xs text-indigo-600 hover:underline">
            {link.texto}
          </Link>
        )}
        {acciones}
      </div>
      {children}
    </section>
  )
}
