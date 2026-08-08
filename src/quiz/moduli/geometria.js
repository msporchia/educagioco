/* ═══════════════════════════════════════════════════════════════════
   GEOMETRIA — le figure, la simmetria e il girare le cose con la mente.

   È il modulo che si guarda invece di leggerlo: quasi tutte le domande
   hanno un disegno di qua o di là, e diverse le hanno da tutte e due le
   parti («quale di queste quattro è la stessa figura girata?»).

   PERCHÉ LA ROTAZIONE MENTALE. È l'unica cosa qui dentro che non si può
   imparare a memoria: un bambino che sa dire «esagono» perché ha
   riconosciuto il disegno del libro non sa ancora niente, mentre girare
   una figura nella testa è un gesto che o si fa o non si fa. È anche il
   posto dove sta l'errore più bello che ci sia in geometria — prendere
   la figura SPECCHIATA per la figura GIRATA — e su quello sono
   costruiti i distrattori del grado 4.

   COME SI EVITANO DUE RISPOSTE UGUALI. Una figura a quadretti girata di
   un quarto e la stessa specchiata sono due liste di celle diverse, ma
   possono benissimo VEDERSI uguali: la esse girata di mezzo giro è
   identica a sé stessa. Il banco di prova non se ne accorgerebbe (i
   JSON differiscono) e il bambino sì. Per questo i pezzi a quadretti
   non sono scelti a mano ma filtrati: passa solo chi ha otto
   orientazioni tutte diverse (quattro rotazioni più quattro
   specchiate), e allora nessuna coppia di risposte può coincidere.
   Lo stesso vale per le figure piane: il rombo ha le diagonali diverse
   apposta, se no un quadrato storto sarebbe la stessa cosa.

   I FALSI SONO GLI ERRORI VERI: la metà copiata invece che specchiata,
   la piega presa di sbieco dove non combacia, il numero degli spigoli
   dato al posto di quello delle facce, l'angolo girato dalla parte
   sbagliata.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, scena } from '../nucleo/domanda.js'
import { PITTORI_GEOMETRIA, COLORI } from '../grafica/pittori/geometria.js'

/* ── le figure piane ──
   `dritta` è la spiegazione che vale sia da aiuto sia da «perché no».
   Quanti assi di simmetria abbia una figura non è più scritto da
   nessuna parte apposta: era un numero da sapere, e la simmetria qui
   si guarda. */
const FIGURE = [
  { forma: 'triangolo', nome: 'triangolo', lati: 3,
    dritta: 'il triangolo ha 3 lati e 3 angoli' },
  { forma: 'quadrato', nome: 'quadrato', lati: 4,
    dritta: 'il quadrato ha 4 lati tutti uguali e 4 angoli retti' },
  { forma: 'rettangolo', nome: 'rettangolo', lati: 4,
    dritta: 'il rettangolo ha 4 angoli retti, due lati lunghi e due corti' },
  { forma: 'rombo', nome: 'rombo', lati: 4,
    dritta: 'il rombo ha 4 lati uguali ma gli angoli non sono retti: è un quadrato storto' },
  { forma: 'trapezio', nome: 'trapezio', lati: 4,
    dritta: 'il trapezio ha due lati paralleli e gli altri due no' },
  { forma: 'pentagono', nome: 'pentagono', lati: 5,
    dritta: 'il pentagono ha 5 lati' },
  { forma: 'esagono', nome: 'esagono', lati: 6,
    dritta: 'l\'esagono ha 6 lati, come le celle del miele' },
  { forma: 'ottagono', nome: 'ottagono', lati: 8,
    dritta: 'l\'ottagono ha 8 lati, come il cartello dello stop' },
  { forma: 'cerchio', nome: 'cerchio', lati: 0,
    dritta: 'il cerchio non ha né lati né angoli: è tutto tondo' },
]
const PER_FORMA = Object.fromEntries(FIGURE.map(f => [f.forma, f]))

/* le inclinazioni ammesse: poche e piccole, perché una figura storta è
   ancora la stessa figura (e questo va imparato) ma un quadrato girato
   di mezzo quadrante diventerebbe un rombo */
const GIRI = [-0.22, -0.11, 0, 0.11, 0.22]

/* ── le figure che si piegano in UN MODO SOLO ──
   Servono alla domanda «dove si piega»: se la figura si piegasse in due
   modi (il rettangolo si piega in due) ci sarebbero due risposte
   giuste. */
const ASSATE = [
  ['isoscele-su', 'v'], ['isoscele-giu', 'v'], ['isoscele-destra', 'o'], ['isoscele-sinistra', 'o'],
  ['casa-su', 'v'], ['casa-giu', 'v'], ['casa-destra', 'o'], ['casa-sinistra', 'o'],
  ['trapezio-su', 'v'], ['trapezio-giu', 'v'], ['trapezio-destra', 'o'], ['trapezio-sinistra', 'o'],
  ['freccia-su', 'v'], ['freccia-giu', 'v'], ['freccia-destra', 'o'], ['freccia-sinistra', 'o'],
  ['retto-tl', 'd1'], ['retto-br', 'd1'], ['retto-tr', 'd2'], ['retto-bl', 'd2'],
]
const VERSI_ASSE = ['v', 'o', 'd1', 'd2']
const DICE_ASSE = {
  v: 'in piedi, che divide destra e sinistra',
  o: 'sdraiato, che divide sopra e sotto',
  d1: 'di sbieco, da in alto a sinistra a in basso a destra',
  d2: 'di sbieco, da in basso a sinistra a in alto a destra',
}

/* ── i solidi ── */
const SOLIDI = [
  { tipo: 'cubo', nome: 'cubo', facce: 6, spigoli: 12, vertici: 8, alto: 'quadrato', lato: 'quadrato',
    dritta: 'il cubo ha 6 facce quadrate, 12 spigoli e 8 vertici' },
  { tipo: 'parallelepipedo', nome: 'parallelepipedo', facce: 6, spigoli: 12, vertici: 8, alto: 'rettangolo', lato: 'rettangolo',
    dritta: 'il parallelepipedo è una scatola: 6 facce, ma non tutte uguali' },
  { tipo: 'piramide', nome: 'piramide', facce: 5, spigoli: 8, vertici: 5, alto: 'quadrato', lato: 'triangolo',
    dritta: 'la piramide a base quadrata ha 5 facce: il quadrato sotto e 4 triangoli' },
  { tipo: 'cilindro', nome: 'cilindro', alto: 'cerchio', lato: 'rettangolo',
    dritta: 'il cilindro è come un barattolo: due cerchi e un rotolo intorno' },
  { tipo: 'cono', nome: 'cono', alto: 'cerchio', lato: 'triangolo',
    dritta: 'il cono ha una punta sola e un cerchio sotto' },
  { tipo: 'sfera', nome: 'sfera', alto: 'cerchio', lato: 'cerchio',
    dritta: 'la sfera è una palla: non ha facce piatte né spigoli' },
]
const CONTABILI = SOLIDI.filter(s => s.facce)      // solo quelli fatti di facce piatte
const NOMI_CONTO = { facce: 'facce', spigoli: 'spigoli (gli orli)', vertici: 'vertici (le punte)' }

/* le sagome che si possono vedere schiacciando un solido su un foglio.
   Quadrato e rettangolo non stanno mai insieme: un quadrato È un
   rettangolo, e una domanda con due risposte giuste è una domanda
   rotta. */
const SAGOME = ['cerchio', 'quadrato', 'rettangolo', 'triangolo', 'esagono', 'rombo']
const LITIGA = { quadrato: ['rettangolo', 'rombo'], rettangolo: ['quadrato'], rombo: ['quadrato'] }

/* ── le celle a quadretti ──
   Tutto quello che gira, si specchia e si confronta. Una figura è
   sempre «posata»: portata in alto a sinistra e messa in ordine, così
   due liste di celle sono uguali se e solo se si vedono uguali. */
const ordina = c => c.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0])
const posa = c => {
  const mx = Math.min(...c.map(p => p[0])), my = Math.min(...c.map(p => p[1]))
  return ordina(c.map(([x, y]) => [x - mx, y - my]))
}
const impronta = c => posa(c).map(p => p.join(',')).join(' ')
const gira = c => posa(c.map(([x, y]) => [-y, x]))            // un quarto in senso orario
const giraTante = (c, n) => { let r = posa(c); for (let i = 0; i < ((n % 4) + 4) % 4; i++) r = gira(r); return r }
const specchia = c => posa(c.map(([x, y]) => [-x, y]))        // allo specchio, destra-sinistra
const capovolgi = c => posa(c.map(([x, y]) => [x, -y]))
const traspone = c => posa(c.map(([x, y]) => [y, x]))
const antitraspone = c => posa(c.map(([x, y]) => [-y, -x]))
const orientazioni = c => [0, 1, 2, 3].flatMap(n => [giraTante(c, n), giraTante(specchia(c), n)])
const tutteDiverse = c => new Set(orientazioni(c).map(impronta)).size === 8
const simmetrica = c =>
  [specchia(c), capovolgi(c), traspone(c), antitraspone(c)].some(m => impronta(m) === impronta(c))
const larghezza = c => Math.max(...c.map(p => p[0])) + 1
const altezza = c => Math.max(...c.map(p => p[1])) + 1
/* La cornice delle figure da guardare a specchio si costruisce intorno
   alla PIEGA, non intorno ai quadretti: tutte e quattro le figure
   vengono disegnate in una griglia larga uguale, con la piega esatta in
   mezzo. Se la cornice si limitasse a contenere i quadretti, la figura
   simmetrica finirebbe appoggiata a sinistra con una colonna vuota a
   destra — e sembrerebbe storta proprio lei, che è l'unica dritta. */
function attornoAllaPiega(figure, piega) {
  const k = Math.max(...figure.flatMap(c => c.map(([x]) => Math.max(piega - x, x - piega + 1))))
  return { colonne: 2 * k, sposta: c => ordina(c.map(([x, y]) => [x + k - piega, y])) }
}
/* centrata in una scacchiera n×n: le otto orientazioni restano otto
   figure diverse anche dopo essere state centrate */
const centra = (c, n) => {
  const p = posa(c)
  const dx = Math.floor((n - larghezza(p)) / 2), dy = Math.floor((n - altezza(p)) / 2)
  return ordina(p.map(([x, y]) => [x + dx, y + dy]))
}

/* i pezzi da girare: scritti a quadretti, e tenuti solo se le loro otto
   orientazioni sono tutte diverse fra loro — cioè se non sono simmetrici
   e non sono uguali alla propria immagine allo specchio. Un pezzo che
   non passa non è un pezzo difficile, è una domanda con due risposte
   giuste. */
const disegnati = righe => {
  const c = []
  righe.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') c.push([x, y]) }))
  return posa(c)
}
const PEZZI = [
  ['#.', '#.', '##'],
  ['.##', '##.', '.#.'],
  ['.#', '##', '.#', '.#'],
  ['.#', '.#', '##', '#.'],
  ['##', '##', '#.'],
  ['###', '#..', '##.', '#..'],
  ['#...', '####'],
  ['.#.', '###', '#..'],
  ['#..', '##.', '.#.', '.#.'],
  ['###', '..#', '.##'],
  ['##.', '###', '#..'],
  ['####', '#...', '#...'],
  ['#.', '##', '##'],
  ['.#', '.#', '##', '##'],
].map(disegnati).filter(tutteDiverse)

/* ── le costruzioni di cubetti ──
   Il grado 5 sui solidi non sa salire: i solidi sono sei e i loro conti
   si imparano a memoria in una settimana, quindi «quante facce ha»
   diventa subito una domanda di ricordo. I cubetti invece hanno una
   manopola vera — quanti ne nascondo — e non c'è niente da ricordare:
   o li vedi con la mente o no.

   Una costruzione è una MAPPA DI ALTEZZE su una base piccola: la
   colonna (x, y) è alta `h`, e i cubetti stanno uno sopra l'altro senza
   sporgenze. Niente ponti né mensole apposta — un cubetto per aria è un
   disegno che si legge male e una domanda che si contesta. */
const colonneDi = (base, alte) => {
  const cubi = []
  alte.forEach((h, i) => {
    const x = i % base, y = Math.floor(i / base)
    for (let z = 0; z < h; z++) cubi.push([x, y, z])
  })
  return cubi
}

/* Quanti se ne vedono. Un cubetto sparisce quando ha un vicino a destra
   (x+1), uno a sinistra (y+1) e uno sopra (z+1): sono le tre facce che
   si vedono in questa assonometria, coperte tutte e tre. È il conto che
   fa il bambino che conta solo quello che vede — cioè il distrattore
   giusto, quello che rende la domanda una domanda. */
function visibili(cubi) {
  const c = new Set(cubi.map(q => q.join(',')))
  return cubi.filter(([x, y, z]) =>
    !(c.has(`${x + 1},${y},${z}`) && c.has(`${x},${y + 1},${z}`) && c.has(`${x},${y},${z + 1}`))).length
}

/* ── gli sviluppi del cubo ──
   Un ritaglio di sei quadrati attaccati si chiude in un dado oppure no,
   e a occhio i due casi non si distinguono: è lì che la domanda diventa
   una piegatura fatta con la testa.

   QUALE SIA QUALE NON STA SCRITTO. Si piega davvero, qui sotto: si
   cammina sul ritaglio portandosi dietro come è messa la faccia — dove
   guarda (`n`), dov'è la sua destra (`r`), dov'è il suo sotto (`d`) — e
   a ogni passo si ribalta di un quarto sullo spigolo che si attraversa.
   Se alla fine le sei caselle guardano in sei direzioni diverse il dado
   si chiude; se due finiscono a guardare dalla stessa parte, quel
   ritaglio si accavalla. Elencare a mano gli undici sviluppi buoni
   sarebbe stato più corto e sbagliato la metà delle volte — e nessuno
   se ne sarebbe accorto, perché una risposta «giusta» che non si chiude
   supera tutti i controlli di forma. */
const meno = v => v.map(k => -k)
function chiude(celle) {
  if (celle.length !== 6) return false
  const mappa = new Map(celle.map(c => [c.join(','), c]))
  const visti = new Map()
  const partenza = celle[0]
  const coda = [[partenza, { n: [0, 0, 1], r: [1, 0, 0], d: [0, 1, 0] }]]
  visti.set(partenza.join(','), [0, 0, 1])
  /* i quattro passi sulla carta, e come si ribalta la faccia a farli */
  const passi = [
    [1, 0, v => ({ n: v.r, r: meno(v.n), d: v.d })],
    [-1, 0, v => ({ n: meno(v.r), r: v.n, d: v.d })],
    [0, 1, v => ({ n: v.d, d: meno(v.n), r: v.r })],
    [0, -1, v => ({ n: meno(v.d), d: v.n, r: v.r })],
  ]
  while (coda.length) {
    const [[x, y], verso] = coda.shift()
    for (const [dx, dy, giro] of passi) {
      const k = `${x + dx},${y + dy}`
      if (!mappa.has(k) || visti.has(k)) continue
      const v2 = giro(verso)
      visti.set(k, v2.n)
      coda.push([mappa.get(k), v2])
    }
  }
  if (visti.size !== 6) return false                    // ritaglio a pezzi
  return new Set([...visti.values()].map(n => n.join(','))).size === 6
}

/* I ritagli da cui si pesca: quelli che si chiudono fanno la risposta
   giusta, gli altri i falsi. Le due liste non sono divise a mano — è la
   piegatura a dirlo — e la lista scritta qui serve solo a scegliere
   ritagli che si somigliano fra loro: un ritaglio a caso si scarterebbe
   a occhio, e la domanda si risolverebbe senza piegare niente. */
const RITAGLI = [
  ['.#..', '####', '.#..'], ['.#..', '####', '..#.'], ['.#..', '####', '...#'],
  ['#...', '####', '.#..'], ['##..', '.###', '...#'], ['##..', '.##.', '..##'],
  ['#...', '###.', '..##'], ['.#..', '###.', '..##'],
  ['##..', '.###', '..#.'], ['#...', '####', '...#'], ['####', '##..'],
  ['.##.', '####'], ['####', '.#.#'], ['##..', '##..', '##..'],
  ['###.', '###.'], ['#.##', '###.'], ['.#..', '###.', '.#..', '.#..'],
  ['##..', '.##.', '..#.', '..#.'], ['##..', '###.', '#...'],
  ['.###', '##..', '#...'], ['####', '#..#'], ['.#..', '####', '#...'],
  ['#...', '###.', '.#..', '.#..'], ['.##.', '##..', '##..'],
  ['##.', '.#.', '.#.', '.##'],
].map(disegnati)
const SVILUPPI = RITAGLI.filter(chiude)
const NON_SVILUPPI = RITAGLI.filter(c => c.length === 6 && !chiude(c))

/* ── le scene ── */
const scenaFigura = (forma, colore, ruota = 0, asse = null) => {
  const s = { che: 'figura', forma, colore }
  if (forma !== 'cerchio' && ruota) s.ruota = ruota      // un cerchio girato è lo stesso cerchio
  if (asse) s.asse = asse
  return s
}
const scenaPezzo = (celle, n, colore, asse = null) => {
  const s = { che: 'griglia', celle: centra(celle, n), colonne: n, righe: n, colore }
  if (asse) s.asse = asse
  return s
}
const scenaGriglia = (celle, colonne, righe, colore, asse = null) => {
  const s = { che: 'griglia', celle: ordina(celle), colonne, righe, colore }
  if (asse) s.asse = asse
  return s
}

/* le figure che si somigliano di più al bersaglio: prima quelle con lo
   stesso numero di lati (quadrato, rombo, rettangolo e trapezio sono la
   confusione vera), poi le vicine. Il pizzico di caso serve a non
   proporre sempre gli stessi tre falsi. */
function vicine(bersaglio, quante, sorte) {
  const peso = f => Math.abs((f.lati || 12) - (bersaglio.lati || 12)) + sorte.frazione * 1.3
  return FIGURE.filter(f => f.forma !== bersaglio.forma)
    .map(f => [f, peso(f)]).sort((a, b) => a[1] - b[1]).slice(0, quante).map(x => x[0])
}

/* tre numeri sbagliati ma credibili intorno a `n` */
function attorno(n, sorte, extra = []) {
  const visti = new Set([n])
  const buoni = []
  for (const v of [...extra, n + 1, n - 1, n + 2, n - 2, n + 4]) {
    if (v < 0 || visti.has(v)) continue
    visti.add(v); buoni.push(v)
  }
  return buoni.slice(0, 3)
}

/* le figure con quattro lati, o tutte le altre: è la riga che tiene
   insieme il pool e la chiave che la domanda emetterà */
const figureDi = quadri => FIGURE.filter(f => (f.lati === 4) === !!quadri)

/* Le tipologie, divise in tre pezzi di scuola diversi. I nomi delle
   figure e il conto dei lati sono nomenclatura: si sanno o non si
   sanno. La simmetria si guarda — «quanti assi ha» chiedeva un numero
   su un concetto astratto, e un bambino che vede benissimo quale metà
   completa la figura lì si bloccava, quindi le domande rimaste si
   rispondono tutte guardando due disegni. Girare con la mente, gli
   specchi e i cubetti non chiedono di ricordare niente: sono l'unica
   parte di questo modulo che si può fare difficile quanto si vuole, e
   per questo stanno in un gruppo loro invece che coi solidi. */
const TIPI = [
  { chiave: 'geo:figure', nome: 'Le figure e i loro nomi', sa: 'figure', gradi: { 1: 0.56 } },
  { chiave: 'geo:quadrilateri', nome: 'I quadrilateri (quadrato, rombo, trapezio)', sa: 'figure', gradi: { 1: 0.44 } },
  { chiave: 'geo:lati', nome: 'Contare lati e vertici', sa: 'figure', gradi: { 2: 0.5 } },
  { chiave: 'geo:angoli', nome: 'Gli angoli: retto, acuto, ottuso', sa: 'figure', gradi: { 2: 0.5 } },
  { chiave: 'geo:simmetria', nome: 'La metà che manca', sa: 'simmetria', gradi: { 3: 0.74 } },
  { chiave: 'geo:piega', nome: 'Dove si piega', sa: 'simmetria', gradi: { 3: 0.26 } },
  { chiave: 'geo:rotazione', nome: 'Girare una figura di un quarto', sa: 'spazio-mente', gradi: { 4: 0.69 } },
  { chiave: 'geo:specchio', nome: 'La figura allo specchio', sa: 'spazio-mente', gradi: { 4: 0.31 } },
  { chiave: 'geo:solidi', nome: 'I solidi e i loro nomi', sa: 'solidi', gradi: { 5: 0.41 } },
  { chiave: 'geo:viste', nome: "Come si vede un solido dall'alto", sa: 'solidi', gradi: { 5: 0.4 } },
  { chiave: 'geo:facce', nome: 'Contare le facce', sa: 'solidi', gradi: { 5: 0.19 } },
  { chiave: 'geo:cubetti', nome: 'I cubetti, anche quelli nascosti', sa: 'spazio-mente', gradi: { 6: 0.61 } },
  { chiave: 'geo:sviluppo', nome: 'Lo sviluppo da piegare', sa: 'spazio-mente', gradi: { 6: 0.39 } },
]

class Geometria extends Modulo {
  constructor() {
    super({
      id: 'geometria',
      nome: 'Geometria',
      icona: '📐',
      materia: 'spazio',
      chiaro: 'riconoscere le figure, vedere la simmetria e girare le cose con la mente',
      scaletta: [
        'le figure piane e i loro nomi',
        'lati, angoli e vertici',
        'la simmetria: la metà che manca e dove si piega',
        'girare le figure con la mente',
        'i solidi e le viste dall\'alto',
        'i cubetti: contarli anche dove non si vedono',
      ],
      /* i cubetti non chiedono la lezione sui solidi: si contano e
         basta, e un bambino che non ha mai sentito la parola «cubo»
         vede benissimo che dietro ce n'è uno che non si vede. Per
         questo stanno in `spazio-mente` insieme alle rotazioni, e non
         nel gruppo dei solidi. */
      tipi: TIPI,
      pittori: PITTORI_GEOMETRIA,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'geo:quadrilateri': return sorte.forse(0.66) ? this.qualeFigura(sorte, true) : this.nomeFigura(sorte, true)
      case 'geo:lati': return this.contaLati(sorte)
      case 'geo:angoli': return sorte.forse(0.5) ? this.cheAngolo(sorte) : this.qualeAngolo(sorte)
      case 'geo:simmetria': return sorte.forse(0.66) ? this.meta(sorte) : this.simmetriche(sorte)
      case 'geo:piega': return this.dovePiega(sorte)
      case 'geo:rotazione': return this.giraQuarto(sorte)
      case 'geo:specchio': return this.stessaGirata(sorte)
      case 'geo:solidi': return sorte.forse(0.5) ? this.nomeSolido(sorte) : this.qualeSolido(sorte)
      case 'geo:facce': return this.contaFacce(sorte)
      case 'geo:viste': return this.vista(sorte)
      case 'geo:cubetti': return sorte.forse(0.6) ? this.contaCubetti(sorte) : this.mancanoCubetti(sorte)
      case 'geo:sviluppo': return this.sviluppo(sorte)
      default: return sorte.forse(0.66) ? this.qualeFigura(sorte, false) : this.nomeFigura(sorte, false)
    }
  }

  /* ── grado 1: le figure e i nomi ── */

  /* il nome è scritto, le figure sono disegnate.
     `quadri` sceglie da che metà del mazzo pescare: i quadrilateri sono
     una tipologia a sé — quadrato, rettangolo, rombo e trapezio si
     confondono fra loro, mentre nessuno scambia un cerchio per un
     triangolo — e chi chiede la domanda decide quale delle due vuole. */
  qualeFigura(sorte, quadri) {
    const b = sorte.uno(figureDi(quadri))
    const colore = sorte.uno(COLORI)
    const falsi = vicine(b, 3, sorte)
    return domanda({
      testo: `Quale di queste figure è un ${b.nome}?`,
      buona: scena(scenaFigura(b.forma, colore, sorte.uno(GIRI))),
      falsi: falsi.map(f => scena(scenaFigura(f.forma, colore, sorte.uno(GIRI)), `questo è un ${f.nome}: ${f.dritta}`)),
      chiave: b.lati === 4 ? 'geo:quadrilateri' : 'geo:figure',
      aiuto: b.dritta,
      sorte,
    })
  }

  /* la figura è disegnata, i nomi sono scritti */
  nomeFigura(sorte, quadri) {
    const b = sorte.uno(figureDi(quadri))
    const falsi = vicine(b, 3, sorte)
    return domanda({
      testo: 'Come si chiama questa figura?',
      soggetto: scena(scenaFigura(b.forma, sorte.uno(COLORI), sorte.uno(GIRI))),
      buona: testo(b.nome),
      falsi: falsi.map(f => testo(f.nome, f.dritta)),
      chiave: b.lati === 4 ? 'geo:quadrilateri' : 'geo:figure',
      aiuto: b.dritta,
      sorte,
    })
  }

  /* ── grado 2: contare, e gli angoli ── */

  contaLati(sorte) {
    const b = sorte.uno(FIGURE.filter(f => f.lati >= 3))
    const cosa = sorte.uno(['lati', 'angoli', 'vertici (le punte)'])
    return domanda({
      testo: `Quanti ${cosa} ha questa figura?`,
      soggetto: scena(scenaFigura(b.forma, sorte.uno(COLORI), sorte.uno(GIRI))),
      buona: testo(b.lati),
      falsi: attorno(b.lati, sorte).map(n => testo(n, 'conta girando intorno alla figura e fermati dove sei partito')),
      chiave: 'geo:lati',
      aiuto: `${b.dritta} — lati, angoli e vertici sono sempre lo stesso numero`,
      sorte,
    })
  }

  /* l'angolo è disegnato, il nome è scritto */
  cheAngolo(sorte) {
    const specie = sorte.uno(['acuto', 'retto', 'ottuso'])
    /* si sta lontani dai 90 gradi: un angolo di 85 non è una domanda
       difficile, è una domanda a cui non si può rispondere guardando.
       E lontani dai 180, dove un angolo sembra una riga dritta. */
    const gradi = specie === 'retto' ? 90
      : specie === 'acuto' ? sorte.fra(5, 15) * 5      // da 25 a 75
        : sorte.fra(21, 31) * 5                        // da 105 a 155
    const spiega = {
      acuto: 'l\'angolo acuto è più stretto di un angolo retto: è appuntito',
      retto: 'l\'angolo retto è preciso come lo spigolo di un foglio',
      ottuso: 'l\'angolo ottuso è più aperto di un angolo retto',
    }
    return domanda({
      testo: 'Che angolo è questo?',
      soggetto: scena({ che: 'angolo', gradi, ruota: sorte.fra(0, 7) * 0.7854, colore: sorte.uno(COLORI) }),
      buona: testo(specie),
      falsi: ['acuto', 'retto', 'ottuso'].filter(s => s !== specie).map(s => testo(s, spiega[s])),
      chiave: 'geo:angoli',
      aiuto: spiega[specie],
      sorte,
    })
  }

  /* il nome è scritto, gli angoli sono disegnati */
  qualeAngolo(sorte) {
    const specie = sorte.uno(['acuto', 'retto', 'ottuso'])
    const colore = sorte.uno(COLORI)
    const acuti = () => sorte.fra(5, 15) * 5
    const ottusi = () => sorte.fra(21, 31) * 5
    const quanto = s => (s === 'retto' ? 90 : s === 'acuto' ? acuti() : ottusi())
    const buono = quanto(specie)
    /* le altre due specie ci sono tutte e due: tre falsi tutti ottusi
       farebbero passare la domanda per un confronto fra ottusi */
    const altre = ['acuto', 'retto', 'ottuso'].filter(s => s !== specie)
    /* il terzo falso non può essere un altro angolo retto: di retti ce
       n'è uno solo, ed è già stato preso */
    const ordine = [...sorte.mescola(altre), sorte.uno(altre.filter(s => s !== 'retto'))]
    const scelte = new Set([buono])
    const falsi = []
    for (const altra of ordine) {
      for (let giri = 0; giri < 20; giri++) {
        const g = quanto(altra)
        if (scelte.has(g)) continue
        scelte.add(g)
        falsi.push([g, altra])
        break
      }
    }
    const spiega = {
      acuto: 'questo è acuto: più stretto di un angolo retto',
      retto: 'questo è retto: preciso come lo spigolo di un foglio',
      ottuso: 'questo è ottuso: più aperto di un angolo retto',
    }
    const scenaAngolo = g => ({ che: 'angolo', gradi: g, ruota: sorte.fra(0, 7) * 0.7854, colore })
    return domanda({
      testo: `Quale di questi è un angolo ${specie}?`,
      buona: scena(scenaAngolo(buono)),
      falsi: falsi.map(([g, s]) => scena(scenaAngolo(g), spiega[s])),
      chiave: 'geo:angoli',
      aiuto: 'confronta l\'apertura con lo spigolo di un foglio: quello è l\'angolo retto',
      sorte,
    })
  }

  /* ── grado 3: la simmetria ── */

  /* quale metà completa la figura: la metà giusta è quella SPECCHIATA,
     e il falso più importante è la stessa metà solo ricopiata */
  meta(sorte) {
    const colonne = sorte.uno([2, 3, 3])
    const righe = sorte.fra(3, 4)
    let lung = null
    for (let t = 0; t < 40 && !lung; t++) {
      const q = Array.from({ length: righe }, () => sorte.fra(1, colonne))
      if (new Set(q).size > 1 && q.join() !== q.slice().reverse().join()) lung = q
    }
    if (!lung) lung = [1, 2, 2, 3].slice(0, righe).map(v => Math.min(v, colonne))

    const righeIn = misure => misure.flatMap((l, r) => Array.from({ length: l }, (_, i) => [i, r]))
    const attaccateADestra = misure => misure.flatMap((l, r) =>
      Array.from({ length: l }, (_, i) => [colonne - 1 - i, r]))

    const mostrata = attaccateADestra(lung)
    const buona = righeIn(lung)
    const candidati = [
      [attaccateADestra(lung), 'questa è la stessa metà ricopiata, non specchiata: allo specchio si ribalta'],
      [righeIn(lung.slice().reverse()), 'lo specchio ribalta destra e sinistra, non sopra e sotto'],
    ]
    for (let r = 0; r < righe; r++) {
      const q = lung.slice()
      q[r] = q[r] === colonne ? q[r] - 1 : q[r] + 1
      candidati.push([righeIn(q), 'qui un quadretto non torna: piegando, le due metà non si coprirebbero'])
    }

    const visti = new Set([impronta(buona)])
    const falsi = []
    for (const [celle, perche] of candidati) {
      const k = impronta(celle)
      if (visti.has(k)) continue
      visti.add(k)
      falsi.push([celle, perche])
      if (falsi.length === 3) break
    }
    const colore = sorte.uno(COLORI)
    return domanda({
      testo: 'Quale metà completa la figura?',
      soggetto: scena(scenaGriglia(mostrata, colonne, righe, colore, 'destra')),
      buona: scena(scenaGriglia(buona, colonne, righe, colore, 'sinistra')),
      falsi: falsi.map(([c, p]) => scena(scenaGriglia(c, colonne, righe, colore, 'sinistra'), p)),
      chiave: 'geo:simmetria',
      aiuto: 'la metà che manca è quella riflessa: quello che tocca la piega resta lungo la piega',
      sorte,
    })
  }

  /* quale figura è simmetrica: una sola si piega a metà e si copre */
  simmetriche(sorte) {
    const meta = sorte.uno([2, 3])
    const righe = sorte.fra(3, 4)
    let lung = null
    for (let t = 0; t < 40 && !lung; t++) {
      const q = Array.from({ length: righe }, () => sorte.fra(1, meta))
      if (new Set(q).size > 1) lung = q
    }
    if (!lung) lung = Array.from({ length: righe }, (_, i) => (i === 0 ? 1 : meta))

    const intera = (misure, storta = -1, di = 0) => misure.flatMap((l, r) => {
      const destra = l + (r === storta ? di : 0)
      const celle = []
      for (let i = 0; i < l; i++) celle.push([meta - 1 - i, r])
      for (let i = 0; i < destra; i++) celle.push([meta + i, r])
      return celle
    })

    const buona = intera(lung)
    const visti = new Set([impronta(buona)])
    const falsi = []
    for (const r of sorte.mescola([...Array(righe).keys()])) {
      for (const di of sorte.mescola([1, -1])) {
        if (lung[r] + di < 0) continue
        const celle = intera(lung, r, di)
        const k = impronta(celle)
        if (visti.has(k) || simmetrica(celle)) continue
        visti.add(k)
        falsi.push(celle)
        break
      }
      if (falsi.length === 3) break
    }
    if (falsi.length < 3) return this.meta(sorte)      // caso raro: si cambia domanda

    const colore = sorte.uno(COLORI)
    const { colonne, sposta } = attornoAllaPiega([buona, ...falsi], meta)
    return domanda({
      testo: 'Quale di queste figure è simmetrica?',
      buona: scena(scenaGriglia(sposta(buona), colonne, righe, colore)),
      falsi: falsi.map(c => scena(scenaGriglia(sposta(c), colonne, righe, colore),
        'da una parte c\'è un quadretto in più: piegandola a metà non si copre')),
      chiave: 'geo:simmetria',
      aiuto: 'una figura è simmetrica se piegandola a metà le due parti si coprono in pieno',
      sorte,
    })
  }

  /* dove si piega: la stessa domanda di prima senza la parola «asse».
     La figura è sempre una di quelle che si piegano in UN MODO SOLO, se
     no ci sarebbero due risposte giuste — e la risposta è un disegno
     con la riga tracciata, così si sceglie guardando invece di dover
     sapere come si chiama. */
  dovePiega(sorte) {
    const [forma, asse] = sorte.uno(ASSATE)
    const colore = sorte.uno(COLORI)
    return domanda({
      testo: 'Lungo quale riga si può piegare la figura, in modo che le due metà si coprano?',
      soggetto: scena(scenaFigura(forma, colore)),
      buona: scena(scenaFigura(forma, colore, 0, asse)),
      falsi: VERSI_ASSE.filter(a => a !== asse).map(a =>
        scena(scenaFigura(forma, colore, 0, a), `piegando lungo questa riga le due parti non si coprono`)),
      chiave: 'geo:piega',
      aiuto: `la piega giusta è quella ${DICE_ASSE[asse]}: da una parte e dall'altra c'è la stessa cosa`,
      sorte,
    })
  }

  /* ── grado 4: girare con la mente ── */

  /* la figura girata di un quarto (o di mezzo giro). Fra i falsi c'è
     sempre quella specchiata: è l'errore che fanno tutti. */
  giraQuarto(sorte) {
    const pezzo = sorte.uno(PEZZI)
    const n = Math.max(larghezza(pezzo), altezza(pezzo))
    const partenza = sorte.uno(orientazioni(pezzo))
    const [dice, quanti] = sorte.uno([
      ['di un quarto di giro in senso orario ↻ (come le lancette)', 1],
      ['di un quarto di giro in senso antiorario ↺ (al contrario delle lancette)', 3],
      ['di mezzo giro ↻↻', 2],
    ])
    const buona = giraTante(partenza, quanti)
    const spiega = q =>
      q === 0 ? 'questa non è girata per niente'
        : quanti === 2 ? 'questo è solo un quarto di giro, non mezzo'
          : q === 2 ? 'questo è mezzo giro, non un quarto'
            : 'questa è girata dalla parte sbagliata'

    const candidati = [[specchia(buona), 'questa è la figura allo specchio: girandola non ci arrivi mai']]
    for (const q of sorte.mescola([0, 1, 2, 3].filter(q => q !== quanti)))
      candidati.push([giraTante(partenza, q), spiega(q)])

    const visti = new Set([impronta(buona)])
    const falsi = []
    for (const [celle, perche] of candidati) {
      const k = impronta(celle)
      if (visti.has(k)) continue
      visti.add(k)
      falsi.push([celle, perche])
      if (falsi.length === 3) break
    }
    const colore = sorte.uno(COLORI)
    return domanda({
      testo: `Come diventa questa figura girata ${dice}?`,
      soggetto: scena(scenaPezzo(partenza, n, colore)),
      buona: scena(scenaPezzo(buona, n, colore)),
      falsi: falsi.map(([c, p]) => scena(scenaPezzo(c, n, colore), p)),
      chiave: 'geo:rotazione',
      aiuto: 'gira anche la testa: guarda dove va a finire il quadretto che sporge',
      sorte,
    })
  }

  /* girata sì, specchiata no: i tre falsi sono tutti la stessa figura
     riflessa, messa in tre versi diversi */
  stessaGirata(sorte) {
    const pezzo = sorte.uno(PEZZI)
    const n = Math.max(larghezza(pezzo), altezza(pezzo))
    const partenza = sorte.uno(orientazioni(pezzo))
    const buona = giraTante(partenza, sorte.uno([1, 2, 3]))
    const riflessa = specchia(partenza)
    const falsi = sorte.alcuni([0, 1, 2, 3], 3).map(q => giraTante(riflessa, q))
    const colore = sorte.uno(COLORI)
    return domanda({
      testo: 'Quale è la stessa figura solo girata, e non allo specchio?',
      soggetto: scena(scenaPezzo(partenza, n, colore)),
      buona: scena(scenaPezzo(buona, n, colore)),
      falsi: falsi.map(c => scena(scenaPezzo(c, n, colore),
        'questa è allo specchio: ha il gancio dalla parte opposta e girando non ci arrivi')),
      chiave: 'geo:specchio',
      aiuto: 'girare non cambia il verso: se la figura si è ribaltata come in uno specchio, non è quella',
      sorte,
    })
  }

  /* ── grado 5: i solidi ── */

  nomeSolido(sorte) {
    const b = sorte.uno(SOLIDI)
    const falsi = sorte.distrattori(SOLIDI, 3, s => s.tipo === b.tipo)
    return domanda({
      testo: 'Come si chiama questo solido?',
      soggetto: scena({ che: 'solido', tipo: b.tipo, colore: sorte.uno(COLORI) }),
      buona: testo(b.nome),
      falsi: falsi.map(s => testo(s.nome, s.dritta)),
      chiave: 'geo:solidi',
      aiuto: b.dritta,
      sorte,
    })
  }

  qualeSolido(sorte) {
    const b = sorte.uno(SOLIDI)
    const colore = sorte.uno(COLORI)
    const falsi = sorte.distrattori(SOLIDI, 3, s => s.tipo === b.tipo)
    return domanda({
      testo: `Quale di questi solidi è un ${b.nome}?`,
      buona: scena({ che: 'solido', tipo: b.tipo, colore }),
      falsi: falsi.map(s => scena({ che: 'solido', tipo: s.tipo, colore }, `questo è ${s.nome === 'sfera' ? 'una' : 'un'} ${s.nome}: ${s.dritta}`)),
      chiave: 'geo:solidi',
      aiuto: b.dritta,
      sorte,
    })
  }

  /* facce, spigoli e vertici: i falsi sono gli ALTRI due conti dello
     stesso solido, che è esattamente come ci si confonde */
  contaFacce(sorte) {
    const b = sorte.uno(CONTABILI)
    const cosa = sorte.uno(['facce', 'spigoli', 'vertici'])
    const altri = ['facce', 'spigoli', 'vertici'].filter(c => c !== cosa).map(c => b[c])
    return domanda({
      testo: `Quanti ${NOMI_CONTO[cosa]} ha questo solido?`,
      soggetto: scena({ che: 'solido', tipo: b.tipo, colore: sorte.uno(COLORI) }),
      buona: testo(b[cosa]),
      falsi: attorno(b[cosa], sorte, sorte.mescola(altri)).map(n =>
        testo(n, 'le facce sono i pezzi piatti, gli spigoli gli orli, i vertici le punte')),
      chiave: 'geo:facce',
      aiuto: b.dritta,
      sorte,
    })
  }

  /* cosa si vede schiacciando il solido su un foglio */
  vista(sorte) {
    const b = sorte.uno(SOLIDI)
    const dallalto = sorte.forse()
    const forma = dallalto ? b.alto : b.lato
    const colore = sorte.uno(COLORI)
    const vietate = [forma, ...(LITIGA[forma] || [])]
    const falsi = sorte.distrattori(SAGOME, 3, s => vietate.includes(s))
    return domanda({
      testo: dallalto
        ? 'Cosa si vede guardando questo solido dall\'alto?'
        : 'Cosa si vede guardando questo solido di fianco?',
      soggetto: scena({ che: 'solido', tipo: b.tipo, colore }),
      buona: scena(scenaFigura(forma, colore)),
      falsi: falsi.map(s => scena(scenaFigura(s, colore),
        `da ${dallalto ? 'sopra' : 'di fianco'} ${['sfera', 'piramide'].includes(b.tipo) ? 'la' : 'il'} ${b.nome} non si vede un ${PER_FORMA[s]?.nome || s}`)),
      chiave: 'geo:viste',
      aiuto: `${b.dritta} — immagina di appoggiarci sopra un foglio e di ricalcare il bordo`,
      sorte,
    })
  }

  /* ── grado 6: i cubetti ── */

  /* una costruzione con almeno un cubetto nascosto: senza quello la
     domanda si risolve contando i quadrati sul disegno, e questo grado
     non varrebbe niente. Si tira finché non ne esce una buona, e dopo
     un po' di tentativi si ripiega su un blocco pieno — che un cubetto
     dentro ce l'ha sempre. */
  costruzione(sorte, { base = 0, tetto = 3, nascosti = true, pieno = true } = {}) {
    const b = base || sorte.uno([2, 2, 3])
    const va = cubi => cubi.length >= 4
      && (!nascosti || visibili(cubi) < cubi.length)
      && (pieno || cubi.length < b * b * tetto)
    for (let prova = 0; prova < 40; prova++) {
      const alte = Array.from({ length: b * b }, () => sorte.fra(prova < 25 ? 0 : 1, tetto))
      const cubi = colonneDi(b, alte)
      if (va(cubi)) return { b, cubi }
    }
    /* la rete di sicurezza: un blocco pieno tranne una colonna, che ha
       sempre un cubetto nascosto e non riempie mai la scatola */
    const alte = Array(b * b).fill(tetto)
    alte[alte.length - 1] = Math.max(1, tetto - 1)
    return { b, cubi: colonneDi(b, alte) }
  }

  /* quanti cubetti ci vogliono, compresi quelli che il disegno copre */
  contaCubetti(sorte) {
    const { cubi } = this.costruzione(sorte)
    const quanti = cubi.length
    const visti = visibili(cubi)
    const falsi = [testo(visti, 'questi sono quelli che si vedono: dietro e sotto ce ne sono altri che reggono i primi')]
    for (const n of attorno(quanti, sorte, [visti + 1])) {
      if (n === visti || falsi.some(f => f.testo === String(n))) continue
      falsi.push(testo(n, 'ricontrolla una colonna alla volta: quelle in fondo si vedono solo per metà'))
      if (falsi.length === 3) break
    }
    return domanda({
      testo: 'Quanti cubetti ci vogliono per fare questa costruzione?',
      soggetto: scena({ che: 'costruzione', cubi, colore: sorte.uno(COLORI) }),
      buona: testo(quanti),
      falsi: falsi.slice(0, 3),
      chiave: 'geo:cubetti',
      aiuto: 'conta una torretta alla volta, anche quelle dietro: un cubetto coperto c\'è lo stesso, se no quello sopra cadrebbe',
      sorte,
    })
  }

  /* quanti ne mancano per riempire la scatola: lo stesso conto di
     prima più una sottrazione, ed è il primo posto dove si tocca il
     volume senza chiamarlo così */
  mancanoCubetti(sorte) {
    const b = sorte.uno([2, 2, 3])
    /* la costruzione sta DENTRO la scatola, quindi il tetto è `b`; e
       non la riempie mai, se no la risposta sarebbe zero */
    const { cubi } = this.costruzione(sorte, { base: b, tetto: b, nascosti: b > 2, pieno: false })
    const scatola = b * b * b
    const ci = cubi.length
    const giusto = scatola - ci

    /* i numeri già in tavola, il giusto compreso: i due falsi buoni —
       la scatola intera e i cubetti che ci sono già — possono cadere
       proprio sulla risposta (metà scatola: ce ne sono 4, ne mancano 4)
       e allora due tasti direbbero la stessa cosa */
    const visti = new Set([giusto])
    const falsi = []
    const metti = (n, perche) => {
      if (n < 0 || visti.has(n) || falsi.length >= 3) return
      visti.add(n)
      falsi.push(testo(n, perche))
    }
    metti(scatola, `${scatola} sono tutti quelli della scatola piena: qualcuno però c'è già`)
    metti(ci, 'quelli sono i cubetti che ci sono già, non quelli che mancano')
    for (const n of attorno(giusto, sorte))
      metti(n, 'conta prima quanti ce ne sono, poi togli quel numero da quelli della scatola piena')
    return domanda({
      testo: `Questi cubetti stanno in una scatola ${b}×${b}×${b}. Quanti ne mancano per riempirla?`,
      soggetto: scena({ che: 'costruzione', cubi, colore: sorte.uno(COLORI) }),
      buona: testo(giusto),
      falsi: falsi.slice(0, 3),
      chiave: 'geo:cubetti',
      aiuto: `una scatola ${b}×${b}×${b} tiene ${scatola} cubetti: conta quelli che ci sono e togli`,
      sorte,
    })
  }

  /* il dado aperto: quale ritaglio, piegato, si chiude */
  sviluppo(sorte) {
    const buono = sorte.uno(orientazioni(sorte.uno(SVILUPPI)))
    const visti = new Set([impronta(buono)])
    const falsi = []
    for (const r of sorte.mescola(NON_SVILUPPI)) {
      const c = sorte.uno(orientazioni(r))
      if (visti.has(impronta(c))) continue
      visti.add(impronta(c))
      falsi.push(c)
      if (falsi.length === 3) break
    }
    const n = Math.max(...[buono, ...falsi].map(c => Math.max(larghezza(c), altezza(c))))
    const colore = sorte.uno(COLORI)
    return domanda({
      testo: 'Quale di questi ritagli, piegato, diventa un cubo?',
      buona: scena(scenaPezzo(buono, n, colore)),
      falsi: falsi.map(c => scena(scenaPezzo(c, n, colore),
        'questo no: piegandolo due quadretti finiscono uno sopra l\'altro, e da un\'altra parte resta un buco')),
      chiave: 'geo:sviluppo',
      aiuto: 'tieni fermo un quadretto e piega gli altri intorno a quello: al dado servono sei facce, una per parte, senza sovrapporne due',
      sorte,
    })
  }
}

export default new Geometria()
