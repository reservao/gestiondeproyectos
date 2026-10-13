import { useEffect, type ReactNode } from 'react'
import { useStore } from '../lib/store'
import type { Persona, Prioridad } from '../lib/types'
import { PRIORIDADES } from '../lib/types'

export function Modal({
  titulo,
  abierto,
  onCerrar,
  children,
  ancho = 'max-w-lg',
}: {
  titulo: string
  abierto: boolean
  onCerrar: () => void
  children: ReactNode
  ancho?: string
}) {
  useEffect(() => {
    if (!abierto) return
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [abierto, onCerrar])

  if (!abierto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-16" onMouseDown={onCerrar}>
      <div className={`card w-full ${ancho} p-5`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button className="text-slate-400 hover:text-slate-700" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Campo({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

export function Avatar({ persona, size = 'sm' }: { persona?: Persona; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'
  if (!persona)
    return <span className={`${s} inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500`}>?</span>
  const iniciales = persona.nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      title={persona.nombre}
      className={`${s} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      style={{ background: persona.color }}
    >
      {iniciales}
    </span>
  )
}

export function PersonaChip({ persona }: { persona?: Persona }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Avatar persona={persona} />
      <span className={persona ? '' : 'text-slate-400'}>{persona?.nombre ?? 'Sin asignar'}</span>
    </span>
  )
}

export function SelectPersona({
  value,
  onChange,
  vacio = 'Sin asignar',
}: {
  value: string | null
  onChange: (id: string | null) => void
  vacio?: string
}) {
  const { db } = useStore()
  return (
    <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{vacio}</option>
      {db.personas.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nombre}
        </option>
      ))}
    </select>
  )
}

export function SelectProyecto({
  value,
  onChange,
  vacio = 'Sin proyecto',
}: {
  value: string | null
  onChange: (id: string | null) => void
  vacio?: string
}) {
  const { db } = useStore()
  return (
    <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{vacio}</option>
      {db.proyectos.map((p) => (
        <option key={p.id} value={p.id}>
          {p.codigo ? `${p.codigo} · ` : ''}
          {p.nombre}
        </option>
      ))}
    </select>
  )
}

const COLOR_PRIORIDAD: Record<Prioridad, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja: 'bg-slate-100 text-slate-600',
}

export function BadgePrioridad({ p }: { p: Prioridad }) {
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${COLOR_PRIORIDAD[p]}`}>{PRIORIDADES[p]}</span>
}

export function Badge({ children, color = 'slate' }: { children: ReactNode; color?: 'slate' | 'red' | 'green' | 'amber' | 'indigo' | 'sky' }) {
  const c = {
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    indigo: 'bg-indigo-100 text-indigo-700',
    sky: 'bg-sky-100 text-sky-700',
  }[color]
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${c}`}>{children}</span>
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-slate-400">{children}</p>
}

export function BarraProgreso({ valor, color = 'bg-indigo-500' }: { valor: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, valor))}%` }} />
    </div>
  )
}

export function confirmar(msg: string) {
  return window.confirm(msg)
}
