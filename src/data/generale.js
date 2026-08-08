/* ═══════════════════════════════════════════════════════════════════
   I LIVELLI DEL GENERALE — dati puri, niente logica

   Un livello è una coreografia da far funzionare. Il giocatore firma
   gli ordini di una fazione, il livello quelli dell'altra: stesso
   linguaggio (`motore/generale.js`), autore diverso.

   ── com'è fatto un livello ────────────────────────────────────────
     id, nome, idea          come si chiama e cosa insegna
     dritta, racconto, aiuti le parole: la riga sotto la scena, la
                             spiegazione lunga del 💡, e i tre
                             suggerimenti a scalare (il primo è gratis)
     griglia                 righe di caratteri: '#' muro, il resto
                             pavimento
     posti, porte, oggetti,
     segnali, nomi           le cose, ognuna col suo tipo (è il tipo che
                             decide quali verbi la accettano)
     celle: true             apre anche le CASELLE come complementi: sono
                             i punti fra cui si fa un giro di ronda, e si
                             toccano sulla mappa
     unita, fazioni          chi c'è e chi lo comanda
     complementi             QUALI cose si possono nominare: è la
                             manopola della difficoltà, perché da lì
                             discende anche quali verbi compaiono in
                             cassetta (un verbo senza complementi non si
                             offre). Toglierla vuol dire dare tutto.
     obiettivo, sconfitta    quando è vinta e quando è persa
     varianti                TRE, e sono la lezione del gioco: il piano
                             si firma prima di sapere quale tocca, e un
                             piano che funziona su una mappa sola è
                             fortuna. Ognuna è una toppa sulle
                             posizioni, non un livello nuovo.
     par, soluzioni          la promessa («si può fare con questi») e la
                             prova che la promessa è mantenuta: il test
                             GIOCA le soluzioni su tutte e tre le
                             varianti, e se una non vince il livello è
                             rotto. Il par conta anche gli ordini dentro
                             un `quando`.

   Una soluzione `fragile` è quella che il gioco vuole far CADERE: una
   fila di mete esplicite che regge in un mondo e non negli altri. Se
   vincesse sempre non dimostrerebbe niente, se non vincesse mai non
   sarebbe una tentazione.

   CATALOGO DEI BUG DELIBERATI (dal 7 in poi il piano nemico ha una
   falla, e il livello si vince trovandola):
     7  la reazione prevedibile  — chi accorre lascia il posto, e ci
                                   mette un pezzo ad arrivare
     8  il caso non coperto      — la ronda lascia un lato libero
     9  l'ordine mancante        — apre il portone senza esserci andato
     10 il segnale morto         — il capo aspetta un nome che nessuno dice
     11 l'attesa che non si sblocca — e sei tu a poterla tenere chiusa
     12 il doppio incarico       — due orchi sullo stesso posto
     14 non è un bug: è il RAMO  — il seguito dipende da cosa trovi
   ═══════════════════════════════════════════════════════════════════ */

/* le due stanze che tornano più volte */
const CORTI = [
  '#############',
  '#.....#.....#',
  '#.....#.....#',
  '#...........#',
  '#.....#.....#',
  '#.....#.....#',
  '#############',
]
const MURA = [
  '#############',
  '#...........#',
  '#.#########.#',
  '#.#.......#.#',
  '#.#.......#.#',
  '#.#.......#.#',
  '#.####.####.#',
  '#...........#',
  '#############',
]
/* una mappa grande non si scrive a mano: si scava. Il risultato resta
   una lista di righe, cioè dati come le altre due qui sopra. */
function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const FORTEZZA = (() => {
  const g = tela(34, 22)
  cava(g, 1, 1, 32, 1); cava(g, 1, 20, 32, 20)          // i corridoi lunghi
  cava(g, 1, 1, 1, 20); cava(g, 32, 1, 32, 20)          // le due coste
  cava(g, 1, 10, 32, 10)                                // la traversa
  cava(g, 3, 3, 8, 8); cava(g, 5, 1, 5, 3)              // la stanza della chiave
  cava(g, 14, 13, 20, 18); cava(g, 17, 10, 17, 13)      // il maschio e il suo collo
  return stampa(g)
})()
const DUE_CORTI = (() => {
  const g = tela(13, 13)
  cava(g, 1, 1, 5, 11)                                  // la corte di ponente
  cava(g, 6, 2, 6, 2); cava(g, 6, 10, 6, 10)            // le due porte
  cava(g, 7, 2, 11, 2); cava(g, 7, 10, 11, 10)          // i due camminamenti
  cava(g, 11, 2, 11, 10)                                // la costa che li unisce
  return stampa(g)
})()

/* le scorciatoie per scrivere gli ordini: un ordine è verbo +
   complemento, e non porta condizioni addosso */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
/* un BLOCCO CONDIZIONE: la domanda, e le due liste che ne partono. Non è
   un ordine con un'aggiunta — è una struttura sua, e ne parte sempre
   esattamente un ramo. Un ramo vuoto vuol dire «in quel caso niente». */
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })
/* un giro di ronda: i punti in fila (il primo è anche il complemento,
   così la forma verbo+complemento resta una sola) e l'uscita */
const giro = (punti, finche) => ({ verbo: 'pattuglia', complemento: punti[0], punti, finche })
const vedi = complemento => ({ cond: 'vedi', complemento })
const nonVedi = complemento => ({ cond: 'vedi', complemento, non: true })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const caduto = complemento => ({ cond: 'vivo', complemento, non: true })

export const LIVELLI = [

/* 1 ─ un ordine solo, e la strada la trova lui. Serve a far vedere la
      forma: verbo + cosa, poi ▶. In elenco c'è anche un posto
      sbagliato, così scegliere è già una scelta. */
{
  id: 'primo', nome: 'Il primo ordine', idea: 'Un verbo, una cosa, e via',
  dritta: 'Ogni ordine è <b>un verbo</b> e <b>una cosa</b>. Digli dove andare e premi ▶: la strada fra i muri se la trova da solo.',
  racconto: "L'eroe è nella corte di ponente, il tesoro è dall'altra parte del muro. Si vince quando l'eroe ci arriva sopra. Non devi spiegargli come girare intorno al muro — camminare lo sa fare da solo. Devi dirgli <b>dove</b> vuoi che vada.",
  aiuti: ['Un ordine è fatto di due cose: un verbo, e la cosa su cui vale.',
          'Tocca il verbo, poi tocca sulla mappa la cosa su cui vale.',
          'Guarda il verbo che hai in cassetta: chiede una meta, e la meta la scegli tu.'],
  griglia: CORTI, ambiente: 'cortile', prove: 1,
  nomi: { tesoro: 'il tesoro' },
  posti: { tesoro: { x: 10, y: 5 } },
  unita: [{ id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'cavaliere', vista: 4, x: 2, y: 5 }],
  fazioni: { umani: { nome: 'i nostri', autore: 'giocatore' } },
  complementi: ['tesoro'],
  obiettivo: [qui('eroe', 'tesoro')],
  varianti: [
    { nome: 'il tesoro in fondo', posti: { tesoro: { x: 10, y: 5 } } },
    { nome: 'il tesoro in alto', posti: { tesoro: { x: 10, y: 1 } } },
    { nome: 'il tesoro sul passaggio', posti: { tesoro: { x: 11, y: 3 } } },
  ],
  par: 1,
  soluzioni: [{ nome: 'dritto al tesoro', piano: { eroe: [o('vai', 'tesoro')] } }],
},

/* 2 ─ la sequenza per intero. Nasce da sé dalla precondizione: un'azione
      funziona solo se hai la cosa a portata, quindi prima ci vai. */
{
  id: 'chiave', nome: 'La chiave e il portone', idea: 'Prima la chiave, poi il portone',
  dritta: "Alla cosa ci va lui: <b>prendi</b> e <b>apri</b> camminano da soli. Ma il portone <b>non si apre a mani vuote</b>.",
  racconto: "Il portone è chiuso a chiave e il tesoro è dietro. Si vince quando l'eroe arriva al tesoro. Alla chiave e al portone ci va da solo — quello che non può fare è aprire <b>senza avere la chiave</b>: qui non conta dove sei, conta cosa hai in mano.",
  aiuti: ['Un ordine può fallire anche stando nel posto giusto: al portone serve la chiave.',
          'Se l\'eroe dice «non ce l\'ho», vuol dire che gli manca un ordine PRIMA di quello.',
          'Due ordini nella fila giusta: prima quello che mette la chiave nello zaino.'],
  griglia: CORTI, ambiente: 'cortile', prove: 1,
  nomi: { tesoro: 'il tesoro', portone: 'il portone', chiave: 'la chiave' },
  posti: { tesoro: { x: 10, y: 3 } },
  porte: { portone: { x: 6, y: 3, chiave: 'chiave' } },
  oggetti: [{ nome: 'chiave', x: 2, y: 1 }],
  unita: [{ id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'cavaliere', vista: 4, x: 2, y: 3 }],
  fazioni: { umani: { nome: 'i nostri', autore: 'giocatore' } },
  complementi: ['chiave', 'portone', 'tesoro'],
  obiettivo: [qui('eroe', 'tesoro')],
  varianti: [
    { nome: 'la chiave in alto', oggetti: { chiave: { x: 2, y: 1 } }, posti: { tesoro: { x: 10, y: 3 } } },
    { nome: 'la chiave in basso', oggetti: { chiave: { x: 1, y: 5 } }, posti: { tesoro: { x: 11, y: 1 } } },
    { nome: "la chiave sull'angolo", oggetti: { chiave: { x: 4, y: 5 } }, posti: { tesoro: { x: 11, y: 5 } } },
  ],
  par: 3,
  soluzioni: [{ nome: 'chiave, portone, tesoro', piano: { eroe: [
    o('prendi', 'chiave'), o('apri', 'portone'), o('vai', 'tesoro'),
  ] } }],
},

/* 3 ─ INVERTITO: qui i tuoi sono gli orchi. `vai [qualcuno]` non è
      onnisciente, ci vai solo se l'hai visto: ecco perché serve la
      ronda. L'intruso sta fermo — il suo piano aspetta un segnale che
      nessuno manderà, ed è il primo bug che il bambino legge. */
{
  id: 'ronda', nome: 'Il giro delle mura', idea: "Non sai dov'è: cercalo",
  dritta: "Un intruso è dentro le mura. <b>vai [l'intruso]</b> da solo non basta: non sai dov'è. Puoi passare i lati uno per uno, oppure fare <b>un giro</b> che li copre tutti — e dirgli quando smettere.",
  racconto: "Un intruso è entrato nelle mura e aspetta il momento buono per correre al tesoro. Si vince mettendolo fuori combattimento, si perde se ci arriva. Il guaio è che <b>l'orco non sa dov'è</b>: non si va da qualcuno che non hai mai visto.",
  aiuti: ["L'orco vede solo vicino: per trovare qualcuno bisogna passargli accanto.",
          "L'intruso non sta sempre nello stesso punto: quello che funziona in questa battaglia può fallire nella prossima.",
          'Esiste un ordine che gira fra i punti che scegli tu, e finisce quando dici tu.'],
  griglia: MURA, ambiente: 'camminamento',
  nomi: { tesoro: 'il tesoro', levante: 'il lato di levante',
          mezzogiorno: 'il lato di mezzogiorno', ponente: 'il lato di ponente' },
  posti: { tesoro: { x: 6, y: 4 }, levante: { x: 11, y: 4 },
           mezzogiorno: { x: 6, y: 7 }, ponente: { x: 1, y: 4 } },
  celle: true,
  segnali: ['ora'],
  unita: [
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 2, vita: 3, x: 1, y: 1 },
    { id: 'eroe', nome: "l'intruso", fazione: 'umani', emoji: '🥷', chi: 'ladra', vista: 3, vita: 2, x: 11, y: 4 },
  ],
  fazioni: {
    orchi: { nome: 'i tuoi orchi', autore: 'giocatore' },
    umani: { nome: 'gli intrusi', autore: 'livello',
             ordini: { eroe: [quando('ora', o('vai', 'tesoro'))] } },
  },
  complementi: ['eroe', 'tesoro', 'levante', 'mezzogiorno', 'ponente'],
  obiettivo: [caduto('eroe')],
  sconfitta: [qui('eroe', 'tesoro')],
  motivoSconfitta: "L'intruso è arrivato al tesoro.",
  mostraNemici: true,
  varianti: [
    { nome: 'a levante', unita: { eroe: { x: 11, y: 4 } } },
    { nome: 'a mezzogiorno', unita: { eroe: { x: 6, y: 7 } } },
    { nome: 'a ponente', unita: { eroe: { x: 1, y: 4 } } },
  ],
  par: 2,
  /* QUI si vede l'astrazione. La stessa ronda si può fare a mete
     esplicite — e funziona, ma solo nel mondo che hai davanti. */
  soluzioni: [
    { nome: 'il giro delle mura', piano: { orco: [
      giro(['1,1', '11,1', '11,7', '1,7'], vedi('eroe')), o('attacca', 'eroe'),
    ] } },
    { nome: 'lato per lato', fragile: true, piano: { orco: [
      o('vai', 'levante'), o('vai', 'mezzogiorno'), o('attacca', 'eroe'),
    ] } },
  ],
},

/* 4 ─ IL SEGNALE. Nessuno è onnisciente: l'eroe non può sapere che
      l'orco è caduto se non l'ha visto. Glielo deve DIRE il cavaliere —
      ed è il messaggio al posto della variabile globale, cioè come si
      mettono d'accordo davvero due che non si vedono. */
{
  id: 'attesa', nome: 'Mettetevi d\'accordo', idea: 'Quello che non vedi te lo deve dire qualcuno',
  dritta: "L'eroe non può sapere com'è finita: non vede niente da lì. Il cavaliere deve <b>suonare</b>, e l'eroe partire <b>quando lo sente</b>.",
  racconto: "L'orco è piantato in mezzo alla strada e l'eroe non regge i suoi colpi. Il cavaliere se ne occupa, ma ci mette un po', e da dov'è l'eroe non si vede niente. Si vince quando l'eroe arriva al tesoro: il problema non è <b>dove</b> va, è <b>quando</b> parte — e quel «quando» lo sa soltanto il cavaliere.",
  aiuti: ['Chi parte troppo presto trova l\'orco ancora in piedi.',
          "L'eroe non vede il cavaliere: non può accorgersi da solo che ha finito.",
          'Un ordine può suonare un segnale, e un altro può mettersi in ascolto proprio di quel nome.'],
  griglia: CORTI, ambiente: 'cortile',
  nomi: { tesoro: 'il tesoro' },
  posti: { tesoro: { x: 11, y: 1 } },
  segnali: ['viaLibera'],
  unita: [
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'ladra', vista: 4, vita: 2, x: 2, y: 3,
      sa: ['vai', 'quando'] },
    { id: 'cava', nome: 'il cavaliere', fazione: 'umani', emoji: '🛡️', chi: 'cavaliere',
      vista: 12, vita: 6, x: 2, y: 5, sa: ['vai', 'attacca', 'aspetta', 'aspettaDiVedere', 'suona'] },
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 3, vita: 8, x: 7, y: 3 },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello',
             ordini: { orco: [o('aspettaDiVedere', 'eroe'), o('attacca', 'eroe')] } },
  },
  complementi: ['tesoro', 'orco', 'viaLibera'],
  obiettivo: [qui('eroe', 'tesoro')],
  sconfitta: [caduto('eroe')],
  motivoSconfitta: "L'orco ha preso l'eroe.",
  mostraNemici: true,
  varianti: [
    { nome: "l'orco sulla porta", posti: { tesoro: { x: 11, y: 1 } }, unita: { orco: { x: 7, y: 3 } } },
    { nome: "l'orco più in alto", posti: { tesoro: { x: 11, y: 5 } }, unita: { orco: { x: 7, y: 2 } } },
    { nome: "l'orco più avanti", posti: { tesoro: { x: 10, y: 1 } }, unita: { orco: { x: 8, y: 3 } } },
  ],
  par: 4,
  soluzioni: [{ nome: 'uno suona, l\'altro parte', piano: {
    cava: [o('attacca', 'orco'), o('suona', 'viaLibera')],
    eroe: [quando('viaLibera', o('vai', 'tesoro'))],
  } }],
},

/* 5 ─ i segnali: un'unità sveglia l'altra, e il segnale ha un nome. */
{
  id: 'segnale', nome: 'Tutto libero', idea: 'Un segnale sveglia chi lo ascolta',
  dritta: "<b>aspetta</b> è guardare qualcosa che hai davanti; <b>quando senti</b> è ricevere un messaggio, e funziona anche da lontano. Qui l'eroe non vede niente: gli va detto.",
  racconto: "La ladra parte subito e ha la strada da aprire; l'eroe invece non si muove finché non <b>sente</b> il segnale giusto. <b>quando senti [tutto libero]</b> è un ordine che ne contiene altri: partono solo quando quel nome viene detto, e da lì l'eroe il portone non lo vede nemmeno. Si vince quando l'eroe è sul tesoro.",
  aiuti: ['Un segnale è una parola detta a voce alta: la sente chi sta in ascolto proprio di quella.',
          "All'eroe serve un ordine che si metta in ascolto, e dentro ci vanno gli ordini che farà dopo.",
          'Alla ladra manca un verbo, ed è quello che suona il segnale.'],
  griglia: CORTI, ambiente: 'cortile',
  nomi: { tesoro: 'il tesoro', portone: 'il portone', chiave: 'la chiave' },
  posti: { tesoro: { x: 10, y: 1 } },
  porte: { portone: { x: 6, y: 3, chiave: 'chiave' } },
  oggetti: [{ nome: 'chiave', x: 2, y: 1 }],
  segnali: ['libero', 'aiuto'],
  unita: [
    { id: 'ladra', nome: 'la ladra', fazione: 'umani', emoji: '🥷', chi: 'ladra', vista: 4, x: 2, y: 3 },
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'cavaliere', vista: 4, x: 1, y: 1 },
  ],
  fazioni: { umani: { nome: 'i nostri', autore: 'giocatore' } },
  complementi: ['chiave', 'portone', 'tesoro', 'libero', 'aiuto'],
  obiettivo: [qui('eroe', 'tesoro')],
  varianti: [
    { nome: 'la chiave in alto', oggetti: { chiave: { x: 2, y: 1 } }, posti: { tesoro: { x: 10, y: 1 } } },
    { nome: 'la chiave in basso', oggetti: { chiave: { x: 1, y: 5 } }, posti: { tesoro: { x: 11, y: 5 } } },
    { nome: 'la chiave di lato', oggetti: { chiave: { x: 4, y: 1 } }, posti: { tesoro: { x: 9, y: 1 } } },
  ],
  par: 5,
  soluzioni: [{ nome: 'apri e chiama', piano: {
    ladra: [o('prendi', 'chiave'), o('apri', 'portone'), o('suona', 'libero')],
    eroe: [quando('libero', o('vai', 'tesoro'))],
  } }],
},

/* 6 ─ tutto insieme: due unità e un piano solo. */
{
  id: 'sorvegliato', nome: 'Il portone sorvegliato', idea: 'Due unità, un piano solo',
  dritta: "Il cavaliere non può passare finché il portone è chiuso, e l'orco non lo vede nemmeno. Chi fa cosa, e in che ordine?",
  racconto: "Il portone è chiuso, l'orco è di là e l'eroe cade al primo colpo. Il cavaliere regge, ma finché il portone è chiuso non può nemmeno arrivarci. Si vince quando l'eroe arriva al tesoro <b>vivo</b>.",
  aiuti: ['Due unità, un piano solo: chi apre la strada non è per forza chi la usa per primo.',
          "Guarda gli ordini dell'orco: cerca l'eroe, non il cavaliere.",
          "All'eroe non basta evitare l'orco: gli serve un ordine che parta quando glielo dicono."],
  griglia: CORTI, ambiente: 'camminamento',
  nomi: { tesoro: 'il tesoro', portone: 'il portone', chiave: 'la chiave' },
  posti: { tesoro: { x: 11, y: 1 } },
  porte: { portone: { x: 6, y: 3, chiave: 'chiave' } },
  oggetti: [{ nome: 'chiave', x: 2, y: 1 }],
  unita: [
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'ladra', vista: 4, vita: 1, x: 2, y: 3 },
    { id: 'cava', nome: 'il cavaliere', fazione: 'umani', emoji: '🛡️', chi: 'cavaliere',
      vista: 12, vita: 8, x: 1, y: 3, sa: ['vai', 'attacca', 'aspetta', 'aspettaDiVedere', 'suona'] },
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 4, vita: 16, x: 10, y: 3 },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello',
             ordini: { orco: [o('aspettaDiVedere', 'eroe'), o('attacca', 'eroe')] } },
  },
  segnali: ['viaLibera'],
  complementi: ['chiave', 'portone', 'tesoro', 'orco', 'viaLibera'],
  obiettivo: [qui('eroe', 'tesoro')],
  sconfitta: [caduto('eroe')],
  motivoSconfitta: "L'orco ha preso l'eroe.",
  mostraNemici: true,
  varianti: [
    { nome: 'il tesoro in alto', oggetti: { chiave: { x: 2, y: 1 } },
      posti: { tesoro: { x: 11, y: 1 } }, unita: { orco: { x: 10, y: 3 } } },
    { nome: 'il tesoro in basso', oggetti: { chiave: { x: 1, y: 5 } },
      posti: { tesoro: { x: 11, y: 5 } }, unita: { orco: { x: 10, y: 2 } } },
    { nome: "l'orco di lato", oggetti: { chiave: { x: 3, y: 5 } },
      posti: { tesoro: { x: 10, y: 5 } }, unita: { orco: { x: 9, y: 4 } } },
  ],
  par: 6,
  soluzioni: [{ nome: 'il cavaliere lo tiene', piano: {
    eroe: [o('prendi', 'chiave'), o('apri', 'portone'),
           quando('viaLibera', o('vai', 'tesoro'))],
    cava: [o('attacca', 'orco'), o('suona', 'viaLibera')],
  } }],
},

/* 7 ─ IL RUMORE. Qui il buco nel piano nemico non è un ordine
      sbagliato: è una REAZIONE. Il carceriere è fatto per accorrere —
      sta scritto nella sua scheda, si legge come un ordine — e il
      passaggio resta scoperto per tutto il tempo che ci mette ad
      andare. Quel tempo è la finestra, e la finestra è il livello.

      Ed è il primo livello che non si vince in fila: la ladra deve
      passare a ponente NELLO STESSO ISTANTE in cui il cavaliere si fa
      vedere a levante. Se aspetta che lui abbia finito, il carceriere
      è già tornato al suo posto; se parte prima, se lo trova davanti.
      Per questo il segnale che la fa partire è quello del nemico: il
      grido di un orco è un segnale come tutti gli altri. */
{
  id: 'richiamo', nome: 'Il richiamo', idea: 'Fai rumore lontano da dove devi passare',
  dritta: "Tocca il carceriere e leggi la sua scheda: <b>accorre</b> al grido. Il passaggio resta libero solo finché lui è per strada.",
  racconto: "Il tesoro è nella corte chiusa, e davanti al portone c'è il carceriere. Non lo si batte: lo si manda via. La sentinella di levante <b>chiama aiuto</b> appena vede qualcuno, e il carceriere <b>accorre</b> — è fatto così, c'è scritto nella sua scheda. Si vince quando la ladra arriva al tesoro; la ladra cade al primo colpo, il cavaliere no.",
  aiuti: ["Una scheda si legge come un piano: tocca il carceriere e guarda a cosa reagisce.",
          "Chi accorre lascia il posto, e ci mette un pezzo ad arrivare: quello è tutto il tempo che hai.",
          "Il grido dell'orco è un segnale come gli altri: la ladra può stare in ascolto proprio di quello."],
  griglia: MURA, ambiente: 'camminamento',
  nomi: { tesoro: 'il tesoro', torrione: 'il torrione di levante',
          portone: 'il portone', chiave: 'la chiave' },
  posti: { tesoro: { x: 6, y: 4 }, torrione: { x: 11, y: 1 } },
  porte: { portone: { x: 6, y: 6, chiave: 'chiave' } },
  oggetti: [{ nome: 'chiave', x: 1, y: 7 }],
  segnali: ['aiuto'],
  unita: [
    { id: 'cava', nome: 'il cavaliere', fazione: 'umani', emoji: '🛡️', chi: 'cavaliere',
      vista: 4, vita: 22, x: 1, y: 1, sa: ['vai', 'attacca', 'aspetta', 'aspettaDiVedere', 'suona'] },
    { id: 'ladra', nome: 'la ladra', fazione: 'umani', emoji: '🥷', chi: 'ladra',
      vista: 2, vita: 1, x: 2, y: 1, sa: ['vai', 'prendi', 'apri', 'aspetta', 'quando'] },
    /* la sentinella CHIAMA, il carceriere ACCORRE: due mestieri, due
       righe di scheda, e insieme fanno la falla */
    { id: 'sent', nome: 'la sentinella', fazione: 'orchi', emoji: '👺', chi: 'guardia',
      vista: 2, vita: 14, x: 11, y: 1, grida: 'aiuto' },
    { id: 'carce', nome: 'il carceriere', fazione: 'orchi', emoji: '👹', chi: 'orco',
      vista: 2, vita: 14, x: 6, y: 7, accorre: 'aiuto' },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello', ordini: {
      sent: [o('aspettaDiVedere', 'umani'), o('attacca', 'umani')],
      carce: [o('aspettaDiVedere', 'umani'), o('attacca', 'umani')],
    } },
  },
  complementi: ['chiave', 'portone', 'tesoro', 'torrione', 'sent', 'carce', 'aiuto'],
  obiettivo: [qui('ladra', 'tesoro')],
  sconfitta: [caduto('ladra')],
  motivoSconfitta: 'Il carceriere ha preso la ladra.',
  mostraNemici: true,
  varianti: [
    { nome: 'la sentinella in cima a levante',
      posti: { torrione: { x: 11, y: 1 } }, unita: { sent: { x: 11, y: 1 } } },
    { nome: 'la sentinella a metà costa',
      posti: { torrione: { x: 11, y: 4 } }, unita: { sent: { x: 11, y: 4 } } },
    { nome: 'la sentinella a mezzogiorno',
      posti: { torrione: { x: 11, y: 7 } }, unita: { sent: { x: 11, y: 7 } } },
  ],
  par: 5,
  soluzioni: [
    { nome: 'uno fa rumore, l\'altra passa', piano: {
      cava: [o('vai', 'torrione')],
      ladra: [o('prendi', 'chiave'),
              quando('aiuto', o('apri', 'portone'), o('vai', 'tesoro'))],
    } },
    /* la tentazione: mandarli tutti e due avanti e sperare che i tempi
       tornino. Con la sentinella vicina tornano, con la sentinella
       lontana no — ed è esattamente la differenza fra aspettare un
       segnale e aspettare che vada bene. */
    { nome: 'partono tutti e due e si spera', fragile: true, piano: {
      cava: [o('vai', 'torrione')],
      ladra: [o('prendi', 'chiave'), o('apri', 'portone'), o('vai', 'tesoro')],
    } },
  ],
},

/* 8 ─ BUG: il caso non coperto. La ronda copre la costa di destra, che
      è anche la strada più corta: quella che `vai` sceglie da sé. */
{
  id: 'scoperto', nome: 'Il lato scoperto', idea: 'La strada più corta è quella sorvegliata',
  dritta: '«vai al tesoro» sceglie la via più corta — ed è proprio dove passano loro. Mandalo prima da un\'altra parte.',
  racconto: 'La ronda copre la costa di destra, che è anche la strada più corta per il tesoro — e <b>vai [al tesoro]</b> sceglie sempre la più corta. Si vince quando l\'eroe arriva al tesoro vivo.',
  aiuti: ['Non decidi la strada, decidi le tappe: la strada la sceglie lui, fra una tappa e l\'altra.',
          'Guarda dove passa la ronda, e poi guarda la parte opposta della mappa.',
          'Una tappa in più, dalla parte opposta, cambia tutto il percorso.'],
  griglia: MURA, ambiente: 'camminamento',
  nomi: { tesoro: 'il tesoro', angolo: "l'angolo in alto a sinistra",
          passaggio: 'il passaggio' },
  posti: { tesoro: { x: 6, y: 4 }, angolo: { x: 1, y: 1 }, passaggio: { x: 6, y: 7 } },
  celle: true,
  unita: [
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'cavaliere', vista: 3, vita: 2, x: 9, y: 1 },
    /* farsi vedere qui non costa una guardia, ne costa due: la ronda
       grida e l'altra molla il posto per venire */
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 2, vita: 4, x: 11, y: 4,
      grida: 'aiuto' },
    { id: 'orco2', nome: 'la guardia', fazione: 'orchi', emoji: '👺', chi: 'guardia', vista: 2, vita: 4, x: 11, y: 7,
      accorre: 'aiuto' },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello', ordini: {
      orco: [giro(['11,1', '11,7'], { cond: 'vedi', complemento: 'umani' }),
             o('attacca', 'umani')],
      orco2: [o('aspettaDiVedere', 'umani'), o('attacca', 'umani')],
    } },
  },
  complementi: ['tesoro', 'angolo', 'passaggio', 'orco'],
  obiettivo: [qui('eroe', 'tesoro')],
  sconfitta: [caduto('eroe')],
  motivoSconfitta: "L'eroe è passato sotto il naso della ronda.",
  mostraNemici: true,
  varianti: [
    { nome: 'la ronda a metà costa', unita: { orco: { x: 11, y: 4 }, orco2: { x: 11, y: 7 } } },
    { nome: 'la ronda più in basso', unita: { orco: { x: 11, y: 5 }, orco2: { x: 11, y: 6 } } },
    { nome: 'la ronda più in alto', unita: { orco: { x: 11, y: 3 }, orco2: { x: 11, y: 7 } } },
  ],
  par: 2,
  soluzioni: [{ nome: 'il giro largo', piano: { eroe: [o('vai', 'angolo'), o('vai', 'tesoro')] } }],
},

/* 9 ─ INVERTITO. BUG: l'ordine invertito. Il piano degli umani apre il
      portone PRIMA di prendere la chiave: l'eroe ci arriva, spinge, e
      lì si pianta. Leggere il suo piano dice ANCHE dove trovarlo. */
{
  id: 'rotto', nome: 'Il piano rotto', idea: 'Hanno invertito due ordini',
  dritta: 'Il loro piano ha due ordini nell\'ordine sbagliato. Trovali: ti dicono anche dove resterà piantato.',
  racconto: "Nel piano degli umani ci sono due ordini invertiti: l'eroe va al portone <b>prima</b> di avere la chiave, e lì si ferma per sempre. Si vince se l'eroe cade, si perde se arriva al tesoro.",
  aiuti: ['Anche per loro vale la regola: il portone non si apre a mani vuote.',
          'Se un ordine fallisce, il piano si ferma lì: l\'eroe resta dov\'è arrivato.',
          "All'orco basta arrivare dove l'altro si è piantato — e non è lontano."],
  griglia: CORTI, ambiente: 'corridoio',
  nomi: { tesoro: 'il tesoro', portone: 'il portone', chiave: 'la chiave' },
  posti: { tesoro: { x: 11, y: 1 } },
  celle: true,
  porte: { portone: { x: 6, y: 3, chiave: 'chiave' } },
  oggetti: [{ nome: 'chiave', x: 2, y: 5 }],
  unita: [
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 2, vita: 6, x: 1, y: 5 },
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'cavaliere', vista: 3, vita: 3, x: 1, y: 1 },
  ],
  fazioni: {
    orchi: { nome: 'i tuoi orchi', autore: 'giocatore' },
    umani: { nome: 'gli intrusi', autore: 'livello', ordini: { eroe: [
      o('apri', 'portone'), o('prendi', 'chiave'), o('vai', 'tesoro'),
    ] } },
  },
  complementi: ['eroe', 'chiave', 'portone', 'tesoro'],
  obiettivo: [caduto('eroe')],
  sconfitta: [qui('eroe', 'tesoro')],
  motivoSconfitta: "L'eroe è arrivato al tesoro.",
  mostraNemici: 'gettoni', gettoni: 2,
  varianti: [
    { nome: 'la chiave in basso', oggetti: { chiave: { x: 2, y: 5 } }, unita: { eroe: { x: 1, y: 1 } } },
    { nome: "la chiave nell'angolo", oggetti: { chiave: { x: 4, y: 5 } }, unita: { eroe: { x: 2, y: 1 } } },
    { nome: 'la chiave a mezz\'aria', oggetti: { chiave: { x: 2, y: 4 } }, unita: { eroe: { x: 1, y: 2 } } },
  ],
  par: 2,
  soluzioni: [{ nome: 'cerca e prendi', piano: { orco: [
    giro(['1,1', '5,1', '5,5', '1,5'], vedi('eroe')), o('attacca', 'eroe'),
  ] } }],
},

/* 10 ─ BUG: il segnale morto. La guardia suona «nemico in vista», il
       capo aspetta «aiuto»: non si sveglia mai. Due nomi giusti, ma
       non lo stesso nome. */
{
  id: 'muto', nome: 'Il segnale che non arriva', idea: 'Un segnale che nessuno ascolta',
  dritta: "La guardia dà l'allarme e il capo dovrebbe accorrere. Guarda bene <b>quale segnale</b> suona uno e <b>quale</b> aspetta l'altro.",
  racconto: "La guardia dà l'allarme appena vede qualcuno, e il capo dovrebbe accorrere. Si vince quando l'eroe arriva al tesoro. Leggi i due piani e confronta con calma: i segnali hanno un nome, e i nomi contano.",
  aiuti: ['Un segnale lo sente solo chi sta aspettando quel nome preciso.',
          'Metti a confronto il nome che suona la guardia e il nome che aspetta il capo.',
          'Se il capo non si sveglia mai, resta un nemico solo di cui occuparsi.'],
  griglia: CORTI, ambiente: 'corridoio',
  nomi: { tesoro: 'il tesoro', portone: 'il portone', chiave: 'la chiave' },
  posti: { tesoro: { x: 11, y: 1 } },
  porte: { portone: { x: 6, y: 3, chiave: 'chiave' } },
  oggetti: [{ nome: 'chiave', x: 2, y: 1 }],
  segnali: ['nemico', 'aiuto', 'libero'],
  unita: [
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'ladra', vista: 3, vita: 1, x: 2, y: 3 },
    { id: 'cava', nome: 'il cavaliere', fazione: 'umani', emoji: '🛡️', chi: 'cavaliere',
      vista: 12, vita: 8, x: 1, y: 3, sa: ['vai', 'attacca', 'aspetta', 'aspettaDiVedere', 'suona'] },
    { id: 'guardia', nome: 'la guardia', fazione: 'orchi', emoji: '👺', chi: 'guardia', vista: 4, vita: 16, x: 10, y: 3 },
    { id: 'capo', nome: 'il capo', fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 3, vita: 9, x: 11, y: 5 },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello', ordini: {
      guardia: [o('aspettaDiVedere', 'umani'), o('suona', 'nemico'), o('attacca', 'eroe')],
      capo: [quando('aiuto', o('attacca', 'umani'))],
    } },
  },
  complementi: ['chiave', 'portone', 'tesoro', 'guardia', 'capo', 'nemico', 'aiuto', 'libero'],
  obiettivo: [qui('eroe', 'tesoro')],
  sconfitta: [caduto('eroe')],
  motivoSconfitta: "L'eroe è caduto.",
  mostraNemici: 'gettoni', gettoni: 2,
  varianti: [
    { nome: 'il capo in basso', oggetti: { chiave: { x: 2, y: 1 } },
      posti: { tesoro: { x: 11, y: 1 } }, unita: { capo: { x: 11, y: 5 } } },
    { nome: 'il capo in alto', oggetti: { chiave: { x: 1, y: 5 } },
      posti: { tesoro: { x: 11, y: 5 } }, unita: { capo: { x: 11, y: 1 } } },
    { nome: 'il capo di lato', oggetti: { chiave: { x: 2, y: 5 } },
      posti: { tesoro: { x: 11, y: 4 } }, unita: { capo: { x: 10, y: 5 } } },
  ],
  par: 6,
  soluzioni: [{ nome: 'una guardia sola', piano: {
    eroe: [o('prendi', 'chiave'), o('apri', 'portone'),
           quando('libero', o('vai', 'tesoro'))],
    cava: [o('attacca', 'guardia'), o('suona', 'libero')],
  } }],
},

/* 11 ─ INVERTITO. BUG: l'attesa che non si sblocca, e sei tu a tenerla
       chiusa. L'eroe aspetta il segnale della ladra: zitta lei, fermo
       lui. */
{
  id: 'zitta', nome: 'Zitta, ladra', idea: 'Togli il segnale e il piano si spegne',
  dritta: 'Il loro piano si regge su un segnale. Chi lo deve suonare? E se non ce la facesse?',
  racconto: "Il piano degli umani si regge tutto su un segnale: se non parte, l'eroe non si muove di un passo. Si vince se la ladra cade, si perde se l'eroe arriva al tesoro.",
  aiuti: ['Chi suona il segnale e chi lo aspetta sono due persone diverse.',
          'Guarda quanti ordini deve fare la ladra prima di poter suonare il segnale.',
          "Non serve fermare l'eroe: serve arrivare prima all'altra."],
  griglia: CORTI, ambiente: 'corridoio',
  nomi: { tesoro: 'il tesoro', portone: 'il portone', chiave: 'la chiave' },
  posti: { tesoro: { x: 11, y: 1 } },
  porte: { portone: { x: 6, y: 3, chiave: 'chiave' } },
  oggetti: [{ nome: 'chiave', x: 2, y: 5 }],
  segnali: ['libero'],
  unita: [
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 3, vita: 6, x: 2, y: 3 },
    { id: 'ladra', nome: 'la ladra', fazione: 'umani', emoji: '🥷', chi: 'ladra', vista: 3, vita: 2, x: 1, y: 3 },
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'cavaliere', vista: 3, vita: 4, x: 1, y: 5 },
  ],
  fazioni: {
    orchi: { nome: 'i tuoi orchi', autore: 'giocatore' },
    umani: { nome: 'gli intrusi', autore: 'livello', ordini: {
      ladra: [o('prendi', 'chiave'), o('apri', 'portone'), o('suona', 'libero')],
      eroe: [quando('libero', o('vai', 'tesoro'))],
    } },
  },
  complementi: ['ladra', 'eroe', 'chiave', 'portone', 'libero', 'tesoro'],
  obiettivo: [caduto('ladra')],
  sconfitta: [qui('eroe', 'tesoro')],
  motivoSconfitta: "Il segnale è partito e l'eroe è arrivato al tesoro.",
  mostraNemici: 'gettoni', gettoni: 3,
  varianti: [
    { nome: 'la chiave in basso', oggetti: { chiave: { x: 2, y: 5 } } },
    { nome: 'la chiave in alto', oggetti: { chiave: { x: 1, y: 1 } } },
    { nome: 'la chiave di lato', oggetti: { chiave: { x: 3, y: 5 } } },
  ],
  par: 1,
  soluzioni: [{ nome: 'arriva prima', piano: { orco: [o('attacca', 'ladra')] } }],
},

/* 12 ─ BUG: il doppio incarico. Due orchi mandati nello stesso posto:
       quello che restava da guardare non lo guarda nessuno. */
{
  id: 'doppio', nome: 'Due orchi, un posto solo', idea: 'In due sullo stesso muro',
  dritta: 'Hanno gli stessi ordini tutti e due. Guarda dove vanno a mettersi, e passa dall\'altra parte.',
  racconto: 'I due orchi hanno gli stessi identici ordini, e vanno tutti e due nello stesso posto. Si vince quando l\'eroe è sul tesoro <b>e</b> la ladra è ancora viva.',
  aiuti: ['Due guardie sullo stesso muro lasciano scoperto tutto il resto del muro.',
          'Guarda dove si fermano, e conta quante strade portano al tesoro.',
          'Basta una tappa dalla parte dove non è rimasto nessuno.'],
  griglia: MURA, ambiente: 'cripta',
  nomi: { tesoro: 'il tesoro', passaggio: 'il passaggio',
          angolo: "l'angolo in alto a sinistra", costa: 'la costa di destra' },
  posti: { tesoro: { x: 6, y: 4 }, passaggio: { x: 6, y: 7 },
           angolo: { x: 1, y: 1 }, costa: { x: 11, y: 4 } },
  segnali: ['ora'],
  unita: [
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'cavaliere', vista: 3, vita: 2, x: 9, y: 1 },
    { id: 'ladra', nome: 'la ladra', fazione: 'umani', emoji: '🥷', chi: 'ladra', vista: 4, vita: 4, x: 1, y: 7 },
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 2, vita: 5, x: 11, y: 5 },
    { id: 'orco2', nome: 'la guardia', fazione: 'orchi', emoji: '👺', chi: 'guardia', vista: 2, vita: 5, x: 11, y: 6 },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello', ordini: {
      orco: [o('vai', 'costa'), o('aspettaDiVedere', 'umani'), o('attacca', 'umani')],
      orco2: [o('vai', 'costa'), o('aspettaDiVedere', 'umani'), o('attacca', 'umani')],
    } },
  },
  complementi: ['tesoro', 'passaggio', 'angolo', 'costa', 'orco', 'orco2', 'ora'],
  obiettivo: [qui('eroe', 'tesoro'), { cond: 'vivo', complemento: 'ladra' }],
  sconfitta: [caduto('eroe')],
  motivoSconfitta: "L'eroe è caduto.",
  mostraNemici: 'gettoni', gettoni: 3,
  varianti: [
    { nome: 'i due sulla costa', unita: { orco: { x: 11, y: 5 }, orco2: { x: 11, y: 6 } } },
    { nome: 'i due più in basso', unita: { orco: { x: 11, y: 6 }, orco2: { x: 11, y: 5 } } },
    { nome: 'i due sul passaggio', unita: { orco: { x: 11, y: 4 }, orco2: { x: 11, y: 5 } } },
  ],
  par: 2,
  soluzioni: [{ nome: 'dalla parte scoperta', piano: { eroe: [
    o('vai', 'angolo'), o('vai', 'tesoro'),
  ] } }],
},

/* 13 ─ LA FORTEZZA: 34×22, quattro schermate. Qui la fila di mete
       esplicite non è più «lunga», è impraticabile — e l'ordine di alto
       livello smette di essere un'eleganza per diventare l'unico modo.
       È la ragione per cui la mappa è grande. */
{
  id: 'fortezza', nome: 'La fortezza', idea: 'Quattro schermate: a mete non si fa più',
  dritta: 'La mappa è grande: <b>trascinala</b> col dito, e guarda la minimappa in alto. Qui le mete una per una non bastano più.',
  racconto: "La fortezza è larga quattro schermate. Il guardiano sta al collo del maschio e l'eroe non regge due colpi; il cavaliere sì, ma deve arrivarci. La chiave è nella stanza di ponente, il portone è sotto il guardiano. Si vince quando l'eroe arriva al tesoro.",
  aiuti: ['Qui le mete una per una non bastano più: gli ordini alti servono proprio a questo.',
          "Il cavaliere è l'unico che regge il guardiano, e nessuno dei due è vicino all'altro.",
          'Mentre uno tiene occupato il guardiano, l\'altro può portarsi avanti col lavoro.'],
  griglia: FORTEZZA, ambiente: 'ingranaggi',
  nomi: { tesoro: 'il tesoro', portone: 'il portone', chiave: 'la chiave',
          incrocio: "l'incrocio" },
  posti: { tesoro: { x: 17, y: 16 }, incrocio: { x: 17, y: 10 } },
  celle: true,
  porte: { portone: { x: 17, y: 12, chiave: 'chiave' } },
  oggetti: [{ nome: 'chiave', x: 6, y: 6 }],
  segnali: ['viaLibera'],
  unita: [
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'ladra', vista: 4, vita: 2, x: 1, y: 1 },
    { id: 'cava', nome: 'il cavaliere', fazione: 'umani', emoji: '🛡️', chi: 'cavaliere',
      vista: 14, vita: 20, x: 1, y: 20, sa: ['vai', 'attacca', 'aspetta', 'aspettaDiVedere', 'suona'] },
    /* QUI IL RUMORE NON C'È, ED È UNA SCELTA. Provato: il guardiano
       che grida e la ronda che accorre fanno arrivare una seconda
       spada addosso al cavaliere, che tiene il guardiano e non
       l'altra — e la strada da due stelle sparisce. Il livello
       promette «il cavaliere regge il guardiano», non due; per
       tenerlo in piedi col rumore bisognerebbe dargli il doppio della
       vita, e allora la reazione non si sentirebbe più. */
    { id: 'orco', nome: 'il guardiano', fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 5, vita: 26, x: 17, y: 11 },
    { id: 'orco2', nome: 'la ronda', fazione: 'orchi', emoji: '👺', chi: 'guardia', vista: 3, vita: 6, x: 32, y: 1 },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello', ordini: {
      orco: [o('aspettaDiVedere', 'eroe'), o('attacca', 'eroe')],
      orco2: [giro(['32,1', '32,20'], { cond: 'vedi', complemento: 'umani' }),
              o('attacca', 'umani')],
    } },
  },
  complementi: ['chiave', 'portone', 'tesoro', 'incrocio', 'orco', 'orco2', 'viaLibera'],
  obiettivo: [qui('eroe', 'tesoro')],
  sconfitta: [caduto('eroe')],
  motivoSconfitta: "Il guardiano ha preso l'eroe.",
  mostraNemici: 'gettoni', gettoni: 2,
  varianti: [
    { nome: 'la chiave in mezzo', oggetti: { chiave: { x: 6, y: 6 } } },
    { nome: 'la chiave in fondo', oggetti: { chiave: { x: 4, y: 7 } } },
    { nome: 'la chiave in alto', oggetti: { chiave: { x: 7, y: 4 } } },
  ],
  par: 7,
  soluzioni: [{ nome: 'uno tiene, l\'altro passa', piano: {
    eroe: [o('prendi', 'chiave'),
           quando('viaLibera', o('apri', 'portone'), o('vai', 'tesoro'))],
    cava: [o('vai', 'incrocio'), o('attacca', 'orco'), o('suona', 'viaLibera')],
  } }],
},

/* 14 ─ IL RAMO, e si fa a segnali. Due strade per il tesoro e una sola
       è sorvegliata — ma quale cambia da un mondo all'altro. Nessuna
       fila di ordini, per quanto lunga, può indovinarlo: il seguito
       DIPENDE da cosa si trova.

       Qui si vedono i tre concetti separati, uno per unità: la vedetta
       DECIDE (un blocco condizione, un ramo per strada) e AGISCE
       (`suona`); l'eroe riceve un EVENTO (`quando senti`) e cammina. Ogni
       fila resta piatta, il bivio ha i suoi due rami, e il programma
       dell'eroe ha due punti d'ingresso.

       Perché non basta la guardia da sola: l'eroe ha la vista corta
       come il naso, l'orco ce l'ha lunga. Chiunque si avvicini
       abbastanza da VEDERE è già stato visto. Solo la vedetta, ferma e
       lontana, può guardare senza essere presa: perciò chi decide non è
       chi cammina, e l'informazione deve viaggiare. */
{
  id: 'due-strade', nome: 'Due strade', idea: 'Il seguito dipende da cosa trovi',
  dritta: "L'orco sta alla porta <b>più vicina al tesoro</b>, e cambia ogni volta: andarci dritti non funziona mai. Solo la vedetta lo vede da lontano.",
  racconto: "Ci sono due porte per la corte di levante, e l'orco sta sempre a quella <b>più vicina al tesoro</b> — che cambia a ogni battaglia. L'eroe cade al primo colpo e vede solo a un passo; la vedetta vede lontano, e l'orco non la degna di uno sguardo. Si vince quando l'eroe arriva al tesoro.",
  aiuti: ['Chi decide non è chi cammina: quello che si sa da una parte deve arrivare dall\'altra.',
          "La vedetta ne vede una sola, delle due porte: e sapere che l'orco NON è lì dice dov'è.",
          'Il blocco ❓ condizione guarda una volta e prende una delle due strade; un ascolto parte quando senti il suo segnale. Due segnali diversi, due seguiti diversi.'],
  griglia: DUE_CORTI, ambiente: 'cripta',
  nomi: { tesoro: 'il tesoro', portaSopra: 'la porta di sopra', portaSotto: 'la porta di sotto' },
  posti: { tesoro: { x: 11, y: 4 }, portaSopra: { x: 6, y: 2 }, portaSotto: { x: 6, y: 10 } },
  segnali: ['nemico', 'libero'],
  unita: [
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'cavaliere', vista: 1, vita: 1, x: 2, y: 6,
      sa: ['vai', 'aspetta', 'quando'] },
    { id: 'vedetta', nome: 'la vedetta', fazione: 'umani', emoji: '🔭', chi: 'ladra', vista: 5, vita: 3, x: 2, y: 1,
      sa: ['aspetta', 'suona', 'quando'] },
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 4, vita: 9, x: 6, y: 2 },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello',
             ordini: { orco: [o('aspettaDiVedere', 'eroe'), o('attacca', 'eroe')] } },
  },
  complementi: ['portaSopra', 'portaSotto', 'tesoro', 'orco', 'nemico', 'libero', 'momento'],
  /* le condizioni le detta il livello: qui la domanda è una sola — la
     vedetta lo vede o no? */
  condizioni: [vedi('orco'), nonVedi('orco')],
  obiettivo: [qui('eroe', 'tesoro')],
  sconfitta: [caduto('eroe')],
  motivoSconfitta: "L'eroe è finito addosso all'orco.",
  mostraNemici: true,
  varianti: [
    { nome: "l'orco di sopra", unita: { orco: { x: 6, y: 2 } }, posti: { tesoro: { x: 11, y: 4 } } },
    { nome: "l'orco di sotto", unita: { orco: { x: 6, y: 10 } }, posti: { tesoro: { x: 11, y: 8 } } },
    { nome: "l'orco di sopra, tesoro in alto", unita: { orco: { x: 6, y: 2 } }, posti: { tesoro: { x: 11, y: 3 } } },
  ],
  par: 9,
  soluzioni: [{ nome: 'la vedetta decide', piano: {
    /* la vedetta guarda una volta e sceglie quale nome dire: un blocco
       condizione, un ramo per strada. L'eroe non decide niente — sta in
       ascolto di tutti e due i nomi, e cammina quando ne arriva uno. */
    vedetta: [bivio(vedi('orco'), [o('suona', 'nemico')], [o('suona', 'libero')])],
    eroe: [quando('nemico', o('vai', 'portaSotto'), o('vai', 'tesoro')),
           quando('libero', o('vai', 'portaSopra'), o('vai', 'tesoro'))],
  } }],
},

]

export const QUANTI = LIVELLI.length
export const livelloDi = i => LIVELLI[Math.max(0, Math.min(LIVELLI.length - 1, i))]
/* su quanti mondi si prova il piano: i primi due livelli sono un
   tutorial e ne giocano uno solo, così il primo piano che si scrive
   funziona davvero. Dal terzo in poi sono tre, e i piani rigidi
   cominciano a cadere. */
export const proveDi = liv => Math.min(liv.prove || 3, (liv.varianti || []).length)
