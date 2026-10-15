# Avvio e memoria

Quanto ci mette il file unico ad aprirsi e quanta memoria d'immagini si tiene.
Lo misura `node strumenti/misura-avvio.mjs` (`--lento 4`, un gioco per nome,
`--dist file`, `--soglia MB`): per la home il tempo a «carte toccabili» e a
prima cosa dipinta, il blocco più lungo del thread, la memoria di JavaScript;
per ogni gioco aperto dall'indirizzo i MB che le immagini occuperebbero
**decodificate** (larghezza × altezza × 4), più le tele.

## Cosa dice il numero

- **I MB decodificati contano più dei MB del file.** Un atlante 2048×2048 pesa
  16 MB in memoria qualunque sia il suo peso su disco; uno 4096×4096, 64 MB. Su
  un telefono povero è la memoria delle texture a finire, non il disco.
- **Il numero è un tetto, non una fotografia della GPU**: conta ogni immagine
  viva una volta sola (`new Image()`, `<img>`, sfondi in CSS) più le tele.
  Non vede le texture che il browser butta e ricrea da solo.
- **Un gioco si misura dalla schermata d'ingresso**, non giocando: le immagini
  che un gioco carica solo a partita iniziata (survivors, arena, castello) qui
  non ci sono ancora. Per quelle serve un tocco in più nello strumento.
- **Come un telefono**: `--lento 4` rallenta la CPU, non la GPU né la rete. Il
  tempo di scaricare il file da GitHub Pages non c'è (si apre da `file://`).

## Lo stato (15 ottobre 2026, build di `claude/priorita-test-velocita-mobile`)

File 26,6 MB; la home è pronta in ~0,7 s (2,8 s a CPU 4× più lenta), il blocco
più lungo è 0,23 s (0,9 s a 4×). I giochi si aprono in un tempo pari alla home
(il codice è già nel file). Fra le immagini, il sotterraneo tiene 30 MB e la
tela più grande delle lingue 53–56 MB.

## La direzione

Spacchettare il file per il sito installato (file separati con hash, elenco nel
service worker, scarico guidato dalla pagina con un overlay) è la strada scelta
ma non fatta: prima si guarda con questo strumento cosa cambierebbe.
