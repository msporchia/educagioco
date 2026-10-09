# L'albero delle abilità

Perché i quattro eroi si giocano diversi: con le caratteristiche sole ogni
numero finiva in due conti (quante risposte per un mostro, quanto male a
risposta), e alzare la forza conveniva a tutti. L'utente, 9 ottobre 2026:
un albero da scegliere, abilità che danno qualcosa (veleno, gelo,
protezione, colpo migliore), da preparare prima di rispondere senza fermare
il ritmo, legate alle armi che si hanno in mano.

Il codice: `dati/abilita.js` (i rami, i nodi, l'energia), `motore/abilita.js`
(i punti, le caselle, cosa si può imparare e perché no), `motore/corsa.js`
(`prepara`, `perchéNonUsi`, `usaAbilita`, `rispostaScontro`, `botta`),
`motore/corredo.js` (`sempre`, `ha`, `haLArma`, `energiaMax`),
`viste/PaginaAbilita.vue`, `viste/CaselleAbilita.vue`, `viste/Medaglione.vue`,
`viste/Glifo.vue` e `viste/glifi.js` (le icone).

## L'albero

- **Tre rami per classe, quattro gradini per ramo**, che si aprono ai
  livelli 2, 4, 8 e 12 (`GRADINI`). Il nodo sopra nel ramo va imparato
  prima: è quello che fa un albero.
- **Un punto per livello dal 2** (`PUNTI_ABILITA_PER_LIVELLO`), separato dai
  punti delle caratteristiche. Al 12, dove finisce la storia, undici punti
  per dodici nodi: non si prende tutto, e le zone dopo la storia hanno
  ancora qualcosa da comprare.
- **I gradi non hanno tetto** (l'utente: al livello 50 c'è ancora qualcosa
  da fare con le abilità). Ogni grado vuole due livelli sopra il gradino del
  nodo (`LIVELLI_PER_GRADO`) e alza i numeri, non cambia cosa fa. I primi tre
  sono scritti nel nodo; oltre si cresce a metà del passo fra il secondo e il
  terzo (`n` in `dati/abilita.js`), e gli scambi restano interi. Da
  analizzare perché non diventino troppo forti; sotto il nome, tre gemme e il
  numero quando si va oltre.
- **Due tipi di nodi.** Le abilità (quadrate) costano energia e vanno nelle
  caselle dello scontro; quelle che «valgono sempre» (tonde) non occupano
  caselle. Il primo gradino di ogni ramo è un'abilità: al livello 2 c'è
  qualcosa da toccare.
- **Un ramo può volere un'arma** (`arma` del ramo): l'arco per le frecce, la
  bacchetta per il fuoco e il gelo, lo scudo nella mancina per il ramo dello
  scudo. Senza, l'abilità non si prepara e la casella dice cosa manca («ci
  vuole un arco»); i nodi «sempre» del ramo non valgono. L'elfa con la spada
  colpisce lo stesso: è il suo ramo dell'arco che resta fermo.
- **Ogni classe sa difendersi al livello 2 e curarsi entro il 4** (regola
  dell'utente, 9 ottobre): un'abilità di difesa nel primo gradino di un ramo
  che non vuole armi (Preghiera, Rovi, Scudo arcano, Pelle di pietra) e una
  cura nei primi due gradini (Preghiera, Linfa, Fonte arcana, Rune di
  guarigione). `guastiDelleAbilita` la controlla (`difende` e `cura` sui nodi).
- **Gli id dei nodi sono chiavi del salvataggio** (`crescita.albero`), come
  quelli dello SRS: non si rinominano.

| | ramo 1 | ramo 2 | ramo 3 |
|---|---|---|---|
| 🛡️ Cavaliere | ⚔️ Lama (spada o ascia) | 🛡️ Scudo (scudo in mano) | ❤️ Giuramento |
| 🧝 Elfa | 🏹 Arco | 🗡️ Lame (spada) | 🌿 Bosco |
| 🧙 Mago | 🔥 Fuoco (bacchetta) | ❄️ Gelo (bacchetta) | ✨ Arcano |
| 🧔 Nano | 🪓 Ascia | 🏹 Balestra (arco) | ⛰️ Pietra |

Il mago ha una famiglia d'arma sola: i suoi rami sono elementi. I nodi uno
per uno, coi numeri, stanno in `dati/abilita.js`: la riga `fa(g)` di ogni
nodo è anche quella che legge il bambino, e non ha emoji.

## Le icone sono disegnate in codice

Niente emoji nell'albero (l'utente, 9 ottobre: «non sono per niente
adeguate»): ogni nodo e ogni ramo ha un `glifo`, un disegno vettoriale in
`viste/glifi.js` (pieni, tratti, ombre e riflessi in un quadrato 24×24), e
ogni ramo una `tinta`. Il **medaglione** (`Medaglione.vue`) mette il glifo su
un fondo del colore del ramo, dentro un anello d'oro: **gemma a otto lati**
per le abilità da usare, **tondo** per quelle che valgono sempre; chiuso è
ferro e grigio, pronto da imparare pulsa d'oro, preso è acceso del suo
colore. Gli stessi glifi fanno l'energia (il cristallo blu) e gli stati dello
scontro (la goccia del veleno, il fiocco, le stelle). Sono la prima mano (prima in codice, poi dipinto, come la cornice della
[barra](barra.md)): quando l'albero piace si fanno dipingere con la stessa forma.

## L'energia

- **Otto più l'intelligenza** (`ENERGIA`, `energiaMax`): il mago parte da
  tredici, l'elfa da dieci, il cavaliere e il nano da nove, e alzare
  l'intelligenza alza il globo ([livelli.md](livelli.md#le-quattro-caratteristiche)).
  Un'abilità costa **per il gradino del suo posto nel ramo** (`COSTO_DEL_GRADINO`:
  5, 6, 7, 9): nessuna più di nove, l'energia di chi ne ha meno. Si scende con
  l'energia piena, come con la vita.
- **Si riempie piano, solo rispondendo giusto**: un punto ogni **due** risposte
  giuste (`RISPOSTE_PER_ENERGIA`), dovunque (porte, forzieri, fonti, mostri),
  dopo aver pagato l'abilità. Sbagliare non la toglie. L'utente, 9 ottobre:
  *un'abilità non si usa a ogni scontro, e non ne avanza*. Misurato a mano: il mago
  vince un mostro in 1–2 risposte nelle prime discese e in 5–6 in fondo, quindi
  una da 5 si ripaga in due-cinque scontri, e le prime due sono già pagate
  dall'energia di partenza. In più la fonte la riempie tutta, la pozione blu
  (`pozione-blu`, dall'erborista e nei forzieri) ne dà otto, e il Respiro
  del bosco la ridà battendo i mostri. **Da fare:** misurarlo col banco, una strada
  per classe.
- **Mai col tempo**: sotto una domanda l'orologio è fermo, e una ricarica a
  tempo premierebbe chi legge piano o posa il telefono. È la ragione per cui
  la torcia si conta a stanze ([roba.md](roba.md)).
- Sta nella sosta (`energia`): riprendendo si ritrova com'era.

## Nello scontro

- **Lo scontro è in due fasi** (l'utente, 9 ottobre): prima si sceglie cosa fare, poi compare la domanda per quel colpo, a
  ogni scambio. La scelta (`CaselleAbilita.vue`) è un elenco con bordi d'oro: «Attacco» in cima («fai 6 di danno»), le tre
  abilità col costo e quello che fanno **contro questo mostro, coi numeri veri** (`Corsa.descrizione`: «fai 6 di danno · poi 3 a turno
  per 3 turni»), poi **«Bevi una pozione»** e **«Scappa via»** col loro prezzo. Un tocco sceglie e va avanti; per i primi 320 ms il
  tocco non conta (il click lasciato dalla risposta). Un'abilità senza energia o senz'arma resta grigia e dice cosa manca. Sopra la
  domanda resta la riga della scelta fatta. Chi non ha abilità vede comunque Attacco, bere e scappare. L'energia non si ripete:
  la dice il globo blu.
- **Il duello** (`Scontro.vue`, `Palco.vue`), alla Monkey Island: l'eroe a sinistra e il mostro a destra, grandi, sul fondale
  vero dello scenario (la parete e il pavimento delle stanze, dallo stesso foglio del campo). Del mostro si vede solo la barra della
  vita in alto a destra, **senza numeri** (il brivido di non sapere quanto resiste); la vita dell'eroe sta nel globo. A ogni
  scambio chi colpisce scatta in avanti, chi è colpito trema, salgono i numeri del danno; un'abilità fa volare il suo glifo dall'eroe
  al mostro, del colore del suo ramo; gli effetti che durano stanno addosso al mostro (fiamma, brina, stelle, goccia) e ne
  cambiano il colore, e lo scudo dà un alone all'eroe. Lo scambio ha un ordine, per leggerlo (`Scontro.vue`, i ritardi in
  `stile.css`): l'eroe colpisce (0 s: da lontano vola l'abilità o una freccia/scintilla, da vicino si fa sotto e lampeggia il
  fendente), il mostro incassa e il numero sale (0,3), il mostro risponde facendosi sotto (0,65), l'eroe incassa col graffio
  rosso (0,95). **Scudo e cura non colpiscono**: niente scatto, solo un alone del colore dell'abilità sull'eroe. La cornice è
  quella delle finestre dell'eroe e del fabbro (`Cornice.vue`, senza ✕).
- **Rispondendo giusto parte**, e si paga. **Sbagliando resta pronta e non
  costa**: un'abilità non è un modo di perdere di più quando si sbaglia.
  Non passa da uno scontro all'altro.
- **Ogni abilità è il colpo solito più qualcosa**: `per` volte il colpo, e
  l'effetto. Prima gli effetti, poi il colpo: Spaccaroccia toglie la difesa
  al colpo stesso che la toglie.
- **Gli effetti si contano a scambi**, e contano anche quello in cui
  arrivano. Sul mostro: veleno (metà colpo a ogni scambio, **anche
  sbagliando**), gelato (colpisce a metà), stordito (non colpisce, neanche
  sbagliando: salta il colpo che lo stordisce e poi i suoi N), senza difesa.
  Sull'eroe: parato (rispondendo bene nessun graffio), scudo che assorbe,
  intoccabile, specchio, linfa. Si vedono come pastiglie sotto la vita del
  mostro e sotto quella dell'eroe.
- **La stanza intera** (Turbine, Pioggia di frecce, Palla di fuoco…): lo
  stesso colpo e gli stessi effetti a tutti i mostri della stanza; chi
  cade dà esperienza e bottino come sempre.
- **«ti graffia 2 · se sbagli 4»** dice quello che arriva davvero, con gli
  effetti (`botta`). Lo stop del pericolo conta lo stesso numero.
- **Le parole** (l'utente, 9 ottobre): si parla di danno e di turni, mai di «scambi» o «mezzo colpo»: «fa il doppio del danno»,
  «il mostro arde: metà del tuo danno a ogni turno, per 3 turni», «protezione dai danni per 2 turni». Il nome dell'abilità sta già
  sopra la riga, quindi la riga dice solo l'effetto. Nello scontro i numeri sono quelli veri.
- **La riga dell'attacco ha una voce per fonte** (`Scontro.vue`, `data-scambio`): «fai 10 di danno (il tuo colpo di 5 ×2)», «altri 3 di
  danno a ogni turno», «subisci 1 di danno (il gelo gli dimezza il colpo)», o perché non subisci niente (stordito, invulnerabile,
  la barriera). I dati li porta l'esito di `rispostaScontro` (`base`, `volte`, `salvo`, `gelato`, `assorbito`).
- **Il primo tiro** (elfa, con l'arco): la prima risposta giusta di ogni
  scontro arriva da lontano, e il mostro non risponde.
- **L'ultimo fiato** (cavaliere): una volta per discesa, invece di svenire si
  resta a 1.
- **Le abilità servono solo negli scontri.** Provato a pensarle sul campo
  (frecce da lontano, mostri congelati per passare): sarebbero un modo di
  saltare le domande.

## La barra e le pagine

La barra cambia così ([barra.md](barra.md)): l'esperienza diventa una riga
sopra le caselle col livello a sinistra (il tasto della pagina dell'eroe), e
il globo di destra è l'energia, blu. Il globo è un tasto: apre l'albero, e
porta il «+» d'oro quando ci sono punti da imparare. L'albero è una delle
tre schede della finestra dell'eroe, con lo Zaino e l'Eroe
([barra.md](barra.md#la-finestra-delleroe)).

Nella pagina dell'albero, che è epica e non una tabella (l'utente): in cima
«Nello scontro» con le tre caselle. **Una casella si tocca e si sceglie cosa
metterci**: sotto compaiono le abilità che si sanno (e «vuota»), oppure si
tocca il medaglione nell'albero; un'abilità che stava in un'altra casella si
scambia di posto (`metti`). Provato un tasto «Porta/Togli dallo scontro» nel
riquadro del nodo: poco epico. Sotto i tre rami ognuno col suo
**stendardo** (il colore del ramo, il glifo, il nome e l'arma che vuole) e i
quattro medaglioni legati da una **catena** che si accende d'oro quando il
nodo sopra è preso; i gradi sono tre gemme sotto il nome, e un nodo che
aspetta il livello lo dice («livello 8»). In fondo il medaglione toccato con
cosa fa adesso e al grado dopo (senza «Fa:»: si è già nella pagina che lo dice),
e «Impara»/«Migliora». Le cure e gli scudi dicono il numero vero con la vita
dell'eroe: «cura 12 di vita», «uno scudo che para 10 danni, finché dura lo
scontro» (`inVita`, lo stesso conto del motore). Un
nodo imparato va da sé in una casella vuota: chi lo impara a metà discesa
se lo ritrova nello scontro.

## Cosa non è ancora fatto

- **La calibrazione.** Il banco non usa le abilità, quindi le misure della
  storia ([la-grande-storia.md](la-grande-storia.md)) non le vedono: oggi
  sono un vantaggio in più per chi gioca. Da fare: una strada per ramo nel
  banco (`prossimoNodo` c'è già), due strade per classe nelle misure, e i
  bersagli di sempre (il tetto di 85 risposte, la forbice, il cavaliere da
  avvicinare a elfa e nano). Il veleno sembra forte: metà colpo per tre
  scambi su mostri che cadono in due.
- **I pezzi che rinforzano un ramo** («Bastone del fulmine: +1 alle abilità
  arcane», alla Diablo): l'idea dell'utente perché il mago cerchi i
  bastoni. Non fatti. Oggi le abilità crescono con l'attacco, che viene
  dalla caratteristica dell'arma.

**Rifare l'albero** si paga in gemme, come riassegnare i punti
([livelli.md](livelli.md#riassegnare)): «Riassegna» accanto ai punti da
imparare, e le caselle si svuotano.

Nei test: `unita/sotterraneo-abilita` (i rami in piedi, difesa e cura per
ogni classe, ogni icona disegnata e nessuna emoji, i punti e le loro
regole, le caselle, la rilettura di un dato storto, l'energia dalle risposte,
dalla fonte e dalla pozione blu, il colpo doppio, l'abilità che sbagliando
resta pronta, il veleno che brucia sbagliando, gelato e stordito, la parata,
la stanza intera e il primo tiro, l'ultimo fiato, l'energia nella sosta).
Sulla barra `[data-azione="abilita"]` con `data-punti-abilita` e il globo
`[data-globo="energia"]`; nello scontro `[data-caselle-abilita][data-energia]`,
`[data-azione="prepara"][data-abilita="<id>"]` con `data-pronta`, le pastiglie
`[data-stati-mostro] [data-stato]` e `[data-stati-eroe] [data-stato]`, lo
scambio `.sot-scambio[data-usata]`; la pagina `[data-pagina-abilita]` coi
nodi `[data-azione="nodo"][data-nodo][data-grado][data-stato="preso|pronto|chiuso"]`,
`[data-nodo-dettaglio]`, `[data-azione="impara"]`, `[data-azione="dimentica"][data-costo]`, le caselle `[data-azione="zoccolo"][data-zoccolo="0..2"]`
e la scelta `[data-scelta-abilita] [data-azione="metti"][data-metti="<id>"]`,
`[data-caselle-albero] [data-casella]`, `[data-punti-abilita][data-n]`, i glifi `[data-glifo]`,
le schede `[data-scheda]` ([barra.md](barra.md#la-finestra-delleroe)).
