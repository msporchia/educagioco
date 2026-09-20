# Scheda di prompt — un foglio di merci

Il metodo è quello di `PROMPT-edificio.md`: un'immagine di base allegata,
«nello stesso stile di questa», e la scheda che dice il resto. Il perché
sta in [`docs/fattoria-albero.md`](../../../../../docs/fattoria-albero.md),
§6.

Una merce si vede **solo dentro un riquadro** — il fumetto sopra un
recinto, lo scaffale del silo, il tasto di una ricetta — a venti pixel di
lato. Quindi: un oggetto solo, grande, riconoscibile dalla forma, senza
piano d'appoggio.

## Cosa allegare

`merci.jpg` intero (1568×648), oppure il ritaglio col nido di uova e i
gomitoli di lana (i due a sinistra): sono i due che si leggono meglio a
venti pixel.

## Il prompt

> Disegna un foglio di oggetti in pixel art **nello stesso stile di questa
> immagine**: stessa tavolozza calda, stesso contorno scuro, stessa vista
> — di fronte e un po' dall'alto — stessa luce da in alto a sinistra.
>
> Il foglio è 1536×640 px su **fondo magenta uniforme** (#e0197d, lo
> stesso dell'allegato), che non deve comparire in nessun oggetto.
> Disponi **6 oggetti** su una griglia dichiarata di 6 colonne × 1 riga,
> celle di 256×640 px, ognuno centrato nella sua cella. Ogni oggetto è
> largo circa 200 px e alto fra 160 e 220 px (nel gioco diventa 22–26 px:
> un oggetto solo, grande, che si riconosca anche a venti pixel).
>
> Ogni oggetto è **appoggiato**, visto da chi lo guarda dal banco, con la
> base che si vede. **Nessuna ombra** sotto l'oggetto, nemmeno leggera,
> nessun piano d'appoggio disegnato, nessun testo.
>
> Da sinistra a destra:
> 1. [descrizione in una riga]
> 2. [descrizione in una riga]
> …

## Le misure, spiegate

- **Sei per foglio, non dodici.** Sopra i sei il generatore stringe gli
  oggetti e i dettagli che li distinguono (il taglio del pane, i buchi
  del formaggio) spariscono a venti pixel. Due fogli da sei costano due
  prompt e rendono dodici oggetti buoni.
- **Il magenta** è la richiesta che rende lo scontorno una riga di
  foglietto (`"fondo": "auto"`) invece di un ritocco a mano, e vale a una
  condizione che è il foglio a garantire: quella tinta non compare in
  nessun oggetto. Per la tintura e il maglione alla lavanda il viola deve
  restare **lavanda** (bluastro), lontano dal magenta: va detto nella
  riga dell'oggetto.
- **Niente ombra**, e se arriva lo stesso `"ombra": true` la toglie
  guardando la tinta — è il motivo del magenta.
- **`misura`** riporta tutto alla scala del gioco: un oggetto largo
  200 px diviso per nove sono 22 px, cioè la larghezza di una cassa del
  raccolto. Le proporzioni fra gli oggetti sono quelle del foglio.

## Il foglietto che ne esce

```json
{
  "__": "Le merci della bottega: farina, pane, torta…",
  "prompt": {
    "scheda": "PROMPT-merce.md",
    "base": "merci.jpg",
    "generatore": "[quale, e quando]",
    "testo": "[il prompt intero, così com'è stato mandato]"
  },
  "fondo": "auto",
  "ombra": true,
  "colori": 0,
  "cella": [1, 1],
  "famiglia": "oggetto",
  "trasforma": { "merce": { "giri": 1, "specchia": false } },
  "sprite": {
    "merce_farina": { "da": [28, 200], "cella": [200, 220], "misura": [22, 24] }
  }
}
```

I rettangoli li misura lo scontorno del magenta, macchia per macchia
(`strumenti/sprite/misura.py --figure`), e si lasciano larghi tre pixel
per non tagliare l'orlo sfumato se il file arriva JPEG.
