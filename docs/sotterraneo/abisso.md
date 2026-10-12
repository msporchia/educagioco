# 🕳️ L'abisso: scendere senza fondo

L'abisso com'è oggi: perché esiste, come cresce, cosa si perde svenendo, dove
sta il record e fin dove regge. Il progetto (bottino graduato, monete):
[abisso-progetto.md](abisso-progetto.md); la scala che risale:
[scala-che-sale.md](scala-che-sale.md). Coi livelli dell'eroe (8/10) non è
stato ritarato: ha un mostro grosso ogni cinque piani ([grossi.md](grossi.md))
e il bottino a tono ([rarita.md](rarita.md)), il resto è com'era. Dall'8/10 non è
più il posto dove farsi le ossa dopo la storia (riscendere trenta piani per
trovare mostri all'altezza era noioso): lo fanno le zone
([zone.md](zone.md)), e l'abisso resta la sfida del primato. Dal 9/10 i suoi
mostri danno un terzo dell'esperienza (`esp` in `L_ABISSO`): con la curva
nuova oltre il 12 rendeva per domanda tre volte una zona
([zone.md](zone.md#lesperienza)).

## Cos'è, e perché non è una settima tappa

**Finite le sette discese si apre una discesa sola che comincia al piano 1 e
non finisce.** Nasce da una frase: *«ho trovato un'arma super figa e ora ho
finito la tappa e la butta»*. Allora fra una discesa e l'altra si ripartiva
nudi, e l'abisso era il posto dove quel momento non arrivava mai; dal 7
ottobre 2026 la roba resta dappertutto
([la-roba-che-resta.md](la-roba-che-resta.md)), e nell'abisso si scende con
quella di sempre.

- **Si apre su `libera`**, che `giochi/campagne.js` scrive quando `tappa >=
  quante`: niente cancello nuovo. Niente `portata` e niente età: il criterio
  «hai finito le sette» è dimostrato invece che stimato.
- **Non è la tappa 7**, per tre ragioni: una tappa 7 finisce come la 6 e
  butta l'arma lo stesso; `stelle` è un oggetto con una chiave per tappa
  **dentro il profilo**, che `persist()` riscrive intero (la ragione per cui
  `store/sessioni.js` sta fuori); e la campagna è un dato che si mostra
  (`viste/Campagna.vue`, `TAPPE_DEL_GIOCO`, `arcoDelGioco`, `tappe` del
  manifesto vogliono una lista finita). `CAMPAGNA` resta finita (sette
  discese dal 7 ottobre 2026), e l'abisso non ne fa parte.
- **La roba dell'abisso è quella di tutte le discese**: ci si scende con lo
  zaino della campagna, e quello che si trova là sotto sale come da ogni altra
  discesa. Il mercante che stava in ogni piano è salito sulla terra di sopra,
  e al suo posto c'è il portale per il villaggio: lo stesso delle discese
  ([regole.md](portale-e-sosta.md#il-portale-e-luscita)). Salendo dal portale si fa la spesa e
  si torna giù al piano, nella stanza e nel punto dov'eri.

## Com'è fatto nel motore

- **`L_ABISSO`** in `dati/campagna.js`: `abisso: true`, `piani: Infinity`
  (così `allaScala()` e `scendi()` non chiudono mai la discesa), `dif`,
  `forza`, `spinta`, `ossaPerPiano`, `capo`, `attOgni`, `forme`. **`INDICE_ABISSO` = −1** è il suo
  indice, e **`tappaDi(indice)`** è l'unico posto che lo traduce:
  `CAMPAGNA[-1]` è `undefined`, e un `undefined` dentro una `Corsa` dà una
  discesa senza numeri e nessun errore.
- **Nella sosta l'abisso è `tappa: −1`**, e nient'altro: niente campo
  `abisso: true` accanto, perché due fonti per lo stesso fatto divergono. Il
  campo cambia valore e non significato: la sosta dell'abisso è quella di una
  tappa, col piano salvato come cambiamenti dal seme (una sosta al piano 23
  pesa circa 360 byte).
- **Un piano è una funzione del numero**: `Corsa.nuovoPiano()` genera da
  `seme + piano * 7919`. La corsa lo sa con `senzaFondo`.
- **`#abisso=12` nell'indirizzo** comincia l'abisso a quel piano, per
  guardare una schermata senza giocarsi due sere.

## Le domande smettono presto di salire

**`dif(p) = min(1, 0,92 + 0,02 · p)`** (`DIF_ABISSO`, `DIF_PER_PIANO`), con
`p` da 0: 0,92 · 0,94 · 0,96 · 0,98 · **1**. Il tetto arriva al **quinto
piano** (`PIANO_DEL_TETTO` = 4) e ci resta; `guastiDellAbisso` pretende che
ci arrivi.

Oltre non c'è niente perché **l'età sta sul bambino e non sulla domanda**:
`quiz/scelta.js` traduce `dif` nella finestra dell'età (`bersaglio = qui − 12
+ 37 · dif`), e a 1 si punta due anni sopra, il tetto dell'ammissione
(`finestraDi`). La sesta tappa finisce già a 0,92. Quindi **entro la prima
serata l'abisso smette di essere più difficile da studiare e diventa solo più
difficile da sopravvivere**: la progressione sta tutta sulle altre leve.

## Le leve: quello che allunga un piano non lo indurisce

| leva | si usa? | perché |
|---|---|---|
| ossa dei mostri | **sì**, la principale | è quella che il bottino compensa |
| attacco dei mostri | **sì**, più piano che in campagna | decide se si sviene |
| scorte più rade, guardiano con scorta | proposte, non misurate | vedi [da-fare.md](da-fare.md) |
| difesa dei mostri | **no** | entra in una sottrazione: allunga invece di indurire |
| domande per mostro | conseguenza | è ossa / braccio, si muove da sé |
| ampiezza del piano (`misura`, `giri`) | **no** | più grande *sembra* più difficile ed è solo più lungo |
| luce che cala scendendo | **no** | cercare al buio è di nuovo lungo |

- **La forma del piano gira invece di crescere** (`FORME_DELL_ABISSO`,
  `formaDi`): 34/3, 42/3, 52/4 giri, scelti dal piano modulo 3 — le misure
  che la campagna già usa. `visto` si dimensiona **sul piano generato** e non
  sulla tappa, o a ogni cambio di forma metà mappa resterebbe al buio.

## Come crescono i mostri

```
ossa = base.ossa × forza × (1 + p · 0,12)     forza 5, ossaPerPiano 0,12
att  = base.att  + spinta + floor(p / 3)      spinta 12, attOgni 3 (la campagna resta a 2)
dif  = base.dif                               ferma per sempre
```

I mostri dell'abisso sono quelli di una zona, un po' più deboli ([zone.md](zone.md)): le specie hanno tutte le stesse ossa e la
forza viene dal livello ([mostri.md](mostri.md#le-coppie-12-ottobre-2026)), quindi `forza` e `spinta` sono quelle di una zona
verso il livello 12 (l'abisso si apre a chi esce dalla storia) e il piano le fa crescere. Tarate col banco sull'eroe che esce dalla
storia ([scontro-bilancio.md](scontro-bilancio.md)). Prima (fino al 12 ottobre) i mostri partivano deboli e la fascia saliva con la
profondità, e si poteva scendere nudi; adesso nudi non è più un modo di entrare.

**Il costo di un mostro in domande è una costante; quello che cresce è il
prezzo di restare indietro.** Era il mestiere che il Dungeon, tolto il 6
ottobre 2026, faceva con `forzaDi` e `gradoBottino`.

Provato con l'attacco a `floor(p / 2)`: ci si fermava fra il settimo e
l'undicesimo piano, sempre, perché i mostri **fanno troppo male** — al piano
20 un orco picchia 14 contro una difesa che arriva sì e no a 9, e la metà
passa anche rispondendo bene. `guastiDellAbisso` rifiuta `attOgni < 3`. La
campagna resta a 2 perché ha quattro piani al massimo e il difetto non la
raggiunge.

## I guardiani

**Il guardiano di ogni piano è la specie più dura della coppia del tratto, fatta caporale** (`guardianoDi`: ossa ×1,25 e un colpo
in più), e ogni cinque piani c'è un mostro grosso (`GROSSO_OGNI`). Prima c'era una scaletta fissa (`guardiani: ['scheletro',
'scheletro', 'orco', …]`, poi il gigante) misurata a mano: spostare dove compare il gigante cambiava poco, a fermare la discesa
era il non avere un'arma, non il capo. Adesso ogni piano ha il guardiano del posto in cui è.

## Il posto cambia scendendo

**Ogni quattro piani l'abisso cambia posto** (`TRATTI_DELL_ABISSO`,
`PIANI_PER_TRATTO` in `dati/campagna.js`): le cantine dal 1° al 4°, la cripta
dal 5° all'8°, la fornace dal 9° in poi, **e l'ultimo posto resta per sempre**:
un abisso senza fondo non ha un giro da rifare, e la fornace è l'ultima
tappa visiva. Un posto è **uno scenario**
(come si disegna, `SCENARI` in `dati/tessere.js`) **e una coppia di mostri** (chi si incontra per strada, `mostri` del tratto in
`dati/campagna.js`: ratti e melme nelle cantine, scheletri e fantasmi nella cripta, golem e pipistrelli nella fornace); la riga
sotto il campo dice dove si è («la cripta · piano 7»).

- **Un abisso solo, non uno per posto**: due abissi vorrebbero due record,
  due soste e due corredi, e ognuno mostrerebbe metà dei mostri. Scendendo
  invece il posto nuovo è un traguardo che si vede.
- **Un posto cambia le facce, non la fatica**: la forza dipende dal piano, non dalla coppia (un golem della fornace al piano 9
  costa quanto un ratto delle cantine al piano 9, a meno della forma).
- **Le discese della campagna hanno la loro coppia**, per ambientazione ([mostri.md](mostri.md)).
- **Un posto nuovo** è una voce in `SCENARI` e una riga in
  `TRATTI_DELL_ABISSO` (con la sua coppia); `guastiDelleTessere` e `guastiDellAbisso` dicono se
  ne manca un pezzo. Il piano resta una funzione del numero: rientrando si
  ritrova lo stesso posto.

Nei test: `data-posto` sulla riga sotto il campo (`.sot-piede`), vuoto fuori
dall'abisso.

## Svenire: si perdono le tasche, mai il corredo

- **Resta addosso tutto** — arma, mano debole, corpo, dito — **e si svuotano
  le sei tasche**; le gemme si dimezzano (`rimettiInPiedi` in
  `motore/corsa.js`). La regola è nata qui e adesso vale anche nelle sette
  discese ([regole.md](regole.md#svenire-e-il-fondo-degli-svenimenti)). Punisce senza umiliare: se ne va il margine
  accumulato, non il lavoro di dieci piani. «Perdo tutto» cancellerebbe una
  settimana con una brutta sera; «non perdo niente» renderebbe l'abisso
  impossibile da perdere.
- **Le tasche si svuotano, non si rovesciano per terra**: ritrovarle
  all'ingresso vorrebbe dire non aver perso niente. La riga lo dice.
- **Sopravvivono** la torcia (brucia sulla corsa, non sta in tasca) e la vita
  massima cresciuta con l'elisir (`vitaBase`).
- **Le pozioni reggono**: una pozione bevuta vale sempre più di una tenuta da
  parte, che è il comportamento che si voleva togliere. Con uno scontro
  aperto lo zaino non si apre, ma il colpo di ogni mostro si legge prima e
  si può scappare: chi sviene con cinque pozioni aveva l'informazione.
- **Tre occasioni per piano, e ripartono scendendo**
  (`SVENIMENTI_PER_PIANO`, `svenimentiSpesi`): scendere è la cosa
  guadagnata, accamparsi no. Il banco ne misura 0,6 per piano con un
  giocatore finto avaro (non beve, non compra): tre morde solo sul piano
  andato storto.
- **All'ultima occasione la discesa non si butta**: `riprendi()` rimette in
  piedi comunque (ingresso, mezza vita, metà gemme, tasche vuote) e poi
  risale; `Gioco.vue` scrive la sosta chiedendola per nome
  (`scrivi(c, INDICE_ABISSO, { anchePerFinite: true })`, perché `scrivi()`
  rifiuta una corsa finita). Rientrando il piano è com'era, coi mostri già
  battuti e i forzieri già aperti: il contatore rende leggibile la serata,
  non difende l'economia.

## Il record, e dove si vede

- **Il più giù dove si è arrivati sta nell'avventura** (`abisso: { fondo }`,
  [avventure.md](avventure.md)): sopravvive alla sosta buttata via, e non sta
  fra le stelle. L'abisso si apre a chi ha finito le sette con quell'eroe; la
  riga della home dice il fondo più giù fra tutte le avventure.
- **La mappa** (`viste/Campagna.vue`): in cima la ripresa, «l'abisso · piano
  23 — torno giù da dove ero»; **in fondo**, sotto le sette e solo se `libera`,
  la carta dell'abisso col piano più profondo.
- **`viste/Fine.vue`**: un terzo caso, né «vinta» né «a mani vuote» — «Sei
  risalito dal piano 23».
- **Il manifesto** (`gioco.js`): `riassunto()` dice «abisso · piano più
  profondo 23»; primato `sotFondo` (`segnaBest`); traguardo «🕳️ Giù per il
  buco» (`sot-abisso`, soglie 10 · 25 · 50); l'esperienza passa da
  `sotPiani` come sempre.
- **Le guide**: `AIUTI` in `src/guide/contenuti.js` ha la sua voce.
- **Le monete: 🪙1 per risposta giusta, pagato subito**, come nelle sette
  discese (mai per una sbagliata; a fine discesa si mostra solo il
  totale). È rimasto 🪙1 quando i premi di tutti i giochi sono passati al
  «si paga subito»: nel sotterraneo la domanda è la mossa, e il perché
  sta in [regole.md](regole.md#le-monete).

## Fin dove regge, oggi

Si entra come si esce dalla storia: la roba e il livello dell'ultima riga ([la-grande-storia.md](la-grande-storia.md)), non più
nudi (i mostri hanno la forza di una zona, [mostri.md](mostri.md): nudi non è un modo di entrare). Sei semi, bravura 0,8,
`npm run sotterraneo -- --abisso`:

| chi scende | fin dove arriva (sei semi, 31 = oltre il tetto di 30 piani) | media |
|---|---|---|
| Cavaliere | 6 · 6 · 22 · 23 · 31 · 31 | 19,8 |
| Elfa | 6 · 7 · 11 · 15 · 16 · 21 | 12,7 |
| Mago | 3 · 6 · 6 · 11 · 14 · 31 | 11,8 |
| Nano | 6 · 6 · 15 · 16 · 31 · 31 | 17,5 |

Prima (con la roba di chi ha finito le sei, andando dritto) si arrivava al piano 8–11, media 9,3, e nudi dal 3 al 13, mediana 5.
Adesso la mediana è tra l'11 e il 16 e i due più robusti qualche volta non si fermano: il cavaliere e il nano hanno la vita e le
cure che durano. Il patto del test resta «almeno tre piani».

**Il costo di un piano non cresce** (il cavaliere che esce dalla storia, seme 41): domande obbligate dal 1° all'11°: 5 · 4 · 12 ·
12 · 12 · 10 · 5 · 10 · 17 · 16 · 25, e la seconda metà costa 1,5 volte la prima, sotto il 1,6 del test. I primi due piani costano poco
(la scalinata di un abisso che parte morbido: i ratti), e il test li accetta da 3 a 30 (prima da 5). La forbice fra «il minimo» e
«tutto» resta oltre il doppio (il cavaliere con la roba dell'ultima riga).

**La difesa vale più dell'attacco, quaggiù**: il colpo del mostro si prende a ogni suo turno, quindi un punto di difesa vale il
doppio di un punto di vita. Il mago (la vita più bassa) è quello che arriva meno in fondo (media 11,8, mediana 8,5); il cavaliere e il nano, che durano, arrivano
più in fondo. Non è un guasto, ma è la riga da guardare col bottino
graduato.

## Dove guardare

- `dati/campagna.js` — `L_ABISSO`, `INDICE_ABISSO`, `tappaDi`, `durezzaDi`,
  `guardianoDi`, `formaDi`, `crescitaDi`, `svenimentiDi`, `guastiDellAbisso`,
  `TRATTI_DELL_ABISSO`, `trattoDi`, `scenarioDi`, `brancoDi`, `tettoDelBrancoDi`.
- `dati/mostri.js` — le specie e `duraDellaCoppia` (la coppia sta nel tratto).
- `motore/corsa.js` — `senzaFondo`, `svenimentiSpesi`, `rimettiInPiedi`.
- `motore/banco.js` — `gioca({ fino })`, `costoDeiPiani`, `finoADove`.
- `test/unita/sotterraneo-abisso.test.mjs` (pesante, `tempo: 300`): il tetto
  di `dif`, quaranta piani sani e forme che girano, mostri con numeri
  sensati fino al piano 60, le tasche, la ripresa, il record, il traguardo,
  e le misure qui sopra rifatte a ogni giro (almeno otto piani, costo che non
  cresce).
