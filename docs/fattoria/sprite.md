# Gli sprite della fattoria

Come le cose della fattoria prendono il loro disegno: le facce delle merci,
le voci che aspettano un foglio, come si chiede un foglio nuovo e come si
calibrano gli addobbi. Gli strumenti stanno in `strumenti/sprite/`
(`LEGGIMI.md`, `FORMATO.md`); i fogli e i loro foglietti in
`strumenti/sprite/sorgenti/fattoria/generati/`.

## Le merci hanno una faccia

- **Ogni merce dichiara il suo `pezzo` dell'atlante** (`PRODOTTI` in
  `dati/coltivazioni.js`) e lo disegna `viste/Merce.vue`, il fratello di
  `Provino.vue`. La stessa faccia compare nel fumetto sopra un recinto,
  sullo scaffale del silo, sui tasti delle ricette e nella scheda di un
  campo. Un'emoji la disegna il telefono: stile Apple in mezzo alla pixel
  art, non si tinge, e in un fumetto piccolo non si distingue da un'altra
  della stessa tinta.
- **L'emoji resta il ripiego dichiarato**: permette di aggiungere una
  merce *prima* del suo disegno invece di aspettare un foglio per scrivere
  una riga di tabella.
- **Prima di far disegnare, guardare cosa c'è**: `dati/atlante.js` ha
  cinquecento pezzi e il catalogo ne cita duecento. Nove delle prime
  quattordici merci avevano già la faccia nell'atlante (le casse del
  raccolto, la balla di fieno, la bottiglia del latte).
- Oggi **una merce sola usa il ripiego**: la parmigiana (🍆), che aspetta `merce_parmigiana`.

## Una voce che aspetta il suo disegno

Prima si decide l'albero, poi si generano gli sprite. Una voce nata prima
del suo foglio **dichiara in `aspetta` il pezzo che arriverà** e intanto
usa un ripiego (una tettoia, il paiolo, l'emoji). `guastiDelCatalogo` e
`guastiDelleColture` diventano rossi il giorno che il pezzo c'è e la riga
non l'ha preso: nessuno deve andarselo a cercare.

Oggi aspettano solo due cose (vedi [da-fare.md](da-fare.md)): i ritratti
della **peschiera** (`aspetta: 'recinto_pesci_calmo'`) e gli **addobbi al
collo e sulla schiena**.

## Chiedere un foglio

- **Il metodo è un'immagine di base allegata** — l'ultimo foglio buono —
  più la frase «nello stesso stile di questa», e una scheda che dice tutto
  quello che il generatore altrimenti inventa: misura, vista, fondo,
  ombra, tavolozza, appoggio, griglia. Le schede sono
  `PROMPT-edificio.md`, `PROMPT-merce.md` e `PROMPT-bestia.md` accanto ai
  fogli; i prompt ancora da mandare stanno in `PROMPT-secondo-albero.md`.
- **Il prompt si copia nel campo `prompt` del foglietto nello stesso
  momento in cui si salva il PNG** (`FORMATO.md`): la finestra di chat non
  lascia un file, e rimandarlo vuol dire perderlo. Per `merci_2` ed
  `edifici_3` è andato perso: si rigenera dalla scheda e dalle descrizioni
  qui sotto.
- **Le merci si chiedono a sei per foglio**: sopra i sei il generatore
  stringe gli oggetti e i dettagli spariscono a venti pixel. Nel gioco una
  merce è larga 20–30 px.
- **Il fondo.** Il primo foglio di merci era su magenta (#e0197d), una
  tinta che nessun oggetto ha, e si scontornava da solo; il generatore
  disegnava lo stesso una macchia d'ombra (il fondo *scurito*), che ha
  voluto `"ombra": true`. I fogli dopo sono trasparenti — il magenta
  vietava il viola della lavanda — e alcuni tornano con un alone attorno
  a ogni figura, che toglie `"alone": 128`.
- **Gli edifici** vengono a scala 4 (a 1248×832 in griglia 4×2 misurano
  241–271 px, cioè 60–68 px di gioco: il fienile ne fa 78). Niente
  scritte né insegne con parole, niente terreno sotto: l'ombra la fa il
  gioco.
- **Un disegno nuovo per una cosa già posata si rimette con `misura` alla
  misura di prima**: il piede lo ricava `piedeDalDisegno`, e un ingombro
  che cresce sotto una cosa ferma romperebbe le fattorie salvate. Così la
  dispensa sta a 45 px (piede [3, 2]), bancarella e carretto ai 53 e 41 px
  di prima, la piazzola della mongolfiera a 52.
- Il pentolone disegnato ha un fotogramma solo, e ha perso l'animazione
  del paiolo di ripiego.
- Dopo ogni foglio: `python3 strumenti/sprite/atlante.py fattoria`, poi
  `npm run mondo` per guardare i ritagli.

### Le descrizioni di `merci_2` (prompt non conservato)

Nello stile di `merci.jpg`: un oggetto solo per riquadro, di fronte e un
po' dall'alto, su fondo trasparente, senza ombra.

| pezzo | descrizione |
|:--|:--|
| `merce_stoffa` | rotolo di stoffa a righe crema e blu, un lembo srotolato |
| `merce_farina` | sacco di tela chiaro aperto, con la farina bianca che trabocca |
| `merce_burro` | panetto di burro giallo su un piattino, con un pezzo tagliato |
| `merce_formaggio` | forma di formaggio giallo con uno spicchio tagliato che mostra i buchi |
| `merce_minestrone` | scodella panciuta di terracotta con la minestra densa e i pezzi di verdura, un cucchiaio di legno sul bordo |
| `merce_polenta` | fetta spessa di polenta gialla su un tagliere, con una scaglia di formaggio che si scioglie sopra |

## I recinti e le bestie

- **Un recinto dichiara sei ritratti**, e chi non li ha mostra il calmo
  ([macchine.md](macchine.md)). I ritratti `_fame` sono usciti dal foglio
  (`animali.json`): il fumetto lo disegna la scena, e il file unico ha
  perso 47 KB.
- **Gli agganci degli addobbi si calibrano guardando, non contando**:
  l'alfa dice dov'è il riquadro, non dov'è la fronte. Nel banco degli
  sprite (`npm run mondo` → «i ritagli» → modo **agganci**) i quattro punti
  si trascinano sul fotogramma, con l'anteprima accanto che veste la bestia
  con la stessa formula del gioco; «salva il foglietto» li scrive, poi si
  rilancia `atlante.py`. Il provino di tutte le bestie nei tre versi, con
  gli agganci e gli addobbi posati, è `poc/scatti/agganci-fattoria.png`.
