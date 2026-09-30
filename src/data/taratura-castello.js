/* GENERATO da `npm run tara` — non si scrive a mano.

   La vita dei nemici di ogni ondata di ogni tappa, trovata giocando la
   tappa migliaia di volte con il motore vero (`strumenti/tara-castello.mjs`).
   Il criterio: ogni ondata vale una frazione del suo limite — la vita
   oltre la quale chi spende tutto non ce la fa più — e la frazione va
   dal 60% della prima ondata al 85% dell'ultima.
   La `FIRMA` è l'impronta dei numeri da cui è stata ricavata: se prezzi,
   torri o tappe cambiano, il test se ne accorge e chiede di rifarla. */
export const VITE = {
  "bosco/Il sentiero": [46, 54, 64],
  "bosco/Il guado": [77, 94, 102, 126],
  "bosco/La radura": [68, 78, 112, 112],
  "bosco/Il folto": [123, 106, 143, 83, 175],
  "bosco/La radice": [44, 101, 57, 49, 52, 144, 44, 59],
  "sotterraneo/La grotta": [33, 56, 68, 61, 56, 119],
  "sotterraneo/La miniera": [96, 142, 133, 101, 61, 103, 210],
  "sotterraneo/Le fogne": [27, 71, 23, 22, 49, 120, 91],
  "sotterraneo/La cripta": [60, 47, 55, 95, 62, 169, 81, 99, 103, 107],
  "sotterraneo/La gola": [84, 97, 149, 59, 31, 168, 94, 97, 245, 125, 10],
  "mura/Il cortile": [27, 51, 80, 49, 51, 119, 80, 80, 107],
  "mura/Il camminamento": [31, 43, 40, 47, 31, 52, 40, 97, 111, 52, 130],
  "mura/Il corridoio": [103, 107, 25, 113, 107, 91, 168, 184, 57, 213, 135],
  "mura/La sala del trono": [57, 97, 44, 102, 56, 27, 141, 212, 93, 110, 252, 57, 247, 164, 77],
  "mura/Il torrione": [77, 52, 79, 45, 131, 92, 93, 165, 57, 118, 119, 201, 58, 150, 23],
  "palude/Il guado": [20, 61, 23, 16, 58, 136, 75],
  "palude/Il canneto": [45, 53, 46, 48, 126, 66, 69, 97, 90],
  "palude/Le isole": [20, 53, 180, 55, 70, 193, 29, 97, 210, 87, 157],
  "palude/Il pantano": [72, 53, 64, 69, 80, 126, 33, 105, 62, 107, 59],
  "palude/La foce": [20, 52, 45, 40, 89, 149, 65, 94, 72, 99, 107, 380, 28],
  "libera-bosco": [60, 58, 105, 53, 110, 34, 127, 71, 49, 21, 103, 138, 144, 259, 49, 385, 149, 149, 413, 21],
  "libera-sotterraneo": [45, 20, 94, 32, 19, 114, 66, 171, 67, 28, 154, 248, 99, 211, 42, 19, 279, 251, 359, 28],
  "libera-mura": [166, 80, 47, 89, 166, 89, 67, 234, 200, 35, 40, 347, 173, 124, 226, 528, 222, 271, 1088, 70],
  "libera-palude": [40, 46, 21, 14, 33, 15, 86, 125, 49, 24, 245, 43, 53, 48, 37, 100, 307, 91, 213, 46],
}
/* di quanto cresce la vita in ogni partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = {"libera-bosco":1.3,"libera-sotterraneo":1.3,"libera-mura":1.31,"libera-palude":1.3}
export const FIRMA = "1d62af23"
export const BERSAGLIO = [0.6, 0.85]
