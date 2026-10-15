# I calcoli

Come una pianta diventa una domanda. Stessa strada di Castle Battle
([`../arena/calcoli.md`](../arena/calcoli.md)).

- **L'operazione la porta la pianta**: girasole e tiratore `+`, noce `−`,
  doppio `×`, gelo `÷`. Scegliere la pianta è scegliere il conto: il bambino
  non evita quello che teme. Le operazioni arrivano una famiglia alla volta
  insieme alle piante (`operazioniDi` in `dati/campagna.js`), quindi una
  tappa non chiede mai un conto che non ha insegnato.
- **La grandezza dei numeri la decide il bambino, poi il prezzo.** Ogni
  operazione ha una base (`profile.campagne.giardino.bravura`, la funzione
  è `arena/bravura.js`, pura e condivisa): parte dall'età e dalle tabelline
  degli asteroidi, sale con un conto giusto svelto, scende con uno sbagliato.
  Il prezzo aggiunge un grado ogni due di peso sopra il terzo
  (`pesoDi(costo) = 1 + costo / 40`).
- **Si chiede al modulo `conti`** (`src/quiz/moduli/conti.js`), non a un
  generatore del gioco: così arrivano il perché dopo lo sbaglio, lo SRS,
  l'età e i saperi spenti dai genitori.
- **Il campo sta fermo mentre si calcola** (a differenza di Castle Battle,
  dove rallenta): vedi [regole.md](regole.md).
- **Sbagliare non costa niente**; una moneta vera per conto giusto.
