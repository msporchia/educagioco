# Pubblicare

Come il gioco arriva ai telefoni: GitHub Pages da solo, il server di casa a
mano, e cosa dice il numero di versione.

## GitHub Pages

Ogni push su `main` (o il tasto su GitHub) fa partire
`.github/workflows/pubblica.yml`: `npm ci`, `npm run test:unita`,
`npm run build`, pubblica, e poi **chiede al sito che versione sta
servendo** (`versione.json`) finché non combacia con quella appena
costruita, riprovando per un minuto. Se la action è verde il sito è
aggiornato davvero: senza quel controllo un deploy andato a metà è
indistinguibile da uno riuscito. Un deploy per volta, e quello in corso
non si annulla (lascerebbe il sito con i file di due versioni).

La CI non lancia le prove nel browser: chi tocca lo schermo le lancia a
mano prima del push (vedi [test.md](test.md)).

## Il server di casa

`./pubblica.sh` mette il file sul server di casa in una decina di secondi.
**Non è versionato** (insieme a `pubblico/`): è roba di casa, legge
l'indirizzo da `.nas`, anche quello ignorato da git.

È anche **il modo di provare col dito**: certe cose si vedono solo da un
telefono vero (un tocco non è un click, e nessun test di integrazione lo
sostituisce). Si chiede quando c'è da guardare una schermata, non solo
quando si rilascia. Due avvertenze:

1. **La copia di casa è una sola.** Non c'è un canale di anteprima:
   quello che si pubblica è quello che trovano i bambini. Va bene per una
   prova, non per lasciarci una versione a metà.
2. **È tutto lo stesso origin.** Il nome `.lan` è un redirect a quello del
   tailnet, non un secondo indirizzo: profili, cache e service worker sono
   quelli del sito che si usa in casa. Una prova che tocca l'archivio tocca
   i salvataggi veri.

**`pubblica.sh` costruisce dal working tree così com'è**, non da un
commit: con altre sessioni al lavoro sullo stesso repo porta in casa anche
il loro lavoro a metà. Prima si guarda `git status`; se c'è roba non
propria si costruisce da un worktree pulito (`git worktree add --detach`,
col collegamento a `node_modules` e una copia di `.nas` e `pubblica.sh`).

## Il numero di versione

Lo scrive il build (`vite.config.js`: `__VERSIONE__` nella pagina,
`dist/versione.json` per il sito, con `peso` in byte). Il **`+`** in coda
al commit (`922257a+`) vuol dire build fatto con modifiche non committate
(`git status --porcelain` non vuoto): non è ricostruibile da git. Un
collegamento a `node_modules` dentro un worktree basta a farlo comparire:
`.gitignore` dice `node_modules/`, che vale solo per le cartelle.

La data e l'ora sono quelle di Roma ovunque si costruisca: il server di
GitHub ha il fuso di Londra, e il sito vero diceva due ore in meno della
copia di casa.

Come la versione nuova arriva su un telefono già installato:
[aggiornamento.md](aggiornamento.md).
