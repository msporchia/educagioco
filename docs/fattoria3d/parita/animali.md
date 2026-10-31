# Parità: gli animali

Legenda in [README.md](README.md). 2D: [../../fattoria/animali.md](../../fattoria/animali.md) (bestie di casa),
[macchine.md](../../fattoria/macchine.md) (recinti). 3D: [../animali.md](../animali.md), [../compagni.md](../compagni.md),
[../regole.md](../regole.md) «Le pecore».

## I recinti del cortile (11 nella 2D, 10 nella 3D: la peschiera è la pesca)

Nella 2D un recinto è una macchina (prende un mangime, dà un prodotto, ha la fila). Nella 3D è un pezzo con bestie singole da
comprare dentro l'edificio (`CORTILE` in `dati/animali.js`).

| id | recinto | 2D (🪙 / liv · prende → dà · minuti) | 3D | pri |
|---|---|---|---|---|
| A1a | pollaio | 130/9 · 2 becchime → uova · 8 | ✅ 55/5, 1–6 galline, 25 s | – |
| A1b | stalla | 220/18 · 2 foraggio → latte · 10 | ✅ 90/9, 1–4 mucche, 40 s | – |
| A1c | ovile | 190/14 · 1 foraggio → lana · 8 | 🟡 «recinto» 45/4: 1–4 pecore, agnelli e nascite (✳), lana in 25 s | – |
| A1d | stagno delle anatre | 240/24 · 1 verdure lesse → uova d'anatra · 6 | ✅ `anatre` 120/20 (provvisorio), 1–6 anatre, 20 s, uova di sempre | – |
| A1e | porcile | 260/28 · 2 pastone → tartufi · 20 | ✅ `porcile` 130/21 (provvisorio), 1–4 maiali, 50 s, **pancetta** (id `pancetta`, merce nuova) | **Deviazione**: tolto il tartufo perché a schermo sembrava una cacca, come Hay Day il maiale fa la pancetta (utente, 22/10/2026); id rinominato, scorte `tartufi` perse; tre ricette solo 3D la usano ([../cortile-e-pentolone.md](../cortile-e-pentolone.md)) |
| A1f | capre | 280/40 · 1 verdura fresca → latte di capra · 12 | ✅ `capre` 140/22 (provvisorio), 1–4 capre, 45 s, latte di sempre | – |
| A1g | conigliera | 95/7 · 2 foraggio → lana d'angora · 14 | ✅ `conigliera` 95/7, 1–6 conigli, 14 min, la lana dell'ovile (G5) | – |
| A1h | alpaca | 330/47 · 1 foraggio → lana d'alpaca · 5 | ✅ `alpaca` 330/47, 1–4 alpaca, 5 min, la lana dell'ovile (G5) | – |
| A1i | asini | 355/52 · 2 foraggio → concime · 10 | ✅ `asini` 355/52, 1–4 asini, 10 min, concime (merce nuova, G5) | – |
| A1j | arnie | 300/45 · 2 fiori → miele · 12 | ✅ `arnie` 300/45, 1–4 arnie, 12 min, miele; i fiori li fa il fienile (G5) | – |
| A1k | peschiera | 360/57 · 2 mangime → pesce · 15 | 🟡 **tolta, voluta**: la pesca (molo, porticciolo) ne prende il posto allo stesso livello 57 e con lo stesso ritmo (un pesce ogni 15 minuti per banco), il pesce c'è e alimenta friggitoria e sushi bar; un recinto di pesci col mangime del mulino sarebbe un secondo modo di avere lo stesso pesce senza il lago ([../cortile-2.md](../cortile-2.md) «La peschiera») | – (D10) |

Conigliera, alpaca, asini e arnie (G5, [../cortile-2.md](../cortile-2.md)) hanno livelli, prezzi e tempi della 2D (`dati/cortile2.js`). Anatre, maiali e capre (G4, [../cortile-e-pentolone.md](../cortile-e-pentolone.md)) sono le bocche del pentolone (C18): la catena ha i suoi cinque mangimi e la
zucca e la patata un'uscita. Livelli, prezzi e tempi sono provvisori (D2, D9) e stanno in `dati/cortile.js`. Ogni recinto nuovo vuole: un pezzo in `dati/catalogo.js`, la voce in `dati/animali.js`
(o un tipo nuovo nel motore), un modello e tre stadi leggibili ([../animali.md](../animali.md) «I tre stadi»), un test.

| id | cosa | stato | pri |
|---|---|---|---|
| A2 | gli animali dei recinti camminano | 🟡 la 2D no (disegno che cambia stato); la 3D sì, e i tre stadi si leggono (fame, al lavoro, pronta) | – |
| A3 | stadi visti dalla camera di gioco / su telefono | ❌ non visti (solo catalogo 3D e test) | P1 [../da-fare.md](../da-fare.md) |

## Le bestie di casa (7 nella 2D, 4 comprabili nella 3D + i compagni gratis)

| id | bestia | 2D (🪙 / liv) | 3D | pri |
|---|---|---|---|---|
| A4a | bobtail | 90/3 | 🟡 **tolto perché in 3D c'è già Watson, gratis, dal livello 1** (chi lo aveva lo ritrova) | – |
| A4b | beagle | 90/15 | ✅ `beagle` 90/15, premio 6 ([../bestie-di-casa.md](../bestie-di-casa.md)) | – |
| A4c | gatto bianco e nero | 75/10 | 🟡 **tolto perché in 3D c'è già Sherlock, gratis, livello 2** | – |
| A4d | gatto nero | 75/19 | 🟡 **tolto perché in 3D c'è già Pepe, gratis** (livello 19, quello della 2D) | – |
| A4e | gatto rosso (`gatto-giallo`) | 75/35 | ✅ `gatto_rosso` 75/35, premio 5, mantello `rosso` (Irene è una calico, un'altra bestia) | – |
| A4f | coniglio | 85/12 | ✅ `coniglio` 85/12, premio 6 | – |
| A4g | pappagallo | 120/49 | ✅ `pappagallo` 120/49, premio 8 | – |

La 2D compra le bestie (🪙635 in tutto, il «money pit» piccolo) e le **cura**; la 3D ha le stesse quattro che non regala (🪙370, stessi prezzi e livelli) e le cura allo stesso modo; **Watson, Sherlock, Irene e Pepe restano gratis ma si curano anche loro** (bisogni, nome, premio del bobtail e dei gatti della 2D; si tiene premuto su di loro: [../bestie-di-casa.md](../bestie-di-casa.md)). ✳ i compagni 3D (richiamo, feste di Watson, carezze, incontro cane-gatto) sono più ricchi, ma non spendono monete e non si
salvano (`VERSIONE_STATO` intatto, ripartono davanti alla casa).

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| A5 | **i bisogni** `dati/bisogni.js` | pancia (cala in 14 ore), pelo (30), gioco (20); `FONDO` 0,15: non stanno male, non muoiono; soglie `BENE` 0,55 / `BENISSIMO` 0,78 | ✅ gli stessi dati, riusati; mai sotto `FONDO` (test: dopo 400 ore) | – |
| A6 | la ciotola | 8 cibi comprati (osso 5, bistecca 14, pesce 5, paté 14, semini 5, frutta 14, carota 5, insalata 14) + 6 del granaio (mangime, uova, pastone, fieno, formaggio, minestrone); il cibo sbagliato è rifiutato | ✅ gli stessi 14; il granaio è la scorta 3D (il fieno è l'erba medica); il rifiuto dice il perché prima di pagare | – |
| A7 | le coccole | spazzola e gioca 🪙1; copertina (lana), festa (torta), bagnetto (sapone) | ✅ le stesse; in più la 🤚 carezza, gratis sempre | – |
| A8 | il premio per averla rimessa a posto | ⭐ un quindicesimo del prezzo (cane 6, gatto 5, coniglio 6, pappagallo 8), una volta per ciclo (~3 ore) | ✅ `premiaSeStaBene` della 2D, esperienza mai monete | – |
| A9 | battesimo (dare un nome) | `Battesimo.vue`, `nomiPer` | ✅ `Battesimo.vue`, gli stessi nomi da toccare; i compagni gratis hanno il nome fisso | – |
| A10 | spostare la bestia | gratis, si salva dov'è | ✅ «📍 Sposta»: gratis, la cella è la casa della bestia e si salva | – |
| A11 | camminata a celle | `motore/camminata.js` | ✅ sulla stessa griglia del contadino | – |
| A12 | la veterinaria al banco | cliente che chiede i mangimi | ✅ C32: chiede mangime, pappa di mais, becchime, foraggio, verdure lesse, pastone e verdura fresca; solo lei | – |

Il perché dei bisogni, da non perdere: ogni bestia deve costare qualcosa ogni giorno, se no conta solo il primo gesto; un cibo
sbagliato dato per gioco insegna il sbagliato; una coccola gratis c'è sempre (`guastiDeiBisogni`). La 3D li ha adottati (G6):
**cibi e coccole sono dati puri** (`dati/bisogni.js`, `dati/animali.js`) e si riusano senza copia.

## Vestire gli animali

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| A13 | addobbi | 12: fiore 6, cappellino 12, cilindro 18, corona 24, occhialini 10, occhiali 16, cappello da strega 8 (solo Halloween); sospesi (fiocco, sciarpa, campanella, mantellina, zainetto) | ✅ tutti e dodici in vendita (in 3D sono modelli, niente sospesi), stessi prezzi, anche sui compagni ([../addobbi.md](../addobbi.md)) | – |
| A14 | punti di aggancio (testa, muso, collo, schiena) | dal foglietto di ogni sprite | ✅ `AGGANCI` per forma sui perni testa e corpo (`scena3d/modelli-addobbi.js`) | – |
| A15 | guardaroba del contadino | ❌ | ✳ gratuito (cappello, maglia, pantalone, stivali, collo, capelli, pelle), speciali dai livelli 6–12 | tieni (D10) |

