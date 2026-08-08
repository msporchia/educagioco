# I test

```
npm test                 tutto (ricompila prima, da solo)
npm run test:unita       solo quelli che non aprono il browser — un secondo
npm run test:browser     solo quelli nel browser

node test/esegui.mjs animali        solo i file che contengono "animali"
node test/esegui.mjs --niente-build non ricompilare (se hai appena compilato)
node test/esegui.mjs --tempo=600    alza il tempo massimo per test
node test/esegui.mjs torri --scatti lascia anche le foto (test/scatti/)
```

## Le foto si chiedono

**Nessuno scatto viene fatto da solo.** Le immagini non verificano niente —
nessun test guarda i pixel — e servono a chi lavora per vedere com'è venuta
una schermata. Farle a ogni giro costava secondi e lasciava in giro file che
cambiano da soli, perché il gioco è pieno di caso: un `git status` sporco
dopo ogni build, e otto PNG del tower defense che finivano perfino nei commit.

Si accendono con `--scatti` al lanciatore, o con `SCATTI=1` nell'ambiente se
lanci il file a mano:

```bash
node test/esegui.mjs torri --scatti      # una classe, con le foto
SCATTI=1 node test/integrazione/torri.test.mjs   # a mano
```

Un test non chiama mai `page.screenshot` da sé: passa da `scatto(page, nome)`
di `aiuto/browser.mjs`, che a foto spente non fa niente e a foto accese scrive
sempre e solo in `test/scatti/`, che git non guarda. In `torri.test.mjs` il
pezzo che apre le colonne per ritrarle sta **dentro** l'`if`: esiste solo per
la foto, e senza foto non c'è motivo di farlo girare.

Ogni test ha **quattro minuti** per finire, poi viene fermato e segnato ⏱.
Serve perché un test appeso non dia l'impressione di uno lento: è già
successo che una simulazione tenesse ferma tutta la suite per un quarto
d'ora senza dire niente. Chi ci mette davvero di più lo dichiara, scrivendo
una riga fra i primi commenti del file:

```js
/*  tempo: 900   ← simula partite intere, ci mette dei minuti  */
```

Il lanciatore ricompila `dist/index.html` prima dei test di integrazione:
dimenticarsene vuol dire provare la versione di ieri e non accorgersene.

## Com'è diviso

```
test/
  unita/          niente browser, millisecondi: aritmetica, dati, motori
  integrazione/   il gioco vero dentro Chrome, aperto da file://
  aiuto/          gli attrezzi che servono a tutti e due
  scatti/         gli screenshot lasciati dai test (non versionati)
```

**unità** — la matematica delle colonne, la forza del motore di apprendimento,
la curva della fame, i traguardi. Girano su `src/` direttamente, senza
compilare niente. Sono quelli da lanciare in continuazione mentre si lavora.

**integrazione** — aprono `dist/index.html` in Chrome come lo aprirebbe un
bambino, con doppio click su un file. Sono lenti (secondi) e sono gli unici
che vedono davvero i bug di incastro fra le parti.

## Gli attrezzi

`aiuto/verifica.mjs` — `controlla`, `uguale`, `nota`, `riassunto`. Niente
libreria: serve solo che un test rosso esca con codice ≠ 0. Un file che
stampa e basta non è un test, perché nessuno si accorge quando smette di
funzionare.

`aiuto/browser.mjs` — avvia Chrome, apre il gioco, raccoglie gli errori di
console, semina un profilo già pronto, azzera l'archivio, salva screenshot.
Il percorso di Chrome si forza con la variabile d'ambiente `CHROME`; senza,
lo cerca nei posti soliti.

Seminare un profilo è la cosa che fa la differenza: provare la fame di domani
senza aspettare domani.

```js
await semina(page, { coins: 200, pets: { watson: { /* ... */ } } })
```

## Regole imparate a spese nostre

**`avvio.test.mjs` esiste per un motivo.** È già capitato di distribuire un
`giochi.html` che si fermava su "Un attimo…" con un ReferenceError: tutti gli
altri test guardavano dentro ai giochi, nessuno guardava la porta d'ingresso.
È il test più corto e il primo da leggere quando qualcosa è rosso.

**Mai controllare i totali quando qualcun altro può muoverli.** Le monete
arrivano dai giochi, dal negozio, dai traguardi e dal cheat: un test scritto
su "dev'essere 500" passa oggi e mente domani, appena si aggiunge un altro
modo di guadagnare. Si guardano le differenze, e dove il rumore è possibile
si chiede *almeno tanto* invece di *esattamente tanto*.

**Un `goto` che cambia solo il frammento non ricarica niente.** È una
navigazione dentro lo stesso documento: l'applicazione non riparte. Per
riaprire davvero bisogna passare da `about:blank`.

## Cosa resta da fare

`integrazione/app.test.mjs` e `integrazione/torri.test.mjs` stampano ancora un
JSON e passano comunque: falliscono solo se vanno in crash. Vanno portati su
`aiuto/verifica.mjs` come gli altri, così un cambiamento di comportamento si
vede invece di finire in un log che non legge nessuno.
