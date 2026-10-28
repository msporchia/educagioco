# Castle Battle in due

Due bambini, due telefoni, ognuno col suo hotspot o la sua wifi: si sfidano scambiandosi solo le mosse.
**Stato: fatto** (19 ottobre 2026); dal 28/10 regge le cadute della linea (il pezzo comune, [../core/insieme.md](../core/insieme.md)). Da riprovare con due telefoni dopo il deploy del servizio.

Il filo, il tavolo sul servizio, il lockstep e la trattativa sono **comuni a tutti i giochi** e stanno in
[../core/insieme.md](../core/insieme.md) (`src/insieme/`): qui resta quello che è solo di Castle Battle.

## Perché un servizio di inoltro e non un collegamento diretto

I telefoni dei bambini useranno l'hotspot dei genitori: un collegamento diretto (WebRTC) passa da NAT e firewall
diversi e va a tentativi, e con i dati mobili spesso non si apre. Un servizio di inoltro vuole solo una
connessione **in uscita** da ogni telefono (come aprire un sito) e passa da qualunque rete. Il servizio è un Cloudflare
Worker con un Durable Object per tavolo; niente si salva, il piano gratuito basta (vedi [../core/amici.md](../core/amici.md),
«quanto costa»). Il gioco da solo non dipende dal servizio: se è giù, la sfida dice «non disponibile ora».

## Il mondo è uno solo

- `sfida.umano` spegne il nemico automatico (`Partita.umano`): lo muove l'altro giocatore.
- **Chi ospita è `io` (in basso), l'ospite è `nem` (in alto)** (`latoDi` in `sfida/regia.js`). Due mondi specchiati non restano
  uguali (il caso consuma i numeri in ordine, e `io` viene prima di `nem`). L'ospite vede la scena girata (`scena/prospettiva.js`).
  Provato: due mondi specchiati, lo stato era uguale in 4 partite su 8.
- Il motore avanza a fette fisse da 0,05 s: due copie con gli stessi comandi agli stessi tick restano identiche **al bit**
  (`unita/arena-lockstep`). Niente `Math.hypot` nel motore: due browser diversi lo arrotondano in modo diverso, e le copie si
  separavano (ora `ipot` in `motore/partita.js`).
- **Il campo non si ferma più per uno solo**: fermarlo per chi calcola ferma anche l'altro. In due il campo corre anche
  mentre si risponde, e il tempo del conto è un vantaggio di ognuno. Ognuno ha i conti della propria base.
- **Le monete corrono più piano** (`sfida.ritmoMonete`, uguale per tutti e due): sono tarate per un campo fermo, dove un'azione
  costava circa 2,5 secondi di gioco. Con *s* secondi a risposta il ritmo è `2,5 / (2,5 + s)` (`ritmoPer`): a 10 secondi, **un
  quinto**. **Lo sceglie chi crea la stanza** (più piano 15 s, normale 10 s, svelto 6 s); l'ospite lo accetta tra 0,05 e 1,5.
  Dieci secondi è una stima dell'utente: da rimisurare giocando.
- **Chi crea decide** terreno e ritmo; l'ospite accetta o rifiuta. Una versione diversa (`VERSIONE_SFIDA` in `sfida/protocollo.js`
  più la firma delle regole) non parte: si alza quando cambia qualcosa che le due copie devono fare uguale.

## Cosa dà Castle Battle al pezzo comune (`sfida/`)

- `protocollo.js`: la **mossa** (`[azione, chi, dove]`, `mossaValida`), l'**impronta** e la **proposta** (seme, terreno, ritmo).
- `foto.js`: la **fotografia** di tutto quello che cambia mentre si gioca, caso compreso. Nomina i campi di un'unità
  (`CAMPI_UNITA`): un campo nuovo in `Partita.schiera` va aggiunto lì (un test lo controlla).
- `regia.js`: `regolaArena()` e `motoreDi(partita)`, quello che `src/insieme/incontro.js` e `lockstep.js` vogliono.

**L'impronta** (`improntaDi`, 17 cifre): monete, vita dei castelli e dei muri, numero e livello delle caserme, numero, vita totale e
posizione (somma delle y) delle truppe, per lato. Conteggi e `fine` devono essere uguali; il resto con una tolleranza del 2% (+1):
uno scarto da ultima cifra non fa niente, e se è l'inizio di una divergenza vera cresce da sé fino a superarla. Se le copie si
separano l'host manda la fotografia e si riparte da lì: due bambini che non hanno fatto niente non devono perdere la sfida.

## Nel gioco

- **Si apre dalla mappa** («Sfida un amico», sopra la battaglia infinita). `viste/Sfida.vue`: chi crea sceglie il terreno e
  quanto andare veloce e riceve il codice; chi entra lo scrive. La battaglia è come l'infinita: senza timer, con le truppe del
  terreno e tutte le operazioni. Non c'è il ⏸, né la sosta, né le stelle.
- **Le mosse** passano da `eseguiMossa` all'incontro (la mossa giusta, la caserma che riposa dopo uno sbaglio, vendere); i conti
  restano a tutto schermo e il campo non si ferma.
- **La linea che va e viene**: dopo 1,5 s di guasto un cartello dice «Hai perso la linea… mi ricollego da solo» o «L'altro ha perso
  la linea… lo aspetto», con «alla mappa»; il campo è fermo (il lockstep aspetta) e quando la linea torna riparte da dove era. Dopo
  due minuti senza notizie la sfida finisce. Chi esce lo sa l'altro subito, e chi finisce prima lo dice all'altro (`fine`).
- In due il battito del gioco recupera fino a 0,25 s a fotogramma (`giostra.tetto`): un telefono lento non rallenta l'altro.
- **Nei test:** `[data-sfida-apri]` (la mappa), `[data-sfida-crea]`, `[data-sfida-entra]`, `[data-terreno=…]`, `[data-ritmo=…]`,
  `[data-sfida-codice-input]`, `[data-sfida-vai]`, `[data-codice]`, `[data-sfida-messaggio]`, `[data-sfida-linea]`,
  `[data-sfida-rotta]`, `[data-sfida-esci]`; `unita/arena-lockstep`, `unita/arena-sfida`, e `integrazione/arena-sfida`
  (**serve `wrangler dev`** in `servizio/inoltro`).

## Gli amici

Il codice di cinque lettere resta, ma c'è anche l'invito a un amico (lista, cartello, «Gioca»): [../core/amici.md](../core/amici.md).
Chi invita crea il tavolo, si siede, e solo allora manda l'invito con il codice dentro.

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
