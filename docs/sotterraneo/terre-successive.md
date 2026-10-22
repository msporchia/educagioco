# Le terre successive

Nel Sotterraneo 3D, ripulite **le tombe del vento** (il boss della terra, in fondo alla landa vecchia), in fondo alla strada si
apre **la porta delle terre**: passarla porta al villaggio di un'altra terra, **la stessa mappa coi mostri più forti** e una tinta
sua. Il progetto è in [mondo-a-percorso.md](mondo-a-percorso.md#le-terre-successive) (compito E di
[mondo-a-percorso-lavori.md](mondo-a-percorso-lavori.md)); qui com'è fatto. Codice: `motore/terre.js`.

## Le regole

- **La porta si apre** quando nella terra dove si è le tombe sono state ripulite (`mondo.dungeon.tombe.rifatti > 0`, scritto da
  `dopoLaDiscesa` come per ogni dungeon). Ogni terra ha le sue tombe: ripulite nella prima non aprono la porta della seconda.
- **Fino a cinque terre** (`MONDO_PERCORSO.terre`): nella quinta la porta resta chiusa anche a tombe ripulite, e il fumetto dice
  che oltre non c'è un'altra terra. Scelta di questo lavoro: il tetto c'era già nel generatore, e una sesta terra vorrebbe una
  sesta tinta e livelli oltre il 71 che nessuno ha misurato.
- **La stessa mappa**: `ilMondo({ terra })` genera lo stesso scheletro (stessa firma) con le fasce delle zone e i livelli dei
  dungeon **più su di 14 a terra** (`salto`): la zona 1 della seconda comincia al 15. Nessun numero nuovo: sono quelli del
  generatore, da tarare dopo col banco (`--terra 2`).
- **L'eroe viene intero**: livello, punti, abilità, roba addosso e nello zaino, gemme, pozioni stanno nell'avventura e non nel mondo.
- **Il mondo ricomincia**: nebbia, pietre accese, giro, taglie della bacheca (`mondo.quest`), dungeon ripuliti, mostri morti, chi ha
  già parlato. Il minatore nelle terre dopo non si ripresenta (lo si conosce).
- **Le missioni dei personaggi restano dell'eroe** (in `missioni` dell'avventura, come nel 2D): chiedono la chiave del dungeon, che c'è
  in ogni terra, quindi si fanno dove si è. Scelta di questo lavoro: il progetto le voleva da capo, ma tenerle per terra voleva dire
  spostarle dal campo che il 2D legge.
- **La storia sta nella prima terra**: nelle dopo le sette porte sono aperte, ripetute dal primo giro (`dungeonDellAvventura` con
  `terra > 1` non è mai la storia), nessuna è «adesso», e vincerle non dà stelle né capitoli.
- **Arrivando** si parte dalla piazza del villaggio nuovo, e la riga in basso dice il nome della terra e del villaggio
  («La terra d'autunno: Borgo d'autunno.»).
- **Il minatore e il capitano annunciano la porta aperta**, per prima cosa, una volta ciascuno (`novita.porta` del mondo; le frasi
  in `dati/dialoghi.js`, `terre`).
- **Il minatore racconta i volti nuovi**: nelle terre dopo la prima le discese hanno un altro nome e un altro boss
  (`voltoDelDungeon` ruota di uno a terra). La prima volta che gli si parla in una terra (invece della presentazione) dice che le
  discese hanno un'altra faccia e racconta quelle della zona per l'eroe (`zonaPerTe`): l'annuncio e «nome: dove»; a «Cosa c'è
  laggiù?» le stesse più le tombe del vento, e che batterle apre la porta (non nella quinta). Codice: `voltiDellaTerra` in
  `motore/dialoghi.js`; il volto è quello del dungeon del gioco (`ctx.dungeon`, con le volte già ripulite), se manca il primo della terra.

## Il viaggio indietro

- **La pietra del villaggio** riporta ai villaggi delle terre già viste: nel suo fumetto, sotto le pietre accese, un tasto per ogni
  altra terra raggiunta («Il villaggio, la terra di casa»), da qualunque terra (anche in avanti, fino all'ultima vista). La pietra si
  accende con la sua domanda come in ogni terra: nella terra nuova è spenta, e per tornare indietro la si accende.
- **Si torna solo nelle terre già raggiunte** (`terreViste`): avanti oltre l'ultima si va solo dalla porta aperta.
- **Si arriva nella piazza**, sia dalla pietra sia dalla porta verso una terra già vista: `passaTerra` scrive nel mondo di là
  `dove: { arrivo: true }`, che non è una cella, e la riga in basso dice di nuovo terra e villaggio. Tutto il resto del mondo di là
  (nebbia, pietre, dungeon ripuliti, taglie, mostri) resta com'era; nessun campo nuovo nel profilo.
- **Scelta di questo lavoro**: la pietra e non la porta, perché la porta sta in fondo alla landa e nella terra nuova resta chiusa
  finché non si battono le sue tombe; il progetto voleva anche la porta nei due versi, che resta da fare se serve.
- **La tinta** (`TERRE` della scheda, `tingi` in `scena3d/mondo/vesti.js`): `tinta` moltiplica il colore di tutto il mondo
  (terreno, case, alberi) prima del velo delle nuvole, che resta bianco; `cielo` colora la sfera del cielo, lo sfondo e la foschia
  in proporzione al cielo della prima terra. La prima è [1, 1, 1]: non cambia niente.
- **Il primato** `sotTerra` (la terra più lontana raggiunta) si segna con `segnaBest` passando; se debba valere una medaglia lo
  decide l'utente.

## Il salvataggio

Tutto nell'avventura (`profile.campagne.sotterraneo.cfg.avventure[eroe]`), niente nel profilo, nessuna migrazione:

| campo | cosa | se manca |
|---|---|---|
| `terraOra` | la terra dove si è (1–5) | la prima: i salvataggi di prima delle terre |
| `mondo` | il mondo della prima terra, com'era | — |
| `mondi` | `{ 2: {…}, 3: {…} }`, il mondo di ogni terra dopo, con lo stesso contenuto di `mondo` | nessuna terra dopo |

- **Perché `terraOra` e non `terra`**: `terra` dell'avventura è già della terra dipinta del 2D (la nebbia, dove si era).
- **Il mondo di una terra nuova manca** finché non si salva: `mondoDaSalvato` lo fa nuovo, senza il travaso della storia (le strade
  scoperte fino alle porte finite valgono solo nella prima).
- **Chi legge o scrive il mondo di sopra in `Gioco.vue` passa da `mondoQui` e `nelMondo3d`** (`mondoDellaTerra` e `conMondo`): le
  taglie, le forze di sopra, il portale, i dungeon ripuliti. Una discesa scrive il rifatti nella terra della sua tappa
  (`tappa.delMondo.terra`), così una sosta lasciata in una terra torna lì anche se intanto si è passati.
- **Il mondo che passa la porta non scrive più** (`partito` in `Mondo3d.vue`): smontandosi scriverebbe la posizione della porta
  nella terra nuova, e lì si ripartirebbe in mezzo ai mostri della landa.
- La scena rinasce in un'altra terra perché la chiave di `Campagna` in `Gioco.vue` è eroe e terra.

## Il contratto (`motore/terre.js`)

`terraDi(a)`, `laTerra(t)`, `mondoDellaTerra(a, t)`, `conMondo(a, mondo, t)` (i campi da scrivere), `terreViste(a)`,
`apertaLaPorta(a, t)`, `passaTerra(a, t)` (`{ terraOra }` o null: avanti di una dalla porta aperta, o in una già vista),
`terreDaTornare(a)`, `laPorta(a)` (`{ ora, aperta, ultima, qui, dopo, altre }`, quello che `Mondo3d.vue` riceve come `terre`; emette
`terre` col numero della terra per passare, dalla porta o dalla pietra del villaggio).

## Voci aperte

- **La porta nei due versi** (dal progetto): oggi si torna solo dalla pietra del villaggio.
- **La taratura** delle terre dopo (il salto di 14, la curva della forza oltre il 15, quanto si guadagna): col banco, a lavoro finito.
- **La medaglia** per una terra nuova raggiunta, se l'utente la vuole.

Nei test: `unita/sotterraneo-terre` (le regole, il salvataggio, la porta, il viaggio indietro, i volti del minatore, la storia nella
prima, la tinta), `integrazione/sotterraneo-terre` (il minatore che la annuncia, la porta toccata col dito, la seconda terra salvata e
ritrovata, i volti, la pietra che riporta alla prima). Bersagli: `[data-mondo3d][data-terra-ora]`, `[data-bersaglio][data-terre]`
(1 aperta), `[data-terre-dice][data-aperta]`, il tasto `[data-azione="passa-terra"]`, la riga `[data-avviso-terra]`, nel fumetto
della pietra `[data-terre-da-tornare]` e i tasti `[data-azione="torna-terra"][data-terra]`.
