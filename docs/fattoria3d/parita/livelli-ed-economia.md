# Parità: livelli, esperienza ed economia

Legenda in [README.md](README.md). 2D: [../../fattoria/livelli.md](../../fattoria/livelli.md). 3D: [../livelli.md](../livelli.md).
Metro: 🪙1 = dieci secondi di esercizio, 🪙6 = un minuto ([../../apprendimento/calibrazione.md](../../apprendimento/calibrazione.md)).

## Esperienza e soglie

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| L1 | **numero di livelli** | 70 (`ULTIMO`); l'ultima cosa del catalogo al 69 | ❌ 18 | **P0** |
| L2 | **durata** della scaletta (solo spesa) | ~202 ore: livello 2 = 45 min, 10 = 11 h, 30 = 56 h | ❌ ~8,25 ore: livello 2 = 10 min, 10 = 3 h 13, 18 = 8 h 15 | **P0** |
| L3 | formula del passo | `1,25·(8(n−1)² + 200(n−1))` + costo della roba produttiva del livello | 🟡 `1,25·((n−1)² + 47(n−1))` + lo stesso termine; livello 2 a 🪙60 | P0 con L1 |
| L4 | da dove viene l'esperienza | monete spese + consegne (banco, botteghe, mongolfiera) + bestie rimesse a posto | 🟡 monete spese (anche lotti, fino a 680 l'uno) + consegne, mongolfiera, vicini; niente bestie | P1 |
| L5 | il livello non scende | ✅ | ✅ | – |
| L6 | una cosa produttiva per livello | sì, con le coppie legate dalla catena | ✅ (`guastiDeiLivelli`) | – |
| L7 | nessuna ricetta prima dei suoi ingredienti | `guastiDegliSblocchi` | ✅ `livelloDellaRicetta` | – |
| L8 | fra due cose che lavorano non più di 5–6 livelli | sì fino alla fine | ❌ non verificabile finché la scaletta finisce al 18 | P0 con L1 |
| L9 | i premi da prendere (il livello apre, il bambino preme) | pagina dei livelli con quadratini e pallino sul ⭐ | 🟡 scala con scatola aperta/chiusa e pallino; `prendere` non c'è: arriva da solo | P2 |
| L10 | fattorie col metro vecchio | `soglie` nel salvataggio | – (la 3D riparte da 0 senza `esperienza`) | – |
| L11 | tarare | `npm run tara` | ✅ `npm run tara:fattoria3d` (scala 3D) | P0 con L1 |

## Cosa arriva quando: la 2D contro la 3D

Livello a cui compare la stessa cosa (💥 = arriva molto prima nella 3D).

| cosa | 2D | 3D | | cosa | 2D | 3D |
|---|--:|--:|---|---|--:|--:|
| campo, grano | 1 | 1 | | caseificio | 20 | 11 💥 |
| mercato / banco | 2 | 2 | | cucina | 25 | 12 💥 |
| mulino | 4 | 3 | | mongolfiera | 26 | 10 💥 |
| fienile | 6 | 2 | | zuccherificio | 31 | 13 💥 |
| pollaio | 9 | 5 | | gelateria | 34 | 14 💥 |
| ovile | 14 | 4 💥 | | pastificio | 37 | 6 💥 |
| telaio | 16 | 8 | | sartoria | 42 | 15 💥 |
| panificio | 17 | 7 | | tintoria | 55 | 16 💥 |
| stalla | 18 | 9 | | friggitoria | 58 | 17 💥 |
| trattore / carretto | 8 | 7 | | sushi bar | 62 | 18 💥 |

I prezzi seguono: fienile 🪙150 contro 40, mulino 150 contro 60, panificio 180 contro 90, sartoria 250 contro 150, sushi bar 340
contro 180. La 3D costa da metà a un quarto, e quasi tutto compare entro il livello 18.

## Dove le monete escono

La 2D ha **un pozzo con molti rubinetti**; la 3D ne ha pochi, e tutti una tantum.

| id | rubinetto | 2D | 3D | pri |
|---|---|---|---|---|
| L12 | campi, macchine, recinti | rincaro lineare per copia | ✅ | – |
| L13 | **raccogliere** e **lavorare** | 🪙1–2 a gesto | ❌ gratis (C5, C21) | P1 |
| L14 | silos e ingrandimenti | 🪙120 ×3 + `40+130·ln(1+n)` | ❌ | P1 |
| L15 | la fila | 20·40·80·160·320 per macchina | ✅ | – |
| L16 | la terra | piazzola 45 × 1,38ⁿ (geometrica) | 🟡 lotto 40 + 20n (+2·(n−32)² dal 34°) | P2 |
| L17 | gli ostacoli | sgomberare il bosco costa | ✅ albero 🪙3, sasso 🪙1 | – |
| L18 | spostare / mettere via | 🪙1 | ✅ | – |
| L19 | **bestie di casa**, cibo, coccole | 7 bestie 🪙75–120, cibo 5–14, coccole 1 | ❌ | P1 (A4–A8) |
| L20 | **decorazioni** | 217 voci da 🪙3 a 🪙95 | ❌ 10 voci | P1 ([mondo-e-stagioni.md](mondo-e-stagioni.md)) |
| L21 | addobbi | 🪙6–24 | ❌ | P2 |

Il rischio per il metro: se un bambino spende le monete in pochi giorni e poi non c'è altro, la 3D smette di essere «il posto dove
si spendono» e le monete degli esercizi non hanno più uno scopo. Con la 2D a 70 livelli un bambino ha un obiettivo per mesi.

## Tempi (la scala del gioco)

| id | cosa | 2D | 3D | rapporto |
|---|---|---|---|---|
| L22 | colture | 4–12 min | 12–70 s | da ×8 a ×22 |
| L23 | ricette | 4–20 min | 4–12 s | ×60 |
| L24 | uova / latte / lana | 8 / 10 / 8 min | 25 / 40 / 25 s (mangime a parte) | ×15–19 |
| L25 | riposo del banco / della mongolfiera | 5 min / 60 min | 3 min / 2 min | ×1,7 / ×30 |
| L26 | pesca | – | 12 s attesa, 60 s riposo ✳ | D4 |

La 2D è un posto dove si torna («torna più tardi, ci mette qualche minuto vero»); la 3D finora è un posto dove si resta a lavorare.
Sono due ritmi: scelta D9.
