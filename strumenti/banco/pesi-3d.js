/* ═══════════════════════════════════════════════════════════════════
   I PESI DEI MODELLI 3D — `pesi-3d.html`, la pagina di `strumenti/pesi-3d.mjs`

   Ogni modello 3D (mostri, persone, eroi, roba del sotterraneo; i pezzi della Fattoria 3D) costruito come lo costruisce il
   gioco (i mostri e l'eroe saldati), in `copie` copie su un fondo fisso con le luci delle discese in fascia bassa (emisferica,
   sole, due fuochi), tutte alla stessa misura (la più grande dimensione 1,6): così la classifica dice la complessità (chiamate,
   triangoli, shader, animazione), non quanto è grande a schermo. Per ogni voce: chiamate, triangoli, mesh, punti (gli aloni),
   materiali e luci per copia; i ms del disegno per copia (il banco: disegni aspettati con una lettura di un pixel, meno il fondo
   vuoto), i ms dell'animazione per copia, la costruzione (la prima e le altre) e la prima compilazione. docs/sotterraneo/limiti-3d.md.

   Indirizzo: `?gruppo=mostri,persone,eroi,roba,fattoria`, `&q=testo`, `&copie=6`, `&giri=15`, `&senzasalda=1`, `&senzapelle=1`.
   Il risultato in `window.__pesi` ({ pronto, base, righe }).
   ═══════════════════════════════════════════════════════════════════ */
import * as THREE from 'three'

const p = new URLSearchParams(location.search)
const GRUPPI = (p.get('gruppo') || 'mostri,persone,eroi,roba,fattoria').split(',')
const Q = p.get('q') || '', COPIE = Number(p.get('copie')) || 6, GIRI = Number(p.get('giri')) || 15
const L = 392, A = 560
const esito = document.getElementById('esito'), elRighe = document.getElementById('righe')
const pausa = () => new Promise(r => setTimeout(r))

// ══════════ le voci: { gruppo, id, nome, crea() → Object3D, anima(o, t) } ══════════
async function voci() {
  const l = []
  if (GRUPPI.includes('mostri')) {
    const { MODELLO_DI_SPECIE, MODELLO_DEL_GROSSO, MODELLO_DELLA_VARIANTE, voceDi, costruisci } = await import('../../src/giochi/sotterraneo/scena3d/mostri3d/registro.js')
    const { studia, saldaTutto } = await import('../../src/giochi/sotterraneo/scena3d/salda3d.js')
    const ids = new Set()
    for (const v of Object.values(MODELLO_DI_SPECIE)) for (const id of [v].flat()) if (id && voceDi(id)) ids.add(id)
    for (const id of Object.values(MODELLO_DEL_GROSSO)) if (voceDi(id)) ids.add(id)
    for (const vv of Object.values(MODELLO_DELLA_VARIANTE)) for (const id of Object.values(vv)) if (voceDi(id)) ids.add(id)
    const fermeDi = new Map()
    for (const id of ids) l.push({ gruppo: 'mostro', id, nome: id, crea: () => {
      const g = costruisci(id)
      if (g && !p.has('senzasalda')) { if (!fermeDi.has(id)) fermeDi.set(id, studia(g)); saldaTutto(g, fermeDi.get(id), { pelle: !p.has('senzapelle') }) }
      return g
    }, anima: (o, t) => o.userData.anima(t) })
  }
  if (GRUPPI.includes('persone')) {
    const { creaPersona, CHIAVI } = await import('../../src/giochi/sotterraneo/scena3d/persone3d/persone.js')
    for (const k of CHIAVI) l.push({ gruppo: 'persona', id: k, nome: k, crea: () => creaPersona(k), anima: (o, t) => o.userData.anima && o.userData.anima(t) })
  }
  if (GRUPPI.includes('eroi') || GRUPPI.includes('roba')) {
    const { FIGURE3D } = await import('../../src/giochi/sotterraneo/dati/figure3d.js')
    const { creaPezzo, MODULI } = await import('../../src/giochi/sotterraneo/scena3d/roba3d.js')
    const prima = fam => Object.keys(FIGURE3D).find(f => FIGURE3D[f].famiglia === fam)
    if (GRUPPI.includes('eroi')) {
      const { creaEroe, CHIAVI } = await import('../../src/giochi/sotterraneo/scena3d/eroi3d/eroi.js')
      const { vestiDotazione, saldaEroe, posa } = await import('../../src/giochi/sotterraneo/scena3d/eroe3d.js')
      const { eUnaCollana } = await import('../../src/giochi/sotterraneo/scena3d/roba3d-pura.js')
      const { COPRICAPI_3D } = await import('../../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js')
      const { ACCESI } = await import('../../src/giochi/sotterraneo/scena3d/costanti.js')
      const pezzo = (fam, rarita) => ({ figura: prima(fam), id: null, rarita, elemento: 'fuoco' })
      const collana = Object.keys(FIGURE3D).find(f => FIGURE3D[f].famiglia === 'gioielli' && eUnaCollana(f))
      const vestito = rarita => ({ destra: pezzo('lame', rarita), sinistra: pezzo('scudi', rarita),
        corpo: { tipo: 'corazza', pregio: 4, figura: prima('vesti'), rarita, elemento: 'fuoco' },
        collo: collana ? { figura: collana, id: null, rarita, elemento: 'fuoco' } : null, testa: { id: Object.values(COPRICAPI_3D)[0][0][0], rarita } })
      const modi = { nudo: null, comune: vestito('comune'), leggendario: vestito('leggendario'), 'leggendario senza aloni': vestito('leggendario') }
      for (const k of CHIAVI) for (const [modo, d] of Object.entries(modi)) l.push({ gruppo: 'eroe', id: `${k} ${modo}`, nome: `${k} ${modo}`, crea: () => {
        const g = creaEroe(k)
        const aloni = ACCESI.aloni
        if (modo === 'leggendario senza aloni') ACCESI.aloni = false
        try { if (d) vestiDotazione(g, d) } finally { ACCESI.aloni = aloni }
        if (!p.has('senzasalda')) saldaEroe(g, `${k}|${modo}`, { pelle: !p.has('senzapelle') })
        return g
      }, anima: (o, t) => posa(o, t, false, null) })
    }
    if (GRUPPI.includes('roba')) {
      for (const f of Object.keys(FIGURE3D)) l.push({ gruppo: 'roba', id: f, nome: `${FIGURE3D[f].famiglia}: ${f}`, crea: () => creaPezzo({ figura: f, rarita: 'comune', elemento: 'nessuno' }), anima: animaRoba })
      for (const k of (MODULI.pozioni && MODULI.pozioni.CHIAVI) || []) l.push({ gruppo: 'roba', id: k, nome: `consumabile: ${k}`, crea: () => creaPezzo({ consumabile: k, rarita: 'comune' }), anima: animaRoba })
      // gli aloni: la stessa figura a ogni rarità, con un elemento
      for (const fam of ['lame', 'bastoni', 'scudi', 'gioielli', 'vesti']) for (const r of ['magico', 'raro', 'leggendario'])
        l.push({ gruppo: 'alone', id: `${prima(fam)} ${r}`, nome: `${fam} ${r} (fuoco)`, crea: () => creaPezzo({ figura: prima(fam), rarita: r, elemento: 'fuoco' }), anima: animaRoba })
    }
  }
  if (GRUPPI.includes('fattoria')) {
    for (const nome of ['fattoria', 'fattoria-cortile2']) {
      const { VOCI } = await import(`./catalogo-3d/${nome}.js`)
      for (const v of VOCI) l.push({ gruppo: 'fattoria', id: v.id, nome: v.nome, crea: v.crea,
        anima: (o, t) => { if (v.anima) v.anima(o, 0.033, t); else if (o.userData.anima) o.userData.anima(0.033, t) } })
    }
  }
  return l.filter(v => !Q || `${v.gruppo} ${v.id} ${v.nome}`.includes(Q))
}
function animaRoba(o, t) { if (o.userData.anima) o.userData.anima(t * 0.12); if (o.userData.animaAlone) o.userData.animaAlone(t) }

// ══════════ la scena fissa ══════════
const tela = document.getElementById('tela')
const renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: false })
renderer.setPixelRatio(1); renderer.setSize(L, A, false)
renderer.toneMapping = THREE.ACESFilmicToneMapping
const gl = renderer.getContext(), px = new Uint8Array(4)
const scena = new THREE.Scene(); scena.background = new THREE.Color(0x2a3038)
scena.add(new THREE.HemisphereLight(0xcfe4ff, 0x6a5a3a, 1.2))
const sole = new THREE.DirectionalLight(0xfff1dc, 2); sole.position.set(3, 8, 5); scena.add(sole)
for (const [x, z, c] of [[-3, 1, 0xffa050], [3, -1, 0xff9040]]) { const f = new THREE.PointLight(c, 6, 9, 2); f.position.set(x, 1.8, z); scena.add(f) }
const suolo = new THREE.Mesh(new THREE.PlaneGeometry(14, 10).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5a5048, roughness: 0.9 }))
scena.add(suolo)
const camera = new THREE.PerspectiveCamera(40, L / A, 0.1, 60); camera.position.set(0, 5.2, 7.5); camera.lookAt(0, 0.6, 0)
const COLONNE = 3, PASSO = 2.2
const posto = k => [((k % COLONNE) - (COLONNE - 1) / 2) * PASSO, (Math.floor(k / COLONNE) - 0.5) * PASSO * 0.9]

const mediana = a => a.slice().sort((x, y) => x - y)[a.length >> 1]
function disegna() { const t0 = performance.now(); renderer.render(scena, camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - t0 }
function banco(anima) {
  const d = [], an = []
  let t = 1
  for (let i = 0; i < GIRI + 2; i++) {
    const t0 = performance.now()
    if (anima) { t += 0.033; anima(t); scena.updateMatrixWorld() }
    const ta = performance.now() - t0
    const td = disegna()
    if (i >= 2) { d.push(td); an.push(ta) }
  }
  return { disegno: mediana(d), anima: mediana(an) }
}
const _b = new THREE.Box3(), _bb = new THREE.Box3(), _s = new THREE.Vector3(), _c = new THREE.Vector3()
function aMisura(g) {
  g.updateMatrixWorld(true)
  _b.makeEmpty()
  g.traverseVisible(o => { if ((o.isMesh || o.isPoints) && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); _b.union(_bb) } })
  if (_b.isEmpty()) return
  _b.getSize(_s); _b.getCenter(_c)
  const k = 1.6 / Math.max(_s.x, _s.y, _s.z, 0.05)
  const r = new THREE.Group(); r.scale.setScalar(k); r.position.set(-_c.x * k, -_b.min.y * k, -_c.z * k)
  return r
}
function conta(g) {
  let mesh = 0, punti = 0, luci = 0
  const mat = new Set()
  g.traverseVisible(o => {
    if (o.isMesh) mesh++
    if (o.isPoints) punti++
    if (o.isLight) luci++
    if (o.material) for (const m of [o.material].flat()) mat.add(m)
  })
  return { mesh, punti, luci, materiali: mat.size }
}

async function avvia() {
  const tutte = await voci()
  // sotto automazione si aspetta il via (strumenti/pesi-3d.mjs rallenta la CPU solo dopo il caricamento dei moduli)
  window.__pesiCaricata = true
  while (navigator.webdriver && !window.__pesiVia) await new Promise(r => setTimeout(r, 50))
  // il fondo vuoto
  for (let i = 0; i < 3; i++) disegna()
  renderer.info.autoReset = true
  disegna()
  const baseChiamate = renderer.info.render.calls, baseTri = renderer.info.render.triangles
  const base = banco(null).disegno
  const righe = []
  window.__pesi = { pronto: false, base: { ms: +base.toFixed(2), chiamate: baseChiamate }, righe, copie: COPIE }
  for (let n = 0; n < tutte.length; n++) {
    const v = tutte[n]
    esito.textContent = `${n + 1}/${tutte.length} ${v.nome}`
    await pausa()
    try {
      let t0 = performance.now()
      const primo = await v.crea()
      const msPrimo = performance.now() - t0
      if (!primo || !primo.isObject3D) throw new Error('crea non torna un Object3D')
      const copie = [primo]
      t0 = performance.now()
      for (let k = 1; k < COPIE; k++) copie.push(await v.crea())
      const msCrea = COPIE > 1 ? (performance.now() - t0) / (COPIE - 1) : msPrimo
      try { v.anima(primo, 1) } catch (e) { /* senza animazione */ }
      const c = conta(primo)
      const gruppo = new THREE.Group()
      copie.forEach((g, k) => {
        try { v.anima(g, 1) } catch (e) { /* idem */ }
        const r = aMisura(g) || new THREE.Group()
        r.add(g)
        const [x, z] = posto(k); const fuori = new THREE.Group(); fuori.position.set(x, 0, z); fuori.rotation.y = 0.5; fuori.add(r)
        gruppo.add(fuori)
      })
      scena.add(gruppo)
      const msCompila = disegna()
      disegna()
      const chiamate = renderer.info.render.calls - baseChiamate, tri = renderer.info.render.triangles - baseTri
      let animaOk = true
      const b = banco(t => { if (!animaOk) return; try { for (const g of copie) v.anima(g, t) } catch (e) { animaOk = false } })
      scena.remove(gruppo)
      righe.push({ gruppo: v.gruppo, id: v.id, nome: v.nome, chiamate: +(chiamate / COPIE).toFixed(1), tri: Math.round(tri / COPIE), ...c,
                   msCopia: +((b.disegno - base) / COPIE).toFixed(2), msAnima: +(b.anima / COPIE).toFixed(3), msPrimo: +msPrimo.toFixed(1),
                   msCrea: +msCrea.toFixed(2), msCompila: +msCompila.toFixed(0) })
    } catch (e) {
      righe.push({ gruppo: v.gruppo, id: v.id, nome: v.nome, errore: String(e && e.message || e).slice(0, 120) })
    }
  }
  elRighe.textContent = righe.map(r => JSON.stringify(r)).join('\n')
  esito.textContent = `fatto: ${righe.length} voci, fondo ${base.toFixed(1)} ms`
  window.__pesi.pronto = true
}
avvia().catch(e => { esito.textContent = 'guasto: ' + e.message; window.__pesi = { pronto: true, errore: e.message, righe: [] } })
