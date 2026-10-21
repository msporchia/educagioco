// Le persone del mondo di sopra e l'eroe: sprite ancorati (la strada A di mondo-aperto-fasi.md). Le figure dell'atlante delle
// discese (scena3d/figure.js) col filo scuro attorno e la luce di taglio dal lato del sole, un'ombra morbida a contatto sotto i
// piedi (più l'ombra vera del sole), le persone a scala 1,25 dell'eroe, come sulla terra dipinta. L'eroe è quello delle discese
// (scena3d/eroe.js, con le armi in mano), posato sul terreno. Chi non si è visto non si disegna; entrando in vista sale dal
// terreno come gli oggetti.
import { DataTexture, RGBAFormat, Vector2, InstancedMesh, PlaneGeometry, MeshBasicMaterial, Matrix4, Quaternion, Vector3, Euler } from 'three'
import { creaFigure } from '../figure.js'
import { disegnaEroe } from '../eroe.js'
import { creaEroe3d, eroe3dAcceso } from '../eroe3d.js'
import { SALITA } from './vesti.js'

export const SCALA_PERSONE = 1.25
const OMBRE_MAX = 120

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
  const salita = (x, z, t) => { const k = Math.max(0, Math.min(1, (t - nebbia.quando(x, z)) / SALITA)); return k * k * (3 - 2 * k) }

  return {
    figure, figureEroe,
    // `persone` [{ pezzo, x, z, specchio }], `eroe` { stato (di eroe.js), x, z, verso, sprite, mano, mancina }; `veduta`: dall'alto
    // le figure non si vedono (troppo piccole: lì parlano i nomi). `mostri` e `perTerra`: i mostri di sopra e le cose rimaste per terra
    // (mostri.js, già filtrati dal cerchio e dalla nebbia); `extra(ombra)`: chi disegna anche lui (il palco dello scontro) e vuole l'ombra
    disegna(persone, eroe, { t, dt, veduta, camera, mostri = [], perTerra = [], extra = null }) {
      figure.inizia(); figureEroe.inizia(); nOmbre = 0
      if (eroe3d && (veduta || eroe.nascosto)) eroe3d.nascondi()
      if (!veduta) {
        // i mostri: come le persone, alla loro scala; al bordo del cerchio di luce svaniscono a retino
        for (const q of mostri) {
          const o = figure.o(), y = quota(q.x, q.z)
          o.scala = q.scala; o.specchio = q.specchio; o.trasparenza = q.alfa
          figure.metti(q.pezzo, q.x, y, q.z + 0.1, o)
          if (q.alfa > 0.5) ombra(q.x, y, q.z + 0.1, 0.9 * Math.min(1.4, q.scala))
        }
        // il bottino che non stava in tasca: piccolo, che ondeggia sul prato
        for (const c of perTerra) {
          const o = figure.o(), y = quota(c.x, c.z)
          o.scala = 0.8
          figure.metti(c.pezzo, c.x, y + 0.1 + Math.sin(t * 2.6 + c.x) * 0.06, c.z, o)
        }
        for (const q of persone) {
          if (!nebbia.visto(q.x, q.z)) continue
          const e = salita(q.x, q.z, t), o = figure.o(), y = quota(q.x, q.z)
          o.scala = q.scala || SCALA_PERSONE; o.specchio = !!q.specchio
          // un colore in più per chi lo vuole (il capitano: il blu del mantello, un lampo additivo piccolo sullo sprite della guardia)
          if (q.tinta) { o.rosso = q.tinta[0]; o.verde = q.tinta[1]; o.blu = q.tinta[2] }
          figure.metti(q.pezzo, q.x, y - (1 - e) * 2.2, q.z, o)
          if (e > 0.9) ombra(q.x, y, q.z, 1.05)
        }
        if (!eroe.nascosto) {
          finta.eroe.x = eroe.x; finta.eroe.y = eroe.z; finta.versoEroe.dx = eroe.verso.dx; finta.versoEroe.dy = eroe.verso.dy
          finta.io.sprite = eroe.sprite; finta.mano = eroe.mano; finta.mancina = eroe.mancina; finta.corpo = eroe.corpo
          disegnaEroe(eroe.stato, finta, { figure: terra, luci: nessuna, etichette: niente, camera, dt, dtScena: dt, t, modello: eroe3d, quota: quotaEroe })
          ombra(eroe.stato.disegnato.x, quota(eroe.x, eroe.z), eroe.stato.disegnato.z + 0.1, 0.95)
        }
      }
      if (extra && !veduta) extra(ombra)
      figure.chiudi(); figureEroe.chiudi()
      ombre.count = nOmbre; ombre.instanceMatrix.needsUpdate = true
    },
    taglio(x, y) { figure.taglio(x, y); figureEroe.taglio(x, y) },
    via() { if (eroe3d) eroe3d.toglie(); figure.via(); figureEroe.via(); scena.remove(ombre); geo.dispose(); mat.dispose(); ombre.dispose(); maschera.t.dispose() },
  }
}
