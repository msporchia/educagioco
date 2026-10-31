# Parità: livelli, esperienza ed economia

Legenda in [README.md](README.md). 2D: i dati in `da2d/dati/livelli.js`. 3D: [../livelli.md](../livelli.md), che ne riporta anche i perché.
Metro: 🪙1 = dieci secondi di esercizio, 🪙6 = un minuto ([../../apprendimento/calibrazione.md](../../apprendimento/calibrazione.md)).

## Esperienza e soglie

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| L1 | **numero di livelli** | 70 (`ULTIMO`); l'ultima cosa del catalogo al 69 | ✅ 70, gli stessi (G3) | – |
| L2 | **durata** della scaletta (solo spesa) | ~202 ore | ✅ ~201 ore (la pesca sposta le soglie dal 58 di −258) | – |
| L3 | formula del passo | `1,25·(8(n−1)² + 200(n−1))` + costo della roba produttiva | ✅ `sogliaDi2D` importata | – |
| L4 | da dove viene l'esperienza | monete spese + consegne (banco, botteghe, mongolfiera) + bestie rimesse a posto | ✅ monete spese (anche lotti, fino a 680 l'uno, le bestie e i loro cibi) + consegne, mongolfiera, vicini, bestie rimesse a posto (⭐ un quindicesimo del prezzo) | – |
| L5 | il livello non scende | ✅ | ✅ | – |
| L6 | una cosa produttiva per livello | sì, con le coppie legate dalla catena | ✅ (`guastiDeiLivelli`) | – |
| L7 | nessuna ricetta prima dei suoi ingredienti | `guastiDegliSblocchi` | ✅ `livelloDellaRicetta` | – |
| L8 | fra due cose che lavorano non più di 5–6 livelli | sì fino alla fine | ✅ gli stessi livelli della 2D (la pesca al posto della peschiera, al 57) | – |
| L9 | i premi da prendere (il livello apre, il bambino preme) | pagina dei livelli con quadratini e pallino sul ⭐ | 🟡 scala con scatola aperta/chiusa e pallino; `prendere` non c'è: arriva da solo | P2 |
| L10 | fattorie col metro vecchio | `soglie` nel salvataggio | – (la 3D riparte da 0 senza `esperienza`) | – |
| L11 | tarare | `npm run tara` | ✅ `npm run tara:fattoria3d`: scala 2D + parità voce per voce | – |

## Dove le monete escono

La 2D aveva **un pozzo con molti rubinetti**, e la 3D li ha presi tutti (i silos senza le 🪙120 dei tre edifici).

| id | rubinetto | 2D | 3D | pri |
|---|---|---|---|---|
| L12 | campi, macchine, recinti | rincaro lineare per copia | ✅ | – |
| L13 | **raccogliere** e **lavorare** | 🪙1–2 a gesto | ✅ stesso costo (raccolta all'ultima tessera, ricetta all'avvio, pasto alla bestia) | – |
| L14 | silos e ingrandimenti | scomparti 8, +2, `40+130·ln(1+n)` | 🟡 stessi scomparti e prezzo; tre magazzini di serie (niente 🪙120 × 3) | – |
| L15 | la fila | 20·40·80·160·320 per macchina | ✅ | – |
| L16 | la terra | piazzola 45 × 1,38ⁿ | ✅ stesso prezzo cella per cella, quantità pareggiata (3D parte con 144 celle, 2D con 324), un po' di regalo | – |
| L17 | gli ostacoli | sgomberare il bosco costa | ✅ albero 🪙3, sasso 🪙1 | – |
| L18 | spostare / mettere via | 🪙1 | ✅ | – |
| L19 | **bestie di casa**, cibo, coccole | 7 bestie 🪙75–120, cibo 5–14, coccole 1 | ✅ le 4 che non sono compagni gratis, stessi prezzi e livelli (🪙75–120), cibo 5–14, coccole 🪙1; la spesa conta come esperienza ([../bestie-di-casa.md](../bestie-di-casa.md)) | – |
| L20 | **decorazioni** | 217 voci da 🪙3 a 🪙95 | ✅ tutte e 217 (11 dei primi giri + 130 del G8 + 76 del G9: fiori, arredo, acqua, albero di Natale e fiera), stessi prezzo e livello via `VOCE`; non spostano la scala; **i livelli senza niente di nuovo sono 0** (erano 18; 22 sulla lettura del giro G8) ([../decorazioni.md](../decorazioni.md)) | – |
| L21 | addobbi | 🪙6–24 | ✅ gli stessi ([../addobbi.md](../addobbi.md)) | – |

Il rischio per il metro: se un bambino spende le monete in pochi giorni e poi non c'è altro, la fattoria smette di essere «il posto
dove si spendono» e le monete degli esercizi non hanno più uno scopo. Per questo la 3D ha preso la scala intera della 2D (D2): 70 livelli,
un obiettivo per mesi.

## Tempi (la scala del gioco)

| id | cosa | 2D | 3D | rapporto |
|---|---|---|---|---|
| L22 | colture | 4–12 min | ✅ gli stessi minuti | – |
| L23 | ricette | 4–20 min | ✅ gli stessi minuti | – |
| L24 | uova / latte / lana | 8 / 10 / 8 min | ✅ gli stessi | – |
| L25 | riposo del banco / della mongolfiera | 5 min / 60 min | ✅ gli stessi | – |
| L26 | pesca | – | ✳ livello 57 (la peschiera), un pesce ogni 15 minuti per banco | – |

La fattoria è un posto dove si torna («torna più tardi, ci mette qualche minuto vero»), non dove si resta a lavorare: per questo i
tempi sono in minuti come nella 2D (D9).
