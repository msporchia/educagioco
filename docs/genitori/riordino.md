# Il riordino delle impostazioni (proposta)

**Stato: proposta approvata a voce dall'utente (20 ottobre 2026), in corso a pezzi** (fatti: la sezione dei giochi, la data di nascita, la barra in basso con le tendine e l'avviso sul salvataggio). La pagina dei grandi aveva tre schede e ~16 sezioni:
cose di un bambino, cose del telefono e strumenti da sviluppatore mescolate, e i tasti che cancellano a un tocco da quelli innocui.

## La forma

Una barra in basso con cinque schede, ognuna «di chi è» (riordinate il 21/10):
- 👶 **Bambino**: faccia e nome, **quando è nato** (da lì la classe), la **taratura a mano** in una tendina (si apre da sola solo senza data: con la data l'età si ricava dalla classe e la manopola è l'eccezione), amici online, aggiungere un bambino.
- 🎮 **Giochi**: il carosello e la pagina del gioco in mezzo ([giochi.md](giochi.md)): «Nella home» (**Default** oppure **Acceso/Spento** a mano), il tempo, **le monete di quel gioco** (`Tetti.vue` con `gioco`), le domande; sotto, «Le domande dei quiz» (i giudizi).
- 📊 **Come va**: la settimana, cosa guardare, i grafici.
- 💾 **Salvataggi**: salva su file, rimetti da un file, l'avviso «mai salvato», il cestino e la «Zona delicata» (cancella i progressi) — roba del telefono, non di un bambino.
- ⚙️ **Impostazioni**: passa il gioco, il codice, segnala; e una tendina **«Avanzate»** con quello che di base non si tocca: giochi in prova, sblocca tutti i livelli, le regole delle monete di tutti, fps e benchmark.

## L'età dalla data di nascita (**fatto**, rifatto il 21/10 sulla classe)

`settings.nascita = { m, a }` (mese 0-11 e anno; solo sul telefono, mai nel servizio) e `settings.scarto` (di quante classi sopra o sotto la sua
si è tarato). **L'età che i giochi leggono resta `settings.eta`**: la data dice a quale età *dovrebbe* essere (`etaDaNascita`), il resto del motore non
cambia. **Non sono gli anni compiuti ma la classe**: si passa di classe a **settembre**, non al compleanno (un nato a novembre 2018 è in terza,
cioè 8, a ottobre 2026 pur avendo 7 anni e 11 mesi); `etaDiClasse` in `data/nascita.js` = anno scolastico meno anno di nascita (terza = 8, prima media
= 11), e lo scarto misura quanto i grandi se ne sono allontanati (un anticipatario, una classe ripetuta). Le schermate dicono «è in terza elementare,
a metà anno» (`inClasse`), mai «8 anni come in terza». Basta mese e anno, non si chiede il giorno.
- **Un cambio di classe nella stessa fascia** (a settembre: 9→10, 6→7): l'età si aggiorna **in silenzio** all'avvio (`store/compleanno.js`), perché cambiano solo le
  domande, che si spostano da sole.
- **Un cambio di classe che cambia fascia** (7→8, 8→9): **non cambia niente da solo** (`spostaLEta` riscrive giochi, saperi e ritocchi): un avviso nella
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
