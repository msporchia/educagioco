# Gli amici

**Stato: fatto** (20 ottobre 2026; scelte dell'utente). **Da mettere online: il servizio** (`cd servizio/inoltro && npx wrangler deploy`, lo fa l'utente; senza, gli amici restano in grigio e non succede niente). Una lista di amici **per tutta l'app**, non per un gioco: ogni
bambino ha i suoi amici, con il nome, e sa chi è online. Ci si invita a un gioco, a chi riceve compare un cartello e accetta.
Oggi per sfidarsi in Castle Battle ci si passa un codice di cinque lettere ([../arena/multigiocatore.md](../arena/multigiocatore.md));
con gli amici il codice sparisce. Servono il servizio su Cloudflare e internet: tutto il resto dell'app resta com'è, offline.

## Un'amicizia è fra due persone

Ogni amicizia ha **una chiave sua** (32 lettere e cifre casuali, 128 bit), che hanno solo quei due telefoni. Niente gruppi: abbinare
Melody a Leonardo non fa vedere Melody a nessun altro, e un codice finito in mani sbagliate fa entrare uno sconosciuto **solo** in
quell'amicizia (compare come «in attesa» senza nome, e un grande la toglie).
L'amicizia si salva sul telefono per bambino (`store/amici.js`, chiave `amici:<profilo>`, fuori dai profili, un oggetto):
`{ id (casuale, del bambino), attivo (bool, falso), online (bool), amici: [{ id, nome, chiave, visto }] }`. **Il nome dell'amico si impara la prima volta che si
incontrano e si tiene**: anche offline la lista dice «Melody» (in grigio), non un codice. Se l'amico cambia nome, si aggiorna.

## Come ci si abbina: un codice breve che scade

Lo fa un **grande**, nella zona del codice dei genitori (carta «Amici», `GenitoriView.vue`, per il bambino che ha «Amici online»
acceso): fare amicizia fra bambini è una cosa da genitori.
1. Chi invita: «Invita un amico». Il telefono crea la chiave di quell'amicizia e la affida al servizio, che risponde con un
   **codice di 5 lettere** (alfabeto senza I e O) valido **2 ore**. Il genitore lo manda all'altro. L'amico compare in lista
   «in attesa».
2. Chi riceve: «Ho un codice», lo scrive. Il servizio gli dà la chiave **e brucia il codice**. Da quel momento i due telefoni
   hanno la stessa chiave. Appena i due telefoni sono accesi insieme si presentano (nome compreso) e l'amicizia è completa.

Perché regge (non è un buco di sicurezza):
- **5 lettere = 8 milioni di combinazioni** (24⁵); con 4 sarebbero 330 mila, troppo poche. I codici attivi sono pochi.
- **Uso singolo e scadenza**: riscattato o scaduto non esiste più (il servizio lo cancella da sé con un allarme).
- **Tentativi sbagliati contati** per indirizzo (10 al minuto): oltre, il servizio non risponde per un minuto.
- **Il danno di un codice finito a chi non doveva è piccolo**: uno sconosciuto in *quell'amicizia*, che si vede (nome mai visto) e si
  toglie dalla zona dei grandi («Togli»: butta la chiave).
- **Niente testo libero fra i bambini**, mai: inviti e risposte hanno forma fissa (sotto). Niente chat.

## Cosa vede il bambino

- **La lista** («Amici» in home): i nomi, con un pallino verde per chi è online e «sta giocando a …» se l'ha detto. Gli amici
  non online restano, in grigio.
- **Invitare**: nella schermata di un gioco che sa ricevere inviti (oggi Castle Battle) c'è «Invita un amico» con la lista; si
  tocca un nome online e libero.
- **Ricevere**: **un cartello su qualunque schermata** («Leonardo ti invita a Castle Battle · Gioca / No grazie», montato una volta
  in `App.vue`, come `Avviso.vue`). «Gioca» apre il gioco già dentro la partita; sparisce da solo dopo 30 secondi.
- **Si è raggiungibili mentre l'app è aperta** (se i grandi l'hanno acceso): il telefono tiene aperto un collegamento per amico
  (pochi: tetto di 6), con rientro a ritardo crescente se cade. Se internet manca o il servizio è giù: nessun errore, nessun
  cartello, la lista in grigio.

## Chi lo accende: i grandi, e di base è spento

Le funzioni online sono **una cosa da chiedere ai genitori**, come l'età. Due livelli, e il primo è dei grandi:
1. **«Amici online» per bambino** (`attivo` in `store/amici.js`, falso di partenza). Spento: la lista non c'è in home, non c'è «Invita
   un amico», non arriva nessun cartello, **nessun collegamento si apre**. Si accende dalla carta «Amici» nella zona dei grandi
   (la stessa dove si abbina un amico e si toglie), una riga per bambino.
2. **«Mi vedono online»**, del bambino, dentro la lista (`online`, acceso quando `attivo` si accende): spento, per gli amici è
   offline, non gli arriva niente e non può invitare. In cima alla lista «Sei offline» con il tasto per riaccendere.
Una chat non c'è e non ci sarà (inviti e risposte sono di forma fissa): l'unica cosa da zittire sono gli inviti.

**Si chiede nel modulo del bambino nuovo** (`Benvenuto.vue`, che si fa al primo avvio e a ogni bambino aggiunto, ed è per i
genitori: «Lo possono cambiare mamma e papà»): una riga nel passo dell'età (non un passo a parte: ogni prova che crea un bambino
preme «Si gioca!»), «Giocare con gli amici» — due righe che dicono cos'è, «Leggi tutto» per il testo intero, e due tasti, *Attiva* e
*Più tardi*. Il profilo non esiste ancora quando si risponde: la risposta aspetta in `ricordaScelta` e la prende il primo `carica`
di quel profilo. **Il tasto già scelto è «Più tardi»** (la
regola della manopola: premere senza leggere sbaglia dalla parte prudente); il valore di partenza sta in una costante sola
(`AMICI_DI_BASE`), e quando si vorrà che di base sia attivo basta cambiare quella. Attivare non espone nessuno: un amico c'è solo
dopo che un grande ha fatto l'abbinamento col codice.

**Cosa dice il passo** (parole per i grandi, in `src/amici/testi.js` insieme all'avviso della posta, così si cambiano in un posto):

> **Giocare con gli amici** — Si può giocare insieme a un amico, ognuno sul suo telefono. Vedrà solo gli amici con cui voi
> grandi vi scambiate un codice, e funziona solo in alcuni giochi (per ora Castle Battle). Si gioca insieme soltanto quando
> lo decide lui: arriva un invito e dice sì o no. Non ci sono chat e non può parlare con nessuno. È un divertimento in più,
> il resto del gioco non cambia. Lo potete cambiare quando volete, dalle impostazioni.
> [Attiva] [Più tardi]

L'avviso nella posta per i profili che ci sono già dice la stessa cosa con un'apertura sola («C'è una novità per
{nome}: giocare con gli amici…») e il tasto che porta alla carta.

**I profili che ci sono già** partono spenti, e il grande lo scopre dalla posta dei grandi, non dalle novità per i bambini:
`avvisaUnaVolta('amici:<profilo>', …)` (`store/posta.js`) con un tasto che porta alla carta «Amici». Il bambino vede il solito
nastro «C'è un messaggio per la mamma o il papà». Le novità per i bambini non ne parlano.

## Senza internet (o senza servizio) non succede niente

Regola: **gli amici sono un di più e non danno mai un errore**. Offline, o con il servizio giù, o con gli interruttori spenti:
- nessun collegamento riuscito vuol dire amici «in grigio», senza cartelli di errore, senza messaggi rossi, senza ritardi
  all'avvio (i collegamenti partono dopo che l'app è pronta e non la aspettano);
- i tentativi di rientro vanno a ritardo crescente (2 s → 60 s) e in silenzio; a schermo spento o app in secondo piano non si
  ritenta;
- una lista già salvata si vede lo stesso (nomi in grigio); l'unica cosa che manca è «invita», che dice «serve internet» solo se la
  tocchi;
- l'app aperta dal file con doppio click, senza rete, si comporta come sempre: nessuna richiesta fallita nella console che si veda.
Un test lo controlla (`integrazione/amici`: pagina senza rete, nessun cartello, nessun errore in console, lista dei nomi salvati).

## Il servizio (`servizio/inoltro`): una stanza per amicizia, non sa i giochi

| Richiesta | Cosa fa |
|---|---|
| `POST /amici/codice` `{ chiave }` | un Durable Object `Codice` (uno per codice) tiene la chiave 2 ore e risponde `{ codice }`. Limite di codici per indirizzo, come le stanze |
| `POST /amici/riscatta` `{ codice }` | risponde `{ chiave }` e cancella tutto; se non c'è, 404 e un tentativo sbagliato in più per quell'indirizzo |
| `GET /amici/coppia/<chiave>` → WebSocket | un Durable Object `Coppia` con l'API di ibernazione (quiete = gratis): due collegamenti al massimo, nessun salvataggio |

La `Coppia` è la `Stanza` di sempre più due avvisi: **inoltra** ogni messaggio (JSON, ≤ 512 byte, 10 al secondo) all'altro, e dice a
chi entra se l'altro c'è (`{ t: 'ciao', altro: true|false }`) e a chi resta quando l'altro entra o esce (`{ t: 'su' }`,
`{ t: 'giu' }`). Se la stessa persona rientra (un collegamento che cade e ritorna), il nuovo prende il posto del vecchio.
Tutto il resto sta nei telefoni, e sono pochi messaggi con forma fissa (`src/amici/messaggi.js` li costruisce e li controlla):

| Messaggio | Quando |
|---|---|
| `{ k: 'presento', id, nome, gioco }` | entrando, quando l'altro entra (`su`), e quando cambia qualcosa. `nome` ≤ 20 caratteri, `gioco` = a cosa sta giocando o `null` |
| `{ k: 'invito', gioco, dati }` | `dati` per Castle Battle: `{ terreno, secondi }` |
| `{ k: 'risposta', ok }` | accetto / no grazie |

Per Castle Battle non c'è un messaggio a parte per la stanza: chi invita crea la stanza di sempre (`creaStanza`), **si siede** (il
suo collegamento deve essere `host`) e solo allora manda l'invito con il `codice` dentro (`dati: { terreno, secondi, codice }`);
chi accetta fa `collega(codice)`. Se l'amico dice no, o non risponde in 45 secondi, la stanza si chiude. Il lockstep non cambia.

Un gioco nuovo (la fattoria, i record) si aggiunge in `src/amici/giochi.js`: nome, come si costruisce l'invito, cosa fare quando
arriva. Il servizio non cambia.

## Cosa sta dove, cosa viaggia, quanto costa (verificato sulla documentazione di Cloudflare il 20/10/2026)

**Sul telefono** (archivio, chiave `amici:<bambino>`, fuori dai backup): un id casuale del bambino, le tre risposte (deciso, attivo,
online) e per ogni amico la chiave dell'amicizia, l'id e il **nome** (quello che ha scritto il genitore nel profilo, ≤ 20 caratteri).
Non c'è altro: né account, né posta, né posizione. Eliminare un bambino non cancella ancora la sua chiave `amici:` (resta orfana).

**Sul servizio**: niente di personale e niente di permanente. Un `Codice` tiene una chiave al massimo 2 ore (cancellata al riscatto o
dall'allarme); `Errori` e `Limite` tengono un contatore per indirizzo IP (scade in 1-2 ore); una `Coppia` o una `Stanza` esiste finché
c'è qualcuno collegato. Il servizio **inoltra senza leggere**: controlla solo misura (≤ 512 byte), forma JSON e ritmo (20 al secondo).

**Cosa viaggia** (sempre in TLS): al codice, la chiave (la vede il servizio, due ore); nelle amicizie, `presento` (id, nome, a cosa
si gioca), `invito` (gioco, terreno, secondi, codice della stanza), `risposta` (sì/no); in battaglia, le mosse (tick, azione, truppa,
piazzola). **Il solo dato personale è il nome**, e va al telefono dell'amico, non a un archivio. Cloudflare, che ospita, vede tutto
quello che passa e i registri del tuo account contengono i percorsi (la chiave sta nell'indirizzo del collegamento): per questo
l'account è tuo e la chiave si butta con «Togli».

**Limiti del piano gratuito** (oltre, le operazioni falliscono **senza addebiti**; si azzera a mezzanotte UTC; il piano a pagamento è
un'altra cosa e non c'è finché non lo si sceglie): Workers 100.000 richieste al giorno; Durable Object 100.000 richieste al giorno
(un messaggio in arrivo conta 1/20) e 13.000 GB·s al giorno (128 MB: circa 28 ore di collegamenti *attivi*; un collegamento fermo
e ibernato non costa tempo). Una battaglia in due manda circa 20 messaggi al secondo: **1 richiesta al secondo, 3.600 all'ora, 450 GB·s
all'ora**. Una famiglia con quattro bambini e dieci ore di battaglia al giorno sta a ~36.000 richieste e ~4.500 GB·s: un terzo del
limite. La presenza (collegamenti quasi fermi) pesa pochissimo; un telefono che non riesce a collegarsi riprova al massimo una volta
al minuto. **Il rischio vero non è il costo ma l'abuso**: l'indirizzo del servizio è nel codice, e chi lo martella può finire le
richieste del giorno e fermare tutti fino a mezzanotte. I tetti per indirizzo (codici 30 all'ora, tentativi 10 al minuto, stanze 30 all'ora)
limitano chi lo fa a mano, non un attacco vero. Dove guardare: pannello Cloudflare → *Workers & Pages* → `sfida` → *Metrics*.

## Cosa questo apre (non è in questo lavoro)

- **Rientro automatico** nella stanza dopo una caduta: l'`id` del bambino dice che è lo stesso giocatore.
- **Record fra amici** e **visite alla fattoria**: stessi messaggi, `k` nuovi.

## File e test

`servizio/inoltro/src/coppia.js` (due posti, chi rientra prende il suo, messaggi controllati; pura, senza Cloudflare), `codici.js`
(5 lettere, scadenza, tentativi) e i Durable Object `Codice`, `Errori`, `Coppia` in `index.js`; `src/store/amici.js` (archivio per
bambino, `AMICI_DI_BASE`); `src/amici/` — `rete.js` (codici e il `Ponte` che si rimette in piedi da solo), `servizio.js` (il motore:
chi è online, gli inviti), `messaggi.js`, `giochi.js` (i giochi che ricevono inviti), `ingresso.js` («Gioca» → il gioco ritira i dati),
`avvio.js`, `testi.js`; `components/amici/` — `ListaAmici.vue` (la lista in home), `InvitoAmico.vue` (il cartello, in `App.vue`),
`CartaAmici.vue` (i grandi); in `arena/` la lista nella schermata Sfida e `invitaAmico` in `Gioco.vue`.
Test: `unita/amici-servizio` (le regole del servizio), `unita/amici` (archivio, messaggi, `Ponte`, codici, motore, con collegamenti
finti), `integrazione/amici` (due pagine e il servizio: `SERVIZIO=http://localhost:8787` con `wrangler dev` in `servizio/inoltro`, o
quello pubblicato; senza servizio **salta**), e `servizio/inoltro/prova.mjs` (le regole contro il servizio vero, in locale o online).
Il banco (`test/aiuto/browser.mjs`) parte con la domanda già risposta (spento); `amiciDecisi: false` rimette l'avviso nella posta.
Bersagli: `[data-azione="amici"]` (la riga in home), `[data-amici]` e `[data-amico]` (la lista), `[data-invito]`, `[data-invito-gioca]`,
`[data-invito-no]`, `[data-sfida-amici]`, `[data-sfida-invitato]`; nei grandi `.carta[data-flag="amici"]` con `[data-azione="amici-attiva"|
"amici-invita"|"amici-riscatta"|"amici-togli"]`, `[data-amici-codice]`, `[data-amici-codice-input]`, `[data-amici-messaggio]`; nel modulo
del bambino `[data-amici-domanda]`.
