# Lo scontro a gruppi

Il progetto deciso il 12 ottobre 2026 e non ancora costruito: lo scontro passa
dal duello uno contro uno a **uno contro tanti, a turni, con l'iniziativa**,
alla Final Fantasy. Il perché, con le parole dell'utente: in una stanza con
sei mostri «li devo affrontare uno dietro l'altro… una volta che ti curi sei
a posto e reggi a lungo, averne dieci piccoli non significa niente, solo più
domande». In uno contro tanti il pericolo cresce con il numero dei mostri,
le abilità ad area hanno un senso e la torcia decide chi parte per primo.

Quando sarà costruito, questa pagina diventa la regola e la parte di oggi in
[regole.md](regole.md#lo-scontro), [abilita.md](abilita.md#nello-scontro) e
[pericolo.md](pericolo.md) si riscrive su questa.

## Chi entra

- **Lo scontro comincia quando un mostro ti raggiunge o lo tocchi tu.**
- **Entrano tutti i mostri vivi entro `RAGGIO_SCONTRO` (4,5 celle) dall'eroe,
  nella stessa stanza**, svegli o addormentati, misurati una volta sola
  all'inizio. Chi è fuori resta fuori: **nessun rinforzo** a scontro aperto.
  Dividere un gruppo grande è una cosa da fare apposta, avvicinandosi piano e
  con la luce.
- **Al massimo sei** (`MOSTRI_IN_CAMPO`): sei figure stanno a 390 px. Se il
  raggio ne prende di più, entrano i sei più vicini. **Il mostro grosso vale
  due posti**, quindi con lui al più quattro.
- I branchi (mostri messi a gruppi nelle stanze, il caporale col suo seguito)
  li fanno i piani nuovi, non questo lavoro: lo scontro funziona con quello
  che trova.

## Chi parte

- **L'agguato**: se il mostro che ti raggiunge arriva **alle spalle** (dalla
  metà dietro il verso in cui l'eroe guarda, cioè l'ultimo passo fatto),
  colpisce **solo lui, una volta**, prima di tutto. Poi si va di iniziativa.
  Farsi prendere alle spalle non conviene mai: entrano gli stessi mostri in
  ogni caso (conta il raggio), e in più si prende un colpo.
- **La sorpresa**: se sei tu a toccare un mostro che dorme, il tuo primo turno
  arriva prima di tutto, con la sua domanda.
- Il cono di luce e l'ombra alle spalle arrivano con la luce nuova; qui
  «alle spalle» è solo geometria. Se a giocarlo risulterà troppo punitivo, si
  aggiungerà un segno che qualcosa si muove dietro: visivo, perché col suono
  spento il gioco deve restare intero.

## L'iniziativa

- **Ognuno ha una velocità** (`velocita`): l'eroe `10 + destrezza`, i mostri
  quella della specie in `dati/mostri.js` (il ratto e il pipistrello svelti,
  la melma e il golem lenti, il resto in mezzo). Da tarare: l'eroe deve
  partire **più veloce della media dei mostri** (l'utente: «l'eroe è alto
  come iniziativa»).
- **Una fila di turni alla Final Fantasy X**: ogni azione fa aspettare
  `100 / velocita`; agisce chi ha aspettato di meno, a parità l'eroe. Niente
  tempo che scorre, mai: la fila si muove solo agendo.
- **Il doppio turno nasce da sé**: un eroe veloce il doppio di un mostro
  gioca due volte prima di lui. La destrezza diventa la caratteristica del
  ritmo, e i pezzi hanno una cosa in più da dare.
- **La fila si vede**: i prossimi sette turni, in una colonna stretta in
  sovrimpressione sul bordo destro del fondale (non una riga in più). Il
  doppio turno si vede prima che succeda.
- **Gli effetti si contano nei turni di chi li porta**: il veleno brucia al
  turno del mostro avvelenato, lo stordito salta i suoi prossimi N turni, lo
  scudo dell'eroe scade ai turni dell'eroe.

## Il turno dell'eroe

- **Si sceglie cosa fare**: Attacco, le tre abilità delle caselle, Bevi,
  Scappa (la scelta di oggi, `CaselleAbilita.vue`).
- **Il bersaglio è già scelto**: lo stesso di prima se è in piedi, se no il
  più ferito in proporzione. Toccando un altro mostro lo si cambia. Prima di
  rispondere si accendono tutti quelli che il colpo prenderà.
- **Poi la domanda.** Giusto: il colpo parte e l'abilità si paga. Sbagliato:
  il colpo va a vuoto, l'abilità resta pronta e non costa, il turno è
  passato. Una domanda per turno che colpisce: bere e scappare non ne
  chiedono.
- **Bere costa il turno** (la pozione rossa); la blu come oggi.
- **Scappare ha un costo fisso**: un colpo solo, del mostro più forte in
  campo, quanti che siano. Non si offre se quel colpo farebbe svenire.
  L'utente: «non dobbiamo obbligarlo a morire, è un gioco per bambini».
  Dopo, la `CALMA` di oggi vale per tutti quelli che erano in campo.

## Le forme dei colpi

Ogni abilità ha una **forma** (`forma` in `dati/abilita.js`); l'attacco
solito è «uno».

| forma | chi prende | esempio |
|---|---|---|
| `uno` | il bersaglio | Stoccata |
| `vicini` | il bersaglio e i due accanto nella fila a schermo | la palla di fuoco |
| `catena` | il bersaglio, poi salta su altri (`salti`), ogni salto ×0,7 | il fulmine a catena |
| `tutti` | tutti in campo | Grido di guerra, Turbine |

- Gli effetti vanno a tutti quelli presi, col loro danno.
- Le abilità di oggi con `stanza: true` diventano `tutti`, le altre `uno`. Le
  forme `vicini` e `catena` il motore le sa fare subito (con i test); le
  abilità nuove che le usano arrivano con l'albero più ricco.
- Provato a pensare a «solo uno» e «solo tutti»: l'utente, «se forziamo area
  completa/singolo temo che ci perdiamo delle opportunità».

## Il turno dei mostri

- **Un mostro colpisce in base alla difesa, non alla risposta** (l'utente).
  Le risposte servono ad attaccare: sbagliando perdi il turno, e intanto i
  mostri colpiscono lo stesso. Così l'agguato, la difesa e le cure diventano
  scelte: il mago decide se mettere tutto sull'intelligenza o reggere di più.
- **Il colpo**: `COLPO_DEL_MOSTRO` × (attacco − difesa), almeno 1, con gli
  effetti. Si parte da **0,6**, la media di oggi a otto risposte giuste su
  dieci (metà quando si risponde bene, intero quando si sbaglia), e si ritocca
  con le misure.
- **Sotto il mostro**: «ti colpisce 3». Spariscono «se sbagli» e il graffio.
- **Uno alla volta, in ordine**, con la sua animazione corta; un tocco la
  accorcia.

### Le abilità che dipendevano dalla risposta

Si riscrivono (gli id restano: sono chiavi del salvataggio):

- **`parato`** (Scudo alzato, Danza delle lame): non più «rispondendo bene
  nessun graffio», ma **i colpi presi fanno metà per N turni dell'eroe**.
- **`testaDura`** (Testa dura): i primi N colpi di ogni scontro fanno metà.
- **`quieto`** (Freccia mirata): il bersaglio salta il suo prossimo turno.
- **`primoTiro`** (Primo tiro): l'elfa con l'arco **agisce per prima** in
  ogni scontro, prima anche della fila, con il suo bonus di danno.
- **Il veleno «anche sbagliando»** brucia al turno del mostro, quindi resta
  vero da sé.
- Specchio, scudo, linfa, intoccabile, Ultimo fiato: uguali, contati nei
  turni.

## Le caratteristiche

L'utente vuole che un mago possa diventare **mago guerriero**: la spada e ogni
tanto un incantesimo. Oggi l'attacco viene dall'arma in mano e tutte le
abilità colpiscono con quello. La regola nuova:

- **Un ramo d'arma colpisce con l'attacco della sua arma**: il fuoco e il
  gelo con la bacchetta, anche se la bacchetta sta nella mancina (intera, non
  a metà come la seconda arma). Un mago con la spada in mano e la bacchetta
  nella mancina attacca di spada (forza) e incanta di bacchetta
  (intelligenza).
- **Un ramo senz'arma colpisce con la sua caratteristica** (`car` del ramo):
  Arcano l'intelligenza, Bosco la destrezza, Giuramento e Pietra la forza. Un
  cavaliere col Grido o un mago col Fulmine non dipendono dall'arma che hanno
  in mano.
- **Cosa fa ognuna**:

| | attacco con | e poi |
|---|---|---|
| Forza | spade, asce, mazze; i rami Giuramento e Pietra | il requisito di armature e scudi pesanti (con la luce nuova o l'albero più ricco) |
| Destrezza | archi; il ramo Bosco | la schivata, **la velocità** |
| Intelligenza | bacchette; il ramo Arcano | l'energia |
| Tempra | — | la vita e la difesa |

- La regola del bilanciamento fra due caratteristiche
  ([livelli.md](livelli.md)) aiuta chi divide i punti, quindi il mago
  guerriero non resta indietro. I requisiti delle armi restano rigidi.
- Il requisito di forza delle armature pesanti dà un uso della forza anche al
  mago ([da-fare.md](da-fare.md)): non è di questo lavoro.

## Lo stop del pericolo

Come oggi ([pericolo.md](pericolo.md)), con una differenza: si guarda quando
tocca all'eroe, e conta **la somma dei colpi che arriveranno prima del suo
prossimo turno** (la fila li sa). Due fermate per scontro al più, la riga
rossa sopra la scelta, le stesse scelte (bevi, scappa, continua).

## La vista

- **Il fondale di oggi**, l'eroe a sinistra con **un posto vuoto sotto per il
  compagno** (in futuro), i mostri a destra in due file da tre; il grosso
  grande al centro, con gli altri intorno. Le file a schermo non sono
  regole: davanti o dietro non conta (l'utente: «aggiunge un'altra
  complessità a logiche già difficili da calibrare»).
- **Sotto ogni mostro la sua barretta, senza numeri**, e sopra «ti colpisce N».
  Il bersaglio ha un anello d'oro; chi verrà colpito un contorno.
- **La colonna dei turni** sul bordo destro, le figure piccole, chi agisce
  adesso più grande.
- Le animazioni di oggi (chi colpisce scatta, i numeri salgono, il glifo
  vola) per ogni colpo. Un'animazione per ogni abilità e per gli stati
  arriva con l'albero più ricco.

## Le domande

- **Il tetto resta: 85 risposte obbligate a seduta** (`unita/sotterraneo`).
  Uno contro tanti non deve chiedere di più: i mostri in gruppo picchiano di
  più, ma un colpo ad area ne prende tanti con una domanda sola.
- Il giocatore finto (`motore/banco.js`) va rifatto sullo scontro nuovo: la
  forbice e il patto a otto su dieci si rimisurano.

## Cosa resta fuori (per dopo)

- **Il compagno dell'eroe**: c'è il posto nella vista, la fila dei turni lo
  saprebbe già contare.
- **Le abilità dei mostri**: il grosso che ogni tot turni chiama dei
  sottoposti, e altre. Il motore deve lasciare la porta aperta: un mostro
  agisce con «un'azione», oggi sempre il colpo.
- **Prima e seconda fila**: scartate per ora.
- **Il segno di chi arriva alle spalle**, se l'agguato risulta troppo duro.

## Come si costruisce

1. **Il motore** (`motore/corsa.js` e un modulo nuovo per la fila dei
   turni): l'ingresso, la fila, i turni, le forme, il colpo dei mostri, le
   abilità riscritte, le caratteristiche per ramo, la fuga, lo stop; con i
   test unitari.
2. **La vista** (`Scontro.vue`, `Palco.vue`, `CaselleAbilita.vue`) e **il
   giocatore finto con le misure**, in parallelo.
3. Poi la luce a cono, i piani nuovi e l'albero più ricco.
