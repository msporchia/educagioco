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
const CAMMINO = [1, 0, 2, 0]           // un piede avanti, di mezzo (la ferma), l'altro piede avanti, di mezzo
const ALI = [0, 1, 0, 2]               // a metà, su, a metà, giù
const PASSO = 0.45                     // la strada di un passo, in altezze della figura: con la velocità dà la cadenza
const BATTITO = 280                    // pose d'ala al secondo per un'altezza di 1: le ali grandi battono più piano
const SALTO = 0.05                     // quanto si alza a metà passo, in altezze della figura

/* quanto è alta una truppa in unità del campo */
export const altoNelMondo = id => DIPINTE[`io:${id}:0`][3] / RISOLUZIONE * SCALA[id]

/* La posa di una truppa e quanto si alza da terra (in unità del campo): il colpo finché dura, chi vola sbatte le ali sempre, chi
   cammina mette un piede avanti, passa per la ferma, mette l'altro. Il passo va con la velocità (`vel`, in unità al secondo), così i
   piedi non scivolano, e il corpo si alza a metà passo e torna giù quando il piede tocca. `sfasa` (in secondi): così un gruppo non va
   all'unisono. `lato`: 'io' o 'nem', la squadra e il suo foglio. Vedi docs/arena/grafica.md, «Il passo». */
export function andatura(id, lato, tempo, { cammina = false, colpo = false, vola = false, vel = 0 } = {}, sfasa = 0) {
  const alto = altoNelMondo(id), t = tempo + sfasa
  let n = FERMA, salto = 0
  if (colpo) n = COLPO
  else if (vola) n = ALI[Math.floor(t * BATTITO / alto) % 4]
  else if (cammina) {
    const giro = (t * 2 * vel / (PASSO * alto)) % 4
    n = CAMMINO[Math.floor(giro)]
    salto = Math.sin((giro - 0.5) * Math.PI / 2) ** 2 * SALTO * alto
  }
  return { fg: `${lato}:${id}:${n}`, salto }
}

export const fotogramma = (...a) => andatura(...a).fg

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
