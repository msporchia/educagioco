/* ═══════════════════════════════════════════════════════════════════
   LE TINTE — la tavolozza dei pittori dei quiz.

   Stava dentro `pittori/geometria.js`, ed è uscita il giorno che un
   secondo modulo ha avuto bisogno di disegnare figure colorate: due
   tavolozze quasi uguali sarebbero diventate due tavolozze diverse alla
   prima ritoccata, e in una domanda dove il colore È la regola («i
   colori tornano a turno: rosso, blu») due rossi diversi sono un
   guasto, non una sfumatura.

   Ogni tinta ha quattro gradazioni: `scuro` e `luce` servono a far
   sembrare un cubo un cubo, `orlo` è quasi bianco perché sul fondo
   scuro della scheda una figura senza contorno chiaro sparisce — e in
   un riquadro di 118 pixel il contorno è metà della leggibilità.
   ═══════════════════════════════════════════════════════════════════ */

export const TINTE = {
  azzurro:  { scuro: '#2f6f9e', base: '#4ea8e8', luce: '#8fd0fb', orlo: '#dcf0ff' },
  verde:    { scuro: '#2e8a5b', base: '#4fbf7e', luce: '#93e5b3', orlo: '#dcffe9' },
  giallo:   { scuro: '#a8781c', base: '#e8b73f', luce: '#ffdc86', orlo: '#fff3d2' },
  corallo:  { scuro: '#a8483c', base: '#ef7a67', luce: '#ffb2a2', orlo: '#ffe2db' },
  viola:    { scuro: '#6a4fa8', base: '#a184e8', luce: '#cbb8ff', orlo: '#eee7ff' },
  turchese: { scuro: '#238b86', base: '#3fc3bb', luce: '#8ceae4', orlo: '#dbfffc' },
}

export const COLORI = Object.keys(TINTE)
export const tinta = n => TINTE[n] || TINTE.azzurro

/* il tratteggio dell'asse: ambra, che non è nessuna delle tinte —
   tranne il giallo, e allora si passa al bianco */
export const inchiostroAsse = c => (c === 'giallo' ? '#ffffff' : '#ffd167')
