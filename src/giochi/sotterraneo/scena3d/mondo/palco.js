// Lo scontro di sopra disegnato sul terreno dove si è (docs/sotterraneo/mondo-aperto-mostri.md, «La scena»). Il motore lo gioca su un
// palco di una stanza (motore/palco.js, l'eroe in EROE_SUL_PALCO); qui il palco è un gruppo posato nel mondo con l'eroe sui suoi piedi,
// e dentro ci sono i pezzi dello scontro delle discese, gli stessi: le figure (contorno compreso), la roba (cose.js), l'eroe (eroe.js),
// il racconto dei colpi (racconto.js), il palco coi posti e il bersaglio (scontro.js, che cerca i posti sulle celle del mondo dove si
// cammina), gli anelli, le scintille. Ogni figura si posa sulla quota del terreno sotto di lei. Verso Gioco.vue è un pittore come
// quello delle discese (`mostra`, `segui`, `premi`, `colpo`, `aggancia`, `schermoDi`, `grafica`…): chi gioca non disegna.
import { Group, Color, Vector3, Raycaster } from 'three'
import { creaFigure } from '../figure.js'
import { creaAloni, creaColonne, creaAnelli } from '../segni.js'
import { creaScintille } from '../particelle.js'
import { creaEtichette } from '../etichette.js'
import { creaCose } from '../cose.js'
import { creaEroe, disegnaEroe } from '../eroe.js'
import { creaRacconto } from '../racconto.js'
import { creaScontro } from '../scontro.js'
import { EROE_SUL_PALCO } from '../../motore/palco.js'
import { mascheraPiena } from './persone.js'
import { creaEroe3d, eroe3dAcceso } from '../eroe3d.js'
import { creaMostri3d, mostri3dAccesi } from '../mostro3d.js'
import { creaGestore, statoDi } from '../effetti3d/gestore.js'
import { ACCESI } from '../costanti.js'
import { statiDel } from '../../viste/campo.js'

// Dove sta il palco nel mondo: la cella dell'eroe sul palco cade sui suoi piedi. Torna l'origine (da sommare alle coordinate del
// palco) e la pianta per scena3d/palco.js: una cella del palco si calpesta se si calpesta il mondo sotto il suo centro. Puro
export function palcoNelMondo(io, passa) {
  const O = { x: io.x - (EROE_SUL_PALCO.x + 0.5), z: io.z - (EROE_SUL_PALCO.y + 0.5) }
  const pianta = {
    calpestabile: (x, y) => passa(Math.floor(x + 0.5 + O.x), Math.floor(y + 0.5 + O.z)),
    id: (x, y) => (y + 512) * 2048 + (x + 512),
  }
  return { O, pianta }
}

// `scena` la scena del mondo, `quota(x, z)` il terreno, `cam` la telecamera del mondo (scena3d/mondo/veduta.js), `strato` lo strato
// HTML delle scritte, il resto è l'atlante delle figure
export function creaPalcoSopra(scena, { tex, norm, larga, alta, pezzi, quota, cam, strato }) {
  const gruppo = new Group()
  gruppo.visible = false
  scena.add(gruppo)
  const maschera = mascheraPiena()
  const base = { tex, norm, larga, alta, pezzi, maschera, contorno: true }
  const figure = creaFigure(gruppo, { ...base, max: 48 })
  const figureEroe = creaFigure(gruppo, { ...base, max: 8, ombra: false })
  const aloni = creaAloni(gruppo, 24), colonne = creaColonne(gruppo, 4), anelli = creaAnelli(gruppo)
  const scintille = creaScintille(gruppo, 500)
  const etichette = creaEtichette(strato)
  let O = { x: 0, z: 0 }, y0 = 0
  const suolo = (x, z) => quota(x + O.x, z + O.z) - y0
  // le figure del palco si posano sul terreno: (x, z) del palco, la quota del mondo sotto
  const sulTerreno = f => ({ ...f, metti: (n, x, y, z, o) => f.metti(n, x, y + suolo(x, z), z, o), o: () => f.o(), alto: (n, s) => f.alto(n, s), largo: (n, s) => f.largo(n, s) })
  const fig = sulTerreno(figure), figE = sulTerreno(figureEroe)
  // la telecamera vista dal palco: i conti fra schermo e palco passano dal mondo
  const ray = new Raycaster()
  const camPalco = {
    get L() { return cam.L }, get A() { return cam.A },
    schermo(x, y, z, p = { x: 0, y: 0 }) { return cam.schermo(x + O.x, y + y0 + suolo(x, z), z + O.z, p) },
    mira(px, py) { const { o, d } = cam.raggio(px, py); ray.set(o, d); return ray },
  }
  // sopra è giorno: niente luci puntiformi (ognuna costerebbe a ogni pixel di ogni materiale del mondo); il racconto le accende
  // lo stesso, qui non illuminano niente. Il lampo del colpo resta sulle figure (bianco) e nelle scintille
  const luce = () => ({ color: new Color(), position: new Vector3(), intensity: 0 })
  const luci = { lampo: luce(), magia: luce(), tinta: new Color(), tTinta: 0, q: 0, torcia: () => 1 }
  const eroe = creaEroe()
  // i modelli 3D e gli effetti 3D come nello scontro delle discese (scena3d/indice.js, docs/sotterraneo/mostri-3d.md): dentro il gruppo
  // del palco, quindi sul prato dove si è; lo sprite resta se il modello manca (`#sprite`, `#eroe2d` li spengono)
  const eroe3d = eroe3dAcceso() ? creaEroe3d(gruppo) : null
  const mostri3d = mostri3dAccesi() && ACCESI.mostri3d > 0 ? creaMostri3d(gruppo, { quanti: () => ACCESI.mostri3d }) : null
  const effetti3d = ACCESI.effetti3d ? creaGestore(gruppo, { camera: cam.camera }) : null
  const cose = creaCose({ figure: fig, aloni, colonne, etichette, camera: camPalco, mostri3d, vicino: () => eroe.disegnato })
  const S = { eroe, campo: null, scintille, luci, anelli, fermo: 0, scossa: 0, rosso: 0, tBolla: 9, tempo: 0, colpoEroe: null, stato: cose.stato,
              mostri3d, effetti3d, eroe3d }
  const racconto = creaRacconto(S)
  let piano = null
  let opz = { bersaglio: null, accorcia: null }
  const scontro = creaScontro({ S, cam: camPalco, eroe, getPiano: () => piano, getCose: () => cose, getFigure: () => figure, anelli, cieca: 320 })
  let quadro = null, coperto = 0, attivo = false, centroPalco = new Vector3()
  // gli stati addosso ai mostri dello scontro, in 3D (come in scena3d/indice.js): quelli che il racconto mostra adesso, o la verità del motore
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

  const pittore = {
    canvas: null, numerini: [], colonne: [], mappaGrande: false, scala: 3,
    misura() { return true }, zoomA() { return false }, avvia() {}, ferma() {}, distruggi() {}, trascina() {},
    attacca() { return null },
    segui(_liv, _x, _y, copertoPx = 0) { coperto = copertoPx },
    mostra(q) { quadro = q },
    schermoDi(x, y) { const p = camPalco.schermo(x, 0, y); return { x: p.x, y: p.y } },
    testaDi(corsa) { const d = eroe.disegnato; const p = d ? camPalco.schermo(d.x, (eroe.alto || 1) + 0.3, d.z) : camPalco.schermo(corsa.eroe.x, 1.3, corsa.eroe.y); return { x: p.x, y: p.y } },
    cellaDa() { return { x: -1, y: -1 } },
    premi(p) { if (quadro && scontro.palco) scontro.tocca(p, quadro.fx, { bersaglio: opz.bersaglio, accorcia: opz.accorcia }) },
    colpo(a, modo) { racconto.colpo(a, modo) },
    aggancia(chi, el) { scontro.aggancia(chi, el) },
    attraversa(fatto) { if (fatto) fatto() },
    get palco() { return scontro.palco },
    get eroe() { return eroe },
    get corsa() { return quadro ? quadro.corsa : null },
    statoDi(r) { return cose.stato(r) },
    aSchermo(x, y, z) { const p = camPalco.schermo(x, y, z); return [p.x, p.y] },
  }

  return {
    pittore,
    get attivo() { return attivo },
    get coperto() { return coperto },
    // si apre sul mondo: l'eroe in (io.x, io.z), `passa(x, y)` le celle dove si cammina, `daDove(i)` dove stava nel mondo il mostro `i`
    // (le figure partono da lì e corrono ai loro posti). `bersaglio`, `accorcia`: il tocco su un mostro e sul racconto (Gioco.vue)
    apri({ io, passa, daDove, bersaglio, accorcia, corsa }) {
      const p = palcoNelMondo(io, passa)
      O = p.O; y0 = quota(io.x, io.z)
      gruppo.position.set(O.x, y0, O.z)
      gruppo.updateMatrixWorld(true)
      piano = { pianta: p.pianta, ingombri: new Set(), terreno: { abbassa() {} } }
      opz = { bersaglio, accorcia }
      Object.assign(eroe, creaEroe())
      for (const r of corsa.livello.robe) {
        if (r.che !== 'mostro' || r.mondo == null) continue
        const d = daDove(r.mondo), s = cose.stato(r)
        if (d) { s.x = d.x - O.x; s.z = d.z - O.z }
        s.specchio = s.x > corsa.eroe.x
      }
      quadro = { corsa, fx: null }
      attivo = true
      gruppo.visible = true
    },
    chiudi() {
      if (!attivo) return
      scontro.chiudi()
      racconto.svuota()
      if (effetti3d) { effetti3d.spegniStati(); effetti3d.svuota() }
      attivo = false
      gruppo.visible = false
      quadro = null
      piano = null
      etichette.inizia(); etichette.chiudi()
      for (const k of ['tocco', 'arrivo', 'bersaglio', 'bolla']) anelli[k].visible = false
    },
    // a ogni fotogramma del mondo; `ombra(x, y, z, r)` l'ombra a contatto (persone.js), `punti` la misura delle scintille (px del
    // disegno). Torna false se non c'è niente da disegnare
    passo(dtVero, t, ombra, punti) {
      if (!attivo || !quadro || !quadro.corsa) return false
      const corsa = quadro.corsa
      S.tempo += dtVero
      let dt = dtVero
      if (S.fermo > 0) { S.fermo -= dtVero; dt = 0 }
      const fx = quadro.fx || null
      scontro.guarda(corsa, fx)
      if (fx) racconto.leggi(fx)
      racconto.aggiorna(dt)
      if (effetti3d) { statiAddosso(fx); effetti3d.aggiorna(dt) }
      figure.inizia(); figureEroe.inizia(); aloni.inizia(); colonne.inizia(); etichette.inizia()
      cose.disegna(corsa, { t, dt: dtVero, dtScena: dt, palco: scontro.palco ? { campo: scontro.palco.campo, fx } : null, salta: null })
      disegnaEroe(eroe, corsa, { figure: figE, luci, etichette, camera: camPalco, dt: dtVero, dtScena: dt, t, bersaglio: scontro.bersaglio(corsa), aloni, scintille, modello: eroe3d })
      scontro.segni(corsa, dtVero, null, t)
      // gli anelli stanno per terra: alla quota del prato sotto di loro
      for (const k of ['tocco', 'arrivo', 'bersaglio']) { const a = anelli[k]; if (a.visible) a.position.y = 0.04 + suolo(a.position.x, a.position.z) }
      if (anelli.bolla.visible) anelli.bolla.position.y = 0.75 + suolo(anelli.bolla.position.x, anelli.bolla.position.z)
      figure.chiudi(); figureEroe.chiudi(); aloni.chiudi(); colonne.chiudi(); etichette.chiudi()
      // le ombre a contatto: l'eroe e chi è ancora in piedi
      if (ombra) {
        const d = eroe.disegnato
        if (d) ombra(d.x + O.x, y0 + suolo(d.x, d.z), d.z + O.z + 0.1, 0.95)
        if (scontro.palco) for (const s of scontro.palco.stati) if (!(s.morente > 1)) ombra(s.x + O.x, y0 + suolo(s.x, s.z), s.z + O.z + 0.1, 1)
      }
      scintille.aggiorna(dt, punti)
      S.scossa = Math.max(0, S.scossa - dtVero * 2.2)
      return true
    },
    // il centro del palco nel mondo e quante celle servono perché ci stiano tutti (la telecamera), o null fuori dallo scontro
    centro() {
      if (!attivo) return null
      if (!scontro.centro(centroPalco)) { const d = eroe.disegnato || { x: EROE_SUL_PALCO.x + 0.5, z: EROE_SUL_PALCO.y + 0.5 }; centroPalco.set(d.x, 0, d.z); scontro.celle = 9.5 }
      return { x: centroPalco.x + O.x, z: centroPalco.z + O.z, celle: scontro.celle, scossa: S.scossa }
    },
    via() {
      for (const x of [figure, figureEroe, aloni, colonne, anelli, scintille, etichette]) x.via()
      maschera.t.dispose()
      if (effetti3d) effetti3d.svuota()
      if (mostri3d) mostri3d.via()
      if (eroe3d) eroe3d.toglie()
      scena.remove(gruppo)
    },
  }
}
