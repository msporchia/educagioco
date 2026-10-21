# Il mondo di sopra: il generatore a percorso

Il mondo di sopra del Sotterraneo 3D come **dato puro**, da una scheda e da un seme fisso, che gira in Node senza Vue, three o
DOM: la serpentina a sette zone di [mondo-a-percorso.md](mondo-a-percorso.md), generata **a blocchi**. Quello che queste
funzioni restituiscono è il **contratto** per il motore di sopra (compito B), la scena (D) e le terre (E): sotto, per intero.

- `dati/mondo-aperto.js` — la scheda, nella sua seconda metà: `MONDO_PERCORSO` (misure, seme, firme), `TRACCIATO`, `LUOGHI`,
  `ZONE_DEL_MONDO`, `INGRESSI_DEL_MONDO`, `VILLAGGIO`, `MULINO`, `PORTA_DELLE_TERRE`, `TERRE`, e `fasciaNellaTerra`,
  `saltoDellaTerra`, `difDellaZona`, `cittaDiOggi`, `pietraDiOggi`. Restano dal mondo di prima e servono ancora: `HABITAT`,
  `LOTTI`, `BOTTEGHE`, `PERSONE`, `PERSONE_NUOVE`, `difDi`.
- `motore/mondo-percorso.js` — il generatore; `motore/mondo-aperto-strade.js` — l'A* e i passi da una cella (non cambia).
- `strumenti/sotterraneo-pianta-percorso.mjs` — la pianta in PNG e la pianta del villaggio (`npm run pianta -- --percorso`).

**Il mondo ad anelli non c'è più** (tolto il 20 ottobre 2026 col compito D: `motore/mondo-aperto.js`, la prima metà della scheda,
`motore/mondo-sopra-anelli.js`, `strumenti/sotterraneo-pianta-mondo.mjs`, `unita/sotterraneo-mondo`, la riga `--mondo` della pianta);
le chiavi delle sue regioni restano quelle dei luoghi, e `unita/sotterraneo-mondo-percorso` le tiene scritte.

## Le misure

- **504×300 celle** (la riga 0 a nord), il tracciato del prototipo (352×216) stirato di 1,43 per lato: la forma approvata, più
  grande perché l'utente l'ha chiesto il 20 ottobre. Corridoio di una zona largo ~58 celle (`mezza` 29, 0,82–1,18 col rumore).
- **Strada maestra 1 548 celle; da una pietra alla dopo 202–227 passi** (221 · 202 · 208 · 214 · 227 · 210), cioè 45–50 s a
  piedi (`PASSO_MONDO` 4,5). Col prototipo erano 140–164 su 352×216: i passi crescono col lato, 1,43 × 150 ≈ 215.
- **Erba per zona 11–14 mila celle** (il prototipo 5,7–8 mila, il mondo ad anelli 15 mila in tutto): ~83 mila in tutto.
  `cellePerBranco` del motore di sopra va rifatto per zona (compito B).
- **Il tempo**, in Node: lo scheletro 70–85 ms a freddo; una zona 25–100 ms a motore caldo, ~130 ms la prima a freddo; partire
  (scheletro, prati e bosco) ~0,35 s; il mondo intero con le misure ~0,5–1 s. Sul Note 7 si stima ×3–5: una zona 0,1–0,5 s,
  partire 1–1,7 s, quindi la zona dove si è prima e le accanto dopo, a pezzi o in un worker (compito D, da misurare col dito).
- **La memoria**: le celle sono array tipizzati allocati interi (~20 byte a cella, ~3 MB) più le basi tenute (~3 MB); le liste
  pesanti (decoro ~6 000 oggetti, case, campi) sono per zona e si buttano.

## Le funzioni

| funzione | cosa fa |
|---|---|
| `scheletroDelMondo(seme, { terra })` | lo scheletro di tutto il mondo, leggero e deterministico: torna `m` con le celle ancora vuote |
| `caricaZona(m, k)` | riempie le celle della zona k e ne fa le liste (`m.carico[k]`); `m.zonaCaricata[k]` diventa vero |
| `scaricaZona(m, k)` | butta le liste della zona; le celle restano scritte (ricaricando tornano identiche) |
| `tieniAttorno(m, x, y)` | carica la zona di (x, y) e le due accanto, scarica le altre; torna la zona |
| `caricaTutto(m)` | tutte le zone (strumenti, test, banco) |
| `zonaDi(m, x, y)` | la zona di una cella, anche non caricata (il villaggio è della 0) |
| `zoneAttorno(m, k)` | `[k−1, k, k+1]` dentro il mondo: le file non si toccano, una zona confina solo con la prima e la dopo |
| `livelloDi(m, x, y)` | il livello dei mostri lì: dall'inizio alla fine della fascia lungo l'arco della zona; 0 nel villaggio |
| `baseDi(m, x, y)` | la base di una cella senza caricarla (terreno senza l'acqua e la roccia interne, zona, arco, quota pura): per il lontano |
| `listaDi(m, nome)` | `decoro`, `case` o `campi` delle zone caricate, insieme |
| `misuraDelMondo(m)` | carica tutto, fa `passi`, `distanze` vere, `firmaCelle` e i guasti del percorso (in Node) |
| `generaMondoPercorso(seme, { terra })` | scheletro, tutte le zone, misure |
| `mascheraDelMondo(m)` | le righe `.`/`#` per `creaTerra` di `motore/terra.js` (nessun parametro: niente si chiude più) |

**Perché a blocchi dà lo stesso mondo.** Lo scheletro decide tutto ciò che lega una zona all'altra (curva, confini, lotti,
stradine). Una zona si riempie in una **finestra sua** (la zona più 14 celle) con array suoi, dove le celle fuori dalla zona
hanno la loro **base pura**: rumore e quota sono funzioni delle coordinate, la base di una cella (corridoio, cresta, confine,
villaggio) dipende solo dalla curva. Non legge mai le celle già scritte da un'altra zona, e scrive solo le sue: per questo
caricarle una per volta, in qualunque ordine, con scarichi in mezzo, dà esattamente le stesse celle e le stesse liste di
`caricaTutto` (il test lo prova). L'acqua e la roccia dentro una zona stanno a più di 10 celle dalle altre (`STACCO_BORDO`):
dove due zone si toccano c'è solo la base pura, e si cuciono senza giunte.

## Lo scheletro

`m = scheletroDelMondo(seme, { terra })` ha, senza nessuna zona caricata:

- `W`, `H`, `seme`, `terra` (1 se manca), `terraDi` (la riga di `TERRE`), **`firma`** (dello scheletro: curva, zone, posti,
  lotti, stradine, confini; non cambia con la terra; è quella che si salva col mondo), `lunghezza` (della strada), `guasti`,
  `msScheletro`, `id(x, y)`, `calpestabile(x, y)`.
- **`zone`** (7, in fila): `chiave`, `nome`, `i`, `s0 s1` (l'arco della strada), `fascia` (nella terra), `fasciaPrima` (nella
  prima), `dif`, `colore`, `luoghi` (chiavi), `confine` (verso la dopo: `tipo`, `modello`, `nome`), `pietra` (`zona:<chiave>`),
  `ingressi` (le due chiavi), `rettangolo` `{x0 y0 x1 y1}` (dove possono stare le sue celle), `centro` (sulla strada a metà),
  `etichetta` (dove scrivere il nome, di lato), `area` (le celle d'erba, a zona caricata).
- **`regioni`** (i luoghi, 25): la 0 è il villaggio, poi i luoghi in fila; ognuno `chiave` (quelle del mondo ad anelli: le taglie
  le nominano), `nome`, `habitat`, `zona` (indice), `zonaChiave`, `s0 s1`, `fascia`, `dif`, `abitanti`, `caporale`, `cx cy`
  (sulla strada), `tana` `{x y}` (riservata 7×7 per il signore), `dungeon` (la chiave del primo che ci sta, o null), `celle`.
- **`confini`** (6, fra una zona e la dopo, **senza grata**: si passa sempre): `i`, `da`, `a`, `tipo` (`ponte`/`valico`),
  `modello` (`arco`, `passerella`), `nome`, `x y`, `s`, `verso` (`est`/`sud`: come corre la strada lì), `celle` `{x y acqua}`
  (il piano del ponte o il varco), `rive` (due celle sulla strada, prima e dopo, con la `zona`), `quota` e `arco` del ponte.
- **`citta`** = `[villaggio]` e **`villaggio`**: `x y w h` (40×26), `centro`, `raggio`, `piazza` `{x y w h}`, `partenza`,
  `cancello`, `quota` (spianato), `mercanti` (i quattro posti), `persone` (la ragazza e il capitano), `minatore`, `portale`,
  `pietra`, `bacheca`, `cartello`, `pozzo`, `case` (il fondale, `senzaPorta`), `alberi`. Niente forte né rifugio.
- **`posti`** (tutti): `tipo`, `chiave`, `x y w h` (il lotto), `piede` (dove sta), `accanto` (dove si ferma l'eroe), `zona`,
  `regione` (il luogo), `quota`. I tipi: `citta` (il villaggio intero), `mercante` (con `nome em sprite ruolo bottega`), `minatore`,
  `persona` (`ragazza`, `capitano` nel villaggio; `eremita`, `guardia`, `boscaiolo`, `pescatore`, `mugnaio` fuori), `pozzo`,
  `portale`, `bacheca`, `cartello`, `pietra`, `ingresso`, `mulino`, `terre`. E per tipo:
  - `pietre` (8): `villaggio` e `zona:<chiave>` (una al mezzo di ogni zona accanto alla strada), ognuna col `dif`.
  - `ingressi` (14): `chiave`, `indice` (0–6 la storia, −1 l'abisso, null i sei nuovi), `nome`, `monumento`, `paesaggio`, `boss`,
    `appoggio`, `finale` (le tombe), `livello` (nella terra), `zona`, `storia`. Ognuno ha la sua stradina fino alla strada.
  - `persone`, `mulino` (`verso` dell'acqua con la ruota, `ruota`, `lato` −1/+1/0), `terre` (la porta delle terre, in fondo).
  - `antri` (vuoto: non ci sono più), `tane`.
- `partenza` (nella piazza), **`tracciato`** (la strada maestra, un punto `{x y s}` ogni due celle d'arco: per la veduta, la
  bussola, la scia verso una meta lontana), **`distanze`** (lungo l'arco: `pietre` `{da a arco}`, `dungeon` `{chiave arco}`; dopo
  `misuraDelMondo` i passi veri).
- **`zonaCaricata`** (7 booleani), **`carico`** (per zona, o null): `decoro`, `case`, `campi`, `celle`, `erba`, `tolte`, `firma`, `ms`.

**Cosa basta alla veduta e al lontano senza zone caricate**: `zone` (nomi, `etichetta`, `centro`, `rettangolo`, `colore`),
`tracciato`, `confini`, `pietre`, `ingressi`, `terre`, `villaggio`, e `baseDi` cella per cella (il terreno lontano a un vertice
ogni due celle sono ~38 000 chiamate, qualche decina di ms).

## Le celle

Allocate intere da subito (`k = y·W + x`), scritte quando la loro zona si carica; prima `zona` −1, `terreno` roccia.

| campo | cosa |
|---|---|
| `terreno` | `ERBA` 0, `ACQUA` 1, `ROCCIA` 2 |
| `zona` | l'indice della zona (il villaggio 0), −1 non caricata |
| `reg` | l'indice in `regioni` (0 il villaggio) |
| `arco` | l'arco della strada maestra alla cella più vicina: fa salire il livello dentro la zona |
| `ponte`, `varco` | l'indice del confine (−1): il piano di un ponte (acqua sotto, `ERBA` alle due teste) e il varco del valico |
| `strada` | 1 stradina, 2 strada maestra (e il tratto dal cancello), 3 piazza |
| `blocco` | 1 lotto (posti, case, campi), 2 ingombro del decoro (e gli alberi del villaggio) |
| `riservato` | il decoro e gli oggetti di scena non entrano (davanti ai posti, le tane) |
| `zonaCitta` | 1 nel villaggio |
| `campo`, `isola` | un campo coltivato; un pezzo d'erba che si vede ma non si raggiunge |
| `quota` | l'altezza (`LIVELLO_ACQUA` −0,25) |
| `cintura` | 1 dove non stanno mostri: 12 celle attorno al villaggio, alla strada fino alla cripta e alla pietra dei prati, alla cripta |

Si cammina dove `terreno` è erba o c'è un ponte, e `blocco` è 0: `m.calpestabile(x, y)`.

## Il generatore, passo per passo

1. **La strada maestra**: Catmull-Rom per i punti del tracciato stirati, un campione ogni mezza cella con l'arco `s`.
2. **Le zone** lungo l'arco in proporzione al `peso`; i luoghi in fila dentro ognuna.
3. **I secchi** di 12 celle: per ognuno i campioni fra cui una cella cerca il più vicino, e quindi le zone a cui può andare.
4. **La base** di una cella (pura, tenuta a mano a mano): il campione più vicino (d1, arco) e il più vicino di un'altra fila
   (d2); roccia fuori dal corridoio, la cresta dove due file si avvicinano, la cornice; fra due zone il confine di traverso (un
   fiume di ~4 celle col ponte sulla strada, o una cresta col varco); il villaggio (40×26 più due celle) erba.
5. **Il villaggio dalla pianta** (`VILLAGGIO`): la piazza, i lotti col `piede` e l'`accanto`, il fondale, gli alberi, il tratto
   dal cancello alla curva. Niente campi.
6. **I posti**: le pietre al mezzo di ogni zona, i dungeon (`f`, `lato`, `fondo` della scheda) con la stradina A*, le tane, il
   mulino sulla riva del fiume poco prima del ponte (la ruota nell'acqua, da qualunque lato), la porta delle terre, chi sta
   fermo; ognuno con la sua stradina. Un lotto è erba della sua zona con un anello libero, cercato a spirale.
7. **I confini**: le celle, le rive, la quota del ponte (la riva più alta).
8. **La firma**, le distanze lungo l'arco, i rettangoli delle zone.

Poi, per ogni zona (`caricaZona`): **a.** quanto si è vicini a strade, lotti, passaggi, villaggio e altre zone; **b.** il lago,
le pozze, gli spuntoni per habitat (a quattro celle dalle strade e dai posti, a dieci dalle altre zone), la gobba di roccia o lo
stagno dietro i dungeon con `appoggio`; **c.** l'erba che dalla strada della zona non si raggiunge diventa roccia (o isolotto);
**d.** campi e case nei luoghi che li hanno (`campi`, `case` della zona), la porta verso la strada; **e.** il decoro per habitat
(un ingombro sempre con otto celle libere della stessa zona attorno: non chiude mai una strada), le rupi sulla roccia vicina
all'erba; **f.** la quota (la pura più quello che cambiano acqua e roccia interne, ammorbidito fra celle della zona; lotti,
villaggio e ponti spianati); **g.** la cintura; la firma della zona.

## I guasti

Nella lista `guasti`, vuota per il seme scelto (il test lo pretende). Dallo scheletro: un posto senza lotto, un dungeon senza
stradina, un confine senza passaggio, il mulino senza riva. Da `misuraDelMondo`: un posto che dalla piazza non si raggiunge;
due pietre a meno di 190 o più di 245 passi (`PASSI_FRA_PIETRE`); **una scorciatoia fra le file** (dalla pietra alla seconda
dopo in meno dell'80% del giro per quella in mezzo); la storia non in fila a piedi; la cripta oltre 80 passi (`CRIPTA_AL_PIU`)
o fuori dalla cintura; una zona senza due dungeon; chi sta fermo che chiude una strada; due posti sullo stesso lotto; un
confine che non porta da una riva all'altra.

## Il seme

**Seme 8, firme `521a0901` (scheletro) e `cf2f657b` (celle)**, scelto il 20 ottobre 2026 con `--semi 1-12` sulla misura 504×300:
nessuno dei dodici ha guasti; l'8 è quello del prototipo approvato e ha le pietre più pari (202–227) con la cripta a 76 passi.
Chi cambia il generatore o la scheda vede le firme diventare rosse in `unita/sotterraneo-mondo-percorso`: si riguarda la pianta,
se il seme non regge se ne sceglie un altro col foglio, si scrivono le firme nuove in `MONDO_PERCORSO`. **La firma dello
scheletro sta nei salvataggi** (`mondo.firma`): cambiarla rifà nebbia, `dove` e `sopra` di tutti (il travaso, compito B).

## Le terre

`terra` (1 la prima) non tocca la mappa né le firme: alza fasce, `dif` no, e il `livello` dei quattordici ingressi di
`saltoDellaTerra(terra)` = 14 a terra, fino alla quinta (+56). La tinta e i nomi in `TERRE`; passare di terra è del compito E.

## I salvataggi di prima

- **Le città che non ci sono più**: `cittaDiOggi('forte')` e `('rifugio')` danno `villaggio`. Una taglia salvata
  `t:forte:<modello>:<parametro>:<giro>` si rilegge sul villaggio (il compito B la passa da qui in `taglie-bacheca.js`).
- **Le pietre accese**: `pietraDiOggi` porta `villaggio`, `forte`, `rifugio` sul villaggio e la chiave di un dungeon (`altare`)
  sulla pietra della sua zona (`zona:prati`).
- **I luoghi** tengono le chiavi delle regioni di prima, gli ingressi le chiavi dei dungeon: un id salvato si ritrova.

## Cosa resta agli altri compiti

- **B (motore di sopra)**: `mondo-sopra.js` sul percorso (`ilMondo` con lo scheletro e `tieniAttorno`, le pietre
  `zona:<chiave>`, il villaggio che porta avanti, `cittaDelDungeon` = il villaggio, la firma salvata e il travaso), `aperta.js`
  con le fasce da `livelloDi` e la cintura da `m.cintura`, i branchi per zona (da caricare e buttare con la zona), le taglie con
  `cittaDiOggi`, il banco per zona; via `regolaDi`, `passaggioAperto`, `anelloDi`.
- **D (scena)**: i pezzi su 504×300 e solo nelle zone caricate, il lontano e la veduta da `baseDi` e dal `tracciato`, il
  villaggio dalla pianta (`posti` con `citta: 'villaggio'`), i ponti dai `confini` (nessuna grata), il mulino col `verso`, la porta
  delle terre, i sei monumenti nuovi, le icone; via le grate e gli antri.
- **Il mondo ad anelli** è stato cancellato da D, l'ultimo a migrare (sopra).

Nei test: `unita/sotterraneo-mondo-percorso` (le firme del seme scelto, nessun guasto, lo stesso seme lo stesso mondo, niente
import fuori dal repo né DOM, le misure, **a blocchi come tutto insieme** e le liste che calano scaricando, la terra 2 con la
stessa mappa e le fasce +14, ogni posto raggiungibile, nessuna scorciatoia, le pietre a 200–230 passi, la storia in fila, la
cripta nella cintura, il villaggio uguale alla pianta, i luoghi e gli ingressi con le chiavi di sempre, i confini aperti, il
tempo di una zona, `creaTerra` sulla maschera).
