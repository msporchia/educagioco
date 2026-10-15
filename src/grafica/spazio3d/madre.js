// La nave madre in 3D (docs/asteroidi/boss.md): un disco col bordo d'oro, due cannoni sotto
// le ali, la cupola col comandante. I pezzi stanno dove li mette il disegno 2D
// (`cannoneDi`, `cupolaDi` di grafica/nave-madre.js: cannoni a ±1,3 e 0,475 sotto, cupola
// a 0,3 sopra, in unità del raggio), così il raggio che rimbalza va a colpire il pezzo.
// Riceve solo i pezzi che le restano (`sx`, `dx`, `cupola`, `paura`) e dove guarda.
import { Group, Mesh, LatheGeometry, TorusGeometry, SphereGeometry, CylinderGeometry, BoxGeometry, PlaneGeometry,
         CircleGeometry, Vector2, MeshStandardMaterial, MeshBasicMaterial, ShaderMaterial, AdditiveBlending,
         Color, CanvasTexture, SRGBColorSpace, BufferAttribute } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { materialeSasso, BRACE_CATENA } from './materia.js'
import { tingi, posa } from './forme.js'

const QV = /* glsl */`varying vec2 vU; void main(){ vU = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
const ALONE_F = /* glsl */`varying vec2 vU; uniform vec3 uC; uniform float uA;
  void main(){ float r = length(vU); float a = pow(max(0., 1. - r), 2.2) * uA; gl_FragColor = vec4(uC * a, a); }`

function crepe() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128
  const c = cv.getContext('2d')
  c.fillStyle = '#000'; c.fillRect(0, 0, 256, 128)
  c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.lineCap = 'round'
  c.beginPath()
  c.moveTo(40, 30); c.lineTo(62, 62); c.lineTo(52, 100); c.moveTo(62, 62); c.lineTo(80, 20)
  c.moveTo(96, 40); c.lineTo(78, 70); c.stroke()
  const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace
  return t
}

export function creaMadre(scena) {
  const madre = new Group(); madre.visible = false
  const corpo = new Group(); madre.add(corpo)   // si inclina; il comandante e i cannoni con lei

  // lo scafo: tornio, viola metallico, con le lucette rosse in catena lungo il bordo (materia.js)
  const profilo = [[0, -0.34], [0.8, -0.32], [1.45, -0.16], [1.72, 0], [1.5, 0.13], [0.95, 0.24], [0.6, 0.28], [0, 0.3]]
    .map(([x, y]) => new Vector2(x, y))
  const scafo = new LatheGeometry(profilo, 48)
  const p = scafo.attributes.position, cc = new Float32Array(p.count * 3), c = new Color()
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), l = 0.35 + 0.65 * Math.max(0, Math.min(1, (y + 0.34) / 0.64))
    c.setRGB(0.42 * l + 0.05, 0.36 * l + 0.04, 0.62 * l + 0.08); cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b
  }
  scafo.setAttribute('color', new BufferAttribute(cc, 3))
  scafo.setAttribute('brace', new BufferAttribute(new Float32Array(p.count), 1))
  scafo.deleteAttribute('uv')
  const pezzi = [scafo.toNonIndexed()]
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2
    pezzi.push(posa(tingi(new SphereGeometry(0.07, 8, 6), '#ff6b6b', (i + 1) / 17), Math.cos(a) * 1.52, 0.05, Math.sin(a) * 1.52).toNonIndexed())
  }
  const mat = materialeSasso()
  mat.metalness = 0.65; mat.roughness = 0.35
  mat.userData.u.uBraceModo.value = BRACE_CATENA; mat.userData.u.uBraceK.value = 1
  mat.userData.u.uBordo.value.setRGB(0.35, 0.15, 0.45)
  const disco = new Mesh(mergeGeometries(pezzi), mat)
  corpo.add(disco)
  const oro = new MeshStandardMaterial({ color: 0xffd94a, metalness: 0.9, roughness: 0.25, envMapIntensity: 1.2 })
  const bordo = new Mesh(new TorusGeometry(1.72, 0.05, 8, 64), oro); bordo.rotation.x = Math.PI / 2
  corpo.add(bordo)
  const fascia = new Mesh(new TorusGeometry(1.2, 0.03, 6, 48), new MeshStandardMaterial({ color: 0x1a1030, roughness: 0.6 }))
  fascia.rotation.x = Math.PI / 2; fascia.position.y = -0.24; corpo.add(fascia)

  // i cannoni sotto le ali, e il buco che resta quando saltano
  const ferro = new MeshStandardMaterial({ color: 0x4a3a6a, metalness: 0.6, roughness: 0.4, envMapIntensity: 0.8 })
  const canna = new MeshStandardMaterial({ color: 0x2a2040, metalness: 0.5, roughness: 0.5 })
  const bocca = new MeshBasicMaterial({ color: new Color(3, 0.5, 0.5) })
  const corpoCannone = new BoxGeometry(0.32, 0.55, 0.32)
  const cannaCannone = new CylinderGeometry(0.07, 0.07, 0.32, 10)
  const boccaCannone = new SphereGeometry(0.09, 10, 8)
  function cannone() {
    const g = new Group()
    const a = new Mesh(corpoCannone, ferro); a.position.y = 0
    const b = new Mesh(cannaCannone, canna); b.position.y = -0.42
    const d = new Mesh(boccaCannone, bocca); d.position.y = -0.6
    g.add(a, b, d)
    return g
  }
  const cannoni = [-1, 1].map(lato => { const g = cannone(); g.position.set(lato * 1.3, -0.475, 0.1); corpo.add(g); return g })
  const buchi = [-1, 1].map(lato => {
    const m = new Mesh(new CircleGeometry(0.2, 9), new MeshStandardMaterial({ color: 0x120a1c, emissive: new Color(0.6, 0.2, 0.03), roughness: 1 }))
    m.position.set(lato * 1.25, -0.3, 0.42); m.rotation.x = -0.35; m.scale.set(1.3, 1, 1); m.visible = false
    corpo.add(m); return m
  })

  // la cupola e il comandante
  const vetro = new MeshStandardMaterial({ color: 0xbff8ff, transparent: true, opacity: 0.3, roughness: 0.06, metalness: 0.1,
                                           depthWrite: false, envMapIntensity: 1.5, emissive: new Color(0, 0, 0) })
  const rotto = vetro.clone(); rotto.emissiveMap = crepe(); rotto.emissive = new Color(1, 1, 1); rotto.opacity = 0.42
  const cupola = new Mesh(new SphereGeometry(0.78, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), vetro)
  cupola.position.y = 0.12; cupola.renderOrder = 4; corpo.add(cupola)
  const pelle = new MeshStandardMaterial({ color: 0x6ee26e, roughness: 0.55 })
  const testa = new Mesh(new SphereGeometry(1, 20, 14), pelle)
  testa.scale.set(0.4, 0.34, 0.32); testa.position.set(0, 0.38, 0.05); corpo.add(testa)
  const bianco = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  const nero = new MeshBasicMaterial({ color: 0x111111 })
  const scuroVerde = new MeshBasicMaterial({ color: 0x1a3a1a })
  const occhi = [-1, 1].map(lato => {
    const o = new Mesh(new SphereGeometry(1, 12, 10), bianco); o.scale.set(0.12, 0.14, 0.08); o.position.set(lato * 0.15, 0.4, 0.34)
    const pupilla = new Mesh(new SphereGeometry(0.06, 10, 8), nero); pupilla.position.set(lato * 0.15, 0.4, 0.41)
    const ciglio = new Mesh(new BoxGeometry(0.24, 0.035, 0.03), scuroVerde); ciglio.position.set(lato * 0.16, 0.6, 0.37)
    corpo.add(o, pupilla, ciglio)
    return { lato, pupilla, ciglio }
  })
  const bocca1 = new Mesh(new BoxGeometry(0.24, 0.03, 0.03), scuroVerde); bocca1.position.set(0, 0.2, 0.36)
  const boccaO = new Mesh(new TorusGeometry(0.06, 0.018, 6, 16), scuroVerde); boccaO.position.set(0, 0.2, 0.36); boccaO.scale.set(1.3, 1, 1)
  const goccia = new Mesh(new SphereGeometry(0.05, 10, 8), new MeshStandardMaterial({ color: 0x7fd0ff, roughness: 0.1 }))
  goccia.scale.set(1, 1.6, 1); goccia.position.set(0.33, 0.55, 0.3)
  corpo.add(bocca1, boccaO, goccia)

  // l'alone rosso dietro
  const alone = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ vertexShader: QV, fragmentShader: ALONE_F, transparent: true,
    depthWrite: false, blending: AdditiveBlending, uniforms: { uC: { value: new Color(1.2, 0.3, 0.3) }, uA: { value: 0.35 } } }))
  alone.scale.setScalar(2.6); alone.position.z = -1.5; alone.renderOrder = -1
  madre.add(alone)
  madre.rotation.x = 0.22
  scena.add(madre)

  // i cannoni staccati che volano via
  const volanti = [cannone(), cannone()]
  for (const v of volanti) { v.visible = false; scena.add(v) }

  return {
    // `m`: la nave madre della view, in pixel; `pezzi`: i cannoni che volano via
    disegna(m, pezziVia, X, Y, k, t, dt, sciame, S) {
      madre.visible = !!m
      if (m) {
        madre.position.set(X(m.x), Y(m.y), -0.2)
        madre.scale.setScalar(m.r * k)
        corpo.rotation.z = -(m.inclina || 0)
        disco.rotation.y = t * 0.25
        mat.userData.u.uT.value = t
        cannoni[0].visible = !!m.sx; cannoni[1].visible = !!m.dx
        buchi[0].visible = !m.sx; buchi[1].visible = !m.dx
        bocca.color.setRGB(3 * (0.6 + 0.4 * Math.sin(t * 8)), 0.5, 0.5)
        cupola.material = m.cupola ? vetro : rotto
        // il comandante guarda la nave: le pupille si spostano verso di lei
        const [gx, gy] = m.guarda || [0, 1], lun = Math.max(1, Math.hypot(gx, gy))
        for (const o of occhi) {
          o.pupilla.position.set(o.lato * 0.15 + gx / lun * 0.05, 0.4 - gy / lun * 0.05, 0.41)
          o.ciglio.rotation.z = m.paura ? -o.lato * 0.3 : o.lato * 0.42
          o.ciglio.position.y = m.paura ? 0.62 : 0.57
        }
        pelle.color.set(m.paura ? 0x9be29b : 0x6ee26e)
        bocca1.visible = !m.paura; boccaO.visible = goccia.visible = !!m.paura
        // dai buchi esce fumo, e ogni tanto una scintilla
        for (const lato of [-1, 1]) {
          if (lato < 0 ? m.sx : m.dx) continue
          if (Math.random() < dt * 12) {
            const x = m.x + lato * m.r * 1.25, y = m.y + m.r * 0.3
            sciame.emetti(x, y, lato * (10 + Math.random() * 25) * S, -(30 + Math.random() * 30) * S, 1 + Math.random() * 0.6,
                          (3 + Math.random() * 3) * S, '#6a6070', true, -10 * S)
            if (Math.random() < 0.35) sciame.emetti(x, y, (Math.random() - 0.5) * 90 * S, (Math.random() - 0.3) * 80 * S, 0.4,
                                                    1.6 * S, '#ffd94a', false, 200 * S)
          }
        }
      }
      for (let i = 0; i < volanti.length; i++) {
        const v = volanti[i], p = pezziVia[i]
        v.visible = !!p
        if (!p) continue
        v.position.set(X(p.x), Y(p.y), 0)
        v.scale.setScalar(p.r * k * Math.max(0.2, p.vita))
        v.rotation.set(t * 2, 0, -p.rot)
        if (Math.random() < dt * 30) sciame.emetti(p.x, p.y, (Math.random() - 0.5) * 40 * S, (Math.random() - 0.5) * 40 * S, 0.4,
                                                   1.8 * S, Math.random() < 0.5 ? '#ffd94a' : '#ff9d1c', false, 0)
      }
    },
  }
}
