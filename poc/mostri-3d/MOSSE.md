# Le mosse dei mostri

Richiesta dell'utente: tutti i nemici hanno un solo attacco; i boss e i mostri più forti ne avrebbero due, i super boss tre, così
possono curarsi un po' o lanciare un incantesimo base. Questo è il progetto e la prova in 3D, **non ancora nel gioco**.

File: `mosse.js` (dati e regola di scelta, senza three.js), `mosse-anim.js` (le animazioni), `mosse-pagina.js` + `../mosse-3d.html`
(la pagina di prova). Il gioco vero non è toccato: gli aggiornamenti sono elencati in fondo.

## Le regole

- **Quante mosse**: comune 1, forte 2, boss 2, super boss 3 (`N_MOSSE`). Chi non dichiara `ruolo` lo prende da `ruoloDi` (caporali noti, poi la taglia).
- **La prima mossa è sempre l'attacco di sempre**: un comune non cambia, un forte non perde niente; la seconda e la terza sono in più.
- **Quattro tipi** (`TIPI`): `attacco` (anche in seconda variante: forte o in area), `cura`, `incantesimo`, `urlo` (rinforzo).
  Niente evocazioni: lo scontro non ha rinforzi a scontro aperto (`docs/sotterraneo/scontro.md`), e chi chiama il branco si rinforza soltanto.
- **Attacco forte**: danno ×1,4 ma poi il mostro aspetta 1,5 turni (×1,25 e ×1,2 se è in area, il colpo di coda): colpisce più forte, non più spesso, quindi il danno per tempo non sale.
- **Cura**: recupera il 12% della vita massima (15% nei super boss), **solo sotto la metà**, al massimo 1 volta per scontro (2 nei super boss), mai due di fila, e il turno è suo
  (non colpisce): è il momento in cui l'eroe può reagire. Mai nei comuni.
- **Incantesimo**: danno ×0,7 di un attacco, a distanza, **ignora lo scudo, la barriera, la parata e lo specchio** (non la schivata). Dardo, palla, scheggia
  o fulmine secondo l'elemento (`INCANTESIMO_DI`; il fisico è un dardo arcano viola). Pesa ×2,5 quando l'eroe è protetto: è la risposta al bambino che para sempre.
- **Urlo**: nessun danno; il suo colpo vale +25% (+30% l'orso, +20% il capobranco) per 3 mosse, al massimo 2 volte per scontro, non se è già rinforzato.
- **Due mosse al massimo per specie e ruolo**: la ragione sta in `perche` di ogni riga (l'orso ruggisce, il mostro di muschio affonda le radici, il drago d'oro si cura con la luce).

## Chi ha cosa

| ruolo | mostro | mosse |
|---|---|---|
| super boss | drago grande rosso, azzurro, nero | soffio · colpo di coda (in area) · incantesimo (sfera infuocata, schegge di ghiaccio, saetta) |
| super boss | drago grande verde, oro | soffio · colpo di coda · cura (linfa del bosco, luce che risana, 15%, 2 volte) |
| boss | orso | zampata · ruggito (urlo +30%) |
| boss | drago fiero | artigliata · palla di fuoco (×0,75) |
| forte | scheletro con scudo | fendente · si ricompone (cura) |
| forte | orco | mazzata · urlo di guerra |
| forte | cinghiale caporale | zannata · carica a testa bassa (attacco forte) |
| forte | capobranco | morso · ululato (urlo +20%) |
| forte | mostro di muschio | pugno · radici rigeneranti (cura) |
| forte | tartaruga corazzata | morso · getto d'acqua (incantesimo di gelo) |

Chi non ha una riga (le zone che arrivano: palude, ceneri, monte, landa…) le ricava da `mosseDi`: **forte** → vegetale cura, umanoide urlo, acqua/morto/drago
incantesimo, bestia carica; **boss** → vegetale cura, bestia ruggito, il resto incantesimo; **super boss** → schianto in area + (incantesimo, o cura se sacro o veleno).
Specie ed elemento si leggono da chiave e nome (`specieDi`, `elementoDi`), o da `elemento` se la voce lo dichiara. I comuni tornano la mossa di prima.

## Come il mostro sceglie (`scegliMossa`)

1. Ogni mossa ha un `peso` (attacco 4, attacco forte 2, incantesimo 2, urlo 2, cura 6) e una `condizione`: la cura vale solo sotto la metà della vita
   (`sotto-meta`), l'urlo solo se non è già rinforzato; un tetto per scontro (`max`, `MAX_CURE`).
2. Pesa ×2,5 l'incantesimo se l'eroe è protetto.
3. Mai due volte di fila la stessa, **tranne l'attacco semplice**: con due mosse e nessuna eccezione il mostro alternerebbe a rigore e il suo colpo scenderebbe a metà.
4. Se niente è possibile, l'attacco. La scelta si fa **a inizio del turno dell'eroe** e si mostra (vedi sotto), poi il mostro fa quella.

Misurato a tavolino (20000 turni, `registra` + `numeriDi`, danno per unità di tempo rispetto al colpo di prima): orco 0,94 · cinghiale 0,98 · orso 0,94 · tartaruga 0,92 ·
drago rosso 0,93 · drago verde sano 0,99 e **0,80 quando può curarsi**. Il danno non sale mai oltre il vecchio; la cura aggiunge vita, quindi i forti e i boss restano
più o meno com'erano e le discese si ritarano con `npm run sotterraneo`, non a occhio.

## Come si legge a schermo

- **Annuncio**: dall'inizio del turno dell'eroe, sopra il mostro, **un'icona disegnata** in un tondo e un anello a terra, fermo sotto i piedi: spada rossa (attacco),
  due spade arancioni (forte o area), croce verde (cura), stella viola (incantesimo), onde gialle (urlo). Tre segni distinti per forma e colore: col suono spento
  si capisce lo stesso. Il bambino sa cosa sta per arrivare mentre risponde.
- **Anticipazione** nella mossa: l'anello cresce e pulsa per il primo tratto, poi il colpo. Cura: il mostro si china e brilla di verde, sale la colonna di croci
  (`aure/cura`) e il numero verde. Incantesimo: si impenna, un bagliore del colore dell'elemento cresce sulla bocca o sulla mano e parte il proiettile
  (`lancio/*`). Urlo: la testa all'indietro, la bocca aperta (la preparazione del suo stesso morso), due anelli gialli si allargano.
- **Attacchi in seconda variante**: sono `attacca(p)` del mostro rimappato sul nuovo istante d'arrivo, più un movimento del corpo intero (`carica`, `balzo`,
  `impennata`, `scatto`, `schianto`); la coda del drago è la variante `coda` del drago stesso. Nessun file dei mostri è toccato.

## La pagina di prova

`poc/mosse-3d.html`. Scegli il mostro (raggruppati per ruolo), premi le mosse, o «Mosse a caso come nel gioco»: l'eroe colpisce (−8…12%), il mostro annuncia
per 1,3 s e poi fa. Indirizzo: `?mostro=drago-rosso&mossa=cura&t=0.5&pausa&pannello=no`; `mossa=cura|incantesimo|urlo|attacco-forte` aggiunge la mossa
generica a un mostro che non la ha (per provarla); `caso=1&seme=5&vita=52` parte a caso (la vita iniziale in %), `protetto=1` simula l'eroe con lo scudo.
Per gli scatti: `--prima 'window.__mosse.vaiA("cura",0.7)'` avanza fino alla prossima cura a caso, `vaiAnnuncio(tipo)` fino alla sua icona.
`window.__prova = { ok, errori, mosse }`.

## Cosa non convince

- Le braccia non si usano: il lancio dell'orco e dello scheletro è l'`attacca` del loro colpo trattenuto (mazza alzata) più il bagliore, non un gesto di lancio.
  Servirebbero i perni nominati in `userData` (oggi non ci sono: `bracci` non esce da `umanoide`).
- Il bagliore colora tutto il corpo di emissivo: sui mostri chiari (scheletro, orco) copre i colori. Da abbassare ancora, o da limitare a una parte.
- Il colpo di coda del drago non arriva sull'eroe (la coda spazza di lato, il segno cade dove sta lui): è la variante `coda` del drago, senza bersaglio.
- Il danno sui bambini: il colpo ×1,4 e l'incantesimo che ignora la parata sono le mosse che possono sorprendere. Per questo si annunciano sempre; se ancora duro,
  l'incantesimo a 0,6 o niente `ignoraScudo` sulla barriera.

## Per portarlo nel gioco (non scritto)

1. **`dati/mostri.js`**: un campo `mosse: ['mazzata', 'urlo-guerra']` per specie (ids di `MOSSE`, i dati veri in un file nuovo `dati/mosse.js`, copia di `mosse.js`
   senza il resto) e `ruolo` (oggi si deduce da `capo` e dal grosso). `dati/grossi.js` (`difeseDi` e simili): le mosse del grosso, scelte dalla creatura che veste.
2. **`motore/scontro.js`, `AZIONI_DEI_MOSTRI`** (riga 27): aggiungere `cura`, `incantesimo`, `urlo` accanto a `colpo`; `turnoDelMostro` (riga ~413) oggi sceglie `MOSTRI[x.tipo].azione`:
   passa invece per `scegliMossa` con lo stato `x.mosse = { usate, ultima, rinforzo }` (nuovo, per mostro, azzerato a ogni scontro).
3. **`colpoDelMostro` e `botta`** (righe ~427 e ~496): un parametro `mossa` (`mod`, `ignoraScudo`, `area`) al posto del colpo fisso; l'`ignoraScudo` salta `assorbiConIPreparati`,
   `io.scudo`, `parato` e `specchio`. L'attesa (`attesa`) va in `agisci(f.coda, a.id)` (riga ~380) come `100 / velocita * attesa`. Il rinforzo cala di uno a ogni mossa del mostro, come lo stato che conta i turni.
4. **`foglio.minaccia`** (riga 222, `aggiorna`): oggi `{ chi, colpisce, salta }`; aggiungere `mossa` (id, tipo, icona) scelta una volta a inizio turno dell'eroe e **tenuta fino al turno del mostro** (campo `x.mossaProssima`),
   così l'annuncio è vero. «Ti colpisce 3» per le mosse che colpiscono, «si cura» o «urla» per le altre.
5. **Vista** (`viste/Grosso.vue`, `scena/tela.js`, il campo): l'icona sopra il mostro e l'anello (le stesse cinque forme di `mosse-anim.js`, disegnate, niente emoji); il numero verde della cura.
6. **Numeri**: dopo l'innesto `npm run sotterraneo` (banco e `giocatori-tipo`) per misurare il danno per tempo e la durata dei grossi, e `docs/sotterraneo/scontro-bilancio.md`;
   un test di unità per `scegliMossa` (cura solo sotto la metà, mai due di fila, tetto per scontro) e uno per «un comune ha una mossa sola».
