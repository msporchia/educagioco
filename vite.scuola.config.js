// La build della scuola (docs/scuola/architettura.md): due pagine, ognuna un file unico in dist-scuola/.
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { SOSTITUTI } from './src/scuola/sostituti/elenco.js'

const RADICE = import.meta.dirname
const PAGINE = ['index', 'maestra']
const TETTO = { index: 60_000_000, maestra: 5_000_000 }   // byte per pagina, solo contro uno sbaglio grosso: il peso non è un problema (scelta dell'utente)

// il nome del tag `scuola-*`, o lo sha corto col «+» se ci sono modifiche (come la build di casa)
function versione () {
  const rif = process.env.GITHUB_REF_NAME || ''
  if (rif.startsWith('scuola-')) return rif
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    const sporco = execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() !== ''
    return sha + (sporco ? '+' : '')
  } catch { return 'sviluppo' }
}
const VERSIONE = versione()

// i moduli di casa che a scuola si rimpiazzano
function sostituti () {
  const mappa = new Map(Object.entries(SOSTITUTI).map(([da, a]) => [resolve(RADICE, da), resolve(RADICE, a)]))
  return { name: 'sostituti-scuola', enforce: 'pre', resolveId (fonte, da) {
    if (!da || !fonte.startsWith('.')) return null
    return mappa.get(resolve(da.split('?')[0], '..', fonte.split('?')[0])) || null
  } }
}

// la pagina esce alla radice di dist-scuola/ (non in scuola/), poi il tetto di peso e, dopo l'ultima, versione.json
function chiudi (pagina) {
  return { name: 'chiudi-scuola', apply: 'build', enforce: 'post',
  generateBundle (_o, bundle) {
    // `PESI_SCUOLA=20 npm run build:scuola`: i venti moduli che pesano di più nel JS della pagina, per sapere cosa sostituire
    const quanti = Number(process.env.PESI_SCUOLA) || 0
    if (quanti) {
      const pesi = Object.values(bundle).flatMap(b => Object.entries(b.modules || {}).map(([id, m]) => [m.renderedLength, id.replace(RADICE + '/', '')]))
      console.log(pesi.sort((x, y) => y[0] - x[0]).slice(0, quanti).map(([n, id]) => `${String(n).padStart(9)}  ${id}`).join('\n'))
    }
    const k = Object.keys(bundle).find(n => n.endsWith('.html'))
    bundle[k].fileName = `${pagina}.html`
  },
  writeBundle (opz, bundle) {
    const file = Object.values(bundle).find(b => b.fileName.endsWith('.html'))
    const peso = statSync(resolve(opz.dir, file.fileName)).size
    console.log(`${file.fileName}: ${peso} byte`)
    if (peso > TETTO[pagina]) throw new Error(`${file.fileName} pesa ${peso} byte, il tetto è ${TETTO[pagina]}`)
    if (pagina === PAGINE[PAGINE.length - 1]) {
      writeFileSync(resolve(opz.dir, 'versione.json'),
        JSON.stringify({ id: VERSIONE, data: new Date().toISOString() }, null, 2))
    }
  } }
}

export default defineConfig(() => {
  const pagina = process.env.PAGINA_SCUOLA
  const comune = { plugins: [sostituti(), vue()], define: { __VERSIONE_SCUOLA__: JSON.stringify(VERSIONE) } }
  // sviluppo: la radice è la cartella della pagina, e si aprono /scuola/index.html e /scuola/maestra.html
  if (!pagina) return { ...comune, server: { port: 5174, strictPort: true } }
  return {
    ...comune,
    plugins: [...comune.plugins, viteSingleFile(), chiudi(pagina)],
    build: {
      outDir: 'dist-scuola', copyPublicDir: false, emptyOutDir: pagina === PAGINE[0], target: 'es2020',
      assetsInlineLimit: 100000000, cssCodeSplit: false, reportCompressedSize: false,
      rollupOptions: { input: resolve(RADICE, pagina === 'index' ? 'scuola/index.html' : 'scuola/maestra.html') },
    },
  }
})
