/* ═══════════════════════════════════════════════════════════════════
   LE ISOLE DELLA MAPPA DEL TESORO, E LA NAVE — senza browser.
   `node test/esegui.mjs inglese-isole`
   tempo: 100

   La geometria che scena/disposizione.js calcola una volta per mappa, a
   cinque larghezze da telefono:
     · ogni isola ha una costa sola e chiusa, e ci stanno dentro — con un
       margine — le tappe, i nomi, i sentieri e il titolo del suo mondo
     · la stessa isola ricalcolata da capo è identica, e non dipende da
       quanto si è giocato; due mondi hanno due forme diverse
     · due isole non si toccano, e le rotte fra i mondi stanno in mare
     · ogni tappa ha il suo attracco, in mare e accanto a lei, e da ogni
       attracco la nave arriva a ogni altro per mare, in meno di 1,5 s
     · dove sta la nave quando la mappa si apre, e cosa si dice quando si
       tocca una tappa chiusa
   La vista la prova integrazione/inglese-mondi; il resto della mappa unita/inglese-vista.
   Le scelte in docs/lingue/mondi-vista.md («Le isole», «La nave»).
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { TAPPE, MONDI } from '../../src/giochi/inglese/dati/mondi.js'
import { statoMappa, segnaVinta, cosaServe } from '../../src/giochi/inglese/motore/mappa.js'
import { disponi, doveStaLaNave, dimenticaGeografie, CANALE } from '../../src/giochi/inglese/scena/disposizione.js'
import { dentroAnello, area } from '../../src/giochi/inglese/scena/costa.js'
import { rotta, lungo, lunghezza, durata, DURATA_MAX, pezzoVisibile, sfoltisci, navigabile, NAVE }
  from '../../src/giochi/inglese/scena/rotte.js'

const titolo = t => console.log('\n' + t)
const LARGHEZZE = [320, 360, 390, 430, 520]
const extra = () => ({ libro: { aperto: true }, cassetto: { aperto: false } })
const vuoto = { tappa: 0, stelle: {}, cfg: {} }
const meta = { tappa: 0, stelle: {}, cfg: {} }
for (const id of ['prima-colori', 'prima-ciao', 'prima-animali']) segnaVinta(meta, id)
const tutto = { tappa: 0, stelle: {}, cfg: {} }
for (const t of TAPPE) segnaVinta(tutto, t.id)
const quadro = (c, W) => disponi(statoMappa(c, () => 3), W, extra)

// i punti sul bordo di una forma allargata di `m`: devono stare tutti sulla terra
function bordo(f, m) {
  const out = []
  if (f.tipo === 'tondo') {
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; out.push([f.x + Math.cos(a) * (f.r + m), f.y + Math.sin(a) * (f.r + m)]) }
  } else if (f.tipo === 'tratto') {
    const dx = f.bx - f.ax, dy = f.by - f.ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l
    for (let k = 0; k <= 6; k++) {
      const x = f.ax + dx * k / 6, y = f.ay + dy * k / 6
      out.push([x + nx * (f.r + m), y + ny * (f.r + m)], [x - nx * (f.r + m), y - ny * (f.r + m)])
    }
    for (const [x, y] of [[f.ax, f.ay], [f.bx, f.by]])
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; out.push([x + Math.cos(a) * (f.r + m), y + Math.sin(a) * (f.r + m)]) }
  }
  return out
}
const terraDi = is => [is.costa, ...is.isolotti]
const aTerra = (q, x, y) => q.isole.some(is => terraDi(is).some(a => dentroAnello(a, x, y)))
function distanzaDaCosta(q, x, y) {
  let d = Infinity
  for (const is of q.isole) for (const a of terraDi(is)) for (const [px, py] of a) d = Math.min(d, Math.hypot(px - x, py - y))
  return d
}
const MARGINE_PROVA = 6

/* ═══════════ 1. le coste ═══════════ */
titolo('LE COSTE')
{
  let prove = 0
  for (const W of LARGHEZZE) {
    const q = quadro(meta, W)
    uguale(`${W}px: un'isola per mondo`, q.isole.length, new Set(q.nodi.map(n => n.mondo)).size)
    for (const is of q.isole) {
      controlla(`${W}px ${is.mondo}: la costa è una linea chiusa`, is.costa && is.costa.length > 20 && area(is.costa) > 0)
      // tutto quello che l'isola porta, col margine
      const fuori = []
      for (const f of [...is.deve, ...is.strade]) {
        for (const [x, y] of bordo(f, f.r <= 4 ? MARGINE_PROVA - 2 : MARGINE_PROVA)) {
          prove++
          if (!dentroAnello(is.costa, x, y)) fuori.push(`${Math.round(x)},${Math.round(y)}`)
        }
      }
      uguale(`${W}px ${is.mondo}: tappe, nomi, sentieri e titolo stanno a terra col margine`, fuori.slice(0, 4).join(' '), '')
      for (const n of q.nodi.filter(n => n.mondo === is.mondo))
        controlla(`${W}px ${n.chiave}: il medaglione sta sull'isola del suo mondo`, dentroAnello(is.costa, n.x, n.y))
      const decori = q.decori.filter(d => d.mondo === is.mondo)
      controlla(`${W}px ${is.mondo}: alberi e monti stanno a terra`, decori.every(d => aTerra(q, d.x, d.y)))
    }
    controlla(`${W}px: il mare basso segue le coste`, q.mareBasso.length === 3 && q.mareBasso.every(l => l.anelli.length > 0))
    controlla(`${W}px: la rosa dei venti sta in mare`, !aTerra(q, q.rosa.x, q.rosa.y) && distanzaDaCosta(q, q.rosa.x, q.rosa.y) > 26)
  }
  nota(`${prove} punti di bordo provati`)
}

/* ═══════════ 2. stabili e diverse ═══════════ */
titolo('STABILI E DIVERSE')
{
  const firma = q => JSON.stringify(q.isole.map(is => [is.mondo, is.costa, is.isolotti]))
  for (const W of [320, 390]) {
    dimenticaGeografie()
    const a = firma(quadro(vuoto, W))
    dimenticaGeografie()
    const b = firma(quadro(vuoto, W))
    controlla(`${W}px: ricalcolata da capo, la stessa isola`, a === b)
    dimenticaGeografie()
    controlla(`${W}px: quanto si è giocato non sposta la costa`, firma(quadro(tutto, W)) === a)
  }
  // due mondi, due forme: le coste riportate al loro centro non combaciano
  const q = quadro(vuoto, 390)
  const forma = is => {
    const b = is.costa.reduce((s, [x, y]) => ({ x: s.x + x / is.costa.length, y: s.y + y / is.costa.length }), { x: 0, y: 0 })
    return is.costa.map(([x, y]) => [Math.round((x - b.x) / 4), Math.round((y - b.y) / 4)].join()).sort().join(';')
  }
  const forme = q.isole.map(forma)
  uguale('ogni mondo ha la sua forma', new Set(forme).size, forme.length)
  const piccole = q.isole.filter(is => is.stato === 'arrivo').map(is => Math.round(area(is.costa) / 100))
  // con i mondi per anno di scuola l'isola «in arrivo» è una sola (la prova finale): il confronto vale da due in su
  if (piccole.length > 1)
    controlla('anche le isole piccole non sono tutte uguali', new Set(piccole).size > 1, piccole.join(','))
}

/* ═══════════ 3. il mare fra le isole ═══════════ */
titolo('IL MARE')
{
  for (const W of LARGHEZZE) {
    const q = quadro(meta, W)
    let vicine = Infinity, sopra = 0
    // due isole i cui riquadri distano più di due canali non si guardano punto per punto
    const scatola = c => c.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)],
                                  [Infinity, Infinity, -Infinity, -Infinity])
    const lontane = (a, b) => a[0] - b[2] > 2 * CANALE || b[0] - a[2] > 2 * CANALE ||
                              a[1] - b[3] > 2 * CANALE || b[1] - a[3] > 2 * CANALE
    const scatole = q.isole.map(is => scatola(is.costa))
    for (let i = 0; i < q.isole.length; i++) for (let j = i + 1; j < q.isole.length; j++) {
      const A = q.isole[i], B = q.isole[j]
      if (lontane(scatole[i], scatole[j])) continue
      for (const p of A.costa) {
        if (dentroAnello(B.costa, p[0], p[1])) sopra++
        for (const r of B.costa) vicine = Math.min(vicine, Math.hypot(p[0] - r[0], p[1] - r[1]))
      }
    }
    uguale(`${W}px: nessuna isola ne tocca un'altra`, sopra, 0)
    controlla(`${W}px: fra due isole c'è almeno un canale`, vicine >= CANALE * 0.6, Math.round(vicine) + 'px')
    const rotte = q.sentieri.filter(s => s.tipo === 'fra')
    // una rotta per ogni dipendenza dalla fila appena sopra (la fila dei mondi per anno è dritta: prima → … → quinta → prova)
    controlla(`${W}px: i mondi collegati hanno una rotta`, rotte.length >= MONDI.filter(m => m.dopo.length || (m.dopoUno || []).length).length,
              rotte.length)
    const aTerraR = rotte.filter(r => r.punti.some(([x, y]) => aTerra(q, x, y)))
    uguale(`${W}px: le rotte fra i mondi stanno in mare`, aTerraR.map(r => r.da + '→' + r.a).join(), '')
    // disegnate, le rotte non si ripassano: due che partono dallo stesso porto fanno un ramo
    const tratti = rotte.flatMap(r => r.tratti)
    let binari = 0
    for (let i = 0; i < rotte.length; i++) for (let j = i + 1; j < rotte.length; j++)
      for (const a of rotte[i].tratti) for (const b of rotte[j].tratti)
        for (const p of a) if (b.some(r => Math.hypot(p[0] - r[0], p[1] - r[1]) < 4)) binari++
    controlla(`${W}px: due rotte disegnate non si ripassano`, binari <= 2 * rotte.length, binari)
    nota(`${W}px: canale più stretto ${Math.round(vicine)}px, ${tratti.length} tratti di rotta`)
  }
}

/* ═══════════ 4. la nave ═══════════ */
titolo('LA NAVE')
{
  for (const W of LARGHEZZE) {
    const q = quadro(tutto, W)
    const toccabili = q.nodi.filter(n => n.tipo !== 'mondo')
    const senza = q.nodi.filter(n => !n.porto).map(n => n.chiave)
    uguale(`${W}px: ogni nodo ha il suo attracco`, senza.join(), '')
    const male = toccabili.filter(n => aTerra(q, n.porto.x, n.porto.y) || !navigabile(q.mare, n.porto.x, n.porto.y))
    uguale(`${W}px: ogni attracco sta in mare aperto`, male.map(n => n.chiave).join(), '')
    const lontani = toccabili.filter(n => Math.hypot(n.porto.x - n.x, n.porto.y - n.y) > 140)
    uguale(`${W}px: ogni attracco sta accanto alla sua tappa`, lontani.map(n => n.chiave).join(), '')
    if (W !== 320 && W !== 390) continue
    // Il mare è uno e una rotta vale nei due sensi: se ogni porto arriva al
    // primo, la nave va da ogni porto a ogni altro. Provarle tutte le coppie
    // (4830 viaggi) non diceva di più e passava i quattro minuti sulla CI; in
    // più ogni porto fa un viaggio verso un altro scelto a passo fisso, perché
    // la rotta sfoltita non tagli la terra anche fra isole lontane.
    let viaggi = 0, lunga = 0
    const guasti = []
    const coppie = toccabili.flatMap((a, i) => [[a, toccabili[0]], [a, toccabili[(i * 7 + 13) % toccabili.length]]])
    for (const [a, b] of coppie) {
      if (a === b) continue
      const r = rotta(q.mare, a.porto, b.porto)
      viaggi++
      if (!r) { guasti.push(a.chiave + '→' + b.chiave + ' senza rotta'); continue }
      if (r.some(([x, y]) => aTerra(q, x, y))) guasti.push(a.chiave + '→' + b.chiave + ' passa sulla terra')
      const [x0, y0] = r[0], [x1, y1] = r[r.length - 1]
      if (Math.hypot(x0 - a.porto.x, y0 - a.porto.y) > 1 || Math.hypot(x1 - b.porto.x, y1 - b.porto.y) > 1)
        guasti.push(a.chiave + '→' + b.chiave + ' non parte o non arriva al porto')
      lunga = Math.max(lunga, lunghezza(r))
    }
    uguale(`${W}px: da ogni attracco la nave arriva a ogni altro per mare`, guasti.slice(0, 3).join(' · '), '')
    controlla(`${W}px: anche la traversata più lunga dura meno di un secondo e mezzo`, durata(lunga) < 1.5 && DURATA_MAX < 1.5)
    nota(`${W}px: ${viaggi} viaggi, il più lungo ${Math.round(lunga)}px in ${durata(lunga).toFixed(2)}s`)
  }
  // lungo la rotta: si parte dal primo punto e si arriva all'ultimo
  const r = [[0, 0], [10, 0], [10, 10]]
  uguale('lungo: all’inizio sta al primo punto', [lungo(r, 0).x, lungo(r, 0).y].join(), '0,0')
  uguale('lungo: alla fine sta all’ultimo', [lungo(r, 1).x, lungo(r, 1).y].join(), '10,10')
  uguale('lungo: a metà strada sta a metà', [lungo(r, 0.5).x, lungo(r, 0.5).y].join(), '10,0')
  // della rotta si naviga il pezzo che si vede
  const alta = [[0, 0], [0, 500], [0, 1000], [0, 1500]]
  uguale('pezzoVisibile: si parte dall’ultimo punto fuori dallo schermo', pezzoVisibile(alta, 1200, 1800).map(p => p[1]).join(), '1000,1500')
  uguale('pezzoVisibile: tutto visibile, tutta la rotta', pezzoVisibile(alta, 0, 2000).length, 4)
  // sfoltire: due rotte sullo stesso mare, la seconda si disegna solo dove si stacca
  const [p, s] = sfoltisci([{ punti: [[0, 0], [0, 300]], battuto: true },
                           { punti: [[0, 0], [0, 200], [100, 250]], battuto: false }])
  controlla('sfoltisci: la prima si disegna tutta', p.tratti.length === 1)
  controlla('sfoltisci: la seconda solo il ramo che si stacca', s.tratti.length === 1 && s.tratti[0][0][1] >= 190)
  controlla('e la nave la naviga tutta', s.punti.length === 3)
  controlla('una nave vuole acqua larga', NAVE >= 10)
}

/* ═══════════ 5. dove sta la nave, e cosa serve ═══════════ */
titolo('DOVE STA LA NAVE')
{
  const q = quadro(vuoto, 390)
  uguale('a profilo vuoto la nave sta alla prima tappa', doveStaLaNave(q, null).chiave, 'tappa:prima-colori')
  uguale('un porto chiuso non vale: si torna alla tappa di adesso',
         doveStaLaNave(q, 'tappa:prima-animali').chiave, 'tappa:prima-colori')
  const m = quadro(meta, 390)
  uguale('a metà mondo la nave sta alla tappa da fare', doveStaLaNave(m, null).chiave, 'tappa:prima-giocattoli')
  uguale('ma resta dov’era, se lì si può andare', doveStaLaNave(m, 'tappa:prima-ciao').chiave, 'tappa:prima-ciao')
  const t = quadro(tutto, 390)
  controlla('a mondi finiti sta su una tappa vinta', doveStaLaNave(t, null).stato === 'vinta')

  const s = statoMappa(vuoto, () => 0)
  const n = k => q.nodi.find(x => x.chiave === k)
  uguale('una tappa chiusa dice quale vincere prima', cosaServe(s, n('tappa:prima-numeri')), 'Prima vinci «Questo è…»')
  uguale('un mondo chiuso dice quale finire prima', cosaServe(s, n('tappa:seconda-corpo')), 'Prima finisci «Il prato in fiore»')
  uguale('nessun mondo «in arrivo» sulla mappa', q.nodi.filter(x => x.tipo === 'mondo').length, 0)
  controlla('il libro si apre con la bandiera', /bandiera/.test(cosaServe(s, n('libro:prima'))))

  // l'età non apre mondi: un mondo con una tappa vinta resta aperto, ma non conta come finito
  const sq = statoMappa({ vinte: { 'quarta-giornata': 1 } }, () => 0, { eta: 10 })
  const qq = disponi(sq, 390, extra)
  uguale('un mondo aperto da una tappa vinta: il cartiglio di quello dopo chiede lui',
         cosaServe(sq, qq.nodi.find(x => x.chiave === 'tappa:quinta-citta')), 'Prima finisci «Il fortino d’inverno»')
}

/* ═══════════ 6. quanto costa ═══════════ */
titolo('QUANTO COSTA')
{
  dimenticaGeografie()
  const t0 = performance.now()
  quadro(meta, 390)
  const prima = performance.now() - t0
  const t1 = performance.now()
  quadro(tutto, 390)
  const dopo = performance.now() - t1
  // la macchina della CI è due volte più lenta di un computer di casa (520 ms contro 263): lì il tetto raddoppia
  const tetto = process.env.CI ? 1000 : 500
  controlla(`la geografia si calcola in meno di ${tetto} ms`, prima < tetto, Math.round(prima) + 'ms')
  controlla('e tornando alla mappa non si ricalcola', dopo < 20, Math.round(dopo) + 'ms')
  nota(`disposizione a 390px: ${Math.round(prima)}ms la prima volta, ${dopo.toFixed(1)}ms le altre`)
}

riassunto('le isole della mappa del tesoro, e la nave')
