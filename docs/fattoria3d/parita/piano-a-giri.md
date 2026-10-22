# Piano a giri

Ordine del lavoro per arrivare alla parità, **P0 prima**. Un giro è 2–3 task che possono andare in parallelo perché toccano file
disgiunti. Gli id (C, A, M, L, W, I, T) sono quelli delle tabelle ([README.md](README.md)); le D sono in [decisioni.md](decisioni.md).
Regola per chi lavora: dopo ogni giro si aggiornano le celle delle tabelle e si lancia `node test/esegui.mjs fattoria3d`; **la
build e l'integrazione una volta per giro**, mai due agenti insieme sullo stesso `dist/`.

| giro | include | si ferma su | file (per l'incastro) | come si prova | avvicina |
|---|---|---|---|---|---|
| **G0** | rispondere a D1, D2, D9, D11, D15 | l'utente | nessuno | – | tutto |
| **G1** salvataggi | (a) `statoDa2D` pura **fatta** ([migrazione.md](migrazione.md); resta l'aggancio in `Gioco.vue`) — **D1 deciso: converte; cose possedute nel magazzino da ripiazzare gratis, sblocchi contati, piazzamenti no** — + test su `tipo.js` 1–99 (T1–T3); (b) «Ricomincia la fattoria» azzera anche la 3D, cestino (I17, T6); (c) cheat `#fattoria3d=N` e `#fattoria3d-tipo=N` + `tipo.js` 3D (I22, I23) | D1 | (a) `motore/migra*.js` nuovo; (b) `GenitoriView.vue`, `store/cestino.js`; (c) `Gioco.vue`, `AdminView.vue`, `core/comandi.md` | unità; un salvataggio vero esportato; integrazione `fattoria3d` | S1, S8 |
| **G2** guida (parallelo a G1) | (a) `?` della 3D in `src/guide/contenuti.js` (I1); (b) primo giro (I2); (c) consiglio con tasto (I4) e «Come si fa» (I3, C14) importando `dati/albero.js`/`usi.js` | – | `src/guide/`, nuove viste `Albero.vue`/`Consiglio`, `scena3d/detti.js` | integrazione sul dito; un bambino piccolo | S6 |
| **G3** economia e scala (**fatto** il 22/10/2026, [../livelli.md](../livelli.md)) | (a) costi dei gesti (C5, C21) e magazzino con scomparti (C11–C13); (b) scaletta: livelli e prezzi della 2D (L1–L3, C2), strumento `parita:fattoria3d` (T22), test di parità (T21) | D2, D9, D11, D13 | (a) `motore/fattoria3d.js`, `dati/regole.js`; (b) `dati/livelli.js`, `catalogo.js`, `ricette.js`, `motore/taratura.js`, `strumenti/`; in sequenza se toccano lo stesso motore | `npm run tara:fattoria3d` aggiornato; unità | S4 |
| **G4** il pentolone e la catena (**fatto**, [../cortile-e-pentolone.md](../cortile-e-pentolone.md)) | pentolone + 4 ricette (C18); anatre, maiali, capre con i tre stadi (A1d–A1f); la zucca e la patata trovano uscita (C23) | G3 | `dati/{ricette,animali,catalogo,mangime}.js`; modelli in file nuovi `scena3d/modelli-cortile.js` | unità; catalogo 3D (`npm run catalogo3d`) | S5 |
| **G5** il resto del cortile | conigliera, alpaca, asini; arnie con fiorume e miele; merenda e caramelle (A1g–A1j, C18–C19); peschiera o decisione (A1k) | G4 | stessi file di G4: **in sequenza**; i modelli in parallelo | come G4 | S5 |
| **G6** bestie di casa | bisogni, ciotola, coccole, premio, nomi, beagle, coniglio, pappagallo; addobbi (A4–A14) riusando `dati/bisogni.js` | D10 | `dati/bestie.js` nuovo, `viste/Bestia.vue` nuova, `scena3d/compagni.js` | unità + integrazione | S5, S2 |
| **G7** commercio (**fatto**: botteghe, clienti per mestiere, fama, quarta fila, [../botteghe.md](../botteghe.md); restano M4 e M20) | quattro botteghe, clienti per mestiere, fama, mongolfiera a quattro file, la fiera (M4, M10–M14, M17, M20) | G3 | `dati/botteghe.js` nuovo, `motore/botteghe.js`, `viste/Bottega.vue` | unità (premio sotto il tetto) | S5 |
| **G8** il mondo vivo | stagioni (W17–W19); i decori per famiglia (W7–W15); rotazione dei pezzi (W6) | – | `dati/stagioni.js` importato, `scena3d/modelli-decori*.js`, `dati/catalogo.js` | catalogo 3D; peso per famiglia (T13) | S5 |
| **G9** telefono | misura su un telefono vero (T7), degrado tarato (T9), campo istanziato (T10), ripiego senza WebGL 2 (T8, D15), sito spezzato (T15) | G1–G8 per il peso finale | `scena3d/pezzi.js`, `terreno.js`, `webgl.js`, `vite.config.js` | `profila-app`, `chrome://inspect`, `node strumenti/prova-sito.mjs` | S7 |
| **G10** prove e chiusura | integrazione eseguita sulla build (T19), i fogli guardati a 360/820 px (M9, M21, I29, I30), `sperimentale` spento, riga per i bambini proposta (I20), la 2D archiviata (D14) | tutti | – | `npm run test:tutto`, un telefono, un bambino | S2, S9 |

Rischi:
- **Stato**: `VERSIONE_STATO` 9 e la conversione toccano ogni salvataggio. Nessun giro può cambiare la forma senza un test di lettura
  dei vecchi stati (`normalizza` non lancia mai).
- **Peso**: ~30 modelli nuovi su ~430 draw call già alte. Ogni famiglia ha un budget misurato prima del giro successivo.
- **Regressione dei salvataggi dei bambini**: provare sempre con un bambino di prova, mai sul server di casa con la fattoria vera
  (`#fattoria-tipo=` butta la fattoria 2D attiva).
- **File condivisi**: `dati/animali.js`, `catalogo.js`, `ricette.js`, `motore/fattoria3d.js` sono toccati da quasi tutti i giri: i giri
  sulle stesse tabelle vanno in sequenza, in parallelo solo modelli e viste.

## Le richieste dell'utente non ancora chiuse

| richiesta | stato | dove |
|---|---|---|
| deve essere al pari del vecchio fattoria | questo documento | – |
| la fascia della contadina col fiore sembra un berretto | aperta | `scena3d/modelli-compagni.js` (`creaContadino`), [../guardaroba.md](../guardaroba.md) |
| cibo specifico per animale | fatto per le bestie del cortile (mangime); mancano le bestie di casa | A6 |
| HUD ridotto | fatto (le scorte stanno nell'inventario) | – |
| il richiamo di Watson | fatto, da giudicare col dito | [../compagni.md](../compagni.md) |
| gli altri animali della 2D | aperta | G4–G6 |
| l'erba medica | fatta | C31 |
| il pentolone | fatta (G4) | [../cortile-e-pentolone.md](../cortile-e-pentolone.md) |
| conigli, capre, alpaca, asini, maiali, anatre, api | capre, maiali, anatre fatti (G4); restano conigli, alpaca, asini, api | G5 |
| le stagioni | fatta in parte (cielo, fiocchi, addobbi, zucche; mancano costumi e albero) | G8 ([../stagioni.md](../stagioni.md)) |
| la guida | fatta: `?`, primo giro, consiglio; manca «Come si fa» (I3) | [../guida.md](../guida.md) |
| i suoni | parità con la 2D (nessuno): tenere | I26 |
| ruotare i pezzi | fatta (quarti di giro, tasto ↻) | W6 ([../rotazione.md](../rotazione.md)) |
| la misura su telefono | aperta | T7 |

Il resto delle voci aperte tecniche resta in [../da-fare.md](../da-fare.md).
