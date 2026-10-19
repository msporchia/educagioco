# Da fare — la fattoria 3D

Le voci aperte. Una riga ciascuna, e quando una si chiude si toglie.

- **Misurare su un telefono vero.** Tutti i numeri di peso (draw call, fps, caldo, batteria) sono da SwiftShader; il
  pannello ⚙ e «Mostra il rapporto» servono a questo. Dopo la misura si decide se serve un degrado a scalini (ora non c'è: i
  pezzi si spengono a mano dalle opzioni).
- **A cosa serve la legna.** Si guadagna abbattendo e non si spende: pezzi o edifici che la chiedono oltre alle monete.
- **Calibrare tempi e prezzi.** I tempi dei campi (14–32 s), della lana (25 s), del forno e del viaggio sono da prova; i
  prezzi vanno rapportati al metro di [calibrazione.md](../apprendimento/calibrazione.md) prima di aprirlo ai bambini.
- **Il primo giro.** Nessuna guida: un bambino che apre per la prima volta vede il prato e le azioni, e basta
  ([../core/guida.md](../core/guida.md)).
- **Ruotare i pezzi** e una vista «tutto» a un tasto.
- **Collegare gli animali da cortile alla scena** (il motore e il disegno ci sono, [animali.md](animali.md)). Tre cose,
  in `scena3d/azioni.js`, `Gioco.vue` e `scena3d/detti.js`:
  - `azioni.js`: un tocco sul `pollaio`/`stalla` (`case` accanto a `recinto` in `fai`) fa `provaCuraBestie(id)`: `raccogli`
    → `raccogliProdotti(id)`, `nutri` → `nutriBestie(id)`, altrimenti una riga col motivo (`manca-raccolto` con `servono` e
    `mangia`, `lavora` con `secondi`). A metà gesto, come le pecore; un testo che vola per ogni evento (`🥚 +1`, `🥛 +1`).
  - `Gioco.vue`: `RICETTE[k].emoji` alle righe che mostrano `prodotti` e la dispensa va in crash con `uova`/`latte` (non sono
    ricette): usare `emojiDi(k, COLTURE)` (già esteso) o `PRODOTTI_ANIMALI`; i contatori dagli eventi `uovo` e `latte`
    (`{ n }`); `compraBestia(id)` va offerta da un menu del pollaio/stalla (prezzo, livello che manca: `non-sbloccato`+`liv`,
    `pieno`).
  - `detti.js`: i motivi nuovi `ha-le-bestie` (mettiVia), `manca-raccolto` per le bestie, `lavora`, `pieno`.
- **Gli addobbi** della fattoria di sempre non ci sono.
- **three e il gruppo `mate`.** Nel sito spezzato three è nel gruppo degli Asteroidi: chi non l'ha ancora scaricato lo
  prende a richiesta alla prima apertura. Se pesa si sposta in un gruppo condiviso.
- **Suoni.** Nessuno (e col suono spento tutto resta intero: [la regola](../../CLAUDE.md)).
- **Le novità per i bambini.** Nessuna riga: un gioco in prova non la vuole ([../genitori/novita-bambini.md](../genitori/novita-bambini.md)).
