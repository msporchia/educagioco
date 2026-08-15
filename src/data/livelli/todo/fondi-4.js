/* ═══════════════════════════════════════════════════════════════════
   🏮 LA LANTERNA DEI FONDI — capitolo 4: ⛏️ LA FRANA
   forma: apripista · concetto: gli eventi (suona / quando senti)

   LA STORIA. Dietro la frana c'è la galleria vecchia, e la galleria
   vecchia arriva sotto il paese girando intorno alla sala grande degli
   orchi. Tilde di là c'è già: è passata quando ancora si passava, e la
   frana le si è chiusa dietro. Adesso è ferma alla bocca della
   galleria, con la lanterna in mano, e da lì vede il muro di sassi che
   la divide dagli altri tre. Orso scava — è l'unico che sa farlo — ma
   dentro il budello non vede niente oltre il suo naso, e soprattutto
   **non sa quando avrà finito**: nemmeno lui.

   EREDITA dal capitolo 2 il pozzo aperto (si entra ancora da lì) e dal
   3 la lanterna, che qui non chiama nessuno: serve solo a far vedere a
   Tilde quando il varco si apre.
   LASCIA **il varco**: da qui in avanti la galleria vecchia è la strada
   che evita la sala grande — è quella da cui Orso arriva al tamburo nel
   capitolo 5, ed è quella da cui si risale nel 6.

   COSA INSEGNA. Che una cosa può succedere **quando succede**, e non a
   un momento deciso da chi scrive il piano. Quanto ci mette Orso a
   bucare la frana non è scritto da nessuna parte: dipende da dov'è il
   piccone, e il piccone cambia posto a ogni scena. Perciò non si può
   mettere «e adesso passate»: si mette **chi lo vede lo dice**.
     · Tilde è l'unica che il varco lo vede: `aspetta [il varco]` —
       si aspetta uno stato del mondo, e si può aspettare solo quello
       che si vede da dov'è;
     · appena si apre, `suona [porta aperta]`;
     · Ras e Bea non vedono niente, e infatti non possono aspettare:
       a loro il fatto deve **arrivare**, e arriva con `quando senti
       [porta aperta]`.
   È la regola dell'onniscienza detta in due mosse: quello che vedi lo
   puoi aspettare, quello che non vedi te lo deve dire qualcuno.

   PERCHÉ NON SI VINCE IN FILA. Un piano senza il segnale ce l'ha, una
   risposta: «partite subito, tanto davanti alla frana aspettate». E
   funziona — una volta. Chi si pianta davanti a una strada chiusa la
   guarda per un pezzo e poi si arrende, e quel pezzo non è infinito:
   nella scena col piccone a due passi Orso fa in tempo, nelle altre
   due no, e Ras e Bea hanno già mollato quando il varco si apre. È la
   soluzione fragile qui sotto, ed è la tentazione giusta: non è una
   sciocchezza, è una scommessa sul tempo di qualcun altro.

   LA MAPPA. 30×18, e il muro di roccia che taglia in due a x15 è il
   protagonista. Di qua (ponente) la sala del pozzo vecchio dove si
   arriva dal capitolo 3, il pozzo di servizio che scende, e in fondo
   il **deposito degli attrezzi**: è lì che in due scene su tre è
   finito il piccone, e andarlo a prendere è tutto il tempo che Ras e
   Bea non hanno. Di là (levante) la galleria vecchia, due rami e un
   traverso, che scende alla sua bocca.
   Le cuciture fra i due mondi sono **due sole caselle**, il collo alto
   e il collo basso, e in tutte e due c'è un mucchio di sassi: uno è la
   frana che Orso può bucare (**il varco**), l'altro è il crollo
   grosso, che non si scava e non si nomina nemmeno. Quale dei due sia
   quale cambia da una scena all'altra — ed è per questo che un piano
   che punta a una casella scritta a mano qui non serve a niente.
   ═══════════════════════════════════════════════════════════════════ */

/* ── le scorciatoie per scrivere i dati (le stesse di data/generale.js,
      ricopiate qui perché questo file deve stare in piedi da solo) ── */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const aperto = complemento => ({ cond: 'aperta', complemento })

/* una mappa grande non si scrive a mano: si scava, e resta una lista
   di righe come tutte le altre */
function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const FRANA = (() => {
  const g = tela(30, 18)
  /* ── di qua dalla frana (ponente) ── */
  cava(g, 1, 2, 12, 6)        // la sala del pozzo vecchio: si arriva di qui
  cava(g, 2, 7, 2, 13)        // il pozzo di servizio, che scende
  cava(g, 1, 14, 12, 16)      // il deposito degli attrezzi, in fondo
  cava(g, 12, 3, 14, 3)       // il budello che porta al collo alto
  cava(g, 12, 6, 12, 11)      // il raccordo che scende lungo il muro
  cava(g, 12, 11, 14, 11)     // il budello che porta al collo basso
  /* ── le due cuciture: due caselle sole, e tutte e due tappate ── */
  cava(g, 15, 3, 16, 3)       // il collo alto
  cava(g, 15, 11, 16, 11)     // il collo basso
  /* ── di là (levante): la galleria vecchia ── */
  cava(g, 17, 3, 27, 3)       // il ramo alto
  cava(g, 17, 11, 27, 11)     // il ramo basso
  cava(g, 27, 3, 27, 13)      // il traverso di levante, che scende
  cava(g, 22, 13, 28, 15)     // la bocca della galleria vecchia
  return stampa(g)
})()

export const FONDI_4 = {
  id: 'fondi-frana', nome: 'La frana',
  idea: 'Chi lo vede lo dice, e gli altri partono da lì',
  storia: 'fondi', capitolo: 4, emoji: '⛏️',
  forma: 'apripista', concetto: 'eventi',
  eredita: ['lanterna', 'pozzo'], lascia: ['varco'],

  dritta: "Nessuno sa quanto ci mette Orso a bucare la frana — <b>nemmeno Orso</b>. Tilde è di là e il varco lo vede: lei può <b>aspettarlo</b>. Ras e Bea non lo vedono, e quello che non si vede non si aspetta: a loro il fatto deve arrivare, e arriva con <b>quando senti</b>.",
  racconto: "Dietro la frana c'è la galleria vecchia, che gira intorno alla sala grande. <b>Tilde è già di là</b>, ferma alla bocca con la lanterna: la frana le si è chiusa dietro, e adesso è lei il punto di ritrovo. Orso è l'unico che sa scavare, ma <b>a mani nude non si scava</b>: prima gli serve il piccone. Si vince quando il varco è aperto e <b>tutti e quattro</b> sono alla bocca della galleria. Attento: chi si pianta davanti a una strada chiusa non aspetta per sempre — a un certo punto molla.",
  aiuti: [
    'Il piccone non è sempre dove l’hai lasciato: guarda dov’è <b>in questa scena</b> prima di scrivere.',
    'Tocca il varco: è un mucchio di sassi, e Tilde da dove sta lo vede. Solo lei può <b>aspettarlo</b>.',
    'Ras e Bea non devono partire per primi: metti il loro <b>vai</b> dentro un <b>quando senti [porta aperta]</b>, e fai suonare Tilde appena il varco si apre.',
  ],

  griglia: FRANA, ambiente: 'miniera',

  nomi: {
    varco: 'il varco', crollo: 'il crollo grosso', piccone: 'il piccone',
    raduno: 'la bocca della galleria vecchia', fondi: 'i ladri dei Fondi',
  },
  posti: {
    /* il punto di ritrovo è dove Tilde è rimasta: di là dalla frana, in
       fondo alla galleria vecchia */
    raduno: { x: 18, y: 11 },
  },
  porte: {
    /* LE DUE FRANE. `varco` è quella che Orso può bucare — e il piccone
       ne è la chiave: una frana non si scava a mani nude, e il motore
       lo dice da sé («il varco è chiuso a chiave, e il piccone non ce
       l'ho»). `crollo` è l'altra cucitura, e non si apre: la sua chiave
       è una cosa che sul campo non c'è, e nessuno può nominarla perché
       non sta fra i complementi. Serve a una cosa sola — che le due
       caselle di passaggio siano due, e che quale delle due si buca
       cambi da una scena all'altra. */
    varco:  { x: 15, y: 11, chiave: 'piccone' },
    crollo: { x: 15, y: 3, chiave: 'montagna' },
  },
  oggetti: [{ nome: 'piccone', em: '⛏️', x: 8, y: 4 }],
  segnali: ['aperta'],

  unita: [
    /* Tilde porta la luce e non mena: qui non c'è niente da menare, e
       il suo mestiere è **guardare e dire**. Vista lunga perché la
       lanterna gliela dà: dalla bocca della galleria arriva a vedere
       il muro di sassi, ed è tutto quello che serve al capitolo.
       La faccia è quella del mago e non della ladra apposta: Ras è già
       una ladra, e due figure uguali in scena si scambiano a colpo
       d'occhio. */
    { id: 'tilde', nome: 'Tilde', fazione: 'fondi', emoji: '👵', chi: 'mago',
      vista: 10, vita: 3, x: 18, y: 11, sa: ['vai', 'aspetta', 'suona'] },
    /* Orso rompe: è l'unico che apre il varco, e l'unico che il piccone
       lo sa impugnare. Non ascolta segnali — non gli servono: è lui
       quello che li fa succedere. */
    { id: 'orso', nome: 'Orso', fazione: 'fondi', emoji: '🐻', chi: 'orso',
      vista: 3, vita: 10, x: 5, y: 4, sa: ['vai', 'prendi', 'apri'] },
    { id: 'ras', nome: 'Ras', fazione: 'fondi', emoji: '🥷', chi: 'ladra',
      vista: 4, vita: 6, x: 3, y: 3, sa: ['vai', 'prendi', 'apri', 'aspetta', 'quando'] },
    /* Bea corre e non regge un colpo. Qui non ci sono colpi da reggere:
       c'è da non partire prima del tempo, che è la stessa lezione
       vista dall'altro lato. */
    { id: 'bea', nome: 'Bea', fazione: 'fondi', emoji: '🔔', chi: 'elfo',
      vista: 4, vita: 1, x: 3, y: 5, sa: ['vai', 'aspetta', 'quando'] },
  ],
  fazioni: { fondi: { nome: 'i ladri dei Fondi', autore: 'giocatore' } },

  /* niente nemici, niente celle: la cassetta è cortissima apposta, e
     tutto il capitolo sta in tre parole — il piccone, il varco, il
     segnale. `il crollo grosso` non è in elenco: esiste sulla mappa e
     non si nomina. */
  complementi: ['piccone', 'varco', 'raduno', 'aperta', 'momento'],

  /* l'apripista in due righe: la strada è aperta, e ci sono passati
     tutti e quattro. Chi apre non basta che apra: deve passarci anche
     lui, se no il varco resta una porta su una stanza vuota. */
  obiettivo: [
    aperto('varco'),
    qui('tilde', 'raduno'), qui('orso', 'raduno'),
    qui('ras', 'raduno'), qui('bea', 'raduno'),
  ],

  /* ── LA SCENOGRAFIA ──
     Roba che sta lì e basta: **non è in gioco**. Non passa dal motore —
     `creaMondo` non la guarda nemmeno — quindi non si prende, non si
     nomina in un ordine, non compare fra i bersagli. Serve a far vedere
     che di qua c'è una miniera che si lavora e di là una galleria
     abbandonata da vent'anni. Spostarla non cambia una virgola. */
  scenografia: [
    /* di qua: la sala e il deposito degli attrezzi */
    { che: 'cassa', x: 1, y: 2 }, { che: 'botte', x: 2, y: 2 },
    { che: 'sacco', x: 1, y: 6 }, { che: 'pozzanghera', x: 7, y: 6, strato: -1 },
    { che: 'colonna', x: 9, y: 3 }, { che: 'cartello', x: 11, y: 2 },
    { che: 'scala', x: 2, y: 9, strato: -1 }, { che: 'scala', x: 2, y: 12, strato: -1 },
    { che: 'martello', x: 1, y: 15 }, { che: 'secchio', x: 4, y: 14 },
    { che: 'carrello', x: 8, y: 14 }, { che: 'binario', x: 7, y: 14, strato: -1 },
    { che: 'barile', x: 12, y: 15 }, { che: 'corda', x: 3, y: 16 },
    { che: 'ossa', x: 10, y: 16 },
    /* i due budelli, e i sassi che li tappano */
    { che: 'roccia', x: 13, y: 3 }, { che: 'roccia', x: 13, y: 11 },
    { che: 'stalagmite', x: 12, y: 8 }, { che: 'fungo', x: 12, y: 10 },
    /* di là: la galleria vecchia, che non la batte nessuno da vent'anni */
    { che: 'ragnatela', x: 17, y: 3, strato: -1 }, { che: 'ragnatela', x: 17, y: 11, strato: -1 },
    { che: 'cristallo', x: 21, y: 3 }, { che: 'fungo', x: 25, y: 3 },
    { che: 'ossa', x: 22, y: 11 }, { che: 'acqua', x: 26, y: 11, strato: -1 },
    { che: 'stalagmite', x: 27, y: 7 }, { che: 'cristallo', x: 27, y: 9 },
    { che: 'pozzo', x: 28, y: 14 }, { che: 'catena', x: 28, y: 13 },
    { che: 'tenda', x: 23, y: 15 }, { che: 'falo', x: 25, y: 15 },
  ],

  /* ── LE TRE SCENE ──
     Non cambia il ragionamento: cambia **quanto ci mette Orso**, che è
     esattamente la cosa che nessuno può contare a mano. E cambia quale
     delle due cuciture è quella scavabile, così un piano che punta a
     una casella o che si ricorda «la frana sta in basso» casca.
       1. il piccone è a due passi da Orso: ci mette una ventina di
          battiti, e chi è partito subito fa ancora in tempo;
       2. il piccone è in fondo al deposito, giù dal pozzo di servizio:
          ci mette il triplo, e chi è partito subito ha già mollato;
       3. la frana buona è quella in alto, il piccone sta nel deposito e
          il ritrovo è in cima alla galleria: cambia tutto, comprese le
          due caselle di passaggio. */
  varianti: [
    { nome: 'la frana sottile, il piccone a portata di mano',
      porte: { varco: { x: 15, y: 11 }, crollo: { x: 15, y: 3 } },
      oggetti: { piccone: { x: 8, y: 4 } },
      posti: { raduno: { x: 18, y: 11 } },
      unita: { tilde: { x: 18, y: 11 }, orso: { x: 5, y: 4 },
               ras: { x: 3, y: 3 }, bea: { x: 3, y: 5 } } },
    { nome: 'la frana spessa, il piccone in fondo al deposito',
      porte: { varco: { x: 15, y: 11 }, crollo: { x: 15, y: 3 } },
      oggetti: { piccone: { x: 11, y: 16 } },
      posti: { raduno: { x: 20, y: 11 } },
      unita: { tilde: { x: 20, y: 11 }, orso: { x: 3, y: 3 },
               ras: { x: 5, y: 5 }, bea: { x: 6, y: 2 } } },
    { nome: 'il varco è quello in alto',
      porte: { varco: { x: 15, y: 3 }, crollo: { x: 15, y: 11 } },
      oggetti: { piccone: { x: 6, y: 15 } },
      posti: { raduno: { x: 24, y: 3 } },
      unita: { tilde: { x: 24, y: 3 }, orso: { x: 2, y: 15 },
               ras: { x: 9, y: 5 }, bea: { x: 10, y: 2 } } },
  ],

  soluzioni: [
    /* NOVE ORDINI, ED È IL PAR. Si legge come una frase sola: Orso
       prende il piccone e buca; Tilde guarda il varco, e appena si apre
       lo dice; gli altri due hanno una fila che comincia dal momento in
       cui glielo dicono. Tilde non ha nessun `vai`: alla bocca della
       galleria c'è già, ed è per questo che il punto di ritrovo è lì. */
    { nome: 'chi lo vede lo dice', piano: {
      orso:  [o('prendi', 'piccone'), o('apri', 'varco'), o('vai', 'raduno')],
      tilde: [o('aspetta', 'varco'), o('suona', 'aperta')],
      ras:   [quando('aperta', o('vai', 'raduno'))],
      bea:   [quando('aperta', o('vai', 'raduno'))],
    } },
    /* LA STRADA LUNGA, e vince anche lei: se non ti fidi di quello che
       ti dicono, vai a guardare il muro di sassi con i tuoi occhi. Tre
       ordini a testa invece dell'ascolto, dodici invece di nove, e
       nessun segnale in tutta la scena. Il par non la vieta: la fa
       costare. E fa vedere una cosa vera — `aspetta` funziona per
       chiunque, purché sia lì davanti; il segnale serve a chi *non* può
       esserci. */
    { nome: 'ognuno va a guardare la frana', lunga: true, piano: {
      orso:  [o('prendi', 'piccone'), o('apri', 'varco'), o('vai', 'raduno')],
      tilde: [o('vai', 'varco'), o('aspetta', 'varco'), o('vai', 'raduno')],
      ras:   [o('vai', 'varco'), o('aspetta', 'varco'), o('vai', 'raduno')],
      bea:   [o('vai', 'varco'), o('aspetta', 'varco'), o('vai', 'raduno')],
    } },
    /* FRAGILE: niente segnale e niente attesa — si parte tutti insieme,
       tanto «davanti alla frana aspettiamo». Regge nella prima scena,
       dove il piccone è a due passi da Orso e il varco si apre prima
       che a Ras e Bea scada la pazienza. Nelle altre due il piccone è
       giù nel deposito: quando il varco si apre, quei due hanno già
       smesso di provare e la loro fila è finita lì. È una scommessa sul
       tempo di qualcun altro, ed è la ragione per cui il segnale
       esiste. */
    { nome: 'partiamo subito, tanto aspettiamo lì', fragile: true, piano: {
      orso:  [o('prendi', 'piccone'), o('apri', 'varco'), o('vai', 'raduno')],
      tilde: [],
      ras:   [o('vai', 'raduno')],
      bea:   [o('vai', 'raduno')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto. */
  verifiche: {
    /* è tutto il capitolo: tolto l'ascolto e tolta l'attesa, restano
       quattro file che partono insieme — e quando il piccone è lontano
       Ras e Bea mollano prima che il varco si apra */
    nonInFila: true,
    /* nessuno dei quattro è di troppo: chi scava non vede, chi vede non
       scava, e chi non vede né scava deve comunque arrivare di là */
    serveOgnuno: true,
    ordineConta: [
      /* una frana non si scava a mani nude */
      ['prendi piccone', 'apri varco'],
      /* e non si annuncia un varco che non si è ancora aperto: chi
         suona prima manda avanti Ras e Bea contro i sassi */
      ['aspetta varco', 'suona aperta'],
    ],
    /* senza il piccone non c'è nessun varco, e la galleria vecchia
       resta una cosa che si vede e basta */
    senza: ['piccone'],
  },
}

export default FONDI_4
