/* Come si dice un'età, in un posto solo.

   «7 anni e mezzo», non «7,5 anni»: è come lo direbbe chiunque, e
   queste righe le legge un genitore, non un foglio di calcolo. Serve
   alla tacca, al cartello che chiede conferma e alla riga che dice
   com'è andata — cioè a tre file, ed era scritta in tutti e tre. */
export const anniInLettere = a => a == null ? '—'
  : (a % 1 ? `${Math.floor(a)} anni e mezzo` : `${a} ann${a === 1 ? 'o' : 'i'}`)

/* E come si dice **quello che si perde** rimettendo le cose a posto:
   «2 giochi messi a mano, 1 domanda ritoccata». Il numero è quello che
   rende la conferma una domanda vera invece di un «sei sicuro?», e la
   frase la chiedono in due — il cartello dell'età (`Conferma.vue`) e il
   tasto che rimette tutto ai difetti dentro il quadro. Due copie della
   stessa frase divergono alla prima parola che si cambia. */
export const perdeInParole = (perde = {}) => {
  const pezzi = []
  if (perde.giochi)
    pezzi.push(`${perde.giochi} ${perde.giochi === 1 ? 'gioco messo' : 'giochi messi'} a mano`)
  if (perde.sa)
    pezzi.push(`${perde.sa} ${perde.sa === 1 ? 'pezzo di scuola' : 'pezzi di scuola'}`)
  if (perde.ritocchi)
    pezzi.push(`${perde.ritocchi} ${perde.ritocchi === 1 ? 'domanda ritoccata' : 'domande ritoccate'}`)
  return pezzi.join(', ')
}
