// Le luci: la torcia dell'eroe (un alone corto senza ombre e un cono lungo che le fa, una passata sola), una riserva FISSA di
// luci puntiformi che si danno ai fuochi più vicini che si vedono adesso (torce, bracieri, la fonte, il portale), il lampo dei
// colpi, la luce delle magie e quella del palco. Il numero di luci non cambia mai: se cambiasse, three ricompilerebbe gli shader.
// Nebbia, polvere e acqua sommano a mano le stesse luci (`condivise`), senza passare dal sistema di three.
import { HemisphereLight, PointLight, SpotLight, Vector3, Color } from 'three'
import { N_FUOCHI, MAX_LUCI, LUCE, ACCESI } from './costanti.js'

export const GLSL_RUMORE = /* glsl */`
float hash13(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float rumore3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash13(i),hash13(i+vec3(1,0,0)),f.x), mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x), mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y), f.z); }
float fbm3(vec3 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*rumore3(p); p*=2.03; a*=0.5; } return s; }
`
export const GLSL_LUCI = /* glsl */`
uniform vec3 uLp[${MAX_LUCI}]; uniform vec3 uLc[${MAX_LUCI}]; uniform int uLn;
uniform vec3 uConoP; uniform vec3 uConoD; uniform vec3 uConoC;
vec3 luceIn(vec3 w){
  vec3 acc = vec3(0.0);
  for (int i = 0; i < ${MAX_LUCI}; i++) { if (i >= uLn) break; vec3 d = uLp[i]-w; acc += uLc[i] / (1.0 + dot(d,d)*1.6); }
  vec3 dc = w - uConoP; float dist = length(dc);
  float c = dot(dc/max(dist,1e-3), uConoD);
  acc += uConoC * smoothstep(0.25, 0.8, c) / (1.0 + dist*dist*0.12);
  return acc;
}
`

export function creaLuci(scena, aspetto) {
  const condivise = {
    uLp: { value: Array.from({ length: MAX_LUCI }, () => new Vector3()) },
    uLc: { value: Array.from({ length: MAX_LUCI }, () => new Vector3()) },
    uLn: { value: 0 },
    uConoP: { value: new Vector3() }, uConoD: { value: new Vector3(0, 0, -1) }, uConoC: { value: new Vector3(1, 0.6, 0.3) },
  }
  const cielo = new HemisphereLight(aspetto.cielo, aspetto.terra, LUCE.ambiente * aspetto.ambiente)
  const alone = new PointLight(0xffb070, LUCE.alone, 10, 1.0)
  const cono = new SpotLight(0xffc488, LUCE.cono, 17, 1.12, 0.8, 1.3)
  cono.castShadow = ACCESI.ombre
  cono.shadow.intensity = LUCE.ombra; cono.shadow.radius = 3; cono.shadow.mapSize.set(1024, 1024)
  cono.shadow.bias = -0.0015; cono.shadow.normalBias = 0.03; cono.shadow.camera.near = 0.1
  const lampo = new PointLight(0xfff0d0, 0, 5, 1.5)
  const magia = new PointLight(0xffffff, 0, 4, 1.5)
  const palco = new PointLight(0xffe0bc, 0, 14, 1.0)
  const fuochi = Array.from({ length: N_FUOCHI }, () => new PointLight(0xff8a3c, 0, 7, 1.7))
  scena.add(cielo, alone, cono, cono.target, lampo, magia, palco, ...fuochi)
  const tinta = new Color(), base = new Color(0xffc488), tmp = new Vector3()

  return {
    condivise, alone, cono, lampo, magia, palco, cielo,
    tinta, tTinta: 0,
    // le cose che fanno luce: { pos: Vector3, colore: Color, forza, vis (0..1, quanto si vede adesso), d (distanza²) }
    // si riempie una volta per piano; ogni fotogramma la riserva va alle più vicine che si vedono
    aspetto(a) { cielo.color.set(a.cielo); cielo.groundColor.set(a.terra); cielo.intensity = LUCE.ambiente * a.ambiente },
    distribuisci(sorgenti, ex, ez, t) {
      condivise.uLn.value = 0
      for (const s of sorgenti) s.d = s.vis > 0.2 ? (s.pos.x - ex) ** 2 + (s.pos.z - ez) ** 2 : Infinity
      sorgenti.sort((a, b) => a.d - b.d)
      for (let i = 0; i < fuochi.length; i++) {
        const l = fuochi[i], s = sorgenti[i]
        if (!s || s.d === Infinity) { l.intensity = 0; continue }
        const tr = s.trema ? 0.82 + 0.1 * Math.sin(t * 9.3 + s.seme) + 0.06 * Math.sin(t * 23.7 + s.seme * 2) + 0.05 * Math.sin(t * 41 + s.seme * 3) : 1
        l.position.copy(s.pos)
        if (s.trema) { l.position.x += Math.sin(t * 13 + s.seme) * 0.03; l.position.y += Math.sin(t * 17 + s.seme) * 0.03 }
        l.color.copy(s.colore)
        l.distance = s.raggio || 7
        l.intensity = s.forza * tr * Math.min(1, s.vis * 1.5)
        this.aggiungi(l.position, l.color, 0.22 * tr * (s.forza / 4.5) * s.vis)
      }
    },
    // una luce in più per nebbia, polvere e acqua (che non passano da three)
    aggiungi(p, c, i) {
      const k = condivise.uLn.value; if (k >= MAX_LUCI) return
      condivise.uLp.value[k].copy(p); condivise.uLc.value[k].set(c.r * i, c.g * i, c.b * i); condivise.uLn.value++
    },
    // la torcia dell'eroe: alone e cono nel punto (x, z), girati verso (vx, vz); il colore del colpo finché dura
    torcia(x, z, vx, vz, t, dt) {
      const tremo = 1 + Math.sin(t * 23) * 0.03 + Math.sin(t * 37.1) * 0.03
      this.tTinta = Math.max(0, this.tTinta - dt)
      cono.color.copy(base).lerp(tinta, Math.min(1, this.tTinta * 3)); alone.color.copy(cono.color)
      alone.position.set(x + vx * 0.3, 1.45, z + vz * 0.3 - 0.1); alone.intensity = LUCE.alone * tremo
      cono.position.set(x, 1.15, z); cono.target.position.set(x + vx * 4, 0, z + vz * 4); cono.intensity = LUCE.cono * tremo
      this.aggiungi(alone.position, alone.color, 0.3 * tremo)
      condivise.uConoP.value.copy(cono.position)
      condivise.uConoD.value.copy(tmp.copy(cono.target.position).sub(cono.position).normalize())
      condivise.uConoC.value.set(1.0, 0.72, 0.42).multiplyScalar(0.5 * tremo)
    },
    // il lampo e la magia si spengono da sé
    spegni(dt) {
      lampo.intensity *= Math.exp(-14 * dt); magia.intensity *= Math.exp(-6 * dt)
      if (lampo.intensity > 0.3) this.aggiungi(lampo.position, lampo.color, lampo.intensity * 0.02)
    },
  }
}
