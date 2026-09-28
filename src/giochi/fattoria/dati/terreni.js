/* Di cosa è fatta una cella: una mappa (prato, acqua, strada, roccia), non "prato più pozze sopra".
   Il bordo è fra due materie (acqua contro prato ≠ acqua contro roccia), indicizzato per chi c'è di
   fronte (bordi: {erba:…, roccia:…, '*':…}); il pittore chiede solo le nove chiavi di sempre. */
import { PEZZI } from './atlante.js'

// Le nove chiavi che un insieme di bordi deve avere, sempre le stesse per qualunque materia.
export const LATI = ['centro', 'n', 's', 'e', 'o', 'no', 'ne', 'so', 'se']

export const BASE = 'erba'          // di cosa è fatta una cella che nessuno ha toccato

export const TERRENI = {
  erba: {
    nome: 'Prato',
    // Il prato non ha bordi (è il fondo); le tessere si alternano, quasi sempre la piatta.
    tessere: ['erba0', 'erba0', 'erba0', 'erba0', 'erba0', 'erba0',
              'erba1', 'erba2', 'erba3'],
  },

  acqua: {
    nome: 'Acqua',
    prezzo: 4,                      // a cella: si dipinge, non si compra a blocchi
    passa: false,                   // non ci si cammina e non ci si posa niente
    bordi: {
      erba: {
        centro: 'stagno_centro',
        n: 'stagno_bordo_n', s: 'stagno_bordo_s',
        e: 'stagno_bordo_e', o: 'stagno_bordo_o',
        no: 'stagno_angolo_no', ne: 'stagno_angolo_ne',
        so: 'stagno_angolo_so', se: 'stagno_angolo_se',
      },
    },
  },

  // Annunciate e ancora senza tessere: guastiDeiTerreni() le nomina finché non arriva il foglio.
  strada: { nome: 'Strada', bordi: {} },
  roccia: { nome: 'Roccia', passa: false, bordi: {} },
}

export const CHIAVI = Object.keys(TERRENI)

// Le tessere di bordo fra una materia e il vicino; '*' è il ripiego, null lascia il fondo.
export function bordiFra(materia, vicino) {
  const t = TERRENI[materia]
  if (!t || !t.bordi) return null
  return t.bordi[vicino] || t.bordi['*'] || null
}

export const siPassa = materia => TERRENI[materia] ? TERRENI[materia].passa !== false : true
export const prezzoDi = materia => (TERRENI[materia] && TERRENI[materia].prezzo) || 0

// Quali materie si possono davvero dipingere oggi (prezzo + bordi completi), ricavato e non scritto.
export const dipingibili = () => CHIAVI.filter(m => {
  const t = TERRENI[m]
  if (!t.prezzo) return false
  return Object.values(t.bordi || {}).some(b => LATI.every(l => PEZZI[b[l]]))
})

export function guastiDeiTerreni() {
  const g = []
  if (!TERRENI[BASE]) g.push(`la materia di base «${BASE}» non è dichiarata`)
  for (const [m, t] of Object.entries(TERRENI)) {
    if (!t.nome) g.push(`${m}: senza nome`)
    for (const nome of t.tessere || [])
      if (!PEZZI[nome]) g.push(`${m}: la tessera «${nome}» non è nell'atlante`)
    for (const [vicino, b] of Object.entries(t.bordi || {})) {
      const mancanti = LATI.filter(l => !b[l])
      if (mancanti.length)
        g.push(`${m} contro ${vicino}: mancano ${mancanti.join(', ')}`)
      for (const l of LATI)
        if (b[l] && !PEZZI[b[l]])
          g.push(`${m} contro ${vicino}: «${b[l]}» non è nell'atlante`)
    }
    // non è un guasto, è un promemoria che si vede
    if (m !== BASE && !Object.keys(t.bordi || {}).length && !t.tessere)
      g.push(`nota: ${m} è annunciata e non ancora disegnabile`)
  }
  return g
}
