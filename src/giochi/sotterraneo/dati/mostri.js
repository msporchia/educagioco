// Chi abita il sotterraneo. `ossa`/`att`/`dif`: il costo in domande non sta qui, è vita/attacco, e cambia
// con quello che hai trovato (docs/sotterraneo/mostri.md, le coppie). La difesa è la manopola
// velenosa: il tetto (~8 risposte contro l'eroe nudo, `guastiDeiMostri`) si vede solo contando, non a occhio.
// `unaPosa: true`: il foglio disegna solo il respiro, niente corsa separata (scena/tela.js non cerca `-corsa-`).
// Ogni mostro dichiara `droppa` (quanto spesso lascia qualcosa): un mostro comune non deve intasare lo zaino, e la sua
// `velocita` (nello scontro agisce ogni 100/velocita; l'eroe ha 7 più un punto a punto di destrezza: docs/sotterraneo/scontro.md).
// Poche difese a mostro (docs/sotterraneo/mostri.md): `resiste` e `teme` sono elementi (metà danno, danno e mezzo), `immune`
// gli stati che non prende (dati/elementi.js). Il grosso porta le sue (dati/grossi.js, `difeseDi`).
import { EROE } from './mondo.js'
import { ARMI_DI } from './cose.js'
import { guastiDelleDifese } from './elementi.js'

// Le fasce di bottino (docs/sotterraneo/mostri.md): una specie nuova prende quelle della sua fascia, come il ratto fra i piccoli
// e il lupo fra i tosti; cambia solo la forma (colpo, velocità, difese).
const FASCE = {
  piccolo: { gemme: 2, droppa: 0.22, lascia: ['pozione-piccola'] },
  medio: { gemme: 5, droppa: 0.45, lascia: [...ARMI_DI(1), 'panciotto', 'pozione-piccola'] },
  tosto: { gemme: 7, droppa: 0.6, lascia: [...ARMI_DI(2), 'corazza', 'saio', 'pozione'] },
  // i caporali sono tanti per anticamera e ognuno porta la chiave del suo piano: il bottino di ognuno è quello di chi faceva il guardiano
  // della sua discesa prima (la roba che resta e il denaro del villaggio non sono cambiati: `unita/sotterraneo-roba`), non di una
  // fascia a parte; `pesante` resta per le specie che non fanno da caporale (i golem dell'abisso)
  pesante: { gemme: 10, droppa: 0.7, lascia: [...ARMI_DI(2), 'corazza', 'scudo-ferro'] },
}
// `sp(fascia, scheda)`: otto ossa, le gemme e il bottino della fascia, il resto dalla scheda. `passi: true`: ha i passi dai video
// (`<sprite>-corsa-N` nell'atlante, docs/core/creature.md): cammina nel campo; senza, respira soltanto (`unaPosa`)
const sp = (fascia, scheda) => {
  const { passi, ...resto } = scheda
  return { ossa: 8, ...FASCE[fascia], ...resto, ...(passi ? {} : { unaPosa: true }) }
}

export const MOSTRI = {
  goblin: {
    em: '👺', sprite: 'goblin', nome: 'Un goblin',
    ossa: 8, att: 3, dif: 0, gemme: 2,
    velocita: 10,
    droppa: 0.22,
    lascia: ['pozione-piccola'],
  },
  scheletro: {
    em: '💀', sprite: 'scheletro-dipinto', nome: 'Uno scheletro', unaPosa: true,
    ossa: 8, att: 3, dif: 1, gemme: 6,
    velocita: 9,
    resiste: ['veleno'], teme: ['sacro', 'fisico'], immune: ['avvelena', 'sanguina'],
    droppa: 0.45,
    lascia: [...ARMI_DI(1), 'panciotto', 'pozione-piccola'],   // le armi per gradino: una famiglia nuova entra da sé
  },
  orco: {
    em: '👹', sprite: 'orco', nome: 'Un orco',
    ossa: 8, att: 3, dif: 1, gemme: 4,   // colpo 3 e velocità 7 (erano 4 e 8): ora fa da caporale della scalinata; Grumo e Zannaverde, che si reggono su di lui, hanno colpi in più
    velocita: 7,
    teme: ['fulmine'],
    droppa: 0.3,   // caporale della scalinata: il bottino di chi faceva il guardiano prima (la melma), non quello di un tosto
    lascia: ['pozione-piccola', 'pozione'],
  },
  gigante: {
    em: '🗿', sprite: 'mostro-grosso', nome: 'Il gigante',
    ossa: 17, att: 5, dif: 1, gemme: 12, capo: true,
    velocita: 7,
    resiste: ['gelo'], teme: ['fulmine'],
    droppa: 0.85,
    lascia: [...ARMI_DI(3), 'manto', 'amuleto-rosso'],
  },

  // undici creature dai due fogli nuovi: tutte con otto ossa, cambia solo la forma (veloce e fragile, para e lascia
  // scudi...) mai la quantità; quanto sono forti lo dice la discesa (docs/sotterraneo/mostri.md)

  // la fascia dei piccoli, accanto al goblin
  ratto: {
    em: '🐀', sprite: 'ratto', nome: 'Un ratto', unaPosa: true,
    ossa: 8, att: 2, dif: 0, gemme: 2,
    velocita: 10,
    droppa: 0.22,
    lascia: ['pozione-piccola'],
  },
  pipistrello: {
    em: '🦇', sprite: 'pipistrello', nome: 'Un pipistrello', unaPosa: true,
    ossa: 8, att: 2, dif: 0, gemme: 2,
    velocita: 13,
    teme: ['fulmine'],
    droppa: 0.22,   // l'unico che lascia la torcia: trovarla solo comprandola non insegnerebbe a guardarsi intorno
    lascia: ['torcia', 'pozione-piccola'],
  },
  melma: {
    em: '🟢', sprite: 'melma', nome: 'Una melma',
    ossa: 8, att: 3, dif: 0, gemme: 3,
    velocita: 7,
    resiste: ['veleno', 'fulmine'], teme: ['fuoco'], immune: ['avvelena', 'sanguina'],
    droppa: 0.22,
    lascia: ['pozione-piccola'],
  },

  // la fascia di mezzo, accanto allo scheletro
  fantasma: {
    em: '👻', sprite: 'fantasma', nome: 'Un fantasma', unaPosa: true,
    ossa: 8, att: 3, dif: 1, gemme: 6,
    velocita: 9,
    resiste: ['fisico'], teme: ['sacro'], immune: ['avvelena', 'sanguina', 'gela'],
    droppa: 0.22,
    lascia: ['torcia', 'pozione-piccola'],
  },
  vespa: {
    em: '🐝', sprite: 'vespa', nome: 'Un vespone', unaPosa: true,
    ossa: 8, att: 2, dif: 0, gemme: 5,   // poca vita, puntura da orco: conviene toglierlo di mezzo subito
    velocita: 12,
    teme: ['gelo', 'veleno'],
    droppa: 0.45,
    lascia: [...ARMI_DI(1), 'panciotto', 'pozione-piccola'],
  },
  fungo: {
    em: '🍄', sprite: 'fungo', nome: 'Un fungo che morde', unaPosa: true,
    ossa: 8, att: 4, dif: 0, gemme: 5,
    velocita: 8,
    resiste: ['veleno'], teme: ['fuoco'], immune: ['avvelena'],
    droppa: 0.45,
    lascia: ['panciotto', 'pozione', 'pozione-piccola'],
  },

  // la fascia tosta, accanto all'orco
  lupo: {
    em: '🐺', sprite: 'lupo', nome: 'Un lupo',
    ossa: 8, att: 3, dif: 0, gemme: 7,
    velocita: 10,
    resiste: ['gelo'], teme: ['fuoco'],
    droppa: 0.6,
    lascia: [...ARMI_DI(2), 'corazza', 'saio', 'pozione'],
  },
  granchio: {
    em: '🦀', sprite: 'granchio', nome: 'Un granchio', unaPosa: true,
    ossa: 8, att: 4, dif: 1, gemme: 7,   // para come un orco e lascia scudi: unico posto dove la mano debole si riempie senza il banco
    velocita: 7,
    resiste: ['fisico'], teme: ['fulmine'],
    droppa: 0.6,
    lascia: [...ARMI_DI(2), 'corazza', 'scudo-legno', 'scudo-borchiato', 'pozione'],
  },
  serpente: {
    em: '🐍', sprite: 'serpente', nome: 'Un serpente', unaPosa: true,
    ossa: 8, att: 3, dif: 0, gemme: 7,
    velocita: 9,
    resiste: ['veleno'], teme: ['gelo'], immune: ['avvelena'],
    droppa: 0.6,
    lascia: [...ARMI_DI(2), 'saio', 'corazza', 'pozione'],
  },

  // il golem: il più lento (5) e quello che picchia di più (6), l'ultimo della scaletta e il mostro della miniera
  golem: {
    em: '🪨', sprite: 'golem', nome: 'Un golem', unaPosa: true,
    ossa: 8, att: 6, dif: 1, gemme: 10,
    velocita: 5,
    resiste: ['fisico', 'sacro'], teme: ['gelo'], immune: ['stordisce', 'avvelena', 'sanguina'],
    droppa: 0.7,
    lascia: [...ARMI_DI(2), 'corazza', 'scudo-ferro'],
  },

  // un secondo capo (non potenza in più): con uno solo, le ultime tre discese finivano tutte con lo stesso gigante
  troll: {
    em: '🧌', sprite: 'mostro-grosso', nome: 'Il troll', unaPosa: true,   // base di un grosso: il suo sprite non si disegna, i grossi vestono la loro figura (dati/grossi.js)
    ossa: 15, att: 5, dif: 1, gemme: 11, capo: true,
    velocita: 7,
    resiste: ['veleno'], teme: ['fuoco'],
    droppa: 0.8,
    lascia: [...ARMI_DI(3), 'scudo-crociato', 'amuleto-osso'],
  },

  // Il bestiario per ambientazione (docs/sotterraneo/mostri.md, «Gli abitanti»): ogni creatura sta in un posto solo (dati/campagna.js).
  // Otto ossa tutte; colpo per velocità fra 20 e 36 (i caporali, che stanno in anticamera e a guardia della chiave, più su: colpo per
  // velocità fino a 48, misurati col banco perché ogni discesa resti dov'era); difesa 0 o 1 (nella cripta tutti 1: si scende a mani nude). Le difese sono
  // quelle del catalogo (docs/core/creature-catalogo-*.md), poche e sensate per com'è fatta la creatura

  // la cripta
  zombie: sp('medio', { em: '🧟', sprite: 'zombie', nome: 'Uno zombie', gemme: 6, att: 3, dif: 1, velocita: 8,
    resiste: ['veleno'], teme: ['fuoco', 'sacro'], immune: ['avvelena', 'sanguina'] }),
  'scheletro-scudo': sp('medio', { em: '💀', sprite: 'scheletro-scudo', nome: 'Uno scheletro cavaliere', gemme: 6, droppa: 0.22, lascia: ['torcia', 'pozione-piccola'], att: 4, dif: 1, velocita: 6,
    resiste: ['veleno'], teme: ['sacro', 'fisico'], immune: ['avvelena', 'sanguina'] }),

  // le cantine e la torre
  diavoletto: sp('piccolo', { em: '😈', sprite: 'diavoletto', nome: 'Un diavoletto', att: 2, dif: 0, velocita: 12,
    resiste: ['fuoco'], teme: ['gelo'], immune: ['brucia'] }),
  'spirito-fuoco': sp('medio', { em: '🔥', sprite: 'spirito-fuoco', nome: 'Uno spirito di fuoco', att: 3, dif: 0, velocita: 9,
    resiste: ['fuoco'], teme: ['gelo'], immune: ['brucia'] }),
  'golem-magma': sp('piccolo', { em: '🪨', sprite: 'golem-magma', nome: 'Un golem di magma', gemme: 3, att: 5, dif: 1, velocita: 9,
    resiste: ['fuoco', 'fisico'], teme: ['gelo'], immune: ['stordisce', 'brucia', 'sanguina'] }),

  // la grotta
  ragno: sp('medio', { em: '🕷️', sprite: 'ragno', nome: 'Un ragno', passi: true, att: 3, dif: 0, velocita: 10,
    resiste: ['veleno'], teme: ['fuoco'], immune: ['avvelena'] }),
  pianta: sp('tosto', { em: '🌿', sprite: 'pianta', nome: 'Una pianta carnivora', att: 5, dif: 0, velocita: 5,
    resiste: ['veleno'], teme: ['fuoco'], immune: ['avvelena'] }),
  'melma-rosa': sp('piccolo', { em: '💗', sprite: 'melma-rosa', nome: 'Una melma rosa', gemme: 3, att: 3, dif: 0, velocita: 8,
    resiste: ['veleno'], teme: ['fuoco'], immune: ['avvelena', 'sanguina'] }),
  'mostro-verde': sp('medio', { em: '🟩', sprite: 'mostro-verde', nome: 'Un mostro di muschio', lascia: ['panciotto', 'pozione', 'pozione-piccola'], att: 6, dif: 1, velocita: 6,
    resiste: ['veleno'], teme: ['fuoco'], immune: ['avvelena'] }),

  // la scala sommersa
  piranha: sp('medio', { em: '🐟', sprite: 'piranha', nome: 'Un piranha', att: 2, dif: 0, velocita: 12, teme: ['fulmine'] }),
  polpo: sp('tosto', { em: '🐙', sprite: 'polpo', nome: 'Un polpo', att: 4, dif: 0, velocita: 7, resiste: ['veleno'], teme: ['fulmine'] }),
  'fantasma-azzurro': sp('medio', { em: '👻', sprite: 'fantasma-azzurro', nome: 'Un fantasma azzurro', att: 3, dif: 1, velocita: 9,
    resiste: ['fisico', 'gelo'], teme: ['sacro', 'fuoco'], immune: ['avvelena', 'gela'] }),
  tartaruga: sp('tosto', { em: '🐢', sprite: 'tartaruga', nome: 'Una tartaruga corazzata', lascia: [...ARMI_DI(2), 'corazza', 'scudo-legno', 'scudo-borchiato', 'pozione'], att: 5, dif: 1, velocita: 7,
    resiste: ['fisico'], teme: ['fulmine'] }),

  // la botola
  cinghiale: sp('tosto', { em: '🐗', sprite: 'cinghiale', nome: 'Un cinghiale', att: 4, dif: 0, velocita: 8, teme: ['fulmine'] }),
  ent: sp('tosto', { em: '🌳', sprite: 'ent', nome: 'Un ent', att: 5, dif: 1, velocita: 6, resiste: ['veleno', 'gelo'], teme: ['fuoco'] }),
  'golem-muschio': sp('tosto', { em: '🪨', sprite: 'golem-muschio', nome: 'Un golem di muschio', gemme: 8, att: 6, dif: 1, velocita: 8,
    resiste: ['veleno', 'fisico'], teme: ['fuoco'], immune: ['stordisce', 'avvelena', 'sanguina'] }),

  // la miniera
  scorpione: sp('tosto', { em: '🦂', sprite: 'scorpione', nome: 'Uno scorpione', passi: true, att: 4, dif: 0, velocita: 8,
    resiste: ['veleno'], teme: ['gelo'], immune: ['avvelena'] }),
  'spirito-elettrico': sp('medio', { em: '⚡', sprite: 'spirito-elettrico', nome: 'Uno spirito elettrico', att: 2, dif: 0, velocita: 13,
    resiste: ['fulmine'], teme: ['fisico'] }),
  'golem-lava': sp('pesante', { em: '🌋', sprite: 'golem-lava', nome: 'Un golem di lava', passi: true, att: 6, dif: 1, velocita: 5,
    resiste: ['fuoco'], teme: ['gelo'], immune: ['stordisce', 'brucia', 'sanguina', 'avvelena'] }),

  // l'abisso delle cantine
  'melma-viola': sp('piccolo', { em: '🟣', sprite: 'melma-viola', nome: 'Una melma viola', gemme: 3, att: 3, dif: 0, velocita: 8,
    resiste: ['veleno'], teme: ['fuoco', 'sacro'], immune: ['avvelena', 'sanguina'] }),
  'mostro-viola': sp('medio', { em: '👾', sprite: 'mostro-viola', nome: 'Un mostro viola', gemme: 6, att: 3, dif: 0, velocita: 7,
    teme: ['fuoco', 'sacro'] }),
  'pipistrello-occhio': sp('tosto', { em: '🦇', sprite: 'pipistrello-occhio', nome: 'Un pipistrello occhio', att: 2, dif: 0, velocita: 11, teme: ['fulmine'] }),
  ombra: sp('medio', { em: '🌑', sprite: 'ombra', nome: 'Un\'ombra', att: 3, dif: 0, velocita: 8, teme: ['sacro'], immune: ['sanguina'] }),
  'golem-ghiaccio': sp('pesante', { em: '🧊', sprite: 'golem-ghiaccio', nome: 'Un golem di ghiaccio', att: 5, dif: 1, velocita: 6,
    resiste: ['gelo'], teme: ['fuoco'], immune: ['stordisce', 'gela', 'avvelena', 'sanguina'] }),

  // l'abisso della cripta
  ghoul: sp('tosto', { em: '🧟', sprite: 'ghoul', nome: 'Un ghoul', att: 3, dif: 1, velocita: 9,
    resiste: ['veleno'], teme: ['fuoco', 'sacro'], immune: ['avvelena'] }),
  'teschio-azzurro': sp('medio', { em: '💀', sprite: 'teschio-azzurro', nome: 'Un teschio azzurro', att: 3, dif: 0, velocita: 10,
    resiste: ['gelo'], teme: ['fuoco', 'sacro'], immune: ['avvelena', 'sanguina', 'gela'] }),
  mummia: sp('medio', { em: '🏺', sprite: 'mummia', nome: 'Una mummia', att: 4, dif: 1, velocita: 6,
    resiste: ['veleno'], teme: ['fuoco', 'sacro'], immune: ['avvelena', 'sanguina'] }),
  mietitore: sp('pesante', { em: '☠️', sprite: 'mietitore', nome: 'Un mietitore', att: 5, dif: 1, velocita: 6,
    teme: ['sacro'], immune: ['avvelena', 'sanguina'] }),

  // l'abisso della fornace
  draghetto: sp('tosto', { em: '🐲', sprite: 'draghetto', nome: 'Un draghetto', att: 3, dif: 0, velocita: 9, resiste: ['fuoco'], teme: ['gelo'] }),
  occhio: sp('medio', { em: '👁️', sprite: 'occhio', nome: 'Un occhio', att: 3, dif: 0, velocita: 8, teme: ['fisico'] }),
  'golem-pietra': sp('pesante', { em: '🪨', sprite: 'golem-pietra', nome: 'Un golem di pietra', att: 5, dif: 1, velocita: 6,
    resiste: ['fisico'], teme: ['gelo'], immune: ['stordisce', 'avvelena', 'sanguina'] }),
  grifone: sp('tosto', { em: '🦅', sprite: 'grifone', nome: 'Un grifone', att: 3, dif: 0, velocita: 9, teme: ['fulmine'] }),
  // il drago ha un respiro rotto (due draghi e la fiammata in un fotogramma): da fermo e da sveglio usa i passi dai video
  drago: sp('pesante', { em: '🐉', sprite: 'drago', nome: 'Un drago', passi: true, fermoDaiPassi: true, att: 5, dif: 1, velocita: 7,
    resiste: ['fuoco'], teme: ['gelo'], immune: ['brucia'] }),

  // l'abisso dell'inferno: quattro specie che il bestiario aveva e nessuna discesa usava (la bestia, il negromante e il troll; il drago di lava
  // faceva solo da grosso, Carbonchio)
  'bestia-cornuta': sp('tosto', { em: '👹', sprite: 'bestia-cornuta', nome: 'Una bestia cornuta', att: 5, dif: 0, velocita: 9, resiste: ['fuoco'], teme: ['gelo'] }),
  negromante: sp('medio', { em: '🧙', sprite: 'negromante', nome: 'Un negromante', att: 4, dif: 0, velocita: 8, teme: ['sacro', 'fisico'], immune: ['avvelena', 'sanguina'] }),
  'troll-clava': sp('tosto', { em: '👹', sprite: 'troll', nome: 'Un troll', passi: true, att: 5, dif: 1, velocita: 6, resiste: ['veleno'], teme: ['fuoco'] }),
  'drago-lava': sp('pesante', { em: '🐲', sprite: 'drago-lava', nome: 'Un drago di lava', att: 5, dif: 1, velocita: 7,
    resiste: ['fuoco'], teme: ['gelo'], immune: ['brucia'] }),
}

export const CHIAVI_MOSTRI = Object.keys(MOSTRI)

// Le coppie (docs/sotterraneo/mostri.md): una discesa ha la sua coppia di specie, scelta per ambientazione (la lista `mostri` della
// discesa in dati/campagna.js, del tratto dell'abisso in TRATTI_DELL_ABISSO): per strada, nei branchi, appostati e come
// caporali ci sono solo quei due. Quanto sono forti non lo decide la specie ma il livello (`forza` e `spinta` della discesa o
// della zona): le specie dentro la coppia cambiano forma (velocità, colpo, difesa, resistenze), non quantità. La più dura delle
// due (duraDellaCoppia) porta la chiave, come caporale.
// la più dura: quella che fa più male nel tempo (colpo per velocità; a pari, la seconda). Non la più resistente: le ossa dentro
// una coppia sono quasi uguali
export const minacciaDi = m => m.att * m.velocita
export const duraDellaCoppia = coppia => coppia.reduce((a, b) => (minacciaDi(MOSTRI[b]) >= minacciaDi(MOSTRI[a]) ? b : a))

// i caporali dell'anticamera del mostro grosso e il guardiano della chiave (docs/sotterraneo/piani.md): un mostro di strada
// con le ossa moltiplicate e un colpo in più. Non una specie sopra: la specie sopra sarebbe un salto di risposte che il tetto
// delle domande non regge
export const CAPORALE = { ossa: 1.25, att: 1 }

// quanto costa, in risposte, una specie a un eroe che attacca con `attacco`: le ossa diviso il colpo che passa la difesa
export const costoInRisposte = (m, attacco) => m.ossa / Math.max(1, attacco - m.dif)

// lo stesso conto di Corsa.colpiPer, qui perché possa provarlo anche chi guarda solo i dati
export const colpiPer = (m, attacco) =>
  Math.max(1, Math.ceil(m.ossa / Math.max(1, attacco - m.dif)))

export function guastiDeiMostri() {
  const g = []
  for (const [k, m] of Object.entries(MOSTRI)) {
    if (!m.sprite) g.push(`${k}: senza sprite`)
    if (m.ossa < 1) g.push(`${k}: senza ossa`)
    if (!(m.velocita >= 1)) g.push(`${k}: senza velocità, e nella fila dei turni non agirebbe mai`)
    if (m.dif >= EROE.att) g.push(`${k}: difesa ${m.dif} contro attacco nudo ${EROE.att}, il colpo si azzera`)
    // un capo si incontra dopo aver trovato almeno una spada: contarlo a mani nude direbbe che è fuori misura quando non lo è
    const braccio = EROE.att + (m.capo ? 2 : 0)
    const costo = colpiPer(m, braccio)
    if (costo > 8) g.push(`${k}: ${costo} risposte di fila con attacco ${braccio}, troppe`)
    for (const c of m.lascia || []) if (typeof c !== 'string') g.push(`${k}: lascia una cosa senza nome`)
    g.push(...guastiDelleDifese(k, m))
    if (m.droppa == null) g.push(`${k}: non dice quanto spesso lascia qualcosa`)
    else if (m.droppa < 0 || m.droppa > 1) g.push(`${k}: droppa ${m.droppa}, e non è una probabilità`)
  }
  return g
}
