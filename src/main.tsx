import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import ClienteGantt from './pages/ClienteGantt'
import App from './App'
import { Login } from './components/Login'
import { StoreProvider } from './lib/store'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        {/* Vista pública para clientes: no pide inicio de sesión ni carga los datos del equipo. */}
        <Route path="/cliente/:datos" element={<ClienteGantt />} />
        <Route
          path="*"
          element={
            <Login>
              <StoreProvider>
                <App />
              </StoreProvider>
            </Login>
          }
        />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
