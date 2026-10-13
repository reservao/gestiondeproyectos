import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { COLECCIONES, type Coleccion, type DB } from './types'
import { datosDemo } from './demo'

/**
 * Dónde se guardan los datos. Hay dos implementaciones:
 * - Local: en el navegador (localStorage). Sirve para probar sin configurar nada.
 * - Supabase: base de datos compartida por todo el equipo.
 */
export interface Backend {
  tipo: 'local' | 'supabase'
  cargar(): Promise<DB>
  guardar(col: Coleccion, item: { id: string }): Promise<void>
  borrar(col: Coleccion, id: string): Promise<void>
  /** Avisa cuando otra persona cambia algo. Devuelve la función para dejar de escuchar. */
  escuchar(alCambiar: () => void): () => void
}

// ---------- Local ----------

const CLAVE = 'gestiondeproyectos:db'

function dbVacia(): DB {
  return Object.fromEntries(COLECCIONES.map((c) => [c, []])) as unknown as DB
}

class BackendLocal implements Backend {
  tipo = 'local' as const

  private leer(): DB {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) {
      const demo = datosDemo()
      localStorage.setItem(CLAVE, JSON.stringify(demo))
      return demo
    }
    return { ...dbVacia(), ...JSON.parse(crudo) }
  }

  private escribir(db: DB) {
    localStorage.setItem(CLAVE, JSON.stringify(db))
  }

  async cargar() {
    return this.leer()
  }

  async guardar(col: Coleccion, item: { id: string }) {
    const db = this.leer()
    const lista = db[col] as { id: string }[]
    const i = lista.findIndex((x) => x.id === item.id)
    if (i >= 0) lista[i] = item
    else lista.push(item)
    this.escribir(db)
  }

  async borrar(col: Coleccion, id: string) {
    const db = this.leer()
    ;(db[col] as { id: string }[]) = (db[col] as { id: string }[]).filter((x) => x.id !== id)
    this.escribir(db)
  }

  escuchar(alCambiar: () => void) {
    // Sincroniza entre pestañas del mismo navegador.
    const fn = (e: StorageEvent) => e.key === CLAVE && alCambiar()
    window.addEventListener('storage', fn)
    return () => window.removeEventListener('storage', fn)
  }
}

export function reiniciarDemo() {
  localStorage.removeItem(CLAVE)
}

// ---------- Supabase ----------

const TABLAS: Record<Coleccion, string> = {
  personas: 'personas',
  proyectos: 'proyectos',
  hitos: 'hitos',
  entregables: 'entregables',
  actividades: 'actividades',
  tareas: 'tareas',
  itemsSemana: 'items_semana',
}

const aSnake = (s: string) => s.replace(/[A-Z]/g, (l) => '_' + l.toLowerCase())
const aCamel = (s: string) => s.replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())
const mapearClaves = (o: Record<string, unknown>, f: (s: string) => string) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [f(k), v]))

class BackendSupabase implements Backend {
  tipo = 'supabase' as const
  sb: SupabaseClient

  constructor(sb: SupabaseClient) {
    this.sb = sb
  }

  async cargar() {
    const db = dbVacia()
    await Promise.all(
      COLECCIONES.map(async (col) => {
        const { data, error } = await this.sb.from(TABLAS[col]).select('*')
        if (error) throw new Error(`${TABLAS[col]}: ${error.message}`)
        ;(db[col] as unknown[]) = (data ?? []).map((fila) => mapearClaves(fila, aCamel))
      }),
    )
    return db
  }

  async guardar(col: Coleccion, item: { id: string }) {
    const fila = mapearClaves(item as unknown as Record<string, unknown>, aSnake)
    const { error } = await this.sb.from(TABLAS[col]).upsert(fila)
    if (error) throw new Error(error.message)
  }

  async borrar(col: Coleccion, id: string) {
    const { error } = await this.sb.from(TABLAS[col]).delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  escuchar(alCambiar: () => void) {
    let t: ReturnType<typeof setTimeout> | undefined
    const canal = this.sb
      .channel('cambios')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        clearTimeout(t)
        t = setTimeout(alCambiar, 300)
      })
      .subscribe()
    return () => {
      clearTimeout(t)
      this.sb.removeChannel(canal)
    }
  }
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Cliente de Supabase si está configurado (para el login); null en modo demo. */
export const supabase = url && clave ? createClient(url, clave) : null

export function crearBackend(): Backend {
  return supabase ? new BackendSupabase(supabase) : new BackendLocal()
}
