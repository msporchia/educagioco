# I calcoli

Come una scelta (costruire, potenziare, riparare…) diventa una domanda.

- **L'operazione la decide la scelta, non il giocatore.** Ogni truppa porta la
  sua (`+` scheletri e guardiano, `−` pipistrelli e negromante, `×` lupi e golem,
  `÷` diavoletto e drago); le azioni hanno la loro (miniera `×`, ripara `+`,
  castello `÷`, bomba `÷`). Il bambino non può evitare l'operazione che
  teme: costruire proprio la truppa che gli serve è parte della sfida.
- **La grandezza dei numeri la decide il prezzo**: il motore dà un «peso» da
  1 a 10 (`calcoloDi`): costruire pesa `1 + prezzo/4`, potenziare il livello
  della caserma, la miniera `3 + livello`, il castello `2 + livello/2`. Una
  scelta cara chiede un conto più grosso.
- **Una tappa non chiede un'operazione che non ha ancora insegnato.** Se
  l'azione vuole `÷` ma la tappa arriva solo a `+` e `−`, si ripiega sulla più
  vicina (`÷` → `×` → `−` → `+`, la stessa scelta del castello): è
  `operazionePer` in `dati/campagna.js`.
- **Si chiede al modulo di quiz `conti`** (`src/quiz/moduli/conti.js`, solo su
  richiesta), non a un generatore del gioco: così arrivano il perché dopo lo
  sbaglio, lo SRS, l'età e i saperi spenti dai genitori.
- **Il campo rallenta a un quarto mentre si calcola, non si ferma.** È una
  scelta dell'utente: la pressione resta, e una scelta ponderata costa
  davvero qualcosa. Il calcolo prende **tutto lo schermo**: provato a un foglio
  in basso che lasciava in vista il campo, e non andava (l'utente: «sfrutta
  l'intero schermo per le domande»); il campo corre piano là dietro.
- **Per scegliere con calma c'è il «?»** su ogni carta: apre i dettagli (come sta
  la cosa adesso, come starebbe al livello dopo, quanto costa, che conto serve)
  e **il campo sta fermo finché sono aperti**: la scelta di cosa costruire si fa
  lì, senza fretta, e il calcolo viene dopo.
- **Sbagliare non costa monete**: la caserma sbagliata riposa 6 secondi (il
  prezzo è il tempo), le altre scelte si ritentano quando si vuole.
- **Una moneta vera per conto giusto** (`PAGA.mossa`): la domanda è la mossa
  stessa. Il salvadanaio varietà dimezza dopo venti minuti sullo stesso gioco.
