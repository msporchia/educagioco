/* ═══════════════════════════════════════════════════════════════════
   I LIVELLI DEL GENERALE — dati puri, niente logica

   Un livello è una coreografia da far funzionare. Il giocatore firma
   gli ordini di una fazione, il livello quelli dell'altra: stesso
   linguaggio (`motore/generale.js`), autore diverso.

   ── com'è fatto un livello ────────────────────────────────────────
     id, nome, idea          come si chiama e cosa insegna
     dritta, racconto, aiuti le parole: la riga sotto la scena, il
                             cartello del 💡, e i tre suggerimenti a
                             scalare (il primo è gratis).

                             LA REGOLA È UNA SOLA: si dice soltanto
                             quello che la mappa NON mostra. Dov'è il
                             tesoro, dove sono le porte, chi sta dove
                             — quello si vede, e ridirlo a parole è
                             una pagina da saltare. Restano quattro
                             cose, e sono invisibili per davvero:
                             cosa vuol dire vincere (la `dritta`, e
                             quasi sempre basta lei), cosa CAMBIA da
                             una battaglia all'altra, chi non vede
                             cosa, e i numeri che decidono («cade al
                             primo colpo», «venti spallate»). Il
                             `racconto` sono due frasi, non un
                             paragrafo; quello che si scopre toccando
                             un personaggio è materia da aiuto, non da
                             cartello.
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
     verbi                   e QUALI VERBI, quando la manopola di sopra
                             non basta: «gli orchi» servono ad `attacca`
                             e si tirano dietro `aspetta di vedere`, che
                             in quel livello non serve a niente. È una
                             manopola del livello — i verbi si
                             introducono a scaglioni — e per questo NON
                             chiede spiegazioni, mentre un divieto
                             addosso a un personaggio sì (`nonRiesce`).
     obiettivo, sconfitta    quando è vinta e quando è persa
     varianti                TRE almeno, e sono la lezione del gioco: il
                             piano si firma prima di sapere quale tocca,
                             e un piano che funziona su una mappa sola è
                             fortuna. Ognuna è una toppa sulle
                             posizioni, non un livello nuovo. Di più se
                             le varianti sono la scelta stessa (i
                             quattro ingressi del forte) — ma allora
                             `prove` dev'essere alto abbastanza da
                             giocarsele tutte.
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

   I PRIMI SEI SONO IL TUTORIAL — un ordine, una fila, un giro, un
   segnale, una scelta, il rumore — e vanno fatti in fila. Dopo ne
   restano due, e sono due esami: la settima mette insieme l'evento e
   la decisione su un'informazione rubata al nemico, l'ottava è la
   mappa grande, dove le mete a una a una non bastano più.

   QUI NON SI FA IL DEBUG DEL PIANO DI UN ALTRO. Per un pezzo dopo la
   settima c'erano quattro prove costruite su un errore deliberato nel
   piano avversario — l'ordine invertito, il segnale con il nome
   sbagliato, l'attesa che dipende da uno solo, i due orchi mandati
   nello stesso posto — e si vincevano leggendo il piano e trovandoci
   la falla. Sono state tolte: il linguaggio lo insegnano le sei prove
   del tutorial, e a quel punto si impara battendoci la testa, non
   correggendo lo sbaglio di qualcun altro — che è un mestiere diverso
   dallo scrivere un piano proprio.

   Restano due difetti avversari, e nessuno dei due è un bug: sono
   abitudini, cioè cose che si notano giocando invece che leggendo.
     6  la reazione prevedibile  — chi accorre lascia il posto, e ci
                                   mette un pezzo ad arrivare
     7  la parola di troppo      — la ronda annuncia quando è lontana,
                                   e un segnale non ha destinatari
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
/* e una stanza non è per forza una scatola: il tondo si misura con la
   distanza vera, così il bordo viene a scaletta invece che a squadra */
function tondo (g, cx, cy, r) {
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0].length; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

/* LA FORTEZZA — 34×22, e la pianta è la prima cosa che si legge.
   Prima era tutta a squadra: quattro corridoi dritti, due scatole e il
   maschio, che a schermo si leggeva come una griglia invece che come
   un posto. Adesso ogni stanza ha una forma sua — due tonde, due a
   elle, il maschio ottagonale con le sue colonne — e i corridoi non
   sono più righe.

   QUELLO CHE NON PUÒ CAMBIARE, e vale per qualunque ritocco futuro:
   il portone (17,12) è l'UNICO ingresso al maschio, il tesoro sta al
   centro (17,16) e il guardiano nel collo (17,11). Se una galleria
   nuova arriva al maschio da un'altra parte, il livello non esiste
   più — si passa senza chiave e senza cavaliere. */
const FORTEZZA = (() => {
  const g = tela(34, 22)
  /* il cammino di ronda: sotto dritto, sopra scende attorno alla
     cisterna e risale */
  cava(g, 1, 1, 12, 1); cava(g, 12, 1, 12, 4); cava(g, 12, 4, 22, 4)
  cava(g, 22, 1, 22, 4); cava(g, 22, 1, 32, 1)
  cava(g, 1, 20, 32, 20)
  cava(g, 1, 1, 1, 20); cava(g, 32, 1, 32, 20)          // le due coste
  cava(g, 1, 10, 32, 10)                                // la traversa
  cava(g, 15, 9, 19, 9)                                 // la piazzetta
  cava(g, 3, 3, 8, 6); cava(g, 3, 6, 5, 8)              // l'armeria, a elle
  cava(g, 5, 1, 5, 3); cava(g, 4, 8, 4, 10)             //   e le sue due bocche
  tondo(g, 27, 6, 3.4)                                  // la cisterna
  cava(g, 27, 1, 27, 3); cava(g, 27, 9, 27, 10)
  tondo(g, 17, 15.5, 3.4); cava(g, 17, 10, 17, 12)      // il maschio e il collo
  g[14][15] = '#'; g[14][19] = '#'                      //   le quattro colonne
  g[17][15] = '#'; g[17][19] = '#'
  cava(g, 3, 14, 8, 16); cava(g, 3, 16, 5, 18)          // le prigioni, a elle
  cava(g, 4, 18, 4, 20); cava(g, 1, 14, 3, 14)
  tondo(g, 26, 16, 3.4); cava(g, 26, 18, 26, 20)        // le stalle, e l'androne
  cava(g, 10, 19, 10, 20)                               // due ripostigli, perché
  cava(g, 30, 12, 30, 13); cava(g, 30, 13, 32, 13)      //   i corridoi non siano tutti uguali
  return stampa(g)
})()
/* LA CINTA — mura SOLO attorno alla principessa, e campo aperto tutto
   intorno. Non è una fortezza: è un cortile murato in mezzo a un prato,
   con due porte sbarrate, una a ponente e una a levante.

   ── i punti ciechi sono il livello ──
   Vedere, qui dentro, vuol dire «essere a pochi passi CAMMINANDO»: le
   mura in mezzo non fermano lo sguardo per magia, lo fermano perché per
   arrivare dall'altra parte bisogna girarci intorno. Ed è tutto quello
   che serve: chi sta davanti alla porta di ponente non sa cosa succede
   a levante. Le mura esterne sono sparite apposta — chiudere anche il
   fuori faceva un labirinto, e la domanda del livello non è «come si
   entra», è «da quale delle due».

   L'orco arriva da lontano e la porta la deve SFONDARE, che costa
   tempo e fa fracasso: è quella la finestra in cui si fa a tempo ad
   accorrere, e senza quella nessun giro servirebbe a niente. */
function mura (g, x0, y0, x1, y1) {
  for (let x = x0; x <= x1; x++) { g[y0][x] = '#'; g[y1][x] = '#' }
  for (let y = y0; y <= y1; y++) { g[y][x0] = '#'; g[y][x1] = '#' }
}
const CINTA = (() => {
  const g = tela(15, 11)
  for (let y = 0; y < 11; y++) for (let x = 0; x < 15; x++) g[y][x] = '.'   // prato
  mura(g, 4, 3, 10, 7)                                  // il cortile della principessa
  g[5][4] = '.'; g[5][10] = '.'                         // le due porte
  return stampa(g)
})()
/* IL DEPOSITO — un anello di camminamenti attorno a una stanza chiusa,
   e sotto una nicchia da cui si spia.

   ── perché è grande, e perché è un ANELLO ──
   L'anello si divide in DUE METÀ UGUALI — quella di ponente e quella
   di levante — e ognuna è la strada di una sentinella, tredici celle
   per una. Da lì viene tutto il resto: due giri della stessa
   lunghezza durano uguale, quindi le due non si sfasano mai, e la
   finestra buona torna sempre allo stesso punto del ritmo invece di
   scivolare via un po' a ogni giro. Con percorsi di lunghezza diversa
   il livello diventa una lotteria: l'apertura c'è, ma non è mai due
   volte la stessa e non c'è niente da imparare.

   La mappa è larga perché quel mezzo giro dev'essere abbastanza: chi
   se ne è appena andato dal centro deve metterci più tempo a tornare
   di quanto ne serva a entrare, prendere e rientrare.

   La NICCHIA sotto il lato di mezzogiorno è **a gomito**, e il gomito
   non è un ghirigoro: chi passa sul camminamento vede due passi, e in
   fondo al gomito i passi sono tre. Dritta ne sarebbe servita una in
   più di altezza, e l'altezza qui è finita — vedi sotto. Tu invece, da
   lì, vedi il camminamento davanti all'ingresso: chi guarda vede più
   di chi è guardato, ed è la sola ragione per cui «se vedi gli orchi»
   è una domanda che si può fare senza essere già morti.

   ── E PERCHÉ NON È PIÙ GRANDE ──
   Provata a 15×12, che è il giro largo che questo livello vorrebbe: su
   un telefono si vede mezza mappa e le sentinelle stanno fuori campo,
   dietro le frecce del bordo. In un livello dove la domanda è «dove
   sono adesso?» una mappa da trascinare non è un dettaglio di comodo —
   è la risposta nascosta. Dodici per dieci è quanto ci sta intero, e
   il giro si accorcia fin lì. */
const DEPOSITO = (() => {
  const g = tela(12, 10)
  cava(g, 1, 1, 10, 1); cava(g, 1, 6, 10, 6)            // l'anello: tramontana e mezzogiorno
  cava(g, 1, 1, 1, 6); cava(g, 10, 1, 10, 6)            // le due coste
  cava(g, 3, 3, 8, 4)                                   // il deposito
  cava(g, 5, 5, 5, 5)                                   // il suo unico ingresso, in mezzo
  cava(g, 5, 7, 5, 8); cava(g, 4, 8, 4, 8)              // la nicchia da cui si origlia
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
/* un'AZIONE: una fila di ordini con un nome, che parte solo se qualcuno
   la chiama con `esegui`. Sta accanto al piano, come un «quando senti». */
const azione = (nome, corpo) => ({ blocco: 'routine', nome, corpo })
/* aspettare una DOMANDA, cioè stare fermi finché il mondo non dice di
   sì. Il complemento non c'è: la cosa che aspetti è la domanda. */
const aspettaChe = cond => ({ verbo: 'aspetta', cond })
/* un ciclo: quello che rifà, e quando smette. Il corpo è una fila di
   ordini qualsiasi — è la ragione per cui `ripeti` è un blocco e non il
   vecchio verbo `pattuglia`, che prendeva solo punti. */
const ciclo = (corpo, finche) => ({ blocco: 'ripeti', corpo, finche })
/* un giro di ronda: il caso più semplice del ciclo — solo camminare */
const giro = (punti, finche) =>
  ciclo(punti.map(p => ({ verbo: 'vai', complemento: p })), finche)
const vedi = complemento => ({ cond: 'vedi', complemento })
const nonVedi = complemento => ({ cond: 'vedi', complemento, non: true })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
/* ── ANDARE NON È OTTENERE ──
   `vai` è lo spostamento e basta: camminarci sopra non ti mette niente
   in mano. Quello che si vuole avere si prende, e la vittoria lo dice
   con la stessa parola — `ha(chi, cosa)`, non «è arrivato lì». Il
   tesoro era un POSTO, e la differenza fra le due cose non si vedeva
   proprio dove doveva vedersi: al primo livello. */
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })
const caduto = complemento => ({ cond: 'vivo', complemento, non: true })

export const LIVELLI = [

/* 1 ─ un ordine solo, e la strada la trova lui. Serve a far vedere la
      forma: verbo + cosa, poi ▶.
      SI PRENDE, non ci si arriva: `prendi` cammina da solo fino alla
      cosa e poi la mette nello zaino, quindi resta un ordine solo — ma
      dal primo livello la parola giusta è quella che dice cosa vuoi,
      non dove vuoi mettere i piedi. `vai` c'è lo stesso, e portarci
      l'eroe sopra non fa vincere: è la prima cosa che si impara
      sbagliando, e costa un ▶. */
{
  id: 'primo', nome: 'Il primo ordine', idea: 'Un verbo, una cosa, e via',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>.",
  racconto: "Camminare lo sa fare da solo: intorno ai muri ci gira senza che glielo dica nessuno. Tu gli dici <b>cosa</b> fare, non come.",
  aiuti: ['Un ordine è fatto di due cose: un verbo, e la cosa su cui vale.',
          'Stare accanto a una cosa non vuol dire averla.',
          'Guarda i verbi che hai: uno ti porta lì, un altro ti mette la roba nello zaino.'],
  griglia: CORTI, ambiente: 'cortile', prove: 1,
  nomi: { tesoro: 'il tesoro' },
  oggetti: [{ nome: 'tesoro', x: 10, y: 5, em: '💰', pittore: 'forziere' }],
  unita: [{ id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'cavaliere', vista: 4, x: 2, y: 5 }],
  fazioni: { umani: { nome: 'i nostri', autore: 'giocatore' } },
  complementi: ['tesoro'],
  obiettivo: [ha('eroe', 'tesoro')],
  varianti: [
    { nome: 'il tesoro in fondo', oggetti: { tesoro: { x: 10, y: 5 } } },
    { nome: 'il tesoro in alto', oggetti: { tesoro: { x: 10, y: 1 } } },
    { nome: 'il tesoro sul passaggio', oggetti: { tesoro: { x: 11, y: 3 } } },
  ],
  par: 1,
  soluzioni: [{ nome: 'dritto al tesoro', piano: { eroe: [o('prendi', 'tesoro')] } }],
},

/* 2 ─ la sequenza per intero. Nasce da sé dalla precondizione: un'azione
      funziona solo se hai la cosa a portata, quindi prima ci vai. */
{
  id: 'chiave', nome: 'La chiave e il portone', idea: 'Prima la chiave, poi il portone',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. È dietro il portone.",
  racconto: "Alla chiave e al portone l'eroe ci va da solo: quello che gli manca, se gli manca, non è la strada.",
  aiuti: ['Un ordine può fallire anche stando nel posto giusto.',
          'Se dice «non ce l\'ho», vuol dire che gli manca un ordine PRIMA di quello.',
          'Tre cose in fila, e l\'ordine in cui le metti è tutto.'],
  griglia: CORTI, ambiente: 'cortile', prove: 1,
  nomi: { tesoro: 'il tesoro', portone: 'il portone', chiave: 'la chiave' },
  porte: { portone: { x: 6, y: 3, chiave: 'chiave' } },
  oggetti: [{ nome: 'chiave', x: 2, y: 1 },
            { nome: 'tesoro', x: 10, y: 3, em: '💰', pittore: 'forziere' }],
  unita: [{ id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'cavaliere', vista: 4, x: 2, y: 3 }],
  fazioni: { umani: { nome: 'i nostri', autore: 'giocatore' } },
  complementi: ['chiave', 'portone', 'tesoro'],
  obiettivo: [ha('eroe', 'tesoro')],
  varianti: [
    { nome: 'la chiave in alto', oggetti: { chiave: { x: 2, y: 1 }, tesoro: { x: 10, y: 3 } } },
    { nome: 'la chiave in basso', oggetti: { chiave: { x: 1, y: 5 }, tesoro: { x: 11, y: 1 } } },
    { nome: "la chiave sull'angolo", oggetti: { chiave: { x: 4, y: 5 }, tesoro: { x: 11, y: 5 } } },
  ],
  par: 3,
  soluzioni: [{ nome: 'chiave, portone, tesoro', piano: { eroe: [
    o('prendi', 'chiave'), o('apri', 'portone'), o('prendi', 'tesoro'),
  ] } }],
},

/* 3 ─ LA RONDA. `vai [qualcuno]` non è onnisciente, ci vai solo se
      l'hai visto: ecco perché serve girare. L'orco è entrato da uno dei
      QUATTRO lati e sta in agguato — il suo piano aspetta un segnale
      che nessuno manderà, ed è il primo bug che il bambino legge.
      QUI NON SI COMANDANO GLI ORCHI. Per un pezzo questo livello
      invertiva le parti (i tuoi erano gli orchi, e il buono l'intruso):
      era un'idea buona nel posto sbagliato, perché queste prime prove
      sono il tutorial, e nel tutorial si impara chi si è. Il cavaliere
      difende la principessa, e l'orco fa l'orco.
      Le quattro varianti sono i quattro ingressi: chi si pianta su un
      lato viene fregato dagli altri tre, e non c'è modo di indovinare
      quale — è il livello che sceglie, dopo che tu hai firmato. */
{
  id: 'ronda', nome: 'Il giro delle mura', idea: 'Due porte, e una sola sentinella',
  dritta: "Obiettivo: <b>l'orco non deve arrivare alla principessa</b>.",
  racconto: "Per buttare giù una porta l'orco ci mette venti spallate, e si sente. Da che parte prova <b>cambia a ogni battaglia</b> — e da una porta non si vede l'altra.",
  aiuti: ['Le mura in mezzo tolgono la vista: quello che succede dall\'altra parte lo sai solo andandoci.',
          'Sfondare costa tempo. Non devi essere già lì: devi arrivarci prima che abbia finito.',
          'Fermo in un posto ne copri uno solo. C\'è un ordine che ne copre più di uno, e che si ferma quando dici tu.'],
  griglia: CINTA, ambiente: 'cortile', prove: 4, intera: true,
  nomi: { principessa: 'la principessa', orchi: 'gli orchi',
          ponente: 'la porta di ponente', levante: 'la porta di levante' },
  /* `chiave: 'sbarra'` è una chiave che non esiste: nessuno ce l'ha,
     quindi la porta non si apre — si sfonda. `forza` è quante spallate
     ci vogliono, `rumore` il segnale che parte alla prima. */
  porte: { ponente: { x: 4, y: 5, chiave: 'sbarra', forza: 20, rumore: 'fracasso' },
           levante: { x: 10, y: 5, chiave: 'sbarra', forza: 20, rumore: 'fracasso' } },
  celle: true,
  segnali: ['fracasso'],
  unita: [
    { id: 'cava', nome: 'il cavaliere', fazione: 'umani', emoji: '🛡️', chi: 'cavaliere',
      vista: 4, vita: 8, x: 7, y: 1 },
    /* la principessa è QUALCUNO, non un posto: si disegna come una
       persona, non finisce fra le unità che comandi, e si può
       attaccare — che è quello che l'orco vuole fare. Sei colpi: il
       tempo di accorrere se sei nei paraggi, non di attraversare
       tutto il prato. */
    /* IL TEMPO STA TUTTO NELLA PORTA, non nella principessa. Venti
       spallate sono un giro intero delle mura: chi pattuglia fa in
       tempo ad arrivare da qualunque parte si trovi, e la principessa
       può reggere quanto regge una persona — quattro colpi — invece di
       diventare un sacco da boxe che incassa per quattordici battiti
       aspettando i soccorsi. Prima era il contrario, e si vedeva: il
       cavaliere arrivava che lei era già mezza massacrata. */
    { id: 'principessa', nome: 'la principessa', fazione: 'corte', emoji: '👸', chi: 'elfo',
      vista: 2, vita: 4, x: 7, y: 5 },
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco',
      vista: 3, vita: 3, x: 0, y: 10 },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    corte: { nome: 'la corte', autore: 'livello' },
    /* due ordini, e li si legge col 🕵: sfonda quella porta, poi va da
       lei. QUALE porta lo dice la SCENA (`ordini` nelle varianti), non
       il livello: è l'unica cosa che cambia fra una battaglia e
       l'altra, ed è esattamente quello che non puoi sapere prima. */
    orchi: { nome: 'gli orchi', autore: 'livello',
             ordini: { orco: [o('apri', 'ponente'), o('vai', '7,5'),
                              o('attacca', 'principessa')] } },
  },
  complementi: ['orchi', 'principessa', 'ponente', 'levante', 'fracasso'],
  /* muoversi, menare, e il giro. Il fracasso si sente ma non si ascolta
     ancora: «quando senti» è del livello dopo. */
  verbi: ['vai', 'attacca', 'pattuglia'],
  obiettivo: [caduto('orco')],
  sconfitta: [caduto('principessa')],
  motivoSconfitta: "L'orco è arrivato alla principessa.",
  mostraNemici: true,
  varianti: [
    { nome: 'da mezzogiorno, e sfonda a ponente', unita: { orco: { x: 0, y: 10 } },
      ordini: { orco: [o('apri', 'ponente'), o('vai', '7,5'), o('attacca', 'principessa')] } },
    { nome: 'da tramontana, e sfonda a levante', unita: { orco: { x: 14, y: 0 } },
      ordini: { orco: [o('apri', 'levante'), o('vai', '7,5'), o('attacca', 'principessa')] } },
    { nome: 'da mezzogiorno, e sfonda a levante', unita: { orco: { x: 14, y: 10 } },
      ordini: { orco: [o('apri', 'levante'), o('vai', '7,5'), o('attacca', 'principessa')] } },
    { nome: 'da tramontana, e sfonda a ponente', unita: { orco: { x: 0, y: 0 } },
      ordini: { orco: [o('apri', 'ponente'), o('vai', '7,5'), o('attacca', 'principessa')] } },
  ],
  /* IL PAR SALE DA DUE A QUATTRO, e non è un livello diventato più
     difficile: è il ciclo che adesso si vede tutto. «pattuglia [due
     punti]» era un ordine solo che ne conteneva due di nascosto; ora
     sono il blocco e i due «vai» che ha dentro, e si contano tutti e
     tre — più l'attacco. Il par conta quello che hai scritto. */
  par: 4,
  soluzioni: [
    { nome: 'il giro delle due porte', piano: { cava: [
      giro(['2,5', '12,5'], vedi('orchi')), o('attacca', 'orchi'),
    ] } },
    /* FRAGILE: un giro fatto di UN punto solo è un modo elegante di
       stare fermi. Presidia una porta e vince le due battaglie in cui
       l'orco sceglie quella — nelle altre due lo sente sfondare
       dall'altra parte e non fa in tempo. Metà delle volte funziona:
       metà non è sapere. */
    { nome: 'di guardia a una porta sola', fragile: true, piano: { cava: [
      giro(['2,5'], vedi('orchi')), o('attacca', 'orchi'),
    ] } },
  ],
},



/* 4 ─ IL SEGNALE. Nessuno è onnisciente: l'eroe non può sapere che
      l'orco è caduto se non l'ha visto. Glielo deve DIRE il cavaliere —
      ed è il messaggio al posto della variabile globale, cioè come si
      mettono d'accordo davvero due che non si vedono. */
{
  id: 'attesa', nome: 'Mettetevi d\'accordo', idea: 'Quello che non vedi te lo deve dire qualcuno',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>.",
  racconto: "L'eroe non regge i colpi dell'orco; il cavaliere sì, ma ci mette un po'. E da dov'è l'eroe, quello che succede laggiù non si vede.",
  aiuti: ['Chi parte troppo presto trova l\'orco ancora in piedi.',
          'L\'eroe non vede il cavaliere: da solo non può accorgersi che ha finito.',
          'Quello che uno non può vedere, qualcun altro glielo può dire.'],
  griglia: CORTI, ambiente: 'cortile',
  nomi: { tesoro: 'il tesoro', orchi: 'gli orchi' },
  oggetti: [{ nome: 'tesoro', x: 11, y: 1, em: '💰', pittore: 'forziere' }],
  segnali: ['viaLibera'],
  /* ── CHI SA COSA, E PERCHÉ ──
     UN SOLO DIVIETO, E CON LA SUA RAGIONE. L'eroe sa tutto, attaccare
     compreso: il divieto non serviva, la conseguenza sì — con due vite
     contro otto «ci penso io» finisce male, e perderci insegna più di
     un tasto che non c'è. Il cavaliere invece non raccoglie niente, e
     quella è una regola vera: se potesse prendere lui il tesoro
     basterebbe un'unità sola e non ci sarebbe niente da mettere
     d'accordo — ma allora deve dirlo lui perché, e la scusa sta scritta
     qui accanto.
     Gli altri divieti che c'erano (l'eroe che non suonava, il cavaliere
     che non ascoltava) non avevano nessuna ragione da dare: servivano
     ad accorciare la cassetta, e da quando quello che non si sa fare si
     vede lo stesso, una riga muta è peggio di una riga in più. */
  unita: [
    /* L'EROE VEDE L'ORCO DA DOV'È (vista 6, che sono più della distanza
       che li separa): qui l'orco è in mezzo alla strada, allo scoperto,
       e un «attacca» che rispondesse «non so dov'è» a qualcuno che sta
       guardando in faccia sembrerebbe un guasto. Che ci vada e ci
       rimetta la pelle è proprio la lezione. Cercare qualcuno che non
       si vede è il mestiere di un altro livello — quello della ronda. */
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'ladra', vista: 6, vita: 2, x: 2, y: 3 },
    { id: 'cava', nome: 'il cavaliere', fazione: 'umani', emoji: '🛡️', chi: 'cavaliere',
      vista: 12, vita: 6, x: 2, y: 5,
      nonRiesce: { prendi: 'ho le mani occupate: scudo e spada' } },
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 3, vita: 8, x: 7, y: 3 },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello',
             ordini: { orco: [o('aspettaDiVedere', 'eroe'), o('attacca', 'eroe')] } },
  },
  complementi: ['tesoro', 'orchi', 'viaLibera'],
  /* «aspetta di vedere» qui non serve a niente: c'era solo perché «gli
     orchi» sono nominabili per via di `attacca`. Quattro verbi bastano
     a fare tutto quello che questo livello chiede. */
  verbi: ['vai', 'prendi', 'attacca', 'suona', 'quando'],
  obiettivo: [ha('eroe', 'tesoro')],
  sconfitta: [caduto('eroe')],
  motivoSconfitta: "L'orco ha preso l'eroe.",
  mostraNemici: true,
  varianti: [
    { nome: "l'orco sulla porta", oggetti: { tesoro: { x: 11, y: 1 } }, unita: { orco: { x: 7, y: 3 } } },
    { nome: "l'orco più in alto", oggetti: { tesoro: { x: 11, y: 5 } }, unita: { orco: { x: 7, y: 2 } } },
    { nome: "l'orco più avanti", oggetti: { tesoro: { x: 10, y: 1 } }, unita: { orco: { x: 8, y: 3 } } },
  ],
  par: 4,
  soluzioni: [
    { nome: 'uno suona, l\'altro parte', piano: {
      cava: [o('attacca', 'orchi'), o('suona', 'viaLibera')],
      eroe: [quando('viaLibera', o('prendi', 'tesoro'))],
    } },
    /* ADESSO CI SI PUÒ PROVARE, E SI PERDE. Da quando l'eroe sa
       attaccare, «ci penso io» è una mossa scrivibile — e con due vite
       contro otto finisce come deve finire, in tutte e tre le scene. È
       la tentazione che il divieto muto toglieva dal tavolo insieme
       alla lezione. Non sta fra le soluzioni: una `fragile` è un piano
       che a volte regge, e questo non regge mai. Che perda sempre è il
       punto — lo si scopre premendo ▶, che è dove si scoprono le cose
       qui dentro. */
  ],
},

/* 5 ─ LA DECISIONE. Il quinto dei concetti che servono a leggere
      tutto il resto: un ordine, una fila, un giro, un messaggio — e
      una scelta. Il tutorial non finisce qui: manca il rumore.
      QUI DECIDE CHI CAMMINA, e il piano è di UNA sola unità: la
      versione con la vedetta che guarda e l'eroe che ascolta (due
      unità, due segnali, nove ordini) è la stessa idea con sopra tutto
      quello che si è imparato prima, e stava in fondo alla fila dove
      non la vedeva nessuno. Prima si impara a scegliere; metterci
      dentro anche il segnale viene dopo.
      Il bivio è ONESTO solo se da dove sei vedi UNA delle due strade:
      l'eroe parte in cima alla corte e la porta di sopra ce l'ha
      davanti, quella di sotto è dall'altra parte del cortile. Sapere
      che l'orco NON è qui dice dov'è — ed è il primo ragionamento del
      gioco che non è un'osservazione ma una deduzione. */
{
  id: 'due-strade', nome: 'Due strade', idea: 'Guarda prima di scegliere',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. E l'eroe cade al primo colpo.",
  racconto: "L'orco sta a una delle due porte, e <b>cambia a ogni battaglia</b>. Da dove parti ne vedi una sola.",
  aiuti: ['Da qui vedi solo la strada di sopra. Guardala.',
          'Sapere che l\'orco NON è qui dice dov\'è.',
          'C\'è un blocco che guarda una volta sola e poi prende una delle due strade.'],
  griglia: DUE_CORTI, ambiente: 'cripta',
  nomi: { tesoro: 'il tesoro', orchi: 'gli orchi',
          portaSopra: 'la porta di sopra', portaSotto: 'la porta di sotto' },
  posti: { portaSopra: { x: 6, y: 2 }, portaSotto: { x: 6, y: 10 } },
  oggetti: [{ nome: 'tesoro', x: 11, y: 4, em: '💰', pittore: 'forziere' }],
  unita: [
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'ladra', vista: 6, vita: 1, x: 2, y: 2 },
    /* l'orco GUARDA LA SUA PORTA, e non un metro più in là: con la
       vista lunga vedeva l'eroe passare dall'altra parte del cortile e
       gli correva dietro — e allora il bivio non serviva a niente,
       perché la strada libera non era libera. Due passi di vista sono
       «sto sulla soglia»: chi passa di qui lo prendo, chi passa
       dall'altra parte è affare di qualcun altro. */
    /* L'ORCO STA NEL CAMMINAMENTO, non appoggiato alla porta: sulla
       soglia beccava chi scendeva lungo il cortile a tre celle di
       distanza, e allora anche la strada «libera» non era libera. Un
       passo più in là, e la corte di ponente torna terra di nessuno. */
    { id: 'orco', nome: "l'orco", fazione: 'orchi', emoji: '👹', chi: 'orco', vista: 2, vita: 9, x: 8, y: 2 },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello',
             ordini: { orco: [o('aspettaDiVedere', 'eroe'), o('attacca', 'eroe')] } },
  },
  complementi: ['portaSopra', 'portaSotto', 'tesoro', 'orchi'],
  /* la domanda è una sola, e il livello la detta: lo vedo o no? */
  condizioni: [vedi('orchi'), nonVedi('orchi')],
  verbi: ['vai', 'prendi'],
  obiettivo: [ha('eroe', 'tesoro')],
  sconfitta: [caduto('eroe')],
  motivoSconfitta: "L'eroe è finito addosso all'orco.",
  mostraNemici: true,
  varianti: [
    { nome: "l'orco sulla strada di sopra", unita: { orco: { x: 8, y: 2 } }, oggetti: { tesoro: { x: 11, y: 4 } } },
    { nome: "l'orco sulla strada di sotto", unita: { orco: { x: 8, y: 10 } }, oggetti: { tesoro: { x: 11, y: 8 } } },
    { nome: "l'orco di sopra, tesoro in alto", unita: { orco: { x: 8, y: 2 } }, oggetti: { tesoro: { x: 11, y: 3 } } },
  ],
  par: 4,
  soluzioni: [
    { nome: 'guarda, poi scegli', piano: { eroe: [
      bivio(vedi('orchi'), [o('vai', 'portaSotto')], [o('vai', 'portaSopra')]),
      o('prendi', 'tesoro'),
    ] } },
    /* FRAGILE: «passo sempre di sotto». Due scene su tre l'orco è di
       sopra e questo piano vince con due ordini invece di quattro —
       nella terza ci si va a sbattere. Indovinare non è sapere. */
    { nome: 'sempre di sotto', fragile: true, piano: { eroe: [
      o('vai', 'portaSotto'), o('prendi', 'tesoro'),
    ] } },
  ],
},



/* 6 ─ IL RUMORE, e CHIUDE IL TUTORIAL. Qui il buco nel piano nemico
      non è un ordine sbagliato: è una REAZIONE. Il carceriere è fatto
      per accorrere — sta scritto nella sua scheda, si legge come un
      ordine — e il passaggio resta scoperto per tutto il tempo che ci
      mette ad andare. Quel tempo è la finestra, e la finestra è il
      livello.

      ── PERCHÉ STA NEL TUTORIAL ──
      Per un pezzo il tutorial finiva alla decisione, e questa era la
      prima prova «per allenarsi». Ma qui non si allena niente di già
      visto: si impara una REGOLA DEL MONDO che nelle cinque prove
      prima non c'è — che il rumore ha un posto, e che chi lo sente ci
      corre. Senza, da qui in avanti metà di quello che succede sullo
      schermo non si spiega: perché la guardia molla il muro, perché
      farsi vedere costa, perché conta DOVE combatti. È il sesto e
      ultimo pezzo del vocabolario, non un esercizio. */
{
  id: 'richiamo', nome: 'Il richiamo', idea: 'Fai rumore lontano da dove devi passare',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano alla ladra</b>. Il carceriere non si batte.",
  racconto: "Con quella corazza il carceriere non lo butta giù nessuno, e la ladra cade al primo colpo. Ma lui è fatto in un modo solo, e sta scritto nella sua scheda.",
  aiuti: ['Una scheda si legge come un piano: tocca il carceriere e guarda a cosa reagisce.',
          'Corre dove sente il rumore, e ci mette un pezzo ad andare e tornare.',
          'Il rumore lo puoi fare dove vuoi — ma non dove devi passare tu.'],
  griglia: MURA, ambiente: 'camminamento',
  nomi: { tesoro: 'il tesoro', portone: 'il portone', chiave: 'la chiave', orchi: 'gli orchi' },
  porte: { portone: { x: 6, y: 6, chiave: 'chiave' } },
  oggetti: [{ nome: 'chiave', x: 1, y: 7 },
            { nome: 'tesoro', x: 6, y: 4, em: '💰', pittore: 'forziere' }],
  segnali: ['richiamo'],
  /* UNA UNITÀ SOLA, e il livello ci guadagna. Con due, questa era la
     terza volta di fila che la lezione era «mettetevi d'accordo»; con
     una, resta solo la cosa nuova: il rumore SPOSTA il nemico, e dove
     lo fai decide dove lui non è. La ladra suona, e mentre lui va a
     vedere lei è già dall'altra parte. */
  unita: [
    { id: 'ladra', nome: 'la ladra', fazione: 'umani', emoji: '🥷', chi: 'ladra',
      vista: 2, vita: 1, x: 2, y: 1 },
    /* non lo si tocca: quarantaquattro punti di vita sono il modo di
       dire «questa strada è chiusa» senza vietarla. Tutto il livello
       sta nell'unica riga della sua scheda: accorre. */
    { id: 'carce', nome: 'il carceriere', fazione: 'orchi', emoji: '👹', chi: 'orco',
      vista: 2, vita: 44, x: 6, y: 7, accorre: 'richiamo' },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    orchi: { nome: 'gli orchi', autore: 'livello', ordini: {
      carce: [o('aspettaDiVedere', 'umani'), o('attacca', 'umani')],
    } },
  },
  /* NIENTE POSTI CON UN NOME: dove fare rumore lo scegli tu, toccando
     la cella. Prima c'era «il torrione di levante» già segnato sulla
     mappa, e la domanda del livello — dove conviene chiamarlo? — era
     già risposta nell'elenco dei bersagli. */
  celle: true,
  complementi: ['chiave', 'portone', 'tesoro', 'orchi', 'richiamo'],
  verbi: ['vai', 'prendi', 'apri', 'suona'],
  obiettivo: [ha('ladra', 'tesoro')],
  sconfitta: [caduto('ladra')],
  motivoSconfitta: 'Il carceriere ha preso la ladra.',
  mostraNemici: true,
  /* LA CHIAVE CAMBIA POSTO A OGNI SCENA, e l'ordine resta lo stesso:
     `prendi [la chiave]` la segue dovunque sia. È la stessa lezione del
     secondo livello, e qui serve a impedire che il piano diventi una
     fila di coordinate imparate a memoria. */
  varianti: [
    { nome: 'la chiave a mezzogiorno', oggetti: { chiave: { x: 1, y: 7 } } },
    { nome: 'la chiave a due passi', oggetti: { chiave: { x: 1, y: 1 } } },
    { nome: 'la chiave in fondo a levante', oggetti: { chiave: { x: 11, y: 7 } } },
  ],
  par: 4,
  soluzioni: [
    /* QUATTRO ORDINI, e non ce n'è uno di troppo: la chiave sta sempre
       lontana dal portone, quindi il punto in cui ti trovi dopo averla
       raccolta è già un buon posto da cui chiamarlo. Suonare è un
       ordine come gli altri — quello che conta è DOVE ti trova. */
    { nome: 'lo chiama e passa', piano: { ladra: [
      o('prendi', 'chiave'), o('suona', 'richiamo'),
      o('apri', 'portone'), o('prendi', 'tesoro'),
    ] } },
    /* FRAGILE: e questa è la trappola vera. Andare a chiamarlo vicino
       al portone sembra la mossa furba — «così lo tolgo di lì» — ma il
       carceriere corre DOVE STAI TU, e la strada per tornare al portone
       è la stessa su cui lui sta arrivando. Due volte su tre te lo
       ritrovi addosso; la terza la chiave era così lontana che quando
       arrivi lui è già ripartito. */
    { nome: 'lo chiama proprio lì', fragile: true, piano: { ladra: [
      o('prendi', 'chiave'), o('vai', '9,7'), o('suona', 'richiamo'),
      o('apri', 'portone'), o('prendi', 'tesoro'),
    ] } },
  ],
},



/* 7 ─ ORIGLIARE. Il primo livello dopo il tutorial, e mette insieme le
      due cose imparate per ultime — l'evento e la decisione — su
      un'informazione che arriva DAL NEMICO invece che da un compagno.

      Il buco nel piano avversario non è un ordine sbagliato: è una
      parola di troppo. Le sentinelle, a ogni capo del loro giro, si
      dicono «tutto libero» — e un segnale non ha destinatari: chi è in
      ascolto lo sente, amico o no. Quel «tutto libero» diventa il tuo
      orologio.

      MA NON BASTA, ed è il punto del livello. Le sentinelle sono due e
      parlano tutte e due: il segnale dice dov'è CHI HA PARLATO, e non
      dice niente dell'altra. Quindi il piano è «quando lo senti,
      guarda: se c'è qualcuno in giro, lascia perdere e aspetta il giro
      dopo» — un evento con dentro una decisione, che è esattamente la
      somma delle prove 4 e 5. È anche il primo posto dove il ciclo si
      legge dalla parte di chi lo subisce: quello lo scrive il livello,
      e tu ci giri intorno.

      Prima qui c'era un altro livello, «il lato scoperto»: la ronda
      copriva la strada corta e si vinceva mettendo una tappa
      dall'altra parte. Insegnava una cosa vera (le tappe cambiano il
      percorso) ma la insegnava con tre meccaniche nuove in fila, e non
      si capiva quale si stesse imparando. */
{
  id: 'origlia', nome: 'Tutto libero', idea: 'Due domande: quando entri e quando esci',
  dritta: "Obiettivo: <b>il tesoro deve tornare nel nascondiglio</b>, in mano all'eroe. E l'eroe cade al primo colpo.",
  racconto: "Ogni volta che una sentinella arriva a un capo del suo giro si dice «tutto libero», e <b>lo senti anche tu</b> — ma non ti dice quale delle due ha parlato. E dalla nicchia vedi il camminamento qui davanti, non quello che succede in fondo. Il tesoro è in fondo al deposito: la strada è lunga e va rifatta al contrario, ma là dietro non arrivano a vederti, e chi è al sicuro può aspettare.",
  aiuti: ['Il loro piano si legge: tocca una sentinella e guarda cosa fa a ogni giro.',
          'Il segnale ti dice dov\'è quella che ha parlato. Dell\'altra non dice niente — e la strada va rifatta anche al contrario.',
          'In fondo al deposito sei al sicuro, e lì si può <b>aspettare</b> che il campo si liberi. Ma dentro il ramo di una domanda non ce ne sta un\'altra: quella per uscire va scritta in una <b>azione</b> a parte, e chiamata.'],
  griglia: DEPOSITO, ambiente: 'camminamento',
  nomi: { tesoro: 'il tesoro', orchi: 'le sentinelle', tana: 'il nascondiglio' },
  posti: { tana: { x: 4, y: 8 } },
  /* il sacco non si prende e non si nomina: sta lì a dire che quella
     buca in fondo alla nicchia è la tana di qualcuno, e non un vicolo
     cieco qualsiasi. Il posto vero è la cella accanto, quella verde. */
  scenografia: [{ che: 'sacco', x: 5, y: 8 }],
  /* IL TESORO STA IN FONDO, e sposta tutto il livello. Al centro, a due
     passi dall'ingresso, si faceva in tempo a entrare e uscire in una
     finestra sola: il momento del ritorno non era una scelta, era una
     conseguenza. In fondo a levante il viaggio è lungo il doppio — la
     finestra non basta più — ma là dietro le sentinelle non arrivano a
     vedere, e allora si può ENTRARE, ASPETTARE che passino, e uscire al
     momento buono. Tre celle di differenza, e la domanda del livello
     diventa doppia: quando parto, e quando torno. */
  oggetti: [{ nome: 'tesoro', x: 8, y: 3, em: '💰', pittore: 'forziere' }],
  segnali: ['libero'],
  unita: [
    /* VEDE PIÙ DI QUANTO SIA VISTO, ed è tutta la sua arma: nove passi
       contro due. Dalla nicchia copre il camminamento davanti
       all'ingresso e le due strade che ci portano — cioè quello che gli
       può capitare addosso mentre attraversa — e non un passo oltre. Se
       vedesse tutto il giro il segnale non servirebbe a niente; se
       vedesse quanto loro, «guarda prima di partire» sarebbe un ordine
       che non si può eseguire. */
    { id: 'eroe', nome: "l'eroe", fazione: 'umani', emoji: '🦸', chi: 'ladra',
      vista: 9, vita: 1, x: 4, y: 8 },
    /* DUE SENTINELLE, E NESSUNA DELLE DUE È «QUELLA MUTA». Fanno lo
       stesso mestiere su due strade diverse e parlano tutte e due:
       «tutto libero» arriva quattro volte per giro, da quattro posti
       diversi, e ogni volta è vero — per chi lo dice. Che è il modo
       preciso in cui un'informazione può essere onesta e insufficiente
       insieme. */
    { id: 'ronda', nome: 'la ronda', fazione: 'orchi', emoji: '👹', chi: 'orco',
      vista: 2, vita: 6, x: 10, y: 1 },
    { id: 'guardia', nome: 'la guardia', fazione: 'orchi', emoji: '👺', chi: 'guardia',
      vista: 2, vita: 6, x: 10, y: 2 },
  ],
  fazioni: {
    umani: { nome: 'i nostri', autore: 'giocatore' },
    /* DUE SPOLE SPECULARI, NON UN CORTEO. I due piani sono la stessa
       cosa riflessa: la ronda fa su e giù per la metà di ponente
       (5,6)⇄(5,1), la guardia per quella di levante (6,6)⇄(6,1), e a
       ogni capo che tocca si dice «tutto libero». Due ordini di
       cammino e due annunci, ed è tutto.

       LE DUE STRADE SONO LUNGHE UGUALE — tredici celle — e non è
       simmetria per bellezza: due giri di durata diversa si sfasano a
       ogni tornata, e l'apertura non capita mai due volte nello stesso
       punto del ritmo. Uguali, lo scarto fra le due resta quello di
       partenza per tutta la partita: chi guarda un giro ha visto tutti
       i giri. E il verso non le fa mai incolonnare — camminano una
       incontro all'altra e si separano.

       OGNUNA ANNUNCIA DA DUE POSTI: quello di sopra, lontano
       dall'ingresso, e quello di sotto, che gli sta a un passo. È qui
       che il segnale diventa una domanda invece di una risposta —
       «tutto libero» è sempre vero per chi lo dice, e non dice niente
       su dove sia l'altra. */
    orchi: { nome: 'gli orchi', autore: 'livello', ordini: {
      /* tutte e due cominciano il giro DAL BASSO: il primo ordine di un
         ciclo è anche il primo posto dove si va, quindi decide da dove
         arriva il primo annuncio. A chi le guarda partire, la prima
         cosa che succede è che scendono verso l'ingresso — e il primo
         «tutto libero» è quello che NON bisogna ascoltare. */
      ronda: [ciclo([o('vai', '5,6'), o('suona', 'libero'),
                     o('vai', '5,1'), o('suona', 'libero')],
                    { cond: 'vedi', complemento: 'umani' }),
              o('attacca', 'umani')],
      guardia: [ciclo([o('vai', '6,6'), o('suona', 'libero'),
                       o('vai', '6,1'), o('suona', 'libero')],
                      { cond: 'vedi', complemento: 'umani' }),
                o('attacca', 'umani')],
    } },
  },
  complementi: ['tesoro', 'orchi', 'libero', 'tana'],
  /* la domanda è una sola, e il livello la detta: ce n'è uno in vista
     oppure no. Il nome «le sentinelle» le tiene insieme tutte e due —
     indicarne una col dito sarebbe chiedere «quella lì», e quella lì
     non è il problema. */
  condizioni: [vedi('orchi'), nonVedi('orchi')],
  /* `esegui` c'è perché il ritorno è la parte cieca: una volta preso il
     tesoro bisogna rifare la strada, e dentro il ramo di un bivio non
     entra un secondo bivio. L'azione è il modo di farsi la domanda una
     seconda volta. */
  verbi: ['vai', 'prendi', 'quando', 'esegui', 'aspetta'],
  /* ── SI PRENDE E SI TORNA ──
     Non basta metterci le mani sopra: il tesoro deve tornare nel
     nascondiglio. Non è una tappa in più per allungare il brodo — è
     quello che rende il MOMENTO una scelta. Con la sola presa la
     strada era di sei battiti e nessun errore si pagava: a velocità
     uguali chi ti ha visto non ti prende mai, ti insegue e basta, e tu
     arrivi lo stesso. Dovendo rifare la strada al contrario, invece,
     chi ti ha visto te lo ritrovi davanti. */
  obiettivo: [ha('eroe', 'tesoro'), qui('eroe', 'tana')],
  sconfitta: [caduto('eroe')],
  motivoSconfitta: "L'eroe è finito sotto gli occhi di una sentinella.",
  mostraNemici: true,
  /* LE SCENE SPOSTANO LE SENTINELLE, non le cose: quello che cambia è
     in che punto del loro giro le trovi, cioè LO SCARTO FRA LE DUE — e
     siccome i due giri durano uguale, quello scarto è l'unica cosa che
     la scena decide, e non cambia più fino alla fine. Ognuna parte
     sempre dentro la sua metà: se le si mettesse dall'altra parte, il
     primo tratto sarebbe una corsa contromano per tornare al proprio
     giro, e la prima cosa che il bambino vede sarebbe l'eccezione. */
  varianti: [
    { nome: 'lontane tutte e due', unita: { ronda: { x: 2, y: 1 }, guardia: { x: 10, y: 6 } } },
    { nome: "la guardia è davanti all'ingresso", unita: { ronda: { x: 1, y: 1 }, guardia: { x: 6, y: 6 } } },
    { nome: 'la ronda scende a ponente', unita: { ronda: { x: 1, y: 3 }, guardia: { x: 6, y: 6 } } },
  ],
  par: 7,
  soluzioni: [
    /* ── DUE DOMANDE, E LA SECONDA NON CI STAREBBE ──
       All'andata basta il segnale più un'occhiata. Al ritorno serve
       chiedersi di nuovo «è libero?», e dentro il ramo di un bivio un
       secondo bivio non ci va — è la regola che tiene i piani leggibili
       su un telefono. Per questo il ritorno è un'AZIONE con un nome:
       la si chiama, e là dentro la fila è di nuovo piatta.
       E l'attesa è un'attesa vera (`aspetta che [non vedi]`), non un
       giro a vuoto: si sta fermi nell'angolo dove non arrivano, e si
       riparte quando il mondo dice di sì. */
    { nome: 'entra col segnale, esci quando è libero', piano: { eroe: [
      quando('libero', bivio(vedi('orchi'), [],
                             [o('prendi', 'tesoro'), o('esegui', 'azione 2')])),
      azione('azione 2', [aspettaChe(nonVedi('orchi')), o('vai', 'tana')]),
    ] } },
    /* FRAGILE: la stessa cosa senza l'occhiata di partenza. Il segnale
       dice dov'è chi parla e non dice niente dell'altra: due volte su
       tre ci si incammina addosso a quella zitta. */
    { nome: 'parte appena lo sente', fragile: true, piano: { eroe: [
      quando('libero', o('prendi', 'tesoro'), o('esegui', 'azione 2')),
      azione('azione 2', [aspettaChe(nonVedi('orchi')), o('vai', 'tana')]),
    ] } },
    /* FRAGILE, e la più istruttiva: aspettare di non vedere nessuno E
       BASTA, senza il segnale. Dalla nicchia si vede solo il
       camminamento qui davanti: «non vedo nessuno» vuol dire «non c'è
       nessuno QUI», e chi sta arrivando dall'altra parte non lo sai.
       Il segnale serve proprio a sapere quello che non si vede. */
    { nome: 'aspetta di non vedere nessuno, e corri', fragile: true, piano: { eroe: [
      aspettaChe(nonVedi('orchi')), o('prendi', 'tesoro'), o('vai', 'tana'),
    ] } },
  ],
},

/* 8 ─ LA FORTEZZA, e adesso è l'ultima. 34×22, quattro schermate: qui
      la fila di mete esplicite non è più «lunga», è impraticabile — e
      l'ordine di alto livello smette di essere un'eleganza per
      diventare l'unico modo. È la ragione per cui la mappa è grande, e
      il motivo per cui questa prova è rimasta quando le quattro sui
      bug se ne sono andate: non c'è niente da smascherare, c'è da
      farcela. */
{
  id: 'fortezza', nome: 'La fortezza', idea: 'Quattro schermate: a mete non si fa più',
  dritta: "Obiettivo: <b>l'eroe deve arrivare al tesoro</b>. E non regge due colpi del guardiano.",
  racconto: "La mappa non ci sta nello schermo: <b>trascinala</b> col dito, o guarda la minimappa in alto. Il guardiano lo regge solo il cavaliere, che però parte dall'altro capo della fortezza: da laggiù non vede l'eroe, e l'eroe non vede lui.",
  aiuti: ['Su una mappa così i tempi non si contano: nessuno sa quanto ci mette l\'altro.',
          'Finché il cavaliere lo tiene impegnato, il guardiano non guarda più l\'ingresso.',
          'L\'eroe può prendere la chiave e fermarsi lì, ad aspettare che qualcuno gli dica quando.'],
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


]

export const QUANTI = LIVELLI.length
/* ── IL TUTORIAL SONO TUTTE ──
   Non è un allenamento facoltativo: sono le cose senza le quali una
   storia non si può nemmeno leggere — un ordine, una sequenza, un
   giro, un segnale, una scelta, il rumore, e poi origliare e tenere
   insieme due che non si vedono. Stavano in fondo alla home sotto «e
   poi, quando vuoi», e il risultato era che si entrava in una storia
   senza sapere cosa fosse un ordine. Adesso vengono prima, e le
   avventure aspettano.

   E LA SOGLIA È IN FONDO, non a metà. Per un pezzo `TUTORIAL` valeva
   sei e le prove dopo erano «quelle dove le idee si mescolano»: una
   divisione che a schermo prometteva un cambio di passo che non
   c'era. Adesso la soglia coincide con l'ultima prova — cioè non c'è
   più nessun «dopo» finché le avventure restano chiuse — e resta una
   costante invece di un `QUANTI` scritto due volte, perché il giorno
   in cui le avventure si riaprono qui si torna a decidere DA DOVE si
   parte, che è una domanda diversa da QUANTE prove ci sono. */
export const TUTORIAL = QUANTI
export const livelloDi = i => LIVELLI[Math.max(0, Math.min(LIVELLI.length - 1, i))]
/* su quanti mondi si prova il piano: i primi due livelli sono un
   tutorial e ne giocano uno solo, così il primo piano che si scrive
   funziona davvero. Dal terzo in poi sono tre, e i piani rigidi
   cominciano a cadere. */
export const proveDi = liv => Math.min(liv.prove || 3, (liv.varianti || []).length)
