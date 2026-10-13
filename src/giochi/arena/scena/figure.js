// Le truppe dell'arena sono creature del castello: chi è chi, a che misura, e
// quale fotogramma. Nessuna regola qui (il motore non sa che esistano gli
// sprite) e nessun prezzo: solo il disegno. Le figure del foglio guardano a
// DESTRA e quasi tutte hanno solo il respiro (4 fotogrammi); lupo e drago
// hanno anche i passi di lato (6 fotogrammi). Di schiena o di fronte non esiste
// niente per tutte: in campo guardano dalla parte della loro squadra.
import { PEZZI } from '../../castello/dati/figure.js'

export const CREATURA = {
  scheletri: 'scheletro', guardiano: 'scheletro-scudo', lupi: 'lupo', diavoletto: 'diavoletto',
  pipistrelli: 'pipistrello', negromante: 'negromante', golem: 'golem', drago: 'drago',
}

// pixel dello schermo per pixel del foglio, a larghezza di campo 390
export const SCALA = {
  scheletri: 0.42, guardiano: 0.36, lupi: 0.4, diavoletto: 0.38,
  pipistrelli: 0.45, negromante: 0.36, golem: 0.5, drago: 0.42,
}

// le pose dai nomi dei pezzi: mostro:<chi>:<n> è il respiro, mostro:<chi>:lato:<n> i passi
const pose = {}
for (const nome of Object.keys(PEZZI)) {
  const [fam, chi, verso, n] = nome.split(':')
  if (fam !== 'mostro') continue
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

/* L'arco degli arcieri: nel foglio lo scheletro è a mani vuote. Si disegna in mano, davanti al
   corpo (le figure guardano a destra; `specchia` le gira); `tira` (0-1) è la corda tirata del
   colpo. (x, piede) è il piede della figura, `lw`×`lh` la sua misura a schermo. */
export function arco(c, x, piede, lw, lh, specchia = false, tira = 0) {
  const v = specchia ? -1 : 1
  const cx = x + v * lw * 0.1, cy = piede - lh * 0.5, r = lh * 0.3, a = 1.15
  c.save()
  c.lineCap = 'round'
  c.strokeStyle = '#3b2412'; c.lineWidth = Math.max(1.6, lh * 0.085)
  c.beginPath(); c.arc(cx, cy, r, v > 0 ? -a : Math.PI - a, v > 0 ? a : Math.PI + a); c.stroke()
  c.strokeStyle = '#a8703a'; c.lineWidth = Math.max(1, lh * 0.045)
  c.beginPath(); c.arc(cx, cy, r, v > 0 ? -a : Math.PI - a, v > 0 ? a : Math.PI + a); c.stroke()
  const ex = cx + v * r * Math.cos(a), dy = r * Math.sin(a)
  c.strokeStyle = 'rgba(240,235,220,.9)'; c.lineWidth = Math.max(0.7, lh * 0.02)
  c.beginPath(); c.moveTo(ex, cy - dy); c.lineTo(ex - v * r * 0.5 * tira, cy); c.lineTo(ex, cy + dy); c.stroke()
  c.restore()
}
