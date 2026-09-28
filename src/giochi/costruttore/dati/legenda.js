/* ═══════════════════════════════════════════════════════════════════
   LA LEGENDA DELLE MAPPE — un carattere per cella

   Il cantiere si vede di lato, come una fetta di terra: il sopra è il
   cielo, il sotto è il suolo. Una mappa è un elenco di righe, dall'alto
   in basso, e ogni carattere è una cella:

     .   aria
     #   terreno (erba sopra, terra sotto): solido, non ci si mette niente
     ~   acqua: non regge nessuno, ma un mattone ci si posa e la riempie
     @   da qui parte il robot (la cella è aria)
     P   da qui parte l'omino che prova la costruzione (aria)
     F   la bandiera dove l'omino deve arrivare (aria)
     r   minuscola: qui ci va un mattone di quel colore (il disegno)
     R   maiuscola: qui c'è già un mattone di quel colore

   Le lettere dei colori stanno in `dati/colori.js`. Una lettera che non
   è in legenda è un guasto, non un'aria: una mappa scritta male deve
   diventare rossa in un test, non un buco sul telefono.
   ═══════════════════════════════════════════════════════════════════ */
import { COLORE_DI_LETTERA, CHIAVI_COLORI } from './colori.js'
import { COSE } from './scrivi.js'

export const SIMBOLI = {
  '.': { suolo: 'aria' },
  '#': { suolo: 'terreno' },
  '~': { suolo: 'acqua' },
  '@': { suolo: 'aria', robot: true },
  'P': { suolo: 'aria', omino: true },
  'F': { suolo: 'aria', bandiera: true },
}

/* Cosa c'è in una cella, letto da un carattere. `null` se il carattere
   non vuol dire niente. */
export function leggiSimbolo(c) {
  if (SIMBOLI[c]) return SIMBOLI[c]
  const min = COLORE_DI_LETTERA[c]
  if (min) return { suolo: 'aria', bersaglio: min }
  const mai = COLORE_DI_LETTERA[c.toLowerCase()]
  if (mai && c !== c.toLowerCase()) return { suolo: 'aria', fisso: mai }
  return null
}

/* ── quello che il robot può guardare, in un livello ──
   Una domanda chiede di **tutto quello che c'è nelle mappe**, non solo
   dei colori della pulsantiera: quella dice cosa il robot sa *mettere*.
   In «Sui mattoni rossi» si mette solo il giallo, e la domanda è «c'è un
   mattone rosso?» — coi colori della pulsantiera il rosso non si poteva
   scegliere, e il livello non si vinceva. Le cose seguono la stessa
   regola: l'acqua si offre solo dove c'è. */
export function quelloCheSiGuarda(livello) {
  const colori = new Set(livello.colori || [])
  let acqua = false
  for (const o of livello.ordini || [])
    for (const riga of o.mappa || [])
      for (const c of riga) {
        const s = leggiSimbolo(c)
        if (!s) continue
        if (s.bersaglio) colori.add(s.bersaglio)
        if (s.fisso) colori.add(s.fisso)
        if (s.suolo === 'acqua') acqua = true
      }
  return {
    colori: CHIAVI_COLORI.filter(c => colori.has(c)),
    cose: COSE.filter(c => c !== 'acqua' || acqua),
  }
}

/* **Confrontare due numeri serve solo dove un numero cambia**: una
   lavagnetta del bambino, o la misura di un progetto. La lavagnetta
   dell'ordine da sola non basta — «lungo è maggiore di 5» ha la stessa
   risposta per tutto il programma — e da quando i livelli del «se»
   hanno «lungo» il ⚖️ compariva lì, una domanda in più da scartare. */
export const siConfronta = livello =>
  (livello.cassetta || []).includes('assegna') || livello.misure === true
