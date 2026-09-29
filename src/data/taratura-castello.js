/* GENERATO da `npm run tara` — non si scrive a mano.

   La vita dei nemici di ogni ondata di ogni tappa, trovata giocando la
   tappa migliaia di volte con il motore vero (`strumenti/tara-castello.mjs`).
   Il criterio: ogni ondata vale una frazione del suo limite — la vita
   oltre la quale chi spende tutto non ce la fa più — e la frazione va
   dal 60% della prima ondata al 85% dell'ultima.
   La `FIRMA` è l'impronta dei numeri da cui è stata ricavata: se prezzi,
   torri o tappe cambiano, il test se ne accorge e chiede di rifarla. */
export const VITE = {
  "bosco/Il sentiero": [53, 65, 77],
  "bosco/Il guado": [72, 87, 102, 134],
  "bosco/La radura": [77, 102, 112, 154],
  "bosco/Il folto": [83, 99, 101, 75, 122],
  "bosco/La radice": [44, 178, 93, 69, 73, 223, 27],
  "sotterraneo/La grotta": [33, 54, 67, 76, 54, 107],
  "sotterraneo/La miniera": [64, 138, 115, 99, 68, 98, 202],
  "sotterraneo/Le fogne": [63, 62, 52, 29, 48, 125, 177],
  "sotterraneo/La cripta": [45, 32, 28, 47, 68, 140, 103, 47, 118, 102],
  "sotterraneo/La gola": [82, 86, 119, 50, 68, 159, 92, 96, 240, 38],
  "mura/Il cortile": [20, 49, 104, 56, 49, 135, 90, 77, 102],
  "mura/Il camminamento": [34, 46, 63, 47, 34, 71, 105, 90, 134, 119],
  "mura/Il corridoio": [105, 97, 25, 90, 233, 171, 140, 227, 51, 160, 161],
  "mura/La sala del trono": [63, 97, 47, 133, 74, 27, 168, 201, 92, 132, 276, 68, 70],
  "mura/Il torrione": [73, 52, 124, 47, 92, 94, 182, 124, 57, 124, 114, 173, 67, 143, 42],
  "palude/Il guado": [23, 55, 23, 16, 39, 131, 78],
  "palude/Il canneto": [45, 27, 48, 50, 125, 72, 75, 92, 94],
  "palude/Le isole": [27, 27, 82, 85, 62, 140, 36, 90, 158, 112],
  "palude/Il pantano": [63, 53, 49, 77, 63, 132, 72, 103, 62, 126, 59],
  "palude/La foce": [20, 26, 41, 35, 78, 133, 62, 90, 72, 115, 97, 249, 21],
  "libera-bosco": [63, 66, 121, 39, 122, 17, 99, 69, 96, 23, 110, 141, 91, 292, 56, 272, 119, 142, 263, 30],
  "libera-sotterraneo": [60, 20, 61, 32, 15, 89, 81, 131, 67, 23, 100, 233, 108, 184, 46, 44, 281, 121, 315, 23],
  "libera-mura": [176, 91, 47, 87, 159, 89, 64, 209, 239, 41, 40, 431, 227, 188, 404, 877, 233, 269, 1076, 103],
  "libera-palude": [45, 46, 21, 30, 33, 15, 119, 87, 48, 20, 160, 43, 91, 66, 55, 208, 207, 129, 275, 45],
}
/* di quanto cresce la vita in ogni partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = {"libera-bosco":1.3,"libera-sotterraneo":1.3,"libera-mura":1.3,"libera-palude":1.3}
export const FIRMA = "94dd31b"
export const BERSAGLIO = [0.6, 0.85]
