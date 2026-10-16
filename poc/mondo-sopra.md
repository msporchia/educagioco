# Il mondo di sopra, generato in 3D (three.js)

Un prototipo: la terra di sopra del Sotterraneo (oggi una mappa dipinta 2048×1536 con la maschera a griglia e l'A*,
[../docs/sotterraneo/terra-di-sopra.md](../docs/sotterraneo/terra-di-sopra.md)) rifatta come **mondo 3D generato da
un seme**: niente immagini, tutto in codice, sempre giorno. Non vuole essere uguale alla mappa dipinta: ha le zone
dei mercanti e un ingresso riconoscibile per ogni discesa, collegati da strade che passano sui ponti.

## Come si apre

- Dev: `npx vite --port 5193 --strictPort`, poi `/poc/mondo-sopra.html`.
- File unico per il telefono: `POC=mondo-sopra FUORI=/tmp/mondo npx vite build -c strumenti/poc-file-unico.config.js`
  → `/tmp/mondo/mondo-sopra.html`, **1,9 MB (1,0 MB gzip)**, di cui 1,1 MB è l'atlante delle figure: nessuna richiesta
  fuori (verificato servendo solo quel file), si apre col doppio click.
- La pianta in caratteri e i guasti del generatore, senza browser: `node poc/mondo-sopra/pianta.mjs [seme]`.
- A schermo: due bottoni per il pollice, **cielo** (la mappa intera dall'alto, coi nomi dei posti; un tocco lì scende
  dove si è toccato) e **nebbia** (la nebbia dell'esplorazione, di difetto spenta); in alto una riga con fps, draw call
  e triangoli. Nient'altro.
- Il dito: un tocco va (A* sulla griglia, ponti compresi; un tocco sull'acqua o su una casa va alla cella raggiungibile
  più vicina); un tocco su un ingresso, un mercante o il minatore (margine di 44 px attorno alla figura) ci va e,
  arrivato, mostra il fumetto «Ingresso · <discesa>» o «<mercante> · Mercante · <cosa vende>» e anima il posto; un
  tocco nuovo durante il cammino annulla la meta di prima; trascinare oltre 16 px fa inseguire il dito; il mouse conta
  solo a tasto premuto.
- Per chi sviluppa, dalla console: `__mondo.vai('torre')` (porta l'eroe davanti al posto e lo apre: le chiavi sono
  quelle di `POSTI`, o il nome di un mercante), `__mondo.porta(x, z)`, `__mondo.cielo()`, `__mondo.nebbia()`.

## I file (poc/mondo-sopra/)

| file | righe | cosa |
|---|---|---|
| `generatore.js` | 640 | la mappa: regioni, fiumi, ponti, creste, lago, lotti, strade, case, campi, decoro, quota. Puro, gira in Node |
| `strada.js` | 80 | A* a otto direzioni (niente angoli tagliati), lisciatura, raggiungibili |
| `caso.js` | 25 | caso col seme e rumore liscio (da terre-selvagge) |
| `trame.js` | 170 | tutte le trame su canvas: erba, terra, sabbia, roccia, pietra a blocchi, legno, intonaco, tegole, paglia, ciottoli, campo arato, stoffa a righe; normal map dalla luminosità |
| `vesti.js` | 85 | cucito in ogni materiale: vento (chiome, erba), ombra delle nuvole che scorre, nebbia dell'esplorazione |
| `terreno.js` | 280 | il terreno a splat, il fuori mappa, l'acqua, il cielo, la piazza, i campi |
| `kit.js` | 410 | il cantiere (unisce per materiale) e i pezzi parametrici |
| `monumenti.js` | 220 | i nove ingressi, ognuno con la sua animazione |
| `natura.js` | 250 | alberi, cespugli, rocce, ruderi, erba, fiori, colture, bosco fuori mappa: tutto a istanze |
| `vita.js` | 140 | fumo, spruzzi, faville (tre Points a riserva fissa), fiamme, uccelli |
| `main.js` | 390 | scena, figure dell'atlante, camera, dito, nebbia, fumetti, ciclo |

## Il generatore: cosa viene da terre-selvagge e cosa è cambiato

Ripreso dal ramo `terre-selvagge` (`motore/aperta.js`, copiato, niente import): il caso e il rumore; le regioni come
**centro più vicino più un rumore a macchie larghe** (i confini serpeggiano); la **distanza dal confine** in BFS da cui
nascono fiumi e creste; i **valichi** nelle creste (uno vicino al mezzo, uno lontano); la regola «di ogni regione si
tiene la massa più grande»; il decoro che **blocca solo con una cella libera tutt'attorno** (non chiude mai una strada);
i guasti controllati alla fine (ogni posto raggiungibile dalla partenza, ogni ponte con le due rive raggiungibili).

Cambiato:
- **Regioni con un ruolo**, griglia 3×3 su 112×88 celle (seme 7): al centro il villaggio; a ovest i campi (torre in
  rovina, altare); a est il campo del minatore (grotta della scaletta); sotto il bosco (scalinata antica), il lago
  (scala sommersa), la soglia selvaggia (cancello delle terre selvagge, a est, su una strada che esce dalla mappa); sopra
  le rovine (botola), il monte (miniera), la landa vecchia (pozzo vecchio = abisso). In fila per distanza, come la storia.
- **Fra le colonne sempre un fiume** (largo 2–4, un ponte per riga: arco di pietra nella riga del villaggio, travi sotto,
  passerella sopra); fra le righe di sopra una **cresta** coi valichi, fra quelle di sotto niente (prato aperto).
- **I ponti sono modellati**, non moduli dipinti: invece di piegare il fiume attorno a un disegno, si cerca un tratto di
  confine quasi dritto, lo si raddrizza per dieci righe e lì il fiume prende la larghezza che il tipo di ponte vuole.
- **Un varco garantito**: dopo aver messo i posti, ogni meta che non si raggiunge apre la roccia sulla strada più corta
  (la roccia costa 30, l'acqua non si passa). Prima di questo l'abisso restava chiuso dietro una cresta.
- **Lotti**: la piazza (tondo di ciottoli col pozzo), le quattro botteghe attorno, i nove monumenti (la grotta e la
  miniera con una gobba di roccia dietro, la scala sommersa sulla riva del lago), il campo del minatore, il mulino su una
  riva dritta lontano dai ponti; poi le **strade** (A* dalla piazza a ogni posto, quelle già tracciate costano meno e
  così si uniscono in una rete; lontano dall'acqua), poi campi recintati e case vicino alle strade con la porta verso
  la strada, poi lanterne, cartelli agli incroci, decoro per habitat (nove habitat).
- **La quota**: base dolce per regione, roccia alta (più alta quanto più è dentro, la cornice di più), acqua bassa;
  ammorbidita, le rive sempre sopra il pelo, i lotti spianati, i ponti alla quota della riva più alta.
- Isolotti: un frammento d'erba staccato che tocca l'acqua resta erba (si vede, non ci si arriva).

Tempo: ~100–150 ms in Node per tutta la mappa; la scena intera è pronta in ~1 s nel browser.
Semi provati: 1, 2, 3, 5, 6, 7 senza guasti; 4 e 9 non trovano posto per un ponte, 8 per il mulino (la mappa vera
userebbe un seme fisso scelto guardando la pianta, come terre-selvagge).

## I pezzi e quanto costano

Misurati sulla scena (seme 7). Il kit fermo finisce in **un cantiere**: 16 mila triangoli in tutto, **una mesh per
materiale** (pietra, legno, intonaco, tegole, paglia, liscio, stoffa, luce: 8 draw call per tutte le case, botteghe,
ponti, monumenti, lanterne, cartelli). Le parti che si muovono sono mesh a parte (porta, lastra, grata, assi, anta,
carrello, manovella, secchio, ruota del mulino: una ciascuna).

| pezzo | triangoli circa | note |
|---|---|---|
| casa | 300–600 | zoccolo, muri (a volte a graticcio), tetto a falde o di paglia, porta, finestre con imposte, camino col fumo; 18 in mappa |
| bancarella / erbe | ~400 | pali, banco, tendone a righe (shader: maschera di righe × colore del vertice), merce |
| fucina | ~450 | tettoia di pietra, forgia con le braci (faville), camino, incudine, rastrelliera |
| torretta | ~500 | cilindro, tetto a punta, cristallo che galleggia e gira |
| mulino | ~450 + ruota ~700 | la ruota gira, spruzzi d'acqua |
| ponte | 200–900 | arco = profilo estruso con la volta + parapetto; travi su pali; passerella di assi con corde che pendono |
| monumenti | 200–2400 | la torre è la più cara (anelli di blocchi con la cima rotta, edera, massi caduti) |
| terreno | 79 mila | due vertici per cella, quattro trame mescolate con l'altezza (il bordo si sfrangia) + pendenza → roccia |
| fuori mappa | 29 mila | colline e monti che partono dall'altezza della cornice |
| natura (istanze) | ~270 mila | 9 400 ciuffi d'erba (5 fili), 2 100 fiori, ~600 alberi, 440 rupi, colture: ~16 InstancedMesh |
| totale | ~450 mila | ~70 oggetti; a schermo dal villaggio ~120 draw call e ~600 mila triangoli con il passo dell'ombra |

Codice: ~2 750 righe, 165 KB di sorgente; nel file unico il codice pesa ~0,8 MB con three.

## Il look, giudicato dagli screenshot

Regge bene: la **veduta dall'alto** (si legge subito: fiumi che serpeggiano, il lago, i ponti, il villaggio in mezzo, i
campi a file, la cornice di monti), **il villaggio** (case variate, tetti di colori diversi, botteghe distinguibili: il
tendone rosso del mercante, quello verde della guaritrice, la fucina grigia, la torretta viola), **i ponti** (l'arco di
pietra e la passerella con le corde sono i pezzi più belli), **l'acqua** (schiuma alle rive, riflesso del cielo), i
campi di grano e cavoli. Ogni ingresso è riconoscibile (torre, colonne dell'altare, arco con la grata, bocca della
grotta, miniera con binari e carrello, pozzo col tetto d'ardesia, botola nel telaio, scala nel lago).

Non regge, o non ancora:
- **Le rocce**: le rupi a dodecaedro sono «massi di cartone»; la montagna è giusta di sagoma ma piatta di materiale.
- **Gli alberi** sono stilizzati e coerenti, ma il pino a coni sembra un giocattolo e il bosco è un po' a pallini.
- **L'erba** del terreno si ripete ancora un poco a quadri (mitigata mescolando due scale); i ciuffi aiutano solo da vicino.
- **Le figure** (atlante pixel art su cartelli piegati verso la camera) stanno in uno stile diverso dal 3D liscio:
  si leggono, ma l'eroe accanto a una casa vera sembra un adesivo. Vale la pena provare un contorno o un'ombra a disco.
- **Il cancello delle terre selvagge** si vede di taglio (guarda a ovest) e si legge poco; andrebbe girato verso sud.
- **La nebbia dell'esplorazione** colora le superfici: copre bene il terreno, ma case e rocce restano sagome bianche.
  Per nasconderle davvero servirebbe un velo di nuvole volumetrico o abbassare/nascondere i pezzi non visti.
- Il **cielo** si vede solo in alto ai bordi: a 50° si guarda in giù; le nuvole si sentono soprattutto dalle loro ombre.
- Non misurato su un telefono vero: nel browser integrato (Chrome senza schermo) gira, ma i numeri di fps non contano.

## Dai dati generati ai dati del gioco

Quello che il generatore produce copre già tutto quello che il gioco vero legge da `dati/terra-mappa.js`:
- `MASCHERA` (`.`/`#`) = `m.calpestabile(x, y)` cella per cella (112×88 invece di 64×48); `motore/terra.js`
  (`creaTerra(maschera)`) la prende com'è.
- `POSTI[posto].piede` = `posti[i].accanto`; `riquadro`/`ingresso` (il cerchietto) diventano la posizione 3D del
  monumento; `POSTO_DI`/`LUOGHI` di `dati/terra.js` restano scritti a mano (le frasi del minatore andrebbero riscritte
  sulla nuova geografia: «oltre il ponte di pietra, nei campi…»).
- `PARTENZA` = `m.partenza`; `MINATORE` = `m.minatore.piede/accanto`; `MERCANTI[chiave]` = `mercanti[i].piede/accanto`
  (le chiavi sono già quelle di `dati/mercanti.js`); `CARTELLO` = un elemento di `m.cartelli`.
- **Mancano qui** `PERSONAGGI` (la ragazza, il mugnaio… delle missioni) e `PORTALE`: sono lotti come i mercanti, da
  aggiungere alla lista dei lotti del villaggio (il mugnaio ha già il suo mulino).
- La **nebbia** del gioco (`nebbiaNuova`, `scopri`, `nebbiaInCodice`) lavora su una griglia: va uguale, solo più
  grande; cambiare le misure invalida le nebbie salvate (`LARGHEZZE_VECCHIE` esiste già per questo).
- Il generatore è puro: si può far girare a **tempo di build** e scrivere un `terra-mondo.js` generato (con un test che
  confronta la firma, come per la taratura), oppure all'avvio (~100 ms). Il primo è più sicuro: la mappa non cambia
  se qualcuno tocca il rumore.

## Cosa servirebbe per sostituire la mappa dipinta (stima onesta)

1. **Portare il generatore in `src/`** con dati e test unità (pianta fissa, nessun guasto, ogni posto raggiungibile,
   firma): 1–2 giorni.
2. **La vista**: `viste/Terra.vue` oggi è DOM + immagine; diventerebbe una tela three.js con la stessa logica (il dito,
   fumetti, dialoghi del minatore e dei mercanti, la discesa a metà, il portale gemello, chiuse con «si apre quando…»,
   le carte in cima e in fondo che coprono la vista): 4–6 giorni. Three entra nel file unico del gioco (+~0,7 MB).
3. **Il look da finire** (rocce, alberi, cancello, nebbia vera, figure nel 3D, provare su telefoni deboli, abbassare
   erba e ombre se serve): 3–5 giorni.
4. **I test col dito** (`sotterraneo-terra`, `-missioni`, `-avventure`, `-mercanti`, `-portale`) contano sulla vista DOM
   e sui `[data-posto]`: vanno adattati ai bersagli nella tela (overlay DOM per ogni posto, come i fumetti qui): 2–3 giorni.

Totale **10–16 giorni** di lavoro. Rischi: prestazioni sui telefoni più vecchi (WebGL, ~600 mila triangoli con
l'ombra: da tagliare), il contrasto di stile figure pixel / mondo 3D, e i salvataggi della nebbia (misure diverse).
