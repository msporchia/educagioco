/* Di cosa parla un gioco (area) e che tipo di attività è (come): due assi
   separati apposta, vedi docs/core/aree-dal-codice.md. Chi dichiara è il
   gioco (data/giochi.js o il proprio gioco.js), non questo file; l'ordine
   di AREE è quello della home, non alfabetico; `tinta` colora l'indice della home. */

export const AREE = [
  { chiave: 'numeri',    emoji: '🔢', nome: 'Numeri',    tinta: '#ffe2c7' },
  { chiave: 'parole',    emoji: '🔤', nome: 'Parole',    tinta: '#d6e6fb' },
  { chiave: 'logica',    emoji: '🧩', nome: 'Ragionare', tinta: '#e8dcf6' },
  { chiave: 'avventure', emoji: '🗺️', nome: 'Avventure', tinta: '#d5efd8' },
]

// nome è un'etichetta corta, non una frase: per esteso andava a capo sulla riga di progresso della carta
export const MODI = {
  domande:   { emoji: '🎯', nome: 'domande' },
  pensare:   { emoji: '🧠', nome: 'da ragionare' },
  riflessi:  { emoji: '🎮', nome: 'riflessi' },
  strategia: { emoji: '♟️', nome: 'strategia' },
  fare:      { emoji: '🛠️', nome: 'con le mani' },
}

export const CHIAVI_AREE = AREE.map(a => a.chiave)
export const area = chiave => AREE.find(a => a.chiave === chiave) || null
export const modo = chiave => MODI[chiave] || null
