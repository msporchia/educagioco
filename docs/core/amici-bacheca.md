# La bacheca degli amici

**Stato: fatto negli Asteroidi** (29 ottobre 2026; scelte dell'utente). **Da rimettere online il servizio** (`cd servizio/inoltro
&& npx wrangler deploy`, lo fa l'utente: porta la migrazione `v5`). Si vede dove è arrivato un amico e qual è il suo record,
**anche se lui non è online**: basta che apra l'app quando può. Sta sotto lo stesso interruttore degli amici ([amici.md](amici.md)):
spento dai grandi, non si scrive e non si legge niente.

## Un'istantanea per amicizia, sul servizio, che scade

Ogni amicizia ha una **bacheca** sul servizio, sotto la sua chiave: l'ultima istantanea di ciascuno dei due e niente altro.
- **Si scrive la propria e si ritira quella dell'altro** con una richiesta sola (`POST /amici/bacheca`).
- **Scade una settimana dopo l'ultima scrittura** (`SCADENZA`, la sveglia del Durable Object cancella tutto, come i codici
  brevi). Leggere non la allunga. Chi non apre l'app per una settimana non ha più niente sul servizio.
- **L'app la riscrive a ogni avvio**, anche senza cambi: così la bacheca di chi gioca non scade.
- **È di due**: il primo e il secondo `id` che scrivono la tengono, un terzo è rifiutato anche solo per leggere (come la presenza).
- **La copia dell'amico sul proprio telefono si tiene** (`bacheca` dentro l'amico, in `amici:<bambino>`), anche quando sul
  servizio è scaduta, e si butta con «Togli». Offline si vede l'ultima letta, con quanto è vecchia.

## Cosa c'è dentro: numeri e il giorno

`{ v: 1, giorno: 'AAAA-MM-GG', giochi: { mate: { tappa, record } } }` (`src/amici/istantanea.js`):
- **Il giorno, non l'ora**: serve solo a dire «oggi», «ieri», «3 giorni fa». L'ora direbbe quando gioca il bambino.
- **Niente nome**: resta sui telefoni, e si impara come sempre la prima volta che i due sono online insieme. Un amico senza
  nome non si mostra. Il nome nella bacheca no: è l'unico dato personale, e starebbe su un archivio.
- **Un gioco ci entra con una riga** in `NELLA_BACHECA` (dal profilo ai numeri), e solo se qualcuno lo mostra: oggi gli Asteroidi.
  `tappa` è il nodo della sua mappa, `record` il primato della sfida senza fine, letto come lo legge `primatoDi`. **Chi non ha
  ancora fatto niente in un gioco non c'è**: un pallino sulla prima tappa direbbe che ci sta giocando.
- **Quella dell'amico si controlla** (`leggiIstantanea`): solo i giochi e i campi conosciuti, interi da 0 a 10 milioni; una
  che non si sa leggere non sostituisce quella tenuta. Il servizio non la legge: controlla chi scrive e la misura (≤ 2 KB).

Il servizio quindi tiene, per una settimana al massimo, un id casuale e qualche numero sotto una chiave casuale. **Cosa resta oltre**:
Cloudflare tiene il ripristino della memoria SQLite dei Durable Object per 30 giorni (lo può usare solo chi ha l'account, apposta);
i grafici del pannello tengono conteggi, non contenuti. Lo spazio è trascurabile: due istantanee da poche centinaia di byte per amicizia.

## Quando si scrive e quando si legge (`src/amici/bacheca.js`)

- **All'avvio**, tre secondi dopo (`PRIMA_LETTURA`, per non rallentare l'ingresso): scrive sempre e legge tutte.
- **Dopo un cambio** (una tappa, un record) aspetta cinque secondi (`RITARDO`): un `watch` guarda solo i campi che l'istantanea
  legge, il resto del profilo non sveglia niente. Una scrittura riuscita **avvisa gli amici online** (`{ k: 'bacheca' }` sulla
  presenza), che rileggono subito la sua.
- **Uscendo dall'app** con un cambio ancora in coda: si scrive subito, con `keepalive`.
- **Rientrando** e **aprendo un gioco che mostra gli amici** (`rileggiTutte`): si rilegge, al massimo una volta ogni 30 secondi.
- **«Mi vedono online» spento**: si legge e non si scrive.
- **Senza rete** non succede niente; una scrittura mancata si rifà alla prima occasione.

## Cosa vede il bambino negli Asteroidi

- **Sulla rotta, un pallino per amico** sotto la tappa a cui è arrivato: l'iniziale nel suo colore (uno per posto nella lista,
  `COLORI`: due amici non ne hanno mai uno uguale). Niente emoji, che cambiano da un telefono all'altro.
- **In cima, chi è da raggiungere**: il più vicino fra quelli più avanti («Leonardo è 2 tappe più avanti di te.»). Chi è dietro
  non si dice: sulla mappa basta il pallino, nessuno legge «sei ultimo».
- **Nel fumetto di una tappa** chi c'è e da quando («Leonardo è qui · ieri»); in quello del volo infinito, i record degli amici
  sotto il proprio, dal più alto. **La classifica vera è solo sui record**, dove il confronto è giusto a ogni età.
- **A fine volo la notizia porta la misura**: «Hai superato Leonardo (3200 punti)!», oppure «Leonardo ha fatto 3400 punti: te ne
  sono mancati 230» (`controAmici`). Un pareggio non supera nessuno; chi era già sotto il proprio record non è una notizia.

## Da fare

- Gli altri giochi a tappe (Passo passo, il castello, il Robot) e quelli senza fine (Survivors): una riga in `NELLA_BACHECA` e il
  pallino sulla loro mappa. La colonna degli amici nella tabella dei record (l'albo).
- «Melody ti ha superato» all'apertura dell'app: dopo aver visto se i pallini piacciono.

## Il servizio

| Richiesta | Cosa fa |
|---|---|
| `POST /amici/bacheca` `{ chiave, id, dati }` | `dati` un oggetto: scrive la propria e sposta la scadenza; `null`: legge soltanto. Risponde `{ altro }` (l'istantanea dell'altro, o `null`); 409 se la bacheca è già di altri due; 429 oltre `BACHECHE_ORA` (600) richieste all'ora per indirizzo |

Le regole stanno in `servizio/inoltro/src/bacheca.js` (pure), il Durable Object `Bacheca` in `index.js`.

Nei test: `unita/amici-servizio` (le regole della bacheca), `unita/amici-bacheca` (l'istantanea, quella dell'amico, i giorni,
il confronto coi record, quando si scrive e si legge, con un servizio finto), `integrazione/amici-rotta` (i pallini, la riga in
cima, il fumetto e i record del volo, la notizia a fine volo, da amici già salvati sul telefono, senza servizio),
`integrazione/amici` (due telefoni: uno va avanti, l'altro lo vede sulla rotta passando dal servizio; salta senza servizio),
`servizio/inoltro/prova.mjs` (contro il servizio vero). La prova del servizio finisce bloccando l'indirizzo per un minuto
(dieci codici sbagliati): `integrazione/amici` lanciata subito dopo non riesce ad abbinare. Bersagli: sulla rotta `[data-amico-in-rotta]` con `[data-al]` (il nodo), `[data-amico-davanti]`, nel
fumetto `[data-amici-qui]` e `[data-record-amici]`; a fine volo `[data-contro-amici]`.
