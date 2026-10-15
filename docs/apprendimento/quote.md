# Le quote: l'inglese e le tabelline in mezzo agli altri giochi

Una domanda su 20 è di inglese, una su 40 di tabelline, in tutti i giochi
che pescano dai quiz (`src/quiz/`). Sono **indicazioni, non conti esatti**:
servono a far entrare qualcosa senza che diventi il gioco.

## Come funziona

- Un modulo dichiara `quota: { gruppo, quota }` (`nucleo/modulo.js`). I
  moduli dello stesso gruppo **pesano insieme** quella frazione del mazzo
  (`conQuote` in `nucleo/classi.js`, dopo il ripasso): aggiungere un modulo
  o un grado non fa uscire più inglese. Con più gruppi ognuno tiene la sua
  frazione dell'insieme.
- Un mazzo fatto solo di quel gruppo (un gioco che nomina i suoi moduli) non
  si scala: la quota guarda il resto del mazzo, e senza resto non c'è niente
  da misurare.
- L'età lavora prima, come sempre: le classi fuori dalla finestra non ci
  sono, e la quota si divide fra quelle che restano.

## L'inglese (`moduli/ing-parole.js`, `ing-frasi.js`, dati in `src/quiz/inglese.js`)

- **Un grado per isola** dell'inglese a mondi: parole e frasi sono quelle
  che l'isola insegna, il livello viene dall'anno di scuola
  (`livelloParole`, `livelloFrasi`). Le finestre d'età fanno il resto: a
  sette anni escono colori, cibo, famiglia; il passato solo ai grandi.
- **Sei tipologie**, sei chiavi `ing:…` per il ripasso: la figura → parola,
  che cosa vuol dire, dall'italiano (`ing-parole`); che cosa dice la frase,
  la parola che manca, la frase giusta (`ing-frasi`).
- **Gli sbagli sono quelli veri**: le frasi sbagliate e il perché vengono
  dalla tabella di `docs/lingue/trappole.md` (`trappoleDi`), il buco sceglie
  solo trappole che cambiano **una** parola, quindi sbagliate di sicuro.
- **Due saperi**: `inglese-parole` e `inglese-frasi` (materia «Inglese» in
  «Come va»). A cinque anni sono spenti tutti e due (non legge), a sei e
  mezzo le frasi.
- **Lingue separate**: solo l'inglese. Lo spagnolo non entra; le due lingue
  non si mescolano mai (`docs/lingue/vocaboli.md`).
- **Manca** montare le tessere in fila e «metti le parole al posto giusto»:
  la domanda dei quiz è a scelta fra risposte, per le tessere serve un tocco
  nuovo in `Domanda.vue`. Il motore dell'inglese le ha già
  (`costruisci(…, 'monta' | 'completa')`). Il buco a scelta, con una parola
  sola, c'è già.

## Le tabelline (`moduli/tabelline.js`)

- Sette gradi dai conti puri (`conti.js`, prodotti): dal 2 e dal 10 fino al
  12, livelli già calibrati sull'età. Due chiavi: `tab:prodotto` (7 × 8) e
  `tab:nascosto` (7 × □ = 56). Sapere `moltiplicazioni`.
- Non è un modulo nuovo di domande: chiede a `conti.js` e cambia la chiave,
  così il ripasso e «Come va» vedono «le tabelline» e non i conti puri.

## Nei test

`unita/quiz-quote` (la frazione a ogni età e manopola, il mazzo di solo
inglese, i gradi per età), `unita/quiz` (il banco di ogni modulo) e
`strumenti/quiz/banco.mjs ing` per vederle. Il quadro dell'età non conta i
moduli a quota nell'ampiezza di un gruppo (`unita/quadro`).
