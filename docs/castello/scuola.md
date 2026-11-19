# Il castello a scuola

A scuola il bambino gioca a Difendi il castello vero (`src/views/TowerDefense.vue`), limitato alla tappa che la maestra
ha scelto. È lo svago di fine lezione (di solito l'ultimo blocco, «quando lo dice la maestra» o a minuti): il gioco non si
storpia, si limita. Chi lo monta è la vista della scuola (`src/scuola/giochi/castello/`, il contratto è
[../scuola/giochi.md](../scuola/giochi.md)). Gli sprite restano tutti, come a casa: il peso non è un problema.

## Cosa sceglie la maestra

```js
{ tipo: 'castello', tappa: 'bosco/Il sentiero' }
//   tappa: la chiave di una delle venti tappe del regno, `<campagna>/<nome>` (`chiaveTappa` di data/castello.js)
```

- **Una tappa, non le operazioni.** Ogni tappa ha già le sue torri (quindi le sue operazioni) e il suo gradino massimo
  (`cap`), ed è tarata su quelli ([taratura.md](taratura.md)): un insieme di operazioni scelto a mano romperebbe la
  taratura. Le partite libere no: non finiscono, e vivono di regali.
- **La chiave è quella delle vite tarate** (`VITE` di `taratura-castello.js`): rinominare una tappa vuol già dire ritararla,
  quindi è stabile quanto basta, e distingue i due guadi (`bosco/Il guado`, `palude/Il guado`).
- **La scheda è pura** (`scheda.js`): legge solo il racconto delle tappe (`data/campagne-castello.js`, senza import), non
  la taratura né le figure. Tiene a mano un esempio per gradino di ogni operazione (`ESEMPI`, la tabella di
  [operazioni.md](operazioni.md)), così la maestra legge «addizioni fino a 247+185»; il test li confronta coi generatori.
- **`valido`** rifiuta chiavi in più, una tappa che non c'è, il nome senza campagna, una libera. **`descrivi`**:
  «Difendi il castello · Il sentiero · addizioni», «… · Il guado (il bosco) · addizioni e sottrazioni», «… · La foce · le
  quattro operazioni».
- L'editor (`Parametri.vue`) ha una fila di tessere per campagna, coi numeri del regno (1–20) e le icone delle torri
  (🏹🔮❄️💣); sotto, per la tappa scelta, fin dove sale ogni operazione e quanti conti servono per vincerla (`calcoli`).

## Il gioco col limite

`<TowerDefense :limite="{ tappa }">`. **A casa manca** (`null` di difetto), e `tappaDelLimite`
(`views/castello/limite.js`, puro) torna `null`: niente di quello che segue esiste.

| Resta (è il gioco) | Si spegne con `limite` |
|---|---|
| il campo, le torri, i conti in colonna, i rami, lo spostamento | il regno (a scuola `Regno.vue` è un `Vuoto.vue`): si parte nella tappa |
| l'energia, la penale degli errori, la velocità, «Manda l'ondata» | le monete (`borsellino.paga`) e la moneta nella barra |
| lo stendardo, le schede dei mostri, il blocchetto ⬆️ della partita | la sosta (`salva` non scrive niente, nessuna ripresa) |
| la riga dei primi passi (ogni alunno è nuovo) | l'avanzamento (`tdCompleta`) e i traguardi (`segna`, `segnaBest`) |
| la pausa | i regali: stanno solo nelle libere, che a scuola non ci sono |

- **A tappa vinta o persa** il cartello dice com'è andata (ondate, nemici, torri) e ha solo **«Riparti ▶»**: la stessa
  tappa da capo. Niente «Tappa successiva», mappa, monete né campagna vinta.
- **Le operazioni sono quelle della tappa**: il profilo della scuola ha tutti i saperi accesi, quindi nessun ripiego
  (le bombe chiedono divisioni). Il ghiaccio pesca il moltiplicatore dal ripasso di quel profilo in memoria.
- «Salta le spiegazioni» di casa sta in `guide/aiuto.js`, che legge `localStorage`: il castello lo prende da
  `views/castello/spiegazioni.js`, che a scuola è `scuola/sostituti/castello-spiegazioni.js` (le spiegazioni non si saltano).
- La barra e la pausa da cui non si esce, il suono spento, il profilo in memoria li mette la scuola
  ([../scuola/architettura.md](../scuola/architettura.md)).

## L'evento `risposta`

Ogni operazione in colonna finita è una risposta (`operazioneFinita`, accanto ad `answer`), già raccontata da
`raccontaConto`:

```js
{ chiave: 'op:add', giusta: true, ultima: true, ms: 4210,
  fatto: '247+185', data: '432', attesa: '432' }
```

- **`giusta`** vuol dire senza errori; **`ultima` è sempre vera**: la colonna finisce comunque (dopo due tentativi su
  una casella la cifra si mostra), e la torre si costruisce lo stesso.
- `data` è il risultato scritto, che a colonna finita è sempre quello giusto: con gli errori dice quanti
  («432 · 2 errori»). `attesa` il risultato; la divisione col resto «322 resto 1».
- La chiave è quella che il castello dà all'SRS (`op:add`, `op:sub`, `op:mul`, `op:div`). Il tasto «salta» dei grandi
  non manda niente, come non annota niente.

Nei test: `unita/castello-scuola` (le tappe dell'editor uguali a quelle del regno, con operazioni, `cap` e chiavi;
`valido` contro una dozzina di forme storte; la voce in matematica con l'icona del gioco, solo nel castello; `descrivi`;
gli esempi della scaletta con la forma dei generatori; senza limite nessuna tappa; ogni conto di ogni gradino nei 40
caratteri). Bersagli: la vista `[data-gioco="castello"]`; nell'editor `[data-tappa-castello]`; il cartello di fine
`[data-fine-limite]` col tasto `[data-azione="riparti"]`; il resto è quello di casa e `window.__td`.
