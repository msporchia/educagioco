/* ═════ LA SALA DEL TRONO ═════
   Pietra nobile e passatoia rossa. È la stanza più chiara di tutte e
   la più vuota: il marmo è quasi tono su tono e tutto il colore sta in
   una striscia sola in mezzo, che porta l'occhio (e i piedi) dove
   deve.

   Le colonne non sono qui dentro: sono un oggetto
   (`{ che: 'colonna' }`), perché è il livello a decidere dove
   metterle — su una cella di muro, dove non ci cammina nessuno. */
export const TRONO = {
  nome: 'La sala del trono',
  posa: 'tappeto', muratura: 'marmo',
  /* il pavimento è **caldo** e il muro **freddo**: sono di marmo tutti
     e due, e senza questo salto di temperatura la sala diventava un
     unico tessuto chiaro in cui non si vedeva più dove si cammina —
     era successo, e i personaggi ci sparivano dentro */
  fondo: ['#6b6252', '#514a3d'],            // i giunti, caldi e scuri
  chiazze: ['#d8cfb8', '#4a4438'],
  lastra: ['#cbc2ab', '#b0a68e'],
  tessere: ['#cdc4ad', '#8f96ad', '#c9b06a', '#8e9db4'],
  tappeto: ['#a8322f', '#78201e'],
  terra: '#8a6a45', sasso: '#b0a084', muschio: '#6f9a4a',
  erbaC: '#a8e08a', erbaS: '#5f9c53',
  muro: ['#cfd4e2', '#8f96ad'], giunto: '#5f6474',
  oro: '#e8c569',
  luce: '#ffe9c0', buio: 0.1,
  varianti: ['liscio', 'liscio', 'liscio', 'polvere', 'usura'],
  dettagli: [['crepe', 6.4], ['monete', 5.7]],
}
