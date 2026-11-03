# Personalizza: l'interfaccia unica, il mock

Il mock dell'interfaccia unica per vestire il contadino, l'eroe del
sotterraneo e il cane della fattoria, da provare col dito **prima** di
scrivere il componente vero. Si guarda `mock.html` sul telefono: è un file
solo, senza rete, con dentro le foto 3D dei modelli veri del gioco.

| File | Cosa |
|---|---|
| `mock.html` | il mock da aprire (generato: non si tocca a mano) |
| `mock.sorgente.html` | dove si scrive il mock: la struttura e i tre temi |
| `scenari.js` | i dati dei tre scenari (schede, oggetti, forme, colori, prezzi) e le pose da fotografare |
| `studio.html`, `studio.js` | lo studio di posa: costruisce i modelli del gioco e li fotografa da otto lati |
| `fai.mjs` | fotografa e compone `mock.html`; `--scatti` lo fotografa a 390×844 |

```bash
node poc/personalizza/fai.mjs                 # compone mock.html (foto dalla cache, se c'è)
node poc/personalizza/fai.mjs --foto          # rifà le 132 pose × 8 lati (una decina di secondi)
node poc/personalizza/fai.mjs --scatti --solo animali --tocca 'Cappello,Rosso'   # tmp/scatti/personalizza-*.png
node poc/personalizza/fai.mjs --scatti --tema scuro                              # gli scenari in un altro tema
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

## La struttura (v2)

Il primo giro aveva tre varianti (un foglio solo, a passi, figura fissa e
cassetto: commit `944cd566`); l'utente ha scelto la prima. Nel primo giro,
però, forma e colore comparivano **sopra** la griglia e spingevano tutto giù:
«ci sono cose che compaiono e scompaiono». Adesso **le zone non si muovono
mai**, dall'alto:

| Zona | Altezza | Cosa |
|---|---|---|
| testa | 52 px | titolo, saldo, ✕ |
| anteprima | 30%, almeno 140 px | la figura che si gira; dentro, chi si è (in alto a sinistra), le frecce ai lati e otto pallini per il lato |
| schede | 44 px, una riga | al massimo cinque |
| griglia | quello che resta | gli oggetti del gruppo; **l'unica cosa che scorre**, dentro la sua zona |
| pannello | 164 px, fisso | in ordine di dipendenza: l'oggetto scelto (il nome), la sua **Forma** (foto), il **Colore** di quella forma (pastiglie); nella scheda Set il tasto «Salva questo set» |
| fondo | 68 px | «Com'era» e «Acquista e indossa · N», o una riga di aiuto |

- **Un'interazione cambia solo le zone sotto.** La gerarchia va in un verso
  solo: scheda → oggetto → forma → colore → prezzo. Scegliere un colore non
  ricompone gli oggetti né le forme; scegliere una forma non cambia quali
  oggetti ci sono; cambiare scheda cambia tutto sotto e niente sopra.
  L'anteprima mostra il risultato e non decide niente. Le zone sopra possono
  cambiare **aspetto** (il gettone scelto evidenziato, la sua foto col colore
  nuovo), mai numero, ordine o posto degli elementi.
- **Le dipendenze le dichiarano i dati**, non l'ordine dei tocchi: le forme
  sono dell'oggetto (il Berretto ha berretto e bandana, il Cilindro nessuna),
  i colori sono della forma (il cappellino del cane e il cilindro hanno colori
  diversi), il prezzo è oggetto + forma + colore. Quando una scelta sopra
  rende impossibile quella sotto (un'altra forma senza quel colore), il sotto
  torna al primo valore dichiarato (il primo colore della forma); se il colore
  c'è anche nella forma nuova, resta.
- **Il pannello c'è sempre e ha sempre la stessa altezza.** Un oggetto con una
  forma sola non ha la riga Forma, e uno con un colore solo non ha la riga
  Colore: lo spazio resta, vuoto. «Nessuno» (niente cappello) lascia il
  pannello fermo e spento, con una riga sobria («Niente da scegliere»). Senza
  oggetto (Chi sei) dice cosa fare.
- **Il fondo è alto uguale** col tasto o senza.
- `fai.mjs --scatti --misura --tocca '…'` controlla la regola dopo ogni
  tocco: le zone non cambiano posto né altezza, un tocco nel pannello o nel
  fondo non muove i gettoni della griglia né le schede, un colore non muove le
  forme. Provata sui tre scenari con un oggetto a più forme (Cappello, Elmo),
  uno senza forme (Cilindro, Corona), «Nessuno», uno bloccato (Cowboy, Corona,
  Diadema, Martello), un acquisto e i set.
- **Aprendo una scheda il pannello mostra già l'oggetto che si ha addosso**
  (il cappello di paglia), così cambiargli colore è un tocco.
- **Toccare un oggetto** lo apre nel pannello e lo prova addosso; nella
  griglia ha il bordo pieno. Quello che si ha addosso ha il fondo colorato;
  quello in prova (da pagare) il bordo blu.
- **Aspetto** funziona come gli altri gruppi: nella griglia Pelle, Capelli,
  Barba; nel pannello il taglio (forma) e il colore.
- **La griglia non salta**: scegliendo resta dov'era; torna in cima solo
  cambiando scheda.
- Ne segue una regola per i dati: **al massimo sei forme e sei colori per
  oggetto**, perché le due righe del pannello stanno a 390 px senza andare a
  capo. Un oggetto con più colori va diviso (i capelli naturali e quelli di
  fantasia) o va ripensato.

L'anteprima mostra la posa fotografata più vicina, senza avvisi: il mock ha
le foto di un pezzo cambiato alla volta (e dei set). Per chi non ha pose sue
(l'Elfa con un elmo), il gettone mostra l'oggetto addosso a un altro eroe.
Il componente vero disegnerà la figura dal vivo.

Prezzi e livelli sono **inventati** per il mock, dentro la fascia di ogni
gioco: non sono una taratura.

### Quanti tocchi

Contati dal foglio appena aperto, sulla prima scheda (Chi sei; per il cane
«In testa»), fino a quando la cosa è addosso e pagata. Si rifanno col
contatore del mock.

| Flusso | Tocchi | Quali |
|---|---|---|
| Cambiare colore a un cappello che si ha (colore già tuo) | **2** | Cappelli, colore |
| …lo stesso con un colore da pagare | **3** | + Acquista e indossa |
| Provare e comprare un cappello nuovo | **3** | Cappelli, Cilindro, Acquista e indossa (per il cane 2: si apre già su «In testa») |
| Cambiare pelle e taglio dei capelli | **4** | Aspetto (Pelle è già aperta), pelle, Capelli, taglio |
| Comprare un set intero | **3** | Set, il set, Acquista e indossa |
| Guardarlo da dietro | **1** | un trascinamento (o 4 frecce, 45° l'una) |
| Confrontare due cappelli | **2** | uno, l'altro |
| Salvare quello che si ha addosso | **3** | Set, Salva questo set, Salva (col nome proposto; scriverne un altro apre la tastiera) |
| Ricambiarsi in un set salvato | **2** | Set, il set |
| Comprare un set del gioco e averlo addosso | **3** | Set, il set, Acquista e indossa |
| Rimettersi un set del gioco già comprato | **2** | Set, il set |

## I set

La scheda Set ha due gruppi, uno sotto l'altro nella griglia:

- **I miei set**: sei **posti fissi** per personaggio. Un posto pieno ha la
  foto della figura vestita e il nome; uno vuoto è tratteggiato col numero e
  «Libero». Toccare un set salvato lo indossa subito (un tocco) e lo apre nel
  pannello, con «Cambia nome» e «Togli» (che chiede un secondo tocco, «Tocca
  ancora: via»). I posti sono fissi perché salvare o togliere non deve
  cambiare numero né ordine dei gettoni sopra il pannello.
- **Set del gioco**: quelli da comprare, col prezzo (o «liv. N»); comprato, un
  set resta e si rimette con un tocco.

Il tasto **«Salva questo set»** sta sempre nel pannello della scheda Set.
Salva nel posto toccato, o nel primo libero; chiede il nome dentro il
pannello, in un campo con un nome già scritto («Il mio set 3», sedici
lettere al massimo), e si conferma con «Salva». Coi sei posti pieni il tasto
dice «I 6 posti sono pieni: toccane uno»: toccato un set, diventa «Salva al
posto di «Al rodeo»». Si salva quello che si ha addosso ed è tuo: una prova
non pagata non entra.

**Indossare un set salvato non costa niente.** Se un pezzo non si può
mettere (non è più tuo, o è di un livello che non hai) il gettone lo dice
(«1 manca») e il resto si indossa lo stesso («Indossato, tranne 1 pezzo»).

**Cosa tiene il gioco.** I set salvati sono **del personaggio** (i set della
Contadina non sono del Contadino; ogni eroe ha i suoi) e **di quel gioco**:
non passano dalla fattoria al sotterraneo. Per ognuno basta `{ posto, nome,
pezzi: { posto del corpo: 'oggetto/forma/colore' } }`, nella campagna del
gioco (`profile.campagne[<gioco>]`, come il resto: niente campi nuovi nel
profilo). I pezzi sono chiavi, non foto: la foto la rifà il gioco, e un pezzo
che sparisce dal catalogo si legge come «manca».

## I prezzi

Le regole che il mock segue, da confermare:

- **L'oggetto si compra una volta** e resta; con lui vengono **la forma e il
  colore di base**.
- **Chi compra prende l'oggetto nel colore che sta provando**: niente doppio
  conto al primo acquisto («cilindro viola» costa quanto il cilindro).
- **Un'altra forma** ha il suo prezzo (la tesa larga 6 🪙, il cappello
  stellato 30 💎); **un altro colore** dopo costa poco e una volta sola per
  oggetto (4 🪙 nella fattoria, 3 🪙 agli addobbi, 25 💎 nel sotterraneo,
  come il tintore). Un colore speciale ha il suo prezzo (i capelli di
  fantasia, gli stivali bianchi), anche al primo acquisto.
- Nel pannello il gettone di una forma porta il prezzo della forma, la
  pastiglia solo il prezzo del colore: il totale lo dice il tasto in fondo, con
  il dettaglio («Cilindro 18 + colore blu 4»).
- **Le caratteristiche fisiche sono gratis** (pelle, taglio, colore naturale
  dei capelli, barba); si pagano solo i colori di fantasia, come in `develop`.
- **Un set** costa il minimo fra il suo prezzo e la somma dei pezzi che
  mancano: chi ha già metà set paga solo il resto («30, invece di 42»).
- **Bloccato** (livello non raggiunto): tratteggiato e grigio con «liv. 12»;
  si può provare addosso, ma il tasto dice «Dal livello 12» ed è spento.
- **Poche monete**: il tasto dice «Ti mancano 7 🪙» ed è spento.
- **Quello che è tuo si mette subito**, senza conferme; quello da pagare resta
  in prova finché non si preme «Acquista e indossa». «Com'era» toglie la
  prova; chiudendo con la ✕ la prova sparisce.

## I gruppi

| Gioco | Schede |
|---|---|
| Fattoria | Chi sei · Aspetto (pelle, capelli, barba) · Cappelli · Vestiti (maglia, gonna o salopette, stivali, collo) · Set |
| Sotterraneo | Chi sei (Maga, Mago, Elfa, Elfo, Guerriera, Cavaliere, Nana, Nano) · Aspetto · Testa · Armi · Set |
| Animali | In testa · Sul muso · Al collo · Set (niente «Chi sei»: la bestia è una) |

Le forme raggruppano oggetti che oggi sono separati: il cappello di paglia,
la tesa larga e il cowboy sono **un** «Cappello» in tre forme; il
cappellino, il cilindro e quello da elfo del cane un «Cappello»; gli elmi del
sotterraneo un «Elmo».

## Cosa serve al componente Vue

Un componente (`Personalizza.vue`) che non sa niente di cappelli: il gioco gli
dà i dati e il disegno dell'anteprima, e riceve le scelte.

- **`tema`**: `fattoria` | `sotterraneo` | `animali` (solo variabili CSS).
- **`titolo`**, **`valuta`** (`{ simbolo, saldo }`), **`livello`**.
- **`chi`**: `[{ id, nome }]` e quello scelto (la scheda «Chi sei» c'è se sono più di uno).
- **`schede`**: `[{ id, nome, tipo: 'chi'|'tratti'|'oggetti'|'set', posti | tratti }]`.
- **`oggetti`**: per id, `{ nome, posto, tratto?, prezzo?, liv?, prezzoColore?,
  forme: [{ id, nome, prezzo?, liv?, colori? }], colori: [{ id, nome, css, prezzo?, liv? }],
  nomeForme?, per? }` (forme e nome possono dipendere da chi si è; al più sei
  forme e sei colori).
- **`set`**: `[{ id, nome, prezzo, pezzi: { posto: 'oggetto/forma/colore' }, per? }]`.
- **`posseduti`**: le chiavi `o`, `o/f`, `o:c` (o `o/f:c` se i colori sono della forma).
- **`indossato`**: `{ posto: 'oggetto/forma/colore' }`.
- **La foto di un gettone**: una funzione `foto(posto, valore) → url` (il
  gioco la fa col suo servizio di anteprime: la figura con quel pezzo, o
  l'oggetto da solo come gli addobbi) e un **taglio** per posto
  (`[ingrandimento, cx, cy, lato?]`: la testa per i cappelli, i capelli della
  maga visti da dietro).
- **L'anteprima**: uno slot che riceve lo stato provato e l'**angolo** (0–359,
  a scatti di 45° con le frecce, continuo col dito), e lo disegna dal vivo.
- **Eventi**: `prova(posto, valore)`, `paga(prova)` (il componente calcola il
  conto e lo mostra; il gioco scala le monete e salva), `chi(id)`, `salvaSet({ posto, nome })`,
  `indossaSet(posto)`, `rinominaSet`, `togliSet`, `chiudi`; e la prop `mieiSet` (sei posti).

Il conto (le regole dei prezzi) sta in un file puro accanto, da provare con
le unità; nel mock è `costo()` in `mock.sorgente.html`.

## Domande aperte

1. **I prezzi**: va bene «l'oggetto una volta, la forma e il colore a parte,
   il primo colore incluso, le caratteristiche fisiche gratis, il set scontato
   sul resto»? Il colore si paga una volta per oggetto (come nel mock) o a ogni
   cambio, come il tintore del sotterraneo?
2. **I pezzi bloccati**: si possono provare addosso (come nel mock) o si
   vedono soltanto nel gettone?
3. **Sei forme e sei colori al massimo** per oggetto: va bene come regola, o
   il pannello deve poter crescere (e allora la griglia sopra si accorcia)?

E poi, minori: «Chi sei» resta la prima scheda o va in fondo (si cambia una
volta sola)? Le frecce girano di 45° (otto scatti per un giro) o di 90°?
Chiudendo con una prova non pagata, si chiede «la vuoi?» o si toglie e basta
(come nel mock)?
