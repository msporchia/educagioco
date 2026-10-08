# Passo passo — il mondo dello zaino

La seconda valle della mappa ([mappa.md](mappa.md)): ripeti, fino a, se e
tutto il mondo, e a ognuno la sua isoletta del cane. Il fondale è `isole_2.png`
(com'è uscito: `strumenti/sprite/sorgenti/passo-passo/PROMPT-mappa.md`), il
foglietto `zaino.json`, il modulo generato `dati/zaino-mappa.js`.

Stesso strumento, stessa vista (`Valle.vue`, `mondo="zaino"`), stesse
caselle e stesso segnalino della valle dei piccoli: cambiano i dati.

- **Il passaggio fra le due valli**: la tana «I prossimi livelli» in cima alle buche
  porta lì (il segnalino ci va, entra, e sbuca dalla tana d'arrivo); sulla
  riva in basso a sinistra la tana «I primi livelli» lo riporta indietro. Ci
  passano tutti e due i protagonisti, ognuno per le sue tappe. Chiusa
  (nessuna sua tappa di là aperta) la prima ha il masso, e il suo fumetto dice
  cosa manca alla sua prima tappa di là; quella
  della riva è sempre aperta. Tutte e due hanno l'insegna blu coi numeri di
  là, che ondeggia se c'è qualcosa da fare
  ([caselle-e-stendardi.md](caselle-e-stendardi.md#linsegna-delle-tane)). Il
  segnalino ricorda in che valle era (`ultimo` in `Mappa.vue`).
- **Le isole**: la riva con la tana d'arrivo, e il ponte che va al **ripeti**
  (in basso a sinistra, la più grande, 8 tappe); da lì un ponte in alto al
  **fino a** (rocce, neve, cascata: 4 tappe), un passaggio con una stalla
  (un'isoletta dove si cammina e basta, del «fino a»: ha la sua tana, ma è
  del fondale), poi il **se** (siepi, cartelli, lastre: 2 tappe). A destra del
  ripeti, un ponte porta a **tutto il mondo** (ghiaccio, massi, ruscello e una
  spirale attorno a un monte di cristallo: 4 tappe). Il giro è una catena,
  non un cerchio: da tutto il mondo ai massi si torna dal ripeti, e i ponti
  verso il fino a e verso tutto il mondo hanno la sbarra finché le due isole
  sono chiuse.
- **Le isolette del cane**: ogni scalino ha la sua, con tre tappe e il suo
  stemma (uno scudo, la carta dello scalino, viola), perché il nome intero non
  ci sta. Il ripeti ha quella a sinistra (le stalle in fila), il fino a quella
  in basso in mezzo (col fienile: è la più vicina che non è già di un altro,
  il fino a non ne ha una accanto), il se quella a destra in alto, tutto il
  mondo quella col lago gelato. Ne resta una (a destra in basso, di sotto a
  tutto il mondo): decoro, senza caselle. Col coniglio le isolette sono tutte
  paesaggio ([mappa.md](mappa.md#due-protagonisti)).
- **Il sentiero senza fine sta in fondo alla spirale di «Tutto il mondo»**:
  la fine di tutte e due le strade, ed è di chi gioca.
- **Si entra dalla bocca dipinta dell'isoletta** (`tana:<isoletta>:a`): il
  cane attraversa l'isola del coniglio accanto, entra in una tana (`:da`) e
  sbuca di là. Da dove entra: il buco dipinto del fondale se c'è (il fino a: la
  tana dell'isolotto di passaggio; il se: quella in cima all'isola), se no
  `nuvola`, un punto del sentiero dove l'animale sparisce in una nuvoletta (il
  ripeti, al capo del ponte verso l'isoletta; tutto il mondo, sul lato dello
  spirale più vicino). Un ponte dipinto verso un'isoletta è solo disegno:
  non si cammina.
- **Le tre caselle di un'isoletta stanno a zigzag** sull'erba, dove ci stanno
  (le isolette sono larghe 180 px, tre caselle da 48 con otto di spazio
  vogliono 120): la più vicina alla bocca è la prima tappa, e nessuna copre la
  bocca (un test lo dice). Lo stemma sta dove non copre né caselle né animale
  seduto.
- **Da dove si parte**: dalla tappa di adesso, se è nello zaino; la vista
  segue il protagonista nei due versi come nella valle.
- **Provato** caselle da 52 come nella valle: sulle isolette (larghe 180 px)
  tre non ci stanno e si toccano; con 48 sì, e la riga delle stelline (quattro
  da 12) ci sta ancora.

Nei test: `unita/passo-passo-valle` (la sezione dello zaino: i quattro scalini
con la loro isoletta, la riva libera e la tana per la valle, la bocca
dipinta di ogni isoletta, il cane che ci entra dalla tana o dalla
nuvoletta, i ponti con la sbarra a ogni punto della campagna),
`integrazione/passo-passo-mappa` (sezione 6, col dito). Bersagli in fondo a
[mappa.md](mappa.md).
