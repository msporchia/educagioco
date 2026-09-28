// La posta dei grandi: vedi docs/genitori/cestino-e-posta.md. Non è un
// changelog (quello, per i bambini, è novita-bambini.js): una nota si
// scrive solo se il genitore potrebbe voler fare qualcosa. Formato di una
// nota: { id, quando, titolo, testo, azione?, riguarda? }.
export const NOTE = [
]

// l'ultimo id bruciato: 3 note sono state scritte e ritirate, e gli id non si riusano mai
const RITIRATE = 3
export const ULTIMA = NOTE.reduce((m, n) => Math.max(m, n.id), RITIRATE)
