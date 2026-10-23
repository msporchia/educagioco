// Chi pesa, un elemento alla volta (docs/core/vecchio-telefono-elementi.md): le scene, i loro elementi e le scene di misura che ne
// vengono. Per ogni scena: tutto spento (`:0`, il giro del gioco senza disegnare), un elemento acceso alla volta (`+k`; le luci e i
// ritocchi sopra una base che li fa vedere, misurata anche lei), la scena intera (`:tutto`) e un elemento tolto alla volta (`-k`), in due
// gruppi (il riferimento del calore si rifà fra l'uno e l'altro); poi la scena intera com'è e con le leve semplici (`:semplice`). Dato puro.
import { ELEMENTI_DISCESE, ELEMENTI_SOPRA } from '../../../giochi/sotterraneo/scena3d/costanti.js'

/** Le leve semplici della fascia bassa proposte (i pezzi di ACCESI, come `&spegni=`): docs/core/vecchio-telefono-elementi.md. */
export const LEVE = ['ombre', 'rilievo', 'nebbiaFitta', 'quantaPolvere:0.4']

const PARETI = ['pavimento', 'pareteLontana', 'pareteVicina', 'colonne']
/**
 * `elementi`: i nomi (di ACCESI, o speciali che la famiglia sa fare: `ombra`, `normali`, `foschia`); `sopra`: su quali si misura un
 * elemento che da solo non si vede (una luce senza niente da illuminare non costa); `leva`: la semplificazione pronta, o cosa si farebbe.
 */
export const SCENE_ELEMENTI = {
  sot: {
    nome: 'Sotterraneo, lo scontro con 1 mostro e gli effetti', carica: () => import('./elementi-sot.js'),
    elementi: [...ELEMENTI_DISCESE, 'ombra', 'normali', 'post'],
    sopra: { torcia: PARETI, fuochi: PARETI, lampo: PARETI, palco: PARETI, resto: PARETI, ombra: [...PARETI, 'torcia'], normali: [...PARETI, 'torcia'] },
    leve: { spegni: LEVE },
  },
  sopra: {
    nome: 'Mondo di sopra, il villaggio con 4 persone e 3 mostri', carica: () => import('./elementi-sopra.js'),
    elementi: [...ELEMENTI_SOPRA, 'ombra', 'normali', 'foschia'],
    sopra: { sole: ['terreno'], resto: ['terreno'], foschia: ['terreno'], normali: ['terreno', 'sole'], ombra: ['terreno', 'case', 'sole'] },
    leve: { spegni: LEVE },
  },
  // i nomi della fattoria e degli asteroidi stanno anche nei loro giochi (ELEMENTI_FATTORIA, ELEMENTI_ASTEROIDI: un test li confronta):
  // qui scritti a mano, perché questo file sta nella pagina e i giochi no
  fat: {
    nome: 'Fattoria 3D, la fattoria tipo del livello 10', carica: () => import('./elementi-fat.js'),
    elementi: ['terreno', 'strade', 'alberi', 'erba', 'acqua', 'campi', 'edifici', 'pezzi', 'animali', 'eroe', 'stagione', 'sole', 'resto', 'ombra', 'nebbia'],
    sopra: { sole: ['terreno'], resto: ['terreno'], nebbia: ['terreno'], ombra: ['terreno', 'edifici', 'alberi', 'sole'] },
    leve: { qualita: { erba: false } },
  },
  ast: {
    nome: 'Asteroidi 3D (il termine di confronto), 8 sassi e la nave', carica: () => import('./elementi-ast.js'),
    elementi: ['cielo', 'sassi', 'nave', 'madre', 'effetti', 'luci', 'resto', 'post'],
    sopra: { luci: ['sassi', 'nave'], resto: ['sassi', 'nave'] },
    leve: null,
  },
}

/** La semplificazione di ogni elemento: quella pronta (una leva) o quella che si farebbe. */
export const SEMPLICE = {
  pavimento: 'leva `rilievo`: senza normal map né ruvidezza; poi colore per vertice e trama cotta',
  pareteLontana: 'leva `rilievo`; poi meno facce (stile «lastroni») e colore per vertice',
  pareteVicina: 'leva `rilievo`; poi parapetti a colore pieno',
  colonne: 'leva `rilievo`; poi una forma sola, meno lati',
  arredo: 'meno pezzi per stanza, materiali Lambert',
  fiamme: 'meno fiamme (solo le torce vicine)',
  torcia: 'il rimbalzo via (già nella bassa con `lampi`), alone e cono in una luce',
  fuochi: '`fuochi:1` o 0: ogni luce costa a ogni pixel',
  lampo: 'lampo e magia in una luce (già nella bassa)',
  palco: 'via, la schiarita la fa l\'emisferica (già nella bassa)',
  nebbia: 'leva `nebbiaFitta`: una fetta sola; poi via',
  particelle: 'leva `quantaPolvere:0.4`; poi meno scintille (`quanteScintille`)',
  effetti3d: 'effetti più semplici: meno particelle additive, sprite piatti',
  chiarori: 'meno aloni per terra',
  figure: 'meno figure, niente normal map dell\'atlante',
  eroe: 'meno chiamate (saldatura, l\'altro lavoro)',
  mostri: 'meno chiamate per mostro, modelli 3D solo per i vicini',
  resto: 'una cosa senza nome: va trovata',
  ombra: 'leva `ombre`: via l\'ombra del cono e del sole',
  normali: 'leva `rilievo`',
  terreno: 'leva `rilievo`; poi una trama sola invece di quattro',
  mare: 'shader dell\'acqua più semplice',
  natura: 'meno alberi, chiome a colore pieno',
  case: 'meno oggetti di scena, materiali Lambert',
  cielo: 'il colore di fondo al posto della volta',
  sole: 'la luce resta: costa poco da sola',
  velo: 'meno nuvole del velo',
  vita: 'meno fumo e uccelli',
  scia: 'meno luci della scia',
  persone: 'meno persone 3D, le lontane a sprite',
  foschia: 'via: la nebbia di three a ogni pixel',
  post: 'via (già nella bassa): la scena dritta sullo schermo',
  strade: 'meno istanze, una trama sola',
  alberi: 'meno alberi, chiome a colore pieno senza ombra',
  erba: 'leva: i ciuffi spenti nella bassa (`erba: false`)',
  acqua: 'shader dell\'acqua più semplice, meno pesci',
  campi: 'piante più semplici nei banchi',
  edifici: 'meno pezzi per edificio, materiali Lambert',
  pezzi: 'meno decori',
  animali: 'meno animali o modelli più semplici',
  stagione: 'meno fiocchi e addobbi',
  sassi: 'meno pezzi per sasso',
  nave: 'meno parti',
  madre: 'meno parti',
  luci: 'meno luci puntiformi',
  effetti: 'meno particelle (la fascia lo fa già: `scintille`, `fumo`)',
}

const chiave = l => [...l].sort().join(',')
/** Le scene di misura di una scena: [{ id, nome, gruppo, accesi, el: { scena, modo, k, rif } }], i due gruppi e la coppia delle leve. */
export function sceneDegliElementi(sc) {
  const d = SCENE_ELEMENTI[sc], accendi = [], togli = [], leve = []
  const per = {}   // chiave dell'insieme → id della scena che lo misura
  const metti = (id, nome, accesi, el) => { const s = { id: `el-${sc}${id}`, nome, accesi, el: { scena: sc, ...el } }; accendi.push(s); per[chiave(accesi)] = s.id; return s }
  metti(':0', 'tutto spento', [], { modo: 'zero' })
  // le basi che servono, prima degli elementi
  let b = 0
  for (const s of new Set(Object.values(d.sopra).map(chiave))) if (s && !per[s]) metti(`:b${b++}`, `base ${s}`, s.split(','), { modo: 'base' })
  for (const k of d.elementi) {
    const sotto = d.sopra[k] || []
    const accesi = [...new Set([...sotto, k])]
    if (per[chiave(accesi)]) continue
    metti(`+${k}`, `${k} da solo${sotto.length ? ' (sopra ' + sotto.join(', ') + ')' : ''}`, accesi, { modo: 'solo', k, rif: per[chiave(sotto)] })
  }
  // un elemento che è già la base di un altro (la torcia sopra le pareti): il suo `+k` è la base stessa
  for (const k of d.elementi) if (!accendi.some(s => s.el.k === k)) {
    const sotto = d.sopra[k] || [], s = accendi.find(x => x.id === per[chiave([...new Set([...sotto, k])])])
    s.el = { ...s.el, modo: 'solo', k, rif: per[chiave(sotto)] }
  }
  togli.push({ id: `el-${sc}:tutto`, nome: 'scena intera', accesi: d.elementi, el: { scena: sc, modo: 'tutto' } })
  for (const k of d.elementi) togli.push({ id: `el-${sc}-${k}`, nome: `senza ${k}`, accesi: d.elementi.filter(x => x !== k), el: { scena: sc, modo: 'via', k } })
  if (d.leve) {
    leve.push({ id: `el-${sc}:com-era`, nome: 'scena intera, com\'è', accesi: d.elementi, el: { scena: sc, modo: 'com-era' } })
    leve.push({ id: `el-${sc}:semplice`, nome: 'scena intera, con le leve semplici', accesi: d.elementi, el: { scena: sc, modo: 'semplice' } })
  }
  return { accendi, togli, leve }
}

/** Le tappe per veri.js: tre gruppi per scena (accendi, togli, leve), la seconda metà delle leve con le leve (`opz` della scena). */
export function tappeDegliElementi(scene = Object.keys(SCENE_ELEMENTI)) {
  const t = []
  for (const sc of scene) {
    const { accendi, togli, leve } = sceneDegliElementi(sc), carica = SCENE_ELEMENTI[sc].carica
    t.push({ gruppo: `elementi-${sc}`, carica, tempi: 'elementi', scene: accendi })
    t.push({ gruppo: `elementi-${sc}-togli`, carica, tempi: 'elementi', scene: togli })
    if (!leve.length) continue
    t.push({ gruppo: `elementi-${sc}-leve`, carica, tempi: 'elementi', scene: [leve[0]] })
    t.push({ gruppo: `elementi-${sc}-leve`, carica, tempi: 'elementi', opz: SCENE_ELEMENTI[sc].leve, scene: [leve[1]] })
  }
  return t
}
