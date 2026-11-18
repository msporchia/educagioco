# L'app del bambino

La pagina dei PC della classe (`scuola/index.html` → `src/scuola/bambini/`). Il giro senza disegno (quale
schermata, l'obiettivo, i minuti, il ricordo) sta in `giro.js`, puro e provato in Node; `App.vue` tiene il
collegamento (`apriBambino` di [protocollo.md](protocollo.md)) e sceglie la vista; le domande sono quelle di casa
(`quiz/Domanda.vue`) pescate da `pescatore` di [esercizi.md](esercizi.md), oppure il gioco vero in cui l'esercizio si fa
(sotto, «I giochi veri»). Niente monete, record, premi, suoni.

## Le schermate

Le decide `schermata()` da tre cose: il codice, l'ultimo `stato` del servizio (o quello ricordato) e
l'avanzamento dell'obiettivo.

| Schermata | Quando | Cosa si vede |
|---|---|---|
| `codice` | nessun codice | un campo grande (minuscole e spazi accettati, si vede maiuscolo) e «Entra». `controllaCodice`: `no` → «Questo codice non c'è: controlla la lavagna», `rete` → «Non riesco a collegarmi: chiedi alla maestra» |
| `collego` | codice, nessuno `stato` ancora | «Mi collego alla classe…» |
| `nome` | `stato.io` è `null` | i nomi della classe come tasti; un nome preso da un altro è grigio e non si tocca. In fondo «Non trovo il mio nome» → un campo → `sono({ nome })` |
| `aspetta` | nome scelto, fase `attesa` | il nome e «Aspetta il via della maestra» |
| `obiettivo` | fase `via` | le domande dell'obiettivo (o il gioco); in cima il nome e il segno di quanto manca |
| `finito` | obiettivo fatto | «Hai finito!» e, se la lezione ha un `dopo`, «Ora puoi continuare con: <descrivi(dopo)>» e «Continua»; se no «Aspetta la maestra» |
| `dopo` | toccato «Continua» | le domande del `dopo`, senza fine e senza segno |
| `chiusa` | fase `chiusa` (vince su tutto) | «La lezione è finita. Hai lavorato bene!» e, piccolo, «Entra in un'altra lezione» |
| `guasta` | fase `via` ma l'esercizio non è `valido` | «Questa lezione non si apre: chiedi alla maestra» (il servizio non legge la lezione: un link storto arriva fin qui) |

- **Il nome liberato dalla maestra** (`io` torna `null`) riporta a `nome` da qualunque schermata.
- **«Ho sbagliato codice»** (piccolo, sotto i nomi e in `collego`) chiude il collegamento, dimentica e torna a
  `codice`: un codice giusto di un'altra classe mostra nomi sconosciuti, e il bambino deve poter uscire.
- **«Entra in un'altra lezione»** a lezione chiusa: il PC serve alla classe dopo.
- Toccato un nome, «Un momento…» finché il servizio risponde; un rifiuto si dice sotto i nomi: `preso` →
  «Questo nome l'ha già scelto un altro computer: tocca il tuo.», `storto` → «Non riesco a darti questo nome:
  chiedi alla maestra.».
- **La versione** (`__VERSIONE_SCUOLA__` di `vite.scuola.config.js`) sta piccolissima nell'angolo in basso a destra.

## L'obiettivo

- **A domande** (`quante`): ogni risposta, giusta o sbagliata, conta una; il segno dice la domanda a schermo,
  «7 di 15». All'ultima risposta l'obiettivo è fatto.
- **A minuti** (`minuti`): il tempo parte alla prima domanda di quel bambino (chi entra tardi ha i suoi
  minuti) ed è **tempo di parete** (`Date.now`): passa anche a pagina chiusa, come passa per la classe. Il segno
  dice «Ancora 7 minuti» (arrotondato in su), poi «Ultima domanda»: **la domanda a schermo allo scadere si
  finisce**, e la sua risposta conta. Un orologio della pagina (ogni 2 s) rilegge solo l'ora per il segno;
  nessun `setTimeout` decide la fine, quindi un timer in ritardo o uno schermo spento non sbagliano il conto.
- Ogni risposta va a `rispondi({ parte, chiave, giusta, ms, fatto, data, attesa })`: `ms` è il `tempo` di
  `Domanda.vue` (quello davanti agli occhi, col tetto di casa), `fatto`/`data`/`attesa` da `racconta()`.
- `dove('obiettivo' | 'finito' | 'dopo')` a ogni cambio: `finito` appena l'obiettivo è fatto, anche se c'è un
  `dopo` non ancora cominciato. `rete.js` lo ripete a ogni rientro.
- La risposta parte quando `Domanda.vue` emette `risposto`, cioè dopo l'attesa dell'esito: una pagina chiusa in
  quei secondi perde quella risposta.
- `Domanda.vue` resta com'è: dal di fuori si toglie solo il velo scuro e sfocato (`backdrop-filter` costa sui
  PC lenti), la carta sta sul fondo chiaro.

## I giochi veri

Un esercizio con `gioco: 'asteroidi'` ([esercizi.md](esercizi.md#il-gioco-in-cui-si-fa)) si fa negli Asteroidi di
casa, limitati alle sue tabelline ([../asteroidi/scuola.md](../asteroidi/scuola.md)): la vista è
`viste/Asteroidi.vue`, al posto di `Domande.vue`, nell'obiettivo come nel «se hai finito».

- **Il profilo** è quello di casa, ma in memoria: `bambinoInMemoria(alunno, nome)` di `profilo.js` lo crea con
  `creaGiocatore`, spegne il suono e mette la grafica nella fascia `'bassa'` (i PC della scuola sono lenti).
  L'archivio è il sostituto in memoria ([architettura.md](architettura.md)): niente scrive sul PC della classe, e
  ricaricando la pagina il gioco riparte da livello 1 (l'avanzamento dell'obiettivo invece è nel ricordo, sotto).
  **Lo stesso alunno lo tiene** fra obiettivo e «dopo»; un altro nome sullo stesso PC riparte da zero.
- **La festa dei traguardi** a casa la mostra e la svuota l'app; qui nessuno lo farebbe, e piena fermerebbe il gioco
  (`giochi/pausa.js`). Il sostituto di `store/progressi.js` non dà mai traguardi, e in più `profilo.js` la svuota
  appena qualcosa la riempie.
- La vista aspetta il font delle emoji (col tetto di 1,5 s, come `src/main.js`: la tela scrive i numeri dei sassi
  con quel font) e il profilo, poi monta il gioco in **una colonna** larga al più 600 px, centrata su fondo scuro.
- **Ogni colpo va alla maestra**, giusto o sbagliato, con la chiave `tab:prodotto` (come le schede) e `fatto`,
  `data`, `attesa` da `raccontaAsteroide` ([esercizi.md](esercizi.md)). **L'obiettivo conta la domanda una volta**,
  quando si chiude (`ultima` dell'evento: `rispostaData(…, ultima)` non conta un colpo sbagliato con la domanda ancora
  aperta). Il segno «7 di 15» conta quindi le domande, e l'obiettivo fatto porta a «finito» alla fine della domanda
  in corso, mai a metà.
- **Si torna alle schede** se il PC non ha WebGL 2 (lo stesso controllo di `grafica/spazio3d`, fatto la prima
  volta che serve), se il cielo non si accende (il gioco mostra il tasto per riaccenderlo) o se il gioco lancia un errore:
  la vista emette `guasto` e da lì, per quella pagina, l'esercizio si fa a schede.

## Cosa si ricorda, e dove

Due chiavi in localStorage, tutte e due sotto `scuola:` con un campo `nato`: `rete.js` all'avvio butta ogni
`scuola:*` più vecchia di tre ore (quanto vive una lezione).

| Chiave | Chi la scrive | Cosa |
|---|---|---|
| `scuola:bambino` | `giro.js` (`ricorda`) | `{ codice, nato, stato: { fase, lezione, io, alunni }, avanzamento: { alunno, fatte, inizio, parte } }` |
| `scuola:<CODICE>` | `rete.js` | il posto del PC, l'alunno, l'ultima `n` e la coda delle risposte ([protocollo.md](protocollo.md)) |

- **Riaprendo la pagina** si legge `scuola:bambino` e si riparte **subito** dallo stato ricordato (anche senza
  rete: le domande ricominciano e le risposte vanno in coda); il collegamento, con lo stesso posto, riporta lo
  stesso nome e corregge quello che è cambiato intanto. Quante fatte e l'inizio dei minuti sono nell'avanzamento.
- **L'avanzamento è di un nome**: se sullo stesso PC ne viene scelto un altro, riparte da zero. Lo stesso nome
  ripreso da **un altro PC** riparte da zero anche lui (il servizio non rimanda il conto delle risposte).
- **Si ricorda solo una lezione aperta**: a lezione chiusa la chiave si toglie, e una pagina riaperta chiede il
  codice. Un ricordo guasto, vecchio o con un codice storto è come nessun ricordo; uno stato o un avanzamento
  guasti si buttano e resta il codice.
- **La lezione che non c'è più** (il WebSocket chiuso con `4404`, `suNo('codice')`) riporta a `codice` senza
  nessun messaggio.
- localStorage vietato o pieno: si va avanti senza ricordo (ogni accesso è in un `try`).

## Quando la rete cade

- **Il bambino non si ferma**: le domande vengono dal PC, le risposte vanno nella coda di `rete.js` e partono
  al rientro. Niente errori rossi, niente blocchi.
- Un segno piccolo e grigio, «Sto ricollegando…», nella riga in cima (o sotto il titolo in `collego` e `nome`):
  appena il filo cade dopo essere stato su, oppure se al primo collegamento passano 3 s (`PAZIENZA`) senza
  linea. Sparisce da solo al rientro.
- Un nome toccato senza rete resta «Un momento…»: `rete.js` lo manda appena torna.

## I file

- `src/scuola/bambini/main.js` — monta l'app con lo stile e le emoji di casa.
- `src/scuola/bambini/App.vue` — il collegamento, i `watch` del giro, le schermate semplici.
- `src/scuola/bambini/giro.js` — `schermata`, l'avanzamento (`perAlunno`, `entraNellObiettivo`, `rispostaData`,
  `continua`, `segno`), il ricordo (`leggiRicordo`, `ricorda`, `dimentica`), `pulisciCodice`.
- `src/scuola/bambini/viste/` — `Codice.vue` (controlla il codice da sé), `Nomi.vue`, `Domande.vue` (pesca e
  mette in scena; chi la monta decide quando basta), `Asteroidi.vue` (il gioco vero, sopra).
- `src/scuola/bambini/profilo.js` — `bambinoInMemoria`, il profilo di casa per i giochi veri.

La pelle è quella delle schermate di contorno (`.schermo.pulito`, i valori di `style.css`,
[../core/pelle.md](../core/pelle.md)); niente animazioni nostre; i tasti dei nomi sono larghi almeno 190 px
e alti 60, e stanno in una griglia che si allarga fino a 960 px.

Nei test: `unita/scuola-bambini` (codice, schermate, obiettivo a domande e a minuti, i colpi che non chiudono la
domanda, ripresa a pagina riaperta, il ricordo e i suoi guasti), `unita/scuola-profilo` (`bambinoInMemoria` coi
sostituti applicati in Node: suono spento, fascia bassa, lo stesso alunno tiene il profilo, un altro riparte, la festa
resta vuota, nessun accesso al disco). Bersagli: la radice ha `[data-schermata="<schermata>"]`; `[data-codice]` (il campo),
`[data-entra]`, `[data-codice-errore]`; `[data-collego]`; `[data-nomi]`, `[data-nome="<id alunno>"]` (con
`[data-preso]` se è di un altro), `[data-scelgo]`, `[data-nome-avviso]`, `[data-non-trovo]`, `[data-nome-nuovo]`
(il campo), `[data-nome-nuovo-manda]`, `[data-cambia-codice]`; `[data-aspetta]`; `[data-domanda]` con
`[data-parte="obiettivo"|"dopo"]` (dentro, i bersagli di `Domanda.vue`, come `[data-giusta]`, oppure il gioco
`[data-gioco="asteroidi"]` coi bersagli di [../asteroidi/scuola.md](../asteroidi/scuola.md)), `[data-segno]`;
`[data-finito]`, `[data-continua]`; `[data-chiusa]`, `[data-altra-lezione]`; `[data-guasta]`; `[data-ricollego]`;
`[data-versione]`.
