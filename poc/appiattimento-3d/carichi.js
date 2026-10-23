// Le leve di costo, una famiglia alla volta, sulla scena vera: quello che si AGGIUNGE (triangoli, chiamate, luci, additivi
// sovrapposti, particelle, personaggi con la pelle) e quello che si CAMBIA (il tipo di materiale, le trame, le normal map).
// `dividi` e lo spezzare in chiamate sono quelli di grafica/benchmark/veri/moltiplica.js, copiati (il prototipo sta da solo).
import { BufferAttribute, MeshLambertMaterial, MeshBasicMaterial, PointLight, Color, Sprite, SpriteMaterial, CanvasTexture,
         AdditiveBlending, Points, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Mesh, Group } from 'three'
import { creaPersona, CHIAVI } from '../../src/giochi/sotterraneo/scena3d/persone3d/persone.js'

const INTERI = new Set([Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array])

/** Una geometria con ogni triangolo diviso in `volte` (2, 4 o 8) triangoli; null se non si può (morph, pelle). */
export function dividi(geo, volte) {
  if (!geo || !geo.attributes.position || Object.keys(geo.morphAttributes || {}).length || geo.attributes.skinIndex) return null
  const n0 = geo.attributes.position.count, nomi = Object.keys(geo.attributes), sorgenti = nomi.map(k => geo.attributes[k])
  const dati = sorgenti.map(a => { const v = new Array(n0 * a.itemSize); for (let i = 0; i < n0; i++) for (let c = 0; c < a.itemSize; c++) v[i * a.itemSize + c] = a.getComponent(i, c); return v })
  let n = n0
  const indice = geo.index ? Array.from(geo.index.array) : Array.from({ length: n0 }, (_, i) => i)
  const iN = nomi.indexOf('normal'), medi = new Map()
  const medio = (a, b) => {
    const k = a < b ? a * 4294967296 + b : b * 4294967296 + a
    let m = medi.get(k); if (m !== undefined) return m
    m = n++
    sorgenti.forEach((s, j) => {
      const d = dati[j], z = s.itemSize
      for (let c = 0; c < z; c++) d[m * z + c] = (d[a * z + c] + d[b * z + c]) / 2
      if (j === iN) { const l = Math.hypot(d[m * 3], d[m * 3 + 1], d[m * 3 + 2]) || 1; for (let c = 0; c < 3; c++) d[m * 3 + c] /= l }
    })
    medi.set(k, m); return m
  }
  const due = t => { const o = []; for (let i = 0; i < t.length; i += 3) { const [a, b, c] = [t[i], t[i + 1], t[i + 2]], m = medio(a, b); o.push(a, m, c, m, b, c) } return o }
  const quattro = t => { const o = []; for (let i = 0; i < t.length; i += 3) { const [a, b, c] = [t[i], t[i + 1], t[i + 2]], ab = medio(a, b), bc = medio(b, c), ca = medio(c, a); o.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca) } return o }
  let tri = indice
  if (volte === 2) tri = due(tri); else if (volte === 4) tri = quattro(tri); else if (volte === 8) tri = due(quattro(tri)); else return null
  const g = geo.clone()
  sorgenti.forEach((s, j) => {
    const intero = !s.normalized && s.array && INTERI.has(s.array.constructor)
    const T = intero ? s.array.constructor : Float32Array, arr = new T(n * s.itemSize), d = dati[j]
    for (let i = 0; i < arr.length; i++) arr[i] = intero ? Math.round(d[i]) : d[i]
    g.setAttribute(nomi[j], new BufferAttribute(arr, s.itemSize, false))
  })
  g.setIndex(n > 65535 ? new BufferAttribute(new Uint32Array(tri), 1) : new BufferAttribute(new Uint16Array(tri), 1))
  g.groups = geo.groups.map(x => ({ ...x, start: x.start * volte, count: x.count * volte }))
  if (Number.isFinite(geo.drawRange.count)) g.setDrawRange(geo.drawRange.start * volte, geo.drawRange.count * volte)
  if (geo.boundingSphere) g.boundingSphere = geo.boundingSphere.clone()
  if (geo.boundingBox) g.boundingBox = geo.boundingBox.clone()
  return g
}

const adatta = o => o.isMesh && !o.isSkinnedMesh && o.geometry && o.geometry.attributes.position && !Array.isArray(o.material) && !o.userData.pvDiviso

/** Le leve: ognuna si applica una volta a piano fatto (`applica`) e alcune vanno ripassate (le cose che nascono dopo: `ripassa`). */
export function creaCarichi(scena, { centro }) {
  const fatte = new WeakSet()
  const extra = []
  const ogni = []
  return {
    ripassa() { for (const f of ogni) f() },
    /** I triangoli × k: ogni triangolo di ogni mesh diviso in k, piatto (la forma, le chiamate e i materiali restano). */
    triangoli(k) {
      const derivate = new Map()
      scena.traverse(o => {
        if (!adatta(o) || fatte.has(o)) return
        fatte.add(o)
        let g = derivate.get(o.geometry.uuid)
        if (g === undefined) { try { g = dividi(o.geometry, k) } catch (e) { g = null } derivate.set(o.geometry.uuid, g) }
        if (g) o.geometry = g
      })
    },
    /** Le chiamate × k: ogni mesh spezzata in k gruppi dello stesso materiale (stessi triangoli). */
    chiamate(k) {
      scena.traverse(o => {
        if (!adatta(o) || fatte.has(o)) return
        const g = o.geometry, tot = g.index ? g.index.count : g.attributes.position.count, tri = Math.floor(tot / 3)
        if (tri < k) return
        fatte.add(o)
        const m = o.material
        g.clearGroups()
        for (let i = 0; i < k; i++) { const da = Math.floor(tri * i / k) * 3, a = Math.floor(tri * (i + 1) / k) * 3; g.addGroup(da, a - da, i) }
        o.material = Array.from({ length: k }, () => m)
      })
    },
    /** Il tipo di materiale: Lambert (luce per pixel semplice) o Basic (niente luce) al posto di Standard e Physical. */
    materiali(tipo) {
      const C = tipo === 'basic' ? MeshBasicMaterial : MeshLambertMaterial, nuovi = new Map()
      const f = () => scena.traverse(o => {
        if (!o.isMesh || !o.material) return
        const sost = m => {
          if (!m || !m.isMeshStandardMaterial) return m
          let n = nuovi.get(m)
          if (!n) {
            n = new C({ color: m.color, map: m.map || null, transparent: m.transparent, opacity: m.opacity, alphaTest: m.alphaTest, side: m.side,
                        vertexColors: m.vertexColors, depthWrite: m.depthWrite, visible: m.visible })
            if (n.emissive && m.emissive) { n.emissive.copy(m.emissive); n.emissiveIntensity = m.emissiveIntensity }
            // il Lambert si porta dietro i ritocchi del gioco (la maschera, le figure): hanno gli stessi pezzi di shader; il Basic no
            // (niente `normal`), e allora il buio fuori vista si disegna acceso: per i ms non cambia, per l'occhio sì
            if (tipo !== 'basic' && m.onBeforeCompile) { const k = m.customProgramCacheKey(); n.onBeforeCompile = m.onBeforeCompile; n.customProgramCacheKey = () => k + '|lambert' }
            nuovi.set(m, n)
          }
          return n
        }
        o.material = Array.isArray(o.material) ? o.material.map(sost) : sost(o.material)
      })
      f(); ogni.push(f)
    },
    /** Via le normal map (il rilievo finto per pixel), o anche le trame di colore (resta il colore del materiale). */
    senza(che) {
      const f = () => scena.traverse(o => {
        for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
          if (!m.isMeshStandardMaterial || fatte.has(m)) continue
          fatte.add(m)
          if (m.normalMap) { m.normalMap = null; m.needsUpdate = true }
          if (che === 'trame' && m.map && !(o.geometry && o.geometry.attributes.aRett)) {   // le figure dell'atlante sono la trama: restano
            if (m.roughnessMap) m.roughnessMap = null
            m.map = null; m.needsUpdate = true
          }
        }
      })
      f(); ogni.push(f)
    },
    /** Particelle: via tutti i Points (polvere, scintille, aloni), o `n` scintille additive da ~8 px attorno al palco. */
    punti(n) {
      if (!n) { const f = () => scena.traverse(o => { if (o.isPoints) o.visible = false }); f(); ogni.push(f); return }
      const pos = new Float32Array(n * 3), c = centro()
      for (let i = 0; i < n; i++) { pos[i * 3] = c.x + (Math.random() - 0.5) * 6; pos[i * 3 + 1] = Math.random() * 1.8; pos[i * 3 + 2] = c.z + (Math.random() - 0.5) * 6 }
      const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(pos, 3))
      const mat = new ShaderMaterial({
        vertexShader: 'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 8.0; }',
        fragmentShader: 'void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.6, 0.25) * (1.0 - smoothstep(0.1, 0.5, d)), 1.0); }',
        transparent: true, depthWrite: false, blending: AdditiveBlending,
      })
      const p = new Points(g, mat); p.frustumCulled = false; scena.add(p); extra.push(p)
    },
    /** Additivi sovrapposti (l'overdraw dei bagliori e delle magie): `n` dischi morbidi grandi un quarto di schermo sul palco. */
    additivi(n) {
      const tex = disco()
      const c = centro()
      for (let i = 0; i < n; i++) {
        const s = new Sprite(new SpriteMaterial({ map: tex, color: new Color(0.25, 0.14, 0.06), blending: AdditiveBlending, depthWrite: false, transparent: true }))
        const a = i * 2.39996
        s.position.set(c.x + Math.cos(a) * 0.9, 0.7 + (i % 3) * 0.2, c.z + Math.sin(a) * 0.9); s.scale.set(3, 3, 1)
        scena.add(s); extra.push(s)
      }
    },
    /** `n` luci puntiformi vere in più (come i fuochi di luci.js), attorno al palco: ognuna costa in ogni pixel di ogni materiale. */
    luci(n) {
      const c = centro()
      for (let i = 0; i < n; i++) {
        const l = new PointLight(new Color(0xff8a3c), 4.5, 7, 1.7), a = (i / n) * Math.PI * 2
        l.position.set(c.x + Math.cos(a) * 3, 1.1, c.z + Math.sin(a) * 3)
        scena.add(l); extra.push(l)
      }
    },
    /** `n` persone del mondo di sopra (persone3d: SkinnedMesh, la pelle) attorno al palco; `rigide`: le stesse senza la pelle. */
    persone(n, rigide = false) {
      const c = centro()
      for (let i = 0; i < n; i++) {
        const g = creaPersona(CHIAVI[i % CHIAVI.length])
        if (rigide) {
          const via = []
          g.traverse(o => { if (o.isSkinnedMesh) via.push(o) })
          for (const o of via) { const m = new Mesh(o.geometry.clone(), o.material); m.geometry.deleteAttribute('skinIndex'); m.geometry.deleteAttribute('skinWeight'); m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.scale.copy(o.scale); o.parent.add(m); o.parent.remove(o) }
        }
        const r = new Group(); r.add(g)
        const a = (i / n) * Math.PI * 2 + 0.3
        r.position.set(c.x + Math.cos(a) * 2.2, 0, c.z + Math.sin(a) * 2.2)
        r.scale.setScalar(1.1)
        scena.add(r); extra.push(r)
      }
    },
    via() { for (const o of extra) scena.remove(o) },
  }
}

// un disco morbido (centro pieno, bordo che sfuma): bagliori e ombre a macchia
let _disco = null
export function disco() {
  if (_disco) return _disco
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r; g.fillRect(0, 0, 64, 64)
  return (_disco = new CanvasTexture(c))
}
