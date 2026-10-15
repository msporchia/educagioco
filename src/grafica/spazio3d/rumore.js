// Il caso del cielo in 3D: un rumore liscio per le forme (in JS, una volta per geometria)
// e lo stesso in GLSL per gli shader. Tutto col seme: niente Math.random nelle forme.

const frac = x => x - Math.floor(x)
const hash = (x, y, z) => frac(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453)
export const liscio = t => t * t * (3 - 2 * t)
export const lerp = (a, b, t) => a + (b - a) * t
export const stringi = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))

export function rumore(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const u = liscio(x - xi), v = liscio(y - yi), w = liscio(z - zi)
  return lerp(
    lerp(lerp(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), lerp(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
    lerp(lerp(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), lerp(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w)
}

export function fbm(x, y, z, ott = 4) {
  let s = 0, a = 0.5, f = 1
  for (let i = 0; i < ott; i++) { s += a * rumore(x * f, y * f, z * f); f *= 2.03; a *= 0.5 }
  return s
}

// mulberry32, come grafica/cieli.js
export function seme(n) {
  let a = n >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// una direzione a caso sulla sfera, dal generatore col seme
export function direzione(r, v) {
  const z = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z)
  return v.set(Math.cos(a) * s, Math.sin(a) * s, z)
}

// '#rrggbb' → [r, g, b] da 0 a 1, in una cache: i colori della view sono stringhe
const TINTE = new Map()
export function rgb(c) {
  let t = TINTE.get(c)
  if (!t) {
    const h = typeof c === 'string' && c[0] === '#' ? c : '#ffffff'
    const k = h.length === 4 ? h.slice(1).split('').map(x => x + x).join('') : h.slice(1, 7)
    t = [0, 2, 4].map(i => parseInt(k.slice(i, i + 2), 16) / 255)
    TINTE.set(c, t)
  }
  return t
}

export const GLSL_RUMORE = /* glsl */`
float h3(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm3(vec3 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n3(p); p=p*2.02+vec3(3.1,1.7,2.3); a*=.5; } return s; }
float fbm4(vec3 p){ float s=0., a=.5; for(int i=0;i<4;i++){ s+=a*n3(p); p=p*2.02+vec3(3.1,1.7,2.3); a*=.5; } return s; }
`
