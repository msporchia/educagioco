/* ═══════════════════════════════════════════════════════════════════
   🦆 BIBI ALLO STAGNO — capitolo 4: 💦 LO STAGNO (ultimo)
   forma: scorta · concetto: sintesi

   PER CHI È. L'ultimo capitolo, per la stessa bambina di sei anni dei
   tre prima: righe da otto-dieci parole, tre verbi in croce — `vai`,
   `prendi`, `apri` — nessuna condizione da scrivere, nessun segnale,
   nessun ciclo. Non si perde: una scena può non riuscire, e allora si
   riguarda.

   LA STORIA. Oltre il cortile c'è un prato che Bibi non ha mai visto,
   e in fondo al prato lo stagno. Fra il cortile e il prato c'è la
   siepe, fra il prato e lo stagno il cancello: due cose chiuse, e
   Rosa le apre tutte e due, come ha sempre fatto. In mezzo al prato
   c'è un'oca che sta di guardia: se vede Bibi, soffia forte e Bibi
   scappa via — la missione finisce lì. Rosa non corre questo rischio:
   il problema è tutto di Bibi, che non sa difendersi da sola.

   IL CONCETTO: SINTESI. Non c'è niente di nuovo da imparare — è per
   questo che è l'ultimo capitolo. C'è un solo `vai` per Bibi, dritto
   allo stagno: **vale sei passi contati**, perché il cammino lo trova
   da sola. La lezione di tutta la storia è già in mano: Rosa apre
   nell'ordine giusto, Bibi va dove Rosa le ha aperto la strada, e
   nessuna delle due può fare da sola il lavoro dell'altra.

   EREDITA: **il pane** (Rosa lo tiene ancora: è per quello che ha le
   mani piene, ed è per quello che Bibi la segue fin qui), **Bibi**
   (che dal secondo capitolo sta con Rosa) e **il cancello del
   cortile**, lasciato aperto nel terzo — è la strada che porta al
   prato.
   LASCIA: niente. La storia finisce qui.

   LA MAPPA (24×14, il prato oltre il cortile). A sinistra il cortile
   di casa (x1-6), aperto fino in fondo: da lì una sola siepe (7,2)
   porta a un corridoio erboso in alto (x8-16, y1-3). In basso, dietro
   la STESSA siepe ma a un varco più giù (7,10), c'è il prato vero e
   proprio (x8-16, y6-12): lì sta l'oca, e da lì non si esce da
   nessun'altra parte — è un vicolo cieco, non la strada di nessuno.
   Il corridoio in alto continua fino al cancello (17,2), che apre
   sullo stagno (x18-22): Rosa e Bibi ci passano tutte e due senza mai
   avvicinarsi all'oca, perché il corridoio e il prato dell'oca non si
   toccano da nessuna parte se non tornando indietro fin dal cortile.

   LE TRE SCENE. Si spostano lo stagno dentro la sua radura, l'oca
   dentro il suo prato, e il punto di partenza di Rosa e Bibi. La
   siepe e il cancello restano dove sono — sono il muro di casa e il
   cancelletto delle due volte prima — e il ragionamento non cambia
   mai: prima la siepe, poi il cancello, poi Bibi allo stagno.
   ═══════════════════════════════════════════════════════════════════ */

/* le stesse scorciatoie degli altri capitoli: un ordine è
   verbo + complemento, e basta */
const o = (verbo, complemento) => ({ verbo, complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })

/* Il prato oltre il cortile, 24 colonne per 14 righe.
     x1-6  y1-12   il cortile di casa: aperto fino in fondo
     x7            la siepe: un solo buco, la porta «siepe» (7,2)
     x8-16 y1-3    il corridoio erboso, verso il cancello
     x8-16 y4-5    muro pieno: separa il corridoio dal prato dell'oca
     x8-16 y6-12   il prato dell'oca: un vicolo cieco, si entra da (7,10)
     x17           lo steccato dello stagno: un solo buco, la porta
                   «cancello» (17,2) — il prato dell'oca non ci arriva
     x18-22 y1-12  la radura dello stagno */
const PRATO = [
  '########################',
  '#......#.........#.....#',
  '#......................#',
  '#......#.........#.....#',
  '#......###########.....#',
  '#......###########.....#',
  '#......#.........#.....#',
  '#......#.........#.....#',
  '#......#.........#.....#',
  '#......#.........#.....#',
  '#................#.....#',
  '#......#.........#.....#',
  '#......#.........#.....#',
  '########################',
]

const BIBI_4 = {
  id: 'bibi-stagno', nome: 'Lo stagno',
  storia: 'bibi', capitolo: 4, emoji: '💦',
  forma: 'scorta', concetto: 'sintesi',
  idea: 'Un solo «vai» porta Bibi allo stagno, lontano dall\'oca',
  eredita: ['pane', 'bibi', 'cortile'], lascia: [],

  dritta: 'Tieni Bibi lontana dall\'oca: se vi vede, scappa via.<br>' +
          'Prima la siepe, poi il cancello: Rosa apre tutto.',
  racconto: 'Lo stagno è grande. Bibi non l\'ha mai visto.<br>' +
            'Rosa apre la siepe, poi il cancello.<br>' +
            'Un\'oca sta di guardia in mezzo al prato.<br>' +
            'Se vi vede, Bibi si spaventa e scappa.<br>' +
            'Hai vinto quando Bibi è nello stagno.',
  aiuti: [
    'Un ordine è un verbo e una cosa.',
    'Rosa apre: prima la siepe, poi il cancello.',
    'Bibi va allo stagno, lontano dall\'oca.',
  ],

  griglia: PRATO, ambiente: 'bosco',

  nomi: {
    siepe: 'la siepe', cancello: 'il cancello dello stagno',
    stagno: 'lo stagno',
    casa: 'Rosa e Bibi', lago: 'l\'oca',
  },
  posti: { stagno: { x: 20, y: 3 } },
  porte: {
    siepe: { x: 7, y: 2 },
    cancello: { x: 17, y: 2 },
  },

  unita: [
    /* Rosa ha ancora il pane in mano: apre e cammina, non raccoglie */
    { id: 'rosa', nome: 'Rosa', fazione: 'casa', emoji: '👧', chi: 'ladra',
      vista: 4, vita: 3, x: 2, y: 7, sa: ['vai', 'apri'] },
    /* Bibi, stavolta, ha un solo gesto: andare. Non c'è niente da
       prendere né da aprire, solo la strada che Rosa le ha sgombrato */
    { id: 'bibi', nome: 'Bibi', fazione: 'casa', emoji: '🦆', chi: 'papera',
      manto: 'germano', vista: 3, vita: 3, x: 2, y: 8, sa: ['vai'] },
    /* l'oca non prende ordini dal bambino: sta ferma nel suo prato, e
       come Bombo (fondi-3, bibi-3) `grida` appena vede qualcuno che
       non è dei suoi. Non ha bisogno di un piano — il prato dell'oca
       è un vicolo cieco, e chi ci entra se lo va a cercare */
    { id: 'oca', nome: 'l\'oca', fazione: 'lago', emoji: '🪿', chi: 'papera',
      manto: 'grigia', vista: 4, vita: 3, x: 12, y: 8, grida: 'soffia' },
  ],
  fazioni: {
    casa: { nome: 'Rosa e Bibi', autore: 'giocatore' },
    lago: { nome: 'l\'oca', autore: 'livello' },
  },

  /* tre cose sole si possono nominare: la siepe e il cancello (solo
     Rosa li apre), lo stagno (dove va Bibi). L'oca non si nomina: non
     si comanda e non si evita scegliendola, si evita stando lontani */
  complementi: ['siepe', 'cancello', 'stagno'],

  obiettivo: [qui('bibi', 'stagno')],
  /* l'oca vede chiunque non sia dei suoi e soffia una volta sola
     (`grida`, in `motore/generale.js`): se il segnale parte, la
     missione è già persa, senza bisogno di scrivere qui una
     condizione in più */
  sconfitta: [{ cond: 'segnale', complemento: 'soffia' }],
  motivoSconfitta: 'L\'oca ha soffiato forte: Bibi si è spaventata ed è scappata via.',

  /* Si spostano lo stagno, l'oca e il punto di partenza. La siepe e il
     cancello restano dove sono — sono il muro di casa e lo steccato —
     e il ragionamento non cambia mai. */
  varianti: [
    { nome: 'lo stagno in fondo al prato',
      posti: { stagno: { x: 20, y: 3 } },
      unita: { oca: { x: 12, y: 7 }, rosa: { x: 2, y: 7 }, bibi: { x: 2, y: 8 } } },
    { nome: 'lo stagno dietro il canneto',
      posti: { stagno: { x: 19, y: 9 } },
      unita: { oca: { x: 11, y: 9 }, rosa: { x: 2, y: 4 }, bibi: { x: 2, y: 5 } } },
    { nome: 'lo stagno di lato, e l\'oca in mezzo',
      posti: { stagno: { x: 21, y: 6 } },
      unita: { oca: { x: 13, y: 9 }, rosa: { x: 2, y: 10 }, bibi: { x: 2, y: 11 } } },
  ],

  soluzioni: [
    /* tre ordini, ed è il par: senza la siepe non si passa, senza il
       cancello non si arriva allo stagno, senza quel «vai» Bibi non
       si muove da sola */
    { nome: 'la siepe, il cancello, lo stagno', piano: {
      rosa: [o('apri', 'siepe'), o('apri', 'cancello')],
      bibi: [o('vai', 'stagno')],
    } },
    /* la stessa cosa con una passeggiata in più davanti alla siepe:
       vince uguale — Rosa ci arriva comunque per aprirla — e costa un
       ordine in più: il par premia quella corta senza vietare questa */
    { nome: 'Rosa va prima alla siepe', lunga: true, piano: {
      rosa: [o('vai', 'siepe'), o('apri', 'siepe'), o('apri', 'cancello')],
      bibi: [o('vai', 'stagno')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto. */
  verifiche: {
    /* «nessuna delle due può fare il lavoro dell'altra»: senza Rosa le
       due porte restano chiuse, senza Bibi nessuno arriva allo stagno */
    serveOgnuno: true,
    /* le due porte sono davvero indispensabili, non solo di comodo */
    senza: ['siepe', 'cancello'],
    /* la siepe è più vicina a casa: aprire il cancello per primo
       vuol dire provare ad aprirlo da dietro una siepe ancora chiusa,
       e restarci piantati davanti */
    ordineConta: [['apri siepe', 'apri cancello']],
  },
}

export default BIBI_4
export { BIBI_4 }
