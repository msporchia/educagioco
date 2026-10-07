# Passo passo — i sentieri senza fine

Il finale che non finisce, in due: **il sentiero del coniglio** e **il
sentiero del cane**, ognuno in fondo alla sua strada sulla mappa
([mappa.md](mappa.md)). Posti fatti al momento da
`src/giochi/passo-passo/motore/generatore.js`, con le bozze di
`motore/prati.js`, `motore/pascoli.js`, `motore/sagome.js` e
`motore/sagome-cane.js`, e controllati col risolutore.

## Le regole

- **È il finale, e la difficoltà sta sempre in cima**, dal primo posto
  all'ultimo. Chi ci arriva ha già dimostrato di sapersela cavare. Provata
  una scala che sale con le partite: non va, rendeva facili proprio i primi
  posti del finale.
- **Due sentieri, da scegliere.** Quello del coniglio fa prati e posti con
  lo zaino; quello del cane pascoli e posti con lo zaino col cane (le
  carte finite, usate sulle pecore come nelle isolette del cane). Nessuno
  dei due mescola l'altro animale.
- **Si aprono come prima**: quello del coniglio alla fine delle buche
  (`TAPPE_PRIME` in `dati/campagna.js`), anche se sulla mappa sta in fondo;
  quello del cane a pascolo finito. A sei anni lo zaino è chiuso per età e
  i sentieri no: chi ha sei anni trova prati e pascoli, chi ha finito tutto
  anche le scatole.
- **Mescola solo quello che si è finito** (`INGREDIENTI`): ogni gradino
  **finito** della campagna porta una cosa — una regola del mondo, il cane,
  una carta. Finito e non visto: il gradino in corso si sta imparando.
- **La varietà la fanno le forme.** A ogni posto si tira la famiglia
  (`famigliaDi`), e dentro la famiglia la forma. Quella del posto di prima
  pesa poco (il ricordo è «famiglia:forma», `ricordoDi`): la famiglia un
  terzo, la forma un quinto, una sagoma un settimo.
- **Il fuori è fatto di macchie** (boschetto, stagno, siepe), mai di prato:
  un pezzo d'erba che dalla strada non si raggiunge sembra una strada.

## Le forme

Senza zaino (`FORME` in `motore/generatore.js`):

| sentiero | forma | cosa c'è | regole |
|:--|:--|:--|:--|
| coniglio | **labirinto** | siepi con qualche slargo, la tana lontana, la carota in un vicolo | tre o quattro delle quattro |
| coniglio | **lago** | tutto ghiaccio, sassi che fermano, buchi d'acqua, un'isola d'erba, una coppia di buche | ghiaccio e buche |
| coniglio | **fiumi** | due o tre fiumi, il varco nella siepe di là ogni volta dall'altra parte; largo due si passa col masso che fa il ponte | salto, e quasi sempre i massi |
| cane | **aperto** | il recinto in una tacca del bordo, a volte il ghiaccio | — |
| cane | **cancello** | il recinto chiuso dalla staccionata, col cancello di lato: le pecore vanno girate attorno | — |
| cane | **galleria** | una siepe taglia il prato: di là le pecore e il ghiaccio, si passa dalla buca | ghiaccio e buche |
| cane | **corridoio** | il gregge sparso, da mettere in fila davanti a un corridoio stretto | — |

Con lo zaino (`SAGOME`, programma prima e posto dopo): col 🔁 la collina,
le terrazze, il campo arato, di sasso in sasso, la spirale di ghiaccio, le
pozze, **le gallerie**; col «fino a» i gradini storti, il campo storto, il
fiume dei sassi, scale e pianerottoli, **le gallerie storte**; col ❓ le
colline, il sentiero dei segni, il bosco ghiacciato. Col cane: **il
pettine** e **il pettine doppio** (🔁), **il pettine storto** (🚩), **le
nicchie** (❓). Le gallerie sono corridoi chiusi dalla siepe, uno sotto
l'altro, e la buca in fondo a ognuno sbuca all'inizio del dopo.

- **Le pecore**: tre, quattro, a volte cinque (`PECORE`); con quattro o più
  le prime stanno in fila, il gregge già mezzo riunito. Il cancello ne ha
  due. Mai su una cella d'incastro.
- **False piste**: nel lago chi scivola dritto finisce in un buco; nei
  fiumi il varco giusto è lontano da quello che si vede; nei vicoli del
  cane fra una stalla e l'altra c'è il fosso; con lo zaino le mosse ingenue
  fanno almeno due passi prima di fermarsi.

## Il pavimento: prima e dopo

La strada più corta **senza carota** (chi lascia perdere la carota non
deve trovare un posto facile), in frecce sciolte. Prima c'era un giro di
riserva più basso; adesso no: se una forma non regge presto si passa alla
dopo, e solo in fondo c'è un posto di riserva (anche lui sopra il
pavimento).

| | prima | dopo | dove |
|:--|:--|:--|:--|
| prato | ≥ 10 (8 al secondo giro) | labirinto e fiumi ≥ 14, lago ≥ 10 scivolate | `FORME.prato` |
| pascolo | ≥ 12 (9 al secondo giro), 2–3 pecore | ≥ 16, il cancello ≥ 20; 3–5 pecore | `FORME.pascolo` |
| zaino | ≥ 12 mosse (8 o 10 con scivolate e salti) | ≥ 15 (10 la spirale, 12 coi salti e il bosco ghiacciato) | `STRADA_MIN` in `motore/sagome.js` |
| zaino | lo zaino tiene ≥ 5 carte | uguale | `ZAINO_MIN` |

E un tetto: la strada con la carota sta nella fila (36 frecce nei prati,
34 nei pascoli, 24 nel lago).

## I numeri, misurati

Da `node strumenti/passo-passo/sentiero.mjs` (mille posti per famiglia,
tutto sbloccato; il tempo è su un portatile, un telefono va tre o quattro
volte più piano). «Corta» è la strada più corta senza carota.

| famiglia | corta prima: min · mediana · max | corta dopo: min · 10% · mediana · 90% · max | forme prima → dopo |
|:--|:--|:--|:--|
| prato | 8 · 12 · 28 | 10 · 10 · 14 · 17 · 23 | 1 → 3 |
| pascolo | 12 · 17 · 25 | 16 · 18 · 23 · 30 · 33 | 1 → 4 |
| 🔁 coniglio | 8 · 12 · 48 | 10 · 10 · 16 · 25 · 48 | 6 → 7 |
| 🚩 coniglio | 10 · 14 · 41 | 12 · 13 · 16 · 22 · 34 | 4 → 5 |
| ❓ coniglio | 10 · 12 · 20 | 12 · 12 · 15 · 18 · 20 | 3 → 3 |
| 🔁 🚩 ❓ cane | — | 15 · 15 · 15–17 · 16–22 · 18–23 | 0 → 4 |

- **Regole per posto**: un prato ne mette insieme 2,4 in media (prima 2,5,
  ma su prati da 10 frecce); un labirinto tre o quattro. Un pascolo ha il
  ghiaccio una volta su tre e la galleria una su quattro.
- **Pecore**: nei pascoli 3 (54%), 4 (20%), 5 (1%), 2 nel cancello (25%);
  nello zaino col cane da 3 a 6 (il pettine doppio).
- **In fila, come li gioca un bambino** (mille posti col ricordo): il
  coniglio passa per 18 forme e ne ripete una di fila 8 volte su mille; il
  cane per 8 forme, 17 volte su mille.
- **Il tempo per nascere**: il coniglio 1,8 ms in media, 19 ms al 99%; il
  cane 18 ms in media, 87 ms al 95%, 160 al 99%, 279 al massimo. Per questo
  il prossimo posto si fa mentre il bambino guarda il cartello della
  vittoria (`preparaIlProssimo` in `Gioco.vue`): lo stesso seme fa lo
  stesso posto, quindi è solo un anticipo.

## I controlli

- **Prati e pascoli** si tengono solo se il risolutore dice che si vincono
  con la carota (l'osso), che la carota vuole una deviazione, che stanno
  fra il pavimento e il tetto, e che tutte le regole del posto servono
  (`serveLaRegola`).
- **I pascoli li misura il risolutore svelto** (`motore/svelto.js`): le
  stesse regole di `motore/mondo.js` per i posti senza massi né salti, con
  lo stato in un numero, cinque volte più svelto; si ferma a 20 000 stati
  (`LIMITE_CANE`), e la strada che trova si rigioca col motore vero. L'osso
  che non chiede deviazione si sposta dove la strada più corta non passa.
- **I posti con lo zaino vanno al contrario**: prima il programma, poi il
  posto attorno, girato e specchiato a caso. Il motore rigioca tutto e
  butta il posto se la scatola non serve, se una mossa ingenua vince, o se
  col «fino a» un numero qualunque al posto del colore vince lo stesso.
- Se niente regge c'è un posto di riserva (`RISERVA`, `RISERVA_CANE`,
  `RISERVA_ZAINO`): su mille posti per famiglia non è mai uscito.

## Monete e record

Un sentiero vinto vale 🪙3, 🪙6 con lo zaino. Stelle non ce ne sono, ma la
riga «si può fare con N frecce» sì. **Il record è uno per sentiero**:
quanti posti di fila senza comprare aiuti; sbagliare non chiude la serie,
e nemmeno i due gradini gratis del 💡; comprarne uno sì. Nemmeno uscire la
chiude: si riprende dalla carta in cima alla mappa ([sosta.md](sosta.md)).

- **Due sfide nel manifesto** (`SENZA_FINE.sfide` in `gioco.js`, vedi
  [../core/primati.md](../core/primati.md)): `coniglio` e `cane`, chiavi di
  salvataggio. **Quella del coniglio eredita** il record di quando il
  sentiero era uno: era quasi tutto prati e zaino, e il coniglio è il
  sentiero di sempre. Nessun bambino perde il suo record.
- **La medaglia ♾️ conta il migliore dei due** (`ppFila`): una serie lunga
  vale lo stesso col coniglio e col cane.
- La riga della home dice il record più recente dei due.

Provato:

- tre pecore nel cancello: la strada passa quasi sempre le 34 frecce, o il
  risolutore non ci sta; restano due;
- gli steccati col «fino a» e il salto: saltando di lato la strada si
  dimezza, e il pavimento non regge;
- il masso nel lago: serve davvero una volta su mille;
- cinque pecore nel pascolo: anche con tre già in fila servono trecento
  millisecondi per trovarne uno che stia nella fila; si tirano una volta su
  dieci, e ne esce uno su cento;
- i pascoli col risolutore del motore: un pascolo con quattro pecore
  costava mezzo secondo.

Nei test: `unita/passo-passo-sentiero` (ogni sentiero solo con le sue
famiglie; ogni posto si vince, sta sopra il pavimento della sua forma e usa
le regole che dice; le forme non si ripetono di fila; il risolutore svelto
uguale a quello del motore su centoventi pascoli; ogni sagoma; il record di
ieri al coniglio), `integrazione/passo-passo` (le due caselle, i due
record, il sentiero del cane col cane).
