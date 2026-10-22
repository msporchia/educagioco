// Il sotterraneo in 3D: un'altra vista del motore, al posto della tela 2D (scena/tela.js) e con la stessa porta verso Gioco.vue
// (`mostra`, `segui`, `misura`, `schermoDi`, `cellaDa`, `zoomA`, `numerini`, `colonne`, `mappaGrande`), più il dito da punta-e-
// clicca (`premi`, `trascina`), il colpo dell'eroe (`colpo`), gli agganci delle scritte dello scontro (`aggancia`) e quanto costa
// (`grafica`). Riceve fatti già decisi (la corsa, il racconto del turno) e li disegna: chi gioca non disegna. Se WebGL 2 non c'è
// torna null; se il contesto si perde chiama `perso`. La mappa dei moduli: docs/sotterraneo/grafica-3d.md.
import { Scene, Color, Texture, SRGBColorSpace, NearestFilter, Vector3 } from 'three'
import { ATLANTE, PEZZI } from '../dati/atlante.js'
import { creaContesto } from './contesto.js'
import { creaCamera } from './camera.js'
import { creaLuci } from './luci.js'
import { creaMaschera } from './maschera.js'
import { aspettoDi, paesaggioDi } from './aspetti.js'
import { aggiornaVisibilita, scriviTexel, vistaOra } from './visibilita.js'
import { pavimento, muro, legno as tramaLegno, normaliAtlante } from './trame.js'
import { creaFigure } from './figure.js'
import { creaAloni, creaColonne, creaAnelli, creaFiamme } from './segni.js'
import { creaPolvere, creaScintille } from './particelle.js'
import { creaPost } from './post.js'
import { creaEtichette } from './etichette.js'
import { creaCose } from './cose.js'
import { creaEroe, disegnaEroe } from './eroe.js'
import { creaEroe3d, eroe3dAcceso } from './eroe3d.js'
import { creaMostri3d, mostri3dAccesi } from './mostro3d.js'
import { creaGestore, statoDi } from './effetti3d/gestore.js'
import { statiDel } from '../viste/campo.js'
import { creaRacconto, assalto } from './racconto.js'
import { creaAzione } from './azione.js'
import { costruisciPiano } from './piano.js'
import { creaScontro } from './scontro.js'
import { creaContorno } from './contorno.js'
import { ACCESI, POLVERE, SCINTILLE, FIGURE_MAX, ALONI_MAX, MARGINE_DITO } from './costanti.js'
import { verso } from './tempo.js'
import { elencaProgrammi } from './programmi.js'

const NIENTE = { emetti() {}, aggiorna() {}, aspetto() {}, via() {} }

export function creaSotterraneo3d(canvas, opz = {}) {
  // `spegni`: i pezzi di ACCESI da spegnere, per misurare quanto costa ognuno (il cheat `&spegni=nebbia,post`): mai per i bambini
  const ctx = creaContesto(canvas, { perso: opz.perso, fisso: opz.dpr, spegni: opz.spegni })
  if (!ctx) return null
  try { return costruisci(canvas, ctx, opz) } catch (e) {
    console.warn('sotterraneo 3D: non parte', e)
    ctx.via()
    return null
  }
}

function costruisci(canvas, ctx, { strato, bersaglio = null, accorcia = null, cieca = 320, botteRotta = null }) {
  const { renderer } = ctx
  renderer.shadowMap.autoUpdate = ACCESI.ombraOgni <= 1   // altrimenti la chiede il giro del fotogramma, qui sotto (il mondo di sopra fa da sé)
  const scena = new Scene()
  scena.background = new Color(0)
  const cam = creaCamera()
  const luci = creaLuci(scena, aspettoDi(null))
  const maschera = creaMaschera()
  const post = ACCESI.post ? creaPost(renderer) : null
  const aloni = creaAloni(scena, ALONI_MAX), colonne = creaColonne(scena), anelli = creaAnelli(scena)
  const scintille = ACCESI.scintille ? creaScintille(scena, Math.round(SCINTILLE * Math.min(1, ACCESI.quanteScintille))) : NIENTE
  const polvere = ACCESI.polvere ? creaPolvere(scena, POLVERE, luci.condivise, maschera) : NIENTE
  const etichette = creaEtichette(strato)
  const eroe = creaEroe()
  const eroe3d = eroe3dAcceso() ? creaEroe3d(scena) : null     // in prova: il personaggio in 3D al posto dello sprite (`#eroe2d` lo spegne)
  // la fiamma della torcia in mano all'eroe: una sola, si sposta con lui (scena3d/eroe.js)
  const fiammaEroe = ACCESI.fiamme ? creaFiamme(scena, maschera, [{ scala: 0.85, cx: 0, cz: 0, x: 0, y: -9, z: 0 }]) : null
  if (fiammaEroe) fiammaEroe.accesa(0, false)
  // in prova: i mostri in 3D al posto degli sprite (`#sprite` li spegne) e gli effetti 3D dello scontro (docs/sotterraneo/mostri-3d.md)
  const mostri3d = mostri3dAccesi() && ACCESI.mostri3d > 0 ? creaMostri3d(scena, { quanti: () => ACCESI.mostri3d }) : null
  const effetti3d = ACCESI.effetti3d ? creaGestore(scena, { renderer, camera: cam.camera }) : null
  const S = { eroe, campo: null, scintille, luci, anelli, fermo: 0, scossa: 0, aberr: 0, rosso: 0, tBolla: 9, tempo: 0, colpoEroe: null, stato: null,
              mostri3d, effetti3d, eroe3d }
  const racconto = creaRacconto(S)
  const azione = creaAzione()
  const trame = new Map()
  let legno = null
  const trameDi = a => { if (!trame.has(a.chiave)) trame.set(a.chiave, { pav: pavimento(a), muro: muro(a) }); return trame.get(a.chiave) }

  // l'atlante: finché non c'è, non si disegna (un istante, è già nel file)
  let figure = null, figureEroe = null, cose = null, tex = null, norm = null
  const img = new Image()
  img.onload = () => {
    tex = new Texture(img); tex.colorSpace = SRGBColorSpace; tex.magFilter = tex.minFilter = NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true
    norm = normaliAtlante(img)
    const base = { tex, norm, larga: img.width, alta: img.height, pezzi: PEZZI, maschera }
    figure = creaFigure(scena, { ...base, max: FIGURE_MAX })
    figureEroe = creaFigure(scena, { ...base, max: 8, ombra: false })
    // una porta o un forziere che si apre: polvere o scintille d'oro, e un lampo caldo
    const oro = new Color('#ffd76a'), polvere = new Color('#c8b49a')
    cose = creaCose({ figure, aloni, colonne, etichette, camera: cam, mostri3d, vicino: () => eroe.disegnato, apre: r => {
      const forziere = r.che === 'forziere'
      scintille.emetti(r.x + 0.5, 0.4, r.y + 0.5, forziere ? 50 : 24, { forza: 1.6, su: forziere ? 2.4 : 1, vita: 0.8, caldo: 0.2, taglia: 0.07, tinta: forziere ? oro : polvere })
      if (forziere) { luci.lampo.color.set(0xffd27a); luci.lampo.position.set(r.x + 0.5, 0.8, r.y + 0.8); luci.lampo.intensity = 12 }
    } })
    S.stato = cose.stato
  }
  img.src = ATLANTE

  const contorno = creaContorno({ canvas, strato, cam })
  let giri = 0
  let quadro = null, piano = null, raf = 0, prima = 0, coperto = 0, scala = 3, vivo = true, passando = null
  // quello che si fa a fotogramma finito: chi lo chiama può buttare il 3D (il portale porta sopra), e il resto del
  // fotogramma toccherebbe un piano che non c'è più
  let aFotogrammaFinito = null
  const ZOOM = { 2: 1.3, 3: 1, 4: 0.84, 5: 0.72 }
  const centro = new Vector3()
  const scontro = creaScontro({ S, cam, eroe, getPiano: () => piano, getCose: () => cose, getFigure: () => figure, anelli, cieca })
  const torcia = (i, su) => piano && piano.torcia(i, su)   // le torce sui muri che si abbassano nello scontro
  const salta = r => (piano.fontana && r === piano.fontana.roba) || !!piano.portaleDi(r)

  // gli stati addosso ai mostri dello scontro, in 3D: quelli che il racconto mostra adesso, o la verità del motore a racconto finito
  const chiaviStati = [], piedi = new Vector3()
  function statiAddosso(fx) {
    const palco = scontro.palco
    if (!palco) { effetti3d.spegniStati(); return }
    palco.campo.forEach((r, k) => {
      const s = cose.stato(r)
      chiaviStati.length = 0
      if (!(fx && fx.attivo ? fx.morti[k] : r.morto)) {
        for (const x of (fx && fx.attivo && fx.stati[k]) || statiDel(r)) { const c = statoDi(x); if (c && !chiaviStati.includes(c)) chiaviStati.push(c) }
      }
      effetti3d.tieniStati(s, chiaviStati, () => ({ piedi: piedi.set(s.x + (s.dx || 0), 0, s.z + (s.dz || 0)), alto: Math.max(0.8, s.in3d ? s.alto : s.alto * 0.72) }))
    })
  }

  function nuovoPiano(corsa) {
    if (piano) piano.via()
    scontro.chiudi(true)
    piano = costruisciPiano(scena, corsa, { maschera, luci, trameDi, polvere, legno: () => (legno || (legno = tramaLegno())) })
    eroe.px = null; eroe.ritorno = false
    cam.salta()
    azione.annulla()
  }

  // l'eroe dà un colpo; se il motore la rompe (motore/botti.js: lascia il segno e, una volta su cinque, qualcosa per terra) la botte si
  // sfascia: polvere di legno, una scossa piccola, il suono di chi ascolta (Gioco.vue)
  const segatura = new Color('#c8a070')
  function rompiBotte(b) {
    assalto(eroe, b, 0.36, 0.16, 0.6)
    setTimeout(() => {
      const corsa = quadro && quadro.corsa
      if (!piano || !corsa || b.rotta || !corsa.rompiBotte(b.i)) return
      piano.botti.rompi(b)
      scintille.emetti(b.x, 0.4, b.z, 26, { forza: 2.2, su: 1.4, vita: 0.5, caldo: 0.2, taglia: 0.05, tinta: segatura })
      S.scossa = Math.min(1, S.scossa + 0.3); S.fermo = Math.max(S.fermo, 0.05)
      if (botteRotta) botteRotta()
    }, 160)
  }
  // la botte intera più vicina al dito (entro MARGINE_DITO px) fra quelle che si vedono o si ricordano
  function botteAlDito(p) {
    if (!piano) return null
    let mig = null, dm = MARGINE_DITO
    for (const b of piano.botti.botti) {
      if (b.rotta || (piano.vis.ora[piano.pianta.id(b.cella.x, b.cella.y)] || 0) < 0.2) continue
      const s = cam.schermo(b.x, 0.3, b.z), d = Math.hypot(s.x - p.x, s.y - p.y)
      if (d < dm) { dm = d; mig = b }
    }
    return mig
  }

  // La misura è quella del contenitore (il campo del gioco, nella colonna della barra), mai della finestra: la tela lo
  // riempie in CSS (100%) e il disegno ha i suoi pixel × dpr. Senza la misura in CSS una tela assoluta resta grande quanto
  // i suoi pixel: a dpr 1,5 era larga una volta e mezza il campo, la scena ingrandita e tagliata, le scritte e il dito fuori
  // posto. Il ResizeObserver la rilegge quando il campo cambia (finestra, rotazione, pannelli), non a ogni fotogramma.
  const casa = canvas.parentElement || canvas
  canvas.style.width = '100%'; canvas.style.height = '100%'
  let rett = casa.getBoundingClientRect()
  const osserva = typeof ResizeObserver === 'function' ? new ResizeObserver(([e]) => { rett = e.contentRect }) : null
  if (osserva) osserva.observe(casa)
  function misura() {
    if (!osserva) rett = casa.getBoundingClientRect()
    const r = rett
    if (!r.width || !r.height) return false
    const l = Math.round(r.width), a = Math.round(r.height)
    ctx.misura(l, a, (w, h) => { if (post) post.misura(w, h); maschera.uniforms.uRisB.value.set(w, h) })
    cam.misura(l, a, a * ctx.dpr)
    contorno.misura(l, a)
    return true
  }

  function passo(ora) {
    raf = requestAnimationFrame(passo)
    const ms = prima ? ora - prima : 16
    const dtVero = Math.min(0.05, ms / 1000)
    prima = ora
    if (!vivo || !quadro || !quadro.corsa || !cose || !misura()) return
    const t0 = performance.now()
    renderer.info.reset()
    const corsa = quadro.corsa
    if (!piano || piano.liv !== corsa.livello || piano.paesaggio !== paesaggioDi(corsa)) nuovoPiano(corsa)
    S.tempo += dtVero
    let dt = dtVero
    if (S.fermo > 0) { S.fermo -= dtVero; dt = 0 }
    const fx = quadro.fx || null
    scontro.guarda(corsa, fx)
    if (fx) racconto.leggi(fx)
    racconto.aggiorna(dt)
    const daRompere = passando ? null : azione.passo(corsa)
    if (daRompere) rompiBotte(daRompere)
    const t = S.tempo

    aggiornaVisibilita(piano.vis, { forza: corsa.forzaLuce, visto: corsa.visto, palco: scontro.punti(), k: verso(dtVero, 7) })
    if (scriviTexel(piano.vis)) maschera.rinfresca()

    figure.inizia(); figureEroe.inizia(); aloni.inizia(); colonne.inizia(); etichette.inizia()
    cose.disegna(corsa, { t, dt: dtVero, dtScena: dt, palco: scontro.palco ? { campo: scontro.palco.campo, fx } : null, salta })
    if (effetti3d) { statiAddosso(fx); effetti3d.aggiorna(dt) }
    // la fonte bevuta (lo dice il motore): l'acqua va all'eroe e la fontana si svuota, una volta sola
    const fo = piano.fontana
    if (fo && fo.roba.morto && fo.stato === 'piena') { if (fo.usa(eroe)) eroe.cura = 1.2 }
    for (const s of piano.sorgenti) if (s.cella != null) s.vis = piano.vis.ora[s.cella] || 0
    luci.distribuisci(piano.sorgenti, eroe.x, eroe.z, t)
    disegnaEroe(eroe, corsa, { figure: figureEroe, luci, etichette, camera: cam, dt: dtVero, dtScena: dt, t, fontana: fo, portale: (passando && passando.portale) || piano.portale, bersaglio: scontro.bersaglio(corsa),
                       fiamma: fiammaEroe, aloni, scintille: ACCESI.scintille ? scintille : null, modello: eroe3d })
    luci.spegni(dtVero)
    // le scintille delle torce: solo da quelle che si vedono adesso
    if (ACCESI.scintille) for (const s of piano.sorgenti) if (s.trema && s.vis > 0.2 && Math.random() < dt * 3) scintille.emetti(s.pos.x, s.pos.y - 0.05, s.pos.z - 0.15, 1, { forza: 0.3, su: 1.4, vita: 0.9, caldo: 0.3, taglia: 0.035 })
    contorno.feste(this_.colonne, this_.numerini, quadro.orologio || 0, eroe, colonne, etichette)
    scontro.segni(corsa, dtVero, azione.roba, t)
    figure.chiudi(); figureEroe.chiudi(); aloni.chiudi(); colonne.chiudi(); etichette.chiudi()

    // la telecamera: sull'eroe, o sul palco sopra il pannello
    if (!scontro.centro(centro)) centro.set(eroe.disegnato.x, 0, eroe.disegnato.z)
    S.scossa = Math.max(0, S.scossa - dtVero * 2.2)
    // quanto copre il pannello conta solo nello scontro: in esplorazione un foglio è un velo sopra la scena, e l'inquadratura resta
    cam.aggiorna(dtVero, centro, { scontro: !!scontro.palco, celle: scontro.celle, coperto: scontro.palco ? coperto : 0, scossa: S.scossa, t })
    luci.schiarita(!!scontro.palco, centro.x, centro.z, dtVero)
    scontro.buco(maschera.uniforms, centro)

    const punti = canvas.height * 1.5   // la misura delle particelle: in px del disegno
    piano.fiamme.aggiorna(t); piano.nebbia.aggiorna(t); piano.pozze.aggiorna(t)
    if (fiammaEroe) fiammaEroe.aggiorna(t)
    if (piano.velo) piano.velo.aggiorna(t)
    if (piano.raggi) piano.raggi.aggiorna(t)
    polvere.aggiorna(t, centro, punti)
    scintille.aggiorna(dt, punti)
    if (fo) fo.aggiorna(dt, t, punti, vistaOra(piano.vis, fo.cella.x + 0.5, fo.cella.y + 0.5))
    piano.sincronizzaPortali()
    for (const p of piano.portali) p.aggiorna(dt, t, punti, vistaOra(piano.vis, p.cella.x + 0.5, p.cella.y + 0.5))
    piano.terreno.aggiorna(dtVero, torcia)
    piano.botti.aggiorna(dt)

    S.rosso *= Math.exp(-5 * dtVero)
    figure.nitido(scontro.palco ? 1 : 0, dtVero); figureEroe.nitido(scontro.palco ? 1 : 0, dtVero)
    if (post) {
      const u = post.uni
      u.uT.value = t; u.uRosso.value = S.rosso * 0.6; u.uLampo.value = Math.max(0, luci.lampo.intensity - 15) * 0.004
    }
    contorno.mappina(corsa, this_.mappaGrande, !!scontro.palco)
    contorno.dataset(corsa, eroe, scala)
    ctx.misure.msJs = performance.now() - t0
    // l'ombra a fotogrammi alterni (fascia bassa): la mappa vecchia resta giusta con la sua luce, va solo un fotogramma indietro
    if (ACCESI.ombre && ACCESI.ombraOgni > 1) renderer.shadowMap.needsUpdate = (giri++ % ACCESI.ombraOgni) === 0
    const t1 = performance.now()
    if (post) post.disegna(scena, cam.camera); else renderer.render(scena, cam.camera)
    ctx.misure.msDisegno = performance.now() - t1
    ctx.conta(ms)
    if (aFotogrammaFinito) { const f = aFotogrammaFinito; aFotogrammaFinito = null; f() }
  }

  const this_ = {
    canvas,
    numerini: [],      // l'esperienza di un mostro battuto che sale: { testo, x, y, t } (Gioco.vue, come per la tela 2D)
    colonne: [],       // le colonne di luce di un livello salito: { x, y, t, colore, segui }
    mappaGrande: false,
    get scala() { return scala },
    zoomA(n) {
      const v = Math.max(2, Math.min(5, Math.round(n)))
      if (v === scala) return false
      scala = v; cam.zoom = ZOOM[v]
      return true
    },
    attacca(c) { return c === canvas ? false : null },
    misura,
    segui(_liv, _x, _y, copertoPx = 0) { coperto = copertoPx },
    mostra(q) { quadro = q },
    avvia() { if (!raf && vivo) { prima = 0; raf = requestAnimationFrame(passo) } },
    ferma() { cancelAnimationFrame(raf); raf = 0 },
    schermoDi(x, y) { const p = cam.schermo(x, 0, y); return { x: p.x, y: p.y } },
    // sopra la testa dell'eroe com'è disegnato (la sua altezza, sopra la barretta): il fumetto dei pensieri (Gioco.vue)
    testaDi(corsa) {
      const d = eroe && eroe.disegnato
      const p = d ? cam.schermo(d.x, (eroe.alto || 1) + 0.3, d.z) : cam.schermo(corsa.eroe.x, 1.3, corsa.eroe.y)
      return { x: p.x, y: p.y }
    },
    cellaDa(px, py) { return cam.cellaDa(px, py) || { x: -1, y: -1 } },
    // il dito: un tocco (`p` in px nel campo) e il trascinare
    premi(p) {
      const corsa = quadro && quadro.corsa
      if (!corsa || !cose || !piano || passando) return
      if (scontro.palco) return scontro.tocca(p, quadro.fx, { bersaglio, accorcia })
      if (corsa.foglio) return
      const modellate = mostri3d ? [...mostri3d.modellati] : []
      if (piano.fontana) modellate.push([piano.fontana.roba, piano.fontana.gruppo])
      for (const p of piano.portali) modellate.push([p.roba, p.gruppo])
      const r = contorno.scegli(corsa, p, { figure, modellate })
      const botte = r ? null : botteAlDito(p)
      const cella = r || botte ? null : cam.cellaDa(p.x, p.y)
      scontro.segnaTocco(r || (botte && { x: botte.cella.x, y: botte.cella.y, fx: botte.x, fy: botte.z }), cella)
      azione.tocca(corsa, { roba: r, cella, botte })
    },
    trascina(p) {
      const corsa = quadro && quadro.corsa
      if (!corsa || scontro.palco || corsa.foglio || passando) return
      azione.trascina(corsa, cam.cellaDa(p.x, p.y))
    },
    colpo(a, modo) { racconto.colpo(a, modo) },
    aggancia(chi, el) { scontro.aggancia(chi, el) },
    // il passaggio nel portale: il velo lampeggia e l'eroe ci si stringe dentro; `fatto` quando è dentro
    // `roba`: il portale che si attraversa (quello fisso o quello della pergamena); senza, il primo
    attraversa(fatto, roba = null) {
      const portale = piano && ((roba && piano.portaleDi(roba)) || piano.portale)
      if (!portale) return fatto && fatto()
      portale.attraversa()
      passando = { t: 0, portale, fatto: () => { aFotogrammaFinito = () => { passando = null; if (fatto) fatto() } } }
      eroe.passaggio = passando
    },
    grafica() {
      const m = ctx.misure
      return { tre: true, chiamate: m.chiamate, triangoli: m.triangoli, dpr: ctx.dpr, ms: Math.round(m.msFotogramma * 10) / 10,
               msJs: Math.round(m.msJs * 100) / 100, msDisegno: Math.round(m.msDisegno * 100) / 100,
               figure: figure ? figure.quante : 0, pixelSprite: Math.round(cam.pixelSprite * 100) / 100, scenario: piano ? piano.aspetto.chiave : null, palco: !!scontro.palco,
               programmi: (renderer.info.programs || []).length, memoria: { ...renderer.info.memory },
               mostri3d: mostri3d ? mostri3d.visibili : 0, modelli3d: mostri3d ? mostri3d.quante : 0, effetti3d: effetti3d ? effetti3d.quanti : 0 }   // gli shader compilati: se crescono a ogni colpo, il telefono si ferma a compilare
    },
    // il banco: `n` disegni della scena così com'è, ognuno aspettato (la lettura di un pixel): i ms della tela da sola, senza
    // la pagina attorno né i 60 Hz (docs/core/vecchio-telefono.md, «Lo scontro»); la mediana e il p90
    banco(n = 20) {
      const gl = ctx.gl, px = new Uint8Array(4), v = []
      for (let i = 0; i < n + 2; i++) {
        const t0 = performance.now()
        if (ACCESI.ombre && ACCESI.ombraOgni > 1) renderer.shadowMap.needsUpdate = i % ACCESI.ombraOgni === 0
        if (post) post.disegna(scena, cam.camera); else renderer.render(scena, cam.camera)
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
        if (i >= 2) v.push(performance.now() - t0)
      }
      v.sort((x, y) => x - y)
      return { ms: Math.round(v[n >> 1] * 10) / 10, p90: Math.round(v[Math.floor(n * 0.9)] * 10) / 10 }
    },
    // per le prove: dove sta a schermo un punto del mondo, lo stato di disegno di una cosa, il palco
    aSchermo(x, y, z) { const p = cam.schermo(x, y, z); return [p.x, p.y] },
    statoDi(r) { return cose ? cose.stato(r) : null },
    prova(chiave, i, luce) { return racconto.prova(chiave, i, luce) },
    // le botti del piano: dove stanno e se sono rotte
    botti() { return piano ? piano.botti.botti.map(b => ({ i: b.i, x: b.x, z: b.z, cella: b.cella, rotta: b.rotta, stanza: b.stanza, pezzi: b.pezzi.length })) : [] },
    get eroe() { return eroe },
    get scena() { return scena },   // per le misure (docs/sotterraneo/prestazioni-3d.md): chi fa le chiamate
    programmi() { return elencaProgrammi(renderer, [scena]) },   // da dove vengono gli shader compilati (le misure)
    get corsa() { return quadro ? quadro.corsa : null },
    get palco() { return scontro.palco },
    distruggi() {
      vivo = false
      if (osserva) osserva.disconnect()
      this_.ferma()
      racconto.svuota()
      if (effetti3d) effetti3d.svuota()
      if (mostri3d) mostri3d.via()
      cam.ripristina()
      if (piano) piano.via()
      piano = null
      for (const x of [aloni, colonne, anelli, scintille, polvere, etichette, contorno, figure, figureEroe, fiammaEroe]) if (x) x.via()
      for (const t of trame.values()) for (const k of ['pav', 'muro']) for (const m of Object.values(t[k])) if (m && m.dispose) m.dispose()
      if (legno) { legno.map.dispose(); legno.normalMap.dispose() }
      if (tex) tex.dispose()
      if (norm) norm.dispose()
      if (post) post.via()
      maschera.via()
      ctx.via()
    },
  }
  return this_
}
