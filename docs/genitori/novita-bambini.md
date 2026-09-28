# Le novità per i bambini

Il changelog vero, scritto per i bambini — il contrario della posta dei
grandi ([cestino-e-posta.md](cestino-e-posta.md)) — e **la regola per chi
lavora al codice** su quando proporre una riga.

## Com'è fatto

`src/guide/novita-bambini.js` (dato), `src/guide/Novita.vue` (la pagina).
Le cose fatte bene — il laboratorio rifatto, dieci mostri nuovi — non
arrivavano a nessuno: si entra nel gioco che si conosce, e gli altri non si
riaprono per vedere se sono cambiati.

- **Si scrive se un bambino che ci va apposta se ne accorge**, in una riga,
  dicendo cosa c'è adesso e non cosa si è cambiato: «🧪 Il laboratorio delle
  pozioni è tutto nuovo», non «Rifatta la grafica». Niente parole da
  officina.
- **L'elenco cresce e non si pota**: il tetto lo mette la pagina, che di
  ogni gioco mostra le ultime quattro (`PER_GIOCO`).
- **Il segno è uno per bambino** (`settings.novitaLette`, l'id più alto al
  momento di «Letto»). Un bambino nuovo nasce all'ultima — «è tutto nuovo»,
  detto a chi il prima non l'ha visto, è falso — e il segno si scrive in
  `creaGiocatore`, **non in `blank()`**: `selectPlayer` usa `blank()` per
  riempire i buchi, e un bambino di ieri nascerebbe già in fondo.
- **Una riga su un gioco che non ha in home non gli arriva**: la domanda è
  `inCasa` di `src/data/portata-giochi.js`, la stessa delle carte. Senza
  `gioco` la riga è di tutti.
- Ci si arriva da un nastro in home che dice già la più fresca, **senza ✕**:
  si spegne con «Letto», dentro.

## Il formato

`{ id, quando, gioco?, testo }`: `id` è quello dopo il più alto e non si
riusa mai; `quando` è il giorno in cui esce (`AAAA-MM-GG`); `gioco` è la
chiave di `src/data/giochi.js`; `testo` sta **sotto i 70 caratteri**, con
l'emoji della cosa in testa, senza HTML né `**`. Lo controlla
`test/unita/novita-bambini` (lunghezza, gioco, niente HTML).

## Per chi lavora al codice: si propone, non si scrive

Le righe le decide il proprietario; chi lavora al codice **le propone**.

- **Alla fine di ogni lavoro che un bambino vedrebbe** — un gioco, un
  livello o una modalità nuovi, un posto ridisegnato, una bestia, una cosa
  nuova da comprare, una festa — nel resoconto va la riga già scritta: «per
  i bambini: «🐰 Alla fattoria è arrivato il coniglio» — la metto?». Si
  aggiunge **solo dopo il sì**, e la domanda si fa prima del push.
- **Non si propone** per un guasto riparato, una taratura, un prezzo, le
  schermate dei grandi o i documenti.
- **La riga va col lavoro che racconta, mai prima**: nello stesso commit o
  in uno dopo. Pubblicata prima manda un bambino a cercare una cosa che sul
  telefono non c'è ancora.
- **Un gioco in prova si annuncia il giorno che esce dal cancello**: prima
  `inCasa` la scarta, e chi preme «Letto» nel frattempo la salta per
  sempre, perché il segno è uno solo.

Nei test: `[data-nastro="novita"]` con `[data-azione="nastro-novita"]`,
`[data-novita-pagina]`, `[data-novita-gioco]`, `[data-novita]`,
`[data-azione="novita-letto"]`.
