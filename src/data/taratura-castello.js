/* GENERATO da `npm run tara` — non si scrive a mano.

   La vita dei nemici di ogni ondata di ogni tappa, trovata giocando la
   tappa migliaia di volte con il motore vero (`strumenti/tara-castello.mjs`).
   Il criterio: ogni ondata vale una frazione del suo limite — la vita
   oltre la quale chi spende tutto non ce la fa più — e la frazione va
   dal 60% della prima ondata al 85% dell'ultima.
   La `FIRMA` è l'impronta dei numeri da cui è stata ricavata: se prezzi,
   torri o tappe cambiano, il test se ne accorge e chiede di rifarla. */
export const VITE = {
  "bosco/Il sentiero": [46, 60, 77],
  "bosco/Il guado": [27, 50, 37, 66],
  "bosco/La radura": [92, 64, 16, 93, 163],
  "bosco/Il folto": [72, 21, 52, 75, 138, 59],
  "bosco/La radice": [71, 160, 68, 57, 55, 159, 31],
  "sotterraneo/La grotta": [20, 40, 53, 36, 40, 97],
  "sotterraneo/La miniera": [79, 55, 22, 98, 141, 74, 60, 123],
  "sotterraneo/Le fogne": [17, 31, 22, 31, 17, 31, 39, 73],
  "sotterraneo/La cripta": [47, 44, 58, 50, 101, 176, 110, 44, 102],
  "sotterraneo/La gola": [53, 55, 89, 40, 28, 132, 65, 153, 244, 109, 10],
  "mura/Il cortile": [29, 69, 92, 29, 69, 92, 46, 119, 145],
  "mura/Il camminamento": [29, 29, 51, 30, 70, 29, 93, 111, 103, 57, 139],
  "mura/Il corridoio": [57, 21, 21, 94, 76, 50, 122, 61, 49, 200, 289],
  "mura/La sala del trono": [29, 55, 59, 26, 60, 23, 85, 105, 230, 53, 116, 43, 190, 307],
  "mura/Il torrione": [62, 54, 69, 49, 46, 42, 83, 68, 69, 49, 91, 90, 146, 12],
  "palude/Il guado": [39, 50, 43, 46, 105, 165],
  "palude/Il canneto": [29, 51, 29, 42, 51, 29, 42, 79, 45, 59],
  "palude/Le isole": [20, 32, 21, 15, 23, 32, 35, 36, 50, 115, 86, 66],
  "palude/Il pantano": [20, 49, 21, 14, 16, 16, 22, 49, 55, 69, 39, 51, 24],
  "palude/La foce": [20, 55, 31, 32, 49, 45, 38, 94, 80, 73, 146, 119, 28],
  "libera-bosco": [47, 30, 21, 69, 16, 48, 22, 31, 55, 21, 112, 74, 180, 290, 132, 29, 124, 242, 258, 35],
  "libera-sotterraneo": [44, 54, 50, 58, 28, 14, 29, 48, 59, 13, 118, 54, 99, 61, 126, 143, 19, 151, 62, 29],
  "libera-mura": [33, 80, 27, 70, 90, 141, 76, 162, 131, 49, 100, 316, 50, 145, 385, 818, 329, 529, 330, 107],
  "libera-palude": [15, 5, 31, 18, 15, 16, 15, 15, 5, 9, 18, 26, 136, 16, 124, 5, 65, 57, 26, 25],
}
/* di quanto cresce la vita in ogni partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = {"libera-bosco":1.3,"libera-sotterraneo":1.3,"libera-mura":1.3,"libera-palude":1.3}
export const FIRMA = "95f6542a"
export const BERSAGLIO = [0.6, 0.85]
