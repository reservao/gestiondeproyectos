import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { crearBackend, type Backend } from './backend'
import { COLECCIONES, type Coleccion, type DB, type Entidad } from './types'

interface Store {
  db: DB
  cargando: boolean
  error: string | null
  backend: Backend
  guardar<C extends Coleccion>(col: C, item: Entidad<C>): void
  borrar(col: Coleccion, id: string): void
  borrarProyecto(id: string): void
  /** Línea de negocio elegida en el filtro general (null = todas). */
  lineaFiltro: string | null
  setLineaFiltro(id: string | null): void
}

const CLAVE_FILTRO = 'gestiondeproyectos:linea'
const leerFiltro = () => {
  try {
    return localStorage.getItem(CLAVE_FILTRO)
  } catch {
    return null
  }
}

const Ctx = createContext<Store | null>(null)

const vacia = Object.fromEntries(COLECCIONES.map((c) => [c, []])) as unknown as DB

export function StoreProvider({ children }: { children: ReactNode }) {
  const backend = useMemo(crearBackend, [])
  const [db, setDb] = useState<DB>(vacia)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lineaFiltro, setLineaFiltroState] = useState<string | null>(leerFiltro)
  const setLineaFiltro = useCallback((id: string | null) => {
    setLineaFiltroState(id)
    try {
      if (id) localStorage.setItem(CLAVE_FILTRO, id)
      else localStorage.removeItem(CLAVE_FILTRO)
    } catch {
      // sin almacenamiento: el filtro dura solo mientras la página esté abierta
    }
  }, [])

  const recargar = useCallback(() => {
    backend
      .cargar()
      .then((d) => {
        // Datos guardados antes de existir las líneas de negocio.
        setDb({ ...d, lineas: d.lineas ?? [], proyectos: d.proyectos.map((p) => ({ ...p, lineaId: p.lineaId ?? null })) })
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false))
  }, [backend])

  useEffect(() => {
    recargar()
    return backend.escuchar(recargar)
  }, [backend, recargar])

  const fallo = useCallback(
    (e: Error) => {
      setError(e.message)
      recargar()
    },
    [recargar],
  )

  const guardar = useCallback(
    <C extends Coleccion>(col: C, item: Entidad<C>) => {
      setDb((prev) => {
        const lista = prev[col] as Entidad<C>[]
        const existe = lista.some((x) => x.id === item.id)
        return {
          ...prev,
          [col]: existe ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item],
        }
      })
      backend.guardar(col, item).catch(fallo)
    },
    [backend, fallo],
  )

  const borrar = useCallback(
    (col: Coleccion, id: string) => {
      setDb((prev) => ({ ...prev, [col]: (prev[col] as { id: string }[]).filter((x) => x.id !== id) }))
      backend.borrar(col, id).catch(fallo)
    },
    [backend, fallo],
  )

  const borrarProyecto = useCallback(
    (id: string) => {
      // Las notas del cliente se conservan: pertenecen al cliente, no al proyecto.
      const hijas: Coleccion[] = ['hitos', 'entregables', 'actividades', 'tareas', 'itemsSemana', 'notas']
      for (const col of hijas) {
        for (const x of db[col] as { id: string; proyectoId: string | null; ambito?: string }[]) {
          if (x.proyectoId === id && x.ambito !== 'cliente') borrar(col, x.id)
        }
      }
      borrar('proyectos', id)
    },
    [db, borrar],
  )

  const valor = useMemo(
    () => ({ db, cargando, error, backend, guardar, borrar, borrarProyecto, lineaFiltro, setLineaFiltro }),
    [db, cargando, error, backend, guardar, borrar, borrarProyecto, lineaFiltro, setLineaFiltro],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fuera de StoreProvider')
  return s
}

/** Busca personas y proyectos por id de forma cómoda. */
export function useLookups() {
  const { db } = useStore()
  return useMemo(() => {
    const personas = new Map(db.personas.map((p) => [p.id, p]))
    const proyectos = new Map(db.proyectos.map((p) => [p.id, p]))
    return {
      persona: (id: string | null | undefined) => (id ? personas.get(id) : undefined),
      proyecto: (id: string | null | undefined) => (id ? proyectos.get(id) : undefined),
    }
  }, [db.personas, db.proyectos])
}

/**
 * Los datos visibles según el filtro de línea de negocio: solo los proyectos de esa
 * línea y lo que cuelga de ellos. Los pendientes sin proyecto se ven solo con "Todas".
 */
export function useDbFiltrada(): DB {
  const { db, lineaFiltro } = useStore()
  return useMemo(() => {
    const linea = lineaFiltro && db.lineas.some((l) => l.id === lineaFiltro) ? lineaFiltro : null
    if (!linea) return db
    const proyectos = db.proyectos.filter((p) => p.lineaId === linea)
    const ids = new Set(proyectos.map((p) => p.id))
    const dePr = <T extends { proyectoId: string | null }>(xs: T[]) => xs.filter((x) => !!x.proyectoId && ids.has(x.proyectoId))
    return {
      ...db,
      proyectos,
      hitos: dePr(db.hitos),
      entregables: dePr(db.entregables),
      actividades: dePr(db.actividades),
      tareas: dePr(db.tareas),
      itemsSemana: dePr(db.itemsSemana),
      notas: dePr(db.notas),
    }
  }, [db, lineaFiltro])
}
