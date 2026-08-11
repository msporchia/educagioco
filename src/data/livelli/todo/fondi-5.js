/* ═══════════════════════════════════════════════════════════════════
   🏮 LA LANTERNA DEI FONDI — capitolo 5: 🥁 IL TAMBURO
   forma: sabotaggio · concetto: il ciclo (pattuglia … finché)

   LA STORIA. Nella sala grande gli orchi tengono un tamburo su un
   cavalletto. La regola è una sola e sta scritta nei loro ordini —
   toccali e si leggono: **chi vede qualcosa va al tamburo e lo
   suona**, e allora arrivano tutti. Finché quel tamburo è lì, di qui
   non si passa due volte, e il capitolo 6 non esiste.

   EREDITA il varco del capitolo 4 (Orso arriva alla sala dalla
   galleria vecchia, non dalla porta grande), la lanterna, e la regola
   delle falene: **si va dove c'è luce**. Le falene di due capitoli fa
   si sono infilate nella galleria vecchia, che è buia e stretta, ed è
   proprio la strada di Orso.
   LASCIA **il tamburo rotto**: da qui in avanti gli orchi non si
   chiamano più fra loro, e nel capitolo 6 una guardia che ti vede
   resta una guardia sola.

   COSA INSEGNA. Il giro di ronda, cioè il ciclo: `pattuglia [questi
   punti] finché [succede questo]`. Non è un ornamento — è l'unico modo
   di dire una cosa che qui serve davvero: «continua a fare il giro
   **finché non ti vedono**». Bea non sa quando la guardia passerà di
   lì: non lo sa nessuno, perché la guardia gira anche lei. L'uscita
   del ciclo non è un numero di giri, è **un fatto**.

   E LA REAZIONE È L'ARMA. Le tre guardie non sono fatte uguali, e sta
   scritto nelle loro schede: **Cipiglio grida** — è quello mandato
   fuori, in fondo a levante, lontano dal tamburo — mentre **Zanna e
   Muso accorrono**, cioè mollano il posto e vanno dov'è partito il
   grido. Chi sta vicino al tamburo non chiama nessuno: il tamburo è la
   sua voce, e per suonarlo deve arrivarci.
   Da quelle tre righe esce tutto il livello. Se Bea si fa vedere da
   Cipiglio, il grido parte da fuori e la sala si svuota — Zanna
   compresa, e Zanna è quella appoggiata al tamburo. Farsi vedere non è
   l'errore: è la mossa. Ma costa, e va pagata al momento giusto: chi
   ha gridato smette il giro e **va dritto al tamburo**, e da quel
   momento è una corsa fra lui che torna e Orso che arriva.

   PERCHÉ NON SI VINCE IN FILA. Tre file, e due partono da un fatto che
   non hanno visto:
     · Bea gira finché la vedono, e appena la vedono lo **suona ai
       suoi** — è l'unica che sa che il grido è partito;
     · Orso non vede niente da dentro la galleria vecchia: la sua fila
       comincia con **quando senti [al mio segnale]**. Se parte prima,
       Muso lo trova al cancello, oppure Zanna è ancora appoggiata al
       tamburo, e in tutti e due i casi il tamburo suona;
     · Tilde parte subito e non aspetta niente, ma **deve passare per
       prima**: le falene si svegliano su chi vedono per primo, e
       decidono lì — se in quell'attimo hanno la luce davanti non
       toccano nessuno, se no si buttano addosso a chi c'è. Tilde le
       tira in fondo alla nicchia e ce le lascia. Se passa Orso per
       primo, la luce è ancora indietro e se la prendono con lui.
   Tre cose, tre momenti diversi, e due dei tre momenti li decide
   qualcun altro.

   LA MAPPA. 30×18, e le distanze sono la metà del disegno.
   A ponente il **cunicolo** della galleria vecchia, che finisce in uno
   slargo dove dormono le falene; dallo slargo scende la **nicchia**,
   vicolo cieco, ed è lì che va posata la luce. In fondo allo slargo il
   **cancello** degli orchi: l'unica porta fra il cunicolo e la sala.
   In mezzo la **sala grande**, casa loro, col tamburo dalla parte di
   ponente — vicino al cancello, che è l'unica ragione per cui Orso può
   vincere la corsa — e Zanna appoggiata lì accanto.
   A levante un corridoio (il giro di Cipiglio) e la **galleria di
   levante**, nord-sud: è il giro di Bea, e in fondo a settentrione c'è
   il rifugio. La galleria è lontana dal tamburo apposta: da laggiù
   Cipiglio ci mette una quindicina di battiti a tornare, e quei
   battiti sono tutto il livello.
   ═══════════════════════════════════════════════════════════════════ */

/* ── le scorciatoie per scrivere i dati (le stesse di data/generale.js,
      ricopiate qui perché questo file deve stare in piedi da solo) ── */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const giro = (punti, finche) =>
  ({ blocco: 'ripeti', corpo: punti.map(p => ({ verbo: 'vai', complemento: p })), finche })
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })
const vedi = complemento => ({ cond: 'vedi', complemento })
const nonVedi = complemento => ({ cond: 'vedi', complemento, non: true })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })

/* una mappa grande non si scrive a mano: si scava, e resta una lista
   di righe come tutte le altre */
function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const SALA_GRANDE = (() => {
  const g = tela(30, 18)
  /* ── ponente: la galleria vecchia, la strada di Orso ── */
  cava(g, 1, 8, 7, 8)        // il cunicolo
  cava(g, 6, 6, 7, 9)        // lo slargo davanti al cancello: le falene
  cava(g, 6, 10, 6, 13)      // la nicchia: vicolo cieco che scende dallo slargo
  cava(g, 8, 8, 8, 8)        // la casella del cancello
  /* ── la sala grande ── */
  cava(g, 9, 3, 21, 13)
  /* ── levante: il corridoio e la galleria nord-sud ── */
  cava(g, 22, 8, 26, 8)
  cava(g, 27, 3, 27, 14)
  return stampa(g)
})()

/* ── I PIANI DEGLI ORCHI, e si leggono toccandoli (`pianoVisibile`) ──
   Sono tre file quasi uguali, ed è voluto: la regola della sala è una
   sola, e chi la legge la capisce in dieci secondi.
       gira / stai di vedetta … finché vedi un ladro
       vai al tamburo
       suonalo
   Quello che NON è scritto qui sta nelle loro schede, perché non è un
   ordine di nessuno — è come sono fatti, e **non sono fatti uguali**:
   Cipiglio ha `grida: aiuto` (è il solo che chiama, ed è il solo
   mandato fuori dalla sala), Zanna e Muso hanno `accorre: aiuto`
   (mollano il posto, vanno dov'è partito il grido e poi riprendono da
   dov'erano). Chi sta al tamburo non grida: per chiamare deve
   suonarlo, e per suonarlo deve arrivarci. È l'unica falla della sala,
   e il piano dei nostri è tutto lì dentro. */
const AL_TAMBURO = [o('vai', 'tamburo'), o('suona', 'nemico')]
const ZANNA = [{ verbo: 'aspettaDiVedere', complemento: 'fondi' }, ...AL_TAMBURO]
const CIPIGLIO = [giro(['22,8', '26,8'], vedi('fondi')), ...AL_TAMBURO]
const MUSO = [giro(['10,4', '10,12'], vedi('fondi')), ...AL_TAMBURO]

/* ── IL PIANO DELLE FALENE, lo stesso del capitolo 3 ──
   Dormono, e appena vedono qualcuno decidono **una volta sola**: se in
   quell'attimo non vedono la luce si buttano addosso a chi hanno
   davanti, se la vedono no. Poi vanno alla lanterna, che qui non è un
   oggetto per terra ma una donna che cammina: `vai [Tilde]` due volte
   — la raggiungono mentre va, e poi le rivanno dietro fin dove si
   ferma. Chi legge il piano vede la regola: la luce se le porta dove
   vuole. */
const SCIAME = [
  { verbo: 'aspettaDiVedere', complemento: 'fondi' },
  bivio(nonVedi('tilde'), [o('attacca', 'fondi')]),
  o('vai', 'tilde'),
  o('vai', 'tilde'),
]

export const FONDI_5 = {
  id: 'fondi-tamburo', nome: 'Il tamburo',
  idea: 'Continua a girare finché ti vedono',
  storia: 'fondi', capitolo: 5, emoji: '🥁',
  forma: 'sabotaggio', concetto: 'ciclo',
  eredita: ['lanterna', 'varco', 'falene'], lascia: ['tamburo'],
  pianoVisibile: true,

  dritta: "Tocca le guardie e leggile: fanno tutte e tre la stessa cosa — <b>chi vede qualcosa va al tamburo e lo suona</b> — ma solo <b>Cipiglio grida</b>, e gli altri due <b>accorrono</b> dove ha gridato. Bea non sa quando Cipiglio passerà di lì: nessuno lo sa. Perciò non conta i passi, <b>gira</b> — <b>pattuglia … finché vedi le guardie</b> — e appena la vedono lo dice ai suoi.",
  racconto: "Nella sala grande gli orchi tengono un tamburo: chi vede qualcosa lo suona, e allora arrivano tutti. Si vince quando <b>Orso ha il tamburo</b> e se l'è riportato <b>nella galleria vecchia</b>, e Bea è al sicuro nel rifugio. Si perde nel momento in cui una guardia arriva a suonare il tamburo. Bea si fa vedere in fondo a levante: il grido parte da laggiù e la sala si svuota, <b>Zanna compresa</b>. Tilde intanto porta la lanterna giù nella nicchia — nel cunicolo ci sono le falene, e chi passa per primo si prende quello che decidono.",
  aiuti: [
    'Il giro vuole un’uscita: <b>pattuglia … finché</b>. Senza, Bea gira per sempre e gli ordini dopo non partono mai.',
    'Il grido parte da <b>dove sta chi ha visto</b>, e chi ha gridato poi corre al tamburo: più lontano dal tamburo si fa vedere Bea, più tempo ha Orso.',
    'Orso non vede la sala da dentro la galleria: la sua fila comincia con <b>quando senti</b>. E prima di lui deve passare la luce, se no le falene si svegliano su di lui.',
  ],

  griglia: SALA_GRANDE, ambiente: 'grotta',
  /* le caselle si nominano: senza, un giro di ronda non si può nemmeno
     comporre — i punti di una pattuglia sono caselle, non posti */
  celle: true,

  nomi: {
    tamburo: 'il tamburo', cancello: 'il cancello degli orchi',
    nicchia: 'la nicchia', varco: 'la galleria vecchia', rifugio: 'il rifugio',
    fondi: 'i ladri dei Fondi', orchi: 'le guardie della sala', falene: 'le falene',
  },
  posti: {
    varco: { x: 1, y: 8 },       // dove Orso deve riportare il tamburo
    nicchia: { x: 6, y: 13 },    // dove va posata la luce
    rifugio: { x: 27, y: 3 },    // dove Bea si toglie di mezzo
  },
  porte: {
    /* l'unica cucitura fra il cunicolo e la sala. Sta chiuso, non a
       chiave: è una sbarra, e Orso le sbarre le apre. Serve anche a
       tenere separate le falene dalle guardie finché non tocca. */
    cancello: { x: 8, y: 8 },
  },
  oggetti: [
    /* il tamburo non ha un pittore suo: il più vicino è la campana —
       una cosa che sta su un cavalletto e serve a chiamare gli altri, e
       almeno non si confonde con nient'altro in scena. Il giorno che
       arriva un pittore `tamburo` si cambia questa parola e basta. */
    { nome: 'tamburo', em: '🥁', pittore: 'campana', x: 11, y: 8 },
  ],
  segnali: ['ora', 'aiuto', 'nemico'],

  unita: [
    /* Bea corre e non regge un colpo: è per questo che il giro è suo.
       Farsi vedere e sparire è tutto il suo mestiere. */
    { id: 'bea', nome: 'Bea', fazione: 'fondi', emoji: '🔔', chi: 'elfo',
      vista: 3, vita: 1, x: 27, y: 3,
      sa: ['vai', 'pattuglia', 'suona', 'aspetta', 'quando'] },
    /* Tilde porta la luce e non mena. Qui la luce non serve a vedere:
       serve a portarsi dietro le falene, e a posarle dove non danno
       fastidio a nessuno. */
    { id: 'tilde', nome: 'Tilde', fazione: 'fondi', emoji: '👵', chi: 'mago',
      vista: 4, vita: 3, x: 2, y: 8, sa: ['vai', 'suona', 'aspetta', 'quando'] },
    /* Orso rompe: il cancello lo apre lui, il tamburo lo strappa lui.
       Non vede niente da dentro la galleria, e infatti non decide
       niente: aspetta che glielo dicano. */
    { id: 'orso', nome: 'Orso', fazione: 'fondi', emoji: '🐻', chi: 'orso',
      vista: 3, vita: 10, x: 1, y: 8,
      sa: ['vai', 'prendi', 'apri', 'aspetta', 'quando'] },

    /* ── le guardie ── */
    /* Zanna sta appoggiata al tamburo e non chiama nessuno: la sua voce
       è il tamburo, e ce l'ha a due passi. L'unico modo di levarla di
       lì è che gridi qualcun altro. */
    { id: 'zanna', nome: 'Zanna', fazione: 'orchi', emoji: '👹', chi: 'orco',
      vista: 3, vita: 8, x: 12, y: 8, accorre: 'aiuto' },
    /* Muso gira dentro la sala, davanti al cancello: è lui che trova
       Orso se Orso parte prima del tempo. Anche lui accorre. */
    { id: 'muso', nome: 'Muso', fazione: 'orchi', emoji: '🪓', chi: 'capitano',
      vista: 3, vita: 8, x: 10, y: 12, accorre: 'aiuto' },
    /* Cipiglio è quello mandato fuori, e **l'unico che grida**: sta a
       levante, lontano dal tamburo, ed è per questo che farsi vedere da
       lui conviene — il grido parte da laggiù, e da laggiù lui deve
       tornare indietro per suonare. */
    { id: 'cipiglio', nome: 'Cipiglio', fazione: 'orchi', emoji: '👺', chi: 'guardia',
      vista: 3, vita: 8, x: 22, y: 8, grida: 'aiuto' },

    /* ── le falene, quelle del capitolo 3, finite nel cunicolo ── */
    { id: 'falena1', nome: 'una falena', fazione: 'falene', emoji: '🦋', chi: 'goblin',
      vista: 3, vita: 2, x: 6, y: 7 },
    { id: 'falena2', nome: 'una falena', fazione: 'falene', emoji: '🦋', chi: 'goblin',
      vista: 3, vita: 2, x: 7, y: 7 },
    { id: 'falena3', nome: 'una falena', fazione: 'falene', emoji: '🦋', chi: 'goblin',
      vista: 3, vita: 2, x: 6, y: 9 },
  ],
  fazioni: {
    fondi: { nome: 'i ladri dei Fondi', autore: 'giocatore' },
    orchi: { nome: 'le guardie della sala', autore: 'livello',
             ordini: { zanna: ZANNA, muso: MUSO, cipiglio: CIPIGLIO } },
    falene: { nome: 'le falene bianche', autore: 'livello',
              ordini: { falena1: SCIAME, falena2: SCIAME, falena3: SCIAME } },
  },

  /* `attacca` non entra in cassetta perché non lo sa fare nessuno dei
     nostri: qui non si mena a nessuno, si decide chi guarda dove. Le
     guardie si nominano lo stesso — servono a Bea per l'uscita del suo
     giro, e vederle è tutto quello che si può fare con loro. */
  complementi: ['tamburo', 'cancello', 'nicchia', 'varco', 'rifugio',
                'orchi', 'ora', 'momento'],
  condizioni: [
    vedi('orchi'), nonVedi('orchi'),
    { cond: 'segnale', complemento: 'ora' },
    { cond: 'segnale', complemento: 'ora', non: true },
    { cond: 'hai', complemento: 'tamburo' },
    { cond: 'hai', complemento: 'tamburo', non: true },
    { cond: 'aperta', complemento: 'cancello' },
    { cond: 'aperta', complemento: 'cancello', non: true },
  ],

  /* il sabotaggio in tre righe: la cosa non funziona più perché non è
     più lì. Non basta metterci le mani sopra — va portata via dalla
     sala, se no la riprendono e la rimettono sul cavalletto — e
     l'obiettivo dice anche «nessuno dei nostri preso», che qui vuol
     dire: Bea è tornata nel rifugio, non è rimasta in mezzo. */
  obiettivo: [ha('orso', 'tamburo'), qui('orso', 'varco'), qui('bea', 'rifugio')],
  /* e si perde senza che nessuno tocchi nessuno: basta che una guardia
     arrivi al tamburo e lo suoni */
  sconfitta: [{ cond: 'segnale', complemento: 'nemico' }],
  motivoSconfitta: 'Una guardia è arrivata al tamburo e l\'ha suonato: adesso arrivano tutti.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA ──
     Roba che sta lì e basta: **non è in gioco**. Non passa dal motore —
     `creaMondo` non la guarda nemmeno — quindi non si prende, non si
     nomina in un ordine, non compare fra i bersagli. Serve a far vedere
     che la sala grande è casa loro e che il cunicolo non lo batte
     nessuno. Spostarla non cambia una virgola. */
  scenografia: [
    /* il cunicolo e la nicchia */
    { che: 'ragnatela', x: 3, y: 8, strato: -1 }, { che: 'fungo', x: 6, y: 10 },
    { che: 'stalagmite', x: 4, y: 8 }, { che: 'cristallo', x: 7, y: 6 },
    /* la sala grande: gli orchi ci vivono */
    { che: 'falo', x: 15, y: 5 }, { che: 'tenda', x: 13, y: 4 },
    { che: 'tenda', x: 17, y: 4 }, { che: 'sacco', x: 12, y: 3 },
    { che: 'botte', x: 19, y: 3 }, { che: 'barile', x: 20, y: 4 },
    { che: 'colonna', x: 14, y: 10 }, { che: 'colonna', x: 18, y: 10 },
    { che: 'ossa', x: 16, y: 12 }, { che: 'cassa', x: 9, y: 13 },
    { che: 'pozzanghera', x: 20, y: 12, strato: -1 },
    { che: 'bandiera', x: 21, y: 6 }, { che: 'braciere', x: 9, y: 5 },
    /* levante: il corridoio e la galleria */
    { che: 'cartello', x: 23, y: 8 }, { che: 'ragnatela', x: 27, y: 7, strato: -1 },
    { che: 'acqua', x: 27, y: 6, strato: -1 }, { che: 'stalagmite', x: 27, y: 10 },
    { che: 'cristallo', x: 27, y: 14 }, { che: 'ossa', x: 27, y: 11 },
  ],

  /* ── LE TRE SCENE ──
     Il ragionamento è sempre quello, ma **quando** Cipiglio incrocia
     Bea non è mai lo stesso: si spostano lui e lei sui rispettivi giri,
     e con loro il momento del grido. Chi ha contato i battiti una volta
     scopre che il conto non torna più.
       1. Cipiglio è all'imbocco del corridoio e Bea comincia da
          settentrione: si incrociano quasi subito, e allora anche chi è
          partito senza aspettare fa in tempo;
       2. Cipiglio è in fondo al corridoio, dalla parte sbagliata: il
          grido tarda parecchio, e chi non ha aspettato trova Zanna
          ancora appoggiata al tamburo;
       3. i due giri partono sfasati e il tamburo è a settentrione, più
          lontano dal cancello: la corsa si stringe da tutte e due le
          parti. */
  varianti: [
    { nome: 'Cipiglio è all\'imbocco del corridoio',
      oggetti: { tamburo: { x: 11, y: 8 } },
      posti: { varco: { x: 1, y: 8 }, nicchia: { x: 6, y: 13 }, rifugio: { x: 27, y: 3 } },
      unita: { bea: { x: 27, y: 3 }, tilde: { x: 2, y: 8 }, orso: { x: 1, y: 8 },
               zanna: { x: 12, y: 8 }, muso: { x: 10, y: 12 }, cipiglio: { x: 22, y: 8 },
               falena1: { x: 6, y: 7 }, falena2: { x: 7, y: 7 }, falena3: { x: 6, y: 9 } } },
    { nome: 'Cipiglio è in fondo, dalla parte sbagliata',
      oggetti: { tamburo: { x: 11, y: 9 } },
      posti: { varco: { x: 1, y: 8 }, nicchia: { x: 6, y: 12 }, rifugio: { x: 27, y: 3 } },
      unita: { bea: { x: 27, y: 4 }, tilde: { x: 2, y: 8 }, orso: { x: 1, y: 8 },
               zanna: { x: 12, y: 9 }, muso: { x: 10, y: 4 }, cipiglio: { x: 26, y: 8 },
               falena1: { x: 7, y: 7 }, falena2: { x: 6, y: 8 }, falena3: { x: 7, y: 9 } } },
    { nome: 'il tamburo a settentrione, e i giri sfasati',
      oggetti: { tamburo: { x: 10, y: 4 } },
      posti: { varco: { x: 1, y: 8 }, nicchia: { x: 6, y: 11 }, rifugio: { x: 27, y: 4 } },
      unita: { bea: { x: 27, y: 5 }, tilde: { x: 2, y: 8 }, orso: { x: 1, y: 8 },
               zanna: { x: 10, y: 5 }, muso: { x: 10, y: 10 }, cipiglio: { x: 25, y: 8 },
               falena1: { x: 6, y: 6 }, falena2: { x: 7, y: 8 }, falena3: { x: 6, y: 9 } } },
  ],

  par: 8,
  soluzioni: [
    /* OTTO ORDINI, ED È IL PAR. Tre file, e si leggono come tre
       mestieri: Bea gira finché la vedono e lo dice; Tilde porta la
       luce di sotto e ci resta; Orso comincia da quando glielo dicono,
       apre, prende e se ne torna di là. */
    { nome: 'gira finché ti vedono', piano: {
      bea:   [giro(['27,5', '27,13'], vedi('orchi')), o('suona', 'ora'), o('vai', 'rifugio')],
      tilde: [o('vai', 'nicchia')],
      orso:  [quando('ora', o('apri', 'cancello'), o('prendi', 'tamburo'), o('vai', 'varco'))],
    } },
    /* FRAGILE: Orso non aspetta nessuno. È la tentazione giusta — la
       fila più corta di tutte, e uno pensa «tanto quando arrivo la sala
       è vuota». Nella prima scena Cipiglio e Bea si incrociano quasi
       subito: quando Orso sbuca dal cancello, Zanna è partita da un
       pezzo. Nelle altre due il grido tarda, e Orso arriva al tamburo
       con Zanna ancora appoggiata lì: fine. */
    { nome: 'Orso non aspetta', fragile: true, piano: {
      bea:   [giro(['27,5', '27,13'], vedi('orchi')), o('suona', 'ora'), o('vai', 'rifugio')],
      tilde: [o('vai', 'nicchia')],
      orso:  [o('apri', 'cancello'), o('prendi', 'tamburo'), o('vai', 'varco')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto. */
  verifiche: {
    /* srotolato l'ascolto, Orso parte insieme agli altri due: o lo
       trova Muso al cancello, o trova Zanna al tamburo */
    nonInFila: true,
    /* tre mestieri, e nessuno ne sa fare due: chi gira non apre, chi
       porta la luce non prende, chi prende non vede niente */
    serveOgnuno: true,
    ordineConta: [
      /* il cancello prima: al tamburo non ci si arriva attraverso una
         sbarra chiusa */
      ['apri cancello', 'prendi tamburo'],
      /* e il tamburo prima: tornare a mani vuote non è un sabotaggio */
      ['prendi tamburo', 'vai varco'],
    ],
    /* senza la luce nella nicchia, le falene si svegliano su Orso */
    senza: ['tilde'],
  },
}

export default FONDI_5
