import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FormPersona } from '../components/formularios'
import { Avatar, Badge } from '../components/ui'
import { agendaSemana } from '../lib/agenda'
import { hoy, lunesDe } from '../lib/fechas'
import { useStore } from '../lib/store'
import type { Persona } from '../lib/types'

export default function Equipo() {
  const { db } = useStore()
  const [form, setForm] = useState<{ x?: Persona } | null>(null)
  const agenda = agendaSemana(db, lunesDe(hoy()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Equipo</h1>
        <button className="btn-primary" onClick={() => setForm({})}>
          + Agregar persona
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {db.personas.map((p) => {
          const comoJefe = db.proyectos.filter((x) => x.estado !== 'cerrado' && x.jefeId === p.id)
          const comoConsultor = db.proyectos.filter((x) => x.estado !== 'cerrado' && x.consultoresIds.includes(p.id))
          const suyos = agenda.filter((i) => i.personaId === p.id)
          const pendientes = suyos.filter((i) => !i.hecho).length
          const atrasados = suyos.filter((i) => i.atrasado).length
          return (
            <div key={p.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar persona={p} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{p.nombre}</div>
                  <div className="text-xs text-slate-500">{p.rol}</div>
                </div>
                <button className="text-xs text-slate-500 hover:text-indigo-600" onClick={() => setForm({ x: p })}>
                  Editar
                </button>
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <Badge color="indigo">{pendientes} pendiente(s) esta semana</Badge>
                {atrasados > 0 && <Badge color="red">{atrasados} atrasado(s)</Badge>}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {comoJefe.map((x) => (
                  <Link key={x.id} to={`/proyectos/${x.id}`} className="flex items-center gap-2 hover:text-indigo-600">
                    <Badge color="amber">Jefe</Badge>
                    <span className="truncate">{x.nombre}</span>
                  </Link>
                ))}
                {comoConsultor.map((x) => (
                  <Link key={x.id} to={`/proyectos/${x.id}`} className="flex items-center gap-2 hover:text-indigo-600">
                    <Badge color="sky">Consultor</Badge>
                    <span className="truncate">{x.nombre}</span>
                  </Link>
                ))}
                {comoJefe.length + comoConsultor.length === 0 && <p className="text-xs text-slate-400">Sin proyectos activos.</p>}
              </div>
            </div>
          )
        })}
      </div>
      {db.personas.length === 0 && <p className="py-10 text-center text-slate-400">Agrega a las personas del equipo para poder asignarlas.</p>}
      {form && <FormPersona persona={form.x} onCerrar={() => setForm(null)} />}
    </div>
  )
}
