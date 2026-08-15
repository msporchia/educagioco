/* ═══════════════════════════════════════════════════════════════════
   🧂 LA CAROVANA DEL SALE — capitolo 2: «La sbarra del pedaggio»
   forma: apripista · concetto: prossimità

   LA STORIA. Un giorno di strada dopo il paese c'è il pedaggio: una
   sbarra di traverso e una garitta di legno appoggiata alla sbarra. Il
   gabelliere dorme col mento sul davanzale della finestra, e la
   finestra guarda **un pezzo di strada solo** — quello che gli passa
   sotto il naso. La manovella della sbarra è dentro la garitta, e
   nella garitta il carro non ci entra: ci entra Bugo, e ci entra dal
   retro, per il sentiero delle capre che sale a monte della strada.

   EREDITA dal capitolo 1 **il sale**: sei sacchi sul carro, e il carro
   pesante ha una strada sola.
   LASCIA **la sbarra alzata**. Nessuno la richiude, e nell'ultimo
   capitolo è la strada corta per tornare al paese.

   COSA INSEGNA. Due cose che stanno insieme, e sono la stessa cosa
   guardata da due lati.

   PROSSIMITÀ, DALLA PARTE DI CHI FA: per aprire una cosa bisogna
   esserle **vicini**. Non c'è nessuna leva che agisca da lontano, e la
   manovella non arriva alla sbarra da sola: chi apre ci deve andare, e
   chi apre non è chi passa. Perciò il piano di Bugo è un giro tutto
   suo, che non somiglia per niente a quello del carro.

   PROSSIMITÀ, DALLA PARTE DI CHI GUARDA: il gabelliere non è
   onnisciente, **vede solo chi gli passa accanto**. Una casella più in
   là e non c'è. La strada si allarga in una piazzola proprio lì
   davanti, ed è per quello che esiste: il carro passa dal largo e non
   sotto la finestra. Chi scrive «vai oltre la sbarra» e basta manda il
   carro per la via più corta, che è dritta sotto il davanzale.

   E POI IL TEMPO. La sbarra è chiusa, e **camminare verso una porta
   chiusa non è aspettare**: chi ci prova si pianta lì e dopo un po' si
   arrende — il registro lo dice, «la strada è chiusa». Aspettare è un
   ordine, si scrive, e vuole di vedere la cosa che si aspetta: perciò
   il carro prima si mette nel largo, da dove la sbarra si vede, e poi
   aspetta. Il giro di Bugo è lungo il triplo: chi non mette l'attesa
   perde il carro molto prima che la sbarra si alzi.

   LA MAPPA (32×16). Una strada dritta da ponente a levante, la
   piazzola del pedaggio appesa sotto, lo slargo dove ci si rimette in
   fila appeso sopra dopo la sbarra, la garitta appesa sopra con la
   sua finestra a mezzogiorno, e in alto il sentiero delle capre: parte
   dalla strada molto indietro, corre a monte e ridiscende dentro la
   garitta. Sono due mondi che si toccano in un punto solo — la
   finestra — ed è il punto da non toccare.
   ═══════════════════════════════════════════════════════════════════ */

/* ── le scorciatoie per scrivere i dati (le stesse di data/generale.js,
      ricopiate qui perché questo file deve stare in piedi da solo) ── */
const o = (verbo, complemento) => ({ verbo, complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })

function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const PEDAGGIO = (() => {
  const g = tela(32, 16)
  cava(g, 1, 11, 30, 11)     // la strada maestra
  cava(g, 17, 11, 17, 13)    // la piazzola: si stacca dalla strada…
  cava(g, 23, 11, 23, 13)    // …e ci rientra più avanti
  cava(g, 17, 13, 23, 13)
  cava(g, 18, 7, 22, 9)      // la garitta del gabelliere
  cava(g, 20, 10, 20, 10)    // la finestra: l'unico punto che si tocca
  cava(g, 6, 4, 6, 11)       // il sentiero delle capre, che sale
  cava(g, 6, 4, 19, 4)       // …corre a monte della strada…
  cava(g, 19, 4, 19, 7)      // …e ridiscende dentro la garitta, dal retro
  cava(g, 29, 9, 29, 11)     // lo slargo dopo il pedaggio: si esce di strada
  return stampa(g)
})()

export const SALE_2 = {
  id: 'sale-sbarra', nome: 'La sbarra del pedaggio',
  idea: 'Chi apre non è chi passa, e chi guarda vede solo da vicino',
  storia: 'sale', capitolo: 2, emoji: '🚧',
  forma: 'apripista', concetto: 'prossimita',
  eredita: ['sale'], lascia: ['sbarra'],

  dritta: 'La manovella è <b>dentro</b> la garitta e la sbarra è <b>fuori</b>: per aprire bisogna essere vicini, e chi apre non è chi passa. Il gabelliere vede solo chi gli passa <b>sotto il naso</b>: la strada davanti alla finestra è una casella sola, e il largo serve a girarle intorno.',
  racconto: 'La sbarra si alza solo con la manovella, e la manovella è nella garitta: nella garitta il carro non entra, ci entra Bugo <b>dal sentiero di monte</b>. Il gabelliere dorme sul davanzale e vede una casella sola di strada: quella davanti alla finestra. Si vince quando <b>il carro e Vito sono oltre la sbarra</b> e lui <b>dorme ancora</b>. E ricordati: camminare verso una sbarra chiusa non è aspettarla — chi ci prova si pianta e si arrende.',
  aiuti: [
    'Il giro di Bugo è lungo: sentiero, manovella, e poi <b>di nuovo il sentiero</b> per tornare dalla parte giusta.',
    'Chi va «oltre la sbarra» per la via più corta passa sotto la finestra. Mettici in mezzo <b>il largo</b>.',
    'Nel largo la sbarra si vede: da lì il carro può <b>aspettare</b> che si alzi. Da più lontano no — non si può aspettare quello che non si vede.',
  ],

  griglia: PEDAGGIO, ambiente: 'bosco',
  /* le caselle si possono nominare: serve alla soluzione fragile qui
     sotto, che è tutta lì — un numero scritto a mano invece di un nome */
  celle: true,

  nomi: {
    manovella: 'la manovella della sbarra', sbarra: 'la sbarra del pedaggio',
    largo: 'il largo del pedaggio', retro: 'il sentiero di monte',
    oltre: 'la strada dopo il pedaggio',
    carovana: 'la carovana', pedaggio: 'il pedaggio',
  },
  posti: {
    largo: { x: 20, y: 13 },
    retro: { x: 6, y: 4 },
    oltre: { x: 30, y: 11 },
  },
  porte: {
    sbarra: { x: 25, y: 11, chiave: 'manovella' },
  },
  oggetti: [
    { nome: 'manovella', em: '⚙️', pittore: 'ruota', x: 18, y: 8 },
  ],
  segnali: ['sveglia'],

  unita: [
    /* Rea vede lontano otto caselle: quanto basta a tenere d'occhio la
       sbarra **dal largo**, e non da più indietro. È la sua vista che
       decide da dove il carro può aspettare, ed è per questo che il
       largo non è un ornamento: è il posto da cui si vede. */
    { id: 'rea', nome: 'nonna Rea', fazione: 'carovana', emoji: '🧓', chi: 'mago',
      vista: 8, vita: 4, x: 2, y: 11, sa: ['vai', 'aspetta'] },
    { id: 'vito', nome: 'Vito', fazione: 'carovana', emoji: '🛡️', chi: 'cavaliere',
      vista: 8, vita: 10, x: 3, y: 11, sa: ['vai', 'aspetta'] },
    { id: 'bugo', nome: 'Bugo', fazione: 'carovana', emoji: '🔧', chi: 'ladra',
      vista: 5, vita: 6, x: 1, y: 11, sa: ['vai', 'prendi', 'apri'] },
    /* IL GABELLIERE. Non ha ordini: dorme, e non si muove per nessun
       motivo. Quello che fa sta tutto nella sua scheda — `grida` — e
       vale una casella: se gli passi accanto ti vede, e uno sveglio è
       peggio di una sbarra. */
    { id: 'gabelliere', nome: 'il gabelliere', fazione: 'pedaggio', emoji: '💤', chi: 'guardia',
      vista: 1, vita: 12, x: 20, y: 10, grida: 'sveglia' },
  ],
  fazioni: {
    carovana: { nome: 'la carovana', autore: 'giocatore' },
    pedaggio: { nome: 'il pedaggio', autore: 'livello' },
  },

  complementi: ['manovella', 'sbarra', 'largo', 'retro', 'oltre'],

  obiettivo: [qui('rea', 'oltre'), qui('vito', 'oltre')],
  sconfitta: [{ cond: 'segnale', complemento: 'sveglia' }],
  motivoSconfitta: 'Il gabelliere si è svegliato: qualcuno gli è passato sotto il naso.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA — solo disegno, non passa dal motore ── */
  scenografia: [
    { che: 'roccia', x: 7, y: 4 }, { che: 'cespuglio', x: 9, y: 4 },
    { che: 'albero', x: 13, y: 4 }, { che: 'cespuglio', x: 16, y: 4 },
    { che: 'roccia', x: 18, y: 4 }, { che: 'cespuglio', x: 6, y: 8 },
    { che: 'pozzanghera', x: 6, y: 10, strato: -1 },
    { che: 'pozzanghera', x: 8, y: 11, strato: -1 }, { che: 'cartello', x: 12, y: 11 },
    { che: 'albero', x: 15, y: 11 }, { che: 'roccia', x: 27, y: 11 },
    { che: 'bandiera', x: 26, y: 11 },
    { che: 'cassa', x: 18, y: 7 }, { che: 'botte', x: 22, y: 7 },
    { che: 'tenda', x: 21, y: 9 }, { che: 'braciere', x: 18, y: 9 },
    { che: 'barile', x: 19, y: 13 }, { che: 'cassa', x: 21, y: 13 },
    { che: 'cartello', x: 17, y: 12 }, { che: 'cespuglio', x: 23, y: 12 },
  ],

  /* Tre scene, e cambia il GIRO, non l'arredamento: dove sta la
     manovella dentro la garitta, quanto più avanti è la sbarra, dove si
     allarga il largo e dove finisce la strada. Il ragionamento resta
     uno — sentiero, manovella, largo, sbarra — ma i passi non sono mai
     gli stessi, e il piano che ha imparato i numeri invece dei nomi
     casca. */
  varianti: [
    { nome: 'la manovella appena dentro',
      oggetti: { manovella: { x: 18, y: 8 } },
      porte: { sbarra: { x: 25, y: 11 } },
      posti: { largo: { x: 20, y: 13 }, retro: { x: 6, y: 4 }, oltre: { x: 30, y: 11 } },
      unita: { rea: { x: 2, y: 11 }, vito: { x: 3, y: 11 }, bugo: { x: 1, y: 11 } } },
    { nome: 'la manovella in fondo, e la sbarra più avanti',
      oggetti: { manovella: { x: 22, y: 9 } },
      porte: { sbarra: { x: 28, y: 11 } },
      posti: { largo: { x: 22, y: 13 }, retro: { x: 6, y: 5 }, oltre: { x: 29, y: 9 } },
      unita: { rea: { x: 1, y: 11 }, vito: { x: 2, y: 11 }, bugo: { x: 3, y: 11 } } },
    { nome: 'la sbarra a ridosso del largo',
      oggetti: { manovella: { x: 19, y: 9 } },
      porte: { sbarra: { x: 24, y: 11 } },
      posti: { largo: { x: 18, y: 13 }, retro: { x: 6, y: 6 }, oltre: { x: 30, y: 11 } },
      unita: { rea: { x: 4, y: 11 }, vito: { x: 2, y: 11 }, bugo: { x: 2, y: 11 } } },
  ],

  soluzioni: [
    /* undici ordini, ed è il par. Cinque a Bugo — e il terzo è quello
       che sorprende: dopo la manovella deve **rifare tutto il sentiero
       al contrario**, perché dalla garitta a qualunque punto della
       strada la via corta passa sotto la finestra. Tre a testa al carro e alla scorta:
       mettersi nel largo, aspettare lì che la sbarra si alzi, e solo
       allora passare. */
    { nome: 'il giro di Bugo e l\'attesa del carro', piano: {
      bugo: [o('vai', 'retro'), o('prendi', 'manovella'), o('vai', 'retro'),
             o('vai', 'largo'), o('apri', 'sbarra')],
      rea: [o('vai', 'largo'), o('aspetta', 'sbarra'), o('vai', 'oltre')],
      vito: [o('vai', 'largo'), o('aspetta', 'sbarra'), o('vai', 'oltre')],
    } },
    /* FRAGILE: la scorta si scrive la meta a mano. «Oltre il pedaggio»
       nella prima scena è la casella (30,11), e per una scena il numero
       e il nome dicono la stessa cosa; nella seconda la strada finisce
       una casella prima, Vito si ferma sulla casella giusta del mondo
       sbagliato e il carro resta lì ad aspettarlo. Un nome segue la
       cosa dovunque vada, un numero no. */
    { nome: 'la meta scritta a mano', fragile: true, piano: {
      bugo: [o('vai', 'retro'), o('prendi', 'manovella'), o('vai', 'retro'),
             o('vai', 'largo'), o('apri', 'sbarra')],
      rea: [o('vai', 'largo'), o('aspetta', 'sbarra'), o('vai', 'oltre')],
      vito: [o('vai', 'largo'), o('aspetta', 'sbarra'), o('vai', '30,11')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ── */
  verifiche: {
    /* «chi non mette l'attesa perde il carro»: tolte le attese, il carro
       parte subito, arriva sotto una sbarra chiusa e si arrende lì */
    nonInFila: true,
    /* tre mestieri diversi: Bugo non è il carro, il carro non apre
       niente, e nessuno dei tre arriva in fondo da solo */
    serveOgnuno: true,
    ordineConta: [
      /* prima il largo, poi oltre: al contrario il carro prende la via
         corta, che è dritta sotto la finestra */
      ['vai largo', 'vai oltre'],
      /* e la manovella prima della sbarra, che è la prossimità detta
         nell'altro verso */
      ['prendi manovella', 'apri sbarra'],
    ],
    /* senza la manovella la sbarra non si alza, e non c'è nessun'altra
       strada per il carro */
    senza: ['manovella'],
  },
}

export default SALE_2
