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
**è parte dell'esperienza** (l'utente). **Viaggia nello stesso giro delle mosse** (`contadino-amico.js`, `Sessione.quiDelGiro`), così dove
arriva una mossa arriva anche lui. Prima stava sul filo degli inviti: se il filo moriva in silenzio le mosse passavano e il contadino
spariva per 36-50 s (misurato con due browser). Mosse e contadino sono due informazioni diverse:

- **Una mossa persa si rimanda**, una **posizione no**: il giro dopo ne porta una più nuova.
- Ogni giro porta `{ k: 'qui', p, d, r?, g?, a? }`: `p` la strada fatta dall'ultimo giro (un punto ogni 0,4 s, al massimo 10), verso dove
  guarda, se ha corso, l'ultimo gesto, ogni quattro giri l'abito. Uscendo, `{ k: 'via' }`.
- **Chi riceve tiene solo l'ultima** e ne segue la strada: il contadino cammina, ma **circa tre secondi indietro** rispetto all'amico. Se è
  più lontano di cinque celle dall'inizio della strada ci salta; sparisce dopo 15 s senza notizie (un giro perso ne costa sei).
- Il contadino ospite non tocca la fattoria.

**Sta nella fila ma non è una mossa**: così il servizio non cambia, e `mossaInForma` lo scarta aprendo. Tre cose lo tengono a bada:
- `seqMossa`: la fotografia si ferma all'ultima mossa vera. Col numero dell'ultima posizione, l'amico indietro di una posizione riceverebbe
  la fotografia e si riaprirebbe a ogni fotografia.
- Se dell'amico non si sa niente da 15 s, una posizione ogni 20 s (`DA_SOLO_OGNI`): chi arriva vede che ci sei e la fila non si riempie.
- `MAX_PER_GIRO` è 19: il servizio ne prende 20 a richiesta, e una è il contadino.

Il giro è di 3 s perché il servizio dà 3000 richieste all'ora per indirizzo, e due telefoni a casa ne fanno 2400: per un contadino meno
indietro bisognerebbe alzare quel tetto.

**Con più amici, più fattorie in comune**: una per amicizia, e il 🤝 ha un tasto per ognuno.

## Cosa non c'è ancora

- Dentro la fattoria in comune niente trattore verso i vicini (le visite toccano il motore senza passare dalle mosse), niente
  guida del primo giro, niente cheat dell'indirizzo.
- Una fattoria in comune per amicizia, quindi di due; un gruppo vorrebbe una chiave di gruppo sul servizio.
- Le visite alle fattorie degli amici (aiutare la mongolfiera, coccolare le bestie, annaffiare, adesivi, capi unici) sono scelte
  ma non fatte: [vicini.md](vicini.md).

## Nei test

`unita/fattoria3d-registro` (due telefoni finti a mano: la stessa fattoria, il doppio raccolto, il doppio pezzo, le monete,
gli id, le mosse storte), `unita/amici-servizio` (la fila e la fotografia), `unita/fattoria3d-comune-giro` (il contadino nel giro: due `Sessione` vere
davanti alle regole vere del servizio), `integrazione/fattoria3d-comune` (due pagine e il
servizio: entra, costruisce, l'altro trova, un lotto arriva mentre si gioca, il contadino dell'altro cammina col suo nome e sparisce quando esce, la propria fattoria intatta, senza rete; **serve il
servizio con la v6**, in locale `cd servizio/inoltro && npx wrangler dev` e `SERVIZIO=http://localhost:8787`, se no salta).

| bersaglio | cosa |
|---|---|
| `[data-f3="apri-comune"]` | il 🤝 nella propria fattoria; apre il dialogo con un tasto per amico (`[data-f3="dialogo"] [data-scelta]`) |
| `[data-f3="torna-mia"]` | il 🏠 dentro la fattoria in comune, e il tasto del cartello d'errore |
| `[data-f3="comune-attesa"]` (`[data-errore]`) | «Vado nella fattoria con…» mentre si collega, o perché non si può |
| `[data-f3="ospite"]` | il nome sopra il contadino dell'amico; il contadino è `window.__fattoria3d.mondo.ospite` (`visibile`, `eroe.x`, `eroe.z`) |
