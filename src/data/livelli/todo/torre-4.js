/* ═══════════════════════════════════════════════════════════════════
   🗝️ I PRIGIONIERI DELLA TORRE — capitolo 4: «Il pozzo»
   forma: esca · concetto: finché (il ciclo)

   LA STORIA. Pero l'ha detto: nel pozzo del cortile c'è la corda dei
   secchi, venti braccia, e senza quella il muro resta un muro. Sul
   pozzo però c'è una guardia, e quella dal pozzo non si sposta — a meno
   che qualcuno le passi davanti e scappi. Nessuno di voi sa menare, e
   non serve: quello che si può fare è **darle qualcosa da guardare**.

   COSA INSEGNA. `pattuglia … finché`, ed è l'ordine più strano di tutto
   il Generale, perché **si scrive perché fallisca**. Fin qui il «finché»
   era una buona notizia — smetti di girare quando è successa la cosa che
   aspettavi. Qui la cosa che aspetti è *essere scoperto*:

       Nilo: pattuglia [il loggiato, su e giù] finché vedi la guardia

   Va su e giù davanti al loggiato finché quella non alza la testa. Non
   è un'imprudenza: è il piano. E appena succede, **suona «🏃 via,
   adesso»** — perché Marta, dall'altra parte del cortile, non può
   saperlo da sola — e poi ha bisogno di **una strada per tornare**, che
   è la parte che si dimentica sempre: la guardia gli va dietro, e chi
   fa l'esca e non sa dove finire l'ha fatta per niente.

   PERCHÉ UN GIRO E NON UN POSTO SOLO. Perché la guardia non è sempre
   dallo stesso lato del pozzo. Farsi vedere in un punto scelto a mano
   funziona nella scena in cui quel punto ci azzecca e in nessun'altra —
   è la soluzione «fragile» qui sotto. Un giro che tocca tutti e due i
   capi del loggiato passa **per forza** sotto gli occhi di qualcuno,
   dovunque sia messo: un ciclo non è una fila lunga, è una fila che non
   ha bisogno di sapere quanto dev'essere lunga.

   ── PERCHÉ NON SI VINCE IN FILA ────────────────────────────────────
   Perché Marta è **a sei passi dal pozzo** e Nilo dall'altra parte del
   cortile, e le due cose devono succedere nello stesso momento: Nilo
   che si fa guardare **mentre** Marta alza il coperchio. La tentazione
   è messa lì apposta — la corda si vede, basterebbe allungare la mano —
   e chi la allunga perde nell'istante in cui la tocca: la sconfitta lo
   dice con le sue parole, «la guardia era ancora al pozzo». Se invece
   parte solo Nilo, la guardia gira a vuoto e la corda resta giù.

   E CRIC? Cric passa sotto il naso di chiunque: è un topo, e un topo
   non è una notizia. La guardia sta aspettando di veder passare **una
   persona** — c'è scritto nei suoi ordini — e Cric le cammina davanti
   senza che succeda niente. Prende il secchio, che è legato all'altro
   capo della corda: senza il secchio la corda non viene su. È l'unica
   cosa in cinque capitoli che si può fare senza aspettare nessuno, ed è
   giusto che la faccia lui.

   LA MAPPA. 26×14. Il cortile è un anello intorno alla cisterna, che è
   il blocco pieno in mezzo (x7-17, y6-10): si gira da sopra (y4-5), da
   sotto (y11-12), da ponente (x1-6) o da levante (x18-24). A ponente in
   alto si arriva dalle cucine. A levante il **pozzo**: una nicchia di
   due caselle chiusa dal coperchio (22,7), con la corda in fondo
   (22,8) — e la guardia piantata davanti. Il **loggiato** è la colonna
   x19, fra il pozzo e la cisterna: chi cammina lì è visto dal pozzo, e
   dal loggiato al sottoscala c'è mezzo cortile — cioè tutto il tempo
   che serve a Marta, che parte dall'angolo di levante a sei passi dal
   coperchio e non deve muoversi un istante prima.

   EREDITA: **Pero**, e quello che sa — il pozzo non si vede dal
   cortile, e senza di lui nessuno saprebbe che la corda è lì.
   LASCIA: **la corda**, venti braccia, addosso a Marta.
   ═══════════════════════════════════════════════════════════════════ */

/* le solite scorciatoie */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })
const vedi = complemento => ({ cond: 'vedi', complemento })
const nonVedi = complemento => ({ cond: 'vedi', complemento, non: true })

/* Il cortile del pozzo, 26 colonne per 14 righe.
     x1-4  y1-3     le cucine: si arriva di lì
     x1-24 y4-12    il cortile, che gira intorno alla cisterna
     x7-17 y6-10    la cisterna: il blocco pieno in mezzo
     (22,7)         il coperchio del pozzo
     (22,8)         la corda, in fondo alla nicchia */
const CORTILE = [
  '##########################',
  '#....#####################',
  '#....#####################',
  '#....#####################',
  '#........................#',
  '#........................#',
  '#......###########.......#',
  '#......###########...#.#.#',
  '#......###########...#.#.#',
  '#......###########...###.#',
  '#......###########.......#',
  '#........................#',
  '#........................#',
  '##########################',
]

/* IL PIANO DELLA GUARDIA, e sono tre righe che si leggono toccandola.
   La prima è quella che conta: **aspetta di veder passare Nilo** —
   una persona, non un topo. Poi gli va dietro finché lo vede, e poi
   torna al pozzo. Non grida e non mena: è sola, e una che è sola va a
   controllare. Il tempo che sta via è tutto lì dentro, e si può
   leggere prima di firmare il proprio piano. */
const AL_POZZO = [
  o('aspettaDiVedere', 'nilo'),
  o('vai', 'nilo'),
  o('vai', 'vedetta'),
]

export const TORRE_4 = {
  id: 'torre-pozzo', nome: 'Il pozzo',
  storia: 'torre', capitolo: 4, emoji: '🪣',
  forma: 'esca', concetto: 'ciclo',
  idea: 'Un ordine scritto perché fallisca: gira finché ti vedono',
  eredita: ['pero'], lascia: ['corda'],

  dritta: "Nessuno di voi sa menare, e non serve: dàlle <b>qualcosa da guardare</b>. Nilo <b>pattuglia il loggiato finché la guardia lo vede</b> — è l'unico ordine del gioco che si scrive per fallire apposta — poi suona «🏃 via, adesso» e <b>si toglie di mezzo</b>. Marta ha una lista che comincia con «quando arriva». Un punto solo non basta: la guardia non è sempre dallo stesso lato.",
  racconto: "Nel pozzo c'è la corda per il muro, e sul pozzo c'è una guardia che non si sposta mai — a meno che qualcuno le passi davanti e scappi. Tocca la guardia e <b>leggi i suoi ordini</b>: aspetta di veder passare una persona, le va dietro, poi torna al pozzo. Si vince quando <b>Marta ha la corda</b>, <b>Cric ha il secchio</b> e <b>Nilo è al sottoscala</b>. Si perde nell'istante in cui Marta tocca la corda con la guardia ancora al pozzo.",
  aiuti: [
    'Tocca la guardia: aspetta di veder passare <b>Nilo</b>. Cric le può camminare davanti, un topo non è una notizia.',
    'Il «finché» di questo capitolo è al contrario: si smette di girare <b>quando ti vedono</b>.',
    'Un punto solo funziona in una scena e non nelle altre: il giro deve toccare tutti e due i capi del loggiato.',
    'Chi fa l\'esca deve sapere dove finire: la guardia gli va dietro.',
  ],

  griglia: CORTILE, ambiente: 'cortile',
  celle: true,
  mostraNemici: true,

  nomi: {
    corda: 'la corda del pozzo',
    secchio: 'il secchio',
    coperchio: 'il coperchio del pozzo',
    sottoscala: 'il sottoscala',
    vedetta: 'il posto della guardia',
    via: 'via, adesso',
    guardia: 'la guardia del cortile',
    prigionieri: 'i prigionieri',
    cortile: 'la guardia del cortile',
  },
  posti: {
    vedetta: { x: 22, y: 6 },
    sottoscala: { x: 1, y: 12 },
  },
  porte: {
    coperchio: { x: 22, y: 7 },
  },
  oggetti: [
    { nome: 'corda', em: '🪢', x: 22, y: 8 },
    { nome: 'secchio', em: '🪣', x: 20, y: 8 },
  ],
  segnali: ['via'],

  unita: [
    /* Nilo è l'esca, ed è l'unico che sa girare in tondo e l'unico che
       sa parlare. Vede quello che lo vede: la sua vista e quella della
       guardia sono uguali in ogni scena, ed è per questo che «finché
       vedi la guardia» vuol dire davvero «finché ti vede» */
    { id: 'nilo', nome: 'Nilo', fazione: 'prigionieri', emoji: '🪶', chi: 'elfo',
      vista: 4, vita: 6, x: 2, y: 3,
      sa: ['vai', 'prendi', 'aspetta', 'aspettaDiVedere', 'suona', 'pattuglia'] },
    /* Marta apre il coperchio e tira su la corda, e non vede niente di
       quello che succede dall'altra parte del cortile: per questo la
       sua lista comincia con «quando arriva» */
    { id: 'marta', nome: 'Marta', fazione: 'prigionieri', emoji: '🪡', chi: 'ladra',
      vista: 4, vita: 3, x: 18, y: 4,
      sa: ['vai', 'prendi', 'apri', 'aspetta', 'aspettaDiVedere', 'quando'] },
    /* Cric non aspetta niente e non lo aspetta nessuno: va e prende.
       Non sa suonare, non sa ascoltare i segnali, non apre. È un topo */
    { id: 'cric', nome: 'Cric', fazione: 'prigionieri', emoji: '🐭', chi: 'gatto', manto: 'nero',
      vista: 3, vita: 3, x: 20, y: 12, sa: ['vai', 'prendi', 'aspetta'] },

    { id: 'guardia', nome: 'la guardia del cortile', fazione: 'cortile', emoji: '🗡️',
      chi: 'guardia', vista: 4, vita: 12, x: 22, y: 6 },
  ],
  fazioni: {
    prigionieri: { nome: 'i prigionieri', autore: 'giocatore' },
    cortile: { nome: 'la guardia del cortile', autore: 'livello',
               ordini: { guardia: AL_POZZO } },
  },

  /* le cose con un nome; le caselle nude si possono nominare tutte
     (`celle: true`), ed è quello che serve al giro di Nilo — un punto
     di ronda è una casella, non un posto che il livello ha battezzato.
     **`attacca` non c'è**: la guardia è in elenco perché va guardata,
     ma nessuno dei tre sa quel verbo. */
  complementi: ['corda', 'secchio', 'coperchio', 'sottoscala', 'vedetta',
                'via', 'guardia'],

  obiettivo: [ha('marta', 'corda'), ha('cric', 'secchio'), qui('nilo', 'sottoscala')],
  /* si perde in un istante solo, ed è quello: la mano sulla corda con
     la guardia ancora piantata davanti al pozzo */
  sconfitta: [ha('marta', 'corda'), qui('guardia', 'vedetta')],
  motivoSconfitta: 'Marta ha messo la mano sulla corda con la guardia ancora al pozzo.',

  /* ── LA SCENOGRAFIA ── roba che sta lì e basta */
  scenografia: [
    { che: 'botte', x: 4, y: 1 }, { che: 'sacco', x: 3, y: 1 },
    { che: 'ragnatela', x: 4, y: 2, strato: -1 },
    { che: 'pozzo', x: 21, y: 6 }, { che: 'argano', x: 23, y: 6 },
    { che: 'colonna', x: 19, y: 6 }, { che: 'colonna', x: 19, y: 10 },
    { che: 'torcia', x: 16, y: 4 }, { che: 'torcia', x: 6, y: 12 },
    { che: 'cassa', x: 12, y: 4 }, { che: 'barile', x: 15, y: 5 },
    { che: 'carrello', x: 9, y: 12 }, { che: 'binario', x: 10, y: 12, strato: -1 },
    { che: 'pozzanghera', x: 5, y: 8, strato: -1 }, { che: 'cespuglio', x: 3, y: 6 },
    { che: 'albero', x: 4, y: 10 }, { che: 'acqua', x: 24, y: 12, strato: -1 },
    { che: 'cartello', x: 7, y: 4 }, { che: 'catena', x: 24, y: 7 },
    { che: 'scala', x: 2, y: 11, strato: -1 }, { che: 'bandiera', x: 21, y: 4 },
  ],

  /* tre scene, e quello che cambia è **da che lato del pozzo sta la
     guardia** — cioè dove bisogna farsi vedere. Chi ha scelto a mano un
     punto buono ne indovina una; chi gira su e giù le vince tutte. Si
     spostano anche il sottoscala, il secchio e da dove partono i tre. */
  varianti: [
    { nome: 'la guardia dal lato del loggiato',
      posti: { vedetta: { x: 22, y: 6 }, sottoscala: { x: 1, y: 12 } },
      oggetti: { secchio: { x: 20, y: 8 } },
      unita: { nilo: { x: 2, y: 3, vista: 4 }, marta: { x: 18, y: 4 }, cric: { x: 20, y: 12 },
               guardia: { x: 22, y: 6, vista: 4 } } },
    { nome: 'la guardia si è messa dietro l\'argano',
      posti: { vedetta: { x: 24, y: 6 }, sottoscala: { x: 1, y: 4 } },
      oggetti: { secchio: { x: 19, y: 7 } },
      unita: { nilo: { x: 3, y: 2, vista: 6 }, marta: { x: 18, y: 5 }, cric: { x: 18, y: 12 },
               guardia: { x: 24, y: 6, vista: 6 } } },
    { nome: 'la guardia è passata di sotto: bisogna farsi vedere più in basso',
      posti: { vedetta: { x: 22, y: 10 }, sottoscala: { x: 1, y: 1 } },
      oggetti: { secchio: { x: 18, y: 8 } },
      unita: { nilo: { x: 4, y: 3, vista: 7 }, marta: { x: 18, y: 4 }, cric: { x: 19, y: 4 },
               guardia: { x: 22, y: 10, vista: 7 } } },
  ],

  soluzioni: [
    /* sette ordini, ed è il par. Tre a Nilo — il giro, la voce, la
       strada per tornare — tre a Marta dentro il «quando arriva», e uno
       a Cric, che non aspetta nessuno. Non se ne toglie nessuno: senza
       il giro la guardia non alza la testa, senza il «suona» Marta non
       parte, senza il sottoscala Nilo resta in mezzo al cortile, senza
       il coperchio la corda è sotto un legno, e senza il «quando arriva»
       Marta arriva al pozzo mentre la guardia è ancora lì. */
    { nome: 'gira finché ti vedono', piano: {
      nilo: [{ blocco: 'ripeti', corpo: [o('vai', '19,5'), o('vai', '19,11')],
               finche: vedi('guardia') },
             o('suona', 'via'), o('vai', 'sottoscala')],
      marta: [quando('via', o('apri', 'coperchio'), o('prendi', 'corda'))],
      cric: [o('prendi', 'secchio')],
    } },
    /* la stessa cosa col bivio scritto anche dalla nostra parte: Marta
       si muove **se è vero che la guardia non si vede**. Non serve — a
       quel punto la guardia è già dietro a Nilo dall'altra parte del
       cortile — ma è il verso giusto in cui leggere una condizione, e
       il ramo del falso resta vuoto: «e allora niente». Costa un ordine
       in più, ed è il prezzo di dirlo. */
    { nome: 'si parte se il pozzo è sgombro', piano: {
      nilo: [{ blocco: 'ripeti', corpo: [o('vai', '19,5'), o('vai', '19,11')],
               finche: vedi('guardia') },
             o('suona', 'via'), o('vai', 'sottoscala')],
      marta: [quando('via', o('apri', 'coperchio'),
                     bivio(nonVedi('guardia'), [o('prendi', 'corda')]))],
      cric: [o('prendi', 'secchio')],
    } },
    /* FRAGILE, ed è la ragione per cui il giro ha due capi: farsi
       vedere in **un punto solo**, scelto a mano. Nella prima scena
       quel punto è proprio sotto gli occhi della guardia e funziona
       benissimo; quando la guardia si sposta, Nilo resta lì impalato a
       farsi guardare da nessuno e la notte finisce senza corda. */
    { nome: 'farsi vedere in un punto solo', fragile: true, piano: {
      nilo: [{ blocco: 'ripeti', corpo: [o('vai', '19,5')],
               finche: vedi('guardia') },
             o('suona', 'via'), o('vai', 'sottoscala')],
      marta: [quando('via', o('apri', 'coperchio'), o('prendi', 'corda'))],
      cric: [o('prendi', 'secchio')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ── */
  verifiche: {
    /* LA PROVA DEL CAPITOLO: srotolato il «quando arriva», Marta parte
       insieme a Nilo e arriva al pozzo con la guardia ancora davanti */
    nonInFila: true,
    /* e nessuno dei tre fa il lavoro di un altro: Nilo non prende
       niente, Marta non si fa vedere, Cric non aspetta nessuno */
    serveOgnuno: true,
    /* prima ci si fa vedere, poi si parla: suonare prima è dire una
       cosa che non è ancora vera */
    ordineConta: [['pattuglia 19,5', 'suona via']],
    /* senza il segnale non parte niente, e senza il coperchio aperto la
       corda resta sotto un legno */
    senza: ['via', 'coperchio'],
  },
}

export default TORRE_4
