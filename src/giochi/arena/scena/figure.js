// Le truppe dell'arena sono creature del castello: chi è chi, a che misura, e
// quale fotogramma. Nessuna regola qui (il motore non sa che esistano gli
// sprite) e nessun prezzo: solo il disegno. Le figure del foglio guardano a
// DESTRA e quasi tutte hanno solo il respiro (4 fotogrammi); lupo e drago
// hanno anche i passi di lato (6 fotogrammi). Di schiena o di fronte non esiste
// niente per tutte: in campo guardano dalla parte della loro squadra.
import { PEZZI } from '../../castello/dati/figure.js'
import { NITIDO, NITIDI } from '../../sotterraneo/dati/atlante.js'

export const CREATURA = {
  scheletri: 'scheletro', guardiano: 'scheletro-scudo', lupi: 'lupo', diavoletto: 'diavoletto',
  pipistrelli: 'pipistrello', bestie: 'bestia-cornuta', negromante: 'negromante', golem: 'golem', drago: 'drago',
}

// pixel dello schermo per pixel del foglio, a larghezza di campo 390
export const SCALA = {
  scheletri: 0.42, guardiano: 0.36, lupi: 0.4, diavoletto: 0.38,
  pipistrelli: 0.45, bestie: 0.36, negromante: 0.36, golem: 0.5, drago: 0.42,
}

// le pose dai nomi dei pezzi (meno `NON_SUE`): mostro:<chi>:<n> è il respiro, mostro:<chi>:lato:<n> i passi
// pose del foglio che la truppa non fa: la fiammata della bestia cornuta (le bestie colpiscono da vicino)
const NON_SUE = new Set(['mostro:bestia-cornuta:2'])
const pose = {}
for (const nome of Object.keys(PEZZI)) {
  const [fam, chi, verso, n] = nome.split(':')
  if (fam !== 'mostro' || NON_SUE.has(nome)) continue
  const p = (pose[chi] ||= { respiro: [], lato: [] })
  if (n === undefined) p.respiro.push(nome)
  else if (verso === 'lato') p.lato.push(nome)
}

/* il fotogramma di una truppa: i passi se li ha e cammina, se no il respiro
   (sfasato per truppa, così un gruppo non respira all'unisono) */
export function fotogramma(id, tempo, cammina, sfasa = 0) {
  const p = pose[CREATURA[id]]
  if (p.lato.length) {
    const serie = p.lato
    return serie[Math.floor(tempo * (cammina ? 8 : 3) + sfasa) % serie.length]
  }
  const serie = p.respiro
  return serie[Math.floor(tempo * 5 + sfasa) % serie.length]
}

export function guastiDelleFigure() {
  const g = []
  for (const [id, c] of Object.entries(CREATURA)) {
    if (!pose[c] || (!pose[c].respiro.length && !pose[c].lato.length)) g.push(`${id}: la creatura ${c} non ha fotogrammi`)
    if (!(SCALA[id] > 0)) g.push(`${id}: manca la scala`)
  }
  return g
}

/* L'arco degli arcieri: nel foglio lo scheletro è a mani vuote, e l'arco è quello dipinto del
   sotterraneo (`arco-corto`, il pezzo grande), in mano davanti al corpo come l'eroe là
   (sotterraneo/scena/tela.js, `arma`): un punto fisso, non un aggancio per fotogramma. Le armi
   del foglio guardano a destra; `specchia` le gira. `tira` (0-1) è il rinculo del colpo. Finché
   l'immagine non è pronta, un arco disegnato. (x, piede) è il piede della figura, `lw`×`lh` la
   sua misura a schermo. */
let foglioArmi = null
function armi() {
  if (!foglioArmi && typeof Image !== 'undefined') {
    foglioArmi = new Image()
    foglioArmi.src = NITIDO
  }
  return foglioArmi && foglioArmi.complete && foglioArmi.naturalWidth ? foglioArmi : null
}

/* per chi dipinge una volta sola (il ritratto delle carte): aspetta che l'arco ci sia */
export function armiPronte() {
  const img = (armi(), foglioArmi)
  if (!img || (img.complete && img.naturalWidth)) return Promise.resolve()
  return new Promise(ok => { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', ok, { once: true }) })
}

export function arco(c, x, piede, lw, lh, specchia = false, tira = 0) {
  const v = specchia ? -1 : 1
  const img = armi()
  if (img) {
    const [sx, sy, w, h] = NITIDI['arco-corto']
    const ah = lh * 0.85, aw = ah * w / h
    const cx = x + v * (lw * 0.42 - tira * lh * 0.06), basso = piede - lh * 0.06
    c.save()
    c.translate(cx, basso - ah)
    if (specchia) c.scale(-1, 1)
    c.drawImage(img, sx, sy, w, h, -aw / 2, 0, aw, ah)
    c.restore()
    return
  }
  const cx = x + v * lw * 0.1, cy = piede - lh * 0.5, r = lh * 0.3, a = 1.15
  c.save()
  c.lineCap = 'round'
  c.strokeStyle = '#3b2412'; c.lineWidth = Math.max(1.6, lh * 0.085)
  c.beginPath(); c.arc(cx, cy, r, v > 0 ? -a : Math.PI - a, v > 0 ? a : Math.PI + a); c.stroke()
  c.strokeStyle = '#a8703a'; c.lineWidth = Math.max(1, lh * 0.045)
  c.beginPath(); c.arc(cx, cy, r, v > 0 ? -a : Math.PI - a, v > 0 ? a : Math.PI + a); c.stroke()
  c.restore()
}
