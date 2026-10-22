# 🚜 La fattoria 3D

La fattoria disegnata in 3D (three.js), **gioco in prova**: il contadino cammina fino alle cose e le fa, il terreno si compra
a lotti (senza confini) dentro un recinto basso, i pezzi si trascinano dalla barra alla mappa. Ha **risorse sue** (raccolti, prodotti,
lana) e uno stato suo, e non tocca quelli della fattoria di sempre; le monete sono quelle vere. Il codice è in
`src/giochi/fattoria3d/`.

- [presentazione.md](presentazione.md) — per chi arriva da fuori: cosa si fa, cosa lo distingue dalla fattoria di sempre, note per i genitori
- [regole.md](regole.md) — i principi: risorse separate, niente si vende, niente marcisce, quanto costa muovere, le pecore, le macchine
- [livelli.md](livelli.md) — l'esperienza (la spesa), le soglie a formula e la loro misura (`npm run tara:fattoria3d`), cosa arriva a ogni livello, il gating e le fattorie già salvate
- [merci-e-ricette.md](merci-e-ricette.md) — le merci e le ricette sono quelle della 2D: la faccia di ogni merce (`Faccia.vue`), le macchine e le ricette giuste, gli scarti, i vecchi salvataggi
- [edifici-liberi.md](edifici-liberi.md) — gli edifici sono pezzi liberi: si costruiscono dal menu e si mettono dove si vuole, uno per tipo; il «!» per quelli aperti dal livello e non costruiti; la migrazione dei vecchi posti fissi
- [mangime-e-catena.md](mangime-e-catena.md) — cosa mangiano le bestie (il mangime del fienile, come in 2D), la catena grano → becchime → uova e carote/erba → foraggio → latte e lana, l'audit di ogni ricetta contro la 2D e le deviazioni dichiarate
- [cortile-e-pentolone.md](cortile-e-pentolone.md) — il pentolone (le 4 ricette del mangime) e le bestie che mangiano da lui: anatre, maiali, capre; i numeri provvisori in `dati/cortile.js`
- [animali.md](animali.md) — pollaio e stalla: galline e mucche, uova e latte, i posti coi livelli, il caseificio e le ricette nuove
- [ordini.md](ordini.md) — il banco della bancarella: chi chiede raccolti e prodotti, il premio in esperienza (mai monete), rifiutare, lo stato v3
- [mongolfiera.md](mongolfiera.md) — la nave: tre file di casse da riempire un po' alla volta, i bonus, la sorpresa della fiera, il viaggio e il ritorno, il segnaposto di prima che si chiude
- [vicini.md](vicini.md) — il trattore e i villaggi dei vicini: la fattoria visitabile come dato (snapshot), la cassa, il mercato che compra e che vende, la visita di sola lettura, e come domani entrerà quella di un amico
- [terreno.md](terreno.md) — i lotti da comprare, il recinto, gli alberi che si abbattono, le strade a pennello, la telecamera
- [mondo-infinito.md](mondo-infinito.md) — il mondo senza confini: lotti `a_b` qualunque, generazione per lotto, gli id salvati, la finestra della scena, il prezzo che si auto-limita
- [laghi.md](laghi.md) — i laghetti (biomi), gli stagni e i laghetti che costruisce il bambino, l'acqua, i ponti, il disegno, e dove la pesca si aggancia
- [geografia-e-pesca.md](geografia-e-pesca.md) — il mare a ovest e i laghi grandi a est (forme continue fra lotti), i salvataggi di prima che tengono i loro lotti, il molo, il porticciolo, i banchi di pesce, i pesciolini a istanze, il pesce, friggitoria e sushi bar, i livelli 17 e 18
- [compagni.md](compagni.md) — Watson e i gatti che girano per la fattoria, il contadino nuovo: quando arrivano, come sono fatti, come si muovono
- [guardaroba.md](guardaroba.md) — cambiare abito al contadino o alla contadina: il genere dal profilo, i capi e gli sblocchi, il salvataggio, come si aggiunge un pezzo
- [rotazione.md](rotazione.md) — ruotare i pezzi e gli edifici: `rot` 0–3 nello stato, l'ingombro e il davanti che seguono, il tasto ↻ col secondo dito
- [stagioni.md](stagioni.md) — Halloween e Natale come nella 2D (stesse finestre, `#stagione=`): cielo e luci, fiocchi, chiazze, addobbi sugli edifici, le zucche da comprare; il peso
- [guida.md](guida.md) — il `?`, il primo giro (la riga e l'anello), «E adesso?» e il consiglio col tasto sotto un «non si può»
- [scena.md](scena.md) — il disegno: i moduli di `scena3d/`, il dito, costruire trascinando, le opzioni di qualità e il peso
- [file.md](file.md) — dove sta cosa in `src/giochi/fattoria3d/`, e i bersagli dei test
- [parita/](parita/README.md) — **cosa manca per sostituire la fattoria 2D**: criteri, tabelle di parità per area (colture e catena, animali, commercio, livelli ed economia, mondo e stagioni, interfaccia e guida, tecnica e salvataggi), le decisioni per l'utente e il piano a giri
- [da-fare.md](da-fare.md) — le voci aperte tecniche

Vedi anche: [`../fattoria/README.md`](../fattoria/README.md) (la fattoria di sempre, in 2D, che resta com'è),
[`../apprendimento/calibrazione.md`](../apprendimento/calibrazione.md) (quanto vale una moneta),
[`../core/convenzione-giochi.md`](../core/convenzione-giochi.md), [`../genitori/interruttori.md`](../genitori/interruttori.md).
