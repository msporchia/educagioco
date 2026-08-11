/* ═══════════════════════════════════════════════════════════════════
   🏮 LA LANTERNA DEI FONDI — capitolo 2: IL POZZO
   forma: consegna · concetto: prima quello (i prerequisiti)

   LA STORIA. Nel capitolo 1 Tilde ha tirato giù dallo scaffale la
   lanterna dei Fondi e le ha rimesso l'olio: adesso è accesa, e lei
   l'ha posata sul bordo del pozzo. Il pozzo è l'unica via per scendere
   ai Fondi, ma sopra la bocca c'è un coperchio di ferro chiuso, e la
   chiave sta in fondo alla nicchia degli attrezzi, dietro il cassone.
   Qui non ci scende Tilde: ci scende **Ras il ferravecchi**, perché le
   serrature sono roba sua. Si vince quando la lanterna è giù in fondo
   al pozzo, **addosso a Ras** — che è la differenza fra prendere una
   cosa e consegnarla.

   COSA INSEGNA. Che gli stessi ordini in un altro ordine sono un altro
   piano. La catena è di quattro anelli e non se ne salta nessuno: il
   cassone va **aperto prima** (è così grosso che tappa il cunicolo
   alto, e la chiave sta di là); la chiave va **presa prima**, se no il
   coperchio resta chiuso; e scendere **prima** di avere in mano la
   lanterna non serve a niente, perché la consegna la fa chi porta.
   Ogni inversione ha il suo guasto e si legge nel registro: «non
   riesco ad arrivare alla chiave: la strada è chiusa», «il coperchio
   del pozzo è chiuso a chiave, e la chiave del verricello non ce
   l'ho».

   E LA CATENA NON BASTA. Al cassone c'è appoggiato **Bruto**, che di
   mestiere guarda gli attrezzi: chi gli passa davanti lo prende, e Ras
   cade al primo colpo. Bruto però è fatto come tutte le guardie della
   miniera — c'è scritto nella sua scheda: **accorre** al grido. E un
   grido si può far partire apposta: la sentinella di ponente,
   **Sgraffa**, chiama aiuto appena vede qualcuno, e Orso è lì per
   farsi vedere. Il segnale che parte non è dei nostri: è loro, ed è un
   segnale come tutti gli altri — l'ascolto di Ras (`quando senti
   [aiuto]`) si arma su quello. Due cose nello stesso istante in due
   posti diversi: Orso si fa vedere a ponente **mentre** Ras apre il
   cassone a levante. Mandarli avanti in fila, in qualunque ordine,
   porta Ras sotto il naso di Bruto.

   E ATTENZIONE A DOVE FINISCE IL PERICOLO: Bruto non svanisce, si
   sposta. Dopo il grido la parte cattiva della miniera è **ponente**,
   e la scala vecchia — l'altra discesa, quella col portello — è
   proprio lì.

   PERCHÉ QUESTI NOMI. Il motore scrive da sé «aperto ⟨x⟩» e «⟨x⟩ è
   chiuso a chiave» per le porte, e «presa ⟨x⟩» per gli oggetti: le
   porte si chiamano al maschile (il cassone, il coperchio, il
   portello) e le cose al femminile (la chiave, la lanterna), se no
   l'italiano che legge il bambino viene storto.

   EREDITA → LASCIA. Eredita **la lanterna** del capitolo 1 (posata sul
   bordo del pozzo). Lascia la lanterna **giù nei Fondi, addosso a
   Ras** — da lì riparte il capitolo 3, quello delle falene — e lascia
   **il pozzo aperto**: il coperchio non si richiude più, ed è la porta
   di casa del capitolo 6.
   ═══════════════════════════════════════════════════════════════════ */

/* ── la mappa non si scrive a mano: si scava ──
   Il risultato resta una lista di righe di caratteri, cioè dati come
   tutto il resto del file. Qui sotto non c'è nient'altro che dati. */
function tela (w, h) {
  const g = []
  for (let y = 0; y < h; y++) g.push(new Array(w).fill('#'))
  return g
}
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
function pila (g, x0, y0, x1, y1) {   // il contrario: rimette la roccia
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '#'
}
const stampa = g => g.map(r => r.join(''))

/* 28 × 18: la superficie in alto, la roccia in mezzo, i Fondi in basso.
   Le uniche due cuciture fra sopra e sotto sono il coperchio del pozzo
   e il portello della scala vecchia.

   DUE GALLERIE, E NON SONO LA STESSA COSA. Quella alta (y3) passa per
   la nicchia degli attrezzi, ed è quella che il cassone tappa: finché
   è chiuso, di lì non passa nessuno, e chi ci arriva dopo se lo trova
   davanti Bruto. Quella bassa (y5) gira sotto e non si vede da y3 (fra
   le due c'è roccia piena): è la strada di Orso. */
const POZZO_MAPPA = (() => {
  const g = tela(28, 18)
  /* ── la superficie ── */
  cava(g, 1, 1, 8, 5)        // la sala del verricello, a ponente
  cava(g, 9, 3, 19, 3)       // la galleria alta: quella della nicchia
  cava(g, 9, 5, 19, 5)       // la galleria bassa: quella di Orso
  cava(g, 20, 1, 26, 5)      // la sala del pozzo, e il suo bordo
  cava(g, 13, 1, 15, 1)      // la nicchia degli attrezzi
  cava(g, 14, 2, 14, 2)      // la sua imboccatura
  pila(g, 3, 2, 4, 3)        // il pilastro del verricello
  pila(g, 22, 2, 23, 2)      // l'argano sopra la bocca del pozzo
  /* ── le due discese ── */
  cava(g, 3, 6, 3, 11)       // la scala vecchia, sotto il portello
  cava(g, 23, 6, 23, 11)     // la canna del pozzo, sotto il coperchio
  /* ── il mezzano: la vecchia galleria che unisce le due discese.
     Non è una terza strada per i Fondi — di sopra ci si arriva solo
     dal coperchio o dal portello — è spazio per girare. */
  cava(g, 3, 9, 23, 9)
  cava(g, 8, 8, 10, 10)      // due camere di scavo affacciate sul mezzano
  cava(g, 16, 8, 18, 10)
  /* ── i Fondi ── */
  cava(g, 1, 12, 26, 16)
  pila(g, 6, 13, 7, 14)
  pila(g, 11, 14, 12, 15)
  pila(g, 17, 13, 18, 14)
  pila(g, 21, 15, 22, 15)
  return stampa(g)
})()

/* le scorciatoie per scrivere gli ordini, le stesse di `data/generale.js` */
const o = (verbo, complemento, se) => se ? { verbo, complemento, se } : { verbo, complemento }
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })

/* IL PIANO DI BRUTO, e sono due righe che si leggono toccandolo: sta
   appoggiato al cassone e non guarda niente, finché non gli capita
   davanti qualcuno — e allora gli va addosso. Quello che NON è scritto
   qui sta nella sua scheda, perché non è un ordine di nessuno: è come
   è fatto lui. `accorre: aiuto` — al grido molla il cassone e va dove
   il grido è partito, poi riprende da dov'era. È l'unica falla del
   piano loro, e va aperta apposta.
   Sgraffa invece non ha ordini: sta al suo posto e `grida` una volta
   sola. Il suo grido è quello che sveglia Ras. */
const BRUTO = [
  { verbo: 'aspettaDiVedere', complemento: 'ladri' },
  o('attacca', 'ladri'),
]

export const POZZO = {
  id: 'pozzo',
  storia: 'fondi', capitolo: 2, emoji: '🪣',
  nome: 'Il pozzo',
  idea: 'Prima quello, se no il resto non funziona',
  forma: 'consegna', concetto: 'prerequisiti',

  dritta: "Gli stessi ordini in un altro ordine sono <b>un altro piano</b>: il cassone tappa il cunicolo e la chiave sta di là, il coperchio non si apre a mani vuote, e in fondo la lanterna ce la deve portare Ras. Ma la catena si può cominciare solo quando Bruto non è più al cassone: tocca la sua scheda e guarda cosa fa quando sente un grido.",
  racconto: "Il pozzo è l'unica via per i Fondi, e sopra la bocca c'è un coperchio di ferro chiuso a chiave. Tilde ha lasciato la lanterna accesa sul bordo: giù ci scende Ras, perché le serrature sono roba sua — ma <b>cade al primo colpo</b>, e al cassone degli attrezzi c'è appoggiato Bruto. La sentinella di ponente, Sgraffa, <b>chiama aiuto</b> appena vede qualcuno, e Bruto <b>accorre</b>: Orso serve a quello. Si vince quando <b>Ras è in fondo al pozzo con la lanterna addosso</b>. Attento: Bruto non sparisce, si sposta — dopo il grido è ponente il posto brutto, e la scala vecchia è lì.",
  aiuti: [
    'Non basta arrivarci: in fondo la lanterna ci deve arrivare insieme a Ras.',
    "Se Ras dice «la strada è chiusa» vuol dire che gli manca un ordine PRIMA di quello: alla chiave si arriva solo a cassone aperto.",
    'Ras non deve partire per primo: metti tutta la sua fila dentro un <b>quando senti [aiuto]</b>, e manda Orso a farsi vedere dalla sentinella.',
  ],

  griglia: POZZO_MAPPA,
  ambiente: 'miniera',
  celle: true,

  nomi: {
    cassone: 'il cassone degli attrezzi',
    chiave: 'la chiave del verricello',
    coperchio: 'il coperchio del pozzo',
    portello: 'il portello della scala vecchia',
    lanterna: 'la lanterna',
    fondo: 'il fondo del pozzo',
    verricello: 'il verricello di ponente',
    ladri: 'i ladri dei Fondi',
    miniera: 'la guardia della miniera',
  },
  posti: {
    fondo: { x: 14, y: 14 },
    /* dove Orso va a farsi vedere: davanti al verricello, in mezzo alla
       sala di ponente, che è il posto dove la sentinella non può non
       vederlo */
    verricello: { x: 1, y: 5 },
  },
  porte: {
    /* il cassone non è solo una cosa da aprire: è così grosso che tappa
       il cunicolo alto. Finché è chiuso, la galleria di y3 è due
       gallerie, e alla nicchia non ci arriva nessuno. */
    cassone:   { x: 14, y: 3 },                    // solo da aprire: nessuna chiave
    coperchio: { x: 23, y: 6, chiave: 'chiave' },
    portello:  { x: 3, y: 6, chiave: 'chiave' },
  },
  oggetti: [
    { nome: 'chiave', em: '🗝️', x: 14, y: 1 },              // dentro la nicchia
    { nome: 'lanterna', em: '🏮', x: 25, y: 1 },            // sul bordo del pozzo
  ],
  segnali: ['aiuto'],

  unita: [
    { id: 'ras', nome: 'Ras', fazione: 'ladri', emoji: '🥷', chi: 'ladra',
      vista: 4, vita: 1, x: 25, y: 4,
      sa: ['vai', 'prendi', 'apri', 'aspetta', 'quando'] },
    /* Orso non scassina e non porta niente: cammina, e si fa vedere.
       È tutto quello che serve, e nessun altro lo sa fare — Ras al
       posto suo si farebbe vedere e morire. */
    { id: 'orso', nome: 'Orso', fazione: 'ladri', emoji: '🐻', chi: 'orso',
      vista: 4, vita: 10, x: 26, y: 5, sa: ['vai'] },
    { id: 'bruto', nome: 'Bruto', fazione: 'miniera', emoji: '🪓', chi: 'capitano',
      vista: 2, vita: 12, x: 15, y: 3, accorre: 'aiuto' },
    { id: 'sgraffa', nome: 'Sgraffa', fazione: 'miniera', emoji: '👺', chi: 'goblin',
      vista: 2, vita: 8, x: 2, y: 3, grida: 'aiuto' },
  ],
  fazioni: {
    ladri: { nome: 'i nostri', autore: 'giocatore' },
    miniera: { nome: 'la guardia della miniera', autore: 'livello',
               ordini: { bruto: BRUTO } },
  },
  complementi: ['cassone', 'chiave', 'coperchio', 'portello', 'lanterna', 'fondo',
                'verricello', 'aiuto'],

  /* la CONSEGNA in due righe: la cosa è arrivata, e ce l'ha addosso chi
     doveva portarla. Togline una e il livello diventa un altro. */
  obiettivo: [
    { cond: 'qui', chi: 'ras', complemento: 'fondo' },
    { cond: 'hai', chi: 'ras', complemento: 'lanterna' },
  ],
  sconfitta: [{ cond: 'vivo', complemento: 'ras', non: true }],
  motivoSconfitta: 'Bruto ha trovato Ras al cassone: cade al primo colpo.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA ──
     Roba che sta lì e basta: **non è in gioco**. Non passa dal motore,
     non si prende, non si nomina in un ordine, non compare fra i
     bersagli — è solo disegno, perché una miniera senza attrezzi in
     giro non è una miniera. Spostarla non cambia una virgola di quello
     che succede. */
  scenografia: [
    { che: 'argano', x: 5, y: 1 }, { che: 'ruota', x: 6, y: 1 },
    { che: 'corda', x: 7, y: 2 }, { che: 'secchio', x: 8, y: 2 },
    { che: 'cassa', x: 2, y: 1 }, { che: 'sacco', x: 1, y: 2 },
    { che: 'piccone', x: 7, y: 4 }, { che: 'pozzanghera', x: 5, y: 4, strato: -1 },
    { che: 'cartello', x: 9, y: 3 }, { che: 'ragnatela', x: 19, y: 3, strato: -1 },
    { che: 'colonna', x: 11, y: 5 }, { che: 'fungo', x: 17, y: 5 },
    { che: 'argano', x: 24, y: 3 }, { che: 'catena', x: 24, y: 4 },
    { che: 'botte', x: 21, y: 1 }, { che: 'barile', x: 26, y: 1 },
    { che: 'scala', x: 3, y: 8, strato: -1 }, { che: 'scala', x: 3, y: 10, strato: -1 },
    { che: 'cristallo', x: 9, y: 8 }, { che: 'cristallo', x: 18, y: 10 },
    { che: 'stalagmite', x: 12, y: 9 }, { che: 'ossa', x: 10, y: 10 },
    { che: 'acqua', x: 20, y: 9, strato: -1 }, { che: 'fungo', x: 16, y: 9 },
    { che: 'stalagmite', x: 3, y: 13 }, { che: 'ossa', x: 24, y: 13 },
    { che: 'cristallo', x: 9, y: 16 }, { che: 'acqua', x: 15, y: 16, strato: -1 },
    { che: 'ragnatela', x: 20, y: 12, strato: -1 }, { che: 'fungo', x: 5, y: 16 },
  ],

  /* Tre scene, stesso ragionamento: si spostano la chiave dentro la
     nicchia, la lanterna sul bordo, il punto in cui si tocca il fondo,
     e da dove partono i nostri due. La catena resta quella, e Bruto
     resta al cassone. */
  varianti: [
    { nome: 'la chiave in mezzo alla nicchia',
      oggetti: { chiave: { x: 14, y: 1 }, lanterna: { x: 25, y: 1 } },
      posti: { fondo: { x: 14, y: 14 }, verricello: { x: 1, y: 5 } },
      unita: { ras: { x: 25, y: 4 }, orso: { x: 26, y: 5 } } },
    { nome: 'la chiave in fondo alla nicchia',
      oggetti: { chiave: { x: 15, y: 1 }, lanterna: { x: 21, y: 4 } },
      posti: { fondo: { x: 8, y: 16 }, verricello: { x: 1, y: 4 } },
      unita: { ras: { x: 26, y: 2 }, orso: { x: 25, y: 5 } } },
    { nome: 'la lanterna scivolata sul bordo',
      oggetti: { chiave: { x: 13, y: 1 }, lanterna: { x: 26, y: 3 } },
      posti: { fondo: { x: 20, y: 13 }, verricello: { x: 1, y: 1 } },
      unita: { ras: { x: 24, y: 5 }, orso: { x: 26, y: 4 } } },
  ],

  par: 7,
  soluzioni: [
    /* sette ordini, ed è il par: Orso cammina (uno), e la catena di Ras
       sta tutta dentro l'ascolto, perché prima del grido non si può
       cominciare. */
    { nome: 'Orso a ponente, e poi la catena', piano: {
      orso: [o('vai', 'verricello')],
      ras: [quando('aiuto',
        o('apri', 'cassone'), o('prendi', 'chiave'), o('apri', 'coperchio'),
        o('prendi', 'lanterna'), o('vai', 'fondo'))],
    } },
    /* FRAGILE: la stessa fila, ma l'ultimo ordine punta a una casella
       scritta a mano invece che al fondo del pozzo. Nella prima scena
       il numero ci azzecca; nelle altre due il fondo si è spostato di
       qualche passo e Ras si ferma sulla casella giusta del mondo
       sbagliato. Un oggetto lo segui ovunque vada, una casella no. */
    { nome: 'a casella', fragile: true, piano: {
      orso: [o('vai', 'verricello')],
      ras: [quando('aiuto',
        o('apri', 'cassone'), o('prendi', 'chiave'), o('apri', 'coperchio'),
        o('prendi', 'lanterna'), o('vai', '14,14'))],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto.
     Sono gli stessi anelli descritti là in testa: «ogni inversione ha
     il suo guasto», e adesso lo si prova invece di dirlo. */
  verifiche: {
    /* la catena non basta: se partono tutti e due insieme, Ras arriva
       al cassone mentre Bruto è ancora appoggiato lì */
    nonInFila: true,
    /* e non se ne salva nessuno da solo: Orso non apre niente, Ras da
       solo aspetta un grido che non arriva */
    serveOgnuno: true,
    ordineConta: [
      /* il cassone va aperto prima, se no alla chiave non ci si arriva */
      ['apri cassone', 'prendi chiave'],
      /* la chiave va presa prima, se no la discesa resta chiusa */
      ['prendi chiave', 'apri coperchio'],
      /* e scendere prima di avere la lanterna in mano non serve a
         niente: la consegna la fa chi porta */
      ['prendi lanterna', 'vai fondo'],
    ],
    /* una chiave sola apre tutte e due le discese: senza, non se ne
       apre nessuna */
    senza: ['chiave'],
  },
}

export default POZZO
