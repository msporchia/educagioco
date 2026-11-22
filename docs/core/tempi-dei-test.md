# I tempi dei test

Quanto costano le prove, misurato e non stimato, e le regole che ne
vengono. Come si lanciano sta in [test.md](test.md).

## I numeri

Misurati il 21/11/2026 su un i5-13600KF (20 thread, 30 GB, una RTX 5060),
con un altro giro di test acceso sulla stessa macchina: 304 unità, 8
misure, 142 file nel browser.

| | orologio | CPU spesa |
|---|---|---|
| `npm run test:svelto` (299 file) | 58 s | 7 min |
| `npm test` (304 unità) | 1 min 54 s | 12 min |
| `npm run test:browser` (142 file) | 11 min 19 s | 49 min |
| `npm run test:misure` | 25 min | ~1 h 40 (quattro processi) |

- **Un test 3D in software teneva otto processori.** Chrome senza schermo
  disegna WebGL col processore: `integrazione/sotterraneo-luce`, da solo,
  durava 40 s e ne spendeva 317 di CPU. Otto alla volta ne chiedevano
  sessantaquattro su venti: il carico saliva a 45–50, le attese dei test
  scadevano e il giro tornava rosso. Con la scheda video (`--enable-gpu`,
  di serie in `aiuto/browser.mjs`) lo stesso file fa 22 s e 23 di CPU; i
  quattro più lunghi provati nei due modi passano da 106–191 s a 27–47.
  Prima il browser in fila valeva fra 2 ore e mezza e 4 (la somma dei
  tempi ricordati: 8.800–15.100 s).
- **Il pavimento di `npm test` sono due file**: `unita/sotterraneo-roba`
  (114 s) e `unita/sotterraneo` (85 s) giocano un centinaio di partite
  finte, cioè misurano l'equilibrio dentro le unità. Poi
  `passo-passo-sentiero` (38 s, 288 mappe generate e risolte). I 255 file
  sotto il secondo fanno 48 s in tutto.
- **`misure/sotterraneo` gioca ~12.500 discese** e sta a ridosso del suo
  tetto di 1500 s (a macchina carica lo supera e viene fermato): è la
  taratura (`npm run taratura`, `npm run sotterraneo`) rifatta come test.
- **Il costo fisso di Node è 14 ms**; aprire Chrome e la pagina (36 MB)
  costa 5 s: il file di integrazione più svelto non scende sotto.

## Le regole che ne vengono

- **Otto alla volta, se la macchina regge**: le corsie sono al più otto
  (la metà dei processori sotto i sedici), ma un test parte solo se c'è
  un posto fra quelli della macchina (la metà dei processori, divisi fra
  tutti i lanciatori accesi: `/tmp/educagioco-posti/`) e se i processori
  occupati nell'ultimo secondo sono meno di tre quarti. Due sessioni che
  chiudono insieme non fanno più sedici test alla volta, e una build o
  un giro vecchio in un altro worktree rallentano la partenza invece di
  far scadere le attese. Il primo test di un giro parte comunque.
- **Un rosso da carico non è un rosso**: dei dieci rossi del primo giro
  3D, sei rilanciati a macchina meno piena erano verdi. Prima di cercare
  un guasto si rilancia il file da solo.
- **Un test tarato su Chrome lento nasconde una gara.** Con la scheda
  video sono cadute sei prove che in software passavano, e tutte per lo
  stesso motivo: guardavano una cosa nell'istante in cui il gioco la
  stava ancora facendo (il profilo riletto prima dei 350 ms
  dell'archivio, la risposta toccata nei 320 ms ciechi della domanda, il
  foglio contato mentre si chiudeva). Si aspetta la condizione, non si
  guarda subito. `SENZA_SCHEDA=1` rimette il disegno in software, per
  sapere se un rosso dipende da lei.
- **Allo scadere del tempo muore il gruppo, non il test**: il lanciatore
  fa di ogni test il capo di un gruppo di processi. Fermando solo lui i
  quattro processi di una misura finivano il compito da orfani.
- **In parallelo il totale è il più grande fra il test più lungo e la
  somma divisa per le corsie.** Un test che si allunga si sente subito:
  è il primo posto dove guardare. Due casi da non rifare:
  - cercare una cosa sulla tela partendo dall'angolo quando la telecamera
    si apre al centro (la prova della fattoria 2D trovava la bancarella al
    166° tocco; percorsa dal centro in fuori, al primo);
  - un ciclo che aspetta uno stato che non arriverà più
    (`integrazione/survivors` girava a vuoto a eroe morto, e passava lo
    stesso): chi aspetta lo stato di una partita guarda anche se la
    partita c'è ancora.
- **Un test non deve dormire fino al tetto se può sondare**: si aspetta la
  condizione con un limite (`finche(…, 9000)`), non un'attesa fissa.
- **`tempo:` si dichiara solo quando il costo è un fatto.** Il numero fa
  due mestieri — tetto per il test appeso e segnale per `--svelti` — e
  dichiararlo largo per prudenza butta fuori dal giro svelto test che
  durano mezzo secondo. La riga dev'essere solo `tempo:` (a parte gli
  spazi davanti): la regex leggeva anche la prosa dei commenti.
- **Un nome prende unità e browser, non le misure**: `node test/esegui.mjs
  pozioni` gira i file omonimi delle due cartelle, e apre Chrome;
  `sotterraneo` sono 128 file. `integrazione/pozioni` o `unita/pozioni`
  ne prendono una sola; le misure si chiedono col nome del gruppo
  (`misure`, `misure/survivors`).
- **Una tavola da guardare non è un test.** Un foglio che disegna i
  pittori in tutti gli stati è uno strumento in `strumenti/` con un suo
  `npm run` (come i banchi, o `strumenti/scatti.mjs`), fuori da
  `test/esegui.mjs`: un file senza niente da verificare con un codice
  d'uscita non è un test.

## Un rosso che non dipende dal carico

- `integrazione/sotterraneo` cade circa una volta su cinquanta su «dopo un
  tocco l'eroe si è mosso»: tocca a 70 px dall'eroe nei quattro versi, e
  la mappa a caso può chiuderne tre su quattro. Non è il carico: un tocco
  buono sposta la scena in 200 ms anche con otto test insieme, contro gli
  800 concessi.

Quello che resta da fare sui test (le misure dentro le unità, i file del
browser da fondere o da portare fra le unità, i controlli che non possono
fallire) sta in [da-fare.md](da-fare.md), «Le prove».
