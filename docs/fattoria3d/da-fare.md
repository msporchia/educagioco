# Da fare — la fattoria 3D

Le voci aperte. Una riga ciascuna, e quando una si chiude si toglie.

- **Misurare su un telefono vero.** Tutti i numeri di peso (draw call, fps, caldo, batteria) sono da SwiftShader; il
  pannello ⚙ e «Mostra il rapporto» servono a questo. Dopo la misura si decide se serve un degrado a scalini (ora non c'è: i
  pezzi si spengono a mano dalle opzioni).
- **Giocare la taratura.** Prezzi e tempi sono misurati sul metro (`npm run tara:fattoria3d`, [livelli.md](livelli.md)) ma non ancora giocati da un
  bambino: la lana (25 s), il viaggio della mongolfiera (14 s) e il riposo del banco (3 minuti) restano da prova.
- **Giocare i prezzi delle bestie.** Pecora 20 (+10), gallina 15 (+8), mucca 30 (+15) sono scelti sul metro di
  [calibrazione.md](../apprendimento/calibrazione.md) e sul prezzo del pezzo, non ancora giocati; i fogli ridisegnati
  (macchine, banco, livelli) non sono stati visti su uno schermo da 360 px.
- **La bacheca degli ordini non è stata vista.** `Bacheca.vue` (360 px e tablet) è scritta ma non guardata su uno schermo né provata col dito: il dettaglio attaccato
  in basso copre parte della tavola quando i biglietti sono otto; il test d'integrazione del banco è aggiornato ma non eseguito. Quando `Faccia.vue` c'è,
  `MerceBacheca.vue` si sostituisce con una riga e `Banco.vue` si toglie. I posti per livello (3/4/5/6/8) sono da giocare.
- **Il primo giro.** Nessuna guida: un bambino che apre per la prima volta vede il prato e le azioni, e basta
  ([../core/guida.md](../core/guida.md)).
- **Ruotare i pezzi.** E, se serve sistemare un fantasma lontano, una vista «tutto» a un tasto (la telecamera alta del costruire è stata tolta con la barra).
- **Il menu «Costruisci qui» non è stato visto da un bambino né su un telefono**: la pressione lunga (0,45 s) e il fantasma da sistemare col dito sono da giocare; l'atlante della fattoria 2D (1,9 MB) entra ora anche nel gruppo `fattoria3d` del sito spezzato (`Provino.vue`).
- **Gli addobbi** della fattoria di sempre non ci sono.
- **three e il gruppo `mate`.** Nel sito spezzato three è nel gruppo degli Asteroidi: chi non l'ha ancora scaricato lo
  prende a richiesta alla prima apertura. Se pesa si sposta in un gruppo condiviso.
- **Suoni.** Nessuno (e col suono spento tutto resta intero: [la regola](../../CLAUDE.md)).
- **Le novità per i bambini.** Nessuna riga: un gioco in prova non la vuole ([../genitori/novita-bambini.md](../genitori/novita-bambini.md)).
- **I vicini.** Provati nel browser senza schermo vero e senza un build del sito spezzato: restano da guardare su un telefono (due contesti WebGL durante
  una visita) e da giocare i numeri del trattore e dei villaggi ([vicini.md](vicini.md)).
- **Le macchine della 2D non portate** ([merci-e-ricette.md](merci-e-ricette.md)): telaio (stoffa), sartoria (maglione, sciarpa, berretto), tintoria
  (tintura, sapone, sacchetto, maglione alla lavanda), zuccherificio (zucchero, caramelle, marmellata), friggitoria (patatine, pesce fritto,
  arancini), sushi bar (sushi, maki), pentolone e fienile (mangimi: qui le bestie mangiano i raccolti), i recinti oltre pollaio e stalla (ovile,
  porcile, anatre, capre, api, alpaca, asini, peschiera). Chiedono colture e merci che la 3D non ha (cavolfiori, peperoni, aglio, barbabietola,
  riso, miele, pesce, lana come merce): quando arrivano, le tre ricette adattate (salsa, minestrone, gelato) tornano quelle della 2D.
- **La lavanda, la patata e la zucca hanno poche uscite** (la lavanda solo il banco e i vicini): le chiede la 2D alla tintoria e al pentolone.
- **I modelli di pastificio e cucina** (`creaPasticceria`, `creaConserviera`) sono ancora quelli di una pasticceria e di una conserviera: da ridisegnare
  con il mestiere giusto (pasta, forno, pentole).
- **L'atlante nel sito spezzato.** `atlante.js` della 2D lo importa anche la 3D (`Faccia.vue`, `facce.js`, `Provino.vue`): il modulo diventa un
  file condiviso nella base e il PNG resta nel gruppo `fattoria`. Da guardare con `node strumenti/prova-sito.mjs` (offline, solo la 3D).
