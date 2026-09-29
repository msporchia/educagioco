// Il bestiario: un file per creatura (come personaggi/), qui solo la riga che le mette insieme. Non sono
// emoji (non si ingrandiscono, non si tingono, non tremano quando colpite). Costano poco perché corpo.js
// disegna un bipede da una scheda (persona/bestia): una creatura nuova è solo dati — quadrupede,
// taglia, col — con ombra, respiro, botta e ko regalati (tavolozzaStato). La paura la fa la forma, mai il
// macabro; tutto in unità, mai in pixel (docs/dungeon/regole.md, "il bestiario").
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

// già disegnati per il Generale, un orco è un orco: dai loro file (non personaggi/indice.js, che ci monta
// sopra la sua tabella di pittori) perché qui serve la scheda nuda
import { ORCO } from '../personaggi/orco.js'
import { GOBLIN } from '../personaggi/goblin.js'
import { SCHELETRO } from '../personaggi/scheletro.js'
import { LUPO } from '../personaggi/lupo.js'
import { ORSO, MANTI as MANTI_ORSO } from '../personaggi/orso.js'

export const CREATURE = {
  ragno: RAGNO, topo: TOPO, pipistrello: PIPISTRELLO, serpe: SERPE,
  rana: RANA, verme: VERME,
  scorpione: SCORPIONE, granchio: GRANCHIO, cinghiale: CINGHIALE, lupo: LUPO,
  orso: ORSO, orsoBianco: { ...ORSO, col: MANTI_ORSO.bianco || ORSO.col },
  troll: TROLL, golem: GOLEM,
  goblin: GOBLIN, orco: ORCO, scheletro: SCHELETRO,
  spettro: SPETTRO, zombi: ZOMBI, vampiro: VAMPIRO, stregone: STREGONE,
  drago: DRAGO,
}

export const NOMI_CREATURE = Object.keys(CREATURE)

// il lato del quadrato che contiene la creatura (disegno × taglia della scheda), per non farla uscire dal
// riquadro: senza, il drago sfondava lo schermo. Misurato DOPO la taglia, non prima (docs/dungeon/regole.md)
const INGOMBRI = {
  topo: 16, serpe: 15, verme: 15, rana: 17, spettro: 17,
  cinghiale: 18, scorpione: 20, granchio: 24, pipistrello: 23,
  goblin: 20, scheletro: 21, lupo: 20, orso: 21, orsoBianco: 21,
  orco: 23, zombi: 21, vampiro: 23, stregone: 26,
  ragno: 29, golem: 26, troll: 39, drago: 46,
}

export const ingombroDi = chi => INGOMBRI[chi] || 24

// ferma al centro, che respira: `dondolio` di corpo.js è un seno, e una frazione che va avanti e indietro
// dà un dondolio sul posto invece di un passo. `stato` ('normale'|'colpito'|'ko') lo tinge tavolozzaStato.
export function creatura(p, { x = 0, y = 0, chi, stato = 'normale', lento = 1 }, S = p.S) {
  const cfg = CREATURE[chi] || CREATURE.ragno
  const posa = { x, y, dir: 'giu', passo: 0, stato,
                 frazione: Math.sin((p.tempo || 0) * 1.4 * lento) * 0.5 }
  ;(cfg.quadrupede ? bestia : persona)(p, posa, S, cfg)
}
