/* ═══════════════════════════════════════════════════════════════════
   LA STRADA VERSO LA META, DI SOPRA — docs/sotterraneo/mondo-3d-la-meta.md

   Il campo delle distanze dalla meta, la strada da una cella qualunque
   (sempre dove si cammina, mai un angolo tagliato; la strada vera,
   lontano dalle case, lunga al più il limite del più corto: motore/
   strada-sopra.js), la meta lontana in una zona non caricata che
   si raggiunge a pezzi lungo la strada maestra, le celle del velo che
   si apre attorno, le luci della scia e i passi detti. E quale meta:
   solo quella scelta nel diario, di difetto la storia.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondo, terraDelMondo, postiDi, seguiLEroe, zonaDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { metaScelta, campoVersoLaMeta, metaVicina, celleDelVelo, luciDellaStrada, piuVicina, passiDetti } from '../../src/giochi/sotterraneo/motore/meta-sopra.js'
import { MISSIONI } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { SEGUI_LA_STORIA } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { stradaDelMondo, stradaPesata, LIMITE, MARGINE } from '../../src/giochi/sotterraneo/motore/strada-sopra.js'
import { creaTerra } from '../../src/giochi/sotterraneo/motore/terra.js'
import { baseDi } from '../../src/giochi/sotterraneo/motore/mondo-percorso.js'
import { trameDellaNebbia, segnaScoperte, apriIlVelo, MAI } from '../../src/giochi/sotterraneo/scena3d/mondo/nebbia.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondo()
const terra = terraDelMondo(m)
const cripta = postiDi(m, 'ingresso').find(p => p.chiave === 'altare')
const sd = stradaDelMondo(m)
const lunga = via => via.reduce((s, c, i) => s + (i === 0 ? 0 : Math.hypot(c.x - via[i - 1].x, c.y - via[i - 1].y)), 0)

/* ── dal villaggio alla cripta dei re, la prima volta ── */
{
  const t0 = performance.now()
  const campo = campoVersoLaMeta(terra, cripta.accanto, sd)
  const ms = performance.now() - t0
  controlla('il campo verso la cripta si fa in fretta', ms < 200, `${Math.round(ms)} ms`)
  const via = campo.strada(m.partenza)
  controlla('dalla piazza alla cripta c\'è la strada', !!via && via.length > 10, via && via.length)
  const fine = via[via.length - 1]
  uguale('e finisce davanti all\'ingresso', `${fine.x},${fine.y}`, `${cripta.accanto.x},${cripta.accanto.y}`)
  controlla('ogni cella si cammina', via.every(c => terra.passa(c.x, c.y)))
  let prima = m.partenza, angoli = 0, salti = 0
  for (const c of via) {
    const dx = c.x - prima.x, dy = c.y - prima.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== 1) salti++
    if (dx && dy && (!terra.passa(prima.x + dx, prima.y) || !terra.passa(prima.x, prima.y + dy))) angoli++
    prima = c
  }
  uguale('un passo per volta, mai un salto', salti, 0)
  uguale('e nessun angolo tagliato', angoli, 0)
  const passi = campo.passi(m.partenza.x, m.partenza.y)
  const astar = terra.strada(m.partenza, cripta.accanto)
  controlla('i passi sono la lunghezza della strada', Math.abs(passi - lunga([m.partenza, ...via])) < 0.01, `${passi} contro ${lunga([m.partenza, ...via])}`)
  const corta = lunga([m.partenza, ...astar])
  controlla('non più lunga del limite sulla più corta (quella dell\'A*)', passi >= corta - 0.01 && passi <= corta * LIMITE + MARGINE, `${passi} contro ${corta}`)
  uguale('alla meta zero passi', campo.passi(cripta.accanto.x, cripta.accanto.y), 0)
  uguale('dalla meta la strada è vuota', campo.strada(cripta.accanto).length, 0)
  controlla('la cripta è vicina: meno di cento passi dalla piazza', passi < 100, Math.round(passi))
}

/* ── la strada vera: sulla strada dove c'è, lontano dalle case, non più lunga del limite ── */
{
  const metas = postiDi(m, 'ingresso').map(p => p.accanto).filter(a => terra.passa(a.x, a.y))
  let seme = 12345
  const rnd = () => (seme = (seme * 1664525 + 1013904223) >>> 0) / 2 ** 32
  const celle = []
  for (let y = 0; y < terra.A; y++) for (let x = 0; x < terra.L; x++) if (terra.passa(x, y)) celle.push({ x, y })
  const aUno = c => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && !terra.passa(c.x + dx, c.y + dy)) return true; return false }
  let coppie = 0, strada = 0, stradaCorta = 0, celleTot = 0, celleCorte = 0, stretteForte = 0, stretteCorte = 0, passiOk = true
  const rapporti = []
  for (const meta of metas) {
    const corto = campoVersoLaMeta(terra, meta), forte = campoVersoLaMeta(terra, meta, sd)
    for (let i = 0; i < 8; i++) {
      const da = celle[Math.floor(rnd() * celle.length)], pc = corto.passi(da.x, da.y)
      if (!Number.isFinite(pc) || pc < 20) continue
      coppie++
      const pf = forte.passi(da.x, da.y), via = forte.strada(da), v0 = corto.strada(da)
      rapporti.push(pf / pc)
      controlla(`coppia ${coppie}: raggiungibile come col più corto, e non oltre il limite`, Number.isFinite(pf) && pf >= pc - 0.01 && pf <= pc * LIMITE + MARGINE + 0.01, `${pf} contro ${pc}`)
      const fine = via[via.length - 1]
      if (Math.abs(pf - lunga([da, ...via])) > 0.01 || `${fine.x},${fine.y}` !== `${meta.x},${meta.y}` || !via.every(c => terra.passa(c.x, c.y))) passiOk = false
      for (const c of via) { celleTot++; if (sd(c.x, c.y) > 0) strada++; else if (aUno(c)) stretteForte++ }
      for (const c of v0) { celleCorte++; if (sd(c.x, c.y) > 0) stradaCorta++; else if (aUno(c)) stretteCorte++ }
    }
  }
  controlla('almeno venti coppie provate', coppie >= 20, coppie)
  controlla('i passi sono la lunghezza del tragitto scelto, che arriva alla meta dove si cammina', passiOk)
  const media = rapporti.reduce((a, b) => a + b, 0) / rapporti.length
  nota(`${coppie} coppie: il tragitto è lungo in media ${media.toFixed(2)}× il più corto, al massimo ${Math.max(...rapporti).toFixed(2)}×; sulla strada ${Math.round(100 * strada / celleTot)}% (il più corto ${Math.round(100 * stradaCorta / celleCorte)}%); sull'erba a ridosso di un muro ${Math.round(100 * stretteForte / celleTot)}% (il più corto ${Math.round(100 * stretteCorte / celleCorte)}%)`)
  controlla('segue la strada molto più del più corto', strada / celleTot > 0.5 && strada / celleTot > 2 * stradaCorta / celleCorte, `${strada / celleTot} contro ${stradaCorta / celleCorte}`)
  controlla('e sta lontano dai muri molto più del più corto', stretteForte / celleTot < 0.05 && stretteForte / celleTot < stretteCorte / celleCorte / 4, `${stretteForte / celleTot} contro ${stretteCorte / celleCorte}`)
  uguale('lo stesso campo dà la stessa strada (determinismo)', JSON.stringify(campoVersoLaMeta(terra, metas[0], sd).strada(m.partenza)), JSON.stringify(campoVersoLaMeta(terra, metas[0], sd).strada(m.partenza)))
  // il villaggio: dalla piazza la scia verso la cripta esce lungo la strada, non fra le case
  const campo = campoVersoLaMeta(terra, cripta.accanto, sd)
  const dalla = campo.strada(m.partenza)
  const nelVillaggio = dalla.filter(c => c.x < m.villaggio.x + m.villaggio.w + 2 && c.y < m.villaggio.y + m.villaggio.h)
  const suStrada = nelVillaggio.filter(c => sd(c.x, c.y) > 0).length
  controlla('dalla piazza la scia sta sulla strada finché è nel villaggio', nelVillaggio.length > 5 && suStrada >= nelVillaggio.length * 0.9, `${suStrada}/${nelVillaggio.length}`)
  const lis = campo.liscia(m.partenza, dalla)
  controlla('la lisciata tiene pochi punti e arriva alla meta', lis.length > 1 && lis.length < dalla.length / 2 && `${lis[lis.length - 1].x},${lis[lis.length - 1].y}` === `${cripta.accanto.x},${cripta.accanto.y}`, lis.length)
  // il tempo: il campo si rifà a ogni cambio di meta o di zona (a caldo, in Node: sul telefono ×3–5)
  const t0 = performance.now()
  for (const meta of metas) campoVersoLaMeta(terra, meta, sd)
  const ms = (performance.now() - t0) / metas.length
  nota(`il campo pesato: ${ms.toFixed(1)} ms a meta (a caldo)`)
  controlla('il campo pesato si fa in fretta', ms < 60, `${Math.round(ms)} ms`)
  const t1 = performance.now()
  for (const meta of metas) stradaPesata(terra, sd, m.partenza, meta)
  const mt = (performance.now() - t1) / metas.length
  nota(`il cammino a tocco: ${mt.toFixed(1)} ms`)
  controlla('e il cammino a tocco pure', mt < 60, `${Math.round(mt)} ms`)
  uguale('a tocco: la stessa strada del campo', JSON.stringify(stradaPesata(terra, sd, m.partenza, cripta.accanto).via), JSON.stringify(dalla))
  uguale('a tocco: già lì, niente da fare', stradaPesata(terra, sd, m.partenza, m.partenza).via.length, 0)
}

/* ── su una mappa fatta a mano: la strada, le case, il varco stretto ── */
{
  const mappa = (L, A, muri = [], vie = []) => {
    const righe = Array.from({ length: A }, () => Array(L).fill('.'))
    for (const [x, y, w, h] of muri) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) righe[y + j][x + i] = '#'
    const strada = new Set(vie.map(([x, y]) => y * L + x))
    return { t: creaTerra(righe.map(r => r.join(''))), s: (x, y) => (strada.has(y * L + x) ? 1 : 0) }
  }
  const linea = (x0, y0, x1, y1) => { const v = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) v.push([x, y]); return v }

  // 1. una strada a L in mezzo al prato: la scia la segue, e la lisciata non ne taglia l'angolo sull'erba
  {
    const { t, s } = mappa(36, 26, [], [...linea(2, 2, 2, 22), ...linea(2, 22, 30, 22)])
    const sp = stradaPesata(t, s, { x: 2, y: 2 }, { x: 30, y: 22 })
    const su = sp.via.filter(c => s(c.x, c.y) > 0).length
    controlla('una strada a L: la scia la segue', su >= sp.via.length * 0.9, `${su}/${sp.via.length}`)
    const lis = sp.liscia(sp.via)
    controlla('e la lisciata gira dove gira la strada', lis.some(c => c.x <= 4 && c.y >= 20), JSON.stringify(lis))
  }
  // 2. una strada troppo lontana (allungherebbe oltre il limite) non si cerca: si va diritti
  {
    const { t, s } = mappa(60, 40, [], linea(0, 38, 59, 38))
    const v = stradaPesata(t, s, { x: 2, y: 2 }, { x: 56, y: 2 }).via
    controlla('una strada lontana non si cerca', v.length <= 56 && v.every(c => s(c.x, c.y) === 0), v.length)
  }
  // 3. due case con un varco di due celle: se girare attorno costa poco non ci si passa in mezzo; se non c'è altra via sì
  {
    // due case una sopra l'altra (x 12–14) con un varco fra loro: attorno, sopra, ci sono tre righe di prato
    const dentroIlVarco = c => c.x >= 12 && c.x <= 14 && c.y >= 8 && c.y <= 9
    const stretto = mappa(30, 16, [[12, 5, 3, 3], [12, 10, 3, 3]])
    const v = stradaPesata(stretto.t, stretto.s, { x: 3, y: 8 }, { x: 26, y: 8 }).via
    controlla('un varco di due celle fra due case: si gira attorno', v.length > 0 && !v.some(dentroIlVarco), JSON.stringify(v.filter(c => c.x >= 11 && c.x <= 15)))
    // se girare attorno allungherebbe troppo (le case chiudono il prato) il varco si prende, ma si arriva: mai un buco
    const chiuso = mappa(30, 16, [[12, 0, 3, 8], [12, 10, 3, 6]])
    const v2 = stradaPesata(chiuso.t, chiuso.s, { x: 3, y: 8 }, { x: 26, y: 8 }).via
    controlla('se altra via non c\'è, ci si passa lo stesso', v2 && v2.some(dentroIlVarco) && `${v2[v2.length - 1].x},${v2[v2.length - 1].y}` === '26,8', v2 && v2.length)
    const largo = mappa(30, 16, [[12, 0, 3, 5], [12, 11, 3, 5]])
    const v3 = stradaPesata(largo.t, largo.s, { x: 3, y: 8 }, { x: 26, y: 8 }).via
    controlla('un varco largo sei è una via diritta', v3.length <= 24 && v3.some(c => c.x === 13 && c.y >= 6 && c.y <= 9), v3.length)
  }
  // 4. dove non si arriva, nessuna strada
  {
    const { t, s } = mappa(12, 6, [[5, 0, 1, 6]])
    uguale('un muro intero: nessuna strada', stradaPesata(t, s, { x: 1, y: 2 }, { x: 9, y: 2 }), null)
    uguale('e nel campo, passi infiniti', campoVersoLaMeta(t, { x: 9, y: 2 }, s).passi(1, 2), Infinity)
    uguale('e nessuna strada', campoVersoLaMeta(t, { x: 9, y: 2 }, s).strada({ x: 1, y: 2 }), null)
  }
}

/* ── una meta lontana, in una zona non caricata: la strada maestra fin dove si cammina, poi la zona dopo ── */
{
  const lontano = postiDi(m, 'ingresso').find(p => p.chiave === 'labirinto')
  uguale('la porta dell\'inferno, nelle ceneri mai caricate, non ha campo', campoVersoLaMeta(terra, lontano.accanto), null)
  const v = metaVicina(m, terra, lontano.accanto)
  controlla('la meta vicina sta sulla strada maestra, dove si cammina', !!v && v.lontana && terra.passa(v.x, v.y), JSON.stringify(v))
  uguale('in fondo al bosco, l\'ultima zona caricata', zonaDi(m, v.x, v.y), 1)
  controlla('e ci si arriva dalla piazza', !!campoVersoLaMeta(terra, v).strada(m.partenza))
  uguale('una meta dove si cammina è lei', JSON.stringify(metaVicina(m, terra, cripta.accanto)), JSON.stringify({ ...cripta.accanto, lontana: false }))
  // arrivati lì si carica la zona dopo, e la meta va avanti: a pezzi si arriva alla porta
  let qui = v, giri = 0
  for (; giri < 6; giri++) {
    seguiLEroe(m, qui.x, qui.y)
    const t = terraDelMondo(m), p = metaVicina(m, t, lontano.accanto)
    if (!p.lontana) { qui = p; break }
    controlla(`a pezzi: il punto ${giri + 1} va avanti`, baseDi(m, p.x, p.y).arco > baseDi(m, qui.x, qui.y).arco)
    qui = p
  }
  uguale('in pochi pezzi la porta è sulla terra', `${qui.x},${qui.y}`, `${lontano.accanto.x},${lontano.accanto.y}`)
  seguiLEroe(m, m.partenza.x, m.partenza.y)
  uguale('una meta dove non si cammina non ha campo', campoVersoLaMeta(creaTerra(['#.', '..']), { x: 0, y: 0 }), null)
}

/* ── il velo: le celle attorno alla strada, dentro la mappa, senza doppioni ── */
{
  const via = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
  const v = celleDelVelo(via, 10, 10, 1.5)
  controlla('le celle della strada ci sono', [0, 1, 2].every(k => v.includes(k)))
  controlla('e quelle accanto', v.includes(10 + 1) && v.includes(3))
  controlla('ma non quelle lontane', !v.includes(5) && !v.includes(30))
  uguale('niente doppioni', new Set(v).size, v.length)
  controlla('niente fuori dalla mappa', v.every(k => k >= 0 && k < 100))
}

/* ── il velo nelle trame della nebbia: si vede, non si salva, e si richiude ── */
{
  const bit = new Uint8Array(16)
  bit[0] = 1
  const tr = trameDellaNebbia(bit)
  let aperte = apriIlVelo(new Set(), [0, 1, 2], bit, tr, 5)
  controlla('le celle del velo si disegnano viste', tr.visto[1] === 255 && tr.visto[2] === 255)
  uguale('e salgono da adesso', tr.quando[1], 5)
  uguale('quella vista davvero tiene il suo tempo', tr.quando[0], -100)
  uguale('il bit che si salva non cambia', [...bit].join(''), '1000000000000000')
  segnaScoperte([{ x: 2, y: 0 }], 4, tr, 9)
  uguale('scoperta camminando, una cella del velo non risale', tr.quando[2], 5)
  bit[2] = 1
  aperte = apriIlVelo(aperte, [3], bit, tr, 12)
  uguale('cambiata la strada, quella di prima torna nuvola', tr.visto[1], 0)
  uguale('e torna «mai vista»', tr.quando[1], MAI)
  uguale('ma quella vista davvero resta', tr.visto[2], 255)
  controlla('e la nuova si apre', tr.visto[3] === 255 && aperte.has(3) && !aperte.has(1))
}

/* ── le luci della scia: una ogni tanto, l'ultima sulla meta ── */
{
  const luci = luciDellaStrada([{ x: 0.5, z: 0.5 }, { x: 10.5, z: 0.5 }, { x: 10.5, z: 6.5 }], 2)
  uguale('sedici celle di strada: otto luci e la meta', luci.length, 9)
  const ul = luci[luci.length - 1]
  uguale('l\'ultima è sulla meta', `${ul.x},${ul.z}`, '10.5,6.5')
  controlla('mai più lontane di un passo di scia e un quarto', luci.slice(1).every((q, i) => Math.hypot(q.x - luci[i].x, q.z - luci[i].z) <= 2.51))
  uguale('la più vicina all\'eroe', piuVicina(luci, 10.4, 2.4).i, 5)
  uguale('una strada di un punto è una luce sola', luciDellaStrada([{ x: 3, z: 3 }]).length, 1)
}

/* ── quale meta: solo dal selettore del diario, di difetto la storia ── */
{
  const TAGLIA = 't:villaggio:mappa:mulino:0', GIU = MISSIONI.find(x => x.discesa).id, ALTRA = MISSIONI.filter(x => x.discesa)[1].id
  const stessa = (nome, a, b) => uguale(nome, JSON.stringify(a), JSON.stringify(b))
  const stati = { [TAGLIA]: 'presa', [GIU]: 'presa', [ALTRA]: 'fatta' }
  stessa('niente scelto: la storia', metaScelta(stati, null, 'cantine'), { tipo: 'storia', discesa: 'cantine' })
  stessa('anche con missioni e consegne in mano (nessuna comodità)', metaScelta(stati, undefined, 'torre'), { tipo: 'storia', discesa: 'torre' })
  stessa('«segui la storia»', metaScelta(stati, SEGUI_LA_STORIA, 'cantine'), { tipo: 'storia', discesa: 'cantine' })
  stessa('una taglia scelta', metaScelta(stati, TAGLIA, 'cantine'), { tipo: 'taglia', id: TAGLIA, fatta: false })
  stessa('una missione scelta', metaScelta(stati, GIU, 'cantine'), { tipo: 'missione', id: GIU, fatta: false })
  stessa('fatta resta la meta: si va a consegnarla', metaScelta(stati, ALTRA, 'cantine'), { tipo: 'missione', id: ALTRA, fatta: true })
  stessa('consegnata la scelta decade: torna la storia', metaScelta({ ...stati, [TAGLIA]: 'consegnata' }, TAGLIA, 'cantine'), { tipo: 'storia', discesa: 'cantine' })
  stessa('un id che non c\'è più: la storia', metaScelta({ 'boh': 'presa' }, 'boh', 'cantine'), { tipo: 'storia', discesa: 'cantine' })
  stessa('storia finita e niente scelto: nessuna meta', metaScelta(stati, null, null), null)
  stessa('la stessa scelta dà la stessa meta: non guarda dove si è', JSON.stringify(metaScelta(stati, GIU, 'cantine')), JSON.stringify(metaScelta(stati, GIU, 'cantine')))
}

/* ── i passi detti al bambino ── */
uguale('arrivati', passiDetti(1.4), 'sei arrivato')
uguale('a due passi', passiDetti(7), 'qui vicino')
uguale('a cinque per volta', passiDetti(43), 'a 45 passi')
uguale('senza strada, niente', passiDetti(Infinity), '')

riassunto('la strada verso la meta')
