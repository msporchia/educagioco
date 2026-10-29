// I segni di scena, istanziati (una chiamata a famiglia): le fiamme delle torce e dei bracieri (vive solo dove si vede adesso:
// lo shader legge la maschera), i chiarori per terra (rarità, missione, chiave, la scala che sale), le macchie d'ombra sotto le
// figure, le colonne di luce (il
// livello salito, il leggendario per terra), gli anelli del tocco e del bersaglio, la bolla degli scudi e delle cure.
import { InstancedMesh, InstancedBufferAttribute, PlaneGeometry, CircleGeometry, CylinderGeometry, RingGeometry, SphereGeometry, Mesh,
         ShaderMaterial, MeshBasicMaterial, AdditiveBlending, Matrix4, Color } from 'three'
import { GLSL_RUMORE } from './luci.js'
import { GLSL_MASCHERA } from './maschera.js'
import { ACCESI } from './costanti.js'

// ── le fiamme: un quadrato rivolto alla telecamera col fuoco disegnato dal rumore ──
export function creaFiamme(scena, maschera, fuochi, tinta = null) {
  const n = Math.max(1, fuochi.length)
  const geo = new PlaneGeometry(0.34, 0.55).translate(0, 0.2, 0)
  const dati = new Float32Array(n * 4)   // x scala, y seme, z/w la cella (dove si legge la maschera)
  fuochi.forEach((f, i) => { dati[i * 4] = f.scala; dati[i * 4 + 1] = Math.random() * 10; dati[i * 4 + 2] = f.cx + 0.5; dati[i * 4 + 3] = f.cz + 0.5 })
  geo.setAttribute('aFiamma', new InstancedBufferAttribute(dati, 4))
  const mat = new ShaderMaterial({
    uniforms: { uT: { value: 0 }, uTinta: { value: new Color(...(tinta || [1, 0.42, 0.1])) }, ...maschera.uniforms },
    vertexShader: /* glsl */`attribute vec4 aFiamma; varying vec2 vUv; varying float vSeme; varying float vVis; ${GLSL_MASCHERA}
      void main(){
        vUv = uv; vSeme = aFiamma.y;
        vVis = smoothstep(0.2, 0.32, texture2D(uMaschera, aFiamma.zw / uDimMappa).r) * step(0.01, aFiamma.x);
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        mv.xy += position.xy * aFiamma.x;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`uniform float uT; uniform vec3 uTinta; varying vec2 vUv; varying float vSeme; varying float vVis;
      ${GLSL_RUMORE}
      void main(){
        if (vVis < 0.01) discard;
        vec2 p = vUv; p.x -= 0.5;
        float n = fbm3(vec3(p.x*3.0, p.y*2.5 - uT*3.5, uT*0.7 + vSeme*13.0));
        float largo = 0.36 * pow(1.0 - p.y, 0.8) * (0.7 + 0.6*n);
        float corpo = 1.0 - smoothstep(largo*0.3, largo, abs(p.x + (n-0.5)*0.25*p.y));
        corpo *= smoothstep(0.0, 0.12, p.y) * (1.0 - smoothstep(0.35, 0.95, p.y + (n-0.5)*0.5));
        float cuore = corpo * (1.0 - smoothstep(0.0, 0.45, p.y));
        vec3 c = mix(uTinta * vec3(1.0, 0.52, 0.3), mix(uTinta, vec3(1.0), 0.45), cuore);
        float alone = smoothstep(0.5, 0.0, length(vec2(p.x, p.y-0.3))) * 0.18;
        gl_FragColor = vec4((c*corpo*1.8 + uTinta*alone) * vVis, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const mesh = new InstancedMesh(geo, mat, n)
  const m = new Matrix4()
  fuochi.forEach((f, i) => mesh.setMatrixAt(i, m.makeTranslation(f.x, f.y, f.z)))
  mesh.count = fuochi.length
  mesh.frustumCulled = false; mesh.renderOrder = 13
  scena.add(mesh)
  return {
    aggiorna(t) { mat.uniforms.uT.value = t },
    // una fiamma che sparisce (la sua torcia sta su un muro abbassato per lo scontro) o torna
    accesa(i, si) { const v = si ? fuochi[i].scala : 0; if (dati[i * 4] !== v) { dati[i * 4] = v; geo.attributes.aFiamma.needsUpdate = true } },
    // una fiamma che si porta in giro (la torcia in mano all'eroe): il posto, e la cella dove legge la maschera
    sposta(i, x, y, z) {
      mesh.setMatrixAt(i, m.makeTranslation(x, y, z)); mesh.instanceMatrix.needsUpdate = true
      dati[i * 4 + 2] = Math.floor(x) + 0.5; dati[i * 4 + 3] = Math.floor(z) + 0.5; geo.attributes.aFiamma.needsUpdate = true
    },
    via() { scena.remove(mesh); geo.dispose(); mat.dispose() },
  }
}

// ── i chiarori per terra: dischi additivi che respirano, uno per cosa che lo chiede, riempiti a ogni fotogramma ──
export function creaAloni(scena, max) {
  const geo = new CircleGeometry(1, 28).rotateX(-Math.PI / 2)
  const dati = new Float32Array(max * 4)   // rgb, forza
  geo.setAttribute('aAlone', new InstancedBufferAttribute(dati, 4))
  const mat = new ShaderMaterial({
    vertexShader: /* glsl */`attribute vec4 aAlone; varying vec4 vA; varying vec2 vP;
      void main(){ vA = aAlone; vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`varying vec4 vA; varying vec2 vP;
      void main(){ float d = length(vP); float a = (1.0 - smoothstep(0.15, 1.0, d)) * vA.a; gl_FragColor = vec4(vA.rgb * a, 1.0); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const mesh = new InstancedMesh(geo, mat, max)
  mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.count = 0
  scena.add(mesh)
  const m = new Matrix4(), c = new Color()
  let n = 0
  return {
    inizia() { n = 0 },
    // (x, z) in celle, `r` il raggio, `colore` un css o un Color, `forza` 0..1
    metti(x, z, r, colore, forza) {
      if (n >= max || forza <= 0.01) return
      m.makeScale(r, 1, r * 0.75).setPosition(x, 0.015, z)
      mesh.setMatrixAt(n, m)
      c.set(colore)
      dati[n * 4] = c.r; dati[n * 4 + 1] = c.g; dati[n * 4 + 2] = c.b; dati[n * 4 + 3] = forza
      n++
    },
    chiudi() { mesh.count = ACCESI.chiarori ? n : 0; mesh.instanceMatrix.needsUpdate = true; geo.attributes.aAlone.needsUpdate = true },
    via() { scena.remove(mesh); geo.dispose(); mat.dispose() },
  }
}

// ── le macchie d'ombra sotto le figure: un disco scuro e sfumato ai piedi di eroe e mostri, perché non galleggino sul pavimento
// (la fascia bassa non ha le ombre vere). Una chiamata per tutte ──
export function creaMacchie(scena, max = 16) {
  const geo = new CircleGeometry(1, 20).rotateX(-Math.PI / 2)
  const forza = new Float32Array(max)
  geo.setAttribute('aForza', new InstancedBufferAttribute(forza, 1))
  const mat = new ShaderMaterial({
    vertexShader: /* glsl */`attribute float aForza; varying float vF; varying vec2 vP;
      void main(){ vF = aForza; vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`varying float vF; varying vec2 vP;
      void main(){ float d = length(vP); gl_FragColor = vec4(0.0, 0.0, 0.0, (1.0 - smoothstep(0.25, 1.0, d)) * 0.6 * vF); }`,
    transparent: true, depthWrite: false,
  })
  const mesh = new InstancedMesh(geo, mat, max)
  mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.count = 0
  scena.add(mesh)
  const m = new Matrix4()
  let n = 0
  return {
    inizia() { n = 0 },
    // (x, z) in celle, `r` il raggio, `f` 0..1 (chi svanisce la porta via con sé)
    metti(x, z, r, f = 1) {
      if (n >= max || f <= 0.01) return
      m.makeScale(r, 1, r * 0.7).setPosition(x, 0.012, z)
      mesh.setMatrixAt(n, m); forza[n] = f; n++
    },
    chiudi() { mesh.count = n; mesh.instanceMatrix.needsUpdate = true; geo.attributes.aForza.needsUpdate = true },
    via() { scena.remove(mesh); geo.dispose(); mat.dispose() },
  }
}

// ── le colonne di luce: un cilindro aperto che sfuma in alto ──
export function creaColonne(scena, max = 8) {
  const geo = new CylinderGeometry(1, 1, 1, 20, 1, true).translate(0, 0.5, 0)
  const dati = new Float32Array(max * 4)
  geo.setAttribute('aCol', new InstancedBufferAttribute(dati, 4))
  const mat = new ShaderMaterial({
    vertexShader: /* glsl */`attribute vec4 aCol; varying vec4 vC; varying float vY;
      void main(){ vC = aCol; vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`varying vec4 vC; varying float vY;
      void main(){ float a = (1.0 - vY) * (0.35 + 0.65 * (1.0 - vY)) * vC.a; gl_FragColor = vec4(vC.rgb * a * 1.6, 1.0); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const mesh = new InstancedMesh(geo, mat, max)
  mesh.frustumCulled = false; mesh.renderOrder = 14; mesh.count = 0
  scena.add(mesh)
  const m = new Matrix4(), c = new Color()
  let n = 0
  return {
    inizia() { n = 0 },
    metti(x, z, largo, alto, colore, forza) {
      if (n >= max || forza <= 0.01) return
      mesh.setMatrixAt(n, m.makeScale(largo, alto, largo).setPosition(x, 0, z))
      c.set(colore)
      dati[n * 4] = c.r; dati[n * 4 + 1] = c.g; dati[n * 4 + 2] = c.b; dati[n * 4 + 3] = forza
      n++
    },
    chiudi() { mesh.count = n; mesh.instanceMatrix.needsUpdate = true; geo.attributes.aCol.needsUpdate = true },
    via() { scena.remove(mesh); geo.dispose(); mat.dispose() },
  }
}

// ── gli anelli (il tocco, l'arrivo, il bersaglio dello scontro) e la bolla degli scudi e delle cure ──
export function creaAnelli(scena) {
  const anello = (r0, r1, colore) => {
    const me = new Mesh(new RingGeometry(r0, r1, 40), new MeshBasicMaterial({ color: colore, transparent: true, opacity: 0, depthWrite: false }))
    me.rotation.x = -Math.PI / 2; me.renderOrder = 6; scena.add(me)
    return me
  }
  const tocco = anello(0.34, 0.46, 0xfff0b0), arrivo = anello(0.12, 0.2, 0xfff0b0), bersaglio = anello(0.3, 0.4, 0xffc850)
  const bolla = new Mesh(new SphereGeometry(0.62, 24, 16), new MeshBasicMaterial({ color: 0x8ac8ff, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }))
  bolla.renderOrder = 12; scena.add(bolla)
  const tutti = [tocco, arrivo, bersaglio, bolla]
  for (const o of tutti) o.visible = false
  return { tocco, arrivo, bersaglio, bolla, via() { for (const o of tutti) { scena.remove(o); o.geometry.dispose(); o.material.dispose() } } }
}

