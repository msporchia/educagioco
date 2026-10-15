// Il cielo in 3D: il fondale di ogni posto (le stesse tinte e le stesse macchie di nebulosa
// di grafica/cieli.js, qui con le nuvole), cotto una volta per cielo in una texture piccola;
// due strati di stelle (il vicino scorre, e nel balzo del volo diventa scie); e la cosa
// grande che sta dietro, in alto e tenue: un pianeta per ogni cielo, il Sole, il buco nero.
import { Mesh, Group, PlaneGeometry, SphereGeometry, RingGeometry, BufferGeometry, BufferAttribute, Points,
         ShaderMaterial, AdditiveBlending, NormalBlending, Color, Vector2, Vector3, Vector4, WebGLRenderTarget, Scene,
         OrthographicCamera, HalfFloatType, LinearFilter, DoubleSide } from 'three'
import { CIELI } from '../cieli.js'
import { GLSL_RUMORE, seme } from './rumore.js'

const SOLE = new Vector3(8, 6, 7).normalize()
export const DIREZIONE_SOLE = SOLE

// la cosa grande di ogni cielo; x, y: dove sta il centro, in frazioni dello schermo (y dall'alto)
const SFONDI = {
  cintura: { pianeta: { x: 0.1, y: 0.15, r: 0.3, a: '#d18a4c', b: '#f2cc94', c: '#73422f', bande: 38, anelli: '#d9b88c', atm: '#ff8c40' } },
  marte: { pianeta: { x: 0.86, y: 0.17, r: 0.3, a: '#d0663a', b: '#f09a60', c: '#8a3a20', roccia: 1, atm: '#ff7a50' } },
  ghiaccio: { pianeta: { x: 0.14, y: 0.15, r: 0.32, a: '#9fd8f0', b: '#e8fbff', c: '#3f7fa8', bande: 16, anelli: '#cfefff', atm: '#9fe8ff' } },
  rottami: { pianeta: { x: 0.86, y: 0.16, r: 0.32, a: '#b07a4a', b: '#e0b080', c: '#6a4228', roccia: 1, atm: '#d0702f' } },
  cristalli: { pianeta: { x: 0.14, y: 0.16, r: 0.3, a: '#8a3ac0', b: '#e0a0ff', c: '#3a1060', bande: 28, anelli: '#f0b3ff', atm: '#ff5fd0' } },
  alieni: { pianeta: { x: 0.85, y: 0.16, r: 0.32, a: '#2f9a6a', b: '#9be2b0', c: '#123a2a', bande: 22, atm: '#6aff9d', luna: true } },
  sole: { sole: true },
  nero: { buco: true },
}
// la luce dei sassi cambia col posto
const LUCI = {
  cintura: { sole: '#fff0dd', k: 4.0, amb: '#1a2448' }, marte: { sole: '#ffd2b0', k: 3.8, amb: '#2a1410' },
  ghiaccio: { sole: '#e0f4ff', k: 4.2, amb: '#123040' }, rottami: { sole: '#ffe0b0', k: 3.8, amb: '#241a12' },
  cristalli: { sole: '#ffe0ff', k: 3.8, amb: '#24123a' }, alieni: { sole: '#e8ffe0', k: 3.8, amb: '#10281a' },
  sole: { sole: '#ffd9a0', k: 5.2, amb: '#2a1408' }, nero: { sole: '#d8c8ff', k: 3.0, amb: '#140c28' },
}

const PIENO_V = /* glsl */`varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy, 0., 1.); }`
const NEBULOSA_F = GLSL_RUMORE + /* glsl */`
varying vec2 vU; uniform vec3 uAlto, uMedio, uBasso; uniform vec4 uNeb[4]; uniform vec3 uNebC[4]; uniform vec2 uDim; uniform float uSeme;
void main(){
  float t = 1. - vU.y;
  vec3 col = t < .55 ? mix(uAlto, uMedio, t / .55) : mix(uMedio, uBasso, (t - .55) / .45);
  vec2 p = vU * uDim;
  vec2 w = vec2(fbm3(vec3(p * 1.6, uSeme)), fbm3(vec3(p * 1.6 + 5.2, uSeme + 3.)));
  float nube = fbm3(vec3(p * 2.4 + w * 1.4, uSeme + 7.));
  float fine = fbm3(vec3(p * 7. + w, uSeme + 11.));
  for (int i = 0; i < 4; i++) {
    if (uNeb[i].z <= 0.) continue;
    float d = length((vU - vec2(uNeb[i].x, 1. - uNeb[i].y)) * uDim) / uNeb[i].z;
    float q = pow(max(0., 1. - d), 1.4) * (.35 + 1.4 * smoothstep(.3, .8, nube + .15 * fine));
    col += uNebC[i] * q * .42;
  }
  col *= .78 + .22 * smoothstep(.25, .75, fine);    // la polvere scura
  gl_FragColor = vec4(col, 1.);
}`
const FONDO_F = /* glsl */`varying vec2 vU; uniform sampler2D tNeb; uniform vec2 uSposta;
  void main(){ gl_FragColor = vec4(texture2D(tNeb, vU * .97 + .015 + uSposta).rgb, 1.); }`

const STELLE_V = /* glsl */`
attribute float dim; attribute float fase; attribute vec3 colore;
varying vec3 vC; varying float vS; uniform float uT, uPx, uVel, uScia;
void main(){ vec3 p = position;
  if (uVel > 0.) p.y = mod(p.y - uT * uVel * (.5 + p.z) + 1.1, 2.2) - 1.1;
  float tw = .7 + .3 * sin(uT * (1.3 + dim * .4) + fase);
  vC = colore * tw; vS = uScia;
  gl_PointSize = dim * uPx * (1. + uScia * 3.);
  gl_Position = vec4(p.xy, .9999, 1.); }`
const STELLE_F = /* glsl */`varying vec3 vC; varying float vS;
void main(){ vec2 q = gl_PointCoord - .5; q.x *= 1. + vS * 3.; q.y /= 1. + vS * 0.4;
  float d = length(q) * 2.; if (d > 1.) discard; float a = pow(1. - d, 2.2); gl_FragColor = vec4(vC * (1. + .8 * (1. - d)), a); }`

const PIANETA_V = /* glsl */`varying vec3 vN; varying vec3 vO; varying vec3 vV;
  void main(){ vO = normal; vN = normalize(mat3(modelMatrix) * normal); vec4 mv = modelViewMatrix * vec4(position, 1.);
    vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`
const PIANETA_F = GLSL_RUMORE + /* glsl */`
varying vec3 vN; varying vec3 vO; varying vec3 vV; uniform vec3 uA, uB, uC, uAtm, uSole; uniform float uBande, uRoccia, uT, uK;
void main(){
  vec3 o = normalize(vO); float ca = cos(uT), sa = sin(uT);
  vec3 q = vec3(o.x * ca - o.z * sa, o.y, o.x * sa + o.z * ca);
  float turb = fbm4(q * 2.2 + 5.), s = fbm4(q * 6.);
  vec3 col;
  if (uRoccia > .5) {
    float m = fbm4(q * 3.5), cr = smoothstep(.55, .7, fbm4(q * 9.));
    col = mix(uC, uA, smoothstep(.25, .7, m)); col = mix(col, uB, smoothstep(.6, .85, s) * .6); col *= 1. - cr * .3;
  } else {
    float band = sin(q.y * uBande + turb * 7.) * .5 + .5, k = band * .75 + s * .35;
    col = k < .5 ? mix(uC, uA, k * 2.) : mix(uA, uB, (k - .5) * 2.);
  }
  float l = clamp(dot(normalize(vN), uSole), 0., 1.);
  float rim = pow(1. - max(dot(normalize(vN), vV), 0.), 2.6);
  vec3 c = col * (l * 1.15 + .04) + uAtm * rim * smoothstep(-.3, .6, dot(normalize(vN), uSole)) * 1.4;
  gl_FragColor = vec4(c * uK, 1.);
}`
const ANELLI_F = GLSL_RUMORE + /* glsl */`varying vec2 vP; uniform vec3 uC; uniform float uK;
  void main(){ float r = length(vP); float s = fbm3(vec3(r * 14., 1., 2.));
    float a = smoothstep(1.45, 1.6, r) * smoothstep(2.5, 2.3, r) * (.15 + .85 * smoothstep(.35, .7, s));
    a *= 1. - .8 * smoothstep(1.95, 2., r) * smoothstep(2.1, 2., r);
    gl_FragColor = vec4(uC * (.5 + s) * uK, a * .8); }`
const SOLE_F = GLSL_RUMORE + /* glsl */`varying vec2 vU; uniform float uT;
  void main(){ float r = length(vU); if (r > 1.) discard;
    vec3 p = vec3(vU * 3., uT * .15); float g = fbm3(p + fbm3(p * 1.7) * .8);
    vec3 c = mix(vec3(1., .48, .11), vec3(1., .77, .23), g); c = mix(c, vec3(1., .96, .76), smoothstep(.55, 0., r) * .5);
    c *= 1. - .45 * pow(r, 2.5);
    c *= .75 + .5 * smoothstep(.35, .75, g);
    float bordo = smoothstep(1., .96, r);
    gl_FragColor = vec4(c * 1.05, bordo); }`
const CORONA_F = GLSL_RUMORE + /* glsl */`varying vec2 vU; uniform float uT;
  void main(){ float r = length(vU), a = atan(vU.y, vU.x);
    float raggi = .55 + .45 * fbm3(vec3(a * 3., r * 2. - uT * .3, uT * .1));
    float k = smoothstep(1., .38, r) * raggi * smoothstep(.3, .4, r);
    gl_FragColor = vec4(vec3(1., .62, .22) * k * .6, k); }`
const BUCO_F = GLSL_RUMORE + /* glsl */`varying vec2 vU; uniform float uT;
  void main(){ vec2 p = vU; float r = length(p);
    vec2 d = vec2(p.x, p.y * 3.8 + p.x * .7);   // il disco, inclinato
    float rd = length(d), ang = atan(d.y, d.x);
    float giro = fbm3(vec3(ang * 2. + uT * .6, rd * 6., 1.));
    float disco = smoothstep(.95, .55, rd) * smoothstep(.27, .36, rd) * (.4 + .9 * giro);
    float fronte = step(0., -d.y + p.x * 0.) ;
    vec3 col = mix(vec3(1., .45, .15), vec3(1., .85, .6), smoothstep(.7, .3, rd)) * disco * 1.4;
    col *= .7 + .6 * smoothstep(-.6, .6, p.x);                         // il lato che viene verso di noi
    float arco = smoothstep(.03, 0., abs(r - .3)) * .55 + smoothstep(.1, 0., abs(r - .32)) * .15;
    col += vec3(1., .85, .7) * arco;
    float nero = smoothstep(.3, .27, r);
    float sopra = smoothstep(.0, .1, d.y) * step(rd, 1.);              // la metà dietro passa sopra il buco
    col = mix(col * (1. - nero), col, sopra * disco);
    float a = clamp(max(nero * .92, max(disco, arco)), 0., 1.);
    float alone = smoothstep(1., .2, r) * .12;
    gl_FragColor = vec4((col + vec3(.6, .45, 1.) * alone) * .8, max(a, alone)); }`

function stelle(n, vicine, r) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), dim = new Float32Array(n), fase = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    pos[i * 3] = r() * 2.2 - 1.1; pos[i * 3 + 1] = r() * 2.2 - 1.1; pos[i * 3 + 2] = r()
    const l = Math.pow(r(), 3) * (vicine ? 1.1 : 1.5) + 0.3
    col[i * 3] = l; col[i * 3 + 1] = l; col[i * 3 + 2] = l
    dim[i] = (vicine ? 2.2 : 1.4) + Math.pow(r(), 4) * (vicine ? 4 : 3.5); fase[i] = r() * 6.28
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3)); g.setAttribute('colore', new BufferAttribute(col, 3))
  g.setAttribute('dim', new BufferAttribute(dim, 1)); g.setAttribute('fase', new BufferAttribute(fase, 1))
  const m = new ShaderMaterial({ vertexShader: STELLE_V, fragmentShader: STELLE_F, transparent: true, depthWrite: false,
    blending: AdditiveBlending, uniforms: { uT: { value: 0 }, uPx: { value: 1 }, uVel: { value: vicine ? 0.05 : 0 }, uScia: { value: 0 } } })
  const p = new Points(g, m); p.frustumCulled = false
  p.userData.luce = col.filter((_, i) => i % 3 === 0)   // la luce di ogni stella, per ritingerle a ogni cielo
  return p
}

export function creaCielo(scena, renderer) {
  const r = seme(11)
  // il fondale cotto: si rifà solo quando cambia il cielo o la forma dello schermo
  const bersaglio = new WebGLRenderTarget(256, 512, { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false })
  const cuoci = new ShaderMaterial({ vertexShader: PIENO_V, fragmentShader: NEBULOSA_F, depthTest: false, depthWrite: false,
    uniforms: { uAlto: { value: new Color() }, uMedio: { value: new Color() }, uBasso: { value: new Color() },
                uNeb: { value: [0, 1, 2, 3].map(() => new Vector4()) }, uNebC: { value: [0, 1, 2, 3].map(() => new Color()) },
                uDim: { value: new Vector2(1, 1) }, uSeme: { value: 3 } } })
  const forno = new Scene(), fornoCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  forno.add(new Mesh(new PlaneGeometry(2, 2), cuoci))
  const fondo = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ vertexShader: PIENO_V, fragmentShader: FONDO_F,
    depthTest: false, depthWrite: false, uniforms: { tNeb: { value: bersaglio.texture }, uSposta: { value: new Vector2() } } }))
  fondo.frustumCulled = false; fondo.renderOrder = -100
  scena.add(fondo)

  const lontane = stelle(1100, false, r), vicine = stelle(200, true, r)
  lontane.renderOrder = -90; vicine.renderOrder = -80
  scena.add(lontane, vicine)

  // le cose grandi: un gruppo lontano, posato in frazioni dello schermo
  const dietro = new Group(); scena.add(dietro)
  const PROF = 60
  const sferaPianeta = new SphereGeometry(1, 64, 40)
  const pianetaMat = () => new ShaderMaterial({ vertexShader: PIANETA_V, fragmentShader: PIANETA_F,
    uniforms: { uA: { value: new Color() }, uB: { value: new Color() }, uC: { value: new Color() }, uAtm: { value: new Color() },
                uSole: { value: SOLE }, uBande: { value: 30 }, uRoccia: { value: 0 }, uT: { value: 0 }, uK: { value: 0.6 } } })
  const pianeta = new Mesh(sferaPianeta, pianetaMat())
  const anelli = new Mesh(new RingGeometry(1.45, 2.5, 128, 1), new ShaderMaterial({ transparent: true, depthWrite: false, side: DoubleSide,
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: ANELLI_F, uniforms: { uC: { value: new Color() }, uK: { value: 0.6 } } }))
  anelli.rotation.set(1.15, 0.25, 0)
  const luna = new Mesh(sferaPianeta, pianetaMat())
  luna.material.uniforms.uRoccia.value = 1
  for (const [u, c] of [['uA', '#9aa0a6'], ['uB', '#d0d4d8'], ['uC', '#4a4e54'], ['uAtm', '#000000']]) luna.material.uniforms[u].value.set(c)
  const quadro = new PlaneGeometry(2, 2)
  const QV = `varying vec2 vU; void main(){ vU = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
  const sole = new Mesh(quadro, new ShaderMaterial({ vertexShader: QV, fragmentShader: SOLE_F, transparent: true, depthWrite: false,
    uniforms: { uT: { value: 0 } } }))
  const corona = new Mesh(quadro, new ShaderMaterial({ vertexShader: QV, fragmentShader: CORONA_F, transparent: true, depthWrite: false,
    blending: AdditiveBlending, uniforms: { uT: { value: 0 } } }))
  const buco = new Mesh(quadro, new ShaderMaterial({ vertexShader: QV, fragmentShader: BUCO_F, transparent: true, depthWrite: false,
    blending: NormalBlending, uniforms: { uT: { value: 0 } } }))
  for (const m of [pianeta, anelli, luna, sole, corona, buco]) { m.visible = false; dietro.add(m) }
  corona.renderOrder = -70; sole.renderOrder = -69; buco.renderOrder = -70; anelli.renderOrder = -60

  let cielo = null, forma = '', vista = { larg: 1, alto: 1 }
  // da frazioni dello schermo (y dall'alto) a mondo, alla profondità del fondo
  function posa(m, fx, fy, fr, cam) {
    const h = 2 * Math.tan((cam.fov * Math.PI / 180) / 2) * (cam.position.z + PROF), w = h * cam.aspect
    m.position.set((fx - 0.5) * w, (0.5 - fy) * h, -PROF)
    m.scale.setScalar(fr * w)
  }

  function cuociFondo(W, H) {
    const P = CIELI[cielo] || CIELI.cintura, u = cuoci.uniforms
    u.uAlto.value.set(P.alto); u.uMedio.value.set(P.medio); u.uBasso.value.set(P.basso)
    for (let i = 0; i < 4; i++) {
      const n = P.neb[i]
      u.uNeb.value[i].set(n ? n.x : 0, n ? n.y : 0, n ? n.r : 0, 0)
      u.uNebC.value[i].set(n ? n.c : '#000000')
    }
    const D = Math.max(W, H)
    u.uDim.value.set(W / D, H / D)
    u.uSeme.value = (cielo || '').length * 3.7
    const lato = 512, w = Math.max(64, Math.round(lato * W / D)), h = Math.max(64, Math.round(lato * H / D))
    bersaglio.setSize(w, h)
    const prima = renderer.getRenderTarget()
    renderer.setRenderTarget(bersaglio); renderer.render(forno, fornoCam); renderer.setRenderTarget(prima)
    // le stelle prendono la tinta del cielo
    for (const s of [lontane, vicine]) {
      const c = s.geometry.attributes.colore, k = new Color(P.stella)
      for (let i = 0; i < c.count; i++) {
        const l = s.userData.luce[i]
        if (i % 5 === 0) c.setXYZ(i, k.r * l * 1.4, k.g * l * 1.4, k.b * l * 1.4)
        else c.setXYZ(i, l, l, l)
      }
      c.needsUpdate = true
    }
  }

  return {
    luci: c => LUCI[c] || LUCI.cintura,
    // `cielo`: il posto (data/asteroidi.js); W, H in pixel; `cam` la telecamera della scena
    metti(c, W, H, cam) {
      const f = `${c}|${W}x${H}`
      if (f !== forma) { const vecchio = cielo; cielo = c; forma = f; cuociFondo(W, H); if (vecchio !== c) cambia() }
      const S = SFONDI[cielo] || SFONDI.cintura
      if (S.pianeta) {
        const p = S.pianeta
        posa(pianeta, p.x, p.y, p.r * 0.5, cam)
        anelli.position.copy(pianeta.position); anelli.scale.copy(pianeta.scale)
        posa(luna, p.x - 0.28, p.y + 0.12, 0.045, cam)
      }
      if (S.sole) { posa(sole, 0.84, -0.07, 0.5, cam); posa(corona, 0.84, -0.07, 0.95, cam) }
      if (S.buco) posa(buco, 0.5, 0.27, 0.46, cam)
    },
    disegna(t, salto, spostaX, spostaY, dpr) {
      lontane.material.uniforms.uT.value = t; vicine.material.uniforms.uT.value = t
      lontane.material.uniforms.uPx.value = dpr; vicine.material.uniforms.uPx.value = dpr
      vicine.material.uniforms.uScia.value = Math.max(0, salto)
      vicine.material.uniforms.uVel.value = 0.05 * (1 + Math.max(0, salto) * 40)
      lontane.material.uniforms.uScia.value = Math.max(0, salto) * 0.6
      fondo.material.uniforms.uSposta.value.set(spostaX * 0.002, spostaY * 0.002)
      pianeta.material.uniforms.uT.value = t * 0.02
      luna.material.uniforms.uT.value = t * 0.05
      sole.material.uniforms.uT.value = t; corona.material.uniforms.uT.value = t; buco.material.uniforms.uT.value = t
    },
  }

  function cambia() {
    const S = SFONDI[cielo] || SFONDI.cintura
    pianeta.visible = !!S.pianeta; anelli.visible = !!S.pianeta?.anelli; luna.visible = !!S.pianeta?.luna
    sole.visible = corona.visible = !!S.sole; buco.visible = !!S.buco
    if (S.pianeta) {
      const p = S.pianeta, u = pianeta.material.uniforms
      u.uA.value.set(p.a); u.uB.value.set(p.b); u.uC.value.set(p.c); u.uAtm.value.set(p.atm)
      u.uBande.value = p.bande || 30; u.uRoccia.value = p.roccia || 0
      if (p.anelli) anelli.material.uniforms.uC.value.set(p.anelli)
    }
  }
}
