# English a mondi — il progetto

Stato: **deciso, da costruire** (settembre 2026). Sostituisce la campagna in
fila di `data/campagna-inglese.js`, dove ogni tappa portava 42–73 parole nuove
e le frasi arrivavano solo all'undicesima: un blocco mnemonico. Lo spagnolo
segue dopo, con lo stesso motore.

## I mondi, non una fila

L'inglese non si monta tutto su sé stesso, quindi la campagna è un **grafo di
mondi** (come Duolingo): ogni mondo insegna un pezzo, e finire certi mondi ne
apre altri. Proposta di partenza (da rifinire costruendola):

| mondo | insegna | parole | si apre dopo |
|---|---|---|---|
| Che cos'è | *it is a …*, *is it …?*, colori, numeri, plurale | animali, colori, 1–10, scuola | — |
| Io e le mie cose | *I like / I don't like*, *have got / has got*, *this is my* | cibo, famiglia, vestiti, corpo | Che cos'è |
| Dove? | *there is / there are*, *where is*, in/on/under… | casa, giocattoli | Che cos'è |
| Cosa sai fare | *can / can't / can you?* | verbi di movimento, sport | Che cos'è |
| La mia giornata | presente con I/you/we, *at* + ora | giorni, verbi di ogni giorno | Io e le mie cose |
| Lui e lei | la *s* della terza persona, *does / doesn't* | mestieri, luoghi | La mia giornata |
| Adesso | *am / is / are + -ing* | mezzi, verbi | La mia giornata |
| Ieri | *was / were*, passato in *-ed* e irregolari | luoghi, verbi | Lui e lei o Adesso |

Ogni mondo ha poche tappe da **8–10 parole nuove + una struttura**, e una 🏁
in fondo. In fondo alla mappa c'è la prova finale.

**La mappa è una mappa del tesoro**: il grafo come quello della mappa del
sotterraneo, su filigrana di pergamena, sentieri tratteggiati, e per ogni
tappa un disegnino stilizzato di quello che insegna. Si disegna con i pittori
(niente emoji come figura principale, vedi `docs/core/grafica.md`).

**Ogni tappa ha un grado di «imparato» da 0 a 10**, calcolato dalla forza
SRS delle sue parole, frasi e strutture (`store/srs.js`): non è un numero da
tenere a mano, e **cala col tempo da solo** come cala la forza. A schermo la
tappa si riempie e, quando scende, sbiadisce. Riprendere una tappa scesa a 8
**riparte dalle domande di quel grado** (i formati adatti a quella forza, le
voci più deboli prima), non da capo. Un grado calato non richiude niente.

Le parole dei dati che non entrano in nessuna tappa stanno nel **📦 cassetto**
del mondo della loro categoria: facoltativo, si apre a tappa vinta, e si gioca
coi formati delle parole di oggi. Nessuna chiave sparisce.

## I formati, decisi dalla forza

Le parole tengono la scala di oggi (figura → ascolto → capisci → produci). Le
frasi salgono di un gradino a ogni punto di forza:

1. **Riconosci** — la frase inglese e quattro italiane (`fraseIt` di oggi).
2. **Cosa vuol dire** — anche qui le italiane sbagliate ricalcano le trappole
   della grammatica («è un cane» / «è un cane?»).
3. **Scegli** — la frase italiana e quattro inglesi: la giusta e tre trappole.
4. **Componi**, a gradini:
   - **completa**: la frase c'è già con dei buchi, le tessere servono solo per
     i buchi;
   - **monta**: solo le tessere giuste, da mettere in ordine;
   - **scegli e monta**: il banco con le parole trappola (una, poi due, poi tre).

Le tessere si **toccano** e vanno in fila, si ritoccano e tornano nel banco:
niente trascinamento. La punteggiatura non è una tessera: la fila mette da sé
la maiuscola e il `?`.

**Forma lunga prima, contratta dopo**: le prime tappe di ogni struttura usano
*it is*, *do not*; le successive *it's*, *don't*. Sono accettate sempre tutte e
due. *Have got* resta, come a scuola.

## Le trappole sono il dato

Una tabella di **errori tipici per struttura** genera le frasi sbagliate, ognuna
col suo perché in una riga (sotto i 70 caratteri): *it is* al posto di *is it*
nella domanda, *she play*, *does he likes*, *I not like*, *a hat red*, *three
dog*, *the* davanti a un nome generico, *he/she*, *have/has*, *can to*, *goed*…
Le trappole scritte a mano (parole vicine: *pen/pencil*) si aggiungono alla
frase, non sono obbligatorie. Le opzioni sbagliate di «scegli», il buco di
«completa» e le tessere in più di «componi» vengono tutte dalle stesse
trappole: una scrittura, tutti i formati.

Una frase componibile ha: `id`, mondo e tappa, `forma` (la struttura), `it`,
`en`, `varianti` accettate, `trappole` a mano, `niente` (regole da non
applicare perché qui darebbero una frase giusta). Le frasi di oggi tengono il
loro `id` (è la chiave SRS).

La chiave **`forma:<id>`** registra le risposte sulla struttura: una forma
debole fa uscire più spesso la sua trappola e ripesca le sue frasi nei mondi
dopo. Una frase composta giusta conta come ripasso delle sue parole **già
scadute** (solo quelle). Uno sbaglio su una parola vicina pesa sulla parola,
uno di grammatica sulla frase e sulla forma.

## Il libro a capitoli

Ogni mondo ha un **mini capitolo di un libro**, con personaggi che tornano
(Laura, Leo, Tom, un cagnolino). Il capitolo è **scritto a mano** — un inizio,
un fatto, una fine — con:

- **variabili** tirate a sorte e coerenti fra loro (il cibo, il posto, il
  tempo, chi è amico di chi);
- **frasi a rami** accese da una condizione (se c'è vento il cappello vola, e
  lo riporta il cane *oppure* Leo);
- **domande in italiano** con risposte in italiano, calcolate dal mondo tirato,
  ognuna con la sua condizione. Le sbagliate sono le versioni che non sono
  uscite questa volta. «Non si sa» è una risposta quando il testo non lo dice.

Usa solo le strutture dei mondi già fatti. Cresce coi mondi: da 4 frasi e una
domanda (fatti in una frase) a 12–15 frasi e tre o quattro domande (chi/cosa
su due frasi, il perché, l'ordine degli eventi, quello che si capisce senza
che sia scritto, vero/falso su più frasi).

## Toccare una parola per sapere cosa vuol dire

Ogni parola inglese a schermo (frase, tessera, capitolo) si tocca e mostra la
traduzione per un paio di secondi.

- **Gratis 3 volte in tutto** finché la parola è nuova (forza bassa).
- Dopo, toccarla fa sì che **quella domanda non paghi**, e lo dice subito
  sull'indicatore delle monete, prima di rispondere. Non costa monete.
- La parola chiesta conta come **non saputa** nello SRS: non si rafforza anche
  se poi la risposta è giusta.
- Nel capitolo, ogni parola chiesta oltre le gratuite toglie il guadagno di
  **una** domanda, non di tutte.

## Sbagliare

Niente si perde, nemmeno alla 🏁: l'errore si spiega (il perché della trappola
più «Si fa così», la regola della struttura) e si aspetta, come nelle domande
del sotterraneo (`docs/apprendimento/la-domanda.md`).

## Chi ha già giocato

Riparte da zero nella fila nuova, ma **le parole sapute restano sapute**: le
chiavi `en:` e `frase:` non si rinominano, quindi le prime tappe le passa in
fretta. Il gioco libero resta a chi l'aveva. La campagna vecchia è un indice
in `p.eng`: la nuova va sotto un nome suo, e il travaso si pubblica insieme alla
mappa nuova, mai prima.

## Estendibile

Aggiungere varietà vuol dire aggiungere dati, mai toccare il motore:

- un capitolo è un file in una cartella, raccolto da sé (come i moduli di quiz);
- gli elenchi di personaggi, cibi, posti, oggetti sono in comune, con la loro
  traduzione e il mondo da cui sono noti: una parola nuova arricchisce tutti i
  capitoli che la possono pescare;
- un errore tipico nuovo è una riga della tabella delle trappole;
- un tipo di domanda nuovo si scrive una volta e lo usano tutti i capitoli.

**Un test solo controlla tutto**, anche quello che nascerà: una sola risposta
giusta per domanda, ogni ramo raggiungibile, nessuna trappola uguale alla
giusta o a una variante, ogni parola nota nel suo mondo, ogni perché sotto i 70
caratteri. **Uno script stampa** i banchi generati e un capitolo in tutte le
sue varianti, per rileggerli in blocco.
