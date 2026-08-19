/* ═══════════════════════════════════════════════════════════════════
   SILLABE — dividere le parole, sentirne le rime, trovare l'accento.

   La divisione in sillabe NON si calcola: le regole italiane (doppie,
   digrammi gn/gl/sc/ch/gh, gruppi con la s impura, dittonghi) sono
   troppe e piene di eccezioni, e una regex qui sbaglierebbe più che a
   indovinare. Le parole di questo file sono divise A MANO — vedi
   `DIVISE` — e la sola cosa che il codice calcola sono i FALSI: una
   divisione sbagliata plausibile si ottiene spostando di una lettera
   un taglio che è già giusto (`sillabeSbagliate`). È lo stesso motivo
   per cui «pal-la» letta come «pa-lla» o «montagna» letta come
   «mon-tag-na» sono errori veri, non lettere a caso.

   QUATTRO GRADI, tutti d'orecchio:
     1. quante sillabe ha la parola (facile, con l'emoji sotto gli occhi)
     2. come si divide (la doppia spezzata in mezzo, il digramma unito)
     3. le rime (e il suo rovescio: chi non fa rima)
     4. la sillaba che manca in un buco

   CE N'ERA UN QUINTO, l'accento tonico: la stessa parola con l'accento
   disegnato in tre punti diversi, e si sceglieva quello vero. È stato
   tolto, e il motivo vale la pena scriverlo perché non è di taratura:
   a quella domanda si risponde **dicendo la parola a voce alta**, e un
   bambino che gioca in silenzio — cioè quasi sempre — non ha modo di
   ragionarci e tira a indovinare. Le domande di nomenclatura sopra
   («tronca, piana, sdrucciola») erano già state tolte per una ragione
   parente: la risposta non si ricava, si ricorda.

   Le parole con l'accento scritto (città, perché, lunedì) non stanno in
   questo file: lì il segno risponde da sé, e sono materia di
   `ortografia`.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, emoji } from '../nucleo/domanda.js'

/* ── le parole divise a mano ──
   [parola, sillabe, emoji?]. L'emoji manca dove non c'è un modo onesto
   di disegnare la parola (uno strumento, una congiunzione…): resta
   comunque buona per dividere, solo non per il grado 1 (che vuole
   vedere la cosa prima di contare). */
const DIVISE = [
  ['casa', ['ca', 'sa'], '🏠'], ['sole', ['so', 'le'], '☀️'], ['luna', ['lu', 'na'], '🌙'],
  ['pane', ['pa', 'ne'], '🍞'], ['mano', ['ma', 'no'], '✋'], ['naso', ['na', 'so'], '👃'],
  ['mela', ['me', 'la'], '🍎'], ['rosa', ['ro', 'sa'], '🌹'], ['dado', ['da', 'do'], '🎲'],
  ['moto', ['mo', 'to'], '🏍️'], ['foto', ['fo', 'to'], '📷'], ['topo', ['to', 'po'], '🐭'],
  ['gufo', ['gu', 'fo'], '🦉'], ['lupo', ['lu', 'po'], '🐺'], ['muro', ['mu', 'ro']],
  ['dito', ['di', 'to'], '👆'], ['pila', ['pi', 'la'], '🔋'], ['riso', ['ri', 'so'], '🍚'],
  ['sale', ['sa', 'le'], '🧂'], ['domino', ['do', 'mi', 'no']],

  ['banana', ['ba', 'na', 'na'], '🍌'], ['formica', ['for', 'mi', 'ca'], '🐜'],
  ['gelato', ['ge', 'la', 'to'], '🍨'], ['pomodoro', ['po', 'mo', 'do', 'ro'], '🍅'],
  ['cioccolato', ['cioc', 'co', 'la', 'to'], '🍫'], ['farfalla', ['far', 'fal', 'la'], '🦋'],
  ['tartaruga', ['tar', 'ta', 'ru', 'ga'], '🐢'], ['bicicletta', ['bi', 'ci', 'clet', 'ta'], '🚲'],
  ['elefante', ['e', 'le', 'fan', 'te'], '🐘'], ['girasole', ['gi', 'ra', 'so', 'le'], '🌻'],
  ['coccinella', ['coc', 'ci', 'nel', 'la'], '🐞'], ['ombrello', ['om', 'brel', 'lo'], '☂️'],
  ['cavallo', ['ca', 'val', 'lo'], '🐴'], ['coniglio', ['co', 'ni', 'glio'], '🐰'],

  ['castagna', ['ca', 'sta', 'gna'], '🌰'], ['montagna', ['mon', 'ta', 'gna'], '⛰️'],
  ['famiglia', ['fa', 'mi', 'glia'], '👨‍👩‍👧'], ['bottiglia', ['bot', 'ti', 'glia'], '🍾'],
  ['occhiali', ['oc', 'chia', 'li'], '👓'], ['specchio', ['spec', 'chio'], '🪞'],
  ['orecchio', ['o', 'rec', 'chio'], '👂'], ['fischio', ['fi', 'schio'], '🔔'],
  ['chiave', ['chia', 've'], '🔑'], ['chitarra', ['chi', 'tar', 'ra'], '🎸'],
  ['traghetto', ['tra', 'ghet', 'to'], '⛴️'], ['ghiro', ['ghi', 'ro'], '🐿️'],
  ['fungo', ['fun', 'go'], '🍄'], ['cuscino', ['cu', 'sci', 'no'], '🛏️'],
  ['uscita', ['u', 'sci', 'ta'], '🚪'], ['pesce', ['pe', 'sce'], '🐟'],
  ['scena', ['sce', 'na'], '🎭'], ['pesca', ['pe', 'sca'], '🍑'],
  ['scarpa', ['scar', 'pa'], '👟'], ['scuola', ['scuo', 'la'], '🏫'],

  ['pasta', ['pa', 'sta'], '🍝'], ['festa', ['fe', 'sta'], '🎉'],
  ['finestra', ['fi', 'ne', 'stra'], '🪟'], ['minestra', ['mi', 'ne', 'stra'], '🍲'],
  ['questo', ['que', 'sto']], ['postino', ['po', 'sti', 'no'], '📬'],
  ['stella', ['stel', 'la'], '⭐'], ['stivali', ['sti', 'va', 'li'], '🥾'],

  ['gnomo', ['gno', 'mo'], '🧙'], ['lasagna', ['la', 'sa', 'gna'], '🍝'],
  ['vigna', ['vi', 'gna'], '🍇'], ['pigna', ['pi', 'gna'], '🌲'],
  ['sogno', ['so', 'gno'], '💤'], ['bagno', ['ba', 'gno'], '🛁'],
  ['legno', ['le', 'gno'], '🪵'], ['ragno', ['ra', 'gno'], '🕷️'],
  ['maglia', ['ma', 'glia'], '👕'], ['foglia', ['fo', 'glia'], '🍃'],
  ['paglia', ['pa', 'glia'], '🌾'], ['aglio', ['a', 'glio'], '🧄'],
  ['figlio', ['fi', 'glio'], '👦'],

  ['gomma', ['gom', 'ma'], '🧽'], ['cappello', ['cap', 'pel', 'lo'], '🎩'],
  ['sette', ['set', 'te'], '7️⃣'], ['babbo', ['bab', 'bo'], '👨'],
  ['pizza', ['piz', 'za'], '🍕'], ['palla', ['pal', 'la'], '⚽'],
  ['nonna', ['non', 'na'], '👵'], ['carrello', ['car', 'rel', 'lo'], '🛒'],
  ['riccio', ['ric', 'cio'], '🦔'], ['freccia', ['frec', 'cia'], '🎯'],
]

/* tutte le sillabe che compaiono, per pescare il finto buco al grado 4 */
const POOL_SILLABE = [...new Set(DIVISE.flatMap(w => w[1]))]

/* le parole facili, 2-3 sillabe e con l'emoji: il pubblico del grado 1 */
const FACILI = DIVISE.filter(w => w[2] && w[1].length <= 3)

/* ── le rime: famiglie che finiscono allo stesso modo ── */
const RIME = [
  { finale: 'one', parole: [
    { parola: 'pallone', emoji: '⚽' }, { parola: 'limone', emoji: '🍋' },
    { parola: 'leone', emoji: '🦁' }, { parola: 'bastone', emoji: '🦯' },
    { parola: 'sapone', emoji: '🧼' }, { parola: 'melone', emoji: '🍈' },
  ] },
  { finale: 'ino', parole: [
    { parola: 'topolino', emoji: '🐭' }, { parola: 'gattino', emoji: '🐱' },
    { parola: 'cagnolino', emoji: '🐕' }, { parola: 'pulcino', emoji: '🐤' },
    { parola: 'cestino', emoji: '🧺' }, { parola: 'giardino', emoji: '🌳' },
  ] },
  { finale: 'etto', parole: [
    { parola: 'letto', emoji: '🛏️' }, { parola: 'berretto', emoji: '🧢' },
    { parola: 'confetto', emoji: '🍬' }, { parola: 'biglietto', emoji: '🎫' },
    { parola: 'tetto', emoji: '🏠' },
  ] },
  { finale: 'ella', parole: [
    { parola: 'stella', emoji: '⭐' }, { parola: 'sorella', emoji: '👧' },
    { parola: 'campanella', emoji: '🔔' }, { parola: 'cannella', emoji: '🌿' },
  ] },
  { finale: 'alla', parole: [
    { parola: 'palla', emoji: '⚽' }, { parola: 'farfalla', emoji: '🦋' },
    { parola: 'stalla', emoji: '🐴' }, { parola: 'spalla', emoji: '💪' },
  ] },
  { finale: 'ane', parole: [
    { parola: 'cane', emoji: '🐶' }, { parola: 'pane', emoji: '🍞' },
    { parola: 'banane', emoji: '🍌' }, { parola: 'campane', emoji: '🔔' },
  ] },
  { finale: 'ello', parole: [
    { parola: 'ombrello', emoji: '☂️' }, { parola: 'cappello', emoji: '🎩' },
    { parola: 'coltello', emoji: '🔪' }, { parola: 'castello', emoji: '🏰' },
    { parola: 'martello', emoji: '🔨' },
  ] },
  { finale: 'otto', parole: [
    { parola: 'cappotto', emoji: '🧥' }, { parola: 'biscotto', emoji: '🍪' },
    { parola: 'risotto', emoji: '🍚' }, { parola: 'salotto', emoji: '🛋️' },
  ] },
  { finale: 'ale', parole: [
    { parola: 'animale', emoji: '🐾' }, { parola: 'giornale', emoji: '📰' },
    { parola: 'ospedale', emoji: '🏥' }, { parola: 'temporale', emoji: '⛈️' },
  ] },
]

/* ── le frasi, per non chiedere sempre con le stesse parole ── */
const FRASI_QUANTE = ['Quante sillabe ha questa parola?', 'In quante sillabe si divide?', 'Conta le sillabe: quante sono?']
const FRASI_DIVIDI = ['Come si divide in sillabe', 'Qual è la sillabazione giusta di', 'Qual è la divisione giusta di']
const FRASI_MANCA = ['Che sillaba manca?', 'Qual è la sillaba che manca?', 'Con che cosa si completa?']
const FRASI_RIMA = ['Quale parola fa rima con', 'Che cosa fa rima con', 'Trova la parola che fa rima con']
const FRASI_INTRUSO = ['Quale di queste NON fa rima con', 'Chi non fa rima con', 'Qual è l\'intruso: chi non fa rima con']

/* ── i confini fra le sillabe, come indici nella parola intera:
   servono solo a produrre i FALSI (spostare un taglio di una lettera),
   mai a trovare quello giusto — quello sta scritto sopra, a mano. ── */
function confiniDi(sillabe) {
  let acc = 0
  const b = []
  for (let i = 0; i < sillabe.length - 1; i++) { acc += sillabe[i].length; b.push(acc) }
  return b
}
function dividiA(parola, confini) {
  const parti = []
  let prima = 0
  for (const c of confini) { parti.push(parola.slice(prima, c)); prima = c }
  parti.push(parola.slice(prima))
  return parti.join('-')
}

/* una divisione sbagliata plausibile: sposta di una lettera un taglio
   che è già giusto. Su una doppia («pal-la») dà «pa-lla» o «pall-a»;
   su un digramma («mon-ta-gna») dà «mon-tag-na»: esattamente gli
   errori che fa un bambino. */
function sillabeSbagliate(sillabeGiuste, sorte, quante) {
  const parola = sillabeGiuste.join('')
  const giusti = confiniDi(sillabeGiuste)
  const corretto = sillabeGiuste.join('-')
  const trovati = new Set()
  let giri = 0
  while (trovati.size < quante && giri < 40 && giusti.length > 0) {
    giri++
    const idx = sorte.fra(0, giusti.length - 1)
    const nuovi = giusti.slice()
    nuovi[idx] += sorte.forse(0.5) ? 1 : -1
    nuovi.sort((a, b) => a - b)
    const validi = nuovi.every((v, i) => v >= 1 && v <= parola.length - 1 && (i === 0 || v > nuovi[i - 1]))
    if (!validi) continue
    const s = dividiA(parola, nuovi)
    if (s !== corretto) trovati.add(s)
  }
  /* ripiego per le parole cortissime, se il giro non ha trovato abbastanza */
  if (trovati.size < quante) trovati.add(parola)
  if (trovati.size < quante && parola.length > 2) trovati.add(parola.slice(0, 1) + '-' + parola.slice(1))
  return [...trovati].slice(0, quante)
}

/* Le tipologie: contare le sillabe e sentire le rime, che è orecchio
   puro e sta tutto nel suo gruppo.

   Ce n'era una sesta, **l'accento tonico** — «dove batte la voce», la
   stessa parola con l'accento disegnato in tre punti — e stava col
   gruppo degli accenti scritti invece che con le sillabe, perché è la
   stessa lezione. È stata tolta: la domanda si può rispondere solo
   dicendo la parola a voce alta, e un bambino che gioca in silenzio la
   tira a indovinare. Non è una lacuna di taratura, è una domanda che
   sullo schermo non funziona. */
const TIPI = [
  { chiave: 'sil:quante', nome: 'Quante sillabe ha la parola', sa: 'sillabe', gradi: { 1: 1 } },
  { chiave: 'sil:dividi', nome: 'Dividere in sillabe', sa: 'sillabe', gradi: { 2: 1 } },
  { chiave: 'sil:rima', nome: 'Le rime', sa: 'sillabe', gradi: { 3: 1 } },
  { chiave: 'sil:manca', nome: 'La sillaba che manca', sa: 'sillabe', gradi: { 4: 1 } },
]

class Sillabe extends Modulo {
  constructor() {
    super({
      id: 'sillabe',
      nome: 'Sillabe',
      icona: '✂️',
      materia: 'italiano',
      chiaro: 'dividere le parole in sillabe, riconoscere le rime e sentire dove batte l\'accento',
      scaletta: [
        'quante sillabe ha la parola',
        'come si divide in sillabe',
        'le rime',
        'la sillaba che manca',
      ],
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la scala è una
         sola per tutte le materie, e serve a confrontare questa riga
         con quelle di tutti gli altri moduli. Zero è il primo giorno
         di materna, cento la fine della primaria: dodici punti e mezzo
         per anno di scuola. Non dice a chi arriva — quello lo decide
         la finestra dell'età di chi gioca (`nucleo/classi.js`). */
      livelli: [25, 38, 44, 50],
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'sil:dividi': return this.dividi(sorte)
      case 'sil:rima': return this.rima(sorte)
      case 'sil:manca': return this.manca(sorte)
      default: return this.quante(sorte)
    }
  }

  /* grado 1: quante sillabe ha la parola, mostrata con l'emoji */
  quante(sorte) {
    const voce = sorte.uno(FACILI)
    const corretto = voce[1].length
    const papabili = [1, 2, 3, 4, 5].filter(n => n !== corretto && Math.abs(n - corretto) <= 2)
    const sbagliati = sorte.alcuni(papabili, Math.min(2, papabili.length))
    return domanda({
      testo: sorte.uno(FRASI_QUANTE),
      soggetto: testo(`${voce[2]} ${voce[0]}`),
      buona: testo(String(corretto)),
      falsi: sbagliati.map(n => testo(String(n), 'conta di nuovo, battendo le mani a ogni sillaba')),
      chiave: 'sil:quante',
      aiuto: `${voce[0]} si divide così: ${voce[1].join('-')}`,
      sorte,
    })
  }

  /* grado 2: come si divide */
  dividi(sorte) {
    const voce = sorte.uno(DIVISE)
    const falsi = sillabeSbagliate(voce[1], sorte, 2)
    return domanda({
      testo: `${sorte.uno(FRASI_DIVIDI)} «${voce[0]}»?`,
      soggetto: voce[2] ? emoji(voce[2]) : undefined,
      buona: testo(voce[1].join('-')),
      falsi: falsi.map(f => testo(f, 'qui il taglio è sbagliato')),
      chiave: 'sil:dividi',
      aiuto: 'le doppie si dividono sempre in mezzo; i gruppi come gn, gl, sc, ch restano uniti',
      sorte,
    })
  }

  /* grado 3: le rime, e ogni tanto il suo rovescio — chi non fa rima */
  rima(sorte) {
    const famiglia = sorte.uno(RIME)
    const base = sorte.uno(famiglia.parole)
    const compagne = famiglia.parole.filter(p => p.parola !== base.parola)
    if (sorte.forse(0.35) && compagne.length >= 2) {
      const mostrate = sorte.alcuni(compagne, 2)
      const altra = sorte.uno(RIME.filter(f => f.finale !== famiglia.finale))
      const fuori = sorte.uno(altra.parole)
      return domanda({
        testo: `${sorte.uno(FRASI_INTRUSO)} «${base.parola}»?`,
        buona: testo(fuori.parola, `finisce diverso: non è «-${famiglia.finale}»`),
        falsi: mostrate.map(p => testo(p.parola, `invece fa rima: finisce anche lei in «-${famiglia.finale}»`)),
        chiave: 'sil:rima',
        aiuto: `le parole in rima finiscono allo stesso modo: qui «-${famiglia.finale}»`,
        sorte,
      })
    }
    const compagna = sorte.uno(compagne)
    const altre = sorte.alcuni(RIME.filter(f => f.finale !== famiglia.finale), 2)
    return domanda({
      testo: `${sorte.uno(FRASI_RIMA)} «${base.parola}»?`,
      soggetto: emoji(base.emoji),
      buona: testo(compagna.parola),
      falsi: altre.map(f => testo(sorte.uno(f.parole).parola, `finisce diverso: non è «-${famiglia.finale}»`)),
      chiave: 'sil:rima',
      aiuto: `fa rima con «${base.parola}» perché finisce come lei: «-${famiglia.finale}»`,
      sorte,
    })
  }

  /* grado 4: la sillaba che manca, in un buco */
  manca(sorte) {
    const voce = sorte.uno(DIVISE)
    const sill = voce[1]
    const idx = sorte.fra(0, sill.length - 1)
    const buona = sill[idx]
    const modello = sill.map((s, i) => (i === idx ? '__' : s)).join('-')
    const falsi = sorte.distrattori(POOL_SILLABE, 2, s => s === buona)
    return domanda({
      testo: sorte.uno(FRASI_MANCA),
      soggetto: testo(modello),
      buona: testo(buona),
      falsi: falsi.map(f => testo(f, `non è la sillaba giusta per «${voce[0]}»`)),
      chiave: 'sil:manca',
      aiuto: `la parola è «${voce[0]}»: dilla piano, sillaba per sillaba`,
      sorte,
    })
  }

}

export default new Sillabe()
