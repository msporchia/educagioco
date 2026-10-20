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
| `npm run tara:fattoria3d` | niente (stampa soltanto) | dopo aver toccato un prezzo, un tempo o le soglie della fattoria 3D: per livello le monete spese in tutto, i minuti di esercizio equivalenti (🪙6 al minuto), cosa si apre e l'attesa più lunga in catena, più i controlli di scala (esce con 1 se uno è rosso; li tiene fermi anche `unita/fattoria3d-taratura`): [../fattoria3d/livelli.md](../fattoria3d/livelli.md) |
| `npm run tara:arena` | `src/giochi/arena/dati/taratura.js` | dopo aver toccato regole, truppe, tappe o il nemico di Castle Battle (gioca migliaia di partite da cinque minuti col banco, su tutti i core: `strumenti/banco-parallelo.mjs`, stessi semi e stesso esito che in fila; da una ventina di minuti a pochi); `-- --misura` gioca i giocatori finti contro la taratura scritta senza ritarare (`--d`, `--furbizia` per un nemico fisso, `--draghi` per aggiungere chi costruisce solo draghi senza miniera) |
| `npm run emoji` | `src/emoji/emoji.woff2`, `emoji.css`, `strumenti/emoji/elenco.json` | dopo aver scritto un'emoji nuova in `src/` ([emoji.md](emoji.md)); vuole Python con `fonttools` e `brotli` (si installano da soli in `.venv-emoji/`) |
| `npm run voci` (`-- --lingua es`) | `src/data/voci.js`, `voci-es.js` | dopo aver aggiunto parole da pronunciare ([strumenti.md](strumenti.md)) |
| `npm run scatti` (`clip`, `castello`…) | le immagini e le clip di `docs/img/` | quando una schermata cambia faccia ([strumenti.md](strumenti.md)) |
| `npm run scatti icone-mondo` | le icone dei posti del Sotterraneo 3D: fotografa nel mondo 3D (file costruito, eroe nascosto) i sette monumenti, l'abisso e le tre città con la stessa inquadratura e riscrive `src/giochi/sotterraneo/dati/icone-mondo.js` (generato, con firma: un test la ricalcola); non gira con `npm run scatti` senza nome; `ICONE_DEBUG=1` lascia i PNG in `tmp/scatti/icone-mondo/` | quando un monumento cambia faccia ([../sotterraneo/mondo-3d.md](../sotterraneo/mondo-3d.md#le-icone-dei-posti)) |
| `npm run quiz:livelli` | `docs/apprendimento/livelli-delle-domande.md` | dopo aver toccato i `livelli:` di un modulo |
| `node strumenti/icone.mjs` | i PNG delle icone e l'anteprima del link, da `public/icona.svg` | quando cambia l'icona |
| `python3 strumenti/sprite/atlante.py` | `src/giochi/*/dati/atlante.js` | dopo aver corretto un ritaglio; le creature del sotterraneo le prende dal catalogo comune ([creature.md](creature.md)) |
| `python3 strumenti/sprite/vesti.py --atlante` | `src/giochi/castello/dati/vestiti.js` e `figure.js` | quando arriva un foglio del castello o cambia il bestiario; le creature le prende dal catalogo comune ([creature.md](creature.md)) |
| `python3 strumenti/sprite/cammino.py <video> <creatura> --lato i:p --fronte i:p` | `strumenti/sprite/sorgenti/creature/passi/<creatura>.png` e `.json` | quando arriva un video di Grok di una creatura che cammina (`--cerca` e `--provino` per trovare i giri, `--misura area` per chi salta); poi `vesti.py --atlante` |
| `python3 strumenti/sprite/creature.py misura <foglio> <chiave> x0,y0,x1,y1 --quanti=N --scrivi` (`riga`, `vedi` per cercare dove sta) | `strumenti/sprite/sorgenti/creature/creature.json` | per mettere una creatura nuova nel catalogo comune, coi rettangoli misurati ([creature.md](creature.md)); la scheda si scrive poi a mano nello stesso file |
| `python3 strumenti/sprite/creature.py morti [nomi] [--scrivi nome=0,1 …]` | `tmp/creature/morti.png`, e con `--scrivi` il campo `morte` del catalogo | per scegliere come cade una creatura: le figure dopo le sue pose, numerate; poi `atlante.py sotterraneo` ([creature.md](creature.md)) |
| `python3 strumenti/sprite/creature.py catalogo` | `docs/core/creature-catalogo-1.md` e `-2.md` | dopo aver ritoccato una `scheda` nel catalogo |
| `python3 strumenti/sprite/creature.py provino [chiavi] [--sotterraneo]` (`controlla` stampa i guasti del catalogo) | `tmp/creature/provino.png` | per guardare le creature, i passi e i rettangoli; `--sotterraneo` le mostra come le riceve l'atlante del sotterraneo |
| `python3 strumenti/sprite/roba.py [categorie o id] [--elemento --stile --libere]` (`--foglietto id…`: le righe da incollare) | `tmp/roba/catalogo.png` | per scegliere una figura di roba del sotterraneo dal catalogo descritto ([../sotterraneo/figure.md](../sotterraneo/figure.md)) |
| `python3 strumenti/sprite/roba.py --gioco` | il blocco `__aspetti` dei foglietti del sotterraneo e `src/giochi/sotterraneo/dati/aspetti.js` | dopo aver cambiato il `pezzo` di una figura in `roba.json`; poi `atlante.py sotterraneo` |
| `python3 strumenti/sprite/non-ritagliato.py --gioco=<g> --foglio=<f> --prendi x,y=nome:LxA … [--scrivi]` | le righe di `sprite` nel foglietto (stampate, o scritte con `--scrivi`) | per ritagliare una figura che nessun foglietto prende: `x,y` è l'angolo che il provino (`--provino`, `tmp/inutilizzati/`) scrive sotto il numero, `x,y,l,a=nome` un rettangolo dato a mano, `:LxA` la `misura`; poi `atlante.py` ([sprite.md](sprite.md#gli-inutilizzati)) |
| `python3 strumenti/sprite/vedi.py <gioco> <nomi o prefissi> [--nitido --scala N]` | `tmp/pezzi/<nome>.png` | per guardare i pezzi come sono usciti nell'atlante (e il nitido accanto), ingranditi e con una cella da 16 px per misura, prima di metterli in gioco |
| `python3 strumenti/sprite/scenario.py`, `scacchiera.py` | gli schemi da allegare ai prompt | dopo aver toccato la pianta di un prompt |
| `python3 strumenti/sprite/inferno.py` (`--provino` in `tmp/inferno.png`) | `sorgenti/sotterraneo/generati/sotterraneo_6_derivati.png` e il `.json` | per rifare in codice i pezzi dell'inferno che nessuno ha dipinto (pavimenti senza cuciture, tetto, medaglione, porte chiara e aperta, fianchi, scala chiusa, fontana asciutta) dalla scena e dalle tavole; **prima di `diagonali.py inferno`** e di `atlante.py sotterraneo` ([../sotterraneo/scenari.md](../sotterraneo/scenari.md#linferno)) |
| `python3 strumenti/sprite/diagonali.py [scena]` (`--provino` in `tmp/diagonali-<scena>.png`) | `sorgenti/sotterraneo/generati/sotterraneo_4_diagonali.png`, `_2_` (cantine), `_5_` (fornace), `_6_` (inferno) e i `.json` | per rifare i pezzi dei muri obliqui di ogni scena dalle sue tessere dritte, in codice (libreria `derivati.py`: [sprite.md](sprite.md#i-pezzi-derivati-in-codice)); poi `atlante.py sotterraneo` ([../sotterraneo/scenari.md](../sotterraneo/scenari.md#i-muri-in-diagonale)) |
| `python3 strumenti/sprite/terra-di-sopra.py` (`--proponi`, `--provino`, `--giunta` in `tmp/terra/`) | `src/giochi/sotterraneo/dati/terra-mappa.js` | dopo aver corretto la maschera o i posti nel foglietto, o quando cambia uno dei due pezzi della mappa o la giunta ([../sotterraneo/terra-di-sopra.md](../sotterraneo/terra-di-sopra.md)) |
| `python3 strumenti/sprite/regno-castello.py` (`--provino` in `tmp/regno/`) | `src/giochi/castello/dati/regno.js` | dopo aver spostato un posto o un ponte nel foglietto `castello/regno.json`, o quando cambia la mappa ([../castello/regno.md](../castello/regno.md)) |
| `python3 strumenti/sprite/isole-passo-passo.py [zaino\|valle]` (`--provino` in `tmp/isole/`) | `src/giochi/passo-passo/dati/isole-mappa.js` e `zaino-mappa.js` | dopo aver corretto un foglietto di Passo passo (`isole.json` la valle, `zaino.json` lo zaino: sentieri, ponti, tane, cartelli), o quando cambia un fondale o il numero di tappe di un'isola ([../passo-passo/mappa.md](../passo-passo/mappa.md#il-foglietto-e-lo-strumento)) |
| `python3 strumenti/sprite/copertine.py` (`--collana`: le copertine fatte in `tmp/copertine/collana.png`, lo stile da allegare) | `src/components/home/copertine-dipinte.js` | quando arriva o cambia una `copertina-<chiave>` in `strumenti/sprite/sorgenti/home/` ([home.md](home.md#le-copertine)) |
| `python3 strumenti/sprite/caserme-arena.py [provino.png]` | `src/giochi/arena/dati/caserme-dipinte.js` | quando arriva o cambia il foglio delle caserme di Castle Battle (`sorgenti/arena/caserme.webp` e il suo foglietto `caserme.json`: cosa c'è in ogni riga) ([../arena/grafica.md](../arena/grafica.md)) |
| `node strumenti/sprite/in-campo.mjs <creatura>` | `tmp/in-campo/<creatura>/` (GIF del campo, di lato, di fronte) | per guardare una creatura camminare in partita, dopo `vesti.py --atlante` e `npm run build` |
| `node strumenti/sprite/carte-castello.mjs` | `poc/scatti/castello-carte*.png`, `castello-battaglia*.png` | dopo aver toccato carte, schizzi o bestiario |

`terra-di-sopra.py`, `isole-passo-passo.py`, `regno-castello.py` e `vesti.py` codificano le loro
immagini con `strumenti/sprite/codifica.py` (WebP senza perdita, colori a passo
12) e stampano il peso e i dB contro il sorgente: un passo più largo si vede
subito. Il perché: [grafica.md](grafica.md#fedeli-ai-sorgenti).

Gli altri strumenti degli sprite (`righe.py`, i provini di `vesti.py`) non
scrivono niente: stanno in [sprite.md](sprite.md).

## I banchi e gli strumenti di misura

| comando | cosa apre o misura |
|---|---|
| `npm run mondo` | il banco degli sprite ([sprite.md](sprite.md)) |
| `npm run sprite:inutilizzati` (`-- --pixel --provino`, `--gioco=fattoria`, `--json`) | il rapporto delle immagini generate che nessun gioco usa: file di `sorgenti/` che nessuno legge, voci dell'atlante che nessun file di `src/` nomina, figure di `roba.json` mai ritagliate, creature senza gioco; con `--pixel` anche le macchie dei fogli che nessun ritaglio copre (Python + pillow), con `--provino` i fogli da guardare in `tmp/inutilizzati/`. Non scrive niente di versionato ([sprite.md](sprite.md#gli-inutilizzati)) |
| `strumenti/banco/catalogo-3d/sotterraneo.js` | le voci del catalogo 3D (`VOCI`: id, nome, gioco, categoria, dove, file, `crea()` sincrono che torna un Object3D sull'origine, `userData.anima(t)` se si muove): ogni modello in codice del Sotterraneo 3D; un test (`unita/catalogo-3d-sotterraneo`) controlla che nessun modello nuovo del gioco resti fuori. Si guardano tutte, disegnate davvero in WebGL, da `strumenti/banco/catalogo-3d-prova.html` (`?solo=kit`; l'esito in `window.__prova`; `node strumenti/scatta-app.mjs --pagina strumenti/banco/catalogo-3d-prova.html --aspetta 25000 --stampa 'JSON.stringify(window.__prova)'`) |
| `npm run vetrina` | i personaggi a poligoni del Generale |
| `npm run storie` | le scene di «Prima e dopo» |
| `npm run ambienti` | i paesaggi delle domande sugli animali |
| `npm run catalogo3d` · `npm run catalogo3d:scheda` (`-- --gioco fattoria`, `--larghezza`, `--pixel`) | il catalogo di tutti i modelli 3D (Fattoria 3D e Sotterraneo 3D) e dove si usano, con la scheda delle somiglianze; la scheda è un PNG contatto per gioco in `tmp/scatti/catalogo-3d-<gioco>.png`, senza build ([catalogo-3d.md](catalogo-3d.md)) |
| `npm run pannelli` | i pannelli del sotterraneo (domanda, scontro 2D e 3D, i globi vivi e come reagiscono, zaino, bottega, eroe, albero, pozioni, dialogo, barra, fine, pausa) nei tre temi affiancati, coi componenti veri, a 390/320/768/1100 px ([../sotterraneo/tema-pannelli.md](../sotterraneo/tema-pannelli.md)) |
| `npm run simula` | il tower defense giocato a mente, senza browser |
| `npm run dps` | quanto fa male ogni torre, per livello e ramo, col motore vero sulle carte, quanto rende un ⚡, e quanto rende un ⚡ cumulato salendo (un minuto) |
| `npm run sotterraneo` | il giocatore finto del sotterraneo su più processi: discese vinte a 8/6/4 su 10 per eroe, `--diag` (domande, svenimenti, vita a fine scontro, abilità), `--zone`, `--vere`, `--forza`, `--turni` (velocità e doppi turni per classe e discesa, `--file` la fila dei turni lettera per lettera), `--domande` (le domande obbligate per discesa e per piano rispondendo sempre giusto, dritto alla scala e girando tutto, per eroe: [../sotterraneo/piani.md](../sotterraneo/piani.md#il-costo-in-domande)), `--costi` (globo atteso, costo e lanci col globo pieno per classe e riga), `--numeri 1,5,12,20,30` (vita, difesa e attacco dell'eroe atteso, per classe), `--strada mago|mago:pura|tutte` (le tre strade di una classe a confronto, [../sotterraneo/strade.md](../sotterraneo/strade.md); con `--livelli 3,5,8` per partire sopra il livello atteso, `--sintesi` una riga per strada, `--scheda` com'è fatto l'eroe di ogni strada, `--punti forza,tempra` e `--mani 1|2` per provare un'altra distribuzione o un'arma a una o a due mani), `--passi` (i passi che il giocatore finto fa davvero per piano e per discesa, e quanto globo ridanno), `--mondo` (il mondo aperto coi mostri: il curioso dalla città all'ingresso di ogni dungeon, per strada o passando dalle tane; scontri, domande, svenuti, vita all'ingresso per dungeon: [../sotterraneo/mondo-aperto-mostri.md](../sotterraneo/mondo-aperto-mostri.md#le-misure)), `--tara 2.spinta=5|6,4.forza=1.1` (prova un valore di una discesa, `zona.forzaA12=2` la curva delle zone, `abisso.forza=2` l'abisso, senza toccare i sorgenti; con `|` ogni combinazione), `--torce 40` (si entra in ogni discesa con quaranta torce in più, quindi sempre con la torcia accesa; la riga «agguati» dice quanti scontri cominciano alle spalle: [../sotterraneo/luce.md](../sotterraneo/luce.md)), `--senza-abilita`, `--senza-preparati` (senza gli incanti preparati dal campo, [../sotterraneo/orologio.md](../sotterraneo/orologio.md); `--diag` dice quanti ne lancia e quanti scontri cominciano con uno addosso), e `--contro <commit>` per il «prima → dopo» (`--tara` prova anche `livelli.A=50,livelli.Q=20`, la curva dell'esperienza; le opzioni sono in testa al file; [../sotterraneo/scontro-bilancio.md](../sotterraneo/scontro-bilancio.md)) |
| `npm run taratura` (`-- --presto`, `--cerca`, `--specie`, `--semi N`, `--eroi mago,nano`, `--discese 2,3`, `--giocatori curioso,bravo`, `--tutto`, `--tara 2.spinta=8,3.forza=1.4,livelli.A=40,potenza.gemme=0.5`, `--da K`, `--fino K`, `--rifai`, `--strade armaPrima,beveTutto`, `--semi-strade N`, `--salti` (i prezzi dei salti per livello, la soglia delle risalite e quante pozioni costa un pezzo utile, senza giocare), `--tara risalita.acceso=0,risalita.scaffale=0` (il giro di prima delle risalite; `risalita.rivedi=0` un terzo di tempo in meno; `risalita.perDopo=N` quanti pezzi il giocatore finto tiene in attesa del livello, 2 di difetto), `--riassunto file` / `--contro file` (salva le mediane di un giro e le confronta con quelle di un altro: il «prima → dopo»), `--processi N` di difetto 4) | la taratura del sotterraneo coi giocatori tipo ([../sotterraneo/giocatori-tipo.md](../sotterraneo/giocatori-tipo.md)): il curioso, il bravo e lo sbadato giocano le sette discese di fila col caso dei drop; il rapporto ha una tabella per giocatore e discesa coi bersagli (✅/❌), la roba con cui si entra (le code della fortuna), il perché di ogni scostamento (uniforme, di un eroe, isolato) e la tabella delle specie (il colpo contro l'eroe atteso, in quanti colpi ti stende, esperienza e gemme); dopo i bersagli, a che punto è l'eroe alla fine di ogni discesa (mediana e code, accanto all'atteso; le gemme non spese all'uscita sono un sospetto, non un dato), le risalite dal portale a spendere durante la discesa (quante, quanto spendono, cosa comprano), le armi nuove utili comprate e trovate e le strade di spesa (arma prima, beve tutto) incrociate coi giocatori tipo: dove si ferma chi beve tutto e con che forza arriva ([../sotterraneo/fine-discesa-e-strade.md](../sotterraneo/fine-discesa-e-strade.md)); lo stato di tutte le storie dopo ogni discesa sta in `tmp/taratura/checkpoint-<k>.json` con la firma dei sorgenti (si rifà da sé la discesa toccata e le dopo; `--da K` rigioca da K, `--rifai` tutto, una tappa con `--da 4 --fino 4 --semi 10 --semi-strade 3` dura 3 s); il giro a freddo dura 3–3,5 minuti con le risalite (1 minuto senza: `--tara risalita.acceso=0,risalita.scaffale=0`), da checkpoint meno di un secondo, `--presto` pochi secondi e si ferma al primo bersaglio fuori di molto, `--cerca` cerca per bisezione la spinta e la forza (al più cinque minuti). Non scrive mai i sorgenti: stampa la proposta e il comando `--tara` per verificarla |
| `npm run bottega` (`-- --eroe mago --livello 12 --raro --poi 13 --giro --mercante incantatrice --seme 7 --gemme 500`; `--nudo`, `--finite N` per la roba attesa) | il banco di un mercante stampato per un eroe: cosa ha addosso, e per ogni linguetta i pezzi con livello, rarità, prezzo, di quanto alzano e se sono salti o sogni; `--poi` il banco dopo essere salito di livello, `--giro` dopo una discesa finita ([../sotterraneo/bottega.md](../sotterraneo/bottega.md)) |
| `node strumenti/regali-castello.mjs` | a che ondata cede ogni libera con N regali |
| `node strumenti/valida-percorsi.mjs` | le carte del castello, passate ai raggi X |
| `node strumenti/simula-castello.mjs --sole div` | le tappe con una torre sola dovunque si può, dal metro e dal pigro |
| `npm run quiz:banco` | tutti i moduli di quiz, mille domande a testa |
| `npm run quiz:eta` | chi vede cosa: la calibrazione per età, e i buchi |
| `node strumenti/generale/piani.mjs` | il simulatore dei piani del Generale |
| `node strumenti/passo-passo/minimi.mjs` | le strade più corte di Passo passo, messe alla prova |
| `node strumenti/passo-passo/sentiero.mjs` | i sentieri senza fine di Passo passo: mille posti per famiglia, il programma più corto in carte con la mano del bambino (`--mano=`), le mosse, se serve il ciclo o il se, la strada più corta, le forme, il tempo (su più processi; il cane una ventina di minuti) |
| `npm run pianta` (`-- --discesa 3 --piano 0 --seme 12 --zona 20 --png`; `-- --conta --semi 1-30` senza disegnare: per discesa quante stanze ordinarie hanno 0, 1, 2-3, 4+ mostri, la media, gli scagnozzi del grosso, le porte e quante sono storte o impilate, i portoni, le nicchie vuote; sotto, per scena, i tagli e gli angoli interni dei muri obliqui e quanti stanno accanto a una nicchia o a una porta o su un tratto corto; `-- --passi --semi 1-20` i passi di un piano, dritto alla scala e girando tutte le stanze, `--zona 20`, `--per-piano`: [../sotterraneo/orologio.md](../sotterraneo/orologio.md)) | la pianta di un piano del sotterraneo vista dall'alto: le stanze colorate per forma (costruite e di grotta), colonne, nicchie (contorno giallo), relitti (blocchi chiari con l'iniziale), acqua (azzurra), porte, ruoli, i mostri per specie con caporali, appostati e grosso; la famiglia del piano nella prima riga della legenda; in `tmp/piante/` (`--png` vuole `dist/`: prima la build) |
| `npm run pianta -- --mondo` (`--seme 12`; `--semi 1-48` una riga per seme e un foglio di piante ogni sedici, per scegliere il seme; `--scala 8`; `--senza-caratteri`; `--colori`) | il mondo aperto generato (`motore/mondo-aperto.js`): la mappa in caratteri con la legenda, le regioni con la fascia, i passi dei dungeon, le regioni raggiunte a ogni punto della storia, i guasti, la firma contro quella della scheda, i ms; il PNG in `tmp/scatti/mondo-<seme>.png` senza browser né build ([../sotterraneo/mondo-aperto-generatore.md](../sotterraneo/mondo-aperto-generatore.md)) |
| `npm run pianta -- --percorso` (`--seme 9`; `--semi 1-12` una riga per seme e un PNG ciascuno; `--terra 2` le fasce di un'altra terra; `--scala 5`) | il prototipo del mondo a percorso (`strumenti/sotterraneo-percorso/`, fuori dal gioco): la pianta del villaggio in caratteri, i passi da pietra a pietra e dei dungeon, i confini, i guasti, la firma; il PNG in `tmp/scatti/percorso-<seme>.png` con zone, strada, ponti e valichi, cintura, pietre, dungeon, città e il villaggio ingrandito ([../sotterraneo/mondo-a-percorso.md](../sotterraneo/mondo-a-percorso.md)) |
| `node strumenti/sotterraneo-armi.mjs` (`--nome prima`, `--eroi elfa,nano`, `--armi balestra,spada`) | `tmp/armi/campo.png` e `pagina.png`: una tavola con i quattro eroi che tengono ogni aspetto degli archi (e una spada e un bastone, per controllo), sul campo e nella pagina dell'eroe; vuole `dist/` ([../sotterraneo/roba.md](../sotterraneo/roba.md)) |
| `node strumenti/profila-app.mjs '<cheat>'` (`--dist file`, `--contro file`, `--tocca x,y`, `--secondi 12`, `--lento 4`) | dove va la CPU in una schermata: il profilo per qualche secondo, quanto è ferma e le funzioni che pesano (coi nomi veri da `npx vite build --minify false --outDir tmp/dist-chiaro`); `--contro` mette a confronto due file costruiti. Un telefono vero si guarda col telefono collegato in USB e `chrome://inspect` (scheda Performance) |
| `node strumenti/vecchio-telefono.mjs '<cheat>'` (`--cpu 6`, `--zavorra 4`, `--gpu hw\|sw`, `--secondi 15`, `--tocca x,y`, `--esegui expr`, `--dist file`, `--scontro`, `--ritmo expr --ogni ms`, `--fasi expr`, `--spegni a,b+c`, `--profilo N`, `--traccia N`) · `… calibra --log telefono.txt` · `… benchmark [--contro telefono.txt]` | i fotogrammi di un gioco 3D sul Redmi Note 7 imitato (schermo, CPU rallentata, zavorra sulla GPU): fps e p95 per ogni combinazione (`--scontro`: il Sotterraneo 3D in uno scontro, righe «fermo» e «racconto» e il banco della tela; `--spegni` una riga per pezzo di `ACCESI` spento; `--profilo`/`--traccia` dove va il filo principale); si calibra col log della «Misura questo telefono» fatta sul telefono vero (zona dei grandi) → `docs/core/vecchio-telefono.md` |
| `node strumenti/misura-avvio.mjs` (`--lento 4`, `sotterraneo fattoria…`, `--dist file`, `--soglia MB`) | quanto ci mette la home a esserci e quanta memoria d'immagini decodificate tiene ogni gioco ([avvio-e-memoria.md](avvio-e-memoria.md)) |
| `npm run build:sito` · `node strumenti/prova-sito.mjs` (`--rete KB/s`, `--lento N`, `--dist dist --solo-prima`) | il sito in file separati (`dist-sito/`, ignorato da git) e la sua prova: prima visita, poi senza rete, giochi aperti offline ([avvio-e-memoria.md](avvio-e-memoria.md)) |
| `node strumenti/tavola-paesaggi.mjs` (`npm run paesaggi`) | la tavola dei paesaggi del Sotterraneo 3D: una foto per paesaggio dal file costruito (`#sotterraneo3d=1&scenario=…&stanza=grande&luce=stanza`, i mostri tolti), affiancate col nome, le chiamate e i triangoli, in `tmp/scatti/tavola-paesaggi.png` (le singole in `tmp/scatti/paesaggi/`); `--grigio` in scala di grigi, `--solo grotta,neve`, `--stanza corridoio`, `--alle-botti` (l'eroe nella prima stanza con le botti da rompere), `--mostri --con '&sotterraneo=branco&mostri=3'` per lo scontro, `--discesa`, `--seme`, `--nome` ([../sotterraneo/paesaggi-3d.md](../sotterraneo/paesaggi-3d.md)) |
| `node strumenti/scatta-app.mjs <schermata>` | un PNG dell'app servita da Vite (`--porta`), o del file costruito (`--dist`); `--tocca`, `--attesa`, `--larghezza`, `--nome`; `--domanda :ing:buco,tabelline:3` apre dalla palestra dei grandi le domande dei quiz (un pezzo di `data-prova`, la prima riga trovata) e fa uno scatto ciascuna (`<nome>-1.png`…); la schermata è un indirizzo coi [cheat](#i-cheat-dellindirizzo) (`'sotterraneo=branco&mostri=6'`), in `tmp/scatti/`; dice gli errori della console. `--stampa '<espressione>'` scrive quanto vale nella pagina dopo i tocchi (`--stampa 'window.__mate.grafica()'`: il costo di un fotogramma degli asteroidi in 3D; `window.__sotterraneo3d.grafica()` quello del sotterraneo in 3D). `--aspetta 5000` aspetta prima dei tocchi e dello scatto (il 3D ci mette un attimo a nascere); con `--storia` anche dopo la semina: i pensieri dell'eroe sopra vengono da fermo, `--storia 2 --aspetta 5000`; `--esegui '<espressione>'` la valuta nella pagina prima dei tocchi (`--esegui 'window.__sotterraneo3d.corsa.interagisci(window.__sotterraneo3d.corsa.livello.robe.find(q => q.che === "portale"))' --tocca '[data-azione="portale"]'`: il passaggio nel portale senza camminare); `--sequenza 12 --ogni 60` fa dodici scatti di fila dopo i tocchi (`<nome>-1.png`…), per guardare un'animazione fotogramma per fotogramma. `--storia N` apre il sotterraneo sulla terra di sopra con N discese finite e la roba attesa (`--gioco sotterraneo3d` nel mondo 3D di sopra, e lì si usa `--esegui`: `--prima` viene prima della semina; `--eroe`, `--missioni collana:consegnata,…`, `--non-parlato`, `--zaino bastone-magico,elisir-toro` per mettere pezzi in tasca in più, `--punti 3` per lasciare punti da dare; il seme è `test/aiuto/sotterraneo-semina.mjs`), così diario e dialoghi si guardano senza giocare: `--storia 2 --tocca '[data-azione="vita"],[data-scheda="missioni"]'`; un personaggio fuori schermo si tocca col suo click e l'eroe ci cammina (`--attesa 5000`). La crescita è quella attesa (livello e abilità imparate), così il colore dei pallini è quello di un eroe in regola. `--pagina 'strumenti/banco/pannello.html?p=zaino&tema=legno'` fotografa una pagina del server di Vite (un banco) invece dell'app; `--alto` l'altezza della finestra; `--pixel 1.25` il deviceScaleFactor (2 di difetto; 1, 1,25, 1,5 un monitor col suo zoom); `--prima '<espressione>'` la fa nella pagina, e la aspetta, prima dei tocchi (portare l'eroe del mondo di sopra davanti a un posto, aprire la veduta); `--stili '.qz-velo, .qz-velo *'` scrive accanto allo scatto (e a ogni `--domanda`) lo stile calcolato di quegli elementi in `<nome>.stili.json`: due file uguali sono due schermate uguali al pixel (il «prima/dopo» di un ritocco a un componente comune). |
**I banchi sono pagine e vogliono un server**: importano i moduli veri, e
da `file://` Chrome non li carica. `-- --host` per aprirli dal telefono.

## Roba generata

Sta in git e **non si scrive a mano**: i sorgenti hanno `GENERATO` in
testa, e una modifica sparisce senza rumore alla prossima rigenerazione.

| file | lo scrive |
|---|---|
| `src/data/taratura-castello.js` | `npm run tara` — un test confronta una firma e diventa rosso se è stantio |
| `src/giochi/arena/dati/taratura.js` | `npm run tara:arena` — idem, la firma è in `motore/firma.js` |
| `src/data/voci.js`, `voci-es.js` | `npm run voci` |
| `src/emoji/*`, `strumenti/emoji/elenco.json` | `npm run emoji` — `unita/emoji` diventa rosso se un'emoji di `src/` non c'è |
| `src/giochi/fattoria/dati/atlante.js`, `src/giochi/sotterraneo/dati/atlante.js` | `atlante.py` |
| `src/giochi/castello/dati/vestiti.js`, `figure.js` | `vesti.py --atlante` |
| `src/giochi/sotterraneo/dati/terra-mappa.js` | `terra-di-sopra.py` — `unita/sotterraneo-terra` diventa rosso se la maschera o i posti non sono quelli del foglietto |
| `src/giochi/castello/dati/regno.js` | `regno-castello.py` — `unita/castello-regno` diventa rosso se il foglietto è cambiato dopo |
| `src/giochi/passo-passo/dati/isole-mappa.js`, `zaino-mappa.js` | `isole-passo-passo.py` — `unita/passo-passo-valle` diventa rosso se il foglietto è cambiato dopo |
| `src/components/home/copertine-dipinte.js` | `copertine.py` |
| `src/giochi/arena/dati/caserme-dipinte.js` | `caserme-arena.py` |
| `src/giochi/sotterraneo/dati/aspetti.js` (e il blocco `__aspetti` dei foglietti) | `roba.py --gioco` — `unita/sotterraneo-rarita` diventa rosso se non è quello del catalogo `roba.json` |
| `docs/apprendimento/livelli-delle-domande.md` | `npm run quiz:livelli` |
| `docs/img/*` | `npm run scatti` |

Per gli atlanti non c'è una rete: se ne accorge l'occhio.

## I cheat dell'indirizzo

Si scrivono dopo il `#` e si sommano (`#fattoria-tipo=30&monete=2000`: le
monete tolgono dall'indirizzo solo il loro pezzo, così un ricaricamento non
le raddoppia). Dall'app installata non si scrivono (non ha la barra
dell'indirizzo): si usano dal browser.

Un cheat che porta il nome di un gioco (`#fattoria=40`, `#sotterraneo=roba`)
**apre quel gioco da sé**, anche cambiando solo il `#` (`dallIndirizzo` in
`src/App.vue`). Nei test: non c'è la carta da toccare, e l'indirizzo va tolto
appena dentro (la fattoria lo fa da sé, `azzera` lo toglie sempre; altrove
`history.replaceState`), se no la ricarica seguente (`semina` ricarica) riapre il gioco al
posto della home e `.carte` non arriva.

| cheat | cosa fa |
|---|---|
| `#admin` | la pagina dei trucchi (`views/AdminView.vue`) |
| `#monete=500` | monete al bambino attivo, anche a gioco già aperto; `#monete=-100` le toglie, mai sotto zero |
| `#pin=1234` | rimette il codice dei grandi |
| `#fattoria=40` | alza il livello della fattoria (non lo abbassa mai), il prato resta |
| `#fattoria-tipo=30` | mette una fattoria già giocata di quel livello (1–99, `giochi/fattoria/motore/tipo.js`); **butta quella del bambino attivo** nel cestino: si usa con un bambino di prova |
| `#stagione=natale` | la fattoria a Natale (o `halloween`) fuori stagione |
| `#eroe=mago&giu=3` | il sotterraneo con quell'eroe, già giù in quella discesa (l'indice della storia, o `abisso`): con gli altri cheat qui sotto una schermata si guarda senza camminare (`node strumenti/scatta-app.mjs 'sotterraneo=branco&mostri=6&eroe=mago&giu=1' --dist`) |
| `#torcia=accesa` | il sotterraneo (2D o 3D) con la torcia piena e una di scorta; `sgoccioli` l'ultima stanza dell'ultima, `spenta` al buio; con `&verso=sx` (o `dx`, `su`, `giu`) l'eroe guarda di là, come dopo un passo ([../sotterraneo/luce.md](../sotterraneo/luce.md)) |
| `#sotterraneo=roba` | si scende equipaggiati; con `&mano=arco-corto@7.m.att` solo quell'arma in pugno (anche se la classe non la porta), niente scudo, armatura e anello |
| `#bottega=armaiolo&livello=12&roba=rara&gemme=800` | apre subito quel banco (`armaiolo`, `incantatrice`, `erborista`, `rigattiere`; `&scheda=difese`), con l'eroe a quel livello (**senza `&livello=` lo riporta al livello 1**) e un raro per posto (`roba=rara`), niente addosso (`roba=nuda`) o la roba attesa dalla storia; `&zaino=pozione,ampolla-vita` mette solo quelle cose in tasca; ci si guarda la bottega senza camminare (`node strumenti/scatta-app.mjs 'eroe=cavaliere&bottega=armaiolo&livello=12&roba=rara&gemme=800' --dist`) |
| `#sotterraneo=branco&mostri=6` | (fino a sette) si scende e si apre subito uno scontro con quei mostri attorno (`&grosso=ossuto`, `&agguato=1`, `&sorpresa=1`, `&tipo=goblin`; `&tipo=scheletro,zombie` a giro; `&variante=guerriero,arciere,mago,semplice&grado=comune,magico,raro,leggendario` scelgono le varianti armate e i gradi, a giro ([../sotterraneo/varianti.md](../sotterraneo/varianti.md)); `&campo=1` li lascia addormentati sul campo a due o tre caselle, senza scontro, e `&campo=sveglio` li fa venire; con `&stanza=sala&seme=11` una stanza con luce) |
| `#preparati=1` | con `sotterraneo=1&eroe=mago&giu=2`: l'eroe impara gli incantesimi che si preparano dal campo, ha il globo pieno e li lancia (`&preparati=scudo-arcano,rovi` solo quelli, `&preparati=impara` li impara e basta); con `&sotterraneo=branco&mostri=3` lo scontro comincia già protetto ([../sotterraneo/orologio.md](../sotterraneo/orologio.md)) |
| `#abisso=12` | l'abisso da quel piano |
| `#seme=812` | il sotterraneo con quel seme, per rivedere una discesa |
| `#mate=5` | apre la tappa 5 della fila degli asteroidi (da 0; `#mate=volo` il volo; `#mate3d=5` lo stesso negli Asteroidi 3D, anche coi giochi in prova spenti), anche chiusa, per guardarla senza giocare: `&livello=7` la nave e (nel volo) il cielo di quel livello, `&vite=1` la nave malconcia, `&madre=1` la nave madre subito, `&nave=scafo:oro,ali:viola,disegno:fiamme,stemma:stella` una vernice solo per guardarla (l'hangar non si tocca), `&tela=2d` il disegno di riserva, `&dpr=2` il 3D a pixel ratio fisso (per le foto: in Chrome senza schermo scenderebbe). `node strumenti/scatta-app.mjs 'mate3d=2&dpr=2' --dist --tocca '.cartello' --attesa 6000` ([../asteroidi/grafica-3d.md](../asteroidi/grafica-3d.md)) |
| `#sotterraneo3d=1` | il Sotterraneo 3D già giù in quella discesa (l'indice della storia, `abisso`, o la chiave di uno dei tredici dungeon del mondo, come `cerchio`: [../sotterraneo/dungeon-che-si-rigenerano.md](../sotterraneo/dungeon-che-si-rigenerano.md)), anche coi giochi in prova spenti; vanno gli altri cheat del sotterraneo (`&eroe=`, `&seme=`, `&stanza=sala&luce=stanza`, `&sotterraneo=branco&mostri=3`, `&piano=`, `&abisso=12`), più `&dpr=1` (il pixel ratio fisso, per le foto), `&tela=niente` (finge un telefono senza WebGL), `&pensieri=no` (niente pensieri dell'eroe, anche nel 2D: [../sotterraneo/pensieri.md](../sotterraneo/pensieri.md)), `&spegni=nebbia,post` (spegne pezzi di `ACCESI`, per misurare quanto costano) e `&scenario=ghiaccio` (la discesa vestita da quel paesaggio, coi suoi numeri: `grotta`, `neve`, `ghiaccio`, `palude`, `tempio`, `miniera` o uno dei quattro del motore; [../sotterraneo/paesaggi-3d.md](../sotterraneo/paesaggi-3d.md)). `node strumenti/scatta-app.mjs 'sotterraneo3d=1&eroe=cavaliere&seme=7&dpr=1&stanza=sala&luce=stanza' --dist --aspetta 5000 --stampa 'window.__sotterraneo3d.grafica()'` ([../sotterraneo/grafica-3d.md](../sotterraneo/grafica-3d.md)) |
| `#sotterraneo3d=mondo` | il Sotterraneo 3D sopra, nel mondo generato (anche coi giochi in prova spenti; `&eroe=cavaliere` salta la scelta), con `&dpr=1`, `&nebbia=no` (la nebbia spenta) e `&senzaeroe` (l'eroe non si disegna), per le foto. Per guardare un posto: `node strumenti/scatta-app.mjs 'sotterraneo3d=mondo&eroe=cavaliere' --dist --aspetta 7000 --prima "window.__mondo3d.vai('pietra:altare')" --stampa 'window.__sotterraneo3d.grafica()'`; `__mondo3d.vai(chiave)` porta l'eroe davanti a un bersaglio (`pietra:forte`, `ingresso:torre`, la chiave di un dungeon), `__mondo3d.porta(x, z)` in una cella ([../sotterraneo/mondo-3d.md](../sotterraneo/mondo-3d.md)). I mostri di sopra: `__mondo3d.porta(90.5, 43.5)` mette l'eroe a cinque passi dalle vespe dei campi (seme 19, cavaliere, giro 0), che si svegliano e aprono lo scontro sul prato; `__mondo3d.vicinoAl(i, d)` a `d` celle dal mostro `i`, `__mondo3d.senzaMostri()` li toglie (le prove che non sono uno scontro); lo scontro sul vecchio telefono in [vecchio-telefono.md](vecchio-telefono.md#lo-scontro) ([../sotterraneo/mondo-aperto-mostri-scena.md](../sotterraneo/mondo-aperto-mostri-scena.md)) |
| `#sotterraneo&tema=legno` | i pannelli del sotterraneo in prova: `legno` (legno e ottone; `pietra` è il nome vecchio e vale uguale), `rilievo` o `attuale` (di difetto), anche nel 3D (`#sotterraneo3d=1&…&tema=legno`); il telefono se lo ricorda ([../sotterraneo/tema-pannelli.md](../sotterraneo/tema-pannelli.md)) |
| `#globi=3d` | col tema dei pannelli, i globi della barra in WebGL (la strada B; `#globi=2d` la A, di difetto); il telefono se lo ricorda ([../sotterraneo/barra.md](../sotterraneo/barra.md#i-globi-vivi)) |
| `#luce=stanza&zoom=2` | con `#stanza=`: tutta la stanza accesa, e lo zoom a 2 (più campo): per fotografare l'arredo senza girare il cono (`node strumenti/scatta-app.mjs 'sotterraneo=roba&giu=1&seme=812&piano=9&stanza=uscita&luce=stanza&zoom=2' --dist --larghezza 560`: la stanza della scala dell'ultimo piano, la più arredata); `&luce=ricordo` la segna solo vista: il cono resta e il resto è memoria, per guardare roba in luce, al bordo e nel ricordo nella stessa foto |
| `#stanza=sala` | il sotterraneo comincia al centro della prima stanza di quella forma (`sala`, `smussata`, `elle`, `tu`, `croce`, `cappella`, `doppia`, e nelle grotte `grotta`, `bilobata`, `galleria`, `antro`) o di quel ruolo (`anticamera`, `uscita`, `tesoro`, `portale`…); `grande` in mezzo alla stanza più grande (lontano dai mostri), `angolo` nel suo angolo in alto a sinistra, `corridoio` nel tratto di corridoio più lungo; `#stanza=relitto`, `acqua`, `nicchia`, `portone`, `al-portale` e `al-scala-su` mettono l'eroe a tre celle dal primo relitto, dalla prima pozza, dalla prima nicchia, dal portone del mostro grosso, dal portale o dalla scala che sale, rivolto verso di lei (per vedere l'ombra che fa); con `#piano=` (da 1) e `#seme=` per guardare un piano ([../sotterraneo/piani.md](../sotterraneo/piani.md), [../sotterraneo/piani-caverne.md](../sotterraneo/piani-caverne.md)) |
| `#ripara` | butta la copia del gioco e la riscarica ([guasti.md](guasti.md)) |
| `#<chiave>` (es. `#fattoria`) | apre quel gioco |

**`#admin`** non ha codice né carta in home: un tasto per cheat, uno per
aprire qualunque gioco anche se in home non c'è, il bambino di prova
(`data-azione="bambino-prova"`), gli interruttori (giochi in prova, tutte le
tappe aperte, il [tasto salta](#il-tasto-salta)) e il codice rimesso a `0000`. **I tasti
scrivono l'indirizzo e portano dove il cheat si legge**, non rifanno niente:
un cheat nuovo si aggiunge lì con una riga (`A_MANO`), se no torna a essere
una cosa da ricordare a memoria. Nei test: `[data-admin]`.

### Il tasto salta

Una leva di `#admin` per chi sviluppa (`data-azione="tasto-salta"`, spenta di
partenza, **del telefono** e non di un bambino: `store/salto.js`, chiave
`tasto-salta`). Accesa, ogni domanda dei giochi ha un piccolo «⏭ salta»
(`components/TastoSalta.vue`, `data-azione="salta"`) che la dà per giusta,
per passare i giochi senza pensare alle risposte. Non c'è segno in home né
testo per i genitori: se ci si dimentica acceso, basta spegnerlo da `#admin`.

- **Un salto non lascia traccia**: niente ripasso (`answer`/`annota`, né
  giusta né sbagliata), niente monete, niente `segna()` né record, la
  fretta e il filotto non si muovono. Nell'evento di `Domanda.vue` c'è
  `saltata: true` (`rispostaSaltata` in `quiz/nucleo/domanda.js`); chi
  ascolta lo guarda prima di pagare o contare.
- **Conta solo come avanzamento**: per andare avanti il gioco lo tratta da
  giusta (la tappa si avvicina, la porta si apre, la carta si prende) e per
  le stelle «senza errori» come una risposta pulita: saltando tutto si vince
  con le stelle piene. Quello che sale è solo ciò che il mondo ha davvero
  (una torre saltata esiste, `totals.torri` sale; una tappa finita si
  registra). Per questo si usa con un bambino di prova.
- **Dove c'è**: la Domanda comune (sotterraneo, Survivors, banco di prova),
  asteroidi, castello (il conto in colonna), bancarella (alla cassa: totale
  e resto), pozioni (la dose), conta gli animali, prima e dopo, codice
  segreto, English ed Español (la domanda di tappa e quelle del libro) e il
  gioco di prima delle lingue. **Dove non c'è**: i giochi dove non c'è una
  risposta da dare ma un piano da costruire (il Generale, Passo passo, Il
  Robot, la fattoria), e la raccolta della bancarella (prendere la merce non
  si sbaglia, si perde solo pazienza).
- Nei test: `[data-azione="tasto-salta"]` in `#admin`, `[data-azione="salta"]`
  nelle domande; `unita/salto`, `integrazione/salto`, `salto-giochi`,
  `salto-sotterraneo`.
