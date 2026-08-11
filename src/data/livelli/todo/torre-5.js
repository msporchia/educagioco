/* ════════════════════════════════════════════════════════════════════
   🗝️ I PRIGIONIERI DELLA TORRE — capitolo 5: «La porta di servizio»
   forma: fuga · concetto: tutto insieme (sintesi)

   LA STORIA. Ultima notte. La corda del pozzo è per terra accanto a
   Marta, la porta di servizio è quella lasciata aperta tre notti fa e
   nessuno l'ha richiusa, e in fondo ai camminamenti c'è il muro di
   cinta. Si esce in quattro o non si esce: chi resta dentro fa perdere.

   COSA INSEGNA. Niente di nuovo, ed è il punto. Tutto quello che serve
   è già stato usato una volta:

     · **chi la prende non è chi la usa** (cap. 1) — la corda la porta
       Marta, il muro lo passano tutti e quattro;
     · **una porta chiusa è anche un'attesa** (cap. 2) — «vai» davanti a
       un muro chiuso non fallisce: aspetta. Ed è la trappola di questo
       capitolo, non un aiuto;
     · **chi non vede se lo deve far dire** (cap. 3) — Pero non vede il
       muro da dov'è, e l'unico modo di dirgli «adesso» è un segnale;
     · **farsi guardare è una mossa** (cap. 4) — qui è *la* mossa, e va
       fatta due volte, apposta, dalla parte giusta.

   ── IL MESTIERE DI QUESTO CAPITOLO ─────────────────────────────────
   Le tre guardie non gridano — la torre dorme, e una che è sola va a
   vedere di persona: **si attacca alla prima che vede e non la molla
   più**. Quello è l'errore che si usa, e se ne ricava una regola sola:
   *prima passa chi tiene, per ultimo chi non tiene*.

       Cric   scende di sotto e si mette davanti alla prima guardia
       Nilo   scende di sotto e si mette davanti alla seconda
       Marta  va di sopra, che è la strada libera, e il capoposto del
              muro se lo prende lei mentre apre
       Pero   non si muove finché Marta non suona «🚪 il muro è aperto»

   **Scendere di sotto è un ordine, non una conseguenza.** Il
   camminamento di sopra è più corto, e chi non dice niente ci va da
   solo: «vai alla campagna» sceglie sempre la strada corta. Ma le due
   guardie che contano stanno di sotto, e di sotto ci deve passare
   Pero. Togli a Cric il suo posto e la prima guardia resta libera:
   quando il vecchio si muove, se lo trova davanti. Togli il suo a
   Nilo, e succede la stessa cosa quaranta passi più in là.

   ── PERCHÉ NON SI VINCE IN FILA ────────────────────────────────────
   Perché le tre cose devono succedere in tre punti diversi dello stesso
   momento: due che si fanno guardare di sotto, una che apre il muro di
   sopra, e il vecchio fermo finché tutto è a posto. Se Cric e Nilo non
   si fermano ma tirano dritto verso la campagna, si ritrovano insieme
   davanti al muro ancora chiuso — e lì due guardie si attaccano alla
   stessa persona: una la si regge, due no. Se Pero parte da solo, parte
   nell'istante sbagliato: «vai» aspetta che il muro si apra, ma non
   aspetta che sia **il momento**, e le due cose non sono la stessa.

   LA MAPPA. 22×9. A ponente la stanza da cui si esce e la **porta di
   servizio** (1,4), rimasta aperta dal capitolo 2: non c'è niente da
   aprire, si passa e basta. Poi due camminamenti paralleli — quello di
   **sopra** (y5), sgombro, e quello di **sotto** (y7), dove stanno le
   due guardie e dove sta Pero — uniti da due sole scale, a ponente
   (1,6) e sotto il muro (18,6). In fondo il **muro** (19,6), che senza
   venti braccia di corda è solo un muro, e di là la campagna.

   EREDITA: **la porta di servizio** (aperta dal cap. 2), **la corda**
   (dal cap. 4) e **Pero** (dal cap. 3) — lento come sempre, e prezioso
   come sempre.
   LASCIA: niente. La storia finisce qui, e finisce fuori.
   ════════════════════════════════════════════════════════════════════ */

/* le solite scorciatoie */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const caduto = complemento => ({ cond: 'vivo', complemento, non: true })

/* I due camminamenti, 22 colonne per 9 righe.
     x1-4  y1-3    la stanza da cui si esce
     (1,4)         la porta di servizio, lasciata aperta tre notti fa
     x1-18 y5      il camminamento di sopra: nessuna guardia, ed è la
                   strada corta — quella che il piede prende da solo
     x1-18 y7      il camminamento di sotto: due guardie, e Pero
     (1,6),(18,6)  le due scale che uniscono i camminamenti
     (19,6)        il muro: si passa solo con la corda
     x20   y5-7    la campagna */
const CAMMINAMENTO = [
  '######################',
  '#....#################',
  '#....#################',
  '#....#################',
  '#.####################',
  '#..................#.#',
  '#.################...#',
  '#..................#.#',
  '######################',
]

/* IL PIANO DI UNA GUARDIA, ed è lo stesso per tutte e tre: due righe,
   e si leggono toccandola. Aspetta di veder passare qualcuno, e da quel
   momento **sta addosso a quello lì**. Non grida — non c'è nessuno da
   chiamare, la torre dorme — e non torna al suo posto: si è scelta la
   sua preda e se la tiene. È l'errore che si può usare, ed è tutto il
   capitolo. */
const ADDOSSO = [
  o('aspettaDiVedere', 'prigionieri'),
  o('attacca', 'prigionieri'),
]

export const TORRE_5 = {
  id: 'torre-fuori', nome: 'La porta di servizio',
  storia: 'torre', capitolo: 5, emoji: '🌙',
  forma: 'fuga', concetto: 'sintesi',
  idea: 'La strada corta la prende il piede da solo: quella che serve va detta',
  eredita: ['porta', 'corda', 'pero'], lascia: [],

  dritta: "Niente di nuovo, e niente da attaccare: non lo sa fare nessuno. Tocca una guardia e leggi: <b>si attacca alla prima che vede e non la molla più</b>. Il camminamento di sopra è sgombro ed è la strada corta — ci si va da soli. Ma le due guardie stanno <b>di sotto</b>, ed è di sotto che deve passare Pero: mandaci Cric e Nilo <b>prima</b>, uno davanti a ciascuna. Marta va di sopra e si prende il capoposto mentre apre il muro. Pero per ultimo, e glielo deve dire qualcuno.",
  racconto: "La corda serve per il muro, ma il muro è in fondo ai camminamenti. Si esce dalla <b>porta di servizio</b> lasciata aperta tre notti fa, e <b>si esce in quattro</b>: chi resta dentro fa perdere. Le tre guardie non gridano — vanno addosso alla prima persona che vedono e non la mollano più. Marta, Nilo e Cric reggono gli spintoni; <b>Pero cade al primo urto</b>, e Pero è già giù nel camminamento di sotto.",
  aiuti: [
    'Tocca una guardia: si attacca alla <b>prima</b> persona che vede, e non cambia più idea.',
    '«Vai alla campagna» prende la strada corta, e la strada corta è quella di sopra. Se vuoi che qualcuno scenda di sotto, glielo devi dire.',
    'Il muro non si apre senza la corda, e la corda è per terra accanto a Marta.',
    'Pero non vede il muro da dove sta. E anche quando il muro si apre, non è detto che sia il momento: quello glielo deve suonare qualcuno.',
  ],

  griglia: CAMMINAMENTO, ambiente: 'camminamento',
  celle: true,
  mostraNemici: true,

  nomi: {
    corda: 'la corda',
    muro: 'il muro di cinta',
    fuori: 'la campagna',
    esca: 'davanti alla prima guardia',
    vedetta: 'davanti alla seconda guardia',
    aperta: 'il muro è aperto',
    prima: 'la prima guardia',
    seconda: 'la seconda guardia',
    capo: 'il capoposto del muro',
    prigionieri: 'i prigionieri',
    torre: 'le guardie della torre',
  },
  posti: {
    esca: { x: 4, y: 7 },
    vedetta: { x: 11, y: 7 },
    fuori: { x: 20, y: 6 },
  },
  porte: {
    /* la porta di servizio non si apre: **è già aperta**, dal secondo
       capitolo, e nessuno l'ha richiusa. Sta in mappa perché il filo
       si deve vedere, non perché ci sia qualcosa da fare */
    portaservizio: { x: 1, y: 4, aperta: true },
    /* il muro non è chiuso a chiave: è alto. La «chiave» è la corda, ed
       è il modo che il gioco ha di dire che senza quella non si passa */
    muro: { x: 19, y: 6, chiave: 'corda' },
  },
  oggetti: [
    { nome: 'corda', em: '🪢', x: 4, y: 1 },
  ],
  segnali: ['aperta'],

  unita: [
    /* i nostri per primi nella lista: chi cammina non le prende, chi
       sta fermo sì. È la ragione per cui piantarsi davanti a una guardia
       costa qualcosa — e la ragione per cui costa meno che ritrovarsi
       in tre davanti allo stesso muro chiuso */
    /* Cric non sa suonare — è un topo — ma un «quando arriva» ce l'ha:
       ascoltare non è parlare */
    { id: 'cric', nome: 'Cric', fazione: 'prigionieri', emoji: '🐭', chi: 'gatto', manto: 'nero',
      vista: 3, vita: 30, x: 1, y: 3, sa: ['vai', 'prendi', 'aspetta', 'quando'] },
    { id: 'nilo', nome: 'Nilo', fazione: 'prigionieri', emoji: '🪶', chi: 'elfo',
      vista: 4, vita: 30, x: 2, y: 2,
      sa: ['vai', 'prendi', 'aspetta', 'aspettaDiVedere', 'suona', 'pattuglia', 'quando'] },
    { id: 'marta', nome: 'Marta', fazione: 'prigionieri', emoji: '🪡', chi: 'ladra',
      vista: 4, vita: 30, x: 4, y: 1,
      sa: ['vai', 'prendi', 'apri', 'aspetta', 'aspettaDiVedere', 'suona', 'quando'] },
    /* Pero è già nel camminamento, davanti a tutti, e cade al primo
       urto. Le due cose insieme sono tutta la tensione del capitolo */
    { id: 'pero', nome: 'il vecchio Pero', fazione: 'prigionieri', emoji: '🧓', chi: 'mago',
      vista: 3, vita: 1, x: 2, y: 7, sa: ['vai', 'aspetta', 'quando'] },

    { id: 'prima', nome: 'la prima guardia', fazione: 'torre', emoji: '🗡️',
      chi: 'guardia', vista: 2, vita: 12, x: 5, y: 7 },
    { id: 'seconda', nome: 'la seconda guardia', fazione: 'torre', emoji: '🛡️',
      chi: 'guardia', vista: 2, vita: 12, x: 12, y: 7 },
    { id: 'capo', nome: 'il capoposto del muro', fazione: 'torre', emoji: '⚔️',
      chi: 'capitano', vista: 2, vita: 12, x: 18, y: 5 },
  ],
  fazioni: {
    prigionieri: { nome: 'i prigionieri', autore: 'giocatore' },
    torre: { nome: 'le guardie della torre', autore: 'livello',
             ordini: { prima: ADDOSSO, seconda: ADDOSSO, capo: ADDOSSO } },
  },

  /* le cose con un nome; le caselle nude si nominano tutte
     (`celle: true`). **`attacca` non compare in nessuna cassetta**,
     come in tutti e cinque i capitoli: le guardie sono in elenco perché
     vanno guardate, non perché si possano toccare. */
  complementi: ['corda', 'muro', 'fuori', 'esca', 'vedetta', 'aperta', 'momento',
                'prima', 'seconda', 'capo'],

  obiettivo: [qui('marta', 'fuori'), qui('nilo', 'fuori'),
              qui('cric', 'fuori'), qui('pero', 'fuori')],
  sconfitta: [caduto('pero')],
  motivoSconfitta: 'Pero è rimasto scoperto: al primo urto è andato giù, e di qui non si esce in tre.',

  /* ── LA SCENOGRAFIA ── roba che sta lì e basta */
  scenografia: [
    { che: 'sacco', x: 2, y: 1 }, { che: 'botte', x: 3, y: 1 },
    { che: 'ragnatela', x: 3, y: 3, strato: -1 }, { che: 'cassa', x: 4, y: 3 },
    { che: 'scala', x: 1, y: 6, strato: -1 }, { che: 'catena', x: 18, y: 6 },
    { che: 'torcia', x: 3, y: 5 }, { che: 'bandiera', x: 6, y: 5 },
    { che: 'colonna', x: 8, y: 5 }, { che: 'colonna', x: 12, y: 5 },
    { che: 'torcia', x: 15, y: 5 }, { che: 'barile', x: 17, y: 5 },
    { che: 'pozzanghera', x: 7, y: 7, strato: -1 }, { che: 'ossa', x: 15, y: 7 },
    { che: 'cartello', x: 17, y: 7 },
  ],

  /* tre scene, e quello che cambia è **dove sono piantate le tre
     guardie di sotto** — cioè dove bisogna piantarsi per tenerle
     occupate, e quanto tocca aspettare. Chi ha imparato il mestiere
     (una guardia per uno, di sotto, e il vecchio per ultimo) le vince
     tutte; chi ha imparato una fila di ordini ne vince una. */
  varianti: [
    { nome: 'due guardie sul camminamento di sotto',
      posti: { esca: { x: 4, y: 7 }, vedetta: { x: 11, y: 7 }, fuori: { x: 20, y: 6 } },
      oggetti: { corda: { x: 4, y: 1 } },
      unita: { cric: { x: 1, y: 3 }, nilo: { x: 2, y: 2 }, marta: { x: 4, y: 1 },
               pero: { x: 2, y: 7 },
               prima: { x: 5, y: 7 }, seconda: { x: 12, y: 7 }, capo: { x: 18, y: 5 } } },
    { nome: 'le guardie si sono spostate verso il muro',
      posti: { esca: { x: 5, y: 7 }, vedetta: { x: 12, y: 7 }, fuori: { x: 20, y: 5 } },
      oggetti: { corda: { x: 4, y: 1 } },
      unita: { cric: { x: 1, y: 2 }, nilo: { x: 3, y: 2 }, marta: { x: 4, y: 1 },
               pero: { x: 2, y: 7 },
               prima: { x: 6, y: 7 }, seconda: { x: 13, y: 7 }, capo: { x: 18, y: 5 } } },
    { nome: 'la prima guardia è quasi sulla scala',
      posti: { esca: { x: 3, y: 7 }, vedetta: { x: 9, y: 7 }, fuori: { x: 20, y: 7 } },
      oggetti: { corda: { x: 4, y: 2 } },
      unita: { cric: { x: 2, y: 3 }, nilo: { x: 1, y: 1 }, marta: { x: 4, y: 2 },
               pero: { x: 1, y: 7 },
               prima: { x: 4, y: 7 }, seconda: { x: 10, y: 7 }, capo: { x: 18, y: 5 } } },
  ],

  par: 12,
  soluzioni: [
    /* dodici ordini, ed è il par. Tre a Cric e tre a Nilo — scendi di
       sotto e piantati lì, e poi il «quando arriva» con dentro la
       campagna — quattro a Marta, che è l'unica che apre e l'unica che
       parla, e due a Pero, che è il minimo che si possa scrivere per uno
       che non deve decidere niente. Non se ne toglie nessuno: senza uno
       dei due posti di sotto resta una guardia libera, e quella libera
       è esattamente quella che incontrerà Pero; senza la corda il muro
       resta un muro; senza il «suona» Pero non parte più, e senza il
       «quando arriva» parte nell'istante sbagliato. */
    { nome: 'una guardia per uno, e il vecchio per ultimo', piano: {
      cric: [o('vai', 'esca'), quando('aperta', o('vai', 'fuori'))],
      nilo: [o('vai', 'vedetta'), quando('aperta', o('vai', 'fuori'))],
      marta: [o('prendi', 'corda'), o('apri', 'muro'),
              o('suona', 'aperta'), o('vai', 'fuori')],
      pero: [quando('aperta', o('vai', 'fuori'))],
    } },
    /* FRAGILE, ed è il tranello di tutta la storia. «Vai alla campagna»
       davanti a un muro chiuso **non fallisce: aspetta**, e allora
       sembra che a Pero basti quello — parte da solo, e il muro lo
       lascia passare appena Marta l'ha aperto. Nella terza scena
       funziona per un pelo. Nelle altre due si mette in cammino
       nell'istante peggiore: le guardie sono ancora in mezzo al
       camminamento con addosso chi le teneva occupate, e il vecchio
       ci finisce dentro. Aspettare che una porta si apra e aspettare
       che sia **il momento** non sono la stessa cosa, e la seconda
       gliela deve dire qualcuno. */
    { nome: 'Pero parte appena può', fragile: true, piano: {
      cric: [o('vai', 'esca'), quando('aperta', o('vai', 'fuori'))],
      nilo: [o('vai', 'vedetta'), quando('aperta', o('vai', 'fuori'))],
      marta: [o('prendi', 'corda'), o('apri', 'muro'),
              o('suona', 'aperta'), o('vai', 'fuori')],
      pero: [o('vai', 'fuori')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ── */
  verifiche: {
    /* LA PROVA DEL CAPITOLO: srotolati i «quando arriva», Pero parte
       insieme agli altri — ed è quello che sta più avanti — e se lo
       prende la prima guardia, che in quel momento non ha nessun altro
       da guardare */
    nonInFila: true,
    /* quattro mestieri diversi e nessuno intercambiabile */
    serveOgnuno: true,
    /* la corda prima del muro: è l'eredità del capitolo 4 */
    ordineConta: [['prendi corda', 'apri muro'],
                  /* e aprire prima di parlare: dire «il muro è aperto»
                     quando non lo è ancora fa partire Pero a vuoto */
                  ['apri muro', 'suona aperta']],
    /* le due cose senza cui non si esce: la corda e il segnale */
    senza: ['corda', 'aperta'],
  },
}

export default TORRE_5
