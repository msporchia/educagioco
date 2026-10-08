# La roba ha un livello e una rarità

Ogni pezzo che si mette addosso ha un livello e una rarità, come in Diablo:
comune, magico, raro, leggendario. Qui come è fatto un pezzo (la chiave, i
numeri, il nome), quanto spesso cade e a che livello, i mercanti a tono, i
leggendari e la pagina dei Tesori. Deciso dall'utente l'8 ottobre 2026: *«se
io sono livello 20 i drop devono essere a tono»*.

Il codice: `dati/pezzi.js` (rarità, abilità, leggendari, pezzi dei mostri
grossi), `dati/cose.js` (la chiave composta: `leggiPezzo`, `chiaveDelPezzo`,
`nomeDelPezzo`), `motore/bottino.js` (cosa cade e di che rarità),
`motore/storia.js` (i banchi a tono), `viste/pezzo.js` (colori e parole),
`viste/Tesori.vue`.

## Le rarità

| | colore | abilità | prezzo | quanto rende un'abilità |
|---|---|---|---|---|
| comune | bianco | — | ×1 | — |
| magico | blu | 1 o 2 | ×1,6 | ×1 |
| raro | giallo | 2 o 3 | ×2,6 | ×1,4 |
| leggendario | arancio-oro | le sue 3 | ×4 | ×1,8 |

- **Stessa icona del pezzo di oggi, più un'aura del colore della rarità**:
  sul bordo e dentro la casella (`.sot-r-<rarità>` in `stile.css`), per terra
  un alone che respira (`aura` in `scena/tela.js`), nel nome del pannello e
  nell'avviso quando si raccoglie. Il comune non ha aura.
- **Il livello alza anche un pezzo comune**, sul suo numero principale:
  l'attacco di un'arma +1 ogni 5 livelli, la difesa di scudi e armature +1
  ogni 15, la vita dei gioielli che ne danno +1 ogni 4 (`ATT_OGNI_LIVELLI`…).
  Lento apposta: nella storia (livelli 1–12) un'arma prende al più due
  punti, la crescita vera sta nell'eroe; nell'abisso, senza tetto, il
  livello fa la differenza.
- **Il prezzo cresce in linea retta col livello** (+12% a livello,
  `valoreDelLivello`), mai esponenziale. Le gemme che si trovano crescono
  allo stesso modo col livello del posto, e una cura costa (e cura) di più
  col livello dell'eroe: +10% di cura a livello, `curaDi`.

## Le abilità

Una decina, quelle sensate col motore (`ABILITA_DEI_PEZZI`):

| | abilità | fa | nasce su |
|---|---|---|---|
| ⚔️ | attacco | colpi più forti | armi, scudi |
| 🛡️ | difesa | meno danni | scudi, armature, gioielli |
| ❤️ | vita | vita in più | tutto |
| 💚 | rigenera | vita a ogni mostro battuto | tutto |
| 🔥 | fuoco | colpo in più che passa anche a chi para | armi, gioielli |
| 🌀 | schivata | a volte il graffio non arriva (fino al 60%) | scudi, armature, gioielli |
| 💎 | gemme | ogni gemma vale di più | armi, gioielli |
| 🍀 | fortuna | come la caratteristica: gemme e roba migliore | armi, armature, gioielli |
| 🧪 | pozioni | le pozioni curano di più | armature, gioielli |
| ⏳ | torcia | la torcia dura qualche stanza in più | scudi, gioielli |

- **Niente attacco al dito**: al dito va quello che non picchia
  ([roba.md](roba.md#addosso-e-in-tasca)).
- **Quanto vale un'abilità** dipende dal livello e dalla rarità (`valore`):
  al livello 10 un magico dà ⚔️ +2, ❤️ +5, 🌀 7%. Provato più forte (⚔️ +3 al
  livello 4): la mazza di Grumo batteva le armi di tutte le classi, e la
  storia giocata davvero andava il doppio più facile della tabella.
- **Per aggiungerne una**: `ABILITA_DEI_PEZZI`, `ABILITA_CONFRONTATE` e
  `PESI` in `motore/corredo.js`, `ABILITA` in `viste/pezzo.js` (un test
  controlla che le liste coincidano), e dove la somma conta (`Corsa`).

## La chiave, e i numeri che ne nascono

`spada@7.m.fuoco.att` è una spada di livello 7, magica, con fuoco e
attacco; `spada@7` comune; `spada` la chiave di sempre (livello 1, comune);
`mazza@9.u.mazza-di-grumo` un pezzo col nome (un leggendario, o quello di un
mostro grosso). **I numeri non stanno nella chiave**: nascono dal livello e
dalla rarità, sempre uguali, così una chiave salvata non può mentire.

- **`COSE[k]` legge anche le chiavi composte**: è un Proxy sulle basi
  (`dati/cose.js`), così le cento letture `COSE[k]` del gioco non sanno che
  le chiavi sono cambiate. Una chiave che non si legge torna `undefined`,
  come una chiave sparita, e `rileggiRoba` la butta.
- **Trappola**: `IN_VENDITA.includes(k)` e simili vogliono la base
  (`baseDi`): una chiave composta non è nell'elenco.
- **Il confronto** (`viste/Confronto.vue`) sono due cartellini affiancati,
  quello addosso e quello guardato, ognuno col nome nel colore della
  rarità, livello e numeri ([bottega.md](bottega.md)). Un pezzo che si
  mette da sé si giudica su tutto quello che dà (`confronto().meglio`, i
  `PESI` di `motore/corredo.js`: un punto di difesa vale due di attacco, uno
  di vita un quinto di un punto d'attacco); fra due gioielli sceglie chi
  gioca. Provato con la vita che pesava di più e la mazza a ⚔️ 2:
  la Mazza di Grumo restava in mano a tutti fino in fondo.

## Il nome nasce dalle abilità

Parole da sette anni, un po' epiche, accordate al genere (`genere: 'f'`
sulle basi femminili):

- **magico, un'abilità**: la base e l'aggettivo — «Spada fiammeggiante»,
  «Corazza corazzata»;
- **magico, due**: anche il complemento della seconda — «Spada
  fiammeggiante della volpe»;
- **raro**: l'aggettivo epico del suo livello (temprata dal 1, runica dal 7,
  demoniaca dal 14, antica dal 22) e il complemento della prima — «Spadone
  demoniaco del leone»;
- **col nome**: il suo — «Mazza di Grumo», «Zanna del drago».

## Cosa cade, e a che livello

- **Il livello del bottino è quello del posto, o quello dell'eroe se è più
  alto** (`livelloDelBottino`). Il posto: il livello della discesa, uno in
  più ogni due piani; l'abisso dal 12 in giù, uno a piano, senza tetto
  (`livelloDelPosto`). Così chi è al livello 20 trova pezzi del 20 anche
  nella cripta; ma le rarità crescono con la profondità, e scendere conta.
- **Le rarità** (`PROBABILITA` in `motore/bottino.js`), spinte dalla fortuna
  (+8% a punto) e dalla profondità (+1,25% a livello):

  | chi lascia | magico | raro | leggendario |
  |---|---|---|---|
  | un mostro | 22% | 5% | 0,4% |
  | un forziere | 34% | 10% | 1,2% |
  | il mostro grosso | — | di sicuro | 6% |

- **Anche i mostri qualunque lasciano a volte un pezzo** (`pezzoDalMostro`:
  dal 5% del ratto al 10% del gigante), oltre a quello che si beve. Poco: la
  tabella della storia dice ancora con che roba si arriva
  ([la-grande-storia.md](la-grande-storia.md)).
- **I forzieri della storia** danno prima il pezzo della riga dopo che manca;
  se no, uno su tre un pezzo a tono, gli altri da bere o da accendere.
  Nell'abisso sei su dieci.
- **La base** si pesca per prezzo come prima (`pescaCosa` con la
  profondità: il livello / 12), e predilige quello che l'eroe porta.

## I mercanti a tono

L'armaiolo e il rigattiere portano la riga della storia (com'era,
[bottega.md](bottega.md)) **al livello dell'eroe**, e anche i pezzi della
vetrina avanti; le cose in più (`altre`) sono a tono e una su tre magica
(`MAGICI_SUL_BANCO`). Il resto della bottega non cambia: pezzi avanti a
sovrapprezzo, solo roba che l'eroe porta, banco mai vuoto. Il rigattiere
compra a metà del prezzo vero (livello e rarità compresi). Un pezzo
magico, raro o col nome si giudica sui numeri, non sul posto della sua base
nella riga (`migliora`).

## I leggendari e i Tesori

Undici (`LEGGENDARI` in `dati/pezzi.js`), ognuno col suo nome, le sue tre
abilità e una riga di storia («Forgiata col dente di un drago che dormiva da
mille anni»); ogni classe ne può portare almeno quattro.

- **Rari davvero**: uno su 250 mostri, uno su 80 forzieri, uno su sedici
  mostri grossi (con la fortuna e la profondità di più).
- **Quando cade**: la colonna di luce arancio-oro sopra di lui finché
  nessuno lo prende (`aura` in `scena/tela.js`), in mezzo al campo il nome in
  oro con la sua storia sotto, e un suono suo (`suoniDellaFesta` in
  `Gioco.vue`). Nella bottega e nello zaino la casella pulsa d'arancio e il
  pannello ripete la storia.
- **I Tesori** (`viste/Tesori.vue`, dalla pagina dell'eroe): tutti gli
  undici, quelli trovati col nome in oro e la storia, gli altri come un posto
  vuoto con la sagoma in ombra e «Ancora da trovare, laggiù». Mai «in
  arrivo». I trovati stanno nell'avventura (`tesori`, gli id): si segna
  quando lo si raccoglie, non quando cade.
- **`#sotterraneo=leggendario`** posa un leggendario accanto all'ingresso,
  come se fosse appena caduto: per guardare la festa senza aspettare la
  fortuna di una sera.

Nei test: `unita/sotterraneo-rarita` (la chiave e i numeri, le chiavi
storte, i nomi accordati, le probabilità, la fortuna e la profondità, le
abilità nella loro casella, il bottino a tono col livello 20 nella cripta,
i mostri grossi, i leggendari e i trovati, i mercanti a tono),
`integrazione/sotterraneo-eroe` (col dito: il leggendario che cade, si
raccoglie e finisce fra i Tesori). Sulle caselle `[data-rarita]` (al posto
del vecchio `data-gradino`), sul pannello `[data-pannello][data-rarita]` e
`[data-storia]`; la festa `[data-leggendario][data-cosa]`; i Tesori
`[data-tesori]`, `[data-tesoro="<id>"][data-trovato]`, `[data-azione="indietro-tesori"]`.
