/* I numeri tondi dei punti di un giro di ronda.
   Stanno qui perché li usano in due: il campo, che li disegna sulla
   mappa, e la riga dell'ordine, che li rilegge nel piano. Devono essere
   gli stessi segni, se no il ② della mappa e il ② della riga non si
   riconoscono. */
const CERCHI = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']
export const cerchio = i => CERCHI[i] || '⬚'
