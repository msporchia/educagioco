# La fattoria in comune

**Stato: prima prova** (30 ottobre 2026, su richiesta dell'utente). Una fattoria che appartiene a un'amicizia: ognuno dei due ci
gioca quando vuole, con le sue monete, e trova quello che ha fatto l'altro. Lo scopo è portarla avanti insieme. Si apre col 🤝
dentro la propria fattoria 3D (c'è solo con almeno un amico che ha un nome, [../core/amici.md](../core/amici.md)), e il 🏠 o la
freccia riportano alla propria. Codice: `motore/registro.js`, `comune.js`, `Gioco.vue`; sul servizio `servizio/inoltro/src/comune.js`.

## Le regole (dell'utente)

- **Si gioca collegati.** Senza internet la fattoria in comune non si apre: lo si dice («Per la fattoria in comune serve
  internet.») e si torna alla propria. In pochi i conflitti sono rari, e l'utente non vuole precisione al millisecondo.
- **Ognuno spende le sue monete** per costruire. Le monete dell'altro non si muovono mai; l'esperienza va alla fattoria comune,
  i contatori e i traguardi a chi fa la mossa.
- **Il merge è permissivo.** Se tutti e due raccolgono lo stesso campo, il grano entra due volte («chissene»). Se due pezzi
  vanno sulla stessa cella, il secondo va nel magazzino, da mettere. Per gli spostamenti vince l'ultimo. **Nel peggiore dei casi
  qualcosa si perde, monete comprese, e va bene così.**

## Come sta in piedi: le mosse, non la fattoria

I telefoni non si mandano la fattoria ma le **mosse**: le chiamate del motore che la cambiano (`MOSSE` in `motore/registro.js`:
comprare, mettere, seminare, raccogliere, le macchine, le bestie…). `registra(motore, quando)` avvolge quei metodi sull'istanza,
così la scena e le viste non cambiano: ogni mossa riuscita del bambino diventa `{ n, a, f, i0? }` (il metodo, gli argomenti,
quello che ha guadagnato, il primo id delle cose nuove) e parte.

- **Le mosse dell'amico si rifanno nell'ordine in cui arrivano** (`rifai`): senza monete (le ha già spese lui) e senza contatori.
  Non si torna indietro a rifare la storia: due mosse fatte insieme possono finire in ordine diverso sui due telefoni, e la
  fotografia all'uscita rimette in pari.
- **Una mossa che qui non va più** (la tessera già tagliata, la cella presa) non toglie niente: entra quello che lui aveva
  guadagnato (`f`: raccolti, prodotti, lana, esperienza, pezzi nel magazzino, con un tetto per mossa), e un pezzo comprato e
  messo va nel magazzino. Un lotto comprato due volte: le monete del secondo sono perse.
- **Gli id delle cose non si scontrano**: chi è arrivato per primo sul servizio dà id pari, l'altro dispari (`corsia`).
- **Il caso** (gli ordini del banco, la mongolfiera, le botteghe) è di ogni telefono: le richieste possono essere diverse fra i
  due finché la fotografia non le rimette in pari.
- **Una mossa da fuori non si fida** (`mossaInForma`): solo i nomi in `MOSSE`, al massimo quattro argomenti semplici, guadagni
  con chiavi pulite e un tetto (60 per merce, 5000 di esperienza).

## Il servizio: la fila e la fotografia

`POST /amici/comune` `{ chiave, id, dopo, mosse, foto? }` → `{ ultimo, corsia, foto, mosse }`, un Durable Object `Comune` per
amicizia (migrazione `v6`). Il servizio non legge niente: mette le mosse in fila con un numero, tiene l'ultima fotografia
`{ seq, stato }` (una fattoria grande ne pesa ~9 KB, il tetto è 64 KB), ed è di due come la bacheca. Una fotografia vince se
non è più vecchia di quella tenuta; le mosse lette da tutti e due e già nella fotografia si buttano, e la fila non supera 400.
**Dura due mesi dall'ultima richiesta**; i telefoni ne tengono una copia (`fattoria3d-comune:<chiave>` nell'archivio, fuori dal
profilo), e su una fattoria scaduta la copia di chi rientra la rimette in piedi.

Sul telefono (`comune.js`): aprendo si chiede tutto (`dopo: -1`), si parte dalla fotografia e si rifanno le mosse dopo; poi
ogni 3 secondi (e 0,4 s dopo una mossa propria) si mandano le proprie e si ritirano le nuove. Ogni due minuti, e uscendo, si
lascia la fotografia. Se l'amico è andato tanto avanti che le mosse sono state buttate, la fattoria si riapre dalla fotografia.

## I due contadini

Se l'amico è dentro anche lui, il suo contadino cammina nella scena col suo abito e il nome sopra la testa (`scena3d/ospite.js`):
**è parte dell'esperienza** (l'utente). Non passa dal servizio della fila ma dal collegamento degli amici, quello degli inviti:
ogni telefono manda `{ k: 'qui', x, z, d, r?, g?, a? }` (dove sta, verso dove guarda, se corre, il gesto, ogni due secondi l'abito)
cinque volte al secondo se cambia qualcosa e ogni due secondi comunque, e `{ k: 'via' }` uscendo ([../core/amici.md](../core/amici.md)).
Dall'altra parte il contadino ospite cammina verso l'ultimo punto arrivato, salta se è più indietro di cinque celle, fa i gesti, e
sparisce dopo dieci secondi senza notizie. Le mosse restano quelle della fila: il contadino ospite non tocca la fattoria.

### La linea del contadino

Mosse e contadino viaggiano separati: le mosse sono richieste che si aprono ogni volta, il contadino sta su un filo che resta aperto.
Se il filo muore in silenzio (il telefono cambia rete, la wifi singhiozza) le mosse passano e il contadino no: i bambini vedevano le
cose spostarsi senza vedere chi le spostava, e dopo un po' il contadino tornava. Il filo era tarato per gli inviti, dove aspettare non
costa niente, e tre cose tenevano il contadino lontano:

- **Il filo morto si scopriva tardi**: un ping ogni 15 s e 40 s di silenzio prima di lasciarlo. Con due browser veri: 36–50 s senza contadino.
- **La rete piantata faceva chiudere il filo**: cinque posizioni al secondo restavano in coda e arrivavano tutte insieme, oltre le 20 al
  secondo del servizio (`1008 troppi messaggi`).
- **Riaprire poteva costare un minuto**, coi ritardi crescenti di quando non si gioca.

Così adesso, tutto sul telefono (il servizio non cambia): finché la fattoria in comune è aperta `quandoQui` mette il `Ponte` in gioco
(`inGioco`, `BATTITO_GIOCO` in `amici/rete.js`). Il ping lo risponde Cloudflare: non costa e non conta nelle 20 al secondo.

| | | perché |
|---|---|---|
| `ogni` / `sordo` | 1 s / 3,5 s | un filo morto si scopre in 4,5 s al massimo |
| `fermo` | 1,8 s | filo zitto da tanto: una posizione invecchia, non si mette in coda (`mandaFresco`). Riparte da sola, e la spedizione (`contadino-amico.js`) la riprova al giro dopo |
| `ritardi` | 1 s, poi 2 s | per riaprire. Provato 0,2 s: lo stesso bambino su due telefoni (stesso id) si caccia dal servizio cinque volte al secondo |
| `SPARISCE` | 10 s | deve superare il caso peggiore: l'ultima notizia da fermo (2 s), scoprire (4,5 s), riaprire (1 s e la rete) |

Un guasto così adesso si vede come un contadino che si ferma qualche secondo e riparte. Una rete spenta davvero per più di dieci
secondi lo fa ancora sparire, ma lì non arrivano nemmeno le mosse. `node strumenti/banco-contadino.mjs`, 12 partite da 30 minuti, per
quanto sparisce il contadino in un'ora di gioco (`--lento`: com'era): `casa` da 450 s a 0, `agitata` da 1675 s a 438 s, e nessun filo
chiuso dal servizio (erano 36 in `agitata`). Provato con due browser e il proxy cattivo, non su due telefoni veri.

**Con più amici, più fattorie in comune**: una per amicizia, e il 🤝 ha un tasto per ognuno.

## Cosa non c'è ancora

- Dentro la fattoria in comune niente trattore verso i vicini (le visite toccano il motore senza passare dalle mosse), niente
  guida del primo giro, niente cheat dell'indirizzo.
- Una fattoria in comune per amicizia, quindi di due; un gruppo vorrebbe una chiave di gruppo sul servizio.
- Le visite alle fattorie degli amici (aiutare la mongolfiera, coccolare le bestie, annaffiare, adesivi, capi unici) sono scelte
  ma non fatte: [vicini.md](vicini.md).

## Nei test

`unita/fattoria3d-registro` (due telefoni finti a mano: la stessa fattoria, il doppio raccolto, il doppio pezzo, le monete,
gli id, le mosse storte), `unita/amici-servizio` (la fila e la fotografia), `unita/amici-contadino` (la linea del contadino: due `Ponte`
veri sulla presenza finta, `test/aiuto/contadini-finti.mjs`), `integrazione/fattoria3d-comune-contadino` (due pagine col proxy cattivo: filo
morto, rete piantata, filo tagliato, mentre le mosse arrivano; solo con `SERVIZIO=http://localhost:8787`, se no salta), `integrazione/fattoria3d-comune` (due pagine e il
servizio: entra, costruisce, l'altro trova, un lotto arriva mentre si gioca, il contadino dell'altro cammina col suo nome e sparisce quando esce, la propria fattoria intatta, senza rete; **serve il
servizio con la v6**, in locale `cd servizio/inoltro && npx wrangler dev` e `SERVIZIO=http://localhost:8787`, se no salta).

| bersaglio | cosa |
|---|---|
| `[data-f3="apri-comune"]` | il 🤝 nella propria fattoria; apre il dialogo con un tasto per amico (`[data-f3="dialogo"] [data-scelta]`) |
| `[data-f3="torna-mia"]` | il 🏠 dentro la fattoria in comune, e il tasto del cartello d'errore |
| `[data-f3="comune-attesa"]` (`[data-errore]`) | «Vado nella fattoria con…» mentre si collega, o perché non si può |
| `[data-f3="ospite"]` | il nome sopra il contadino dell'amico; il contadino è `window.__fattoria3d.mondo.ospite` (`visibile`, `eroe.x`, `eroe.z`) |
