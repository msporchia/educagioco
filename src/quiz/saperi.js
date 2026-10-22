/* Il ponte fra i moduli e la schermata dei genitori: mette insieme le
   sottovoci di un gruppo di sapere (data/saperi.js elenca i gruppi, i
   moduli dichiarano le tipologie). Sta qui e non in data/ perché il
   registro vive solo sotto Vite, mentre data/saperi.js lo legge anche
   store/profile.js. Lo usa solo GenitoriView. */

import { MODULI } from './nucleo/registro.js'
import { GIOCHI, chiedeA, serveA } from '../data/giochi.js'
import { moduliDi } from '../data/domande-dei-giochi.js'
import { TAPPE_DEL_GIOCO } from '../data/portata-giochi.js'
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

/* I saperi che un gioco chiede, nell'ordine in cui compaiono: quelli dei suoi moduli (le tipologie dichiarano `sa:`, il PRIMO è il
   gruppo) più quelli che dichiara il suo manifesto (`chiede:`). Un gioco che pesca da tutto il mazzo non ne ha un elenco suo. */
export function saperiDelGioco(chiave) {
  const visti = new Set(), fuori = []
  const metti = k => { if (!visti.has(k)) { visti.add(k); fuori.push(k) } }
  for (const m of MODULI) if (moduliDi(chiave).includes(m.id)) for (const t of m.tipi) metti(t.sa[0])
  for (const k of chiedeA(chiave)) metti(k)
  for (const k of serveA(chiave)) metti(k)        // quelli senza cui il gioco non c'è (le pozioni: misure e conversioni)
  // i pezzi di scuola che le sue tappe dichiarano (`scuola:`): spegnerne uno toglie dalla fila le tappe che lo vogliono (gli Asteroidi: le divisioni)
  for (const t of TAPPE_DEL_GIOCO[chiave] || []) for (const k of [].concat(t.scuola || [])) metti(k)
  return fuori
}

/* Dove altro vale spegnere un sapere: i giochi che lo chiedono per modulo o per manifesto (non quelli che pescano da tutto il mazzo) */
export const giochiCheChiedono = (sapere, tranne = null) => GIOCHI
  .filter(g => g.chiave !== tranne && saperiDelGioco(g.chiave).includes(sapere)).map(g => g.chiave)
