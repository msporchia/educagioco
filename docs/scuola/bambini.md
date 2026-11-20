# L'app del bambino

La pagina dei PC della classe (`scuola/index.html` → `src/scuola/bambini/`). Il giro senza disegno (quale
schermata, dove sta il bambino nella lezione a blocchi, il conto del blocco, il segno, il ricordo) sta in `giro.js`,
puro e provato in Node, sopra il modello di [lezione.md](lezione.md) (`posizione`, `finita`, `bloccoDi`, `superato`);
`App.vue` tiene il collegamento (`apriBambino` di [protocollo.md](protocollo.md)) e sceglie la vista; le domande sono
quelle di casa (`quiz/Domanda.vue`) pescate da `pescatore` di [esercizi.md](esercizi.md), oppure il gioco vero in cui
l'esercizio del blocco si fa (sotto, «I giochi veri»). Niente monete, record, premi, suoni.

## Le schermate

Le decide `schermata()` da tre cose: il codice, l'ultimo `stato` del servizio (o quello ricordato) e il cammino del
bambino (sotto).

| Schermata | Quando | Cosa si vede |
|---|---|---|
| `codice` | nessun codice | un campo grande per quattro cifre (col tastierino numerico; spazi e altro si tolgono) e «Entra». `controllaCodice`: `no` → «Questo codice non c'è: controlla la lavagna», `rete` → «Non riesco a collegarmi: chiedi alla maestra» |
| `collego` | codice, nessuno `stato` ancora | «Mi collego alla classe…» |
| `nome` | `stato.io` è `null` | i nomi della classe come tasti; un nome preso da un altro è grigio e non si tocca. In fondo «Non trovo il mio nome» → un campo → `sono({ nome })` |
| `aspetta` | nome scelto, fase `attesa` | il nome e «Aspetta il via della maestra» |
| `blocco` | fase `via`, nel blocco | le domande del blocco (o il suo gioco); in cima il nome e il segno |
| `passaggio` | superato un blocco (da solo o con «Avanti tutti»), «Continua» non ancora toccato | «Bravo!», «Adesso: <descrivi(esercizio del blocco nuovo)>» e «Continua» |
| `finito` | oltre l'ultimo blocco, senza `inTondo` | «Hai finito!» e «Aspetta la maestra», senza passaggio prima |
| `chiusa` | fase `chiusa` (vince su tutto) | «La lezione è finita. Hai lavorato bene!» e, piccolo, «Entra in un'altra lezione» |
| `guasta` | fase `via` ma la lezione non è `lezioneValida` | «Questa lezione non si apre: chiedi alla maestra» (il servizio non legge gli esercizi: un link storto arriva fin qui) |

- **Il nome liberato dalla maestra** (`io` torna `null`) riporta a `nome` da qualunque schermata.
- **«Ho sbagliato codice»** (piccolo, sotto i nomi e in `collego`) chiude il collegamento, dimentica e torna a
  `codice`: un codice giusto di un'altra classe mostra nomi sconosciuti, e il bambino deve poter uscire.
- **«Entra in un'altra lezione»** a lezione chiusa: il PC serve alla classe dopo.
- Toccato un nome, «Un momento…» finché il servizio risponde; un rifiuto si dice sotto i nomi: `preso` →
  «Questo nome l'ha già scelto un altro computer: tocca il tuo.», `storto` → «Non riesco a darti questo nome:
  chiedi alla maestra.».
- **La versione** (`__VERSIONE_SCUOLA__` di `vite.scuola.config.js`) sta piccolissima nell'angolo in basso a destra.

## Il cammino nei blocchi

Il cammino è `{ alunno, p, visto, conto: { fatte, giuste, inizio } }`: `p` la posizione propria (i blocchi superati,
[lezione.md](lezione.md)), `visto` la posizione in cui il bambino ha toccato «Continua», `conto` le domande chiuse del
blocco in corso. Il bambino sta in `posizione(p, pavimento(stato))` (il più alto fra `avanti` e il suo `io.avanti`); se
`visto` è indietro si vede il passaggio.

- **Da solo**: a ogni domanda chiusa il conto cresce (`fatte`, e `giuste` se giusta); quando `superato(passa, conto, ora)`
  la posizione sale di uno, il conto riparte e si vede il passaggio (o `finito`). Una sbagliata conta fra le domande,
  non fra le giuste.
- **«Avanti tutti»**: lo `stato` porta un `avanti` più alto; `segui` alza `p` fino al pavimento e fa ripartire il conto,
  col passaggio. Chi era già avanti resta dov'è, col suo conto.
- **Chi arriva tardi** (un nome scelto a lezione avviata) comincia dal pavimento, senza passaggio.
- **In tondo** la posizione cresce senza fine e il blocco è `p % blocchi` (`bloccoDi`): mai `finito`.
- **Il conto è di un blocco**: riparte a ogni blocco, e una risposta che arriva dopo un cambio di blocco (la vista di
  prima era montata in un'altra posizione) va alla maestra ma non conta qui.

### Il segno in alto

Secondo `passa` del blocco: `{ giuste }` → «3 di 10 giuste»; `{ domande }` → la domanda a schermo, «7 di 20» (non oltre il
totale); `{ minuti }` → «Ancora 7 minuti» (arrotondato in su), poi «Ultima domanda»; `null` → niente.

### I minuti

Il tempo di un blocco parte quando il bambino ci entra (dopo «Continua», o alla prima domanda del primo blocco: chi
entra tardi ha i suoi minuti) ed è **tempo di parete** (`Date.now`): passa anche a pagina chiusa, come passa per la
classe. **La domanda a schermo allo scadere si finisce**, e la sua risposta fa passare: un blocco tolto a metà
domanda perderebbe la risposta già data (la scheda la manda dopo l'attesa dell'esito). Un orologio della pagina (ogni
2 s) rilegge l'ora per il segno; nessun `setTimeout` decide, quindi un timer in ritardo o uno schermo spento non
sbagliano il conto. Riaprendo la pagina a tempo scaduto il blocco è superato subito (`entraNelBlocco`).

### Al servizio

- Ogni risposta va a `rispondi({ blocco, chiave, giusta, ms, ultima, fatto, data, attesa })`: `blocco` è la posizione in
  cui è stata data, `ms` il `tempo` di `Domanda.vue` (quello davanti agli occhi, col tetto di casa), `fatto`/`data`/
  `attesa` da `racconta()`; nelle schede `ultima` è sempre vera.
- `dove(p)` a ogni cambio di posizione (anche nel passaggio), `dove('finito')` a lezione finita. `rete.js` lo ripete a
  ogni rientro.
- La risposta parte quando `Domanda.vue` emette `risposto`, cioè dopo l'attesa dell'esito: una pagina chiusa in
  quei secondi perde quella risposta.
- `Domanda.vue` resta com'è: dal di fuori si toglie solo il velo scuro e sfocato (`backdrop-filter` costa sui
  PC lenti), la carta sta sul fondo chiaro.

## I giochi veri

Un esercizio con `gioco: 'asteroidi'` ([esercizi.md](esercizi.md#il-gioco-in-cui-si-fa)) si fa negli Asteroidi di
casa, limitati alle sue tabelline ([../asteroidi/scuola.md](../asteroidi/scuola.md)): la vista è
`viste/Asteroidi.vue`, al posto di `Domande.vue`, in ogni blocco che lo chiede. Ogni blocco ha il suo gioco: un blocco
nuovo rimonta la vista (`:key` con la posizione), e gli Asteroidi ricevono l'esercizio del blocco, anche a più parti
(`limiteAsteroidi`).

- **Il profilo** è quello di casa, ma in memoria: `bambinoInMemoria(alunno, nome)` di `profilo.js` lo crea con
  `creaGiocatore`, spegne il suono e mette la grafica nella fascia `'bassa'` (i PC della scuola sono lenti).
  L'archivio è il sostituto in memoria ([architettura.md](architettura.md)): niente scrive sul PC della classe, e
  ricaricando la pagina il gioco riparte da livello 1 (il cammino invece è nel ricordo, sotto).
  **Lo stesso alunno lo tiene** da un blocco all'altro; un altro nome sullo stesso PC riparte da zero.
- **La festa dei traguardi** a casa la mostra e la svuota l'app; qui nessuno lo farebbe, e piena fermerebbe il gioco
  (`giochi/pausa.js`). Il sostituto di `store/progressi.js` non dà mai traguardi, e in più `profilo.js` la svuota
  appena qualcosa la riempie.
- La vista aspetta il font delle emoji (col tetto di 1,5 s, come `src/main.js`: la tela scrive i numeri dei sassi
  con quel font) e il profilo, poi monta il gioco in **una colonna** larga al più 600 px, centrata su fondo scuro.
- **Ogni colpo va alla maestra**, giusto o sbagliato, con la chiave `tab:prodotto` (come le schede) e `fatto`,
  `data`, `attesa` da `raccontaAsteroide` ([esercizi.md](esercizi.md)). Alla maestra va anche `ultima`; **il blocco conta la domanda una
  volta**, quando si chiude (`rispostaData` non conta un colpo con `ultima: false`). Il segno conta quindi le domande, e
  una soglia raggiunta porta al passaggio alla fine della domanda in corso, mai a metà.
- **Si torna alle schede** se il PC non ha WebGL 2 (lo stesso controllo di `grafica/spazio3d`, fatto la prima
  volta che serve), se il cielo non si accende (il gioco mostra il tasto per riaccenderlo) o se il gioco lancia un errore:
  la vista emette `guasto` e da lì, per quella pagina, l'esercizio si fa a schede.

## Cosa si ricorda, e dove

Due chiavi in localStorage, tutte e due sotto `scuola:` con un campo `nato`: `rete.js` all'avvio butta ogni
`scuola:*` più vecchia di tre ore (quanto vive una lezione).

| Chiave | Chi la scrive | Cosa |
|---|---|---|
| `scuola:bambino` | `giro.js` (`ricorda`) | `{ forma: 'blocchi', codice, nato, stato: { fase, lezione, avanti, io, alunni }, cammino: { alunno, p, visto, conto } }` |
| `scuola:<CODICE>` | `rete.js` | il posto del PC, l'alunno, l'ultima `n` e la coda delle risposte ([protocollo.md](protocollo.md)) |

- **Riaprendo la pagina** si legge `scuola:bambino` e si riparte **subito** dallo stato ricordato, nello stesso blocco
  col suo conto (anche senza rete: le domande ricominciano e le risposte vanno in coda); il collegamento, con lo stesso
  posto, riporta lo stesso nome e corregge quello che è cambiato intanto (un «Avanti tutti» perso porta avanti).
- **Il cammino è di un nome**: se sullo stesso PC ne viene scelto un altro, riparte dal pavimento. Lo stesso nome
  ripreso da **un altro PC** riparte dal pavimento anche lui (il servizio non rimanda il conto delle risposte).
- **Si ricorda solo una lezione aperta**: a lezione chiusa la chiave si toglie, e una pagina riaperta chiede il
  codice. Un ricordo guasto, vecchio, con un codice storto o **nella forma di prima** (obiettivo e «dopo», senza
  `forma`) è come nessun ricordo; uno stato o un cammino guasti si buttano e resta il codice.
- **Una lezione nella forma di prima** (non la manda il servizio nuovo, ma per prudenza) si converte con
  `convertiLezione` appena arriva (`statoDa`).
- **La lezione che non c'è più** (il WebSocket chiuso con `4404`, `suNo('codice')`) riporta a `codice` senza
  nessun messaggio.
- localStorage vietato o pieno: si va avanti senza ricordo (ogni accesso è in un `try`).

## Quando la rete cade

I ripieghi della maestra (il tasto «Maestra», «Senza lezione», le pagine che si riaprono) stanno in [ripieghi.md](ripieghi.md).

- **Il bambino non si ferma**: le domande vengono dal PC, le risposte vanno nella coda di `rete.js` e partono
  al rientro. Niente errori rossi, niente blocchi.
- Un segno piccolo e grigio, «Sto ricollegando…», nella riga in cima (o sotto il titolo in `collego` e `nome`):
  appena il filo cade dopo essere stato su, oppure se al primo collegamento passano 3 s (`PAZIENZA`) senza
  linea. Sparisce da solo al rientro.
- Un nome toccato senza rete resta «Un momento…»: `rete.js` lo manda appena torna.

## I file

- `src/scuola/bambini/main.js` — monta l'app con lo stile e le emoji di casa.
- `src/scuola/bambini/App.vue` — il collegamento, i `watch` del giro, le schermate semplici.
- `src/scuola/bambini/giro.js` — `schermata`, `statoDa`, il cammino (`nuovoCammino`, `segui`, `entraNelBlocco`,
  `rispostaData`, `continua`, `segno`), il ricordo (`leggiRicordo`, `ricorda`, `dimentica`), `pulisciCodice`.
- `src/scuola/bambini/viste/` — `Codice.vue` (controlla il codice da sé), `Nomi.vue`, `Domande.vue` (pesca e
  mette in scena; chi la monta decide quando basta), `Asteroidi.vue` (il gioco vero, sopra).
- `src/scuola/bambini/profilo.js` — `bambinoInMemoria`, il profilo di casa per i giochi veri.

La pelle è quella delle schermate di contorno (`.schermo.pulito`, i valori di `style.css`,
[../core/pelle.md](../core/pelle.md)); niente animazioni nostre; i tasti dei nomi sono larghi almeno 190 px
e alti 60, e stanno in una griglia che si allarga fino a 960 px.

## La prova della maestra

Con `#prova=<la lezione>` nell'indirizzo (il «Prova la lezione» della pagina della maestra, [quaderno.md](quaderno.md)) la
pagina fa partire quella lezione come «Senza lezione», toglie l'hash e non la ricorda. Al posto del tasto «Maestra» c'è una
striscia gialla `[data-prova]` con «Blocco dopo» `[data-azione="prova-salta"]` e «Chiudi la prova» `[data-azione="chiudi-prova"]`.

Nei test: `unita/scuola-bambini` (codice, schermate, soglie a giuste, a domande e a minuti, «Avanti tutti» che porta
avanti e fa ripartire il conto, chi è già avanti resta, in tondo, finita, i colpi che non chiudono la domanda, la
lezione e il ricordo nella forma di prima, ripresa a pagina riaperta, il ricordo e i suoi guasti), `unita/scuola-profilo`
(`bambinoInMemoria` coi sostituti applicati in Node: suono spento, fascia bassa, lo stesso alunno tiene il profilo, un
altro riparte, la festa resta vuota, nessun accesso al disco). Bersagli: la radice ha
`[data-schermata="codice|collego|nome|aspetta|blocco|passaggio|finito|chiusa|guasta"]`; `[data-codice]` (il campo),
`[data-entra]`, `[data-codice-errore]`; `[data-collego]`; `[data-nomi]`, `[data-nome="<id alunno>"]` (con
`[data-preso]` se è di un altro), `[data-scelgo]`, `[data-nome-avviso]`, `[data-non-trovo]`, `[data-nome-nuovo]`
(il campo), `[data-nome-nuovo-manda]`, `[data-cambia-codice]`; `[data-aspetta]`; `[data-domanda]` con
`[data-blocco="<indice del blocco>"]` (dentro, i bersagli di `Domanda.vue`, come `[data-giusta]`, oppure il gioco
`[data-gioco="asteroidi"]` coi bersagli di [../asteroidi/scuola.md](../asteroidi/scuola.md)), `[data-segno]`;
`[data-passaggio]`, `[data-continua]`; `[data-finito]`; `[data-chiusa]`, `[data-altra-lezione]`; `[data-guasta]`;
`[data-ricollego]`; `[data-versione]`.
