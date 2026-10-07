# I comandi

Cosa si lancia e quando, cosa riscrive, i banchi di prova, la roba
generata e i cheat dell'indirizzo.

Serve **Node** e, per gli sprite, **Python con `pillow`**. Si installa con
**`npm ci`**, non `npm install`: `ci` rispetta il lockfile, `install` lo
riscrive, e una dipendenza che cambia versione da sola si scopre quando il
build non passa più.

## Di ogni giorno

| comando | cosa fa | costa |
|---|---|---|
| `npm run dev` | server di sviluppo su `localhost:5173` | — |
| `npm test` | le prove senza browser (= `test:unita`) | ~15 s |
| `npm run test:misure` | l'equilibrio dei giochi: partite finte, la mappa inglese | ~30 s |
| `npm run test:svelto` | solo quelle sotto il secondo, senza ricompilare | ~4 s |
| `npm run build` | `dist/index.html`, il file unico | ~3 s |
| `npm run test:browser` | solo le prove dentro Chrome | ~1,5 min |
| `npm run test:tutto` | tutto, misure e browser compresi: prima del push | ~1,5 min |
| `node test/esegui.mjs <nome>` | un file solo (`pozioni`, `fattoria`…) | secondi |

Opzioni del lanciatore: `--niente-build`, `--scatti`, `--svelti`,
`--tempo=600`, `--alla-volta=N`. Quando usarle: [test.md](test.md).

**`npm run build` scrive `dist/`, e `dist/` può essere quello
pubblicato.** Per controllare solo che il build passi:
`npx vite build --outDir /tmp/prova`.

## Gli attrezzi che riscrivono file versionati

| comando | riscrive | quando |
|---|---|---|
| `npm run tara` | `src/data/taratura-castello.js` | dopo aver toccato prezzi, potenza delle torri o tappe del castello |
| `npm run voci` (`-- --lingua es`) | `src/data/voci.js`, `voci-es.js` | dopo aver aggiunto parole da pronunciare ([strumenti.md](strumenti.md)) |
| `npm run scatti` (`clip`, `castello`…) | le immagini e le clip di `docs/img/` | quando una schermata cambia faccia ([strumenti.md](strumenti.md)) |
| `npm run quiz:livelli` | `docs/apprendimento/livelli-delle-domande.md` | dopo aver toccato i `livelli:` di un modulo |
| `node strumenti/icone.mjs` | i PNG delle icone e l'anteprima del link, da `public/icona.svg` | quando cambia l'icona |
| `python3 strumenti/sprite/atlante.py` | `src/giochi/*/dati/atlante.js` | dopo aver corretto un ritaglio |
| `python3 strumenti/sprite/vesti.py --atlante` | `src/giochi/castello/dati/vestiti.js` e `figure.js` | quando arriva un foglio del castello o cambia il bestiario |
| `python3 strumenti/sprite/cammino.py <video> <creatura> --lato i:p --fronte i:p` | `strumenti/sprite/sorgenti/castello/cammino/<creatura>.png` e `.json` | quando arriva un video di Grok di una creatura che cammina (`--cerca` e `--provino` per trovare i giri, `--misura area` per chi salta); poi `vesti.py --atlante` |
| `python3 strumenti/sprite/scenario.py`, `scacchiera.py` | gli schemi da allegare ai prompt | dopo aver toccato la pianta di un prompt |
| `python3 strumenti/sprite/terra-di-sopra.py` (`--proponi`, `--provino`, `--giunta` in `tmp/terra/`) | `src/giochi/sotterraneo/dati/terra-mappa.js` | dopo aver corretto la maschera o i posti nel foglietto, o quando cambia uno dei due pezzi della mappa o la giunta ([../sotterraneo/terra-di-sopra.md](../sotterraneo/terra-di-sopra.md)) |
| `python3 strumenti/sprite/isole-passo-passo.py` (`--provino` in `tmp/isole/`) | `src/giochi/passo-passo/dati/isole-mappa.js` | dopo aver corretto il foglietto della valle di Passo passo (sentieri, ponti, tane, cartelli), o quando cambia il fondale o il numero di tappe di un'isola ([../passo-passo/mappa.md](../passo-passo/mappa.md#il-foglietto-e-lo-strumento)) |
| `node strumenti/sprite/in-campo.mjs <creatura>` | `tmp/in-campo/<creatura>/` (GIF del campo, di lato, di fronte) | per guardare una creatura camminare in partita, dopo `vesti.py --atlante` e `npm run build` |
| `node strumenti/sprite/carte-castello.mjs` | `poc/scatti/castello-carte*.png`, `castello-battaglia*.png` | dopo aver toccato carte, schizzi o bestiario |

Gli altri strumenti degli sprite (`righe.py`, i provini di `vesti.py`) non
scrivono niente: stanno in [sprite.md](sprite.md).

## I banchi e gli strumenti di misura

| comando | cosa apre o misura |
|---|---|
| `npm run mondo` | il banco degli sprite ([sprite.md](sprite.md)) |
| `npm run vetrina` | i personaggi a poligoni del Generale |
| `npm run storie` | le scene di «Prima e dopo» |
| `npm run ambienti` | i paesaggi delle domande sugli animali |
| `npm run simula` | il tower defense giocato a mente, senza browser |
| `npm run dps` | quanto fa male ogni torre, per livello e ramo, col motore vero sulle carte, quanto rende un ⚡, e quanto rende un ⚡ cumulato salendo (un minuto) |
| `node strumenti/regali-castello.mjs` | a che ondata cede ogni libera con N regali |
| `node strumenti/valida-percorsi.mjs` | le carte del castello, passate ai raggi X |
| `node strumenti/simula-castello.mjs --sole div` | le tappe con una torre sola dovunque si può, dal metro e dal pigro |
| `npm run quiz:banco` | tutti i moduli di quiz, mille domande a testa |
| `npm run quiz:eta` | chi vede cosa: la calibrazione per età, e i buchi |
| `node strumenti/generale/piani.mjs` | il simulatore dei piani del Generale |
| `node strumenti/passo-passo/minimi.mjs` | le strade più corte di Passo passo, messe alla prova |
| `node strumenti/passo-passo/sentiero.mjs` | i sentieri senza fine di Passo passo: mille posti per famiglia, il programma più corto in carte con la mano del bambino (`--mano=`), le mosse, se serve il ciclo o il se, la strada più corta, le forme, il tempo (su più processi; il cane una ventina di minuti) |
| `node strumenti/scatta-app.mjs <schermata>` | un PNG dell'app servita da Vite (`--porta`, `--tocca`, `--attesa`), in `tmp/` |

**I banchi sono pagine e vogliono un server**: importano i moduli veri, e
da `file://` Chrome non li carica. `-- --host` per aprirli dal telefono.

## Roba generata

Sta in git e **non si scrive a mano**: i sorgenti hanno `GENERATO` in
testa, e una modifica sparisce senza rumore alla prossima rigenerazione.

| file | lo scrive |
|---|---|
| `src/data/taratura-castello.js` | `npm run tara` — un test confronta una firma e diventa rosso se è stantio |
| `src/data/voci.js`, `voci-es.js` | `npm run voci` |
| `src/giochi/fattoria/dati/atlante.js`, `src/giochi/sotterraneo/dati/atlante.js` | `atlante.py` |
| `src/giochi/castello/dati/vestiti.js`, `figure.js` | `vesti.py --atlante` |
| `src/giochi/sotterraneo/dati/terra-mappa.js` | `terra-di-sopra.py` — `unita/sotterraneo-terra` diventa rosso se la maschera o i posti non sono quelli del foglietto |
| `src/giochi/passo-passo/dati/isole-mappa.js` | `isole-passo-passo.py` — `unita/passo-passo-valle` diventa rosso se il foglietto è cambiato dopo |
| `docs/apprendimento/livelli-delle-domande.md` | `npm run quiz:livelli` |
| `docs/img/*` | `npm run scatti` |

Per gli atlanti non c'è una rete: se ne accorge l'occhio.

## I cheat dell'indirizzo

Si scrivono dopo il `#` e si sommano (`#fattoria-tipo=30&monete=2000`: le
monete tolgono dall'indirizzo solo il loro pezzo, così un ricaricamento non
le raddoppia). Dall'app installata non si scrivono (non ha la barra
dell'indirizzo): si usano dal browser.

| cheat | cosa fa |
|---|---|
| `#admin` | la pagina dei trucchi (`views/AdminView.vue`) |
| `#monete=500` | monete al bambino attivo, anche a gioco già aperto; `#monete=-100` le toglie, mai sotto zero |
| `#pin=1234` | rimette il codice dei grandi |
| `#fattoria=40` | alza il livello della fattoria (non lo abbassa mai), il prato resta |
| `#fattoria-tipo=30` | mette una fattoria già giocata di quel livello (1–99, `giochi/fattoria/motore/tipo.js`); **butta quella del bambino attivo** nel cestino: si usa con un bambino di prova |
| `#stagione=natale` | la fattoria a Natale (o `halloween`) fuori stagione |
| `#sotterraneo=roba` | si scende equipaggiati |
| `#abisso=12` | l'abisso da quel piano |
| `#seme=812` | il sotterraneo con quel seme, per rivedere una discesa |
| `#ripara` | butta la copia del gioco e la riscarica ([guasti.md](guasti.md)) |
| `#<chiave>` (es. `#fattoria`) | apre quel gioco |

**`#admin`** non ha codice né carta in home: un tasto per cheat, uno per
aprire qualunque gioco anche se in home non c'è, il bambino di prova
(`data-azione="bambino-prova"`), i due interruttori dei grandi (giochi in
prova, tutte le tappe aperte) e il codice rimesso a `0000`. **I tasti
scrivono l'indirizzo e portano dove il cheat si legge**, non rifanno niente:
un cheat nuovo si aggiunge lì con una riga (`A_MANO`), se no torna a essere
una cosa da ricordare a memoria. Nei test: `[data-admin]`.
