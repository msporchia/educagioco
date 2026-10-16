# La luce, la torcia e la mappina

Nero = mai stato. Scuro e freddo = ricordato. Pieno e caldo = lo stai
guardando. Un sotterraneo tutto illuminato è una piantina, e su una piantina
non c'è niente da esplorare. La piantina c'è — la **mappina** in alto a
destra — e mostra solo il visto più tre punti: dove sei, la scala, chi ha la
chiave. La 🗺️ della barra in basso la apre grande ([barra.md](barra.md)).

Il codice: `aggiornaLuce` in `motore/corsa.js`, le misure in `dati/mondo.js`,
il disegno in `scena/tela.js`.

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

- **La luce sono le caselle accese**, come sempre. Provato un cerchio sfumato
  disegnato sopra (`Tela.buio`): «terribile», tolto. Per non fare scalini ai
  bordi ogni casella accesa ha una **forza** da 0,22 a 1 (`forzaDi`): piena nel
  cuore del cono, sfuma nell'ultimo tratto in lunghezza (`SFUMA_CONO`) e ai
  fianchi (`SFUMA_ARCO`); sotto 0,22 è ricordo.
- In `scena/tela.js` la forza porta il pavimento da mezzo spento a pieno, e il
  velo del ricordo si alleggerisce di conseguenza; sopra le caselle accese
  un velo d'ambra (più forte con la torcia) rende la luce calda davanti e fredda
  ai bordi. **I veli si posano a gradini di un quarto, ognuno in un tracciato
  solo**: due rettangoli che si sovrappongono lasciano la riga della giunzione
  più scura (provato).
- **Un oggetto non diventa trasparente, diventa scuro.** Il pavimento e i muri
  si spengono con la trasparenza sul nero, ma un oggetto posato sul pavimento
  (roba, arredo, relitti, scale, portale, mostri) è sempre opaco: la luce che
  manca lo scurisce con la sua sagoma nera (`scuro`, `grafica/atlante.js`),
  se no il pavimento traspare e gli oggetti nel ricordo sono fantasmi
  (l'utente, 14 ottobre 2026). → [grafica.md](../core/grafica.md#un-oggetto-non-è-trasparente)
- **Nelle celle ricordate** la tela disegna porte, forzieri, scala, fonte,
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
- La torcia costa 5 gemme a piano (l'erborista ne ha sempre, i pipistrelli e i
  fantasmi ne lasciano una ogni dieci morti circa), contro 6–16 gemme a piano
  che esce il giro minimo: la comodità adesso pesa.

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
