import { NavLink, Route, Routes } from 'react-router-dom'
import { reiniciarDemo } from './lib/backend'
import { useStore } from './lib/store'
import { BotonConfirmar } from './components/ui'
import { MiCuenta } from './components/Login'
import { FormLineas } from './components/formularios'
import { useState } from 'react'
import Equipo from './pages/Equipo'
import GanttGeneral from './pages/GanttGeneral'
import Inicio from './pages/Inicio'
import ProyectoDetalle from './pages/ProyectoDetalle'
import Proyectos from './pages/Proyectos'
import Semana from './pages/Semana'

const MENU = [
  ['/', 'Inicio', '🏠'],
  ['/semana', 'Semana', '🗓️'],
  ['/gantt', 'Gantt general', '📊'],
  ['/proyectos', 'Proyectos', '📁'],
  ['/equipo', 'Equipo', '👥'],
] as const

export default function App() {
  const { db, cargando, error, backend, lineaFiltro, setLineaFiltro } = useStore()
  const [gestionLineas, setGestionLineas] = useState(false)
  const lineaActiva = db.lineas.find((l) => l.id === lineaFiltro)

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-56 md:border-r md:border-b-0">
        <div className="px-4 py-4 text-lg font-bold text-indigo-700">Gestión de Proyectos</div>
        <div className="px-3 pb-3">
          <label htmlFor="filtro-linea" className="label">
            Línea de negocio
          </label>
          <div className="flex gap-1">
            <select
              id="filtro-linea"
              className="input"
              value={lineaActiva?.id ?? ''}
              onChange={(e) => setLineaFiltro(e.target.value || null)}
              style={lineaActiva ? { borderColor: lineaActiva.color, boxShadow: `inset 4px 0 0 ${lineaActiva.color}` } : undefined}
            >
              <option value="">Todas las líneas</option>
              {db.lineas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
            <button className="btn-secondary shrink-0 px-2" title="Administrar líneas de negocio" onClick={() => setGestionLineas(true)}>
              ⚙
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {MENU.map(([to, label, icono]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap ${isActive ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              <span>{icono}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={`mt-auto px-4 pb-3 text-[11px] text-slate-400 md:block md:p-4 ${backend.tipo === 'local' ? 'hidden' : ''}`}>
          {backend.tipo === 'local' ? (
            <>
              <p>Modo demo: los datos se guardan solo en este navegador.</p>
              <div className="mt-1">
                <BotonConfirmar
                  className="underline hover:text-slate-600"
                  pregunta="¿Borrar tus cambios?"
                  onConfirmar={() => {
                    reiniciarDemo()
                    location.reload()
                  }}
                >
                  Reiniciar datos de ejemplo
                </BotonConfirmar>
              </div>
            </>
          ) : (
            <>
              <p className="hidden md:block">Datos compartidos (Supabase).</p>
              <MiCuenta />
            </>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-6">
        {lineaActiva && (
          <div className="mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm" style={{ background: lineaActiva.color + '1a' }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: lineaActiva.color }} />
            Mostrando solo la línea <b>{lineaActiva.nombre}</b>
            <button className="ml-auto text-xs text-slate-600 underline hover:text-slate-900" onClick={() => setLineaFiltro(null)}>
              Ver todas
            </button>
          </div>
        )}
        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Error con los datos: {error}</div>}
        {cargando ? (
          <p className="py-20 text-center text-slate-400">Cargando…</p>
        ) : (
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/semana" element={<Semana />} />
            <Route path="/gantt" element={<GanttGeneral />} />
            <Route path="/proyectos" element={<Proyectos />} />
            <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
            <Route path="/equipo" element={<Equipo />} />
          </Routes>
        )}
      </main>
      {gestionLineas && <FormLineas onCerrar={() => setGestionLineas(false)} />}
    </div>
  )
}
