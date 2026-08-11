/* ═══════════════════════════════════════════════════════════════════
   🕹️ LA PROVA DEI CONGEGNI — leva, totem e una porta a comando

   Non è un capitolo di una storia: è il banco di prova dei congegni
   (`motore/generale/elementi/leva.js`, `totem.js`). Non è appaiato a
   nessuna `STORIA` in `data/storie-generale.js` apposta — resta uno
   scenario da test, e `data/mappe-storie.js` lo mette fra gli
   «spaiati» senza che questo rompa niente: lo raccoglie comunque
   `test/unita/livelli.test.mjs`, che è la sua unica rete.

   IL CORRIDOIO E LE TRE NICCHIE. Un corridoio dritto (y=3), e tre
   nicchie di una cella sola affacciate su di lui, ognuna dietro una
   porta A COMANDO (`aMano:false`: non si apre camminandoci):

     x=4   il tesoro, dietro la GRATA
     x=7   il totem, dietro la SARACINESCA
     x=12  il traguardo, dietro il PORTONE FINALE

   LA LEVA (x=3, in mezzo al corridoio, non dietro niente) è collegata
   a DUE porte insieme: la grata e la saracinesca — «premi qui e apri
   due varchi alla volta» è esattamente il punto della leva (§8.2 del
   piano). Il totem, una volta a tre tacche, apre da solo il portone
   finale: è lui il terzo comando, e non lo manda la leva.

   LA SOLUZIONE STRETTA usa `ripeti … finché il totem è a 3»: è il
   regalo del totem, un `for` senza inventare un blocco nuovo (§8.3). La
   soluzione «lunga» rifà lo stesso a mano, tre `premi` invece del
   ciclo, e in mezzo controlla esplicitamente che la leva sia stata
   premuta (`aspetta che [è stata premuta]`, la condizione `premuto:`)
   — costa di più, il par non la premia né la vieta, ed è qui apposta
   per far vedere anche quella condizione al lavoro.
   ═══════════════════════════════════════════════════════════════════ */

function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

/* 17×5: un corridoio (y=3, x1-15) e tre nicchie di una cella (y=1),
   ognuna con la sua porta subito sotto (y=2). Le porte non sono nel
   disegno — sono dato a parte, come sempre — ma la cella dev'essere
   pavimento perché ci si passi quando si aprono. */
const CORRIDOIO = (() => {
  const g = tela(17, 5)
  cava(g, 1, 3, 15, 3)     // il corridoio
  cava(g, 4, 1, 4, 1); cava(g, 4, 2, 4, 2)     // la nicchia del tesoro
  cava(g, 7, 1, 7, 1); cava(g, 7, 2, 7, 2)     // la nicchia del totem
  cava(g, 12, 1, 12, 1); cava(g, 12, 2, 12, 2) // la nicchia del traguardo
  return stampa(g)
})()

const o = (verbo, complemento) => ({ verbo, complemento })
const ciclo = (corpo, finche) => ({ blocco: 'ripeti', corpo, finche })
const aspettaChe = cond => ({ verbo: 'aspetta', cond })
const almeno = (complemento, n) => ({ cond: 'almeno', complemento, n })
const premuto = complemento => ({ cond: 'premuto', complemento })
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })

export const CONGEGNI = {
  id: 'prova-congegni', nome: 'La prova dei congegni', emoji: '🕹️',
  idea: 'Una leva apre due varchi insieme; un totem conta finché non ne apre uno lui',

  dritta: "Premi <b>la leva rossa</b>: apre la grata E la saracinesca insieme. Dietro la saracinesca c'è <b>il totem</b> — premilo finché non arriva a tre, e apre da solo il portone finale.",
  racconto: "Un corridoio, tre nicchie chiuse. La leva ne apre due in un colpo solo; la terza la apre il totem, quando arriva a tre.",
  aiuti: [
    'La leva è collegata a due porte insieme: una leva sola le apre tutte e due.',
    'Il totem non scatta al primo tocco: conta. Un ciclo che si ferma «quando il totem è a 3» è già un for.',
  ],

  griglia: CORRIDOIO, ambiente: 'cortile',

  nomi: {
    levaRossa: 'la leva rossa',
    grata: 'la grata del tesoro',
    saracinesca: 'la saracinesca del totem',
    totemPietra: 'il totem di pietra',
    portoneFinale: 'il portone finale',
    traguardo: 'la sala del traguardo',
    tesoro: 'il tesoro',
  },

  leve: {
    levaRossa: { x: 3, y: 3, collegata: ['grata', 'saracinesca'] },
  },
  totem: {
    totemPietra: { x: 7, y: 1, tacche: 3, collegata: ['portoneFinale'] },
  },
  porte: {
    grata: { x: 4, y: 2, aMano: false },
    saracinesca: { x: 7, y: 2, aMano: false },
    portoneFinale: { x: 12, y: 2, aMano: false },
  },
  posti: {
    traguardo: { x: 12, y: 1 },
  },
  oggetti: [
    { nome: 'tesoro', em: '💰', pittore: 'forziere', x: 4, y: 1 },
  ],

  unita: [
    { id: 'eroe', nome: "l'eroe", fazione: 'esploratori', emoji: '🦸', chi: 'cavaliere',
      vista: 4, x: 1, y: 3 },
  ],
  fazioni: {
    esploratori: { nome: 'gli esploratori', autore: 'giocatore' },
  },

  obiettivo: [ha('eroe', 'tesoro'), qui('eroe', 'traguardo')],

  varianti: [
    { nome: 'si parte dal fondo di ponente', unita: { eroe: { x: 1, y: 3 } } },
    { nome: 'si parte dal centro del corridoio', unita: { eroe: { x: 5, y: 3 } } },
    { nome: 'si parte vicino al totem', unita: { eroe: { x: 10, y: 3 } } },
  ],

  par: 5,
  soluzioni: [
    /* IL FOR SENZA INVENTARE UN BLOCCO NUOVO: cinque ordini — premi la
       leva (apre grata e saracinesca insieme), prendi il tesoro, un
       «ripeti» che preme il totem finché non è a tre tacche (il
       ciclo conta come un ordine, il «premi» dentro come un altro:
       due, non tre), vai al traguardo. Togliendone uno qualsiasi si
       perde: senza la leva le prime due porte restano chiuse, senza
       il tesoro manca metà obiettivo, senza il ciclo il totem non
       arriva mai a tre e il portone finale resta chiuso, senza
       l'ultimo passo non si arriva mai al traguardo. */
    { nome: 'la leva, il tesoro, il totem che conta', piano: {
      eroe: [
        o('premi', 'levaRossa'),
        o('prendi', 'tesoro'),
        ciclo([o('premi', 'totemPietra')], almeno('totemPietra', 3)),
        o('vai', 'traguardo'),
      ],
    } },
    /* LA STRADA LUNGA: lo stesso risultato scritto a mano, tre «premi»
       invece del ciclo, e in mezzo una domanda esplicita alla
       condizione `premuto:` — costa due ordini in più del par, ed è
       apposta: il par non la vieta, ma nemmeno la premia. */
    { nome: 'a mano, controllando la leva', lunga: true, piano: {
      eroe: [
        o('premi', 'levaRossa'),
        aspettaChe(premuto('levaRossa')),
        o('prendi', 'tesoro'),
        o('premi', 'totemPietra'),
        o('premi', 'totemPietra'),
        o('premi', 'totemPietra'),
        o('vai', 'traguardo'),
      ],
    } },
  ],
}

export default CONGEGNI
