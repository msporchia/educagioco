// Il sotterraneo in 3D: la vista del motore, con la sua porta verso Gioco.vue
// (`mostra`, `segui`, `misura`, `schermoDi`, `cellaDa`, `zoomA`, `numerini`, `colonne`, `mappaGrande`), più il dito da punta-e-
// clicca (`premi`, `trascina`), il colpo dell'eroe (`colpo`), gli agganci delle scritte dello scontro (`aggancia`) e quanto costa
// (`grafica`). Riceve fatti già decisi (la corsa, il racconto del turno) e li disegna: chi gioca non disegna. Se WebGL 2 non c'è
// torna null; se il contesto si perde chiama `perso`. La mappa dei moduli: docs/sotterraneo/grafica-3d.md.
import { Scene, Group, Color, Texture, SRGBColorSpace, NearestFilter, Vector3 } from 'three'
import { ATLANTE, PEZZI } from '../dati/atlante.js'
import { creaContesto } from './contesto.js'
import { creaCamera } from './camera.js'
import { creaLuci } from './luci.js'
import { creaMaschera } from './maschera.js'
import { aspettoDi, paesaggioDi } from './aspetti.js'
import { aggiornaVisibilita, scriviTexel, vistaOra } from './visibilita.js'
import { pavimento, muro, pavimentoAPassi, muroAPassi, legno as tramaLegno, normaliAtlante } from './trame.js'
import { creaFigure } from './figure.js'
import { creaAloni, creaColonne, creaAnelli, creaFiamme, creaMacchie } from './segni.js'
import { creaPolvere, creaScintille } from './particelle.js'
import { creaPost } from './post.js'
import { creaEtichette } from './etichette.js'
import { creaCose } from './cose.js'
import { creaEroe, disegnaEroe } from './eroe.js'
import { creaEroe3d } from './eroe3d.js'
import { creaMostri3d } from './mostro3d.js'
import { creaRobaPerTerra } from './roba-per-terra.js'
import { creaGestore, statoDi, effettiPrevisti } from './effetti3d/gestore.js'
import { statiDel } from '../viste/campo.js'
import { creaRacconto, assalto } from './racconto.js'
import { creaAzione } from './azione.js'
import { costruisciPianoAPassi } from './piano.js'
import { creaScontro } from './scontro.js'
import { creaContorno } from './contorno.js'
import { ACCESI, POLVERE, SCINTILLE, FIGURE_MAX, ALONI_MAX, MARGINE_DITO, ELEMENTI_DISCESE, LEVE_ELEMENTI, LUCE, elementoAcceso } from './costanti.js'
import { CONTORNO_PELLE } from './salda3d.js'
import { segna, segnaNuovi, creaElementi } from '../../../grafica/elementi3d.js'
import { verso } from './tempo.js'
import { elencaProgrammi } from './programmi.js'
import { creaCoda, passiDi, passiTrame, tieniProgrammi } from './coda-shader.js'
import { creaDisegnoDiProva } from './disegno-prova.js'
import { COSE } from '../dati/cose.js'
import { mosseDi } from '../dati/mosse.js'

const NIENTE = { emetti() {}, aggiorna() {}, aspetto() {}, via() {} }

export function creaSotterraneo3d(canvas, opz = {}) {
  // `spegni`: i pezzi di ACCESI da spegnere, per misurare quanto costa ognuno (il cheat `&spegni=nebbia,post`): mai per i bambini
  const ctx = creaContesto(canvas, { perso: opz.perso, fisso: opz.dpr, spegni: opz.spegni, riaccendi: opz.riaccendi })
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
  // la luce per vertice del piano (fascia bassa): la trama delle luci sta con la maschera, che ogni materiale del piano ha già
  if (ACCESI.lucePerVertice) {
    Object.assign(maschera.uniforms, luci.vertice.uniforms)
    scena.onBeforeRender = (r, s, camera) => luci.scriviVertice(camera, S.tempo)
  }
  const post = ACCESI.post ? creaPost(renderer) : null
  // gli elementi (grafica/elementi3d.js): chi pesa si misura spegnendone uno alla volta (docs/core/vecchio-telefono-veri.md, «Come si spegne un elemento»)
  const elementi = creaElementi(ELEMENTI_DISCESE, elementoAcceso, 'resto', LEVE_ELEMENTI)
  const gruppo = nome => { const g = segna(new Group(), nome); scena.add(g); return g }
  const [aloni, colonne, anelli, macchie] = segnaNuovi(scena, 'chiarori', () => [creaAloni(scena, ALONI_MAX), creaColonne(scena), creaAnelli(scena), creaMacchie(scena)])
  const scintille = segnaNuovi(scena, 'particelle', () => (ACCESI.scintille ? creaScintille(scena, Math.round(SCINTILLE * Math.min(1, ACCESI.quanteScintille))) : NIENTE))
  const polvere = segnaNuovi(scena, 'particelle', () => (ACCESI.polvere ? creaPolvere(scena, Math.round(POLVERE * ACCESI.quantaPolvere), luci.condivise, maschera) : NIENTE))
  const etichette = creaEtichette(strato)
  const eroe = creaEroe()
  const eroe3d = creaEroe3d(gruppo('eroe'))     // il personaggio in 3D (eroe3d.js), senza sprite di ripiego
  // in due il compagno (docs/sotterraneo/in-due.md): la stessa figura, mossa dal suo alleato; il modello solo quando c'è
  const compagno = creaEroe()
  let compagno3d = null
  // la fiamma della torcia in mano all'eroe: una sola, si sposta con lui (scena3d/eroe.js)
  const fiammaEroe = ACCESI.fiamme ? segnaNuovi(scena, 'fiamme', () => creaFiamme(scena, maschera, [{ scala: 0.85, cx: 0, cz: 0, x: 0, y: -9, z: 0 }])) : null
  if (fiammaEroe) fiammaEroe.accesa(0, false)
  // i mostri in 3D al posto degli sprite (`&spegni=mostri3d` li spegne) e gli effetti 3D dello scontro (docs/sotterraneo/mostri-3d.md)
  const mostri3d = ACCESI.mostri3d > 0 ? creaMostri3d(gruppo('mostri'), { quanti: () => ACCESI.mostri3d }) : null
  const perTerra = creaRobaPerTerra(gruppo('figure'))   // la roba da raccogliere col suo modello (roba-per-terra.js)
  const effetti3d = ACCESI.effetti3d ? creaGestore(gruppo('effetti3d'), { renderer, camera: cam.camera }) : null
  const S = { eroe, campo: null, scintille, luci, anelli, fermo: 0, scossa: 0, aberr: 0, rosso: 0, tBolla: 9, tempo: 0, colpoEroe: null, stato: null,
              mostri3d, effetti3d, eroe3d }
  const racconto = creaRacconto(S)
  const azione = creaAzione()
  const trame = new Map(), inArrivo = new Map()   // `inArrivo`: le trame fatte a passi dal cantiere, non ancora del piano (cantiereDi)
  let legno = null
  const liberaTrame = t => { for (const k of ['pav', 'muro']) for (const m of Object.values(t[k])) if (m && m.dispose) m.dispose() }
  // le trame dei paesaggi: si tengono le ultime tre usate (risalendo di un piano non si rifanno), le altre si buttano: l'abisso cambia
  // paesaggio di piano in piano, e tenerle tutte cresceva a ogni piano (docs/sotterraneo/prestazioni-3d-perdite.md)
  const trameDi = a => {
    let t = trame.get(a.chiave)
    if (t) trame.delete(a.chiave)
    else { const p = inArrivo.get(a.chiave); inArrivo.delete(a.chiave); t = { pav: (p && p.pav) || pavimento(a), muro: (p && p.muro) || muro(a) } }
    trame.set(a.chiave, t)
    for (const [k, v] of trame) if (trame.size > 3 && k !== a.chiave) { liberaTrame(v); trame.delete(k) }
    return t
  }

  // l'atlante: finché non c'è, non si disegna (un istante, è già nel file)
  let figure = null, figureEroe = null, cose = null, tex = null, norm = null
  const img = new Image()
  img.onload = () => {
    tex = new Texture(img); tex.colorSpace = SRGBColorSpace; tex.magFilter = tex.minFilter = NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true
    norm = normaliAtlante(img)
    const base = { tex, norm, larga: img.width, alta: img.height, pezzi: PEZZI, maschera }
    figure = segnaNuovi(scena, 'figure', () => creaFigure(scena, { ...base, max: FIGURE_MAX }))
    figureEroe = segnaNuovi(scena, 'eroe', () => creaFigure(scena, { ...base, max: 8, ombra: false }))
    // una porta o un forziere che si apre: polvere o scintille d'oro, e un lampo caldo
    const oro = new Color('#ffd76a'), polvere = new Color('#c8b49a')
    cose = creaCose({ figure, aloni, macchie, colonne, etichette, camera: cam, mostri3d, perTerra, vicino: () => eroe.disegnato, apre: r => {
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
  const scontro = creaScontro({ S, cam, eroe, compagno, getPiano: () => piano, getCose: () => cose, getFigure: () => figure, anelli, cieca })
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

  // Il piano nuovo. `aPassi` (l'entrata a passi): un pezzo per fotogramma (le trame, il pavimento e i muri, l'arredo… piano.js,
  // costruisciPianoAPassi), e vero finché non è finito; senza, tutto adesso. Intanto `piano` è null: niente disegno, resta il quadro di prima
  let cantiere = null   // { liv, gen }
  // le misure dell'entrata in un piano (grafica().ingresso, `ingresso()`): per fotogramma i programmi nati, il JS e la durata; il piano a pezzi
  const nuovoIngresso = () => ({ fotogrammi: [], js: [], ms: [], picco: 0, disegnato: false, msPiano: 0, pezzi: [] })
  function* cantiereDi(corsa) {
    const a = aspettoDi(paesaggioDi(corsa))
    if (!trame.has(a.chiave) && !inArrivo.has(a.chiave)) {
      const p = {}
      inArrivo.set(a.chiave, p)
      p.pav = yield* pavimentoAPassi(a)
      yield 'trama del pavimento'
      p.muro = yield* muroAPassi(a)
      yield 'trama dei muri'
    }
    if (!legno) { legno = tramaLegno(); yield 'legno' }
    return yield* costruisciPianoAPassi(scena, corsa, { maschera, luci, trameDi, polvere, legno: () => (legno || (legno = tramaLegno())) })
  }
  // un cantiere lasciato a metà (il piano è cambiato ancora, o si chiude): finito e buttato, i suoi pezzi sono già nella scena
  function lasciaCantiere() {
    if (!cantiere) return
    let r
    do { r = cantiere.gen.next() } while (!r.done)
    cantiere = null
    tieniProgrammi(scena); r.value.via()
  }
  function nuovoPiano(corsa, aPassi = false) {
    if (cantiere && cantiere.liv !== corsa.livello) lasciaCantiere()
    if (!cantiere) {
      if (piano) { tieniProgrammi(scena); piano.via() }   // il piano nuovo ha gli stessi programmi: non si ricompilano (coda-shader.js)
      piano = null
      scontro.chiudi(true)
      S.ingresso = nuovoIngresso()
      cantiere = { liv: corsa.livello, gen: cantiereDi(corsa) }
    }
    for (;;) {
      const t0 = performance.now(), r = cantiere.gen.next(), dt = Math.round(performance.now() - t0)
      S.ingresso.msPiano += dt
      if (r.done) { piano = r.value; break }
      S.ingresso.pezzi.push(`${r.value} ${dt}`)
      if (aPassi) return true
    }
    cantiere = null
    // i modelli dei mostri che in questo piano non ci sono più si buttano (la riserva cresceva a ogni piano nuovo)
    if (mostri3d) mostri3d.sfoltisci(new Set(corsa.livello.robe.filter(r => r.che === 'mostro' && !r.morto).map(r => mostri3d.idDi(r)).filter(Boolean)))
    eroe.px = null; eroe.ritorno = false
    cam.salta()
    azione.annulla()
    scaldaPiano(corsa)
    // dove il telefono compila in parallelo (KHR_parallel_shader_compile) gli shader del piano si chiedono subito e si disegna quando
    // sono pronti (al più un secondo): intanto resta il quadro di prima, e la pagina non si ferma. Senza, l'entrata a passi (sotto)
    if (ACCESI.riscaldamento && parallelo) { compila(scena); attesaShader = performance.now() + 1000 }
    return false
  }
  let attesaShader = 0
  const shaderPronti = () => renderer.info.programs.every(p => p.isReady())
  const parallelo = ACCESI.parallelo && renderer.extensions.has('KHR_parallel_shader_compile')

  // Gli shader (docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»): senza KHR_parallel_shader_compile ogni programma
  // ferma il telefono al disegno dopo, e il primo disegno di un piano ne chiedeva una trentina insieme (secondi fermi). Quindi una
  // coda (coda-shader.js) che ne fa nascere al più uno per fotogramma: all'ENTRATA quello che il primo disegno vedrebbe, oggetto per
  // oggetto, e le trame, senza disegnare (resta il quadro di prima); poi il disegno, e il RESTO (mai mentre si racconta un colpo, un
  // fotogramma sì e uno no): gli effetti previsti, le cose ancora spente (anelli, colonne, portali), un'istanza in serbo di ogni
  // modello di mostro del piano. `compile` chiede e non aspetta: il programma si compila al disegno dopo.
  const coda = creaCoda({ programmi: () => (renderer.info.programs || []).length })
  const resto = []
  const daFare = () => coda.quanti + resto.length + (cantiere ? 1 : 0)   // i passi che restano (il piano a pezzi conta uno)
  let visti = new Set(), viste = new Set(), entrando = 0, scaldaDa = 0
  const ENTRATA_MAX = 12000   // ms: oltre, si disegna lo stesso (un telefono che compila più piano del previsto)
  const compila = o => (post && ACCESI.post ? post.compila(o, cam.camera, scena) : renderer.compile(o, cam.camera, scena))
  const passiPrevisti = corsa => {
    const vivi = corsa.livello.robe.filter(r => r.che === 'mostro' && !r.morto)
    return () => (effetti3d ? effetti3d.riscaldamento(effettiPrevisti({
      albero: corsa.crescita && corsa.crescita.albero, famiglia: corsa.mano && COSE[corsa.mano] ? COSE[corsa.mano].famiglia : null,
      attacchi: mostri3d ? mostri3d.attacchi() : [], mosse: vivi.flatMap(r => mosseDi(r)) }), compila, o => passiDi(o, compila, visti)) : [])
  }
  function scaldaPiano(corsa) {
    coda.svuota(); resto.length = 0
    visti = new Set(); viste = new Set()
    entrando = 0; scaldaDa = Infinity
    if (!ACCESI.riscaldamento) { scaldaDa = 0; return }   // `&spegni=riscaldamento`: per misurare quanto toglie (docs/core/vecchio-telefono-veri.md, «L'ingresso»)
    if (!parallelo) entrando = performance.now() + ENTRATA_MAX
    else scaldaDa = S.tempo + 1
    const vivi = corsa.livello.robe.filter(r => r.che === 'mostro' && !r.morto)
    // gli effetti per primi (il colpo dell'arma in mano è il primo attacco), le cose spente, i modelli in serbo, poi gli effetti dei
    // colpi che quei modelli dichiarano (effettiPrevisti; quelli già scaldati non tornano)
    resto.push(passiPrevisti(corsa), () => passiDi(scena, compila, visti))
    if (mostri3d) for (const id of new Set(vivi.map(r => mostri3d.idDi(r)).filter(Boolean))) resto.push(() => mostri3d.prepara(id, compila, o => passiDi(o, compila, visti)))
    resto.push(passiPrevisti(corsa))
  }
  // il disegno di prova (disegno-prova.js): entrando ogni materiale si disegna da solo in un pixel, per i driver che compilano lì
  const diProva = creaDisegnoDiProva({ renderer, scena, camera: () => cam.camera, compila, dentro: f => (post && ACCESI.post ? post.nelQuadro(f) : f()) })
  const disegnaUno = finto => diProva.disegna(finto)
  // l'entrata: quello che questo fotogramma disegnerebbe e non è ancora compilato (le trame prima, sono ferme). Vero finché resta da fare
  function entra() {
    if (!coda.quanti) {
      diProva.luci()
      coda.metti(...passiTrame(scena, t => renderer.initTexture(t), viste, maschera.uniforms, { visibili: true }),
                 ...passiDi(scena, disegnaUno, visti, { visibili: true }))
      if (post && ACCESI.post && !visti.has('post')) { visti.add('post'); coda.metti(() => post.compilaQuadro()) }
    }
    if (!coda.quanti || performance.now() > entrando) return false
    coda.passo()
    return true
  }
  // La discesa scaldata prima di scendere (Gioco.vue, scaldaDiscesa): la tela non è ancora nella pagina e non si disegna. Il primo piano
  // si costruisce e TUTTO quello che potrà chiedere si compila, un programma per fotogramma: trame, scena, modelli dei mostri, effetti.
  // Scendendo il piano vero (un'altra corsa, lo stesso dungeon) trova i programmi pronti: l'entrata dura un fotogramma o due
  let rafAnticipo = 0, daAnticipo = false
  function anticipo() {
    rafAnticipo = requestAnimationFrame(anticipo)
    if (!vivo || !quadro || !cose) return
    if (!piano) {
      if (nuovoPiano(quadro.corsa, true)) return
      entrando = 0
      // l'eroe montato e vestito (un fotogramma suo), poi le trame e la scena
      const c = quadro.corsa
      coda.metti(() => { if (eroe3d) eroe3d.prepara(c) },
                 () => { diProva.luci(); return [...passiTrame(scena, t => renderer.initTexture(t), viste, maschera.uniforms), ...passiDi(scena, disegnaUno, visti)] })
      if (post && ACCESI.post) { visti.add('post'); coda.metti(() => post.compilaQuadro()) }
      return
    }
    if (!coda.quanti && resto.length) coda.metti(resto.shift())
    if (coda.quanti) coda.passo()
    else { cancelAnimationFrame(rafAnticipo); rafAnticipo = 0 }
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

  // il compagno, disegnato come l'eroe ma con i dati del suo alleato (corsa.come); la sua torcia non sposta la luce di scena, e sopra
  // la testa il suo nome
  const luciDelCompagno = { torcia: () => 1, q: 0 }
  function disegnaIlCompagno(corsa, o) {
    const i = corsa.persone.findIndex(p => p !== corsa.persona)
    if (i < 0) return
    if (!compagno3d) compagno3d = creaEroe3d(gruppo('eroe'))
    corsa.come(i, () => disegnaEroe(compagno, corsa, { ...o, luci: luciDelCompagno, fiamma: null, scintille: null, modello: compagno3d }))
    const d = compagno.disegnato, nome = corsa.persone[i].nome || ''
    if (!d || !nome) return
    const p = cam.schermo(d.x, (compagno.alto || 1.4) + 0.45, d.z)
    etichette.metti(p.x, p.y, `compagno|${nome}`, () => `<span class="sot3d-nome-compagno">${nome.replace(/[<>&"]/g, '')}</span>`, { compagno: '1' })
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
    if (cantiere || !piano || piano.liv !== corsa.livello || piano.paesaggio !== paesaggioDi(corsa)) {
      // a passi col riscaldamento (`&spegni=riscaldamento`: tutto in un fotogramma, com'era); il fotogramma che lo finisce non fa altro
      // entrando: i modelli dei mostri e dell'eroe, la roba, al prossimo
      if (nuovoPiano(corsa, ACCESI.riscaldamento) || entrando) { contaIngresso((renderer.info.programs || []).length, t0, ms); return }
    }
    if (mostri3d) mostri3d.nuovePerFotogramma = entrando ? 1 : Infinity   // entrando, un modello nuovo per fotogramma (mostro3d.js)
    // entrando, l'eroe 3D montato e vestito in un fotogramma suo (dopo, i vestiti nuovi li rifà `aggiorna`, come sempre)
    if (entrando && eroe3d && eroe3d.prepara(corsa)) { contaIngresso((renderer.info.programs || []).length, t0, ms); return }
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

    figure.inizia(); figureEroe.inizia(); aloni.inizia(); macchie.inizia(); colonne.inizia(); etichette.inizia()
    cose.disegna(corsa, { t, dt: dtVero, dtScena: dt, palco: scontro.palco ? { campo: scontro.palco.campo, fx } : null, salta })
    if (effetti3d) { statiAddosso(fx); effetti3d.aggiorna(dt) }
    // la fonte bevuta (lo dice il motore): l'acqua va all'eroe e la fontana si svuota, una volta sola
    const fo = piano.fontana
    if (fo && fo.roba.morto && fo.stato === 'piena') { if (fo.usa(eroe)) eroe.cura = 1.2 }
    for (const s of piano.sorgenti) if (s.cella != null) s.vis = piano.vis.ora[s.cella] || 0
    luci.distribuisci(piano.sorgenti, eroe.x, eroe.z, t)
    disegnaEroe(eroe, corsa, { figure: figureEroe, luci, etichette, camera: cam, dt: dtVero, dtScena: dt, t, fontana: fo, portale: (passando && passando.portale) || piano.portale, bersaglio: scontro.bersaglio(corsa),
                       fiamma: fiammaEroe, aloni, scintille: ACCESI.scintille ? scintille : null, modello: eroe3d })
    if (eroe.disegnato) macchie.metti(eroe.disegnato.x, eroe.disegnato.z, 0.36)
    if (corsa.persone && corsa.persone.length > 1) disegnaIlCompagno(corsa, { figure: figureEroe, etichette, camera: cam, dt: dtVero, dtScena: dt, t, bersaglio: scontro.bersaglio(corsa), aloni })
    if (corsa.persone && corsa.persone.length > 1 && compagno.disegnato) macchie.metti(compagno.disegnato.x, compagno.disegnato.z, 0.36)
    luci.spegni(dtVero)
    // le scintille delle torce: solo da quelle che si vedono adesso
    if (ACCESI.scintille) for (const s of piano.sorgenti) if (s.trema && s.vis > 0.2 && Math.random() < dt * 3) scintille.emetti(s.pos.x, s.pos.y - 0.05, s.pos.z - 0.15, 1, { forza: 0.3, su: 1.4, vita: 0.9, caldo: 0.3, taglia: 0.035 })
    contorno.feste(this_.colonne, this_.numerini, quadro.orologio || 0, eroe, colonne, etichette)
    scontro.segni(corsa, dtVero, azione.roba, t)
    figure.chiudi(); figureEroe.chiudi(); aloni.chiudi(); macchie.chiudi(); colonne.chiudi(); etichette.chiudi()

    // la telecamera: sull'eroe, o sul palco sopra il pannello
    // in due il punto in mezzo ai due eroi: tutti e due nello schermo (LONTANO in motore/in-due.js)
    if (!scontro.centro(centro)) {
      const c2 = corsa.persone && corsa.persone.length > 1 && compagno.disegnato
      if (c2) centro.set((eroe.disegnato.x + c2.x) / 2, 0, (eroe.disegnato.z + c2.z) / 2)
      else centro.set(eroe.disegnato.x, 0, eroe.disegnato.z)
    }
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
    piano.terreno.ritaglia(cam.camera)
    if (piano.fusi) piano.fusi.ritaglia(cam.camera)
    piano.botti.aggiorna(dt)

    S.rosso *= Math.exp(-5 * dtVero)
    figure.nitido(scontro.palco ? 1 : 0, dtVero); figureEroe.nitido(scontro.palco ? 1 : 0, dtVero)
    CONTORNO_PELLE.value += ((scontro.palco ? LUCE.contornoScontro : 0) - CONTORNO_PELLE.value) * verso(dtVero, 3)
    if (post) {
      const u = post.uni
      u.uT.value = t; u.uRosso.value = S.rosso * 0.6; u.uLampo.value = Math.max(0, luci.lampo.intensity - 15) * 0.004
    }
    contorno.mappina(corsa, this_.mappaGrande, !!scontro.palco)
    contorno.dataset(corsa, eroe, scala)
    ctx.misure.msJs = performance.now() - t0
    // l'ombra a fotogrammi alterni (fascia bassa): la mappa vecchia resta giusta con la sua luce, va solo un fotogramma indietro
    if (ACCESI.ombre && ACCESI.ombraOgni > 1) renderer.shadowMap.needsUpdate = (giri++ % ACCESI.ombraOgni) === 0
    if (attesaShader) { if (performance.now() < attesaShader && !shaderPronti()) return; attesaShader = 0 }
    elementi(scena)
    const p0 = (renderer.info.programs || []).length
    if (entrando) {
      if (entra()) { contaIngresso(p0, t0, ms); return }   // ancora shader da chiedere: niente disegno, resta il quadro di prima
      entrando = 0; coda.svuota(); scaldaDa = S.tempo + 0.3
    }
    const t1 = performance.now()
    if (post && ACCESI.post) post.disegna(scena, cam.camera); else renderer.render(scena, cam.camera)
    ctx.misure.msDisegno = performance.now() - t1
    ctx.conta(ms)
    if (S.tempo >= scaldaDa && !(fx && fx.attivo)) {   // dopo il disegno: la GPU fa prima quello che serve adesso
      if (!coda.quanti && resto.length) coda.metti(resto.shift())
      // esplorando un fotogramma sì e uno no; nello scontro, mentre si legge la domanda, uno per fotogramma (il primo colpo li vuole pronti)
      if (coda.quanti) coda.passo({ riposo: scontro.palco ? 0 : 1 })
    }
    contaIngresso(p0, t0, ms, true)
    if (aFotogrammaFinito) { const f = aFotogrammaFinito; aFotogrammaFinito = null; f() }
  }
  // dall'entrata nel piano, per ogni fotogramma: i programmi nati (le misure: il picco deve stare a 1-2), i ms del giro di qui (`js`,
  // compreso il disegno) e quelli dal fotogramma prima (`ms`: il fermo che si vede, dove la GPU fa aspettare)
  function contaIngresso(p0, t0, ms, disegnato = false) {
    const g = S.ingresso
    if (!g) return
    const n = (renderer.info.programs || []).length - p0
    if (n > g.picco) g.picco = n
    if (disegnato && !g.disegnato) { g.disegnato = true; g.primoDisegno = n; g.attesa = g.fotogrammi.length }   // `attesa`: i fotogrammi senza disegno
    if (g.fotogrammi.length < 200) { g.fotogrammi.push(n); g.js.push(Math.round(performance.now() - t0)); g.ms.push(Math.round(ms)) }
  }

  const this_ = {
    canvas,
    numerini: [],      // l'esperienza di un mostro battuto che sale: { testo, x, y, t } (Gioco.vue)
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
    /**
     * La discesa scaldata prima (Gioco.vue, scaldaDiscesa) entra nella pagina: la sua tela sta sotto `tela` (quella della pagina, vuota:
     * prende il dito e dà le misure), le scritte vanno in `stratoPagina` e i segni per le prove (`data-eroe`…) su `tela`.
     */
    sposta(tela, stratoPagina) { etichette.sposta(stratoPagina); contorno.sposta(stratoPagina, tela) },
    misura,
    segui(_liv, _x, _y, copertoPx = 0) { coperto = copertoPx },
    mostra(q) { quadro = q },
    avvia() {
      // dopo la discesa scaldata: quello che non ha fatto in tempo si finisce entrando a passi, senza disegnare (vedi `entra`)
      if (daAnticipo) {
        daAnticipo = false
        S.ingresso = { ...nuovoIngresso(), anticipato: true }
        if (coda.quanti && ACCESI.riscaldamento && !parallelo) entrando = performance.now() + ENTRATA_MAX
      }
      this_.smettiAnticipo()
      if (!raf && vivo) { prima = 0; raf = requestAnimationFrame(passo) }
    },
    ferma() { cancelAnimationFrame(raf); raf = 0; this_.smettiAnticipo() },
    /** La discesa scaldata prima (vedi `anticipo`): `corsa` è quella che si scenderà, o una uguale. `avvia` la smette. */
    anticipa(corsa) { quadro = { corsa, orologio: 0, fx: null }; daAnticipo = true; if (!rafAnticipo && vivo) rafAnticipo = requestAnimationFrame(anticipo) },
    smettiAnticipo() { if (rafAnticipo) { cancelAnimationFrame(rafAnticipo); rafAnticipo = 0 } },
    get anticipato() { return { daScaldare: daFare(), programmi: (renderer.info.programs || []).length, inCorso: !!rafAnticipo } },
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
      modellate.push(...perTerra.modellati)
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
               // entrando in un piano non si disegna ancora: chi aspetta le figure (o i mostri 3D) aspetta il disegno
               figure: figure && !entrando ? figure.quante : 0, pixelSprite: Math.round(cam.pixelSprite * 100) / 100, scenario: piano ? piano.aspetto.chiave : null, palco: !!scontro.palco,
               programmi: (renderer.info.programs || []).length, memoria: { ...renderer.info.memory }, ritaglio: piano && piano.terreno.ritagliati,
               daScaldare: daFare(), entrando: !!entrando, ingresso: S.ingresso ? { picco: S.ingresso.picco, primoDisegno: S.ingresso.primoDisegno ?? null, fotogrammi: S.ingresso.fotogrammi.length } : null,
               mostri3d: mostri3d && !entrando ? mostri3d.visibili : 0, modelli3d: mostri3d ? mostri3d.quante : 0, effetti3d: effetti3d ? effetti3d.quanti : 0, perTerra: perTerra.quante }   // gli shader compilati: se crescono a ogni colpo, il telefono si ferma a compilare
    },
    // il banco: `n` disegni della scena così com'è, ognuno aspettato (la lettura di un pixel): i ms della tela da sola, senza
    // la pagina attorno né i 60 Hz (docs/core/vecchio-telefono.md, «Lo scontro»); la mediana e il p90
    banco(n = 20) {
      const gl = ctx.gl, px = new Uint8Array(4), v = []
      for (let i = 0; i < n + 2; i++) {
        const t0 = performance.now()
        if (ACCESI.ombre && ACCESI.ombraOgni > 1) renderer.shadowMap.needsUpdate = i % ACCESI.ombraOgni === 0
        if (post && ACCESI.post) post.disegna(scena, cam.camera); else renderer.render(scena, cam.camera)
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
    ingresso() { return S.ingresso && { ...S.ingresso, troppi: coda.troppi } },   // i programmi nati in ogni fotogramma dall'entrata nel piano (le misure)
    get corsa() { return quadro ? quadro.corsa : null },
    get palco() { return scontro.palco },
    distruggi() {
      vivo = false
      if (osserva) osserva.disconnect()
      this_.ferma()
      racconto.svuota()
      if (effetti3d) effetti3d.svuota()
      if (mostri3d) mostri3d.via()
      perTerra.via()
      cam.ripristina()
      lasciaCantiere()
      if (piano) piano.via()
      piano = null
      for (const p of inArrivo.values()) liberaTrame({ pav: p.pav || {}, muro: p.muro || {} })
      for (const x of [aloni, macchie, colonne, anelli, scintille, polvere, etichette, contorno, figure, figureEroe, fiammaEroe]) if (x) x.via()
      for (const t of trame.values()) liberaTrame(t)
      if (legno) { legno.map.dispose(); legno.normalMap.dispose() }
      if (tex) tex.dispose()
      if (norm) norm.dispose()
      if (post) post.via()
      maschera.via()
      luci.vertice.via()
      ctx.via()
    },
  }
  return this_
}
