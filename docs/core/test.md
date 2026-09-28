# Le prove

Quando si lanciano le prove, come sono divise e le regole per scriverne
una. Il dettaglio del lanciatore e degli attrezzi sta in `test/README.md`
(e in testa a `test/esegui.mjs` e `test/aiuto/livello.mjs`): qui non si
ripete.

## La cadenza

| quando | cosa | costa |
|---|---|---|
| mentre si scrive | `npm run test:svelto` | ~4 s |
| a ogni commit | `npm test` (= `npm run test:unita`), niente browser né build | ~25 s |
| toccata una schermata | `node test/esegui.mjs <nome>`, un file solo | secondi |
| prima del push | `npm run test:tutto` (o `test:browser`) | ~1,5 min |

- **Le unità girano a ogni commit**: costano secondi, non c'è motivo di
  risparmiarle.
- **Il browser gira prima del push, non prima di ogni commit.** Un minuto
  e mezzo per ogni commit di un pomeriggio è un quarto d'ora che non
  compra niente: sui telefoni finisce la **punta**, non i passaggi. È la
  regola dei commit a blocchi applicata alle prove — un commit può non
  stare in piedi da solo, la coerenza si verifica dove si pubblica.
- **Un agente lancia `node test/esegui.mjs --niente-build`** (con un filtro
  per nome quando serve): la build la fa chi coordina.
- **La CI lancia solo `npm run test:unita`** prima di costruire e
  pubblicare (Chrome non lo scarica): un guasto che vive solo in
  `test/integrazione/` lo trova chi lo lancia a mano. Motivo in più per
  chiederlo quando si tocca lo schermo.
- Il filtro per nome prende sia il gruppo esatto sia i file che *contengono*
  il nome, nelle due cartelle: `node test/esegui.mjs pozioni` gira
  `unita/pozioni` **e** `integrazione/pozioni` (ci sono una ventina di
  nomi in comune), quindi apre Chrome anche se si voleva provare solo i
  dati.

## Le tre cartelle

Un file per argomento; il lanciatore raccoglie da solo ogni `*.test.mjs`,
anche nelle sottocartelle. Un test nuovo non si rifà né il browser né i
controlli: importa da `../aiuto/`.

- **`test/unita/`** — nessun browser. I motori girano senza schermo, quindi
  qui si *giocano le partite per davvero*: il castello tappa per tappa con
  un finto giocatore, i livelli del Generale risolti, il codice segreto
  vinto ragionando.
- **`test/integrazione/`** — Chrome su `dist/index.html`, si gioca col
  dito. Il lanciatore ricompila prima, se non gli si dice
  `--niente-build`.
- **`test/aiuto/`** — `verifica.mjs` (`controlla`, `uguale`, `nota`,
  `riassunto`), `browser.mjs` (apre Chrome, semina o rilegge un profilo,
  azzera, scatta), `livello.mjs` (banco di un livello del Generale),
  `sito.mjs` (il sito finto per il service worker).

## Le regole per scriverne uno

- **Le foto non si fanno da sole.** Nessun test guarda i pixel: gli scatti
  servono a un occhio umano, sono spenti e si chiedono con `--scatti` (o
  `SCATTI=1`). Mai `page.screenshot`: si passa da `scatto(page, nome)`, che
  a foto spente non fa niente e a foto accese scrive solo in
  `test/scatti/`, ignorata da git.
- **Il roster va scritto prima del reload.** Un archivio vuoto manda
  all'onboarding: `apriGioco` semina da sé un giocatore di prova, e
  `giocatori: null` prova il primo avvio vero. Gli id di prova sono
  `GIOCATORE` e `ALTRO`, mai nomi veri.
- **Un livello del Generale non ha un test suo.** Ce n'è uno per tutti
  (`unita/livelli`) che raccoglie i livelli dalla cartella e li passa al
  banco; quello che uno scenario ha di suo si dichiara nel campo
  `verifiche`, e una chiave sconosciuta è un guasto (contratto in testa a
  `test/aiuto/livello.mjs`).
- **I lenti si dichiarano**: `tempo: 100` (o più) su una riga sua fra i
  primi 1200 caratteri del file. È la stessa riga che allunga il tempo
  massimo (240 s, poi ⏱) e tiene il file fuori da `--svelti`; chi non dice
  niente resta dentro. `test/integrazione/` non entra mai in `--svelti`:
  Chrome da solo costa più di un secondo. Contratto in testa a
  `test/esegui.mjs`.

## Otto alla volta

I test girano **insieme**: otto, o la metà dei processori se sono meno di
sedici, e non più di uno per giga di memoria libera (due giri che chiudono
insieme non si mandano in swap). Ognuno è già un processo a sé col suo
Chrome e il suo archivio, quindi nessun test deve saperlo; in fila le
attese delle animazioni si sommano, più di dieci minuti contro uno e mezzo.

- L'uscita di ogni test si stampa intera quando finisce.
- I lunghi partono per primi: il lanciatore ricorda i tempi in
  `node_modules/.cache/educagioco/tempi-dei-test.json`.
- **Il giro non finisce prima del suo test più lungo**: è lì che si guarda
  quando il totale cresce (i numeri in [tempi-dei-test.md](tempi-dei-test.md)).
- `--alla-volta=1` è il lanciatore in fila, con l'uscita dal vivo: per un
  test che si comporta male solo in compagnia. `--alla-volta=12` quando la
  macchina non fa altro.

## In un ambiente pulito

`test/aiuto/browser.mjs` cerca Chrome nei posti soliti, e `CHROME=…` lo
forza. Se non c'è nessun Chrome di sistema: `npx playwright install
chromium`.
