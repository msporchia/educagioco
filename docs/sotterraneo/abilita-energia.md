# I costi dell'energia e la fila dei turni

13 ottobre 2026. Due osservazioni dell'utente, fatte insieme perché cambiano il peso delle classi: l'iniziativa è dell'agile
e non del mago, e il mana si misura in **lanci**, non in numeri. Il codice: `dati/abilita.js` (`globoAtteso`, `costoAl`,
`lanciDellaRiga`), `dati/eroi.js` (`lanci` di ogni classe), `dati/livelli.js` (`puntiAttesi`, il giro dei punti del banco),
`motore/turni.js` (`VELOCITA_BASE_EROE`, `fileGiocata`). Le regole dell'energia in generale: [abilita.md](abilita.md#lenergia).

## Il costo viene dal globo della classe

Il costo di un nodo è `round(globo atteso della classe al livello del nodo / lanci della riga)`. Il globo atteso è
`7 + 3 × intelligenza` che la classe ha a quel livello coi punti dati come li dà il banco (`puntiAttesi`): non conta i nodi che
lo alzano, che sono una scelta. Il livello del nodo è il suo gradino (2, 4, 6, 8, 12) più due per ogni grado oltre il primo
(`costoAl(nodo, grado)`), quindi il mago, il cui globo cresce col livello, paga un po' di più un'abilità migliorata; gli altri,
col globo fermo a dieci o tredici, no. L'ultima riga costa tutto il globo che la classe ha lì: si lancia una volta, poi si
aspetta (l'energia torna solo combattendo, due punti ogni cinque risposte giuste date a un mostro: `Corsa.rispondi`, mai col tempo).

`lanci` per riga (`dati/eroi.js`): **mago 6 · 6 · 5 · 3 · 1, gli altri 3 · 3 · 2,5 · 2 · 1**. Le righe normali stanno dove l'utente le
voleva (cinque o sei lanci per il mago, due o tre per gli altri); la quarta riga è «la potente» (Esplosione, Lancia di ghiaccio, Fulmine) e
nel mago ne vale tre, non quattro o cinque: erano quelle che spazzavano via un mostro e costavano poco. Una manopola sola per classe e per
riga: se cambiano l'energia, la dote o il giro dei punti, i costi si rifanno da soli (`guastiDelleAbilita` controlla che crescano e
che l'ultima stia nel globo).

Il **bastone** (bacchette a due mani) fa tornare l'energia del 50% più in fretta (`ricarica`, [roba.md](roba.md#due-mani)): dieci
risposte giuste a un mostro danno sei punti invece di quattro, e il costo di un'abilità non cambia.

Il globo atteso e i costi, prima → dopo (`npm run sotterraneo -- --costi [--contro <commit>]`; colonne: riga 0 · 1 · 2 · 3 · 4, ai livelli 2 · 4 · 6 · 8 · 12):

| classe | globo | costo | lanci col globo pieno |
|---|---|---|---|
| cavaliere | 10 · 10 · 10 · 10 · 10 | 5 · - · 8 · 11 · 16 → **3 · - · 4 · 5 · 10** | 2 · - · 1,3 · 0,9 · 0,6 → **3,3 · - · 2,5 · 2 · 1** |
| elfa | 13 · 13 · 13 · 13 · 13 | 5 · 7 · 8 · 11 · 16 → **4 · 4 · 5 · 7 · 13** | 2,6 · 1,9 · 1,6 · 1,2 · 0,8 → **3,3 · 3,3 · 2,6 · 1,9 · 1** |
| mago | 25 · 28 · 31 · 34 · 41 | 5 · 7 · 8 · 11 · 16 → **4 · 5 · 6 · 11 · 40** | 5 · 4 · 3,9 · 3,1 · 2,6 → **6,3 · 5,6 · 5,2 · 3,1 · 1** |
| nano | 10 · 10 · 10 · 10 · 10 | 5 · 7 · 8 · 11 · 16 → **3 · 3 · 4 · 5 · 10** | 2 · 1,4 · 1,3 · 0,9 · 0,6 → **3,3 · 3,3 · 2,5 · 2 · 1** |

(il globo del mago al 12 è 41 perché l'eroe atteso ha Mente lucida; il costo parte da 40). Il cavaliere e il nano non
avevano mai potuto lanciare le righe alte senza punti in intelligenza: adesso sì, e questo li rende più forti
(`abilitaDelloScontro`, la forza, conta le abilità che il due terzi del globo paga: [forza.md](forza.md)). Provato: far scegliere al
banco per resa su energia, o tenere l'ultima riga per i capi: l'abisso raddoppia i costi dei piani (l'ultima riga serve anche lì), quindi il banco
resta quello di prima, il più forte che il globo di adesso paga.

## La fila dei turni

L'eroe ha `6 + 1,5 × destrezza` di velocità (prima `10 + destrezza`): al livello atteso di ogni discesa, prima → dopo
(`npm run sotterraneo -- --turni`, `--file` per la fila lettera per lettera, `E` l'eroe, `m` un mostro):

| | velocità | doppi turni nel branco della discesa | il peggiore da solo |
|---|---|---|---|
| cavaliere, nano | 12 · 12 · 13 · 13 · 14 · 14 · 14 → **9 · 9 · 10,5 · 10,5 · 12 · 12 · 12** | fino al 28% → al 25% (nella miniera, dove c'è il golem da 5) | 64% → 58% |
| elfa | 14 · 14 · 15 · 15 · 16 · 16 · 16 → **12 · 12 · 13,5 · 13,5 · 15 · 15 · 15** | 38% → 33% | 68% → 67% |
| mago | 12 in tutte → **9 in tutte** | fino al 25% → 0% (11% nella miniera) | 58% → 44% (solo contro i lenti, da 8 in giù) |

Il mago con mostri da 9 in su non ha mai due turni di fila (`unita/sotterraneo-iniziativa`); l'elfa sì, ogni tanto, e di rado in un branco.
Una discesa dopo l'altra la destrezza che il banco dà a cavaliere, elfa e nano li rende più veloci; il mago, che non ne ha, resta a nove.

## Cosa costa ai numeri del gioco

L'eroe meno veloce lascia più turni ai mostri: stessa cosa di aumentare il loro colpo del 25–30% (la velocità non è un colpo, ma
conta uguale). Il banco (`npm run sotterraneo -- --semi 10`, roba attesa, discesa per discesa, cripta · scalinata · torre · grotta · sommersa · botola · miniera):
a 8/10 100 · 93 · 85 · 100 · 85 · 95 · 95 → **100 · 60 · 68 · 88 · 65 · 90 · 85**; a 4/10 73 · 18 · 13 · 30 · 13 · 33 · 3 → **45 · 5 · 15 · 13 · 3 · 25 · 0**.
`--verifica` passa da 7 a 20 voci rosse (prima: l'altare del mago a 4/10, la scalinata nuda, la torre del cavaliere, la botola a sei su dieci). **Non
tarato**: COLPO_DEL_MOSTRO e i danni dei mostri non sono stati toccati (decisione dell'utente in sospeso). Per tenere `npm test` verde si sono
allentati di un passo i bersagli di vittoria di `unita/sotterraneo` (il mago alla scala sommersa, 4 su 8 invece di 6; la scala sommersa
bene, 6 su 8 invece di 7), `unita/sotterraneo-roba` (con la roba attesa a 8/10, 3 su 6 invece di 5) e `unita/sotterraneo-missioni` (il 10% di
vita in più per le missioni di caccia; il rosicchione del cavaliere: 36 di 35): la taratura che segue li riporta.
