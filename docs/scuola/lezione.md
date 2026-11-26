# La lezione a blocchi

Una lezione è **una fila di blocchi**. Ogni blocco dice **cosa si chiede** (un esercizio, anche a più voci con le loro
intensità: [esercizi.md](esercizi.md)), **in che gioco** (il campo `gioco` dell'esercizio) e **quando si passa al blocco
dopo**. Il codice è `src/scuola/comune/lezione.js` (puro, gira in Node). Scelte dell'utente, 18 novembre 2026.

```js
{ id, nome,
  blocchi: [{ esercizio, passa }],   // da 1 a MAX_BLOCCHI (8)
  inTondo }                          // true: dopo l'ultimo si ricomincia dal primo (i giri a rotazione)
```

## Quando si passa al blocco dopo: due modi, scelti blocco per blocco

- **Quando lo dice la maestra**: `passa: null`, **la scelta di partenza** (dell'utente, 20 novembre 2026: la classe va
  insieme, e il resto si sceglie quando serve). Il blocco non finisce da solo; si passa con «Avanti tutti».
- **Da solo**, a una soglia: `{ giuste: X }` (dopo X risposte giuste), `{ domande: N }` o `{ minuti: M }`. Ognuno col
  suo passo.
- **Con le parole del gioco** (`conta` della scheda, `contaDi` e `modiPassaPer` di `comune/lezione.js`): nel coniglio e nel
  Robot una risposta chiusa è un livello vinto, quindi «dopo 3 livelli» e niente «giuste»; nel castello «operazioni», in
  cucina «resti», nelle pozioni «ingredienti». `descriviPassa(passa, esercizio)` le usa; senza esercizio sono «domande».
  Provato «dopo 3 domande» per il coniglio: non si capiva.

Nella pagina il tasto si chiama **«Chiudi il blocco 2»** (il blocco dove sta chi è più indietro) e accanto dice chi si
muove: «Marta e Luca passano al blocco 3. Chi è già più avanti resta dov'è». Si chiamava «Avanti tutti», e coi bambini in
blocchi diversi non si capiva cosa facesse; nel codice e qui il nome resta `avanti`, «Avanti tutti».

«Avanti tutti» nel pannello della maestra c'è **sempre**, anche nei blocchi che passano da soli: sblocca chi è rimasto
indietro, o chiude un blocco prima (la campanella). Sposta di un blocco **chi è più indietro** fra i collegati; chi era
già avanti resta dov'è. Così chi è arrivato da solo a un blocco «quando lo dice la maestra» passa alla prima pressione.

## Dove sta un bambino

La **posizione** `p` conta i blocchi superati (0 = il primo). Il bambino la fa crescere superando le soglie; «Avanti tutti»
alza un **pavimento comune** `avanti` (sul servizio), e vale il più grande dei due (`posizione`); «Mandalo al blocco dopo» della
maestra dà a un bambino solo un pavimento suo ([ripieghi.md](ripieghi.md)). Senza `inTondo`, con `p`
oltre l'ultimo blocco la lezione è finita per lui («Hai finito!»); in tondo `p` cresce senza fine e il blocco è
`p % blocchi.length` (`bloccoDi`). Il **conto** di un blocco (`{ fatte, giuste, inizio }`: domande chiuse, giuste, quando è
cominciato) riparte a ogni blocco; `superato(passa, conto, ora)` dice se la soglia è raggiunta. Una domanda conta quando si
chiude (negli Asteroidi un colpo sbagliato con la domanda aperta non è una domanda fatta: [protocollo.md](protocollo.md)).

## A turno, quando i PC sono pochi

Chiesto dall'utente: con pochi PC i bambini si danno il cambio, e il cambio lo decide la maestra, in due modi.

- **Nella lezione**, blocco per blocco: «Finito il blocco, tocca a un altro bambino» (`turno: true`, [protocollo.md](protocollo.md)).
  Finito quel blocco, il PC dice «Il tuo turno è finito: adesso tocca a un altro bambino» (`[data-turno-finito]`) e «Tocca a un
  altro» (`[data-azione="fine-turno"]`) rimanda il nome alla lista (`lascia`): un altro bambino tocca il suo codice. Anche con un
  blocco solo: allora l'editor chiede quando finisce il turno (dopo quanti minuti, o quando lo dice lei).
- **Dal pannello**, quando vuole lei: «Cambio turno» (`[data-azione="cambio-turno"]`, con conferma) rimette tutti i nomi presi
  nella lista (`libera`).

Chi ritocca il suo codice, anche su un altro PC, **riparte da dove era**: il servizio, liberando un nome, ne alza il pavimento
alla sua posizione (`lasciaIlPosto`). Prima di questo, «Rimetti nella lista» faceva ripartire dal pavimento comune, cioè spesso
dal primo blocco. Si perde solo il conto del blocco a metà (al cambio dal pannello).

## I casi di prima, dentro questo

- **Un blocco solo** = si gioca finché la maestra chiude la lezione (`passa: null`): è la lezione nuova e quella pronta.
  Nell'editor un blocco solo non ha «quando si passa» né «in tondo»; i blocchi dopo si aggiungono.
- **Obiettivo + «se hai finito»** = due blocchi: il primo `{ domande: 20 }` (o `{ minuti }`), il secondo `passa: null`.
  Nell'ultimo blocco la scelta si chiama «Per il bambino la lezione finisce».
  `convertiLezione` trasforma così le lezioni salvate prima (quaderno, link, file), e una lezione già a blocchi torna uguale.
- **«Prima un po' di 7, poi l'8»** = due blocchi, il primo `{ giuste: 5 }`.
- **I giri a rotazione** = più blocchi `passa: null`, anche in giochi diversi o nello stesso gioco con voci diverse,
  `inTondo: true`, e la maestra preme «Avanti tutti» a ogni giro.

Rimandato: le **stazioni con gruppi** che partono da blocchi diversi e ruotano insieme; si costruiscono su questo.
