# Le mosse dei mostri

Chiesto dall'utente il 21 ottobre 2026: i boss e in genere i mostri più forti hanno più di un attacco, due per ora, i super boss
tre, «così possono curarsi (non molto) oppure lanciarti un incantesimo base». Il progetto e la prova in 3D sono in
`poc/mostri-3d/MOSSE.md` (`poc/mosse-3d.html`); qui come sta nel gioco, 2D e 3D, con lo stesso motore.

## Chi ha quante mosse

| ruolo | chi | mosse |
|---|---|---|
| comune | i mostri di strada, nei branchi e appostati | 1: l'attacco di sempre, **identico a prima** (stessi numeri, stesso caso) |
| forte | il caporale (anticamera, guardiano della chiave) e il signore di sopra (`caporale`, `signore`) | 2 |
| boss | il mostro grosso (`grosso`) | 2 |
| super boss | Carbonchio (l'ultimo della storia) e Falcenera (il più forte dei sei nuovi): `ruolo: 'superboss'` in `dati/grossi.js` | 3 |

- **La prima mossa è sempre l'attacco di sempre**; le altre sono in più. Il ruolo lo dà il mostro del piano (`ruoloDi`), non la
  specie: un orco di strada ha una mossa, l'orco caporale due.
- **Una seconda mossa per ogni specie** (`DEL_CAPORALE`: tutte, perché ogni specie può fare da caporale in una discesa, in una zona,
  nell'abisso o sopra) e una o due per ogni grosso (`DEL_GROSSO`), scelte da com'è fatta la creatura: le melme e le piante si
  curano, l'orco e il lupo urlano, il cinghiale e la bestia cornuta caricano, chi sputa o incanta lancia un incantesimo del suo
  elemento. I super boss: Carbonchio colpo di coda e sfera infuocata, Falcenera falciata e «raccoglie le anime» (cura).
- **Provato a ricavarle dal nome** come il prototipo (`specieDi`, espressioni sul nome): sulle specie del gioco sbaglia (la melma,
  il pipistrello e il piranha diventano «bestie che caricano»). Meglio una riga scritta per specie: `guastiDelleMosse` vuole che
  ognuna ci sia.

## I quattro tipi

- **Attacco forte** (`mod` 1,4, `attesa` 1,5): colpisce più forte ma il mostro aspetta un turno e mezzo nella fila (`agisci` col
  passo), quindi non fa più male nel tempo. La seconda del super boss è più corta: ×1,2, aspetta 1,25. **Provato «in area»** come nel
  prototipo: lo scontro ha un eroe solo (il compagno non c'è ancora), quindi «in area» non vuol dire niente; resta un colpo forte più corto.
- **Cura**: il 12% della vita massima (15% nei super boss), **solo sotto la metà**, una volta per scontro (due nei super boss),
  mai due di fila; quel turno il mostro non colpisce: è il momento in cui l'eroe respira.
- **Incantesimo**: ×0,7 del colpo, **passa barriera, scudo, Scudo alzato, Parata e specchio** (non la schivata né la Testa dura, che è
  dell'eroe e non uno scudo); le spine non pungono (non tocca). Pesa ×2,5 quando l'eroe è protetto: è la risposta al bambino che para
  sempre, ed è annunciato, quindi si vede arrivare.
- **Urlo**: nessun danno; le sue tre mosse dopo valgono +25% (+30% il troll e Grumo, +20% il lupo e il pipistrello),
  al più due volte per scontro, mai da rinforzato.

## Come sceglie, e l'annuncio

- **A inizio turno dell'eroe** (`annunciaLeMosse` in `iniziaTurnoEroe`) ogni mostro con più mosse sceglie la prossima a pesi
  (attacco 4, forte 2, incantesimo 2, urlo 2, cura 6), con le condizioni e i tetti (`pesoMossa`), mai la stessa due volte di fila
  tranne l'attacco di sempre (senza, due mosse si alternerebbero e il colpo scenderebbe a metà). **La tiene fino al suo turno**
  (`foglio.mosse[i].prossima`): l'annuncio dice il vero. Chi agisce due volte prima dell'eroe sceglie la seconda lì.
- **Il tiro non viene dal caso dello scontro** (`rnd`) ma dal seme della corsa e da un contatore (`tiroDalSeme`): chi ha una mossa
  sola non tira niente, e uno scontro di comuni è lo stesso di prima colpo per colpo.
- **`foglio.minaccia`** porta `mossa` (`vistaDella`: id, nome, tipo, icona, colore, elemento, effetto, attesa) e `colpisce` è il colpo
  di quella mossa (0 la cura e l'urlo); `colpiInArrivo` (lo stop del pericolo) conta la mossa annunciata. Per il comune `mossa` è
  `null`. La fuga costa ancora l'attacco di sempre del più forte.
- **Le domande non cambiano**: né quante, né il tempo per rispondere. Lo stato delle mosse vive nel foglio e si azzera a ogni
  scontro; la sosta non lo salva (lo scontro si riapre da capo, come prima).

## Il motore

`dati/mosse.js` (dati e regola, senza three.js: `mosseDi`, `ruoloDi`, `scegliMossa`, `registra`, `modDella`, `curaDella`),
`motore/scontro.js` (`AZIONI_DEI_MOSTRI` per tipo, `turnoDelMostro`, `colpoDelMostro(x, mossa, s)`, `botta(m, mod, ignora)`,
`danno(m, mod)`, `bottaDella`), `motore/turni.js` (`agisci(fila, id, passo)`). Gli eventi nuovi in `esito.azioni`:
`{ che: 'cura', cura }` e `{ che: 'urlo', piu, turni }`; un colpo con una mossa in più porta `mossa`.

## A schermo

- **L'annuncio** (`viste/MossaAnnunciata.vue`, nel 2D in `Scontro.vue`, nel 3D in `Scontro3d.vue`): sopra chi ha più mosse, fra un
  turno e l'altro, un tondo col segno disegnato (spada rossa, due spade arancioni il colpo forte, croce verde, stella viola, onde
  gialle) e il nome sotto; nel 2D un anello del suo colore sotto i piedi, nel 3D l'anello a terra del prototipo. Forma e colore
  diversi: col suono spento si capisce lo stesso.
- **Il racconto** (`viste/racconto.js`): la cura dice il nome, poi sale «+6» verde e la barra risale (650 ms); l'urlo dice il nome
  e trema di giallo; l'incantesimo parte da lontano e arriva un po' dopo (320 ms invece di 170); una mossa in più dice il suo nome.
- **Il 3D** (`scena3d/racconto.js`, `mostro3d.js`, `cose.js`): chi ha più mosse ha istanze sue, preparate con `conMosse` di
  `mostri3d/mosse-anim.js` (la copia del prototipo, `npm run promuovi3d`) senza l'icona (la scrive l'HTML). La cura: il mostro si
  china e brilla, le croci verdi (`cura` delle aure) ai suoi piedi; l'incantesimo: si carica e lancia il proiettile del suo elemento
  (`palla`, `scheggia`, `fulmine`, `dardo`) dalla sua `origine` all'eroe; l'urlo: la testa indietro e due anelli gialli; l'attacco
  forte: l'attacco del modello con il corpo intero (carica, balzo, scatto, schianto). Senza modello (sprite) restano le croci, il
  proiettile e le scintille.

## La taratura

Solo i mostri con mosse cambiano, quindi si misura prima e dopo con gli strumenti di sempre:

- `npm run sotterraneo -- --semi 20 --contro HEAD` (roba attesa, media delle sette discese): a 8/10 20 → 21%, a 6/10 12 → 12%,
  a 4/10 4 → 4%.
- `npm run taratura -- --rifai --riassunto prima.json`, poi `--contro prima.json` (i giocatori tipo): colpi per abbattere un caporale
  4,6 → 4,7 (scalinata), 4,6 → 4,9 (grotta), 5,1 → 5,3 (sommersa), il resto uguale; il grosso ±0,3; la vita persa in uno scontro
  pesante 42 · 26 · 42 · 42 · 39 · 27 · 29 → 42 · 25 · 43 · 42 · 39 · 27 · 29; le domande mediane ±2; i bersagli mancati 42 → 39
  (tutti già mancati prima). La cura allunga lo scontro col caporale di un colpo su venti, e il danno per tempo non sale.
- **Nessun numero ritoccato**: le mosse sono entrate nel rumore. Se un caporale con la cura risultasse lungo col dito, la leva è la
  `quota` (12%) o il peso (6) in `dati/mosse.js`, non le ossa.
- Il giro intero era già fuori da molti bersagli prima delle mosse (le discese dopo la cripta vinte poco dal bravo): non è di
  questo lavoro.

## Nei test

`unita/sotterraneo-mosse`: ogni specie da caporale e ogni grosso ha le sue mosse (comune 1, forte 2, boss 2, super boss 3), i pesi e
le condizioni, mai due di fila, i tetti della cura e dell'urlo, la cura del 12% e del 15% solo sotto la metà, l'incantesimo che passa
lo scudo ma non la schivata, l'urlo che scade dopo tre mosse, l'attacco forte che aspetta 1,5, il comune senza annuncio. Bersagli:
`[data-mossa]` (il tipo), `[data-mossa-id]`, `[data-icona]`. Per guardarle: `#sotterraneo=branco&mostri=3&grosso=barbamuschio&ferito=0.3`
(`&ferito=` fa entrare i mostri con quella parte della vita: sotto la metà la cura si annuncia), nel 3D con `sotterraneo3d=0&…`;
`window.__sotterraneo3d.prova('mossa:radici', 0)` fa fare al mostro 0 quella mossa, solo il disegno.

## Cosa resta

- Le braccia: il lancio dell'orco e dello scheletro è il loro colpo trattenuto più il bagliore (nel prototipo, `MOSSE.md`).
- Il bagliore delle mosse tinge i materiali del modello: se un prototipo li condivide fra le istanze, un altro mostro dello stesso
  modello brilla per un istante insieme.
- Gli scheletri armati coi gradi alti (raro, leggendario) restano comuni: una mossa, più il gelo del mago (`varianti.md`).
