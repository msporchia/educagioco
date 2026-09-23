import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { salvaFoglietto } from './strumenti/banco/salva-foglietto.js'

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

// L'INDIRIZZO PUBBLICO, e non `location.href`.
//
// Serve al tasto «condividi» e all'anteprima del link nelle chat. Va
// scritto qui perche' non si puo' ricavare da dove gira: in casa il gioco
// arriva dal server di casa (un nome `.lan` che per un'altra famiglia non
// esiste) e dal file unico arriva da `file://`. Condividere quello che si
// ha sotto il naso vuol dire mandare un link che non si apre.
const INDIRIZZO = process.env.INDIRIZZO || 'https://msporchia.github.io/educagioco/'

// Accanto all'HTML esce anche versione.json: e' il modo di chiedere al NAS
// cosa sta servendo davvero (`curl <indirizzo>/versione.json`) senza aprire il
// browser, e lo usa pubblica.sh per confermare che il deploy sia arrivato.
//
// Lo legge anche il gioco (`src/aggiornamento.js`): e' da qui che sa se il
// sito ha una versione piu' nuova di quella a schermo, e `peso` — i byte
// della pagina — e' quello che gli fa dire «3,1 di 7,6 MB» mentre scarica.
// Il sito manda la pagina compressa, e la lunghezza che dichiara e' quella
// compressa: contando i byte veri non si arriverebbe mai in fondo.
function scriviVersione () {
  return {
    name: 'scrivi-versione',
    // dopo `viteSingleFile`, che e' `post` anche lui e sta prima nella fila:
    // solo a quel punto la pagina ha dentro tutto, e pesa quello che pesa
    enforce: 'post',
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
// rete. **E nella cache non entra niente di quello che passa**: quella
// di una versione la scrive l'installazione, una volta sola, e dopo
// soltanto «cerca aggiornamenti», che la pagina la controlla prima di
// mettercela. Il nuovo arriva con un service worker nuovo — il build
// cambia sempre `sw.js`, perché dentro c'è la versione — che si fa la
// sua cache e butta quella di prima.
//
// Fino al 23 settembre 2026 ci provava anche il `fetch`: un `put` dopo
// ogni pagina presa dalla rete, e un rinfresco del resto «per la volta
// dopo». Il `clone()` girava dentro un `.then`, cioè dopo che
// `respondWith` si era già preso il corpo, e il `put` falliva in
// silenzio: riusciva solo dove la risposta non la voleva nessuno — la
// pagina arrivata oltre la pazienza, manifest e icone. Nessuno se n'è
// accorto, perché la copia dell'installazione bastava, e si sono tolti
// invece di ripararli: riparati avrebbero riscritto sette megabyte e
// mezzo a ogni apertura, fatto una copia per ogni indirizzo con una coda
// diversa, e messo la pagina presa dalla rete — che nessuno controlla, e
// per dieci minuti può arrivare dalla cache del browser — sopra quella
// che il tasto aveva appena controllato.
//
// CON UN'ECCEZIONE: LA PAGINA. Per il documento si prova prima la rete,
// con pochi secondi di pazienza e la cache pronta dietro. Cache-first
// anche lì vuol dire che una copia arrivata storta — o una versione
// pubblicata con un guasto — si ripresenta identica ad ogni avvio, e da
// dentro il telefono non c'è ricarica che la smuova: l'unica strada
// resta il menu del browser, che è esattamente dove un bambino non
// arriva. Offline non cambia niente: `fetch` fallisce subito e risponde
// la cache, come prima.
//
// E L'INSTALLAZIONE, CHE È DOVE LA VERSIONE VECCHIA SI NASCONDEVA.
// Tre difetti, che da fuori sembravano uno solo — «a volte l'aggiornamento
// non arriva»:
//
// 1. la pagina si chiedeva **passando dalla cache del browser**, e GitHub
//    Pages dice a tutti di tenersela dieci minuti. Chi aveva aperto il
//    gioco poco prima di una pubblicazione si ritrovava un service worker
//    nuovo con dentro la pagina vecchia: e siccome il service worker era
//    nuovo, nessuno diceva più niente. Adesso la si chiede `no-cache`, che
//    vuol dire «chiedi al sito se è cambiata»: se non lo è costa una
//    domanda, e la pagina arriva dalla cache del browser senza riscaricarla;
// 2. si scaricava **due volte**, come `./` e come `./index.html`: quindici
//    megabyte invece di sette e mezzo, su una rete lenta il doppio del
//    tempo prima di poter dire «c'è una versione nuova». La seconda non
//    serviva: a chi apre `index.html` risponde già `./` (vedi sotto);
// 3. se la pagina non arrivava si installava lo stesso — «un'icona mancante
//    non è un buon motivo per restare senza offline», ed era vero per le
//    icone. Per la pagina no: il service worker nuovo all'attivazione butta
//    la cache vecchia, e al suo posto non aveva niente. Il primo avvio senza
//    rete dava la pagina d'errore del browser. Adesso senza pagina
//    l'installazione fallisce, resta quello di prima con la sua copia
//    intera, e il browser riprova al controllo dopo.
//
// E due cose per «cerca aggiornamenti» (`src/aggiornamento.js`), che la
// pagina nuova la scarica da sé, contando i megabyte: le sue richieste
// `no-store` vanno dritte al sito, perché a chi chiede così la cache non
// risponde, e la pagina che mette nella cache della versione nuova, già
// controllata, qui non si riscarica. Il nome di quella cache lo sa anche
// lei (`CASSETTO`).
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
      // %INDIRIZZO% serve ai meta dell'anteprima: WhatsApp e i messaggi
      // vogliono un URL assoluto per l'immagine — un `data:` non lo
      // scaricano, e un percorso relativo non sanno da dove prenderlo.
      return html.replace('%ICONA%', dato).replaceAll('%INDIRIZZO%', INDIRIZZO)
    },
  }
}

// Build in un unico .html: niente server, niente file accanto.
// Lo script inline resta un modulo ES, che da file:// viene eseguito
// regolarmente (a differenza di un modulo caricato da src esterno).
export default defineConfig({
  // `salvaFoglietto` è `apply: 'serve'`: sta qui per il banco dei mondi
  // (`npm run mondo`) e nel build non ci arriva. Vedi il file per i paletti.
  plugins: [vue(), viteSingleFile(), scriviVersione(), iconaInline(), scriviServiceWorker(),
            salvaFoglietto()],
  define: { __VERSIONE__: JSON.stringify(VERSIONE), __INDIRIZZO__: JSON.stringify(INDIRIZZO) },
  build: { target: 'es2020', assetsInlineLimit: 100000000, cssCodeSplit: false,
           reportCompressedSize: false, chunkSizeWarningLimit: 100000 },
})
