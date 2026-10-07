/* IL GIRO DEL MONDO DELLA BANCARELLA — le città, e quali giornate stanno in
   quale. Vedi docs/bancarella/mappa.md.

   Le giornate non cambiano: sono quelle di `data/bancarella.js`, con gli id e
   gli indici di sempre (l'avanzamento sta in `profile.mercato.tappa`). Qui si
   dice solo come si raggruppano, seguendo i gradini della scaletta:

     Bologna   1-2    la cassa fa tutto
     Roma      3-6    il totale lo batti tu
     Parigi    7-9    il resto lo conti tu, con 10, 20 e 50 euro
     New York  10-11  i mezzi euro e la borsa più piena
     Rio       12-14  i centesimi: le decine, i cinque, quelli veri
     Tokyo     15-16  due cose uguali, e la cassa rotta
     Il Cairo  libera il mercato che non chiude mai

   `x, y` sono i punti sul mondo (`MONDO`, 1152×780: la scala 3/4 di un
   dipinto da 1536×1040, vedi `data/bancarella-fondali.js`); `monumento` dice quale tratto
   di città si disegna accanto al segnaposto e nel cielo della sua piazza. */
import { CAMPAGNE, LIBERA } from './bancarella.js'

export const MONDO = { W: 1152, H: 780 }

export const CITTA = [
  { id: 'bologna', nome: 'Bologna', continente: 'Europa', monumento: 'torri',
    racconto: 'Si comincia da casa: la cassa fa tutti i conti, tu dai il resto.',
    giornate: ['banchetto', 'paese'], x: 650, y: 210, accento: '#c8553d' },
  { id: 'roma', nome: 'Roma', continente: 'Europa', monumento: 'colosseo',
    racconto: 'Qui la cassa non somma più: il conto lo fai tu.',
    giornate: ['conto-dieci', 'conto-tre', 'conto-venti', 'grande'], x: 668, y: 326, accento: '#d9a441' },
  { id: 'parigi', nome: 'Parigi', continente: 'Europa', monumento: 'torre',
    racconto: 'Il totale è scritto, il resto lo conti tu: con 10, 20 e 50 euro.',
    giornate: ['resto-dieci', 'resto-venti', 'resto-cinquanta'], x: 500, y: 160, accento: '#4f7fc9' },
  { id: 'new-york', nome: 'New York', continente: 'Nord America', monumento: 'statua',
    racconto: 'Arrivano i mezzi euro, e nella borsa si compra di più.',
    giornate: ['resto-mezzi', 'fiera'], x: 296, y: 222, accento: '#3f9d7a' },
  { id: 'rio', nome: 'Rio de Janeiro', continente: 'Sud America', monumento: 'cristo',
    racconto: 'I centesimi: le decine, i cinque, e infine quelli veri.',
    giornate: ['resto-decine', 'resto-cinquine', 'coperto'], x: 438, y: 566, accento: '#e8920c' },
  { id: 'tokyo', nome: 'Tokyo', continente: 'Asia', monumento: 'torii',
    racconto: 'Due cose uguali, e poi la cassa rotta: conti tutto tu.',
    giornate: ['resto-copie', 'mente'], x: 1052, y: 268, accento: '#d9486f' },
  { id: 'cairo', nome: 'Il Cairo', continente: 'Africa', monumento: 'piramidi', libera: true,
    racconto: 'Il mercato che non chiude mai: si va avanti finché reggi.',
    giornate: ['libera'], x: 772, y: 440, accento: '#a06bc9' },
]

/* La giornata come la mostra il mondo: quelle vere e la libera. */
export const giornataDi = id => (id === LIBERA.id ? LIBERA : CAMPAGNE.find(g => g.id === id) || null)

/* l'indice di una giornata nella fila (-1 per la libera, come nella schermata) */
export const indiceDi = id => (id === LIBERA.id ? -1 : CAMPAGNE.findIndex(g => g.id === id))

export const cittaDelleGiornata = id => CITTA.findIndex(c => c.giornate.includes(id))

/* l'indice della prima giornata di una città: è quello che la apre */
export const primaDi = c => indiceDi(c.giornate[0])

/* Lo stato di una giornata, dato quante ne sono state finite (`fatto`):
   fatta · ora (la prossima) · aperta (aperta da fuori, `tuttoAperto`) · chiusa.
   `aperta(i)` dice se una giornata si può giocare. */
export function statoGiornata(id, fatto, aperta) {
  const i = indiceDi(id)
  if (i < 0) return aperta(CAMPAGNE.length) ? 'aperta' : 'chiusa'
  if (i < fatto) return 'fatta'
  if (!aperta(i)) return 'chiusa'
  return i === fatto ? 'ora' : 'aperta'
}

/* Lo stato di una città: fatta se lo sono tutte le sue giornate, ora se ha la
   prossima, aperta se si può entrare, chiusa se no. */
export function statoCitta(c, fatto, aperta) {
  const stati = c.giornate.map(id => statoGiornata(id, fatto, aperta))
  if (stati.every(s => s === 'chiusa')) return 'chiusa'
  if (!c.libera && stati.every(s => s === 'fatta')) return 'fatta'
  return stati.includes('ora') ? 'ora' : 'aperta'
}

/* la città dove si sta lavorando: quella con la giornata da fare, o l'ultima */
export function cittaCorrente(fatto, aperta) {
  const i = CITTA.findIndex(c => statoCitta(c, fatto, aperta) === 'ora')
  if (i >= 0) return i
  // tutto fatto: la città che chiude la fila, e dopo la libera
  const aperte = CITTA.map((c, k) => (statoCitta(c, fatto, aperta) === 'chiusa' ? -1 : k))
  return Math.max(0, Math.max(...aperte))
}

/* quante giornate di una città sono finite */
export const fatteIn = (c, fatto) => c.giornate.filter(id => indiceDi(id) >= 0 && indiceDi(id) < fatto).length

/* Dove il segnaposto delle giornate in cima si ritrova nella scena: i punti
   di un dipinto non si indovinano, si rileggono (docs/bancarella/mappa.md). */
export const POSTEGGIO = { dx: 54, dy: -8 }
export const posteggio = c => ({ x: c.x + POSTEGGIO.dx, y: c.y + POSTEGGIO.dy })
