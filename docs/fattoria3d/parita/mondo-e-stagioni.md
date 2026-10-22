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

## Decorazioni e giardino (217 contro 10)

| id | gruppo (2D) | voci 2D | 3D | pri |
|---|---|---|---|---|
| W7 | verde (alberi, siepi, arbusti, sassi, tronchi) | 27 | ❌ gli alberi sono ostacoli, non si piantano | P1 |
| W8 | fiori e vasi | 34 | 🟡 solo l'aiuola | P1 |
| W9 | acqua (fontane, pozzi, ninfee, canne, ponte, laghetto, stagno, mulino ad acqua, cantina) | 12 | 🟡 fontana, pozzo, ponte, stagno, laghetto ✳ passerella, molo, porticciolo | P2 |
| W10 | recinti, cancelli, pergole, gazebo, cartelli | 29 (16 sono i cartelli delle colture) | ❌ | P2 |
| W11 | case, forni, chioschi, lampioni, serra | 19 | ❌ (c'è la casa fissa di scena) | P2 |
| W12 | arredo (panchine, sedie, amache, tavoli, lucine) | 29 | 🟡 panchina e tavolo | P1 |
| W13 | bestiole (cucce, casette, farfalle) | 17 | ❌ | P2 |
| W14 | raccolto (balle, cassette, ceste) | 39 | ❌ | P2 |
| W15 | feste (zucche, albero di Natale) e fiera (8) | 3 + 8 | 🟡 le due zucche (🪙6, 🪙10, solo a Halloween); manca l'albero di Natale da comprare (a Natale ci sono gli alberelli effimeri accanto agli edifici) e la fiera | P1 con W17 |

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
| W18 | Natale (1 nov–6 gen) | neve, lucine, tetti innevati, albero 🪙24 | 🟡 cielo, fiocchi, chiazze di neve, ⭐/🔔, lucine e alberelli sugli edifici ([../stagioni.md](../stagioni.md)); mancano la crosta sui tetti e l'albero da comprare | P2 |
| W19 | `#stagione=` per guardarle fuori stagione | sì | ✅ stessa sintassi (`stagioneAttiva`) | – |
| W20 | il fumetto «lo vorrei» / segnalino 🎃 | sì | ❌ | P2 |
| W21 | i costumi di Halloween da rifare (galline/capre fantasmini, alpaca grigia…) | aperto in [../../fattoria/da-fare.md](../../fattoria/da-fare.md) | – | P2 |

Le stagioni sono **un dato puro** (`dati/stagioni.js`: `stagioneDi(data)`, `addobbiStagionali`) che la 3D importa così com'è
(`dati/stagioni3d.js`); il disegno 3D è in [../stagioni.md](../stagioni.md): cielo e luci, fiocchi (un solo `Points`), addobbi a istanze, zucche come pezzi.
