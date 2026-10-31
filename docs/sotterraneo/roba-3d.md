# La roba in 3D: oggetto → figura → modello

Nel sotterraneo ([grafica-3d.md](grafica-3d.md)) un oggetto trovato si disegna con **la sua figura**, non con la sua base: la
`spada@7.m.fuoco` che nello zaino ha lo sprite `spada-28` (la lama di fuoco, [figure.md](figure.md)) in mano all'eroe e nelle
anteprime è il modello 3D di `spada-28`, con l'alone della sua rarità. Prima tutte le spade erano la spada lunga della collezione
(l'utente, 21 ottobre 2026: «abbiamo creato più modelli… con il 3D possiamo giocare con effetti, colori»).

## La mappa

1. **L'oggetto → la figura** (`scena3d/roba3d-pura.js`, senza three): lo sprite che il gioco ha già scelto (`COSE[k].sprite`:
   `aspettoDi` per i pezzi trovati, la figura chiamata come lui per i pezzi col nome) è la figura, o porta a lei per gli sprite
   ritagliati col nome loro (`spada` → `spada-26`, `zanna-del-drago` → `spada-29`: `SPRITE_FIGURA`). Lo stesso pezzo ha sempre la
   stessa figura, nello zaino e in 3D.
2. **L'aspetto** (`lookDi`): la rarità dell'oggetto; l'elemento della figura (la figura è già scelta per richiamare le abilità),
   o il fuoco se il pezzo ha l'abilità e la figura nessun elemento; materia e pregio della figura.
3. **La figura → il modulo** della sua famiglia, dal prefisso dell'id: `spada-*`, `ascia-*` → lame; `bastone-*`, `arco-*` →
   bastoni; `scudo-*` → scudi; `veste-*` → vesti; `amuleto-*` → gioielli. Ogni modulo ha `crea(figura)` (il record del catalogo,
   `{ id, cosa, elemento, materia, … }`) → Group con l'origine nel pugno o nel centro, `userData.famiglia` (spada, staffa, arco,
   scudo, amuleto) e `userData.anima(t)`; `vesti.js` ha solo `vesti(eroe, figura)` → `togli()`, `gioielli.js` anche `indossa(eroe, figura)`.
4. **I consumabili** non hanno figura: le undici chiavi con `usa` di `dati/cose.js` (le pozioni, l'elisir, la torcia, la chiave, la
   pergamena del portale) hanno un modello per chiave in `pozioni.js` (`crea(chiave)`, `CHIAVI`: la forma dal grado, il colore dal
   tipo). Nelle caselle, nella scelta della pozione e nella riga della torcia dello zaino.

Il copricapo non passa dalle figure: ha i modelli dei copricapi per base (`COPRICAPI_3D`, [elmo.md](elmo.md)).

`scena3d/roba3d.js`: `modelloDiRoba(chiave)` → `{ figura, famiglia, modulo, ripiego, crea(), look }`; `creaPezzo(p)` costruisce e
mette l'alone; `vestiFigura` e `indossaGioiello` per il corpo e il collo. Li usano l'eroe in scena (`eroe3d.js`, `vestiDotazione`) e
le anteprime ([anteprime-3d.md](anteprime-3d.md)): la stessa funzione, lo stesso aspetto.

## I ripieghi: il gioco non si rompe mai

- **Il modulo della famiglia manca** (un agente lo sta ancora scrivendo), **la figura non è coperta** o **il modello si rompe**
  (`console.warn`, e la figura non si riprova): l'arma e lo scudo tornano al modello della base nella collezione (`MODELLO_DI` in
  `anteprime3d-pura.js`, le 50 armi di sempre); la veste torna all'armatura di `armature.js` col pregio dalla rarità.
- **Né figura né ripiego**: null, e la vista tiene lo sprite. Sono così i gioielli di base il cui sprite non
  viene dai fogli (`amuleto-rosso`, `medaglione`, `amuleto-osso`); i pezzi trovati di quelle basi hanno una figura dei fogli e
  quindi il 3D. Anche le armi di base con uno sprite fuori dai fogli (`pugnale-vampiro`, `spada-del-ladro`, `bipenne-solare`)
  restano al ripiego.
- **Al collo dell'eroe in scena solo le collane**, senza alone (la catena allungata lo spargeva su tutto l'eroe); gli anelli si
  vedono nelle anteprime.
- **Un consumabile senza il modulo `pozioni`** resta lo sprite.

## Gli aloni della rarità e dell'elemento

`poc/roba-3d/aloni.js`, `aggiungiAlone(gruppo, { rarita, elemento, scala })` → `togli()`, su qualsiasi modello (anche la
collezione). **Un Points solo** per oggetto, col suo materiale (le uniformi sono dell'istanza), in somma di luce, senza scrivere la
profondità: una chiamata in più, 60–200 punti. I punti si pescano sulla superficie in proporzione all'area, una volta.

| rarità | cosa si vede |
|---|---|
| comune | niente |
| magico | scintille azzurre che salgono, un velo blu appena |
| raro | un bordo giallo che brilla sulla superficie e luccichii a stella |
| leggendario | un'aura arancio-oro che pulsa (tinta dell'elemento, se c'è), scintille in orbita attorno all'asse lungo, faville |

Più, se l'elemento non è «nessuno», una velatura del suo colore e piccoli motivi suoi (fiammelle che salgono per il fuoco, fiocchi
che scendono per il ghiaccio, saette per il fulmine, bolle per veleno e acqua, foglie per la natura, rune per l'arcano). I colori
stanno in `poc/roba-3d/palette.js` (`ELEMENTI`). **Nel gioco l'alone si mette solo ai leggendari** (l'utente, 31 ottobre 2026: il
luccichio dice «potenziato», non va su una cosa relativamente di base): comuni, magici e rari mostrano la loro figura, che può
avere un bagliore suo (la lama di fuoco), e quello resta. Le righe del magico e del raro le usa solo il prototipo.
`gruppo.userData.animaAlone(t)` lo muove (l'eroe lo chiama a ogni fotogramma, le anteprime una volta a 1,3 s: l'aura gonfia);
`userData.aloneUniformi.uIntensita` lo fa svanire col portale. In mano all'eroe i punti sono più piccoli (`scalaAlone` 0,8): a
grandezza piena coprivano la faccia del ritratto. Fra i consumabili brillano (con l'alone del raro) solo i «rarissimi»: l'ampolla della vita
e l'elisir del toro. Provato con le sole tinte dei materiali: clonarli rompe le animazioni
dei moduli, che tengono i loro materiali.

Per guardarli: `poc/roba-3d-aloni.html` (le 50 armi × le quattro rarità con l'elemento dell'arma; `?famiglia=spada`,
`?vista=elementi&arma=bastone-nodoso`, `?lato=`, `?pausa`, `?t=`).

## La tabella generata: `npm run roba3d`

`strumenti/mappa-roba3d.mjs` scrive `src/giochi/sotterraneo/dati/figure3d.js` (generato, non si tocca a mano, con la firma) da
`generati/roba.json` e dai foglietti dei tre fogli: `FIGURE3D` (id → famiglia, cosa, elemento, materia, stile, mani, pregio, nome,
pezzo) e `SPRITE_FIGURA` (gli sprite col nome loro → la figura, come `in_gioco` di `roba.py`). Si rilancia quando cambia il
catalogo o un foglietto. `-- --controlla` non scrive ed esce con 1 se è vecchia.

## Le copie: `npm run promuovi3d`

I moduli stanno in `poc/roba-3d/` e il gioco usa le copie in `scena3d/roba3d/` ([mostri-3d.md](mostri-3d.md)): gli aloni sempre,
ogni famiglia **solo se è pronta** (il file c'è, la sua copia si importa in una cartella di prova sotto `tmp/`, esporta `crea` e
costruisce almeno una figura: `crea(figura)`, `vesti` su un eroe con una tela finta, `crea(chiave)` per chi ha `CHIAVI`). `roba3d/moduli.js` (generato) importa quelle che ci sono; chi manca ripiega. L'import di
`roba.json` dei prototipi diventa `roba3d/catalogo-roba.js`, che legge `dati/figure3d.js` (le descrizioni e i rettangoli non
entrano nel file unico).

## Una famiglia nuova

1. Il modulo in `poc/roba-3d/<famiglia>.js` col contratto sopra, e la sua pagina di prova.
2. Il prefisso in `FAMIGLIA_DEL_PREFISSO` di `strumenti/mappa-roba3d.mjs` e la famiglia in `FAMIGLIE_ROBA` di
   `strumenti/promuovi-3d.mjs`; `npm run roba3d` e `npm run promuovi3d`.
3. Se si indossa, la sua funzione in `roba3d.js` (come `vestiFigura`) e il posto in `dotazioneDi` (`anteprime3d-pura.js`).

## Cosa manca

- Le armi in mano ai mostri (gli scheletri guerriero e mago) restano quelle della collezione: non sono oggetti con una chiave.
- L'alone non c'è sulle vesti (starebbe su tutto l'eroe): la rarità della veste si vede dalla figura.

Nei test: `unita/sotterraneo-roba-3d` (la tabella uguale a quella dello strumento e la firma; ogni figura ha la sua famiglia e il
modulo la costruisce, o la famiglia è fra quelle che mancano; ogni oggetto da impugnare ha figura o ripiego; il ripiego senza modulo
e con un modulo che si rompe; ogni veste addosso all'eroe; ogni consumabile, con l'alone solo ai rarissimi; le chiavi composte; gli
aloni), `unita/sotterraneo-mostri-3d` (anche: ogni famiglia col prototipo è fra i moduli del gioco), le copie uguali ai prototipi,
`unita/sotterraneo-anteprime-3d` e `integrazione/sotterraneo-3d-anteprime` (le chiavi con figura e rarità). La tavola:
`node strumenti/tavola-anteprime.mjs --solo rarita`.
