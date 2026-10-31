// La neve di Natale sul mondo: il prato bianco (la trama del suolo, i ciuffi spenti), ogni faccia rivolta al cielo imbiancata (tetti, chiome,
// sassi, recinti: un ritocco al colore dei materiali, posato da fuori ai modelli) e il ghiaccio ai bordi dei laghetti. Zero draw call per la
// neve, una per il ghiaccio. Bestie, compagni, contadino e colture restano come sono. Vedi docs/fattoria3d/stagioni.md, «La neve».
import * as THREE from 'three'
import { mescola } from '../dati/semi.js'

const CAP_GHIACCIO = 900
/** Gli elementi della scena (grafica/elementi3d.js) le cui facce in alto prendono la neve; dentro, le bestie si saltano. */
const SI_INNEVA = new Set(['edifici', 'pezzi', 'alberi'])
/** I pezzi d'acqua costruiti (scena3d/modelli-acqua.js): ghiaccio lungo l'ovale, non sul rettangolo delle celle. */
const STAGNI = new Set(['stagno', 'laghetto'])

// dopo la normale: quanto la faccia guarda il cielo (nel mondo, non nella camera), con un bordo mosso dalla posizione perché non sia una
// riga. La soglia (0,44) sta sotto le chiome del bosco (coni a ~0,45, scena3d/modelli.js FORME): il termine in altezza le fa a balze
const NEVE_FRAG = `#include <normal_fragment_maps>
  vec3 nNeve = inverseTransformDirection(normal, viewMatrix);
  vec3 pNeve = (vec4(-vViewPosition - viewMatrix[3].xyz, 0.0) * viewMatrix).xyz;
  float rNeve = 0.6 * sin(pNeve.x * 4.3 + pNeve.z * 2.9) * sin(pNeve.z * 3.7 - pNeve.x * 1.9) + 0.4 * sin(pNeve.y * 8.0 + pNeve.x * 1.3 + pNeve.z * 0.7);
  float sNeve = 0.44 + 0.14 * rNeve;
  float neve = smoothstep(sNeve - 0.05, sNeve + 0.05, nNeve.y);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.95, 1.0), neve);
  roughnessFactor = mix(roughnessFactor, 0.95, neve);
  metalnessFactor = mix(metalnessFactor, 0.0, neve);`

/** La copia innevata di un materiale (una per materiale, in comune fra tutte le mesh che lo usano). null se non si può: solo i
    MeshStandard opachi senza uno shader loro (l'acqua, l'erba col vento) e a una faccia sola (le foglie sottili: ninfee, canne). */
function copiaInnevata(m, copie) {
  if (copie.has(m)) return copie.get(m)
  let c = null
  if (m && m.isMeshStandardMaterial && !m.transparent && m.side === THREE.FrontSide && m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile) {
    c = m.clone()
    c.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', NEVE_FRAG) }
    c.customProgramCacheKey = () => 'neve'
    c.userData.innevato = true
  }
  copie.set(m, c)
  return c
}

function tramaNeve() {
  const px = 256, c = document.createElement('canvas'); c.width = c.height = px
  const x = c.getContext('2d'); x.fillStyle = '#dde6f0'; x.fillRect(0, 0, px, px)
  for (let k = 0; k < 700; k++) {
    x.fillStyle = k % 3 ? '#c3d0e0' : '#f4f8fc'; x.globalAlpha = 0.12 + Math.random() * 0.22
    const r = 2 + Math.random() * 8; x.beginPath(); x.arc(Math.random() * px, Math.random() * px, r, 0, 6.3); x.fill()
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}

/** Una lastra di ghiaccio: un disco piatto a otto lati, un po' sbreccato (fermo: stessa forma a ogni apertura). */
function geoLastra() {
  const g = new THREE.CircleGeometry(0.5, 8), p = g.attributes.position
  for (let k = 1; k < p.count; k++) {
    const f = k === p.count - 1 ? 0.86 : 0.72 + 0.28 * ((k * 0.618) % 1)
    p.setXY(k, p.getX(k) * f, p.getY(k) * f)
  }
  return g.rotateX(-Math.PI / 2)
}

export class Neve {
  /** `terreno` può mancare (le prove senza WebGL): allora niente suolo, ciuffi e laghi, solo i materiali dei pezzi. */
  constructor({ scena, gruppo, motore, pezzi, terreno = null }) {
    this.scena = scena; this.m = motore; this.pezzi = pezzi; this.t = terreno
    this.copie = new Map()          // materiale → copia innevata (o null)
    this.cambiati = []              // [mesh, materiale di prima]
    this.prima = null
    this.ghiaccio = new THREE.InstancedMesh(geoLastra(),
      new THREE.MeshStandardMaterial({ color: 0xd8ecf6, emissive: 0x30404c, roughness: 0.25, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), CAP_GHIACCIO)
    this.ghiaccio.count = 0; this.ghiaccio.frustumCulled = false; this.ghiaccio.receiveShadow = true
    gruppo.add(this.ghiaccio)
    if (terreno) this._suolo()
  }

  // il prato, il velo dei lotti non comprati e la riva dei laghi: si cambiano trame e colori, niente di nuovo da disegnare
  _suolo() {
    const t = this.t, neve = tramaNeve(), suolo = t.suolo.material, rep = suolo.map.repeat
    neve.repeat.copy(rep)
    const sulMare = neve.clone(); sulMare.needsUpdate = true; sulMare.repeat.copy(t.terraSuMare.material.map.repeat)
    this.trame = [neve, sulMare]
    this.prima = { ciuffi: t.ciuffi.visible, suolo: suolo.map, sulMare: t.terraSuMare.material.map, velo: t.velo.material.color.getHex(), riva: t.riva.material }
    suolo.map = neve; t.terraSuMare.material.map = sulMare
    t.velo.material.color.set(0x7d8796)
    this.riva = new THREE.MeshStandardMaterial({ color: 0xcfe6f2, emissive: 0x24323c, roughness: 0.3 })
    t.riva.material = this.riva
    t.ciuffi.visible = false
  }

  /** Le opzioni di qualità: i ciuffi d'erba restano spenti (il terreno li riaccende con `q.erba`). */
  applica() { if (this.t) this.t.ciuffi.visible = false }

  /** Mette la neve sui materiali di ciò che è comparso (edifici, pezzi, alberi, recinti) e rifà il ghiaccio attorno alla camera. */
  rinfresca(cx, cz, raggio) {
    for (const o of this.scena.children) if (SI_INNEVA.has(o.userData.elemento3d)) this._innevaSotto(o)
    if (this.t) for (const o of [this.t.pali, this.t.travi]) this._innevaMesh(o)
    this._ghiaccio(cx, cz, raggio)
  }

  _innevaSotto(radice) {
    const salta = new Set([...(radice.userData.bestie || []), ...(radice.userData.pecore || [])])
    const giu = o => {
      if (salta.has(o)) return
      if (o.isMesh && o.visible) this._innevaMesh(o)          // le mesh nascoste di un pezzo istanziato disegnano dal banco, che si inneva da sé
      for (const f of o.children) giu(f)
    }
    giu(radice)
  }
  _innevaMesh(o) {
    const m = o.material
    if (Array.isArray(m) || !m || m.userData.innevato) return
    const c = copiaInnevata(m, this.copie)
    if (!c) return
    this.cambiati.push([o, m]); o.material = c
  }

  // il ghiaccio: lastre lungo il bordo di ogni cella di lago che tocca terra (i laghi del terreno, non il mare), e lungo l'ovale degli stagni costruiti
  _ghiaccio(cx, cz, raggio) {
    const im = this.ghiaccio, o = new THREE.Object3D(); let n = 0
    const metti = (x, z, giro, lungo, largo, y = 0.04) => {
      if (n >= CAP_GHIACCIO) return
      o.position.set(x, y, z); o.rotation.set(0, giro, 0); o.scale.set(lungo, 1, largo); o.updateMatrix(); im.setMatrixAt(n++, o.matrix)
    }
    if (this.t) for (const { dati } of this.t.lottiInFinestra()) {
      if (dati.mare) continue
      for (const [i, j] of dati.acqua) {
        if (Math.abs(i + 0.5 - cx) > raggio || Math.abs(j + 0.5 - cz) > raggio) continue
        for (const [a, b, k] of [[1, 0, 0], [-1, 0, 1], [0, 1, 2], [0, -1, 3]]) {
          if (this.m.acqua(i + a, j + b)) continue
          const h = mescola(i, j, 40 + k), h2 = mescola(i, j, 50 + k)
          metti(i + 0.5 + a * (0.34 + h * 0.06), j + 0.5 + b * (0.34 + h * 0.06), (a ? Math.PI / 2 : 0) + (h2 - 0.5) * 0.3, 1.0 + h * 0.3, 0.42 + h2 * 0.2)
        }
      }
    }
    for (const v of this.pezzi.voci.values()) {
      if (!STAGNI.has(v.tipo) || !v.grp.visible) continue
      const g = v.grp, A = v.d.w / 2 - 0.36, B = v.d.d / 2 - 0.36, quante = Math.round((A + B) * 11)
      if (Math.abs(g.position.x - cx) > raggio + 3 || Math.abs(g.position.z - cz) > raggio + 3) continue
      const cos = Math.cos(g.rotation.y), sin = Math.sin(g.rotation.y)
      for (let k = 0; k < quante; k++) {
        const t = (k / quante) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), f = 0.9 + mescola(k, quante, 61) * 0.06
        const lx = A * f * Math.sign(c) * Math.abs(c) ** (2 / 3), lz = -B * f * Math.sign(s) * Math.abs(s) ** (2 / 3)       // l'ovale di modelli-acqua.js
        metti(g.position.x + lx * cos + lz * sin, g.position.z - lx * sin + lz * cos, g.rotation.y + t + Math.PI / 2, 0.62, 0.34 + mescola(k, quante, 62) * 0.14, 0.065)      // sopra l'acqua dello stagno (0,055)
      }
    }
    im.count = n; im.instanceMatrix.needsUpdate = true
  }

  via() {
    for (const [o, m] of this.cambiati) if (o.material && o.material.userData.innevato) o.material = m
    for (const c of this.copie.values()) c?.dispose()
    this.copie.clear(); this.cambiati = []
    if (this.prima) {
      const t = this.t, p = this.prima
      t.suolo.material.map = p.suolo; t.terraSuMare.material.map = p.sulMare; t.velo.material.color.setHex(p.velo); t.riva.material = p.riva
      t.ciuffi.visible = p.ciuffi
      for (const x of this.trame) x.dispose()
      this.riva.dispose()
    }
  }
}
