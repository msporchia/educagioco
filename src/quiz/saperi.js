/* Il ponte fra i moduli e la schermata dei genitori: mette insieme le
   sottovoci di un gruppo di sapere (data/saperi.js elenca i gruppi, i
   moduli dichiarano le tipologie). Sta qui e non in data/ perché il
   registro vive solo sotto Vite, mentre data/saperi.js lo legge anche
   store/profile.js. Lo usa solo GenitoriView. */

import { MODULI } from './nucleo/registro.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { sorgentiDi, esempioDi as esempioFra } from './nucleo/esempi.js'
import { finestraDi } from './nucleo/classi.js'

// un solo posto dove l'età diventa regole, così il ▶ di un riquadro e la domanda vera non possono divergere
const regoleDi = eta => eta == null ? null : { eta, finestra: finestraDi(eta) }


// un intervallo (da/a) e non un numero: una tipologia a più gradi ha una media che non corrisponde a nessuna domanda vera
export function sottoDi(gruppo) {
  const fuori = []
  for (const m of MODULI)
    for (const t of m.tipi)
      if (t.sa.includes(gruppo)) {
        const gradi = Object.keys(t.gradi).map(Number).filter(g => t.gradi[g] > 0).sort((a, b) => a - b)
        const livelli = gradi.map(g => m.livelloDelTipo(t, g))
        fuori.push({
          chiave: t.chiave, nome: t.nome, dove: m.id,
          icona: m.icona, modulo: m.nome,
          gradi,
          da: livelli.length ? Math.min(...livelli) : 0,
          a: livelli.length ? Math.max(...livelli) : 0,
        })
      }
  return fuori
}

export const TIPI = MODULI.flatMap(m => m.tipi.map(t => ({ ...t, dove: m.id }))) // per controllare chi resta senza gruppo

// se il tasto «prova» va mostrato: divisioni non passa da nessun modulo (vive nel castello), niente tasto per lei
export const siPuoProvare = (chiave, eta = null) =>
  sorgentiDi(MODULI, chiave, regoleDi(eta)).length > 0
export const esempioDi = (chiave, sorte = sorteQualunque(), eta = null) =>
  esempioFra(MODULI, chiave, sorte, regoleDi(eta))
