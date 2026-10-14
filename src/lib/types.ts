// Todas las fechas se guardan como texto 'YYYY-MM-DD'.

export interface Persona {
  id: string
  nombre: string
  rol: string
  color: string
}

export type EstadoProyecto = 'planificacion' | 'en_curso' | 'pausado' | 'cerrado'

export interface Proyecto {
  id: string
  codigo: string
  nombre: string
  cliente: string
  jefeId: string | null
  consultoresIds: string[]
  fechaInicio: string
  fechaFin: string
  estado: EstadoProyecto
  descripcion: string
}

/** Hito de gestión: kick off, OC, factura, cierre… Se marca como cumplido o no. */
export interface Hito {
  id: string
  proyectoId: string
  nombre: string
  fechaPlan: string | null
  cumplido: boolean
  fechaReal: string | null
  notas: string
  orden: number
}

export type EstadoEntregable = 'pendiente' | 'entregado'

export interface Entregable {
  id: string
  proyectoId: string
  nombre: string
  fecha: string
  responsableId: string | null
  estado: EstadoEntregable
  notas: string
}

/** Barra de la Gantt del proyecto (fase o actividad). */
export interface Actividad {
  id: string
  proyectoId: string
  nombre: string
  inicio: string
  fin: string
  responsableId: string | null
  avance: number
  orden: number
}

export type EstadoTarea = 'por_hacer' | 'en_curso' | 'revision' | 'hecho'
export type Prioridad = 'alta' | 'media' | 'baja'

export interface Tarea {
  id: string
  proyectoId: string
  titulo: string
  descripcion: string
  responsableId: string | null
  fechaEntrega: string | null
  estado: EstadoTarea
  prioridad: Prioridad
  orden: number
}

/** Cosa a hacer en una semana concreta, agregada a mano en la planificación semanal. */
export interface ItemSemana {
  id: string
  semana: string // lunes de la semana
  personaId: string | null
  proyectoId: string | null
  titulo: string
  prioridad: Prioridad
  hecho: boolean
}

/**
 * Nota estilo cuaderno. Puede ser del proyecto o del cliente; las del cliente
 * se ven desde todos los proyectos de ese cliente.
 */
export interface Nota {
  id: string
  ambito: 'proyecto' | 'cliente'
  proyectoId: string | null
  cliente: string | null
  titulo: string
  contenido: string // HTML con formato básico
  creada: string // fecha y hora ISO
  actualizada: string
}

export interface DB {
  personas: Persona[]
  proyectos: Proyecto[]
  hitos: Hito[]
  entregables: Entregable[]
  actividades: Actividad[]
  tareas: Tarea[]
  itemsSemana: ItemSemana[]
  notas: Nota[]
}

export type Coleccion = keyof DB
export type Entidad<C extends Coleccion> = DB[C][number]

export const COLECCIONES: Coleccion[] = [
  'personas',
  'proyectos',
  'hitos',
  'entregables',
  'actividades',
  'tareas',
  'itemsSemana',
  'notas',
]

export const ESTADOS_PROYECTO: Record<EstadoProyecto, string> = {
  planificacion: 'Planificación',
  en_curso: 'En curso',
  pausado: 'Pausado',
  cerrado: 'Cerrado',
}

export const ESTADOS_TAREA: Record<EstadoTarea, string> = {
  por_hacer: 'Por hacer',
  en_curso: 'En curso',
  revision: 'En revisión',
  hecho: 'Hecho',
}

export const PRIORIDADES: Record<Prioridad, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

/** Hitos de gestión que se crean automáticamente en cada proyecto nuevo. */
export const HITOS_PLANTILLA = [
  'Kick off interno',
  'Firma ficha de inicio de proyecto',
  'Creación de PEP',
  'Kick off con cliente',
  'Orden de compra (OC) recibida',
  'Factura emitida',
  'Cierre de proyecto',
  'Firma ficha de cierre de proyecto',
]
