// Le persone del mondo di sopra e l'eroe: sprite ancorati (la strada A di mondo-aperto-fasi.md). Le figure dell'atlante delle
// discese (scena3d/figure.js) col filo scuro attorno e la luce di taglio dal lato del sole, un'ombra morbida a contatto sotto i
// piedi (più l'ombra vera del sole), le persone a scala 1,25 dell'eroe, come sulla terra dipinta. L'eroe è quello delle discese
// (scena3d/eroe.js, con le armi in mano), posato sul terreno. Chi non si è visto non si disegna; entrando in vista sale dal
// terreno come gli oggetti.
import { DataTexture, RGBAFormat, Vector2, InstancedMesh, PlaneGeometry, MeshBasicMaterial, Matrix4, Quaternion, Vector3, Euler } from 'three'
import { creaFigure } from '../figure.js'
import { disegnaEroe } from '../eroe.js'
import { creaEroe3d, eroe3dAcceso } from '../eroe3d.js'
import { creaMostri3d, mostri3dAccesi } from '../mostro3d.js'
import { creaPersone3d, persone3dAccese } from '../persona3d.js'
import { ACCESI } from '../costanti.js'
import { SALITA } from './vesti.js'
import { leggiFolla, personeFinte, mostriFinti } from './folla-prova.js'

export const SCALA_PERSONE = 1.25
const MOSTRI_3D_SOPRA = 8   // il mondo è già pieno di cose: i modelli 3D sono pochi, per chi è vicino
const OMBRE_MAX = 120
// le persone in 3D (docs/sotterraneo/persone-3d.md): le più vicine all'eroe, entro questa distanza in celle; le altre restano sprite
const PERSONE_3D_SOPRA = 8, PERSONE_3D_VICINO = 18

// le figure del mondo di sopra non hanno la maschera delle discese: una bianca, che lascia tutto com'è
export function mascheraPiena() {
  const t = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, RGBAFormat); t.needsUpdate = true
  return { uniforms: { uMaschera: { value: t }, uDimMappa: { value: new Vector2(1, 1) }, uBucoUV: { value: new Vector2(0.5, 0.5) },
                       uBucoR: { value: 0 }, uBucoZ: { value: 0 }, uBucoForza: { value: 0 }, uRisB: { value: new Vector2(1, 1) } }, t }
}

export function creaPersone(scena, { tex, norm, larga, alta, pezzi, trame, quota, nebbia }) {
  const maschera = mascheraPiena()
  const base = { tex, norm, larga, alta, pezzi, maschera, contorno: true }
  const figure = creaFigure(scena, { ...base, max: 150 })
  const figureEroe = creaFigure(scena, { ...base, max: 8 })
  const geo = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  const mat = new MeshBasicMaterial({ map: trame.macchia, color: 0x000000, transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
  const ombre = new InstancedMesh(geo, mat, OMBRE_MAX)
  ombre.count = 0; ombre.frustumCulled = false; ombre.renderOrder = 3
  scena.add(ombre)
  const M4 = new Matrix4(), Q = new Quaternion(), P = new Vector3(), S = new Vector3(), E = new Euler()
  let nOmbre = 0
  const ombra = (x, y, z, r) => { if (nOmbre < OMBRE_MAX) ombre.setMatrixAt(nOmbre++, M4.compose(P.set(x, y + 0.04, z), Q.identity(), S.set(r, 1, r * 0.7))) }
  // l'eroe delle discese vuole la corsa: gli si dà quella di sopra, con le figure che si posano sul terreno
  const terra = { metti: (n, x, y, z, o) => figureEroe.metti(n, x, y + quota(x, z - 0.1), z, o), o: () => figureEroe.o(), alto: (n, s) => figureEroe.alto(n, s) }
  const finta = { eroe: { x: 0, y: 0 }, versoEroe: { dx: 0, dy: 1 }, io: { sprite: 'cavaliere' }, mano: null, mancina: null, vita: 1, vitaMax: 1 }
  const nessuna = { torcia() {} }, niente = { metti() {} }
  // in prova: l'eroe è il modello 3D delle discese, posato sul terreno (`#eroe2d` torna allo sprite)
  const eroe3d = eroe3dAcceso() ? creaEroe3d(scena) : null
  const quotaEroe = (x, z) => quota(x, z - 0.1)
  // i mostri di sopra: i più vicini (al più MOSTRI_3D_SOPRA) con il modello 3D delle discese, gli altri restano sprite; lo stato di disegno
  // di ognuno (la sua istanza, dove guarda) sta qui per indice del mostro
  // `&folla=`, `&branco3d=`, `&tetto3d=`: la folla finta delle misure (folla-prova.js, docs/sotterraneo/limiti-3d.md)
  const prova = leggiFolla()
  const tettoMostri = prova.tetto || MOSTRI_3D_SOPRA, tettoPersone = prova.tetto || PERSONE_3D_SOPRA
  const mostri3d = mostri3dAccesi() && ACCESI.mostri3d > 0 ? creaMostri3d(scena, { quanti: () => Math.min(ACCESI.mostri3d, tettoMostri) }) : null
  const statiMostri = new Map()
  const persone3d = persone3dAccese() ? creaPersone3d(scena, { quanti: () => tettoPersone }) : null
  const statiPersone = new Map()
  const salita = (x, z, t) => { const k = Math.max(0, Math.min(1, (t - nebbia.quando(x, z)) / SALITA)); return k * k * (3 - 2 * k) }

  return {
    figure, figureEroe,
    // `persone` [{ pezzo, x, z, specchio }], `eroe` { stato (di eroe.js), x, z, verso, sprite, mano, mancina }; `veduta`: dall'alto
    // le figure non si vedono (troppo piccole: lì parlano i nomi). `mostri` e `perTerra`: i mostri di sopra e le cose rimaste per terra
    // (mostri.js, già filtrati dal cerchio e dalla nebbia); `extra(ombra)`: chi disegna anche lui (il palco dello scontro) e vuole l'ombra
    disegna(persone, eroe, { t, dt, veduta, camera, mostri = [], perTerra = [], extra = null }) {
      figure.inizia(); figureEroe.inizia(); nOmbre = 0
      if (prova.folla) persone = [...persone, ...personeFinte(prova.folla, eroe.x, eroe.z)]
      if (prova.branco) mostri = [...mostri, ...mostriFinti(prova.branco, prova.specie, eroe.x, eroe.z, t)]
      if (eroe3d && (veduta || eroe.nascosto)) eroe3d.nascondi()
      if (mostri3d && veduta) { mostri3d.inizia(); mostri3d.chiudi() }   // dall'alto non si vedono (troppo piccoli): via anche i modelli
      if (persone3d && veduta) { persone3d.inizia(); persone3d.chiudi() }
      if (!veduta) {
        // i mostri: come le persone, alla loro scala; al bordo del cerchio di luce svaniscono a retino
        if (mostri3d) mostri3d.inizia()
        const ordine = mostri3d ? [...mostri].sort((a, b) => (a.x - eroe.x) ** 2 + (a.z - eroe.z) ** 2 - (b.x - eroe.x) ** 2 - (b.z - eroe.z) ** 2) : mostri
        for (const q of ordine) {
          const o = figure.o(), y = quota(q.x, q.z)
          let in3d = false
          if (mostri3d) {
            let s = statiMostri.get(q.i)
            if (!s) statiMostri.set(q.i, s = { id3d: undefined })
            const r = { tipo: q.tipo, grado: q.grado }
            if (s.id3d === undefined) s.id3d = mostri3d.idDi(r)   // la specie e il grado non cambiano
            if (s.id3d) {
              s.specchio = q.specchio
              const alto = mostri3d.metti(r, s, s.id3d, { x: q.x, y, z: q.z + 0.1, alto: figure.alto(q.pezzo, q.scala), verso: q.sveglio ? { x: eroe.x, z: eroe.z } : null,
                                                           t, dt, trasparenza: q.alfa, morente: 0, bianco: 0, attacco: -1 })
              in3d = alto >= 0
            }
          }
          if (!in3d) { o.scala = q.scala; o.specchio = q.specchio; o.trasparenza = q.alfa; figure.metti(q.pezzo, q.x, y, q.z + 0.1, o) }
          if (q.alfa > 0.5) ombra(q.x, y, q.z + 0.1, 0.9 * Math.min(1.4, q.scala))
        }
        if (mostri3d) mostri3d.chiudi()
        // il bottino che non stava in tasca: piccolo, che ondeggia sul prato
        for (const c of perTerra) {
          const o = figure.o(), y = quota(c.x, c.z)
          o.scala = 0.8
          figure.metti(c.pezzo, c.x, y + 0.1 + Math.sin(t * 2.6 + c.x) * 0.06, c.z, o)
        }
        // le persone: le più vicine col modello 3D (persona3d.js), le altre (e chi non ha il modello) sprite
        if (persone3d) persone3d.inizia()
        const d2 = q => (q.x - eroe.x) ** 2 + (q.z - eroe.z) ** 2
        const ordinePersone = persone3d ? [...persone].sort((a, b) => d2(a) - d2(b)) : persone
        for (const q of ordinePersone) {
          if (!nebbia.visto(q.x, q.z)) continue
          const e = salita(q.x, q.z, t), o = figure.o(), y = quota(q.x, q.z)
          const scala = q.scala || SCALA_PERSONE
          let in3d = false
          if (persone3d && q.modello && d2(q) < PERSONE_3D_VICINO ** 2) {
            const k = q.chiave || `${q.x},${q.z}`
            let s = statiPersone.get(k)
            if (!s) statiPersone.set(k, s = {})
            in3d = persone3d.metti(s, q.modello, { x: q.x, y: y - (1 - e) * 2.2, z: q.z, alto: figure.alto(q.fermo || q.pezzo, scala), eroe, t, dt, saluta: !!q.saluta })
          }
          if (!in3d) {
            o.scala = scala; o.specchio = !!q.specchio
            // un colore in più per chi lo vuole (il capitano: il blu del mantello, un lampo additivo piccolo sullo sprite della guardia)
            if (q.tinta) { o.rosso = q.tinta[0]; o.verde = q.tinta[1]; o.blu = q.tinta[2] }
            figure.metti(q.pezzo, q.x, y - (1 - e) * 2.2, q.z, o)
          }
          if (e > 0.9) ombra(q.x, y, q.z, 1.05)
        }
        if (persone3d) persone3d.chiudi()
        if (!eroe.nascosto) {
          finta.eroe.x = eroe.x; finta.eroe.y = eroe.z; finta.versoEroe.dx = eroe.verso.dx; finta.versoEroe.dy = eroe.verso.dy
          finta.io.sprite = eroe.sprite; finta.mano = eroe.mano; finta.mancina = eroe.mancina; finta.corpo = eroe.corpo
          disegnaEroe(eroe.stato, finta, { figure: terra, luci: nessuna, etichette: niente, camera, dt, dtScena: dt, t, modello: eroe3d, quota: quotaEroe })
          ombra(eroe.stato.disegnato.x, quota(eroe.x, eroe.z), eroe.stato.disegnato.z + 0.1, 0.95)
        }
      }
      if (extra && !veduta) extra(ombra)
      figure.chiudi(); figureEroe.chiudi()
      ombre.count = ACCESI.ombreMorbide ? nOmbre : 0; ombre.instanceMatrix.needsUpdate = true
    },
    taglio(x, y) { figure.taglio(x, y); figureEroe.taglio(x, y) },
    /** Quante persone hanno il modello 3D adesso, e quante istanze ci sono (per le prove: `grafica()`). */
    get persone3d() { return persone3d ? { visibili: persone3d.visibili, istanze: persone3d.quante } : null },
    get mostri3d() { return mostri3d ? mostri3d.visibili : 0 },
    via() { if (eroe3d) eroe3d.toglie(); if (mostri3d) mostri3d.via(); if (persone3d) persone3d.via(); figure.via(); figureEroe.via(); scena.remove(ombre); geo.dispose(); mat.dispose(); ombre.dispose(); maschera.t.dispose() },
  }
}
