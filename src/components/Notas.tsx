import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { nuevoId } from '../lib/demo'
import { useStore } from '../lib/store'
import type { Nota, Proyecto } from '../lib/types'
import { BotonConfirmar } from './ui'

/**
 * Cuaderno de notas del proyecto, al estilo OneNote: secciones (Proyecto / Cliente),
 * lista de páginas a la izquierda y editor con formato a la derecha. Se guarda solo.
 */
export function Notas({ p }: { p: Proyecto }) {
  const { db, guardar, borrar } = useStore()
  const [seccion, setSeccion] = useState<'proyecto' | 'cliente'>('proyecto')
  const [busqueda, setBusqueda] = useState('')
  const [abiertaId, setAbiertaId] = useState<string | null>(null)

  const deProyecto = db.notas.filter((n) => n.ambito === 'proyecto' && n.proyectoId === p.id)
  const deCliente = p.cliente ? db.notas.filter((n) => n.ambito === 'cliente' && n.cliente === p.cliente) : []
  const lista = (seccion === 'proyecto' ? deProyecto : deCliente)
    .filter((n) => {
      const q = busqueda.trim().toLowerCase()
      return !q || n.titulo.toLowerCase().includes(q) || textoPlano(n.contenido).toLowerCase().includes(q)
    })
    .sort((a, b) => b.actualizada.localeCompare(a.actualizada))

  const abierta = db.notas.find((n) => n.id === abiertaId) ?? lista[0] ?? null

  const nueva = () => {
    const ahora = new Date().toISOString()
    const n: Nota = {
      id: nuevoId(),
      ambito: seccion,
      proyectoId: p.id,
      cliente: seccion === 'cliente' ? p.cliente : null,
      titulo: '',
      contenido: '',
      creada: ahora,
      actualizada: ahora,
    }
    guardar('notas', n)
    setBusqueda('')
    setAbiertaId(n.id)
  }

  return (
    <div className="card flex min-h-[560px] flex-col overflow-hidden md:flex-row">
      {/* Secciones y páginas */}
      <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-slate-50 md:w-72 md:border-r md:border-b-0">
        <div className="flex border-b border-slate-200 text-sm">
          {(
            [
              ['proyecto', 'Proyecto', deProyecto.length, 'border-indigo-500'],
              ['cliente', 'Cliente', deCliente.length, 'border-amber-500'],
            ] as const
          ).map(([k, l, n, borde]) => (
            <button
              key={k}
              onClick={() => {
                setSeccion(k)
                setAbiertaId(null)
              }}
              className={`flex-1 border-b-2 px-3 py-2 ${seccion === k ? `${borde} bg-white font-medium` : 'border-transparent text-slate-500 hover:bg-white/60'}`}
            >
              {l} <span className="text-xs text-slate-400">{n}</span>
            </button>
          ))}
        </div>
        {seccion === 'cliente' && (
          <p className="border-b border-slate-200 px-3 py-2 text-xs text-slate-500">
            {p.cliente ? (
              <>
                Notas de <b>{p.cliente}</b>. Se ven en todos sus proyectos.
              </>
            ) : (
              'Este proyecto no tiene cliente asignado. Agrégalo en "Editar proyecto".'
            )}
          </p>
        )}
        <div className="flex gap-2 p-2">
          <input className="input" placeholder="Buscar en notas…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <button className="btn-primary shrink-0" onClick={nueva} disabled={seccion === 'cliente' && !p.cliente} title="Nueva página">
            +
          </button>
        </div>
        <ul className="max-h-60 flex-1 overflow-y-auto md:max-h-none">
          {lista.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setAbiertaId(n.id)}
                className={`block w-full border-l-4 px-3 py-2 text-left ${abierta?.id === n.id ? 'border-indigo-500 bg-white' : 'border-transparent hover:bg-white/70'}`}
              >
                <div className="truncate text-sm font-medium">{n.titulo || 'Sin título'}</div>
                <div className="truncate text-xs text-slate-500">{textoPlano(n.contenido) || 'Vacía'}</div>
                <div className="text-[11px] text-slate-400">{fechaHora(n.actualizada)}</div>
              </button>
            </li>
          ))}
          {lista.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-400">{busqueda ? 'Sin resultados.' : 'Aún no hay notas. Crea la primera con +.'}</li>
          )}
        </ul>
      </aside>

      {/* Página */}
      <section className="flex min-w-0 flex-1 flex-col">
        {abierta ? (
          <Editor
            key={abierta.id}
            nota={abierta}
            onCambio={(cambios) => guardar('notas', { ...abierta, ...cambios, actualizada: new Date().toISOString() })}
            onEliminar={() => {
              borrar('notas', abierta.id)
              setAbiertaId(null)
            }}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-slate-400">
            Selecciona una nota o crea una nueva con el botón +.
          </div>
        )}
      </section>
    </div>
  )
}

// ---------- Editor ----------

const HERRAMIENTAS: { cmd: string; arg?: string; etiqueta: string; titulo: string; clase?: string }[] = [
  { cmd: 'bold', etiqueta: 'B', titulo: 'Negrita (Ctrl+B)', clase: 'font-bold' },
  { cmd: 'italic', etiqueta: 'I', titulo: 'Cursiva (Ctrl+I)', clase: 'italic' },
  { cmd: 'underline', etiqueta: 'U', titulo: 'Subrayado (Ctrl+U)', clase: 'underline' },
  { cmd: 'strikeThrough', etiqueta: 'S', titulo: 'Tachado', clase: 'line-through' },
  { cmd: 'hiliteColor', arg: '#fef08a', etiqueta: '🖍', titulo: 'Resaltar' },
  { cmd: 'formatBlock', arg: 'h2', etiqueta: 'Título', titulo: 'Título' },
  { cmd: 'formatBlock', arg: 'h3', etiqueta: 'Subtítulo', titulo: 'Subtítulo' },
  { cmd: 'formatBlock', arg: 'p', etiqueta: 'Normal', titulo: 'Texto normal' },
  { cmd: 'insertUnorderedList', etiqueta: '• Lista', titulo: 'Lista con viñetas' },
  { cmd: 'insertOrderedList', etiqueta: '1. Lista', titulo: 'Lista numerada' },
  { cmd: 'removeFormat', etiqueta: '⌫ Formato', titulo: 'Quitar formato' },
]

function Editor({ nota, onCambio, onEliminar }: { nota: Nota; onCambio: (c: Partial<Nota>) => void; onEliminar: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [titulo, setTitulo] = useState(nota.titulo)
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pendiente = useRef<Partial<Nota> | null>(null)
  const onCambioRef = useRef(onCambio)
  onCambioRef.current = onCambio

  // El contenido se carga una sola vez por nota; después el editor es dueño del texto.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = limpiarHtml(nota.contenido)
    if (!nota.titulo) document.getElementById('nota-titulo')?.focus()
  }, [])

  // Guarda lo pendiente al cambiar de nota o salir.
  useEffect(
    () => () => {
      clearTimeout(temporizador.current)
      if (pendiente.current) onCambioRef.current(pendiente.current)
    },
    [],
  )

  const programarGuardado = (cambios: Partial<Nota>) => {
    pendiente.current = { ...pendiente.current, ...cambios }
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => {
      if (pendiente.current) onCambioRef.current(pendiente.current)
      pendiente.current = null
    }, 500)
  }

  const guardarContenido = () => ref.current && programarGuardado({ contenido: limpiarHtml(ref.current.innerHTML) })

  /** Enfoca el editor sin mover el cursor; si no estaba enfocado, lo deja al final del texto. */
  const enfocar = () => {
    const el = ref.current
    if (!el || document.activeElement === el) return
    el.focus()
    const sel = window.getSelection()
    if (sel && !el.contains(sel.anchorNode)) {
      sel.selectAllChildren(el)
      sel.collapseToEnd()
    }
  }

  const aplicar = (cmd: string, arg?: string) => {
    enfocar()
    // Algunos comandos (listas, títulos) mandan el cursor al inicio: lo devolvemos a su sitio.
    const pos = ref.current ? posicionCursor(ref.current) : null
    document.execCommand(cmd, false, arg)
    if (pos !== null && ref.current) restaurarCursor(ref.current, pos)
    guardarContenido()
  }

  const insertarFecha = () => {
    enfocar()
    document.execCommand('insertHTML', false, `<p><b>${format(new Date(), "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })}</b></p><p><br></p>`)
    guardarContenido()
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 pt-4 pb-2">
        <div className="min-w-0 flex-1">
          <input
            id="nota-titulo"
            className="w-full border-none bg-transparent text-xl font-semibold outline-none placeholder:text-slate-300"
            placeholder="Título de la nota"
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value)
              programarGuardado({ titulo: e.target.value })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                enfocar()
              }
            }}
          />
          <div className="text-xs text-slate-400">
            {nota.ambito === 'cliente' ? `Nota del cliente ${nota.cliente}` : 'Nota del proyecto'} · creada {fechaHora(nota.creada)} · editada{' '}
            {fechaHora(nota.actualizada)}
          </div>
        </div>
        <BotonConfirmar pregunta="¿Eliminar esta nota?" onConfirmar={onEliminar}>
          Eliminar
        </BotonConfirmar>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-100 bg-slate-50/70 px-4 py-1.5">
        {HERRAMIENTAS.map((h) => (
          <button
            key={h.cmd + (h.arg ?? '')}
            type="button"
            title={h.titulo}
            onMouseDown={(e) => {
              e.preventDefault() // no perder la selección
              aplicar(h.cmd, h.arg)
            }}
            className={`rounded px-2 py-1 text-xs text-slate-700 hover:bg-white hover:shadow-sm ${h.clase ?? ''}`}
          >
            {h.etiqueta}
          </button>
        ))}
        <button
          type="button"
          title="Insertar fecha y hora"
          onMouseDown={(e) => {
            e.preventDefault()
            insertarFecha()
          }}
          className="rounded px-2 py-1 text-xs text-slate-700 hover:bg-white hover:shadow-sm"
        >
          📅 Fecha
        </button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={guardarContenido}
        onBlur={guardarContenido}
        data-placeholder="Escribe aquí… (acuerdos de reunión, contactos, pendientes, ideas)"
        className="nota-editor flex-1 overflow-y-auto px-5 py-4 text-[15px] leading-relaxed outline-none"
      />
    </div>
  )
}

// ---------- Utilidades ----------

/** Caracteres de texto antes del cursor, o null si hay texto seleccionado. */
function posicionCursor(el: HTMLElement): number | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed || !el.contains(sel.anchorNode)) return null
  const r = document.createRange()
  r.selectNodeContents(el)
  r.setEnd(sel.anchorNode!, sel.anchorOffset)
  return r.toString().length
}

function restaurarCursor(el: HTMLElement, pos: number) {
  const recorrido = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let restante = pos
  let nodo: Node | null
  while ((nodo = recorrido.nextNode())) {
    const largo = nodo.textContent?.length ?? 0
    if (restante <= largo) {
      const sel = window.getSelection()!
      sel.collapse(nodo, restante)
      return
    }
    restante -= largo
  }
}

const fechaHora = (iso: string) => format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: es })

function textoPlano(html: string) {
  const d = document.createElement('div')
  d.innerHTML = limpiarHtml(html).replace(/<\/(p|div|li|h1|h2|h3)>|<br\s*\/?>/gi, ' $&')
  return (d.textContent ?? '').replace(/\s+/g, ' ').trim()
}

const ETIQUETAS_PERMITIDAS = new Set(['P', 'BR', 'DIV', 'SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'MARK', 'H1', 'H2', 'H3', 'UL', 'OL', 'LI', 'A', 'FONT'])

/** Deja solo formato básico: quita scripts, eventos y estilos ajenos (por si se pega desde otra web). */
export function limpiarHtml(html: string) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const raiz = doc.body.firstElementChild as HTMLElement
  const recorrer = (el: Element) => {
    for (const hijo of [...el.children]) {
      if (!ETIQUETAS_PERMITIDAS.has(hijo.tagName)) {
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'IMG', 'SVG', 'LINK', 'META'].includes(hijo.tagName)) hijo.remove()
        else {
          recorrer(hijo)
          hijo.replaceWith(...hijo.childNodes)
        }
        continue
      }
      for (const attr of [...hijo.attributes]) {
        const permitido =
          (attr.name === 'style' && /^\s*background-color:[^;]+;?\s*$/i.test(attr.value)) ||
          (hijo.tagName === 'A' && attr.name === 'href' && /^https?:\/\//i.test(attr.value))
        if (!permitido) hijo.removeAttribute(attr.name)
      }
      recorrer(hijo)
    }
  }
  recorrer(raiz)
  return raiz.innerHTML
}
