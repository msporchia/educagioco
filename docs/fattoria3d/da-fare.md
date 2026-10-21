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
- **Gli edifici liberi non sono stati visti col dito né su un telefono** ([edifici-liberi.md](edifici-liberi.md)): provati nei test unitari e in Chrome (dev server: acquisto dal menu, il «!» sul tasto e sulle carte, nessun fantasma);
  `integrazione/fattoria3d` è aggiornato (la gelateria dal menu, il «!», nessun fantasma) ma **non eseguito** (la build era vietata). Da guardare: il «!» e la riga «Serve il Panificio» nel banco su 360 px, il rimbalzo dell'edificio
  appena posato, trascinare un edificio 3×3 in un terreno stretto. Un edificio guarda sempre verso +z (non si ruota: vedi sotto), quindi il suo davanti può finire contro un muro di alberi (allora il contadino lo serve da un altro lato).
- **Il pezzo al dito e lo scorrimento ai bordi non sono stati provati su un telefono** ([scena.md](scena.md), «Costruire»): provati in Chrome (dev server, dito vero via CDP: presa, +3 celle, camera a ~7,7 celle/s a 18 px dal bordo, ferma fuori fascia e a dito alzato, pennello compreso) e nei test unitari;
  `integrazione/fattoria3d` è aggiornato ma **non eseguito sulla build** (vietata). Da sentire col dito: i 40 px di rialzo, la fascia di 72 px (la barra in alto è stimata 64 px), le 2–12 celle/s.
- **Ruotare i pezzi** (anche gli edifici, che oggi guardano tutti verso +z). E, se serve sistemare un fantasma lontano, una vista «tutto» a un tasto (la telecamera alta del costruire è stata tolta con la barra).
- **Il menu «Costruisci qui» non è stato visto da un bambino né su un telefono**: la pressione lunga (0,45 s) e il fantasma da sistemare col dito sono da giocare; l'atlante della fattoria 2D (1,9 MB) entra nel gruppo `fattoria3d` del sito spezzato (`Faccia.vue`; le carte ora mostrano il modello 3D).
- **Le anteprime 3D non sono viste su un telefono.** Provate in Chrome senza schermo (SwiftShader): si dovrebbe misurare il tempo della preparazione e vedere se il render target a 4 campioni regge sui telefoni più vecchi (se no, `samples: 0`); il decoro grande (fontana, ponte) è inquadrato dalla scatola, non guardato uno per uno.
- **La pesca.** I laghetti (dei lotti e quelli costruiti dal bambino: stagno e laghetto) ci sono, con ponti e canne, ma non si pesca: manca il pezzo `molo`, l'azione «pesca» e il prodotto `pesce` (le basi sono `generaLotto(..).molo` e `acqua(i, j)`: [laghi.md](laghi.md)). Con la pesca arrivano la **peschiera** (recinto-macchina accanto a un lago) e il pesce per friggitoria e sushi bar (voce qui sotto).
- **Il mondo senza confini non è stato visto sul telefono né provato col dito**: provato in Chrome senza schermo (dev server) e nei test unitari; `integrazione/fattoria3d` è aggiornato (`lottiComprabili()`, `strada` è una mappa) ma non eseguito. Da guardare: il peso della finestra 9×9 (alberi e ciuffi), il laghetto a 360 px, un ponte attraversato dal vero, la lontananza (camera libera a 30 celle).
- **Gli addobbi** della fattoria di sempre non ci sono.
- **three e il gruppo `mate`.** Nel sito spezzato three è nel gruppo degli Asteroidi: chi non l'ha ancora scaricato lo
  prende a richiesta alla prima apertura. Se pesa si sposta in un gruppo condiviso.
- **Suoni.** Nessuno (e col suono spento tutto resta intero: [la regola](../../CLAUDE.md)).
- **Le novità per i bambini.** Nessuna riga: un gioco in prova non la vuole ([../genitori/novita-bambini.md](../genitori/novita-bambini.md)).
- **I vicini.** Provati nel browser senza schermo vero e senza un build del sito spezzato: restano da guardare su un telefono (due contesti WebGL durante
  una visita) e da giocare i numeri del trattore e dei villaggi ([vicini.md](vicini.md)).
- **Le macchine della 2D non portate** ([merci-e-ricette.md](merci-e-ricette.md)): friggitoria (patatine, pesce fritto, arancini) e sushi bar (sushi, maki):
  il pesce non c'è (serve la peschiera, e prima la pesca: [laghi.md](laghi.md)) e il riso, che c'è, non basta da solo; pentolone e fienile (mangimi: qui le bestie mangiano i raccolti); i recinti oltre
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
- **«Quando ci premi» non è stato visto col dito** ([compagni.md](compagni.md)): le pose (rotola, zampa, riporta, sbadiglio, struscio, naso a naso) sono guardate solo dal catalogo 3D e provate in node; da giudicare in gioco i tempi, il gesto «chiama» del contadino e se il bastoncino ai piedi si legge.
