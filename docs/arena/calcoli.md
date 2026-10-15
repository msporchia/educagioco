# I calcoli

Come una scelta (costruire, potenziare, riparare…) diventa una domanda.

**Qui si allena il calcolo a mente, svelto**: il gioco sta fra gli asteroidi (le
tabelline) e il castello (le operazioni in colonna). Il nemico non aspetta, quindi
un po' d'ansia è voluta: il conto si deve fare in pochi secondi, e quelli più
grossi sono del castello.

- **L'operazione la decide la scelta, non il giocatore.** Ogni truppa porta la
  sua (`+` arcieri e opliti, `−` pipistrelli e negromanti, `×` mummie, bestie cornute e golem,
  `÷` diavoletti e drago): scegliere la truppa di un edificio è anche scegliere il
  conto; le azioni hanno la loro (miniera `×`, ripara `+`, vendi `−`,
  castello `÷`, bomba `÷`). Il bambino non può evitare l'operazione che
  teme: costruire proprio la truppa che gli serve è parte della sfida.
- **La grandezza dei numeri la decide il bambino, poi il prezzo** (`bravura.js`).
  Ogni operazione ha una **base**, un grado del modulo: la prima caserma chiede
  quella, e una scelta cara sale di un grado ogni due di «peso» (`calcoloDi`, da 1
  a 10: costruire `1 + prezzo/4`, potenziare il livello dell'edificio, la miniera
  `3 + livello`, il castello `2 + livello/2`). Prima la grandezza era solo del
  prezzo, e la prima caserma chiedeva `7 + 6` a tutti (l'utente: «troppo facili»).
- **La base si muove giocando**: un conto giusto entro 6 secondi la alza di un
  terzo, uno sbagliato la abbassa di mezzo, uno giusto ma lento non la muove. Sta in
  `profile.campagne.arena.bravura`, una per operazione. **La prima volta si parte da
  quello che si sa già**: dall'età (il grado più alto il cui livello 0-100 sta sotto
  quello degli anni) e, per `×` e `÷`, dalle tabelline che reggono negli asteroidi
  (`frontieraTabelline`, un gradino sopra; la divisione uno sotto il prodotto). Di
  partenza non oltre il grado 5: il resto si guadagna.
- **Mai oltre il grado 7** (`GRADO_A_MENTE`): entro il cento col riporto, le
  tabelline fino al 12, le divisioni che sono tabelline al contrario. Dall'8 in su
  vengono le tre cifre, che si fanno in colonna. L'età taglia ancora dentro quel
  tetto; solo a 12 anni le somme salgono all'8 (`67 + 58`), perché sotto l'età non
  ne lascia.
- **Una tappa non chiede un'operazione che non ha ancora insegnato.** Se
  l'azione vuole `÷` ma la tappa arriva solo a `+` e `−`, si ripiega sulla più
  vicina (`÷` → `×` → `−` → `+`, la stessa scelta del castello): è
  `operazionePer` in `dati/campagna.js`.
- **Si chiede al modulo di quiz `conti`** (`src/quiz/moduli/conti.js`, solo su
  richiesta), non a un generatore del gioco: così arrivano il perché dopo lo
  sbaglio, lo SRS, l'età e i saperi spenti dai genitori.
- **Il campo sta fermo del tutto mentre si calcola** (era a metà velocità, `CALCOLANDO`, tolto il
  15/10 su richiesta dell'utente: «il gioco si deve fermare completamente»). La fretta non c'è: si
  ragiona, e sbagliare costa solo il riposo della caserma. Il calcolo prende **tutto lo schermo**.
  La taratura non è stata rimisurata: vedi [da-fare.md](da-fare.md).
- **Per scegliere con calma ci sono «i numeri»**, nella scelta e nell'anello: aprono i dettagli (come sta
  la cosa adesso, come starebbe al livello dopo, quanto costa) e **il campo sta
  fermo finché sono aperti**: la scelta di cosa costruire si fa lì, senza fretta,
  e il calcolo viene dopo. Che conto serve non si scrive: «si risolve una
  moltiplicazione» è stato tolto (l'utente).
- **Sbagliare non costa monete**: la caserma sbagliata riposa 6 secondi (il
  prezzo è il tempo), le altre scelte si ritentano quando si vuole.
- **Una moneta vera per conto giusto** (`PAGA.mossa`): la domanda è la mossa
  stessa. Il salvadanaio varietà dimezza dopo venti minuti sullo stesso gioco.
