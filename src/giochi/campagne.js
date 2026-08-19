/* ═══════════════════════════════════════════════════════════════════
   L'AVANZAMENTO DEI GIOCHI NUOVI — UN POSTO SOLO

   I giochi vecchi hanno ognuno il suo campo nel profilo (`td`, `mate`,
   `calc`, `eng`, `esp`, `mercato`, `lab`, `gen`) e ognuno la sua funzione
   per scriverlo: otto volte la stessa cosa, e ogni gioco nuovo era una
   migrazione in più. Qui i giochi nuovi tengono tutto sotto
   `profile.campagne[<chiave>]`, con una forma sola:

       { tappa: 0, libera: false, stelle: {}, cfg: {} }

     tappa    quante tappe sono state superate = l'indice della prossima
     libera   la campagna è finita: il gioco libero è aperto
     stelle   il PRIMATO per tappa (non la somma): rigiocare non gonfia
     cfg      quello che il bambino ha scelto e va ricordato

   Il record si tiene sempre al meglio: una partita storta non toglie la
   stella già guadagnata. È l'unica regola con cui un bambino va d'accordo.

   Questo file è il solo punto in cui un gioco nuovo tocca il profilo, e i
   giochi lo raggiungono da `Gioco.vue`: se domani il profilo cambia forma
   si cambia qui, e nessun gioco se ne accorge.
   ═══════════════════════════════════════════════════════════════════ */
import { state, persist, flushNow, tappaAperta } from '../store/profile.js'
import { tappaApertaQui } from '../data/portata-giochi.js'

const VUOTA = () => ({ tappa: 0, libera: false, stelle: {}, cfg: {} })

/* Il record si crea al volo. Un profilo salvato ieri non ha `campagne` e
   non deve avere bisogno di una migrazione per giocare a un gioco che
   ieri non c'era: la forma la mette a posto chi legge. */
export function progresso(chiave) {
  const p = state.profile
  if (!p.campagne || typeof p.campagne !== 'object') p.campagne = {}
  const c = p.campagne[chiave]
  if (!c || typeof c !== 'object') return (p.campagne[chiave] = VUOTA())
  if (typeof c.tappa !== 'number') c.tappa = 0
  if (!c.stelle || typeof c.stelle !== 'object') c.stelle = {}
  if (!c.cfg || typeof c.cfg !== 'object') c.cfg = {}
  return c
}

/* Una tappa è aperta se è la prossima o una già fatta — oppure se i
   genitori hanno tolto i lucchetti a tutto (`tuttoAperto`). La regola sta
   in `profile.js` e passa da lì apposta: quando stava in cinque posti si
   è scollata senza che nessuno se ne accorgesse. */
/* E da quando ogni tappa dice la sua `portata`, il lucchetto guarda
   anche l'età: quello che il bambino ha già passato nasce aperto, quello
   che gli sta troppo avanti resta chiuso. Passa da qui e non dai singoli
   giochi per la stessa ragione di sempre — sette copie della stessa riga
   si scollano. */
export const aperta = (chiave, indice) => tappaApertaQui(chiave, indice, progresso(chiave).tappa)

export const stelleDi = (chiave, indice) => progresso(chiave).stelle[indice] || 0

export const stelleInTutto = chiave =>
  Object.values(progresso(chiave).stelle).reduce((n, s) => n + s, 0)

/* Una tappa portata a casa. `quante` è la lunghezza della campagna: finita
   l'ultima si apre il gioco libero, che non chiude più. */
export function completa(chiave, indice, quante, { stelle = 0 } = {}) {
  const c = progresso(chiave)
  c.tappa = Math.max(c.tappa || 0, indice + 1)
  if (c.tappa >= quante) c.libera = true
  if (stelle > (c.stelle[indice] || 0)) c.stelle[indice] = stelle
  persist()
  flushNow()     // una tappa si vince di rado: non deve perdersi
  return c
}

/* Le scelte del bambino che vanno ricordate fra una sera e l'altra: la
   difficoltà del gioco libero, il tema, quello che sarà. Non sono
   impostazioni dei genitori — quelle stanno in `settings`. */
export const scelta = (chiave, campo, seNiente = null) => {
  const v = progresso(chiave).cfg[campo]
  return v === undefined ? seNiente : v
}

/* Ricominciare un gioco da capo, e **solo quello**: i progressi degli
   altri, le monete e i traguardi restano dove sono. Serve soprattutto
   ai giochi ancora in prova, dove la forma dei dati cambia e ripartire
   puliti è più onesto che portarsi dietro un salvataggio di ieri fatto
   in un altro modo.

   Non rimborsa niente. Sembra duro e non lo è: se restituisse le monete
   spese, ricominciare diventerebbe il modo più rapido di farsele
   ridare — si compra, si azzera, si ricompra. Sta scritto nel cartello
   che chiede conferma, così chi tocca il tasto lo sa prima. */
export function azzeraCampagna(chiave) {
  const p = state.profile
  if (p.campagne) delete p.campagne[chiave]
  persist()
  flushNow()
  return true
}

/* ═══════════ una partita lasciata a metà ═══════════
   Certi giochi durano più di una seduta — una discesa del sotterraneo è
   venti minuti e quaranta domande — e chiuderli voleva dire buttarli
   via. La sosta è **quello che serve a rimettere in piedi la partita di
   ieri sera**, e sta accanto all'avanzamento perché è dello stesso
   genere: roba di questo bambino su questo gioco.

   Il formato lo decide il gioco e questo file non lo guarda mai: qui si
   tiene un oggetto e basta. Chi lo scrive ci mette dentro la sua
   versione e butta quello che non sa più leggere (`motore/sosta.js` nel
   sotterraneo).

   Una sosta per gioco, non una per tappa: due discese a metà in due
   posti diversi sono una cosa che nessun bambino ha in testa, e
   sceglierne una diventerebbe una schermata in più. */
export const sosta = chiave => progresso(chiave).sosta || null

export function salvaSosta(chiave, dato, { subito = false } = {}) {
  const c = progresso(chiave)
  if (!dato) delete c.sosta
  else c.sosta = dato
  persist()
  /* Alla chiusura non basta il salvataggio pigro: la pagina può sparire
     prima che scatti, ed è **proprio il caso** per cui la sosta esiste. */
  if (subito) flushNow()
  return dato
}

export const buttaSosta = chiave => salvaSosta(chiave, null, { subito: true })

export const haGiocato = chiave => {
  const c = state.profile.campagne
  return !!(c && c[chiave])
}

export function ricorda(chiave, campo, valore) {
  progresso(chiave).cfg[campo] = valore
  persist()
  return valore
}
