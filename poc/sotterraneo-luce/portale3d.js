// Il portale in 3D: dove il motore lo mette (la roba `portale` del piano), coi colori del portale vero (scena/portale.js:
// l'anello che gira dal bianco al viola, il vortice scuro dentro che gira al contrario). Un ovale di pietra ritto, il velo
// del vortice in uno shader, la sua luce, le scintille che ci entrano. Come la fontana: vivo solo dove si vede adesso,
// nel ricordo la pietra ferma e spenta. `attraversa()` è il passaggio dell'eroe (bagliore, lampo, l'eroe che svanisce).
import * as THREE from 'three'

const ANELLO = ['#f2f8ff', '#9be9ff', '#4fb4ff', '#6f7bff', '#b05cff', '#6f7bff', '#4fb4ff', '#9be9ff'].map(c => new THREE.Color(c))
const DENTRO = ['#2a1d72', '#3d2aa6', '#5a44d6'].map(c => new THREE.Color(c))
const OVALE = 1.5          // l'ovale è alto una volta e mezza quanto è largo (PORTALE.ry / rx)
const SCINTILLE = 90

export function creaPortale ({ scena, cella, conMaschera, maschera, trama }) {
  const gruppo = new THREE.Group()
  gruppo.position.set(cella.x + 0.5, 0, cella.y + 0.5)
  scena.add(gruppo)

  // la pietra: un anello ovale e una base, che fanno ombra e prendono la torcia
  const pietra = conMaschera(new THREE.MeshStandardMaterial({ map: trama.map, normalMap: trama.normalMap, color: 0x8e8a9c, roughness: 0.9 }), maschera)
  const anello = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.075, 10, 40).scale(1, OVALE, 1).translate(0, 0.72, 0), pietra)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.1, 24).translate(0, 0.05, 0), pietra)
  for (const o of [anello, base]) { o.castShadow = true; o.receiveShadow = true; gruppo.add(o) }

  // il velo: l'anello di luce che gira e il vortice dentro, come lo dipinge il gioco (otto spicchi, tre viola)
  const uni = { uT: { value: 0 }, uVis: { value: 1 }, uLampo: { value: 0 },
    uAnello: { value: ANELLO }, uDentro: { value: DENTRO } }
  const velo = new THREE.Mesh(new THREE.CircleGeometry(0.4, 48).scale(1, OVALE, 1).translate(0, 0.72, 0.005), new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: /* glsl */`varying vec2 vP; void main(){ vP = position.xy - vec2(0.0, 0.72); vP.y /= ${OVALE.toFixed(2)}; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uT, uVis, uLampo; uniform vec3 uAnello[8]; uniform vec3 uDentro[3]; varying vec2 vP;
      void main(){
        float d = length(vP) / 0.4, a = atan(vP.y, vP.x);
        vec3 c;
        if (d > 0.74) {
          float k = mod(a / 6.2832 * 8.0 + uT * 2.4, 8.0);
          int i = int(floor(k)); vec3 c0 = uAnello[0];
          for (int j = 0; j < 8; j++) if (j == i) c0 = uAnello[j];
          c = c0 * 2.2;
        } else {
          float s = a / 6.2832 * 3.0 - uT * 1.6 + d * 4.0;
          float k = mod(s, 3.0); int i = int(floor(k)); vec3 c0 = uDentro[0];
          for (int j = 0; j < 3; j++) if (j == i) c0 = uDentro[j];
          c = c0 * (1.4 + 0.8 * (1.0 - d)) + vec3(0.6, 0.5, 1.0) * pow(1.0 - d, 3.0);
        }
        c += vec3(1.0, 0.95, 1.0) * uLampo;
        gl_FragColor = vec4(c * uVis, smoothstep(1.0, 0.96, d) * uVis);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }))
  velo.renderOrder = 9
  gruppo.add(velo)
  // il bagliore per terra: un disco morbido sotto l'ovale
  const pozza = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32).rotateX(-Math.PI / 2).translate(0, 0.012, 0.15), new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: /* glsl */`varying vec2 vU; void main(){ vU = position.xz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`uniform float uT, uVis, uLampo; varying vec2 vU;
      void main(){ float d = length(vU) / 0.9; float a = (1.0 - smoothstep(0.0, 1.0, d)) * (0.35 + 0.08 * sin(uT * 3.0)) * uVis;
        gl_FragColor = vec4(vec3(0.55, 0.45, 1.0) * a * (1.0 + uLampo * 3.0), 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }))
  pozza.renderOrder = 8
  gruppo.add(pozza)

  // la sua luce: viola-azzurra, che pulsa; illumina il pavimento e i muri vicini
  const luce = new THREE.PointLight(0x8a7bff, 0, 4.5, 1.4)
  luce.position.set(0, 0.8, 0.4)
  gruppo.add(luce)

  // le scintille che girano verso il centro e ci spariscono dentro
  const pos = new Float32Array(SCINTILLE * 3), col = new Float32Array(SCINTILLE * 3), fase = new Float32Array(SCINTILLE)
  for (let i = 0; i < SCINTILLE; i++) fase[i] = Math.random()
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage))
  const punti = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: { uScala: { value: 400 } },
    vertexShader: /* glsl */`attribute vec3 color; uniform float uScala; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uScala*0.05 / -mv.z; }`,
    fragmentShader: /* glsl */`varying vec3 vC; void main(){ float d = length(gl_PointCoord-0.5); gl_FragColor = vec4(vC*smoothstep(0.5,0.1,d), 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }))
  punti.frustumCulled = false; punti.renderOrder = 12
  gruppo.add(punti)

  let lampo = 0, passa = 0
  return {
    gruppo, cella,
    // il passaggio: il velo si accende e lampeggia; chi passa lo disegna chi lo chiama (main.js)
    attraversa () { passa = 1; lampo = 1 },
    // `vis`: quanto si vede adesso la sua cella. Fuori vista niente si muove e niente fa luce
    aggiorna (dt, t, scala, vis = 1) {
      const vivo = vis > 0.15
      velo.visible = pozza.visible = punti.visible = vivo
      if (!vivo) { luce.intensity = 0; return }
      lampo = Math.max(0, lampo - dt * 1.6); passa = Math.max(0, passa - dt)
      uni.uT.value = t; uni.uVis.value = Math.min(1, vis * 1.4); uni.uLampo.value = lampo
      luce.intensity = (2.6 + 0.6 * Math.sin(t * 3) + lampo * 14 + passa * 4) * Math.min(1, vis * 1.4)
      velo.scale.setScalar(1 + lampo * 0.15)
      punti.material.uniforms.uScala.value = scala
      for (let i = 0; i < SCINTILLE; i++) {
        let f = (fase[i] + t * (0.25 + (i % 5) * 0.03)) % 1   // da fuori (0) a dentro (1)
        const a = i * 2.399 + t * (1.2 + (i % 3) * 0.4), r = 0.75 * (1 - f) + 0.05
        pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 0.72 + Math.sin(a) * r * OVALE * 0.8; pos[i * 3 + 2] = 0.05 + (1 - f) * 0.25
        const c = ANELLO[i % 8], k = 2.2 * Math.sin(f * Math.PI)
        col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true
    },
  }
}
