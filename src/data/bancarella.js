/* ═══════════════════════════════════════════════════════════════════
   LA BANCARELLA — il mercato, i banchi, i clienti, il resto.

   Il mercato si gira **a tappe**: una tappa è un banco solo — il
   fruttivendolo, il forno, il frigo — con la sua merce tutta in vista
   nelle ceste. Niente reparti da aprire: davanti hai sei o otto ceste
   e basta, quindi il tempo lo passi a contare i soldi e non a cercare
   dove sta il pane.

   Le giornate di mercato sono una campagna: ognuna ha il suo giro di
   banchi, le sue monete nel cassetto e il suo tempo — che si stringe
   tappa dopo tappa e giornata dopo giornata. È lì che sta la
   difficoltà crescente, non nei numeri più grandi.
   ═══════════════════════════════════════════════════════════════════ */

export const TAGLI = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]  // centesimi
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

/* ═══════════ IL LISTINO ═══════════
   Prezzi FISSI, sempre gli stessi: è un listino da mercato, non un generatore
   di numeri a caso. Così il bambino impara a memoria che il pane costa 1,50 e
   il cartellino sulla cesta diventa qualcosa da leggere davvero.
   [emoji, nome, prezzo in centesimi, banco] */
export const LISTINO = [
  // ---- il fruttivendolo ----
  ['🍎', 'mele', 50, 'frutta'],       ['🍌', 'banane', 100, 'frutta'],
  ['🍐', 'pere', 70, 'frutta'],       ['🍇', 'uva', 200, 'frutta'],
  ['🍋', 'limoni', 60, 'frutta'],     ['🍉', 'anguria', 400, 'frutta'],
  ['🍓', 'fragole', 325, 'frutta'],   ['🍊', 'arance', 89, 'frutta'],
  ['🫐', 'mirtilli', 249, 'frutta'],
  // ---- l'orto ----
  ['🥕', 'carote', 50, 'verdura'],    ['🍅', 'pomodori', 150, 'verdura'],
  ['🥔', 'patate', 120, 'verdura'],   ['🌽', 'mais', 80, 'verdura'],
  ['🥬', 'insalata', 190, 'verdura'], ['🍄', 'funghi', 290, 'verdura'],
  ['🧅', 'cipolle', 90, 'verdura'],   ['🥦', 'broccoli', 139, 'verdura'],
  ['🥒', 'cetrioli', 79, 'verdura'],
  // ---- il forno ----
  ['🍞', 'pane', 150, 'forno'],       ['🥐', 'brioche', 50, 'forno'],
  ['🥨', 'salatini', 100, 'forno'],   ['🍕', 'pizza', 500, 'forno'],
  ['🍰', 'torta', 450, 'forno'],      ['🍩', 'ciambella', 100, 'forno'],
  ['🥯', 'bagel', 130, 'forno'],      ['🥖', 'baguette', 119, 'forno'],
  ['🥧', 'crostata', 399, 'forno'],
  // ---- il frigo: tutto quello che va tenuto al freddo, gelato compreso ----
  ['🥛', 'latte', 100, 'frigo'],      ['🧀', 'formaggio', 250, 'frigo'],
  ['🥚', 'uova', 200, 'frigo'],       ['🧈', 'burro', 150, 'frigo'],
  ['🧃', 'succo', 100, 'frigo'],      ['🍦', 'gelato', 100, 'frigo'],
  ['🐟', 'pesce', 615, 'frigo'],      ['🍗', 'pollo', 449, 'frigo'],
  ['🥓', 'pancetta', 279, 'frigo'],
  // ---- i dolciumi: quelli confezionati, sullo scaffale ----
  ['🍪', 'biscotti', 150, 'dolci'],   ['🍫', 'cioccolato', 200, 'dolci'],
  ['🍬', 'caramelle', 50, 'dolci'],   ['🍭', 'lecca-lecca', 50, 'dolci'],
  ['🍿', 'popcorn', 100, 'dolci'],    ['🥤', 'bibita', 120, 'dolci'],
  ['🍯', 'miele', 485, 'dolci'],      ['🧁', 'cupcake', 189, 'dolci'],
  ['🍮', 'budino', 129, 'dolci'],
]

/* ═══════════ I BANCHI ═══════════
   Cinque banchi piccoli invece di quattro reparti grandi: a un banco ci
   stanno otto o nove prodotti, e otto ceste ci stanno tutte sullo schermo.
   Le categorie devono essere ovvie — il gelato sta al frigo perché è lì che
   un bambino lo cerca, non fra i dolci confezionati. */
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
/* il colore del vestito: la fila si legge da lontano solo se le persone sono
   persone e non tre emoji piccole in fila */
export const VESTITI = ['#e2725b', '#5b8ee2', '#67a95a', '#d9a441', '#9a6fbf',
                        '#4fa8a0', '#d96fa0', '#7a8ba0']

/* ═══════════ LE GIORNATE DI MERCATO ═══════════
   Una campagna è una giornata: un giro di banchi, tre clienti per banco. Da
   una giornata all'altra crescono tre cose insieme — quante tappe, quanto
   sono precisi i prezzi (e quindi quali monete servono davvero), e quanto
   tempo ha il cliente prima di spazientirsi.

   `tempo` sono i secondi di pazienza per una spesa da tre pezzi: il primo
   numero è quello della prima tappa, il secondo quello dell'ultima. Dentro
   la giornata si stringe piano; da una giornata all'altra si stringe di più.
   Chi compra di più aspetta di più: +8 secondi per ogni pezzo oltre i tre.

   `pezzi` è **quante monete deve chiedere il resto**, ed è la difficoltà
   vera del gioco: non conta che il resto sia 4,90 € o 0,40 €, conta se lo
   componi con due pezzi o con cinque. Nella prima giornata una moneta o due
   e basta; il cliente sceglie con cosa pagare apposta perché venga così.

   `copie` è quante unità in più può volere dello stesso prodotto — «due
   angurie» —, zero nella prima giornata. */
export const CAMPAGNE = [
  { id: 'banchetto', nome: 'Il banchetto',       emoji: '🧺',
    dritta: 'Il cliente chiede, tu prendi dalla cesta giusta. Poi la cassa dice quanto resto dare: tu lo componi.',
    tappe: ['frutta', 'forno', 'dolci'],
    passo: 10, articoli: [3, 3], tempo: [95, 90], pezzi: [1, 2], copie: 0,
    monete: [10, 20, 50, 100, 200, 500] },

  { id: 'paese', nome: 'Il mercato del paese',   emoji: '⛺',
    dritta: 'Qualcuno vuole due cose uguali, e il resto adesso vuole due o tre monete.',
    tappe: ['frutta', 'verdura', 'forno', 'frigo'],
    passo: 10, articoli: [3, 4], tempo: [90, 80], pezzi: [2, 3], copie: 1,
    monete: [10, 20, 50, 100, 200, 500] },

  { id: 'grande', nome: 'Il mercato grande',     emoji: '🏪',
    dritta: 'Arrivano i 5 centesimi: certi resti adesso finiscono per 5 e la moneta piccola serve davvero.',
    tappe: ['verdura', 'frutta', 'forno', 'frigo', 'dolci'],
    passo: 5, articoli: [3, 4], tempo: [80, 70], pezzi: [2, 4], copie: 1,
    monete: [5, 10, 20, 50, 100, 200, 500] },

  { id: 'coperto', nome: 'Il mercato coperto',   emoji: '🏬',
    dritta: 'I cartellini finiscono per 9: 0,89 €, 1,39 €. Nel cassetto arrivano 1c e 2c, e senza quelle non si chiude.',
    tappe: ['forno', 'frigo', 'dolci', 'frutta', 'verdura'],
    passo: 1, articoli: [4, 4], tempo: [75, 62], pezzi: [3, 5], copie: 2,
    monete: [1, 2, 5, 10, 20, 50, 100, 200, 500] },

  { id: 'fiera', nome: 'La fiera',               emoji: '🎪',
    dritta: 'Spese grosse, banconote da 10 € e clienti di fretta: qui si vede il negoziante vero.',
    tappe: ['frigo', 'dolci', 'verdura', 'forno', 'frutta'],
    passo: 1, articoli: [4, 5], tempo: [70, 55], pezzi: [4, 6], copie: 2,
    monete: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000] },

  /* L'ultima giornata toglie l'unico aiuto che c'è sempre stato: fin qui la
     cassa **diceva** il resto e il gioco era comporlo. Qui la cassa è rotta:
     dice la spesa e con cosa hai pagato, il resto lo fai tu, metti le monete
     e premi ✓ — e lei risponde soltanto giusto o sbagliato. Per questo il
     tempo torna largo e il resto torna corto: la fatica si sposta tutta sul
     conto, e due conti da fare insieme sarebbero uno di troppo. */
  { id: 'mente', nome: 'La cassa rotta',         emoji: '🧠',
    dritta: 'La cassa non calcola più: guarda la spesa, guarda con cosa paga, e il resto contalo tu. Metti le monete e premi ✓.',
    tappe: ['frutta', 'forno', 'verdura', 'frigo', 'dolci'],
    passo: 5, articoli: [3, 4], tempo: [95, 80], pezzi: [2, 4], copie: 1,
    mente: true,
    monete: [5, 10, 20, 50, 100, 200, 500, 1000] },
]

/* La giornata libera: si apre a campagna finita, non finisce mai e il giro
   dei banchi ricomincia da capo. Il tempo scende di due secondi a tappa e
   poi si ferma: deve restare una sfida, non una condanna. */
export const LIBERA = {
  id: 'libera', nome: 'Giornata libera', emoji: '♾️',
  dritta: 'Il mercato non chiude: si va avanti finché reggi.',
  tappe: ['frutta', 'verdura', 'forno', 'frigo', 'dolci'],
  passo: 1, articoli: [4, 5], tempo: [70, 45], pezzi: [4, 6], copie: 2, libera: true,
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
           pezzi: camp.pezzi, copie: camp.copie, mente: !!camp.mente }
}

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

/* ═══════════ che cosa si sta imparando ═══════════
   Il motore di apprendimento vuole una chiave per elemento, e nel resto
   l'elemento non è la cifra — 2,40 € oggi e 2,40 € domani non sono due
   cose diverse da sapere. Quello che cambia la fatica è il pezzo più
   piccolo che serve per comporlo: dare 2,00 € è un conto da euro tondi,
   dare 2,37 € vuol dire scendere fino ai centesimi.

   Cinque fasce, una per gradino della scala dei tagli, e si scoprono da
   sole andando avanti: nelle prime giornate i prezzi sono a scatti di 10c
   e i centesimi non compaiono proprio. */
export const FASCE = [
  { id: 'euro',      passo: 100, nome: 'euro tondi' },
  { id: 'mezzi',     passo: 50,  nome: 'mezzi euro' },
  { id: 'decine',    passo: 10,  nome: 'decine di centesimi' },
  { id: 'cinquine',  passo: 5,   nome: 'cinque centesimi' },
  { id: 'centesimi', passo: 1,   nome: 'centesimi' },
]
export const fasciaDi = cent => FASCE.find(f => cent % f.passo === 0) || FASCE[FASCE.length - 1]
export const chiaveResto = cent => 'bancarella:' + fasciaDi(cent).id

/* ═══════════ con cosa paga il cliente ═══════════
   Non è un dettaglio: **è la difficoltà del gioco**. Il resto di 4,90 € da
   comporre con cinque monete e quello di 0,40 € da comporre con due sono lo
   stesso conto per il computer e due mestieri diversi per un bambino di otto
   anni. Quindi il cliente non paga a caso: fra i modi in cui potrebbe pagare
   sceglie quello che lascia un resto **da tante monete quante ne vuole la
   giornata** (`pezzi`).

   I modi possibili sono quelli veri: la banconota che ha in tasca, oppure una
   cifra tonda un po' più alta della spesa — 3,00 €, 2,50 € — che si compone
   con tre pezzi al massimo. */
const PAGAMENTI = [200, 500, 1000, 2000, 5000]
const TONDI = [50, 100, 200, 500, 1000]

function comePuoPagare(totale) {
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

/* Un cliente della tappa: prende solo roba che è sul banco davanti, perché
   quella è tutta la merce che esiste in questo momento. */
export function generaCliente(t, esposti = esposizione(t)) {
  const quanti = Math.min(caso(t.articoli[0], t.articoli[1]), esposti.length)
  const presi = mescola(esposti).slice(0, quanti).map(m => ({ ...m, quanti: 1 }))

  // «due angurie, per favore»: qualche unità in più dello stesso prodotto,
  // mai più di tre uguali, e solo dalla seconda giornata in poi
  let extra = caso(0, t.copie || 0)
  while (extra-- > 0) {
    const dove = presi.filter(a => a.quanti < 3)
    if (!dove.length) break
    scegli(dove).quanti++
  }
  const pezzi = presi.reduce((s, a) => s + a.quanti, 0)
  const totale = presi.reduce((s, a) => s + a.prezzo * a.quanti, 0)

  // fra tutti i modi di pagare, quello che lascia il resto della misura giusta
  const [min, max] = t.pezzi
  const modi = comePuoPagare(totale)
    .map(p => ({ p, n: scomponi(p - totale, t.monete).length }))
  const buoni = modi.filter(m => m.n >= min && m.n <= max)
  const scelto = buoni.length ? scegli(buoni)
    : modi.slice().sort((a, b) => Math.abs(a.n - max) - Math.abs(b.n - max))[0]
  const paga = scelto.p
  const resto = paga - totale

  // chi compra di più ha più roba da farsi dare: il tempo cresce con la spesa
  const pazienza = t.tempo + 8 * (pezzi - 3)
  return { faccia: scegli(FACCE), vestito: scegli(VESTITI),
           articoli: presi, pezzi, totale, paga, resto, mente: !!t.mente,
           pagaCon: scomponi(paga, TAGLI),
           banco: t.banco, pazienza, monete: t.monete,
           chiave: chiaveResto(resto),
           minimo: scomponi(resto, t.monete).length }
}

/* La cifra composta col minor numero di pezzi possibile: serve per il bonus
   "pagato giusto" e ai test. Con i tagli dell'euro prendere sempre il più
   grande possibile dà davvero il minimo. */
export function scomponi(cent, disponibili = TAGLI) {
  const out = []
  let r = cent
  for (const t of [...disponibili].sort((a, b) => b - a)) while (r >= t) { out.push(t); r -= t }
  return out
}
