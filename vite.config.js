import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { salvaFoglietto } from './strumenti/banco/salva-foglietto.js'

// Numero di versione: vedi docs/core/pubblicare.md. L'etichetta si legge a
// schermo, l'id (compatto) serve ai confronti automatici.
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
              'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

function versione () {
  const ora = new Date()
  const g = n => String(n).padStart(2, '0')
  const id = `${ora.getFullYear()}.${g(ora.getMonth() + 1)}.${g(ora.getDate())}.${g(ora.getHours())}${g(ora.getMinutes())}`
  const etichetta = `${ora.getDate()} ${MESI[ora.getMonth()]} alle ${g(ora.getHours())}:${g(ora.getMinutes())}`

  let commit = ''
  let sporco = false
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    sporco = execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() !== ''
  } catch { /* fuori da git: basta la data */ }

  return {
    // «+»: build con modifiche non committate, non ricostruibile da git
    id: commit ? `${id}-${commit}${sporco ? '+' : ''}` : id,
    etichetta,
    commit: commit ? `${commit}${sporco ? '+' : ''}` : '',
  }
}

const VERSIONE = versione()

// L'indirizzo pubblico e non `location.href`: da dove gira non si ricava
// (server di casa o file://), e condividere quello sotto il naso manderebbe
// un link che non si apre altrove (vedi docs/genitori/guide.md).
const INDIRIZZO = process.env.INDIRIZZO || 'https://msporchia.github.io/educagioco/'

// versione.json: vedi docs/core/aggiornamento.md. `peso` è la lunghezza
// compressa che il sito dichiara, non i byte veri.
function scriviVersione () {
  return {
    name: 'scrivi-versione',
    enforce: 'post',   // dopo viteSingleFile: solo allora la pagina pesa quello che pesa
    generateBundle (_opzioni, bundle) {
      const sorgente = bundle['index.html']?.source
      const peso = typeof sorgente === 'string' ? Buffer.byteLength(sorgente) : (sorgente?.byteLength || 0)
      this.emitFile({
        type: 'asset',
        fileName: 'versione.json',
        source: JSON.stringify({ ...VERSIONE, peso, costruito: new Date().toISOString() }, null, 2),
      })
    },
  }
}

// Il service worker: scritto dal build perché deve sapere la versione. La
// versione sta nel nome della cache (niente confronti di data). Cache-first
// per tutto tranne la pagina (prima la rete, con poca pazienza): vedi
// docs/core/aggiornamento.md.
function scriviServiceWorker () {
  return {
    name: 'scrivi-service-worker',
    generateBundle () {
      const cache = `educagioco-${VERSIONE.id}`
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `/* generato dal build — non si modifica a mano (vite.config.js) */
const CACHE = ${JSON.stringify(cache)}
const PAGINA = './'
const ROBA = ['./manifest.webmanifest', './icona.svg', './icona-192.png',
              './icona-512.png', './icona-maskable.png', './apple-touch-icon.png']

// «no-cache»: si chiede al sito se è cambiata, anche quando il browser la
// crede fresca. Senza, il service worker nuovo può mettersi in casa la
// pagina vecchia che il browser si teneva da parte.
const fresca = u => new Request(u, { cache: 'no-cache' })

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all([
      // la pagina è obbligatoria: se non arriva l'installazione fallisce, e
      // resta il service worker di prima con la sua copia intera. Se c'è
      // già ce l'ha messa «cerca aggiornamenti», che l'ha appena scaricata
      // e controllata: non si riscarica
      c.match(PAGINA).then(gia => gia || c.add(fresca(PAGINA))),
      // il resto a uno a uno: un'icona mancante non è un buon motivo per
      // restare senza offline
      ...ROBA.map(u => c.add(fresca(u)).catch(() => {})),
    ]))
    .then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  // le cache di ogni versione precedente se ne vanno: il nome le distingue
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()))
})

// la rete, ma con un tetto all'attesa: passato quello si va di cache,
// perché una pagina che tarda è indistinguibile da una che non arriva.
// E quello che arriva non si mette da parte: nella cache scrivono solo
// l'installazione e «cerca aggiornamenti» (src/aggiornamento.js)
const PAZIENZA = 2500
function conRete (req) {
  return new Promise((si, no) => {
    const scaduta = setTimeout(() => no(new Error('lenta')), PAZIENZA)
    fetch(req).then(r => {
      clearTimeout(scaduta)
      if (!r || !r.ok) return no(new Error('storta'))
      si(r)
    }).catch(x => { clearTimeout(scaduta); no(x) })
  })
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin) return
  // versione.json dice cosa sta servendo il sito adesso: se rispondesse
  // la cache direbbe sempre la versione di questo service worker, cioè
  // proprio la domanda a cui deve rispondere
  if (url.pathname.endsWith('versione.json')) return
  // la pagina: prima la rete, e la cache resta la rete di sicurezza. Chi
  // chiede index.html, o la radice con qualcosa in coda, riceve la radice
  if (e.request.mode === 'navigate') {
    e.respondWith(conRete(e.request)
      .catch(() => caches.match(e.request).then(t => t || caches.match(PAGINA))))
    return
  }
  // chi chiede «no-store» vuole il sito, e la cache non gli risponde:
  // risponderebbe al posto del sito. Oggi lo chiede solo «cerca
  // aggiornamenti», per un indirizzo che la cache comunque non ha: la
  // regola è per chi un giorno chiederà così una cosa che la cache ha
  if (e.request.cache === 'no-store') return
  // il resto: la cache, e se non ce l'ha la rete
  e.respondWith(caches.match(e.request).then(t => t || fetch(e.request)))
})
`,
      })
    },
  }
}

// L'icona finisce dentro la pagina come tutto il resto (file unico): da
// public/icona.svg a un data: URI. Niente base64, un SVG è testo e resta leggibile.
function iconaInline () {
  return {
    name: 'icona-inline',
    transformIndexHtml (html) {
      const svg = readFileSync('public/icona.svg', 'utf8')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      const dato = 'data:image/svg+xml,' + encodeURIComponent(svg)
      // %INDIRIZZO%: un data: URI non lo scaricano i meta dell'anteprima, vogliono un URL assoluto
      return html.replace('%ICONA%', dato).replaceAll('%INDIRIZZO%', INDIRIZZO)
    },
  }
}

export default defineConfig({
  // salvaFoglietto è `apply: 'serve'`: solo per il banco (npm run mondo), non nel build
  plugins: [vue(), viteSingleFile(), scriviVersione(), iconaInline(), scriviServiceWorker(),
            salvaFoglietto()],
  define: { __VERSIONE__: JSON.stringify(VERSIONE), __INDIRIZZO__: JSON.stringify(INDIRIZZO) },
  build: { target: 'es2020', assetsInlineLimit: 100000000, cssCodeSplit: false,
           reportCompressedSize: false, chunkSizeWarningLimit: 100000 },
})
