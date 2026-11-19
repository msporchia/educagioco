/* LE POZIONI A SCUOLA

   La maestra sceglie le famiglie di misure e i gradini (la scheda: `valido`, `descrivi`, le sue liste uguali alla
   campagna); il gioco col `limite` gioca quelle tappe in giro e racconta ogni dose in testi da 40. Senza limite il giro
   non c'è: casa. Vedi docs/pozioni/scuola.md.
   `node test/esegui.mjs pozioni-scuola --niente-build` */
import { CAMPAGNA, ID_GRADINI } from '../../src/giochi/pozioni/dati/campagna.js'
import { FAMIGLIE } from '../../src/giochi/pozioni/dati/misure.js'
import { Bottega, caso, giocaBene } from '../../src/giochi/pozioni/motore/bottega.js'
import { tappeDelLimite, dopoNelGiro, risposteDellOrdine, corto, LUNGO } from '../../src/giochi/pozioni/motore/limite.js'
import scheda, { FAMIGLIE_POZIONI, GRADINI_POZIONI, quanteTappe } from '../../src/scuola/giochi/pozioni/scheda.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const { valido, descrivi } = scheda.tipo
const chiavi = l => l.map(i => CAMPAGNA[i].chiave)

console.log('\nSENZA LIMITE: CASA')
for (const [cosa, l] of [['null', null], ['niente', undefined], ['vuoto', {}], ['nessuna famiglia', { famiglie: [], gradini: ['banco'] }],
  ['nessun gradino', { famiglie: ['massa'], gradini: [] }], ['una famiglia che non c\'è', { famiglie: ['tempo'], gradini: ['banco'] }],
  ['una finale come gradino', { famiglie: ['massa'], gradini: ['maestro'] }], ['liste come stringhe', { famiglie: 'massa', gradini: 'banco' }]])
  controlla(`${cosa}: nessun giro`, tappeDelLimite(l) === null)

console.log('\nLA SCHEDA È LA CAMPAGNA')
stessaLista('i gradini, in ordine', GRADINI_POZIONI.map(g => g.chiave), ID_GRADINI)
stessaLista('le famiglie, in ordine', FAMIGLIE_POZIONI.map(f => f.chiave), FAMIGLIE.map(f => f.chiave))
for (const f of FAMIGLIE_POZIONI) for (const g of GRADINI_POZIONI)
  uguale(`${f.chiave} · ${g.chiave}: una tappa sola`, CAMPAGNA.filter(t => t.famiglie.length === 1 && t.famiglie[0] === f.chiave && t.gradino === g.chiave).length, 1)
controlla('ogni gradino ha un nome e una frase', GRADINI_POZIONI.every(g => g.nome && g.spiega))
controlla("l'icona della voce è quella del gioco", scheda.tipo.voce.icona === '⚗️')
uguale('la materia', scheda.tipo.materia, 'matematica')
controlla('è in 3D e pronta', scheda.tred === true && scheda.pronto !== false)

console.log('\nVALIDO, ANCHE CONTRO UN LINK MANOMESSO')
const base = scheda.tipo.voce.base
controlla('la base è valida', valido(base))
controlla('i pesi e i liquidi, due gradini', valido({ tipo: 'pozioni', famiglie: ['massa', 'capacita'], gradini: ['banco', 'virgola'] }))
controlla('tutto', valido({ tipo: 'pozioni', famiglie: FAMIGLIE_POZIONI.map(f => f.chiave), gradini: GRADINI_POZIONI.map(g => g.chiave) }))
controlla("in un altro ordine va bene lo stesso", valido({ tipo: 'pozioni', famiglie: ['capacita', 'massa'], gradini: ['inverse', 'banco'] }))
for (const [cosa, e] of [
  ['null', null], ['una lista', []], ['una stringa', 'pozioni'], ['un numero', 3],
  ['un altro tipo', { ...base, tipo: 'passo' }],
  ['una chiave in più', { ...base, tappe: [0] }],
  ['il campo gioco (lo toglie il catalogo prima)', { ...base, gioco: 'pozioni' }],
  ['senza famiglie', { tipo: 'pozioni', gradini: ['banco'] }],
  ['famiglie vuote', { ...base, famiglie: [] }],
  ['famiglie doppie', { ...base, famiglie: ['massa', 'massa'] }],
  ['una famiglia che non c\'è', { ...base, famiglie: ['tempo'] }],
  ['una famiglia dal prototipo', { ...base, famiglie: ['toString'] }],
  ['una famiglia non stringa', { ...base, famiglie: [1] }],
  ['famiglie come stringa', { ...base, famiglie: 'massa' }],
  ['senza gradini', { tipo: 'pozioni', famiglie: ['massa'] }],
  ['gradini vuoti', { ...base, gradini: [] }],
  ['gradini doppi', { ...base, gradini: ['banco', 'banco'] }],
  ['un gradino che non c\'è', { ...base, gradini: ['lava'] }],
  ['una finale come gradino', { ...base, gradini: ['calderone'] }],
  ['un gradino non stringa', { ...base, gradini: [{}] }],
]) controlla(`no: ${cosa}`, valido(e) === false)

console.log('\nDESCRIVI')
uguale('la base', descrivi(base), 'Le pozioni · i pesi · il banco, l\'unità grande e più unità grandi · 3 tappe')
uguale('due e due', descrivi({ tipo: 'pozioni', famiglie: ['capacita', 'massa'], gradini: ['virgola', 'banco'] }),
  'Le pozioni · i pesi e i liquidi · il banco e grande e piccola · 4 tappe')
uguale('tutto', descrivi({ tipo: 'pozioni', famiglie: FAMIGLIE_POZIONI.map(f => f.chiave), gradini: GRADINI_POZIONI.map(g => g.chiave) }),
  'Le pozioni · pesi, lunghezze e liquidi · tutti i gradini · 27 tappe')
uguale('una tappa', descrivi({ tipo: 'pozioni', famiglie: ['lunghezza'], gradini: ['miste'] }), 'Le pozioni · le lunghezze · tre unità · 1 tappa')
uguale('uno storto', descrivi({ tipo: 'pozioni' }), 'Esercizio non valido')

console.log('\nIL GIRO')
const quattro = tappeDelLimite({ famiglie: ['capacita', 'massa'], gradini: ['virgola', 'banco'] })
stessaLista("nell'ordine della campagna", chiavi(quattro), ['massa-banco', 'massa-virgola', 'capacita-banco', 'capacita-virgola'])
uguale('dopo la prima, la seconda', CAMPAGNA[dopoNelGiro(quattro, quattro[0])].chiave, 'massa-virgola')
uguale("dopo l'ultima si ricomincia", dopoNelGiro(quattro, quattro.at(-1)), quattro[0])
const una = tappeDelLimite({ famiglie: ['lunghezza'], gradini: ['miste'] })
uguale('una tappa sola torna su se stessa', dopoNelGiro(una, una[0]), una[0])
const tutte = tappeDelLimite({ famiglie: FAMIGLIE.map(f => f.chiave), gradini: ID_GRADINI })
uguale('tutto: le ventisette tappe, senza le finali', tutte.length, 27)
controlla('le finali no', !chiavi(tutte).some(k => k === 'calderone' || k === 'maestro'))
for (const e of [base, { tipo: 'pozioni', famiglie: ['capacita', 'lunghezza'], gradini: ['media', 'inverse', 'grande'] }])
  uguale(`${descrivi(e)}: quante tappe`, tappeDelLimite(e).length, quanteTappe(e))

console.log('\nOGNI DOSE È UNA RISPOSTA')
const forma = r => typeof r.chiave === 'string' && /^pozioni:[a-z]+(-[a-z]+)?$/.test(r.chiave) && r.chiave.length <= LUNGO &&
  ['fatto', 'data', 'attesa'].every(c => typeof r[c] === 'string' && r[c].length > 0 && r[c].length <= LUNGO) &&
  typeof r.giusta === 'boolean' && typeof r.ultima === 'boolean' && Number.isInteger(r.ms) && r.ms >= 0
let storte = [], senzaChiusura = [], doppie = []
for (const i of tutte) for (let seme = 1; seme <= 12; seme++) {
  // chi ordina il minimo: ogni ingrediente chiude una volta, giusto
  const b = new Bottega(CAMPAGNA[i], { rnd: caso(seme * 31 + i) })
  const voci = b.ingredienti.flatMap((g, j) => g.ottimo.pezzi.map(k => ({ i: j, k })))
  const comprate = [], dette = []
  for (let n = 0; n < voci.length; n += b.quanteInOrdine) dette.push(...risposteDellOrdine(b, b.ordina(voci.slice(n, n + b.quanteInOrdine)).esiti, comprate, 1234.4))
  storte.push(...dette.filter(r => !forma(r)))
  if (!b.pronta || dette.length !== b.ingredienti.length) senzaChiusura.push(`${CAMPAGNA[i].chiave}/${seme}`)
  if (!dette.every(r => r.giusta && r.ultima)) doppie.push(`${CAMPAGNA[i].chiave}/${seme}`)
  // e la pozione si finisce come sempre
  giocaBene(b)
}
controlla('forma e testi entro i 40, in ogni tappa', !storte.length, JSON.stringify(storte.slice(0, 3)))
controlla('chi fa il minimo chiude ogni ingrediente una volta', !senzaChiusura.length, senzaChiusura.slice(0, 5).join(' '))
controlla('… e sono tutte giuste e chiuse', !doppie.length, doppie.slice(0, 5).join(' '))

// un trabocco: due volte un'ampolla che da sola ci sta, ma due no
const t = CAMPAGNA.findIndex(x => x.chiave === 'massa-grandi')
let b, g, k, j = -1
for (let seme = 1; seme <= 500 && j < 0; seme++) {
  b = new Bottega(CAMPAGNA[t], { rnd: caso(seme) })
  j = b.ingredienti.findIndex(x => x.offerte.some(o => o.base < x.dose && o.base * 2 > x.dose))
}
controlla("c'è un'ampolla che due volte trabocca", j >= 0)
g = b.ingredienti[j]
k = g.offerte.findIndex(o => o.base < g.dose && o.base * 2 > g.dose)
const comprate = []
const prima = b.ordina([{ i: j, k }])
const r1 = risposteDellOrdine(b, prima.esiti, comprate, 2000)
uguale("un'ampolla che ci sta e non finisce: niente da dire", r1.length, 0)
const r2 = risposteDellOrdine(b, (b.pulisci(), b.ordina([{ i: j, k }])).esiti, comprate, 3000)
uguale('il trabocco è una risposta', r2.length, 1)
const tr = r2[0]
controlla('sbagliata, con la domanda aperta', tr.giusta === false && tr.ultima === false)
controlla('dice su cosa è caduta', tr.data.includes(' su ') && forma(tr), tr.data)
controlla('e quanto ne mancava', /^ne mancavano \d+ (g|kg)$/.test(tr.attesa), tr.attesa)
uguale('la chiave è la conversione dell\'ampolla', tr.chiave, g.offerte[k].unita === g.unita ? `pozioni:${g.unita}` : `pozioni:${g.offerte[k].unita}-${g.unita}`)
uguale('ms tondi', tr.ms, 3000)
// poi la si finisce col minimo di quello che manca
b.pulisci()
const manca = g.dose - g.messo
const piccole = g.offerte.map((o, j) => ({ o, j })).filter(x => manca % x.o.base === 0 && x.o.base <= manca).sort((a, c) => c.o.base - a.o.base)[0]
const voci = Array.from({ length: manca / piccole.o.base }, () => ({ i: j, k: piccole.j }))
const fine = []
for (let n = 0; n < voci.length; n += b.quanteInOrdine) fine.push(...risposteDellOrdine(b, b.ordina(voci.slice(n, n + b.quanteInOrdine)).esiti, comprate, 4000))
uguale('dopo un trabocco la dose finita chiude lo stesso', fine.length, 1)
controlla('giusta e chiusa', fine[0].giusta && fine[0].ultima)
controlla('data: le ampolle entrate, il trabocco no', fine[0].data.startsWith(`${comprate[j][0]} + `) && comprate[j].length === 1 + voci.length, fine[0].data)

console.log('\nCORTO')
uguale('sotto i 40 resta', corto('500 g di polvere di luna'), '500 g di polvere di luna')
const lungo = corto('1 kg + 500 g + 200 g + 200 g + 100 g + 100 g + 50 g')
controlla('sopra si taglia a una parola, coi puntini', lungo.length <= LUNGO && lungo.endsWith('…') && !lungo.includes('+…'), lungo)

riassunto('Le pozioni a scuola')
