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

Rifatto il 26 novembre 2026 (segnalato dall'utente: la prova stava ferma quasi tutto il tempo, durava tre-quattro minuti e dava
«a scatti» a English). **Si misura il gioco giocato, non il gioco aperto**: un minuto e poco più.

1. **Un riposo** prima del primo gioco (`riposo` di `bambini/prova-pc-giro.js`): mezzo secondo di fotogrammi calmi, fino a 4 s, così
   il lavoro della pagina appena aperta (25 MB) non finisce nella misura di English.
2. **Ogni gioco vero della scuola**, uno dopo l'altro e dal più leggero (`GIOCHI_PROVA` in `bambini/prova-pc.js`, con gli esercizi
   delle prove della scuola), si monta sotto la fascia in fascia bassa, e si aspetta che sia **in scena** (montato e, se disegna,
   con una tela visibile qualunque; fino a 20 s, 30 per un 3D). Quanto ci mette è `partito`.
3. **La regia** (`REGIE` di `prova-pc-giro.js`) lo gioca come un bambino nel momento più pieno: English risponde (la risposta
   giusta, le tessere, «Fatto»), Passo passo scrive la fila e manda il coniglio, il Robot esegue la soluzione del livello
   (`window.__soluzione`), il castello ha una torre su ogni piazzola e chiama le ondate, Castle Battle è piena da tutte e due le
   parti, Survivors ha la folla di fine tappa e intanto si potenzia rispondendo (`window.__estremo`, `window.__sale`), gli
   Asteroidi sparano, le pozioni ordinano due ampolle e il mercante versa (`window.__poz`), la cucina fa un panino e dà il resto,
   il sotterraneo cammina e va alla cosa più vicina che chiede, e risponde. A ogni colpo chiude la guida e toglie una pausa.
4. **Si conta per 5 secondi**, scartato il primo (`TEMPI`): le immagini al secondo, la parte sotto i 30, le pause oltre 100 ms, e
   **quanto ci mette lo schermo a rispondere a un tocco** della regia (dal tocco al secondo fotogramma dopo: `risposta`, mediana
   e 95%). L'esito è il peggio fra le immagini (da 50 liscio, da 30 «ogni tanto scatta») e la risposta (fino a 150 ms liscio,
   fino a 350 «ogni tanto scatta»): una pagina ferma non va più a scatti solo perché si ridisegna piano.
5. **La soluzione B**: un gioco sotto 40 immagini (`SOGLIA_B`) si rifà con la grafica sgranata, e la si tiene se dà almeno 5
   immagini in più (`provaB`, `tieniB`).
6. Alla fine la **prova del processore** (`proveCpu` della misura di casa) e il verdetto.

Provato prima: una scena «base» col pilota che toccava ogni tanto e una «al massimo» per cinque giochi, 2,5 + 10 s a scena. Per
English, Passo passo e Robot lo schermo restava quasi fermo e il numero non diceva niente del gioco; le scene al massimo
allungavano a tre-quattro minuti. Il momento pieno dei giochi pesanti ora è dentro la loro regia. Il tocco che apre uno scontro
del sotterraneo costa (si prepara la scena del combattimento): una volta per scontro, e la regia cammina anche, così non fa da
mediana.

**La fascia in cima**, per tutta la prova: «Prova in corso: non toccare niente, fa tutto da sola», il gioco di adesso, quanto manca
e una barra; il gioco sta sotto, intero. «Ferma» chiude e tiene quello che c'è.

## La soluzione B: meno pixel

Una leva sola per tutti (`bambini/pixel.js`): i giochi contano i pixel da `window.devicePixelRatio`, e mentre gira un gioco in B
lo si abbassa a `SCALA_B` (0,6 per lato, un terzo dei pixel). Le tele 2D, gli Asteroidi e il sotterraneo lo leggono da soli; pozioni
e cucina a scuola fissavano un pixel per punto, ora «uno o meno se lo schermo dice meno». Il PC si ricorda i giochi in B in
`localStorage['scuola:pixel']` (`{ quando, giochi: { sotterraneo: 0.6 } }`): è del computer, non del bambino, e `rete.js` non la
butta. La pagina dei bambini la applica al gioco del blocco (`App.vue`, prima che il gioco si monti). Solo una prova intera decide:
fermata a metà non cambia il ricordo; rifatta, i giochi che non ne hanno più bisogno tornano normali.

## Il verdetto e l'invio

Per la maestra: la scheda video (senza il giro di ANGLE), una riga per gioco con l'esito, «(grafica sgranata)» se tiene B, e sotto
il perché (un «non parte», o «risponde ai tocchi in N ms»): «non è comparso in N secondi», o il motivo che dà la
Vista del gioco quando si arrende («il gioco non parte (errore: …)», «(senza 3D)», «(è uscito dal gioco …)»); poi le frasi (`frasi`):
- **il 3D lo fa il processore** (SwiftShader, llvmpipe, il driver base di Windows): in rosso, con dove accendere in Chrome
  l'accelerazione grafica;
- **niente WebGL 2**: i giochi 3D non partono;
- quali giochi da ora partono sgranati.

**Il nome della scheda è indicativo**: Chrome non dice più il modello vero ma una famiglia («NVIDIA GeForce GTX 980…, or similar»),
e la prova lo scrive «simile a …» (`simile` del verdetto).

**Un tasto solo**, «Invia il resoconto»: apre il modulo Tally dei giudizi di casa già compilato (`resoconto`, sempre in un invio
solo, sotto i 3400 caratteri del campo), e lì la maestra preme Invia. Sopra c'è un campo facoltativo «Quale computer è?» (l'aula,
il posto), che finisce in testa al resoconto. Il modulo riceve il resoconto in campi nascosti e sembra vuoto: sotto il tasto lo si
dice in grassetto («è normale, il resoconto è già dentro»), e «Cosa mandi» apre il testo che parte (`[data-prova-pc-cosa-parte]`). Il resoconto: data e versione, sistema e browser (Firefox ed Edge col loro nome), core, memoria, schermo e finestra, i ms del
processore, la scheda (e la stringa intera della GPU), la pagina (dal file o dal sito, quanto ci ha messo a caricarsi, la rete), se
la pagina è stata nascosta durante la prova, e per gioco fps, la parte sotto i 30, i fermi oltre 100 ms, la risposta ai tocchi (mediana/95%), in quanti
secondi il gioco è comparso, la sua B e se B è tenuta. Scelto per non dover tornare dalla maestra: il caso peggiore sta sotto i 3400
caratteri (`unita/scuola-prova-pc`). Niente di personale: nessun nome, solo il computer.

## Perché i giochi veri, e non solo le scene della misura di casa

Il primo giro usava solo le scene di `grafica/benchmark/veri/` (asteroidi e discese): misuravano due giochi su dieci. Il gioco vero
giocato dalla regia dice quello che vedrà il bambino. Della misura di casa restano la scheda video (`infoGpuVeri`) e la prova del
processore (`proveCpu`); l'elenco delle sue scene sta in `veri/tappe.js` e non in `veri.js`: con dentro il caricamento della
fattoria, la pagina della scuola se la sarebbe portata dietro (`unita/scuola-pacchetto` segue anche gli `import()`).

## Provare

Il pannello del browser di sviluppo, quando è nascosto, non misura: rallenta i timer, si ferma a ~30 immagini e mette in pausa i
giochi. I numeri veri vengono dai PC della scuola. Nel server di sviluppo la prima cucina fa ricaricare la pagina (Vite prepara i
pezzi di three): nel file costruito no. `window.__provaSolo = ['sotterraneo']` prova solo quei giochi (e non tocca il ricordo),
`__benchmarkCorto` accorcia i tempi, `__provaSogliaB` cambia la soglia di B.

Nei test: `unita/scuola-prova-pc` (i giochi, i loro esercizi e la loro regia, B, il verdetto con la risposta ai tocchi, il
resoconto) e `integrazione/scuola-prova-pc` (il link della maestra, la prova che ai bambini non si vede, la fascia, il giro corto con
B per tutti: dieci righe, nessuno che non parte, i tocchi misurati dove la regia tocca, l'invio compilato, il ricordo; con
`--scatti` una foto di ogni gioco mentre la regia lo gioca). Bersagli: `[data-azione="prova-computer"]` (maestra), `[data-azione="prova-pc-avvia"]`, `[data-prova-pc-corre]`,
`[data-prova-pc-manca]`, `[data-prova-pc-palco]`, `[data-prova-pc-fine]`, `[data-gioco-provato]` con `data-esito` e `data-b`,
`[data-prova-pc-dove]`, `[data-azione="prova-pc-invia"]`, `[data-azione="prova-pc-chiudi"]`.
