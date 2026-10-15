// Le parole inglesi dentro i quiz degli altri giochi, in tre modi: dalla figura all'inglese, dall'inglese all'italiano, dall'italiano all'inglese. Un grado per isola dell'inglese a mondi (src/quiz/inglese.js); tutto l'inglese pesa una domanda su 20 (docs/apprendimento/quote.md).
import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'
import { QUOTA, GRADI, livelloParole, mondoDelGrado, vocePer, altreVoci } from '../inglese.js'

const TUTTI = Object.fromEntries(Array.from({ length: GRADI }, (_, i) => [i + 1, 1]))
// riconoscere con la figura è il più facile, dire dall'italiano il più duro
const livelloDi = scarto => Object.fromEntries(Array.from({ length: GRADI }, (_, i) => [i + 1, livelloParole(i + 1) + scarto]))

class IngParole extends Modulo {
  constructor() {
    super({
      id: 'ing-parole',
      nome: 'Inglese: le parole',
      icona: '🇬🇧',
      materia: 'inglese',
      chiaro: 'dire e capire le parole inglesi che si imparano a scuola anno per anno: dalla figura, dall\'inglese, dall\'italiano',
      scaletta: Array.from({ length: GRADI }, (_, i) => mondoDelGrado(i + 1).insegna),
      livelli: Array.from({ length: GRADI }, (_, i) => livelloParole(i + 1) + 2),
      tipi: [
        { chiave: 'ing:figura', nome: 'Il nome inglese di una figura', sa: 'inglese-parole', gradi: TUTTI, livello: livelloDi(0) },
        { chiave: 'ing:significato', nome: 'Che cosa vuol dire una parola inglese', sa: 'inglese-parole', gradi: TUTTI, livello: livelloDi(2) },
        { chiave: 'ing:traduci', nome: 'Dall\'italiano all\'inglese', sa: 'inglese-parole', gradi: TUTTI, livello: livelloDi(5) },
      ],
      quota: QUOTA,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'ing:significato': return this.significato(grado, sorte)
      case 'ing:traduci': return this.traduci(grado, sorte)
      default: return this.figura(grado, sorte)
    }
  }

  figura(grado, sorte) {
    const voce = vocePer(grado, sorte, v => v.emoji)
    const falsi = altreVoci(voce, grado, sorte, 3, { figure: true })
    return domanda({
      testo: 'Come si dice in inglese?',
      soggetto: testo(voce.emoji),
      buona: testo(voce.str),
      falsi: falsi.map(f => testo(f.str, `${f.str} vuol dire «${f.it}»`)),
      chiave: 'ing:figura',
      aiuto: `${voce.emoji} in inglese è «${voce.str}»; in italiano «${voce.it}»`,
      sorte,
    })
  }

  significato(grado, sorte) {
    const voce = vocePer(grado, sorte)
    const falsi = altreVoci(voce, grado, sorte)
    return domanda({
      testo: 'Che cosa vuol dire?',
      soggetto: testo(voce.str),
      buona: testo(voce.it),
      falsi: falsi.map(f => testo(f.it, `«${f.it}» in inglese è ${f.str}`)),
      chiave: 'ing:significato',
      aiuto: `«${voce.str}» vuol dire «${voce.it}»${voce.emoji ? ' ' + voce.emoji : ''}`,
      sorte,
    })
  }

  traduci(grado, sorte) {
    const voce = vocePer(grado, sorte)
    const falsi = altreVoci(voce, grado, sorte)
    return domanda({
      testo: 'Come si dice in inglese?',
      soggetto: testo(voce.it),
      buona: testo(voce.str),
      falsi: falsi.map(f => testo(f.str, `${f.str} vuol dire «${f.it}»`)),
      chiave: 'ing:traduci',
      aiuto: `«${voce.it}» in inglese è «${voce.str}»${voce.emoji ? ' ' + voce.emoji : ''}`,
      sorte,
    })
  }
}

export default new IngParole()
