# Il Sotterraneo 3D: il portale, le uscite e le ombre

Il resto del 3D sta in [grafica-3d.md](grafica-3d.md).

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
