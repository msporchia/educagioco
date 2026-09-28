# Passo passo — le regole

Come si esegue una fila, le regole del mondo gradino per gradino e quelle del
cane pastore. Il codice è in `src/giochi/passo-passo/` (chiave `passo`); la
legenda delle celle sta in `dati/mondo.js`, le regole in `motore/mondo.js`.

## La fila è un programma

- **Le frecce sono assolute.** ↑ vuol dire verso la cima dello schermo,
  sempre, comunque sia girato il coniglio; non c'è «gira a destra». Le svolte
  relative chiedono di ruotare la figura a mente, che a cinque o sei anni non
  c'è: il bambino sbaglierebbe la rotazione, non il programma.
- **▶ riparte sempre dalla partenza, e la fila resta.** È un programma, non
  un telecomando; mentre corre si accende la freccia che sta facendo — sapere
  a che punto del programma si è è la cosa che il gioco insegna.
- **Si compone toccando, mai trascinando.** Ogni tasto mette la freccia dove
  sta il cursore (di partenza in fondo); toccare una tessera sposta il cursore
  subito dopo, toccarla di nuovo subito prima. ⌫ toglie la freccia prima del
  cursore.
- **Uno sbaglio si vede dov'è.** Se il coniglio sbatte o va in acqua la
  tessera colpevole lampeggia, lui fa la sua scenetta e torna alla partenza;
  il cursore si mette subito dopo la tessera sbagliata.
- **La parte già vista va veloce.** Al giro dopo le frecce in testa uguali a
  prima, che allora erano andate bene, scorrono tre volte più svelte.
- **Un programma non finito non è un errore.** Finite le frecce prima della
  tana, il coniglio si ferma dov'è con un «?» e resta lì mentre se ne
  aggiungono. ■ ferma tutto e rimette il mondo com'era.
- **Niente tempo, niente vite, niente suoni che puniscono** (lo sbaglio è un
  tonfo morbido), e nessuna informazione sta solo nel suono.
- **La manina della prima volta** (`Gioco.vue`): chi apre il primo livello
  non sa leggere e non sa cosa fare, quindi una manina indica la freccia e
  poi ▶ — non blocca niente, non si chiude, e sparisce al primo ▶ per non
  tornare più. La stessa manina indica 🔁 la prima volta che si arriva allo
  zaino, finché nella fila non c'è una scatola.

## Le regole del mondo

Valgono **sempre, uguali in ogni livello**: un mondo che in un posto fa una
cosa e in un altro un'altra non si può programmare, si può solo indovinare.
Arrivano una per gradino, e da lì restano.

| | |
|:--|:--|
| **il prato** | si cammina |
| **gli ostacoli** | albero, cespuglio, sasso: non si entra. Contro di loro (e contro il bordo) si sbatte, e la fila si ferma lì |
| **l'acqua** | entrarci è uno splash, e la fila si ferma lì |
| **il salto** | una seconda fila di frecce, arancioni: due celle più in là, scavalcando acqua, ghiaccio o un ostacolo **basso** (tronco, staccionata). Uno alto no |
| **il ghiaccio** | si continua nella stessa direzione finché qualcosa non ferma (fermarsi contro un sasso non è un errore), finché il ghiaccio finisce o si cade in acqua. Scivolando si prende la carota e si entra nella tana. Il sasso diventa un freno: è il motore della difficoltà |
| **i massi** | camminandoci contro si spingono di una cella; sul ghiaccio scivolano, nell'acqua affondano e diventano un **ponte**. Se non possono muoversi, si sbatte |
| **le buche** | a coppie, con l'anello dello stesso colore: si entra da una e si esce dall'altra, e il movimento finisce lì, anche scivolando |
| **le lastre** | rossa col cerchio, blu col quadrato, gialla col triangolo (`r u g`; la forma è per chi non distingue i colori): si camminano come il prato e fermano chi scivola, un masso non ci va sopra. Servono a **guardarle**, dal gradino del «fino a» (vedi [zaino.md](zaino.md)) |
| **le pecore** | vedi sotto |
| **il recinto** | una pecora che ci entra ci resta; il cane non ci entra mai. Dentro tutte, il livello è vinto |

La **tana** vince subito, in qualunque modo ci si arrivi: le frecce dopo non
contano. Per il cane vale lo stesso con l'ultima pecora nel recinto.

Casi decisi apposta:

- saltando non si prende la carota **in mezzo** e non si entra nella tana in
  mezzo: si prende quello su cui si mette la zampa, e vederci passare sopra
  dice che il salto è lungo due;
- non si atterra su un masso: lo si spinge solo camminando;
- un masso non si spinge sulla tana, sulla carota o su una buca, che
  sparirebbero sotto un sasso;
- il salto scavalca anche una buca (come l'acqua) e il recinto (è terra), ma
  non una pecora: è alta come un sasso, e contro si sbatte;
- le pecore scappano tutte insieme, ognuna dalla sua parte, in un ordine
  fisso (su, giù, sinistra, destra) che conta solo quando una scivola dove
  un'altra voleva andare;
- la pecora passa sopra la carota (l'osso, per il cane) senza prenderla: il
  cane la prende quando la pecora se n'è andata.

## Il cane pastore

Undici tappe fra le buche e lo zaino, ancora dei piccoli (portata 44): il
bobtail al posto del coniglio, il recinto (`#`) al posto della tana, le
pecore (`p`). L'osso è la sua carota.

- **La pecora si scansa prima.** Quando il cane **si ferma** sulla riga o
  sulla colonna di una pecora, a una o due caselle (`VISTA = 2` in
  `dati/mondo.js`) e senza niente di alto in mezzo, lei fa un passo
  dall'altra parte. Il cane non la tocca mai: per mandarla a destra le va a
  sinistra, per girarle attorno passa in diagonale. Una scivolata la
  spaventa solo dove finisce. Vede sopra l'acqua e le cose basse, non
  attraverso un albero, un masso o un'altra pecora.
- **Le pecore non sono sassi.** Una che scappa spinge quella che ha davanti,
  e si muove tutta la fila; se in fondo c'è un ostacolo, l'acqua o il bordo
  non si muove nessuna (la prima fa «bee», e il cane che le cammina contro
  sbatte). Sul ghiaccio la testa della fila scivola, e una pecora che
  scivola si ferma contro quella che trova senza spingerla. Nell'acqua non
  ci vanno. I prati partono con le pecore **sparse**, da riunire.
- **Una pecora incastrata ferma la fila** (`PERSA` in `motore/mondo.js`).
  Una cella da cui nessuna spinta la riporta al recinto — un angolo, un
  bordo lungo senza un «dietro» per il cane — la calcola `celleIncastro` in
  `motore/livello.js`, una volta per livello, dal recinto all'indietro. La
  fila si ferma come contro un albero, la pecora trema, la cella pulsa e
  lampeggia la freccia che ce l'ha mandata. Senza, il bambino aggiungeva
  frecce a una partita già persa e niente gli diceva perché.
- **Ogni tappa del cane dichiara le sue `trappole`**: la mossa ingenua di
  quel posto (passare sotto la pecora per l'osso, spingerla troppo in là),
  che deve fare un pezzo di strada e poi fallire. Lo pretende
  `test/unita/passo-passo`.
- **Un 🔁 con un numero troppo alto non costa niente**, perché l'ultima
  pecora nel recinto chiude la fila: dove il numero deve contare, i pezzi da
  ripetere sono lunghi diversi. Per il cane «ripeti fino a 🏠» vuol dire
  «finché il gregge non è dentro».

**Il cane non è un'isola.** Dopo i primi quattro posti il suo gradino rifà
le regole che il bambino ha già — il ghiaccio, la buca che lo fa sbucare
alle spalle della pecora, il fiume che il cane salta e la pecora no, il
masso che fa il ponte per lei — e lui torna in ogni gradino dello zaino con
la carta di quel gradino: le stalle col 🔁, le stalle a gradini col «fino
a», le nicchie col ❓, il lago delle stalle in «tutto il mondo».
`test/unita/passo-passo` lo pretende.

Provato: pecore che si comportano da massi, e una fila che non si spinge.
Non va: il gregge si riunisce proprio mettendo le pecore in fila e
spingendole tutte.
