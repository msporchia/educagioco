// Le frasi inglesi dentro i quiz degli altri giochi, in tre modi: scegliere la frase giusta fra quattro (tre sbagliate come si sbaglia davvero), capire che cosa dice, rimettere la parola che manca. Frasi e trappole sono quelle dell'inglese a mondi, un grado per isola (src/quiz/inglese.js, docs/lingue/trappole.md). Montare le tessere in fila non c'è: vuole un tocco nuovo nella domanda (docs/lingue/da-fare.md).
import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'
import { QUOTA, GRADI, livelloFrasi, mondoDelGrado, frasePer, bucoPer } from '../inglese.js'

const TUTTI = Object.fromEntries(Array.from({ length: GRADI }, (_, i) => [i + 1, 1]))
const livelloDi = scarto => Object.fromEntries(Array.from({ length: GRADI }, (_, i) => [i + 1, Math.min(100, livelloFrasi(i + 1) + scarto)]))
const ALTRA = 'è un\'altra frase: guarda bene le parole'

class IngFrasi extends Modulo {
  constructor() {
    super({
      id: 'ing-frasi',
      nome: 'Inglese: le frasi',
      icona: '💬',
      materia: 'inglese',
      chiaro: 'scegliere la frase inglese giusta, capire che cosa dice e rimettere la parola che manca, con le strutture che si imparano anno per anno',
      scaletta: Array.from({ length: GRADI }, (_, i) => mondoDelGrado(i + 1).insegna),
      livelli: Array.from({ length: GRADI }, (_, i) => livelloFrasi(i + 1)),
      tipi: [
        { chiave: 'ing:senso', nome: 'Che cosa dice la frase inglese', sa: 'inglese-frasi', gradi: TUTTI, livello: livelloDi(-2) },
        { chiave: 'ing:buco', nome: 'La parola che manca', sa: 'inglese-frasi', gradi: TUTTI, livello: livelloDi(0) },
        { chiave: 'ing:frase', nome: 'La frase giusta in inglese', sa: 'inglese-frasi', gradi: TUTTI, livello: livelloDi(3) },
      ],
      quota: QUOTA,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'ing:frase': return this.frase(grado, sorte, 'scegli', 'Come si dice in inglese?', 'ing:frase')
      case 'ing:buco': return this.buco(grado, sorte)
      default: return this.frase(grado, sorte, 'senso', 'Che cosa vuol dire?', 'ing:senso')
    }
  }

  frase(grado, sorte, formato, consegna, chiave) {
    const d = frasePer(grado, sorte, formato)
    return domanda({
      testo: consegna,
      soggetto: testo(d.domanda.testo),
      buona: testo(d.opzioni.find(o => o.giusta).testo),
      falsi: d.opzioni.filter(o => !o.giusta).map(o => testo(o.testo, o.trappola?.perche || ALTRA)),
      chiave,
      aiuto: d.regola,
      sorte,
    })
  }

  buco(grado, sorte) {
    const b = bucoPer(grado, sorte)
    return domanda({
      testo: `Quale parola manca? (${b.frase.it})`,
      soggetto: testo(b.riga),
      buona: testo(b.giusta),
      falsi: b.falsi.map(f => testo(f.parola, f.perche)),
      chiave: 'ing:buco',
      aiuto: `${b.regola} Qui manca «${b.giusta}».`,
      sorte,
    })
  }
}

export default new IngFrasi()
