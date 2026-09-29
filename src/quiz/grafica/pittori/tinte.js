// la tavolozza condivisa da tutti i pittori dei quiz (vedi docs/apprendimento/quiz-moduli.md): i nomi si leggono a voce nelle domande, quindi solo parole note a sei anni

export const TINTE = {
  azzurro:   { scuro: '#2f6f9e', base: '#4ea8e8', luce: '#8fd0fb', orlo: '#dcf0ff' },
  verde:     { scuro: '#2e8a5b', base: '#4fbf7e', luce: '#93e5b3', orlo: '#dcffe9' },
  giallo:    { scuro: '#b0921a', base: '#f0cf4a', luce: '#ffe98c', orlo: '#fff8d2' },
  rosso:     { scuro: '#9c3630', base: '#e0524a', luce: '#ff8d84', orlo: '#ffdcd8' },
  viola:     { scuro: '#6a4fa8', base: '#a184e8', luce: '#cbb8ff', orlo: '#eee7ff' },
  arancione: { scuro: '#a55a12', base: '#f0862c', luce: '#ffb571', orlo: '#ffe6cd' },
}

export const COLORI = Object.keys(TINTE)
export const tinta = n => TINTE[n] || TINTE.azzurro

/* il tratteggio dell'asse: ambra, che non è nessuna delle tinte —
   tranne il giallo e l'arancione, e allora si passa al bianco */
export const inchiostroAsse = c => (c === 'giallo' || c === 'arancione' ? '#ffffff' : '#ffd167')
