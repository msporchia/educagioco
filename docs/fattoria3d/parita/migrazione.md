# La conversione 2D → 3D (`statoDa2D`)

D1 è deciso ([decisioni.md](decisioni.md)): chi ha una fattoria 2D la ritrova nella 3D. Il codice è `src/giochi/fattoria3d/motore/migra.js`, la
prova `test/unita/fattoria3d-migra.test.mjs` (fattorie 2D vere a ogni livello, `fattoriaTipo` 1–99). Voci della tabella: [tecnica-e-salvataggi.md](tecnica-e-salvataggi.md) T1–T3.

## Le regole

1. **Fedele in tutto, imprecisa nei piazzamenti.** Ogni cosa posseduta con un equivalente 3D diventa un pezzo nel `magazzino`, da ripiazzare
   senza pagare. In mappa resta solo il campo di partenza della 3D (è già lì in una fattoria nuova).
2. **Mai monete.** Le monete vengono solo dagli esercizi: la funzione non le tocca né le inventa (un test lo controlla sul profilo e sullo stato).
   Quello che non ha un equivalente non si traduce in prezzo: si conta in `daRegalare`.
3. **Non lancia mai.** Un dato vuoto, guasto o già senza niente da portare torna `null` e la 3D parte da zero. Un'esperienza assurda (> 1e9)
   è un guasto: la ricerca del livello altrimenti non finirebbe.
4. **Il dato 2D non si tocca.** Si rilegge con la `Fattoria` della 2D (i salvataggi vecchi, i campi che mancano) e basta: restano leggibili.
5. **Una volta sola.** Si converte solo se la 3D non ha uno stato suo (`statoDaCaricare`): da quando la 3D salva, il suo stato vince sempre.

## Cosa diventa cosa

| 2D | 3D |
|---|---|
| `orto` (campo) | `campo` (uno è già in mappa, gli altri nel magazzino) |
| macchine: mulino, fienile, panificio, caseificio, telaio, zuccherificio, gelateria, sartoria, tintoria, friggitoria, sushi bar | lo stesso edificio, nel magazzino, **uno per tipo**; i doppioni sono «da regalare» |
| `pastificio` · `cucina` | `pasticceria` · `conserviera` (gli id 3D sono quelli dei salvataggi; la `pasticceria` 2D è una bottega e non c'entra) |
| `mongolfiera` · `mercato` · `carretto_mercato` | `mongolfiera` · `bancarella` · `trattore` |
| `ovile` · `pollaio` · `stalla` | `recinto` · `pollaio` · `stalla` (anche più d'uno) |
| fontane, pozzi, stagno, laghetto, ponte, panchine, tavoli, spaventapasseri | il decoro 3D omonimo (`fontana`, `pozzo`, `stagno`, `laghetto`, `ponte`, `panchina`, `tavolo`, `spaventapasseri`) |
| tutta la categoria `fiori` (vasi, fioriere, prati fioriti…) | `aiuola` |
| scorte di raccolti (`carote`, `fieno`…) | `merci` (singolare: `carota`, `erba`…) |
| scorte di prodotti, uova, latte, pesce | `prodotti`; la lana il contatore `lana` |
| piazzole comprate oltre le 9 di partenza | 2 lotti ciascuna (36 celle contro 16), i più vicini al quadrato di partenza, solo prato o bosco, sempre confinanti |
| raccolto maturo in un campo · lavoro finito in una macchina | la resa nelle scorte; il lavoro non finito rende gli ingredienti |
| tutto il resto (conigliera, porcile, anatre, capre, arnie, alpaca, asini, peschiera, pentolone, silos, alberi, sassi, case, recinti, feste…) · scorte senza equivalente (miele, tartufi, concime, merenda, mangime del cane…) · addobbi · bestie di casa | **`daRegalare`** |

`daRegalare` è un conto `{ 'cosa:ovile': 1, 'scorta:miele': 4, 'addobbo:cappello': 2, 'bestia:cane-bobtail': 1, 'terra': 2 }`: serve a regalare
la cosa quando il suo modello arriva (G4–G6), non vale monete e non si spende. Lo stato porta anche `migrato: 1`. Non si portano: i
piazzamenti, gli ordini aperti al banco, le botteghe e il volo in corso, i nomi e i bisogni delle bestie di casa (i compagni 3D arrivano col livello).

## Il livello (1 a 1 dal 22/10/2026, D2)

La 2D ha 70 livelli, la 3D 18: la scala è «in proporzione», `1 + round((L − 1) / 69 · 17)` (2D 10 → 3D 3, 35 → 9, 70 → 18; tutto oltre il 70
sta al 18). L'**esperienza** porta con sé anche la frazione già fatta del livello 2D, sulla banda del livello 3D. Poi il livello **non scende
sotto** quello che serve a tenere ciò che si ha: un edificio o un pezzo produttivo nel magazzino, e le colture che la 2D aveva già aperto
(`reclamati`). Il resto degli sblocchi (ricette, pezzi) li dà il livello, come sempre.
Fatto: `livelloPerProporzione` è l'identità (70 livelli uguali). La terra è tutta quella che aveva la 2D (324 celle di partenza + 36 a piazzola, col regalo del 5%: `lottiPerPiazzole`, 13 lotti nuovi per chi non ne ha comprate), non più «due lotti a piazzola». Il `mangime` del cane ora è un prodotto del mulino 3D e non è più «da regalare».

## L'aggancio

`statoDaCaricare(leggi)` sta nello stesso file; `leggi` è `scelta` di `src/giochi/campagne.js`. Manca solo di chiamarla dove la 3D legge il suo stato
la prima volta, `onMounted` di `src/giochi/fattoria3d/Gioco.vue`:
`new Fattoria3d({ stato: statoDaCaricare(scelta), borsa })` al posto di `scelta(CHIAVE, 'stato', null)`. Quando la 3D salva, il suo stato
sostituisce la conversione. «Ricomincia la fattoria» (G1b) deve azzerare anche `fattoria3d`, o la conversione tornerebbe a ogni avvio.

## Da fare

- Provarla su un salvataggio vero esportato (non solo sulle fattorie tipo).
- L'aggancio in `Gioco.vue` (un altro agente ci lavora) e una riga «la tua fattoria è arrivata» per i bambini, da proporre (D16).
- Dare la `daRegalare` quando i modelli arrivano (G4–G6); mostrarla ai genitori nel quadro.
