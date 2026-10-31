# Il guardaroba: cambiare abito al contadino

Il personaggio della fattoria 3D **non è un eroe**: è **il contadino** o **la contadina** (nome e articoli in `nomeDelContadino` di
`dati/abiti.js`: «Torna al contadino», «Torna alla contadina»). Nel codice la variabile resta `eroe` (`eroe.js`, `mondo.eroe`): è un
nome interno, **mai** una stringa che si legge. Vale per i testi a schermo, gli `aria-label` e i documenti.

## Chi si è: il genere viene dal profilo

Come nella fattoria 2D: il personaggio scelto dal bambino (`aspettoDi()` in `store/profile.js`, `'bambina' | 'bimbo'`; la scelta
è `components/SceltaAspetto.vue`) decide **contadina** o **contadino** (`personaDi(aspetto)`). Non si salva niente nella fattoria 3D: si
rilegge a ogni apertura, quindi cambiare personaggio altrove cambia anche qui. Il guardaroba ha la stessa scelta (`SceltaAspetto`, che
chiama `scegliAspetto`): cambiare lì cambia anche la fattoria 2D. Un valore sconosciuto ripiega su `ASPETTO_ERO` (`dati/compagni.js`).
Nota: un profilo che non ha mai scelto parte da `bambina` (è `PERSONE[0]`, vale anche per la 2D), cioè dalla contadina.

## Come si apre

- **Toccando il contadino che sta fermo** (`Mondo3d.contadinoSotto`: il raggio del dito contro una sfera attorno al corpo; non con semina o
  raccogli armati, col pennello delle strade o con un pezzo in mano). Watson e i gatti hanno la precedenza, come sempre.
- **Il tasto «👕»** nell'HUD, accanto al banco e all'inventario (solo l'icona: a 360 px non c'è posto per la parola).
- Il foglio (`viste/Guardaroba.vue`, stile `stile-guardaroba.css`) si chiude con la ✕ in alto a destra. Conta in `fogliAperti`: finché è aperto
  un tocco sulla scena non fa camminare nessuno.

## I capi

Un **abito** è un oggetto semplice `{ persona, cappello, maglia, pantalone, stivali, collo, capelli, pelle }` di chiavi stringa. La `persona`
non si salva: in `profile.campagne.fattoria3d.cfg.abito` (accanto a `cfg.stato` e `cfg.vicini`, scritto con `ricorda`) stanno **i soli capi**
(`capiDi`). `normalizzaAbito(salvato, persona)` accetta qualunque cosa (`null`, un abito vecchio, un capo che non esiste per lei) e torna un
abito intero: il capo sbagliato diventa quello di serie, i capelli cercano prima lo stesso colore. Non lancia mai e non guarda il livello.
Cambiando personaggio i capi compatibili (cappello, pantalone, stivali, collo, pelle) restano; maglia e capelli si riportano.

| categoria | scelte | di serie (lui / lei) |
|---|---|---|
| cappello | paglia, berretto, tesa larga, **fascia e fiore** (lei: un cerchietto sottile sopra i capelli col fiore di lato; un disco attorno alla testa sembrava un berretto), cowboy (liv 6), nessuno | paglia |
| maglia | lui: a quadri, blu, maglione, gilet da festa (liv 10); lei: camicetta, a pois, grembiule, abito da festa (liv 10) | quadri / camicetta |
| pantalone | blu, verde, marrone, rosso, giallo: **salopette** (lui) o **gonna** (lei) | blu |
| stivali | marroni, gialli, rossi, verdi, neri, dorati (liv 12) | marroni |
| collo | fazzoletto rosso / blu / giallo, sciarpa, papillon (lui, liv 9), scialle (lei, liv 9), niente | fazzoletto rosso |
| capelli | lui: corti (castani, neri, biondi, rossi); lei: trecce (castane, bionde), coda (nera, rossa), caschetto (castano, nero) | corti castani / trecce castane |
| pelle | cinque toni, da chiara a scura (uguali per tutti) | dorata |

Tutto è **gratis**. I pezzi con `liv` (i «speciali») sono velati col lucchetto e «Livello N» finché non arriva; toccati dicono a che livello.
Arrivano nel foglio dei livelli come «👕 … per il guardaroba» (`roba(l).abiti`, come `compagni`): **non contano** per `vuoto()` né per le cose
produttive, quindi nessuna soglia si sposta. `sbloccato(pezzo, livello)` e `vesti(abito, categoria, id, livello)` rifiutano un pezzo bloccato.

## Il disegno

`creaContadino(abito)` (in `scena3d/modelli-compagni.js`) legge l'abito: colori dei materiali (poi fusi per materiale come prima) e pochi mesh in
più per i pezzi (cappelli, trecce, coda, caschetto, gonna, grembiule, pois, sciarpa…). I **perni** non cambiano: `gambe, busto, testa, bracci, falce,
ascia` (cappelli e capelli nella `testa`, gonna e maglia nel `busto`, stivali nelle `gambe`). La faccia è la trama canvas di sempre col colore della
pelle (una per persona e tono). Resta sotto ~60 mesh e ~6000 triangoli (il test lo tiene). La cache dei modelli ha la chiave
`contadino` + `chiaveAbito(abito)`: ogni abito si costruisce una volta; le geometrie in cache non si buttano.

Cambiare abito **a caldo**: `Mondo3d.vestiContadino(abito)` → `Eroe.vesti` mette il corpo nuovo al posto del vecchio senza ricreare l'`Eroe`
(posizione, direzione, passo, gesto in corso e rialzo sul ponte restano). Una visita a un vicino parte con lo stesso abito (`visite.js`).
Il **ritratto** è un'anteprima come quelle dei pezzi (`scena3d/anteprime.js`, tipo `contadino:<chiave>`, stesso renderer, nessun contesto in più): una
foto per abito, rifatta a ogni scelta (non gira da sola).

## Come si aggiunge un pezzo

Una voce in `CAT[<categoria>]` di `dati/abiti.js` (`id`, `nome`, `emoji`, `c` il colore; `per` se è di uno solo; `liv` ≥ 2 se è speciale). Se è una
forma nuova (`forma` o `motivo`) un ramo in `costruisciContadino`. `guastiDegliAbiti()` controlla il resto (da 3 a 8 scelte per persona, la serie
sbloccata, niente id doppi). Un capo non si rinomina: l'id è nel salvataggio.

## Nei test

`test/unita/fattoria3d-guardaroba.test.mjs` (dati, genere, normalizzazione, sblocchi, nomi, modelli con 5 abiti, cache) e
`integrazione/fattoria3d` (il tocco sul contadino, un gettone, la ✕, «Torna al contadino/alla contadina», nessun «eroe» a schermo). Bersagli
`[data-…]` in [file.md](file.md).
