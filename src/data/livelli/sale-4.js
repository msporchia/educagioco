/* ═══════════════════════════════════════════════════════════════════
   🧂 LA CAROVANA DEL SALE — capitolo 4: «I fuochi del crinale»
   forma: esca · concetto: eventi (suona / quando senti)

   LA STORIA. Sul crinale che domina la strada ci sono i fuochi dei
   briganti del passo. Sono più di noi e stanno più in alto, e il capo
   sta **piantato in mezzo alla strada**, ai piedi dell'unica rampa che
   sale al crinale: vede lontano cinque caselle e va incontro a quello
   che vede. Non c'è modo di passargli davanti senza che se ne accorga,
   e non c'è modo di batterlo: dietro di lui sono troppi. Ma le vedette
   guardano **dove si muove qualcosa**, e Sisa va dove il carro non va.

   EREDITA dal capitolo 3 **Sisa**, che è l'unica che sale il costone,
   e il **sale**, che il carro non può lasciare e che non gli permette
   di accelerare: il tempo, qui, te lo devi comprare.
   LASCIA **Sisa di là**. Quando il carro passa, lei è in cima al
   crinale e i briganti sono fra lei e voi. Il capitolo 5 esiste per
   andarla a riprendere.

   COSA INSEGNA. GLI EVENTI, cioè come si mettono d'accordo due che
   non si vedono. Il carro sta sulla strada e il crinale non lo vede;
   Sisa sta sul crinale e non sa quando il carro è pronto. Nessuno dei
   due può indovinare l'altro: quello che non vedi te lo deve dire
   qualcuno. Sisa **suona**, e le liste degli altri tre cominciano con
   **quando senti**.

   E LA COSA DA CAPIRE È *QUANDO* SUONARE, non come. Farsi vedere non
   basta a niente di per sé: serve che il capo lasci la strada. Il
   suo piano si legge, e c'è scritto nella sua scheda, non nei suoi
   ordini: **accorre al grido**. Quando una vedetta vede Sisa e chiama,
   lui risale la rampa e ci corre. Da quel momento la strada non la
   guarda più nessuno, e non un momento prima. Chi fa suonare Sisa
   appena parte manda il carro addosso a un capo che è ancora al suo
   posto, e il capo va per il carro: nonna Rea non regge un colpo.

   PERCHÉ SISA NON RISCHIA NIENTE. Le vedette non hanno ordini: stanno
   al fuoco e basta. Quello che fanno sta nella loro scheda — gridano,
   una volta sola, appena vedono qualcuno — e un grido non ha mai fatto
   male a una capra. Chi mena è uno solo, il capo, e nei suoi ordini
   c'è scritto per chi: il carro.

   LA MAPPA (34×18). La strada in basso, dritta, con una stanga di
   traverso messa lì dai briganti; il crinale in alto, lungo; **una
   rampa sola** che li unisce, e ai suoi piedi sta il capo. Il costone di
   Sisa parte dalla strada molto indietro, prima della stanga, sale
   fino in cima e sbuca sul crinale dalla parte opposta al capo: è
   lungo apposta, perché il tempo che Sisa ci mette è il tempo che il
   carro deve **non** muoversi.
   ═══════════════════════════════════════════════════════════════════ */

/* ── le scorciatoie per scrivere i dati (le stesse di data/generale.js,
      ricopiate qui perché questo file deve stare in piedi da solo) ── */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const caduto = complemento => ({ cond: 'vivo', complemento, non: true })

function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const CRINALE = (() => {
  const g = tela(34, 18)
  cava(g, 1, 13, 32, 13)     // la strada, sotto il crinale
  cava(g, 20, 9, 20, 13)     // la rampa: l'unico collegamento, e ci sta il capo
  cava(g, 6, 9, 30, 9)       // il crinale
  cava(g, 2, 5, 2, 13)       // il costone di Sisa, che parte da molto indietro
  cava(g, 2, 5, 8, 5)        // il traverso in cima
  cava(g, 8, 5, 8, 9)        // e sbuca sul crinale, dalla parte opposta al capo
  return stampa(g)
})()

/* IL PIANO DEL CAPO, e sono due righe: aspetta di vedere qualcuno
   della carovana, e poi va **per il carro** — `attacca [nonna Rea]`,
   non «attacca la carovana». Vito potrebbe passargli davanti tutto il
   giorno.
   Quello che conta però non è scritto qui: è nella sua SCHEDA.
   `accorre: aiuto` vuol dire che quando sente un grido molla il posto
   e corre dov'è partito, e riprende i suoi ordini solo quando è
   arrivato. È l'unica falla della loro guardia, e va aperta apposta. */
const CAPO = [
  { verbo: 'aspettaDiVedere', complemento: 'carovana' },
  o('attacca', 'rea'),
]

export const SALE_4 = {
  id: 'sale-fuochi', nome: 'I fuochi del crinale',
  idea: 'Fatti vedere, e poi dillo: prima no',
  storia: 'sale', capitolo: 4, emoji: '🔥',
  forma: 'esca', concetto: 'eventi',
  eredita: ['sisa', 'sale'], lascia: ['sisa'],

  dritta: 'Il capo sta in mezzo alla strada, ai piedi della rampa, e non se ne va per niente al mondo — <b>tranne che per un grido</b>: guarda la sua scheda. Le vedette gridano appena vedono qualcuno. Sisa deve farsi vedere <b>prima</b>, e solo dopo suonare: le liste degli altri tre cominciano con «quando senti».',
  racconto: 'Sul crinale ci sono i fuochi, e ai piedi della rampa c\'è il capo: vede arrivare la strada da lontano, e quello che vuole è il carro. Le vedette non menano nessuno — <b>gridano</b>, e quando gridano il capo accorre e lascia il posto. Sisa sale per il costone e va a farsi vedere; poi <b>suona</b>, e allora il carro parte. Si vince quando Rea, Vito e Bugo sono nella valle. Sisa resta di là — e ce la si va a riprendere nel capitolo dopo.',
  aiuti: [
    'Non serve battere nessuno: serve che il capo <b>non sia più</b> sulla strada quando il carro ci passa.',
    'Sisa deve prima arrivare allo sperone e <b>farsi vedere</b>, e suonare dopo. Suonare per prima cosa è mandare il carro allo sbaraglio.',
    'Sulla strada c\'è una stanga: la apre Bugo, e finché è chiusa il carro non si muove di un passo.',
  ],

  griglia: CRINALE, ambiente: 'bosco',

  nomi: {
    sperone: 'lo sperone del crinale', valle: 'la valle', stanga: 'la stanga dei briganti',
    carovana: 'la carovana', briganti: 'i briganti del passo',
  },
  posti: {
    sperone: { x: 13, y: 9 },
    valle: { x: 32, y: 13 },
  },
  porte: {
    stanga: { x: 10, y: 13 },
  },
  segnali: ['ora', 'aiuto'],

  unita: [
    { id: 'rea', nome: 'nonna Rea', fazione: 'carovana', emoji: '🧓', chi: 'mago',
      vista: 3, vita: 1, x: 6, y: 13, sa: ['vai', 'quando'] },
    { id: 'vito', nome: 'Vito', fazione: 'carovana', emoji: '🛡️', chi: 'cavaliere',
      vista: 5, vita: 14, x: 3, y: 13, sa: ['vai', 'attacca', 'quando'] },
    { id: 'bugo', nome: 'Bugo', fazione: 'carovana', emoji: '🔧', chi: 'ladra',
      vista: 4, vita: 6, x: 4, y: 13, sa: ['vai', 'apri', 'quando'] },
    /* Sisa: l'unica che sale il costone, e l'unica che sa suonare in
       questo capitolo. Non apre niente, non mena nessuno, non porta
       niente — corre e si fa vedere, e qui è tutto. */
    { id: 'sisa', nome: 'Sisa', fazione: 'carovana', emoji: '🐐', chi: 'gatto', manto: 'bianco',
      vista: 5, vita: 10, x: 5, y: 13, sa: ['vai', 'suona', 'pattuglia'] },
    /* il capo sta **in mezzo alla strada**, ai piedi della rampa, e
       vede cinque caselle davanti a sé: di lì non passa un carro senza
       che lui lo veda arrivare e gli vada incontro. Non ha nessuna
       intenzione di muoversi — se non per un grido, e allora risale la
       rampa e va dove l'hanno chiamato. */
    { id: 'capo', nome: 'il capo dei briganti', fazione: 'briganti', emoji: '🪓', chi: 'capitano',
      vista: 5, vita: 20, x: 20, y: 13, accorre: 'aiuto' },
    /* le vedette non hanno ordini: stanno al loro fuoco. Gridano, una
       volta sola, e non fanno altro in tutta la scena. */
    { id: 'vedetta1', nome: 'una vedetta', fazione: 'briganti', emoji: '🔥', chi: 'orco',
      vista: 3, vita: 8, x: 16, y: 9, grida: 'aiuto' },
    { id: 'vedetta2', nome: 'un\'altra vedetta', fazione: 'briganti', emoji: '🔥', chi: 'orco',
      vista: 3, vita: 8, x: 24, y: 9, grida: 'aiuto' },
  ],
  fazioni: {
    carovana: { nome: 'la carovana', autore: 'giocatore' },
    briganti: { nome: 'i briganti del passo', autore: 'livello', ordini: { capo: CAPO } },
  },

  complementi: ['sperone', 'valle', 'stanga', 'ora'],

  obiettivo: [qui('rea', 'valle'), qui('vito', 'valle'), qui('bugo', 'valle')],
  sconfitta: [caduto('rea')],
  motivoSconfitta: 'Il capo era ancora sulla strada: il carro gli è andato addosso.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA — solo disegno, non passa dal motore ── */
  scenografia: [
    { che: 'cespuglio', x: 9, y: 13 }, { che: 'cartello', x: 11, y: 13 },
    { che: 'roccia', x: 13, y: 13 }, { che: 'pozzanghera', x: 15, y: 13, strato: -1 },
    { che: 'albero', x: 18, y: 13 }, { che: 'cespuglio', x: 23, y: 13 },
    { che: 'roccia', x: 27, y: 13 }, { che: 'albero', x: 30, y: 13 },
    { che: 'roccia', x: 2, y: 8 }, { che: 'cespuglio', x: 2, y: 10 },
    { che: 'albero', x: 4, y: 5 }, { che: 'roccia', x: 6, y: 5 },
    { che: 'cespuglio', x: 8, y: 7 },
    { che: 'falo', x: 17, y: 9 }, { che: 'falo', x: 25, y: 9 },
    { che: 'tenda', x: 19, y: 9 }, { che: 'tenda', x: 28, y: 9 },
    { che: 'ossa', x: 22, y: 9 }, { che: 'bandiera', x: 21, y: 9 },
    { che: 'roccia', x: 29, y: 9 }, { che: 'cespuglio', x: 7, y: 9 },
    { che: 'stalagmite', x: 30, y: 9 },
  ],

  /* Tre scene, e cambia **quanto costa farsi vedere**: dove sta la
     vedetta che vede per prima, dove Sisa deve arrivare per entrarle
     negli occhi, e da dove parte Sisa. Nella terza è già a mezza
     costa, ed è l'unica in cui suonare per prima cosa non fa danno —
     ed è esattamente per questo che è una trappola: la stessa mossa,
     nelle altre due, lascia il capo dov'è. */
  varianti: [
    { nome: 'la vedetta a metà crinale',
      posti: { sperone: { x: 13, y: 9 }, valle: { x: 32, y: 13 } },
      porte: { stanga: { x: 10, y: 13 } },
      unita: { vedetta1: { x: 16, y: 9 }, vedetta2: { x: 24, y: 9 }, capo: { x: 20, y: 13 },
               rea: { x: 6, y: 13 }, vito: { x: 3, y: 13 }, bugo: { x: 4, y: 13 },
               sisa: { x: 5, y: 13 } } },
    { nome: 'i fuochi in due punti, e il crinale è lungo',
      posti: { sperone: { x: 15, y: 9 }, valle: { x: 31, y: 13 } },
      porte: { stanga: { x: 12, y: 13 } },
      unita: { vedetta1: { x: 18, y: 9 }, vedetta2: { x: 27, y: 9 }, capo: { x: 20, y: 13 },
               rea: { x: 7, y: 13 }, vito: { x: 1, y: 13 }, bugo: { x: 3, y: 13 },
               sisa: { x: 6, y: 13 } } },
    { nome: 'Sisa è già a mezza costa',
      posti: { sperone: { x: 11, y: 9 }, valle: { x: 32, y: 13 } },
      porte: { stanga: { x: 8, y: 13 } },
      unita: { vedetta1: { x: 14, y: 9 }, vedetta2: { x: 26, y: 9 }, capo: { x: 20, y: 13 },
               rea: { x: 5, y: 13 }, vito: { x: 1, y: 13 }, bugo: { x: 3, y: 13 },
               sisa: { x: 8, y: 9 } } },
  ],

  par: 9,
  soluzioni: [
    /* nove ordini, ed è il par. Due a Sisa — e sono due, non uno, e
       nemmeno tre: farsi vedere, e poi dirlo. Due a testa al carro e
       alla scorta, che non fanno niente finché non lo sentono. Tre a
       Bugo, che oltre alla strada deve togliere la stanga. */
    { nome: 'prima farsi vedere, poi dirlo', piano: {
      sisa: [o('vai', 'sperone'), o('suona', 'ora')],
      bugo: [quando('ora', o('apri', 'stanga'), o('vai', 'valle'))],
      rea: [quando('ora', o('vai', 'valle'))],
      vito: [quando('ora', o('vai', 'valle'))],
    } },
    /* FRAGILE: Sisa suona appena parte, e poi sale. Nella terza scena è
       già a mezza costa e le vedette la vedono quasi subito: il capo
       lascia la rampa in tempo e questo piano vince. Nelle altre due il
       carro esce allo scoperto mentre lei è ancora a metà costone, e
       il capo è ancora in mezzo alla strada — e il capo va per il carro. È la stessa mossa,
       ed è giusta una volta su tre. */
    { nome: 'suona e poi sale', fragile: true, piano: {
      sisa: [o('suona', 'ora'), o('vai', 'sperone')],
      bugo: [quando('ora', o('apri', 'stanga'), o('vai', 'valle'))],
      rea: [quando('ora', o('vai', 'valle'))],
      vito: [quando('ora', o('vai', 'valle'))],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ── */
  verifiche: {
    /* srotolati i «quando senti», il carro parte al primo battito
       insieme a Sisa: arriva davanti al capo mentre lei è ancora a
       metà costone, e lì finisce */
    nonInFila: true,
    /* quattro mestieri: chi si fa vedere non è chi passa, chi apre la
       stanga non è il carro, e da soli non si arriva in valle */
    serveOgnuno: true,
    /* farsi vedere prima, dirlo dopo: è tutto il capitolo, ed è
       l'inversione della soluzione fragile qui sopra */
    ordineConta: [['vai sperone', 'suona ora']],
    /* e senza la stanga tolta la strada non è una strada */
    senza: ['stanga'],
  },
}

export default SALE_4
