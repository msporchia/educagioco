# Da fare — la fattoria 3D

Le voci aperte. Una riga ciascuna, e quando una si chiude si toglie.

- **Misurare su un telefono vero.** Tutti i numeri di peso (draw call, fps, caldo, batteria) sono da SwiftShader; il
  pannello ⚙ e «Mostra il rapporto» servono a questo. Dopo la misura si decide se serve un degrado a scalini (ora non c'è: i
  pezzi si spengono a mano dalle opzioni).
- **Giocare la taratura.** Prezzi e tempi sono misurati sul metro (`npm run tara:fattoria3d`, [livelli.md](livelli.md)) ma non ancora giocati da un
  bambino: la lana (25 s), il riposo del banco (3 minuti) e quello della mongolfiera (2 minuti) restano da prova.
- **Giocare i prezzi delle bestie.** Pecora 20 (+10), gallina 15 (+8), mucca 30 (+15) sono scelti sul metro di
  [calibrazione.md](../apprendimento/calibrazione.md) e sul prezzo del pezzo, non ancora giocati; i fogli ridisegnati
  (macchine, banco, livelli) non sono stati visti su uno schermo da 360 px.
- **La bacheca degli ordini non è stata vista.** `Bacheca.vue` (360 px e tablet) è scritta ma non guardata su uno schermo né provata col dito: il dettaglio attaccato
  in basso copre parte della tavola quando i biglietti sono otto; il test d'integrazione del banco è aggiornato ma non eseguito. Quando `Faccia.vue` c'è,
  `MerceBacheca.vue` si sostituisce con una riga e `Banco.vue` si toglie. I posti per livello (3/4/5/6/8) sono da giocare.
- **Il primo giro.** Nessuna guida: un bambino che apre per la prima volta vede il prato e le azioni, e basta
  ([../core/guida.md](../core/guida.md)).
- **Ruotare i pezzi.** E, se serve sistemare un fantasma lontano, una vista «tutto» a un tasto (la telecamera alta del costruire è stata tolta con la barra).
- **Il menu «Costruisci qui» non è stato visto da un bambino né su un telefono**: la pressione lunga (0,45 s) e il fantasma da sistemare col dito sono da giocare; l'atlante della fattoria 2D (1,9 MB) entra nel gruppo `fattoria3d` del sito spezzato (`Faccia.vue`; le carte ora mostrano il modello 3D).
- **Le anteprime 3D non sono viste su un telefono.** Provate in Chrome senza schermo (SwiftShader): si dovrebbe misurare il tempo della preparazione e vedere se il render target a 4 campioni regge sui telefoni più vecchi (se no, `samples: 0`); il decoro grande (fontana, ponte) è inquadrato dalla scatola, non guardato uno per uno.
- **Gli addobbi** della fattoria di sempre non ci sono.
- **three e il gruppo `mate`.** Nel sito spezzato three è nel gruppo degli Asteroidi: chi non l'ha ancora scaricato lo
  prende a richiesta alla prima apertura. Se pesa si sposta in un gruppo condiviso.
- **Suoni.** Nessuno (e col suono spento tutto resta intero: [la regola](../../CLAUDE.md)).
- **Le novità per i bambini.** Nessuna riga: un gioco in prova non la vuole ([../genitori/novita-bambini.md](../genitori/novita-bambini.md)).
- **I vicini.** Provati nel browser senza schermo vero e senza un build del sito spezzato: restano da guardare su un telefono (due contesti WebGL durante
  una visita) e da giocare i numeri del trattore e dei villaggi ([vicini.md](vicini.md)).
- **Le macchine della 2D non portate** ([merci-e-ricette.md](merci-e-ricette.md)): friggitoria (patatine, pesce fritto, arancini) e sushi bar (sushi, maki):
  il pesce non c'è (serve la peschiera) e il riso, che c'è, non basta da solo; pentolone e fienile (mangimi: qui le bestie mangiano i raccolti); i recinti oltre
  pollaio e stalla (ovile, porcile, anatre, capre, api, alpaca, asini, peschiera); le **caramelle** dello zuccherificio (vogliono il miele, delle api). Telaio,
  zuccherificio, sartoria e tintoria sono portati (lana come ingrediente, senza cotone: la 2D non ce l'ha).
- **Il telaio, la sartoria, la tintoria e lo zuccherificio non sono stati visti in scena né giocati**: i quattro modelli sono guardati solo dal catalogo 3D, i posti
  (−9,−4 · 6,4 · 6,0 · −9,4) e i prezzi (70 · 130 · 150 · 160) non sono stati provati con un bambino, e `integrazione/fattoria3d` non è stato eseguito.
  Il tetto dell'ultimo livello è salito da 5 h 30 a 7 ore ([livelli.md](livelli.md)): da giocare. La lana fa da ingrediente ma il foglio della macchina la mostra
  col contatore della tosa (il gettone verde/rosso), non c'è ancora un'altra scorta di lana.
- **La zucca e la patata hanno poche uscite**: le chiede la 2D al pentolone (la lavanda ora ha la tintoria).
- **I modelli di pastificio e cucina** (`creaPasticceria`, `creaConserviera`) sono ancora quelli di una pasticceria e di una conserviera: da ridisegnare
  con il mestiere giusto (pasta, forno, pentole).
- **L'atlante nel sito spezzato.** `atlante.js` della 2D lo importa anche la 3D (`Faccia.vue`, `facce.js`, `Provino.vue`): il modulo diventa un
  file condiviso nella base e il PNG resta nel gruppo `fattoria`. Da guardare con `node strumenti/prova-sito.mjs` (offline, solo la 3D).
- **Il foglio della macchina non è stato visto né provato col dito vero** (scritto senza build: `integrazione/fattoria3d` ha il tocco e due trascinate da eseguire): da guardare a 360 px, a 820 px e in orizzontale. Manca «accelera» (il motore non anticipa una cottura) e il ritiro di un solo pronto; `stile.css` ha ancora le regole morte `.f3-forno`, `.f3-pronti`, `.f3-ricette`, `.f3-gt` di prima, da togliere.
- **La mongolfiera non è stata vista.** `Mongolfiera.vue` (360 px e tablet, cielo, cassette, pallone) è scritta ma non guardata su uno schermo né provata col dito
  (la build era vietata mentre altri lavoravano): il dito sul foglio e il pallone che parte e torna nella scena sono da guardare ([mongolfiera.md](mongolfiera.md)). Da giocare: i pezzi
  per cassa (1–2 sotto il livello 14, 1–3 dopo), il riposo di 2 minuti, le soglie del traguardo «Sulla mongolfiera» (10, 40, 120 casse). Manca la quarta fila alta della 2D e un test d'integrazione col dito.
- **Il peso della scena, il giro dopo** (misure e rimedi già fatti: [scena.md](scena.md) «Qualità e peso»; stato pieno ~1380 draw call a ombra piena, 960 senza ombre). Da fare quando gli altri
  hanno finito coi modelli, in quest'ordine:
  1. **Fondere le mesh di ogni edificio e di ogni pezzo per materiale** (`BufferGeometryUtils.mergeGeometries`, con un gruppo per materiale; si lascia fuori ciò che si muove: `userData.gira/anima/fumo/volo`, le
     ruote, le pale, le bestie): da ~960 a ~250 draw call nella passata principale e da ~420 a ~100 in quella dell'ombra. Stima: −60% del JS di disegno, il guadagno più grosso rimasto. Si fa in
     `Pezzi._creaCosa/_creaEdificio` con una funzione che riceve il gruppo e una lista di nomi da lasciare sciolti; le macchine nuove dichiarano cosa si muove.
  2. **Il campo**: 17 istanze per campo (una per figura di coltura) × 7 campi = 119 draw call; con un'unica `InstancedMesh` per coltura *e* per tutti i campi (indice di campo nel colore o in un attributo) scendono a ~15.
  3. **Istanziare le cose che si ripetono**: aiuole, panchine, pali del recinto dei pezzi, i quattro fiori; uno stesso edificio ripetuto non c'è, ma le gelosie, le finestre e le tegole sì.
  4. **I compagni sono pesanti** (gatto ~7000 triangoli, cane 6000: più di tutta la stalla): una geometria più povera, o un LOD a 1500 triangoli oltre i 12 m (3 gatti + cane = 27k ×2 con l'ombra).
  5. **LOD e cartelli**: oltre una certa distanza dalla camera (zoom lontano) i pezzi piccoli non si disegnano e non proiettano; i cartelli non servono oltre i 18 m.
  6. **L'antialias**: `antialias: true` non si cambia a runtime; sul basso (e sui PC integrati) un renderer senza MSAA o con FXAA a posteriori. Da misurare sulla GPU integrata dell'utente.
  7. **L'ombra con la camera che segue**: oggi si ridisegna a intervalli; con il sole agganciato alla griglia (passo di 2 celle) basterebbe ridisegnarla solo quando cambia qualcosa o la griglia scatta.
