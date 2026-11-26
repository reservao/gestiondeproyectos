// Copia una versión fija de las herramientas embebidas en public/herramientas/<slug>/.
//
//   npm run herramientas                  → trae la última versión de cada una
//   npm run herramientas -- equipo-tct    → solo esa
//
// Cada herramienta vive en su propio repositorio. Este script la descarga, copia
// solo los archivos que necesita el navegador y anota el commit en versiones.json.
// Después hay que revisar el cambio y subirlo como cualquier otro.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const HERRAMIENTAS = [
  {
    slug: 'equipo-tct',
    repo: 'https://github.com/reservao/EquipoTCT.git',
    // La app estática completa está en docs/ (SOT, Carga y Plano).
    copiar: [['docs', '.']],
  },
  {
    slug: 'analizador-encuestas',
    repo: 'https://github.com/reservao/Analizador-de-Encuestas.git',
    copiar: [['analizador_encuestas_v2.html', 'index.html']],
  },
]

const raiz = join(import.meta.dirname, '..')
const destinoBase = join(raiz, 'public', 'herramientas')
const archivoVersiones = join(destinoBase, 'versiones.json')
const versiones = existsSync(archivoVersiones) ? JSON.parse(readFileSync(archivoVersiones, 'utf8')) : {}

const pedidas = process.argv.slice(2)
const elegidas = pedidas.length ? HERRAMIENTAS.filter((h) => pedidas.includes(h.slug)) : HERRAMIENTAS
if (!elegidas.length) {
  console.error(`No conozco esa herramienta. Opciones: ${HERRAMIENTAS.map((h) => h.slug).join(', ')}`)
  process.exit(1)
}

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

for (const h of elegidas) {
  const tmp = mkdtempSync(join(tmpdir(), `herramienta-${h.slug}-`))
  try {
    git(['clone', '--quiet', '--depth', '1', h.repo, tmp])
    const commit = git(['rev-parse', 'HEAD'], tmp)
    const fecha = git(['log', '-1', '--format=%cs'], tmp)

    const destino = join(destinoBase, h.slug)
    rmSync(destino, { recursive: true, force: true })
    mkdirSync(destino, { recursive: true })
    for (const [origen, hacia] of h.copiar) cpSync(join(tmp, origen), join(destino, hacia), { recursive: true })

    const anterior = versiones[h.slug]?.commit
    versiones[h.slug] = { repo: h.repo.replace(/\.git$/, ''), commit, fecha }
    console.log(`${h.slug}: ${anterior === commit ? 'sin cambios' : `actualizada a ${commit.slice(0, 7)} (${fecha})`}`)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

writeFileSync(archivoVersiones, JSON.stringify(versiones, null, 2) + '\n')
