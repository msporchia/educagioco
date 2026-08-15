/* ═══════════════════════════════════════════════════════════════════
   DI COSA PARLA UN GIOCO — il catalogo e chi lo cita

   Stessa forma del test dei saperi, per lo stesso motivo. `data/aree.js`
   è un'anagrafe: da sola non fa niente, conta perché i giochi la citano
   — i sette vecchi in `data/giochi.js`, i cinque nuovi nel proprio
   manifesto. Le due parti stanno in file diversi apposta, e qui si
   controlla che si parlino.

   Cosa si rompe se non si controlla, e perché non lo vedrebbe nessuno:

     · un gioco senza `area`, o con un'area che nel catalogo non esiste,
       **sparisce dalla home**. Non dà errore, non lascia un buco: la
       carta semplicemente non viene disegnata, perché i gruppi si
       costruiscono partendo dalle aree e filtrando i giochi. Un gioco
       invisibile che nessuno ha spento è il guasto peggiore di questa
       schermata, ed è a un refuso di distanza;
     · un `come` sconosciuto fa esplodere la carta a schermo — la home
       legge `MODI[g.come].emoji` — e a quel punto è tutta la home a non
       comparire, non una carta sola;
     · un'area elencata e citata da nessuno è un gruppo che non si
       disegnerà mai: vale la regola di sempre, peggio che non averla.

   Quello che questo test NON pretende: che le assegnazioni siano
   *giuste*. Se il castello finisse fra le parole nessuno qui se ne
   accorgerebbe — quella è una scelta, e si guarda a occhio.
   ═══════════════════════════════════════════════════════════════════ */
import { GIOCHI } from '../../src/data/giochi.js'
import { AREE, MODI, CHIAVI_AREE } from '../../src/data/aree.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* ── ogni gioco si dichiara ── */
const senzaArea = GIOCHI.filter(g => !g.area).map(g => g.chiave)
uguale('ogni gioco dice di che area è', senzaArea.join(',') || '—', '—')

const senzaModo = GIOCHI.filter(g => !g.come).map(g => g.chiave)
uguale('ogni gioco dice che tipo di gioco è', senzaModo.join(',') || '—', '—')

/* ── e quello che dichiara esiste ── */
const areaIgnota = GIOCHI.filter(g => g.area && !CHIAVI_AREE.includes(g.area))
  .map(g => `${g.chiave}→${g.area}`)
uguale('nessun gioco cita un\'area che non esiste', areaIgnota.join(',') || '—', '—')

const modoIgnoto = GIOCHI.filter(g => g.come && !MODI[g.come])
  .map(g => `${g.chiave}→${g.come}`)
uguale('nessun gioco cita un modo che non esiste', modoIgnoto.join(',') || '—', '—')

/* ── e il catalogo non ha voci morte ──
   Un'area vuota non è un guasto a schermo (la home salta i gruppi
   senza giochi), ma è una voce che non serve a niente: o le si dà un
   gioco, o si toglie. */
const areeVuote = AREE.filter(a => !GIOCHI.some(g => g.area === a.chiave)).map(a => a.chiave)
uguale('ogni area ha almeno un gioco', areeVuote.join(',') || '—', '—')

const modiVuoti = Object.keys(MODI).filter(m => !GIOCHI.some(g => g.come === m))
uguale('ogni modo di giocare è usato da almeno un gioco', modiVuoti.join(',') || '—', '—')

/* ── quello che i genitori possono spegnere resta spegnibile ──
   Le aree non sono un interruttore in più: raggruppano e basta. Se un
   giorno un gioco finisse in un'area e sparisse dall'elenco dei
   settaggi sarebbe un gioco che non si può più né vedere né spegnere. */
uguale('le aree non tolgono giochi dall\'elenco', GIOCHI.length,
       new Set(GIOCHI.map(g => g.chiave)).size)

controlla('ci sono almeno quattro aree, che è quanto serve per spezzare la fila',
  AREE.length >= 4)

const perArea = AREE.map(a =>
  `${a.nome} ${GIOCHI.filter(g => g.area === a.chiave).length}`).join(' · ')
nota(`${GIOCHI.length} giochi in ${AREE.length} aree — ${perArea}`)

riassunto('le aree e i modi di giocare')
