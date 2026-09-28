# L'architettura

Com'è fatto il prodotto, cosa sta dove in `src/`, e le poche regole che
valgono per tutto il codice.

## Il prodotto

- **Un unico file HTML**, `dist/index.html`, apribile con doppio click,
  offline, senza server. Lo produce `npm run build` (Vite +
  `vite-plugin-singlefile`).
- **Niente dipendenze a runtime oltre a Vue.** Suoni sintetizzati
  (`src/audio.js`), icone emoji, nessun file esterno: se no il build non
  resta un file solo.
- **`index.html` in radice è il template di Vite**, non un file giocabile.
  La copia da doppio click (`giochi.html`) è ignorata da git.
- **Il numero di versione lo scrive il build** (`vite.config.js`,
  `__VERSIONE__`, e `dist/versione.json` per il sito). Un `+` in coda al
  commit (`922257a+`) vuol dire build fatto con modifiche non committate:
  non è ricostruibile da git. Vedi [pubblicare.md](pubblicare.md).
- **I giochi sono verticali** (il manifest chiede `portrait`); il resto
  dell'interfaccia comune sta in [interfaccia.md](interfaccia.md).

## Cosa sta dove

| cartella | cosa c'è | dove si legge |
|---|---|---|
| `src/store/` | persistenza e stato: `storage.js` (archivio), `profile.js` (profilo e roster), `srs.js` (motore di ripasso), `progressi.js` (livelli, padronanza, traguardi), `sessioni.js`, `pin.js`, `cestino.js`, `posta.js`, `giudizi.js` | [archivio.md](archivio.md), [progressi.md](progressi.md), [`../apprendimento/`](../apprendimento/README.md) |
| `src/data/` | dati puri: vocaboli (496 parole, 55 verbi e 153 frasi inglesi; 496, 55 e 160 spagnole), operazioni, campagne, negozio, traguardi, saperi, partenze e portata; `livelli/` sono i livelli del Generale | la cartella del gioco; `src/data/livelli/GUIDA.md` |
| `src/giochi/` | **i giochi nuovi, e la convenzione da seguire**: `dati/`, `motore/`, `scena/`, `viste/`, `Gioco.vue`, `gioco.js`; registro in `indice.js` e `schermate.js` | [convenzione-giochi.md](convenzione-giochi.md) |
| `src/views/` | i giochi vecchi, fatti in quattro modi diversi. **Non sono un modello**: sono il motivo per cui esiste `src/giochi/` | — |
| `src/motore/` | regole senza schermo: `battaglia.js` (il tower defense, gira uguale nel gioco e in Node — è l'unico motivo per cui il bilanciamento si misura invece di provarlo a occhio), `generale/`, `passi.js` | [`../castello/`](../castello/README.md), [`../generale/`](../generale/README.md) |
| `src/grafica/` | canvas, telecamera, pittori, scheletri, atlanti e tessere | [grafica.md](grafica.md) |
| `src/quiz/` | i moduli di quiz, staccati dai giochi | [`../apprendimento/`](../apprendimento/README.md) |
| `src/guide/` | le guide dentro l'app, i nastri, le novità | [`../genitori/`](../genitori/README.md) |
| `src/components/` | pezzi comuni: `Barra.vue`, `Benvenuto.vue`, `eta/` (la manopola dell'età), `TempoDiGioco.vue`, `ColumnOp.vue` | [interfaccia.md](interfaccia.md), [`../genitori/`](../genitori/README.md) |
| `src/aggiornamento.js` | «c'è una versione nuova» | [aggiornamento.md](aggiornamento.md) |
| `src/incidenti.js` | la rete di sicurezza degli errori | [guasti.md](guasti.md) |
| `src/voce.js` | l'unico punto che riproduce la pronuncia incisa | [`../lingue/`](../lingue/README.md) |
| `strumenti/` | tutto quello che non finisce nel build | [comandi.md](comandi.md) |
| `test/` | unità e integrazione | [test.md](test.md) |

## Regole per tutto il codice

- **Il codice è in italiano**: nomi, funzioni, commenti (`colonnaAdd`,
  `guasti`, `forza`, `ripassoFraGiorni`).
- **I fine riga sono LF**, fermati da `.gitattributes` (`* text=auto
  eol=lf`). Un file che cambia fine riga fa un diff di mille righe per
  sette vere, e il `git log -p` di quel file smette di raccontare. Chi
  scrive file da script attento: Python con *universal newlines* riscrive
  LF senza chiederlo, e un `git diff` letto con `text=True` perde i `\r` e
  produce un patch che `git apply` rifiuta senza dire perché.
- **Chi gioca non disegna.** Una view costruisce la lista delle cose in
  scena — `{ che: 'torre', x, y, tipo, lv }` — e la passa a
  `tela.disegna()`. Una figura nuova è una riga in `PITTORI`, mai un
  `ctx.arc` dentro il gioco. Al contrario, in `grafica/` non entrano
  energia e prezzi: solo fatti già decisi (`potenziabile: true`).
- **I giochi non toccano i contatori a mano**: `segna()` e `segnaBest()`
  di `store/profile.js` (vedi [archivio.md](archivio.md)).
- **I nomi dei bambini non stanno nel codice**, e **gli id dei contenuti
  non si rinominano**: vedi [archivio.md](archivio.md).
