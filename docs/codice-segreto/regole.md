# Le regole

## Gli scaglioni

Quattro leve in `dati/difficolta.js`: `caselle` (lunghezza del codice),
`simboli` (quanti disegni sono in gioco), `prove` (righe del tabellone),
`ripetizioni` (se un disegno può tornare). Lo spazio di ricerca
(`simboli^caselle`, o le disposizioni semplici senza doppioni) cresce da
24 a più di 16.000 lungo i quattro scaglioni.

`ripetizioni: false` nel primo scaglione è la leva più gentile: senza
doppioni «l'ho già visto qui, quindi là non c'è» regge sempre, ed è il
ragionamento che il bambino scopre da solo. Col doppione acceso quel
ragionamento salta, ed è lì che il gioco comincia a chiedere davvero.

**Le prove sono tarate su un giocatore che ragiona il 40% delle volte**,
non il 55%: misurato guardando giocare dei bambini veri, a 0,55 si
perdeva troppo spesso e una partita persa dopo aver ragionato si legge
come sfortuna, non come errore. Il bersaglio è una partita persa su venti
nel giorno peggiore del bambino. Il tetto non sale oltre quello, per non
appiattire lo scaglione sul successivo. Uno scaglione nuovo si tara
misurando con `motore/banco.js`, non a occhio: `guastiDegliScaglioni`
pretende che le prove non calino quando lo spazio cresce, e il test di
unità gioca sia a 0,55 sia a 0,4.

**Le soglie delle stelle (`perfetto`, `bene`) sono un numero di prove
assoluto, non una frazione del tabellone.** Legarle al tetto (es. «entro
metà tabellone») le accoppia in modo perverso: allungare le prove
concesse sposterebbe anche l'asticella delle stelle. Il tetto dice quando
si perde, le soglie dicono quanto si è stati bravi: due conti separati.

## I temi

Un tema (`dati/temi.js`) è otto disegni più un colore: il gioco non
cambia, cambia chi ci sta dentro. Un disegno nuovo deve distinguersi in
una casella piccola, essere un oggetto intero (non un dettaglio) e stare
su ogni telefono (niente emoji troppo recenti). Otto per tema perché lo
scaglione più duro ne chiede sette, uno di scorta.

## Il conteggio dei pallini

`motore/indizi.js`: prima si contano i pieni (giusti al posto giusto) e
si tolgono di mezzo, poi i vuoti si cercano solo fra quello che resta,
consumando ogni disegno una volta sola. È il punto in cui questo tipo di
gioco si sbaglia più spesso — un doppione nel tentativo non deve contare
due volte se nel codice il disegno è uno solo.
