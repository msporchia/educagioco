// La telecamera del mondo di sopra e la veduta d'insieme. Da vicino sta dall'alto inclinata (52°) e segue l'eroe morbida, a una
// distanza che viene dalla forma dello schermo (almeno 15 celle in largo, 18 in profondo), e tiene l'eroe nello spazio libero fra
// le carte in cima e in fondo (`coperto`, come la terra dipinta). La veduta, del giocatore (la casella «mappa grande» della barra),
// sale fino a vedere il mondo intero. Il sole fa una sola ombra, con una camera d'ombra piccola che segue l'eroe; nella veduta
// l'ombra non si rifà.
import { PerspectiveCamera, Vector3, Vector2, MathUtils } from 'three'

export const VISTA = { inclinazione: 52, fov: 34, largo: 15, fondo: 18, guarda: 0.5, zoomMin: 0.7, zoomMax: 1.5 }
export const VEDUTA = { inclinazione: 64 }
export const SOLE = new Vector3(-0.42, 0.82, 0.38).normalize()

export function creaVeduta(m) {
  const camera = new PerspectiveCamera(VISTA.fov, 1, 0.5, 1400)
  let L = 1, A = 1, sopra = 0, sotto = 0, zoom = 1, primo = true, ombra = 0
  const st = { k: 0, x: 0, z: 0, y: 0, inc: VISTA.inclinazione, d: 40, spostaY: 0 }
  const ndc = new Vector2(), o = new Vector3(), dir = new Vector3(), tmp = new Vector3()

  // la distanza per vedere `largo` × `fondo` con l'apertura e la forma dello schermo
  function distanza(largo, fondo, inc) {
    const v = MathUtils.degToRad(camera.fov) / 2, oz = Math.atan(Math.tan(v) * camera.aspect), i = MathUtils.degToRad(inc)
    return Math.max((largo / 2) / Math.tan(oz), (fondo / 2) * Math.sin(i) / Math.tan(v))
  }
  return {
    camera,
    get veduta() { return st.k > 0.5 },
    get k() { return st.k },
    get d() { return st.d },
    get zoom() { return zoom },
    set zoom(z) { zoom = Math.min(VISTA.zoomMax, Math.max(VISTA.zoomMin, z)) },
    misura(l, a) { L = l; A = a; camera.aspect = l / Math.max(1, a); camera.updateProjectionMatrix() },
    copri(su, giu) { sopra = su; sotto = giu },
    salta() { primo = true },
    // `centro` l'eroe (x, y, z), `veduta` se si guarda tutto il mondo; `sole` la luce che fa l'ombra
    aggiorna(dt, centro, veduta, sole) {
      const kv = veduta ? 1 : 0
      st.k += (kv - st.k) * (primo ? 1 : 1 - Math.exp(-dt * 3))
      const libero = Math.max(1, A - sopra - sotto)
      const vicino = { x: centro.x, z: centro.z, y: centro.y + VISTA.guarda, inc: VISTA.inclinazione,
                       d: distanza(Math.min(30, Math.max(VISTA.largo, camera.aspect * 18)), VISTA.fondo, VISTA.inclinazione) * zoom * Math.max(1, A / libero * 0.85) }
      const lontano = { x: m.W / 2, z: m.H / 2 + 6, y: 0, inc: VEDUTA.inclinazione, d: distanza(m.W + 6, m.H + 10, VEDUTA.inclinazione) }
      const b = st.k, mix = (p, q) => p + (q - p) * b
      const t = { x: mix(vicino.x, lontano.x), z: mix(vicino.z, lontano.z), y: mix(vicino.y, lontano.y), inc: mix(vicino.inc, lontano.inc), d: mix(vicino.d, lontano.d) }
      const k = primo ? 1 : 1 - Math.exp(-dt * (veduta ? 4 : 3.2))
      st.x += (t.x - st.x) * k; st.z += (t.z - st.z) * k; st.y += (t.y - st.y) * k; st.inc += (t.inc - st.inc) * k; st.d += (t.d - st.d) * k
      // l'eroe sta a metà dello spazio libero, un poco più giù del mezzo (come sulla terra dipinta)
      const voluto = (1 - b) * (A / 2 - (sopra + libero * 0.55))
      st.spostaY += (voluto - st.spostaY) * (primo ? 1 : 1 - Math.exp(-dt * 5))
      if (Math.abs(st.spostaY) > 0.5) camera.setViewOffset(L, A, 0, st.spostaY, L, A)
      else if (camera.view) camera.clearViewOffset()
      primo = false
      const i = MathUtils.degToRad(st.inc)
      camera.position.set(st.x, st.y + st.d * Math.sin(i), st.z + st.d * Math.cos(i))
      camera.lookAt(st.x, st.y, st.z)
      camera.updateMatrixWorld()
      // l'ombra: una mappa sola attorno a quello che si vede, agganciata alla griglia dei suoi texel (non tremola)
      if (sole) {
        const s = Math.min(70, Math.max(16, st.d * 0.55))
        if (Math.abs(s - ombra) > 0.5) {
          ombra = s
          Object.assign(sole.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 300 })
          sole.shadow.camera.updateProjectionMatrix()
        }
        const passo = (2 * s) / sole.shadow.mapSize.x
        const tx = Math.round(st.x / passo) * passo, tz = Math.round((st.z - s * 0.2) / passo) * passo
        sole.target.position.set(tx, 0, tz)
        sole.position.set(tx + SOLE.x * 140, SOLE.y * 140, tz + SOLE.z * 140)
        sole.target.updateMatrixWorld()
      }
    },
    // dove cade a schermo (px nel campo) un punto del mondo
    schermo(x, y, z, fuori = { x: 0, y: 0, davanti: true }) {
      tmp.set(x, y, z).project(camera)
      fuori.x = (tmp.x + 1) / 2 * L; fuori.y = (1 - tmp.y) / 2 * A; fuori.davanti = tmp.z < 1
      return fuori
    },
    // il raggio dal dito (px nel campo): origine e verso
    raggio(px, py) {
      ndc.set(px / L * 2 - 1, -py / A * 2 + 1)
      o.setFromMatrixPosition(camera.matrixWorld)
      dir.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(o).normalize()
      return { o, d: dir }
    },
  }
}
