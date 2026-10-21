// Il registro dei mostri 3D (scritto a mano, accanto alle copie generate: docs/sotterraneo/mostri-3d.md). Per ogni specie del gioco
// (dati/mostri.js) e ogni grosso (dati/grossi.js) quale modello dei prototipi la disegna, come «zona/chiave» degli elenchi
// (elenchi.js, generato); un elenco di chiavi va per grado (comune, magico, raro, leggendario). `null` dice «resta lo sprite».
// Una chiave che non c'è (una zona non ancora promossa) o una `crea` che si rompe tornano allo sprite: il gioco non si rompe mai.
import { ELENCHI } from './elenchi.js'
import { creaMelma } from './mostri.js'
import { creaDaId } from '../eroi3d/collezione.js'
import { rangoDelGrado } from '../../dati/varianti.js'

// la specie del gioco → il modello. I nomi che non coincidono sono scelti a mano (il golem è quello di pietra, il gigante e il troll
// del set dell'eroe i bruti del monte, il drago il drago grande nei colori della forza, il draghetto il drago carino)
export const MODELLO_DI_SPECIE = {
  goblin: ['prati/goblin', 'prati/goblin-rosso'],
  scheletro: 'mostri/scheletro',
  orco: 'prati/orco',
  gigante: 'monte/gigante-monte',
  ratto: 'prati/ratto',
  pipistrello: ['bosco/pipistrello', 'bosco/pipistrello-rosso'],
  melma: 'mostri/melma',
  fantasma: 'prati/fantasma',
  vespa: 'prati/vespa',
  fungo: ['bosco/fungo', 'bosco/fungo-viola'],
  lupo: ['bosco/lupo', 'bosco/lupo-nero', 'bosco/lupo-bianco', 'bosco/lupo-capo'],
  granchio: ['bosco/granchio', 'bosco/granchio-blu'],
  serpente: ['bosco/serpente', 'bosco/serpente-nero'],
  golem: 'monte/golem-pietra',
  troll: 'monte/troll-clava',
  zombie: 'prati/zombie',
  'scheletro-scudo': 'prati/scheletro-scudo',
  diavoletto: ['ceneri/diavoletto', 'ceneri/diavoletto-nero'],
  'spirito-fuoco': ['ceneri/spirito-fuoco', 'ceneri/spirito-azzurro'],
  'golem-magma': 'ceneri/golem-magma',
  ragno: ['bosco/ragno', 'bosco/ragno-nero'],
  pianta: null,
  'melma-rosa': 'prati/melma-rosa',
  'mostro-verde': 'bosco/mostro-verde',
  piranha: null,
  polpo: 'palude/polpo',
  'fantasma-azzurro': 'prati/fantasma',
  tartaruga: 'bosco/tartaruga',
  cinghiale: ['prati/cinghiale', 'prati/cinghiale-caporale'],
  ent: 'landa/ent',
  'golem-muschio': null,
  scorpione: null,
  'spirito-elettrico': 'monte/spirito-elettrico',
  'golem-lava': 'monte/golem-lava',
  'melma-viola': 'proprio/melma-viola',
  'mostro-viola': null,
  'pipistrello-occhio': null,
  ombra: 'landa/ombra',
  'golem-ghiaccio': 'monte/golem-ghiaccio',
  ghoul: 'ceneri/ghoul',
  'teschio-azzurro': 'ceneri/teschio-azzurro',
  mummia: ['landa/mummia', 'landa/mummia', 'landa/mummia-antica'],
  mietitore: 'ceneri/mietitore',
  draghetto: 'mostri/drago',
  occhio: 'landa/occhio-abisso',
  'golem-pietra': 'monte/golem-pietra',
  grifone: 'monte/grifone',
  drago: ['draghi/verde', 'draghi/azzurro', 'draghi/rosso', 'draghi/oro'],
  'bestia-cornuta': 'ceneri/bestia-cornuta',
  negromante: 'landa/negromante',
  'troll-clava': 'monte/troll-clava',
  'drago-lava': 'ceneri/drago-lava',
}

// i grossi: il signore che somiglia di più alla figura che oggi lo veste (dati/grossi.js, `figura`)
export const MODELLO_DEL_GROSSO = {
  ossuto: 'landa/re-non-morto', grumo: 'prati/orco', fiammetta: 'ceneri/spirito-fuoco', zannaverde: 'bosco/ragno',
  gorgo: 'palude/gorgo', minotto: 'ceneri/minotauro', carbonchio: 'ceneri/drago-lava', barbamuschio: 'landa/ent',
  piumanera: 'monte/grifone', sibilla: 'palude/sibilla', brontolava: 'ceneri/golem-magma', brinaldo: 'monte/golem-ghiaccio',
  falcenera: 'ceneri/mietitore',
}

// le varianti armate (dati/varianti.js): l'arciere ha il suo modello, il guerriero e il mago impugnano un'arma della collezione
// (eroi3d/collezione.js), più ricca col grado
export const MODELLO_DELLA_VARIANTE = { scheletro: { arciere: 'prati/scheletro-arciere' } }
export const ARMI_DELLA_VARIANTE = {
  scheletro: {
    guerriero: { destra: ['spada-corta', 'spada-lunga', 'scimitarra', 'lama-ghiaccio'] },
    mago: { destra: ['bastone-nodoso', 'staffa-cristallo', 'bastone-ghiaccio', 'bastone-ghiaccio'], sinistra: null },
  },
}

// i modelli che non sono una voce di un elenco: una variante di colore fatta con la stessa `crea`
const PROPRI = { 'melma-viola': () => creaMelma(0x9b5cd6) }

// quanto è alto il modello rispetto allo sprite che sostituisce, se non 1 (chi vola o ha le ali larghe non si misura in altezza)
export const ALTEZZA = { 'draghi/verde': 1.25, 'draghi/azzurro': 1.25, 'draghi/rosso': 1.25, 'draghi/oro': 1.25 }

/** La voce di un id «zona/chiave»: { crea } o null se la zona o la chiave non c'è. */
export function voceDi(id) {
  if (!id) return null
  const [zona, chiave] = id.split('/')
  if (zona === 'proprio') return PROPRI[chiave] ? { chiave, crea: PROPRI[chiave] } : null
  const lista = ELENCHI[zona]
  return (lista && lista.find(v => v.chiave === chiave)) || null
}

const perGrado = (v, grado) => (Array.isArray(v) ? v[Math.min(v.length - 1, rangoDelGrado(grado))] : v)

/** Quale modello per una cosa del motore (r: tipo, grosso, variante, grado): «zona/chiave», con «+variante» se impugna, o null. */
export function idDi(r) {
  if (r.grosso) return voceDi(MODELLO_DEL_GROSSO[r.grosso]) ? MODELLO_DEL_GROSSO[r.grosso] : null
  const proprio = MODELLO_DELLA_VARIANTE[r.tipo] && MODELLO_DELLA_VARIANTE[r.tipo][r.variante]
  if (proprio && voceDi(proprio)) return proprio
  const id = perGrado(MODELLO_DI_SPECIE[r.tipo], r.grado)
  if (!voceDi(id)) return null
  const armi = ARMI_DELLA_VARIANTE[r.tipo] && ARMI_DELLA_VARIANTE[r.tipo][r.variante]
  return armi ? `${id}+${r.variante}+${Math.min(3, rangoDelGrado(r.grado))}` : id
}

const rotti = new Set()
/** Costruisce il modello di un id di `idDi`: un Group con `userData.anima`, o null (e quell'id resta allo sprite da lì in poi). */
export function costruisci(id) {
  if (!id || rotti.has(id)) return null
  try {
    const [base, variante, rango] = id.split('+')
    const g = voceDi(base).crea()
    if (!g || !g.isObject3D) throw new Error('crea non torna un Object3D')
    if (variante) {
      const tipo = Object.keys(ARMI_DELLA_VARIANTE).find(t => ARMI_DELLA_VARIANTE[t][variante] && perGrado(MODELLO_DI_SPECIE[t], 'comune') === base)
      const a = tipo && ARMI_DELLA_VARIANTE[tipo][variante]
      const arma = l => (l === undefined ? undefined : l === null ? null : creaDaId(l[Number(rango) || 0]))
      if (a && g.userData.impugna) g.userData.impugna(arma(a.destra), arma(a.sinistra))
    }
    if (typeof g.userData.anima !== 'function') g.userData.anima = () => {}
    return g
  } catch (e) {
    rotti.add(id)
    console.warn(`mostri 3D: ${id} non si costruisce, resta lo sprite`, e)
    return null
  }
}
