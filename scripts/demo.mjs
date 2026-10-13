// Convierte dist-demo/index.html en una página única lista para publicar como demo.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const html = readFileSync('dist-demo/index.html', 'utf8')
const estilos = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
const scripts = [...html.matchAll(/<script type="module"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
if (!scripts) throw new Error('No se encontró el script en dist-demo/index.html')

mkdirSync('demo', { recursive: true })
writeFileSync(
  'demo/gestion-de-proyectos.html',
  `<title>Gestión de Proyectos</title>
<style>:root{color-scheme:light}body{background:#f8fafc}
${estilos}</style>
<div id="root"></div>
<script type="module">${scripts.replace(/<\/script/g, '<\\/script')}</script>
`,
)
console.log('demo/gestion-de-proyectos.html listo')
