# I cieli: ogni posto ha i suoi sassi

Ogni tappa ha un suo cielo, cioè un fondale e una specie di sassi, e il
volo infinito li ripassa in ordine. Le regole del cielo non cambiano:
un numero per sasso, uno giusto, scendono dritti.

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `src/data/asteroidi.js` | quale cielo ha ogni tappa (`cieloDi`, per codice `p3`/`m5` e non per posto), e quale il volo a ogni livello (`voceDelVolo`, `cieloDelVolo`) |
| `src/grafica/cieli.js` | le tavolozze dei fondali, la specie di sasso di ogni cielo (`CIELI`, `specieDi`), i sassi (`disegnaSasso`), il Sole e il buco nero che si muovono (`disegnaSfondoVivo`) |
| `src/views/MathGame.vue` | sceglie il cielo a inizio partita e a ogni livello del volo (`mettiCielo`), dà a ogni sasso `specie` e `seme` |

## I cieli

| cielo | sassi | dove |
|---|---|---|
| `cintura` | roccia (quella di sempre) | il pianeta del 2, del 6 |
| `ghiaccio` | comete con la coda | il 10, il 5, l'8, «Fino a mille» |
| `rottami` | lastre, pannelli, serbatoi | le stazioni dei primi conti |
| `cristalli` | cristalli | le stazioni di mezzo |
| `alieni` | dischi volanti che portano il numero | il 4, il 7, «Moltiplicare a mente» |
| `marte` | roccia rossastra | il 3, il 9 |
| `sole` | lava, col Sole in alto | il Sole |
| `nero` | sassi scuri col bordo viola, il buco nero in alto | «La prova», e il volo oltre la fila |

- **Il disegno non tradisce la risposta**: `disegnaSasso` non guarda mai
  `a.ok`, e tutti i sassi di un'ondata sono della stessa specie.
- **Un sasso si disegna dal suo `seme`**: forma, crepe e tipo di rottame
  escono da un generatore col seme, mai da `Math.random` nel disegno, se no
  il sasso ribolle a ogni fotogramma.
- **I dischi volanti sono larghi**: stanno entro 1,25 volte il raggio, se no
  con sei risposte in cielo si toccano.
- **Il buco nero e il Sole stanno in alto e tenui**: sono grandi, e non
  devono sembrare una cosa da toccare.

## Il volo rifà la storia

- **Il livello n del volo è il posto n della fila**: livello 1 «Fino al
  dieci», livello 3 il pianeta del 2, e così via; oltre la fila c'è il buco
  nero. Le domande restano quelle del volo ([volo.md](volo.md)): cambia solo
  dove si è.
- **A ogni livello un balzo**: le stelle diventano scie per un attimo, e il
  cartello dice il livello e il nome del posto. Il fondale si ridipinge
  solo se il cielo cambia.
- Chi riprende un volo lasciato a metà riparte dal posto del suo livello,
  non da «Fino al dieci».

Nei test: ogni sasso ha `specie` (`window.__mate.asteroidi()`), e le bombe
della nave madre hanno `specie: 'bomba'`.
