# Il Sotterraneo 3D: il portale, le uscite e le ombre

Il resto del 3D sta in [grafica-3d.md](grafica-3d.md).

## Il portale è un varco in piedi

- **Un varco, non un bacino** (l'utente, 16 ottobre 2026: «sembra dell'acqua
  magica in un pentolone di minestra»). Provato un ovale di pietra con un velo
  e un chiarore per terra: dalla telecamera a 52° la base tonda e la pozza
  luminosa si leggevano come una pentola. Ora (`scena3d/portale.js`): due
  pilastri e un architrave di pietra con le rune incise che si accendono a
  onde, una soglia per terra, il velo ritto fra i pilastri (il vortice che si
  piega verso il centro e gira, l'anello di colori che corre sul bordo
  increspato), un cerchio di rune per terra davanti che pulsa, le scintille
  risucchiate nel centro e la sua luce.
- **È più alto dei muri** (`VARCO.alto` 1,9 contro 1,25): un varco ritto
  visto a 52° si accorcia, e deve leggersi come una porta. Guarda verso la
  telecamera. I colori sono quelli del portale del 2D (`COLORI_PORTALE`,
  come `scena/portale.js`).
- **La pietra prende il chiarore del velo** (un emissivo viola): con la sola
  luce dell'eroe di lato i pilastri erano neri.
- **Lo stesso modulo fa il gemello di sopra**: `creaPortale(scena, { cella,
  colori, alto, conMaschera })`; senza `conMaschera` la pietra non legge la
  maschera. `apri()` lo accende dal basso (il velo e le rune dei pilastri) e
  disegna le rune per terra in giro, `chiudi()` lo spegne; `attraversa()` è
  il lampo del passaggio (l'eroe ci entra e svanisce: `scena3d/eroe.js`).
- Gli scatti: `node strumenti/scatta-app.mjs 'sotterraneo3d=1&seme=1&stanza=al-portale&torcia=accesa' --dist --aspetta 5000`,
  e il passaggio con `--esegui` (il foglio dal motore), `--tocca
  '[data-azione="portale"]' --sequenza 8 --ogni 200`
  ([comandi.md](../core/comandi.md)).

## Uscire dal 3D

- **Quello che può buttare il 3D si fa a fotogramma finito**
  (`aFotogrammaFinito` in `scena3d/indice.js`). Il passaggio nel portale
  finisce dentro il disegno dell'eroe, e chi lo aspetta (Gioco.vue,
  `allaMappa`) butta il 3D e torna alla terra di sopra: se lo faceva lì, il
  resto del fotogramma toccava un piano che non c'era più («`piano` is null»,
  `piano.sorgenti`, sulla versione pubblicata). Ora il fotogramma finisce,
  disegna, e solo dopo chiama; e un ciclo con il 3D buttato non disegna più
  (`vivo`).
- La scala che sale del primo piano («lascio perdere») e lo svenimento
  all'ultima occasione (il cartello di fine, poi «esci») passano dai pulsanti
  di Gioco.vue, fuori dal fotogramma: buttano il 3D con `distruggi`, che ferma
  il ciclo prima di buttare il piano.

Nei test: `integrazione/sotterraneo-3d-uscite` (il portale toccato col dito,
la scala che sale, lo svenimento: ogni volta sopra, senza tela 3D e senza
errori in console). I cheat: `#stanza=al-portale`, `#stanza=al-scala-su`.

## Le ombre

- **Le ombre del cono sono VSM** (`VSMShadowMap` in `scena3d/contesto.js`).
  Con PCF three confronta una texture di profondità filtrata LINEAR, e
  Firefox lo dice in console («Depth texture comparison requests … LINEAR
  filtering … implementation-defined»). VSM sfoca una texture di colore e non
  confronta: niente avviso, e agli scatti le ombre sono le stesse (provato
  affiancando PCF e VSM nella sala con la torcia).
- `shadow.radius` con VSM è il raggio della sfocatura: con la torcia accesa
  scende (ombre più nette, [grafica-3d.md](grafica-3d.md#la-torcia)).
