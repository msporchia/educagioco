# Il protocollo della lezione

Il servizio è `servizio/inoltro` (lo stesso degli amici e delle sfide), con un Durable Object `Lezione`
per ogni codice. La logica pura sta in `servizio/inoltro/src/lezione.js` (provata senza Cloudflare in
`test/unita/scuola-servizio`); il Durable Object in `index.js` la chiama e salva lo stato. Il client
comune dei due lati è `src/scuola/comune/rete.js`. Il deploy del servizio lo fa l'utente
(`cd servizio/inoltro && npx wrangler deploy`).

## La vita di una lezione

- **Nasce** con `POST /scuola/lezione`; **muore 3 ore dopo** comunque vada (un allarme del Durable
  Object cancella tutto: `deleteAll`). Prima, nessuna cancellazione: anche chiusa, la maestra può
  recuperare i risultati fino allo scadere.
- **Fasi**: `attesa` (si entra, si sceglie il nome) → `via` (domande) → `chiusa` (niente più risposte
  accettate; chi entra vede «La lezione è finita»).
- **Lo stato** (salvato nello storage del Durable Object a ogni cambio, in due tipi di chiave: `meta` per tutto tranne le risposte, `r:<alunno>` per le risposte di ciascuno, perché in un valore solo sforerebbero il tetto): la lezione così come l'ha
  mandata la maestra, gli alunni `{ id, nome, nuovo, posto }`, le risposte per alunno, la fase, la
  scadenza, l'hash della chiave della maestra (non la chiave).

## La lezione che viaggia

```js
{ id, nome,                          // id della lezione nel quaderno, nome per la maestra
  blocchi: [{ esercizio, passa }],   // da 1 a 8; passa: { giuste | domande | minuti: n } o null (quando lo dice la maestra)
  inTondo }                          // dopo l'ultimo blocco si ricomincia dal primo
```

La forma e il perché stanno in [lezione.md](lezione.md); `esercizio` in [esercizi.md](esercizi.md). Il servizio non legge
gli esercizi: controlla la forma dei blocchi e di `passa` (i tetti di `MODI_PASSA`: 500 giuste o domande, 180 minuti), la
misura, e rimanda la lezione così com'è. Una chiave in più, un `passa` con due chiavi o vuoto, `inTondo` non booleano e la forma vecchia (`obiettivo`/`dopo`) sono rifiutati (`lezione storta`); `blocco` e `dove` stanno fra 0 e 10000.

## Le richieste HTTP

| Richiesta | Risposta |
|---|---|
| `POST /scuola/lezione` `{ lezione, alunni: [{ id, nome }] }` | `{ codice, chiave, scade }` — `chiave`: 32 caratteri casuali, l'unica volta che viaggia verso la maestra |
| `GET /scuola/<CODICE>` | `200 { fase }` se esiste, `404` se no (un tentativo sbagliato in più per quell'indirizzo) |
| `GET /scuola/<CODICE>/bambino?posto=<p>` | WebSocket del bambino. `posto`: id casuale del PC (`/^[a-z0-9]{8,24}$/`) |
| `GET /scuola/<CODICE>/maestra?chiave=<k>` | WebSocket della maestra; chiave sbagliata → chiuso col codice `4403` |

Un codice che non esiste sul WebSocket → chiuso col codice `4404`; un `posto` storto → `4403`. Solo il `GET /scuola/<CODICE>` conta come codice sbagliato per l'indirizzo (anche `Errori` e `Limite` sono quelli degli amici, con tetti diversi: nome `scuola:<indirizzo>`).

## I messaggi

Tutti JSON, un oggetto per messaggio, ≤ 2 KB (≤ 8 KB quello della lezione nel `POST`).

| Dal bambino | |
|---|---|
| `{ k: 'sono', alunno }` | sceglie un nome della lista. Rifiutato (`{ t: 'no', perche: 'preso' }`) se quel nome lo tiene un altro posto, `storto` se il nome non c'è o se il posto ne ha già uno (cambiarlo lo fa la maestra con `libera`); `chiusa` a lezione finita |
| `{ k: 'sono', nome }` | «Non trovo il mio nome»: il servizio crea un alunno `nuovo` (id `n` + casuale) e glielo assegna |
| `{ k: 'risposta', n, blocco, chiave, fatto, data, attesa, giusta, ms, ultima? }` | `ultima: false` è un colpo sbagliato di un gioco con la domanda ancora aperta (negli Asteroidi un sasso sbagliato): la maestra lo vede fra le sbagliate ma non lo conta fra le fatte; senza, la risposta chiude la domanda. `n` progressivo del posto (da 1); `blocco` è la posizione `p` del bambino quando ha risposto (intero ≥ 0: in tondo cresce a ogni giro, il blocco è `p % blocchi`, [lezione.md](lezione.md)); `fatto`/`data`/`attesa` sono testi brevi (≤ 40) da `racconta()` di [esercizi.md](esercizi.md). Accettata solo in fase `via`, e solo se `n` è più grande dell'ultima presa per quel posto (chi rimanda una risposta già presa riceve solo la conferma) |
| `{ k: 'dove', dove }` | la posizione `p` (intero ≥ 0) o `'finito'`: a che punto è, per il pannello della maestra |

| Al bambino | |
|---|---|
| `{ t: 'stato', fase, lezione, avanti, alunni: [{ id, nome, preso }], io, preso }` | all'ingresso e a ogni cambio di fase, di nomi presi o di `avanti` (il pavimento di «Avanti tutti»: il bambino sta in `max(sua posizione, avanti)`). `io`: l'alunno di questo posto o `null`; `preso`: l'ultima `n` presa per questo posto (la coda rimanda solo quelle dopo) |
| `{ t: 'preso', n }` | la risposta `n` è salvata |
| `{ t: 'no', perche, n? }` | `'preso'`, `'chiusa'`, `'storto'`; per una risposta rifiutata c'è anche la sua `n` (la `storta` non sarà mai accettata: il client la butta dalla coda; con `chiusa` il client butta tutta la coda) |

| Dalla maestra | |
|---|---|
| `{ k: 'via' }` | da `attesa` a `via` |
| `{ k: 'chiudi' }` | a `chiusa` |
| `{ k: 'avanti' }` | «Avanti tutti»: `avanti` cresce di uno (al più 1000), e lo sanno tutti i bambini (`stato`) e le maestre (`avanti`). Solo in fase `via` |
| `{ k: 'libera', alunno }` | il nome torna libero (un PC rotto, un bambino che ha toccato il nome sbagliato): il posto che lo teneva riceve uno `stato` con `io: null` e torna alla lista. Le risposte restano all'alunno |
| `{ k: 'togli', alunno }` | solo per un alunno `nuovo` (un nome che la maestra non conosce): via lui e le sue risposte |

| Alla maestra | |
|---|---|
| `{ t: 'tutto', fase, lezione, scade, avanti, alunni: [{ id, nome, nuovo, preso, collegato, dove }], risposte: { <alunno>: [r…] } }` | all'ingresso: tutto quello che il servizio sa (è anche «Recupera i risultati») |
| `{ t: 'alunni', alunni }` | a ogni cambio di nomi, collegamenti o `dove` |
| `{ t: 'risposta', alunno, r }` | ogni risposta presa, appena presa |
| `{ t: 'fase', fase }` | a ogni cambio di fase |
| `{ t: 'avanti', avanti }` | a ogni «Avanti tutti» |

`r` è la risposta come l'ha mandata il bambino, senza `k`.

## I limiti

- **Un'intera classe sta dietro un indirizzo solo** (la rete della scuola): i limiti per indirizzo degli
  amici (10 errori al minuto) bloccherebbero la classe. Qui: **60 codici sbagliati al minuto** per
  indirizzo prima di fermarlo, **20 lezioni all'ora** create da un indirizzo.
- **≤ 40 alunni** in lista più **≤ 10 nuovi**; nome ≤ 24 caratteri (ripulito: spazi in fila, niente
  caratteri di controllo); **≤ 600 risposte** per alunno (oltre: ignorate in silenzio, con la conferma);
  **≤ 20 messaggi al secondo** per collegamento; **≤ 60 collegamenti** per lezione.
- Collegamenti con l'API di ibernazione e il ping risposto da Cloudflare (`setWebSocketAutoResponse`,
  come la presenza degli amici): una classe ferma non costa niente.

- Ogni collegamento della maestra e dei bambini ha il suo ritmo: il client rimanda la coda a un messaggio ogni 100 ms. Un posto nuovo non si aggiunge oltre 200 posti per lezione.

## Il client (`src/scuola/comune/rete.js`)

Un collegamento che si rifà da solo (ritardo crescente da 1 a 10 s; un ping ogni 15 s, e senza risposta
per 40 s il filo è morto e se ne apre un altro), una coda delle risposte non confermate che si rimanda
a ogni rientro (dalla `preso` di `stato` in poi), e l'indirizzo del servizio da `src/insieme/rete.js`
(`indirizzo()`: le prove lo cambiano con `globalThis.__SERVIZIO_SFIDE__`). La coda del bambino sta in
localStorage sotto `scuola:<CODICE>` (posto, alunno, coda, ultima `n`), così sopravvive anche al browser
chiuso; le voci più vecchie di 3 ore si buttano all'avvio.

### L'API

Orologio (`{ ora, dopo, ogni, ferma }`), `WebSocketImpl`, `fetchImpl` e `storage` si passano nelle opzioni
(le prove); di difetto sono quelli veri. `servizio` cambia l'indirizzo.

- `indirizzoScuola()`: in sviluppo (`import.meta.env.DEV`) `#servizio=<url>` nell'indirizzo della pagina,
  altrimenti `indirizzo()` di `src/insieme/rete.js`.
- `creaLezione(lezione, alunni)` → `{ codice, chiave, scade }`; riprova se la richiesta si perde; l'errore
  (`Error`) ha già la frase.
- `controllaCodice(codice)` → `{ esito: 'ok' | 'no' | 'rete', fase }`.
- `apriBambino(codice, { suStato, suNo, suLinea })` → `{ sono(alunnoId | { nome }), rispondi({ blocco, chiave, fatto,
  data, attesa, giusta, ms, ultima }) → n, dove(p | 'finito'), inCoda(), chiudi() }`. `suStato(msg)` riceve ogni `stato`;
  `suNo(perche)` i rifiuti, e `'codice'` se la lezione non esiste (non riprova); `suLinea('su' | 'giu')`.
  Si collega subito. Il posto, l'alunno, l'ultima `n` e la coda stanno in `scuola:<CODICE>`.
- `apriMaestra(codice, chiave, { suTutto, suAlunni, suRisposta(alunno, r), suFase, suAvanti(avanti), suLinea, suRifiuto })` →
  `{ via(), avanti(), chiudi(), libera(id), togli(id), smetti() }`; `avanti()` è «Avanti tutti». Si collega subito; `via()` fa partire la lezione,
  `smetti()` la chiude, `chiudi()` chiude il collegamento. `suRifiuto('chiave' | 'codice')`, senza riprovare.

## Nei test

`test/unita/scuola-servizio` (la logica di `lezione.js`: nomi, risposte, fasi, limiti) e
`test/unita/scuola-rete` (il client con orologio e socket finti: coda, rientro, ritmo, chiave).

Nel browser, `integrazione/scuola` parla con `test/aiuto/servizio-scuola.mjs`: le richieste e i WebSocket di questa pagina
su una porta locale, con la logica vera di `lezione.js` (senza i tetti per indirizzo e senza l'allarme delle tre ore).

Dal vivo, contro il servizio pubblicato: `cd servizio/inoltro && node prova.mjs https://sfida.educagioco.workers.dev scuola`
(solo la scuola: la prova intera finisce bloccando per un minuto l'indirizzo sui codici degli amici).
