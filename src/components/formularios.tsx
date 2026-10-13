import { useState, type FormEvent, type ReactNode } from 'react'
import { useStore } from '../lib/store'
import { hitosPlantilla, nuevoId } from '../lib/demo'
import { hoy, sumarDias } from '../lib/fechas'
import {
  ESTADOS_PROYECTO,
  ESTADOS_TAREA,
  PRIORIDADES,
  type Actividad,
  type Entregable,
  type EstadoProyecto,
  type EstadoTarea,
  type Hito,
  type ItemSemana,
  type Persona,
  type Prioridad,
  type Proyecto,
  type Tarea,
} from '../lib/types'
import { Avatar, Campo, Modal, SelectPersona, SelectProyecto, BotonConfirmar } from './ui'

/** Estructura común: modal + formulario + botones Guardar / Eliminar. */
function Formulario({
  titulo,
  onCerrar,
  onGuardar,
  onEliminar,
  children,
  ancho,
}: {
  titulo: string
  onCerrar: () => void
  onGuardar: () => void
  onEliminar?: () => void
  children: ReactNode
  ancho?: string
}) {
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    onGuardar()
    onCerrar()
  }
  return (
    <Modal titulo={titulo} abierto onCerrar={onCerrar} ancho={ancho}>
      <form onSubmit={enviar} className="space-y-3">
        {children}
        <div className="flex items-center justify-between pt-2">
          {onEliminar ? (
            <BotonConfirmar
              pregunta="¿Eliminar?"
              onConfirmar={() => {
                onEliminar()
                onCerrar()
              }}
            >
              Eliminar
            </BotonConfirmar>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

const Fila2 = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 gap-3">{children}</div>

// ---------- Proyecto ----------

export function FormProyecto({ proyecto, onCerrar, onCreado }: { proyecto?: Proyecto; onCerrar: () => void; onCreado?: (id: string) => void }) {
  const { db, guardar } = useStore()
  const [p, setP] = useState<Proyecto>(
    proyecto ?? {
      id: nuevoId(),
      codigo: '',
      nombre: '',
      cliente: '',
      jefeId: null,
      consultoresIds: [],
      fechaInicio: hoy(),
      fechaFin: sumarDias(hoy(), 60),
      estado: 'planificacion',
      descripcion: '',
    },
  )
  const [conPlantilla, setConPlantilla] = useState(true)
  const set = <K extends keyof Proyecto>(k: K, v: Proyecto[K]) => setP((x) => ({ ...x, [k]: v }))
  const toggleConsultor = (id: string) =>
    set('consultoresIds', p.consultoresIds.includes(id) ? p.consultoresIds.filter((c) => c !== id) : [...p.consultoresIds, id])

  return (
    <Formulario
      titulo={proyecto ? 'Editar proyecto' : 'Nuevo proyecto'}
      onCerrar={onCerrar}
      ancho="max-w-2xl"
      onGuardar={() => {
        guardar('proyectos', p)
        if (!proyecto && conPlantilla) hitosPlantilla(p.id, p.fechaInicio, p.fechaFin).forEach((h) => guardar('hitos', h))
        if (!proyecto) onCreado?.(p.id)
      }}
    >
      <div className="grid grid-cols-3 gap-3">
        <Campo label="Código">
          <input className="input" value={p.codigo} onChange={(e) => set('codigo', e.target.value)} placeholder="PRY-003" />
        </Campo>
        <Campo label="Nombre del proyecto" className="col-span-2">
          <input className="input" required autoFocus value={p.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </Campo>
      </div>
      <Fila2>
        <Campo label="Cliente">
          <input className="input" value={p.cliente} onChange={(e) => set('cliente', e.target.value)} />
        </Campo>
        <Campo label="Estado">
          <select className="input" value={p.estado} onChange={(e) => set('estado', e.target.value as EstadoProyecto)}>
            {Object.entries(ESTADOS_PROYECTO).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
      </Fila2>
      <Fila2>
        <Campo label="Fecha de inicio">
          <input type="date" className="input" required value={p.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} />
        </Campo>
        <Campo label="Fecha de término">
          <input type="date" className="input" required min={p.fechaInicio} value={p.fechaFin} onChange={(e) => set('fechaFin', e.target.value)} />
        </Campo>
      </Fila2>
      <Campo label="Jefe de proyecto">
        <SelectPersona value={p.jefeId} onChange={(v) => set('jefeId', v)} vacio="Sin jefe asignado" />
      </Campo>
      <div>
        <span className="label">Consultores participantes</span>
        {db.personas.length === 0 && <p className="text-sm text-slate-400">Primero agrega personas en la sección Equipo.</p>}
        <div className="flex flex-wrap gap-2">
          {db.personas
            .filter((x) => x.id !== p.jefeId)
            .map((x) => {
              const activo = p.consultoresIds.includes(x.id)
              return (
                <button
                  type="button"
                  key={x.id}
                  onClick={() => toggleConsultor(x.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-3 pl-0.5 text-sm ${activo ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Avatar persona={x} />
                  {x.nombre}
                </button>
              )
            })}
        </div>
      </div>
      <Campo label="Descripción / notas">
        <textarea className="input" rows={3} value={p.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
      </Campo>
      {!proyecto && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={conPlantilla} onChange={(e) => setConPlantilla(e.target.checked)} />
          Crear hitos de gestión estándar (kick off, ficha de inicio, PEP, OC, factura, cierre…)
        </label>
      )}
    </Formulario>
  )
}

// ---------- Hito ----------

export function FormHito({ hito, proyectoId, onCerrar }: { hito?: Hito; proyectoId: string; onCerrar: () => void }) {
  const { db, guardar, borrar } = useStore()
  const [h, setH] = useState<Hito>(
    hito ?? {
      id: nuevoId(),
      proyectoId,
      nombre: '',
      fechaPlan: null,
      cumplido: false,
      fechaReal: null,
      notas: '',
      orden: db.hitos.filter((x) => x.proyectoId === proyectoId).length,
    },
  )
  const set = <K extends keyof Hito>(k: K, v: Hito[K]) => setH((x) => ({ ...x, [k]: v }))
  return (
    <Formulario
      titulo={hito ? 'Editar hito' : 'Nuevo hito'}
      onCerrar={onCerrar}
      onGuardar={() => guardar('hitos', h)}
      onEliminar={hito ? () => borrar('hitos', h.id) : undefined}
    >
      <Campo label="Hito">
        <input className="input" required autoFocus value={h.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Factura 2 (50%)" />
      </Campo>
      <Fila2>
        <Campo label="Fecha planificada">
          <input type="date" className="input" value={h.fechaPlan ?? ''} onChange={(e) => set('fechaPlan', e.target.value || null)} />
        </Campo>
        <Campo label="Fecha real (cuando se cumplió)">
          <input
            type="date"
            className="input"
            value={h.fechaReal ?? ''}
            onChange={(e) => setH((x) => ({ ...x, fechaReal: e.target.value || null, cumplido: !!e.target.value }))}
          />
        </Campo>
      </Fila2>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={h.cumplido}
          onChange={(e) => setH((x) => ({ ...x, cumplido: e.target.checked, fechaReal: e.target.checked ? (x.fechaReal ?? hoy()) : null }))}
        />
        Cumplido
      </label>
      <Campo label="Notas (n° de OC, n° de factura, comentarios…)">
        <textarea className="input" rows={2} value={h.notas} onChange={(e) => set('notas', e.target.value)} />
      </Campo>
    </Formulario>
  )
}

// ---------- Entregable ----------

export function FormEntregable({ entregable, proyectoId, onCerrar }: { entregable?: Entregable; proyectoId: string; onCerrar: () => void }) {
  const { guardar, borrar } = useStore()
  const [x, setX] = useState<Entregable>(
    entregable ?? { id: nuevoId(), proyectoId, nombre: '', fecha: sumarDias(hoy(), 7), responsableId: null, estado: 'pendiente', notas: '' },
  )
  const set = <K extends keyof Entregable>(k: K, v: Entregable[K]) => setX((o) => ({ ...o, [k]: v }))
  return (
    <Formulario
      titulo={entregable ? 'Editar entregable' : 'Nuevo entregable'}
      onCerrar={onCerrar}
      onGuardar={() => guardar('entregables', x)}
      onEliminar={entregable ? () => borrar('entregables', x.id) : undefined}
    >
      <Campo label="Entregable">
        <input className="input" required autoFocus value={x.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Informe de diagnóstico" />
      </Campo>
      <Fila2>
        <Campo label="Fecha de entrega">
          <input type="date" className="input" required value={x.fecha} onChange={(e) => set('fecha', e.target.value)} />
        </Campo>
        <Campo label="Responsable">
          <SelectPersona value={x.responsableId} onChange={(v) => set('responsableId', v)} />
        </Campo>
      </Fila2>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={x.estado === 'entregado'} onChange={(e) => set('estado', e.target.checked ? 'entregado' : 'pendiente')} />
        Entregado
      </label>
      <Campo label="Notas">
        <textarea className="input" rows={2} value={x.notas} onChange={(e) => set('notas', e.target.value)} />
      </Campo>
    </Formulario>
  )
}

// ---------- Actividad (barra de Gantt) ----------

export function FormActividad({ actividad, proyectoId, onCerrar }: { actividad?: Actividad; proyectoId: string; onCerrar: () => void }) {
  const { db, guardar, borrar } = useStore()
  const proyecto = db.proyectos.find((p) => p.id === proyectoId)
  const [a, setA] = useState<Actividad>(
    actividad ?? {
      id: nuevoId(),
      proyectoId,
      nombre: '',
      inicio: proyecto?.fechaInicio ?? hoy(),
      fin: sumarDias(proyecto?.fechaInicio ?? hoy(), 13),
      responsableId: null,
      avance: 0,
      orden: db.actividades.filter((x) => x.proyectoId === proyectoId).length,
    },
  )
  const set = <K extends keyof Actividad>(k: K, v: Actividad[K]) => setA((o) => ({ ...o, [k]: v }))
  return (
    <Formulario
      titulo={actividad ? 'Editar actividad' : 'Nueva actividad de la Gantt'}
      onCerrar={onCerrar}
      onGuardar={() => guardar('actividades', a)}
      onEliminar={actividad ? () => borrar('actividades', a.id) : undefined}
    >
      <Campo label="Actividad / fase">
        <input className="input" required autoFocus value={a.nombre} onChange={(e) => set('nombre', e.target.value)} />
      </Campo>
      <Fila2>
        <Campo label="Inicio">
          <input type="date" className="input" required value={a.inicio} onChange={(e) => set('inicio', e.target.value)} />
        </Campo>
        <Campo label="Fin">
          <input type="date" className="input" required min={a.inicio} value={a.fin} onChange={(e) => set('fin', e.target.value)} />
        </Campo>
      </Fila2>
      <Fila2>
        <Campo label="Responsable">
          <SelectPersona value={a.responsableId} onChange={(v) => set('responsableId', v)} />
        </Campo>
        <Campo label={`Avance: ${a.avance}%`}>
          <input type="range" min={0} max={100} step={5} className="w-full" value={a.avance} onChange={(e) => set('avance', Number(e.target.value))} />
        </Campo>
      </Fila2>
    </Formulario>
  )
}

// ---------- Tarea ----------

export function FormTarea({
  tarea,
  proyectoId,
  estadoInicial = 'por_hacer',
  onCerrar,
}: {
  tarea?: Tarea
  proyectoId: string
  estadoInicial?: EstadoTarea
  onCerrar: () => void
}) {
  const { db, guardar, borrar } = useStore()
  const [t, setT] = useState<Tarea>(
    tarea ?? {
      id: nuevoId(),
      proyectoId,
      titulo: '',
      descripcion: '',
      responsableId: null,
      fechaEntrega: null,
      estado: estadoInicial,
      prioridad: 'media',
      orden: db.tareas.filter((x) => x.proyectoId === proyectoId).length,
    },
  )
  const set = <K extends keyof Tarea>(k: K, v: Tarea[K]) => setT((o) => ({ ...o, [k]: v }))
  return (
    <Formulario
      titulo={tarea ? 'Editar tarea' : 'Nueva tarea'}
      onCerrar={onCerrar}
      onGuardar={() => guardar('tareas', t)}
      onEliminar={tarea ? () => borrar('tareas', t.id) : undefined}
    >
      <Campo label="Tarea">
        <input className="input" required autoFocus value={t.titulo} onChange={(e) => set('titulo', e.target.value)} />
      </Campo>
      <Fila2>
        <Campo label="Responsable">
          <SelectPersona value={t.responsableId} onChange={(v) => set('responsableId', v)} />
        </Campo>
        <Campo label="Fecha de entrega">
          <input type="date" className="input" value={t.fechaEntrega ?? ''} onChange={(e) => set('fechaEntrega', e.target.value || null)} />
        </Campo>
      </Fila2>
      <Fila2>
        <Campo label="Estado">
          <select className="input" value={t.estado} onChange={(e) => set('estado', e.target.value as EstadoTarea)}>
            {Object.entries(ESTADOS_TAREA).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Prioridad">
          <select className="input" value={t.prioridad} onChange={(e) => set('prioridad', e.target.value as Prioridad)}>
            {Object.entries(PRIORIDADES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
      </Fila2>
      <Campo label="Descripción">
        <textarea className="input" rows={3} value={t.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
      </Campo>
    </Formulario>
  )
}

// ---------- Item semanal ----------

export function FormItemSemana({
  item,
  semana,
  personaId = null,
  proyectoId = null,
  onCerrar,
}: {
  item?: ItemSemana
  semana: string
  personaId?: string | null
  proyectoId?: string | null
  onCerrar: () => void
}) {
  const { guardar, borrar } = useStore()
  const [x, setX] = useState<ItemSemana>(item ?? { id: nuevoId(), semana, personaId, proyectoId, titulo: '', prioridad: 'media', hecho: false })
  const set = <K extends keyof ItemSemana>(k: K, v: ItemSemana[K]) => setX((o) => ({ ...o, [k]: v }))
  return (
    <Formulario
      titulo={item ? 'Editar pendiente de la semana' : 'Agregar a la semana'}
      onCerrar={onCerrar}
      onGuardar={() => guardar('itemsSemana', x)}
      onEliminar={item ? () => borrar('itemsSemana', x.id) : undefined}
    >
      <Campo label="¿Qué hay que hacer?">
        <input className="input" required autoFocus value={x.titulo} onChange={(e) => set('titulo', e.target.value)} />
      </Campo>
      <Fila2>
        <Campo label="Responsable">
          <SelectPersona value={x.personaId} onChange={(v) => set('personaId', v)} />
        </Campo>
        <Campo label="Proyecto">
          <SelectProyecto value={x.proyectoId} onChange={(v) => set('proyectoId', v)} vacio="General / sin proyecto" />
        </Campo>
      </Fila2>
      <Fila2>
        <Campo label="Prioridad">
          <select className="input" value={x.prioridad} onChange={(e) => set('prioridad', e.target.value as Prioridad)}>
            {Object.entries(PRIORIDADES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Semana (lunes)">
          <input type="date" className="input" value={x.semana} onChange={(e) => set('semana', e.target.value)} />
        </Campo>
      </Fila2>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={x.hecho} onChange={(e) => set('hecho', e.target.checked)} />
        Hecho
      </label>
    </Formulario>
  )
}

// ---------- Persona ----------

const COLORES = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b']

export function FormPersona({ persona, onCerrar }: { persona?: Persona; onCerrar: () => void }) {
  const { db, guardar, borrar } = useStore()
  const [p, setP] = useState<Persona>(persona ?? { id: nuevoId(), nombre: '', rol: '', color: COLORES[db.personas.length % COLORES.length] })
  return (
    <Formulario
      titulo={persona ? 'Editar persona' : 'Agregar persona'}
      onCerrar={onCerrar}
      onGuardar={() => guardar('personas', p)}
      onEliminar={persona ? () => borrar('personas', p.id) : undefined}
    >
      <Campo label="Nombre">
        <input className="input" required autoFocus value={p.nombre} onChange={(e) => setP({ ...p, nombre: e.target.value })} />
      </Campo>
      <Campo label="Rol / cargo">
        <input className="input" value={p.rol} onChange={(e) => setP({ ...p, rol: e.target.value })} placeholder="Consultor, Jefe de proyecto…" />
      </Campo>
      <div>
        <span className="label">Color</span>
        <div className="flex gap-2">
          {COLORES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setP({ ...p, color: c })}
              className={`h-6 w-6 rounded-full ${p.color === c ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    </Formulario>
  )
}
