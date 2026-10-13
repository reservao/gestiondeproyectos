import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COLOR_TIPO, EditorAgenda, useAlternar } from './Agenda'
import { Avatar, Badge, BadgePrioridad } from './ui'
import { ETIQUETA_TIPO, type ItemAgenda } from '../lib/agenda'
import { fmt } from '../lib/fechas'
import { useLookups } from '../lib/store'
import type { Proyecto } from '../lib/types'

/**
 * Matriz de la semana: una fila por proyecto (columna 1) y, hacia la derecha,
 * una tarjeta por cada actividad propuesta para esa semana.
 */
export function MatrizProyectos({
  proyectos,
  items,
  onAgregar,
}: {
  proyectos: Proyecto[]
  items: ItemAgenda[]
  onAgregar: (proyectoId: string | null) => void
}) {
  const { persona } = useLookups()
  const [editando, setEditando] = useState<ItemAgenda | null>(null)

  const filas: { proyecto: Proyecto | null; items: ItemAgenda[] }[] = [
    ...proyectos.map((p) => ({ proyecto: p, items: items.filter((i) => i.proyectoId === p.id) })),
    { proyecto: null, items: items.filter((i) => !i.proyectoId) },
  ].filter((f) => f.proyecto || f.items.length > 0)

  return (
    <div className="card overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th className="sticky left-0 z-10 w-64 min-w-64 border-r border-b border-slate-200 bg-white px-3 py-2 font-medium">Proyecto</th>
            <th className="border-b border-slate-200 px-3 py-2 font-medium">
              Actividades de la semana →
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ proyecto: p, items: lista }) => {
            const pendientes = lista.filter((i) => !i.hecho).length
            const atrasados = lista.filter((i) => i.atrasado).length
            return (
              <tr key={p?.id ?? 'general'} className="align-top">
                <td className="sticky left-0 z-10 w-64 min-w-64 border-r border-b border-slate-200 bg-white px-3 py-3">
                  {p ? (
                    <Link to={`/proyectos/${p.id}`} className="block hover:text-indigo-600">
                      <div className="text-xs text-slate-400">{p.codigo}</div>
                      <div className="font-semibold">{p.nombre}</div>
                      <div className="text-xs text-slate-500">{p.cliente}</div>
                    </Link>
                  ) : (
                    <div className="font-semibold text-slate-500">General / sin proyecto</div>
                  )}
                  {p && (
                    <div className="mt-2 flex items-center gap-1">
                      <Avatar persona={persona(p.jefeId)} />
                      <div className="flex -space-x-1.5">
                        {p.consultoresIds.map((c) => (
                          <Avatar key={c} persona={persona(c)} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-slate-500">
                    {pendientes} pendiente(s)
                    {atrasados > 0 && <span className="ml-1 font-medium text-red-600">· {atrasados} atrasado(s)</span>}
                  </div>
                </td>
                <td className="border-b border-slate-200 p-2">
                  <div className="flex flex-wrap gap-2">
                    {lista.map((i) => (
                      <Tarjeta key={i.clave} item={i} onAbrir={() => setEditando(i)} />
                    ))}
                    <button
                      onClick={() => onAgregar(p?.id ?? null)}
                      className="flex min-h-20 w-48 items-center justify-center rounded-md border border-dashed border-slate-300 text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
                    >
                      + Proponer actividad
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {editando && <EditorAgenda item={editando} onCerrar={() => setEditando(null)} />}
    </div>
  )
}

function Tarjeta({ item: i, onAbrir }: { item: ItemAgenda; onAbrir: () => void }) {
  const { persona } = useLookups()
  const alternar = useAlternar()
  const responsable = persona(i.personaId)
  return (
    <div
      className={`flex w-48 flex-col gap-1.5 rounded-md border bg-white p-2 shadow-sm ${i.atrasado ? 'border-red-300' : 'border-slate-200'} ${i.hecho ? 'opacity-60' : ''}`}
      style={{ borderLeft: `3px solid ${responsable?.color ?? '#cbd5e1'}` }}
    >
      <div className="flex items-start gap-1.5">
        <input type="checkbox" checked={i.hecho} onChange={() => alternar(i)} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-indigo-600" title="Marcar como hecho" />
        <button onClick={onAbrir} className={`text-left text-[13px] leading-snug hover:text-indigo-600 ${i.hecho ? 'line-through' : ''}`}>
          {i.titulo}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Badge color={COLOR_TIPO[i.tipo]}>{ETIQUETA_TIPO[i.tipo]}</Badge>
        {i.prioridad && i.tipo !== 'actividad' && <BadgePrioridad p={i.prioridad} />}
        {i.atrasado && <Badge color="red">Atrasado</Badge>}
      </div>
      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500">
        <span className={i.atrasado ? 'font-semibold text-red-600' : ''}>
          {i.tipo === 'actividad' ? `${fmt(i.inicio)} → ${fmt(i.fecha)}` : i.fecha ? fmt(i.fecha, 'EEE d MMM') : 'Esta semana'}
        </span>
        <span className="flex items-center gap-1 truncate">
          <span className="truncate">{responsable?.nombre.split(' ')[0] ?? 'Sin asignar'}</span>
          <Avatar persona={responsable} />
        </span>
      </div>
    </div>
  )
}
