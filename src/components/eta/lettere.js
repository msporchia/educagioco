// «7 anni e mezzo», non «7,5 anni»: usata da tacca, conferma e riga (vedi docs/genitori/manopola.md)
export const anniInLettere = a => a == null ? '—'
  : (a % 1 ? `${Math.floor(a)} anni e mezzo` : `${a} ann${a === 1 ? 'o' : 'i'}`)

// quello che si perde rimettendo le cose a posto: vedi docs/genitori/ritocchi.md
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
