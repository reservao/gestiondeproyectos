import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/backend'
import { Campo, Modal } from './ui'

const LARGO_MINIMO = 8

/** Traduce los errores de Supabase que puede ver una persona. */
function traducirError(mensaje: string) {
  const m = mensaje.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'La cuenta no está confirmada. Pídele al administrador que la revise.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.'
  if (m.includes('should be different')) return 'La contraseña nueva debe ser distinta de la actual.'
  if (m.includes('weak') || m.includes('at least')) return `La contraseña es muy débil. Usa al menos ${LARGO_MINIMO} caracteres.`
  if (m.includes('failed to fetch')) return 'No hay conexión. Revisa tu internet.'
  return mensaje
}

/**
 * En modo Supabase pide correo y contraseña. Las cuentas las crea el administrador
 * en el panel de Supabase (no hay registro público). En modo demo no hace nada.
 */
export function Login({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null | undefined>(supabase ? undefined : null)
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((_, s) => setSesion(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabase || sesion) return <>{children}</>
  if (sesion === undefined) return <p className="py-20 text-center text-slate-400">Cargando…</p>

  const entrar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setEntrando(true)
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password: clave })
    setEntrando(false)
    if (error) setError(traducirError(error.message))
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={entrar} className="card w-full max-w-sm space-y-3 p-6">
        <h1 className="text-lg font-bold text-indigo-700">Gestión de Proyectos</h1>
        <Campo label="Correo">
          <input type="email" required autoComplete="username" className="input" placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Campo>
        <Campo label="Contraseña">
          <input type="password" required autoComplete="current-password" className="input" value={clave} onChange={(e) => setClave(e.target.value)} />
        </Campo>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full justify-center" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="text-xs text-slate-400">¿Olvidaste tu contraseña? Pídele al administrador que te asigne una nueva.</p>
      </form>
    </div>
  )
}

/** Correo de la sesión, cambio de contraseña y botón para salir. No muestra nada en modo demo. */
export function MiCuenta() {
  const [email, setEmail] = useState<string | null>(null)
  const [cambiando, setCambiando] = useState(false)

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null))
  }, [])

  if (!supabase) return null
  return (
    <div className="space-y-0.5">
      {email && (
        <p className="truncate" title={email}>
          {email}
        </p>
      )}
      <div className="flex gap-3">
        <button className="underline hover:text-slate-600" onClick={() => setCambiando(true)}>
          Cambiar contraseña
        </button>
        <button className="underline hover:text-slate-600" onClick={() => supabase!.auth.signOut()}>
          Cerrar sesión
        </button>
      </div>
      {cambiando && <CambiarClave onCerrar={() => setCambiando(false)} />}
    </div>
  )
}

function CambiarClave({ onCerrar }: { onCerrar: () => void }) {
  const [clave, setClave] = useState('')
  const [repetida, setRepetida] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (clave.length < LARGO_MINIMO) return setError(`Usa al menos ${LARGO_MINIMO} caracteres.`)
    if (clave !== repetida) return setError('Las contraseñas no coinciden.')
    setGuardando(true)
    const { error } = await supabase!.auth.updateUser({ password: clave })
    setGuardando(false)
    if (error) setError(traducirError(error.message))
    else setListo(true)
  }

  return (
    <Modal titulo="Cambiar contraseña" abierto onCerrar={onCerrar} ancho="max-w-sm">
      {listo ? (
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">Listo. Desde ahora entra con tu contraseña nueva.</p>
          <button className="btn-primary" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-3">
          <Campo label="Contraseña nueva">
            <input type="password" required autoComplete="new-password" className="input" value={clave} onChange={(e) => setClave(e.target.value)} />
          </Campo>
          <Campo label="Repite la contraseña nueva">
            <input type="password" required autoComplete="new-password" className="input" value={repetida} onChange={(e) => setRepetida(e.target.value)} />
          </Campo>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      )}
    </Modal>
  )
}
