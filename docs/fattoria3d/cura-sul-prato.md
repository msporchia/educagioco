# La cura sul prato

Dal 4/11/2026 gli animali si curano **sul prato, non da un foglio**: la ciotola, la tinozza, un tocco per giocare. Il foglio che si apre da «🐾 Come sta», fra le opzioni che il tocco porta accanto all'animale ([gesti.md](gesti.md)), dice come stanno e serve per nome e vestiti.
Codice: `motore/cura.js` (le regole), `dati/bestie.js` (soglie, `ciboChiesto`), `dati/compagni.js` (le sequenze pure), `scena3d/compagni.js` (il comportamento), `scena3d/modelli-cura.js`
(ciotola e tinozza), `scena3d/bagno.js`, `scena3d/sporco.js`, `scena3d/attrezzi.js`, `viste/Attrezzi.vue`.

## La ciotola

Ogni animale **nasce con la sua ciotola**, compresa nel prezzo: del suo colore (`tintaDi`), col nome su un cartellino che cambia col nome. È un pezzo vero, `ciotola_bestia`, con `bestia: <id>`: si sposta col solito
«tieni premuto», **gratis e dove vuoi**, non si compra e non si mette via (`dono` nel catalogo; `ciotola` è una decorazione della 2D, un'altra cosa). Nasce vicino al posto dell'animale, o davanti a casa
(`Cura.sistema`, che la rifà a chi non ce l'ha all'apertura: chi aveva già gli animali la trova). Una ciotola senza padrone, o la seconda, `normalizza` la butta.

**Come i campi** ([campi.md](campi.md)): un tocco porta accanto i cibi ad arco, senza aspettare il contadino. **Un gettone si trascina nella ciotola, o si tocca** (chi ha quattro anni trascina male). Riempita, il cibo si vede, l'animale corre, si accosta con un saltello e mangia.

**Senza fame non si mangia**: sopra `FAME` la ciotola non si apre e il cartello dice «Birba non ha fame: quando ne avrà, ti chiamerà dalla sua ciotola»; il motore rifiuta anche la torta (`non-ha-fame`). Lo stesso se tocchi la tinozza e sono tutti puliti, o se porti uno nella tinozza senza 🪙1 («Ti manca 🪙1: gli esercizi negli altri giochi te le danno»): vedi [regole.md](regole.md#come-si-dice-di-no).

## Cosa chiede, e la scappatoia

Sotto `FAME` (0,5) la ciotola espone in un fumetto **quello che vorrebbe**: un cibo delle scorte, prima fra quelli che hai, e cambia a ogni pasto (`ciboChiesto`, `pasti` nel record). **Accanto ci sono sempre i due cibi a monete**
della sua famiglia (osso e bistecca, pesce e paté, semini e frutta, carota e insalata: 🪙5 e 🪙14): chi non ha quello che serve non deve restare a guardare un animale che chiede. La torta, se ce l'hai, va nella ciotola: fa festa e riempie anche la pancia.

## La fame insiste

Chi ha fame va alla ciotola e la guarda; **uno alla volta viene a chiamarti** e ci torna (`sequenzaFame`, `prossimaChiamata`: quindici insieme sarebbero un assedio). Insiste finché non mangia. **Con zero monete e niente scorte smette**
(`Cura.insiste`) e aspetta tranquillo: non è una colpa. Non sta mai male, il fondo di [bestie-di-casa.md](bestie-di-casa.md) resta.

## Il prezzo che sale

Come il terreno: **ogni animale che hai fa costare il prossimo 🪙20 di più** (`prezzoAdozione`, `Cura.prezzoDi`). La razza tiene il suo prezzo di base e il premio resta su quello. Il quindicesimo costa intorno a 🪙380, un'ora di esercizio.

## Lo sporco e la tinozza

Il pelo cala col tempo e si vede sul corpo sotto `SPORCO` (0,8): macchie di fango, **prima le zampe, poi la pancia, poi il dorso** (`scena3d/sporco.js`: una soglia per vertice, fissata dal corpo fermo, e un numero per animale). Rotolarsi e scavare sporcano un po' di più.
**Il fango segue il colore sotto**: sul pelo chiaro è bruno scuro, su quello scuro è una polvere bruna più chiara (`FANGO_CHIARO`/`FANGO_SCURO` in `sporco.js`, scelti nel vertice dalla luminosità). Così Sherlock, Golia e Pepe si vedono sporchi; la soglia sale con l'altezza (1,2) perché la testa e il dorso restino a macchie anche al massimo e il bianco di Sherlock si riconosca.

La **tinozza** (`tinozza`, un `dono` come la ciotola, una sola) arriva col primo animale. Un tocco: chi è sporco compare in **vignetta** sopra la tinozza, dal più sporco; si trascina dentro (o si tocca). Il modo è uno solo, 🪙1: sapone e copertina facevano lo stesso bagno e cambiavano solo cosa si pagava. L'animale salta dentro, la camera si avvicina e **si strofina col dito**. **Da lontano bara**: la camera è già sulla tinozza, quindi salta il grosso della strada in una nuvola e corre solo l'ultimo tratto, così col salto ci mette al massimo 2 secondi (`_scorcia`, `CORSA_AL_BAGNO`):
lo sporco se ne va sotto gli occhi (`scena3d/bagno.js`, `STROFINATA`). Si paga alla fine e lascia pulito del tutto; lasciato a metà con la ✕ non si paga niente.

## I recinti

Pollaio, stalla, recinto e gli altri: chi ha fame **chiede**. Il contadino ci va e sopra compare **la nuvoletta col mangime** e quanto ne hai (`Fattoria3d.mangimeDi`); si trascina dentro, o si tocca, e lui lo dà. Prima bastava un tocco e non si sapeva cosa si stava dando («lo so che è un click in più»: scelta dell'utente).
Senza mangime la nuvoletta c'è lo stesso, col gettone spento, e la riga dice cosa manca. Raccogliere e tosare restano un tocco.

## Il gioco

**Un tocco sull'animale è giocare**: gratis, sempre (`Cura.gioca`). Riempie e può dare il premio **solo se non è già felice** (sotto `FELICE`, 0,55): da felice ci giochi quanto vuoi e non ne viene niente, così non diventa un tasto da premere a raffica.
Il tocco fa le sue scenette anche ai cani e ai gatti di razza, e accanto compaiono le opzioni: la pappa se ha fame, il bagno se è sporco, i vestiti, come sta.

## Chi si annoia

Sotto `NOIA` (0,35), uno alla volta (`prossimaNoia`) e mai quando ha fame: il cane **ti porta la pallina** ai piedi e il gatto spinge il gomitolo, e aspetta (toccarlo è giocare); oppure **corre in tondo**, o **scava** una buca che si richiude (`scegliNoia`, `sequenzaNoia`).
Il coniglio e il pappagallo non portano niente. Niente che rovini la fattoria: sono pazzie, non punizioni.

## Provato e no

- **Il cane che ruba il cappello**: il contadino è fuso in pochi mesh (`fondi.js`), il cappello non si stacca. Servirebbe un cappello a parte: per ora si rincorre la coda e scava.
- **Il fango scuro su un gatto nero**: lo scuriva e basta, non si vedeva (un nero più nero non è un cambiamento). Un fango chiaro uguale per tutti (0,34, 0,22, 0,10) faceva sembrare Golia un gatto rosso: il bruno dev'essere smorzato (0,2, 0,135, 0,08) e a macchie.
- **Lo sporco a tinta unita**: sembrava un altro mantello. Va a macchie (rumore a due scale) e scuro: i colori nei vertici sono lineari, un fango «giusto» a occhio viene chiaro.

## Nei test

`unita/fattoria3d-cura-prato` (ciotole e tinozza, salvataggi di prima, prezzo, fame, scappatoia, gioco, lavare, sporco, sequenze e scena), `unita/fattoria3d-attrezzi` (i rifiuti detti in cima alla scena), `integrazione/fattoria3d-bestie` (un tocco vero sulla ciotola e sulla tinozza, il cibo, la strofinata). Bersagli:
`[data-f3="attrezzi"][data-tipo="ciotola|tinozza|recinto"]`, `[data-f3="attrezzi-riga"]`, `[data-f3="gettone-conto"]`, `[data-cibo="<id>"]`, `[data-vuole]`, `.f3-badge.fame[data-ciotola="<id>"]`, `[data-sporca="<id>"]`, `[data-f3="bagno"]`, `[data-f3="cartello"]` (il cartello: i «no» e le notizie).
Per guardare: `#animali=watson,beagle&bisogni=fame,sporco,noia` ([comandi](../core/comandi.md)), `npm run catalogo3d:scheda -- --gioco fattoria --q labrador --sporco 0.7` (anche `--q "=fattoria:sherlock|=fattoria:golia|=fattoria:pepe"`: i tre scuri).
