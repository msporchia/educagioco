# Il riordino delle impostazioni (proposta)

**Stato: proposta approvata a voce dall'utente (20 ottobre 2026), in corso a pezzi** (fatti: la sezione dei giochi, la data di nascita, la barra in basso con le tendine e l'avviso sul salvataggio). La pagina dei grandi aveva tre schede e ~16 sezioni:
cose di un bambino, cose del telefono e strumenti da sviluppatore mescolate, e i tasti che cancellano a un tocco da quelli innocui.

## La forma

Una barra in basso con quattro schede, ognuna «di chi è»:
- 🎮 **Giochi**: il carosello e le impostazioni di un gioco ([giochi.md](giochi.md)), gli interruttori di casa, le monete per gioco, le domande dei quiz — **fatto**.
- 👶 **Bambino** (tutto ciò che è di lui, **fatto il 21/10**): faccia e nome, **quando è nato, l'età e il quadro di cosa si apre** (`Nascita` + `ManopolaEta`), amici online, aggiungere un bambino, «Zona delicata» e cestino (chiusi). Il salvataggio **non** sta qui: è del telefono.
- 📊 **Come va**: la settimana, cosa guardare, i grafici.
- 🏠 **Casa**: **salvataggio su file e «Rimetti da un file»** (con l'avviso «ultimo salvataggio: 12 giorni fa»), versione, giochi in prova, aggiungi un bambino, aiuto; e due
  tendine chiuse: **«Per chi sviluppa»** (contatore fps, fascia grafica, benchmark) e **«Zona delicata»** (azzera, cestino).
In cima a tutto il bambino scelto (le impostazioni sono sempre «di Leonardo»), con la lente per cercare un'impostazione.

## L'età dalla data di nascita (**fatto**)

`settings.nascita = { m, a }` (mese 0-11 e anno; solo sul telefono, mai nel servizio) e `settings.scarto` (quanti anni sopra o sotto i suoi si è
tarato). **L'età che i giochi leggono resta `settings.eta`**: la data dice a quale età *dovrebbe* essere (`etaDaNascita`), il resto del motore non
cambia. Il compleanno è il primo del mese di nascita (`data/nascita.js`: con il mese basta, e non si chiede il giorno).
- **Un compleanno nella stessa fascia** (9→10, 6→7): l'età si aggiorna **in silenzio** all'avvio (`store/compleanno.js`), perché cambiano solo le
  domande, che si spostano da sole.
- **Un compleanno che cambia fascia** (7→8, 8→9): **non cambia niente da solo** (`spostaLEta` riscrive giochi, saperi e ritocchi): un avviso nella
  posta dei grandi, una volta sola per età, che dice cosa si aprirebbe e cosa si chiuderebbe; la scelta si fa da «Quando è nato»
  (`components/genitori/Nascita.vue`, scheda «Giochi e domande»): **passa ai N anni** (con la conferma di sempre se perderebbe ritocchi) oppure
  **tienilo a M anni**, che ricalcola lo scarto.
- **La manopola** resta com'è, ma ora tarare «sopra o sotto» è lo **scarto**: spostare l'età da lì lo aggiorna (`segnaLoScarto` in `spostaLEta`) e ai
  compleanni successivi si mantiene («lo tari un anno più indietro dei suoi anni»).
- **I profili che c'erano già** non hanno la data: restano con l'età di adesso, e la carta la chiede. Mettere la data non sposta niente: lo scarto
  si calcola per lasciare l'età com'è, e se non combacia con gli anni veri compare lo stesso avviso con le due scelte.
- **Il modulo del bambino nuovo** (`Benvenuto.vue`) ha mese e anno **facoltativi**; con la data la manopola si mette sull'età che ne esce; la manopola
  si può ancora spostare (e fa lo scarto). Senza data, tutto com'era.

Nei test: `[data-nascita]`, `[data-nascita-mese]`, `[data-nascita-anno]`, `[data-nascita-eta]`, `[data-nascita-scarto]`, `[data-nascita-avviso]`,
`[data-azione="nascita-salva"|"nascita-passa"|"nascita-tieni"|"nascita-cambia"|"nascita-togli"]`; nel modulo `[data-nascita-domanda]`.
`unita/nascita`, `integrazione/nascita`.

## Ordine del lavoro

1. Le domande di ogni gioco e la pagina del gioco — **fatto** ([giochi.md](giochi.md)).
2. La data di nascita con l'avviso al compleanno — **fatto**.
3. La barra in basso con Bambino, Giochi, Come va e Casa — **fatto**. Il bambino scelto in cima **non** si fa: cambiare bambino riporta alla home (`App.vue`, per scelta), quindi le impostazioni restano «di chi sta giocando adesso».
4. Le tendine («Per chi sviluppa», «Zona delicata») e l'avviso sul salvataggio — **fatti**. La lente per cercare un'impostazione: da fare se le sezioni crescono.
5. I grafici di «Come va» (andamento delle risposte giuste, cosa guardare).
