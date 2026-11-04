// Quello che vola: schizzi, schiuma, scintille e fumo (due nuvole di punti
// con un solo disegno ciascuna), il getto che cade da un'ampolla, la
// macchia per terra e la spugna che la pulisce. Niente allocazioni per
// fotogramma: i punti stanno in una riserva fissa.
import { BufferGeometry, BufferAttribute, Points, ShaderMaterial, AdditiveBlending, NormalBlending, Mesh, Group,
         CylinderGeometry, PlaneGeometry, BoxGeometry, MeshStandardMaterial, Color } from 'three'

const VS = /* glsl */`
attribute float alfa; attribute float misura; attribute vec3 colore;
varying float vA; varying vec3 vC;
uniform float uScala;
void main(){
  vA = alfa; vC = colore;
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_PointSize = misura * uScala / -mv.z;
  gl_Position = projectionMatrix * mv;
}`
const FS = /* glsl */`
varying float vA; varying vec3 vC;
void main(){
  float d = length(gl_PointCoord - .5);
  float a = smoothstep(.5, .15, d) * vA;
  if (a < .01) discard;
  gl_FragColor = vec4(vC, a);
}`

function nuvola(scena, n, additiva) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), alfa = new Float32Array(n), mis = new Float32Array(n)
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(pos, 3))
  geo.setAttribute('colore', new BufferAttribute(col, 3))
  geo.setAttribute('alfa', new BufferAttribute(alfa, 1))
  geo.setAttribute('misura', new BufferAttribute(mis, 1))
  const mat = new ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false,
                                   blending: additiva ? AdditiveBlending : NormalBlending, uniforms: { uScala: { value: 400 } } })
  const p = new Points(geo, mat)
  p.frustumCulled = false
  scena.add(p)
  const vel = new Float32Array(n * 3), vita = new Float32Array(n), durata = new Float32Array(n), base = new Float32Array(n),
        peso = new Float32Array(n), cresce = new Float32Array(n)
  let prossimo = 0
  return {
    mat,
    emetti(quanti, { da, sparpaglia = 0.1, verso = [0, 1, 0], caso = 0.5, colore = '#ffffff', vita: v = 0.8, misura = 0.12, gravita = 4, allarga = 0 }) {
      const c = new Color(colore)
      for (let q = 0; q < quanti; q++) {
        const i = prossimo; prossimo = (prossimo + 1) % n
        pos[i * 3] = da.x + (Math.random() - 0.5) * sparpaglia
        pos[i * 3 + 1] = da.y + (Math.random() - 0.5) * sparpaglia * 0.5
        pos[i * 3 + 2] = da.z + (Math.random() - 0.5) * sparpaglia
        vel[i * 3] = verso[0] + (Math.random() - 0.5) * caso * 2
        vel[i * 3 + 1] = verso[1] + (Math.random() - 0.5) * caso
        vel[i * 3 + 2] = verso[2] + (Math.random() - 0.5) * caso * 2
        const ch = 0.85 + Math.random() * 0.3
        col[i * 3] = c.r * ch; col[i * 3 + 1] = c.g * ch; col[i * 3 + 2] = c.b * ch
        durata[i] = vita[i] = v * (0.7 + Math.random() * 0.6)
        base[i] = misura * (0.7 + Math.random() * 0.6)
        peso[i] = gravita; cresce[i] = allarga
      }
    },
    aggiorna(dt) {
      for (let i = 0; i < n; i++) {
        if (vita[i] <= 0) { alfa[i] = 0; continue }
        vita[i] -= dt
        vel[i * 3 + 1] -= peso[i] * dt
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt
        if (pos[i * 3 + 1] < 0.02) { pos[i * 3 + 1] = 0.02; vel[i * 3 + 1] *= -0.2; vel[i * 3] *= 0.6; vel[i * 3 + 2] *= 0.6 }
        const f = Math.max(0, vita[i] / durata[i])
        alfa[i] = Math.min(1, f * 2.5)
        mis[i] = base[i] * (1 + (1 - f) * cresce[i])
      }
      geo.attributes.position.needsUpdate = geo.attributes.alfa.needsUpdate = geo.attributes.misura.needsUpdate = geo.attributes.colore.needsUpdate = true
    },
    rilascia() { scena.remove(p); geo.dispose(); mat.dispose() },
  }
}

export function creaEffetti(scena, trame) {
  const gocce = nuvola(scena, 500, false)
  const luci = nuvola(scena, 300, true)

  // il getto: un filo che cade dalla bocca dell'ampolla a dove arriva
  const getto = new Mesh(new CylinderGeometry(0.035, 0.06, 1, 10, 1, true),
    new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, roughness: 0.2 }))
  getto.geometry.translate(0, -0.5, 0)
  getto.visible = false
  scena.add(getto)

  // le macchie per terra, una per strumento traboccato: si toccano per pulirle
  const geoMacchia = new PlaneGeometry(1.25, 1.25)
  const macchie = new Map()
  function macchia(i) {
    let m = macchie.get(i)
    if (!m) {
      m = new Mesh(geoMacchia, new MeshStandardMaterial({ color: 0xffffff, alphaMap: trame.macchia, transparent: true,
                                                          roughness: 0.08, metalness: 0.1, depthWrite: false }))
      m.rotation.x = -Math.PI / 2; m.rotation.z = macchie.size * 1.9
      m.visible = false
      m.userData.tocca = { che: 'macchia' }
      scena.add(m)
      macchie.set(i, m)
    }
    return m
  }

  // la spugna: gialla, col verde ruvido sotto
  const spugna = new Group()
  const s1 = new Mesh(new BoxGeometry(0.46, 0.16, 0.32), new MeshStandardMaterial({ color: 0xf6d34a, roughness: 0.95 }))
  const s2 = new Mesh(new BoxGeometry(0.46, 0.06, 0.32), new MeshStandardMaterial({ color: 0x3f9a52, roughness: 1 }))
  s1.position.y = 0.11; s2.position.y = 0.03
  spugna.add(s1, s2)
  spugna.visible = false
  scena.add(spugna)

  return {
    gocce, luci, getto, macchia, spugna,
    macchieVisibili: () => [...macchie.values()].filter(m => m.visible),
    macchie,
    // il getto da `a` a `b`, del colore dell'ingrediente (la polvere è opaca)
    versa(a, b, colore, polvere = false) {
      getto.visible = true
      getto.position.copy(a)
      const l = Math.max(0.01, a.y - b.y)
      getto.scale.set(polvere ? 1.3 : 1, l, polvere ? 1.3 : 1)
      getto.material.color.set(colore)
      getto.material.opacity = polvere ? 0.75 : 0.9
    },
    smetti() { getto.visible = false },
    scala(s) { gocce.mat.uniforms.uScala.value = s; luci.mat.uniforms.uScala.value = s },
    aggiorna(dt) { gocce.aggiorna(dt); luci.aggiorna(dt) },
    rilascia() {
      gocce.rilascia(); luci.rilascia()
      for (const m of macchie.values()) { scena.remove(m); m.material.dispose() }
      macchie.clear()
    },
  }
}
