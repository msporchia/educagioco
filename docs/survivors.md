[← torna al README](../README.md)

# 🏹 Survivors

*Sopravvivenza a ondate, dove ogni potenziamento ha un prezzo in difficoltà.*

<img src="img/survivors-gioco.png" width="230"> <img src="img/survivors-mappa.png" width="230">

## Come è fatto

Si resiste a ondate di nemici che arrivano da tutti i lati. Ogni tanto il
gioco si ferma e offre **tre carte** fra cui scegliere: un'arma nuova, più
velocità, più vita, un colpo che rimbalza.

## Le cose si trovano in giro

Questo gioco si giocava **da fermi**, ed era misurato: le gemme fuori
dalla calamita camminavano da sole verso l'eroe, fino a correre più di lui
— l'esperienza ti veniva addosso — e i mostri, da fermi, arrivavano comodi
da tutti i lati mentre l'arco tirava da solo. Il dito serviva a scansare,
e neanche sempre. Tre cose lo hanno rimesso in piedi, e ognuna è misurata
col giocatore finto del banco (`motore/banco.js`).

**Una gemma resta dove cade.** La calamita c'è ancora — è la sensazione da
non perdere, e le carte «calamita» la allargano — ma quello che sta fuori
aspetta. Chi non si muove raccoglie solo quello che gli cade sotto i
piedi, e non sale più di livello.

**A terra compaiono degli oggetti**, ogni dieci-quindici secondi (più
spesso con la marea) e qualche volta lasciati dai mostri grossi. Restano
nove secondi, lampeggiano negli ultimi due e svaniscono: chi li vuole ci
va. Sono tre:

- **❤️ un cuore**, che ne ridà uno senza alzare il tetto — ed esce solo a
  chi ne ha perso uno, se no sarebbe una corsa per niente;
- **🧲 una calamita**, che per quattro secondi tira tutte le gemme in campo,
  anche quelle lontane;
- **📦 una cassa**, che apre un'offerta di tre carte **pagata con la domanda
  come sempre**. Non è un potenziamento gratis, è un'occasione in più di
  guadagnarselo: una risposta sbagliata non paga, e niente si regala
  senza esercizio (vedi `CALIBRAZIONE.md`). Sopra le carte c'è scritto
  «una cassa», non «livello», perché non si è saliti di niente.

**I muri.** Ogni tanto — dopo dodici secondi la prima volta, poi sempre
più spesso con la marea — una fila di mostri deboli attraversa lo schermo
da un lato scelto a caso, dritta, senza inseguire nessuno. Il bordo da cui
entra si accende di rosso un secondo prima. La fila ha **un varco**, e
l'eroe è più svelto di lei: si passa dal buco, o si corre via. Chi sta
fermo ci finisce dentro, ed è misurato: un muro da solo prende chi non
muove il dito dieci volte su dieci, e chi si sposta zero.

**Due armi guardano dove corri.** L'arco tira da solo al più vicino, e va
bene così — ma un gioco in cui *tutto* tira da solo si guarda e basta. Il
**Fendente** (carta media) è un colpo largo davanti, nella direzione di
marcia, e parte solo se davanti c'è qualcuno; la **Lancia** (carta forte)
parte dove si sta correndo e trapassa tutti quelli che trova. Per usarle
bisogna correre *verso* i mostri, e mirare costa: quindi picchiano più
dell'arco, apposta. Chi sta fermo le tiene puntate dov'era andato l'ultima
volta, e una freccina ai piedi dice dove.

Il risultato, misurato sul banco tappa per tappa: chi non muove il dito
vinceva la prima tappa una volta su sei e la terza una su tre; adesso non
ne vince nessuna. Il giocatore finto, per contare ancora, ha dovuto
imparare tre cose — andare a prendere gemme e oggetti, scansare le file, e
correre verso il grumo di mostri quando ha un'arma che guarda avanti.

## La regola che rende il gioco un gioco

**Le carte non sono gratis: ognuna ha un prezzo, e il prezzo è la difficoltà
della domanda che devi indovinare per averla.**

Il prezzo si compone di due cose.

**Quanto quella carta cambia la partita.** Una freccia in più raddoppia il
fuoco; la calamita fa solo volare le gemme un po' più da lontano.

| fascia | esempi | che domanda arriva |
|---|---|---|
| debole | la mela che ridà un cuore, la calamita | facile |
| media | | media |
| forte | la freccia in più | tosta |

**E quanto quella carta è già cresciuta.** La prima freccia in più costa
quello che dice la sua fascia; la quinta costa molto di più. La stessa
capacità, presa in basso, chiede una domanda facile — presa in alto, ne
chiede una tosta.

Serve a tenere viva la scelta: senza, prendere nove volte la stessa carta
sarebbe nove volte lo stesso pedaggio, e dopo il terzo livello non ci sarebbe
più niente da decidere.

Se rispondi giusto, prendi il potenziamento. Se sbagli, niente carta: il
giro dopo arriva presto, perché le gemme continuano a cadere.

Al posto di «niente» c'era una monetina — un «ci hai provato» che valeva in
cameretta e non in campo, e che sembrava innocua. Era il buco più grosso del
gioco, per una ragione che il codice non poteva sapere: **quello che un
bambino vuole sono le monete**, perché quelle si spendono. Una moneta per
ogni risposta sbagliata non è un premio di consolazione, è il modo più
veloce di farne — chiedi una carta, premi un tasto a caso, incassi,
ricominci — e nella partita libera, dove non si vince niente, era perfino
l'unica fonte. Adesso le monete di questo gioco si prendono in un modo solo:
arrivare in fondo a una tappa.

Questo trasforma ogni offerta in **una scelta vera**: prendo la carta forte
rischiando una domanda difficile, o mi accontento di quella debole che sono
sicuro di indovinare? Senza il prezzo, la scelta sarebbe solo «quale carta è
più utile», e la risposta sarebbe sempre la stessa.

È anche il motivo per cui un bambino che ha voglia di vincere **sceglie da
solo le domande difficili**, il che è esattamente il punto.

## Una partita si può lasciare a metà

Le tappe durano fra i 45 secondi e i tre minuti, la Sopravvivenza non
finisce mai. Uscire non butta più via niente: si scrive dove si era
(`motore/sosta.js`) e la mappa la offre in cima — «⏱ mancano 38s · ❤️ 3/4 ·
livello 6 — torno in campo da dove ero». È la stessa promessa del
[sotterraneo](sotterraneo.md), e vale la pena tenerla uguale in tutti i
giochi: un bambino che ha imparato che di là si può uscire non deve
scoprire che qui no.

Quello che si salva sta in meno di un chilobyte, perché quasi tutto si
**rifà**: lo scenario sta nella tappa, i numeri dell'eroe sono una funzione
delle carte prese. Si scrive solo quello che è *successo* — dove si era
arrivati, cosa si è preso, chi c'è in campo.

Tre scelte dentro questa:

- **I mostri non si cancellano, si spingono via.** Riaprire il gioco a campo
  pulito sarebbe comodissimo, e diventerebbe *una mossa*: quando sei
  circondato esci, rientri, e la marea ricomincia da capo mentre l'orologio
  no. In campagna quei secondi valgono un cuore, cioè una stella; nella
  Sopravvivenza valgono il primato. Quindi i mostri si ritrovano dov'erano,
  e solo quelli addosso fanno un passo indietro — perché riprendere con la
  melma sul naso e mezzo cuore in meno è il modo più rapido di far pentire
  qualcuno di aver ripreso.
- **Il campo riprende fermo**, e riparte al tocco. Questo gioco non è a
  turni: chi riapre sta ancora guardando dov'era rimasto, e la marea non
  aspetta nessuno. Il cartello è **il velo della pausa**, lo stesso che si
  vede col ⏸ (vedi sotto): prima era una riga scritta apposta dentro il
  campo, cioè lo stesso velo in una seconda copia, con un'altra frase e in
  un altro punto dello schermo.
- **Dopo il traguardo non si salva più.** Lì stelle e monete sono già state
  contate: chi resta in campo gioca tempo regalato, e interromperlo costa
  qualche monetina e nient'altro. Salvare anche quello vorrebbe dire
  portarsi dietro *che i premi sono già stati pagati* — e un salvataggio che
  si scorda quella riga paga la tappa due volte.

Le tre carte in attesa si salvano **per chiave** e si rivestono riprendendo:
ripescarle sarebbe una riga in meno e un tiro nuovo a ogni uscita, cioè chi
non gradisce l'offerta esce e rientra finché non gliene capita una migliore.

## E ci si può anche solo fermare

Il ⏸ in barra ferma la partita senza uscire, e il telefono posato la ferma
da sé — ma **al ritorno non riparte da sola**: si riprende al tocco, perché
chi riaccende il telefono sta guardando il telefono che si accende, non il
campo. È il pezzo comune di `src/giochi/pausa.js`, lo stesso della
[corsa](corsa.md), e vale la pena tenerlo uguale in tutti i giochi per la
stessa ragione della sosta. Il ⏸ sparisce dove il gioco è già fermo dietro
un altro velo — le tre carte, la domanda che le paga, il cartello finale —
perché due veli uno sull'altro sono un gioco rotto.

## La Sopravvivenza, che non finisce

Finite le nove tappe si apre **la Sopravvivenza**: nessun traguardo, la marea
che sale e basta. Una partita che non si può vincere non dà né stelle né
tappe nuove, e allora l'unica cosa che ha da dare è **dire di quanto sei
migliorato**. Alla fine il cartello porta il confronto con il record — «🥇
Nuovo record! 2:05 (32s meglio di prima)», coi coriandoli — e quando il
record resta dov'era dice comunque quanto è mancato. La prima partita in
assoluto non batte niente, e infatti non lo dice: «il tuo primo risultato».

Il record, quante partite sono state fatte e le ultime cinque in fila stanno
anche nella pagina **I miei progressi**, sotto *I miei record*, insieme a
quelli degli altri giochi senza fine. Il conto è di tutti
(`src/giochi/primati.js`), non di questo gioco: Survivors dichiara soltanto
che la sua sfida infinita si misura in tempo.

### E le carte non finiscono prima della marea

Il mazzo ha venti carte per ottantatré copie in tutto, che in una
tappa da tre minuti sono più di quante se ne possano prendere — ma la
Sopravvivenza non finisce, e si può interrompere e riprendere: una partita
libera dura un pomeriggio. Quando l'ultima copia era presa, la salita di
livello **non offriva più niente**: nessuna pausa, nessuna domanda, nessuna
carta, e le gemme che continuavano a cadere senza servire a niente. Misurato
col banco su un eroe che ha già tutto: ventidue livelli buttati, e nemmeno
una domanda.

Le due strade erano dichiarare vittoria o allungare la scaletta, e la
vittoria si è scartata: **una vittoria metterebbe un tetto sopra il
record**, e il record è la ragione per cui si rigioca. Quindi nella
Sopravvivenza — e lì soltanto, le nove tappe non si muovono di un numero —
**una carta non ha tetto**, e le copie oltre il suo ultimo livello rendono
ogni volta meno: la prima in più vale sei decimi di un livello vero, la
seconda tre, la terza due. È una serie che si chiude, ed è per questo che
non rende immortali: *tutte* le copie in più di una carta, quante se ne
prendano, non arrivano a valere due livelli. La potenza dell'eroe smette di
raddoppiare, la marea no — la partita la chiude la marea, come prima, solo
un po' più tardi (misurato: da 859 a 986 secondi, con ventinove domande in
più al posto di ventidue livelli a vuoto).

Due dettagli che stanno lì per un motivo:

- **Il secondo giro comincia quando il mazzo è finito davvero.** Finché una
  carta qualunque ha ancora un livello pieno da dare, l'offerta pesca solo
  fra quelle. Messa in fila con i livelli pieni, una copia oltre il tetto
  sarebbe una fregatura — costa la domanda più tosta che ci sia e dà un
  pezzetto di livello — e chi cerca la carta più cara si ritroverebbe a
  riprendere per la settima volta l'anello di fuoco con gli stivali ancora
  intatti in fondo al mazzo. Provato: così la partita finiva **prima** di
  quanto finisse senza tutto questo.
- **Quello che dà una cosa intera il tetto ce l'ha davvero**: una freccia in
  più è una freccia, un cuore è un cuore, una cometa gira o non gira. Mezza
  copia di quelle non vuol dire niente, e una freccia in più per sempre
  renderebbe immortali.

Sulla carta si vede: al posto di «livello 4 di 4» c'è scritto **«ancora un
po' di più»**, in grigio invece che in blu, perché non è una salita — è
quello che resta quando la scaletta è finita.

## Quali domande escono

Tutte le materie: italiano, matematica, spazio, tempo, logica. Il gioco non
sa quali esistano, chiede solo una domanda di una certa durezza.

**[→ Cosa c'è dentro, materia per materia](domande.md)**

La difficoltà non dipende da quanto è lunga la partita ma **da cosa scegli**:
quale carta, e quanto l'hai già cresciuta. Nel [Dungeon](dungeon.md) invece
dipende da quanto si è scesi — stesse domande, due modi diversi di dosarle.

## Cosa allena

La stessa cosa del Dungeon come contenuto, ma con un'abitudine mentale
diversa: **valutare quanto si è sicuri di sé prima di impegnarsi**. È
metacognizione mascherata da gioco d'azione.

## Note per i genitori

- Vale quello che hai spento in *Genitori → cosa sa*: quelle domande non
  escono più, in nessuna fascia di prezzo.
- È fra i giochi più recenti ed è ancora in movimento.
