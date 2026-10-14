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
aspetta (l'energia torna combattendo, due punti ogni cinque risposte giuste date a un mostro: `Corsa.rispondi`, e camminando, lo 0,1% del globo a passo: [orologio.md](orologio.md)); mai a secondi.

`lanci` per riga (`dati/eroi.js`): **mago 6 · 6 · 6 · 4 · 1, gli altri 3 · 3 · 2,5 · 2 · 1** (il mago era 6 · 6 · 5 · 3 · 1 fino alla sera del 13 ottobre: col mana dei costi e i branchi grossi il mago a livello atteso vinceva a 6/10 il 52% contro l'86% dell'elfa, ora il 66%; la riga 2 costa 5 e non 4 e la 3 costa 9, sempre più del cavaliere). Le righe normali stanno dove l'utente le
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
| mago | 25 · 28 · 31 · 34 · 41 | 5 · 7 · 8 · 11 · 16 → **4 · 5 · 5 · 9 · 40** | 5 · 4 · 3,9 · 3,1 · 2,6 → **6,3 · 5,6 · 6,2 · 3,8 · 1** |
| nano | 10 · 10 · 10 · 10 · 10 | 5 · 7 · 8 · 11 · 16 → **3 · 3 · 4 · 5 · 10** | 2 · 1,4 · 1,3 · 0,9 · 0,6 → **3,3 · 3,3 · 2,5 · 2 · 1** |

(il globo del mago al 12 è 41 perché l'eroe atteso ha Mente lucida; il costo parte da 40). Il cavaliere e il nano non
avevano mai potuto lanciare le righe alte senza punti in intelligenza: adesso sì, e questo li rende più forti
(`abilitaDelloScontro`, la forza, conta le abilità che il due terzi del globo paga: [forza.md](forza.md)). Provato: far scegliere al
banco per resa su energia, o tenere l'ultima riga per i capi: l'abisso raddoppia i costi dei piani (l'ultima riga serve anche lì), quindi il banco
resta quello di prima, il più forte che il globo di adesso paga.

## La fila dei turni

L'eroe ha `7 + destrezza` di velocità (`VELOCITA_BASE_EROE` e `VELOCITA_PER_DESTREZZA`; la mattina del 13 ottobre era `6 + 1,5 × destrezza`,
prima ancora `10 + destrezza`). Al livello atteso di ogni discesa (`npm run sotterraneo -- --turni`, `--file` per la fila lettera per lettera,
`E` l'eroe, `m` un mostro), la mattina → la sera:

| | velocità | doppi turni nel branco della discesa | il peggiore da solo |
|---|---|---|---|
| cavaliere, nano, mago | 9 · 9 · 10,5 · 10,5 · 12 · 12 · 12 → **9 · 9 · 10 · 10 · 11 · 11 · 11** | 0–8% (la botola) | 11 · 22 · 14 · 52 · 42 · 50 · 58% → **11 · 22 · 10 · 50 · 36 · 45 · 54%** |
| elfa | 12 · 12 · 13,5 · 13,5 · 15 · 15 · 15 → **11 · 11 · 12 · 12 · 13 · 13 · 13** | 0–17% | 33 · 42 · 33 · 63 · 53 · 60 · 67% → **27 · 36 · 25 · 58 · 46 · 53 · 61%** |

Il mago con mostri da 9 in su non ha mai due turni di fila (`unita/sotterraneo-iniziativa`); l'elfa della torre (12) sì, ogni tanto, e di rado in un
branco (alla partenza, con 11, contro un mostro da 10 una volta su dodici). Il banco dà la destrezza a un quarto dei punti, uguale per cavaliere,
elfa (che parte da quattro), mago e nano.

**Perché un punto e non uno e mezzo.** Misurato con la strada `mago:bacchetta` a livello atteso e i punti tutti in una caratteristica
(`--strada mago:bacchetta --punti destrezza`, vinte a 8/10 · 6/10): destrezza 95 · 72, intelligenza 73 · 42, tempra 58 · 31, forza 46 · 25. Il mago con
tutti i punti in destrezza vinceva il 20–30% più di quello con l'intelligenza, perché la velocità è turni in più (e una schivata); la destrezza era
la scelta unica, per ogni classe. Con 7 + 1: destrezza 86 · 47, intelligenza 71 · 40, tempra 58 · 31. Ancora la migliore, ma non l'unica. A parità di
mago (a due di destrezza, 9) e con la regola del doppio turno intatta; il prezzo è che ogni classe ha un turno ogni tanto in meno, che la taratura dei
mostri ([taratura-branchi.md](taratura-branchi.md)) ha già dentro.

## Il conto dei numeri

I mostri e le vittorie di questa pagina sono ritarati nella sera del 13 ottobre ([taratura-branchi.md](taratura-branchi.md)): i branchi più che
raddoppiati, l'iniziativa e i costi di qui sopra. `COLPO_DEL_MOSTRO` non è stato toccato (decisione dell'utente in sospeso). I bersagli che la
mattina erano stati allentati di un passo per tenere `npm test` verde (il mago alla scala sommersa, 4 su 8 invece di 6; la scala sommersa bene, 6 su 8
invece di 7; con la roba attesa a 8/10, 3 su 6 invece di 5; le missioni di caccia, il 10% di vita in più) sono tornati quelli di prima.
