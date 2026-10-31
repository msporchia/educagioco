# Parità con la fattoria 2D

**Fatto il 31/10/2026: la 3D ha preso il posto della 2D**, che è stata tolta dal gioco. Il traguardo era che un bambino della 2D
trovasse la 3D con la sua roba, con le stesse cose da desiderare e con le stesse regole: non perde niente, non si annoia prima, non
resta senza aiuto. Questa cartella resta come **registro di cosa la 3D ha preso dalla 2D** (e di cosa no, con il perché), e come
casa della conversione dei salvataggi ([migrazione.md](migrazione.md)). I dati 2D da cui la 3D legge i numeri stanno in
`src/giochi/fattoria3d/da2d/`; i numeri qui sono letti dal codice il 21/10/2026 e dopo: se divergono, vince il codice. Le voci
ancora aperte stanno in [../da-fare.md](../da-fare.md).

## I criteri per dire «può sostituirla»

| # | criterio | oggi |
|---|---|---|
| S1 | **Nessun salvataggio si perde.** Chi ha una fattoria 2D la ritrova convertita | ✅ la conversione c'è ed è agganciata, con il ritocco per chi era stato convertito prima ([migrazione.md](migrazione.md)); mai provata su un salvataggio vero |
| S2 | **Il posto dove si spendono le monete è uno solo** | ✅ dal 31/10/2026: la 2D è tolta, la 3D è «La fattoria» e non è più in prova (D14) |
| S3 | **Lo stesso patto**: le monete vengono solo dagli esercizi, niente si vende, niente marcisce, nessun gioco paga una risposta sbagliata, un «no» dice cosa fare ([../regole.md](../regole.md)) | ✅ rispettato |
| S4 | **Dura quanto la 2D**: la scaletta regge mesi, non giorni (70 livelli, ~202 ore di esercizio spese, uguali) | ✅ G3 (22/10/2026); nessun livello senza novità dopo G9 ([livelli-ed-economia.md](livelli-ed-economia.md) L20) |
| S5 | **Niente della 2D manca senza una decisione scritta** («tolto perché…»): ogni macchina, recinto, bestia, bottega, decoro | 🟡 restano i clienti per mestiere al banco (M4) e i recinti in costume a Halloween (W21) |
| S6 | **Si capisce da soli, a 4–12 anni**: il `?`, il consiglio («cosa faccio adesso»), «Come si fa», il primo giro | 🟡 fatti tutti ([../guida.md](../guida.md)); manca la prova con un bambino |
| S7 | **Gira sui telefoni di casa** | 🟡 mai misurata su un telefono vero; senza WebGL 2 si torna in home, e un telefono così «non ci interessa» (D15) |
| S8 | **I grandi la governano** come la 2D: «Ricomincia la fattoria», interruttori, quadro, traguardi | ✅ ([interfaccia-e-guida.md](interfaccia-e-guida.md) I17–I19) |
| S9 | **È provata**: l'integrazione eseguita sulla build e guardata col dito su un telefono vero | ❌ molte prove «scritte ma non eseguite» ([../da-fare.md](../da-fare.md)) |

## I numeri a colpo d'occhio

| | 2D | 3D |
|---|--:|--:|
| voci nel catalogo (cosa si compra) | 253 | 258 (239 pezzi + 19 edifici) |
| di cui decorazioni | 217 (verde, fiori, acqua, recinti, case, arredo, bestiole, feste, fiera, raccolto) | 217 (le 11 di prima + 130 del giro G8 + 76 del G9: fiori, arredo, acqua, albero di Natale, fiera) |
| colture | 16 | 16 (gli stessi id, singolari) |
| ricette | 57 | 49 in `RICETTE` (46 della 2D e i tre piatti di pancetta, solo 3D), più le 9 dei mangimi in `dati/mangime.js` |
| macchine | 14 | 18 (le 14 macchine e le 4 botteghe, che in 3D sono edifici) |
| recinti del cortile | 11 | 10 (pecore, galline, mucche, anatre, maiali, capre, conigli, alpaca, asini, arnie; la peschiera è la pesca) |
| bestie di casa (si comprano, hanno bisogni) | 7 | 4 (beagle, gatto rosso, coniglio, pappagallo; bobtail, gatto bianco e nero e gatto nero sono i compagni gratis Watson, Sherlock e Pepe) |
| addobbi per le bestie | 12 (7 in vendita) | 12, tutti in vendita, anche su Watson e i gatti |
| botteghe del paese | 4 | 4 (G7: [../botteghe.md](../botteghe.md)) |
| clienti del banco | 16 (per mestiere) | 10 (per tutti) |
| silos | 3 (scomparti da 8, ingrandibili) | 3 magazzini (scomparti da 8, +2, prezzo 2D), senza pezzi da comprare |
| livelli | 70 | 70 (gli stessi) |
| ore di esercizio per arrivare in cima (spesa a 🪙6/min) | ~202 | ~201 |
| celle di terra | piazzole 6×6, rincaro ×1,38 | lotti 4×4 senza confini, stesso prezzo cella per cella (quantità pareggiata) |
| stagioni (Halloween, Natale) | sì | sì (cielo, neve, zucche, albero; niente costumi ai recinti) |
| guida `?`, consiglio, «Come si fa» | sì | `?`, primo giro, consiglio e «Come si fa» |
| test (file di unità + di integrazione) | ~15 + 8 | 22 + 2 |

**Quello che la 3D ha e la 2D no** (✳): mondo senza confini, mare, laghi e pesca, i vicini col trattore, il guardaroba del
contadino, i compagni che reagiscono al tocco, la crescita continua dei campi, i tre stadi leggibili delle bestie, i pezzi
da trascinare con scorrimento ai bordi. Tenuto tutto (D10, [decisioni.md](decisioni.md)).

## Come si legge una tabella

- **3D**: ✅ uguale · 🟡 diverso (voluto: ha un perché scritto; o scorciatoia) · ❌ manca · ✳ solo 3D.
- **Priorità** (com'era scritta prima della sostituzione): **P0** bloccava la sostituzione · **P1** serviva presto · **P2** rifinitura.
- Ogni riga ha un id (C3, A5, M2…) che il resto dei documenti richiama. Quando una riga arriva a ✅ si cambia la cella e basta: la
  storia la tiene `git log`.

## I file

- [colture-e-catena.md](colture-e-catena.md) — campi, colture, tre fasi, silos, le 14 macchine, le 57 ricette, la fila, il mangime
- [animali.md](animali.md) — i recinti, le bestie di casa e i loro bisogni (fatte, G6: [../bestie-di-casa.md](../bestie-di-casa.md)), gli addobbi, i compagni
- [commercio.md](commercio.md) — banco, botteghe, mongolfiera, carretto e vicini, il vendere
- [livelli-ed-economia.md](livelli-ed-economia.md) — livelli, esperienza, prezzi, dove le monete escono, la durata
- [mondo-e-stagioni.md](mondo-e-stagioni.md) — terra, ostacoli, decorazioni, acqua e pesca, stagioni, fiera
- [interfaccia-e-guida.md](interfaccia-e-guida.md) — gesti, baule, guida, consiglio, home, genitori, cheat, suoni
- [tecnica-e-salvataggi.md](tecnica-e-salvataggi.md) — migrazione dello stato, peso e telefoni, sito spezzato, test
- [migrazione.md](migrazione.md) — la conversione 2D → 3D (`statoDa2D`): le regole, cosa diventa cosa, il livello, l'aggancio
- [decisioni.md](decisioni.md) — le scelte dell'utente (D1–D16), tutte chiuse
