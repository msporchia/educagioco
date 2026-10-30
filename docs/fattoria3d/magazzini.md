# I magazzini: edifici che crescono

**Decisione dell'utente del 30/10/2026**: la capienza non si compra più da tre bottoni in fondo all'inventario («buttata lì, sembra solo
matematica»). Ogni silo è un **edificio in mappa**: si tocca, si guarda dentro, e il foglio spiega in parole cosa cambia ingrandendolo.
Ogni ingrandimento lo fa **crescere davvero**; quando è grande al massimo se ne compra un altro da mettere, così non diventa gigante.
Codice: `dati/silos.js`, il motore (`edificiDelSilo`, `tagliaDi`, `passoDelSilo`, `costruisciMagazzino`, `_assicuraMagazzini`),
`scena3d/modelli-magazzini.js`, `viste/Magazzino.vue` e `viste/magazzino-puro.js`.

## I tre edifici

| silo | edificio (id della 2D) | tiene | arriva |
|---|---|---|---|
| `terra` | 🌾 Silo del raccolto (`silo`, rosso, 2×2) | i raccolti | da subito, messo da solo accanto a casa |
| `stalla` | 🥛 Silo della stalla (`silo_bianco`, bianco col cono blu, 2×2) | uova, latte, lana, mangimi, pesce… | al livello 4, da mettere |
| `bottega` | 📦 Dispensa (`dispensa`, casetta 3×2 con gli scaffali) | i prodotti delle botteghe | al livello 16, da mettere |

- **La capienza la dicono gli ingrandimenti** (`s.silo`, come prima: 8 pezzi per scomparto, +2 a passo, prezzo `40 + 130·ln(1+n)` della 2D);
  gli edifici la fanno vedere. Nessun salvataggio perde posto, e un edificio non ancora messo non toglie niente.
- **Il primo silo del raccolto si mette da solo** nel primo posto libero accanto alla casa (`_mettiIlPrimoSilo`, a spirale, uguale su ogni
  telefono). **Gli altri vanno nel magazzino dei pezzi**: il menu Costruisci ha la loro carta («📦 ×1») col «!», e il bambino li mette dove
  vuole. Provato a metterli tutti da soli: finivano in mezzo alla fattoria, accanto all'incrocio, e cambiavano strade e posti liberi.
- Un magazzino **non si compra dal menu** (la carta c'è solo se ce n'è uno da mettere) e **non si mette via** (`magazzino`): si sposta.
- Una fattoria di prima con più ingrandimenti di quanti ne regge un edificio ritrova il primo in mappa e gli altri da mettere.
- **«Un po' di tutto» non conta i magazzini**: arrivano da soli, sarebbe un traguardo regalato.

## Crescere, e il secondo

Un edificio regge **6 ingrandimenti** (`PASSI_PER_EDIFICIO`) e se ne hanno **al massimo 3 per silo** (`EDIFICI_PER_SILO`): 18 passi,
44 pezzi per scomparto. La 2D dice che 28 posti costano già sette ore di esercizi: oltre non serve.

- La **taglia** di un edificio (0–6) viene dai passi, in ordine di nascita: il primo cresce per primo, il secondo nasce col suo primo passo
  (`tagliaDelEdificio`). Il modello sta in un `corpo` che si scala: largo dal 72% al 100% dell'impronta, alto dal 55% al 125%
  (`scalaDelCorpo`); non esce mai dalle sue celle.
- Quando tutti gli edifici di un silo sono al massimo, ingrandire non si può (`silo-al-massimo`): il foglio propone **«Costruisci un altro»**
  al prezzo del passo dopo. Comprarlo **è** quel passo (+2 a ogni scomparto); il nuovo va nel magazzino dei pezzi e si mette subito come
  dal menu, davanti al contadino o col fantasma da trascinare.

## Il foglio

Si apre toccando l'edificio (il contadino ci va) o dalle scorciatoie in fondo all'inventario. Sopra quello che tiene, ogni merce col suo
`n/max`; sotto il riquadro del posto in più, in parole: «⬆️ Ingrandisci il silo del raccolto — Ogni raccolto avrà più posto: da 12 a 14
per tipo. E il silo del raccolto diventa più grande!», una fila di tacche per quanto è cresciuto ogni edificio, e il tasto col prezzo.
Al massimo: «Costruisci un altro silo del raccolto accanto: ogni raccolto avrà posto per 2 in più, da 20 a 22». Senza monete il tasto è
grigio e dice quante ne mancano. Lo scomparto pieno (il rifiuto e il consiglio) manda a questo foglio, non all'inventario.

## Nei test

`unita/fattoria3d-magazzini` (dati, l'arrivo, crescere, il secondo, il tetto, un salvataggio di prima, il menu, le visite, la fattoria
in comune), `integrazione/fattoria3d` (la scorciatoia dell'inventario, il foglio, l'ingrandimento, il silo che cresce, toccarlo nella
fattoria). Le prove del motore partono senza magazzini (`magazzini: false`), così le coordinate dei pezzi restano quelle scritte; anche la
fattoria di un vicino non ne ha.

| bersaglio | cosa |
|---|---|
| `[data-f3="magazzino"][data-silo][data-passo]` | il foglio di un magazzino; `data-passo` è `ingrandisci`, `nuovo` o `basta` |
| `[data-f3="magazzino-piu"]`, `[data-f3="magazzino-ingrandisci"]`, `[data-f3="magazzino-msg"]` | il riquadro del posto in più, il suo tasto, l'esito |
| `[data-f3="magazzini"] [data-magazzino="<silo>"]` | le scorciatoie in fondo all'inventario |
