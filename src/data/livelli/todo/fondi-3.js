/* ═══════════════════════════════════════════════════════════════════
   🏮 LA LANTERNA DEI FONDI — capitolo 3: «Le falene»
   forma: esca · concetto: la condizione (il blocco ❓, due rami)

   LA STORIA. Sotto il paese, dopo il pozzo, si apre la sala delle
   falene bianche: dormono appese alla volta e la luce le chiama tutte
   insieme. La lanterna che Tilde ha tirato fuori dal magazzino e che
   Ras si è portato in fondo al pozzo qui non aiuta — chiama. Chi la
   porta di lì non passa; gli altri, al buio, sì. Ras si ficca nella
   nicchia in fondo alla sala e si fa trovare: le falene vanno alla
   luce, e mentre stanno addosso a lui Bea e Orso attraversano la sala
   e prendono una delle due gallerie. È il primo capitolo in cui la
   cosa migliore che puoi fare è **farti vedere**.

   EREDITA dal capitolo 2 la lanterna (accesa, e sono guai).
   LASCIA ai capitoli dopo la regola che vale fino alla fine della
   storia: **le falene vanno dove c'è luce, e la luce la metti dove
   vuoi tu** — nel capitolo 5 è la stessa mossa fatta con gli orchi.

   COSA INSEGNA. Il blocco ❓ condizione, e non lo si impara scrivendolo:
   lo si impara **leggendo il piano delle falene**. Dormono, e appena
   vedono qualcuno decidono una volta sola, e da lì prendono una delle
   due strade:
       se è vero  che non vedono Ras — si buttano addosso a chi hanno davanti
       se è falso — niente: resta quello che sono, bestie che vanno alla luce
   Da qui esce tutto il livello: non conta che Ras arrivi, conta che
   sia **lui** quello che si vedono davanti nell'attimo in cui aprono
   gli occhi. Perciò Bea e Orso non possono partire con lui — devono
   partire *dopo*, e a dirglielo è il segnale che Ras suona quando è
   nella nicchia. Due cose in due posti nello stesso istante: mandarli
   avanti in fila, in qualunque ordine, sveglia le falene sulla persona
   sbagliata, e Bea non regge un colpo. Anche suonare un attimo troppo
   presto basta a perderla: è la soluzione fragile qui sotto.

   LA MAPPA. 30×18. Il ballatoio di partenza è a ponente, con sotto il
   pozzetto che scende al deposito dell'olio (vicolo cieco: è lì che in
   due scene su tre è finita la lanterna, e andarla a prendere costa a
   Ras il vantaggio che gli serve). Un cunicolo stretto è l'**unico**
   ingresso alla sala delle falene — di lì passano tutti, ed è per
   questo che le falene si accorgono sempre di qualcuno. Dalla sala
   partono **due** gallerie verso la sala del pozzo, l'alta e la bassa:
   due strade vere, nessuna delle due sorvegliata, perché qui il
   pericolo non è dove passi ma quando parti. La nicchia è il vicolo
   cieco che scende dall'angolo di ponente della sala: lontano da tutti
   e due gli imbocchi, il posto dove la luce non dà fastidio a nessuno.
   ═══════════════════════════════════════════════════════════════════ */

/* ── le scorciatoie per scrivere i dati (le stesse di data/generale.js,
      ricopiate qui perché questo file deve stare in piedi da solo) ── */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })
const vedi = complemento => ({ cond: 'vedi', complemento })
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

const GALLERIA = (() => {
  const g = tela(30, 18)
  cava(g, 1, 6, 5, 13)        // il ballatoio: si arriva dal pozzo
  cava(g, 3, 14, 3, 16)       // il pozzetto che scende al deposito
  cava(g, 1, 16, 3, 16)       // il deposito dell'olio: vicolo cieco
  cava(g, 5, 9, 9, 9)         // il cunicolo, unico ingresso alla sala
  cava(g, 9, 4, 18, 14)       // la sala delle falene
  cava(g, 9, 15, 9, 16)       // la nicchia: vicolo cieco a mezzogiorno
  cava(g, 18, 5, 27, 5)       // la galleria alta
  cava(g, 18, 13, 27, 13)     // la galleria bassa
  cava(g, 24, 3, 28, 15)      // la sala del pozzo vecchio: la meta
  return stampa(g)
})()

/* IL PIANO DELLE FALENE, ed è tutto in quel `se`. Ce l'hanno tutte e
   tre uguale: dormono, e appena vedono qualcuno **decidono una volta
   sola**.
     · se è VERO che in quell'attimo non vedono Ras — cioè la luce è
       altrove — si buttano addosso a chi hanno davanti, e Bea non regge
       un colpo;
     · se è FALSO, cioè la luce è lì, il ramo del falso è vuoto e resta
       solo l'unica cosa che una falena sa fare: andare alla lanterna.
   I due `vai [la lanterna]` in fila non sono un doppione: la prima
   volta la raggiungono mentre lei cammina ancora e se la trovano
   addosso, poi lei riparte, e loro le rivanno dietro fin dove si
   ferma. Chi legge il piano lo vede: la luce se le porta dove vuole. */
const SCIAME = [
  o('aspettaDiVedere', 'fondi'),
  bivio(nonVedi('ras'), [o('attacca', 'fondi')]),
  o('vai', 'lanterna'),
  o('vai', 'lanterna'),
]

export const FONDI_3 = {
  id: 'fondi-falene', nome: 'Le falene',
  idea: 'Chi porta la luce si fa vedere apposta',
  storia: 'fondi', capitolo: 3, forma: 'esca', concetto: 'condizione',
  eredita: ['lanterna'], lascia: ['falene'],

  dritta: "Tocca una falena e <b>leggi il suo piano</b>: si sveglia appena vede qualcuno, e lì <b>decide</b>: addosso a chi ha davanti se è vero che non vede Ras, alla luce se è falso. La lanterna qui non aiuta: chiama.",
  racconto: "Nella sala dormono le falene bianche, e la luce le chiama tutte insieme: chi porta la lanterna di lì non passa, gli altri al buio sì. Si vince quando <b>Bea e Orso</b> sono nella sala del pozzo e <b>Ras</b> è fermo nella nicchia <b>con la lanterna ancora in mano</b> — l'esca deve essere lui, non un lume posato per terra. Si perde se le falene si buttano su Bea: non regge un colpo. Guarda bene <b>quando</b> decidono — è un attimo solo, e in quell'attimo la luce dev'essere già lì.",
  aiuti: [
    'Le falene scelgono una volta sola, nell’attimo in cui si svegliano: quello che vedono lì decide tutto il resto.',
    'Chi le sveglia è il primo che gli passa davanti. Se è Bea, la luce è ancora dall’altra parte e per lei è finita.',
    'Ras deve arrivare nella nicchia <b>prima</b> che gli altri due entrino nella sala — e gli altri due non possono saperlo da soli: qualcuno glielo deve suonare.',
  ],

  griglia: GALLERIA, ambiente: 'miniera',
  nomi: {
    lanterna: 'la lanterna', nicchia: 'la nicchia', uscita: 'la sala del pozzo',
    galleriaAlta: 'la galleria alta', galleriaBassa: 'la galleria bassa',
    fondi: 'i ladri dei Fondi', falene: 'le falene',
  },
  posti: {
    nicchia: { x: 9, y: 16 },
    uscita: { x: 27, y: 9 },
    galleriaAlta: { x: 20, y: 5 },
    galleriaBassa: { x: 20, y: 13 },
  },
  oggetti: [{ nome: 'lanterna', em: '🏮', x: 5, y: 13 }],
  segnali: ['ora', 'libero'],

  unita: [
    { id: 'ras', nome: 'Ras', fazione: 'fondi', emoji: '🥷', chi: 'ladra',
      vista: 6, vita: 8, x: 2, y: 9, sa: ['vai', 'prendi', 'suona', 'aspetta', 'quando'] },
    { id: 'bea', nome: 'Bea', fazione: 'fondi', emoji: '🔔', chi: 'elfo',
      vista: 2, vita: 1, x: 2, y: 11, sa: ['vai', 'aspetta', 'quando'] },
    /* Orso si chiama Orso, e allora è un orso: prima era disegnato
       cavaliere, cioè un nome e una figura che non si somigliavano —
       e in una scena dove il bambino deve distinguere tre dei suoi a
       colpo d'occhio (chi porta la luce, chi non regge un colpo, chi è
       grosso) la figura è metà del gioco. Le tre facce in scena sono
       tre: ladra, elfo, orso. */
    { id: 'orso', nome: 'Orso', fazione: 'fondi', emoji: '🐻', chi: 'orso',
      vista: 2, vita: 6, x: 2, y: 13, sa: ['vai', 'aspetta', 'quando'] },
    /* le falene non hanno un pittore loro: il più vicino è il goblin —
       piccolo, chiaro, che si muove a scatti — e almeno non si confonde
       con nessuno dei nostri tre. Il giorno che arriva un pittore
       `falena` si cambia questa parola e basta. */
    { id: 'falena1', nome: 'una falena', fazione: 'falene', emoji: '🦋', chi: 'goblin',
      vista: 5, vita: 2, x: 11, y: 8 },
    { id: 'falena2', nome: 'una falena', fazione: 'falene', emoji: '🦋', chi: 'goblin',
      vista: 5, vita: 2, x: 12, y: 9 },
    { id: 'falena3', nome: 'una falena', fazione: 'falene', emoji: '🦋', chi: 'goblin',
      vista: 5, vita: 2, x: 11, y: 10 },
  ],
  fazioni: {
    fondi: { nome: 'i ladri dei Fondi', autore: 'giocatore' },
    falene: { nome: 'le falene bianche', autore: 'livello',
              ordini: { falena1: SCIAME, falena2: SCIAME, falena3: SCIAME } },
  },

  /* nessuno può nominare le falene come bersaglio: `attacca` non entra
     in cassetta perché non ha niente da prendere. Qui non si mena a
     nessuno — si decide chi si fa guardare. */
  complementi: ['lanterna', 'nicchia', 'uscita', 'galleriaAlta', 'galleriaBassa',
                'ora', 'libero', 'momento'],
  condizioni: [
    vedi('falene'), nonVedi('falene'),
    { cond: 'hai', complemento: 'lanterna' },
    { cond: 'hai', complemento: 'lanterna', non: true },
  ],

  /* le quattro cose devono essere vere **nello stesso momento**: i due
     al pozzo, Ras nella nicchia, e la lanterna ancora in mano a lui.
     L'ultima non è un dettaglio — è tutto il capitolo: se la luce non
     ce l'ha addosso Ras, l'esca non è lui, e le falene la vanno a
     cercare dov'è rimasta. */
  obiettivo: [qui('bea', 'uscita'), qui('orso', 'uscita'), qui('ras', 'nicchia'),
              { cond: 'hai', chi: 'ras', complemento: 'lanterna' }],
  sconfitta: [caduto('bea')],
  motivoSconfitta: 'Le falene si sono buttate su Bea: la luce era dalla parte sbagliata.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA ──
     Roba che sta lì e basta: **non è in gioco**. Non passa dal motore —
     `creaMondo` non la guarda nemmeno — quindi non si prende, non si
     nomina in un ordine, non compare fra i bersagli. Serve a una cosa
     sola: che la sala delle falene non sia un rettangolo vuoto e che le
     tre scene non sembrino la stessa. Spostarla non cambia una virgola
     di quello che succede. */
  scenografia: [
    { che: 'cassa', x: 1, y: 6 }, { che: 'botte', x: 4, y: 6 },
    { che: 'sacco', x: 1, y: 8 }, { che: 'pozzanghera', x: 4, y: 11, strato: -1 },
    { che: 'cartello', x: 5, y: 10 }, { che: 'ragnatela', x: 3, y: 15, strato: -1 },
    { che: 'barile', x: 3, y: 16 },
    { che: 'stalagmite', x: 10, y: 4 }, { che: 'cristallo', x: 17, y: 4 },
    { che: 'ossa', x: 9, y: 7 }, { che: 'fungo', x: 16, y: 6 },
    { che: 'stalagmite', x: 15, y: 11 }, { che: 'ossa', x: 14, y: 12 },
    { che: 'fungo', x: 10, y: 13 }, { che: 'acqua', x: 13, y: 14, strato: -1 },
    { che: 'ragnatela', x: 9, y: 15, strato: -1 },
    { che: 'cristallo', x: 22, y: 5 }, { che: 'fungo', x: 25, y: 5 },
    { che: 'ossa', x: 22, y: 13 }, { che: 'acqua', x: 25, y: 13, strato: -1 },
    { che: 'pozzo', x: 28, y: 8 }, { che: 'catena', x: 28, y: 9 },
    { che: 'colonna', x: 24, y: 11 }, { che: 'carrello', x: 26, y: 15 },
    { che: 'binario', x: 25, y: 15, strato: -1 },
  ],

  /* tre scene, stesso ragionamento: cambia quanto costa a Ras andare a
     prendere la lanterna (cioè quanto vantaggio ha sugli altri due),
     dove dormono le falene e dov'è l'uscita. Chi conta i passi a mano
     ne indovina una e sbaglia le altre. */
  varianti: [
    { nome: 'la lanterna sul ballatoio',
      oggetti: { lanterna: { x: 5, y: 13 } },
      unita: { falena1: { x: 11, y: 8 }, falena2: { x: 12, y: 9 }, falena3: { x: 11, y: 10 } },
      posti: { uscita: { x: 27, y: 9 } } },
    { nome: 'la lanterna in fondo al deposito',
      oggetti: { lanterna: { x: 1, y: 16 } },
      unita: { falena1: { x: 11, y: 7 }, falena2: { x: 12, y: 8 }, falena3: { x: 11, y: 9 } },
      posti: { uscita: { x: 26, y: 14 } } },
    { nome: "la lanterna all'imbocco del deposito",
      oggetti: { lanterna: { x: 2, y: 16 } },
      unita: { falena1: { x: 11, y: 9 }, falena2: { x: 12, y: 10 }, falena3: { x: 11, y: 7 } },
      posti: { uscita: { x: 27, y: 4 } } },
  ],

  soluzioni: [
    /* 7 ordini, ed è il par. La luce va per prima, e chi resta al buio
       parte quando glielo dicono. Ogni ordine serve, provato a levarli
       uno per uno: senza `prendi` l'esca è un lume per terra e le
       falene ci volano invece che addosso a Ras, senza `vai [nicchia]`
       non si svegliano nemmeno, senza `suona` gli altri due restano lì
       per sempre, e senza l'ascolto partono troppo presto. */
    { nome: 'la luce va per prima', piano: {
      ras: [o('prendi', 'lanterna'), o('vai', 'nicchia'), o('suona', 'ora')],
      bea: [quando('ora', o('vai', 'uscita'))],
      orso: [quando('ora', o('vai', 'uscita'))],
    } },
    /* qui c'era la stessa cosa scritta con `aspetta [il segnale]`, per
       far vedere due forme che pesano uguale. Non c'è più: un segnale è
       un MESSAGGIO, e i messaggi si ricevono con `quando senti` — con
       `aspetta` si guarda uno stato del mondo, e solo quello che si
       vede da dov'è. Un meccanismo, un verbo. */
    /* e la stessa cosa col bivio scritto anche dalla nostra parte: si
       parte se è vero che davanti non c'è nessuna falena. Non serve — le
       falene a quel punto sono già tutte sulla lanterna — ma è come la
       racconterebbe Bea, ed è il verso giusto in cui leggere una
       condizione: il ramo del falso resta vuoto, e vuol dire «e allora
       niente». */
    { nome: 'si parte se la galleria è buia', piano: {
      ras: [o('prendi', 'lanterna'), o('vai', 'nicchia'), o('suona', 'ora')],
      bea: [quando('ora', bivio(nonVedi('falene'), [o('vai', 'uscita')]))],
      orso: [quando('ora', bivio(nonVedi('falene'), [o('vai', 'uscita')]))],
    } },
    /* FRAGILE: suonare appena si ha la lanterna in mano invece che
       quando si è arrivati. Regge nella prima scena, dove la lanterna è
       sul ballatoio dalla parte del cunicolo e Ras riparte comunque
       davanti a tutti; casca nelle altre due, dove va raccolta giù nel
       deposito — Bea entra nella sala mentre la luce è ancora
       dall'altra parte, e le falene decidono su di lei. */
    { nome: 'suona subito', fragile: true, piano: {
      ras: [o('prendi', 'lanterna'), o('suona', 'ora'), o('vai', 'nicchia')],
      bea: [quando('ora', o('vai', 'uscita'))],
      orso: [quando('ora', o('vai', 'uscita'))],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto. Sono
     le prove che stanno scritte a parole là in testa: adesso girano. */
  verifiche: {
    /* «mandarli avanti in fila, in qualunque ordine, sveglia le falene
       sulla persona sbagliata»: tolta la sincronizzazione — i «quando
       senti» srotolati, le guardie via — il piano cade */
    nonInFila: true,
    /* i tre non sono intercambiabili: chi porta la luce fa l'esca, gli
       altri due passano al buio, e nessuno dei tre ce la fa da solo */
    serveOgnuno: true,
    /* «anche suonare un attimo troppo presto basta a perderla»: è la
       stessa inversione della soluzione fragile qui sopra */
    ordineConta: [['vai nicchia', 'suona ora']],
  },
}

export default FONDI_3
