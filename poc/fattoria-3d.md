# La fattoria in 3D (three.js)

Un prototipo per capire se «mi sposto lì e faccio le cose» regge su un telefono: la fattoria vista dall'alto
in 3D, con un eroe che **cammina fino a ogni cosa** e la fa, invece di un tocco che agisce a distanza.
Tutto è modellato in codice (niente sprite, niente immagini: le trame sono canvas), solo three. Non tocca
il gioco vero né il suo profilo: il salvataggio è `localStorage` `poc-fattoria-3d`.

## Come si apre

- File unico per il telefono: `POC=fattoria-3d FUORI=/tmp/fattoria npx vite build -c strumenti/poc-file-unico.config.js`
  → `/tmp/fattoria/fattoria-3d.html`, ~600 KB (157 KB gzip), doppio click o lo si dà al telefono.
- Dev: `npx vite --port 5193 --strictPort`, poi `/poc/fattoria-3d.html`.
- Dalla console: `__f.vai('campo' | 'pasticceria' | 'mongolfiera' | 'recinto')` (l'eroe ci va e fa),
  `__f.salta(ms)` (porta avanti l'orologio di gioco), `__f.monete(n)`, `__f.grano(n)`.

## Cosa c'è

- **Il dito**: un tocco sul prato = l'eroe ci va (percorso a otto direzioni, aggira campi ed edifici);
  un tocco su una cosa = ci va, si gira e la fa; due dita = zoom. **Un dito che scorre sposta la mappa**
  (anche in Costruisci): per andare lontano si guarda in giro, si tocca la destinazione e **il contadino
  corre** (oltre ~9 celle di percorso va a 1,75× e le gambe si fanno più larghe); mentre la mappa è
  spostata compare «⌖ Torna all'eroe», e mandare l'eroe da qualche parte fa tornare la camera a seguirlo.
- **Il campo** (2×2): terra con solchi e cornice di legno, le piante sono istanze che crescono col tempo
  vero (14–32 s nel prototipo) e ondeggiano. Toccando un campo vuoto l'eroe ci va e si apre **«Cosa semini?»**
  con cinque colture che si vedono diverse: 🌾 grano (spighe d'oro), 🥕 carote (radici arancioni a terra),
  🌽 mais (alto, pannocchie), 🍅 pomodori (cespugli coi frutti rossi), 🎃 zucche (basse, grosse, arancioni);
  il menu ricorda l'ultima scelta. L'eroe si china a seminare; per raccogliere **falcia** sul serio: la falce
  compare, tre passate, e ogni tessera si taglia a turno con il suo «+1». Sui campi e sui recinti **non ci
  sono cartelli**: lo stato si legge dal campo stesso (terra nuda, piantine, oro) e dai numeri sui tasti.
- **Il raccolto** va in scorta per coltura (in alto, accanto alle monete); pasticceria, mongolfiera e pecore
  «mangiano» un raccolto qualsiasi, dalla scorta più grande.
- **⚙ opzioni**: tre preset (basso / medio / alto) e gli interruttori che pesano — risoluzione (0,75× … nativa),
  ombre e loro qualità, ondeggio del grano, particelle, alberi, ciuffi d'erba, nuvole, nebbia — più la
  **distanza della telecamera** (di serie 22: si vede una zona intera). In cima fps, fotogramma peggiore degli
  ultimi due secondi, lavoro JS per fotogramma (non la GPU: quella si deduce dal peggiore), draw call,
  triangoli, geometrie e texture, con un grafico dei fotogrammi (verde sotto 16,7 ms, rosso oltre 33).
  **Prove di stress**: «+10 campi» (seminati e maturi) e «+3 recinti» (con pecore) riempiono la mappa, non si
  salvano, «Tutto via» li toglie. «▾» riduce il pannello alle sole statistiche e si gioca sotto.
  «Mostra il rapporto» scrive dispositivo, GPU, fps e impostazioni, da copiare e incollare qui.
- **Posti fissi, unici, da comprare**: la **pasticceria** e la **mongolfiera** (le si caricano 2 raccolti,
  parte davvero, sparisce in cielo e torna con una cassa: 2 🧶). Finché non si comprano si vedono come
  fantasmi trasparenti col prezzo; toccarli porta l'eroe davanti alla porta e chiede.
- **Il menu della pasticceria**: toccandola (comprata) l'eroe va alla porta e si apre un foglio con
  **cinque ricette**, ognuna con i suoi raccolti e il suo tempo: 🍞 pane (2 🌾, 6 s), 🍿 popcorn (2 🌽, 8 s),
  🍰 torta di carote (2 🥕 + 1 🌾, 10 s), 🍕 pizza (2 🍅 + 1 🌾, 12 s), 🥧 torta di zucca (2 🎃 + 1 🌾, 14 s).
  Gli ingredienti si vedono come `3/2` (verde se bastano, rosso se mancano) e «＋ Prepara» è spento finché
  non ci sono. Il **forno ha tre posti** in coda: si scalano gli ingredienti subito, si cuoce **uno alla volta**
  (il successivo parte quando finisce il precedente, anche a pagina chiusa), ogni posto mostra la sua barra.
  Finito, il prodotto aspetta nel forno finché non si preme «Ritira tutto» e passa in **dispensa** (in alto,
  accanto alle monete). Sopra la pasticceria un cartello dice `🔥 12s · 2/3` o `🍕 1 pronto!`, e il camino
  fuma finché c'è qualcosa in forno. I prodotti per ora non servono a niente: sono il materiale per gli
  **ordini** (chi li chiede, a chi si danno), da decidere.
- **Una sola zona, a lotti, chiusa da un recinto**: il mondo è una griglia di 7×6 lotti da 4×4 celle. Parti
  con un quadrato di 3×3 lotti, circondato da un **recinto basso** di legno: **fuori non si cammina** (i lotti
  non tuoi sono erba alta scura con cespugli e sassi). Si compra solo un lotto che **confina** con uno tuo
  (il prezzo sale a ogni lotto: 40, 60, 80…); toccarlo apre la conferma, e comprando il recinto si sposta.
  Il cartello `🪙 40` compare solo sui lotti acquistabili vicini all'eroe (o tutti, in costruzione). **Tutto
  ciò che si tocca in un terreno non tuo apre l'acquisto di quel terreno** (anche un albero), senza messaggi
  sul «fuori zona»; un lotto che non confina dice di comprare prima quelli vicini. Dentro
  il terreno tuo **tutto si può mettere dappertutto** (campi, recinti, bancarelle, fontane, strade); i posti
  speciali sono solo i due edifici unici (pasticceria e mongolfiera), già dentro il quadrato di partenza.
- **Gli alberi si abbattono**: dentro il mondo ci sono alberi sparsi (fuori dal recinto è bosco che non si
  tocca). Toccandone uno nel proprio terreno l'eroe lo raggiunge, alza l'**ascia** (quattro colpi), l'albero
  cade lontano da lui e dà **🪵 2** (in alto, accanto alla lana); la cella torna libera per costruire. C'è
  La legna per ora non serve (da fare: costruzioni che la chiedono).
- **Costruire trascinando**: «🏗 Costruisci» (l'ultimo tasto della barra in basso) apre la barra delle
  carte. Si **trascina una carta dalla barra fino alla mappa** (verso l'alto; di lato scorre la barra) e al
  rilascio il pezzo è costruito; durante il trascinamento un fantasma verde o rosso mostra dove andrebbe,
  un po' più su del dito. **Se non è ancora pagato, la conferma d'acquisto compare appena si comincia a
  trascinarlo**; comprato, sta nel **magazzino** (`📦 ×1` sulla carta) e si trascina quando si vuole. Un
  rilascio non valido non perde niente. Un pezzo già messo si riprende trascinandolo: rilasciato altrove si
  sposta (🪙 1), rilasciato sulla barra torna nel magazzino (🪙 1; non un campo che cresce né il recinto con
  le pecore). Dopo ogni mossa «↶ Annulla». Si chiude con la ✕ in alto a destra. I chip Vicino / Tutto
  cambiano la vista (attorno all'eroe, o tutto ciò che è tuo); due dita zoomano e fanno scorrere.
- **Tieni premuto per spostare o mettere via**: anche fuori da Costruisci, tenendo il dito mezzo secondo su un
  pezzo già messo (campo, recinto, bancarella, fontana) il pezzo si solleva, il telefono vibra, compaiono la
  griglia dei terreni e una fascia in basso «📦 rilascia qui per mettere via». Senza staccare il dito: sulla
  mappa si sposta (🪙 1), sulla fascia torna nel magazzino (🪙 1). Un rilascio non valido lo lascia dov'era.
  Pasticceria, mongolfiera e terreni non si spostano. Muovere il dito prima del mezzo secondo è un tocco
  normale (o la camminata): niente si solleva per sbaglio.
- **Strade disegnate dal bambino**: lo strumento 🛣️ si trascina sul terreno (🪙 1 a pezzo, non si può sopra
  cose o alberi), 🧽 toglie quelle disegnate (quelle di serie restano). In strada l'eroe va più in fretta
  (6,6 contro 4,8) e il percorso le preferisce: disegnare serve a qualcosa.
- **Azioni rapide** (barra in basso: ✋ Libero, 🌱 Semina, ✂️ Raccogli, 🏗 Costruisci): **solo semina e
  raccolta hanno bisogno di essere armate**, perché toccare un campo non dice se si vuole seminare o
  tagliare. Si arma l'azione (la semina chiede la coltura una volta, e la mostra sul tasto) e poi basta
  toccare i campi: ogni tocco entra in **coda** (anello giallo sul terreno), l'eroe li fa uno dopo l'altro
  senza altri menu. «▶ Tutti» mette in coda tutti i campi adatti, dal più vicino. Il numero rosso sul tasto
  dice quanti campi aspettano (vuoti per Semina, maturi per Raccogli). Tutto il resto è **contestuale**:
  toccare un recinto lo cura (tosa, nutre), un albero lo abbatte, la pasticceria apre il menu. Costruisci è
  un tasto come gli altri, non un'azione speciale.
- **Le pecore hanno fasi**: nascono agnelli (piccoli, testa grossa) → dopo **due pasti** diventano adulte →
  l'adulta ha la lana che ricresce (25 s nel prototipo, si vede crescere) → quando è pronta si **tosa**
  (+1 🧶 per pecora, resta rosa e liscia finché la lana non ricresce). Due adulte nutrite due volte fanno
  **nascere** un agnellino (fino a 4 per recinto). Toccando il recinto l'eroe sceglie da solo: prima tosa, poi nutre.
- **Le monete** non si guadagnano qui: il bottone «+50 🪙 (esercizi)» finge gli esercizi degli altri giochi,
  e niente si vende (la regola della fattoria vera, [../docs/fattoria/regole.md](../docs/fattoria/regole.md)).

## I file (poc/fattoria-3d/)

| file | cosa |
|---|---|
| `modelli.js` | tutti i pezzi: campo a istanze, pasticceria, mongolfiera, bancarella, fontana, recinto e pecora, fienile, casa, e l'eroe coi perni per camminare, seminare, falciare; le pecore con le loro fasi |
| `opzioni.js` | il pannello ⚙: preset, interruttori, stress, statistiche e rapporto (non sa nulla del gioco) |
| `main.js` | la griglia, i lotti e le strade, lo stato salvato, la ricerca del percorso, le azioni per ogni cosa e quelle rapide con la coda, il costruire, il dito, la telecamera, l'interfaccia in HTML |

## Cosa dice la prova (da sviluppo, in Chrome con rendering software)

Verificati a schermo con uno schermo da 390×844: semina → crescita → falciatura (+grano), acquisto di
pasticceria e mongolfiera nel loro posto, partenza e ritorno del pallone, recinto piazzato con la griglia
e pecore che danno lana, nessun errore di console. **Non provato su un telefono vero**: i numeri di
prestazioni (fps, batteria, caldo) sono la prima cosa da guardare; la scena è ~100–260 draw call e
~20k triangoli, con una sola ombra a 1024.

## Aperto, se l'idea piace

- Le tappe vere (livelli, bocche che mangiano il raccolto, catena di produzione) e il collegamento al
  profilo come gioco in `src/giochi/` — qui è un'isola.
- Il pixel-art della fattoria di oggi non c'entra più: i modelli in codice qui sono un primo passo, non
  l'aspetto finale (se ne decide uno a parte, come per il castello).
- Ruotare gli edifici liberi; una vista dall'alto «tutta la fattoria» a un tasto; i silos e il baule
  come cose da raggiungere; l'eroe che porta in mano quello che raccoglie.
