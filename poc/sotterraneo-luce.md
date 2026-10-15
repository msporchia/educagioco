# Il sotterraneo con la luce (three.js)

Un altro **renderer** del sotterraneo vero: la discesa, i mostri, lo scontro a turni, le domande e
la barra in basso sono quelli di `src/`, usati come sono; il prototipo li disegna con la GPU
(WebGL, three.js) invece che col Canvas 2D, e racconta il turno con luci, scintille e scosse.

## Come si apre

- Dev: `npx vite --port 5191 --strictPort`, poi `/poc/sotterraneo-luce.html`.
- File unico per il telefono: `POC=sotterraneo-luce FUORI=/tmp/ast npx vite build -c strumenti/poc-file-unico.config.js`
  → `/tmp/ast/sotterraneo-luce.html`, 6,7 MB (3,9 MB gzip), si apre col doppio click, nessuna
  richiesta fuori. Il config ha ora anche `@vitejs/plugin-vue`: monta componenti veri.
- Le scelte di prova stanno nell'indirizzo, per chi sviluppa (il pannello dell'ingranaggio c'era ed è stato tolto:
  così com'è va bene): `?tappa=0..6 ?eroe=cavaliere|elfa|mago|nano ?seme= ?vetrina=1 ?fontana=vuota ?celle=
  ?inc= ?fov= ?bloom=1 ?pr=`. Di difetto: la prima discesa, il cavaliere.
- Il dito, come in un punta-e-clicca: si tocca una cosa (mostro, porta, forziere, fonte, scala, portale, botte) e l'eroe
  ci va per la strada vera e, arrivato, la usa; un tocco oltre una porta chiusa porta alla porta e prova ad aprirla.
  Il bersaglio è generoso: prima le forme 3D colpite dal raggio, poi la cosa più vicina entro 44 px; una cosa non
  raggiungibile si avvicina alla cella più vicina e si riprova; un altro tocco annulla. Un anello sulla cosa presa e
  uno piccolo sul punto d'arrivo. Usarla è il motore (`vaiVerso`, `interagisci`). Il mouse senza tasto non fa niente.
- **Solo nel prototipo**: forzieri e curiosità (libri, leggii, sfere) si aprono senza domanda (Sopra.vue risponde
  per il bambino, una risposta «saltata»; `src/` non è toccato); le porte, le fonti e gli scontri chiedono ancora.
  **Le botti** (`botti.js`): a gruppi contro i muri delle stanze, mai su porte o corridoi; toccate si rompono in doghe e
  cerchi, e una su tre circa lascia una moneta o una pozioncina che rimbalza, luccica e si prende camminandoci sopra
  (un contatore in alto a sinistra). Bottino di prova: il motore non ne sa niente e la roba vera non cambia; il
  motore non sa nemmeno che le botti ci sono, e l'eroe può passarci attraverso.
- Dalla console: `__sotterraneo` (`corsa`, `ponte`, `viste`, `fontana`, `vetrina`, `aSchermo`).

## Il gioco vero dentro

Importati da `src/` e usati così come sono, senza copiarli né toccarli:

- il motore: `Corsa` (`motore/corsa.js`, con `scontro.js`, `turni.js`, `pericolo.js`…), costruita
  come fa il banco: `CAMPAGNA[k]`, `robaAttesa`, `crescitaAttesa` (`vero.js`). La pianta, i
  mostri, la luce (`forzaLuce`, `visto`: la maschera del 3D), il cammino, gli inseguimenti, i fogli;
- la vista dello scontro: `viste/racconto.js` (il turno un'azione alla volta, `fx`), `viste/campo.js`
  (`vistaDelloScontro`), e i componenti `CaselleAbilita`, `FilaDeiTurni`, `BarraDiSotto`,
  `Medaglione` montati in una sovrimpressione Vue (`Sopra.vue`), con gli stili veri;
- le domande: `quiz/scelta.js` (`domandaPerGioco`, la difficoltà dalla `chiesta` del motore) e
  `quiz/Domanda.vue` (il perché e il come si fa, «troppo di fretta», il ripasso). Il profilo è
  quello vuoto in memoria di `store/profile.js` (senza giocatore `persist()` non scrive niente):
  **nessuno stub**, nessuna regola riscritta.

**Il portale** (`portale3d.js`): prima non si vedeva perché il renderer non sceglieva una figura per la roba `portale`
(nel gioco è dipinto in codice, l'atlante non l'ha). Ora è un ovale di pietra con il velo che gira nei colori del
portale vero, la sua luce, le scintille che ci entrano; toccato, il motore apre il suo foglio e «Attraversa» fa il
passaggio (lampo, l'eroe che ci si stringe dentro e torna: il villaggio di sopra qui non c'è).

Copiata da `Gioco.vue` solo la colla (`Sopra.vue`): chiedere la domanda, `rispondi`, il racconto,
la scelta in due fasi, bere, scappare, i fogli che si leggono. Il 3D legge lo stesso `fx` della vista
vera: `effetto` (scatta, colpito, colpito-forte, vuoto, cura, protegge; l'eroe scatta in tre tempi, carica, affondo
che arriva all'`arrivo` dell'effetto e ritorno, e la torcia prende il colore del colpo; il mostro scatta coi tempi
del racconto; scudi e cure fanno una bolla), `scene` (i proiettili e gli
scoppi nel colore dell'elemento, `tintaDelColpo`), `numeri` (che salgono sopra le figure), `morti`,
`scuote`. Il palco: i combattenti messi sul pavimento vero (sotto). Il prezzo: `store/profile.js`
tira dentro mezza applicazione (tutti i giochi e i loro dati): da 1,9 a 6,7 MB. Nel gioco vero c'è già.

## Cosa c'è

- **Muri e colonne veri** (parallelepipedi e cilindri) con normal map e rugosità; le **figure
  dell'atlante in piedi**, piegate verso la telecamera, con una normal map finta ricavata dalla
  sagoma (un cuscino smussato ai bordi) che le fa prendere la luce di lato.
- **La torcia dell'eroe**: un alone corto con ombre tutt'attorno (luce puntiforme, sei passate) e
  un cono lungo davanti (faretto, una passata), come la regola del gioco
  ([docs/sotterraneo/luce.md](../docs/sotterraneo/luce.md)). Le colonne e i muri proiettano ombre.
- **Torce a muro e bracieri** che tremano: le cinque più vicine prendono le cinque luci di una
  riserva fissa (il numero di luci non cambia mai, se no three ricompila gli shader).
- **Visto, ricordato, mai visto**: una texture di una cella per texel, scritta dalla luce del
  motore, che spegne quello che non si vede e lascia il ricordo freddo e scuro; i mostri fuori
  luce spariscono (la regola del gioco). **Tutto quello che si muove o fa luce la rispetta**:
  fiamme, scintille, luci delle torce, acqua, getto, gocce e luce della fontana vivono solo dove si
  vede adesso; nel ricordo resta la forma ferma e spenta, nel mai visto niente. Le particelle fuori
  vista non si emettono né si aggiornano, e le luci delle torce si danno solo a quelle che si vedono.
- **Nebbia** a fette sommate e **polvere** in sospensione, illuminate a mano dalle stesse luci;
  **scintille** dalle torce e dai colpi.
- **Il colpo**: scoppio di scintille, lampo di luce, mostro bianco, spinta, scossa della
  telecamera, aberrazione cromatica e fermo-immagine (0,09 s, 0,2 s se muore).
- **Post**: correzione colore (ombre fredde, luci calde), vignetta leggera, grana; il bagliore
  c’è ma spento: all’utente non piace.
- **Il pixel ratio si adatta** (sotto i 45 fps scende fino a 0,5, sopra i 58 risale fino a 1,5);
  in alto a sinistra fps, pixel ratio, draw call, triangoli.

## I corridoi: parapetti e buco

Un muro che ha il pavimento a nord sta fra la telecamera e una stanza o un corridoio: è un
**parapetto basso** (0,32 invece di 1,25), con la cima di pietra chiara. Così l'eroe si vede sempre,
anche in un corridoio orizzontale largo una cella, da lontano e su un telefono in verticale; i
muri a nord (quelli che si guardano di fronte, con le torce) restano alti. Quel che resta di alto
e gli copre i piedi (colonne, spigoli) si sfalda in un cerchio retinato attorno a lui (`buco` in
`conMaschera`: solo i pezzi a sud del suo piede; le ombre non cambiano). Provato prima solo il
buco: l'eroe si vedeva, ma il corridoio restava una striscia nera con un foro.

## Lo scontro: il motore vero, il palco in 3D

Le regole sono quelle del gioco ([docs/sotterraneo/scontro.md](../docs/sotterraneo/scontro.md)):
chi entra, l'agguato e la sorpresa, la fila dei turni, la scelta (attacco, abilità con l'energia,
bere, scappare), una domanda per colpo, i mostri nel loro turno, la vita, lo stop del pericolo, la
fine con l'esperienza. Il 3D mette in scena: l'eroe a sinistra e i mostri a colonne a destra sul
pavimento vero, con **almeno 1,2 celle d'agio** da muri, colonne e cose posate (quattro formazioni
provate, il centro spostato fino a quattro celle verso lo spazio libero, mai di là da un muro); dove
non basta i muri alti alle spalle si abbassano a parapetto. Le figure stanno ritte (`ALLUNGA` 1,3):
piegate all'indietro la testa entrava nel muro. La telecamera si avvicina (`celleScontro` 9,5) e la
scena si alza sopra il pannello; la zona del palco si accende anche oltre la luce dell'eroe del
motore (luce di scena: il motore non sa dove il disegno mette i combattenti).

## La fontana: un oggetto di scena modellato

`fontana.js`. Vasca, piede, colonnina e coppa sono forme di rotazione (`LatheGeometry`) con la
trama e la normal map del pavimento; fanno ombra vera e prendono la torcia. L'acqua: dischi e un
velo cilindrico che cade, con uno shader (increspature dai punti dove cadono le gocce, onda lenta
nel rumore, riflessi delle luci vicine, trasparenza); le gocce un `Points` suo, simulato sulla
CPU; una luce azzurra tenue che segue il livello. Nel piano vero è la fonte: toccandola il motore apre
il suo foglio con la domanda; bevuta (`morto`), un filo di gocce sale verso l'eroe e la fontana si svuota (il getto si spegne in 0,8 s,
il livello cala in 2,6 s, restano il fondo bagnato più scuro e lucido e tre pozze). Non torna più.

Lo schema, uguale per ogni cosa di scena (altare, statua, pozzo): un **descrittore** con `cella`,
`stato` (`'piena' | 'vuota'`), `luce` (colore e forza, che seguono lo stato), `ombra`, `usa(chi)`
(il gesto del bambino: torna `false` se non si può), `svuota(subito)` (il passaggio di stato,
animato o istantaneo: `subito` è quello che userebbe il gioco caricando un salvataggio) e
`aggiorna(dt, t)`. Il gioco terrebbe solo `stato` nel piano; tutto il resto è disegno. Un altare
che si accende o un pozzo da cui si tira su un secchio sarebbero lo stesso file con altri torni
e un'altra animazione fra i due stati. La cella è `OGGETTO` in `mappa.js`: non si attraversa,
ma la vista ci passa sopra.

## Cosa costa

- Peso: three ~600 KB nel file unico, più l'atlante che il gioco ha già (e, per il prototipo,
  mezza applicazione che `store/profile.js` tira dentro). Le trame si generano
  all'avvio (~0,3 s), non pesano niente.
- GPU per fotogramma: 1 + 6 + 1 passate (scena, cubo d'ombra dell'alone, ombra del cono), ~185
  draw call, 31k triangoli, nebbia a 5 fette a schermo pieno. Su un telefono di fascia media è
  il limite: le draw call sono il primo taglio (una figura = un materiale ora; con un materiale
  solo e un `InstancedMesh` per famiglia scenderebbero a ~20), poi l'ombra a cubo (la si può
  spegnere e tenere solo quella del cono).
- Nel Chrome senza GPU delle prove gira a 20 fps col pixel ratio a 0,8: è rendering software,
  non dice niente del telefono.

## Cosa ha funzionato

- Le ombre delle colonne e il cono che gira con l'eroe: è la cosa che il 2D non sa fare, e si vede.
- Le figure piatte nel mondo 3D (l'utente: «il 3D degli sprite mi piace molto»), con la sagoma
  smussata e un contorno caldo (rim) che le stacca dal fondo.
- La vista da lontano col ricordo freddo: si legge come una mappa, la stanza accesa è calda.

## Cosa no, o non ancora

- **Troppo tetro** al primo giro: servono luce d'ambiente forte dentro la vista (emisferica 2,6),
  ombre mai nere (`shadow.intensity` 0,7), esposizione 1,4, vignetta 0,3 e una luminosità minima
  delle figure (32% del loro colore). I numeri stanno in cima a `sotterraneo-luce/main.js`.
- **La telecamera**: provati 55° da 17 celle (piantina), 43° da 12 (troppo addosso); ora 52°
  e almeno 15 celle in largo e in profondo, la distanza si calcola dalla forma dello schermo.
  Da un telefono in verticale le figure vengono piccole (~25 px per cella).
- Lo scontro sul campo vero dipende dal pavimento: in un corridoio largo una cella la
  formazione diventa verticale (eroe davanti, mostri dietro), che si legge peggio del palco.
- La luce del motore è corta (il cono del gioco, ~3 celle senza torcia): da 15 celle il piano è
  quasi tutto buio attorno all'eroe. È la regola del gioco, non del renderer.
- La porta, il forziere, le scale sono figure dell'atlante scelte a mano per scenario (`vero.js`):
  il gioco vero le sceglie in `scena/tela.js`, che qui non si usa.
- Nel browser integrato delle prove il disegno va avanti solo agli scatti: il turno raccontato
  (setTimeout) corre senza fotogrammi. Gli scatti del turno sono fatti con Chrome headless.
- Le pozze della fontana vuota e le increspature si leggono poco dalla vista lontana: la
  fontana è un oggetto da vicino; da 15 celle è un cerchio chiaro.
- Le fiamme disegnate col rumore reggono da lontano, da vicino sembrano coni piatti.
- Le figure fanno ombra da cartello: sottile quando la luce arriva di lato.
- Senza bloom le fiamme sono macchie chiare; il bloom le fa vere ma bagna tutto.

## Se lo si portasse nel gioco

La `Tela` del sotterraneo andrebbe sostituita intera (geometria dei muri, luce, maschera), il
motore no: la luce del gioco diventa la maschera, le cose in scena restano una lista. Stima:
due settimane per l'equivalente di quello che il 2D fa oggi (tutti gli scenari, porte, relitti,
acqua, mappina, foglio aperto), più il lavoro sulle draw call per i telefoni; il file unico cresce
di ~600 KB. Lo scontro con le domande è un giorno (il motore c'è già, cambia il palco); ogni cosa
di scena modellata come la fontana mezzo giorno o un giorno.
