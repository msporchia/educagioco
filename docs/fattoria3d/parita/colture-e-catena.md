# Parità: colture, campi e catena

Legenda in [README.md](README.md). 2D: [../../fattoria/campi-e-silos.md](../../fattoria/campi-e-silos.md),
[catena.md](../../fattoria/catena.md), [macchine.md](../../fattoria/macchine.md). 3D: [../merci-e-ricette.md](../merci-e-ricette.md),
[../mangime-e-catena.md](../mangime-e-catena.md), [../regole.md](../regole.md).

## Campi e colture

| id | cosa | 2D | 3D | pri | dove |
|---|---|---|---|---|---|
| C1 | le colture | 16 (`dati/coltivazioni.js`) | ✅ le stesse 16 (id singolari: `carota`, `pomodoro`…; il legame è il `pezzo` e un test) | – | `dati/colture.js` |
| C2 | livello a cui si semina | grano 1, carote 5, mais 11, erba 13, patate/cavolfiori 22, zucche 27, barbabietola 30, pomodori 33, melanzane/peperoni 39, cipolle/aglio 44, fragole 50, lavanda 54, riso 60 | ✅ gli stessi (G3) | – | [livelli-ed-economia.md](livelli-ed-economia.md) |
| C3 | tempo di crescita | grano 5 min … riso 12 min | ✅ gli stessi minuti | – | D9 |
| C4 | resa di un campo | `RESA = 1`: un campo, un pezzo | ✅ quattro tessere, un raccolto in tutto (l'ultima lo consegna) | – | D12 |
| C5 | prezzo del raccolto | 🪙1 (🪙2 per mais, zucche, pomodori, melanzane) | ✅ stesso, pagato dall'ultima tessera | – | D13 |
| C6 | prezzo del campo | 🪙22 e +60% a copia (22, 35, 48, 62, 75…) | ✅ la formula della 2D | – | `dati/catalogo.js` |
| C7 | gli stadi del campo | 7 stati dipinti (da terra nuda a maturo); il seminato si distingue | 🟡 crescita continua (scala, foglie una alla volta, frutto oltre 0,55, colore che matura): si legge brullo → semini → maturo | – | [../scena.md](../scena.md) «Le colture» |
| C8 | cartelli di coltura | 16 `cartello_*` da posare (decorazione) | ❌ | P2 | [mondo-e-stagioni.md](mondo-e-stagioni.md) |
| C9 | seminare e raccogliere con un gesto | semi e cesto da trascinare su più campi | 🟡 si arma «semina/raccogli» e si trascina; il contadino cammina | P2 | [interfaccia-e-guida.md](interfaccia-e-guida.md) |
| C10 | terreni / pennello | `dati/terreni.js`: erba, acqua (pennello spento), strada e roccia annunciate | 🟡 strade a pennello ✅; acqua e mare sono geografia, non pennello; ✳ pesca | P2 | [mondo-e-stagioni.md](mondo-e-stagioni.md) |

Le arature non esistono in nessuna delle due.

## Silos e scorte

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| C11 | silo del raccolto / della stalla / dispensa | 3 silos da 🪙120, livelli 1 / 4 / 16 | 🟡 tre magazzini di serie (forma più piccola, D11), ingrandibili dall'inventario | – |
| C12 | scomparti | 8 pezzi per merce, +2 a ogni ingrandimento, `40+130·ln(1+n)` | ✅ uguali | – |
| C13 | scomparto pieno | non si raccoglie e non si paga, il campo resta pronto | ✅ vale per campi, bestie, tosa, macchine e pesca; il consiglio porta all'inventario | – |
| C14 | «chi la usa» sulla roba | premere una merce dice dove si lavora (`dati/usi.js`) + «Come si fa» | 🟡 l'inventario dice «a cosa serve» in una frase (`dati/usi.js`) e ha il tasto «🌳 Come si fa» (I3); resta il «chi la usa» come foglio e gli scomparti (C11–C13) | P2 |
| C15 | carretto del vicino per svuotare lo scomparto | roba 5 → 1, mai monete | ❌ (senza scomparti non serve; i vicini sono un'altra cosa) | P2 |

Perché i silos contano: sono un pozzo di monete che non si esaurisce (28 posti ≈ 7 ore di spesa) e il momento in cui il gioco
insegna il resto della catena. Con ricette 60× più svelte e niente tetto, la 3D si riempie di roba senza uno scopo. Decisione D11.

## Le macchine (14 nella 2D, 14 nella 3D)

Prezzi e livelli: 2D 🪙/liv → 3D 🪙/liv. Tempo delle ricette: minuti 2D → secondi 3D (×60).

| macchina | 2D | 3D | ricette mancanti nella 3D | pri |
|---|---|---|---|---|
| mulino | 150/4: mangime, pappa di mais (11), farina (17) | 🟡 60/3: farina, pastone | `mangime` (cibo di cane, gatto, coniglio, pappagallo, pesci: i compagni 3D non mangiano) | P1 con A6 |
| fienile | 150/6: foraggio di carote, becchime (9), foraggio (13), fiorume (44), fiorume_concime (52) | ✅ 40/2: 5 ricette (G5: fiorume, fiorume_concime) | – | – |
| telaio | 170/16: stoffa | ✅ 70/8 | – | – |
| panificio | 180/17: pane, torta (20), crostata e merenda (50) | ✅ 90/7 (G5: merenda) | – | – |
| caseificio | 200/20: burro, formaggio | ✅ 120/11 | – | – |
| pentolone | 150/23: zuppa, beverone, zuppa_orto, pastura | ✅ 75/19 (provvisorio, [../cortile-e-pentolone.md](../cortile-e-pentolone.md)): le 4 ricette | – | – |
| cucina | 210/25: minestrone, polenta, conserva, salsa, parmigiana | ✅ 110/12 (id `conserviera`; modello ancora da ridisegnare) | – | – |
| zuccherificio | 230/31: zucchero, caramelle (46), marmellata (51) | ✅ 130/13 (G5: caramelle) | – | – |
| gelateria | 240/34: succo, gelato, frullato | ✅ 140/14 | – | – |
| pastificio | 260/37: pasta, biscotti, pizza, lasagne | ✅ 80/6 (id `pasticceria`!) | – | – |
| sartoria | 250/42: maglione, sciarpa di lana, berretto | ✅ 150/15 | – | – |
| tintoria | 300/55: tintura, maglione alla lavanda, sapone, sacchetto | ✅ 160/16 | – | – |
| friggitoria | 300/58: patatine, fritto, arancini | ✅ 170/17 | – | – |
| sushi bar | 340/62: sushi, maki | ✅ 180/18 | – | – |

**Attenzione agli id**: in 3D `pasticceria` è il Pastificio, in 2D è la bottega della pasticcera; `conserviera` è la Cucina.
Ogni migrazione e ogni nuova bottega 3D deve tenerne conto ([commercio.md](commercio.md) M3).

## Le ricette (57 nella 2D, 57 nella 3D, dal giro G5: il `mangime` del mulino c'è dal giro G3)

| id | cosa | stato | pri |
|---|---|---|---|
| C16 | le 37 portate | ✅ stesso id, ingredienti e quantità (un test le confronta, con le deviazioni dichiarate in `MANCANTI`) | – |
| C17 | le 4 «di bestia» (uova, latte, lana, pesce) | ✅ sono i prodotti delle bestie e della pesca | – |
| C18 | le 9 di macchine non portate: mangime, zuppa, beverone, zuppa_orto, pastura, fiorume, fiorume_concime, merenda, caramelle | ✅ pentolone (G4), fiorume, fiorume_concime, merenda e caramelle (G5, [../cortile-2.md](../cortile-2.md)); 🟡 solo `mangime` (mulino, cibo di cane e gatto) c'è ma i compagni non mangiano (A6) | – |
| C19 | le 7 di recinti non portati: lana_angora, uova_anatra, tartufi, latte_capra, miele, lana_alpaca, concime | ✅ uova d'anatra, tartufi, latte di capra (G4); lana d'angora e d'alpaca (la lana dell'ovile, un contatore), miele e concime (G5) | – |
| C20 | tempi | minuti | ✅ gli stessi minuti | – |
| C21 | costo per lavorazione | 🪙0 (8 ricette), 🪙1 (42), 🪙2 (7) a ogni avvio | ✅ uguale (e 🪙1 a pasto per le bestie) | – |
| C22 | `parmigiana` ha l'emoji 🍆 | ✅ uguale (manca il disegno in entrambe) | P2 |
| C23 | zucca e patata con poche uscite (la 2D le manda al pentolone) | ✅ zucca → pastone, patata → verdure lesse (G4) | – |
| C24 | merci | 2D 66 prodotti, 3D 66 (G5 porta fiori, merenda, miele, concime, caramelle; i fiori sono un mangime senza ricetta col proprio id: `MANGIMI_SENZA_RICETTA`) | – |

## La fila

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| C25 | posti per macchina | 1 + 5 da comprare, 🪙20·40·80·160·320 | ✅ uguali (un test li confronta) | – |
| C26 | la fila dei recinti | stessa fila delle macchine | 🟡 i recinti 3D hanno bestie singole da comprare (🪙40/60/80 pecore, 25–73 galline, 60/90/120 mucche) | – |
| C27 | fila sul prato (dischetti, anello, posto col «+») | sì | 🟡 nel foglio della macchina, non sul prato | P2 |

## Mangime e catena N → 1

| id | cosa | stato | pri |
|---|---|---|---|
| C28 | N → 1 e mai il contrario | ✅ | – |
| C29 | becchime (galline), foraggio (mucche, pecore) | ✅ stesse quantità | – |
| C30 | tre mangimi, tre bocche (mangime / pastone, foraggio, pentolone) | ✅ cinque mangimi (becchime, foraggio, verdure lesse, pastone, verdura fresca) e le loro bocche (G4); resta il `mangime` del mulino per i compagni (A6) | – |
| C31 | l'erba medica | ✅ la più svelta, solo per il fienile (`mangime: true`) | – |
| C32 | veterinaria che chiede il mangime | ❌ il mangime non si consegna in 3D | P2 con A6 |
