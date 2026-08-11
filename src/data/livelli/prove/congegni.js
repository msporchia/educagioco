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

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.eroe()
const tesoro = cose.tesoro()
const traguardo = cose.posto('traguardo', 'il traguardo')

/* la leva è collegata a DUE porte insieme: è il punto della leva —
   «premi qui e apri due varchi alla volta» */
const leva = cose.leva('levaRossa', 'la leva rossa', { collegata: ['grata', 'saracinesca'] })
const totem = cose.totem('totemPietra', 'il totem di pietra',
  { tacche: 3, collegata: ['portoneFinale'] })

/* tre porte A COMANDO: non si aprono camminandoci, e chi ci prova se lo
   sente dire. Le prime due le apre la leva, la terza il totem. */
const grata = cose.grata('grata', 'la grata del tesoro', { aMano: false })
const saracinesca = cose.saracinesca('saracinesca', 'la saracinesca del totem', { aMano: false })
const portone = cose.porta('portoneFinale', 'il portone finale', { aMano: false })
const dove = cose.segnaposto()

/* IL CORRIDOIO E LE TRE NICCHIE: un corridoio dritto e tre nicchie di
   una cella affacciate su di lui, ognuna dietro la sua porta. `e1`…`e3`
   sono i punti da cui si può partire. */
const CORRIDOIO = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|##|##|##|T$|##|##|TT|##|##|##|##|TR|##|##|##|##',
  '##|##|##|##|GR|##|##|SA|##|##|##|##|PF|##|##|##|##',
  '##|e1|..|LV|..|e2|..|..|..|..|e3|..|..|..|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
], { LV: leva, TT: totem, GR: grata, SA: saracinesca, PF: portone,
     'T$': tesoro, TR: traguardo, e1: dove, e2: dove, e3: dove })

export const CONGEGNI = livello({
  id: 'prova-congegni', nome: 'La prova dei congegni', emoji: '🕹️',
  idea: 'Una leva apre due varchi insieme; un totem conta finché non ne apre uno lui',
  dritta: "Premi <b>la leva rossa</b>: apre la grata E la saracinesca insieme. Dietro la saracinesca c'è <b>il totem</b> — premilo finché non arriva a tre, e apre da solo il portone finale.",
  racconto: "Un corridoio, tre nicchie chiuse. La leva ne apre due in un colpo solo; la terza la apre il totem, quando arriva a tre.",
  aiuti: [
    'La leva è collegata a due porte insieme: una leva sola le apre tutte e due.',
    'Il totem non scatta al primo tocco: conta. Un ciclo che si ferma «quando il totem è a 3» è già un for.',
  ],
  ambiente: 'cortile',

  scena: CORRIDOIO,
  complementi: ['levaRossa', 'totemPietra', 'grata', 'saracinesca',
                'portoneFinale', 'tesoro', 'traguardo'],
  verbi: ['vai', 'prendi', 'premi', 'aspetta'],
  vince: [se.ha(eroe, tesoro), se.qui(eroe, traguardo)],

  varianti: [
    { nome: 'si parte dal fondo di ponente', metti: { e1: eroe } },
    { nome: 'si parte dal centro del corridoio', metti: { e2: eroe } },
    { nome: 'si parte vicino al totem', metti: { e3: eroe } },
  ],

  par: 5,
  soluzioni: [
    /* IL FOR SENZA INVENTARE UN BLOCCO NUOVO: premi la leva (apre grata
       e saracinesca insieme), prendi il tesoro, un «ripeti» che preme il
       totem finché non è a tre tacche, vai al traguardo. Togliendone uno
       qualsiasi si perde. */
    { nome: 'la leva, il tesoro, il totem che conta', piano: { eroe: [
      fai.premi(leva),
      fai.prendi(tesoro),
      fai.ripeti([fai.premi(totem)], se.almeno(totem, 3)),
      fai.vai(traguardo),
    ] } },
    /* LA STRADA LUNGA: lo stesso risultato scritto a mano, tre «premi»
       invece del ciclo, e in mezzo una domanda esplicita alla condizione
       `premuto:` — costa due ordini in più del par, ed è apposta: il par
       non la vieta, ma nemmeno la premia. */
    { nome: 'a mano, controllando la leva', lunga: true, piano: { eroe: [
      fai.premi(leva),
      fai.aspettaChe(se.premuto(leva)),
      fai.prendi(tesoro),
      fai.premi(totem), fai.premi(totem), fai.premi(totem),
      fai.vai(traguardo),
    ] } },
  ],
})

export default CONGEGNI
