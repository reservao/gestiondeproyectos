import { NavLink, Route, Routes } from 'react-router-dom'
import { reiniciarDemo } from './lib/backend'
import { useStore } from './lib/store'
import { BotonConfirmar } from './components/ui'
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
  const { cargando, error, backend } = useStore()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-56 md:border-r md:border-b-0">
        <div className="px-4 py-4 text-lg font-bold text-indigo-700">Gestión de Proyectos</div>
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
        <div className="mt-auto hidden p-4 text-[11px] text-slate-400 md:block">
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
            <p>Datos compartidos (Supabase).</p>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-6">
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
    </div>
  )
}
