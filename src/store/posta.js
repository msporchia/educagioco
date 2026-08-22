/* ═══════════════════════════════════════════════════════════════════
   LA POSTA DEI GRANDI — cosa si è letto e cosa no

   Il contenuto sta in `guide/novita.js`, che è dato puro e spiega la
   regola per cui una nota si scrive. Qui c'è solo la memoria: fin dove
   si è letto, e quanto resta da leggere.

   Sta **fuori dai profili**, come il codice dei genitori e come il
   cestino: la posta è di casa, non di un bambino, e cambiando giocatore
   non deve ricomparire.

   L'ACK È UN ID, NON UNA VERSIONE. Il gioco si ripubblica venti volte e
   diciannove non hanno niente da dire; legare il pallino alla versione
   lo accenderebbe ogni volta, e un pallino che si accende sempre non lo
   guarda più nessuno. Ricordando l'ultimo id letto, invece, chi salta
   tre versioni trova le tre note che si è perso — la differenza rispetto
   a quello che conosceva viene da sé.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'
import { load, save, flush, chiavi } from './storage.js'
import { NOTE, ULTIMA } from '../guide/novita.js'

const CHIAVE = 'note-lette'
const AVVISI = 'posta-avvisi'
/* quali avvisi «una volta sola» sono già stati scritti: sta a parte
   dagli avvisi perché quelli si buttano leggendoli, e questo no — se
   sparisse col «Ho letto», la stessa tipologia che continua ad andare
   male riscriverebbe la stessa riga il giorno dopo, e un avviso che
   torna sempre è un avviso che non si legge più */
const DETTI = 'posta-detti'

/* Quante ce ne sono da leggere: lo guardano il nastro in home e il
   pallino sul tasto delle impostazioni. */
export const daLeggere = ref(0)

/* dentro un oggetto, come tutto il resto: `load()` scarta il `true`
   scritto da solo (vedi `store/storage.js`) */
const leggiSegno = async () => (await load(CHIAVE))?.id
const leggiAvvisi = async () => (await load(AVVISI))?.voci || []

/* Le età dei bambini di casa, per le note che ne dichiarano una. Si
   enumerano le chiavi dei profili invece di guardare il roster: un
   profilo orfano è comunque un bambino che gioca. */
async function etaInCasa() {
  const eta = []
  for (const k of await chiavi('profilo:')) {
    const e = (await load(k))?.settings?.eta
    if (typeof e === 'number') eta.push(e)
  }
  return eta
}

/* ── quali note restano ──
   Pura e provata a parte (`test/unita/posta`), perché è la regola e non
   il contenuto: le note vere cambiano, questa no.

   Senza nessuna età conosciuta una nota mirata si mostra lo stesso: non
   sapere non è un motivo per nascondere. Le più fresche in cima. */
export function scegli(note, segno, eta = []) {
  const daQui = typeof segno === 'number' ? segno : 0
  return note
    .filter(n => n.id > daQui)
    .filter(n => {
      if (!n.riguarda || !eta.length) return true
      const { etaDa = -Infinity, etaA = Infinity } = n.riguarda
      return eta.some(e => e >= etaDa && e <= etaA)
    })
    .sort((a, b) => b.id - a.id)
}

/* Tutto quello che c'è da leggere: le note dichiarate più gli avvisi che
   il gioco si è scritto da solo (per adesso uno: il codice rimesso a
   0000, che il grande deve poter scoprire anche se non è stato lui). */
export async function laPosta() {
  const note = scegli(NOTE, await leggiSegno(), await etaInCasa())
  return { note, avvisi: await leggiAvvisi() }
}

async function ricalcola() {
  const { note, avvisi } = await laPosta()
  daLeggere.value = note.length + avvisi.length
  return daLeggere.value
}

/* Chiamata all'avvio, dopo `profile.init()`: l'archivio dev'essere già
   quello vero, perché la prima volta si decide guardandolo.

   Se il segno non c'è ancora ci sono due casi diversi, e distinguerli
   non costa nessuno stato in più: **se in casa non c'è nemmeno un
   profilo** è un'installazione appena fatta, e le note vecchie non la
   riguardano — si parte da `ULTIMA`. Se invece i profili ci sono, è una
   casa che giocava già prima che la posta esistesse: quelle note non le
   ha mai viste, e le vede adesso. */
export async function initPosta() {
  if (typeof await leggiSegno() !== 'number') {
    const vergine = (await chiavi('profilo:')).length === 0
    save(CHIAVE, { id: vergine ? ULTIMA : 0 })
    await flush()
  }
  return ricalcola()
}

/* «Ho letto»: alza il segno all'ultima nota esistente e butta gli
   avvisi, che sono fatti singoli e non hanno motivo di restare. Uno
   solo, perché è un gesto solo: chi legge la posta la legge tutta. */
export async function segnaLetta() {
  save(CHIAVE, { id: ULTIMA })
  save(AVVISI, { voci: [] })
  await flush()
  return ricalcola()
}

/* Un fatto capitato su questo telefono, che il grande deve sapere anche
   se non c'era. Non è una nota di `novita.js`: quelle le scrivo io
   prima, questi capitano dopo.

   `azione` è facoltativa e ha la stessa forma di quella delle note —
   `{ testo, scheda }` — perché un avviso che dice «guarda questa cosa»
   senza portarci è metà avviso. */
export async function avvisa(testo, azione = null) {
  const voci = await leggiAvvisi()
  voci.unshift({ quando: new Date().toISOString(), testo, azione })
  save(AVVISI, { voci: voci.slice(0, 10) })
  await flush()
  return ricalcola()
}

/* ── LO STESSO AVVISO, MA UNA VOLTA SOLA ──────────────────────────
   Serve a chi si accorge di un fatto **mentre succede** e continuerà ad
   accorgersene: una tipologia di domande che va male non va male una
   volta, va male per settimane, e un avviso a ogni risposta sbagliata
   riempirebbe la posta di dieci righe uguali.

   La `chiave` è quella del fatto, non del testo: chi la sceglie la fa
   contenere **il bambino** (`g2:orto:doppie`), o due fratelli che
   inciampano nella stessa cosa si toglierebbero l'avviso a vicenda.
   Torna `true` se ha scritto davvero, così chi chiama può dirlo. */
export async function avvisaUnaVolta(chiave, testo, azione = null) {
  if (!chiave) return false
  const detti = (await load(DETTI))?.voci || []
  if (detti.includes(chiave)) return false
  /* al massimo duecento: sono stringhe corte, e la memoria di cosa si è
     già detto non ha motivo di crescere all'infinito */
  save(DETTI, { voci: [chiave, ...detti].slice(0, 200) })
  await avvisa(testo, azione)
  return true
}
