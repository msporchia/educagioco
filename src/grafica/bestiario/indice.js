/* ═══════════════════════════════════════════════════════════════════
   IL BESTIARIO — l'indice

   Le creature che si incontrano scendendo nel dungeon. Un file per
   creatura, come in `personaggi/`, e qui la sola riga che le mette
   insieme.

   ── PERCHÉ NON SONO EMOJI ──
   Lo erano. Il difetto si vedeva a occhio nudo: un capo di piano con
   la vita tripla si presentava come 🦂, alla stessa misura del topo
   della prima stanza, disegnato da Apple in uno stile che non è quello
   del gioco. Un'emoji non si può ingrandire, non si può tingere di
   ambiente, non si può far tremare quando la colpisci, e su due
   telefoni diversi non è nemmeno la stessa figura.

   ── PERCHÉ COSTANO POCO ──
   Perché lo scheletro c'era già: `corpo.js` sa disegnare un bipede da
   una scheda (`persona`) e regala a chiunque ombra, respiro, il lampo
   bianco della botta e il ribaltamento da ko (`tavolozzaStato`). Una
   creatura nuova è **una scheda di dati**, non un pittore da zero:

     quadrupede  chi non cammina su due gambe — cioè quasi tutti qui —
                 e disegna sé stesso in `disegna(q, s, C, dir, sw, stato)`
     taglia      il moltiplicatore di scala
     col         la tavolozza, che gli stati sanno già come tingere

   ── DUE COSE CHE NON SI FANNO ──
   Niente denti sporchi, niente sangue, niente occhi vuoti umani: qui
   ci gioca un bambino di sei anni e la paura la deve fare la **forma**
   — grosso, largo, con la coda alzata — non il macabro.
   E niente misure in pixel: tutto in unità, come nel resto di
   `grafica/`, così la stessa creatura sta bene sul telefono e sul
   portatile senza essere scritta due volte.
   ═══════════════════════════════════════════════════════════════════ */
import { persona, bestia } from '../corpo.js'

import { RAGNO } from './ragno.js'
import { TOPO } from './topo.js'
import { PIPISTRELLO } from './pipistrello.js'
import { SERPE } from './serpe.js'
import { RANA } from './rana.js'
import { VERME } from './verme.js'
import { SCORPIONE } from './scorpione.js'
import { GRANCHIO } from './granchio.js'
import { CINGHIALE } from './cinghiale.js'
import { TROLL } from './troll.js'
import { GOLEM } from './golem.js'
import { SPETTRO } from './spettro.js'
import { ZOMBI } from './zombi.js'
import { VAMPIRO } from './vampiro.js'
import { STREGONE } from './stregone.js'
import { DRAGO } from './drago.js'

/* Quelli che erano già disegnati per il Generale e che qui fanno la
   stessa parte: un orco è un orco. Si importano dai loro file e non
   da `personaggi/indice.js`, che ci monta sopra la sua tabella di
   pittori — a noi serve la scheda nuda. */
import { ORCO } from '../personaggi/orco.js'
import { GOBLIN } from '../personaggi/goblin.js'
import { SCHELETRO } from '../personaggi/scheletro.js'
import { LUPO } from '../personaggi/lupo.js'
import { ORSO, MANTI as MANTI_ORSO } from '../personaggi/orso.js'

export const CREATURE = {
  /* le bestiole */
  ragno: RAGNO, topo: TOPO, pipistrello: PIPISTRELLO, serpe: SERPE,
  rana: RANA, verme: VERME,
  /* quelle di mezzo */
  scorpione: SCORPIONE, granchio: GRANCHIO, cinghiale: CINGHIALE, lupo: LUPO,
  /* i grossi */
  orso: ORSO, orsoBianco: { ...ORSO, col: MANTI_ORSO.bianco || ORSO.col },
  troll: TROLL, golem: GOLEM,
  /* chi cammina su due gambe */
  goblin: GOBLIN, orco: ORCO, scheletro: SCHELETRO,
  spettro: SPETTRO, zombi: ZOMBI, vampiro: VAMPIRO, stregone: STREGONE,
  /* il padrone di casa */
  drago: DRAGO,
}

export const NOMI_CREATURE = Object.keys(CREATURE)

/* ── quanto spazio vuole ──
   Il lato del quadrato che contiene la creatura, in unità di disegno,
   misurato a occhio dal disegno più esterno: le zampe del ragno, le
   ali del drago, la clava del troll.

   Serve a **non farla uscire dal riquadro**, e a nient'altro: chi la
   mette in scena parte dalla misura che vuole — un mostro normale è
   piccolo, un boss è grande — e questa la corregge solo quando quella
   misura non ci starebbe. Senza, il drago sfondava lo schermo di
   entrambi i lati e del guardiano più grosso del gioco si vedeva la
   pancia. Chi non si dichiara vale 24, che è la statura di un bipede.

   ── SI MISURA DOPO LA TAGLIA, NON PRIMA ──
   Il numero da scrivere qui è quanto la creatura occupa **a schermo**,
   cioè il suo disegno moltiplicato per il `taglia` della sua scheda.
   Sbagliarlo è facile e si vede subito: il troll ha `taglia: 1.22`, e
   misurandolo sul disegno nudo la clava restava fuori dal riquadro di
   un quinto. Il conto è: (punto più esterno del disegno) × 2 × taglia. */
const INGOMBRI = {
  topo: 16, serpe: 15, verme: 15, rana: 17, spettro: 17,
  cinghiale: 18, scorpione: 20, granchio: 24, pipistrello: 23,
  goblin: 20, scheletro: 21, lupo: 20, orso: 21, orsoBianco: 21,
  orco: 23, zombi: 21, vampiro: 23, stregone: 26,
  ragno: 29, golem: 26, troll: 39, drago: 46,
}

export const ingombroDi = chi => INGOMBRI[chi] || 24

/* ── mettere in scena una creatura ──
   Ferma al centro, di fronte, che respira. Il respiro è la camminata
   presa a metà passo e fatta oscillare: `dondolio` dentro `corpo.js`
   è un seno, e chiedergli una frazione che va avanti e indietro dà un
   dondolio sul posto invece di un passo. Costa una riga e toglie alla
   figura l'aria di cartonato.

   `stato` è quello di tutto il gioco — 'normale' | 'colpito' | 'ko' —
   e non c'è niente da insegnare a nessuno: la botta bianca e il
   ribaltamento li fa `tavolozzaStato`. */
export function creatura(p, { x = 0, y = 0, chi, stato = 'normale', lento = 1 }, S = p.S) {
  const cfg = CREATURE[chi] || CREATURE.ragno
  const posa = { x, y, dir: 'giu', passo: 0, stato,
                 frazione: Math.sin((p.tempo || 0) * 1.4 * lento) * 0.5 }
  ;(cfg.quadrupede ? bestia : persona)(p, posa, S, cfg)
}
