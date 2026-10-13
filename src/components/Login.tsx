import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/backend'

/** En modo Supabase pide iniciar sesión con un enlace al correo. En modo demo no hace nada. */
export function Login({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null | undefined>(supabase ? undefined : null)
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((_, s) => setSesion(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabase || sesion) return <>{children}</>
  if (sesion === undefined) return <p className="py-20 text-center text-slate-400">Cargando…</p>

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } })
    if (error) setError(error.message)
    else setEnviado(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={enviar} className="card w-full max-w-sm space-y-3 p-6">
        <h1 className="text-lg font-bold text-indigo-700">Gestión de Proyectos</h1>
        {enviado ? (
          <p className="text-sm text-slate-600">Te enviamos un enlace a <b>{email}</b>. Ábrelo para entrar.</p>
        ) : (
          <>
            <p className="text-sm text-slate-500">Ingresa tu correo y te enviaremos un enlace para entrar.</p>
            <input type="email" required className="input" placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full justify-center">Enviar enlace</button>
          </>
        )}
      </form>
    </div>
  )
}
