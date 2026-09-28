/* Il ponte fra un gioco e i moduli: un gioco non nomina mai un modulo, dice
   solo una difficoltà 0..1 e riceve una domanda pronta. Si pesca una
   classe (coppia modulo+grado), non un modulo — provato il contrario:
   metteva sempre lo stesso grado in mostra. Saperi spenti ed età tagliano
   il mazzo, il ripasso pesa poco (banda stretta, nucleo/bisogno.js). Vedi
   docs/apprendimento/quiz-moduli.md e quiz-livelli.md. */

import { MODULI, perId } from './nucleo/registro.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { classiDi, pescaClasse } from './nucleo/classi.js'
import { ilBisogno } from './memoria.js'
import { saperiSpenti, regoleDomande } from '../store/profile.js'

// un gioco può restringere il campo (materie: ['matematica', 'spazio']); senza filtro entrano tutte
export const MATERIE = ['italiano', 'matematica', 'spazio', 'tempo', 'logica', 'scienze']

// da 0..1 al grado di quel modulo; se il grado chiede saperi spenti si scende al grado buono più vicino
export function gradoPer(modulo, difficolta = 0, spenti = [], regole = null) {
  const g = Math.max(1, Math.min(modulo.gradi, Math.round(1 + (difficolta || 0) * (modulo.gradi - 1))))
  return (spenti.length || regole) ? (modulo.gradoVicino(g, spenti, regole) ?? g) : g
}

export function classiAmmesse({ materie, moduli, spenti = [], difficolta = 0,
                                bisogno = null, regole = null } = {}) {
  const buoni = moduliAmmessi({ materie, moduli, spenti })
  const restano = classiDi(buoni, { spenti, difficolta, bisogno, regole })
  // spento tutto non si resta senza domande: un gioco senza domanda è rotto, una domanda che non sa fare no
  if (restano.length) return restano
  // fuori età nemmeno: si riapre tutto, un'età scritta storta è un errore nostro, non un gioco che si pianta
  const senzaEta = classiDi(buoni, { spenti, difficolta, bisogno })
  return senzaEta.length ? senzaEta : classiDi(buoni, { difficolta, bisogno })
}

export function moduliAmmessi({ materie, moduli, spenti = [] } = {}) {
  // il registro si riempie con import.meta.glob (Vite): in un test Node la lista è vuota
  if (!MODULI.length) throw new Error(
    'nessun modulo di quiz: `src/quiz/scelta.js` gira solo sotto Vite — ' +
    'in Node importa il modulo che ti serve da `src/quiz/moduli/`')
  let buoni = MODULI
  if (moduli?.length) buoni = buoni.filter(m => moduli.includes(m.id))
  if (materie?.length) buoni = buoni.filter(m => materie.includes(m.materia))
  // un modulo senza quei saperi non ha più un grado da chiedere ed esce dal mazzo; se resta vuoto si torna a tutti
  const conSaperi = spenti.length ? buoni.filter(m => m.gradiLiberi(spenti).length) : buoni
  if (conSaperi.length) return conSaperi
  return buoni.length ? buoni : MODULI
}

// evita è l'id del modulo appena uscito: due domande di fila dello stesso modulo sembrano un'interrogazione
export function domandaPerGioco({
  difficolta = 0, materie, moduli, evita, sorte = sorteQualunque(),
  spenti = saperiSpenti(), bisogno = ilBisogno(), regole = regoleDomande(),
} = {}) {
  const tutte = classiAmmesse({ materie, moduli, spenti, difficolta, bisogno, regole })
  const senzaLUltimo = evita ? tutte.filter(c => c.modulo.id !== evita) : tutte
  const { modulo, grado } = pescaClasse(sorte, senzaLUltimo.length ? senzaLUltimo : tutte)
  return {
    domanda: modulo.chiedi(grado, sorte, spenti, bisogno, regole),
    pittori: modulo.pittori,
    modulo: modulo.id,
    nome: modulo.nome,
    icona: modulo.icona,
    materia: modulo.materia,
    grado,
  }
}

// comodità per chi vuole una materia per forza (il dungeon con la stanza di matematica): id già deciso
export function domandaDa(id, { difficolta = 0, sorte = sorteQualunque(),
                                spenti = saperiSpenti(), bisogno = ilBisogno(),
                                regole = regoleDomande() } = {}) {
  const modulo = perId(id)
  if (!modulo || !modulo.gradiLiberi(spenti).length)
    return domandaPerGioco({ difficolta, sorte, spenti, bisogno, regole })
  // l'età qui NON taglia: chi chiede un modulo per nome lo vuole, meglio il suo grado più vicino che la materia sbagliata
  const { grado } = pescaClasse(sorte,
    classiAmmesse({ moduli: [id], spenti, difficolta, bisogno,
                    regole: regole ? { ...regole, eta: null } : null }))
  return {
    domanda: modulo.chiedi(grado, sorte, spenti, bisogno, regole),
    pittori: modulo.pittori,
    modulo: modulo.id, nome: modulo.nome, icona: modulo.icona,
    materia: modulo.materia, grado,
  }
}
