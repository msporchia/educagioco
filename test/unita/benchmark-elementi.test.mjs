/* Chi pesa, un elemento alla volta (docs/core/vecchio-telefono-elementi.md): le scene di misura (tutto spento, uno acceso alla volta
   sopra la sua base, la scena intera e uno tolto alla volta, le leve), la TABELLA in ordine dal più caro col js e la gpu, la LETTURA
   coi cinque più cari, il collo (JS o GPU), la semplificazione e quanto tolgono le leve; il calore corretto. */
import { sceneDegliElementi, tappeDegliElementi, SCENE_ELEMENTI, SEMPLICE, LEVE } from '../../src/grafica/benchmark/veri/elementi-dati.js'
import { righeElementi, diChi } from '../../src/grafica/benchmark/log-elementi.js'
import { componiVeri, letturaVeri } from '../../src/grafica/benchmark/log-veri.js'
import { ELEMENTI_DISCESE } from '../../src/giochi/sotterraneo/scena3d/costanti.js'
import { ELEMENTI_FATTORIA } from '../../src/giochi/fattoria3d/scena3d/mondo3d.js'
import { ELEMENTI_ASTEROIDI } from '../../src/grafica/spazio3d/indice.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const { accendi, togli, leve } = sceneDegliElementi('sot')
const tutte = [...accendi, ...togli, ...leve]
uguale('gli id non si ripetono', new Set(tutte.map(s => s.id)).size, tutte.length)
const el = SCENE_ELEMENTI.sot.elementi
controlla('ogni elemento ha la sua scena da solo e tolto', el.every(k => accendi.some(s => s.el.k === k) && togli.some(s => s.el.k === k)))
controlla('ogni elemento ha la sua semplificazione', [...el, ...SCENE_ELEMENTI.sopra.elementi].every(k => SEMPLICE[k]))
controlla('ci sono tutti gli elementi delle discese', ELEMENTI_DISCESE.every(k => el.includes(k)))
controlla('i nomi della fattoria sono quelli del gioco', ELEMENTI_FATTORIA.every(k => SCENE_ELEMENTI.fat.elementi.includes(k)) && SCENE_ELEMENTI.fat.elementi.filter(k => !['ombra', 'nebbia'].includes(k)).join() === ELEMENTI_FATTORIA.join())
controlla('e degli asteroidi', SCENE_ELEMENTI.ast.elementi.filter(k => k !== 'post').join() === ELEMENTI_ASTEROIDI.join())
controlla('ogni elemento di ogni scena ha la sua semplificazione', Object.values(SCENE_ELEMENTI).every(d => d.elementi.every(k => SEMPLICE[k])), Object.values(SCENE_ELEMENTI).flatMap(d => d.elementi).filter(k => !SEMPLICE[k]).join())
uguale('gli asteroidi non hanno leve', sceneDegliElementi('ast').leve.length, 0)
const fuochi = accendi.find(s => s.el.k === 'fuochi'), rif = accendi.find(s => s.id === fuochi.el.rif)
controlla('una luce si misura sopra le pareti', rif && rif.accesi.includes('pavimento') && !rif.accesi.includes('fuochi') && fuochi.accesi.includes('pavimento'))
const torcia = accendi.find(s => s.el.k === 'torcia'), ombra = accendi.find(s => s.el.k === 'ombra')
controlla('la torcia è la base dell\'ombra', ombra.el.rif === torcia.id, `${ombra.el.rif} ${torcia.id}`)
uguale('il «tutto spento» non ha niente acceso', accendi[0].accesi.length, 0)
const tp = tappeDegliElementi(['sot'])
controlla('quattro tappe, tre gruppi, le leve con lo spegni', tp.length === 4 && new Set(tp.map(t => t.gruppo)).size === 3 && tp[3].opz.spegni.join() === LEVE.join())

// i risultati finti: un pavimento che costa alla GPU, i fuochi che costano solo nella scena intera, le figure al JS
const r = (s, ms, js, gpu, extra = {}) => ({ id: s.id, gruppo: 'elementi-sot', nome: s.nome, el: s.el, ms, p95: ms * 1.3, js, gpu, ch: 10, tri: 1000, fps: 30, ...extra })
const val = { zero: [10, 9, 1], [rif.id]: [20, 9.5, 10.5], [torcia.id]: [25, 9.6, 15.4] }
const ris = []
for (const s of accendi) {
  const v = val[s.el.modo === 'zero' ? 'zero' : s.id] || (s.el.k === 'pavimento' ? [22, 9.2, 12.8] : s.el.k === 'figure' ? [16, 15, 1] : s.el.k === 'fuochi' ? [21, 9.5, 11.5] : [10.5, 9.1, 1.4])
  ris.push(r(s, ...v, s.el.k === 'pavimento' ? { nuovi: 3 } : {}))
}
for (const s of togli) {
  const v = s.el.modo === 'tutto' ? [80, 30, 50] : s.el.k === 'fuochi' ? [62, 29, 33] : s.el.k === 'pavimento' ? [70, 29.5, 40.5] : s.el.k === 'figure' ? [74, 24, 50] : [79.5, 30, 49.5]
  ris.push(r(s, ...v))
}
ris.push(r(leve[0], 80, 30, 50), r(leve[1], 66, 29, 37))
const { righe, tutto, zero } = righeElementi(ris, 'sot')
uguale('il più caro per primo: i fuochi tolti', righe[0].k, 'fuochi')
uguale('i fuochi da soli, sopra le pareti', righe[0].solo.ms, 1)
uguale('e tolti dalla scena intera', righe[0].via.ms, 18)
controlla('il pavimento: da solo sul vuoto, con gli shader nuovi', righe.find(x => x.k === 'pavimento').solo.ms === 12 && righe.find(x => x.k === 'pavimento').sh === 3)
uguale('di chi è: la GPU', diChi(righe[0].via), 'GPU')
uguale('le figure: il JS', diChi(righe.find(x => x.k === 'figure').solo), 'JS')
controlla('il tutto e lo zero', tutto.ms === 80 && zero.ms === 10)

const lettura = letturaVeri({ risultati: ris }).join('\n')
controlla('la LETTURA nomina i cinque più cari', /CHI PESA nel Sotterraneo, lo scontro con 1 mostro e gli effetti: fuochi \(-18 tolto, \+1 da solo, GPU\), pavimento \(-10 tolto, \+12 da solo, GPU\), figure \(-6 tolto, \+6 da solo, JS\), torcia/.test(lettura), lettura)
controlla('il fondo del gioco', /Tutto spento 10 ms \(js 9: il giro del gioco senza disegnare\), la scena intera 80/.test(lettura), lettura)
controlla('gli incroci', /Da soli sommano [\d.]+ ms: il resto sta negli incroci/.test(lettura), lettura)
controlla('la semplificazione di ognuno', /SEMPLIFICARE \(sot\): fuochi → `fuochi:1` o 0/.test(lettura), lettura)
controlla('le leve', /LEVE \(sot, ombre rilievo nebbiaFitta quantaPolvere:0\.4\): com'è 80 ms \(p95 104\), semplificata 66 \(p95 85\.8\): tolgono 14 ms \(js -1 gpu -13\)/.test(lettura), lettura)
controlla('le scene degli elementi non entrano in «chi pesa di più»', !/Chi pesa di più: (scena intera|senza)/.test(lettura), lettura)

// il calore: un gruppo scaldato del 20% si divide
const caldi = ris.map(x => (x.el.modo === 'via' || x.el.modo === 'tutto' ? { ...x, deriva: 1.2, ms: x.ms * 1.2 } : x))
uguale('i ms tolto il calore', righeElementi(caldi.map(x => (x.deriva ? { ...x, ms: Math.round(x.ms / x.deriva * 10) / 10 } : x)), 'sot').tutto.ms, 80)
const testo = componiVeri({ risultati: caldi, info: {}, gruppi: {} })
controlla('la tabella nel resoconto, corretta', /\[elementi sot\][^\n]*\n  tutto spento 10 ms[^\n]*\n  scena intera 80 ms/.test(testo), testo.slice(0, 600))
controlla('una riga per elemento', /\n  fuochi: \+1 \(js \+0 gpu \+1\) da solo, \+0ch \+0kt \/ -18 tolto/.test(testo), testo.split('\n').find(x => x.includes('fuochi:')))
controlla('niente righe per scena degli elementi', !/el-sot/.test(testo.split('DATI')[0]))
riassunto('chi pesa, un elemento alla volta')
