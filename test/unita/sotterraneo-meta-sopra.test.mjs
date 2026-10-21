/* ═══════════════════════════════════════════════════════════════════
   LA STRADA VERSO LA META, DI SOPRA — docs/sotterraneo/mondo-3d-la-meta.md

   Il campo delle distanze dalla meta, la strada da una cella qualunque
   (sempre dove si cammina, mai un angolo tagliato, lunga quanto l'A*
   di motore/terra.js), la meta lontana in una zona non caricata che
   si raggiunge a pezzi lungo la strada maestra, le celle del velo che
   si apre attorno, le luci della scia e i passi detti. E quale meta:
   solo quella scelta nel diario, di difetto la storia.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondo, terraDelMondo, postiDi, seguiLEroe, zonaDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { metaScelta, campoVersoLaMeta, metaVicina, celleDelVelo, luciDellaStrada, piuVicina, passiDetti } from '../../src/giochi/sotterraneo/motore/meta-sopra.js'
import { MISSIONI } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { SEGUI_LA_STORIA } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { creaTerra } from '../../src/giochi/sotterraneo/motore/terra.js'
import { baseDi } from '../../src/giochi/sotterraneo/motore/mondo-percorso.js'
import { trameDellaNebbia, segnaScoperte, apriIlVelo, MAI } from '../../src/giochi/sotterraneo/scena3d/mondo/nebbia.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondo()
const terra = terraDelMondo(m)
const cripta = postiDi(m, 'ingresso').find(p => p.chiave === 'altare')
const lunga = via => via.reduce((s, c, i) => s + (i === 0 ? 0 : Math.hypot(c.x - via[i - 1].x, c.y - via[i - 1].y)), 0)

/* ── dal villaggio alla cripta dei re, la prima volta ── */
{
  const t0 = performance.now()
  const campo = campoVersoLaMeta(terra, cripta.accanto)
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
  controlla('e corta quanto quella dell\'A*', Math.abs(passi - lunga([m.partenza, ...astar])) < 0.01, `${passi} contro ${lunga([m.partenza, ...astar])}`)
  uguale('alla meta zero passi', campo.passi(cripta.accanto.x, cripta.accanto.y), 0)
  uguale('dalla meta la strada è vuota', campo.strada(cripta.accanto).length, 0)
  controlla('la cripta è vicina: meno di cento passi dalla piazza', passi < 100, Math.round(passi))
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
