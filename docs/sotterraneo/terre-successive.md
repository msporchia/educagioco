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
`laPorta(a)` (`{ ora, aperta, ultima, qui, dopo }`, quello che `Mondo3d.vue` riceve come `terre` ed emette `terre` per passare).

## Voci aperte

- **Il viaggio indietro**: `passaTerra` sa già tornare a una terra vista e ognuna tiene il suo mondo, ma nel gioco non c'è modo di
  farlo (il progetto: la porta nei due versi e la pietra di ogni villaggio verso i villaggi delle terre già viste).
- **La taratura** delle terre dopo (il salto di 14, la curva della forza oltre il 15, quanto si guadagna): col banco, a lavoro finito.
- **I volti** delle rigenerazioni ruotano già di uno a terra (`voltoDelDungeon`); il minatore non li racconta ancora.
- **La medaglia** per una terra nuova raggiunta, se l'utente la vuole.

Nei test: `unita/sotterraneo-terre` (le regole, il salvataggio, la porta, la storia nella prima, la tinta),
`integrazione/sotterraneo-terre` (il minatore che la annuncia, la porta toccata col dito, la seconda terra salvata e ritrovata).
Bersagli: `[data-mondo3d][data-terra-ora]`, `[data-bersaglio][data-terre]` (1 aperta), `[data-terre-dice][data-aperta]`, il tasto
`[data-azione="passa-terra"]`, la riga `[data-avviso-terra]`.
