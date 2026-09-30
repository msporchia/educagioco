// Le variabili che le puntate di «La vecchia mappa» hanno in comune: scritte
// una volta, perché la serie le tira una volta sola e ogni puntata deve
// avere gli stessi valori (docs/lingue/libro.md, «Le storie a puntate»).
// Sta in una sottocartella perché non è un capitolo.
const nonno = (id, en, P, p, pos, it) => ({ id, en, P, p, pos, it, il: it.toLowerCase() })

export const NONNI = [
  nonno('nonno', 'Grandfather', 'He', 'he', 'his', 'Il nonno'),
  nonno('nonna', 'Grandmother', 'She', 'she', 'her', 'La nonna'),
]

export const MEZZI = ['bus', 'train', 'car']

// dove sta il tesoro: `nel` è come si dice in inglese, `al` in italiano
export const POSTI = [
  { en: 'church', nel: 'in the church', al: 'in chiesa' },
  { en: 'castle', nel: 'in the castle', al: 'nel castello' },
  { en: 'farm', nel: 'at the farm', al: 'alla fattoria' },
]
