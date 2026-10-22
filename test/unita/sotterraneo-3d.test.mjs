/* Il Sotterraneo 3D senza browser (docs/sotterraneo/grafica-3d.md): la parte pura del disegno, sui piani veri del motore.

   L'aspetto di ogni ambientazione; la pianta tradotta in pezzi (pavimento, muri alti e parapetti, colonne, acqua, torce) per tutte
   le discese e per l'abisso; la maschera che copia la luce del motore (visto, ricordato, mai visto, la luce di scena del palco);
   il palco dello scontro sul pavimento vero (con l'agio dai muri, mai sull'arredo né oltre un muro); il tocco da punta-e-clicca
   (la cella più vicina a cui si arriva, la porta sulla strada); le figure tutte in un InstancedMesh solo.
   `node test/esegui.mjs sotterraneo-3d --niente-build` */
import { CAMPAGNA, L_ABISSO, TRATTI_DELL_ABISSO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { SCENARI } from '../../src/giochi/sotterraneo/dati/tessere.js'
import { ROCCIA, ACQUA } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { PEZZI } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { aspettoDi, guastiDegliAspetti, ASPETTI_3D } from '../../src/giochi/sotterraneo/scena3d/aspetti.js'
import { piantaDi } from '../../src/giochi/sotterraneo/scena3d/pianta.js'
import { nuovaVisibilita, aggiornaVisibilita, scriviTexel } from '../../src/giochi/sotterraneo/scena3d/visibilita.js'
import { disponiPalco } from '../../src/giochi/sotterraneo/scena3d/palco.js'
import { vicinoA, portaSullaStrada, creaAzione } from '../../src/giochi/sotterraneo/scena3d/azione.js'
import { usabile } from '../../src/giochi/sotterraneo/scena3d/dito.js'
import { creaFigure } from '../../src/giochi/sotterraneo/scena3d/figure.js'
import { creaMaschera } from '../../src/giochi/sotterraneo/scena3d/maschera.js'
import { BOTTI_PER_PAESAGGIO } from '../../src/giochi/sotterraneo/dati/botti.js'
import { AGIO, FIGURE_MAX } from '../../src/giochi/sotterraneo/scena3d/costanti.js'
import { Scene, InstancedMesh } from 'three'
import { gemelloDi } from '../../src/data/portata-giochi.js'
import { gioco as giocoNuovo } from '../../src/giochi/indice.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const corsaDi = (tappa, seme) => new Corsa(tappa, { seme, rnd: seminato(seme) })

/* ══════════ 1. ogni ambientazione ha il suo aspetto ══════════ */
{
  uguale('gli aspetti 3D non hanno guasti', guastiDegliAspetti().join(' · '), '')
  for (const t of [...CAMPAGNA, ...TRATTI_DELL_ABISSO]) controlla(`${t.nome || t.scenario}: lo scenario ${t.scenario} ha il suo aspetto`, !!ASPETTI_3D[t.scenario])
  uguale('chi non dichiara lo scenario prende quello di ripiego', aspettoDi(null).chiave, 'cantine')
  uguale('la roccia viene dallo scenario vero', aspettoDi('cripta').roccia, SCENARI.cripta.colori.roccia)
  controlla('nell\'inferno niente botti (docs/sotterraneo/arredo.md)', !BOTTI_PER_PAESAGGIO.inferno)
  controlla('nell\'inferno la fonte è lava', aspettoDi('inferno').acqua.lava === 1)
}

/* ══════════ 2. la pianta: tutti i piani veri, tutte le forme ══════════ */
const piani = []
for (const [i, t] of CAMPAGNA.entries()) for (let p = 0; p < Math.min(2, t.piani); p++) {
  const c = corsaDi(t, 31 + i * 7)
  if (p) { c.piano = p; c.nuovoPiano() }
  piani.push({ nome: `${t.nome} piano ${p + 1}`, c })
}
for (const p of [0, 6, 12]) { const c = corsaDi(L_ABISSO, 5); if (p) { c.piano = p; c.nuovoPiano() } piani.push({ nome: `abisso piano ${p + 1}`, c }) }
{
  let colonne = 0, acqua = 0, torce = 0, parapetti = 0
  for (const { nome, c } of piani) {
    const liv = c.livello, pi = piantaDi(liv)
    const pav = new Set(pi.pavimento.map(q => pi.id(q.x, q.y)))
    let senzaPav = 0, muroSolo = 0, parapettoMale = 0, torciaMale = 0, colonnaFuori = 0
    for (let y = 0; y < liv.alto; y++) for (let x = 0; x < liv.largo; x++) if (liv.a(x, y) !== ROCCIA && !pav.has(pi.id(x, y))) senzaPav++
    for (const m of pi.muri) {
      if (liv.a(m.x, m.y) !== ROCCIA || pi.colonna[pi.id(m.x, m.y)]) muroSolo++
      if (m.basso && liv.a(m.x, m.y - 1) === ROCCIA && !pi.colonna[pi.id(m.x, m.y - 1)]) parapettoMale++
    }
    for (const t of pi.torce) if (pi.roccia(t.x, t.y + 1) || !pi.roccia(t.x, t.y - 1)) torciaMale++
    for (const q of pi.colonne) if (!pav.has(pi.id(q.x, q.y)) || liv.stanze.every(s => !(s.colonne || []).some(k => k.x === q.x && k.y === q.y))) colonnaFuori++
    uguale(`${nome}: ogni cella che non è roccia ha il pavimento`, senzaPav, 0)
    uguale(`${nome}: i muri sono roccia, mai una colonna`, muroSolo, 0)
    uguale(`${nome}: un parapetto ha qualcosa che non è roccia a nord`, parapettoMale, 0)
    uguale(`${nome}: le torce stanno su un muro alto con il pavimento sotto`, torciaMale, 0)
    uguale(`${nome}: le colonne sono quelle delle stanze, sul pavimento`, colonnaFuori, 0)
    uguale(`${nome}: l'acqua è quella del motore`, pi.acqua.filter(q => liv.a(q.x, q.y) !== ACQUA).length, 0)
    colonne += pi.colonne.length; acqua += pi.acqua.length; torce += pi.torce.length; parapetti += pi.muri.filter(m => m.basso).length
  }
  controlla('in qualche piano ci sono colonne vere', colonne > 0, colonne)
  controlla('in qualche piano ci sono pozze d\'acqua', acqua > 0, acqua)
  controlla('le torce a muro ci sono', torce > 0, torce)
  controlla('i parapetti ci sono', parapetti > 0, parapetti)
  nota(`${piani.length} piani: ${colonne} colonne, ${acqua} celle d'acqua, ${torce} torce, ${parapetti} parapetti`)
}

/* ══════════ 3. la maschera copia la luce del motore ══════════ */
{
  const { c } = piani[0]
  const pi = piantaDi(c.livello)
  const v = nuovaVisibilita(pi.W, pi.H, pi.pavimento)
  aggiornaVisibilita(v, { forza: c.forzaLuce, visto: c.visto, k: 1 })
  const accese = [...c.forzaLuce.keys()]
  controlla('le celle in luce adesso si vedono', accese.every(k => v.ora[k] > 0), accese.length)
  controlla('quelle viste sono ricordate', c.visto.every((s, k) => !s || v.ric[k] === 1))
  const buia = v.ora.findIndex((o, k) => !c.visto[k])
  controlla('il mai visto resta nero', buia >= 0 && v.ora[buia] === 0 && v.ric[buia] === 0)
  // a metà strada (k = 0,5) la cella si accende a metà: niente scatti
  const w = nuovaVisibilita(pi.W, pi.H, pi.pavimento)
  aggiornaVisibilita(w, { forza: c.forzaLuce, visto: c.visto, k: 0.5 })
  controlla('la luce arriva sfumando', accese.every(k => w.ora[k] > 0 && w.ora[k] < v.ora[k] + 1e-6 && w.ora[k] <= Math.min(1, c.forzaLuce.get(k) * 1.3) * 0.5 + 1e-6))
  // la luce di scena del palco accende attorno ai combattenti, ma non scrive il ricordo
  const lontano = pi.pavimento.find(q => !c.visto[pi.id(q.x, q.y)])
  aggiornaVisibilita(v, { forza: c.forzaLuce, visto: c.visto, palco: [{ x: lontano.x + 0.5, z: lontano.y + 0.5 }], k: 1 })
  controlla('il palco si accende anche fuori dal cono', v.ora[pi.id(lontano.x, lontano.y)] > 0.9)
  uguale('ma non diventa ricordo', v.ric[pi.id(lontano.x, lontano.y)], 0)
  controlla('la maschera cambiata va in GPU', scriviTexel(v))
  controlla('ferma no: niente da rimandare', !scriviTexel(v))
  uguale('il texel del pavimento lo dice (B)', v.dati[pi.id(lontano.x, lontano.y) * 4 + 2], 255)
}

/* ══════════ 4. il palco dello scontro sul pavimento vero ══════════ */
{
  let prove = 0, agiati = 0, posti = 0
  for (const { nome, c } of piani) {
    const liv = c.livello, pi = piantaDi(liv)
    const ingombri = new Set(liv.robe.filter(r => r.che === 'arredo' || r.che === 'fonte' || r.che === 'portale').map(r => pi.id(r.x, r.y)))
    // un branco vero del piano: il primo mostro e chi gli sta vicino, con l'eroe accanto
    const mostri = liv.robe.filter(r => r.che === 'mostro' && !r.grosso)
    if (mostri.length < 2) continue
    const capo = mostri[0]
    const branco = mostri.filter(m => Math.hypot(m.x - capo.x, m.y - capo.y) < 4).slice(0, 4)
    // l'eroe su una cella libera accanto al branco (a sinistra se si può)
    let vicino = null
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = capo.x + dx, y = capo.y + dy
      if (!liv.calpestabile(x, y) || liv.robe.some(r => r.x === x && r.y === y)) continue
      if (!vicino || dx < vicino.dx) vicino = { x, y, dx }
    }
    if (!vicino) continue
    const eroe = { x: vicino.x + 0.5, z: vicino.y + 0.5 }
    const d = disponiPalco(pi, ingombri, eroe, branco.map(m => ({ x: m.x + 0.5, z: m.y + 0.5 })))
    const tutti = [d.eroe, ...d.mostri]
    prove++
    controlla(`${nome}: tutti stanno sul pavimento, mai sull'arredo`, tutti.every(p => pi.calpestabile(Math.floor(p.x), Math.floor(p.z)) && !ingombri.has(pi.id(Math.floor(p.x), Math.floor(p.z)))))
    controlla(`${nome}: mai due addosso`, tutti.every((p, i) => tutti.every((q, j) => i === j || Math.hypot(p.x - q.x, p.z - q.z) >= 0.69)))
    controlla(`${nome}: l'eroe sta a sinistra o sopra i mostri (il palco del 2D)`, d.mostri.every(m => m.x >= d.eroe.x - 0.01) || d.mostri.every(m => m.x <= d.eroe.x + 0.01) || d.mostri.every(m => Math.abs(m.z - d.eroe.z) > 0.3))
    for (const a of d.agio) { posti++; if (a >= AGIO - 1e-6) agiati++ }
  }
  controlla('il palco si prova su piani veri', prove >= 6, prove)
  dentro(`con l'agio di ${AGIO} celle dai muri (o il muro alle spalle si abbassa): la gran parte`, agiati / Math.max(1, posti), 0.6, 1)
  nota(`palco: ${prove} scontri, ${agiati}/${posti} posti con ${AGIO} celle d'agio`)
}

/* ══════════ 5. il tocco da punta-e-clicca ══════════ */
{
  const { c } = piani[0]
  const liv = c.livello
  const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
  const v = vicinoA(c, da.x + 0.5, da.y + 0.5)
  uguale('la cella più vicina all\'eroe è la sua', v && `${v.x},${v.y}`, `${da.x},${da.y}`)
  const muro = { x: da.x, y: 0 }
  const verso = vicinoA(c, muro.x + 0.5, 0.5)
  controlla('verso un muro si va alla cella libera più vicina, a cui si arriva', verso && c.buona()(verso.x, verso.y))
  // una porta chiusa sulla strada: un tocco di là porta alla porta
  const porta = liv.robe.find(r => r.che === 'porta' && !r.aperta)
  if (porta) {
    const di = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: porta.x + dx, y: porta.y + dy })).filter(q => liv.calpestabile(q.x, q.y))
    const dietro = di.find(q => !c.buona()(q.x, q.y) || !vicinoA(c, q.x + 0.5, q.y + 0.5) || (vicinoA(c, q.x + 0.5, q.y + 0.5).x !== q.x || vicinoA(c, q.x + 0.5, q.y + 0.5).y !== q.y))
    if (dietro) uguale('un tocco oltre una porta chiusa porta a quella porta', portaSullaStrada(c, dietro), porta)
  }
  const a = creaAzione()
  const meta = liv.robe.find(r => r.che === 'scala')
  a.tocca(c, { roba: meta })
  uguale('toccare una cosa la mira (l\'anello resta finché ci si va)', a.roba, meta)
  a.annulla()
  uguale('un altro tocco annulla', a.roba, null)
  // i mostri si toccano solo nella luce di adesso; una porta chiusa vista sì
  const m = liv.robe.find(r => r.che === 'mostro' && !c.inLuce(r.y * liv.largo + r.x))
  if (m) controlla('un mostro fuori dalla luce non si prende col dito', !usabile(c, m))
}

/* ══════════ 6. le figure: tutte in un InstancedMesh solo (una chiamata) ══════════ */
{
  const scena = new Scene()
  const f = creaFigure(scena, { tex: null, norm: null, larga: 256, alta: 2048, pezzi: PEZZI, maschera: creaMaschera(), max: FIGURE_MAX })
  const nomi = Object.keys(PEZZI).slice(0, 120)
  f.inizia()
  for (const [i, n] of nomi.entries()) { const o = f.o(); o.specchio = i % 2 === 1; o.cosa = i === 7 ? { che: 'prova' } : null; f.metti(n, i, 0, i, o) }
  f.chiudi()
  const istanziati = scena.children.filter(o => o instanceof InstancedMesh)
  uguale('le figure stanno in un InstancedMesh solo', istanziati.length, 1)
  uguale('con tutte le figure del fotogramma', f.mesh.count, nomi.length)
  const r = f.mesh.geometry.attributes.aRett.array
  controlla('specchiata vuol dire larghezza negativa nel ritaglio', r[1 * 4 + 2] < 0 && r[0] > 0 && r[2] > 0)
  uguale('l\'istanza sa che cosa disegna (per il dito)', f.chi[7] && f.chi[7].che, 'prova')
  f.inizia(); f.chiudi()
  uguale('a ogni fotogramma si ricomincia da zero, senza allocare', f.mesh.count, 0)
  uguale('un pezzo che non c\'è non si posa', f.metti('non-esiste', 0, 0, 0), -1)
}

// le botti da rompere hanno il loro test: unita/sotterraneo-botti

/* ── la carta «riprendi» della home: il 3D prende la ripresa del gemello 2D (stessa sosta, un manifesto solo) ── */
{
  uguale('il 3D è il gemello del sotterraneo', gemelloDi('sotterraneo3d'), 'sotterraneo')
  uguale('un gioco senza gemello è se stesso', gemelloDi('torri'), 'torri')
  const m = giocoNuovo(gemelloDi('sotterraneo3d'))
  const r = m.ripresa({})
  uguale('senza sosta niente da riprendere', r, null)
}
riassunto('sotterraneo 3d')
