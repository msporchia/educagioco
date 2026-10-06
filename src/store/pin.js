// Il codice dei genitori, non sicurezza: vedi docs/genitori/codice.md.
import { load, save, flush } from './storage.js'

const CHIAVE = 'pin-genitori'
export const PIN_INIZIALE = '0000'

export const pinValido = p => /^\d{4}$/.test(String(p ?? ''))

// #pin=1234 nell'indirizzo, dove sta già il cheat delle monete
function daIndirizzo() {
  if (typeof location === 'undefined') return null
  const m = (location.hash || '').match(/pin=(\d{4})\b/)
  return m ? m[1] : null
}

export async function leggiPin() {
  const forzato = daIndirizzo()
  if (forzato) { await scriviPin(forzato); return forzato }
  const p = await load(CHIAVE)
  return pinValido(p) ? String(p) : PIN_INIZIALE
}

export const DOMANDA = {
  testo: 'In che anno è nata l\'Italia unita?',
  risposta: '1861'
}

export const rispostaGiusta = r => String(r ?? '') === DOMANDA.risposta

export async function azzeraPin() {
  return scriviPin(PIN_INIZIALE)
}

export async function scriviPin(nuovo) {
  if (!pinValido(nuovo)) throw new Error('Il codice sono quattro cifre.')
  save(CHIAVE, String(nuovo))
  await flush()          // subito: se il telefono si chiude adesso, domani non si entra
  return String(nuovo)
}

// l'attesa dopo uno sbaglio: in memoria e non in archivio, apposta (una
// ricarica la azzera, ma ricaricare è già un gesto da grandi)
const ATTESE = [3000, 10000, 30000]
let sbagli = 0
let liberoDa = 0
let ultima = 0

export function segnaSbaglio(ora = Date.now()) {
  ultima = ATTESE[Math.min(sbagli, ATTESE.length - 1)]
  sbagli++
  liberoDa = ora + ultima
  return ultima
}

export function azzeraSbagli() { sbagli = 0; liberoDa = 0; ultima = 0 }

export const attesa = (ora = Date.now()) =>
  ({ resta: Math.max(0, liberoDa - ora), quanto: ultima })

// cosa aprire appena entrati col codice: «aggiungi un bambino» dal profilo
// chiede il codice e poi apre l'aggiunta (docs/core/home.md, «Il profilo»)
let dopoIlCodice = null
export const chiediDopoIlCodice = cosa => { dopoIlCodice = cosa }
export function cosaDopoIlCodice() { const c = dopoIlCodice; dopoIlCodice = null; return c }
