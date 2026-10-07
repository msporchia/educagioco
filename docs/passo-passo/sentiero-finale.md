# Passo passo — il finale di chi ha tutte le carte

I sentieri senza fine ([sentiero.md](sentiero.md)) per chi ha già le carte
dello zaino. Le sagome stanno in `src/giochi/passo-passo/motore/sagome-miste.js`,
la ricerca del programma più corto in `motore/programmi.js`, la prova in
`provaLoZaino` (`motore/sagome.js`).

## La regola: la difficoltà si misura dal programma

- **Non dalle frecce.** Il pavimento di prima era la strada più corta in
  frecce; ma una scivolata sul ghiaccio vale una freccia e attraversa mezzo
  campo, e un ciclo ripete un pezzo senza pensarci. Il lago ghiacciato da
  dieci scivolate si vinceva con quattro carte, e la spirale con cinque:
  per chi ha finito tutta la campagna era un posto da quattro mosse.
- **Si misura il programma più corto in carte** con le carte che il bambino
  ha in mano (come la quarta stella), arrivando a casa anche senza la
  carota: quante carte, quante mosse esegue, e se dentro lo zaino si vince
  **senza un ciclo** o **senza un se**. Lo cerca `cercaProgramma`: ogni
  carta nasce mentre il coniglio la esegue, e una carta che lo fa sbattere
  taglia via tutti i programmi che cominciano così.
- **L'asticella, per chi ha tutte le carte** (`CARTE_MIN`, `PASSI_MIN` in
  `motore/sagome.js`): il programma più corto ha **almeno 8 carte** ed
  esegue **almeno 15 mosse**; senza un ciclo e senza un se, dentro lo
  zaino, non si vince. Il programma scritto è il più corto, o al più una
  carta sopra (la carota a volte la costa).
- **Perché otto carte.** È il programma più corto dei livelli più
  difficili della campagna (le nicchie, il sentiero dei segni, il sentiero
  del gregge: otto; le colline sei, il bosco ghiacciato sette); prima nel
  finale, con lo zaino, ne bastavano cinque di mediana nel ciclo e sette
  nel se, e un posto su dieci si faceva con quattro. Otto carte stanno in
  una riga della fila sul telefono; nove e dieci vanno su due.
- **Chi ha solo alcune carte**: il posto chiede quelle che ha. Col solo
  ciclo, le sagome di sempre (quasi sempre un ciclo, mai un se); col «fino
  a», anche quelle del «fino a». Il se arriva solo con la sua carta, e da
  lì in poi **ogni posto con lo zaino ha il se** (`vaPerLaMano`).
- **I prati e i pascoli senza carte** restano per chi ha lo zaino chiuso
  (i più piccoli, che arrivano al sentiero alla fine delle buche). Chi ha
  le carte li trova di rado (`SENZA_ZAINO`, uno su trenta con tutte le
  carte, uno su undici col solo ciclo), sempre sopra le 15 frecce, e il
  lago non c'è.

## Le sagome miste

Prima il programma, poi il posto: **il posto è la strada che il programma
fa**, scavata mentre lo si esegue (`segnaletica`). Il programma è un ciclo
con dentro un motivo e due o tre se; a ogni giro il caso sceglie quale se
scatta e mette la sua lastra, e la strada non passa mai accanto a sé
stessa (sarebbe una scorciatoia).

| sentiero | sagoma | il programma | le idee |
|:--|:--|:--|:--|
| coniglio | **le colline alte** | `🔁🏠( → ❓🔴(↓↓) ❓🔵(↑↑) )` | ciclo, se |
| coniglio | **le colline ripide** | `🔁🏠( → ❓🔴(🔁3(↓)) ❓🔵(↑↑) )` | ciclo, se, ciclo nel se |
| coniglio | **il torrente gelato** | come le colline alte, ma fra un colle e l'altro si scivola | ciclo, se, ghiaccio |
| coniglio | **le terrazze dei fossi** | `🔁🏠( ↓ → ❓🔴(→) ❓🔵(↓) ❓🟡(⇒) )` | ciclo, tre se, salto |
| cane | **le nicchie** | `🔁🏠( → ❓🔴(↓↑) ❓🔵(↑↓) )`, cinque nicchie | ciclo, se, pecore |
| cane | **le nicchie fonde** | le nicchie di un lato lunghe due: `❓🔴(↓↓↑↑)` | ciclo, se, pecore |
| cane | **le nicchie gelate** | in più una o due nicchie di ghiaccio, senza lastra: la pecora ci scivola dentro da sola | ciclo, se, pecore, ghiaccio |

- **Le false piste.** Accanto a ogni lastra il primo passo degli altri
  rami (chi scambia i colori) e il motivo che riparte (chi dimentica il se)
  trovano un pezzo di prato — o di ghiaccio — e dietro l'acqua. Nelle
  nicchie, dall'altra parte del corridoio, il fosso.
- **Le decisioni sono storte** (`storta`): ogni ramo almeno due volte
  (una, coi tre rami), tre o quattro tratti di fila dello stesso ramo,
  nessun motivo che si ripete ogni uno, due o tre giri. Una fila regolare si scrive senza il se, con un «fino a» o
  contando. Nelle nicchie anche il passo fra una e l'altra è storto: a
  passo fisso una scatola che avanza di due fa a meno del se.
- **Ogni famiglia pesca fra tutte le sagome col se**: per chi ha tutte le
  carte le famiglie 🔁 🚩 ❓ sono solo il ricordo che fa girare le forme.

## I controlli

- **Il coniglio**: il generatore cerca il programma più corto e quello
  senza se fino a `CERCA` passi della ricerca (centomila, una ventina di
  millisecondi su un portatile); se lo trova il posto si butta, se non
  finisce si fida della sagoma. Le scorciatoie che esistono si trovano
  quasi tutte prima.
- **Il cane non cerca** (`cerca: 0`): con le pecore la ricerca costa
  secondi. Lo garantiscono le sagome: cinque nicchie (quattro fonde) coi
  lati storti e il passo storto. Il test e lo strumento misurano quante
  scorciatoie restano: una su dieci.
- **Le riserve** (`RISERVA_FINALE`, `RISERVA_NICCHIE`): due posti usciti
  dal generatore, sopra l'asticella, se nessuna sagoma regge.

## I numeri, prima e dopo

Da `node strumenti/passo-passo/sentiero.mjs` (tutte le carte in mano, il
giro come lo gioca un bambino: un posto dopo l'altro col ricordo). Il
coniglio su mille posti, il cane su cinquecento (quattro secondi a domanda
di ricerca il coniglio, sei il cane). «Carte» è il programma più corto,
«mosse» quante ne esegue.

| | coniglio prima | coniglio dopo | cane prima | cane dopo |
|:--|:--|:--|:--|:--|
| chiede un ciclo | 67% | 97% | 60% | 97% |
| chiede un se | 9% | 94% | 8% | 90% |
| almeno 15 mosse | 59% | 96% | 100% | 100% |
| carte: 10% · mediana · 90% | 5 · 7 · 15 | 8 · 8 · 9 | 6 · 8 · 26 | 8 · 8 · 10 |
| almeno 8 carte | 43% | 100% | 66% | 100% |
| posti senza zaino | 33% | 3% | 40% | 3% |
| forme | 18 | 6 | 8 | 6 |

- **Prima** i prati contavano come programmi lunghi (dieci frecce sono
  dieci carte) ma non chiedevano niente; con lo zaino la mediana era di
  cinque carte nel ciclo, sei nel «fino a», sette nel se, e il se serviva
  davvero una volta su tre anche nella sua famiglia (le colline regolari
  si scrivono con un «fino a»).
- **Dopo**, del coniglio: le quattro sagome si dividono i posti quasi in
  parti uguali; il programma scritto è il più corto, e sei volte su cento
  ce n'è uno di una carta meno. Il 4% esegue meno di quindici mosse (mai
  meno di dodici).
- **Del cane**: il se si misura dove la ricerca arriva in fondo (366
  posti su 500); le nicchie fonde chiedono più di sei secondi a domanda,
  e quelle non si contano. Nessun programma scritto ne ha uno più corto.
- **Chi ha solo alcune carte** (trecento posti): col solo ciclo il ciclo
  serve il 92% delle volte, col «fino a» il 96%, e il se mai.
- **Il tempo per nascere**, su un portatile (un telefono va tre o quattro
  volte più piano): il coniglio 32 ms in media, 103 al 99%, 254 al
  massimo (prima 2 e 22: adesso c'è la ricerca); il cane 4,5 ms in media,
  107 al 99% (sono i pascoli, che restano lenti), 318 al massimo. Il
  prossimo si fa mentre il bambino guarda il cartello della vittoria
  (`preparaIlProssimo`); il primo di una seduta no.

Provato:

- i massi sul sentiero (il colore dice da che parte girarci attorno):
  nove per undici tiene tre massi, e tre decisioni si scrivono con due
  scatole contate;
- il fiume fra le colline (su e giù di due, e il salto): coi salti `↓↓` è
  `⇓`, e il programma si accorcia; coi salti i rami non hanno due frecce
  uguali di fila;
- le colline lunghe (un terzo colore per due passi piani): si scrivono in
  otto carte invece di undici;
- il sentiero dei segni (ogni passo è una lastra): le strade a scalini si
  scrivono con un «fino a»; anche con la fila dei versi storta, otto posti
  su dieci avevano una scorciatoia;
- il pettine con le nicchie (sopra solo dove dice la lastra): le pecore di
  sopra si spingono anche alla fine, tornando indietro, senza il se;
- le nicchie con il corridoio di ghiaccio: per starci con quindici mosse
  vanno fitte, e quattro nicchie in fila si scrivono contando.

Nei test: `unita/passo-passo-sentiero` (il finale su un campione del giro:
la quota con un ciclo, con un se, le mosse, le carte; ogni posto si vince
con la soluzione scritta; ogni sagoma con la sua mano; le riserve sopra
l'asticella; la ricerca trova i programmi della campagna).
