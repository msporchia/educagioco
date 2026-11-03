# Adottare un animale

Dal 3/11/2026 **nessun animale è un regalo del livello**: Watson, i gatti di casa e le razze si adottano dal menu 🏗 «Costruisci», scheda **Animali**,
con monete vere. Il bambino sceglie la razza (la carta) e poi il nome (il battesimo, [bestie-di-casa.md](bestie-di-casa.md)). Una bestia sola per carta: l'id è la
razza, quindi due cani uguali non ci sono, ma un labrador, un collie e un beagle sì.

## Il catalogo

Tutto quello che si adotta sta in `dati/bestie.js` (`adottabili()`): `BESTIE` (le razze, che stanno a casa dove le metti) e `CURATI` (i compagni, che girano per la fattoria).

| carta | 🪙 | livello | corpo |
|---|--:|--:|---|
| Watson (bobtail) | 90 | 3 | `creaCane` — i numeri sono quelli del bobtail della 2D |
| Sherlock (gatto bianco e nero) | 75 | 10 | mantello `bianconero` — gatto bianco e nero della 2D |
| Irene (calico) | 75 | 11 | mantello `calico` |
| Golia (gatto nero) | 75 | 14 | mantello `golia`: nero uniforme, occhi verde-oro |
| Pepe (gatto nero col ciuffo) | 75 | 19 | mantello `nero` — il gatto nero della 2D |
| coniglio / beagle / gatto rosso / pappagallo | 85 / 90 / 75 / 120 | 12 / 15 / 35 / 49 | come prima, numeri della 2D |
| gatto grigio | 75 | 18 | mantello `grigio` (grigio-azzurro, occhi verdi) |
| labrador | 95 | 22 | `creaBeagle('labrador')`: miele, muso lungo, coda piena e bassa |
| gatto tigrato | 75 | 24 | mantello `tigrato` (bruno con la «M» sulla fronte) |
| border collie | 100 | 28 | `creaBeagle('collie')`: nero, collare, muso e zampe bianchi |
| gatto bianco | 80 | 30 | mantello `bianco` (occhi azzurri) |
| dalmata | 100 | 32 | `creaBeagle('dalmata')`: bianco a macchie nere |

Le razze nuove non hanno un equivalente 2D: prezzo e livello sono nostri, nella fascia «un animale» di [calibrazione.md](../apprendimento/calibrazione.md) (75–120 🪙, un quarto d'ora di esercizio),
il premio è un quindicesimo del prezzo come per gli altri (`PREMIO_RAZZA`). `guastiDelleBestie` lo controlla. Una razza si aggiunge con una voce di `BESTIE` (`razza(...)`), un mantello in
`MANTELLI` + `coloriGatto` (`scena3d/modelli-compagni.js`) o una voce di `RAZZE_CANE` (`scena3d/modelli-bestie.js`), e la foto (`npm run anteprime fattoria`).

I cani nuovi hanno **lo scheletro del beagle** (stessi perni di Watson, `posaBeagle`): cambiano i colori, le orecchie, il muso, la coda e la scala. I gatti sono mantelli di `creaGatto`, come Sherlock.
Per le bambine che ci tengono gli animali sono un po' più ricchi di poligoni (il doppio e mezzo dei lati dei cani, il pelo dei gatti con sfere da 28×18 sulla testa).
Le figure sono sempre il modello e la sua foto (`bestia:<id>` in `dati/anteprime.js`), mai un'emoji di ripiego; l'emoji resta solo nelle liste di testo (il foglio dei livelli).

## Chi l'aveva già

`stato.adozioni: 1` dice che lo stato è del nuovo corso. Uno stato **senza** il campo è di quando Watson e i gatti arrivavano da soli (livelli 1, 2, 3 e 19):
`normalizza` scrive in `casa` quelli che il suo livello avrebbe già dato e poi mette il segno, quindi **chi aveva Watson, Sherlock, Irene e Pepe li tiene** e i livelli successivi
non regalano più niente. Golia non c'era: si adotta. Chi viene dalla 2D ha i suoi (`COMPAGNO_DI`) e nient'altro: la conversione parte da uno stato nuovo, già col segno.
`test/aiuto/adozioni.mjs` (`adottaCompagni`) è l'aiuto dei test che vogliono i compagni in casa.

## Nei test

`unita/fattoria3d-razze` (catalogo, ogni razza si costruisce, piedi a terra, ingombro, triangoli, mantelli tutti diversi), `unita/fattoria3d-bestie` (adozione dei compagni, lo stato di prima),
`unita/fattoria3d-compagni` (nessun arrivo da solo). Bersagli del menu: `[data-carta="bestia:<id>"]` (anche `bestia:watson`).
