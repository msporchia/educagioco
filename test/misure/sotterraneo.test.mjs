/* La tabella della grande storia sotto il banco (docs/sotterraneo/
   la-grande-storia.md e livelli.md). Ogni eroe ha una riga di roba
   attesa per ogni discesa (dati/storia.js, con i pezzi dei mostri grossi
   delle discese prima) e un livello atteso (LIVELLI_ATTESI, coi punti
   dati come li dà il banco), e i mostri di ogni discesa sono tarati su
   quella riga (`forza`, `spinta` in dati/campagna.js). Qui si gioca ogni
   discesa venti volte per eroe, andando dritti alla scala:

   - con la roba e il livello attesi, a otto risposte giuste su dieci si
     arriva in fondo quasi sempre, a sei circa metà delle volte (in media
     fra i quattro), a quattro quasi mai — tranne le prime due, che perdonano
     (la cripta tutto, la scalinata molto: il primo avvio, vedi sotto);
   - il primo avvio: la scalinata a mani nude (la roba di una discesa prima)
     a otto su dieci si vince almeno sette volte su dieci, e con le gemme con
     cui si esce dalla cripta c'è sempre un'arma da comprare (o l'ha già data
     il guardiano);
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
   Infine le zone che si potenziano, a ogni livello, e i colori del pallino.
   tempo: 500 */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { misuraLaStoria, misuraConLaRoba, misuraDiChiHaMessoDaParte, misuraLeZone } from '../../src/giochi/sotterraneo/motore/banco.js'
import { numeriAttesi, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { ROBA_VUOTA } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
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
    if (k) controlla(`${e.chiave}, ${t.chiave}: con la roba attesa a 4/10 quasi mai`, quattro <= SEMI * (k === 1 ? 0.45 : 0.3), `${quattro}/${SEMI}`)
    else controlla(`${e.chiave}, la prima perdona: a 4/10 si arriva in fondo spesso`, quattro >= SEMI * 0.6, `${quattro}/${SEMI}`)
  }
}

for (const [k, t] of CAMPAGNA.entries()) {
  if (!k) continue
  const sei = media(tutte, 0, 1, k)
  controlla(`${t.chiave}: a 6/10 con la roba attesa circa metà, fra i quattro eroi${k === 1 ? ' (la scalinata, molto di più: il primo avvio)' : ''}`,
            sei >= 0.3 && sei <= (k === 1 ? 1 : 0.8), cento(sei))
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

/* Il primo avvio (docs/sotterraneo/la-grande-storia.md, «Il primo avvio»): chi entra nella scalinata senza aver
   comprato niente (la roba di una discesa prima, cioè nulla) e risponde bene la maggior parte delle volte la vince;
   e con le gemme con cui si esce dalla cripta c'è sempre una prima arma da comprare, se il guardiano non l'ha data */
{
  const nuda = EROI.map((e, i) => ({ eroe: e.chiave, vinte: tutte[i].vinte[-1][0][1] }))
  const tutteNude = nuda.reduce((n, x) => n + x.vinte, 0) / (EROI.length * SEMI)
  nota(`la scalinata a mani nude a 8/10: ${nuda.map(x => `${x.eroe} ${x.vinte}/${SEMI}`).join(' · ')}`)
  controlla('scalinata a mani nude a 8/10: si vince almeno sette volte su dieci, fra i quattro eroi', tutteNude >= 0.7, cento(tutteNude))
  for (const x of nuda)
    controlla(`${x.eroe}: scalinata a mani nude a 8/10, almeno una volta su due`, x.vinte >= SEMI * 0.5, `${x.vinte}/${SEMI}`)
  /* le gemme con cui si esce dalla cripta (in media, andando dritti) bastano alla prima arma dell'armaiolo che a questo
     eroe serve. Il guardiano dell'ultima stanza la lascia anche per terra: qui si conta solo la spesa */
  EROI.forEach((e, i) => {
    const gemme = Math.floor(tutte[i].gemme[0])
    const b = new Bottega({ eroe: e.chiave, roba: { ...ROBA_VUOTA(), gemme }, finite: 1, crescita: crescitaAttesa(e.chiave, 1) })
    const armi = b.mercanzia('armaiolo').filter(r => r.avanti === 0 && ['mano', 'mancina'].includes(COSE[r.chiave].dove) && b.vaAddosso(r.chiave))
    const prezzo = armi.length ? Math.min(...armi.map(r => b.quantoCosta(r.chiave))) : Infinity
    controlla(`${e.chiave}: con le ${gemme} 💎 con cui si esce dalla cripta si compra la prima arma (${prezzo} 💎)`, prezzo <= gemme, `${prezzo} contro ${gemme}`)
  })
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

/* Le zone che si potenziano (docs/sotterraneo/zone.md): finita la storia ogni discesa si sveglia al livello dell'eroe.
   Chi ha il livello atteso (e la roba attesa a quel livello, motore/zone.js) a 8/10 arriva in fondo quasi sempre, a
   6/10 più o meno due volte su tre ma non sempre, a 4/10 di rado: come una discesa della storia, a ogni livello. E i
   colori del pallino si misurano qui: una zona del 16 con l'eroe due gradini sotto (rosso) non si passa rispondendo
   sei su dieci, uno sotto (arancio) a otto si può tentare, due sopra (grigio) è una passeggiata */
const SEMI_ZONE = 10
const nelleZone = (livello, eroeA = livello) => {
  const tutte = EROI.map(e => misuraLeZone({ eroe: e.chiave, livello, eroeA, semi: SEMI_ZONE }))
  return { tutte, quota: (j, k) => tutte.reduce((n, m) => n + m.vinte[j][k], 0) / (tutte.length * SEMI_ZONE) }
}
for (const L of [12, 16, 20]) {
  const { tutte, quota } = nelleZone(L)
  for (const [j, b] of [[0, 8], [1, 6], [2, 4]])
    nota(`zone al livello ${L}, a ${b}/10: ${CAMPAGNA.map((_, k) => cento(quota(j, k)).padStart(5)).join('')}`)
  nota(`  domande (a 8/10): ${CAMPAGNA.map((_, k) => Math.round(tutte.reduce((n, m) => n + m.domande[k], 0) / tutte.length)).join(' · ')}` +
       `, livelli presi: ${CAMPAGNA.map((_, k) => (tutte.reduce((n, m) => n + m.livelli[k], 0) / tutte.length).toFixed(1)).join(' · ')}`)
  for (const [k, t] of CAMPAGNA.entries()) {
    controlla(`zona ${t.chiave} al ${L}: a 8/10 si arriva in fondo quasi sempre`, quota(0, k) >= 0.85, cento(quota(0, k)))
    controlla(`zona ${t.chiave} al ${L}: a 6/10 si vince, ma non sempre`, quota(1, k) >= 0.4 && quota(1, k) <= 0.92, cento(quota(1, k)))
    controlla(`zona ${t.chiave} al ${L}: a 4/10 di rado`, quota(2, k) <= 0.4, cento(quota(2, k)))
  }
  const sei = CAMPAGNA.reduce((n, _, k) => n + quota(1, k), 0) / CAMPAGNA.length
  controlla(`zone al ${L}: a 6/10 in media fra metà e quattro volte su cinque`, sei >= 0.5 && sei <= 0.8, cento(sei))
}
{
  const media = (q, j) => CAMPAGNA.reduce((n, _, k) => n + q(j, k), 0) / CAMPAGNA.length
  const rosso = nelleZone(16, 12).quota, arancio = nelleZone(16, 14).quota, grigio = nelleZone(16, 20).quota
  nota(`una zona del 16: eroe del 12 (rosso) ${cento(media(rosso, 0))} · ${cento(media(rosso, 1))}, del 14 (arancio) ` +
       `${cento(media(arancio, 0))} · ${cento(media(arancio, 1))}, del 20 (grigio) ${cento(media(grigio, 1))} · ${cento(media(grigio, 2))} (a 8 · 6, a 6 · 4)`)
  controlla('rossa: a 6/10 non si passa', media(rosso, 1) <= 0.15, cento(media(rosso, 1)))
  controlla('rossa: e a 8/10 nemmeno sempre', media(rosso, 0) <= 0.8, cento(media(rosso, 0)))
  controlla('arancio: a 8/10 si può tentare', media(arancio, 0) >= 0.6, cento(media(arancio, 0)))
  controlla('arancio: ma a 6/10 è dura', media(arancio, 1) <= 0.5, cento(media(arancio, 1)))
  controlla('grigia: a 6/10 è una passeggiata', media(grigio, 1) >= 0.95, cento(media(grigio, 1)))
}

riassunto('la tabella della grande storia')
