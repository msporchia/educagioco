/* GENERATO da `npm run tara` — non si scrive a mano.

   La vita dei nemici di ogni ondata di ogni tappa, trovata giocando la
   tappa migliaia di volte con il motore vero (`strumenti/tara-castello.mjs`).
   Il criterio: ogni ondata vale una frazione del suo limite — la vita
   oltre la quale chi spende tutto non ce la fa più — e la frazione va
   dal 60% della prima ondata al 85% dell'ultima.
   La `FIRMA` è l'impronta dei numeri da cui è stata ricavata: se prezzi,
   torri o tappe cambiano, il test se ne accorge e chiede di rifarla. */
export const VITE = {
  "bosco/Il sentiero": [53, 55, 77],
  "bosco/Il guado": [75, 94, 99, 124],
  "bosco/La radura": [103, 112, 134, 140],
  "bosco/Il folto": [116, 95, 133, 83, 164],
  "bosco/La radice": [60, 128, 57, 73, 104, 178, 86, 67],
  "sotterraneo/La grotta": [40, 55, 75, 72, 56, 108],
  "sotterraneo/La miniera": [96, 142, 133, 101, 84, 103, 227],
  "sotterraneo/Le fogne": [33, 77, 23, 31, 49, 153, 91],
  "sotterraneo/La cripta": [41, 32, 55, 95, 62, 169, 41, 50, 103, 107],
  "sotterraneo/La gola": [84, 97, 172, 59, 61, 206, 94, 97, 245, 142, 17],
  "mura/Il cortile": [20, 51, 76, 45, 51, 135, 64, 80, 107],
  "mura/Il camminamento": [30, 43, 40, 47, 31, 52, 40, 97, 111, 52, 130],
  "mura/Il corridoio": [86, 86, 25, 110, 123, 91, 168, 129, 57, 213, 135],
  "mura/La sala del trono": [57, 86, 22, 97, 56, 27, 145, 212, 93, 110, 252, 57, 242, 164, 77],
  "mura/Il torrione": [77, 52, 79, 45, 131, 92, 93, 165, 57, 118, 119, 201, 58, 150, 23],
  "palude/Il guado": [23, 61, 23, 16, 19, 123, 75],
  "palude/Il canneto": [45, 27, 46, 48, 100, 66, 69, 97, 90],
  "palude/Le isole": [27, 53, 152, 55, 70, 152, 29, 97, 301, 90, 157],
  "palude/Il pantano": [75, 53, 65, 69, 80, 191, 65, 105, 62, 107, 59],
  "palude/La foce": [27, 26, 48, 42, 79, 145, 68, 94, 72, 99, 67, 254, 32],
  "libera-bosco": [45, 14, 100, 32, 70, 34, 125, 59, 49, 14, 53, 138, 113, 196, 49, 270, 149, 129, 338, 14],
  "libera-sotterraneo": [45, 20, 47, 32, 15, 72, 64, 140, 65, 21, 154, 230, 99, 271, 42, 19, 371, 229, 224, 21],
  "libera-mura": [146, 87, 47, 89, 181, 68, 67, 244, 200, 24, 40, 294, 180, 124, 226, 432, 196, 261, 1689, 65],
  "libera-palude": [40, 46, 21, 14, 33, 15, 75, 132, 49, 23, 217, 43, 61, 48, 37, 75, 342, 104, 270, 48],
}
/* di quanto cresce la vita in ogni partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = {"libera-bosco":1.3,"libera-sotterraneo":1.3,"libera-mura":1.36,"libera-palude":1.3}
export const FIRMA = "479962c7"
export const BERSAGLIO = [0.6, 0.85]
