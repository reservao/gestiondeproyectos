import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Gantt, SelectorEscala, type Escala, type FilaGantt } from '../components/Gantt'
import { decodificarFoto, type FotoGantt } from '../lib/compartir'
import { fmt, hoy } from '../lib/fechas'

/** Vista de solo lectura para el cliente: la Gantt del proyecto tal como estaba al generar el enlace. */
export default function ClienteGantt() {
  const { datos = '' } = useParams()
  const [foto, setFoto] = useState<FotoGantt | null>(null)
  const [error, setError] = useState(false)
  const [escala, setEscala] = useState<Escala>('semana')

  useEffect(() => {
    decodificarFoto(datos)
      .then((f) => {
        setFoto(f)
        document.title = `${f.proyecto.nombre} · Carta Gantt`
      })
      .catch(() => setError(true))
  }, [datos])

  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-slate-500">
        Este enlace no es válido o está incompleto. Pide uno nuevo a tu jefe de proyecto.
      </div>
    )
  if (!foto) return <p className="py-20 text-center text-slate-400">Cargando…</p>

  const { proyecto: p } = foto
  const avance = (() => {
    let total = 0
    let hecho = 0
    for (const a of foto.actividades) {
      const d = Math.max(1, (Date.parse(a.f) - Date.parse(a.i)) / 864e5 + 1)
      total += d
      hecho += (d * a.a) / 100
    }
    return total ? Math.round((hecho / total) * 100) : null
  })()

  const filas: FilaGantt[] = [
    { tipo: 'grupo', id: 'g-a', etiqueta: 'Actividades' },
    ...foto.actividades.map(
      (a, i): FilaGantt => ({
        tipo: 'barra',
        id: 'a' + i,
        etiqueta: a.n,
        detalle: a.r ? <span className="shrink-0 text-xs text-slate-400">{a.r.split(' ')[0]}</span> : undefined,
        inicio: a.i,
        fin: a.f,
        avance: a.a,
        color: a.f < hoy() && a.a < 100 ? '#ef4444' : (a.c ?? '#6366f1'),
      }),
    ),
    ...(foto.entregables.length
      ? [
          { tipo: 'grupo', id: 'g-e', etiqueta: 'Entregables' } as FilaGantt,
          ...foto.entregables.map(
            (e, i): FilaGantt => ({
              tipo: 'hito',
              id: 'e' + i,
              etiqueta: e.n,
              fecha: e.f,
              color: !e.ok && e.f < hoy() ? '#ef4444' : '#6366f1',
              completado: e.ok,
            }),
          ),
        ]
      : []),
    ...(foto.hitos.length
      ? [
          { tipo: 'grupo', id: 'g-h', etiqueta: 'Hitos' } as FilaGantt,
          ...foto.hitos.map(
            (h, i): FilaGantt => ({
              tipo: 'hito',
              id: 'h' + i,
              etiqueta: h.n,
              fecha: h.f,
              color: !h.ok && h.f < hoy() ? '#ef4444' : '#f59e0b',
              completado: h.ok,
            }),
          ),
        ]
      : []),
  ]

  const proximos = [...foto.entregables.map((e) => ({ ...e, tipo: 'Entregable' })), ...foto.hitos.map((h) => ({ ...h, tipo: 'Hito' }))]
    .filter((x) => !x.ok)
    .sort((a, b) => a.f.localeCompare(b.f))
    .slice(0, 6)

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">Carta Gantt del proyecto</div>
          <h1 className="text-2xl font-bold">
            {p.codigo && <span className="text-slate-400">{p.codigo} · </span>}
            {p.nombre}
          </h1>
          <p className="text-sm text-slate-500">
            {p.cliente && <>{p.cliente} · </>}
            {fmt(p.inicio, 'd MMM yyyy')} → {fmt(p.fin, 'd MMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <SelectorEscala escala={escala} onChange={setEscala} />
          <button className="btn-secondary" onClick={() => window.print()}>
            Imprimir / PDF
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Avance general</div>
          <div className="text-2xl font-bold">{avance ?? '—'}%</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Entregables</div>
          <div className="text-2xl font-bold">
            {foto.entregables.filter((e) => e.ok).length} / {foto.entregables.length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Estado al</div>
          <div className="text-2xl font-bold">{fmt(foto.generada, 'd MMM yyyy')}</div>
        </div>
      </div>

      <Gantt filas={filas} escala={escala} desde={p.inicio} hasta={p.fin} />
      <p className="text-xs text-slate-500">
        ◆ relleno = cumplido / entregado · ◇ vacío = pendiente · rojo = atrasado · línea roja vertical = hoy
      </p>

      {proximos.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Próximas fechas</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {proximos.map((x, i) => (
              <li key={i} className="flex items-center gap-3 py-2">
                <span className={`w-28 shrink-0 ${x.f < hoy() ? 'font-medium text-red-600' : 'text-slate-500'}`}>{fmt(x.f, 'EEE d MMM')}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{x.tipo}</span>
                <span>{x.n}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="pt-2 text-center text-xs text-slate-400">
        Vista de solo lectura con el estado del proyecto al {fmt(foto.generada, "d 'de' MMMM yyyy")}. Para una versión actualizada, solicita un nuevo enlace.
      </footer>
    </div>
  )
}
