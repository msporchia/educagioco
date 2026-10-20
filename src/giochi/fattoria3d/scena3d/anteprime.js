// Le anteprime dei pezzi e degli edifici per il menu «Costruisci qui» (e il foglio di una macchina): il modello 3D vero, fotografato
// una volta per tipo. NESSUN contesto WebGL in più: si disegna col renderer della scena stessa, in un render target, fra un
// fotogramma e l'altro (un tipo per volta, `requestAnimationFrame`), e si copia in un canvas 2D → dataURL PNG. La scena di posa ha
// solo il sole e l'emisferica, come quella vera, e sotto l'oggetto un'ombra morbida tonda. Vedi docs/fattoria3d/scena.md.
import * as THREE from 'three'
import { inquadra, creaCache } from './anteprime-pura.js'

const LATO = 192                    // pixel veri: la carta li mostra a ~72 px CSS
const FOV = 30

function ombraMorbida() {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(20,24,16,.42)'); g.addColorStop(0.55, 'rgba(20,24,16,.26)'); g.addColorStop(1, 'rgba(20,24,16,0)')
  x.fillStyle = g; x.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * `renderer`: quello del mondo (prestato, non si chiude). `creaModello(tipo)` → Object3D già disposto (un campo maturo, un
 * recinto con le sue pecore…) o null. → { chiedi(tipo) → Promise<dataURL|null>, leggi(tipo), pronta(tipo), via() }
 */
export function creaAnteprime(renderer, creaModello) {
  let scena, camera, rt, ombra, tex
  const prepara = () => {
    scena = new THREE.Scene()
    scena.add(new THREE.HemisphereLight(0xdff1ff, 0x7a9a5a, 1.2))
    const sole = new THREE.DirectionalLight(0xfff0d0, 2.4); sole.position.set(6, 10, 4); scena.add(sole)       // senza ombre: la sua è il disco
    camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 300)
    // la scrittura nel render target è già in sRGB (il tono non c'è: vale solo sullo schermo)
    rt = new THREE.WebGLRenderTarget(LATO, LATO, { samples: 4, colorSpace: THREE.SRGBColorSpace, depthBuffer: true })
    tex = ombraMorbida()
    ombra = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }))
    ombra.rotation.x = -Math.PI / 2
  }

  function disegna(tipo) {
    if (!scena) prepara()
    const obj = creaModello(tipo); if (!obj) return null
    scena.add(obj); obj.updateMatrixWorld(true)
    const b = new THREE.Box3().setFromObject(obj)
    if (b.isEmpty()) b.set(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 1, 0.5))
    // l'ombra sotto, larga quanto l'orma; poi la scatola per l'inquadratura la comprende
    const r = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) * 0.62
    ombra.position.set((b.min.x + b.max.x) / 2, b.min.y + 0.01, (b.min.z + b.max.z) / 2); ombra.scale.setScalar(Math.max(0.4, r)); scena.add(ombra)
    const q = inquadra({ min: [b.min.x - r * 0.2, b.min.y, b.min.z - r * 0.2], max: [b.max.x + r * 0.2, b.max.y, b.max.z + r * 0.2] }, { fov: FOV })
    camera.position.set(...q.posizione); camera.near = Math.max(0.02, q.distanza / 100); camera.far = q.distanza * 6
    camera.lookAt(...q.bersaglio); camera.updateProjectionMatrix()

    // il renderer è prestato: si rimette tutto com'era
    const target = renderer.getRenderTarget(), alfa = renderer.getClearAlpha(), colore = renderer.getClearColor(new THREE.Color()), ombre = renderer.shadowMap.autoUpdate
    let url = null
    try {
      renderer.shadowMap.autoUpdate = false
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear()
      renderer.render(scena, camera)
      const px = new Uint8Array(LATO * LATO * 4)
      renderer.readRenderTargetPixels(rt, 0, 0, LATO, LATO, px)
      const cv = document.createElement('canvas'); cv.width = cv.height = LATO
      const img = new ImageData(LATO, LATO), riga = LATO * 4
      for (let y = 0; y < LATO; y++) img.data.set(px.subarray((LATO - 1 - y) * riga, (LATO - y) * riga), y * riga)       // il render target è capovolto
      cv.getContext('2d').putImageData(img, 0, 0)
      url = cv.toDataURL('image/png')
    } finally {
      renderer.setRenderTarget(target); renderer.setClearColor(colore, alfa); renderer.shadowMap.autoUpdate = ombre
      scena.remove(obj); scena.remove(ombra)
      obj.traverse(o => { if (o.isInstancedMesh) o.dispose() })        // le geometrie e i materiali sono condivisi con la scena vera: non si toccano
    }
    return url
  }

  const cache = creaCache(disegna, fn => requestAnimationFrame(() => fn()))
  return {
    ...cache,
    via() {
      cache.via()
      try { rt?.dispose(); tex?.dispose(); ombra?.geometry.dispose(); ombra?.material.dispose() } catch (e) { /* già andato */ }
      rt = null; scena = null
    },
  }
}
