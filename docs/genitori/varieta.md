# La varietà a monete

Stare tanto sullo stesso gioco rende sempre meno monete. Si gioca lo
stesso, ma per guadagnare conviene cambiare; il giorno dopo tutto torna
pieno. I conti sono in `src/data/varieta.js` (puro, provato in
`test/unita/varieta`), l'aggancio al profilo e al registro in
`src/store/varieta.js`, le schermate in `src/components/varieta/`.

## Il problema, e perché non un tetto di tempo

I bambini si fissano su un gioco e non fanno le tabelline. La risposta
ovvia — dopo tot minuti il gioco si chiude — è quella sbagliata per due
motivi: dall'applicazione **non si sa perché ci sta giocando** (magari è
il gioco che gli serve), e **il tempo lo decide il genitore**, non il
software. Un gioco che si chiude da solo è un genitore scavalcato.

La leva sono **le monete**, che è quello che i bambini vogliono davvero
([calibrazione](../apprendimento/calibrazione.md)): non si toglie niente,
si smette di pagare lo stesso sforzo due volte. Il bambino che vuole le
monete va a cercarle altrove, ed è esattamente il comportamento che si
voleva.

Scartati dal proprietario, da non rifare: uno «slancio» separato dalle
monete, i premi giornalieri, le serie di giorni da non spezzare. Sono
tutti modi di aggiungere un'altra cosa da inseguire, e qui si voleva
toglierne.

## Le regole

- **Di difetto**: i primi **20 minuti** di oggi su un gioco pagano pieno,
  i **20 dopo** a metà, poi niente (`DIFETTO`). Il giorno è quello
  **locale**, come nel registro delle sessioni: una partita delle 23:40 è
  di ieri, e a mezzanotte di casa il salvadanaio è di nuovo pieno.
- **Il minuto contato è quello del registro** (`store/sessioni.js`) più
  la partita aperta adesso: nessun gioco tiene un orologio suo. Il
  telefono posato non conta, perché il registro chiude la sessione quando
  lo schermo si spegne.
- **Un punto solo**: `addCoins` in `store/profile.js` passa le monete
  positive al filtro che `store/varieta.js` gli iscrive, e il filtro sa
  quale gioco è aperto perché lo sa il registro (lo apre e lo chiude
  `App.vue`). Un gioco nuovo ci passa dentro senza saperlo — se dovesse
  ricordarsene lui, il quinto se ne dimenticherebbe.
- **Il cheat e i traguardi non passano dal filtro** (usano `metti`): non
  li dà un gioco. Le **spese** nemmeno — il 💡, la fattoria — perché sono
  negative, e la fattoria non guadagna.
- **La metà si conta col resto**: un gioco che paga una moneta alla volta
  (gli asteroidi) a metà dà una moneta sì e una no. Arrotondando, darebbe
  sempre una o sempre zero (`incasso`).
- **Il premio si prende quando arriva**: una tappa pagata a fine partita
  vale il fattore di quel momento, non una media dei minuti che è durata.

## I tetti sono del genitore

In «Impostazioni › Giochi e domande › Le monete, gioco per gioco»
(`components/varieta/Tetti.vue`), **per bambino**, in `settings.varieta`:

- **le due soglie di tutti** (`pieno`, `meta`), a passi di cinque minuti,
  fino a tre ore (`TETTO_MINUTI`);
- **per ogni gioco**: «come tutti», «numeri suoi» (due soglie sue) o
  «nessun tetto» (`giochi: { survivors: 'libero' | { pieno, meta } }`);
- **la riga «Oggi»**: ogni gioco giocato oggi col suo stato e i minuti
  veri («💀 Survivors · 🪙 finite · 43′»), e sui giochi a metà o finiti il
  tasto **«Ridai tempo»**, che azzera il conto di quel gioco per oggi.

«Ridai tempo» **non tocca il registro**: il grafico di «Quanto ha
giocato» deve continuare a dire il vero. Si scrive a parte quanti secondi
togliere oggi a quel gioco (`ridato: { g: '2026-09-29', s: { survivors:
2580 } }`), e un `ridato` di un altro giorno non vale. Non cresce: ogni
giorno lo sovrascrive.

## I giochi ⭐ consigliati, e quelli che dormono

- Il genitore marca alcuni giochi come **consigliati** (`consigliati`):
  la loro carta mostra **🪙×2**, e i loro primi **20 minuti** del giorno
  (`DOPPIO`) valgono doppio. Dopo valgono le soglie normali, contate
  dall'inizio del giorno: con i difetti, un consigliato fa 20′ a ×2, 20′
  a metà, poi niente.
- **I giochi di scuola che dormono** (`dormienti`, **spento di
  partenza**): un gioco di numeri o di parole (`AREE_DI_SCUOLA`) che non si
  apre da **5 giorni** (`DORMIENTE`) prende il ×2 da solo. Due dettagli:
  - si guarda l'ultima volta **prima di oggi**, se no aprirlo spegnerebbe
    il ×2 dopo il primo minuto;
  - **chi gioca da meno di cinque giorni non ha giochi addormentati**:
    senza, un bambino nuovo avrebbe ogni gioco di scuola a ×2 il primo
    giorno. Un gioco mai aperto, invece, dorme, se il bambino gioca da
    abbastanza.
- Un gioco che non paga (`NON_PAGANO`, e quelli `posto: true`) non ha
  salvadanaio e non si consiglia. L'elenco è scritto a mano, e
  `unita/varieta` guarda nei sorgenti che dica il vero: il giorno che il
  Generale comincia a pagare, il test diventa rosso.

## Come lo sa il bambino, senza interrompere la partita

- **In home** la carta ha un salvadanaio 🐷 con due tacche — piene,
  mezze, vuote — e «ancora N′ piene», «a metà · ancora N′», «finite per
  oggi», o «🪙×2 · ancora N′» (`Salvadanaio.vue`, `sullaCarta`). Un gioco
  non ancora aperto oggi **non dice niente**: è pieno, e undici carte con
  «ancora 20′ piene» sarebbero rumore.
- **Dentro il gioco**, al passaggio di soglia, una scritta piccola sotto
  le monete della barra — «🪙 da qui metà», «🪙 per oggi finite» — per
  quattro secondi e mezzo (`Avviso.vue`, montato una volta in `App.vue`).
  **Niente velo, niente pausa**, e il dito ci passa attraverso
  (`pointer-events: none`). Entrando in un gioco già a metà o finito lo
  dice subito; entrando pieno sta zitta.
- **A fine tappa** il premio si vede ridotto: «🪙 24 → 12 · Survivors: il
  salvadanaio è stanco, domani torna pieno»; a zero «Survivors: monete
  finite per oggi · prova Asteroidi», dove il gioco proposto è prima un
  ×2, poi quello con più minuti pieni (`suggerisci`). La frase non usa
  l'articolo del gioco («di Il sotterraneo» non si può leggere).
  - **Survivors e Conta** la scrivono sul loro cartello di fine: pagano
    con `incassa` (`store/varieta.js`), che torna quanto è arrivato
    davvero e con che parole. Conta paga a ogni risposta e somma la tappa
    intera.
  - **Gli altri giochi** non sono ancora stati toccati: la stessa frase
    arriva dalla scritta piccola, sopra il loro cartello, per ogni premio
    da almeno 5 monete (`AVVISO_DA`) — sotto è la monetina di un colpo, e
    la dice la soglia. Il loro cartello dice ancora il premio pieno: si
    sistemano uno per volta passando da `incassa` (vedi
    [da-fare](../core/da-fare.md)).

## Nei test

Unità: `unita/varieta` (i conti, il filtro dentro `addCoins`, e l'elenco
dei giochi che non pagano letto dai sorgenti). Browser:
`integrazione/varieta` (la home, i grandi, Conta a metà).

Bersagli: `[data-salvadanaio="pieno|meta|vuoto|doppio"]` sulla carta;
`[data-varieta-avviso]` la scritta piccola; `[data-nota-monete]` sul
cartello di fine; nella pagina dei grandi `[data-varieta]`,
`[data-varieta-soglia="pieno|meta"]` coi `[data-varieta-passo="giu|su"]`,
`[data-varieta-oggi="<gioco>"][data-fase]` col
`[data-azione="ridai-tempo"]`, `[data-varieta-gioco="<gioco>"]` coi
`[data-tetto="tutti|suoi|libero"]` e i `[data-varieta-suo=…]`,
`[data-consiglia="<gioco>"]`, `[data-flag="dormienti"]`.
