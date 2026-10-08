/* La tabella della grande storia sotto il banco (docs/sotterraneo/
   la-grande-storia.md e livelli.md). Ogni eroe ha una riga di roba
   attesa per ogni discesa (dati/storia.js, con i pezzi dei mostri grossi
   delle discese prima) e un livello atteso (LIVELLI_ATTESI, coi punti
   dati come li dà il banco), e i mostri di ogni discesa sono tarati su
   quella riga (`forza`, `spinta` in dati/campagna.js). Qui si gioca ogni
   discesa venti volte per eroe, andando dritti alla scala:

   - con la roba e il livello attesi, a otto risposte giuste su dieci si
     arriva in fondo quasi sempre, a sei circa metà delle volte (in media
     fra i quattro), a quattro quasi mai — tranne la prima, che perdona;
   - con la roba di una discesa prima si fatica, ma dalla grotta in giù a
     otto su dieci ci si arriva ancora più di metà delle volte (le prime
     discese le fanno i primi pezzi: senza, si torna su);
   - con la roba di due discese avanti, a quattro su dieci non diventa una
     passeggiata (dalla torre in giù);
   - due livelli sotto si fatica, tre sopra a quattro su dieci non è una
     passeggiata: i livelli e la roba si sommano, e la tabella lo misura.
   E chi gira tutto (combatte ogni mostro) con la roba attesa, a otto su
   dieci, arriva in fondo lo stesso quasi sempre.
   Poi la storia giocata davvero, discesa dopo discesa, con la spesa e il
   bottino che cade (anche i pezzi magici e rari): non deve diventare una
   passeggiata né per chi va dritto né per chi gira tutto e spende tutto,
   né per chi arriva con molte gemme da parte.
   `node test/esegui.mjs misure/sotterraneo --niente-build`
   tempo: 400 */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { misuraLaStoria, misuraConLaRoba, misuraDiChiHaMessoDaParte } from '../../src/giochi/sotterraneo/motore/banco.js'
import { numeriAttesi } from '../../src/giochi/sotterraneo/motore/storia.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const SEMI = 20
const corto = t => t.chiave.slice(0, 8).padStart(9)
const fila = v => CAMPAGNA.map((_, k) => String(v[k]).padStart(9)).join('')
const media = (tutte, scarto, j, k) => tutte.reduce((n, m) => n + m.vinte[scarto][j][k], 0) / (tutte.length * SEMI)
const cento = x => `${Math.round(x * 100)}%`

const tutte = []
for (const e of EROI) {
  const m = misuraLaStoria({ eroe: e.chiave, semi: SEMI, livelli: [-2, 3] })
  tutte.push(m)
  nota(`${e.chiave}, venti semi per discesa, dritti alla scala${' '.repeat(6)}${CAMPAGNA.map(corto).join('')}`)
  nota(`  livello, ⚔️, 🛡️, ❤️ attesi: ${CAMPAGNA.map((_, k) => { const n = numeriAttesi(e.chiave, k); return `${n.livello}·${n.att}·${n.dif}·${n.vita}` }).join('  ')}`)
  for (const [scarto, nome] of [[0, 'roba attesa'], [-1, 'una prima'], [2, 'due avanti'], ['L-2', 'due livelli −'], ['L+3', 'tre livelli +']])
    m.prove.forEach((b, j) => nota(`  ${nome.padEnd(14)} a ${b * 10}/10: ${' '.repeat(15)}${fila(m.vinte[scarto][j])}`))
  nota(`  gemme con cui si esce, con la roba attesa: ${CAMPAGNA.map((_, k) => Math.round(m.gemme[k])).join(' · ')}`)

  for (const [k, t] of CAMPAGNA.entries()) {
    const [otto, , quattro] = m.vinte[0].map(v => v[k])
    const pavimento = e.chiave === 'mago' ? 0.7 : 0.8   // il mago regge meno
    controlla(`${e.chiave}, ${t.chiave}: con la roba e il livello attesi a 8/10 si arriva in fondo quasi sempre`,
              otto >= SEMI * pavimento, `${otto}/${SEMI}`)
    if (k) controlla(`${e.chiave}, ${t.chiave}: con la roba attesa a 4/10 quasi mai`, quattro <= SEMI * 0.3, `${quattro}/${SEMI}`)
    else controlla(`${e.chiave}, la prima perdona: a 4/10 si arriva in fondo spesso`, quattro >= SEMI * 0.6, `${quattro}/${SEMI}`)
  }
}

for (const [k, t] of CAMPAGNA.entries()) {
  if (!k) continue
  const sei = media(tutte, 0, 1, k)
  controlla(`${t.chiave}: a 6/10 con la roba attesa circa metà, fra i quattro eroi`, sei >= 0.3 && sei <= 0.8, cento(sei))
  const prima8 = media(tutte, -1, 0, k), prima6 = media(tutte, -1, 1, k)
  if (k >= 3) controlla(`${t.chiave}: con la roba di una discesa prima, a 8/10 ci si arriva ancora`, prima8 >= 0.5, cento(prima8))
  controlla(`${t.chiave}: e non va meglio che con la roba attesa (a 6/10, a meno del caso)`, prima6 <= sei + 0.15, `${cento(prima6)} contro ${cento(sei)}`)
  const avanti4 = media(tutte, 2, 2, k)
  if (k >= 2) controlla(`${t.chiave}: con la roba di due discese avanti, a 4/10 non è una passeggiata`, avanti4 <= 0.7, cento(avanti4))
  const sotto8 = media(tutte, 'L-2', 0, k), sotto6 = media(tutte, 'L-2', 1, k)
  controlla(`${t.chiave}: due livelli sotto, a 8/10 ci si arriva ancora`, sotto8 >= 0.5, cento(sotto8))
  controlla(`${t.chiave}: ma si fatica`, sotto6 <= sei, `${cento(sotto6)} contro ${cento(sei)}`)
  const sopra4 = media(tutte, 'L+3', 2, k)
  controlla(`${t.chiave}: tre livelli sopra, a 4/10 non è una passeggiata`, sopra4 <= 0.7, cento(sopra4))
}

/* chi gira tutto: più mostri con la stessa roba, ma anche più pozioni, più esperienza e i pezzi dei forzieri */
for (const eroe of ['cavaliere', 'mago']) {
  const m = misuraLaStoria({ eroe, semi: SEMI, come: 'tutto', prove: [0.8], scarti: [0] })
  nota(`${eroe}, gira tutto, roba attesa, a 8/10: ${' '.repeat(10)}${fila(m.vinte[0][0])}`)
  for (const [k, t] of CAMPAGNA.entries())
    controlla(`${eroe}, ${t.chiave}: girando tutto a 8/10 si arriva in fondo quasi sempre`, m.vinte[0][0][k] >= SEMI * 0.65,
              `${m.vinte[0][0][k]}/${SEMI}`)
}

/* La storia giocata davvero: discesa dopo discesa, rifacendo quella persa, con la spesa e il bottino che cade (i pezzi
   magici e rari, il raro e il pezzo col nome dei mostri grossi). La roba vera è più della tabella (la fortuna, i
   negozi): i livelli, la roba e le pozioni si sommano, e qui si guarda che la somma non faccia una passeggiata a chi
   va dritto. Chi gira tutto arriva in fondo alla storia tre livelli sopra: per lui la storia si fa comoda, ed è il
   premio di aver girato (come in Diablo); non deve però vincere quattro volte su cinque rispondendo male */
const quanto = (misure, j, k) => misure.reduce((n, m) => n + m.vinte[j][k], 0) / (misure.length * SEMI)
const TETTI = { minimo: [0.7, 0.9, 0.45], tutto: [0.7, 1, 0.8] }
for (const [come, nome] of [['minimo', 'chi va dritto'], ['tutto', 'chi gira tutto e spende']]) {
  const vere = EROI.map(e => misuraConLaRoba({ semi: SEMI, eroe: e.chiave, fila: come }))
  nota(`${nome}, la storia giocata davvero: livello ${CAMPAGNA.map((_, k) => (vere.reduce((n, m) => n + m.zaini[k].livello, 0) / vere.length).toFixed(1)).join(' · ')}`)
  for (const [j, bravura] of [[0, 8], [1, 6], [2, 4]])
    nota(`${nome}: a ${bravura}/10 ${CAMPAGNA.map((_, k) => cento(quanto(vere, j, k)).padStart(5)).join('')}`)
  for (const [k, t] of CAMPAGNA.entries()) {
    if (!k) continue
    const [otto, sei, quattro] = TETTI[come]
    controlla(`${t.chiave}, ${nome}: a 8/10 ci arriva quasi sempre`, quanto(vere, 0, k) >= otto, cento(quanto(vere, 0, k)))
    if (sei < 1) controlla(`${t.chiave}, ${nome}: a 6/10 non sempre`, quanto(vere, 1, k) <= sei, cento(quanto(vere, 1, k)))
    controlla(`${t.chiave}, ${nome}: a 4/10 non quasi sempre`, quanto(vere, 2, k) <= quattro, cento(quanto(vere, 2, k)))
  }
}
/* chi arriva con molte gemme da parte e compra il meglio che può, anche i pezzi avanti (a un prezzo più alto). Con 250
   gemme a 6/10 si passa quasi sempre: è il premio di averle messe da parte; a 4/10 resta difficile */
/* chi arriva con molte gemme da parte e compra il meglio che può, anche i pezzi avanti (a un prezzo più alto) */
const ultime = CAMPAGNA.length - 2
for (const gemme of [100, 250]) {
  const ricchi = EROI.map(e => misuraDiChiHaMessoDaParte({ eroe: e.chiave, semi: SEMI, gemme }))
  for (const [j, bravura] of [[0, 8], [1, 6], [2, 4]])
    nota(`con ${gemme} gemme da parte: a ${bravura}/10 ${CAMPAGNA.map((_, k) => cento(quanto(ricchi, j, k)).padStart(5)).join('')}`)
  for (const k of [ultime, ultime + 1]) {
    const t = CAMPAGNA[k].chiave
    controlla(`${t}: con ${gemme} gemme da parte, a 6/10 non è una passeggiata`, quanto(ricchi, 1, k) <= (gemme > 100 ? 0.95 : 0.9), cento(quanto(ricchi, 1, k)))
    controlla(`${t}: con ${gemme} gemme da parte, a 4/10 di rado`, quanto(ricchi, 2, k) <= 0.4, cento(quanto(ricchi, 2, k)))
  }
}

riassunto('la tabella della grande storia')
