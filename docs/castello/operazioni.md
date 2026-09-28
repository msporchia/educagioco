# Le operazioni del castello

La scaletta delle operazioni in colonna che comprano le torri, come si
scrivono, e cosa succede quando un genitore ne spegne una. I generatori
stanno in `src/data/ops.js`, la cassa che li chiama in
`src/views/castello/cassa.js`.

## La scaletta

- **Dieci gradini per operazione** (`LIVELLI`, ricette `RICETTE_ADD`…
  `RICETTE_DIV`): fra «27+15» e «247+185+96» ce ne stanno comodi otto.
- **Ogni gradino cambia una cosa sola** — prima le cifre, poi il riporto,
  poi quanti numeri.
- **La torre nasce al livello 1** con l'operazione più facile (niente
  riporti, niente prestiti) **e sale un gradino alla volta**, ogni volta col
  calcolo dopo. La difficoltà la decide il livello della torre, non la
  bravura; il tetto lo mette la tappa (`cap`). La scaletta si sale tutta e in
  ordine.

| grad. | + | − | × | : |
|---|---|---|---|---|
| 1 | 24+13, niente riporti | 46−12, niente prestiti | 22×3, niente riporti | 72:4, esatta, divisore 2-5 |
| 2 | 27+15, un riporto | 95−58, un prestito | 84×3, coi riporti | 47:2, col resto |
| 3 | 234+152, tre cifre | 661−201, tre cifre | 420×2, tre cifre | 210:3, tre cifre |
| 4 | 247+185, tre cifre col riporto | 850−75, col prestito | 278×2, coi riporti | 645:2, col resto |
| 5 | 23+14+21, **tre addendi** | 735−199, prestiti in fila | 4204×7, quattro cifre | 272:8, divisore fino a 9 |
| 6 | 27+35+18, tre col riporto | 351−174, doppio prestito | 39×22, **due cifre per due** | 509:2, col resto |
| 7 | 1247+385, quattro cifre | 903−255, zero di mezzo | 51×93 | 816:9, zero nel quoziente |
| 8 | 247+185+96, due riporti | 2381−572, quattro cifre | 625×26, tre per due | 4912:8, quattro cifre |
| 9 | 12+34+21+43, **quattro addendi** | 5810−2344 | 937×97 | 6199:2, col resto |
| 10 | 1247+385+2094 | 3032−2738, zeri a catena | 1759×52 | 9511:9, divisore grande e zero nel quoziente |

## Come si scrive

- **Si scrivono solo le cifre del risultato, da destra**: i riporti si
  tengono a mente, perché scriverli sarebbe una stampella.
- **Unica eccezione la moltiplicazione con moltiplicatore a due cifre**: i
  prodotti parziali sono passaggi veri del procedimento, quindi si scrive
  `a × unità`, poi `a × decine` spostato di un posto a sinistra, poi la somma
  (`colonnaMul2`).
- **Gli errori si pagano in energia, mai in vite**: la torre si costruisce
  lo stesso, il conto sbagliato costa qualche ⚡ in più (`CFG.malusErrore`).

## Il ghiaccio ripassa le tabelline deboli

La moltiplicazione pesca il moltiplicatore fra le tabelline che scivolano
via (`moltiplicatoreDebole` in `cassa.js`: a caso, pesato col peso del
ripasso di `store/srs.js` sulle chiavi `math:AxB`), così non esce sempre la
stessa e non esce mai una già solida. Sotto i riporti (gradino 1) si ripiega
su un moltiplicatore piccolo: il procedimento viene prima della tabellina.

## Quando un'operazione non si è fatta a scuola

- **Togliere un'operazione non abbassa l'asticella, sposta dove la si
  incontra.** Divisioni spente → le bombe chiedono moltiplicazioni tre
  gradini più su; spente anche quelle → sottrazioni sei gradini più su
  (`RIPIEGO`, `SALTO_SENZA` 3, `contoDi`, `gradoDi`). Se no spegnere un
  sapere sarebbe una scorciatoia per far vincere.
- **Sotto la sottrazione non si scende**: addizione e sottrazione sono il
  pavimento del castello; sotto si spegne il gioco.
- **Il castello lo dichiara** con `chiede:` nel manifesto (`data/giochi.js`),
  perché non passa da `src/quiz/` e senza quella riga i genitori non
  avrebbero dove toccarlo (vedi [`../genitori/`](../genitori/)).
- `contoDi(t, false)` accetta ancora il booleano di prima («le divisioni»)
  accanto all'oggetto `{ div, mul }` (`contiPermessi` in `store/profile.js`).

Nei test: `unita/conti-castello` tiene la scala dei ripieghi (il ripiego
non deve diventare più facile dell'originale); `integrazione/torri` prova
la matematica delle colonne su migliaia di operazioni generate.
