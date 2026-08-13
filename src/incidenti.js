/* ═══════════════════════════════════════════════════════════════════
   IL LIBRETTO DEGLI INCIDENTI — cosa succede quando il gioco si rompe.

   Fino a ieri un errore dentro un gestore di eventi non si vedeva da
   nessuna parte: Vue lo scrive in console e la schermata resta com'era.
   A un grande davanti a un computer basta. A un bambino col telefono in
   mano vuol dire **un tasto che non fa niente**, e a chi deve capirlo il
   giorno dopo non resta niente in mano — solo il racconto di una cosa
   che «si è piantata».

   Qui succedono tre cose, in ordine di importanza:

   1. l'errore si SCRIVE nell'archivio, sotto `incidenti`. Sta fuori dai
      profili come il codice dei genitori: un guasto è del telefono, non
      di un bambino, e chi lo legge lo cerca una volta sola.
   2. si mostra un cartello. In DOM puro e non in Vue, perché quando è
      Vue quello inciampato un componente Vue non comparirebbe: sarebbe
      una rete di sicurezza appesa al ramo che si è appena spezzato.
   3. si offre di RIPARARE: buttare la copia in cache del service worker
      e la sua registrazione, e ricaricare. Non tocca né IndexedDB né
      localStorage — **i progressi restano** — ed è la manovra giusta
      per una copia dell'app arrivata monca, che se no si ripresenta
      identica ad ogni avvio e non c'è ricarica che la smuova.

   Quello che questo file NON può fare, e va detto: se a rompersi è la
   copia dell'app, questo codice non gira affatto. Per quel caso la
   difesa sta nel service worker (`vite.config.js`), che per la pagina
   prova la rete prima della cache. Qui si raccoglie il resto.
   ═══════════════════════════════════════════════════════════════════ */
import { load, save, flush } from './store/storage.js'

const CHIAVE = 'incidenti'
/* quanti se ne tengono in archivio: gli ultimi, perché il primo di
   stamattina conta meno dell'ultimo di adesso */
const QUANTI = 8
/* e quanti se ne registrano per accensione. Un errore dentro il giro di
   disegno si ripete sessanta volte al secondo: senza questo tetto il
   libretto degli incidenti diventerebbe lui il guasto. */
const PER_VOLTA = 3

let scritti = 0
let visti = new Set()
let versione = ''

/* ── la parte che si può provare senza browser ──
   La lista è in ordine di racconto (il più vecchio in testa) e non
   cresce mai oltre il tetto. Uno stesso guasto che si ripete non
   occupa otto righe: si tiene l'ultima volta e si conta quante. */
export function aggiungi (lista, voce, quanti = QUANTI) {
  const prima = Array.isArray(lista) ? lista.filter(v => v && typeof v === 'object') : []
  const gemello = prima.findIndex(v => v.testo === voce.testo && v.dove === voce.dove)
  const conto = gemello >= 0 ? (prima[gemello].volte || 1) + 1 : 1
  const senza = gemello >= 0 ? prima.filter((_, i) => i !== gemello) : prima
  return [...senza, { ...voce, volte: conto }].slice(-quanti)
}

/* il testo di un errore, che arriva in cinque forme diverse a seconda di
   chi l'ha lanciato: un Error, una stringa, un rifiuto di promessa con
   dentro qualunque cosa */
export function testoDi (e) {
  if (!e) return 'errore senza nome'
  if (typeof e === 'string') return e
  if (e.message) return `${e.name || 'Errore'}: ${e.message}`
  try { return String(e) } catch (x) { return 'errore illeggibile' }
}

const primeRighe = (pila, quante = 4) =>
  typeof pila === 'string' ? pila.split('\n').slice(0, quante).join('\n') : ''

export const leggi = () => load(CHIAVE).then(l => (Array.isArray(l) ? l : []))
export const dimentica = () => { save(CHIAVE, []); return flush() }

/* ── registrare ──
   Non aspetta nessuno: chi chiama è un gestore d'errore, e un gestore
   d'errore che si mette ad attendere l'archivio è un secondo guasto.
   Il `flush()` invece serve: un salvataggio ritardato di un terzo di
   secondo, dopo un crash, spesso non arriva mai. */
export async function registra (dove, errore, mostra = true) {
  const testo = testoDi(errore)
  const gia = visti.has(dove + testo)
  visti.add(dove + testo)
  if (mostra) cartello(testo)
  if (scritti >= PER_VOLTA && gia) return
  scritti++
  try {
    const voce = {
      quando: new Date().toISOString(),
      dove,
      testo,
      pila: primeRighe(errore && errore.stack),
      versione,
      dove_era: typeof location !== 'undefined' ? (location.hash || '') : '',
    }
    save(CHIAVE, aggiungi(await leggi(), voce))
    await flush()
  } catch (x) { /* se non si riesce nemmeno a scrivere il guasto, pazienza */ }
}

/* ── riparare ──
   Butta la copia dell'app e chi la serviva, e basta. I progressi stanno
   in IndexedDB e in localStorage, che qui non si toccano: è tutta la
   differenza fra questo tasto e «cancella i dati del sito», che invece
   li porta via. */
export async function ripara () {
  try {
    if (typeof caches !== 'undefined') {
      const nomi = await caches.keys()
      await Promise.all(nomi.map(n => caches.delete(n)))
    }
  } catch (x) { /* niente cache: già a posto */ }
  try {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      const reg = await navigator.serviceWorker.getRegistrations()
      await Promise.all(reg.map(r => r.unregister()))
    }
  } catch (x) { /* niente service worker: già a posto */ }
  /* l'indirizzo si pulisce PRIMA di ricaricare: con `#ripara` ancora in
     coda la pagina riaprirebbe riparando, all'infinito */
  try { location.hash = '' } catch (x) { /* pazienza */ }
  location.reload()
}

/* `#ripara` nell'indirizzo fa la stessa cosa senza toccare niente a
   schermo: è la strada per un telefono che parte ma si comporta male,
   quando il cartello non è comparso e i menu del browser sono lontani. */
export function riparaSeChiesto () {
  if (typeof location === 'undefined') return false
  if (!/(^#?|&)ripara(&|$)/.test(location.hash || '')) return false
  ripara()
  return true
}

/* ═══════════ il cartello ═══════════
   Sfondo crema come il resto dell'app, due tasti e una riga di
   spiegazione. Il messaggio tecnico c'è ma sta in fondo e in piccolo:
   serve al grande che lo legge dopo, non al bambino che ce l'ha davanti
   adesso. Ne compare uno solo: il secondo errore aggiorna quello che
   c'è già, invece di impilarsi. */
let appeso = null

export function cartello (testo) {
  if (typeof document === 'undefined' || !document.body) return
  if (appeso) { appeso.querySelector('[data-che="dettaglio"]').textContent = testo; return }

  const fuori = document.createElement('div')
  fuori.setAttribute('role', 'alertdialog')
  fuori.style.cssText = `position:fixed; inset:0; z-index:99999; display:flex;
    align-items:center; justify-content:center; padding:22px;
    background:#fff7ecf2; font-family:inherit; color:#3b3350; text-align:center`

  const dentro = document.createElement('div')
  dentro.style.cssText = `max-width:34ch; display:flex; flex-direction:column;
    align-items:center; gap:12px`
  dentro.innerHTML = `
    <div style="font-size:52px">🔧</div>
    <b style="font-size:20px">Il gioco si è impigliato</b>
    <p style="margin:0; font-size:15px; line-height:1.4">
      Non hai perso niente: quello che hai imparato è al sicuro.</p>`

  const riga = document.createElement('div')
  riga.style.cssText = 'display:flex; gap:10px; flex-wrap:wrap; justify-content:center'

  const tasto = (testo, sfondo, ombra, colore, fai) => {
    const b = document.createElement('button')
    b.textContent = testo
    b.style.cssText = `border:none; border-radius:15px; padding:13px 20px; font:inherit;
      font-size:16px; font-weight:900; color:${colore}; background:${sfondo};
      box-shadow:0 5px 0 ${ombra}; cursor:pointer`
    b.addEventListener('click', fai)
    return b
  }
  riga.append(
    tasto('↻ Riprova', 'linear-gradient(180deg,#ffd166,#f4a261)', '#c9803f', '#5a3200',
          () => location.reload()),
    tasto('🔧 Ripara', '#ffffffdd', '#d4dce6', '#4b3f72', ripara))

  const dettaglio = document.createElement('small')
  dettaglio.dataset.che = 'dettaglio'
  dettaglio.textContent = testo
  dettaglio.style.cssText = `font-size:11px; opacity:.55; word-break:break-word;
    max-width:36ch; line-height:1.35`

  const chiudi = document.createElement('button')
  chiudi.textContent = 'chiudi e continua'
  chiudi.style.cssText = `border:none; background:none; font:inherit; font-size:12px;
    color:#6b6480; opacity:.7; text-decoration:underline; padding:4px; cursor:pointer`
  chiudi.addEventListener('click', () => { fuori.remove(); appeso = null })

  dentro.append(riga, dettaglio, chiudi)
  fuori.append(dentro)
  document.body.append(fuori)
  appeso = fuori
}

/* ═══════════ l'aggancio ═══════════
   Tre strade portano qui: quello che lancia dentro Vue (render, computed,
   gestori di eventi), quello che lancia fuori, e le promesse rifiutate
   che nessuno ha raccolto. La versione arriva da fuori perché questo
   file non deve sapere niente del build. */
export function installa (app, opzioni = {}) {
  versione = opzioni.versione || ''
  if (app) {
    app.config.errorHandler = (err, chi, info) => {
      registra(info || 'vue', err)
      /* si scrive anche in console: chi ha il cavo attaccato vuole la
         pila intera, non le quattro righe che stanno nell'archivio */
      console.error(err)
    }
  }
  if (typeof window === 'undefined') return
  window.addEventListener('error', e => {
    /* un'immagine che non carica passa di qui senza `error`: non è un
       guasto da cartello, è una figura mancante */
    if (!e.error) return
    registra('finestra', e.error)
  })
  window.addEventListener('unhandledrejection', e => registra('promessa', e.reason))
}
