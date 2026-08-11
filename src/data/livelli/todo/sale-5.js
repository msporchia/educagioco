/* ═══════════════════════════════════════════════════════════════════
   🧂 LA CAROVANA DEL SALE — capitolo 5: «Il crinale»
   forma: resistenza · concetto: ciclo (il giro di ronda)

   LA STORIA. Sisa non è tornata. È rimasta di là dal crinale e adesso
   è ferma su una cengia sopra il salto, dove il carro non arriva e
   dove nessuno la può prendere: da lassù si scende solo per la scala,
   e la scala è tirata su. I briganti però risalgono il fondovalle per
   venirla a stanare, e risalgono da **uno dei due canaloni** — quello
   di ponente o quello di levante — e da giù non si sa quale.

   EREDITA dal capitolo 4 **Sisa**, che è di là e non può fare altro
   che aspettare: qui il suo piano lo scrive il livello, non tu. Tu le
   puoi solo tenere libera la strada.
   LASCIA **Sisa**, tornata. Nell'ultimo capitolo è lei che conosce il
   versante meglio di tutti.

   COSA INSEGNA. IL CICLO, e la ragione per cui serve. I briganti
   stanno in agguato e **non si muovono finché non gli passa davanti
   qualcuno**: chi li vuole trovare li deve andare a cercare. Ma Vito è
   uno solo e i canaloni sono due: non può stare in due posti, e non
   può nemmeno indovinare. Quello che può fare è **fare avanti e indietro finché
   non li vede** — che è un ordine solo e vale dieci mete contate. E il
   giro ha una **uscita**: senza il «finché» non finisce mai, e gli
   ordini dopo non partono. Il giro largo copre tutto il fondovalle e
   lo copre di rado; il giro stretto il contrario. Chi invece punta un
   canalone solo ne indovina uno su tre.

   E LA RESISTENZA È UN'ALTRA COSA DALLA CORSA: qui non si arriva da
   nessuna parte per primi. Si tiene il fondovalle finché la strada è
   pulita, e **solo allora** si cala la scala. Perché la scala non è
   una porta che si apre e via: è il momento in cui Sisa scende in
   mezzo a loro. Calarla presto è la mossa che uccide.

   LA MAPPA (30×18). Un fondovalle lungo e stretto, due canaloni che ci
   sbucano — uno a ponente, uno a levante — e in mezzo il salto con la
   scala, che è l'unica cosa che unisce il fondovalle alla cengia. La
   cengia è un vicolo cieco: di lassù Sisa vede la scala e null'altro,
   ed è per questo che il suo piano è tutto in due righe — aspetta che
   si apra, e poi scende.
   ═══════════════════════════════════════════════════════════════════ */

/* ── le scorciatoie per scrivere i dati (le stesse di data/generale.js,
      ricopiate qui perché questo file deve stare in piedi da solo) ── */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const giro = (punti, finche) =>
  ({ blocco: 'ripeti', corpo: punti.map(p => ({ verbo: 'vai', complemento: p })), finche })
const vedi = complemento => ({ cond: 'vedi', complemento })
const nonVedi = complemento => ({ cond: 'vedi', complemento, non: true })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const caduto = complemento => ({ cond: 'vivo', complemento, non: true })

function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const VERSANTE = (() => {
  const g = tela(30, 18)
  cava(g, 1, 15, 28, 15)     // il fondovalle
  cava(g, 8, 11, 8, 14)      // il canalone di ponente
  cava(g, 20, 11, 20, 14)    // il canalone di levante
  cava(g, 14, 11, 14, 14)    // il salto, e a metà ci sta la scala
  cava(g, 12, 10, 16, 10)    // la cengia: vicolo cieco sopra la scala
  return stampa(g)
})()

/* IL PIANO DEI BRIGANTI: stare in agguato nel canalone finché non
   passa qualcuno, e poi andare **per la capra** — non per Vito, non
   per Bugo. Da qui escono due cose. La prima: se nessuno gli passa
   davanti non si muovono, e chi li vuole trovare li deve andare a
   cercare. La seconda: chi resta in piedi quando la scala si cala se
   la trova davanti, perché il riparo sta oltre di loro. */
const RISALITA = [
  { verbo: 'aspettaDiVedere', complemento: 'carovana' },
  o('attacca', 'sisa'),
]

/* IL PIANO DI SISA, e non lo scrivi tu: è lei che è di là. Aspetta che
   la scala si cali — la vede, ce l'ha sotto i piedi, e quello che si
   vede si può aspettare — e poi scende e va al riparo. Due righe, e
   nessuna delle due la puoi cambiare: l'unica cosa su cui hai potere è
   **quando** quella scala si cala e **chi c'è sotto** in quel momento. */
const SISA = [
  o('aspetta', 'scala'),
  o('vai', 'riparo'),
]

export const SALE_5 = {
  id: 'sale-crinale', nome: 'Il crinale',
  idea: 'Non puoi stare in due posti: fai il giro finché li vedi',
  storia: 'sale', capitolo: 5, emoji: '🧗',
  forma: 'resistenza', concetto: 'ciclo',
  eredita: ['sisa'], lascia: ['sisa'],

  dritta: 'I canaloni sono due e Vito è uno: fagli fare il <b>giro</b> fra i due imbocchi, e mettici il <b>finché</b> — «finché vede i briganti». Senza il finché il giro non finisce e gli ordini dopo non partono mai. E la scala si cala <b>dopo</b>, non prima: calarla è far scendere Sisa in mezzo a loro.',
  racconto: 'Sisa è sulla cengia sopra il salto: di lassù si scende solo per la scala, che è tirata su. <b>Tocca un brigante e leggi il suo piano</b>: aspettano di veder passare qualcuno, e poi vanno per lei. Risalgono da uno dei due canaloni, e da qui non si sa quale: Vito deve <b>girare</b> fra i due finché non li vede, e poi toglierli di mezzo tutti. Solo allora chiama Bugo, che prende la corda e cala la scala. Si vince quando Sisa è al riparo; si perde se la prendono.',
  aiuti: [
    'Il giro vuole due punti e un <b>finché</b>: senza uscita non finisce, e Vito non attacca mai nessuno.',
    'Sono in tre: un «attacca» ne toglie di mezzo uno solo. Quello che avanza resta lì, e il riparo sta oltre di lui.',
    'La scala si cala per ultima. Bugo non deve indovinare quando: glielo dice Vito con un <b>segnale</b>.',
  ],

  griglia: VERSANTE, ambiente: 'grotta',
  /* le caselle si possono nominare: un giro di ronda è una lista di
     punti sulla mappa, e i punti non hanno un nome */
  celle: true,

  nomi: {
    scala: 'la scala del salto', corda: 'la corda',
    riparo: 'il riparo', scalino: 'il piede della scala', cengia: 'la cengia',
    carovana: 'la carovana', briganti: 'i briganti del passo',
  },
  posti: {
    riparo: { x: 1, y: 15 },
    scalino: { x: 14, y: 15 },
    cengia: { x: 14, y: 10 },
  },
  porte: {
    scala: { x: 14, y: 13, chiave: 'corda' },
  },
  oggetti: [
    { nome: 'corda', em: '🪢', pittore: 'corda', x: 18, y: 15 },
  ],
  segnali: ['viaLibera'],

  unita: [
    /* Vito è l'unico che si comanda davvero, ed è uno solo: tutto il
       capitolo esce da lì. */
    { id: 'vito', nome: 'Vito', fazione: 'carovana', emoji: '🛡️', chi: 'cavaliere',
      vista: 5, vita: 18, x: 14, y: 15, sa: ['vai', 'attacca', 'pattuglia', 'suona'] },
    { id: 'bugo', nome: 'Bugo', fazione: 'carovana', emoji: '🔧', chi: 'ladra',
      vista: 4, vita: 6, x: 16, y: 15, sa: ['vai', 'prendi', 'apri', 'quando'] },
    /* Sisa è dei nostri ma qui non prende ordini da te: il suo piano lo
       scrive il livello ed è scritto sopra. Si legge, non si cambia. */
    { id: 'sisa', nome: 'Sisa', fazione: 'carovana', emoji: '🐐', chi: 'gatto', manto: 'bianco',
      vista: 4, vita: 1, x: 14, y: 10 },
    { id: 'brigante1', nome: 'un brigante', fazione: 'briganti', emoji: '🪓', chi: 'orco',
      vista: 4, vita: 3, x: 8, y: 12 },
    { id: 'brigante2', nome: 'un altro brigante', fazione: 'briganti', emoji: '🪓', chi: 'orco',
      vista: 4, vita: 3, x: 8, y: 13 },
    { id: 'brigante3', nome: 'il terzo brigante', fazione: 'briganti', emoji: '🪓', chi: 'orco',
      vista: 4, vita: 3, x: 8, y: 14 },
  ],
  fazioni: {
    carovana: { nome: 'la carovana', autore: 'giocatore', ordini: { sisa: SISA } },
    briganti: { nome: 'i briganti del passo', autore: 'livello',
                ordini: { brigante1: RISALITA, brigante2: RISALITA, brigante3: RISALITA } },
  },

  complementi: ['scala', 'corda', 'riparo', 'scalino', 'cengia', 'briganti', 'viaLibera'],
  /* la domanda del «finché» è una sola, e ha due versi. Con le caselle
     in gioco la lista automatica sarebbe lunga come il fondovalle: qui
     si dosa a mano. */
  condizioni: [vedi('briganti'), nonVedi('briganti'),
               vedi('sisa'), nonVedi('sisa')],

  obiettivo: [qui('sisa', 'riparo')],
  sconfitta: [caduto('sisa')],
  motivoSconfitta: 'I briganti hanno preso Sisa al piede della scala.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA — solo disegno, non passa dal motore ── */
  scenografia: [
    { che: 'stalagmite', x: 2, y: 15 }, { che: 'ossa', x: 6, y: 15 },
    { che: 'pozzanghera', x: 11, y: 15, strato: -1 }, { che: 'roccia', x: 13, y: 15 },
    { che: 'cristallo', x: 19, y: 15 }, { che: 'stalagmite', x: 22, y: 15 },
    { che: 'acqua', x: 26, y: 15, strato: -1 }, { che: 'ossa', x: 27, y: 15 },
    { che: 'roccia', x: 8, y: 11 }, { che: 'roccia', x: 20, y: 11 },
    { che: 'ragnatela', x: 14, y: 14, strato: -1 },
    { che: 'cristallo', x: 13, y: 10 }, { che: 'falo', x: 15, y: 10 },
  ],

  /* Tre scene, e cambia **da dove risalgono** e **da che parte è il
     riparo**: ponente in fondo al canalone, levante in fondo al
     canalone, e ponente ma già fuori nel fondovalle. Il riparo sta
     sempre **oltre di loro**, così la strada di Sisa passa per forza da
     dove sono: sgombrare non è un extra, è la strada. Chi ha scritto
     «vai al canalone di ponente» invece del giro ne vince una. */
  varianti: [
    { nome: 'risalgono dal canalone di ponente',
      unita: { brigante1: { x: 8, y: 12 }, brigante2: { x: 8, y: 13 }, brigante3: { x: 8, y: 14 },
               vito: { x: 14, y: 15 }, bugo: { x: 16, y: 15 }, sisa: { x: 14, y: 10 } },
      oggetti: { corda: { x: 18, y: 15 } },
      posti: { riparo: { x: 1, y: 15 }, scalino: { x: 14, y: 15 }, cengia: { x: 14, y: 10 } } },
    { nome: 'risalgono dal canalone di levante',
      unita: { brigante1: { x: 20, y: 12 }, brigante2: { x: 20, y: 13 }, brigante3: { x: 20, y: 14 },
               vito: { x: 14, y: 15 }, bugo: { x: 12, y: 15 }, sisa: { x: 16, y: 10 } },
      oggetti: { corda: { x: 10, y: 15 } },
      posti: { riparo: { x: 28, y: 15 }, scalino: { x: 14, y: 15 }, cengia: { x: 16, y: 10 } } },
    { nome: 'sono già fuori dal canalone di ponente',
      unita: { brigante1: { x: 9, y: 15 }, brigante2: { x: 10, y: 15 }, brigante3: { x: 8, y: 14 },
               vito: { x: 15, y: 15 }, bugo: { x: 17, y: 15 }, sisa: { x: 12, y: 10 } },
      oggetti: { corda: { x: 18, y: 15 } },
      posti: { riparo: { x: 1, y: 15 }, scalino: { x: 14, y: 15 }, cengia: { x: 12, y: 10 } } },
  ],

  par: 8,
  soluzioni: [
    /* otto ordini, ed è il par. Cinque a Vito: **un** giro con la sua
       uscita, tre «attacca» perché un attacca vale un brigante, e il
       segnale in fondo. Tre a Bugo, tutti dentro l'ascolto, perché
       prima del segnale non c'è niente da fare — e fare qualcosa
       sarebbe peggio che stare fermi. */
    { nome: 'il giro largo, e la scala per ultima', piano: {
      vito: [giro(['3,15', '25,15'], vedi('briganti')),
             o('attacca', 'briganti'), o('attacca', 'briganti'), o('attacca', 'briganti'),
             o('suona', 'viaLibera')],
      bugo: [quando('viaLibera', o('prendi', 'corda'), o('apri', 'scala'))],
    } },
    /* lo stesso giro, più corto: da un imbocco all'altro invece che da
       un capo all'altro del fondovalle. Funziona uguale, e costa uguale
       — perché quello che conta non è quanto è largo il giro, è che
       **passi da dove sono** e che **finisca quando li vede**. Un giro
       ancora più stretto, fra due punti in mezzo al fondovalle, non
       arriverebbe mai fino ai canaloni: girerebbe a vuoto per sempre,
       ed è il modo in cui un ciclo si sbaglia davvero. */
    { nome: 'il giro corto, da imbocco a imbocco', piano: {
      vito: [giro(['8,15', '20,15'], vedi('briganti')),
             o('attacca', 'briganti'), o('attacca', 'briganti'), o('attacca', 'briganti'),
             o('suona', 'viaLibera')],
      bugo: [quando('viaLibera', o('prendi', 'corda'), o('apri', 'scala'))],
    } },
    /* FRAGILE: niente giro, «tanto salgono da ponente». Nelle due scene
       in cui è vero questo piano vince; in quella in cui risalgono da
       levante Vito resta piantato all'imbocco sbagliato a guardare un
       canalone vuoto, non chiama mai, e la scala non si cala. Indovinare
       non è decidere. */
    { nome: 'tanto salgono da ponente', fragile: true, piano: {
      vito: [o('vai', '5,15'),
             o('attacca', 'briganti'), o('attacca', 'briganti'), o('attacca', 'briganti'),
             o('suona', 'viaLibera')],
      bugo: [quando('viaLibera', o('prendi', 'corda'), o('apri', 'scala'))],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ── */
  verifiche: {
    /* srotolato l'ascolto, Bugo cala la scala al primo battito: Sisa
       scende mentre i briganti sono ancora tutti in piedi, e la strada
       verso il riparo passa proprio di lì */
    nonInFila: true,
    /* due mestieri che non si sovrappongono: Vito non cala scale, Bugo
       non tiene il fondovalle */
    serveOgnuno: true,
    /* la corda prima della scala: è la stessa prossimità del capitolo 2,
       e qui è l'ultimo gesto della storia che si può ancora sbagliare */
    ordineConta: [['prendi corda', 'apri scala']],
    /* e senza la corda la scala resta su: dalla cengia non c'è
       nessun'altra strada, e Sisa aspetta lassù per sempre */
    senza: ['corda'],
  },
}

export default SALE_5
