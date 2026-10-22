// Rifà i numeri delle tabelle di docs/fattoria3d/parita/ (2D contro 3D) importando i dati, e segnala le righe della tabella
// «I numeri a colpo d'occhio» di parita/README.md che divergono dal codice. Non scrive niente: se una riga diverge si corregge
// il documento a mano (vince il codice). Esce con 1 se qualche riga diverge. Vedi docs/core/comandi.md.
//   npm run parita:fattoria3d
import { SCHEDE_DECORI } from '../src/giochi/fattoria3d/dati/decori.js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { CATEGORIE, CATALOGO } from '../src/giochi/fattoria/dati/catalogo.js'
import { COLTURE as COLTURE_2D, RICETTE as RICETTE_2D } from '../src/giochi/fattoria/dati/coltivazioni.js'
import { ULTIMO as ULTIMO_2D, sogliaDi as soglia2D } from '../src/giochi/fattoria/dati/livelli.js'
import { PEZZI, EDIFICI } from '../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE } from '../src/giochi/fattoria3d/dati/ricette.js'
import { ULTIMO, sogliaDi } from '../src/giochi/fattoria3d/dati/livelli.js'
import { MONETE_AL_MINUTO } from '../src/giochi/fattoria3d/dati/ordini.js'

const voci2D = CATEGORIE.flatMap(c => c.voci.map(v => ({ ...v, cat: c.chiave || c.id })))
const recinti2D = voci2D.filter(v => v.macchina && v.stati)
const macchine2D = new Set(voci2D.filter(v => v.macchina && !v.stati).map(v => v.macchina))
const edifici3D = Object.keys(EDIFICI), pezzi3D = Object.values(PEZZI)
const recinti3D = pezzi3D.filter(p => p.categoria === 'animali')
const ore = (soglia, ultimo) => Math.round(soglia(ultimo) / MONETE_AL_MINUTO / 60)

// riga della tabella (inizio dell'etichetta) → [2D, 3D], e come si legge
const RIGHE = [
  ['voci nel catalogo', [CATALOGO.length, pezzi3D.length + edifici3D.length], `3D: ${pezzi3D.length} pezzi + ${edifici3D.length} edifici`],
  ['di cui decorazioni', [voci2D.filter(v => v.cat !== 'campi').length, pezzi3D.filter(p => p.categoria === 'decori' || p.categoria in SCHEDE_DECORI).length], '2D: tutto tranne i campi; 3D: la categoria decori e le schede delle decorazioni'],
  ['colture', [COLTURE_2D.length, Object.keys(COLTURE).length]],
  ['ricette', [RICETTE_2D.length, Object.keys(RICETTE).length]],
  ['macchine', [macchine2D.size, edifici3D.filter(k => k !== 'mongolfiera').length], '3D: gli edifici meno la mongolfiera'],
  ['recinti del cortile', [recinti2D.length, recinti3D.length], '2D: le voci con macchina e stati'],
  ['livelli', [ULTIMO_2D, ULTIMO]],
  ['ore di esercizio', [ore(soglia2D, ULTIMO_2D), ore(sogliaDi, ULTIMO)], `spesa a 🪙${MONETE_AL_MINUTO}/min`],
]

// il primo numero di una cella («253», «~202», «38 (23 pezzi…)»); null se la cella non comincia con un numero
const numero = cella => { const m = /^\s*~?\s*(\d+)/.exec(cella || ''); return m ? parseInt(m[1], 10) : null }

const radice = fileURLToPath(new URL('..', import.meta.url))
const testo = readFileSync(radice + 'docs/fattoria3d/parita/README.md', 'utf8')
const dopo = testo.split(/^## I numeri a colpo d'occhio/m)[1] || ''
const tabella = dopo.split(/^## /m)[0].split('\n').filter(r => r.startsWith('|'))
const celle = r => r.split('|').slice(1, -1).map(c => c.trim())

let divergono = 0
console.log('riga | 2D codice | 2D documento | 3D codice | 3D documento')
for (const [etichetta, [c2, c3], nota] of RIGHE) {
  const riga = tabella.find(r => celle(r)[0].startsWith(etichetta))
  const [, d2, d3] = riga ? celle(riga).map(numero) : [null, null, null]
  const ok = riga && d2 === c2 && d3 === c3
  if (!ok) divergono++
  console.log(`${ok ? 'ok ' : 'DIV'} ${etichetta} | ${c2} | ${riga ? d2 : '(riga mancante)'} | ${c3} | ${riga ? d3 : '(riga mancante)'}${nota ? `   (${nota})` : ''}`)
}
console.log(divergono ? `\n${divergono} righe divergono dal codice: vince il codice, si corregge docs/fattoria3d/parita/README.md` : '\nTutte le righe misurate coincidono col codice.')
process.exit(divergono ? 1 : 0)
