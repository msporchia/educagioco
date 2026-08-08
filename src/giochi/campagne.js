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
export const aperta = (chiave, indice) => tappaAperta(indice, progresso(chiave).tappa)

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

export function ricorda(chiave, campo, valore) {
  progresso(chiave).cfg[campo] = valore
  persist()
  return valore
}
