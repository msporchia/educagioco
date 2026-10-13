# L'arredo del sotterraneo: gli orpelli

L'arredo non si tocca, non blocca e non vale niente: serve a far sembrare
che qui sotto ci abbia vissuto qualcuno. È disegnato più spento delle cose
che rispondono (`scena/tela.js`), e toccarlo dice solo cos'è.

**L'arredo non è un relitto.** I relitti (macerie, statue rotte, sarcofagi,
rocce) bloccano il passo e la luce e fanno parte del piano, non della
decorazione: stanno in [piani-caverne.md](piani-caverne.md#i-relitti). Nelle
grotte l'arredo perde le pose grandi (`fondo` e `coppia`: un altare, un trono o
due cavalieri di guardia non stanno in una caverna) e si posa solo dove la
cella è libera, quindi mai su un relitto.

## Gli orpelli sono una lista che può crescere

Ogni scenario ha la sua lista in `dati/orpelli.js` (cantine, cripta, fornace;
quella delle cantine è anche il ripiego di chi non dichiara lo scenario).
Un orpello è una riga: `pezzo` (il nome nell'atlante), `posa`, `epica`, `dice`
e, se fa luce, `arde`. **Un pezzo nuovo è una riga e il suo ritaglio nel
foglietto**: il motore non cambia, e `guastiDelleTessere` chiede all'atlante
ogni nome, la posa e il numero.

- **`posa`** è l'idea che il pezzo ha di come piazzarsi: `appeso` sulla fila
  di faccia (un bassorilievo, uno stemma), `posato` su un bordo della stanza,
  `angolo` in uno dei quattro angoli (colonne), `fondo` al centro della parete
  di fondo (un altare, un trono: uno solo per stanza), `coppia` due uguali ai
  lati della parete di fondo, uno di qua e uno di là (cavalieri di guardia).
- **`epica`**, da 1 a 10: quanto il pezzo fa «sala importante». Una panca è 1,
  un sarcofago 2–4, un cavaliere di guardia 5, un trono 8.

## Cosa c'è, per ambientazione

Ogni pezzo sta dove sta bene (le statue in una cripta, il legno in una cantina, il ferro e la brace in una fornace); le immagini vengono
da `sotterraneo_2.png`, `sotterraneo_5_2/5_3.png`, `scudi.png` e `arredo-cripta-2.png`, e **i pezzi dei fogli dipinti sono nitidi**
([../core/sprite.md](../core/sprite.md#i-pezzi-nitidi)).

- **Cantine**: botte sul cavalletto, scaffale, tavolaccio con la panca, pila di legna, macina, assi, panche, sgabello, scala a pioli
  (appesa al muro), tavolo, sedia, tavolino, tre candelabri e un candeliere, uno stendardo verde.
- **Cripta**: oltre a sarcofagi, cavalieri e colonne, gli **altari** (di legno, di pietra, col bassorilievo, d'oro: `fondo`), due **troni**
  (di pietra e di legno e velluto), **gargoyle e statue alate a coppie**, la statua nella nicchia, l'idolo con la luce viola, l'obelisco, la colonna
  col disco, i **bracieri** (viola e azzurro: non scaldano), i **cerchi di rune** (viola, verde) e il tappeto, l'arco d'edera, lo scaffale di libri
  e il leggio col libro aperto.
- **Fornace**: la panca, la fonte di ferro asciutta, il braciere, il bacino di lava (fa luce), la lanterna rossa, lo stendardo rosso.

**Regola del decoro** (dell'utente): niente che sembri da prendere o da spostare. Per questo non ci sono casse (la `cassa`
dipinta è stata tolta dalle cantine), sacchi, forzieri di decoro (`cripta-forziere` fa da forziere vero, vedi [roba.md](roba.md)); e **niente
di tenero o buffo** (la statua dello stregone col cappello di `scudi.png` resta nel foglio, senza pezzo).

## Il piano decide quanto è epica una stanza

`epicaDellaStanza` in `motore/livello.js`, da 0 a 10: l'ingresso è 0, una
stanza qualunque 1, il portale 2, la fonte e il tesoro 3 (4 se c'è la guardia),
la stanza della scala 4, e **dove sta un mostro grosso +5** (la sala del
trono). Si scende e sale un poco (fino a +2 ogni quattro piani).

`arredaLeStanze` dà a ogni stanza `1 + epica/3 + 0…2` pezzi (da uno a tre nelle
stanze qualunque, quattro-sei nella sala del mostro grosso) e li pesca fra gli
orpelli che **non sono più epici di lei** (peso `1 + epica`: quelli epici
escono più spesso dove possono stare). In una stanza epica (da 5) il primo
pezzo è sempre il pezzo forte, uno fra i più epici che le stanno. Mai due
volte lo stesso pezzo nella stessa stanza, mai davanti a una porta (si
rischia di chiuderla con una cassa), mai su altra roba, e un solo candelabro
acceso per stanza (le coppie a parte).

## Dove sta un pezzo, in una stanza che non è un rettangolo

Le pose guardano la roccia accanto, non il riquadro della stanza
([piani.md](piani.md#una-stanza-è-la-sua-mappa-di-celle)): `appeso` su una cella
con la roccia a nord, `angolo` con roccia da due lati che si toccano (anche una
colonna), `posato` con roccia da un lato qualunque, `fondo` in cima alla colonna
di celle del centro, `coppia` ai capi della fila più alta. Sempre dentro la
stanza (`dentro`), mai davanti a una porta.

## Cosa sapere

- **L'arredo ha il suo caso** (`rndArredo`, dal seme e dal piano): aggiungere
  orpelli o cambiare le regole qui non sposta mostri, forzieri e stanze di un
  piano già visto. Lo scenario arriva a `generaPiano` dalla corsa
  (`faiIlPiano`): nell'abisso cambia con i piani.
- **`r.pezzo` è già lo sprite dello scenario**: la tela non traduce più niente
  (`PEZZO_DI.arredo`). La frase di chi lo tocca si cerca nella lista dello
  scenario per `pezzo`.
- **Nei test**: `unita/sotterraneo` (5a e 5a bis: posa, epicità, coppie, porte,
  atlante, stesso seme) e `unita/tessere` (la lista di ogni scenario).
- **Il peso**: i 48 pezzi della cripta (`arredo-cripta-2.png`) stanno tutti
  nell'atlante, anche quelli che un piano non pesca spesso.
