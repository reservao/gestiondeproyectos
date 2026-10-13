import { useRef, useState, type ReactNode } from 'react'
import { eachMonthOfInterval, parseISO } from 'date-fns'
import { aISO, diasEntre, fmt, hoy, lunesDe, sumarDias } from '../lib/fechas'

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export type Escala = 'dia' | 'semana' | 'mes'
const PX_POR_DIA: Record<Escala, number> = { dia: 30, semana: 12, mes: 4 }
const ANCHO_ETIQUETA = 260

export type FilaGantt =
  | { tipo: 'grupo'; id: string; etiqueta: ReactNode; onClick?: () => void }
  | {
      tipo: 'barra'
      id: string
      etiqueta: ReactNode
      detalle?: ReactNode
      inicio: string
      fin: string
      color: string
      avance?: number
      onClick?: () => void
      /** Si se pasa, la barra se puede arrastrar y estirar. */
      onMover?: (inicio: string, fin: string) => void
    }
  | {
      tipo: 'hito'
      id: string
      etiqueta: ReactNode
      detalle?: ReactNode
      fecha: string
      color: string
      completado?: boolean
      onClick?: () => void
    }

export function Gantt({ filas, escala, desde, hasta }: { filas: FilaGantt[]; escala: Escala; desde?: string; hasta?: string }) {
  const px = PX_POR_DIA[escala]

  // Rango visible: lo que diga el padre, o lo que ocupen las filas (con margen).
  const fechas = filas.flatMap((f) => (f.tipo === 'barra' ? [f.inicio, f.fin] : f.tipo === 'hito' ? [f.fecha] : []))
  const min = desde ?? (fechas.length ? fechas.reduce((a, b) => (a < b ? a : b)) : hoy())
  const max = hasta ?? (fechas.length ? fechas.reduce((a, b) => (a > b ? a : b)) : sumarDias(hoy(), 30))
  const inicio = lunesDe(sumarDias(min < hoy() ? min : hoy(), -7))
  const fin = sumarDias(lunesDe(sumarDias(max > hoy() ? max : hoy(), 14)), 6)
  const totalDias = diasEntre(inicio, fin) + 1
  const ancho = totalDias * px
  const x = (iso: string) => diasEntre(inicio, iso) * px

  const meses = eachMonthOfInterval({ start: parseISO(inicio), end: parseISO(fin) }).map((m) => {
    const iso = aISO(m)
    const ini = iso < inicio ? inicio : iso
    const sig = aISO(new Date(m.getFullYear(), m.getMonth() + 1, 1))
    const f = sig > fin ? sumarDias(fin, 1) : sig
    return { iso, left: x(ini), width: diasEntre(ini, f) * px }
  })
  const semanas = Array.from({ length: Math.ceil(totalDias / 7) }, (_, i) => sumarDias(inicio, i * 7))
  const dias = escala === 'dia' ? Array.from({ length: totalDias }, (_, i) => sumarDias(inicio, i)) : []

  // Fondo: fines de semana sombreados (inicio siempre es lunes) y línea por semana.
  const fondo =
    escala === 'mes'
      ? `repeating-linear-gradient(to right, transparent 0, transparent ${7 * px - 1}px, #f1f5f9 ${7 * px - 1}px, #f1f5f9 ${7 * px}px)`
      : `repeating-linear-gradient(to right, transparent 0, transparent ${5 * px}px, #f8fafc ${5 * px}px, #f8fafc ${7 * px - 1}px, #e2e8f0 ${7 * px - 1}px, #e2e8f0 ${7 * px}px)`

  return (
    <div className="card overflow-x-auto">
      <div className="relative" style={{ width: ANCHO_ETIQUETA + ancho }}>
        {/* Cabecera */}
        <div className="sticky top-0 z-20 flex border-b border-slate-200 bg-white text-[11px] text-slate-500">
          <div className="sticky left-0 z-30 shrink-0 border-r border-slate-200 bg-white" style={{ width: ANCHO_ETIQUETA }} />
          <div className="relative" style={{ width: ancho, height: escala === 'dia' ? 54 : 38 }}>
            {meses.map((m) => (
              <div key={m.iso} className="absolute top-0 truncate border-l border-slate-200 px-1.5 py-0.5 font-semibold text-slate-600" style={{ left: m.left, width: m.width }}>
                {mayuscula(fmt(m.iso, 'MMMM yyyy'))}
              </div>
            ))}
            {escala !== 'mes' &&
              semanas.map((s) => (
                <div key={s} className="absolute top-[18px] truncate border-l border-slate-200 px-1" style={{ left: x(s), width: 7 * px }}>
                  {escala === 'dia' ? `S${fmt(s, 'I')}` : fmt(s, 'd/M')}
                </div>
              ))}
            {dias.map((d) => (
              <div key={d} className={`absolute top-[36px] text-center ${d === hoy() ? 'font-bold text-indigo-600' : ''}`} style={{ left: x(d), width: px }}>
                {fmt(d, 'd')}
              </div>
            ))}
          </div>
        </div>

        {/* Filas */}
        <div className="relative">
          {filas.map((f) => (
            <Fila key={f.id} fila={f} x={x} px={px} ancho={ancho} fondo={fondo} />
          ))}
          {filas.length === 0 && <div className="p-6 text-center text-sm text-slate-400">Nada que mostrar todavía.</div>}
          {/* Línea de hoy */}
          <div className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-red-400/70" style={{ left: ANCHO_ETIQUETA + x(hoy()) + px / 2 }} />
        </div>
      </div>
    </div>
  )
}

function Fila({ fila, x, px, ancho, fondo }: { fila: FilaGantt; x: (iso: string) => number; px: number; ancho: number; fondo: string }) {
  if (fila.tipo === 'grupo') {
    return (
      <div className="flex border-b border-slate-200 bg-slate-100/80">
        <div
          className={`sticky left-0 z-10 min-w-0 shrink-0 overflow-hidden border-r border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-semibold ${fila.onClick ? 'cursor-pointer hover:text-indigo-600' : ''}`}
          style={{ width: ANCHO_ETIQUETA }}
          onClick={fila.onClick}
        >
          {fila.etiqueta}
        </div>
        <div style={{ width: ancho }} />
      </div>
    )
  }
  return (
    <div className="group flex border-b border-slate-100 hover:bg-indigo-50/40">
      <div
        className="sticky left-0 z-10 flex shrink-0 cursor-pointer items-center gap-2 border-r border-slate-200 bg-white px-3 py-1 text-sm group-hover:bg-indigo-50"
        style={{ width: ANCHO_ETIQUETA }}
        onClick={fila.onClick}
      >
        <span className="min-w-0 flex-1 truncate">{fila.etiqueta}</span>
        {fila.detalle}
      </div>
      <div className="relative h-9" style={{ width: ancho, background: fondo }}>
        {fila.tipo === 'barra' ? <Barra fila={fila} x={x} px={px} /> : <Diamante fila={fila} x={x} px={px} />}
      </div>
    </div>
  )
}

function Diamante({ fila, x, px }: { fila: Extract<FilaGantt, { tipo: 'hito' }>; x: (iso: string) => number; px: number }) {
  return (
    <button
      onClick={fila.onClick}
      title={`${typeof fila.etiqueta === 'string' ? fila.etiqueta : ''} · ${fmt(fila.fecha, 'd MMM yyyy')}`}
      className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2"
      style={{
        left: x(fila.fecha) + px / 2,
        borderColor: fila.color,
        background: fila.completado ? fila.color : 'white',
      }}
    />
  )
}

function Barra({ fila, x, px }: { fila: Extract<FilaGantt, { tipo: 'barra' }>; x: (iso: string) => number; px: number }) {
  const [delta, setDelta] = useState<{ modo: 'mover' | 'ini' | 'fin'; dias: number } | null>(null)
  const arrastre = useRef<{ x0: number; modo: 'mover' | 'ini' | 'fin'; movido: boolean } | null>(null)

  let inicio = fila.inicio
  let fin = fila.fin
  if (delta) {
    if (delta.modo !== 'fin') inicio = sumarDias(fila.inicio, delta.dias)
    if (delta.modo !== 'ini') fin = sumarDias(fila.fin, delta.dias)
    if (inicio > fin) delta.modo === 'ini' ? (inicio = fin) : (fin = inicio)
  }
  const left = x(inicio)
  const width = (diasEntre(inicio, fin) + 1) * px

  const empezar = (modo: 'mover' | 'ini' | 'fin') => (e: React.PointerEvent) => {
    if (!fila.onMover) return
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    arrastre.current = { x0: e.clientX, modo, movido: false }
  }
  const mover = (e: React.PointerEvent) => {
    const a = arrastre.current
    if (!a) return
    const dias = Math.round((e.clientX - a.x0) / px)
    if (dias !== 0) a.movido = true
    setDelta({ modo: a.modo, dias })
  }
  const soltar = () => {
    const a = arrastre.current
    arrastre.current = null
    if (a?.movido && fila.onMover && (inicio !== fila.inicio || fin !== fila.fin)) fila.onMover(inicio, fin)
    else if (!a?.movido) fila.onClick?.()
    setDelta(null)
  }

  const asas = !!fila.onMover
  return (
    <div
      className={`absolute top-1.5 bottom-1.5 overflow-hidden rounded shadow-sm ${asas ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      style={{ left, width, background: fila.color + '55', border: `1px solid ${fila.color}` }}
      title={`${fmt(inicio, 'd MMM')} → ${fmt(fin, 'd MMM yyyy')}`}
      onPointerDown={asas ? empezar('mover') : undefined}
      onPointerMove={mover}
      onPointerUp={soltar}
      onClick={asas ? undefined : fila.onClick}
    >
      <div className="h-full" style={{ width: `${fila.avance ?? 0}%`, background: fila.color }} />
      {fila.avance !== undefined && width > 40 && (
        <span className="absolute inset-y-0 left-1.5 flex items-center text-[10px] font-semibold text-slate-800">{fila.avance}%</span>
      )}
      {asas && (
        <>
          <span className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize" onPointerDown={empezar('ini')} />
          <span className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize" onPointerDown={empezar('fin')} />
        </>
      )}
    </div>
  )
}

export function SelectorEscala({ escala, onChange }: { escala: Escala; onChange: (e: Escala) => void }) {
  const ops: [Escala, string][] = [
    ['dia', 'Días'],
    ['semana', 'Semanas'],
    ['mes', 'Meses'],
  ]
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-300 bg-white text-sm">
      {ops.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} className={`px-3 py-1 ${escala === v ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}>
          {l}
        </button>
      ))}
    </div>
  )
}
