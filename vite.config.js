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
  // l'ora di casa anche sul server di GitHub, che costruisce col fuso di Londra
  const parti = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(new Date()).map(p => [p.type, Number(p.value)]))
  const g = n => String(n).padStart(2, '0')
  const id = `${parti.year}.${g(parti.month)}.${g(parti.day)}.${g(parti.hour)}${g(parti.minute)}`
  const etichetta = `${parti.day} ${MESI[parti.month - 1]} alle ${g(parti.hour)}:${g(parti.minute)}`

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
      const lunga = typeof sorgente === 'string' ? Buffer.byteLength(sorgente) : (sorgente?.byteLength || 0)
      // sito spezzato: il peso di un aggiornamento è la pagina con tutti i suoi file
      const peso = !SPEZZATO ? lunga : Object.entries(bundle).reduce((somma, [nome, o]) =>
        nome === 'versione.json' ? somma : somma + (o.type === 'asset' ? Buffer.byteLength(o.source) : Buffer.byteLength(o.code)), 0)
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
    enforce: 'post',   // dopo gli altri: la lista dei file la scrive chi li ha visti tutti
    generateBundle (_opzioni, bundle) {
      // sito spezzato: tutto quello che il build ha prodotto (nomi con l'impronta, quindi immutabili) tranne la
      // pagina, che ha già la sua strada, e i due file che dicono la versione. [indirizzo, byte]
      const FILE = !SPEZZATO ? [] : Object.entries(bundle)
        .filter(([nome]) => !['index.html', 'sw.js', 'versione.json'].includes(nome))
        .map(([nome, o]) => ['./' + nome, o.type === 'asset' ? o.source.length : o.code.length])
      const cache = `educagioco-${VERSIONE.id}`
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `/* generato dal build — non si modifica a mano (vite.config.js) */
const CACHE = ${JSON.stringify(cache)}
const PAGINA = './'
const FILE = ${JSON.stringify(FILE)}   // sito spezzato: [indirizzo, byte]; vuota nel file unico
const ROBA = ['./manifest.webmanifest', './icona.svg', './icona-192.png',
              './icona-512.png', './icona-maskable.png', './apple-touch-icon.png']

// «no-cache»: si chiede al sito se è cambiata, anche quando il browser la
// crede fresca. Senza, il service worker nuovo può mettersi in casa la
// pagina vecchia che il browser si teneva da parte.
const fresca = u => new Request(u, { cache: 'no-cache' })

// Il sito spezzato: ogni file con l'impronta nel nome non cambia mai, quindi quello che una versione precedente
// ha già in cassa si copia invece di riscaricarlo. Uno che manca fa fallire l'installazione (resta la versione di
// prima). I progressi vanno alla pagina, che li mostra: docs/core/avvio-e-memoria.md
async function scaricaTutto (c) {
  if (!FILE.length) return
  const canale = typeof BroadcastChannel === 'function' ? new BroadcastChannel('educagioco-scarico') : null
  const byteTotale = FILE.reduce((a, f) => a + f[1], 0)
  let fatti = 0, byteFatti = 0
  const avvisa = fine => canale && canale.postMessage({ fatti, totale: FILE.length, byteFatti, byteTotale, fine: !!fine })
  avvisa()
  const coda = FILE.slice()
  const operaio = async () => {
    for (let f = coda.shift(); f; f = coda.shift()) {
      const gia = await caches.match(f[0])
      if (gia) await c.put(f[0], gia)
      else await c.add(f[0])
      fatti++; byteFatti += f[1]; avvisa()
    }
  }
  await Promise.all([operaio(), operaio(), operaio(), operaio(), operaio(), operaio()])
  avvisa(true)
  if (canale) canale.close()
}

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
      scaricaTutto(c),
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
    // e se la cache non ce l'ha (una copia che non ci è stata: lo spazio del telefono) di nuovo la rete,
    // senza tetto: una risposta vuota Safari la mostra come «un ServiceWorker ha … un errore imprevisto»
    e.respondWith(conRete(e.request)
      .catch(() => caches.match(e.request).then(t => t || caches.match(PAGINA)))
      .catch(() => null)
      .then(t => t || fetch(e.request)))
    return
  }
  // chi chiede «no-store» vuole il sito, e la cache non gli risponde:
  // risponderebbe al posto del sito. Oggi lo chiede solo «cerca
  // aggiornamenti», per un indirizzo che la cache comunque non ha: la
  // regola è per chi un giorno chiederà così una cosa che la cache ha
  if (e.request.cache === 'no-store') return
  // il resto: la cache, e se non ce l'ha la rete
  e.respondWith(caches.match(e.request).catch(() => null).then(t => t || fetch(e.request)))
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

// SPEZZATO=1: il sito installato, in file separati (dist-sito/) invece del file unico: vedi docs/core/avvio-e-memoria.md
const SPEZZATO = !!process.env.SPEZZATO

// Solo nel sito spezzato: i moduli generati tengono sprite e voci come stringhe `data:…;base64,…`; qui diventano file
// veri (assets/), e nel modulo resta l'indirizzo. Nei test in Node i moduli restano com'erano.
function estraiDati () {
  const DATO = /(['"`])data:(image\/webp|image\/png|audio\/ogg);base64,([A-Za-z0-9+/=]{2000,})\1/g
  return {
    name: 'estrai-dati',
    enforce: 'pre',
    transform (codice, id) {
      if (!SPEZZATO || !codice.includes(';base64,') || !/\.(js|vue)(\?|$)/.test(id)) return null
      const nome = id.split('/').pop().replace(/\.(js|vue).*$/, '')
      let n = 0
      const nuovo = codice.replace(DATO, (_tutto, _q, tipo, b64) => {
        const estensione = tipo.split('/')[1].replace('webp', 'webp')
        const ref = this.emitFile({ type: 'asset', name: `${nome}-${n++}.${estensione}`, source: Buffer.from(b64, 'base64') })
        return `import.meta.ROLLUP_FILE_URL_${ref}`   // Vite lo trasforma già in una stringa (new URL(…).href)
      })
      return nuovo === codice ? null : { code: nuovo, map: null }
    },
  }
}

export default defineConfig({
  base: SPEZZATO ? './' : '/',   // il sito sta sotto un percorso (GitHub Pages) e si apre anche da una cartella
  // salvaFoglietto è `apply: 'serve'`: solo per il banco (npm run mondo), non nel build
  plugins: [estraiDati(), vue(), ...(SPEZZATO ? [] : [viteSingleFile()]), scriviVersione(), iconaInline(), scriviServiceWorker(),
            salvaFoglietto()],
  define: { __SPEZZATO__: JSON.stringify(SPEZZATO), __VERSIONE__: JSON.stringify(VERSIONE), __INDIRIZZO__: JSON.stringify(INDIRIZZO) },
  build: { rollupOptions: { output: {
             // il gioco si riconosce dal nome del file (gioco-sotterraneo-<hash>.js): servirà a scaricarli a gruppi
             chunkFileNames: c => {
               const m = c.name === 'Gioco' && /giochi\/([^/]+)\/Gioco\.vue/.exec(c.facadeModuleId || '')
               return m ? `assets/gioco-${m[1]}-[hash].js` : 'assets/[name]-[hash].js'
             } } },
           target: 'es2020', assetsInlineLimit: SPEZZATO ? 4096 : 100000000, cssCodeSplit: false,
           outDir: SPEZZATO ? 'dist-sito' : 'dist',
           reportCompressedSize: false, chunkSizeWarningLimit: 100000 },
})
