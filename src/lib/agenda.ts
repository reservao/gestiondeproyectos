import { enRango, finDeSemana, hoy, lunesDe, seCruza } from './fechas'
import type { DB, Prioridad } from './types'

/** Algo que aparece en la agenda de una semana: viene de un proyecto o se agregó a mano. */
export interface ItemAgenda {
  clave: string
  tipo: 'entregable' | 'hito' | 'tarea' | 'actividad' | 'manual'
  titulo: string
  fecha: string | null // para actividades, la fecha de fin
  inicio?: string
  proyectoId: string | null
  personaId: string | null
  hecho: boolean
  atrasado: boolean
  prioridad?: Prioridad
  refId: string
}

export const ETIQUETA_TIPO: Record<ItemAgenda['tipo'], string> = {
  entregable: 'Entregable',
  hito: 'Hito',
  tarea: 'Tarea',
  actividad: 'Gantt',
  manual: 'Semana',
}

/**
 * Todo lo que toca hacer en la semana que empieza en `lunes`.
 * Si es la semana actual, también incluye lo atrasado de semanas anteriores.
 */
export function agendaSemana(db: DB, lunes: string): ItemAgenda[] {
  const domingo = finDeSemana(lunes)
  const h = hoy()
  const esActual = lunesDe(h) === lunes
  const jefeDe = new Map(db.proyectos.map((p) => [p.id, p.jefeId]))
  const activo = new Set(db.proyectos.filter((p) => p.estado !== 'cerrado').map((p) => p.id))
  const toca = (fecha: string | null, hecho: boolean) => enRango(fecha, lunes, domingo) || (esActual && !hecho && !!fecha && fecha < lunes)

  const items: ItemAgenda[] = []

  for (const e of db.entregables) {
    const hecho = e.estado === 'entregado'
    if (!activo.has(e.proyectoId) || !toca(e.fecha, hecho)) continue
    items.push({ clave: 'e' + e.id, tipo: 'entregable', titulo: e.nombre, fecha: e.fecha, proyectoId: e.proyectoId, personaId: e.responsableId, hecho, atrasado: !hecho && e.fecha < h, refId: e.id })
  }
  for (const x of db.hitos) {
    if (!activo.has(x.proyectoId) || !toca(x.fechaPlan, x.cumplido)) continue
    items.push({ clave: 'h' + x.id, tipo: 'hito', titulo: x.nombre, fecha: x.fechaPlan, proyectoId: x.proyectoId, personaId: jefeDe.get(x.proyectoId) ?? null, hecho: x.cumplido, atrasado: !x.cumplido && !!x.fechaPlan && x.fechaPlan < h, refId: x.id })
  }
  for (const t of db.tareas) {
    const hecho = t.estado === 'hecho'
    if (!activo.has(t.proyectoId) || !toca(t.fechaEntrega, hecho)) continue
    items.push({ clave: 't' + t.id, tipo: 'tarea', titulo: t.titulo, fecha: t.fechaEntrega, proyectoId: t.proyectoId, personaId: t.responsableId, hecho, atrasado: !hecho && !!t.fechaEntrega && t.fechaEntrega < h, prioridad: t.prioridad, refId: t.id })
  }
  for (const a of db.actividades) {
    if (!activo.has(a.proyectoId) || !seCruza(a.inicio, a.fin, lunes, domingo)) continue
    const hecho = a.avance >= 100
    items.push({ clave: 'a' + a.id, tipo: 'actividad', titulo: a.nombre, fecha: a.fin, inicio: a.inicio, proyectoId: a.proyectoId, personaId: a.responsableId, hecho, atrasado: !hecho && a.fin < h, refId: a.id })
  }
  for (const m of db.itemsSemana) {
    if (m.semana !== lunes) continue
    items.push({ clave: 'm' + m.id, tipo: 'manual', titulo: m.titulo, fecha: null, proyectoId: m.proyectoId, personaId: m.personaId, hecho: m.hecho, atrasado: false, prioridad: m.prioridad, refId: m.id })
  }

  const peso = (i: ItemAgenda) => (i.hecho ? 2 : i.atrasado ? 0 : 1)
  const pesoPrioridad = { alta: 0, media: 1, baja: 2 }
  return items.sort(
    (a, b) =>
      peso(a) - peso(b) ||
      pesoPrioridad[a.prioridad ?? 'media'] - pesoPrioridad[b.prioridad ?? 'media'] ||
      (a.fecha ?? '9999').localeCompare(b.fecha ?? '9999'),
  )
}

/** Indicadores de un proyecto para listados y dashboard. */
export function resumenProyecto(db: DB, proyectoId: string) {
  const h = hoy()
  const hitos = db.hitos.filter((x) => x.proyectoId === proyectoId)
  const tareas = db.tareas.filter((x) => x.proyectoId === proyectoId)
  const entregables = db.entregables.filter((x) => x.proyectoId === proyectoId)
  const actividades = db.actividades.filter((x) => x.proyectoId === proyectoId)

  const hitosVencidos = hitos.filter((x) => !x.cumplido && x.fechaPlan && x.fechaPlan < h)
  const tareasAtrasadas = tareas.filter((t) => t.estado !== 'hecho' && t.fechaEntrega && t.fechaEntrega < h)
  const entregablesAtrasados = entregables.filter((e) => e.estado !== 'entregado' && e.fecha < h)
  const proximoHito = hitos
    .filter((x) => !x.cumplido && x.fechaPlan)
    .sort((a, b) => a.fechaPlan!.localeCompare(b.fechaPlan!))[0]
  const proximoEntregable = entregables.filter((e) => e.estado !== 'entregado').sort((a, b) => a.fecha.localeCompare(b.fecha))[0]

  // Avance de la Gantt ponderado por duración de cada actividad.
  let total = 0
  let hecho = 0
  for (const a of actividades) {
    const dur = Math.max(1, (Date.parse(a.fin) - Date.parse(a.inicio)) / 864e5 + 1)
    total += dur
    hecho += (dur * a.avance) / 100
  }

  const alertas = hitosVencidos.length + tareasAtrasadas.length + entregablesAtrasados.length
  return {
    hitos,
    hitosCumplidos: hitos.filter((x) => x.cumplido).length,
    hitosVencidos,
    tareas,
    tareasHechas: tareas.filter((t) => t.estado === 'hecho').length,
    tareasAtrasadas,
    entregables,
    entregablesAtrasados,
    proximoHito,
    proximoEntregable,
    avanceGantt: total ? Math.round((hecho / total) * 100) : null,
    alertas,
    salud: (alertas === 0 ? 'verde' : alertas <= 2 ? 'amarillo' : 'rojo') as 'verde' | 'amarillo' | 'rojo',
  }
}
