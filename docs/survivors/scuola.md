# Survivors a scuola

A scuola il bambino gioca a Survivors vero (`src/giochi/survivors/Gioco.vue`), e ogni carta si paga con una domanda
dell'esercizio della lezione: **qualunque esercizio del catalogo**, anche più voci insieme con le loro intensità. È il gioco
che mescola gli argomenti in un formato divertente; non si storpia, si limita. Chi lo monta è la pagina dei bambini
(`src/scuola/giochi/survivors/Vista.vue`, [../scuola/giochi.md](../scuola/giochi.md)); cosa la maestra può scegliere sta in
[../scuola/esercizi.md](../scuola/esercizi.md).

## La prop `limite`

- `<Survivors :limite="{ domande }">`: `domande` è un oggetto con `prossima()` che dà `{ domanda, pittori, titolo }` per
  `Domanda.vue`, cioè il `pescatore(esercizio)` della scuola. Il gioco non importa niente della scuola: il pescatore arriva da
  fuori. **A casa manca** (`null` di difetto), e senza limite niente di quello che segue esiste.
- I pezzi puri stanno in `src/giochi/survivors/limite.js`: `limiteDi` (un limite senza `prossima` è come nessuno),
  `domandaDellaCarta` (col limite la domanda dopo dell'esercizio, a casa `domandaPerGioco` col prezzo della carta) e
  `liberaDelLimite`.
- **La partita è la Sopravvivenza** (la partita libera, senza fine: `LIBERO`), con gli stessi numeri, ma **sul prato**
  invece che di notte: a scuola il terreno è quello disegnato di ripiego (sotto) e al buio gli ostacoli piatti non si
  vedrebbero. Il prato ha anche meno ostacoli della notte.
- Il prezzo della carta non sceglie più la difficoltà della domanda: la decide l'esercizio.

## Cosa resta e cosa si spegne

| Resta (è il gioco) | Si spegne con `limite` |
|---|---|
| cuori, mostri, capi, gemme, livelli, oggetti, bomba | la mappa (si parte giocando: `vista` nasce `campo`) |
| le carte, pagate con la domanda: sbagliata, niente carta | la scelta della domanda col prezzo della carta |
| il brindisi della carta presa, la pausa (⏸) | la sosta (`salva()` non scrive niente) |
| | il cartello finale di casa: record, monete, amici, festa, «alla mappa» |
| | l'uscita: la barra e il velo della pausa della scuola non hanno ← né «torno ai giochi» |

- **Quando ti prendono** il velo dice «Fine partita», quanto si è resistito, i mostri e il livello, e **«Riparti ▶»**, che
  riparte la Sopravvivenza da capo; niente record, segni né festa. Il pescatore continua il suo giro.
- Le monete si contano lo stesso, in un profilo che muore con la pagina, e non si vedono (la barra della scuola non le ha).

## L'evento `risposta`

Ogni risposta alla domanda di una carta emette `risposta` col `risposto` di `Domanda.vue` e la domanda, **prima** che la
domanda sparisca: `{ giusto, indice, chiave, tempo, diFretta, domanda }`. La carta pagata chiude sempre la domanda (sbagliata,
la carta non c'è e l'offerta va avanti, come a casa): la vista la racconta con `ultima: true` (`raccontaSurvivors` in
`src/scuola/giochi/survivors/risposta.js`, con `racconta` di `esercizi.js`). A casa nessuno ascolta l'evento.

## Il peso

Survivors prende in prestito le figure dei fogli del castello e del sotterraneo ([grafica.md](grafica.md)). A scuola:

- **Le figure vere restano**: i mostri dal foglio delle figure del castello (~1,76 MB) e l'eroe, la vespa e il fungo
  dall'atlante del sotterraneo (~0,50 MB). L'eroe è il personaggio che si guida: l'atlante non è secondario.
- **Il terreno è il ripiego disegnato** che il gioco ha già per quando i fogli non sono pronti (`terreno()` e
  `ostacoloPiatto()` in `scena/campo.js`): il sostituto `src/scuola/sostituti/survivors-vestiti.js` ha gli stessi nomi dei
  vestiti del castello senza immagini (~2,1 MB in meno); l'immagine vuota non si carica e il campo resta disegnato.
- `viste/Mappa.vue` (che porta gli amici) e `viste/Finale.vue` (che porta la festa) a scuola sono `Vuoto.vue`.

Dal grafo degli import la pagina dei bambini passa da ~1,7 a ~4,1 MB di sorgente; il grosso sono le due immagini in base64,
che il pacchetto non riduce.

Nei test: `unita/survivors-scuola` (senza limite la carta chiede la domanda di casa col suo prezzo; con la tabellina del 9
tutte dal pescatore; un insieme quattro a uno; ogni voce del catalogo; la partita sul prato; la risposta raccontata),
`unita/scuola-pacchetto`, `unita/scuola-sostituti`. Bersagli: la vista `[data-gioco="survivors"]`, il velo di fine
`[data-fine-limite]` col tasto `[data-azione="riparti"]`; il resto è di [regole.md](regole.md).
