# I livelli della fattoria

**Dal 22/10/2026 sono quelli della fattoria 2D** (tolta il 31/10; i suoi dati stanno in `da2d/dati/`): 70 livelli, le stesse soglie, gli stessi
prezzi, i tempi in minuti veri, il costo di un gesto, gli scomparti dei silos. La 3D non ha numeri suoi dove la 2D ne ha uno (decisioni D2, D9, D11,
D13 e le eccezioni: [parita/decisioni.md](parita/decisioni.md) «Regola generale»). Il codice è `dati/livelli.js`; l'esperienza e i rifiuti stanno in
`motore/fattoria3d.js`; il ponte con i dati 2D è **`dati/parita2d.js`** (foglia: importa solo dati 2D).

## Il ponte: `dati/parita2d.js`

Chi scrive un pezzo, una coltura o una ricetta 3D dice solo **chi è nella 2D** e prende il resto da lì: `VOCE` (pezzo/edificio 3D → voce del catalogo 2D),
`COLTURA` (id singolare → id 2D), `RICETTA_DELLA_BESTIA` (pollaio → `uova`…). Da lì vengono `prezzo`, `liv`, `cresce` (rincaro per copia), `ms`
(i minuti × 60 000), `costo` (🪙 a ogni avvio), `raccolta` (🪙 a campo), gli scomparti. Un id nuovo che la 2D non ha non si inventa: si dichiara
solo 3D a mano (bacheca, passerella, molo, porticciolo). `unita/fattoria3d-parita` e `guastiDiParita()` (motore/taratura.js) confrontano **voce per
voce**: se un numero di `da2d/dati/` cambia, il test dice quale.

## L'esperienza

- **È la spesa in monete fatta dentro questo gioco**: pezzi, lotti, edifici, strade, **e ora anche i gesti** (raccogliere un campo, avviare una ricetta,
  nutrire una bestia: 🪙0–2 come in 2D). Non gli spostamenti né il mettere via, e un rimborso non la riduce. Sta in `stato.esperienza` e **non scende mai**.
- Le monete vengono solo dagli esercizi, quindi il livello è tempo di studio riletto; le consegne (banco, mongolfiera, vicini) danno esperienza, mai
  monete: un mercato che non paga niente non è un mercato, e sommate il livello resta tempo. **Il premio di un ordine e di una cassa è quello della 2D**
  (`premioPer`/`premioDelPezzo` di `da2d/dati/mercato.js`: 6 di base, 2 per gesto, +20% per fase): col tempo in minuti il vecchio conto «metà del tempo a
  🪙6/min» avrebbe pagato una lasagna 621 invece di 110.
- **Serve a non vendere duecento cose dal primo minuto**: nella 2D, in undici linguette, il campo che fa partire la catena stava in mezzo a novanta cespugli.

## Le soglie

- **Quelle della 2D**: `1,25 · (8·(n-1)² + 200·(n-1))` più il costo di ciò che ogni livello apre (`sogliaDi2D`). Il livello 2 sta a 260 monete (43 minuti
  di esercizio), il 10 a 3867, il 70 a ~72500 (**~202 ore**, contando solo la spesa).
- **Un solo ritocco, la pesca** ([sotto](#la-pesca-al-posto-della-peschiera)): `sogliaDi(l) = sogliaDi2D(l) + (l > 57 ? SCARTO_DELLA_PESCA : 0)`, con
  `SCARTO_DELLA_PESCA` = molo + porticciolo (102) − peschiera (360) = **−258**. Si ritara solo la parte alta della scala, di meno del 2%.
- **Il passo è una formula, non una tabella**, così i livelli non finiscono mai: chi ha giocato per mesi ha ancora un gradino davanti.
- **La roba di un livello non paga il livello dopo**: un guasto verifica che il resto di ogni salto sia almeno `SOGLIA_B` (200) dopo aver comprato la
  roba produttiva del livello (`costoDelLivello`). Provato senza, nella 2D: si costruiva quello che era appena arrivato ed eri già al livello dopo, un
  bersaglio che si sposta mentre lo si insegue.
- **Nessun tappo** («per salire devi aver provato le ricette nuove»): chi accumula monete e le spende tutte insieme salta avanti, ed è una scelta sua.
- Dopo l'ultimo livello (`ULTIMO` = 70) la formula continua e non si apre altro.

## La misura

`npm run tara:fattoria3d` (logica in `motore/taratura.js`) stampa la tabella; `unita/fattoria3d-taratura` ne tiene ferme le promesse: **il livello 2 non
oltre 45 minuti di esercizio, il 70 non oltre 12150 (~202 ore), nessuna cosa chiesta con più di un'ora di attesa in catena** (la più lunga della 2D è il
maglione alla lavanda, 53 minuti), nessun pezzo produttivo sopra i due terzi del salto del suo livello, nessun premio sopra il tetto, la terra che costa
come in 2D cella per cella, la parità con la 2D voce per voce. Metro: 🪙6 al minuto. «Attesa» = maturazione più cottura in catena, campi e bestie in
parallelo, una macchina alla volta.

| livello | monete in tutto | ore | cosa si apre (le cose che lavorano) |
|--:|--:|--:|---|
| 2 | 260 | 0,7 | bancarella, bacheca (il banco) |
| 4 | 970 | 2,7 | mulino |
| 6 | 1900 | 5,3 | fienile |
| 9 | 3317 | 9,2 | pollaio |
| 14 | 5907 | 16,4 | recinto (pecore) |
| 17 | 8097 | 22,5 | panificio |
| 23 | 12732 | 35,4 | pentolone |
| 31 | 20222 | 56,2 | zuccherificio |
| 42 | 32067 | 89,1 | sartoria |
| 57 | 52262 | 145,2 | **la pesca** (molo, porticciolo) |
| 62 | 59764 | 166,0 | sushi bar |
| 70 | 72504 | 201,4 | – |

## Cosa arriva quando

Lo dicono le cose stesse: `liv` sul pezzo, sull'edificio, sulla coltura e sulla ricetta, **letto dalla 2D**; `roba(liv)` le raccoglie girando i dati veri.

- **Una cosa produttiva per livello al massimo** (pezzo o edificio), più le decorazioni: un livello che dà tre cose da costruire si paga da sé, e uno
  che ne porta una è più divertente di un regalo enorme ogni tanto. Fra due cose che lavorano non passano più di cinque o sei livelli, se no chi ha
  imparato la catena riceve solo decorazioni. Con i livelli della 2D resta vero: bancarella 2, mulino 4, fienile 6,
  trattore 8, pollaio 9, recinto 14, telaio 16, panificio 17, stalla 18, caseificio 20, pentolone 23, anatre 24, cucina 25, mongolfiera 26, porcile 28,
  zuccherificio 31, gelateria 34, pastificio 37, capre 40, sartoria 42, tintoria 55, pesca 57, friggitoria 58, sushi bar 62.
- **Le colture** arrivano dove la 2D le apre: grano 1, carote 5, mais 11, erba medica 13, patate/cavolfiori 22, zucche 27, barbabietola 30, pomodori 33,
  melanzane/peperoni 39, cipolle/aglio 44, fragole 50, lavanda 54, riso 60.
- **Una ricetta dichiara il livello vero**: il più tardo fra il suo, quello della sua macchina e quello dei suoi ingredienti (`livelloDellaRicetta`, uguale a
  quello della 2D). Se non coincide col `liv` scritto è un guasto.
- **Nessun livello è vuoto** (da 1 a 70 apre sempre almeno una cosa): dopo i giri G5, G6, G8 e G9 le decorazioni della 2D ci sono tutte (206 più le 11 dei primi giri), con gli stessi livelli; i livelli vuoti erano 18 prima del G9 (3, 7, 10, 12, 15, 19, 32, 35, 41, 47, 49, 59, 65–70) e li hanno riempiti fiori, arredo, acqua e arrivi simili. Se un giorno si toglie una decorazione, il foglio dice «Niente di nuovo qui» e l'avviso «Livello 3: niente di nuovo, ma sei più in alto!». Il primo livello non è mai vuoto (guasto). Le feste e la fiera non contano come roba di un livello (`roba()` le salta).
- **I nomi stanno sulla cosa** (`NOMI`), l'ordine è la precedenza quando due cose arrivano insieme.
- **Compagni, abiti, villaggi, posti del banco** erano scritti sulla scala vecchia (finiva al 18): stanno nello stesso punto del percorso
  (`sullaScalaDellaDueD(l)` = `1 + (l-1)·69/17`: il 6 vecchio è il 21, il 13 è il 50). Eccezione: **Watson, Sherlock e Irene** restano ai livelli 1–3 (gli animali
  di casa arrivano per primi) e **Pepe**, il gatto nero, arriva dove arriva il gatto nero della 2D (19). I villaggi (25, 33, 44, 50) non chiedono mai ciò che non si fa
  ancora al loro livello. Il banco apre 4 ordini al 17, 5 al 29, 6 al 42, 8 al 54. Le casse della mongolfiera chiedono fino a 3 pezzi da subito (come in 2D).

## La pesca al posto della peschiera

Nessun equivalente 2D (la peschiera è un recinto): la pesca entra **dove la 2D ha la peschiera, il 57** (`LIVELLO_PESCA`), perché il pesce serve alla friggitoria (58) e
al sushi bar (62). Molo, molo girato e porticciolo sono al 57. **Un banco dà un pesce ogni 15 minuti, come la ricetta `pesce` della peschiera**: 5 minuti ad aspettare
che abbocchi (`PESCA.ms`) e 10 a ripopolarsi (`riposoMs`); il porticciolo e il mare danno più pesci per lancio (1, 2, 3: il premio per averli). Per i conti dei tempi un
pesce costa un ciclo (15 min). Le soglie dal 58 in poi si spostano di −258 (vedi sopra). Prima del 57 il pesce non c'è: friggitoria e sushi bar arrivano dopo.

## La terra: la stessa, cella per cella

La 2D vende piazzole da 6×6 celle (🪙45 la prima oltre le nove, poi ×1,38); la 3D lotti da 4×4. Si pareggia la **quantità** di terra (`TERRA` in `dati/regole.js`):
- `prezzoDelLotto(k)` = 45 · 1,38^p · 16/36, con `p` le piazzole di terra che hai sopra le nove della 2D (324 celle). **La 3D parte con 144 celle**, quindi i primi lotti
  costano pochissimo (🪙4, 5, 6… il quinto 9, il decimo 15) finché non si raggiunge la terra con cui parte un bambino della 2D; da lì segue la 2D (20 al lotto
  11°, 57 al 20°, 225 al 30°, 878 al 40°, 3431 al 50°).
- **Nel dubbio si regala**: le celle che hai pesano il 5% in meno nel conto (`TERRA.regalo` 1,05), quindi si paga un poco meno della 2D. Il prezzo non scende mai e
  sale a ogni lotto (almeno 1).
- Un lotto dà esperienza fino a un tetto (680): la terra cara non salta i livelli. Chi migra dalla 2D riceve tutta la terra che aveva, col regalo
  (`lottiPerPiazzole`: 13 lotti nuovi per chi non ne ha comprate, 15 con una piazzola in più, 25 con cinque).
- Il **campo** ha quattro tessere ma **rende un raccolto solo** (come uno della 2D): è una questione di spazio sulla mappa, non di costo.

## Gli scomparti (D11)

Ogni merce ha il suo scomparto da **8 pezzi**; ingrandire un silo aggiunge 2 a **tutti** gli scomparti di quel silo (`dati/silos.js`, prezzo `40 + 130·ln(1+n)`: 🪙40, 130,
185, 220…). I silos sono tre come in 2D (`terra`: i raccolti; `stalla`: lana, uova, latte, pancetta, pesce, mangimi; `bottega`: i prodotti finiti, la dispensa), e dal 30/10
sono **edifici in mappa che crescono**, senza le 🪙120 × 3 dei silos 2D: si ingrandiscono toccandoli ([magazzini.md](magazzini.md)); il gettone dell'inventario dice `n/max`,
rosso se pieno. Il perché dei numeri è in [magazzini.md](magazzini.md) «Perché gli scomparti».
- **Uno scomparto pieno non si riempie: non si raccoglie e non si paga, il lavoro resta lì.** Un campo maturo con lo scomparto pieno non parte (`provaRaccolta`, controllato
  prima del gesto così il campo non resta a metà); le bestie pronte e le pecore da tosare aspettano (se ne ritirano quante ce ne stanno); una macchina ritira quanto entra
  e il resto resta fra i pronti (`ritiraDa` dice `pieno`); il pesce resta all'amo. Il rifiuto è `scomparto-pieno` (con `k` e `max`): «🌾 Grano: lo scomparto è pieno (8). Usa un
  po' di roba o ingrandisci il magazzino», e il consiglio porta all'inventario.
- **Il tetto frena solo ciò che entra**: la roba già in scorta (un salvataggio di prima, un dono del vicino, una migrazione dalla 2D) resta tutta.
- Lo stato salva `silo: { terra, stalla, bottega }` (quante volte ingrandito); assente = 0.

## Il costo dei gesti (D13)

- **Raccogliere** costa il `raccolta` della coltura (🪙1, 🪙2 per mais, zucche, pomodori, melanzane), pagato **dall'ultima tessera** (le prime tre si staccano gratis, la quarta
  consegna il raccolto e paga). **Seminare** è gratis in 2D e qui (`semina`: 0).
- **Avviare una ricetta** costa il `costo` della 2D (🪙0 per il fienile, 1 per quasi tutte, 2 per le più ricche: torta, pizza, gelato…).
- **Nutrire una bestia** costa come avviare la sua ricetta in 2D (uova, latte, lana, pancetta, uova d'anatra, latte di capra: 🪙1 a pasto); a ogni bestia nutrita, non a ogni
  gesto: con meno monete si nutrono quelle che si può. Far crescere un agnello o nascere un cucciolo è gratis (non esiste in 2D).
- Un rifiuto per poche monete è `poche-monete` col `costo`; niente si consuma. Il primo giro della guida non finisce col primo raccolto da 🪙1 (`SPESA_DEL_PRIMO_GIRO`).

## Il fienile solo (D7)

Come la 2D: **un fienile, la macchina** (livello 6, 🪙150). Il fienile di scena (`FISSI`, 4×3 al (−9, −9)) è tolto; il suo posto resta riservato ai **sassi** dei lotti storici
(`FIENILE_TOLTO` in `dati/mondo.js`): i 100 sassi e i 57 alberi storici sono gli stessi di prima (un test confronta il conto e un hash), quindi un sasso già tolto o un albero
già tagliato restano quelli. Le celle ora sono libere. `POSTI_STORICI.fienile` (il posto della macchina) resta: serve a leggere un salvataggio vecchio.

## I salvataggi di prima

Uno stato 3D scritto sulla scala vecchia (22 livelli, 🪙60 il livello 2) **non perde niente**. `stato.scala` (2 = la scala della 2D) lo dice; uno stato senza `scala` ha
l'`esperienza` sulla scala vecchia e `normalizza` la porta (`motore/scala-vecchia.js`, che tiene congelate le soglie di prima):
1. il livello di prima va nello stesso punto del percorso (`livelloNuovoPer`: 1 → 1, 11 → 34, 22 → 70), con la **frazione già fatta**;
2. **non scende mai sotto il livello che serve a tenere ciò che si ha** (`livelloMinimoDi`): un edificio o un pezzo produttivo in mappa o nel magazzino, una coltura in scorta o seminata;
3. le scorte restano tutte, anche oltre lo scomparto; il `magazzino`, le `cose`, i lotti, le strade non si toccano; gli ordini aperti ricalcolano il premio dai dati di oggi
   (e le casse della mongolfiera l'esperienza). Rileggere lo stesso stato non lo porta due volte. Versione dello stato: 10.

La scelta è quella di `statoDa2D` (la migrazione dalla 2D: [parita/migrazione.md](parita/migrazione.md), ora **1 a 1**, `livelloPerProporzione` è l'identità): proporzionale, mai in giù.
Chi aveva «tutto» (il 18) sale al 70, dove ha tutto davvero; chi aveva poco tiene poco. Nessuno perde un'aggiunta; qualcuno guadagna livelli (mai monete).

## Il rifiuto

`{ ok: false, motivo: 'non-sbloccato', liv }` da `compraPezzo`, `compraEdificio`, `semina`/`seminaCampo` (la coltura) e `avviaRicetta`/`avviaRicettaIn`. Un edificio fuori dal
quadrato di partenza prima chiede i lotti (`compraEdificio` è `compraEMetti`: [edifici-liberi.md](edifici-liberi.md)): l'ordine dei controlli è sconosciuto → già tuo → livello → monete.
Per le fattorie già salvate **ciò che si possiede resta**: il gating vale solo per comprare, seminare e avviare. Un evento `livello` (`{ livello }`) esce a ogni salita.

## A schermo

Il gettone «⭐ N» con la barra sottile sta nel HUD e apre `viste/Livelli.vue`: una **scala** col livello di adesso in cima (la scatola già aperta con ciò che è arrivato, o «Niente
di nuovo qui»), sotto il gradino successivo con la scatola ancora chiusa. Salendo compare un avviso («Livello N: nome») e un pallino sul gettone finché non si apre il foglio; se
il livello apre un edificio l'avviso lo nomina e un «!» sul tasto Costruisci resta finché non c'è ([edifici-liberi.md](edifici-liberi.md)). Ciò che non è arrivato resta visibile ma
in grigio, con «Livello N». I tempi si dicono in minuti (`dati/tempo.js` `tempoBreve`: «45 s», «5 min», «1 h 20 min»); la carta di una ricetta dice anche il costo («⏱️ 7 min · 🪙 1»).

Nei test: `unita/fattoria3d-parita` (la parità voce per voce, i gesti, gli scomparti, la terra, i salvataggi di prima), `unita/fattoria3d-taratura`, `unita/fattoria3d`
(sezioni 13–20: soglie, `roba`, gating, lotti, catena, vecchio stato), `unita/fattoria3d-migra`. Integrazione: `integrazione/fattoria3d` (il gettone, gli scomparti nell'inventario).
