// Il portale in 3D: un varco IN PIEDI, non un bacino (l'utente, 16 ottobre 2026: «sembra dell'acqua magica in un pentolone
// di minestra»). Due pilastri e un architrave di pietra con le rune incise che si accendono, una soglia per terra, e dentro un
// velo ritto coi colori del portale vero (scena/portale.js: l'anello dal bianco al viola, il vortice scuro che gira al
// contrario) che si piega verso il centro e si increspa ai bordi; per terra davanti un cerchio di rune che pulsa, le scintille
// risucchiate dentro e la sua luce (una sorgente della riserva fissa). Vivo solo dove si vede adesso, nel ricordo la pietra
// ferma e spenta. `attraversa()` è il lampo del passaggio; chi passa lo disegna chi lo chiama. Lo stesso modulo fa il gemello
// di sopra (`colori`, `alto`, e `conMaschera` assente: pietra senza maschera). docs/sotterraneo/grafica-3d-portale.md
import { Group, Mesh, BoxGeometry, PlaneGeometry, CircleGeometry, MeshStandardMaterial, ShaderMaterial, Points, BufferGeometry,
         BufferAttribute, DynamicDrawUsage, AdditiveBlending, DoubleSide, Color, Vector3 } from 'three'
import { GLSL_RUMORE } from './luci.js'

export const COLORI_PORTALE = {
  anello: ['#f2f8ff', '#9be9ff', '#4fb4ff', '#6f7bff', '#b05cff', '#6f7bff', '#4fb4ff', '#9be9ff'],
  dentro: ['#2a1d72', '#3d2aa6', '#5a44d6'],
  luce: '#8a7bff', rune: '#9be9ff',
}
// le misure del varco, in celle: largo il vuoto fra i pilastri, alto fino all'architrave. Più alto dei muri (1,25): visto dalla
// telecamera a 52° un varco ritto si accorcia di cos 52°, e deve leggersi come una porta
export const VARCO = { largo: 0.8, alto: 1.9, pilastro: 0.17, profondo: 0.24 }
const SCINTILLE = 110

export function creaPortale(scena, { cella, conMaschera = null, maschera = null, trama = null, colori = COLORI_PORTALE, alto = VARCO.alto }) {
  const anello = colori.anello.map(c => new Color(c)), dentro = colori.dentro.map(c => new Color(c))
  const gruppo = new Group()
  gruppo.position.set(cella.x + 0.5, 0, cella.y + 0.5)
  scena.add(gruppo)
  const base = new MeshStandardMaterial({ map: trama ? trama.map : null, normalMap: trama ? trama.normalMap : null, color: 0xd2c8dc, emissive: 0x4a3f66, roughness: 0.9 })   // la pietra prende il chiarore del velo
  const pietra = conMaschera ? conMaschera(base, maschera, { chiave: 'portale' }) : base
  const { largo, pilastro: P, profondo: D } = VARCO
  const mx = largo / 2 + P / 2
  const geos = [
    new BoxGeometry(P, alto, D).translate(-mx, alto / 2, 0),                         // i pilastri
    new BoxGeometry(P, alto, D).translate(mx, alto / 2, 0),
    new BoxGeometry(largo + P * 2 + 0.12, 0.17, D + 0.06).translate(0, alto + 0.085, 0),   // l'architrave
    new BoxGeometry(largo + P * 2 + 0.2, 0.05, D + 0.34).translate(0, 0.025, 0.06),      // la soglia
    new BoxGeometry(P + 0.06, 0.1, D + 0.06).translate(-mx, 0.05, 0),                  // i piedi dei pilastri
    new BoxGeometry(P + 0.06, 0.1, D + 0.06).translate(mx, 0.05, 0),
  ]
  for (const g of geos) { const o = new Mesh(g, pietra); o.castShadow = true; o.receiveShadow = true; gruppo.add(o) }

  const uni = { uT: { value: 0 }, uVis: { value: 1 }, uLampo: { value: 0 }, uApre: { value: 1 },
                uAnello: { value: anello }, uDentro: { value: dentro }, uRune: { value: new Color(colori.rune) } }
  // le rune incise sulla faccia dei pilastri e dell'architrave: segni dal rumore su una griglia, che si accendono a onde
  const GLSL_RUNA = /* glsl */`
    float runa(vec2 q, float seme){
      vec2 c = floor(q), f = fract(q);
      float h = hash13(vec3(c, seme));
      vec2 g = abs(f - 0.5);
      float tratto = 0.0;
      if (h > 0.15) tratto = max(tratto, step(g.x, 0.07) * step(g.y, 0.36));                 // l'asta
      if (fract(h * 7.1) > 0.4) tratto = max(tratto, step(abs(f.y - fract(h * 3.3) * 0.6 - 0.2), 0.06) * step(g.x, 0.3));
      if (fract(h * 13.7) > 0.6) tratto = max(tratto, step(abs(f.x - f.y), 0.08) * step(g.y, 0.33));
      return tratto * step(0.08, f.y) * step(f.y, 0.92);
    }`
  const matRune = new ShaderMaterial({
    uniforms: uni,
    vertexShader: /* glsl */`varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`uniform float uT, uVis, uLampo, uApre; uniform vec3 uRune; varying vec2 vU; ${GLSL_RUMORE} ${GLSL_RUNA}
      void main(){
        float r = runa(vec2(vU.x * 1.0, vU.y * 9.0), 3.0);
        float onda = 0.55 + 0.45 * sin(vU.y * 9.0 - uT * 3.0);
        float su = step(vU.y, uApre * 1.05);   // aprendosi le rune si accendono dal basso
        gl_FragColor = vec4(uRune * r * onda * (1.6 + uLampo * 3.0) * uVis * su, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const gRune = [
    new PlaneGeometry(P * 0.55, alto * 0.86).translate(-mx, alto * 0.5, D / 2 + 0.004),
    new PlaneGeometry(P * 0.55, alto * 0.86).translate(mx, alto * 0.5, D / 2 + 0.004),
  ]
  const rune = gRune.map(g => { const o = new Mesh(g, matRune); o.renderOrder = 9; gruppo.add(o); return o })

  // il velo ritto: il vortice che si piega verso il centro e gira, i bordi increspati, l'anello di colori che corre sul bordo
  const gVelo = new PlaneGeometry(largo, alto).translate(0, alto / 2, 0)
  const matVelo = new ShaderMaterial({
    uniforms: uni,
    vertexShader: /* glsl */`varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`uniform float uT, uVis, uLampo, uApre; uniform vec3 uAnello[8]; uniform vec3 uDentro[3]; varying vec2 vU;
      ${GLSL_RUMORE}
      void main(){
        vec2 p = (vU - vec2(0.5, 0.5)) * vec2(${(largo / alto).toFixed(3)}, 1.0) * 2.0;
        float d = length(p), a = atan(p.y, p.x);
        // la spirale: l'angolo si torce con la distanza e col tempo, l'energia cade verso il centro
        float s = a + 3.2 / (d + 0.35) - uT * 1.8;
        float n = fbm3(vec3(cos(s) * 1.6, sin(s) * 1.6 + d * 2.0, uT * 0.4));
        float k = mod(s / 6.2832 * 3.0 + n * 1.5, 3.0); int i = int(floor(k)); vec3 c0 = uDentro[0];
        for (int j = 0; j < 3; j++) if (j == i) c0 = uDentro[j];
        vec3 c = c0 * (1.3 + 1.1 * n) + vec3(0.7, 0.6, 1.0) * pow(max(0.0, 1.0 - d * 1.4), 3.0) * 1.6;
        // il bordo: l'anello di colori che corre, increspato dal rumore
        vec2 b = min(vU, 1.0 - vU) * vec2(${(largo).toFixed(3)}, ${(alto).toFixed(3)});
        float bordo = min(b.x, b.y) + (rumore3(vec3(vU * 9.0, uT * 1.5)) - 0.5) * 0.05;
        float corre = mod((vU.x + vU.y) * 8.0 - uT * 2.4, 8.0); int ia = int(floor(corre)); vec3 ca = uAnello[0];
        for (int j = 0; j < 8; j++) if (j == ia) ca = uAnello[j];
        c = mix(c, ca * 2.1, 1.0 - smoothstep(0.015, 0.06, bordo));
        c += vec3(1.0, 0.95, 1.0) * uLampo * (1.2 - d * 0.6);
        float apre = smoothstep(uApre * 1.1 - 0.1, uApre * 1.1, vU.y);   // si accende dal basso
        float alfa = smoothstep(0.0, 0.02, bordo) * (1.0 - apre) * uVis;
        gl_FragColor = vec4(c * uVis, alfa);
      }`,
    transparent: true, depthWrite: false, side: DoubleSide,
  })
  const velo = new Mesh(gVelo, matVelo); velo.renderOrder = 9; gruppo.add(velo)

  // per terra davanti: un cerchio di rune che pulsa e un chiarore
  const gCerchio = new CircleGeometry(0.95, 48).rotateX(-Math.PI / 2).translate(0, 0.055, 0.55)
  const matCerchio = new ShaderMaterial({
    uniforms: uni,
    vertexShader: /* glsl */`varying vec2 vU; void main(){ vU = position.xz - vec2(0.0, 0.55); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`uniform float uT, uVis, uLampo, uApre; uniform vec3 uRune; varying vec2 vU; ${GLSL_RUMORE} ${GLSL_RUNA}
      void main(){
        float d = length(vU) / 0.95, a = atan(vU.y, vU.x);
        float chiaro = (1.0 - smoothstep(0.0, 1.0, d)) * 0.32;
        float giro = step(abs(d - 0.78), 0.11);
        float r = runa(vec2((a / 6.2832 + uT * 0.03) * 22.0, (d - 0.67) / 0.22), 7.0) * giro;
        float linee = (step(abs(d - 0.66), 0.012) + step(abs(d - 0.9), 0.012));
        float onda = 0.6 + 0.4 * sin(uT * 3.0 - d * 6.0);
        float disegna = step(fract(a / 6.2832 + 0.75), uApre);   // aprendosi le rune si disegnano in giro
        vec3 c = vec3(0.55, 0.45, 1.0) * chiaro * (1.0 + uLampo * 3.0) + uRune * (r * 1.4 + linee * 0.9) * onda * disegna;
        gl_FragColor = vec4(c * uVis, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const cerchio = new Mesh(gCerchio, matCerchio); cerchio.renderOrder = 8; gruppo.add(cerchio)

  // le scintille: salgono dal cerchio e dai lati e vengono risucchiate nel centro del varco
  const pos = new Float32Array(SCINTILLE * 3), col = new Float32Array(SCINTILLE * 3), fase = new Float32Array(SCINTILLE)
  for (let i = 0; i < SCINTILLE; i++) fase[i] = Math.random()
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(pos, 3).setUsage(DynamicDrawUsage))
  geo.setAttribute('color', new BufferAttribute(col, 3).setUsage(DynamicDrawUsage))
  const matP = new ShaderMaterial({
    uniforms: { uScala: { value: 400 } },
    vertexShader: /* glsl */`attribute vec3 color; uniform float uScala; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uScala*0.05 / -mv.z; }`,
    fragmentShader: /* glsl */`varying vec3 vC; void main(){ float d = length(gl_PointCoord-0.5); gl_FragColor = vec4(vC*smoothstep(0.5,0.1,d), 1.0); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const punti = new Points(geo, matP); punti.frustumCulled = false; punti.renderOrder = 12; gruppo.add(punti)

  const luce = { pos: new Vector3(cella.x + 0.5, 0.9, cella.y + 1.0), colore: new Color(colori.luce), forza: 0, vis: 0, raggio: 5, seme: 0, trema: false }
  let lampo = 0, passa = 0, apre = 1, chiude = 0
  const cy = alto / 2
  return {
    gruppo, cella, luce,
    attraversa() { passa = 1; lampo = 1 },
    // il varco che si accende dal basso (le rune per terra si disegnano in giro), o si spegne dall'alto
    apri() { apre = 0; chiude = 0 },
    chiudi() { chiude = 1 },
    get aperto() { return apre >= 1 && !chiude },
    aggiorna(dt, t, scala, vis = 1) {
      const vivo = vis > 0.15
      velo.visible = cerchio.visible = punti.visible = rune[0].visible = rune[1].visible = vivo
      luce.vis = vivo ? vis : 0
      if (!vivo) return
      lampo = Math.max(0, lampo - dt * 1.6); passa = Math.max(0, passa - dt)
      apre = Math.min(1, apre + dt * 0.8)
      if (chiude) chiude = Math.min(2, chiude + dt * 0.8)
      const q = chiude ? Math.max(0, 2 - chiude) : apre
      uni.uT.value = t; uni.uVis.value = Math.min(1, vis * 1.4); uni.uLampo.value = lampo; uni.uApre.value = q
      luce.forza = (2.8 + 0.6 * Math.sin(t * 3)) * q + lampo * 14 + passa * 4
      velo.scale.set(1 + lampo * 0.08, 1, 1)
      matP.uniforms.uScala.value = scala
      for (let i = 0; i < SCINTILLE; i++) {
        const f = (fase[i] + t * (0.22 + (i % 5) * 0.03)) % 1
        const a = i * 2.399 + t * (1.1 + (i % 3) * 0.4), r = 0.95 * (1 - f) * (1 - f) + 0.03
        // da fuori (davanti e attorno, anche dal cerchio per terra) dentro il centro del varco, girando
        pos[i * 3] = Math.cos(a) * r * 0.85
        pos[i * 3 + 1] = cy + Math.sin(a) * r * (alto / largo) * 0.55 - (1 - f) * (i % 2 ? 0.35 : 0)
        pos[i * 3 + 2] = 0.02 + (1 - f) * (i % 2 ? 0.7 : 0.25)
        const c = anello[i % 8], k = 2.2 * Math.sin(f * Math.PI) * q
        col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true
    },
    via() { scena.remove(gruppo); [...geos, ...gRune, gVelo, gCerchio, geo].forEach(g => g.dispose()); [pietra, matRune, matVelo, matCerchio, matP].forEach(m => m.dispose()) },
  }
}
