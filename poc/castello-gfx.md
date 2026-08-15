# Il castello con gli sprite — stato del lavoro

*15 agosto 2026. Il prototipo è [`castello-gfx.html`](castello-gfx.html), si
apre col doppio click. Questo file dice cosa c'è, cosa manca e cosa è stato
deciso, così chi riprende fra due settimane — o quando gli sprite ci saranno
davvero — non deve rileggere mille righe per capire a che punto era.*

## La domanda, e la risposta

**Il tower defense, disegnato con degli sprite invece che coi poligoni, è
più carino?** Il verdetto, dopo aver visto il prototipo: *«in genere non c'è
nemmeno paragone, è tutt'altro mondo»*. Si va avanti.

È un ribaltamento di una decisione precedente, e vale la pena dire perché.
La stima fatta **prima** di guardare i fogli diceva che non conveniva: il
costo non era il codice ma il contenuto — trenta sagome di torre, dieci
bestie, un castello — e per i personaggi restava valido il ragionamento del
tetto della resa (scrivere una primitiva a mano costa minuti, disegnarla in
un editor costa secondi: due ordini di grandezza, e nessuno dei due li ho).

Quello che ha cambiato il conto è **il foglio generato**: le torri arrivano
già disegnate a tre stadi, e i rami hanno la loro figura. Il contenuto che
sembrava il collo di bottiglia si genera.

## Cosa c'è già

- **`poc/castello-gfx.html`** — il campo giocabile: 12×18 tessere, strada a
  griglia, piazzole, quattro famiglie di torre che salgono di stadio e
  scelgono il ramo, nemici che camminano e torri che sparano. L'atlante sta
  dentro il file in base64: nessun server, doppio click. Il tasto **vetrina**
  mette tutte le famiglie sul campo insieme, ed è il modo più veloce per
  dire «questa sì, questa no».
- **`strumenti/sprite/torri.py`** — l'estrattore dei due fogli. **È
  provvisorio**, vedi sotto.
- **`src/grafica/atlante.js`** e **`src/grafica/tessere.js`** — il motore,
  **predisposto e non agganciato a niente**: il castello gira esattamente
  come prima. `atlante.js` sa posare una figura sul suo piede, specchiarla e
  dire quale ingrandimento intero ci sta; `tessere.js` sa *quale* tessera va
  in una cella guardando i vicini — strade, pozze, recinti — e gira in Node,
  quindi si prova senza browser (`unita/tessere`, 32 controlli).
- **`src/grafica/tela.js`** — una sola aggiunta: `mondo.passoIntero`, che
  ferma la telecamera sugli ingrandimenti interi. Nessuno lo dichiara oggi.

## Le tre cose che il prototipo ha messo alla prova

**1. La scala, ed è il prezzo più alto.** La pixel art vuole ingrandimenti
interi: a 1,4 volte i pixel si sfrangiano, e sfrangiato è più brutto di
piccolo. Oggi la telecamera del castello prende qualunque scala fra 0,62 e
1,5 e incornicia il mondo dove c'è posto. Con gli sprite si rinuncia a
riempire lo schermo fino all'ultimo pixel: resta un margine. `passoIntero` è
il posto dove quella rinuncia è scritta.

**2. La strada gira ad angolo retto.** Le tessere sono a griglia; il
percorso del castello è una spezzata smussata (Chaikin, in
`grafica/geometria.js`) che non conosce griglie, ed è **l'unico posto dove
gioco e disegno devono essere d'accordo**. Due strade:

- *texturizzare la curva* — si tiene il tracciato di adesso e si dipinge la
  striscia col motivo preso dall'atlante. Ibrido, nessun impatto sulle
  regole, resa da verificare;
- *rifare i tracciati a griglia* — più bello, ma cambia la **lunghezza** dei
  percorsi, quindi il bilanciamento, quindi va rilanciato `npm run tara`.

Non è stata decisa. È il primo bivio quando si riprende.

**3. I mostri non ci sono.** Nei due fogli non c'è un solo nemico. Nel
prototipo camminano dei golem presi in prestito dalle torri, e si vede che
sono in prestito. Servono **dieci bestie**: slime, fantasma, pipistrello,
ragno, golem, drago, goblin, orco, scheletro, arpia.

## Cosa manca

### 1. Gli sprite, generati bene

Le famiglie del castello combaciano quasi una a una con le colonne del
foglio, rami compresi — ed è la scoperta che ha cambiato il conto:

| torre | base | ramo | ramo |
|---|---|---|---|
| `add` Arciere | Archer | cecchino → Sniper | raffica → Rapid Fire |
| `sub` Magica | Magic | veleno → Poison | catena → Lightning |
| `mul` Ghiaccio | Frost | bufera → Arcane | brina → Frost |
| `div` Bomba | Bomb | mortaio → Artillery | napalm → Fire |

Manca il quinto tipo, mancano i mostri, e manca il castello da difendere
(nel prototipo è una torre riciclata).

**L'unità è una tessera da 32 px**, e le torri stanno in scala con quella.

### 2. Il foglietto, al posto dell'estrattore a occhio

`atlante.py` non indovina più niente: legge il `.json` accanto alla sorgente
(`strumenti/sprite/FORMATO.md`) e ignora i fogli che non ce l'hanno.
`torri.py` è la strada vecchia, e sbaglia come sbagliano le euristiche —
**in silenzio**: sei torri escono con un pezzo di scacchiera addosso, e i
nomi dei terreni sono quelli che gli abbiamo dato contando le figure a
occhio, non quelli delle figure (`erba-alta` è un lastricato, `cespuglio1`
è acqua).

Quello che manca al foglietto per descrivere questo foglio è che le griglie
sono **due**, e nessuna ha il passo uguale alla cella. Le misure prese:

    torri     12 colonne a passo 117,33 px, tre bande: y 4-115, 115-245,
              245-380 (secondo foglio: 44-120, 120-193, 193-268)
    terreni   celle da 74 px a passo 99 × 82, la prima a (10, 443)
    scala     74 → 32

### 3. I colpi restano procedurali, ed è una scelta

Nei fogli non c'è **nemmeno un proiettile**, né esplosioni né effetti. E lì
il procedurale non è un ripiego: un colpo si tinge col colore del ramo, si
allunga con la distanza percorsa, si ruota verso il bersaglio, e
l'esplosione si scala sull'area di quella torre lì. Un PNG non fa niente di
tutto questo senza moltiplicare i file.

Quindi la divisione è: **terreno e torri da sprite, colpi ed effetti
procedurali** (`grafica/castello/colpi.js` resta). L'unico lavoro: a
ingrandimento 2 o 3 un colpo con gradienti morbidi sopra un mondo di pixel
netti si vede che sta su un altro piano — va ridisegnato con la mano più
dura, raggi arrotondati al pixel e niente sfumature lunghe. È ritoccare quel
file, non riscriverlo.

## Come si aggancia, quando sarà il momento

Il castello ha già la forma giusta, ed è la ragione per cui tutto questo
costa poco: il gioco **descrive una scena** (`views/castello/scena.js`
produce `{ che: 'torre', x, y, tipo, lv, ramo }`) e la grafica ha **un
pittore per nome** (`grafica/castello/indice.js`). Fra i due passa solo la
lista.

Agganciare vuol dire riscrivere un pittore per volta perché posi uno sprite
invece di disegnare poligoni. La scena non cambia di una riga, il motore non
se ne accorge, e si può fare **una figura alla volta** — prima il fondale,
poi le torri, poi i mostri — con il gioco che resta giocabile a ogni passo.

L'ordine consigliato:

1. il **fondale** (`castello/fondale.js`): è già dipinto una volta sola e
   messo in cassaforte, quindi è il cambio più isolato che ci sia;
2. le **torri** (`castello/torri.js` + `cime.js`): qui si decide cosa fare
   della crescita continua, perché oggi il fusto si alza a ogni livello e
   con gli sprite i gradini diventano tre;
3. i **mostri** (`castello/mostro.js` + `corpi-mostri.js`), che è dove
   l'occhio guarda davvero, e quindi il pezzo che giustifica il resto.
