// La sala del trono: pietra nobile e passatoia rossa, la stanza più vuota.
// Le colonne non sono qui: sono un oggetto (`{ che: 'colonna' }`) che il livello
// posiziona. Vedi docs/core/grafica.md.
import { marmo, pietra, roccia, tappeto, lastre } from '../materiali/pattern.js'

export const TRONO = {
  nome: 'La sala del trono',

  mura: [
    marmo('#cfd4e2', '#8f96ad'),
    marmo('#c7cddc', '#8590a8', { seme: 3, quanto: 0.24 }),
    marmo('#d6dbe8', '#99a0b8', { seme: 8, quanto: 0.15, dove: 'lustro' }),
    pietra('#a8adba', '#6f7486', { dove: 'crollo', quanto: 0.14, seme: 4 }),
    roccia('#8f93a0', '#5c6070', { dove: 'crollo', quanto: 0.08, sporco: 0.18, seme: 2 }),
  ],

  suolo: [
    tappeto(),
    lastre('#c2b89e', '#a89c80', { dove: 'consumo', quanto: 0.14, seme: 3 }),
    lastre('#b0a488', '#8f8268', { modo: 'consumato', dove: 'consumo', quanto: 0.08, seme: 6 }),
  ],

  campi: { lustro: 7, crollo: 6, consumo: 5 },

  // pavimento caldo, muro freddo: stesso marmo, e senza il salto di temperatura
  // la sala diventava un unico tessuto chiaro in cui i personaggi sparivano
  fondo: ['#6b6252', '#514a3d'],
  chiazze: ['#d8cfb8', '#4a4438'],
  tessere: ['#cdc4ad', '#8f96ad', '#c9b06a', '#8e9db4'],
  tappeto: ['#a8322f', '#78201e'],
  terra: '#8a6a45', sasso: '#b0a084', muschio: '#6f9a4a',
  erbaC: '#a8e08a', erbaS: '#5f9c53',
  giunto: '#5f6474',
  oro: '#e8c569',
  luce: '#ffe9c0', buio: 0.1,

  varianti: ['liscio', 'liscio', 'liscio', 'polvere', 'usura'],

  dettagli: [['crepe', 6.4, 'crollo'], ['monete', 5.7, 'lustro']],
}
