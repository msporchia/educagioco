// Gli strumenti di misura, uno per ingrediente e solo finché serve: il
// cilindro graduato per i liquidi, la bilancia col quadrante e il piatto
// per le polveri, il metro in piedi con la barretta d'oro per le radici.
// Tutti segnano in oro dove arriva la dose e hanno sotto il nome di cosa
// misurano; a ingrediente finito vengono messi via. Il livello va verso
// quello detto da `imposta`, tranne mentre un'animazione lo tiene.
import { Group, Mesh, Sprite, SpriteMaterial, CylinderGeometry, TorusGeometry, ConeGeometry, CircleGeometry, BoxGeometry, LatheGeometry,
         Color, Vector2, Vector3, MeshStandardMaterial, MeshBasicMaterial, DoubleSide, TextureLoader, SRGBColorSpace } from 'three'
import { POSTI } from './banco.js'
import { nomeSulBanco } from './trame.js'

export const TACCA = 1.15        // l'altezza dell'oro sopra il fondo
const ALTO = 1.6, R = 0.34, FONDO = 0.1, LARGO = 4.7
const PIATTO_Y = 0.78            // la bilancia: dov'è il piatto a vuoto

const ORO = new Color(0xf2c14e)

export function creaVasi(scena, trame) {
  const g = new Group()
  scena.add(g)
  const vasi = new Map()         // indice dell'ingrediente → strumento

  const vetro = new MeshStandardMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.2, roughness: 0.05,
                                           metalness: 0, depthWrite: false, side: DoubleSide })
  const legnoScuro = new MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.7 })
  const legnoChiaro = new MeshStandardMaterial({ color: 0x8a5a34, roughness: 0.6 })
  const ottone = new MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.8, roughness: 0.35, side: DoubleSide })
  const bordoMat = new MeshStandardMaterial({ color: 0xeef6ff, roughness: 0.1, transparent: true, opacity: 0.6 })
  const invisibile = new MeshBasicMaterial({ visible: false })
  const quadrante = new MeshStandardMaterial({ map: trame.quadrante, roughness: 0.5 })
  const asta = new MeshStandardMaterial({ map: trame.metro, roughness: 0.65 })
  const tacche = new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.4 })

  const geo = {
    vetro: new CylinderGeometry(R, R, ALTO, 28, 1, true).translate(0, ALTO / 2 + FONDO, 0),
    bordo: new TorusGeometry(R, 0.03, 8, 28),
    tacca: new TorusGeometry(R + 0.015, 0.035, 8, 28),
    fondo: new CylinderGeometry(R + 0.08, R + 0.12, FONDO, 28).translate(0, FONDO / 2, 0),
    dentro: new CylinderGeometry(R - 0.035, R - 0.035, 1, 24).translate(0, 0.5, 0),
    menisco: new CircleGeometry(R - 0.035, 24).rotateX(-Math.PI / 2),
    segno: new BoxGeometry(0.14, 0.014, 0.01),
    // la bilancia
    cassa: new BoxGeometry(0.86, 0.6, 0.56).translate(0, 0.3, 0),
    faccia: new CircleGeometry(0.235, 32),
    lancetta: new BoxGeometry(0.022, 0.2, 0.012).translate(0, 0.09, 0),
    perno: new CylinderGeometry(0.03, 0.03, 0.03, 12).rotateX(Math.PI / 2),
    stelo: new CylinderGeometry(0.05, 0.07, 0.2, 12).translate(0, 0.1, 0),
    piatto: new LatheGeometry([[0, 0], [0.32, 0.01], [0.46, 0.07], [0.48, 0.09]].map(([x, y]) => new Vector2(x, y)), 32),
    mucchio: new ConeGeometry(1, 1, 24),
    // il metro
    piede: new BoxGeometry(0.72, FONDO, 0.42).translate(0, FONDO / 2, 0),
    asta: new BoxGeometry(0.32, ALTO, 0.06).translate(0, ALTO / 2 + FONDO, 0),
    barretta: new BoxGeometry(0.56, 0.05, 0.1),
    colpo: new CylinderGeometry(0.6, 0.6, 2.2, 8).translate(0, 1.1, 0),
  }

  const fotoDi = uri => { const t = new TextureLoader().load(uri); t.colorSpace = SRGBColorSpace; return t }

  function materiale(famiglia, colore) {
    const c = new Color(colore)
    if (famiglia === 'capacita')
      return new MeshStandardMaterial({ color: c, transparent: true, opacity: 0.85, roughness: 0.12, emissive: c.clone().multiplyScalar(0.25) })
    if (famiglia === 'massa') return new MeshStandardMaterial({ color: c, roughness: 0.95, map: trame.polvere })
    return new MeshStandardMaterial({ color: c, roughness: 0.85, map: trame.radice })
  }
  const oro = () => new MeshStandardMaterial({ color: ORO, emissive: 0x5a3c06, metalness: 0.8, roughness: 0.3 })

  // il cilindro: il liquido sale nel vetro, e le righe dicono che si misura
  function cilindro(v, mat) {
    const corpo = new Group()
    const dentro = new Mesh(geo.dentro, mat); dentro.position.y = FONDO
    const cima = new Mesh(geo.menisco, new MeshStandardMaterial({ color: mat.color.clone().lerp(new Color(1, 1, 1), 0.3), transparent: true, opacity: 0.9, roughness: 0.05 }))
    v.segno = new Mesh(geo.tacca, oro()); v.segno.rotation.x = Math.PI / 2; v.segno.position.y = FONDO + TACCA
    const bordo = new Mesh(geo.bordo, bordoMat); bordo.rotation.x = Math.PI / 2; bordo.position.y = FONDO + ALTO
    corpo.add(new Mesh(geo.fondo, legnoScuro), dentro, cima, v.segno, new Mesh(geo.vetro, vetro), bordo)
    for (let n = 1; n <= 7; n++) {
      const r = new Mesh(geo.segno, tacche)
      r.position.set(0, FONDO + TACCA * n / 6, R + 0.004)
      r.scale.x = n % 3 ? 0.6 : 1
      corpo.add(r)
    }
    v.gruppo.add(corpo)
    v.trasporto = corpo
    v.boccaT = new Vector3(0, FONDO + ALTO, 0)
    v.materiali.push(cima.material)
    v.disegna = l => {
      const h = Math.max(0.001, l)
      dentro.scale.y = h
      dentro.visible = cima.visible = h > 0.01
      cima.position.y = FONDO + h
    }
    v.quota = l => FONDO + l
  }

  // la bilancia: la polvere fa il mucchio sul piatto, il piatto cala e la lancetta gira verso l'oro
  function bilancia(v, mat) {
    const cassa = new Mesh(geo.cassa, legnoChiaro)
    const faccia = new Mesh(geo.faccia, quadrante); faccia.position.set(0, 0.3, 0.285)
    const lancetta = new Mesh(geo.lancetta, new MeshStandardMaterial({ color: 0xc23b3b, roughness: 0.4 })); lancetta.position.set(0, 0.3, 0.295)
    const perno = new Mesh(geo.perno, ottone); perno.position.set(0, 0.3, 0.3)
    const stelo = new Mesh(geo.stelo, ottone); stelo.position.y = 0.6
    const piatto = new Group(); piatto.position.y = PIATTO_Y
    const mucchio = new Mesh(geo.mucchio, mat)
    piatto.add(new Mesh(geo.piatto, ottone), mucchio)
    v.gruppo.add(cassa, faccia, lancetta, perno, stelo, piatto)
    v.segno = faccia
    v.trasporto = piatto
    v.boccaT = new Vector3(0, 0.1, 0)
    v.materiali.push(lancetta.material)
    v.disegna = (l, trattenuto) => {
      const f = l / TACCA, h = Math.max(0.001, 0.62 * f), r = 0.44 * Math.min(1.1, Math.sqrt(Math.max(0, f)))
      mucchio.visible = f > 0.01
      mucchio.scale.set(Math.max(0.001, r), h, Math.max(0.001, r))
      mucchio.position.y = 0.06 + h / 2
      lancetta.rotation.z = 2.1 * (1 - Math.min(1.45, f))
      if (!trattenuto || v.piattoFermo !== true) piatto.position.y = PIATTO_Y - 0.1 * Math.min(1.3, f)
    }
    v.quota = l => PIATTO_Y + 0.06 + 0.62 * (l / TACCA)
  }

  // il metro in piedi: i pezzi di radice salgono uno sull'altro lungo l'asta, fino alla barretta d'oro
  function metro(v) {
    const piede = new Mesh(geo.piede, legnoScuro)
    const legno = new Mesh(geo.asta, asta)
    v.segno = new Mesh(geo.barretta, oro()); v.segno.position.set(0, FONDO + TACCA, 0.04)
    const pila = new Group(); pila.position.set(0, FONDO, 0.14)
    v.gruppo.add(piede, legno, v.segno, pila)
    v.pila = pila
    v.trasporto = pila
    v.boccaT = new Vector3(0, TACCA, 0)
    v.disegna = () => {}
    v.quota = l => FONDO + l
  }

  function nuovo(d) {
    const gruppo = new Group()
    gruppo.position.set(0, 0, POSTI.vasiZ)
    gruppo.scale.setScalar(0.001)
    const mat = materiale(d.famiglia, d.colore)
    const colpo = new Mesh(geo.colpo, invisibile); colpo.userData.tocca = { che: 'vaso', i: d.i }
    const targa = new Sprite(new SpriteMaterial({ map: nomeSulBanco(d.nome), transparent: true, depthWrite: false }))
    targa.scale.set(1.1, 0.385, 1); targa.position.set(0, 0.24, 0.72)
    // la foto del modello, non il modello: la camera è ferma e si vede uguale, e costruirlo sul telefono costerebbe secondi
    const figura = new Sprite(new SpriteMaterial({ map: fotoDi(d.foto), transparent: true, depthWrite: false, toneMapped: false }))
    figura.scale.set(0.5, 0.5, 1); figura.position.set(-0.42, 0.68, 0.74)
    gruppo.add(colpo, targa, figura)
    g.add(gruppo)
    const v = { i: d.i, gruppo, colpo, targa, figura, mat, famiglia: d.famiglia, colore: d.colore, casa: gruppo.position.clone(), materiali: [], scala: 1,
                livello: 0, meta: 0, onda: 0, trattenuto: false, dato: d, pezzi: -1, esce: false, nuovo: true }
    if (d.famiglia === 'capacita') cilindro(v, mat)
    else if (d.famiglia === 'massa') bilancia(v, mat)
    else metro(v)
    v.casaT = v.trasporto.position.clone()
    return v
  }

  function svuotaPila(v) {
    if (!v.pila) return
    for (const s of [...v.pila.children]) { v.pila.remove(s); s.material.dispose() }
  }
  function butta(v) {
    g.remove(v.gruppo)
    v.mat.dispose()
    v.targa.material.map.dispose(); v.targa.material.dispose()
    v.figura.material.map.dispose(); v.figura.material.dispose()
    for (const m of v.materiali) m.dispose()
    if (v.segno.material !== quadrante) v.segno.material.dispose()
    svuotaPila(v)
  }

  // la radice: un pezzo per ogni ampolla comprata, alto quanto vale
  function impila(v, pezzi) {
    svuotaPila(v)
    let y = 0
    pezzi.forEach((f, n) => {
      const h = f * TACCA
      const m = v.mat.clone(); m.color.offsetHSL(0, 0, (n % 2 ? -0.06 : 0.04))
      const s = new Mesh(geo.dentro, m)
      s.scale.set(n % 2 ? 0.34 : 0.38, Math.max(0.001, h - 0.012), n % 2 ? 0.34 : 0.38)
      s.position.y = y; s.rotation.y = n * 1.7
      v.pila.add(s)
      y += h
    })
    v.pezzi = pezzi.length
  }

  function applica(v) {
    const d = v.dato
    v.meta = d.livello
    if (v.pila && (d.pezzi || []).length !== v.pezzi) impila(v, d.pezzi || [])
  }

  function disponi() {
    const qui = [...vasi.values()].filter(v => !v.esce), n = qui.length
    // pochi strumenti stanno larghi e crescono: si leggono meglio
    const passo = Math.min(1.7, LARGO / Math.max(1, n)), scala = Math.min(1.2, passo / 1.2)
    qui.forEach((v, i) => {
      v.casa.x = (i - (n - 1) / 2) * passo
      v.scala = scala
      if (v.nuovo) { v.gruppo.position.x = v.casa.x; v.nuovo = false }
    })
  }

  // davanti c'è solo quello che serve: chi non è in lista viene messo via
  function imposta(lista) {
    const vogliono = new Set(lista.map(d => d.i))
    for (const v of vasi.values()) v.esce = !vogliono.has(v.i)
    for (const d of lista) {
      if (!vasi.has(d.i)) vasi.set(d.i, nuovo(d))
      const v = vasi.get(d.i)
      v.dato = d
      if (!v.trattenuto) applica(v)
    }
    disponi()
  }

  function aggiorna(dt) {
    for (const v of [...vasi.values()]) {
      if (!v.trattenuto) v.livello += (v.meta - v.livello) * Math.min(1, dt * 7)
      v.disegna(v.livello * TACCA + v.onda, v.trattenuto)
      const s = v.gruppo.scale.x + ((v.esce ? 0 : v.scala) - v.gruppo.scale.x) * Math.min(1, dt * 7)
      v.gruppo.scale.setScalar(Math.max(0.001, s))
      v.gruppo.position.x += (v.casa.x - v.gruppo.position.x) * Math.min(1, dt * 6)
      if (v.esce && s < 0.03) { butta(v); vasi.delete(v.i) }
    }
  }

  return {
    imposta, aggiorna,
    vaso: i => vasi.get(i),
    colpibili: () => [...vasi.values()].map(x => x.colpo),
    trattieni(i, si) { const x = vasi.get(i); if (!x) return; x.trattenuto = si; if (!si) applica(x) },
    // dove cade quello che si versa, in coordinate del mondo
    bocca: i => { const v = vasi.get(i); return v.trasporto.localToWorld(v.boccaT.clone()).add(new Vector3(0, v.famiglia === 'massa' ? 0.75 : 0, 0)) },
    fondo: i => { const v = vasi.get(i); return v.gruppo.localToWorld(new Vector3(0, v.quota(Math.max(0, v.livello * TACCA)), v.famiglia === 'lunghezza' ? 0.14 : 0)) },
    scala: i => vasi.get(i).scala,
    impila,
    rilascia() { for (const v of vasi.values()) butta(v); vasi.clear() },
  }
}

export const ALTEZZA_VASO = FONDO + ALTO
