# La scena 3D della fattoria

Come è fatto il disegno in `src/giochi/fattoria3d/scena3d/`: un modulo per cosa, e nessuno sa le regole (sono del
motore). three.js è l'eccezione alle «niente dipendenze oltre Vue» ([../../CLAUDE.md](../../CLAUDE.md)), accettata come per
gli Asteroidi 3D e il Sotterraneo 3D: il 3D non si scrive a mano.

## I moduli

| file | cosa tiene |
|---|---|
| `mondo3d.js` | **compone** tutto e fa il battito: renderer, luci, il tocco (`tocca`, `bersaglioSotto`), la coda di semina/raccolta, le opzioni (`applica`), le statistiche. L'unico che usa il renderer |
| `terreno.js` | erba, strade, griglia, lotti non comprati, recinto, alberi, sassi, laghetti, i due edifici di scena: a istanze, per una finestra di 9×9 lotti attorno alla camera ([mondo-infinito.md](mondo-infinito.md)) |
| `pezzi.js` | un gruppo per ogni cosa del motore, edifici compresi (sono pezzi liberi, non ci sono fantasmi: [edifici-liberi.md](edifici-liberi.md)); li tiene allineati (`sincronizza`) e li anima (grano che cresce, pecore, galline e mucche, fontana, fumo, il pallone che parte e torna: [mongolfiera.md](mongolfiera.md)); i cartelli sugli edifici: «🎈 N casse pronte!» o «🎈 in viaggio · m:ss» sulla mongolfiera, prezzo o «🔒 Livello N» sul fantasma, pronti o cottura su ogni macchina, uova o latte pronti sul pollaio e sulla stalla, e su recinto, pollaio e stalla il cartello col pulsante «＋ 🪙 N» che compra una bestia (niente conto «n/max»; «ha fame» se c'è una bestia o una pecora tosata da nutrire) ([animali.md](animali.md)); le bestie hanno tre stadi (fame, al lavoro, pronta) che si leggono a colpo d'occhio, con una transizione morbida (`muoviBestie`, `muoviPecore`, profilo in `bestie-puro.js`: «I tre stadi»); il cartello si nasconde col pezzo sollevato |
| `eroe.js` | il movimento (a piedi, o di corsa), il percorso, la posa del gesto (semina, falcia, abbatte, pesca, ritira, esulta; `pescando`: la canna resta alzata finché sta fermo) |
| `azioni.js` | cosa fa il contadino davanti a ogni cosa: anima il gesto e **a metà gesto chiede al motore di farlo davvero**; un edificio in mappa è una cosa e apre il menu della sua macchina (comprarlo e piazzarlo è del menu «Costruisci qui») |
| `detti.js` | `dettoDi` / `dettoDiRifiuto`: un rifiuto del motore in una riga che dice cosa fare. Senza three: lo usa anche `Gioco.vue` |
| `costruzione.js` | cosa fa una carta del menu sulla cella premuta (`daMenu`), il fantasma (anche «parcheggiato», che aspetta un posto), riprendere e spostare un pezzo, le strade a pennello; al rilascio compra e mette in un gesto |
| `dito.js` | i pointer sulla tela: tocco, mappa che scorre, pizzico, tenere premuto (su un pezzo lo riprende, su un posto libero apre «Costruisci qui»), il fantasma parcheggiato, il pennello delle strade |
| `camera.js` | la telecamera: segue il contadino, o libera se un dito la sposta (`trascina`) o se un pezzo tenuto contro il bordo la fa scorrere (`scorri`); mai oltre 30 celle dal contadino |
| `trascinamento-puro.js` | il conto del pezzo al dito, senza three: `cellaSottoIlDito` (il centro del pezzo sul punto del dito), lo scarto della presa, `velocitaBordo` e le costanti dello scorrimento ai bordi (`unita/fattoria3d-trascinamento`) |
| `effetti.js` | scintille e fumo, i testi che volano, il fumetto del contadino, i cartelli (`nuovoBadge`; `nuovoCartello` per le bestie, con un pulsante vero), l'albero che cade |
| `modelli.js` | tutti i pezzi in codice (niente sprite, niente immagini: le trame sono canvas): il campo (ri-esportato da `modelli-colture.js`), i sette edifici (pasticceria, mongolfiera, mulino, panificio, caseificio, conserviera, gelateria; i mattoncini sono esportati per `modelli-macchine.js`), le quattro decorazioni (aiuola, panchina, pozzo, spaventapasseri), bancarella, fontana, recinto e pecore con le loro fasi, pollaio con le galline, stalla con le mucche ([animali.md](animali.md)), fienile; `creaCasa`, `creaBancarella` e `creaBacheca` sono dei sottili rimandi a `dal-sotterraneo.js`, e `creaCasaVecchia` e `creaBancarellaVecchia` sono i disegni di prima, tenuti per il catalogo |
| `modelli-macchine.js` | i quattro edifici nuovi, 3×3 con `anima`, `fumo` e `altezza` come gli altri: zuccherificio (capannone, ciminiera, barbabietole e sacchi, ruota dentata), telaio (capanna col grande telaio e la navetta, balle di lana), sartoria (casetta, manichino che gira, ago nel rocchetto), tintoria (capanno con tre vasche colorate, stoffe stese) |
| `modelli-colture.js` | il campo 2×2 e le quindici colture, a istanze: vedi «Le colture» qui sotto |
| `modelli-passaggi.js` | ponte ad arco (3×1, la gobba), passerella di assi su pali con la corda (1×3) e tavolo con le panche (3×2): vedi sotto |
| `modelli-acqua.js` | lo stagno (3×3) e il laghetto (5×4): un solo `creaStagno(w, d)` con la lastra d'acqua, la riva in rilievo, sassi, canne e ninfee; il materiale dell'acqua è lo stesso dei laghi del terreno ([laghi.md](laghi.md)) |
| `modelli-pesca.js`, `pesci.js`, `pesca3d.js` | il molo e il porticciolo; i pesciolini (una `InstancedMesh`, tutto nello shader); il galleggiante, il filo e il cartello «Abbocca!»: [geografia-e-pesca.md](geografia-e-pesca.md). Il mare lontano è un piano solo in `terreno.js` (`_mare`) |
| `dal-sotterraneo.js` | la casa di legno, il banco della guaritrice, la bacheca delle taglie e il cespuglio, presi dal Sotterraneo 3D (copie adattate: vedi sotto). Un `Cantiere` che unisce i pezzi in una mesh per materiale, colori nei vertici |
| `compagni.js`, `modelli-compagni.js` | Watson e i gatti che girano per la fattoria, e il contadino con la sua faccia: il comportamento, i corpi e le pose ([compagni.md](compagni.md)) |
| `webgl.js` | `haWebGL2()`: si chiede senza caricare three |

La **vista** (`Gioco.vue` e `viste/`) apre le finestre e dice cosa si vuole; la scena la chiama attraverso `ui`
(`cambio`, `chiedi`, `scegliSeme`, `apriMacchina`, `apriBanco` (un tocco sulla bacheca o sulla bancarella), `avviso`, `fogliAperti`, `zonaDrop`, `trascinando`).

**Il foglio di una macchina** (`apriMacchina(tipo)`) non è nella scena: è `viste/Macchina.vue`, con posti, pronti e carte da trascinare; il dito che lo trascina è del foglio e non tocca la scena sotto ([file.md](file.md), «Il foglio della macchina»).

**Un tocco su un edificio non tuo** che non si può comprare adesso (livello o terreno che mancano) non fa camminare il contadino, che sta fuori
dal suo terreno: apre subito l'offerta, che dice il livello o manda al lotto da comprare prima (`_edificioDaLontano` in `mondo3d.js`).

## Le colture

Un campo ha quattro tessere e le piante a istanze: **una `InstancedMesh` per forma** (fusto, foglia, nastro, spiga,
pannocchia, zucca, bacca, melanzana…), condivisa da tutte le colture; ogni coltura è una ricetta che posa le sue forme
attorno a ogni pianta (`RICETTE` in `modelli-colture.js`, l'aspetto in `ASPETTO`). Quante istanze servono lo si conta una
volta provando ogni coltura matura; `count` dice quante se ne disegnano e una forma che non serve è spenta.
- **Le ultime cinque** (cavolfiore, peperone, aglio, barbabietola, riso) usano le stesse forme (nessuna nuova): il peperone è la
  `melanzana` allargata e corta, la barbabietola ha i piccioli rossi (`filo`) e la radice è una `sfera`, il riso ha una lastra
  d'acqua per tessera (una `sfera` schiacciata) e le spighe in testa ai culmi, al massimo come il grano (80); il campo di riso
  si posa da sé (`CRESCE_DA_SE`), come il pomodoro.
- **Le piante stanno in fila sulle porche** (`disp: 'file'`), come in un orto; il grano è fitto a griglia smossa (5×4 per
  tessera), la cipolla è rimasta com'era (otto a caso).
- **La crescita si legge**: la pianta cresce di scala, le foglie arrivano una alla volta, il frutto compare oltre 0,55 e
  matura di colore (pomodori e fragole dal verde, la spiga dal verde all'oro); i pomodori arrivano uno alla volta, il palo
  c'è già dalla semina.
- **Il colore che deve variare per istanza** (il verde che matura) sta nel colore dell'istanza; dove una forma ha due
  colori fissi (la pannocchia con le brattee, la zucca col picciolo) sono colori ai vertici, e l'istanza li tinge appena.
- **Il peso**: un campo maturo fa 1,3–5,5k triangoli (il grano il più caro), ~11–13 mesh contando il letto; prima erano
  ~1,6k per tutte. Il catalogo li scrive: `npm run catalogo3d:scheda -- --gioco fattoria --q "campo di"` (anche le voci
  «in crescita», a quattro età).
- **La patata è marrone chiaro dorato** (`0xe6c065`), come la buccia di una patata a pasta gialla appena cavata: si legge
  sulla terra scura, e non va al giallo pieno, che la farebbe un formaggio o un limone.

## Ponte, passerella e tavolo: copia, non import

Vengono dal Sotterraneo 3D (`mondo/ponti.js:ponte`, `mondo/props-modelli.js:MODELLI.tavolo`) ma sono **una copia piccola** in
`scena3d/modelli-passaggi.js`, non un import: quei modelli si posano in un `Cantiere` (`mondo/kit.js`) che vuole le trame del
sotterraneo, la sua nebbia (`vesti.js`) e un mondo (`pontiDi(m)`, `suolo.js`), e portarli qui trascinerebbe `kit.js` e mezzo
`mondo/` nel gruppo `fattoria3d`. La forma è la stessa (arcata di pietra con i parapetti, assi su pali, tavolo con tovaglia e
boccali), i materiali sono quelli di `modelli.js` (`mat`). Se si cambia l'aspetto in uno, si guarda l'altro: nel catalogo 3D
([../core/catalogo-3d.md](../core/catalogo-3d.md)) le voci sono `gioco: 'entrambi'`. La gobba del ponte è una formula (`GOBBA`)
e le quote per cella di `dati/catalogo.js` (`alzato`) la campionano: il contadino e i compagni salgono e scendono con `quotaPasso`.

## Casa, banco, bacheca, cespuglio: copia, non import

Come per il ponte: vengono dal Sotterraneo 3D (`mondo/kit.js:casa` col seme che dà il legno, `kit.js:bottega('erbe')`,
`ponti.js:bacheca`, `natura.js:GEO.cespuglio`) ma sono **copie piccole** in `scena3d/dal-sotterraneo.js`, perché `kit.js` e
`natura.js` tirano dentro `suolo.js` → `motore/mondo-aperto.js` (i dati di tutto il mondo di sopra) e i materiali con la nebbia
dell'esplorazione: nel gruppo `fattoria3d` finirebbe mezzo sotterraneo. Cambia lo stile (niente trame, colori nei vertici, flat
shading e la palette della fattoria) e le misure (casa 4×3, banco e bacheca 2×1), la forma è la stessa. I file del sotterraneo non si
toccano. Il cespuglio ha i vertici in grigio (luce e ombra) e il verde lo mette l'istanza come prima (`terreno.js`, `_ostacoli`).
- **La casa** ha il camino e `userData.fumo`: il terreno ci fa uscire una fumata ogni ~0,9 s (`Terreno.muovi(dt, fx)`).
- **La bacheca** ha i foglietti a parte (`userData.mostraFogli(n, colori)`, fino a sei, due mesh l'uno con una geometria e tre materiali condivisi): `pezzi.js` ne accende tanti quanti gli ordini aperti
  (ogni mezzo secondo, al massimo sei) e li colora come i biglietti del foglio (`tipo` dell'ordine: verde, rosa, giallo) e scrive sul cartello «🧺 N pronti!» quando ce ne sono di consegnabili.

## Costruire: «Costruisci qui»

**Si tiene premuto** (~0,45 s, vibra) **su un posto libero del proprio terreno** e si apre il foglio «Cosa costruiamo?»
(`viste/CostruisciQui.vue`, `dito.js` ricorda la cella premuta); il tasto 🏗️ della barra apre lo stesso foglio per la cella
davanti al contadino (`cellaDavanti`). Un dito che scorre prima della soglia non lo apre (il dito non è un mouse); un lotto non tuo si
compra toccandolo; tenuto premuto su un pezzo lo riprende, come prima.
- **Le schede** (`CATEGORIE` in `dati/catalogo.js`: 🌾 Campi, 🐑 Animali, 🏠 Edifici, 🌷 Decori, 🛣️ Strade) e sotto **le carte**, tre
  per riga, dai dati (`dati/carte.js`: ogni pezzo e ogni edificio unico ha la sua `categoria`, ordinati per livello, prima le carte col «!»; un edificio
  già in mappa non si offre, uno nel magazzino sì con «📦 ×1»). La carta mostra **il modello 3D vero** (vedi «Le anteprime»); l'emoji su una piastrella del colore della scheda sta solo per gli strumenti (strada e gomma) e come segnaposto finché l'immagine non è pronta o se non riesce; nome, prezzo
  (o «📦 ×N» se il pezzo è già nel magazzino) e, se non è ancora arrivata, la velatura col lucchetto: **toccarla la fa tremare e
  dice il livello**. Le schede scorrono di lato, il corpo in verticale; un tocco sul velo o la ✕ lo chiudono.
- **Scegliere una carta la posa sulla cella premuta** (`Costruzione.daMenu`): fra i modi di posarla che coprono la cella prende il
  più centrato che ci sta, **compra e mette in un gesto** (`compraEMetti`, senza conferme) e il foglio si chiude. Se mancano le
  monete il foglio resta e dice «Servono 🪙 N». Se la cella non basta (occupata, fuori terreno) il foglio si chiude e **il fantasma
  resta lì**, verde o rosso: lo si **trascina** (il fantasma sta sopra il dito come sotto) e al rilascio in un posto buono paga e mette; un
  rilascio che non va lo lascia dov'è, un **tocco** su un posto buono costruisce lì e **su uno che non va annulla** (senza perdere
  niente), come la fascia «✖️ … per annullare» in basso (si tocca, o ci si rilascia sopra).
- **Gli edifici unici** (mulino, ecc.) hanno la loro carta nella scheda Edifici e si posano come ogni pezzo, con il «!» sulla linguetta, sulla carta e sul tasto 🏗️ finché il livello li ha aperti e non ci sono ([edifici-liberi.md](edifici-liberi.md)). **La
  strada e la gomma** attivano il pennello: il foglio si chiude e compare `viste/BarraStrade.vue` (strada, gomma, «Fatto»); il dito
  sulla mappa disegna e due dita la spostano.
- **Il prezzo e il rincaro** sono quelli di sempre (`prezzoPezzo`, `puoCompraEMettere`). Un pezzo già messo si riprende **tenendolo
  premuto** (vibra, compaiono la griglia e la fascia «📦 metti via») e si trascina; spostarlo costa 🪙 1. Nessun «annulla».
- **Il pezzo sta sotto il dito, e dove lo vedi lo costruisci** (`costruzione.js`, `trascinamento-puro.js`). Il **centro** del pezzo cade sul punto del
  suolo che il dito tiene: `i = round(x − w/2)`, `j = round(z − d/2)` (prima l'angolo stava sotto il dito, e un 3×3 finiva una cella e mezza in
  giù e a destra: era il «qualche px sotto»). Il fantasma si disegna con lo stesso `(i, j)` con cui al rilascio si costruisce, e il rilascio non
  ricalcola se il dito non si è mosso dall'ultimo punto visto. Un pezzo **nuovo** sta `SOLLEVA_PX` = 40 px sopra il dito (nello schermo, non
  nel mondo: 1,6 celle di mondo erano 40 o 80 px a seconda dello zoom e della riga); uno **già messo** (tenuto premuto) o il **fantasma parcheggiato
  preso sopra** (a meno di 1 cella) tengono **il punto che il dito ha preso**: lo scarto fra dito e centro dell'istante della presa non cambia
  (niente salto verso il dito). Un tocco sul fantasma costruisce dov'è il fantasma. Dal menu, il pezzo si centra sul **punto esatto premuto**
  (`puntoMenu`), non sul centro della cella. Provato: ancorare l'angolo, o 1,6 celle di mondo di rialzo.
- **Contro il bordo la camera scorre** (`Costruzione.fotogramma`, ogni fotogramma): col dito che tiene un pezzo (da carta, ripreso o parcheggiato
  trascinato) **o il pennello delle strade** nella fascia di `FASCIA_PX` = 72 px dal bordo utile (sotto la barra in alto `SOPRA_UI_PX` = 64; in
  basso sopra la fascia «metti via», o 96 px dal fondo col pennello), la camera scorre verso quel bordo da `VEL_MIN` = 2 a `VEL_MAX` = 12
  celle/s (col quadrato della profondità; × `dt`, non coi fotogrammi), anche a dito fermo; la cella del fantasma si ricalcola a ogni fotogramma
  con la camera di adesso, quindi resta sotto il dito. Il limite è `LONTANO` = 30 celle dal contadino (il mondo non ha confini); su «metti via» non
  scorre; alzato il dito (o `pointercancel`) si ferma. «⌖ Torna al contadino» compare come per ogni camera libera. Come la 2D
  ([../fattoria/come-si-tocca.md](../fattoria/come-si-tocca.md), `spinta.js`), ma in celle di mondo e non in px di vista.
- **Non c'è più la telecamera «costruzione»** (alta, «Vicino» / «Tutto») né la barra: il posto si sceglie premendo dove lo si vuole.
  Il fantasma si sistema sulla mappa di sempre (la telecamera segue il contadino, due dita zoomano).
- Il foglio si rifà dai dati a ogni cambio: una carta nuova nel catalogo compare da sola, e il test fallisce se manca la categoria.
  Provato: una barra in basso con tutte le carte in fila: infinita e bruttina, per questo è un foglio a schede.

## Le anteprime (le carte e l'insegna delle macchine)

Una carta mostra il modello vero che poi si vede in scena, non un'icona: `scena3d/anteprime.js` lo fotografa una volta per tipo e la
foto (dataURL PNG, 192×192) resta in cache per la sessione. `Mondo3d.anteprima(tipo)` → `Promise<dataURL|null>` (e `anteprimaPronta(tipo)`
subito, se c'è); `Gioco.vue` le passa come funzioni a `CostruisciQui.vue` e a `Macchina.vue`, che non importano three.
- **Nessun contesto WebGL in più**: si disegna col renderer della scena stessa, in un render target (sRGB, 4 campioni), e si rimette tutto
  com'era (target, colore di fondo, ombre). La foto si legge con `readRenderTargetPixels`, si capovolge e si copia in un canvas 2D. Il
  catalogo 3D (`strumenti/banco`) fa altrimenti perché ha un renderer suo; qui il telefono ne ha già uno (due in visita).
- **Una per fotogramma** (`requestAnimationFrame`, coda in `anteprime-pura.js`, senza three: `creaCache`): il menu chiede prima la
  scheda aperta e poi le altre, e non blocca la scena. Finché non è pronta la carta mostra l'emoji sbiadita; poi l'immagine entra con una
  dissolvenza (`img[data-anteprima="pronta"]`). Costo: ~25 render una tantum (circa 0,3 s l'uno in SwiftShader, 9 s in tutto; su una GPU vera molto meno).
- **L'inquadratura** (`inquadra(box)` in `anteprime-pura.js`) guarda a tre quarti dall'alto e trova la distanza minima per cui gli otto
  angoli della scatola stanno nel quadro col 10% di margine, centrando la figura vista: un 1×1 e un 4×3 riempiono uguale. La scena di posa
  ha solo sole e emisferica (senza ombre) e un disco d'ombra morbida sotto.
- **I modelli** vengono da `Pezzi.modelloAnteprima(tipo)`: gli stessi creatori della scena, il campo con il grano maturo, il recinto con
  due pecore, pollaio e stalla con due bestie. Non ci sono animazioni: un istante fisso. Sono cloni della cache dei modelli (geometrie condivise con la scena: non si toccano), perciò una foto non costruisce niente dopo il primo uso del tipo.
- Se `anteprima` torna `null` (un guasto) resta l'emoji. Il tono (ACES) non si applica in un render target: i colori sono un filo più piatti che in scena.

## Qualità e peso

Il pannello ⚙ (`viste/Opzioni.vue`, dati in `dati/qualita.js`) ha tre preset (basso / medio / alto), gli interruttori che
pesano (risoluzione 0,75×…nativa, ombre e loro qualità, vento, scintille, alberi, ciuffi, nebbia), la
distanza della telecamera, le prove di stress (+10 campi, +3 recinti, non si salvano) e le statistiche vive: fps, il
fotogramma peggiore degli ultimi due secondi, il lavoro del JS (non la GPU: quella si deduce dal peggiore), draw call,
triangoli, geometrie, texture. «Mostra il rapporto» scrive dispositivo, GPU, fps e impostazioni da incollare.
**Il punto di partenza lo dà la fascia grafica del telefono** (`fasciaAttiva()` di `store/qualita.js`: bassa → basso,
media e alta → medio); le scelte si ricordano in `store/storage.js` (`fattoria3d-opz`, con una versione: `VERSIONE_OPZIONI`
in `dati/qualita.js`, che si alza quando cambiano i valori di partenza, così chi aveva salvato un preset vuoto riparte da quello nuovo).

**Cosa si deve vedere** (medio e alto: tutto acceso; il basso tiene spenti ombre, vento e scintille, e lo dice nelle opzioni):
- **ciuffi d'erba**: un gruppetto di tre fili su metà delle celle del prato, a istanze, che sparisce dove sta una strada, un
  pezzo, un albero, un sasso o l'acqua (si rifà a ogni cambio e a ogni finestra nuova, `ridisegnaErba`), solo nei lotti aperti della finestra;
- **vento**: i ciuffi ondeggiano nel vertex shader (fase per ciuffo, raffiche) e il grano maturo si piega di una decina di gradi;
- **scintille e fumo**: solo nei momenti del gioco (semina, raccolto, acquisto, fumo dei forni), non a ciclo continuo.
Prima di questo non si vedeva niente: i ciuffi solo fuori dal mondo (sottili e dello stesso verde del prato), il vento del grano muoveva la punta di 5 cm.

- Il motore sta in piedi con **molte cose** perché campi, alberi, sassi, ciuffi, strade e recinto sono a istanze: ~100–260 draw call
  e ~20–50k triangoli con una sola ombra a 1024 **a fattoria quasi vuota** (misurato in Chrome senza schermo, SwiftShader: i ms non dicono niente
  del telefono); con tutto comprato sono ~1400 draw call: sotto. **Da misurare su un telefono vero.**
- **Il peso con la fattoria piena (20/10/2026).** Uno stato pieno (tutti i lotti, 11 edifici, 7 campi, recinto, pollaio, stalla, ponte,
  passerella, tavolo, aiuole, bacheca, quattro compagni, 19 cartelli) fa **~1140 mesh, ~1870 draw call, ~255k triangoli e ~7500 chiamate a WebGL a
  fotogramma** (prima ~100–260 draw call). Misurato con Chrome sulla GPU vera (RTX 5060: il JS e il driver si vedono, la GPU no) e la CPU
  rallentata ×6 (`Emulation.setCPUThrottlingRate`, un PC debole; i ms ballano se la macchina fa altro, **valgono i conti**):

  | colpevole | cosa costa (stato pieno, medio) |
  |---|---|
  | **1. la passata dell'ombra** | 1870 → 960 draw call senza ombre (**−49%**), 255k → 129k triangoli, 7500 → 3570 chiamate GL: ogni mesh si disegna due volte; ~1050 mesh proiettavano. A CPU ×6: 12 fps → 15 senza ombre (con la macchina quieta 12 → 49) |
  | **2. troppe mesh piccole** | edifici 17–45 mesh l'uno (11 edifici: ~320 mesh), ponte 57, passerella 41, recinto 53, stalla 68, campo 26 (di cui 17 istanze) × 7: sono ~960 draw call anche senza ombre; quasi la metà con raggio sotto i 35 cm |
  | **3. i triangoli dei compagni e dei campi** | un gatto ~7000 triangoli (3 gatti = 21k, ×2 con l'ombra), il cane 6000; i 7 campi ~38k per fotogramma. Costano alla GPU, non al JS |
  | non sono loro | `updateMatrixWorld` di tutta la scena 0,18 ms; `proietta` 1 µs; JS della logica (contadino, pezzi, effetti, cartelli) ~1,5 ms; DOM/Vue: stile 0,2–0,8 ms a fotogramma (19 cartelli), layout 0; `ripresa()`/HUD invisibili nel profilo |

  **Rimedi applicati** (stesso stato, CPU ×6, conti medi per fotogramma): ogni mesh con raggio sotto 35 cm non proietta ombra
  (`scena3d/ottimizza.js`, 1048 → 498 «con ombra»: **1870 → 1380 draw call, 255k → 174k triangoli, 7500 → 6000 chiamate GL**, nel campo
  restano i fili a istanze solo per le chiome); l'ombra si ridisegna a comando (`shadowMap.autoUpdate = false`, `needsUpdate` a ogni
  fotogramma di serie) e **il degrado adattivo** (`dati/degrado.js`, puro, `unita/fattoria3d-degrado`) la fa ogni 2–4 fotogrammi: **livello 1 =
  1170 draw call (−38% sull'inizio), livello 3 = 1100, livello 5 = 1070**; se gli fps medi di 2 s stanno sotto 30 scende di un livello (prima l'ombra
  più rada, poi un po' di risoluzione: ×0,8 a gradino, mai sotto 0,75×, e **solo se la strozzatura non è la CPU**: se il JS riempie il fotogramma i
  pixel non servono), sale dopo 10 s tutti a 55+ e ogni ricaduta raddoppia l'attesa (tetto 80 s); `q.scala` e `q.ombre` salvati non si toccano, il
  livello vive in memoria e lo dicono le opzioni. I cartelli non riscrivono più lo stile se non si sono mossi, `proietta` non alloca, la foto del HUD
  non si rifà se è uguale. Il pannello ⚙ e «Mostra il rapporto» ora dicono anche: JS di logica e di disegno e il resto del fotogramma, programmi,
  quante cose per tipo, mesh e chi proietta ombra, pixel ratio scelto e usato, livello del degrado.
  **Le mesh fuse (21/10).** `scena3d/fondi.js` (`fondiPerMateriale(gruppo, { escludi })`, chiamata alla fine di ogni costruttore, **una volta per tipo**: vedi «La cache dei modelli») fonde le mesh
  statiche in una per tipo di materiale: i colori passano nei vertici (materiale `vertexColors` condiviso per firma: ruvidità, metallo, luce propria,
  lato), il disegno è identico. Restano sciolti ciò che si muove (pale, fumo, dolce, cono, pallone e fiamma, manichino, ago, ruota, vasche, panni,
  gocce, navetta, i corpi delle bestie e le zampe delle pecore), i trasparenti, le trame, le istanze e le mesh con `userData`; le parti che si
  muovono per intero (una pala, il manichino, la testa della mucca) si fondono a parte, dentro di sé. Un pezzo piccolo (< 35 cm) non proietta
  ombra, salvo che nello stesso materiale ci sia un pezzo grande: allora entra nella sua mesh (meno draw call, qualche triangolo in più nell'ombra).
  L'interruttore `FONDI.acceso` serve ai confronti prima/dopo. Misura (stato pieno: 7 campi, 22 pezzi e edifici, aiuole, recinto 3 pecore, pollaio 4,
  stalla 4, cane, 3 gatti, contadino; ombra 1024; Chrome SwiftShader, i ms ballano, valgono i conti):

  | | prima | dopo |
  |---|---|---|
  | mesh | 1158 | 421 |
  | draw call a fotogramma (con l'ombra) | 1434 | **428** (−70%) |
  | triangoli a fotogramma | 88,6k | 99,8k (+13%: l'ombra ora disegna anche i pezzi piccoli fusi) |
  | JS di `render()` (ms) | 3,05 | 0,90 |

  Per modello (mesh, prima → dopo): ponte 57 → 1, passerella 41 → 1, tavolo 25 → 1, pasticceria 45 → 4, conserviera 32 → 8, gelateria 36 → 3,
  caseificio 32 → 4, telaio 32 → 3, zuccherificio 34 → 4, sartoria 23 → 6, tintoria 25 → 10, mulino 21 → 2, panificio 17 → 4, mongolfiera 16 → 4,
  recinto (3 pecore) 89 → 22, pollaio (4) 51 → 13, stalla (4) 129 → 17, aiuola 23 → 1, contadino 28 → 7, mucca 23 → 6, pecora 18 → 7, gallina 8 → 4.
  Cani e gatti erano già fusi per pezzo (15–17). Test: `unita/fattoria3d-fondi`.
  **La cache dei modelli (21/10).** La fusione (clona le geometrie, le sposta, scrive i colori nei vertici, `mergeGeometries`) e la costruzione delle mesh
  sciolte si pagavano **a ogni istanza**: ogni campo, aiuola, recinto, fantasma di trascinamento e anteprima rifaceva tutto, e ogni istanza si portava
  le sue geometrie in GPU. Ora `scena3d/cache-modelli.js` (`memoModello(nome, costruisci, { chiave, dopo })`) costruisce e fonde un tipo **la prima volta**
  e poi consegna un clone (`clonaModello`: nodi nuovi, **geometrie e materiali condivisi**). Vale per tutti i modelli di `modelli.js`, `modelli-macchine.js`,
  `modelli-passaggi.js`, `dal-sotterraneo.js` (banco, bacheca, casa) e per il contadino. Il campo mette in cache la terra e il bordo (nove scatole, ora fuse: 26 → 18 mesh a campo)
  e fa da sé le piante a istanze (matrici e colori sono suoi). Recinto, pollaio e stalla in cache sono vuoti e le bestie si aggiungono a ogni istanza; pecora, gallina (due mantelli)
  e mucca (due) sono in cache anche loro. Cane e gatti avevano già le geometrie in cache dentro `modelli-compagni.js` (la prima volta 13–21 ms in node, poi 0,2–0,4).
  Le regole per chi scrive un modello (anche in testa a `cache-modelli.js`):
  - `userData` tiene numeri, vettori, oggetti semplici, liste, **riferimenti a nodi del modello** (si ricollegano al clone) e funzioni, ma **una funzione non cattura
    nodi**: `anima` è un metodo che legge i nodi da `this` (`g.userData.pale = pale; g.userData.anima = function (dt) { this.pale.rotation.z -= dt * 0.5 }`;
    `pezzi.js` la chiama come `g.userData.anima(dt, tt)`, quindi `this === userData`). Una freccia sulle variabili del costruttore animerebbe l'originale, che nessuno vede
    (il test `unita/fattoria3d-cache` controlla che ogni `anima` muova il clone che la possiede).
  - **geometrie e materiali non si toccano per istanza**: chi vuole un materiale suo lo clona. `fantasma(g)` lo fa, e `buttaFantasma(g)` (chiamato da `costruzione._fine` e da
    `pezzi._togli`) butta quelle copie; le geometrie sono della cache e non si buttano mai. Le animazioni che cambiano un materiale (la bocca del forno, lo sciroppo, i bagni)
    lo cambiano per tutti, come prima (i `mat()` erano già condivisi).
  - ciò che deve essere diverso a ogni istanza (la `fase` a caso di una gallina) si rifà nel ritocco `dopo`.
  - `CACHE_MODELLI.acceso = false` (e `FONDI.acceso = false`) rifanno i modelli da capo come una volta: per i confronti (`strumenti/misura-modelli3d.mjs`, `npm run catalogo3d:scheda -- --gioco fattoria --senzacache [--senzafondi]`).

  **Il riscaldamento** (`scena3d/scaldo-puro.js`, `Pezzi.compitiScaldo()`, `Mondo3d._scalda`). La *prima* costruzione di un tipo costa 0,1–3 ms, e si pagherebbe
  mentre si posa il primo campo o si compra la prima gallina. Dopo i primi 60 fotogrammi, a fine fotogramma, **un compito per fotogramma** costruisce in tempo morto ciò che manca,
  in quest'ordine: campo, recinto, pollaio, stalla, pecora, gallina, mucca, il resto dei pezzi (aiuola, panchina, pozzo, fontana, spaventapasseri, ponte, passerella, tavolo, banco, bacheca, stagno, laghetto)
  e gli edifici (non sono in scena finché non si costruiscono: il primo costruito non deve pagare il modello). Misurati in Chrome con la cache vuota, i 28 compiti durano 0,1–2,4 ms l'uno (un telefono: ×5–8, non misurato).
  Non parte se l'ultimo fotogramma ha superato i 28 ms o gli fps medi sono sotto 30; con la pagina nascosta niente; dopo un compito lungo (>6 ms) lascia riposare qualche fotogramma;
  **rinuncia per sempre** se il degrado adattivo è sceso di livello o gli fps stanno sotto 24 (ciò che resta si paga alla prima richiesta, come prima). Nei test con SwiftShader (15–20 fps)
  rinuncia subito: è voluto, non un guasto (la logica è provata in `unita/fattoria3d-cache` e, a fps forzati, dentro la pagina).

  **Misura (21/10; `node strumenti/misura-modelli3d.mjs`, e Chrome desktop col dev server: stesse proporzioni; i ms ballano, valgono i conti).** Una istanza di ogni tipo (26 tipi, 10 istanze l'uno):

  | | prima | dopo |
  |---|---|---|
  | ms per una istanza di ogni tipo (somma dei 26) | 27–33 (node) · 22–24 (Chrome) | **1,0–1,8 (node) · 0,4 (Chrome)** |
  | recinto (2 pecore) · stalla (2 mucche) · pollaio (2 galline), ms | 4,8 · 3,8 · 3,0 | 0,26 · 0,11 · 0,06 |
  | aiuola · ponte · pasticceria · tintoria, ms | 2,0 · 1,5 · 2,0 · 1,1 | 0,01 · 0,01 · 0,03 · 0,05 |
  | geometrie per 10 istanze di ogni tipo | 1123–1321 | **126** (le istanze non ne portano) |
  | mesh di un campo | 26 | 18 (terra e bordo: da 9 scatole a una mesh) |

  Il costo *per tipo* (la prima volta) è quello di prima: 0,1–2,9 ms, 22–24 ms per tutti i tipi in fila, di cui **~10 ms** erano i fantasmi degli 11 edifici, costruiti all'avvio (oggi un edificio si costruisce quando lo si compra, o nel riscaldamento).
  **Memoria**: 50 pose, 50 rimozioni e 10 fantasmi di fila lasciano piatte le geometrie e le trame in GPU (`renderer.info.memory`: 181 → 181 e 24 → 24; controllo in `integrazione/fattoria3d`).
  **Identici**: le 76 schede del catalogo (`catalogo3d:scheda --gioco fattoria` contro `--senzacache`) sono uguali al pixel, tranne dove una pecora sta in un posto a caso; la terra fusa
  del campo contro le nove scatole sciolte (`--senzacache --senzafondi`) cambia ~230 pixel di bordo nelle carte dei campi.
  **Cotto a monte? No** (21/10). Le geometrie fuse dei 26 tipi sono 25,5k vertici e 50k indici: **~400 kB** anche quantizzate (posizione int16, normale int8, colore uint8, indice uint16), ~540 kB in
  base64, contro un tetto di ~150 kB; e il guadagno sarebbe al più la costruzione di tutti i tipi in fila (22–24 ms su un PC, ~130 ms *stimati* su un telefono, una volta per sessione), perché le
  parti mobili e le mesh con trame si costruirebbero comunque. Non vale il peso nel file unico.
  **Provato e non fatto**: `matrixAutoUpdate = false` sui gruppi fermi (0,18 ms in tutto: non vale il rischio con i modelli che altri toccano);
  nascondere i cartelli lontani (non pesano). Le proposte per il giro dopo sono in [da-fare.md](da-fare.md).
- **Il peso nel sito spezzato**: `fattoria3d-3d-*.js` (~50 kB, il disegno) e `gioco-fattoria3d-*.js` (~40 kB) stanno nel
  gruppo `fattoria3d`; **three sta in `asteroidi-3d` (640 kB, gruppo `mate`)** e lo prende anche questo gioco. Il file
  del 3D si chiede a richiesta, quindi senza WebGL 2 o senza entrarci non si scarica (e `vite.config.js` lo sa, come per
  il Sotterraneo 3D).
- Il tempo è del tempo, non dei fotogrammi: `dt` capato a 0,05 s, le animazioni dal tempo, la crescita dall'orologio.

## Per provarlo

`#fattoria3d` apre il gioco. `&tela=niente` prova il messaggio senza WebGL. Dalla console, `window.__fattoria3d` dà
`motore`, `mondo` e le opzioni `q` (i test lo usano: un orologio spostato con `motore.ora = () => Date.now() + 60000` fa
passare il tempo dei campi). `node test/esegui.mjs fattoria3d --scatti` lascia le foto in
`test/scatti/`.

- **Provate e tolte, le nuvole**: undici macchie basse con l'ombra sul prato, due disegni a istanze. Pesavano e non davano l'impressione giusta di cielo (provato: non si rimettono senza un'idea diversa).
