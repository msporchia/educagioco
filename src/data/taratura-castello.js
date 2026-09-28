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
  "bosco/Il guado": [27, 50, 37, 66],
  "bosco/La radura": [90, 64, 16, 62, 155],
  "bosco/Il folto": [75, 22, 55, 76, 136, 59],
  "bosco/La radice": [71, 128, 75, 57, 110, 159, 31],
  "sotterraneo/La grotta": [20, 29, 86, 30, 69, 150],
  "sotterraneo/La miniera": [79, 56, 22, 101, 97, 77, 60, 130],
  "sotterraneo/Le fogne": [17, 31, 22, 33, 17, 31, 39, 92],
  "sotterraneo/La cripta": [47, 44, 51, 99, 90, 135, 98, 44, 102],
  "sotterraneo/La gola": [53, 55, 89, 48, 28, 136, 65, 153, 244, 123, 10],
  "mura/Il cortile": [29, 72, 95, 29, 72, 96, 49, 125, 152],
  "mura/Il camminamento": [29, 29, 51, 30, 55, 29, 89, 111, 103, 57, 183],
  "mura/Il corridoio": [57, 21, 21, 94, 38, 100, 122, 61, 49, 192, 213],
  "mura/La sala del trono": [29, 55, 72, 26, 63, 23, 73, 145, 230, 106, 116, 43, 184, 259],
  "mura/Il torrione": [63, 27, 75, 51, 49, 45, 73, 73, 75, 106, 100, 101, 103, 14],
  "palude/Il guado": [32, 51, 44, 32, 103, 175],
  "palude/Il canneto": [29, 51, 29, 42, 51, 29, 42, 79, 45, 117],
  "palude/Le isole": [20, 32, 21, 15, 23, 32, 35, 36, 50, 115, 56, 110],
  "palude/Il pantano": [20, 54, 21, 15, 16, 17, 23, 54, 60, 74, 44, 50, 59],
  "palude/La foce": [20, 55, 31, 32, 49, 45, 38, 94, 80, 73, 100, 119, 28],
  "libera-bosco": [27, 30, 58, 28, 32, 48, 75, 27, 108, 10, 40, 152, 96, 106, 99, 256, 136, 161, 151, 14],
  "libera-sotterraneo": [63, 30, 44, 14, 16, 69, 15, 17, 47, 13, 65, 65, 25, 58, 112, 298, 98, 51, 140, 24],
  "libera-mura": [40, 81, 113, 56, 145, 117, 43, 71, 114, 52, 119, 343, 136, 417, 425, 280, 74, 337, 563, 122],
  "libera-palude": [8, 30, 21, 8, 16, 15, 30, 8, 34, 6, 8, 18, 51, 55, 33, 200, 112, 51, 66, 17],
}
/* di quanto cresce la vita in ogni partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = {"libera-bosco":1.3,"libera-sotterraneo":1.3,"libera-mura":1.3,"libera-palude":1.34}
export const FIRMA = "2a3dd5c4"
export const BERSAGLIO = [0.6, 0.85]
