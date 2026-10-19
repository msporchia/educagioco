# Il mondo aperto: il 3D, le fasi, i rischi

**Una proposta**, il seguito di [mondo-aperto-progetto.md](mondo-aperto-progetto.md) (la struttura e i dungeon),
[mondo-aperto-dati.md](mondo-aperto-dati.md) (il salvataggio) e [mondo-aperto-quest.md](mondo-aperto-quest.md). Qui la
parte tecnica che ne viene, la regola delle cose modellate, le fasi in ordine con i giorni, i test, i rischi e le
domande per l'utente.

## 5. Il 3D del mondo di sopra

### La vista

- **Una vista sua, accanto a quella di oggi**: `viste/Mondo3d.vue` (come dice `grafica-3d.md` del ramo del 3D: «la terra
  di sopra in 3D è una vista sua accanto a `viste/Terra.vue`»), scelta da `Gioco.vue` con lo stesso `in3d`. Il disegno
  in `scena3d/mondo/`, un file per tema, dal prototipo: `terreno.js`, `acqua.js`, `kit.js`, `monumenti.js`, `natura.js`,
  `vita.js`, `nebbia.js`, `veduta.js`, `pezzi.js` (le regioni costruite e buttate), `dito.js`. Figure, contorno,
  etichette, contesto e WebGL sono quelli di `scena3d/` delle discese.
- **La telecamera segue l'eroe** come nel prototipo e nelle discese (52°, la distanza dalla forma dello schermo, il
  pizzico e la rotella), con lo spazio libero misurato sotto le carte e il dialogo come fa oggi `Terra.vue`.
- **La veduta d'insieme è del giocatore**: è la casella «la mappa grande» della barra, sopra ([barra.md](barra.md)); giù
  resta la mappina. Dall'alto si leggono fiumi, ponti, città, i nomi dei posti trovati, le pietre accese e i segni delle
  quest ([mondo-aperto-quest.md](mondo-aperto-quest.md#b-il-giornale-e-la-nebbia)). Un tocco nella veduta manda l'eroe
  lì a piedi (la telecamera torna a seguirlo), non lo teletrasporta; il viaggio istantaneo è delle pietre. Nello
  scontro la veduta non si apre.
- **Sempre giorno**, come nel prototipo. Sopra la luce è il cerchio delle terre selvagge (`RAGGIO_APERTO`): i mostri si
  vedono lì dentro, il terreno dappertutto dove si è stati.

### La nebbia, fatta bene

Il prototipo colora le superfici e lascia case e rocce come sagome bianche. La regola: **quello che non si è visto non
si disegna, e sopra c'è un velo di nuvole**.

- **La maschera è una trama del mondo**, un texel per cella (160×140), sfumata ai bordi come le nuvolette del 2D, letta
  in ogni materiale: lo stesso innesto di `scena3d/maschera.js` delle discese, esteso a terreno, acqua, kit, istanze,
  figure e fiamme. Si riscrive solo quando si scopre una cella, mai a fotogramma.
- **Un oggetto si vede o no tutto intero**: ogni pezzo del kit e ogni istanza porta la cella della sua base (un attributo
  per vertice, uguale per tutta la casa), e il vertex shader lo chiude dove la nebbia è piena; entrando in vista sale
  dal terreno in un attimo, invece di schiarirsi a strati. Niente sagome.
- **Il velo**: sopra le celle mai viste nuvole basse istanziate (una manciata di cartelli di rumore morbido per
  regione), che dall'alto fanno la mappa da scoprire. **Da decidere**: il colore (le nuvole chiare del prototipo, che
  all'utente piacciono, o il nero del 2D); raccomandate le chiare, perché sopra è giorno.
- **Due stati sopra, non tre**: mai visto (nuvole) e visto (pieno). Lo «scuro dove si è stati» del 2D resta delle
  discese; sopra lo fa il cerchio dei mostri.
- **Si salva** come in [mondo-aperto-dati.md](mondo-aperto-dati.md), un bit per cella.

### Il dito

L'utente: il tocco *«non preme bene sui personaggi»*. La regola: **una persona vince sul prato**.

- **L'ordine**: prima i personaggi (chi sta fermo, i mercanti, il minatore, la bacheca), poi gli ingressi e le pietre, poi
  le cose, poi il terreno. Il primo che si prende, vince.
- **Il bersaglio di una persona è il suo rettangolo a schermo allargato** a 72×96 px almeno (oggi un margine di 44 px), e
  un tocco sul terreno entro una cella e mezza dal suo `piede` è un tocco su di lei. Un raggio sul cartello di una figura
  sottile (la guardia con la lancia) la manca facilmente; il rettangolo no.
- **Per i test e per l'accessibilità un elemento HTML per ogni persona** sopra la tela (gli stessi `[data-personaggio]`,
  `[data-mercante]`, `[data-minatore]` di oggi), che segue la figura come le etichette dello scontro 3D. Il tocco passa da
  lì; il raggio resta per il terreno.
- **Il resto come oggi**: soglia di 16 px, si agisce sul `click`, il mouse solo a tasto premuto
  ([../core/il-dito.md](../core/il-dito.md)); un tocco nuovo annulla la meta di prima.

### Le figure pixel accanto al 3D liscio

Si leggono, ma l'eroe accanto a una casa vera sembra un adesivo (il prototipo). Tre strade:

| strada | cosa | quanto | contro |
|---|---|---|---|
| **A. lo sprite ancorato** | ombra morbida a contatto sotto i piedi, contorno scuro sottile, la luce del sole sulla normal map finta (come nelle discese, `scena3d/figure.js`) con un filo di luce di taglio dal lato del sole, scala 1,25 | 1–2 giorni | resta pixel art in un mondo liscio, ma appoggiata |
| B. il mondo più pixel | il mondo disegnato a risoluzione bassa e ingrandito, colori a passi | 1 giorno | cambia lo stile che all'utente piace: no |
| C. persone 3D semplici | il minatore, i mercanti e chi dà le quest a pezzi parametrici come il kit (corpo, testa, cappello, i colori dello sprite), creature e eroe restano sprite | 4–6 giorni | stona l'eroe accanto a loro; l'eroe armato in 3D vorrebbe 238 figure modellate |

**Raccomandata A, subito**; C solo per le persone di sopra, e solo se A non basta guardandola sul telefono.

### Le prestazioni

Il prototipo (112×88, ~450 mila triangoli, ~120 chiamate dal villaggio) non è stato misurato su un telefono vero. Il
mondo è 2,3 volte più grande, quindi **si disegna a pezzi**:

- **Un pezzo è una regione** (32×28 celle): terreno, kit unito per materiale, istanze di natura per regione. Si
  costruiscono quando l'eroe si avvicina (al più una regione per fotogramma, nei ritagli di tempo) e si buttano quando
  sono a due regioni di distanza; restano le nove attorno all'eroe.
- **Si taglia fuori vista** per regione (frustum), e lontano si scende di dettaglio: terreno a metà celle, alberi a
  cono, niente erba né fiori (l'erba c'è solo nelle regioni attorno all'eroe).
- **Un'ombra sola**, la luce del sole con una camera d'ombra piccola che segue l'eroe.
- **La veduta** usa il dettaglio basso di tutte le regioni, senza ombra, senza erba, con le nuvole.
- **I bersagli**, da verificare sul telefono (Pixel 9a e uno più vecchio): sotto le 150 chiamate e i 400 mila triangoli
  nella vista normale, sotto le 100 chiamate nella veduta. Il pixel ratio che si adatta e `ACCESI` sono quelli delle
  discese; il degrado a scalini non c'è (l'utente vuole prima provare).
- **Il peso**: three c'è già; il mondo aggiunge il codice del prototipo (~165 KB di sorgente). Nel sito spezzato sta nel
  pezzo del 3D, chiesto solo entrando nel Sotterraneo 3D ([../core/avvio-e-memoria.md](../core/avvio-e-memoria.md)).

### Le icone dei posti

Oggi le icone dei dungeon sono ritagli della mappa dipinta (`terra-icone.js`) e le usano anche la home e la scelta
degli eroi, che three non lo caricano. **Si fotografano i monumenti in 3D con un comando** (`npm run scatti icone-mondo`,
con `strumenti/scatta-app.mjs`), in WebP piccole dentro un file di dati: niente una tantum, e la home resta senza three.

## 6. Cosa si modella e cosa resta sprite

L'utente: *«per forme geometriche così basilari i disegni sono dannosi»* (le porte con le grate, i ponti). La regola:

- **Si modella in codice quello che è geometria semplice o cambia stato**: porte, grate, cancelli, ponti, pietre del
  viaggio, botti, vasi, casse, forzieri, leve, scale, colonne, altari, lapidi, pozzi, fontane, staccionate, carretti,
  tavoli, panche, scaffali, bancarelle, il portale, i relitti dei piani. Un pezzo è parametrico (misure, materiale,
  usura) e va nel kit del prototipo o accanto a `scena3d/botti.js`. Prima in codice, e dipinto solo se piace e se serve
  ([../core/grafica.md](../core/grafica.md)).
- **Resta sprite quello che ha un viso o è piccolo**: le creature, l'eroe con la sua roba, le persone (salvo la strada C),
  il bottino per terra (gemme, pozioni, armi, curiosità), le icone dell'interfaccia.
- **Dall'atlante 2D diventa sostituibile**, nel 3D soltanto: gli orpelli dell'arredo ([arredo.md](arredo.md)), i relitti
  ([piani-caverne.md](piani-caverne.md)), le porte e i forzieri dei piani, il portale, la fontana, le scale; sopra, tutta la
  mappa dipinta e i suoi ritagli. Il 2D tiene i suoi pezzi: niente si toglie dall'atlante finché il 2D c'è.

## 7. Le fasi

Una fase dà all'utente qualcosa da provare sul telefono (il file presto, a pezzi). I giorni sono di lavoro pieno,
onesti, test compresi.

| # | fase | cosa dà all'utente | giorni |
|---|---|---|---|
| 0 | **Il terreno comune**: il ramo del Sotterraneo 3D unito, `motore/aperta.js` portato dal ramo delle terre selvagge, le decisioni di questo progetto | niente a schermo; il punto di partenza | 1–2 |
| 1 | **Il generatore del mondo** in `src/` (`motore/mondo.js`, `dati/mondo.js`): 5×5 regioni, anelli, confini, tre città, pietre, sette dungeon in fila, antri, strade, guasti, firma; `npm run pianta -- --mondo` | la pianta da giudicare, e il seme scelto | 3–4 |
| 2 | **Il mondo da girare**, senza mostri: `Mondo3d.vue`, la telecamera, il dito con le persone che vincono, le figure ancorate (A), la nebbia vera e salvata, la veduta, il villaggio coi mercanti, dialoghi, bottega, quest di oggi, il portale gemello, i sette dungeon coi nomi nuovi | la storia intera giocabile nel mondo nuovo, coi dungeon 3D di oggi | 7–9 |
| 3 | **Le prestazioni**: regioni a pezzi, dettaglio da lontano, ombra vicina; misure su due telefoni | il mondo che regge sul telefono | 2–4 |
| 4 | **Le città e i passaggi**: il forte e il rifugio, i banchi per mercante, chi cura, il gemello per città, le pietre con la domanda, ponti e valichi chiusi dalla storia | il viaggio alla Diablo | 3–4 |
| 5 | **Le regioni coi mostri**: il motore aperto sul mondo, lo scontro del branco all'aperto in 3D (il palco sul terreno), svenire in città, la superficie lasciata con la ✕ | il mondo pericoloso, le fasce per anello | 6–9 |
| 6 | **Le quest** ([mondo-aperto-quest.md](mondo-aperto-quest.md#e-cosa-si-fa-subito-e-cosa-vuole-mattoni-nuovi)): il dove a regione, i segni nella veduta, caccia e signori, consegna, esplora, trova chi, la bacheca coi modelli, le mappe del tesoro | il mondo con qualcosa da fare dappertutto | 8–12 |
| 7 | **Gli antri**: ingressi a rotazione, uno o due piani, chiavi, Tesori | i dungeon da trovare | 4–6 |
| 8 | **La storia e i nomi**: capitoli per anello, `LUOGHI`, `VOLTI`, dialoghi, le icone fotografate | il racconto che porta fuori | 2–3 |
| 9 | **I salvataggi**: la chiave `sotterraneo3d` e «porta qui il tuo eroe»; il travaso del 2D solo il giorno che il mondo lo sostituisce | provarlo con l'eroe vero | 2–4 |
| — | **La taratura**, segnalata e non fatta qui: banco e giocatori tipo nel mondo, fasce delle regioni, premi | i numeri giusti | 4–6 |

**Fatte: la 0 e la 1** (16 ottobre 2026): il generatore, il seme 19 e cosa la geometria ha cambiato dei passaggi stanno in
[mondo-aperto-generatore.md](mondo-aperto-generatore.md); di `aperta.js` è entrata solo la parte che fa la mappa.

**Fatta la 2** (16 ottobre 2026, [mondo-3d.md](mondo-3d.md)): `viste/Mondo3d.vue` e `scena3d/mondo/` nel Sotterraneo 3D, il dito
con le persone che vincono, le figure ancorate (A), la nebbia vera e salvata (`mondo` nell'avventura, la chiave `sotterraneo3d`
resta la fase 9), la veduta, le tre città coi mercanti, dialoghi, bottega e missioni di oggi, i sette ingressi coi nomi nuovi e il
ritorno, il gemello nella città giusta. Anticipati dalla 3 e dalla 4: i pezzi costruiti e buttati col mondo lontano, l'ombra che
segue, le pietre con la domanda e il viaggio, le grate dei passaggi. Restano della 3 le misure sui due telefoni.

**Fatta la 4** (19 ottobre 2026, [mondo-3d.md](mondo-3d.md#il-capitano-e-la-fontana)): il capitano del forte (lo sprite della guardia, più
alto e col suo blu; dice lui la quinta e la sesta porta, [dialoghi.md](dialoghi.md#il-capitano-del-forte)) e la fontana che cura
([chi-cura.md](chi-cura.md)). Il progetto diceva «la fontana dove manca la guaritrice», ma la guaritrice sta in tutte e tre le città:
la regola vera è che l'acqua prende il posto del pozzo dove manca **una** delle due (guaritrice o incantatrice), e cura vita ed energia
insieme; oggi è solo il forte, che non ha l'incantatrice. I banchi per mercante restano com'erano (il fabbro del forte è quello del
villaggio) e un passo di `integrazione/sotterraneo-mondo` lo prova. Il generatore non è stato toccato: capitano e fontana stanno dove
lui ha già messo la persona e il pozzo.

**Fatta la 8** (19 ottobre 2026, [dialoghi.md](dialoghi.md#i-nomi)): `CAMPAGNA`, `CAPITOLI`, `VOLTI`, le missioni, i dialoghi, le novità e
il resto dei testi dicono i nomi nuovi, per tutti e due i sotterranei (un nome dice l'interno, e il 2D mostra le stesse discese);
la **strada** del minatore no, perché è geografia: `LUOGHI_MONDO` per il mondo aperto, `LUOGHI` resta alla mappa dipinta. Restano da
fare le icone dei posti fotografate dai monumenti (`npm run scatti icone-mondo`): la home e il diario usano ancora i ritagli dipinti.

**Fatta la 6, senza i mostri di sopra** (19 ottobre 2026, [mondo-aperto-quest.md](mondo-aperto-quest.md#fatto-le-taglie-della-bacheca-19-ottobre-2026)):
la bacheca di ogni città appende tre taglie per giro (consegna, esplora, trova chi, mappa del tesoro e, nei dungeon, caccia, mostro col
nome, recupera), con id che si rifanno (`t:<città>:<modello>:<parametro>:<giro>`) e stato in `mondo.quest`; danno gemme (`base × valore
del livello`, tetto 6–40), mai monete né esperienza; tre in mano insieme a parte il tetto dei personaggi; il giro conta un ritorno in
città solo se prima ci si è allontanati di `raggio + 8` celle o si è saliti dal portale. Caccia aperta, signore della regione e tana
restano spenti dietro `MOTORI['mostri-sopra']` con l'aggancio `taglieDaContare` / `taglieDaBattere` + `azioneMissione(id, 'fatta')`.
Restano della 6 le quest scritte a mano per le regioni, la scorta e gli eventi (rimandati), e la taratura delle gemme col banco.

**In tutto 38–57 giorni più la taratura**: due mesi abbondanti di lavoro pieno. Il primo file da provare arriva alla
fine della fase 2 (dodici giorni circa); il mondo pericoloso alla fine della 5. Senza mostri sopra (la scelta più
piccola) la fase 5 sparisce e le quest perdono caccia, signori e tane.

### Chi lavora in parallelo

Dopo la fase 1 il **formato della pianta è il contratto** (cosa dà `generaMondo`: celle, regioni, posti, città, pietre,
antri, strade): da lì più agenti lavorano senza pestarsi i piedi, ognuno coi suoi file.

| chi | file suoi | non tocca |
|---|---|---|
| la vista | `scena3d/mondo/*`, `viste/Mondo3d.vue`, `stile-3d.css` | il motore |
| il motore aperto | `motore/aperta.js`, gli agganci in `corsa.js`, `livello.js`, `scontro.js`, `sosta.js` | la scena |
| le quest | `dati/missioni.js`, `dati/missioni-modelli.js`, `motore/missioni.js`, `viste/Diario.vue` | corsa e scena |
| i testi | `dati/storia.js`, `dati/terra.js`, `dati/zone.js` (`VOLTI`), `dati/dialoghi.js` | il codice |
| le prestazioni | `scena3d/mondo/pezzi.js`, `costanti.js` | il resto |

- **`Gioco.vue` ha un padrone alla volta**: è l'unico file che tutti vorrebbero toccare (oggi 1977 righe). Gli agganci si
  chiedono a chi lo tiene.
- **Un compito chiuso per volta, la build solo nel proprio worktree**, i test unità a ogni commit e il browser prima del
  push, come dice il `CLAUDE.md`.

### I test

- **Nuovi**: `unita/sotterraneo-mondo` (la pianta del seme scelto senza guasti, la firma, gli anelli che salgono con la
  strada, ogni posto raggiungibile dalla piazza, i dungeon in fila, chi sta fermo non chiude strade, ogni passaggio fra
  anelli ha la sua grata, le pietre), `unita/sotterraneo-mondo-salva` (la nebbia in base64, il campo `mondo`, «porta qui
  il tuo eroe», il travaso con la tabella e il caso peggiore), `unita/sotterraneo-quest-modelli`,
  `unita/sotterraneo-mondo-3d` (pura: la maschera, i pezzi da costruire, il bersaglio delle persone),
  `integrazione/sotterraneo-mondo` (col dito vero: il tocco su una persona sottile, la veduta e il tocco lì, la nebbia che
  si apre e si ritrova, una pietra accesa con la domanda, il viaggio, il gemello nella città giusta, quanto costa).
- **Da adattare**: `unita/sotterraneo-terra` (le stesse prove sulla maschera generata: raggiungibili, chi sta fermo, il
  gemello, la fila), `unita/sotterraneo-missioni` e `-storia` (i requisiti nel mondo), `unita/sotterraneo-zone` (i volti
  nuovi), `integrazione/sotterraneo-terra`, `-mercanti`, `-missioni`, `-portale`, `-avventure` (il 3D li vuole sui bersagli
  HTML sopra la tela; `camminaVerso` e `scendiNelSotterraneo` di `test/aiuto/browser.mjs` imparano il mondo).
- **I banchi**: `npm run pianta -- --mondo`; il banco del sotterraneo con un curioso che attraversa le regioni prima
  di scendere (la fase della taratura).

## 8. Rischi e domande per l'utente

I rischi: **le prestazioni** su un telefono vecchio (il mondo non è mai stato misurato su uno vero); **le creature di
superficie** che il catalogo non ha (dieci regioni senza abitanti propri); **la taratura** che il mondo invalida tutta
(la storia, le zone, le missioni); **il dito sulla tela** nei test (oggi tutto è DOM); **il tempo**, due mesi.

**Le decisioni dell'utente, 16 ottobre 2026** (il progetto è approvato con queste; sotto, le domande come erano):

1. **Mostri anche sopra**: sì.
2. **3D e 2D con l'eroe separato**: per ora sì (chiave `sotterraneo3d`, «porta qui il tuo eroe»), «tanto ne rimarrà solo uno»: il 3D è destinato a
   sostituire il 2D, quindi si progetta perché l'unione finale sia facile (stessi dati, nessuna scelta che la blocchi).
3. **Pietre del viaggio con una domanda**: sì, una volta.
4. **Dopo la storia ruotano le regioni**: no; «forse possiamo semplicemente espandere il terreno»: aperto, da riprendere quando c'è il mondo da girare.
5. **Gli antri a rotazione**: «vedi sopra»: aperto, collegato al punto 4 (rotazione o terreno che si espande).
6. **Svenire sopra**: sì come proposto, ma **non si perdono gli oggetti epici e leggendari**.
7. **Le quest danno gemme** (non esperienza): sì.
8. **Il giro del mondo conta i ritorni in città**: sì.
9. **Persone come sprite ancorati (A)**: sì.
10. **Il fabbro del forte è lo stesso del villaggio**: sì.

Le domande, ognuna con la raccomandazione:

1. **Mostri anche sopra, o mondo sicuro coi mostri solo nei dungeon?** Sopra: senza, le fasce degli anelli non vogliono
   dire niente.
2. **Il 3D e il 2D condividono l'eroe?** No mentre è in prova: chiave `sotterraneo3d` e «porta qui il tuo eroe».
3. **Le pietre del viaggio si accendono con una domanda?** Sì, una volta; il viaggio è gratis.
4. **Dopo la storia ruotano anche le regioni, come le zone?** No: ruotano i sette, le regioni restano ferme e gli antri
   prendono la fascia verde.
5. **Gli antri si aprono a rotazione o sono sempre aperti?** A rotazione, a ogni ritorno in città.
6. **Svenire sopra**: risveglio nell'ultima città o pietra, metà delle gemme, tasche vuote, nessun tetto.
7. **Le quest danno esperienza?** No: gemme, roba, monete; l'esperienza resta dei mostri.
8. **Il giro del mondo conta i ritorni in città o i giorni veri?** I ritorni: il telefono posato non fa girare niente.
9. **Le persone: sprite ancorati (A) o 3D semplici (C)?** A subito, C solo se A non basta.
10. **Il fabbro del forte è lo stesso del villaggio (stesso banco)?** Sì: il salvataggio della bottega non cambia.

### Le voci per da-fare.md

Da aggiungere a [da-fare.md](da-fare.md) quando il progetto è deciso (non scritte lì):

- Scegliere il seme del mondo guardando la pianta (5×5 regioni, 160×140 celle).
- Il foglio di creature d'aperta campagna (orsi, briganti, avvoltoi…) per le regioni senza abitanti.
- ~~Rinominare i sette dungeon e riscrivere `VOLTI`, `LUOGHI`, `CAPITOLI` e i dialoghi sulla geografia nuova.~~ Fatto (fase 8).
- Le figure ancorate (ombra, contorno, luce di taglio) e guardarle sul telefono.
- La nebbia che non disegna quello che non si è visto, e il velo di nuvole.
- Il bersaglio delle persone allargato e la loro priorità sul prato.
- Le icone dei posti fotografate dai monumenti con un comando.
- Misurare il mondo a pezzi su due telefoni veri.
- Ritarare la storia, le zone e le missioni col curioso che attraversa le regioni.
- I personaggi nuovi delle città (cacciatrice, carovaniere; il capitano c'è) e la bacheca, prima in codice.
- Scorta ed eventi di mondo, dopo le quest semplici.
