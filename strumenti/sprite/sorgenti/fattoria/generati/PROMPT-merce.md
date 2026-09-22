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

## Quello che manca oggi, già scritto

Sedici merci, cioè **tre fogli** da sei, sei e quattro. L'ordine non è
casuale: ogni foglio tiene insieme le cose di una catena, così le
proporzioni fra loro restano giuste — un panetto di burro e una forma di
formaggio disegnati nello stesso foglio non escono della stessa misura.
La lista intera, coi ripieghi che usano intanto, sta in
[`docs/fattoria-albero.md`](../../../../../docs/fattoria-albero.md), §6.

**`merci_2.png` — il pane e il latte** (6 oggetti):

> Da sinistra a destra:
> 1. un sacco di tela chiaro aperto, con la farina bianca che trabocca
>    dalla bocca
> 2. due pagnotte tonde e dorate con il taglio a croce sopra
> 3. un panetto di burro giallo su un piattino bianco, con una fetta già
>    tagliata appoggiata accanto
> 4. una forma di formaggio giallo con uno spicchio tagliato che mostra
>    i buchi dentro
> 5. una torta rotonda a due piani con la glassa rosa e una fragola in
>    cima
> 6. una crostata rotonda con la griglia di pasta sopra e la confettura
>    di fragole che si vede rossa fra le strisce

**`merci_3.png` — il filo e il colore** (6 oggetti):

> Da sinistra a destra:
> 1. un rotolo di stoffa a righe crema e blu, con un lembo srotolato che
>    ricade davanti
> 2. un maglione piegato color crema con le trecce, le maniche ripiegate
>    sopra
> 3. lo stesso maglione piegato, ma tinto di **viola lavanda chiaro**,
>    bluastro e mai fucsia
> 4. un vasetto di vetro col tappo di sughero, pieno di tintura **viola
>    lavanda** (bluastra, lontana dal fondo)
> 5. tre saponette impilate, due color lavanda e una crema, con una
>    bollicina di schiuma sopra
> 6. un sacchettino di tela grezza chiuso da un nastro, con tre steli di
>    lavanda che escono dalla bocca

**`merci_4.png` — la cucina** (4 oggetti, celle più larghe):

> Da sinistra a destra:
> 1. una scodella panciuta di terracotta con la minestra densa e i pezzi
>    di verdura che spuntano, un cucchiaio di legno appoggiato al bordo
> 2. un barattolo di vetro con la salsa rossa e il tappo di metallo, un
>    pomodorino accanto
> 3. un vaso di vetro largo con gli ortaggi a pezzi sott'olio, a strati
>    viola, rossi e arancio
> 4. una fetta spessa di polenta gialla su un tagliere di legno, con una
>    scaglia di formaggio che si scioglie sopra

⚠ Nel terzo e nel quarto oggetto di `merci_3.png` il viola deve restare
**lavanda** — bluastro — e non avvicinarsi al magenta del fondo, se no
lo scontorno automatico si mangia il maglione. È l'unico caso in cui la
riga dell'oggetto deve parlare di tinte.

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
