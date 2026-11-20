# Le lezioni pronte

Lezioni già preparate per ogni anno della primaria e per materia, col programma di quell'anno: la maestra
sceglie classe e gioco, tocca una lezione e la ritrova nell'editor già compilata, da cambiare come
vuole prima di salvarla. Servono a toglierle fatica, non a decidere per lei. Il codice è
`src/scuola/comune/lezioni-pronte.js` (gira in Node); il percorso nella pagina è in [quaderno.md](quaderno.md).

## La forma

Una lezione pronta è la lezione a blocchi di [lezione.md](lezione.md) senza `id`, più tre campi:

```js
{ id: '3-matematica-le-prime-divisioni',      // per la pagina e i test, non per il quaderno
  anno: 3, materia: 'matematica',             // 1..5 e una materia del CATALOGO
  nome, allena,                               // allena: una riga per la maestra, «cosa allena»
  blocchi: [{ esercizio, passa: { domande: n } | { minuti: n } },   // l'obiettivo: passa da solo
            { esercizio, passa: null }],                           // il «se hai finito», se c'è: quando lo dice la maestra
  inTondo: false }
```

Sono scritte come obiettivo e «se hai finito» (sotto), e diventano i due blocchi: la forma che darebbe
`convertiLezione` a una lezione di prima. `lezioneDa(pronta, id)` ne fa la lezione del quaderno (copia, con l'id
nuovo, già a blocchi): l'editor parte da quella.

## Il criterio

- **L'anno di un esercizio è quello del suo gradino più alto** (`annoDi`): il `classe` dei gradini del
  catalogo ([esercizi.md](esercizi.md)), contando solo i gradini che le tipologie scelte aprono davvero. Una
  lezione non chiede niente di un anno dopo il suo, in nessun blocco.
- **Le tabelline sono di seconda** (`ANNO_TABELLINE`): la voce non ha gradini, e in `conti.js` «fino al 9»
  è un gradino di seconda. In terza si consolidano (IN 2012, fine terza: «conoscere con sicurezza le tabelline»).
- **Ogni voce con un gradino di quell'anno ha almeno una lezione** in quell'anno; la prima prende anche i
  gradini della scuola dell'infanzia (`classe` 0), che sono le prime settimane. Un anno senza gradini di una
  materia non ha lezioni di quella materia (Scienze in quinta), salvo la riga sotto.
- **Prima di un gradino si guarda la ricerca per fascia**, che è più fine del catalogo
  ([../apprendimento/saperi-per-fascia.md](../apprendimento/saperi-per-fascia.md)). Così: gli angoli per nome
  (`geo:angoli`, gradino di prima) e le rotazioni (`geo:rotazione`, di seconda) stanno in quarta; in seconda
  dello stesso gradino solo lo specchio; le viste dall'alto (`geo:viste`) in quinta, in terza solo nomi e
  facce dei solidi; i numeri con la virgola (`soldi` 4, gradino di terza) in quarta, perché la virgola si fa a
  metà quarta; gli ambienti del mondo (`animali` 2-4) anche in quarta, dove sono geografia.
- **Il «se hai finito»** (il secondo blocco) è il passo prima (ripasso) o quello accanto dello stesso anno; mai un anno dopo.
- **Quante**: 15 domande in prima, 20 dopo, 10 per i testi lunghi (capire, indizi), 30 per un gruppo di
  tabelline; i minuti per «tutte le tabelline» (10, o 5 per il riscaldamento di quarta e quinta).
- **Niente riempitivi**: un ripasso c'è solo dove il programma lo chiede (le tabelline prima delle operazioni
  in colonna, genere e articolo in seconda).

## Nei giochi

Dove un gioco vero accetta il primo blocco (`giochiPer`, [esercizi.md](esercizi.md) «Il gioco in cui si fa»), la
stessa lezione c'è anche lì, fatta da sola: stessi esercizi con `gioco`, nome con «negli Asteroidi» in coda,
id con `-asteroidi` in coda. Il secondo blocco va nel gioco se il gioco lo accetta, se no resta alle domande.
Il gioco della lezione (`giocoDellaPronta`, il filtro del percorso) è quello del primo blocco.
Oggi sono le tabelline, col risultato e col numero nascosto, dalla seconda alla quinta.

## Cosa c'è

| Anno | Italiano | Matematica | Spazio | Tempo | Logica | Scienze |
|---|---|---|---|---|---|---|
| 1ª | lettere, sillabe, due frasi, perché, genere e numero, articolo, contrari, intruso (10) | colpo d'occhio, linea fino a 20, prima e dopo, conti in fila, più e meno fino al 10 e al 20, oltre la decina, doppio e metà, pittogramma (9) | figure, lati, simmetria, caselle, direzioni, percorsi (6) | giorni, mesi, stagioni, ore intere (4) | ritmi, intruso, indizi, tutti e nessuno, chi è più alto, analogie (7) | dove vive, gli animali del mondo (2) |
| 2ª | testo più lungo, presente regolare e irregolare, ma/però, gn e gl, sc, sillabe, rime, ripasso di grammatica e lessico (10) | tabelline a gruppi e tutte, più e meno con le decine, la decina, numero nascosto, linea fino a 100, grafici, misurare, problemi, monete, resto (15 + 5 negli Asteroidi) | specchio, figure, percorsi (3) | mezze ore, quarti, l'anno (3) | analogie, indizi coi no, intruso (4) | chi ci vive (1) |
| 3ª | ordine e perché, pronomi, passato prossimo, quindi/quando, parti del discorso, sinonimi, doppie, cqu, sillaba che manca (9) | tabelline difficili, tutte, numero nascosto, riporto e prestito, prime divisioni, bilance, cifre, frazioni, tabella, stima, problemi coi gruppi, prezzi (14 + 2) | solidi e facce, area (2) | cinque minuti, contare i giorni (2) | analogie, tabelle, non si può sapere, serie (4) | il corpo dice il posto (1) |
| 4ª | inferenze e titolo, imperfetto e futuro, se, concordanza, soggetto e predicato, parola giusta, accenti e h (7) | riscaldamento, oltre il cento, tre cifre, per una cifra, divisioni, bilance, frazioni, moda e media, equivalenze, due conti, decimali (14 + 1) | angoli, rotazioni, perimetro, area dei rettangoli (4) | date e durate (1) | se… allora (1) | gli ambienti del mondo (1) |
| 5ª | il tempo giusto, modi e tempi difficili, anche se, modi di dire, leggere fra le righe (5) | riscaldamento, numeri grandi, bilance, misure, stima, tre conti, dati inutili, prezzo unitario, convenienza (12 + 1) | viste dall'alto, cubetti e sviluppi (2) | minuti e durate (1) | fila e tabelle, catene di regole (2) | — |

In tutto 165, contate le 9 negli Asteroidi. Il numero esatto lo dice `node test/esegui.mjs scuola-lezioni-pronte`.

## Le funzioni

- `pronte({ anno, materia, gioco })`: quelle che rispondono ai filtri dati (un filtro assente vale tutto).
- `materiePer(anno)`: le materie del catalogo, nel suo ordine, con lezioni per quell'anno.
- `giochiDi(anno, materia)`: i `GIOCHI` in cui c'è almeno una lezione di quell'anno e materia.
- `annoDi(esercizio)`, `materiaDi(esercizio)`, `lezioneDa(pronta, id)`, `giocoDellaPronta(pronta)`.

## Come se ne aggiunge una

Una riga in `SCRITTE[anno][materia]`: `[nome, allena, obiettivo, quante o '<n> min', dopo]` (i due blocchi), con `m(modulo,
da, a, tipologie)` e `t(tabelline, modo)`. Il nome è unico nel suo anno e nella sua materia e sta nei 60
caratteri anche con «negli Asteroidi» in coda; l'id viene dal nome. La versione nei giochi nasce da sé. Una
voce nuova del catalogo con un gradino di un anno vuole una lezione in quell'anno: il test lo dice.

Nei test: `unita/scuola-lezioni-pronte` (ogni pronta ha blocchi con esercizi validi, il primo che passa a domande o
a minuti dentro i tetti, il secondo, se c'è, quando lo dice la maestra, ed è `lezioneValida` data all'editor; il
primo blocco della sua materia, nessun gradino di un anno dopo in nessun blocco; nomi unici per anno e materia e id
unici; ogni voce con un gradino di quell'anno ha una lezione; la gemella nelle domande di ogni lezione nei giochi e
viceversa; i filtri).
