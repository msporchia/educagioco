// Il conto del pezzo tenuto al dito, senza three né DOM (si prova in `test/unita/fattoria3d-trascinamento`). Due cose:
// 1. dove sta il pezzo: il punto del suolo sotto il dito (più la distanza che aveva al momento della presa) è il CENTRO del pezzo, e
//    l'angolo (i, j) che il motore vuole ne discende; il fantasma si disegna con lo stesso (i, j) con cui al rilascio si costruisce.
// 2. lo scorrimento ai bordi: la velocità della camera, in celle al secondo, quando il dito entra nella fascia di bordo.
// Vedi docs/fattoria3d/scena.md, «Costruire».

export const SOLLEVA_PX = 40            // un pezzo nuovo sta tanti px sopra il dito, per non nascondersi sotto: il fantasma lo mostra, e lì si costruisce
export const FASCIA_PX = 72             // la fascia di bordo che fa scorrere
export const SOPRA_UI_PX = 64           // in alto la barra (livello, banco, inventario): il bordo utile comincia sotto
export const SOTTO_UI_PX = 0            // in basso il bordo utile è la fascia «metti via» (`zonaDrop`), non lo schermo
export const VEL_MIN = 2                // celle al secondo appena dentro la fascia…
export const VEL_MAX = 12               // …e contro il bordo
export const MARGINE_PRESA = 1          // celle: un dito che preme a meno di tanto dal pezzo lo afferra (tenendo il punto preso)

/** Il punto del suolo tenuto dal dito + lo scarto della presa → l'angolo (i, j) di un pezzo largo `w` e profondo `d`: il suo centro cade lì. */
export function cellaSottoIlDito(punto, w, d, scarto = null) {
  const x = punto.x + (scarto ? scarto.x : 0), z = punto.z + (scarto ? scarto.z : 0)
  return { i: Math.round(x - w / 2), j: Math.round(z - d / 2) }
}
/** Il centro (nel mondo) di un pezzo con l'angolo in (i, j). */
export const centroDi = (i, j, w, d) => ({ x: i + w / 2, z: j + d / 2 })

/** Lo scarto che il dito ha preso: dal punto del suolo sotto il dito al centro del pezzo (si conserva finché lo si tiene). */
export function scartoDellaPresa(punto, i, j, w, d) {
  const c = centroDi(i, j, w, d); return { x: c.x - punto.x, z: c.z - punto.z }
}
/** Il punto preme dentro il pezzo (o a meno di `margine` celle)? Allora lo afferra dov'è; se no è un pezzo che si porta da lontano. */
export function dentroIlPezzo(punto, i, j, w, d, margine = MARGINE_PRESA) {
  return punto.x >= i - margine && punto.x <= i + w + margine && punto.z >= j - margine && punto.z <= j + d + margine
}

/**
 * La velocità di scorrimento della camera (celle/s, positiva verso destra e verso il basso dello schermo) per un dito in (x, y).
 * `area`: { sinistra, destra, alto, basso } in px della pagina, il bordo utile (sotto la barra, sopra la fascia «metti via»).
 * Fuori dalla fascia 0; dentro cresce col quadrato della profondità da VEL_MIN a VEL_MAX; oltre il bordo non va oltre VEL_MAX.
 */
export function velocitaBordo(x, y, area, fascia = FASCIA_PX) {
  const q = d => d >= fascia ? 0 : Math.min(1, (fascia - d) / fascia)          // 0 fuori, 1 contro il bordo
  const v = k => k <= 0 ? 0 : VEL_MIN + (VEL_MAX - VEL_MIN) * k * k
  const sx = v(q(area.destra - x)) - v(q(x - area.sinistra))
  const sy = v(q(area.basso - y)) - v(q(y - area.alto))
  return { x: sx, z: sy }
}
