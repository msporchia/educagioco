# Passo passo — il mondo dello zaino

La seconda valle della mappa ([mappa.md](mappa.md)): ripeti, fino a, se e
tutto il mondo, solo del coniglio (il cane fa tutta la sua strada nella
valle). Il fondale è `isole_2.png` (com'è uscito:
`strumenti/sprite/sorgenti/passo-passo/PROMPT-mappa.md`), il foglietto
`zaino.json`, il modulo generato `dati/zaino-mappa.js`.

Stesso strumento, stessa vista (`Valle.vue`, `mondo="zaino"`), stesse
caselle e stesso segnalino della valle dei piccoli: cambiano i dati.

- **Il passaggio fra le due valli**: la galleria «I prossimi livelli» in cima
  al pascolo porta lì (il segnalino ci va, entra, e sbuca dalla tana
  d'arrivo); sulla riva in basso a sinistra la tana «I primi livelli» lo
  riporta indietro. Chiusa (nessuna tappa di là aperta) la prima ha il masso,
  e il suo fumetto dice cosa manca alla prima tappa di là; quella della riva
  è sempre aperta. Tutte e due hanno l'insegna blu coi numeri di là, che
  ondeggia se c'è qualcosa da fare
  ([caselle-e-stendardi.md](caselle-e-stendardi.md#linsegna-delle-tane)). Il
  segnalino ricorda in che valle era (`ultimo` in `Mappa.vue`).
- **Le isole**: la riva con la tana d'arrivo, e il ponte che va al **ripeti**
  (in basso a sinistra, la più grande, 8 tappe); da lì un ponte in alto al
  **fino a** (rocce, neve, cascata: 4 tappe), un passaggio con una stalla
  (un'isoletta dove si cammina e basta), poi il **se** (siepi, cartelli,
  lastre: 2 tappe). A destra del ripeti, un ponte porta a **tutto il mondo**
  (ghiaccio, massi, ruscello e una spirale attorno a un monte di cristallo:
  4 tappe).
- **Dal se a tutto il mondo si va avanti, non indietro**: un ponte porta
  all'isoletta della casetta (`casetta`, sempre aperta come la riva), la sua
  tana dipinta scende sotto terra e il coniglio sbuca in una nuvoletta
  all'ingresso di tutto il mondo, dove arriva anche il ponte del ripeti.
  Provato senza: dopo l'ultimo «se» il coniglio ripassava da tutto il fino a
  e dal ripeti. Chiusa (tutto il mondo ancora chiuso) la bocca ha il masso.
- **Le altre isolette sono decoro**: le stalle a sinistra, il fienile in
  basso, il lago gelato e quella di sotto a destra, coi loro ponti dipinti
  che non si camminano.
- **Il sentiero senza fine del coniglio sta in fondo alla spirale di «Tutto
  il mondo»**: la fine della sua strada.
- **Da dove si parte**: dalla tappa di adesso, se è nello zaino; la vista
  segue il protagonista nei due versi come nella valle.
- **Le caselle sono da 48**, non da 52 come nella valle (`lato` nel
  foglietto): la riga delle stelline (quattro da 12) ci sta ancora.

Nei test: `unita/passo-passo-valle` (la sezione dello zaino: i quattro
scalini, nessuna tappa del cane, la riva libera e la tana per la valle, i
ponti con la sbarra; e per tutti e due i mondi, da una tappa alla dopo non
si ripassa da una casella già fatta), `integrazione/passo-passo-mappa`
(sezione 6, col dito: anche dal se a tutto il mondo per la tana della
casetta). Bersagli in fondo a [mappa.md](mappa.md).
