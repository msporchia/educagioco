# Personalizza: l'interfaccia unica, i mock

Tre modi di mettere in fila la stessa cosa (vestire il contadino, l'eroe del
sotterraneo, il cane della fattoria), da provare col dito **prima** di scrivere
il componente vero. Si guarda `mock.html` sul telefono: è un file solo, senza
rete, con le foto 3D dei modelli veri del gioco dentro.

| File | Cosa |
|---|---|
| `mock.html` | il mock da aprire (generato: non si tocca a mano) |
| `mock.sorgente.html` | dove si scrive il mock: le tre varianti, i tre temi |
| `scenari.js` | i dati dei tre scenari (schede, oggetti, forme, colori, prezzi) e le pose da fotografare |
| `studio.html`, `studio.js` | lo studio di posa: costruisce i modelli del gioco e li fotografa da otto lati |
| `fai.mjs` | fotografa e compone `mock.html`; `--scatti` lo fotografa a 390×844 |

```bash
node poc/personalizza/fai.mjs                 # compone mock.html (foto dalla cache, se c'è)
node poc/personalizza/fai.mjs --foto          # rifà le 120 pose × 8 lati (una decina di secondi)
node poc/personalizza/fai.mjs --scatti --tocca 'Cappelli,Cilindro'   # tmp/scatti/personalizza-*.png
```

Il contadino e gli eroi vengono da `develop` (lì hanno «Chi sei», taglio e
barba): `fai.mjs` estrae `src/` di quel ramo in `tmp/sorgente-develop/`. Il
beagle e gli addobbi vengono da questo ramo (i colori degli addobbi stanno
solo qui). Servono `node_modules` (Vite, three, Playwright).

## Le esigenze

1. **Girare la figura a 360°**, con le frecce e trascinando il dito sull'anteprima.
2. **Scegliere l'oggetto**: un cappello, un'arma, un abito, un addobbo del cane.
3. **Personalizzarlo**: il colore e la forma (varianti dello stesso oggetto:
   tesa larga o stretta, un taglio di capelli).
4. **Una scheda per le caratteristiche fisiche** (pelle, capelli, barba) e i
   **gruppi** per gli oggetti (cappelli, vestiti, armi, addobbi).
5. **Pochi tocchi**, facili per un bambino di 5–12 anni.
6. **Pagare** la personalizzazione, l'oggetto o un set intero: si prova
   prima, si paga solo con «Acquista e indossa»; quello del livello dopo si
   vede ma non si prende; la valuta è quella del gioco (🪙 o 💎).
7. **Una struttura sola**, cambia il tema: legno caldo (fattoria), scuro e
   oro (sotterraneo), prato (animali).

Vincoli: mai emoji al posto di un oggetto o di un personaggio (dove manca la
foto c'è un riquadro grigio «foto 3D»); mai «sesso», si dice «Chi sei» coi
nomi (Contadina, Maga, Guerriera…); ✕ sempre in alto a destra e niente
indietro in basso; bersagli da 44 px; le schede vanno a capo, niente
scorrimenti di lato; trascinare l'anteprima non scorre la pagina; chi si è
sta dentro l'anteprima, non in una riga a sé.

## Il mock

In cima una barra **del mock** (non dell'interfaccia): lo scenario
(Contadina, Eroe, Cane), la variante (A, B, C), il tema (quello suo o un
altro: la stessa struttura in legno, scuro, prato), il **contatore dei
tocchi** con lo zero, «da capo» (rimette monete e cose possedute) e ▴ per
nasconderla. Un trascinamento sull'anteprima conta un tocco.

Le foto: 120 pose fotografate da 8 lati (ogni 45°), una per ogni pezzo
cambiato da solo rispetto alla figura di serie, più i set. Se si cambiano due
cose insieme (cilindro **e** stivali rossi) il mock mostra la posa più
vicina e lo dice con l'etichetta «foto più vicina»: il componente vero
disegnerà il modello dal vivo.

Prezzi e livelli sono **inventati** per il mock, dentro la fascia di ogni
gioco: non sono una taratura.

## Le tre varianti

**A · un foglio solo.** Dall'alto: testa (titolo, saldo, ✕), anteprima
(un terzo dello schermo, si gira), le schede, **le righe dell'oggetto aperto**
(Forma con le foto, Colore con le pastiglie), la griglia degli oggetti che
scorre, il fondo che paga. Aprendo una scheda è già aperto l'oggetto che si
ha addosso; toccando un altro oggetto lo si prova e le righe diventano sue.
Nella scheda Aspetto le righe sono tutte aperte (pelle, taglio, colore,
barba) e non c'è griglia.

**B · a passi.** 1. scegli (schede e griglia grande, niente anteprima) →
2. lo vedi grande al centro e lo giri (tasto «Forma e colore») → 3. forma e
colore → 4. il conto («Ti restano…») e «Acquista e indossa». ‹ in alto a
sinistra torna di un passo; i pallini in testa dicono a che passo si è.

**C · la figura fissa e il cassetto.** L'anteprima prende tutto lo spazio
sopra; sotto un cassetto (la maniglia lo alza e lo abbassa) con le schede e la
griglia. Toccando un oggetto lo si prova e il cassetto diventa **la sua
pagina** (forma e colore più grandi, «‹ Cappelli» per tornare).

### Quanti tocchi

Contati dal foglio appena aperto (sulla prima scheda), fino a quando la cosa è
addosso e pagata. Si rifanno col contatore del mock.

| Flusso | A | B | C |
|---|---|---|---|
| Cambiare colore a un cappello che si ha (colore già tuo) | **2** (Cappelli, colore) | 4 (Cappelli, Cappello, Forma e colore, colore) | 3 (Cappelli, Cappello, colore) |
| …lo stesso con un colore da pagare | **3** (+ Acquista e indossa) | 7 (+ Fatto, Acquista, Acquista nel conto) | 4 |
| Provare e comprare un cappello nuovo | **3** (Cappelli, Cilindro, Acquista) | 4 (+ il conto) | **3** |
| Cambiare pelle e taglio dei capelli | **3** (Aspetto, pelle, taglio) | 6 (Aspetto, Pelle, colore, ‹, Capelli, taglio) | **3** |
| Comprare un set intero | **3** (Set, il set, Acquista) | 4 (+ il conto) | **3** |
| Guardarlo da dietro | 1 trascinamento, o 4 frecce | come A, ma solo dal passo 2 | come A |
| Confrontare due cappelli | 2 (uno, l'altro) | 4 (‹ fra l'uno e l'altro) | 3 (‹ fra l'uno e l'altro) |

### Pro e contro

| | Pro | Contro |
|---|---|---|
| **A** | Meno tocchi in tutti i flussi; niente di nascosto: oggetti, forme e colori insieme, si confronta toccando; un livello solo, niente «dove sono?» | L'anteprima è più piccola (un terzo); le righe che compaiono spingono giù la griglia; con molte forme (sette tagli) la griglia sotto resta corta |
| **B** | Una cosa per schermata: la più facile da leggere per i più piccoli; il conto è una pagina a sé, impossibile comprare per sbaglio; l'anteprima del passo 2 è la più grande | Il doppio dei tocchi; al passo 1 la figura non si vede; per cambiare due cose si torna indietro; «Fatto» e «Acquista» in due passi confondono (ho già comprato?) |
| **C** | La figura è sempre grande e sempre lì; la pagina dell'oggetto ha bersagli più grandi; il cassetto alto lascia vedere molti oggetti | Un livello in più (la pagina dell'oggetto) da cui tornare con ‹; confrontare due oggetti costa un tocco in più ciascuno; la maniglia è un gesto che i piccoli non scoprono da soli |

**Consiglio A.** Vince o pareggia ogni flusso, e soprattutto non nasconde
niente: un bambino di cinque anni vede l'oggetto, le sue forme e i suoi colori
nello stesso momento e impara toccando, senza ricordarsi dove stava. B è
chiara ma lenta e spezza il gesto «provo, provo, provo» in passi; C è bella ma
ogni ritorno con ‹ è un tocco che non decide niente
([interfaccia.md](../../docs/core/interfaccia.md), «un tocco altrove chiude»).
Da C prenderei una cosa sola: la maniglia per alzare la griglia quando gli
oggetti sono tanti, se A risultasse stretta.

## I prezzi

Le regole che il mock segue, da confermare (sono la domanda 2):

- **L'oggetto si compra una volta** e resta; con lui vengono **la forma e il
  colore di base**.
- **Chi compra prende l'oggetto nel colore che sta provando**: niente doppio
  conto al primo acquisto («cilindro viola» costa quanto il cilindro).
- **Un'altra forma** ha il suo prezzo (la tesa larga 6 🪙, il cappello
  stellato 30 💎); **un altro colore** dopo costa poco e una volta sola per
  oggetto (`prezzoColore`: 4 🪙 nella fattoria, 3 🪙 agli addobbi, 25 💎 nel
  sotterraneo, come il tintore). Un colore speciale può avere un prezzo suo
  (i capelli di fantasia, gli stivali bianchi).
- **Le caratteristiche fisiche sono gratis** (pelle, taglio, colore naturale
  dei capelli, barba): cambiare chi si è non si paga. Si pagano solo i colori
  di fantasia, come già in `develop`.
- **Un set** costa meno della somma dei pezzi che mancano, e mai più di loro
  (`min(prezzo del set, somma)`): chi ha già metà set paga solo il resto. Il
  fondo lo dice: «il set 30 (invece di 42)».
- **Bloccato** (livello non raggiunto): il gettone è tratteggiato e grigio con
  «liv. 12»; si può **provare** (lo si vede addosso), ma il tasto dice «Dal
  livello 12» ed è spento.
- **Poche monete**: il tasto dice «Ti mancano 7 🪙» ed è spento.
- **Quello che è tuo si mette subito**, senza conferme; quello da pagare resta
  «in prova» (bordo blu) finché non si preme «Acquista e indossa». «Com'era»
  toglie la prova. Chiudendo con la ✕ la prova non pagata sparisce.

## I gruppi

| Gioco | Schede |
|---|---|
| Fattoria | Chi sei · Aspetto (pelle, capelli: taglio e colore, barba) · Cappelli · Vestiti (maglia, gonna o salopette, stivali, collo) · Set |
| Sotterraneo | Chi sei (Maga, Mago, Elfa, Elfo, Guerriera, Cavaliere, Nana, Nano) · Aspetto · Testa · Armi · Set |
| Animali | In testa · Sul muso · Al collo · Set (niente «Chi sei»: la bestia è una) |

Al massimo cinque schede, così stanno in una riga a 390 px; una sesta va a
capo (mai di lato). Le forme raggruppano oggetti che oggi sono separati: il
cappello di paglia, la tesa larga e il cowboy sono **un** «Cappello» in tre
forme; il cappellino, il cilindro e quello da elfo del cane sono un
«Cappello»; gli elmi del sotterraneo uno «Elmo».

## Cosa serve al componente Vue

Un componente (`Personalizza.vue`) che non sa niente di cappelli: il gioco gli
dà i dati e il disegno dell'anteprima, e riceve le scelte.

- **`tema`**: `fattoria` | `sotterraneo` | `animali` (solo variabili CSS).
- **`titolo`**, **`valuta`** (`{ simbolo, saldo }`), **`livello`**.
- **`chi`**: `[{ id, nome }]` e quello scelto (la scheda «Chi sei» c'è se sono più di uno).
- **`schede`**: `[{ id, nome, tipo: 'chi'|'tratti'|'oggetti'|'set', posti | tratti }]`.
- **`oggetti`**: per id, `{ nome, posto, tratto?, prezzo?, liv?, prezzoColore?,
  forme: [{ id, nome, prezzo?, liv?, colori? }], colori: [{ id, nome, css, prezzo?, liv? }],
  nomeForme?, per? }` (forme e nome possono dipendere da chi si è).
- **`set`**: `[{ id, nome, prezzo, pezzi: { posto: 'oggetto/forma/colore' }, per? }]`.
- **`posseduti`**: le chiavi `o`, `o/f`, `o:c` (o `o/f:c` se i colori sono della forma).
- **`indossato`**: `{ posto: 'oggetto/forma/colore' }`.
- **La foto di un gettone**: una funzione `foto(posto, valore) → url` (il
  gioco la fa col suo servizio di anteprime: la figura con quel pezzo, o
  l'oggetto da solo come gli addobbi) e un **taglio** per posto
  (`[ingrandimento, cx, cy]`: la testa per i cappelli, i piedi per gli stivali).
- **L'anteprima**: uno slot che riceve lo stato provato e l'**angolo** (0–359,
  a scatti di 45° con le frecce, continuo col dito), e lo disegna dal vivo.
- **Eventi**: `prova(posto, valore)`, `paga(prova)` (il componente calcola il
  conto con le regole sopra e lo mostra; il gioco scala le monete e salva),
  `chi(id)`, `chiudi`.

Il conto (le regole dei prezzi) sta in un file puro accanto, da provare con
le unità; nel mock è `costo()` in `mock.sorgente.html`.

## Domande aperte

1. **La variante**: A (consigliata), oppure C per la figura più grande?
2. **I prezzi**: va bene «l'oggetto una volta, la forma e il colore a parte,
   il primo colore incluso, le caratteristiche fisiche gratis, il set scontato
   sul resto»? E il colore si paga una volta per oggetto (nella fattoria) o di
   nuovo a ogni cambio, come il tintore del sotterraneo?
3. **I pezzi bloccati**: si possono provare addosso (come nel mock) o si
   vedono soltanto nel gettone?

E poi, minori: «Chi sei» resta la prima scheda o va in fondo (si cambia una
volta sola)? Le frecce girano di 45° (otto scatti per un giro) o di 90°?
Chiudendo con una prova non pagata, si chiede «la vuoi?» o si toglie e basta
(come nel mock)?
