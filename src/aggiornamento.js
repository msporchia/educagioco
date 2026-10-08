// «C'è una versione nuova»: vedi docs/core/aggiornamento.md.
import { ref } from 'vue'

// Da Node (i test) non c'è: chi prova passa la sua.
const QUESTA = typeof __VERSIONE__ !== 'undefined' ? __VERSIONE__ : { id: '', etichetta: '' }

// { id, etichetta, peso } della versione servita dal sito, o null: si
// accende confrontando versione.json con __VERSIONE__, non l'installazione
// del service worker (che sbagliava in tutti e due i versi).
export const versioneNuova = ref(null)

const OGNI = 30 * 60 * 1000

// i timer in background sono congelati: vedi docs/core/aggiornamento.md
const NON_PRIMA_DI = 5 * 60 * 1000
let registrazione = null
let ultimoControllo = 0
let sorvegliato = false

// Solo dove c'è un sito a cui chiedere (non da file:// né dal dev server)
export const daUnSito = () =>
  typeof location !== 'undefined' && location.protocol.startsWith('http') && !import.meta.env.DEV

export function controlla (ora = Date.now()) {
  if (!sorvegliato || versioneNuova.value || aggiornando.value) return false
  if (ora - ultimoControllo < NON_PRIMA_DI) return false
  ultimoControllo = ora
  // il service worker si aggiorna per conto suo: qui non decide cosa dire
  if (registrazione) registrazione.update().catch(() => {})
  chiediAlSito()
    .then(sito => { if (eDaPrendere(sito, QUESTA.id)) versioneNuova.value = sito })
    .catch(() => { /* senza rete non c'è niente da dire: si riproverà */ })
  return true
}

export function sorveglia () {
  if (!daUnSito()) return   // niente service worker da file://, ed è giusto così
  sorvegliato = true

  window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => { registrazione = reg })
        .catch(() => { /* pazienza */ })
    }
    setInterval(() => controlla(), OGNI)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) controlla()
    })
    controlla()
  })
}

export function leggiVersione (dato) {
  if (!dato || typeof dato.id !== 'string' || !dato.id) return null
  return {
    id: dato.id,
    etichetta: typeof dato.etichetta === 'string' && dato.etichetta ? dato.etichetta : dato.id,
    peso: Number.isFinite(dato.peso) && dato.peso > 0 ? dato.peso : 0,
  }
}

// Diversa non vuol dire più nuova: il sito può servire per qualche minuto
// una copia più vecchia (la cache di rete che si svuota dopo un push).
// L'id comincia con la data del build, che si ordina come stringa.
export function eDaPrendere (sito, mia) {
  if (!sito || !sito.id || sito.id === mia) return false
  const quando = id => /^\d{4}\.\d{2}\.\d{2}\.\d{4}/.exec(id || '')?.[0] || ''
  const s = quando(sito.id), m = quando(mia)
  if (!s || !m) return true
  return s >= m
}

export const inMega = byte => (Math.max(0, byte || 0) / (1024 * 1024)).toFixed(1).replace('.', ',')

// Le virgolette contano: senza, l'id di un build «pulito» si ritroverebbe
// anche dentro quello col `+` fatto lo stesso minuto.
export const eDellaVersione = (testo, id) =>
  !!id && typeof testo === 'string' && ['"', "'", '`'].some(q => testo.includes(q + id + q))

export function eLaPagina (url, radice) {
  try {
    const u = new URL(url)
    u.search = ''; u.hash = ''
    return u.href === radice || u.href === radice + 'index.html'
  } catch (e) { return false }
}

const rete = (...a) => fetch(...a)
const qui = () => (typeof location !== 'undefined' ? location.href : 'http://localhost/')

const CHIEDERE = 15000   // oltre questo, il sito «non risponde»

export async function chiediAlSito ({ prendi = rete, base = qui(), segnale, pazienza = CHIEDERE } = {}) {
  const ctrl = new AbortController()
  const scaduta = setTimeout(() => ctrl.abort(), pazienza)
  const ferma = () => ctrl.abort()
  segnale?.addEventListener('abort', ferma)
  try {
    // no-store: né la cache del browser né quella del service worker
    const r = await prendi(new URL('versione.json', base).href,
                           { cache: 'no-store', signal: ctrl.signal })
    if (!r.ok) throw new Error(`versione.json: ${r.status}`)
    const v = leggiVersione(await r.json())
    if (!v) throw new Error('versione.json senza id')
    return v
  } finally {
    clearTimeout(scaduta)
    segnale?.removeEventListener('abort', ferma)
  }
}

// «↻ cerca aggiornamenti»: vedi docs/core/aggiornamento.md, che spiega
// perché una semplice ricarica non bastava.

// null a foglio chiuso, se no { fase, … }: chiedo · gia · scarico · pronta · muto · interrotto · vecchia
export const aggiornando = ref(null)

// deve combaciare col nome che usa il service worker (vite.config.js): lo guarda unita/aggiornamento
export const CASSETTO = 'educagioco-'

const FERMO = 30000     // senza un byte per tanto, lo scaricamento si considera fermo
const RESPIRO = 700     // «Fatto: riparto» dev'essere leggibile prima che la pagina se ne vada

let giro = null

/* la ✕ del foglio: ferma quello che c'è in corso e chiude */
export function lasciaStare () {
  if (giro) { giro.abort(); giro = null }
  aggiornando.value = null
}

const aspetta = ms => new Promise(ok => setTimeout(ok, ms))

export async function aggiornaOra ({
  prendi = rete,
  cassetti = typeof caches !== 'undefined' ? caches : null,
  riparti = () => location.reload(),
  prepara = swNuovoAttivo,
  base = qui(),
  mia = QUESTA.id,
  pazienza = CHIEDERE,
  fermo = FERMO,
  respiro = RESPIRO,
} = {}) {
  lasciaStare()
  const questo = giro = new AbortController()
  const vivo = () => giro === questo
  const segna = stato => { if (vivo()) aggiornando.value = stato }

  /* 1. che versione ha il sito */
  segna({ fase: 'chiedo' })
  let sito
  try {
    sito = await chiediAlSito({ prendi, base, segnale: questo.signal, pazienza })
  } catch (e) {
    return segna({ fase: 'muto' })
  }
  if (!vivo()) return
  if (!eDaPrendere(sito, mia)) {
    versioneNuova.value = null
    return segna({ fase: 'gia', sito })
  }
  versioneNuova.value = sito

  /* 2. la pagina, contando i byte */
  const totale = sito.peso
  segna({ fase: 'scarico', sito, presi: 0, totale })
  let pagina
  try {
    pagina = await scaricaPagina({
      prendi, url: indirizzoDaScaricare(base, sito.id), segnale: questo.signal, fermo,
      ferma: () => questo.abort(),
      suPezzo: presi => segna({ fase: 'scarico', sito, presi, totale }),
    })
  } catch (e) {
    return segna({ fase: 'interrotto', sito, presi: aggiornando.value?.presi || 0, totale })
  }
  if (!vivo()) return

  /* 3. è davvero quella? */
  if (!eDellaVersione(await pagina.blob.text(), sito.id)) return segna({ fase: 'vecchia', sito })
  if (!vivo()) return

  // 4. al posto della vecchia; se fallisce si riparte lo stesso (la rete ha già dato la pagina giusta)
  try { await mettiInCasa({ cassetti, base, nuovo: CASSETTO + sito.id, ...pagina }) }
  catch (e) { /* pazienza */ }
  if (!vivo()) return

  /* 5. si riparte, ma col service worker nuovo già al suo posto: se si installa durante la ricarica, Firefox
     interrompe la richiesta che il vecchio sta servendo e lascia la pagina bianca (docs/core/aggiornamento.md) */
  segna({ fase: 'pronta', sito })
  await Promise.all([aspetta(respiro), prepara().catch(() => {})])
  if (vivo()) riparti()
}

// Chiede subito il service worker nuovo e aspetta che sia attivo (al più `pazienza` ms). Nessuno nuovo: si va.
export async function swNuovoAttivo ({ pazienza = 8000 } = {}) {
  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : null
  const reg = sw && await sw.getRegistration()
  if (!reg) return
  await reg.update().catch(() => {})
  const nuovo = reg.installing || reg.waiting
  if (!nuovo) return
  await new Promise(ok => {
    const fatto = () => { if (nuovo.state === 'activated' || nuovo.state === 'redundant') { clearTimeout(t); ok() } }
    const t = setTimeout(ok, pazienza)
    nuovo.addEventListener('statechange', fatto)
    fatto()
  })
}

// Un indirizzo che nessuna cache ha: il service worker vecchio non lo
// trova nella sua cache e va in rete, invece di rispondere con la copia vecchia.
export const indirizzoDaScaricare = (base, id) =>
  new URL('./?aggiorna=' + encodeURIComponent(id), base).href

export async function scaricaPagina ({ prendi = rete, url, segnale, fermo = FERMO,
                                       ferma = () => {}, suPezzo = () => {} }) {
  let sveglia = null
  const ancora = () => { clearTimeout(sveglia); sveglia = setTimeout(ferma, fermo) }
  try {
    ancora()
    const r = await prendi(url, { cache: 'no-store', signal: segnale })
    if (!r.ok) throw new Error(`la pagina: ${r.status}`)
    const tipo = r.headers.get('content-type') || 'text/html; charset=utf-8'
    // senza lettura a pezzi: niente barra di avanzamento, l'aggiornamento arriva comunque
    if (!r.body || typeof r.body.getReader !== 'function') {
      const blob = await r.blob()
      suPezzo(blob.size)
      return { blob, tipo }
    }
    const lettore = r.body.getReader()
    const pezzi = []
    let presi = 0
    for (;;) {
      const { done, value } = await lettore.read()
      if (done) break
      pezzi.push(value)
      presi += value.byteLength
      ancora()
      suPezzo(presi)
    }
    return { blob: new Blob(pezzi, { type: tipo }), tipo }
  } finally {
    clearTimeout(sveglia)
  }
}

// Una cache è nostra se tiene roba sotto la nostra radice: non serve sapere
// come si chiama. `nuovo` (la cache della versione scaricata) non esiste
// ancora: la crea il service worker nuovo installandosi, e se trova già la
// pagina non la riscarica (vite.config.js).
export async function mettiInCasa ({ cassetti, base, blob, tipo, nuovo = '' }) {
  if (!cassetti) return 0
  const radice = new URL('./', base).href
  const copia = () => new Response(blob, { headers: { 'Content-Type': tipo } })
  let messe = 0
  for (const nome of await cassetti.keys()) {
    const cassetto = await cassetti.open(nome)
    const chiavi = await cassetto.keys()
    if (!chiavi.some(q => q.url.startsWith(radice))) continue
    const pagine = chiavi.filter(q => eLaPagina(q.url, radice))
    const dove = pagine.some(q => q.url === radice) ? pagine : [radice, ...pagine]
    for (const q of dove) {
      await cassetto.put(q, copia())
      messe++
    }
  }
  if (nuovo) {
    await (await cassetti.open(nuovo)).put(radice, copia())
    messe++
  }
  return messe
}
