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

- **Il contadino** (`creaContadino(abito)`): testa grande su corpo piccolo, faccia con una trama canvas (occhi grandi, guance, sorriso), cappello,
  maglia, salopette (o gonna), stivali, fazzoletto. È **vestibile**: l'abito (cappello, maglia, pantalone, stivali, collo, capelli, pelle) lo sceglie il
  bambino nel guardaroba e se è contadino o contadina lo dice il profilo, come nella fattoria di sempre → [guardaroba.md](guardaroba.md). Di serie: lui
  col cappello di paglia e la camicia a quadri, lei con le trecce, il nastro rosa e un fiore sul cappello. Ha **sempre gli stessi perni** (`gambe`,
  `busto`, `testa`, `bracci`, `falce`, `ascia`), quindi `eroe.js` e i gesti non cambiano con l'abito (il vecchio a scatole, `creaEroe`, è stato tolto: aveva
  la testa staccata). In più respira da fermo e inclina la testa camminando (poche righe in `Eroe._posa`).
- **Watson** (`creaCane`): fatto sulla foto del cane vero. Testa grande, tonda e **bianca** con la **frangia** che ricade
  sugli occhi e ne copre la metà di sopra (sotto si vedono due occhietti neri lucidi: da davanti dice «è lui», dall'alto
  restano coperti come nella foto), **orecchie ardesia** larghe e penzolanti che schiariscono in punta, l'ardesia ai lati
  della testa, **naso nero grande**, bocca aperta con la **lingua** sempre un po' fuori. Petto, collo e zampe davanti
  bianchi; la **giacca grigio-azzurra** parte da dietro le spalle e copre fianchi, sedere (più alto delle spalle) e
  cosce; zampe corte e grosse, piedi bianchi, **niente coda** (un moncherino nel pelo). Il pelo sono **ciocche**: coni a
  cinque facce che ricadono, piantati su volumi morbidi e fusi in **un mesh per pezzo** coi colori nei vertici (radice
  scura, punta chiara); le macchie sono una regola sulla posizione, sfumata a ciocche. Pose: sta (ansima), siede,
  annusa, dorme sdraiato col mento sulle zampe, fa festa (scodinzola col sedere, lingua fuori), trotta (la frangia e le
  orecchie ballano), e le pose di «Quando ci premi» (alza la testa, zampa, rotola, salta, riporta, starnuta, gira, mano, sbadiglia, incontra: sotto).
  In più un **bastoncino** (un mesh, ~20 triangoli, nascosto: lo mostra solo `riporta`). Il catalogo 3D ha una voce per posa (`npm run catalogo3d:scheda -- --gioco fattoria --q watson`).
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
  Pose: sta, siede (coda attorno), si lava (zampa su), dorme a pagnotta, si stiracchia, fa le fusa (gli occhi si socchiudono piano), cammina basso,
  e struscia, rotola, miao, volta, incontra (con `sub`).
- **Il costo**: Watson 17 mesh e ~6000 triangoli (il pelo; il test tiene il tetto a 8000), un gatto 15 mesh e ~5400 triangoli (lisci), il
  contadino ~38 mesh dopo la fusione (di più con certi capi, il test tiene il tetto); geometrie e materiali condivisi, nessuna luce, nessuna texture oltre alla faccia. In più una sfera **invisibile** (`userData.colpo`) fa da bersaglio del dito: il gatto è piccolo.
- Le pose (`posaCane`, `posaGatto`) sono funzioni senza memoria: stato, velocità, fase del passo e tempo; si provano in node.

## Come si muovono

Camminano sulla **stessa griglia del contadino**: `percorsoVerso` per la strada, `libera` per le celle (terreno non tuo, pezzi,
edifici, alberi e sassi bloccano). A tempo (`dt`), mai a fotogrammi. Se una cella del percorso viene occupata mentre ci si
cammina, si ripensa; se un pezzo viene messo proprio sotto i piedi, ci si sposta nella cella libera più vicina.
Le scelte sono pure (`decidiCane`, `decidiGatto`, `scegliMeta`, tutte col `rnd` da fuori) e sono in `dati/compagni.js`.

- **Watson** segue il contadino a distanza (corre se è lontano), si siede quando lavora, ogni tanto va ad annusare un
  campo (si ferma a due celle e lo guarda), si ferma a guardarsi in giro, e dorme se il contadino sta fermo da un quarto d'ora.
- **I gatti** girano per conto loro, si lavano, si stiracchiano e **dormono sulla panchina** se ce n'è una (salgono con un
  salto, scendono da soli; se la panchina sparisce scendono subito). Con Watson **si salutano** (sotto). Non salgono
  sulla bancarella: ha la merce sul bancone.

## Quando ci premi

`Mondo3d.tocca` chiede prima a `compagni.bersaglio(raggio)`; poi `Compagni.tocca(c)`. Col foglio «Costruisci qui» aperto non si
accarezzano. Ogni risposta è una **sequenza di passi a tempo** (`{ stato, dur, sub?, guarda?, ev? }` o `{ va }`, tutte pure in
`dati/compagni.js` col `rnd` da fuori) che `Compagni` esegue: gli eventi `ev` fanno i versi (`fx.volo`) e i cuoricini. Un tocco su chi è
già in sequenza **non la riavvia** (tranne Watson che dorme: si sveglia con uno sbadiglio). Se **il contadino comincia a muoversi o a
lavorare** durante una sequenza (non per il gesto «chiama»), la sequenza si ferma e il compagno torna a seguire/sedersi. Se il contadino
non sta fermo già al tocco, resta il vecchio «Bau!»/«Prrr…» sul posto (e da lontano, «Watson!» e Watson torna a seguire).

- **Il richiamo**: oltre 2,5 celle (`SOGLIA_RICHIAMO`: appena non è accanto) il contadino si gira verso Watson, dice «Watson!» (`fx.parla`, gesto `chiama` in `eroe.js`:
  braccio alzato e mano alla bocca, 0,9 s), Watson alza la testa 0,4 s, **corre** (la corsa di sempre) fino a 1–1,9 celle dal contadino
  (`scegliMetaAttorno`) e fa la festa. Funziona anche con la camera staccata: conta la distanza in celle, non lo schermo.
- **La festa di Watson** (`sequenzaCane`, 2–4 s): si apre sempre con la base (scodinzola col sedere e «Bau!»), poi **una** di otto,
  mai la stessa due volte di fila (`scegliInterazioneCane(ultima)`, l'ultima sta in `Compagni.ultimaCane`): **festa** (solo la base, più lunga),
  **zampa** (seduto, tende la zampa), **rotola** (pancia in su, zampe all'aria, cuoricini a raffica, «Hrrr»), **salta** (saltelli, «Bau! Bau!»),
  **riporta** (bastoncino in bocca, lo posa ai piedi del contadino, resta 2 s e sparisce), **starnuta** («Ciù!», scuote testa e orecchie),
  **gira** (rincorre il moncherino due giri, poi stordito che ride), **sbadiglia** (annusa la mano, poi bocca spalancata e occhi chiusi, «Hrrr»).
- **Le carezze**: `carezzaCane` conta i tocchi ravvicinati (entro 10 s l'uno dall'altro, in memoria, non salvato): alla **sesta** Watson si
  siede e **si addormenta contento** («Zzz…»); toccato che dorme si sveglia con uno sbadiglio.
- **I gatti chiamati per nome**: come per Watson, se il contadino è **fermo** e il gatto è **oltre 2,5 celle** (`chiamaIlGatto`, stessa `SOGLIA_RICHIAMO`) il contadino si gira,
  dice «Sherlock!», «Irene!» o «Pepe!» (il nome in `COMPAGNI`; gesto `chiama`, 0,9 s) e **poi** il gatto risponde (`sequenzaGattoChiamato`): alza la testa e lo guarda
  0,4–0,8 s (le orecchie verso di lui), poi fa la risposta della sua indole, qui sotto. **La chiamata non li obbliga**: Sherlock quasi sempre viene, Irene viene e fa la buffa,
  Pepe spesso si volta e resta dov'è. Chi viene **cammina** (mai la corsa di Watson) fino a ~1 cella. Un gatto già a ≤ 2,5 celle non è chiamato: risponde subito;
  se il contadino non sta fermo, il vecchio «Prrr…» sul posto. Le mete degli animali evitano anche dove gli altri **stanno andando** (`_altri`): due gatti chiamati insieme non arrivano nella stessa cella.
- **I gatti** (`scegliRispostaGatto`, indole per mantello in `INDOLE_GATTO`; [si avvicina, fusa dov'è, si volta, cosa buffa]):
  media ~55/20/15/10. **Sherlock** 60/20/12/8 (si avvicina a 1,5 celle e si **siede composto**, senza strusciarsi), **Irene** 55/15/10/20
  (si struscia e metà volte si rotola; la cosa buffa è sua), **Pepe** 40/20/30/10 (schivo: spesso si volta). *Si avvicina*: cammina (non corre)
  a ~1 cella e **si struscia** (coda dritta con la punta ripiegata, «Prrr…», cuori, ~3 s) poi va per conto suo; *fusa*: si siede lì, gira
  la testa e socchiude gli occhi; *si volta*: si stiracchia («Mrr»), siede di schiena con la coda che scatta; *buffa*: «Miao!» o si rotola.
  Un gatto che dorme sulla panchina si sveglia stiracchiandosi e **resta** lì (poi scende da sé).
- **L'incontro gatto-cane** (`incontroGattoCane`): sono amici. Un gatto a ≤ 2,5 celle da Watson libero (non in sequenza, non addormentato) tira
  il dado: 35% a ogni avvicinamento, poi **25–40 s di riposo per gatto** (5 s se il dado dice no). Esito: ~90% un **saluto** (il cane resta fermo,
  il gatto gli va incontro e fanno **naso a naso**; poi *struscia* contro la zampa e il cane scodinzola, o *zampata* leggera e il gatto se ne va
  a coda alta mentre il cane scodinzola, o il cane *lecca* e il gatto infastidito si lava); ~10% la **fuga**, giocosa: scatta a pochi passi e si ferma a guardare.
  Il carattere dei gatti non cambia (girano da soli, si lavano, dormono sulla panchina): l'incontro è un'eccezione, non un'abitudine.

## Nei test

`test/unita/fattoria3d-compagni.test.mjs` (con un canvas finto): dati e livelli, la meta mai su una cella bloccata, le
decisioni con un `rnd` finto, ingombro e mesh dei modelli, pose (anche quelle nuove) senza numeri sbagliati, tre minuti di scena col motore
vero (nessun compagno su una cella bloccata, l'arrivo con l'avviso, il tocco, il raggio), le scelte di «Quando ci premi» (percentuali su un
campione grande, mai due feste uguali, cooldown dell'incontro) e cinque minuti di tocchi su Watson lontano/vicino e sui gatti (richiamo a ≤ 2 celle, il gatto lontano chiamato per nome e quello vicino no, carezze,
nessuna sequenza che non finisce, nessuno su una cella bloccata). `unita/fattoria3d-compagni` controlla anche la chiamata (solo fermi e oltre la soglia, i nomi, l'attesa 0,4–0,8 s, le indoli ancora diverse). `integrazione/fattoria3d`: toccare Watson lontano fa dire «Watson!» e lo porta vicino. Non c'è un bersaglio `[data-…]`:
i compagni sono nella tela.

## Da sapere

- Watson e le sue pose si sono guardati nel catalogo 3D, **non ancora col dito**: in gioco va giudicato per primo e
  severamente (`#fattoria3d`, serve un livello 1: `window.__fattoria3d.motore.s.esperienza = …`).
- La posizione non si salva; i nomi sono dei dati. Un compagno in più è una voce di `COMPAGNI` col suo `liv` (uno per livello).
- **Misura di Watson**: in scena è al 80% (`SCALA_CANE` in `modelli-compagni.js`): il bobtail è grande, ma accanto al contadino doveva sembrare più piccolo.
