import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { Login } from './components/Login'
import { StoreProvider } from './lib/store'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Login>
        <StoreProvider>
          <App />
        </StoreProvider>
      </Login>
    </HashRouter>
  </StrictMode>,
)
