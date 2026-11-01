// Le sagome (docs/sotterraneo/sagome-3d.md): la figura piatta di un mostro o di una persona è la foto del suo modello, nella posa e
// dalla parte che il modello avrebbe adesso. Qui, senza three, le regole che il fotografo (sagome-foto.js) e la scena (sagome.js)
// devono dire uguali: le pose fotografate, la direzione, il fotogramma, la misura.

// la telecamera delle foto guarda da 52° sotto l'orizzonte, come quella delle discese e del mondo di sopra (costanti.js, veduta.js)
export const INCLINAZIONE = 52
export const COS = Math.cos(INCLINAZIONE * Math.PI / 180), SIN = Math.sin(INCLINAZIONE * Math.PI / 180)
// otto direzioni attorno, senza specchio: la mano dell'arma resta quella del modello
export const DIREZIONI = 8
// le pose di ogni direzione, in fila: il respiro (QUANTI_RESPIRO istanti, uno ogni PASSO_RESPIRO secondi), il colpo (`attacca(p)`
// all'arrivo), la caduta (a terra). Le persone hanno solo il respiro. Colpo e caduta di una sagoma si vedono solo se un modello si
// rompe o se uno scontro ha più mostri del tetto: una posa ciascuno (docs/sotterraneo/sagome-3d.md, «Le pose»)
export const QUANTI_RESPIRO = 3, PASSO_RESPIRO = 0.8
export const COLPO = [1]     // frazioni dell'arrivo (oltre 1 si conterebbe sul ritorno)
export const CADUTA = [1]    // quanto è già caduto (cose.js: `liscio(morente / 0.6)`)
export const POSE_MOSTRO = QUANTI_RESPIRO + COLPO.length + CADUTA.length
export const POSE_PERSONA = QUANTI_RESPIRO
// lo stesso rapporto dell'eroe 3D: il modello è alto RAPPORTO volte la misura del posto (dati/altezze.js) allungata per la vista
export const RAPPORTO = 0.72
export const LARGO_MAX = 1.5   // celle: un modello largo (le ali, la coda) non esce dal suo posto sul palco
export const SCALA_PERSONE = 1.25   // le persone di sopra stanno a 1,25 dell'eroe (scena3d/mondo/persone.js)

/** La direzione fotografata più vicina a un giro attorno a y (radianti; 0 guarda la telecamera, verso +z). */
export function direzioneDi(yaw) {
  const d = Math.round(yaw / (2 * Math.PI / DIREZIONI)) % DIREZIONI
  return d < 0 ? d + DIREZIONI : d
}
export const yawDi = d => d * 2 * Math.PI / DIREZIONI

/** Il punto `p` (0..1) dell'attacco per il fotogramma `i` del colpo, dato l'arrivo `a`. */
export function puntoDelColpo(i, a) {
  const f = COLPO[i]
  return f <= 1 ? a * f : a + (1 - a) * (f - 1)
}

/**
 * La posa da mostrare (indice dentro la direzione). `t`: il tempo del respiro (con la sua fase); `attacco`: p dell'attacco (−1 fermo)
 * con il suo `arrivo`; `caduto`: 0..1. Il colpo prende il punto fotografato più vicino; ai due capi (p vicino a 0 o 1) è il respiro,
 * come il modello, che a p = 0 e 1 sta nella posa di riposo.
 */
export function posaDi({ t = 0, attacco = -1, arrivo = 0.5, caduto = 0, haColpo = true, persona = false }) {
  const respiro = ((Math.floor(t / PASSO_RESPIRO) % QUANTI_RESPIRO) + QUANTI_RESPIRO) % QUANTI_RESPIRO
  if (persona) return respiro
  if (caduto > 0.4) return QUANTI_RESPIRO + COLPO.length + (CADUTA.length > 1 && caduto > 0.75 ? 1 : 0)
  if (haColpo && attacco >= 0) {
    let migliore = -1, dist = Math.min(attacco, 1 - attacco) * 0.75   // vicino ai capi resta il respiro
    for (let i = 0; i < COLPO.length; i++) {
      const d = Math.abs(attacco - puntoDelColpo(i, arrivo))
      if (d < dist) { dist = d; migliore = i }
    }
    if (migliore >= 0) return QUANTI_RESPIRO + migliore
  }
  return respiro
}

/**
 * Di quanto si ingrandisce un modello alto `alto` e largo `largo` (la sua scatola, a riposo) perché stia nel posto alto `altoPosto`
 * celle (già allungato per la vista): RAPPORTO dell'altezza, mai più largo di LARGO_MAX celle (di più per chi è alto, i grossi).
 * `fattore`: chi si misura male (il drago grande, registro.js `ALTEZZA`). Lo usano il modello (mostro3d.js) e la sua sagoma.
 */
export function scalaDelModello(alto, largo, altoPosto, fattore = 1) {
  const k0 = (altoPosto || 1) * RAPPORTO * fattore / Math.max(0.2, alto)
  return Math.min(k0, LARGO_MAX * Math.max(1, altoPosto / 1.6) / Math.max(0.2, largo))
}

/**
 * Dove si mette il cartello di un fotogramma `f` = [x, y, w, h, ax, ab] (ax: pixel dal bordo sinistro ai piedi; ab: pixel dal fondo
 * del ritaglio in giù fino ai piedi, negativo se il ritaglio comincia sopra i piedi) per un modello che in scena ha scala `k` e foto a
 * `px` pixel per unità del modello, con la telecamera inclinata di adesso (`cosV`: il coseno, 1/ALLUNGA). Il cartello sta in piedi,
 * allungato di 1/cosV come gli sprite: a schermo la foto ha la sua misura qualunque sia l'inclinazione (nello scontro la telecamera
 * scende a 36°, e la sagoma resta vista da 52°). Quello che nella foto sta sotto i piedi (il davanti di chi è caduto in avanti) non può
 * finire sotto il pavimento: il cartello avanza verso la telecamera. → { dx, y, dz, largo, alto } in celle.
 */
export function cartelloDi(f, k, px, cosV = COS, fuori = {}) {
  const u = k / px   // celle per pixel della foto
  const ab = f[5], w = Math.abs(f[2]), sinV = Math.sqrt(Math.max(0, 1 - cosV * cosV))
  fuori.largo = w * u
  fuori.alto = f[3] * u / cosV
  fuori.dx = (w / 2 - f[4]) * u
  fuori.dz = ab > 0 ? ab * u / sinV : 0
  fuori.y = ab < 0 ? -ab * u / cosV : 0
  return fuori
}
