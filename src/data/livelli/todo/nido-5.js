/* ═══════════════════════════════════════════════════════════════════
   🥚 IL NIDO DI BRASA — capitolo 5: «La notte del nido»
   forma: resistenza · concetto: sintesi (niente di nuovo, tutto insieme)

   LA STORIA. Senza corde e senza scala salgono a mani nude, e stanotte
   vengono tutti e sei. Non c'è niente da prendere e niente da rompere:
   bisogna **durare fino all'alba**, cioè finché non se ne sono tornati
   giù tutti quanti — al sole nessuno ruba un uovo a un drago sveglio.

   EREDITA tutto: **la voce** (sanno che quassù c'è un drago, e non
   provano più dal sentiero facile), **il conto** (il loro piano si
   legge, ed è metà del lavoro), **le corde** che non hanno più e **la
   scala** che è a terra. Non lascia niente: è l'ultima notte.

   COSA INSEGNA — ed è la ragione per cui questo capitolo è l'ultimo:
   **quello che vedi lo puoi aspettare, quello che non vedi te lo deve
   dire qualcuno.** Le due cose stanno una accanto all'altra, nella
   stessa scena, e si distinguono a occhio:

     · Roccia tiene un camino e poi ne deve tenere un altro. Quelli che
       gli tocca fermare **ce li ha davanti**: `aspetta di vedere i
       ladri`, e appena li vede si sposta. Non gli serve nessuno.
     · Cenere tiene un camino e poi ne deve tenere un altro dall'altra
       parte della parete. Quelli che gli tocca fermare **non li vede
       nemmeno da lontano**: gli deve arrivare un messaggio, e Fumo
       glielo manda quando li vede sbucare dal sentiero.

   E INSEGNA CHE CIASCUNO STA DOVE PUÒ STARE SOLO LUI. Il loro piano
   dice anche di che cosa hanno paura, e non è sempre la stessa cosa:
   nei camini stretti, al buio, basta un drago qualunque; sulla cengia
   allo scoperto, con la luna, **un draghetto non ferma nessuno** — di
   là non passano solo se c'è la madre. Cenere non attacca e non è un
   difetto: è il motivo per cui può stare dove gli altri non servono.

   E NON SI VINCE PRENDENDOLI. Un ladro fermato non è un ladro tornato
   a casa: la notte finisce quando sono giù **tutti e sei**. `attacca`
   ce l'hanno in cassetta Brasa e Roccia, ed è l'ultima tentazione
   della storia — chi la usa scopre che l'alba non arriva mai.

   LA MAPPA (28×20), la parete tutta intera. In cima la cornice e la
   lastra del nido; sotto la cengia di mezzo, dove aspettano Brasa,
   Roccia e Cenere; dalla cengia scendono **sei camini** fino al piano,
   e dal piano si scende al sentiero del bosco da un imbocco solo, a
   levante. Sei camini e quattro draghi: è il conto che rende questa
   notte una notte vera.

   Fumo invece parte da più su, dalla cornice, e da lassù **il piano
   non si vede**: quassù si vede lontano solo dove si può camminare, e
   dalla cornice al sentiero ci sono venti passi di roccia. La prima
   cosa che deve fare è scendere a mettersi di vedetta — se resta
   accanto al nido non vedrà arrivare nessuno, e il messaggio che
   aspetta Cenere non partirà mai.

   I tre di ogni squadra si muovono **insieme, passo per passo**: sono
   arrivati in fila indiana e non si sparpagliano. Vuol dire che
   guardano tutti nello stesso momento, e che un camino tenuto un
   attimo prima o un attimo dopo li ferma tutti e tre o nessuno.

   LE TRE SCENE. Cambia quali camini provano e in che ordine — e quindi
   quale drago va dove, chi deve muoversi due volte e quando. Il piano
   si legge sempre; le caselle, se le scrivi a mano, sbagliano due
   volte su tre.
   ═══════════════════════════════════════════════════════════════════ */

const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })
const vedi = complemento => ({ cond: 'vedi', complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })

function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const CAMINI = [3, 7, 11, 15, 19, 23]

const PARETE = (() => {
  const g = tela(28, 20)
  cava(g, 3, 2, 26, 2)       // la cornice del nido, e in fondo il nido
  cava(g, 3, 8, 23, 8)       // la cengia di mezzo: qui aspettano i quattro
  for (const x of CAMINI) cava(g, x, 3, x, 14)   // i sei camini
  cava(g, 1, 15, 26, 15)     // il piano sotto la parete
  cava(g, 26, 15, 26, 18)    // l'imbocco: l'unica discesa al bosco
  cava(g, 2, 18, 26, 18)     // il sentiero del bosco, che porta a valle
  return stampa(g)
})()

/* IL PIANO DEI PRIMI TRE. Tre camini provati in fila, e ogni volta la
   stessa domanda: se lassù c'è qualcosa non si sale, si prova l'altro.
   Al terzo no: al terzo si torna a casa. */
const PRIMI = [
  o('vai', 'piedeA'),
  bivio(vedi('draghi'), [o('vai', 'piedeC')], []),
  bivio(vedi('draghi'), [o('vai', 'piedeE')], []),
  bivio(vedi('draghi'), [o('vai', 'valle')], [o('apri', 'lastra')]),
]

/* IL PIANO DEGLI ALTRI TRE. Arrivano dopo, e la prima è la cengia
   scoperta: lì, con la luna, **un draghetto non ferma nessuno** — di
   là non passano solo se c'è la madre. */
const SECONDI = [
  o('vai', 'piedeB'),
  bivio(vedi('brasa'), [o('vai', 'piedeD')], []),
  bivio(vedi('draghi'), [o('vai', 'valle')], [o('apri', 'lastra')]),
]

export const NIDO_5 = {
  id: 'nido-alba', nome: 'La notte del nido',
  storia: 'nido', capitolo: 5, emoji: '🌅',
  idea: 'Quello che vedi lo aspetti, quello che non vedi te lo dicono',
  forma: 'resistenza', concetto: 'sintesi',
  eredita: ['voce', 'conto', 'corde', 'scala'], lascia: [],

  dritta: "Sei camini e quattro draghi: leggi il loro piano e guarda <b>di che cosa hanno paura</b>. Nei camini basta un drago qualunque; sulla cengia scoperta solo Brasa. Chi deve spostarsi due volte lo fa in due modi: Roccia se li vede arrivare e si sposta da sé, Cenere no — a Cenere glielo deve <b>suonare</b> Fumo.",
  racconto: "Stanotte vengono tutti e sei, e salgono a mani nude. Si vince quando <b>sono tornati giù tutti e sei</b> sul sentiero del bosco: è quella l'alba. Si perde se anche uno solo arriva alla <b>lastra del nido</b> e la sposta. Attenzione: un ladro fermato non è un ladro tornato a casa — se ne cade uno, l'alba non arriva più.",
  aiuti: [
    'Il loro piano dice tre cose: quali camini provano, in che ordine, e di che cosa hanno paura.',
    'Roccia i suoi ce li ha davanti: gli basta <b>aspettare di vederli</b> e poi spostarsi.',
    'Cenere gli altri non li vede nemmeno da lontano: la sua seconda mossa deve cominciare con <b>quando senti</b>, e a suonare è Fumo.',
  ],

  griglia: PARETE, ambiente: 'bosco', celle: true,

  nomi: {
    nido: 'il nido', lastra: 'la lastra del nido', valle: 'il sentiero del bosco',
    piedeA: 'il primo camino', piedeB: 'la cengia scoperta', piedeC: 'il secondo camino',
    piedeD: 'il camino di ponente', piedeE: 'l\'ultimo camino', vedetta: 'la vedetta',
    via: 'via, adesso', draghi: 'i draghi del nido', ladri: 'i ladri',
    brasa: 'Brasa', sbieco: 'Sbieco',
  },
  posti: {
    valle: { x: 13, y: 18 },
    piedeA: { x: 19, y: 14 },
    piedeB: { x: 15, y: 14 },
    piedeC: { x: 11, y: 14 },
    piedeD: { x: 7, y: 14 },
    piedeE: { x: 3, y: 14 },
    vedetta: { x: 23, y: 11 },
  },
  /* la lastra: l'ultimo passo del loro piano è spostarla, e quello è il
     momento in cui la notte è persa */
  porte: { lastra: { x: 25, y: 2 } },
  segnali: ['via'],

  unita: [
    /* Brasa: allo scoperto è l'unica che li ferma, e non insegue
       nessuno — dietro a un uomo non ci arriva mai */
    { id: 'brasa', nome: 'Brasa', fazione: 'draghi', emoji: '🐲', chi: 'orso', manto: 'bruno',
      vista: 6, vita: 14, x: 12, y: 8,
      sa: ['vai', 'attacca', 'aspetta', 'aspettaDiVedere', 'suona', 'quando'] },
    /* Roccia: non si stanca, e quello che gli tocca fermare ce l'ha
       davanti agli occhi */
    { id: 'roccia', nome: 'Roccia', fazione: 'draghi', emoji: '🪨', chi: 'cavaliere',
      vista: 3, vita: 20, x: 13, y: 8,
      sa: ['vai', 'attacca', 'aspetta', 'aspettaDiVedere', 'quando'] },
    /* Cenere: non attacca nessuno, e nei camini stretti basta che ci
       sia */
    { id: 'cenere', nome: 'Cenere', fazione: 'draghi', emoji: '🐉', chi: 'gatto', manto: 'nero',
      vista: 6, vita: 1, x: 14, y: 8,
      sa: ['vai', 'prendi', 'aspetta', 'aspettaDiVedere', 'suona', 'quando'] },
    /* Fumo: vede lontano al buio, non prende e non mena. Stanotte è
       l'unico filo fra i due lati della parete — ma parte dalla
       cornice, e da lassù non vede un bel niente: prima di essere
       utile deve scendere. */
    { id: 'fumo', nome: 'Fumo', fazione: 'draghi', emoji: '🦇', chi: 'goblin',
      vista: 10, vita: 3, x: 23, y: 2,
      sa: ['vai', 'aspetta', 'aspettaDiVedere', 'suona', 'pattuglia', 'quando'] },

    { id: 'capo', nome: 'il capo', fazione: 'ladri', emoji: '🧔', chi: 'capitano',
      vista: 4, vita: 8, x: 21, y: 18 },
    { id: 'tozzo', nome: 'Tozzo', fazione: 'ladri', emoji: '🪚', chi: 'orco',
      vista: 4, vita: 6, x: 21, y: 18 },
    { id: 'pelle', nome: 'Pelle', fazione: 'ladri', emoji: '🧤', chi: 'ladra',
      vista: 4, vita: 4, x: 21, y: 18 },
    { id: 'sbieco', nome: 'Sbieco', fazione: 'ladri', emoji: '🎯', chi: 'guardia',
      vista: 4, vita: 6, x: 5, y: 18 },
    { id: 'mora', nome: 'Mora', fazione: 'ladri', emoji: '🪢', chi: 'ladra',
      vista: 4, vita: 4, x: 5, y: 18 },
    { id: 'riccio', nome: 'Riccio', fazione: 'ladri', emoji: '🧗', chi: 'goblin',
      vista: 4, vita: 4, x: 5, y: 18 },
  ],
  fazioni: {
    draghi: { nome: 'i draghi del nido', autore: 'giocatore' },
    ladri: { nome: 'i sei ladri', autore: 'livello',
             ordini: { capo: PRIMI, tozzo: PRIMI, pelle: PRIMI,
                       sbieco: SECONDI, mora: SECONDI, riccio: SECONDI } },
  },

  complementi: ['nido', 'lastra', 'valle', 'piedeA', 'piedeB', 'piedeC', 'piedeD', 'piedeE',
                'vedetta', 'via', 'ladri', 'sbieco', 'brasa'],

  /* la RESISTENZA detta in sei righe: la notte è finita quando sono
     giù tutti quanti. Non una di meno — ed è per questo che fermarne
     uno per sempre non è una vittoria. */
  obiettivo: [qui('capo', 'valle'), qui('tozzo', 'valle'), qui('pelle', 'valle'),
              qui('sbieco', 'valle'), qui('mora', 'valle'), qui('riccio', 'valle')],
  sconfitta: [{ cond: 'aperta', complemento: 'lastra' }],
  motivoSconfitta: 'Uno di loro è arrivato alla lastra e l\'ha spostata: l\'uovo è nel sacco.',
  mostraNemici: true,
  pianoVisibile: true,

  scenografia: [
    { che: 'roccia', x: 5, y: 2 }, { che: 'ossa', x: 9, y: 2 },
    { che: 'cristallo', x: 17, y: 2 }, { che: 'stalagmite', x: 22, y: 2 },
    { che: 'cristallo', x: 5, y: 8 }, { che: 'ossa', x: 9, y: 8 },
    { che: 'roccia', x: 17, y: 8 }, { che: 'stalagmite', x: 21, y: 8 },
    { che: 'ragnatela', x: 7, y: 5, strato: -1 }, { che: 'ragnatela', x: 19, y: 11, strato: -1 },
    { che: 'cristallo', x: 11, y: 5 }, { che: 'ossa', x: 15, y: 11 },
    { che: 'albero', x: 5, y: 15 }, { che: 'cespuglio', x: 9, y: 15 },
    { che: 'roccia', x: 13, y: 15 }, { che: 'albero', x: 17, y: 15 },
    { che: 'cespuglio', x: 21, y: 15 }, { che: 'pozzanghera', x: 25, y: 15, strato: -1 },
    { che: 'albero', x: 8, y: 18 }, { che: 'cespuglio', x: 11, y: 18 },
    { che: 'albero', x: 16, y: 18 }, { che: 'roccia', x: 19, y: 18 },
    { che: 'cespuglio', x: 25, y: 18 },
  ],

  /* Tre notti: cambia quali camini provano e in che ordine, e quindi
     chi deve andare dove e chi deve muoversi due volte. */
  varianti: [
    { nome: 'i primi da levante, gli altri sulla cengia di mezzo',
      posti: { piedeA: { x: 19, y: 14 }, piedeC: { x: 11, y: 14 }, piedeE: { x: 3, y: 14 },
               piedeB: { x: 15, y: 14 }, piedeD: { x: 7, y: 14 },
               vedetta: { x: 23, y: 11 }, valle: { x: 13, y: 18 } },
      unita: { capo: { x: 21, y: 18 }, tozzo: { x: 21, y: 18 }, pelle: { x: 21, y: 18 },
               sbieco: { x: 5, y: 18 }, mora: { x: 5, y: 18 }, riccio: { x: 5, y: 18 } } },
    { nome: 'i primi in mezzo, gli altri da levante',
      posti: { piedeA: { x: 15, y: 14 }, piedeC: { x: 3, y: 14 }, piedeE: { x: 11, y: 14 },
               piedeB: { x: 19, y: 14 }, piedeD: { x: 7, y: 14 },
               vedetta: { x: 23, y: 11 }, valle: { x: 13, y: 18 } },
      unita: { capo: { x: 21, y: 18 }, tozzo: { x: 21, y: 18 }, pelle: { x: 21, y: 18 },
               sbieco: { x: 5, y: 18 }, mora: { x: 5, y: 18 }, riccio: { x: 5, y: 18 } } },
    { nome: 'tutti e sei verso ponente',
      posti: { piedeA: { x: 19, y: 14 }, piedeC: { x: 15, y: 14 }, piedeE: { x: 7, y: 14 },
               piedeB: { x: 11, y: 14 }, piedeD: { x: 3, y: 14 },
               vedetta: { x: 23, y: 11 }, valle: { x: 13, y: 18 } },
      unita: { capo: { x: 21, y: 18 }, tozzo: { x: 21, y: 18 }, pelle: { x: 21, y: 18 },
               sbieco: { x: 5, y: 18 }, mora: { x: 5, y: 18 }, riccio: { x: 5, y: 18 } } },
  ],

  par: 10,
  soluzioni: [
    /* dieci ordini per quattro draghi, e nessuno di troppo. Brasa
       tiene la cengia scoperta perché di là solo lei li ferma; Roccia
       tiene un camino e poi quello dopo, e se ne accorge da solo
       perché quelli ce li ha davanti; Cenere tiene il camino di
       levante e poi corre a ponente, e quello glielo deve dire Fumo,
       che sta all'imbocco e li vede sbucare dal bosco. */
    { nome: 'ognuno dove può stare solo lui', piano: {
      brasa: [o('vai', 'piedeB')],
      roccia: [o('vai', 'piedeC'), o('aspettaDiVedere', 'ladri'), o('vai', 'piedeE')],
      cenere: [o('vai', 'piedeA'), quando('via', o('vai', 'piedeD'))],
      fumo: [o('vai', 'vedetta'), o('aspettaDiVedere', 'sbieco'), o('suona', 'via')],
    } },
    /* FRAGILE: gli stessi quattro posti scritti a mano, casella per
       casella. Nella prima notte i numeri ci azzeccano; nelle altre
       due i camini che provano sono altri, e i draghi passano la notte
       a guardare la parete vuota. */
    { nome: 'a casella', fragile: true, piano: {
      brasa: [o('vai', '15,14')],
      roccia: [o('vai', '11,14'), o('aspettaDiVedere', 'ladri'), o('vai', '3,14')],
      cenere: [o('vai', '19,14'), quando('via', o('vai', '7,14'))],
      fumo: [o('vai', 'vedetta'), o('aspettaDiVedere', 'sbieco'), o('suona', 'via')],
    } },
  ],

  verifiche: {
    /* srotolate le attese e i «quando senti», tutti e quattro corrono
       subito al secondo posto e il primo resta sguarnito */
    nonInFila: true,
    /* e servono tutti e quattro: quattro posti da tenere e nessuno che
       possa stare in due posti insieme */
    serveOgnuno: true,
    /* prima il camino, poi lo spostamento: al contrario Roccia arriva
       all'ultimo camino quando i primi sono già saliti dal secondo */
    ordineConta: [['vai piedeC', 'vai piedeE']],
  },
}

export default NIDO_5
