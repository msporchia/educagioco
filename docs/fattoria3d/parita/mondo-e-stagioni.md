# Parità: terra, decorazioni, acqua, stagioni

Legenda in [README.md](README.md). 2D: [../../fattoria/stagioni.md](../../fattoria/stagioni.md), [baule.md](../../fattoria/baule.md).
3D: [../terreno.md](../terreno.md), [../mondo-infinito.md](../mondo-infinito.md), [../laghi.md](../laghi.md), [../geografia-e-pesca.md](../geografia-e-pesca.md),
[../edifici-liberi.md](../edifici-liberi.md).

## La terra

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| W1 | unità | piazzola 6×6 celle, 9 di partenza | 🟡 lotto 4×4, 9 di partenza dentro 42 lotti storici | – |
| W2 | confini | mondo che cresce con 2 piazzole di margine | ✳ senza confini (`a_b` qualunque), finestra 9×9 attorno alla camera | tieni (D10) |
| W3 | prezzo | `45·1,38ⁿ` | 🟡 `40+20n` poi quadratico | P2 |
| W4 | il bosco | sgomberare costa, non rende | ✅ albero 🪙3, sasso 🪙1, niente legna | – |
| W5 | gli edifici dove si vuole | sì (baule, tenere premuto) | ✅ «Costruisci qui» e trascinare; ✳ scorrimento ai bordi | – |
| W6 | ruotare / rovesciare | ↻ ⇄ 📦 sul pezzo tenuto | ✅ ↻ a quarti di giro (`rot` 0–3) su ogni pezzo e edificio tranne campo, acqua, ponti e moli, porticciolo; col pezzo in mano un secondo dito sul tasto; l'ingombro e il davanti seguono ([../rotazione.md](../rotazione.md)). ⇄ no: un giro di 180° basta | – |

## Decorazioni e giardino (217 voci: 11 dei primi giri + 130 del G8 + 76 del G9, tutte portate)

| id | gruppo (2D) | voci 2D | 3D | pri |
|---|---|---|---|---|
| W7 | verde (alberi, siepi, arbusti, sassi, tronchi) | 27 | ✅ 27 voci, scheda «Verde», stessi id, prezzo e livello ([../decorazioni.md](../decorazioni.md)); gli alberi del bosco restano ostacoli da abbattere | – |
| W8 | fiori e vasi | 34 | ✅ 33 voci nuove, scheda «Fiori» (+ il bocciolo, che è l'aiuola sotto «Decori»); poche corolle e molti colori, le copie sono istanze ([../decorazioni.md](../decorazioni.md)) | – |
| W9 | acqua (fontane, pozzi, ninfee, canne, ponte, laghetto, stagno, mulino ad acqua, cantina) | 12 | ✅ 7 voci nuove, scheda «Acqua»: fontana grande, cantina, pozzo coperto, **mulino ad acqua sulla riva** (la ruota gira), **ninfee** (due, solo sull'acqua) e **canne** (anche nell'acqua bassa); più fontana, pozzo, ponte, stagno, laghetto di prima ✳ passerella, molo, porticciolo | – |
| W10 | recinti, cancelli, pergole, gazebo, cartelli | 29 (16 sono i cartelli delle colture) | ✅ 29 voci, scheda «Recinti»; il `recinto` di legno è `recinto_legno` (in 3D `recinto` è quello delle pecore); la bandiera sventola | – |
| W11 | case, forni, chioschi, lampioni, serra | 19 | ✅ 19 voci, scheda «Case» (lampioni compresi; non fanno luce di notte) | – |
| W12 | arredo (panchine, sedie, amache, tavoli, lucine) | 29 | ✅ 27 voci nuove, scheda «Arredo» (panchina e tavolo di prima stanno sotto «Decori»); mulinello che gira; lucine e paiolo con luce finta (niente giorno e notte) | – |
| W13 | bestiole (cucce, casette, farfalle) | 17 | ✅ 17 voci, scheda «Bestiole»: ferme, non sono i compagni; gattino smoking e cucciolo bobtail | – |
| W14 | raccolto (balle, cassette, ceste) | 39 | ✅ 38 voci (lo spaventapasseri c'era già), scheda «Raccolto»; pane, torta, marmellata e latte sono `<id>_decoro` (id già presi dalle merci) | – |
| W15 | feste (zucche, albero di Natale) e fiera (8) | 3 + 8 | ✅ le due zucche (🪙6, 🪙10, solo a Halloween); l'**albero di Natale** 🪙24 solo da novembre al 6 gennaio (scheda «Feste»); la **fiera**: otto pezzi (giostrina e mulino che girano) che non si comprano, vengono dalla sorpresa della mongolfiera (M20) | – |

Perché contano: i decori sono la spesa piccola e la **scelta della bambina** («di norma le decorazioni sono una scelta sua»).
Una terra grande senza niente da mettere sopra è un prato. In 3D ogni decoro è un modello: un costo di peso e di
disegno ben maggiore di un'emoji o di un ritaglio. Strada economica: **una famiglia per giro** (fiori, alberi da giardino, arredo)
riusando le forme già nel catalogo 3D (`strumenti/banco/catalogo-3d/`).

## Acqua e pesca ✳

| id | cosa | 2D | 3D |
|---|---|---|---|
| W16 | laghetto / stagno | pezzi da giardino di 2–3 celle; il pennello dell'acqua è spento | ✅ pezzi (liv 5 e 11) + laghetti naturali nei lotti + mare a ovest + laghi grandi a est ✳; pesca da molo e porticciolo ✳. D8: laghetti naturali e costruiti convivono |

## Stagioni e feste

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| W17 | Halloween (1–31 ott) | recinti in costume (sprite `*_halloween`), zucca 🪙6 e due zucche 🪙10, cappello da strega 🪙8 | 🟡 cielo al tramonto, lucciole, le due zucche nei decori solo in stagione ([../stagioni.md](../stagioni.md)); mancano i recinti in costume e il cappello (W21) | P2 |
| W18 | Natale (1 nov–6 gen) | neve, lucine, tetti innevati, albero 🪙24 | ✅ cielo, fiocchi, prato innevato con l'erba che spunta, neve sui tetti e su tutto ciò che guarda in alto (bosco, sassi, recinti), ghiaccio ai bordi dei laghi, ⭐/🔔, lucine coi ghiaccioli e alberelli sugli edifici, il fiato; da comprare l'albero (W15) e il pupazzo di neve, solo 3D ([../stagioni.md](../stagioni.md)) | P2 |
| W19 | `#stagione=` per guardarle fuori stagione | sì | ✅ stessa sintassi (`stagioneAttiva`) | – |
| W20 | il fumetto «lo vorrei» / segnalino 🎃 | il fumetto è delle bestie col cappello (W21), il segnalino 🎃/🎄 è quello del baule («Decorazioni») | 🟡 il segnalino sì: 🎃/🎄 sul tasto 🏗, sulla scheda e sulle carte della festa, finché non ne hai una (`festaDaScoprire`, [../stagioni.md](../stagioni.md)); **tolto perché** il fumetto «lo vorrei» in 3D non ha chi lo dica: le bestie non si vestono (W21), tornerà coi modelli in costume | P2 |
| W21 | i costumi di Halloween da rifare (galline/capre fantasmini, alpaca grigia…) | aperto in [../../fattoria/da-fare.md](../../fattoria/da-fare.md) | – | P2 |

Le stagioni sono **un dato puro** (`dati/stagioni.js`: `stagioneDi(data)`, `addobbiStagionali`) che la 3D importa così com'è
(`dati/stagioni3d.js`); il disegno 3D è in [../stagioni.md](../stagioni.md): cielo e luci, fiocchi e fiato (un `Points` ciascuno), la neve sui materiali, addobbi a istanze, zucche e pupazzo come pezzi.
