# La domanda a schermo

Cosa succede dopo una risposta: il tempo per leggere, la fretta, la
spiegazione, e quando si avvisa un grande. Le regole pure stanno in
`src/quiz/nucleo/domanda.js`, la messa in scena in `src/quiz/Domanda.vue`
(una sola per Survivors, Dungeon, sotterraneo e corsa).

## Dopo uno sbaglio: il perché E come si fa

- **Due mestieri, due righe.** Il `perche` della risposta scelta diagnostica
  *quella* scelta («hai guardato solo l'ultima cifra»); l'`aiuto` della
  domanda insegna *il metodo* («47 sta fra 40 e 50: l'ultima cifra è 7,
  quindi si va su»), ed è l'unico che serve anche la volta dopo. Si mostrano
  **tutti e due**, su due righe distinte a occhio: «Si fa così» sta in un
  riquadro suo, perché in un paragrafo unico il metodo finisce in coda.
- **Chi decide è `spiegazioneDi`**, pura. Provato: un `||` fra i due. Non
  funziona: i moduli scritti bene hanno sempre un `perche`, e il metodo non
  arrivava mai, senza nessun errore da nessuna parte.
- A risposta giusta non si spiega niente.
- **È il motivo per cui una domanda su un concetto nuovo non si toglie**:
  se si spiega in una riga, sbagliarla è il momento in cui si impara. Quelle
  che in una riga non si spiegano si spengono (vedi [saperi.md](saperi.md)).
- **La dritta** (`dritta`, `serveLaDritta`) è la strada corta: si mostra a
  chi sbaglia e a chi indovina in più di `LENTO` (12 s, il tempo di contare
  a dito i quadretti di un 6×7). Nei test: `unita/griglia-misure`.

## Quanto si sta fermi

- **`PONDERA` = 4 s**: dopo ogni sbaglio, fretta o no, è il pavimento.
  Il `respiro` che i giochi passano è tarato sul ritmo della partita (900 ms
  nel sotterraneo), cioè la spiegazione sparirebbe prima di leggerla. È un
  pavimento, non un'aggiunta.
- **Il pavimento cresce con le parole** (`attesaDellEsito`, `tempoDiCapire`):
  `A_CAPIRE` = 0,25 s a parola, lo stesso numero detto due volte (4 s ÷ 0,25
  = 16 parole, la riga su cui `PONDERA` era tarato).
- **`LEGGERE_MAX` = 7 s**: più di così una schermata ferma non si guarda.
- **`TETTO` = 10 s** è il totale con la fretta: oltre, una pausa sembra un
  gioco rotto. A spiegazione lunga si accorcia la penalità, mai il tempo per
  leggere.
- **L'attesa si vede**: una barra si riempie per tutto il tempo, se no
  quattro secondi muti sembrano un tasto rotto.
- **`saltabile` (solo `Prova.vue`, la palestra dei grandi)**: si tocca la
  barra per abbreviare l'attesa invece di aspettarla — utile a chi guarda
  venti domande di fila. Nei giochi non c'è: il tocco che arriva subito
  dopo una risposta è quasi sempre il fantasma di quello appena dato, e
  salterebbe l'esito da solo.

## Troppo di fretta: il tempo, non la roba

- **Non si sa se un bambino tira a caso, si sa se non ha avuto il tempo di
  leggere.** `tempoDiLettura` conta le parole di consegna, soggetto scritto e
  risposte: `FRETTA` 1,1 s + `A_PAROLA` 0,09 s a parola, tetto `FRETTA_MAX`
  4 s. Circa 1,7 s per una tabellina, 3,8 s per un problema. Una soglia fissa
  direbbe «hai tirato a caso» a chi le tabelline le sa.
- **`troppoDiFretta`**: sbagliata *e* più veloce del tempo di lettura. Una
  giusta non è mai fretta.
- **La penalità è tempo**, con una riga sola a schermo («🐢 Troppo di
  fretta: leggi bene la domanda»). Vita o monete punirebbero anche chi è
  svelto e sa, e insegnerebbero che rispondere è pericoloso.
- **Cresce con l'insistenza** (`quiz/fretta.js`, `SCALA` = +1,5 · 3 · 5 ·
  6 s sopra `PONDERA`): si sta fermi 5,5 · 7 · 9 · 10 s e poi 10 fisso.
  Provato: una penalità fissa. Non funziona: 4,0 contro 5,5 non si distingue.
- **Per uscirne servono quattro giuste** (`PER_USCIRNE`): è l'uscita da una
  penalità, non una misura sul sapere, e tirando a caso capita una volta su
  duecentocinquanta. Una sbagliata ma letta non risale e non azzera.
- **Il contatore vive nel modulo** (`pesoDellaFretta`, `azzeraLaFretta` al
  cambio di bambino), non nel componente, che si rimonta a ogni domanda.
  Nei test: `unita/tiro-a-caso`.
- Vale per i giochi di `Domanda.vue`; nei vecchi (`src/views/`) il tiro a
  caso costa altro: una vita negli asteroidi, un'attesa e la serie azzerata
  nelle lingue.

## Il tempo che si annota

Si conta solo il tempo in cui la domanda era **davanti agli occhi**:
`Domanda.vue` ferma l'orologio a pagina nascosta, e l'attesa dell'esito si
congela e riparte da quello che restava. Sotto, `TEMPO_MAX` (2 min) taglia
il telefono acceso posato sul tavolo (`tempoDaAnnotare`). Il motivo: `it.t`
di `srs.js` è una media al 45%, e un campione di quaranta minuti bastava a
far risultare «ci mette venti minuti» per sempre.

## Il muro si dice a un grande

- `quiz/consiglio.js` legge `store/srs.js`: con almeno `MINIME` (8) risposte,
  **meno di metà giuste** (`MURO`) è un muro, **più di nove su dieci**
  (`PEDAGGIO`) un pedaggio; in mezzo non si dice niente.
- `quiz/allarme.js` è **il momento in cui si dice**: `Domanda.vue` chiama
  `guardaComeVa` a ogni risposta annotata, e al muro scrive un avviso nella
  posta dei grandi (`frasePerIlGrande`: «Le doppie — ne ha sbagliate 7 su
  10», col nome del tipo da `nomeDelTipo`; senza nome non si avvisa).
- **Una volta sola** per bambino e per chiave (`avvisaUnaVolta` in
  `store/posta.js`): la memoria sopravvive al «Ho letto», se no la stessa
  riga tornerebbe domani.
- **Solo il muro, mai il pedaggio**: «le indovina quasi tutte» non è un
  problema, e nella stessa posta insegnerebbe a scorrere gli avvisi.
- **Non ritocca da sé**: un pomeriggio storto o un fratello al telefono gli
  insegnerebbero la cosa sbagliata senza che nessuno lo veda. Il tasto è la
  ✎ di sempre.

Nei test: `unita/consiglio`. Dove porta l'avviso — la schermata «Come va» e
il rosso nel quadro — sta in [../genitori/come-va.md](../genitori/come-va.md).

## Il layout delle risposte

Le risposte di `Domanda.vue` vanno a capo da sole invece di stare su una
griglia a colonne fisse: chi resta solo sull'ultima riga prende tutta la
larghezza, invece di restare un mezzo tasto spaiato. Provata e scartata una
soglia a caratteri («oltre 13, una colonna sola»): era cieca sul tasto (tre
colonne strette non bastano comunque) e sul verso (una griglia `1fr` non
scende sotto il min-content di un tasto, cioè la parola più lunga che non si
spezza — la griglia si allargava e i tasti uscivano dalla carta). Adesso la
fila dichiara quanto largo *deve poter essere* un tasto (`--qz-min`, in `ch`:
la parola più lunga, o metà della risposta più lunga se più grande) e un
tetto di colonne (`--qz-colonne`), e va a capo da sé; `min-width: 0` +
`overflow-wrap: anywhere` sul tasto garantiscono che non sfondi comunque.
