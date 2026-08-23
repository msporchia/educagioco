[← torna al README](../README.md) · [il gioco com'è oggi](sotterraneo.md)

# 🕳️ L'abisso: scendere senza fondo

*Progetto, non elenco di idee. Qui sotto ci sono i numeri, le formule e i
punti di rottura — detti prima, che è l'unico momento in cui servono.*

## Da dove viene

La richiesta è arrivata così: «può continuare a scendere e dovrebbe
continuare a generare armi più potenti, tipo arma demoniaca +2, arma
leggendaria +5, che droppano in base al livello in cui sei. **Quello che
gli dava fastidio è "ho trovato un'arma super figa e ora ho finito la
tappa e la butta"**, quindi se ho un livello infinito può tenersela fino
a che non si stufa. Lo stesso per anelli e altre cose, e chiaramente
anche i mostri diventano più forti a ogni livello. Oltre un certo livello
penso dovremmo dargli la possibilità di farmare: torni su di un livello e
ritrovi i mostri, così se il next level è troppo forte rientri in quel
livello.»

Sono cinque cose, e la frase in grassetto è quella che regge le altre
quattro: **non si sta chiedendo più contenuto, si sta chiedendo che
quello che si trova non venga buttato via da un confine amministrativo.**
La discesa infinita è il modo per togliere quel confine, non il fine.

Vale la pena dirlo perché cambia la forma della soluzione: se il problema
fosse «finisco le sei discese e non ho più niente», la risposta sarebbe
una settima discesa. Non è quello.

## La forma scelta: l'abisso, dopo la sesta discesa

**Le sei tappe restano esattamente com'è oggi, e sotto il fondo si apre
un settimo posto senza fine.** Una discesa sola, che comincia al piano 1
e continua finché il bambino regge o si stufa. Si chiama *l'abisso* e non
*la settima discesa*, perché non è una tappa: non ha stelle, non ha un
«superata», non entra nell'indice della campagna.

Si apre a chi ha finito tutte e sei. Il gancio esiste già:
`giochi/campagne.js` scrive `libera: true` sul record della campagna
quando `tappa >= quante`, e oggi il sotterraneo non lo legge nemmeno.

### Perché non le tappe 7, 8, 9…

L'altra forma possibile — la campagna che continua a generare tappe col
ritmo di adesso, si scende, si risale, si tiene la stella — è quella che
si scarta, e per tre ragioni che non sono di gusto.

**La prima è che non risolve il problema.** Una tappa 7 finisce come
finisce la 6: si risale, e l'equipaggiamento resta lì. La frase da cui
nasce tutto («ora ho finito la tappa e la butta») resterebbe vera per
sempre, solo più in là.

**La seconda è che `profile.campagne['sotterraneo']` è un indice, ma
`stelle` è un oggetto.** Una fila che cresce in coda non rompe niente —
la nota in testa a `data/portata.js` lo dice, e vale — ma il record delle
stelle è `{ 0: 3, 1: 2, … }`, una chiave per tappa, **dentro il profilo**.
Il profilo si riscrive intero a ogni `persist()`. Un bambino che scende
per un mese si porta dietro duecento chiavi in ogni singola scrittura,
per sempre. È la stessa ragione per cui `store/sessioni.js` vive fuori
dai profili, ed è scritta lì con le sue parole.

**La terza è che la campagna è un dato che si mostra.**
`viste/Campagna.vue` disegna una carta per tappa; `TAPPE_DEL_GIOCO` in
`data/portata-giochi.js` vuole una lista finita per calcolare la portata;
`arcoDelGioco` prende il minimo e il massimo delle portate;
`manifesto.tappe` è un numero. Tutte cose che si possono fare
funzionare con una fila infinita, e nessuna che si voglia fare.

Con l'abisso, invece: `CAMPAGNA` resta di sei voci, `QUANTE_TAPPE` resta
6, `TAPPE_DEL_GIOCO.sotterraneo` non cambia, `portata` non serve (vedi
sotto), e l'unico stato nuovo è **un numero solo** — il piano più
profondo raggiunto — che sta in `cfg`, dove stanno già l'eroe scelto e le
altre scelte del bambino.

### E l'equipaggiamento? Non si cambia niente

Questo è il punto che va guardato bene, perché sembra il più difficile ed
è il più facile.

In testa a `dati/campagna.js` c'è un commento che dice, con le sue
ragioni, che **fra una discesa e l'altra si riparte nudi**, e che un
equipaggiamento che persiste vuole un'economia — dove si ripara, cosa si
rivende, come si evita che l'ultima discesa sia una passeggiata per chi
ha l'ascia — e che quell'economia «è un altro gioco».

**Quel commento resta vero e non va toccato.** L'abisso non lo viola: è
*una* discesa, e dentro una discesa l'equipaggiamento è sempre sceso col
bambino di piano in piano. Quello che cambia è che questa discesa non ha
un ultimo piano, quindi il momento in cui si butta via tutto non arriva
mai — che è letteralmente quello che è stato chiesto.

Le tre paure del commento cadono da sole:

- *dove si ripara* — non c'è niente da riparare, la roba non si consuma;
- *cosa si rivende* — il mercante compra già, a metà prezzo (`quantoVale`);
- *come si evita che l'ultima discesa sia una passeggiata* — non c'è
  un'ultima discesa, e i mostri crescono col piano.

L'unico modo di far uscire l'equipaggiamento dall'abisso sarebbe portarlo
in una tappa della campagna, e questo **non si fa e non si deve fare**:
la campagna è dove si impara, l'abisso è dove si gioca con quello che si
è imparato. Due sacchi separati, e nessuno dei due travasa nell'altro.

## Quello che è già fatto, e non va rifatto

Studiando il codice, tre pezzi della richiesta risultano già scritti.
Vale la pena dirlo prima delle formule, perché cambia molto la stima.

**1. La corsa non ha un fondo strutturale.** `Corsa.nuovoPiano()` genera
il piano da `seme + piano * 7919`: è una funzione del numero, e il numero
può crescere quanto si vuole. Le uniche righe che sanno che una discesa
finisce sono tre, tutte confrontate con `quantiPiani`: `allaScala()`,
`scendi()` e `durezzaDi()`. Con `piani` che non esiste, non c'è nessun
posto in cui la discesa si chiuda da sola.

**2. I mostri crescono già col piano, e crescono in continuo.**
`Livello.mostro()` fa già:

```js
const su = 1 + this.piano * 0.22
ossa: Math.round(m.ossa * su),
att:  m.att + Math.floor(this.piano / 2),
```

Non c'è nessun tetto. Quello che manca non è la crescita: è che oggi
`piano` riparte da zero a ogni discesa, e che **quella crescita, portata
avanti, ammazza il gioco** — misurato più sotto, ed è il numero più
importante di tutto il documento.

**3. La sosta salva già una discesa a metà, per intero.**
`motore/sosta.js` scrive il seme, il piano, la vita, lo zaino, le quattro
caselle addosso, la mappa girata compressa e tutto quello che è successo
sul piano. Un abisso ripreso domani sera è, senza scrivere una riga
nuova, la stessa discesa di stasera **con l'arma ancora in pugno**. La
persistenza dell'equipaggiamento che sembrava «un altro gioco» è già
scritta e già provata (`unita/sotterraneo-sosta`).

Restano da fare, sul serio: la crescita da ritarare, il bottino graduato,
la risalita, e i contorni.

## Il tetto delle domande, e cosa succede dopo

`dif` va da 0 a 1 e `quiz/scelta.js` la traduce in un punto dentro la
finestra **dell'età del bambino**: `bersaglio = qui − 12 + 37 · dif`.
A `dif = 1` si punta due anni sopra la sua età, che è il tetto
dell'ammissione (`finestraDi`, tre anni e mezzo sotto e due sopra). Oltre
non c'è niente: non perché manchi il codice, ma perché **l'età sta sul
bambino e non sulla domanda**, ed è una regola di casa.

La decisione è già presa, e va scritta com'è stata detta: `dif` **sale
scendendo e, arrivata a 1, ci resta appiccicata**. Non si cerca niente
oltre.

Con la formula proposta:

> **`dif(p) = min(1, 0.92 + 0.02 · p)`**, con `p` = piano dell'abisso da 0

il conto è corto: 0.92 · 0.94 · 0.96 · 0.98 · **1.00**. Ci si arriva al
**quinto piano dell'abisso**, e da lì in poi è una costante.

Cinque piani sono circa una seduta (vedi il costo, sotto). Vale la pena
scriverlo senza girarci intorno:

> **Entro la prima serata l'abisso smette di diventare più difficile da
> studiare, e da lì in poi diventa solo più difficile da sopravvivere.**

Non è un difetto da rattoppare, è la natura della cosa che si sta
costruendo. L'headroom sulla scala scolastica è tutto lì: la sesta tappa
finisce già a 0.92, cioè a un soffio dal tetto. Se si volesse una
progressione infinita *di studio* servirebbe alzare l'età del bambino, e
quella non è una manopola del gioco.

La conseguenza pratica è che **la progressione dell'abisso va progettata
tutta sulle altre leve**, e che il gioco, dal quinto piano in giù, è
un'altra cosa: un posto dove si mette alla prova quello che si sa già,
alla velocità a cui lo si sa. È esattamente il patto che il bambino
stava chiedendo — tenersi l'arma bella e andare avanti finché regge.

### Le leve che restano

La regola con cui sono state scelte è una sola, ed è quella che le
taglia quasi tutte:

> **Quello che allunga un piano non lo indurisce.** La noia non è
> difficoltà.

Sta già scritta in due posti del repo, e in tutti e due è costata
qualcosa impararla: `guastiDegliEroi` boccia un braccio sotto 3 perché
«non è difficile: è lungo», e `dati/campagna.js` racconta che il fondo è
stato fatto stretto apposta, perché quattro piani da sedici stanze
portavano la discesa fuori da una seduta.

| leva | si usa? | perché |
|---|---|---|
| ossa dei mostri | **sì**, la principale | è già lì, ed è quello che il bottino compensa |
| attacco dei mostri | **sì**, ma più piano di oggi | è la leva che decide se si sviene, e oggi corre troppo |
| pozioni, fonti e mercanti più radi | **sì** | è la scorta, e stringerla non aggiunge un passo |
| guardiani più grossi, e con la scorta | **sì**, fino a esaurimento sprite | sta sulla strada obbligata, quindi non allunga niente |
| difesa dei mostri | **no** | «la manopola velenosa»: entra in una sottrazione, e allunga invece di indurire |
| quante domande per mostro | **conseguenza**, non leva | è `ossa / attacco`, si muove da sé |
| ampiezza del piano (`misura`, `giri`) | **no** | un sotterraneo più grande *sembra* più difficile e invece è solo più lungo |
| luce che cala scendendo | **no** | cercare al buio un guardiano su sedici stanze è di nuovo *lungo*, e non era misurata |

`misura` e `giri` restano quelli che sono. Se si vuole che quaranta
piani non abbiano tutti la stessa forma di stanza, si possono far
**ciclare** fra i valori che la campagna già usa — 34, 42, 52 e giri 3,
3, 4, scelti dal piano modulo 3 — che è varietà e non crescita.
`guastiDellaCampagna` rifiuta già `giri` fuori da 2..4, ed è il tetto da
rispettare.

Le due tirate concrete, dentro le leve rimaste:

- **le scorte si diradano.** Oggi ogni piano ha una fonte e un mercante,
  sempre. Da una certa profondità diventano uno ogni due piani, poi uno
  ogni tre. Non aggiunge un passo al piano: cambia cosa si fa con le
  gemme, e trasforma «quando compro la pozione» in una decisione.
- **il guardiano prende una scorta.** Dal piano dove il capo è ormai
  sempre il gigante, accanto a lui nella stanza della scala c'è un
  secondo mostro. Sta sulla strada che si deve fare comunque, quindi
  indurisce il minimo obbligato senza allungare il giro.

### E queste leve bastano per quaranta piani? No, e vale la pena dirlo

Bastano a **non rompere niente**: la misura più sotto mostra ventiquattro
piani con un costo per piano che non cresce. Ma «non si rompe» e «c'è
ancora qualcosa da vedere» sono due cose diverse, e la seconda ha un
fondo che si tocca prima:

> **L'abisso ha varietà per una ventina di piani e numeri per sempre.**

Il motivo non è il numero delle leve, è che **il foglio 0x72 disegna
quattro mostri**: goblin, scheletro, orco e un mostro grosso. `BRANCO` li
esaurisce entro i primi piani, e da lì in poi il guardiano è il gigante
per il resto dell'eternità, con più ossa. Le scorte si possono diradare
una volta sola, e la scorta del guardiano si aggiunge una volta sola.
Dopo, quello che cambia sono solo le cifre.

Questo va scritto adesso perché è la cosa che si scoprirà giocando, e
perché la cura giusta non è reintrodurre di nascosto una leva che allunga
i piani: **è un quinto mostro.** La strada c'è già ed è battuta — il
Dungeon ha smesso di usare le emoji e si è fatto un `grafica/bestiario/`
di venti creature disegnate a mano (vedi `CLAUDE.md`). Il giorno in cui
l'abisso avrà bisogno di più profondità, il lavoro da fare è quello, non
un'altra formula.

## Come cresce l'abisso: le formule, coi numeri

Tutto quello che segue è misurato col banco (`motore/banco.js`), non
scelto a occhio. Il metodo è quello di casa: si fa scendere un giocatore
finto e si conta.

### Il punto di rottura, misurato

Prima di proporre qualcosa, ecco cosa succede **oggi** se ci si limita a
lasciar crescere il numero del piano, senza toccare il bottino. Una
discesa di 18 piani, misura 42, tre semi diversi, `bravura 0.8` (il
bambino che risponde bene otto volte su dieci — il patto del banco):

```
seme  7: 7 piani su 18  ·  22 svenimenti  ·  in mano: spada, att 5
seme 41: 11 piani su 18 ·  22 svenimenti  ·  in mano: bastone-magico, att 5
seme 99: 9 piani su 18  ·  22 svenimenti  ·  in mano: bastone-magico, att 5
```

**Ci si ferma fra il settimo e l'undicesimo piano, sempre.** E il motivo
non è quello che sembra: non è che i mostri diventano lunghi da
abbattere, è che **fanno troppo male**. `att: m.att + floor(piano/2)` non
ha tetto, la difesa dell'eroe sì (fra corazza, scudo e gioiello si arriva
sì e no a 9), e `danno = m.att − dif`. Al piano 20 un orco picchia 14: la
metà arriva addosso **anche rispondendo bene**, perché il graffio è metà
del colpo pieno. Quattro scambi con un orco sono ventotto punti di vita
buttati per un bambino che non ha sbagliato niente.

Questo è il numero che decide tutto il resto, e non si vedeva leggendo la
tabella dei mostri.

### La regola che tiene in piedi l'abisso

> **Il costo di un mostro in domande è una costante; quello che cresce è
> il prezzo di restare indietro.**

`colpiPer(m) = ossa / (att − dif)`. Se `ossa` cresce col piano e `att` no,
il gioco diventa lungo. Se crescono insieme, resta della stessa lunghezza
e quello che cambia è **cosa succede a chi non ha aggiornato l'arma**.
È lo stesso mestiere che il Dungeon fa già con `forzaDi` e
`gradoBottino` (`giochi/dungeon/dati/mostri.js`), ed è il modello da
copiare.

Quindi le tre formule, con `p` = piano dell'abisso da 0:

```
mostro:   ossa = base.ossa × (1 + p · 0.22)      ← come oggi
          att  = base.att  + floor(p / 3)        ← oggi è p/2, troppo
          dif  = base.dif                        ← ferma, per sempre

bottino:  G(p) = floor(p / 2)                    ← il grado che gira a quel piano

eroe:     att ≈ 3 (base) + 3 (arma di gradino 3) + G(p)
          dif ≈ 1 + 3 (corazza) + 3 (scudo) + floor(G(p) / 2)
```

Il `+N` di un'arma va **sull'attacco**, quello di un'armatura o di uno
scudo **sulla difesa a metà ritmo** (`dif = base.dif + floor(N/2)`), per
la stessa ragione per cui il Dungeon fa crescere la difesa dei mostri a
un terzo dell'attacco: la difesa entra in una sottrazione, e un punto in
più annulla un punto in meno.

E i due si incontrano: `floor(G(p)/2) = floor(p/4)`, che è la crescita di
difesa che serve. I numeri non sono stati scelti per essere eleganti,
sono stati scelti perché sono quelli che tengono in piedi la discesa.

### Cosa esce, misurato

Con quelle formule, 24 piani, quattro semi, `bravura 0.8`:

| | piani finiti | svenimenti | domande/piano (minimo) | domande/piano (tutto) |
|---|---|---|---|---|
| seme 7 | 24/24 | 15 | 15,8 | 41,1 |
| seme 41 | 24/24 | 15 | 17,0 | 42,9 |
| seme 99 | 24/24 | 13 | 13,1 | 43,4 |
| seme 203 | 24/24 | 13 | 15,4 | 39,8 |

Le tre cose da guardare:

- **il costo di un piano non cresce**: fra 13 e 17 domande obbligate,
  dal primo piano al ventiquattresimo. È il segno che ossa e braccio si
  muovono insieme;
- **la forbice resta larga**: 15 contro 41, cioè 2,6×. È il criterio di
  casa (`docs/sotterraneo.md`: «se "tutto" costasse quanto "il minimo", in
  mezzo non ci sarebbe più niente da scegliere»), e regge;
- **il guardiano resta un guardiano**: costa 4 risposte al primo piano e
  7 al cinquantunesimo. Con l'arma di due piani fa invece 8–10, che è la
  differenza che si sente e che dà un motivo per aprire il forziere.

E il conto che serve per progettare tutto il resto:

> **85 domande sono il tetto di una seduta** (lo dice già
> `unita/sotterraneo`). A 15 domande per piano, **una serata sono cinque
> o sei piani**.

Da cui: il piano 30 sta a cinque o sei sere. L'abisso non è una cosa che
si finisce, ed è giusto così, ma **deve essere ripreso a metà bene**,
perché è l'unico modo in cui esiste.

### Svenire: si perde lo zaino, non il corredo

**Quello che si ha addosso resta — l'arma, la mano debole, il corpo, il
dito — e si svuotano le sei tasche.** Le gemme restano dimezzate, com'è
oggi.

La regola punisce senza umiliare: si perde **il margine accumulato**, non
il lavoro di dieci piani. È anche l'unica delle tre risposte possibili
che tiene in piedi la richiesta di partenza — l'ascia leggendaria +7 non
si butta *mai*, né a fine tappa né a fine serata né svenendo — e insieme
lascia allo svenimento un prezzo che si sente. «Perdo tutto» avrebbe
reso l'abisso un posto in cui una brutta sera cancella una settimana;
«non perdo niente» avrebbe reso l'abisso un posto che non si può
perdere, cioè quello che il sotterraneo era prima di
`SVENIMENTI_IN_REGALO`.

C'è anche una conferma che viene dal codice: il cartello dello
svenimento oggi dice già *«Le gemme che avevi in tasca non ci sono più,
ma quello che avevi addosso sì»*. La distinzione fra **in tasca** e
**addosso** è già la frase che il gioco usa; la regola nuova non fa che
estendere «in tasca» dalle gemme a tutta la tasca.

Le tasche si **svuotano**, non si rovesciano per terra: la roba non
resta lì da recuperare. Ritrovarla all'ingresso vorrebbe dire non aver
perso niente, con in più un giro a piedi.

Tre cose sopravvivono e vanno dette, perché sono quelle che eviterebbero
una sorpresa brutta:

- **la torcia non è nello zaino.** È un interruttore sulla corsa
  (`corsa.torcia`), non un oggetto — vedi «la torcia non si accende: si
  ha» in `dati/cose.js`. Chi sviene non si ritrova al buio, che sarebbe
  il modo più rapido di trasformare uno svenimento in una serata finita;
- **la vita massima cresciuta con l'elisir del toro resta**: è in
  `vitaBase`, non in tasca;
- **le gemme si dimezzano, non si azzerano**, com'è oggi.

#### Regge? Le pozioni

La cosa da verificare è se questa regola renda stupido accumulare
pozioni: se perdo le tasche svenendo, comprare cinque boccette è una
scommessa.

**Regge, e sistema un difetto che il gioco ha già.** In
`docs/sotterraneo.md` è scritto nero su bianco che prima del graffio «le
pozioni si accumulavano in fondo allo zaino senza che nessuno le bevesse
mai», e che era un guaio perché con loro spariva il motivo di cercare
una fonte, di spendere dal mercante, di decidere se scappare. Il graffio
ha risolto metà del problema — adesso una pozione serve. Questa regola
risolve l'altra metà: **una pozione bevuta vale sempre più di una
pozione tenuta da parte.** Non punisce chi accumula, punisce chi
accumula *senza bere*, che è esattamente il comportamento che si voleva
togliere.

Va detto però che il gioco non lascia bere in qualunque momento: lo
zaino è l'ultimo anello del `v-else-if` in `Gioco.vue`, quindi **con uno
scontro aperto non si apre**. Si beve *fra* un mostro e l'altro. Questo
è giusto e ha già la sua rete: i due numeri («ti graffia 2 · se sbagli
4») stanno scritti sotto il mostro **prima** di rispondere, e da uno
scontro si può scappare al prezzo di un graffio. Chi sviene con cinque
pozioni in tasca aveva l'informazione e non l'ha usata.

Resta un caso vero e va accettato: la vita bassa e un mostro che
intercetta per strada. Succede, ed è quello che rende una discesa una
discesa.

#### E il tetto agli svenimenti?

`svenimentiDi(tappa) = 4 + tappa.piani` non ha senso su una discesa che
di piani non ne ha un numero. E nell'abisso non c'è una tappa da
superare, quindi non c'è nessun «hai fallito» da dichiarare.

**Il conto diventa: tre svenimenti per piano, e riparte scendendo.**
Scendere è la cosa che si è guadagnata e rinnova le occasioni;
accamparsi su un piano no. Il banco ne misura 13–15 in ventiquattro
piani, cioè **0,6 per piano** — e il suo giocatore finto è avaro: non
beve quasi mai, non si scosta per una fonte, non compra niente. Tre è
largo, e morde solo sul piano andato storto.

Toccato il fondo **si risale**, col corredo addosso e col record: non è
una sconfitta, è la sera che finisce. La discesa riprende da lì
(«l'abisso · piano 23» sulla carta della ripresa), perché nessuno
rifà ventitré piani a piedi.

E qui c'è la cosa che rende il conto quasi superfluo, e che vale la pena
scrivere perché è il freno vero: **le gemme sono il carburante del
`+N`.** Chi sviene di continuo arriva al mercante con le tasche vuote e
metà gemme, quindi non compra il grado che la sua profondità pretende, e
si ferma da solo. Non c'è nessun modo di franare fino al piano 50: il
record non si può accumulare a forza di svenimenti, perché ogni
svenimento toglie proprio quello che serve per scendere ancora. Il
contatore a tre serve a rendere la serata leggibile, non a difendere
l'economia — quella si difende da sé.

## Il bottino graduato: il nome, e il problema delle chiavi

Questo è il punto tecnico più delicato del progetto, e va risolto qui.

### Il problema

`dati/cose.js` è una tabella di trentaquattro oggetti con chiavi stabili.
`sosta.js` salva lo zaino come **elenco di chiavi**, e al rientro butta
quelle che non riconosce:

```js
const vera = k => (k && COSE[k] ? k : null)
corsa.zaino = (dato.zaino || []).filter(k => COSE[k])
```

E la regola di casa dice che **gli id dei contenuti non si rinominano
mai**. Un'ascia generata al piano 14 non ha una riga in tabella: se la si
salvasse come `ascia-demoniaca-5`, domani sera sparirebbe dallo zaino
senza un errore da nessuna parte.

### La soluzione: il grado è un suffisso, non un id

> **Una cosa si chiama `base#N`**: `ascia#5`, `corazza#3`,
> `amuleto-rosso#7`. La parte prima del cancelletto è **la chiave di
> sempre**, e non cambia mai. Il numero dopo è un modificatore.

E la regola che rende tutto compatibile:

> **`#0` non si scrive.** Un oggetto di grado zero è la chiave nuda, la
> stessa di oggi.

Da cui, gratis: **tutta la campagna continua a produrre esattamente le
chiavi di oggi**, i salvataggi vecchi si rileggono senza toccare niente,
e nessun test di oggi cambia colore.

### Come si legge

Oggi ci sono **56 letture** `COSE[k]` sparse in sette file:

| file | quante |
|---|---|
| `motore/corsa.js` | 27 |
| `dati/cose.js` | 8 |
| `test/unita/sotterraneo.test.mjs` | 7 |
| `Gioco.vue` | 6 |
| `scena/tela.js` | 3 |
| `motore/banco.js` | 3 |
| `motore/sosta.js` | 2 |

Tutte e cinquantasei fanno la stessa cosa: *dammi la scheda della chiave
k*. Diventano una funzione sola:

```js
export function cosa(k) {
  if (!k) return null
  const [base, n] = String(k).split('#')
  const c = COSE[base]
  if (!c) return null
  const grado = Number(n) || 0
  if (!grado) return c
  return { ...c, grado, chiave: k, nome: nomeGraduato(c, grado), ...bonusDi(c, grado) }
}
```

Il lavoro è meccanico e verificabile: un controllo in `guastiDelleCose`
che **fuori da `dati/cose.js` non compaia più nessun `COSE[`** lo tiene
onesto per sempre. È la stessa forma della «sostituzione con guardia» che
si usa già in casa: un replace senza assert produce un file che compila e
si rompe a schermo.

Due sottigliezze da non dimenticare:

- **`possiedo(k)` e `quanteNeHo(k)` confrontano la base, non la chiave
  intera.** Il mercante non deve offrire una `spada#3` a chi ha una
  `spada#7` in pugno — è la stessa spada;
- **e così `posso(k)`**, che è nato dopo questo documento: una classe
  porta una **famiglia**, e la famiglia sta sulla scheda nuda. Un
  `ascia#7` la impugna chi impugna le asce, come l'ascia di banco — se
  la lettura passasse dalla chiave intera, il grado diventerebbe di
  colpo una scappatoia al limite di classe;
- **lo sprite viene dalla base.** Un'ascia +7 è disegnata come un'ascia,
  e va bene: nessuna arte nuova. Se si vuole che si veda che è speciale,
  il posto è il filo di luce che `scena/tela.js` già disegna intorno alle
  cose toccabili — più acceso col grado.

### Il nome

Il grado sceglie l'aggettivo, e il `+N` si scrive in coda:

| grado | come si chiama |
|---|---|
| 1–2 | temprata / temprato |
| 3–5 | runica / runico |
| 6–9 | demoniaca / demoniaco |
| 10+ | leggendaria / leggendario |

«Ascia demoniaca +7», «Spadone leggendario +11», «Corazza runica +4».

**Il nome si accorda, ed è deciso.** L'alternativa era un aggettivo
invariabile («Ascia del demone +7»), che avrebbe risparmiato un campo:
si scarta, perché «Ascia demoniaco +7» lo legge un bambino che sta
imparando l'italiano, e questo è un gioco educativo — un errore
stampato in una casella dello zaino non è una svista, è una lezione
sbagliata data trenta volte a sera.

Serve quindi **un campo `genere: 'f'` sulle voci femminili di `COSE`** —
ascia, accetta, bipenne, spada, spada corta, balestra, verga, corazza,
torcia, chiave, boccetta, pozione, ampolla — e un controllo in
`guastiDelleCose` che lo pretenda su tutto quello che ha un `dove` o un
`usa`. Il controllo **parte rosso** ed è il modo in cui il lavoro si fa:
finché una voce non dichiara il genere, il test lo dice per nome.

È lo stesso mestiere di `dellArticolo` in `viste/cambio.js`, che esiste
già proprio per questo e ha già il commento che spiega perché: «"al posto
di il medaglione" in un gioco per bambini che stanno imparando a leggere
è un errore che insegna». Conviene guardare se le due cose vanno messe
insieme in un posto solo — `dellArticolo` oggi indovina l'articolo dalla
prima lettera, e col campo `genere` in tabella potrebbe smettere di
indovinare.

### Chi lascia cosa

Con `G(p) = floor(p / 2)` come grado che gira a quel piano:

| chi | grado di quello che lascia |
|---|---|
| **il guardiano del piano** | esattamente `G(p)`, **e lascia sempre** |
| un forziere | `G(p)` una volta su tre, se no `G(p)−1` o `G(p)−2` |
| un mostro qualunque | da `G(p)−4` a `G(p)−2` |
| il mercante | `G(p)−1`, e i prezzi di quel grado |

**Il guardiano lascia sempre, ed è la riga che tiene in piedi tutto.**
Oggi il bottino è probabilistico (`droppa: 0.6` per l'orco, `0.85` per il
gigante), e va benissimo in una discesa da tre piani: se non cade niente,
la discesa dopo si riparte comunque da zero. In una discesa infinita no —
tre guardiani a vuoto di fila e il bambino resta indietro di tre gradi
senza aver sbagliato niente, e da lì non recupera più. Il guardiano è
l'unica cosa che in tutto il sotterraneo **non si può aggirare**: perciò
è l'unico posto dove si può garantire il pavimento della progressione.

I prezzi crescono con lo stesso passo: `prezzo = base.prezzo × (1 + N ×
0.5)`, lineare e mai esponenziale — come vuole `CALIBRAZIONE.md`, e
perché le gemme che si trovano crescono anch'esse in modo lineare
(`quante: scheda.gemme + floor(piano · 1.5)` e `6 + piano · 3` nei
forzieri). Due rette con la stessa pendenza: il rapporto resta quello di
oggi.

### Una cosa che si rompe: due armi leggere contro una pesante

C'è un invariante scritto in `dati/cose.js` e provato in
`unita/sotterraneo`: **due armi leggere valgono la pesante dello stesso
gradino**, perché la mano debole colpisce la metà. Oggi torna:
2 + ⌈2/2⌉ = 3 = l'ascia (gradino 2, due mani).

> **Nota, scritta dopo.** Questa riga diceva «due armi di secondo
> gradino valgono un **terzo** gradino», e ci si arrivava perché
> un'arma a due mani non veniva pagata per la mano che ti mangia: la
> spada e l'ascia costavano uguale e picchiavano uguale, quindi
> pareggiare l'ascia richiedeva di salire di gradino. Adesso `mani: 2`
> vale `LA_MANO_CHE_RESTA` (+1) e il pareggio è fra cose che costano
> uguale. **Il conto qui sotto non cambia**: cambia solo con chi si
> confronta la coppia.

Col `+N` sommato all'attacco non torna più. Due `spada#5` fanno
7 + ⌈7/2⌉ = 11, un `ascia#5` ne fa 8. Il rapporto va a 1,4× e ci
resta: portarne due diventa **sempre** la mossa giusta, e le armi
pesanti smettono di esistere.

La cura è una riga e si legge bene: **il grado sta sulla mano che
comanda.** La mano debole porta l'arma, non la sua magia.

```js
get attaccoMancino() {
  const c = COSE[base(this.mancina)]        // la scheda nuda, senza il +N
  return c ? Math.ceil((c.att || 0) / 2) : 0
}
```

Con questa: due `spada#5` fanno 7 + 1 = 8 = `ascia#5`. L'invariante
torna a ogni grado, e il test che c'è già («due leggere valgono una
pesante») è la guardia che lo tiene fermo per sempre.

## Il salvataggio

`motore/sosta.js` ha una `VERSIONE` che sale quando la forma cambia, e
un salvataggio di ieri con una forma di ieri non si legge — cioè si
buttano venti minuti di discesa a chi aggiorna proprio in quel momento.

Nella prima stesura questa sezione stava in venti righe e concludeva che
la versione non doveva salire. Da quando si risale **di quanti piani si
vuole**, la sosta non deve più ricordare un piano: deve ricordarne
quaranta — e quella conclusione va riguadagnata invece che ereditata.

Il resto di questa sezione è quel conto, ed è la parte del progetto che è
cambiata di più. Le quattro domande, in ordine: **dove finisce** oggi il
salvataggio, **quanto pesa** un piano, **se serve un tetto**, e solo alla
fine **se la versione regge**.

### Dove finisce la sosta, e perché la domanda è la prima

`salvaSosta()` in `giochi/campagne.js` scrive in
`progresso(chiave).sosta`, cioè in
`state.profile.campagne['sotterraneo'].sosta`. **È dentro il profilo.**
E `persist()` fa:

```js
save(KEY(state.player), JSON.parse(JSON.stringify(state.profile)))
```

cioè **clona e riscrive il profilo intero**, ogni volta. Il sotterraneo
la chiama dopo *ogni risposta* e comunque ogni otto secondi
(`Gioco.vue`). Un elenco che cresce senza fine lì dentro è precisamente
il difetto per cui `store/sessioni.js` è stato messo fuori dai profili,
e sta scritto nel suo commento in testa: «quello si riscrive intero a
ogni `persist()`, e un elenco che cresce di dieci righe al giorno
finirebbe in ogni scrittura per sempre».

Quindi la domanda non è «quanto pesa un piano», è **quanto pesa un piano
moltiplicato per il numero di volte che lo riscriviamo**.

### Quanto pesa un piano, misurato

Numeri veri, presi facendo giocare il banco fino in fondo e poi pesando
il JSON:

| piano | `robe` come si salvano oggi | `visto` compresso | stanze viste |
|---|---|---|---|
| Le cantine (30×30) | 22 pezzi, **1 910 byte** | 115 byte | 7 byte |
| Il fondo (42×42) | 54 pezzi, **4 774 byte** | 293 byte | 17 byte |
| Il labirinto (52×52) | 87 pezzi, **7 836 byte** | 413 byte | 34 byte |

Sono ~88 byte a pezzo, e il pezzo medio è **arredo**: un barile, una
cassa, uno stendardo. Su «Il fondo», 14 pezzi su 54 sono arredo e pesano
1 035 byte — un quinto del salvataggio speso per ricordare dove stanno i
barili, che sono una funzione del seme e non cambiano mai.

Da cui, moltiplicando:

| piani ricordati | salvati come oggi |
|---|---|
| 5 | ~23 KB |
| 10 | ~47 KB |
| 20 | ~94 KB |
| **40** | **~188 KB** |

Centottantotto chilobyte clonati e riscritti dopo ogni risposta. Non è
il tempo di CPU il problema — misurato, il `JSON.parse(JSON.stringify)`
di un profilo da 200 KB costa mezzo millisecondo su un computer — è che
`store/storage.js` ha un timeout di 2,5 secondi su `openDb()` che
`CLAUDE.md` chiama «l'unico modo noto di perdere progressi», e che il
ripiego è `localStorage`, che di quota ne ha cinque megabyte per **tutti
i profili di casa**. Un salvataggio da 188 KB per bambino non è
un'ottimizzazione mancata: è il modo di scoprire quel guasto su un
telefono lento.

### Il piano lasciato alle spalle non si salva: si salva la differenza

La chiave sta in una riga che il generatore ha già:
**`generaPiano` è deterministico**, quindi rigenerando un piano dal suo
seme si riottiene la stessa lista `robe`, **nello stesso ordine**. Un
mostro che è tornato in vita non ha bisogno di essere salvato; un barile
nemmeno; una porta che si è aperta è **il numero 12 nella lista**.

Quindi, per un piano che si è lasciato alle spalle, si scrive solo:

```js
{ p: 12, v: "…" /* visto, a lunghezze di tratti */, c: ["30,12", "8,41"] }
```

dove `c` sono le **celle** delle cose che non tornano: forzieri aperti,
curiosità già lette, porte già aperte, cose già raccolte.

**Celle e non indici, e la differenza conta.** L'indice nella lista
`robe` sarebbe più corto — misurato, 26 byte contro 68 su «Il fondo» — ma
è **legato all'ordine in cui `arreda()` mette le cose nella lista**. Il
giorno in cui qualcuno sposta di due righe la generazione delle curiosità
(è già successo una volta: sono state rese più fitte), tutti i
salvataggi in giro si ritrovano marcato come «già aperto» il forziere
sbagliato. Nessun errore, nessuna schermata rotta: un baule chiuso che
non si apre più. Con la cella, invece, un disallineamento vuol dire al
massimo che quella cella non corrisponde più a niente, e il piano si
rilegge come se fosse intatto — **un guasto che non si nota contro uno
che si perdona da solo**, e sono 42 byte a piano.

Misurato, sulle stesse tre discese:

| piano | `robe` intere | **solo la differenza** | di cui `visto` |
|---|---|---|---|
| Le cantine | 1 910 byte | **154 byte** | 115 |
| Il fondo | 4 774 byte | **378 byte** | 293 |
| Il labirinto | 7 836 byte | **514 byte** | 413 |

**Dodici volte più piccolo.** E quaranta piani diventano **~15 KB**
invece di 188.

Da notare: nella differenza, quasi tutto è `visto`. L'elenco delle cose
consumate sono 3–11 celle, cioè meno di cento byte. Se un giorno anche
15 KB dessero fastidio, la leva è lì — si può ricordare la sola `stanze`
(7–34 byte, e la luce di una stanza si riaccende entrandoci perché è già
così che funziona) e rinunciare alla traccia dei corridoi già percorsi.
Porterebbe un piano a ~90 byte e quaranta piani a 3,6 KB. **Non lo
propongo adesso**: 15 KB non sono un problema, e la traccia dei corridoi
è metà di quello che si è girato al buio.

### Due rappresentazioni, e la ragione è pulita

> **Il piano su cui si sta si salva com'è oggi, per intero. Quelli
> lasciati alle spalle si salvano come differenza.**

Non è un'ottimizzazione a due velocità: è che le due cose sono davvero
diverse. Sul piano dove si è, tutto può essere a metà — un mostro con
sette ossa su dodici, una spada per terra che si era buttata, il banco
del mercante già pescato. Su un piano che si è lasciato, **i mostri
tornano comunque al pieno**, quindi l'unica cosa che sopravvive è quella
che non torna mai.

Conseguenza da dire, perché si nota giocando: **la roba lasciata per
terra su un piano che si abbandona non si ritrova.** Quando si scende o
si sale, il piano che si lascia si condensa nella sua differenza, e la
spada buttata in un angolo se ne va con lui. È coerente con «i mostri
tornano»: quel piano si è rimesso a posto.

### Serve un tetto? Sì, e non costa niente

Con la differenza, quaranta piani stanno in 15 KB e cento in ~37 KB.
Cresce piano, ma cresce per sempre. **Si tengono i venti piani più
recenti** e gli altri si dimenticano.

La cosa da guardare è cosa si perde a dimenticare un piano: che
tornandoci i forzieri sono di nuovo chiusi, cioè un modo di farsi il
bottino due volte. Solo che **non funziona, per via di una regola che
c'è già**: il bottino è della profondità del piano, non della tua. Chi è
al piano 30 e scende venti piani per riaprire il forziere del piano 5 ci
trova roba di grado 2 e sei gemme. Il tetto è gratis perché l'economia
si difende da sola — è la stessa riga che rende innocuo il farming, e
qui la si incassa una seconda volta.

### La versione: resta 3, e la conclusione regge

Era la conclusione migliore del documento di prima, ed è stata la prima
cosa che ho riverificato dopo aver cambiato la forma. Regge, per due
ragioni:

- **`robe` non cambia significato.** Continua a essere «lo stato del
  piano su cui sono adesso, per intero», che è quello che era. Il campo
  nuovo — chiamiamolo `dietro`, l'elenco delle differenze — è
  **aggiunto**, e un salvataggio che non ce l'ha si legge come «non ho
  nessun piano alle spalle da ricordare», che è esattamente com'era il
  gioco prima. È lo stesso ragionamento con cui `mancina` è entrata
  senza far salire la versione, e il file lo scrive: «la versione sale
  quando un campo *cambia significato*, non per un campo in più con un
  ripiego ovvio»;
- **`zaino` e le quattro caselle** restano elenchi di chiavi, e le chiavi
  di ieri non hanno il cancelletto (`#0` non si scrive).

I campi nuovi in tutto sono tre:

| campo | cos'è | quanto pesa |
|---|---|---|
| `abisso: true` | questa non è una tappa | niente |
| `dietro` | la differenza dei piani già visitati, al massimo venti | ~340 byte a piano, ~7 KB al tetto |
| `fondo` | il piano più profondo toccato **in questa discesa** — serve a rientrare lì dopo l'ultimo svenimento | niente |

(Il *record* di sempre non sta qui: sta in `cfg.abisso`, perché deve
sopravvivere alla sosta buttata via. Vedi «cosa tocca fuori dal gioco».)

E un campo esistente cambia **valore**, non significato: `tappa` è
l'indice nella campagna, e nell'abisso vale `-1`. Va guardato perché
`dice()` fa `campagna[dato.tappa]` e con `-1` torna `undefined`, quindi
la carta «riprendi» sparirebbe in silenzio invece di dire «l'abisso ·
piano 23». Una riga, ma se ci si dimentica non lo dice nessuno.

**Cosa succede a una discesa in corso il giorno del rilascio: niente.**
Chi ha lasciato a metà «Il labirinto» ieri sera la riprende oggi, con
tutta la sua roba, perché la campagna non genera gradi e la versione non
è salita. È il caso migliore possibile e va tenuto: è il motivo per cui
il `#0` non si scrive, ed è il motivo per cui la differenza è un campo
in più e non una forma nuova.

### E se un giorno la sosta va messa fuori dai profili

Con la differenza e il tetto non serve: il salvataggio dell'abisso sta
sotto i 10 KB, che è l'ordine di grandezza della sosta di oggi (2–8 KB
per un piano solo). **Il lavoro giusto adesso è rendere il dato piccolo,
non spostarlo.**

Ma vale la pena scrivere cosa costerebbe, perché è la strada che si
prende se domani qualche altro gioco vuole una sosta grossa: `sosta`,
`salvaSosta` e `buttaSosta` in `giochi/campagne.js` andrebbero a
scrivere su una chiave d'archivio propria (`sosta:sotterraneo:<id>`),
come fa `store/sessioni.js` — e allora bisogna insegnarlo a **tre** posti
che oggi non lo sanno: `azzeraCampagna`, `resetPlayer` e soprattutto
`store/cestino.js`, che mette da parte `state.profile` e lo rimette
indietro. Un dato fuori dai profili non se ne va da solo e non torna da
solo: `scordaSessioni` esiste per questo, e servirebbe il suo gemello.

## Tornare su: come si farma senza rompere il gioco

La richiesta: «torni su di un livello e ritrovi i mostri, così se il
next level è troppo forte rientri in quel livello». **Si risale di
quanti piani si vuole**, non di uno.

**In fondo alla stanza d'ingresso di ogni piano c'è una seconda scala,
quella che sale.** Portarci sopra l'eroe rigenera il piano di sopra dal
suo seme — stesso disegno, stesse stanze, stesso posto della scala —
**coi mostri di nuovo al loro posto**, e riporta la profondità a `p−1`.
Sopra ce n'è un'altra, e un'altra ancora.

### Non c'è nessun menù, e non serve

Il modo di scegliere dove risalire è **non sceglierlo: si cammina.** La
scala che sale porta al piano di sopra e basta; chi ne vuole risalire
cinque ne risale cinque, uno alla volta.

Non è una scorciatoia mancata, è la sola forma che questa cosa può avere
in un gioco per bambini. Una pila di quaranta voci — «piano 1, piano 2,
piano 3…» — non è una scelta, è un elenco: non si legge, non si ricorda,
e chiede di sapere cosa c'era al piano 14 quando l'unica cosa che si sa
è che *quello di prima era più facile*. E un salto istantaneo renderebbe
il farming gratis, che è precisamente quello che non deve essere.

Camminando invece il prezzo è quello giusto e non lo decide nessuno: **i
mostri sono tornati**, quindi risalire cinque piani è cinque piani di
mostri, cioè cinque piani di domande. È già l'esercizio che si voleva, e
non c'è nessun bottone che lo salti.

Due appoggi perché non diventi una penitenza: la mappa di quel piano è
ancora accesa (è quello che ricorda la sosta, vedi sopra), quindi si sa
già dov'è la scala; e i mostri si possono aggirare tutti — solo il
guardiano no, ma la sua chiave serve per **scendere**, non per salire.
Risalire un piano già fatto è una camminata con dei mostri da schivare,
non un piano da rifare.

L'unico posto in tutto il gioco dove compare un numero di piano è la
carta della ripresa sulla mappa delle discese: *«l'abisso · piano 23 · ❤️
34 · 💎 210 — torno giù da dove ero»*. Una riga, come per le sei tappe.

### Cosa si ritrova e cosa no

| | torna? |
|---|---|
| i mostri | **sì**, tutti, con le ossa piene del loro piano |
| le gemme sparse | sì (le portano i mostri; quelle per terra no) |
| i forzieri | **no**: aperto una volta, aperto per sempre |
| le curiosità | **no**: la battuta si legge una volta |
| il mercante | sì, e ripesca il banco: è l'unico modo di spendere le gemme che si è tornati a prendere |
| la roba lasciata per terra | **no**: il piano che si abbandona si rimette a posto |
| la mappa già girata | sì: resta illuminata, si sa già dov'è la scala |

I forzieri e le curiosità sono la riga che conta. Se tornassero,
risalire e ridiscendere sarebbe **la strada più veloce per il bottino
migliore**, e il gioco diventerebbe «apro lo stesso baule per mezz'ora».
È il modo classico in cui questo meccanismo si rompe.

La roba per terra invece non torna, e non è una scelta di design: è la
conseguenza di come si salva un piano lasciato alle spalle (vedi «due
rappresentazioni», sopra). Vale la pena che sia coerente con quello che
il bambino vede: **un piano che si abbandona si rimette a posto** — i
mostri tornano al loro posto e quello che si era buttato in un angolo se
ne va con loro. È una frase sola da capire, e non ne servono due.

### E la difesa vera: il bottino è del piano, non tuo

La cura più forte non è una restrizione, è una conseguenza della regola
del bottino:

> **Un piano dà il bottino della sua profondità, non della tua.**

Chi è al piano 20 e risale al 19 trova roba di grado 9 mentre ne porta
addosso di grado 10. Non c'è **niente** da guadagnare, in termini di
equipaggiamento, nel tornare su. Si torna su per le gemme, per una
pozione, per una fonte, per rifiatare — cioè esattamente per il motivo
per cui è stato chiesto: *«se il next level è troppo forte, rientri in
quel livello»*. Il farming resta una rete di sicurezza e non diventa mai
la strada conveniente, e non serve nessun divieto per ottenerlo.

### E il rischio parallelo: pagare la ripetizione

C'è una regola di casa che va guardata qui: **le monete sono l'obiettivo
dei bambini**, e nessun gioco deve pagare una risposta sbagliata.
Il rischio gemello, in un gioco dove si può ripetere, è **pagare la
ripetizione invece dell'esercizio**.

Qui non succede, e vale la pena capire perché: nel sotterraneo *ogni*
cosa costa una risposta. Un'ora passata a macinare il piano 19 sono
centottanta domande vere, cioè un'ora di esercizio, cioè esattamente
quello per cui `CALIBRAZIONE.md` dice di pagare. Non c'è nessun gesto,
in tutto il gioco, che produca valore senza passare da una domanda.

Quello che va guardato non è dunque la quantità ma la **varietà**: la
stessa classe di domande, ripetuta cinquanta volte in una sera, è
un'ora di esercizio ma su una cosa sola. Quel guardiano c'è già ed è
altrove — la banda stretta della pesca (`nucleo/bisogno.js`), la finestra
dell'età, e `quiz/allarme.js` che scrive nella posta dei grandi quando
una chiave diventa un muro. Non serve niente di nuovo, ma serve saperlo:
**se l'abisso rompe qualcosa, lo romperà lì e lo dirà da solo.**

## Cosa tocca fuori dal gioco

- **Il premio in monete: 🪙1 per risposta giusta.** Le tappe pagano
  `premio × stelle`; l'abisso non ha né tappe né stelle. Serve un
  contatore che oggi non c'è — `corsa.giuste`, una riga in `rispondi()`
  — e si paga **risalendo**. Mai per una risposta sbagliata: è la regola
  di casa, e qui sarebbe pure il modo più veloce di fare monete.
  Sulla cifra: 🪙1 **è il tasso di oggi per chi esplora** — «Il fondo»
  paga 🪙34 × 3 stelle = 🪙102 per un centinaio di domande, misurate.
  Non è il tasso giusto secondo `CALIBRAZIONE.md`, che dice 🪙3 per una
  domanda vera; ma nessun gioco di casa paga quel tasso, e mettere
  l'abisso da solo a 🪙3 lo renderebbe di gran lunga il posto più
  redditizio della casa. Si alza a 🪙3 il giorno in cui si rifà il giro
  dei premi di tutti i giochi — che è un lavoro già dichiarato in fondo
  a `CALIBRAZIONE.md`, e che il contatore `giuste` serve comunque a
  rendere possibile.
- **`profile.campagne['sotterraneo']`.** Non si tocca. `tappa` resta 6,
  `libera` resta il cancello, `stelle` non cresce. Il record della
  profondità va in `cfg.abisso = { fondo: 23 }` via `ricorda()`, che è
  già il posto delle scelte del bambino.
- **`data/portata.js`.** L'abisso **non ha `portata` e non deve
  averla**. Non è una tappa, non sta in `TAPPE_DEL_GIOCO`, e il suo
  cancello non è l'età ma «hai finito le sei discese» — che è un
  criterio migliore, perché è dimostrato invece che stimato. `arcoDi` e
  `giocoDaOffrire` continuano a guardare le sei tappe e restano giusti.
- **`gioco.js`, il manifesto.** `tappe: QUANTE_TAPPE` resta 6.
  `riassunto()` guadagna una coda quando la campagna è finita: *«abisso ·
  piano più profondo 23»* invece di «discesa 6 di 6». All'albo va un
  primato `sotFondo` (`segnaBest`) e un traguardo — «🕳️ Giù per il
  buco», soglie `[10, 25, 50]`. `xp` non cambia: conta già `sotPiani`,
  che l'abisso alimenta come tutto il resto.
- **`viste/Campagna.vue`.** Una carta in fondo, sotto le sei, e solo se
  `libera`: *«🕳️ L'abisso — si scende finché si regge. Il più giù che sei
  arrivato: piano 23»*. Va in fondo e non in cima perché in cima ci sta
  già la ripresa, che è la cosa più urgente.
- **`viste/Fine.vue`.** Un terzo caso: si risale dall'abisso. Non
  «vinta» e non «tornato su a mani vuote» — *«Sei risalito dal piano 23»*,
  coi fatti di sempre.
- **Le sessioni.** Niente. `store/sessioni.js` conta il tempo per gioco e
  lo apre e chiude `App.vue`, che sa solo quale schermata è aperta. Un
  gioco non se ne occupa, ed è la ragione per cui questa riga è vuota.
- **Le guide.** `src/guide/contenuti.js`, registro `AIUTI`, la voce del
  sotterraneo: una riga sull'abisso quando esiste. Non prima.

## Cosa si rompe, e quanto costa

### Cosa diventa rosso

**Niente, se la campagna resta byte-identica** — ed è il motivo per cui
il `#0` non si scrive. In dettaglio, i punti dove ho guardato:

- `unita/sotterraneo` — `costoDi` e `quanteVolteSiVince` girano sulle sei
  tappe, che non cambiano. Le asserzioni sulle chiavi (`c.mano ===
  'spada'`) restano vere perché nella campagna nessun grado viene
  generato. ✔
- `unita/sotterraneo` — «due leggere valgono una pesante»: resta verde
  con la correzione di `attaccoMancino`, e diventa **la guardia** di
  quella correzione. ✔
- `unita/sotterraneo-sosta` — chiavi nude, `VERSIONE` ferma a 3, `robe`
  con lo stesso significato di prima. Il campo `dietro` è aggiunto e i
  salvataggi che non ce l'hanno si leggono come «nessun piano alle
  spalle». ✔
- `integrazione/sotterraneo` — cerca `.sot-tappa[data-tappa="0"]`. La
  carta dell'abisso porterà un attributo suo (`data-abisso`) e non
  interferisce. ✔
- `guastiDelleCose` — il controllo nuovo sul `genere` **parte rosso**, e
  resta rosso finché tutte le voci non lo dichiarano. È voluto: è il
  controllo che fa il lavoro.
- `npm run tara` — non c'entra, riguarda il castello.

### Quello che va misurato di nuovo

Serve un banco per l'abisso, che oggi non esiste: `costoDi` e
`quanteVolteSiVince` prendono una tappa con `piani` finiti. Servono due
funzioni sorelle in `motore/banco.js`:

- `costoDeiPiani(da, a)` — quante domande costa ogni piano fra due
  profondità, nei due modi;
- `finoADove(bravura)` — a quale piano si ferma un giocatore finto che
  risponde bene otto volte su dieci.

E un file di prova nuovo (`unita/sotterraneo-abisso`, dichiarato pesante
con `tempo: 300`) con sei soglie:

1. il costo di un piano resta fra **10 e 25 domande** dal piano 1 al 30;
2. la forbice fra «minimo» e «tutto» resta **oltre 2×**;
3. il guardiano non costa mai più di **8 risposte di fila** a chi ha
   l'arma del suo piano (è il tetto già scritto in `guastiDeiMostri`);
4. `dif` arriva a 1 al **quinto piano** e non lo supera mai;
5. **una discesa da quaranta piani sta sotto i 10 KB** di salvataggio —
   è la soglia che protegge dal difetto delle sessioni, e senza un
   numero scritto in un test torna da sola la prima volta che qualcuno
   aggiunge un campo alle `robe`;
6. **si risale e si ridiscende senza perdere niente**: la stessa prova
   che `unita/sotterraneo-sosta` fa già per la discesa ripresa a metà
   (`gioca(…, { da })`), applicata a un piano condensato nella sua
   differenza e poi rigenerato. È l'unica prova seria che un forziere
   aperto resti aperto e che un mostro battuto sia tornato — cioè che le
   due metà della regola del farming valgano davvero.

### Quanto lavoro, grossolanamente

Cinque pezzi, e sono in ordine apposta: ognuno si può consegnare e
guardare col telefono prima di cominciare il successivo.

| | cosa | giornate |
|---|---|---|
| 1 | `cosa(k)`: la lettura unica, il parser `base#N`, il controllo che fuori da `cose.js` non resti nessun `COSE[`. **Niente cambia a schermo.** | ½ |
| 2 | L'abisso: la discesa senza fondo, `dif` che si appiccica a 1, la crescita dei mostri ritarata, la carta in `Campagna.vue`, il record, `Fine.vue`. **Bottino ancora senza gradi.** | 1 |
| 3 | Il bottino graduato: tabelle per profondità, il guardiano che lascia sempre, il mercante, i nomi col genere, la correzione della mano debole. | 1 |
| 4 | La scala che risale, la memoria dei piani lasciati alle spalle: la differenza, gli indici, il tetto ai venti, la riscrittura di `scrivi`/`leggi`. | 1 |
| 5 | Il banco dell'abisso, il file di prova, il conto delle risposte giuste e le monete. | ½ |

**Circa quattro giornate.** Il punto 4 è raddoppiato rispetto alla prima
stesura, ed è il costo diretto del risalire di quanti piani si vuole: con
un piano solo era una coppia di campi, con quaranta è una seconda forma
di salvataggio (la differenza), il conto degli indici da tenere allineato
al generatore e un tetto da far rispettare. È lavoro fatto bene una volta
o un guasto che si presenta la settimana dopo su un telefono che non è il
proprio.

La solita avvertenza vale per il punto 5, che è quello che ne scopre
un'altra: è il punto in cui si misura, e misurare è il momento in cui i
numeri scelti si rivelano sbagliati. I numeri di questo documento vengono
da un banco vero, quindi il rischio è più basso del solito — ma **il
diradarsi delle scorte e la scorta del guardiano non le ho misurate**, e
quelle costeranno un giro.

### Cosa si consegna per primo

**Il punto 2, da solo, vale già.** Un abisso in cui i mostri crescono e
il bottino è quello di oggi è già una discesa che non finisce e
un'arma che non si butta più: è la richiesta di partenza, presa alla
lettera. Si gioca male dopo il decimo piano — il bottino di grado 3 non
regge mostri di piano 12 — ma **dieci piani sono due sere**, cioè
abbastanza per capire dal telefono se la cosa funziona prima di
scrivere il resto.

Il punto 1 va prima solo perché è il fondamento del 3, non perché serva
a vedere qualcosa: è mezza giornata invisibile, e conviene farla
mentre si ha in testa dove stanno le cinquantasei letture.

**Il punto 4 può aspettare, ed è quello che rende l'ordine sensato.**
Senza la risalita l'abisso è già l'abisso: si scende, si tiene l'arma, e
l'unica cosa che manca è la rete di sicurezza per quando il piano dopo è
troppo forte — che serve davvero solo quando qualcuno ci sarà arrivato.
Ed è la giornata più rischiosa delle quattro, perché è l'unica che tocca
il salvataggio: farla per ultima vuol dire farla sapendo già com'è
andata la discesa, invece di indovinare quanti piani un bambino
risalirà davvero.

## Quello che è stato deciso

Le sei domande aperte della prima stesura hanno una risposta, e stanno
qui in fila perché un progetto senza il verbale delle decisioni, fra sei
mesi, non si distingue da una bozza.

1. **Svenendo si perde lo zaino, mai il corredo.** Non era nessuna delle
   due opzioni proposte, ed è meglio di tutte e due: punisce senza
   umiliare — si perde il margine accumulato, non il lavoro di dieci
   piani. Vedi «svenire», sopra, e la verifica sulle pozioni, che regge e
   in più sistema un difetto che il gioco ha già.
2. **L'abisso si apre finendo tutte e sei le discese**, cioè su
   `libera`, che è un campo che esiste già e non un cancello nuovo.
3. **La luce resta com'è**, e con lei l'ampiezza del piano: si toglie
   dalle leve tutto quello che allunga un piano invece di indurirlo. La
   noia non è difficoltà, e quella proposta non era misurata.
4. **Si risale di quanti piani si vuole**, camminando, senza nessun
   menù. Costa una giornata in più di salvataggio ed è la parte del
   progetto che è stata rifatta: vedi «il salvataggio».
5. **🪙1 per risposta giusta**, che è il tasso di oggi per chi esplora.
   🪙3 il giorno in cui si rifanno i premi di tutti i giochi.
6. **Il nome si accorda**: serve il campo `genere`, e il controllo in
   `guastiDelleCose` parte rosso apposta.

## Quello che resta da guardare, ma non blocca niente

Non sono decisioni da prendere adesso: sono le tre cose che si
scopriranno giocando, e che è meglio aver scritto prima.

- **Il quinto mostro.** L'abisso ha varietà per una ventina di piani
  perché 0x72 disegna quattro mostri, e da lì in giù cambiano solo le
  cifre. Non è una leva che manca, è un bestiario: la strada battuta è
  quella del Dungeon (`grafica/bestiario/`). È il lavoro che si fa quando
  qualcuno arriva al piano 25 e dice che è sempre uguale — non prima.
- **Le scorte che si diradano e la scorta del guardiano** sono le due
  tirate proposte dentro le leve rimaste, e sono le uniche due cose di
  questo documento che **non ho misurato col banco**. Vanno provate lì
  prima di essere messe.
- **Il tetto ai venti piani ricordati** è scelto perché tiene il
  salvataggio sotto i 10 KB. Se giocando risultasse che i bambini
  risalgono davvero di venti piani, il numero si alza: costa 340 byte a
  piano, e la riga da guardare è quella di `store/storage.js`, non
  questa.
