import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfISOWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'

export const hoy = () => format(new Date(), 'yyyy-MM-dd')

export const aISO = (d: Date) => format(d, 'yyyy-MM-dd')

export const sumarDias = (iso: string, dias: number) => aISO(addDays(parseISO(iso), dias))

export const diasEntre = (desde: string, hasta: string) =>
  differenceInCalendarDays(parseISO(hasta), parseISO(desde))

/** Lunes de la semana que contiene la fecha. */
export const lunesDe = (iso: string) => aISO(startOfISOWeek(parseISO(iso)))

export const finDeSemana = (lunes: string) => sumarDias(lunes, 6)

export const enRango = (iso: string | null | undefined, desde: string, hasta: string) =>
  !!iso && iso >= desde && iso <= hasta

/** ¿El intervalo [inicio, fin] se cruza con [desde, hasta]? */
export const seCruza = (inicio: string, fin: string, desde: string, hasta: string) =>
  inicio <= hasta && fin >= desde

export const fmt = (iso: string | null | undefined, patron = 'd MMM') =>
  iso ? format(parseISO(iso), patron, { locale: es }) : '—'

export const fmtSemana = (lunes: string) =>
  `${fmt(lunes, 'd MMM')} – ${fmt(finDeSemana(lunes), 'd MMM yyyy')}`

export const numeroSemana = (iso: string) => format(parseISO(iso), 'I')

/** Texto relativo: "hoy", "mañana", "en 3 días", "hace 2 días". */
export const relativo = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = diasEntre(hoy(), iso)
  if (d === 0) return 'hoy'
  if (d === 1) return 'mañana'
  if (d === -1) return 'ayer'
  return d > 0 ? `en ${d} días` : `hace ${-d} días`
}
