// I magazzini (docs/fattoria3d/magazzini.md): il silo del raccolto (rosso), il silo della stalla (bianco) e la dispensa. Il modello sta in un
// `corpo` dentro il gruppo, disegnato già grande quanto la sua impronta: la scena lo rimpicciolisce secondo quanto è cresciuto (`scalaDelCorpo`,
// da 0 a PASSI_PER_EDIFICIO ingrandimenti), così parte piccolo e a ogni ingrandimento si vede crescere, senza mai uscire dalle sue celle.
import * as THREE from 'three'
import { mat, scatola, cilindro, cono, sfera } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'
import { PASSI_PER_EDIFICIO } from '../dati/silos.js'

/** Quanto è grande il corpo con `taglia` passi: largo dal 72% al 100% dell'impronta, alto dal 55% al 125%. */
export function scalaDelCorpo(taglia) {
  const k = Math.max(0, Math.min(1, (taglia || 0) / PASSI_PER_EDIFICIO))
  return { xz: 0.72 + 0.28 * k, y: 0.55 + 0.7 * k }
}

const CERCHIO = 0x8d939a, SCALETTA = 0x6a6e74

/** Un silo tondo: il fusto coi cerchi, la cupola o il cono, la scaletta sul davanti. `alto` è l'altezza del fusto a grandezza piena. */
function silo (g, { fusto, cima, alto = 2.3, r = 0.82, cupola = true, fascia = null }) {
  const mf = mat(fusto)
  cilindro(g, r + 0.06, r + 0.1, 0.16, mat(0xa59d8f), 0, 0.08, 0, 16)                         // lo zoccolo di pietra
  cilindro(g, r, r, alto, mf, 0, 0.16 + alto / 2, 0, 16)
  for (const y of [0.55, 1.1, 1.65, 2.2].filter(y => y < alto)) cilindro(g, r + 0.025, r + 0.025, 0.06, mat(CERCHIO, { metalness: 0.3, roughness: 0.6 }), 0, 0.16 + y, 0, 16)
  if (fascia) cilindro(g, r + 0.03, r + 0.03, 0.22, mat(fascia), 0, 0.16 + alto * 0.82, 0, 16)
  const top = 0.16 + alto
  if (cupola) sfera(g, r + 0.03, mat(cima), 0, top, 0, 1, 0.62, 1, 16)
  else cono(g, r + 0.12, 0.75, mat(cima), 0, top + 0.37, 0, 16)
  // la scaletta sul davanti (verso +z), coi pioli
  const ms = mat(SCALETTA)
  for (const s of [-1, 1]) scatola(g, 0.04, alto, 0.04, ms, s * 0.14, 0.16 + alto / 2, r + 0.07)
  for (let y = 0.35; y < alto; y += 0.28) scatola(g, 0.3, 0.035, 0.035, ms, 0, 0.16 + y, r + 0.07)
  return top + (cupola ? r * 0.62 : 0.75)
}

function costruisciSiloRosso () {
  const g = new THREE.Group(), corpo = new THREE.Group()
  const alto = silo(corpo, { fusto: 0xb83a2e, cima: 0x9aa0a6, alto: 2.3 })
  scatola(corpo, 0.5, 0.5, 0.06, mat(0x6a2a22), 0, 0.45, 0.82)                                // lo sportello in basso
  fondiPerMateriale(corpo)
  g.add(corpo); g.userData.altezzaPiena = alto + 0.3
  return g
}
function costruisciSiloBianco () {
  const g = new THREE.Group(), corpo = new THREE.Group()
  const alto = silo(corpo, { fusto: 0xeeeae0, cima: 0x2f6fb0, alto: 2.2, cupola: false, fascia: 0x2f6fb0 })
  // un bidone del latte accanto
  cilindro(corpo, 0.13, 0.15, 0.36, mat(0xc9cdd2, { metalness: 0.4, roughness: 0.5 }), 0.62, 0.34, 0.62, 10)
  cilindro(corpo, 0.08, 0.13, 0.08, mat(0xc9cdd2, { metalness: 0.4, roughness: 0.5 }), 0.62, 0.56, 0.62, 10)
  fondiPerMateriale(corpo)
  g.add(corpo); g.userData.altezzaPiena = alto + 0.3
  return g
}
/** La dispensa: una casetta di legno 3×2 col portone aperto, gli scaffali dentro con vasi e cassette, l'insegna. */
function costruisciDispensa () {
  const g = new THREE.Group(), corpo = new THREE.Group()
  const w = 2.7, d = 1.7, h = 1.5, legno = mat(0xc89a5e), scuro = mat(0x7b4a24), tettoM = mat(0x8a4a32)
  scatola(corpo, w + 0.1, 0.12, d + 0.1, mat(0xa59d8f), 0, 0.06, 0)
  scatola(corpo, w, h, 0.1, legno, 0, 0.12 + h / 2, -d / 2)                                    // il muro di fondo e i fianchi
  for (const s of [-1, 1]) scatola(corpo, 0.1, h, d, legno, s * (w / 2 - 0.05), 0.12 + h / 2, 0)
  for (const s of [-1, 1]) scatola(corpo, w * 0.3, h, 0.1, legno, s * w * 0.35, 0.12 + h / 2, d / 2)     // il davanti, con il portone in mezzo
  scatola(corpo, w * 0.4, 0.2, 0.1, legno, 0, 0.12 + h - 0.1, d / 2)
  for (const y of [0.45, 0.95]) {                                                              // gli scaffali con la roba
    scatola(corpo, w - 0.3, 0.05, 0.4, scuro, 0, 0.12 + y, -d / 2 + 0.28)
    for (let i = 0; i < 5; i++) {
      const x = -w / 2 + 0.4 + i * 0.47
      if ((i + (y > 0.5 ? 1 : 0)) % 2) cilindro(corpo, 0.08, 0.08, 0.2, mat([0xd8352a, 0xf0c52a, 0x7cbc4a][i % 3]), x, 0.12 + y + 0.12, -d / 2 + 0.28, 8)
      else scatola(corpo, 0.26, 0.18, 0.26, mat(0xb98a4a), x, 0.12 + y + 0.11, -d / 2 + 0.28)
    }
  }
  for (const s of [-1, 1]) { const anta = scatola(corpo, w * 0.2, h * 0.85, 0.06, scuro, s * w * 0.3, 0.12 + h * 0.43, d / 2 + 0.25); anta.rotation.y = s * 1.1 }
  // il tetto a due falde, poi l'insegna sopra il portone
  for (const s of [1, -1]) { const f = scatola(corpo, w + 0.3, 0.1, d / 2 + 0.35, tettoM, 0, 0.12 + h + 0.32, s * (d / 4 + 0.08)); f.rotation.x = s * 0.6 }
  scatola(corpo, 0.9, 0.3, 0.06, mat(0xfff4d8), 0, 0.12 + h + 0.15, d / 2 + 0.07)
  scatola(corpo, 0.22, 0.16, 0.08, mat(0xb98a4a), 0, 0.12 + h + 0.15, d / 2 + 0.1)
  fondiPerMateriale(corpo)
  g.add(corpo); g.userData.altezzaPiena = 0.12 + h + 0.8
  return g
}

/** Il corpo dei cloni va ritrovato: `clonaModello` copia il gruppo, non il riferimento in userData. */
const ritrovaCorpo = g => { g.userData.corpo = g.children[0]; return g }
export const creaSiloRosso = memoModello('silo', costruisciSiloRosso, { dopo: ritrovaCorpo })
export const creaSiloBianco = memoModello('silo_bianco', costruisciSiloBianco, { dopo: ritrovaCorpo })
export const creaDispensa = memoModello('dispensa', costruisciDispensa, { dopo: ritrovaCorpo })

/** Fa crescere il magazzino alla sua taglia: il corpo si scala, il cartello sale con lui. */
export function cresciMagazzino(g, taglia) {
  const corpo = g.userData.corpo
  if (!corpo || g.userData.taglia === taglia) return
  const s = scalaDelCorpo(taglia)
  corpo.scale.set(s.xz, s.y, s.xz)
  g.userData.taglia = taglia
  g.userData.altezza = (g.userData.altezzaPiena || 2.6) * s.y
}
