# La prova del computer della classe

I PC delle scuole sono vecchi computer e Chromebook dell'era del covid: prima di una lezione si vuole sapere se i giochi
ci vanno, e farlo sapere a chi fa il gioco senza che la maestra debba spiegare niente.

## Dove si lancia

Dalla pagina della maestra, scheda «La pagina dei bambini», sotto «Codice per i PC»: **«Prova un computer della classe»**, un
link alla pagina dei bambini con `#prova-computer` (`[data-azione="prova-computer"]`). Aperto sul PC da provare, la pagina dei bambini
parte sulla prova (`App.vue` toglie il `#` e apre `viste/ProvaComputer.vue`); alla ✕ la scheda si chiude, o si torna al codice.
**Ai bambini non si mostra**: senza quell'indirizzo la pagina ha solo il codice (prima c'era un tasto sotto il codice: tolto,
perché restava visibile ai bambini).

## Il giro

1. **Ogni gioco vero della scuola**, uno dopo l'altro e dal più leggero (`GIOCHI_PROVA` in `bambini/prova-pc.js`, con gli
   esercizi delle prove della scuola), si monta sotto una fascia come in una lezione, in fascia bassa come sempre a scuola.
2. Si aspetta che sia **in scena**: montato e, se disegna su una tela, una tela visibile con le sue misure, fino a 20 s (30 per un
   3D, che carica i modelli). Una tela qualunque: la prima può essere nascosta (la minimappa del sotterraneo, il disegno di riserva),
   e guardando solo quella Asteroidi, pozioni e sotterraneo risultavano «non partiti» girando.
3. **La scena base**: un pilota lo fa muovere mentre si conta (`bambini/prova-pc-giro.js`): negli Asteroidi frecce e Invio (sparare,
   esplodere), in Passo passo le frecce e Invio (il coniglio corre), nel castello due torri (senza conto: si misura il disegno) e le
   ondate, nel sotterraneo l'eroe che cammina con dei clic sul campo; Castle Battle e Survivors vanno da soli. A ogni colpo chiude
   la guida «Come si gioca» e toglie una pausa messa dal gioco.
4. **La scena al massimo**, per i giochi che hanno un peggio da cercare (`massimo` in `GIOCHI_PROVA`):
   - `gioco`: il gioco stesso, che appena in scena si porta al suo peggio con `window.__estremo` (lo registra lui al montaggio e
     lo toglie allo smontaggio): **il castello** una torre su ogni piazzola, e il pilota chiama un'ondata dietro l'altra;
     **Castle Battle** le sei piazzole piene da tutte e due le parti (la battaglia di `#arena=lava&battaglia=40`); **Survivors**
     la marea di fine tappa (o di sette minuti) con l'eroe che non cade, così la folla resta in campo;
   - `veri`: una scena della misura di casa (`grafica/benchmark/veri/`): **gli Asteroidi** con un'esplosione al secondo, **il
     sotterraneo** con lo scontro contro sei mostri leggendari e un colpo ogni 0,7 s.
   Passo passo, Robot ed English non ne hanno; pozioni e cucina non ancora.
5. Si contano **le immagini al secondo** come le vede chi gioca (gli intervalli fra un `requestAnimationFrame` e l'altro): 2,5 s
   scartati, 10 contati (`TEMPI`). Da 50 liscio, da 30 «ogni tanto scatta», sotto a scatti (come gli fps veri di casa).
6. **La soluzione B**: una scena sotto 40 (`SOGLIA_B`) si rifà con la grafica sgranata. B si decide sulla scena peggiore del gioco
   e la si tiene se lì dà almeno 5 immagini in più (`provaB`, `tieniB`); vale poi per tutto il gioco.
7. Alla fine la **prova del processore** (`proveCpu` della misura di casa) e il verdetto. Quindici scene, B comprese: tre-quattro minuti.

**La fascia in cima**, per tutta la prova: «Prova in corso: non toccare niente, fa tutto da sola», il gioco di adesso, quanto manca
(si ristima a ogni scena da quelle che restano) e una barra; il gioco sta sotto, intero. «Ferma» chiude e tiene quello che c'è.

## La soluzione B: meno pixel

Una leva sola per tutti (`bambini/pixel.js`): i giochi contano i pixel da `window.devicePixelRatio`, e mentre gira un gioco in B
lo si abbassa a `SCALA_B` (0,6 per lato, un terzo dei pixel). Le tele 2D, gli Asteroidi e il sotterraneo lo leggono da soli; pozioni
e cucina a scuola fissavano un pixel per punto, ora «uno o meno se lo schermo dice meno». Il PC si ricorda i giochi in B in
`localStorage['scuola:pixel']` (`{ quando, giochi: { sotterraneo: 0.6 } }`): è del computer, non del bambino, e `rete.js` non la
butta. La pagina dei bambini la applica al gioco del blocco (`App.vue`, prima che il gioco si monti). Solo una prova intera decide:
fermata a metà non cambia il ricordo; rifatta, i giochi che non ne hanno più bisogno tornano normali.

## Il verdetto e l'invio

Per la maestra: la scheda video (senza il giro di ANGLE), una riga per gioco con l'esito, «(grafica sgranata)» se tiene B, «al
massimo: …» se ha la scena al massimo, e sotto il perché di un «non parte»: «non è comparso in N secondi», o il motivo che dà la
Vista del gioco quando si arrende («il gioco non parte (errore: …)», «(senza 3D)», «(è uscito dal gioco …)»); poi le frasi (`frasi`):
- **il 3D lo fa il processore** (SwiftShader, llvmpipe, il driver base di Windows): in rosso, con dove accendere in Chrome
  l'accelerazione grafica;
- **niente WebGL 2**: i giochi 3D non partono;
- quali giochi da ora partono sgranati.

**Il nome della scheda è indicativo**: Chrome non dice più il modello vero ma una famiglia («NVIDIA GeForce GTX 980…, or similar»),
e la prova lo scrive «simile a …» (`simile` del verdetto).

**Un tasto solo**, «Invia il resoconto»: apre il modulo Tally dei giudizi di casa già compilato (`resoconto`, sempre in un invio
solo, sotto i 3400 caratteri del campo), e lì la maestra preme Invia. Sopra c'è un campo facoltativo «Quale computer è?» (l'aula,
il posto), che finisce in testa al resoconto. Il resoconto: data e versione, sistema e Chrome, core, memoria, schermo, i ms del
processore, la scheda, e per gioco ogni scena con fps, la parte sotto i 30, i fermi oltre 100 ms, la sua B e se B è tenuta.

## Perché i giochi veri, e non solo le scene della misura di casa

Il primo giro usava solo le scene di `grafica/benchmark/veri/` (asteroidi e discese): misuravano due giochi su dieci. Il gioco vero col
pilota dice quello che vedrà il bambino; le scene di casa restano per il massimo dei due giochi 3D più pesanti. L'elenco delle scene
di casa sta in `veri/tappe.js` e non in `veri.js`: con dentro il caricamento della fattoria, la pagina della scuola se la sarebbe
portata dietro (`unita/scuola-pacchetto` segue anche gli `import()`).

## Provare

Il pannello del browser di sviluppo, quando è nascosto, non misura: rallenta i timer, si ferma a ~30 immagini e mette in pausa i
giochi. I numeri veri vengono dai PC della scuola. Nel server di sviluppo la prima cucina fa ricaricare la pagina (Vite prepara i
pezzi di three): nel file costruito no. `window.__provaSolo = ['sotterraneo']` prova solo quei giochi (e non tocca il ricordo),
`__benchmarkCorto` accorcia i tempi, `__provaSogliaB` cambia la soglia di B.

Nei test: `unita/scuola-prova-pc` (i giochi, i loro esercizi e le scene al massimo, B, il verdetto, il resoconto) e
`integrazione/scuola-prova-pc` (il link della maestra, la prova che ai bambini non si vede, la fascia, il giro corto con B per tutte
le scene: dieci righe, cinque al massimo, nessuna che non parte, l'invio compilato, il ricordo; con `--scatti` le foto delle scene
al massimo). Bersagli: `[data-azione="prova-computer"]` (maestra), `[data-azione="prova-pc-avvia"]`, `[data-prova-pc-corre]`,
`[data-prova-pc-manca]`, `[data-prova-pc-palco]`, `[data-prova-pc-fine]`, `[data-gioco-provato]` con `data-esito` e `data-b`,
`[data-massimo]`, `[data-prova-pc-dove]`, `[data-azione="prova-pc-invia"]`, `[data-azione="prova-pc-chiudi"]`.
