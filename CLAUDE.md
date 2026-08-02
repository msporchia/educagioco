# Giochi di Leonardo e Melody

Giochi educativi per bambini (inglese, matematica in colonna, tower defense) in
Vue 3 + Vite. Il prodotto finale è **un unico file HTML** apribile con doppio
click, offline, senza server.

`LEGGIMI.md` descrive architettura, motore di apprendimento e regole di gioco:
**leggilo prima di toccare `src/store/srs.js` o `src/data/ops.js`**. Qui sotto
c'è solo ciò che serve per lavorare sul repo.

## Comandi

```bash
npm ci            # installazione pulita (usare questo, non npm install)
npm run dev       # server di sviluppo
npm run build     # produce dist/index.html, il file unico
```

## Verifiche

```bash
node srs-test.mjs    # motore di apprendimento, nessun browser
node pets-test.mjs   # stanza degli animali: fame, cibi, negozio; nessun browser
node td-test.mjs     # 16 000 operazioni in colonna + partita nel browser
node test.mjs        # applicazione completa nel browser
```

`test.mjs` e `td-test.mjs` usano Playwright e girano contro `dist/index.html`:
**vanno lanciati dopo `npm run build`**, altrimenti provano una build vecchia.

## Struttura

- `src/` — sorgente modulare: `store/` (persistenza, SRS, profilo), `data/`
  (vocaboli, negozio, operazioni), `components/`, `views/` (un file per gioco)
- `giochi.html` — artefatto distribuibile in root, copia dell'output di
  `npm run build`. È il file che i bambini aprono: va rigenerato quando si
  rilascia una modifica, non modificato a mano.
- `dist/` — output del build, ignorato da git

## Convenzioni

- **Il codice è in italiano**: nomi di variabili, funzioni e commenti
  (`colonnaAdd`, `guasti`, `forza`, `ripassoFraGiorni`). Mantenere questa scelta.
- Niente dipendenze runtime oltre a Vue: l'audio è sintetizzato, le icone sono
  emoji, nessun file esterno. Il build deve restare un singolo HTML autonomo.
- I dati di gioco stanno nel browser (IndexedDB → localStorage → memoria):
  nessun backend, nessuna rete.

## Da sapere prima di eseguire i test in un ambiente pulito

`test.mjs` e `td-test.mjs` contengono ancora due valori legati alla macchina su
cui sono stati scritti:

- `executablePath: '/opt/pw-browsers/chromium'`
- `URL = 'file:///home/claude/giochi/dist/index.html'`

In un ambiente diverso vanno resi relativi (percorso del repo) o presi da
variabile d'ambiente, altrimenti i due test falliscono all'avvio.
