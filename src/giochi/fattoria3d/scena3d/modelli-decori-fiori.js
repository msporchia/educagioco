// I fiori e i vasi delle decorazioni (W8): 33 voci da poche forme riusate, `testa()` (sette tipi di corolla) e `mazzo()` (steli con foglie), più i contenitori
// (vaso, cassetta, cesto, carriola, bici, carretto). Ogni voce è UNA mesh fusa; i colori passano nei vertici. Tutto ciò che sta su uno stelo o in un vaso
// tocca ciò che lo regge (niente parti a mezz'aria). Vedi docs/fattoria3d/decorazioni.md.
import * as THREE from 'three'
import { decoro, mat, scatola, cilindro, cono, palla, filo, arco, ciuffo, cesto, cassetta } from './modelli-decori-base.js'

const STELO = 0x4a9a3a, FOGLIA = 0x5aa84c, TERRA = 0x6b4a2e, COTTO = 0xc0613a, LEGNO = 0x9a6a36, LEGNO_SCURO = 0x6e4a2c
const ROSA = 0xf29ab6, ROSSO = 0xd8352a, GIALLO = 0xf0c52a, BIANCO = 0xfff4e6, VIOLA = 0x9a74d0, ARANCIO = 0xf08a24, AZZURRO = 0x7aa8e0

/** Una foglia: un cono a tre facce disteso verso `ang`, con la base sullo stelo in (x, y, z) (una foglia costa 6 triangoli, non 20). */
export function foglia (g, x, y, z, ang, l = 0.065, c = FOGLIA) {
  const f = Math.PI / 2 - 0.45, o = cono(g, l * 0.45, l * 1.9, mat(c), x + Math.cos(ang) * l * 0.9, y, z + Math.sin(ang) * l * 0.9, 3)
  o.rotation.set(Math.sin(ang) * f, 0, -Math.cos(ang) * f); return o
}
/** La corolla di un fiore, centrata in (x, y, z) dove finisce lo stelo; `s` la scala (1 = un fiore di un palmo). Poche facce: a 22 m una corolla è pochi pixel. */
export function testa (g, tipo, x, y, z, s, c1, c2) {
  switch (tipo) {
    case 'margherita':
      cono(g, 0.075 * s, 0.03 * s, mat(c1), x, y, z, 7); cono(g, 0.03 * s, 0.03 * s, mat(c2 || GIALLO), x, y + 0.025 * s, z, 5); break
    case 'tulipano':
      palla(g, 0.05 * s, c1, x, y + 0.06 * s, z, 0.85, 1.35, 0.85, 0); cono(g, 0.04 * s, 0.05 * s, mat(c1), x, y + 0.14 * s, z, 4); break
    case 'girasole': {
      const gr = new THREE.Group(); gr.position.set(x, y, z); gr.rotation.x = -0.6; g.add(gr)
      for (let i = 0; i < 10; i++) { const br = new THREE.Group(); br.rotation.z = (i / 10) * Math.PI * 2; gr.add(br); cono(br, 0.035 * s, 0.1 * s, mat(c1), 0.125 * s, 0, 0, 4).rotation.z = -Math.PI / 2 }
      cilindro(gr, 0.09 * s, 0.09 * s, 0.03 * s, mat(c2 || 0x5a3a1e), 0, 0, 0.01 * s, 8).rotation.x = Math.PI / 2; break
    }
    case 'lavanda':
      for (const [dy, r] of [[-0.08, 0.036], [-0.01, 0.032], [0.05, 0.028], [0.1, 0.022]]) palla(g, r * s, c1, x, y + dy * s, z, 1, 1.5, 1, 0)
      break
    case 'rosa':
      palla(g, 0.055 * s, c1, x, y + 0.03 * s, z, 1, 0.9, 1, 0); cono(g, 0.03 * s, 0.03 * s, mat(c2 || 0xb8243a), x, y + 0.08 * s, z, 4); break
    case 'ortensia':
      palla(g, 0.1 * s, c1, x, y + 0.05 * s, z, 1, 0.8, 1, 0); palla(g, 0.075 * s, c2 || c1, x + 0.07 * s, y + 0.02 * s, z + 0.04 * s, 1, 0.8, 1, 0); palla(g, 0.07 * s, c2 || c1, x - 0.06 * s, y + 0.02 * s, z - 0.05 * s, 1, 0.8, 1, 0)
      break
    default: palla(g, 0.05 * s, c1, x, y, z, 1, 0.7, 1, 0)
  }
}
/** Un ciuffo di fiori: [x, z, altezza, tipo, colore, colore2?, scala?] ciascuno con stelo e due foglie. `y0` la quota da cui partono gli steli. */
export function mazzo (g, lista, y0 = 0) {
  for (const [x, z, h, tipo, c1, c2, s = 1] of lista) {
    cono(g, 0.016, h, mat(STELO), x, y0 + h / 2, z, 3)
    foglia(g, x, y0 + h * 0.35, z, x * 7 + z * 3); foglia(g, x, y0 + h * 0.55, z, x * 7 + z * 3 + 3.1, 0.06)
    testa(g, tipo, x, y0 + h, z, s, c1, c2)
  }
}
/** Un vaso di terracotta (cilindro svasato, bordo, terra): torna la quota della terra. */
export function vaso (g, r, h, colore, x = 0, z = 0, y0 = 0) {
  cilindro(g, r, r * 0.7, h, mat(colore), x, y0 + h / 2, z, 10)
  cilindro(g, r * 1.1, r * 1.05, 0.05, mat(colore), x, y0 + h, z, 10)
  cilindro(g, r * 0.95, r * 0.95, 0.02, mat(TERRA), x, y0 + h + 0.02, z, 10)
  return y0 + h + 0.03
}
/** Una cassetta lunga (fioriera) con la terra: lunga `w`, larga `d`, alta `h`. */
function trogolo (g, w, d, h, colore, scuro, x = 0, z = 0) {
  scatola(g, w, h, d, mat(colore), x, h / 2, z)
  scatola(g, w + 0.05, 0.05, d + 0.05, mat(scuro), x, h, z)
  scatola(g, w - 0.08, 0.02, d - 0.08, mat(TERRA), x, h + 0.03, z)
  return h + 0.04
}
/** Un cespuglio di ortensie: quattro palle verdi e una dozzina di palle di colore sulla cupola (due tinte). */
function ortensia (g, c1, c2) {
  for (const [x, z, r] of [[-0.2, 0, 0.24], [0.18, 0.05, 0.26], [0, -0.18, 0.22], [0, 0.18, 0.22]]) palla(g, r, 0x3f8a3a, x, r * 0.75, z, 1, 0.75, 1, 1)
  for (let i = 0; i < 14; i++) { const a = i * 2.4, rr = 0.3 * Math.sqrt((i + 0.5) / 14); palla(g, 0.08, i % 2 ? c1 : c2, Math.cos(a) * rr, 0.56 - rr * rr * 1.3, Math.sin(a) * rr, 1, 0.85, 1, 0) }
}
const sparso = (rnd, n, w, d, alt, tipi, colori, s = 1) => Array.from({ length: n }, (_, i) =>
  [(rnd() - 0.5) * w, (rnd() - 0.5) * d, alt * (0.75 + rnd() * 0.5), tipi[i % tipi.length], colori[i % colori.length], null, s])
const VARI = [ROSA, GIALLO, ROSSO, BIANCO, VIOLA]

export const FIORI_DECORI = {
  fiorellino: decoro('fiorellino', g => {
    mazzo(g, [[0, 0, 0.3, 'margherita', BIANCO, GIALLO, 1.5]]); return { altezza: 0.5 }
  }),
  germoglio: decoro('germoglio', g => {
    palla(g, 0.14, TERRA, 0, 0.03, 0, 1.4, 0.4, 1.2, 0)
    cilindro(g, 0.015, 0.02, 0.2, mat(STELO), 0, 0.14, 0, 4)
    foglia(g, 0, 0.24, 0, 0, 0.1, 0x7ac05a); foglia(g, 0, 0.24, 0, Math.PI, 0.1, 0x7ac05a)
    return { altezza: 0.35 }
  }),
  fiori0: decoro('fiori0', (g, rnd) => {
    mazzo(g, sparso(rnd, 6, 0.6, 0.6, 0.22, ['margherita', 'tulipano'], [ROSA, ROSSO, GIALLO], 1.1)); ciuffo(g, 0, 0, 0x5aa84c, 8, 0.12, rnd); return { altezza: 0.4 }
  }),
  fiori1: decoro('fiori1', (g, rnd) => {
    mazzo(g, sparso(rnd, 6, 0.6, 0.6, 0.24, ['margherita'], [BIANCO], 1.2)); ciuffo(g, 0, 0, 0x5aa84c, 8, 0.12, rnd); return { altezza: 0.4 }
  }),
  fiori2: decoro('fiori2', (g, rnd) => {
    mazzo(g, sparso(rnd, 11, 0.8, 0.8, 0.26, ['margherita', 'tulipano', 'rosa'], VARI, 1.1)); ciuffo(g, 0, 0, 0x5aa84c, 10, 0.14, rnd); return { altezza: 0.45 }
  }),
  prato_fiorito: decoro('prato_fiorito', (g, rnd) => {
    cilindro(g, 0.95, 1.0, 0.05, mat(0x77b24d), 0, 0.025, 0, 16)
    const lista = sparso(rnd, 22, 1.5, 1.5, 0.22, ['margherita', 'tulipano', 'margherita', 'rosa'], VARI, 1)
    for (const f of lista) f[2] = Math.max(0.12, f[2])
    mazzo(g, lista.filter(f => Math.hypot(f[0], f[1]) < 0.8), 0.05)
    for (let i = 0; i < 5; i++) ciuffo(g, Math.cos(i * 1.3) * 0.6, Math.sin(i * 1.3) * 0.6, 0x5aa84c, 5, 0.14, rnd)
    return { altezza: 0.35 }
  }),

  // ── i vasi ──
  vaso_f: decoro('vaso_f', (g, rnd) => {
    const y = vaso(g, 0.2, 0.26, COTTO); mazzo(g, [[-0.07, 0, 0.26, 'margherita', ROSA, GIALLO, 1.3], [0.08, 0.03, 0.2, 'margherita', ROSSO, GIALLO, 1.3], [0, -0.07, 0.3, 'tulipano', GIALLO, null, 1.2]], y); return { altezza: 0.7 }
  }),
  vaso_p: decoro('vaso_p', g => {
    const y = vaso(g, 0.15, 0.5, 0xd9c7a0); palla(g, 0.22, 0x4f9a45, 0, y + 0.1, 0, 1.1, 0.8, 1.1, 1)
    mazzo(g, [[-0.1, 0.05, 0.2, 'margherita', ROSA, GIALLO, 1.2], [0.1, -0.03, 0.26, 'rosa', ROSA, null, 1.1], [0.02, 0.1, 0.24, 'margherita', BIANCO, GIALLO, 1.1]], y + 0.1); return { altezza: 1.0 }
  }),
  vaso_a: decoro('vaso_a', g => {
    const y = vaso(g, 0.22, 0.28, 0x3f78c8); mazzo(g, [[-0.08, 0.02, 0.26, 'margherita', GIALLO, 0xc08a20, 1.3], [0.09, -0.02, 0.32, 'margherita', GIALLO, 0xc08a20, 1.3], [0.0, 0.1, 0.22, 'margherita', ARANCIO, GIALLO, 1.2]], y); return { altezza: 0.75 }
  }),
  vaso_tulipani: decoro('vaso_tulipani', g => {
    const y = vaso(g, 0.22, 0.26, COTTO)
    mazzo(g, [[-0.1, 0, 0.3, 'tulipano', ROSSO, null, 1.3], [0.1, 0.02, 0.34, 'tulipano', GIALLO, null, 1.3], [0, 0.1, 0.28, 'tulipano', ROSA, null, 1.3], [0.02, -0.1, 0.32, 'tulipano', ROSSO, null, 1.3], [-0.12, 0.1, 0.22, 'tulipano', 0xfff0a0, null, 1.2]], y); return { altezza: 0.8 }
  }),
  vaso_margherite: decoro('vaso_margherite', g => {
    const y = vaso(g, 0.22, 0.26, 0xe9dfc8)
    mazzo(g, [[-0.1, 0, 0.3, 'margherita', BIANCO, GIALLO, 1.5], [0.1, 0.02, 0.36, 'margherita', BIANCO, GIALLO, 1.5], [0, 0.1, 0.26, 'margherita', BIANCO, GIALLO, 1.4], [0.02, -0.1, 0.32, 'margherita', BIANCO, GIALLO, 1.4]], y); return { altezza: 0.85 }
  }),
  vaso_lavanda: decoro('vaso_lavanda', g => {
    const y = vaso(g, 0.22, 0.26, 0x8f8a7e)
    mazzo(g, [[-0.1, 0, 0.3, 'lavanda', VIOLA, null, 1.4], [0.1, 0.02, 0.34, 'lavanda', 0xb08ae0, null, 1.4], [0, 0.1, 0.28, 'lavanda', VIOLA, null, 1.4], [0.02, -0.1, 0.32, 'lavanda', 0xb08ae0, null, 1.4], [-0.1, -0.08, 0.24, 'lavanda', VIOLA, null, 1.3], [0.11, -0.08, 0.26, 'lavanda', VIOLA, null, 1.3]], y); return { altezza: 0.85 }
  }),
  vaso_girasoli: decoro('vaso_girasoli', g => {
    const y = vaso(g, 0.28, 0.32, COTTO)
    mazzo(g, [[-0.12, 0, 0.62, 'girasole', GIALLO, null, 1.6], [0.12, 0.03, 0.72, 'girasole', GIALLO, null, 1.6], [0.0, -0.1, 0.52, 'girasole', ARANCIO, null, 1.5]], y); return { altezza: 1.3 }
  }),
  girasole_cuore: decoro('girasole_cuore', g => {
    const y = vaso(g, 0.2, 0.22, 0xd9695f)
    cilindro(g, 0.018, 0.024, 0.55, mat(STELO), 0, y + 0.275, 0, 5); foglia(g, 0, y + 0.2, 0, 0.5, 0.1); foglia(g, 0, y + 0.3, 0, 3.6, 0.1)
    const gr = new THREE.Group(); gr.position.set(0, y + 0.58, 0); gr.rotation.x = -0.6; g.add(gr)
    for (let i = 0; i < 12; i++) { const br = new THREE.Group(); br.rotation.z = (i / 12) * Math.PI * 2; gr.add(br); cono(br, 0.05, 0.14, mat(GIALLO), 0.19, 0, 0, 4).rotation.z = -Math.PI / 2 }
    const d = cilindro(gr, 0.14, 0.14, 0.04, mat(0x5a3a1e), 0, 0, 0.012, 9); d.rotation.x = Math.PI / 2
    for (const sx of [-1, 1]) palla(gr, 0.045, ROSSO, sx * 0.04, 0.035, 0.05, 1, 1, 0.8, 0)         // il cuore: due palle e una punta
    const p = cono(gr, 0.085, 0.1, mat(ROSSO), 0, -0.035, 0.05, 4); p.rotation.set(Math.PI / 2, 0, Math.PI); p.scale.set(1, 1, 0.8)
    return { altezza: 1.0 }
  }),
  ortensie_blu: decoro('ortensie_blu', g => { ortensia(g, 0x4a78d8, 0x6a95e8); return { altezza: 0.7 } }),
  ortensie_rosa: decoro('ortensie_rosa', g => { ortensia(g, 0xf08ab0, 0xf7a8c6); return { altezza: 0.7 } }),
  azalea: decoro('azalea', (g, rnd) => {
    palla(g, 0.4, 0x3f8a3a, 0, 0.3, 0, 1.1, 0.75, 1.1, 1)
    for (let i = 0; i < 24; i++) {
      const th = rnd() * 6.28, ph = 0.15 + rnd() * 1.1, x = Math.sin(ph) * Math.cos(th) * 0.43, z = Math.sin(ph) * Math.sin(th) * 0.43, y = 0.3 + Math.cos(ph) * 0.31
      palla(g, 0.07, i % 3 ? 0xe84a9a : 0xf58ac0, x, y, z, 1, 0.8, 1, 0)
    }
    return { altezza: 0.75 }
  }),
  vaso_rosa: decoro('vaso_rosa', g => {
    const y = vaso(g, 0.22, 0.28, 0xe89ab4)
    palla(g, 0.2, 0x4f9a45, 0, y + 0.1, 0, 1.1, 0.8, 1.1, 1)
    for (const [x, z, h] of [[-0.12, 0.05, 0.2], [0.1, 0.1, 0.24], [0.03, -0.12, 0.22], [0.14, -0.05, 0.16], [-0.06, 0.14, 0.18]]) testa(g, 'rosa', x, y + h, z, 1.3, ROSA, 0xd8527a)
    return { altezza: 0.75 }
  }),
  vaso_alto: decoro('vaso_alto', g => {
    cilindro(g, 0.17, 0.2, 0.08, mat(0xbfb8a6), 0, 0.04, 0, 10)
    cilindro(g, 0.11, 0.14, 0.62, mat(0xd9d2c0), 0, 0.39, 0, 10)
    cilindro(g, 0.17, 0.12, 0.2, mat(0xd9d2c0), 0, 0.8, 0, 10)
    cilindro(g, 0.2, 0.19, 0.04, mat(0xbfb8a6), 0, 0.92, 0, 10); cilindro(g, 0.17, 0.17, 0.02, mat(TERRA), 0, 0.93, 0, 10)
    palla(g, 0.17, 0x4f9a45, 0, 0.98, 0, 1.1, 0.7, 1.1, 1)
    mazzo(g, [[-0.1, 0.05, 0.3, 'margherita', ROSA, GIALLO, 1.4], [0.1, 0.0, 0.34, 'margherita', BIANCO, GIALLO, 1.4], [0, 0.1, 0.26, 'rosa', ROSA, null, 1.2], [0.04, -0.1, 0.32, 'margherita', ROSA, GIALLO, 1.4]], 0.98)
    return { altezza: 1.3 }
  }),
  pianta_vaso: decoro('pianta_vaso', g => {
    const y = vaso(g, 0.2, 0.26, COTTO)
    for (let i = 0; i < 7; i++) { const a = i * 0.9, o = palla(g, 0.13, i % 2 ? 0x3f8a3a : 0x5aa84c, Math.cos(a) * 0.1, y + 0.18 + (i % 3) * 0.07, Math.sin(a) * 0.1, 1.9, 0.25, 0.8, 0); o.rotation.set(0, -a, 0.8 - (i % 3) * 0.15) }
    return { altezza: 0.75 }
  }),

  // ── cassette, cesti, mezzi ──
  fioriera: decoro('fioriera', (g, rnd) => {
    const y = trogolo(g, 1.7, 0.4, 0.28, LEGNO, LEGNO_SCURO)
    mazzo(g, Array.from({ length: 9 }, (_, i) => [-0.75 + i * 0.19, (i % 2 ? 0.05 : -0.05), 0.2 + rnd() * 0.1, 'margherita', [ROSA, GIALLO, BIANCO, ROSSO][i % 4], GIALLO, 1.2]), y); return { altezza: 0.6 }
  }),
  fioriera_box: decoro('fioriera_box', g => {
    const y = trogolo(g, 0.8, 0.34, 0.26, 0x6e4a2c, 0x4a321c)
    mazzo(g, [[-0.28, 0, 0.2, 'tulipano', ROSSO, null, 1.2], [-0.09, 0.03, 0.24, 'margherita', BIANCO, GIALLO, 1.2], [0.1, -0.03, 0.2, 'tulipano', GIALLO, null, 1.2], [0.28, 0.02, 0.24, 'margherita', ROSA, GIALLO, 1.2]], y); return { altezza: 0.55 }
  }),
  fioriera_mista: decoro('fioriera_mista', (g, rnd) => {
    const y = trogolo(g, 1.7, 0.46, 0.3, 0xb4aa98, 0x8f8a7e)
    palla(g, 0.2, 0x4f9a45, -0.5, y + 0.06, 0, 1.2, 0.7, 1, 1); palla(g, 0.2, 0x4f9a45, 0.5, y + 0.06, 0, 1.2, 0.7, 1, 1)
    mazzo(g, [[-0.15, 0.05, 0.26, 'lavanda', VIOLA, null, 1.3], [0.05, -0.04, 0.3, 'girasole', GIALLO, null, 1.2], [0.2, 0.06, 0.22, 'tulipano', ROSSO, null, 1.2], [-0.35, -0.05, 0.24, 'margherita', BIANCO, GIALLO, 1.3], [0.4, -0.06, 0.26, 'margherita', ROSA, GIALLO, 1.3], [-0.6, 0.06, 0.22, 'tulipano', GIALLO, null, 1.2], [0.65, 0.04, 0.22, 'rosa', ROSA, null, 1.1]], y); return { altezza: 0.7 }
  }),
  cassetta_fiori: decoro('cassetta_fiori', (g, rnd) => {
    cassetta(g, 0.6, 0.42, 0.3, 0, 0, 0xb98a4a, 0x7b4a24)
    mazzo(g, sparso(rnd, 6, 0.4, 0.28, 0.2, ['margherita', 'tulipano'], [ROSA, GIALLO, ROSSO, BIANCO], 1.2), 0.2); return { altezza: 0.6 }
  }),
  cesta_fiori: decoro('cesta_fiori', (g, rnd) => {
    cesto(g, 0.3, 0.3, 0, 0, { manico: true })
    palla(g, 0.28, 0x4f9a45, 0, 0.34, 0, 1.1, 0.5, 1.1, 1)
    mazzo(g, sparso(rnd, 9, 0.4, 0.4, 0.26, ['margherita', 'rosa', 'tulipano'], VARI, 1.3), 0.34); return { altezza: 0.9 }
  }),
  cesto_fiori: decoro('cesto_fiori', (g, rnd) => {
    cesto(g, 0.2, 0.2, 0, 0, { manico: true, colore: 0xc59858 })
    palla(g, 0.18, 0x4f9a45, 0, 0.23, 0, 1.1, 0.5, 1.1, 1)
    mazzo(g, sparso(rnd, 6, 0.26, 0.26, 0.2, ['margherita', 'tulipano'], [ROSA, GIALLO, BIANCO], 1.1), 0.23); return { altezza: 0.7 }
  }),
  carriola: decoro('carriola', (g, rnd) => {
    // un vassoio inclinato su una ruota davanti (+x) e due gambe dietro; i manici tornano indietro
    const vas = new THREE.Group(); vas.position.set(0.05, 0.42, 0); g.add(vas)
    scatola(vas, 0.7, 0.04, 0.42, mat(0x3f7a4a), 0, 0, 0)
    for (const s of [-1, 1]) { const f = scatola(vas, 0.7, 0.2, 0.03, mat(0x3f7a4a), 0, 0.1, s * 0.2); f.rotation.z = 0 }
    scatola(vas, 0.03, 0.2, 0.4, mat(0x3f7a4a), 0.34, 0.1, 0); scatola(vas, 0.03, 0.2, 0.4, mat(0x3f7a4a), -0.34, 0.1, 0)
    scatola(vas, 0.66, 0.02, 0.38, mat(TERRA), 0, 0.14, 0)
    const ruota = cilindro(g, 0.17, 0.17, 0.06, mat(0x2d2d33), 0.5, 0.17, 0, 10); ruota.rotation.x = Math.PI / 2
    cilindro(g, 0.03, 0.03, 0.4, mat(LEGNO_SCURO), 0.5, 0.17, 0, 5).rotation.x = Math.PI / 2
    for (const s of [-1, 1]) { filo(g, [0.5, 0.17, s * 0.2], [0.4, 0.4, s * 0.2], 0.018, LEGNO_SCURO); filo(g, [-0.2, 0.4, s * 0.19], [-0.62, 0.55, s * 0.2], 0.025, LEGNO) ; filo(g, [-0.2, 0.4, s * 0.19], [-0.2, 0.0, s * 0.19], 0.025, LEGNO_SCURO) }
    mazzo(g, sparso(rnd, 9, 0.5, 0.3, 0.22, ['margherita', 'tulipano', 'rosa'], VARI, 1.2), 0.56); return { altezza: 0.9 }
  }),
  bici: decoro('bici', (g, rnd) => {
    const ruota = x => {
      const o = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 4, 14), mat(0x2d2d33)); o.castShadow = true; o.position.set(x, 0.33, 0); g.add(o)
      cilindro(g, 0.03, 0.03, 0.06, mat(0xbfc4cc), x, 0.33, 0, 5).rotation.x = Math.PI / 2
      for (const a of [0.3, 1.35, 2.4]) filo(g, [x - Math.cos(a) * 0.29, 0.33 - Math.sin(a) * 0.29, 0], [x + Math.cos(a) * 0.29, 0.33 + Math.sin(a) * 0.29, 0], 0.007, 0xbfc4cc, 3)
    }
    ruota(-0.5); ruota(0.5)
    const T = 0x3a8ac8                                                      // il telaio, dai mozzi alla sella e al manubrio
    filo(g, [-0.5, 0.33, 0], [-0.1, 0.33, 0], 0.025, T); filo(g, [-0.1, 0.33, 0], [-0.2, 0.7, 0], 0.025, T); filo(g, [-0.5, 0.33, 0], [-0.2, 0.7, 0], 0.022, T)
    filo(g, [-0.1, 0.33, 0], [0.38, 0.72, 0], 0.025, T); filo(g, [-0.2, 0.7, 0], [0.38, 0.72, 0], 0.025, T); filo(g, [0.5, 0.33, 0], [0.38, 0.72, 0], 0.025, T)
    scatola(g, 0.22, 0.05, 0.1, mat(0x2d2d33), -0.22, 0.74, 0); filo(g, [0.38, 0.72, 0], [0.34, 0.86, 0], 0.022, 0x2d2d33); scatola(g, 0.04, 0.04, 0.44, mat(0x2d2d33), 0.34, 0.87, 0)
    filo(g, [0.34, 0.85, 0], [0.5, 0.62, 0], 0.02, 0x2d2d33); scatola(g, 0.3, 0.03, 0.3, mat(0x2d2d33), 0.52, 0.6, 0)           // il cestino davanti, su un portapacchi
    const c = new THREE.Group(); c.position.set(0.52, 0.615, 0); g.add(c); cesto(c, 0.15, 0.17, 0, 0, { colore: 0xc59858 })
    palla(c, 0.13, 0x4f9a45, 0, 0.19, 0, 1.1, 0.5, 1.1, 0)
    mazzo(g, sparso(rnd, 5, 0.2, 0.2, 0.2, ['margherita', 'tulipano'], [ROSA, GIALLO, ROSSO, BIANCO], 1.2).map(f => [f[0] + 0.52, f[1], f[2], f[3], f[4], f[5], f[6]]), 0.78); return { altezza: 1.2 }
  }),
  carretto_fiori: decoro('carretto_fiori', (g, rnd) => {
    scatola(g, 1.1, 0.06, 0.62, mat(0x9a6a36), 0, 0.42, 0)
    for (const s of [-1, 1]) { scatola(g, 1.1, 0.2, 0.04, mat(LEGNO), 0, 0.54, s * 0.29); scatola(g, 0.04, 0.2, 0.62, mat(LEGNO), s * 0.53, 0.54, 0) }
    for (const s of [-1, 1]) { const r = cilindro(g, 0.24, 0.24, 0.05, mat(0x7a4a24), 0.1, 0.24, s * 0.36, 12); r.rotation.x = Math.PI / 2; cilindro(g, 0.05, 0.05, 0.07, mat(0x4a321c), 0.1, 0.24, s * 0.36, 6).rotation.x = Math.PI / 2 }
    cilindro(g, 0.025, 0.025, 0.72, mat(0x4a321c), 0.1, 0.24, 0, 5).rotation.x = Math.PI / 2
    filo(g, [0.55, 0.45, 0.26], [1.05, 0.34, 0.1], 0.025, LEGNO); filo(g, [0.55, 0.45, -0.26], [1.05, 0.34, -0.1], 0.025, LEGNO)
    scatola(g, 0.04, 0.04, 0.22, mat(LEGNO), 1.05, 0.34, 0)
    palla(g, 0.4, 0x4f9a45, -0.1, 0.55, 0, 1.4, 0.4, 0.9, 1)
    mazzo(g, sparso(rnd, 13, 0.9, 0.46, 0.24, ['margherita', 'tulipano', 'rosa'], VARI, 1.2), 0.5); return { altezza: 0.95 }
  }),
  carretto_frutta: decoro('carretto_frutta', (g, rnd) => {
    scatola(g, 1.1, 0.06, 0.62, mat(0x9a6a36), 0, 0.42, 0)
    for (const s of [-1, 1]) { scatola(g, 1.1, 0.2, 0.04, mat(LEGNO), 0, 0.54, s * 0.29); scatola(g, 0.04, 0.2, 0.62, mat(LEGNO), s * 0.53, 0.54, 0) }
    for (const s of [-1, 1]) { const r = cilindro(g, 0.24, 0.24, 0.05, mat(0x7a4a24), 0.1, 0.24, s * 0.36, 12); r.rotation.x = Math.PI / 2; cilindro(g, 0.05, 0.05, 0.07, mat(0x4a321c), 0.1, 0.24, s * 0.36, 6).rotation.x = Math.PI / 2 }
    cilindro(g, 0.025, 0.025, 0.72, mat(0x4a321c), 0.1, 0.24, 0, 5).rotation.x = Math.PI / 2
    filo(g, [0.55, 0.45, 0.26], [1.05, 0.34, 0.1], 0.025, LEGNO); filo(g, [0.55, 0.45, -0.26], [1.05, 0.34, -0.1], 0.025, LEGNO)
    scatola(g, 0.04, 0.04, 0.22, mat(LEGNO), 1.05, 0.34, 0)
    const colori = [ROSSO, ARANCIO, 0x6aaa3a, GIALLO]
    for (let i = 0; i < 18; i++) { const x = -0.42 + (i % 6) * 0.17, z = -0.2 + Math.floor(i / 6) * 0.2; palla(g, 0.075, colori[(i * 7 + Math.floor(i / 6)) % 4], x, 0.5 + ((i + Math.floor(i / 6)) % 2) * 0.03, z, 1, 0.95, 1, 0) }
    for (let i = 0; i < 5; i++) palla(g, 0.075, colori[i % 4], -0.3 + i * 0.17, 0.63, (i % 2 ? 0.09 : -0.09), 1, 0.95, 1, 0)
    return { altezza: 0.8 }
  }),
  palo_rose: decoro('palo_rose', (g, rnd) => {
    cilindro(g, 0.1, 0.12, 0.08, mat(0x8f8a7e), 0, 0.04, 0, 8)
    cilindro(g, 0.04, 0.05, 1.7, mat(LEGNO_SCURO), 0, 0.92, 0, 6)
    for (const y of [0.4, 0.8, 1.2, 1.6]) palla(g, 0.16, 0x3f8a3a, Math.cos(y * 5) * 0.05, y, Math.sin(y * 5) * 0.05, 1, 0.8, 1, 1)
    for (let i = 0; i < 10; i++) { const y = 0.3 + i * 0.15, a = i * 2.4; testa(g, 'rosa', Math.cos(a) * 0.16, y, Math.sin(a) * 0.16, 1.2, i % 3 ? ROSA : ROSSO, 0xb8243a) }
    cono(g, 0.06, 0.12, mat(LEGNO_SCURO), 0, 1.82, 0, 6); return { altezza: 1.9 }
  }),
  arco_rose: decoro('arco_rose', (g, rnd) => {
    for (const s of [-1, 1]) { cilindro(g, 0.045, 0.055, 1.5, mat(0xf4efe4), s * 0.8, 0.75, 0, 6); cilindro(g, 0.1, 0.12, 0.06, mat(0x8f8a7e), s * 0.8, 0.03, 0, 8) }
    arco(g, 0.8, 0.045, 0xf4efe4, 0, 1.5, 0, Math.PI, 14)
    for (let i = 0; i <= 14; i++) { const t = (i / 14) * Math.PI, x = Math.cos(t) * 0.8, y = 1.5 + Math.sin(t) * 0.8; palla(g, 0.1, i % 2 ? 0x3f8a3a : 0x4f9a45, x, y, 0, 1, 1, 1.2, 0) }
    for (let i = 0; i < 12; i++) { const t = (i / 11) * Math.PI, x = Math.cos(t) * 0.8, y = 1.5 + Math.sin(t) * 0.8; testa(g, 'rosa', x, y + 0.06, 0.1 * (i % 2 ? 1 : -1), 1.3, i % 3 ? ROSA : ROSSO, 0xb8243a) }
    for (const s of [-1, 1]) for (const y of [0.4, 0.8, 1.2]) { palla(g, 0.1, 0x3f8a3a, s * 0.8, y, 0, 1, 1, 1, 0); testa(g, 'rosa', s * 0.8, y + 0.04, 0.1, 1.2, ROSA, 0xb8243a) }
    return { altezza: 2.4 }
  }),
  fiore_appeso: decoro('fiore_appeso', (g0, rnd) => {
    const g = new THREE.Group(); g.position.x = -0.25; g0.add(g)          // il palo a sinistra: il cestino pende al centro della cella
    cilindro(g, 0.1, 0.12, 0.06, mat(0x8f8a7e), 0, 0.03, 0, 8)
    cilindro(g, 0.04, 0.05, 1.7, mat(0x33343c), 0, 0.9, 0, 6)
    scatola(g, 0.6, 0.05, 0.05, mat(0x33343c), 0.3, 1.72, 0)
    filo(g, [0, 1.3, 0], [0.45, 1.72, 0], 0.02, 0x33343c)
    for (const dx of [-0.1, 0.1]) filo(g, [0.55, 1.72, 0], [0.55 + dx * 1.5, 1.38, 0.0], 0.012, 0x6e6a64)
    cilindro(g, 0.17, 0.1, 0.16, mat(COTTO), 0.55, 1.3, 0, 9)
    palla(g, 0.16, 0x4f9a45, 0.55, 1.4, 0, 1.1, 0.6, 1.1, 1)
    for (const [dx, dz, c] of [[-0.08, 0.04, ROSA], [0.08, 0, ROSSO], [0, 0.1, GIALLO], [0.05, -0.08, BIANCO]]) testa(g, 'margherita', 0.55 + dx, 1.5, dz, 1.3, c, GIALLO)
    for (const dx of [-0.12, 0.12]) palla(g, 0.06, 0x4f9a45, 0.55 + dx, 1.12, 0.03, 0.8, 1.6, 0.8, 0)
    return { altezza: 1.9 }
  }),
}
