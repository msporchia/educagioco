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
  "bosco/Il guado": [77, 94, 106, 124],
  "bosco/La radura": [103, 109, 134, 140],
  "bosco/Il folto": [123, 95, 133, 83, 169],
  "bosco/La radice": [60, 128, 57, 49, 104, 178, 86, 67],
  "sotterraneo/La grotta": [40, 55, 75, 79, 56, 119],
  "sotterraneo/La miniera": [92, 149, 133, 101, 84, 103, 227],
  "sotterraneo/Le fogne": [33, 77, 23, 22, 53, 148, 91],
  "sotterraneo/La cripta": [45, 32, 55, 95, 62, 169, 81, 99, 103, 107],
  "sotterraneo/La gola": [84, 97, 197, 59, 61, 220, 94, 97, 249, 142, 17],
  "mura/Il cortile": [20, 51, 85, 45, 51, 145, 69, 80, 107],
  "mura/Il camminamento": [30, 43, 45, 94, 61, 52, 79, 97, 115, 52, 130],
  "mura/Il corridoio": [86, 86, 25, 110, 127, 91, 168, 129, 57, 213, 135],
  "mura/La sala del trono": [57, 92, 44, 101, 56, 27, 145, 152, 93, 110, 252, 57, 307, 164, 77],
  "mura/Il torrione": [77, 52, 79, 45, 123, 92, 93, 185, 57, 112, 119, 201, 58, 150, 23],
  "palude/Il guado": [23, 61, 23, 16, 19, 120, 75],
  "palude/Il canneto": [45, 27, 46, 48, 126, 66, 69, 97, 90],
  "palude/Le isole": [27, 53, 152, 61, 70, 152, 29, 97, 301, 110, 157],
  "palude/Il pantano": [75, 53, 65, 69, 80, 191, 65, 107, 62, 107, 59],
  "palude/La foce": [27, 26, 48, 42, 89, 145, 68, 94, 72, 99, 67, 254, 32],
  "libera-bosco": [45, 14, 100, 32, 64, 34, 125, 59, 49, 14, 53, 138, 113, 234, 78, 263, 149, 129, 338, 14],
  "libera-sotterraneo": [45, 20, 47, 32, 15, 67, 64, 154, 67, 21, 154, 230, 99, 263, 42, 19, 370, 229, 250, 21],
  "libera-mura": [145, 82, 47, 89, 181, 68, 67, 244, 191, 24, 40, 311, 180, 124, 226, 454, 222, 245, 1523, 67],
  "libera-palude": [40, 46, 21, 14, 33, 15, 107, 132, 98, 23, 217, 43, 61, 96, 37, 173, 328, 104, 270, 48],
}
/* di quanto cresce la vita in ogni partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = {"libera-bosco":1.3,"libera-sotterraneo":1.3,"libera-mura":1.35,"libera-palude":1.3}
export const FIRMA = "3a634547"
export const BERSAGLIO = [0.6, 0.85]
