# Quanto rende ogni torre, misurato

La regola del listino ([torri.md](torri.md)) detta col motore vero: per
ogni torre, ogni ramo e ogni livello, la vita che ferma contro quella che
il suo prezzo le chiede. La misura è `npm run dps`
(`strumenti/dps-castello.mjs`); i numeri che si toccano sono `CRESCITA`,
`RAMI`, `GELO` e `BERSAGLI` in `src/data/castello.js`, e il raggio del
ghiaccio in `src/data/ops.js`.

## Come si misura

- **Il valore** è la vita più alta con cui un'ondata passa davanti alla
  torre e al più un nemico su dieci arriva in fondo (per bisezione), su tre
  tappe a una strada e tre piazzole ciascuna, **in media geometrica su sette
  ondate** (dalla 5 alla 11). Il ghiaccio, che non fa danno, vale la vita
  in più che fermano due arcieri del suo livello con lui in mezzo.
- **Il metro** è l'arciere dello stesso livello: una torre deve fermare
  quanto un arciere che costa come lei, per la sua `resa` (1,1 la magica,
  1,2 le bombe). Nella colonna «val/att» di `npm run dps`, 1 vuol dire
  esattamente il listino.
- **Provato con un'ondata sola**: la misura andava a scalini, perché la vita
  trovata cade sui multipli del colpo (quanti colpi per abbatterne uno), e
  il ghiaccio — una differenza fra due torri e tre — usciva 0,13 al livello
  2 e 0,53 al 4 senza che niente fosse cambiato in mezzo.
- **Le piazzole si prendono lungo la strada**, una accanto all'altra (la
  carta le dà nell'ordine a salti del modello, vedi
  [piazzole.md](piazzole.md)): è così che il ghiaccio sta in mezzo ai suoi
  due arcieri.

## La tabella (30 settembre 2026)

Vita fermata contro il listino, 1 = giusto:

| torre | ramo | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 🏹 arciere | — | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 |
| | cecchino | | | | 0,96 | 0,98 | 0,95 | 1,02 | 0,98 | 1,07 | 1,07 |
| | raffica | | | | 1,08 | 1,09 | 1,10 | 1,08 | 0,97 | 1,07 | 1,06 |
| 🔮 magica | — | 1,07 | 0,90 | 1,11 | 1,10 | 1,05 | 0,98 | 0,93 | 0,87 | 0,92 | 0,96 |
| | veleno | | | | 1,10 | 1,04 | 0,97 | 0,92 | 0,85 | 0,90 | 0,92 |
| | catena | | | | 1,08 | 1,01 | 0,94 | 0,88 | 0,83 | 0,88 | 0,91 |
| ❄️ ghiaccio | — | 1,03 | 0,94 | 0,92 | 0,92 | 0,96 | 0,99 | 0,98 | 1,00 | 1,05 | 1,01 |
| | bufera | | | | 0,95 | 0,96 | 1,02 | 0,98 | 1,01 | 1,04 | 1,03 |
| | brina | | | | 1,02 | 1,04 | 1,10 | 1,06 | 1,06 | 1,06 | 1,02 |
| 💣 bombe | — | 0,97 | 0,96 | 0,96 | 0,94 | 0,92 | 0,88 | 1,09 | 1,00 | 1,01 | 0,92 |
| | mortaio | | | | 0,99 | 0,96 | 0,92 | 1,15 | 1,05 | 1,06 | 0,97 |
| | napalm | | | | 1,13 | 1,10 | 1,05 | 1,06 | 0,96 | 0,98 | 0,89 |

Tutto fra 0,83 e 1,15. Quello che resta è il passo del metro stesso:
l'arciere misurato non cresce dritto (salta fra il 6 e il 7), e le torri
che crescono dritte gli stanno sopra prima del salto e sotto dopo.

**Prima**, con la stessa misura: il ghiaccio fra 0,42 e 0,89 (rendeva metà
di quello che costava fino al settimo livello), la magica 1,21–1,23 dal 3
al 5 e il veleno 1,30 al 4, il mortaio 0,29–0,34 dal 4 al 6 (da solo non
fermava un'ondata a nessuna vita: i colpi non bastavano per tutti).

## Cosa è cambiato, e perché

- **Il ghiaccio gela subito quasi quanto al decimo livello** (`GELO`:
  freno 0,71 + 0,004 a gradino, durata 3,2 s + 0,04, raggio 92): il suo
  valore è un moltiplicatore sulle torri che ha accanto, che salgono come
  lui, quindi al ghiaccio basta un gelo quasi fermo. Frenava 0,56 per
  1,6 s al primo livello e cresceva di più: in basso non valeva il prezzo,
  e al decimo sì.
- **La magica cresce di più in danno e uguale in area** (danno +37% a
  gradino, era +45%; l'area +8% resta, e la tiene `unita/castello`): l'area
  che si allarga passa da un nemico a due o tre in fila fra il secondo e il
  terzo livello, e lì la magica faceva un balzo.
- **La stima del modello conta quel balzo** (`BERSAGLI.largo` 42 e
  `BERSAGLI.oltre` 16): oltre una cella e un quarto di raggio lo scoppio
  prende uno in più ogni 16 unità, non ogni 45. Senza, il modello credeva
  la magica alta più debole di quanto è e il piano non la saliva mai.
- **Le bombe salgono un po' di più e sparano due salve più piccole** (danno
  +66% a gradino, era +62%; `perSalva` 0,61, era 0,65).
- **Il mortaio è meno lento e meno forte** (ricarica ×1,12 e danno ×1,16,
  erano ×1,35 e ×1,6): resta la gittata più lunga, ma da solo regge
  un'ondata.
- **I rami**: veleno 0,66 in tutto (era 0,75), napalm 0,64 (era 0,55),
  bufera che frena poco meno e gela più stretta (freno ×0,95, raggio ×1,3,
  durata ×1,2; era ×1, ×1,5 e ×1,4), brina con `fragile` 1,03 (era 1,08).
- **Salire rende sempre un po' meno per ⚡ che costruire**, misurato: la
  torre al livello 4 · 7 · 10 contro la stessa appena costruita, per ⚡
  cumulato, fa 0,86 · 0,84 · 0,86 l'arciere, 0,88 · 0,72 · 0,76 la magica,
  0,77 · 0,80 · 0,84 il ghiaccio, 0,84 · 0,94 · 0,81 le bombe.

Nei test: `unita/castello` (la stima del modello dentro la regola, la
magica che si allarga, il gelo che cresce), `unita/rami-castello` (i rami
contro il tronco, con la stessa stima).
