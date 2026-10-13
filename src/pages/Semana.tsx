import { useMemo, useState } from 'react'
import { ListaAgenda } from '../components/Agenda'
import { FormItemSemana } from '../components/formularios'
import { MatrizProyectos } from '../components/MatrizProyectos'
import { Avatar } from '../components/ui'
import { agendaSemana, type ItemAgenda } from '../lib/agenda'
import { fmt, fmtSemana, hoy, lunesDe, sumarDias } from '../lib/fechas'
import { useStore } from '../lib/store'

/**
 * Planificación semanal: junta lo que viene de los proyectos (Gantt, entregables,
 * hitos, tareas) y lo que se agrega a mano para la semana, por persona o por proyecto.
 */
export default function Semana() {
  const { db } = useStore()
  const [lunes, setLunes] = useState(lunesDe(hoy()))
  const [vista, setVista] = useState<'persona' | 'proyecto'>('persona')
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [nuevo, setNuevo] = useState<{ personaId?: string | null; proyectoId?: string | null } | null>(null)

  const agenda = useMemo(() => agendaSemana(db, lunes).filter((i) => !soloPendientes || !i.hecho), [db, lunes, soloPendientes])
  const esActual = lunes === lunesDe(hoy())

  const grupos: { id: string | null; titulo: React.ReactNode; items: ItemAgenda[] }[] = [
    ...db.personas.map((p) => ({
      id: p.id,
      titulo: (
        <span className="flex items-center gap-2">
          <Avatar persona={p} size="md" />
          <span>
            {p.nombre}
            <span className="block text-xs font-normal text-slate-500">{p.rol}</span>
          </span>
        </span>
      ),
      items: agenda.filter((i) => i.personaId === p.id),
    })),
    { id: null, titulo: <span className="text-slate-500">Sin responsable</span>, items: agenda.filter((i) => !i.personaId) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Semana {fmt(lunes, 'I')}</h1>
          <p className="text-sm text-slate-500">
            {fmtSemana(lunes)}
            {esActual && ' · semana actual (incluye lo atrasado)'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary" onClick={() => setLunes(sumarDias(lunes, -7))}>
            ←
          </button>
          <button className="btn-secondary" onClick={() => setLunes(lunesDe(hoy()))} disabled={esActual}>
            Hoy
          </button>
          <button className="btn-secondary" onClick={() => setLunes(sumarDias(lunes, 7))}>
            →
          </button>
          <div className="inline-flex overflow-hidden rounded-md border border-slate-300 bg-white text-sm">
            {(['persona', 'proyecto'] as const).map((v) => (
              <button key={v} onClick={() => setVista(v)} className={`px-3 py-1.5 ${vista === v ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}>
                {v === 'persona' ? 'Por persona' : 'Matriz por proyecto'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />
            Solo pendientes
          </label>
          <button className="btn-primary" onClick={() => setNuevo({})}>
            + Agregar a la semana
          </button>
        </div>
      </div>

      {vista === 'proyecto' && (
        <MatrizProyectos
          proyectos={db.proyectos.filter((p) => p.estado !== 'cerrado')}
          items={agenda}
          onAgregar={(proyectoId) => setNuevo({ proyectoId })}
        />
      )}

      {vista === 'persona' && (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grupos
          .filter((g) => g.id !== null || g.items.length > 0)
          .map((g) => {
            const pendientes = g.items.filter((i) => !i.hecho).length
            const atrasados = g.items.filter((i) => i.atrasado).length
            return (
              <section key={g.id ?? 'ninguno'} className="card flex flex-col p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{g.titulo}</h2>
                  <div className="text-right text-xs text-slate-500">
                    {pendientes} pendiente(s)
                    {atrasados > 0 && <div className="font-medium text-red-600">{atrasados} atrasado(s)</div>}
                  </div>
                </div>
                <div className="flex-1">
                  <ListaAgenda items={g.items} mostrarPersona={false} vacio="Nada asignado esta semana." />
                </div>
                <button
                  className="mt-2 self-start text-xs text-indigo-600 hover:underline"
                  onClick={() => setNuevo({ personaId: g.id })}
                >
                  + agregar
                </button>
              </section>
            )
          })}
      </div>
      )}

      {nuevo && <FormItemSemana semana={lunes} personaId={nuevo.personaId ?? null} proyectoId={nuevo.proyectoId ?? null} onCerrar={() => setNuevo(null)} />}
    </div>
  )
}
