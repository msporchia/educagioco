# Il riordino delle impostazioni (proposta)

**Stato: proposta approvata a voce dall'utente (20 ottobre 2026), da fare a pezzi.** La pagina dei grandi aveva tre schede e ~16 sezioni:
cose di un bambino, cose del telefono e strumenti da sviluppatore mescolate, e i tasti che cancellano a un tocco da quelli innocui.

## La forma

Una barra in basso con quattro schede, ognuna «di chi è»:
- 🎮 **Giochi**: il carosello e le impostazioni di un gioco ([giochi.md](giochi.md)) — **fatto**.
- 👶 **Bambino**: faccia e nome, età, amici online, progressi di lui.
- 📊 **Come va**: la settimana, cosa guardare, i grafici.
- 🏠 **Casa**: codice, salvataggio (con l'avviso «ultimo salvataggio: 12 giorni fa»), versione, giochi in prova, aggiungi un bambino, aiuto; e due
  tendine chiuse: **«Per chi sviluppa»** (contatore fps, fascia grafica, benchmark) e **«Zona delicata»** (azzera, cestino).
In cima a tutto il bambino scelto (le impostazioni sono sempre «di Leonardo»), con la lente per cercare un'impostazione.

## L'età dalla data di nascita

Oggi `settings.eta` è un numero fisso. Con **mese e anno di nascita** (solo sul telefono, mai nel servizio) l'età si tiene aggiornata da sola.
- **La manopola diventa «un po' più avanti o indietro»**: uno scarto di un anno sopra o sotto gli anni veri, non un numero.
- **Al compleanno non cambia niente da solo**: `spostaLEta` riscrive giochi, saperi e ritocchi, e rifarlo in automatico cancellerebbe scelte dei grandi.
  Arriva un avviso nella posta dei grandi («Leonardo compie 9 anni: si aprirebbero Sotterraneo e Robot») con un tasto «passa ai 9 anni».
- **I profili che ci sono già** non hanno la data: restano con l'età di adesso, e il grande può aggiungerla quando vuole.
- **Il modulo del bambino nuovo** (`Benvenuto.vue`) chiede mese e anno, con la manopola come scorciatoia; i test che la premono otto volte si adattano.

## Ordine del lavoro

1. Le domande di ogni gioco e la pagina del gioco — **fatto** ([giochi.md](giochi.md)).
2. La data di nascita con l'avviso al compleanno.
3. La barra in basso con Bambino, Come va e Casa, e il bambino scelto in cima.
4. Le tendine («Per chi sviluppa», «Zona delicata»), gli avvisi in cima a Casa, la lente.
5. I grafici di «Come va» (andamento delle risposte giuste, cosa guardare).
