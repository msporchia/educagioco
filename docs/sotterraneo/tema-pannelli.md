# I pannelli in prova: «pietra» e «rilievo»

I pannelli del sotterraneo avevano due stili: la barra in basso e le finestre (legno, oro, angoli disegnati) curate,
la domanda dei quiz e i fogli piatti, blu, coi tasti a pillola. L'utente, 16 ottobre: «stona parecchio». Ci sono due
temi da provare, scelti dall'indirizzo, e di difetto resta l'aspetto di prima:

- **A · pietra** (`tema/pietra.css`): lo stesso linguaggio della barra su tutti i pannelli, in 2D.
- **B · rilievo** (`tema/rilievo.css`, `tema/rilievo.js`): pietra più la profondità, in CSS 3D.

Si sceglie con `#sotterraneo&tema=pietra` (o `rilievo`, `attuale`): il telefono se lo ricorda (`sotterraneo-tema`
nell'archivio, `{ tema }`), perché dall'app installata l'indirizzo non si scrive; c'è anche in `#admin`, fra i cheat a
mano. Non è un'impostazione per i bambini. Il tema è un attributo sulla radice del gioco, `data-tema="pietra"` o
`"pietra rilievo"` (`tema/tema.js`, `usaTema` in `Gioco.vue`): rilievo porta anche pietra, così aggiunge e non ripete.

## I materiali

Quattro, con la luce dall'alto a sinistra come il riflesso dei globi.

- **Pietra** — la domanda (una tavola incisa) e il cartello di fine: ardesia scura, la grana fine e qualche macchia
  larga, il bordo d'oro. La consegna sta in una **targa incassata** al centro; le risposte sono **lastre** di pietra
  più chiara con il fianco sotto (4 px) che si abbassano di 3 px al tocco.
- **Legno** — finestre, fogli dal basso, modali, il dialogo, la ripresa: la cornice di prima più la grana.
- **Ferro** — le caselle (incavi), i gettoni della fila dei turni, la ✕ (un borchione col filo d'oro).
- **Oro** — i tasti principali (una lastra d'oro col fianco), la linguetta aperta, le borchie delle righe da scegliere,
  i titoli.

Le scritte da titolo sono in un carattere con le grazie del sistema (`--pt-titolo`: Palatino, Book Antiqua, Georgia,
Noto Serif): niente font scaricati, il file è uno. Il testo da leggere resta senza grazie, più pesante, chiaro su
scuro (contrasto sopra 7:1 sulle lastre). **Giusto e sbagliato non sono solo colore**: un ✓ o una ✗ disegnati in un
tondo sull'angolo del tasto (SVG in data-URI), più un guizzo breve (0,26 s) per la giusta e un tremolio (0,28 s) per la
sbagliata; con `prefers-reduced-motion` restano il segno e il colore.

La grana è un `feTurbulence` in una piastrella SVG da 200 px in data-URI (`--pt-grana`, `--pt-macchie`): il browser
la disegna una volta. Le macchie solo sulle superfici grandi: sui tasti sembravano sporco. **La frequenza per il lato
deve fare un intero**, se no la piastrella mostra la cucitura (provato 0,018 × 220: una riga verticale a metà tasto).

## Rilievo: cosa aggiunge

- **Il fianco**: ombre impilate un pixel l'una (`--rl-fianco`, 6 px), più scure scendendo: si vede la faccia di lato
  della lastra. Premuta scende di 5 px.
- **La piega**: un tasto premuto si inclina verso il punto toccato (fino a 8°), come una lastra spinta su un bordo.
  `tema/rilievo.js` ascolta `pointerdown` sulla radice, scrive `--rl-x/--rl-y` e `data-piega` sul tasto, li toglie al
  `pointerup`. Niente fotogrammi.
- **Col mouse** (solo `pointerType: mouse`) il tasto si piega passando, e la tavola della domanda e le finestre girano
  di 2,5° con la consegna e le risposte staccate dal fondo (`preserve-3d`, `translateZ`): la parallasse. Sul telefono
  no: non c'è un «sopra».
- **Le variabili che usano `--rl-x` si scrivono sul tasto**, non sulla radice: una custom property che ne usa un'altra
  si risolve dove è dichiarata (sulla radice `--rl-x` non c'è e varrebbe 0).

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

1. Le regole vanno in `tema/pietra.css` sotto `.sot[data-tema~="pietra"]`, coi token `--pt-…` (materiali, ombre,
   fianco); quelle di profondità in `rilievo.css` sotto `[data-tema~="rilievo"]`.
2. Un tasto premibile: lastra (`--pt-grana` + gradiente + `inset 0 1px 0` chiaro + fianco sotto), `:active` che
   scende quanto il fianco. In rilievo: il suo selettore in `TASTI` di `rilievo.js` e in `[data-piega]` di `rilievo.css`.
3. Un bersaglio più piccolo di 48 px si allarga con un `::after` trasparente, senza spostare niente (la ✕, le caselle
   della barra verso il bordo).
4. Si guarda nel banco: una voce in `PANNELLI` di `strumenti/banco/pannello.js` (i componenti veri, i numeri dal motore)
   e una riga in `pannelli.js`.

## Il banco

`npm run pannelli` apre `strumenti/banco/pannelli.html`: una riga per pannello (la domanda aperta, giusta e
sbagliata, lo scontro col pericolo e con la domanda, zaino, bottega, pagina dell'eroe, albero, quale pozione, dialogo,
barra, fine, pausa), una colonna per tema, la larghezza (390, 320, 768, 1100) e la scala. Ogni riquadro è un iframe di
`pannello.html?p=zaino&tema=pietra`, così le `@media` rispondono al riquadro. Uno scatto:
`node strumenti/scatta-app.mjs --pagina 'strumenti/banco/pannelli.html?solo=barra' --porta 5207 --larghezza 1250`.
Il gioco vero: `node strumenti/scatta-app.mjs 'sotterraneo=branco&mostri=3&eroe=mago&giu=1&tema=rilievo' --dist`, e
per la terra di sopra `'tema=pietra' --storia 2 --tocca '[data-azione="vita"]'`.

## Cosa costa, e la scelta

| | attuale | A · pietra | B · rilievo |
|---|---|---|---|
| CSS in più | — | ~19 KB (prima della minificazione) | ~9 KB sopra pietra, e 3 KB di JS |
| disegno | piatto | gradienti, la grana in cache | come A, più ombre impilate (6–9 strati per tasto) |
| strati GPU | — | nessuno in più | uno per il tasto premuto o sotto il mouse, finché dura |
| JavaScript | — | — | quattro ascoltatori sulla radice, niente a fotogramma |
| rischi | — | — | il tasto premuto scende di 5 px: un dito proprio sul bordo alto può lasciarlo prima del click; testo appena sfocato durante la piega |

**WebGL non vale la pena**: il testo, i bersagli e i `[data-…]` dei test devono restare DOM, quindi una scena WebGL
farebbe solo il fondo dei tasti, con un contesto per pannello da accendere e spegnere, la memoria della GPU sul
telefono e nessun guadagno che le ombre impilate non diano già.

**Raccomandazione: A, con il fianco più alto e la piega al tocco di B** (le due cose che si sentono col dito); niente
parallasse e niente piega al passaggio del mouse, che sul telefono non esistono e su un monitor muovono la domanda
mentre la si legge. A fermo e B fermo, negli scatti, si distinguono appena: la differenza di B è nel tocco.

## Cosa resta aperto

- Le caselle della barra restano alte 40 px ([barra.md](barra.md)): il bersaglio scende di 6 px verso il bordo, a 46.
- Il livello (24×15) e la riga dell'esperienza restano piccoli come prima.
- Scelto il tema, si toglie l'altro e il cheat, e i valori passano in `stile.css`.

Nei test: nessun bersaglio nuovo; il DOM e i `[data-…]` sono gli stessi in tutti i temi. `data-tema` sulla radice
`.sot`, `data-piega` sul tasto premuto in rilievo.
