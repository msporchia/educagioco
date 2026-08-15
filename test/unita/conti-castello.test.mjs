/* ═══════════════════════════════════════════════════════════════════
   LA SCALA DEI RIPIEGHI — cosa chiede il castello quando un'operazione
   il bambino non l'ha ancora fatta a scuola.

   Il patto sta scritto in `data/ops.js` e questo test lo tiene: togliere
   un'operazione **non abbassa l'asticella**, sposta dove la si incontra.
   Le Bombe senza divisioni chiedono moltiplicazioni, ma tre gradini più
   su; senza nemmeno le moltiplicazioni scendono a sottrazioni, sei
   gradini più su.

   Perché serve un test e non basta leggerlo: il giorno che qualcuno
   spegne una casella nei settaggi dei genitori, l'unico modo di
   accorgersi che il ripiego è diventato *più facile* dell'originale
   sarebbe che un bambino finisca l'ultima tappa senza fatica — e
   quello non lo vede nessuno. Qui invece è rosso in un secondo.
   ═══════════════════════════════════════════════════════════════════ */
import { contoDi, gradoDi, segnoDi, LIVELLI, SALTO_SENZA } from '../../src/data/ops.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const TUTTO   = { div: true,  mul: true }
const NO_DIV  = { div: false, mul: true }
const NIENTE  = { div: false, mul: false }

/* ── con tutto acceso non si ripiega niente ── */
for (const t of ['add', 'sub', 'mul', 'div']) {
  uguale(`${t}: con tutto acceso resta se stessa`, contoDi(t, TUTTO), t)
  uguale(`${t}: e il grado non si tocca`, gradoDi(t, 4, TUTTO), 4)
}

/* ── un gradino: senza divisioni ── */
uguale('senza divisioni le Bombe chiedono moltiplicazioni', contoDi('div', NO_DIV), 'mul')
uguale('e le chiedono tre gradini più su', gradoDi('div', 4, NO_DIV), 4 + SALTO_SENZA)
uguale('il segno sul tasto segue il conto vero', segnoDi('div', NO_DIV), '×')
uguale('la moltiplicazione resta dov\'è', contoDi('mul', NO_DIV), 'mul')
uguale('e al suo grado', gradoDi('mul', 4, NO_DIV), 4)

/* ── due gradini: senza nemmeno le moltiplicazioni ── */
uguale('spente tutte e due, le Bombe scendono a sottrazioni', contoDi('div', NIENTE), 'sub')
uguale('e scendono di DUE scalini, non di uno', gradoDi('div', 3, NIENTE), 3 + 2 * SALTO_SENZA)
uguale('il Ghiaccio scende di uno', contoDi('mul', NIENTE), 'sub')
uguale('al grado che gli tocca', gradoDi('mul', 3, NIENTE), 3 + SALTO_SENZA)

/* ── il pavimento ──
   Sotto la sottrazione non si scende: se si scendesse ancora il castello
   diventerebbe un gioco di sole addizioni, e quello si spegne dai giochi
   invece che dai saperi. */
uguale('la sottrazione non ripiega su niente', contoDi('sub', NIENTE), 'sub')
uguale('e nemmeno l\'addizione', contoDi('add', NIENTE), 'add')
uguale('il loro grado resta quello chiesto', gradoDi('sub', 5, NIENTE), 5)

/* ── il tetto ──
   Il salto non può sfondare la scaletta: `generaMul(14)` non esiste, e
   un grado oltre il tetto sarebbe una schermata bianca a metà partita. */
for (const sa of [NO_DIV, NIENTE]) {
  for (const lv of [8, 9, 10]) {
    controlla(`grado ${lv} non sfonda il tetto di ${LIVELLI}`,
      gradoDi('div', lv, sa) <= LIVELLI, String(gradoDi('div', lv, sa)))
  }
}

/* ── il ripiego non è mai più facile dell'originale ──
   È la regola che dà senso a tutto il resto, e va provata sul grado
   *effettivo* e non sull'intenzione: a ogni gradino della scaletta, quello
   che si finisce per chiedere deve stare più in alto di dove si era. */
for (const sa of [NO_DIV, NIENTE]) {
  for (let lv = 1; lv <= LIVELLI; lv++) {
    const sceso = contoDi('div', sa) !== 'div'
    controlla(`div al gradino ${lv}: ripiegare non regala niente`,
      !sceso || gradoDi('div', lv, sa) > lv || lv >= LIVELLI,
      `${lv} → ${gradoDi('div', lv, sa)}`)
  }
}

/* ── la forma vecchia continua a valere ──
   Mezzo castello e i test di ieri passano un booleano, che voleva dire
   «le divisioni». Se smettesse di funzionare in silenzio, il castello
   chiederebbe divisioni a chi non le ha mai viste. */
uguale('il booleano false vale ancora «divisioni spente»', contoDi('div', false), 'mul')
uguale('col suo salto', gradoDi('div', 2, false), 2 + SALTO_SENZA)
uguale('il booleano true non ripiega', contoDi('div', true), 'div')
uguale('e senza argomento nemmeno', contoDi('div'), 'div')

nota(`scala: div → ${contoDi('div', NO_DIV)} → ${contoDi('div', NIENTE)}, ${SALTO_SENZA} gradini per scalino`)

riassunto('i ripieghi del castello')
