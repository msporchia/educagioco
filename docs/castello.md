[← torna al README](../README.md)

# 🏰 Difendi il Castello

*Un tower defense dove ogni torre si paga con un'operazione in colonna.* I
mostri camminano lungo il sentiero verso il castello; per fermarli servono
torri, e per costruire una torre bisogna fare il conto.

<img src="img/castello-gioco.png" width="230"> <img src="img/castello-mappa.png" width="230">

## Come è fatto

Quindici tappe in tre campagne (il bosco, il sottosuolo, la montagna). Ogni
tappa ha il suo scenario, i suoi mostri e la sua scaletta di operazioni.

Il ciclo è: arriva l'ondata → serve una torre → **compare l'operazione in
colonna** → si scrive il risultato cifra per cifra, coi riporti → la torre si
costruisce. Chi sbaglia paga una penale in energia, non perde la partita.

## Quali operazioni escono

La scaletta è progressiva e ogni tappa dichiara **fin dove può arrivare**:

| | tipo | esempio |
|---|---|---|
| 1 | addizioni senza riporto | `34 + 25` |
| 2 | addizioni con riporto | `47 + 38` |
| 3 | sottrazioni senza prestito | `58 − 23` |
| 4 | sottrazioni con prestito | `52 − 27` |
| 5 | moltiplicazioni per una cifra | `47 × 6` |
| 6 | moltiplicazioni per due cifre | `47 × 23` |
| 7 | divisioni | `97 : 4` |

Le divisioni si possono **spegnere dai settaggi**: quando sono spente, la
torre che le chiederebbe passa a moltiplicazioni più difficili. Il gioco
degrada invece di sbarrare — nessuna tappa diventa impossibile.

## La cosa insolita: il numero di conti è deciso a monte

Qui c'è una scelta che vale la pena raccontare, perché è nata da un
fallimento.

All'inizio funzionava al contrario: si decidevano le ondate, i prezzi e la
vita dei mostri, e **quante operazioni servissero per finire una tappa
usciva come conseguenza**. Il risultato è che una tappa poteva chiedere da 21
a 52 operazioni in colonna. Una partita diventava un compito, e il bambino
smetteva.

Adesso è rovesciato: **ogni tappa dichiara quante operazioni costa finirla**
— da 6 nella prima a 30 nell'ultima — e tutto il resto (il piano degli
acquisti, le ondate, l'energia di partenza, quante postazioni ci sono) viene
calcolato da quel numero.

## E l'equilibrio si misura, non si indovina

La vita dei mostri non è una formula: è **un numero per ogni singola ondata,
trovato giocando la tappa migliaia di volte** con un finto giocatore, senza
schermo. Il simulatore risponde a domande vere: *chi spende tutto quello che
guadagna, finisce? Chi si tiene un quarto dei soldi in tasca, perde? Un
bambino che sbaglia un conto su quattro ce la fa lo stesso?*

Se una tappa risulta troppo dura, la domanda giusta non è «quanta vita
tolgo» ma «cosa non torna nel modello». È anche il motivo per cui le prove
automatiche di questo gioco **giocano davvero tutte e quindici le tappe** a
ogni modifica.

## Cosa allena

L'algoritmo delle operazioni in colonna — riporti e prestiti — con una
pressione di tempo mite: l'ondata arriva, ma il conto si può fare con calma
perché il gioco aspetta.

## Note per i genitori

- Le divisioni si spengono da *Genitori → cosa sa*.
- C'è anche una **partita libera** senza fine, che si sblocca finendo le
  tappe: lì le operazioni sono miste e il gioco non finisce mai.
- Se il bambino sbaglia spesso, non perde: paga di più in energia. Non c'è
  schermata di fallimento legata al calcolo.
