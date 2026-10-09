# Le regole di Survivors

Perché non si gioca da fermi, come si paga una carta, cosa si salva uscendo e
come la Sopravvivenza non resta senza carte. Il codice sta in
`src/giochi/survivors/`; ogni numero qui è misurato col giocatore finto di
`motore/banco.js`.

## Non si gioca da fermi

Da fermi le gemme correvano verso l'eroe, i mostri arrivavano comodi e l'arco
tirava da solo: il dito serviva a scansare, e neanche sempre. Tre cose lo
hanno rimesso in piedi. Misurato: chi non muove il dito vinceva la prima tappa
una volta su sei e la terza una su tre, adesso nessuna. Il giocatore finto,
per contare ancora, va a prendere gemme e oggetti, scansa le file e corre
verso il grumo quando ha un'arma che guarda avanti.

- **Una gemma si prende passandoci sopra.** Nessuna calamita di base: il
  risucchio di un quarto di schermo per tutti era la stessa cosa in piccolo.
  La calamita si guadagna: la carta 🧲 *Calamita* tira da poco e si allarga
  copia dopo copia (costa un posto che sarebbe andato a un'arma), oppure
  l'oggetto a terra. Chi raccoglie fa una decina di livelli a tappa, chi sta
  al centro e schiva meno di due. La scaletta dell'esperienza (`soglia` in
  `dati/taratura.js`) è tarata su quello scarto.
- **Gli oggetti a terra** (`dati/oggetti.js`) compaiono ogni dieci-quindici
  secondi, più spesso con la marea, e qualche volta li lasciano i mostri
  grossi; restano nove secondi, lampeggiano negli ultimi due:
  - **❤️ il cuore** ne ridà uno senza alzare il tetto, ed esce solo a chi ne
    ha perso uno;
  - **🧲 la calamita** tira per quattro secondi le gemme entro un
    raggio di 420 punti, cioè quelle dello schermo: quelle lasciate lontano
    sulla mappa restano dove sono;
  - **📦 la cassa** apre un'offerta di tre carte **pagata con la domanda come
    sempre** — sopra c'è scritto «una cassa», non «livello». È rara con un
    tetto dichiarato (`CFG.oggetti.cassa`): mai nei primi dieci secondi, mai
    due insieme, non più di una ogni tre quarti di minuto. Senza, a fine
    campagna era quasi un quarto delle offerte e le carte si aspettavano
    invece di raccogliere: il banco tiene le offerte in più di una tappa
    **sotto un terzo**.
  - **💣 la bomba** si consuma: va in tasca (tre al massimo) e si lancia
    col pulsante in basso a destra, o con la barra al computer. Scoppia
    sull'eroe e toglie di mezzo tutti quelli entro 220 punti, grossi
    compresi; più in là li spinge via. **Si guadagna con l'esperienza**,
    una ogni tre livelli, e di rado si trova a terra con un orologio suo
    (`CFG.bomba`): la prima dopo mezzo minuto, poi una al minuto, una alla
    volta, mai a chi ha la tasca piena. Provato a pescarla fra gli altri
    oggetti: rubava il posto alle casse, e con meno carte le tappe
    diventavano più dure invece che più facili. Non si lancia sotto le
    carte. Nei test: `[data-bomba]`.
- **I capi**: dopo il 40% della tappa arriva un capo, poi uno ogni 45
  secondi (`CFG.capo`). È uno dei mostri più duri fra quelli ammessi,
  due volte e mezzo la stazza, con dieci volte la vita, un po' più lento,
  e le botte lo spostano poco. Si riconosce dall'alone rosso, dalla corona
  e dalla sua barra della vita sempre accesa. Abbattuto lascia sei gemme e
  un oggetto. La bomba non lo abbatte d'un colpo: gli toglie metà della
  vita. Misurato su 72 partite per tappa: con i capi le vittorie restano
  quelle di prima.
- **I muri**: dopo dodici secondi la prima volta, poi sempre più spesso con
  la marea, una fila di mostri deboli attraversa lo schermo dritta da un lato
  a caso, con **un varco**; l'eroe è più svelto di lei. Un muro prende chi non
  muove il dito due volte su tre (la terza il varco gli cade
  addosso), chi si sposta non lo prende mai. **Nessun avviso**:
  provato un bordo rosso un secondo prima, e capire da che parte scansarsi è
  il gioco. Resta un brontolio basso, che non dice da dove.
- **Due armi guardano dove corri.** L'arco tira al più vicino; il
  **Fendente** (carta media) è un colpo largo nella direzione di marcia, solo
  se davanti c'è qualcuno; la **Lancia** (carta forte) parte dove si corre e
  trapassa. Mirare costa, quindi picchiano più dell'arco. Da fermi restano
  puntate dove si era andati, e una freccina ai piedi lo dice.

- **Il terreno**: boschi, montagne e stagni non si attraversano, e
  girando si trovano macchie di altri posti. Le frecce ci volano sopra.
  Le regole e i varchi garantiti: [terreno.md](terreno.md).

## Il potenziamento si sceglie quando si vuole

Salire di livello **non ferma il campo**: il potenziamento si mette da parte
(`daSpendere`), e il pulsante dorato «potenzia» in basso a sinistra (o Invio
al computer) apre le tre carte quando lo decide chi gioca. Prima le carte si
aprivano a ogni livello e il gioco si interrompeva di continuo. I
potenziamenti da parte si salvano uscendo; quelli non spesi a fine tappa si
perdono. Il pilota del banco li apre subito, perché sotto le carte il campo è
fermo e aspettare non salva niente: così le misure restano confrontabili con
quelle di prima. La cassa invece apre le carte subito, perché ci si è
andati sopra apposta. Nei test: `[data-potenzia]`.

**Tolta l'armatura a spine** (8/10/2026): pungeva solo chi era già addosso,
cioè quando era tardi, e non si vedeva bene. Un salvataggio che la aveva la
perde riprendendo (`motore/sosta.js` butta le carte che non sono nel mazzo).

**Scudo di ghiaccio e anello di fuoco vanno a impulsi**: alla prima copia
uno ogni 5,5 secondi, e ogni copia accorcia l'attesa di un secondo. Lo
scudo era un disco sempre acceso intorno all'eroe; adesso è un'ondata che
congela per due secondi chi è vicino.

## Il prezzo di una carta

- **Il prezzo è la difficoltà della domanda**, e si compone di due cose: la
  **fascia** della carta (debole → facile: la mela, la calamita; media →
  media; forte → tosta: la freccia in più) e **quanto è già cresciuta** (la
  quinta copia costa molto più della prima). Senza la seconda, nove copie
  della stessa carta sarebbero nove volte lo stesso pedaggio.
- **Sbagliando, niente carta.** Provata una monetina di consolazione: era il
  buco più grosso del gioco, perché le monete sono quello che un bambino vuole
  e una moneta per errore è il modo più veloce di farne (nella partita libera
  era l'unica fonte).
- **La carta vinta paga 🪙3, subito** (`PAGA.domanda` in
  `src/data/paghe.js`): è una domanda che ferma il campo, la domanda vera
  della calibrazione. Niente premio di tappa (`premio × stelle`, 🪙9–30),
  niente monete per i secondi della partita libera (una ogni quindici) o
  per quelli resistiti dopo il traguardo: pagavano il tempo passato a
  schivare, e il tempo di gioco è il premio, non l'esercizio
  ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).
  Il cartello di fine dice il totale e quanto ha tolto il salvadanaio
  (`[data-nota-monete]`).

## Uscire e riprendere

La sosta sta in `motore/sosta.js`, sotto un chilobyte: quasi tutto si
**rifà** (lo scenario è nella tappa, i numeri dell'eroe sono una funzione
delle carte prese), e si scrive solo quello che è successo — dove si era, cosa
si è preso, chi c'è in campo. È la stessa promessa del sotterraneo: chi ha
imparato che di là si esce non deve scoprire che qui no.

- **I mostri non si cancellano, si spingono via.** Il campo pulito
  diventerebbe una mossa: circondato, esci e rientri, la marea riparte e
  l'orologio no (in campagna quei secondi sono una stella, nella
  Sopravvivenza il primato). Si ritrovano dov'erano, e solo quelli addosso
  fanno un passo indietro.
- **Il campo riprende fermo**, e riparte al tocco. Il cartello è il velo della
  pausa ([../core/interfaccia.md](../core/interfaccia.md#la-pausa-una-sola)),
  che qui ha preso il posto di un `inAttesa` scritto a mano.
- **Dopo il traguardo non si salva più**: le stelle sono già contate, e un
  salvataggio che se lo scorda segna la tappa due volte.
- **Le tre carte in attesa si salvano per chiave** e si rivestono: ripescarle
  farebbe uscire e rientrare finché non capita un'offerta migliore.
- **Il ⏸ sparisce** dove il gioco è già fermo dietro un altro velo — le tre
  carte, la domanda che le paga, il cartello finale.

## La Sopravvivenza, e le carte oltre il tetto

- **Il record si misura in tempo**; il resto (primo risultato, pareggio,
  ultime cinque partite) è di tutti i giochi senza fine:
  [../core/primati.md](../core/primati.md).
- **Nella Sopravvivenza, e solo lì, una carta non ha tetto.** Il mazzo ha
  diciannove carte per ottantuno copie, e una partita libera dura un pomeriggio:
  finito il mazzo, la salita di livello non offriva più niente (misurato:
  ventidue livelli buttati, nessuna domanda). Dichiarare vittoria metterebbe
  un tetto sopra il record, quindi le copie oltre l'ultimo livello rendono
  sempre meno — sei decimi di un livello vero, poi tre, poi due: una serie che
  si chiude, e tutte insieme non arrivano a due livelli. Misurato: la partita
  va da 859 a 986 secondi, con ventinove domande al posto dei livelli a vuoto.
- **Il secondo giro comincia quando il mazzo è finito davvero**: finché una
  carta ha un livello pieno, l'offerta pesca solo fra quelle. Provato a
  mescolarle: la carta più cara diventava una fregatura, e la partita finiva
  prima.
- **Quello che dà una cosa intera ha il tetto davvero**: una freccia, un
  cuore, una cometa. Mezza copia non vuol dire niente, e una freccia in più
  per sempre renderebbe immortali.
- **Sulla carta** al posto di «livello 4 di 4» c'è «ancora un po' di più», in
  grigio invece che in blu: non è una salita.
