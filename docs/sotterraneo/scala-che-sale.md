# La scala che sale

Si risale da dove si è comparsi (l'utente, giocando, 8 ottobre). In ogni piano
di una discesa, nel punto esatto dove l'eroe compare arrivando dal piano di
sopra, c'è una scala che sale; prenderla riporta al piano di sopra, **accanto
alla scala che scende** da cui si era venuti. Le regole della discesa sono in
[regole.md](regole.md); come si lascia una discesa a metà (portale, ✕,
«lascio perdere») in [portale-e-sosta.md](portale-e-sosta.md). Il codice:
`faiIlPiano`, `scendi`, `sali`, `lasciaIlPiano`, `entraNelPiano` in
`motore/corsa.js`; `dietro` e `fondo` in `motore/sosta.js`;
`scena/scala-su.js` (il disegno); il foglio in `Gioco.vue`.

## Dov'è, e come si tocca

- **Sta nel centro della stanza d'ingresso**, dove l'eroe nasce: la mette
  `Corsa.faiIlPiano` *dopo* aver generato il piano, come ultima cosa
  (`che: 'scala-su'`), così il caso del seme non si sposta e il banco misura gli
  stessi piani di prima. Una gemma finita su quella cella si toglie. Non è una
  cosa del generatore (`Livello`): quello non sa che esiste.
- **Nel primo piano dell'abisso non c'è**: là la strada su è il portale, e
  «lascio perdere» non esiste ([abisso.md](abisso.md)). Dal secondo piano
  dell'abisso sì.
- **Si tocca solo sulla sua cella** (`cosaC` la salta nella ricerca «vicino»):
  l'eroe ci nasce sopra, e un tocco a un passo da lui, per camminare, non deve
  aprirla.
- **Si disegna in codice** (`scena/scala-su.js`, come il portale): un'apertura
  nella pietra coi gradini che salgono e si stringono, chiari perché da su viene
  la luce, una freccia in su che sobbalza sopra la cornice, un chiarore che
  pulsa. Colori di nessuno scenario: la scala che scende è buia e a gradini che
  spariscono, questa è chiara, e si legge a colpo d'occhio. Sulla mappina non
  c'è (la mappina dice solo dove sei, la scala, chi ha la chiave).

## Dove si compare

- **Scendendo**, sulla scala che sale. Anche dopo uno svenimento (si ricompare
  nel centro dell'ingresso, `rimettiInPiedi`).
- **Risalendo**, accanto alla scala che scende: prima la cella sotto, poi
  di lato, poi sopra (dov'era il guardiano), poi la prima libera nel raggio di
  tre (`compariAccantoAllaScala`). Mai all'inizio del piano: il bambino ha
  fatto la strada fin lì e non la rifà.
- **Dal primo piano** la scala porta fuori, ma **col foglio di «lascio
  perdere»** (`foglio.fuori`, `viste/LascioPerdere.vue`, stesse parole): è
  l'unica strada su senza portale ([portale-e-sosta.md](portale-e-sosta.md)).
  Non è una scorciatoia per fare le spese: la discesa ricomincia da capo la
  prossima volta, e il motore non sa uscire da sé (`sali()` dal primo piano non fa
  niente, è `Gioco.vue` che chiede e poi chiama `risali()`).

## Il piano di sopra com'era

- **I piani lasciati restano come sono** (`Corsa.piani`, per numero): mostri
  battuti, cose prese, porte aperte, forzieri aperti, mappa girata, e se la
  scala era aperta (la chiave è *per piano*: un piano lasciato prima di
  prenderla la richiede ancora). Rientrando, i mostri non sono svegli e hanno
  tre secondi di `CALMA`: nessuno ti aspetta alla scala.
- **Risalire e riscendere non si paga e non rende.** La vita del piano
  (`VITA_PER_PIANO`), il riposo della scala, il conto dei piani fatti e il
  rinnovo degli svenimenti dell'abisso valgono solo la prima volta che si tocca
  un piano più giù di tutti (`Corsa.fondo`, il più profondo toccato). Se no su e
  giù sarebbe una pozione senza fine.
- **Una missione presa mentre si è giù** trova il suo posto anche in un piano
  già lasciato (`posaLeMissioni` a ogni ingresso, senza raddoppiarla).

## La sosta

- La sosta salva il piano di adesso intero come prima (il seme e i
  cambiamenti) e **i piani alle spalle** in `dietro`: per ognuno il numero, i
  cambiamenti (`cambiDelPiano`), la mappa girata a tratti, la scala aperta o no.
  `fondo` è il più profondo toccato. `VERSIONE` è a 5: il piano ha una cosa in
  più, e una sosta di prima non si leggerebbe uguale.
- **Al più otto piani alle spalle** (`PIANI_ALLE_SPALLE`, i più vicini): le
  sette discese stanno tutte (al più quattro dietro), l'abisso no. Misurato: l'abisso
  al piano 21 con otto alle spalle pesa 4 KB (venti piani interi sarebbero più del
  doppio); una discesa di tre piani, qualche centinaio di byte. Un piano più su di
  quelli ricordati si rifà dal seme, intatto e con la scala che scende già aperta
  (ci si è scesi): è la parte che l'abisso paga per non gonfiare il profilo.
- **Una sosta senza `dietro`** (o con un piano che non nasce più uguale) vale
  «nessun piano alle spalle»: si legge lo stesso, e salendo il piano si rifà.
- Il disegno dell'abisso in [abisso-progetto.md](abisso-progetto.md) (punto 4)
  voleva i mostri di nuovo al loro posto salendo e i forzieri no: l'utente ha
  chiesto che il piano resti com'è, per tutte le discese, e così è.

## Il bersaglio di una missione

Lo vedi dall'altra parte: il mostro col nome o il forziere che una missione
cerca non sta all'ingresso, si distingue da lontano e porta il nome. Le regole
(dove sta, com'è disegnato) sono in [missioni-bersaglio.md](missioni-bersaglio.md).

Nei test: `unita/sotterraneo-scala-su` (una scala che sale in ogni piano delle
sette discese, nel punto d'arrivo; si risale accanto alla scala che scende col
piano com'era; niente vita regalata risalendo; dal primo piano è un'uscita che
non esce da sé; la sosta coi piani alle spalle, il peso, i piani oltre il tetto;
i bersagli delle dodici missioni nella stanza più lontana),
`integrazione/sotterraneo-scale` (col dito: si compare sulla scala, il foglio
`[data-azione="sali"]` («risalgo al piano N», «resto qui» = `[data-azione="dopo"]`),
si ricompare accanto alla scala che scende, il mostro battuto resta battuto nella
sosta, si riscende; dal primo piano `[data-lascio-perdere]` con `scorda-no` e
`scorda-si`; il bersaglio ha il suo rosa sulla tela). La tela dice `data-eroe`,
`data-eroe-schermo` e `data-scala` per toccare una cella.
