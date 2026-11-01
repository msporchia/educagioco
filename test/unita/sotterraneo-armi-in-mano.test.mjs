/* ═══════════════════════════════════════════════════════════════════
   LE ARMI IN MANO ALL'EROE 3D — docs/sotterraneo/roba-3d.md

   Ogni figura che si impugna (lame, bastoni, archi, scudi) e ogni arma
   della collezione (il ripiego), in mano agli eroi che la portano
   (dati/eroi.js), ferma nella guardia, nel gesto e in marcia: non
   scende sotto il pavimento, non entra nella testa né nel busto, e
   punta dove ha senso (la lama e il bastone in su, l'arco ritto con
   la corda verso l'eroe, la balestra e lo scudo in avanti).
   `MISURA=1` stampa la tabella per eroe e gruppo, coi peggiori;
   `DETTAGLIO='nano spada-01'` gli assi di un'arma posa per posa.
   ═══════════════════════════════════════════════════════════════════ */
import { Vector3, Box3, Matrix4 } from 'three'
import { creaEroe, gesto } from '../../src/giochi/sotterraneo/scena3d/eroi3d/eroi.js'
import { vestiDotazione, posa } from '../../src/giochi/sotterraneo/scena3d/eroe3d.js'
import { FIGURE3D } from '../../src/giochi/sotterraneo/dati/figure3d.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { CATALOGO } from '../../src/giochi/sotterraneo/scena3d/eroi3d/collezione.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

// l'eroe disegna la faccia su una tela: in Node ne basta una finta
const c2d = new Proxy({}, { get: (_, k) => (k === 'canvas' ? {} : () => ({ data: [] })), set: () => true })
globalThis.document = globalThis.document || { createElement: () => ({ width: 0, height: 0, getContext: () => c2d }) }

const MISURA = !!process.env.MISURA
// `DETTAGLIO='nano spada-01'`: gli assi di quell'arma in ogni posa
const DETTAGLIO = process.env.DETTAGLIO || ''
// i gruppi: il prefisso della figura o la famiglia della collezione. Chi la porta: gli eroi che portano la famiglia della sua base
// (dati/eroi.js; una figura senza base, dei pezzi col nome, dal prefisso); lo scudo non ha famiglia e lo porta chiunque
const GRUPPO = { spada: 'lama', ascia: 'lama', arco: 'arco', bastone: 'bastone', bacchetta: 'bastone', scudo: 'scudo' }
const FAMIGLIA = { spada: 'spade', ascia: 'asce', arco: 'archi', bastone: 'bacchette', bacchetta: 'bacchette', scudo: null }
const chiLaPorta = fam => EROI.filter(e => !fam || e.porta.includes(fam)).map(e => e.chiave)
const ARMI = [
  ...Object.entries(FIGURE3D).filter(([id]) => GRUPPO[id.replace(/-\d+$/, '')]).map(([id, f]) => {
    const pre = id.replace(/-\d+$/, ''), base = COSE[f.pezzo]
    return { nome: id, gruppo: GRUPPO[pre], chi: chiLaPorta(base ? base.famiglia : FAMIGLIA[pre]), pezzo: { figura: id, id: null, rarita: 'comune', elemento: f.elemento } }
  }),
  ...CATALOGO.map(a => ({ nome: `coll. ${a.id}`, gruppo: GRUPPO[a.famiglia], chi: chiLaPorta(FAMIGLIA[a.famiglia]), pezzo: { figura: null, id: a.id, rarita: 'comune', elemento: 'nessuno' } })),
]
// le pose (il `t` di posa(), la guardia va a t·0.12): la guardia in molti istanti, dentro e fuori dai gesti, e la marcia
const POSE = [...Array.from({ length: 40 }, (_, i) => ({ t: i * 4.1, cammina: false })), ...Array.from({ length: 8 }, (_, i) => ({ t: i * 0.873, cammina: true }))]

const SPADA = { figura: 'spada-01', id: null, rarita: 'comune', elemento: 'nessuno' }
const _v = new Vector3(), _m = new Matrix4(), _inv = new Matrix4()
const vuota = () => ({ sotto: Infinity, testa: 0, busto: 0, su: Infinity, avanti: Infinity, pugno: Infinity })
function misura(chi, arma) {
  const g = creaEroe(chi), sinistra = arma.gruppo === 'arco' || arma.gruppo === 'scudo'
  // lo scudo si porta con una spada nella destra (dotazioneDi)
  vestiDotazione(g, sinistra ? { sinistra: arma.pezzo, destra: arma.gruppo === 'scudo' ? SPADA : null } : { destra: arma.pezzo })
  const u = g.userData, a = u.perniArmi[sinistra ? 'sinistra' : 'destra'].children[0]
  const tipo = a.userData.tipo === 'balestra' ? 'balestra' : a.userData.famiglia
  const torso = u.busto.children.find(o => o.isMesh && o.geometry.type === 'BoxGeometry')
  if (!torso.geometry.boundingBox) torso.geometry.computeBoundingBox()
  const dentroTorso = torso.geometry.boundingBox.clone().expandByScalar(-0.015)
  const r = { tipo, fermo: vuota(), gesto: vuota(), marcia: vuota() }
  for (const { t, cammina } of POSE) {
    posa(g, t, cammina, null)
    g.updateMatrixWorld(true)
    const q = r[cammina ? 'marcia' : gesto(u, t * 0.12).k >= 0 ? 'gesto' : 'fermo']
    const centro = new Vector3(0, u.cy, 0).applyMatrix4(u.testa.matrixWorld), raggio = u.R * 0.92
    _inv.copy(torso.matrixWorld).invert()
    let n = 0, nt = 0, nb = 0
    a.traverse(o => {
      if (!o.isMesh || !o.visible || o.material.transparent) return
      const pos = o.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        _v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld)
        n++
        if (_v.y < q.sotto) q.sotto = _v.y
        if (_v.distanceTo(centro) < raggio) nt++
        if (dentroTorso.containsPoint(_v.applyMatrix4(_inv))) nb++
      }
    })
    q.pugno = Math.min(q.pugno, a.parent.getWorldPosition(_v).y)
    q.testa = Math.max(q.testa, nt / n); q.busto = Math.max(q.busto, nb / n)
    // gli assi dell'arma nel mondo (l'eroe guarda +z): +y la lama, l'asta o l'arco, +z il davanti della balestra e la faccia dello scudo
    _m.extractRotation(a.matrixWorld)
    const y = new Vector3(0, 1, 0).applyMatrix4(_m), z = new Vector3(0, 0, 1).applyMatrix4(_m)
    if (DETTAGLIO === `${chi} ${arma.nome}`) console.log(`t ${t.toFixed(1)} ${cammina ? 'marcia' : gesto(u, t * 0.12).k >= 0 ? 'gesto ' : 'fermo '} y ${y.toArray().map(v => v.toFixed(2)).join(' ')}  z ${z.toArray().map(v => v.toFixed(2)).join(' ')}`)
    q.su = Math.min(q.su, tipo === 'balestra' ? -z.y : y.y)
    q.avanti = Math.min(q.avanti, tipo === 'spada' || tipo === 'staffa' ? y.z : z.z)
  }
  const s = new Box3().setFromObject(a).getSize(new Vector3())
  r.lungo = Math.max(s.x, s.y, s.z) / new Box3().setFromObject(g).getSize(new Vector3()).y
  return r
}

const righe = []
for (const arma of ARMI) for (const chi of arma.chi) righe.push({ chi, nome: arma.nome, gruppo: arma.gruppo, ...misura(chi, arma) })

if (MISURA) {
  const f = x => x.toFixed(2).padStart(5)
  const gruppi = new Map()
  for (const r of righe) { const k = `${r.chi} ${r.nome.startsWith('coll.') ? 'c.' : ''}${r.gruppo}`; if (!gruppi.has(k)) gruppi.set(k, []); gruppi.get(k).push(r) }
  const peggio = (rs, q, c, segno) => rs.reduce((a, b) => (segno * b[q][c] > segno * a[q][c] ? b : a))
  console.log('valori peggiori: sotto (y minima, il pavimento è 0), testa e busto (parte dei vertici dentro), su (asse in alto), avanti (asse verso dove guarda)')
  for (const [k, rs] of gruppi) {
    console.log(`── ${k} (${rs.length}) lungo/alto ${f(Math.min(...rs.map(r => r.lungo)))}–${f(Math.max(...rs.map(r => r.lungo)))}`)
    for (const q of ['fermo', 'gesto', 'marcia']) {
      const p = { sotto: peggio(rs, q, 'sotto', -1), testa: peggio(rs, q, 'testa', 1), busto: peggio(rs, q, 'busto', 1), su: peggio(rs, q, 'su', -1), avanti: peggio(rs, q, 'avanti', -1) }
      console.log(`   ${q.padEnd(7)} pugno ${f(Math.min(...rs.map(r => r[q].pugno)))} ` + Object.entries(p).map(([c, r]) => `${c} ${f(r[q][c])} ${r.nome.replace('coll. ', 'c.').padEnd(15)}`).join(' '))
    }
  }
}
// i bersagli (docs/sotterraneo/roba-3d.md, «Come si tiene un'arma»): per tipo e per posa, il valore peggiore delle pose
const REGOLE = {
  spada: { fermo: { su: 0.4, avanti: 0.2 }, marcia: { su: 0.4, avanti: 0.2 }, gesto: { avanti: -0.45 }, sotto: -0.1, testa: 0.06 },
  staffa: { tutte: { su: 0.9 }, sotto: -0.02, testa: 0.06 },
  arco: { tutte: { su: 0.85, avanti: 0.5 }, sotto: -0.4, testa: 0.06 },          // gli archi lunghi entrano nel pavimento: è una scelta aperta
  balestra: { tutte: { avanti: 0.8 }, sotto: -0.1, testa: 0.06 },
  scudo: { tutte: { su: 0.4, avanti: 0.4 }, sotto: -0.05, testa: 0.35 },          // col testone dei chibi lo scudo arriva al mento
}
for (const r of righe) {
  const R = REGOLE[r.tipo], chi = `${r.chi} con ${r.nome}`
  if (!controlla(`${chi}: ha un tipo noto`, !!R, r.tipo)) continue
  for (const q of ['fermo', 'gesto', 'marcia']) {
    const p = r[q], soglie = R[q] || R.tutte || {}
    for (const [c, min] of Object.entries(soglie)) controlla(`${chi} (${q}): ${c} ≥ ${min}`, p[c] >= min, p[c].toFixed(2))
    controlla(`${chi} (${q}): non scende sotto il pavimento (${R.sotto})`, p.sotto >= R.sotto, p.sotto.toFixed(2))
    controlla(`${chi} (${q}): non entra nella testa`, p.testa <= R.testa, p.testa.toFixed(2))
    controlla(`${chi} (${q}): non entra nel busto`, p.busto <= 0.1, p.busto.toFixed(2))
  }
}
nota(`${righe.length} armi in mano provate (${ARMI.length} armi, gli eroi che le portano, ${POSE.length} pose)`)
riassunto('le armi in mano all\'eroe 3D')
