# I tempi dei test

Quanto costano le prove, misurato e non stimato, e le regole che ne
vengono. Come si lanciano sta in [test.md](test.md).

## I numeri

Misurati il 22/11/2026 su un i5-13600KF (20 thread, 30 GB, una RTX 5060):
311 unità e 76 file nel browser nel giro; 14 misure e 9 verifiche a
richiesta.

| | orologio | CPU spesa | il 21/11, prima |
|---|---|---|---|
| `npm test` (311 unità) | ~30 s | ~4 min | 1 min 54 s, 12 min |
| `npm run test:browser` (76 file) | ~3 min e mezzo | ~27 min | 142 file: 2 ore e mezza–4 in fila |
| `npm run test:tutto`, build comprese | 4 min 06 s | 31 min e mezzo | circa un'ora a macchina piena |

I secondi sommati dei file nel browser: 5.165 col primo giro a scheda
video e 142 file, 3.170 dopo le fusioni per preparazione, 2.002 dopo aver
tolto le partite giocate e le attese a orologio vero; i controlli da
4.450 a 4.233. Con la memoria occupata le corsie calano (una per giga
libero) e i tempi salgono.

- **Un test 3D in software teneva otto processori.** Chrome senza schermo
  disegna WebGL col processore: un file della discesa del sotterraneo, da
  solo, durava 40 s e ne spendeva 317 di CPU. Otto alla volta ne chiedevano
  sessantaquattro su venti: il carico saliva a 45–50, le attese dei test
  scadevano e il giro tornava rosso. Con la scheda video (`--enable-gpu`,
  di serie in `aiuto/browser.mjs`) lo stesso file fa 22 s e 23 di CPU.
- **I più lunghi del giro** stanno fra 50 e 70 secondi
  (`sotterraneo-bottega`, `passo-passo`, `passo-passo-mappa`, `fattoria3d`,
  i mondi di sopra del sotterraneo, `amici-mappe`, `pozioni`): nessuno
  fa più da pavimento, e il giro costa la somma divisa per le corsie.
- **Le partite finte stanno nelle misure**: `unita/sotterraneo` e
  `unita/sotterraneo-roba` ne giocavano un centinaio a ogni commit (66 e
  81 s, ora 4 e 10–15). `misure/sotterraneo` ne gioca ~12.500 e sta a
  ridosso del suo tetto di 1500 s: è una taratura, e si lancia solo dopo
  un cambio significativo del bilanciamento.
- **Il costo fisso di Node è 14 ms**; aprire Chrome e la pagina (36 MB)
  costa un secondo, ricaricarla (`azzera`, `semina`) quattro decimi. I
  secondi di un file nel browser non stanno lì: stanno nel gioco che gira
  in tempo reale (camminare, aspettare un cliente, un racconto di turno),
  cioè in quanta partita si gioca per arrivare al punto.

## Le regole che ne vengono

- **La metà dei processori, se la macchina regge**: le corsie sono la
  metà dei processori (dieci qui; a otto il browser faceva 6 min 50, a
  dieci 5 min 36), una per giga libero, e un test parte solo se c'è
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
- **Il tempo del gioco non si aspetta a orologio vero.** Un esito che
  resta sette secondi, il silenzio di venti prima di riprovare uno
  scarico, i cinque di una pausa: la pagina ha un orologio finto
  (`page.clock`) e il test lo porta avanti di quanto il gioco dice.
  `scarico` è sceso così da 175 s a 33, le lingue da 281 a 74. Dove il
  tempo è una partita (una ricetta, un livello, una tappa) non si gioca
  tutta: ogni gesto col dito una volta, il resto coi ganci delle prove o
  seminando lo stato già arrivato.
- **I cartelli dei traguardi coprono la home 3,2 s l'uno**, in fila, e un
  profilo seminato già avanti ne fa scattare due o tre: un clic lì sotto
  aspettava che finissero da soli, da 4 a 16 secondi per file. `scegli`
  li chiude toccandoli (`viaITraguardi`), come fa un bambino.
- **Un attributo chiesto a una cosa che non c'è aspetta trenta secondi**
  (`getAttribute`, `innerText`, `click` di playwright su un selettore
  vuoto): prima si guarda che ci sia, o si dà un tetto corto.
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
  `sotterraneo` sono 93 file. `integrazione/pozioni` o `unita/pozioni`
  ne prendono una sola; le misure si chiedono col nome del gruppo
  (`misure`, `misure/survivors`).
- **Una tavola da guardare non è un test.** Un foglio che disegna i
  pittori in tutti gli stati è uno strumento in `strumenti/` con un suo
  `npm run` (come i banchi, o `strumenti/scatti.mjs`), fuori da
  `test/esegui.mjs`: un file senza niente da verificare con un codice
  d'uscita non è un test.

## Un rosso che non dipende dal carico

- **La sorte dentro un test**: tre rossi «ballerini» del riassetto non
  erano né carico né gare. Una riga posata «a caso» ogni tanto indovinava
  il codice segreto; il leggendario raccolto a sorte ogni tanto era lo
  stesso già in tasca; la domanda uscita a sorte ogni tanto veniva da un
  modulo che la lista a mano del test non conosceva. Dove il gioco tira
  un dado, il test o lo ferma (un seme, un valore letto dallo stato) o
  controlla una cosa vera per ogni faccia.

Quello che resta da fare sui test (le misure dentro le unità, i file del
browser da fondere o da portare fra le unità, i controlli che non possono
fallire) sta in [da-fare.md](da-fare.md), «Le prove».
