# Il Generale — dove siamo

Questo documento era il piano di un lavoro lungo. Adesso che gran parte è
fatta serve a un'altra cosa: **dire com'è il gioco oggi, cosa manca e cosa è
ancora da rifinire** — senza costringere a rileggere la cronaca di come ci
siamo arrivati. Le ragioni delle scelte stanno nei file, in testa, accanto al
codice che le applica.

---

## 1. Il quadro in una pagina

| | stato |
|---|---|
| **Il motore a elementi** — `Elemento` e le sue classi, i comandi che si consegnano | ✅ fatto, unità escluse |
| **Le porte vere** — lucchetto, spallate, a comando, sigillo colorato | ✅ fatto e visibile |
| **I congegni** — `Leva`, `Totem`, `premi`, `premuto:`, `almeno:` | ✅ fatto, con livello di prova |
| **Le azioni** — i sottoprogrammi del piano (§9) | ✅ fatto |
| **`parla`** — il messaggio diretto accanto al grido | ✅ fatto, senza un livello che lo insegni |
| **Il formato dei livelli** — mappa a token, legenda, fabbriche | ✅ fatto, tutorial convertito |
| **Il terreno** — tessiture al plurale, modi, cuciture, contesti | ✅ fatto |
| **`Unita extends Elemento`** | ❌ da fare — è il pezzo grosso rimasto |
| **La prima campagna** — il cortile di Rosa, cinque capitoli | ✅ fatta e in gioco, in coda alle sette prove |
| **L'arredo che il tema piazza da sé** | ◐ a metà: i contesti ci sono, il tema non li usa ancora |
| **L'editor e il validatore delle mappe** | ❌ fermi a due formati fa |
| **Le cinque storie vecchie** | ❌ in `todo/`, fuori dal gioco |

---

## 2. Com'è fatto un livello, oggi

Un livello è **dato puro**: nessuna istanza, nessuno stato. Si scrive con
quattro famiglie di fabbriche — `cose`, `chi`, `fai`, `se` — che stanno in
`src/data/livelli/scrivi.js`.

```js
import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.eroe()
const tesoro = cose.tesoro()
const grata = cose.grata('grata', 'la grata', { chiave: 'rossa', forza: 6 })

export default livello({
  id: 'esempio', nome: 'Un esempio', ambiente: 'cripta',

  scena: campo([
    '##|##|##|##|##',
    '##|@@|..|p1|##',
    '##|..|T$|..|##',
  ], { '@@': eroe, 'p1': grata, 'T$': tesoro }),

  vince: [se.ha(eroe, tesoro)],
  soluzioni: [{ nome: 'dritto', piano: { eroe: [fai.prendi(tesoro)] } }],
})
```

Le regole che tengono in piedi tutto il resto:

- **una cella sono due caratteri**, e la barra è facoltativa. Oltre tremila
  combinazioni: l'alfabeto non è più un vincolo, e la griglia resta un
  rettangolo che si legge in una diff;
- **`campo(righe, legenda)`**: la mappa e la sua legenda sono una cosa sola,
  perché un token senza legenda non vuol dire niente;
- **le cose si dichiarano e si passano** — `fai.prendi(tesoro)`, non
  `fai.prendi('tesoro')`: un refuso diventa un errore subito;
- **le posizioni non si scrivono**: le dice il token. Non si può più mettere
  un tesoro dentro un muro, né spostarlo ricontando le celle in tre punti;
- **`fazioni` e `nomi` non esistono più**: la parte la dice la fabbrica
  (`chi.nostro` / `chi.nemico` / `chi.terzo`), il nome sta nella chiamata;
- **i default sono metà del punto**: `cose.tesoro()` è già id, nome, forziere
  e 💰; `chi.eroe()` è già corpo, emoji e vista. Si scrive solo cosa devia;
- **una scena può mettere qualcuno in un posto preparato**: la mappa segna con
  `cose.segnaposto()` i punti possibili, e la variante li riempie con
  `metti: { o2: orco }`. Gli altri restano prato;
- **una cella può avere più cose**: `{ RF: [rifugio, eroe] }` è l'eroe che
  parte dentro il rifugio;
- **`livello()` rifiuta le chiavi che non esistono**, col suggerimento:
  «`obiettivi` non è un campo — forse intendevi `vince`?».

Le sette prove del tutorial stanno in `src/data/livelli/tutorial/`, una per
file col numero davanti. L'elenco in `src/data/generale.js` resta **scritto a
mano** apposta: l'ordine delle prove è la lezione.

## 3. Il motore

`src/motore/generale.js` più `src/motore/generale/` (le classi).

Un `Elemento` ha sette canali: `parti()`, `osserva()`, `ricevi(cmd, chi)`,
`chiedi(q)`, `dove()`, `faccia()`, `scheda()`, `azzera()`. Chi esegue un
ordine **non apre una porta**: le si avvicina e le consegna `apri`; la porta
decide e risponde. Le classi passive esistono (`Porta`, `Oggetto`, `Posto`,
`Leva`, `Totem`); **le unità no**, ed è la tappa che manca.

### 3.1 Le regole a cui il motore va riportato

> Queste non descrivono com'è oggi: sono i **vincoli concordati** a cui la
> ristrutturazione deve arrivare. Stanno qui perché sono decisioni, non
> dettagli, e perché ogni volta che una si perde il motore torna a essere un
> file solo con dentro uno `switch`.

**Un'azione è una classe.** `Vai`, `Attacca`, `Ripeti`, `Bivio` estendono
`Azione` e hanno una sola interfaccia: `esegui(contesto)` fa **un passo** e
dice se ha finito o se va richiamata. `vai` non arriva a destinazione: fa una
cella e risponde «non ancora». Sono componibili e ricorsive — un ciclo con
dentro dei bivi funziona perché il ciclo esegue quello che ha dentro e guarda
l'esito.

**Nessuna classe conosce i suoi sottocomponenti.** Un contenitore chiama
`esegui` e legge la risposta: non sa, e non deve poter sapere, cosa sta
eseguendo. È la condizione perché un'azione nuova non rompa i contenitori che
ci sono già, e viceversa. Ogni classe dichiara i parametri che ne definiscono
il comportamento, e per il resto è chiusa.

**Un'azione compilata non guarda più il piano.** L'editor (o il livello) è
solo un modo di *compilare*: `{verbo:'vai', complemento:'chiave'}` costruisce
l'oggetto, e da lì in poi l'oggetto vive dei suoi parametri. Un'azione che
rilegge il piano mentre gira può cambiare sotto i piedi di chi la sta
eseguendo — e il piano è un oggetto reattivo che appartiene alla vista.

**Ogni cosa si racconta da sé.** È l'azione a emettere «sto andando alla
chiave», «attacco l'orco», e la domanda a dire «vedi l'orco». Il registro non
guarda dentro a niente e non ricostruisce niente da un `verbo`: riceve una
frase già scritta. Un tag `verbo` usato per smistare non serve — smista la
classe; la parola resta solo come chiave del vocabolario, per i permessi che
il livello scrive (`sa:`, `nonRiesce:`).

**Un orchestratore per personaggio.** Il metodo `esegui` del personaggio: fa
avanzare di un passo l'azione in corso, poi guarda se c'è un evento a cui
reagire, sospende e riprende. Il battito non conosce più i fili: chiama
l'orchestratore di ognuno.

**Le domande sono oggetti come le azioni.** `valuta` non è una funzione
esterna con uno `switch` dentro: `Vedi`, `Ha`, `Aperta` rispondono da sé e si
scrivono da sé, nello stesso file. Il `non` è un decoratore, non una copia di
ogni domanda.

**Un elenco solo di cose, e non lo si tocca direttamente.** Niente registri
separati per famiglia (`porte`, `posti`, `leve`, `totem`): separarli non dà
nessun vantaggio e costringe ogni verbo a sapere in che cassetto guardare —
`apri` deve poter aprire qualcosa che non è una porta. E l'accesso passa
**sempre** da un metodo del mondo, mai da `cose[id]`: così il giorno che una
cosa non deve essere nominabile da tutti la regola si scrive in un punto solo.

**Prima ci si avvicina, poi si fa.** Mai un verbo che decide da fermo che
«tanto era già aperto»: se una cosa è già come la volevi lo dice lei quando
gliela chiedi.

**Una cosa che si apre fa rumore.** Non è un effetto sonoro: è
informazione. Una grata che si apre dall'altra parte della stanza non la
vedi, e la regola del gioco dice che quello che non vedi te lo deve dire
qualcuno — quindi lo dice lei. Da qui il piano del totem smette di
essere «premi finché la grata è aperta» (una domanda a cui chi preme non
può rispondere, e infatti il motore ora si rifiuta di mentirgli) e
diventa «premi finché **senti** la grata aprirsi». La stessa mossa vale
per la differenza fra aprire con la chiave e sfondare: due rumori di
portata diversa, quindi due mosse diverse anche quando la porta si apre
uguale.

**Chi tiene cosa è scritto due volte, e si scrive in un punto solo.**
L'oggetto sa chi lo tiene (`preso`), l'unità sa cosa porta (`zaino`): due
copie, perché rispondono a due domande diverse — «dove sei» e «cosa hai» — e
una sola scansione al posto dell'altra costerebbe a ogni battito. Il patto è
che **si registrano e si de-registrano sempre insieme**, e per non dipendere
da chi se ne ricorda l'unico punto che le tocca è `Oggetto.passaA()` /
`.lascia()`. Il giorno del `posa` si aggiunge lì.

**E si dipinge da sé.** Il disegno itera le cose e chiede a ognuna la sua
`faccia()` — quale pittore, con quali parametri — invece di iterare le
famiglie e decidere lui. Aggiungere una cosa, o un tipo di cose, non deve
rompere niente; e una cosa che vuole comportarsi in modo strano (comparire
solo se le passi vicino, cambiare aspetto quando è vuota) restituisce il
pittore giusto al momento giusto senza che il disegno sappia perché.

**Un file per classe, e nomi parlanti.** Niente `m`, `u`, `C`, `N`, `pt`: non
c'è nessun risparmio e si perde la leggibilità. Il registro stesso va portato
a classe.

**Un test per azione.** Oggetti sparsi che si provano solo tutti insieme sono
oggetti che non si possono mantenere: ogni azione deve avere la sua prova
isolata, oltre alle partite intere che il banco dei livelli già gioca.

### 3.2 Le tre regole del bus

Valgono anche per i comandi dei congegni:

1. un evento pubblicato adesso si consegna **al battito dopo** — senza, due
   elementi che si comandano a vicenda bloccherebbero il battito;
2. **consegna in ordine di dichiarazione**, sempre: `npm run simula`, il banco
   e i test rigiocano le partite e pretendono lo stesso esito. (È anche il
   motivo per cui l'ordine dei fili viene dalla legenda e non dalla mappa:
   quando dipendeva da dove stava un'unità, spostare un orco da un angolo
   all'altro cambiava chi vinceva.)
3. **ogni consegna lascia una riga col mittente**: «la leva rossa dice alla
   grata: apri». Il rischio di un modello a eventi è l'azione a distanza.

## 4. Il vestito

Un ambiente (`src/grafica/ambienti/`) dichiara **due liste di tessiture**,
`mura` e `suolo`, e ogni voce è una chiamata con i suoi colori:

```js
mura: [
  mattoni('#8f6146', '#5c3a29'),                                  // il fondo
  mattoni('#7e6350', '#4e3b2e', { seme: 2, quanto: 0.26 }),       // altra partita
  mattoni('#6a4736', '#40281c', { modo: 'rotto', dove: 'umido', quanto: 0.12 }),
  roccia('#5f5148', '#332a25', { modo: 'stratificata', dove: 'umido', quanto: 0.09 }),
],
campi: { umido: 5, usura: 6.5 },
```

- **la prima voce è il fondo**, le altre si prendono la fetta che dichiarano.
  `quanto` è davvero una frazione di superficie: la soglia esce dal quantile
  dei valori veri, non da un numero fisso;
- **i modi stanno dentro il pittore** — un muro rovinato non è una macchia
  stesa sopra, è quel muro fatto in un altro modo. Il contratto completo è in
  `src/grafica/materiali/LEGGIMI.md`;
- **la cucitura si fa per blocco**: la domanda «tocca a me?» si fa al centro
  di ogni concio, quindi il confine corre lungo i giunti e a mancare sono
  mattoni interi;
- **i campi sono mappe invisibili condivise**: il muro marcio, il muschio e le
  pozze nominano tutti `umido`, e finiscono nello stesso angolo perché hanno
  la stessa causa.

Due strumenti per giudicare, che si aprono col server di sviluppo (`npm run
vetrina`, o `vite --open` sull'altro):
`strumenti/banco/catalogo.html` (ogni tessitura da sola, coi suoi modi e
quattro semi, alla misura vera del gioco) e `strumenti/banco/vetrina.html`
(ogni personaggio, oggetto e porta, in ogni stato che sa disegnare — la
cartina di tornasole per un catalogo dove nessun test guarda i pixel: una
porta che si apre e resta dipinta chiusa non fa scattare niente di rosso,
quindi qui non si controlla, si **mostra**, ed è un occhio umano a fare il
resto). La vetrina segnala anche da sé i nomi senza pittore — oggi il
totem, vedi §5.7.

---

## 5. Quello che manca, in ordine

### 5.1 `Unita extends Elemento` — il pezzo grosso

È l'unica tappa del piano originale rimasta intera, ed è la più delicata: le
unità hanno fili, vista e memoria. Quando sarà fatta, `chiamaAllarme` e
`accorri` — trenta righe che fabbricano a mano un `suona` finto e un filo
finto — spariranno nel polimorfismo, e `grida`/`accorre` smetteranno di essere
un caso speciale: saranno `osserva()` come tutti.

### 5.2 L'editor e il validatore delle mappe

`strumenti/mappe/` descrive un formato di **due generazioni fa** (`mappa` +
`calco`, verbi `pattuglia`/`chiama`). Il `CLAUDE.md` lo indica come specifica,
quindi o si riallinea al formato a token o si dichiara storico. È anche
l'occasione per cui il formato a token è nato: **disegnare un livello col
mouse** invece di contare celle.

### 5.3 Le cinque storie in `todo/`

`bibi`, `fondi`, `nido`, `sale`, `torre` — venticinque file nel formato
vecchio, fuori dal gioco e fuori dal banco. Vanno riscritte una per una:
convertirle in automatico si può, ma si perderebbe la prosa che spiega ogni
scelta, che è la parte che vale. Il giorno che una viene rifatta esce da
quella cartella e torna in gioco da sé.

### 5.4 Il contratto delle tessiture, per tre pittori

`alberi`, i pali del `legno` e il bordo del `tappeto` non chiedono il permesso
per ogni pezzo che posano (§2 del `LEGGIMI.md`): come voce mascherata lasciano
buchi neri. Finché è così possono stare solo come prima voce di una lista, e
chiome e travi restano a una tinta.

### 5.5 L'arredo che il tema piazza da sé

I contesti ci sono (`angolo`, `controMuro`, `aperto`, `pareteLunga`,
`passaggio`) e si compongono coi campi: `['ragnatele', 4.6, ['angolo',
'umido']]`. Quello che manca è che sia **il tema** a portarsi dietro il suo
arredo con densità e regole, invece dell'ambiente voce per voce.

### 5.6 Il glow sui toccabili

Gli elementi in gioco dichiarano `alone: true` in `faccia()`; nessuno lo
disegna ancora. Serve appena l'arredo si fa più fitto, perché un sarcofago
dipinto dal fondale non si confonda con una cassa che si apre.

### 5.7 I congegni non si vedono — trovato con la vetrina

Due guasti distinti, scoperti costruendo `strumenti/banco/vetrina.html`:

- **manca il pittore del totem.** `Totem.faccia()`
  (`src/motore/generale/elementi/totem.js`) consegna `che: 'totem'`, ma
  `PITTORI` (`src/grafica/generale.js`) non ha nessuna voce `totem`: nessun
  file in `src/grafica/oggetti/` lo disegna. Se venisse chiamato, sarebbe
  un buco muto nella scena.
- **e infatti non viene mai chiamato**, né lui né la leva: `CampoLivello.vue`
  (`scena()`, riga ~387) costruisce la lista da disegnare guardando
  `m.porte` e `m.oggetti`, mai `m.cose` — che è dove `allestimento.js`
  mette leve e totem (`cose[k] = new Leva(...)`, `cose[k] = new Totem(...)`).
  `.faccia()` oggi si chiama solo sulle `Porta`. Il livello «Il totem»
  (`data/livelli/tutorial/8-il-totem.js`) e la «Prova dei congegni»
  giocano quindi con un totem e una leva del tutto invisibili sullo
  schermo, indipendentemente dal pittore che manca.

Due lavori diversi: il primo è un file nuovo in `src/grafica/oggetti/` più
una riga in `PITTORI_OGGETTI`; il secondo è far chiedere a `CampoLivello.vue`
la `faccia()` anche di `m.cose`, non solo di `m.porte`.

---

## 6. Da rifinire

- **Il pavimento è la metà debole del terreno**: la lacuna del lastricato si
  legge molto meno di quella del muro, perché per terra manca lo spessore che
  la spiega.
- **`parla` non ha un livello che lo insegni**: esiste nel motore e nessuno lo
  incontra giocando.

---

## 6bis. Le cose aperte, in ordine di quanto fanno male

Sono i guasti trovati **giocando** il 12 agosto 2026, mentre si scriveva la
prima campagna. Nessuno è una teoria: ognuno è stato misurato con una partita
e la traccia in mano. Le ragioni per esteso — e quelle didattiche — stanno nel
§13 di [`generale-didattica.md`](generale-didattica.md); qui c'è cosa fare.

**1. `segnaleDi` non fonde, e il fracasso della terza prova vale 20 invece di
40.** `mondo.js` riga 66: `vocabolario[k] || ilSegnale(k)`, o l'uno o l'altro.
Un livello che ridichiara un segnale della tabella globale solo per dargli un
nome e un'emoji suoi si porta via tutto il resto, `voce` compresa. La terza
prova fa esattamente questo, e il rumore delle venti spallate arriva a metà di
quanto dovrebbe. Da fondere in `segnaleDi`, **omettendo le chiavi non
dichiarate** (se no un `em: undefined` cancella l'emoji buona). Non è un cambio
di bilanciamento: quei 20 non li ha scelti nessuno.

**2. Le opzioni di un'unità non le controlla nessuno.** `livello()` rifiuta le
chiavi sconosciute del livello col suggerimento; `chi.orco({ accorre: … })`
passa liscio e non fa niente, in silenzio. È così che la sesta prova è rimasta
rotta: `accorre` non è più letta da nessuno da quando chi corre al rumore si
dichiara con `reagisce`, e il livello che insegna il rumore era l'unico in cui
il rumore non spostava niente (riparato nel livello il 12 agosto). Il controllo
va messo all'import, accanto a quello dei campi.

**3. Il rifiuto di una porta non porta con sé il suo `motivo`.** La frase
giusta c'è («*la dispensa è chiusa a chiave, e la chiave non ce l'ho*») ma
quella voce della traccia non ha il campo `motivo`: ce l'ha solo la riga
generica dopo. Chi legge la traccia da fuori non riesce ad attribuire il
fallimento alla porta — e sono i tre guasti che restano oggi in
`unita/generale`. Vale doppio il giorno che i fallimenti diventano vignette
sul campo: una vignetta si attacca a un motivo, e questo non ce l'ha.

**4. `srotola` non ricorsa dentro `ripeti.corpo` e `routine.corpo`**
(`test/aiuto/livello.mjs`): finché non lo fa, `nonInFila` tace proprio sui
livelli dove la struttura costa di più.

**5. Una soluzione dichiarata dovrebbe essere scrivibile con la cassetta che
il livello offre.** Il banco valida gli ordini contro il motore (`guaiDi`), non
contro `verbi:`.

### Fatte lo stesso giorno, per non rifarle

- **`chiudi` era ineseguibile**: una porta aperta si tocca standoci **sopra**
  (`Porta.raggioDiPresa`), e da sopra `Porta.chiudi()` rifiuta sempre («c'è
  qualcuno sulla soglia»). Ogni piano con `chiudi` cadeva, settima prova
  compresa. Ora `Chiudi` si ferma **accanto** (`azioni/chiudi.js`).
- **`voce` non arrivava dal livello al rumore**: `allestimento.js` copiava dal
  segnale dichiarato solo `{ nome, em, col }`, quindi `{ voce: 40 }` diventava
  in silenzio 20. Ora c'è (resta il punto 1, che è l'altra metà).
- **`u.viva` non esiste più sulle unità** (`inPiedi`/`eInPiedi()`): rendeva
  `se.qui(...)` sempre falso e faceva sparire gli oggetti in mano a qualcuno.
- **Due controlli del banco riallineati** al motore invece che aggirati:
  `posa` mancava dal vocabolario concordato, e «ogni verbo dichiara i tipi che
  accetta» pretendeva un elenco anche da `aspetta`, che punta a una domanda e
  non a una cosa (`vuoleCond`).

---

## 7. Cosa abbiamo scartato, e perché

- **Il fluent sull'intero livello** (`Livello.crea('x').oggetto(…)`): l'editor
  deve poter **rileggere** un livello, disegnarlo e riscriverlo. Un dato si
  rilegge, una catena di chiamate no.
- **`new Porta()` dentro il file del livello**: stessa ragione, più due — le
  varianti sono toppe stese sul dato, e il livello lo importano anche il
  validatore e l'editor, che non hanno il motore.
- **I «veli»** stesi sopra le tessiture: un secondo sistema per fare peggio
  quello che il pittore sa già fare coi suoi modi.
- **Materiali alla pari mescolati a chiazze**: tinte scelte a mano per
  materiale danno due famiglie cromatiche che non si conoscono, e il confine
  tagliava le celle. È stato il primo tentativo, ed era sbagliato due volte.
- **Una tabella `regole` del livello** per i congegni: sostituita dai comandi
  fra elementi. Se le regole stanno in una tabella non si vedono sulla mappa;
  se stanno negli elementi, la catena la segui col dito.
- **Un verbo per ogni congegno** (`tira`, `gira`, `accendi`): uno solo,
  `premi`, e cosa succede lo decide chi lo riceve.
- **`ripeti N volte`**: già ottenibile col totem, e insegna di più.
- **Variabili con aritmetica**: un contatore con soglia copre i casi veri e
  resta una cosa che si vede sul campo.

---

## 8. Le reti

- **I test giocano.** `unita/generale` gioca le soluzioni dichiarate di tutti
  i livelli su tutte le scene, e pretende che le `fragile` **perdano**: è
  l'unica cosa che si accorge di una mappa ridisegnata male. Durante il
  travaso ha trovato gli ordini dei nemici presi dalla scena sbagliata, e
  l'ordine dei fili che dipendeva da dove stava un'unità — due bug che
  guardando il codice non si vedevano.
- **`integrazione/generale`** gioca col dito su `dist/index.html`: compone un
  ordine, preme ▶ e controlla che il livello si vinca davvero.
- **Il determinismo è un requisito**: niente `Math.random` nel motore,
  consegne in ordine dichiarato, semi derivati dall'id del livello.
- **Gli id dei contenuti non si rinominano**: sono le chiavi dei progressi. Il
  nome del file è per noi, l'id è per l'archivio.

---

## 9. Le azioni, cioè i sottoprogrammi

Non è un'aggiunta al mondo ma **al linguaggio del piano**, e sta qui perché
è una decisione strutturale come le altre.

Il problema che l'ha chiesta: dentro il ramo di un bivio non entra un altro
bivio, ed è una regola voluta — un albero non si legge su un telefono. Ma un
piano che deve scegliere **due volte in due momenti** («esci se è libero» e
poi «torna se è ancora libero») con quella regola non è scrivibile, e il
livello finisce tarato in modo che la seconda scelta non serva. Il vincolo di
struttura stava decidendo il contenuto.

Un'**azione** è una fila di ordini con un nome, che sta accanto al piano come
un «quando senti» e non parte da sé: la si chiama con `esegui [azione 2]`.

- **Non è un `Elemento` e non lo diventerà.** Gli elementi sono il mondo —
  posizione, `faccia()`, `scheda()`, `azzera()`. Un'azione non ha una
  posizione, non si disegna e non si tocca: è un pezzo di piano.
- **`esegui` non è `parla`** (§3.2). I tre canali restano tre: `suona` a
  chiunque, `parla` a chi vedi, `premi`/`apri` a portata. `esegui` non parla a
  nessuno — è controllo di flusso, come `ripeti`.
- **È una chiamata, non un lancio.** Il filo scende nell'azione e risale
  all'ordine dopo. Il personaggio resta uno, e la regola dell'**una cosa alla
  volta** non si tocca.
- **La chiamata in coda non impila.** Se dopo non resta niente da fare,
  `esegui` prende il posto del frame invece di aggiungerne uno. Non è
  un'ottimizzazione da manuale: senza, «se vedi ancora qualcuno, riprova» —
  che è il modo naturale di scrivere un'attesa — sbatterebbe contro il tetto
  della pila dopo dodici giri. Con, è un'attesa attiva che costa un battito
  per volta, e intanto il mondo si muove.
- **Le azioni sono cose come le altre**, ed è la parte che conta per il
  documento: entrano in `m.cose` col tipo `routine` (`raccogliRoutine`), e da
  lì in poi `laCosa`, i complementi di un verbo, la cassetta e gli elenchi dei
  bersagli funzionano **senza sapere che esistono**. Sono l'unica cosa
  nominabile che non viene dal mondo ma dal piano, e la sola riga che lo dice
  sta in `nominabili()`. La prima versione aveva un «se è un'azione allora» in
  quattro posti diversi — motore, complementi, cassetta, bersagli — cioè
  esattamente il difetto del §1.

Nomi: **azione** è quello che si legge a schermo; nel codice il blocco si
chiama `routine`, perché `azione` è già la classe dei verbi che agiscono
(`cl:'azione'`).
