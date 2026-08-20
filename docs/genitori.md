[← torna al README](../README.md)

# 👨‍👩‍👧 I settaggi per i genitori

Tutto quello che segue sta dietro **un codice di quattro cifre**, che
all'inizio è `0000`.

<img src="img/genitori.png" width="230"> <img src="img/genitori-giochi.png" width="230">

Si arriva dal link *Genitori* in fondo alla schermata iniziale.

> Il codice non è sicurezza: è **un gradino contro il tocco distratto**. Chi
> vuole entrare davvero apre gli strumenti del browser. Serve a impedire che
> «cancella i progressi» finisca sotto il dito di un bambino di sette anni.
> Si cambia da lì dentro, e se lo dimentichi si rimette dall'indirizzo:
> aggiungi `#pin=1234` all'URL.

## Due schede, e si tara in una sola

**Bambini** dice chi gioca su questo telefono — nome, faccia, progressi — e
dell'età mostra solo una riga: *«Leonardo ha 10 anni · modifica ›»*.
**Giochi e domande** è dove si tara, ed è l'unico posto: l'età in cima, e
sotto **il quadro di quell'età**.

Prima erano due schede diverse — una fila di interruttori per i giochi e un
elenco di domande con quattro tondi per riga — e tutte e due finivano per
dire, in modi che non si potevano confrontare, quello che il quadro dice già.
La seconda aveva perfino una **seconda manopola dell'età**, dieci schermate
lontano dalla prima.

## Il quadro: cosa trova in casa, e cosa gli chiediamo

Sotto la manopola c'è l'elenco di quello che quell'età comporta, e si apre a
due livelli.

Il primo blocco è **In casa**: tutti i giochi, ognuno col suo stato — *c'è* ·
*l'ha già passato* · *arriva più avanti* · *l'hai spento tu*. Poi le domande,
divise per come cadono rispetto a lui: *queste le sa fare* · *sta imparando
queste* · *difficili, ma ce la può fare* · *superfluo chiedergliele*. Dentro
ogni blocco ci sono i **pezzi di scuola**, e dentro ognuno le sue domande,
con l'età a cui servono.

Il **▶** di una riga apre una domanda vera, generata dallo stesso modulo che
la darebbe in partita: su un pezzo di scuola le scorre tutte, col contatore
(«7 di 37»), che è il modo di rispondere a *le ho viste tutte?*.

## Correggere una riga: la ✎

L'età è la manopola grossa e si tocca una volta sola. La **✎** accanto a ogni
riga è la correzione piccola, quella che serve quando l'età ha indovinato
tutto tranne una cosa: *le stagioni le davamo per sapute, e a scuola sono
indietro di mezzo anno*.

Su un **pezzo di scuola** o su una **domanda** la ✎ apre una tacca in mezzi
anni: `◀ Nel segno ▶`. Il nome grande è dove la riga andrà a finire, sotto
c'è quello che stai dicendo — «mezzo anno più difficile · vale otto anni» —
e finché non premi «Conferma» non è cambiato niente. Tre scatti per parte:
oltre non è più una taratura, è un'altra affermazione, e infatti l'ultimo
scatto a destra è **«non ancora spiegate»**: quello spegne il pezzo di
scuola, e da lì in poi le domande che lo danno per scontato non escono più in
nessun gioco.

Il punto non è togliere difficoltà. È che una domanda su qualcosa che non si
è mai visto **non è difficile: è muta**. Non c'è niente da ragionare, si può
solo tirare a indovinare — e indovinare non insegna niente, anzi insegna che
il gioco è ingiusto.

Su un **gioco** la tacca non sposta niente di mezzo anno: sceglie chi decide.
*Non ce l'ha* · *Come dice l'età* · *Ce l'ha*. L'ultima serve quando l'età
sbaglia — il piccolo che gioca col fratello grande — e tiene la carta in home
anche se il gioco sarebbe «più avanti». Spegnere non cancella niente: i
progressi restano dove sono e riaccendendo si ritrovano tutti. La scelta è
**per bambino**: si può lasciare il castello al grande e toglierlo al piccolo.

Quando si spegne qualcosa i giochi **degradano invece di sbarrare**: il
castello senza divisioni chiede moltiplicazioni più difficili, un modulo di
quiz che perde un grado scende a uno più facile invece di sparire. Nessun
gioco diventa impossibile e nessuna tappa si blocca.

## Ritrovare quello che si è toccato

Le correzioni sono tante e piccole, e dopo un mese nessuno ricorda cosa ha
spostato. Perciò **quello che hai messo a mano resta color ambra**
nell'elenco — il contatore dice quante, il colore dice quali — e quello che
hai tolto non sparisce: finisce in un blocco in fondo, chiuso, da dove si
rimette.

E in fondo al quadro c'è il tasto che **rimette tutto com'è di partenza a
quell'età**, dicendo prima cosa perde: «2 giochi messi a mano, 1 domanda
ritoccata». Non tocca l'età e non tocca i progressi.

## I progressi: salvarli e spostarli

I progressi stanno **solo nel browser del dispositivo su cui si gioca**. Non
c'è nessun server: nessuno li vede e nessuno li ha in copia. Il che vuol dire
che se si cancellano i dati del sito, o si cambia telefono, senza un backup
non tornano.

- **Salva su file** — scarica un `.json` con dentro tutto: monete, parole
  imparate, tappe, animali, traguardi, di **tutti** i bambini. Consiglio di
  farlo la prima sera e poi ogni tanto.
- **Rimetti da un file** — lo rilegge e sostituisce i progressi.

Sono anche il modo di **passare i progressi da un dispositivo a un altro**:
salva sul vecchio, apri i giochi sul nuovo, rimetti il file. Funziona anche
fra telefono e computer.

> [!WARNING]
> I progressi sono legati all'**indirizzo** da cui si aprono i giochi. Se
> cambi indirizzo — perché lo servi da un tuo server, o passi dal file
> scaricato al sito — il browser li considera due posti diversi e riparte da
> zero. In quel caso servono salva e rimetti.

- **Cancella i progressi** di chi sta giocando: chiede conferma, e non si
  torna indietro.

## Chi gioca

La schermata parla di **chi sta giocando adesso** — come tutto il resto:
i giochi, i saperi, le domande e l'età sono suoi e di nessun altro. Quindi
qui c'è la sua carta e basta; gli altri bambini sono una riga di nomi, e si
passa a loro dalla home, che è dove si è sempre fatto.

Ognuno ha i suoi progressi, completamente separati: il fratello che gioca
dopo non trova le monete dell'altro. Cambiare nome tocca solo l'etichetta —
i progressi non si spostano di un byte.

**Aggiungere un bambino** apre la stessa schermata del primo avvio: nome,
faccia, e quanti anni ha. Alla fine tocca a lui giocare — si aggiunge
qualcuno perché vuole giocare adesso, non per lasciarlo in una lista.

### Quanti anni ha

È **la taratura, non un'anagrafe**: nessuno chiede una data di nascita, e il
numero non si vede da nessuna parte mentre si gioca. Decide due cose, e le
decide tutte e due in continuo:

- **quali giochi trova in home** — la bancarella non compare prima dei sei
  anni, il laboratorio delle pozioni prima dei sette e mezzo, e i due giochi
  dei piccoli («Conta gli animali», «Prima e dopo») smettono di essere
  offerti fra i sette e mezzo e gli otto;
- **quanto sono difficili le domande** — ogni classe di domande dichiara a
  che età serve, e da lì si pesca.

La manopola si sposta di mezzo anno per volta, e **sotto dice cosa fa**. Sei
riquadri, tutti uguali: si toccano in qualunque punto e si aprono.

- **In casa** — tutti i giochi, con scritto di fianco a ognuno *c'è*,
  *l'ha già passato*, *arriva più avanti* o *l'hai spento tu*.
- **Dà per scontato che sappia** — le cose su cui le domande poggiano. È
  l'elenco da leggere: appena ci trovi dentro qualcosa che tuo figlio non sa,
  sei salito troppo.
- **Le domande**, in quattro gruppi — *le sa fare ma le ripassa*, *sta
  studiando queste*, *difficili ma fattibili*, *non gliele chiediamo più*.

Ogni riga ha un **▶**: apre la domanda vera, quella che il gioco gli darebbe.
Un titolo come «le analogie fra figure» non dice che aspetto abbia la
domanda, e senza vederla non si può giudicare. Provarla non cambia niente e
non lascia traccia.

Non c'è niente da immaginare: si muove una tacca e si guarda cosa si sposta.

Muoverla dentro la stessa fascia di scuola non tocca nient'altro: quello che
hai spento o ritoccato a mano resta dov'è. Quando invece la tacca cambia
fascia, giochi e saperi ripartono da come sono di partenza a quell'età — e se
avevi sistemato qualcosa a mano te lo dice **prima**, con scritto cosa stai
per perdere. Monete, animali, campagne e traguardi non si toccano mai.

Alla primissima apertura, quando non c'è ancora nessuno, l'app chiede
direttamente *«come ti chiami?»* senza codice: chiedere un PIN che nessuno ha
ancora scelto renderebbe l'app impossibile da aprire.

## Le due cose in fondo

- **Giochi in prova** — un unico interruttore che rivela i giochi che sto
  ancora scrivendo. Spento (com'è di partenza) quei giochi **non esistono**
  per chi gioca. Dietro lo stesso interruttore c'è anche **la cameretta**,
  che non è un gioco a metà ma una cosa che si sta togliendo: il posto dove
  si spendono le monete adesso è la fattoria, e averne due voleva dire che
  nessuno dei due si riempiva. Accendendolo la cameretta torna esattamente
  com'era — animali, oggetti e scaffali sono ancora nel profilo, non è stato
  cancellato niente.
- **Apri tutte le tappe** — toglie i lucchetti a tutte le campagne di tutti
  i giochi. Serve per far provare a un fratello più grande un gioco appena
  cominciato, o per guardare com'è fatta una tappa avanti.
