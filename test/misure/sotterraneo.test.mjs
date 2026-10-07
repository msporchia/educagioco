/* La tabella della grande storia sotto il banco (docs/sotterraneo/
   la-grande-storia.md). Ogni eroe ha una riga di roba attesa per ogni
   discesa (dati/storia.js), e i mostri di ogni discesa sono tarati su
   quella riga (`forza`, `spinta` in dati/campagna.js). Qui si gioca ogni
   discesa venti volte per eroe, andando dritti alla scala:

   - con la roba attesa, a otto risposte giuste su dieci si arriva in fondo
     quasi sempre, a sei circa metà delle volte (in media fra i quattro), a
     quattro quasi mai — tranne la prima, che perdona;
   - con la roba di una discesa prima si fatica, ma a otto su dieci ci si
     arriva ancora più di metà delle volte;
   - con la roba di due discese avanti, a quattro su dieci non diventa una
     passeggiata.
   E chi gira tutto (combatte ogni mostro) con la roba attesa, a otto su
   dieci, arriva in fondo lo stesso quasi sempre.
   `node test/esegui.mjs misure/sotterraneo --niente-build`
   tempo: 300 */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { misuraLaStoria } from '../../src/giochi/sotterraneo/motore/banco.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const SEMI = 20
const corto = t => t.chiave.slice(0, 8).padStart(9)
const fila = v => CAMPAGNA.map((_, k) => String(v[k]).padStart(9)).join('')
const media = (tutte, scarto, j, k) => tutte.reduce((n, m) => n + m.vinte[scarto][j][k], 0) / (tutte.length * SEMI)

const tutte = []
for (const e of EROI) {
  const m = misuraLaStoria({ eroe: e.chiave, semi: SEMI })
  tutte.push(m)
  nota(`${e.chiave}, venti semi per discesa, dritti alla scala${' '.repeat(6)}${CAMPAGNA.map(corto).join('')}`)
  for (const [scarto, nome] of [[0, 'roba attesa'], [-1, 'una prima'], [2, 'due avanti']])
    m.prove.forEach((b, j) => nota(`  ${nome.padEnd(12)} a ${b * 10}/10: ${' '.repeat(17)}${fila(m.vinte[scarto][j])}`))
  nota(`  gemme con cui si esce, con la roba attesa: ${CAMPAGNA.map((_, k) => Math.round(m.gemme[k])).join(' · ')}`)

  for (const [k, t] of CAMPAGNA.entries()) {
    const [otto, , quattro] = m.vinte[0].map(v => v[k])
    const pavimento = e.chiave === 'mago' ? 0.8 : 0.85   // il mago regge meno
    controlla(`${e.chiave}, ${t.chiave}: con la roba attesa a 8/10 si arriva in fondo quasi sempre`,
              otto >= SEMI * pavimento, `${otto}/${SEMI}`)
    if (k) controlla(`${e.chiave}, ${t.chiave}: con la roba attesa a 4/10 quasi mai`, quattro <= SEMI * 0.25, `${quattro}/${SEMI}`)
    else controlla(`${e.chiave}, la prima perdona: a 4/10 si arriva in fondo spesso`, quattro >= SEMI * 0.6, `${quattro}/${SEMI}`)
  }
}

for (const [k, t] of CAMPAGNA.entries()) {
  if (!k) continue
  const sei = media(tutte, 0, 1, k)
  controlla(`${t.chiave}: a 6/10 con la roba attesa circa metà, fra i quattro eroi`, sei >= 0.35 && sei <= 0.8,
            `${Math.round(sei * 100)}%`)
  const prima8 = media(tutte, -1, 0, k), prima6 = media(tutte, -1, 1, k)
  controlla(`${t.chiave}: con la roba di una discesa prima, a 8/10 ci si arriva ancora`, prima8 >= 0.5,
            `${Math.round(prima8 * 100)}%`)
  controlla(`${t.chiave}: ma si fatica (a 6/10 meno che con la roba attesa)`, prima6 < sei,
            `${Math.round(prima6 * 100)}% contro ${Math.round(sei * 100)}%`)
  const avanti4 = media(tutte, 2, 2, k)
  controlla(`${t.chiave}: con la roba di due discese avanti, a 4/10 non è una passeggiata`, avanti4 <= 0.7,
            `${Math.round(avanti4 * 100)}%`)
}

/* chi gira tutto: più mostri con la stessa roba, ma anche più pozioni e i pezzi dei forzieri */
for (const eroe of ['cavaliere', 'mago']) {
  const m = misuraLaStoria({ eroe, semi: SEMI, come: 'tutto', prove: [0.8], scarti: [0] })
  nota(`${eroe}, gira tutto, roba attesa, a 8/10: ${' '.repeat(10)}${fila(m.vinte[0][0])}`)
  for (const [k, t] of CAMPAGNA.entries())
    controlla(`${eroe}, ${t.chiave}: girando tutto a 8/10 si arriva in fondo quasi sempre`, m.vinte[0][0][k] >= SEMI * 0.65,
              `${m.vinte[0][0][k]}/${SEMI}`)
}

riassunto('la tabella della grande storia')
