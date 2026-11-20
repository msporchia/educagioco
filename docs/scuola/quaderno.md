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
- **L'anno della classe è facoltativo** (`anno`: 1..5, la primaria): una classe senza anno non ha il campo, così un
  quaderno o un file di prima si aprono uguali; un anno storto si toglie e la classe resta. Serve solo a proporre
  le lezioni pronte: se le classi che lo dicono dicono tutte lo stesso (`annoDelleClassi`), è già scelto.
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
  chiave si butta.
- In sala il verde è «preso» (un PC tiene quel nome, anche se in questo momento è caduto); nel pannello il grigio
  è «non collegato». «Sblocca il nome» (era «Libera») compare su chi è collegato o ha già fatto qualcosa.

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
| `inizio` | la lezione in corso (se c'è), come funziona in quattro passi, l'indirizzo e il file dei bambini (`./index.html` scaricato come `educagioco-classe.html`), classi, lezioni, storico per classe, salva/apri il quaderno |
| `classe` | nome, l'anno (1ª–5ª o «non lo dico») e alunni uno per riga; cancella (lo storico resta) |
| `nuova` | il percorso di «Nuova lezione», sotto |
| `lezione` | nome e la fila dei blocchi (sotto); salva solo una lezione valida e torna all'inizio; copia il link, duplica, cancella |
| `link` | una lezione arrivata da un link |
| `avvia` | la scelta della classe e l'avvio |
| `diretta` | per la LIM: in attesa il codice enorme, l'indirizzo, i nomi che diventano verdi e «Via»; poi «Avanti tutti», «La classe» divisa per blocco e un riquadro per bambino (pallini dei blocchi, fatte e giuste del blocco in corso, le ultime sbagliate), i suoi comandi, «Chiudi lezione» |
| `resoconto` | i blocchi della lezione, tabella per bambino con una colonna per blocco («non c'era» per chi non è entrato), le domande più sbagliate della classe, Stampa, Scarica CSV, Recupera, «Aggiungi alla classe» per i nuovi |
| `storico` | per classe le lezioni fatte con la data e i bambini |
| `bambino` | lezione per lezione fatte e giuste in tutto e blocco per blocco, e le domande che sbaglia più spesso |

## L'editor della lezione

Una carta per blocco, nell'ordine: **il gioco, cosa si fa e quanto è difficile** (`SceltaEsercizio.vue`,
[esercizi.md](esercizi.md)) e **quando si passa al blocco dopo**: una riga sola, «Al blocco dopo si passa quando lo dice
la maestra», con «Cambia» che apre le scelte (prima «Lo dici tu», poi giuste, domande, minuti con le parole del gioco:
[lezione.md](lezione.md)), ognuna col suo «?»; scegliendo una soglia il numero riparte dal suo `base`. Ogni blocco si
sposta su e giù e si toglie (l'ultimo che resta no); «＋ Aggiungi un blocco», fino a `MAX_BLOCCHI`, ripete l'esercizio
dell'ultimo e passa quando lo dice la maestra. Sotto l'ultimo una riga dice cosa succede
dopo («Hai finito!», si resta lì fino ad «Avanti tutti», o si ricomincia). «In tondo» è una spunta.

- **Il gioco ha il suo disegno** (`TesseraGioco.vue`): l'icona dipinta della copertina di casa (`comune/icone-giochi.js`; nella
  build il plugin `iconeGiochi` di `vite.scuola.config.js` ci lascia solo le nove della scuola, ~300 KB invece dei 2,7 MB
  di tutte le copertine), un foglio per le domande. Si vede solo il gioco scelto, con «Cambia gioco» che li mostra tutti.
  Le descrizioni dei giochi non parlano del PC: si suppone che reggano (scelta dell'utente).
- **Cosa si fa** sono tessere: le materie (se il gioco ne ha più d'una) e le voci di quella materia, solo quelle che il
  gioco sa fare. La spiegazione della voce c'è solo quando c'era da scegliere.
- **Un esempio vero** per ogni voce del catalogo (`Esempio.vue`): una domanda pescata come la pescherà il gioco, con le
  risposte e la giusta segnata, e «Un'altra». I giochi col contenuto loro hanno le scelte come **righe** (`Righe.vue`) col
  caso concreto scritto sotto (cosa chiede, cosa fa il bambino), non tessere col nome solo: «il banco» o «l'unità grande»
  non dicevano niente.
- **Il «?»** (`Aiuto.vue`) accanto alle scelte meno chiare: un tocco apre due righe, un tocco fuori le chiude (col dito
  niente tooltip).
- **Quanto è difficile**: tre tasti con tre tacche che si riempiono, e una riga su cosa cambia.

## Il pannello in diretta

- **Dove sta un bambino**: la posizione `dove` che manda (o `'finito'`), almeno il pavimento di «Avanti tutti»
  (`posizione`): chi è scollegato lo raggiunge al rientro, e il pannello lo mette già lì. Si dice «blocco 2 di 3» e,
  in tondo, «giro 2»; con un blocco solo «al lavoro».
- **Le giuste e le fatte del blocco in corso**, di questo giro, con la soglia se il blocco passa da solo («6 giuste
  su 10»; nel coniglio «2 livelli su 3»).
- **A colpo d'occhio** (chiesto dall'utente): «La classe» divide i bambini per blocco, una colonna per blocco col disegno del
  suo gioco e una per chi ha finito, coi tondi delle iniziali (grigi se scollegati); sotto ogni nome i pallini dei blocchi
  (fatti verdi, quello in corso blu), la barra verso la soglia e una barretta verde e rossa delle giuste e delle sbagliate.
- **«Avanti tutti»** c'è sempre in fase `via` e chiama `avanti()` di [protocollo.md](protocollo.md); accanto dice dove
  porta chi è più indietro fra i collegati (come lo calcola il servizio). È spento solo quando senza «in tondo» tutti
  hanno già passato l'ultimo blocco.
- **«Se qualcosa non va»**: «Cambia la lezione», «Tutti alle domande», il codice per i PC; sotto ogni nome «Mandalo al
  blocco dopo», «Domande invece del gioco», «Sblocca il nome», ognuno col suo «?». Tutto in [ripieghi.md](ripieghi.md).

## «Nuova lezione»: il percorso guidato

`NuovaLezione.vue`, una schermata sola che si apre a passi, uno sotto l'altro: **per quale classe** (1ª–5ª, coi
nomi delle classi del quaderno di quell'anno; già scelto con `annoDelleClassi`) → **in che gioco** (col disegno, quelli
con lezioni pronte per l'anno) → **le lezioni pronte** di [lezioni-pronte.md](lezioni-pronte.md) di quel gioco, a gruppi
per materia, col nome e come si svolgono.
Toccata una, si apre l'editor (`lezione`) già compilato con un id nuovo: la maestra cambia quello che vuole e
salva. «Preparala tu» apre l'editor di sempre, vuoto. Le scelte restano finché la pagina è aperta: tornando
indietro dall'editor si ritrovano.

La stampa toglie barra, tasti e ombre (`.no-stampa`, `@media print` in `maestra.css`).

Nei test: `unita/scuola-quaderno` (gli id stabili, la lista incollata, `lezioneValida`, il link andata e
ritorno e manomesso, il riassunto per blocco che `tutto` non raddoppia, i giri sommati in tondo e i conti per
posizione, le più sbagliate, il CSV, lo storico del bambino, la scadenza, le chiavi di localStorage, il file storto e
l'unione per id, l'anno della classe che un quaderno vecchio non ha, e le lezioni, lo storico, la lezione in corso, il
file e il link di prima dei blocchi) e `unita/scuola-lezioni-pronte`. Bersagli: la radice `[data-schermata="<nome>"]`,
`button[aria-label="indietro"]`, `[data-versione]`, `[data-avviso="pieno"|"link-rotto"]`; nell'inizio
`[data-in-corso]`, `[data-indirizzo-bambini]`, `[data-classe=<id>]`, `[data-lezione=<id>]`, `[data-storico-classe=<id>]`,
`[data-file-quaderno]` (l'input del file), `[data-esito-file="bene"|"male"]`, `[data-link-lezione]`; nell'esercizio a più parti
`[data-parte=<i>]`, `[data-peso="poco"|"normale"|"tanto"]`, `[data-azione="aggiungi-parte"|"togli-parte"]`; negli editor
`[data-campo="nome-classe"|"alunni"|"nome-lezione"|"da"|"a"|"soglia"|"in-tondo"]`,
`[data-esercizio="blocco"]`, `[data-scegli-gioco]`, `[data-azione="cambia-gioco"]`, `[data-materia=<id>]`, `[data-voce=<id>]`,
`[data-mescola]`, `[data-difficolta]`, `[data-esempio]` (con `[data-giusta]`), `[data-azione="altro-esempio"|"cambia-passa"]`, `[data-passa-scelto=<modo>]`, `[data-aiuto]`, `[data-aiuto-testo]`, `[data-panoramica]` con `[data-colonna=<i>|"finito"]`, `[data-tabellina=<n>]`, `[data-modo]`, `[data-tipologia]`, `[data-gioco=<id>]`,
`[data-descrizione]`, `[data-problema]`, `[data-da-pronta]`; nell'editor della lezione un blocco è `[data-blocco=<i>]`
(da 0), con `[data-passa="giuste"|"domande"|"minuti"|"maestra"]` e `[data-campo="soglia"]`; nella classe `[data-anno=<1..5>|""]`;
nel percorso `[data-percorso]`, `[data-passo="anno"|"gioco"|"lezioni"]`, `[data-anno=<n>]`, `[data-materia=<id>]` (un gruppo),
`[data-gioco=<id>]`, `[data-pronta=<id>]`; nella lezione `[data-diretta]`, `[data-linea]`,
`[data-sala]`, `[data-codice]`, `[data-alunno=<id>]` (con `data-preso` in sala e `data-dove` nel pannello: la
posizione col pavimento, `finito` o vuoto), `[data-blocco-in-corso]`, `[data-avanti=<pavimento>]`,
`[data-pannello]`, `[data-messaggio]`; nel resoconto `[data-resoconto]`, `[data-tabella-resoconto]` (una cella `[data-blocco=<i>]` per blocco),
`[data-piu-sbagliate]`, `[data-esito-recupero]`; nello storico `[data-storico-di="classe"|"bambino"]`, `[data-voce]`,
`[data-sbaglia]`. I tasti: `[data-azione="…"]` con `nuova-classe`, `modifica-classe`, `salva-classe`,
`cancella-classe`, `storico-classe`, `nuova-lezione`, `preparala-tu`, `modifica-lezione`, `salva-lezione`, `duplica`, `copia-link`,
`cancella-lezione`, `aggiungi-blocco`, `togli-blocco`, `su`, `giu`, `avvia`, `avvia-lezione`, `aggiungi-al-quaderno`, `salva-quaderno`, `apri-quaderno`,
`scarica-pagina-bambini`, `torna-alla-lezione`, `via`, `avanti-tutti`, `libera`, `togli`, `chiudi-lezione`, `conferma-chiudi`,
`chiudi-solo-qui`, `annulla`, `stampa`, `csv`, `recupera`, `aggiungi-alla-classe`, `apri-resoconto`; un tasto con
«sicura?» (cancella, togli) si conferma con `[data-azione="conferma"]`.
