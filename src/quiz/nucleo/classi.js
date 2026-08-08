/* ═══════════════════════════════════════════════════════════════════
   LE CLASSI DI DOMANDE, E QUANTO PESANO

   Una CLASSE è una coppia (modulo, grado): «il perimetro sulla
   griglia», «i contrari», «le conversioni facili». È l'unità con cui
   si pesca una domanda, e la ragione sta in un difetto che è rimasto
   qui dentro per un pezzo.

   Prima si tirava a sorte il MODULO (uno su undici) e poi il grado si
   calcolava dalla difficoltà: `round(1 + d × (gradi−1))`. Quindi:

     · il grado usciva sempre uguale a parità di difficoltà, e con le
       tre fasce di Survivors (0.15 · 0.50 · 0.85) il primo e l'ultimo
       grado di ogni modulo non si vedevano mai. Area, perimetro e il
       loro confronto stanno in cima alla scaletta della griglia: per
       incontrarli serviva una carta da 0.8;
     · una classe valeva quanto il modulo che se la portava dietro. Un
       modulo con sei classi le mostrava una alla volta, uno con una
       classe sola la mostrava sempre. Il modulo pieno di dati e quello
       scarno uscivano comunque uno su undici — la quantità di domande
       diverse non ha mai pesato, e non deve pesare: quella si vede
       nella ripetitività, non nella frequenza.

   Adesso si pescano tutte le classi insieme, con un peso a campana
   centrato sulla difficoltà chiesta. La difficoltà resta una manopola
   sola, ma è un CENTRO e non un binario.

   Questo file non importa niente e non sa cosa sia un profilo: gira in
   Node, e il test `unita/quiz-pesi` ci conta sopra migliaia di tiri.
   ═══════════════════════════════════════════════════════════════════ */

/* dove sta un grado sulla manopola: il primo a 0, l'ultimo a 1, gli
   altri in mezzo */
export const postoDelGrado = (grado, gradi) => (gradi > 1 ? (grado - 1) / (gradi - 1) : 0)

/* Quanto larga è la banda intorno alla difficoltà. Con 0.25 una carta
   «media» (0.50) prende in pieno il grado 3 di cinque (0.50) e con
   circa un terzo del peso i gradi 2 e 4 (0.25 e 0.75); più stretta si
   tornerebbe al binario di prima, più larga una carta facile finirebbe
   per chiedere l'ultimo grado di un modulo — che a un bambino è una
   piccola bugia: ha pagato poco e si è preso una domanda tosta. */
export const BANDA = 0.25

export const pesoDi = (grado, gradi, difficolta = 0) =>
  Math.exp(-((Math.abs(postoDelGrado(grado, gradi) - (difficolta || 0)) / BANDA) ** 2))

/* ── le classi giocabili, con il loro peso ──
   `spenti` sono i macrogruppi che i genitori hanno tolto: i gradi che
   li davano per scontato non entrano proprio nell'elenco. */
export function classiDi(moduli, { spenti = [], difficolta = 0 } = {}) {
  const fuori = []
  for (const m of moduli)
    for (const g of m.gradiLiberi(spenti))
      fuori.push({ modulo: m, grado: g, peso: pesoDi(g, m.gradi, difficolta) })
  return fuori
}

/* la pesca col peso: `sorte.frazione` una volta sola, così a parità di
   seme esce sempre la stessa classe — è quello che permette di provare
   la distribuzione invece di guardarla girare */
export function pescaClasse(sorte, voci) {
  if (!voci.length) return null
  const tot = voci.reduce((s, v) => s + v.peso, 0)
  if (!(tot > 0)) return sorte.uno(voci)
  let x = sorte.frazione * tot
  for (const v of voci) { x -= v.peso; if (x <= 0) return v }
  return voci[voci.length - 1]
}
