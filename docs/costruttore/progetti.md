# Il costruttore — i progetti devono servire

Progetti (funzioni), attrezzi, lo zaino di righe e l'editor. Codice in
`src/giochi/costruttore/`.

## Il problema

Un progetto non serve perché il racconto lo chiede: serve quando senza non
ci si sta. Misurato: tutti e quattordici i livelli con un progetto si
vincevano srotolando le chiamate, e in undici il programma srotolato era più
corto. Due pezzi lo tengono fermo: gli attrezzi e lo zaino.

## Gli attrezzi del capomastro 🔒

- **Progetti già scritti e chiusi** (`dati/attrezzi.js`, fabbrica
  `attrezzo(p, { da, finisce })`), quasi sempre cose che il bambino ha
  costruito in un livello prima (`da`): la torre della torretta, il muro del
  muro lungo, l'albero del bosco.
- **Si chiamano, si leggono, non si cambiano**, e dicono dove lasciano il
  robot (`finisce`: «in cima alla torre»), perché la riga dopo comincia da lì.
  Si impara a usare una funzione prima di scriverla: il capitolo dei
  progetti comincia così (la cinta).
- **Li rimette nel programma `motore/attrezzi.js`** (`conAttrezzi`) a ogni
  apertura, e non si salvano come roba del bambino.
- **Le strade di una mappa del porto sono attrezzi di quella mappa**, non
  del catalogo (vedi [porto.md](porto.md)).

## Lo zaino di righe 📝

- **`zaino` nel livello: quante righe scrive il bambino, attrezzi esclusi**
  (`motore/zaino.js`: `righeScritte`, `ciSta`). Non è un par — meno righe non
  vale di più — è il vincolo che Passo passo ha già: tre alberi a mano non ci
  stanno, un progetto chiamato tre volte sì.
- **Il banco pretende** (`unita/costruttore`) che in un livello dei progetti
  la soluzione **srotolata** (`srotola`, le chiamate sostituite dal loro
  corpo) non ci stia, e che ogni mossa ingenua perda un ordine o non ci stia.
- **Un livello la cui soluzione chiama sé stessa dichiara `ricorsione: true`**,
  e il banco non la srotola: srotolarla non finirebbe mai (`chiamaSeStesso`,
  vedi [algoritmi.md](algoritmi.md)).

## L'editor

- **↶ annulla, dieci passi**, in memoria per livello: un 🗑 su un blocco porta
  via tutto quello che ha dentro, e annulla lo rimette.
- **La mano** (`trasloca`/`incollaCopia` in `motore/modifica.js`): ✂ sposta e
  ⧉ copia prendono una riga col suo blocco, e ogni elenco mostra i «📥 qui»
  dove posarla — dentro e fuori dai ripeti, e in un'altra scheda, cioè dentro
  un progetto. Si costruisce a pezzi: senza, due righe da mettere dentro un
  ripeti andavano cancellate e riscritte.

Nei test: `[data-azione="sposta"|"copia"|"lascia"]`, `[data-mano]`,
`[data-posa="prima:<id>"|"fondo:<elenco>"]`.
