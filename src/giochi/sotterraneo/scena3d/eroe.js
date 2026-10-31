// L'eroe in 3D: il suo modello (eroe3d.js, con le armi in mano), il lampo della ferita e della cura, lo scatto dell'assalto, il giro
// su sé stesso, il passaggio nel portale, e la sua torcia (scena3d/luci.js). Sta dove lo mette il motore; nello scontro il palco lo
// porta al suo posto (`meta`). La misura viene dalla sua figura dell'atlante (le pose: dati/tessere.js `pezzoAndante`); la torcia in
// mano è il suo modello (roba-per-terra.js, `creaTorciaInMano`).
import { pezzoAndante } from '../dati/tessere.js'
import { LUCE } from './costanti.js'
import { muoviAssalto } from './racconto.js'
import { barretta } from './etichette.js'
import { verso } from './tempo.js'

import { Vector3 } from 'three'
const _mano = new Vector3()

export function creaEroe() {
  return { x: 0, z: 0, dx: 0, dz: 0, vx: 0, vz: 1, lx: 0, lz: 1, t: 0, colpito: 0, cura: 0, gira: 0, assalto: null, meta: null,
           passaggio: null, specchio: false, alto: 1.4, px: null, pz: null, cammina: false }
}

// un passo del disegno: `corsa` il motore, `figure` quelle senza ombra (la torcia è sua), `fuori` dove si spinge fuori dalla
// fontana (chi beve sta sulla sua cella), `scontro` se sta sul palco con un bersaglio da guardare
export function disegnaEroe(e, corsa, { figure, luci, etichette, camera, dt, dtScena, t, fontana = null, bersaglio = null, portale = null,
                                         fiamma = null, aloni = null, scintille = null, modello = null, quota = null, torcia = null }) {
  if (e.px == null) { e.px = corsa.eroe.x; e.pz = corsa.eroe.y; e.x = e.px; e.z = e.pz }
  if (!e.meta) {
    // finito lo scontro torna dove lo tiene il motore camminando, non di colpo
    if (e.ritorno && Math.hypot(corsa.eroe.x - e.x, corsa.eroe.y - e.z) > 0.05) { const k = verso(dtScena, 6); e.x += (corsa.eroe.x - e.x) * k; e.z += (corsa.eroe.y - e.z) * k }
    else { e.ritorno = false; e.x = corsa.eroe.x; e.z = corsa.eroe.y }
  }
  else if (dtScena > 0) { const k = verso(dtScena, 6); e.x += (e.meta.x - e.x) * k; e.z += (e.meta.z - e.z) * k }
  e.cammina = Math.hypot(e.x - e.px, e.z - e.pz) > 0.001 || (!!e.meta && Math.hypot(e.meta.x - e.x, e.meta.z - e.z) > 0.08)
  e.px = e.x; e.pz = e.z
  // dove guarda: il verso del motore; nello scontro il bersaglio
  if (bersaglio && !e.assalto) { const dx = bersaglio.x - e.x, dz = (bersaglio.z - e.z) * 0.4, l = Math.hypot(dx, dz); if (l > 0.01) { e.vx = dx / l; e.vz = dz / l } }
  else if (!bersaglio && corsa.versoEroe) { const v = corsa.versoEroe, l = Math.hypot(v.dx, v.dy); if (l > 0.01) { e.vx = v.dx / l; e.vz = v.dy / l } }
  const k = verso(dt, 9)
  e.lx += (e.vx - e.lx) * k; e.lz += (e.vz - e.lz) * k
  const ll = Math.hypot(e.lx, e.lz) || 1; e.lx /= ll; e.lz /= ll
  e.colpito = Math.max(0, e.colpito - dt); e.cura = Math.max(0, e.cura - dt); e.gira = Math.max(0, e.gira - dt)
  e.t += dtScena * (e.cammina ? 10 : 5)
  muoviAssalto(e, dtScena)
  let x = e.x + e.dx, z = e.z + e.dz
  // chi beve alla fonte sta sulla sua cella: lo si disegna sul bordo della vasca, non dentro
  if (fontana) {
    const fx = fontana.cella.x + 0.5, fz = fontana.cella.y + 0.5, d = Math.hypot(x - fx, z - fz)
    if (d < 0.66) { const ux = d > 0.01 ? (x - fx) / d : 0, uz = d > 0.01 ? (z - fz) / d : 1; x = fx + ux * 0.66; z = fz + uz * 0.66 }
  }
  let trasparenza = 1
  if (e.passaggio && portale) {
    const ps = e.passaggio; ps.t += dt
    const u = Math.min(1, ps.t / 0.9)
    x += (portale.gruppo.position.x - x) * u; z += (portale.gruppo.position.z - z) * u
    trasparenza = 1 - u
    if (ps.t > 1.6) { e.passaggio = null; if (ps.fatto) ps.fatto() }
  }
  if (Math.abs(e.vx) > 0.1) e.specchio = e.vx < 0
  const chi = (corsa.io && corsa.io.sprite) || 'cavaliere'
  const fr = (e.t | 0)
  const nome = pezzoAndante(chi, e.cammina ? 'corsa' : 'fermo', fr)
  e.nome = nome   // per le prove: lo sprite di adesso
  const giro = e.gira > 0 ? (0.5 - e.gira) * Math.PI * 4 : 0
  const o = figure.o()
  o.rosso = e.colpito * 2; o.verde = e.cura * 0.9; o.blu = e.cura * 1.3; o.trasparenza = trasparenza; o.specchio = e.specchio; o.giro = giro
  e.alto = figure.alto(nome)
  // il modello 3D (scena3d/eroe3d.js), che porta da sé le armi: senza, il posto resta vuoto (niente sprite di ripiego)
  if (modello) modello.aggiorna(e, corsa, { x, z, y: quota ? quota(x, z) : 0, trasparenza, dt, alto: e.alto })
  const su = Math.sin(e.t * (e.cammina ? 0.9 : 0.6)) * (e.cammina ? 0.9 : 0.5)
  const lato = e.specchio ? -1 : 1
  // la torcia accesa (agli sgoccioli un po' meno): in mano dalla parte della mancina, con la fiamma, le faville e un chiarore
  // caldo per terra; al buio niente fiamma, e la luce resta quella di prima (docs/sotterraneo/luce.md, «La torcia nel 3D»)
  const accesa = corsa.torciaAccesa ? (corsa.torciaAgliSgoccioli ? 0.6 : 1) : 0
  const tremo = luci.torcia(x, z, e.lx, e.lz, t, dt, accesa)
  const q = luci.q
  // la torcia (il suo modello) nella mano libera, fuori dalla sagoma o il corpo la copre; la fiamma sulla punta
  let mx = x - lato * 0.42, base = 0.22 + su * 0.02, mz = z + 0.28
  const mano3d = modello && modello.manoSinistra(_mano)
  if (mano3d) { mx = mano3d.x; base = Math.max(0.05, mano3d.y - 0.1); mz = mano3d.z + 0.05 }
  const my = base + (torcia ? torcia.alto : 0.6) - 0.04
  if (torcia) { if (accesa && trasparenza > 0.5) torcia.metti(mx, base, mz); else torcia.nascondi() }
  e.mano = accesa ? { x: mx, y: my, z: mz } : null
  if (fiamma) {
    fiamma.accesa(0, accesa > 0 && trasparenza > 0.5)
    if (accesa) fiamma.sposta(0, mx, my, mz)
  }
  if (aloni && q > 0.02) aloni.metti(x, z + 0.05, 1.5 + 1.1 * q, '#ff9a48', LUCE.torcia.chiarore * q * tremo)
  if (scintille && accesa && dtScena > 0) {
    e.faville = (e.faville || 0) + dtScena * (4 + 3 * accesa)
    while (e.faville >= 1) { e.faville--; scintille.emetti(mx, my + 0.22, mz, 1, { forza: 0.25, su: 1.1, vita: 0.7, caldo: 0.3, taglia: 0.03 }) }
  }
  // sopra la testa, solo quando manca qualcosa e fuori dallo scontro (lì la vita sta nel globo)
  if (!bersaglio && corsa.vita < corsa.vitaMax) {
    const p = camera.schermo(x, e.alto + 0.12, z, e._schermo || (e._schermo = { x: 0, y: 0 }))
    const q = corsa.vita / Math.max(1, corsa.vitaMax)
    etichette.metti(p.x, p.y, `e|${Math.round(q * 20)}`, () => barretta(q), { eroe: '1' })
  }
  e.disegnato = { x, z }
}
