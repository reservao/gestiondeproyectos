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
}

const Ctx = createContext<Store | null>(null)

const vacia = Object.fromEntries(COLECCIONES.map((c) => [c, []])) as unknown as DB

export function StoreProvider({ children }: { children: ReactNode }) {
  const backend = useMemo(crearBackend, [])
  const [db, setDb] = useState<DB>(vacia)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(() => {
    backend
      .cargar()
      .then((d) => {
        setDb(d)
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
    () => ({ db, cargando, error, backend, guardar, borrar, borrarProyecto }),
    [db, cargando, error, backend, guardar, borrar, borrarProyecto],
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
