# Il secondo cortile: conigli, alpaca, asini, api

Giro G5 della parità ([parita/](parita/README.md): A1g–A1k, C18, C19, C24). Quattro recinti e le merci che portano; ricette, mangime e prodotti sono
**quelli della fattoria di sempre** ([../fattoria/macchine.md](../fattoria/macchine.md), [../fattoria/catena.md](../fattoria/catena.md)) e dal giro G3 anche
livelli, prezzi e tempi (minuti) li legge `dati/parita2d.js`. Restano solo 3D le capienze e il prezzo delle singole bestie. I dati stanno in `dati/cortile2.js`
(foglia, importa solo `parita2d.js`); i modelli in `scena3d/modelli-cortile2.js`, i profili dei tre stadi in `scena3d/bestie-puro-cortile2.js`.

| recinto (id) | 2D (🪙 / liv · prende → dà · minuti) | 3D | bestie (la 2ª, rincaro) |
|---|---|---|---|
| `conigliera` | 95 / 7 · 2 foraggio → lana d'angora · 14 | uguale, pezzo 4×3 | 1–6 conigli (20, +10) |
| `alpaca` (Recinto degli alpaca) | 330 / 47 · 1 foraggio → lana d'alpaca · 5 | uguale | 1–4 alpaca (90, +45) |
| `asini` (Recinto degli asini) | 355 / 52 · 2 foraggio → concime · 10 | uguale | 1–4 asini (95, +45) |
| `arnie` | 300 / 45 · 2 fiori → miele · 12 | uguale | 1–4 arnie (70, +35) |

Il rincaro per copia del recinto è quello della 2D (`cresce`). Il costo del gesto (🪙1 a pasto) pure. Un test (`unita/fattoria3d-cortile2`, sezione 1) li confronta.

## La catena

```
 foraggio ─2─▶ conigliera (coniglio) ─▶ 🧶 lana (la stessa dell'ovile: `stato.lana`)   14 min
 foraggio ─1─▶ alpaca                ─▶ 🧶 lana (idem)                                  5 min
 foraggio ─2─▶ asini                 ─▶ 💩 concime (merce nuova)                       10 min
 cipolla + aglio ─▶ fienile: fiorume ───────┐
 concime + erba medica ─▶ fienile: prato fiorito ─┴─▶ 🌼 fiori ─2─▶ arnie ─▶ 🍯 miele (merce nuova)   12 min
 fragole 2 + miele ─▶ panificio: merenda            zucchero + miele ─▶ zuccherificio: caramelle
```

- **La lana è una sola.** Come in 2D (`da: 'lana'`) conigli e alpaca danno la lana dell'ovile: stesso contatore, stesso scomparto, e il telaio e la sartoria la
  prendono da lì. In `LANA` la voce dice `dove` (il recinto delle pecore) e `anche` (conigliera, alpaca); `raccogliProdotti` passa da `_riponi`, che sa dove va una merce.
- **I fiori sono un mangime senza ricetta col proprio id.** Il fienile ha due ricette (`fiorume`, `fiorume_concime`, `da: 'fiori'`) ma nessuna si chiama `fiori`:
  `MANGIMI_SENZA_RICETTA` (in `dati/cortile2.js`) dà ai fiori nome, faccia, silo (la stalla) e macchina, e `merceDi`, `siloDi`, l'inventario, il rifiuto
  «Serve 🌼 fiori: lo fa il fienile», lo stato (i pronti del fienile sono chiavi di prodotto) e la migrazione 2D → 3D lo sanno. Il «prato fiorito» è l'unico anello che
  si chiude (il concime degli asini torna al prato): `lavoroDelMangime` e `attesaDelMangime` contano solo i raccolti, quindi per la strada più corta vince `fiorume`.
- **Il miele e il concime non si chiedono da soli** al banco né salgono in mongolfiera (come uova e latte): sono ingredienti. Si chiedono la merenda e le caramelle (`chiedibili`, `merceDaCassa`
  le vedono da sole). Sul mercato dei vicini il miele e il concime sono merci come le uova.
- **Livelli.** Il miele arriva al 45 (le arnie), la merenda al 50 e le caramelle al 46 per la 2D; i fiori da subito alle arnie (44 con cipolla e aglio). Il mangime c'è sempre prima del recinto che lo chiede
  (`guastiDeiLivelli`).

## I tre stadi

Una bestia per volta, come le altre del cortile (`bestie-puro.js`: il profilo di `profiloBestia` rimanda a `profiloCortile2` per le specie nuove; la `f` è la stessa).

| | 0 · ha fame | 1 · al lavoro | 2 · pronta |
|---|---|---|---|
| **Coniglio** | magro e piatto, orecchie giù, pelo scarso (la pelle beige si vede) | la **nuvola di pelo d'angora cresce** | **palla di pelo ×3**, orecchie dritte, salterella, **gomitolo rosso** accanto, alone dorato, scintillio |
| **Alpaca** | collo basso e proteso, vello rado, orecchie giù | il **vello cresce**, il collo si alza, mastica | collo lungo, **vello enorme**, **ciuffo sulla fronte**, **gomitolo turchese** accanto |
| **Asino** | magro, testa a terra, orecchie giù | **un mucchio di terra scura cresce** accanto, mastica | in piedi, orecchie dritte, coda che scodinzola, **sacco di concime** (tela, nodo, etichetta verde) sul mucchio |
| **Arnia** | casse chiuse, **favo vuoto** nella finestrella, niente api | le api entrano (una, due), **il favo d'oro sale**, una goccia cade | **favo colmo**, tre api in volo, coperchio sollevato, **vasetto di miele** accanto |

Il coniglio e l'alpaca hanno due varianti (posti pari e dispari: bianco e crema, chiara e bruna), l'asino due (grigio e bruno), l'arnia quattro colori di casse.

## I recinti (4×3, uno steccato col cancelletto come gli altri)

- **Conigliera**: la conigliera di legno su gambe (sportelli a rete, rampa), la tana (un monticello con la bocca scura), le carote che spuntano, la ciotola, il fieno,
  cartello «🐇 ANGORA»; la rete bassa davanti.
- **Alpaca**: tettoia col tetto di paglia e la **coperta andina a righe** appesa, mangiatoia, mucchio di fieno e un masso, abbeveratoio, steccato alto, cartello «🦙 ALPACA».
- **Asini**: stalla di pietra col tetto marrone e la rastrelliera, la **carriola** col letame, il mucchio, l'abbeveratoio di pietra, cartello «🐴 CONCIME».
- **Apiario**: il prato fiorito (24 fiori di quattro colori più i più alti ai bordi), il **tavolo dell'apicoltore** (vasetti d'oro, l'affumicatore, il cappello con la rete), steccato di vimini, cartello «🍯 MIELE».
- **Peso** (nodi del catalogo 3D, fusi quelli fermi): conigliera, recinto degli alpaca, degli asini e apiario sono sotto i 60 mesh vuoti e sotto i 130 pieni (un test lo tiene); coniglio, alpaca e asino ~10–15 mesh, arnia ~15 (api e goccia comprese).
  Geometrie e materiali sono condivisi, le animazioni vanno col tempo. Le emoji nuove (🐇 🦙 🐴 🐝) sono nel font (`npm run emoji`); 🫏, l'asino vero, è di Emoji 15 e Twemoji è fermo a 14: l'asino è un 🐴.
- **Le parti si toccano** ([animali.md](animali.md), «Le parti si toccano», `scena3d/bestie-corpo.js`): il collo dell'alpaca e dell'asino è un osso che va dalla spalla alla testa, le zampe escono da una coscia dentro il corpo, orecchie, occhi e muso stanno sulla testa, il pelo del coniglio e il vello dell'alpaca sono ellissoidi concentrici al corpo (a fame solo un velo sulla schiena). Provato da `unita/fattoria3d-bestie-connesse`.
- Si guardano col catalogo 3D (`npm run catalogo3d`, le voci sono in `strumenti/banco/catalogo-3d/fattoria-cortile2.js`: i quattro recinti, tre stadi per bestia e le varianti).

## La peschiera (A1k): tolta, e perché

La peschiera 2D (360 / 57, 2 mangime → pesce, 15 min) **non è un pezzo 3D**. La pesca (molo, molo girato, porticciolo; [geografia-e-pesca.md](geografia-e-pesca.md)) ne prende il posto: **allo stesso livello (57)**,
con lo **stesso ritmo** (un banco dà un pesce ogni 15 minuti: `PESCA.ms + PESCA.riposoMs`, un test lo confronta), lo stesso `pesce` che serve alla friggitoria (58) e al sushi bar (62), e nessun mangime in mezzo. Un recinto di pesci col
mangime del mulino sarebbe un secondo modo di avere lo stesso pesce senza il lago, e un'altra voce dove spendere nello stesso punto della scala. Il prezzo della peschiera (360) è sostituito da molo + porticciolo (102): lo
scarto è `SCARTO_DELLA_PESCA` e sposta solo le soglie dopo il 57 ([livelli.md](livelli.md)). Chi ha una peschiera nella fattoria 2D la ritrova in `daRegalare` (`cosa:peschiera`) alla migrazione. Decisione D10 ([parita/decisioni.md](parita/decisioni.md)).

## Nei test

`unita/fattoria3d-cortile2` (ricette, bestie e prezzi contro la 2D, la lana nel contatore, i fiori, la catena giocata nel motore — dalla conigliera al caramello —, i profili e i modelli),
con gli aggiornamenti a `fattoria3d-merci` (`MANCANTI` vuoto, il fienile con cinque ricette), `fattoria3d-migra` (la conigliera e il miele ora hanno un equivalente; la peschiera no) e `fattoria3d` (le ricette dello zuccherificio).
Bersagli dei cartelli: `[data-f3="cartello-bestie"][data-pezzo="conigliera|alpaca|asini|arnie"]`.

## Da guardare (non visto)

Guardati solo dal catalogo 3D e in node: non dalla camera di gioco (~22), né su un telefono, né col dito. Da giudicare: se il gomitolo e la nuvola d'angora si leggono a distanza (il coniglio è la bestia più piccola),
se il favo nella finestrella dell'arnia (0,16 × 0,3) si vede o serve una luce, se l'alpaca a fame (collo basso) e pronta (ciuffo) si distinguono, il peso con tutti e quattro i recinti pieni, se i prezzi delle bestie (🪙20–95) vanno a un bambino.
Il riscaldamento dei modelli (`compitiScaldo` in `pezzi.js`) non conosce ancora i quattro recinti: il primo costruito paga il modello.
