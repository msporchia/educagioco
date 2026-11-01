// Il mondo di sopra in 3D: la porta verso viste/Mondo3d.vue. Riceve il mondo a percorso (lo scheletro di motore/mondo-percorso.js)
// e la nebbia, e a ogni fotogramma chiede a chi gioca di fare il suo passo (`passo`: l'eroe che cammina, chi saluta), poi disegna
// quello che trova nello stato `S` (chi sta dove, le pietre accese, gli ingressi aperti, la porta delle terre, il portale). Chi
// gioca non disegna, e qui non si decide niente del gioco. Le zone si caricano attorno all'eroe (quella dove si è e le due accanto,
// una per fotogramma) e le altre si scaricano; i pezzi del mondo si costruiscono attorno all'eroe uno per fotogramma, solo nelle
// zone caricate (pezzi.js); il resto è il mondo lontano. docs/sotterraneo/mondo-3d.md.
import { Scene, Color, Fog, HemisphereLight, DirectionalLight, Group, Texture, SRGBColorSpace, NearestFilter, Vector3, Mesh,
         MeshBasicMaterial, OctahedronGeometry, RingGeometry, CircleGeometry, CylinderGeometry } from 'three'
import { ATLANTE, PEZZI } from '../../dati/atlante.js'
import { caricaZona, scaricaZona, zonaDi, zoneAttorno } from '../../motore/mondo-percorso.js'
import { creaContesto } from '../contesto.js'
import { ACCESI, ELEMENTI_SOPRA, elementoAcceso } from '../costanti.js'
import { segna, segnaNuovi, creaElementi } from '../../../../grafica/elementi3d.js'
import { normaliAtlante } from '../trame.js'
import { U, vesti, tramaDeiPezzi, tingi, materialeMondo } from './vesti.js'
import { creaTrame } from './trame.js'
import { materialiDelSuolo, terrenoDelPezzo, creaFuori, creaPiazza, campiDelPezzo } from './terreno.js'
import { creaAcqua, creaCielo } from './acqua.js'
import { materialiDelKit, Cantiere, casa, bottega, pozzo, mulino } from './kit.js'
import { ponte, staccionate, cartello, bacheca, campoMinatore, creaScavo } from './ponti.js'
import { creaMonumento, creaPietra, creaPortale, creaPortaDelleTerre } from './monumenti.js'
import { fontana } from './fontana.js'
import { creaNatura, istanzeDelPezzo } from './natura.js'
import { propsPerPezzo, disegnaProps } from './props-citta.js'
import { disegnaPropsAperti } from './props-aperto.js'
import { propsDellaZona } from './props-dove.js'
import { creaLontano } from './lontano.js'
import { creaVita } from './vita.js'
import { creaNebbia } from './nebbia.js'
import { creaScia } from './scia.js'
import { creaPersone } from './persone.js'
import { creaPalcoSopra } from './palco.js'
import { creaVeduta, SOLE } from './veduta.js'
import { grigliaDi, pezzoDi, contenutoDelPezzo, lavoroDeiPezziVista, costruibile, ancoraUguale } from './pezzi.js'
import { aTerra } from './dito.js'
import { quotaA, quotaTerreno, LIVELLO_ACQUA } from './suolo.js'
import { elencaProgrammi } from '../programmi.js'
import { creaCoda, passiDi } from '../coda-shader.js'
import { creaDisegnoDiProva } from '../disegno-prova.js'

const CIELO = new Color(0xc9dcea)
const COLORI_PALLINO = { grigio: 0x9a9a9a, verde: 0x5fd35f, arancio: 0xffa53a, rosso: 0xff4a3a }

export function creaMondo3d(canvas, opz) {
  const ctx = creaContesto(canvas, { perso: opz.perso, fisso: opz.dpr, antialias: true, spegni: opz.spegni, riaccendi: opz.riaccendi })
  if (!ctx) return null
  try { return costruisci(canvas, ctx, opz) } catch (e) {
    console.warn('mondo 3D: non parte', e)
    ctx.via()
    return null
  }
}

// `zone(k, caricata)`: la scena ha caricato (o scaricato) la zona k, perché chi gioca rifaccia quello che ne dipende (la terra dove si
// cammina, i mostri). `da`: dove sta l'eroe all'inizio (la sua zona si carica subito)
function costruisci(canvas, ctx, { m, nebbia: bit, passo, dopo, frecce = [], fontane = [], strato = null, zone: allaZona = null, da = null }) {
  const { renderer } = ctx
  renderer.toneMappingExposure = 1.05
  const scena = new Scene()
  scena.background = CIELO.clone()
  scena.fog = new Fog(CIELO, 80, 260)
  // la tinta della terra (docs/sotterraneo/terre-successive.md): il terreno e le cose nei loro shader, qui lo sfondo e la foschia
  { const k = tingi(m.terraDi); scena.background.multiply(new Color(...k)); scena.fog.color.multiply(new Color(...k)) }
  scena.add(new HemisphereLight(0xcfe4ff, 0x6a5a3a, 1.35))
  const sole = new DirectionalLight(0xfff1dc, 2.6)
  sole.castShadow = true; segna(sole, 'sole')
  sole.shadow.mapSize.set(2048, 2048)
  sole.shadow.bias = -0.0004; sole.shadow.normalBias = 0.04; sole.shadow.radius = 3
  scena.add(sole, sole.target)
  // la zona dove si parte, prima di tutto (il lontano e l'acqua la leggono già scritta)
  const misureZone = []
  const carica = k => {
    const t0 = performance.now()
    caricaZona(m, k)
    const ms = performance.now() - t0
    misureZone.push({ zona: k, ms: Math.round(ms) })
    if (misureZone.length > 20) misureZone.shift()
    return ms
  }
  const p0 = da || m.partenza
  const z0 = zonaDi(m, Math.floor(p0.x), Math.floor(p0.y))
  if (z0 >= 0 && !m.zonaCaricata[z0]) { carica(z0); if (allaZona) allaZona(z0, true) }
  const cam = creaVeduta(m, (x, z) => quotaA(m, x, z))
  const trame = creaTrame()
  const suolo = materialiDelSuolo(trame), kit = materialiDelKit(trame)
  const griglia = grigliaDi(m), tPezzi = tramaDeiPezzi(griglia.nx, griglia.nz)
  // gli elementi (grafica/elementi3d.js): chi pesa si misura spegnendone uno alla volta (docs/core/vecchio-telefono-veri.md, «Come si spegne un elemento»)
  const elementi = creaElementi(ELEMENTI_SOPRA, elementoAcceso)
  const el = (nome, fai) => segnaNuovi(scena, nome, fai)
  const nebbia = el('velo', () => creaNebbia(m, scena, bit))
  const acqua = creaAcqua(m, SOLE), cielo = creaCielo()
  scena.add(segna(acqua.mesh, 'mare'), segna(cielo.mesh, 'cielo'))
  const fuori = creaFuori(m, suolo.terreno)
  scena.add(segna(fuori.mesh, 'terreno'))
  const lontano = el('terreno', () => creaLontano(m, scena, suolo, { quotaFuori: fuori.quotaFuori, M: fuori.M }))
  const natura = el('natura', () => creaNatura(m, kit, scena))
  const vita = el('vita', () => creaVita(scena, trame))
  const scia = el('scia', () => creaScia(scena, (x, z) => quotaA(m, x, z)))
  const conFontana = new Set(fontane.map(f => f.citta))   // le città dove l'acqua prende il posto del pozzo (fontana.js)
  const matCristallo = vesti(materialeMondo({ color: 0xb78cff, emissive: 0x6a3cff, emissiveIntensity: 0.6, roughness: 0.2 }), { oggetto: 'istanza' })
  const quota = (x, z) => quotaA(m, x, z)
  const v = m.villaggio
  // lo stato da disegnare, scritto da chi gioca (Mondo3d.vue): niente di reattivo, si legge a ogni fotogramma
  const S = {
    io: { x: m.partenza.x + 0.5, z: m.partenza.y + 0.5, verso: { dx: 0, dy: 1 }, sprite: 'cavaliere', mano: null, mancina: null },
    persone: [], accese: new Set(), aperti: new Set(), pallini: new Map(), divieti: new Set(), portale: null, veduta: false,
    scavi: [],                 // le X delle mappe del tesoro in mano: [{ chiave, x, z }] (ponti.js, creaScavo)
    terre: false,              // la porta delle terre aperta (le tombe del vento ripulite: lo dice chi gioca)
    inCammino: false,          // l'eroe sta camminando: le zone accanto aspettano che si fermi, o che arrivi vicino al confine
    mostri: [], perTerra: [],   // i mostri di sopra e il bottino per terra, già nel cerchio e fuori dalla nebbia (mostri.js)
    taneSpente: null,           // i luoghi il cui signore è morto (Set di chiavi di regione): il fumo e le braci della loro tana si spengono
    scia: null, sciaDa: 0,      // la strada verso la meta: { luci, meta } (scia.js), e da quale luce si accende
  }
  if (da) { S.io.x = da.x + 0.5; S.io.z = da.y + 0.5 }
  const eroe = { stato: null, x: 0, z: 0, verso: S.io.verso, sprite: 'cavaliere', mano: null, mancina: null }

  // ── i pezzi costruiti: p → { gruppo, cose, monumenti, pietre, terre, marcatori, fontane, istanze, carichi, ms } ──
  const costruiti = new Map()
  let cambiati = true
  function costruisciPezzo(p) {
    const t0 = performance.now()
    const gruppo = segna(new Group(), 'case'), cant = new Cantiere(), q = contenutoDelPezzo(m, p)   // tutto quello che non è terreno
    const cose = { camini: [], braci: [], fuochi: [], spruzzi: [], ruote: [], cristalli: [] }
    const fatto = { gruppo, cose, monumenti: [], pietre: [], terre: [], marcatori: [], fontane: [], istanze: null, carichi: q.carichi, ms: 0 }
    gruppo.add(segna(terrenoDelPezzo(m, p, suolo.terreno, 2), 'terreno'))
    const campi = campiDelPezzo(m, q.campi, suolo)
    if (campi) gruppo.add(segna(campi, 'terreno'))
    staccionate(q.campi, cant, m)
    if (pezzoDi(m, v.piazza.x + v.piazza.w / 2, v.piazza.y + v.piazza.h / 2) === p) gruppo.add(segna(creaPiazza(m, v, suolo, cant), 'terreno'))
    for (const c of q.case) casa(c, cant, m, cose)
    disegnaProps(propsPerPezzo(m)[p], cant, m, cose)
    disegnaPropsAperti(m, p, cant, cose)
    for (const pp of q.ponti) ponte(pp, cant, m)
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
      else if (po.tipo === 'cartello') cartello(po, Array.isArray(frecce) ? frecce : frecce[po.citta] || [], cant, m)
      else if (po.tipo === 'minatore') campoMinatore({ tenda: { x: po.x - 0.2, y: po.y - 0.7 } }, cant, m, cose)
      else if (po.tipo === 'mulino') mulino(po, cant, m, cose, kit)
      else if (po.tipo === 'pozzo') { if (conFontana.has(po.citta)) fatto.fontane.push(fontana(po, cant, m, cose, kit, gruppo)); else pozzo(po, cant, m) }
      else if (po.tipo === 'terre') fatto.terre.push(creaPortaDelleTerre(po, cant, m, kit, gruppo))
    }
    for (const r of cose.ruote) gruppo.add(r)
    for (const c of cose.cristalli) { const me = new Mesh(new OctahedronGeometry(0.28), matCristallo); me.position.copy(c); me.castShadow = true; me.userData.y = c.y; gruppo.add(me); fatto.cristalli = [...(fatto.cristalli || []), me] }
    for (const me of cant.chiudi(kit.fermi, kit.ombraFermi)) { gruppo.add(me); if (me.userData.segni) (fatto.segnati ||= []).push(me) }
    fatto.istanze = istanzeDelPezzo(m, p, q)
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
  const condivisi = new Set([...Object.values(kit.fermi), ...Object.values(kit.mobili), suolo.terreno, suolo.campo, suolo.piazza, matCristallo])
  function buttaPezzo(p) {
    const f = costruiti.get(p)
    scena.remove(f.gruppo)
    f.gruppo.traverse(o => {
      if (o.geometry) o.geometry.dispose()
      if (o.material && !condivisi.has(o.material)) o.material.dispose()
    })
    costruiti.delete(p)
  }
  // le zone attorno all'eroe: quella dove si è subito, le accanto quando i pezzi vicini sono fatti; una per fotogramma. Le altre si
  // scaricano (le celle restano scritte: ricaricando tornano uguali), e i loro pezzi si buttano col controllo dei carichi
  let attorno = [], zonaQui = -1
  const daPreparare = z0 >= 0 ? [z0] : []   // le zone appena caricate: i loro oggetti di scena si fanno al fotogramma dopo (props-dove.js)
  function caricaUna(k) {
    carica(k)
    if (lontano.zonaScritta(k)) acqua.aggiorna(m.zone[k].rettangolo)
    if (allaZona) allaZona(k, true)
    daPreparare.push(k)
    cambiati = true
  }
  // dove guarda la telecamera se il dito l'ha spostata (e non è già sopra l'eroe), altrimenti null
  const fuocoVista = () => (cam.libera.on && Math.hypot(cam.libera.x - S.io.x, cam.libera.z - S.io.z) > 6 ? cam.libera : null)
  function zone() {
    const k = zonaDi(m, Math.floor(S.io.x), Math.floor(S.io.z))
    if (k < 0) return false
    zonaQui = k
    // le zone dell'eroe, e se la vista è spostata dal dito anche quelle di dove si guarda (mai scaricare quelle dell'eroe)
    attorno = zoneAttorno(m, k)
    const f = fuocoVista()
    if (f) { const kv = zonaDi(m, Math.floor(f.x), Math.floor(f.z)); if (kv >= 0) for (const z of zoneAttorno(m, kv)) if (!attorno.includes(z)) attorno.push(z) }
    for (let z = 0; z < m.zone.length; z++) if (m.zonaCaricata[z] && !attorno.includes(z)) { scaricaZona(m, z); if (allaZona) allaZona(z, false); cambiati = true }
    if (!m.zonaCaricata[k]) { caricaUna(k); return true }
    return false
  }
  // l'eroe sta a meno di CONFINE_VICINO celle dal confine fra la sua zona e la zona `z`
  const CONFINE_VICINO = 60
  const vicinoAlConfine = z => m.confini.some(c => (c.i === Math.min(z, zonaQui)) && Math.abs(z - zonaQui) === 1 && Math.hypot(c.x - S.io.x, c.y - S.io.z) < CONFINE_VICINO)
  function lavora() {
    if (S.veduta) return
    if (!zone()) {
      // i pezzi che una zona caricata o scaricata ha reso vecchi
      for (const [p, f] of costruiti) if (!ancoraUguale(m, p, f.carichi)) { buttaPezzo(p); cambiati = true }
      while (daPreparare.length && !m.zonaCaricata[daPreparare[0]]) daPreparare.shift()
      if (daPreparare.length) { propsDellaZona(m, daPreparare.shift()); return }
      const l = lavoroDeiPezziVista(m, new Set(costruiti.keys()), S.io, fuocoVista(), p => costruibile(m, p, attorno))
      for (const p of l.butta) { buttaPezzo(p); cambiati = true }
      if (l.costruisci != null) { costruiti.set(l.costruisci, costruisciPezzo(l.costruisci)); cambiati = true }
      else {
        // una zona accanto si carica quando l'eroe è fermo (un dialogo, uno scontro, una pausa: il fotogramma lungo non si sente), o
        // quando si avvicina al confine: sul telefono una zona sono 0,2–0,6 s (docs/sotterraneo/mondo-3d.md, «Quanto costa»)
        const manca = attorno.find(z => !m.zonaCaricata[z])
        if (manca != null && (!S.inCammino || vicinoAlConfine(manca))) caricaUna(manca)
      }
    }
    if (!cambiati) return
    cambiati = false
    natura.componi([...costruiti.values()].map(f => f.istanze))
    const src = { camini: [], braci: [], fuochi: [], spruzzi: [] }
    for (const f of costruiti.values()) for (const k of Object.keys(src)) src[k].push(...f.cose[k])
    vitaSorgenti = src
    tPezzi.segna(costruiti.keys())
  }
  let vitaSorgenti = { camini: [], braci: [], fuochi: [], spruzzi: [] }
  // da dove si emette, adesso: solo dalle celle che si vedono
  const viste = { camini: [], braci: [], fuochi: [], spruzzi: [] }
  let prossimeViste = 0
  function sorgentiViste() {
    for (const k of Object.keys(viste)) { viste[k].length = 0; for (const s of vitaSorgenti[k]) if (nebbia.visto(s.x, s.z) && !(s.tana && S.taneSpente && S.taneSpente.has(s.tana))) viste[k].push(s) }
    vita.sorgenti(viste)
    spegniLeBraci()
  }
  // i dischi accesi delle tane senza più signore (braciTana, col `segno` della tana) diventano cenere: si ricolorano i loro vertici
  // nella mesh unita, senza rifare il pezzo; un giro nuovo che rimette il signore li riaccende
  const CENERE = [0.15, 0.12, 0.11]
  function spegniLeBraci() {
    const sp = S.taneSpente
    for (const f of costruiti.values()) for (const me of f.segnati || []) {
      const col = me.geometry.attributes.color
      let tocca = false
      for (const sg of me.userData.segni) {
        const morto = !!(sp && sp.has(sg.segno))
        if (morto === !!sg.prima) continue
        const a = col.array, da = sg.da * 3, a3 = sg.quanti * 3
        if (morto) { sg.prima = a.slice(da, da + a3); for (let i = 0; i < a3; i++) a[da + i] = CENERE[i % 3] }
        else { a.set(sg.prima, da); sg.prima = null }
        tocca = true
      }
      if (tocca) col.needsUpdate = true
    }
  }

  // l'atlante delle figure: finché non c'è, non si disegna (un istante, è già nel file)
  let persone = null, palco = null, tex = null, norm = null
  const img = new Image()
  img.onload = () => {
    tex = new Texture(img); tex.colorSpace = SRGBColorSpace; tex.magFilter = tex.minFilter = NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true
    norm = normaliAtlante(img)
    persone = creaPersone(scena, { tex, norm, larga: img.width, alta: img.height, pezzi: PEZZI, trame, quota, nebbia })
    // lo scontro di sopra (palco.js): nasce qui una volta, e resta spento finché non si combatte
    if (strato) palco = el('persone', () => creaPalcoSopra(scena, { tex, norm, larga: img.width, alta: img.height, pezzi: PEZZI, quota, cam, strato }))
  }
  img.src = ATLANTE

  let sciaPosata = null, vedutaPrima = false
  const scavi = new Map()
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
    // il terreno lontano: a pezzi nella vista vicina (spento sotto quelli costruiti), a blocchi nella veduta (lontano.js)
    lontano.terreni.forEach((t, p) => { t.visible = !veduta && !costruiti.has(p) })
    for (const b of lontano.blocchi) b.visible = veduta
    if (veduta !== vedutaPrima) { vedutaPrima = veduta; tPezzi.segna(veduta ? [] : costruiti.keys()) }
    renderer.shadowMap.autoUpdate = !veduta
    // le cose che si muovono
    for (const f of costruiti.values()) {
      for (const r of f.cose.ruote) r.rotation.x -= dt * 0.9
      for (const fo of f.fontane) fo.anima(tempo)
      for (const c of f.cristalli || []) { c.position.y = c.userData.y + Math.sin(tempo * 1.6) * 0.15; c.rotation.y = tempo * 0.8 }
      for (const mo of f.monumenti) {
        const voluto = S.aperti.has(mo.posto.chiave) ? 1 : 0
        mo.k += (voluto - mo.k) * (1 - Math.exp(-dt * 2.5))
        mo.anim(mo.k, tempo)
      }
      for (const te of f.terre) { te.k += ((S.terre ? 1 : 0) - te.k) * (1 - Math.exp(-dt * 1.5)); te.anim(te.k, tempo) }
      for (const p of f.pietre) p.aggiorna(S.accese.has(p.posto.chiave), tempo, nebbia.visto(p.x, p.z))
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
    // le X delle mappe del tesoro: ci sono finché la taglia è in mano
    for (const [k, sc] of scavi) if (!S.scavi.some(v => v.chiave === k)) { scena.remove(sc.g); sc.via(); scavi.delete(k) }
    for (const v of S.scavi) {
      let sc = scavi.get(v.chiave)
      if (!sc) { sc = creaScavo(kit); sc.g.position.set(v.x, quotaTerreno(m, v.x, v.z), v.z); sc.g.rotation.y = (v.x * 7 + v.z * 3) % 6.28; scena.add(sc.g); scavi.set(v.chiave, sc) }
      sc.g.visible = nebbia.visto(v.x, v.z) && !veduta
    }
    vita.passo(dt, tempo, centro)
    if (S.scia !== sciaPosata) { sciaPosata = S.scia; scia.posa(S.scia && S.scia.luci, S.scia && S.scia.meta) }
    scia.da(S.sciaDa)
    // l'eroe e le persone
    eroe.x = S.io.x; eroe.z = S.io.z; eroe.verso = S.io.verso; eroe.sprite = S.io.sprite; eroe.mano = S.io.mano; eroe.mancina = S.io.mancina; eroe.corpo = S.io.corpo
    // `#…&senzaeroe`: le foto delle icone (strumenti/scatti.mjs, icone-mondo); nello scontro l'eroe lo disegna il palco
    const inScontro = !!(palco && palco.attivo)
    eroe.nascosto = !!S.io.nascosto || inScontro
    if (!eroe.stato) eroe.stato = { x: eroe.x, z: eroe.z, dx: 0, dz: 0, vx: 0, vz: 1, lx: 0, lz: 1, t: 0, colpito: 0, cura: 0, gira: 0, assalto: null, meta: null, passaggio: null, specchio: false, alto: 1.4, px: null, pz: null, cammina: false }
    const pc = inScontro ? palco.centro() : null
    if (pc) centro.set(pc.x, quota(pc.x, pc.z), pc.z)
    else centro.set(eroe.x, quota(eroe.x, eroe.z), eroe.z)
    cam.aggiorna(dt, centro, veduta, sole, pc)
    U.uVeduta.value = cam.k
    soleVista.copy(SOLE).transformDirection(cam.camera.matrixWorldInverse)
    persone.taglio(soleVista.x, soleVista.y)
    persone.disegna(S.persone, eroe, { t: tempo, dt, veduta, camera: cam, mostri: S.mostri, perTerra: S.perTerra,
                                       extra: inScontro ? o => palco.passo(dt, tempo, o, A * ctx.dpr * 1.5) : null })
    if (scena.fog) { scena.fog.near = cam.d * 1.5; scena.fog.far = cam.d * 4.5 }   // senza: la misura degli elementi (la foschia tolta)
    cielo.mesh.position.copy(cam.camera.position)
    if (dopo) dopo(dt, tempo)
    ctx.misure.msJs = performance.now() - t0
    elementi(scena)
    // l'entrata a passi, come giù (indice.js, `entra`): il primo disegno aspetta che quello che vedrebbe sia compilato, un programma per
    // fotogramma, e intanto resta il quadro di prima; i pezzi che arrivano dopo compilano al loro primo disegno, come sempre
    if (entrando === null) entrando = ACCESI.riscaldamento && !parallelo ? performance.now() + 12000 : 0
    if (entrando) {
      if (!coda.quanti) { diProva.luci(); coda.metti(...passiDi(scena, f => diProva.disegna(f), vistiEntrando, { visibili: true })) }
      if (coda.quanti && performance.now() < entrando) { coda.passo(); return }
      entrando = 0; coda.svuota()
    }
    const t1 = performance.now()
    renderer.render(scena, cam.camera)
    ctx.misure.msDisegno = performance.now() - t1
    ctx.conta(ms)
    // il riscaldamento (docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»): un secondo dopo i primi pezzi, gli shader di
    // quello che c'è ma non si è ancora disegnato (lo scontro sul prato, il portale, la scia), un programma per fotogramma (coda-shader.js:
    // tutta la scena insieme era un fotogramma di secondi sul telefono senza KHR_parallel_shader_compile); `compile` chiede e non aspetta
    if (!scaldato && ACCESI.riscaldamento && costruiti.size >= Math.min(4, griglia.n)) {
      if (scaldaDa == null) scaldaDa = tempo + 1
      else if (tempo >= scaldaDa) { scaldato = true; coda.metti(() => passiDi(scena, o => renderer.compile(o, cam.camera, scena))) }
    }
    if (coda.quanti) coda.passo({ riposo: 1 })
  }
  let scaldato = false, scaldaDa = null, entrando = null
  const coda = creaCoda({ programmi: () => (renderer.info.programs || []).length })
  const parallelo = ACCESI.parallelo && renderer.extensions.has('KHR_parallel_shader_compile'), vistiEntrando = new Set()
  const diProva = creaDisegnoDiProva({ renderer, scena, camera: () => cam.camera, compila: f => renderer.compile(f, cam.camera, scena) })

  const fuoriTela = { x: -1, z: -1 }
  const api = {
    canvas, S, m, scena,
    get palcoSopra() { return palco },   // lo scontro di sopra (palco.js): `pittore` per Gioco.vue, `apri`, `chiudi`
    // come la scena delle discese, per le prove e per strumenti/vecchio-telefono.mjs (`--scontro`): il palco aperto e la sua corsa
    get palco() { return palco && palco.attivo ? palco.pittore.palco : null },
    get corsa() { return palco && palco.attivo ? palco.pittore.corsa : null },
    // il banco: `n` disegni della scena così com'è, ognuno aspettato (docs/core/vecchio-telefono.md, «Lo scontro»)
    banco(n = 20) {
      const gl = ctx.gl, px = new Uint8Array(4), w = []
      for (let i = 0; i < n + 2; i++) {
        const t0 = performance.now()
        renderer.render(scena, cam.camera)
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
        if (i >= 2) w.push(performance.now() - t0)
      }
      w.sort((x, y) => x - y)
      return { ms: Math.round(w[n >> 1] * 10) / 10, p90: Math.round(w[Math.floor(n * 0.9)] * 10) / 10 }
    },
    get tempo() { return tempo },
    get zoom() { return cam.zoom },
    set zoom(z) { cam.zoom = z },
    get cam() { return cam },   // la telecamera: trascina, segui, libera, limitiZoom (veduta.js)
    misura,
    copri(sopra, sotto) { cam.copri(sopra, sotto) },
    avvia() { if (!raf && vivo) { prima = 0; raf = requestAnimationFrame(fotogramma) } },
    ferma() { cancelAnimationFrame(raf); raf = 0 },
    salta() { cam.salta() },
    // la veduta scorre col dito (veduta.js): `dx` in pixel
    spostaVeduta(dx) { cam.sposta(dx) },
    // un salto (la pietra, il risveglio, le prove): la zona di arrivo si carica subito, non al fotogramma dopo
    caricaQui(x, z) { const k = zonaDi(m, Math.floor(x), Math.floor(z)); if (k >= 0 && !m.zonaCaricata[k]) caricaUna(k); return k },
    quota,
    // le celle scoperte attorno a (x, z): entrano nelle trame della nebbia (e nel bit che si salva)
    scopri(x, z, r) { return nebbia.scopri(x, z, r, tempo) },
    // il velo della strada verso la meta: quelle celle si disegnano come viste, ma non si salvano (nebbia.js, apriIlVelo)
    apriLaStrada(celle) { nebbia.strada(celle, tempo) },
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
               programmi: (renderer.info.programs || []).length, memoria: { ...renderer.info.memory },
               msJs: Math.round(ms.msJs * 100) / 100, msDisegno: Math.round(ms.msDisegno * 100) / 100,
               figure: persone ? persone.figure.quante + persone.figureEroe.quante : 0, pezzi: [...costruiti.keys()].sort((a, b) => a - b),
               msPezzi: Math.round(Math.max(0, ...[...costruiti.values()].map(f => f.ms))), veduta: cam.veduta, scenario: 'mondo',
               palco: !!(palco && palco.attivo), scaldato: scaldato && !coda.quanti, mostri: S.mostri.length, mostri3d: persone ? persone.mostri3d : 0, sagome: persone ? persone.sagome : 0, scia: scia.quante, persone3d: persone ? persone.persone3d : null,
               // le zone: dove si è, quelle caricate, e quanto ci hanno messo le ultime a caricarsi (ms, una per fotogramma)
               zona: zonaQui, zone: m.zonaCaricata.map((c, k) => (c ? k : -1)).filter(k => k >= 0), msZone: misureZone.slice() }
    },
    get pronto() { return !!persone && costruiti.size >= Math.min(4, griglia.n) && !entrando },
    get scena() { return scena },   // per le misure (docs/sotterraneo/prestazioni-3d.md): chi fa le chiamate
    programmi() { return elencaProgrammi(renderer, [scena]) },   // da dove vengono gli shader compilati (le misure)
    distruggi() {
      vivo = false
      api.ferma()
      if (osserva) osserva.disconnect()
      for (const p of [...costruiti.keys()]) buttaPezzo(p)
      for (const x of [natura, vita, scia, lontano, nebbia, acqua, cielo, persone, palco]) if (x) x.via()
      if (portale) portale.p.via()
      for (const sc of scavi.values()) sc.via()
      scena.remove(fuori.mesh); fuori.mesh.geometry.dispose()
      for (const x of Object.values(suolo)) x.dispose()
      kit.via(); matCristallo.dispose(); trame.via(); tPezzi.via()
      if (tex) tex.dispose()
      if (norm) norm.dispose()
      ctx.via()
    },
  }
  return api
}
