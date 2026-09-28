// Il libretto degli incidenti: vedi docs/core/guasti.md.
import { load, save, flush } from './store/storage.js'

const CHIAVE = 'incidenti'
const QUANTI = 8       // gli ultimi: il primo di stamattina conta meno dell'ultimo di adesso
const PER_VOLTA = 3    // un errore nel giro di disegno si ripete 60 volte al secondo

let scritti = 0
let visti = new Set()
let versione = ''

// uno stesso guasto che si ripete non occupa otto righe: si tiene l'ultima volta e si conta quante
export function aggiungi (lista, voce, quanti = QUANTI) {
  const prima = Array.isArray(lista) ? lista.filter(v => v && typeof v === 'object') : []
  const gemello = prima.findIndex(v => v.testo === voce.testo && v.dove === voce.dove)
  const conto = gemello >= 0 ? (prima[gemello].volte || 1) + 1 : 1
  const senza = gemello >= 0 ? prima.filter((_, i) => i !== gemello) : prima
  return [...senza, { ...voce, volte: conto }].slice(-quanti)
}

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

// non aspetta nessuno (un gestore d'errore non deve attendere), ma flush() sì: dopo un crash spesso non arriva
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

// non tocca IndexedDB né localStorage: tutta la differenza con «cancella i dati del sito»
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
  try { location.hash = '' } catch (x) { /* pazienza */ }   // prima di ricaricare, se no riparerebbe all'infinito
  location.reload()
}

export function riparaSeChiesto () {
  if (typeof location === 'undefined') return false
  if (!/(^#?|&)ripara(&|$)/.test(location.hash || '')) return false
  ripara()
  return true
}

// il cartello: ne compare uno solo, un secondo errore aggiorna quello che c'è già invece di impilarsi
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
    <b style="font-size:20px">Qui si è rotto qualcosa</b>
    <p style="margin:0; font-size:15px; line-height:1.4">
      Non è colpa tua e non hai perso niente: quello che hai imparato è
      al sicuro.</p>`

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
    tasto('⤓ Riscarica il gioco', '#ffffffdd', '#d4dce6', '#4b3f72', ripara))

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

// tre strade: dentro Vue, fuori Vue, promesse rifiutate. La versione arriva
// da fuori perché questo file non sa niente del build.
export function installa (app, opzioni = {}) {
  versione = opzioni.versione || ''
  if (app) {
    app.config.errorHandler = (err, chi, info) => {
      registra(info || 'vue', err)
      console.error(err)   // anche in console: chi ha il cavo attaccato vuole la pila intera
    }
  }
  if (typeof window === 'undefined') return
  window.addEventListener('error', e => {
    if (!e.error) return   // un'immagine che non carica passa di qui senza `error`
    registra('finestra', e.error)
  })
  window.addEventListener('unhandledrejection', e => registra('promessa', e.reason))
}
