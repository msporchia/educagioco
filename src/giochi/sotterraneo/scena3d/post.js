// Il passaggio finale, uno solo: la scena si disegna in una texture (colori oltre l'1, niente tono), e un quadrato a tutto
// schermo ci mette il tono (ACES), poi la correzione colore (ombre fredde, luci calde), l'aberrazione dei colpi, la vignetta,
// il rosso della ferita, il lampo e la grana. Niente bagliore (bloom): provato nel prototipo, bagna tutto (all'utente non piace).
import { WebGLRenderTarget, HalfFloatType, NearestFilter, Scene, OrthographicCamera, Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three'

const FRAMMENTO = /* glsl */`
uniform sampler2D tScena; uniform float uT, uAberr, uVign, uGrana, uLampo, uRosso; uniform vec2 uRis; varying vec2 vUv;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec3 tono(vec3 c){
  #ifdef TONE_MAPPING
    c = toneMapping(c);
  #endif
  return linearToOutputTexel(vec4(c, 1.0)).rgb;
}
void main(){
  vec2 c = vUv - 0.5; float r2 = dot(c, c);
  // niente aberrazione: spostava il rosso e il blu e lasciava agli sprite una scia di copie colorate (l'arma fantasma
  // dell'elfa nell'affondo); un campione solo, e il tono una volta sola invece di tre
  vec3 col = tono(texture2D(tScena, vUv).rgb);
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col *= mix(vec3(0.86, 0.98, 1.12), vec3(1.0), smoothstep(0.0, 0.35, l));
  col *= mix(vec3(1.0), vec3(1.07, 1.0, 0.88), smoothstep(0.35, 1.0, l));
  col = mix(vec3(l), col, 1.15);
  col = (col - 0.5) * 1.06 + 0.5;
  col *= 1.0 - uVign * smoothstep(0.08, 0.55, r2);
  col += uRosso * vec3(0.5, 0.0, 0.0) * smoothstep(0.05, 0.4, r2);
  col += uLampo * vec3(1.0, 0.92, 0.8);
  float g = h12(vUv*uRis + fract(uT*13.7)*517.0) - 0.5;
  col += g * uGrana * (1.0 - l*0.6);
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`

export function creaPost(renderer) {
  // Nearest: il quadro ha la misura dello schermo, e preso un pixel per pixel non deve sfumare niente
  const rt = new WebGLRenderTarget(4, 4, { type: HalfFloatType, depthBuffer: true, minFilter: NearestFilter, magFilter: NearestFilter })
  const uni = { tScena: { value: rt.texture }, uT: { value: 0 }, uAberr: { value: 0 }, uVign: { value: 0.3 }, uGrana: { value: 0.045 },
                uLampo: { value: 0 }, uRosso: { value: 0 }, uRis: { value: new Vector2(1, 1) } }
  const geo = new PlaneGeometry(2, 2)
  const mat = new ShaderMaterial({
    uniforms: uni, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: FRAMMENTO,
  })
  const quadro = new Scene()
  quadro.add(new Mesh(geo, mat))
  const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  return {
    uni,
    misura(w, h) { rt.setSize(Math.max(1, w), Math.max(1, h)); uni.uRis.value.set(w, h) },
    disegna(scena, camera) {
      renderer.setRenderTarget(rt)
      renderer.render(scena, camera)
      renderer.setRenderTarget(null)
      renderer.render(quadro, cam)
    },
    // gli shader della scena come li vuole la texture (senza tono, colori lineari): fuori dalla texture sarebbero altri programmi
    compila(o, camera, scena) {
      renderer.setRenderTarget(rt)
      try { renderer.compile(o, camera, scena) } finally { renderer.setRenderTarget(null) }
    },
    via() { rt.dispose(); geo.dispose(); mat.dispose() },
  }
}
