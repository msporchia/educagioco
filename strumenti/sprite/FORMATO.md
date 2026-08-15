# Un file di immagine, il suo foglietto, N sprite

**Ogni sorgente porta con sé la propria geometria.** Accanto a
`pappagallo.png` sta `pappagallo.json`, che dice com'è fatto quel foglio:
quanto è ingrandito, dove cadono i fotogrammi, com'è il fondo, e quali
sprite ne devono uscire.

Non è pignoleria: è l'unico modo perché **un formato nuovo non rompa
niente**. Finora la geometria la indovinava l'attrezzo, e ogni foglio
generato da un modello diverso arrivava fatto a modo suo — 272×256 con
quattro fotogrammi per riga, poi 1071×1008 col fondo a scacchiera dipinta,
poi 1536×1024 PNG con sei fotogrammi per riga e otto righe. Ogni volta
l'euristica si rompeva, e si rompeva **in silenzio**: cani tagliati a metà,
scacchiera addosso, versi invertiti. Roba che si scopre a schermo, cioè
tardi.

Con un foglietto per sorgente non c'è niente da indovinare. Se un foglio è
fatto in un modo che non abbiamo mai visto, si scrive nel suo `.json` e
basta: l'attrezzo non cambia.

## Il foglietto

```json
{
  "scala": 4,
  "fondo": "trasparente",
  "cella": [16, 32],
  "sprite": {
    "pappagallo_giu":  { "da": [0, 0], "quanti": 4 },
    "pappagallo_lato": { "da": [0, 4], "quanti": 4, "cella": [32, 32] },
    "pappagallo_su":   { "da": [0, 2], "quanti": 4 }
  }
}
```

- **`scala`** — quanto il foglio è ingrandito rispetto alla misura vera.
  `4` vuol dire che una tessera da 16 px lì dentro ne occupa 64. `"auto"`
  la fa misurare dalla forma del foglio, che è la strada di prima e resta
  come ripiego.
- **`fondo`** — `"trasparente"` se il PNG ce l'ha già (e allora non si
  tocca niente), `"auto"` per toglierlo allagando dai bordi, oppure un
  colore esplicito `[255, 255, 255]`. Dichiararlo evita il caso peggiore:
  un cane bianco a cui si aprono buchi nella schiena perché il bianco della
  carta e il bianco del cane sono lo stesso colore.
- **`cella`** — la misura di un fotogramma, in pixel **veri** (dopo aver
  diviso per la scala). Si può ridichiarare per singolo sprite: di lato un
  quadrupede è lungo il doppio, e questa è la riga che lo dice invece di
  farlo scoprire dallo sprite spezzato in due.
- **`sprite`** — nome → dove prenderlo. `da` è in **celle**, non in pixel:
  così cambiare `scala` non obbliga a riscrivere tutte le coordinate.
  `quanti` è il numero di fotogrammi in fila; se manca è 1.
  `passo` (facoltativo, in celle) serve quando i fotogrammi non sono
  attaccati: `"passo": [3, 0]` li prende ogni tre celle.

## Un file, N sprite — e le animazioni

Il nome fa tutto. `quanti: 3` genera `nome0`, `nome1`, `nome2`, e chi
disegna li mette in giro: **è così che si dichiara un'animazione**, non
scrivendo tre righe gemelle. La fontana oggi sta in `tessere.js` come

```js
fontana0: [22, 9, 3, 3],
fontana1: [25, 9, 3, 3],
fontana2: [28, 9, 3, 3],
```

e col foglietto diventa una riga sola:

```json
"fontana": { "da": [22, 9], "cella": [48, 48], "quanti": 3, "passo": [3, 0] }
```

Stessa cosa per gli attori: un nome che finisce in `_giu`, `_lato` o `_su`
è un verso, e tre versi fanno un attore. Non serve più il `--zampe`: la
differenza fra un umano e un cane è **dove cade la banda di lato**, e
quella sta scritta nel `da`.

## Perché non basta un formato solo

Perché non lo decidiamo noi. I fogli arrivano da generatori diversi, e ogni
generatore ha le sue abitudini; chiedergli di rispettare una griglia esatta
è una battaglia che si perde. Molto meglio prendere quello che dà e
descriverlo in dieci righe.

Il foglietto si scrive **una volta per sorgente**, guardando il foglio con
`--provini`. Poi quella sorgente è a posto per sempre.

---

# Come si disegna uno stagno grande

Le nove fette ci sono già in `tessere.js` — `stagno_angolo_no`,
`stagno_bordo_n`, `stagno_centro` e le altre — ritagliate dallo stagno di
esempio. Quello che manca è chi le sceglie, e sta nel livello che disegna,
non nel dato.

**Tu segni le celle d'acqua. Il disegno guarda i vicini.** Per ogni cella
d'acqua si controllano le quattro celle attorno: quelle che *non* sono
acqua dicono da che parte c'è la riva.

```
niente acqua sopra e a sinistra   → stagno_angolo_no
niente acqua sopra                → stagno_bordo_n
acqua tutto intorno               → stagno_centro
```

Sono sedici combinazioni possibili e nove tessere: le nove bastano perché
gli angoli interni (una rientranza dello stagno) si possono disegnare col
bordo, e a questa dimensione non si nota.

Questo vale **identico per la staccionata**, che ha lo stesso problema
girato: un recinto lungo vuole i pali agli estremi, la traversa in mezzo e
il giunto agli angoli. È la stessa funzione con un'altra tabella, e per
questo va scritta una volta sola in `scena/`.

Il vantaggio vero non è grafico: è che **si smette di piazzare oggetti e si
comincia a dipingere**. Uno stagno non è più «un pezzo 3×3 che o ci sta o
non ci sta», è una pozza della forma che vuoi.
