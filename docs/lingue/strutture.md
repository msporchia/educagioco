# English a mondi — le strutture delle ultime isole

Le strutture del fortino d'inverno (la quarta) e del castello tra le
nuvole (la sesta: il passato, *going to* e i paragoni, che fino al 1°
ottobre 2026 stavano in quinta; perché si sono spostati in
[programma.md](programma.md)). Le strutture nuove della quarta (date,
*some/any*) e della quinta (strada, soldi, genitivo) sono descritte lì e in
[concetti.md](concetti.md). Qui cosa insegnano, cosa si è scelto sul programma e le forme dei verbi e degli
aggettivi nelle frasi. Il formato delle frasi è in [frasi.md](frasi.md), le
righe delle trappole in [trappole.md](trappole.md), il libro (che queste
strutture le usa da prima) in [libro.md](libro.md).

## Quarta: il presente

| tappa | struttura | frasi come |
|---|---|---|
| *Che ore sono?* (dopo la giornata) | `ora` | *what time is it? it's seven o'clock, lunch is at one o'clock* |
| *Gioco ogni giorno* (dopo ogni giorno e sport e musica) | `presente` | *I play tennis every day, I never drink milk, do you play the piano?* |
| *Lei gioca* (dopo i mestieri) | `terza-s` | *she plays tennis, the teacher reads a book, my brother goes to bed* |
| *Lui gioca?* | `does` | *does she play basketball? he does not drink milk, where does the cat sleep?* |
| *Che cosa stai facendo?* (dopo i mezzi) | `ing` | *I am eating, is he reading? a helicopter is flying in the sky* |

- **Una tappa di parole in più, «Sport e musica»** (*tennis, basketball,
  piano, guitar, violin, drum, trumpet, music, team*): senza, il presente
  non aveva niente da giocare o suonare, e *she plays* diceva solo *with*.
  Le parole erano nel 📦 della prima: si spostano, le chiavi restano.
  *Swimming* no: è anche *swim* con *-ing*, e la tessera avrebbe due chiavi.
- **`does` è una forma sua**, non la seconda tappa di `terza-s`: la regola
  da dire dopo uno sbaglio è un'altra («dopo does il verbo non prende la
  s»), e la trappola `does-con-s` pesa su di lei.
- **Il segno del presente** sono *every, always, never, sometimes* o *do*:
  *I play tennis* da solo potrebbe essere di qualunque tappa.

## Quinta: raccontare

| tappa | struttura | frasi come |
|---|---|---|
| *Ieri ero al parco* (dopo in città) | `was-were` | *I was at the park yesterday, were you at school?* |
| *Sono andato al castello* (dopo fuori città e i verbi che cambiano) | `passato` | *I went to the castle, did you go to the museum? I did not see the bridge* |
| *Ho giocato* | `passato-ed` | *I played tennis yesterday, did you help your mother?* |
| *Ha detto ciao* (dopo «Chi parla, chi ride») | `dire` | *Leo said hello, she told me her name, what did he say?* |
| *Quando fa freddo* | `quando` | *when it's cold I drink hot milk, I sing while I cook* |
| *Chi è più alto?* (dopo «Alto e veloce») | `paragoni` | *my brother is taller than me, the rocket is the fastest, it's the most beautiful castle* |
| *Domani andrò* | `going-to` | *I am going to swim tomorrow, are you going to play tennis on Saturday?* |

Quello che la sesta isola insegna: il passato di *be* e dei verbi, *going
to*, i paragoni. Cosa si è scelto dove era al limite:

- **Did c'è**: senza, il passato non ha né domande né negazioni, e *did you
  went* è l'errore più tipico. *Did* è il passato di *do* (in
  `dati/passati.js`), quindi è nota dove è noto il passato.
- **Said e told sì, il discorso indiretto no**: *she said that…* è della
  scuola media. Restano *say qualcosa* e *tell a qualcuno*, che servono al
  libro per raccontare, con l'errore tipico *she said me* (`said-told`) e
  *told to me* (`told-to`). *Say* e *tell* sono verbi nuovi di
  `data/verbi.js`, nella tappa «Chi parla, chi ride» con *ask, speak, laugh,
  cry, smile, know*.
- **When sì, while solo col presente**: *while* si usa col passato
  progressivo (*while I was reading*), che è della media. Qui *while* sta
  solo in frasi al presente (*I sing while I cook*); *when* anche al
  passato e come domanda.
- **I paragoni** vogliono una tappa di aggettivi, «Alto e veloce» (*tall,
  fast, slow, old, young, strong, beautiful, difficult, easy, funny*): con
  quelli di seconda (*big, small, hot*…) non c'erano gli aggettivi lunghi
  per *more / most*.

## Le forme flesse nelle frasi

Le frasi componibili usano le stesse forme del libro
([libro.md](libro.md#le-forme-dei-verbi)): `sconosciute(testo, note,
flessioni)` accetta *plays* solo se la base è nota e la struttura con la
flessione `s` è arrivata **alla tappa della frase** (`flessioniNote`). Il
libro invece sa le strutture dell'anno dalla prima pagina del mondo
(`formeDelLibro` con `strutture` in `dati/mondi.js`).

**Gli aggettivi si flettono come i verbi** (`motore/flessioni.js`): `er` e
`est` sono le flessioni della forma `paragoni`. Un aggettivo è corto (prende
*-er / -est*) se ha una sillaba, o due e finisce in *y* (*happy → happier*);
quelli in *-ed* (*tired*) e gli altri sono lunghi (*more beautiful*); *good*
e *bad* sono irregolari. Toccato, *bigger* dice «più grande» e segna
`en:big` (`chiaveDi`).

**Il passato irregolare** sta in `dati/passati.js` con tutti gli
irregolari dei verbi noti (anche quelli del 📦: *fell, sat, stood, wore,
drew, built*), così nessuno prende *-ed* per sbaglio.
