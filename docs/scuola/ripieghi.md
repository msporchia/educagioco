# I ripieghi: quando qualcosa non va

Una lezione deve poter andare avanti anche se un gioco non parte, un PC è lento o internet manca. Ci sono tre livelli,
scelti dall'utente il 20 novembre 2026: la maestra cambia la lezione dal suo pannello; sul PC di un bambino c'è un menu
dietro il suo codice; e senza internet la maestra fa partire un gioco su ogni PC.

## Dal pannello della maestra (con la rete)

Nella diretta, il riquadro «Se qualcosa non va» (`maestra/Diretta.vue`):

- **«Cambia la lezione»** apre l'editor (`Lezione.vue` con `inCorso`) sulla lezione in corso; «Manda ai bambini» la
  spedisce col messaggio `lezione` ([protocollo.md](protocollo.md)), **senza un codice nuovo**. Ognuno resta alla sua
  posizione: se i blocchi sono meno, chi era oltre l'ultimo ha finito. Lo storico prende la lezione nuova (il
  resoconto la descrive), quella salvata nel quaderno resta com'era.
- **«Tutti alle domande»** (`alleDomande` di `comune/lezione.js`) toglie gioco e difficoltà a ogni blocco che si può fare
  a schede; un blocco che esiste solo dentro un gioco (i gradini di Passo passo) resta e la maestra lo sa.
- Per **un bambino solo**, sotto il suo nome: **«Salta il blocco»** (messaggio `salta`: un pavimento suo, come «Avanti
  tutti» ma per lui) e **«Le domande»** / «Torna al gioco» (`domande`: le schede al posto del gioco, finché lei non lo
  toglie).

Sul PC del bambino la vista del gioco si rifà quando la lezione cambia (`rifatta` nello `stato`, nella chiave della
vista).

## Il codice della maestra

Il menu sul PC e «Senza lezione» si aprono con **quattro cifre che cambiano ogni ora** (`comune/codice-maestra.js`), come
i codici a tempo delle banche: le due pagine le calcolano dall'ora, senza rete. La maestra le legge con «Codice per i PC»
(nella pagina d'inizio e nella diretta), nascosto finché non lo chiede perché la pagina può stare sulla LIM, e visibile per
un minuto. **Un codice letto vale almeno tre ore** (il PC accetta quelli delle tre ore prima e dell'ora dopo): la maestra
se lo segna a inizio mattina e non ha fretta, e la pagina dice fino a che ora vale (`valeFinoAl`). Scelto dall'utente il
20 novembre 2026: prima cambiava ogni cinque minuti, e metteva fretta.

- **A tentativi non si indovina**: dopo tre sbagli il PC aspetta un minuto, poi due, quattro… fino a mezz'ora
  (`attesaDopo`); il conto sta in `scuola:codice-maestra`, così chiudere il menu o riaprire la pagina non lo azzera.

- **Ferma i bambini, non un adulto**: il segreto è nel file pubblico, e nasconderlo non servirebbe. Un codice a chiave
  pubblica non si può: una firma verificabile è lunga decine di byte, non quattro cifre.
- **Un PC con l'orologio sbagliato** (succede, sui PC vecchi): la schermata del codice dice che ora segna; in «Il PC ha
  l'ora sbagliata?» la maestra scrive quell'ora e ha il codice giusto per lui.

## Sul PC del bambino: il tasto «Maestra»

Un tasto piccolo in basso a sinistra, in ogni schermata tranne il codice della lezione. Col codice apre un foglio
(`bambini/viste/MenuMaestra.vue`) che vale **solo per quel PC**:

- **«Le domande invece del gioco»** / «Torna al gioco»: il gioco va ma è lento, o il bambino è bloccato;
- **«Salta al blocco dopo»**: anche nei blocchi «quando lo dice la maestra», e anche senza rete (`salta` di `giro.js`);
- **«Cambia nome»**: il nome torna nella lista (messaggio `lascia`) e il PC rimostra i nomi; vuole la rete;
- **«Esci dalla lezione»**: libera il nome e torna al codice, così il bambino lo ritrova su un altro PC.

Una lezione già partita va avanti anche se la rete cade: le risposte restano in coda ([bambini.md](bambini.md)), e
il menu basta per i blocchi della maestra.

## Senza internet: «Senza lezione»

Sotto il codice della lezione c'è «Senza lezione (per la maestra)» (`bambini/viste/SenzaLezione.vue`): col codice,
la maestra sceglie **classe → gioco → una lezione pronta → quanto è difficile** e «Via», oppure «Scegli tu cosa chiedere»
(lo stesso editor di un blocco della sua pagina, un blocco solo che non finisce). La lezione gira sul PC senza servizio
(`statoSenzaLezione` di `giro.js`): le soglie passano da sole, i blocchi «quando lo dice la maestra» col menu; le
risposte non arrivano a nessuno. Si ricorda a pagina riaperta, come una lezione vera, e «Torna all'inizio» la toglie.
Le schermate della maestra sul PC hanno la sua pelle (`maestra.css`, tutta sotto `.maestra`).

## Le pagine si riaprono senza rete

Un indirizzo scritto a mano senza internet non apre niente. Le due pagine hanno un **service worker loro**
(`scuola/sw.js`, copiato in `dist-scuola/` e nella release): **prima la rete** (una versione nuova arriva subito), la copia
solo se la rete non risponde entro otto secondi. Basta che un PC abbia aperto la pagina una volta con la rete; la
chiavetta resta per quelli che non l'hanno mai aperta. Dal file (`file://`) il service worker non c'è e non serve.

Scartato: **il file dei bambini con la lezione dentro**, scaricato dal quaderno. Va copiato su ogni PC, magari in un
momento concitato; la pagina che si riapre da sola e «Senza lezione» fanno lo stesso senza chiavetta.

Nei test: `unita/scuola-codice-maestra` (quattro cifre, l'ora, le tre ore in cui vale, quasi mai uguali, l'attesa che raddoppia), in
`unita/scuola-bambini` «I ripieghi» (il pavimento suo, `salta`, senza lezione e il suo ricordo), in `unita/scuola-lezione`
`alleDomande`, in `unita/scuola-servizio` e `unita/scuola-rete` i messaggi `lezione`, `salta`, `domande`, `lascia`.
Nel browser `integrazione/scuola` (le domande per lui dal pannello, il menu col codice, «Tutti alle domande», «Cambia la
lezione») e `integrazione/scuola-senza-rete`: le due pagine da un sito vero, il sito spento e la cache svuotata, si
riaprono; il codice letto dalla pagina della maestra apre «Senza lezione» sul PC, la seconda a schede, si risponde, il
menu salta al blocco dopo, a pagina riaperta si è ancora lì.
Bersagli: `[data-azione=maestra|senza-lezione|codice-maestra|chiudi-menu|domande|salta|cambia-nome|esci|via-senza|scelta-tua
|mostra-codice-pc|cambia-lezione|tutti-alle-domande|manda-lezione]`, `[data-campo=codice-maestra|ora-del-pc]`,
`[data-menu-maestra]`, `[data-senza-lezione]`, `[data-codice-pc]`, `[data-codice-altra-ora]`, `[data-se-non-va]`,
`[data-solo-domande]`, `[data-cambia-in-corso]`, `[data-ora-del-pc]`, `[data-codice-maestra-errore]`, `[data-schermata=senza]`,
`[data-vale-fino]`.
