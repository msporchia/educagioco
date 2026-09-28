// Come si scrive un programma a mano nei livelli (`{ principale, progetti,
// lavagnette }`, un'istruzione per `fai.*`): schema completo in
// docs/costruttore/linguaggio.md e docs/costruttore/porto.md.
//
//   programma({
//     lavagnette: ['h'],
//     progetti: [progetto('colonna', { nome: 'colonna', icona: '🏛️', misure: ['alta'] }, [
//       fai.ripeti('alta', [fai.metti('bianco', 'sotto')]),
//     ])],
//     principale: [fai.chiama('colonna', 3)],
//   })

import { CHIAVI_COLORI } from './colori.js'

export const VERSI = ['destra', 'sinistra']
export const LATI = ['su', 'giu', 'sinistra', 'destra']
export const DOVE_PORTO = [...LATI, 'mano']
export const COSE_PORTO = ['cassa', 'niente', 'libero', 'cliente', 'camion', 'biglietto', 'bancone',
                           'scaffale', 'cassone', 'nastro', 'strada', 'muro', 'mare', 'bordo',
                           'forma', 'di-piu', 'di-meno']
export const POSTI = ['sotto', 'giu-destra', 'giu-sinistra']
export const DOVE = ['sotto', 'giu-destra', 'giu-sinistra', 'destra', 'sinistra', 'sopra']
export const COSE = ['mattone', 'terreno', 'acqua', 'vuoto', 'pieno', 'bordo']
export const CONFRONTI = ['<', '=', '>']
export const OPERAZIONI = ['+', '-', '×', '÷']

export const numero = x =>
  typeof x === 'number' ? { n: x } : typeof x === 'string' ? { v: x } : x

export const N = () => ({ vuoto: true })

export const piu = (a, b) => ({ op: '+', a: numero(a), b: numero(b) })
export const meno = (a, b) => ({ op: '-', a: numero(a), b: numero(b) })
export const per = (a, b) => ({ op: '×', a: numero(a), b: numero(b) })
export const diviso = (a, b) => ({ op: '÷', a: numero(a), b: numero(b) })

export const guarda = (dove, cosa, c = true, colore = null) =>
  (colore ? { tipo: 'guarda', dove, cosa, c, colore } : { tipo: 'guarda', dove, cosa, c })

export const tinta = nome => ({ v: nome })
// una stringa che è un colore resta un colore, ogni altra è una lavagnetta
// (vedi docs/costruttore/linguaggio.md)
const valoreScritto = x => (typeof x === 'string' && CHIAVI_COLORI.includes(x) ? x : numero(x))
export const confronta = (a, cmp, b) => ({ tipo: 'confronta', a: valoreScritto(a), cmp, b: valoreScritto(b) })

export const leggi = lato => ({ leggi: lato })

export const fai = {
  vai: (verso, quanto = 1) => ({ tipo: 'vai', verso, quanto: numero(quanto) }),
  metti: (colore, dove = 'sotto') => ({ tipo: 'metti', dove, colore }),
  prendi: lato => ({ tipo: 'prendi', lato }),
  posa: lato => ({ tipo: 'posa', lato }),
  aspetta: cond => ({ tipo: 'aspetta', cond }),
  pausa: () => ({ tipo: 'pausa' }),
  sempre: (corpo = []) => ({ tipo: 'sempre', corpo }),
  ripeti: (volte, corpo = []) => ({ tipo: 'ripeti', volte: numero(volte), corpo }),
  finche: (cond, corpo = []) => ({ tipo: 'finche', cond, corpo }),
  se: (cond, allora = [], altrimenti = null) => ({ tipo: 'se', cond, allora, altrimenti }),
  assegna: (nome, valore) => ({ tipo: 'assegna', nome,
    valore: typeof valore === 'string' && CHIAVI_COLORI.includes(valore) ? valore : numero(valore) }),
  chiama: (progetto, ...argomenti) => ({ tipo: 'chiama', progetto,
    argomenti: argomenti.map(a => (typeof a === 'string' && CHIAVI_COLORI.includes(a) ? a : numero(a))) }),
}

export const progetto = (id, { nome = id, icona = '🧱', misure = [], tipi = null } = {}, corpo = []) =>
  (tipi ? { id, nome, icona, misure, tipi, corpo } : { id, nome, icona, misure, corpo })

export const programma = ({ principale = [], progetti = [], lavagnette = [] } = {}) =>
  numera({ principale, progetti, lavagnette })

// Ogni istruzione ha un id unico (`n1`, `n2`, …); chi ce l'ha già lo tiene.
// `prossimo` sta nel programma perché un id nuovo va chiesto anche dopo un
// salvataggio e una riapertura.
export function numera(prog) {
  let max = 0
  for (const i of istruzioni(prog)) {
    const m = /^n(\d+)$/.exec(i.id || '')
    if (m) max = Math.max(max, Number(m[1]))
  }
  for (const i of istruzioni(prog)) if (!i.id) i.id = 'n' + (++max)
  prog.prossimo = Math.max(prog.prossimo || 0, max + 1)
  return prog
}

// Tutte le istruzioni di un programma, corpi compresi (principale e progetti).
export function* istruzioni(prog) {
  const corpi = [prog.principale || [], ...(prog.progetti || []).map(p => p.corpo || [])]
  for (const c of corpi) yield* dentro(c)
}

export function* dentro(corpo) {
  for (const i of corpo || []) {
    yield i
    if (i.corpo) yield* dentro(i.corpo)
    if (i.allora) yield* dentro(i.allora)
    if (i.altrimenti) yield* dentro(i.altrimenti)
  }
}

// Copia profonda: un programma in esecuzione non deve cambiare sotto i
// piedi, e il programma dato al bambino non deve essere il dato del livello.
export const copia = prog => JSON.parse(JSON.stringify(prog))
