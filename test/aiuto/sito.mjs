/* ═══════════════════════════════════════════════════════════════════
   IL SITO FINTO — `dist/` servito come lo serve GitHub Pages

   Tutti gli altri test aprono il gioco da `file://`, e da lì il service
   worker non esiste: il browser lo vieta, ed è giusto così. Ma è proprio
   lì dentro che vivono i guasti dell'aggiornamento, e un guasto che non
   si può far succedere non si può nemmeno provare di averlo tolto.

   Quindi qui c'è un sito vero, su una porta a caso di `127.0.0.1` (che
   per il browser è un posto sicuro: service worker e cache ci sono), e
   si comporta come GitHub Pages nelle due cose che contano:

   - **`Cache-Control: max-age=600`** su tutto, come Pages: il browser si
     tiene la pagina dieci minuti e non la richiede. È il difetto da
     riprodurre, non un dettaglio;
   - **l'ETag**, e il 304 a chi chiede «è cambiata?»: senza, `no-cache`
     riscaricherebbe sempre tutto e non si vedrebbe la differenza.

   E sa fare le cose che il sito vero fa solo nei giorni storti, a
   comando: rispondere **lento** alle navigazioni (`lento`, in ms), dare
   un **guasto** sulla pagina (`rotto`) o su `versione.json` (`muto`), non
   dare il service worker nuovo (`swFermo`), e mandare **a gocce** la
   pagina che scarica «cerca aggiornamenti» (`goccia`, ms fra un quarto
   di megabyte e l'altro) — così il foglio si vede mentre conta.

   `pubblica({ id, etichetta })` mette in linea una versione nuova senza
   ricompilare: riscrive l'id e l'etichetta dentro pagina, service worker
   e `versione.json`. Per il gioco è una versione nuova a tutti gli
   effetti: l'id è quello che legge, confronta e mette nel nome della
   cache.
   ═══════════════════════════════════════════════════════════════════ */
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { COSTRUITO } from './browser.mjs'

const TIPI = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
}
const impronta = corpo => '"' + createHash('sha1').update(corpo).digest('hex').slice(0, 16) + '"'
const aspetta = ms => new Promise(ok => setTimeout(ok, ms))

export async function apriSito ({ cartella = dirname(COSTRUITO) } = {}) {
  const file = new Map()
  for (const nome of readdirSync(cartella)) file.set('/' + nome, readFileSync(join(cartella, nome)))
  const originale = JSON.parse(file.get('/versione.json').toString())
  const html = file.get('/index.html').toString()
  const sw = file.get('/sw.js').toString()

  const sito = {
    indirizzo: '',
    /* la versione in linea adesso: `{ id, etichetta }` */
    versione: { id: originale.id, etichetta: originale.etichetta },
    lento: 0, rotto: false, muto: false, swFermo: false, goccia: 0,
    /* ogni richiesta, con chi l'ha fatta: `navigate` è una pagina che si
       apre, `cors` una `fetch` (la nostra, o il service worker che si
       installa) */
    richieste: [],

    pubblica ({ id, etichetta }) {
      const pagina = html.replaceAll(originale.id, id).replaceAll(originale.etichetta, etichetta)
      file.set('/index.html', Buffer.from(pagina))
      file.set('/sw.js', Buffer.from(sw.replaceAll(originale.id, id)))
      file.set('/versione.json', Buffer.from(JSON.stringify(
        { ...originale, id, etichetta, peso: Buffer.byteLength(pagina) })))
      sito.versione = { id, etichetta }
    },

    chiudi () {
      server.closeAllConnections()
      return new Promise(ok => server.close(ok))
    },
  }

  const server = createServer(async (req, res) => {
    const { pathname: percorso, search: coda } = new URL(req.url, 'http://x')
    const nome = percorso === '/' ? '/index.html' : percorso
    const modo = req.headers['sec-fetch-mode'] || ''
    /* `coda` è quello dopo `?` (il tasto scarica da `./?aggiorna=…`), e
       `rivaluta` la domanda «è cambiata?» (`If-None-Match`), che fa chi
       ha già una copia e vuole sapere se tenerla */
    const voce = { percorso, coda, modo, stato: 200, rivaluta: !!req.headers['if-none-match'] }
    sito.richieste.push(voce)
    const rispondi = (stato, intestazioni = {}, corpo) => {
      voce.stato = stato
      res.writeHead(stato, intestazioni)
      res.end(corpo)
    }

    if (nome === '/index.html' && modo === 'navigate' && sito.lento) await aspetta(sito.lento)
    if (nome === '/index.html' && sito.rotto) return rispondi(500, {}, 'guasto')
    if (nome === '/versione.json' && sito.muto) return rispondi(503, {}, 'fuori servizio')
    if (nome === '/sw.js' && sito.swFermo) return rispondi(503, {}, 'fuori servizio')
    const corpo = file.get(nome)
    if (!corpo) return rispondi(404, {}, 'non c\'è')

    const etag = impronta(corpo)
    const intestazioni = { 'Content-Type': TIPI[extname(nome)] || 'application/octet-stream',
                           'Cache-Control': 'max-age=600', ETag: etag }
    if (req.headers['if-none-match'] === etag) return rispondi(304, intestazioni)
    if (sito.goccia && coda.includes('aggiorna')) {
      res.writeHead(200, intestazioni)
      for (let i = 0; i < corpo.length && !res.destroyed; i += 256 * 1024) {
        res.write(corpo.subarray(i, i + 256 * 1024))
        await aspetta(sito.goccia)
      }
      return res.end()
    }
    rispondi(200, intestazioni, corpo)
  })

  await new Promise(ok => server.listen(0, '127.0.0.1', ok))
  sito.indirizzo = `http://127.0.0.1:${server.address().port}/`
  return sito
}
