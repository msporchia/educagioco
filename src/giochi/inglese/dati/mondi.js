// Il grafo dei mondi dell'inglese: un mondo per anno della scuola
// primaria, le sue tappe, da cosa si apre, e le categorie di data/words.js
// che finiscono nel suo 📦 cassetto. Il perché di ogni scelta, e il
// programma di ogni anno, stanno in docs/lingue/mondi.md.
//
// Un mondo: { id, anno (1–5), nome, disegno, insegna, dopo: [id…] (tutti
//   finiti), dopoUno?: [id…] (basta uno), categorie: [cat di words.js],
//   verbi?: true (i verbi di data/verbi.js che nessuna tappa insegna vanno
//   nel suo cassetto), strutture?: [forma…] (le strutture dell'anno che il
//   libro sa dalla prima pagina del mondo, prima della loro tappa di
//   frasi), tappe: [...] }. Un mondo senza tappe è «in arrivo»: sta sulla
//   mappa ma non si apre.
// Le tappe si alternano: una di FRASI — { id, nome, disegno, forme: [forma…],
//   contratta } (una struttura, fatta solo di parole già viste) — viene
//   subito dopo le tappe di PAROLE che le servono — { id, nome, disegno,
//   argomento, parole } (8–10 parole di un argomento solo, dati/argomenti.js)
//   —, e in fondo la 🏁 (`bandiera: true`), che ripassa tutto il mondo. La `portata` la
//   mette `anno` (vedi `portate`): nessuno la scrive a mano.
import { WORDS } from '../../../data/words.js'
import { VERBI } from '../../../data/verbi.js'
import { FORME } from './forme.js'
import { ARGOMENTI, paroleDellArgomento } from './argomenti.js'

// dove sta l'avanzamento nel profilo: profile.campagne[CHIAVE] (p.eng resta al gioco di prima)
export const CHIAVE = 'inglese'

// le parole «che tengono insieme le frasi» non hanno un cassetto: arrivano con le forme
export const CATEGORIE_DI_STRUTTURA = ['q']

const parole = (id, nome, disegno, argomento, lista) => ({ id, nome, disegno, argomento, parole: lista, forme: [] })
const frasi = (id, nome, disegno, forme, contratta = false) =>
  ({ id, nome, disegno, forme, parole: [], contratta, frasi: true })
const bandiera = id => ({ id, nome: 'La bandiera', disegno: 'bandiera', bandiera: true, parole: [], forme: [],
                          contratta: true })

// La portata di una tappa viene dall'anno di scuola: l'anno n va dai 5+n ai
// 6+n anni, cioè da 12,5·(n+1) a 12,5·(n+2) sulla scala di data/portata.js;
// le tappe si spargono dentro quell'anno, dalla prima all'ultima.
export const PUNTI_PER_ANNO = 12.5
export const inizioDellAnno = anno => PUNTI_PER_ANNO * (anno + 1)
function portate(m) {
  const n = m.tappe.length
  m.tappe.forEach((t, i) => {
    t.portata = Math.round(inizioDellAnno(m.anno) + (n > 1 ? (PUNTI_PER_ANNO - 1.5) * i / (n - 1) : 0))
  })
  return m
}

export const MONDI = [
  {
    id: 'prima', anno: 1, nome: 'In prima', disegno: 'palla',
    insegna: 'hello, it is a …, is it …?, i colori, i numeri fino a dieci, this is …',
    dopo: [], categorie: ['a', 'c', 's', 'g'],
    tappe: [
      parole('prima-colori', 'I colori', 'pennelli', 'colori',
        ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown']),
      frasi('prima-ciao', 'Ciao! Come ti chiami?', 'coppia', ['saluti']),
      parole('prima-animali', 'Gli animali', 'cane', 'animali',
        ['dog', 'cat', 'fish', 'bird', 'mouse', 'rabbit', 'horse', 'cow', 'pig', 'duck']),
      parole('prima-giocattoli', 'I giocattoli', 'palla', 'giocattoli',
        ['ball', 'doll', 'teddy bear', 'kite', 'puzzle', 'game', 'car', 'train', 'plane', 'boat']),
      frasi('prima-che-cose', 'Che cos’è?', 'punto-di-domanda', ['it-is', 'is-it']),
      frasi('prima-colore', 'Di che colore è?', 'pennelli', ['colore-prima'], true),
      parole('prima-scuola', 'A scuola', 'zaino', 'scuola',
        ['book', 'pencil', 'pen', 'ruler', 'rubber', 'backpack', 'notebook', 'crayon', 'box', 'map']),
      frasi('prima-questo', 'Questo è…', 'zaino', ['this-is']),
      parole('prima-numeri', 'I numeri fino a dieci', 'dita', 'numeri',
        ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']),
      frasi('prima-quanti', 'Quanti sono?', 'dita', ['plurale'], true),
      bandiera('prima-bandiera'),
    ],
  },
  {
    id: 'seconda', anno: 2, nome: 'In seconda', disegno: 'casetta',
    insegna: 'I like, this is my, I have got, she has got, i numeri fino a venti',
    dopo: ['prima'], categorie: ['b', 'k', 'f', 'p', 'j'],
    tappe: [
      parole('seconda-cibo', 'Il cibo', 'torta', 'cibo',
        ['apple', 'banana', 'pizza', 'cake', 'milk', 'bread', 'cheese', 'chocolate', 'egg', 'cookie']),
      parole('seconda-pranzo', 'A pranzo', 'piatto', 'cibo',
        ['carrot', 'potato', 'tomato', 'salad', 'soup', 'pasta', 'rice', 'juice', 'strawberry', 'grapes']),
      frasi('seconda-mi-piace', 'Mi piace!', 'torta', ['i-like']),
      parole('seconda-famiglia', 'La famiglia', 'famiglia', 'famiglia',
        ['mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather', 'baby', 'friend']),
      parole('seconda-vestiti', 'I vestiti', 'cappello', 'vestiti',
        ['hat', 'cap', 'shirt', 'dress', 'shoe', 'sock', 'coat', 'scarf', 'glove', 'trousers']),
      parole('seconda-come', 'Come sono', 'faccia', 'aggettivi',
        ['big', 'small', 'long', 'short', 'happy', 'sad', 'tired', 'hungry', 'hot', 'cold']),
      frasi('seconda-mio', 'Questo è mio', 'famiglia', ['this-is-my']),
      parole('seconda-venti', 'I numeri fino a venti', 'dita', 'numeri',
        ['eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
         'nineteen', 'twenty']),
      frasi('seconda-ho', 'Ho un…', 'cappello', ['have-got']),
      parole('seconda-corpo', 'Il corpo', 'faccia', 'corpo',
        ['head', 'eye', 'ear', 'nose', 'mouth', 'hand', 'foot', 'leg', 'hair']),
      frasi('seconda-ha', 'Lei ha…', 'faccia', ['has-got'], true),
      bandiera('seconda-bandiera'),
    ],
  },
  {
    id: 'terza', anno: 3, nome: 'In terza', disegno: 'scatola',
    insegna: 'there is / there are, where is …?, in, on, under, today is …, can / cannot',
    dopo: ['seconda'], categorie: ['h', 'd', 'w', 'n'], verbi: true,
    tappe: [
      parole('terza-casa', 'La casa', 'casetta', 'casa',
        ['house', 'kitchen', 'bedroom', 'bathroom', 'garden', 'garage', 'door', 'window', 'roof', 'wall']),
      parole('terza-mobili', 'I mobili', 'scatola', 'casa',
        ['bed', 'chair', 'table', 'sofa', 'lamp', 'mirror', 'clock', 'picture', 'shower', 'bath']),
      frasi('terza-dove', 'Dov’è?', 'scatola', ['dove']),
      parole('terza-cento', 'I numeri fino a cento', 'dita', 'numeri',
        ['thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred']),
      frasi('terza-c-e', 'C’è, ci sono', 'casetta', ['there-is']),
      parole('terza-giorni', 'I giorni', 'sole', 'calendario',
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'today',
         'tomorrow', 'weekend']),
      parole('terza-stagioni', 'Le stagioni e i mesi', 'clessidra', 'calendario',
        ['spring', 'summer', 'autumn', 'winter', 'January', 'February', 'March', 'April', 'May', 'June']),
      parole('terza-mesi', 'Gli altri mesi', 'clessidra', 'calendario',
        ['July', 'August', 'September', 'October', 'November', 'December', 'birthday', 'Christmas']),
      parole('terza-tempo', 'Che tempo fa', 'sole', 'tempo',
        ['sun', 'rain', 'snow', 'wind', 'cloud', 'storm', 'fog', 'rainbow', 'sky', 'ice']),
      frasi('terza-oggi', 'Oggi è lunedì', 'sole', ['oggi'], true),
      parole('terza-azioni', 'Che cosa sai fare', 'palla', 'azioni',
        ['swim', 'run', 'jump', 'fly', 'dance', 'climb', 'sing', 'walk', 'read', 'write']),
      frasi('terza-so-fare', 'So nuotare!', 'palla', ['can'], true),
      bandiera('terza-bandiera'),
    ],
  },
  {
    id: 'quarta', anno: 4, nome: 'In quarta', disegno: 'sole',
    insegna: 'what time is it?, I play, she plays, does she play?, I am playing',
    dopo: ['terza'], categorie: ['t'], strutture: ['presente', 'terza-s', 'does', 'ing', 'ora'],
    tappe: [
      parole('quarta-giornata', 'La giornata', 'sole', 'giornata',
        ['morning', 'afternoon', 'evening', 'night', 'breakfast', 'lunch', 'dinner', 'hour', 'minute',
         'time']),
      frasi('quarta-ora', 'Che ore sono?', 'clessidra', ['ora'], true),
      parole('quarta-ogni-giorno', 'Ogni giorno', 'torta', 'azioni',
        ['eat', 'drink', 'sleep', 'wash', 'cook', 'play', 'go', 'listen', 'look', 'help']),
      parole('quarta-sport', 'Sport e musica', 'palla', 'sport',
        ['tennis', 'basketball', 'piano', 'guitar', 'violin', 'drum', 'trumpet', 'music', 'team']),
      frasi('quarta-io-gioco', 'Gioco ogni giorno', 'palla', ['presente'], true),
      parole('quarta-mestieri', 'I mestieri', 'coppia', 'mestieri',
        ['teacher', 'doctor', 'farmer', 'cook', 'police officer', 'firefighter', 'pilot', 'nurse',
         'singer']),
      frasi('quarta-lei-gioca', 'Lei gioca', 'coppia', ['terza-s']),
      frasi('quarta-does', 'Lui gioca?', 'punto-di-domanda', ['does']),
      parole('quarta-mezzi', 'I mezzi', 'bicicletta', 'mezzi',
        ['bus', 'bike', 'taxi', 'truck', 'ship', 'helicopter', 'tractor', 'scooter', 'motorbike',
         'rocket']),
      frasi('quarta-adesso', 'Che cosa stai facendo?', 'bicicletta', ['ing']),
      bandiera('quarta-bandiera'),
    ],
  },
  {
    id: 'quinta', anno: 5, nome: 'In quinta', disegno: 'clessidra',
    insegna: 'I was, I went, I played, she said, when, going to, bigger than',
    dopo: ['quarta'], categorie: ['y'],
    strutture: ['was-were', 'passato', 'passato-ed', 'dire', 'quando', 'going-to', 'paragoni'],
    tappe: [
      parole('quinta-citta', 'In città', 'casetta', 'luoghi',
        ['shop', 'school', 'hospital', 'park', 'station', 'museum', 'bank', 'cinema', 'library', 'zoo']),
      frasi('quinta-ieri', 'Ieri ero al parco', 'casetta', ['was-were']),
      parole('quinta-fuori', 'Fuori città', 'bicicletta', 'luoghi',
        ['castle', 'bridge', 'airport', 'city', 'village', 'road', 'church', 'market', 'restaurant',
         'farm']),
      parole('quinta-verbi', 'I verbi che cambiano', 'clessidra', 'azioni',
        ['see', 'come', 'make', 'buy', 'find', 'give', 'take', 'win', 'catch', 'throw']),
      frasi('quinta-andai', 'Sono andato al castello', 'clessidra', ['passato']),
      frasi('quinta-giocai', 'Ho giocato', 'palla', ['passato-ed']),
      parole('quinta-parlare', 'Chi parla, chi ride', 'coppia', 'azioni',
        ['say', 'tell', 'ask', 'speak', 'laugh', 'cry', 'smile', 'know']),
      frasi('quinta-disse', 'Ha detto ciao', 'coppia', ['dire'], true),
      frasi('quinta-quando', 'Quando fa freddo', 'sole', ['quando'], true),
      parole('quinta-come', 'Alto e veloce', 'faccia', 'aggettivi',
        ['tall', 'fast', 'slow', 'old', 'young', 'strong', 'beautiful', 'difficult', 'easy', 'funny']),
      frasi('quinta-piu', 'Chi è più alto?', 'faccia', ['paragoni'], true),
      frasi('quinta-domani', 'Domani andrò', 'bicicletta', ['going-to']),
      bandiera('quinta-bandiera'),
    ],
  },
  { id: 'prova-finale', nome: 'La prova finale', disegno: 'forziere', insegna: 'tutto insieme', prova: true,
    dopo: ['prima', 'seconda', 'terza', 'quarta', 'quinta'], categorie: [], tappe: [] },
].map(m => (m.tappe.length ? portate(m) : m))

export const mondoDi = id => MONDI.find(m => m.id === id) || null
export const pronto = m => m.tappe.length > 0
export const TAPPE = MONDI.flatMap(m => m.tappe.map(x => ({ ...x, mondo: m.id })))
export const tappaDi = id => TAPPE.find(x => x.id === id) || null
// tre specie di tappa: di parole, di frasi, la 🏁
export const specieDi = t => (t.bandiera ? 'bandiera' : t.frasi ? 'frasi' : 'parole')

// Il dato si controlla da solo: un riferimento sbagliato è rosso in
// test/unita/inglese-mondi, non una mappa bianca su un telefono.
export function guastiDeiMondi() {
  const g = []
  const inWords = new Map(WORDS.map(w => [w[0], w[3]]))
  const inVerbi = new Set(VERBI.map(v => v[0]))
  const ids = new Set()
  const categorie = new Map()
  const inTappa = new Map()
  for (const m of MONDI) {
    if (ids.has(m.id)) g.push(`mondo doppio: ${m.id}`)
    ids.add(m.id)
    for (const c of m.categorie) {
      if (categorie.has(c)) g.push(`categoria ${c} in due mondi: ${categorie.get(c)} e ${m.id}`)
      categorie.set(c, m.id)
    }
    for (const f of m.strutture || []) if (!FORME[f]) g.push(`${m.id}: struttura sconosciuta ${f}`)
  }
  let annoPrima = 0
  for (const m of MONDI) {
    for (const d of [...m.dopo, ...(m.dopoUno || [])])
      if (!ids.has(d)) g.push(`${m.id}: dipende da un mondo che non c'è (${d})`)
    if (!pronto(m)) continue
    if (!(m.anno >= 1 && m.anno <= 5)) g.push(`${m.id}: senza anno di scuola (1–5)`)
    if (m.anno < annoPrima) g.push(`${m.id}: l'anno ${m.anno} viene dopo l'anno ${annoPrima}`)
    annoPrima = m.anno
    const ultima = m.tappe[m.tappe.length - 1]
    if (!ultima.bandiera) g.push(`${m.id}: l'ultima tappa non è la 🏁`)
    let giaFrasi = false
    for (const x of m.tappe) {
      if (ids.has(x.id)) g.push(`id doppio: ${x.id}`)
      ids.add(x.id)
      if (typeof x.portata !== 'number') g.push(`${x.id}: senza portata`)
      else if (x.portata < inizioDellAnno(m.anno) || x.portata >= inizioDellAnno(m.anno + 1))
        g.push(`${x.id}: portata ${x.portata} fuori dal suo anno (${m.anno})`)
      if (x.bandiera) {
        if (x !== ultima) g.push(`${x.id}: la 🏁 sta in mezzo al mondo`)
        continue
      }
      if (x.frasi) {
        giaFrasi = true
        if (!x.forme.length) g.push(`${x.id}: una tappa di frasi senza struttura`)
        for (const f of x.forme) if (!FORME[f]) g.push(`${x.id}: forma sconosciuta ${f}`)
        if (x.parole.length) g.push(`${x.id}: una tappa di frasi non porta parole nuove`)
        continue
      }
      // una tappa di parole: 8–10 parole, un argomento solo
      const arg = ARGOMENTI[x.argomento]
      if (!arg) { g.push(`${x.id}: argomento sconosciuto ${x.argomento}`); continue }
      if (x.parole.length < 8 || x.parole.length > 10)
        g.push(`${x.id}: ${x.parole.length} parole nuove (ne vanno 8–10)`)
      const dellArgomento = new Set(paroleDellArgomento(x.argomento))
      for (const p of x.parole) {
        if (arg.verbi ? !inVerbi.has(p) : !inWords.has(p))
          g.push(`${x.id}: «${p}» non è in data/${arg.verbi ? 'verbi' : 'words'}.js`)
        if (!dellArgomento.has(p)) g.push(`${x.id}: «${p}» non è ${arg.nome}`)
        const k = (arg.verbi ? 'verbo:' : 'en:') + p
        if (inTappa.has(k)) g.push(`«${p}» in due tappe: ${inTappa.get(k)} e ${x.id}`)
        inTappa.set(k, x.id)
      }
    }
    // un mondo che ha le frasi ha anche il suo libro; chi non le ha ancora dichiara le strutture
    if (!giaFrasi && !(m.strutture || []).length) g.push(`${m.id}: né tappe di frasi né strutture dichiarate`)
  }
  // ogni categoria (tranne quelle di struttura) ha un mondo: nessuna parola resta fuori
  for (const c of new Set(WORDS.map(w => w[3])))
    if (!categorie.has(c) && !CATEGORIE_DI_STRUTTURA.includes(c))
      g.push(`la categoria ${c} non ha un mondo: le sue parole non starebbero da nessuna parte`)
  if (!MONDI.some(m => m.verbi) && VERBI.length) g.push('nessun mondo tiene i verbi nel cassetto')
  // niente cicli nelle dipendenze
  const visita = (id, pila = []) => {
    if (pila.includes(id)) { g.push(`ciclo: ${[...pila, id].join(' → ')}`); return }
    const m = mondoDi(id)
    if (m) for (const d of [...m.dopo, ...(m.dopoUno || [])]) visita(d, [...pila, id])
  }
  for (const m of MONDI) visita(m.id)
  return g
}
