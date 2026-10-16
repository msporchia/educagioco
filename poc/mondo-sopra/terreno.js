// Il terreno (una griglia a due vertici per cella, quattro trame mescolate per vertice: erba, terra battuta, sabbia, roccia,
// e la tinta della regione), il fuori mappa (colline e monti che salgono), l'acqua (un piano solo al suo livello: dove il
// terreno scende sotto, c'è acqua; schiuma dove è bassa), il cielo, la piazza di ciottoli e i campi arati.
import * as THREE from 'three'
import { ERBA, ACQUA, ROCCIA, LIVELLO_ACQUA, quotaTerreno } from './generatore.js'
import { fbm } from './caso.js'
import { U, vesti, GLSL_CIELO } from './vesti.js'

export const RES = 2   // vertici per cella

const TINTE = {
  villaggio: [0.56, 0.74, 0.30], campi: [0.66, 0.78, 0.30], bosco: [0.36, 0.58, 0.26], lago: [0.46, 0.72, 0.34],
  prateria: [0.70, 0.76, 0.34], colline: [0.60, 0.66, 0.32], rovine: [0.56, 0.62, 0.38], monte: [0.50, 0.60, 0.34], landa: [0.74, 0.64, 0.36],
}

// i pesi delle trame e la tinta, per cella; poi il vertice li prende interpolati
function pesiDelleCelle (m) {
  const { W, H } = m, N = W * H
  const peso = new Float32Array(N * 4), tinta = new Float32Array(N * 3)
  const riva = k => { const x = k % W, y = (k / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < W && b < H && m.terreno[b * W + a] === ACQUA && m.ponte[b * W + a] < 0) return true } return false }
  for (let k = 0; k < N; k++) {
    const t = m.terreno[k], s = m.strada[k], x = k % W, y = (k / W) | 0
    let e = 0, tb = 0, sa = 0, ro = 0
    if (t === ROCCIA) ro = 1
    else if (t === ACQUA) sa = 1
    else if (m.campo[k]) tb = 1
    else if (s === 3) tb = 1
    else if (s === 2) { tb = 0.95; e = 0.05 }
    else if (s === 1) { tb = 0.7; e = 0.3 }
    else if (riva(k)) { sa = 0.75; e = 0.25 }
    else { e = 1; const n = fbm(x, y, 900, 9); if (n > 0.62) { tb = (n - 0.62) * 1.4; e -= tb } }
    peso.set([e, tb, sa, ro], k * 4)
    const T = TINTE[m.regioni[m.reg[k]].habitat] || TINTE.villaggio
    const v = 0.88 + fbm(x, y, 901, 14) * 0.24
    tinta.set([T[0] * v, T[1] * v, T[2] * v], k * 3)
  }
  // la tinta si mescola fra le regioni (cinque celle): il confine non si vede come una riga
  const t2 = new Float32Array(N * 3)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, n = 0
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      const a = Math.min(W - 1, Math.max(0, x + i)), c = Math.min(H - 1, Math.max(0, y + j)), q = (c * W + a) * 3
      r += tinta[q]; g += tinta[q + 1]; b += tinta[q + 2]; n++
    }
    t2.set([r / n, g / n, b / n], (y * W + x) * 3)
  }
  return { peso, tinta: t2 }
}
const bilineare = (arr, comp, W, H, x, z, out) => {
  const fx = Math.min(W - 1.001, Math.max(0, x - 0.5)), fz = Math.min(H - 1.001, Math.max(0, z - 0.5))
  const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0
  for (let c = 0; c < comp; c++) {
    const a = arr[(z0 * W + x0) * comp + c], b = arr[(z0 * W + x0 + 1) * comp + c], d = arr[((z0 + 1) * W + x0) * comp + c], e = arr[((z0 + 1) * W + x0 + 1) * comp + c]
    out[c] = (a * (1 - tx) + b * tx) * (1 - tz) + (d * (1 - tx) + e * tx) * tz
  }
  return out
}

function materialeTerreno (trame) {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, normalMap: trame.roccia.normalMap, normalScale: new THREE.Vector2(1, 1) })
  mat.name = 'terreno'
  vesti(mat, {
    prima: sh => {
      sh.uniforms.tErba = { value: trame.erba.map }; sh.uniforms.tTerra = { value: trame.terra.map }
      sh.uniforms.tSabbia = { value: trame.sabbia.map }; sh.uniforms.tRoccia = { value: trame.roccia.map }
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec4 peso; attribute vec3 tinta; varying vec4 vPeso; varying vec3 vTinta; varying float vRipido;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vPeso = peso; vTinta = tinta; vRipido = 1.0 - normal.y;`)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform sampler2D tErba, tTerra, tSabbia, tRoccia; varying vec4 vPeso; varying vec3 vTinta; varying float vRipido;`)
        .replace('#include <map_fragment>', `
          vec2 uvT = vMondo.xz * 0.5;
          vec3 ce = mix(texture2D(tErba, uvT * 0.7).rgb, texture2D(tErba, mat2(0.8, 0.6, -0.6, 0.8) * uvT * 0.27 + 0.37).rgb, 0.5), ct = texture2D(tTerra, uvT).rgb, cs = texture2D(tSabbia, uvT).rgb, cr = texture2D(tRoccia, uvT * 0.45 + vec2(0.0, vMondo.y * 0.08)).rgb;
          vec4 w = vPeso;
          w.w = max(w.w, smoothstep(0.3, 0.55, vRipido));
          // mescolati con l'altezza delle trame: il bordo fra erba e terra si sfrangia, non sfuma
          vec4 h = w + vec4(ce.g, ct.r, cs.r, cr.r) * 0.45 + (frumore(vMondo.xz * 1.3) - 0.5) * 0.25;
          float hm = max(max(h.x, h.y), max(h.z, h.w));
          w = max(h - (hm - 0.22), 0.0); w /= (w.x + w.y + w.z + w.w + 1e-4);
          vec3 col = ce * vTinta * 1.55 * w.x + ct * vec3(0.84, 0.74, 0.58) * w.y + cs * vec3(0.98, 0.92, 0.78) * w.z + cr * vec3(0.74, 0.72, 0.70) * w.w;
          diffuseColor.rgb = col;
          float pesoRoccia = w.w, pesoTerra = w.y;`)
        .replace('mapN.xy *= normalScale;', 'mapN.xy *= normalScale * (0.15 + 1.1 * pesoRoccia + 0.5 * pesoTerra);')
    },
  })
  return mat
}

export function creaTerreno (m, trame) {
  const { W, H } = m
  const { peso, tinta } = pesiDelleCelle(m)
  const NX = W * RES + 1, NZ = H * RES + 1
  const pos = new Float32Array(NX * NZ * 3), pes = new Float32Array(NX * NZ * 4), tin = new Float32Array(NX * NZ * 3), uv = new Float32Array(NX * NZ * 2)
  const p4 = [0, 0, 0, 0], t3 = [0, 0, 0]
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const x = i / RES, z = j / RES, v = j * NX + i
    bilineare(peso, 4, W, H, x, z, p4); bilineare(tinta, 3, W, H, x, z, t3)
    let y = quotaTerreno(m, x, z)
    // la roccia si rompe: un rumore fitto la fa scabra
    if (p4[3] > 0.05) y += p4[3] * (fbm(x, z, 950, 2.2) - 0.5) * 1.1 + p4[3] * fbm(x, z, 951, 0.7) * 0.25
    pos.set([x, y, z], v * 3); pes.set(p4, v * 4); tin.set(t3, v * 3); uv.set([x * 0.5, z * 0.5], v * 2)
  }
  const idx = new Uint32Array((NX - 1) * (NZ - 1) * 6)
  let q = 0
  for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) {
    const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1
    idx.set([a, c, b, b, c, d], q); q += 6
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('peso', new THREE.BufferAttribute(pes, 4))
  g.setAttribute('tinta', new THREE.BufferAttribute(tin, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(new THREE.BufferAttribute(idx, 1))
  g.computeVertexNormals()
  const mat = materialeTerreno(trame)
  const mesh = new THREE.Mesh(g, mat)
  mesh.receiveShadow = true; mesh.castShadow = true
  return { mesh, mat }
}

// il fuori mappa: colline che salgono a monti, oltre la cornice di roccia (un vertice ogni due celle). Dentro la mappa sta sotto
export function creaFuori (m, mat) {
  const { W, H } = m, M = 70, P = 2
  const NX = Math.round((W + 2 * M) / P) + 1, NZ = Math.round((H + 2 * M) / P) + 1
  const pos = new Float32Array(NX * NZ * 3), pes = new Float32Array(NX * NZ * 4), tin = new Float32Array(NX * NZ * 3), uv = new Float32Array(NX * NZ * 2)
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const x = -M + i * P, z = -M + j * P, v = j * NX + i
    const e = Math.max(-x, x - W, -z, z - H)   // quanto si è fuori
    let y
    if (e < -0.5) y = -4
    else {
      const monti = fbm(x, z, 960, 26), dente = fbm(x, z, 961, 7)
      y = 3.2 + Math.min(e, 30) * 0.12 * (0.5 + monti) + Math.max(0, monti - 0.45) * Math.min(1, e / 12) * 16 + dente * 1.5
      // a sud (verso chi guarda) restano colline basse: non chiudono la vista
      if (z > H) y = 2.4 + dente * 1.4 + Math.min(e, 20) * 0.05
      // vicino al bordo parte dall'altezza della cornice della mappa: niente fessure fra le due
      const bordo = quotaTerreno(m, Math.min(W - 0.01, Math.max(0.01, x)), Math.min(H - 0.01, Math.max(0.01, z)))
      const k = Math.min(1, e / 7), s = k * k * (3 - 2 * k)
      y = bordo + 0.4 + (y - bordo) * s
    }
    const ro = e < 1 ? 1 : Math.min(1, Math.max(0, (y - 6) / 4))
    pos.set([x, y, z], v * 3); pes.set([1 - ro, 0, 0, ro], v * 4)
    const n = 0.85 + fbm(x, z, 962, 18) * 0.3
    tin.set([0.42 * n, 0.6 * n, 0.3 * n], v * 3); uv.set([x * 0.5, z * 0.5], v * 2)
  }
  const idx = []
  for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx.push(a, c, b, b, c, d) }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('peso', new THREE.BufferAttribute(pes, 4))
  g.setAttribute('tinta', new THREE.BufferAttribute(tin, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(idx); g.computeVertexNormals()
  const mesh = new THREE.Mesh(g, mat)
  mesh.receiveShadow = true
  const quotaFuori = (x, z) => pos[(Math.min(NZ - 1, Math.max(0, Math.round((z + M) / P))) * NX + Math.min(NX - 1, Math.max(0, Math.round((x + M) / P)))) * 3 + 1]
  return { mesh, quotaFuori, M }
}

// ── l'acqua: la profondità per cella (0 a riva, 1 fonda) in una trama, letta dallo shader ──
export function creaAcqua (m, sole) {
  const { W, H } = m
  const d = new Uint8Array(W * H)
  for (let k = 0; k < W * H; k++) d[k] = Math.max(0, Math.min(255, (LIVELLO_ACQUA - m.quota[k]) / 0.9 * 255))
  const tProf = new THREE.DataTexture(d, W, H, THREE.RedFormat)
  tProf.magFilter = THREE.LinearFilter; tProf.minFilter = THREE.LinearFilter; tProf.needsUpdate = true
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { tProf: { value: null }, uSole: { value: sole.clone() }, uCielo: { value: new THREE.Color(0xa9cdea) } }]),
    fog: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      varying vec3 vMondo;
      void main () {
        vec4 w = modelMatrix * vec4(position, 1.0); vMondo = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_CIELO}
      uniform sampler2D tProf; uniform vec3 uSole; uniform vec3 uCielo;
      varying vec3 vMondo;
      void main () {
        vec2 uvc = vMondo.xz / uMappa;
        float d = (uvc.x < 0.0 || uvc.y < 0.0 || uvc.x > 1.0 || uvc.y > 1.0) ? 1.0 : texture2D(tProf, uvc).r;
        vec2 p = vMondo.xz;
        float n1 = frumore(p * 0.55 + vec2(0.0, uTempo * 0.35)), n2 = frumore(p * 1.1 - vec2(uTempo * 0.12, uTempo * 0.25));
        vec3 basso = vec3(0.30, 0.66, 0.66), fondo = vec3(0.10, 0.36, 0.55);
        vec3 col = mix(basso, fondo, smoothstep(0.0, 0.55, d));
        vec3 V = normalize(cameraPosition - vMondo);
        vec3 N = normalize(vec3((n1 - 0.5) * 0.35, 1.0, (n2 - 0.5) * 0.35));
        float fres = pow(1.0 - max(dot(V, N), 0.0), 3.0);
        col = mix(col, uCielo, 0.18 + fres * 0.55);
        col += vec3(1.0, 0.96, 0.85) * pow(max(dot(N, normalize(V + uSole)), 0.0), 90.0) * 0.9;
        col += smoothstep(0.66, 0.74, n1) * 0.07;
        // la schiuma alle rive: una fascia che respira, rotta da bolle che scorrono
        float fascia = 1.0 - smoothstep(0.0, 0.11 + 0.05 * sin(uTempo * 1.4 + n2 * 6.0), d);
        float bolle = smoothstep(0.42, 0.6, vrumore(p * 5.0 + vec2(uTempo * 0.3, uTempo * 0.7)));
        col = mix(col, vec3(0.96, 0.98, 1.0), fascia * (0.35 + 0.6 * bolle));
        col *= ombraNuvole(p);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
        gl_FragColor.rgb = nebbiaSu(gl_FragColor.rgb, vMondo);
      }`,
  })
  Object.assign(mat.uniforms, U)
  mat.uniforms.tProf.value = tProf
  const g = new THREE.PlaneGeometry(W + 60, H + 60, 1, 1); g.rotateX(-Math.PI / 2); g.translate(W / 2, LIVELLO_ACQUA, H / 2)
  const mesh = new THREE.Mesh(g, mat)
  mesh.receiveShadow = false
  return mesh
}

// il cielo: un gradiente con le nuvole che scorrono (si vede poco, la vista guarda in giù, ma c'è)
export function creaCielo () {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTempo: U.uTempo },
    vertexShader: `varying vec3 vDir; void main () { vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      uniform float uTempo; varying vec3 vDir;
      float h (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n (vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main () {
        float y = clamp(vDir.y, -0.2, 1.0);
        vec3 col = mix(vec3(0.80, 0.88, 0.95), vec3(0.36, 0.60, 0.90), smoothstep(0.0, 0.6, y));
        vec2 q = vDir.xz / max(0.12, vDir.y + 0.15) * 1.6 + vec2(uTempo * 0.02, uTempo * 0.012);
        float c = n(q) * 0.55 + n(q * 2.2) * 0.3 + n(q * 5.1) * 0.15;
        col = mix(col, vec3(1.0), smoothstep(0.55, 0.78, c) * smoothstep(0.0, 0.25, y) * 0.85);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), mat)
  mesh.frustumCulled = false; mesh.renderOrder = -10
  return mesh
}

// la piazza: un tondo di ciottoli, appena sopra il terreno spianato, con un cordolo
export function creaPiazza (m, kit) {
  const y = quotaTerreno(m, m.piazza.x, m.piazza.y) + 0.03
  const g = new THREE.CircleGeometry(m.piazza.r, 48)
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * m.piazza.r * 1.2, (uv.getY(i) - 0.5) * m.piazza.r * 1.2)
  g.rotateX(-Math.PI / 2); g.translate(m.piazza.x, y, m.piazza.y)
  const mat = vesti(new THREE.MeshStandardMaterial({ map: kit.trame.ciottoli.map, normalMap: kit.trame.ciottoli.normalMap, roughness: 0.9, color: 0xd8cfc0 }))
  const mesh = new THREE.Mesh(g, mat); mesh.receiveShadow = true
  const bordo = new THREE.Mesh(new THREE.TorusGeometry(m.piazza.r, 0.09, 6, 48), kit.mat.liscio)
  bordo.geometry.rotateX(Math.PI / 2); bordo.position.set(m.piazza.x, y + 0.02, m.piazza.y)
  bordo.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(bordo.geometry.attributes.position.count * 3).fill(0.62), 3))
  bordo.receiveShadow = true
  return [mesh, bordo]
}

// i campi arati: un piano per campo, i solchi lungo le file, tutti in una geometria
export function creaCampi (m, kit) {
  const pos = [], uv = [], idx = []
  for (const c of m.campi) {
    const b = pos.length / 3
    for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const x = c.x + i * c.w, z = c.y + j * c.h
      pos.push(x, quotaTerreno(m, x, z) + 0.035, z)
      // i solchi vanno lungo la direzione delle file
      uv.push(c.file === 'x' ? (j * c.h) / 2 : (i * c.w) / 2, c.file === 'x' ? (i * c.w) / 2 : (j * c.h) / 2)
    }
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx); g.computeVertexNormals()
  const mat = vesti(new THREE.MeshStandardMaterial({ map: kit.trame.campo.map, normalMap: kit.trame.campo.normalMap, roughness: 1, color: 0xb59a78, polygonOffset: true, polygonOffsetFactor: -1 }))
  const mesh = new THREE.Mesh(g, mat); mesh.receiveShadow = true
  return mesh
}
