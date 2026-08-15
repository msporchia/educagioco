/* ═══════════════════════════════════════════════════════════════════
   🏮 LA LANTERNA DEI FONDI — capitolo 6: 🏮 RISALIRE
   forma: fuga · concetto: tutto insieme (sintesi)

   LA STORIA. L'olio è agli sgoccioli e la lanterna dura mezza scena.
   La strada di casa è il pozzo da cui si è scesi nel capitolo 2, e la
   grata lassù è ancora aperta: nessuno l'ha richiusa. In mezzo però
   c'è tutto quello che si è imparato per arrivare fin qui — le falene
   che vanno alla luce, la chiave che sta dalla parte sbagliata, una
   barricata inchiodata all'imbocco e **Ceffo**, che sotto il pozzo fa
   la posta. **Si esce in quattro o non si esce.**

   EREDITA tutto, ed è il punto:
     · **la lanterna** — l'olio basta per metà scena: è la sveglia, non
       un attrezzo;
     · **il pozzo** — la grata aperta nel capitolo 2 è l'uscita;
     · **il varco** — dalla galleria vecchia si arriva fin qui;
     · **il tamburo rotto** — nessuno chiama più nessuno, e la
       differenza si sente: **una guardia che vi vede resta una guardia
       sola**. Nel capitolo 2 farsi vedere voleva dire mezza miniera
       addosso; qui vuol dire un guardiano che si attacca a uno e non
       molla più — e allora conviene sceglierlo tu, quell'uno;
     · **le falene** — la luce le porta dove volete voi.
   LASCIA niente: è l'ultimo.

   COSA INSEGNA: niente di nuovo, ed è voluto. Quattro file, quattro
   mestieri, e ognuno dei trucchi della storia usato una volta:
     · **Tilde** porta la luce nella nicchia e ce la lascia — capitolo
       3, l'esca: è quello che rende attraversabile la sala;
     · **Ras** attraversa la sala, prende la chiave e apre **due**
       serrature in fila — capitolo 2, i prerequisiti, e la sua terza
       variante: due porte, una chiave sola, e alla seconda non ci si
       arriva finché la prima è chiusa;
     · **Orso** va alla grata **per primo**, e Ceffo se lo prende
       addosso. Da lì non si muove più: `attacca` sceglie il bersaglio
       una volta sola, e finché il guardiano è su Orso non è su
       nessun altro. Poi Orso **lo dice ai suoi** — capitolo 5, la
       reazione del nemico usata come attrezzo, stavolta pagandola di
       persona;
     · **Bea** non vede niente di tutto questo — è dietro due porte
       chiuse — e infatti non aspetta: le arriva un messaggio.
   È la regola dell'onniscienza vista dai due lati nella stessa scena:
   quello che succede sotto il pozzo lo sa **solo chi ci sta sotto**, e
   agli altri tre deve arrivare come messaggio.

   PERCHÉ NON SI VINCE IN FILA. Due gate, e nessuno dei due si può
   indovinare contando:
     · **«al mio segnale»**, che vuol dire *la luce è posata*. Chi
       attraversa la sala prima — Ras per la chiave — se lo prendono le
       falene, e quanto ci mette Tilde ad arrivare in fondo alla
       nicchia cambia a ogni scena;
     · **«via libera»**, che vuol dire *il guardiano è occupato con
       me*. Chi arriva sotto il pozzo prima di Orso se lo prende Ceffo,
       e Bea un colpo non lo regge.
   Mandarli avanti tutti insieme li perde tutti e due: Ras finisce
   sotto le falene e Bea sotto Ceffo.

   LA MAPPA. 30×18, e si legge come una ritirata: a **ponente** la
   galleria vecchia da cui si arriva; in mezzo la **sala delle falene**,
   larga, con la **chiave** piantata proprio in mezzo; poi un corridoio
   corto, da cui scende la **nicchia** (vicolo cieco: è lì che va posata
   la luce) e in fondo al quale stanno le due serrature, **barricata**
   e **cancello**, una dietro l'altra. Di là la **sala del pozzo** con
   la grata, e accanto alla grata Ceffo.
   Orso parte **già di là**, rannicchiato in un angolo che il guardiano
   non arriva a vedere: è a quattro passi dalla grata mentre gli altri
   tre sono dietro due porte chiuse, ed è tutta la ragione per cui il
   primo a farsi vedere può essere lui.
   ═══════════════════════════════════════════════════════════════════ */

/* ── le scorciatoie per scrivere i dati (le stesse di data/generale.js,
      ricopiate qui perché questo file deve stare in piedi da solo) ── */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })
const nonVedi = complemento => ({ cond: 'vedi', complemento, non: true })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const caduto = complemento => ({ cond: 'vivo', complemento, non: true })

/* una mappa grande non si scrive a mano: si scava, e resta una lista
   di righe come tutte le altre */
function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const RISALITA = (() => {
  const g = tela(30, 18)
  /* ── ponente: la galleria vecchia da cui si arriva ── */
  cava(g, 1, 6, 4, 11)
  cava(g, 5, 8, 7, 8)          // il budello che entra nella sala
  /* ── in mezzo: la sala delle falene ── */
  cava(g, 8, 3, 16, 13)
  /* ── il corridoio, con la nicchia che scende ── */
  cava(g, 17, 8, 20, 8)
  cava(g, 17, 9, 17, 12)       // la nicchia: vicolo cieco a mezzogiorno
  /* ── levante: la sala del pozzo, e la grata ── */
  cava(g, 21, 5, 26, 11)
  return stampa(g)
})()

/* ── IL PIANO DI CEFFO, e si legge toccandolo ──
   Due righe, e sono le stesse di sempre: sta di posta finché non vede
   qualcuno, e a quel punto gli va addosso. Quello che è cambiato non è
   scritto qui — è quello che **non c'è più**: non grida. Il tamburo
   l'ha portato via Orso nel capitolo prima, e senza tamburo un
   guardiano che ti vede resta un guardiano solo.
   E c'è una regola del motore da leggere insieme a lui: `attacca`
   **sceglie il bersaglio una volta sola** e gli resta addosso finché
   non cade. Chi si fa vedere per primo se lo tiene — ed è tutta la
   ragione per cui a farsi vedere dev'essere Orso. */
const CEFFO = [
  { verbo: 'aspettaDiVedere', complemento: 'fondi' },
  o('attacca', 'fondi'),
]

/* ── IL PIANO DELLE FALENE, lo stesso del capitolo 3 ──
   Dormono, e appena vedono qualcuno decidono **una volta sola**: se in
   quell'attimo non hanno la luce davanti si buttano addosso a chi c'è,
   se ce l'hanno no. Poi vanno alla lanterna — che qui non è un oggetto
   per terra ma una donna che cammina: `vai [Tilde]` due volte, la
   raggiungono mentre va e poi le rivanno dietro fin dove si ferma. */
const SCIAME = [
  { verbo: 'aspettaDiVedere', complemento: 'fondi' },
  bivio(nonVedi('tilde'), [o('attacca', 'fondi')]),
  o('vai', 'tilde'),
  o('vai', 'tilde'),
]

export const FONDI_6 = {
  id: 'fondi-risalire', nome: 'Risalire',
  idea: 'Tutto quello che avete imparato, in una volta sola',
  storia: 'fondi', capitolo: 6, emoji: '🏮',
  forma: 'fuga', concetto: 'sintesi',
  eredita: ['lanterna', 'pozzo', 'varco', 'tamburo', 'falene'], lascia: [],
  pianoVisibile: true,

  dritta: "Niente di nuovo: sono i trucchi della storia messi in fila. La luce nella nicchia si porta via le falene; due serrature e una chiave sola, e la chiave è in mezzo alla sala; Ceffo <b>si attacca al primo che vede e non cambia più</b> — quindi il primo lo scegli tu, e scegli quello che i colpi li regge. Chi ce l'ha addosso è anche l'unico che può dire agli altri che la strada è sgombra.",
  racconto: "L'olio è agli sgoccioli. La strada di casa è il pozzo da cui siete scesi, e la grata lassù è ancora aperta — ma all'imbocco gli orchi hanno inchiodato una <b>barricata</b> e dietro ci hanno messo un <b>cancello</b>, e la chiave è rimasta in mezzo alla sala delle falene. Accanto alla grata fa la posta <b>Ceffo</b>. Il tamburo non c'è più: chi vi vede resta uno solo, e si attacca al primo che gli capita davanti. Si vince quando <b>tutti e quattro</b> sono fuori dalla grata. Si perde se Bea ci lascia le penne: un colpo non lo regge.",
  aiuti: [
    'Tocca Ceffo: si prende <b>il primo che vede</b> e non cambia più bersaglio. Orso è già di là e ne regge ventisei: arrivare per primo alla grata è il suo mestiere, non un incidente.',
    'La chiave è in mezzo alla sala, e nella sala non si passa finché la luce non è nella nicchia: la fila di Ras comincia da <b>quando senti</b>.',
    'Bea è dietro due porte chiuse e non vede niente: a lei il fatto deve <b>arrivare</b>. L’unico che sa che il guardiano è occupato è quello che ce l’ha addosso.',
  ],

  griglia: RISALITA, ambiente: 'miniera',
  /* le caselle si nominano: serve a far vedere, con la scena che
     cambia, quanto vale poco un numero scritto a mano */
  celle: true,

  nomi: {
    chiave: 'la chiave della barricata', barricata: 'la barricata',
    cancello: 'il cancello', nicchia: 'la nicchia',
    fuori: 'la grata del pozzo',
    fondi: 'i ladri dei Fondi', orchi: 'il guardiano', falene: 'le falene',
  },
  posti: {
    nicchia: { x: 17, y: 12 },
    fuori: { x: 24, y: 6 },
  },
  porte: {
    /* DUE SERRATURE, UNA CHIAVE SOLA — è il terzo modo in cui il
       capitolo 2 torna a trovarci. Gli orchi hanno inchiodato la
       barricata all'imbocco e messo un cancello subito dietro: si
       aprono in fila, e la seconda non si raggiunge finché la prima è
       chiusa. */
    barricata: { x: 19, y: 8, chiave: 'chiave' },
    cancello:  { x: 20, y: 8, chiave: 'chiave' },
  },
  oggetti: [{ nome: 'chiave', em: '🗝️', x: 9, y: 8 }],
  segnali: ['ora', 'viaLibera'],

  unita: [
    /* L'ORDINE DI QUESTA LISTA CONTA, e non per il disegno: dentro un
       battito il motore fa muovere le unità in quest'ordine. I nostri
       stanno prima del guardiano, e vuol dire che chi cammina si toglie
       di mezzo **prima** che lui alzi la mano: finché Orso cammina non
       le prende. Le prende quando si ferma — ed è esattamente quello
       che gli si chiede di fare. */
    { id: 'tilde', nome: 'Tilde', fazione: 'fondi', emoji: '👵', chi: 'mago',
      vista: 4, vita: 3, x: 2, y: 8, sa: ['vai', 'suona', 'aspetta', 'quando'] },
    /* Ras apre, e basta: un colpo non lo regge molto meglio di Bea. Le
       due serrature sono sue, e la chiave sta in mezzo alla sala delle
       falene — cioè dove non si passa finché la luce non è a posto. */
    { id: 'ras', nome: 'Ras', fazione: 'fondi', emoji: '🥷', chi: 'ladra',
      vista: 4, vita: 3, x: 1, y: 10,
      sa: ['vai', 'prendi', 'apri', 'aspetta', 'quando'] },
    /* ORSO NE REGGE VENTISEI, e non è un capriccio del disegno: è il
       livello. Ceffo si attacca al primo che vede e non cambia più
       bersaglio, quindi qualcuno deve arrivare per primo alla grata e
       **restarci sotto** finché non sono usciti tutti. È l'unico che
       può, ed è per questo che la scena si vince scegliendo lui.
       Parte già dentro la sala del pozzo, rannicchiato in un angolo:
       da lì Ceffo non lo vede — ma è a quattro passi dalla grata,
       mentre gli altri tre sono di là da due porte chiuse. */
    { id: 'orso', nome: 'Orso', fazione: 'fondi', emoji: '🐻', chi: 'orso',
      vista: 3, vita: 26, x: 22, y: 10,
      sa: ['vai', 'prendi', 'suona', 'aspetta', 'quando'] },
    /* Bea vede lontano e non regge niente. Qui non le serve vedere: di
       là dalla barricata non c'è niente da vedere. Le serve che
       qualcuno le parli. */
    { id: 'bea', nome: 'Bea', fazione: 'fondi', emoji: '🔔', chi: 'elfo',
      vista: 4, vita: 1, x: 17, y: 8,
      sa: ['vai', 'suona', 'aspetta', 'quando'] },

    { id: 'ceffo', nome: 'Ceffo', fazione: 'orchi', emoji: '👹', chi: 'orco',
      vista: 2, vita: 12, x: 24, y: 7 },

    { id: 'falena1', nome: 'una falena', fazione: 'falene', emoji: '🦋', chi: 'goblin',
      vista: 3, vita: 2, x: 11, y: 7 },
    { id: 'falena2', nome: 'una falena', fazione: 'falene', emoji: '🦋', chi: 'goblin',
      vista: 3, vita: 2, x: 12, y: 9 },
    { id: 'falena3', nome: 'una falena', fazione: 'falene', emoji: '🦋', chi: 'goblin',
      vista: 3, vita: 2, x: 11, y: 10 },
  ],
  fazioni: {
    fondi: { nome: 'i ladri dei Fondi', autore: 'giocatore' },
    orchi: { nome: 'il guardiano del pozzo', autore: 'livello',
             ordini: { ceffo: CEFFO } },
    falene: { nome: 'le falene bianche', autore: 'livello',
              ordini: { falena1: SCIAME, falena2: SCIAME, falena3: SCIAME } },
  },

  /* `attacca` non entra in cassetta: nessuno dei nostri lo sa fare, e
     l'ultimo capitolo non si vince menando. */
  complementi: ['chiave', 'barricata', 'cancello', 'nicchia', 'fuori',
                'ora', 'viaLibera', 'momento'],

  /* la fuga in quattro righe: fuori tutti e quattro, e non «quasi
     tutti». Chi resta dentro fa perdere anche agli altri. */
  obiettivo: [qui('tilde', 'fuori'), qui('orso', 'fuori'),
              qui('ras', 'fuori'), qui('bea', 'fuori')],
  sconfitta: [caduto('bea')],
  motivoSconfitta: 'Bea è arrivata sotto il pozzo per prima: un colpo non lo regge, e di colpi ne bastava uno.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA ──
     Roba che sta lì e basta: **non è in gioco**. Non passa dal motore —
     `creaMondo` non la guarda nemmeno — quindi non si prende, non si
     nomina in un ordine, non compare fra i bersagli. Spostarla non
     cambia una virgola di quello che succede. */
  scenografia: [
    /* ponente: la galleria vecchia */
    { che: 'ragnatela', x: 3, y: 6, strato: -1 }, { che: 'ossa', x: 2, y: 11 },
    { che: 'barile', x: 4, y: 11 }, { che: 'cartello', x: 6, y: 8 },
    /* la sala delle falene */
    { che: 'stalagmite', x: 10, y: 5 }, { che: 'cristallo', x: 15, y: 4 },
    { che: 'fungo', x: 13, y: 6 }, { che: 'ossa', x: 15, y: 12 },
    { che: 'acqua', x: 10, y: 12, strato: -1 }, { che: 'colonna', x: 13, y: 12 },
    { che: 'stalagmite', x: 9, y: 10 }, { che: 'fungo', x: 16, y: 6 },
    { che: 'cristallo', x: 12, y: 3 },
    /* il corridoio e la nicchia */
    { che: 'ragnatela', x: 17, y: 9, strato: -1 },
    { che: 'ossa', x: 18, y: 8 },
    /* levante: la sala del pozzo */
    { che: 'pozzo', x: 25, y: 5 }, { che: 'catena', x: 26, y: 5 },
    { che: 'scala', x: 24, y: 5, strato: -1 }, { che: 'barile', x: 21, y: 5 },
    { che: 'botte', x: 21, y: 11 }, { che: 'carrello', x: 22, y: 11 },
    { che: 'binario', x: 23, y: 11, strato: -1 },
    { che: 'cristallo', x: 26, y: 8 }, { che: 'acqua', x: 21, y: 9, strato: -1 },
  ],

  /* ── LE TRE SCENE ──
     Cambia **quanto è lungo il giro della chiave** — cioè quanti
     battiti Orso resta solo sotto il guardiano, che è la cosa che
     nessuno può contare da fuori — e cambiano la grata, la nicchia,
     dove dormono le falene e da che parte si esce.
       1. la chiave a metà sala, la grata a settentrione del pozzo;
       2. la chiave giù nell'angolo di mezzogiorno: il giro è più lungo,
          e la grata è dall'altra parte;
       3. la chiave è quasi in cima, le falene si sono spostate
          sull'imbocco e si esce dal fondo: si passa più stretti. */
  varianti: [
    { nome: 'la chiave a metà sala',
      oggetti: { chiave: { x: 9, y: 8 } },
      posti: { nicchia: { x: 17, y: 12 }, fuori: { x: 24, y: 6 } },
      unita: { tilde: { x: 2, y: 8 }, ras: { x: 1, y: 10 }, orso: { x: 22, y: 10 },
               bea: { x: 17, y: 8 }, ceffo: { x: 24, y: 7 },
               falena1: { x: 11, y: 7 }, falena2: { x: 12, y: 9 }, falena3: { x: 11, y: 10 } } },
    { nome: 'la chiave giù nell\'angolo di mezzogiorno',
      oggetti: { chiave: { x: 10, y: 13 } },
      posti: { nicchia: { x: 17, y: 11 }, fuori: { x: 25, y: 10 } },
      unita: { tilde: { x: 2, y: 9 }, ras: { x: 1, y: 7 }, orso: { x: 22, y: 6 },
               bea: { x: 17, y: 8 }, ceffo: { x: 24, y: 10 },
               falena1: { x: 12, y: 6 }, falena2: { x: 13, y: 8 }, falena3: { x: 12, y: 10 } } },
    { nome: 'le falene sull\'imbocco, e la grata dall\'altra parte',
      oggetti: { chiave: { x: 14, y: 4 } },
      posti: { nicchia: { x: 17, y: 10 }, fuori: { x: 26, y: 11 } },
      unita: { tilde: { x: 3, y: 11 }, ras: { x: 1, y: 6 }, orso: { x: 21, y: 6 },
               bea: { x: 17, y: 8 }, ceffo: { x: 25, y: 11 },
               falena1: { x: 14, y: 7 }, falena2: { x: 15, y: 9 }, falena3: { x: 14, y: 11 } } },
  ],

  soluzioni: [
    /* QUATTORDICI ORDINI, ED È IL PAR — il piano più lungo della
       storia, e non ha dentro niente che non si sia già visto. Si legge
       come quattro frasi:
         Tilde  porta la luce nella nicchia, lo dice, ed esce quando le
                dicono che si può;
         Ras    quando la luce è a posto attraversa la sala, prende la
                chiave, apre le due serrature e se ne va fuori;
         Orso   quando la luce è a posto va alla grata — e siccome è il
                primo che Ceffo vede, se lo prende addosso. Poi lo dice
                ai suoi: da quel momento il guardiano è occupato, e per
                gli altri tre la strada è sgombra;
         Bea    non vede niente e non aspetta niente: parte quando le
                arriva il messaggio.
       Due gate diversi, `ora` e `via libera`, e ognuno dice una cosa
       che chi lo riceve non poteva vedere da dov'era. */
    { nome: 'la luce, la chiave, e chi tiene la grata', piano: {
      tilde: [o('vai', 'nicchia'), o('suona', 'ora'),
              quando('viaLibera', o('vai', 'fuori'))],
      ras:   [quando('ora', o('prendi', 'chiave'), o('apri', 'barricata'),
                     o('apri', 'cancello'), o('vai', 'fuori'))],
      orso:  [quando('ora', o('vai', 'fuori'), o('suona', 'viaLibera'))],
      bea:   [quando('viaLibera', o('vai', 'fuori'))],
    } },
    /* FRAGILE: lo stesso piano, ma l'ultimo passo di ognuno punta a una
       **casella scritta a mano** invece che alla grata. Nella prima
       scena il numero ci azzecca e non si vede la differenza; nelle
       altre due la grata è da un'altra parte, e tutti e quattro si
       fermano sulla casella giusta del mondo sbagliato. È l'ultima
       lezione della storia, ed è la stessa del capitolo 2: una cosa la
       segui dovunque vada, un numero no. */
    { nome: 'a casella', fragile: true, piano: {
      tilde: [o('vai', 'nicchia'), o('suona', 'ora'),
              quando('viaLibera', o('vai', '24,6'))],
      ras:   [quando('ora', o('prendi', 'chiave'), o('apri', 'barricata'),
                     o('apri', 'cancello'), o('vai', '24,6'))],
      orso:  [quando('ora', o('vai', '24,6'), o('suona', 'viaLibera'))],
      bea:   [quando('viaLibera', o('vai', '24,6'))],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto. */
  verifiche: {
    /* srotolati gli ascolti: Ras attraversa la sala prima che la luce
       sia posata e se lo prendono le falene, e Bea arriva sotto il
       pozzo prima che Orso si sia preso Ceffo */
    nonInFila: true,
    /* quattro mestieri e nessuno ne sa fare due */
    serveOgnuno: true,
    ordineConta: [
      /* la chiave prima della serratura: è il capitolo 2, e vale ancora */
      ['prendi chiave', 'apri barricata'],
      /* e le due serrature in fila: al cancello non si arriva
         attraverso una barricata chiusa */
      ['apri barricata', 'apri cancello'],
    ],
    /* senza la chiave non si apre niente; senza Tilde le falene si
       svegliano sulla persona sbagliata */
    senza: ['chiave', 'tilde'],
  },
}

export default FONDI_6
