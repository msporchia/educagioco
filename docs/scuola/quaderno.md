# Il quaderno della maestra

Quello che vale nel tempo sta **solo nel browser della maestra** ([progetto.md](progetto.md)): le classi, le
lezioni preparate, lo storico e la lezione in corso. Il codice è `src/scuola/maestra/`:

| File | Cosa |
|---|---|
| `quaderno.js` | la logica pura (gira in Node): forma, nomi e id, lezioni, link, storico, CSV, localStorage, il file |
| `stato.js` | il quaderno reattivo della pagina e il salvataggio |
| `diretta.js` | la lezione in corso: `creaLezione` e `apriMaestra` di [protocollo.md](protocollo.md) che scrivono nel quaderno |
| `App.vue` | la pila delle schermate (← toglie l'ultima), la barra, la versione in un angolo |
| le altre `.vue` | una per schermata (sotto), più `SceltaEsercizio.vue` (l'editor di un esercizio) e `Conferma.vue` («sicura?») |

La barra è sua e non `components/Barra.vue`: quella importa `store/profile.js`, che la guardia del pacchetto vieta.

## Le chiavi di localStorage

`scuola:classi`, `scuola:lezioni`, `scuola:storico`, `scuola:in-corso` (questa c'è solo durante una lezione).
Quattro e non una perché lo storico cambia a ogni risposta: si riscrive al più una volta al secondo (e subito
alla `pagehide`), il resto subito. Nessuna ha la forma `scuola:<CODICE>` delle code dei bambini, che la pagina
dei bambini butta dopo tre ore (le due pagine stanno sullo stesso indirizzo: la maestra può provare quella dei
bambini sul suo PC). Se il browser non scrive (pieno, vietato) la pagina lo dice e chiede di salvare il file.

Una chiave rovinata si legge come vuota e il resto si carica; una voce storta si lascia fuori. Una lezione il cui
esercizio non c'è più nel catalogo **si tiene** (si vede «Esercizio non valido» e non si avvia): il catalogo che
cambia non deve far sparire il lavoro.

## La forma

```js
classi:  [{ id: 'c…', nome, anno?, alunni: [{ id: 'a…', nome }] }]   // nome della classe ≤ 40, alunni ≤ 40, nome ≤ 24
lezioni: [{ id: 'l…', nome, blocchi: [{ esercizio, passa }], inTondo }]   // la lezione a blocchi, lezione.md
storico: [{ id: 'v…', classe, nomeClasse, lezione, avviata, codice, chiave, scade, chiusa,
            alunni: [{ id, nome, nuovo }],
            esiti: { <alunno>: { presente, blocchi: [{ fatte, giuste }],          // uno per blocco della lezione
                                 sbagliate: [{ fatto, attesa, volte, dette: [...] }],
                                 ultime: [{ blocco, fatto, data, attesa }] } } }]
inCorso: { codice, chiave, scade, avviata, classe, lezione, voce } | null
```

- **Gli id degli alunni sono stabili**: riscrivendo la lista, un nome uguale (senza badare a maiuscole e spazi)
  riprende l'id di prima, nell'ordine (il primo «Luca» il primo id di «Luca»). Un nome cambiato è un alunno nuovo.
  Due nomi uguali nella stessa classe non si salvano: il bambino non saprebbe quale toccare.
- **L'anno della classe** (`anno`: 1..5) non si chiede più: serviva a proporre le lezioni pronte, che sono state tolte.
  Un quaderno che lo ha si apre uguale e lo tiene; un anno storto si toglie e la classe resta.
- **La lista si può incollare**: una riga per nome; le colonne di un foglio di calcolo diventano spazi, i numeri e
  i puntini di un elenco si tolgono; un nome oltre 24 lettere si accorcia e la pagina lo dice.
- **Un «nuovo»** («Non trovo il mio nome») ha l'id che gli dà il servizio (`n…`); «Aggiungi alla classe» lo mette
  nella classe con quello stesso id, così lo storico lo ritrova.
- **La voce dello storico tiene la classe com'era** (`nomeClasse`, `alunni`): cancellare una classe non cancella
  il suo storico, che resta nella pagina d'inizio con «classe cancellata».
- **Una lezione si salva solo se è valida**: `lezioneValida` del quaderno è quella di `comune/lezione.js`, più un nome
  che non sia solo spazi e un id che sta in un attributo. Una lezione nuova ha un blocco che passa quando lo dice
  la maestra (`passaDiBase`).

## Le cose di prima dei blocchi

Nessuno perde niente: quello che è stato salvato con obiettivo e «se hai finito» si legge a blocchi
(`convertiLezione` di [lezione.md](lezione.md)), all'apertura della pagina come da un file o da un link.

- **Le lezioni** (in `scuola:lezioni`, nel file, nel `#lezione=` di un link vecchio) diventano due blocchi:
  l'obiettivo che passa dopo quelle domande o quei minuti, il «se hai finito» che passa quando lo dice la maestra.
- **Lo storico**: la lezione della voce si converte, e `obiettivo` e `dopo` di ogni riassunto sono i blocchi 1 e 2;
  le ultime sbagliate passano da `parte` a `blocco`. Una risposta che arriva ancora con `parte` va nel blocco 1 o 2.
- **La lezione in corso** (`scuola:in-corso`) si converte anche lei, per il pannello.

## Lo storico è un riassunto

Non ogni risposta: per alunno e lezione fatte e giuste **blocco per blocco**, le domande sbagliate raccolte per
`fatto` e `attesa` (quante volte, e le ultime tre risposte date, `dette`; al più le venti più sbagliate) e le
ultime tre sbagliate per il pannello. `presente`: ha risposto o è stato visto collegato.

- Una risposta porta `blocco`, la posizione del bambino quando ha risposto; il blocco è `blocco % blocchi.length`.
  **In tondo i giri si sommano**: il riassunto dice quanto ha fatto in quel blocco in tutta la lezione.
- Il pannello vuole invece il blocco **di questo giro**: `contaPosizione` e `contiDelleRisposte` contano per
  posizione, in `diretta.conti`, che non si salva (`tutto` lo rifà).

- `risposta` aggiunge al riassunto; **`tutto` lo rifà da capo** con tutte le risposte che il servizio tiene:
  così un rientro (la maestra si ricollega) non conta niente due volte, e un nuovo tolto esce con le sue.
- `alunni` aggiorna la lista della voce (entrano i nuovi, escono quelli tolti) e segna chi è presente.

## La lezione in corso

- **Avvia**: `creaLezione(lezione, alunni della classe)`; subito la voce nello storico e `inCorso`, poi
  `apriMaestra`. Una lezione alla volta: con una in corso «Avvia» è spento.
- **Riaprire la pagina** la ritrova: con `inCorso` si ricollega da sé e va alla schermata della lezione.
- **Scadenza** (`scade`, del servizio): all'apertura e allo scadere una lezione in corso si chiude da sé, e
  ogni voce scaduta perde la chiave. Nessun errore: il servizio ha già cancellato tutto.
- **Chiudi lezione** chiede conferma. Con la linea manda `chiudi` e aspetta la fase `chiusa`; senza linea offre
  «Chiudi solo qui» (i PC dei bambini non lo sanno: è l'uscita quando la rete della scuola è giù).
- **Recupera i risultati**, nel resoconto di una lezione chiusa qui, finché c'è la chiave e non è scaduta: un
  collegamento solo per prendere `tutto`, rifare il riassunto e chiudere. Se il servizio non la conosce più, la
  chiave si butta. La pagina lo dice senza nominare il servizio: «La lezione e i risultati sono salvati su questo
  computer», e le tre ore stanno nel «?» del tasto. Scritto prima come «il servizio tiene la lezione per tre ore»: sembrava
  che in locale non si salvasse niente.
- In sala il verde è «preso» (un PC tiene quel nome, anche se in questo momento è caduto); nel pannello il grigio
  è «non collegato». «Rimetti nella lista» (prima «Libera», poi «Sblocca il nome»: nessuno dei due diceva cosa
  succede) compare su chi è collegato o ha già fatto qualcosa.

## Il file del quaderno

«Salva il quaderno» scarica `quaderno-scuola-AAAA-MM-GG.json`:

```js
{ formato: 'educagioco-quaderno', versione: 1, salvato: '<ISO>', classi, lezioni, storico }
```

La lezione in corso non viaggia: codice e chiave stanno già nella sua voce, finché servono. La pagina dice che
**questo file è l'unica copia di sicurezza**.

«Apri un quaderno» legge il file (`leggiQuaderno`): non JSON, un altro formato o una versione più nuova sono
rifiutati con la frase da dire; le voci storte si lasciano fuori e si contano. Poi **unisce per id** (`unisci`):
una voce con lo stesso id si sostituisce, le altre si aggiungono, niente si cancella; riaprire lo stesso file non
raddoppia niente. La voce della lezione in corso non si sovrascrive.

## Il link di una lezione

`maestra.html#lezione=<la lezione in JSON, UTF-8, base64url>`. Aperto, la pagina toglie l'hash e mostra la
lezione con «Aggiungi al quaderno» (stesso id: sostituisce) e «Avvia». Un link di prima dei blocchi si converte.
Un link troncato o manomesso (un
esercizio con una chiave in più, una lezione che `lezioneValida` rifiuta) non entra: la pagina d'inizio dice che
è rotto.

## Il CSV

Punto e virgola, a capo `\r\n`, con il BOM davanti (il foglio di calcolo italiano lo apre con gli accenti).
Colonne: Bambino, Nuovo, per ogni blocco «Blocco N: fatte» e «Blocco N: giuste», Domande sbagliate
(«9 × 7 → 63 (2 volte)»). Un nome che comincia con `= + - @` prende un apostrofo davanti: non diventa una formula.

## Le schermate

| Schermata | Cosa |
|---|---|
| `inizio` | la lezione in corso (se c'è), come funziona in quattro passi, i primi passi finché mancano classe o lezione (sotto), l'indirizzo e il file dei bambini (`./index.html` scaricato come `educagioco-classe.html`), classi, lezioni, storico per classe, salva/apri il quaderno |
| `classe` | nome, l'anno (1ª–5ª o «non lo dico») e alunni uno per riga; cancella (lo storico resta) |
| `lezione` | nome e la fila dei blocchi (sotto); salva solo una lezione valida e torna all'inizio; copia il link, duplica, cancella |
| `link` | una lezione arrivata da un link |
| `avvia` | la scelta della classe e l'avvio |
| `diretta` | per la LIM: in attesa il codice enorme, l'indirizzo, i nomi che diventano verdi e «Via»; poi «Avanti tutti», «La classe» divisa per blocco e un riquadro per bambino (pallini dei blocchi, fatte e giuste del blocco in corso, le ultime sbagliate), i suoi comandi, «Chiudi lezione» |
| `resoconto` | i blocchi della lezione, tabella per bambino con una colonna per blocco («non c'era» per chi non è entrato), le domande più sbagliate della classe con chi le ha sbagliate e cosa ha detto, Stampa, Scarica CSV, Recupera, «Aggiungi alla classe» per i nuovi |
| `storico` | per classe le lezioni fatte con la data e i bambini |
| `bambino` | lezione per lezione fatte e giuste in tutto e blocco per blocco, e le domande che sbaglia più spesso |

## I primi passi

Chiesto dall'utente il 22 novembre 2026: senza classe non si va avanti. Finché il quaderno non ha **una classe e una
lezione**, la pagina d'inizio ha solo come funziona e «Per cominciare» (`[data-primi-passi]`, `data-passo` `classe` o
`lezione`): 1. la classe («Crea la classe»), 2. la prima lezione («Prepara la lezione», spenta finché manca la classe); un
passo fatto ha la spunta, il nome e «Modifica». Lezioni, classi, la pagina dei bambini (col codice per i PC e la prova del
computer), lo storico e il quaderno compaiono con tutte e due. **«Apri il quaderno» c'è anche prima**: su un PC nuovo si
riparte dal file, e non può aspettare la classe. Nei test che guardano il resto, `test/aiuto/quaderno-scuola.mjs` semina una
classe e una lezione.

L'editor della lezione e la scelta del gioco: [editor.md](editor.md).

## La pelle

Chiesto dall'utente il 20 novembre 2026 («tutto molto triste e tabellare»). Un'idea sola, in `maestra.css`: **il foglio a
quadretti** del quaderno di scuola come fondo, e **i colori delle penne** (`--penna` blu per fare, `--corretto` verde,
`--correzione` rossa, `--evidenziatore` giallo per i codici da scrivere alla lavagna). Il resto resta la pelle pulita di casa.

- **I bambini sono tondi con le iniziali**, ognuno col colore che il suo nome sceglie (`iniziali` e `coloreDi` di
  `utili.js`): nelle classi, nella diretta, nel resoconto e nello storico.
- **Il resoconto non è una tabella**: in testa quanti bambini, quante risposte e la percentuale di giuste; i blocchi col
  disegno del loro gioco; una riga per bambino con una barra verde e rossa per blocco, la percentuale (verde da 80, gialla
  da 50, rossa sotto) e i suoi sbagli. La tabella c'è ancora, solo in stampa (`.solo-stampa`), ed è quella del CSV.
- **L'inizio**: come funziona in quattro passi numerati; **una lezione per riga, su tutta la larghezza** (segnalato
  dall'utente: la scheda stretta faceva una frase unica illeggibile): il nome e i tasti in una riga, sotto un riquadro per
  blocco (`[data-blocco-lezione]`) col disegno del gioco, le cose che si chiedono una per riga (`vociDelBlocco` di
  `utili.js`: le parti mescolate separate, non col «+»), la difficoltà e quando si passa. Le classi restano schede con le
  iniziali dei bambini.

## Il pannello in diretta

- **Dove sta un bambino**: la posizione `dove` che manda (o `'finito'`), almeno il pavimento di «Avanti tutti»
  (`posizione`): chi è scollegato lo raggiunge al rientro, e il pannello lo mette già lì. Si dice «blocco 2 di 3» e,
  in tondo, «giro 2»; con un blocco solo «al lavoro».
- **Le giuste e le fatte del blocco in corso**, di questo giro, con la soglia se il blocco passa da solo («6 giuste
  su 10»; nel coniglio «2 livelli su 3»).
- **A colpo d'occhio** (chiesto dall'utente): «La classe» divide i bambini per blocco, una colonna per blocco col disegno del
  suo gioco e una per chi ha finito, coi tondi delle iniziali (grigi se scollegati); sotto ogni nome i pallini dei blocchi
  (fatti verdi, quello in corso blu), la barra verso la soglia e una barretta verde e rossa delle giuste e delle sbagliate.
- **«Chiudi il blocco N»** («Avanti tutti» nel codice) c'è sempre in fase `via` e chiama `avanti()` di
  [protocollo.md](protocollo.md): il tasto dice quale blocco chiude, la frase accanto chi passa e dove (come lo calcola il
  servizio), un «?» lo spiega, e nella panoramica quel blocco ha il bordo blu. È spento solo quando senza «in tondo» tutti
  hanno già passato l'ultimo blocco.
- **Una domanda sbagliata si scrive con l'errore** (`Sbaglio.vue`, l'utente: «eviterei di spiegare alla maestra che 5+5 fa
  10»): il conto, «✗ 8» in rosso (cosa ha detto il bambino, `dette`), «✓ 10» in verde, o «nessuna risposta» per il sasso
  caduto. Nel resoconto, nelle più sbagliate (con i nomi di chi l'ha sbagliata, non «un bambino») e nello storico del
  bambino. In `[data-sbaglio]`, `[data-chi-sbaglia]`.
- **Il codice resta grande dopo «Via»** (`[data-codice-sempre]`, chiesto dall'utente): chi chiude il browser per sbaglio o
  arriva tardi rientra leggendolo, con l'indirizzo accanto.
- **I bambini nascono chiusi** (chiesto dall'utente: aperti, uno riempiva lo schermo del telefono): la scheda dice nome, dove
  sta, pallini, barre, fatte e giuste e i conti delle risposte (`[data-conti]`); toccata (`[data-azione="apri-bambino"]`,
  `data-aperto`) si allarga a tutta la riga con le risposte e i comandi.
- **Le risposte**: nella scheda aperta, per blocco, l'ultima in cima: ✓ giusta, ✗ «ha detto X, era Y», – «non ha risposto» (il
  sasso giusto degli Asteroidi caduto: spesso un gioco lasciato acceso). Vengono da `diretta.risposte`, che non si salva:
  lo storico tiene il riassunto.
- **«Se qualcosa non va»**: «Cambia la lezione», «Tutti alle domande», il codice per i PC; sotto ogni nome «Mandalo al
  blocco dopo» col suo «?», e i casi rari nel menu «⋯» (`Altro.vue`), ognuno spiegato sotto il suo nome: «Domande invece
  del gioco» e «Rimetti il nome nella lista». Tutto in [ripieghi.md](ripieghi.md).

## Le lezioni pronte sono state tolte

Il 20 novembre 2026, per scelta dell'utente: «fanno solo casino». Erano una sessantina per anno e materia, col percorso
classe → gioco → lezione; chi il gioco non lo conosce si trovava due blocchi già fatti e non capiva da dove partire.
«Nuova lezione» apre l'editor vuoto, e «Senza lezione» sul PC del bambino è la stessa scelta di gioco e domande.

La stampa toglie barra, tasti e ombre (`.no-stampa`, `@media print` in `maestra.css`).

Nei test: `unita/scuola-quaderno` (gli id stabili, la lista incollata, `lezioneValida`, il link andata e
ritorno e manomesso, il riassunto per blocco che `tutto` non raddoppia, i giri sommati in tondo e i conti per
posizione, le più sbagliate, il CSV, lo storico del bambino, la scadenza, le chiavi di localStorage, il file storto e
l'unione per id, l'anno della classe che un quaderno vecchio non ha, e le lezioni, lo storico, la lezione in corso, il
file e il link di prima dei blocchi). Bersagli: la radice `[data-schermata="<nome>"]`,
`button[aria-label="indietro"]`, `[data-versione]`, `[data-avviso="pieno"|"link-rotto"]`; nell'inizio
`[data-in-corso]`, `[data-indirizzo-bambini]` (un link), nella diretta `[data-risposte]` con
`[data-risposte-blocco=<i>]` e `[data-esito="si"|"no"|"vuota"]`, `[data-azione="altro"]` (il «⋯»), `[data-classe=<id>]`, `[data-lezione=<id>]`, `[data-storico-classe=<id>]`,
`[data-file-quaderno]` (l'input del file), `[data-esito-file="bene"|"male"]`, `[data-link-lezione]`; nell'esercizio a più parti
`[data-parte=<i>]`, `[data-peso="poco"|"normale"|"tanto"]`, `[data-azione="aggiungi-parte"|"togli-parte"]`; negli editor
`[data-campo="nome-classe"|"alunni"|"nome-lezione"|"da"|"a"|"soglia"|"in-tondo"]`,
`[data-esercizio="blocco"]`, `[data-scegli-gioco]`, `[data-scheda-gioco]`, `[data-elenco-domande]` con `[data-materia-elenco=<id>]` e `[data-voce=<id>]`, `[data-azione="prova-lezione"|"preparala-nel-gioco"]`, `[data-materia=<id>]`, `[data-voce=<id>]`,
`[data-mescola]`, `[data-difficolta]`, `[data-esempio]` (con `[data-giusta]`), `[data-azione="altro-esempio"|"cambia-passa"]`, `[data-passa-scelto=<modo>]`, `[data-aiuto]`, `[data-aiuto-testo]`, `[data-panoramica]` con `[data-colonna=<i>|"finito"]`, `[data-tabellina=<n>]`, `[data-modo]`, `[data-tipologia]`, `[data-gioco=<id>]`,
`[data-descrizione]`, `[data-problema]`, `[data-azione="prova-blocco"]`; nell'editor della lezione un blocco è `[data-blocco=<i>]`
(da 0), con `[data-passa="giuste"|"domande"|"minuti"|"maestra"]` e `[data-campo="soglia"]`; nella lezione `[data-diretta]`, `[data-linea]`,
`[data-sala]`, `[data-codice]`, `[data-alunno=<id>]` (con `data-preso` in sala e `data-dove` nel pannello: la
posizione col pavimento, `finito` o vuoto), `[data-blocco-in-corso]`, `[data-avanti=<pavimento>]`,
`[data-pannello]`, `[data-messaggio]`; nel resoconto `[data-resoconto]`, `[data-pagella]` (una riga `[data-alunno=<id>]`, un blocco `[data-blocco=<i>]`), `[data-tabella-resoconto]` (solo in stampa, una cella `[data-blocco=<i>]` per blocco),
`[data-piu-sbagliate]`, `[data-esito-recupero]`; nello storico `[data-storico-di="classe"|"bambino"]`, `[data-voce]`,
`[data-sbaglia]`. I tasti: `[data-azione="…"]` con `nuova-classe`, `modifica-classe`, `salva-classe`,
`cancella-classe`, `storico-classe`, `nuova-lezione`, `preparala-tu`, `modifica-lezione`, `salva-lezione`, `duplica`, `copia-link`,
`cancella-lezione`, `aggiungi-blocco`, `togli-blocco`, `su`, `giu`, `avvia`, `avvia-lezione`, `aggiungi-al-quaderno`, `salva-quaderno`, `apri-quaderno`,
`scarica-pagina-bambini`, `torna-alla-lezione`, `via`, `avanti-tutti`, `libera`, `togli`, `chiudi-lezione`, `conferma-chiudi`,
`chiudi-solo-qui`, `annulla`, `stampa`, `csv`, `recupera`, `aggiungi-alla-classe`, `apri-resoconto`; un tasto con
«sicura?» (cancella, togli) si conferma con `[data-azione="conferma"]`.
