# Adottare un animale

Dal 3/11/2026 **nessun animale è un regalo del livello**: Watson, i gatti di casa e le razze si adottano dal menu 🏗 «Costruisci», scheda **Animali**,
con monete vere. Il bambino sceglie la razza (la carta) e poi il nome (il battesimo, [bestie-di-casa.md](bestie-di-casa.md)): in vendita un animale **non ha un nome**. Una bestia sola per carta: l'id è la
razza, quindi due cani uguali non ci sono, ma un labrador, un collie e un beagle sì.

## Il catalogo

Tutto quello che si adotta sta in `dati/bestie.js` (`adottabili()`): `BESTIE` (le razze, che stanno a casa dove le metti) e `CURATI` (i compagni, che girano per la fattoria).

| carta | 🪙 | livello | corpo |
|---|--:|--:|---|
| Bobtail (`watson`) | 90 | 3 | `creaCane` — i numeri sono quelli del bobtail della 2D |
| Gatto bianconero (`sherlock`) | 75 | 10 | mantello `bianconero` — gatto bianco e nero della 2D |
| Gatto calico (`irene`) | 75 | 11 | mantello `calico` |
| Gatto nero (`golia`) | 75 | 14 | mantello `golia`: nero uniforme, occhi verde-oro |
| Gatto nero col ciuffo (`pepe`) | 75 | 19 | mantello `nero` — il gatto nero della 2D, col ciuffo bianco sul petto e gli occhi gialli |
| coniglio / beagle / gatto rosso / pappagallo | 85 / 90 / 75 / 120 | 12 / 15 / 35 / 49 | come prima, numeri della 2D |
| gatto grigio | 75 | 18 | mantello `grigio` (grigio-azzurro, occhi verdi) |
| labrador | 95 | 22 | `creaCaneDiRazza('labrador')`: miele, testa larga, orecchie piegate, coda «a lontra» |
| gatto tigrato | 75 | 24 | mantello `tigrato` (bruno con la «M» sulla fronte) |
| border collie | 100 | 28 | `creaCaneDiRazza('collie')`: nero col collare bianco attorno al collo, la fiamma, le orecchie mezze dritte, la gorgiera e la coda a pennacchio |
| gatto bianco | 80 | 30 | mantello `bianco` (occhi azzurri) |
| dalmata | 100 | 32 | `creaCaneDiRazza('dalmata')`: bianco a macchie nere, orecchie nere, più alto di zampe |

Le razze nuove non hanno un equivalente 2D: prezzo e livello sono nostri, nella fascia «un animale» di [calibrazione.md](../apprendimento/calibrazione.md) (75–120 🪙, un quarto d'ora di esercizio),
il premio è un quindicesimo del prezzo come per gli altri (`PREMIO_RAZZA`). `guastiDelleBestie` lo controlla. Una razza si aggiunge con una voce di `BESTIE` (`razza(...)`), un mantello in
`MANTELLI` + `coloriGatto` (`scena3d/modelli-compagni.js`) o una voce di `RAZZE_CANE` (`scena3d/modelli-cani.js`), e la foto (`npm run anteprime fattoria`).

I cani di razza hanno **lo scheletro del beagle** (stessi perni di Watson, `posaBeagle`) e sono modellati nella creta ([creta.md](creta.md)): cambiano la
carne (petto, testa, muso, orecchie, coda, pelo lungo), il mantello, l'altezza delle zampe e la taglia ([taglie.md](taglie.md)). I gatti sono mantelli di `creaGatto`, come Sherlock.
Le bambine ci tengono moltissimo agli animali: per questo sono fatti con cura e con più triangoli, e da lontano (in gioco) con la versione leggera.
Le figure sono sempre il modello e la sua foto (`bestia:<id>` in `dati/anteprime.js`), mai un'emoji di ripiego; l'emoji resta solo nelle liste di testo (il foglio dei livelli).

**La razza e il nome.** `razza` è come si chiama finché è in vendita: la carta, il lucchetto, il foglio dei livelli e l'avviso di quando arriva. Si sceglie perché un bambino la capisca guardando l'animale, e sta su due righe della carta (a 390 px una riga tiene dodici lettere).
`nome` è quello che porta se il bambino non gliene sceglie uno: per le razze è la razza stessa, per i cinque compagni il loro (Golia), che sta in testa ai nomi da toccare (`nomiPer`). La carta di un animale tuo dice come si chiama (`nomeBestia`). Lo stato non cambia: chi l'aveva già tiene il nome che ha, e senza un nome scelto si chiama come prima.

**Il prezzo sale** come quello del terreno: ogni animale che hai fa costare il prossimo 🪙20 di più (`prezzoAdozione`); la tabella dice il prezzo di base, la carta quello di adesso. Con l'animale arriva la sua ciotola, col primo la tinozza: [cura-sul-prato.md](cura-sul-prato.md).

## Chi l'aveva già

`stato.adozioni: 1` dice che lo stato è del nuovo corso. Uno stato **senza** il campo è di quando Watson e i gatti arrivavano da soli (livelli 1, 2, 3 e 19):
`normalizza` scrive in `casa` quelli che il suo livello avrebbe già dato e poi mette il segno, quindi **chi aveva Watson, Sherlock, Irene e Pepe li tiene** e i livelli successivi
non regalano più niente. Golia non c'era: si adotta. Chi viene dalla 2D ha i suoi (`COMPAGNO_DI`) e nient'altro: la conversione parte da uno stato nuovo, già col segno.
`test/aiuto/adozioni.mjs` (`adottaCompagni`) è l'aiuto dei test che vogliono i compagni in casa.

## Nei test

`unita/fattoria3d-razze` (catalogo, due carte mai con la stessa razza, ogni razza si costruisce, piedi a terra, ingombro, triangoli, mantelli tutti diversi), `unita/fattoria3d-bestie` (adozione dei compagni, lo stato di prima, razza sulla carta e nome fra quelli da toccare), `integrazione/fattoria3d-bestie` (la carta di Golia in vendita e da tuo),
`unita/fattoria3d-compagni` (nessun arrivo da solo). Bersagli del menu: `[data-carta="bestia:<id>"]` (anche `bestia:watson`).
