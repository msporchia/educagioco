# I tempi dei test

Quanto costano le prove, misurato e non stimato, e le regole che ne
vengono. Come si lanciano sta in [test.md](test.md).

## I numeri

La suite in fila, 142 file: **751 s** (46 s le 110 unità, 704 s i 32 di
integrazione). Oggi i file sono 166 (125 unità, 41 integrazione).

| | in fila | 4 alla volta | 8 alla volta | 12 alla volta |
|---|---|---|---|---|
| `npm run test:tutto` | 682 s | 178 s | **89–91 s** | 66 s |
| `npm run test:browser` | 635 s | | 85 s | |
| `npm test` | 48 s | 24 s | 25 s | 24 s |
| `npm run test:svelto` | 15 s | | 4 s | |
| memoria al massimo (PSS) | | 2,1 GB | 3,9–4,3 GB | 5,2 GB |
| CPU, media · picco | | 22% · 58% | 34–38% · 75–80% | 71% · 93% |

Misurati su un i5-13600KF (20 thread, 30 GB); la memoria è quella di tutto
l'albero dei processi, Chrome compresi.

- **Il costo fisso di Node è 14 ms** (`node -e ""`). I test più svelti di
  `unita/` stanno fra 17 e 30 ms: il costo proprio è rumore, e non c'è
  niente da stringere. Lanciarne tanti nello stesso processo non vale la
  candela.
- **Aprire Chrome costa più di qualunque unità**: il file di integrazione
  più svelto sta sopra il secondo e mezzo. Per questo l'integrazione non
  entra mai in `--svelti`, dichiari quel che vuole.
- **I più lunghi**, dall'ultimo giro ricordato dal lanciatore
  (`node_modules/.cache/educagioco/tempi-dei-test.json`, misurati otto alla
  volta, quindi un po' gonfiati dal carico): `integrazione/costruttore`
  ~139 s e `integrazione/passo-passo` ~129 s, poi `torri`, `genitori`,
  `fattoria` attorno al minuto. Fra le misure `misure/survivors`, 22–25 s,
  e 13 di quei secondi sono la sezione che gioca le nove tappe. Da quando
  le misure stanno in `test/misure/`, `npm test` fa 6 s (prima un paio di
  minuti, col pavimento di survivors e della mappa delle isole).

## Le regole che ne vengono

- **Otto alla volta è il punto giusto**: il giro è già sette volte e mezzo
  più corto e la macchina resta usabile (l'editor, un altro worktree, un
  altro giro). A dodici si guadagnano venti secondi con la CPU al 93%: si
  chiede a mano quando non si fa altro. Sotto i sedici processori le
  corsie sono la metà (la CI, con quattro, ne usa due).
- **In parallelo il totale è il più grande fra il test più lungo e la
  somma divisa per le corsie.** Un test che si allunga si sente subito:
  è il primo posto dove guardare. Due casi da non rifare:
  - cercare una cosa sulla tela partendo dall'angolo quando la telecamera
    si apre al centro (`integrazione/fattoria` trovava la bancarella al
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
- **Il lanciatore non incrocia gruppo e nome**: `node test/esegui.mjs
  pozioni` gira i file omonimi delle due cartelle, e apre Chrome.
- **Una tavola da guardare non è un test.** Un foglio che disegna i
  pittori in tutti gli stati è uno strumento in `strumenti/` con un suo
  `npm run` (come i banchi, o `strumenti/scatti.mjs`), fuori da
  `test/esegui.mjs`: un file senza niente da verificare con un codice
  d'uscita non è un test.

## Due rossi che non dipendono dal carico

- `integrazione/bancarella` può cadere su «in fondo alla campagna qualcuno
  vuole due o tre cose uguali»: i clienti si pescano a caso, e può capitare
  che nessuno dei dieci ne voglia più di una.
- `integrazione/sotterraneo` cade circa una volta su cinquanta su «dopo un
  tocco l'eroe si è mosso»: tocca a 70 px dall'eroe nei quattro versi, e
  la mappa a caso può chiuderne tre su quattro. Non è il carico: un tocco
  buono sposta la scena in 200 ms anche con otto test insieme, contro gli
  800 concessi.

Le proposte ancora aperte (le unità di survivors in due file, un `--svelti`
anche per l'integrazione) stanno in [da-fare.md](da-fare.md).
