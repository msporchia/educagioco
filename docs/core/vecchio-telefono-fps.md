# Gli fps veri

L'ultima parte della verifica del telefono (`TAPPE_FPS` in `grafica/benchmark/veri.js`, gruppo `fps`): **a quanti fotogrammi al secondo gira
davvero il gioco**, con la fascia che il telefono ha (quella del gioco, scritta in testa al resoconto) e senza le leve della misura. Le altre
scene leggono un pixel a fine fotogramma per sapere quanto lavora la GPU, e così CPU e GPU vanno una dopo l'altra: il lavoro è giusto, gli
fps sono più bassi del vero. Qui niente lettura (`TEMPI.fps`, `vero`): si contano solo gli intervalli fra un fotogramma e l'altro, come li
vede chi gioca.

| scena | cosa | dove |
|---|---|---|
| `fps-piano` | l'eroe cammina da una stanza all'altra di un piano, senza mostri (la nebbia si apre camminando) | `veri/discese.js`, `passeggia` |
| `fps-sot-3`, `fps-sot-6` | lo scontro con 3 e 6 mostri e i colpi ogni 0,7 s, come `sot-N` | `veri/discese.js` |
| `fps-villaggio` | l'eroe gira attorno alla piazza alla velocità del gioco, con le persone del villaggio | `veri/sopra-vero.js` |
| `fps-prato` | lo scontro sul prato davanti alla tana del primo luogo, aperto come lo apre il gioco (motore/aperta.js, palco di sopra), 3 mostri e i colpi | `veri/sopra-vero.js` |
| `fps-fat-10`, `fps-fat-30` | la fattoria «tipo» del livello 10 e del 30, col degrado del gioco acceso (il gioco abbassa da sé la qualità se non regge) | `veri/fattoria.js`, `opz.degrado` |

Otto secondi di misura dopo il rodaggio, ~2 minuti e mezzo in tutto, un riferimento del calore solo (un gruppo). Fuori dallo scontro, nel mondo di
sopra non girano mostri (le scene li mettono solo sul palco); le persone sono quelle del villaggio, senza mercanti.

**Nel resoconto** una riga per scena: `ok`/`~`/`XX` (sopra 50, sopra 30, sotto 30 fps), gli fps, la parte di fotogrammi arrivati dopo più di
34 ms (sotto i 30 fps), il p95 dell'intervallo e i fermi oltre 100 ms; il js è solo la CPU (manca la GPU, e per questo queste righe non
entrano in «chi pesa di più» né in «CPU o GPU»). Nella LETTURA la riga **FPS VERI** le mette in fila: liscio, si gioca a tratti, a scatti.
Gli fps non superano la frequenza dello schermo (60 sul Note 7).

Il primo giro sul Note 7 (28/10, fascia bassa): discese e fattoria a 59 fps senza un fotogramma sotto i 30; il villaggio 17 fps e lo
scontro sul prato 15, perché il mondo di sopra non aveva ancora le semplificazioni della bassa (la sua scala si lancia per nome, `solo: ['scala-sopra']`).
Il 29/10, con le prime (il rumore in trama: `docs/sotterraneo/prestazioni-3d-bassa.md`), il villaggio 54 e il prato 48; il villaggio
senza antialias 60, quindi l'antialias è diventato una leva della bassa (`antialias`) e la scena di confronto è tolta.
Il 29/10 alle 12:19, con Lambert e il rumore a un'ottava: tutte le sette fra 55 e 60 (il villaggio 59, il prato 58); la verifica è
rimasta queste sette.

Nei test: `unita/benchmark-veri` (le scene, la riga, la lettura), `integrazione/benchmark-veri` (le sette scene girano in Chrome, `vero`, `gpu: 0`).
