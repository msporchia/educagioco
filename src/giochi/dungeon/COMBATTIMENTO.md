# Il combattimento del dungeon — armi, armature e mostri con la vita

Come funziona lo scontro, perché funziona così, e **perché questo documento
dice il contrario di quello che diceva prima**.

---

## Il ripensamento, detto per intero

La prima versione di questo file scartava i numeri di attacco e difesa, con
questo argomento:

> Nel dungeon la vita di un mostro è denominata in domande. Quindi ogni punto
> di attacco in più è un esercizio in meno, e un gioco in cui potenziarsi vuol
> dire rispondere di meno insegna al bambino che l'obiettivo è smettere di
> rispondere.

L'argomento è aritmeticamente giusto e **la conclusione era sbagliata**, perché
partiva da un criterio che non è quello di questo gioco. Il criterio era quello
del castello: *il numero di esercizi è l'input, e una tappa che ne chiede
troppi è un compito*. Là è giusto — il castello esiste per far fare le
operazioni in colonna. Qui no.

Il dungeon è **intrattenimento con gli esercizi dentro**. Ci si scende per
vedere l'eroe diventare forte, per trovare la spada nel forziere e poi
*giocarci*. Da cui le due decisioni che reggono tutto il resto:

1. **Le discese sono lunghe** (tre volte quelle di prima). Una spada trovata a
   due stanze dalla fine non è un premio, è una notifica: perché un bottino
   esista, ci deve essere strada davanti per usarlo.
2. **Potenziarsi fa risparmiare scambi, e va bene così.** Nel caso peggiore si
   finisce la campagna prima e si ricomincia più in difficile, che è un premio
   anche quello.

Quello che si perde a fare così va scritto, perché è reale: una discesa non è
più un compito da dieci minuti, è una partita da venti. Per quello i piani sono
tre — si può smettere in fondo a uno.

---

## Lo scontro, in due formule

Stanno in `dati/eroe.js` e sono due perché le legge un bambino di sei anni
sopra la barra della vita: sottrazioni, niente percentuali.

```
rispondi bene  → gli togli  max(1, tuo attacco − sua difesa)
                 e lui ti graffia di 1
rispondi male  → non gli togli niente
                 e lui ti picchia: max(1, suo attacco − tua difesa)
```

Ne esce una divisione dei ruoli che si spiega in una riga:

- **l'attacco è velocità** — meno scambi per abbattere un mostro;
- **la difesa è l'assicurazione sugli sbagli** — chi sa rispondere non muore
  quasi mai, chi sbaglia e non ha addosso niente muore in fretta.

Il **graffio** è 1 fisso e la difesa non lo ferma. È la sola regola che non si
può schivare, ed è quella che rende una discesa lunga una gestione di risorse
invece di una passeggiata: è il motivo per cui «curati» è una scelta vera
davanti a «prendi l'oggetto». Se la difesa lo fermasse, un'armatura alta
renderebbe i piani lunghi gratis.

Il minimo di 1 su entrambe le formule non è una gentilezza: senza, un mostro
con difesa più alta del tuo attacco sarebbe **immortale**, e un bambino
resterebbe a rispondere giusto guardando una barra che non si muove.

---

## Chi diventa più forte, e quanto

**Dentro la discesa** — l'equipaggiamento, che è del giro e a fine discesa
sparisce con le gemme. Due caselle sole, tre gradi per casella
(`dati/tesori.js`):

| | in mano | | | addosso | |
|---|---|---|---|---|---|
| 🗡️ | Spadino | +1 | 🦺 | Panciotto di cuoio | +1 |
| ⚔️ | Spada di ferro | +2 | 🛡️ | Corazza di ferro | +2 |
| 🔱 | Lama del drago | +3 | 🧥 | Manto di scaglie | +3 |

Più due cose che non occupano casella, perché non competono con niente: la
🍖 bistecca (vita massima) e la 🏮 lanterna. La lanterna non aggiunge un
numero e per un po' è sembrata inutile per questo: serve alla cosa che il
gioco è davvero — **scegliere la strada** — perché al buio si vedono due file
avanti e si decide alla cieca. Sta a grado 1 apposta, o ruberebbe il posto a
un'arma vera nei forzieri buoni.

**Fra una discesa e l'altra** — l'eroe di base, che cresce con le tappe portate
a casa (`statisticheBase`). Non è un campo nuovo nel profilo: è `campagne.dungeon.tappa`,
che c'era già, quindi nessuna migrazione e nessun salvataggio in più.

**Al fuoco da campo** — una sosta, una cosa sola: curarsi, allenare il braccio
(+1 attacco), allenare la guardia (+1 difesa), o prendere quello che offre.

---

## Il patto: i mostri duri lasciano roba migliore

È il giro di gioco per cui tutto questo esiste:

> il mostro grosso lascia l'equipaggiamento buono → con quello i mostri cadono
> in meno scambi → in fondo c'è il drago, che senza non cade affatto

Chi sceglie sempre la strada facile arriva al guardiano nudo, e **lo scopre
lì**: nessuno glielo dice, lo legge sulla barra che scende di un punto per
volta. È l'unica lezione di strategia che questo gioco dà, e la dà senza
scriverla da nessuna parte.

Il patto è fatto rispettare da due controlli, e sono i due che vanno guardati
per primi se qualcosa si scolla:

- `guastiDelleStanze()` — **nessuna stanza deve dominarne un'altra**, cioè
  costare meno e insieme rendere di più sotto ogni aspetto (gemme, grado del
  bottino, quanto spesso lo lascia, quanto è dura). Non è un ordinamento unico
  ed è giusto che non lo sia: il mostro grosso rende più gemme del capo, il
  capo lascia sempre qualcosa, lo scrigno non fa male ma può andare a vuoto. Se
  una strada fosse meglio di un'altra sotto ogni punto di vista, il bivio non
  sarebbe più una scelta.
- `guastiDeiTesori()` — dentro una casella, il grado più alto deve dare di più
  **e** costare di più: se no il grado è una decorazione e il bottino del
  mostro grosso una fregatura.

---

## I tre piani

Una discesa si divide in tre, e non è una scritta sulla mappa:

- **piano 1** — si fa la mano, si trova l'equipaggiamento di base;
- **piano 2** — è dove cade la roba migliore, perché è ancora presto per usarla
  per un piano intero;
- **piano 3** — niente armi nuove: cure, gemme e il guardiano.

In fondo a ogni piano c'è **un capo, da solo nella sua fila**: comunque tu
cammini devi passare di lì, quindi il capo non si aggira e il piano ha una fine
vera. La fila prima è sempre un fuoco, e lì la cura è piena: arrivare a un capo
senza aver potuto rifiatare non è difficile, è ingiusto.

Il terzo tetto al bottino è la campagna: `GRADO_DELLO_SCALINO` fa sì che **la
lama del drago non si trovi nella cantina di casa**. Senza, si arrivava in
fondo alla prima tappa con lo stesso equipaggiamento con cui si arriva in fondo
al covo, e le otto tappe dopo non avevano più niente di nuovo da mostrare.

---

## Cosa si vede a schermo

- **Fascia in cima** — la vita come barretta col numero dentro (dal verde al
  rosso da sé), ⚔️ attacco, 🛡️ difesa, 💎 gemme, e le emoji di quello che si
  porta addosso. I due numeri che il bottino fa crescere stanno in cima perché
  è lì che si vede di essere diventati più forti.
- **Scontro** — la faccia, i due numeri del mostro, la barra della sua vita, e
  sotto la riga che conta: «gli togli **3** a colpo — ancora **2** colpi».
  Quel numero è quello su cui si decide se insistere o scappare, ed è l'unico
  scritto grande. È anche l'unico posto in cui il bottino si *vede* lavorare.
- **Il cartello del bottino** (`viste/Bottino.vue`) — quando si prende
  qualcosa, si ferma tutto e si guarda: cos'è, cosa fa detto con le parole del
  gioco (`fa` nei dati, non `desc`), e **il numero che cambia**: ⚔️ 3 → 5.
  Scatta su *qualunque* cosa migliori — un forziere, un acquisto, un
  allenamento, una stranezza fortunata — perché è dedotto dalla differenza e
  non da un elenco di casi: la prima versione elencava i casi e se n'era
  dimenticati tre.
- **Mappa** — la discesa scorre; la tela invece è grande quanto lo schermo e
  disegna solo la fetta che si vede (`inquadratura`), perché un canvas alto
  quanto una discesa da quaranta file sfonda il lato massimo che Safari su
  iPhone accetta e là smetterebbe di disegnare del tutto.

---

## Come si tara

`node test/esegui.mjs dungeon` stampa la tabella che conta:

```
tappa                 file  dom.  att/dif  arma    sicuro bambino  a caso
1. La cantina          18    63      5/5   95%      100%     98%      0%
9. Il covo del drago   42   110     11/9   87%      100%     70%      0%
```

Le colonne da guardare, in ordine:

1. **bambino** — chi ne sbaglia una su quattro deve arrivare in fondo. Le
   soglie stanno in `ATTESE` (`dati/taratura.js`) e **non si abbassano per far
   passare il test**: chi lo fa non ha tarato niente, ha spento l'allarme.
2. **a caso** — chi tira a indovinare non deve farcela, o le domande non
   servono a niente.
3. **arma** — quanti arrivano in fondo equipaggiati. Sotto il 70% vuol dire che
   il bottino non sta arrivando, e allora le domande esplodono: si abbassa lì,
   con `lascia`, non alzando il tetto delle domande.
4. **dom.** — quante domande costa. Il tetto è alto (130) e la ragione è
   scritta in `DOMANDE`; il minimo conta più del massimo.

E la riga finale, che è la promessa del gioco messa alla prova:

```
equipaggiamento in fondo: 3.6 gradi nella cantina, 5.5 nel covo
```

Se quei due numeri diventano uguali, il bottino ha smesso di essere una
progressione ed è tornato una decorazione.
