// I sassi in 3D: un posto (mesh, tela del numero, alone) per ogni sasso in scena, riusato
// da un'ondata all'altra. Il numero è inciso: la stessa tela fa da colore (la pietra
// più scura attorno) e da rilievo (la scanalatura), e una seconda accende di azzurro il
// fondo del solco. Il disegno non guarda mai `a.ok` (docs/asteroidi/cieli.md).
import { Mesh, Group, CanvasTexture, NoColorSpace, SRGBColorSpace, PlaneGeometry, ConeGeometry, SphereGeometry,
         ShaderMaterial, MeshStandardMaterial, AdditiveBlending, Color } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { materialeSasso, BRACE_FISSA, BRACE_CATENA } from './materia.js'
import { formaDi, tingi, posa, INCLINA_DISCO } from './forme.js'
import { rgb } from './rumore.js'

export const POSTI = 10
const AZZURRO = [0.3, 0.9, 1.5], ROSSO = [2.2, 0.3, 0.25]

// come appare ogni specie: materia, bagliori, e cosa porta attorno
const ASPETTO = {
  roccia: { rough: 0.92, metal: 0.08, alone: '#ff9d1c', aloneK: 0.22 },
  marte: { rough: 0.9, metal: 0.06, alone: '#ff7a4a', aloneK: 0.22 },
  ghiaccio: { rough: 0.22, metal: 0.05, bordo: [0.2, 0.5, 0.75], alone: '#7fe3ff', aloneK: 0.35, coda: true },
  rottami: { rough: 0.5, metal: 0.55, alone: '#ff9d1c', aloneK: 0.18 },
  cristalli: { rough: 0.16, metal: 0.15, bordo: [0.6, 0.15, 0.85], alone: '#d07bff', aloneK: 0.4,
               brace: [1.2, 0.35, 2.0], braceK: 0.8, pulsa: true },
  dischi: { rough: 0.32, metal: 0.7, alone: '#9dff9d', aloneK: 0.18, catena: true, alieno: true },
  lava: { rough: 0.95, metal: 0, alone: '#ff6a00', aloneK: 0.38, brace: [3.2, 0.95, 0.15], braceK: 1, pulsa: true },
  nero: { rough: 0.6, metal: 0.25, bordo: [0.75, 0.42, 1.3], alone: '#a06bff', aloneK: 0.3 },
  bomba: { rough: 0.35, metal: 0.6, alone: '#ff6b6b', aloneK: 0.45, brace: [3.5, 0.35, 0.3], braceK: 1, lampeggia: true },
}

// ---- la tela del numero ----
function scriviNumero(posto, testo) {
  const { a, b } = posto.tele
  const cifre = String(testo).length
  const px = cifre > 3 ? 64 : cifre > 2 ? 82 : 98
  let c = a.getContext('2d')
  c.setTransform(1, 0, 0, 1, 0, 0); c.shadowBlur = 0
  c.fillStyle = '#fff'; c.fillRect(0, 0, 256, 128)
  // la pietra più scura attorno, in un ovale che si spegne prima dei bordi (oltre, l'uv ripete il bordo)
  c.translate(128, 64); c.scale(1, 0.5)
  const g = c.createRadialGradient(0, 0, 8, 0, 0, 118)
  g.addColorStop(0, '#8a8a8a'); g.addColorStop(0.55, '#b5b5b5'); g.addColorStop(1, '#fff')
  c.fillStyle = g; c.fillRect(-128, -128, 256, 256)
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.font = `900 ${px}px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'
  c.fillStyle = '#000'; c.shadowColor = '#000'; c.shadowBlur = 5
  c.fillText(testo, 128, 70); c.fillText(testo, 128, 70)
  c = b.getContext('2d')
  c.setTransform(1, 0, 0, 1, 0, 0); c.shadowBlur = 0
  c.fillStyle = '#000'; c.fillRect(0, 0, 256, 128)
  c.font = `900 ${px}px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'
  c.fillStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 3
  c.fillText(testo, 128, 70); c.fillText(testo, 128, 70)
  posto.mappa.needsUpdate = true; posto.luce.needsUpdate = true
}

// ---- quello che i sassi portano attorno: geometrie e materiali comuni ----
function comuni() {
  const QV = /* glsl */`varying vec2 vU; void main(){ vU = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
  const coda = new ConeGeometry(0.75, 3.4, 18, 1, true)
  coda.translate(0, 1.7, 0)
  const codaMat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { uT: { value: 0 }, uGelo: { value: 0 } },
    vertexShader: `varying vec2 vU; varying vec3 vN; varying vec3 vV; void main(){ vU = uv; vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec2 vU; varying vec3 vN; varying vec3 vV; uniform float uT;
      void main(){ float lungo = vU.y; float c = pow(abs(dot(vN, vV)), 1.2);
        float onda = .75 + .25 * sin(lungo * 18. - uT * 7. + vU.x * 20.);
        float a = pow(1. - lungo, 1.3) * (.35 + .65 * c) * onda * .9;
        gl_FragColor = vec4(mix(vec3(.85, .97, 1.2), vec3(.3, .7, 1.), lungo) * a, a); }`,
  })
  // l'alieno nel disco: testa, occhi e antenne in un pezzo solo
  const testa = tingi(new SphereGeometry(0.24, 14, 10), '#6ee26e'); posa(testa, 0, 0, 0, 0, 0, 0, 1, 0.9, 0.9)
  const occhi = [-1, 1].map(s => posa(tingi(new SphereGeometry(0.07, 8, 6), '#111'), s * 0.09, 0.02, 0.19, 0, 0, 0, 0.8, 1.2, 0.6))
  const luci = [-1, 1].map(s => posa(tingi(new SphereGeometry(0.025, 6, 4), '#fff'), s * 0.075, 0.06, 0.24))
  const antenne = [-1, 1].map(s => posa(tingi(new ConeGeometry(0.02, 0.22, 5), '#6ee26e'), s * 0.11, 0.27, 0, 0, 0, -s * 0.4))
  const palline = [-1, 1].map(s => posa(tingi(new SphereGeometry(0.045, 8, 6), '#6ee26e'), s * 0.16, 0.38, 0))
  const alieno = mergeGeometries([testa, ...occhi, ...luci, ...antenne, ...palline].map(g => (g.index ? g.toNonIndexed() : g)))
  alieno.deleteAttribute('brace')
  const alienoMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0 })
  const cupola = new SphereGeometry(0.52, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2)
  const cupolaMat = new MeshStandardMaterial({ color: 0xc8ffe0, transparent: true, opacity: 0.32, roughness: 0.08,
                                               metalness: 0.1, depthWrite: false, envMapIntensity: 1.4 })
  const traente = new ConeGeometry(0.95, 1.7, 20, 1, true)
  traente.translate(0, -0.85, 0)
  const traenteMat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: 2, uniforms: { uC: { value: new Color(0.5, 1, 0.55) } },
    vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying vec2 vU; uniform vec3 uC; void main(){ float a = pow(vU.y, 1.5) * .22; gl_FragColor = vec4(uC * a, a); }`,
  })
  const alone = new PlaneGeometry(2, 2)
  const aloneF = /* glsl */`varying vec2 vU; uniform vec3 uC; uniform float uA;
    void main(){ float r = length(vU); float a = pow(max(0., 1. - r), 2.) * uA; gl_FragColor = vec4(uC * a, a); }`
  return { coda, codaMat, alieno, alienoMat, cupola, cupolaMat, traente, traenteMat, alone, aloneV: QV, aloneF }
}

export function creaSassi(scena) {
  const C = comuni()
  const posti = []
  for (let i = 0; i < POSTI; i++) {
    const a = document.createElement('canvas'); a.width = 256; a.height = 128
    const b = document.createElement('canvas'); b.width = 256; b.height = 128
    const mappa = new CanvasTexture(a); mappa.colorSpace = NoColorSpace; mappa.anisotropy = 2
    const luce = new CanvasTexture(b); luce.colorSpace = SRGBColorSpace
    const mat = materialeSasso()
    mat.map = mappa; mat.bumpMap = mappa; mat.bumpScale = 6
    mat.emissiveMap = luce; mat.emissive = new Color(...AZZURRO); mat.emissiveIntensity = 1
    const gruppo = new Group(); gruppo.visible = false
    const sasso = new Mesh(formaDi('roccia', 0), mat)
    const coda = new Mesh(C.coda, C.codaMat); coda.renderOrder = 2
    const alone = new Mesh(C.alone, new ShaderMaterial({ vertexShader: C.aloneV, fragmentShader: C.aloneF, transparent: true,
      depthWrite: false, blending: AdditiveBlending, uniforms: { uC: { value: new Color() }, uA: { value: 0 } } }))
    alone.position.z = -1.2; alone.scale.setScalar(1.7); alone.renderOrder = -1
    const alieno = new Mesh(C.alieno, C.alienoMat); alieno.position.set(0, 0.4, -0.05); alieno.scale.setScalar(0.85)
    const cupola = new Mesh(C.cupola, C.cupolaMat); cupola.position.set(0, 0.22, -0.05); cupola.scale.setScalar(0.85); cupola.renderOrder = 3
    const ponte = new Group(); ponte.rotation.x = INCLINA_DISCO   // come il disco, che è inclinato nella forma
    ponte.add(alieno, cupola); sasso.add(ponte)
    const traente = new Mesh(C.traente, C.traenteMat); traente.position.y = -0.15; traente.renderOrder = 1
    gruppo.add(alone, coda, traente, sasso)
    scena.add(gruppo)
    posti.push({ gruppo, sasso, coda, alone, alieno, cupola, traente, mat, mappa, luce, tele: { a, b },
                 di: null, v: null, specie: null, seme: -1, usato: false })
  }
  const chi = new WeakMap()   // sasso della view → posto

  function vesti(p, a) {
    const specie = a.specie === 'roccia' && a.rossa ? 'marte' : (a.specie || 'roccia')
    if (p.v !== a.v) { scriviNumero(p, a.v); p.v = a.v }
    if (p.specie !== specie || p.seme !== a.seme) {
      p.sasso.geometry = formaDi(specie, a.seme)
      p.specie = specie; p.seme = a.seme
      const A = ASPETTO[specie] || ASPETTO.roccia, u = p.mat.userData.u
      p.mat.roughness = A.rough; p.mat.metalness = A.metal
      u.uBordo.value.setRGB(...(A.bordo || [0, 0, 0]))
      u.uBraceCol.value.setRGB(...(A.brace || [0, 0, 0]))
      u.uBraceModo.value = A.catena ? BRACE_CATENA : BRACE_FISSA
      u.uBraceK.value = A.catena ? 1 : A.brace ? A.braceK : 0
      const t = rgb(A.alone)
      p.alone.material.uniforms.uC.value.setRGB(t[0], t[1], t[2])
      p.coda.visible = !!A.coda
      p.alieno.visible = p.cupola.visible = p.traente.visible = !!A.alieno
      p.A = A
    }
  }

  return {
    // `X`, `Y`, `k`: da pixel a mondo; `t`: il tempo del cielo
    disegna(q, X, Y, k, t) {
      for (const p of posti) p.usato = false
      const brina = q.gelo ? 1 : 0
      for (const a of q.asteroidi) {
        if (a.morto && !(a.respinto > 0)) continue
        let p = chi.get(a)
        if (!p || p.di !== a) {
          p = posti.find(x => !x.usato && (!x.di || !q.asteroidi.includes(x.di) || (x.di.morto && !(x.di.respinto > 0))))
          if (!p) continue
          p.di = a; chi.set(a, p)
        }
        p.usato = true
        vesti(p, a)
        const A = p.A, u = p.mat.userData.u
        const via = a.morto ? Math.max(0, a.respinto) : 1   // respinto da uno sbaglio: rosso, e se ne va
        const s = a.r * k * 0.88 * (0.4 + 0.6 * via)
        p.gruppo.visible = true
        p.gruppo.position.set(X(a.x), Y(a.y), 0)
        p.gruppo.scale.setScalar(s)
        const ph = a.ph || 0
        // oscilla appena: il numero resta di faccia
        if (p.specie === 'dischi') p.sasso.rotation.set(Math.sin(t * 1.3 + ph) * 0.06, Math.sin(t * 0.6 + ph) * 0.14, Math.sin(t * 2 + ph) * 0.06)
        else p.sasso.rotation.set(Math.sin(t * 0.7 + ph) * 0.32, Math.sin(t * 0.5 + ph * 2) * 0.4, Math.sin(t * 0.4 + ph * 3) * 0.14)
        if (p.specie === 'dischi') p.gruppo.position.y += Math.sin(t * 2 + ph) * a.r * 0.08 * k
        const rosso = Math.max(a.morto ? 1 : 0, Math.min(1, a.rosso || 0))
        u.uT.value = t + ph; u.uGelo.value = brina; u.uRosso.value = rosso
        if (A.pulsa) u.uBraceK.value = (A.braceK || 1) * (0.7 + 0.3 * Math.sin(t * 3 + ph))
        if (A.lampeggia) u.uBraceK.value = Math.sin(t * 7 + ph) > 0 ? 1.2 : 0.08
        const n = rosso > 0 ? ROSSO : AZZURRO
        p.mat.emissive.setRGB(n[0] + (ROSSO[0] - n[0]) * rosso, n[1] + (ROSSO[1] - n[1]) * rosso, n[2] + (ROSSO[2] - n[2]) * rosso)
        p.mat.emissiveIntensity = 1 + 0.2 * Math.sin(t * 2.4 + ph)
        p.alone.material.uniforms.uA.value = (A.aloneK || 0.2) * via * (A.lampeggia ? 1 + 0.15 * Math.sin(t * 4 + ph) : 1)
        if (brina) p.alone.material.uniforms.uC.value.setRGB(0.62, 0.85, 1)
        else { const tt = rgb(A.alone); p.alone.material.uniforms.uC.value.setRGB(tt[0], tt[1], tt[2]) }
        if (rosso > 0) p.alone.material.uniforms.uC.value.setRGB(1, 0.25, 0.2)
      }
      for (const p of posti) if (!p.usato) { p.gruppo.visible = false; if (p.di && !q.asteroidi.includes(p.di)) p.di = null }
    },
    codaTempo: C.codaMat.uniforms.uT,
  }
}
