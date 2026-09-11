/* ═══════════════════════════════════════════════════════════════════
   LA PAUSA — la parte che si prova senza browser

   Il velo e il tasto ⏸ si guardano col dito (`integrazione/pausa`).
   Quello che si conta qui è la regola sotto, che è dove stanno i due
   guasti veri: **cosa ferma una partita** (quattro condizioni, e
   bastava che un gioco ne dimenticasse una perché il cartello di un
   traguardo gli costasse una vita) e **cosa NON riprende da solo** —
   il telefono che si riaccende non è un bambino che vuole ricominciare
   a correre.

   `node test/esegui.mjs pausa --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { Freno, siFerma, CIECA } from '../../src/giochi/pausa.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. cosa ferma una partita ══════════ */
controlla('senza niente addosso il gioco corre', siFerma({}) === false)
controlla('e anche a chiamarla senza argomenti', siFerma() === false)
for (const che of ['inPausa', 'festa', 'aiuto', 'anche'])
  controlla(`${che} da solo basta a fermare`, siFerma({ [che]: true }) === true)
controlla('e insieme fermano una volta sola', siFerma({ inPausa: true, festa: true }) === true)
/* i giochi passano `state.festa.length` e `anche()`, che sono numeri e
   valori qualunque: se `siFerma` non li riducesse a sì/no, `fermo`
   tornerebbe `0` e un `v-if` mostrerebbe uno zero a schermo */
uguale('la risposta è sempre un sì o un no', siFerma({ festa: 0 }), false)
uguale('anche quando arriva un numero', siFerma({ festa: 3 }), true)

/* ══════════ 2. mettere e togliere ══════════ */
const f = new Freno()
controlla('un gioco nasce che corre', !f.inPausa)
uguale('e senza motivo', f.motivo, '')

uguale('il ⏸ ferma', f.metti(), true)
controlla('e si vede', f.inPausa)
uguale('il motivo è che l\'ha chiesto lui', f.motivo, 'voluta')
uguale('premerlo due volte non cambia niente', f.metti(), false)
controlla('resta fermo uguale', f.inPausa)

uguale('il tocco riprende', f.togli(), true)
controlla('e si corre', !f.inPausa)
uguale('toglierla due volte non cambia niente', f.togli(), false)

/* ══════════ 3. il telefono posato ══════════ */
const g = new Freno()
g.schermo(false)
controlla('il telefono posato ferma la partita', g.inPausa)
uguale('e si sa perché', g.motivo, 'schermo')
/* LA RIGA PER CUI ESISTE TUTTO IL RESTO */
g.schermo(true)
controlla('tornare a vedere lo schermo NON riprende', g.inPausa,
          'la partita ripartirebbe in faccia a chi ha appena acceso il telefono')
g.schermo(true)
controlla('nemmeno guardandolo due volte', g.inPausa)
uguale('si riprende solo col tocco', (g.togli(), g.inPausa), false)

/* ══════════ 4. il primo motivo vince ══════════ */
const h = new Freno()
h.metti()                      // il bambino preme ⏸
h.schermo(false)               // e poi posa il telefono
uguale('chi ha chiesto la pausa se la tiene', h.motivo, 'voluta')
h.schermo(true)
controlla('e al ritorno è ancora in pausa', h.inPausa)
uguale('un tocco solo la toglie tutta', (h.togli(), h.inPausa), false)

/* ══════════ 5. la finestra cieca ══════════ */
controlla('la finestra cieca è quella della domanda', CIECA === 320,
          `${CIECA} ms: se cambia, cambiala anche in quiz/Domanda.vue`)

nota('quattro condizioni, e il ritorno che non riprende')
riassunto('la pausa, senza browser')
