/* ═══════════════════════════════════════════════════════════════════
   «C'È UNA VERSIONE NUOVA»

   Il service worker si aggiorna da sé — `skipWaiting()` in installazione,
   le cache vecchie cancellate all'attivazione — ma **la pagina già aperta
   resta quella di prima**: il JavaScript è in memoria, e finché non si
   ricarica il bambino gioca alla versione di ieri. Su un telefono
   installato quella pagina può restare aperta per giorni.

   Perché è un problema vero solo adesso: finché il gioco stava su due
   telefoni di casa lo si riapriva a mano. Con più famiglie sopra, la
   metà delle segnalazioni che arrivano è «da me non succede» — e la
   risposta è quasi sempre che stanno su due versioni diverse.

   ── DUE COSE CHE NON SI FANNO ──
   1. **Non si ricarica da soli.** Un reload in mezzo a un'ondata butta
      via la partita, e a un bambino sembra che il gioco sia crollato.
      Si dice che c'è, e ricarica lui quando gli va.
   2. **Non si dice dentro un gioco.** Il cartello vive in home
      (`guide/Nastri.vue`), dove non c'è niente da perdere.

   ── E UNA CHE SI FA A RICHIESTA ──
   «↻ cerca aggiornamenti», in fondo alla home: chiede al sito, scarica,
   controlla quello che ha scaricato e solo allora riparte. Sta più giù,
   nella sezione «il giro a richiesta», insieme al perché ricaricare e
   basta non bastava.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'

/* La versione di questa pagina, scritta dal build (`vite.config.js`).
   Da Node — i test — non c'è, e chi prova passa la sua. */
const QUESTA = typeof __VERSIONE__ !== 'undefined' ? __VERSIONE__ : { id: '', etichetta: '' }

/* ── COSA DICE IL NASTRO, E A CHI LO SI CHIEDE ──
   Il nastro si accendeva quando il service worker ne installava uno
   nuovo, cioè quando cambiava **chi tiene la copia** e non quando la
   pagina a schermo era indietro. Di solito le due cose vanno insieme; e
   quando non ci vanno il nastro sbagliava in tutte e due le direzioni:

   - diceva «c'è una versione nuova» a chi l'aveva **già**. Si apre
     l'app, la pagina arriva fresca dalla rete, e alle sue spalle il
     service worker si aggiorna: compare il nastro, si ricarica, e non
     cambia niente. È il modo più sicuro di insegnare che il nastro non
     va creduto;
   - taceva con chi era **indietro**: se il service worker nuovo si era
     già messo in casa — magari con dentro la pagina di prima, vedi
     `vite.config.js` — non c'era più niente da installare, e quindi
     niente da dire, per sempre.

   Adesso si chiede al sito: `versione.json` dice cosa sta servendo,
   `__VERSIONE__` cosa c'è a schermo, e il nastro si accende quando il
   sito ne ha una più nuova. Centocinquanta byte, e nessuna cache in
   mezzo. Qui dentro sta `{ id, etichetta, peso }` di quella del sito,
   o `null` quando non c'è niente da dire. */
export const versioneNuova = ref(null)

/* Ogni mezz'ora si torna a chiedere. Senza questo, una pagina lasciata
   aperta non va a vedere mai più: il controllo automatico del browser
   passa dal caricamento della pagina, che è precisamente quello che qui
   non succede. */
const OGNI = 30 * 60 * 1000

/* ── IL CONTROLLO NEI MOMENTI GIUSTI ──
   Il timer qui sopra ha un difetto che non si vede dal codice: **i timer
   di una pagina in secondo piano sono congelati**, su iOS come su
   Android. Una PWA installata sta in background quasi sempre — la si
   riprende dallo switcher, non la si riapre — quindi quel mezz'ora
   scatta solo per chi sta giocando da mezz'ora di fila, che è il momento
   peggiore per dirgli di ricaricare.

   I momenti giusti sono tre: **quando la pagina si apre**, **quando
   l'app torna in primo piano** e **quando si torna in home**. Nel primo
   si scopre subito una pagina arrivata dalla cache mentre il sito era
   già avanti; negli altri due il gioco non è ancora cominciato o è
   appena finito, e in nessuno c'è niente da perdere ricaricando.

   Costa `versione.json` e `sw.js`, un paio di kilobyte in tutto. Il
   conto grosso — il gioco intero da riscaricare — si paga solo quando
   c'è davvero una versione nuova, ed è il prezzo dell'aggiornamento,
   non del controllo. Il freno serve comunque: in home si torna dieci
   volte in un pomeriggio, e dieci richieste al minuto non dicono niente
   più di una. */
const NON_PRIMA_DI = 5 * 60 * 1000
let registrazione = null
let ultimoControllo = 0
let sorvegliato = false

/* Il tasto «cerca aggiornamenti» c'è solo dove c'è un sito a cui
   chiedere: dal file aperto col doppio click non c'è nessuno dall'altra
   parte, e il server di sviluppo `versione.json` non ce l'ha. Lo dice
   l'indirizzo e non `sorveglia()`, che `main.js` chiama dopo il `mount`:
   una home che si montasse prima lo troverebbe spento senza motivo. */
export const daUnSito = () =>
  typeof location !== 'undefined' && location.protocol.startsWith('http') && !import.meta.env.DEV

export function controlla (ora = Date.now()) {
  if (!sorvegliato || versioneNuova.value || aggiornando.value) return false
  if (ora - ultimoControllo < NON_PRIMA_DI) return false
  ultimoControllo = ora
  /* il service worker si tiene aggiornato per conto suo: serve a chi
     riapre il gioco senza rete, non a decidere cosa dire qui */
  if (registrazione) registrazione.update().catch(() => {})
  chiediAlSito()
    .then(sito => { if (eDaPrendere(sito, QUESTA.id)) versioneNuova.value = sito })
    .catch(() => { /* senza rete non c'è niente da dire: si riproverà */ })
  return true
}

export function sorveglia () {
  /* Da `file://` il browser vieta i service worker, ed è giusto così: il
     file unico è già tutto lì dentro. Se la registrazione fallisce non si
     dice niente a nessuno — vuol dire che si gioca senza offline, non che
     il gioco è rotto. */
  if (!daUnSito()) return
  sorvegliato = true

  window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => { registrazione = reg })
        .catch(() => { /* pazienza */ })
    }
    setInterval(() => controlla(), OGNI)
    /* il ritorno in primo piano: è qui che un telefono scopre di essere
       indietro, e l'unico momento in cui nessuno sta giocando */
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) controlla()
    })
    controlla()
  })
}

/* ── la parte che si prova senza browser ── */

/* `versione.json` è roba che arriva da fuori: quello che non ha un `id`
   non è una versione, e il `peso` (i byte della pagina) c'è solo dai
   build che lo scrivono. */
export function leggiVersione (dato) {
  if (!dato || typeof dato.id !== 'string' || !dato.id) return null
  return {
    id: dato.id,
    etichetta: typeof dato.etichetta === 'string' && dato.etichetta ? dato.etichetta : dato.id,
    peso: Number.isFinite(dato.peso) && dato.peso > 0 ? dato.peso : 0,
  }
}

/* Diversa non vuol dire più nuova. Il sito può servire per qualche
   minuto una copia più vecchia di quella a schermo — la cache della
   rete che ci mette a svuotarsi dopo una pubblicazione — e prenderla
   sarebbe tornare indietro. L'id comincia con la data del build
   (`2026.09.23.1739-…`), che si ordina come una stringa: si prende
   quella che non è più vecchia. Senza data non si sa ordinarle, e
   diversa basta. */
export function eDaPrendere (sito, mia) {
  if (!sito || !sito.id || sito.id === mia) return false
  const quando = id => /^\d{4}\.\d{2}\.\d{2}\.\d{4}/.exec(id || '')?.[0] || ''
  const s = quando(sito.id), m = quando(mia)
  if (!s || !m) return true
  return s >= m
}

/* I megabyte come li scrive chi parla italiano: «7,6». */
export const inMega = byte => (Math.max(0, byte || 0) / (1024 * 1024)).toFixed(1).replace('.', ',')

/* La pagina scaricata è davvero quella promessa? Il build scrive l'id
   dentro il codice fra virgolette (`id:"2026.09.23.1739-313e33e"`), e
   le virgolette servono: senza, l'id di un build «pulito» si
   ritroverebbe anche dentro quello col `+` fatto lo stesso minuto. */
export const eDellaVersione = (testo, id) =>
  !!id && typeof testo === 'string' && ['"', "'", '`'].some(q => testo.includes(q + id + q))

/* Una chiave della cache è la pagina se, tolta la coda (`?…`, `#…`), è
   la radice del gioco o il suo `index.html`. */
export function eLaPagina (url, radice) {
  try {
    const u = new URL(url)
    u.search = ''; u.hash = ''
    return u.href === radice || u.href === radice + 'index.html'
  } catch (e) { return false }
}

/* ── chiedere al sito ── */
const rete = (...a) => fetch(...a)
const qui = () => (typeof location !== 'undefined' ? location.href : 'http://localhost/')

/* oltre questo, il sito «non risponde»: per centocinquanta byte è tanto */
const CHIEDERE = 15000

export async function chiediAlSito ({ prendi = rete, base = qui(), segnale, pazienza = CHIEDERE } = {}) {
  const ctrl = new AbortController()
  const scaduta = setTimeout(() => ctrl.abort(), pazienza)
  const ferma = () => ctrl.abort()
  segnale?.addEventListener('abort', ferma)
  try {
    /* `no-store`: né la cache del browser né quella del service worker
       (che `versione.json` lo lascia passare apposta) devono rispondere
       al posto del sito */
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

/* ═══════════════════════════════════════════════════════════════════
   IL GIRO A RICHIESTA — «↻ CERCA AGGIORNAMENTI»

   Tutto il resto di questo file è automatico, e l'automatico ha un
   difetto: quando non va **non si vede**. Si sa che c'è una versione
   nuova, il telefono dice ancora quella di ieri, e non c'è niente da
   premere. Il nastro prometteva «Ricarica», e ricaricare non bastava
   per tre motivi che non si leggono da nessuna parte:

   1. **la pagina che risponde alla ricarica può essere quella di
      prima.** Il service worker per la pagina prova la rete, ma con una
      pazienza di due secondi e mezzo: con la connessione lenta vince la
      copia in cache, e la copia in cache è la vecchia. Il nastro sparisce
      lo stesso, perché a quel punto il service worker è già il nuovo;
   2. **la cache del browser.** GitHub Pages dice a tutti di tenersi la
      pagina dieci minuti, e fra chi se la tiene c'è anche il service
      worker nuovo, che se la ritrova in casa quando si installa;
   3. **niente dice quanto manca.** Sette megabyte e mezzo su una rete
      lenta sono minuti, e il service worker li scarica in silenzio:
      da fuori, un aggiornamento in corso e uno che non arriverà mai
      sono identici.

   Quindi qui si fa tutto alla luce, un passo alla volta, e ognuno si
   vede sul foglio (`guide/Aggiorna.vue`):

   1. si chiede al sito che versione ha — se è questa, si dice e basta;
   2. si scarica la pagina **a mano**, contando i megabyte, e **dal
      sito**: anche questa richiesta passa dal service worker, che per
      tutto quello che non è una navigazione risponde prima dalla sua
      cache — cioè con la copia vecchia. Perciò si chiede un indirizzo
      che nessuna cache ha (`./?aggiorna=<id>`: il sito serve la stessa
      pagina), e `no-store`, che il service worker nuovo lascia passare;
   3. si controlla che dentro ci sia l'id promesso — una copia vecchia
      rimasta nella rete di GitHub non deve passare per nuova;
   4. la si mette **al posto della vecchia** nelle cache del service
      worker, così che la ricarica la trovi anche se la rete, proprio in
      quel momento, tarda; e **nella cache della versione nuova**, dove
      il service worker nuovo la trova installandosi e non la riscarica:
      su una rete lenta, sette megabyte e mezzo una volta sola;
   5. solo adesso si riparte.

   Niente di quello che c'era si butta prima di avere in mano quello
   nuovo: se la rete cade a metà, il gioco resta com'era e funziona
   anche senza. È la differenza con «Riscarica il gioco» (`ripara()` in
   `incidenti.js`), che butta via tutto e poi ricarica — giusto per una
   copia rotta, sbagliato per una copia soltanto vecchia.
   ═══════════════════════════════════════════════════════════════════ */

/* lo stato del foglio: `null` a foglio chiuso, se no `{ fase, … }` —
   chiedo · gia · scarico · pronta · muto · interrotto · vecchia */
export const aggiornando = ref(null)

/* Come si chiama la cache di una versione: il service worker la chiama
   `educagioco-<id>` (`vite.config.js`), e qui serve saperlo per metterci
   dentro la pagina prima che lui arrivi. Se un giorno i due nomi non
   combaciassero non si romperebbe niente — il service worker nuovo la
   riscaricherebbe, e la cache in più se ne andrebbe alla sua attivazione
   — ma si pagherebbe di nuovo il doppio dei megabyte: lo guarda
   `unita/aggiornamento`. */
export const CASSETTO = 'educagioco-'

/* tanto tempo senza un byte, e lo scaricamento si considera fermo: su
   una rete lenta i pezzi arrivano radi, ma arrivano */
const FERMO = 30000
/* «Fatto: riparto» dev'essere leggibile prima che la pagina se ne vada */
const RESPIRO = 700

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

  /* 4. al posto della vecchia, e dove la cercherà il service worker
     nuovo. Se non riesce si riparte lo stesso: la rete la pagina giusta
     l'ha appena data, e la ricarica la chiede lì */
  try { await mettiInCasa({ cassetti, base, nuovo: CASSETTO + sito.id, ...pagina }) }
  catch (e) { /* pazienza */ }
  if (!vivo()) return

  /* 5. si riparte */
  segna({ fase: 'pronta', sito })
  await aspetta(respiro)
  if (vivo()) riparti()
}

/* La pagina, a un indirizzo che nessuna cache ha. Il sito la serve
   uguale — la coda dopo `?` un sito statico non la guarda — mentre il
   service worker la cerca nella sua cache, non la trova e va in rete.
   Senza, quello di prima risponderebbe con la copia che tiene: è per
   questo che «Ricarica» a volte non cambiava niente. */
export const indirizzoDaScaricare = (base, id) =>
  new URL('./?aggiorna=' + encodeURIComponent(id), base).href

/* ── lo scaricamento ──
   `no-store`: né la cache del browser né quella del service worker, e
   niente copie lasciate in giro — la pagina buona la mette a posto
   `mettiInCasa`, sotto il nome giusto. */
export async function scaricaPagina ({ prendi = rete, url, segnale, fermo = FERMO,
                                       ferma = () => {}, suPezzo = () => {} }) {
  let sveglia = null
  const ancora = () => { clearTimeout(sveglia); sveglia = setTimeout(ferma, fermo) }
  try {
    ancora()
    const r = await prendi(url, { cache: 'no-store', signal: segnale })
    if (!r.ok) throw new Error(`la pagina: ${r.status}`)
    const tipo = r.headers.get('content-type') || 'text/html; charset=utf-8'
    /* un browser che non sa leggere a pezzi la prende tutta insieme:
       niente barra, ma l'aggiornamento arriva lo stesso */
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

/* ── al posto della vecchia ──
   Il service worker, per la pagina, prova la rete e ripiega sulla sua
   cache: è lì che la versione vecchia si nasconde. Non si sa come si
   chiama la sua cache (dipende dalla versione), e non importa: **una
   cache è nostra se tiene roba del gioco**, e dentro le nostre la pagina
   nuova va al posto di ogni copia della vecchia — la radice, e se c'è
   `index.html`. Le cache di altri siti sullo stesso indirizzo, se ce ne
   sono, non tengono niente sotto la nostra radice e restano come sono.

   Poi c'è `nuovo`, la cache della versione appena scaricata: non esiste
   ancora, la crea il service worker nuovo installandosi — e se ci trova
   già la pagina non la riscarica (`vite.config.js`). */
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
