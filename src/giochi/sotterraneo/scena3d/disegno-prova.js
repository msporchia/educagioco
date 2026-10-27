// Il disegno di prova (docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»): certi driver compilano davvero al primo
// disegno e non al link (SwiftShader sì: il primo disegno di un piano già tutto compilato restava un fotogramma di un secondo;
// dell'Adreno del Note 7 non si sa). Quindi entrando ogni materiale si disegna una volta da solo, in un pixel (la forbice, senza
// pulire né rifare l'ombra), con le luci della scena: la telecamera vede solo lo strato CALDO, dove stanno le luci e lui. Chi è
// spento, o fuori dalla scena (un modello in serbo, un effetto), si compila e basta.
import { PerspectiveCamera, Vector4 } from 'three'

const CALDO = 31

/**
 * `camera()`: quella della scena; `compila(finto)`: il ripiego (renderer.compile, o nella texture del passaggio finale); `dentro(f)`:
 * dove si disegna (lo schermo, o la texture del passaggio finale). Torna { disegna(finto), luci() }: `finto` è quello di coda-shader.js
 * (soloLui: `oggetto` e `materiale`); `luci()` mette le luci della scena nello strato (si chiama quando si aggiungono passi).
 */
export function creaDisegnoDiProva({ renderer, scena, camera, compila, dentro = f => f() }) {
  const cam = new PerspectiveCamera(), forbice = new Vector4(), vista = new Vector4()
  return {
    luci() { scena.traverse(l => { if (l.isLight) l.layers.enable(CALDO) }) },
    disegna(finto) {
      const o = finto.oggetto, m = finto.materiale
      let x = o
      for (; x && x !== scena; x = x.parent) if (!x.visible) break
      if (x !== scena) return compila(finto)
      const mat = o.material, fc = o.frustumCulled, strati = o.layers.mask
      const taglia = renderer.getScissorTest(), pulisci = renderer.autoClear, ombra = renderer.shadowMap.autoUpdate, ombraOra = renderer.shadowMap.needsUpdate
      renderer.getScissor(forbice); renderer.getViewport(vista)
      try {
        if (Array.isArray(mat)) o.material = m
        o.frustumCulled = false; o.layers.enable(CALDO)
        cam.copy(camera()); cam.layers.set(CALDO)
        renderer.autoClear = false; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = false
        dentro(() => { renderer.setScissorTest(true); renderer.setScissor(0, 0, 1, 1); renderer.render(scena, cam) })
      } finally {
        o.material = mat; o.frustumCulled = fc; o.layers.mask = strati
        renderer.setScissorTest(taglia); renderer.setScissor(forbice); renderer.setViewport(vista)
        renderer.autoClear = pulisci; renderer.shadowMap.autoUpdate = ombra; renderer.shadowMap.needsUpdate = ombraOra
      }
    },
  }
}
