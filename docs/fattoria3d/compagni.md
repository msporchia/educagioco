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
| 1 | Watson | bobtail |
| 2 | Sherlock | gatto bianco e nero (tuxedo): il gatto vero di casa, come Watson |
| 3 | Irene | gattina calico (bianca, arancione e nera): l'altra gatta vera di casa |
| 13 | Pepe | gatto nero |

I tre animali veri di casa (Watson, Sherlock, Irene) arrivano per primi, perché i bambini ci tengono. I gatti sono in scala 1,15 (`SCALA_GATTO`, come `SCALA_CANE` per Watson) per riconoscersi dalla telecamera di serie. Al caricamento ci sono tutti quelli del livello, senza avviso. Salendo di livello il nuovo compare con uno sbuffo di
scintille e `ui.avviso` («Watson è arrivato!»). Il controllo è una volta al secondo (`Compagni.sync`).

## Com'è fatto il disegno

- **Il contadino** (`creaContadino`): testa grande su corpo piccolo, faccia con una trama canvas (occhi grandi, guance,
  sorriso), cappello di paglia col nastro, salopette con toppe, stivali, fazzoletto rosso al collo. `ASPETTO_ERO` in
  `dati/compagni.js` sceglie `'contadino'` o `'contadina'` (trecce, nastro rosa, ciglia, un fiore sul cappello); non c'è
  schermata di scelta. Ha gli **stessi perni** del vecchio (`gambe`, `busto`, `testa`, `bracci`, `falce`, `ascia`), quindi
  `eroe.js` e i gesti non sono cambiati (il vecchio a scatole, `creaEroe`, è stato tolto: aveva la testa staccata). In più
  respira da fermo e inclina la testa camminando (poche righe in `Eroe._posa`).
- **Watson** (`creaCane`): fatto sulla foto del cane vero. Testa grande, tonda e **bianca** con la **frangia** che ricade
  sugli occhi e ne copre la metà di sopra (sotto si vedono due occhietti neri lucidi: da davanti dice «è lui», dall'alto
  restano coperti come nella foto), **orecchie ardesia** larghe e penzolanti che schiariscono in punta, l'ardesia ai lati
  della testa, **naso nero grande**, bocca aperta con la **lingua** sempre un po' fuori. Petto, collo e zampe davanti
  bianchi; la **giacca grigio-azzurra** parte da dietro le spalle e copre fianchi, sedere (più alto delle spalle) e
  cosce; zampe corte e grosse, piedi bianchi, **niente coda** (un moncherino nel pelo). Il pelo sono **ciocche**: coni a
  cinque facce che ricadono, piantati su volumi morbidi e fusi in **un mesh per pezzo** coi colori nei vertici (radice
  scura, punta chiara); le macchie sono una regola sulla posizione, sfumata a ciocche. Pose: sta (ansima), siede,
  annusa, dorme sdraiato col mento sulle zampe, fa festa (scodinzola col sedere, lingua fuori), trotta (la frangia e le
  orecchie ballano). Il catalogo 3D ha una voce per posa (`npm run catalogo3d:scheda -- --gioco fattoria --q watson`).
- **I gatti** (`creaGatto(variante)`): di cartone morbido. Testa tonda e grande con le guance piene, orecchie triangolari grandi
  rosa dentro, occhi enormi con la fessura e il riflesso, nasino a triangolo e bocca a «w» (una **trama canvas trasparente** sul
  davanti della testa, una per mantello, più una a occhi chiusi che si accende solo mentre dorme), sei baffi in un mesh. Il pelo è
  liscio: palle e tubi fusi in un mesh per pezzo (corpo, testa, ogni zampa, ogni segmento di coda) col mantello nei vertici:
  Sherlock (variante `bianconero`, dalla foto) nero con la striscia bianca dalla fronte al muso, bavaglino bianco, davanti
  bianche dal gomito, dietro nere con la zampetta bianca; Irene (`calico`) bianca sotto e a chiazze grandi arancioni e nere sopra,
  una guancia più nera dell'altra, davanti con le righe arancioni, coda ad anelli; Pepe nero lucido col ciuffo bianco sul petto
  e occhi gialli. Sherlock da seduto sta composto (davanti ravvicinate, testa quasi ferma). Corpo ovale, zampe sottili con la zampetta tonda, coda
  lunga a tre pezzi. Seduto: petto in su, zampe davanti lunghe (`scale.y` 1,5) e coda a terra; dorme: ciambella con la testa
  sulle zampe e occhi chiusi. Trovato: la coda avvolta del tutto attorno al corpo non si ottiene con tre perni che piegano sullo
  stesso piano, resta un uncino. Gli orecchi grandi spingono l'altezza a ~75 cm in piedi e ~46 cm sdraiato (il test lo sa).
  Pose: sta, siede (coda attorno), si lava (zampa su), dorme a pagnotta, si stiracchia, fa le fusa, cammina basso.
- **Il costo**: Watson 17 mesh e ~6000 triangoli (il pelo; il test tiene il tetto a 8000), un gatto 15 mesh e ~5400 triangoli (lisci), il
  contadino ~38; geometrie e materiali condivisi, nessuna luce, nessuna texture oltre alla faccia. In più una sfera **invisibile** (`userData.colpo`) fa da bersaglio del dito: il gatto è piccolo.
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
  «Prrr…», cuoricini, fusa. Col foglio «Costruisci qui» aperto non si accarezzano (i fogli fermano il tocco sulla mappa).

## Nei test

`test/unita/fattoria3d-compagni.test.mjs` (con un canvas finto): dati e livelli, la meta mai su una cella bloccata, le
decisioni con un `rnd` finto, ingombro e mesh dei modelli, pose senza numeri sbagliati, e tre minuti di scena col motore
vero (nessun compagno su una cella bloccata, l'arrivo con l'avviso, il tocco, il raggio). Non c'è un bersaglio `[data-…]`:
i compagni sono nella tela.

## Da sapere

- Watson e le sue pose si sono guardati nel catalogo 3D, **non ancora col dito**: in gioco va giudicato per primo e
  severamente (`#fattoria3d`, serve un livello 1: `window.__fattoria3d.motore.s.esperienza = …`).
- La posizione non si salva; i nomi sono dei dati. Un compagno in più è una voce di `COMPAGNI` col suo `liv` (uno per livello).
- **Misura di Watson**: in scena è al 80% (`SCALA_CANE` in `modelli-compagni.js`): il bobtail è grande, ma accanto al contadino doveva sembrare più piccolo.
