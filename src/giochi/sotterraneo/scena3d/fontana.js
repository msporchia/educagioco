// La fonte del piano, modellata: vasca, piede, colonnina e coppa (forme di rotazione con la trama del pavimento), l'acqua in uno
// shader (increspature dai punti dove cadono le gocce, riflessi delle luci vicine), le gocce, una luce tenue che segue il livello.
// Lo stato è del motore (la fonte bevuta, `r.morto`): bevuta, un filo di gocce sale all'eroe e la fontana si svuota, e resta
// vuota (`svuota(true)` la fa già vuota, come rientrando da una sosta). Nell'inferno è una coppa di lava (scena3d/aspetti.js).
// Lo schema vale per ogni cosa di scena con due stati: `stato`, `luce` (una sorgente della riserva di scena3d/luci.js),
// `usa(chi)`, `svuota(subito)`, `aggiorna(dt, t, scala, vis)`. Fuori vista niente si muove e niente si emette.
import { LatheGeometry, CircleGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, ShaderMaterial, Points, BufferGeometry,
         BufferAttribute, DynamicDrawUsage, AdditiveBlending, DoubleSide, Vector2, Vector3, Color } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ACCESI } from './costanti.js'
import { GLSL_RUMORE, GLSL_LUCI } from './luci.js'
import { GLSL_MASCHERA } from './maschera.js'

const LIVELLO_PIENA = 0.2, LIVELLO_VUOTA = 0.075, ALTO_COPPA = 0.62
const GOCCE = 160, CERCHI = 6
const tornio = (punti, lati = 28) => new LatheGeometry(punti.map(([r, y]) => new Vector2(r, y)), lati)

export function creaFontana(scena, { cella, condivise, trama, conMaschera, maschera, aspetto, vuota = false }) {
  const gruppo = new Group()
  gruppo.position.set(cella.x + 0.5, 0, cella.y + 0.5)
  gruppo.scale.setScalar(1.45)   // alta quanto un ginocchio dell'eroe era un soprammobile
  scena.add(gruppo)
  const a = aspetto.acqua

  const pietra = conMaschera(new MeshStandardMaterial({ map: trama.map, normalMap: trama.normalMap, roughnessMap: trama.roughnessMap, color: 0xa89e92, roughness: 1, metalness: 0, normalScale: new Vector2(1.4, 1.4), side: DoubleSide }), maschera, { chiave: 'fontana' })
  const fondo = conMaschera(new MeshStandardMaterial({ map: trama.map, normalMap: trama.normalMap, color: 0x8a8278, roughness: 0.85 }), maschera, { chiave: 'fondo' })
  const geometrie = [
    tornio([[0, 0], [0.47, 0], [0.48, 0.05], [0.46, 0.08], [0.47, 0.2], [0.49, 0.23], [0.47, 0.26], [0.42, 0.26], [0.405, 0.22], [0.4, 0.07]]),
    tornio([[0.1, 0.06], [0.13, 0.09], [0.08, 0.14], [0.065, 0.3], [0.075, 0.42], [0.06, 0.5], [0.07, 0.54]]),
    tornio([[0.05, 0.53], [0.12, 0.55], [0.2, 0.6], [0.215, ALTO_COPPA + 0.02], [0.2, ALTO_COPPA + 0.03], [0.17, ALTO_COPPA - 0.01], [0.05, 0.58]]),
    new CircleGeometry(0.405, 28).rotateX(-Math.PI / 2).translate(0, 0.07, 0),
  ]
  // la bassa (`arredoFuso`): i tre torni della pietra in un pezzo, una chiamata invece di tre
  if (ACCESI.arredoFuso) { const torni = geometrie.slice(0, 3); geometrie.splice(0, 3, mergeGeometries(torni)); torni.forEach(g => g.dispose()) }
  geometrie.forEach((g, i) => { const me = new Mesh(g, i === geometrie.length - 1 ? fondo : pietra); me.castShadow = true; me.receiveShadow = true; gruppo.add(me) })

  // ── l'acqua: uno shader solo per la vasca, la coppa e il velo che cade ──
  const cerchi = Array.from({ length: CERCHI }, () => new Vector3(0, 0, -10))
  const uni = { ...condivise, ...maschera.uniforms, uT: { value: 0 }, uAlfa: { value: 1 }, uCerchi: { value: cerchi }, uCentro: { value: gruppo.position },
                uFondo: { value: new Vector3(...a.fondo) }, uChiaro: { value: new Vector3(...a.chiaro) }, uLava: { value: a.lava } }
  const acqua = cadente => new ShaderMaterial({
    uniforms: uni,
    vertexShader: /* glsl */`varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform float uT; uniform float uAlfa; uniform vec3 uCerchi[${CERCHI}]; uniform vec3 uCentro; uniform vec3 uFondo, uChiaro; uniform float uLava;
      ${GLSL_MASCHERA} varying vec3 vW; varying vec2 vUv;
      ${GLSL_RUMORE}${GLSL_LUCI}
      void main(){
        float vis = texture2D(uMaschera, vW.xz / uDimMappa).r;
        ${cadente ? `
        float s = fbm3(vec3(vUv.x * 18.0, vUv.y * 3.0 + uT * 4.0, 0.0));
        float a = smoothstep(0.35, 0.75, s) * (0.25 + 0.6 * vUv.y) * uAlfa;
        vec3 c = mix(uFondo, uChiaro, s) * (1.3 + uLava) + luceIn(vW) * 0.2 * s;
        gl_FragColor = vec4(c * vis, a * 0.8);` : `
        vec2 p = vW.xz - uCentro.xz;
        float h = 0.0;
        for (int i = 0; i < ${CERCHI}; i++) {
          float eta = uT - uCerchi[i].z; float d = length(p - uCerchi[i].xy);
          h += sin(d * 60.0 - eta * 14.0) * exp(-eta * 2.5) * exp(-abs(d - eta * 0.22) * 18.0);
        }
        h += (fbm3(vec3(p * 9.0, uT * 0.6)) - 0.5) * 0.6;
        vec3 n = normalize(vec3(dFdx(h), 0.08, dFdy(h)));
        float luccica = pow(clamp(1.0 - n.y * 0.95, 0.0, 1.0), 2.0);
        vec3 c = mix(uFondo, uChiaro, 0.12 + luccica * 1.1) * (1.0 + uLava * 1.2) + luceIn(vW) * (0.08 + luccica * 1.6);
        gl_FragColor = vec4(c * vis, (0.8 + luccica * 0.2) * uAlfa);`}
      }`,
    transparent: true, depthWrite: false, side: DoubleSide,
  })
  const matVasca = acqua(false), matVelo = acqua(true)
  const gPelo = new CircleGeometry(0.4, 32).rotateX(-Math.PI / 2), gCoppa = new CircleGeometry(0.17, 20).rotateX(-Math.PI / 2)
  const gVelo = new CylinderGeometry(0.205, 0.3, 1, 24, 1, true), gZamp = new CylinderGeometry(0.012, 0.03, 0.22, 8, 1, true)
  const pelo = new Mesh(gPelo, matVasca), peloCoppa = new Mesh(gCoppa, matVasca)
  peloCoppa.position.y = ALTO_COPPA - 0.005
  const velo = new Mesh(gVelo, matVelo), zampillo = new Mesh(gZamp, matVelo)
  zampillo.position.y = ALTO_COPPA + 0.1
  for (const o of [pelo, peloCoppa, velo, zampillo]) { o.renderOrder = 9; gruppo.add(o) }
  const gPozza = new CircleGeometry(1, 14).rotateX(-Math.PI / 2)
  const pozze = [[0.12, 0.08, 0.09], [-0.15, -0.05, 0.07], [0.02, -0.18, 0.05]].map(([x, z, r]) => {
    const p = new Mesh(gPozza, matVasca)
    p.scale.set(1.4 * r, 1, 0.8 * r); p.position.set(x, LIVELLO_VUOTA + 0.003, z); p.visible = false; p.renderOrder = 9
    gruppo.add(p); return p
  })
  geometrie.push(gPelo, gCoppa, gVelo, gZamp, gPozza)

  // ── le gocce: cadono dall'orlo della coppa, e quando toccano l'acqua fanno un cerchio ──
  const pos = new Float32Array(GOCCE * 3), vel = new Float32Array(GOCCE * 3), vita = new Float32Array(GOCCE), dim = new Float32Array(GOCCE)
  const geoG = new BufferGeometry()
  geoG.setAttribute('position', new BufferAttribute(pos, 3).setUsage(DynamicDrawUsage))
  geoG.setAttribute('dim', new BufferAttribute(dim, 1).setUsage(DynamicDrawUsage))
  const matG = new ShaderMaterial({
    uniforms: { uScala: { value: 400 }, uChiaro: uni.uChiaro },
    vertexShader: /* glsl */`attribute float dim; uniform float uScala; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uScala*dim / -mv.z; }`,
    fragmentShader: /* glsl */`uniform vec3 uChiaro; void main(){ float d = length(gl_PointCoord-0.5); gl_FragColor = vec4(uChiaro * smoothstep(0.5, 0.1, d) * 1.6, 1.0); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const gocce = new Points(geoG, matG); gocce.frustumCulled = false; gocce.renderOrder = 12
  gruppo.add(gocce)
  geometrie.push(geoG)
  let prossima = 0, prossimoCerchio = 0, vive = 0
  const goccia = (x, y, z, vx, vy, vz, v, d) => {
    const i = prossima; prossima = (prossima + 1) % GOCCE
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz; vita[i] = v; dim[i] = d
    vive = GOCCE
  }

  // ── la sua luce: una sorgente della riserva fissa (scena3d/luci.js), che segue il livello ──
  const luce = { pos: new Vector3(cella.x + 0.5, 0.65, cella.y + 0.57), colore: new Color(a.lava ? 0xff7a2a : 0x5ab8ff), forza: 0, vis: 0, raggio: 3.2, seme: 0, trema: false }
  let livello = LIVELLO_PIENA, getto = 1, svuota = 0, cura = null
  const f = {
    cella, gruppo, stato: 'piena', luce,
    usa(chi) { if (f.stato !== 'piena' || cura) return false; cura = { chi, t: 0 }; return true },
    svuota(subito = false) {
      if (f.stato === 'vuota') return
      f.stato = 'vuota'
      if (subito) { livello = LIVELLO_VUOTA; getto = 0; svuota = 0; for (const p of pozze) p.visible = true } else svuota = 0.001
    },
    aggiorna(dt, t, scala, vis = 1) {
      const vista = vis > 0.15
      luce.vis = vista ? vis : 0
      gocce.visible = vista
      if (!vista && !cura && svuota === 0) { pelo.visible = peloCoppa.visible = velo.visible = zampillo.visible = false; return }
      uni.uT.value = t
      matG.uniforms.uScala.value = scala
      if (cura) {
        cura.t += dt
        for (let k = 0; k < 3; k++) {
          const an = Math.random() * Math.PI * 2, r = Math.random() * 0.3
          const dx = cura.chi.x - gruppo.position.x, dz = cura.chi.z - gruppo.position.z
          goccia(Math.cos(an) * r, livello + 0.02, Math.sin(an) * r, dx * 1.1 + (Math.random() - 0.5), 2.2 + Math.random(), dz * 1.1 + (Math.random() - 0.5), 0.7, 0.07)
        }
        if (cura.t > 0.9) { cura = null; f.svuota() }
      }
      if (svuota > 0) {
        svuota += dt
        getto = Math.max(0, 1 - svuota / 0.8)
        livello = LIVELLO_PIENA + (LIVELLO_VUOTA - LIVELLO_PIENA) * Math.min(1, svuota / 2.6)
        if (svuota > 2.2) for (const p of pozze) p.visible = true
        if (svuota > 2.8) svuota = 0
      }
      pelo.position.y = livello
      const piena = (livello - LIVELLO_VUOTA) / (LIVELLO_PIENA - LIVELLO_VUOTA)
      pelo.visible = piena > 0.02
      pelo.scale.setScalar(0.9 + 0.1 * piena)
      peloCoppa.visible = velo.visible = zampillo.visible = getto > 0.01
      uni.uAlfa.value = getto
      const alto = ALTO_COPPA - livello
      velo.scale.y = Math.max(0.001, alto); velo.position.y = livello + alto / 2
      zampillo.scale.y = 0.8 + 0.12 * Math.sin(t * 9)
      luce.forza = f.stato === 'vuota' && svuota === 0 && !cura ? 0 : 1.6 * (0.25 + 0.75 * piena) * (0.9 + 0.1 * Math.sin(t * 3)) * (cura ? 1 + 3 * Math.sin(Math.min(1, cura.t / 0.9) * Math.PI) : 1)
      if (getto > 0.3 && vista && Math.random() < dt * 40) {
        const an = Math.random() * Math.PI * 2
        goccia(Math.cos(an) * 0.21, ALTO_COPPA, Math.sin(an) * 0.21, Math.cos(an) * 0.35, 0.2, Math.sin(an) * 0.35, 1.2, 0.035)
      }
      if (!vive) return
      let ancora = 0
      for (let i = 0; i < GOCCE; i++) {
        if (vita[i] <= 0) { if (dim[i]) dim[i] = 0; continue }
        ancora++
        vita[i] -= dt
        vel[i * 3 + 1] -= 9.8 * dt
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt
        const r = Math.hypot(pos[i * 3], pos[i * 3 + 2])
        if (pos[i * 3 + 1] < livello && vel[i * 3 + 1] < 0 && r < 0.4) {
          cerchi[prossimoCerchio].set(pos[i * 3] * gruppo.scale.x, pos[i * 3 + 2] * gruppo.scale.x, t)
          prossimoCerchio = (prossimoCerchio + 1) % CERCHI
          vita[i] = 0; dim[i] = 0
          if (Math.random() < 0.5) goccia(pos[i * 3], livello, pos[i * 3 + 2], (Math.random() - 0.5) * 0.6, 0.9, (Math.random() - 0.5) * 0.6, 0.18, 0.025)
        } else if (pos[i * 3 + 1] < 0) { vita[i] = 0; dim[i] = 0 }
      }
      if (!ancora) vive = 0
      geoG.attributes.position.needsUpdate = true; geoG.attributes.dim.needsUpdate = true
      fondo.roughness = f.stato === 'vuota' ? 0.3 : 0.85
    },
    via() { scena.remove(gruppo); geometrie.forEach(g => g.dispose()); [pietra, fondo, matVasca, matVelo, matG].forEach(m => m.dispose()) },
  }
  if (vuota) f.svuota(true)
  return f
}
