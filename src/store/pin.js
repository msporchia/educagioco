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

/* ═══════════════════════════════════════════════════════════════════
   IL CODICE DIMENTICATO
   Il grande che sceglie un codice e non se lo ricorda è chiuso fuori dai
   progressi di casa, e non c'è nessuno a cui chiederlo: niente server,
   niente indirizzo di posta, e chi ha scaricato il gioco non lo conosce
   nessuno. La strada che c'era — `#pin=1234` nella barra dell'indirizzo
   — resta ma non conta: dall'app installata sul telefono la barra
   dell'indirizzo non esiste, e va detto che sono pochi i grandi che
   saprebbero usarla comunque.

   Quindi una domanda: un fatto che si impara dopo le elementari, con
   una risposta di quattro cifre — così si riusa il tastierino che c'è
   già, sbagliare costa la stessa attesa di un codice sbagliato, e non
   c'è niente di nuovo da imparare per nessuno.

   NON È SICUREZZA, e non prova a esserlo: la risposta sta su internet, e
   un bambino che ci arriva la trova. È una scelta — meglio un genitore
   autonomo che una porta blindata su una stanza dove, da quando c'è
   `store/cestino.js`, non si perde più niente per sempre. Se un bambino
   ci entra, lo scopre il grande dalla posta di `guide/novita.js` e se la
   vede in famiglia.
   ═══════════════════════════════════════════════════════════════════ */
export const DOMANDA = {
  testo: 'In che anno è nata l\'Italia unita?',
  risposta: '1861'
}

export const rispostaGiusta = r => String(r ?? '') === DOMANDA.risposta

/* Rimette il codice di partenza. Non entra da sé: chi la chiama è la
   schermata, che subito dopo chiede di sceglierne uno nuovo — lasciare
   una casa con `0000` è come non averlo mai avuto. */
export async function azzeraPin() {
  return scriviPin(PIN_INIZIALE)
}

export async function scriviPin(nuovo) {
  if (!pinValido(nuovo)) throw new Error('Il codice sono quattro cifre.')
  save(CHIAVE, String(nuovo))
  await flush()          // il codice nuovo non può restare in coda: se il
  return String(nuovo)   // telefono si chiude adesso, domani non si entra
}

/* ═══════════════════════════════════════════════════════════════════
   L'ATTESA DOPO UNO SBAGLIO
   Il codice non è mai stato il problema: il problema è che provarlo
   costava zero. Un tastierino che reagisce a ogni tentativo — i pallini
   che si riempiono, «Codice sbagliato» in rosso — è un minigioco
   «indovina il codice», e la reazione è il premio che fa tornare. I
   bambini non entravano: ci provavano, ed era divertente.

   Quindi il primo sbaglio costa tre secondi, il secondo dieci, dal terzo
   in poi trenta, con una barretta che si riempie perché due secondi muti
   sono indistinguibili da un tasto rotto (è la stessa regola della
   finestra cieca a inizio schermata). Un tentativo che costa mezzo
   minuto smette di essere un gioco dopo due giri, e per traverso chiude
   anche la provata a tappeto su 1234 e 0000.

   Il conto sta qui e non dentro la schermata perché uscire e rientrare
   non deve azzerarlo — un `ref` in un componente muore col componente.
   In archivio non ci va di proposito: una ricarica lo butta, ma
   ricaricare il gioco è già un gesto da grandi e costa più dell'attesa.
   ═══════════════════════════════════════════════════════════════════ */
const ATTESE = [3000, 10000, 30000]
let sbagli = 0
let liberoDa = 0
let ultima = 0

/* quanto dura l'attesa appena scattata, in millisecondi */
export function segnaSbaglio(ora = Date.now()) {
  ultima = ATTESE[Math.min(sbagli, ATTESE.length - 1)]
  sbagli++
  liberoDa = ora + ultima
  return ultima
}

/* si azzera solo entrando: sbagliare quattro volte e poi indovinare non
   deve lasciare in eredità l'attesa lunga al grande che entra domani */
export function azzeraSbagli() { sbagli = 0; liberoDa = 0; ultima = 0 }

/* `resta` è quanto manca, `quanto` quanto durava in tutto: la barretta
   ha bisogno di tutti e due, e nessuno dei due lo sa la schermata */
export const attesa = (ora = Date.now()) =>
  ({ resta: Math.max(0, liberoDa - ora), quanto: ultima })
