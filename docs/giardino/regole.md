# Le regole del giardino

Il campo, le piante e gli zombi. Il motore è `motore/partita.js` (senza
schermo, gira in Node), i numeri stanno in `dati/`.

## Il campo

- **Verticale**, cinque corsie per otto righe di 64 unità di mondo, e in fondo
  la striscia con le case. Gli zombi scendono dall'alto, le piante sparano in su.
- **Si pianta dalla terza riga in giù** (`rigaMin`): sopra è dove entrano gli zombi.
- **Le corsie aperte sono quelle centrali** (`corsieDi`): la prima tappa ne ha
  tre, le altre fino a cinque. Le chiuse sono scure e non si piantano.
- **Un carretto per corsia**: se uno zombi arriva in casa, passa e spazza
  tutta la corsia, **una volta sola**. Un secondo zombi nella stessa corsia
  vince lui. I carretti partiti fanno le stelle (0 → tre, 1 → due, più → una).

## Comprare una pianta

1. Si tocca la carta. Servono i soli e la carta deve essere ricaricata.
2. Si apre **il conto, a tutto schermo** (`domande.js` → modulo `conti` dei quiz).
3. Se è giusto, la pianta è «in mano» e si tocca la cella dove metterla; solo
   lì si spendono i soli e parte la **ricarica fissa** della pianta.
4. **Un conto sbagliato non costa niente**: si riprova quando si vuole. Una
   moneta vera per conto giusto (`PAGA.mossa`); il tasto «salta» dei grandi dà
   la pianta e paga, ma non conta.

**Il campo sta fermo durante il conto e mentre si sceglie la cella.** È una
scelta dell'utente («mentre fai i conti il tempo va in pausa»): così il conto
non è un freno, il freno è la ricarica, e un bambino lento a calcolare non
trova più zombi di uno svelto. Anche la ricarica e i soli del cielo
aspettano.

## I soli

Dal cielo ogni 11 secondi (25 soli, restano 9 secondi) e dai girasoli (25
ogni 9). **Si toccano**: un sole non preso sparisce. Sono l'unico modo di
guadagnare soli, quindi il girasole è la prima mossa di ogni tappa.

## Le piante

| | soli | ricarica | conto | cosa fa |
|---|---|---|---|---|
| 🌻 Girasole | 50 | 6 s | + | un sole ogni 9 s |
| 🌱 Tiratore | 100 | 5 s | + | un colpo ogni 1,4 s, in su |
| 🥜 Noce | 50 | 14 s | − | non spara, ha 40 di vita |
| 🌿 Doppio | 175 | 8 s | × | due colpi ogni 1,4 s |
| 🧊 Gelo | 150 | 8 s | ÷ | colpi che dimezzano la velocità per 3 s |

Una pianta spara solo se in quella corsia c'è uno zombi **più in alto**. Uno
zombi si ferma davanti alla prima pianta che incontra e la mangia (1,2 di
vita al secondo; il gigante 3).

## Gli zombi

🧟 normale (7 colpi) · 🧟‍♂️ col cono (14) · 🧟‍♀️ di corsa (5, il doppio veloce) ·
🧌 il gigante (60, lento, un capo per tappa dove la tappa lo dichiara).
Arrivano in fila nel tempo della tappa; il primo dopo 14 secondi.

## Provvisorio

Le figure sono emoji del set del gioco (`npm run emoji` dopo averne
aggiunta una). La grafica dipinta viene dopo, solo se il gioco convince.

Nei test: `unita/giardino` (motore, sosta, banco), `integrazione/giardino`
(il giro col dito). Bersagli: `.gi-tela`, `[data-pianta="<id>"]`,
`[data-soli]`, `[data-tappa]`, `[data-ripresa]`, `.gi-avviso`.
