/* Il mondo senza confini della fattoria 3D, senza browser: la generazione di un lotto è pura e sempre uguale (anche lontanissimo), i 42 lotti
   storici hanno gli alberi e i sassi di prima (il riferimento è test/aiuto/fattoria3d-mondo-storico.json), si compra in tutte le direzioni
   fin oltre i vecchi bordi, il prezzo sale e si auto-limita, i laghetti stanno dove devono e l'acqua si attraversa solo sui ponti, e un
   salvataggio di ieri si legge uguale. `node test/esegui.mjs fattoria3d-mondo`
   tempo: 1 */
import fs from 'node:fs'
import { generaLotto } from '../../src/giochi/fattoria3d/dati/lotti.js'
import { biomaDi, acquaDelLotto, moloDelLotto, P_LAGHETTO } from '../../src/giochi/fattoria3d/dati/biomi.js'
import { LOTTI_STORICI, LOTTI_INIZIALI, lotto, lottoDi, lottoPerId, chiave, cellaDa, idCella, cellaDaId, eStorico, nelRettangolo, vicinoDi } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { COSTI, prezzoDelLotto } from '../../src/giochi/fattoria3d/dati/regole.js'
import { esperienzaDaPrima } from '../../src/giochi/fattoria3d/motore/scala-vecchia.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { statoIniziale, normalizza, VERSIONE_STATO } from '../../src/giochi/fattoria3d/motore/stato.js'
import { percorso } from '../../src/giochi/fattoria3d/motore/percorso.js'
import { motoreDiVisita, esportaLaMiaFattoria } from '../../src/giochi/fattoria3d/motore/vicini.js'
import { VICINI } from '../../src/giochi/fattoria3d/dati/vicini.js'
import { sogliaDi, ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const RIF = JSON.parse(fs.readFileSync(new URL('../aiuto/fattoria3d-mondo-storico.json', import.meta.url), 'utf8'))
function mondo({ monete = 1e7, stato = null, liv = 70 } = {}) {
  const b = { monete }
  const s = stato || statoIniziale()
  s.esperienza = Math.max(s.esperienza || 0, sogliaDi(liv))
  const f = new Fattoria3d({ stato: s, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
  return { f, b }
}
const senzaOstacoli = f => { for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o) }
const senzaAlberi = f => { for (const a of f.alberi) if (!a.tagliato) { a.tagliato = true; f.tagliati.add(a.n); f.s.tagliati.push(a.n); f.bloccoFisso.delete(chiave(a.i, a.j)) } }

/* ══════════ 1. generazione pura e deterministica ══════════ */
for (const [a, b] of [[0, 0], [3, 2], [-1, 3], [7, -2], [-50, -50], [50, 50], [-50, 50], [123, -77]]) {
  const x = generaLotto(a, b), y = generaLotto(a, b)
  controlla(`il lotto ${a}_${b} viene uguale a ogni chiamata`, JSON.stringify(x) === JSON.stringify(y))
  controlla(`${a}_${b}: dentro ci sono solo celle sue`, [...x.alberi, ...x.ostacoli].every(o => lottoDi(o.i, o.j).id === x.id) && x.acqua.every(([i, j]) => lottoDi(i, j).id === x.id))
  controlla(`${a}_${b}: niente albero o sasso sull'acqua, né sotto un albero`, (() => {
    const ac = new Set(x.acqua.map(([i, j]) => chiave(i, j))), al = new Set(x.alberi.map(o => chiave(o.i, o.j)))
    return x.alberi.every(o => !ac.has(chiave(o.i, o.j))) && x.ostacoli.every(o => !ac.has(chiave(o.i, o.j)) && !al.has(chiave(o.i, o.j)))
  })())
}
controlla('i biomi non dipendono dall\'ordine di chiamata', (() => { const v = []; for (let a = -5; a < 5; a++) v.push(biomaDi(a, 9)); const w = []; for (let a = 4; a >= -5; a--) w.unshift(biomaDi(a, 9)); return JSON.stringify(v) === JSON.stringify(w) })())
// gli id di alberi e sassi nuovi non toccano mai i numeri storici
{
  const ids = new Set(); let max = 0
  for (let b = -6; b < 12; b++) for (let a = -8; a < 14; a++) { if (eStorico(lotto(a, b))) continue; const g = generaLotto(a, b); for (const o of [...g.alberi, ...g.ostacoli]) { ids.add(o.n); max = Math.min(max, o.n) } }
  controlla('gli id dei lotti nuovi sono unici e lontani da quelli storici (< 832)', ids.size > 100 && [...ids].every(n => n > 100000), String(ids.size))
}

/* ══════════ 2. i lotti storici sono quelli di prima ══════════ */
{
  const al = [], os = []
  for (const l of LOTTI_STORICI) { const g = generaLotto(l.a, l.b); al.push(...g.alberi); os.push(...g.ostacoli) }
  const chiavi = o => JSON.stringify(Object.fromEntries(Object.entries(o).sort()))
  stessaLista('gli alberi dei 42 lotti sono quelli di prima (numero, cella, scala, tinta, i già tagliati)', al.map(a => chiavi(a)).sort(), RIF.alberi.map(a => chiavi({ ...a, tagliabile: true })).sort())
  stessaLista('i sassi e i cespugli pure (id, tipo, posizione)', os.map(o => chiavi({ id: o.id, tipo: o.tipo, i: o.i, j: o.j, x: o.x, z: o.z, s: o.s, ang: o.ang, c: o.c })).sort(), RIF.ostacoli.map(chiavi).sort())
  controlla('un id di sasso storico è l\'indice della vecchia griglia (i salvataggi valgono)', os.every(o => o.id === o.n && o.id >= 0 && o.id < 832))
  controlla('un lotto storico è sempre prato', LOTTI_STORICI.every(l => generaLotto(l.a, l.b).bioma === 'prato' && !generaLotto(l.a, l.b).acqua.length))
}

/* ══════════ 3. le chiavi e gli id delle celle ══════════ */
{
  let ok = true
  for (const [i, j] of [[0, 0], [-14, -12], [13, 11], [14, 12], [-15, 0], [200, -300], [-40000, 40000]]) { const c = cellaDaId(idCella(i, j)); ok = ok && c && c[0] === i && c[1] === j; const d = cellaDa(chiave(i, j)); ok = ok && d[0] === i && d[1] === j }
  controlla('un id di cella torna alla cella, dentro e fuori dal rettangolo storico', ok)
  controlla('dentro il rettangolo l\'id è quello di sempre', idCella(-14, -12) === (-12 + 13) * 32 + (-14 + 16) && nelRettangolo(0, 0) && !nelRettangolo(14, 0))
  stessaLista('lottoPerId accetta anche le coordinate negative e rifiuta il resto', [lottoPerId('-1_3').i, lottoPerId('-1_3').j, lottoPerId('0_-2').j, lottoPerId('x'), lottoPerId('1_2_3'), lottoPerId('99999_1')], [-18, 0, -20, null, null, null])
  uguale('il lotto 0_0 è il vecchio', lottoDi(-14, -12).id, '0_0')
  uguale('e subito oltre il bordo c\'è -1_0', lottoDi(-15, -12).id, '-1_0')
}

/* ══════════ 4. si compra in ogni direzione, fin oltre i bordi ══════════ */
{
  const { f, b } = mondo()
  // una fila verso ogni punto cardinale, oltre i vecchi bordi (a 0..6, b 0..5), con i negativi
  const fila = (da, db, n) => {
    let l = lotto(3, 3), ok = true
    for (let k = 0; k < n; k++) { l = vicinoDi(l, da, db); if (!f.posseduto(l)) { const r = f.compraLotto(l.id); ok = ok && r.ok } }
    return [ok, l.id]
  }
  const est = fila(1, 0, 8), ovest = fila(-1, 0, 8), sud = fila(0, 1, 8), nord = fila(0, -1, 8)
  stessaLista('si compra a est fino al lotto 11_3', est, [true, '11_3'])
  stessaLista('a ovest fino a -5_3 (negativo)', ovest, [true, '-5_3'])
  stessaLista('a sud fino a 3_11', sud, [true, '3_11'])
  stessaLista('a nord fino a 3_-5 (negativo)', nord, [true, '3_-5'])
  controlla('e il lotto in fondo alla fila è davvero tuo, le celle anche', f.cellaPropria(lotto(11, 3).i + 1, lotto(11, 3).j + 1) && f.cellaPropria(lotto(-5, 3).i, lotto(-5, 3).j) && f.cellaPropria(lotto(3, -5).i, lotto(3, -5).j + 3))
  uguale('uno che non confina non si compra', f.compraLotto('20_20').motivo, 'non-confina')
  uguale('un id sconosciuto nemmeno', f.compraLotto('boh').motivo, 'sconosciuto')
  uguale('uno tuo non si ricompra', f.compraLotto('11_3').motivo, 'gia-tuo')
  uguale('in diagonale non confina', f.compraLotto('12_4').motivo, 'non-confina')
  const prima = b.monete
  const r = f.compraLotto('12_3')
  controlla('un lotto in più, e costa quanto dice prezzoLotto', r.ok && prima - b.monete === r.costo)
  // il salvataggio ricorda i lotti con le coordinate negative
  const g = mondo({ stato: f.serializza() }).f
  controlla('rileggendo i lotti lontani sono ancora tuoi', g.posseduto(lotto(-5, 3)) && g.posseduto(lotto(3, -5)) && g.posseduto(lotto(12, 3)))
  controlla('l\'anello (due lotti attorno ai tuoi) è aperto: alberi e sassi ci sono', g.lottiAperti.has(lotto(14, 3).k) && !g.lottiAperti.has(lotto(15, 3).k))
}

/* ══════════ 5. il prezzo si auto-limita ══════════ */
{
  const p = k => prezzoDelLotto(k)
  controlla('il primo lotto costa pochissimo (la 3D parte con meno terra della 2D) e il rincaro è quello della 2D: ×1,38 per piazzola, cioè per 36 celle', p(0) <= 10 && Math.abs(p(60) / p(60 - 9) - 1.38 ** (9 * 16 / 1.05 / 36)) / 1.38 ** (9 * 16 / 1.05 / 36) < 0.03, String([p(0), p(60) / p(51)]))
  controlla('sale a ogni lotto e resta finito', Array.from({ length: 2000 }, (_, k) => k).every(k => Number.isFinite(p(k)) && (k === 0 || p(k) > p(k - 1))))
  controlla('il rincaro sale (lo scarto fra due lotti cresce)', p(60) - p(59) > p(40) - p(39) && p(40) - p(39) > p(20) - p(19))
  const minuti = k => p(k) / 6
  controlla('il lotto 10 costa pochi minuti di esercizio', minuti(9) < 10, String(p(9)))
  controlla('il centesimo lotto costa più di una settimana di esercizio quotidiano (mezz\'ora al giorno)', minuti(99) > 7 * 30, String(p(99)))
  nota('prezzo del 10°, 20°, 50°, 100° lotto:', p(9), p(19), p(49), p(99))
  // il prezzo di un lotto non salta il livello da solo: l'esperienza che dà è tagliata al prezzo dell'ultimo storico
  const { f, b } = mondo({ monete: 1e7, liv: 1 })
  f.s.esperienza = 0
  for (let k = 0; k < 41; k++) { const l = f.lottiComprabili()[0]; const prima = f.livello(); f.compraLotto(l.id); if (k > 32) controlla(`il lotto ${k + 1} non fa salire di livello a salti`, f.livello() - prima <= 1 + Math.floor(ULTIMO / 4)) }
  controlla('l\'esperienza dei lotti è tagliata (680 al massimo ciascuno)', f.esperienza() <= 33 * 680 + 40 * 680)
  const q = f.prezzoLotto(), eprima = f.esperienza(); f.compraLotto(f.lottiComprabili()[0].id)
  controlla('un lotto che costa più del tetto dà solo il tetto di esperienza', q > COSTI.lottoEsperienzaMax && f.esperienza() - eprima === COSTI.lottoEsperienzaMax)
}

/* ══════════ 6. i laghetti ══════════ */
{
  let laghi = 0, tot = 0, brutti = []
  const conta = { prato: 0, bosco: 0, laghetto: 0 }
  for (let b = -60; b < 60; b++) for (let a = -60; a < 60; a++) {
    const l = lotto(a, b), bio = biomaDi(a, b)
    if (a >= 0 && a <= 7) { conta[bio]++; tot++ }          // le proporzioni valgono per la fascia di mezzo: a ovest c'è il mare, a est i laghi grandi (fattoria3d-geografia)
    if (bio !== 'laghetto') continue
    laghi++
    const ac = acquaDelLotto(l), set = new Set(ac.map(([i, j]) => chiave(i, j)))
    const piu = Math.max(Math.abs(a - 3), Math.abs(b - 3))
    if (piu < 3 || nelRettangolo(l.i, l.j) || eStorico(l)) brutti.push(`${l.id}: troppo vicino al quadrato di partenza`)
    if (ac.length < 3) brutti.push(`${l.id}: ${ac.length} celle`)
    const m = moloDelLotto(l, ac)
    if (ac.length < 16) {
      if (!m || set.has(chiave(m.i, m.j)) || !set.has(chiave(m.i + m.verso[0], m.j + m.verso[1])) || lottoDi(m.i, m.j).id !== l.id) brutti.push(`${l.id}: il posto del molo non torna`)
      const g = generaLotto(a, b)
      if (!g.molo || g.molo.i !== m.i || g.molo.j !== m.j) brutti.push(`${l.id}: generaLotto non espone il molo`)
    }
  }
  controlla('i laghetti stanno alle regole (lontani dal quadrato storico, con un molo dove c\'è terra); la forma e la distribuzione: fattoria3d-laghi', brutti.length === 0, brutti.slice(0, 4).join(' · '))
  const pc = k => Math.round(100 * conta[k] / tot)
  controlla('le proporzioni sono quelle volute (prato ~65%, bosco ~14%, lotti con un lago ~21%)', pc('laghetto') >= 15 && pc('laghetto') <= 28 && Math.abs(pc('bosco') - 14) <= 4 && pc('prato') >= 55, JSON.stringify(conta))
  nota('biomi nella fascia di mezzo (a da 0 a 7, b da −60 a 59): prato', pc('prato') + '%, bosco', pc('bosco') + '%, laghetto', pc('laghetto') + '%')
  controlla('il bosco ha più alberi del prato', (() => { let b = 0, p = 0, nb = 0, np = 0; for (let y = 8; y < 60; y++) for (let x = 8; x < 60; x++) { const bi = biomaDi(x, y); if (bi === 'bosco') { b += generaLotto(x, y).alberi.length; nb++ } else if (bi === 'prato') { p += generaLotto(x, y).alberi.length; np++ } } return b / nb > 1.8 * (p / np) })())
  controlla('P_LAGHETTO è un numero sensato', P_LAGHETTO > 0 && P_LAGHETTO < 1)
}

/* ══════════ 7. acqua, ponti e percorso ══════════ */
{
  const s = statoIniziale()
  s.geo = 1             // un salvataggio dei laghetti-pozzanghera: il lotto 2_-1 tiene il suo stagno (fattoria3d-laghi: `vecchi1`)
  for (const id of ['2_1', '2_0', '2_-1']) s.lotti[id] = true
  const { f } = mondo({ stato: s })
  senzaOstacoli(f); senzaAlberi(f)
  const acqua = [[-5, -15], [-4, -15], [-5, -14], [-4, -14], [-6, -14]]
  controlla('le celle d\'acqua del laghetto 2_-1 sono quelle del generatore', acqua.every(([i, j]) => f.acqua(i, j)) && !f.acqua(-3, -14) && !f.acqua(-6, -15))
  controlla('l\'acqua blocca il passo e il costruire', acqua.every(([i, j]) => f.blocca(i, j) && !f.libera(i, j)))
  uguale('un campo sull\'acqua: motivo acqua', f.puoMettere('campo', -5, -15).motivo, 'acqua')
  uguale('un campo con una cella sola nell\'acqua: acqua', f.puoMettere('campo', -6, -15).motivo, 'acqua')
  uguale('una strada sull\'acqua non si disegna', f.disegnaStrada(-5, -15).motivo, 'occupato')
  uguale('un\'aiuola sull\'acqua: acqua', f.puoMettere('aiuola', -4, -14).motivo, 'acqua')
  uguale('un ponte tutto sull\'acqua, senza appoggio: acqua', f.puoMettere('ponte', -6, -14).motivo, 'acqua')
  controlla('un ponte con un\'estremità sulla riva si può', f.puoMettere('ponte', -5, -14).ok)
  controlla('una passerella dalla riva nord attraverso l\'acqua si può', f.puoMettere('passerella', -5, -16).ok)
  // da nord a sud del laghetto: senza ponte non si passa, col ponte sì
  const da = [-5, -16], a = [-5, -12]
  const va = () => f.percorsoVerso(da, [a])
  const senza = va()
  controlla('senza ponte il percorso gira (non entra mai nell\'acqua)', !senza || senza.every(([i, j]) => !f.acqua(i, j)))
  const cammino = senza ? senza.length : 99
  controlla('e il giro è più lungo della linea retta', cammino > 4)
  f.compraPezzo('passerella')
  const r = f.mettiPezzo('passerella', -5, -16)
  controlla('la passerella si mette', r.ok)
  const con = va()
  controlla('con la passerella il percorso la attraversa', !!con && con.some(([i, j]) => f.acqua(i, j)) && con.length < cammino, JSON.stringify(con))
  controlla('sopra la passerella si cammina e si è più in alto', f.libera(-5, -15) && f.quotaPasso(-5 + 0.5, -15 + 0.5) > 0)
  uguale('niente altro si mette sopra il ponte', f.puoMettere('aiuola', -5, -15).motivo, 'acqua')
  // togliere il ponte chiude di nuovo il passaggio
  f.mettiVia(r.cosa.id)
  controlla('tolta la passerella l\'acqua è di nuovo un muro', !f.libera(-5, -15))
  const [wi, wj] = (() => { for (let b = -12; b < -3; b++) for (let a = 0; a <= 7; a++) { const ac = acquaDelLotto(lotto(a, b)); if (ac.length) return ac[0] } })()
  controlla('nel lotto non tuo l\'acqua si vede ma non si tocca', mondo().f.acqua(wi, wj) && !mondo().f.cellaPropria(wi, wj))
  // il percorso non esce dal terreno proprio, e finisce sempre
  const { f: g } = mondo()
  senzaOstacoli(g); senzaAlberi(g)
  const via = g.percorsoVerso([0, 5], [[-40, 5]])
  uguale('verso una cella lontana, fuori dal terreno: nessun percorso', via, null)
  const dentro = g.percorsoVerso([0, 5], [[-3, 4]])
  controlla('dentro il terreno sì, passo per passo', dentro && dentro.length >= 3 && dentro.every(([i, j]) => g.libera(i, j)))
  const mini = percorso(() => true, () => false, [0, 0], [[0, 0]])
  stessaLista('la meta uguale alla partenza: percorso vuoto', mini, [])
}

/* ══════════ 8. salvataggi: un v7 si legge uguale ══════════ */
{
  const lottiVecchi = { ...LOTTI_INIZIALI, '3_1': true, '5_3': true }
  const vecchio = {
    v: 7, lotti: lottiVecchi, strade: [525, 526, 600], tagliati: [3, 10, 40], ostacoli: [35, 69, 132],
    cose: [{ id: 1, tipo: 'campo', i: -5, j: 0, tile: [null, null, null, null] }, { id: 4, tipo: 'aiuola', i: -3, j: 3 }], prossimoId: 5,
    magazzino: { campo: 1 }, esperienza: 300, prodotti: { farina: 2 },
  }
  const n = normalizza(JSON.parse(JSON.stringify(vecchio)))
  controlla('un v7 si legge: lotti, strade, alberi tagliati, sassi tolti, cose e magazzino', JSON.stringify(n.lotti) === JSON.stringify(lottiVecchi) && JSON.stringify(n.strade) === '[525,526,600]' && JSON.stringify(n.tagliati) === '[3,10,40]' && JSON.stringify(n.ostacoli) === '[35,69,132]' && n.cose.length === 2 && n.magazzino.campo === 1 && n.esperienza === esperienzaDaPrima(300, 1) && n.esperienza > 300 && n.prodotti.farina === 2)
  uguale('e passa alla versione dell\'ora', n.v, VERSIONE_STATO)
  controlla('la versione è salita oltre la 7', VERSIONE_STATO >= 8)
  const { f } = mondo({ stato: JSON.parse(JSON.stringify(vecchio)), liv: 1 })
  const c = cellaDaId(525), c3 = cellaDaId(600)
  controlla('le strade disegnate stanno nelle stesse celle di prima', f.stradaSu(c[0], c[1]) === 1 && f.stradaSu(c3[0], c3[1]) === 1)
  controlla('gli alberi tagliati restano tagliati, i sassi tolti restano tolti', f.albero(3).tagliato && f.albero(10).tagliato && f.albero(40).tagliato && f.ostacolo(35).tolto && f.ostacolo(69).tolto && f.ostacolo(132).tolto)
  controlla('gli altri no', !f.albero(4)?.tagliato && f.ostacoli.some(o => !o.tolto))
  const ri = f.serializza()
  controlla('riscrivendo non si perde niente (e i id delle strade restano quelli vecchi)', ri.strade.slice().sort().join() === '525,526,600' && ri.tagliati.includes(3) && ri.ostacoli.includes(35))
  // celle lontane: strade e sassi fuori dal rettangolo si salvano con la chiave
  const g = mondo().f
  g.s.lotti['9_3'] = true; g.propri.add(lotto(9, 3).k); g._apriAnello(lotto(9, 3))
  const lt = lotto(9, 3)
  senzaOstacoli(g)
  const d = g.disegnaStrada(lt.i + 1, lt.j + 1)
  const sal = g.serializza()
  controlla('una strada oltre il bordo si salva e torna nella stessa cella', d.ok && sal.strade.some(id => { const c = cellaDaId(id); return c && c[0] === lt.i + 1 && c[1] === lt.j + 1 }) && mondo({ stato: sal }).f.stradaSu(lt.i + 1, lt.j + 1) === 1)
  const alb = g.alberi.find(a => lottoDi(a.i, a.j).id === '9_3' && !a.tagliato)
  if (alb) {
    g.abbatti(alb.n)
    const g2 = mondo({ stato: g.serializza() }).f
    controlla('un albero tagliato in un lotto nuovo resta tagliato dopo il salvataggio', g2.albero(alb.n).tagliato === true && g2.libera(alb.i, alb.j))
  }
  // uno stato rotto non lancia
  for (const rotto of [null, 5, 'x', [], { lotti: { 'z_z': true, '1_1': true }, strade: [1.5, 'a', -3, 1e30], tagliati: [null], ostacoli: [{}] }]) {
    let ok = true; try { const x = normalizza(rotto); new Fattoria3d({ stato: x, borsa: { quante: () => 0, paga: () => true } }) } catch (e) { ok = false }
    controlla(`uno stato rotto non lancia (${JSON.stringify(rotto)})`, ok)
  }
}

/* ══════════ 9. i vicini con un laghetto ══════════ */
{
  const v = VICINI.find(x => x.id === 'villa-dolce')
  controlla('Villa Dolce ha il lotto con il laghetto e una passerella', v.lotti.includes('2_-1') && v.cose.some(c => c.tipo === 'passerella'))
  const m = motoreDiVisita(v)
  controlla('la visita vede l\'acqua e il ponte tiene', m.acqua(-5, -15) && m.libera(-5, -15) && m.cosaSu(-5, -15)?.tipo === 'passerella')
  controlla('da una riva all\'altra si passa', !!m.percorsoVerso([-5, -16], [[-5, -12]]))
  for (const x of VICINI) { const mm = motoreDiVisita(x); controlla(`${x.id}: nella sua terra niente alberi né sassi`, mm.alberiNelTerreno().length === 0 && mm.ostacoliNelTerreno().length === 0) }
  // un amico con terra lontana: lo snapshot si legge e si esporta
  const { f } = mondo()
  f.s.lotti['-1_3'] = true; f.propri.add(lotto(-1, 3).k); f.disegnaStrada(-1, 4)
  const snap = esportaLaMiaFattoria(f, { id: 'prova', nome: 'Prova', proprietario: { nome: 'P', emoji: '🧑‍🌾' } })
  controlla('lo snapshot porta i lotti negativi', snap && snap.lotti.includes('-1_3'))
  const mv = snap && motoreDiVisita(snap)
  controlla('e si visita', mv && mv.posseduto(lotto(-1, 3)))
}

riassunto('Fattoria 3D — il mondo senza confini')
