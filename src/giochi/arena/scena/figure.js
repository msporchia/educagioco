// Le truppe dell'arena: a che misura e quale posa. Nessuna regola qui (il motore non sa che esistano gli sprite) e nessun prezzo:
// solo il disegno. Ogni squadra ha il suo foglio dipinto (`dati/truppe-dipinte.js`, voce 12b di DA-GENERARE.md), con quattro pose
// per truppa: ferma, due passi, il colpo. Le figure guardano a DESTRA: in campo il nemico si specchia. Vedi docs/arena/grafica.md.
import { PEZZI as DIPINTE, RISOLUZIONE } from '../dati/truppe-dipinte.js'

export { DIPINTE, RISOLUZIONE }

// pixel dello schermo per pixel del foglio delle figure del castello, a larghezza di campo 390: l'atlante è RISOLUZIONE volte più fitto
export const SCALA = {
  scheletri: 0.42, guardiano: 0.36, lupi: 0.4, diavoletto: 0.38,
  pipistrelli: 0.45, bestie: 0.36, negromante: 0.36, golem: 0.5, drago: 0.42,
}

const FERMA = 0, COLPO = 3
const giro = (tempo, al, n) => ((Math.floor(tempo * al) % n) + n) % n

/* La posa di una truppa: il colpo finché dura, chi vola sbatte le ali sempre (a metà, su, a metà, giù), chi cammina alterna i due
   passi, ferma è ferma. `sfasa`: così un gruppo non va all'unisono. `lato`: 'io' o 'nem', la squadra e il suo foglio. */
export function fotogramma(id, lato, tempo, { cammina = false, colpo = false, vola = false } = {}, sfasa = 0) {
  const n = colpo ? COLPO : vola ? [0, 1, 0, 2][giro(tempo + sfasa, 8, 4)] : cammina ? 1 + giro(tempo + sfasa, 6, 2) : FERMA
  return `${lato}:${id}:${n}`
}

/* tutte le pose di una truppa, per prepararle prima della battaglia */
export const fotogrammiDi = (id, lato) => [0, 1, 2, 3].map(n => `${lato}:${id}:${n}`)

export function guastiDelleFigure() {
  const g = []
  for (const id of Object.keys(SCALA)) {
    if (!(SCALA[id] > 0)) g.push(`${id}: manca la scala`)
    for (const lato of ['io', 'nem']) for (const nome of fotogrammiDi(id, lato)) if (!DIPINTE[nome]) g.push(`${nome}: non è in truppe-dipinte.js`)
  }
  return g
}
