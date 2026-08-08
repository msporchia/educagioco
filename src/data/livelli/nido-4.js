/* ═══════════════════════════════════════════════════════════════════
   🥚 IL NIDO DI BRASA — capitolo 4: «La scala di legno»
   forma: sabotaggio · concetto: il ciclo (🔁 pattuglia … finché)

   LA STORIA. Le corde gliele avete prese, e allora si sono messi a
   costruire: una scala di legno appoggiata alla parete, a metà fatta.
   Ancora una notte e ci salgono. Roccia scende a buttarla giù — non
   corre e non si stanca, e quando è arrivato non lo ferma nessuno: il
   problema è **arrivarci**.

   EREDITA **le corde** (la scala esiste solo perché gliele avete
   prese). LASCIA **la scala giù**: la parete torna una parete, e
   l'ultima notte salgono a mani nude.

   COSA INSEGNA. Il giro di ronda: **una riga sola invece di venti**.
   Fumo deve guardare un piano lungo ventiquattro passi e vede fino a
   sei: da fermo, metà piano non lo vede. `pattuglia [due punti] finché
   [vedi i ladri]` è un ordine che dura tutta la notte e finisce da sé
   nel momento giusto — e appena finisce parte l'ordine dopo, che è il
   segnale. È l'unico modo di scrivere «guarda finché non succede».

   E INSEGNA DOVE NON STARE. Un posto di guardia fisso ha due difetti,
   e sono lo stesso difetto: se sta lontano dall'imbocco non li vede
   arrivare, se sta vicino **lo vedono loro**. I due punti del giro
   stanno tutti e due a sei passi buoni dai due imbocchi: Fumo li vede
   e non si fa vedere.

   IL LORO PIANO, che si legge:

       vai al ritrovo
       ❓ vedi i draghi?  sì → (niente)
                         no → prima passiamo dal fuoco
       vai al piede della scala
       apri la scala          ← e da lì sono sopra il nido

   Il ramo del vero è **vuoto**, e vuol dire proprio quello: se sulla
   parete c'è qualcosa che si muove non si perde tempo, alla scala ci
   si corre subito. Da qui esce tutto: quello che compra il tempo a
   Roccia non è la sua velocità — è il giro al fuoco che loro fanno
   **solo se non hanno visto nessuno**. Farsi vedere qui non è una
   mossa: è la sconfitta.

   PERCIÒ CENERE TORNA AL NIDO. È rimasto giù sul piano dalla notte
   delle corde, e sta proprio dove loro sbucano: se è ancora lì quando
   arrivano, l'hanno visto, e il fuoco se lo scordano. Il nido non si
   lascia sguarnito, e stavolta è anche la cosa più urgente da fare.

   LA MAPPA (28×17), la parete e il piano sotto. In cima la cornice del
   nido e la cengia; da lì un canale unico scende fino al piano,
   passando per il ballatoio dove finisce la scala. Il piano è lungo e
   scoperto, con due imbocchi ai due capi che scendono al sentiero del
   bosco: da uno dei due tornano. La scala sta in mezzo: **è una porta
   nel muro**, e finché è a terra la parete non ha passaggi.

   LE TRE SCENE. Cambia da che parte tornano, dove hanno lasciato il
   fuoco e a che ora arrivano. Il giro di Fumo le copre tutte e tre;
   una vedetta ferma a ponente ne indovina una e nelle altre viene
   vista — ed è la soluzione fragile qui in fondo.
   ═══════════════════════════════════════════════════════════════════ */

const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })
/* un giro di ronda: i punti in fila (il primo è anche il complemento) e
   l'uscita. I punti sono caselle e non posti: il giro si segna sulla
   mappa col dito, ed è l'unico ordine che lavora così. */
const giro = (punti, finche) => ({ verbo: 'pattuglia', complemento: punti[0], punti, finche })
const vedi = complemento => ({ cond: 'vedi', complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })

function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const SCALA = (() => {
  const g = tela(28, 17)
  cava(g, 20, 1, 26, 1)      // la cornice del nido
  cava(g, 21, 1, 21, 3)      // la fessura che scende dal nido
  cava(g, 4, 3, 21, 3)       // la cengia alta
  cava(g, 4, 3, 4, 12)       // il canale: l'unica via dalla cengia al piano
  cava(g, 4, 8, 13, 8)       // il ballatoio dove finisce la scala
  cava(g, 13, 9, 13, 11)     // il passaggio della scala (la porta sta in mezzo)
  cava(g, 2, 12, 25, 12)     // il piano sotto la parete: lungo e scoperto
  cava(g, 2, 12, 2, 15)      // l'imbocco di ponente
  cava(g, 25, 12, 25, 15)    // l'imbocco di levante
  cava(g, 2, 15, 25, 15)     // il sentiero del bosco
  return stampa(g)
})()

/* IL PIANO DEI LADRI. Il ramo del vero è vuoto apposta: se hanno visto
   qualcosa non passano dal fuoco, e alla scala arrivano prima. */
const LADRI = [
  o('vai', 'ritrovo'),
  bivio(vedi('draghi'), [], [o('vai', 'fuoco')]),
  o('vai', 'piede'),
  o('apri', 'scala'),
]

export const NIDO_4 = {
  id: 'nido-scala', nome: 'La scala di legno',
  storia: 'nido', capitolo: 4, emoji: '🪜',
  idea: 'Una riga sola che guarda tutta la notte',
  forma: 'sabotaggio', concetto: 'ciclo',
  eredita: ['corde'], lascia: ['scala'],

  dritta: "Fumo vede a sei passi e il piano è lungo ventiquattro: da fermo non basta. <b>Pattuglia</b> fra due punti <b>finché vedi i ladri</b>, e appena li vedi parte l'ordine dopo. Roccia si mette al riparo sul canale e scende <b>quando sente</b>: se lo vedono arrivare, alla scala ci corrono e la alzano.",
  racconto: "La scala è a metà parete e in due notti è finita: se la alzano, sono sopra il nido. Si vince quando <b>Roccia arriva al piede della scala</b> — a quel punto la butta giù da solo — e <b>Cenere è tornato al nido</b>, che sguarnito non si lascia mai. Cenere è rimasto giù sul piano proprio dove loro sbucano: se lo vedono, il fuoco se lo scordano e corrono alla scala.",
  aiuti: [
    'Un giro di ronda vuole <b>due punti e un finché</b>: senza il finché non finisce mai e gli ordini dopo non partono.',
    'Non mettere la vedetta troppo vicino agli imbocchi: chi vede, si fa anche vedere.',
    'Roccia è lento: se aspetta il segnale sulla cengia arriva tardi. Deve aspettarlo <b>già a metà canale</b>.',
  ],

  griglia: SCALA, ambiente: 'bosco', celle: true,

  nomi: {
    nido: 'il nido', piede: 'il piede della scala', scala: 'la scala di legno',
    appostamento: 'il riparo del canale', ritrovo: 'il ritrovo', fuoco: 'il fuoco',
    ora: 'al mio segnale', draghi: 'i draghi del nido', ladri: 'i ladri',
  },
  posti: {
    nido: { x: 25, y: 1 },
    piede: { x: 13, y: 12 },
    appostamento: { x: 4, y: 7 },
    ritrovo: { x: 2, y: 12 },
    fuoco: { x: 25, y: 12 },
  },
  /* la scala è una porta: finché è a terra la parete non ha passaggi, e
     «alzarla» è aprirla. Nessuna chiave: gliela alza chiunque, basta
     arrivarci. */
  porte: { scala: { x: 13, y: 10 } },
  segnali: ['ora'],

  unita: [
    /* Roccia: non corre, non si stanca, e non vede lontano. Regge
       venti colpi e non gliene serve nessuno: qui il suo mestiere è
       arrivare. */
    { id: 'roccia', nome: 'Roccia', fazione: 'draghi', emoji: '🪨', chi: 'cavaliere',
      vista: 3, vita: 20, x: 14, y: 3,
      sa: ['vai', 'attacca', 'aspetta', 'quando'] },
    { id: 'fumo', nome: 'Fumo', fazione: 'draghi', emoji: '🦇', chi: 'goblin',
      vista: 6, vita: 3, x: 14, y: 12,
      sa: ['vai', 'aspetta', 'aspettaDiVedere', 'suona', 'pattuglia'] },
    { id: 'cenere', nome: 'Cenere', fazione: 'draghi', emoji: '🐉', chi: 'gatto', manto: 'nero',
      vista: 6, vita: 1, x: 6, y: 12,
      sa: ['vai', 'prendi', 'aspetta', 'quando'] },

    { id: 'ladro1', nome: 'il capo', fazione: 'ladri', emoji: '🧔', chi: 'capitano',
      vista: 5, vita: 8, x: 20, y: 15 },
    { id: 'ladro2', nome: 'Tozzo', fazione: 'ladri', emoji: '🪚', chi: 'orco',
      vista: 5, vita: 6, x: 21, y: 15 },
    { id: 'ladro3', nome: 'Pelle', fazione: 'ladri', emoji: '🧤', chi: 'ladra',
      vista: 5, vita: 4, x: 22, y: 15 },
  ],
  fazioni: {
    draghi: { nome: 'i draghi del nido', autore: 'giocatore' },
    ladri: { nome: 'i ladri', autore: 'livello',
             ordini: { ladro1: LADRI, ladro2: LADRI, ladro3: LADRI } },
  },

  complementi: ['nido', 'piede', 'scala', 'appostamento', 'ritrovo', 'fuoco', 'ora', 'ladri'],

  obiettivo: [qui('roccia', 'piede'), qui('cenere', 'nido')],
  sconfitta: [{ cond: 'aperta', complemento: 'scala' }],
  motivoSconfitta: 'Hanno alzato la scala: da lì al nido è una passeggiata.',
  mostraNemici: true,
  pianoVisibile: true,

  scenografia: [
    { che: 'corda', x: 12, y: 12 }, { che: 'martello', x: 12, y: 8 },
    { che: 'cassa', x: 10, y: 8 }, { che: 'roccia', x: 6, y: 8 },
    { che: 'albero', x: 8, y: 12 }, { che: 'cespuglio', x: 16, y: 12 },
    { che: 'roccia', x: 19, y: 12 }, { che: 'pozzanghera', x: 22, y: 12, strato: -1 },
    { che: 'albero', x: 4, y: 15 }, { che: 'cespuglio', x: 9, y: 15 },
    { che: 'albero', x: 14, y: 15 }, { che: 'cespuglio', x: 18, y: 15 },
    { che: 'roccia', x: 11, y: 15 },
    { che: 'cristallo', x: 6, y: 3 }, { che: 'roccia', x: 11, y: 3 },
    { che: 'stalagmite', x: 18, y: 3 }, { che: 'ossa', x: 4, y: 5 },
    { che: 'cristallo', x: 4, y: 10 }, { che: 'ossa', x: 21, y: 2 },
    { che: 'cristallo', x: 23, y: 1 },
  ],

  /* Tre notti: da che parte tornano, dove hanno lasciato il fuoco, e a
     che ora si muovono. Il giro le copre tutte e tre. */
  varianti: [
    { nome: 'tornano da ponente, il fuoco a levante',
      posti: { ritrovo: { x: 2, y: 12 }, fuoco: { x: 25, y: 12 } },
      unita: { ladro1: { x: 20, y: 15 }, ladro2: { x: 21, y: 15 }, ladro3: { x: 22, y: 15 } } },
    { nome: 'tornano da levante, il fuoco a ponente',
      posti: { ritrovo: { x: 25, y: 12 }, fuoco: { x: 2, y: 12 } },
      unita: { ladro1: { x: 7, y: 15 }, ladro2: { x: 6, y: 15 }, ladro3: { x: 5, y: 15 } } },
    { nome: 'tornano tardi, da ponente',
      posti: { ritrovo: { x: 3, y: 12 }, fuoco: { x: 24, y: 12 } },
      unita: { ladro1: { x: 23, y: 15 }, ladro2: { x: 22, y: 15 }, ladro3: { x: 21, y: 15 } } },
  ],

  par: 6,
  soluzioni: [
    /* sei ordini: due a Fumo, tre a Roccia, uno a Cenere. Il giro dura
       tutta la notte e finisce da sé; Roccia si porta avanti fin dove
       non lo vedono e scende al segnale; Cenere se ne va dal piano
       prima che arrivino. */
    { nome: 'il giro, il segnale, la discesa', piano: {
      fumo: [giro(['8,12', '19,12'], vedi('ladri')), o('suona', 'ora')],
      roccia: [o('vai', 'appostamento'), quando('ora', o('vai', 'piede'))],
      cenere: [o('vai', 'nido')],
    } },
    /* FRAGILE: la vedetta ferma a ponente invece del giro. Nella notte
       in cui tornano da levante li vede arrivare e funziona; in quelle
       in cui sbucano da ponente se lo trovano davanti — e allora al
       fuoco non ci passano, e alla scala arrivano prima di Roccia. */
    { nome: 'la vedetta ferma a ponente', fragile: true, piano: {
      fumo: [o('vai', '4,12'), o('aspettaDiVedere', 'ladri'), o('suona', 'ora')],
      roccia: [o('vai', 'appostamento'), quando('ora', o('vai', 'piede'))],
      cenere: [o('vai', 'nido')],
    } },
  ],

  verifiche: {
    /* srotolato, il «quando senti» diventa «parti subito»: Roccia si
       trova sul piano scoperto proprio quando arrivano */
    nonInFila: true,
    /* e servono tutti e tre: chi guarda, chi scende e chi se ne va */
    serveOgnuno: true,
    /* prima il giro, poi il segnale: al contrario il segnale parte al
       primo battito, quando Roccia non è ancora in ascolto — e un
       segnale che nessuno sente non lo manda più nessuno */
    ordineConta: [['pattuglia 8,12', 'suona ora']],
  },
}

export default NIDO_4
