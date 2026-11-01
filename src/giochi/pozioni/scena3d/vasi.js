// I misurini: un cilindro di vetro per ingrediente, con la tacca d'oro
// dove arriva la dose. Dentro, il liquido trasparente, la polvere col suo
// mucchietto o la radice a pezzi impilati (si vedono i pezzi comprati).
// Il livello va verso quello detto da `imposta`, tranne mentre
// un'animazione lo tiene (`trattieni`).
import { Group, Mesh, CylinderGeometry, TorusGeometry, ConeGeometry, CircleGeometry, RingGeometry, Color, Vector3,
         MeshStandardMaterial, MeshBasicMaterial, DoubleSide } from 'three'
import { POSTI } from './banco.js'

export const TACCA = 1.15        // l'altezza della tacca d'oro sopra il fondo
const ALTO = 1.6, R = 0.34, FONDO = 0.1, LARGO = 4.7

const VERDE = new Color(0x58e08a), ORO = new Color(0xf2c14e)

export function creaVasi(scena, trame) {
  const g = new Group()
  scena.add(g)
  let vasi = []

  const vetro = new MeshStandardMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.2, roughness: 0.05,
                                           metalness: 0, depthWrite: false, side: DoubleSide })
  const geoVetro = new CylinderGeometry(R, R, ALTO, 28, 1, true); geoVetro.translate(0, ALTO / 2 + FONDO, 0)
  const geoBordo = new TorusGeometry(R, 0.03, 8, 28)
  const geoTacca = new TorusGeometry(R + 0.015, 0.035, 8, 28)
  const geoFondo = new CylinderGeometry(R + 0.08, R + 0.12, FONDO, 28); geoFondo.translate(0, FONDO / 2, 0)
  const geoDentro = new CylinderGeometry(R - 0.035, R - 0.035, 1, 24); geoDentro.translate(0, 0.5, 0)
  const geoMucchio = new ConeGeometry(R - 0.035, 0.16, 24); geoMucchio.translate(0, 0.08, 0)
  const geoMenisco = new CircleGeometry(R - 0.035, 24); geoMenisco.rotateX(-Math.PI / 2)
  const geoAlone = new RingGeometry(R + 0.16, R + 0.3, 40); geoAlone.rotateX(-Math.PI / 2)
  const geoColpo = new CylinderGeometry(0.6, 0.6, 2.2, 8); geoColpo.translate(0, 1.1, 0)
  const invisibile = new MeshBasicMaterial({ visible: false })
  const legnoScuro = new MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.7 })
  const bordoMat = new MeshStandardMaterial({ color: 0xeef6ff, roughness: 0.1, transparent: true, opacity: 0.6 })

  function materiale(famiglia, colore) {
    const c = new Color(colore)
    if (famiglia === 'capacita')
      return new MeshStandardMaterial({ color: c, transparent: true, opacity: 0.85, roughness: 0.12, emissive: c.clone().multiplyScalar(0.25) })
    if (famiglia === 'massa') return new MeshStandardMaterial({ color: c, roughness: 0.95, map: trame.polvere })
    return new MeshStandardMaterial({ color: c, roughness: 0.85, map: trame.radice })
  }

  function nuovo(d, i, n) {
    // pochi misurini stanno larghi e crescono: si leggono meglio
    const passo = Math.min(1.7, LARGO / n), scala = Math.min(1.15, passo / 1.2)
    const x = (i - (n - 1) / 2) * passo
    const gruppo = new Group()
    gruppo.position.set(x, 0, POSTI.vasiZ)
    gruppo.scale.setScalar(scala)
    const mat = materiale(d.famiglia, d.colore)
    const dentro = new Mesh(geoDentro, mat); dentro.position.y = FONDO
    const cima = new Mesh(d.famiglia === 'massa' ? geoMucchio : geoMenisco,
      d.famiglia === 'capacita' ? new MeshStandardMaterial({ color: mat.color.clone().lerp(new Color(1, 1, 1), 0.3), transparent: true, opacity: 0.9, roughness: 0.05 }) : mat)
    const pila = new Group(); pila.position.y = FONDO
    const tacca = new Mesh(geoTacca, new MeshStandardMaterial({ color: ORO, emissive: 0x5a3c06, metalness: 0.8, roughness: 0.3 }))
    tacca.rotation.x = Math.PI / 2; tacca.position.y = FONDO + TACCA
    const bordo = new Mesh(geoBordo, bordoMat); bordo.rotation.x = Math.PI / 2; bordo.position.y = FONDO + ALTO
    const colpo = new Mesh(geoColpo, invisibile); colpo.userData.tocca = { che: 'vaso', i }
    gruppo.add(new Mesh(geoFondo, legnoScuro), dentro, cima, pila, tacca, new Mesh(geoVetro, vetro), bordo, colpo)
    if (d.famiglia === 'lunghezza') { dentro.visible = false; cima.visible = false }
    const alone = new Mesh(geoAlone, new MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, depthWrite: false }))
    alone.position.set(x, 0.012, POSTI.vasiZ)
    alone.scale.setScalar(scala)
    g.add(gruppo, alone)
    return { gruppo, dentro, cima, pila, tacca, alone, colpo, mat, famiglia: d.famiglia, colore: d.colore,
             casa: gruppo.position.clone(), livello: 0, meta: 0, onda: 0, trattenuto: false, dato: d, pezzi: -1, scelto: false, fatto: false }
  }

  function butta() {
    for (const v of vasi) {
      g.remove(v.gruppo, v.alone)
      v.mat.dispose(); v.alone.material.dispose(); v.tacca.material.dispose()
      if (v.cima.material !== v.mat) v.cima.material.dispose()
      svuotaPila(v)
    }
    vasi = []
  }
  function svuotaPila(v) {
    for (const s of [...v.pila.children]) { v.pila.remove(s); s.material.dispose() }
  }

  // la radice: un pezzo impilato per ogni ampolla comprata, alto quanto vale
  function impila(v, pezzi) {
    svuotaPila(v)
    let y = 0
    pezzi.forEach((f, n) => {
      const h = f * TACCA
      const m = v.mat.clone(); m.color.offsetHSL(0, 0, (n % 2 ? -0.06 : 0.04))
      const s = new Mesh(geoDentro, m)
      s.scale.set(n % 2 ? 0.92 : 1, Math.max(0.001, h - 0.012), n % 2 ? 0.92 : 1)
      s.position.y = y; s.rotation.y = n * 1.7
      v.pila.add(s)
      y += h
    })
  }

  function applica(v) {
    const d = v.dato
    v.fatto = !!d.fatto
    v.meta = d.fatto ? 0 : d.livello
    v.scelto = !!d.scelto
    v.tacca.material.color.copy(d.fatto ? VERDE : ORO)
    v.tacca.material.emissive.copy(d.fatto ? VERDE : ORO).multiplyScalar(d.fatto ? 0.6 : 0.12)
    if (v.famiglia === 'lunghezza') {
      const pezzi = d.fatto ? [] : d.pezzi || []
      if (pezzi.length !== v.pezzi) { impila(v, pezzi); v.pezzi = pezzi.length }
    }
  }

  function imposta(lista) {
    const firma = lista.map(d => `${d.famiglia}:${d.colore}`).join('|')
    if (firma !== vasi.map(v => `${v.famiglia}:${v.colore}`).join('|')) {
      butta()
      vasi = lista.map((d, i) => nuovo(d, i, lista.length))
    }
    lista.forEach((d, i) => { vasi[i].dato = d; if (!vasi[i].trattenuto) applica(vasi[i]) })
  }

  function aggiorna(dt, t) {
    for (const v of vasi) {
      if (!v.trattenuto) v.livello += (v.meta - v.livello) * Math.min(1, dt * 7)
      const h = Math.max(0.001, v.livello * TACCA + v.onda)
      v.dentro.scale.y = h
      v.dentro.visible = v.famiglia !== 'lunghezza' && h > 0.01   // vuoto è vuoto: niente disco sul fondo
      v.cima.position.y = FONDO + h
      v.cima.visible = v.famiglia !== 'lunghezza' && h > 0.01
      const su = v.scelto && !v.trattenuto ? 0.06 + Math.sin(t * 3) * 0.03 : 0
      if (!v.trattenuto) v.gruppo.position.y += (su - v.gruppo.position.y) * Math.min(1, dt * 8)
      v.alone.material.opacity += ((v.scelto ? 0.55 + Math.sin(t * 3) * 0.2 : 0) - v.alone.material.opacity) * Math.min(1, dt * 8)
      if (v.fatto) v.tacca.material.emissiveIntensity = 1 + Math.sin(t * 4) * 0.3
    }
  }

  const v = i => vasi[i]
  return {
    imposta, aggiorna,
    vaso: v,
    get quanti() { return vasi.length },
    colpibili: () => vasi.map(x => x.colpo),
    trattieni(i, si) { const x = vasi[i]; if (!x) return; x.trattenuto = si; if (!si) applica(x) },
    // dove cade quello che si versa: la bocca, in coordinate del mondo
    bocca: i => vasi[i].gruppo.localToWorld(new Vector3(0, FONDO + ALTO, 0)),
    fondo: i => vasi[i].gruppo.localToWorld(new Vector3(0, FONDO + Math.max(0, vasi[i].livello * TACCA), 0)),
    impila,
    rilascia: butta,
  }
}

export const ALTEZZA_VASO = FONDO + ALTO
