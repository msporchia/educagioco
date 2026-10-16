// Quello che sta nell'aria: la nebbia a fette (una geometria sola, illuminata a mano dalle luci vicine), la polvere in
// sospensione attorno all'eroe e le scintille (torce, colpi, magie). Tutto vive solo dove si vede adesso: la nebbia e la
// polvere leggono la maschera, e le scintille fuori vista non si emettono (lo decide chi le chiama, `emetti` torna false).
import { BufferGeometry, BufferAttribute, PlaneGeometry, Mesh, Points, ShaderMaterial, AdditiveBlending, DynamicDrawUsage, Vector3, Color } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { GLSL_RUMORE, GLSL_LUCI } from './luci.js'
import { GLSL_MASCHERA } from './maschera.js'

export function creaNebbia(scena, W, H, fette, condivise, maschera, aspetto) {
  if (!fette) return { aggiorna() {}, aspetto() {}, via() {} }
  const strati = Array.from({ length: fette }, (_, i) => new PlaneGeometry(W, H).rotateX(-Math.PI / 2).translate(W / 2, 0.08 + (i + 0.5) / fette * 1.3, H / 2))
  const geo = mergeGeometries(strati)
  strati.forEach(g => g.dispose())
  const mat = new ShaderMaterial({
    uniforms: { ...condivise, ...maschera.uniforms, uT: { value: 0 }, uDens: { value: aspetto.nebbia.densita }, uTinta: { value: new Vector3(...aspetto.nebbia.colore) } },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform float uT; uniform float uDens; uniform vec3 uTinta; ${GLSL_MASCHERA} varying vec3 vW;
      ${GLSL_RUMORE}${GLSL_LUCI}
      void main(){
        vec4 m = texture2D(uMaschera, vW.xz / uDimMappa);
        float n = fbm3(vec3(vW.x*0.55 + uT*0.07, vW.y*1.3, vW.z*0.55 - uT*0.05));
        float dens = uDens * smoothstep(0.25, 0.85, n) * 2.2 * m.b * m.r * (1.15 - vW.y*0.5);
        gl_FragColor = vec4(luceIn(vW) * uTinta * dens, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const mesh = new Mesh(geo, mat)
  mesh.renderOrder = 10; mesh.frustumCulled = false
  scena.add(mesh)
  return {
    aggiorna(t) { mat.uniforms.uT.value = t },
    aspetto(a) { mat.uniforms.uDens.value = a.nebbia.densita; mat.uniforms.uTinta.value.set(...a.nebbia.colore) },
    via() { scena.remove(mesh); geo.dispose(); mat.dispose() },
  }
}

// ── l'aria del paesaggio: punti che derivano in una scatola attorno all'eroe. Lo stesso shader per la polvere, le braci che
// salgono, le gocce e la neve che cadono, la brina che brilla, le lucciole, le bolle: cambiano solo gli uniform (ARIA), così il
// cambio di paesaggio non ricompila niente. `proprio` è la luce che hanno da sé (lucciole, braci), `luce` quanto prendono dai fuochi
export const ARIA = {
  polvere:  { tinta: [1, 0.9, 0.7], proprio: 0, luce: 0.9, caduta: 0, deriva: 0.6, taglia: 1, lampeggio: 0, anello: 0, quanti: 1 },
  braci:    { tinta: [1, 0.42, 0.08], proprio: 1.6, luce: 0.2, caduta: -0.35, deriva: 0.35, taglia: 0.7, lampeggio: 0.6, anello: 0, quanti: 0.7 },
  gocce:    { tinta: [0.6, 0.85, 1], proprio: 0.35, luce: 1.4, caduta: 2.4, deriva: 0.03, taglia: 0.55, lampeggio: 0, anello: 0, quanti: 0.6 },
  neve:     { tinta: [0.95, 0.97, 1], proprio: 0.7, luce: 0.8, caduta: 0.4, deriva: 0.55, taglia: 1.7, lampeggio: 0, anello: 0, quanti: 1 },
  brina:    { tinta: [0.7, 0.95, 1], proprio: 0.9, luce: 0.5, caduta: 0.04, deriva: 0.2, taglia: 0.6, lampeggio: 1, anello: 0, quanti: 1 },
  lucciole: { tinta: [0.75, 1, 0.25], proprio: 3, luce: 0, caduta: 0, deriva: 1.3, taglia: 1.6, lampeggio: 1, anello: 0, quanti: 0.35 },
  bolle:    { tinta: [0.6, 1, 0.95], proprio: 0.5, luce: 0.9, caduta: -0.5, deriva: 0.12, taglia: 2.2, lampeggio: 0, anello: 1, quanti: 0.6 },
}

export function creaPolvere(scena, quanti, condivise, maschera) {
  const pos = new Float32Array(quanti * 3), seme = new Float32Array(quanti)
  for (let i = 0; i < quanti; i++) { pos[i * 3] = Math.random() * 26; pos[i * 3 + 1] = Math.random() * 1.6; pos[i * 3 + 2] = Math.random() * 26; seme[i] = Math.random() }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(pos, 3))
  geo.setAttribute('seme', new BufferAttribute(seme, 1))
  const u = { uTinta: { value: new Vector3(1, 1, 1) }, uProprio: { value: 0 }, uLuce: { value: 0.9 }, uCaduta: { value: 0 }, uDeriva: { value: 0.6 },
              uTaglia: { value: 1 }, uLampeggio: { value: 0 }, uAnello: { value: 0 }, uQuanti: { value: 1 } }
  const mat = new ShaderMaterial({
    uniforms: { ...condivise, ...maschera.uniforms, ...u, uT: { value: 0 }, uCentro: { value: new Vector3() }, uScala: { value: 400 } },
    vertexShader: /* glsl */`
      attribute float seme; uniform float uT; uniform vec3 uCentro; uniform float uScala; uniform float uCaduta, uDeriva, uTaglia, uQuanti;
      varying vec3 vW; varying float vS;
      void main(){
        vec3 p = position + vec3(sin(uT*0.21 + seme*40.0)*uDeriva + uT*0.05, 0.0, cos(uT*0.17 + seme*23.0)*uDeriva);
        vec3 box = vec3(26.0, 1.9, 26.0);
        p = mod(p - uCentro + box*0.5, box) - box*0.5 + uCentro;
        p.y = mod(position.y * 1.19 - uT * uCaduta * (0.7 + seme * 0.6) + sin(uT*0.2+seme*9.0)*0.3*uDeriva, 1.9) + 0.03;
        vW = p; vS = seme;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = seme > uQuanti ? 0.0 : uScala * (0.012 + seme*0.02) * uTaglia / -mv.z;
      }`,
    fragmentShader: /* glsl */`
      uniform float uT; uniform vec3 uTinta; uniform float uProprio, uLuce, uLampeggio, uAnello; ${GLSL_MASCHERA} varying vec3 vW; varying float vS;
      ${GLSL_LUCI}
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = mix(smoothstep(0.5, 0.0, d), smoothstep(0.5, 0.4, d) * smoothstep(0.22, 0.38, d) + smoothstep(0.2, 0.0, length(gl_PointCoord - vec2(0.36))) * 0.6, uAnello);
        vec4 m = texture2D(uMaschera, vW.xz / uDimMappa);
        float luccica = 0.55 + 0.45*sin(uT*2.0 + vS*60.0);
        float lampo = mix(1.0, pow(max(0.0, sin(uT*(0.9 + vS*1.7) + vS*40.0)), 6.0) * 1.6, uLampeggio);
        vec3 c = luceIn(vW) * luccica * uLuce + uTinta * uProprio * lampo;
        gl_FragColor = vec4(c * a * m.r * m.b * 0.9, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const punti = new Points(geo, mat)
  punti.frustumCulled = false
  punti.renderOrder = 11
  if (quanti) scena.add(punti)
  return {
    aggiorna(t, centro, scala) { mat.uniforms.uT.value = t; mat.uniforms.uCentro.value.copy(centro); mat.uniforms.uScala.value = scala },
    // l'aria di un paesaggio (ARIA): solo uniform
    aspetto(a) {
      const k = ARIA[a.aria] || ARIA.polvere
      u.uTinta.value.set(...k.tinta); u.uProprio.value = k.proprio; u.uLuce.value = k.luce; u.uCaduta.value = k.caduta; u.uDeriva.value = k.deriva
      u.uTaglia.value = k.taglia; u.uLampeggio.value = k.lampeggio; u.uAnello.value = k.anello; u.uQuanti.value = k.quanti
    },
    via() { scena.remove(punti); geo.dispose(); mat.dispose() },
  }
}

// ── scintille: una riserva di particelle simulate sulla CPU (gravità, attrito, colore che si raffredda) ──
export function creaScintille(scena, max = 1200) {
  const pos = new Float32Array(max * 3), col = new Float32Array(max * 3), dim = new Float32Array(max)
  const vel = new Float32Array(max * 3), vita = new Float32Array(max), dura = new Float32Array(max), calore = new Float32Array(max)
  const tinta = new Float32Array(max * 3).fill(-1)   // il colore di un'abilità; -1: il fuoco che si raffredda
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(pos, 3).setUsage(DynamicDrawUsage))
  geo.setAttribute('color', new BufferAttribute(col, 3).setUsage(DynamicDrawUsage))
  geo.setAttribute('dim', new BufferAttribute(dim, 1).setUsage(DynamicDrawUsage))
  const mat = new ShaderMaterial({
    uniforms: { uScala: { value: 400 } },
    vertexShader: /* glsl */`attribute float dim; attribute vec3 color; uniform float uScala; varying vec3 vC;
      void main(){ vC = color; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uScala*dim / -mv.z; }`,
    fragmentShader: /* glsl */`varying vec3 vC; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5, 0.1, d); gl_FragColor = vec4(vC*a, 1.0); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const punti = new Points(geo, mat)
  punti.frustumCulled = false
  punti.renderOrder = 12
  scena.add(punti)
  let prossima = 0, vive = 0
  const BIANCO = new Color(1, 1, 1)
  const emetti = (x, y, z, n, { forza = 3, su = 2, vita: v = 0.6, caldo = 1, taglia = 0.05, tinta: t = null } = {}) => {
    for (let k = 0; k < n; k++) {
      const i = prossima; prossima = (prossima + 1) % max
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z
      const a = Math.random() * Math.PI * 2, e = Math.random()
      vel[i * 3] = Math.cos(a) * forza * e; vel[i * 3 + 1] = su * (0.4 + Math.random()); vel[i * 3 + 2] = Math.sin(a) * forza * e
      vita[i] = dura[i] = v * (0.5 + Math.random()); calore[i] = caldo; dim[i] = taglia * (0.6 + Math.random() * 0.8)
      if (t) { tinta[i * 3] = t.r; tinta[i * 3 + 1] = t.g; tinta[i * 3 + 2] = t.b } else tinta[i * 3] = -1
    }
    vive = max
  }
  const aggiorna = (dt, scala) => {
    mat.uniforms.uScala.value = scala
    if (!vive) return   // niente in volo: niente da caricare in GPU
    let ancora = 0
    for (let i = 0; i < max; i++) {
      if (vita[i] <= 0) { if (dim[i]) { dim[i] = 0; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0 } continue }
      ancora++
      vita[i] -= dt
      vel[i * 3 + 1] -= 6 * dt * (calore[i] > 0.5 ? 1 : -0.15)
      const attr = Math.exp(-2.5 * dt)
      vel[i * 3] *= attr; vel[i * 3 + 2] *= attr
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt
      if (pos[i * 3 + 1] < 0.02) { pos[i * 3 + 1] = 0.02; vel[i * 3 + 1] *= -0.35 }
      const f = Math.max(0, vita[i] / dura[i])
      const k = 6 * f * f
      if (tinta[i * 3] >= 0) { const q = 4 * f; col[i * 3] = tinta[i * 3] * q + f * 0.6; col[i * 3 + 1] = tinta[i * 3 + 1] * q + f * 0.6; col[i * 3 + 2] = tinta[i * 3 + 2] * q + f * 0.6 }
      else { col[i * 3] = k * 1.0; col[i * 3 + 1] = k * (0.25 + 0.55 * f); col[i * 3 + 2] = k * 0.12 * f * f }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.attributes.dim.needsUpdate = true
    if (!ancora) vive = 0
  }
  return { emetti, aggiorna, BIANCO, via() { scena.remove(punti); geo.dispose(); mat.dispose() } }
}
