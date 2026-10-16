// Il mondo di sopra in 3D: la porta verso viste/Mondo3d.vue. Riceve il mondo generato e la nebbia, e a ogni fotogramma chiede a chi
// gioca di fare il suo passo (`passo`: l'eroe che cammina, chi saluta), poi disegna quello che trova nello stato `S` (chi sta dove,
// le pietre accese, gli ingressi aperti, le grate, il portale). Chi gioca non disegna, e qui non si decide niente del gioco. I pezzi
// del mondo si costruiscono attorno all'eroe uno per fotogramma (pezzi.js); il resto è il mondo lontano. docs/sotterraneo/grafica-3d.md.
import { Scene, Color, Fog, HemisphereLight, DirectionalLight, Group, Texture, SRGBColorSpace, NearestFilter, Vector3, Mesh,
         MeshStandardMaterial, MeshBasicMaterial, OctahedronGeometry, RingGeometry, CircleGeometry, CylinderGeometry } from 'three'
import { ATLANTE, PEZZI } from '../../dati/atlante.js'
import { creaContesto } from '../contesto.js'
import { normaliAtlante } from '../trame.js'
import { U, vesti } from './vesti.js'
import { creaTrame } from './trame.js'
import { materialiDelSuolo, terrenoDelPezzo, creaFuori, creaPiazza, campiDelPezzo } from './terreno.js'
import { creaAcqua, creaCielo } from './acqua.js'
import { materialiDelKit, Cantiere, casa, bottega, pozzo, mulino } from './kit.js'
import { ponte, grata, staccionate, cartello, bacheca, campoMinatore, antro } from './ponti.js'
import { creaMonumento, creaPietra, creaPortale } from './monumenti.js'
import { creaNatura } from './natura.js'
import { creaLontano } from './lontano.js'
import { creaVita } from './vita.js'
import { creaNebbia } from './nebbia.js'
import { creaPersone } from './persone.js'
import { creaVeduta, SOLE } from './veduta.js'
import { grigliaDi, dividiPerPezzo, lavoroDeiPezzi } from './pezzi.js'
import { aTerra } from './dito.js'
import { quotaA, quotaTerreno, LIVELLO_ACQUA } from './suolo.js'

const CIELO = new Color(0xc9dcea)
const COLORI_PALLINO = { grigio: 0x9a9a9a, verde: 0x5fd35f, arancio: 0xffa53a, rosso: 0xff4a3a }

export function creaMondo3d(canvas, opz) {
  const ctx = creaContesto(canvas, { perso: opz.perso, fisso: opz.dpr, antialias: true })
  if (!ctx) return null
  try { return costruisci(canvas, ctx, opz) } catch (e) {
    console.warn('mondo 3D: non parte', e)
    ctx.via()
    return null
  }
}

function costruisci(canvas, ctx, { m, nebbia: bit, passo, dopo, frecce = {} }) {
  const { renderer } = ctx
  renderer.toneMappingExposure = 1.05
  const scena = new Scene()
  scena.background = CIELO.clone()
  scena.fog = new Fog(CIELO, 80, 260)
  scena.add(new HemisphereLight(0xcfe4ff, 0x6a5a3a, 1.35))
  const sole = new DirectionalLight(0xfff1dc, 2.6)
  sole.castShadow = true
  sole.shadow.mapSize.set(2048, 2048)
  sole.shadow.bias = -0.0004; sole.shadow.normalBias = 0.04; sole.shadow.radius = 3
  scena.add(sole, sole.target)
  const cam = creaVeduta(m)
  const trame = creaTrame()
  const suolo = materialiDelSuolo(trame), kit = materialiDelKit(trame)
  const nebbia = creaNebbia(m, scena, bit)
  const acqua = creaAcqua(m, SOLE), cielo = creaCielo()
  scena.add(acqua.mesh, cielo.mesh)
  const fuori = creaFuori(m, suolo.terreno)
  scena.add(fuori.mesh)
  const lontano = creaLontano(m, scena, suolo, { quotaFuori: fuori.quotaFuori, M: fuori.M })
  const natura = creaNatura(m, kit, scena)
  const vita = creaVita(scena, trame)
  const parti = dividiPerPezzo(m)
  const matCristallo = vesti(new MeshStandardMaterial({ color: 0xb78cff, emissive: 0x6a3cff, emissiveIntensity: 0.6, roughness: 0.2 }), { oggetto: 'istanza' })
  const quota = (x, z) => quotaA(m, x, z)
  // lo stato da disegnare, scritto da chi gioca (Mondo3d.vue): niente di reattivo, si legge a ogni fotogramma
  const S = {
    io: { x: m.partenza.x + 0.5, z: m.partenza.y + 0.5, verso: { dx: 0, dy: 1 }, sprite: 'cavaliere', mano: null, mancina: null },
    persone: [], accese: new Set(), aperti: new Set(), grate: new Map(), pallini: new Map(), divieti: new Set(), portale: null, veduta: false,
  }
  const eroe = { stato: null, x: 0, z: 0, verso: S.io.verso, sprite: 'cavaliere', mano: null, mancina: null }

  // ── i pezzi costruiti: p → { gruppo, cose, monumenti, pietre, grate, ruote, cristalli, pallini, divieti } ──
  const costruiti = new Map()
  let cambiati = true
  function costruisciPezzo(p) {
    const t0 = performance.now()
    const gruppo = new Group(), cant = new Cantiere(), q = parti[p]
    const cose = { camini: [], braci: [], fuochi: [], spruzzi: [], ruote: [], cristalli: [] }
    const fatto = { gruppo, cose, monumenti: [], pietre: [], grate: [], marcatori: [], ms: 0 }
    gruppo.add(terrenoDelPezzo(m, p, suolo.terreno, 2))
    const campi = campiDelPezzo(m, q.campi, suolo)
    if (campi) gruppo.add(campi)
    staccionate(q.campi, cant, m)
    for (const c of m.citta) if (Math.floor(c.centro.x / 32) + 5 * Math.floor(c.centro.y / 28) === p) { gruppo.add(creaPiazza(m, c, suolo, cant)); pozzo(c.pozzo, cant, m) }
    for (const c of q.case) casa(c, cant, m, cose)
    for (const pp of q.ponti) ponte(pp, cant, m)
    for (const g of q.grate) fatto.grate.push(grata(g, cant, m, kit, gruppo))
    for (const po of q.posti) {
      if (po.tipo === 'mercante') bottega(po, cant, m, cose)
      else if (po.tipo === 'ingresso') {
        const mo = creaMonumento(po, cant, m, kit, gruppo)
        fatto.monumenti.push(mo)
        if (mo.fumo) cose.camini.push(mo.fumo)
        if (mo.braci) cose.braci.push(mo.braci)
        fatto.marcatori.push(marcatore(po, gruppo))
      } else if (po.tipo === 'pietra') fatto.pietre.push(creaPietra(po, cant, m, gruppo))
      else if (po.tipo === 'bacheca') bacheca(po, cant, m)
      else if (po.tipo === 'cartello') cartello(po, frecce[po.citta] || [], cant, m)
      else if (po.tipo === 'minatore' && po.tenda) campoMinatore(po, cant, m, cose)
      else if (po.tipo === 'antro') antro(po, cant, m)
      else if (po.tipo === 'mulino') mulino(po, cant, m, cose, kit)
    }
    for (const r of cose.ruote) gruppo.add(r)
    for (const c of cose.cristalli) { const me = new Mesh(new OctahedronGeometry(0.28), matCristallo); me.position.copy(c); me.castShadow = true; me.userData.y = c.y; gruppo.add(me); fatto.cristalli = [...(fatto.cristalli || []), me] }
    for (const me of cant.chiudi(kit.fermi, kit.ombraFermi)) gruppo.add(me)
    scena.add(gruppo)
    fatto.ms = performance.now() - t0
    return fatto
  }
  // il pallino per terra davanti a un ingresso, del colore della forza (e il cartello di divieto davanti a una chiusa)
  function marcatore(po, gruppo) {
    const x = po.accanto.x + 0.5, z = po.accanto.y - 0.35, y = quotaTerreno(m, x, z) + 0.05
    const pallino = new Mesh(new CircleGeometry(0.32, 20).rotateX(-Math.PI / 2), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }))
    pallino.position.set(x, y, z); pallino.renderOrder = 4; gruppo.add(pallino)
    const alone = new Mesh(new RingGeometry(0.36, 0.5, 24).rotateX(-Math.PI / 2), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }))
    alone.position.set(x, y + 0.01, z); alone.renderOrder = 4; gruppo.add(alone)
    const divieto = new Group()
    const palo = new Mesh(new CylinderGeometry(0.05, 0.05, 1.1, 6), kit.mobili.legno), disco = new Mesh(new CylinderGeometry(0.28, 0.28, 0.05, 20), new MeshBasicMaterial({ color: 0xd8302a }))
    const barra = new Mesh(new CylinderGeometry(0.035, 0.035, 0.4, 4), new MeshBasicMaterial({ color: 0xffffff }))
    palo.position.y = 0.55; disco.position.set(0, 1.1, 0.03); disco.rotation.x = Math.PI / 2; barra.position.set(0, 1.1, 0.065); barra.rotation.z = Math.PI / 2
    divieto.add(palo, disco, barra); divieto.position.set(po.x + 0.2, quotaTerreno(m, po.x + 0.2, po.y + po.h + 0.3), po.y + po.h + 0.3)
    divieto.visible = false; gruppo.add(divieto)
    return { chiave: po.chiave, pallino, alone, divieto }
  }
  function buttaPezzo(p) {
    const f = costruiti.get(p)
    scena.remove(f.gruppo)
    f.gruppo.traverse(o => {
      if (o.geometry) o.geometry.dispose()
      if (o.material && ![...Object.values(kit.fermi), ...Object.values(kit.mobili), suolo.terreno, suolo.campo, suolo.piazza, matCristallo].includes(o.material)) o.material.dispose()
    })
    costruiti.delete(p)
  }
  function lavora() {
    if (S.veduta) return
    const l = lavoroDeiPezzi(m, new Set(costruiti.keys()), S.io.x, S.io.z)
    for (const p of l.butta) { buttaPezzo(p); cambiati = true }
    if (l.costruisci != null) { costruiti.set(l.costruisci, costruisciPezzo(l.costruisci)); cambiati = true }
    if (!cambiati) return
    cambiati = false
    natura.componi([...costruiti.keys()])
    const src = { camini: [], braci: [], fuochi: [], spruzzi: [] }
    for (const f of costruiti.values()) for (const k of Object.keys(src)) src[k].push(...f.cose[k])
    vitaSorgenti = src
    for (let i = 0; i < U.uCostruiti.value.length; i++) U.uCostruiti.value[i] = costruiti.has(i) ? 1 : 0
  }
  let vitaSorgenti = { camini: [], braci: [], fuochi: [], spruzzi: [] }
  // da dove si emette, adesso: solo dalle celle che si vedono
  const viste = { camini: [], braci: [], fuochi: [], spruzzi: [] }
  let prossimeViste = 0
  function sorgentiViste() {
    for (const k of Object.keys(viste)) { viste[k].length = 0; for (const v of vitaSorgenti[k]) if (nebbia.visto(v.x, v.z)) viste[k].push(v) }
    vita.sorgenti(viste)
  }

  // l'atlante delle figure: finché non c'è, non si disegna (un istante, è già nel file)
  let persone = null, tex = null, norm = null
  const img = new Image()
  img.onload = () => {
    tex = new Texture(img); tex.colorSpace = SRGBColorSpace; tex.magFilter = tex.minFilter = NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true
    norm = normaliAtlante(img)
    persone = creaPersone(scena, { tex, norm, larga: img.width, alta: img.height, pezzi: PEZZI, trame, quota, nebbia })
  }
  img.src = ATLANTE

  let portale = null, raf = 0, prima = 0, tempo = 0, vivo = true, L = 0, A = 0
  const centro = new Vector3(), soleVista = new Vector3()
  // la misura è quella del contenitore, mai della finestra, e la rilegge il ResizeObserver quando cambia (come giù)
  const casa_ = canvas.parentElement || canvas
  let rett = casa_.getBoundingClientRect()
  const osserva = typeof ResizeObserver === 'function' ? new ResizeObserver(([e]) => { rett = e.contentRect }) : null
  if (osserva) osserva.observe(casa_)
  function misura() {
    if (!osserva) rett = casa_.getBoundingClientRect()
    const r = rett
    if (!r.width || !r.height) return false
    L = Math.round(r.width); A = Math.round(r.height)
    ctx.misura(L, A)
    cam.misura(L, A)
    vita.scala(A * ctx.dpr / (2 * Math.tan(cam.camera.fov * Math.PI / 360)))
    return true
  }
  function fotogramma(ora) {
    raf = requestAnimationFrame(fotogramma)
    const ms = prima ? ora - prima : 16
    const dt = Math.min(0.05, ms / 1000)
    prima = ora
    if (!persone || !misura()) return
    const t0 = performance.now()
    renderer.info.reset()
    tempo += dt; U.uTempo.value = tempo
    if (passo) passo(dt, tempo)
    lavora()
    // da dove si emette si riguarda a tempo (un quarto di secondo), non a fotogrammi: a 120 Hz sarebbe il doppio
    if (tempo >= prossimeViste) { prossimeViste = tempo + 0.25; sorgentiViste() }
    // la veduta: niente pezzi vicini, tutto il mondo lontano, niente ombra rifatta
    const veduta = S.veduta
    for (const f of costruiti.values()) f.gruppo.visible = !veduta
    lontano.terreni.forEach((t, p) => { t.visible = veduta || !costruiti.has(p) })
    if (veduta) U.uCostruiti.value.fill(0)
    else for (let i = 0; i < U.uCostruiti.value.length; i++) U.uCostruiti.value[i] = costruiti.has(i) ? 1 : 0
    renderer.shadowMap.autoUpdate = !veduta
    // le cose che si muovono
    for (const f of costruiti.values()) {
      for (const r of f.cose.ruote) r.rotation.x -= dt * 0.9
      for (const c of f.cristalli || []) { c.position.y = c.userData.y + Math.sin(tempo * 1.6) * 0.15; c.rotation.y = tempo * 0.8 }
      for (const mo of f.monumenti) {
        const voluto = S.aperti.has(mo.posto.chiave) ? 1 : 0
        mo.k += (voluto - mo.k) * (1 - Math.exp(-dt * 2.5))
        mo.anim(mo.k, tempo)
      }
      for (const p of f.pietre) p.aggiorna(S.accese.has(p.posto.chiave), tempo, nebbia.visto(p.x, p.z))
      for (const g of f.grate) { const v = S.grate.get(g.q.id) ? 1 : 0; g.k0 = (g.k0 ?? v) + (v - (g.k0 ?? v)) * (1 - Math.exp(-dt * 2)); g.apri(Math.round(g.k0 * 100) / 100) }
      for (const mk of f.marcatori) {
        const p = S.pallini.get(mk.chiave)
        mk.pallino.visible = !!p; mk.alone.visible = !!p
        if (p) { mk.pallino.material.color.setHex(COLORI_PALLINO[p.colore] || 0xffe08a); mk.alone.material.color.setHex(COLORI_PALLINO[p.colore] || 0xffe08a); mk.alone.material.opacity = p.adesso ? 0.4 + 0.4 * Math.sin(tempo * 4) : 0 }
        mk.divieto.visible = S.divieti.has(mk.chiave)
      }
    }
    // il portale gemello: c'è finché c'è la sosta del portale
    const pv = S.portale
    if (pv && (!portale || portale.x !== pv.x || portale.z !== pv.z)) { if (portale) { scena.remove(portale.p.gruppo); portale.p.via() } portale = { x: pv.x, z: pv.z, p: creaPortale(pv.x, quotaTerreno(m, pv.x, pv.z), pv.z) }; scena.add(portale.p.gruppo) }
    if (!pv && portale) { scena.remove(portale.p.gruppo); portale.p.via(); portale = null }
    if (portale) { portale.p.gruppo.visible = nebbia.visto(portale.x, portale.z) && !veduta; portale.p.aggiorna(tempo) }
    vita.passo(dt, tempo, centro)
    // l'eroe e le persone
    eroe.x = S.io.x; eroe.z = S.io.z; eroe.verso = S.io.verso; eroe.sprite = S.io.sprite; eroe.mano = S.io.mano; eroe.mancina = S.io.mancina
    if (!eroe.stato) eroe.stato = { x: eroe.x, z: eroe.z, dx: 0, dz: 0, vx: 0, vz: 1, lx: 0, lz: 1, t: 0, colpito: 0, cura: 0, gira: 0, assalto: null, meta: null, passaggio: null, specchio: false, alto: 1.4, px: null, pz: null, cammina: false }
    centro.set(eroe.x, quota(eroe.x, eroe.z), eroe.z)
    cam.aggiorna(dt, centro, veduta, sole)
    soleVista.copy(SOLE).transformDirection(cam.camera.matrixWorldInverse)
    persone.taglio(soleVista.x, soleVista.y)
    persone.disegna(S.persone, eroe, { t: tempo, dt, veduta, camera: cam })
    scena.fog.near = cam.d * 1.5; scena.fog.far = cam.d * 4.5
    cielo.mesh.position.copy(cam.camera.position)
    if (dopo) dopo(dt, tempo)
    ctx.misure.msJs = performance.now() - t0
    const t1 = performance.now()
    renderer.render(scena, cam.camera)
    ctx.misure.msDisegno = performance.now() - t1
    ctx.conta(ms)
  }

  const fuoriTela = { x: -1, z: -1 }
  const api = {
    canvas, S, m, scena,
    get tempo() { return tempo },
    get zoom() { return cam.zoom },
    set zoom(z) { cam.zoom = z },
    misura,
    copri(sopra, sotto) { cam.copri(sopra, sotto) },
    avvia() { if (!raf && vivo) { prima = 0; raf = requestAnimationFrame(fotogramma) } },
    ferma() { cancelAnimationFrame(raf); raf = 0 },
    salta() { cam.salta() },
    quota,
    // le celle scoperte attorno a (x, z): entrano nelle trame della nebbia (e nel bit che si salva)
    scopri(x, z, r) { return nebbia.scopri(x, z, r, tempo) },
    visto: (x, z) => nebbia.visto(x, z),
    aSchermo(x, y, z, fuori) { return cam.schermo(x, y, z, fuori) },
    // il punto del terreno sotto il dito (px nel campo), o null
    aTerra(px, py) {
      const { o, d } = cam.raggio(px, py)
      return aTerra(o, d, (x, z) => (x < 0 || z < 0 || x > m.W || z > m.H ? 6 : Math.max(quota(x, z), LIVELLO_ACQUA)), { lungo: cam.d * 3 + 60 }) || fuoriTela
    },
    grafica() {
      const ms = ctx.misure
      return { tre: true, mondo: true, chiamate: ms.chiamate, triangoli: ms.triangoli, dpr: ctx.dpr, ms: Math.round(ms.msFotogramma * 10) / 10,
               msJs: Math.round(ms.msJs * 100) / 100, msDisegno: Math.round(ms.msDisegno * 100) / 100,
               figure: persone ? persone.figure.quante + persone.figureEroe.quante : 0, pezzi: [...costruiti.keys()].sort((a, b) => a - b),
               msPezzi: Math.round(Math.max(0, ...[...costruiti.values()].map(f => f.ms))), veduta: cam.veduta, scenario: 'mondo' }
    },
    get pronto() { return !!persone && costruiti.size >= Math.min(4, grigliaDi(m).n) },
    distruggi() {
      vivo = false
      api.ferma()
      if (osserva) osserva.disconnect()
      for (const p of [...costruiti.keys()]) buttaPezzo(p)
      for (const x of [natura, vita, lontano, nebbia, acqua, cielo, persone]) if (x) x.via()
      if (portale) portale.p.via()
      scena.remove(fuori.mesh); fuori.mesh.geometry.dispose()
      for (const x of Object.values(suolo)) x.dispose()
      kit.via(); matCristallo.dispose(); trame.via()
      if (tex) tex.dispose()
      if (norm) norm.dispose()
      ctx.via()
    },
  }
  return api
}
