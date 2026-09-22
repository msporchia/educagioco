# Scheda di prompt — un foglio di edifici

Il metodo: si allega **un'immagine di base già fatta bene** e si dice
«nello stesso stile di questa». La scheda dice tutto quello che il
generatore altrimenti inventa: misura, vista, fondo, ombra, tavolozza,
appoggio, griglia. Il perché sta in
[`docs/fattoria-albero.md`](../../../../../docs/fattoria-albero.md), §6.

Il prompt usato **si conserva nel foglietto** del foglio che ne esce
(campo `prompt`, proposto in `FORMATO.md`): copiarlo e cambiare la riga
dell'oggetto è il modo di rigenerare un pezzo nello stesso stile.

## Cosa allegare

`edifici.png` intero (1536×1024): ha il fienile, il mulino a vento e il
silo, cioè gli edifici accanto a cui i nuovi devono stare. Se il
generatore accetta un'immagine sola piccola, il ritaglio col fienile
(`fienile0`, riga in alto, terzo da sinistra) e il mulino a vento
(`mulino_vento`, terza riga, primo).

## Il prompt

Le parti fra parentesi quadre si riempiono; il resto si manda così.

> Disegna un foglio di sprite in pixel art **nello stesso stile di questa
> immagine**: stessa tavolozza (legno caldo, tegole rosse e blu, pietra
> grigia, verde dei cespugli ai piedi), stesso contorno scuro di un pixel,
> stessa vista — facciata frontale vista da tre quarti dall'alto, come gli
> edifici allegati — e stessa luce da in alto a sinistra.
>
> Il foglio è 1536×1024 px, su **fondo trasparente** (PNG). Disponi
> **[N] edifici** su una griglia dichiarata di [4] colonne × [2] righe,
> celle di [384×512] px, ognuno centrato nella sua cella e appoggiato al
> bordo di sotto della cella lasciando 32 px di margine. Nessun edificio
> tocca il bordo della cella. Ogni edificio è largo circa 256 px e alto
> fra 220 e 290 px (nel gioco diventa 64×56–72 px: una cella del gioco
> sono 16 px, l'edificio occupa 4 celle di larghezza).
>
> Ogni edificio è **appoggiato a terra** sul proprio bordo inferiore, con
> un filo d'erba o di fiori ai piedi come negli originali. **Niente ombra
> proiettata**, niente macchia scura sotto, niente terreno disegnato:
> l'ombra la fa il gioco. Niente scritte né insegne con parole.
>
> Da sinistra a destra, riga per riga:
> 1. [descrizione in una riga]
> 2. [descrizione in una riga]
> …

## Quello che manca oggi, già scritto

Otto edifici, cioè **due fogli da quattro**: sopra i quattro per riga
di 1536 px ognuno scende sotto i 256 px di larghezza e i dettagli del
mestiere — il telaio sotto la tettoia, le forme sulla mensola — non si
leggono più a sessantaquattro pixel. La lista intera, con i ripieghi che
usano intanto, sta in
[`docs/fattoria-albero.md`](../../../../../docs/fattoria-albero.md), §6.

**Primo foglio** (`edifici_2.png`, 4 colonne × 1 riga, celle 384×1024 —
oppure 2×2 con celle 768×512 se il generatore non regge una riga sola):

> Da sinistra a destra:
> 1. una tettoia di legno a un solo spiovente, sotto un telaio a mano
>    con la stoffa a righe tesa e una matassa di lana appesa alla trave
> 2. una casetta col tetto rosso e un forno di pietra a cupola incassato
>    nella facciata, il fuoco acceso dentro, uno sbuffo di fumo dal
>    comignolo e tre pagnotte sul davanzale
> 3. una casetta bianca col tetto verde, tre forme di formaggio gialle
>    su una mensola davanti alla porta e un bidone del latte di metallo
>    appoggiato accanto
> 4. una casetta bassa di pietra col tetto grigio e la porta doppia
>    aperta, dentro si vedono scaffali con sacchi e barattoli — questa è
>    **più piccola delle altre**: larga circa 128 px invece di 256

**Secondo foglio** (`edifici_3.png`, stessa griglia):

> Da sinistra a destra:
> 1. una tettoia aperta di pali con un grande pentolone di rame sul
>    fuoco, il vapore che sale e un mestolo di legno appoggiato al bordo
> 2. una tettoia aperta di legno con un piano di lavoro, due fornelli a
>    fuoco vivo, pentole e mestoli appesi a una trave e un ceppo con le
>    verdure tagliate
> 3. una casetta col tetto blu e una vetrina, dentro la vetrina un
>    manichino con un maglione crema, e sopra la porta un'insegna con
>    delle forbici (nessuna parola)
> 4. una casetta col tetto viola, davanti due tinozze di legno piene
>    d'acqua color lavanda e un filo teso con due stoffe viola stese ad
>    asciugare

## Le misure, spiegate

- **1536×1024 e scala 4** è la forma di `edifici.png`: il foglietto
  dichiara `"scala": 4` e `"foglio": [384, 256]`, e i ritagli si scrivono
  già divisi per quattro.
- **256 px di larghezza** diventano 64 px, cioè quattro celle da 16: il
  piede che `piedeDalDisegno` ricava è `[4, 2]`, lo stesso del fienile.
  Per un edificio da due celle (la dispensa) si chiede largo 128 px.
- **La griglia dichiarata** serve al foglietto: con le celle regolari
  `da` e `cella` si scrivono senza misurare, e se il generatore non la
  rispetta lo si vede subito col banco dei ritagli (`npm run mondo`).
- **Niente ombra** è la richiesta che finora nessun generatore ha
  rispettato: se la disegna lo stesso, `"ombra": true` nel foglietto la
  toglie — ma solo su fondo magenta, non su fondo trasparente. Per gli
  edifici il fondo trasparente è preferibile perché i cespugli ai piedi
  hanno il verde che sul magenta si scontorna male; se l'ombra arriva, si
  corregge con `cancella`.

## Il foglietto che ne esce

```json
{
  "__": "Gli edifici delle botteghe: telaio, panificio, caseificio…",
  "prompt": {
    "scheda": "PROMPT-edificio.md",
    "base": "edifici.png",
    "generatore": "[quale, e quando]",
    "testo": "[il prompt intero, così com'è stato mandato]"
  },
  "scala": 4,
  "fondo": "trasparente",
  "foglio": [384, 256],
  "cella": [96, 128],
  "famiglia": "figura",
  "sprite": {
    "telaio":     { "da": [0, 0] },
    "panificio":  { "da": [1, 0] }
  }
}
```

Con la griglia rispettata `cella` è la cella della griglia (divisa per
quattro) e `da` si conta in celle. Se il generatore l'ha ignorata si torna
a `"cella": [1, 1]` e a coordinate in pixel, come in `edifici.json`.
