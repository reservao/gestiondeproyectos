import type { DB, Proyecto } from './types'
import { hoy } from './fechas'

/**
 * "Foto" de la Gantt de un proyecto para compartir con el cliente.
 * Viaja comprimida dentro del enlace, así que no necesita servidor.
 * Solo incluye lo que se ve en la Gantt: nada de notas, tareas internas ni equipo completo.
 */
export interface FotoGantt {
  v: 1
  generada: string
  proyecto: { codigo: string; nombre: string; cliente: string; inicio: string; fin: string }
  actividades: { n: string; i: string; f: string; a: number; r?: string; c?: string }[]
  entregables: { n: string; f: string; ok: boolean; r?: string }[]
  hitos: { n: string; f: string; ok: boolean }[]
}

export function crearFoto(db: DB, p: Proyecto, conResponsables: boolean): FotoGantt {
  const persona = (id: string | null) => (id ? db.personas.find((x) => x.id === id) : undefined)
  return {
    v: 1,
    generada: hoy(),
    proyecto: { codigo: p.codigo, nombre: p.nombre, cliente: p.cliente, inicio: p.fechaInicio, fin: p.fechaFin },
    actividades: db.actividades
      .filter((a) => a.proyectoId === p.id)
      .sort((a, b) => a.orden - b.orden || a.inicio.localeCompare(b.inicio))
      .map((a) => ({
        n: a.nombre,
        i: a.inicio,
        f: a.fin,
        a: a.avance,
        ...(conResponsables && persona(a.responsableId) ? { r: persona(a.responsableId)!.nombre, c: persona(a.responsableId)!.color } : {}),
      })),
    entregables: db.entregables
      .filter((e) => e.proyectoId === p.id)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((e) => ({
        n: e.nombre,
        f: e.fecha,
        ok: e.estado === 'entregado',
        ...(conResponsables && persona(e.responsableId) ? { r: persona(e.responsableId)!.nombre } : {}),
      })),
    hitos: db.hitos
      .filter((h) => h.proyectoId === p.id && h.fechaPlan)
      .sort((a, b) => a.fechaPlan!.localeCompare(b.fechaPlan!))
      .map((h) => ({ n: h.nombre, f: h.fechaPlan!, ok: h.cumplido })),
  }
}

// JSON → deflate → base64url (y al revés), con las APIs nativas del navegador.

async function transformar(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  const salida = new Blob([bytes]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(salida).arrayBuffer())
}

export async function codificarFoto(foto: FotoGantt): Promise<string> {
  const comprimido = await transformar(new TextEncoder().encode(JSON.stringify(foto)), new CompressionStream('deflate-raw'))
  let bin = ''
  comprimido.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function decodificarFoto(texto: string): Promise<FotoGantt> {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  const json = new TextDecoder().decode(await transformar(bytes, new DecompressionStream('deflate-raw')))
  const foto = JSON.parse(json) as FotoGantt
  if (foto.v !== 1 || !foto.proyecto) throw new Error('Formato no reconocido')
  return foto
}

export function enlaceCliente(codigo: string) {
  return `${location.origin}${location.pathname}#/cliente/${codigo}`
}
