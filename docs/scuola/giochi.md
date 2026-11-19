# I giochi veri a scuola

Un gioco di casa a scuola è **lo stesso gioco, limitato**: una prop facoltativa `limite` e un evento `risposta`, e senza la
prop casa resta identica (il primo sono gli Asteroidi: [../asteroidi/scuola.md](../asteroidi/scuola.md)). Dalla parte della
scuola ogni gioco ha **una cartella sua**, `src/scuola/giochi/<id>/`, così più giochi si aggiungono insieme senza toccare
gli stessi file. Gli elenchi comuni (`elenco.js`, `viste.js`, `parametri.js`, `sostituti/elenco.js`) hanno già una riga
per gioco.

## I pezzi di un gioco

| File | Cosa |
|---|---|
| `scheda.js` | `{ id, nome, nei, spiega, tred, accetta?, tipo? }`, puro: lo leggono il catalogo (`esercizi.js`), le due pagine e i test. `nei` completa una frase («… negli Asteroidi»), `tred` vuol dire 3D (senza WebGL 2 non parte); `daAnno` (facoltativo) è da che classe le lezioni pronte lo propongono. `pronto: false` lo tiene nascosto alla maestra finché non è fatto |
| `sostituti.js` | `{ sostituti: { originale: sostituto }, ammessi: [percorsi] }`: i moduli di casa che a scuola si rimpiazzano per questo gioco (percorsi dalla radice) e i pezzi del gioco di casa che possono entrare nel pacchetto dei bambini (una cartella finisce con `/`). La guardia vieta ogni altro gioco |
| `Vista.vue` | la vista per la pagina dei bambini, caricata a richiesta: props `esercizio` e `alunno` (`{ id, nome }`), il profilo in memoria con `bambinoInMemoria` (`bambini/profilo.js`); emette `risposta` e `guasto` |
| `Parametri.vue` | solo per un gioco con un contenuto suo: l'editor del suo esercizio nella pagina della maestra (`v-model`) |

## Cosa può chiedere la maestra

- **Gli esercizi del catalogo** (tabelline, moduli, più voci con intensità): `accetta(e)` della scheda dice quali, per
  un esercizio semplice (un insieme va se vanno tutte le parti). Senza WebGL o se il gioco non parte si torna alle schede.
- **Un contenuto del gioco** (i gradini di Passo passo, i capitoli del Robot): la scheda ha
  `tipo: { id, materia, voce: { nome, icona, spiega, base }, valido(e), descrivi(e) }`. Il catalogo mostra la voce nella
  sua materia (`programmazione` per i giochi di programmare), l'esercizio `{ tipo: <id>, … }` si fa **solo** in quel
  gioco (`giocoDi`), non entra in un insieme e non ha le schede come ripiego: se il gioco non parte il bambino vede
  «chiama la maestra».

## La risposta

Ogni `risposta` della vista è già raccontata: `{ chiave, giusta, ms, ultima, fatto, data, attesa }`, i tre testi ≤ 40
caratteri (`racconta` di `esercizi.js` per una `Domanda.vue`, se no il gioco li scrive). `ultima: false` è un tentativo
sbagliato con la domanda ancora aperta (un sasso sbagliato, un ▶ che non arriva): la maestra lo vede fra le sbagliate e il
blocco non lo conta. Le soglie dei blocchi contano le domande chiuse e le giuste: in un gioco di programmare una
«giusta» è un livello vinto.

## A che punto è ogni gioco

| Gioco | Cosa sceglie la maestra | Una risposta è | Documento |
|---|---|---|---|
| Asteroidi | tabelline col risultato (anche a più parti) | ogni colpo; la domanda si chiude col giusto | [../asteroidi/scuola.md](../asteroidi/scuola.md) |
| Survivors | qualunque esercizio del catalogo (anche a più parti) | ogni carta pagata con una domanda | [../survivors/scuola.md](../survivors/scuola.md) |
| Passo passo | `{ tipo: 'passo', protagonista, gradini }` | ogni ▶; un livello vinto chiude | [../passo-passo/scuola.md](../passo-passo/scuola.md) |
| Il Robot | `{ tipo: 'robot', capitoli }` | ogni esecuzione; un livello vinto chiude | [../costruttore/scuola.md](../costruttore/scuola.md) |
| English (senza audio) | `{ tipo: 'inglese', isola, tappe }` | ogni domanda; ognuna chiude | [../lingue/scuola.md](../lingue/scuola.md) |
| Le Pozioni | `{ tipo: 'pozioni', famiglie, gradini }` | ogni dose; un ingrediente al segno chiude, un trabocco è un tentativo | [../pozioni/scuola.md](../pozioni/scuola.md) |
| La cucina (svago) | `{ tipo: 'cucina', da, a }` | ogni resto contato dal bambino (dal livello 7) | [../bancarella/scuola.md](../bancarella/scuola.md) |
| Il castello (svago) | `{ tipo: 'castello', tappa }` | ogni operazione in colonna; ognuna chiude | [../castello/scuola.md](../castello/scuola.md) |
| Il sotterraneo | qualunque esercizio del catalogo tranne le prime lettere e le sillabe; dalla terza | ogni domanda (porta, forziere, fonte, colpo); ognuna chiude | [../sotterraneo/scuola.md](../sotterraneo/scuola.md) |


## Il peso

Tutti i giochi stanno nel file dei bambini (le viste a richiesta, nel file unico, sono in linea comunque). **Il peso non è
un problema** (scelta dell'utente): niente sostituti per alleggerire, e il tetto di `vite.scuola.config.js` resta solo
contro uno sbaglio grosso.

Nei test: `unita/scuola-pacchetto` (la guardia legge `ammessi` di ogni gioco), `unita/scuola-sostituti` (anche i sostituti
dei giochi), e il test di unità di ogni gioco sul suo limite.
