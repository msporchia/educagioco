# English a mondi — il libro a schermo

Quello che il bambino vede del libro, e le scelte prese costruendolo
(`viste/Libro.vue`, `viste/Testo.vue`, la parte del libro in `Gioco.vue`).
Come sono scritte le storie in [libro.md](libro.md) e
[libro-racconti.md](libro-racconti.md); la mappa, le tappe e la parola da
toccare in [mondi-vista.md](mondi-vista.md).

## Leggere

Una storia si legge **una pagina alla volta, di seguito, come prosa**, con
la tipografia di un libro (serif, 19–22 px, capolettera sulla prima
pagina): le frasi sono un racconto, e una riga per frase lo faceva
sembrare un esercizio.

- **Le battute vanno a capo**, una per volta come in un copione: sopra,
  il nome di chi parla in italiano (maiuscoletto, non si tocca), e un filo
  colorato a sinistra, un colore per personaggio. Il colore aiuta a
  seguire la conversazione ma non dice niente da solo: il nome c'è
  sempre. La narrazione resta prosa di seguito. Tutto prosa, le battute di
  due persone finivano nella stessa riga e non si capiva chi parlava
  ([libro.md](libro.md#il-formato-di-una-storia)).
- **Si sfoglia con due tasti grandi**, ← e →, con «pagina 2 di 4» in
  mezzo; «Ho letto →» c'è solo all'ultima pagina, sotto le frecce e non al
  loro posto, così un doppio tocco sulla freccia non chiude la lettura.
  Niente strisciata: i tasti bastano, e una strisciata su un testo che si
  tocca parola per parola ruberebbe tocchi. Una storia di una pagina non
  ha frecce.
- **Le parole della storia** ([libro-racconti.md](libro-racconti.md#le-parole-della-storia))
  hanno **un filo d'oro sotto** al posto dei puntini delle altre: un segno
  leggero, non un colore che grida, perché il testo resta un racconto e non
  un elenco di parole evidenziate. Sotto il testo, «Quelle sottolineate sono
  nuove: toccarle è gratis». Toccata, la nuvoletta dice la traduzione e
  «parola nuova della storia: è gratis»; non chiede mai prima, l'indicatore
  delle monete non cambia.
- **Una puntata** ha «Puntata 2» in piccolo sopra il titolo, e in testa alla
  prima pagina **«Nella puntata prima»**: un blocco in corsivo col titolo in
  italiano (come il nome di chi parla), separato dal racconto da un filo.

## Le domande

In italiano, una alla volta, col testo sempre sopra (ridotto e scorrevole)
**e le frecce ancora lì**: rileggere è lecito, anche tornando indietro di
pagina. Sopra la consegna, «Domanda 2 di 6 · Chi l'ha detto?» (il tipo, per
quelli nuovi).

- **A scelta e vero/falso**: quattro (o due, tre) risposte in colonna. Le
  sbagliate non si spiegano — «rileggi la storia, anche sfogliando» —
  perché la risposta è nel testo.
- **Chi l'ha detto?**: la battuta in inglese fra virgolette, in corsivo su
  un fondo da citazione; le parole si toccano come nel testo. Le risposte
  sono nomi.
- **Tocca la frase**: il testo sopra **diventa a frasi**, un blocco
  tratteggiato per frase (col nome sopra, se è una battuta), che si tocca
  per rispondere; si sfoglia per cercarla. Qui un tocco ha già un mestiere,
  quindi la traduzione di una parola si chiede **tenendo premuto** (450 ms,
  `tenere.js`, come le tessere; il click dopo la pressione si ingoia), e
  la consegna lo dice. Blocchi e non parole sottolineate da toccare: una
  frase intera è il bersaglio grande che il dito prende senza sbagliare
  ([../core/il-dito.md](../core/il-dito.md)). Dopo la risposta la frase
  giusta si fa verde, quella toccata rossa, le altre sbiadiscono; dopo uno
  sbaglio il testo torna da sé alla pagina della frase giusta.
- **Metti in ordine**: in alto la fila tratteggiata, sotto i fatti come
  tessere lunghe, una per riga; toccato nel banco un fatto va in fondo alla
  fila (col suo numero), toccato nella fila torna giù; «Fatto ✓» con tutti
  i fatti in fila. Dopo uno sbaglio i fatti fuori posto si colorano e sotto
  c'è l'ordine giusto, numerato.

L'attesa dopo uno sbaglio conta anche la soluzione da leggere
(`attesaDellEsito` con le sue righe): la frase giusta, o i fatti in ordine.

## Il cartello di fine

«Un’altra storia →» accanto a «La mappa», quando c'è un'altra storia da
offrire (`unAltraStoria`). Dopo una puntata il tasto grande è **«Puntata 2
→»**, e «Un'altra storia» resta accanto, più chiaro. La storia nuova si
apre nello stesso componente, quindi `Libro.vue` riparte dalla prima pagina
da sé (un `watch` sulla storia), e la fila di «metti in ordine» si svuota a
ogni domanda.

## Nei test

`unita/inglese-libro` (le regole, [libro.md](libro.md#si-controlla-da-sé)) e
`integrazione/inglese-mondi`: il libro apre la storia non letta con le
battute di Leo e Laura col loro nome, una parola che costa chiede prima,
si risponde e la storia è letta; «Un'altra storia» ne apre un'altra che si
sfoglia anche durante le domande; in quinta la prima puntata della «Vecchia
mappa», una parola della storia saputa (*tree*) toccata gratis e senza
segni nello SRS, ogni domanda risposta giusta — la frase cercata sfogliando
e toccata, l'ordine composto — tutte pagate, e «Puntata 2» apre la puntata
col riassunto, lo stesso nonno e lo stesso mezzo.

Bersagli: il libro `[data-libro-aperto]`, `[data-libro-testo]` con
`[data-pagina]`, `[data-pagine]` e `[data-a-frasi="1"]` (durante «tocca la
frase»), il numero `[data-puntata]`, il blocco `[data-riassunto]`, le
battute `[data-battuta][data-chi="<chiave di CHI_PARLA>"]` (il nome in
`.ing-chi`), la parola `[data-parola]` e quella della storia
`[data-parola][data-storia]`, la nuvoletta `[data-traduzione]` con
`[data-della-storia]`, `[data-azione="pagina-indietro"|"pagina-avanti"]`,
`[data-pagina-di]`, `[data-azione="ho-letto"]`; la domanda
`[data-libro-domanda]` con `[data-k]` e `[data-tipo]` (`scelta`, `vf`,
`chi`, `frase`, `ordine`), le opzioni `[data-opzione]` (e `[data-giusta]`),
la battuta `[data-citazione]`, le frasi da toccare `[data-frase="<indice>"]`
(e `[data-giusta]` sulla giusta), i fatti `[data-banco] [data-tessera]` con
`[data-posto]` (il posto nell'ordine giusto), `[data-fila] [data-in-fila]`
(e `[data-sbagliata]`), `[data-azione="consegna"]`, l'esito
`[data-esito="giusta"|"sbagliata"]` con `[data-si-fa]` (la soluzione) e
`[data-attesa]`; il cartello `[data-fine]` con
`[data-azione="avanti"|"altra-storia"|"mappa"]`.
