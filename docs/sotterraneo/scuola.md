# Il sotterraneo a scuola

A scuola il bambino gioca al sotterraneo vero (`src/giochi/sotterraneo/Gioco.vue`, attraverso `Entrata.vue`), limitato a
**una discesa breve nella cripta**, e ogni cosa che chiede (una porta, un forziere, una fonte, una curiosità, un colpo nello
scontro) fa una domanda dell'esercizio della lezione. Non si storpia il gioco, si limita: si spegne tutto quello che sta
sopra la discesa. È per le classi **dalla terza in su**: per sei anni il gioco è troppo. Chi lo monta è la pagina dei
bambini (`src/scuola/giochi/sotterraneo/Vista.vue`, [../scuola/giochi.md](../scuola/giochi.md)); cosa la maestra può
scegliere sta in [../scuola/esercizi.md](../scuola/esercizi.md).

## La prop `limite`

- `<Gioco :limite="{ domande }">` (anche su `Entrata.vue`, che la passa): `domande` ha `prossima()` che dà
  `{ domanda, pittori, titolo }` per `Domanda.vue`, cioè il `pescatore(esercizio)` della scuola. Il gioco non importa niente
  della scuola. **A casa manca** (`null`), e senza limite niente di quello che segue esiste.
- I pezzi puri stanno in `src/giochi/sotterraneo/limite.js`: `limiteDi` (senza `prossima` è come nessun limite),
  `domandaDelLimite` (col limite la domanda dopo dell'esercizio, a casa `domandaPerGioco` con la difficoltà della discesa),
  `tappaDelLimite`, `corredoDelLimite`, `mondoDopoIlLimite`, `versoIlVillaggio`.
- **La maestra sceglie** qualunque esercizio del catalogo tranne le prime lettere e le sillabe (`accetta` della scheda),
  anche più voci insieme con le loro intensità.

## La discesa

- **Sempre la cripta** (`CAMPAGNA[0]`, due piani): è l'unica che sta in un blocco di lezione (7–13 minuti). È la discesa
  della storia, senza potenza, scesa per la strada delle prove (`avvia(0, { prova: true })`: la guardia rossa non ferma).
- **L'eroe** si sceglie fra i quattro alla prima discesa (il profilo in memoria lo tiene per tutta la pagina) e poi resta:
  niente «scelgo un altro eroe». La prima volta l'avventura riceve il corredo atteso per la cripta (`robaAttesa`) e la
  crescita di **due livelli sopra** quello atteso (`LIVELLI_IN_PIU`): perdona chi sbaglia. Dopo, come a casa, si tiene
  quello che si è portato su.
- **Finita la discesa**, vinta o persa (svenuti all'ultima occasione), il velo «Discesa finita» dice i mostri e le gemme e ha
  **«Scendi ancora ▶»**: un'altra cripta con lo stesso eroe. Ogni discesa finita conta un `rifatti` in più nel mondo
  dell'avventura (`mondoDopoIlLimite`), quindi la prossima ha un altro seme. Niente stelle, storia, cartello di casa.
- Una discesa lasciata a metà (il blocco che cambia) resta nella sosta: un blocco dopo, nello stesso gioco, si riprende
  giù dietro la pausa, come a casa.

- **La torcia è sempre accesa** (chiesto dall'utente: nella cripta buia i bambini non vedevano niente): `torciaSempreAccesa`
  in `Gioco.vue` la accende alla partenza, e `bruciaLaTorcia` della corsa con `torciaSempre` la riempie invece di consumarla.
  Comprarla e tenerla accesa resta una cosa del gioco di casa.

## La difficoltà

La maestra sceglie Facile, Normale o Difficile ([../scuola/giochi.md](../scuola/giochi.md)); la vista la passa nel limite
(`limite.difficolta`) e muove una leva sola, i livelli dell'eroe sopra quello atteso per la cripta (`livelliInPiuDi` in
`limite.js`): **Facile +4, Normale +2 (com'è), Difficile +0**. Perché: è la leva che c'è già, e +0 è l'eroe che la storia
si aspetta, quindi senza margine per gli sbagli. Senza `limite.difficolta` (e a casa) è Normale.

## Cosa si spegne con `limite`

| Resta (è il gioco) | Si spegne |
|---|---|
| la discesa, lo scontro, le abilità, lo zaino, la pagina dell'eroe, il diario, la barra in basso, i pensieri, le gemme | il mondo di sopra (villaggio, botteghe, tintore, mercanti, scontri sul prato, terre, abisso, missioni da prendere) |
| la pausa (⏸) | il gioco in due, i cheat dell'indirizzo, la bottega di prova |
| | stelle, storia, cartello di fine di casa; le monete non si vedono (la barra della scuola non le ha) |

**Le uscite verso il villaggio sono tutte chiuse**: un'uscita dimenticata lascerebbe il bambino su una pagina vuota.

- **Il portale** e **la scala che sale dal primo piano** aprono un foglio solo, «Porta al villaggio, ma oggi si resta giù»,
  con «resto qui» (`versoIlVillaggio`); `salgoDalPortale` col limite non fa niente. La pergamena del portale non cade
  (viene dopo una missione).
- **«Lascio perdere»** e **«scelgo un altro eroe»** non sono nel velo della pausa, e le funzioni col limite non fanno niente.
- **`indietro`** (la ✕ e «torno ai giochi») riprende il gioco; la barra e la pausa della scuola non li hanno comunque.
- **`allaMappa`**, se mai arriva: fuori da una discesa, col limite, c'è sempre il velo con «Scendi ancora ▶».
- **Il 3D perso** emette `vai`: la vista lo prende come un guasto e si torna alle schede; senza WebGL 2 lo stesso.

## Lo schermo largo

Su uno schermo largo e orizzontale (da 900 pixel: un PC a scuola, ma anche un tablet in orizzontale a casa, scelta
dell'utente) la cripta si allarga fino a 1240 pixel invece di 560: si vede più sotterraneo. Il pannello delle domande resta
largo 560 e centrato. Più tela da dipingere costa di più alla scheda video, ma il pixel ratio lo regge da sé: scende a passi
fino a 0,6 se i fotogrammi pesano e risale piano (`scena3d/contesto.js`). Lo fa `stile.css` con una media query; il
telefono resta in verticale.

## L'evento `risposta`

Ogni risposta di `Domanda.vue` emette `risposta` col `risposto` e la domanda, **prima** che la domanda sparisca:
`{ giusto, indice, chiave, tempo, diFretta, domanda }`. Ogni domanda si chiude con la risposta (sbagliata, la cosa che
chiedeva ne fa un'altra): la vista la racconta con `ultima: true` (`raccontaSotterraneo` in
`src/scuola/giochi/sotterraneo/risposta.js`). A casa nessuno ascolta l'evento.

## A scuola, i sostituti

`src/scuola/giochi/sotterraneo/sostituti.js`: `Campagna.vue` (il mondo di sopra, che porta gli amici), `ScontroSopra.vue`,
`Bottega.vue`, `Tintore.vue` e `SceltaInDue.vue` sono `Vuoto.vue`; `sfida/regia.js` (che porta `src/insieme/`) è
`sotterraneo-regia.js`. Il resto del gioco in due è comune ([../scuola/giochi.md](../scuola/giochi.md)). Le anteprime e
le sagome fatte restano; entra anche `fattoria3d/scena3d/anteprime-pura.js`, che le anteprime prendono in prestito.

Nei test: `unita/sotterraneo-scuola` (senza limite la domanda di casa, col limite tutte dal pescatore, la cripta col seme
che cambia e la sosta che la rifà, il corredo, le uscite su una corsa finta e le guardie nel coordinatore, la scheda, la
risposta raccontata), `unita/scuola-pacchetto`, `unita/scuola-sostituti`. Bersagli: la vista `[data-gioco="sotterraneo"]`, il
velo `[data-fine-limite]` col tasto `[data-azione="scendi-ancora"]`, il foglio chiuso `[data-chiuso-limite]`.
