# Il guardaroba: cambiare abito al contadino

Il personaggio della fattoria 3D **non è un eroe**: è **il contadino** o **la contadina** (nome e articoli in `nomeDelContadino` di
`dati/abiti.js`: «Torna al contadino», «Torna alla contadina»). Nel codice la variabile resta `eroe` (`eroe.js`, `mondo.eroe`): è un
nome interno, **mai** una stringa che si legge. Vale per i testi a schermo, gli `aria-label` e i documenti.

## Chi si è: viene dal profilo

Il personaggio scelto dal bambino (`aspettoDi()` in `store/profile.js`, `'bambina' | 'bimbo'`) decide **contadina** o **contadino** (`personaDi(aspetto)`). Non si
salva niente nella fattoria 3D: si rilegge a ogni apertura, quindi cambiare personaggio altrove cambia anche qui. **Chi si è è una caratteristica come le altre**: la
prima scheda del guardaroba, «Chi sei», ha due gettoni con la foto 3D del mezzobusto (Contadina, Contadino; la parola «sesso» non si usa con i bambini) e scrive il profilo con `scegliAspetto` (cambiarlo lì lo cambia
ovunque). Niente più la coppia di figure in pixel (`SceltaAspetto`, grande e non mostrava il personaggio): resta solo nel profilo. Un valore sconosciuto ripiega
su `ASPETTO_ERO` (`dati/compagni.js`). Un profilo che non ha mai scelto parte da `bambina` (`PERSONE[0]`), cioè dalla contadina.

## Come si apre

- **Dall'armadio dentro casa** ([casa.md](casa.md)): un tocco apre le sue opzioni, «👕 Apri l'armadio» porta il contadino davanti e lo apre. Il tocco sul contadino fermo, che lo
  apriva prima, è tolto (3/11/2026): l'armadio lo sostituisce, su richiesta dell'utente.
- **L'armadio di casa** è la porta: il tasto «👕» dell'HUD è stato tolto il 4/11/2026 ([casa.md](casa.md)).
- Il foglio (`viste/Guardaroba.vue`, stile `stile-guardaroba.css`) si chiude con la ✕ in alto a destra. Conta in `fogliAperti`: finché è aperto
  un tocco sulla scena non fa camminare nessuno.

## I capi

Un **abito** è un oggetto semplice `{ persona, cappello, maglia, pantalone, stivali, collo, taglio, capelli, barba, pelle }` di chiavi stringa. La `persona`
non si salva: in `profile.campagne.fattoria3d.cfg.abito` (accanto a `cfg.stato` e `cfg.vicini`, scritto con `ricorda`) stanno **i soli capi**
(`capiDi`). `normalizzaAbito(salvato, persona)` accetta qualunque cosa (`null`, un abito vecchio, un capo che non esiste per lei) e torna un
abito intero: il capo sbagliato diventa quello di serie, i capelli cercano prima lo stesso colore. Non lancia mai e non guarda il livello.
Cambiando personaggio restano tutti i capi tranne la maglia (che è di una persona sola) e il pantalone (salopette/gonna: stesso colore).

| categoria | scelte | di serie (lui / lei) |
|---|---|---|
| cappello | paglia, berretto, tesa larga, **fascia e fiore** (lei: un cerchietto sottile sopra i capelli col fiore di lato; un disco attorno alla testa sembrava un berretto), cowboy (liv 6), nessuno | paglia |
| maglia | lui: a quadri, blu, maglione, gilet da festa (liv 10); lei: camicetta, a pois, grembiule, abito da festa (liv 10) | quadri / camicetta |
| pantalone | blu, verde, marrone, rosso, giallo: **salopette** (lui) o **gonna** (lei) | blu |
| stivali | marroni, gialli, rossi, verdi, neri, dorati (liv 12) | marroni |
| collo | fazzoletto rosso / blu / giallo, sciarpa, papillon (lui, liv 9), scialle (lei, liv 9), niente | fazzoletto rosso |
| taglio | corti, lunghi, coda, trecce, caschetto, ricci, calvo (uguali per tutti, in comune col sotterraneo: `grafica/persona/aspetto.js` `TAGLI`, il disegno in `capelli3d.js`) | corti / trecce |
| capelli | il **colore**: castani, neri, biondi, rossi, grigi, bianchi; di fantasia 🪙10: blu, verdi, rosa, azzurri, viola (`COLORI_CAPELLI`) | castani |
| barba | nessuna, corta, folta, lunga, baffi, pizzetto (`BARBE`, per tutti e due) | nessuna |
| pelle | cinque toni, da chiara a scura (`PELLI`, uguali per tutti) | dorata |

### Gratis, a pagamento, di festa, di livello

Ogni pezzo è di **una sola** specie: **gratis** (quelli di serie e i colori base), **a pagamento** (`prezzo`, 🪙8–18, la fascia «una cosetta» come gli addobbi),
**di festa** (`stagione`: `natale`, `halloween`, si compra solo in quel periodo; comprato resta e si vede tutto l'anno) o **di livello** (`liv`, i «speciali»,
col lucchetto e «Livello N»). Un pezzo non è mai a pagamento *e* di livello (un test lo tiene). Nuovi: bandana, cilindro, berretto di Natale, cappello da strega;
tuta da lavoro, abito a fiori, camicia a fiori, maglione di Natale; pantaloni nero/viola/rosa; stivali bianchi/azzurri; sciarpa azzurra e di Natale; capelli blu, verdi,
rosa, azzurri, viola; di livello: corona (14), stivali argento (18), sciarpa dorata (16). Le scelte per categoria vanno da 3 a 14.

**Niente si compra con un tocco solo.** Un tocco su un pezzo **lo prova** sul ritratto (la *bozza*, `Guardaroba.vue`): se tutta la bozza è gratis o già tua
si indossa subito (come prima); se c'è un pezzo con 🪙 resta in prova, il mondo non cambia, e sotto compaiono **«🛒 Acquista e indossa 🪙N»** (somma dei
pezzi da pagare) e **«Annulla»**. Con poche monete il tasto è spento e la riga dice quante ne mancano. L'acquisto è tutto o niente (`motore.compraAbito`:
`poche-monete`, `fuori-stagione`, `bloccato`, `non-esiste`); la spesa conta come esperienza, niente monete indietro. I pezzi comprati stanno in
`stato.armadio` (`{ 'cappello:cilindro': true }`, `armadioInForma`, versione dello stato invariata) e si rimettono gratis; `sbloccato(pezzo, livello)` e
`vesti(...)` valgono ancora per il livello. Arrivano nel foglio dei livelli come «👕 … per il guardaroba» (`roba(l).abiti`, solo quelli di livello): **non contano**
per `vuoto()` né per le cose produttive, quindi nessuna soglia si sposta. Un id di pezzo non si rinomina né si toglie: è nell'armadio e nel salvataggio.

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

## L'interfaccia è quella comune

`viste/Guardaroba.vue` sta sopra l'interfaccia unica ([../core/personalizza.md](../core/personalizza.md)), tema `fattoria`, con la struttura
del mock approvato (`poc/personalizza/`). Le voci e i valori li fa `dati/guardaroba-voci.js` (puro):

- **Schede**: Chi sei (Contadina, Contadino: mai «sesso»), Aspetto (la pelle; i capelli, col taglio come forma e poi il colore; la barba),
  Cappelli (uno per voce), Vestiti (la maglia, la salopette o la gonna coi suoi colori, gli stivali coi loro colori, al collo un oggetto per
  forma: il fazzoletto in tre colori, la sciarpa nei suoi, «Niente al collo»), Set.
- **Prezzi**: un capo con 🪙 resta in prova sul ritratto finché non si preme «Acquista e indossa» (Gioco.vue, `motore.compraAbito`, tutto o
  niente); comprato sta nell'armadio. Un capo di livello si vede, si prova, ma non si prende («Dal livello N»).
- **Set**: sei posti per la contadina e sei per il contadino, in `cfg.vestiti` (`[{ posto, nome, persona, capi }]`, `vestitiInForma`).
- **Il ritratto si gira** a scatti di 45° (frecce o dito): `contadino:<chiave>:r<n>`, `modelloContadino` ruota il modello.

## Niente icone: le foto

Nessuna emoji al posto di un capo (le emoji di sistema cambiano da un telefono all'altro). Il ritratto e ogni gettone sono il contadino
**con quella scelta**, fotografato adesso dal renderer della scena (`scena3d/anteprime.js`, tipo `contadino:<chiave>`); il gettone lo
ingrandisce sulla zona del capo (la testa per cappelli, capelli, pelle e barba; il busto per la maglia; il collo; le gambe; i piedi:
`stile-guardaroba.css`). I nodi invisibili (falce, ascia, canna) si tolgono prima della foto: `Box3` li conta e allungherebbero l'inquadratura.
Il campo `emoji` dei pezzi resta nei dati ma non si mostra; `capo:<categoria>:<id>:<persona>` (`creaCapo`) resta per chi lo vuole.

**Gli abiti di prima**: i capelli erano taglio e colore insieme (`corti-rossi`, `trecce-bionde`…). `normalizzaAbito` e `armadioInForma` li leggono ancora
(`LEGACY_CAPELLI`): `corti-rossi` → taglio `corti` + colore `rossi`. Taglio e barba li disegna `applicaAspetto` (di `capelli3d.js`, non si tocca da qui: lo usa anche il
sotterraneo) sulla testa tonda del contadino (`R` 0,24, centro a 0,22); il «ciuffo» di prima era una calotta ad attaccatura altissima, ora il taglio copre la fronte.

## Come si aggiunge un pezzo

Una voce in `CAT[<categoria>]` di `dati/abiti.js` (`id`, `nome`, `emoji`, `c` il colore; `per` se è di uno solo; `liv` ≥ 2 se è speciale; `prezzo` 6–30 se si compra, con `stagione` se è di festa). Se è una
forma nuova (`forma` o `motivo`) un ramo in `costruisciContadino`. `guastiDegliAbiti()` controlla il resto (da 3 a 14 scelte per persona, prezzi nella fascia, la serie
sbloccata, niente id doppi). Un capo non si rinomina: l'id è nel salvataggio.

## Nei test

`test/unita/fattoria3d-guardaroba.test.mjs` (dati, genere, normalizzazione, sblocchi, nomi, modelli con 10 abiti, cache, armadio e acquisto, le voci
e i valori dell'interfaccia, i set) e `integrazione/fattoria3d` (il tocco sul contadino, chi si è, il giro del ritratto, un colore degli stivali, il cowboy
di livello, la prova e l'acquisto del cilindro col tasto del componente, un set salvato, la ✕). Bersagli: quelli del componente
([../core/personalizza.md](../core/personalizza.md)) più `[data-f3="guardaroba"]`, `[data-f3="guardaroba-ritratto"]`, `[data-scheda-abito="persona|aspetto|cappello|vestiti|set"]`,
`[data-capo="<categoria>:<id>"]` (anche `persona:<chi>`) e `[data-voce="pelle|capelli|barba|pantalone|stivali|collo:<forma>"]`; in [file.md](file.md).
