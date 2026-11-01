# La luce, la torcia e la mappina

Nero = mai stato. Scuro e freddo = ricordato. Pieno e caldo = lo stai
guardando. Un sotterraneo tutto illuminato è una piantina, e su una piantina
non c'è niente da esplorare. La piantina c'è — la **mappina** in alto a
destra — e mostra solo il visto più tre punti: dove sei, la scala, chi ha la
chiave. La 🗺️ della barra in basso la apre grande ([barra.md](barra.md)).

Il codice: `aggiornaLuce` in `motore/corsa.js`, le misure in `dati/mondo.js`,
il disegno in `scena3d/` ([grafica-3d.md](grafica-3d.md)).

## Un cono davanti, l'ombra dietro

- **La luce dell'eroe è un cono davanti e un alone corto attorno** (l'utente,
  12 ottobre 2026: «le torce sono carine ma pleonastiche: i bambini le
  ignorano e vanno a sbattere su tutti i muri. Creare una zona d'ombra dietro
  l'eroe, è logico: non vedo dietro di me se la torcia è avanti a me»).
  Il cono guarda dove guarda l'eroe, apertura 220° (`APERTURA_CONO`: buio resta solo il settore alle spalle, non i fianchi; l'utente, 13 ottobre); l'alone
  è un cerchio piccolo attorno; **tutto il resto è ombra**, sempre.
- **La torcia allunga il cono, lo apre e copre le spalle; non accende la
  stanza intera.** Prima con la torcia la stanza si accendeva tutta e serviva
  solo nei corridoi, cioè non contava. Poi allungava il cono e basta, e
  l'utente (16 ottobre 2026) l'ha voluta «molto più efficace»: **si illumina
  di più ai lati e riduce le ombre alle spalle finché è accesa**. Senza torcia
  resta il cono corto di 220°, e lì guardarsi attorno serve.

  | | cono | apertura | alone | si vede davvero fino a |
  |---|---|---|---|---|
  | senza torcia | `RAGGIO` 3,2 | `APERTURA_CONO` 220° | `ALONE` 1,5 (la cella dietro è un'ombra appena schiarita) | ~2,8 celle |
  | agli sgoccioli | `RAGGIO_SGOCCIOLI` 7 | `APERTURA_SGOCCIOLI` 260° | `ALONE_SGOCCIOLI` 2,8 | ~6 celle |
  | torcia piena | `RAGGIO_TORCIA` 9,5 | `APERTURA_TORCIA` 300° | `ALONE_TORCIA` 3,8 (tre celle attorno piene, anche dietro) | ~8 celle |

  Con la torcia l'arco sfuma solo nell'ultimo terzo (`SFUMA_ARCO_TORCIA` 0,35
  contro 0,45): i fianchi sono pieni quanto il davanti, e dietro resta un
  settore di 60° d'ombra oltre l'alone. Era 6,2 / 4,4 di cono e 2,2 / 1,8
  d'alone, a 220° in tutti e tre gli stati.

  Agli sgoccioli (`torciaResta` ≤ 1 e niente alla cintura) il cono si accorcia
  da sé: si nota dalle caselle che si spengono, senza un avviso in più. Con una
  torcia alla cintura non si stringe: la prossima si accende da sé. I pezzi
  «luce» (`addosso('luce')`) allungano il cono.
- **Il verso è l'ultimo passo** (`Corsa.verso`, `{ dx, dy }`); da fermo
  resta; **toccando una cosa l'eroe si gira verso di lei** (`vaiVerso`), anche
  prima di muoversi. Prima del primo passo vale dove guarda lo sprite
  (`versoEroe`). Se cambia, la luce si rifà subito (`giraVerso`), non alla
  cella dopo.
- **La luce non passa dai muri, dai relitti né da una porta chiusa** (`fermaLaLuce`): la
  cella che la ferma si accende (si vede il muro, la porta, il relitto), quel che sta
  dietro no. **L'acqua non la ferma**: non si cammina ma si vede di là. Un relitto
  fa dunque angoli d'ombra in mezzo a una stanza, dove stanno gli appostati
  ([piani-caverne.md](piani-caverne.md#i-relitti)). Un muro accanto a un pavimento acceso si accende con lui, o i
  corridoi sarebbero senza pareti. Prima la luce era un cerchio che passava
  dai muri.

## Come si vede

- **La luce sono le caselle accese**. Provato un cerchio sfumato
  disegnato sopra: «terribile», tolto. Per non fare scalini ai
  bordi ogni casella accesa ha una **forza** da 0,22 a 1 (`forzaDi`): piena nel
  cuore del cono, sfuma nell'ultimo tratto in lunghezza (`SFUMA_CONO`) e ai
  fianchi (`SFUMA_ARCO`); sotto 0,22 è ricordo. La forza va nella maschera
  del visto ([grafica-3d.md](grafica-3d.md#la-vista)), che porta pavimento e muri da mezzo
  spenti a pieni, col colore caldo davanti e freddo ai bordi.
- **Nelle celle ricordate** si disegnano porte, forzieri, scala, fonte,
  arredo e roba per terra, mai i mostri: il ricordo non si muove. Sulla mappina
  il custode della chiave è un segno fisso, sta dov'è la sua casa.

## I mostri e l'ombra

- **Un mostro si vede solo in una cella accesa adesso** (`inLuce`; sveglio o
  no, e solo allora si può toccare). Il perché: l'utente, 12 ottobre 2026,
  vedere lontano deve servire.
- **Un mostro sveglio che non è nella luce non va dritto all'eroe: cerca di
  arrivargli alle spalle** (l'utente: «i nemici fanno sneaking dietro di me; se
  riescono a colpirmi alle spalle partono loro attaccando il primo turno»).
  **Solo senza torcia**: con la torcia accesa va dritto anche lui (sotto).
  `versoLeSpalle` in `motore/corsa.js`: punta alla cella dietro l'eroe
  (`DIETRO`, mezza cella), e se sta davanti (nell'ombra di lato, o oltre la
  punta del cono) gira largo sul fianco, a `FIANCO` celle, finché sta più
  avanti di `ALLA_PAR`. Non esce dalla sua stanza: con le spalle al muro nessuno
  arriva da dietro. **Uno che è nella luce va dritto**, come sempre.
- **Restano più lenti dell'eroe** (`PASSO_MOSTRO` contro `PASSO_EROE`): chi
  guarda attorno li vede arrivare, e chi corre non li prende. Provato un passo
  più lento nell'ombra («sneaking» alla lettera): non cambia gli agguati in modo
  leggibile e peggiora le discese misurate, tolto.
- **L'agguato è già nello scontro** ([scontro.md](scontro.md#chi-parte)): vale
  per un mostro che ti raggiunge dal cono di 120° dietro il verso, lo specchio della luce. Col cono scatta da
  un mostro che esce dall'ombra alle spalle, mai da uno che si vede arrivare
  davanti. Al buio, quindi, voltarsi e mettere le spalle a un muro servono:
  è quello che l'agguato insegna (guardarsi attorno).
- **Con la torcia accesa nessuno ti prende alle spalle** (l'utente, 16 ottobre
  2026: «con la torcia accesa non dovrebbero proprio esserci agguati alle
  spalle»). La regola è netta e sta nel motore: `alleSpalle` in
  `motore/scontro.js` dice no finché `torciaAccesa` (piena o agli sgoccioli),
  e `muoviMostri` non manda nessuno a `versoLeSpalle`: un mostro sveglio va
  dritto all'eroe. **La sorpresa resta**: toccare un mostro che dorme apre lo
  scontro col primo turno dell'eroe, con la torcia o senza. Senza torcia tutto
  come prima. Il prezzo è che con la torcia l'agguato non insegna più a
  guardarsi attorno: lo insegna il buio, che arriva quando la torcia finisce.
- **La sveglia non dipende dalla luce** (`SVEGLIA`, sette celle nella sua
  stanza: [regole.md](regole.md#la-stanza-è-il-confine)), e **è più lunga del
  cono**: con la torcia si vede a ~5,4 celle, quindi un mostro in stanza si
  sveglia prima di essere visto (con la torcia nuova, ~8 celle, quasi sempre
  visto prima che si svegli: la sveglia resta quella, ed è da guardare se la
  torcia rende il gioco troppo comodo, [da-fare.md](da-fare.md)). Provato far dipendere la sveglia dalla luce:
  senza torcia il gioco diventava **più facile** (la botola da 62 a 39 risposte
  obbligate, il cavaliere a 6/10 nelle cantine da 7 a 13 vinte su 20), il buio
  premiava invece di costare. Se si volesse un mostro visto dormire, è la
  sveglia da accorciare.
- **Contare le stanze (`stanzeViste`, la torcia che brucia, le missioni) non
  dipende dalla luce**: è l'eroe a entrarci.

## La torcia si accende da sé, e finisce

- **Accenderla non è una scelta**: si accende appena presa e non entra nello
  zaino. Brucia sulla corsa (`corsa.torciaResta`), e le altre aspettano alla
  cintura (`corsa.torceInScorta`) e si accendono da sé. **La scorta non ha
  tetto**: provata la torcia per tutta la discesa, e ogni altra torcia
  diventava roba da rifiutare.
- **Dura dodici stanze** (`STANZE_TORCIA`). **L'unità è la stanza, non il
  tempo** (e nemmeno i passi dell'orologio del gioco, [orologio.md](orologio.md)): sotto una domanda l'orologio è fermo, e un conto che scorre farebbe
  pagare la luce a chi legge piano. Scendere e risvegliarsi non consumano.
  Dodici è misurato: chi tocca tutto entra in 34 stanze nel pozzo, 36 nella
  grotta, 45 nella scala sommersa, 44 nella miniera, 83 nella botola — undici o
  dodici per piano. Una torcia vale un piano.
- **Costa 5 gemme**, appena sotto la boccetta: un piano di luce è una
  comodità, non la sopravvivenza. Il prezzo è l'unica scala su cui sta tutto
  il catalogo.
- **Cosa fa vedere la torcia**: allunga il cono di luce davanti all'eroe
  (9,5 celle contro 3,2), lo apre e allarga l'alone attorno; la stanza non si
  accende tutta e dietro c'è sempre un po' d'ombra; all'ultima stanza il cono
  si accorcia (sopra).
- **Quanta ne resta si vede** nella scena (il buio che si stringe), per esteso
  nella pagina dell'eroe e nello zaino, sopra e sotto («ancora 7 stanze, e 1
  alla cintura»; sopra «3 torce alla cintura: scendendo se ne accende una»;
  senza nessuna, solo nella pagina dell'eroe, «nessuna torcia: la guaritrice
  le vende»), e agli sgoccioli, solo senza scorta, una riga in mezzo al campo
  («Torcia sta per finire: ancora due stanze»). Senza, il buio arriverebbe
  come un guasto. La riga è una sola, `viste/RigaTorcia.vue`, coi numeri di
  `torceDi` in `Gioco.vue`. Nella pagina dell'eroe l'ha cercata l'utente (31
  ottobre: «dove si vedono le torce? dovrebbero essere visibili nel
  profilo»). Nella barra in basso non c'è: la casella delle torce l'ha tolta
  lui ([barra.md](barra.md)).
- **I pezzi ⏳ allungano la torcia**: una torcia nuova dura le sue dodici
  stanze più quelle dei pezzi (`stanzeTorcia`).
- Una sosta vecchia con `torcia: true` si riprende con una torcia piena.
- **Comprata sopra aspetta alla cintura**, e scendendo se ne accende una:
  sopra non c'è buio da rischiarare. **Al buio con la cintura piena se ne
  accende una sempre** (`accendiDallaCintura` in `motore/corsa.js`):
  scendendo da capo, tornando dal portale o riprendendo la sosta
  (`motore/sosta.js`), entrando in una stanza. Senza, chi saliva al buio dal
  portale e comprava torce tornava giù al buio (l'utente, 31 ottobre).
- **Se ne trovano** (oltre a comprarle) poche: da un forziere, da un mostro, da
  una curiosità. Quante, e la regola proposta per trovarne di più: [sotto](#quante-se-ne-trovano).

Nei test: `unita/sotterraneo-sosta` (§ 10: le diciotto torce comprate che
tornando dal portale si accendono, la stanza al buio che ne accende una),
`integrazione/sotterraneo-torce` (col dito: la pagina dell'eroe senza torce,
tre comprate dalla guaritrice, la pagina e lo zaino di sopra che le contano
alla cintura, il gemello che riporta giù con una accesa in mano e il cono
lungo, la pagina e lo zaino di giù); `[data-torcia-eroe]` nella pagina
dell'eroe e `[data-torcia-zaino]` nello zaino, con `data-torce` (quante in
tutto), `data-resta` (le stanze di quella accesa, 0 se spenta) e
`data-scorta` (quelle alla cintura).

## La torcia in scena

- **Quello che si vede lo decide il motore**: la maschera è `forzaLuce`, e
  con la torcia il cono è più lungo e più aperto e l'alone copre le spalle
  (sopra). Il disegno lo segue, non lo allarga da sé.
- **Con la torcia accesa la luce dell'eroe cambia, al buio resta quella di
  prima** (`luci.torcia(…, accesa)`, `LUCE.torcia` in `costanti.js`): alone e
  cono più forti e più lunghi, il cono più aperto e più morbido, le ombre più
  nette, il colore più caldo, un tremolio più vivo e una luce che rimbalza dal
  pavimento davanti (`rimbalzo`, senza ombre). Agli sgoccioli vale 0,6 della
  torcia piena, e si passa da uno stato all'altro in un terzo di secondo.
- **La torcia si vede in mano**: il modello della torcia (`roba3d/pozioni.js`, nella versione semplice:
  `creaTorciaInMano` in `scena3d/roba-per-terra.js`), nella mano libera del modello dell'eroe e **fuori dalla sagoma** (dentro, il corpo
  la copre: provato), con una fiamma come quelle dei muri (`creaFiamme`, una
  sola, che si sposta con `sposta`), le faville e un chiarore caldo per terra.
- Provato con più forza (alone ×1,8, rimbalzo 5): il pavimento attorno
  all'eroe si bruciava d'arancio e la fiamma in mano spariva; tenuto ×1,35.
- Gli scatti: `#torcia=accesa|sgoccioli|spenta` e `#verso=sx` (si gira).

## Misurato

- Il banco gioca a torcia spenta e non si volta mai: va dritto, e i mostri nel
  buio gli arrivano alle spalle. `npm run sotterraneo -- --torce 40` lo fa
  scendere sempre con la torcia accesa, e la riga «agguati» dice quanti scontri
  cominciano alle spalle. Al 16 ottobre, con dieci semi: a torcia spenta l'1%
  (prima e dopo la torcia nuova), a torcia accesa dal 2% allo 0%; le discese
  vinte non si muovono oltre il caso (a 8/10 la media 21% → 21% senza torcia,
  19% → 18% con). I giocatori tipo invece la sentono: il curioso col cavaliere
  (`unita/sotterraneo-roba`, sei storie) a 9/10 da 6·6·6·5·6·5·5 a tutte sei, a
  4/10 nel fondo da 2 a 4 vittorie su 6 (il bersaglio vuole al più 3:
  [da-fare.md](da-fare.md)). I numeri dei bersagli di
  `unita/sotterraneo` e `unita/sotterraneo-roba` sono in
  [scontro-bilancio.md](scontro-bilancio.md#la-luce-a-cono-e-gli-agguati).
- La torcia costa 5 gemme a piano (la guaritrice ne ha sempre), contro 6–16
  gemme a piano che esce il giro minimo: la comodità adesso pesa.

## Quante se ne trovano

**Oggi quasi nessuna.** Senza comprarne, chi gira tutto ne trova 0,2 a discesa e chi va dritto nessuna (`npm run sotterraneo --
--luce`: roba e livello attesi, senza torce in tasca, 40 partite a discesa a 8/10, le sei discese dopo la cripta): il forziere che
dà una torcia invece di una pozione, i pipistrelli e i fantasmi (`lascia`) quando un mostro lascia da bere (uno di strada su venti),
le curiosità. Al buio sono 81–100% delle stanze di chi gira (media 93%) e tutte quelle di chi va dritto. Nella cripta i mostri
lasciano da bere uno su due, e chi gira ne trova una.

**La regola proposta, non applicata.** L'utente, 31 ottobre: «ha senso che uno le trovi e non che si debba ricordare ogni volta di
comprarne una valanga, che ci siano momenti di buio e che tu capisca che puoi comprarle». La proposta: una torcia in più da tre
forzieri su dieci, da un mostro di strada su trenta, da un caporale su dieci, mai dal grosso, con un tiro dal seme come l'elisir
(`torciaCade` accanto a `ampollaCade` in `motore/bottino.js`, chiamato dove muore un mostro e dove si apre un forziere; sul prato
di sopra no). Misurata:

| | torce a discesa, oggi → con la regola | stanze al buio, oggi → con la regola |
|---|---|---|
| chi gira tutto | 0–0,7 (media 0,2) → 0,5–1,8 (media 1) | 81–100% (media 93%) → 44–82% (media 67%) |
| chi va dritto | 0 → 0,1–0,5 (media 0,2) | 100% → 87–99% (media 94%) |

Le torce che avanzano uscendo (0,3–0,9 a discesa per chi gira) scenderebbero alla discesa dopo. La taratura (`npm run taratura`,
oggi con `--tara torcia.mostro=0,torcia.caporale=0,torcia.forziere=0`) non si muove oltre il caso: il curioso sviene per vincerla
0,2·1,2·1,2·1,6·1·1,4·1 → 0,2·1,2·1·1,6·0,9·1,5·0,6. Con quaranta torce in tasca il curioso sviene meno (dodici storie del
cavaliere nelle sale allagate: 13 svenimenti contro 16): la luce non rende il gioco più duro.

**Perché è ferma**: `misure/sotterraneo` sta già ai margini (zone al 24 a 9/10 54% su un minimo di 50, l'eroe del 15 a 9/10 60% su
un massimo di 60) e ogni cambio del caso delle storie ne fa cadere uno: con la regola le zone al 24 a 49% e il mago nella porta
dell'inferno 12/20 (ne vuole 13); con altri sali o altre quote l'eroe del 15 al 63%, l'eroe del 20 a 6/10 al 48%, o le sei storie
del cavaliere nelle sale allagate a 3 o 4 su 6. Le differenze vengono dalla roba con cui il curioso esce dalla storia, non dalla luce.
Da decidere: allargare quei bersagli di qualche punto (sono misure arrotondate al 5%, e il caso ne vale altrettanto) e accendere la
regola.

Nei test: `unita/sotterraneo-piani` (§ 11 e 12: un relitto fa ombra come un muro, l'acqua no),
`unita/sotterraneo-luce` (il cono davanti e l'ombra dietro con e
senza torcia, i fianchi pieni e le spalle coperte con la torcia, sessanta mostri
da dietro e di lato che con la torcia, piena o agli sgoccioli, non fanno mai
agguato né giro largo e al buio sì, la sorpresa che resta, la stanza che non si accende tutta, la sfumatura, la porta che
ferma la luce, il verso che segue il passo, il mostro fuori luce che punta
alle spalle e quello in luce che va dritto, l'agguato da dietro e non da
davanti), `unita/sotterraneo` (§ «la torcia conta»: la torcia che allunga il
cono, la sveglia dei mostri, gli sgoccioli), `integrazione/sotterraneo-luce`
(i pixel accesi della tela con, senza e agli sgoccioli, e la luce che segue il
verso; `--scatti` lascia le foto `sotterraneo-luce-con`, `-senza`,
`-sgoccioli`, `-con-voltato`).
