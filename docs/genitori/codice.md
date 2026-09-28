# Il codice dei genitori

Le quattro cifre davanti alla schermata dei grandi: dove stanno, come si
entra, come si recuperano, e perché non sono sicurezza.

## Dove sta

`src/store/pin.js`: quattro cifre, di partenza `0000` (`PIN_INIZIALE`). Sta
nell'archivio accanto a `ultimo-giocatore`, **non dentro i profili**: è di
casa, non di un bambino, e cancellare i progressi di un giocatore non deve
riportarlo a `0000`. Si rimette dall'indirizzo con `#pin=1234` — che però
vuole la barra dell'indirizzo, e dall'app installata non c'è.

Gli altri cheat dell'indirizzo e la pagina `#admin` stanno in
[../core/comandi.md](../core/comandi.md).

## La porta è noiosa, non nascosta

- **In home è un tasto piatto nel piede** — «⚙︎ Impostazioni · giochi
  visibili, …» — non una carta col lucchetto fra i giochi: un lucchetto fra
  undici giochi dice «qui c'è un tesoro», e «per i grandi» è una
  proibizione, cioè pubblicità. Nasconderla del tutto è stato provato: chi
  non sa che c'è non la trova.
- **Sbagliare costa un'attesa**: 3 s, poi 10, poi 30, col tastierino spento
  e una barretta che si riempie (`segnaSbaglio`/`attesa`, `ATTESE`). Il
  conto sta nel modulo, non in un `ref` della schermata, se no uscire e
  rientrare lo azzererebbe; si azzera solo entrando (`azzeraSbagli`).
  Provarci gratis, con una reazione a ogni tiro, era un minigioco «indovina
  il codice».
- **Il tastierino dice di chi è la schermata e dove si torna**: «le cambia
  un grande, col codice di casa» sotto il titolo — detto a chi ha girato la
  maniglia sbagliata, non come divieto — e sotto i tasti un «← Torna ai
  giochi» largo quanto il tastierino. Se l'unica uscita è una freccia in
  cima, provare i numeri resta il gioco più vicino.

## Scegliere il codice, e dimenticarlo

Due aggiunte che stanno in piedi solo insieme:

- **Al primo ingresso, se il codice è ancora `0000`**, un riquadro in cima
  invita a sceglierne uno: rimandabile, ricompare la volta dopo. `0000` è
  come non avere codice.
- **«Non ricordi il codice?»** sul tastierino: una domanda di cultura
  generale con risposta di quattro cifre (`DOMANDA`, `rispostaGiusta`) —
  stesso tastierino, stessa attesa agli sbagli — rimette `0000`
  (`azzeraPin`) e fa scegliere subito quello nuovo.

## Non è sicurezza, e va bene così

La risposta sta su internet e un bambino che ci arriva la trova. Le
alternative sono peggio: `#pin=` vuole una barra che nell'app non c'è; un
codice lungo scritto altrove è il codice vero scritto più in grande; un
canale umano vuole qualcuno nel giro, e il gioco arriva a famiglie che non
conosce nessuno; un'attesa di ventiquattro ore non ferma chi ci tiene.

**Quello che regge il colpo è il cestino** ([cestino-e-posta.md](cestino-e-posta.md)):
se entrare non distrugge più niente, il recupero può essere facile. E chi
entra senza titolo lascia una traccia: il codice rimesso a `0000` diventa un
avviso nella posta dei grandi.

Il codice di casa, l'invito a cambiarlo e il recupero sono scritti anche
nelle guide ([guide.md](guide.md)).

Nei test: `[data-azione="grandi"]` in home, `[data-azione="torna-ai-giochi"]`,
`[data-azione="codice-dimenticato"]`, `[data-azione="lascia-recupero"]`,
`[data-azione="cambia-codice"]`; `test/unita/pin`.
