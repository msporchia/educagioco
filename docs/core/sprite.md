# Gli sprite

Il giro degli sprite (fattoria, sotterraneo, castello): dai fogli
sorgente agli atlanti che il gioco spedisce, e il banco `npm run mondo`
per guardarli e correggerli. Per esteso, e da leggere prima di toccare un
foglio: `strumenti/sprite/LEGGIMI.md` (il giro e il banco, gesto per
gesto), `strumenti/sprite/FORMATO.md` (il foglietto, campo per campo),
`strumenti/sprite/STANDARD.md` (le regole dei fogli),
`strumenti/sprite/DA-GENERARE.md` (le immagini che mancano, coi prompt).

## Il giro

```
strumenti/sprite/sorgenti/<gioco>/generati/<foglio>.png + .json   ← «i ritagli» guarda qui
                          ▼
            atlante.py (figure) / vesti.py (il castello)
                          ▼
         src/giochi/<gioco>/dati/atlante.js                     ← «il mondo» guarda qui
         src/giochi/castello/dati/vestiti.js, figure.js
```

- **`atlante.py`** ritaglia figure, un bersaglio per gioco (un
  `atlante.json` per cartella di sorgenti). Il castello ne dichiara uno
  con `"attrezzo": "vesti"`, e `atlante.py` lo salta: c'era `terreni.py`,
  per il castello a tessere, tolto col suo visore il 29 settembre 2026.
- **`vesti.py --atlante`** fa pezzi e figure del castello — i vestiti
  delle carte dai fogli del terreno, le torri dal foglio delle torri
  (`torri-<n>.png`, il numero più alto), i mostri dai fogli del
  sotterraneo e dai passi di `cammino.py`;
  `righe.py <foglio> <provino>` conta righe e figure di un foglio a righe
  appena arrivato, e `vesti.py --provino-foglio` / `--provino` fanno i
  provini senza scrivere niente. **`cammino.py`** tiene di un video di
  Grok Imagine solo i passi di una creatura (sei di lato, sei di fronte):
  il video non si conserva, e i passi si portano alla misura della
  creatura in `vesti.py`. Tutti i comandi in [comandi.md](comandi.md).
- **Il PNG non si tocca mai.** La sorgente è la verità: un PNG ritoccato a
  mano non dice più cosa gli è stato fatto, e la correzione si perde il
  giorno che arriva un foglio migliore. Le correzioni sono **dato nel
  foglietto**: buttare il generato e rifarlo dà lo stesso risultato al
  pixel.

## Il banco — `npm run mondo`

Una pagina sola, `strumenti/banco/mondo.html`, con due metà che sono i due
capi dello stesso tubo.

- **«i ritagli» — quello che entra.** Il foglio sorgente coi rettangoli del
  foglietto sopra, da trascinare. I difetti dei fogli disegnati da un
  modello sono sempre quattro: il rettangolo **taglia**, **prende troppo**,
  due disegni finiscono sotto **un nome solo** (e il gioco li fa
  lampeggiare come fotogrammi), o dentro il ritaglio resta **roba che non
  c'entra**. In cima al pannello c'è **come uscirà** la cosa intera, in
  movimento: l'anteprima applica le stesse regole senza aspettare il
  generatore. Una riga gialla segna le voci toccate. I fogli del castello
  compaiono spenti: lì i ritagli li misurano `vesti.py` e `cammino.py`, non
  c'è niente da spostare.
- **«il mondo» — quello che esce.** L'atlante vero su un campo di prova,
  con quattro attrezzi: **posa** (il piede cade dove deve?), **pennello**
  (come sta una zona: le varianti le sceglie il posto), **strada** (le
  tessere le sceglie `componiPercorso`, il risolutore vero: se non chiude
  qui non chiude in gioco), **guida** (chi cammina, perché le pose stanno
  insieme solo in movimento). Più **confronta i fogli**, che mette in fila
  i pezzi alla scala vera per vedere se vengono dallo stesso set, e la ✎
  su ogni voce che porta al suo rettangolo nell'altra metà.

**Il giro completo è uno solo**: correggo nel banco → «salva il foglietto»
→ `atlante.py` → «il mondo». L'anteprima non serve al gioco: `atlante.py`
sì.

**Chi salva è un plugin di Vite `apply: 'serve'`**
(`strumenti/banco/salva-foglietto.js`): scrive solo `.json` dentro
`strumenti/sprite/sorgenti/`, e nel build non esiste. Un foglietto cambiato
da fuori mentre il banco è aperto vuole una ricarica a mano, apposta: la
pagina non si muove da sola mentre ci si lavora.

## Gli agganci

**Dove sta la testa di una bestia lo dice il suo foglietto** (`agganci`,
verso per verso, in frazioni del riquadro), non una tabella per specie:
`atlante.py` lo copia in `AGGANCI` dell'atlante della fattoria, e `puntiDi`
in `giochi/fattoria/dati/animali.js` legge foglietto → scheda → ripiego. Si
calibra a occhio nel banco («i ritagli» → modo **agganci**, trascinando i
cerchietti con l'anteprima vestita accanto) e si controlla in
`poc/scatti/agganci-fattoria.png`.
