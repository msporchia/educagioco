# Le sorgenti degli sprite — una cartella per gioco

Qui dentro stanno i fogli da cui escono gli atlanti. **Il primo livello è
il gioco**, e non è un ordinamento estetico: `atlante.py` decide di chi è
un foglio guardando la cartella in cui sta (`FORMATO.md`, «Per quale
gioco è questo foglio»), risalendo fino al primo `atlante.json`. Spostare
un foglio da una cartella all'altra è **il modo in cui lo si dà a un
altro gioco**.

```
sorgenti/
  fattoria/       atlante.json → src/giochi/fattoria/dati/atlante.js
  sotterraneo/    atlante.json → src/giochi/sotterraneo/dati/atlante.js
  castello/       atlante.json → src/giochi/castello/dati/atlante.js  (lo ritaglia terreni.py)
```

Dentro ogni gioco, il secondo livello dice **da dove viene** un foglio,
che è l'altra domanda che ci si fa sempre:

| cartella | cos'è |
|---|---|
| il nome di un autore (`0x72/`, `armm1998/`) | un set di terzi, con la sua licenza e le sue carte in `PROVENIENZA.txt`. I nomi dei file sono quelli dell'autore e **non si toccano**: è la prova che il contenuto è il suo |
| `generati/` | fogli fatti con un generatore di immagini. Nomi in italiano, che dicono cosa c'è dentro |
| `non-usati/` | quello che nessun foglietto nomina. Non entra in nessun atlante e non pesa niente: sta qui perché buttarlo vorrebbe dire non poterlo più guardare |

## Com'era, e perché è cambiato

Era piatta: i cani e i gatti in radice insieme a `tower_def.jpeg` (che è
del castello), i fogli generati della fattoria mescolati dentro `gfx/` —
cioè dentro la cartella che dichiarava di essere il set CC0 di ArMM1998 —
e i fogli del castello con addosso il nome che avevano quando sono stati
scaricati (`d8Rn3.png`, `PVX1O.png`). Due difetti veri, non solo
disordine:

1. **La cartella dice il gioco, quindi la cartella sbagliata è un
   guasto.** `tower_def.jpeg` stava in radice, dove l'`atlante.json` era
   quello della fattoria: se qualcuno gli avesse scritto un foglietto,
   quelle tessere sarebbero finite dentro la fattoria. Era inerte solo
   perché il foglietto non c'era.
2. **Mescolare generato e CC0 fa dire il falso alla provenienza.**
   `animali.png`, `campi.png` e altri due erano dentro `gfx/`, e
   `LEGGIMI.md` dichiarava quella cartella come «il set di ArMM1998, CC0,
   e per questo ci sta accanto lo zip pristino». Lo zip contiene otto
   file, e quattro di quelli lì dentro non c'erano.

## Cosa entra davvero in un atlante

Solo **le immagini che hanno il loro `.json` accanto** (`foglietti()` in
`atlante.py`). Un'immagine senza foglietto è già inerte oggi, ma non lo
si vede guardandola: `non-usati/` serve a farlo vedere.

Chi vuole guardare un foglio e i suoi ritagli col dito: `npm run mondo`,
metà «i ritagli».
