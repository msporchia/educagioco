/* ═══════════════════════════════════════════════════════════════════
   IL CODICE DEI GENITORI
   Quattro cifre davanti alla schermata che salva, rimette e cancella i
   progressi. Non è sicurezza — chi vuole entrare davvero apre gli
   strumenti del browser — è un gradino contro il tocco distratto e
   contro il bambino che ha visto il codice da sopra la spalla: per
   questo si deve poter cambiare, e prima era scritto nel sorgente.

   Sta nell'archivio accanto a `ultimo-giocatore` e NON dentro i profili:
   è di casa, non di un bambino, e cancellare i progressi di un giocatore
   non deve riportarlo a 0000.
   ═══════════════════════════════════════════════════════════════════ */
import { load, save, flush } from './storage.js'

const CHIAVE = 'pin-genitori'
export const PIN_INIZIALE = '0000'

export const pinValido = p => /^\d{4}$/.test(String(p ?? ''))

/* Il codice dimenticato è l'unico modo di restare chiusi fuori da
   salvataggio e ripristino, e non c'è nessuno a cui chiederlo: si
   rimette dall'indirizzo, `giochi.html#pin=1234`, dove sta già il cheat
   delle monete. Serve la barra dell'indirizzo — dall'app installata sul
   telefono non si scrive — quindi resta una strada da grandi. */
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

export async function scriviPin(nuovo) {
  if (!pinValido(nuovo)) throw new Error('Il codice sono quattro cifre.')
  save(CHIAVE, String(nuovo))
  await flush()          // il codice nuovo non può restare in coda: se il
  return String(nuovo)   // telefono si chiude adesso, domani non si entra
}
