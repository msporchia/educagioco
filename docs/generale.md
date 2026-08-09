[← torna al README](../README.md)

# 🎖️ Il Generale *(in prova)*

*Programmazione senza scrivere codice.* Si dà una fila di ordini a una
squadretta, si preme play, e si guarda cosa succede.

<img src="img/generale-gioco.png" width="230"> <img src="img/generale-mappa.png" width="230">

> [!NOTE]
> Questo gioco è **in prova**: non compare in home finché non si accende
> l'interruttore *giochi in prova* nei settaggi. È il più incompleto della
> raccolta.

## Come è fatto

Una mappa vista dall'alto, qualche unità da comandare — l'eroe, il cane — e
un obiettivo. Gli ordini si compongono da un menù, non si scrivono: *vai
laggiù*, *prendi la chiave*, *apri il portone*, *pattuglia questa zona*.

Poi si preme play e **non si può più intervenire**. O funziona o no, e se non
funziona si guarda dove si è rotto e si corregge la fila.

## I concetti, in ordine

Le tappe introducono un'idea per volta:

| | concetto | cosa vuol dire |
|---|---|---|
| 1 | **la fila** | gli ordini si eseguono uno dopo l'altro, e quello che non hai scritto non succede |
| 2 | **da vicino** | un'azione non cammina: per aprire una cosa bisogna già esserle davanti |
| 3 | **prima quello** | certe azioni ne pretendono un'altra prima — la spada prima del mostro — e l'ordine è la differenza fra vincere e perdere |
| 4 | **un ordine per sei** | dire *dove si va* invece di elencare ogni passo: costa meno e soprattutto regge quando la stanza cambia |
| | poi | cicli, condizioni, segnali fra unità, eventi |

Il quarto è il salto vero, ed è il motivo per cui il gioco esiste: **la
soluzione che elenca tutti i passi funziona una volta sola**. Ogni capitolo
si gioca su tre scene leggermente diverse, e la fila di passi buona per la
prima fallisce sulle altre. Solo l'ordine che *descrive l'intenzione* le
supera tutte.

## Ogni unità sa fare cose diverse

Il forziere lo apre l'eroe, il cane corre e abbaia. Se il cane sapesse aprire
i portoni, «mandaci il cane» sarebbe sempre la risposta giusta e non ci
sarebbe niente da pensare. Il menù degli ordini è filtrato di conseguenza:
**un ordine impossibile non compare nemmeno fra le scelte**.

## Cosa allena

Pensiero algoritmico: sequenza, prerequisiti, astrazione, iterazione,
condizioni. È la stessa scala dei linguaggi a blocchi tipo Scratch, ma con
un vincolo in più — non puoi correggere mentre gira.

## Note per i genitori

- È il gioco più difficile della raccolta e il meno finito.
- Ogni livello ha un **par**: il numero di ordini con cui si può risolvere in
  modo elegante. Vincere è facile, vincere dentro il par è il vero gioco.
- Le prove automatiche giocano davvero tutti i livelli, e verificano anche
  che le soluzioni *sbagliate ma plausibili* perdano almeno una delle tre
  scene: un livello che si lascia vincere dalla fila di passi non insegna
  quello che dovrebbe.
