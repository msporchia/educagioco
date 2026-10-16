# I pannelli in prova: «legno» e «rilievo»

I pannelli del sotterraneo avevano due stili: la barra in basso e le finestre (legno scuro, oro, angoli disegnati)
curate, la domanda dei quiz e i fogli piatti, blu, coi tasti a pillola. L'utente, 16 ottobre: «stona parecchio». Ci
sono due temi da provare, scelti dall'indirizzo; di difetto resta l'aspetto di prima:

- **A · legno** (`tema/legno.css`): il linguaggio della cornice e della barra su tutti i pannelli, in 2D.
- **B · rilievo** (`tema/rilievo.css`, `tema/rilievo.js`): legno più lo spessore, in CSS.

Si sceglie con `#sotterraneo&tema=legno` (o `rilievo`, `attuale`): il telefono se lo ricorda (`sotterraneo-tema`
nell'archivio, `{ tema }`), perché dall'app installata l'indirizzo non si scrive; c'è anche in `#admin`, fra i cheat a
mano. Non è un'impostazione per i bambini. Il tema è un attributo sulla radice del gioco, `data-tema="legno"` o
`"legno rilievo"` (`tema/tema.js`, `usaTema` in `Gioco.vue`): rilievo porta anche legno, così aggiunge e non ripete.
**`pietra` vale `legno`** (`temaDi`): era il primo nome, e un telefono può averlo salvato.

## Perché legno e non pietra

La prima versione di A metteva la domanda su una tavola di pietra e le risposte su lastre di pietra. L'utente: «se
abbiamo sempre usato l'ottone e il legno, perché siamo passati alla pietra qui?». La regola: **un pannello prende il
materiale della cornice e della barra** (legno scuro con le venature, oro e ottone); la pietra solo dove il posto è di
pietra, e nessun pannello lo è; il ferro nero solo per borchie e cardini (la ✕).

## I materiali

Due, più l'oro; la luce viene dall'alto a sinistra come il riflesso dei globi. I token stanno in testa a `legno.css`
(`--lg-…`).

- **Legno scuro** (`--lg-legno`, `--lg-vena`: quelli della cornice) — la tavola della domanda, i fogli dal basso, le
  modali, il dialogo, la ripresa, il cartello di fine, il pannello dello scontro nel 3D. Bordo d'oro (`--lg-oro-bordo`),
  e sulla domanda e sul cartello quattro **rivetti d'ottone** negli angoli, disegnati come livelli di fondo
  (`--lg-rivetti`: nessun elemento in più).
- **Tavole** (`--lg-tavola`, `--lg-vena-tavola`) — le risposte, le righe da scegliere, i tasti chiari: legno più chiaro
  con un filo d'ottone dentro il bordo e il fianco sotto (4 px), che si abbassano di 3 px al tocco.
- **Ottone** (`--lg-ottone`) — la consegna della domanda è una **targa d'ottone** coi due rivetti e la scritta incisa
  scura; i tasti principali, la linguetta aperta, il «+» delle caratteristiche. La riga d'attacco (la scelta pronta) è
  ottone brunito (`--lg-ottone-scuro`).

**Giusto e sbagliato non sono solo colore**: la tavola giusta diventa verde caldo col bordo d'ottone e un bagliore, con
un ✓ verde in un tondo d'ottone sull'angolo; la sbagliata rosso scuro, una ✗ in un tondo rosso col filo d'ottone, e un
tremolio (0,28 s; la giusta un guizzo di 0,26 s). Con `prefers-reduced-motion` restano segno e colore.

Le scritte da titolo sono in un carattere con le grazie del sistema (`--lg-titolo`: Palatino, Book Antiqua, Georgia,
Noto Serif) in ottone a sbalzo: niente font scaricati, il file è uno. Il testo da leggere resta senza grazie, chiaro sulle
tavole e scuro sulla targa. La grana è un `feTurbulence` in una piastrella SVG da 200 px (`--lg-grana`): il browser la
disegna una volta; **frequenza per lato intera**, se no si vede la cucitura (provato 0,018 × 220: una riga a metà tasto).
La barra in basso ha il suo foglio, sotto.

## Lo scontro nel 3D

Nel Sotterraneo 3D la scena è il palco e la scelta del colpo, la domanda e le risposte stanno nel pannello in fondo
(`viste/Pannello3d.vue`). Col tema il pannello prende la cornice: legno, bordo d'oro e i due angoli d'oro in cima
(`viste/Angoli.vue`, gli stessi di `Cornice.vue`; nel 3D ci sono sempre, spenti di difetto in `stile-3d.css`); la
tavola della domanda dentro ha il filo scuro come nella cornice del duello 2D. Le barre della vita sopra le figure
hanno il filo d'ottone, i nomi le grazie, la fila dei turni i gettoni di legno col cerchio d'ottone. Il pannello è alto
quanto prima: i combattenti restano sopra.

**2D e 3D adesso hanno lo stesso materiale, non la stessa forma**: nel 2D il duello è una finestra a quattro angoli col
palco dentro, nel 3D una cornice aperta in fondo con la scena sopra. Renderli uguali vorrebbe dire portare anche il
duello 2D in un pannello in fondo (la scelta resta all'utente).

**Il pannello sta sopra la punta dei globi**, con la cornice intera e i quattro angoli, staccato di 6 px dai bordi
(`--sot-sopra-barra`, [barra.md](barra.md#sopra-la-barra)); il pannello resta alto al più il 70% del campo, quindi su un
telefono basso (360×640) con una domanda lunga la scena resta una striscia in cima, e la camera la inquadra lì.

## La barra in basso

Col tema anche la barra è legno e ottone, e i globi sono vivi: [barra.md](barra.md#col-tema-legno). `tema/barra.css`.

## Rilievo: cosa aggiunge

- **Il fianco**: ombre impilate un pixel l'una (`--rl-fianco`, 6 px), più scure scendendo: si vede il lato della tavola.
  Premuta scende di 5 px.
- **La piega**: un tasto premuto si inclina verso il punto toccato (fino a 8°), come una tavola spinta su un bordo.
  `tema/rilievo.js` ascolta `pointerdown` sulla radice, scrive `--rl-x/--rl-y` e `data-piega` sul tasto, li toglie al
  `pointerup`. Niente fotogrammi.
- **Niente parallasse e niente piega al passaggio del mouse** (c'erano nella prima prova): sul telefono non esistono, e
  su un monitor muovevano la domanda mentre la si legge.
- **Le variabili che usano `--rl-x` si scrivono sul tasto**, non sulla radice: una custom property che ne usa un'altra
  si risolve dove è dichiarata.

## La domanda comune

`quiz/Domanda.vue` è di tutti i giochi e non sa niente dei temi: ogni proprietà che un tema cambia passa da una
variabile `--qz-…` col ripiego uguale al valore di prima (`--qz-carta-fondo`, `--qz-tasto-ombra`, `--qz-premuto`,
`--qz-giusta-moto`, `--qz-segno`…; l'elenco è nel suo `<style>`). Le proprietà ereditate (colore, ombra e allineamento
della consegna) sono scritte **senza ripiego**: non definite valgono `unset`, cioè ereditate come prima. Il tema le
definisce sulla radice del sotterraneo, e solo lì valgono.

Prova che gli altri giochi non sono cambiati: lo stile calcolato di ogni elemento della domanda, prima e dopo, con
`scatta-app --domanda ':ing:buco,tabelline' --stili '.qz-velo, .qz-velo *'` sul file di prima e su quello nuovo, e
`diff` fra i due `.stili.json`. Al 16 ottobre le sole differenze: il nome dell'animazione con l'hash dello scope, il
`--qz-min` della domanda pescata, e il gradiente scritto `0%, 100%` invece che senza (gli stessi due punti).

## Come si aggiunge un pannello

1. Le regole vanno in `tema/legno.css` sotto `.sot[data-tema~="legno"]`, coi token `--lg-…`; quelle dello spessore in
   `rilievo.css` sotto `[data-tema~="rilievo"]`.
2. Un tasto premibile: tavola (`--lg-grana` + `--lg-vena-tavola` + `--lg-tavola`, filo d'ottone `inset 0 0 0 1px`,
   fianco sotto), `:active` che scende quanto il fianco. In rilievo: il suo selettore in `TASTI` di `rilievo.js`.
3. Un bersaglio più piccolo di 48 px si allarga con un `::after` trasparente, senza spostare niente (la ✕, le caselle
   della barra verso il bordo).
4. Si guarda nel banco: una voce in `PANNELLI` di `strumenti/banco/pannello.js` (i componenti veri, i numeri dal motore)
   e una riga in `pannelli.js`.

## Il banco

`npm run pannelli` apre `strumenti/banco/pannelli.html`: una riga per pannello (la domanda aperta, giusta e sbagliata,
lo scontro 2D col pericolo e con la domanda, lo scontro 3D col pannello in fondo, zaino, bottega, pagina dell'eroe,
albero, quale pozione, dialogo, barra, fine, pausa), una colonna per tema, la larghezza (390, 320, 768, 1100) e la scala.
Ogni riquadro è un iframe di `pannello.html?p=zaino&tema=legno`, così le `@media` rispondono al riquadro; nello
scontro 3D la scena è un fondo finto. Uno scatto: `node strumenti/scatta-app.mjs --pagina
'strumenti/banco/pannelli.html?solo=barra' --porta 5207 --larghezza 1250`. Il gioco vero:
`node strumenti/scatta-app.mjs 'sotterraneo=branco&mostri=3&eroe=mago&giu=1&tema=rilievo' --dist`, il 3D
`'sotterraneo3d=1&eroe=mago&sotterraneo=branco&mostri=3&dpr=1&tema=legno' --dist --aspetta 6000`, la terra di sopra
`'tema=legno' --storia 2 --tocca '[data-azione="vita"]'`.

## Cosa costa, e la scelta

| | attuale | A · legno | B · rilievo |
|---|---|---|---|
| CSS in più | — | ~20 KB (prima della minificazione) | ~6 KB sopra legno, e 2 KB di JS |
| disegno | piatto | gradienti, la grana in cache | come A, più ombre impilate (6–9 strati per tasto) |
| strati GPU | — | nessuno in più | uno per il tasto premuto, finché dura |
| JavaScript | — | — | tre ascoltatori sulla radice, niente a fotogramma |
| rischi | — | — | il tasto premuto scende di 5 px: un dito proprio sul bordo alto può lasciarlo prima del click |

**WebGL non vale la pena**: il testo, i bersagli e i `[data-…]` dei test devono restare DOM, quindi una scena WebGL
farebbe solo il fondo dei tasti, con un contesto per pannello e la memoria della GPU sul telefono.

**Raccomandazione: A, col fianco più alto e la piega al tocco di B**: fermi si distinguono appena, la differenza di B
è nel dito.

## Cosa resta aperto

- Le caselle della barra restano alte 40 px ([barra.md](barra.md)): il bersaglio scende di 6 px verso il bordo, a 46.
- Il livello (24×15) e la riga dell'esperienza restano piccoli come prima.
- Scelto il tema, si toglie l'altro e il cheat, e i valori passano in `stile.css`.

Nei test: nessun bersaglio nuovo; il DOM e i `[data-…]` sono gli stessi in tutti i temi (nel 3D due `svg.sot-angolo`
spenti in più). `data-tema` sulla radice `.sot`, `data-piega` sul tasto premuto in rilievo.
