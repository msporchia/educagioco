// Quanto paga l'inglese a mondi, in monete: 🪙1 = dieci secondi di
// esercizio (docs/apprendimento/calibrazione.md). Si paga la risposta giusta,
// mai la sbagliata, e niente moltiplicatore di livello. Il perché dei numeri
// sta in docs/lingue/mondi.md («Le monete»).
export const PAGA = {
  parola: 1,          // una figura o una traduzione: un colpo d'occhio
  riconosci: 2,       // leggere una frase e quattro italiane
  senso: 2,
  scegli: 2,          // leggere quattro frasi inglesi quasi uguali
  completa: 2,
  monta: 3,           // mettere in fila una frase intera
  scegliMonta: 3,
}

export const PAGA_CAPITOLO = 4   // una domanda del libro: dentro c'è anche la lettura del testo
// niente premio d'arrivo né per la 🏁: ogni risposta giusta si paga subito, e basta

export const pagaDi = d => (d.genere === 'parola' ? PAGA.parola : PAGA[d.formato] || 0)

export function guastiDelleMonete() {
  const g = []
  for (const [k, v] of Object.entries(PAGA))
    if (!(Number.isInteger(v) && v > 0 && v <= 3)) g.push(`${k}: ${v} monete per una domanda (fra 1 e 3)`)
  return g
}
