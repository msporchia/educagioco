# Le pozioni a scuola

A scuola il bambino gioca al laboratorio vero (`Gioco.vue`), limitato alle tappe che la maestra ha scelto. Il gioco non
si storpia: si limita da fuori. Chi lo monta è la vista della scuola (`src/scuola/giochi/pozioni/`, il contratto è
[../scuola/giochi.md](../scuola/giochi.md)); il modello sono Passo passo ([../passo-passo/scuola.md](../passo-passo/scuola.md))
e, per il 3D, gli Asteroidi ([../asteroidi/scuola.md](../asteroidi/scuola.md)).

## Cosa sceglie la maestra

```js
{ tipo: 'pozioni', famiglie: ['massa', 'capacita'], gradini: ['banco', 'virgola'] }
//   famiglie: 'massa' | 'lunghezza' | 'capacita' (le chiavi di FAMIGLIE, dati/misure.js), almeno una
//   gradini: le chiavi di GRADINI (dati/campagna.js), almeno uno
```

- **Le famiglie e i gradini, non le tappe**: una tappa per famiglia e gradino, con le chiavi stabili della campagna
  ([regole.md](regole.md#la-scaletta-una-cosa-nuova-per-volta)). Le due finali (calderone e Maestro) mescolano le tre
  famiglie e restano fuori; il calderone senza fondo pure.
- **La scheda è pura** (`scheda.js`): prende le famiglie da `dati/misure.js` e tiene a mano i nomi dei nove gradini per
  una maestra («Stessa unità», «Dai chili ai grammi, col conto scritto», …), uguali per le tre famiglie, ognuno con un caso
  concreto coi pesi (cosa chiede la ricetta, cosa vende il mercante, cosa fa il bambino) e un nome `breve` per `descrivi`.
  Provato coi nomi della campagna («Il banco», «L'unità grande»): a una maestra non dicevano niente. Il test dice se le chiavi non sono più quelle della campagna.
- **`valido`** rifiuta chiavi in più, liste vuote, doppie, chiavi che non ci sono e le finali; l'ordine non conta.
  **`descrivi`**: «Le pozioni · i pesi e i liquidi · stessa unità e la virgola col conto · 4 tappe»; «pesi, lunghezze e liquidi» e
  «tutti i gradini» quando sono tutti. La voce sta in Matematica, con l'icona del gioco (⚗️); di partenza i pesi coi primi
  tre gradini.
- L'editor (`Parametri.vue`) ha le tessere delle misure (con le unità) e i gradini come righe (`maestra/Righe.vue`), numerati
  come la scaletta e col loro caso scritto sotto, e quante tappe fanno; almeno uno per gruppo resta acceso, sempre
  nell'ordine della campagna.
- **In classe la formula della bacchetta si sussurra**: `motore/formule.js` a scuola è sostituito da `formule.js` della
  scuola, con le stesse formule tutte «sussurra» (scelta dell'utente: «grida» fa confusione in classe).

## Il gioco col limite

`<Pozioni :limite="{ famiglie, gradini }">`. **A casa manca** (`null` di difetto), e `tappeDelLimite`
(`motore/limite.js`, puro) torna `null`: niente di quello che segue esiste.

- **Il giro**: le tappe scelte nell'ordine della campagna (prima i pesi, poi le lunghezze, poi i liquidi; dentro, dal
  gradino più facile). Si parte dalla prima senza mappa; «Tappa dopo ▶» del cartello porta alla dopo del giro, e finita
  l'ultima **si ricomincia** dalla prima. Il titolo dice «2/4 · Pozione del Coraggio».
- **Il cartello** è quello di sempre, con le stelle (dicono quanto si è speso) e il modo più economico, senza monete e
  senza «🗺️ Le tappe» (`mappa: false` di `Fine.vue`).

| Resta (è il gioco) | Si spegne con `limite` |
|---|---|
| il listino, l'ordine, la spedizione, i gettoni, il trabocco e la pulizia | la mappa (`viste/Mappa.vue` a scuola è un `Vuoto.vue`: porta via ripresa e amici) |
| la ricetta da seguire e i suoi gesti | `completa`, i contatori dell'albo (`segna`), le monete sul cartello |
| il cartello con le stelle e il più economico | la sosta: `salva` non scrive niente, e nessuna ripresa |
| i messaggi d'aiuto di ogni tappa | il ← (`indietro` non fa niente: la barra della scuola non l'ha comunque) |

- Le monete e le risposte allo SRS si contano lo stesso, nel profilo in memoria che muore con la pagina; la barra e la
  pausa da cui non si esce, il suono spento e il profilo li mette la scuola ([../scuola/architettura.md](../scuola/architettura.md)).

## La difficoltà

La scheda dichiara `difficolta: { facile, difficile }` e la vista passa `difficoltaDi(esercizio)` nel limite
(`{ famiglie, gradini, difficolta }`, tolta la chiave prima di `valido`). L'unica leva che il gioco ha già da regolare sono i
**gettoni oltre il minimo** (`margine` della tappa, `tappaDiScuola` in `motore/limite.js`); le stelle, i listini e le dosi
sono dati tarati e non si toccano.

- **Normale**: il `margine` della tappa, com'è a casa. Senza limite la funzione torna la tappa stessa.
- **Facile**: `margine + 4`, per poter sbagliare qualche ampolla senza andare in rosso. **Difficile**: la metà, arrotondata
  per eccesso (da 4-8 a 2-4): il minimo resta lo stesso, e un ordine sprecato si sente subito.
- Perché il margine e non altro: le stelle (tre al minimo) contano il di più speso, quindi non dipendono dal bilancio e
  restano uguali; cambia solo quanto stretto è il conto. Il numero di ingredienti o di ampolle sarebbe cambiare la tappa.

## Il 3D leggero

Col limite e la fascia `'bassa'` (`fasciaAttiva()` di `store/qualita.js`, che il profilo della scuola sceglie) il banco
si disegna **senza antialias e a un pixel per punto** (`leggera` di `creaBottega3d`): i PC della scuola sono lenti. A casa
la fascia non si legge: un telefono in fascia bassa ha il banco di sempre. Se il banco non si disegna, subito o perso
dopo, compare «riprova» (`[data-senza-3d]`): la vista lo vede e manda `guasto`, e il bambino chiama la maestra.

Sul PC la colonna della vista si allarga fino a 1280 pixel, come per il sotterraneo, e il banco si stende con la carta in
colonna a sinistra: [schermo-largo.md](schermo-largo.md).

## L'evento `risposta`

**Ogni dose è una risposta** (`risposteDellOrdine`): si decide all'ordine, come le monete, e si dice quando il mercante
ha finito di versare (quello che il bambino vede); uscire prima (il blocco che cambia) la manda lo stesso.

```js
{ chiave: 'pozioni:kg-g', giusta: true, ultima: true, ms: 41200,
  fatto: '1500 g di polvere di luna', data: '1 kg + 500 g', attesa: '1 kg + 5 hg' }
{ chiave: 'pozioni:hg-g', giusta: false, ultima: false, ms: 9300,
  fatto: '1500 g di polvere di luna', data: '10 hg su 800 g', attesa: 'ne mancavano 700 g' }
```

- **Un ingrediente arrivato al segno d'oro**: `giusta: true, ultima: true`, la domanda chiusa, anche dopo un trabocco
  (come il colpo giusto degli Asteroidi dopo uno sbagliato). **Un trabocco**: `giusta: false, ultima: false`, un tentativo
  con la domanda ancora aperta. Un'ampolla che ci sta senza finire la dose non dice niente.
- `chiave`: la conversione dell'ampolla che decide (quella che finisce o che trabocca), come la annota il gioco
  (`pozioni:hg-g`, [regole.md](regole.md#cosa-va-al-motore-di-apprendimento)), anche nelle tappe col conto scritto;
  un'ampolla scritta nell'unità della ricetta è `pozioni:g`.
- `ms`: da quando il bambino ha avuto il banco libero (l'ingresso nella tappa o la fine dell'ultima animazione)
  all'ordine, come il tempo che va allo SRS; uguale per le dosi dello stesso ordine.
- `fatto`: la dose e l'ingrediente. `data`: le ampolle entrate, con le etichette del listino («1 kg + 500 g»), o
  l'ampolla che trabocca e quanto c'era già («10 hg su 800 g»). `attesa`: il modo più economico («1 kg + 5 hg»), o quanto
  ne mancava. Sopra i 40 caratteri si taglia a una parola, coi puntini.

Nei test: `unita/pozioni-scuola` (senza limite nessun giro; la scheda uguale alla campagna; `valido` contro una ventina
di forme storte; `descrivi`; il giro in ordine e da capo, senza le finali; in ogni tappa le dosi del giocatore che fa
il minimo sono tutte giuste e chiuse, con i testi nei 40; il trabocco aperto e la dose finita dopo; la difficoltà: normale uguale a casa, facile +4 gettoni, difficile la metà). Bersagli: la vista
`[data-gioco="pozioni"]`; nell'editor `[data-famiglia]` e `[data-gradino]`; il cartello senza `[data-azione="mappa"]`;
`[data-senza-3d]`.
