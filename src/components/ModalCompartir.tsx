import { useEffect, useRef, useState } from 'react'
import { codificarFoto, crearFoto, enlaceCliente } from '../lib/compartir'
import { useStore } from '../lib/store'
import type { Proyecto } from '../lib/types'
import { Modal } from './ui'

/** Genera el enlace de solo lectura con la Gantt del proyecto para enviarlo al cliente. */
export function ModalCompartir({ p, onCerrar }: { p: Proyecto; onCerrar: () => void }) {
  const { db } = useStore()
  const [conResponsables, setConResponsables] = useState(true)
  const [enlace, setEnlace] = useState('')
  const [copiado, setCopiado] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let vigente = true
    setEnlace('')
    codificarFoto(crearFoto(db, p, conResponsables)).then((c) => vigente && setEnlace(enlaceCliente(c)))
    return () => {
      vigente = false
    }
  }, [db, p, conResponsables])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      ref.current?.select()
    }
  }

  return (
    <Modal titulo="Compartir Gantt con el cliente" abierto onCerrar={onCerrar}>
      <div className="space-y-4 text-sm">
        <p className="text-slate-600">
          El cliente verá la Gantt completa del proyecto (actividades, entregables e hitos) en una página de solo lectura. No verá notas, tareas
          internas ni otros proyectos.
        </p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={conResponsables} onChange={(e) => setConResponsables(e.target.checked)} />
          Mostrar el nombre del responsable de cada actividad
        </label>
        <div className="flex gap-2">
          <input ref={ref} readOnly className="input font-mono text-xs" value={enlace || 'Generando enlace…'} onFocus={(e) => e.target.select()} />
          <button className="btn-primary shrink-0" onClick={copiar} disabled={!enlace}>
            {copiado ? 'Copiado ✓' : 'Copiar'}
          </button>
        </div>
        {enlace && (
          <a href={enlace} target="_blank" rel="noreferrer" className="inline-block text-indigo-600 hover:underline">
            Ver cómo lo verá el cliente ↗
          </a>
        )}
        <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
          El enlace muestra el estado de <b>hoy</b>. Si cambias la Gantt, genera y envía un enlace nuevo. Cualquiera que tenga el enlace puede
          verlo, así que compártelo solo con el cliente.
        </p>
      </div>
    </Modal>
  )
}
