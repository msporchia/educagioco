/* I laghi naturali della fascia di mezzo della fattoria 3D (a da 0 a 7), senza browser: quanta acqua c'è (la terra giocabile), che forme e che
   taglie hanno, che non toccano mai il quadrato storico né tra loro, che la terra resta tutta d'un pezzo e nessun lotto resta isolato, che si
   attraversano coi ponti, che il generatore è puro; e i salvataggi di prima (pozzanghere `geo: 1`, niente `geo`) che non perdono né pezzi né acqua.
   Vedi docs/fattoria3d/laghi.md. `node test/esegui.mjs fattoria3d-laghi`
   tempo: 1 */
import { generaLotto } from '../../src/giochi/fattoria3d/dati/lotti.js'
import { biomaDi, biomaV1, eLagoDolce, acquaDelLotto, moloDelLotto, lottoDiversoDa, P_LAGO_DOLCE, guastiDeiBiomi } from '../../src/giochi/fattoria3d/dati/biomi.js'
import { lotto, lottoPerId, chiave, eStorico, LOTTI_INIZIALI } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { statoIniziale, normalizza } from '../../src/giochi/fattoria3d/motore/stato.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const A0 = 0, A1 = 7, B0 = -60, B1 = 60                     // la fascia: lotti a da 0 a 7, b da −60 a 59
const I0 = -14 + 4 * A0, I1 = -14 + 4 * (A1 + 1) - 1        // le celle della fascia (i)
const j0 = -12 + 4 * B0, j1 = -12 + 4 * B1 - 1
const acq = (i, j) => eLagoDolce(i, j)
const storica = (i, j) => eStorico({ ...lotto(Math.floor((i + 14) / 4), Math.floor((j + 12) / 4)) })

function mondo({ stato, liv = 18 } = {}) {
  const s = stato || statoIniziale(), b = { monete: 1e7 }
  s.esperienza = Math.max(s.esperienza || 0, sogliaDi(liv))
  const f = new Fattoria3d({ stato: s, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
  return { f, b }
}
const senzaOstacoli = f => { for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o) }
const senzaAlberi = f => { for (const a of f.alberi) if (!a.tagliato) { a.tagliato = true; f.tagliati.add(a.n); f.s.tagliati.push(a.n); f.bloccoFisso.delete(chiave(a.i, a.j)) } }

/* ══════════ 1. quanta acqua, di che taglie, di che forme ══════════ */
const celle = []                                              // tutte le celle della fascia fuori dal rettangolo storico
for (let j = j0; j <= j1; j++) for (let i = I0; i <= I1; i++) if (!storica(i, j)) celle.push([i, j])
let nAcqua = 0
for (const [i, j] of celle) if (acq(i, j)) nAcqua++
const pAcqua = 100 * nAcqua / celle.length
nota(`acqua dolce naturale nella fascia: ${pAcqua.toFixed(1)}% delle celle (le pozzanghere di prima: ~5,6%)`)
controlla('la terra giocabile resta abbondante: l\'acqua naturale sta fra il 9% e il 15% della fascia', pAcqua >= 9 && pAcqua <= 15, pAcqua.toFixed(1))
controlla('P_LAGO_DOLCE è un numero sensato', P_LAGO_DOLCE > 0.3 && P_LAGO_DOLCE < 0.8)
controlla('nessuna cella d\'acqua dentro il rettangolo storico né a meno di un lotto dal quadrato di partenza', celle.every(([i, j]) => !acq(i, j) || Math.max(Math.abs(Math.floor((i + 14) / 4) - 3), Math.abs(Math.floor((j + 12) / 4) - 3)) >= 3))
controlla('fuori dalla fascia (a < 0, a > 7) la funzione dei laghi dolci non dà acqua', (() => { for (let j = -80; j < 80; j += 3) for (let i = -60; i < I0; i++) if (acq(i, j)) return false; for (let j = -80; j < 80; j += 3) for (let i = I1 + 1; i < I1 + 40; i++) if (acq(i, j)) return false; return true })())

// i laghi come pezzi d'acqua connessi (4 direzioni)
const visto = new Set(), laghi = []
for (const [i, j] of celle) {
  if (!acq(i, j) || visto.has(chiave(i, j))) continue
  const pila = [[i, j]], c = []
  visto.add(chiave(i, j))
  while (pila.length) {
    const [x, y] = pila.pop(); c.push([x, y])
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = chiave(x + dx, y + dy); if (acq(x + dx, y + dy) && !visto.has(k)) { visto.add(k); pila.push([x + dx, y + dy]) } }
  }
  laghi.push(c)
}
const taglie = laghi.map(c => c.length).sort((a, b) => a - b)
nota(`${laghi.length} laghi: ${taglie[0]} … ${taglie[taglie.length - 1]} celle (mediana ${taglie[taglie.length >> 1]})`)
controlla('nessuna pozzanghera: ogni lago ha almeno 12 celle', taglie[0] >= 12, taglie[0])
controlla('le taglie sono varie: piccoli (< 30), medi e grandi (> 60)', taglie.some(n => n < 30) && taglie.some(n => n >= 30 && n <= 60) && taglie.some(n => n > 60))
const larghezze = laghi.map(c => { const xs = c.map(p => p[0]), ys = c.map(p => p[1]); return [Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1, c.length] })
controlla('non sono rettangoli: il riempimento del riquadro che li contiene è sempre sotto il 90%', larghezze.every(([w, h, n]) => n / (w * h) < 0.9), larghezze.filter(([w, h, n]) => n / (w * h) >= 0.9).join(' | '))
controlla('e non sono tutti uguali: due laghi grandi hanno forme diverse', (() => { const g = laghi.filter(c => c.length > 60).slice(0, 8).map(c => { const x0 = Math.min(...c.map(p => p[0])), y0 = Math.min(...c.map(p => p[1])); return c.map(([x, y]) => `${x - x0},${y - y0}`).sort().join(';') }); return new Set(g).size === g.length })())
const lottiLago = new Map()                                  // quanti lotti tocca ogni lago
for (const c of laghi) lottiLago.set(c, new Set(c.map(([i, j]) => `${Math.floor((i + 14) / 4)}_${Math.floor((j + 12) / 4)}`)).size)
nota(`lotti toccati da un lago: da ${Math.min(...lottiLago.values())} a ${Math.max(...lottiLago.values())}`)
controlla('i laghi medi e grandi si estendono su più lotti vicini (fino a 6 o più)', Math.max(...lottiLago.values()) >= 6 && laghi.filter(c => lottiLago.get(c) >= 3).length > laghi.length / 3)

// la terra è tutta d'un pezzo: fra due laghi c'è sempre terra, e tutta la terra della fascia (isolotti a parte) si cammina senza ponti
const terra = new Set()
for (const [i, j] of celle) if (!acq(i, j)) terra.add(chiave(i, j))
const comp = []
{
  const v = new Set()
  for (const [i, j] of celle) {
    const k = chiave(i, j)
    if (!terra.has(k) || v.has(k)) continue
    const pila = [[i, j]]; let n = 0; v.add(k)
    while (pila.length) { const [x, y] = pila.pop(); n++; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = chiave(x + dx, y + dy); if (terra.has(q) && !v.has(q)) { v.add(q); pila.push([x + dx, y + dy]) } } }
    comp.push(n)
  }
}
comp.sort((a, b) => b - a)
nota(`terra: ${comp[0]} celle in un pezzo solo, ${comp.length - 1} isolotti (${comp.slice(1).join(' ')})`)
controlla('la terra della fascia è un pezzo solo, più gli isolotti in mezzo ai laghi (al più 8 celle ciascuno)', comp.slice(1).every(n => n <= 8) && comp[0] > 0.98 * (celle.length - nAcqua - comp.slice(1).reduce((a, b) => a + b, 0)))

/* ══════════ 2. i lotti: bioma, molo, nessun lotto isolato ══════════ */
const lotti = []
for (let b = B0; b < B1; b++) for (let a = A0; a <= A1; a++) if (!eStorico(lotto(a, b))) lotti.push(lotto(a, b))
const conAcqua = lotti.filter(l => acquaDelLotto(l).length > 0), pieni = lotti.filter(l => acquaDelLotto(l).length === 16)
nota(`lotti con acqua: ${(100 * conAcqua.length / lotti.length).toFixed(0)}%, tutti d'acqua: ${(100 * pieni.length / lotti.length).toFixed(1)}%`)
controlla('i lotti tutti d\'acqua sono pochi (meno del 6%)', pieni.length / lotti.length < 0.06)
controlla('un lotto è «laghetto» da tre celle d\'acqua in su, e sotto non lo è', lotti.every(l => (acquaDelLotto(l).length >= 3) === (biomaDi(l.a, l.b) === 'laghetto')))
controlla('il generatore dà l\'acqua e il molo di biomi.js, e il molo sta su una riva di terra', conAcqua.every(l => {
  const g = generaLotto(l.a, l.b), ac = acquaDelLotto(l), set = new Set(ac.map(([i, j]) => chiave(i, j)))
  if (JSON.stringify(g.acqua) !== JSON.stringify(ac)) return false
  if (ac.length === 16) return g.molo === null
  const m = g.molo
  return !!m && !set.has(chiave(m.i, m.j)) && set.has(chiave(m.i + m.verso[0], m.j + m.verso[1])) && lotto(Math.floor((m.i + 14) / 4), Math.floor((m.j + 12) / 4)).id === l.id
}))
controlla('niente alberi né sassi sull\'acqua, né sul posto del molo', conAcqua.every(l => { const g = generaLotto(l.a, l.b), ac = new Set(g.acqua.map(([i, j]) => chiave(i, j))); return g.alberi.every(o => !ac.has(chiave(o.i, o.j))) && g.ostacoli.every(o => !ac.has(chiave(o.i, o.j))) }))
controlla('è puro: stesso lotto, stesso risultato, in qualunque ordine', (() => { const v = lotti.slice(0, 200).map(l => JSON.stringify(generaLotto(l.a, l.b))); const w = lotti.slice(0, 200).reverse().map(l => JSON.stringify(generaLotto(l.a, l.b))).reverse(); return v.every((x, n) => x === w[n]) })())
controlla('i controlli interni dei biomi tornano', guastiDeiBiomi().length === 0, guastiDeiBiomi().join(' · '))

// nessun lotto isolato: un lotto si compra sempre (confina con un altro) e dall'acqua si arriva a terra con una catena di ponti (ognuno da tre celle, il primo
// da una riva). Quindi: ogni cella d'acqua ha terra a meno di 7 passi, ogni lotto non tutto d'acqua ha terra, e quasi tutti si lasciano a piedi (un lotto
// con solo un isolotto in mezzo al lago si raggiunge col ponte: è il fascino dei laghi grandi, e sono pochi)
const dist = new Map(), coda = []
for (const [i, j] of celle) if (!acq(i, j)) { dist.set(chiave(i, j), 0); coda.push([i, j]) }
for (let n = 0; n < coda.length; n++) {
  const [x, y] = coda[n], d = dist.get(chiave(x, y))
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = chiave(x + dx, y + dy); if (acq(x + dx, y + dy) && !dist.has(k)) { dist.set(k, d + 1); coda.push([x + dx, y + dy]) } }
}
const lontano = Math.max(...[...dist.values()])
nota(`la cella d'acqua più lontana dalla terra: ${lontano} passi`)
controlla('da ogni cella d\'acqua si arriva a terra in 7 passi o meno (una catena di ponti basta)', lontano <= 7, lontano)
const senzaTerra = lotti.filter(l => acquaDelLotto(l).length === 16).length
const lottiNonPieni = lotti.filter(l => acquaDelLotto(l).length < 16)
const aPiedi = lottiNonPieni.filter(l => { for (let k = 0; k < 4; k++) for (const [ai, aj, bi, bj] of [[l.i, l.j + k, l.i - 1, l.j + k], [l.i + 3, l.j + k, l.i + 4, l.j + k], [l.i + k, l.j, l.i + k, l.j - 1], [l.i + k, l.j + 3, l.i + k, l.j + 4]]) if (!acq(ai, aj) && !acq(bi, bj)) return true; return false })
const proporzione = aPiedi.length / lottiNonPieni.length
nota(`lotti non tutti d'acqua che si lasciano a piedi: ${(100 * proporzione).toFixed(1)}% (${senzaTerra} tutti d'acqua)`)
controlla('quasi tutti i lotti con un po\' di terra si lasciano a piedi (almeno il 99,5%)', proporzione >= 0.995, proporzione)
controlla('i lotti con acqua sono comprabili: confinano con altri e si comprano come ogni lotto', (() => {
  const { f } = mondo()
  const l = conAcqua.find(x => x.a === 2 && x.b < -3 && x.b > -12) || conAcqua.find(x => x.b < -3)
  for (let b = 1; b >= l.b; b--) { const r = f.compraLotto(`2_${b}`); if (!r.ok && r.motivo !== 'gia-tuo') return false }
  return f.posseduto(lotto(2, l.b)) || (f.compraLotto(l.id).ok && f.posseduto(l))
})())

/* ══════════ 3. si attraversano coi ponti ══════════ */
{
  // il lago più largo su una riga: ponti a catena da una riva all'altra
  let miglior = null
  for (const c of laghi) {
    const righe = new Map(); for (const [i, j] of c) { if (!righe.has(j)) righe.set(j, []); righe.get(j).push(i) }
    for (const [j, xs] of righe) { xs.sort((a, b) => a - b); if (xs.length === xs[xs.length - 1] - xs[0] + 1 && (!miglior || xs.length > miglior.n)) miglior = { j, a: xs[0], z: xs[xs.length - 1], n: xs.length } }
  }
  nota(`la traversata più lunga: ${miglior.n} celle d'acqua sulla riga ${miglior.j}`)
  const s = statoIniziale()
  for (let b = Math.floor((miglior.j + 12) / 4) - 1; b <= Math.floor((miglior.j + 12) / 4) + 1; b++) for (let a = 0; a <= 7; a++) if (!eStorico(lotto(a, b))) s.lotti[`${a}_${b}`] = true
  const { f } = mondo({ stato: s })
  senzaOstacoli(f); senzaAlberi(f)
  controlla('la riva sta sulla stessa riga, a terra', !f.acqua(miglior.a - 1, miglior.j) && !f.acqua(miglior.z + 1, miglior.j))
  controlla('l\'acqua blocca il passo e il costruire', f.blocca(miglior.a, miglior.j) && !f.libera(miglior.a, miglior.j) && f.puoMettere('aiuola', miglior.a, miglior.j).motivo === 'acqua')
  uguale('un ponte tutto sull\'acqua senza appoggio non regge', f.puoMettere('ponte', miglior.a + 3, miglior.j).motivo ?? (miglior.n < 6 ? 'acqua' : undefined), 'acqua')
  f.compraPezzo('ponte'); f.compraPezzo('ponte'); f.compraPezzo('ponte'); f.compraPezzo('ponte'); f.compraPezzo('ponte'); f.compraPezzo('ponte'); f.compraPezzo('ponte'); f.compraPezzo('ponte')
  let ok = true, x = miglior.a - 1
  for (let n = 0; n < 8 && x <= miglior.z; n++) { const r = f.mettiPezzo('ponte', x, miglior.j); if (!r.ok) { ok = false; nota('ponte rifiutato a', x, miglior.j, r.motivo); break } x += 3 }
  controlla(`una catena di ponti attraversa il lago di ${miglior.n} celle da una riva all'altra`, ok && x > miglior.z)
  const da = [miglior.a - 1, miglior.j], a = [miglior.z + 1, miglior.j]
  const p = f.percorsoVerso(da, [a])
  controlla('e ci si cammina sopra: il percorso c\'è, e passa sull\'acqua solo sui ponti', !!p && p.every(([i, j]) => !f.acqua(i, j) || !!f.cosaSu(i, j)))
}

/* ══════════ 4. i salvataggi di prima non perdono niente ══════════ */
{
  // un lotto della fascia che oggi ha un lago molto diverso dalla pozzanghera di prima (geo 1)
  const diversi = lotti.filter(l => lottoDiversoDa(l, 1) && !acquaDelLotto(l, 1).length && acquaDelLotto(l).length >= 8)
  controlla('esistono lotti dove la pozzanghera di prima era terra e oggi c\'è un lago', diversi.length > 5)
  const l = diversi.find(x => x.b < -3 && x.a >= 1 && x.a <= 6)
  const celleLago = acquaDelLotto(l)
  const [ci, cj] = celleLago[0]
  // lo stato di prima: il lotto comprato, e sopra una campo, un'aiuola e una strada dove oggi c'è l'acqua
  const s = statoIniziale(); s.geo = 1
  const primo = { id: 1, tipo: 'aiuola', i: ci, j: cj }
  s.cose = [primo]
  for (const id of ['2_1', '2_0', '2_-1', `${l.a}_${l.b}`]) s.lotti[id] = true
  const n = normalizza(JSON.parse(JSON.stringify(s)))
  uguale('uno stato geo 1 si legge come geo 2', n.geo, 2)
  controlla('il lotto comprato dove oggi c\'è un lago resta com\'era: è in `vecchi1`', n.vecchi1.includes(l.id) && !n.vecchi.includes(l.id), JSON.stringify([n.vecchi, n.vecchi1]))
  controlla('il pezzo piazzato su quella cella non si perde', n.cose.length === 1 && n.cose[0].i === ci && n.cose[0].j === cj)
  const { f } = mondo({ stato: n })
  controlla('la cella è terra come allora (niente acqua, il pezzo c\'è)', !f.acqua(ci, cj) && f.cosaSu(ci, cj)?.tipo === 'aiuola')
  controlla('il lotto vecchio è come la generazione 1 (bioma, acqua)', f.biomaDi(l) === biomaV1(l.a, l.b) && JSON.stringify(f.lottiAperti.get(l.k).dati.acqua) === JSON.stringify(acquaDelLotto(l, 1)))
  const vicino = lotto(l.a + 1, l.b)
  controlla('i lotti non comprati intorno hanno il lago nuovo', f.acqua(...(acquaDelLotto(vicino)[0] || [9999, 9999])) === (acquaDelLotto(vicino).length > 0))
  // salvato e riletto: le liste restano, e un lotto comprato dopo è di oggi
  const salvato = f.serializza()
  const g = new Fattoria3d({ stato: normalizza(salvato), borsa: f.borsa, ora: () => 1_000_000 })
  controlla('salvato e riletto: `vecchi1` resta, lo stato è geo 2', g.vecchi1.has(l.id) && salvato.geo === 2 && salvato.vecchi1.includes(l.id) && !!g.cosaSu(ci, cj))
  const nuovo = lotto(l.a, l.b - 1), prima = acquaDelLotto(nuovo).length
  f.s.esperienza = 1e9
  f.compraLotto(nuovo.id)
  controlla('un lotto comprato dopo è di oggi: non è fra i vecchi e ha l\'acqua nuova', !f.vecchi1.has(nuovo.id) && !f.vecchi.has(nuovo.id) && JSON.stringify(f.lottiAperti.get(nuovo.k).dati.acqua) === JSON.stringify(acquaDelLotto(nuovo)) && acquaDelLotto(nuovo).length === prima)
}
{
  // un lotto che era già una pozzanghera (geo 1) e oggi è un lago: la pozzanghera resta, con la passerella sopra
  const l = lotto(2, -1)
  const s = statoIniziale(); s.geo = 1
  for (const id of ['2_1', '2_0', '2_-1']) s.lotti[id] = true
  const pozz = acquaDelLotto(l, 1)
  s.cose = [{ id: 1, tipo: 'passerella', i: pozz[0][0], j: pozz[0][1] - 1 }]
  const { f } = mondo({ stato: s })
  controlla('una pozzanghera di prima resta la pozzanghera di prima (stesse celle d\'acqua)', pozz.every(([i, j]) => f.acqua(i, j)) && acquaDelLotto(l, 1).length === f.lottiAperti.get(l.k).dati.acqua.length)
  controlla('e la passerella che c\'era resta dov\'era', !!f.cosaSu(pozz[0][0], pozz[0][1] - 1))
  // lo stato senza `geo` (prima del mare e dei laghi): i lotti comprati restano a generazione 0
  const v = statoIniziale(); delete v.geo; delete v.vecchi; delete v.vecchi1
  for (const id of ['2_1', '2_0', '2_-1', '0_-5', '3_-6']) v.lotti[id] = true
  const n = normalizza(v)
  const diversi0 = ['2_-1', '0_-5', '3_-6'].filter(id => { const x = lottoPerId(id); return lottoDiversoDa(x, 0) })
  controlla('uno stato senza `geo`: i lotti che oggi sarebbero diversi stanno in `vecchi`, nessuno in `vecchi1`', diversi0.every(id => n.vecchi.includes(id)) && n.vecchi1.length === 0 && n.geo === 2, JSON.stringify([n.vecchi, diversi0]))
  const { f: f0 } = mondo({ stato: n })
  controlla('e sono la generazione 0 (alberi e sassi di prima)', n.vecchi.every(id => { const x = lottoPerId(id); return JSON.stringify(f0.lottiAperti.get(x.k).dati.alberi.map(a => a.n)) === JSON.stringify(generaLotto(x.a, x.b, { vecchio: true }).alberi.map(a => a.n)) }))
  controlla('uno stato rotto non lancia', (() => { try { normalizza({ geo: 2, vecchi: 5, vecchi1: 'x' }); normalizza({ geo: 2, vecchi1: [3, null, 'zz', '5_5'] }); normalizza({ geo: 1, vecchi: [{}] }); return true } catch (e) { return false } })())
  controlla('geo 2 con `vecchi1` di un lotto non comprato: scartato', normalizza({ geo: 2, vecchi1: ['5_-8'] }).vecchi1.length === 0)
}

riassunto('Fattoria 3D — i laghi naturali della fascia di mezzo')
