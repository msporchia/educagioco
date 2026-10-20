# I compagni: Watson, i gatti e il contadino

Chi vive sulla fattoria senza lavorarci: il bobtail **Watson** e tre gatti camminano per il terreno, e il contadino ha un
aspetto nuovo. Sono **vita sulla scena, non regole**: non costano esperienza, non producono, non entrano nello stato
salvato (`VERSIONE_STATO` non si tocca) e a ogni apertura ripartono davanti alla casa. Codice: `dati/compagni.js` (dati e
scelte pure), `scena3d/modelli-compagni.js` (i corpi e le pose), `scena3d/compagni.js` (il comportamento).

## Quando arrivano

Come tutto il resto, col livello: `liv` su ogni compagno, e `roba(liv).compagni` li raccoglie (il foglio dei livelli li
mostra con 🐕/🐈). Non contano per `vuoto()` né per le «cose produttive» di un livello, quindi non spostano nessuna soglia.

| livello | chi | mantello |
|--:|---|---|
| 3 | Watson | bobtail |
| 5 | Briciola | gatto bianco e nero |
| 9 | Zenzero | gatto rosso |
| 13 | Pepe | gatto nero |

Al caricamento ci sono tutti quelli del livello, senza avviso. Salendo di livello il nuovo compare con uno sbuffo di
scintille e `ui.avviso` («Watson è arrivato!»). Il controllo è una volta al secondo (`Compagni.sync`).

## Com'è fatto il disegno

- **Il contadino** (`creaContadino`): testa grande su corpo piccolo, faccia con una trama canvas (occhi grandi, guance,
  sorriso), cappello di paglia col nastro, salopette con toppe, stivali, fazzoletto rosso al collo. `ASPETTO_ERO` in
  `dati/compagni.js` sceglie `'contadino'` o `'contadina'` (trecce, nastro rosa, ciglia, un fiore sul cappello); non c'è
  schermata di scelta. Ha gli **stessi perni** del vecchio (`gambe`, `busto`, `testa`, `bracci`, `falce`, `ascia`), quindi
  `eroe.js` e i gesti non sono cambiati; `creaEroe` di `modelli.js` resta come ripiego se la trama non parte. In più
  respira da fermo e inclina la testa camminando (poche righe in `Eroe._posa`).
- **Watson** (`creaCane`): pelo grigio e bianco arruffato (icosaedri a facce piatte e ciuffi a cono), macchia scura sulla
  testa, orecchie penzolanti, **il ciuffo bianco copre gli occhi** (se ne vedono solo due puntini sotto), naso nero,
  **nessuna coda: un moncherino**. Cane grosso e goffo: il trotto dondola il sedere. Pose: sta, siede, annusa, dorme
  raggomitolato, fa festa (scodinzola col sedere, lingua fuori), trotta.
- **I gatti** (`creaGatto(variante)`): corpo lungo, orecchie a punta, coda in tre pezzi che ondeggia, occhi con la fessura.
  Pose: sta, siede (coda attorno), si lava (zampa su), dorme a pagnotta, si stiracchia, fa le fusa, cammina basso.
- **Il costo**: Watson ~35 mesh, un gatto ~32, il contadino ~38; geometrie e materiali condivisi, nessuna luce, nessuna
  texture oltre alla faccia. In più una sfera **invisibile** (`userData.colpo`) fa da bersaglio del dito: il gatto è piccolo.
- Le pose (`posaCane`, `posaGatto`) sono funzioni senza memoria: stato, velocità, fase del passo e tempo; si provano in node.

## Come si muovono

Camminano sulla **stessa griglia dell'eroe**: `percorsoVerso` per la strada, `libera` per le celle (terreno non tuo, pezzi,
edifici, alberi e sassi bloccano). A tempo (`dt`), mai a fotogrammi. Se una cella del percorso viene occupata mentre ci si
cammina, si ripensa; se un pezzo viene messo proprio sotto i piedi, ci si sposta nella cella libera più vicina.
Le scelte sono pure (`decidiCane`, `decidiGatto`, `scegliMeta`, tutte col `rnd` da fuori) e sono in `dati/compagni.js`.

- **Watson** segue il contadino a distanza (corre se è lontano), si siede quando lavora, ogni tanto va ad annusare un
  campo (si ferma a due celle e lo guarda), si ferma a guardarsi in giro, e dorme se l'eroe sta fermo da un quarto d'ora.
- **I gatti** girano per conto loro, si lavano, si stiracchiano e **dormono sulla panchina** se ce n'è una (salgono con un
  salto, scendono da soli; se la panchina sparisce scendono subito). **Scappano dal cane** se gli si avvicina. Non salgono
  sulla bancarella: ha la merce sul bancone.
- **Toccarli**: `Mondo3d.tocca` chiede prima a `compagni.bersaglio(raggio)`. Watson: «Bau!», cuoricini, fa festa. Il gatto:
  «Prrr…», cuoricini, fusa. In costruzione non si accarezzano (il tocco chiude il vassoio come sempre).

## Nei test

`test/unita/fattoria3d-compagni.test.mjs` (con un canvas finto): dati e livelli, la meta mai su una cella bloccata, le
decisioni con un `rnd` finto, ingombro e mesh dei modelli, pose senza numeri sbagliati, e tre minuti di scena col motore
vero (nessun compagno su una cella bloccata, l'arrivo con l'avviso, il tocco, il raggio). Non c'è un bersaglio `[data-…]`:
i compagni sono nella tela.

## Da sapere

- Provato solo in node, **mai visto a schermo**: proporzioni, verso della faccia e pose vanno guardati col dito
  (`#fattoria3d`, serve un livello 3 o 5: `window.__fattoria3d.motore.s.esperienza = …`). Watson va giudicato per primo e
  severamente: pelo grigio-bianco arruffato, coda assente, occhi sotto il pelo
  (come lo racconta la fattoria 2D: `docs/fattoria/animali.md`).
- La posizione non si salva; i nomi sono dei dati. Un compagno in più è una voce di `COMPAGNI` col suo `liv` (uno per livello).
