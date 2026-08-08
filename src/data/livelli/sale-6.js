/* ═══════════════════════════════════════════════════════════════════
   🧂 LA CAROVANA DEL SALE — capitolo 6: «Il forno del paese»
   forma: consegna · concetto: sintesi

   LA STORIA. Ultimo tratto. La strada scende dal passo, passa sotto la
   sbarra del pedaggio — che è **ancora alzata da tre giorni**, perché
   nessuno l'ha richiusa — ed entra in paese. Il forno apre all'alba e
   il sale è per lui. Ma i briganti del passo sono scesi prima di voi:
   il capo sta all'imbocco della piazza, dove la strada finisce, e uno
   sbandato è rimasto in giro per il paese a fare il palo.

   EREDITA tutto. Il **sale**, che è ancora sul carro dal primo
   capitolo. La **sbarra** alzata dal secondo: è la strada corta, e non
   c'è niente da aprire. **Sisa**, ripresa nel quinto, che conosce il
   versante meglio di chiunque e sa dove sono i loro fuochi.
   LASCIA niente: la storia finisce qui, e il sale è nel forno.

   COSA INSEGNA. Niente di nuovo, e tutto insieme — ed è l'unico
   capitolo in cui bisogna scegliere **quale** dei quattro attrezzi
   usare, invece di usare quello che il capitolo ti ha appena dato.

     · l'ESCA del capitolo 4, identica: il capo `accorre` al grido, le
       vedette gridano appena vedono qualcuno, e Sisa è l'unica che
       arriva fin laggiù. Prima farsi vedere, poi suonare.
     · la CONDIZIONE del capitolo 3: lo sbandato sta in piazza oppure
       nel vicolo, e dall'imbocco si vede una cosa sola. Guarda, e poi
       decidi.
     · gli EVENTI del capitolo 4, ma **in catena**: Sisa dice a Vito
       quando muoversi, Vito dice al carro quando è pulito. Due
       segnali, tre momenti, e nessuno che indovini niente.
     · i PREREQUISITI del primo: il sale si prende prima, la porta del
       forno si apre prima di entrarci. Sono gli ordini che il bambino
       sa scrivere da tre ore, e sono ancora quelli che decidono se il
       sale arriva.

   LA MAPPA (36×18). La strada alta da ponente, con la sbarra aperta a
   metà; la discesa a levante, che è l'unica via per entrare in paese;
   la piazza; il forno dietro la sua porta, a levante della piazza. Poi
   due tasche: il **vicolo**, sotto la piazza, che dall'imbocco non si
   vede — ed è lì che a volte sta il palo — e il **sottopasso**, che
   porta all'accampamento basso dei briganti, dove Sisa va a farsi
   vedere. Il paese è piccolo, e ogni cosa è a portata di tutti: quello
   che non è a portata è il **momento**.
   ═══════════════════════════════════════════════════════════════════ */

/* ── le scorciatoie per scrivere i dati (le stesse di data/generale.js,
      ricopiate qui perché questo file deve stare in piedi da solo) ── */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })
const vedi = complemento => ({ cond: 'vedi', complemento })
const nonVedi = complemento => ({ cond: 'vedi', complemento, non: true })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })
const caduto = complemento => ({ cond: 'vivo', complemento, non: true })

function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const PAESE = (() => {
  const g = tela(36, 18)
  cava(g, 1, 4, 22, 4)       // la strada alta, quella del pedaggio
  cava(g, 22, 4, 22, 11)     // la discesa: l'unica via per entrare in paese
  cava(g, 18, 11, 28, 15)    // la piazza
  cava(g, 18, 16, 21, 16)    // il vicolo: tasca cieca, e dall'imbocco non si vede
  cava(g, 24, 16, 34, 16)    // il sottopasso, verso l'accampamento basso
  cava(g, 29, 13, 29, 13)    // la porta del forno
  cava(g, 30, 12, 33, 14)    // il forno
  return stampa(g)
})()

/* IL PIANO DEL CAPO, ed è quello del capitolo 4 parola per parola:
   aspetta di vedere qualcuno e poi va per il carro. E come allora, la
   cosa che conta non è negli ordini ma nella scheda — `accorre: aiuto`.
   Chi si è ricordato del crinale sa già cosa fare. */
const CAPO = [
  { verbo: 'aspettaDiVedere', complemento: 'carovana' },
  o('attacca', 'rea'),
]

/* IL PIANO DEL PALO è lo stesso, e la differenza è tutta in quello che
   **non** ha: non accorre. Il grido di una vedetta non lo smuove, e per
   toglierlo di mezzo non c'è nessun trucco — bisogna andarlo a trovare
   e menargli. Il guaio è sapere dove sta. */
const PALO = [
  { verbo: 'aspettaDiVedere', complemento: 'carovana' },
  o('attacca', 'rea'),
]

export const SALE_6 = {
  id: 'sale-forno', nome: 'Il forno del paese',
  idea: 'Tutto quello che sai, e nell\'ordine giusto',
  storia: 'sale', capitolo: 6, emoji: '🥖',
  forma: 'consegna', concetto: 'sintesi',
  eredita: ['sale', 'sbarra', 'sisa'], lascia: [],

  dritta: 'Niente di nuovo: sono i quattro attrezzi che hai già. Sisa si fa vedere e <b>poi</b> suona — il capo accorre e lascia l\'imbocco. Vito <b>guarda e decide</b> dove sta il palo, lo toglie di mezzo e suona a sua volta. Solo allora il carro scende e il sale entra nel forno: prima si prende, poi si apre, poi si entra.',
  racconto: 'La sbarra del pedaggio è ancora alzata: di lì si passa senza fermarsi. In paese però ci sono già loro: il <b>capo</b> all\'imbocco della piazza, e uno <b>sbandato</b> che fa il palo — in piazza o nel vicolo, e dall\'imbocco il vicolo non si vede. Il capo accorre al grido come sul crinale; lo sbandato no, e va tolto di mezzo. Si vince quando <b>Bugo è dentro il forno con la soma di sale</b> e Rea è arrivata in piazza. Si perde se prendono il carro.',
  aiuti: [
    'Due segnali in fila: Sisa chiama Vito, Vito chiama il carro. Ognuno suona quando <b>ha finito</b>, non quando parte.',
    'Il palo sta in piazza o nel vicolo. Dall\'imbocco si vede solo la piazza: metti a Vito una <b>condizione</b>, e nel ramo del falso mandalo nel vicolo.',
    'Bugo ha tre gesti e sono in ordine: <b>prendi</b> il sale, <b>apri</b> la porta, <b>entra</b>. Uno spostato e il sale resta sul carro.',
  ],

  griglia: PAESE, ambiente: 'cortile',

  nomi: {
    sale: 'la soma di sale', forno: 'la porta del forno', sbarra: 'la sbarra del pedaggio',
    dentro: 'il forno', imbocco: 'l\'imbocco della piazza', vicolo: 'il vicolo',
    sperone: 'lo sperone sopra l\'accampamento', piazza: 'la piazza',
    carovana: 'la carovana', briganti: 'i briganti del passo',
  },
  posti: {
    imbocco: { x: 22, y: 11 },
    vicolo: { x: 19, y: 16 },
    sperone: { x: 28, y: 16 },
    piazza: { x: 26, y: 14 },
    dentro: { x: 32, y: 13 },
  },
  porte: {
    /* la sbarra del capitolo 2: **è già alzata**, e nessuno la deve
       toccare. Sta qui perché la si veda — è il pezzo di strada che vi
       siete guadagnati tre giorni fa — e infatti non è nemmeno fra i
       complementi: non si può nominare, perché non c'è niente da farci. */
    sbarra: { x: 8, y: 4, aperta: true },
    forno: { x: 29, y: 13 },
  },
  oggetti: [
    { nome: 'sale', em: '🧂', pittore: 'sacco', x: 16, y: 4 },
  ],
  segnali: ['ora', 'viaLibera', 'aiuto'],

  unita: [
    { id: 'rea', nome: 'nonna Rea', fazione: 'carovana', emoji: '🧓', chi: 'mago',
      vista: 3, vita: 1, x: 18, y: 4, sa: ['vai', 'quando'] },
    { id: 'vito', nome: 'Vito', fazione: 'carovana', emoji: '🛡️', chi: 'cavaliere',
      vista: 5, vita: 16, x: 19, y: 4, sa: ['vai', 'attacca', 'suona', 'quando'] },
    { id: 'bugo', nome: 'Bugo', fazione: 'carovana', emoji: '🔧', chi: 'ladra',
      vista: 4, vita: 6, x: 20, y: 4, sa: ['vai', 'prendi', 'apri', 'quando'] },
    { id: 'sisa', nome: 'Sisa', fazione: 'carovana', emoji: '🐐', chi: 'gatto', manto: 'bianco',
      vista: 4, vita: 8, x: 17, y: 4, sa: ['vai', 'suona'] },
    { id: 'capo', nome: 'il capo dei briganti', fazione: 'briganti', emoji: '🪓', chi: 'capitano',
      vista: 5, vita: 20, x: 22, y: 12, accorre: 'aiuto' },
    { id: 'palo', nome: 'lo sbandato', fazione: 'briganti', emoji: '🗡️', chi: 'orco',
      vista: 4, vita: 3, x: 24, y: 12 },
    { id: 'vedetta1', nome: 'una vedetta', fazione: 'briganti', emoji: '🔥', chi: 'goblin',
      vista: 3, vita: 6, x: 31, y: 16, grida: 'aiuto' },
    { id: 'vedetta2', nome: 'un\'altra vedetta', fazione: 'briganti', emoji: '🔥', chi: 'goblin',
      vista: 3, vita: 6, x: 33, y: 16, grida: 'aiuto' },
  ],
  fazioni: {
    carovana: { nome: 'la carovana', autore: 'giocatore' },
    briganti: { nome: 'i briganti del passo', autore: 'livello',
                ordini: { capo: CAPO, palo: PALO } },
  },

  complementi: ['sale', 'forno', 'dentro', 'imbocco', 'vicolo', 'sperone', 'piazza',
                'briganti', 'ora', 'viaLibera'],
  condizioni: [vedi('briganti'), nonVedi('briganti')],

  obiettivo: [ha('bugo', 'sale'), qui('bugo', 'dentro'), qui('rea', 'piazza')],
  sconfitta: [caduto('rea')],
  motivoSconfitta: 'Hanno preso il carro in paese, a due passi dal forno.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA — solo disegno, non passa dal motore ── */
  scenografia: [
    { che: 'albero', x: 2, y: 4 }, { che: 'cartello', x: 6, y: 4 },
    { che: 'cespuglio', x: 10, y: 4 }, { che: 'pozzanghera', x: 4, y: 4, strato: -1 },
    { che: 'carrello', x: 11, y: 4 }, { che: 'roccia', x: 22, y: 6 },
    { che: 'cespuglio', x: 22, y: 8 },
    { che: 'pozzo', x: 20, y: 13 }, { che: 'secchio', x: 20, y: 14 },
    { che: 'bandiera', x: 18, y: 11 }, { che: 'colonna', x: 28, y: 11 },
    { che: 'cassa', x: 27, y: 15 }, { che: 'botte', x: 23, y: 11 },
    { che: 'cartello', x: 28, y: 12 }, { che: 'tenda', x: 25, y: 11 },
    { che: 'ragnatela', x: 21, y: 16, strato: -1 }, { che: 'barile', x: 18, y: 16 },
    { che: 'braciere', x: 31, y: 13 }, { che: 'sacco', x: 30, y: 14 },
    { che: 'cassa', x: 33, y: 12 }, { che: 'pane', x: 30, y: 12 },
    { che: 'falo', x: 24, y: 16 }, { che: 'ossa', x: 25, y: 16 },
    { che: 'tenda', x: 26, y: 16 },
  ],

  /* Tre scene, e cambia la sola cosa che non si può indovinare: **dove
     sta il palo**, e quindi quale ramo prende il bivio. Cambiano con
     lui il punto in cui il carro deve arrivare, dove Sisa deve
     spingersi per entrare negli occhi delle vedette, e dov'è rimasta la
     soma sul carro. Il piano che ha imparato «lo sbandato è in piazza»
     ne vince due su tre — ed è quello che fa più male, perché due su
     tre sembra sapere. */
  varianti: [
    { nome: 'il palo in mezzo alla piazza',
      unita: { palo: { x: 24, y: 12 }, capo: { x: 22, y: 12 },
               vedetta1: { x: 31, y: 16 }, vedetta2: { x: 33, y: 16 },
               rea: { x: 18, y: 4 }, vito: { x: 19, y: 4 }, bugo: { x: 20, y: 4 },
               sisa: { x: 17, y: 4 } },
      oggetti: { sale: { x: 16, y: 4 } },
      posti: { imbocco: { x: 22, y: 11 }, vicolo: { x: 19, y: 16 },
               sperone: { x: 28, y: 16 }, piazza: { x: 26, y: 14 },
               dentro: { x: 32, y: 13 } } },
    { nome: 'il palo nel vicolo, che dall\'imbocco non si vede',
      unita: { palo: { x: 19, y: 16 }, capo: { x: 22, y: 12 },
               vedetta1: { x: 30, y: 16 }, vedetta2: { x: 33, y: 16 },
               rea: { x: 14, y: 4 }, vito: { x: 15, y: 4 }, bugo: { x: 16, y: 4 },
               sisa: { x: 13, y: 4 } },
      oggetti: { sale: { x: 12, y: 4 } },
      posti: { imbocco: { x: 22, y: 11 }, vicolo: { x: 20, y: 16 },
               sperone: { x: 27, y: 16 }, piazza: { x: 20, y: 15 },
               dentro: { x: 33, y: 14 } } },
    { nome: 'il palo dalla parte del forno',
      unita: { palo: { x: 26, y: 12 }, capo: { x: 22, y: 13 },
               vedetta1: { x: 32, y: 16 }, vedetta2: { x: 34, y: 16 },
               rea: { x: 20, y: 4 }, vito: { x: 21, y: 4 }, bugo: { x: 19, y: 4 },
               sisa: { x: 18, y: 4 } },
      oggetti: { sale: { x: 5, y: 4 } },
      posti: { imbocco: { x: 22, y: 11 }, vicolo: { x: 19, y: 16 },
               sperone: { x: 29, y: 16 }, piazza: { x: 24, y: 14 },
               dentro: { x: 30, y: 13 } } },
  ],

  par: 14,
  soluzioni: [
    /* quattordici ordini, ed è il par: il più lungo di tutta la storia,
       e non c'è dentro un verbo che non sia già stato usato. Due a
       Sisa, sei a Vito (di cui uno è il bivio), due a Rea, quattro a
       Bugo. La forma è una catena: chi ha finito lo dice, e chi ascolta
       parte. */
    { nome: 'la catena dei due segnali', piano: {
      sisa: [o('vai', 'sperone'), o('suona', 'ora')],
      vito: [quando('ora',
        o('vai', 'imbocco'),
        bivio(vedi('briganti'), [], [o('vai', 'vicolo')]),
        o('attacca', 'briganti'),
        o('suona', 'viaLibera'))],
      rea: [quando('viaLibera', o('vai', 'piazza'))],
      bugo: [quando('viaLibera', o('prendi', 'sale'), o('apri', 'forno'), o('vai', 'dentro'))],
    } },
    /* la stessa cosa con la domanda girata: se **non** li vede vada nel
       vicolo. Un bivio si legge dai due lati, e il ramo vuoto cambia
       posto — è la stessa mossa del capitolo 3, e qui torna identica. */
    { nome: 'la stessa domanda girata', piano: {
      sisa: [o('vai', 'sperone'), o('suona', 'ora')],
      vito: [quando('ora',
        o('vai', 'imbocco'),
        bivio(nonVedi('briganti'), [o('vai', 'vicolo')], []),
        o('attacca', 'briganti'),
        o('suona', 'viaLibera'))],
      rea: [quando('viaLibera', o('vai', 'piazza'))],
      bugo: [quando('viaLibera', o('prendi', 'sale'), o('apri', 'forno'), o('vai', 'dentro'))],
    } },
    /* FRAGILE: niente bivio, «il palo sta in piazza». Due scene su tre
       è vero e questo piano vince con un ordine in meno. Nella terza il
       palo è nel vicolo, Vito resta all'imbocco a cercare qualcuno che
       da lì non si vede, non chiama mai il carro, e la soma di sale
       resta sul carro fino a sera. Due su tre sembra sapere: non è
       sapere. */
    { nome: 'il palo sta sempre in piazza', fragile: true, piano: {
      sisa: [o('vai', 'sperone'), o('suona', 'ora')],
      vito: [quando('ora',
        o('vai', 'imbocco'), o('attacca', 'briganti'), o('suona', 'viaLibera'))],
      rea: [quando('viaLibera', o('vai', 'piazza'))],
      bugo: [quando('viaLibera', o('prendi', 'sale'), o('apri', 'forno'), o('vai', 'dentro'))],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ── */
  verifiche: {
    /* srotolati i due ascolti, la catena si spezza: tutti partono al
       primo battito, il carro scende quando il capo è ancora
       all'imbocco e il palo è ancora in piedi */
    nonInFila: true,
    /* quattro mestieri e nessuno di scorta: Sisa non mena, Vito non
       porta, Bugo non tiene la piazza, Rea è il carro */
    serveOgnuno: true,
    ordineConta: [
      /* farsi vedere prima, dirlo dopo: è il capitolo 4 */
      ['vai sperone', 'suona ora'],
      /* prima si prende, poi si entra: è il capitolo 1, ed è ancora
         quello che decide se il sale arriva */
      ['prendi sale', 'vai dentro'],
    ],
    /* e la porta del forno non si attraversa perché si è arrivati: si
       apre, e la apre uno solo */
    senza: ['forno'],
  },
}

export default SALE_6
