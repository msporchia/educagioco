/* ═══════════════════════════════════════════════════════════════════
   🥚 IL NIDO DI BRASA — capitolo 1: «Il primo ladro»
   forma: interdizione · concetto: la fila (una meta alla volta)

   LA STORIA. Stavolta il mostro sei tu. Un uomo con un sacco sta
   salendo al nido, e sulla neve i suoi passi si leggono: il suo piano
   è scritto e si apre toccandolo, prima ancora di firmare il tuo. Non
   c'è niente da prendere e niente da aprire: c'è una sola domanda,
   **dove ti metti**.

   EREDITA: niente, è il primo. LASCIA **la voce in paese** — e il filo
   sta tutto nel modo in cui si vince: il ladro non si prende, si fa
   tornare indietro. Uno che torna a valle racconta, e nel capitolo 2
   sotto la parete ce ne sono sei.

   COSA INSEGNA. Che una fila di tre ordini è già un piano, e che il
   posto giusto non è dove sta lui adesso ma dove sarà fra venti passi.
   Brasa è grande e lenta: dietro a un uomo non ci arriva mai, e
   **inseguirlo è l'unica cosa che non funziona**. Il suo piano invece
   dice tutto:

       vai al bivio
       ❓ vedi i draghi?  sì → prendo la cengia, e su di lì
                         no → tiro dritto fino a mezzacosta
       ❓ vedi i draghi?  sì → torno a valle
                         no → salgo al nido

   Da qui esce tutto. Farsi vedere **al bivio** è la mossa sbagliata —
   quello gira per la cengia e al nido ci arriva lo stesso. Farsi
   vedere **a mezzacosta**, quando la cengia se l'è già lasciata
   indietro, è la mossa giusta: lì non ha più un'altra strada e torna
   giù. Quindi Brasa deve stare nascosta finché lui non ha passato il
   bivio, e uscire un attimo dopo: **un momento in due posti** — lei
   nella tana, lui che passa — e i tre ordini servono tutti e tre.

   E NON SI VINCE PRENDENDOLO. `attacca` Brasa lo sa fare, ed è la
   tentazione: ma la scena finisce bene solo quando lui è di nuovo giù
   in fondovalle. Un ladro caduto sulla neve non torna a raccontare
   niente, e la partita si chiude senza missione compiuta. È la forma
   dell'obiettivo: *interdizione* — non serve prenderlo, serve che non
   ci arrivi.

   LA MAPPA (28×17), la parete vista di fianco. In basso il fondovalle,
   che porta al paese (a ponente) e da cui si sale per un canale solo.
   A mezza altezza **il sentiero**, la strada lunga e comoda; più su
   **la cengia**, che ci si arriva dal camino e gira larga; in cima
   **la cornice del nido**, dove Brasa sta sull'uovo. Sul percorso ci
   sono quattro tane cieche — nicchie profonde tre passi — e sono
   l'unica cosa che rende possibile stare *vicino* senza essere visti:
   Brasa vede a sei passi, l'uomo a tre.

   LE TRE SCENE. Cambia dove l'uomo si ferma a guardare, e quindi quale
   tana serve: una volta la nicchia del sentiero, una volta la fessura
   sopra la cengia, una volta la tana sotto la cornice. Il ragionamento
   è sempre lo stesso — «nasconditi fuori dai suoi tre passi, esci
   quando ha passato il bivio» — ma chi ha scritto le caselle a mano
   invece dei nomi ne indovina una e sbaglia le altre.
   ═══════════════════════════════════════════════════════════════════ */

/* le scorciatoie per scrivere i dati, le stesse degli altri livelli:
   ricopiate qui perché questo file deve stare in piedi da solo */
const o = (verbo, complemento) => ({ verbo, complemento })
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })
const vedi = complemento => ({ cond: 'vedi', complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })

/* la parete non si scrive a mano: si scava */
function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const PARETE = (() => {
  const g = tela(28, 17)
  cava(g, 1, 15, 26, 15)      // il fondovalle: a ponente c'è il paese
  cava(g, 4, 11, 4, 15)       // il canale di ponente: l'unica salita
  cava(g, 4, 11, 24, 11)      // il sentiero, a mezza parete
  cava(g, 10, 8, 10, 10)      // la nicchia bassa      (tana cieca)
  cava(g, 16, 8, 16, 10)      // la nicchia di mezzo   (tana cieca)
  cava(g, 7, 6, 7, 11)        // il camino: dal sentiero alla cengia
  cava(g, 7, 6, 20, 6)        // la cengia alta, che gira larga
  cava(g, 12, 3, 12, 5)       // la fessura sopra la cengia (tana cieca)
  cava(g, 22, 5, 22, 11)      // il canale di levante: dal sentiero alla cornice
  cava(g, 19, 8, 21, 8)       // la tana sotto la cornice   (tana cieca)
  cava(g, 20, 5, 26, 5)       // la cornice del nido
  return stampa(g)
})()

/* IL PIANO DEL LADRO, e si legge tutto prima di firmare il proprio.
   Due volte si ferma e guarda, e le due volte non valgono uguale: alla
   prima ha ancora due strade, alla seconda una sola. */
const LADRO = [
  o('vai', 'bivio'),
  bivio(vedi('draghi'),
    [o('vai', 'cengia'), o('vai', 'nido')],   // c'è il drago: giro largo
    [o('vai', 'mezzacosta')]),                // via libera: tiro dritto
  bivio(vedi('draghi'),
    [o('vai', 'valle')],                      // me lo trovo addosso: torno giù
    [o('vai', 'nido')]),
]

export const NIDO_1 = {
  id: 'nido-primo-ladro', nome: 'Il primo ladro',
  storia: 'nido', capitolo: 1, emoji: '🥚',
  idea: 'Non si insegue chi cammina: ci si mette dove passerà',
  forma: 'interdizione', concetto: 'sequenza',
  eredita: [], lascia: ['voce'],

  dritta: "Tocca il ladro e <b>leggi la sua strada</b>: si ferma due volte a guardare. Al bivio ha ancora la cengia, e se ti vede lì gira largo; a mezzacosta non ha più niente, e se ti vede lì torna a valle. Brasa è lenta: da dietro non lo prende mai.",
  racconto: "Un uomo con un sacco sta salendo al nido, e sulla neve i suoi passi si leggono. Si vince quando <b>è tornato giù a valle</b>: non serve prenderlo, serve che non ci arrivi — e uno che torna indietro lo racconta a tutti. Si perde se arriva al nido. Brasa vede a sei passi, lui a tre: nelle tane cieche gli si può stare accanto senza farsi vedere.",
  aiuti: [
    'Farsi vedere al bivio non serve: lì una seconda strada ce l\'ha ancora.',
    'Le nicchie sono profonde tre passi: dentro una, i suoi occhi non ci arrivano.',
    'Tre ordini in fila: entra nella tana, aspetta di vederlo, esci a mezzacosta.',
  ],

  griglia: PARETE, ambiente: 'bosco', celle: true,

  nomi: {
    valle: 'il fondovalle', bivio: 'il bivio', mezzacosta: 'mezzacosta',
    riparo: 'la tana', cengia: 'la cengia', nido: 'il nido',
    draghi: 'i draghi', ladri: 'i ladri del paese',
  },
  posti: {
    valle: { x: 2, y: 15 },
    bivio: { x: 14, y: 11 },
    mezzacosta: { x: 17, y: 11 },
    riparo: { x: 16, y: 8 },
    cengia: { x: 10, y: 6 },
    nido: { x: 25, y: 5 },
  },

  unita: [
    /* Brasa: grande, lenta, e la sola cosa che vede meglio di tutti è
       il buio. `attacca` lo sa fare — ed è la tentazione di questo
       capitolo, non la soluzione. */
    { id: 'brasa', nome: 'Brasa', fazione: 'draghi', emoji: '🐲', chi: 'orso', manto: 'bruno',
      vista: 6, vita: 14, x: 25, y: 5,
      sa: ['vai', 'attacca', 'aspetta', 'aspettaDiVedere'] },
    { id: 'ladro', nome: 'il ladro col sacco', fazione: 'ladri', emoji: '🎒', chi: 'ladra',
      vista: 3, vita: 3, x: 26, y: 15 },
  ],
  fazioni: {
    draghi: { nome: 'i draghi del nido', autore: 'giocatore' },
    ladri: { nome: 'il ladro col sacco', autore: 'livello', ordini: { ladro: LADRO } },
  },
  complementi: ['valle', 'bivio', 'mezzacosta', 'riparo', 'cengia', 'nido', 'ladri'],

  /* l'INTERDIZIONE in una riga sola: non «il ladro è caduto», ma «il
     ladro è di nuovo là sotto». È la differenza fra fermarlo e
     prenderlo, ed è tutta la forma di questo capitolo. */
  obiettivo: [qui('ladro', 'valle')],
  sconfitta: [qui('ladro', 'nido')],
  motivoSconfitta: 'Il ladro è arrivato al nido, e l\'uovo è finito nel sacco.',
  mostraNemici: true,
  pianoVisibile: true,

  /* ── LA SCENOGRAFIA ──
     Roba che sta lì e basta: non passa dal motore, non si prende e non
     si nomina. Serve a far vedere che è una montagna e non un
     labirinto. */
  scenografia: [
    { che: 'albero', x: 6, y: 15 }, { che: 'cespuglio', x: 9, y: 15 },
    { che: 'roccia', x: 13, y: 15 }, { che: 'albero', x: 17, y: 15 },
    { che: 'cespuglio', x: 21, y: 15 }, { che: 'pozzanghera', x: 24, y: 15, strato: -1 },
    { che: 'roccia', x: 5, y: 11 }, { che: 'ossa', x: 8, y: 11 },
    { che: 'cristallo', x: 12, y: 11 }, { che: 'roccia', x: 20, y: 11 },
    { che: 'stalagmite', x: 23, y: 11 },
    { che: 'cristallo', x: 10, y: 9 }, { che: 'ossa', x: 16, y: 9 },
    { che: 'ragnatela', x: 12, y: 4, strato: -1 }, { che: 'cristallo', x: 20, y: 8 },
    { che: 'roccia', x: 8, y: 6 }, { che: 'cespuglio', x: 14, y: 6 },
    { che: 'stalagmite', x: 18, y: 6 }, { che: 'cristallo', x: 7, y: 8 },
    { che: 'ossa', x: 22, y: 9 }, { che: 'roccia', x: 21, y: 5 },
    { che: 'stalagmite', x: 23, y: 5 }, { che: 'ossa', x: 26, y: 5 },
  ],

  /* Tre scene: cambia il punto in cui l'uomo si ferma a guardare, e
     quindi quale tana serve. La domanda è sempre la stessa, la casella
     giusta mai. */
  varianti: [
    { nome: 'si ferma sul sentiero',
      posti: { bivio: { x: 14, y: 11 }, mezzacosta: { x: 17, y: 11 },
               riparo: { x: 16, y: 8 }, cengia: { x: 10, y: 6 },
               valle: { x: 2, y: 15 }, nido: { x: 25, y: 5 } },
      unita: { ladro: { x: 26, y: 15 } } },
    { nome: 'si ferma sulla cengia',
      posti: { bivio: { x: 10, y: 6 }, mezzacosta: { x: 13, y: 6 },
               riparo: { x: 12, y: 3 }, cengia: { x: 18, y: 11 },
               valle: { x: 2, y: 15 }, nido: { x: 25, y: 5 } },
      unita: { ladro: { x: 25, y: 15 } } },
    { nome: 'si ferma sotto la cornice',
      posti: { bivio: { x: 22, y: 10 }, mezzacosta: { x: 22, y: 7 },
               riparo: { x: 19, y: 8 }, cengia: { x: 16, y: 6 },
               valle: { x: 3, y: 15 }, nido: { x: 25, y: 5 } },
      unita: { ladro: { x: 26, y: 15 } } },
  ],

  par: 3,
  soluzioni: [
    /* tre ordini, ed è il par: entra nella tana, aspetta di vederlo,
       esci dove lui non ha più una seconda strada. Provati a togliere
       uno per uno: senza la tana lo aspetta dal nido e lo vede troppo
       tardi; senza l'attesa esce troppo presto e lui gira per la
       cengia; senza l'ultimo passo resta nascosta e lui tira dritto. */
    { nome: 'la tana, e poi fuori a mezzacosta', piano: {
      brasa: [o('vai', 'riparo'), o('aspettaDiVedere', 'ladri'), o('vai', 'mezzacosta')],
    } },
    /* FRAGILE: la stessa idea scritta con le caselle invece che coi
       nomi. Nella prima scena i due numeri ci azzeccano; nelle altre
       due la tana giusta è un'altra e Brasa aspetta in un buco vuoto
       mentre l'uomo sale dall'altra parte. */
    { nome: 'a casella', fragile: true, piano: {
      brasa: [o('vai', '16,8'), o('aspettaDiVedere', 'ladri'), o('vai', '17,11')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ── */
  verifiche: {
    /* srotolando l'attesa Brasa esce subito allo scoperto: l'uomo la
       vede dal bivio, gira per la cengia e al nido ci arriva */
    nonInFila: true,
    /* e i due «vai» non si scambiano: prima la tana, poi mezzacosta */
    ordineConta: [['vai riparo', 'vai mezzacosta']],
  },
}

export default NIDO_1
