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
  "bosco/Il guado": [99, 110, 116, 149, 149],
  "bosco/La radura": [153, 159, 159, 188, 221],
  "bosco/Il folto": [92, 113, 137, 156, 200, 239, 239],
  "bosco/La radice": [112, 112, 113, 145, 145, 145, 267, 428],
  "sotterraneo/La grotta": [84, 84, 87, 131, 136, 136],
  "sotterraneo/La miniera": [62, 120, 128, 128, 154, 154, 154],
  "sotterraneo/Le fogne": [64, 64, 64, 141, 141, 141, 218, 218, 218],
  "sotterraneo/La cripta": [87, 87, 87, 169, 169, 170, 247, 247, 247, 592],
  "sotterraneo/La gola": [63, 118, 118, 118, 134, 134, 134, 278, 278, 278, 382, 382],
  "mura/Il cortile": [98, 98, 135, 135, 135, 179, 179, 179, 295],
  "mura/Il camminamento": [80, 80, 80, 115, 115, 115, 171, 171, 171, 266, 266, 266],
  "mura/Il corridoio": [54, 54, 54, 95, 97, 97, 153, 160, 160, 201, 201, 201, 310, 834],
  "mura/La sala del trono": [96, 96, 96, 159, 159, 159, 205, 205, 205, 301, 301, 301, 460, 460, 605],
  "mura/Il torrione": [78, 78, 78, 109, 109, 109, 190, 218, 218, 279, 292, 292, 395, 530, 628, 733, 1303],
  "Partita libera": [106, 108, 126, 152, 187, 193, 246, 365, 365, 365, 375, 375, 508, 508, 962, 962, 1069, 1351, 1390, 2839],
}
/* di quanto cresce la vita nella partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = 1.36
export const FIRMA = "6ed10e9"
export const BERSAGLIO = [0.6, 0.85]
