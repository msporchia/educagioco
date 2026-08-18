# Il banco degli sprite

Da qui escono gli atlanti dei giochi: **un PNG solo, in base64, dentro un
modulo generato** che non si scrive a mano.

| bersaglio | attrezzo | dove finisce |
|---|---|---|
| `fattoria` | `atlante.py` | [`src/giochi/fattoria/dati/atlante.js`](../../src/giochi/fattoria/dati/atlante.js) |
| `sotterraneo` | `atlante.py` | [`src/giochi/sotterraneo/dati/atlante.js`](../../src/giochi/sotterraneo/dati/atlante.js) |
| `castello` | `terreni.py` | [`src/giochi/castello/dati/atlante.js`](../../src/giochi/castello/dati/atlante.js) |

**Due attrezzi, un formato solo.** `atlante.py` ritaglia figure — una figura
la si dichiara e si prende, il nome conta — mentre `terreni.py` ritaglia
mondi a griglia, dove di una tessera bisogna anche sapere *come si attacca
alle vicine*, e quello non si dichiara: si misura. Quello che scrivono è lo
stesso modulo, perché la testa la scrive `catalogo.py` per tutti e due.

Per quale gioco sia un foglio **lo dice il foglio**, nel suo foglietto
(`"bersaglio": "sotterraneo"`), come già dichiara la propria geometria.
Un attrezzo solo e un comando solo apposta: due script che leggono la
stessa cartella finiscono, prima o poi, con un atlante e una tabella che
non combaciano più — e quel guasto si presenta come uno sprite sbagliato
a schermo, cioè tardi.

```bash
python3 strumenti/sprite/atlante.py              # rifà tutti i bersagli
python3 strumenti/sprite/atlante.py sotterraneo  # solo quello
python3 strumenti/sprite/atlante.py --provini    # ...e un foglio da guardare
python3 strumenti/sprite/attori.py <file> gatto  # porta dentro un animale nuovo
```

Serve `pillow`. Il generatore legge le coordinate passando da `node`, che
è già una dipendenza del repo.

## Guardare quello che c'è

```bash
npm run mondo                      # il banco dei mondi, e si apre da solo
npm run mondo -- --host            # e si apre anche dal telefono
```

Va bene **un server qualsiasi** — quello sopra parte in un secondo e non
vuole niente di installato; `npm run dev` fa lo stesso e in più ricarica da
sé quando tocchi un file. Col doppio click invece no: Chrome non lascia
importare dei moduli da `file://`, ed è lo stesso motivo per cui
`poc/eroi.html` vuole un server.

`strumenti/banco/mondo.html` **non ha un elenco dentro**: importa i moduli
veri e disegna quello che ci trova. Aggiungere uno sprite e rilanciare
`atlante.py` basta perché compaia lì, e non c'è niente da aggiornare a mano
che possa restare indietro.

La pagina ha **due metà**, che sono le due estremità dello stesso tubo.

### «il mondo» — quello che esce

Il campo di prova, con l'atlante che il gioco spedisce davvero. A sinistra
le **voci**: una voce è *una cosa* — la fontana coi suoi tre fotogrammi di
fianco, la bambina coi suoi tre versi — non un pezzo dell'atlante. Uno
sprite fermo su un fondo a scacchi non dice se funziona: un cane si giudica
mentre cammina, un oggetto appoggiato accanto a un altro.

Quattro attrezzi, perché sono quattro le domande diverse:

| | il gesto | la domanda a cui risponde |
|---|---|---|
| **posa** | tocca la voce, tocca il campo | il piede cade dove deve? sborda sopra chi gli passa davanti? |
| **pennello** | si trascina | come sta **una zona** d'erba — le varianti le sceglie il posto, come in partita |
| **strada** | si traccia il cammino | i gomiti e gli innesti li sceglie `componiPercorso`, **il risolutore vero**: se qui non chiude, non chiude nemmeno in gioco |
| **guida** | tocca chi cammina, poi dove va | le pose stanno insieme solo **in movimento** — `lato` che guarda dalla parte giusta, il piede che non salta girandosi |

Più tre scene che si costruiscono da sole — *tutto accostato*, *la
serpentina*, *chi cammina* — e **confronta i fogli**, che mette in fila
quello che il filtro mostra, alla scala vera, una riga per provenienza: è la
domanda «questi due pezzi vengono dallo stesso set?», che è quella che
scopre uno stile che non combacia prima di trovarselo in un prato.

### «i ritagli» — quello che entra

Il foglio sorgente col suo foglietto, e i quattro numeri di ogni ritaglio
disegnati sopra. Serve perché i fogli generati da un modello hanno sempre
gli stessi quattro difetti: il rettangolo **taglia**, il rettangolo **prende
troppo**, due disegni diversi finiscono in **un gruppo solo** (e il gioco li
fa lampeggiare uno nell'altro credendoli fotogrammi), dentro il ritaglio
giusto resta **della roba che non c'entra**.

Scegliere una voce **ci va sopra e ingrandisce**, col vicinato attorno: a
foglio intero un ritaglio da 52×57 px sta in mezzo centimetro, e nessuna
mano ci tira dentro un buco. Il vicinato serve perché un rettangolo si
allarga fin dove comincia il vicino, e il vicino bisogna vederlo.

| gesto | cosa fa |
|---|---|
| trascini dentro il rettangolo | lo sposti |
| tiri uno degli 8 angoli | lo stringi da quel lato |
| frecce (shift = la misura) | un passo per volta, quando il trascinamento è arrivato vicino |
| **buca** + trascini | un `cancella`: tutto il resto del foglio si spegne, perché si può bucare solo dentro il ritaglio scelto |
| **ritaglio nuovo** + trascini | prendi qualcosa che nessuno ritagliava |
| il **+** su due o più voci, poi **unisci** | `bandiera0`, `bandiera1`, `bandiera_asta` diventano una cosa sola, **nell'ordine in cui le hai segnate** |
| **sdoppia** | il contrario: un gruppo che erano due cose diverse |
| i quattro menù di *com'è fatto* | famiglia, giri, specchia, e se i pezzi **scorrono** o **sono alternative** — ognuno può tornare a «come il prefisso» |

Poi «salva il foglietto» lo riscrive, e si rilancia `atlante.py`. C'è anche
una spia che di solito non si pensa ad accendere — **quello che nessuno
prende**: i pixel del foglio fuori da ogni rettangolo, tinti. Non risponde a
«questo ritaglio è storto», risponde a «quanta roba non ho mai ritagliato».

Dall'altra metà si arriva qui col tastino **✎** su ogni voce: si vede sul
prato che un pezzo è storto, e da lì si va dritti al suo rettangolo senza
doversi ricordare in quale dei tredici fogli stia.

Il PNG **non si tocca mai**: vedi `STANDARD.md`. Le correzioni sono dato nel
foglietto, e buttare via tutto il generato e rifarlo dà lo stesso risultato
al pixel. I fogli del castello compaiono nell'elenco spenti, perché lì i
ritagli non sono dichiarati: `terreni.py` li **misura** dall'alfa, e non c'è
nessun rettangolo da spostare.

## Aggiungere roba

**Una tessera** — una panchina, un albero, una fontana — è **una riga** in
[`dati/tessere.js`](../../src/giochi/fattoria/dati/tessere.js):
`nome: [colonna, riga, larghezza, altezza]`, contate sul foglio sorgente.
Poi si rilancia il generatore. Quel file è **l'unico posto dove esistono
delle coordinate**: questo script le legge da lì e non ne tiene una copia,
e il gioco parla solo di nomi.

**Un attore** — chiunque cammini — non ha nemmeno quella: si mette il png
in `attori/` e basta. Il formato è fisso e il generatore lo trova da sé:
16×32, quattro fotogrammi per riga, bande a passo 32 (giù, di lato, su).
Le pose di lato guardano **a destra**; la sinistra è la stessa specchiata.

Se il file arriva da un generatore di immagini non sarà mai già in quella
misura — è un ingrandimento, spesso JPEG, su fondo bianco. Ci pensa
`attori.py`, che misura il passo fra le bande per ricavare la scala invece
di indovinarla, toglie il fondo **allagando dai bordi** (non per colore:
un cane bianco ha addosso lo stesso bianco della carta) e solo dopo riduce
i colori.

## Le sorgenti sono qui, ed è voluto

`sorgenti/` è versionata. Sono meno di 900 KB di roba CC0, e **un atlante
che non si rigenera da un clone è un atlante che prima o poi si rompe**.

- `sorgenti/gfx/` e `armm1998-zelda-like.zip` — *Zelda-like tilesets and
  sprites* di **ArMM1998**, CC0 1.0,
  <https://opengameart.org/content/zelda-like-tilesets-and-sprites>.
  Attenzione: il CC0 è dichiarato **sulla pagina**, dentro lo zip non c'è
  nessun `License.txt` — questa cartella è la prova di provenienza, e per
  quello ci sta anche lo zip pristino accanto alla cartella estratta.
- `sorgenti/0x72/` — *16×16 DungeonTileset II* di **0x72**, CC-0,
  <https://0x72.itch.io/dungeontileset-ii>: è l'atlante del sotterraneo.
  Le coordinate stanno in `pezzi.json`, che incrocia il `tile_list_v1.7`
  distribuito dall'autore dentro lo zip; le carte di provenienza (da
  quale mirror, con quale sha256, e l'HTML della pagina itch salvato il
  giorno del download) stanno in `PROVENIENZA.txt`. Il ragionamento per
  esteso — cosa contiene, e soprattutto **cosa non contiene** — è in
  [`poc/SPRITE.md`](../../poc/SPRITE.md).
- `sorgenti/bobtail-generato.jpeg` e `sorgenti/arciera-generata.jpeg` —
  generati con Gemini nel formato di `character.png`, che è quello che i
  generatori di immagini restituiscono se glielo si fa vedere. Il
  riferimento di stile da mettergli davanti è
  `poc/scatti/riferimento-stile.png`.

Il set di ArMM1998 **non contiene un solo animale**, controllati tutti e
otto i file: tutte le bestie della fattoria arrivano da lì, generate. Il
perché, e cosa manca ancora, stanno in [`poc/fattoria.md`](../../poc/fattoria.md).
