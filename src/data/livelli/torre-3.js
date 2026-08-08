/* ═══════════════════════════════════════════════════════════════════
   🗝️ I PRIGIONIERI DELLA TORRE — capitolo 3: «Pero»
   forma: scorta · concetto: il segnale

   LA STORIA. Dalla porta di servizio si scende al retro delle cucine.
   Di là dal muro c'è il corridoio di ronda, e sotto il corridoio la
   cucina vera, quella dei paioli: è lì che bisogna portare **il vecchio
   Pero**, e Pero non è uno che scappa. Cammina piano, non si difende, e
   se lo vedono è finita per tutti. Ma sa dov'è ogni cosa in questa
   torre — il pozzo del cortile, la corda che ci sta dentro — e senza di
   lui i due capitoli che vengono non esistono.

   COSA INSEGNA. **Il segnale**, ed è la prima volta che serve davvero.
   Fin qui uno aspettava quello che vedeva; qui chi vede e chi cammina
   sono due persone diverse, e sono in due stanze diverse. Nilo il
   copista sta in cima al pozzetto e vede giù nel corridoio: da lì legge
   il turno delle due ronde. Pero, tre passi più indietro, non vede
   niente — e **non deve decidere niente**. La sua lista comincia con
   «quando arriva ✅ tutto libero», e finché quel segnale non arriva lui
   sta dov'è. Chi fa partire Pero da solo lo fa partire sempre un momento
   prima o un momento dopo di quello giusto: non è sfortuna, è che da
   dove sta lui quell'informazione **non c'è**.

   ── PERCHÉ NON SI VINCE IN FILA ────────────────────────────────────
   Perché il passaggio è largo un passo e ci passano tutti: Marta per
   aprire l'usciolo della cucina, Pero per entrarci. Se partono appena
   comincia la notte si trovano nel corridoio mentre la prima ronda
   scende, e la ronda grida. Le due cose che devono succedere insieme
   sono in due posti diversi: Nilo fermo in cima che guarda, e i due
   sotto che si muovono **soltanto** dopo che lui ha parlato. Togli il
   «quando arriva» e restano due che camminano a caso.

   ── DUE RONDE, NON UNA ─────────────────────────────────────────────
   E qui c'è la parte che si sbaglia: **la ronda da aspettare è la
   seconda**. Passa la prima, il corridoio sembra libero, e chi suona lì
   manda Pero addosso a quella che viene dietro. Le due girano staccate,
   e di quanto cambia da una scena all'altra: contare i passi fra l'una
   e l'altra non serve, guardare sì. Nilo vede quattro caselle — giusto
   il pozzetto e la casella di corridoio sotto di lui — quindi quando
   vede una ronda ce l'ha esattamente sotto i piedi, e da lì in poi
   quella se ne va. Le ronde vedono due caselle e non arrivano a
   toccarlo: è la stessa asimmetria del copista che legge i turni senza
   farsi leggere.

   LA MAPPA. 28×13. In alto a ponente il retro delle cucine (x1-6,
   y1-4), dove si arriva dalla porta di servizio lasciata aperta due
   notti fa. Un buco solo nel pavimento — il pozzetto (5,5) — e sotto
   c'è il corridoio di ronda (y6), che insieme al corridoio di sotto
   (y11) e alle due cuciture (x1 e x26) fa un anello: le ronde girano
   sempre nello stesso verso, e quando sono passate sono passate.
   Sotto il pozzetto, l'**usciolo** (5,7) e la cucina dei paioli (x3-9,
   y8-9): vicolo cieco, e stanotte il posto più caldo della torre.

   EREDITA: **la porta di servizio** del capitolo 2 — si passa di lì, e
   nessuno se n'è ancora accorto.
   LASCIA: **Pero**, e quello che sa: il pozzo del cortile e la corda
   che ci sta dentro. Da lì comincia il capitolo 4.
   ═══════════════════════════════════════════════════════════════════ */

/* le solite scorciatoie: un ordine è verbo + complemento, e «quando
   senti» è una testa di lista che apre un secondo piano */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const vedi = complemento => ({ cond: 'vedi', complemento })

/* Il retro delle cucine, 28 colonne per 13 righe.
     x1-6  y1-4    il retro delle cucine: si arriva dalla porta di servizio
     (5,5)         il pozzetto: l'unico buco verso il corridoio
     x1-26 y6      il corridoio di ronda, braccio di sopra
     (5,7)         l'usciolo della cucina
     x3-9  y8-9    la cucina dei paioli: vicolo cieco, la meta
     x1,x26 y7-10  le due cuciture dell'anello
     x1-26 y11     il braccio di sotto: di lì non si vede niente */
const RETRO_CUCINE = [
  '############################',
  '#......#####################',
  '#......#####################',
  '#......#####################',
  '#......#####################',
  '#####.######################',
  '#..........................#',
  '#.###.####################.#',
  '#.#.......################.#',
  '#.#.......################.#',
  '#.########################.#',
  '#..........................#',
  '############################',
]

/* IL GIRO DELLE DUE RONDE, e si legge toccandole: lo stesso anello,
   lo stesso verso, e smettono solo quando vedono qualcuno — cioè
   quando per voi è già finita. Quello che non è scritto qui sta nella
   loro scheda: **gridano**, e un grido solo basta. */
const GIRO = [
  { verbo: 'pattuglia', complemento: '1,6', punti: ['1,6', '1,11', '26,11', '26,6'],
    finche: vedi('prigionieri') },
]

export const TORRE_3 = {
  id: 'torre-pero', nome: 'Pero',
  storia: 'torre', capitolo: 3, emoji: '🧓',
  forma: 'scorta', concetto: 'eventi',
  idea: 'Chi vede non è chi cammina: qualcuno glielo deve dire',
  eredita: ['porta'], lascia: ['pero'],

  dritta: "Pero <b>non deve decidere niente</b>: deve muoversi quando glielo dite. Nilo sta in cima al pozzetto e vede giù; Pero, tre passi indietro, non vede niente. Perciò la lista di Pero comincia con <b>quando arriva ✅ tutto libero</b>, e a suonarlo è Nilo — ma solo dopo che è passata la <b>seconda</b> ronda, non dopo la prima.",
  racconto: "Pero cammina piano e non corre per nessuno. Ma sa dov'è il pozzo, e nessuno di voi lo sa: va portato alla <b>cucina dei paioli</b>, sotto il corridoio di ronda. Nel corridoio girano <b>due</b> ronde, sempre nello stesso verso, e chi si fa vedere è perduto — nessuno di voi sa menare. Si vince quando Pero è in cucina, intero.",
  aiuti: [
    'Nilo vede giù nel corridoio. Pero no: da dove sta lui quell\'informazione non c\'è.',
    'Un segnale è una parola detta a voce alta: uno la dice con «suona», gli altri hanno una lista che comincia con «quando arriva».',
    'Le ronde sono due, e non passano insieme: quella da aspettare è la seconda.',
    'Anche Marta deve aspettare il segnale: l\'usciolo si apre stando in corridoio, e in corridoio non ci si sta a caso.',
  ],

  griglia: RETRO_CUCINE, ambiente: 'corridoio',
  mostraNemici: true,

  nomi: {
    vedetta: 'la cima del pozzetto',
    cucina: 'la cucina dei paioli',
    usciolo: 'l\'usciolo della cucina',
    guardia: 'la prima ronda',
    ronda: 'la seconda ronda',
    libero: 'tutto libero',
    prigionieri: 'i prigionieri',
    torre: 'le ronde della torre',
  },
  posti: {
    vedetta: { x: 5, y: 2 },
    cucina: { x: 7, y: 9 },
  },
  porte: {
    usciolo: { x: 5, y: 7, chiave: 'chiavetta' },
  },
  oggetti: [
    { nome: 'chiavetta', em: '🔑', x: 2, y: 3 },
  ],
  segnali: ['libero'],

  unita: [
    /* Nilo vede quattro caselle: giusto il pozzetto e la casella di
       corridoio che gli sta sotto. Non è poco: è un orologio — quando
       vede una ronda ce l'ha sotto i piedi, e da lì in poi quella se ne
       va. Ed è l'unico dei tre che sa suonare. */
    { id: 'nilo', nome: 'Nilo', fazione: 'prigionieri', emoji: '🪶', chi: 'elfo',
      vista: 4, vita: 3, x: 1, y: 1,
      sa: ['vai', 'prendi', 'aspetta', 'aspettaDiVedere', 'suona'] },
    /* Marta apre l'usciolo, e per aprirlo deve stare in corridoio: è la
       ragione per cui anche lei ha un «quando arriva» invece di una
       fila che parte subito */
    { id: 'marta', nome: 'Marta', fazione: 'prigionieri', emoji: '🪡', chi: 'ladra',
      vista: 4, vita: 3, x: 3, y: 4,
      sa: ['vai', 'prendi', 'apri', 'aspetta', 'quando'] },
    /* Pero: cammina e aspetta, e basta. Non prende, non apre, non
       suona. Tutto quello che fa lo fa perché glielo hanno detto */
    { id: 'pero', nome: 'il vecchio Pero', fazione: 'prigionieri', emoji: '🧓', chi: 'mago',
      vista: 2, vita: 1, x: 2, y: 2, sa: ['vai', 'aspetta', 'quando'] },

    { id: 'guardia', nome: 'la prima ronda', fazione: 'torre', emoji: '🗡️', chi: 'guardia',
      vista: 2, vita: 9, x: 10, y: 6, grida: 'nemico' },
    { id: 'ronda', nome: 'la seconda ronda', fazione: 'torre', emoji: '🛡️', chi: 'capitano',
      vista: 2, vita: 9, x: 18, y: 6, grida: 'nemico' },
  ],
  fazioni: {
    prigionieri: { nome: 'i prigionieri', autore: 'giocatore' },
    torre: { nome: 'le ronde della torre', autore: 'livello',
             ordini: { guardia: GIRO, ronda: GIRO } },
  },

  /* sei cose si possono nominare: la vedetta e la cucina (dove si va),
     l'usciolo (che si apre), le due ronde (che si guardano) e «tutto
     libero» (che si suona e si ascolta). **`attacca` non c'è**: le
     ronde sono in elenco perché vanno guardate, ma nessuno dei tre sa
     quel verbo — ed è la regola della storia. */
  complementi: ['vedetta', 'cucina', 'usciolo', 'chiavetta', 'guardia', 'ronda', 'libero'],

  obiettivo: [qui('pero', 'cucina')],
  sconfitta: [{ cond: 'segnale', complemento: 'nemico' }],
  motivoSconfitta: 'Una ronda vi ha visti nel corridoio: un grido, e per Pero è finita.',

  /* ── LA SCENOGRAFIA ── roba che sta lì e basta: non passa dal motore */
  scenografia: [
    { che: 'sacco', x: 2, y: 1 }, { che: 'botte', x: 3, y: 1 },
    { che: 'ragnatela', x: 1, y: 2, strato: -1 }, { che: 'ossa', x: 6, y: 2 },
    { che: 'torcia', x: 2, y: 6 }, { che: 'cartello', x: 6, y: 6 },
    { che: 'colonna', x: 12, y: 6 }, { che: 'colonna', x: 20, y: 6 },
    { che: 'cassa', x: 22, y: 6 }, { che: 'barile', x: 25, y: 6 },
    { che: 'catena', x: 1, y: 9 }, { che: 'ragnatela', x: 26, y: 8, strato: -1 },
    { che: 'botte', x: 3, y: 8 }, { che: 'sacco', x: 8, y: 8 },
    { che: 'pane', x: 6, y: 9 }, { che: 'secchio', x: 9, y: 9 },
    { che: 'fontana', x: 3, y: 9 },
    { che: 'pozzanghera', x: 5, y: 11, strato: -1 }, { che: 'ossa', x: 13, y: 11 },
    { che: 'torcia', x: 21, y: 11 },
  ],

  /* tre scene, e quello che cambia è **quanto sono staccate le due
     ronde** quando comincia la notte: nella prima otto passi, nella
     seconda otto ma più in là, nella terza quattro soli. Chi conta
     i passi ne indovina una; chi aspetta di veder passare la seconda
     le vince tutte. Si spostano anche la cima del pozzetto, l'angolo
     della cucina e da dove parte ognuno dei tre. */
  varianti: [
    { nome: 'le due ronde a mezzo corridoio, staccate di otto',
      posti: { vedetta: { x: 5, y: 2 }, cucina: { x: 7, y: 9 } },
      oggetti: { chiavetta: { x: 2, y: 3 } },
      unita: { nilo: { x: 1, y: 1 }, marta: { x: 3, y: 4 }, pero: { x: 2, y: 2 },
               guardia: { x: 10, y: 6 }, ronda: { x: 18, y: 6 } } },
    { nome: 'le ronde cominciano il giro dal fondo',
      posti: { vedetta: { x: 4, y: 3 }, cucina: { x: 4, y: 9 } },
      oggetti: { chiavetta: { x: 1, y: 3 } },
      unita: { nilo: { x: 1, y: 4 }, marta: { x: 6, y: 1 }, pero: { x: 6, y: 4 },
               guardia: { x: 16, y: 6 }, ronda: { x: 24, y: 6 } } },
    { nome: 'le due ronde si sono avvicinate: quattro passi',
      posti: { vedetta: { x: 6, y: 3 }, cucina: { x: 9, y: 8 } },
      oggetti: { chiavetta: { x: 3, y: 2 } },
      unita: { nilo: { x: 5, y: 3 }, marta: { x: 2, y: 4 }, pero: { x: 1, y: 1 },
               guardia: { x: 10, y: 6 }, ronda: { x: 14, y: 6 } } },
  ],

  par: 8,
  soluzioni: [
    /* otto ordini, ed è il par. Tre a Nilo, che è quello che guarda:
       sale, aspetta **la seconda** ronda, e parla. Tre a Marta — la
       chiavetta, e poi un «quando arriva» con dentro l'usciolo. Due a
       Pero, che è il minimo che si possa scrivere per uno che non deve
       decidere niente. Non se ne toglie nessuno: senza il posto di
       vedetta Nilo non vede niente, senza l'attesa suona a vuoto, senza
       il «suona» non parte più niente, senza la chiavetta l'usciolo
       resta chiuso, e senza i due «quando arriva» partono subito e li
       vedono. */
    { nome: 'Nilo guarda e dice, gli altri partono quando glielo dicono', piano: {
      nilo: [o('vai', 'vedetta'), o('aspettaDiVedere', 'ronda'), o('suona', 'libero')],
      marta: [o('prendi', 'chiavetta'), quando('libero', o('apri', 'usciolo'))],
      pero: [quando('libero', o('vai', 'cucina'))],
    } },
    /* FRAGILE, ed è l'errore che viene naturale: suonare appena è
       passata **la prima** ronda. Il corridoio in quel momento sembra
       davvero libero — e nella terza scena, dove le due sono staccate
       di quattro passi soli, quando Pero arriva sotto il pozzetto è
       passata anche la seconda e la cosa riesce per un pelo. Nelle
       altre due, dove sono staccate di otto, la seconda ronda arriva
       puntuale proprio mentre Pero è in mezzo al corridoio. */
    { nome: 'suona dopo la prima', fragile: true, piano: {
      nilo: [o('vai', 'vedetta'), o('aspettaDiVedere', 'guardia'), o('suona', 'libero')],
      marta: [o('prendi', 'chiavetta'), quando('libero', o('apri', 'usciolo'))],
      pero: [quando('libero', o('vai', 'cucina'))],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ── */
  verifiche: {
    /* LA PROVA DEL CAPITOLO: srotolati i «quando arriva», Marta e Pero
       partono all'istante e finiscono nel corridoio con le ronde */
    nonInFila: true,
    /* e nessuno dei tre fa il lavoro di un altro: Nilo non apre e non
       arriva, Marta non vede, Pero non decide */
    serveOgnuno: true,
    /* prima si guarda, poi si parla: è tutto il capitolo */
    ordineConta: [['aspettaDiVedere ronda', 'suona libero']],
    /* senza il segnale non parte niente, e senza la chiavetta la
       cucina resta chiusa */
    senza: ['libero', 'chiavetta'],
  },
}

export default TORRE_3
