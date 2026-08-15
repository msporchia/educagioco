/* ═══════════════════════════════════════════════════════════════════
   🦆 BIBI ALLO STAGNO — capitolo 3: 🦴 BOMBO
   forma: passaggio · concetto: sincronizzazione

   PER CHI È. Per una bambina di sei anni che legge male: righe da otto
   parole, nessuna condizione da scrivere, nessun segnale, nessun ciclo.
   Non si perde per sempre: una scena può non riuscire, e allora si
   riguarda.

   LA STORIA. Bombo è il cane del vicino e sta di guardia nel cortile,
   davanti al passaggio dell'aia. Rosa e Bibi devono passare di là. C'è
   un osso nel cortile, e Bombo per l'osso lascia il suo posto — ma solo
   quando qualcuno gliel'ha portato davanti alla cuccia.

   ── PERCHÉ QUESTO CAPITOLO È STATO RIFATTO ─────────────────────────
   Prima Bombo abbaiava e basta: era una scritta nei dati, e chi
   guardava vedeva «il cane non fa niente, Rosa gli passa davanti come
   se niente fosse». Si vinceva per caso e non per piano, perché in
   cassetta mancava il pezzo che serve: **stare fermi ad aspettare**.
   Adesso c'è, e il capitolo è tutto lì.

   ── LA COSA NUOVA: L'ATTESA ────────────────────────────────────────
   Fino a qui gli ordini erano tutti cose da FARE: vai, prendi, apri.
   Qui ne arriva uno che è una cosa da NON fare ancora:

       Rosa   aspetta di vedere [Bombo]   sta ferma finché non lo vede
       Bibi   aspetta di vedere [Rosa]     sta ferma finché non la vede

   È lo stesso ordine due volte, specchiato: si sta fermi a guardare, e
   si riparte quando quella cosa compare. Nessuna delle due può
   aspettare quello che non vede — è la regola del motore, ed è anche
   la ragione per cui ognuna aspetta proprio quello che le passa
   davanti.

   E la cosa importante è che **si aspettano a vicenda**:
     1. Bibi prende l'osso e lo porta alla cuccia, davanti a Bombo;
     2. Bombo lascia il passaggio e va sull'osso: adesso è occupato;
     3. Rosa lo vede arrivare alla cuccia — **allora** passa;
     4. Bibi vede Rosa passarle accanto — **allora** si muove anche lei.
   Ognuna delle due parte per una cosa che ha fatto l'altra. Togline
   una e il piano cade: è il primo capitolo in cui il QUANDO conta
   quanto il COSA, ed è la cosa più importante che questo gioco insegna.

   ── IL PIANO DI BOMBO, E SI PUÒ LEGGERE ────────────────────────────
   Bombo non prende ordini dal bambino: il suo piano è scritto qui
   (`fazioni.cani.ordini`) e si legge toccandolo (`mostraNemici`). Sono
   due righe sole, ed è la stessa lingua che ha in mano il bambino:

       aspetta di vedere [Bibi]      finché non la vede, non si muove
       vai a [l'osso]                e poi va dove l'osso è finito

   Da queste due righe discende tutto. L'osso lo segue dovunque vada:
   se ce l'ha Bibi va da Bibi, se è rimasto per terra va dov'è rimasto.
   Per questo **portarglielo alla cuccia** è una mossa, e lasciarlo
   dov'è non lo è.

   E per questo Bibi deve anche RESTARE lì: se riparte subito, l'osso
   riparte con lei e Bombo le va dietro senza fermarsi mai. Un cane che
   insegue non è un cane occupato.

   ── COME SI PERDE ──────────────────────────────────────────────────
   In un modo solo, e sta scritto in `sconfitta`: **Rosa mette piede
   nel passaggio mentre Bombo non è alla cuccia**. Il bambino non
   scrive nessuna condizione — quella la scrive il livello, come il
   piano delle falene in fondi-3 — e non c'è niente da indovinare: dove
   sta Bombo si vede, e la cuccia è disegnata per terra.

   CHI SA COSA, E PERCHÉ. Rosa tiene il pane del primo capitolo e ha le
   mani piene: apre, cammina, aspetta (`sa: ['vai', 'apri',
   'aspettaDiVedere']`). Bibi è una papera: raccoglie col becco,
   cammina, aspetta (`sa: ['vai', 'prendi', 'aspettaDiVedere']`). Tre
   ordini a testa, come nel capitolo prima — l'attesa è l'unica parola
   nuova, e ce l'hanno tutte e due perché tutte e due devono aspettare
   l'altra.

   E LE DUE VISTE NON SONO UN DETTAGLIO. Rosa vede lontano (5): da dove
   apre il cancelletto, Bombo al suo posto è più in là di così, e lei lo
   vede solo quando lui arriva alla cuccia. Bibi vede vicino (2):
   ferma alla cuccia non vede Rosa che aspetta dall'altra parte del
   cortile, la vede quando le passa accanto. Sono i due «quando» del
   capitolo, e stanno nei numeri della scheda, non in una regola in
   più.

   FORMA DELL'OBIETTIVO: *passaggio*. Tutte e due dall'altra parte,
   nell'aia.

   EREDITA: **il pane** (in mano a Rosa: è per quello che ha le mani
   piene, ed è per quello che Bibi la segue) e **Bibi**, che dal
   capitolo 2 sta con Rosa.
   LASCIA: **il cortile attraversato**, cioè la strada dell'aia
   imparata: nel quarto capitolo è la strada dello stagno.

   LA MAPPA (24×14). Tre fasce verticali:
     · l'orto (x1-6), dove partono Rosa e Bibi;
     · il cortile di Bombo (x8-14), con l'osso e la cuccia;
     · l'aia (x16-22), la meta.
   Fra la prima e la seconda c'è la siepe (x7), fra la seconda e la
   terza lo steccato (x15): un buco solo per ciascuno, tutti e due
   sulla riga 7 — il cancelletto (7,7), che è chiuso, e il passaggio
   (15,7), che è aperto. Nell'aia non c'è nessun cancello da aprire: la
   porta è il cane, e si apre stando fermi al momento giusto.

   LE DISTANZE NON SONO A CASO. Da dove Rosa apre il cancelletto, Bombo
   al suo posto è troppo lontano perché lei lo veda: lo vede quando
   arriva alla cuccia, ed è quello il momento. L'osso invece sta sempre
   fuori dagli occhi di Bombo, e non è un dettaglio: quello che lo fa
   partire è aver visto la papera, ma dove va lo decide l'osso — e
   finché l'osso è per terra dall'altra parte del cortile, andarci gli
   costa tutto il tempo che serve a Bibi per fermarsi alla cuccia. Chi
   sposta un numero di queste tre scene rompe il capitolo — e il banco
   di prova lo dice (`test/unita/livelli.test.mjs`).

   LE TRE SCENE. Si spostano l'osso, la cuccia, il posto di Bombo,
   l'aia e il punto di partenza. Il ragionamento non cambia mai:
   l'osso alla cuccia, poi Rosa, poi Bibi.
   ═══════════════════════════════════════════════════════════════════ */

/* le stesse scorciatoie degli altri capitoli: un ordine è
   verbo + complemento, e basta */
const o = (verbo, complemento) => ({ verbo, complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const nonQui = (chi, complemento) => ({ cond: 'qui', chi, complemento, non: true })

/* Il cortile di Bombo, 24 colonne per 14 righe.
     x7            la siepe: tutta muro tranne (7,7), il cancelletto
     x15           lo steccato: tutto muro tranne (15,7), il passaggio
   Niente altri muri dentro: il cortile è uno spazio solo, e quello che
   tiene l'osso lontano da Bombo è la distanza, non un muro. */
const CORTILE_DI_BOMBO = [
  '########################',
  '#......#.......#.......#',
  '#......#.......#.......#',
  '#......#.......#.......#',
  '#......#.......#.......#',
  '#......#.......#.......#',
  '#......#.......#.......#',
  '#......................#',
  '#......#.......#.......#',
  '#......#.......#.......#',
  '#......#.......#.......#',
  '#......#.......#.......#',
  '#......#.......#.......#',
  '########################',
]

/* IL PIANO DI BOMBO, ed è tutto qui. Due righe, e sono le stesse
   parole che ha in mano il bambino: sta fermo finché non vede la
   papera, e da lì in poi vuole l'osso — dovunque l'osso sia finito. */
const GUARDIA = [
  o('aspettaDiVedere', 'bibi'),
  o('vai', 'osso'),
]

const BIBI_3 = {
  id: 'bibi-bombo', nome: 'Bombo',
  storia: 'bibi', capitolo: 3, emoji: '🦴',
  forma: 'passaggio', concetto: 'sincronizzazione',
  idea: 'Prima l\'osso alla cuccia, e solo dopo si passa',
  eredita: ['pane', 'bibi'], lascia: ['cortile'],

  dritta: 'Rosa non deve passare mentre Bombo è di guardia.<br>' +
          'Bombo lascia il suo posto solo per l\'osso.',
  racconto: 'Bombo fa la guardia davanti all\'aia.<br>' +
            'Per l\'osso però lascia il suo posto.<br>' +
            'Bibi porta l\'osso alla cuccia e resta lì.<br>' +
            'Rosa passa quando Bombo è sull\'osso.<br>' +
            'Si vince quando arrivano tutte e due.',
  aiuti: [
    'Tocca Bombo e leggi il suo piano: sono due righe.',
    'Bombo si muove solo quando vede Bibi.',
    'C\'è un ordine nuovo: aspetta. Chi aspetta sta fermo.',
    'Rosa aspetta di vedere Bombo. Bibi aspetta di vedere Rosa.',
  ],

  griglia: CORTILE_DI_BOMBO, ambiente: 'cortile',
  /* il piano di Bombo si legge: senza, questo capitolo sarebbe un
     indovinello invece di un problema */
  mostraNemici: true,

  nomi: {
    osso: 'l\'osso',
    cuccia: 'la cuccia',
    cancelletto: 'il cancelletto',
    aia: 'l\'aia',
    soglia: 'il passaggio',
    casa: 'Rosa e Bibi', cani: 'Bombo',
  },
  /* `soglia` è il buco nello steccato, e non si nomina: non è una meta,
     è il punto in cui si decide se Bombo ti ha preso. Sta fra i posti
     perché è l'unico modo che ha una condizione di dire «è passata». */
  posti: {
    aia: { x: 20, y: 9 },
    cuccia: { x: 10, y: 8 },
    soglia: { x: 15, y: 7 },
  },
  /* una cosa chiusa sola, e non vuole nessuna chiave: il cancelletto
     dell'orto, che apre Rosa perché Bibi non ha le mani. Nell'aia
     invece non c'è niente da aprire — quel varco è guardato, non
     chiuso, e si passa col tempo, non con un gesto. */
  porte: {
    cancelletto: { x: 7, y: 7 },
  },
  /* l'icona la dichiara l'oggetto: senza `em` uscirebbe una chiave */
  oggetti: [
    { nome: 'osso', em: '🦴', x: 9, y: 10 },
  ],

  unita: [
    /* Rosa ha il pane in mano: apre, cammina, e adesso sa anche stare
       ferma finché non vede arrivare qualcuno. Vede fino a 5: da dove
       apre il cancelletto, Bombo al suo posto è più lontano di così. */
    { id: 'rosa', nome: 'Rosa', fazione: 'casa', emoji: '👧', chi: 'ladra',
      vista: 5, vita: 3, x: 2, y: 8, sa: ['vai', 'apri', 'aspettaDiVedere'] },
    /* Bibi prende col becco e non apre niente. Vede vicino (2): ferma
       alla cuccia non vede Rosa che aspetta di là, la vede quando le
       passa accanto — ed è quello il suo «adesso». */
    { id: 'bibi', nome: 'Bibi', fazione: 'casa', emoji: '🦆', chi: 'papera', manto: 'germano',
      vista: 2, vita: 3, x: 2, y: 9, sa: ['vai', 'prendi', 'aspettaDiVedere'] },
    /* Bombo non prende ordini dal bambino: il suo piano è `GUARDIA`, e
       si può leggere. Vede fino a 5, e quel cerchio si vede sulla
       mappa: è l'informazione che serve per decidere dove fermarsi. */
    { id: 'bombo', nome: 'Bombo', fazione: 'cani', emoji: '🐕', chi: 'lupo',
      vista: 5, vita: 3, x: 13, y: 7 },
  ],
  fazioni: {
    casa: { nome: 'Rosa e Bibi', autore: 'giocatore' },
    cani: { nome: 'Bombo', autore: 'livello', ordini: { bombo: GUARDIA } },
  },

  /* sei cose si possono nominare, e da lì esce la cassetta:
     `vai` (l'osso, la cuccia, il cancelletto, l'aia, Bombo, Rosa),
     `prendi` (l'osso, e solo Bibi),
     `apri` (il cancelletto, e solo Rosa),
     `aspetta di vedere` (Bombo per Rosa, Rosa per Bibi).
     Bombo e Rosa sono in elenco perché li si aspetta: una cosa che non
     si può nominare non si può nemmeno aspettare. */
  complementi: ['osso', 'cuccia', 'cancelletto', 'aia', 'bombo', 'rosa'],

  obiettivo: [qui('rosa', 'aia'), qui('bibi', 'aia')],
  /* IL MOMENTO IN CUI SI PERDE, ed è uno solo: Rosa entra nel passaggio
     mentre Bombo non ha ancora il muso sull'osso. Il bambino non scrive
     questa condizione — la scrive il livello. */
  sconfitta: [qui('rosa', 'soglia'), nonQui('bombo', 'cuccia')],
  motivoSconfitta: 'Bombo era ancora di guardia: ha visto passare Rosa e vi ha scoperti.',

  varianti: [
    { nome: 'la cuccia in mezzo al cortile',
      oggetti: { osso: { x: 9, y: 10 } },
      posti: { aia: { x: 20, y: 9 }, cuccia: { x: 10, y: 8 } },
      unita: { rosa: { x: 2, y: 8 }, bibi: { x: 2, y: 9 }, bombo: { x: 13, y: 7 } } },
    { nome: 'la cuccia in alto, l\'osso in fondo',
      oggetti: { osso: { x: 9, y: 11 } },
      posti: { aia: { x: 18, y: 3 }, cuccia: { x: 9, y: 6 } },
      unita: { rosa: { x: 2, y: 2 }, bibi: { x: 2, y: 3 }, bombo: { x: 13, y: 5 } } },
    { nome: 'la cuccia in basso, l\'osso in alto',
      oggetti: { osso: { x: 9, y: 3 } },
      posti: { aia: { x: 21, y: 11 }, cuccia: { x: 9, y: 8 } },
      unita: { rosa: { x: 2, y: 11 }, bibi: { x: 2, y: 12 }, bombo: { x: 13, y: 9 } } },
  ],

  soluzioni: [
    /* sette ordini, ed è il par: non se ne può togliere nemmeno uno.
       Senza il cancelletto Bibi non esce dall'orto; senza l'osso Bombo
       non lascia il suo posto; senza la cuccia l'osso non arriva dove
       serve; senza l'attesa di Rosa al passaggio ci si arriva troppo
       presto, e senza quella di Bibi l'osso riparte prima che Bombo ci
       arrivi — e un cane che insegue non è un cane occupato. */
    { nome: 'l\'osso alla cuccia, poi Rosa, poi Bibi', piano: {
      rosa: [o('apri', 'cancelletto'), o('aspettaDiVedere', 'bombo'), o('vai', 'aia')],
      bibi: [o('prendi', 'osso'), o('vai', 'cuccia'),
             o('aspettaDiVedere', 'rosa'), o('vai', 'aia')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto. */
  verifiche: {
    /* LA PROVA DEL CAPITOLO: tolta di mezzo l'attesa — Rosa che parte
       subito, Bibi che non si ferma alla cuccia — il piano perde. */
    nonInFila: true,
    /* nessuna delle due può fare il lavoro dell'altra: senza Bibi
       l'osso non lo porta nessuno, senza Rosa i cancelli restano
       chiusi */
    serveOgnuno: true,
    /* e le due cose senza cui non c'è niente da sincronizzare: l'osso
       (Bombo non si muove) e il cancelletto (Bibi non esce) */
    senza: ['osso', 'cancelletto'],
    /* prima l'osso, poi la cuccia: alla cuccia a becco vuoto non si
       porta niente, e Bombo si va a prendere l'osso dov'è rimasto */
    ordineConta: [['prendi osso', 'vai cuccia']],
  },
}

export default BIBI_3
export { BIBI_3 }
