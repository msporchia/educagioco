# Gli edifici sono pezzi liberi

Mulino, panificio, pastificio (id `pasticceria`), cucina (id `conserviera`), gelateria, caseificio, telaio, zuccherificio, sartoria,
tintoria e la mongolfiera **non hanno più un posto fisso**: si costruiscono dal menu «Costruisci qui» (scheda 🏠 Edifici) e si
mettono dove il bambino vuole nel suo terreno, come un campo o una fontana. Il bambino li dispone come gli pare; il gioco gli
ricorda solo, con un «!», quelli che il livello ha aperto e che non ha ancora costruito. Casa e fienile (`FISSI` in `dati/mondo.js`) restano fissi di scena.
Il perché: un posto obbligato costringeva a comprare un lotto lontano e a vedere dieci fantasmi sul prato, e toglieva al bambino la
parte più divertente, disporre la fattoria.

## Come funziona

- **Una cosa come le altre.** Un edificio in mappa sta in `stato.cose` come `{ id, tipo: 'mulino', i, j }`: occupa le sue celle
  (`cellaCosa`), si disegna con `scena3d/pezzi.js` (i modelli passano dalla cache: [scena.md](scena.md)), si sposta e si mette via
  con il codice dei pezzi. **Uno per tipo**; l'ingombro è `w×d` di `EDIFICI` (`dati/catalogo.js`, che non ha più `slot`).
- **Le stesse regole di `puoMettere`:** terreno proprio, celle non occupate, niente acqua (solo ponti e passerelle ci stanno
  sopra). Casa, fienile, alberi, sassi e gli altri pezzi sono ostacoli; i vecchi posti sono liberi per tutti.
- **Si paga al rilascio** (`compraEMetti`, nessuna conferma): senza monete il fantasma di trascinamento è rosso e il rifiuto dice
  «Servono 🪙 N»; chiuso dal livello, la carta del menu è grigia col lucchetto e dice il livello (il fantasma di un edificio
  non esiste più: non c'è niente sul prato finché non lo si costruisce). Il prezzo è quello di `EDIFICI`: i prezzi e i livelli non sono cambiati.
- **La carta sparisce quando l'edificio c'è** (`posseduti[tipo]`); se è nel magazzino la carta dice «📦 ×1» e si rimette gratis.
- **Si sposta con la pressione lunga** (🪙 1, come ogni pezzo), **sempre**: la macchina che lavora si sposta senza perdere niente, perché
  la coda, i pronti e la stiva stanno nello stato *per tipo* (`macchine[tipo]`, `mongolfiera`), non per posizione.
- **Si mette via** (magazzino, 🪙 1) solo se **non lavora**: `edificioAlLavoro` è vero con qualcosa in coda o da ritirare, o con la
  mongolfiera in volo o già caricata. Il rifiuto è `macchina-al-lavoro` («Finisci prima il lavoro: poi la metti via»).
- **`posseduti[tipo]` vuol dire «è in mappa»** e `normalizza` lo rifà dalle cose: un edificio nel magazzino (al massimo uno,
  `magazzino[tipo]`) non è posseduto, quindi la macchina non lavora e il «!» resta acceso. `compraEdificio(tipo, i?, j?)` è `compraEMetti`
  con un posto trovato (`postoPer`) se non lo si dice: serve ai test e ai comandi, il bambino sceglie il posto.
- **Si tocca dal davanti** (verso +z), o da un altro lato se il davanti è murato (`celleDiServizio`); apre la finestra della sua macchina.

## Lo stato e la migrazione

`VERSIONE_STATO` 9. Un salvataggio v8 con un edificio comprato lo **ritrova dov'era il suo posto fisso**: `POSTI_STORICI` in `dati/mondo.js`
(le coordinate di prima, immutabili) dà la posizione e `normalizza` aggiunge la cosa; coda, pronti e stiva non si toccano. Mai
eccezioni: due edifici dello stesso tipo diventano uno, un tipo sconosciuto si butta, un edificio nel magazzino è uno solo.
`POSTI_STORICI` serve a tre cose e a nient'altro: questa lettura, **gli alberi e i sassi dei 42 lotti storici** (`celleRiservate`,
`alberiStorici`: i numeri sono chiavi di salvataggio, quindi quei lotti restano com'erano e gli alberi tagliati non si rigenerano) e il
posto di partenza di uno snapshot senza posizioni. Nei lotti nuovi niente è mai stato riservato.

## I vicini

Gli snapshot (`dati/vicini.js`) portano `edifici: [{ tipo, i, j }]`: il vicino li ha dove li ha messi. Un nome solo (`'mulino'`: i
quattro villaggi del computer, gli snapshot di prima) sta al suo posto di una volta; una posizione impossibile vale lo stesso.
`motoreDiVisita` li mette fra le cose; `esportaLaMiaFattoria` li legge dalle cose. `VERSIONE_VISITA` non cambia (si legge tutto).

## Il «!»: l'edificio che manca

`edificiDaCostruire(livello, posseduti)` (`dati/catalogo.js`, e `motore.edificiDaCostruire()`): gli `EDIFICI` con `liv` ≤ livello e non in mappa,
nell'ordine di livello. **Solo edifici**: macchine e mongolfiera (le decorazioni, anche della scheda Edifici come bancarella, bacheca e
trattore, non lo accendono mai). Si vede, senza parole, come un pallino rosso con «!» che pulsa piano (`.f3-esclama`, `prefers-reduced-motion` lo ferma):

| dove | cosa |
|---|---|
| tasto 🏗️ Costruisci | se c'è almeno un edificio da costruire (`BarraAzioni`, `foto.daCostruire`) |
| linguetta Edifici | se una carta della scheda ha `segnala` (`schedeSegnalate`) |
| la carta dell'edificio | `segnala`: aperta dal livello e non costruita; le carte col «!» stanno **in cima** alla scheda |
| un biglietto del banco | `ordini()[i].senzaMacchina`: l'ordine chiede un prodotto di una macchina che non hai; il dettaglio dice «Serve il Panificio» col «!» |

E **un avviso al salire di livello** che nomina l'edificio: «Livello 7: il Panificio! Costruiscilo» (`avvisoEdificiNuovi`, con l'`art` di ogni
edificio; se se ne aprono due «lo Zuccherificio e …! Costruiscili»). Niente cartelli sul prato: un fumetto «Da costruire» in scena sarebbe rumore.

## Nei test

`unita/fattoria3d` (sezioni 15, 15-bis, 17-bis: acquisto e posa libera, ingombro e rifiuti, uno per tipo, spostamento che conserva coda e
pronti, migrazione v8→v9, `edificiDaCostruire`, l'avviso, `senzaMacchina`), `unita/fattoria3d-edifici` (la scena: nessun fantasma, il gruppo
segue la cosa, il servizio dal davanti), `unita/fattoria3d-vicini` (le posizioni libere negli snapshot). Nel browser: `[data-f3="costruisci-esclama"]`
(sul tasto), `[data-f3="scheda-esclama"]`, `[data-f3="carta-esclama"]`, `[data-f3="ordine-esclama"]` e `[data-f3="ordine-serve"]` (nel banco).
