/* LA BANCARELLA — il mercato, i banchi, i clienti, il resto.
   Vedi docs/bancarella/presentazione.md e regole.md.

   La tabella della progressione: sedici giornate, quindici passaggi, una
   leva sola per passaggio (`conto`, `banchi`, `articoli`, `copie`, `passo`,
   `paga`). `test/unita/bancarella` la ricontrolla a ogni giro: se qualcuno
   aggiunge due cose insieme, diventa rossa.

    #  giornata              conto  banchi art copie passo  paga   LA COSA NUOVA
    1  Il banchetto          niente   3     2    0    1 €    5 €   (il gesto: prendi, e componi il resto)
    2  Il mercato del paese  niente   3     2    0    1 €   10 €   la banconota da 10 €
    3  Il conto lo fai tu    totale   3     2    0    1 €   10 €   IL TOTALE LO BATTI TU (somme entro il 10)
    4  Tre cose sul banco    totale   3     3    0    1 €   10 €   un prodotto in più
    5  Le spese da venti     totale   3     3    0    1 €   20 €   la banconota da 20 € (somme entro il 20)
    6  Il mercato grande     totale   4     3    0    1 €   20 €   un banco in più
    7  Il resto da dieci     resto    4     2    0    1 €   10 €   IL RESTO LO CONTI TU
    8  Il resto da venti     resto    4     2    0    1 €   20 €   si paga con 20 €
    9  Il resto da cinquanta resto    4     2    0    1 €   50 €   si paga con 50 €
   10  I mezzi euro          resto    4     2    0   50c    20 €   i cartellini a mezzo euro
   11  La fiera              resto    4     3    0   50c    20 €   una cosa in più nella borsa
   12  I centesimi tondi     resto    4     3    0   10c    20 €   le decine di centesimi
   13  I cinque centesimi    resto    4     3    0    5c    20 €   i cinque centesimi
   14  Il mercato coperto    resto    4     3    0    1c    20 €   i centesimi: 0,89 €, 1,39 €
   15  Due cose uguali       resto    4     3    1    1c    20 €   «due angurie, per favore»
   16  La cassa rotta        tutto    4     3    1    5c    20 €   TUTTI E DUE I CONTI INSIEME */

export const TAGLI = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]  // centesimi
export const euro = c => (c / 100).toFixed(2).replace('.', ',') + ' €'
export const nomeTaglio = c => (c >= 100 ? c / 100 + ' €' : c + 'c')

const caso = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const scegli = a => a[Math.floor(Math.random() * a.length)]
const mescola = a => {
  const m = [...a]
  for (let i = m.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[m[i], m[j]] = [m[j], m[i]]
  }
  return m
}

/* Il listino: prezzi fissi, vedi docs/bancarella/regole.md.
   [emoji, nome, prezzo in centesimi, banco] */
export const LISTINO = [
  // ---- il fruttivendolo ----
  ['🍎', 'mele', 50, 'frutta'],       ['🍌', 'banane', 100, 'frutta'],
  ['🍐', 'pere', 70, 'frutta'],       ['🍇', 'uva', 200, 'frutta'],
  ['🍋', 'limoni', 60, 'frutta'],     ['🍉', 'anguria', 400, 'frutta'],
  ['🍓', 'fragole', 325, 'frutta'],   ['🍊', 'arance', 89, 'frutta'],
  ['🫐', 'mirtilli', 249, 'frutta'],  ['🍍', 'ananas', 300, 'frutta'],
  ['🥭', 'mango', 200, 'frutta'],     ['🍒', 'ciliegie', 500, 'frutta'],
  // ---- l'orto ----
  ['🥕', 'carote', 50, 'verdura'],    ['🍅', 'pomodori', 150, 'verdura'],
  ['🥔', 'patate', 120, 'verdura'],   ['🌽', 'mais', 80, 'verdura'],
  ['🥬', 'insalata', 190, 'verdura'], ['🍄', 'funghi', 290, 'verdura'],
  ['🧅', 'cipolle', 90, 'verdura'],   ['🥦', 'broccoli', 139, 'verdura'],
  ['🥒', 'cetrioli', 79, 'verdura'],  ['🥑', 'avocado', 200, 'verdura'],
  ['🫑', 'peperoni', 200, 'verdura'], ['🍆', 'melanzane', 100, 'verdura'],
  ['🎃', 'zucca', 300, 'verdura'],    ['🧄', 'aglio', 100, 'verdura'],
  ['🌶️', 'peperoncini', 100, 'verdura'],
  // ---- il forno ----
  ['🍞', 'pane', 150, 'forno'],       ['🥐', 'brioche', 50, 'forno'],
  ['🥨', 'salatini', 100, 'forno'],   ['🍕', 'pizza', 500, 'forno'],
  ['🍰', 'torta', 450, 'forno'],      ['🍩', 'ciambella', 100, 'forno'],
  ['🥯', 'bagel', 130, 'forno'],      ['🥖', 'baguette', 119, 'forno'],
  ['🥧', 'crostata', 399, 'forno'],   ['🥞', 'frittelle', 300, 'forno'],
  ['🍔', 'panino', 300, 'forno'],     ['🥪', 'tramezzino', 200, 'forno'],
  // ---- il frigo: tutto quello che va tenuto al freddo, gelato compreso ----
  ['🥛', 'latte', 100, 'frigo'],      ['🧀', 'formaggio', 250, 'frigo'],
  ['🥚', 'uova', 200, 'frigo'],       ['🧈', 'burro', 150, 'frigo'],
  ['🧃', 'succo', 100, 'frigo'],      ['🍦', 'gelato', 100, 'frigo'],
  ['🐟', 'pesce', 615, 'frigo'],      ['🍗', 'pollo', 449, 'frigo'],
  ['🥓', 'pancetta', 279, 'frigo'],   ['🍖', 'arrosto', 600, 'frigo'],
  ['🧇', 'waffle', 200, 'frigo'],
  // ---- i dolciumi: quelli confezionati, sullo scaffale ----
  ['🍪', 'biscotti', 150, 'dolci'],   ['🍫', 'cioccolato', 200, 'dolci'],
  ['🍬', 'caramelle', 50, 'dolci'],   ['🍭', 'lecca-lecca', 50, 'dolci'],
  ['🍿', 'popcorn', 100, 'dolci'],    ['🥤', 'bibita', 120, 'dolci'],
  ['🍯', 'miele', 485, 'dolci'],      ['🧁', 'cupcake', 189, 'dolci'],
  ['🍮', 'budino', 129, 'dolci'],     ['🎂', 'torta gelato', 500, 'dolci'],
  ['🍡', 'dolcetti', 200, 'dolci'],   ['🥠', 'biscottini', 100, 'dolci'],
  ['🧋', 'frullato', 300, 'dolci'],
]

/* I banchi: vedi docs/bancarella/regole.md. */
export const BANCHI = {
  frutta:  { nome: 'Il fruttivendolo', icona: '🍎', colore: '#c8442f', tenda: '#e8705c',
             legno: '#b5714a' },
  verdura: { nome: 'L\'orto',          icona: '🥬', colore: '#4d8f3c', tenda: '#7cc46a',
             legno: '#9c7a45' },
  forno:   { nome: 'Il forno',         icona: '🥖', colore: '#b0742f', tenda: '#e0b072',
             legno: '#a9713c' },
  frigo:   { nome: 'Il frigo',         icona: '🧀', colore: '#3d7fa8', tenda: '#8fc6e4',
             legno: '#8d8f96' },
  dolci:   { nome: 'I dolciumi',       icona: '🍬', colore: '#c04a80', tenda: '#f0a0c0',
             legno: '#b06a86' },
}

export const MAX_CESTE = 8          // quante ceste stanno su un banco
export const CLIENTI_PER_TAPPA = 3  // quanti clienti fa la fila a ogni banco

export const FACCE = ['🧑', '👩', '👴', '👵', '🧒', '👨', '🧔', '👦', '👧', '🧓', '👱', '🙋']
/* il colore del vestito: si legge da lontano solo se sono persone e non
   emoji piccole in fila */
export const VESTITI = ['#e2725b', '#5b8ee2', '#67a95a', '#d9a441', '#9a6fbf',
                        '#4fa8a0', '#d96fa0', '#7a8ba0']

/* `conto`: niente · totale · resto · tutto, la scala su cui è costruita la
   campagna (non torna mai indietro). Vedi docs/bancarella/regole.md. */
export const CONTI = ['niente', 'totale', 'resto', 'tutto']
export const chiedeIlTotale = c => c === 'totale' || c === 'tutto'
export const chiedeIlResto = c => c === 'resto' || c === 'tutto'

/* Quanto rende un cliente, secondo `conto`: vedi docs/bancarella/regole.md
   e docs/apprendimento/calibrazione.md. Un cliente che se ne va non paga
   niente. */
export const MONETE_CLIENTE = { niente: 2, totale: 3, resto: 3, tutto: 4 }
export const premioCliente = camp => MONETE_CLIENTE[(camp && camp.conto) || 'niente']

/* Un numero solo che pesa le sei leve: serve a ordinare la fila e a
   ricavarne la `portata` (vedi docs/bancarella/regole.md). I pesi non sono
   opinioni: non alzare PESO_CONTO senza restare la voce più cara. */
const PESO_CONTO = { niente: 0, totale: 6, resto: 10, tutto: 16 }
const PESO_PASSO = { 100: 0, 50: 2, 10: 4, 5: 5, 1: 7 }
const PESO_PAGA = { 500: 0, 1000: 2, 2000: 4, 5000: 7 }
export const SALTO = 6              // di quanto può crescere da una giornata all'altra

export const pagaMassima = g => Math.max(...(g.paga && g.paga.length ? g.paga : [500]))

export function fatica (g) {
  return PESO_CONTO[g.conto || 'niente'] + (PESO_PASSO[g.passo] ?? 7)
       + (PESO_PAGA[pagaMassima(g)] ?? 7)
       + 2 * (g.articoli[1] - 1) + 3 * (g.copie || 0) + 1.5 * (g.tappe.length - 3)
}

/* le sei leve, lette da una giornata: servono al test che controlla che da
   una giornata all'altra ne salga **una sola**. `passo` si gira di segno
   perché più il passo è piccolo più il gioco è difficile. */
export const leve = g => ({
  conto: CONTI.indexOf(g.conto || 'niente'),
  banchi: g.tappe.length,
  articoli: g.articoli[1],
  copie: g.copie || 0,
  passo: -g.passo,
  paga: pagaMassima(g),
})

/* Una campagna è una giornata: un giro di banchi, tre clienti per banco.
   Vedi docs/bancarella/regole.md per tempo, pezzi, paga, portata e scuola.
   `tetto` è quanto può costare al massimo la spesa (le somme «entro il 10»
   e «entro il 20»), e garantisce anche che la banconota dichiarata basti.
   `portata` non si scrive a mano: esce da `fatica`, vedi `conPortata`. */
const SCALETTA = [
  /* ── fase 1: la cassa fa tutto, si impara il gesto ── */
  { id: 'banchetto', nome: 'Il banchetto', emoji: '🧺', conto: 'niente',
    dritta: 'Il cliente chiede, tu prendi dalla cesta giusta. Poi la cassa dice quanto resto dare: tu lo componi.',
    tappe: ['frutta', 'forno', 'dolci'],
    passo: 100, articoli: [2, 2], tetto: 400, paga: [500],
    tempo: [95, 92], pezzi: [1, 2], copie: 0,
    monete: [100, 200, 500] },

  { id: 'paese', nome: 'Il mercato del paese', emoji: '⛺', conto: 'niente',
    nuovo: 'il cliente paga con la banconota da 10 €',
    dritta: 'Adesso qualcuno paga con dieci euro: il resto è più grosso e vuole due o tre monete.',
    tappe: ['frutta', 'verdura', 'forno'],
    passo: 100, articoli: [2, 2], tetto: 900, paga: [500, 1000],
    tempo: [95, 90], pezzi: [1, 3], copie: 0,
    monete: [100, 200, 500] },

  /* ── fase 2: solo il totale. La cassa dice ancora il resto ── */
  { id: 'conto-dieci', nome: 'Il conto lo fai tu', emoji: '🧮', conto: 'totale',
    nuovo: 'il totale della spesa lo batti tu sulla cassa',
    dritta: 'La cassa non somma più: guarda i due cartellini, fai il conto e battilo sulla tastiera. Il resto te lo dice ancora lei.',
    tappe: ['frutta', 'forno', 'frigo'],
    passo: 100, articoli: [2, 2], tetto: 900, paga: [500, 1000],
    tempo: [95, 90], pezzi: [1, 3], copie: 0,
    monete: [100, 200, 500] },

  { id: 'conto-tre', nome: 'Tre cose sul banco', emoji: '➕', conto: 'totale',
    nuovo: 'un prodotto in più da sommare',
    dritta: 'Tre cartellini invece di due. Sempre euro tondi, sempre entro il dieci.',
    tappe: ['verdura', 'forno', 'dolci'],
    passo: 100, articoli: [3, 3], tetto: 900, paga: [500, 1000],
    tempo: [92, 88], pezzi: [1, 3], copie: 0,
    monete: [100, 200, 500] },

  { id: 'conto-venti', nome: 'Le spese da venti euro', emoji: '💵', conto: 'totale',
    nuovo: 'la banconota da 20 €, e le somme arrivano al venti',
    dritta: 'Spese più grosse: il conto passa il dieci e il cliente tira fuori i venti euro.',
    tappe: ['frutta', 'frigo', 'dolci'],
    passo: 100, articoli: [3, 3], tetto: 1900, paga: [1000, 2000],
    tempo: [92, 86], pezzi: [1, 4], copie: 0,
    monete: [100, 200, 500, 1000] },

  { id: 'grande', nome: 'Il mercato grande', emoji: '🏪', conto: 'totale',
    nuovo: 'un banco in più: quattro',
    dritta: 'Quattro banchi da girare, e il conto lo fai sempre tu.',
    tappe: ['verdura', 'frutta', 'forno', 'frigo'],
    passo: 100, articoli: [3, 3], tetto: 1900, paga: [1000, 2000],
    tempo: [90, 84], pezzi: [1, 4], copie: 0,
    monete: [100, 200, 500, 1000] },

  /* ── fase 3: solo il resto. Il totale torna scritto sullo scontrino ──
     Qui la spesa si accorcia e i prezzi tornano tondi apposta: la fatica
     nuova è la sottrazione, e va incontrata su numeri che si vedono. */
  { id: 'resto-dieci', nome: 'Il resto da dieci euro', emoji: '💶', conto: 'resto',
    nuovo: 'il resto lo conti tu: la cassa non lo dice più',
    dritta: 'Il totale è scritto sullo scontrino. Il cliente paga con dieci euro: quanto gli torna? Metti le monete e premi ✓.',
    tappe: ['frutta', 'forno', 'frigo', 'dolci'],
    passo: 100, articoli: [1, 2], tetto: 900, paga: [1000],
    tempo: [95, 90], copie: 0,
    monete: [100, 200, 500] },

  { id: 'resto-venti', nome: 'Il resto da venti euro', emoji: '💴', conto: 'resto',
    nuovo: 'si paga con 20 €',
    dritta: 'La roba fa tredici euro e lui ti dà venti: il resto è sempre una sottrazione, solo più grande.',
    tappe: ['verdura', 'frutta', 'forno', 'frigo'],
    passo: 100, articoli: [1, 2], tetto: 1900, paga: [2000],
    tempo: [92, 88], copie: 0,
    monete: [100, 200, 500, 1000] },

  { id: 'resto-cinquanta', nome: 'Il resto da cinquanta euro', emoji: '💸', conto: 'resto',
    nuovo: 'si paga con 50 €',
    dritta: 'Il biglietto da cinquanta. Il resto adesso è una manciata di banconote: contale bene.',
    tappe: ['frigo', 'dolci', 'verdura', 'forno'],
    passo: 100, articoli: [1, 2], tetto: 1900, paga: [5000],
    tempo: [92, 86], copie: 0,
    monete: [100, 200, 500, 1000, 2000] },

  { id: 'resto-mezzi', nome: 'I mezzi euro', emoji: '🪙', conto: 'resto',
    nuovo: 'i cartellini a mezzo euro',
    dritta: 'Compaiono i cinquanta centesimi: 1,50 €, 2,50 €. Il resto adesso ha una moneta gialla dentro.',
    tappe: ['frutta', 'verdura', 'forno', 'dolci'],
    passo: 50, articoli: [1, 2], tetto: 1900, paga: [1000, 2000],
    tempo: [90, 84], copie: 0,
    monete: [50, 100, 200, 500, 1000] },

  { id: 'fiera', nome: 'La fiera', emoji: '🎪', conto: 'resto',
    nuovo: 'una cosa in più nella borsa: tre',
    dritta: 'Alla fiera si compra di più: tre cose per cliente, e il resto lo conti sempre tu.',
    tappe: ['frigo', 'dolci', 'frutta', 'verdura'],
    passo: 50, articoli: [2, 3], tetto: 1900, paga: [1000, 2000],
    tempo: [88, 80], copie: 0,
    monete: [50, 100, 200, 500, 1000] },

  { id: 'resto-decine', nome: 'I centesimi tondi', emoji: '🔟', conto: 'resto',
    nuovo: 'le decine di centesimi',
    dritta: 'I prezzi finiscono per zero: 1,20 €, 0,70 €. Nel cassetto arrivano le monete da 10 e da 20 centesimi.',
    tappe: ['forno', 'frigo', 'dolci', 'frutta'],
    passo: 10, articoli: [2, 3], tetto: 1900, paga: [1000, 2000],
    tempo: [88, 78], copie: 0,
    monete: [10, 20, 50, 100, 200, 500, 1000] },

  { id: 'resto-cinquine', nome: 'I cinque centesimi', emoji: '🖐️', conto: 'resto',
    nuovo: 'i cinque centesimi',
    dritta: 'Certi resti adesso finiscono per 5, e la moneta piccola serve davvero.',
    tappe: ['verdura', 'forno', 'frigo', 'dolci'],
    passo: 5, articoli: [2, 3], tetto: 1900, paga: [1000, 2000],
    tempo: [86, 76], copie: 0,
    monete: [5, 10, 20, 50, 100, 200, 500, 1000] },

  { id: 'coperto', nome: 'Il mercato coperto', emoji: '🏬', conto: 'resto',
    nuovo: 'i centesimi veri: 0,89 €, 1,39 €',
    dritta: 'I cartellini finiscono per 9. Nel cassetto arrivano 1c e 2c, e senza quelle non si chiude.',
    tappe: ['forno', 'frigo', 'dolci', 'frutta'],
    passo: 1, articoli: [2, 3], tetto: 1900, paga: [1000, 2000],
    tempo: [85, 74], copie: 0,
    monete: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000] },

  { id: 'resto-copie', nome: 'Due cose uguali', emoji: '♊', conto: 'resto',
    nuovo: '«due angurie, per favore»',
    dritta: 'Qualcuno vuole due o tre pezzi dello stesso prodotto: la cesta si tocca due volte, e il prezzo si raddoppia.',
    tappe: ['frutta', 'verdura', 'forno', 'frigo'],
    passo: 1, articoli: [2, 3], tetto: 1900, paga: [1000, 2000],
    tempo: [85, 72], copie: 1,
    monete: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000] },

  /* ── fase 4: la cassa rotta, che adesso arriva in cima a una scala ──
     Non calcola più niente: né la somma né il resto. Per questo il tempo
     torna largo e i prezzi tornano a scatti di cinque centesimi — due
     conti da fare insieme sono già la fatica di questa giornata. */
  { id: 'mente', nome: 'La cassa rotta', emoji: '🧠', conto: 'tutto',
    nuovo: 'tutti e due i conti insieme',
    dritta: 'La cassa non calcola più niente: batti tu il totale, e poi conta tu il resto. Lei dice solo giusto o sbagliato.',
    tappe: ['frutta', 'forno', 'verdura', 'frigo'],
    passo: 5, articoli: [2, 3], tetto: 1900, paga: [1000, 2000],
    tempo: [95, 85], copie: 1,
    monete: [5, 10, 20, 50, 100, 200, 500, 1000] },
]

/* La portata, ricavata e non scelta: vedi docs/bancarella/regole.md. Si
   riscala sul **massimo raggiunto** di `fatica` e non sulla giornata sola,
   perché la fatica scende quando entra un conto nuovo. */
export const PORTATA_DA = 32        // sei anni e mezzo: sotto, il gioco non si offre
export const PORTATA_A = 72         // nove anni e tre quarti

function conPortata (scaletta) {
  const cresta = []
  let alto = -Infinity
  for (const g of scaletta) cresta.push((alto = Math.max(alto, fatica(g))))
  const min = cresta[0], max = cresta[cresta.length - 1]
  return scaletta.map((g, i) => ({
    ...g, scuola: 'numeri',
    portata: Math.round(PORTATA_DA + (cresta[i] - min) / (max - min) * (PORTATA_A - PORTATA_DA)),
  }))
}

export const CAMPAGNE = conPortata(SCALETTA)

/* La giornata libera: vedi docs/bancarella/regole.md. */
export const LIBERA = {
  id: 'libera', nome: 'Giornata libera', emoji: '♾️', conto: 'tutto',
  dritta: 'Il mercato non chiude: si va avanti finché reggi.',
  tappe: ['frutta', 'verdura', 'forno', 'frigo', 'dolci'],
  passo: 1, articoli: [3, 4], tempo: [70, 45], pezzi: [3, 5], copie: 2, libera: true,
  monete: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
}

export const campagnaDi = i => (i >= 0 && i < CAMPAGNE.length ? CAMPAGNE[i] : LIBERA)

/* Che cosa tocca alla tappa numero `n` di una giornata: quale banco, e con
   quanto tempo. Nella giornata libera `n` non si ferma mai e il giro dei
   banchi ricomincia; nelle altre le tappe sono quelle e basta. */
export function tappaDi(camp, n) {
  const i = n % camp.tappe.length
  const [primo, ultimo] = camp.tempo
  const tempo = camp.libera
    ? Math.max(ultimo, primo - n * 2)
    : Math.round(primo + (ultimo - primo) * (camp.tappe.length > 1 ? i / (camp.tappe.length - 1) : 1))
  return { n, i, banco: camp.tappe[i], camp, tempo,
           passo: camp.passo, articoli: camp.articoli, monete: camp.monete,
           pezzi: camp.pezzi, copie: camp.copie, tetto: camp.tetto, paga: camp.paga,
           conto: camp.conto || 'niente',
           chiediTotale: chiedeIlTotale(camp.conto), chiediResto: chiedeIlResto(camp.conto) }
}

/* la fila di tutte le tappe con addosso il livello della loro giornata:
   è quello che `data/portata.js` si aspetta di ricevere */
export const FILA = CAMPAGNE.flatMap(c =>
  c.tappe.map((banco, n) => ({ banco, n, campagna: c.id,
                               portata: c.portata, scuola: c.scuola })))

export const quanteTappe = camp => (camp.libera ? Infinity : camp.tappe.length)

/* i prodotti in vendita con un certo passo: solo quelli il cui prezzo di
   listino è compatibile con le monete che si hanno in mano */
export function scaffale(passo) {
  return LISTINO.filter(([, , p]) => p % passo === 0)
    .map(([emoji, nome, prezzo, banco]) => ({ emoji, nome, prezzo, banco }))
}

/* la merce di un banco, fra quella in vendita con quel passo */
export const merceDi = (passo, banco) => scaffale(passo).filter(a => a.banco === banco)

/* Quello che si vede sul banco a questa tappa: fino a otto ceste, pescate
   fra la merce del banco. Meno di così non ci sta il gioco (i clienti
   chiedono fino a cinque cose), più di così non ci sta lo schermo. */
export function esposizione(t) {
  return mescola(merceDi(t.passo, t.banco)).slice(0, MAX_CESTE)
}

/* Che cosa si sta imparando: vedi docs/bancarella/regole.md. L'elemento non
   è la cifra ma il pezzo più piccolo che serve per comporla. */
export const FASCE = [
  { id: 'euro',      passo: 100, nome: 'euro tondi' },
  { id: 'mezzi',     passo: 50,  nome: 'mezzi euro' },
  { id: 'decine',    passo: 10,  nome: 'decine di centesimi' },
  { id: 'cinquine',  passo: 5,   nome: 'cinque centesimi' },
  { id: 'centesimi', passo: 1,   nome: 'centesimi' },
]
export const fasciaDi = cent => FASCE.find(f => cent % f.passo === 0) || FASCE[FASCE.length - 1]
export const chiaveResto = cent => 'bancarella:' + fasciaDi(cent).id

/* Con cosa paga il cliente: è metà della difficoltà del gioco, vedi
   docs/bancarella/regole.md. Se nessuna banconota dichiarata bastasse, si
   ripiega sui modi veri: la banconota che ha in tasca, oppure una cifra
   tonda un po' più alta della spesa — 3,00 €, 2,50 € — che si compone con
   tre pezzi al massimo. Un cliente senza soldi bloccherebbe la fila. */
const PAGAMENTI = [200, 500, 1000, 2000, 5000]
const TONDI = [50, 100, 200, 500, 1000]

function comePuoPagare(totale, ammessi) {
  if (ammessi && ammessi.length) {
    const buoni = ammessi.filter(p => p > totale && scomponi(p, TAGLI).length <= 3)
    if (buoni.length) return buoni.slice().sort((a, b) => a - b)
  }
  const out = new Set()
  for (const p of PAGAMENTI) if (p > totale) out.add(p)
  for (const passo of TONDI)
    for (let k = 0; k < 3; k++) {
      const p = Math.ceil((totale + 1) / passo) * passo + k * passo
      if (p > totale && p <= totale + 2000) out.add(p)
    }
  // deve poterli tirare fuori dal portafoglio: al massimo tre pezzi
  return [...out].filter(p => scomponi(p, TAGLI).length <= 3).sort((a, b) => a - b)
}

/* La spesa, sotto il `tetto` della giornata: si tira a sorte e si riprova
   invece di scegliere i prodotti uno per uno guardando quanto resta, che
   finirebbe per prendere sempre i più economici. */
function spesaDi(t, esposti) {
  const quanti = Math.min(caso(t.articoli[0], t.articoli[1]), esposti.length)
  const tetto = t.tetto || Infinity
  const costa = p => p.reduce((s, a) => s + a.prezzo * a.quanti, 0)
  let presi = null
  for (let prova = 0; prova < 40 && !presi; prova++) {
    const p = mescola(esposti).slice(0, quanti).map(m => ({ ...m, quanti: 1 }))
    if (costa(p) <= tetto) presi = p
  }
  // il ripiego: i più economici del banco, che è il meglio che si possa fare
  if (!presi) presi = [...esposti].sort((a, b) => a.prezzo - b.prezzo)
    .slice(0, quanti).map(m => ({ ...m, quanti: 1 }))

  // «due angurie, per favore»: qualche unità in più dello stesso prodotto,
  // mai più di tre uguali, e solo se ci sta ancora sotto il tetto
  let extra = caso(0, t.copie || 0)
  while (extra-- > 0) {
    const dove = presi.filter(a => a.quanti < 3 && costa(presi) + a.prezzo <= tetto)
    if (!dove.length) break
    scegli(dove).quanti++
  }
  return presi
}

/* Un cliente della tappa: prende solo roba esposta sul banco. */
export function generaCliente(t, esposti = esposizione(t)) {
  const presi = spesaDi(t, esposti)
  const pezzi = presi.reduce((s, a) => s + a.quanti, 0)
  const totale = presi.reduce((s, a) => s + a.prezzo * a.quanti, 0)

  // fra tutti i modi di pagare, quello che lascia il resto della misura giusta
  const modi = comePuoPagare(totale, t.paga)
    .map(p => ({ p, n: scomponi(p - totale, t.monete).length }))
  let scelto
  if (t.pezzi) {
    const [min, max] = t.pezzi
    const buoni = modi.filter(m => m.n >= min && m.n <= max)
    scelto = buoni.length ? scegli(buoni)
      : modi.slice().sort((a, b) => Math.abs(a.n - max) - Math.abs(b.n - max))[0]
  } else scelto = scegli(modi)
  const paga = scelto.p
  const resto = paga - totale

  // chi compra di più ha più roba da farsi dare: il tempo cresce con la spesa
  const pazienza = t.tempo + 8 * (pezzi - 3)
  return { faccia: scegli(FACCE), vestito: scegli(VESTITI),
           articoli: presi, pezzi, totale, paga, resto,
           conto: t.conto || 'niente',
           chiediTotale: !!t.chiediTotale, chiediResto: !!t.chiediResto,
           pagaCon: scomponi(paga, TAGLI),
           banco: t.banco, pazienza, monete: t.monete,
           chiave: chiaveResto(resto),
           minimo: scomponi(resto, t.monete).length }
}

/* Il minimo di pezzi per comporre una cifra: coi tagli dell'euro il più
   grande possibile a ogni passo dà davvero il minimo. */
export function scomponi(cent, disponibili = TAGLI) {
  const out = []
  let r = cent
  for (const t of [...disponibili].sort((a, b) => b - a)) while (r >= t) { out.push(t); r -= t }
  return out
}

/* La tastiera della cassa: si scrive `4` o `4,30`, come sta scritto sul
   cartellino (vedi docs/bancarella/regole.md). Regole e non disegno: vivono
   qui e non nella schermata, `test/unita/bancarella` le prova da sole. */
export function centesimiScritti(testo) {
  const s = String(testo == null ? '' : testo).trim()
  if (!s || s === ',') return null
  const [e, c = ''] = s.split(',')
  if (c.length > 2 || !/^\d*$/.test(e) || !/^\d*$/.test(c)) return null
  return (Number(e || 0) * 100) + Number((c + '00').slice(0, 2))
}

/* quello che si può ancora scrivere: due cifre dopo la virgola, una virgola
   sola, e non si comincia con una fila di zeri */
export function scriviCifra(testo, tasto) {
  const s = String(testo || '')
  if (tasto === '⌫') return s.slice(0, -1)
  if (tasto === ',') return s.includes(',') ? s : (s || '0') + ','
  const [e, c] = s.split(',')
  if (c != null) return c.length >= 2 ? s : s + tasto
  if (e.length >= 4) return s
  return e === '0' ? tasto : s + tasto
}
