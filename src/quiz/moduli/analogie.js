// «A sta a B come C sta a ?»: nei primi gradi coppie di cose (relazione = fatto del mondo, difficoltà in da dove arrivano i falsi), negli ultimi figure (relazione = trasformazione, niente da sapere). La seconda colonna non ha doppioni (altrimenti un falso della stessa colonna sarebbe giusto); dove il mondo è ambiguo per davvero la coppia lo dichiara con `anche`, escluso dai falsi.
import { Modulo } from '../nucleo/modulo.js'
import { domanda, emoji, scena } from '../nucleo/domanda.js'
import { PITTORI_FIGURE, FORME_FIGURE } from '../grafica/pittori/figure.js'
import { COLORI } from '../grafica/pittori/tinte.js'

// ogni voce [a, b] e, quando serve, le altre risposte difendibili (mai usate come falsi)
const RELAZIONI = [
  {
    id: 'mangia', dice: 'chi mangia cosa',
    coppie: [
      ['🐕', '🦴'], ['🐈', '🐟'], ['🐒', '🍌'], ['🐭', '🧀'],
      ['🐰', '🥕', ['🌾']], ['🐼', '🎋'], ['🐝', '🌸'], ['🐦', '🐛'],
      ['🐴', '🌾'], ['🐔', '🌽'],
    ],
  },
  {
    id: 'vive', dice: 'chi vive dove',
    coppie: [
      ['🐟', '🌊'], ['🐪', '🏜️'], ['🐒', '🌴', ['🌳']], ['🦉', '🌳', ['🌴']],
      ['🕷️', '🕸️'], ['🐧', '❄️', ['🌊']], ['🐄', '🏡'],
    ],
  },
  {
    id: 'contrario', dice: 'il contrario',
    coppie: [
      ['☀️', '🌙'], ['🔥', '❄️'], ['⬆️', '⬇️'], ['😀', '😢'], ['🐘', '🐭'],
      ['🐢', '🐇'], ['⬅️', '➡️'], ['👍', '👎'], ['🔊', '🔇'], ['🥵', '🥶'],
    ],
  },
  {
    id: 'usa', dice: 'chi usa cosa',
    coppie: [
      ['👨‍🍳', '🍳'], ['👨‍🌾', '🚜'], ['👮', '🚓'], ['👨‍🚒', '🚒'], ['👨‍⚕️', '💉'],
      ['👨‍🏫', '📚'], ['👨‍🎨', '🎨'], ['🧑‍🚀', '🚀'], ['🧑‍🔧', '🔧'], ['🧙', '🪄'],
    ],
  },
  {
    id: 'viene', dice: 'da dove arriva',
    coppie: [
      ['🥛', '🐄'], ['🥚', '🐔'], ['🍯', '🐝'], ['🍿', '🌽'], ['🍞', '🌾'],
      ['🍎', '🌳'], ['🧥', '🐑'], ['🍟', '🥔'], ['🍣', '🐟'], ['🧀', '🐐', ['🐄']],
    ],
  },
].map(r => ({
  ...r,
  coppie: r.coppie.map(([a, b, anche = []]) => ({ a, b, anche })),
}))

// `fa` applica, `dice` racconta, `storto` è l'errore vero (al contrario); quante e grande non si toccano mai insieme (4 grandi non ci starebbero in cella)
const CAMBI = [
  { id: 'cresce', dice: 'diventa grande', puo: f => !f.grande, fa: f => ({ ...f, grande: true }), storto: f => ({ ...f, grande: false }) },
  { id: 'cala', dice: 'diventa piccola', puo: f => f.grande, fa: f => ({ ...f, grande: false }), storto: f => ({ ...f, grande: true }) },
  { id: 'raddoppia', dice: 'da una diventano due', puo: f => f.quante === 1, fa: f => ({ ...f, quante: 2 }), storto: f => ({ ...f, quante: 4 }) },
  { id: 'dimezza', dice: 'da quattro diventano due', puo: f => f.quante === 4, fa: f => ({ ...f, quante: 2 }), storto: f => ({ ...f, quante: 1 }) },
  { id: 'unaInPiu', dice: "ce n'è una in più", puo: f => f.quante <= 3, fa: f => ({ ...f, quante: f.quante + 1 }), storto: f => ({ ...f, quante: Math.max(1, f.quante - 1) }) },
  { id: 'gira', dice: 'gira di un quarto verso destra', puo: f => f.forma === 'freccia', fa: f => ({ ...f, ruota: ((f.ruota || 0) + 90) % 360 }), storto: f => ({ ...f, ruota: ((f.ruota || 0) + 270) % 360 }) },
]

// due tipologie, la difficoltà dentro ognuna la fa il grado
const TIPI = [
  { chiave: 'ana:mondo', nome: 'Le analogie sulle cose del mondo', sa: 'analogie', gradi: { 1: 1, 2: 1 } },
  { chiave: 'ana:figure', nome: 'Le analogie fra figure', sa: 'analogie', gradi: { 3: 1, 4: 1 } },
]

class Analogie extends Modulo {
  constructor() {
    super({
      id: 'analogie',
      nome: 'Analogie',
      icona: '🔗',
      materia: 'logica',
      chiaro: 'vedere che cosa lega due cose, e riportare la stessa relazione su altre due',
      scaletta: [
        'A sta a B come C sta a…: i falsi si vedono da lontano',
        'la stessa relazione, coi falsi che ci somigliano',
        'le figure: una cosa sola che cambia',
        'le figure: due cose che cambiano insieme',
      ],
      livelli: [25, 38, 44, 56], // scala 0-100 comune a tutte le materie (vedi docs/apprendimento/quiz-livelli.md)
      // le prime due classi chiedono cose del mondo già sapute a sei anni: il gruppo isola le analogie, non nasconde una lacuna
      tipi: TIPI,
      pittori: PITTORI_FIGURE,
    })
  }

  genera(grado, sorte, tipo) {
    if (tipo === 'ana:figure') return this.diFigure(sorte, { quanti: grado >= 4 ? 2 : 1 })
    return this.diCose(sorte, { vicini: grado >= 2 })
  }

  // `vicini` decide da dove arrivano i falsi (altre relazioni si scartano a occhio, stessa colonna vuole la regola)
  diCose(sorte, { vicini }) {
    const rel = sorte.uno(RELAZIONI)
    const [mostra, chiede] = sorte.alcuni(rel.coppie, 2)
    const buona = chiede.b

    const vietati = new Set([buona, mostra.a, mostra.b, chiede.a, ...chiede.anche])
    const dallaStessa = rel.coppie.map(c => c.b)
    const dalleAltre = RELAZIONI.filter(r => r.id !== rel.id).flatMap(r => r.coppie.map(c => c.b))
    const serbatoio = (vicini ? dallaStessa.concat(sorte.alcuni(dalleAltre, 2)) : dalleAltre)
      .filter(x => !vietati.has(x))
    const falsi = sorte.alcuni([...new Set(serbatoio)], 3)
    if (falsi.length < 3) return this.diCose(sorte, { vicini: false })

    return domanda({
      testo: `Cosa manca? (${rel.dice})`,
      soggetto: scena({ che: 'analogia', a: { em: mostra.a }, b: { em: mostra.b }, c: { em: chiede.a } }),
      buona: emoji(buona),
      falsi: falsi.map(x => emoji(x, `qui la regola è «${rel.dice}»: guarda cosa lega ${mostra.a} a ${mostra.b}`)),
      chiave: 'ana:mondo',
      aiuto: `${mostra.a} sta a ${mostra.b} come ${chiede.a} sta a ${buona} — ${rel.dice}`,
      sorte,
    })
  }

  // niente da sapere: si guarda cosa cambia da A a B e si rifà su C. Falsi: al contrario, C invariata, attributo sbagliato
  diFigure(sorte, { quanti }) {
    for (let giro = 0; giro < 40; giro++) {
      // due trasformazioni chiedono due attributi liberi (rotazione + uno fra taglia/numero): serve una freccia
      const gira = quanti > 1 || sorte.forse(0.3)
      const via = {
        forma: gira ? 'freccia' : sorte.uno(FORME_FIGURE.filter(f => f !== 'freccia')),
        colore: sorte.uno(COLORI),
        quante: sorte.uno([1, 1, 4]),
        grande: sorte.forse(0.5),
        ruota: 0,
      }
      const buoni = CAMBI.filter(c => c.puo(via))
      if (!buoni.length) continue
      const primo = sorte.uno(buoni)
      const secondi = buoni.filter(c => c.id !== primo.id && !litigano(c, primo)) // mai due che litigano
      // il grado che promette due trasformazioni ne deve dare due: se non si può, si cambia figura
      if (quanti > 1 && !secondi.length) continue
      const cambi = quanti > 1 ? [primo, sorte.uno(secondi)] : [primo]

      const altra = { // altra forma/colore, se no l'analogia si risolve copiando B
        ...via,
        forma: gira ? 'freccia' : sorte.uno(FORME_FIGURE.filter(f => f !== 'freccia' && f !== via.forma)),
        colore: sorte.uno(COLORI.filter(c => c !== via.colore)),
        ruota: gira ? sorte.uno([90, 180, 270]) : 0,
      }
      if (!cambi.every(c => c.puo(altra))) continue

      const applica = (f, quali) => quali.reduce((g, c) => c.fa(g), f)
      const buona = applica(altra, cambi)
      const chiavi = f => `${f.forma}/${f.colore}/${f.quante}/${f.grande}/${f.ruota || 0}`
      const visti = new Set([chiavi(buona)])
      const falsi = []
      const metti = (f, perche) => {
        if (visti.has(chiavi(f)) || falsi.length >= 3) return
        visti.add(chiavi(f))
        falsi.push(scena({ che: 'cella', fig: f }, perche))
      }
      metti(cambi.reduce((g, c) => c.storto(g), altra), 'la trasformazione c\'è ma è al contrario: guarda bene cosa succede da una figura all\'altra')
      metti(altra, 'questa è rimasta com\'era: da A a B qualcosa è cambiato, e qui no')
      if (cambi.length > 1) metti(cambi[0].fa(altra), 'ne è cambiata una sola: da A a B ne cambiano due')
      metti(applica({ ...via }, cambi), 'questa continua la prima coppia, non la seconda: la regola va rifatta sulla figura di sotto')
      for (let g = 0; g < 20 && falsi.length < 3; g++)
        metti({ ...buona, colore: sorte.uno(COLORI.filter(c => c !== buona.colore)) },
          'la trasformazione è giusta ma il colore no: quello non doveva cambiare')
      if (falsi.length < 3) continue

      return domanda({
        testo: 'Cosa manca?',
        soggetto: scena({ che: 'analogia', a: { fig: via }, b: { fig: applica(via, cambi) }, c: { fig: altra } }),
        buona: scena({ che: 'cella', fig: buona }),
        falsi,
        chiave: 'ana:figure',
        aiuto: 'da sopra a sotto la regola è la stessa: ' + cambi.map(c => c.dice).join(' e '),
        sorte,
      })
    }
    return this.diCose(sorte, { vicini: false })
  }
}

// quale attributo tocca un cambio: serve a non mettere insieme due trasformazioni che si pestano i piedi
const tocca = c => (['cresce', 'cala'].includes(c.id) ? 'grande'
  : c.id === 'gira' ? 'ruota' : 'quante')

// litigano se toccano lo stesso attributo, o se sono numero+taglia insieme (4 grandi non ci stanno in cella); la rotazione va d'accordo con tutti
const litigano = (a, b) => {
  const x = tocca(a), y = tocca(b)
  return x === y || (x !== 'ruota' && y !== 'ruota')
}

export default new Analogie()
