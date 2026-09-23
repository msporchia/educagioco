/* ═══════════════════════════════════════════════════════════════════
   «CERCA AGGIORNAMENTI», SENZA BROWSER

   Il giro a richiesta di `src/aggiornamento.js` si gioca qui per davvero,
   con un sito finto e delle cache finte: `fetch`, `Response` e i flussi
   a pezzi Node li ha uguali al browser, e le cache sono quattro righe.

   Quello che conta non è che il giro arrivi in fondo quando va tutto
   bene — quello si vede dal telefono — ma **cosa lascia dietro quando va
   storto**, che dal telefono non si vede affatto:

   - niente si tocca prima di avere in mano la pagina nuova, e controllata;
   - una pagina che non dice la versione promessa non passa per nuova;
   - la nuova va **al posto della vecchia** in ogni cache del gioco, e
     in nessun'altra;
   - fermarsi (la ✕, la rete che cade) non fa ripartire niente.

   Il service worker vero, la cache del browser e la ricarica stanno in
   `integrazione/aggiornamento`: quelli senza un browser non esistono.
   ═══════════════════════════════════════════════════════════════════ */
import { watch } from 'vue'
import { readFileSync } from 'node:fs'
import {
  leggiVersione, eDaPrendere, inMega, eDellaVersione, eLaPagina, indirizzoDaScaricare,
  aggiornaOra, aggiornando, lasciaStare, versioneNuova, CASSETTO,
} from '../../src/aggiornamento.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const BASE = 'https://esempio.it/educagioco/'
const VECCHIA = { id: '2026.09.22.1736-313e33e', etichetta: '22 settembre alle 17:36' }
const NUOVA = { id: '2026.09.23.1839-4a5b6c7', etichetta: '23 settembre alle 18:39' }
const pagina = v => `<!doctype html><script>var x={id:"${v.id}",etichetta:"${v.etichetta}"}</script>`
  + '<!-- ' + 'sprite '.repeat(2000) + '-->'

/* ── il sito finto ──
   Risponde a `versione.json` e alla pagina, e la pagina la manda a
   pezzi come fa la rete. Rispetta il segnale di stop: è la cosa su cui
   si reggono la ✕ e lo scaricamento fermo. */
function sito ({ versione = NUOVA, testo = pagina(NUOVA), pezzi = 5, fermo = false,
                 stato = 200, muto = false, appeso = false } = {}) {
  const chiamate = []
  const fermato = () => Object.assign(new Error('fermato'), { name: 'AbortError' })
  const prendi = (url, opz = {}) => {
    const u = String(url)
    chiamate.push({ url: u, cache: opz.cache })
    const { signal } = opz
    if (u.endsWith('versione.json')) {
      if (muto) return Promise.reject(new TypeError('Failed to fetch'))
      if (appeso) return new Promise((_, no) => signal?.addEventListener('abort', () => no(fermato())))
      return Promise.resolve(new Response(JSON.stringify({ ...versione, peso: versione.peso ?? testo.length })))
    }
    if (stato !== 200) return Promise.resolve(new Response('guasto', { status: stato }))
    const byte = new TextEncoder().encode(testo)
    const passo = Math.ceil(byte.length / pezzi)
    let i = 0
    const corpo = new ReadableStream({
      start (c) { signal?.addEventListener('abort', () => { try { c.error(fermato()) } catch (e) { /* già chiuso */ } }) },
      pull (c) {
        if (i >= byte.length) return c.close()
        /* un pezzo, e poi più niente: la rete che si ferma senza cadere */
        if (fermo && i > 0) return new Promise(() => {})
        c.enqueue(byte.slice(i, i += passo))
      },
    })
    return Promise.resolve(new Response(corpo, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
  }
  return { prendi, chiamate }
}

/* ── le cache finte ── un nome, e dentro indirizzo → contenuto */
function cassetti (iniziali = {}) {
  const tutti = new Map(Object.entries(iniziali).map(([n, voci]) => [n, new Map(Object.entries(voci))]))
  return {
    tutti,
    async keys () { return [...tutti.keys()] },
    async open (nome) {
      if (!tutti.has(nome)) tutti.set(nome, new Map())
      const m = tutti.get(nome)
      return {
        async keys () { return [...m.keys()].map(url => ({ url })) },
        async put (q, r) { m.set(typeof q === 'string' ? q : q.url, r) },
      }
    },
  }
}
const leggi = async v => (typeof v === 'string' ? v : v ? await v.text() : undefined)

/* tutto quello che il foglio ha mostrato, in fila */
const storia = []
watch(aggiornando, s => storia.push(s ? s.fase : 'chiuso'), { flush: 'sync' })
const fasi = () => storia.filter((f, i) => f !== storia[i - 1])

function prova () {
  storia.length = 0
  versioneNuova.value = null
  let ripartito = 0
  return { riparti: () => { ripartito++ }, ripartito: () => ripartito }
}
const aspetta = ms => new Promise(ok => setTimeout(ok, ms))

/* ══════════ 1. la versione del sito ══════════ */
uguale('una versione senza id non è una versione', leggiVersione({ etichetta: 'ieri' }), null)
uguale('e nemmeno un niente', leggiVersione(null), null)
const letta = leggiVersione({ id: NUOVA.id, etichetta: NUOVA.etichetta, peso: 7968768 })
uguale('l\'id si tiene', letta.id, NUOVA.id)
uguale('e il peso anche', letta.peso, 7968768)
uguale('un build vecchio non ha il peso: zero, non NaN', leggiVersione({ id: 'x' }).peso, 0)
uguale('senza etichetta si dice l\'id', leggiVersione({ id: 'x' }).etichetta, 'x')

/* ══════════ 2. quale si prende ══════════
   Diversa non vuol dire più nuova: la rete di GitHub può servire per
   qualche minuto quella di prima, e prenderla sarebbe tornare indietro. */
uguale('la stessa non si prende', eDaPrendere(VECCHIA, VECCHIA.id), false)
uguale('una più nuova sì', eDaPrendere(NUOVA, VECCHIA.id), true)
uguale('una più vecchia no', eDaPrendere(VECCHIA, NUOVA.id), false)
uguale('lo stesso minuto e un id diverso (un build col «+») sì',
  eDaPrendere({ id: '2026.09.22.1736-313e33e+' }, VECCHIA.id), true)
uguale('senza data non si ordina: diversa basta', eDaPrendere({ id: 'prova' }, VECCHIA.id), true)
uguale('niente dal sito, niente da prendere', eDaPrendere(null, VECCHIA.id), false)

/* ══════════ 3. i pezzi piccoli ══════════ */
uguale('i megabyte con la virgola', inMega(7968768), '7,6')
uguale('zero è zero', inMega(0), '0,0')
uguale('e un niente pure', inMega(undefined), '0,0')

controlla('la pagina nuova dice il suo id', eDellaVersione(pagina(NUOVA), NUOVA.id))
controlla('quella vecchia no', !eDellaVersione(pagina(VECCHIA), NUOVA.id))
/* le virgolette servono: l'id pulito sta dentro quello col «+» */
controlla('un build col «+» non passa per quello pulito',
  !eDellaVersione(pagina({ ...VECCHIA, id: VECCHIA.id + '+' }), VECCHIA.id))

controlla('la radice è la pagina', eLaPagina(BASE, BASE))
controlla('index.html pure', eLaPagina(BASE + 'index.html', BASE))
controlla('anche con qualcosa in coda', eLaPagina(BASE + '?fonte=app#ripara', BASE))
controlla('un\'icona no', !eLaPagina(BASE + 'icona-192.png', BASE))
controlla('la radice di un altro sito no', !eLaPagina('https://esempio.it/altro/', BASE))

/* la pagina si scarica da un indirizzo che nessuna cache ha: il service
   worker di prima, che risponde dalla sua cache, lì non trova niente */
const daScaricare = indirizzoDaScaricare(BASE, VECCHIA.id + '+')
controlla('si scarica la radice, con la versione in coda',
  daScaricare.startsWith(BASE + '?aggiorna='), daScaricare)
controlla('e il «+» di un build sporco non diventa uno spazio', daScaricare.endsWith('%2B'), daScaricare)
controlla('ed è ancora la pagina, per chi la rimette in cache', eLaPagina(daScaricare, BASE))

/* il nome della cache di una versione lo scrive il service worker, e la
   pagina ci mette dentro la pagina prima che lui arrivi: se i due nomi si
   separano non si rompe niente, ma i megabyte tornano a scaricarsi due
   volte, e nessuno se ne accorgerebbe */
controlla('la cache di una versione si chiama come la chiama il service worker',
  readFileSync(new URL('../../vite.config.js', import.meta.url), 'utf8')
    .includes('`' + CASSETTO + '${VERSIONE.id}`'))

/* ══════════ 4. è già l'ultima ══════════
   Si chiede e basta: la pagina non si scarica, niente si tocca. */
{
  const p = prova()
  versioneNuova.value = NUOVA            // un nastro rimasto acceso da prima
  const s = sito({ versione: VECCHIA })
  await aggiornaOra({ prendi: s.prendi, cassetti: cassetti(), riparti: p.riparti,
                      base: BASE, mia: VECCHIA.id, respiro: 0 })
  uguale('dice che è già l\'ultima', aggiornando.value?.fase, 'gia')
  uguale('una domanda sola, a versione.json', s.chiamate.length, 1)
  uguale('e senza passare da nessuna cache', s.chiamate[0].cache, 'no-store')
  uguale('il nastro si spegne: diceva il falso', versioneNuova.value, null)
  uguale('niente riparte', p.ripartito(), 0)
  lasciaStare()
  uguale('la ✕ chiude il foglio', aggiornando.value, null)
}

/* ══════════ 5. c'è, e il giro arriva in fondo ══════════ */
{
  const p = prova()
  const casa = cassetti({
    'educagioco-vecchia': { [BASE]: pagina(VECCHIA), [BASE + 'index.html']: pagina(VECCHIA),
                            [BASE + 'icona-192.png']: 'png' },
    'altro-sito': { 'https://esempio.it/altro/': 'la pagina di un altro' },
  })
  const s = sito()
  await aggiornaOra({ prendi: s.prendi, cassetti: casa, riparti: p.riparti,
                      base: BASE, mia: VECCHIA.id, respiro: 0 })
  stessaLista('il foglio passa per i suoi tre passi', fasi(), ['chiedo', 'scarico', 'pronta'])
  const scaricati = storia.filter(f => f === 'scarico').length
  controlla('e i megabyte si vedono salire, un pezzo alla volta', scaricati >= 5, `${scaricati} volte`)
  uguale('la pagina si chiede senza passare da nessuna cache',
    s.chiamate.find(c => !c.url.endsWith('versione.json'))?.cache, 'no-store')
  uguale('e all\'indirizzo che nessuna cache ha',
    s.chiamate.find(c => !c.url.endsWith('versione.json'))?.url, indirizzoDaScaricare(BASE, NUOVA.id))
  const vecchia = casa.tutti.get('educagioco-vecchia')
  controlla('nella cache del gioco la radice è la nuova',
    eDellaVersione(await leggi(vecchia.get(BASE)), NUOVA.id))
  controlla('e anche index.html: ogni copia della vecchia',
    eDellaVersione(await leggi(vecchia.get(BASE + 'index.html')), NUOVA.id))
  uguale('le icone restano dove sono', await leggi(vecchia.get(BASE + 'icona-192.png')), 'png')
  uguale('la cache di un altro sito non si tocca',
    await leggi(casa.tutti.get('altro-sito').get('https://esempio.it/altro/')), 'la pagina di un altro')
  uguale('e nessuna radice nostra ci finisce dentro', casa.tutti.get('altro-sito').size, 1)
  /* e dove la cercherà il service worker nuovo, che così non la riscarica */
  const futura = casa.tutti.get(CASSETTO + NUOVA.id)
  controlla('la cache della versione nuova ha già la pagina',
    !!futura && eDellaVersione(await leggi(futura.get(BASE)), NUOVA.id))
  uguale('e solo quella: le icone le prende lui', futura?.size, 1)
  uguale('si riparte, una volta', p.ripartito(), 1)
  uguale('il nastro sa della nuova, se la ✕ fosse arrivata prima', versioneNuova.value?.id, NUOVA.id)
}

/* una cache del gioco senza la pagina — un'installazione vecchia a cui
   non era arrivata — la riceve lo stesso: è quella che il service
   worker apre se la ricarica tarda */
{
  const p = prova()
  const casa = cassetti({ 'educagioco-monca': { [BASE + 'icona-192.png']: 'png' } })
  await aggiornaOra({ prendi: sito().prendi, cassetti: casa, riparti: p.riparti,
                      base: BASE, mia: VECCHIA.id, respiro: 0 })
  controlla('la cache monca riceve la radice',
    eDellaVersione(await leggi(casa.tutti.get('educagioco-monca').get(BASE)), NUOVA.id))
}

/* senza cache (un sito senza https) si riparte lo stesso: la ricarica
   va in rete, e la rete la pagina giusta l'ha appena data */
{
  const p = prova()
  await aggiornaOra({ prendi: sito().prendi, cassetti: null, riparti: p.riparti,
                      base: BASE, mia: VECCHIA.id, respiro: 0 })
  uguale('senza cache si riparte comunque', p.ripartito(), 1)
}

/* ══════════ 6. la copia vecchia che si spaccia per nuova ══════════ */
{
  const p = prova()
  const casa = cassetti({ 'educagioco-vecchia': { [BASE]: pagina(VECCHIA) } })
  await aggiornaOra({ prendi: sito({ testo: pagina(VECCHIA) }).prendi, cassetti: casa,
                      riparti: p.riparti, base: BASE, mia: VECCHIA.id, respiro: 0 })
  uguale('il foglio lo dice', aggiornando.value?.fase, 'vecchia')
  controlla('la cache non si tocca',
    eDellaVersione(await leggi(casa.tutti.get('educagioco-vecchia').get(BASE)), VECCHIA.id))
  uguale('e non si riparte', p.ripartito(), 0)
  uguale('il nastro resta: il sito la nuova ce l\'ha', versioneNuova.value?.id, NUOVA.id)
}

/* ══════════ 7. il sito che non risponde ══════════ */
{
  const p = prova()
  await aggiornaOra({ prendi: sito({ muto: true }).prendi, cassetti: cassetti(),
                      riparti: p.riparti, base: BASE, mia: VECCHIA.id, respiro: 0 })
  uguale('senza rete: «il sito non risponde»', aggiornando.value?.fase, 'muto')
}
{
  const p = prova()
  const prima = Date.now()
  await aggiornaOra({ prendi: sito({ appeso: true }).prendi, cassetti: cassetti(), pazienza: 40,
                      riparti: p.riparti, base: BASE, mia: VECCHIA.id, respiro: 0 })
  uguale('un sito che non finisce mai di rispondere è un sito muto', aggiornando.value?.fase, 'muto')
  controlla('e lo si dice dopo la pazienza, non mai', Date.now() - prima < 2000)
}

/* ══════════ 8. lo scaricamento che si ferma ══════════
   Un pezzo arriva, poi più niente. Il gioco resta com'era: niente in
   cache, niente ricarica. */
{
  const p = prova()
  const casa = cassetti({ 'educagioco-vecchia': { [BASE]: pagina(VECCHIA) } })
  await aggiornaOra({ prendi: sito({ fermo: true }).prendi, cassetti: casa, fermo: 40,
                      riparti: p.riparti, base: BASE, mia: VECCHIA.id, respiro: 0 })
  uguale('il foglio dice che si è fermato', aggiornando.value?.fase, 'interrotto')
  controlla('e quanto era arrivato', aggiornando.value?.presi > 0, JSON.stringify(aggiornando.value))
  controlla('la cache non si tocca',
    eDellaVersione(await leggi(casa.tutti.get('educagioco-vecchia').get(BASE)), VECCHIA.id))
  uguale('non si riparte', p.ripartito(), 0)
}
{
  const p = prova()
  await aggiornaOra({ prendi: sito({ stato: 500 }).prendi, cassetti: cassetti(),
                      riparti: p.riparti, base: BASE, mia: VECCHIA.id, respiro: 0 })
  uguale('la pagina che risponde con un guasto è uno scaricamento fermato',
    aggiornando.value?.fase, 'interrotto')
}

/* ══════════ 9. la ✕ a metà ══════════ */
{
  const p = prova()
  const casa = cassetti({ 'educagioco-vecchia': { [BASE]: pagina(VECCHIA) } })
  const giro = aggiornaOra({ prendi: sito({ fermo: true }).prendi, cassetti: casa, fermo: 5000,
                             riparti: p.riparti, base: BASE, mia: VECCHIA.id, respiro: 0 })
  await aspetta(30)
  uguale('si stava scaricando', aggiornando.value?.fase, 'scarico')
  lasciaStare()
  await giro
  uguale('la ✕ chiude, e il foglio resta chiuso', aggiornando.value, null)
  uguale('niente riparte', p.ripartito(), 0)
  controlla('la cache non si tocca',
    eDellaVersione(await leggi(casa.tutti.get('educagioco-vecchia').get(BASE)), VECCHIA.id))
}

/* ══════════ 10. il sito più vecchio di questa pagina ══════════ */
{
  const p = prova()
  const s = sito({ versione: VECCHIA })
  await aggiornaOra({ prendi: s.prendi, cassetti: cassetti(), riparti: p.riparti,
                      base: BASE, mia: NUOVA.id, respiro: 0 })
  uguale('non si torna indietro: è già l\'ultima', aggiornando.value?.fase, 'gia')
  uguale('e la pagina non si scarica', s.chiamate.length, 1)
}

lasciaStare()
riassunto('cerca aggiornamenti')
