# I vicini: visitare le altre fattorie e aiutare

Col **trattore** (un pezzo della fattoria) si va nei villaggi dei vicini: si cammina nella loro fattoria, si riempie la loro
**cassa**, si **compra** e si **vende** al loro mercato. I vicini oggi li gestisce il computer e li vede solo chi gioca; il
codice è fatto perché un giorno uno snapshot della fattoria di un amico entri allo stesso modo. Codice: `dati/vicini.js`,
`motore/vicini.js`, `scena3d/visita.js`, `visite.js`, `viste/Mappa.vue`, `viste/Visita.vue`.

## Il principio: una fattoria visitabile è un dato

**Una fattoria visitabile è un dato serializzabile e versionato (uno *snapshot*), e la visita lavora solo su quel dato, mai sul
mondo vivo di chi gioca.** Il perché: per visitare l'amico domani basta cambiare chi *fornisce* lo snapshot, e nessuna visita può
rompere (né leggere per sbaglio) la fattoria di chi la fa. Lo stesso taglio di Castle Battle in due ([../arena/multigiocatore.md](../arena/multigiocatore.md)):
stato piccolo, versionato, separato dalla vista (`sfida/foto.js` è una fotografia in righe di numeri sotto un tetto di byte).

```
{ v: 1, id, nome, proprietario: { nome, emoji }, tema, liv, storia: [riga, riga],
  lotti: [id], edifici: [tipo], cose: [{ tipo, i, j, coltura?, cresc?, pecore?, bestie? }], strade: [cella],
  posti: { cassa: {i,j}, mercato: {i,j} },
  mercato: { vende: [{ k, n, prezzo }], compra: [{ k, n, premio, da: { k, n } | null }], rinnovoMs },
  cassa: { chiede: [{ k, n }], dono: { k, n } | null, rinnovoMs } }
```

- `k` è la chiave di una merce: un raccolto (`COLTURE`), un prodotto di una macchina (`RICETTE`), uova o latte. Gli id dei
  contenuti non si rinominano ([../core/archivio.md](../core/archivio.md)): sono anche le chiavi dello snapshot.
- `cresc` (0–1) è l'età di un campo: la scena lo rimette a `ora − cresc·ms`, e l'orologio di una visita sta fermo, quindi il
  grano resta com'è. Le bestie lavorano (niente fame, niente uova da raccogliere): non sono tue.
- **Piccolo**: un villaggio pesa 2–3 KB, la fattoria esportata di un bambino con molte cose meno di 6 KB (due test lo tengono).
- `normalizzaFattoriaVisitabile` **non lancia mai** e torna `null` se non è una fattoria visitabile (non un oggetto, id non
  valido, versione più nuova di quella che il gioco sa leggere).

### Un dato altrui non si fida

Domani lo snapshot arriva da un altro bambino, quindi la normalizzazione tratta tutto come ostile: scarta cose, merci, edifici e
lotti che non esistono; taglia i testi (24 e 16 caratteri, 120 per riga di storia) e toglie `<` `>`; accetta come faccia solo
quelle in `FACCE` (devono stare nel font delle emoji del gioco, [../core/emoji.md](../core/emoji.md)); tiene i numeri sotto tetto
(9 per voce, 4 pecore, 3 cose alla cassa). Soprattutto **ricalcola ciò che regala**: un baratto non paga più di `premioMassimo`,
un dono non vale più di `donoMassimo`, un prezzo non scende sotto l'80% del valore. Così uno snapshot truccato non è una
scorciatoia per salire di livello. La storia (due righe) la scrivono i villaggi del computer; il testo libero di un amico non
è mai un dato da fidarsi (come in Castle Battle: «niente nomi né testo libero nei messaggi»).

## Il trattore

Un pezzo del catalogo (`trattore`, 2×2, 🪙 40, livello 7) come la panchina o la fontana: né produttivo né unico, si trascina dalla
barra come gli altri. **Toccarlo apre la mappa** (`viste/Mappa.vue`): una strada con i villaggi in fila, quelli che non hai il
livello grigi e col «🔒 Arriva al livello N». Il livello 7 è quello del panificio: nessuna cosa produttiva in più, e il primo
villaggio (livello 7) si apre subito. Scelto un villaggio il trattore attraversa lo schermo e la scena passa alla visita.

## I quattro villaggi

| villaggio | livello | cosa si vede | cassa chiede → dono | mercato (carattere dei prezzi) |
|---|--:|---|---|---|
| 👵 L'orto di Nonna Rita | 7 | campi, il pollaio con le galline, aiuole | grano, carote, mais → 🥚 | uova, zucche, cipolle (generosa: 80%) |
| 👨‍🍳 Il mulino di Tonio | 9 | il mulino che gira, otto campi di grano | grano, mais, farina → pappa di mais | farina, pappa di mais e pane (giusto: 100%) |
| 👴 Le pecore di Zio Beppe | 11 | tre recinti, la mongolfiera, il telaio | zucche, pane, patate → pasta | torta, pasta, latte, stoffa (caro: 120%) |
| 🌻 Villa Dolce | 13 | sei campi di fragole, la gelateria, lo zuccherificio, la fontana, e a nord un laghetto (lotto `2_-1`) con la sua passerella ([laghi.md](laghi.md)) | fragole, cipolle, pizza → crostata | crostata, gelato, zucchero, melanzane, lavanda (di lusso: 150%) |

Sono pezzi veri del catalogo, scritti a mano in `dati/vicini.js` (deterministici), e ogni villaggio si chiede e si compra solo
ciò che si fa a **quel** livello: la cassa non è mai impossibile (`guastiDeiVicini`). Il baratto e il mercato vendono merci
che il giocatore forse non fa ancora: è il motivo per tornare.

## Le regole (`motore/vicini.js`, pure, a orologio finto)

Tutto torna `{ ok: false, motivo, … }` senza cambiare niente, con un testo che dice cosa fare (`dettoVicino` in `visite.js`).

- **Entrare** (`entra`): serve il livello del villaggio (`non-sbloccato`, con `liv`); ogni entrata è una visita (evento `visita`).
- **La cassa** (`aiuta`): il vicino chiede 1–3 merci precise. Si consegna **dalle proprie scorte**, un po' alla volta; ogni
  consegna dà **esperienza** (`premioDi`, lo stesso conto del banco, [ordini.md](ordini.md)) e **mai monete**. A cassa piena il vicino
  regala il suo dono (roba sua) e la cassa si chiude: **riapre dopo 10 minuti** sull'orologio (anche a pagina chiusa). Rifiuti:
  `mancano`, `non-chiesto`, `gia-pronto`, `cassa-piena` (con quando riapre).
- **Il mercato che vende** (`compra`, da chi gioca): si compra con **monete** al prezzo per pezzo scritto sul banco; la roba
  finisce nelle scorte. È **l'unico posto dove le monete escono**. Il prezzo è il valore della merce (🪙6 al minuto di
  lavoro, `tettoDi`) per il carattere del vicino. **Non dà esperienza**: le monete cambiano forma, non si creano (il livello sale solo
  spendendo per costruire). La scorta del banco finisce e si rifornisce 15 minuti dopo la prima vendita (`esaurito`, con quando).
- **Il mercato che compra** (`vendi`): si consegnano `n` pezzi e si riceve **esperienza** (un quarto del tetto) e **roba del
  vicino** (che vale al più metà del tetto): **mai monete**. Ogni baratto si fa due volte per rifornimento (`VOLTE_PER_BARATTO`).
- **Visitare**: ogni villaggio ha qualcosa da vedere (le bestie che girano, il mulino che gira) e una storia di due righe, detta
  all'arrivo da chi ti ospita.

**Perché non rendono più del banco.** Il banco paga metà del tetto in esperienza. Un baratto paga un quarto in esperienza più al più
metà in roba, e la roba vale al più metà del suo valore in esperienza se riconsegnata al banco: in tutto mai più di metà del tetto
(`unita/fattoria3d-vicini` lo controlla per ogni baratto e dono). Una cassa si rinnova ogni 10 minuti per villaggio, un
baratto due volte ogni 15: modesto, come il banco.

## Lo stato dei vicini

`profile.campagne.fattoria3d.cfg.vicini`, **accanto** a `cfg.stato` e non dentro: `{ v, visite: {id: n}, cassa: {id: {date, riapre}},
mercato: {id: {venduti, scambi, rinnovo}} }`. `normalizzaVicini` lo rimette in forma (mai un'eccezione; un villaggio tolto si
scorda da sé). Lo stato della fattoria (`VERSIONE_STATO`) **non è stato toccato**: un giocatore senza vicini si legge come prima.
`Gioco.vue` lo scrive nel `salva()` insieme allo stato.

## La visita, nella scena

`scena3d/visita.js` è una piccola sottoclasse di `Mondo3d` (`class Visita extends Mondo3d`) su **un motore di sola lettura**:
`motoreDiVisita(snapshot)` costruisce una vera `Fattoria3d` dallo snapshot (`statoDaSnapshot`), senza borsa, con l'orologio fermo e
`soloLettura = true`. Così terreno, pezzi, contadino, telecamera e dito sono gli stessi del mondo di casa, ma:

- niente costruire, niente alberi né sassi da togliere (dentro la sua terra non ce ne sono), niente prezzi sui lotti, niente
  cartelli di cottura o di uova (`PezziVisita` toglie i cartelli); gli edifici del vicino stanno dove dice lo snapshot (`edifici: [{ tipo, i, j }]`,
  o solo il nome, al suo posto di una volta: [edifici-liberi.md](edifici-liberi.md));
- il dito lungo e il pennello non fanno niente (`costruzione` è un finto che non fa niente); un tocco sulla terra fa camminare il contadino;
- la **cassa** e il **banco del mercato** sono due cose in più (modelli `creaCassa` e `creaBancarella`), nei `posti` dello
  snapshot, non pezzi del catalogo: toccarli fa camminare il contadino fin lì e apre il foglio (`ui.apriLuogo`). Due tasti in basso
  («📦 La cassa», «🛒 Il mercato») li aprono senza camminare, e **«🚜 Torna a casa» sta sempre in alto**. La freccia della barra in
  visita riporta a casa, non in home.
- **Due tele.** Il mondo di casa si ferma (`mondo.ferma()`) e resta com'è; la visita ha la **sua tela**, nuova a ogni visita
  (un contesto WebGL non si riusa) e rilasciata al ritorno (`forceContextLoss`): due contesti insieme solo per la durata della
  visita. Tornando a casa `mondo.avvia()` riprende da dov'era, senza ricostruire niente. `vite.config.js` mette
  `visita.js` nello stesso gruppo del disegno 3D, così il sito spezzato lo scarica con la fattoria (non provato con un build).
- La parte che si tocca sta in `viste/Visita.vue` (testata, due tasti, storia, fogli, viaggio) e in `viste/Mappa.vue`;
  il filo con `Gioco.vue` in `visite.js` (`usaVisite`), per non gonfiarlo.

## Domani: la fattoria di un amico

`esportaLaMiaFattoria(motore, { id, nome, proprietario })` costruisce lo snapshot dalla fattoria vera (lotti, edifici, cose,
strade; mercato e cassa fatti con ciò che si fa a quel livello, cassa e banco in due celle libere). **Solo legge**: oggi non la usa
nessuno e un test la prova (esce valida, stabile se rinormalizzata, piccola, e un'altra fattoria la visita con `aggiungi`).

Quello che resterebbe da fare, e non è stato fatto: *dove* si pubblica e si legge lo snapshot (un servizio come quello di
Castle Battle, che non salva niente? qui servirebbe salvare, e cambia il discorso: costi, privacy, moderazione); il consenso dei
genitori e **chi può vedere cosa** (un nome e una faccia sono tutto ciò che esce, mai testo libero); un nome scelto fra una
lista e non scritto a mano; cosa succede quando l'amico cambia la sua fattoria (uno snapshot vecchio resta com'è, ha un `v`).
Anche l'aiuto resta locale: la cassa dell'amico si riempie *per chi visita*, lo stato di chi visita non scrive mai su quello
dell'amico (nessuna scrittura sul dato visitato: è letto, non toccato).

## Nei test

`unita/fattoria3d-vicini` (formato, normalizzazione ostile, regole a orologio finto, la scena di sola lettura da ogni villaggio,
l'esportazione) e `integrazione/fattoria3d-vicini` (il dito vero: trattore, mappa, grigi, viaggio, due tele, cassa, mercato, ritorno).

| bersaglio | cosa |
|---|---|
| `[data-f3="mappa"]`, `[data-vicino="<id>"]` (`[data-aperto]`), `[data-f3="mappa-msg"]` | la mappa del trattore, un villaggio, il rifiuto |
| `[data-f3="viaggio"]`, `[data-f3="visita"]`, `[data-f3="tela-visita"]` | il trattore che parte, la visita, la sua tela |
| `[data-f3="torna-casa"]`, `[data-f3="vicino-chi"]`, `[data-f3="storia"]`, `[data-f3="storia-ok"]` | «Torna a casa», chi ti ospita, la sua storia |
| `[data-f3="apri-cassa"]`, `[data-f3="cassa"]`, `[data-chiede="<k>"]`, `[data-aiuta="<k>"]` (`[data-puoi]`) | la cassa e le sue righe |
| `[data-f3="apri-mercato"]`, `[data-f3="mercato"]`, `[data-compra="<k>"]`, `[data-vendi="<i>"]`, `[data-f3="visita-msg"]` | il mercato e l'esito dell'ultimo tocco |

## Decisioni aperte

- **Vendere ai vicini non dà monete** (regola del gioco). Se un giorno si volesse un'eccezione andrebbe decisa, non scivolare.
- **Comprare dai vicini non dà esperienza** (si spendono monete, ma non per costruire).
- Il **trattore** a livello 7 e 🪙 40, e i quattro villaggi a 7/9/11/13: numeri da provare giocando.
- Un solo trattore è sufficiente, ma se ne possono mettere due (aprono la stessa mappa): non c'è un tetto.
- Il traguardo «Buon vicinato» conta visite e aiuti insieme, soglie 8/30/100.
