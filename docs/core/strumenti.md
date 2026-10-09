# Gli strumenti di rado

La pronuncia incisa, le foto e le clip della documentazione, le icone. Il
resto degli strumenti sta in [comandi.md](comandi.md) e
[sprite.md](sprite.md).

## Le voci — `npm run voci`

Incide la pronuncia e riscrive `src/data/voci.js` (e `voci-es.js` con
`-- --lingua es`): clip concatenate in sprite, perché il gioco non usa
`speechSynthesis` (vedi [`../lingue/`](../lingue/README.md)). Si lancia solo
dopo aver aggiunto parole.

- È **incrementale** (cache in `.voci-cache/`, `.voci-cache-es/`), ma
  **vuole rete e ffmpeg**.
- Se in coda dice «non incise: …», **si rilancia lo stesso comando**.

## Le foto e le clip — `npm run scatti`

Rifà le immagini di `docs/img/`, che sono versionate (README e pagine dei
giochi). Non c'entrano con gli scatti dei test (`test/scatti/`, ignorati):
quelli servono a guardare un difetto, questi a far vedere il gioco.

- `npm run scatti castello` fa solo quelle che contengono «castello»;
  `npm run scatti clip` solo le clip animate del README
  (`docs/img/clip-*.webp`).
- Il profilo è **finto e pieno** (monete, tappe aperte): un gioco
  fotografato appena installato è grigio e non dice niente. Una ricetta lo
  ritocca con `profilo: p => p`.
- **Le clip si rifanno, non si ritoccano.** Ognuna è una ricetta in
  `strumenti/clip/<gioco>.mjs`: dove entrare e una partita giocata davanti
  alla telecamera (`durante`). Chrome registra lo schermo (lo `screencast`
  del protocollo) e `strumenti/clip.py` monta il WebP — vuole Python con
  Pillow, niente ffmpeg. Le ricette leggono le risposte dal gioco invece di
  scriverle a mano, quindi un gioco cambiato si rifotografa col comando; se
  una clip esce storta lo strumento lo dice in coda, e il commento in testa
  alla ricetta dice da cosa dipende.
- `clip: { dallaMappa: true }`: i `passi` si fanno davanti alla telecamera,
  e il filmato comincia dalla schermata di scelta del livello (asteroidi,
  passo passo, pozioni, Survivors, il Robot); `secondi` conta da lì, passi compresi.
  `dallaMappa: n` lascia fuori campo i primi `n` passi (una semina che
  ricarica la pagina).
- Un gioco nuovo nel README è una ricetta nuova, sul calco di `passo.mjs`.
- Vogliono `dist/` fresco: prima `npm run build`.

## Le icone — `node strumenti/icone.mjs`

Fa i PNG delle icone e l'anteprima del link da `public/icona.svg`, che è
l'unica sorgente: Android vuole un PNG per la schermata iniziale, iOS
l'`apple-touch-icon`. Li disegna Chrome via Playwright. Cambiare l'icona è
cambiare l'SVG e rilanciare.

## La guardia dei commenti — `npm run test:commenti`

`node strumenti/solo-commenti.mjs [base]` (base di difetto `main`) confronta
ogni `.js/.mjs/.vue/.css` cambiato fra la base e l'albero di lavoro e
fallisce se è cambiato qualcosa oltre ai commenti e agli spazi. Serve a chi
sposta spiegazioni dal codice ai documenti: il codice deve uscirne identico.

- **JS**: esbuild con `minifyWhitespace` e `legalComments: 'none'`, ma
  **senza** rinominare variabili né riscrivere la sintassi: anche una
  rinomina locale risulta un cambiamento.
- **`.vue`**: `@vue/compiler-sfc` separa i blocchi; script come sopra (loader
  secondo `lang`), template senza `<!-- -->` e con ogni fila di spazi ridotta
  a uno (fra un tag e l'altro a nessuno), stile con esbuild css minify.
  Anche gli attributi dei blocchi (`setup`, `scoped`, `lang`) contano.
- Un file nuovo o tolto è sempre «diverso». Per ogni file diverso stampa i
  dintorni del primo punto in cui le due versioni normalizzate divergono.
