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
  Il cono guarda dove guarda l'eroe, apertura 120° (`APERTURA_CONO`); l'alone
  è un cerchio piccolo attorno; **tutto il resto è ombra**, sempre.
- **La torcia allunga il cono, non accende la stanza.** Prima con la torcia la
  stanza si accendeva tutta e serviva solo nei corridoi, cioè non contava. Ora
  la stanza non si accende mai tutta: la torcia fa vedere più lontano davanti,
  e chi la porta deve voltarsi per guardare.

  | | cono | alone | si vede davvero fino a |
  |---|---|---|---|
  | senza torcia | `RAGGIO` 3,2 | `ALONE` 1,5 (la cella dietro è un'ombra appena schiarita) | ~2,8 celle |
  | agli sgoccioli | `RAGGIO_SGOCCIOLI` 4,4 | `ALONE_SGOCCIOLI` 1,8 | ~3,9 celle |
  | torcia piena | `RAGGIO_TORCIA` 6,2 | `ALONE_TORCIA` 2,2 (le celle attorno, piene) | ~5,4 celle |

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
  davanti. Per questo vedere in anticipo (la torcia) e non farsi accerchiare
  (voltarsi, mettere le spalle a un muro) servono.
- **La sveglia non dipende dalla luce** (`SVEGLIA`, sette celle nella sua
  stanza: [regole.md](regole.md#la-stanza-è-il-confine)), e **è più lunga del
  cono**: con la torcia si vede a ~5,4 celle, quindi un mostro in stanza si
  sveglia prima di essere visto. Provato far dipendere la sveglia dalla luce:
  senza torcia il gioco diventava **più facile** (la botola da 62 a 39 risposte
  obbligate, il cavaliere a 6/10 nelle cantine da 7 a 13 vinte su 20), il buio
  premiava invece di costare. Se si volesse un mostro visto dormire, è la
  sveglia da accorciare.
- **Contare le stanze (`stanzeViste`, la torcia che brucia, le missioni) non
  dipende dalla luce**: è l'eroe a entrarci.

## Misurato

- Il banco gioca a torcia spenta e non si volta mai: va dritto, e i mostri nel
  buio gli arrivano alle spalle. Gli agguati sono circa un quarto degli
  scontri (da ~10% con i mostri che vanno dritti). I numeri dei bersagli di
  `unita/sotterraneo` e `unita/sotterraneo-roba` sono in
  [scontro-bilancio.md](scontro-bilancio.md#la-luce-a-cono-e-gli-agguati).
- La torcia costa 5 gemme a piano (l'erborista ne ha sempre, i pipistrelli e i
  fantasmi ne lasciano una ogni dieci morti circa), contro 6–16 gemme a piano
  che esce il giro minimo: la comodità adesso pesa.

Nei test: `unita/sotterraneo-piani` (§ 11 e 12: un relitto fa ombra come un muro, l'acqua no),
`unita/sotterraneo-luce` (il cono davanti e l'ombra dietro con e
senza torcia, la stanza che non si accende tutta, la sfumatura, la porta che
ferma la luce, il verso che segue il passo, il mostro fuori luce che punta
alle spalle e quello in luce che va dritto, l'agguato da dietro e non da
davanti), `unita/sotterraneo` (§ «la torcia conta»: la torcia che allunga il
cono, la sveglia dei mostri, gli sgoccioli), `integrazione/sotterraneo-luce`
(i pixel accesi della tela con, senza e agli sgoccioli, e la luce che segue il
verso; `--scatti` lascia le foto `sotterraneo-luce-con`, `-senza`,
`-sgoccioli`, `-con-voltato`).
