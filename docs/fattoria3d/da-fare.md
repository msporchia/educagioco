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
- **Il primo giro.** Nessuna guida: un bambino che apre per la prima volta vede il prato e le azioni, e basta
  ([../core/guida.md](../core/guida.md)).
- **Ruotare i pezzi** e una vista «tutto» a un tasto.
- **Gli addobbi** della fattoria di sempre non ci sono.
- **three e il gruppo `mate`.** Nel sito spezzato three è nel gruppo degli Asteroidi: chi non l'ha ancora scaricato lo
  prende a richiesta alla prima apertura. Se pesa si sposta in un gruppo condiviso.
- **Suoni.** Nessuno (e col suono spento tutto resta intero: [la regola](../../CLAUDE.md)).
- **Le novità per i bambini.** Nessuna riga: un gioco in prova non la vuole ([../genitori/novita-bambini.md](../genitori/novita-bambini.md)).
- **I vicini.** Provati nel browser senza schermo vero e senza un build del sito spezzato: restano da guardare su un telefono (due contesti WebGL durante
  una visita) e da giocare i numeri del trattore e dei villaggi ([vicini.md](vicini.md)).
