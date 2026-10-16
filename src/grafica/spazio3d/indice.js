// Il cielo degli asteroidi in 3D (three.js, WebGL 2). Vedi docs/asteroidi/grafica-3d.md.
// Chi gioca non disegna: la view passa a `disegna(q)` la stessa scena che dà al disegno 2D
// (nave, sassi, nave madre, raggi, anelli, scintille, in pixel dello schermo), e qui si
// traduce in mondo: il piano z = 0 è lo schermo, un pixel è `K` unità. Se WebGL non c'è,
// `creaSpazio3d` torna null e la view resta sul 2D; se il contesto si perde, chiama `perso`.
import { WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight, PointLight, ACESFilmicToneMapping,
         WebGLRenderTarget, HalfFloatType, Mesh, PlaneGeometry, ShaderMaterial, OrthographicCamera, Vector2,
         PMREMGenerator, MeshBasicMaterial, Color, DoubleSide, BackSide, SphereGeometry } from 'three'
import { creaCielo, DIREZIONE_SOLE } from './cielo.js'
import { creaSassi } from './sassi.js'
import { creaNave } from './nave.js'
import { creaMadre } from './madre.js'
import { creaEffetti } from './effetti.js'
import { formaDi } from './forme.js'
import { specieDi } from '../cieli.js'
import { rgb } from './rumore.js'

const K = 0.01                 // mondo per pixel
const FOV = 50
const DPR_MAX = 1.5, DPR_MIN = 1   // sotto 1 la tela è stirata e sfoca: meglio perdere fotogrammi che nitidezza

const POST_F = /* glsl */`
uniform sampler2D tScena; uniform float uAb, uT, uFlash, uLampo; uniform vec2 uRes; varying vec2 vU;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 c = vU - .5; float d = length(c);
  vec2 off = c * (uAb + d * d * .01);
  vec3 col = vec3(texture2D(tScena, vU - off).r, texture2D(tScena, vU).g, texture2D(tScena, vU + off).b);
  col *= 1. - smoothstep(.35, .95, d * 1.2) * .5;                       // la vignetta
  float l = dot(col, vec3(.2126, .7152, .0722));
  col = mix(col, col * vec3(.88, .96, 1.16), 1. - smoothstep(0., .35, l)); // ombre fredde
  col = mix(col, col * vec3(1.1, 1., .9), smoothstep(.5, 2., l));         // luci calde
  col = mix(vec3(l), col, 1.1);
  col += uFlash * vec3(1., .75, .45) * max(0., 1. - d * 1.6) * .3;
  gl_FragColor = vec4(col, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb += (h(vU * uRes + uT) - .5) * .03;                     // la grana
  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.), uLampo);              // il lampo bianco del 2D
}`

function ambiente(renderer) {
  // i riflessi dei metalli: qualche pannello di luce attorno, su un fondo blu notte
  const amb = new Scene()
  amb.add(new Mesh(new SphereGeometry(50, 16, 8), new MeshBasicMaterial({ color: new Color(0.01, 0.015, 0.04), side: BackSide })))
  const box = (c, x, y, z, w, h) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(...c), side: DoubleSide }))
    m.position.set(x, y, z); m.lookAt(0, 0, 0); amb.add(m)
  }
  box([9, 8, 6.5], 30, 25, 25, 30, 14); box([1.2, 2.2, 5], -30, -10, 12, 24, 30); box([2.5, 1.2, 0.6], 0, -30, -10, 40, 8)
  const pm = new PMREMGenerator(renderer)
  const t = pm.fromScene(amb, 0.02).texture
  pm.dispose()
  return t
}

export function creaSpazio3d(canvas, { perso, dpr } = {}) {
  // il contesto si chiede qui: senza WebGL 2 si torna null in silenzio, prima che three lo dica in console
  let gl = null, renderer
  try {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: true, stencil: false,
                                       premultipliedAlpha: true, powerPreference: 'high-performance' })
  } catch (e) { gl = null }
  if (!gl || gl.isContextLost()) return null
  try { renderer = new WebGLRenderer({ canvas, context: gl, antialias: false, alpha: false }) } catch (e) { return null }

  let tutto
  try { tutto = costruisci(renderer, dpr) } catch (e) {
    console.warn('asteroidi 3D: niente, si resta sul 2D', e)
    try { renderer.dispose() } catch (x) { /* pazienza */ }
    return null
  }
  const perdi = e => { e.preventDefault(); perso?.() }
  canvas.addEventListener('webglcontextlost', perdi)
  tutto.toglie = () => canvas.removeEventListener('webglcontextlost', perdi)
  return tutto
}

// `fisso`: un pixel ratio che non si adatta (per le foto)
function costruisci(renderer, fisso) {
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.info.autoReset = false
  const scena = new Scene()
  scena.environment = ambiente(renderer)
  scena.environmentIntensity = 0.8
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 400)
  const amb = new AmbientLight(0x1a2448, 0.7); scena.add(amb)
  const sole = new DirectionalLight(0xfff0dd, 4); sole.position.copy(DIREZIONE_SOLE).multiplyScalar(30); scena.add(sole)
  const fredda = new DirectionalLight(0x4a7dff, 1.3); fredda.position.set(-8, -3, 6); scena.add(fredda)
  const lampo = new PointLight(0xffa050, 0, 9, 1.6); scena.add(lampo)
  const motori = new PointLight(0x66ccff, 2, 4, 1.8); scena.add(motori)

  const cielo = creaCielo(scena, renderer)
  const sassi = creaSassi(scena)
  const nave = creaNave(scena)
  const madre = creaMadre(scena)
  const eff = creaEffetti(scena)

  // la scena si dipinge su una tela di scorta, poi un passaggio solo fa vignetta, colore, grana e tono
  const tela = new WebGLRenderTarget(4, 4, { type: HalfFloatType, depthBuffer: true })
  const post = new ShaderMaterial({ fragmentShader: POST_F, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    uniforms: { tScena: { value: tela.texture }, uAb: { value: 0.0012 }, uT: { value: 0 }, uFlash: { value: 0 },
                uLampo: { value: 0 }, uRes: { value: new Vector2(1, 1) } } })
  const postScena = new Scene(), postCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quadro = new Mesh(new PlaneGeometry(2, 2), post); quadro.frustumCulled = false
  postScena.add(quadro)

  let W = 1, H = 1, dpr = fisso || Math.min(DPR_MAX, window.devicePixelRatio || 1), D = 10
  let cieloOra = null, ultimo = 0, mediaMs = 16, lenti = 0, svelti = 0, msScena = 0, msDisegno = 0
  const X = x => (x - W / 2) * K
  const Y = y => (H / 2 - y) * K

  function misura() {
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H, false)
    tela.setSize(Math.round(W * dpr), Math.round(H * dpr))
    camera.aspect = W / H
    D = (H * K / 2) / Math.tan((FOV / 2) * Math.PI / 180)
    camera.position.set(0, 0, D); camera.updateProjectionMatrix()
    post.uniforms.uRes.value.set(W * dpr, H * dpr)
    eff.pixel(dpr)
  }

  // quanto regge il telefono: se un fotogramma costa troppo si scende di pixel, se avanza si risale
  function adatta(ms) {
    mediaMs += (ms - mediaMs) * 0.05
    if (fisso) return
    const tetto = Math.min(DPR_MAX, window.devicePixelRatio || 1)
    if (mediaMs > 26) { if (++lenti > 90 && dpr > Math.min(DPR_MIN, tetto)) { dpr = Math.max(Math.min(DPR_MIN, tetto), dpr * 0.85); misura(); lenti = 0 } } else lenti = 0
    if (mediaMs < 15 && dpr < tetto) { if (++svelti > 240) { dpr = Math.min(tetto, dpr * 1.1); misura(); svelti = 0 } } else svelti = 0
  }

  return {
    ridimensiona(w, h) { W = Math.max(1, w); H = Math.max(1, h); misura() },
    // le forme di un cielo si fanno quando si entra, non al primo sasso
    prepara(c) { for (let n = 0; n < 3; n++) formaDi(c === 'marte' ? 'marte' : specieDi(c), n); formaDi('bomba', 0) },
    disegna(q, dt) {
      const ora = performance.now()
      if (ultimo) adatta(Math.min(100, ora - ultimo))
      ultimo = ora
      const t = q.t
      if (q.cielo !== cieloOra) {
        cieloOra = q.cielo
        const L = cielo.luci(q.cielo)
        sole.color.set(L.sole); sole.intensity = L.k; amb.color.set(L.amb)
      }
      camera.position.set(0, 0, D)
      cielo.metti(q.cielo, W, H, camera)
      // la scossa: la telecamera trema, e i colori si sdoppiano un poco
      const sx = q.scossa > 0 ? (Math.random() - 0.5) * q.scossa * K : 0, sy = q.scossa > 0 ? (Math.random() - 0.5) * q.scossa * K : 0
      camera.position.set(sx, sy, D)
      cielo.disegna(t, q.salto, sx, sy, dpr)

      sassi.disegna(q, X, Y, K, t)
      sassi.codaTempo.value = t
      nave.disegna(q.nave, X, Y, K, t, dt, eff.sciame, q.S)
      madre.disegna(q.madre, q.pezzi, X, Y, K, t, dt, eff.sciame, q.S, D)
      eff.disegna(q, X, Y, K, dt)

      // il lampo delle esplosioni: una luce dove è nato l'anello più giovane
      let giovane = null
      for (const g of q.anelli) if (!giovane || g.vita > giovane.vita) giovane = g
      if (giovane && giovane.vita > 0.3) {
        lampo.position.set(X(giovane.x), Y(giovane.y), 1.5)
        const c = rgb(giovane.c); lampo.color.setRGB(c[0], c[1], c[2])
        lampo.intensity = (giovane.vita - 0.3) * 40
      } else lampo.intensity = 0
      const f = rgb(q.nave.livrea?.fiamma || '#4aa3ff')
      motori.color.setRGB(f[0], f[1], f[2])
      motori.position.set(X(q.nave.x), Y(q.nave.y) - q.nave.r * K * 1.2, 0.6)
      motori.intensity = 1.6 + Math.sin(t * 40) * 0.4

      post.uniforms.uT.value = t % 100
      post.uniforms.uAb.value = 0.0012 + Math.min(18, q.scossa) * 0.0003
      post.uniforms.uFlash.value = Math.max(0, Math.min(1, q.lampo * 1.6))
      post.uniforms.uLampo.value = Math.max(0, q.lampo) * 0.45

      const fatto = performance.now()
      msScena += (fatto - ora - msScena) * 0.05
      renderer.info.reset()
      renderer.setRenderTarget(tela)
      renderer.render(scena, camera)
      renderer.setRenderTarget(null)
      renderer.render(postScena, postCam)
      msDisegno += (performance.now() - fatto - msDisegno) * 0.05
    },
    // per i test e per chi misura: quanto costa un fotogramma
    info() {
      const i = renderer.info.render
      const d = x => Math.round(x * 10) / 10
      // `ms`: fra un fotogramma e l'altro; `scena`: il JS che prepara; `disegno`: le chiamate a WebGL
      return { chiamate: i.calls, triangoli: i.triangles, dpr, ms: d(mediaMs), scena: d(msScena), disegno: d(msDisegno) }
    },
    distruggi() {
      this.toglie?.()
      renderer.dispose()
      renderer.forceContextLoss?.()
    },
  }
}
