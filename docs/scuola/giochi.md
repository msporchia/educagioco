# I giochi veri a scuola

Un gioco di casa a scuola è **lo stesso gioco, limitato**: una prop facoltativa `limite` e un evento `risposta`, e senza la
prop casa resta identica (il primo sono gli Asteroidi: [../asteroidi/scuola.md](../asteroidi/scuola.md)). Dalla parte della
scuola ogni gioco ha **una cartella sua**, `src/scuola/giochi/<id>/`, così più giochi si aggiungono insieme senza toccare
gli stessi file. Gli elenchi comuni (`elenco.js`, `viste.js`, `parametri.js`, `sostituti/elenco.js`) hanno già una riga
per gioco.

## I pezzi di un gioco

| File | Cosa |
|---|---|
| `scheda.js` | `{ id, nome, nei, spiega, tred, accetta?, tipo? }`, puro: lo leggono il catalogo (`esercizi.js`), le due pagine e i test. `nei` completa una frase («… negli Asteroidi»), `tred` vuol dire 3D (senza WebGL 2 non parte). `pronto: false` lo tiene nascosto alla maestra finché non è fatto |
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

## Il peso

Tutti i giochi stanno nel file dei bambini (le viste a richiesta, nel file unico, sono in linea comunque). Il tetto di
`vite.scuola.config.js` è per pagina; quando i giochi pesanti (English, il castello, il sotterraneo) arrivano, il sito
online si divide in un pezzo per gioco e la chiavetta resta un file solo: [architettura.md](architettura.md).

Nei test: `unita/scuola-pacchetto` (la guardia legge `ammessi` di ogni gioco), `unita/scuola-sostituti` (anche i sostituti
dei giochi), e il test di unità di ogni gioco sul suo limite.
