# Quanto costa vincere: la taratura del 30 ottobre

L'utente, 30 ottobre 2026, dopo averlo giocato: *«spesso e volentieri one-shotta chiunque, anche i boss o i nemici elite… se dici "il
nemico è forte" non ha senso se lo one-shotti»*. La misura gli dava ragione: per il curioso un mostro di strada cadeva al primo colpo
fra il 96 e il 100% delle volte in ogni discesa, il caporale e il re della cripta in uno o due, e uno scontro normale costava l'1–3% della
vita. E poi la regola nuova, che cambia cosa si misura:

> uno molto bravo dovrebbe svenire poco, uno che sbaglia spesso dovrebbe svenire più volte e quindi fare più volte la discesa: la domanda
> non è «vince» ma «quanto gli costa vincere», quante morti fai e quanto ti costa economicamente.

E sulle domande: *«non è che una discesa sia obbligatoriamente da fare entro un certo tempo… se ogni mostro che incontri è uguale agli altri
è solo noioso»*. Il tetto della seduta passa da 85 a 150 ([regole.md](regole.md)).

## I bersagli

Il curioso (9 su 10), il medio (8 su 10) e lo sbadato (6 su 10) giocano la discesa **dallo stesso ingresso** (la roba e il livello con cui
la storia del curioso ci arriva) e la rifanno finché non la vincono, al più sei volte, rifacendo la spesa dopo ogni sconfitta
(`finoAVincere` in `motore/storie.js`, `SONDE` e `TENTATIVI_SONDA` in `dati/giocatori-tipo.js`). In media a discesa:

| | svenimenti per vincerla, in tutto | volte per vincerla |
|---|---|---|
| il curioso, 9/10 | al più 1,7 (cripta 0,5) | al più 1,3 |
| il medio, 8/10 | da 1 a 3,5 (cripta al più 1) | al più 1,6 |
| lo sbadato, 6/10 | almeno 4 (cripta 1) | almeno 1,5 |
| il bravo, dritto alla scala | vince alla prima al più metà delle volte: senza esplorare non bastano roba e livello | |

E i colpi (`rapporto-chiede.js`, i bersagli dell'utente del 14 ottobre): un mostro di strada 2–3 risposte, un caporale 4–6, il grosso di
più; uno scontro normale il 15–25% della vita, uno pesante il 30–60%. **La cripta fa eccezione apposta** (l'utente: *«anche nella cripta
dovrebbe esserci la differenza, lasciamoli divertirsi»*): i comuni restano a un colpo e picchiano piano (spinta −1), il caporale chiede due
colpi e il re quattro, così si vede chi è forte e le mosse dei capi ([mosse.md](mosse.md)) fanno in tempo a vedersi.

## Le misure (`npm run taratura`, 30 storie per eroe)

| | cripta | cantine | torre | gallerie | cisterna | labirinto | fondo |
|---|---|---|---|---|---|---|---|
| colpi: comune · caporale · grosso | 1 · 2,2 · 3,5 | 1,9 · 4,3 · 4,4 | 2,1 · 5,7 · 6,3 | 2,3 · 7,1 · 6,9 | 2,0 · 6,1 · 6,9 | 2,3 · 6,4 · 5,6 | 2,0 · 7,4 · 7,2 |
| svenimenti per vincerla 9 · 8 · 6 su 10 | 0,2 · 0,5 · 1,4 | 1,2 · 1,9 · 5,2 | 1,2 · 1,7 · 4,1 | 1,6 · 2,1 · 8,1 | 1,0 · 1,8 · 6,9 | 1,4 · 2,9 · 9,5 | 1,0 · 1,7 · 4,8 |
| volte per vincerla 9 · 8 · 6 su 10 | 1 · 1 · 1,2 | 1,2 · 1,4 · 2 | 1,2 · 1,2 · 1,5 | 1,1 · 1,2 · 1,8 | 1,1 · 1,2 · 1,9 | 1,1 · 1,4 · 2,4 | 1 · 1,1 · 1,5 |
| domande in tutto 9 · 6 su 10 | 25 · 40 | 159 · 292 | 150 · 272 | 158 · 311 | 135 · 298 | 310 · 678 | 184 · 339 |

Prima (stessi semi): il curioso 72–149 domande a discesa, lo sbadato vinceva alla prima il 58–83% delle discese e sveniva in tutto
0,1–2,4 volte (giro corto, tre storie per eroe). Le gemme: tutti e tre escono più ricchi di come entrano, lo sbadato meno (46–122 contro 75–407 del curioso).

## Le leve

- **`forza` di ogni discesa più alta, `caporali` e `grosso` più bassi** (`dati/campagna.js`): `forza` moltiplica le ossa di tutti,
  `caporali` e `grosso` dicono quante volte più di un comune. Prima i comuni erano carta e i caporali 6–7 volte loro; ora i comuni hanno
  due o tre volte le ossa di prima e i caporali circa il doppio di un comune.
- **`spinta`** (quanto picchiano in più): ritarata discesa per discesa sui bersagli degli svenimenti; il fondo arriva a 13,5 (il tetto dei
  guasti passa da 12 a 16).
- **Il labirinto ha branchi da quattro** invece che da cinque (`tettoBranco`): era la discesa più lunga.
- **Il mostro col nome** delle missioni e della bacheca ha un quarto di ossa in più e non più un colpo in più (`PIU_DURO`): in duello
  a soli attacchi non si batteva più. Le prove ora concedono una pozione, perché nello scontro bere non costa il turno.
- **Le zone, l'abisso e il mondo di sopra** seguono in proporzione: la curva delle zone è forza 5,8 + 0,35 e spinta 10 + 1 a livello
  dal 12 (`CURVA_DELLE_ZONE`, prima 2,2 + 0,15 e 9,5 + 1,3), misurata col curioso in `misure/sotterraneo` sui bersagli delle zone di sempre
  (a 9/10 il 88–97% al 12 e il 50–88% al 30, una rossa vinta il 24%, una verde il 74%; con la spinta a 6 il curioso le stravinceva, a
  13,5 un eroe del livello atteso non vinceva una verde). Una zona vinta rende fino a quattro livelli e mezzo (prima tre e mezzo): i comuni
  hanno più ossa e un mostro porta quello che è. L'abisso da forza 2,5 (prima 2,2; più su il cavaliere uscito dalla storia non arriva all'ottavo piano), il mondo di sopra copia le
  discese (`CURVA_DI_SOPRA`) coi caporali al doppio di un comune (`CAPORALI_DI_SOPRA`). Il mostro di riferimento della forza
  ([forza.md](forza.md)) tiene il massimo anche dell'attacco, perché il fondo picchia più delle prime zone.
- **La cripta della zona** non eredita il caporale e il re duri della cripta della storia: ha i rapporti di sempre.

## Provato e lasciato

- **Concedere meno svenimenti** (uno per piano invece di due più uno per piano): la forbice fra 9 e 6 su 10 si apriva poco (9/10 vinceva
  il 55–88% alla prima, 6/10 il 18–49%) e perdeva anche chi risponde bene. Con la misura del costo non serve: lo sbadato perde la discesa
  e la rifà.
- **Meno mostri** (più stanze vuote, branchi più piccoli) per restare sotto le 85 domande: tolto quando l'utente ha detto che il tempo
  non conta. Togliere mostri toglie anche esperienza e gemme.

## Cosa resta

- **Le zone, l'abisso e il mondo di sopra non hanno ancora la misura del costo**: le zone si misurano col finto che va dritto a una
  partita sola, il mondo di sopra coi suoi bersagli di prima. Quando ci si gioca, vanno rimisurati come le discese.
- **Chi non usa le abilità fatica molto di più**: il curioso abbatte un comune in 2–3 risposte perché usa le abilità appena può; un
  eroe del livello atteso che attacca e basta ne chiede 5–7 (la tabella delle specie, colonna «abbatte in»). Il banco nudo, senza
  abilità e senza pozioni nello scontro, non vince più le cantine. Da guardare col dito: se un bambino non spende i punti dell'albero.
- **Le pozioni bevute** dal curioso sono 6–17 a discesa contro il bersaglio di 1–3 del 14 ottobre (prima erano 4–9).
