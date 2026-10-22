# Parità con la fattoria 2D

**Traguardo: la fattoria 3D può prendere il posto della 2D.** Un bambino che oggi gioca alla 2D, il giorno
che la 2D esce di scena, trova la 3D con la sua roba, con le stesse cose da desiderare e con le stesse regole: non perde
niente, non si annoia prima, non resta senza aiuto. Questo è l'elenco di quello che manca per arrivarci, ricavato dal codice
([../../fattoria/README.md](../../fattoria/README.md) è la 2D, [../README.md](../README.md) la 3D). I numeri sono letti
dai dati delle due fattorie (`src/giochi/fattoria/dati/`, `src/giochi/fattoria3d/dati/`) il 21/10/2026: se divergono,
vince il codice.

## I criteri per dire «può sostituirla»

| # | criterio | oggi |
|---|---|---|
| S1 | **Nessun salvataggio si perde.** Chi ha una fattoria 2D la ritrova (convertita) o la tiene finché non decide lui | ❌ non esiste migrazione ([tecnica-e-salvataggi.md](tecnica-e-salvataggi.md) T1) |
| S2 | **Il posto dove si spendono le monete è uno solo.** Le due fattorie non convivono: ora la 3D spende monete vere accanto alla 2D ([../../fattoria/regole.md](../../fattoria/regole.md) «Il money pit è uno») | 🟡 convivono, la 3D è dietro «giochi in prova» |
| S3 | **Lo stesso patto**: le monete vengono solo dagli esercizi, niente si vende, niente marcisce, nessun gioco paga una risposta sbagliata, un «no» dice cosa fare ([../../apprendimento/calibrazione.md](../../apprendimento/calibrazione.md)) | ✅ rispettato |
| S4 | **Dura quanto la 2D**: la scaletta regge mesi, non giorni (2D: 70 livelli, ~202 ore di esercizio spese; 3D: 18 livelli, ~8 ore) | ❌ [livelli-ed-economia.md](livelli-ed-economia.md) |
| S5 | **Niente della 2D manca senza una decisione scritta** («tolto perché…»): ogni macchina, recinto, bestia, bottega, decoro | ❌ [colture-e-catena.md](colture-e-catena.md), [animali.md](animali.md), [commercio.md](commercio.md), [mondo-e-stagioni.md](mondo-e-stagioni.md) |
| S6 | **Si capisce da soli, a 4–12 anni**: il `?`, il consiglio («cosa faccio adesso»), «Come si fa», il primo giro | 🟡 fatti `?`, primo giro e consiglio ([../guida.md](../guida.md)); manca «Come si fa» (I3) e la prova con un bambino |
| S7 | **Gira sui telefoni di casa** e senza WebGL 2 non lascia un bambino senza fattoria | ❌ mai misurata su un telefono; senza WebGL 2 si torna in home ([tecnica-e-salvataggi.md](tecnica-e-salvataggi.md)) |
| S8 | **I grandi la governano** come la 2D: «Ricomincia la fattoria», interruttori, quadro, traguardi, novità | ❌ [interfaccia-e-guida.md](interfaccia-e-guida.md) I17–I20 |
| S9 | **È provata**: l'integrazione eseguita sulla build e guardata col dito su un telefono vero | ❌ molte prove «scritte ma non eseguite» ([../da-fare.md](../da-fare.md)) |

## I numeri a colpo d'occhio

| | 2D | 3D |
|---|--:|--:|
| voci nel catalogo (cosa si compra) | 253 | 34 (20 pezzi + 14 edifici) |
| di cui decorazioni | 217 (verde, fiori, acqua, recinti, case, arredo, bestiole, feste, fiera, raccolto) | 10 (aiuola, panchina, fontana, pozzo, spaventapasseri, tavolo, passerella, ponte, stagno, laghetto) |
| colture | 16 | 16 (gli stessi id, singolari) |
| ricette | 57 | 37 (nessuna inventata) |
| macchine | 14 | 13 (manca il pentolone) |
| recinti del cortile | 11 | 3 (pecore, galline, mucche) |
| bestie di casa (si comprano, hanno bisogni) | 7 | 0 (4 compagni gratuiti che girano, non si curano) |
| addobbi per le bestie | 12 (7 in vendita) | 0 (il guardaroba è del contadino) |
| botteghe del paese | 4 | 0 |
| clienti del banco | 16 (per mestiere) | 10 (per tutti) |
| silos | 3 (scomparti da 8, ingrandibili) | 0 (scorte senza tetto) |
| livelli | 70 | 18 |
| ore di esercizio per arrivare in cima (spesa a 🪙6/min) | ~202 | ~8,25 |
| celle di terra | piazzole 6×6, rincaro ×1,38 | lotti 4×4 senza confini, rincaro lineare poi quadratico |
| stagioni (Halloween, Natale) | sì | no |
| guida `?`, consiglio, «Come si fa» | sì | `?`, primo giro e consiglio; «Come si fa» no |
| test (file di unità + di integrazione) | ~15 + 8 | 22 + 2 |

**Quello che la 3D ha e la 2D no** (✳): mondo senza confini, mare, laghi e pesca, i vicini col trattore, il guardaroba del
contadino, i compagni che reagiscono al tocco, la crescita continua dei campi, i tre stadi leggibili delle bestie, i pezzi
da trascinare con scorrimento ai bordi. Vanno tenuti? Decisione D10 ([decisioni.md](decisioni.md)).

## Come si legge una tabella

- **3D**: ✅ uguale · 🟡 diverso (voluto: ha un perché scritto; o scorciatoia) · ❌ manca · ✳ solo 3D.
- **Priorità**: **P0** blocca la sostituzione · **P1** serve presto, dopo i P0 · **P2** rifinitura.
- Ogni riga ha un id (C3, A5, M2…) che il [piano a giri](piano-a-giri.md) richiama. Quando una riga arriva a ✅ si cambia la
  cella e basta: la storia la tiene `git log`.
- **Un numero della 3D «in secondi» contro i «minuti» della 2D è un fatto di tempo, non un errore**: [decisioni.md](decisioni.md) D9.

## I file

- [colture-e-catena.md](colture-e-catena.md) — campi, colture, tre fasi, silos, le 14 macchine, le 57 ricette, la fila, il mangime
- [animali.md](animali.md) — i recinti, le bestie di casa e i loro bisogni, gli addobbi, i compagni
- [commercio.md](commercio.md) — banco, botteghe, mongolfiera, carretto e vicini, il vendere
- [livelli-ed-economia.md](livelli-ed-economia.md) — livelli, esperienza, prezzi, dove le monete escono, la durata
- [mondo-e-stagioni.md](mondo-e-stagioni.md) — terra, ostacoli, decorazioni, acqua e pesca, stagioni, fiera
- [interfaccia-e-guida.md](interfaccia-e-guida.md) — gesti, baule, guida, consiglio, home, genitori, cheat, suoni
- [tecnica-e-salvataggi.md](tecnica-e-salvataggi.md) — migrazione dello stato, peso e telefoni, sito spezzato, test
- [decisioni.md](decisioni.md) — le scelte che spettano all'utente, con pro, contro e una raccomandazione
- [piano-a-giri.md](piano-a-giri.md) — l'ordine del lavoro, i rischi, le richieste non ancora chiuse

## I P0 in una riga

1. **T1** una migrazione dei salvataggi 2D → 3D (o una scelta scritta di non farla).
2. **L1–L3** una scaletta che regge mesi: oggi 18 livelli e ~8 ore; mancano le cose che ne riempiono 70.
3. **A1–A3** il cortile completo: 8 recinti, il pentolone, le bestie di casa con i loro bisogni.
4. **T7, T8, T19** misurare la 3D su un telefono vero, decidere cosa fa senza WebGL 2, eseguire le prove d'integrazione.
5. ~~**I1, I2, I4** la guida~~ fatta (G2); resta I3, «Come si fa».
6. **I17** «Ricomincia la fattoria» e il cestino per la 3D.
