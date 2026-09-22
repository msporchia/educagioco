# Scheda di prompt — un foglio di merci

Il metodo è quello di `PROMPT-edificio.md`: un'immagine di base allegata,
«nello stesso stile di questa», e la scheda che dice il resto. Il perché
sta in [`docs/fattoria-albero.md`](../../../../../docs/fattoria-albero.md),
§6.

Una merce si vede **solo dentro un riquadro** — il fumetto sopra un
recinto, lo scaffale del silo, il tasto di una ricetta, la colonna
dell'albero — a venti-trenta pixel di lato. Quindi: un oggetto solo,
grande, riconoscibile dalla forma, senza piano d'appoggio.

Il prompt si copia nel campo `prompt` del foglietto **nello stesso
momento in cui si salva il PNG**: di questa tornata se n'è conservato uno
su cinque, e gli altri quattro non ci sono più.

## Cosa allegare — **l'ultimo foglio buono**

Il primo foglio si allega a `merci.jpg` intero (1568×672), o al ritaglio
col nido di uova e i gomitoli di lana: sono i due che si leggono meglio
a venti pixel.

Dal secondo in poi si allega `merci_2.png`, che è già trasparente, già
alla misura giusta e già senza ombre — tre righe di prompt risparmiate,
e copiate meglio di come si spiegherebbero.

## Il prompt

> Disegna un foglio di oggetti in pixel art **nello stesso stile di questa
> immagine**: stessa tavolozza calda, stesso contorno scuro, stessa vista
> — di fronte e un po' dall'alto — stessa luce da in alto a sinistra.
>
> Il foglio è **1536×1024 px** su **fondo trasparente** (PNG). Disponi
> **6 oggetti** su una griglia dichiarata di **3 colonne × 2 righe**,
> celle di **512×512 px**, ognuno centrato nella sua cella. Ogni oggetto
> è largo circa **380 px** (nel gioco diventa 25–30 px: un oggetto solo,
> grande, che si riconosca anche a venti pixel).
>
> Ogni oggetto è **appoggiato**, visto da chi lo guarda dal banco, con la
> base che si vede. **Nessuna ombra** sotto l'oggetto, nemmeno leggera,
> nessun piano d'appoggio disegnato, nessun fondo dietro: sotto e
> attorno è tutto trasparente.
>
> **NESSUNA PAROLA SCRITTA, da nessuna parte**: né etichette sui
> barattoli, né lettere, né numeri.
>
> Quello che appartiene a un oggetto dev'essere **attaccato al suo
> disegno in un pezzo solo**: la farina versata tocca il sacco, la
> schiuma tocca la saponetta. Niente briciole che galleggiano lontane.
>
> Da sinistra a destra, riga per riga:
> 1. [descrizione in una riga]
> 2. [descrizione in una riga]
> …

## Le tre righe che erano sbagliate

**Il fondo magenta.** Era il rimedio a un generatore che l'alfa non la
sapeva fare: si chiedeva una tinta piatta e `"fondo": "auto"` la
scontornava. Adesso l'alfa torna pulita, e togliendo il magenta sparisce
anche l'unico avvertimento che la scheda doveva portarsi dietro — che il
viola della lavanda doveva restare bluastro, lontano dal magenta, se no
lo scontorno se lo mangiava. Una richiesta in meno e un vincolo sul
colore in meno.

**1536×640.** Non è una misura nativa di nessun generatore, e quello che
tornava era sempre qualcos'altro. **1536×1024 torna esatta.**

**Sei oggetti su una riga da 256 px.** Con la griglia 3×2 su celle da
512 ogni oggetto ha **quasi il doppio dei pixel** — 380 invece di 200 —
e i sei per foglio restano sei, che era il vincolo vero: sopra i sei il
generatore stringe gli oggetti e i dettagli che li distinguono (il
taglio del pane, i buchi del formaggio) spariscono a venti pixel.

## Come si guarda se è venuto bene

1. **La misura di gioco, che è la prova vera.** Si rimpicciolisce ogni
   pezzo a **20–29 px** e si guarda se si riconosce ancora. Un foglio
   bello che a ventisei pixel non dice niente è inutile: il bambino non
   vede mai il foglio.
2. **Accanto a quelle che ci sono già.** Le sei di `merci.jpg` stanno
   fra 20×20 e 29×23: una merce nuova che venisse 40 px sarebbe la più
   grande del granaio senza che nessuno l'abbia deciso.
3. **Un divisore solo per tutto il foglio.** Le proporzioni fra gli
   oggetti sono quelle del disegno, ed erano già giuste: rimetterne uno
   per conto suo vuol dire che un panetto di burro e una forma di
   formaggio escono della stessa misura.

## Quello che manca ancora

Fatte le sei di `merci_2.png` (stoffa, farina, burro, formaggio,
minestrone, polenta), ne restano **dieci**, cioè due fogli. L'ordine non
è casuale: ogni foglio tiene insieme le cose di una catena, così le
proporzioni fra loro restano giuste. La lista intera, coi ripieghi che
usano intanto, sta in
[`docs/fattoria-albero.md`](../../../../../docs/fattoria-albero.md), §6.

**`merci_3.png` — il filo e il colore** (6 oggetti):

> Riga di sopra, da sinistra a destra:
> 1. un maglione piegato color crema con le trecce, le maniche ripiegate
>    sopra
> 2. lo stesso maglione piegato, ma tinto di viola lavanda chiaro
> 3. un vasetto di vetro col tappo di sughero, pieno di tintura viola
>    lavanda
>
> Riga di sotto, da sinistra a destra:
> 4. tre saponette impilate, due color lavanda e una crema, con una
>    bollicina di schiuma sopra
> 5. un sacchettino di tela grezza chiuso da un nastro, con tre steli di
>    lavanda che escono dalla bocca
> 6. un vaso di vetro largo con gli ortaggi a pezzi sott'olio, a strati
>    viola, rossi e arancio

**`merci_4.png` — il forno** (4 oggetti, o sei aggiungendo due di
comodo):

> 1. due pagnotte tonde e dorate con il taglio a croce sopra
> 2. una torta rotonda a due piani con la glassa rosa e una fragola in
>    cima
> 3. una crostata rotonda con la griglia di pasta sopra e la confettura
>    di fragole che si vede rossa fra le strisce
> 4. un barattolo di vetro con la salsa rossa e il tappo di metallo, un
>    pomodorino accanto

Il vincolo sul viola «bluastro e mai fucsia» **non serve più**: era il
prezzo del fondo magenta, e il fondo magenta non c'è più.

## Il foglietto che ne esce

```json
{
  "__": "Le merci della bottega: stoffa, farina, burro…",
  "prompt": {
    "scheda": "PROMPT-merce.md",
    "base": "merci_2.png",
    "generatore": "[quale, e quando]",
    "testo": "[il prompt intero, così com'è stato mandato]"
  },
  "fondo": "trasparente",
  "colori": 0,
  "cella": [1, 1],
  "famiglia": "oggetto",
  "trasforma": {"merce": {"giri": 1, "specchia": false}},
  "sprite": {
    "merce_farina": {"da": [565, 101], "cella": [376, 388], "misura": [25, 26]}
  }
}
```

Niente `"ombra": true`: serviva sul magenta, e su un fondo trasparente
non c'è nessuna macchia da togliere. `"colori": 0` resta — sei oggetti
piccoli non pesano, e ridurre la tavolozza su un foglio per due terzi
trasparente sposta i colori dove non serve.

I rettangoli li misura `strumenti/sprite/misura.py --figure`, macchia
per macchia. Quando un oggetto viene in **più macchie staccate** — la
farina versata fuori dal sacco — si guarda prima se le piccole cadono
già dentro il riquadro della grande: quasi sempre sì, e allora un
rettangolo solo le prende tutte. Se no si allarga a mano, come fa
`forno_pizza` in `edifici.json` con lo sbuffo di fumo.
