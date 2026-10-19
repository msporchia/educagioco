// Le scene di misura del telefono (docs/core/vecchio-telefono.md): ognuna carica UNA cosa sola (pixel, strati sovrapposti,
// esplosioni, triangoli, chiamate, ombre, passaggio finale) a qualità diverse, così il log dice quale pesa. Si importa a
// richiesta: porta con sé three, che la zona dei grandi non deve caricare finché nessuno preme il tasto.
import { WebGLRenderer, Scene, PerspectiveCamera, OrthographicCamera, Mesh, PlaneGeometry, ShaderMaterial, MeshStandardMaterial,
         IcosahedronGeometry, InstancedMesh, Object3D, DirectionalLight, AmbientLight, BufferGeometry, BufferAttribute, Points,
         AdditiveBlending, NormalBlending, WebGLRenderTarget, HalfFloatType, DynamicDrawUsage, BasicShadowMap, Vector2 } from 'three'

const VERT_PIENO = `varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy, 0., 1.); }`
// il riempimento: `n` giri di calcolo per pixel (4 = un gioco leggero, 40 = uno shader da nebbia)
const fragmento = n => `precision mediump float; varying vec2 vU; uniform float uT; uniform float uA;
void main(){ vec2 u = vU * 3.; float v = 0.;
  for (int i = 0; i < ${n}; i++) { u = vec2(sin(u.y * 1.7 + uT), cos(u.x * 1.3 - uT)) * 1.1 + u * 0.5; v += sin(u.x * u.y); }
  gl_FragColor = vec4(fract(v), fract(v * 2.), fract(v * 3.), uA); }`

const PUNTI_V = `attribute float dim; uniform float uPx; void main(){ gl_PointSize = dim * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
const PUNTI_F = `void main(){ float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard; float a = pow(1. - d, 1.6) * .35; gl_FragColor = vec4(1., .55 + .3 * d, .2, a); }`

const quadro = (n, alfa = 1, fonde = false) => {
  const m = new ShaderMaterial({ vertexShader: VERT_PIENO, fragmentShader: fragmento(n), uniforms: { uT: { value: 0 }, uA: { value: alfa } },
    transparent: fonde, depthTest: false, depthWrite: false, blending: NormalBlending })
  const q = new Mesh(new PlaneGeometry(2, 2), m); q.frustumCulled = false
  return q
}

// una prova: `fai(ctx)` costruisce la scena e ritorna { scena, camera, aggiorna?(t), pulisci?() }; `dpr` null = quello dello schermo
// `ctx` = { W, H, dpr, renderer }
export const PROVE = [
  { id: 'vuoto', famiglia: 'base', nome: 'schermo vuoto', dpr: 1,
    fai: () => ({ scena: new Scene(), camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1) }) },

  ...[['1', 1], ['1.5', 1.5], ['nativo', null]].map(([e, dpr]) => ({ id: 'pieno-' + e, famiglia: 'riempimento', nome: `pixel, shader leggero, dpr ${e}`, dpr,
    fai: () => { const s = new Scene(), q = quadro(4); s.add(q); return { scena: s, camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1), aggiorna: t => { q.material.uniforms.uT.value = t } } } })),
  { id: 'pesante-1', famiglia: 'riempimento', nome: 'pixel, shader pesante (nebbia), dpr 1', dpr: 1,
    fai: () => { const s = new Scene(), q = quadro(40); s.add(q); return { scena: s, camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1), aggiorna: t => { q.material.uniforms.uT.value = t } } } },

  ...[['1', 1], ['nativo', null]].map(([e, dpr]) => ({ id: 'strati-' + e, famiglia: 'sovrapposti', nome: `8 strati a schermo intero sfumati, dpr ${e}`, dpr,
    fai: () => { const s = new Scene(); const qq = []; for (let i = 0; i < 8; i++) { const q = quadro(2, .15, true); qq.push(q); s.add(q) }
      return { scena: s, camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1), aggiorna: t => qq.forEach((q, i) => { q.material.uniforms.uT.value = t + i }) } } })),

  ...[[150, 40], [500, 80], [1200, 120]].map(([n, px]) => ({ id: `scoppi-${n}`, famiglia: 'esplosioni', nome: `${n} scintille da ${px} px, dpr 1.5`, dpr: 1.5,
    fai: ({ W, H, dpr }) => {
      const pos = new Float32Array(n * 3), dim = new Float32Array(n), g = new BufferGeometry()
      g.setAttribute('position', new BufferAttribute(pos, 3).setUsage(DynamicDrawUsage)); g.setAttribute('dim', new BufferAttribute(dim, 1))
      const m = new ShaderMaterial({ vertexShader: PUNTI_V, fragmentShader: PUNTI_F, uniforms: { uPx: { value: dpr } }, transparent: true, depthWrite: false, blending: AdditiveBlending })
      const p = new Points(g, m); p.frustumCulled = false
      const s = new Scene(); s.add(p)
      const cam = new OrthographicCamera(0, W, H, 0, -1, 1)
      dim.fill(px)
      return { scena: s, camera: cam, aggiorna: t => {   // le scintille si muovono e il buffer si riscrive, come nel gioco
        for (let i = 0; i < n; i++) { pos[i * 3] = W / 2 + Math.cos(i * 2.4 + t * 2) * (i % 9) * W / 22; pos[i * 3 + 1] = H / 2 + Math.sin(i * 1.7 + t * 2) * (i % 11) * H / 28 }
        g.attributes.position.needsUpdate = true } }
    } })),

  ...[[10000, 20], [40000, 20], [100000, 20]].map(([tri, _]) => ({ id: `tri-${tri / 1000}k`, famiglia: 'geometria', nome: `${tri / 1000}k triangoli in una chiamata, con luci`, dpr: 1.5,
    fai: ({ W, H }) => {
      const s = new Scene(), cam = new PerspectiveCamera(50, W / H, .1, 100); cam.position.z = 9
      const det = Math.round(Math.sqrt(tri / 20 / 12))     // un'icosaedro ha 20·(det+1)² facce
      const g = new IcosahedronGeometry(1, Math.max(1, det)); const per = g.index ? g.index.count / 3 : g.attributes.position.count / 3
      const n = Math.max(1, Math.round(tri / per)), im = new InstancedMesh(g, new MeshStandardMaterial({ color: 0x88aacc, roughness: .6 }), n), o = new Object3D()
      s.add(im, new AmbientLight(0xffffff, .5)); const l = new DirectionalLight(0xffffff, 2); l.position.set(3, 5, 4); s.add(l)
      return { scena: s, camera: cam, aggiorna: t => { for (let i = 0; i < n; i++) { o.position.set(((i % 6) - 2.5) * 2.2, (Math.floor(i / 6) % 6 - 2.5) * 2.2, -(Math.floor(i / 36)) * 2); o.rotation.set(t + i, t * .7, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix) } im.instanceMatrix.needsUpdate = true } }
    } })),

  ...[[30], [150], [400]].map(([n]) => ({ id: `chiamate-${n}`, famiglia: 'chiamate', nome: `${n} oggetti separati (una chiamata l'uno), dpr 1`, dpr: 1,
    fai: ({ W, H }) => {
      const s = new Scene(), cam = new PerspectiveCamera(50, W / H, .1, 100); cam.position.z = 14
      const g = new IcosahedronGeometry(.5, 1), mm = new MeshStandardMaterial({ color: 0xccaa88 }), oo = []
      for (let i = 0; i < n; i++) { const m = new Mesh(g, mm); m.position.set(((i % 20) - 10) * .7, (Math.floor(i / 20) - 10) * .7, 0); oo.push(m); s.add(m) }
      s.add(new AmbientLight(0xffffff, .6)); const l = new DirectionalLight(0xffffff, 2); l.position.set(2, 4, 5); s.add(l)
      return { scena: s, camera: cam, aggiorna: t => oo.forEach((m, i) => { m.rotation.y = t + i }) }
    } })),

  ...[[1024], [2048]].map(([mp]) => ({ id: `ombre-${mp}`, famiglia: 'ombre', nome: `ombre di 30 oggetti, mappa ${mp}, dpr 1`, dpr: 1, ombre: true,
    fai: ({ W, H, renderer }) => {
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = BasicShadowMap
      const s = new Scene(), cam = new PerspectiveCamera(50, W / H, .1, 100); cam.position.set(0, 6, 10); cam.lookAt(0, 0, 0)
      const l = new DirectionalLight(0xffffff, 2.5); l.position.set(4, 8, 3); l.castShadow = true; l.shadow.mapSize.set(mp, mp)
      Object.assign(l.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); l.shadow.camera.updateProjectionMatrix(); s.add(l, new AmbientLight(0xffffff, .4))
      const suolo = new Mesh(new PlaneGeometry(30, 30), new MeshStandardMaterial({ color: 0x556677 })); suolo.rotation.x = -Math.PI / 2; suolo.receiveShadow = true; s.add(suolo)
      const oo = []; const g = new IcosahedronGeometry(.6, 2), mm = new MeshStandardMaterial({ color: 0xddaa66 })
      for (let i = 0; i < 30; i++) { const m = new Mesh(g, mm); m.castShadow = true; m.receiveShadow = true; oo.push(m); s.add(m) }
      return { scena: s, camera: cam, aggiorna: t => oo.forEach((m, i) => m.position.set(Math.cos(i + t * .5) * (2 + i % 5), .8 + (i % 3) * .5, Math.sin(i * 1.3 + t * .5) * (2 + i % 4))),
               pulisci: () => { renderer.shadowMap.enabled = false } }
    } })),

  ...[['diretto', false], ['con-passaggio', true]].map(([e, passa]) => ({ id: 'post-' + e, famiglia: 'passaggio-finale', nome: passa ? 'scena su tela intermedia (half-float) e passaggio finale, dpr 1.5' : 'la stessa scena disegnata diretta, dpr 1.5', dpr: 1.5,
    fai: ({ W, H, dpr, renderer }) => {
      const s = new Scene(), cam = new PerspectiveCamera(50, W / H, .1, 100); cam.position.z = 9
      const g = new IcosahedronGeometry(1, 3), mm = new MeshStandardMaterial({ color: 0x88aacc }), oo = []
      for (let i = 0; i < 12; i++) { const m = new Mesh(g, mm); oo.push(m); s.add(m) }
      s.add(new AmbientLight(0xffffff, .6)); const l = new DirectionalLight(0xffffff, 2); l.position.set(3, 5, 4); s.add(l)
      const base = { scena: s, camera: cam, aggiorna: t => oo.forEach((m, i) => m.position.set(Math.cos(i + t) * 3, Math.sin(i * 1.7 + t) * 4, 0)) }
      if (!passa) return base
      let tela
      try { tela = new WebGLRenderTarget(Math.round(W * dpr), Math.round(H * dpr), { type: HalfFloatType, depthBuffer: true }) } catch (e) { return { nonRegge: true } }
      const post = new Scene(), q = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ vertexShader: VERT_PIENO, uniforms: { t: { value: tela.texture }, uRes: { value: new Vector2(W * dpr, H * dpr) } }, depthTest: false,
        fragmentShader: `precision mediump float; varying vec2 vU; uniform sampler2D t; uniform vec2 uRes; void main(){ vec3 c = texture2D(t, vU).rgb; vec3 a = texture2D(t, vU + vec2(.0012, 0.)).rgb; vec2 d = vU - .5; c = vec3(c.r, a.g, c.b) * (1. - dot(d, d) * 1.2); gl_FragColor = vec4(pow(c / (1. + c), vec3(.9)), 1.); }` }))
      q.frustumCulled = false; post.add(q)
      return { ...base, disegna: (r, sc, ca) => { r.setRenderTarget(tela); r.render(sc, ca); r.setRenderTarget(null); r.render(post, new OrthographicCamera(-1, 1, 1, -1, 0, 1)) }, pulisci: () => tela.dispose() }
    } })),
]

// la CPU da sola: calcolo, oggetti da allocare e ordinare (il JS di un gioco), niente disegno
export function proveCpu() {
  const una = () => {
    const t = performance.now(); let s = 0
    for (let i = 0; i < 4e6; i++) s += Math.sin(i * 0.001) * Math.sqrt(i + 1)
    const a = []; for (let i = 0; i < 150000; i++) a.push({ x: Math.cos(i) * 1000, y: i, n: 'k' + (i % 97) })
    a.sort((p, q) => p.x - q.x)
    return performance.now() - t + (s === 1 ? 1 : 0)
  }
  una()
  const v = [una(), una(), una()].sort((a, b) => a - b)
  return Math.round(v[1])
}

export function infoGpu(gl) {
  const e = gl.getExtension('WEBGL_debug_renderer_info')
  return { gpu: e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?', fornitore: e ? gl.getParameter(e.UNMASKED_VENDOR_WEBGL) : '?',
    versione: gl.getParameter(gl.VERSION), maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    mezzaPrecisione: !!gl.getExtension('EXT_color_buffer_half_float') || !!gl.getExtension('EXT_color_buffer_float'),
    tempoGpu: !!(gl.getExtension('EXT_disjoint_timer_query_webgl2') || gl.getExtension('EXT_disjoint_timer_query')) }
}

const pausa = ms => new Promise(r => setTimeout(r, ms))
const mediana = v => { const o = v.slice().sort((a, b) => a - b); return o.length ? o[Math.floor(o.length / 2)] : 0 }
const perc = (v, q) => { const o = v.slice().sort((a, b) => a - b); return o.length ? o[Math.min(o.length - 1, Math.floor(q * o.length))] : 0 }

// Esegue tutte le prove su una tela a schermo intero; `progresso(i, n, nome)` per la barra, `fermo()` per interrompere.
// Per ogni prova: ms di LAVORO per fotogramma (disegno + attesa della GPU con una lettura di un pixel: non dipende dai 60 Hz) e fps veri.
// `solo`: un elenco di id (e `js`) per fare solo quelle (lo strumento che tara il computer sul telefono, strumenti/vecchio-telefono.mjs)
export async function eseguiProve({ canvas, progresso = () => {}, fermo = () => false, corto = false, solo = null }) {
  const scalda = corto ? 80 : 500, misura = corto ? 250 : 1600
  const W = Math.max(1, window.innerWidth), H = Math.max(1, window.innerHeight)
  const nativo = window.devicePixelRatio || 1
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
  const gl = renderer.getContext(), px = new Uint8Array(4)
  const info = infoGpu(gl)
  const risultati = []
  const scelte = solo ? PROVE.filter(p => solo.includes(p.id)) : PROVE
  for (let k = 0; k < scelte.length; k++) {
    if (fermo()) break
    const p = scelte[k]
    progresso(k, scelte.length, p.nome)
    const dpr = p.dpr || nativo
    renderer.setPixelRatio(dpr); renderer.setSize(W, H, false)
    let sc
    try { sc = p.fai({ W, H, dpr, renderer }) } catch (e) { sc = { nonRegge: true, errore: String(e.message || e) } }
    if (sc.nonRegge) { risultati.push({ id: p.id, famiglia: p.famiglia, nome: p.nome, errore: sc.errore || 'non supportato' }); continue }
    const lavoro = [], dt = []
    const t0 = performance.now(); let ultimo = 0, nascosta = false
    await new Promise(fine => {
      const giro = t => {
        if (fermo() || t - t0 > scalda + misura + 50) return fine()
        if (document.hidden) { nascosta = true; return requestAnimationFrame(giro) }
        const sec = (t - t0) / 1000
        sc.aggiorna?.(sec)
        const a = performance.now()
        if (sc.disegna) sc.disegna(renderer, sc.scena, sc.camera); else renderer.render(sc.scena, sc.camera)
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
        const l = performance.now() - a
        if (t - t0 > scalda) { lavoro.push(l); if (ultimo) dt.push(t - ultimo) }
        ultimo = t
        requestAnimationFrame(giro)
      }
      requestAnimationFrame(giro)
    })
    sc.pulisci?.()
    sc.scena?.traverse?.(o => { o.geometry?.dispose?.() })
    const somma = dt.reduce((a, b) => a + b, 0)
    risultati.push({ id: p.id, famiglia: p.famiglia, nome: p.nome, mpx: +(W * H * dpr * dpr / 1e6).toFixed(2),
      ms: +mediana(lavoro).toFixed(1), p95: +perc(lavoro, .95).toFixed(1), fps: somma ? Math.round(1000 * dt.length / somma) : 0, n: lavoro.length, ...(nascosta ? { nascosta: true } : {}) })
    await pausa(corto ? 10 : 120)
  }
  const js = fermo() || (solo && !solo.includes('js')) ? null : proveCpu()
  renderer.dispose()
  return { info, js, risultati, schermo: `${W}x${H}`, dpr: nativo, fermata: fermo() }
}
