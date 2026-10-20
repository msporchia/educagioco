# La scena 3D della fattoria

Come è fatto il disegno in `src/giochi/fattoria3d/scena3d/`: un modulo per cosa, e nessuno sa le regole (sono del
motore). three.js è l'eccezione alle «niente dipendenze oltre Vue» ([../../CLAUDE.md](../../CLAUDE.md)), accettata come per
gli Asteroidi 3D e il Sotterraneo 3D: il 3D non si scrive a mano.

## I moduli

| file | cosa tiene |
|---|---|
| `mondo3d.js` | **compone** tutto e fa il battito: renderer, luci, il tocco (`tocca`, `bersaglioSotto`), la coda di semina/raccolta, le opzioni (`applica`), le statistiche. L'unico che usa il renderer |
| `terreno.js` | erba, strade, griglia, lotti non comprati, recinto, alberi, i due edifici di scena |
| `pezzi.js` | un gruppo per ogni cosa del motore e per i sette edifici unici (fantasmi finché non si comprano); li tiene allineati (`sincronizza`) e li anima (grano che cresce, pecore, galline e mucche, fontana, fumo, il pallone); i cartelli sugli edifici: prezzo o «🔒 Livello N» sul fantasma, pronti o cottura su ogni macchina, uova o latte pronti sul pollaio e sulla stalla, e su recinto, pollaio e stalla il cartello col conto «🐄 2/4» e il pulsante «＋ 🪙 N» che compra una bestia ([animali.md](animali.md)); il cartello si nasconde col pezzo sollevato |
| `eroe.js` | il movimento (a piedi, o di corsa), il percorso, la posa del gesto (semina, falcia, abbatte, esulta) |
| `azioni.js` | cosa fa l'eroe davanti a ogni cosa: anima il gesto e **a metà gesto chiede al motore di farlo davvero**; un edificio posseduto apre il menu della sua macchina, uno no offre l'acquisto (`offriEdificio`: livello, terreno da comprare prima, prezzo) |
| `detti.js` | `dettoDi` / `dettoDiRifiuto`: un rifiuto del motore in una riga che dice cosa fare. Senza three: lo usa anche `Gioco.vue` |
| `costruzione.js` | il trascinamento dei pezzi (dalla barra o riprendendone uno), il fantasma, le strade a pennello; al rilascio compra e mette in un gesto |
| `dito.js` | i pointer sulla tela: tocco, mappa che scorre, pizzico, tenere premuto, riprendere un pezzo |
| `camera.js` | la telecamera: segue, libera, in costruzione |
| `effetti.js` | scintille e fumo, i testi che volano, il fumetto dell'eroe, i cartelli (`nuovoBadge`; `nuovoCartello` per le bestie, con un pulsante vero), l'albero che cade |
| `modelli.js` | tutti i pezzi in codice (niente sprite, niente immagini: le trame sono canvas): il campo (ri-esportato da `modelli-colture.js`), i sette edifici (pasticceria, mongolfiera, mulino, panificio, caseificio, conserviera, gelateria), le quattro decorazioni (aiuola, panchina, pozzo, spaventapasseri), bancarella, fontana, recinto e pecore con le loro fasi, pollaio con le galline, stalla con le mucche ([animali.md](animali.md)), fienile; `creaCasa`, `creaBancarella` e `creaBacheca` sono dei sottili rimandi a `dal-sotterraneo.js`, e `creaCasaVecchia` e `creaBancarellaVecchia` sono i disegni di prima, tenuti per il catalogo |
| `modelli-colture.js` | il campo 2×2 e le dieci colture, a istanze: vedi «Le colture» qui sotto |
| `modelli-passaggi.js` | ponte ad arco (3×1, la gobba), passerella di assi su pali con la corda (1×3) e tavolo con le panche (3×2): vedi sotto |
| `dal-sotterraneo.js` | la casa di legno, il banco della guaritrice, la bacheca delle taglie e il cespuglio, presi dal Sotterraneo 3D (copie adattate: vedi sotto). Un `Cantiere` che unisce i pezzi in una mesh per materiale, colori nei vertici |
| `compagni.js`, `modelli-compagni.js` | Watson e i gatti che girano per la fattoria, e il contadino con la sua faccia: il comportamento, i corpi e le pose ([compagni.md](compagni.md)) |
| `webgl.js` | `haWebGL2()`: si chiede senza caricare three |

La **vista** (`Gioco.vue` e `viste/`) apre le finestre e dice cosa si vuole; la scena la chiama attraverso `ui`
(`cambio`, `chiedi`, `scegliSeme`, `apriMacchina`, `apriBanco` (un tocco sulla bacheca o sulla bancarella), `avviso`, `fogliAperti`, `zonaDrop`, `trascinando`).

**Un tocco su un edificio non tuo** che non si può comprare adesso (livello o terreno che mancano) non fa camminare l'eroe, che sta fuori
dal suo terreno: apre subito l'offerta, che dice il livello o manda al lotto da comprare prima (`_edificioDaLontano` in `mondo3d.js`).

## Le colture

Un campo ha quattro tessere e le piante a istanze: **una `InstancedMesh` per forma** (fusto, foglia, nastro, spiga,
pannocchia, zucca, bacca, melanzana…), condivisa da tutte le colture; ogni coltura è una ricetta che posa le sue forme
attorno a ogni pianta (`RICETTE` in `modelli-colture.js`, l'aspetto in `ASPETTO`). Quante istanze servono lo si conta una
volta provando ogni coltura matura; `count` dice quante se ne disegnano e una forma che non serve è spenta.
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
e le quote per cella di `dati/catalogo.js` (`alzato`) la campionano: l'eroe e i compagni salgono e scendono con `quotaPasso`.

## Casa, banco, bacheca, cespuglio: copia, non import

Come per il ponte: vengono dal Sotterraneo 3D (`mondo/kit.js:casa` col seme che dà il legno, `kit.js:bottega('erbe')`,
`ponti.js:bacheca`, `natura.js:GEO.cespuglio`) ma sono **copie piccole** in `scena3d/dal-sotterraneo.js`, perché `kit.js` e
`natura.js` tirano dentro `suolo.js` → `motore/mondo-aperto.js` (i dati di tutto il mondo di sopra) e i materiali con la nebbia
dell'esplorazione: nel gruppo `fattoria3d` finirebbe mezzo sotterraneo. Cambia lo stile (niente trame, colori nei vertici, flat
shading e la palette della fattoria) e le misure (casa 4×3, banco e bacheca 2×1), la forma è la stessa. I file del sotterraneo non si
toccano. Il cespuglio ha i vertici in grigio (luce e ombra) e il verde lo mette l'istanza come prima (`terreno.js`, `_ostacoli`).
- **La casa** ha il camino e `userData.fumo`: il terreno ci fa uscire una fumata ogni ~0,9 s (`Terreno.muovi(dt, fx)`).
- **La bacheca** ha i foglietti a parte (`userData.mostraFogli(n)`): `pezzi.js` ne accende tanti quanti gli ordini aperti
  (ogni mezzo secondo) e scrive sul cartello «🧺 N pronti!» quando ce ne sono di consegnabili.

## Costruire trascinando

Si **trascina una carta dalla barra fino alla mappa** (verso l'alto; di lato scorre la barra) e al rilascio si
costruisce. Il fantasma sta 1,6 celle sopra il dito, verde se ci sta **e se bastano le monete** (`puoCompraEMettere` del
motore: posto, livello, prezzo), rosso se no; sulla carta c'è già il prezzo. **Si paga al rilascio, senza conferme**:
`compraEMetti` compra (se il pezzo non è già nel magazzino) e mette in un solo gesto, e se qualcosa non va non cambia niente
(«Servono 🪙 N»). Le conferme restano solo per i lotti di terreno e gli edifici unici, che costano tanto e dicono il prezzo.
Il magazzino (`📦 ×1`: pezzi già pagati, messi via) c'è ancora e un pezzo lì si mette gratis. Rilasciato sulla barra torna
nel magazzino (🪙 1); un rilascio non valido non perde niente. Un pezzo già messo si riprende **trascinandolo** (in
costruzione) o **tenendolo premuto mezzo secondo** (fuori: vibra, compaiono la griglia e la fascia «📦 metti via»); spostarlo
costa 🪙 1. **Il vassoio si chiude da solo**: un tocco vero sulla mappa (sotto i 16 px, non una strisciata) che non cade su un
edificio o un lotto da comprare lo chiude; la ✕ c'è lo stesso. Nessun «annulla».

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
  pezzo, un albero o un sasso (si rifà a ogni cambio, `ridisegnaErba`), più quelli fuori dal mondo;
- **vento**: i ciuffi ondeggiano nel vertex shader (fase per ciuffo, raffiche) e il grano maturo si piega di una decina di gradi;
- **scintille e fumo**: solo nei momenti del gioco (semina, raccolto, acquisto, fumo dei forni), non a ciclo continuo.
Prima di questo non si vedeva niente: i ciuffi solo fuori dal mondo (sottili e dello stesso verde del prato), il vento del grano muoveva la punta di 5 cm.

- Il motore sta in piedi con **molte cose** perché campi, alberi, sassi, ciuffi, strade e recinto sono a istanze: ~100–260 draw call
  e ~20–50k triangoli con una sola ombra a 1024 (misurato in Chrome senza schermo, SwiftShader: i ms non dicono niente
  del telefono). **Da misurare su un telefono vero.**
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
