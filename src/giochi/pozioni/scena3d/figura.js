// Una figura sul banco: la foto del modello in piedi sul tavolo, che si piega
// sui piedi e ha un'ombra. La camera è ferma, quindi si vede come il modello
// e non costa niente (docs/pozioni/personaggi.md).
import { Sprite, SpriteMaterial, Mesh, CircleGeometry, MeshBasicMaterial, TextureLoader, SRGBColorSpace } from 'three'

const PIEDI = 0.03              // dove cadono i piedi nella foto, dal basso (strumenti/banco/foto-ingredienti.html)

export function creaFigura(scena, trame, alto) {
  const materiale = new SpriteMaterial({ transparent: true, depthWrite: false, toneMapped: false, fog: false })
  const sprite = new Sprite(materiale)
  sprite.center.set(0.5, PIEDI)
  const ombra = new Mesh(new CircleGeometry(0.5, 24), new MeshBasicMaterial({ map: trame.morbido, color: 0x0a0612, transparent: true, opacity: 0.5, depthWrite: false }))
  ombra.rotation.x = -Math.PI / 2
  scena.add(ombra, sprite)
  const trame3 = new Map()
  const foto = uri => {
    if (!trame3.has(uri)) { const t = new TextureLoader().load(uri); t.colorSpace = SRGBColorSpace; trame3.set(uri, t) }
    return trame3.get(uri)
  }
  const f = {
    sprite,
    posa(uri) { materiale.map = foto(uri); materiale.needsUpdate = true },
    // `su`: quanto è staccata da terra. L'ombra resta sul tavolo e si stringe.
    dove(x, z, su = 0) {
      sprite.position.set(x, su + 0.02, z)
      ombra.position.set(x, 0.02, z + 0.1)
      const k = alto * 0.62 * Math.max(0.3, 1 - su * 0.22) * f.grande
      ombra.scale.set(k, k * 0.55, 1)
    },
    grande: 1,
    // larga e alta a parte: schiacciarsi vuol dire farsi più larghi
    misura(k = 1, lungo = 1) { f.grande = k; sprite.scale.set(alto * k / Math.sqrt(lungo), alto * k * lungo, 1) },
    piega(a) { materiale.rotation = a },
    trasparenza(a) { materiale.opacity = a; ombra.material.opacity = 0.5 * a },
    mostra(si) { sprite.visible = si; ombra.visible = si },
    rilascia() {
      for (const t of trame3.values()) t.dispose()
      materiale.dispose(); ombra.geometry.dispose(); ombra.material.dispose()
    },
  }
  f.misura()
  return f
}
