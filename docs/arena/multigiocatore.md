# Castle Battle in due

Due bambini, due telefoni, ognuno col suo hotspot o la sua wifi: si sfidano scambiandosi solo le mosse.
**Stato: fatto e provato dal vivo** (19 ottobre 2026): due pagine nel browser, il servizio vero, una sfida completa (`integrazione/arena-sfida`). Da provare con due telefoni e due hotspot.

## Perché un servizio di inoltro e non un collegamento diretto

I telefoni dei bambini useranno l'hotspot dei genitori: un collegamento diretto (WebRTC) passa da NAT e firewall
diversi e va a tentativi, e con i dati mobili spesso non si apre. Un servizio di inoltro vuole solo una
connessione **in uscita** da ogni telefono (come aprire un sito) e passa da qualunque rete.

## Il servizio: un Cloudflare Worker con un Durable Object

- Un **Worker** (codice su Cloudflare, indirizzo `nome.<account>.workers.dev`) e un **Durable Object** per stanza:
  un'istanza che vive finché ci sono i due giocatori e inoltra ogni messaggio all'altro. **Niente si salva**: solo memoria,
  il piano gratuito basta (100.000 richieste al giorno, un messaggio in arrivo ne conta meno di una; oltre il limite le
  operazioni falliscono, **nessun addebito**; verificato sulla documentazione il 19/10/2026: pagine *Durable Objects →
  Pricing* e *Workers → Limits*). Si scrive con l'API di *hibernation*, che non conta il tempo di calcolo.
- Si crea una stanza con un codice di 5 lettere; il secondo giocatore lo scrive. Al massimo due giocatori, la stanza muore
  dopo cinque minuti se nessuno entra e dopo un'ora comunque.
- **Contro l'abuso:** messaggi piccoli (poche centinaia di byte) e di una forma sola (una mossa), un tetto di messaggi
  al secondo per connessione, un limite di stanze create per indirizzo. Dal file aperto in locale l'origine non si può
  verificare: la difesa vera sono questi limiti. Niente nomi né testo libero nei messaggi.
- Il gioco da solo non dipende dal servizio: se è giù o finiscono i limiti, la sfida dice «non disponibile ora».

## Il motore: due copie identiche (lockstep)

Ogni telefono tiene **la stessa partita** (stesso seme, stesse regole) e si scambiano solo i comandi, ognuno con il
**tick in cui si applica** (qualche decimo di secondo avanti, per dare tempo di arrivare). Il motore avanza già a fette
fisse da 0,05 s: due copie con gli stessi comandi agli stessi tick restano identiche **al bit** (`unita/arena-lockstep`:
tre partite da tre minuti e mezzo con comandi dall'una e dall'altra parte). Comandi applicati in ritardo fanno un'altra
partita: per questo il tick lo decide chi comanda e lo accetta chi riceve.

- `sfida.umano` spegne il nemico automatico (`Partita.umano`): lo muove l'altro giocatore.
- **Il mondo è uno solo**: chi ospita è `io` (in basso), l'ospite è `nem` (in alto). Due mondi specchiati non restano
  uguali (il caso consuma i numeri in ordine, e `io` viene prima di `nem`). L'ospite vede la scena girata: serve una
  «prospettiva» (`mio: 'io' | 'nem'`) al posto dell'`io` fisso in `Gioco.vue` e `scena/campo.js`.
- **Il campo non si ferma più per uno solo**: fermarlo per chi calcola ferma anche l'altro. In due il campo corre anche
  mentre si risponde, e il tempo del conto è un vantaggio di ognuno. Ognuno ha i conti della propria base, quindi la
  gara è giusta anche con età diverse.
- **Le monete corrono più piano** (`sfida.ritmoMonete`, uguale per tutti e due: in due non c'è un nemico, niente malus né
  bonus): sono tarate per un campo fermo, dove un'azione costava circa 2,5 secondi di gioco. Con *s* secondi a risposta il
  ritmo è `2,5 / (2,5 + s)` (`ritmoPer`): a 10 secondi, **un quinto**. **Lo sceglie chi crea la stanza** («quanto vuoi
  andare veloce»: più piano 15 s, normale 10 s, svelto 6 s); la proposta lo porta e l'ospite lo accetta tra 0,05 e 1,5.
  Dieci secondi è una stima dell'utente: da rimisurare giocando.
- **Chi crea la stanza (l'host) decide** terreno e ritmo; l'ospite accetta o rifiuta (versione diversa).
- Un controllo ogni tanto (l'impronta dello stato) dice se le copie si sono separate; se succede, **si torna a una sola**:
  l'host manda la fotografia della sua partita (`sfida/foto.js`: tutto quello che cambia, caso compreso), l'ospite la prende e
  riparte da lì. Vedi «Quando le copie si separano».

## Il protocollo (`sfida/protocollo.js`, provato in `unita/arena-sfida`)

Ognuno promette «fino al tick H non ti mando altre mosse» e manda le sue, ciascuna con il tick in cui vale (`RITARDO` 6 tick,
0,3 s, a blocchi di 4): la partita avanza di un tick solo quando di tutte e due le parti si sa tutto, quindi una rete lenta
rallenta il campo ma non separa le copie. Messaggi (testo JSON): `inizio` (firma, seme, terreno, ritmo) → `pronto` o
`no` (versione diversa: uno dei due deve aggiornare il gioco), poi `k` (orizzonte e mosse) e ogni 5 secondi di gioco `i`
(impronta dello stato: se differisce, si riallineano). Una mossa fuori dal tempo promesso, un'azione che non esiste o
un orizzonte lontano si rifiutano. Sono una trentina di messaggi al secondo al massimo; in media una decina.

## Quando le copie si separano

**Cosa si confronta** (`improntaDi`, 17 cifre per partita): monete, vita dei castelli e dei muri, numero e livello delle caserme, numero,
vita totale e posizione (somma delle y) delle truppe, per ciascun lato. Conteggi e `fine` devono essere uguali; il resto con una
tolleranza del 2% (+1): uno scarto da ultima cifra non fa niente, e se è l'inizio di una divergenza vera cresce da sé fino a superarla.

Succede (provato dal vivo coi telefoni: due motori diversi possono arrotondare un calcolo in modo diverso), e finire la sfida
sarebbe una punizione per due bambini che non hanno fatto niente. Allora l'**host vince**: le due parti si fermano, l'host
manda la sua fotografia a pezzi da ≤512 byte (il limite del servizio, 20 al secondo, così non serve rimettere online il
servizio), l'ospite risponde `ok` e tutte e due riprendono. Un'ospite rimesso al tick dell'host può trovarsi indietro di
qualche tick: per questo le mosse già fatte si tengono per 200 tick e quelle che valgono da lì in poi si rifanno.
Il blocco dura un paio di secondi. Dopo 30 riallineamenti la sfida finisce comunque («le due partite si sono separate»):
non è più un caso, è un guasto. Nei test: `unita/arena-sfida` (copia guastata, fotografia e caso).
La fotografia nomina i campi di un'unità (`CAMPI_UNITA`): un campo nuovo in `Partita.schiera` va aggiunto lì (un test lo controlla).

## Nel gioco

- **Si apre dalla mappa** («Sfida un amico», sopra la battaglia infinita; se c'è una partita lasciata a metà chiede prima, come per le altre).
  `viste/Sfida.vue`: chi crea sceglie il terreno e quanto andare veloce (più piano 15 s, normale 10 s, svelto 6 s) e riceve il codice;
  chi entra lo scrive. La battaglia è come l'infinita: senza timer, con le truppe del terreno e tutte le operazioni.
- **L'ospite vede un mondo specchiato** (`scena/prospettiva.js`: `vistaDa` e `eventiDa` scambiano i lati e rovesciano le y solo per il
  disegno): si vede sempre in basso e in blu. Gioco.vue gioca da `mio` (`io` chi ospita, `nem` l'ospite) invece di un `io` fisso.
- **Le mosse** passano da `eseguiMossa` e dalla sessione (la mossa giusta, la caserma che riposa dopo uno sbaglio, vendere); i conti
  restano a tutto schermo e il campo non si ferma. Non c'è il ⏸, né la sosta, né le stelle. Se l'altro tace oltre 15 secondi appare
  «l'altro non risponde», se se ne va «la sfida è finita qui» (con quindici secondi di tolleranza: potrebbe aver solo finito prima; chi finisce lo dice all'altro con un messaggio `fine`, e l'altra copia chiude uguale).
- **File:** `sfida/protocollo.js` (la sessione), `sfida/regia.js` (la trattativa: firma, seme, terreno, ritmo), `sfida/rete.js`
  (il filo verso il servizio, `SERVIZIO` è l'indirizzo), `scena/prospettiva.js`, `viste/Sfida.vue`.
- **Nei test:** `[data-sfida-apri]` (la mappa), `[data-sfida-crea]`, `[data-sfida-entra]`, `[data-terreno=…]`, `[data-ritmo=…]`,
  `[data-sfida-codice-input]`, `[data-sfida-vai]`, `[data-codice]`, `[data-sfida-messaggio]`, `[data-sfida-rotta]`, `[data-sfida-esci]`;
  `unita/arena-lockstep`, `unita/arena-sfida`, `unita/arena-regia`, e `integrazione/arena-sfida` (**serve internet**).
- **Una trappola trovata dai test:** due mosse sullo stesso tick arrivano in ordine diverso ai due telefoni, e applicate così le copie si
  separano: la sessione le applica sempre prima per chi ospita e poi per l'ospite (rare, ma una coincidenza finirebbe la sfida).
- **Provato: due mondi specchiati** (ognuno `io` nel suo): il motore non è simmetrico (ordine di elaborazione, caso), lo stato era uguale
  in 4 partite su 8. Per questo il mondo è uno solo.

## Gli amici

Il codice di cinque lettere resta, ma c'è anche l'invito a un amico (lista, cartello, «Gioca»): [../core/amici.md](../core/amici.md).
Un collegamento che non si apre in 4 secondi si lascia e se ne prova un altro (fino a 3 volte), e una creazione di stanza persa si
rifà: un telefono può perdere una richiesta su quattro, a ondate, e non deve rompere la sfida. Quando una sfida si rompe il cartello
dice a che punto era e com'è stato chiuso il collegamento (codice e ragione): serve a capire se è la rete, il servizio o l'altro telefono.

## Da fare

- Provare con due telefoni, ognuno col proprio hotspot, e rimisurare i dieci secondi a risposta.
- Il livello di difficoltà non c'è (non c'è un nemico); quanto corrono le monete è l'unica manopola.
- Una rivincita senza ricreare la stanza; il nome di chi gioca contro; cosa dire se il servizio ha finito la quota del giorno
  (oggi: «il servizio delle sfide non risponde ora»).

## Il servizio, messo online (lo fa l'utente)

```bash
cd servizio/inoltro
npx wrangler login      # apre il browser: si accede al proprio account Cloudflare
npx wrangler deploy     # carica il Worker; scrive l'indirizzo https://sfida.<tuo-sottodominio>.workers.dev
node prova.mjs https://sfida.<tuo-sottodominio>.workers.dev
```

Alla prima volta Cloudflare chiede di scegliere il nome del sottodominio `workers.dev`. Il piano gratuito basta
(il file `wrangler.toml` dichiara i Durable Object con la memoria SQLite, l'unica che il gratuito ammette).
Per vedere cosa succede: pannello Cloudflare → *Workers & Pages* → `sfida` → *Metrics* e *Logs*.
