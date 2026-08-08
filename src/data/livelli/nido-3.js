/* ═══════════════════════════════════════════════════════════════════
   🥚 IL NIDO DI BRASA — capitolo 3: «Il richiamo»
   forma: esca · concetto: gli eventi (📣 suona e 🎬 quando senti)

   LA STORIA. Dalla mappa del capitolo 2 si sa tutto: quanti sono, dove
   dormono, e che senza **le corde** alla parete non ci salgono. Le
   corde stanno in mezzo alle tende, in un vicolo che ha una bocca
   sola, e attorno ci stanno seduti in tre. Cenere può portarle via —
   ma solo se in quel vicolo non c'è più nessuno.

   EREDITA **il conto** (la mappa dice dove tengono la roba e chi fa il
   turno). LASCIA **le corde**: al nido, e alla parete non si sale più
   a mani nude — per questo nel capitolo 4 si mettono a costruire.

   COSA INSEGNA. Che due che non si vedono si mettono d'accordo solo in
   un modo: **uno parla e l'altro ascolta**. Fumo si fa vedere alto
   sopra il fuoco, la vedetta grida, e tutti mollano quello che stanno
   facendo e corrono da lei — corrono *dove hanno visto*, che è
   l'unica cosa che si può prevedere di uno che reagisce. Ma Cenere,
   giù dietro le tende, **non vede niente di tutto questo**: non sa se
   sono usciti, non sa quanti ne mancano. Glielo deve dire Fumo, e
   glielo dice con un segnale — 📣 «al mio segnale» — mentre la fila
   di Cenere comincia con 🎬 «quando senti».

   E IL SEGNALE NON VA MANDATO SUBITO. Il vicolo delle corde ha una
   bocca sola: quelli che escono e Cenere che entra passano dalla
   stessa fessura. Se Fumo suona appena lo vedono, Cenere se li trova
   addosso a metà vicolo. Fumo deve aspettare di vedersi arrivare
   **il capo** — che è quello seduto più vicino alla bocca, e quindi il
   primo a sbucare dall'altra parte: quando lo vede passare sotto, il
   vicolo è vuoto.

   E FUMO DEVE ANDARSENE. La sporgenza è un bel posto per farsi vedere
   e un pessimo posto dove restare: dopo il segnale arrivano tutti lì
   sotto, e chi *non* è la vedetta, se vede un drago, grida 🆘 — e
   allora la notte è persa. Farsi vedere una volta è la mossa; farsi
   vedere due volte è la fine.

   BRASA NON SI MUOVE, ed è scritto nella scena: è sul nido e ci resta.
   Se scende lei, quelli si accorgono che il nido è sguarnito, e non
   c'è nessun ordine che possa rimediare. In questo capitolo la cosa
   più difficile è **non usare** l'unità più forte che hai.

   LA MAPPA (28×17). In alto la cornice del nido e la cengia che la
   percorre; da lì si scende in due punti, a ponente (dove sta il
   fuoco) e a levante. L'accampamento è due corsie — quella di sopra e
   quella di sotto — e in mezzo le tende, che non si attraversano: **il
   vicolo delle corde** ci sta dentro e si apre solo a levante. La
   sporgenza sopra il fuoco è il posto dove la vedetta non può non
   vederti. Le tende sono in mezzo per una ragione che si vede
   giocando: si vede lontano solo dove si può camminare.

   LE TRE SCENE. Cambia dove sono finite le corde nel vicolo, dove
   stanno seduti i tre e dove si è appostato Cenere. Il piano è sempre
   lo stesso — fatti vedere, aspetta che siano usciti tutti, poi
   suona — ma chi suona appena lo vedono ne indovina una e sbaglia le
   altre.
   ═══════════════════════════════════════════════════════════════════ */

const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })

function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const CAMPO = (() => {
  const g = tela(28, 17)
  cava(g, 20, 1, 26, 1)      // la cornice del nido
  cava(g, 21, 1, 21, 3)      // la fessura che scende dal nido
  cava(g, 5, 3, 23, 3)       // la cengia alta sopra l'accampamento
  cava(g, 5, 3, 5, 8)        // la discesa di ponente, sopra il fuoco
  cava(g, 23, 3, 23, 12)     // la discesa di levante
  cava(g, 3, 8, 23, 8)       // la corsia di sopra
  cava(g, 3, 12, 23, 12)     // la corsia di sotto
  cava(g, 5, 8, 5, 12)       // il passaggio di ponente: il fuoco è in fondo
  cava(g, 7, 10, 16, 10)     // il vicolo delle corde: una bocca sola
  cava(g, 16, 11, 16, 11)    // ...e la bocca è questa
  cava(g, 19, 13, 19, 15)    // la buca dove si appiatta Cenere
  return stampa(g)
})()

export const NIDO_3 = {
  id: 'nido-richiamo', nome: 'Il richiamo',
  storia: 'nido', capitolo: 3, emoji: '🔔',
  idea: 'Chi vede lo dice, chi non vede aspetta che glielo dicano',
  forma: 'esca', concetto: 'eventi',
  eredita: ['conto'], lascia: ['corde'],

  dritta: "Fumo si fa vedere e loro corrono <b>dove hanno visto</b>. Ma Cenere, dietro le tende, non vede niente: glielo deve dire Fumo. E non subito — il vicolo ha una bocca sola, e chi entra mentre gli altri escono ci sbatte contro. Aspetta di vedere <b>il capo</b>: è il primo a sbucare, e dopo di lui il vicolo è vuoto.",
  racconto: "Le corde stanno in mezzo alle tende, e senza corde alla parete non si sale. La vedetta al fuoco grida <b>«nemico in vista»</b> appena vede qualcosa, e tutti corrono da lei: è quello che ci serve. Ma chiunque altro veda un drago grida <b>«aiuto»</b>, e allora è finita. Si vince quando <b>le corde sono al nido, addosso a Cenere</b>. Brasa resta sull'uovo: se scende lei, si accorgono che il nido è sguarnito.",
  aiuti: [
    'La fila di Cenere deve cominciare con <b>quando senti</b>: da solo non può sapere quando è il momento.',
    'Il vicolo delle corde ha una bocca sola: se Cenere entra mentre loro escono, se li trova addosso.',
    'La sporgenza è un buon posto per farsi vedere e un pessimo posto dove restare: dopo il segnale Fumo se ne deve andare.',
  ],

  griglia: CAMPO, ambiente: 'bosco',

  nomi: {
    nido: 'il nido', sporgenza: 'la sporgenza sopra il fuoco',
    corde: 'le corde', ora: 'al mio segnale',
    draghi: 'i draghi del nido', ladri: 'i ladri', capo: 'il capo',
  },
  posti: {
    nido: { x: 25, y: 1 },
    sporgenza: { x: 5, y: 10 },
  },
  oggetti: [{ nome: 'corde', em: '🪢', x: 10, y: 10 }],
  segnali: ['ora', 'nemico', 'aiuto'],

  unita: [
    /* Fumo vede a dieci passi e non prende e non mena: tutto quello
       che sa fare è guardare, farsi guardare e dirlo. In questo
       capitolo basta e avanza. */
    { id: 'fumo', nome: 'Fumo', fazione: 'draghi', emoji: '🦇', chi: 'goblin',
      vista: 10, vita: 3, x: 25, y: 1,
      sa: ['vai', 'aspetta', 'aspettaDiVedere', 'suona'] },
    /* Cenere è già appostato nella buca dietro le tende: da lì non
       vede l'accampamento, e non lo vede nessuno */
    { id: 'cenere', nome: 'Cenere', fazione: 'draghi', emoji: '🐉', chi: 'gatto', manto: 'nero',
      vista: 6, vita: 1, x: 19, y: 15,
      sa: ['vai', 'prendi', 'aspetta', 'quando'] },
    /* Brasa è sull'uovo, e questa volta il piano più corto è quello
       che non la nomina mai */
    { id: 'brasa', nome: 'Brasa', fazione: 'draghi', emoji: '🐲', chi: 'orso', manto: 'bruno',
      vista: 6, vita: 14, x: 24, y: 1,
      sa: ['vai', 'attacca', 'aspetta', 'suona'] },

    /* la vedetta: è lei che deve vedere Fumo, ed è l'unica che grida
       «nemico in vista» invece di «aiuto» */
    { id: 'vedetta', nome: 'la vedetta del fuoco', fazione: 'ladri', emoji: '🔦', chi: 'guardia',
      vista: 3, vita: 6, x: 5, y: 12, grida: 'nemico' },
    /* i tre seduti nel vicolo: al grido mollano tutto e corrono là.
       Il capo è quello più vicino alla bocca: è il primo a uscire, ed
       è per questo che Fumo aspetta di vedere lui. */
    { id: 'capo', nome: 'il capo', fazione: 'ladri', emoji: '🧔', chi: 'capitano',
      vista: 2, vita: 8, x: 12, y: 10, grida: 'aiuto', accorre: 'nemico' },
    { id: 'tozzo', nome: 'Tozzo', fazione: 'ladri', emoji: '🪢', chi: 'orco',
      vista: 2, vita: 6, x: 9, y: 10, grida: 'aiuto', accorre: 'nemico' },
    { id: 'pelle', nome: 'Pelle', fazione: 'ladri', emoji: '🧤', chi: 'ladra',
      vista: 2, vita: 4, x: 7, y: 10, grida: 'aiuto', accorre: 'nemico' },
    /* e due che dormono nella corsia di sotto: sono il resto dei sei */
    { id: 'dorme1', nome: 'un ladro che dorme', fazione: 'ladri', emoji: '😴', chi: 'ladra',
      vista: 0, vita: 4, x: 9, y: 12 },
    { id: 'dorme2', nome: 'un ladro che dorme', fazione: 'ladri', emoji: '😴', chi: 'guardia',
      vista: 0, vita: 4, x: 13, y: 12 },
  ],
  fazioni: {
    draghi: { nome: 'i draghi del nido', autore: 'giocatore' },
    ladri: { nome: 'i ladri accampati', autore: 'livello' },
  },

  complementi: ['nido', 'sporgenza', 'corde', 'ora', 'capo', 'ladri'],

  obiettivo: [ha('cenere', 'corde'), qui('cenere', 'nido')],
  sconfitta: [{ cond: 'segnale', complemento: 'aiuto' }],
  motivoSconfitta: 'Qualcuno che non era la vedetta ha visto un drago e ha gridato aiuto.',
  mostraNemici: true,
  pianoVisibile: true,

  scenografia: [
    { che: 'falo', x: 4, y: 12 }, { che: 'tenda', x: 6, y: 12 },
    { che: 'tenda', x: 11, y: 12 }, { che: 'sacco', x: 15, y: 12 },
    { che: 'cassa', x: 17, y: 12 }, { che: 'botte', x: 21, y: 12 },
    { che: 'corda', x: 16, y: 10 }, { che: 'cassa', x: 11, y: 10 },
    { che: 'roccia', x: 7, y: 8 }, { che: 'cespuglio', x: 12, y: 8 },
    { che: 'albero', x: 17, y: 8 }, { che: 'roccia', x: 21, y: 8 },
    { che: 'pozzanghera', x: 3, y: 8, strato: -1 },
    { che: 'roccia', x: 8, y: 3 }, { che: 'cespuglio', x: 14, y: 3 },
    { che: 'stalagmite', x: 19, y: 3 }, { che: 'cristallo', x: 5, y: 6 },
    { che: 'ossa', x: 23, y: 6 }, { che: 'ragnatela', x: 19, y: 13, strato: -1 },
    { che: 'cristallo', x: 22, y: 1 }, { che: 'ossa', x: 26, y: 1 },
  ],

  /* Tre notti: cambia dove sono finite le corde nel vicolo, come sono
     seduti i tre e dove si è appiattato Cenere. Il piano regge sempre;
     il segnale mandato troppo presto no. */
  varianti: [
    { nome: 'le corde in fondo al vicolo',
      oggetti: { corde: { x: 10, y: 10 } },
      unita: { capo: { x: 12, y: 10 }, tozzo: { x: 9, y: 10 }, pelle: { x: 7, y: 10 },
               cenere: { x: 19, y: 15 } } },
    { nome: 'le corde vicino alla bocca',
      oggetti: { corde: { x: 14, y: 10 } },
      unita: { capo: { x: 13, y: 10 }, tozzo: { x: 10, y: 10 }, pelle: { x: 8, y: 10 },
               cenere: { x: 19, y: 14 } } },
    { nome: 'i tre seduti sulla bocca, le corde in fondo',
      oggetti: { corde: { x: 8, y: 10 } },
      unita: { capo: { x: 15, y: 10 }, tozzo: { x: 14, y: 10 }, pelle: { x: 13, y: 10 },
               cenere: { x: 23, y: 10 } } },
  ],

  par: 7,
  soluzioni: [
    /* sette ordini: quattro a Fumo, tre a Cenere, e Brasa non si
       nomina. Ognuno serve — senza la sporgenza non lo vede nessuno,
       senza l'attesa il segnale arriva troppo presto, senza il segnale
       Cenere non parte mai, senza l'ultimo volo Fumo resta lì sotto
       quando arrivano tutti. */
    { nome: 'fatti vedere, aspetta il capo, poi suona', piano: {
      fumo: [o('vai', 'sporgenza'), o('aspettaDiVedere', 'capo'),
             o('suona', 'ora'), o('vai', 'nido')],
      cenere: [quando('ora', o('prendi', 'corde'), o('vai', 'nido'))],
    } },
    /* FRAGILE: suonare appena ti vedono. Regge nella notte in cui
       Cenere è appostato più lontano e ci mette tanto ad arrivare;
       nelle altre due entra nel vicolo mentre quelli ne stanno ancora
       uscendo, e nel vicolo non si passa in due. */
    { nome: 'suona subito', fragile: true, piano: {
      fumo: [o('vai', 'sporgenza'), o('suona', 'ora'), o('vai', 'nido')],
      cenere: [quando('ora', o('prendi', 'corde'), o('vai', 'nido'))],
    } },
  ],

  verifiche: {
    /* srotolato, il «quando senti» diventa «parti subito» e l'attesa
       sparisce: Cenere entra nel vicolo mentre loro escono */
    nonInFila: true,
    /* e non se ne salva nessuno da solo: Fumo non prende niente,
       Cenere da solo aspetta un segnale che non arriva */
    serveOgnuno: true,
    /* prima farsi vedere, poi suonare: al contrario il segnale parte
       quando ancora nessuno si è mosso */
    ordineConta: [['vai sporgenza', 'suona ora']],
    /* e senza le corde non si torna con niente */
    senza: ['corde'],
  },
}

export default NIDO_3
