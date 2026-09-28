# Il costruttore — gli algoritmi

In fondo alla fila, dopo le giornate del porto, tre capitoli dove il porto
diventa il posto per i primi algoritmi: `dati/porto/ordine.js`,
`dati/porto/cercare.js`, `dati/porto/pile.js` (sotto `src/giochi/costruttore/`).

## Lo scaffale è la memoria

- **La casella sotto cui sta il robot è l'indice, la mano un registro, il
  banco la variabile d'appoggio** dello scambio. Una regola piccola fra due
  lettere vicine fa venire fuori l'ordine di tutta la fila davanti agli occhi.
- **Pensare non costa, muoversi sì**, quindi il bubble sort qui è lento per
  la ragione vera: su nove lettere al contrario «In ordine» impiega 488
  turni, un ordinamento per selezione 144. **Il banco guarda il risultato,
  non la strada**: nessuno dei due è vietato. Il posto dove la differenza si
  farebbe sentire è un turno col record, non un livello.
- **Si vince con l'obiettivo `inOrdine`** di `motore/porto/esito.js`: guarda
  la fila (`{ y, da, a }`) e non la strada fatta. Sa anche l'ordine dei
  colori (`colori: ['verde', 'bianco', 'rosso']`) e quello dentro un sacco
  (`cassone`).

## Le false piste di «mettere in ordine»

Dopo «In ordine» lo stesso algoritmo si guarda da quattro punti diversi: il
tricolore (fuori posto = colore, non numero), il casellario (smistare senza
confrontare, il contrario apposta), fare posto (inserimento senza rifare
tutto) e la cerniera (fondere due file già ordinate). Le mosse ingenue di
questi livelli vincono sul giorno più semplice e cedono solo quando smette
di essere un caso particolare: le due bande già in ordine fra loro nel
tricolore, le lettere arrivate già crescenti in «Fare posto», le due file
perfettamente intrecciate nella cerniera.

- **In «Fare posto» la sentinella «1» in testa allo scaffale non si sposta
  mai**: ferma il confronto prima che il robot esca dallo scaffale, e regge
  solo perché ogni lettera nuova è almeno un due (`dati/porto/ordine.js`).
- **In «La cerniera» il nastro d'arrivo è largo quanto tutte le lettere del
  giorno**: quello che vi si posa non torna più indietro, si accoda da sé.

## Le pile

- **Un cassone è una pila**: si prende sempre quella in cima. «Il carico al
  contrario» non ha un posto libero per terra apposta — con un posto libero
  si porta ogni cassa dritta al suo posto e la pila non serve più.

## Tre pezzi di mondo, nessuna meccanica su misura

- **Il cliente che chiede una qualità** (`massimo`/`minimo`: «la lettera più
  grande che c'è»): leggerla al bancone ferma il robot, si capisce guardando
  le lettere.
- **Il cliente che fa indovinare** (`clienti.indovina`): rimette la lettera sul
  bancone e dice «di più!» o «di meno!» (si guardano come `di-piu`/`di-meno`),
  fino a `tentativi` (quattro, di serie).
- **La pila** (`figura: 'pila'`, forme di formaggio): una forma grande sopra
  una più piccola la schiaccia.
- **Il `÷` nei conti**, quello della scuola senza la virgola: la metà che
  serve alla ricerca binaria.

## I livelli

| livello | cosa si impara |
|---|---|
| 🔢 Due lettere · La passata · In ordine | confrontare due numeri (il ⚖️) e scambiarli passando dal banco; una passata porta la più grande in fondo; ripeterla è il bubble sort |
| 🇮🇹 Il tricolore | la stessa passata, con un'altra idea di «fuori posto» (la bandiera di Dijkstra) |
| 📬 Il casellario | ogni lettera nella buca del suo numero: in ordine senza confrontare |
| ↔️ Fare posto | ognuna scivola a sinistra finché trova il suo posto (insertion sort) |
| 🤐 La cerniera | due file già in ordine diventano una: il cuore del merge sort |
| 🏆 Il campione | il record che cambia solo quando serve |
| 🕳️ La lettera che manca | la somma trova la mancante senza cercarla |
| 🎯 Indovina la lettera | quattro tentativi per nove lettere: sempre quella a metà (ricerca binaria) |
| 🔄 Il carico al contrario | la pila capovolge: si prende sempre quella in cima |
| 🧀 Due · Tre · Quattro forme | la torre di Hanoi, un gradino alla volta |
| 🗼 La torre del casaro | quante forme vuoi: il progetto che chiama sé stesso |

## La torre del casaro e la ricorsione

Tre assi (rossa, verde, blu), la torre va dalla «partenza» all'«arrivo»,
quella libera è l'«appoggio». Le assi si chiamano col loro colore, quindi un
programma scritto coi colori di lunedì perde martedì. Il robot sta fermo e
«sposta» porta una forma da un'asse all'altra: la lezione è la torre, non la
strada. Le misure di «torre di due/tre» sono nomi di ruolo (partenza, arrivo,
appoggio), quelle di «sposta» preposizioni (da, a): così una chiamata si legge
come una frase, «sposta da [partenza] a [appoggio]».

**La ricorsione non si spiega, si arriva a vederla**: ogni gradino dà già
fatto quello che il bambino ha scritto nel gradino prima.

1. **due forme**, a mano;
2. **tre forme**, con la «torre di due» già pronta — e nello zaino i sette
   spostamenti a mano non ci stanno;
3. **quattro forme**: la «torre di tre» la scrive il bambino, con dentro la
   torre di due;
4. **la torre del casaro**: torri da tre a sei forme, e solo «sposta». Una
   torre alta N è due torri alte N − 1 e la grande in mezzo; una torre alta
   zero non si sposta, ed è il fermo.

I guardrail, senza i quali la ricorsione era rimandata:

- **La fila delle carte la fa vedere mentre gira**: «torre alta 3 › torre alta
  2 › … › sposta da verde a rosso», ognuna con la sua altezza e le sue assi.
- **Senza il fermo il robot si ferma a `TETTO_PILA`** (40 carte, in
  `motore/esecutore.js`) dicendolo.
- **Il 💡 da 🪙50 per un progetto che chiama sé stesso scrive tutto tranne le
  chiamate** — le misure, il fermo, lo spostamento — perché lì il nodo è
  proprio la chiamata (`pezzoDi` in `motore/aiuti.js`).
- **Un livello la cui soluzione chiama sé stessa dichiara `ricorsione: true`**,
  e il banco non la srotola per misurare lo zaino (`chiamaSeStesso` in
  `motore/zaino.js`): srotolarla non finirebbe mai.
- **Le mosse ingenue sono false piste**: vincono il giorno più semplice e
  cedono solo quando la giornata smette di essere un caso particolare. Chi
  sbaglia prosegue su una strada plausibile e finisce in trappola, invece
  di sbattere al primo passo (la stessa regola di `../passo-passo/zaino.md`).
