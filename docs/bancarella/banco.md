# Il banco tuo

L'incasso non sparisce a fine giornata: resta in cassa e si spende. Sono gli
euro del gioco, non le 🪙: le monete del salvadanaio si prendono come sempre,
una per cliente servito ([regole.md](regole.md#quanto-rende-e-cosa-si-segna)).
Dati e regole in `src/data/bancarella-banco.js`, la schermata in
`src/components/bancarella/IlMioBanco.vue`, il disegno in `disegnaMioBanco`
(`src/grafica/bancarella-mondo.js`).

## La cassa

- **Ogni cliente servito mette in cassa la sua spesa**, subito. Anche il tasto
  salta dei grandi, che serve a simulare l'economia.
- **Sta in `profile.campagne.bancarella.banco`**: `{ cassa, tenda, carretto,
  merce }`, in centesimi. Non è un campo nuovo del profilo.
- **Chi giocava prima trova in cassa quello che ha già incassato**
  (`totals.incasso`), una volta sola: niente va perso, e ha subito cosa comprare.
- **La cassa non scende mai sotto zero e non si perde mai**: nessuno sbaglio
  toglie euro.

## Cosa si compra

| scala | gradini | cosa fa |
|---|---|---|
| **la tenda** (`TENDE`) | telo, righe, grande, frangia, d'oro | +4 secondi di pazienza a gradino, fino a +16 |
| **il carretto** (`CARRETTI`) | carretto, grande, bancarella, chiosco, bottega | una cesta in più a gradino, da 4 a 8 |
| **la merce** (`MERCE_NUOVA`) | ventitré prodotti, banco per banco | entra fra quelli che possono finire sul banco |

- **La tenda si vede in gioco** e il carretto nella piazza, dove è il segnalino.
- **Il prezzo della merce** è sei volte il suo cartellino, a scatti di 5 €, mai
  sotto 10 € (`prezzoMerce`): chi rende di più costa di più.
- **Quanto costa tutto**: circa 1100 €, contro i 750-900 che rende la fila a
  una passata. Il resto viene rigiocando per le stelle e dal Cairo.
- **La prima giornata basta per comprare qualcosa** (rende una trentina di euro,
  il primo gradino della tenda ne costa 15): il gioco si capisce subito.
- **Il tasto del banco** sta in basso a sinistra sul mondo e sulla piazza, con la
  cassa; il pallino rosso dice che qualcosa si può comprare. C'è anche a fine
  giornata. Non passa da `Personalizza.vue`: qui non si veste niente, si sale una scala.

## Si comincia con poca merce

- **Quattro ceste e otto prodotti per banco** (`MERCE_BASE`): quattro in euro
  tondi, perché le prime giornate sommano a mente, e uno per ogni passo fine.
- **Chi non compra niente finisce il gioco**: lo prova `unita/bancarella-banco`,
  giornata per giornata, col banco di partenza.
- **Sul banco vanno prima i cartellini del passo della giornata**
  (`esposizione`): con quattro ceste pescate a caso una giornata dei centesimi
  poteva restare tutta in euro tondi.

## I soldi si guardano

Il cliente **mostra i pezzi e non dice la cifra**: né il fumetto né la cassa
scrivono quanto ha dato, e dove il resto lo conta il bambino i soldi si contano.

- **Quanti pezzi** (`manciata`, `pezziInMano`): fino a tre con gli euro tondi,
  quattro coi mezzi euro, cinque coi centesimi. Non è una leva: è una conseguenza
  di `passo`, come `pezzi`.
- **Dove la giornata dichiara la banconota** («paga con 20 €») è quella, intera.

## Tutte quelle che riesce

«Ho questi: tutte quelle che riesce.» Il cliente mostra i soldi e una cesta; il
bambino la tocca tante volte quante ci stanno, conferma col ✓ e dà il resto.

- **Conti base** (`clienteRiesce`): prezzo alle decine di centesimi, da due a
  cinque pezzi, soldi da 2, 3, 5 o 10 €, e un resto mai nullo. Niente
  moltiplicazioni vere: si può arrivarci sommando.
- **Si sbaglia come col resto**: «Non mi bastano i soldi!» o «Me ne stanno
  ancora!», tre secondi di pazienza, un intoppo per le stelle, e mai la cifra.
- **Quando**: la giornata «Tutte quelle che riesce» (`riesce` 0,3, e il primo
  cliente è sempre uno di loro) e il Cairo (0,2). La cassa rotta non li ha: quando
  entra un conto nuovo le altre leve tornano indietro.
- **Più tempo**: 15 secondi in più, e paga come la cassa rotta (🪙4).

## Lo scontrino

Finché il totale è da battere lo scontrino dice il prezzo di un pezzo solo
(`×2 5,00 €`): prima scriveva già il prodotto, e la moltiplicazione la faceva lui.

## Il mercato senza fine

Il Cairo si apre a fila finita. Un mercato chiuso segna i clienti serviti come
primato ([../core/primati.md](../core/primati.md), `senzaFine` nella riga di
`data/giochi.js`): il cartello di fine dice com'è andata e il fumetto del Cairo
dice il record.

## Nei test

`unita/bancarella-banco`, `integrazione/bancarella-banco`. Bersagli:
`[data-azione="il-banco"]`, `[data-in-cassa]`, `[data-si-compra]`,
`[data-mio-banco]`, `[data-scala]`, `[data-compra="tenda|carretto|merce"]`,
`[data-scheda]`, `[data-merce]` (`data-mia`), `[data-da-comprare]`, `[data-tenda]`,
`[data-porge]`, `[data-riesce]`, `[data-azione="basta"]`,
`[data-azione="una-di-meno"]`, `[data-primato]`, `[data-record]`.
