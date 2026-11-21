# Il progetto

**Stato: in costruzione** (18 novembre 2026; le scelte sono dell'utente). Gli esercizi vengono dai moduli di
quiz, a schede, oppure si fanno in un **gioco vero** di casa limitato all'esercizio: il primo sono gli Asteroidi,
con le tabelline.

## Per chi e perché così

Per le maestre, con i PC della scuola: lenti, browser qualunque, una rete che cade a ondate e nessuna
rete interna su cui contare. Quindi:
- **un'app a parte, leggera per costruzione**: entra solo quello che la pagina importa (niente guide,
  «installa», amici, aggiornamenti, service worker; il 3D e lo store di casa solo nella pagina dei bambini, per i
  giochi veri, con l'archivio in memoria) → [architettura.md](architettura.md);
- **il coordinamento passa dal servizio che c'è già** (`servizio/inoltro`, Cloudflare): basta che i PC
  raggiungano internet → [protocollo.md](protocollo.md);
- **il servizio è di passaggio**: tiene una lezione al massimo 3 ore dall'avvio e poi la cancella da sé.
  Quello che vale nel tempo sta **solo sul PC della maestra** → [quaderno.md](quaderno.md).

## Il giro di una lezione

1. **Prima, con calma.** La maestra apre la sua pagina (`…/scuola/maestra.html`), crea la classe con i
   nomi degli alunni e prepara le lezioni, di solito partendo da una pronta: una **fila di blocchi**, ognuno
   con cosa si chiede, in che gioco e quando si passa al blocco dopo (da solo dopo X giuste, N domande o M
   minuti, oppure quando lo dice lei) → [lezione.md](lezione.md). Tutto resta nel suo browser; «Salva il
   quaderno» lo scarica in un file che si riapre su un altro PC.
2. **I PC dei bambini** aprono la pagina dei bambini: dall'indirizzo (`…/scuola/`) oppure dal file
   unico copiato con la chiavetta (doppio click, si apre dal disco: sui PC lenti parte prima). Il file è
   **uguale per tutte le classi**: non porta dentro né la classe né la lezione.
3. **«Avvia»**: la maestra sceglie lezione e classe; il servizio risponde con un **codice di 4 cifre**,
   che lei scrive grande alla lavagna. I bambini lo scrivono, **toccano il loro nome** nella lista della
   classe (un nome preso diventa grigio; «Non trovo il mio nome» per chi manca) e aspettano.
4. **«Via»**: su tutti i PC parte il primo blocco. Ognuno passa al blocco dopo col suo passo, o tutti
   insieme quando la maestra preme **«Avanti tutti»** (i giri a rotazione); dopo l'ultimo «Hai finito!», o
   in tondo si ricomincia. La maestra vede per ogni bambino in che blocco è, quante ne ha fatte, quante
   giuste e dove inciampa.
5. **«Chiudi lezione»**: sui PC compare «La lezione è finita». La pagina della maestra ha già salvato i
   risultati man mano; il resoconto si stampa o si scarica (CSV) ed entra nello **storico** della classe.
   Se la sua pagina era chiusa, «Recupera i risultati» funziona finché il servizio tiene la lezione (3 ore).

## Le scelte, una riga ciascuna

- **Un codice per lezione, non per classe**: nessuna classe vive sul servizio, e il file dei PC è uno solo.
- **La chiave della maestra è un'altra cosa dal codice**: 32 caratteri casuali, solo nel suo browser. Col
  solo codice si arriva alla sala d'attesa, e la maestra vede e toglie un nome che non conosce.
- **Il nome dalla lista**, non scritto: un bambino di sei anni lo sbaglia, due «Luca» si confondono.
  Dentro una lezione il nome è l'identità: lo stesso nome da un altro PC (il browser si è chiuso) riprende
  le sue risposte, ma solo dopo che la maestra l'ha liberato.
- **Le risposte non si perdono a una caduta**: il PC del bambino continua, tiene le risposte in coda e le
  manda quando la rete torna → [bambini.md](bambini.md).
- **La pagina della maestra che si chiude non chiude la lezione**: la lezione in corso (codice e chiave)
  sta nel suo localStorage, e riaprendo la pagina la ritrova.
- **I giochi veri non si storpiano, si limitano**: il bambino gioca al gioco di casa, che mostra solo quello che
  la lezione chiede (gli Asteroidi con le sole tabelline scelte, senza mappa, sosta né monete in vista) e accetta
  solo quello che sa fare già: una forma che a casa non ha (il numero nascosto negli Asteroidi) resta alle schede →
  [../asteroidi/scuola.md](../asteroidi/scuola.md). Il gioco tiene il profilo di casa **in memoria**: niente
  scrive sul PC della classe. Un PC che non regge il 3D fa l'esercizio a schede.
- **Lo storico è un riassunto**, non ogni risposta: per bambino e lezione, quante e quante giuste, e le
  domande sbagliate. Il file «Salva il quaderno» è l'unica copia di sicurezza: la pagina lo dice.
- **I nomi passano dal servizio solo per la lezione** (e spariscono con lei). Sul PC della maestra restano,
  come in un registro di carta: se il PC è condiviso li vede anche chi lo usa dopo.

## Cosa non c'è, apposta

Profili salvati, monete in vista, record, ripasso fra una lezione e l'altra, età e saperi spenti (decide la
lezione), guide, novità, posta, «installa», amici, aggiornamenti automatici, service worker. Non si spengono: la
pagina non li importa, o li importa sostituiti (il profilo dei giochi veri vive in memoria e muore con la pagina).

## I giochi che non ci sono

Scelto dall'utente il 21 novembre 2026: Codice Segreto, Conta e Prima e dopo non sono adatti alle elementari in una
classe; il giardino è ancora in prova; la fattoria ed Español no. I giochi che ci sono stanno in [giochi.md](giochi.md).

## Il ciclo di vita

Stesso `main` dell'app di casa, pubblicazione a parte: il push su `main` non cambia mai la scuola; un tag
`scuola-*` costruisce una release, e la pubblicazione di Pages la mette sotto `/scuola/` →
[architettura.md](architettura.md). Un gioco che a scuola deve andare diverso si adatta con la lezione
(configurazione), una manopola, o una schermata della scuola sopra lo stesso motore: mai con un ramo.

## Da fare dopo la prima versione

- Una **prova di rete** sui PC veri della scuola (raggiungono `*.workers.dev`? i WebSocket passano? che
  browser?): è l'incognita che può far ripensare il canale.
- Gli **Asteroidi su un PC della scuola**: se il 3D regge con la fascia `'bassa'`, o se serve un ritorno alle schede
  anche per lentezza e non solo per WebGL assente.
- Il messaggio `tutto` porta tutte le risposte: con una classe intera e una lezione lunga può passare il mega che
  un messaggio WebSocket di Cloudflare accetta. Oggi una lezione vera sta molto sotto; se serve, si manda a pezzi.
