// Il conto del lavoro per pixel, che non dipende da quanto è carico il computer: la scena si ridisegna (una volta, a parte) con ogni
// materiale che, a frammento finito, scrive in somma il suo peso invece del colore. Il frammento fa tutto quello che fa nel gioco
// (anche gli scarti: la retina delle figure, l'alphaTest), quindi si contano i frammenti che il telefono colora davvero, coi
// test di profondità e l'ordine del disegno di three. Quattro passate, quattro pesi:
//   frammenti         1 a frammento: i pixel colorati, sovrapposti compresi (overdraw)
//   luciFrammenti     le luci che quel frammento somma per pixel (three le gira tutte quelle in scena, accese o no; le fette di
//                     nebbia e l'acqua girano le loro `uLn` + il cono); 0 se la luce è per vertice
//   trameFrammenti    le letture di trama del materiale (map, normal, roughness, emissive, maschera…)
//   ombraFrammenti    le letture della mappa d'ombra (chi riceve l'ombra, per ogni luce che la fa)
// I pesi si leggono in un bersaglio a 8 bit (peso/255 a frammento): oltre 255 si satura, e `saturi` lo dice.
import { WebGLRenderTarget, AdditiveBlending, Vector2 } from 'three'

const LUCI_PIXEL = m => m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial || m.isMeshToonMaterial
export const FAMIGLIE = ['luce', 'vertice', 'figure', 'piatti', 'rumore', 'additivi', 'punti']
const TRAME = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap', 'bumpMap', 'lightMap']

/** `scena`, `renderer`, `camera` del gioco; `perVertice(m)`: se quel materiale ha la luce per vertice (piatto.js). */
export function contaLavoro({ scena, renderer, camera, perVertice = () => false }) {
  // le luci che three conta (le visibili), e chi fa ombra
  let luci = 0, ombre = 0
  scena.traverse(o => { if (o.visible && (o.isPointLight || o.isSpotLight)) { luci++; if (o.castShadow && renderer.shadowMap.enabled) ombre++ } })
  const pesi = (m, o) => {
    const vert = perVertice(m)
    let l = 0, t = 0, s = 0
    if (LUCI_PIXEL(m) && !vert) { l = luci; s = o.receiveShadow ? ombre : 0 }
    else if (m.uniforms && m.uniforms.uLn) l = m.uniforms.uLn.value + 1        // nebbia, acqua, polvere: luceIn di luci.js
    for (const k of TRAME) if (m[k]) t++
    if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u && u.value && u.value.isTexture) t++
    if (m.customProgramCacheKey && /maschera/.test(m.customProgramCacheKey())) t++
    if (vert && m.normalMap === null && /\|pv.*r/.test(m.customProgramCacheKey())) t++   // il rilievo letto dalla normal map
    // la famiglia, per dividere i frammenti: chi li colora (i pesi per pixel sono molto diversi fra una famiglia e l'altra)
    const fs = m.fragmentShader || ''
    const fam = o.isPoints ? 'punti' : o.geometry && o.geometry.attributes.aRett ? 'figure'
      : /fbm3|rumore3/.test(fs) ? 'rumore' : m.blending === AdditiveBlending || (m.transparent && !m.isShaderMaterial) ? 'additivi'
        : LUCI_PIXEL(m) ? (vert ? 'vertice' : 'luce') : 'piatti'
    return [1, l, t, s, ...FAMIGLIE.map(f => (f === fam ? 1 : 0))]
  }
  // i materiali-contatore: una copia che fa tutto e poi scrive il peso
  const copie = new Map(), prima = new Map()
  const copia = (m, o) => {
    if (copie.has(m)) return copie.get(m)
    const c = m.clone()
    if (m.isShaderMaterial) c.uniforms = m.uniforms
    const k = { value: 0 }, w = pesi(m, o), vecchio = m.onBeforeCompile, chiave = m.customProgramCacheKey()
    c.onBeforeCompile = (sh, r) => {
      if (vecchio) vecchio.call(c, sh, r)
      sh.uniforms.uContaK = k
      sh.fragmentShader = 'uniform float uContaK;\n' + sh.fragmentShader.replace(/\}\s*$/, '  gl_FragColor = vec4(uContaK, 0.0, 0.0, 1.0);\n}\n')
    }
    c.customProgramCacheKey = () => chiave + '|conta'
    c.blending = AdditiveBlending
    const x = { c, k, w }
    copie.set(m, x)
    return x
  }
  const oggetti = []
  scena.traverse(o => { if ((o.isMesh || o.isPoints || o.isSprite) && o.material) oggetti.push(o) })
  const W = renderer.getDrawingBufferSize(new Vector2())
  const rt = new WebGLRenderTarget(W.x, W.y, { depthBuffer: true })
  const px = new Uint8Array(W.x * W.y * 4)
  const P = 4 + FAMIGLIE.length, totali = new Array(P).fill(0)
  let saturi = 0
  for (const o of oggetti) {
    prima.set(o, o.material)
    o.material = Array.isArray(o.material) ? Array.from(o.material, m => copia(m, o).c) : copia(o.material, o).c
  }
  const sfondo = scena.background
  scena.background = null
  try {
    for (let p = 0; p < P; p++) {
      for (const x of copie.values()) x.k.value = x.w[p] / 255
      renderer.setRenderTarget(rt)
      renderer.setClearColor(0x000000, 0)
      renderer.clear()
      renderer.render(scena, camera)
      renderer.readRenderTargetPixels(rt, 0, 0, W.x, W.y, px)
      let s = 0
      for (let i = 0; i < px.length; i += 4) { s += px[i]; if (px[i] === 255) saturi++ }
      totali[p] = s
    }
  } finally {
    renderer.setRenderTarget(null)
    scena.background = sfondo
    for (const [o, m] of prima) o.material = m
    for (const x of copie.values()) x.c.dispose()
    rt.dispose()
  }
  const pixel = W.x * W.y
  const M = v => Math.round(v / 1e4) / 100   // milioni, due decimali
  return {
    pixel, luci, ombre,
    frammenti: M(totali[0]), luciFrammenti: M(totali[1]), trameFrammenti: M(totali[2]), ombraFrammenti: M(totali[3]),
    sovrapposti: Math.round(totali[0] / pixel * 100) / 100,   // frammenti per pixel dello schermo
    saturi,
    famiglie: Object.fromEntries(FAMIGLIE.map((f, i) => [f, M(totali[4 + i])])),   // milioni di frammenti per famiglia
  }
}
