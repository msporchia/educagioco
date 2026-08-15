/* ═══════════════════════════════════════════════════════════════════
   🦆 BIBI ALLO STAGNO — capitolo 2: BIBI
   forma: raduno · concetto: prerequisiti

   PER CHI È. Per una bambina di sei anni che legge male: dieci parole
   per riga, un premio che si vede (Rosa che arriva dalla papera col
   pane in mano) e nessuna condizione, nessun segnale, nessun ciclo. La
   cassetta è di tre verbi soli — `vai`, `prendi`, `apri` — e Rosa non
   ne sa altri: così non c'è niente da scartare prima di scegliere.

   LA STORIA. Bibi è chiusa nell'orto: il cancelletto è chiuso e la
   chiavetta sta in cortile. Il pane di ieri è rimasto in cucina, ed è
   l'unica cosa che Bibi ascolta — andare da lei a mani vuote non serve
   a niente. Si vince quando Rosa è sul prato di Bibi **col pane
   addosso**.

   IL CONCETTO: PRIMA QUELLO. Il cancelletto non si apre a mani vuote:
   la chiavetta va presa **prima**. È l'unico ordine della fila che non
   si può spostare, e sbagliarlo non è un'opinione — il motore lo dice
   con le sue parole («il cancelletto è chiuso a chiave, e la chiavetta
   non ce l'ho»), e dopo, al prato, la strada resta chiusa. Il pane
   invece si prende quando si vuole: serve, ma non prima di niente. Due
   ordini che si spostano e uno che non si sposta, che è il modo più
   corto per far vedere la differenza.

   EREDITA: **il pane** del capitolo 1 — Rosa l'ha lasciato sul tavolo
   di cucina, e Bibi se lo ricorda.
   LASCIA: **Bibi**, che da adesso viene dietro a chi ha il pane, e il
   cancelletto dell'orto aperto.

   LA MAPPA (24×14, il cortile di casa). A sinistra la cucina, un
   angolo chiuso con una porta sola in basso; in mezzo il cortile
   grande; a destra l'orto, dietro lo steccato. Nello steccato c'è un
   varco solo — il cancelletto — e non ci sono altre strade: è per
   questo che l'ordine conta.

   LE TRE SCENE. Si spostano il pane, la chiavetta e il posto dov'è
   Bibi. Il ragionamento non cambia mai: chiavetta, cancelletto, pane,
   prato. Chi ha scritto i nomi delle cose le segue dovunque vadano;
   chi ha scritto le caselle a mano, no.
   ═══════════════════════════════════════════════════════════════════ */

/* le stesse scorciatoie dei livelli del Generale: un ordine è
   verbo + complemento, e basta */
const o = (verbo, complemento) => ({ verbo, complemento })
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })

/* Il cortile di casa, 24 colonne per 14 righe.
     x1-7  y1-3    la cucina, e la sua porta è la casella (4,4)
     x1-14 y4-12   il cortile
     x15           lo steccato dell'orto: tutto muro tranne (15,7),
                   che è il cancelletto
     x16-22 y1-12  l'orto, dov'è chiusa Bibi */
const CORTILE = [
  '########################',
  '#.......#......#.......#',
  '#.......#......#.......#',
  '#.......#......#.......#',
  '####.###.......#.......#',
  '#..............#.......#',
  '#..............#.......#',
  '#......................#',
  '#..............#.......#',
  '#..............#.......#',
  '#..............#.......#',
  '#..............#.......#',
  '#..............#.......#',
  '########################',
]

const BIBI_2 = {
  id: 'bibi-bibi', nome: 'Bibi',
  storia: 'bibi', capitolo: 2, forma: 'raduno', concetto: 'prerequisiti',
  idea: 'Prima la chiavetta, se no il cancelletto non si apre',
  eredita: ['pane'], lascia: ['bibi', 'cortile'],

  dritta: 'Il cancelletto <b>non si apre a mani vuote</b>. Prima la chiavetta, poi il cancelletto.',
  racconto: 'Bibi è chiusa nell\'orto.<br>' +
            'Il cancelletto vuole la chiavetta.<br>' +
            'Il pane di ieri è in cucina.<br>' +
            'Bibi ascolta solo il pane.<br>' +
            'Si vince quando Rosa arriva da Bibi <b>col pane</b>.',
  aiuti: [
    'Un ordine è un verbo e una cosa.',
    'Il cancelletto è chiuso: la chiavetta va presa prima.',
    'Quattro ordini: la chiavetta, il cancelletto, il pane, il prato.',
  ],

  griglia: CORTILE, ambiente: 'cortile',

  nomi: {
    pane: 'il pane', chiavetta: 'la chiavetta',
    cancelletto: 'il cancelletto', prato: 'il prato di Bibi',
    casa: 'Rosa', papere: 'Bibi',
  },
  posti: { prato: { x: 20, y: 7 } },
  porte: { cancelletto: { x: 15, y: 7, chiave: 'chiavetta' } },
  oggetti: [
    { nome: 'pane', em: '🥖', x: 2, y: 2 },
    { nome: 'chiavetta', em: '🔑', x: 12, y: 10 },
  ],

  unita: [
    /* Rosa sa tre verbi e basta: la cassetta di questo capitolo è
       tutta qui, e non c'è niente da scartare. */
    { id: 'rosa', nome: 'Rosa', fazione: 'casa', emoji: '👧', chi: 'ladra',
      vista: 4, vita: 3, x: 2, y: 6, sa: ['vai', 'prendi', 'apri'] },
    /* Bibi sta ferma dov'è: non prende ordini da nessuno (è una papera)
       e non è un nemico. Fra i pittori non c'è una papera, quindi in
       mappa cammina su quattro zampe; il suo nome e la sua faccia 🦆
       stanno dappertutto dove la si legge. */
    { id: 'bibi', nome: 'Bibi', fazione: 'papere', emoji: '🦆', chi: 'papera', manto: 'germano',
      vista: 0, vita: 3, x: 20, y: 7 },
  ],
  fazioni: {
    casa: { nome: 'Rosa', autore: 'giocatore' },
    papere: { nome: 'Bibi', autore: 'livello' },
  },

  /* quattro cose sole si possono nominare: da qui discende la cassetta
     — `vai` (il pane, il cancelletto, il prato), `prendi` (il pane, la
     chiavetta), `apri` (il cancelletto). Niente altro. */
  complementi: ['pane', 'chiavetta', 'cancelletto', 'prato'],

  obiettivo: [qui('rosa', 'prato'), ha('rosa', 'pane')],

  varianti: [
    { nome: 'la chiavetta in mezzo al cortile',
      oggetti: { pane: { x: 2, y: 2 }, chiavetta: { x: 12, y: 10 } },
      posti: { prato: { x: 20, y: 7 } }, unita: { bibi: { x: 20, y: 7 } } },
    { nome: 'la chiavetta dietro casa, Bibi in alto',
      oggetti: { pane: { x: 6, y: 1 }, chiavetta: { x: 2, y: 11 } },
      posti: { prato: { x: 18, y: 3 } }, unita: { bibi: { x: 18, y: 3 } } },
    { nome: 'Bibi in fondo all\'orto',
      oggetti: { pane: { x: 5, y: 3 }, chiavetta: { x: 11, y: 2 } },
      posti: { prato: { x: 21, y: 11 } }, unita: { bibi: { x: 21, y: 11 } } },
  ],

  soluzioni: [
    /* quattro ordini, ed è il par: nessuno si può togliere. Senza la
       chiavetta il cancelletto non si apre; senza il cancelletto al
       prato non ci si arriva; senza il pane Bibi non torna a casa. */
    { nome: 'la chiavetta per prima', piano: { rosa: [
      o('prendi', 'chiavetta'), o('apri', 'cancelletto'),
      o('prendi', 'pane'), o('vai', 'prato'),
    ] } },
    /* il pane si può prendere prima o dopo: quello che non si sposta è
       la chiavetta davanti al cancelletto */
    { nome: 'il pane per primo', piano: { rosa: [
      o('prendi', 'pane'), o('prendi', 'chiavetta'),
      o('apri', 'cancelletto'), o('vai', 'prato'),
    ] } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto. */
  verifiche: {
    /* «il cancelletto non si apre a mani vuote»: è l'unico ordine della
       fila che non si può spostare, ed è tutto il capitolo */
    ordineConta: [['prendi chiavetta', 'apri cancelletto']],
    /* e senza la chiavetta il cancelletto resta chiuso: al prato non ci
       sono altre strade */
    senza: ['chiavetta'],
  },
}

export default BIBI_2
export { BIBI_2 }
