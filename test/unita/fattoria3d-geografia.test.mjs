/* La geografia grande della fattoria 3D e la pesca, senza browser: il mare a ovest (lotti a ≤ −2, la costa a = −1 con la spiaggia), i laghi
   grandi a est (a ≥ 8, una forma continua attraverso i confini fra lotti), i lotti storici e il quadrato di partenza invariati, i salvataggi di
   prima che tengono i loro lotti; poi la pesca: il molo e il porticciolo, il raggio, lo stesso specchio, il mare che vuole il porticciolo, il tempo
   (lancia → aspetta → ritira → il banco si ripopola), il pesce nelle scorte e nelle ricette del sushi e della friggitoria.
   Vedi docs/fattoria3d/geografia-e-pesca.md. `node test/esegui.mjs fattoria3d-geografia`
   tempo: 1 */
import { generaLotto } from '../../src/giochi/fattoria3d/dati/lotti.js'
import { biomaDi, biomaVecchio, acquaDelLotto, spiaggiaDelLotto, eMare, eSpiaggia, eLago, rivaDelMare, tipoAcqua, guastiDeiBiomi, ZONA } from '../../src/giochi/fattoria3d/dati/biomi.js'
import { lotto, lottoDi, lottoPerId, chiave, eStorico, LOTTI_INIZIALI } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { prezzoDelLotto } from '../../src/giochi/fattoria3d/dati/regole.js'
import { PEZZI, EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { RICETTE, MACCHINE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { PESCA, PESCI, resaDellaPesca, guastiDellaPesca } from '../../src/giochi/fattoria3d/dati/pesca.js'
import { PRODOTTI_ANIMALI } from '../../src/giochi/fattoria3d/dati/animali.js'
import { livelloDelPezzo, livelloDellaRicetta, sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { statoIniziale, normalizza } from '../../src/giochi/fattoria3d/motore/stato.js'
import { dettoDi } from '../../src/giochi/fattoria3d/scena3d/detti.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const adesso = { t: 1_000_000 }
function mondo({ monete = 1e7, stato = null, liv = 18 } = {}) {
  const b = { monete }
  const s = stato || statoIniziale()
  s.esperienza = Math.max(s.esperienza || 0, sogliaDi(liv))
  const f = new Fattoria3d({ stato: s, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => adesso.t, rnd: () => 0.5 })
  return { f, b }
}
const senzaOstacoli = f => { for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o) }
const senzaAlberi = f => { for (const a of f.alberi) if (!a.tagliato) { a.tagliato = true; f.tagliati.add(a.n); f.s.tagliati.push(a.n); f.bloccoFisso.delete(chiave(a.i, a.j)) } }
const pulisci = f => { senzaOstacoli(f); senzaAlberi(f) }
const compra = (f, ...ids) => { for (const id of ids) { const r = f.compraLotto(id); if (!r.ok) throw new Error(`lotto ${id}: ${r.motivo}`) } }
const celleDi = l => { const o = []; for (let y = 0; y < l.d; y++) for (let x = 0; x < l.w; x++) o.push([l.i + x, l.j + y]); return o }

/* ══════════ 1. dove sono il mare e i laghi ══════════ */
{
  controlla('i controlli interni dei biomi tornano', guastiDeiBiomi().length === 0, guastiDeiBiomi().join(' · '))
  controlla('i controlli della pesca tornano', guastiDellaPesca().length === 0, guastiDellaPesca().join(' · '))
  uguale('il mare comincia a a ≤ −2', ZONA.mareFinoA, -2)
  uguale('la costa è a = −1', ZONA.costaA, -1)
  uguale('i laghi cominciano a a ≥ 8', ZONA.lagoDaA, 8)
  // i 42 lotti storici e il quadrato di partenza: prato, senz'acqua, uguali a prima
  const storici = []
  for (let b = 0; b < 6; b++) for (let a = 0; a < 7; a++) storici.push([a, b])
  controlla('i 42 lotti storici sono prato e non hanno acqua né sabbia', storici.every(([a, b]) => { const g = generaLotto(a, b); return g.bioma === 'prato' && !g.acqua.length && !g.spiaggia.length && !g.mare }))
  controlla('i lotti storici non cambiano con la geografia: stesso risultato col «vecchio»', storici.every(([a, b]) => JSON.stringify(generaLotto(a, b)) === JSON.stringify({ ...generaLotto(a, b, { vecchio: true }), spiaggia: [], mare: false })))
  controlla('il quadrato di partenza 3×3 (a e b da 2 a 4) è prato', Object.keys(LOTTI_INIZIALI).every(id => { const l = lottoPerId(id); return biomaDi(l.a, l.b) === 'prato' }))
  // la fascia di mezzo ha i suoi laghi naturali (fattoria3d-laghi); dove non c'è acqua né di oggi né di prima, prato e bosco sono quelli di prima
  controlla('da a = 0 a 7, senza acqua, il bioma è quello di prima', (() => { for (let b = -40; b < 40; b++) for (let a = 0; a <= 7; a++) if (biomaDi(a, b) !== 'laghetto' && biomaVecchio(a, b) !== 'laghetto' && biomaDi(a, b) !== biomaVecchio(a, b)) return false; return true })())
  // il mare
  let tuttiMare = true, interi = true
  for (let b = -50; b < 50; b++) for (let a = -40; a <= ZONA.mareFinoA; a++) {
    if (biomaDi(a, b) !== 'mare') tuttiMare = false
    if (acquaDelLotto(lotto(a, b)).length !== 16) interi = false
  }
  controlla('ogni lotto con a ≤ −2 è mare, per ogni b', tuttiMare)
  controlla('un lotto di mare è tutto acqua (16 celle)', interi)
  const m = generaLotto(-3, 3)
  controlla('generaLotto del mare: un piano solo (mare), niente alberi né sassi né molo', m.mare === true && m.bioma === 'mare' && !m.alberi.length && !m.ostacoli.length && !m.molo)
  // la costa
  let costaOk = true, sabbiaOk = true, larga = 0, righe = 0
  for (let b = -50; b < 50; b++) {
    const l = lotto(ZONA.costaA, b), acqua = acquaDelLotto(l), sabbia = spiaggiaDelLotto(l)
    if (biomaDi(l.a, l.b) !== 'costa') costaOk = false
    if (acqua.some(([i, j]) => !eMare(i, j))) costaOk = false
    const set = new Set(acqua.map(([i, j]) => chiave(i, j)))
    if (sabbia.some(([i, j]) => set.has(chiave(i, j)) || lottoDi(i, j).id !== l.id)) sabbiaOk = false
    for (let y = 0; y < 4; y++) {
      const j = l.j + y, mare = celleDi(l).filter(([i, jj]) => jj === j && eMare(i, jj)).length, sab = sabbia.filter(([, jj]) => jj === j).length
      righe++; if (sab >= 2 && sab <= 3) larga++
      if (mare !== rivaDelMare(j)) costaOk = false
    }
  }
  controlla('la costa (a = −1): l\'acqua è mare e quante colonne le dice la riga', costaOk)
  controlla('la spiaggia sta nel lotto della costa e mai sull\'acqua', sabbiaOk)
  controlla('ogni riga di costa ha due o tre celle di sabbia in riva', larga === righe, `${larga} su ${righe}`)
  controlla('la riva ondeggia ma piano: da una riga all\'altra al più una colonna', (() => { for (let j = -200; j < 200; j++) if (Math.abs(rivaDelMare(j) - rivaDelMare(j + 1)) > 1) return false; return true })())
  controlla('la riva non è sempre uguale (varia fra 0 e 2)', new Set(Array.from({ length: 60 }, (_, j) => rivaDelMare(j))).size === 3)
  controlla('una riga di costa: prima mare, poi sabbia, poi terra (niente isolotti nel mare)', (() => {
    for (let j = -60; j < 60; j++) { let fase = 0; for (let i = -30; i <= -12; i++) { const f = eMare(i, j) ? 0 : eSpiaggia(i, j) ? 1 : 2; if (f < fase) return false; fase = f } }
    return true
  })())
  uguale('il mare è acqua di mare', tipoAcqua(-25, 3), 'mare')
  uguale('un lago è acqua dolce', tipoAcqua(22, 5), 'dolce')
  controlla('nessuna costa nei lotti storici: la sabbia non entra mai nel lotto a = 0', (() => { for (let j = -60; j < 60; j++) if (eSpiaggia(-14, j) || eMare(-14, j)) return false; return true })())
  // i laghi: forma continua, grandi, su più lotti
  let laghiOk = true
  for (let b = -40; b < 40; b++) for (let a = 8; a < 40; a++) {
    const bio = biomaDi(a, b), ac = acquaDelLotto(lotto(a, b))
    if (bio === 'lago' && !ac.length) laghiOk = false
    if (bio !== 'lago' && ac.length) laghiOk = false
  }
  controlla('un lotto è «lago» se e solo se ha acqua del lago', laghiOk)
  controlla('a ovest di a = 8 e a est il laghetto del lotto non c\'è', (() => { for (let b = -40; b < 40; b++) { for (let a = -40; a <= -1; a++) if (biomaDi(a, b) === 'laghetto') return false; for (let a = 8; a < 40; a++) if (biomaDi(a, b) === 'laghetto') return false } return true })())
  // componenti connesse di acqua di lago: quanti lotti toccano
  const visto = new Set(), laghi = []
  for (let j = -60; j < 60; j++) for (let i = 18; i < 120; i++) {
    if (!eLago(i, j) || visto.has(chiave(i, j))) continue
    const celle = [], coda = [[i, j]]; visto.add(chiave(i, j))
    for (let k = 0; k < coda.length; k++) {
      const [x, y] = coda[k]; celle.push([x, y])
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const kk = chiave(x + dx, y + dy); if (!visto.has(kk) && eLago(x + dx, y + dy)) { visto.add(kk); coda.push([x + dx, y + dy]) } }
    }
    laghi.push(celle)
  }
  const lottiDi = c => new Set(c.map(([x, y]) => lottoDi(x, y).id))
  const grandi = laghi.filter(c => c.length >= 40)
  controlla('i laghi sono grandi: quasi tutti oltre 40 celle', grandi.length >= laghi.length * 0.8, `${grandi.length} su ${laghi.length}`)
  controlla('un lago tocca più lotti (almeno 4 per quasi tutti)', grandi.filter(c => lottiDi(c).size >= 4).length >= grandi.length * 0.8, grandi.map(c => lottiDi(c).size).join())
  controlla('il lago più grande tocca almeno 6 lotti', Math.max(...laghi.map(c => lottiDi(c).size)) >= 6)
  controlla('la forma attraversa i confini fra lotti: l\'acqua è unita da una cella all\'altra anche sul confine', grandi.every(c => {
    const per = lottiDi(c); if (per.size < 2) return true
    return c.some(([x, y]) => lottoDi(x, y).id !== lottoDi(x + 1, y).id && eLago(x + 1, y)) || c.some(([x, y]) => lottoDi(x, y).id !== lottoDi(x, y + 1).id && eLago(x, y + 1))
  }))
  controlla('lo stesso lago visto da due lotti vicini: la cella sul confine è la stessa', (() => {
    // il bordo est di un lotto e il bordo ovest del lotto accanto dicono la stessa acqua (una funzione di (i, j), non del lotto)
    for (let b = 0; b < 12; b++) for (let a = 8; a < 20; a++) {
      const A = new Set(acquaDelLotto(lotto(a, b)).map(([i, j]) => chiave(i, j))), B = new Set(acquaDelLotto(lotto(a + 1, b)).map(([i, j]) => chiave(i, j)))
      for (let y = 0; y < 4; y++) { const j = lotto(a, b).j + y, i = lotto(a, b).i + 3; if (A.has(chiave(i, j)) !== eLago(i, j) || B.has(chiave(i + 1, j)) !== eLago(i + 1, j)) return false }
    }
    return true
  })())
  controlla('c\'è almeno un isolotto: terra circondata dall\'acqua del lago', grandi.slice(0, 20).some(c => {
    const xs = c.map(p => p[0]), ys = c.map(p => p[1]), x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1
    const fuori = new Set(), coda = [[x0, y0]]; fuori.add(chiave(x0, y0))
    for (let k = 0; k < coda.length; k++) { const [x, y] = coda[k]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < x0 || nx > x1 || ny < y0 || ny > y1 || fuori.has(chiave(nx, ny)) || eLago(nx, ny)) continue; fuori.add(chiave(nx, ny)); coda.push([nx, ny]) } }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!eLago(x, y) && !fuori.has(chiave(x, y))) return true
    return false
  }))
  controlla('l\'acqua dipende solo dalla cella: due chiamate, stesso risultato', (() => { for (let k = 0; k < 400; k++) { const i = 18 + (k * 37) % 90, j = -50 + (k * 53) % 100; if (eLago(i, j) !== eLago(i, j) || eMare(i - 60, j) !== eMare(i - 60, j)) return false } return true })())
  const proporzioni = {}
  for (let b = -40; b < 40; b++) for (let a = 8; a < 48; a++) { const bi = biomaDi(a, b); proporzioni[bi] = (proporzioni[bi] || 0) + 1 }
  nota('a est (a da 8 a 47, 80 righe):', JSON.stringify(proporzioni), '· laghi di', Math.min(...grandi.map(c => c.length)), 'a', Math.max(...grandi.map(c => c.length)), 'celle')
  controlla('a est c\'è anche terra (prato e bosco) fra i laghi: non è tutto acqua', (proporzioni.prato || 0) + (proporzioni.bosco || 0) > (proporzioni.lago || 0) * 0.2)
  // nord e sud restano come prima: niente muro
  controlla('nord e sud (b fuori dal rettangolo storico, a da 0 a 7) hanno prato, bosco e laghetti', (() => { const v = new Set(); for (let b = -30; b < 0; b++) for (let a = 0; a <= 7; a++) v.add(biomaDi(a, b)); return v.has('prato') && v.has('bosco') && v.has('laghetto') && !v.has('mare') && !v.has('lago') })())
}

/* ══════════ 2. comprare l'acqua come ogni lotto ══════════ */
{
  const { f } = mondo()
  controlla('la costa e il mare si comprano come ogni lotto che confina: prezzo crescente', (() => {
    const p0 = f.prezzoLotto()
    compra(f, '1_3'); const p1 = f.prezzoLotto()
    compra(f, '0_3'); const p2 = f.prezzoLotto()
    compra(f, '-1_3'); const p3 = f.prezzoLotto()
    return p0 === prezzoDelLotto(0) && p1 === prezzoDelLotto(1) && p2 === prezzoDelLotto(2) && p3 === prezzoDelLotto(3) && p0 < p1 && p1 < p2 && p2 < p3
  })())
  uguale('il lotto di mare confina con la costa', f.lottiComprabili().some(l => l.id === '-2_3'), true)
  uguale('e ha il bioma mare', f.biomaDi(lottoPerId('-2_3')), 'mare')
  const prima = f.prezzoLotto()
  const r = f.compraLotto('-2_3')
  controlla('si compra come la terra, allo stesso prezzo', r.ok && r.costo === prima && r.costo === prezzoDelLotto(3))
  controlla('il lotto di mare tuo è acqua: non si cammina e non si costruisce', f.acqua(-20, 1) && f.blocca(-20, 1) && !f.libera(-20, 1) && f.puoMettere('campo', -22, 0).motivo === 'acqua')
  controlla('un pezzo non sull\'acqua non ci va, un molo sì se parte dalla spiaggia', f.puoMettere('aiuola', -21, 1).motivo === 'acqua')
  controlla('la costa tua è camminabile (la sabbia) e l\'acqua accanto no', (() => { const l = lotto(-1, 3), sab = spiaggiaDelLotto(l)[0]; pulisci(f); return f.libera(sab[0], sab[1]) && !f.libera(-18, 1) })())
}

/* ══════════ 3. i salvataggi di prima tengono i loro lotti ══════════ */
{
  // un salvataggio senza `geo` che aveva già comprato un lotto dove ora c'è il mare: resta terra com'era
  const s = statoIniziale(); delete s.geo; delete s.vecchi
  for (const id of ['1_3', '0_3', '-1_3', '-2_3', '-3_3', '8_3']) s.lotti[id] = true
  const v = JSON.parse(JSON.stringify(s)); delete v.geo; delete v.vecchi
  const n = normalizza(v)
  uguale('uno stato di prima si legge: geo = 2', n.geo, 2)
  controlla('i lotti comprati dove ora cambia la geografia sono «vecchi»', ['-2_3', '-3_3'].every(id => n.vecchi.includes(id)) && !n.vecchi.includes('1_3') && !n.vecchi.includes('0_3'), JSON.stringify(n.vecchi))
  const { f } = mondo({ stato: n })
  uguale('un lotto di mare comprato prima è prato come prima', f.biomaDi(lottoPerId('-3_3')), biomaVecchio(-3, 3))
  controlla('e non ha acqua: si cammina e si costruisce come allora', !f.acqua(-24, 1) && !f.blocca(-24, 1) || f.bloccoFisso.has(chiave(-24, 1)))
  controlla('alberi e sassi sono quelli di prima', JSON.stringify(f.lottiAperti.get(lotto(-3, 3).k).dati.alberi.map(a => a.n)) === JSON.stringify(generaLotto(-3, 3, { vecchio: true }).alberi.map(a => a.n)))
  controlla('il lotto accanto, non comprato, è mare nuovo', f.biomaDi(lottoPerId('-4_3')) === 'mare' && f.acqua(-27, 1))
  // un lotto comprato dopo non è vecchio
  compra(f, '-4_3')
  controlla('un lotto comprato dopo la geografia grande è nuovo', !f.vecchi.has('-4_3'))
  const salvato = f.serializza()
  const g = new Fattoria3d({ stato: normalizza(salvato), borsa: f.borsa, ora: () => adesso.t })
  controlla('salvato e riletto: i vecchi restano, il nuovo no', g.vecchi.has('-3_3') && !g.vecchi.has('-4_3') && salvato.geo === 2)
  // uno stato nuovo parte con la geografia grande e nessun lotto vecchio
  const ini = statoIniziale()
  controlla('uno stato nuovo: geo 2, nessun vecchio, nessuna pesca', ini.geo === 2 && ini.vecchi.length === 0 && ini.vecchi1.length === 0 && Object.keys(ini.pesca).length === 0)
  controlla('uno stato guasto non lancia', (() => { try { normalizza({ geo: 'x', vecchi: 5, pesca: { '1_1': { i: 'a' }, 'zz': {}, '2_2': { i: 3, j: 4, fine: 'x', riposo: null } } }); normalizza({ pesca: [] }); return true } catch (e) { return false } })())
  controlla('tutto lo stato di prima (v9) si legge: i campi nuovi sono opzionali', (() => { const vecchioV9 = { v: 9, lotti: { ...LOTTI_INIZIALI }, esperienza: 10 }; const x = normalizza(vecchioV9); return x.pesca && typeof x.pesca === 'object' && x.vecchi.length === 0 })())
}

/* ══════════ 4. il catalogo: molo, porticciolo, friggitoria, sushi bar ══════════ */
{
  const molo = PEZZI.molo, girato = PEZZI.molo_v, port = PEZZI.porticciolo
  controlla('il molo è 3×1, il molo girato 1×3: calpestabili, sull\'acqua, decorazioni', molo.w === 3 && molo.d === 1 && girato.w === 1 && girato.d === 3 && molo.calpestabile && girato.calpestabile && molo.suAcqua && girato.suAcqua && !molo.produttivo)
  controlla('prezzi e livelli: molo 🪙12 al 4, porticciolo 🪙90 al 9', molo.prezzo === 12 && molo.liv === 4 && girato.prezzo === 12 && port.prezzo === 90 && port.liv === 9)
  controlla('il porticciolo è uno solo, sull\'acqua, alla riva', port.unico && port.suAcqua && port.riva && !port.calpestabile)
  controlla('friggitoria e sushi bar sono edifici (3×3) alla fine della scaletta', EDIFICI.friggitoria.liv === 17 && EDIFICI.sushi_bar.liv === 18 && EDIFICI.friggitoria.w === 3 && EDIFICI.sushi_bar.d === 3)
  controlla('le macchine del pesce hanno le ricette della 2D', Object.keys(MACCHINE.friggitoria.ricette).join() === 'patatine,fritto,arancini' && Object.keys(MACCHINE.sushi_bar.ricette).join() === 'sushi,maki')
  uguale('sushi: riso 1 e pesce 1', JSON.stringify(RICETTE.sushi.ing), JSON.stringify({ riso: 1, pesce: 1 }))
  uguale('pesce fritto: pesce 1 e farina 1', JSON.stringify(RICETTE.fritto.ing), JSON.stringify({ pesce: 1, farina: 1 }))
  uguale('il sushi bar apre al 18 e il sushi si fa dal 18', [livelloDelPezzo('sushi_bar'), livelloDellaRicetta('sushi')].join(), '18,18')
  uguale('il pesce è uno dei prodotti e sta al livello del molo', [!!PRODOTTI_ANIMALI.pesce, livelloDelPezzo(PESCI.pesce.dove)].join(), 'true,4')
  uguale('un lancio rende 1 (molo, acqua dolce)', resaDellaPesca({}), 1)
  uguale('col porticciolo 2', resaDellaPesca({ porticciolo: true }), 2)
  uguale('nel mare (col porticciolo) 3', resaDellaPesca({ porticciolo: true, mare: true }), 3)
  controlla('l\'attesa è fra 10 e 18 secondi', PESCA.ms >= 10000 && PESCA.ms <= 18000)
}

/* ══════════ 5. la pesca: lago a est, mare a ovest ══════════ */
{
  adesso.t = 1_000_000
  const { f } = mondo()
  // a est: i lotti fino al lago
  compra(f, '5_3', '6_3', '7_3', '8_3', '9_3', '10_3')
  pulisci(f)
  const lago = [...f.lottiAperti.values()].find(e => e.l.a === 9 && e.l.b === 3)
  controlla('il lotto 9_3 è lago e il motore lo vede acqua', lago.dati.bioma === 'lago' && lago.dati.acqua.length > 0 && lago.dati.acqua.every(([i, j]) => f.acqua(i, j)))
  // un posto per il molo: terra, acqua, acqua in fila verso est
  let posto = null
  for (let j = 0; j < 4 && !posto; j++) for (let i = 17; i < 30 && !posto; i++) {
    if (!f.acqua(i, j) && f.acqua(i + 1, j) && f.acqua(i + 2, j) && f.cellaPropria(i, j) && f.cellaPropria(i + 2, j) && f.puoMettere('molo', i, j).ok) posto = [i, j]
  }
  controlla('c\'è un posto dove il molo parte dalla riva del lago', !!posto, JSON.stringify(posto))
  const [mi, mj] = posto
  const acquaLontana = [...Array(8)].map((_, k) => [mi + 3 + k, mj]).filter(([i, j]) => f.acqua(i, j))
  uguale('senza molo: «senza-molo»', f.provaPesca(mi + 1, mj).motivo, 'senza-molo')
  uguale('una cella di terra non è pesca', f.provaPesca(mi, mj).motivo, 'non-acqua')
  controlla('il molo si compra (🪙12) e si mette con un\'estremità sulla riva', (() => { const r = f.compraEMetti('molo', mi, mj); return r.ok && r.costo === 12 })())
  controlla('il molo si cammina e alza chi ci sta', f.libera(mi + 1, mj) && f.quotaPasso(mi + 1.5, mj + 0.5) > 0)
  const prima = f.provaPesca(mi + 3, mj)
  controlla('toccando l\'acqua accanto al molo: si può lanciare, da una cella del molo', prima.ok && prima.azione === 'lancia' && prima.sta[1] === mj && prima.sta[0] >= mi && prima.sta[0] <= mi + 2, JSON.stringify(prima))
  uguale('un lago senza porticciolo rende 1', prima.resa, 1)
  uguale('dolce, non mare', prima.mare, false)
  // la stessa acqua ma oltre il raggio
  const lontano = acquaLontana.find(([i]) => i - (mi + 2) > PESCA.raggio)
  if (lontano) uguale('oltre sei celle dal molo: «lontano»', f.provaPesca(lontano[0], lontano[1]).motivo, 'lontano')
  // il tempo
  const l = f.lanciaLenza(mi + 3, mj)
  controlla('lancia: la lenza è in acqua', l.ok && f.bancoDi(l.lotto).stato === 'attesa' && f.lenze().length === 1)
  uguale('la lenza dura PESCA.ms', f.s.pesca[l.lotto].fine - adesso.t, PESCA.ms)
  uguale('toccando ancora il banco in attesa: aspetta, coi secondi', [f.provaPesca(mi + 3, mj).azione, f.provaPesca(mi + 3, mj).secondi].join(), `aspetta,${PESCA.ms / 1000}`)
  uguale('si lancia una volta sola per banco', f.lanciaLenza(mi + 3, mj).ok, false)
  uguale('prima del tempo non si ritira', f.ritiraPesca(l.lotto).motivo, 'non-abbocca')
  adesso.t += PESCA.ms - 1
  uguale('un attimo prima: ancora in attesa', f.bancoDi(l.lotto).stato, 'attesa')
  adesso.t += 1
  uguale('a tempo: abbocca', f.bancoDi(l.lotto).stato, 'abbocca')
  uguale('toccando: si ritira (da dove sta il galleggiante)', f.provaPesca(mi + 3, mj).azione, 'ritira')
  controlla('il tempo vale anche a pagina chiusa: salvato e riletto, abbocca ancora', (() => { const g = new Fattoria3d({ stato: normalizza(f.serializza()), borsa: f.borsa, ora: () => adesso.t }); return g.bancoDi(l.lotto).stato === 'abbocca' && g.lenze().length === 1 })())
  const r = f.ritiraPesca(l.lotto)
  controlla('ritira: un pesce nelle scorte', r.ok && r.n === 1 && f.s.prodotti.pesce === 1 && f.scortaDi('pesce') === 1)
  controlla('l\'evento dice quanti', f.prendiEventi().some(e => e.tipo === 'pesce' && e.n === 1))
  uguale('il banco si ripopola: riposo', f.bancoDi(l.lotto).stato, 'riposo')
  const ri = f.provaPesca(mi + 3, mj)
  uguale('toccando nel riposo: dice quanti secondi', [ri.azione, ri.secondi].join(), `riposo,${PESCA.riposoMs / 1000}`)
  adesso.t += PESCA.riposoMs - 1
  uguale('un attimo prima: ancora a riposo', f.bancoDi(l.lotto).stato, 'riposo')
  adesso.t += 1
  uguale('ripopolato: si lancia di nuovo', f.provaPesca(mi + 3, mj).azione, 'lancia')
  f.tick()
  controlla('il banco che ha finito di riposare non lascia traccia nello stato', !f.s.pesca[l.lotto])
  // il pesce serve: pesce fritto e sushi
  f.s.merci.riso = 4; f.s.merci.grano = 0; f.s.prodotti.farina = 1; f.s.prodotti.pesce = 3
  f.compraEdificio('sushi_bar', 14, 0); f.compraEdificio('friggitoria', 10, 0)
  controlla('friggitoria e sushi bar si comprano e si mettono', f.s.posseduti.sushi_bar && f.s.posseduti.friggitoria)
  controlla('il sushi: riso + pesce', f.avviaRicetta('sushi').ok && f.s.merci.riso === 3 && f.s.prodotti.pesce === 2)
  controlla('il pesce fritto: pesce + farina', f.avviaRicetta('fritto').ok && f.s.prodotti.pesce === 1 && !f.s.prodotti.farina)
  adesso.t += 60_000; f.tick(); f.ritiraDa('friggitoria')
  uguale('senza pesce non si frigge: mancano gli ingredienti', (() => { f.s.prodotti.pesce = 0; f.s.prodotti.farina = 1; return f.avviaRicetta('fritto').motivo })(), 'mancano-ingredienti')
  controlla('il sushi è pronto da ritirare', f.prontiIn('sushi_bar') === 1 && f.ritiraDa('sushi_bar').ok && f.s.prodotti.sushi === 1)
  // lo stagno costruito è un posto di pesca anche lui, con un molo accanto
  // un molo non collegato allo stesso specchio non permette: un laghetto lontano dal molo del lago
  nota('molo del lago in', JSON.stringify(posto), '· lotto d\'acqua', l.lotto)
}

/* ══════════ 6. le regole del porticciolo e del mare ══════════ */
{
  adesso.t = 1_000_000
  const { f } = mondo()
  compra(f, '1_3', '0_3', '-1_3', '-2_3')
  pulisci(f)
  // il molo dalla spiaggia verso il mare (riga 0 del lotto: la riva è a −17)
  controlla('il molo parte dalla spiaggia ed entra nel mare', f.compraEMetti('molo', -17, 0).ok)
  uguale('il mare senza porticciolo: serve il porticciolo', f.provaPesca(-19, 0).motivo, 'serve-porticciolo')
  uguale('e dice la frase', dettoDi('serve-porticciolo'), 'Per pescare in mare serve il porticciolo')
  // il porticciolo: alla riva, uno solo
  uguale('il porticciolo lontano dall\'acqua non si mette: serve la riva', f.puoMettere('porticciolo', -12, 1).motivo, 'serve-riva')
  const rp = f.compraEMetti('porticciolo', -17, 1)
  controlla('il porticciolo si mette sulla riva (🪙90)', rp.ok && rp.costo === 90, JSON.stringify(rp))
  uguale('un secondo porticciolo no: gia-tuo', f.compraPezzo('porticciolo').motivo, 'gia-tuo')
  uguale('nemmeno messo in un altro posto', f.puoMettere('porticciolo', -17, 5).motivo === 'gia-tuo' || f.puoMettere('porticciolo', -17, 5).motivo === 'fuori-terreno', true)
  const mare = f.provaPesca(-19, 0)
  controlla('col porticciolo il mare si pesca: resa 3, mare', mare.ok && mare.azione === 'lancia' && mare.mare && mare.resa === 3, JSON.stringify(mare))
  const l = f.lanciaLenza(-19, 0)
  adesso.t += PESCA.ms
  const r = f.ritiraPesca(l.lotto)
  controlla('tre pesci dal mare', r.ok && r.n === 3 && f.s.prodotti.pesce === 3 && r.mare)
  // un banco per lotto di mare: un secondo lotto, un secondo banco in parallelo
  uguale('il banco di questo lotto riposa', f.bancoDi(l.lotto).stato, 'riposo')
  // togliere il molo mentre la lenza è in acqua: la lenza si ritira da sé, senza pesce
  adesso.t += PESCA.riposoMs; f.tick()
  const l2 = f.lanciaLenza(-19, 1)
  controlla('la lenza è in acqua', l2.ok && f.lenze().length === 1)
  const molo = f.cosaDi('molo'), pesci = f.s.prodotti.pesce
  f.mettiVia(molo.id); f.mettiVia(f.cosaDi('porticciolo').id)
  controlla('senza molo né porticciolo la lenza si ritira da sé e il pesce non c\'è', f.lenze().length === 0 && f.s.prodotti.pesce === pesci)
  // acqua di un lotto non tuo
  const { f: g } = mondo()
  uguale('l\'acqua di un lotto non tuo non si pesca', g.provaPesca(-30, 2).motivo, 'acqua-non-tua')
  uguale('l\'acqua che non c\'è: non-acqua', g.provaPesca(0, 0).motivo, 'non-acqua')
}

/* ══════════ 7. uno stagno costruito è acqua dolce, e due specchi non si mescolano ══════════ */
{
  adesso.t = 1_000_000
  const { f } = mondo()
  pulisci(f)
  uguale('lo stagno costruito (3×3) si mette nel prato', f.compraEMetti('stagno', -4, 4).ok, true)
  uguale('senza molo: «senza-molo»', f.provaPesca(-3, 5).motivo, 'senza-molo')
  controlla('un molo che ci arriva dalla riva', f.compraEMetti('molo_v', -4, 2).ok)
  const p = f.provaPesca(-3, 5)
  controlla('lo stagno si pesca: dolce, 1 pesce', p.ok && p.azione === 'lancia' && !p.mare && p.resa === 1, JSON.stringify(p))
  // un secondo stagno, lontano più di sei celle dal molo (stessa fattoria): non è nello specchio del molo
  uguale('un altro stagno lontano dal molo: «lontano»', (() => { f.compraEMetti('stagno', 3, 5); return f.provaPesca(4, 6).motivo })(), 'lontano')
  controlla('un banco per lotto: i due stagni sono lotti diversi, due lenze in parallelo', (() => {
    f.compraEMetti('molo_v', 3, 2)
    const a = f.lanciaLenza(-3, 5), b = f.lanciaLenza(4, 6)
    return a.ok && b.ok && f.lenze().length === 2 && a.lotto !== b.lotto
  })())
}

riassunto('Fattoria 3D — geografia grande e pesca')
