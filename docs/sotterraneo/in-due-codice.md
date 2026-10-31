# Il sotterraneo in due: il codice

Come è costruita la discesa in due ([in-due.md](in-due.md) per le regole): i conti che vengono uguali sui due telefoni, quello che
il sotterraneo dà al pezzo comune (`src/insieme/`, [../core/insieme.md](../core/insieme.md)) e la vista. Il motore in due
(gli alleati, i mostri, lo scontro, la scala) è descritto con le regole.

## Il caso e i conti uguali sui due telefoni

Il primo passo, **fatto** (29 ottobre, nel ramo): senza, le due copie si separano (in Castle Battle si separavano per un `Math.hypot`).

- **Tutto il caso dal seme.** `Corsa` prende `rnd`, e dentro la discesa ogni pesca del bottino lo riceve: il giocatore finto scende
  in tutti i tredici dungeon senza chiamare `Math.random` una volta. In due la regia passa `seminato(seme)`.
- **Niente funzioni che il browser arrotonda a piacere.** `Math.hypot`, `acos` (la luce a cono), `atan2` e `cos` (le forme delle
  grotte, cioè il piano che nasce), `pow` (quanti in un branco) e `**` (il salto dei colpi) in `corsa.js`, `livello.js`,
  `scontro.js`, `forme.js` e `botti.js` sono passati ai **conti uguali** (`src/motore/conti-uguali.js`): le quattro operazioni e
  `Math.sqrt`, che la specifica vuole esatte, più le serie. Danno quello che dava Math fino all'ultima cifra (`unita/conti-uguali`),
  e da soli tutte le misure sono rimaste quelle (`npm test` verde). Il mondo di sopra (`aperta.js`, `mondo-*.js`, `terra.js`) non
  è passato: in due non c'è.
- **Il passo fisso**: `passo(dt)` taglia già a 0,05 s; in due il battito è sempre 0,05.
- **La fotografia c'è quasi**: la sosta (`motore/sosta.js`) salva il piano come differenza da quello nato dal seme, coi mostri dove
  erano. In due serve anche lo scontro aperto e la fila, che la sosta non salva.
- **L'impronta**: vita ed energia dei due, celle dei due, mostri vivi e somma delle loro posizioni, piano, passi.
- **`unita/sotterraneo-lockstep`**: il giocatore finto scende in ognuno dei tredici dungeon (botti e copricapi accesi), e il
  test sostituisce `Math.random`, `hypot` e la trigonometria con spie che contano chi le chiama: devono essere zero, e la stessa
  discesa rifatta deve dare la stessa impronta. Un `**` nuovo non lo vede nessuna spia: si scrive `potenzaIntera`.

## Cosa dà il sotterraneo al pezzo comune (`sfida/`)

Come Castle Battle ([../arena/multigiocatore.md](../arena/multigiocatore.md)), **fatto** il 29 ottobre nel ramo:

- `sfida/protocollo.js`: le **mosse** (`vai`, `rispondi` con l'id della domanda, `scendi`, `sali`, `nonAspetto`, `chiudi`,
  `riprendi`, `continua`, `bersaglio`, `prepara`, `bevi`, `usa`, `butta`, `pergamena`; `mossaValida`), l'**impronta** (uguale al
  bit, niente tolleranza: il motore è deterministico), la **proposta** (seme, posto, difficoltà) e la **parte** di ognuno (il suo
  eroe: classe, roba, crescita, nome). La versione è `VERSIONE_SFIDA` più la firma dei dati (discese, mostri, roba, eroi): due
  telefoni con tabelle diverse non partono.
- `sfida/regia.js`: `regolaSotterraneo({ eroe })` per l'incontro, `discesaDi` (il posto al livello della coppia, il caso col suo
  stato), `eseguiMossa` (la mossa di un alleato, se adesso si può ancora: una domanda vecchia o un turno non suo non valgono) e
  `motoreDi`, col `guarda(ruolo)` che dice alla vista quale alleato è di questo telefono.
- `sfida/foto.js`: la **fotografia** della discesa intera (il mondo, gli alleati, lo scontro aperto, il caso), sul pezzo comune
  `src/insieme/grafo.js`. Pesa sui 300 KB: passa in una decina di secondi, e serve solo quando le copie si separano.
- **L'incontro porta la parte dell'ospite** (`presentati`, `accettaParte`: [../core/insieme.md](../core/insieme.md)).
- I bambini finti in `test/aiuto/sfide/sotterraneo.mjs`: decidono sulla loro copia con le mete di `motore/banco-in-due.js` e
  mandano una mossa alla volta. `unita/sotterraneo-sfida`: partite intere su quattro reti, mai separate; la fotografia presa a
  scontro aperto e rimessa va avanti uguale, campo per campo. `node strumenti/banco-rete.mjs --gioco sotterraneo`: in fondo il
  100% con la rete calma, il 92% con quella di casa e di Melody; con «pessima» (spenta fino a un minuto, otto volte al minuto) si
  rompono tutte, come vuole il tavolo che tiene un posto vuoto due minuti.

## La vista (fatto)

- **Si apre dal mondo di sopra**: il tasto 👥 nella barra in cima apre la sala comune, con il posto e la difficoltà nello
  slot (`viste/SceltaInDue.vue`). Un amico si invita come in Castle Battle (`src/amici/giochi.js`, `sotterraneo`).
- **Gioco.vue cambia poco**: in due le azioni che la vista chiama sulla discesa (camminare, rispondere, bere, scendere, l'albero, lo
  zaino; anche i tocchi della scena) diventano mosse (`sfida/vista.js`); quando le chiama il motore restano quelle vere
  (`corsa.inMotore`). Quello che il motore risponde arriva a mossa fatta (`motore.osserva`, `dopoLaMossa`): lo scontro si racconta
  su tutti e due i telefoni, anche il turno dell'altro.
- **Il battito fa correre il lockstep** e non si ferma per la pausa di uno (l'altro resterebbe fermo): in due il ⏸ non c'è.
- **Niente sosta e niente storia**: si salvano la roba e la crescita di chi gioca, in ogni momento (`salva`), e alla fine
  (`chiudiInDue`). Il portale, la ✕ o il cartello della linea chiudono la discesa per chi li tocca; l'altro lo sa subito.
- **Nella scena**: il compagno è la stessa figura dell'eroe coi dati del suo alleato (`disegnaIlCompagno` in `scena3d/indice.js`),
  col nome sopra la testa; la telecamera guarda il punto in mezzo ai due; nello scontro il compagno sta sfalsato sotto l'eroe.
- **Nello scontro**, quando tocca all'altro, al posto della scelta c'è «Tocca a Leo». Alla scala, «Aspetto Leo» col tasto
  «non aspetto più».
- **Da guardare col dito**: il nome del compagno a volte finisce sotto il fumetto dei pensieri; i suoni delle mosse dell'altro.
- **Nei test:** `[data-sfida-apri]` (il 👥), `[data-posto-in-due=…]`, `[data-difficolta=…]`, `[data-tocca-a]`, `[data-aspetta]`,
  `[data-azione="non-aspetto"]`, `[data-strato3d] [data-compagno]`; quelli della sala e del cartello in
  [../core/insieme.md](../core/insieme.md). `integrazione/sotterraneo-sfida` (**serve `wrangler dev`** in `servizio/inoltro`):
  due pagine, il codice, i due eroi su tutti e due i telefoni, un passo che arriva all'altro, il limite, chi se ne va.
