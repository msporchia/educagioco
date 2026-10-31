# Il portale, l'uscita e la sosta

Come si lascia una discesa a metà, come la si ritrova e cosa si salva. Le
regole della discesa (la scala, i mostri, gli svenimenti) sono in
[regole.md](regole.md); il mondo di sopra, dove sta il portale gemello, in
[mondo-3d.md](mondo-3d.md); la sosta per avventura in
[avventure.md](avventure.md) e quella di tutti i giochi in
[../core/ripresa.md](../core/ripresa.md). Il codice: `motore/sosta.js` (cosa si
scrive e come si rilegge), `Gioco.vue` (chi la scrive e la riprende),
`viste/LascioPerdere.vue` (il foglio che avverte).

## Il portale e l'uscita

Due modi di lasciare una discesa a metà, e non sono lo stesso: il portale è
una strada per salire e tornare giù, la ✕ è andare via.

- **Nella stanza che era del mercante c'è un portale**: un ovale di luce
  azzurra e viola che gira, disegnato in codice (`scena/portale.js`) coi
  colori di nessuno scenario, così stona un po' e si capisce che è magia.
  Toccarlo non chiede niente: il foglio dice «Torni su al villaggio, e
  ritrovi il portale per tornare qui» (`[data-azione="portale"]`).
- **Salendo dal portale si lascia la discesa com'è**, e la sosta lo ricorda
  (`via: 'portale'`, `motore/sosta.js`): l'eroe sbuca sopra accanto al
  **portale gemello**, nel villaggio dei mercanti
  ([mondo-3d.md](mondo-3d.md#chi-sta-dove)); si fanno le
  spese e toccando il gemello si torna giù nella stanza e nel punto di prima.
  Il portale nel piano resta: si sale e si torna quante volte si vuole.
- **Salire non cura**: la sosta porta la vita e l'energia di giù, e il mondo di sopra le mostra così (la barra); a rimetterle a
  posto, gratis, sono la guaritrice e l'incantatrice ([chi-cura.md](chi-cura.md)), che chiamano da sole chi è
  ferito o scarico. Il gemello riporta giù con quello che la sosta dice: curata, vita e energia piene (`forzeDi` la legge col
  massimo di adesso). Uscire con la ✕ non cura niente: si riprende com'era.
- **Uscire con la ✕ non è un portale** (`via: 'uscita'`): la ✕ (e il «← esco»
  della pausa) salva la discesa nel punto esatto e porta **in home**, non
  sul mondo di sopra. Rientrando nel sotterraneo — dalla copertina, da
  «riprendi da qui», o scegliendo l'eroe giusto nella scelta — si è **già
  giù**, nel punto esatto, dietro il velo della pausa
  ([../core/ripresa.md](../core/ripresa.md)): niente mercanti, niente gemello
  (`riprendiSeUscito` in `Gioco.vue`). Una sosta di prima, senza `via`, vale
  come uscita. Provato: sosta e portale insieme, cioè la ✕ che porta sul
  mondo di sopra con il gemello: uscire diventava un portale gratis, «basta
  far finta di uscire dal gioco» (l'utente).
- **Il gemello c'è solo dopo il portale vero.** Il gemello se ne va con la
  sosta, quando la discesa finisce o con «lascio perdere». L'abisso risalito
  per stasera (svenimenti finiti: si è portati su) conta come portale: è sopra,
  con la strada per tornare giù.
- **Sopra non c'è una carta «torno giù»**: il mondo ha già la sua meta da
  seguire e il gemello per tornare, e la carta proponeva di tornare giù a ogni
  salita. La sosta resta (la scelta dell'eroe dice «a metà», «riprendi da qui»
  in home la riprende): sopra si torna giù dal gemello o toccando l'ingresso
  dello stesso dungeon, il cui fumetto dice «riprendo da dove ero»
  (`[data-azione="scendi"][data-sosta]`). Un altro dungeon avverte col foglio
  `[data-chiede]`, ma il suo no («no, non adesso») resta sopra invece di
  riportare giù (`Campagna.vue`, `tocca`).
- **«Lascio perdere questa discesa»** è l'unico modo di salire al villaggio senza
  portale: dal ⏸ in discesa (il velo ha, accanto a «esco», «lascio perdere
  questa discesa» e «scelgo un altro eroe»), e dalla scala che sale del primo
  piano (stesso foglio: [scala-che-sale.md](scala-che-sale.md)). Un foglio (`viste/LascioPerdere.vue`,
  `[data-lascio-perdere]`) dice prima la frase, la stessa nei due posti: la roba che hai addosso e nello
  zaino resta tua, ma la discesa ricomincia da capo, la prossima volta. In
  discesa si risale subito sul mondo di sopra (la roba e le missioni fatte
  passano nell'avventura, come a ogni uscita; niente cartello di fine). Nell'abisso
  il tasto non c'è: la strada su è il portale, e il piano raggiunto è il
  record. Scenderne un'altra con una discesa a metà lo dice anche l'avviso
  (`[data-chiede]`), con le stesse parole.
- **Cambiare eroe da dentro la discesa** (`[data-azione="eroe-giu"]`, sul velo
  della pausa): dal mondo di sopra non si può più, perché da lì non si
  passa. La discesa si salva com'è e si apre la scelta; chiuderla senza
  scegliere riporta giù, e scegliere un eroe con una discesa lasciata con la ✕
  la riprende.

## La pergamena del portale

L'utente, 16 ottobre 2026: *«puoi prendere lo scroll del teleport, alla
Diablo, così lo paghi e non lo spreci a cavolo»*; e *«chi ti dà la pergamena
all'inizio te la dà come risultato di una missione, e poi ti dice che puoi
comprarle da lei»*.

- **Una cosa da zaino** (`pergamena-portale` in `dati/cose.js`, 📜, `usa:
  'portale'`): si impila in una tasca, al più `PERGAMENE_MASSIME` (5); costa
  `PREZZO_PERGAMENA` (25 gemme, cinque torce: una scelta). Niente energia,
  niente abilità.
- **La prima è il premio di una missione**: l'incantatrice ha perso il
  quaderno degli incantesimi nella cripta, al primo piano (`quaderno` in
  `dati/missioni.js`). C'è dall'inizio e **sta fuori dal tetto delle tre**
  (`fuoriDalTetto`): insegna la pergamena, non toglie un favore della
  storia. Consegnandolo lei dice che da adesso le scrive, e **solo da lì** la
  vende: la linguetta «Pergamene» e il posto in cima al banco hanno `dopo:
  'quaderno'` (`schedeDi`, `Bottega.sempreDi`, `dopoLaMissione`). Prima non
  la vende nessuno, e per terra non si trova.
- **Per terra, rara, solo dopo la missione** (`pergamenaCade` in
  `motore/bottino.js`, il 3% di un forziere o di una curiosità; il tiro ha il
  suo sale, come l'ampolla): mai dai mostri. Non si pesca sui banchi
  (`A_SORTE` la lascia fuori).
- **Si apre dallo zaino, fuori dallo scontro** («Apri il portale»,
  `apriLaPergamena` in `motore/corsa.js`): nella cella libera davanti
  all'eroe, o accanto, si accende un portale come quello fisso. Lo si tocca e
  si sale. Nello scontro no («nello scontro no»), con un foglio aperto no,
  e **uno per piano**: con uno già aperto la pergamena non si spende.
- **Il gemello è gratis**: sopra c'è il gemello, e tornando giù si
  è nel punto di prima, col portale della pergamena ancora aperto (è una cosa
  nuova del piano: la sosta la tiene). Da lì si risale senza un'altra
  pergamena, **finché non si lascia il piano** (`lasciaIlPiano` lo chiude).
- **Nell'abisso non lascia il gemello** (`senzaGemello`): attraversarlo è
  «torno su per stasera», la sera finisce e l'abisso si riprende come dopo
  ogni risalita. Il portale fisso dell'abisso resta com'è.
- **Dove si sbuca: l'ultimo posto sicuro** (`ultimoPostoSicuro` in
  `motore/posto-sicuro.js`, per il portale fisso e per la pergamena). Oggi è
  il villaggio, accanto al gemello; il mondo nuovo potrà scrivere la città o
  la pietra del viaggio toccata per ultima in `avventura.mondo.sicuro`, e
  finché il mondo in 3D non la sa raggiungere si torna al portale.
- **Il portale della pergamena** è lo stesso varco in piedi del
  portale fisso ([grafica-3d-portale.md](grafica-3d-portale.md)): nasce
  accendendosi dal basso, con le rune per terra che si disegnano in giro, e
  se ne va col piano.
- **Il quaderno, a voce**: la richiesta, il ritorno e il grazie stanno nella
  missione; sopra la testa dell'incantatrice c'è il segno delle missioni come
  per gli altri.

Nei test: `unita/sotterraneo-pergamena` (la cosa, la missione e la bottega
prima e dopo, il tetto, per terra solo dopo e mai dai mostri, aprirla, il
gemello gratis con la sosta, lasciare il piano, l'abisso, l'ultimo posto
sicuro), `integrazione/sotterraneo-pergamena` (col dito: lei non la vende
prima del quaderno, dopo la si compra, giù la si apre dallo zaino, su e giù
dal gemello e su di nuovo gratis).

## Lasciare a metà, e fermarsi

- **Si esce e si riprende esattamente dove si era** (`motore/sosta.js`, una
  sosta per avventura: [avventure.md](avventure.md)): stessa stanza, stesso
  punto anche a metà di un passo, porte aperte, forzieri aperti, roba per
  terra, mostri feriti **dove erano** e non a casa. Uscendo con la ✕ si riprende
  giù; salendo dal portale si ritrova il gemello nel villaggio, e la scelta dell'eroe dice «piano 2 di 3 · ❤️ 14 · 💎 37».
- **Anche l'orologio**: `passi`, il mana del cammino e gli incanti preparati addosso ([orologio.md](orologio.md)); senza quei campi una sosta di prima si rilegge da zero.
- **Anche i mostri che torneranno**: `torna` e `morti` stanno sul mostro, quindi nei campi cambiati e in `dietro`; riprendendo, gli scaduti tornano ([ricomparsa.md](ricomparsa.md)). Una sosta di prima non li ha: i suoi morti restano morti.
- **Si salvano il seme e i cambiamenti, non il piano**: il piano si rifà dal
  seme, e la sosta tiene per ogni cosa nata dal seme solo i campi cambiati
  (`cambiDelPiano`, per indice) più le cose nuove (il bottino, la roba
  buttata). Una sosta a metà della scalinata pesa sui 600 byte contro i
  4 KB delle cose scritte intere, una dell'abisso al piano 23 sui 360. Se il
  piano non nasce più con lo stesso numero di cose (un generatore cambiato)
  la sosta non si legge e la discesa ricomincia. I piani già lasciati (si può
  risalire: [scala-che-sale.md](scala-che-sale.md)) stanno in `dietro`, ognuno
  come differenza dal suo seme, al più otto, più `fondo` (il piano più giù toccato).
- **Riprendendo, i mostri hanno tre secondi di calma** (`CALMA`): sono dove
  erano, ma riaprire con un colpo già partito fa pentire di aver ripreso.
- **La roba non sta nella sosta** ma nell'avventura, accanto: salendo dal
  portale si passa dai mercanti, e la discesa ripresa ha la roba di adesso.
- **Si salva sempre**, anche dopo due passi: quello che si perde in una
  discesa appena cominciata è la mappa girata al buio, che è metà del gioco.
- **Formato cambiato, salvataggio non letto**: si ricomincia la discesa.
  `VERSIONE` sale quando un campo *cambia significato*, non per un campo in
  più con un ripiego ovvio. È a 5 dall'8 ottobre 2026 (ogni piano ha la scala
  che sale: una cosa in più); era a 4 dal 7 ottobre (i cambiamenti invece delle
  cose intere). Le soste di prima non si leggono: la discesa ricomincia.
- **Il ⏸ ferma senza uscire** (la pausa comune:
  [../core/interfaccia.md](../core/interfaccia.md#la-pausa-una-sola)); il velo
  dice «piano 2 di 3 · ❤️ 14». Il cartello di un traguardo ferma la discesa.
  Davanti a una domanda il ⏸ non c'è.

Nei test: `unita/sotterraneo-sosta` (la ripresa esatta cosa per cosa, il peso, il
portale, e `via`: portale, uscita, una sosta di prima), `integrazione/sotterraneo-cura` (la cura sopra, scritta nella sosta), `integrazione/sotterraneo-portale`
(col dito: il portale, la vita di giù che sale con l'eroe e la guaritrice che la rimette, il gemello, la ✕ che porta in home, «riprendi da qui» che riprende
giù senza carta né gemello e dietro il velo, il gemello che resta dopo il portale vero; parte nella stanza del portale
con `#stanza=portale` nella scalinata antica, perché un piano con porta e mostro ferito vicini alla partenza non è raro e uno
della cripta non può esserci: là i mostri cadono in un colpo),
`integrazione/sotterraneo` (uscire, rientrare, «lascio perdere» col suo foglio),
`integrazione/sotterraneo-avventure` (cambiare eroe dal velo, e riprendere giù scegliendo
quello con la discesa a metà). Il velo della pausa: `[data-pausa]` con
`[data-azione="lascia-discesa"]`, `[data-azione="eroe-giu"]` e `[data-azione="esci"]`; il foglio
`[data-lascio-perdere]` con `[data-azione="scorda-si"]` / `"scorda-no"`. `lasciaLaDiscesa` in
`test/aiuto/browser.mjs` fa il giro intero per chi deve solo risalire: la ✕ non basta più.
