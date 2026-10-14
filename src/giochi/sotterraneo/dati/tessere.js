// Quale pezzo per quale cosa: dato puro, nome della cosa → nome dello sprite (letto da scena/tela.js). Lo
// scenario intero di un piano sta in una voce di SCENARI, tutte con le stesse chiavi (docs/sotterraneo/scenari.md).
// guastiDelleTessere chiede all'atlante ogni nome: un pezzo mancante è rosso nei test, non un muro invisibile.

import { EROI } from './eroi.js'
import { MOSTRI } from './mostri.js'
import { CAMPAGNA, TRATTI_DELL_ABISSO } from './campagna.js'
import { ORPELLI, POSE } from './orpelli.js'
import { guastiDeiRelitti } from './relitti.js'

export const SCENARI = {
  cantine: {
    // quadrati di 4×4 celle, non piastrelle; stanza e corridoio hanno due disegni diversi
    pavimento: { stanza: 'cantine-pav-stanze', corridoio: 'cantine-pav-corridoi' },
    medaglione: 'cantine-medaglione',   // 3×3, sotto la fontana: si vede da lontano dov'è la stanza della fonte
    tetto: 'cantine-tetto',   // trama solo vicino a dove si cammina, o farebbe carta da parati sui muri spessi
    colori: { roccia: '#25201d' },
    faccia: 'cantine-faccia-fila',   // striscia di sei celle; le varianti sono una cella e ci si mettono in mezzo
    torcia: 'cantine-faccia-torcia',
    varianti: ['cantine-faccia-grata', 'cantine-faccia-arco', 'cantine-faccia-liscia',
               'cantine-faccia-toppa', 'cantine-faccia-mensola'],
    capi: { sx: 'cantine-capo-sx', dx: 'cantine-capo-dx' },
    bordi: { n: 'cantine-bordo-n', o: 'cantine-bordo-o', e: 'cantine-bordo-e',
             angolo: 'cantine-bordo-angolo' },
    // la porta non dice cosa c'è dietro: semplice, ferrata o di legno chiaro a caso, e solo la stanza del grosso ha la sua più bella (docs/sotterraneo/piani.md, «Le porte»)
    porte: {
      davanti: { semplice: 'cantine-porta-semplice', ferro: 'cantine-porta-ferro', chiara: 'cantine-porta-chiara', bella: 'porta-nera-teschio', aperta: 'cantine-porta-aperta' },
      fianco: { semplice: 'cantine-fianco-semplice', ferro: 'cantine-fianco-ferro', chiara: 'cantine-fianco-chiara', bella: 'cantine-fianco-teschio', aperta: 'cantine-fianco-aperta' },
    },
    scala: { aperta: 'cantine-scala-aperta', chiusa: 'cantine-scala-chiusa' },
    fontana: { piena: 'cantine-fontana-piena', asciutta: 'cantine-fontana-asciutta' },   // bevuta resta lì, asciutta
    perTerra: ['cantine-terriccio', 'cantine-sassolini', 'cantine-radice'],
    ragnatele: { sx: 'cantine-ragnatela-sx', dx: 'cantine-ragnatela-dx' },
    // i forzieri del posto (docs/sotterraneo/roba.md): legno e ferro, pietra e ferro freddo, ferro e brace; il d'oro è solo quello delle missioni
    forzieri: ['cantine-forziere-a', 'cantine-forziere-b', 'cantine-forziere-c', 'cantine-forziere-d'],
    orpelli: ORPELLI.cantine,   // l'arredo: cosa c'è, dove sta, quanto è epico (dati/orpelli.js)
    diagonali: null,   // i muri obliqui hanno i pezzi solo nella cripta (docs/sotterraneo/scenari.md, «I muri in diagonale»)
  },
  // la cripta (sotterraneo_4*.png): ritagliata da una scena, più due fogli coi pezzi che la scena non ha
  cripta: {
    pavimento: { stanza: 'cripta-pav-stanze', corridoio: 'cripta-pav-corridoi' },
    medaglione: 'cripta-medaglione',
    tetto: 'cripta-tetto',
    colori: { roccia: '#14181b' },
    faccia: 'cripta-faccia-fila',
    torcia: 'cripta-faccia-torcia',
    varianti: ['cripta-faccia-grata', 'cripta-faccia-liscia', 'cripta-faccia-toppa'],
    capi: { sx: 'cripta-capo-sx', dx: 'cripta-capo-dx' },
    // bordi con la fascia scura: `luce` è quanto è larga la riga chiara, da ripassare (scena/tela.js)
    bordi: { n: 'cripta-bordo-n', o: 'cripta-bordo-o', e: 'cripta-bordo-e',
             angolo: 'cripta-bordo-angolo', luce: 3 },
    porte: {
      davanti: { semplice: 'cripta-porta-semplice', ferro: 'cripta-porta-ferro', chiara: 'cripta-porta-chiara', bella: 'porta-nera-teschio', aperta: 'cripta-porta-aperta' },
      fianco: { semplice: 'cripta-fianco-semplice', ferro: 'cripta-fianco-ferro', chiara: 'cripta-fianco-chiara', bella: 'cripta-fianco-teschio', aperta: 'cripta-fianco-aperta' },
    },
    scala: { aperta: 'cripta-scala-aperta', chiusa: 'cripta-scala-chiusa' },
    fontana: { piena: 'cripta-fontana-piena', asciutta: 'cripta-fontana-asciutta' },
    perTerra: ['cripta-foglie', 'cripta-schegge', 'cripta-lastra'],
    ragnatele: { sx: 'cripta-ragnatela-sx', dx: 'cripta-ragnatela-dx' },
    forzieri: ['cripta-forziere', 'forziere-scuro-chiuso', 'cripta-forziere-b'],
    orpelli: ORPELLI.cripta,
    // i muri obliqui delle stanze smussate e delle cappelle, fatti in codice dalle tessere dritte (strumenti/sprite/diagonali.py):
    // taglio = cella di roccia con il pavimento in diagonale (bordo), faccia = fascia alta due celle, due pezzi per la fila di due
    diagonali: {
      taglio: { so: 'cripta-taglio-so', se: 'cripta-taglio-se' },
      faccia: { no: ['cripta-faccia-no-0', 'cripta-faccia-no-1'], ne: ['cripta-faccia-ne-0', 'cripta-faccia-ne-1'] },
    },
  },
  // la fornace (sotterraneo_5*.png): ritagliata da una scena, più un foglio coi pezzi che la scena non ha
  fornace: {
    pavimento: { stanza: 'fornace-pav-stanze', corridoio: 'fornace-pav-corridoi' },
    medaglione: 'fornace-medaglione',
    tetto: 'fornace-tetto',
    colori: { roccia: '#1b1312' },
    faccia: 'fornace-faccia-fila',
    torcia: 'fornace-faccia-torcia',
    varianti: ['fornace-faccia-grata', 'fornace-faccia-liscia', 'fornace-faccia-toppa'],
    capi: { sx: 'fornace-capo-sx', dx: 'fornace-capo-dx' },
    bordi: { n: 'fornace-bordo-n', o: 'fornace-bordo-o', e: 'fornace-bordo-e', angolo: 'fornace-bordo-angolo' },
    porte: {
      davanti: { semplice: 'fornace-porta-semplice', ferro: 'fornace-porta-ferro', chiara: 'fornace-porta-chiara', bella: 'fornace-porta-corna', aperta: 'fornace-porta-aperta' },
      fianco: { semplice: 'fornace-fianco-semplice', ferro: 'fornace-fianco-ferro', chiara: 'fornace-fianco-chiara', bella: 'fornace-fianco-corna', aperta: 'fornace-fianco-aperta' },
    },
    scala: { aperta: 'fornace-scala-aperta', chiusa: 'fornace-scala-chiusa' },
    fontana: { piena: 'fornace-fontana-piena', asciutta: 'fornace-fontana-asciutta' },
    perTerra: ['fornace-cenere', 'fornace-sassi', 'fornace-scoria'],
    ragnatele: { sx: 'fornace-ragnatela-sx', dx: 'fornace-ragnatela-dx' },
    forzieri: ['fornace-forziere-b', 'fornace-forziere-c'],
    orpelli: ORPELLI.fornace,
    diagonali: null,
  },
}

export const SCENARIO = 'cantine'   // di chi non dichiara il suo: una tappa con `scenario:`, l'abisso dal tratto

// la figura dice quanto vale prima di raccoglierlo: scostarsi per tre gemme o per dodici non è la stessa decisione. Sotto sei
// la moneta che gira; da lì in su la gemma, e il colore è il valore: blu, verde, viola, rossa (docs/sotterraneo/roba.md)
export const SOGLIE_DELLE_GEMME = [[48, 'gemma-rossa'], [24, 'gemma-viola'], [12, 'gemma-verde'], [6, 'gemma-blu']]
export const pezzoDelleGemme = (quante, t) =>
  (SOGLIE_DELLE_GEMME.find(([da]) => quante >= da) || [0, `moneta-${((t * 8) | 0) % 4}`])[1]

// una funzione per genere, nessuna sa di canvas
export const PEZZO_DI = {
  scala: (r, t, sc, { chiusa } = {}) => (chiusa ? sc.scala.chiusa : sc.scala.aperta),
  arredo: r => r.pezzo,   // il piano pesca già col pezzo dello scenario (motore/livello.js, arredaLeStanze)
  // la pelle di un forziere è un numero fisso (dal tiro del piano) e il suo scenario sceglie il disegno; il d'oro è solo
  // quello di una missione (`pelle` è il suo nome); i salvataggi di prima hanno ancora il nome
  forziere: (r, t, sc) => (r.aperto ? 'forziere-aperto'
    : typeof r.pelle === 'number' ? sc.forzieri[r.pelle % sc.forzieri.length] : (r.pelle || 'forziere-chiuso')),
  porta: (r, t, sc, { verso = 'davanti' } = {}) => {
    const pelli = sc.porte[verso]
    return r.aperta ? pelli.aperta : (pelli[r.pelle] || pelli.semplice)
  },
  gemme: (r, t) => pezzoDelleGemme(r.quante, t),
  curiosita: r => r.pezzo,
  fonte: (r, t, sc) => (r.morto ? sc.fontana.asciutta : sc.fontana.piena),
}

// tre o quattro fotogrammi per posa, guardano a destra: la sinistra è la stessa specchiata
export const pezzoAndante = (chi, posa, fr) => `${chi}-${posa}-${fr % 4}`

// tutti i nomi che uno scenario chiede all'atlante, tranne `colori`
export function pezziDelloScenario(sc) {
  const fuori = []
  const giu = v => {
    if (typeof v === 'string') fuori.push(v)
    else if (Array.isArray(v)) v.forEach(giu)
    else if (v && typeof v === 'object') Object.values(v).forEach(giu)
  }
  for (const [k, v] of Object.entries(sc)) {
    if (k === 'orpelli') v.forEach(o => fuori.push(o.pezzo))
    else if (k !== 'colori') giu(v)
  }
  return fuori
}

// i nomi arrivano da fuori: questo file non importa l'atlante, o il motore smetterebbe di girare in Node
export function guastiDelleTessere(nomi = null) {
  const g = []
  const ha = n => !nomi || nomi.includes(n)
  const chiedi = (n, dove) => { if (n && !ha(n)) g.push(`${dove}: nell'atlante non c'è "${n}"`) }

  if (!SCENARI[SCENARIO]) g.push(`lo scenario di ripiego "${SCENARIO}" non esiste`)
  const chiavi = Object.keys(SCENARI[SCENARIO] || {}).sort().join()
  for (const [k, sc] of Object.entries(SCENARI)) {
    // tutte le voci con le stesse chiavi, o una chiave mancante è un muro che non si disegna senza errori
    if (Object.keys(sc).sort().join() !== chiavi)
      g.push(`lo scenario ${k} non ha le stesse voci di ${SCENARIO}`)
    for (const n of pezziDelloScenario(sc)) chiedi(n, `scenario ${k}`)
    const visti = new Set()
    for (const o of sc.orpelli || []) {
      if (visti.has(o.pezzo)) g.push(`scenario ${k}: l'orpello "${o.pezzo}" c'è due volte`)
      visti.add(o.pezzo)
      if (!o.dice) g.push(`scenario ${k}: l'orpello "${o.pezzo}" non dice niente a chi lo tocca`)
      if (!POSE.includes(o.posa)) g.push(`scenario ${k}: l'orpello "${o.pezzo}" ha una posa che non esiste (${o.posa})`)
      if (!(o.epica >= 1 && o.epica <= 10)) g.push(`scenario ${k}: l'orpello "${o.pezzo}" ha un'epicità fuori da 1–10`)
    }
    if (!(sc.orpelli || []).some(o => o.epica <= 1 && o.posa !== 'coppia'))
      g.push(`scenario ${k}: nessun orpello da stanza qualunque (epicità 1)`)
    for (const verso of ['davanti', 'fianco'])
      for (const pelle of ['semplice', 'ferro', 'chiara', 'bella', 'aperta'])
        if (!(sc.porte && sc.porte[verso] && sc.porte[verso][pelle]))
          g.push(`lo scenario ${k} non ha la porta ${pelle} vista ${verso}`)
  }
  // chi lo chiede per nome deve trovarlo: la tela ripiegherebbe in silenzio
  for (const t of [...CAMPAGNA, ...TRATTI_DELL_ABISSO])
    if (t.scenario && !SCENARI[t.scenario]) g.push(`${t.nome}: lo scenario "${t.scenario}" non esiste`)
  for (const [k, sc] of Object.entries(SCENARI))
    if (!(sc.perTerra || []).length) g.push(`lo scenario ${k} non ha niente per terra`)
  g.push(...guastiDeiRelitti(nomi))   // i relitti hanno il loro scenario e i loro sprite (dati/relitti.js)
  for (const q of [1, 6, 12, 24, 48]) chiedi(pezzoDelleGemme(q, 0), `gemme da ${q}`)
  chiedi('forziere-oro-chiuso', 'forziere d\'oro')
  if (nomi) {
    // eroi e mostri si chiedono alle loro tabelle, non a un elenco a mano; `unaPosa` ha solo il respiro (scena/tela.js)
    const chiedeva = [
      ...EROI.map(e => ({ sprite: e.sprite, pose: ['fermo', 'corsa'] })),
      ...Object.values(MOSTRI).map(m => ({
        sprite: m.sprite, pose: m.unaPosa ? ['fermo'] : ['fermo', 'corsa'],
      })),
    ]
    for (const { sprite, pose } of chiedeva)
      for (const posa of pose)
        chiedi(`${sprite}-${posa}-0`, `${sprite} ${posa}`)   // quanti ne ha lo dice l'atlante (dati/fotogrammi.js)
  }
  return g
}
