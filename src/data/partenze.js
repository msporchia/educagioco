/* Le quattro partenze scelte quando si aggiunge un bambino: un pugno di
   eccezioni scritte una volta, non un campo che resta (dopo si tocca tutto
   a mano, come sempre). Un gioco che il profilo non nomina vale quello che
   la partenza di oggi scriverebbe (letto ogni volta, mai congelato): vedi
   docs/apprendimento/eta-e-portata.md. I giochi si calcolano dai flag del
   manifesto (`piccoli`/`grandi`), i saperi si elencano qui uno per uno — il
   criterio e le fonti sono in docs/apprendimento/saperi-per-fascia.md.
   `test/unita/partenze.test.mjs` pretende un verdetto (`tiene`) per ogni
   sapere non spento, altrimenti un test che guarda solo cosa c'è non vede
   l'errore per omissione (è già successo due volte). */
import { GIOCHI } from './giochi.js'
// l'età (`anni`) dice quali domande arrivano — non sostituisce i saperi, che dicono cosa si dà per scontato
// `nome` è come si legge su una carta, `come` è come si legge dentro una frase («come in prima o seconda»)
export const PARTENZE = [
  {
    chiave: 'piccoli',
    come: 'prima della scuola',
    nome: 'Non va ancora a scuola',
    eta: '4-6 anni',
    che: 'Solo i giochi che non chiedono di saper leggere, e in cui non si può perdere.',
    soloPiccoli: true, // tutti i giochi spenti tranne quelli che si dichiarano per i piccoli
    anni: 5,
    // il verdetto positivo (vedi saperi-per-fascia.md): quello che qui manca è quello che a scuola non ha incontrato
    saperi: ['moltiplicazioni', 'divisioni', 'misure', 'conversioni', 'decine',
             'stima', 'problemi', 'orologio', 'date', 'area-perimetro', 'solidi',
             'spazio-mente', 'analisi', 'flessione', 'presente', 'tempi-verbali',
             'accenti', 'suoni-difficili', 'frazioni',
             'lettura', 'sillabe', 'griglia', 'calendario', 'simmetria',
             'deduzione', 'incertezza', 'insiemi', 'confronti', 'analogie',
             'denaro', 'decimali', 'adattamento', 'bilance', 'dati', 'comprensione'],
    tiene: {
      numeri: 'contare fino a dieci e dire chi è di più si fa prima della scuola',
      figure: 'il cerchio e il quadrato si riconoscono dai libri illustrati',
      lessico: 'i contrari — grande e piccolo, caldo e freddo — si imparano parlando',
      sequenze: 'rosso, blu, rosso, blu è un gioco da tavolino, non una lezione',
      ambienti: 'dove vive il pinguino arriva dai cartoni, non da un\'ora di geografia',
    },
  },
  {
    chiave: 'prima',
    come: 'prima o seconda',
    nome: 'Prima o seconda',
    eta: '6-7 anni',
    che: 'Legge ancora a fatica: niente tabelline, niente misure, niente domande scritte lunghe.',
    nienteGrandi: true, // l'unica che tiene le due estremità in casa: i piccoli restano, si spengono i grandi
    anni: 6.5,
    saperi: ['moltiplicazioni', 'divisioni', 'misure', 'conversioni', 'decine',
             'stima', 'problemi', 'orologio', 'date', 'area-perimetro', 'solidi',
             'spazio-mente', 'analisi', 'flessione', 'presente', 'tempi-verbali',
             'accenti', 'suoni-difficili', 'frazioni', 'denaro', 'decimali', 'adattamento'],
    tiene: {
      lettura: 'in prima si impara a leggere: è esattamente quello che si sta facendo',
      comprensione: 'due frasi con chi e dove si leggono a fine prima; i testi più lunghi li tiene lontani l\'età',
      sillabe: 'le sillabe e le rime sono il primo mese di prima',
      griglia: 'la casella B3 e le frecce si fanno sul quaderno a quadretti, in prima',
      calendario: 'i giorni e i mesi si appendono al muro il primo giorno di scuola',
      simmetria: 'la farfalla piegata a metà è di prima',
      deduzione: 'a sei anni si tira la conclusione da una regola detta a voce',
      incertezza: '«non si può sapere» è la risposta che si impara a dare a questa età',
      insiemi: '«tutti» e «nessuno» si usano parlando, prima che a scuola',
      confronti: 'mettere in fila tre bambini per altezza si fa in cortile',
      analogie: 'il cane sta all\'osso: si capisce a voce, senza saper leggere',
      bilance: 'il numero che manca (5 + □ = 8) si fa sul quaderno di prima; le bilance vere arrivano dopo, e senza divisioni restano spente da sole',
      dati: 'il pittogramma della classe si fa in prima; le barre e la legenda si spiegano in una riga',
    },
  },
  {
    chiave: 'terza',
    come: 'terza elementare',
    nome: 'Terza elementare',
    eta: '8 anni',
    che: 'Moltiplicazioni sì, divisioni no. Niente metri, litri e chili: quelli arrivano dopo.',
    nientePiccoli: true,
    anni: 8,
    // le quattro geo: si spengono a sottovoce, non a gruppo, per non portarsi via quello che resta acceso (vedi tiene)
    saperi: ['divisioni', 'misure', 'conversioni',
             'geo:rotazione', 'geo:cubetti', 'geo:sviluppo', 'geo:viste',
             'decimali'],
    tiene: {
      moltiplicazioni: 'le tabelline sono di terza: è la riga che dà il nome a questa fascia',
      denaro: 'contare monete e banconote, dare il resto e capire quanto costano più cose sono di seconda e terza',
      decine: 'il valore posizionale fino alle migliaia è di terza',
      stima: 'arrotondare arriva dopo, ma si spiega in una riga — e la spiegazione c\'è',
      problemi: 'due operazioni di fila e i dati che non servono sono di terza',
      orologio: 'ore, mezze, quarti e minuti sono di seconda',
      date: 'quanti giorni passano fra due date è di seconda',
      'area-perimetro': 'contare i quadretti e i passi del bordo è di terza; le formule sono di quinta e non si chiedono',
      solidi: 'i nomi e il contare le facce restano; le viste dall\'alto sono spente qui sopra, per sottovoce',
      'spazio-mente': 'la figura allo specchio è di seconda e resta; le rotazioni e i cubetti sono spenti qui sopra',
      analisi: 'i nomi delle parti del discorso sono di terza',
      flessione: 'plurali, generi e articoli sono di prima',
      presente: 'il presente indicativo è di seconda',
      'tempi-verbali': 'passato prossimo e imperfetto si cominciano in terza',
      accenti: 'accenti, apostrofi e la lettera h sono di seconda',
      'suoni-difficili': 'gn, gl, sc e le doppie sono di prima',
      adattamento: 'è l\'obiettivo di fine terza, e a otto anni ci siamo',
      frazioni: 'la frazione come parte colorata di una figura è di terza, e il resto si spiega nella carta: sotto i pezzi, sopra i colorati',
    },
  },
  {
    chiave: 'quarta',
    come: 'quarta o quinta',
    nome: 'Quarta o quinta',
    eta: '9-10 anni',
    che: 'Tutto acceso, tranne i giochi per i più piccoli.',
    nientePiccoli: true,
    anni: 9.5,
    // vuota, verificato: quello che resterebbe da spegnere nasce già spento altrove; copre da 8,75 anni, anche gli undicenni
    saperi: [],
    tiene: {
      divisioni: 'le divisioni in colonna sono di quarta',
      misure: 'metri, litri e chili si cominciano in terza e si consolidano qui',
      conversioni: 'le equivalenze sono di quarta',
      solidi: 'viste dall\'alto e facce sono di quinta, e da 8,75 anni in su ci siamo',
      'spazio-mente': 'le rotazioni sono di quarta, lo sviluppo del cubo di quinta',
      decimali: 'il numero con la virgola come numero — decimi, centesimi, confronto e arrotondamento — è di quarta e quinta',
    },
  },
]

export const partenza = chiave => PARTENZE.find(p => p.chiave === chiave) || null

// la fascia è una conseguenza dell'età (unica manopola, non più due), la più vicina; il pari va alla più piccola
export function partenzaPerEta (anni) {
  const e = Number(anni)
  if (!Number.isFinite(e)) return null
  return PARTENZE.reduce((meglio, p) =>
    Math.abs(p.anni - e) < Math.abs(meglio.anni - e) ? p : meglio, PARTENZE[0])
}

export const eccezioniPerEta = anni => {
  const p = partenzaPerEta(anni)
  return p ? { ...eccezioniDi(p.chiave), eta: Number(anni) } : { giochi: {}, sa: {}, eta: null }
}

// tre stati, non due: false spento, assenza acceso, true per esteso = tienilo comunque (fissaGioco), vedi ritocchi.md
const segno = v => v === false ? 'no' : v === true ? 'si' : '—'

// quante voci differiscono dal difetto della fascia: rende la conferma una domanda vera, non un «sei sicuro?»
const quanteDiverse = (mia, difetto) => {
  const chiavi = new Set([...Object.keys(mia || {}), ...Object.keys(difetto || {})])
  let n = 0
  for (const k of chiavi) if (segno(mia?.[k]) !== segno(difetto?.[k])) n++
  return n
}

// il contatore deve dire le stesse righe che il quadro colora (aMano): l'asimmetria gioco/sapere è voluta, vedi ritocchi.md
const giochiAMano = (mia, difetto) => Object.keys(mia || {})
  .filter(k => mia[k] === true || (mia[k] === false && difetto?.[k] !== false)).length

// un conto solo: due funzioni potrebbero dare due risposte diverse (una che chiede, una che non chiede)
const messeAMano = ({ giochi, sa, ritocchi }, difetti) => ({
  giochi: giochiAMano(giochi, difetti.giochi),
  sa: quanteDiverse(sa, difetti.sa),
  ritocchi: Object.keys(ritocchi || {}).length,
})

// tre casi (stessa fascia, fascia diversa sui difetti, fascia diversa su misura): vedi docs/genitori/manopola.md
export function spostandoLEta ({ da, a, giochi = {}, sa = {}, ritocchi = {} }) {
  const nuove = eccezioniPerEta(a)
  const prima = partenzaPerEta(da)
  const dopo = partenzaPerEta(a)
  const stessaFascia = !!prima && !!dopo && prima.chiave === dopo.chiave
  // i ritocchi contano come «su misura»: sono correzioni sopra l'età, e ripartire dai difetti li porterebbe via
  const difetti = prima ? eccezioniDi(prima.chiave) : { giochi: {}, sa: {} }
  const aMano = messeAMano({ giochi, sa, ritocchi }, difetti)
  const suMisura = !!prima && aMano.giochi + aMano.sa + aMano.ritocchi > 0

  const perde = stessaFascia ? { giochi: 0, sa: 0, ritocchi: 0 } : aMano // zeri e non null: chi mostra non deve distinguere i due casi

  return {
    eta: Number(a),
    giochi: stessaFascia ? giochi : nuove.giochi, // dentro la stessa fascia non si tocca niente
    sa: stessaFascia ? sa : nuove.sa,
    fascia: dopo,
    riscrive: !stessaFascia,
    chiede: !stessaFascia && suMisura,
    perde,
  }
}

// stesso conto di spostandoLEta ma senza spostare l'età: `cambia` dice se c'è qualcosa da buttare (vedi ritocchi.md)
export function rimettendoLEta ({ eta, giochi = {}, sa = {}, ritocchi = {} }) {
  const fascia = partenzaPerEta(eta)
  const difetti = fascia ? eccezioniDi(fascia.chiave) : { giochi: {}, sa: {} }
  const perde = messeAMano({ giochi, sa, ritocchi }, difetti)
  return {
    eta: Number(eta),
    giochi: difetti.giochi,
    sa: difetti.sa,
    fascia,
    perde,
    cambia: perde.giochi + perde.sa + perde.ritocchi > 0,
  }
}

// solo quello che va SPENTO, nella forma che `settings` usa già; una partenza sconosciuta non spegne niente
export function eccezioniDi (chiave) {
  const p = partenza(chiave)
  if (!p) return { giochi: {}, sa: {}, eta: null }

  const giochi = {}
  for (const g of GIOCHI) {
    // un posto (data/giochi.js) non si giudica per età; chi cresce non si spegne ai grandi (lo dice la portata)
    const spegni = !g.posto &&
      ((p.soloPiccoli && !g.piccoli) || (p.nientePiccoli && g.piccoli && !g.cresce) ||
       (p.nienteGrandi && g.grandi))
    if (spegni) giochi[g.chiave] = false
  }

  const sa = {}
  for (const s of p.saperi) sa[s] = false

  return { giochi, sa, eta: p.anni ?? null } // null = «lascia com'è»: non azzera l'età di chi ce l'aveva già
}
