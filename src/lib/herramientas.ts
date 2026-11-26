/**
 * Herramientas que aparecen en el menú, además de Gestión de Proyectos.
 *
 * - embebida: una app estática copiada en public/herramientas/<slug>/ (con
 *   `npm run herramientas`) que se muestra dentro de la app, con el menú visible.
 * - enlace: una app con su propio inicio de sesión; se abre en otra pestaña.
 *
 * Todas las personas con cuenta ven todas las herramientas.
 */
export type Herramienta = {
  slug: string
  nombre: string
  icono: string
  descripcion: string
} & ({ tipo: 'embebida'; archivo: string } | { tipo: 'enlace'; url: string })

export const HERRAMIENTAS: Herramienta[] = [
  {
    slug: 'equipo-tct',
    nombre: 'Equipo TCT',
    icono: '🧩',
    descripcion: 'Convierte los Word de competencias y pruebas en el SOT, la planilla de carga y el plano.',
    tipo: 'embebida',
    archivo: 'herramientas/equipo-tct/index.html',
  },
  {
    slug: 'analizador-encuestas',
    nombre: 'Analizador de Encuestas',
    icono: '📋',
    descripcion: 'Analiza bases de encuestas en Excel y genera gráficos y organigramas.',
    tipo: 'embebida',
    archivo: 'herramientas/analizador-encuestas/index.html',
  },
  {
    slug: 'solicitudes-diseno',
    nombre: 'Solicitudes de Diseño',
    icono: '🎨',
    descripcion: 'Pide y sigue piezas de diseño. Tiene su propio inicio de sesión.',
    tipo: 'enlace',
    url: 'https://solicitudes-diseno.pages.dev',
  },
]
