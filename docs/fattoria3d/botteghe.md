# Le botteghe del paese

Pasticceria, osteria, mensa e merceria (giro G7 della [parità](parita/commercio.md), righe M10–M14). Sono **edifici unici** come le
macchine ([edifici-liberi.md](edifici-liberi.md): si costruiscono dal menu «Costruisci qui», uno per tipo, dove si vuole) ma **non
lavorano: chiedono**. Ogni bottega ha il suo elenco chiuso di merci e i suoi clienti per mestiere; consegnare rende esperienza ⭐, mai monete.
Sono le sorelle di quelle della fattoria 2D (da Hay Day, sono i visitatori: qualcuno che vuole una cosa sua) e **ne leggono i numeri** (`da2d/dati/botteghe.js`): la 3D non ne scrive
nessuno (decisione D del 22/10/2026: [parita/decisioni.md](parita/decisioni.md), «Regola generale»).

| bottega (tipo 3D) | 🪙 | livello | clienti | disegno |
|:--|--:|--:|:--|:--|
| 🧁 pasticceria (`bottega_pasticceria`) | 180 | 21 | pasticcera, maestra | casetta rosa, vetrina di torte, telo a righe, cupcake gigante che gira |
| 🍷 osteria (`bottega_osteria`) | 220 | 29 | oste, cuoco, pizzaiolo, cuoco del sushi | locanda di sasso, tetto rosso, botti, tavolo apparecchiato, lanterna |
| 🏫 mensa (`bottega_mensa`) | 200 | 36 | maestra, bidello | edificio giallo e azzurro, campanella, bandiera, tavoli con panche |
| 🧶 merceria (`bottega_merceria`) | 240 | 43 | sarta, lavandaia | bottega lilla, scaffale di bobine, manichino, bobina gigante che gira |

Il tipo ha il prefisso `bottega_` perché `pasticceria` è già l'id del Pastificio 3D (macchina, id dei salvataggi). Prezzo e livello vengono da
`VOCE` in `dati/parita2d.js` (`bottega_osteria → osteria`): un test (`guastiDiParita`) li confronta col catalogo 2D. La mensa è il posto dei
bambini: la scuola che chiede la merenda.

## Le regole (tutte della 2D)

- **Un cliente per bancone, una merce sola, 2–4 pezzi** (`PEZZI_MIN`, `PEZZI_MAX`).
- **Il cliente dopo arriva fra 10 e 20 minuti** (`ATTESA_MIN`, `ATTESA_MAX`), sull'orologio, quindi anche a pagina chiusa. «Non mi va» (🗑️) costa quanto
  una consegna, né di più né di meno: qui non c'è niente da scorrere, basta che rifiutare non sia più svelto di consegnare. Non dà esperienza e non è un cuore.
- **Rende il 25% in più del banco** (`premioInBottega` = `premioPer` della 2D × `PIU_DEL_BANCO`, arrotondato): lo stesso conto del banco, mai una formula
  nostra. Dentro il tetto di 🪙6 al minuto (`guastiDelleBotteghe`, controllato per merce e per numero di pezzi, coi minuti della 3D).
- **La fama a cuori**, la progressione per posto che il banco unico non può avere: ogni consegna è un cuore; a cinque (`CUORI`) la bottega cresce di un bancone e i cuori ripartono, fino a tre banconi (`BANCONI_MAX`).
  Non si salva: si conta dalle consegne (`famaDi`). Il bancone nuovo ha subito il suo cliente.
- **Chi chiede cosa**: il cliente è un mestiere della 2D (`CLIENTI` di `src/giochi/fattoria3d/da2d/dati/mercato.js`, con `vuole`); `clientiDellaBottega` della 2D sceglie
  fra i suoi quello che vuole quella merce. Due banconi della stessa bottega non chiedono la stessa merce se ce n'è un'altra.
- **Le merci**: l'elenco di ogni bottega è quello della 2D (`posto.chiede`), nei nomi della 3D (`MERCE_3D`: `carote` → `carota`, `fragole` → `fragola`). La 3D non fa
  `merenda` e `caramelle`: cadono dall'elenco (la pasticceria ne ha nove, la mensa dieci) e ogni bottega arriva con almeno tre merci già chiedibili al suo livello
  (`guastiDelleBotteghe`). Si chiede solo ciò che il livello permette di avere (`livelloDellaMerce`; uova, latte, tartufi e lana: il livello del pezzo che li fa),
  pesato come in 2D (`pesoDellaMerce`: le merci profonde e quelle appena arrivate escono di più). Non serve avere la macchina in mappa.

## Dove sta cosa

| file | cosa |
|---|---|
| `dati/botteghe.js` | foglia di `catalogo.js` (come `cortile.js`): le costanti e le funzioni della 2D, `SORELLA_2D`, `BOTTEGHE` (merci 3D e clienti), `EDIFICI_BOTTEGHE` (le quattro voci del catalogo, 3×3, `bottega: true`), `prodotto2D`/`MERCE_3D` |
| `motore/botteghe.js` | le regole sulla `Fattoria3d`: `componiCliente`, `aggiornaLaBottega`, `consegnaInBottega`, `rifiutaInBottega`, `leggiLeBotteghe`, `vistaDellaBottega`, `guastiDelleBotteghe`; i metodi sottili `vistaBottega`, `consegnaBottega`, `rifiutaBottega`, `bottegaPronta`, `botteghePronte` sono in `fattoria3d.js`, e `tick()` rimette a posto i banconi |
| `viste/Bottega.vue`, `stile-bottega.css` | il foglio: insegna col colore della bottega, i cinque cuori, un foglietto per bancone (mestiere, merce con `ho/serve`, ⭐, «Consegna», 🗑️), il bancone vuoto che dice fra quanti minuti torna qualcuno |
| `scena3d/modelli-botteghe.js` | i quattro modelli (3–5 mesh fuse, < 1000 triangoli l'uno), `userData.anima` con un dettaglio che si muove piano |
| `scena3d/pezzi.js`, `azioni.js`, `Gioco.vue` | il cartello «🧁 N pronti!» sull'edificio (clienti che hanno già la roba), il tocco che apre il foglio, il foglio |

Gli stessi file condivisi toccati: `catalogo.js` (una riga: `...EDIFICI_BOTTEGHE`), `dati/mondo.js` (i quattro posti storici `nuovo: true`, solo per i controlli),
`dati/carte.js` (`DISEGNI`), `dati/livelli.js` (`NOMI`; una bottega non ha ricette, come la mongolfiera), `dati/parita2d.js` (`VOCE`), `motore/migra.js`
(le botteghe della 2D diventano le botteghe 3D nel magazzino, con le consegne: la fama si porta dietro), `motore/tipo.js` (`TERRA_MAX` +12: quattro edifici 3×3 in più
nella fattoria «tipo»).

## Lo stato

`stato.botteghe[tipo] = { consegne, prossimo, banconi }`, senza cambiare `VERSIONE_STATO` (uno stato di prima non ne ha: `normalizza` lo rifà vuoto, le botteghe nascono
al primo `tick` dopo che l'edificio è in mappa). Un bancone è `{ id, chi, chiede: { chiave3D: n }, xp, nato }` (c'è un cliente), `{ dal }` (aspetta fino a quel momento)
o `null`. `leggiLeBotteghe` non lancia mai: tiene un cliente solo se chiede una merce dell'elenco con 2–4 pezzi (il premio si ricalcola dai dati di oggi), scarta
le botteghe che non esistono, taglia a tre banconi; le consegne restano sempre. Una bottega messa nel magazzino non lavora e il suo stato aspetta.
L'evento `bottega` (`{ bottega, cliente, xp, chiede, cresciuta }`) c'è per chi vuole contare; per ora **nessun contatore e nessun traguardo nuovo** (niente da proporre ai bambini).

## Nei test

`unita/fattoria3d-botteghe` (costanti e prezzi uguali alla 2D, clienti per mestiere, premio = banco ×1,25, tetto, fama, attese, stato rotto, salva e rileggi) e
`integrazione/fattoria3d-botteghe` (compra e metti, tocco vero, foglio: `[data-f3="bottega"][data-bottega]`, `[data-f3="bancone"][data-cliente][data-pronto]`,
`[data-f3="bottega-fama"][data-cuori]`, `[data-f3="bottega-consegna"]` con `aria-disabled`, `[data-f3="bottega-rifiuta"]`, `[data-f3="bottega-attesa"][data-minuti]`,
`[data-f3="bottega-msg"]`; 360 px senza scorrimento laterale; il quinto cuore; la mongolfiera a quattro file al livello 66). Il catalogo 3D ha le quattro voci
(`fattoria:bottega-*`, `npm run catalogo3d:scheda -- --gioco fattoria --q bottega`).

## Cosa non c'è

- Niente clienti per mestiere al banco della bacheca (M4): restano i dieci personaggi per tutti ([da-fare.md](da-fare.md)).
- Le botteghe non sono viste su un telefono né giocate con un bambino: i modelli sono guardati dal catalogo 3D, il foglio da Chrome a 360 px e col dito vero via CDP.
