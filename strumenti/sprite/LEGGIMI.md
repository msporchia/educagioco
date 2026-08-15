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
