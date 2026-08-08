/* ═══════════════════════════════════════════════════════════════════
   ANALOGIE — «A sta a B come C sta a ?»

   L'ultima famiglia rimasta in `poc/indovinelli.html`, e la più
   trasversale che ci sia: non chiede di sapere una regola, chiede di
   **vedere che relazione lega due cose e di riportarla su altre due**.
   È la stessa mossa che serve a capire una metafora, a usare un esempio
   e a passare da un problema risolto a uno che gli somiglia.

   DUE MONDI, UNA DOMANDA SOLA. Nei primi gradi le coppie sono di cose
   (🐄 sta a 🥛 come 🐝 sta a 🍯): lì la relazione è un fatto del mondo,
   e la difficoltà sta tutta in **da dove arrivano i falsi**. Negli
   ultimi le coppie sono figure e la relazione è una trasformazione (la
   piccola diventa grande, una diventa due): lì non c'è niente da
   sapere, si guarda cosa è cambiato e lo si rifà.

   LA SECONDA COLONNA NON HA DOPPIONI, ed è la regola che tiene in piedi
   il grado difficile: se due animali mangiassero la stessa cosa, un
   falso preso dalla stessa colonna sarebbe una risposta giusta. Dove il
   mondo è ambiguo per davvero — il pinguino vive sul ghiaccio ma nuota
   anche, il formaggio si fa col latte di capra e anche di mucca — la
   coppia se lo dichiara (`anche`), e quelle risposte non finiscono mai
   fra i falsi. È lo stesso problema di «con che cosa misuri un
   secchio»: una domanda con due risposte oneste passa tutti i controlli
   di forma e la vede solo chi gioca.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, emoji, scena } from '../nucleo/domanda.js'
import { PITTORI_FIGURE, FORME_FIGURE } from '../grafica/pittori/figure.js'
import { COLORI } from '../grafica/pittori/tinte.js'

/* ── le relazioni fra cose ──
   Ogni voce: [a, b] e, quando serve, le altre risposte che un bambino
   potrebbe difendere — mai usate come falsi. */
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

/* ── le trasformazioni fra figure ──
   `fa` la applica, `dice` la racconta, e `storto` è l'errore vero: la
   trasformazione fatta al contrario, o non fatta per niente. `quante` e
   `grande` non si toccano mai nella stessa domanda — quattro stelle
   stanno in una cella solo rimpicciolendosi, e allora «più grande»
   diventerebbe illeggibile. */
const CAMBI = [
  { id: 'cresce', dice: 'diventa grande', puo: f => !f.grande, fa: f => ({ ...f, grande: true }), storto: f => ({ ...f, grande: false }) },
  { id: 'cala', dice: 'diventa piccola', puo: f => f.grande, fa: f => ({ ...f, grande: false }), storto: f => ({ ...f, grande: true }) },
  { id: 'raddoppia', dice: 'da una diventano due', puo: f => f.quante === 1, fa: f => ({ ...f, quante: 2 }), storto: f => ({ ...f, quante: 4 }) },
  { id: 'dimezza', dice: 'da quattro diventano due', puo: f => f.quante === 4, fa: f => ({ ...f, quante: 2 }), storto: f => ({ ...f, quante: 1 }) },
  { id: 'unaInPiu', dice: "ce n'è una in più", puo: f => f.quante <= 3, fa: f => ({ ...f, quante: f.quante + 1 }), storto: f => ({ ...f, quante: Math.max(1, f.quante - 1) }) },
  { id: 'gira', dice: 'gira di un quarto verso destra', puo: f => f.forma === 'freccia', fa: f => ({ ...f, ruota: ((f.ruota || 0) + 90) % 360 }), storto: f => ({ ...f, ruota: ((f.ruota || 0) + 270) % 360 }) },
]

/* Le tipologie: due, e la difficoltà dentro ognuna la fa il grado —
   quanto si somigliano i falsi per le cose del mondo, quante
   trasformazioni insieme per le figure. */
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
      /* le prime due classi chiedono cose del mondo che un bambino di
         sei anni sa già (cosa mangia il cane, da dove viene il latte):
         non è roba di scuola. Il gruppo serve a isolare le analogie,
         non a nascondere una lacuna. */
      tipi: TIPI,
      pittori: PITTORI_FIGURE,
    })
  }

  genera(grado, sorte, tipo) {
    if (tipo === 'ana:figure') return this.diFigure(sorte, { quanti: grado >= 4 ? 2 : 1 })
    return this.diCose(sorte, { vicini: grado >= 2 })
  }

  /* ── 🐄 sta a 🥛 come 🐝 sta a ? ──
     `vicini` decide da dove arrivano i falsi, ed è tutta la difficoltà:
     presi da altre relazioni stonano e si scartano a occhio, presi dalla
     stessa colonna bisogna applicare la regola per scegliere. */
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

  /* ── la figura piccola sta alla grande come… ──
     Qui non c'è niente da sapere: si guarda cosa è cambiato da A a B e
     lo si rifà su C. I falsi sono la trasformazione al contrario, C
     lasciata com'è, e la trasformazione fatta all'attributo sbagliato:
     i tre modi veri di sbagliare. */
  diFigure(sorte, { quanti }) {
    for (let giro = 0; giro < 40; giro++) {
      /* Con due trasformazioni servono due attributi che non si pestino
         i piedi, e gli unici disponibili sono la rotazione più una fra
         taglia e numero: perciò la figura dev'essere una freccia. Prima
         `gira` era sempre 30% e il grado 4 scartava tutte le altre
         figure — quaranta tentativi a vuoto e poi il ripiego, che è la
         domanda PIÙ FACILE del modulo. Il grado più duro consegnava la
         cosa più semplice, e non se n'era accorto nessuno. */
      const gira = quanti > 1 || sorte.forse(0.3)
      const via = {
        forma: gira ? 'freccia' : sorte.uno(FORME_FIGURE.filter(f => f !== 'freccia')),
        colore: sorte.uno(COLORI),
        quante: sorte.uno([1, 1, 4]),
        grande: sorte.forse(0.5),
        ruota: 0,
      }
      /* i cambi possibili su questa figura. Una freccia può girare, e
         può anche crescere o moltiplicarsi: prima le due cose si
         escludevano a vicenda — o giri o tutto il resto — ed era il
         secondo motivo per cui il grado 4 non trovava mai due
         trasformazioni. */
      const buoni = CAMBI.filter(c => c.puo(via))
      if (!buoni.length) continue
      const primo = sorte.uno(buoni)
      /* mai due che litigano: due cambi sullo stesso attributo si
         annullano, e il numero con la taglia non ci sta — quattro
         figure grandi non entrano nella cella */
      const secondi = buoni.filter(c => c.id !== primo.id && !litigano(c, primo))
      /* il grado che promette due trasformazioni ne deve dare due: se
         su questa figura la seconda non si può fare, si cambia figura
         invece di consegnare una domanda più facile del suo grado */
      if (quanti > 1 && !secondi.length) continue
      const cambi = quanti > 1 ? [primo, sorte.uno(secondi)] : [primo]

      /* la seconda coppia parte da una figura diversa — altra forma,
         altro colore — se no l'analogia si risolve copiando B */
      const altra = {
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

/* quale attributo tocca un cambio: serve a non mettere insieme due
   trasformazioni che si pestano i piedi */
const tocca = c => (['cresce', 'cala'].includes(c.id) ? 'grande'
  : c.id === 'gira' ? 'ruota' : 'quante')

/* due cambi litigano se toccano lo stesso attributo (si annullano) o se
   sono numero e taglia insieme: quattro figure grandi non ci stanno
   nella cella. La rotazione invece va d'accordo con tutti. */
const litigano = (a, b) => {
  const x = tocca(a), y = tocca(b)
  return x === y || (x !== 'ruota' && y !== 'ruota')
}

export default new Analogie()
