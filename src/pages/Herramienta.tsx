import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HERRAMIENTAS } from '../lib/herramientas'

/** Muestra una herramienta embebida a todo el alto, con el menú de la app visible. */
export default function Herramienta() {
  const { slug } = useParams()
  const h = HERRAMIENTAS.find((x) => x.slug === slug)

  if (!h || h.tipo !== 'embebida') {
    return (
      <div className="py-20 text-center text-slate-500">
        <p>No encontramos esa herramienta.</p>
        <Link to="/" className="text-indigo-700 underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-2rem)] flex-col gap-2 md:h-[calc(100dvh-3rem)]">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">
          {h.icono} {h.nombre}
        </h1>
        <a href={h.archivo} target="_blank" rel="noopener" className="ml-auto text-xs text-slate-500 underline hover:text-slate-800">
          Abrir en pestaña nueva
        </a>
      </div>
      {/* key: al cambiar de herramienta se crea un marco nuevo en vez de reutilizar el anterior. */}
      <Marco key={h.slug} src={h.archivo} titulo={h.nombre} />
    </div>
  )
}

function Marco({ src, titulo }: { src: string; titulo: string }) {
  const [cargada, setCargada] = useState(false)
  return (
    <div className="card relative min-h-0 flex-1 overflow-hidden bg-white">
      {!cargada && <p className="absolute inset-0 py-20 text-center text-slate-400">Cargando {titulo}…</p>}
      <iframe src={src} title={titulo} onLoad={() => setCargada(true)} className={`h-full w-full ${cargada ? '' : 'opacity-0'}`} />
    </div>
  )
}
