# Parità: ordini e commercio

Legenda in [README.md](README.md). 2D: i dati in `da2d/dati/` (`mercato.js`, `botteghe.js`, `mongolfiera.js`). 3D: [../ordini.md](../ordini.md),
[../mongolfiera.md](../mongolfiera.md), [../vicini.md](../vicini.md).

Regola comune, rispettata da entrambe: **si paga esperienza, mai monete**; un premio non supera 🪙6 per ogni minuto di lavoro.

## Il banco

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| M1 | apertura | mercato 🪙40, livello 2 | ✅ bacheca 🪙12 o bancarella 🪙15, livello 2 | – |
| M2 | posti | 3 fissi | 🟡 3 → 4 (liv 5) → 5 (8) → 6 (11) → 8 (14) | – |
| M3 | cosa chiede | ≤3 merci, ≤3 pezzi; solo merci ottenibili; pesca pesata (`pesoDellaMerce`) | 🟡 1–3 cose, raccolti 1–4, prodotti 1–2; ottenibili; un posto su due chiede un prodotto | P2 |
| M4 | clienti | 16 con mestiere: chi ordina «vuole» quella roba (`vuole`), nonna e bottegaio prendono tutto | 🟡 10, nessuno per mestiere (aperta: [../da-fare.md](../da-fare.md)) | P1 |
| M5 | premio | `PER_GESTO·gesti·(1+0,2(fasi−1))`, ordine = 6 + somma | ✅ lo stesso conto (`premioPer` della 2D, [../ordini.md](../ordini.md)) | – |
| M6 | rifiuto | gratis, posto vuoto 5 minuti | 🟡 gratis, posto vuoto 3 minuti | P2 |
| M7 | l'albero dalla merce che manca | si tocca e apre «Come si fa» | ✅ dal passo sotto il «mancano» del banco ([interfaccia-e-guida.md](interfaccia-e-guida.md) I3) | – |
| M8 | invito sulla bancarella (📋 muto se non c'è nulla) | sì | 🟡 il pallino sul tasto Banco e «N pronti!» sulla bacheca | – |
| M9 | il banco a 360 px | visto | ❌ `Bacheca.vue` mai guardata su telefono | P1 |

## Le botteghe del paese

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| M10 | pasticceria | 🪙180, livello 21; clienti pasticcera, maestra | ✅ `bottega_pasticceria`, stessi numeri ([../botteghe.md](../botteghe.md)) | – |
| M11 | osteria | 🪙220, livello 29; oste, cuoco, pizzaiolo, cuoco del sushi | ✅ `bottega_osteria` | – |
| M12 | mensa | 🪙200, livello 36; maestra, bidello | ✅ `bottega_mensa` | – |
| M13 | merceria | 🪙240, livello 43; sarta, lavandaia | ✅ `bottega_merceria` | – |
| M14 | regole | un cliente per bancone, 1 merce, 2–4 pezzi, prossimo cliente fra 10–20 minuti, +25% del banco, fama a cuori (5 cuori = un bancone in più, fino a 3) | ✅ uguali, letti dalla 2D (`dati/botteghe.js`); la merenda e le caramelle non esistono in 3D e cadono dagli elenchi | – |

Perché servono: sono il «chi chiede» per le merci profonde (biscotti, lasagne, maglioni) e la progressione per posto che il banco
non ha. Il nome `pasticceria` è già l'id del Pastificio 3D: la bottega ha l'id `bottega_pasticceria` (e tutte e quattro il prefisso `bottega_`).

## La mongolfiera

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| M15 | quando | 🪙250, livello 26 | 🟡 🪙100, livello 10 | – |
| M16 | carico | 3 file, 2–3 casse, 1–3 pezzi; solo prodotti con ≥2 fasi, mai mangime | ✅ uguale (1–2 pezzi sotto il livello 14) | – |
| M17 | quarta fila | dal livello 66 (`LIVELLO_GRANDE`) | ✅ `fileAl(livello)` legge `LIVELLO_GRANDE` dalla 2D (la scala ora è la stessa: 70 livelli) | – |
| M18 | bonus | fila piena +25%, tutto pieno +50%, sorpresa della fiera | ✅ uguali | – |
| M19 | riposo del cielo | 60 minuti | 🟡 2 minuti | P1 (D9) |
| M20 | la sorpresa | una delle 8 voci `fiera` (bandierine, giostra, zucchero filato, lanterne, barattoli, girasole, spaventapasseri, palco) | ✅ le stesse otto, nella scheda «Feste» del menu solo se le hai (`fiera: true`, non si comprano); la sorpresa regala solo quelle, preferendo le meno avute ([../decorazioni.md](../decorazioni.md)) | – |
| M21 | foglio | stiva di cassette | 🟡 foglio a casse, non visto su schermo | P1 |

## Carretto, vicini, vendere

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| M22 | carretto del vicino | 🪙32, livello 8: 5 contro 1, roba con roba, per svuotare lo scomparto | ✅ una vista del trattore 🪙40, livello 7 (non un pezzo a parte): «🛒 Il carretto» sulla mappa, stesso 5 → 1 della 2D (C15) | D10 |
| M23 | cassa del vicino | ❌ | ✳ chiede 1–3 merci, dà esperienza e un dono, riapre dopo 10 minuti | D10 |
| M24 | comprare dai vicini | ❌ | ✳ monete → roba, senza esperienza | D6 |
| M25 | **il vendere** | niente si vende | ✅ vendere ai vicini dà esperienza e roba, mai monete | D5 |
| M26 | visita ad amici | ❌ | ✳ pronta come dato (`esportaLaMiaFattoria`), non collegata a nessun servizio ([../vicini.md](../vicini.md)) | D10 |
