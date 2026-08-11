/* ═══════════════════════════════════════════════════════════════════
   🗝️ I PRIGIONIERI DELLA TORRE — capitolo 2: «Il turno della guardia»
   forma: passaggio · concetto: aspetta che

   LA STORIA. La chiave è arrivata sotto la porta ed è la stessa di
   ieri notte: la grata si apre. Di là c'è il corridoio delle celle, e
   il corridoio non è vuoto — **Zoppo** ci fa il giro, sempre lo stesso,
   e i suoi ordini si leggono toccandolo. Dall'altra parte del corridoio
   c'è la porta di servizio, quella da cui passano i secchi. Bisogna
   attraversare tutti e quattro senza che nessuno alzi la voce: qui non
   si mena nessuno, non lo sa fare nessuno, e uno che vi vede ha già
   vinto anche se non vi tocca.

   COSA INSEGNA. **Aspetta che**, non «aspetta un momento». È la
   differenza fra un piano e una scommessa: contare i momenti funziona
   su una scena su tre, perché nelle altre due Zoppo parte da un altro
   punto del giro. Aspettare **un fatto** funziona sempre. E i fatti che
   si possono aspettare qui sono tre, tutti e tre veri:

       aspetta [la grata]            finché non è aperta, di qui non si esce
       aspetta [la porta di servizio] finché non è aperta, di là non si entra
       aspetta di vedere [Zoppo]      finché non passa, non è il momento

   Marta è l'unica che guarda una persona: sta attaccata alle sbarre e
   vede poco (vista 2), quindi **vede Zoppo solo quando ce l'ha davanti
   alla grata** — e quello è il momento buono, perché da lì in poi lui
   cammina dandole le spalle. Gli altri tre non guardano nessuno:
   guardano una porta. Quando la porta di servizio è aperta vuol dire
   due cose insieme — che Marta è passata e che Zoppo non c'era — e non
   c'è bisogno di sapere altro.

   ── PERCHÉ NON SI VINCE IN FILA ────────────────────────────────────
   Perché il corridoio è largo un passo e Zoppo lo percorre tutto. Se i
   quattro escono appena la grata si apre, si trovano in mezzo al
   corridoio proprio mentre lui arriva: lo dice il registro, e lo dice
   una volta sola perché chi grida grida una volta e la scena finisce
   lì. Due cose devono succedere nello stesso istante e in due posti
   diversi — Zoppo che si allontana a ponente e i quattro che
   attraversano a levante — e nessuno dei due sa dell'altro se non
   guardando.

   E C'È UN'ATTESA CHE NON SI SCRIVE. `vai` a una porta chiusa non
   fallisce: **aspetta** che si apra, e riparte da solo. Perciò gli
   altri tre hanno un ordine solo a testa — «vai all'andito» — e restano
   dentro finché Marta non ha aperto: l'attesa ce l'hanno già dentro
   l'ordine, e scoprirlo vale più che scriverla. L'unica attesa che
   nessun ordine sa fare da sé è guardare **una persona**, ed è quella
   che Marta scrive. La strada lunga, con tutte le attese messe nero su
   bianco, sta fra le soluzioni qui sotto e vince uguale: costa sei
   ordini in più, e il par premia senza vietare.

   UNA CELLA CHIUSA È ANCHE CIECA. Finché la grata non è aperta, dal
   dentro non si vede niente del corridoio — nel Generale si vede quel
   che si può raggiungere camminando. Ecco perché Marta apre **prima** e
   guarda **dopo**: non è una scelta di stile, è l'unico verso in cui il
   piano sta in piedi.

   LA MAPPA. 26×12, il piano delle celle. In alto la cella (x2-6,
   y1-3), con un buco solo nel muro: la **grata** (4,4), chiusa a
   chiave. Sotto, il corridoio di ronda: due bracci lunghi — quello di
   sopra (y5) e quello di sotto (y10) — cuciti alle due estremità (x1 e
   x24). È un anello, ed è per questo che Zoppo sparisce per un pezzo:
   quando gira a ponente e scende, dal corridoio di sopra non lo vede
   più nessuno, e quello è tutto il tempo che serve. In mezzo, sotto la
   grata, la **porta di servizio** (4,6) e l'andito dei secchi (x3-6,
   y7-8), che è un vicolo cieco e per una notte è il posto più sicuro
   della torre.

   EREDITA: **la chiave** del capitolo 1 — senza quella la cella non si
   apre, e infatti il primo ordine di Marta è raccoglierla dalla paglia
   dove Cric l'ha spinta.
   LASCIA: **la porta di servizio aperta**. Nessuno la richiude, perché
   nel Generale una porta si apre e basta — ed è la via d'uscita del
   quinto capitolo.
   ═══════════════════════════════════════════════════════════════════ */

/* le solite scorciatoie: un ordine è verbo + complemento */
const o = (verbo, complemento) => ({ verbo, complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const vedi = complemento => ({ cond: 'vedi', complemento })

/* Il piano delle celle, 26 colonne per 12 righe.
     x2-6  y1-3    la cella
     (4,4)         la grata: l'unico buco nel muro della cella
     x1-24 y5      il braccio di sopra del giro di ronda
     (4,6)         la porta di servizio
     x3-6  y7-8    l'andito dei secchi: vicolo cieco, la meta
     x1,x24 y6-9   le due cuciture dell'anello
     x1-24 y10     il braccio di sotto: di lì non si vede niente */
const PIANO_CELLE = [
  '##########################',
  '##.....###################',
  '##.....###################',
  '##.....###################',
  '####.#####################',
  '#........................#',
  '#.##.###################.#',
  '#.#....#################.#',
  '#.#....#################.#',
  '#.######################.#',
  '#........................#',
  '##########################',
]

/* IL GIRO DI ZOPPO, e sono due righe che si leggono toccandolo: fa
   l'anello, sempre nello stesso verso, e smette solo se vede qualcuno
   — cioè quando per voi è già finita. Quello che NON è scritto qui sta
   nella sua scheda, perché non è un ordine di nessuno: **grida**, e un
   grido solo basta.
   La sentinella invece non gira: sta al suo posto e guarda. Vede poco
   (2), ma quel poco lo vede sempre. */
const RONDA = [
  { blocco: 'ripeti',
    corpo: [o('vai', '1,5'), o('vai', '1,10'), o('vai', '24,10'), o('vai', '24,5')],
    finche: vedi('prigionieri') },
]
const POSTO = [o('aspettaDiVedere', 'prigionieri')]

export const TORRE_2 = {
  id: 'torre-turno', nome: 'Il turno della guardia',
  storia: 'torre', capitolo: 2, emoji: '🚶',
  forma: 'passaggio', concetto: 'attesa',
  idea: 'Aspetta che succeda, non aspetta un momento',
  eredita: ['chiave'], lascia: ['porta'],

  dritta: "Tocca <b>Zoppo</b> e leggi il suo giro: è un anello, e quando scende a ponente sparisce dal corridoio per un pezzo. Non contare i momenti — <b>aspetta un fatto</b>. Marta guarda lui e vede poco: se lo vede, vuol dire che ce l'ha davanti e che adesso si allontana. Gli altri tre guardano una porta: quando la porta di servizio è aperta, la strada c'è.",
  racconto: "La grata si apre con la chiave arrivata sotto la porta. Di là c'è il corridoio, e nel corridoio <b>Zoppo</b> fa sempre lo stesso giro: chi si fa vedere è perduto, perché lui <b>grida</b> e nessuno di voi sa menare. Si vince quando <b>tutti e quattro</b> sono nell'andito dei secchi, oltre la porta di servizio — e quella porta, una volta aperta, <b>nessuno la richiude più</b>.",
  aiuti: [
    'Marta è l\'unica che apre. Prima la chiave dalla paglia, poi la grata.',
    'Una cella chiusa è anche cieca: finché la grata non è aperta non si vede niente del corridoio. Marta apre prima e guarda dopo.',
    'Marta vede poco apposta: quando vede Zoppo ce l\'ha davanti, e da lì in poi lui se ne va.',
    'Agli altri tre basta «vai all\'andito»: davanti a una porta chiusa non ci si schianta, si aspetta.',
    'Contare i momenti funziona su una scena su tre. Aspettare un fatto funziona sempre.',
  ],

  griglia: PIANO_CELLE, ambiente: 'corridoio',
  mostraNemici: true,

  nomi: {
    chiave: 'la chiave della cella',
    grata: 'la grata della cella',
    portaservizio: 'la porta di servizio',
    andito: 'l\'andito dei secchi',
    guardia: 'Zoppo',
    sentinella: 'la sentinella',
    prigionieri: 'i prigionieri',
    torre: 'le guardie della torre',
  },
  posti: { andito: { x: 4, y: 8 } },
  porte: {
    grata: { x: 4, y: 4, chiave: 'chiave' },
    portaservizio: { x: 4, y: 6 },
  },
  oggetti: [
    { nome: 'chiave', em: '🗝️', x: 4, y: 3 },
  ],

  unita: [
    /* Marta apre tutto, e vede poco: due caselle. Non è un difetto, è
       l'orologio del capitolo — vede Zoppo solo quando ce l'ha davanti
       alla grata, e quello è il momento in cui lui comincia ad andarsene */
    { id: 'marta', nome: 'Marta', fazione: 'prigionieri', emoji: '🪡', chi: 'ladra',
      vista: 2, vita: 3, x: 4, y: 3,
      sa: ['vai', 'prendi', 'apri', 'aspetta', 'aspettaDiVedere'] },
    { id: 'cric', nome: 'Cric', fazione: 'prigionieri', emoji: '🐭', chi: 'gatto', manto: 'nero',
      vista: 5, vita: 3, x: 3, y: 3, sa: ['vai', 'prendi', 'aspetta'] },
    { id: 'nilo', nome: 'Nilo', fazione: 'prigionieri', emoji: '🪶', chi: 'elfo',
      vista: 5, vita: 3, x: 5, y: 3, sa: ['vai', 'prendi', 'aspetta'] },
    /* Pero parte dal fondo della cella: sei passi in più di tutti, ed è
       il modo che il gioco ha di dire che cammina piano. Il piano si
       scrive intorno a lui, non intorno a chi corre */
    { id: 'pero', nome: 'il vecchio Pero', fazione: 'prigionieri', emoji: '🧓', chi: 'mago',
      vista: 7, vita: 3, x: 2, y: 1, sa: ['vai', 'aspetta'] },

    { id: 'guardia', nome: 'Zoppo', fazione: 'torre', emoji: '🗡️', chi: 'guardia',
      vista: 1, vita: 9, x: 10, y: 5, grida: 'nemico' },
    { id: 'sentinella', nome: 'la sentinella', fazione: 'torre', emoji: '🛡️', chi: 'capitano',
      vista: 2, vita: 9, x: 1, y: 5, grida: 'nemico' },
  ],
  fazioni: {
    prigionieri: { nome: 'i prigionieri', autore: 'giocatore' },
    torre: { nome: 'le guardie della torre', autore: 'livello',
             ordini: { guardia: RONDA, sentinella: POSTO } },
  },

  /* cinque cose si possono nominare, e da lì esce la cassetta:
     `prendi` (la chiave), `apri` (la grata, la porta di servizio),
     `aspetta` (le due porte, e Zoppo per chi sa guardare qualcuno),
     `vai` (l'andito). **`attacca` non compare in nessuna cassetta**:
     non perché il bersaglio manchi — Zoppo è in elenco, va aspettato —
     ma perché nessuno dei quattro sa quel verbo, e non lo saprà mai. */
  complementi: ['chiave', 'grata', 'portaservizio', 'andito', 'guardia', 'momento'],

  obiettivo: [qui('marta', 'andito'), qui('cric', 'andito'),
              qui('nilo', 'andito'), qui('pero', 'andito')],
  /* si perde in un modo solo, ed è la forma dell'obiettivo: qualcuno vi
     ha visti. Non serve che vi tocchi — grida, e in una torre un grido
     vale più di una spada */
  sconfitta: [{ cond: 'segnale', complemento: 'nemico' }],
  motivoSconfitta: 'Vi hanno visti nel corridoio: un grido, e la torre è sveglia.',

  /* ── LA SCENOGRAFIA ──
     Roba che sta lì e basta: non passa dal motore, non si prende, non
     si nomina in un ordine. */
  scenografia: [
    { che: 'sacco', x: 5, y: 1 }, { che: 'ragnatela', x: 3, y: 2, strato: -1 },
    { che: 'ossa', x: 5, y: 2 },
    { che: 'torcia', x: 2, y: 5 }, { che: 'cartello', x: 6, y: 5 },
    { che: 'colonna', x: 9, y: 5 }, { che: 'cassa', x: 12, y: 5 },
    { che: 'colonna', x: 16, y: 5 }, { che: 'botte', x: 18, y: 5 },
    { che: 'barile', x: 22, y: 5 },
    { che: 'catena', x: 1, y: 8 }, { che: 'ragnatela', x: 24, y: 7, strato: -1 },
    { che: 'scala', x: 6, y: 7, strato: -1 }, { che: 'sacco', x: 3, y: 8 },
    { che: 'secchio', x: 5, y: 8 },
    { che: 'pozzanghera', x: 5, y: 10, strato: -1 }, { che: 'botte', x: 9, y: 10 },
    { che: 'ossa', x: 12, y: 10 }, { che: 'torcia', x: 20, y: 10 },
  ],

  /* tre scene, e quello che cambia è **a che punto del giro sta Zoppo
     quando comincia la notte** — cioè quanto bisogna aspettare, che è
     la cosa che non si può contare. Si spostano anche la sentinella
     (che non gira ma guarda), la chiave nella paglia, l'angolo
     dell'andito e da dove parte ognuno dei quattro. */
  varianti: [
    { nome: 'Zoppo è a mezzo corridoio',
      posti: { andito: { x: 4, y: 8 } },
      oggetti: { chiave: { x: 4, y: 3 } },
      unita: { marta: { x: 4, y: 3 }, cric: { x: 3, y: 3 }, nilo: { x: 5, y: 3 },
               pero: { x: 2, y: 1 }, guardia: { x: 10, y: 5 }, sentinella: { x: 1, y: 5 } } },
    { nome: 'Zoppo comincia il giro dal fondo',
      posti: { andito: { x: 6, y: 8 } },
      oggetti: { chiave: { x: 2, y: 1 } },
      unita: { marta: { x: 4, y: 3 }, cric: { x: 2, y: 3 }, nilo: { x: 6, y: 2 },
               pero: { x: 6, y: 1 }, guardia: { x: 20, y: 5 }, sentinella: { x: 24, y: 5 } } },
    { nome: 'la sentinella è di qua, a tre passi dalla grata',
      posti: { andito: { x: 3, y: 7 } },
      oggetti: { chiave: { x: 6, y: 3 } },
      unita: { marta: { x: 4, y: 3 }, cric: { x: 3, y: 1 }, nilo: { x: 2, y: 2 },
               pero: { x: 2, y: 3 }, guardia: { x: 14, y: 5 }, sentinella: { x: 7, y: 5 } } },
  ],

  par: 8,
  soluzioni: [
    /* otto ordini, ed è il par. Cinque a Marta, perché è l'unica che
       apre e l'unica che guarda; **uno solo** agli altri tre, e qui c'è
       una cosa che si scopre giocando: «vai» a una porta chiusa non
       fallisce, **aspetta** che si apra. Gli altri tre non devono
       scrivere nessuna attesa perché ce l'hanno già dentro l'ordine —
       la strada c'è quando Marta l'ha aperta, e prima di allora
       restano dentro. La sola attesa scritta è quella che nessun
       ordine sa fare da sé: guardare una persona. */
    { nome: 'Marta guarda, gli altri seguono la strada che si apre', piano: {
      marta: [o('prendi', 'chiave'), o('apri', 'grata'),
              o('aspettaDiVedere', 'guardia'),
              o('apri', 'portaservizio'), o('vai', 'andito')],
      cric: [o('vai', 'andito')],
      nilo: [o('vai', 'andito')],
      pero: [o('vai', 'andito')],
    } },
    /* LA STRADA LUNGA: la stessa cosa con le attese scritte per esteso,
       due per uno — aspetta che la cella si apra, aspetta che la strada
       ci sia. Vince uguale e costa sei ordini in più: il par premia
       quella corta senza vietare questa, ed è la versione da cui si
       capisce cosa sta succedendo. */
    { nome: 'l\'attesa scritta per esteso', lunga: true, piano: {
      marta: [o('prendi', 'chiave'), o('apri', 'grata'),
              o('aspettaDiVedere', 'guardia'),
              o('apri', 'portaservizio'), o('vai', 'andito')],
      cric: [o('aspetta', 'grata'), o('aspetta', 'portaservizio'), o('vai', 'andito')],
      nilo: [o('aspetta', 'grata'), o('aspetta', 'portaservizio'), o('vai', 'andito')],
      pero: [o('aspetta', 'grata'), o('aspetta', 'portaservizio'), o('vai', 'andito')],
    } },
    /* FRAGILE, ed è **la** tentazione di questo capitolo: contare i
       momenti invece di aspettare un fatto. Cinque «aspetta un
       momento» sono esattamente giusti nella prima scena — Zoppo passa,
       Marta esce dietro di lui, tutto liscio — e sono un conto sbagliato
       nelle altre due, dove il giro comincia da un altro punto: nella
       seconda Marta apre la porta con Zoppo a un passo, nella terza gli
       cammina proprio addosso. Cinque numeri giusti una volta su tre. */
    { nome: 'contare i momenti', fragile: true, piano: {
      marta: [o('prendi', 'chiave'), o('apri', 'grata'),
              o('aspetta', 'momento'), o('aspetta', 'momento'),
              o('aspetta', 'momento'), o('aspetta', 'momento'),
              o('aspetta', 'momento'),
              o('apri', 'portaservizio'), o('vai', 'andito')],
      cric: [o('vai', 'andito')],
      nilo: [o('vai', 'andito')],
      pero: [o('vai', 'andito')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ── */
  verifiche: {
    /* LA PROVA DEL CAPITOLO: tolte le attese, tutti e quattro escono
       appena la grata si apre e finiscono in corridoio mentre Zoppo
       arriva */
    nonInFila: true,
    /* e non se ne salva nessuno da solo: si vince in quattro o non si
       vince */
    serveOgnuno: true,
    ordineConta: [
      /* la chiave prima della grata: è l'eredità del capitolo 1 */
      ['prendi chiave', 'apri grata'],
      /* e guardare prima di aprire: è la stessa inversione della
         soluzione fragile qui sopra */
      ['aspettaDiVedere guardia', 'apri portaservizio'],
    ],
    /* senza la chiave la cella non si apre, e senza la porta di
       servizio l'andito non esiste */
    senza: ['chiave', 'portaservizio'],
  },
}

export default TORRE_2
