/* ═══════════════════════════════════════════════════════════════════
   LA STRADA VERSO LA META, DI SOPRA — docs/sotterraneo/mondo-3d-la-meta.md

   Il campo delle distanze dalla meta, la strada da una cella qualunque
   (sempre dove si cammina, mai un angolo tagliato, lunga quanto l'A*
   di motore/terra.js), le grate chiuse che la fermano, le celle del
   velo che si apre attorno, le luci della scia e i passi detti.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondo, aperturaDi, terraDelMondo, postiDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { campoVersoLaMeta, celleDelVelo, luciDellaStrada, piuVicina, passiDetti } from '../../src/giochi/sotterraneo/motore/meta-sopra.js'
import { creaTerra } from '../../src/giochi/sotterraneo/motore/terra.js'
import { trameDellaNebbia, segnaScoperte, apriIlVelo, MAI } from '../../src/giochi/sotterraneo/scena3d/mondo/nebbia.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondo()
const terra = terraDelMondo(m, aperturaDi([]).aperto)
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

/* ── le grate chiuse fermano la strada: oltre l'anello aperto non ci si arriva ── */
{
  const lontano = postiDi(m, 'ingresso').find(p => p.chiave === 'fondo')
  const chiusa = campoVersoLaMeta(terra, lontano.accanto)
  controlla('con le grate calate la miniera non si raggiunge', !chiusa || chiusa.strada(m.partenza) === null)
  const aperta = campoVersoLaMeta(terraDelMondo(m, () => true), lontano.accanto)
  controlla('con le grate alzate sì', !!aperta.strada(m.partenza))
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

/* ── i passi detti al bambino ── */
uguale('arrivati', passiDetti(1.4), 'sei arrivato')
uguale('a due passi', passiDetti(7), 'qui vicino')
uguale('a cinque per volta', passiDetti(43), 'a 45 passi')
uguale('senza strada, niente', passiDetti(Infinity), '')

riassunto('la strada verso la meta')
