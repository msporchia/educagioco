// La telecamera: sta lontana (almeno 15 celle in largo e in profondo, la distanza viene dalla forma dello schermo), segue
// l'eroe morbida, nello scontro si avvicina e inquadra i combattenti, si alza sopra i pannelli che coprono il fondo del campo
// (`coperto`, in px), trema ai colpi (la scossa al quadrato). E i conti fra mondo e schermo: dove cade un punto, quale cella
// sta sotto il dito.
import { PerspectiveCamera, Vector3, Vector2, Plane, Raycaster, MathUtils } from 'three'
import { CAMERA } from './costanti.js'

export function creaCamera() {
  const camera = new PerspectiveCamera(CAMERA.fov, 1, 0.5, 200)
  const off = new Vector3(), tmp = new Vector3(), meta = new Vector3()
  const ray = new Raycaster(), pt = new Vector2(), piano = new Plane(new Vector3(0, 1, 0), 0)
  let L = 1, A = 1, pxAlto = 1, celleOra = CAMERA.celle, spostaY = 0, zoom = 1, primo = true, dOra = 0

  // la distanza che serve a vedere `celle` in largo e in profondo, con l'apertura e la forma dello schermo
  // `fraz`: quanto dell'altezza resta libero (il pannello dello scontro copre il fondo)
  function scostamento(celle, fraz = 1) {
    const v = Math.atan(Math.tan(MathUtils.degToRad(camera.fov) / 2) * fraz)
    const o = Math.atan(Math.tan(MathUtils.degToRad(camera.fov) / 2) * camera.aspect)
    const inc = MathUtils.degToRad(CAMERA.inclinazione)
    const d = Math.max((celle / 2) / Math.tan(o), (celle / 2) * Math.sin(inc) / Math.tan(v))
    return off.set(0, d * Math.sin(inc), d * Math.cos(inc))
  }

  return {
    camera, ray,
    get L() { return L },
    get A() { return A },
    get zoom() { return zoom },
    set zoom(z) { zoom = Math.min(CAMERA.zoomMax, Math.max(CAMERA.zoomMin, z)) },
    // `alto`: i pixel veri del disegno in altezza (CSS × dpr), per la scala intera degli sprite
    misura(l, a, alto = a) { L = l; A = a; pxAlto = alto; camera.aspect = l / Math.max(1, a); camera.updateProjectionMatrix() },
    // quanti pixel del disegno fa un pixel dello sprite al centro dell'inquadratura
    get pixelSprite() { return pxAlto / (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2) * Math.max(0.01, dOra) * 16) },
    // `centro` in mondo, `scontro` se si inquadra un combattimento, `coperto` i px coperti in basso, `scossa` 0..1
    // `celle`: quante ne servono nello scontro perché ci stiano tutti (mai meno di CAMERA.celleScontro)
    aggiorna(dt, centro, { scontro = false, celle = CAMERA.celleScontro, coperto = 0, scossa = 0, t = 0 } = {}) {
      celleOra += ((scontro ? Math.max(CAMERA.celleScontro, celle) : CAMERA.celle) - celleOra) * Math.min(1, dt * 3)
      spostaY += (coperto * 0.5 - spostaY) * Math.min(1, dt * 5)
      if (Math.abs(spostaY) > 0.5) camera.setViewOffset(L, A, 0, spostaY, L, A)
      else if (camera.view) camera.clearViewOffset()
      // la distanza voluta, arrotondata a una scala intera (un pixel dello sprite = k pixel del disegno, k fra 1 e pixelMassimo),
      // e quella di adesso che ci va morbida: così il pixel dello sprite resta un quadrato netto, uguale per tutti
      scostamento(celleOra, scontro ? Math.max(0.35, (A - coperto) / A) : 1).multiplyScalar(zoom)
      const tanV = 2 * Math.tan(MathUtils.degToRad(camera.fov) / 2) * 16
      const d0 = off.length()
      // per difetto (la telecamera si allontana un poco, si avvicina al più dell'8%: il margine di una cella e mezza lo regge): quello che doveva starci ci sta ancora
      const k = Math.min(CAMERA.pixelMassimo, Math.max(1, Math.floor(pxAlto / (tanV * d0) + 0.3)))
      // se la scala intera porterebbe la telecamera troppo lontano o vicino (pochi pixel: un pixel ratio basso) non si arrotonda
      let dMeta = pxAlto / (tanV * k)
      if (dMeta < d0 * 0.8 || dMeta > d0 * 1.25) dMeta = d0
      dOra = primo || !dOra ? dMeta : dOra + (dMeta - dOra) * Math.min(1, dt * 6)
      off.multiplyScalar(dOra / d0)
      meta.copy(centro).add(off)
      if (primo) { camera.position.copy(meta); primo = false } else camera.position.lerp(meta, Math.min(1, dt * 6))
      const s2 = scossa * scossa
      camera.lookAt(camera.position.x, camera.position.y - off.y + CAMERA.guarda, camera.position.z - off.z)
      camera.position.x += s2 * 0.35 * Math.sin(t * 71.3); camera.position.y += s2 * 0.25 * Math.sin(t * 53.1 + 1)
      camera.rotation.z += s2 * 0.04 * Math.sin(t * 61.7 + 2)
      camera.updateMatrixWorld()
    },
    salta() { primo = true },
    // dove cade a schermo (px nel campo) un punto del mondo
    schermo(x, y, z, fuori = { x: 0, y: 0 }) {
      tmp.set(x, y, z).project(camera)
      fuori.x = (tmp.x + 1) / 2 * L; fuori.y = (1 - tmp.y) / 2 * A
      return fuori
    },
    // il raggio dal dito (px nel campo)
    mira(px, py) { pt.set(px / L * 2 - 1, -py / A * 2 + 1); ray.setFromCamera(pt, camera); return ray },
    // la cella del pavimento sotto il dito
    cellaDa(px, py) {
      this.mira(px, py)
      return ray.ray.intersectPlane(piano, tmp) ? { x: Math.floor(tmp.x), y: Math.floor(tmp.z) } : null
    },
  }
}
