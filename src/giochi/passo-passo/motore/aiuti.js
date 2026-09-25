/* ═══════════════════════════════════════════════════════════════════
   LA SCALA DEL 💡 — da ragionare a farsi scrivere la strada

   È la scala di tutti i giochi che si sbloccano pensando
   (`giochi/aiuti.js`, dove stanno i prezzi), detta al coniglio:

     🧠 pensa      gratis   cosa chiede questo posto e qual è la domanda
                            giusta — ricavato da quello che c'è sulla
                            mappa (ghiaccio, massi, buche, lo zaino…)
     🔎 dove       gratis   dove la fila comincia a sbagliare: il cursore
                            va lì e quello che segue si spegne. Il posto,
                            non la carta
     💡 carta ×3   🪙10     la carta giusta in quel posto: il 💡 di prima
     🧩 un terzo   🪙50     un pezzo di strada scritto nella fila: un terzo
     🧩 metà       🪙100    di quello che manca, poi la metà, poi tutto —
     ✅ tutto      🪙200    sempre a partire da dove la fila va bene

   ── PERCHÉ LA SCALA RIPARTE A OGNI INGRESSO ─────────────────────────
   Nel Generale e nel costruttore i gradini comprati restano, perché
   sono frasi e programmi sempre uguali. Qui no: ogni gradino guarda la
   fila di adesso, e la fila riparte vuota a ogni ingresso. Quello che si
   è pagato sta nella fila, e la fila si vince col ▶ che viene subito
   dopo. Rientrando si ricomincia dai gradini gratis.

   ── I PEZZI SONO QUELLO CHE FAREBBE CHI SEGUE IL 💡 ──
   Un pezzo di strada non è scritto da nessuna parte: è la fila che
   verrebbe fuori seguendo il consiglio del risolutore (`suggerisci`) un
   certo numero di volte — una carta, una scatola, una testa da
   scegliere, una carta da togliere — con le stesse mosse che fa il
   bambino (`seguiConsiglio`). Così le carte che il gioco imparerà
   domani ci entrano da sole, e un pezzo non può portare in un vicolo
   cieco: il test lo pretende dal 💡 da sempre.

   Puro: gira in Node e si prova in `unita/aiuti`.
   ═══════════════════════════════════════════════════════════════════ */
import { conIPrezzi, RAGIONA, INDIZIO, PEZZO, SVELA } from '../../aiuti.js'
import { suggerisci, risolvi } from './risolutore.js'
import { seguiConsiglio } from './fila.js'

/* quante carte giuste si vendono a dieci, prima dei pezzi */
export const CARTE_GIUSTE = 3
/* un tetto di sicurezza: nessuna strada vuole tanti consigli */
const TETTO = 80

/* ═══════════ la scala ═══════════
   Sempre la stessa forma: i gradini che scrivono non hanno un
   contenuto fisso — si calcolano dalla fila quando si comprano. */
export function scalaDi() {
  return conIPrezzi([
    { che: RAGIONA, cosa: 'pensa' },
    { che: RAGIONA, cosa: 'dove' },
    ...Array.from({ length: CARTE_GIUSTE }, () => ({ che: INDIZIO, cosa: 'carta' })),
    { che: PEZZO, cosa: 'pezzo', quota: 1 / 3 },
    { che: PEZZO, cosa: 'pezzo', quota: 1 / 2 },
    { che: SVELA, cosa: 'tutto', quota: 1 },
  ])
}

/* ═══════════ 🧠 pensa ═══════════
   Due frasi: cosa chiede il posto (e il nodo), e la domanda da farsi.
   Si ricavano da quello che c'è sulla mappa e non da un testo scritto
   livello per livello: valgono per la campagna, per il sentiero senza
   fine e per i posti che verranno. Si guarda la cosa più nuova — lo
   zaino, poi le pecore, le buche, i massi, il ghiaccio, i salti — perché è quella
   che il posto è venuto a insegnare. Le legge un grande a chi non sa
   ancora leggere: il pezzo che si vede è il gradino dopo. */
export function pensieroDi(liv) {
  const carota = liv.carota >= 0 ? ' E la carota 🥕: prima prendila, poi vai a casa.' : ''
  const carte = liv.carte || []
  if (liv.zaino) {
    const corta = risolvi(liv, { carota: false })
    const quante = corta ? corta.length : null
    const prima = quante && quante > liv.zaino
      ? `Lo zaino tiene ${liv.zaino} carte, e la strada, freccia per freccia, ne vuole ${quante}: scritta così non ci sta.`
      : `Lo zaino tiene ${liv.zaino} carte: la strada, scritta freccia per freccia, non ci sta.`
    const seconda = carte.includes('se')
      ? 'Guarda la strada: cosa si ripete uguale? E dove il coniglio deve fare una cosa diversa, c\'è una lastra colorata che lo dice?'
      : carte.includes('fino') || carte.includes('casa')
        ? 'Guarda la strada: cosa si ripete uguale, e fino a quando? Quante volte, o fino a quale lastra?'
        : 'Guarda la strada: c\'è un pezzo che si ripete uguale? Quel pezzo si scrive una volta sola, dentro una scatola 🔁 — e quante volte?'
    return [prima, seconda]
  }
  if (liv.cane) {
    const osso = liv.carota >= 0 ? ' E l\'osso 🦴: prendilo senza spaventarle.' : ''
    return ['Le pecore 🐑 scappano dal cane: se si ferma sulla loro riga o colonna, a una o due caselle, fanno un passo dall\'altra parte, e spingono quella che hanno davanti. Portale tutte nel recinto.',
            'Da che parte deve andare la pecora? Il cane si mette dall\'altra parte. Per girarle attorno passa in diagonale: sulla sua riga o colonna, scappa.' + osso]
  }
  if ((liv.coppia || []).some(k => k > 0))
    return ['Il coniglio deve arrivare alla tana 🏡, e ci sono delle buche 🕳️: si entra in una e si esce da quella dello stesso colore.',
            'Da quale buca conviene entrare, per uscire vicino alla tana? Segui col dito dove porta ognuna.' + carota]
  if ((liv.massi || []).length)
    return ['Un masso 🪨 sbarra la strada, e si sposta solo spingendolo: il coniglio ci cammina contro, e il masso va avanti.',
            'Dove deve finire il masso perché la strada si apra? E da che parte ti devi mettere per spingerlo lì?' + carota]
  if ((liv.terreno || []).includes('ghiaccio'))
    return ['Sul ghiaccio ❄️ il coniglio non si ferma: una freccia sola lo fa scivolare finché qualcosa non lo ferma.',
            'Guarda dove finisce ogni striscia di ghiaccio: cosa c\'è lì a fare da freno? È lì che puoi girare.' + carota]
  if (liv.salti)
    return ['In mezzo c\'è l\'acqua, o un tronco: a piedi non si passa, ma il salto 🦘 scavalca una casella.',
            'Dove serve saltare? Il salto passa sopra l\'acqua e i tronchi, ma non sopra i sassi e gli alberi.' + carota]
  return ['Il coniglio deve arrivare alla tana 🏡. Cespugli, alberi e acqua non si attraversano: si gira attorno.',
          'Conta le caselle col dito: quante a destra, quante in su o in giù, prima di girare?' + carota]
}

/* ═══════════ 🔎 dove ═══════════
   Il posto, e non la carta. Torna cosa accendere e la frase da dire:
     { che: 'via' }                    la fila va già bene: ▶
     { che: 'qui', cursore, sospette } il cursore va lì; `sospette` se
                                       dopo ci sono carte da cambiare
     { che: 'testa', apri }            è la testa di questa scatola
     { che: 'togli', carta }           questa carta è di troppo
   o `null` se non c'è niente da dire. */
export function dove(liv, fila) {
  const s = suggerisci(liv, fila)
  if (!s) return null
  if (s.che === 'via') return { che: 'via', testo: 'La fila va già bene: premi ▶ e guarda.' }
  if (s.che === 'testa')
    return { che: 'testa', apri: s.apri, testo: 'Le carte vanno bene: è la testa di questa scatola che non torna. Quante volte, o fino a dove?' }
  if (s.che === 'togli')
    return { che: 'togli', carta: s.cursore - 1, testo: 'Qui c\'è una carta di troppo: senza, la fila va meglio.' }
  const sospette = s.cursore < fila.length
  return { che: 'qui', cursore: s.cursore, sospette,
           testo: sospette ? 'Fin qui la fila va bene. Il pezzo da cambiare comincia dove sta il cursore.'
             : fila.length ? 'Fin qui la fila va bene: continua da dove sta il cursore.'
               : 'Comincia dalla prima carta: da che parte deve andare il coniglio?' }
}

/* ═══════════ i pezzi di strada ═══════════
   Quello che farebbe chi segue il 💡 fino a casa, a partire da questa
   fila. Senza zaino si riparte dal pezzo che va bene — le carte
   sbagliate dopo si buttano, se no chi segue i consigli se le
   trascinerebbe dietro per sempre; con lo zaino no, perché lì il
   consiglio sa anche dire «questa è di troppo». */
export function strada(liv, fila) {
  let f = fila.slice()
  let c = f.length
  if (!liv.zaino) {
    const s = suggerisci(liv, f)
    if (s && s.che === 'mossa') { f = f.slice(0, s.cursore); c = s.cursore }
  }
  const passi = []
  for (let k = 0; k < TETTO; k++) {
    const s = suggerisci(liv, f)
    if (!s || s.che === 'via') return { passi, arriva: !!s }
    passi.push({ s, fila: f, cursore: c })
    const r = seguiConsiglio(f, c, s)
    f = r.fila
    c = r.cursore
  }
  return { passi, arriva: false }
}

/* Un pezzo: `quota` dei consigli che mancano (almeno uno; 1 vuol dire
   tutti). Torna la fila nuova, il cursore, e quanti consigli ha messo
   insieme — o `null` se la fila vince già e non c'è niente da scrivere. */
export function pezzoDiStrada(liv, fila, quota = 1) {
  const { passi } = strada(liv, fila)
  if (!passi.length) return null
  const n = quota >= 1 ? passi.length : Math.max(1, Math.ceil(passi.length * quota))
  let f, c
  if (n < passi.length) ({ fila: f, cursore: c } = passi[n])
  else {
    const ultimo = passi[passi.length - 1]
    ;({ fila: f, cursore: c } = seguiConsiglio(ultimo.fila, ultimo.cursore, ultimo.s))
  }
  return { fila: f, cursore: c, quanti: n, resto: passi.length - n }
}
