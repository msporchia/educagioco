# Gli esercizi

Cosa può scegliere la maestra, come si pescano le domande e come si racconta una risposta. Il codice è
`src/scuola/comune/esercizi.js`: gira in Node (importa i moduli uno per uno, niente `import.meta.glob`) e
lo usano tutte e due le pagine. Le domande sono quelle di casa (`src/quiz/moduli/`), coi falsi, il perché e
il «Si fa così» dopo uno sbaglio ([../apprendimento/la-domanda.md](../apprendimento/la-domanda.md)).

## La forma di un esercizio

Un oggetto piccolo, che viaggia nel link della lezione e sul servizio (che non lo legge, vedi
[protocollo.md](protocollo.md)); `tipo` dice quale delle due forme è.

```js
// una o più tabelline (da 1 a 10), ognuna dal per 1 al per 10
{ tipo: 'tabelline', tabelline: [9], modo: 'nascosto' }
//   modo: 'prodotto' (9 × 7 = ?), 'nascosto' (9 × □ = 63), 'misti' (tutti e due)

// un modulo di quiz, per gradini e tipologie
{ tipo: 'modulo', modulo: 'orologio', da: 2, a: 4, tipologie: ['ora:quarti', 'ora:minuti'] }
//   da..a: i gradini del modulo (1 = il primo della sua scaletta), estremi compresi
//   tipologie: le chiavi dei `tipi` del modulo; [] vuol dire tutte
```

- **Niente chiavi in più**: `valido` rifiuta un oggetto con un campo che non conosce, così un link
  manomesso non porta dentro niente.
- **Un esercizio deve chiedere qualcosa**: le tipologie scelte devono esistere in almeno un gradino fra
  `da` e `a` (le ore intere vivono nei gradini 1-3: `da: 4` con solo `ora:intere` non è valido).
- Quanto dura (giuste, domande, minuti) non sta qui: è del blocco della lezione (`passa`, [lezione.md](lezione.md)).

## Il catalogo

`CATALOGO.materie` è l'elenco per l'editor delle lezioni: ogni materia (`id`, `nome`, `emoji`) ha le sue
`voci`, e ogni voce ha `nome`, `icona`, `spiega` (una frase per la maestra) e `base`, un esercizio valido
da cui partire. Poi, secondo il tipo:

- **`tipo: 'tabelline'`**: `tabelline` (`{ valore, nome }`, «Tabellina dell'8») e `modi`
  (`{ id, nome, esempio }`). Una voce sola, in testa a Matematica.
- **`tipo: 'modulo'`**: `gradini` (`{ grado, nome, classe }`: il nome è la riga della scaletta del
  modulo; `classe` è la classe a cui il livello di quel gradino è adatto, 0 la scuola dell'infanzia e
  1..5 la primaria, dalla scala di [../apprendimento/quiz-livelli.md](../apprendimento/quiz-livelli.md))
  e `tipologie` (`{ id, nome, gradini }`: in quali gradini esiste, per spegnere quelle fuori dall'intervallo).

L'editor non conosce i moduli: con queste liste costruisce qualunque esercizio valido.

### Cosa c'è

Italiano: Capire un testo, Coniugazione, Connettivi, Grammatica, Lessico, Le prime lettere, Ortografia,
Sillabe. Matematica: **Le tabelline**, Le bilance, Conti puri, Frazioni, Grafici e tabelle, Misure,
Senso del numero, Problemi, Soldi e decimali. Spazio e figure: Geometria, La griglia. Tempo e orologio:
Calendario, Orologio. Logica: Analogie, Indizi, Logica, Sequenze. Scienze: Animali e ambienti.

I **Conti puri** a casa sono `soloSuRichiesta` (li chiede solo Castle Battle): qui sono una voce come le
altre, perché la maestra li nomina sempre (le somme col riporto, le divisioni esatte).

### Cosa resta fuori, e perché

- `ing-parole`, `ing-frasi`: passano da `quiz/inglese.js`, che arriva a `store/srs.js` e ai mondi del
  gioco d'inglese; la scuola non ha archivio.
- `tabelline` come modulo a sé: non sa scegliere la tabellina, e la voce «Le tabelline» lo copre (ne usa
  il numero nascosto, `tabelline.nascosto`).

## Le tabelline

I fatti sono tabellina × 1 … × 10. La domanda la fa `conti.conto('conti:prodotto', 7, n, f, sorte)`, il
pezzo di `moduli/conti.js` che dati due numeri fa il conto: il grado 7 è l'ultimo coi falsi della tabellina
(«63 è 9 × 7: un gruppo di troppo») e il metodo che la ricava dalle vicine. Il numero nascosto è
`tabelline.nascosto` di casa. Le chiavi sono quelle di casa: `tab:prodotto`, `tab:nascosto`.

- **Toccato a casa, senza cambiare niente**: `conti.js` ha il metodo `conto` (prima stava dentro
  `genera`, che ora lo chiama con la stessa sorte: le domande di casa sono identiche) e il metodo del
  per 1, che a casa non esce mai («9 × 1 = 9: un gruppo solo di 9»).
- Filtrare da fuori le domande di `tabelline.js` finché non esce il 9 non basta: a casa il per 1 non
  c'è, e il fattore è scambiato a caso (7 × 9 e 9 × 7).

## Più cose insieme, con l'intensità

Un blocco della lezione può mescolare più esercizi: `{ tipo: 'insieme', parti: [{ esercizio, peso }] }`, da due a
`MAX_PARTI` (6) parti, ognuna un esercizio semplice (né un altro insieme né un `gioco` dentro). `peso` è `'poco'`, `'normale'`
o `'tanto'` (`PESI`): una parte «tanto» esce quattro volte una «un po'», e le parti si alternano a turno pesato e liscio,
sparse e non a blocchi (con 4 e 1, mai cinque della prima di fila). È la risposta a «tanta tabellina dell'8 e un ripasso
blando del 3, 4, 5 e 6»: due parti di tabelline; ma si mescolano anche voci diverse (tabelline e orologio). Un insieme va in un
gioco solo se il gioco accetta ogni parte; agli Asteroidi arriva come gruppi con le loro volte (`limiteAsteroidi`). Nell'editor
della maestra una parte sola è un esercizio semplice, come prima: accendere una seconda voce nell'elenco la fa diventare un insieme. Lì il peso
non si scrive: ogni parte ha un colore e tre tasti a pallini (uno, due, quattro), e sopra una barra divisa nei colori dice
«8 su 10», «2 su 10» (`suDieci` in `SceltaEsercizio.vue`). Provato «Un po'/Normale/Tanto» a parole: per l'utente era
testo e basta.

## Il gioco in cui si fa

Un esercizio può portare `gioco` (`GIOCHI` in `esercizi.js`): senza, o con `'schede'`, sono le domande una per
scheda; con `'asteroidi'` il bambino gioca agli Asteroidi veri, limitati a quell'esercizio. **Un gioco vero
accetta solo quello che sa fare già**: gli Asteroidi le tabelline, col risultato e col numero nascosto («9 × ? = 63»,
la forma della domanda girata che il gioco aveva già). `giochiPer(esercizio)` dice in quali giochi si può fare, `giocoDi`
legge il campo; `valido` rifiuta un gioco sconosciuto o che non accetta l'esercizio, e `descrivi` aggiunge
«negli Asteroidi». Come il gioco si limita: [../asteroidi/scuola.md](../asteroidi/scuola.md).

**Nei giochi che prendono le domande del catalogo** (le schede, Survivors, il sotterraneo, gli Asteroidi) cosa si chiede è
**un elenco solo** (`maestra/ElencoDomande.vue`, scelta dell'utente: una scelta sola e in fila, non «una cosa e poi
mescolane un'altra»): le materie si aprono toccandole, ogni tipo di domanda si accende con la spunta e, se ce n'è più d'uno,
prende la sua intensità a pallini («quanto spesso»); sotto si aprono le sue scelte (gradini, tabelline) e il suo esempio.
«＋ Ancora le tabelline, con altre scelte» fa una seconda parte della stessa voce (tanta tabellina dell'8, un po' di
ripasso del 3-6). Le parti sono quelle di `insieme`, fino a `MAX_PARTI`; l'ultima accesa non si spegne.

**Il contenuto di un gioco che si mescola** (`siMescola` nel `tipo` della scheda: il calcolo a mente degli Asteroidi) può
stare in un insieme con le voci del catalogo, ma solo se l'esercizio ha il suo gioco scritto (`valido(e, nelGioco)`): a
schede non si farebbe. `perLeSchede(e)` dice cosa resta a schede di un esercizio (le parti del catalogo), o null.

**Nell'editor si sceglie prima il gioco**, poi quello che sa fare (scelta dell'utente, 20 novembre 2026: al contrario la
pagina era un elenco di testo). `materieDelGioco(id)` dà le voci del catalogo che il gioco accetta, per materia;
`mescolaPiuCose(id)` dice se mescola più parti (non i giochi col contenuto loro). Cambiando gioco l'esercizio resta se il
gioco nuovo lo accetta, se no riparte dalla prima cosa che quel gioco sa fare.

## Le funzioni

- **`valido(esercizio)`** → `true`/`false`; non lancia mai, anche su `null`, liste, stringhe.
- **`descrivi(esercizio)`** → una frase per la maestra: «Tabellina del 9 · il numero nascosto»,
  «Tabelline dall'1 al 5 · risultato e numero nascosto», «Orologio · da «le mezze ore» a «i cinque minuti»
  · solo i minuti». Su uno storto: «Esercizio non valido».
- **`pescatore(esercizio, sorte?)`** → `{ prossima() }`, che dà `{ domanda, pittori, titolo }` pronti per
  `Domanda.vue`. `sorte` è una `Sorte` o un numero (il seme); senza, una a caso. Lancia su un esercizio
  non valido: chi lo riceve da fuori chiama prima `valido`.
  - **Il giro**: i fatti (per le tabelline) o le classi (gradino, tipologia) si mescolano e si danno tutti
    prima di ripeterne uno; il primo del giro nuovo non è l'ultimo del vecchio. Nei misti ogni fatto
    alterna le due forme da un giro all'altro.
  - **Mai la stessa due volte di fila**: in un modulo una domanda uguale a una delle ultime cinque si
    rifà (fino a dodici volte), e comunque non torna quella appena data.
- **`racconta(domanda, indice)`** → `{ fatto, data, attesa }`, testi di al più `LUNGO` (40) caratteri
  per il resoconto, tagliati a una parola intera coi puntini. `fatto`: un conto senza «= ?» («9 × 7»);
  altrimenti la riga che chiede (l'ultima che finisce con «?», o la prima) con il soggetto scritto o
  l'emoji e il nome del soggetto. `data` e `attesa`: il testo della risposta, l'emoji col nome, o
  «la figura 2» per un disegno (il posto in cui il bambino l'ha visto).
- **`raccontaAsteroide({ testo, data, attesa })`** → la stessa forma per un colpo degli Asteroidi (l'evento
  `risposta` di [../asteroidi/scuola.md](../asteroidi/scuola.md)): `fatto` «9 × 7», `data` il numero del sasso
  colpito o «—» se il giusto è caduto, `attesa` il risultato. La chiave che va alla maestra è `tab:prodotto`,
  come per le schede.

## Il registro della scuola

`src/scuola/sostituti/registro.js` prende il posto di `quiz/nucleo/registro.js` nella build
([architettura.md](architettura.md)): stessi nomi, ma `MODULI` elenca a mano solo i moduli che il
catalogo usa (`MODULI_USATI`). Un modulo nuovo nel catalogo va scritto anche lì: il test lo dice.

Nei test: `unita/scuola-esercizi` (ogni voce, gradino e tipologia del catalogo dà esercizi validi e
domande con la forma di `guastiDi`; `valido` contro una trentina di forme storte; la tabellina del 9 dà solo fatti
del 9 e li gira tutti prima di ripeterne uno, col perché su ogni falso; il giro sulle classi
dell'orologio; `racconta` sotto i 40 caratteri; `raccontaAsteroide` per un colpo giusto, uno sbagliato e il sasso
caduto; il registro uguale al catalogo).
