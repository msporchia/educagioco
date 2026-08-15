# Il banco degli sprite

Da qui esce l'atlante della fattoria: **un PNG solo, in base64, dentro
[`src/giochi/fattoria/dati/atlante.js`](../../src/giochi/fattoria/dati/atlante.js)**
— che è **generato** e non si scrive a mano — e dentro
`poc/fattoria-gfx.html`. Due bersagli e un comando solo apposta: due
comandi da ricordare vogliono dire, prima o poi, un atlante e una tabella
che non combaciano più, e quel guasto si presenta come uno sprite
sbagliato a schermo.

```bash
python3 strumenti/sprite/atlante.py              # rifà tutto
python3 strumenti/sprite/atlante.py --provini    # ...e un foglio da guardare
python3 strumenti/sprite/attori.py <file> gatto  # porta dentro un animale nuovo
```

Serve `pillow`. Il generatore legge le coordinate passando da `node`, che
è già una dipendenza del repo.

## Guardare quello che c'è

```bash
python3 -m http.server 8000        # dalla radice del repo
# http://localhost:8000/strumenti/sprite/anteprima.html
```

Va bene **un server qualsiasi** — quello sopra parte in un secondo e non
vuole niente di installato; `npm run dev` fa lo stesso e in più ricarica da
sé quando tocchi un file. Col doppio click invece no: Chrome non lascia
importare dei moduli da `file://`, ed è lo stesso motivo per cui
`poc/eroi.html` vuole un server.

`anteprima.html` **non ha un elenco dentro**: importa i moduli veri — atlante,
tessere, catalogo, ostacoli — e disegna quello che ci trova. Aggiungere uno
sprite e rilanciare `atlante.py` basta perché compaia lì, e non c'è niente da
aggiornare a mano che possa restare indietro.

In cima c'è il **campo di prova**: tocchi una carta e la cosa compare
sull'erba vera; da lì la trascini, o tocchi il prato e l'attore ci va
camminando. Uno sprite fermo su un fondo a scacchi non dice se funziona —
un cane si giudica mentre cammina, un oggetto appoggiato accanto a un
altro.

Sotto, mostra ogni attore nei tre versi più lo specchio, con la camminata in moto;
ogni voce del catalogo col suo codice, il prezzo, il piede e **le varianti
una accanto all'altra**; ogni ostacolo col conto costo/resa; e tutte le
tessere dichiarate, segnando quelle che non usa più nessuno. In cima elenca
i guasti che i dati trovano da soli. È il posto dove si dice «questo non va
bene» avendo davanti il codice da citare.

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
- `sorgenti/bobtail-generato.jpeg` e `sorgenti/arciera-generata.jpeg` —
  generati con Gemini nel formato di `character.png`, che è quello che i
  generatori di immagini restituiscono se glielo si fa vedere. Il
  riferimento di stile da mettergli davanti è
  `poc/scatti/riferimento-stile.png`.

Il set di ArMM1998 **non contiene un solo animale**, controllati tutti e
otto i file: tutte le bestie della fattoria arrivano da lì, generate. Il
perché, e cosa manca ancora, stanno in [`poc/fattoria.md`](../../poc/fattoria.md).
