# La prova del computer della classe

I PC delle scuole sono vecchi computer e Chromebook dell'era del covid: prima di una lezione si vuole sapere se i giochi
ci vanno, e farlo sapere a chi fa il gioco senza che la maestra debba spiegare niente. Dalla schermata del codice della
pagina dei bambini, sotto «Senza lezione», c'è **«Prova questo computer (per la maestra)»**
(`src/scuola/bambini/viste/ProvaComputer.vue`).

## Il giro

1. **Ogni gioco vero della scuola**, uno dopo l'altro e dal più leggero (`GIOCHI_PROVA` in `bambini/prova-pc.js`, con gli
   esercizi delle prove della scuola), si monta a tutto schermo come in una lezione, in fascia bassa come sempre a scuola.
2. Si aspetta che sia **in scena** (montato e, se disegna su una tela, la tela misurata: un 3D carica i modelli prima), fino a 20 s.
3. Un **pilota** lo fa muovere mentre si conta (`bambini/prova-pc-giro.js`): negli Asteroidi frecce e Invio (sparare, esplodere),
   in Passo passo le frecce e Invio (il coniglio corre), nel castello «Comincia la battaglia», nel sotterraneo l'eroe che cammina
   con dei clic sul campo; Castle Battle e Survivors vanno da soli. A ogni colpo chiude la guida «Come si gioca» e toglie una
   pausa messa dal gioco.
4. Si contano **le immagini al secondo** come le vede chi gioca (gli intervalli fra un `requestAnimationFrame` e l'altro): 3 s
   scartati, 12 s contati (`TEMPI`). Da 50 liscio, da 30 «ogni tanto scatta», sotto a scatti (come gli fps veri di casa).
5. **La soluzione B**: un gioco sotto 40 (`SOGLIA_B`) si rifà con la grafica sgranata, e la si tiene se dà almeno 5 immagini in
   più (`provaB`, `tieniB`). Dieci giochi, B comprese: tre-quattro minuti.
6. Alla fine la **prova del processore** (`proveCpu` della misura di casa) e il verdetto.

## La soluzione B: meno pixel

Una leva sola per tutti (`bambini/pixel.js`): i giochi contano i pixel da `window.devicePixelRatio`, e mentre gira un gioco in B
lo si abbassa a `SCALA_B` (0,6 per lato, un terzo dei pixel). Le tele 2D, gli Asteroidi e il sotterraneo lo leggono da soli; pozioni
e cucina a scuola fissavano un pixel per punto, ora «uno o meno se lo schermo dice meno». Il PC si ricorda i giochi in B in
`localStorage['scuola:pixel']` (`{ quando, giochi: { sotterraneo: 0.6 } }`): è del computer, non del bambino, e `rete.js` non la
butta. La pagina dei bambini la applica al gioco del blocco (`App.vue`, prima che il gioco si monti). Solo una prova intera decide:
fermata a metà non cambia il ricordo; rifatta, i giochi che non ne hanno più bisogno tornano normali.

## Il verdetto e l'invio

Per la maestra: la scheda video (senza il giro di ANGLE), una riga per gioco con l'esito e «(grafica sgranata)» se tiene B, e le
frasi (`frasi`):
- **il 3D lo fa il processore** (SwiftShader, llvmpipe, il driver base di Windows): in rosso, con dove accendere in Chrome
  l'accelerazione grafica;
- **niente WebGL 2**: i giochi 3D non partono;
- quali giochi da ora partono sgranati.

**Un tasto solo**, «Invia il resoconto»: apre il modulo Tally dei giudizi di casa già compilato (`resoconto`, sempre in un invio
solo, sotto i 3400 caratteri del campo), e lì la maestra preme Invia. Sopra c'è un campo facoltativo «Quale computer è?» (l'aula,
il posto), che finisce in testa al resoconto. Il resoconto: data e versione, sistema e Chrome, core, memoria, schermo, i ms del
processore, la scheda, e per gioco fps, la parte sotto i 30, i fermi oltre 100 ms e, se c'è, la riga di B.

## Perché le scene vere dei giochi, e non quelle della misura di casa

Il primo giro usava le scene di `grafica/benchmark/veri/` (asteroidi e discese): misuravano due giochi su dieci, e uno scontro
costruito apposta. Il gioco vero col pilota dice quello che vedrà il bambino. L'elenco delle scene di casa sta in
`veri/tappe.js` e non in `veri.js`: con dentro il caricamento della fattoria, la pagina della scuola se la sarebbe portata dietro
(`unita/scuola-pacchetto` segue anche gli `import()`).

## Provare

Il pannello del browser di sviluppo non misura: lavora in secondo piano, si ferma a ~30 immagini e mette in pausa i giochi. I numeri
veri vengono dai PC della scuola. Nel server di sviluppo la prima cucina fa ricaricare la pagina (Vite prepara i pezzi di three):
nel file costruito no. `window.__provaSolo = ['sotterraneo']` prova solo quei giochi (e non tocca il ricordo), `__benchmarkCorto`
accorcia i tempi, `__provaSogliaB` cambia la soglia di B.

Nei test: `unita/scuola-prova-pc` (i giochi e i loro esercizi, B, il verdetto, il resoconto) e `integrazione/scuola-prova-pc` (il
giro corto con B per tutti: dieci righe, nessuno che non parte, l'invio compilato, il ricordo). Bersagli: `[data-azione="prova-pc"]`,
`[data-azione="prova-pc-avvia"]`, `[data-prova-pc-corre]`, `[data-prova-pc-palco]`, `[data-prova-pc-fine]`, `[data-gioco-provato]`
con `data-esito` e `data-b`, `[data-prova-pc-dove]`, `[data-azione="prova-pc-invia"]`, `[data-azione="prova-pc-chiudi"]`.
