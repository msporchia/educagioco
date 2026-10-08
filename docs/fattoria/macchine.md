# Le macchine, i recinti e la fila

Cosa lavora nella fattoria: l'elenco con le ricette, come un recinto si
legge da lontano, e la fila che lascia caricare più pezzi. I dati stanno in
`dati/catalogo.js` (le voci) e `dati/coltivazioni.js` (`RICETTE`); se questa
tabella e il codice non vanno d'accordo, vince il codice.

## Macchine e recinti sono la stessa cosa

Dai da mangiare, aspetti, ritiri: stessi verbi, stessi gettoni e stessa
fila sul prato ([come-si-tocca.md](come-si-tocca.md)). Un recinto non è
una meccanica nuova, quindi non c'è niente di nuovo da imparare né per chi gioca né per chi legge il
codice. Tutti rincarano a ogni copia (`cresce: RINCARO`), nella fascia
«una struttura» (🪙95–360, mai sopra le due ore di esercizi).

### Le macchine

| macchina | 🪙 | liv | ricette (livello, se dopo la macchina) |
|:--|--:|--:|:--|
| 🌾 mulino | 150 | 4 | mangime · pastone (11) · farina (17) |
| 🏚 fienile | 150 | 6 | foraggio di carote · becchime (9) · foraggio (13) · fiorume (44) · fiorume col concime (52) |
| 🧵 telaio | 170 | 16 | stoffa |
| 🍞 panificio | 180 | 17 | pane · torta (20) · merenda, crostata (50) |
| 🧀 caseificio | 200 | 20 | burro · formaggio |
| 🍲 pentolone | 150 | 23 | beverone · zuppa (27) · zuppa d'orto (33) · pastura (39) |
| 🍳 cucina | 210 | 25 | minestrone · polenta · conserva (39) · salsa (44) |
| 🏭 zuccherificio | 230 | 31 | zucchero · caramelle (46) · marmellata (51) |
| 🍦 gelateria | 240 | 34 | succo · gelato · frullato (53) |
| 🍝 pastificio | 260 | 37 | pasta · biscotti (38) · pizza (46) · lasagne (48) |
| 🧥 sartoria | 250 | 42 | maglione · sciarpa di lana (48) · berretto (56) |
| 💜 tintoria | 300 | 55 | tintura · maglione alla lavanda · sapone · sacchetto |
| 🍟 friggitoria | 300 | 58 | patatine · fritto · arancini (61) |
| 🍣 sushi bar | 340 | 62 | sushi · maki (63) |

- **La farina non arriva prima del panificio**: farina senza panificio è
  roba che riempie la dispensa e non serve.
- **Il caseificio sdoppia il latte**, che era l'unico prodotto di recinto
  con un'uscita sola, e arriva due livelli dopo le mucche: il latte deve
  prima essere una cosa che si ha.
- **La torta** (farina ✚ uova ✚ burro) è la prima ricetta che mette insieme
  tre catene.
- **Il maglione e il maglione alla lavanda sono merci**, non addobbi: la
  tintoria prende un maglione e ne rende un altro, e chi lo vuole è la
  sarta. `sciarpa_lana` e non `sciarpa`, perché `sciarpa` è l'addobbo
  comprato: una si compra e una si tesse.
- **Il sapone sta nella tintoria** (tinozze e vapore, un mestiere solo)
  invece che in una bottega a parte: con quattro ricette si sta dentro il
  tetto, e si evita un edificio.

### I recinti

| recinto | 🪙 | liv | prende → dà | min |
|:--|--:|--:|:--|--:|
| 🐰 conigliera | 95 | 7 | 2 🥬 foraggio → 🧶 lana | 14 |
| 🐔 pollaio | 130 | 9 | 2 🌰 becchime → 🥚 uova | 8 |
| 🐑 ovile | 190 | 14 | 1 🥬 foraggio → 🧶 lana | 8 |
| 🐄 stalla | 220 | 18 | 2 🥬 foraggio → 🥛 latte | 10 |
| 🦆 stagno delle anatre | 240 | 24 | 1 🪣 beverone → 🥚 uova | 6 |
| 🐖 porcile | 260 | 28 | 2 🥘 zuppa → 🍄 tartufi | 20 |
| 🐐 capre | 280 | 40 | 1 🍃 pastura → 🥛 latte | 12 |
| 🐝 arnie | 300 | 45 | 2 🌼 fiori → 🍯 miele | 12 |
| 🦙 alpaca | 330 | 47 | 1 🥬 foraggio → 🧶 lana | 5 |
| 🫏 asini | 355 | 52 | 2 🌰 becchime → 💩 concime | 10 |
| 🐟 peschiera | 360 | 57 | 2 🌰 becchime → 🐟 pesce | 15 |

`peschiera` e non `laghetto`, che è già una decorazione. Il pesce va nel
silo della stalla con le uova.

## Riusare un id, o farne uno nuovo

**Quando il disegno è lo stesso si riusa l'id**: orto, carretto del
vicino, fienile e mercato erano decorazioni e sono diventate cose che
lavorano — stesso id, stesso prezzo, stesso disegno — e chi se le era
comprate per bellezza se le ritrova utili, senza niente da migrare.
**Quando c'è un disegno apposta si fa una voce nuova**: `panificio` e non
`forno` (che è il «Forno a legna» da 🪙75), `arnie` e non `apiario`.
L'osteria usa lo sprite `rosticceria`, ma la voce si chiama `osteria`
perché è il mestiere dell'oste.

**Spostare una ricetta di macchina è una migrazione gratis**: una
lavorazione in corso è un id di ricetta dentro la cosa, quindi quella
partita ieri finisce e si ritira, e la prossima vuole la macchina nuova —
il consiglio lo dice per nome. Così sono passate le quattro cose cotte dal
fienile al pentolone e la merenda dal mulino al panificio.

## Un recinto si legge da lontano

- **Sei stati dichiarati** — calmo, fame, mangia, felice, dorme, pronto — e
  in mappa si vede la faccia di adesso (`stati` nel catalogo). È la ragione
  per cui un bambino attraversa la fattoria e sa già dove deve andare.
- **Chi il ritratto ce l'ha lo usa, chi non ce l'ha mostra quello calmo**:
  una riga di `dati/catalogo.js`, non un elenco di eccezioni per specie. Le
  specie dell'orto hanno tre ritratti, e le due posizioni mancanti non
  servivano: *felice* dura un battito d'occhi, *pronto* ha già il 🧺.
- **Chi ha fame lo dice con un fumetto disegnato dalla scena**, in pixel di
  schermo (cresce con lo zoom), con dentro la merce che quel recinto sta
  aspettando davvero (`cosaVuole` nel motore). Provato il fumetto dipinto
  nello sprite: non poteva dire il vero quando le ricette cambiavano (due
  bestie che volevano lo stesso foraggio lo mostravano con due disegni),
  era di dieci pixel, e si portava dietro una macchia del generatore. Chi
  ha fame mostra il ritratto calmo, e i `_fame` sono usciti dal foglio.
- **Il motore consegna una faccia già decisa** (`{ pezzo, testo }`), non il
  nome di una merce: `scena/tela.js` non sa cosa sia il foraggio.
- **Una macchina al lavoro dice cosa sta facendo**: nel fumetto la faccia
  della merce, con la clessidra nell'angolo — che distingue «sto facendo
  questo» da «voglio questo» di un recinto affamato.
- **Gli animali dei recinti non camminano**: un recinto è un disegno che
  cambia stato. Farli girare vorrebbe un attore a quattro direzioni per
  specie (vedi [da-fare.md](da-fare.md)).

## La fila

Come in Hay Day: **una macchina lavora un pezzo alla volta e ne tiene
altri in fila**, così si caricano tre pasti prima di andare a dormire.
Vale per tutte, recinti compresi. Numeri e ragioni in `dati/coda.js`.

- **Un posto di partenza** (`POSTI_DI_PARTENZA`), gli altri si comprano
  **per macchina** fino a sei (`POSTI_MASSIMI`): 🪙20 · 40 · 80 · 160 · 320
  (`PRIMO_POSTO`, `RINCARO_DELLA_FILA`). La fila è autonomia, e l'autonomia
  si compra. È l'unica curva esponenziale della fattoria, ammessa perché
  ha un tetto: il quinto posto costa meno di un'ora di esercizi, e
  `guastiDellaFila` tiene tutto sotto le due ore. Chi vuole andare più
  svelto compra un'altra macchina: due macchine vanno il doppio, una fila
  lunga lascia solo caricare di più.
- **La roba e le monete si prendono mettendo in fila**: una fila è una
  scorta, non una promessa. A schermo quello che è
  in fila ci resta, come in Hay Day: toccarlo dice quanto manca, non si
  toglie più (il motore sa ancora `togliDallaFila`, e rende tutto).
- **Il pronto aspetta sulla macchina** e occupa il suo posto, come il
  vassoio di Hay Day; la fila continua a lavorare. Si ritira tutto insieme,
  quello che ci sta nel silo: un silo pieno ferma il ritiro, mai quello che
  sta lavorando.
- **Il tempo è per pezzo e in fila**, anche a telefono spento: si
  ricalcola dall'ora, come i campi.
- **Il salvataggio**: `cosa.coda = [{ ricetta, da }]`; `deserializza` legge
  ancora il vecchio `cosa.lavoro` come una coda di uno. `fila` conta gli
  ingrandimenti comprati, e valgono un posto a testa sopra quello di
  partenza; una fila più lunga dei posti di oggi lavora fino in fondo e
  poi si torna ai posti pagati (`unita/coda-fattoria`).
- A schermo: toccata la macchina, la fila compare sul prato sotto di lei
  (chi lavora con l'anello, chi aspetta più chiaro, i vuoti tratteggiati, il
  posto da comprare col «+» e il prezzo — [come-si-tocca.md](come-si-tocca.md));
  da lontano il fumetto con la faccia di quello che sta facendo e un
  numerino per i pronti; l'albero dice «⏳ ne fa 2, pronto fra 4 min».
