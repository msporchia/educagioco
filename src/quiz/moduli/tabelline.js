// le tabelline, ogni tanto in mezzo agli altri giochi: i prodotti dei conti puri di conti.js (gradi 1..7) col mazzo generale. Il modulo non sa fare conti: chiede a conti.js e cambia solo la chiave, perché il ripasso e i grandi vedano «le tabelline» e non i conti puri. Una domanda su 40 circa (QUOTA): vedi docs/apprendimento/quote.md.
import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'
import conti from './conti.js'

export const QUOTA_TABELLINE = 1 / 40

const GRADI = 7
const SCALETTA = conti.scaletta.slice(0, GRADI)
const SU_SETTE = Object.fromEntries(Array.from({ length: GRADI }, (_, i) => [i + 1, 1]))
const da = chiave => conti.tipi.find(t => t.chiave === chiave)

const TIPI = [
  { chiave: 'tab:prodotto', nome: 'Le tabelline', sa: 'moltiplicazioni', gradi: SU_SETTE,
    livello: da('conti:prodotto').livello },
  // il fattore nascosto (7 × □ = 56): la stessa tabellina letta a rovescio, un gradino più dura
  { chiave: 'tab:nascosto', nome: 'Il numero nascosto nella tabellina', sa: 'moltiplicazioni', gradi: SU_SETTE,
    livello: Object.fromEntries(Object.entries(da('conti:prodotto').livello).map(([g, l]) => [g, l + 4])) },
]

class Tabelline extends Modulo {
  constructor() {
    super({
      id: 'tabelline',
      nome: 'Tabelline',
      icona: '✖️',
      materia: 'matematica',
      chiaro: 'le tabelline e le loro divisioni, dal 2 e dal 10 fino al 12, in mezzo alle altre domande',
      scaletta: SCALETTA,
      livelli: Array.from({ length: GRADI }, (_, i) => TIPI[0].livello[i + 1] + 2),
      tipi: TIPI,
      quota: { gruppo: 'tabelline', quota: QUOTA_TABELLINE },
    })
  }

  genera(grado, sorte, tipo) {
    const d = conti.genera(grado, sorte, 'conti:prodotto')
    if (tipo !== 'tab:nascosto') return { ...d, chiave: 'tab:prodotto' }
    return this.nascosto(d, sorte)
  }

  // dal conto di conti.js («7 × 8 = ?») si toglie il secondo fattore e si dà il prodotto
  nascosto(d, sorte) {
    const [, a, b] = d.testo.match(/^(\d+) × (\d+) = \?$/)
    const f = Number(b), m = Number(a)
    const vicini = [f + 1, f - 1, f + 2, f - 2, f + 3, m, m + 1].filter(v => v >= 1 && v !== f)
    const falsi = [...new Set(vicini)].slice(0, 3)
    return domanda({
      testo: `${a} × □ = ${m * f}`,
      buona: testo(f),
      falsi: falsi.map(v => testo(v, `${a} × ${v} fa ${m * v}, non ${m * f}`)),
      chiave: 'tab:nascosto',
      aiuto: `${a} × □ = ${m * f} vuol dire ${m * f} : ${a}: ${m * f} diviso ${a} fa ${f}`,
      sorte,
    })
  }
}

export default new Tabelline()
