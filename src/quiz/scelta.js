/* Il ponte fra un gioco e i moduli: un gioco non nomina mai un modulo, dice
   solo una difficoltà 0..1 e riceve una domanda pronta. Si pesca una
   classe (coppia modulo+grado), non un modulo — provato il contrario:
   metteva sempre lo stesso grado in mostra. Saperi spenti ed età tagliano
   il mazzo, il ripasso pesa poco (banda stretta, nucleo/bisogno.js). Vedi
   docs/apprendimento/quiz-moduli.md e quiz-livelli.md. */

import { MODULI } from './nucleo/registro.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { classiDi, pescaClasse } from './nucleo/classi.js'
import { ilBisogno } from './memoria.js'
import { saperiSpenti, regoleDomande } from '../store/profile.js'

// un gioco può restringere il campo (materie: ['matematica', 'spazio']); senza filtro entrano tutte
export const MATERIE = ['italiano', 'matematica', 'spazio', 'tempo', 'logica', 'scienze', 'inglese']

// da 0..1 al grado di quel modulo; se il grado chiede saperi spenti si scende al grado buono più vicino
export function gradoPer(modulo, difficolta = 0, spenti = [], regole = null) {
  const g = Math.max(1, Math.min(modulo.gradi, Math.round(1 + (difficolta || 0) * (modulo.gradi - 1))))
  return (spenti.length || regole) ? (modulo.gradoVicino(g, spenti, regole) ?? g) : g
}

// `elenco` è il registro: si passa solo nei test Node, dove import.meta.glob non c'è
export function classiAmmesse({ materie, moduli, tipi, grado, spenti = [], difficolta = 0,
                                bisogno = null, regole = null, elenco = MODULI } = {}) {
  const buoni = moduliAmmessi({ materie, moduli, tipi, spenti, elenco })
  const restano = classiDi(buoni, { spenti, difficolta, bisogno, regole })
  // spento tutto non si resta senza domande: un gioco senza domanda è rotto, una domanda che non sa fare no
  if (restano.length) return alGrado(restano, grado)
  // fuori età nemmeno: si riapre tutto, un'età scritta storta è un errore nostro, non un gioco che si pianta
  const senzaEta = classiDi(buoni, { spenti, difficolta, bisogno })
  return alGrado(senzaEta.length ? senzaEta : classiDi(buoni, { difficolta, bisogno }), grado)
}

// un grado preciso (1..N) invece della campana attorno alla difficoltà: per ogni modulo il grado chiesto, o il più alto sotto di lui
// se è chiuso (età, saperi spenti: mai si sale), o il più basso se sotto non resta niente
function alGrado(classi, grado) {
  if (!(grado >= 1)) return classi
  const g = Math.round(grado)
  const out = []
  for (const m of new Set(classi.map(c => c.modulo))) {
    const sue = classi.filter(c => c.modulo === m)
    const sotto = sue.filter(c => c.grado <= g)
    const scelto = sotto.length ? Math.max(...sotto.map(c => c.grado)) : Math.min(...sue.map(c => c.grado))
    out.push(...sue.filter(c => c.grado === scelto))
  }
  return out
}

/* `moduli` nomina chi si vuole, e solo così entrano i moduli `soloSuRichiesta`; `tipi` (chiavi intere o dopo i due punti)
   restringe le tipologie. Senza nessuno dei due il mazzo è quello di sempre. */
export function moduliAmmessi({ materie, moduli, tipi, spenti = [], elenco = MODULI } = {}) {
  // il registro si riempie con import.meta.glob (Vite): in un test Node la lista è vuota
  if (!elenco.length) throw new Error(
    'nessun modulo di quiz: `src/quiz/scelta.js` gira solo sotto Vite — ' +
    'in Node importa il modulo che ti serve da `src/quiz/moduli/`')
  const generali = elenco.filter(m => !m.soloSuRichiesta)
  let buoni = moduli?.length ? elenco.filter(m => moduli.includes(m.id)) : generali
  if (materie?.length) buoni = buoni.filter(m => materie.includes(m.materia))
  // solo certe tipologie: i moduli che non ne hanno nessuna escono, quelli che ne hanno si riducono a quelle
  if (tipi?.length) {
    const ridotti = buoni.map(m => m.soloTipi(tipi))
    const conTipo = ridotti.filter(m => m.tipi.length && m.tipi.every(t =>
      tipi.some(c => t.chiave === c || t.chiave.endsWith(':' + c))))
    if (conTipo.length) buoni = conTipo
  }
  // un modulo senza quei saperi non ha più un grado da chiedere ed esce dal mazzo; se resta vuoto si torna a tutti
  const conSaperi = spenti.length ? buoni.filter(m => m.gradiLiberi(spenti).length) : buoni
  if (conSaperi.length) return conSaperi
  return buoni.length ? buoni : generali
}

// evita è l'id del modulo appena uscito: due domande di fila dello stesso modulo sembrano un'interrogazione
export function domandaPerGioco({
  difficolta = 0, materie, moduli, tipi, grado, evita, sorte = sorteQualunque(),
  spenti = saperiSpenti(), bisogno = ilBisogno(), regole = regoleDomande(), elenco = MODULI,
} = {}) {
  const tutte = classiAmmesse({ materie, moduli, tipi, grado, spenti, difficolta, bisogno, regole, elenco })
  const senzaLUltimo = evita ? tutte.filter(c => c.modulo.id !== evita) : tutte
  const { modulo, grado: gradoScelto } = pescaClasse(sorte, senzaLUltimo.length ? senzaLUltimo : tutte)
  return {
    domanda: modulo.chiedi(gradoScelto, sorte, spenti, bisogno, regole),
    pittori: modulo.pittori,
    modulo: modulo.id,
    nome: modulo.nome,
    icona: modulo.icona,
    materia: modulo.materia,
    grado: gradoScelto,
  }
}
