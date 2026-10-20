# 🚜 La fattoria 3D

La fattoria disegnata in 3D (three.js), **gioco in prova**: l'eroe cammina fino alle cose e le fa, il terreno si compra
a lotti dentro un recinto basso, i pezzi si trascinano dalla barra alla mappa. Ha **risorse sue** (raccolti, prodotti,
lana) e uno stato suo, e non tocca quelli della fattoria di sempre; le monete sono quelle vere. Il codice è in
`src/giochi/fattoria3d/`.

- [presentazione.md](presentazione.md) — per chi arriva da fuori: cosa si fa, cosa lo distingue dalla fattoria di sempre, note per i genitori
- [regole.md](regole.md) — i principi: risorse separate, niente si vende, niente marcisce, quanto costa muovere, le pecore, la pasticceria, la mongolfiera
- [livelli.md](livelli.md) — l'esperienza (la spesa), le soglie a formula e la loro misura (`npm run tara:fattoria3d`), cosa arriva a ogni livello, il gating e le fattorie già salvate
- [animali.md](animali.md) — pollaio e stalla: galline e mucche, uova e latte, i posti coi livelli, il caseificio e le ricette nuove
- [ordini.md](ordini.md) — il banco della bancarella: chi chiede raccolti e prodotti, il premio in esperienza (mai monete), rifiutare, lo stato v3
- [vicini.md](vicini.md) — il trattore e i villaggi dei vicini: la fattoria visitabile come dato (snapshot), la cassa, il mercato che compra e che vende, la visita di sola lettura, e come domani entrerà quella di un amico
- [terreno.md](terreno.md) — i lotti da comprare, il recinto, gli alberi che si abbattono, le strade a pennello, la telecamera
- [compagni.md](compagni.md) — Watson e i gatti che girano per la fattoria, il contadino nuovo: quando arrivano, come sono fatti, come si muovono
- [scena.md](scena.md) — il disegno: i moduli di `scena3d/`, il dito, costruire trascinando, le opzioni di qualità e il peso
- [file.md](file.md) — dove sta cosa in `src/giochi/fattoria3d/`, e i bersagli dei test
- [da-fare.md](da-fare.md) — le voci aperte

Vedi anche: [`../fattoria/README.md`](../fattoria/README.md) (la fattoria di sempre, in 2D, che resta com'è),
[`../apprendimento/calibrazione.md`](../apprendimento/calibrazione.md) (quanto vale una moneta),
[`../core/convenzione-giochi.md`](../core/convenzione-giochi.md), [`../genitori/interruttori.md`](../genitori/interruttori.md).
