/* ═══════════════════════════════════════════════════════════════════
   LA BANCARELLA — il mercato, i banchi, i clienti, il resto.

   Il mercato si gira **a tappe**: una tappa è un banco solo — il
   fruttivendolo, il forno, il frigo — con la sua merce tutta in vista
   nelle ceste. Niente reparti da aprire: davanti hai sei o otto ceste
   e basta, quindi il tempo lo passi a contare i soldi e non a cercare
   dove sta il pane.

   Le giornate di mercato sono una campagna: ognuna ha il suo giro di
   banchi, le sue monete nel cassetto e il suo tempo.

   ── IL DIFETTO CHE HA RIFATTO LA SCALETTA ────────────────────────
   «Passa da super semplice a super complessa nell'ultimo livello.» È
   il verdetto di un genitore, ed era esatto: per cinque giornate la
   cassa faceva **tutti e due i conti** — sommava la spesa e calcolava
   il resto — e al bambino restava un mestiere solo, comporre con le
   monete una cifra che gli veniva detta. Poi, all'ultima giornata, la
   cassa si rompeva e gli arrivavano in faccia **due conti nuovi
   insieme**: la somma e la sottrazione. Non era una salita, era un
   gradino: cinque sere di allenamento a una cosa, e la sesta a
   un'altra.

   La cura non è ammorbidire l'ultima giornata — quella è il traguardo
   giusto — è **mettere la scala che mancava**. Adesso i conti entrano
   uno per volta e da numeri che si fanno a mente:

     · **solo il totale** — la cassa dice ancora il resto, ma la somma
       della spesa la batti tu sulla tastiera. Somme entro il 10 in
       euro tondi, poi tre addendi, poi entro il 20.
     · **solo il resto** — il totale torna scritto sullo scontrino (è
       la cassa a farlo) e a te resta la sottrazione: la roba fa 8 €,
       il cliente paga con 10 €. Poi 20 €, poi 50 €, e solo dopo i
       prezzi cominciano a farsi fini.
     · **tutti e due** — la cassa rotta di sempre, che adesso arriva in
       cima a una scala invece che da un salto.

   ── LA REGOLA DELLA SCALETTA: UNA COSA NUOVA PER GIORNATA ────────
   Ogni giornata cambia **una leva sola** rispetto a quella prima, e
   sempre in salita. Le leve sono sei:

     conto     cosa deve calcolare il bambino: niente · totale · resto · tutto
     banchi    quante tappe ha la giornata (tre o quattro)
     articoli  quante cose diverse chiede un cliente
     copie     «due angurie»: quante unità in più dello stesso prodotto
     passo     quanto sono fini i prezzi: 1 € · 50c · 10c · 5c · 1c
     paga      la banconota più grossa che il cliente tira fuori

   Quando entra una leva pesante — un conto nuovo — le altre **tornano
   indietro**: è la stessa scelta che la cassa rotta faceva già da sola
   («il tempo torna largo e il resto torna corto»), ed è il motivo per
   cui la fatica non fa mai due salti insieme. Alleggerire è gratis,
   appesantire costa una giornata.

   `pezzi` — quante monete deve chiedere il resto — **non è fra le
   leve**, ed è deliberato: è la conseguenza di quanto è fine il passo
   e di quanto è grossa la banconota, e contarla a parte vorrebbe dire
   contare due volte la stessa cosa. Resta come *promessa* dove il
   cliente può scegliere con cosa pagare (le prime giornate); dove la
   banconota è fissa — «paga con 20 €» — la promessa non si può fare, e
   infatti non c'è.

   ── LA TABELLA DELLA PROGRESSIONE ────────────────────────────────
   Sedici giornate, quindici passaggi, una leva per passaggio.
   `test/unita/bancarella` la ricontrolla a ogni giro: se qualcuno
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
   16  La cassa rotta        tutto    4     3    1    5c    20 €   TUTTI E DUE I CONTI INSIEME

   Le sei giornate di ieri sono tutte ancora qui, con lo stesso id — si
   sono solo spostate lungo la fila, e `migraMercato` in
   `store/profile.js` porta ogni salvataggio dove gli tocca.
   ═══════════════════════════════════════════════════════════════════ */

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

/* ═══════════ IL LISTINO ═══════════
   Prezzi FISSI, sempre gli stessi: è un listino da mercato, non un generatore
   di numeri a caso. Così il bambino impara a memoria che il pane costa 1,50 e
   il cartellino sulla cesta diventa qualcosa da leggere davvero.
   [emoji, nome, prezzo in centesimi, banco]

   Ogni banco tiene **almeno sei cose in euro tondi**, e non è un vezzo: le
   prime giornate chiedono di sommare a mente, e «2 € + 3 €» è il posto da
   cui si parte. Senza quella riserva il banco a passo 1 € restava con tre
   ceste in croce, o la prima somma cominciava da 0,89 + 1,39. */
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

/* ═══════════ CHI FA IL CONTO ═══════════
   Una giornata dichiara `conto`, e sono quattro parole in fila di fatica.
   Non è un interruttore per gioco: è **la scala** su cui è costruita la
   campagna, e non torna mai indietro.

     niente   la cassa somma e sottrae; al bambino resta comporre il resto
              con le monete del cassetto — il gesto di base
     totale   la riga TOTALE dello scontrino dice `? ? ?`: la somma la
              batte lui sulla tastiera della cassa. Il resto lo dice ancora
              il display
     resto    il totale torna scritto, il display dice `? ? ?`: la
              sottrazione la fa lui, posa le monete e preme ✓
     tutto    la cassa rotta: `? ? ?` tutte e due le volte

   Il patto è che **la cassa non dice mai la cifra giusta**: sbagliare
   costa tempo e si riprova, come quando si sbaglia a dare il resto per
   davvero. Se la svelasse, il conto dopo non lo farebbe più nessuno. */
export const CONTI = ['niente', 'totale', 'resto', 'tutto']
export const chiedeIlTotale = c => c === 'totale' || c === 'tutto'
export const chiedeIlResto = c => c === 'resto' || c === 'tutto'

/* ═══════════ QUANTO RENDE UN CLIENTE ═══════════
   `CALIBRAZIONE.md`: 🪙1 sono dieci secondi di esercizio, e una domanda
   vera ne vale tre. Un cliente non è una domanda — è un pezzo di lavoro
   che si può misurare — e quanto lavoro sia dipende da quello che la
   giornata gli fa fare:

     niente   leggere la lista, prendere due o tre cose dalle ceste,
              comporre con le monete un resto già scritto        ~20 s  🪙2
     totale   + una somma di due o tre prezzi                    ~30 s  🪙3
     resto    + una sottrazione                                  ~30 s  🪙3
     tutto    + tutte e due                                      ~40 s  🪙4

   Una giornata da quattro banchi sono dodici clienti: 🪙24 la più facile,
   🪙48 la più tosta — quattro e otto minuti di esercizio, che è quello
   che ci si mette davvero. Prima il premio era `level`, cioè il livello
   del bambino: la stessa giornata pagava il doppio a chi giocava da più
   tempo, e una giornata facile quanto una tosta.

   Un cliente che se ne va non paga niente: quello che non si è fatto non
   si paga (`CALIBRAZIONE.md`, «una risposta sbagliata non paga niente»). */
export const MONETE_CLIENTE = { niente: 2, totale: 3, resto: 3, tutto: 4 }
export const premioCliente = camp => MONETE_CLIENTE[(camp && camp.conto) || 'niente']

/* ═══════════ QUANTO È DIFFICILE UNA GIORNATA ═══════════
   Un numero solo, che pesa le sei leve. Non serve a giocare: serve a
   **ordinare la fila** e a ricavarne la `portata`, e serve al test, che
   controlla che due giornate vicine non siano lontane più di `SALTO`.

   I pesi non sono opinioni: il conto è la cosa più cara (una sottrazione
   a mente vale più di due centesimi in più sul cartellino), i centesimi
   costano poco alla volta e tanto in fondo, la banconota grossa sposta il
   resto di un ordine di grandezza. */
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

/* ═══════════ LE GIORNATE DI MERCATO ═══════════
   Una campagna è una giornata: un giro di banchi, tre clienti per banco.

   `tempo` sono i secondi di pazienza per una spesa da tre pezzi: il primo
   numero è quello della prima tappa, il secondo quello dell'ultima. Dentro
   la giornata si stringe piano. Da una giornata all'altra si stringe
   finché non entra un conto nuovo: lì **torna largo**, perché la fatica si
   è spostata sulla testa e non sulle dita.
   Chi compra di più aspetta di più: +8 secondi per ogni pezzo oltre i tre.

   `pezzi` è quante monete deve chiedere il resto: dove c'è, il cliente
   sceglie con che cosa pagare apposta perché venga così.

   `tetto` è quanto può costare al massimo la spesa: è la leva che tiene le
   somme «entro il 10» e «entro il 20», e serve anche a garantire che la
   banconota dichiarata basti sempre a pagare.

   `paga` è con che cosa paga il cliente — l'elenco vero delle banconote che
   può tirare fuori. Dove ce n'è una sola («paga con 20 €») è quella e
   basta, ed è così che la sottrazione parte da un numero conosciuto.

   `copie` è quante unità in più può volere dello stesso prodotto.

   `portata` è dove sta la giornata sulla scala 0-100 di `data/portata.js`,
   e **non si scrive a mano**: esce da `fatica` (vedi `conPortata` più
   sotto). Sta sulla GIORNATA e non sul singolo banco perché è la giornata
   a dire quanto è difficile; il banco cambia solo la merce.

   `scuola: 'numeri'` — comporre un resto è aritmetica che la scuola dà,
   quindi a chi l'ha già passata le prime giornate non si offrono più.

   `nuovo` è la cosa che questa giornata aggiunge, in parole: si legge
   sulla carta della giornata, e il test la pretende su tutte tranne la
   prima — una giornata che non aggiunge niente non ha motivo di esistere. */
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

/* ── la portata, ricavata e non scelta ──
   Il numero 0-100 di `data/portata.js` (0 = quattro anni, 12,5 punti per
   anno) esce dalla `fatica` della giornata, riscalata sull'arco che il
   gioco dichiara: dai sei anni e mezzo ai dieci scarsi.

   Quello che si riscala è il **massimo raggiunto** e non la fatica di
   quella giornata sola, e il motivo è la regola di sopra: quando entra un
   conto nuovo le altre leve tornano indietro, quindi la fatica scende
   anche se la scaletta sta salendo. Una campagna invece non torna mai
   indietro — `filaConPortata` è un cancello, e un cancello che si riapre
   rimetterebbe in fila roba già passata. */
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

/* La giornata libera: si apre a campagna finita, non finisce mai e il giro
   dei banchi ricomincia da capo. Il tempo scende di due secondi a tappa e
   poi si ferma: deve restare una sfida, non una condanna. La cassa resta
   rotta — dopo sedici giornate tornare a farsi dire il resto sarebbe un
   passo indietro — e qui il cliente paga con quello che gli pare. */
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

/* ═══════════ che cosa si sta imparando ═══════════
   Il motore di apprendimento vuole una chiave per elemento, e nel resto
   l'elemento non è la cifra — 2,40 € oggi e 2,40 € domani non sono due
   cose diverse da sapere. Quello che cambia la fatica è il pezzo più
   piccolo che serve per comporlo: dare 2,00 € è un conto da euro tondi,
   dare 2,37 € vuol dire scendere fino ai centesimi.

   Cinque fasce, una per gradino della scala dei tagli, e si scoprono da
   sole andando avanti: nelle prime giornate i prezzi sono in euro tondi e
   i centesimi non compaiono proprio. */
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
   anni.

   Due modi, e la giornata sceglie quale:

     · `paga` con una voce sola — il cliente ha **quella** banconota e
       basta («paga con 20 €»). Serve alle giornate del resto, dove il
       punto è che la sottrazione parta da un numero conosciuto; il
       `tetto` della giornata garantisce che basti sempre.
     · `paga` con più voci — fra i modi in cui potrebbe pagare sceglie
       quello che lascia un resto **da tante monete quante ne vuole la
       giornata** (`pezzi`), e se `pezzi` non c'è tira a sorte.

   Se per qualche motivo nessuna delle banconote dichiarate bastasse, si
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

/* La spesa: quante cose, quali, e le copie — il tutto sotto il `tetto`
   della giornata, che è quello che tiene «le somme entro il dieci».
   Si tira a sorte e si riprova invece di scegliere i prodotti uno per uno
   guardando quanto resta: quella strada darebbe sempre le stesse spese
   povere, perché finirebbe per prendere sempre i più economici. */
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

/* Un cliente della tappa: prende solo roba che è sul banco davanti, perché
   quella è tutta la merce che esiste in questo momento. */
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

/* La cifra composta col minor numero di pezzi possibile: serve per il bonus
   "pagato giusto" e ai test. Con i tagli dell'euro prendere sempre il più
   grande possibile dà davvero il minimo. */
export function scomponi(cent, disponibili = TAGLI) {
  const out = []
  let r = cent
  for (const t of [...disponibili].sort((a, b) => b - a)) while (r >= t) { out.push(t); r -= t }
  return out
}

/* ═══════════ la tastiera della cassa ═══════════
   Nelle giornate del totale il bambino batte la cifra come si batte su un
   registratore vero: le cifre, la virgola, e la cassa la legge. Si scrive
   `4` o `4,30` — cioè **come sta scritto sul cartellino**, che è il punto:
   una tastiera in centesimi avrebbe insegnato a scrivere 430 per dire
   quattro euro e trenta.

   Vivono qui e non nella schermata perché sono regole e non disegno:
   `test/unita/bancarella` le prova senza aprire niente. */
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
