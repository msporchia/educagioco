# Asteroidi 3D: il cielo in 3D, e i comandi del telefono

**Asteroidi 3D** (`mate3d`) è un gioco in prova: gli stessi Asteroidi
disegnati in WebGL con three.js, partendo dal prototipo approvato
(`poc/asteroidi-3d`, ottobre 2026), per provarlo sui telefoni veri. Gli
**Asteroidi** di sempre (`mate`) restano com'erano, in 2D e coi comandi di
prima, per i bambini. Le regole del gioco non cambiano: tempi, ritmi,
`rispostaEntro`, il cronometro che parte quando il sasso giusto è tutto in
scena, l'SRS, le vite, i gettoni. Cambiano il disegno e i comandi.

## Un gioco in prova, la stessa partita

- **La carta c'è solo coi giochi in prova accesi** (`sperimentale: true`
  nella riga di `src/data/giochi.js`, [../genitori/interruttori.md](../genitori/interruttori.md)).
- **La stessa vista, un disegno diverso**: `App.vue` monta `MathGame.vue`
  per `mate3d` col prop `disegno: '3d'`. Senza il prop è il 2D di sempre.
- **Lo stesso avanzamento**: la chiave della campagna resta `mate` (tappe,
  stelle, hangar, record del volo, monete, sosta). Un gioco non aggiunge
  campi al profilo, e due copie dello stesso avanzamento si separerebbero.
  La sosta è una sola: una partita lasciata nel 3D si riprende anche dal 2D
  e viceversa (i sassi non si salvano, il disegno non conta). La fila e
  l'età si leggono uguali (`mate3d` in `TAPPE_DEL_GIOCO` e
  `CONTATORE_VECCHIO` di `portata-giochi.js`).
- **I comandi nuovi sono solo del 3D** (`comandiNuovi`): negli Asteroidi di
  sempre si tocca solo sopra il sasso, la nave sta ferma, niente scudo, e i
  falsi nascono come prima.

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `src/grafica/spazio3d/indice.js` | la tela WebGL, la telecamera, le luci, il passaggio finale (vignetta, colore, grana, tono) e il pixel ratio che si adatta |
| `src/grafica/spazio3d/cielo.js` | il fondale di ogni posto cotto in una texture, le stelle, il pianeta, il Sole e il buco nero |
| `src/grafica/spazio3d/forme.js` | le forme dei sassi di ogni specie, col davanti per il numero |
| `src/grafica/spazio3d/sassi.js` | un posto per sasso in scena: forma, numero inciso, alone, coda, alieno |
| `src/grafica/spazio3d/materia.js` | il materiale dei sassi: vene accese, bordo controluce, brina, rosso dello sbaglio |
| `src/grafica/spazio3d/nave.js` | l'astronave: stazze, livrea, danni, scudo |
| `src/grafica/spazio3d/madre.js` | la nave madre col comandante |
| `src/grafica/spazio3d/effetti.js` | scintille e fumo, anelli, raggi, cocci |
| `src/motore/asteroidi/comandi.js` | quale sasso tocca il dito, il falso che urta la nave, le quote dei falsi (puro) |
| `src/views/MathGame.vue` | col prop `disegno` sceglie chi disegna (`accendi3d`), passa la scena (`disegna3d`), guida la nave |

## Chi gioca non disegna

- **La view passa la stessa scena al 3D e al 2D**: nave, sassi, nave madre,
  raggi, anelli, particelle, cocci, in pixel dello schermo (`quadro` in
  `MathGame.vue`, un oggetto solo rinfrescato a ogni fotogramma). Il 3D la
  traduce: il piano z = 0 è lo schermo e un pixel vale `K` = 0,01 unità,
  quindi un sasso sta a schermo esattamente dove il gioco lo tocca.
- **In `grafica/` non entrano vite, punti, prezzi**: arrivano `danno`, `lv`,
  `livrea`, `gelo`, `rosso`. Il disegno non guarda mai `a.ok`.
- **Quello che il 3D aggiunge di suo** (la palla di fuoco quando nasce un
  anello piccolo, le scintille dallo strappo, il fumo dai buchi della nave
  madre) vive nello sciame di `effetti.js`, mai nella partita.
- **Niente allocazioni per fotogramma**: le forme si fanno una volta per
  specie (tre varianti, all'ingresso nel cielo), i sassi riusano dieci
  posti, i punti stanno in due `Points` (scintille e fumo), i cocci in un
  `InstancedMesh`.

## Il disegno di riserva

- **Se WebGL 2 non c'è, o il contesto si perde, si gioca col 2D di
  sempre** (`grafica/spazio.js`, `cieli.js`, `nave-madre.js`): stesse
  regole, stessi comandi. Il contesto si chiede a mano prima di three, così
  senza WebGL non esce niente in console.
- Negli Asteroidi 3D il 2D fa da riserva finché non si sa che i telefoni
  veri reggono il 3D; `#tela=2d` lo chiede apposta.
- La rotta e l'hangar restano in 2D (la nave piccola di `disegnaNave`):
  il 3D legge la stessa `livrea`.
- Sotto la rotta e «Cosa so», che coprono tutto, la tela 3D non disegna.

## I comandi

Come sul telefono, negli Asteroidi 3D (anche quando disegna il 2D di riserva):

- **Premere sopra un sasso, o appena fuori dal bordo** (1,15 del raggio,
  mai meno di 22 px: `TOCCO`), spara a quello: è la risposta, giusta o
  sbagliata come prima. Fra due sassi vince il più vicino.
- **Premere altrove porta la nave lì, e basta**: non è mai una risposta
  sbagliata. Finché il dito resta giù la nave lo segue (`guida` 12/s, senza
  scatti); il mouse conta solo a tasto premuto. Il campo dichiara
  `touch-action: none` ([../core/il-dito.md](../core/il-dito.md)).
- **Un falso che tocca la nave rimbalza sullo scudo**: lo scudo si accende
  dalla parte dell'urto, il sasso diventa rosso e vola via verso l'alto
  (resta in cielo e si può ancora toccare). Non è una risposta: niente
  SRS, niente vita, niente filotto, niente monete: il bambino non ha
  scelto quel sasso (confermato dall'utente).
- **Il sasso giusto che tocca la nave esplode addosso a lei** e costa
  quello che costa arrivare in fondo (una vita, la domanda segnata come non
  presa, lo scoppio, la scossa, la nave che si rompe): è lo stesso codice.
  Toccato col dito resta la risposta giusta. Deciso dall'utente.
- **Uno sbaglio non fa esplodere il sasso**: diventa rosso e il colpo lo
  spinge via mentre si spegne (`respinto`); è già fuori gioco (`morto`)
  come prima, costa la vita come prima, e il trucco alla seconda volta si
  dice come prima.
- **I falsi nascono a quote diverse**, a passi di 1,5 raggi o di un
  ennesimo del 30% dell'altezza (il più largo dei due), e due nati uno
  dopo l'altro mai a quote vicine (`ordineFalsi`: 1, 3, 0, 2, 4): fra loro
  resta un varco per la nave. La fascia è quella di prima, quindi tutti i
  falsi sono in scena insieme come prima.
- **Il cannone spazza ancora**: la torretta sulla nave segue `mira`, che a
  riposo non punta niente ([volo.md](volo.md)).

## Ogni posto ha il suo cielo

Le tinte e le macchie di nebulosa sono quelle di `grafica/cieli.js`, cotte
con le nuvole in una texture piccola quando cambia il cielo; la luce sui
sassi cambia col posto.

| cielo | sassi in 3D | dietro, in alto e tenue |
|---|---|---|
| `cintura` | roccia grigia, crateri | il gigante a bande con gli anelli |
| `marte` | roccia rossa | il pianeta rosso |
| `ghiaccio` | ghiaccio a faccette, con la coda | il pianeta di ghiaccio con gli anelli |
| `rottami` | lastra col pericolo, pannello solare, serbatoio | il pianeta ruggine |
| `cristalli` | gemma con i prismi, accesa dentro | il pianeta viola con gli anelli |
| `alieni` | disco volante con l'alieno nella cupola, luci in catena | il pianeta verde con la luna |
| `sole` | lava, crosta con le crepe accese | il Sole, con la corona |
| `nero` | roccia scura col bordo viola | il buco nero col disco |

- **Il numero è inciso nella roccia**, non scritto sopra: la stessa tela fa
  da colore (la pietra più scura attorno) e da rilievo (il solco), e una
  seconda accende d'azzurro il fondo del solco. Il sasso oscilla appena:
  il numero resta di faccia. Il disco volante è inclinato già nella forma,
  così il numero si proietta su bordo e piano come si vedono.
- La bomba della nave madre è una mina a punte con la spia che lampeggia.
- Il balzo del volo fa delle stelle vicine delle scie.

## La nave

- **Le sagome sono quelle del 2D** (`ali`, `strappa`, `SCHEGGE`,
  `PROPULSORI` di `spazio.js`), estruse: lo strappo è lo stesso, coi denti
  dove li ha il 2D.
- **I tre stati**: intatta · l'ala sinistra strappata col bordo che arde, i
  due cocci che galleggiano, le scintille, la spia ambra · lo strappo che
  si mangia l'ala, il vetro crepato e rosso, la spia rossa doppia, l'alone
  d'allarme, il motore sinistro a singhiozzo. Il fumo è quello della view.
- **Le stazze**: navetta (un motore), caccia (due, coi pod in punta d'ala),
  incrociatore (tre, e la seconda coppia d'ali).
- **La livrea si dipinge sulle ali** con `dipingiAla` e `disegnaStemma` di
  `livrea.js`, su una tela per lato che fa da colore all'ala: lo stemma se
  ne va col pezzo strappato. Scafo, ali e fiamme prendono le tinte di
  `tinteNave`; le tinte lucide fanno il metallo lucido.
- Botta rossa, riparazione verde, scudo esagonale col gelo.

## Quanto costa

- **Una qualità sola**, niente bagliore (bloom) e niente pannello: il
  pixel ratio parte da 2 (o meno, se lo schermo ne ha meno), sale fino a 3 se
  il computer regge (con tetto a 1,5 uno schermo a 3 era sfocato: la tela
  stirata) e scende fino a 1 (mai sotto: la tela stirata sfoca nave e sassi, scendendo a 0,6 sembrava «compressa») se un
  fotogramma costa più di 26 ms per una novantina di fotogrammi; risale piano sotto i 15 ms. Provato il bagliore nel
  prototipo: tolto, senza stava meglio. Provato il pannello delle tre
  qualità: non si distinguevano.
- **Misurato in Chrome senza schermo** (SwiftShader, cioè la CPU fa la
  GPU): 30 disegni per fotogramma con la navetta e tre sassi, fino a 70
  con l'incrociatore, sei sassi e la nave madre; 12–23 mila triangoli;
  21–28 ms a fotogramma a pixel ratio 1,5, di cui meno di un decimo di ms
  di JS per preparare la scena e mezzo per le chiamate a WebGL. Su una GPU vera di telefono la scena
  sta in pochi millisecondi; da provare su un telefono vecchio.
  `window.__mate.grafica()` dice disegni, triangoli, pixel ratio e i
  millisecondi (fra due fotogrammi, del JS che prepara, delle chiamate a
  WebGL); `strumenti/profila-app.mjs 'mate=2' --dist` dice dove va la CPU.
- **Il file unico**: three pesa circa 640 KB minificato (28,5 → 29,2 MB),
  e il file si apre ancora col doppio click.

Nei test: `unita/asteroidi-3d` (il dito, l'urto, le quote dei falsi, le
forme di ogni specie), `integrazione/asteroidi-3d` (col dito vero: il 3D
acceso e quanto costa, la carta solo coi giochi in prova, il tocco sul
giusto, il vuoto che guida, il trascinare, appena fuori dal bordo, lo scudo,
il giusto addosso alla nave, gli Asteroidi di sempre in 2D, il 2D senza
WebGL). Bersagli: la tela `[data-tela="3d"|"2d"]`; `window.__mate.grafica()`
(`tre`, `chiamate`, `triangoli`, `dpr`, `ms`, `scena`, `disegno`);
`window.__mate.nave` (`meta`, `urti`, `scudo`); sui sassi `respinto`,
`rosso`, `urtato`. Il cheat `#mate3d=<tappa>` (o `#mate=` per il 2D; `volo`, `&livello=`, `&vite=`,
`&madre=1`, `&nave=scafo:oro,…`, `&tela=2d`, `&dpr=2`) in
[../core/comandi.md](../core/comandi.md).
