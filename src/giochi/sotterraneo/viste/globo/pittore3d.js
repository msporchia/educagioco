// La strada B dei globi vivi (docs/sotterraneo/barra.md): una sfera vera, calcolata pixel per pixel in uno shader. La normale
// della sfera dà l'ombra e il fresnel del vetro; il liquido è un volume tagliato da un piano ondulato visto un po' dall'alto
// (il pelo è un'ellisse che riflette), con la profondità che scurisce verso il fondo e le bolle dentro. Un contesto WebGL solo
// per tutti e due i globi, su una tela che non si vede: si disegna lì e si copia nel canvas 2D del globo (drawImage), così
// sul telefono c'è un contesto in più e non due, e niente si lega alla scena del sotterraneo. Senza WebGL, o col contesto
// perso, `pronto()` è falso e GloboVivo.vue ripiega sulla strada A
import { COLORI } from './pittore2d.js'

const VS = `attribute vec2 p; varying vec2 uv; void main() { uv = p; gl_Position = vec4(p, 0.0, 1.0); }`
const FS = `precision mediump float;
varying vec2 uv;
uniform float pelo, onda, fase, lampo, luce, px;
uniform vec3 chiaro, pieno, fondo, vuoto, schiuma;
uniform vec4 bolle[10];
float liv(float x) { return pelo + sin(x * 3.1 + fase) * onda + sin(x * 5.3 - fase * 1.4) * onda * 0.45; }
void main() {
  float d = length(uv);
  float bordo = 1.0 - smoothstep(1.0 - px * 1.5, 1.0, d);
  if (bordo <= 0.0) { gl_FragColor = vec4(0.0); return; }
  vec3 n = vec3(uv, sqrt(max(0.0, 1.0 - d * d)));
  vec3 L = normalize(vec3(-0.55, 0.65, 0.55));
  // il vetro vuoto: un fondo scuro tinto, più chiaro in basso al centro
  vec3 col = mix(vuoto * 0.35, vuoto, smoothstep(1.1, 0.0, length(uv - vec2(0.0, -0.3))));
  float h = liv(uv.x);
  float largo = sqrt(max(0.0, 1.0 - h * h));
  // il pelo visto dall'alto: dentro l'ellisse è superficie, sotto il suo bordo davanti è corpo del liquido
  float e = (uv.y - h) / max(0.001, largo * 0.17);
  float sup = (abs(uv.x) < largo) ? 1.0 - smoothstep(0.85, 1.0, abs(e) * abs(e) + (uv.x * uv.x) / max(0.0001, largo * largo)) : 0.0;
  float corpo = 1.0 - smoothstep(-px * 1.5, px * 1.5, uv.y - (h - largo * 0.17 * sqrt(max(0.0, 1.0 - (uv.x * uv.x) / max(0.0001, largo * largo)))));
  if (pelo > -1.0) {
    float prof = clamp((h - uv.y) / 1.6, 0.0, 1.0);
    vec3 liq = mix(chiaro, pieno, smoothstep(0.0, 0.35, prof));
    liq = mix(liq, fondo, smoothstep(0.35, 1.0, prof));
    liq *= 0.55 + 0.45 * n.z;                                         // il volume: più scuro dove la sfera gira
    liq += chiaro * 0.25 * pow(n.z, 6.0) * (1.0 - prof);              // la luce che passa dentro, al centro
    col = mix(col, liq, max(corpo, 0.0));
    vec3 pel = mix(chiaro, schiuma, 0.55) * (0.88 + 0.12 * sin(uv.x * 9.0 + fase * 2.0));
    col = mix(col, pel, sup * 0.9 * step(-0.99, pelo) * step(pelo, 0.985));
    for (int i = 0; i < 10; i++) {
      vec4 b = bolle[i];
      if (b.z <= 0.0) continue;
      float db = length(uv - b.xy) / b.z;
      float anello = smoothstep(1.0, 0.8, db) * (0.25 + 0.6 * smoothstep(0.55, 0.95, db));
      float punto = smoothstep(0.35, 0.0, length(uv - b.xy + vec2(b.z * 0.35, -b.z * 0.35)) / b.z);
      col = mix(col, vec3(1.0), clamp(anello * 0.55 + punto * 0.8, 0.0, 1.0) * corpo);
    }
  }
  col = mix(col, schiuma, luce * 0.4);
  col = mix(col, vec3(1.0, 0.16, 0.07), lampo * 0.5);
  // il vetro: il fresnel ai bordi, la finestra in alto a sinistra, il punto duro, l'ombra sotto
  float fres = pow(1.0 - n.z, 3.0);
  col = col * (1.0 - 0.55 * fres) + vec3(0.9, 0.95, 1.0) * fres * 0.35;
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), n);
  float fin = smoothstep(0.82, 0.97, dot(R, normalize(vec3(-0.5, 0.62, 0.6))));
  col += vec3(1.0) * fin * 0.38;
  col += vec3(1.0) * pow(max(0.0, dot(R, L)), 90.0) * 0.9;
  col += vec3(1.0) * 0.16 * smoothstep(0.75, 0.98, dot(R, normalize(vec3(0.25, -0.85, 0.45))));
  gl_FragColor = vec4(col * bordo, bordo);
}`

let tela = null, gl = null, prog = null, posti = {}, perso = false

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)

function accendi() {
  if (gl || perso) return !!gl
  try {
    tela = document.createElement('canvas')
    gl = tela.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true, preserveDrawingBuffer: true })
    if (!gl) { perso = true; return false }
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x }
    prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; perso = true; return false }
    gl.useProgram(prog)
    const b = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, b)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const a = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
    for (const k of ['pelo', 'onda', 'fase', 'lampo', 'luce', 'px', 'chiaro', 'pieno', 'fondo', 'vuoto', 'schiuma', 'bolle'])
      posti[k] = gl.getUniformLocation(prog, k)
    tela.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; perso = true })
    return true
  } catch { gl = null; perso = true; return false }
}

export const pronto = () => accendi()

// disegna il globo `tipo` nel contesto 2D di destinazione, grande `lato` pixel veri
export function dipingi3d(ctx, lato, tipo, f) {
  if (!accendi()) return false
  if (tela.width !== lato) { tela.width = lato; tela.height = lato }
  gl.viewport(0, 0, lato, lato)
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
  const c = COLORI[tipo] || COLORI.vita
  gl.uniform1f(posti.pelo, f.pelo); gl.uniform1f(posti.onda, f.onda); gl.uniform1f(posti.fase, f.fase)
  gl.uniform1f(posti.lampo, f.lampo); gl.uniform1f(posti.luce, f.luce); gl.uniform1f(posti.px, 2 / lato)
  for (const k of ['chiaro', 'pieno', 'fondo', 'vuoto', 'schiuma']) gl.uniform3fv(posti[k], rgb(c[k]))
  const b = new Float32Array(40)
  f.bolle.slice(0, 10).forEach((x, i) => b.set([x.x, x.y, x.r, 0], i * 4))
  gl.uniform4fv(posti.bolle, b)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, lato, lato)
  ctx.drawImage(tela, 0, 0)
  return true
}
