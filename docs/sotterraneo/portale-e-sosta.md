# Il portale, l'uscita e la sosta

Come si lascia una discesa a metà, come la si ritrova e cosa si salva. Le
regole della discesa (la scala, i mostri, gli svenimenti) sono in
[regole.md](regole.md); la terra di sopra, dove sta il portale gemello, in
[terra-di-sopra.md](terra-di-sopra.md); la sosta per avventura in
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
  ([terra-di-sopra.md](terra-di-sopra.md#il-portale-gemello)); si fanno le
  spese e toccando il gemello si torna giù nella stanza e nel punto di prima.
  Il portale nel piano resta: si sale e si torna quante volte si vuole.
- **Uscire con la ✕ non è un portale** (`via: 'uscita'`): la ✕ (e il «← esco»
  della pausa) salva la discesa nel punto esatto e porta **in home**, non
  sulla terra di sopra. Rientrando nel sotterraneo — dalla copertina, da
  «riprendi da qui», o scegliendo l'eroe giusto nella scelta — si è **già
  giù**, nel punto esatto, dietro il velo della pausa
  ([../core/ripresa.md](../core/ripresa.md)): niente mercanti, niente gemello
  (`riprendiSeUscito` in `Gioco.vue`). Una sosta di prima, senza `via`, vale
  come uscita. Provato: sosta e portale insieme, cioè la ✕ che porta sulla
  terra di sopra con il gemello: uscire diventava un portale gratis, «basta
  far finta di uscire dal gioco» (l'utente).
- **Il gemello c'è solo dopo il portale vero.** La carta in cima alla terra
  di sopra («torno giù da dove ero») e «riprendi da qui» in home riprendono la
  stessa sosta; il gemello se ne va con la sosta, quando la discesa finisce o
  con «lascio perdere». L'abisso risalito per stasera (svenimenti finiti: si è
  portati su) conta come portale: è sopra, con la strada per tornare giù.
- **«Lascio perdere questa discesa»** è l'unico modo di salire al villaggio senza
  portale: dal ⏸ in discesa (il velo ha, accanto a «esco», «lascio perdere
  questa discesa» e «scelgo un altro eroe») e dalla carta in cima alla terra
  di sopra. Un foglio (`viste/LascioPerdere.vue`, `[data-lascio-perdere]`) dice
  prima la frase, la stessa nei due posti: la roba che hai addosso e nello
  zaino resta tua, ma la discesa ricomincia da capo, la prossima volta. In
  discesa si risale subito sulla terra di sopra (la roba e le missioni fatte
  passano nell'avventura, come a ogni uscita; niente cartello di fine). Nell'abisso
  il tasto non c'è: la strada su è il portale, e il piano raggiunto è il
  record. Scenderne un'altra con una discesa a metà lo dice anche l'avviso
  (`[data-chiede]`), con le stesse parole.
- **Cambiare eroe da dentro la discesa** (`[data-azione="eroe-giu"]`, sul velo
  della pausa): dalla terra di sopra non si può più, perché da lì non si
  passa. La discesa si salva com'è e si apre la scelta; chiuderla senza
  scegliere riporta giù, e scegliere un eroe con una discesa lasciata con la ✕
  la riprende.

## Lasciare a metà, e fermarsi

- **Si esce e si riprende esattamente dove si era** (`motore/sosta.js`, una
  sosta per avventura: [avventure.md](avventure.md)): stessa stanza, stesso
  punto anche a metà di un passo, porte aperte, forzieri aperti, roba per
  terra, mostri feriti **dove erano** e non a casa. Uscendo con la ✕ si riprende
  giù; salendo dal portale la terra di sopra offre in cima «piano 2 di 3 ·
  ❤️ 14 · 💎 37 — torno giù da dove ero».
- **Si salvano il seme e i cambiamenti, non il piano**: il piano si rifà dal
  seme, e la sosta tiene per ogni cosa nata dal seme solo i campi cambiati
  (`cambiDelPiano`, per indice) più le cose nuove (il bottino, la roba
  buttata). Una sosta a metà della scalinata pesa sui 600 byte contro i
  4 KB delle cose scritte intere, una dell'abisso al piano 23 sui 360. Se il
  piano non nasce più con lo stesso numero di cose (un generatore cambiato)
  la sosta non si legge e la discesa ricomincia.
- **Riprendendo, i mostri hanno tre secondi di calma** (`CALMA`): sono dove
  erano, ma riaprire con un colpo già partito fa pentire di aver ripreso.
- **La roba non sta nella sosta** ma nell'avventura, accanto: salendo dal
  portale si passa dai mercanti, e la discesa ripresa ha la roba di adesso.
- **Si salva sempre**, anche dopo due passi: quello che si perde in una
  discesa appena cominciata è la mappa girata al buio, che è metà del gioco.
- **Formato cambiato, salvataggio non letto**: si ricomincia la discesa.
  `VERSIONE` sale quando un campo *cambia significato*, non per un campo in
  più con un ripiego ovvio. È a 4 dal 7 ottobre 2026 (i cambiamenti invece
  delle cose intere); le soste di prima si sono buttate con l'azzeramento
  delle avventure.
- **Il ⏸ ferma senza uscire** (la pausa comune:
  [../core/interfaccia.md](../core/interfaccia.md#la-pausa-una-sola)); il velo
  dice «piano 2 di 3 · ❤️ 14». Il cartello di un traguardo ferma la discesa.
  Davanti a una domanda il ⏸ non c'è.

Nei test: `unita/sotterraneo-sosta` (la ripresa esatta cosa per cosa, il peso, il
portale, e `via`: portale, uscita, una sosta di prima), `integrazione/sotterraneo-portale`
(col dito: il portale, il gemello, la ✕ che porta in home, «riprendi da qui» che riprende
giù senza carta né gemello e dietro il velo, il gemello che resta dopo il portale vero),
`integrazione/sotterraneo` (uscire, rientrare, «lascio perdere» col suo foglio),
`integrazione/sotterraneo-avventure` (cambiare eroe dal velo, e riprendere giù scegliendo
quello con la discesa a metà). Il velo della pausa: `[data-pausa]` con
`[data-azione="lascia-discesa"]`, `[data-azione="eroe-giu"]` e `[data-azione="esci"]`; il foglio
`[data-lascio-perdere]` con `[data-azione="scorda-si"]` / `"scorda-no"`. `lasciaLaDiscesa` in
`test/aiuto/browser.mjs` fa il giro intero per chi deve solo risalire: la ✕ non basta più.
