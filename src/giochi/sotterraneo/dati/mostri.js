// Chi abita il sotterraneo. `ossa`/`att`/`dif`: il costo in domande non sta qui, è vita/attacco, e cambia
// con quello che hai trovato (docs/sotterraneo/mostri.md, le coppie). La difesa è la manopola
// velenosa: il tetto (~8 risposte contro l'eroe nudo, `guastiDeiMostri`) si vede solo contando, non a occhio.
// `unaPosa: true`: il foglio disegna solo il respiro, niente corsa separata (scena/tela.js non cerca `-corsa-`).
// Ogni mostro dichiara `droppa` (quanto spesso lascia qualcosa): un mostro comune non deve intasare lo zaino, e la sua
// `velocita` (nello scontro agisce ogni 100/velocita; l'eroe parte da 10 più la destrezza: docs/sotterraneo/scontro.md).
// Poche difese a mostro (docs/sotterraneo/mostri.md): `resiste` e `teme` sono elementi (metà danno, danno e mezzo), `immune`
// gli stati che non prende (dati/elementi.js). Il grosso porta le sue (dati/grossi.js, `difeseDi`).
import { EROE } from './mondo.js'
import { ARMI_DI } from './cose.js'
import { guastiDelleDifese } from './elementi.js'

export const MOSTRI = {
  goblin: {
    em: '👺', sprite: 'goblin', nome: 'Un goblin',
    ossa: 8, att: 3, dif: 0, gemme: 2,
    velocita: 10,
    droppa: 0.22,
    lascia: ['pozione-piccola'],
  },
  scheletro: {
    em: '💀', sprite: 'scheletro', nome: 'Uno scheletro',
    ossa: 8, att: 3, dif: 1, gemme: 6,
    velocita: 9,
    resiste: ['veleno'], teme: ['sacro', 'fisico'], immune: ['avvelena', 'sanguina'],
    droppa: 0.45,
    lascia: [...ARMI_DI(1), 'panciotto', 'pozione-piccola'],   // le armi per gradino: una famiglia nuova entra da sé
  },
  orco: {
    em: '👹', sprite: 'orco', nome: 'Un orco',
    ossa: 8, att: 4, dif: 1, gemme: 8,
    velocita: 8,
    teme: ['fulmine'],
    droppa: 0.6,
    // saio + corazza (ferro): un mago che batte un orco deve ricavarne qualcosa da mettersi addosso, misurato dal banco
    lascia: [...ARMI_DI(2), 'corazza', 'saio', 'pozione'],
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
    em: '🟢', sprite: 'melma', nome: 'Una melma', unaPosa: true,
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
    em: '🐺', sprite: 'lupo', nome: 'Un lupo', unaPosa: true,
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
    em: '🧌', sprite: 'troll', nome: 'Il troll', unaPosa: true,
    ossa: 15, att: 5, dif: 1, gemme: 11, capo: true,
    velocita: 7,
    resiste: ['veleno'], teme: ['fuoco'],
    droppa: 0.8,
    lascia: [...ARMI_DI(3), 'scudo-crociato', 'amuleto-osso'],
  },
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
