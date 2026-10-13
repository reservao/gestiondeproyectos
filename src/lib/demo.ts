import { HITOS_PLANTILLA, type DB, type Hito } from './types'
import { hoy, lunesDe, sumarDias } from './fechas'

export const nuevoId = () => crypto.randomUUID()

export function hitosPlantilla(proyectoId: string, inicio: string, fin: string): Hito[] {
  // Fechas sugeridas repartidas a lo largo del proyecto; se pueden editar después.
  const sugeridas = [0, 3, 5, 7, 10, null, null, null]
  return HITOS_PLANTILLA.map((nombre, i) => ({
    id: nuevoId(),
    proyectoId,
    nombre,
    fechaPlan: i >= 6 ? fin : sugeridas[i] === null ? null : sumarDias(inicio, sugeridas[i]!),
    cumplido: false,
    fechaReal: null,
    notas: '',
    orden: i,
  }))
}

/** Datos de ejemplo para la primera vez que se abre la app en modo local. */
export function datosDemo(): DB {
  const h = hoy()
  const lunes = lunesDe(h)
  const d = (n: number) => sumarDias(h, n)

  const personas = [
    { id: nuevoId(), nombre: 'Ana Pérez', rol: 'Jefa de proyecto', color: '#6366f1' },
    { id: nuevoId(), nombre: 'Bruno Soto', rol: 'Consultor', color: '#0ea5e9' },
    { id: nuevoId(), nombre: 'Carla Díaz', rol: 'Consultora', color: '#f59e0b' },
    { id: nuevoId(), nombre: 'Diego Rojas', rol: 'Jefe de proyecto', color: '#10b981' },
  ]
  const [ana, bruno, carla, diego] = personas.map((p) => p.id)

  const p1 = nuevoId()
  const p2 = nuevoId()
  const proyectos = [
    {
      id: p1,
      codigo: 'PRY-001',
      nombre: 'Diagnóstico de procesos',
      cliente: 'Cliente Ejemplo S.A.',
      jefeId: ana,
      consultoresIds: [bruno, carla],
      fechaInicio: d(-20),
      fechaFin: d(40),
      estado: 'en_curso' as const,
      descripcion: 'Proyecto de ejemplo. Puedes editarlo o borrarlo.',
    },
    {
      id: p2,
      codigo: 'PRY-002',
      nombre: 'Implementación de tablero de control',
      cliente: 'Otra Empresa Ltda.',
      jefeId: diego,
      consultoresIds: [carla],
      fechaInicio: d(-5),
      fechaFin: d(60),
      estado: 'en_curso' as const,
      descripcion: '',
    },
  ]

  const hitos = [
    ...hitosPlantilla(p1, d(-20), d(40)),
    ...hitosPlantilla(p2, d(-5), d(60)),
  ]
  // Marcamos los primeros hitos del proyecto 1 como cumplidos.
  hitos.slice(0, 4).forEach((x) => {
    x.cumplido = true
    x.fechaReal = x.fechaPlan
  })

  const actividades = [
    { id: nuevoId(), proyectoId: p1, nombre: 'Levantamiento', inicio: d(-20), fin: d(-3), responsableId: bruno, avance: 100, orden: 0 },
    { id: nuevoId(), proyectoId: p1, nombre: 'Análisis', inicio: d(-5), fin: d(12), responsableId: carla, avance: 40, orden: 1 },
    { id: nuevoId(), proyectoId: p1, nombre: 'Propuesta de mejoras', inicio: d(10), fin: d(30), responsableId: ana, avance: 0, orden: 2 },
    { id: nuevoId(), proyectoId: p1, nombre: 'Presentación final', inicio: d(31), fin: d(40), responsableId: ana, avance: 0, orden: 3 },
    { id: nuevoId(), proyectoId: p2, nombre: 'Definición de indicadores', inicio: d(-5), fin: d(10), responsableId: diego, avance: 30, orden: 0 },
    { id: nuevoId(), proyectoId: p2, nombre: 'Construcción del tablero', inicio: d(8), fin: d(45), responsableId: carla, avance: 0, orden: 1 },
    { id: nuevoId(), proyectoId: p2, nombre: 'Capacitación', inicio: d(46), fin: d(60), responsableId: diego, avance: 0, orden: 2 },
  ]

  const entregables = [
    { id: nuevoId(), proyectoId: p1, nombre: 'Informe de levantamiento', fecha: d(-3), responsableId: bruno, estado: 'entregado' as const, notas: '' },
    { id: nuevoId(), proyectoId: p1, nombre: 'Informe de diagnóstico', fecha: d(9), responsableId: carla, estado: 'pendiente' as const, notas: '' },
    { id: nuevoId(), proyectoId: p1, nombre: 'Presentación final', fecha: d(40), responsableId: ana, estado: 'pendiente' as const, notas: '' },
    { id: nuevoId(), proyectoId: p2, nombre: 'Ficha de indicadores', fecha: d(6), responsableId: diego, estado: 'pendiente' as const, notas: '' },
  ]

  const tareas = [
    { id: nuevoId(), proyectoId: p1, titulo: 'Entrevistas a jefaturas', descripcion: '', responsableId: bruno, fechaEntrega: d(-2), estado: 'en_curso' as const, prioridad: 'alta' as const, orden: 0 },
    { id: nuevoId(), proyectoId: p1, titulo: 'Mapa de procesos AS-IS', descripcion: '', responsableId: carla, fechaEntrega: d(4), estado: 'por_hacer' as const, prioridad: 'media' as const, orden: 1 },
    { id: nuevoId(), proyectoId: p1, titulo: 'Revisar documentación del cliente', descripcion: '', responsableId: bruno, fechaEntrega: d(-6), estado: 'hecho' as const, prioridad: 'baja' as const, orden: 2 },
    { id: nuevoId(), proyectoId: p2, titulo: 'Reunión de definición de KPIs', descripcion: '', responsableId: diego, fechaEntrega: d(2), estado: 'revision' as const, prioridad: 'alta' as const, orden: 0 },
    { id: nuevoId(), proyectoId: p2, titulo: 'Solicitar accesos a fuentes de datos', descripcion: '', responsableId: carla, fechaEntrega: d(1), estado: 'por_hacer' as const, prioridad: 'media' as const, orden: 1 },
  ]

  const itemsSemana = [
    { id: nuevoId(), semana: lunes, personaId: ana, proyectoId: null, titulo: 'Preparar propuesta comercial nueva', prioridad: 'alta' as const, hecho: false },
    { id: nuevoId(), semana: lunes, personaId: bruno, proyectoId: p1, titulo: 'Consolidar notas de entrevistas', prioridad: 'media' as const, hecho: false },
  ]

  return { personas, proyectos, hitos, entregables, actividades, tareas, itemsSemana }
}
