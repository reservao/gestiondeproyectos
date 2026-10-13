import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ETIQUETA_TIPO, type ItemAgenda } from '../lib/agenda'
import { fmt, hoy, relativo } from '../lib/fechas'
import { useLookups, useStore } from '../lib/store'
import { FormActividad, FormEntregable, FormHito, FormItemSemana, FormTarea } from './formularios'
import { Avatar, Badge, BadgePrioridad, Vacio } from './ui'

const COLOR_TIPO: Record<ItemAgenda['tipo'], 'indigo' | 'amber' | 'sky' | 'green' | 'slate'> = {
  entregable: 'indigo',
  hito: 'amber',
  tarea: 'sky',
  actividad: 'green',
  manual: 'slate',
}

/** Lista de cosas por hacer: se pueden marcar como hechas y abrir para editar. */
export function ListaAgenda({
  items,
  mostrarProyecto = true,
  mostrarPersona = true,
  vacio = 'Nada por aquí.',
}: {
  items: ItemAgenda[]
  mostrarProyecto?: boolean
  mostrarPersona?: boolean
  vacio?: string
}) {
  const { db, guardar } = useStore()
  const { persona, proyecto } = useLookups()
  const [editando, setEditando] = useState<ItemAgenda | null>(null)

  const alternar = (i: ItemAgenda) => {
    const id = i.refId
    if (i.tipo === 'entregable') {
      const x = db.entregables.find((e) => e.id === id)
      if (x) guardar('entregables', { ...x, estado: x.estado === 'entregado' ? 'pendiente' : 'entregado' })
    } else if (i.tipo === 'hito') {
      const x = db.hitos.find((e) => e.id === id)
      if (x) guardar('hitos', { ...x, cumplido: !x.cumplido, fechaReal: x.cumplido ? null : hoy() })
    } else if (i.tipo === 'tarea') {
      const x = db.tareas.find((e) => e.id === id)
      if (x) guardar('tareas', { ...x, estado: x.estado === 'hecho' ? 'por_hacer' : 'hecho' })
    } else if (i.tipo === 'actividad') {
      const x = db.actividades.find((e) => e.id === id)
      if (x) guardar('actividades', { ...x, avance: x.avance >= 100 ? 0 : 100 })
    } else {
      const x = db.itemsSemana.find((e) => e.id === id)
      if (x) guardar('itemsSemana', { ...x, hecho: !x.hecho })
    }
  }

  if (items.length === 0) return <Vacio>{vacio}</Vacio>

  return (
    <>
      <ul className="divide-y divide-slate-100">
        {items.map((i) => {
          const pr = proyecto(i.proyectoId)
          return (
            <li key={i.clave} className="flex items-center gap-2.5 py-1.5">
              <input type="checkbox" checked={i.hecho} onChange={() => alternar(i)} className="h-4 w-4 shrink-0 accent-indigo-600" title="Marcar como hecho" />
              <button onClick={() => setEditando(i)} className="min-w-0 flex-1 text-left">
                <div className={`truncate text-sm ${i.hecho ? 'text-slate-400 line-through' : ''}`}>{i.titulo}</div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <Badge color={COLOR_TIPO[i.tipo]}>{ETIQUETA_TIPO[i.tipo]}</Badge>
                  {i.prioridad && i.tipo !== 'actividad' && <BadgePrioridad p={i.prioridad} />}
                  {mostrarProyecto && pr && (
                    <Link to={`/proyectos/${pr.id}`} onClick={(e) => e.stopPropagation()} className="truncate hover:text-indigo-600">
                      {pr.codigo || pr.nombre}
                    </Link>
                  )}
                  {i.fecha && (
                    <span className={i.atrasado ? 'font-semibold text-red-600' : ''}>
                      {i.tipo === 'actividad' ? `${fmt(i.inicio)} → ${fmt(i.fecha)}` : `${fmt(i.fecha, 'EEE d MMM')} · ${relativo(i.fecha)}`}
                    </span>
                  )}
                  {i.atrasado && <Badge color="red">Atrasado</Badge>}
                </div>
              </button>
              {mostrarPersona && <Avatar persona={persona(i.personaId)} />}
            </li>
          )
        })}
      </ul>
      {editando && <EditorAgenda item={editando} onCerrar={() => setEditando(null)} />}
    </>
  )
}

function EditorAgenda({ item, onCerrar }: { item: ItemAgenda; onCerrar: () => void }) {
  const { db } = useStore()
  const pid = item.proyectoId ?? ''
  switch (item.tipo) {
    case 'entregable':
      return <FormEntregable entregable={db.entregables.find((x) => x.id === item.refId)} proyectoId={pid} onCerrar={onCerrar} />
    case 'hito':
      return <FormHito hito={db.hitos.find((x) => x.id === item.refId)} proyectoId={pid} onCerrar={onCerrar} />
    case 'tarea':
      return <FormTarea tarea={db.tareas.find((x) => x.id === item.refId)} proyectoId={pid} onCerrar={onCerrar} />
    case 'actividad':
      return <FormActividad actividad={db.actividades.find((x) => x.id === item.refId)} proyectoId={pid} onCerrar={onCerrar} />
    case 'manual': {
      const m = db.itemsSemana.find((x) => x.id === item.refId)
      return m ? <FormItemSemana item={m} semana={m.semana} onCerrar={onCerrar} /> : null
    }
  }
}
