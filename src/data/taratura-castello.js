/* GENERATO da `npm run tara` — non si scrive a mano.

   La vita dei nemici di ogni ondata di ogni tappa, trovata giocando la
   tappa migliaia di volte con il motore vero (`strumenti/tara-castello.mjs`).
   Il criterio: ogni ondata vale una frazione del suo limite — la vita
   oltre la quale chi spende tutto non ce la fa più — e la frazione va
   dal 60% della prima ondata al 85% dell'ultima.
   La `FIRMA` è l'impronta dei numeri da cui è stata ricavata: se prezzi,
   torri o tappe cambiano, il test se ne accorge e chiede di rifarla. */
export const VITE = {
  "bosco/Il sentiero": [49, 59, 77],
  "bosco/Il guado": [72, 91, 109, 146],
  "bosco/La radura": [90, 71, 113, 112, 155],
  "bosco/Il folto": [75, 63, 109, 76, 136, 183],
  "bosco/La radice": [71, 142, 75, 57, 110, 185, 31],
  "sotterraneo/La grotta": [20, 29, 86, 30, 69, 150],
  "sotterraneo/La miniera": [79, 77, 85, 101, 24, 142, 187, 196],
  "sotterraneo/Le fogne": [40, 59, 31, 16, 18, 112, 134, 92],
  "sotterraneo/La cripta": [47, 44, 51, 99, 90, 213, 98, 44, 102],
  "sotterraneo/La gola": [53, 55, 97, 48, 28, 178, 65, 153, 294, 123, 10],
  "mura/Il cortile": [29, 72, 123, 29, 72, 154, 49, 125, 152],
  "mura/Il camminamento": [29, 29, 51, 30, 55, 29, 89, 111, 103, 57, 183],
  "mura/Il corridoio": [57, 45, 21, 94, 105, 100, 122, 180, 49, 192, 122],
  "mura/La sala del trono": [57, 44, 31, 89, 59, 23, 158, 224, 149, 113, 408, 136, 533, 259],
  "mura/Il torrione": [63, 27, 103, 51, 81, 109, 186, 103, 63, 126, 100, 225, 103, 24],
  "palude/Il guado": [20, 46, 22, 16, 18, 82, 46, 82],
  "palude/Il canneto": [29, 55, 32, 29, 102, 29, 42, 79, 45, 117],
  "palude/Le isole": [20, 55, 62, 22, 79, 121, 39, 96, 168, 66, 209, 233],
  "palude/Il pantano": [29, 55, 43, 47, 53, 93, 29, 79, 57, 111, 61, 198],
  "palude/La foce": [20, 55, 31, 21, 108, 89, 38, 94, 80, 49, 100, 203, 28],
  "libera-bosco": [29, 43, 48, 15, 80, 16, 46, 61, 31, 13, 86, 109, 73, 288, 54, 175, 204, 126, 183, 27],
  "libera-sotterraneo": [63, 14, 44, 31, 15, 54, 78, 110, 40, 19, 65, 170, 100, 221, 43, 42, 332, 208, 245, 19],
  "libera-mura": [178, 59, 46, 92, 166, 95, 97, 278, 266, 30, 38, 593, 237, 304, 538, 1122, 282, 325, 1769, 136],
  "libera-palude": [20, 30, 14, 14, 16, 15, 52, 79, 31, 13, 145, 36, 75, 53, 61, 124, 342, 102, 167, 44],
}
/* di quanto cresce la vita in ogni partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = {"libera-bosco":1.3,"libera-sotterraneo":1.3,"libera-mura":1.35,"libera-palude":1.3}
export const FIRMA = "4f9e844b"
export const BERSAGLIO = [0.6, 0.85]
