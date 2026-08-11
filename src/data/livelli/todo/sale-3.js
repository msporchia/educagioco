/* ═══════════════════════════════════════════════════════════════════
   🧂 LA CAROVANA DEL SALE — capitolo 3: «I lupi del passo»
   forma: scorta · concetto: condizione (il blocco ❓, due rami)

   LA STORIA. Il passo si sale a tornanti e i lupi lo sanno. Non
   guardano Vito, che è grosso e ha il ferro; non guardano Bugo, che
   non vale niente da mangiare. **Guardano il carro** — nonna Rea, che
   non corre e non mena — e lo aspettano fermi dove hanno deciso loro.
   Nel frattempo una capra bianca si è messa dietro al carro e non se
   ne va più: nessuno l'ha invitata, si chiama Sisa, e da qui in poi è
   della carovana.

   EREDITA dal capitolo 2 la **sbarra alzata** e il **sale**, che
   pesa: il carro fa una strada sola e la fa piano.
   LASCIA **Sisa**. Nel capitolo 4 è lei che salva la carovana, e nel
   quinto è lei che si va a riprendere.

   COSA INSEGNA. IL BLOCCO CONDIZIONE, e lo si impara scrivendolo, non
   leggendolo: è il primo capitolo in cui il piano del bambino deve
   **decidere da solo**, perché la stessa scena non è mai nello stesso
   posto. I lupi stanno sul tornante oppure nel bosco di sotto, e da
   dove Vito si ferma — il guado — si vede una cosa sola: il tornante.
   Quindi:
       se è vero  che li vede — sono lì, e non c'è altro da fare
       se è falso — non sono lì: sono nel bosco, e ci va
   e dopo il blocco il seguito è **lo stesso in tutti e due i casi**:
   si sgombra, e si chiama. Il ramo del vero resta vuoto apposta —
   «in quel caso non fare niente» è una risposta, ed è la più corta.

   E C'È L'ALTRA METÀ: il carro non può partire quando gli pare. Rea
   non vede il tornante da dove sta, e quello che non vedi te lo deve
   dire qualcuno: la sua lista comincia con «quando senti». Chi la fa
   partire insieme agli altri la manda addosso ai lupi mentre Vito è
   ancora a mezza costa — e Rea non regge un colpo.

   BUGO INVECE PASSA. È la cosa che sorprende, e sta tutta nel piano
   dei lupi: si leggono, e dicono «attacca il carro». Bugo può salire
   al rifugio e sbarrare il portone mentre i lupi sono ancora lì —
   loro lo vedono, si svegliano, e restano ad aspettare il carro. Chi
   ha letto il loro piano lo sa; chi non l'ha letto tiene fermo anche
   lui e non apre il rifugio in tempo.

   LA MAPPA (32×18). Il fondovalle a ponente, il tornante che sale
   dritto a levante del guado, la strada alta e in fondo il rifugio
   dietro il suo portone. Attaccato al fondovalle, a metà, c'è il
   boschetto: è **profondo** apposta — da lì non si vede la strada e
   dalla strada non si vede lui, ed è per questo che il guado non basta
   a sapere dove sono i lupi. Bisogna guardare, e poi decidere.
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
const caduto = complemento => ({ cond: 'vivo', complemento, non: true })

function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const PASSO = (() => {
  const g = tela(32, 18)
  cava(g, 1, 15, 18, 15)     // il fondovalle
  cava(g, 18, 8, 18, 15)     // il tornante che sale
  cava(g, 18, 8, 27, 8)      // la strada alta
  cava(g, 28, 8, 28, 8)      // il portone del rifugio
  cava(g, 29, 5, 30, 9)      // il rifugio, dietro il portone
  cava(g, 14, 12, 14, 14)    // l'imbocco del boschetto
  cava(g, 11, 10, 16, 12)    // il boschetto: da qui la strada non si vede
  return stampa(g)
})()

/* IL PIANO DEI LUPI, e sono due righe che si leggono toccandone uno.
   Aspettano di vedere qualcuno — chiunque — e poi vanno **per il
   carro**: `attacca [nonna Rea]`, non «attacca la carovana». Da qui
   esce tutto il capitolo. Un lupo sveglio che non vede il carro resta
   lì fermo ad aspettarlo, e allora Vito lo raggiunge quando gli pare e
   Bugo gli passa davanti senza che succeda niente. E un lupo che il
   carro lo vede lo prende, perché Rea non regge un colpo. */
const BRANCO = [
  { verbo: 'aspettaDiVedere', complemento: 'carovana' },
  o('attacca', 'rea'),
]

/* SISA non prende ordini da nessuno: è una capra. Appena vede la
   carovana si mette dietro al carro, e da lì in poi ci resta. Non è
   dei nostri e non è dei lupi — ha una bandiera sua, ed è per questo
   che i lupi non la guardano nemmeno. */
const SISA = [
  { verbo: 'aspettaDiVedere', complemento: 'carovana' },
  o('vai', 'rea'), o('vai', 'rea'), o('vai', 'rea'), o('vai', 'rea'),
]

export const SALE_3 = {
  id: 'sale-lupi', nome: 'I lupi del passo',
  idea: 'Guarda, e solo dopo decidi dove andare',
  storia: 'sale', capitolo: 3, emoji: '🐺',
  forma: 'scorta', concetto: 'condizione',
  eredita: ['sale', 'sbarra'], lascia: ['sisa'],

  dritta: 'I lupi non stanno sempre nello stesso posto: dal guado si vede <b>solo il tornante</b>. Metti a Vito una <b>condizione</b> — se li vede sono lì, se non li vede sono nel bosco — e dopo il bivio il seguito è uguale: sgombrare, e poi chiamare il carro.',
  racconto: 'Il passo si sale a tornanti, e i lupi aspettano fermi. <b>Tocca un lupo e leggi il suo piano</b>: non guarda te, guarda il carro. Vito va avanti a vedere dove sono e li toglie di mezzo; solo allora <b>chiama</b>, perché Rea da laggiù non vede niente e non deve partire prima. Bugo intanto può salire lo stesso: i lupi lo vedono e lo lasciano passare — è il carro che aspettano — e il rifugio ha un portone che qualcuno deve aprire. Si perde se prendono Rea: non regge un colpo.',
  aiuti: [
    'Manda Vito al guado e <b>poi</b> chiedigli di guardare: la condizione si legge una volta sola, quando ci arriva.',
    'Se li vede, non c\'è niente da fare in più: il ramo del vero può restare <b>vuoto</b>. Se non li vede, sono nel bosco.',
    'Rea non vede il tornante da dove sta: la sua lista deve cominciare con <b>quando senti</b>, e a suonare è Vito quando ha finito.',
  ],

  griglia: PASSO, ambiente: 'bosco',

  nomi: {
    guado: 'il guado', bosco: 'il boschetto', rifugio: 'il rifugio',
    portone: 'il portone del rifugio',
    carovana: 'la carovana', lupi: 'i lupi', capra: 'la capra',
  },
  posti: {
    guado: { x: 17, y: 15 },
    bosco: { x: 15, y: 11 },
    rifugio: { x: 30, y: 6 },
  },
  porte: {
    portone: { x: 28, y: 8 },
  },
  segnali: ['libero'],

  unita: [
    /* Rea non regge un colpo, e non ne dà: cammina, e ascolta. È tutto
       quello che il carro sa fare, ed è la ragione per cui gli altri
       tre esistono. */
    { id: 'rea', nome: 'nonna Rea', fazione: 'carovana', emoji: '🧓', chi: 'mago',
      vista: 3, vita: 1, x: 8, y: 15, sa: ['vai', 'quando'] },
    /* Vito vede lontano il doppio di un lupo: è per questo che può
       guardare senza farsi guardare, e la condizione ha senso. */
    { id: 'vito', nome: 'Vito', fazione: 'carovana', emoji: '🛡️', chi: 'cavaliere',
      vista: 6, vita: 14, x: 2, y: 15, sa: ['vai', 'attacca', 'suona'] },
    { id: 'bugo', nome: 'Bugo', fazione: 'carovana', emoji: '🔧', chi: 'ladra',
      vista: 4, vita: 6, x: 7, y: 15, sa: ['vai', 'apri'] },
    /* i lupi vedono corto — tre caselle — e non si muovono finché non
       hanno visto qualcuno. Il pericolo non è dove sono: è che il carro
       ci passi accanto. */
    { id: 'lupo1', nome: 'un lupo', fazione: 'lupi', emoji: '🐺', chi: 'lupo',
      vista: 3, vita: 3, x: 18, y: 12 },
    { id: 'lupo2', nome: 'un altro lupo', fazione: 'lupi', emoji: '🐺', chi: 'lupo',
      vista: 3, vita: 3, x: 18, y: 8 },
    /* Sisa è disegnata come una bestia bianca a quattro zampe: fra i
       pittori una capra non c'è, e il più vicino è il gatto col manto
       bianco. Il giorno che arriva un pittore `capra` si cambia questa
       parola e basta. */
    { id: 'sisa', nome: 'Sisa', fazione: 'capra', emoji: '🐐', chi: 'gatto', manto: 'bianco',
      vista: 5, vita: 8, x: 9, y: 15 },
  ],
  fazioni: {
    carovana: { nome: 'la carovana', autore: 'giocatore' },
    lupi: { nome: 'i lupi del passo', autore: 'livello',
            ordini: { lupo1: BRANCO, lupo2: BRANCO } },
    capra: { nome: 'la capra', autore: 'livello', ordini: { sisa: SISA } },
  },

  complementi: ['guado', 'bosco', 'rifugio', 'portone', 'lupi', 'libero'],
  /* la domanda è una sola, e ha due versi: li vedi o non li vedi.
     Tenerla stretta serve a far vedere che il bivio è il bivio, non la
     scelta della condizione. */
  condizioni: [vedi('lupi'), nonVedi('lupi')],

  obiettivo: [qui('rea', 'rifugio')],
  sconfitta: [caduto('rea')],
  motivoSconfitta: 'I lupi hanno preso il carro: nonna Rea non regge un colpo.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA — solo disegno, non passa dal motore ── */
  scenografia: [
    { che: 'cespuglio', x: 10, y: 15 }, { che: 'pozzanghera', x: 11, y: 15, strato: -1 },
    { che: 'albero', x: 12, y: 15 }, { che: 'roccia', x: 13, y: 15 },
    { che: 'acqua', x: 15, y: 15, strato: -1 },
    { che: 'albero', x: 11, y: 11 }, { che: 'albero', x: 13, y: 10 },
    { che: 'cespuglio', x: 16, y: 12 }, { che: 'cespuglio', x: 12, y: 12 },
    { che: 'albero', x: 16, y: 10 }, { che: 'ossa', x: 14, y: 13 },
    { che: 'roccia', x: 18, y: 14 }, { che: 'roccia', x: 18, y: 10 },
    { che: 'cespuglio', x: 20, y: 8 }, { che: 'roccia', x: 23, y: 8 },
    { che: 'albero', x: 26, y: 8 }, { che: 'falo', x: 29, y: 6 },
    { che: 'cassa', x: 30, y: 5 }, { che: 'botte', x: 30, y: 9 },
    { che: 'bandiera', x: 29, y: 9 },
  ],

  /* Tre scene, e cambia **dove si nascondono**: due sul tornante, uno
     alto e uno basso, oppure tutti e due giù nel boschetto. Da qui
     dipende quale ramo prende il bivio, e chi ha scritto «vai al
     tornante» invece di «guarda, e poi decidi» ne vince due e ne perde
     una. Si sposta anche il guado, che è il punto da cui si guarda: un
     passo più avanti o più indietro cambia quello che si vede. */
  varianti: [
    { nome: 'due lupi sul tornante',
      unita: { lupo1: { x: 18, y: 12 }, lupo2: { x: 18, y: 8 },
               rea: { x: 8, y: 15 }, vito: { x: 2, y: 15 }, bugo: { x: 7, y: 15 },
               sisa: { x: 9, y: 15 } },
      posti: { guado: { x: 17, y: 15 }, bosco: { x: 15, y: 11 }, rifugio: { x: 30, y: 6 } } },
    { nome: 'uno in basso e uno in cima al tornante',
      unita: { lupo1: { x: 18, y: 13 }, lupo2: { x: 18, y: 9 },
               rea: { x: 6, y: 15 }, vito: { x: 1, y: 15 }, bugo: { x: 5, y: 15 },
               sisa: { x: 7, y: 15 } },
      posti: { guado: { x: 16, y: 15 }, bosco: { x: 13, y: 11 }, rifugio: { x: 29, y: 5 } } },
    { nome: 'i lupi aspettano nel boschetto',
      unita: { lupo1: { x: 11, y: 10 }, lupo2: { x: 12, y: 11 },
               rea: { x: 4, y: 15 }, vito: { x: 1, y: 15 }, bugo: { x: 3, y: 15 },
               sisa: { x: 5, y: 15 } },
      posti: { guado: { x: 17, y: 15 }, bosco: { x: 15, y: 11 }, rifugio: { x: 30, y: 7 } } },
  ],

  par: 9,
  soluzioni: [
    /* nove ordini, ed è il par. Sei a Vito, e il bivio è uno di quei
       sei: guardare costa, e vale. Due a Rea, che non fa niente finché
       non le dicono di partire. Uno solo a Bugo, che non ha bisogno di
       aspettare nessuno — glielo dice il piano dei lupi. */
    { nome: 'guarda, sgombra, chiama', piano: {
      vito: [o('vai', 'guado'),
             bivio(vedi('lupi'), [], [o('vai', 'bosco')]),
             o('attacca', 'lupi'), o('attacca', 'lupi'), o('suona', 'libero')],
      rea: [quando('libero', o('vai', 'rifugio'))],
      bugo: [o('apri', 'portone')],
    } },
    /* la stessa cosa detta al contrario: se **non** li vede vada al
       bosco, se li vede niente. È la stessa decisione — un bivio si
       può leggere dai due lati, e il ramo vuoto cambia posto. Serve a
       far vedere che «se è falso» non è un ripiego: è l'altra metà. */
    { nome: 'la stessa domanda girata', piano: {
      vito: [o('vai', 'guado'),
             bivio(nonVedi('lupi'), [o('vai', 'bosco')], []),
             o('attacca', 'lupi'), o('attacca', 'lupi'), o('suona', 'libero')],
      rea: [quando('libero', o('vai', 'rifugio'))],
      bugo: [o('apri', 'portone')],
    } },
    /* FRAGILE: niente bivio, «tanto i lupi stanno sul tornante». Nelle
       prime due scene ci sono davvero e questo piano vince con un
       ordine in meno; nella terza Vito resta al guado a guardare una
       strada vuota, non chiama mai nessuno, e il carro non parte più.
       È la memoria di una scena spacciata per un piano. */
    { nome: 'i lupi stanno sempre lì', fragile: true, piano: {
      vito: [o('vai', 'guado'), o('attacca', 'lupi'), o('attacca', 'lupi'),
             o('suona', 'libero')],
      rea: [quando('libero', o('vai', 'rifugio'))],
      bugo: [o('apri', 'portone')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ── */
  verifiche: {
    /* «chi la fa partire insieme agli altri la manda addosso ai lupi»:
       srotolato il «quando senti», Rea parte al primo battito e sale il
       tornante mentre Vito è ancora a mezza costa */
    nonInFila: true,
    /* tre mestieri e nessuno di scorta: Vito non apre portoni, Bugo non
       mena, Rea fa solo la strada */
    serveOgnuno: true,
    /* prima si va a vedere, poi si chiama: al contrario Vito chiama il
       carro dal fondovalle, senza aver guardato niente, e Rea sale il
       tornante mentre i lupi sono ancora tutti lì */
    ordineConta: [['vai guado', 'suona libero']],
    /* e senza il portone aperto il rifugio non è un rifugio: il carro
       arriva davanti a un legno chiuso e non c'è altra strada */
    senza: ['portone'],
  },
}

export default SALE_3
