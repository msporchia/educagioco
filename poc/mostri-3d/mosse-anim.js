// Le animazioni delle mosse. `conMosse(obj, voce)` prepara un mostro già creato (senza toccare i file dei mostri) e mette in
// `obj.userData.mosse` una voce per mossa: { id, nome, tipo, durata, arrivo, icona, colore, eventi, origine, anima(p, ctx) → { avanza } }.
//   · `anima(p)` è una funzione pura di p ∈ [0,1], da chiamare DOPO `userData.anima(t)` come `attacca`: usa l'`attacca` del mostro quando c'è
//     e ci somma movimenti del corpo intero (balzo, carica, impennata…), il bagliore verde della cura, l'alone d'avviso.
//   · `eventi` dice quando succedono le cose (la pagina lancia i proiettili e cambia la vita): [{ a: frazione, che }].
//   · `avanza` ∈ [0,1] è quanto il mostro si porta verso l'eroe (la pagina muove il Group esterno).
// Regola e motivi: MOSSE.md. Niente stato: tutto si ricalcola da t e da p; `anima(t)` ripristina le pose di base a ogni fotogramma.
import * as THREE from 'three'
import { mosseDi, mossaGenerica, ruoloDi, NOMI_ATTACCO, TIPI, COLORE_ELEMENTO } from './mosse.js'

const cl = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
const sm = x => { x = cl(x); return x * x * (3 - 2 * x) }
const seg = (p, a, b) => cl((p - a) / (b - a))
/** sale in [a,b], resta fino a c, scende in [c,d] */
const bump = (p, a, b, c, d) => sm(seg(p, a, b)) * (1 - sm(seg(p, c, d)))

// ───────── le icone (disegnate, niente emoji) ─────────
const TEX = new Map()
function disegnaIcona (nome, colore) {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d'), hex = '#' + colore.toString(16).padStart(6, '0')
  g.fillStyle = '#12141acc'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill()
  g.lineWidth = 7; g.strokeStyle = hex; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.stroke()
  g.fillStyle = hex; g.strokeStyle = hex; g.lineCap = 'round'; g.lineJoin = 'round'
  const spada = (ang) => {
    g.save(); g.translate(64, 64); g.rotate(ang)
    g.beginPath(); g.moveTo(0, -42); g.lineTo(7, -30); g.lineTo(7, 14); g.lineTo(-7, 14); g.lineTo(-7, -30); g.closePath(); g.fill()
    g.fillRect(-20, 14, 40, 7); g.fillRect(-4, 21, 8, 16); g.beginPath(); g.arc(0, 41, 6, 0, 7); g.fill(); g.restore()
  }
  if (nome === 'spada') spada(0.7)
  else if (nome === 'spade') { spada(0.7); spada(-0.7) }
  else if (nome === 'croce') { g.beginPath(); g.roundRect(50, 22, 28, 84, 6); g.roundRect(22, 50, 84, 28, 6); g.fill() }
  else if (nome === 'stella') {
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 20 : 46; g.lineTo(64 + Math.cos(a) * r, 66 + Math.sin(a) * r) } g.closePath(); g.fill()
  } else if (nome === 'urlo') {
    g.beginPath(); g.arc(30, 64, 9, 0, 7); g.fill(); g.lineWidth = 8
    for (const r of [24, 40, 56]) { g.beginPath(); g.arc(30, 64, r, -0.75, 0.75); g.stroke() }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}
const icona = (nome, colore) => { const k = nome + colore; if (!TEX.has(k)) TEX.set(k, disegnaIcona(nome, colore)); return TEX.get(k) }
const ALONE_TEX = (() => { let t = null; return () => {
  if (t) return t
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64)
  return (t = new THREE.CanvasTexture(c))
} })()

// ───────── i movimenti del corpo intero (parte di tutte le mosse, nessuno tocca i perni) ─────────
// ognuno: (p, a, H, W) → { dx, dy, dz, rx, rz, sx, sy, avanza } ; H altezza del mostro, W larghezza (nelle unità del genitore)
const ZERO = { dx: 0, dy: 0, dz: 0, rx: 0, rz: 0, sx: 1, sy: 1, avanza: 0 }
const corsa = (p, a) => sm(seg(p, a * 0.35, a)) * (1 - sm(seg(p, a + 0.05, 0.95)))
const MOTI = {
  principale: (p, a) => ({ ...ZERO, avanza: bump(p, 0, 0.35, 0.65, 1) }),
  sulposto: () => ZERO,
  carica: (p, a, H) => { const w = sm(seg(p, 0, a * 0.5)); return { ...ZERO, dz: -0.1 * H * w * (1 - sm(seg(p, a * 0.5, a))), rx: -0.1 * w + 0.2 * bump(p, a * 0.8, a, a + 0.05, a + 0.3), sy: 1 - 0.06 * w * (1 - sm(seg(p, a * 0.6, a))), avanza: corsa(p, a) } },
  balzo: (p, a, H) => { const u = seg(p, a * 0.4, a + 0.05), arco = Math.sin(Math.PI * u) * (p < a + 0.05 ? 1 : 0); const w = sm(seg(p, 0, a * 0.4)) * (1 - sm(seg(p, a * 0.4, a * 0.5))); return { ...ZERO, dy: 0.5 * H * arco, sy: 1 - 0.1 * w, sx: 1 + 0.06 * w, rx: 0.15 * arco, avanza: corsa(p, a) } },
  impennata: (p, a, H) => { const su = bump(p, 0, a * 0.8, a * 0.9, a), giu = bump(p, a * 0.9, a, a + 0.04, a + 0.3); return { ...ZERO, rx: -0.55 * su + 0.28 * giu, dy: 0.1 * H * su, dz: -0.05 * H * su, avanza: 0.4 * corsa(p, a) } },
  scatto: (p, a, H, W) => { const lat = bump(p, 0, a * 0.5, a * 0.6, a), tornare = 1 - sm(seg(p, a, a + 0.1)); return { ...ZERO, dx: 0.45 * W * lat * tornare, rz: -0.14 * lat, dz: 0.0, avanza: corsa(p, a) } },
  schianto: (p, a, H) => { const u = seg(p, a * 0.3, a), arco = p < a ? Math.sin(Math.PI * u * 0.9) : 0; const w = bump(p, 0, a * 0.3, a * 0.3, a * 0.4); return { ...ZERO, dy: 0.65 * H * arco, sy: 1 - 0.1 * w, rx: -0.18 * arco + 0.32 * bump(p, a * 0.92, a, a + 0.04, a + 0.28), avanza: 0.85 * corsa(p, a) } },
}
const VS = new THREE.Vector3()

/** Prepara un mostro. voce = { chiave, nome, ruolo?, taglia?, forza?, elem? }. opz: { scala: scala del genitore (quanto è grande a schermo), mosse: elenco già pronto }. */
export function conMosse (obj, voce, opz = {}) {
  const u = obj.userData, scalaMondo = opz.scala ?? 1
  const origAnima = u.anima || (() => {})
  if ('soffioAutomatico' in u) u.soffioAutomatico = false           // il drago soffia solo quando lo dice una mossa
  // le misure, nello spazio del genitore (il Group non è ancora in scena)
  obj.updateMatrixWorld(true)
  const caja = new THREE.Box3().setFromObject(obj), dim = caja.getSize(new THREE.Vector3()), ctr = caja.getCenter(new THREE.Vector3())
  const H = Math.max(0.3, dim.y), W = Math.max(0.3, dim.x), D = Math.max(0.3, dim.z)
  const s = obj.scale.x || 1                                        // da unità del genitore a unità locali dell'oggetto
  const k = 1 / scalaMondo                                          // da metri a schermo a unità del genitore (l'alone vive lì: non segue inclinazioni e salti)
  const init = { p: obj.position.clone(), r: obj.rotation.clone(), s: obj.scale.clone() }

  // i materiali per il bagliore (cura, urlo, incantesimo): si ripristinano a ogni fotogramma
  const mats = []; const visti = new Set()
  obj.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && m.emissive && !visti.has(m)) { visti.add(m); mats.push({ m, e: m.emissive.clone(), i: m.emissiveIntensity }) } })
  const tinge = (colore, q) => { if (q <= 0.001) return; const c = new THREE.Color(colore); for (const x of mats) { x.m.emissive.copy(x.e).lerp(c, cl(q)); x.m.emissiveIntensity = x.i + (0.6 - x.i) * cl(q) } }
  const ripristina = () => { for (const x of mats) { x.m.emissive.copy(x.e); x.m.emissiveIntensity = x.i } }

  // l'alone d'avviso: un anello a terra e l'icona sopra la testa
  const alone = new THREE.Group(); alone.visible = false; obj.add(alone)
  const raggio = Math.min(1.5, Math.max(0.45, Math.max(W, D) * scalaMondo * 0.5)) * k
  const anello = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
  anello.rotation.x = -Math.PI / 2; anello.position.y = 0.02 * k; alone.add(anello)
  const disco = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
  disco.rotation.x = -Math.PI / 2; disco.position.y = 0.015 * k; alone.add(disco)
  const sprIcona = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false })); sprIcona.renderOrder = 20; alone.add(sprIcona)
  const yIcona = H + 0.42 * k
  // il bagliore sul punto d'origine dei colpi a distanza
  const origine = u.attacchi?.soffio?.proiettile?.origine || u.origine || (() => {
    const o = new THREE.Object3D(); o.position.set((ctr.x - init.p.x) / s, Math.max(0.5, (caja.max.y - 0.22 * H) / s), (caja.max.z - init.p.z) / s * 0.85); obj.add(o); return o
  })()
  const bagliore = new THREE.Sprite(new THREE.SpriteMaterial({ map: ALONE_TEX(), transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); bagliore.renderOrder = 19; origine.add(bagliore)
  // gli anelli dell'urlo
  const onde = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffc83a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = 0.04 * k; alone.add(m); return m })

  /** Mostra o spegne l'alone: q ∈ [0,1] è l'intensità. */
  function mostraAlone (m, q, tempo = 0, forte = false) {
    if (!m || q <= 0.001) { alone.visible = false; return }
    alone.visible = true
    // l'alone sta fermo a terra sotto i piedi: si annullano inclinazione, salto e scala del mostro
    alone.quaternion.copy(obj.quaternion).invert()
    alone.scale.set(1 / obj.scale.x, 1 / obj.scale.y, 1 / obj.scale.z)
    alone.position.set(init.p.x, 0, init.p.z).sub(obj.position).applyQuaternion(alone.quaternion).divide(obj.scale)
    const R = raggio * (1 + 0.1 * Math.sin(tempo * 8) * (forte ? 1 : 0.4)) * (0.8 + 0.2 * q)
    anello.scale.set(R, R, 1); disco.scale.set(R * 0.92, R * 0.92, 1)
    anello.material.color.setHex(m.colore); disco.material.color.setHex(m.colore)
    anello.material.opacity = 0.85 * q; disco.material.opacity = 0.2 * q * (forte ? 1.4 : 1)
    sprIcona.material.map = icona(m.icona, m.colore); sprIcona.material.needsUpdate = true
    const dim = 0.5 * k * (0.75 + 0.35 * q); sprIcona.scale.set(dim, dim, 1)
    sprIcona.position.set(0, yIcona + 0.05 * k * Math.sin(tempo * 4), 0); sprIcona.material.opacity = cl(q * 1.4)
  }

  // ───────── le mosse ─────────
  const lista = (opz.mosse || mosseDi(voce)).map(m => ({ ...m }))
  const ruolo = ruoloDi(voce)
  const mosse = {}
  let ultimoT = 0
  const risolviProprio = m => (m.attacca ? u.attacchi?.[m.attacca] : u.attacco) || null
  const hasAttacca = typeof u.attacca === 'function'
  const eDrago = !!u.attacchi

  for (const d of lista) {
    const proprio = risolviProprio(d)
    const tipo = d.tipo, T = TIPI[tipo] || TIPI.attacco
    const forteAtt = tipo === 'attacco' && ((d.mod ?? 1) > 1.05 || d.area)
    const m = {
      ...d, tipo, ruolo,
      nome: d.nome || (tipo === 'attacco' ? (NOMI_ATTACCO[proprio?.tipo] || 'Attacco') : T.nota),
      icona: d.icona || (forteAtt ? 'spade' : T.icona),
      colore: forteAtt ? 0xff8a2a : T.colore,
      tinta: tipo === 'incantesimo' ? COLORE_ELEMENTO[d.elemento || 'fisico'] : (d.colore ?? T.colore),
      origine, proprio, eventi: [],
    }
    const ownA = proprio?.arrivo ?? 0.5
    switch (tipo) {
      case 'attacco': {
        const via = d.via || 'principale'
        m.arrivo = d.arrivo ?? proprio?.arrivo ?? 0.5
        m.durata = d.durata ?? (via === 'principale' ? (proprio?.durata ?? 0.8) : (proprio?.durata ?? 0.8) * 1.15)
        m.proiettile = via === 'principale' ? (proprio?.proiettile ?? null) : null
        m.colpo = d.colpo || proprio?.tipo || 'colpo-arma'
        m.eventi = [{ a: m.arrivo, che: 'colpo' }]
        const moto = MOTI[via] || MOTI.principale
        m.anima = (p, ctx = {}) => {
          const q = cl(p)
          // l'attacco che il mostro ha già, rimappato perché il suo colpo cada sull'arrivo di questa mossa
          const po = q < m.arrivo ? ownA * (q / m.arrivo) : ownA + (1 - ownA) * ((q - m.arrivo) / Math.max(1e-6, 1 - m.arrivo))
          if (hasAttacca) { if (eDrago) u.attacca(via === 'principale' ? q : po, d.attacca || 'soffio', ctx); else u.attacca(via === 'principale' ? q : po, d.attacca, ctx) }
          let r = moto(q, m.arrivo, H, W)
          if (via === 'principale') r = { ...ZERO, avanza: m.proiettile ? 0 : (eDrago ? 0.55 : 1) * bump(q, 0, 0.35, 0.65, 1) }
          if (d.attacca && !m.proiettile) r = { ...r, avanza: 0.55 * bump(q, 0, 0.35, 0.65, 1) }
          applica(r)
          mostraAlone(m, bump(q, 0, m.arrivo * 0.75, m.arrivo, m.arrivo + 0.12) * (forteAtt ? 1 : 0.8), q * m.durata, forteAtt)
          return r
        }
        break
      }
      case 'cura': {
        m.durata = d.durata ?? 1.5; m.arrivo = d.arrivo ?? 0.55
        m.eventi = [{ a: 0.28, che: 'cura-fx' }, { a: m.arrivo, che: 'cura' }]
        m.anima = (p) => {
          const q = cl(p), env = sm(seg(q, 0, 0.3)) * (1 - sm(seg(q, 0.8, 1))), tremito = Math.sin(q * 30) * env
          applica({ ...ZERO, rx: 0.24 * env, sy: 1 - 0.07 * env + 0.012 * tremito, sx: 1 + 0.03 * env, dy: -0.01 * H * env })
          tinge(m.tinta, env * (0.22 + 0.08 * Math.sin(q * 24)) + 0.25 * bump(q, m.arrivo - 0.05, m.arrivo, m.arrivo + 0.02, m.arrivo + 0.25))
          mostraAlone(m, bump(q, 0, 0.3, 0.85, 1), q * m.durata)
          return { ...ZERO }
        }
        break
      }
      case 'incantesimo': {
        m.durata = d.durata ?? 1.2; m.arrivo = d.arrivo ?? 0.52
        m.eventi = [{ a: m.arrivo, che: 'incantesimo' }]
        m.anima = (p, ctx = {}) => {
          const q = cl(p), a = m.arrivo
          const carica = sm(seg(q, 0, a * 0.95)), rilascio = sm(seg(q, a, a + 0.08)), env = carica * (1 - rilascio) + 0.0
          if (hasAttacca) {
            if (eDrago) u.attacca(0.36 * (carica * (1 - sm(seg(q, a + 0.04, 1)))), 'soffio', ctx)   // il collo si tende e il petto si gonfia, ma il fuoco non parte
            else {
              const po = q < a ? ownA * 0.85 * carica : q < a + 0.08 ? ownA * (0.85 + 0.15 * sm(seg(q, a, a + 0.08))) : ownA + (1 - ownA) * ((q - a - 0.08) / Math.max(1e-6, 1 - a - 0.08))
              u.attacca(po, undefined, ctx)
            }
          }
          const fine = 1 - sm(seg(q, a + 0.04, 0.95))
          applica({ ...ZERO, dy: 0.07 * H * carica * fine, rx: -0.14 * carica * fine + 0.1 * bump(q, a, a + 0.05, a + 0.08, a + 0.3), sy: 1 + 0.03 * carica * fine })
          tinge(m.tinta, 0.3 * env * (0.7 + 0.3 * Math.sin(q * 30)) + 0.35 * bump(q, a - 0.02, a, a + 0.02, a + 0.2))
          origine.updateWorldMatrix(true, false); const sw = origine.getWorldScale(VS).x || 1
          const gran = (0.25 + 1.0 * carica) * (1 - sm(seg(q, a + 0.05, a + 0.25))) * 0.5 / sw
          bagliore.material.color.setHex(m.tinta); bagliore.scale.set(gran * 1.8, gran * 1.8, 1); bagliore.material.opacity = cl(carica * 1.1) * (1 - sm(seg(q, a + 0.05, a + 0.25)))
          mostraAlone(m, bump(q, 0, a * 0.7, a, a + 0.12), q * m.durata)
          return { ...ZERO }
        }
        break
      }
      case 'urlo': {
        m.durata = d.durata ?? 1.3; m.arrivo = d.arrivo ?? 0.45
        m.eventi = [{ a: m.arrivo, che: 'urlo' }]
        m.anima = (p, ctx = {}) => {
          const q = cl(p), a = m.arrivo, env = sm(seg(q, 0, a * 0.8)) * (1 - sm(seg(q, 0.72, 0.95))), tr = Math.sin(q * 60) * env
          if (hasAttacca) { if (eDrago) u.attacca(0.3 * env, 'morso', ctx); else u.attacca(ownA * 0.78 * env, undefined, ctx) }   // la bocca si spalanca, la testa si getta indietro: la preparazione del suo morso
          applica({ ...ZERO, rx: -0.2 * env, dy: 0.04 * H * env, sy: 1 + 0.04 * env + 0.015 * tr, sx: 1 + 0.02 * env, rz: 0.025 * tr })
          tinge(m.tinta, 0.28 * env)
          onde.forEach((o, i) => {
            const u2 = seg(q, a + i * 0.12, a + 0.5 + i * 0.12), R = raggio * (1 + 2.8 * u2); o.scale.set(R, R, 1)
            o.material.opacity = u2 > 0 && u2 < 1 ? 0.7 * (1 - u2) : 0; o.visible = true
          })
          mostraAlone(m, bump(q, 0, a * 0.7, a, 0.85) * 0.9, q * m.durata)
          return { ...ZERO }
        }
        break
      }
      default: m.anima = () => ({ ...ZERO })
    }
    mosse[d.id] = m
  }

  // ───────── l'annuncio: l'icona resta sopra il mostro mentre l'eroe sceglie ─────────
  let annuncio = null
  function applica (r) {
    obj.position.x += r.dx; obj.position.y += r.dy; obj.position.z += r.dz
    obj.rotation.x += r.rx; obj.rotation.z += r.rz
    obj.scale.x *= r.sx; obj.scale.y *= r.sy; obj.scale.z *= r.sx
  }
  u.anima = t => {
    obj.position.copy(init.p); obj.rotation.copy(init.r); obj.scale.copy(init.s)
    ripristina(); origAnima(t); ultimoT = t
    bagliore.material.opacity = 0; onde.forEach(o => { o.material.opacity = 0 })
    if (annuncio && mosse[annuncio]) mostraAlone(mosse[annuncio], 0.55, t, mosse[annuncio].icona === 'spade'); else alone.visible = false
  }
  u.mosse = mosse
  u.mosseElenco = lista.map(d => mosse[d.id])
  u.annuncia = id => { annuncio = id }
  u.mosseMisure = { H: H * scalaMondo, W: W * scalaMondo, D: D * scalaMondo }
  return obj
}

export { mossaGenerica }
