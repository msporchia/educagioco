# Gli effetti dello scontro: un segno per ogni abilità

L'utente, 9 ottobre: *«un effetto grafico diverso per ogni abilità: fiamma che esplode, lancia di ghiaccio che gela il mostro,
fulmine che scende, radici che escono dal pavimento, scudo che si forma…»*; 12 ottobre: *«un'animazione speciale per ogni attacco
speciale, più animazioni per lo stun, veleno ecc.»*. La vista dello scontro ([scontro-interfaccia.md](scontro-interfaccia.md)) fa
volare l'azione una cosa alla volta; qui com'è fatto quello che si vede quando l'eroe usa un'abilità, e cosa si vede addosso a chi
subisce. Il codice: `dati/effetti.js` (le famiglie, la scelta dai dati), `viste/racconto.js` (i tempi e cosa posare sul palco),
`scena3d/effetti3d/` e `scena3d/racconto.js` (come si disegna: [mostri-3d.md](mostri-3d.md)), `viste/SegniAddosso.vue` (gli stati che restano), `stile-effetti.css`.

**Disegnato in codice** (modelli 3D di `scena3d/effetti3d/`, nessuna emoji: registro serio, [dialoghi.md](dialoghi.md#le-scritte) per le
parole). Un tocco accorcia tutto, `prefers-reduced-motion` li spegne e restano i numeri.
Niente lampi a tutto schermo: le luci stanno sulle figure.

## Come si sceglie l'effetto

Non uno per nodo scritto a mano: **una famiglia per tipo, scelta dai dati**. `effettoDi(nodo, famiglia)`:

1. se il nodo ha `effetto: '<chiave>'` (dati/abilita.js, una chiave di `EFFETTI`) vale quello: lo scrivono le abilità importanti;
2. se non colpisce: `scudo`→sfera, `parato`→scudo, `intoccabile`→pietra, `specchio`, `cura`/`linfa`→cura, `fermo`→sonno, `debole`→onda
   (su tutti) o nube/blocco;
3. se colpisce: da `forma`, `elemento` e arma. Catena: fulmine→catena, arco→la freccia che trapassa, altro→l'ascia che rimbalza. Arco:
   freccia (veleno o fuoco con la sua scia), pioggia se più bersagli. Da vicino (lama, ascia, scudo, o nessuna arma con fisico o fuoco): taglio,
   urto se stordisce o rompe, croce se sanguina, affondo se passa la difesa, spazzata su più mostri, turbine su tutti. Da lontano per
   elemento: fuoco→palla (esplosione sui vicini, fiammata su tutti), gelo→scheggia (nevicata su più), fulmine→fulmine dal cielo,
   sacro→luce dall'alto, veleno→nube.
4. l'attacco solito: dalla mano (arco→freccia, bacchetta→dardo, altro→taglio).

Un nodo nuovo ha dunque già un effetto da sé, e `guastiDegliEffetti(NODI)` controlla che ogni abilità ne abbia uno che esiste. Le
**aure** (`aureDelNodo`) si posano sull'eroe a parte, anche se l'abilità colpisce: la Danza delle lame fa il turbine e lo scudo, la Fortezza
la cura e lo scudo.

## Le famiglie (`via`) e chi le ha

| via | cosa si vede | effetti (chi) |
|---|---|---|
| vicino | l'eroe si fa sotto, un segno sul mostro | `taglio` (Fendente, le Lame), `croce` (Taglio profondo, Macello, Ferita aperta: due tagli e gocce rosse), `affondo` (Affondo, Carica, Stoccata), `urto` (Spaccaroccia, Martellata, Spallata, Colpo di scudo: anello, stella, schegge), `spazzata` (Spazzata, Mietitrice, Falciata: un arco su tutti i presi) |
| attorno | un turbine gira intorno all'eroe, poi i tagli | `turbine` (Mulinello, Colpo del campione, Tempesta di colpi, le Danze) |
| lancio | un corpo vola dall'eroe e lascia un segno | `palla` (Dardo e Palla di fuoco: vola, scoppia, lo scoppio si propaga ai vicini), `freccia`, `freccia-fuoco`, `freccia-veleno` (finisce in una nube), `trapassa` (una freccia che attraversa tutti), `quadrello`, `scheggia` e `lancia` (ghiaccio che lascia brina), `falce` (Falce di luna) |
| fascio | un raggio dall'eroe al mostro | `fascio` (Raggio di gelo, Raggio arcano) |
| cielo | cade sul mostro dall'alto | `fulmine` (Fulmine: una saetta zigzag), `luce` (Luce sacra, Giudizio, Luna piena: una colonna), `meteora` (Meteora, Colata: sasso in fiamme in diagonale, il palco trema), `pioggia` (Volo di frecce, Freccia del cacciatore, Salva), `massi` (Frana), `brace` (Pioggia di scintille), `nevicata` (Nevicata, Notte gelida, Gelo eterno) |
| catena | salta da un mostro all'altro, un anello dopo l'altro | `catena` (Catena di fulmini: un arco elettrico per anello, il lampo salta ogni ~140 ms), `ascia` (Ascia lanciata: rimbalza girando) |
| terra | esce dal pavimento sotto il mostro | `radici` (Radici, Rovi: crescono dai piedi), `terremoto` (Colpo del titano: crepe, il palco trema) |
| su-chi | nasce sul mostro | `nube` (Spore, Ortica), `esplode` (Esplosione, Carica di polvere), `rogo` (Brucia: fiamme tutto intorno), `blocco` (Prigione di ghiaccio), `sonno` (Ninna nanna: zeta che salgono) |
| onda | parte dall'eroe e attraversa il campo | `onda` (Grido di guerra, Ruggito: tre archi che si allargano), `fiammata` (Fiamma della fucina: un cono di fuoco) |
| su-me | solo sull'eroe, niente da colpire | `scudo` (Scudo alzato, Fortezza), `sfera` (Scudo arcano: bolla con la trama), `pietra` (Pelle di pietra, Montagna: sassi che si raccolgono), `cura` (le cure: croci verdi che salgono), `preghiera` (colonna di luce dorata), `specchio`, `muro` (Muro: mattoni che salgono) |

Un effetto dura al più 800 ms (`EFFETTI[k].dura`, un guasto se di più: un'abilità non deve rallentare il turno); `arrivo` è quando tocca,
`passo` quanto dopo tocca chi sta più lontano dal bersaglio (lo scoppio che si propaga, la catena in fila). Il turno dell'eroe dura quanto il
suo effetto (il fendente ~0,48 s, la meteora ~0,78 s). Il colore è quello dell'elemento (`tintaDelColpo`: fuoco arancio, gelo azzurro,
fulmine viola, veleno verde, sacro oro, fisico acciaio), non quello del ramo, che resta sul nome.

## Cosa fa il racconto

`racconto.js` costruisce l'azione dell'eroe in una volta sola: posa le scene (`fx.scene`, ognuna col suo ritardo CSS) e programma allo stesso
istante le ossa che scendono, i numeri e gli stati che si posano. Le scene hanno `modo`: `volo` (da `da` ad `a`, con angolo e lunghezza misurati
sul palco), `alto` (cade sul mostro), `qui` (nasce lì). L'eroe si muove secondo la famiglia: scatta (vicino), tira indietro il braccio (da lontano),
gira (turbine), resta fermo e brilla (su-me). Chi prende l'abilità sono i `presi` dell'azione (`motore/scontro.js`), anche se non fa danno (Rovi,
Ninna nanna): la scena di quelli senza `colpiti` è solo l'effetto e lo stato.

## Gli stati addosso

Disegnati da `SegniAddosso.vue` sul mostro, e sull'eroe per quello che lo protegge. Restano finché dura lo stato (e restano le pastiglie col numero
dei turni, per contarli).

| stato | si vede |
|---|---|
| stordito (`fermo`) | tre stelle che gli girano sopra la testa |
| avvelenato | bolle verdi che salgono dal corpo, figura verdastra |
| in fiamme (`veleno` di fuoco) | fiammelle sui lati e scintille, figura calda |
| gelato (`gelo`) | brina azzurra e cristalli ai piedi, figura azzurra, **un tremito più lento** (`sot-brivido`); un blocco di ghiaccio se è la prigione |
| sanguina | gocce rosse che cadono |
| bloccato (`esposto`) | radici attorno ai piedi |
| senza difesa (`rotto`) | lo scudo spezzato a fianco |
| fiacco (`debole` senza gelo: Rovi, Muro, Grido) | una freccia che scende sopra la testa, figura smorzata |
| eroe: scudo (barriera) | una bolla con la trama che pulsa |
| eroe: parato | uno scudo davanti, che oscilla |
| eroe: intoccabile | grigio come pietra, sassi intorno |
| eroe: specchio | un lucido d'argento che passa e ripassa |
| eroe: linfa | foglioline verdi che salgono piano |

Gli stati **si posano quando l'abilità arriva**, non subito: il racconto tiene `fx.stati[posto]` (chi aveva già qualcosa, più quello che l'abilità
mette, meno quello che il mostro rifiuta, `statiDelNodo`) perché la verità del motore ha già contato i turni dei mostri (un colpo che stordisce
per uno ha già fatto saltare il turno). A racconto finito torna la verità. `stati.gelo` è un dato che il motore aggiunge a `debole` e `fermo`
quando l'abilità è di gelo: serve solo a disegnare (azzurro, non «fiacco»), non cambia nessun conto.

## Resiste, teme, immune

Parole di gioco, corte, non istruzioni ([dialoghi.md](dialoghi.md#le-scritte)).

- **Prima di rispondere** (scelta preparata): sopra il mostro, in basso a sinistra, un piccolo segno per ogni cosa: il glifo dell'elemento col
  triangolo giù (resiste, grigio) o su (teme, arancio che pulsa); uno stato che non prenderà è il suo glifo barrato. Vengono da `foglio.colpiti`
  (`elemento`, `effetto`, `rifiutati`) con `segniDel`; il `title` dice «resiste al fuoco».
- **Quando il colpo arriva**: chi **resiste** ha il numero piccolo e grigio, la scritta «resiste» col suo scudetto, uno scudetto grigio che rimbalza
  sulla figura, e trema piano; chi **teme** ha il numero grande, arancio, con una stella che scoppia dietro e «lo teme!», la figura si accende e
  trema forte; chi è **immune** a uno stato ha la scritta del suo stato barrato («non gela», «non si stordisce»), una riga sotto l'altra.

## Nei test

`[data-scena]` (`data-corpo`: l'effetto, un div senza dimensioni, si aspetta con `state: 'attached'`), `[data-segno="stordito|veleno|fuoco|gelo|
sanguina|radici|rotto|fiacco"]` e quelli dell'eroe (`scudo`, `parato`, `intoccabile`, `specchio`, `linfa`), `.sa-stella`,
`[data-segni] [data-segno-pre="resiste|teme|immune"]` (`title`), `.sot-numero-resiste`, `.sot-numero-teme`, `.sot-numero-segno`. Quello che compare
dura meno del racconto e sotto carico una foto è lenta: la prova osserva la pagina con un `MutationObserver` e controlla dopo.
`unita/sotterraneo-vista` (la scelta dall'elemento e dalla forma, ogni abilità ha un effetto che esiste, nessun effetto oltre 800 ms, i segni, il racconto di palla, catena, resiste/teme/immune, Ninna nanna, scudo, i `presi` e il gelo del motore) e
`integrazione/sotterraneo-gruppi` (un mago contro melme: palla, catena, prigione; uno stordito; foto `effetti-*` con `--scatti`).
