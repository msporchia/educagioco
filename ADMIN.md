# Il manuale di chi ci mette le mani

Questo file risponde a una domanda sola: **cosa lancio, e quando.** È il
banco di lavoro — i comandi, gli attrezzi, cosa scrivono, cosa si rompe se
li si lancia nell'ordine sbagliato.

Non è il posto dove si spiega *perché* un gioco fa quello che fa: quello
sta in [`LEGGIMI.md`](LEGGIMI.md) (le regole e i numeri) e in
[`CLAUDE.md`](CLAUDE.md) (come si lavora sul codice). Chi arriva da fuori
parte dal [`README.md`](README.md).

Serve **Node** e, per gli sprite, **Python con `pillow`**. Si installa con
`npm ci` — non `npm install`: `ci` rispetta il lockfile, `install` lo
riscrive, e una dipendenza che cambia versione da sola è il genere di cosa
che si scopre quando il build non passa più.

---

## Le tre cose di ogni giorno

```bash
npm run dev            # il server di sviluppo, ricarica da sé
npm test               # 83 prove senza browser, una decina di secondi
npm run build          # produce dist/index.html, il file unico
```

`npm test` è quello che si tiene acceso. Non apre nessun browser e non
costruisce niente: i motori dei giochi girano senza schermo, quindi le
partite si giocano per davvero — il castello tappa per tappa, i livelli del
Generale risolti, il codice segreto vinto ragionando.

**`npm run build` scrive `dist/`, e `dist/` può essere quello pubblicato.**
Se serve solo controllare che il build passi, mandalo altrove:
`npx vite build --outDir /tmp/prova`.

---

## Tutti i comandi

### Si lanciano spesso

| comando | cosa fa | quanto costa |
|---|---|---|
| `npm run dev` | server di sviluppo su `localhost:5173` | — |
| `npm test` | le prove senza browser (= `test:unita`) | ~10 s |
| `npm run test:svelto` | solo quelle sotto il secondo, e non ricostruisce | ~2 s |
| `npm run build` | `dist/index.html`, il file unico offline | ~3 s |

### Si lanciano quando serve

| comando | cosa fa | quanto costa |
|---|---|---|
| `npm run test:browser` | apre Chrome su `dist/index.html` e gioca col dito | ~5 min |
| `npm run test:tutto` | tutto, browser compreso — prima di pubblicare | ~5,5 min |
| `node test/esegui.mjs <nome>` | **un file solo**: `pozioni`, `fattoria`, `torri`… | secondi |
| `node test/esegui.mjs <nome> --scatti` | ...e lascia anche le foto in `test/scatti/` | |

La cartella `test/integrazione/` da sola vale 327 dei 340 secondi della
suite intera. La CI lancia **solo** `npm run test:unita` — Chrome non lo
scarica, non l'ha mai fatto — quindi un guasto che vive solo lì lo trova
chi lo lancia a mano, non la pipeline. È un motivo in più per chiederlo
quando si è toccata una schermata.

### Gli attrezzi che scrivono nei sorgenti

Questi **rigenerano dei file versionati**. Vedi [Roba generata](#roba-generata).

| comando | riscrive | quando |
|---|---|---|
| `npm run tara` | `src/data/taratura-castello.js` | dopo aver toccato prezzi, torri o tappe del castello |
| `npm run voci` | `src/data/voci.js`, `voci-es.js` | dopo aver aggiunto parole da pronunciare |
| `npm run voci -- --lingua es` | idem, per lo spagnolo | |
| `npm run scatti` | le immagini di `docs/img/` | quando una schermata cambia aspetto |
| `python3 strumenti/sprite/atlante.py` | `src/giochi/*/dati/atlante.js` | dopo aver corretto un ritaglio |
| `python3 strumenti/sprite/terreni.py` | l'atlante del castello (tessere a griglia) | idem, per i terreni |
| `node strumenti/mappe/estrai-campagne.mjs` | `strumenti/mappe/campagne.js` | dopo aver cambiato un livello del Generale |

`npm run voci` è incrementale (cache in `.voci-cache/`) ma **vuole rete e
ffmpeg**. Se in coda dice «non incise: …», rilancia lo stesso comando.

### I banchi di prova

| comando | cosa apre |
|---|---|
| `npm run mondo` | **il banco degli sprite** — vedi sotto, è il più usato |
| `npm run vetrina` | i personaggi disegnati a poligoni del Generale |
| `npm run storie` | le scene di «Prima e dopo» |
| `npm run simula` | il tower defense giocato a mente, senza browser |
| `npm run quiz:banco` | tutti i moduli di quiz, mille domande a testa |
| `npm run mappe` | valida i livelli del Generale |

I primi tre sono pagine e **vogliono un server**: importano i moduli veri
dei giochi, e da `file://` Chrome non carica i moduli. Per questo passano
da Vite invece di aprirsi col doppio click. Aggiungi `-- --host` per
raggiungerli dal telefono.

---

## Il banco degli sprite — `npm run mondo`

Da qui passa tutto quello che si vede a schermo nella fattoria, nel
sotterraneo e nel castello. La pagina ha **due metà**, che sono le due
estremità dello stesso tubo.

```
sorgenti/gfx/oggetti_2.png   ─┐
sorgenti/gfx/oggetti_2.json  ─┤  «i ritagli» guarda QUI
                              ▼
                    atlante.py / terreni.py
                              ▼
       src/giochi/fattoria/dati/atlante.js   «il mondo» guarda QUI
                              ▼
                          il gioco
```

### «i ritagli» — correggere quello che entra

Il foglio sorgente coi rettangoli del foglietto disegnati sopra. Serve
perché i fogli disegnati da un modello la griglia non la capiscono fino in
fondo, e i difetti sono sempre gli stessi quattro: il rettangolo **taglia**,
**prende troppo**, due disegni diversi finiscono sotto **un nome solo** (e
il gioco li fa lampeggiare credendoli fotogrammi), oppure dentro il ritaglio
giusto resta **roba che non c'entra**.

Scegliere una voce ci va sopra **e ingrandisce**, col vicinato attorno — il
vicinato conta, perché un rettangolo si allarga fin dove comincia il vicino.

| gesto | cosa fa |
|---|---|
| trascini dentro il rettangolo | lo sposti |
| tiri uno degli 8 angoli | lo stringi da quel lato |
| frecce (con shift: la misura) | un passo per volta |
| **buca** + trascini | un `cancella`: il resto del foglio si spegne, perché si può bucare solo dentro il ritaglio scelto |
| **ritaglio nuovo** + trascini | prendi qualcosa che nessuno ritagliava |
| il **+** su due o più voci, poi **unisci** | le fa diventare una cosa sola, **nell'ordine in cui le hai segnate**, senza rinominare nessun pezzo |
| l'interruttore **i pezzi / le cose** | le righe del foglietto, oppure le cose come le vedrà il gioco — una carta per cosa, e l'anteprima gira |
| **sdoppia** | il contrario: un gruppo che erano due cose diverse |
| i menù di *com'è fatto* | famiglia, giri, specchia, e se i pezzi **scorrono** o **sono alternative** |

In cima al pannello destro c'è **come uscirà**: la cosa intera — non la riga
del foglietto — coi buchi già tolti e **in movimento** se i pezzi scorrono.
È l'unico modo di rispondere a «l'ho unita giusta, va nel verso giusto?»:
nessuno lo sa dire guardando tre disegni fermi.

Le voci che hai toccato portano una riga gialla nell'elenco, e la riga
sparisce da sé se rimetti le cose com'erano.

**Il giro completo**, e non ce n'è un altro:

```
  correggo nel banco  →  «salva il foglietto»  →  atlante.py  →  «il mondo»
```

L'anteprima nel pannello **non aspetta il generatore**: legge il foglio
sorgente e applica le stesse regole. `atlante.py` serve perché lo veda **il
gioco**, non perché lo veda la pagina.

Due cose che il banco **non fa**:

- **non tocca mai il PNG.** [`strumenti/sprite/STANDARD.md`](strumenti/sprite/STANDARD.md)
  dice che la sorgente è la verità: un PNG ritoccato a mano è un PNG di cui
  non si sa più cosa gli è stato fatto sopra, e il giorno che arriva un
  foglio migliore la correzione è perduta. Tutto sta nel foglietto, che è
  dato: buttare via il generato e rifarlo dà lo stesso risultato al pixel.
- **non apre i fogli del castello.** Compaiono nell'elenco spenti: lì i
  ritagli non sono dichiarati, `terreni.py` li **misura** dall'alfa, e non
  c'è nessun rettangolo da spostare.

Chi salva è un plugin di Vite `apply: 'serve'`
([`strumenti/banco/salva-foglietto.js`](strumenti/banco/salva-foglietto.js)):
scrive solo `.json` dentro `strumenti/sprite/sorgenti/`, e **nel build non
esiste**. Un foglietto cambiato da fuori mentre il banco è aperto vuole una
ricarica a mano — è voluto: la pagina non si muove da sola mentre ci lavori.

### «il mondo» — guardare quello che esce

L'atlante che il gioco spedisce davvero, su un campo di prova. Quattro
attrezzi, perché sono quattro le domande:

- **posa** — il piede cade dove deve? sborda sopra chi gli passa davanti?
- **pennello** — come sta *una zona* d'erba: le varianti le sceglie il
  posto, come in partita
- **strada** — si traccia il cammino col dito e le tessere le sceglie
  `componiPercorso`, **il risolutore vero**: se non chiude qui, non chiude
  nemmeno in gioco
- **guida** — si manda a spasso chi cammina, perché le pose stanno insieme
  solo in movimento

Più **confronta i fogli**, che mette in fila quello che il filtro mostra
alla scala vera, una riga per provenienza: è la domanda «questi due pezzi
vengono dallo stesso set?», e scopre uno stile che non combacia prima di
trovarselo in un prato.

Il tastino **✎** su ogni voce porta dritto al suo rettangolo nell'altra
metà, senza doversi ricordare in quale dei tredici fogli stia.

Il formato del foglietto è in
[`strumenti/sprite/FORMATO.md`](strumenti/sprite/FORMATO.md); il giro degli
atlanti in [`strumenti/sprite/LEGGIMI.md`](strumenti/sprite/LEGGIMI.md).

---

## Roba generata

Questi file **stanno in git e non si scrivono a mano**. Hanno tutti
`GENERATO` in testa. Modificarli funziona finché qualcuno non rilancia
l'attrezzo, e allora la modifica sparisce senza che niente sembri rotto.

| file | lo scrive |
|---|---|
| `src/data/taratura-castello.js` | `npm run tara` |
| `src/data/voci.js`, `voci-es.js` | `npm run voci` |
| `src/giochi/fattoria/dati/atlante.js` | `atlante.py` |
| `src/giochi/sotterraneo/dati/atlante.js` | `atlante.py` |
| `src/giochi/castello/dati/atlante.js` | `terreni.py` |
| `strumenti/mappe/campagne.js` | `estrai-campagne.mjs` |

Per la taratura c'è una rete: un test confronta una firma e diventa rosso
se `taratura-castello.js` è stantio rispetto ai prezzi. Per gli altri no —
si accorge l'occhio.

`index.html` in radice **non è un file giocabile**: è il template di Vite.

---

## Pubblicare

**Su GitHub Pages, da solo.** Ogni push su `main` fa partire
`.github/workflows/pubblica.yml`: `npm ci`, `npm run test:unita`,
`npm run build`, pubblica, e poi **richiede al sito che versione sta
servendo** finché non combacia. Se la action è verde, il sito è aggiornato
davvero — non «probabilmente».

**Sul server di casa, a mano.** `./pubblica.sh` mette il file sul NAS in una
decina di secondi, e da lì lo si apre dal telefono. Non è versionato
(insieme a `pubblico/`): è roba di casa, legge l'indirizzo da `.nas`. È il
modo di provare col dito — un tocco non è un click, e nessun test di
integrazione lo sostituisce.

Due avvertenze, e sono serie:

1. **La copia di casa è una sola.** Non c'è un canale di anteprima: quello
   che pubblichi è quello che trovano i bambini. Va bene per una prova, non
   per lasciarci una versione a metà.
2. **È tutto lo stesso origin.** Il nome `.lan` è un redirect a quello del
   tailnet, non un secondo indirizzo: profili, cache e service worker sono
   gli stessi del sito che si usa in casa. Una prova che tocca l'archivio
   tocca i salvataggi veri.

Il numero di versione lo genera il build. Il **`+`** in coda al commit
(`922257a+`) vuol dire che è stato costruito con modifiche non committate:
non è ricostruibile da git.

---

## Quando qualcosa va storto

**Un errore non resta muto.** Qualunque errore, ovunque scatti, finisce in
archivio sotto `incidenti` — fuori dai profili, come il codice dei genitori
— e mette a schermo un cartello in DOM puro (puro perché quando è Vue
quello rotto, un componente Vue non comparirebbe). I guasti si rileggono
**dalla pagina dei grandi**, ed è così che si diagnostica un telefono che
non è il proprio.

**`#ripara`** nell'indirizzo (o il tasto nella pagina dei grandi) butta
cache e service worker e ricarica. **Non tocca IndexedDB né localStorage**,
ed è tutta la differenza con «cancella i dati del sito»: i progressi
restano.

**Il codice dei genitori** è quattro cifre, di partenza `0000`. Si rimette
dall'indirizzo con `#pin=1234`. Lì accanto vive anche il cheat delle monete,
`#monete=500`.

**Il guasto noto che nessuno vede.** In `src/store/storage.js` c'è un
timeout di 2,5 s su `openDb()`. Su un telefono lento IndexedDB non risponde
in tempo, l'app gioca su localStorage per tutta la vita della pagina, e al
riavvio `load()` legge IndexedDB per prima e ignora quella copia: **la
sessione appena giocata sembra sparita**. I dati veri non vengono
sovrascritti e non c'è nessun avviso a schermo. Su desktop non si riproduce.

---

## Dove sta il resto

| documento | risponde a |
|---|---|
| [`README.md`](README.md) | cos'è Educagioco, per chi arriva da fuori |
| [`LEGGIMI.md`](LEGGIMI.md) | le regole di gioco e i numeri — leggilo prima di toccare `srs.js` o il bilanciamento |
| [`CLAUDE.md`](CLAUDE.md) | come si lavora sul codice: convenzioni, struttura, cosa non si fa |
| [`test/README.md`](test/README.md) | come sono fatte le prove |
| [`strumenti/sprite/FORMATO.md`](strumenti/sprite/FORMATO.md) | il foglietto di una sorgente, campo per campo |
| [`strumenti/sprite/LEGGIMI.md`](strumenti/sprite/LEGGIMI.md) | il giro degli atlanti, e il banco per esteso |
| [`strumenti/mappe/FORMATO.md`](strumenti/mappe/FORMATO.md) | i livelli del Generale |
| [`src/quiz/LEGGIMI.md`](src/quiz/LEGGIMI.md) | il contratto di un modulo di quiz |
| [`docs/`](docs/) | una pagina per gioco, con le immagini |
