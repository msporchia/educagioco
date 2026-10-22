# Da fare — la fattoria 3D

Le voci aperte tecniche. Una riga ciascuna, e quando una si chiude si toglie. Quello che manca rispetto alla fattoria 2D sta in [parita/](parita/README.md).

- **Misurare su un telefono vero.** Tutti i numeri di peso (draw call, fps, caldo, batteria) sono da SwiftShader; il
  pannello ⚙ e «Mostra il rapporto» servono a questo. Il degrado adattivo c'è (`dati/degrado.js`, scende sotto 30 fps): dopo la misura si tarano le soglie.
- **Giocare la taratura.** Prezzi e tempi sono misurati sul metro (`npm run tara:fattoria3d`, [livelli.md](livelli.md)) ma non ancora giocati da un
  bambino: la lana (25 s), il riposo del banco (3 minuti) e quello della mongolfiera (2 minuti) restano da prova.
- **Giocare i prezzi delle bestie.** Pecora 20 (+10), gallina 15 (+8), mucca 30 (+15) sono scelti sul metro di
  [calibrazione.md](../apprendimento/calibrazione.md) e sul prezzo del pezzo, non ancora giocati; i fogli ridisegnati
  (macchine, banco, livelli) non sono stati visti su uno schermo da 360 px.
- **La bacheca degli ordini non è stata vista.** `Bacheca.vue` (360 px e tablet) è scritta ma non guardata su uno schermo né provata col dito: il dettaglio attaccato
  in basso copre parte della tavola quando i biglietti sono otto; il test d'integrazione del banco è aggiornato ma non eseguito. Quando `Faccia.vue` c'è,
  `MerceBacheca.vue` si sostituisce con una riga e `Banco.vue` si toglie. I posti per livello (3/4/5/6/8) sono da giocare.
- **I tre stadi delle bestie non sono visti dalla telecamera di gioco.** Guardati nel catalogo 3D (una voce per stadio, da vicino e a 40°) e provati nei test unitari, non dalla distanza di serie (~22) né su un telefono: da giudicare se alone, secchio, uovo enorme e nuvola ×1,3 bastano a colpo d'occhio, e se la mucca pronta (corpo +12%) si distingue abbastanza ([animali.md](animali.md) «I tre stadi»).
- Spostata in [parita/](parita/README.md) (I2).
- **Gli edifici liberi non sono stati visti col dito né su un telefono** ([edifici-liberi.md](edifici-liberi.md)): provati nei test unitari e in Chrome (dev server: acquisto dal menu, il «!» sul tasto e sulle carte, nessun fantasma);
  `integrazione/fattoria3d` è aggiornato (la gelateria dal menu, il «!», nessun fantasma) ma **non eseguito** (la build era vietata). Da guardare: il «!» e la riga «Serve il Panificio» nel banco su 360 px, il rimbalzo dell'edificio
  appena posato, trascinare un edificio 3×3 in un terreno stretto. Un edificio si può girare ([rotazione.md](rotazione.md)); se il suo davanti finisce contro un muro di alberi il contadino lo serve da un altro lato.
- **Il pezzo al dito e lo scorrimento ai bordi non sono stati provati su un telefono** ([scena.md](scena.md), «Costruire»): provati in Chrome (dev server, dito vero via CDP: presa, +3 celle, camera a ~7,7 celle/s a 18 px dal bordo, ferma fuori fascia e a dito alzato, pennello compreso) e nei test unitari;
  `integrazione/fattoria3d` è aggiornato ma **non eseguito sulla build** (vietata). Da sentire col dito: i 40 px di rialzo, la fascia di 72 px (la barra in alto è stimata 64 px), le 2–12 celle/s.
- **Ruotare i pezzi: fatto** ([rotazione.md](rotazione.md)), ma **non provato col dito su un telefono**: il tasto ↻ con un secondo dito mentre il primo tiene il pezzo (in test con due tocchi CDP), la sua posizione a 360 px sopra la fascia «metti via», se un quarto di giro alla volta basta ai più piccoli. Resta, se serve sistemare un fantasma lontano, una vista «tutto» a un tasto (la telecamera alta del costruire è stata tolta con la barra).
- **Le stagioni non sono viste su un telefono** ([stagioni.md](stagioni.md)): provate in Chrome senza schermo (Natale ≤ 8 draw call in più, Halloween con le zucche). Da giudicare: se i fiocchi (420 punti) si vedono a distanza di gioco, se le chiazze bastano a dire «inverno» senza il suolo bianco né i tetti innevati, il tramonto di Halloween a 360 px.
- **Il menu «Costruisci qui» non è stato visto da un bambino né su un telefono**: la pressione lunga (0,45 s) e il fantasma da sistemare col dito sono da giocare; l'atlante della fattoria 2D (1,9 MB) entra nel gruppo `fattoria3d` del sito spezzato (`Faccia.vue`; le carte ora mostrano il modello 3D).
- **Le anteprime 3D non sono viste su un telefono.** Provate in Chrome senza schermo (SwiftShader): si dovrebbe misurare il tempo della preparazione e vedere se il render target a 4 campioni regge sui telefoni più vecchi (se no, `samples: 0`); il decoro grande (fontana, ponte) è inquadrato dalla scatola, non guardato uno per uno.
- **I laghi naturali nuovi non sono visti su un telefono** ([laghi.md](laghi.md)): guardati in Chrome senza schermo (un lago grande a cavallo di tre lotti) e provati nei test unitari e in `integrazione/fattoria3d` (verde); non è provata la pesca
  nei laghi della fascia di mezzo col dito. Da giocare: se 12% di acqua e le catene di ponti da 13 celle sono troppe o poche per un bambino.
- **Un lotto vecchio dentro un lago nuovo ha il bordo tagliato dritto** ([laghi.md](laghi.md), «I salvataggi di prima»): scelta per non toccare i pezzi piazzati; se si vede brutto, si può allargare il lago sui lotti non comprati confinanti.
- **La pesca, il mare e i laghi non sono stati visti su un telefono né giocati** ([geografia-e-pesca.md](geografia-e-pesca.md)): provati in Chrome senza schermo (dev server: il mare, la costa, un lago con molo e contadino, il lancio, il galleggiante, «Abbocca!», il pesce, le anteprime delle carte) e nei test unitari; `integrazione/fattoria3d` ha il blocco «la pesca» ma **non è stato eseguito** (la build era vietata). Da guardare: i pesciolini a distanza di gioco e a 360 px, il mare dall'alto dopo qualche lotto, il porticciolo su una costa vera (non ruota: guarda sempre verso +z), se 12 s di attesa e un minuto di riposo vanno bene a un bambino, e se il pesce (che si pesca dal 4 ma serve dal 17) si accumula senza scopo troppo a lungo.
- Spostata in [parita/](parita/README.md) (A1k).
- **Gli amici e i vicini non conoscono `geo`.** Lo snapshot di una fattoria non dice se ha la geografia grande: la fattoria di un amico con lotti nelle zone del mare o dei laghi si vede com'era prima ([geografia-e-pesca.md](geografia-e-pesca.md)); un villaggio col molo è facoltativo e non c'è. Il cartello «🌊 mare» sui lotti e le dune della spiaggia (ci sono sabbia e canne, non dune) non sono visti da un bambino.
- **Il mondo senza confini non è stato visto sul telefono né provato col dito**: provato in Chrome senza schermo (dev server) e nei test unitari; `integrazione/fattoria3d` è aggiornato (`lottiComprabili()`, `strada` è una mappa) ma non eseguito. Da guardare: il peso della finestra 9×9 (alberi e ciuffi), il laghetto a 360 px, un ponte attraversato dal vero, la lontananza (camera libera a 30 celle).
- Spostata in [parita/](parita/README.md) (A13).
- **three e il gruppo `mate`.** Nel sito spezzato three è nel gruppo degli Asteroidi: chi non l'ha ancora scaricato lo
  prende a richiesta alla prima apertura. Se pesa si sposta in un gruppo condiviso.
- Spostata in [parita/](parita/README.md) (I26).
- Spostata in [parita/](parita/README.md) (I20).
- **I vicini.** Provati nel browser senza schermo vero e senza un build del sito spezzato: restano da guardare su un telefono (due contesti WebGL durante
  una visita) e da giocare i numeri del trattore e dei villaggi ([vicini.md](vicini.md)).
- **Il telaio, la sartoria, la tintoria e lo zuccherificio non sono stati visti in scena né giocati**: i quattro modelli sono guardati solo dal catalogo 3D, i posti
  (−9,−4 · 6,4 · 6,0 · −9,4) e i prezzi (70 · 130 · 150 · 160) non sono stati provati con un bambino, e `integrazione/fattoria3d` non è stato eseguito.
  Il tetto dell'ultimo livello è salito da 5 h 30 a 7 ore ([livelli.md](livelli.md)): da giocare. La lana fa da ingrediente ma il foglio della macchina la mostra
  col contatore della tosa (il gettone verde/rosso), non c'è ancora un'altra scorta di lana.
- **Il mangime non è stato visto né giocato** ([mangime-e-catena.md](mangime-e-catena.md)): il modello del fienile (`creaFienileMacchina`) è guardato solo nei test unitari, non dal catalogo 3D né in scena; sono due fienili in vista (quello di scena e quello che si costruisce) e forse uno va tolto; `integrazione/fattoria3d` e `fattoria3d-vicini` sono aggiornati ma **non eseguiti** (la build era vietata). Da giocare: il fienile al livello 2 (🪙40) e quanto pesa la prima fame del recinto al 4, che chiede foraggio.
- **I modelli di pastificio e cucina** (`creaPasticceria`, `creaConserviera`) sono ancora quelli di una pasticceria e di una conserviera: da ridisegnare
  con il mestiere giusto (pasta, forno, pentole).
- **L'atlante nel sito spezzato.** `atlante.js` della 2D lo importa anche la 3D (`Faccia.vue`, `facce.js`, `Provino.vue`): il modulo diventa un
  file condiviso nella base e il PNG resta nel gruppo `fattoria`. Da guardare con `node strumenti/prova-sito.mjs` (offline, solo la 3D).
- **Il foglio della macchina e i vani dei posti da comprare non sono stati visti col dito vero** (scritto senza build: `integrazione/fattoria3d` ha il tocco e due trascinate da eseguire): da guardare a 360 px, a 820 px e in orizzontale. Manca «accelera» (il motore non anticipa una cottura) e il ritiro di un solo pronto.
- **La mongolfiera non è stata vista.** `Mongolfiera.vue` (360 px e tablet, cielo, cassette, pallone) è scritta ma non guardata su uno schermo né provata col dito
  (la build era vietata mentre altri lavoravano): il dito sul foglio e il pallone che parte e torna nella scena sono da guardare ([mongolfiera.md](mongolfiera.md)). Da giocare: i pezzi
  per cassa (1–2 sotto il livello 14, 1–3 dopo), il riposo di 2 minuti, le soglie del traguardo «Sulla mongolfiera» (10, 40, 120 casse). Manca la quarta fila alta della 2D e un test d'integrazione col dito.
- **Il costo dell'avvio dei modelli.** Dopo la cache ([scena.md](scena.md) «La cache dei modelli») ogni tipo si costruisce una volta; all'avvio non ci sono più i fantasmi degli 11 edifici (si costruiscono quando servono, o nel riscaldamento),
  il contadino e i compagni (cane e gatti: 13–21 ms la prima volta in node). Su un telefono sarebbero ×5–8: da misurare. Se pesa, si scaglionano sui primi fotogrammi (i test d'integrazione cercano i gruppi subito:
  vanno aspettati). **Cuocere le geometrie a monte è stato valutato e scartato** (~400 kB per 26 tipi contro un tetto di ~150 kB, per ~22 ms su un PC): se un giorno il file cresce meno o un modello si fa grande, si rifà il conto.
- **Il peso della scena, il giro dopo** (misure e rimedi già fatti: [scena.md](scena.md) «Qualità e peso»; stato pieno ~430 draw call dopo la fusione delle mesh). In quest'ordine:
  1. **Il campo** (la prima voce dopo la fusione delle mesh, fatta il 21/10: [scena.md](scena.md)): 17 istanze per campo (una per figura di coltura) × 7 campi = 119 draw call, ora un quarto dei ~430 totali; con un'unica `InstancedMesh` per coltura *e* per tutti i campi scendono a ~15 (−100 draw call). Non fatto perché le istanze vivono nel `Group` di ogni campo e le muove `aggiornaCampo`: condividerle vuole che `pezzi.js` possieda le istanze e dia a ogni campo una fetta (e `terreno.js`/il motore sanno dei campi): da fare quando il mondo senza confini è chiuso.
  2. **Istanziare le cose che si ripetono**: aiuole, panchine, pali del recinto dei pezzi, i quattro fiori; uno stesso edificio ripetuto non c'è, ma le gelosie, le finestre e le tegole sì.
  3. **I compagni sono pesanti** (gatto ~7000 triangoli, cane 6000: più di tutta la stalla): una geometria più povera, o un LOD a 1500 triangoli oltre i 12 m (3 gatti + cane = 27k ×2 con l'ombra).
  4. **LOD e cartelli**: oltre una certa distanza dalla camera (zoom lontano) i pezzi piccoli non si disegnano e non proiettano; i cartelli non servono oltre i 18 m.
  5. **L'antialias**: `antialias: true` non si cambia a runtime; sul basso (e sui PC integrati) un renderer senza MSAA o con FXAA a posteriori. Da misurare sulla GPU integrata dell'utente.
  6. **L'ombra con la camera che segue**: oggi si ridisegna a intervalli; con il sole agganciato alla griglia (passo di 2 celle) basterebbe ridisegnarla solo quando cambia qualcosa o la griglia scatta.
- **«Quando ci premi» non è stato visto col dito** ([compagni.md](compagni.md)): le pose (rotola, zampa, riporta, sbadiglio, struscio, naso a naso) sono guardate solo dal catalogo 3D e provate in node; da giudicare in gioco i tempi, il gesto «chiama» del contadino (anche per i gatti, ora chiamati per nome) e se il bastoncino ai piedi si legge.
