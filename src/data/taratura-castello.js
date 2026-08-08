/* GENERATO da `npm run tara` — non si scrive a mano.

   La vita dei nemici di ogni ondata di ogni tappa, trovata giocando la
   tappa migliaia di volte con il motore vero (`strumenti/tara-castello.mjs`).
   Il criterio: ogni ondata vale una frazione del suo limite — la vita
   oltre la quale chi spende tutto non ce la fa più — e la frazione va
   dal 60% della prima ondata al 85% dell'ultima.
   La `FIRMA` è l'impronta dei numeri da cui è stata ricavata: se prezzi,
   torri o tappe cambiano, il test se ne accorge e chiede di rifarla. */
export const VITE = {
  "bosco/Il sentiero": [46, 54, 54, 68],
  "bosco/Il guado": [84, 104, 104, 152, 152],
  "bosco/La radura": [130, 156, 156, 193, 207],
  "bosco/Il folto": [84, 103, 140, 168, 187, 239, 239],
  "bosco/La radice": [103, 103, 103, 145, 145, 145, 246, 428],
  "sotterraneo/La grotta": [129, 139, 139, 191, 194, 194],
  "sotterraneo/La miniera": [91, 158, 192, 192, 203, 203, 203],
  "sotterraneo/Le fogne": [58, 58, 58, 127, 127, 141, 216, 216, 216],
  "sotterraneo/La cripta": [115, 115, 115, 169, 169, 170, 247, 247, 247, 557],
  "sotterraneo/La gola": [77, 118, 118, 118, 154, 154, 154, 280, 280, 280, 382, 382],
  "mura/Il cortile": [89, 89, 135, 135, 135, 213, 213, 232, 347],
  "mura/Il camminamento": [81, 90, 90, 115, 115, 115, 171, 171, 171, 298, 298, 298],
  "mura/Il corridoio": [49, 49, 49, 95, 97, 97, 153, 162, 162, 220, 225, 225, 324, 867],
  "mura/La sala del trono": [98, 98, 98, 140, 140, 140, 178, 178, 178, 301, 301, 301, 460, 460, 652],
  "mura/Il torrione": [88, 88, 88, 109, 109, 109, 173, 173, 173, 279, 292, 292, 418, 583, 583, 733, 1303],
  "Partita libera": [98, 98, 126, 170, 170, 182, 205, 307, 307, 307, 363, 363, 506, 506, 789, 789, 975, 1080, 1353, 2744],
}
/* di quanto cresce la vita nella partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = 1.41
export const FIRMA = "6eea6e47"
export const BERSAGLIO = [0.6, 0.85]
