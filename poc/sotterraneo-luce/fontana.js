// La fontana modellata: un oggetto di scena in 3D, non uno sprite. Lo schema è quello che servirebbe
// a ogni cosa di scena (altare, statua, pozzo): un descrittore con
//   cella, stato ('piena' | 'vuota'), luce (colore e forza, che segue lo stato), ombra (la pietra la fa),
//   usa(chi) (il gesto del bambino), svuota(subito) (il passaggio di stato, animato o no),
//   aggiorna(dt, t) (le animazioni, senza allocare niente a fotogramma).
// La pietra sono forme di rotazione (LatheGeometry) con la trama del pavimento; l'acqua sono dischi e un
// cilindro aperto con uno shader (increspature, riflessi delle luci, trasparenza); le gocce un Points suo.
import * as THREE from 'three'
import { GLSL_RUMORE, GLSL_LUCI } from './effetti.js'

const LIVELLO_PIENA = 0.2, LIVELLO_VUOTA = 0.075, ALTO_COPPA = 0.62
const GOCCE = 160, CERCHI = 6

// un profilo (raggio, altezza) dal basso in alto, girato attorno all'asse
const tornio = (punti, lati = 28) => new THREE.LatheGeometry(punti.map(([r, y]) => new THREE.Vector2(r, y)), lati)

export function creaFontana ({ scena, cella, luci, trama, conMaschera, maschera, vuota = false }) {
  const gruppo = new THREE.Group()
  gruppo.position.set(cella.x + 0.5, 0, cella.y + 0.5)
  gruppo.scale.setScalar(1.45)   // sborda un poco sulle celle accanto: una fontana alta quanto un ginocchio dell'eroe era un soprammobile
  scena.add(gruppo)

  // ── la pietra: vasca, piede, colonnina, coppa ──
  const pietra = conMaschera(new THREE.MeshStandardMaterial({
    map: trama.map, normalMap: trama.normalMap, roughnessMap: trama.roughnessMap, color: 0xa89e92, roughness: 1, metalness: 0,
    normalScale: new THREE.Vector2(1.4, 1.4), side: THREE.DoubleSide,
  }), maschera)
  // il fondo della vasca: bagnato quando c'è stata l'acqua (più scuro e lucido), e lo resta
  const fondo = conMaschera(new THREE.MeshStandardMaterial({ map: trama.map, normalMap: trama.normalMap, color: 0x8a8278, roughness: 0.85 }), maschera)
  const pezzi = [
    [tornio([[0, 0], [0.47, 0], [0.48, 0.05], [0.46, 0.08], [0.47, 0.2], [0.49, 0.23], [0.47, 0.26], [0.42, 0.26], [0.405, 0.22], [0.4, 0.07]]), pietra],
    [tornio([[0.1, 0.06], [0.13, 0.09], [0.08, 0.14], [0.065, 0.3], [0.075, 0.42], [0.06, 0.5], [0.07, 0.54]]), pietra],
    [tornio([[0.05, 0.53], [0.12, 0.55], [0.2, 0.6], [0.215, ALTO_COPPA + 0.02], [0.2, ALTO_COPPA + 0.03], [0.17, ALTO_COPPA - 0.01], [0.05, 0.58]]), pietra],
    [new THREE.CircleGeometry(0.405, 28).rotateX(-Math.PI / 2).translate(0, 0.07, 0), fondo],
  ]
  for (const [g, mat] of pezzi) {
    const me = new THREE.Mesh(g, mat); me.castShadow = true; me.receiveShadow = true; gruppo.add(me)
  }

  // ── l'acqua: uno shader solo, per la vasca, la coppa e il velo che cade ──
  const cerchi = Array.from({ length: CERCHI }, () => new THREE.Vector3(0, 0, -10))   // x, z, tempo di nascita
  const uniAcqua = {
    ...luci, ...maschera.uniforms, uT: { value: 0 }, uAlfa: { value: 1 }, uCerchi: { value: cerchi }, uCentro: { value: gruppo.position },
  }
  const acqua = (cadente) => new THREE.ShaderMaterial({
    uniforms: uniAcqua,
    vertexShader: /* glsl */`varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform float uT; uniform float uAlfa; uniform vec3 uCerchi[${CERCHI}]; uniform vec3 uCentro;
      uniform sampler2D uMaschera; uniform vec2 uDimMappa; varying vec3 vW; varying vec2 vUv;
      ${GLSL_RUMORE}${GLSL_LUCI}
      void main(){
        vec3 base = vec3(0.04, 0.14, 0.2), chiaro = vec3(0.35, 0.75, 0.95);
        float vis = texture2D(uMaschera, vW.xz / uDimMappa).r;
        ${cadente ? `
        // il velo che cade: strisce che scorrono in giù, più rade in basso
        float s = fbm3(vec3(vUv.x * 18.0, vUv.y * 3.0 + uT * 4.0, 0.0));
        float a = smoothstep(0.35, 0.75, s) * (0.25 + 0.6 * vUv.y) * uAlfa;
        vec3 c = mix(base, chiaro, s) * 1.3 + luceIn(vW) * 0.2 * s;
        gl_FragColor = vec4(c * vis, a * 0.8);` : `
        // la superficie: increspature dai punti dove cadono le gocce, più un'onda lenta
        vec2 p = vW.xz - uCentro.xz;
        float h = 0.0;
        for (int i = 0; i < ${CERCHI}; i++) {
          float eta = uT - uCerchi[i].z; float d = length(p - uCerchi[i].xy);
          h += sin(d * 60.0 - eta * 14.0) * exp(-eta * 2.5) * exp(-abs(d - eta * 0.22) * 18.0);
        }
        h += (fbm3(vec3(p * 9.0, uT * 0.6)) - 0.5) * 0.6;
        vec3 n = normalize(vec3(dFdx(h), 0.08, dFdy(h)));
        float luccica = pow(clamp(1.0 - n.y * 0.95, 0.0, 1.0), 2.0);
        vec3 c = mix(base, chiaro, 0.12 + luccica * 1.1) + luceIn(vW) * (0.08 + luccica * 1.6);
        gl_FragColor = vec4(c * vis, (0.8 + luccica * 0.2) * uAlfa);`}
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  })
  const matVasca = acqua(false), matVelo = acqua(true)
  const pelo = new THREE.Mesh(new THREE.CircleGeometry(0.4, 32).rotateX(-Math.PI / 2), matVasca)
  const peloCoppa = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20).rotateX(-Math.PI / 2), matVasca)
  peloCoppa.position.y = ALTO_COPPA - 0.005
  const velo = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.3, 1, 24, 1, true), matVelo)   // altezza 1: la scala la mette a misura
  const zampillo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 0.22, 8, 1, true), matVelo)
  zampillo.position.y = ALTO_COPPA + 0.1
  for (const o of [pelo, peloCoppa, velo, zampillo]) { o.renderOrder = 9; gruppo.add(o) }
  // le pozze che restano quando la vasca è vuota: dischi schiacciati, a caso ma sempre gli stessi
  const pozze = [[0.12, 0.08, 0.09], [-0.15, -0.05, 0.07], [0.02, -0.18, 0.05]].map(([x, z, r]) => {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 14).rotateX(-Math.PI / 2), matVasca)
    p.scale.set(1.4, 1, 0.8); p.position.set(x, LIVELLO_VUOTA + 0.003, z); p.visible = false; p.renderOrder = 9
    gruppo.add(p); return p
  })

  // ── le gocce: cadono dall'orlo della coppa, e quando toccano l'acqua fanno un cerchio ──
  const pos = new Float32Array(GOCCE * 3), vel = new Float32Array(GOCCE * 3), vita = new Float32Array(GOCCE), dim = new Float32Array(GOCCE)
  const geoG = new THREE.BufferGeometry()
  geoG.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
  geoG.setAttribute('dim', new THREE.BufferAttribute(dim, 1).setUsage(THREE.DynamicDrawUsage))
  const matG = new THREE.ShaderMaterial({
    uniforms: { uScala: { value: 400 } },
    vertexShader: /* glsl */`attribute float dim; uniform float uScala; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uScala*dim / -mv.z; }`,
    fragmentShader: /* glsl */`void main(){ float d = length(gl_PointCoord-0.5); gl_FragColor = vec4(vec3(0.6, 0.9, 1.0) * smoothstep(0.5, 0.1, d) * 1.4, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const gocce = new THREE.Points(geoG, matG); gocce.frustumCulled = false; gocce.renderOrder = 12
  gruppo.add(gocce)
  let prossima = 0, prossimoCerchio = 0, tOra = 0
  const goccia = (x, y, z, vx, vy, vz, v, d) => {
    const i = prossima; prossima = (prossima + 1) % GOCCE
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz; vita[i] = v; dim[i] = d
  }

  // ── la luce dell'acqua: azzurra, tenue, si spegne con lei ──
  const luce = new THREE.PointLight(0x5ab8ff, 0, 3.2, 1.4)
  luce.position.set(0, 0.45, 0.05)
  gruppo.add(luce)

  // ── lo stato ──
  let livello = LIVELLO_PIENA, getto = 1, svuota = 0   // svuota: 0 ferma, >0 in corso (secondi passati)
  let cura = null                                      // { verso: Vector3, t } mentre l'acqua va all'eroe
  const f = {
    id: 'fontana', cella, gruppo, stato: 'piena',
    luce: { colore: 0x5ab8ff, forza: 1.6 }, ombra: true,
    // il gesto: l'acqua sale verso chi la usa, e poi la fontana si svuota (una volta sola)
    usa (chi) {
      if (f.stato !== 'piena' || cura) return false
      cura = { chi, t: 0 }
      return true
    },
    // ripristina: piena come prima (solo per il pannello di prova: nel gioco una fonte bevuta resta secca)
    riempi () {
      f.stato = 'piena'; livello = LIVELLO_PIENA; getto = 1; svuota = 0; cura = null
      for (const p of pozze) p.visible = false
    },
    svuota (subito = false) {
      if (f.stato === 'vuota') return
      f.stato = 'vuota'
      if (subito) { livello = LIVELLO_VUOTA; getto = 0; svuota = 0; for (const p of pozze) p.visible = true } else svuota = 0.001
    },
    // `vis`: quanto si vede adesso la sua cella (la maschera). Fuori vista l'acqua non c'è e niente si muove: nel ricordo
    // resta la pietra ferma e spenta; nel mai visto la maschera la tiene nera
    aggiorna (dt, t, scala, vis = 1) {
      const vista = vis > 0.15
      gocce.visible = vista
      if (!vista && !cura && svuota === 0) {
        pelo.visible = peloCoppa.visible = velo.visible = zampillo.visible = false
        luce.intensity = 0
        return
      }
      tOra = t
      uniAcqua.uT.value = t
      matG.uniforms.uScala.value = scala
      if (cura) {
        cura.t += dt
        // un filo di gocce chiare che va dalla vasca all'eroe
        for (let k = 0; k < 3; k++) {
          const a = Math.random() * Math.PI * 2, r = Math.random() * 0.3
          const dx = cura.chi.x - gruppo.position.x, dz = cura.chi.z - gruppo.position.z
          goccia(Math.cos(a) * r, livello + 0.02, Math.sin(a) * r, dx * 1.6 + (Math.random() - 0.5), 2.2 + Math.random(), dz * 1.6 + (Math.random() - 0.5), 0.7, 0.07)
        }
        luce.intensity = f.luce.forza * (1 + 3 * Math.sin(Math.min(1, cura.t / 0.9) * Math.PI))
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
      pelo.scale.setScalar(0.9 + 0.1 * piena)   // la vasca si stringe in basso: il pelo dell'acqua anche
      peloCoppa.visible = velo.visible = zampillo.visible = getto > 0.01
      matVelo.uniforms.uAlfa.value = getto
      // il velo va dall'orlo della coppa al pelo dell'acqua
      const alto = ALTO_COPPA - livello
      velo.scale.y = alto; velo.position.y = livello + alto / 2
      zampillo.scale.y = 0.6 + 0.4 * Math.sin(t * 9) * 0.3 + 0.4
      if (!cura) luce.intensity = f.luce.forza * (0.25 + 0.75 * piena) * (0.9 + 0.1 * Math.sin(t * 3))
      if (f.stato === 'vuota' && svuota === 0 && !cura) luce.intensity = 0
      // gocce dall'orlo della coppa
      luce.intensity *= Math.min(1, vis * 1.5)
      if (getto > 0.3 && vista && Math.random() < dt * 40) {
        const a = Math.random() * Math.PI * 2
        goccia(Math.cos(a) * 0.21, ALTO_COPPA, Math.sin(a) * 0.21, Math.cos(a) * 0.35, 0.2, Math.sin(a) * 0.35, 1.2, 0.035)
      }
      for (let i = 0; i < GOCCE; i++) {
        if (vita[i] <= 0) { if (dim[i]) dim[i] = 0; continue }
        vita[i] -= dt
        vel[i * 3 + 1] -= 9.8 * dt
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt
        const r = Math.hypot(pos[i * 3], pos[i * 3 + 2])
        if (pos[i * 3 + 1] < livello && vel[i * 3 + 1] < 0 && r < 0.4) {
          // tocca l'acqua: un cerchio (al posto del più vecchio) e uno spruzzo piccolo
          cerchi[prossimoCerchio].set(pos[i * 3] * gruppo.scale.x, pos[i * 3 + 2] * gruppo.scale.x, tOra)   // lo shader conta nel mondo; prossimoCerchio = (prossimoCerchio + 1) % CERCHI
          vita[i] = 0; dim[i] = 0
          if (Math.random() < 0.5) goccia(pos[i * 3], livello, pos[i * 3 + 2], (Math.random() - 0.5) * 0.6, 0.9, (Math.random() - 0.5) * 0.6, 0.18, 0.025)
        } else if (pos[i * 3 + 1] < 0) { vita[i] = 0; dim[i] = 0 }
      }
      geoG.attributes.position.needsUpdate = true; geoG.attributes.dim.needsUpdate = true
      // il fondo resta bagnato: più scuro e lucido dove l'acqua è stata
      fondo.roughness = f.stato === 'vuota' ? 0.3 : 0.85
    },
  }
  if (vuota) f.svuota(true)
  return f
}
