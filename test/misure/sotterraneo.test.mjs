/* L'equilibrio del sotterraneo con la roba che resta (docs/sotterraneo/
   regole.md, «Svenire» e «Fra una discesa e l'altra»). Da quando quello
   che si trova e si compra scende alla discesa dopo, il rischio è che le
   discese dopo diventino una passeggiata, e che chi arriva alla miniera
   con lo zaino pieno la vinca rispondendo male.

   Venti file per eroe: la campagna giocata in fila a otto su dieci,
   rigiocando quella persa e facendo la spesa dai mercanti fra una e
   l'altra; prima di ogni discesa se ne gioca una copia con quello zaino
   a otto, sei e quattro risposte giuste su dieci. Due file: chi gira
   tutto (lo zaino più pieno, il caso peggiore) e chi va dritto alla
   scala (il più povero). I bersagli di sempre: a otto si arriva in fondo
   quasi sempre, a sei circa metà, a quattro quasi mai — tranne la
   scalinata, che perdona e che si comincia a mani nude.
   `node test/esegui.mjs misure/sotterraneo --niente-build`
   tempo: 300 */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { misuraConLaRoba } from '../../src/giochi/sotterraneo/motore/banco.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const SEMI = 20
const corto = t => t.chiave.padEnd(10)
const riga = (m, j) => CAMPAGNA.map((t, k) => String(m.vinte[j][k]).padStart(2)).join(' · ')

for (const eroe of ['cavaliere', 'mago']) {
  const tutto = misuraConLaRoba({ semi: SEMI, fila: 'tutto', eroe })
  const dritto = misuraConLaRoba({ semi: SEMI, fila: 'minimo', eroe })
  nota(`${eroe}, venti file per discesa (${CAMPAGNA.map(corto).join('')}):`)
  for (const [nome, m] of [['gira tutto', tutto], ['va dritto', dritto]])
    m.prove.forEach((b, j) => nota(`  ${nome.padEnd(10)} a ${b * 10}/10: ${riga(m, j)}`))
  nota('  lo zaino di chi gira tutto, prima di ogni discesa: ' + tutto.zaini.map(z =>
    `⚔️${z.att.toFixed(1)} 🛡️${z.dif.toFixed(1)} 🧪${z.pozioni.toFixed(1)}`).join(' · '))

  for (const [k, t] of CAMPAGNA.entries()) {
    /* a otto su dieci si arriva in fondo quasi sempre, anche andando dritti con
       poca roba; il mago, che regge meno, ha un margine in più */
    const pavimento = eroe === 'mago' ? 0.7 : 0.85
    for (const [nome, m] of [['girando tutto', tutto], ['andando dritti', dritto]])
      controlla(`${eroe}, ${t.chiave}: a 8/10 ${nome} si arriva in fondo`, m.vinte[0][k] >= SEMI * pavimento,
                `${m.vinte[0][k]}/${SEMI}`)
    if (!k || eroe === 'mago') continue
    /* a sei su dieci circa metà: fra le due file, né quasi sempre né quasi mai */
    const sei = (tutto.vinte[1][k] + dritto.vinte[1][k]) / (2 * SEMI)
    controlla(`${t.chiave}: a 6/10 si arriva in fondo circa metà delle volte`, sei >= 0.3 && sei <= 0.8,
              `${Math.round(sei * 100)}%`)
    /* a quattro su dieci quasi mai, anche con lo zaino pieno di chi ha girato tutto */
    controlla(`${t.chiave}: a 4/10 con lo zaino pieno quasi mai`, tutto.vinte[2][k] <= SEMI * 0.25,
              `${tutto.vinte[2][k]}/${SEMI}`)
  }
}

riassunto('l\'equilibrio del sotterraneo con la roba che resta')
