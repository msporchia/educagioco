// Il suggerimento: una freccia dipinta sul bersaglio e un puntino che fa il gesto
// al posto del dito, finché il dito non si muove. Sta sopra a tutto e guarda sempre
// lo schermo. Quando mostrarlo lo decide indice.js; vedi docs/pozioni/gesti.md.
import { Sprite, SpriteMaterial, Vector3 } from 'three'

const GIRO = 2.2                // secondi di un giro del puntino
const GRANDE = 2.1              // la freccia, in unità del banco

// dove sta il puntino a un punto `u` (0..1) del gesto, in unità del banco attorno al bersaglio
const STRADE = {
  giro: u => [Math.cos(u * Math.PI * 2) * 0.62, Math.sin(u * Math.PI * 2) * 0.62],
  'su-giu': u => [0, Math.sin(u * Math.PI * 4) * 0.6],
  lato: u => [Math.sin(u * Math.PI * 4) * 0.6, 0],
  agita: u => [Math.sin(u * Math.PI * 6) * 0.6, Math.cos(u * Math.PI * 2) * 0.3],
  inclina: u => { const a = Math.PI * (0.9 - 0.6 * Math.min(1, u * 1.6)); return [Math.cos(a) * 0.7, Math.sin(a) * 0.7 - 0.3] },
}

export function creaFrecce(scena, camera, trame, cambia) {
  const disegno = new Sprite(new SpriteMaterial({ map: trame.frecce.giro, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }))
  const puntino = new Sprite(new SpriteMaterial({ map: trame.morbido, color: 0xffffff, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }))
  disegno.renderOrder = 10; puntino.renderOrder = 11
  disegno.visible = puntino.visible = false
  scena.add(disegno, puntino)

  const destra = new Vector3(), su = new Vector3(), c = new Vector3(), da = new Vector3(), a = new Vector3()
  let tipo = null, resta = Infinity, fase = 0

  function nascondi() {
    if (!tipo) return
    tipo = null
    disegno.visible = puntino.visible = false
    cambia?.(null)
  }
  function accendi(nome, durata) {
    resta = durata; fase = 0
    disegno.visible = puntino.visible = true
    if (tipo !== nome) cambia?.(nome)
    tipo = nome
  }

  return {
    get tipo() { return tipo },
    nascondi,
    // il gesto da fare sul bersaglio
    gesto(nome, dove, durata = Infinity) {
      c.copy(dove)
      disegno.material.map = trame.frecce[nome]
      disegno.material.rotation = 0
      disegno.material.needsUpdate = true
      disegno.scale.set(GRANDE, GRANDE, 1)
      disegno.center.set(0.5, 0.5)
      accendi(nome, durata)
    },
    // la strada da una cosa al suo bersaglio
    strada(partenza, arrivo, durata = Infinity) {
      da.copy(partenza); a.copy(arrivo)
      c.copy(da).lerp(a, 0.5)
      const p = da.clone().project(camera), q = a.clone().project(camera)
      disegno.material.map = trame.frecce.strada
      disegno.material.rotation = Math.atan2((q.y - p.y) / camera.aspect, q.x - p.x)
      disegno.material.needsUpdate = true
      disegno.scale.set(Math.max(1.1, da.distanceTo(a) * 0.92), 0.62, 1)
      disegno.center.set(0.5, 0.5)
      accendi('strada', durata)
    },
    aggiorna(dt) {
      if (!tipo) return
      if ((resta -= dt) <= 0) return nascondi()
      fase = (fase + dt / GIRO) % 1
      destra.setFromMatrixColumn(camera.matrixWorld, 0)
      su.setFromMatrixColumn(camera.matrixWorld, 1)
      disegno.position.copy(c)
      disegno.material.opacity = 0.72 + Math.sin(fase * Math.PI * 4) * 0.2
      puntino.scale.setScalar(0.62)
      if (tipo === 'strada') puntino.position.lerpVectors(da, a, fase)
      else {
        const [x, y] = STRADE[tipo](fase)
        puntino.position.copy(c).addScaledVector(destra, x).addScaledVector(su, y)
      }
    },
    rilascia() {
      scena.remove(disegno, puntino)
      disegno.material.dispose(); puntino.material.dispose()
    },
  }
}
