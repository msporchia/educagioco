# Giocare insieme

**Stato: fatto** (28 ottobre 2026), provato su una rete finta e cattiva e con due browser veri davanti al servizio in locale.
**Da mettere online: il servizio** (`cd servizio/inoltro && npx wrangler deploy`, lo fa l'utente): prima del deploy la sfida dei
telefoni aggiornati non trova il tavolo. Il pezzo comune per due telefoni che giocano la stessa partita. Oggi lo usa Castle Battle
([../arena/multigiocatore.md](../arena/multigiocatore.md)); un gioco nuovo in due ci mette solo le sue regole.

## Perché esiste

Prima la sfida stava tutta dentro Castle Battle e **finiva alla prima caduta del filo**: un WebSocket che si chiude (il telefono
cambia rete, la wifi singhiozza, quello di Melody perde una richiesta su quattro) era «il collegamento è caduto» per uno e «l'altro
se n'è andato» per l'altro. Non c'era rientro, e nessuno si accorgeva di un filo morto in silenzio. Il servizio pubblicato regge:
dieci minuti di prova dal computer di casa senza una caduta, 77 ms a messaggio, punte di mezzo secondo (28/10). Le cadute vengono
dai telefoni, quindi la sfida deve sopravviverci.

## Come fanno i giochi veri, e cosa si è preso

Due modelli (Glenn Fiedler, *Gaffer on Games*):
- **lockstep deterministico** (gli strategici in tempo reale): ognuno simula la stessa partita e si scambiano solo le mosse. Ogni
  mossa deve arrivare: chi manda tiene quelle non confermate e le rimanda, chi riceve conferma l'ultima. È il nostro: le mosse sono
  poche e piccole, i due telefoni sono pari, il servizio non sa i giochi.
- **fotografie dello stato** (gli sparatutto): uno solo simula e manda fotografie continue; una persa non conta perché arriva la
  successiva. Vorrebbe un telefono «padrone» e qualche KB più volte al secondo, e le mosse dell'altro devono arrivare lo stesso:
  il problema si sposta, non sparisce.

Per riprendere dopo una caduta si è fatto come la *connection state recovery* di Socket.IO: il posto si tiene due minuti, ogni
messaggio ha un numero, e al rientro si rimanda quello che manca. La fotografia si usa solo quando le copie si separano, come in
Croquet (lo stesso lockstep, con un «riflettore» che fa il nostro servizio). Librerie pronte no: il gioco è un file unico senza
dipendenze e il servizio è un Worker di Cloudflare (Socket.IO e Colyseus vogliono un loro server; partysocket fa solo il rientro).

## I pezzi (`src/insieme/`)

| File | Cosa fa | Non sa |
|---|---|---|
| `rete.js` | `creaTavolo({ posto })` e il `Canale`: oggetti consegnati tutti, una volta sola e in ordine anche dopo una caduta; si ricollega da solo; dice com'è la linea | i giochi |
| `lockstep.js` | due copie che si scambiano le mosse, l'impronta ogni tanto, la fotografia se si separano | la rete, il gioco (gli dà un `motore`) |
| `incontro.js` | dal tavolo alla fine: la trattativa (versione, proposta), il lockstep, gli stati per lo schermo, le frasi | gli schermi, il gioco (gli dà una `regola`) |
| `schermo.js` | tiene lo schermo acceso mentre si gioca (Wake Lock; dove non c'è, niente) | |
| `sfida.js` | `usaSfida`: la sfida vista da un gioco: crea, entra col codice, invita un amico (e l'invito che arriva), l'incontro dalla sala alla partita, il cartello della linea dopo 1,5 s, il libretto dei guasti | il gioco (gli dà `regola`, `alVia`, `mostra`) |
| `SalaSfida.vue` | la sala: crea / entra / invita, il codice da dire, l'attesa, cosa è andato storto | le scelte di chi crea (slot `scelte`) |
| `CartelloLinea.vue` | sopra la partita: «hai perso la linea», «l'altro ha perso la linea», la sfida finita col perché | |
| `grafo.js` | la fotografia di uno stato qualunque (`fotoDi`, `rimettiDa`): le Map, i Set, gli array tipizzati, le classi dal nome e gli oggetti che stanno in due posti, che il JSON perde; le funzioni no (il caso si rimette dal suo stato) | il gioco |

Un gioco dà all'`Incontro` una **regola** (`versione`, `proponi(scelte)`, `accetta(proposta)`, `crea(proposta)` → il motore) e il
**motore** del lockstep (`passo`, `avanza()`, `applica(ruolo, mossa)`, `valida(mossa)`, `impronta()`, `simili(a, b)`, `foto()`,
`rimetti(foto)`, `fine()`, `finisci(f)`); legge `stato`, `linea`, `motivo` e chiama `avanza(dt)`, `scegli(mossa)`, `finisci()`,
`chiudi()`. Castle Battle: `src/giochi/arena/sfida/regia.js`.

**Quando ognuno porta qualcosa di suo** (il sotterraneo: il proprio eroe), la regola ha anche `presentati()` (la parte di chi gioca
qui) e `accettaParte(parte)`: l'host manda la sua con l'`inizio`, l'ospite la sua col `pronto`, e `crea(proposta, { host, ospite })`
le riceve tutte e due, uguali sui due telefoni. Una parte storta rompe la sfida con «l'eroe dell'altro non si può portare qui».
Un gioco senza `presentati` (Castle Battle) non manda niente e `crea` riceve solo la proposta.

## Il tavolo (`servizio/inoltro`, logica in `src/tavolo.js`, Durable Object `Tavolo`)

| Richiesta | |
|---|---|
| `GET /tavolo/nuovo?posto=<p>` | un tavolo con un codice di 5 lettere, col posto dell'host prenotato (30 all'ora per indirizzo) |
| `GET /tavolo/<codice>?posto=<p>` → WebSocket | ci si siede; chi rientra con lo stesso posto riprende il suo, e il filo vecchio si chiude (4000) |

- **Il posto** è una parola casuale di 20 lettere che ha solo quel telefono. Chi crea il tavolo è `host` anche se il suo primo filo
  arriva dopo quello dell'altro (trovato dal banco: con «il primo che arriva» i ruoli si scambiavano).
- **Dal servizio:** `{ t: 'ciao', ruolo, altro }`, `su` (l'altro è arrivato o rientrato), `giu` (gli è caduto il filo: si aspetta),
  `via` (ha detto addio, o è mancato per più di due minuti), `{ t: 'no', perche }` e chiusura 4001 per `nessuno` (codice che non
  c'è), `piena`, `andato` (quel posto ha già detto addio), `chiuso` (scaduto: cinque minuti se l'altro non arriva, un'ora e mezza di gioco).
- **`{"t":"ping"}` → `{"t":"pong"}`** lo risponde Cloudflare senza svegliare l'oggetto (`setWebSocketAutoResponse`).
- **Il resto si gira all'altro così com'è**, se c'è; se non c'è si perde (lo rimanda il telefono). Controlli: 2048 caratteri, JSON
  con `t`, e un secchio di 300 messaggi che si riempie di 40 al secondo: l'onda che arriva dopo che la rete si è piantata passa (con
  80 il banco vedeva chiudere fili sani), un martello no.
- La stanza di prima (`/crea`, `/entra/<codice>`, `Stanza`) resta per i telefoni col gioco vecchio; si toglie quando tutti si sono
  aggiornati, con una migrazione `deleted_classes` come per la `Coppia`.

## Il canale (`rete.js`)

- **Numeri e conferme:** `{ t: 'm', n, a, d }` (un oggetto, `a` = fin dove ho tutto dell'altro), `{ t: 'b', a }` (il battito verso
  l'altro, ogni secondo se non si è detto niente), `{ t: 'r', a }` (mi manca qualcosa dopo `a`). Chi riceve prende solo `n` = il
  successivo: i doppioni e quelli che saltano la fila si scartano (arrivano di nuovo).
- **Rimandare:** quando l'altro rientra (`su`, o il mio `ciao` dice che c'è), quando lo chiede (`r`), e come rete di sicurezza se
  l'altro dà notizie ma non conferma. **Se l'altro tace non si rimanda niente**: i miei sono fermi in viaggio con i suoi, e
  un'onda di doppioni non aiuta. Quello in coda parte al massimo 8 alla volta ogni 250 ms (32 al secondo, sotto i 40 del servizio).
- **A pezzi:** un oggetto oltre 800 caratteri viaggia in più messaggi numerati (`f`, `p: 1` se continua): la fotografia di Castle
  Battle non sa più niente di misure.
- **Le due linee:** `io` (`apro`, `su`, `giu`) e `altro` (`mai`, `su`, `giu` se il servizio l'ha detto, `muto` se è collegato ma
  tace da 5 s). Il gioco mette il cartello solo dopo 1,5 s di guasto di fila: un singhiozzo non si vede.
- **Uscire:** `chiudi()` aspetta (al massimo 3 s) che l'altro abbia confermato tutto, poi `addio`: la sua copia riceve la mia ultima
  mossa e il mio «fine» prima di sapere che me ne sono andato.
- **Lo schermo che torna acceso e la rete che torna** (`visibilitychange`, `online`): si riprova subito, senza aspettare.

### I tempi (`TEMPI`)

| | ms | perché |
|---|---|---|
| `ping` / `sordo` | 2000 / 6000 | un filo morto in silenzio (il telefono crede di essere collegato) si scopre in sei secondi e se ne apre un altro |
| `battito` / `muto` | 1000 / 5000 | l'altro dà notizie ogni secondo; cinque di silenzio sono «non si sente» |
| `apertura` | 5000 | un collegamento che non si apre si lascia; dopo tre di fila mai riusciti, «serve internet» |
| `ripeti` | 2500 | la rete di sicurezza dei rimandi |
| `grazia` | 125000 | quanto si aspetta la propria linea, o una notizia vera dall'altro, prima di finire (il servizio tiene il posto 120 s) |

## Il lockstep (`lockstep.js`)

Ognuno promette «fino al tick H non ti mando altre mosse» e manda le sue con il tick in cui valgono, `RITARDO` 12 tick avanti
(0,6 s a 20 tick al secondo: prima erano 0,3 s, al limite per due telefoni che passano da Cloudflare); la partita avanza di un tick
solo quando di tutte e due le parti si sa tutto, quindi una rete lenta ferma il campo ma non separa le copie. Ogni `OGNI_IMPRONTA`
tick si confronta l'impronta; se le copie si sono separate, l'host manda la fotografia e l'ospite riparte da lì (dopo 30 volte è
un guasto). Due mosse sullo stesso tick si applicano prima per l'host. Una promessa troppo avanti si rifiuta, ma la soglia è larga
(4000 tick): ogni mossa fatta mentre si aspetta l'altro sposta la promessa di un tick, e con 40 la sfida si rompeva da sola (il banco
l'ha trovato, ed era anche nel codice di prima).

**Determinismo:** il motore non usa `Math.hypot` (non è arrotondato uguale da tutti i browser) ma `Math.sqrt(dx*dx + dy*dy)`, che lo
è. Un gioco nuovo in due evita `Math.hypot`, `Math.sin/cos/exp/pow` nelle regole e `Math.random` fuori dal caso col seme.

## Un gioco nuovo in due

Rete, cadute, trattativa, sala e cartello non si riscrivono. Il gioco dà:

1. **Un motore deterministico**, fuori dalla view: tick fisso, caso col seme, niente tempo vero, e i conti di
   `src/motore/conti-uguali.js` invece di `Math.hypot`, della trigonometria, di `pow`, `exp` e `log`, che due browser arrotondano
   diversi. È quasi tutto il lavoro quando la
   logica sta ancora nel componente (i giochi in `src/views/`).
2. **L'adattatore** (in Castle Battle `sfida/`, 130 righe): la `regola` e il `motore` del lockstep (sopra); la mossa, l'impronta e
   la fotografia sono le sole cose da pensare.
3. **La schermata**: `const sfida = usaSfida({ gioco, regola, alVia, mostra })`; `<SalaSfida>` con le sue scelte nello slot
   `scelte` (le classi `ins-scelte`, `ins-scelta`, `ins-scelta-su`, `ins-nota` danno i tasti di tutti); nel battito
   `sfida.avanza(dt)` invece di avanzare la partita; le mosse con `sfida.regia.value.scegli(mossa)`; `<CartelloLinea>` sopra il
   campo; `sfida.daInvito()` quando il gioco si apre; `sfida.chiudi()` uscendo. Uno contro l'altro niente pausa, sosta, stelle, e le domande
   `svelta` ([../apprendimento/la-domanda.md](../apprendimento/la-domanda.md)); quello che si legge mentre il campo corre (prezzi,
   menu) si rifà a ogni giro. Insieme, contro il gioco, chi risponde può stare al riparo mentre l'altro va avanti: il progetto del
   sotterraneo in due ([../sotterraneo/in-due.md](../sotterraneo/in-due.md)), che chiede anche all'incontro di portare la parte
   dell'ospite (il suo eroe).
4. **L'invito degli amici**: una voce in `src/amici/giochi.js` (`valida` per i dati che porta l'invito, oltre al codice).
5. **I bambini finti** per le prove e il banco: `test/aiuto/sfide/<gioco>.mjs` (`regola({ firma, ruolo })`, `scelte(seme)`,
   `muovi(ruolo, incontro, caso)`) e la sua riga in `sfide/index.mjs`. Ci sono Castle Battle e il sotterraneo.

Un gioco a turni (uno muove, l'altro aspetta) usa lo stesso lockstep con un motore che cambia solo quando arriva una mossa: i tick
costano poco. Una via più semplice (solo canale e incontro) si fa quando arriva il primo.

## Le prove

- `unita/insieme-canale`: il tavolo da solo e il canale sulla **rete finta** (`test/aiuto/rete-finta.mjs`: orologio finto, la
  logica vera del tavolo, quattro guasti: `taglia` il filo cade, `buco` il filo muore in silenzio, `spegni` niente rete per un po',
  `ferma` tutto in coda e poi in blocco), compresi dieci minuti con una trentina di guasti a caso: arrivano tutti i 6000 messaggi.
- `unita/arena-sfida`: il lockstep col motore di Castle Battle e partite intere su una rete cattiva (`test/aiuto/sfida-finta.mjs`,
  che fa giocare due bambini finti di un gioco qualunque: quelli di Castle Battle in `test/aiuto/sfide/arena.mjs`).
- `integrazione/arena-sfida`: due browser veri, ognuno col suo **proxy cattivo** (`test/aiuto/proxy-cattivo.mjs`, gli stessi guasti
  a livello di TCP) davanti a `wrangler dev`; senza il servizio in locale salta.
- `servizio/inoltro/prova.mjs`: le regole del tavolo contro il servizio vero (in locale o pubblicato).
- I semi rendono tutto rifacibile: stessa partita, stessi guasti.

### Tarare la tolleranza: `node strumenti/banco-rete.mjs`

Partite intere fra due telefoni finti di un gioco (`--gioco arena`, quelli di `test/aiuto/sfide/`), per scenario (`calma`, `casa`, `melody`, `pessima`: latenza e guasti al minuto in
`SCENARI`), con il seme; `--partite`, `--seme`, `--minuti`, `--scenario`, `--tempi grazia=60000,sordo=4000` per provare altri
tempi. Una riga per scenario: quante arrivano in fondo, quante si rompono e perché, quanto si vede il cartello della linea, quanto si
resta fermi, cadute, rimandati, riallineamenti, fili chiusi dal servizio. Il 28/10, 12 partite: `casa` (mezzo guasto al minuto)
nessuna rotta, cartello in media 0,2 s; `melody` (tre guasti al minuto, reti spente fino a 30 s) una rotta su 12, perché chi entrava
non aveva rete nei primi 30 s; `pessima` quasi tutte finite con «se n'è andato», com'è giusto. Gli scenari sono stime: da
rimisurare quando si sa com'è davvero la rete di casa.

## Quando una sfida si rompe

Il cartello dice il perché (`PAROLE` in `incontro.js`) e, fra parentesi, la diagnosi: tick, riallineamenti, quanto si è aspettato
l'altro, cadute del filo e l'ultima chiusura (codice e ragione), rimandati. `usaSfida` la scrive anche nel **libretto dei guasti**
(`src/incidenti.js`, la pagina dei grandi), insieme alle sfide finite bene dopo delle cadute: dal telefono di un bambino si legge
cosa è successo senza cavo.

## Nei test

La sala: `[data-sfida]`, `[data-sfida-crea]`, `[data-sfida-entra]`, `[data-sfida-amici]`, `[data-amico]`, `[data-sfida-vai]`,
`[data-sfida-codice-input]`, `[data-codice]`, `[data-sfida-invitato]`, `[data-sfida-indietro]`, `[data-sfida-messaggio]`. Il
cartello: `[data-sfida-linea="io"|"altro"]` (mentre si aspetta), `[data-sfida-rotta]` (finita male), `[data-sfida-esci]`. Quelli
delle scelte sono del gioco ([../arena/multigiocatore.md](../arena/multigiocatore.md)).
