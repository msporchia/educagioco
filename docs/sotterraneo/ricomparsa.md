# I mostri tornano

15 ottobre 2026, deciso dall'utente. Chi gioca cinque minuti, spegne e riprende il giorno dopo ritrova il piano com'era; ma dentro il
dungeon il tempo scorre e ogni tanto qualche mostro morto torna, per insegnare a farmare senza dover rifare ogni volta il dungeon
nella stessa sequenza. Farmare dà vantaggi ma costa più operazioni: va bene così. Il codice: `motore/ricomparsa.js`,
`dati/mondo.js` (`RICOMPARSA_BASE`), `motore/corsa.js` (`cade`, `muoviEroe`, `entraNelPiano`), `motore/sosta.js`.

## Le regole

- **Il tempo sono i passi** (`Corsa.passi`, [orologio.md](orologio.md)): scorrono solo camminando e nei turni dello scontro; fermo, in pausa,
  sotto una domanda, con la ✕ e col rientro non ne passano. Contano anche mentre si è su altri piani della stessa discesa.
- **Alla morte** di un mostro che può tornare gli si prenota il ritorno: `torna = passi + RICOMPARSA_BASE · (1 + r)`, con r in [0, 1), cioè da
  una a due volte la base. r è un hash di seme, piano, indice del mostro e quante volte è già caduto (`tiroDalSeme`): niente `Math.random`,
  così non tornano tutti insieme né nell'ordine in cui sono morti, e le misure danno sempre lo stesso risultato.
- **La manopola è una sola**: `RICOMPARSA_BASE` in `dati/mondo.js`, **200 passi**. Un piano girato tutto sono ~160 passi al banco, un bambino
  ne fa forse il doppio. **È da provare giocando.**
- **Sopra, nel mondo aperto**, la base è 400 (`SOPRA.ricomparsa`) e un giro nuovo li fa tornare tutti: [mondo-aperto-mostri.md](mondo-aperto-mostri.md).
- **Quando torna**: a ogni passo camminato e rientrando in un piano (ripresa dalla sosta, portale, scala che sale o che scende) si guardano i
  morti il cui `torna` è passato (`faiTornareIMostri`). Torna solo se il suo posto non è nella stanza dove sta l'eroe e non è in luce; se no
  aspetta il controllo dopo. Rientrando, gli scaduti tornano subito (salvo la stanza d'arrivo).
- **Torna come uno nuovo**, al posto in cui è nato (da `robeDelSeme`, quindi dove il generatore lo aveva già messo, fuori dai posti
  vietati: ingresso, scala, portale), con la vita piena, né ferito né inseguitore. Il premio è quello di uno nuovo (esperienza, gemme, bottino):
  niente tetti né rendimenti decrescenti.

## Chi non torna

Si riconosce dal piano appena nato (`puoTornare`): **chi ha un ruolo** (`chiave`: il guardiano della scala; `grosso`; `caporale`;
`missione`: il bersaglio) e **i branchi che hanno un capo** (gli scagnozzi del grosso e i caporali dell'anticamera hanno lo stesso
`branco`); **chi è nato dopo il piano** (un bersaglio, un mostro messo dalle missioni: non è nel `robeDelSeme`). I forzieri e la roba per
terra non sono mostri, quindi non entrano nel conto. I mostri delle stanze del tesoro e gli appostati tornano come gli altri.

## La sosta

`torna` e `morti` stanno sul mostro, quindi nei campi cambiati del piano (`cambiDelPiano`, per indice) e in `dietro`: nessun campo nuovo
nella sosta e **`VERSIONE` non sale**. Una sosta di prima non ha quei campi: i suoi morti restano **morti da sempre** (la scelta
prudente: tornare tutti insieme alla prima ripresa sarebbe una sorpresa; non tornare è solo come era). I morti di un'avventura nuova
cominciano a tornare dal loro prossimo cadere.

## Il banco

Il banco (`motore/banco.js`) la tiene **spenta** (`ricomparsa: false`): misura l'equilibrio di un passaggio solo, e un giocatore finto che
cammina 160 passi per piano farebbe tornare mostri e cambiare tutti i numeri della taratura. `Corsa` ha l'opzione `ricomparsa` (acceso
di difetto: il gioco vero).

## Da proporre

Nessun segnale: né un suono né un cartello né un'animazione quando un mostro torna, perché non è stato chiesto. Un bambino che ritrova un
mostro nella stanza dove l'aveva battuto potrebbe restarne sorpreso: se serve, un cenno (la prima volta) è una proposta, non fatta.

Nei test: `unita/sotterraneo-ricomparsa` (il ritardo fra BASE e 2·BASE e diverso da un mostro all'altro, chi ha un ruolo non torna, non nella
stanza dell'eroe né in luce, la sosta riletta, una sosta di prima, il rientro in un piano, il banco spento).
