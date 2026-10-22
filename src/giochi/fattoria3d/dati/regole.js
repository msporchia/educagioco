/* I numeri delle regole che non stanno altrove: quanto costa muovere, la terra, i tempi delle pecore (la mongolfiera ha i suoi numeri in dati/mongolfiera.js).
   Il perché di ognuno è in docs/fattoria3d/regole.md. Niente si vende: il verso è sempre monete → cose. */
import { bestia2d, msDaMinuti, PREZZO_PIAZZOLA, RINCARO, CELLE, PIAZZOLE_INIZIALI } from './parita2d.js'

export const COSTI = {
  spostare: 1,        // un pezzo spostato o rimesso nel magazzino: la fattoria non è un tavolino dove si sposta per ore
  strada: 1,          // a pezzo
  lottoEsperienzaMax: 680,   // quanta esperienza dà un lotto al massimo (il prezzo dell'ultimo lotto di una volta): la terra cara non salta i livelli
  albero: 3,          // un colpo d'ascia: tre monete (30 s di esercizio); la legna non c'è, il prato si libera e basta
  ostacolo: 1,        // un sasso o un cespuglio tolto
}

// ── la terra: il prezzo della 2D, contato sulle celle ──
// La 2D vende piazzole da 6×6 celle: 🪙45 la prima oltre le nove di partenza, poi ×1,38 a ogni acquisto. La 3D vende lotti da 4×4. Si pareggia la
// QUANTITÀ di terra (decisione dell'utente, docs/fattoria3d/parita/decisioni.md): la stessa terra costa lo stesso, cella per cella, e nel dubbio
// se ne regala un po' di più. Le misure dei pezzi sono quelle di sempre, quindi chi ha tanta terra quanta ne aveva la 2D alla partenza (324 celle,
// nove piazzole) sta sul prezzo da 🪙45 la piazzola; chi ne ha meno (la 3D parte con 144 celle) la paga di meno finché non ha raggiunto quel punto.
// Vedi docs/fattoria3d/terreno.md («Quanta terra, a che prezzo»).
export const TERRA = {
  celleLotto: 16,                                        // 4×4
  lottiDiPartenza: 9,                                    // il quadrato 3×3 nel mezzo
  cellePiazzola: CELLE * CELLE,                          // 36
  celleDiPartenza2D: PIAZZOLE_INIZIALI * CELLE * CELLE,  // 324: la terra con cui comincia un bambino della 2D
  regalo: 1.05,                                          // un po' più di terra a parità di monete: nel conto del prezzo le celle che hai pesano il 5% in meno
}

const prezziLotti = []
/** Il prezzo del lotto che si compra dopo averne comprati `k` (oltre ai nove di partenza): il prezzo di una piazzola 2D (45 · 1,38ⁿ, con n le piazzole
    di terra che hai sopra le nove della 2D) per la parte di piazzola che un lotto rappresenta; mai meno di 🪙1 e sempre più del precedente. */
export function prezzoDelLotto(k) {
  const n = Math.max(0, Math.floor(k))
  while (prezziLotti.length <= n) {
    const i = prezziLotti.length                           // il lotto numero i (da 0): ne hai già i comprati prima di lui
    const celle = (TERRA.lottiDiPartenza + i) * TERRA.celleLotto / TERRA.regalo        // la terra che hai, col regalo (pesa un po' meno: costa un po' meno)
    const piazzole = (celle - TERRA.celleDiPartenza2D) / TERRA.cellePiazzola          // quante piazzole sopra le nove della 2D (negativo all'inizio)
    const grezzo = PREZZO_PIAZZOLA * Math.pow(RINCARO, piazzole) * TERRA.celleLotto / TERRA.cellePiazzola
    const prezzo = Math.max(1, Math.round(grezzo))
    prezziLotti.push(i === 0 ? prezzo : Math.max(prezzo, prezziLotti[i - 1] + 1))
  }
  return prezziLotti[n]
}

/** Quanti lotti nuovi (oltre ai nove) vale una terra 2D con `piazzoleInPiu` piazzole oltre le nove: tutta la terra che aveva, col regalo, rimessa in lotti 3D. */
export function lottiPerPiazzole(piazzoleInPiu) {
  const celle = (PIAZZOLE_INIZIALI + Math.max(0, piazzoleInPiu)) * TERRA.cellePiazzola * TERRA.regalo
  return Math.max(0, Math.ceil(celle / TERRA.celleLotto) - TERRA.lottiDiPartenza)
}

export const PECORE = {
  laneMs: msDaMinuti(bestia2d('recinto').minuti),      // quanto ci mette la lana a rifarsi dal pasto: i minuti della ricetta 2D dell'ovile (8)
  costo: bestia2d('recinto').costo,                  // 🪙 per ogni pecora nutrita dopo la tosa (avviare la ricetta della lana, come in 2D)
  mangia: ['foraggio'],   // come l'ovile della 2D: un foraggio per la lana (il mangime del fienile, non un raccolto)
  pastiPerLana: 1,    // pezzi di foraggio che una tosata vuole per rifarla: dopo la tosa ha fame, come le galline
  max: 4,             // per recinto
  pastiPerCrescere: 2,   // pezzi di foraggio per far crescere un agnello
  pastiPerNascere: 2,    // e per far nascere il prossimo
}

export function guastiDelleRegole() {
  const g = []
  for (const [k, v] of Object.entries(COSTI)) if (!(v >= 0)) g.push(`costo ${k} negativo`)
  for (let k = 1; k < 300; k++) if (!(prezzoDelLotto(k) > prezzoDelLotto(k - 1) && Number.isFinite(prezzoDelLotto(k)))) g.push(`il prezzo del lotto ${k} non sale`)
  if (!(prezzoDelLotto(0) >= 1)) g.push('il primo lotto è gratis')
  // la stessa terra costa come nella 2D: quando hai le 324 celle di partenza della 2D il prezzo del lotto è la sua parte di piazzola da 🪙45
  const k0 = Math.ceil(TERRA.celleDiPartenza2D / (TERRA.celleLotto * TERRA.regalo)) - TERRA.lottiDiPartenza
  const atteso = PREZZO_PIAZZOLA * TERRA.celleLotto / TERRA.cellePiazzola
  if (Math.abs(prezzoDelLotto(k0) - atteso) > atteso * 0.25) g.push(`a ${TERRA.celleDiPartenza2D} celle il lotto costa ${prezzoDelLotto(k0)} e dovrebbe costare circa ${Math.round(atteso)}`)
  if (!(PECORE.max >= 2)) g.push('un recinto deve poter tenere almeno due pecore')
  if (!(PECORE.laneMs >= 60000)) g.push('la lana ricresce in meno di un minuto')
  return g
}
