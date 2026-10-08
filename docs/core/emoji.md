# Le emoji

Il gioco disegna le emoji con un suo font, non con quello del telefono.

## Perché

Ogni dispositivo ha le sue emoji (Apple, Google, Samsung, Microsoft), e lo
stesso gioco cambia faccia da un telefono all'altro: la bambina ha detto
«ma Leonardo ha i disegni più belli». Non ci si basa mai sulle icone del
telefono. Il set è **Twemoji** (il disegno di Twitter/X), nel font a colori
**Twemoji Mozilla** v0.7.0 (COLR, Emoji 14.0): stesse emoji su ogni
dispositivo, anche offline, dentro il file unico.

Non entra tutto (1,4 MB): entrano le sole emoji che `src/` usa, tagliate da
`npm run emoji`, circa 200 KB di woff2, ~270 KB in più nel `dist/index.html`.

## Come è fatto

| file | cos'è |
|---|---|
| `strumenti/emoji/Twemoji.Mozilla.ttf` | il font intero, la sorgente. Provenienza, versione e licenza: `PROVENIENZA.txt` accanto |
| `strumenti/emoji.mjs` (`npm run emoji`) | cerca le emoji in `src/`, taglia, controlla, scrive i tre file qui sotto |
| `strumenti/emoji/taglia.py` | il taglio con fontTools, più i due ritocchi di sotto |
| `strumenti/emoji/lib.mjs` | quello che serve sia allo strumento sia al test: trovare le emoji, leggere un font |
| `src/emoji/emoji.woff2`, `emoji.css` | **generati**: il sottoinsieme e il suo `@font-face` (famiglia `Emoji Gioco`, con l'`unicode-range` delle sole emoji usate). `main.js` importa il CSS, e Vite mette il font nel file come `data:` |
| `strumenti/emoji/elenco.json` | **generato**: cosa contiene, con gli hash. Lo legge il test |

`Emoji Gioco` è il **primo** di ogni `font-family`, di ogni `font:` e di ogni
`ctx.font` (il testo normale non cambia: l'`unicode-range` lo limita alle
emoji). Il test di unità fallisce su una pila che non lo ha.

`main.js` monta l'app solo quando il font è decodificato (`document.fonts.load`,
al massimo un secondo e mezzo): una tela che disegna prima scriverebbe le emoji
col font del telefono e, se è ferma, non le ridisegna.

## Quando si rilancia

**Un'emoji nuova in `src/` vuole `npm run emoji`.** Se ci si scorda, il test
`unita/emoji` fallisce e dice quale manca e dove. Il comando vuole Python con
`fonttools` e `brotli`: se il `python3` di sistema non li ha crea da solo
`.venv-emoji/` (una volta sola, serve la rete; `PYTHON=…` per forzarne un altro).

## Le trappole

- **Chrome scarta il font per ogni `❄️` (carattere + FE0F)** se la cmap non
  dichiara la coppia: Twemoji Mozilla non ha la cmap 14, e senza quasi tutte le
  emoji da testo (⚠️ 🗺️ ✂️ ❤️) cadevano sul telefono. `taglia.py` la aggiunge. Ma
  con la cmap 14 HarfBuzz ingoia il FE0F prima delle legature, e le famiglie con
  FE0F dentro (🧑‍✈️, 🏴‍☠️) si spezzavano: `taglia.py` aggiunge anche la gemella
  senza FE0F di ogni legatura. Provato: con solo uno dei due ritocchi non va.
- **Un carattere non è emoji e testo insieme.** `▶` nudo è un simbolo da testo
  (di sistema), `▶️` con FE0F un'emoji, e il font ha un glifo solo: se `src/` usa
  entrambe le forme lo strumento si ferma e dice quale. Si sceglie: tutti con
  FE0F o tutti senza. Sopra U+1F000 (🗑 👁 🛡) tutto è emoji anche nudo.
  Oggi restano testo, disegnati dal sistema: `▶ ⏸ ⏹ ✔ ◀ ♥ ⚙︎` e le frecce `↖↗↘↙⤵`.
- **Niente tasti (`1️⃣`).** La cifra dovrebbe stare nell'`unicode-range`, e il
  font si prenderebbe ogni cifra del gioco: si scrive la cifra nuda (il test
  lo vieta).
- **Twemoji è fermo a Emoji 14.** Le emoji del 2022 in poi (🪮 🪽 🩶 🫨 🪿…) non ci
  sono: lo strumento si ferma e le elenca, se ne sceglie un'altra. Aggiornare
  il font = sostituire il `.ttf`, aggiornare `PROVENIENZA.txt`, rilanciare.
- **Un'emoji di Twemoji è larga un em**, quella di Noto un quarto di più: le
  cose tarate sulla larghezza dell'emoji vecchia (chip, bottoni) si sono
  ristrette un po'. È anche come il test sa chi ha disegnato cosa
  (`integrazione/emoji` misura la larghezza di tutte).
- **Un'emoji dentro un commento non conta**: lo scanner toglie i commenti.

## La licenza

La grafica è di Twemoji (Copyright Twitter, Inc. e collaboratori), **CC-BY
4.0**: si usa e si ridistribuisce citando l'autore, e dicendo se si è
modificata (qui il font è tagliato e ha due tabelle in più). La riga sta nel
`README.md` in radice, sezione «Crediti»; il gioco non ha una schermata dei
crediti. Il codice che costruisce il font è di Mozilla (Apache 2.0).

## Nei test

`unita/emoji` (senza browser): ogni emoji di `src/` è nell'elenco e nel font,
il CSS e gli hash sono quelli giusti, nessun carattere è emoji e testo insieme,
ogni pila lo ha per primo. `integrazione/emoji` (Chrome): `document.fonts.check`,
ogni emoji usata è larga un em, una tela le disegna col nostro font.
