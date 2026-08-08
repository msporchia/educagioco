/* ═══════════════════════════════════════════════════════════════════
   🧂 LA CAROVANA DEL SALE — capitolo 1: «Si parte all'alba»
   forma: raduno · concetto: sequenza

   LA STORIA. Il carro del sale parte quando suona la campana, con o
   senza di te. Il campanaro sta già facendo il suo giro del paese, e
   quando arriva in cima al campanile la carovana o è pronta o è
   rimasta a casa. I tre sono sparsi: nonna Rea in fondo al vicolo di
   ponente, Vito alla porta di levante, Bugo in mezzo alla piazza. Il
   sale è nel magazzino, il magazzino è chiuso, e la chiave ce l'ha il
   fornaio.

   EREDITA: niente — è il primo capitolo della storia.
   LASCIA: **il sale**, sei sacchi caricati sul carro, e da qui in poi
   il carro è pesante per tutti e cinque i capitoli che restano.

   COSA INSEGNA. Due cose, e la seconda è quella che conta.

   La prima è la CATENA: la chiave prima del portone, sempre. È
   l'unico paio di ordini che non si scambia, e sbagliarlo non è
   un'opinione — il motore lo dice con le sue parole («il portone del
   magazzino è chiuso a chiave, e la chiave del magazzino non ce
   l'ho»), e subito dopo la strada verso il sale resta chiusa.

   La seconda è che **le liste girano tutte insieme**. Qui non si
   comanda più una persona sola: si scrivono tre liste, e partono nello
   stesso istante. Nessuno aspetta nessuno se non glielo dici — e
   siccome in questo capitolo non c'è ancora niente per dirglielo, il
   modo di guadagnare tempo è uno solo: **dare a ognuno la sua strada**.
   Chi lascia fermi gli altri due e fa fare tutto a Bugo scopre che il
   paese è grande e la campana non aspetta.

   LA MAPPA (28×16, il paese all'alba). Un anello di strade — quella
   alta, quella bassa e i due vicoli — con la piazza in mezzo, e sulla
   piazza il carro. Il magazzino sta a ponente e ha una porta sola; la
   bottega del fornaio a levante e si apre solo sulla strada alta.
   Perciò le due commissioni di Bugo stanno **agli antipodi**, ed è
   quello a rendere il giro lungo: chi le fa nell'ordine sbagliato
   attraversa il paese tre volte invece di due.

   LE TRE SCENE. Cambia dov'è la chiave (dal fornaio, caduta nel
   vicolo, oppure il portone è rimasto aperto e la chiave non serve
   più), cambia dov'è il carro e cambia da dove partono i tre. Il
   ragionamento è sempre lo stesso: chiave, portone, sale, e intanto
   gli altri due camminano. Chi ha capito che la chiave viene prima
   vince tutte e tre; chi si è solo ricordato che «il magazzino era
   aperto» ne vince una.
   ═══════════════════════════════════════════════════════════════════ */

/* ── le scorciatoie per scrivere i dati (le stesse di data/generale.js,
      ricopiate qui perché questo file deve stare in piedi da solo) ── */
const o = (verbo, complemento) => ({ verbo, complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })

/* una mappa non si scrive a mano: si scava, e resta una lista di righe
   di caratteri come tutte le altre */
function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const PAESE = (() => {
  const g = tela(28, 16)
  cava(g, 1, 2, 26, 3)       // la strada alta
  cava(g, 1, 12, 26, 13)     // la strada bassa
  cava(g, 1, 2, 2, 13)       // il vicolo di ponente
  cava(g, 25, 2, 26, 13)     // il vicolo di levante
  cava(g, 10, 6, 18, 10)     // la piazza, e in mezzo il carro
  cava(g, 13, 3, 14, 6)      // il vicolo che scende in piazza
  cava(g, 13, 10, 14, 12)    // il vicolo che va alla strada bassa
  cava(g, 4, 5, 8, 9)        // il magazzino: una porta e basta
  cava(g, 9, 7, 9, 7)        // la sua porta, che dà sulla piazza
  cava(g, 20, 5, 23, 8)      // la bottega del fornaio
  cava(g, 21, 3, 21, 5)      // e il suo vicolo, che dà sulla strada alta
  return stampa(g)
})()

/* IL GIRO DEL CAMPANARO, ed è l'orologio del capitolo. Non è un
   nemico e non guarda nessuno: fa il suo giro del paese — ponente,
   levante, di nuovo su, e poi il campanile — e quando arriva **suona**.
   Da quel momento il carro è partito, e chi non c'era è rimasto a
   casa. Si legge toccandolo, ed è l'unico modo che il bambino ha di
   sapere quanto tempo gli resta: contare i suoi passi. */
const CAMPANARO = [
  o('vai', 'giroLevante'),
  o('vai', 'giroPonente'),
  o('vai', 'giroAlto'),
  o('vai', 'campanile'),
  o('suona', 'campana'),
]

export const SALE_1 = {
  id: 'sale-partenza', nome: 'Si parte all\'alba',
  idea: 'Tre liste che partono insieme, e la chiave prima del portone',
  storia: 'sale', capitolo: 1, emoji: '🌅',
  forma: 'raduno', concetto: 'sequenza',
  eredita: [], lascia: ['sale'],

  dritta: 'Le tre liste <b>partono tutte insieme</b>: mentre Bugo gira, gli altri due camminano. E il portone del magazzino <b>non si apre a mani vuote</b>: prima la chiave, che ce l\'ha il fornaio.',
  racconto: 'Il carro parte quando suona la campana, con o senza di te: guarda il campanaro, sta già facendo il suo giro. Il sale è nel magazzino, il magazzino è chiuso, la chiave è dal fornaio — e il fornaio sta dall\'altra parte del paese. Si vince quando <b>tutti e tre sono al carro</b> e Bugo ha addosso <b>la soma di sale e la pagnotta</b>. Si perde se suona la campana prima.',
  aiuti: [
    'Rea e Vito hanno una strada sola da fare: falli partire subito, non aspettano nessuno.',
    'Il portone vuole la chiave <b>prima</b>: se Bugo dice «non ce l\'ho», gli manca un ordine davanti.',
    'La chiave e la pagnotta stanno tutte e due dal fornaio: un viaggio solo a levante, poi il magazzino, poi il carro.',
  ],

  griglia: PAESE, ambiente: 'cortile',

  nomi: {
    sale: 'la soma di sale', pane: 'la pagnotta', chiave: 'la chiave del magazzino',
    magazzino: 'il portone del magazzino', carro: 'il carro',
    campanile: 'il campanile', giroPonente: 'il vicolo di ponente',
    giroLevante: 'il vicolo di levante', giroAlto: 'la strada alta',
    carovana: 'la carovana', paese: 'il paese',
  },
  posti: {
    carro: { x: 14, y: 8 },
    /* i quattro punti del giro del campanaro. Non stanno fra i
       `complementi`: sono roba sua, il bambino li vede camminare ma non
       li può nominare. */
    campanile: { x: 26, y: 13 },
    giroLevante: { x: 26, y: 2 },
    giroPonente: { x: 1, y: 13 },
    giroAlto: { x: 26, y: 3 },
  },
  porte: {
    magazzino: { x: 9, y: 7, chiave: 'chiave' },
  },
  oggetti: [
    { nome: 'sale', em: '🧂', pittore: 'sacco', x: 5, y: 8 },
    { nome: 'pane', em: '🥖', x: 22, y: 7 },
    { nome: 'chiave', em: '🔑', x: 22, y: 5 },
  ],
  segnali: ['campana'],

  unita: [
    /* nonna Rea guida il carro: sa camminare e basta. Non prende, non
       apre, non mena — ed è per questo che le altre tre liste esistono. */
    { id: 'rea', nome: 'nonna Rea', fazione: 'carovana', emoji: '🧓', chi: 'mago',
      vista: 4, vita: 4, x: 2, y: 13, sa: ['vai'] },
    { id: 'vito', nome: 'Vito', fazione: 'carovana', emoji: '🛡️', chi: 'cavaliere',
      vista: 4, vita: 10, x: 26, y: 3, sa: ['vai'] },
    /* Bugo è l'unico che prende e l'unico che apre: tutto il giro lungo
       tocca a lui, e il capitolo è tarato su questo. */
    { id: 'bugo', nome: 'Bugo', fazione: 'carovana', emoji: '🔧', chi: 'ladra',
      vista: 4, vita: 6, x: 13, y: 8, sa: ['vai', 'prendi', 'apri'] },
    /* il campanaro non è un nemico: è l'orologio. Non vede nessuno
       (vista 0) e non gli importa di nessuno — fa il giro e suona. */
    { id: 'nuto', nome: 'Nuto il campanaro', fazione: 'paese', emoji: '🔔', chi: 'elfo',
      vista: 0, vita: 20, x: 1, y: 2 },
  ],
  fazioni: {
    carovana: { nome: 'la carovana', autore: 'giocatore' },
    paese: { nome: 'il paese', autore: 'livello', ordini: { nuto: CAMPANARO } },
  },

  /* cinque cose sole si possono nominare, e da lì esce tutta la
     cassetta: `vai` (il carro, il portone, le tre cose), `prendi` (il
     sale, la pagnotta, la chiave), `apri` (il portone). Niente altro —
     è il primo capitolo. */
  complementi: ['sale', 'pane', 'chiave', 'magazzino', 'carro'],

  obiettivo: [qui('rea', 'carro'), qui('vito', 'carro'), qui('bugo', 'carro'),
              ha('bugo', 'sale'), ha('bugo', 'pane')],
  sconfitta: [{ cond: 'segnale', complemento: 'campana' }],
  motivoSconfitta: 'La campana ha suonato e il carro è partito senza di voi.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA ──
     Roba che sta lì e basta: **non è in gioco**. Non passa dal motore,
     non si prende, non si nomina in un ordine, non compare fra i
     bersagli. Serve a una cosa sola: che il paese sembri un paese. */
  scenografia: [
    { che: 'cassa', x: 4, y: 5 }, { che: 'botte', x: 4, y: 7 },
    { che: 'sacco', x: 4, y: 9 }, { che: 'sacco', x: 8, y: 9 },
    { che: 'cartello', x: 10, y: 6 }, { che: 'pozzo', x: 16, y: 8 },
    { che: 'secchio', x: 17, y: 9 }, { che: 'carrello', x: 12, y: 10 },
    { che: 'bandiera', x: 18, y: 6 }, { che: 'albero', x: 12, y: 6 },
    { che: 'cespuglio', x: 17, y: 6 }, { che: 'pozzanghera', x: 15, y: 10, strato: -1 },
    { che: 'botte', x: 20, y: 5 }, { che: 'cassa', x: 23, y: 8 },
    { che: 'tenda', x: 20, y: 8 }, { che: 'braciere', x: 23, y: 6 },
    { che: 'colonna', x: 2, y: 4 }, { che: 'cespuglio', x: 2, y: 10 },
    { che: 'albero', x: 25, y: 10 }, { che: 'cartello', x: 25, y: 3 },
    { che: 'campana', x: 25, y: 13 }, { che: 'colonna', x: 25, y: 12 },
    { che: 'barile', x: 6, y: 12 }, { che: 'cassa', x: 19, y: 13 },
    { che: 'binario', x: 9, y: 2, strato: -1 }, { che: 'ragnatela', x: 5, y: 6, strato: -1 },
  ],

  /* Tre scene, e la terza è la trappola. Cambia dov'è la chiave, dove
     sta il carro e da dove partono i tre — ma soprattutto cambia se il
     portone del magazzino sia rimasto aperto: nella terza sì, e allora
     un piano che si è dimenticato la chiave vince lo stesso. È lo
     stesso piano che nelle altre due lascia Bugo davanti a un portone
     chiuso. */
  varianti: [
    { nome: 'la chiave dal fornaio',
      oggetti: { chiave: { x: 22, y: 5 }, sale: { x: 5, y: 8 }, pane: { x: 22, y: 7 } },
      posti: { carro: { x: 14, y: 8 } },
      unita: { rea: { x: 2, y: 13 }, vito: { x: 26, y: 3 }, bugo: { x: 13, y: 8 } } },
    { nome: 'la chiave caduta nel vicolo di ponente',
      oggetti: { chiave: { x: 1, y: 7 }, sale: { x: 8, y: 5 }, pane: { x: 23, y: 5 } },
      posti: { carro: { x: 11, y: 9 } },
      unita: { rea: { x: 26, y: 12 }, vito: { x: 1, y: 3 }, bugo: { x: 14, y: 6 } } },
    { nome: 'il portone è rimasto aperto da ieri',
      porte: { magazzino: { aperta: true } },
      oggetti: { chiave: { x: 20, y: 6 }, sale: { x: 7, y: 6 }, pane: { x: 23, y: 7 } },
      posti: { carro: { x: 17, y: 7 } },
      unita: { rea: { x: 1, y: 12 }, vito: { x: 25, y: 2 }, bugo: { x: 10, y: 10 } } },
  ],

  par: 7,
  soluzioni: [
    /* sette ordini, ed è il par. Cinque a Bugo — un viaggio a levante
       che prende la chiave e la pagnotta insieme, poi il magazzino,
       poi il carro — e uno a testa agli altri due, che partono nello
       stesso istante e non aspettano niente. */
    { nome: 'un viaggio solo a levante', piano: {
      bugo: [o('prendi', 'chiave'), o('prendi', 'pane'), o('apri', 'magazzino'),
             o('prendi', 'sale'), o('vai', 'carro')],
      rea: [o('vai', 'carro')],
      vito: [o('vai', 'carro')],
    } },
    /* la stessa cosa con la pagnotta presa per ultima: la chiave davanti
       al portone non si sposta, la pagnotta sì. Due ordini che si
       scambiano e uno che non si scambia, che è il modo più corto per
       far vedere la differenza. */
    { nome: 'la pagnotta per ultima', piano: {
      bugo: [o('prendi', 'chiave'), o('apri', 'magazzino'), o('prendi', 'sale'),
             o('prendi', 'pane'), o('vai', 'carro')],
      rea: [o('vai', 'carro')],
      vito: [o('vai', 'carro')],
    } },
    /* FRAGILE: «tanto il magazzino era aperto». Nella terza scena lo è
       davvero e questo piano vince, con due ordini in meno; nelle altre
       due Bugo arriva al portone, non ha niente in mano, e la strada
       verso il sale resta chiusa fino alla campana. È la memoria di una
       scena spacciata per un piano. */
    { nome: 'senza chiave', fragile: true, piano: {
      bugo: [o('prendi', 'pane'), o('prendi', 'sale'), o('vai', 'carro')],
      rea: [o('vai', 'carro')],
      vito: [o('vai', 'carro')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto.

     Qui NON c'è `nonInFila`, ed è l'unico dei sei capitoli che non ce
     l'ha: la cassetta di partenza è `vai`, `prendi`, `apri` e basta, e
     con quei tre verbi il vocabolario non ha modo di dire «parti
     quando te lo dico». La coordinazione che questo capitolo chiede è
     un'altra — tre liste che girano insieme contro un orologio — e il
     banco di prova non sa misurarla (sta scritto in
     `tmp/attriti-sale.md`). `serveOgnuno` è quello che ci si avvicina
     di più: da solo non ce la fa nessuno. */
  verifiche: {
    /* nessuno dei tre arriva in fondo da solo: Bugo non è il carro,
       Rea non apre niente, Vito nemmeno */
    serveOgnuno: true,
    /* la catena: la chiave prima del portone, e non viceversa */
    ordineConta: [['prendi chiave', 'apri magazzino']],
    /* e senza la chiave il portone resta chiuso: al sale non ci sono
       altre strade */
    senza: ['chiave'],
  },
}

export default SALE_1
