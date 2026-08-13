import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Numero di versione: serve a rispondere alla domanda "il telefono ha preso
// l'aggiornamento?" senza doverlo indovinare.
//
// Due forme della stessa cosa. L'etichetta e' quella che si legge sullo
// schermo e deve bastare un'occhiata per dire "e' quella delle 19:30, non
// quella delle 17:00"; l'id e' compatto e serve ai confronti automatici.
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
    // il "+" segnala un build fatto con modifiche non committate, cioe' non
    // ricostruibile da git: e' roba di lavoro, non un rilascio
    id: commit ? `${id}-${commit}${sporco ? '+' : ''}` : id,
    etichetta,
    commit: commit ? `${commit}${sporco ? '+' : ''}` : '',
  }
}

const VERSIONE = versione()

// Accanto all'HTML esce anche versione.json: e' il modo di chiedere al NAS
// cosa sta servendo davvero (`curl <indirizzo>/versione.json`) senza aprire il
// browser, e lo usa pubblica.sh per confermare che il deploy sia arrivato.
function scriviVersione () {
  return {
    name: 'scrivi-versione',
    generateBundle () {
      this.emitFile({
        type: 'asset',
        fileName: 'versione.json',
        source: JSON.stringify({ ...VERSIONE, costruito: new Date().toISOString() }, null, 2),
      })
    },
  }
}

// IL SERVICE WORKER, scritto dal build perché deve sapere la versione.
//
// Serve solo quando i giochi arrivano da un sito. Su GitHub Pages non si
// possono mandare header propri — niente `Cache-Control: no-cache` come
// faceva nginx sul NAS — quindi la pagina si prende una cache di dieci
// minuti decisa da altri, e senza un service worker un telefono può
// restare su una versione vecchia senza che nessuno se ne accorga.
//
// La regola è la più semplice che funziona: **la versione sta nel nome
// della cache**. Un build nuovo ha un nome nuovo, quindi la vecchia non
// viene riusata per sbaglio; all'attivazione le altre si cancellano
// tutte. Niente confronti di data, niente file da tenere allineati.
//
// In lettura è cache-first, che è ciò che rende l'app giocabile senza
// rete: si risponde da lì e in parallelo si va a vedere se c'è di nuovo,
// così l'aggiornamento arriva al caricamento dopo invece di far
// aspettare quello in corso.
//
// CON UN'ECCEZIONE: LA PAGINA. Per il documento si prova prima la rete,
// con pochi secondi di pazienza e la cache pronta dietro. Cache-first
// anche lì vuol dire che una copia arrivata storta — o una versione
// pubblicata con un guasto — si ripresenta identica ad ogni avvio, e da
// dentro il telefono non c'è ricarica che la smuova: l'unica strada
// resta il menu del browser, che è esattamente dove un bambino non
// arriva. Offline non cambia niente: `fetch` fallisce subito e risponde
// la cache, come prima.
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
const ROBA = ['./', './index.html', './manifest.webmanifest', './icona.svg',
              './icona-192.png', './icona-512.png', './icona-maskable.png',
              './apple-touch-icon.png']

self.addEventListener('install', e => {
  // addAll fallisce tutto se un file solo non c'è: qui si va a uno a uno,
  // perché un'icona mancante non è un buon motivo per restare senza offline
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(ROBA.map(u => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  // le cache di ogni versione precedente se ne vanno: il nome le distingue
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()))
})

// la rete, ma con un tetto all'attesa: passato quello si va di cache,
// perché una pagina che tarda è indistinguibile da una che non arriva
const PAZIENZA = 2500
function conRete (req) {
  return new Promise((si, no) => {
    const scaduta = setTimeout(() => no(new Error('lenta')), PAZIENZA)
    fetch(req).then(r => {
      clearTimeout(scaduta)
      if (!r || !r.ok) return no(new Error('storta'))
      caches.open(CACHE).then(c => c.put(req, r.clone())).catch(() => {})
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
  // la pagina: prima la rete, e la cache resta la rete di sicurezza
  if (e.request.mode === 'navigate') {
    e.respondWith(conRete(e.request)
      .catch(() => caches.match(e.request).then(t => t || caches.match('./'))))
    return
  }
  e.respondWith(caches.match(e.request).then(trovato => {
    const dalla_rete = fetch(e.request).then(r => {
      if (r && r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()))
      return r
    }).catch(() => trovato)
    return trovato || dalla_rete
  }))
})
`,
      })
    },
  }
}

// L'icona della scheda finisce dentro la pagina, come tutto il resto: il
// build è un file solo, e un `href` a un file accanto non troverebbe
// niente aprendolo con doppio click. La sorgente resta `public/icona.svg`
// — una copia sola del disegno — e qui si trasforma nel `data:` da
// incollare. Niente base64: un SVG è testo, e così resta leggibile.
function iconaInline () {
  return {
    name: 'icona-inline',
    transformIndexHtml (html) {
      const svg = readFileSync('public/icona.svg', 'utf8')
        .replace(/<!--[\s\S]*?-->/g, '')     // i commenti servono a chi legge il file, non alla scheda
        .replace(/\s+/g, ' ')
        .trim()
      const dato = 'data:image/svg+xml,' + encodeURIComponent(svg)
      return html.replace('%ICONA%', dato)
    },
  }
}

// Build in un unico .html: niente server, niente file accanto.
// Lo script inline resta un modulo ES, che da file:// viene eseguito
// regolarmente (a differenza di un modulo caricato da src esterno).
export default defineConfig({
  plugins: [vue(), viteSingleFile(), scriviVersione(), iconaInline(), scriviServiceWorker()],
  define: { __VERSIONE__: JSON.stringify(VERSIONE) },
  build: { target: 'es2020', assetsInlineLimit: 100000000, cssCodeSplit: false,
           reportCompressedSize: false, chunkSizeWarningLimit: 100000 },
})
