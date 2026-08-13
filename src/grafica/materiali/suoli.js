/* ═══════════════════════════════════════════════════════════════════
   I SUOLI CHE UN LIVELLO PUÒ NOMINARE

   Un ambiente dichiara l'aria di una stanza — la luce, il buio, le
   torce, le tre partite di muratura, i dettagli sparsi — e finché il
   pavimento era solo suo, una mappa era **un posto solo**: o tutto
   cortile o tutto cripta. Ma una storia vera è «porto la roba fuori dal
   castello», e lì da un lato c'è il lastricato e dall'altro l'erba.

   Questi sono i pavimenti che il livello può mettere **cella per
   cella**, scrivendoli nella legenda della mappa accanto ai
   personaggi e alle cose:

       '==': suoli.lastre     '~~': suoli.acqua
       ',,': suoli.erba       '..': (quello dell'ambiente)

   Le tinte stanno qui e non nel livello: un livello dice DOVE, non di
   che colore — se no ogni mappa diventerebbe una tavolozza, e due
   cortili scritti da due persone non si somiglierebbero più.
   ═══════════════════════════════════════════════════════════════════ */
import { erba, lastre, mattonelle, pietraia, terra, metallo, mosaico, tappeto, bagnato,
         pietra, mattoni, roccia, legno, ferro, marmo, alberi } from './pattern.js'

/* ognuno è una funzione senza argomenti: la voce si costruisce quando
   serve, così due mappe non si passano lo stesso oggetto mutabile */
export const SUOLI = {
  erba: () => erba('#7ec066', '#5b9c50'),
  lastre: () => lastre('#c8bb96', '#a99b73'),
  mattonelle: () => mattonelle('#b7a888', '#8f8266'),
  pietraia: () => pietraia('#a89a80', '#665c4a'),
  terra: () => terra('#a8814f', '#7d5f39'),
  metallo: () => metallo('#8e939c', '#5f646d'),
  mosaico: () => mosaico('#c9b489', '#8d7a58'),
  tappeto: () => tappeto('#a33a3a', '#7a2626'),
  acqua: () => bagnato('#5f86a8', '#3f5f7d'),
}
export const NOMI_SUOLI = Object.keys(SUOLI)

/* le murature, per lo stesso mestiere: il livello dice DOVE, le tinte
   stanno qui */
export const MURI = {
  pietra: () => pietra('#cdc3b0', '#9a9080'),
  mattoni: () => mattoni('#b89a72', '#82613f'),
  roccia: () => roccia('#a89a80', '#665c4a'),
  legno: () => legno('#a9713d', '#7d4f26'),
  ferro: () => ferro('#8e939c', '#5f646d'),
  marmo: () => marmo('#e6e2d8', '#b9b2a4'),
  alberi: () => alberi('#4f8f3f', '#2f6a2a'),
}
export const NOMI_MURI = Object.keys(MURI)
