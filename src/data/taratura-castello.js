/* GENERATO da `npm run tara` — non si scrive a mano.

   La vita dei nemici di ogni ondata di ogni tappa, trovata giocando la
   tappa migliaia di volte con il motore vero (`strumenti/tara-castello.mjs`).
   Il criterio: ogni ondata vale una frazione del suo limite — la vita
   oltre la quale chi spende tutto non ce la fa più — e la frazione va
   dal 60% della prima ondata al 85% dell'ultima.
   La `FIRMA` è l'impronta dei numeri da cui è stata ricavata: se prezzi,
   torri o tappe cambiano, il test se ne accorge e chiede di rifarla. */
export const VITE = {
  "bosco/Il sentiero": [53, 59, 59, 68],
  "bosco/Il guado": [34, 34, 47, 62, 113],
  "bosco/La radura": [72, 72, 82, 82, 168],
  "bosco/Il folto": [47, 47, 47, 47, 81, 81, 196],
  "bosco/La radice": [51, 51, 80, 80, 80, 145, 162, 241],
  "sotterraneo/La grotta": [42, 42, 70, 70, 70, 136],
  "sotterraneo/La miniera": [60, 60, 60, 90, 90, 90, 154],
  "sotterraneo/Le fogne": [20, 20, 20, 20, 20, 75, 75, 122, 150],
  "sotterraneo/La cripta": [60, 60, 60, 60, 104, 104, 104, 185, 247, 331],
  "sotterraneo/La gola": [49, 49, 68, 69, 69, 103, 103, 103, 150, 156, 156, 337],
  "mura/Il cortile": [61, 61, 61, 61, 95, 95, 95, 120, 256],
  "mura/Il camminamento": [40, 40, 41, 69, 69, 69, 107, 107, 113, 172, 172, 266],
  "mura/Il corridoio": [28, 28, 47, 47, 47, 77, 77, 82, 118, 118, 124, 179, 179, 481],
  "mura/La sala del trono": [57, 57, 57, 57, 92, 92, 92, 115, 132, 132, 184, 190, 190, 244, 605],
  "mura/Il torrione": [26, 26, 26, 26, 26, 26, 26, 26, 78, 78, 78, 117, 117, 117, 186, 186, 186],
  "palude/Il guado": [31, 31, 32, 41, 41, 41, 41, 177],
  "palude/Il canneto": [29, 29, 29, 29, 43, 43, 46, 143, 143],
  "palude/Le isole": [42, 42, 42, 42, 46, 46, 70, 70, 135, 135, 266, 266],
  "palude/Il pantano": [14, 14, 14, 31, 31, 31, 45, 46, 46, 64, 70, 70, 94],
  "palude/La foce": [14, 14, 14, 36, 36, 36, 44, 51, 51, 63, 69, 69, 92, 371],
  "Partita libera": [43, 43, 60, 60, 79, 79, 115, 115, 138, 142, 142, 176, 176, 316, 316, 756, 915, 1110, 1233, 1624],
}
/* di quanto cresce la vita nella partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = 1.45
export const FIRMA = "7d1974d"
export const BERSAGLIO = [0.6, 0.85]
