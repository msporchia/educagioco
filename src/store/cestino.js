/* ═══════════════════════════════════════════════════════════════════
   IL CESTINO DEI PROGRESSI

   L'unico danno irreversibile che questa applicazione sa fare è
   cancellare i progressi di un bambino, e non serve nessuno che entri di
   nascosto per farlo: basta il grande stanco che alle undici di sera
   tocca la carta rossa e conferma. Il codice davanti alla schermata non
   protegge da quello — chi cancella è, quasi sempre, chi il codice ce
   l'ha.

   Quindi prima di ogni gesto distruttivo se ne tiene una copia da parte,
   e la schermata dei grandi offre di rimetterla. Da qui in avanti la
   porta può anche essere debole: dietro non c'è più niente che si perda
   per sempre.

   Sta **fuori dai profili**, come il codice dei genitori: una copia
   dentro il profilo che si sta cancellando morirebbe con lui.
   ═══════════════════════════════════════════════════════════════════ */
import { load, save, flush } from './storage.js'

const CHIAVE = 'cestino'

/* Tre e non di più. Un profilo serializzato pesa qualche decina di
   kilobyte e su localStorage — il ripiego, quando IndexedDB non risponde
   — lo spazio è quello che è: tenerne dieci vorrebbe dire far fallire la
   scrittura del profilo vero, che è esattamente il contrario dello scopo.
   Tre coprono il caso reale, che è accorgersene subito. */
const QUANTE = 3

async function elenco() {
  const c = await load(CHIAVE)
  return Array.isArray(c?.voci) ? c.voci : []
}

/* Il profilo si passa da fuori quando il chiamante ne ha in mano uno più
   fresco di quello scritto su disco (`state.profile` lo è quasi sempre:
   `persist()` scrive con qualche centinaio di millisecondi di ritardo).
   Chi non ce l'ha — si sta cancellando un bambino che non sta giocando —
   lo lascia stare e lo si rilegge dall'archivio. */
export async function cestina(id, nome, profilo = null, motivo = '') {
  if (!id) return
  const dati = profilo ? JSON.parse(JSON.stringify(profilo)) : await load('profilo:' + id)
  if (!dati) return                       // niente da salvare: non c'era niente
  const voci = await elenco()
  voci.unshift({ quando: new Date().toISOString(), id, nome: nome || id, motivo, profilo: dati })
  save(CHIAVE, { voci: voci.slice(0, QUANTE) })
  /* `flush()` subito: quello che viene dopo questa riga è una
     cancellazione, e una copia rimasta nei 350 ms di coda non è una
     copia. */
  await flush()
}

/* Per la schermata: le voci senza il grosso, che a schermo non serve e
   in memoria pesa. */
export async function leggiCestino() {
  return (await elenco()).map(({ quando, id, nome, motivo }) => ({ quando, id, nome, motivo }))
}

/* La voce intera — id, nome e profilo — per chi la rimette: il nome
   serve a ricostruire il roster quando il bambino è stato eliminato e
   non c'è più nessuno che sappia come si chiamava. Si riconosce dal
   momento in cui è stata cestinata: due copie dello stesso bambino nello
   stesso millisecondo non esistono. */
export async function voceCestinata(quando) {
  return (await elenco()).find(v => v.quando === quando) || null
}

/* Rimettere non consuma: se il ripristino va storto — file sbagliato,
   bambino sbagliato — la copia dev'essere ancora lì. Si toglie solo
   quando esce dalla finestra delle tre. */
export async function svuotaCestino() {
  save(CHIAVE, { voci: [] })
  await flush()
}
