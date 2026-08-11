/* ═══════════════════════════════════════════════════════════════════
   GLI INTERRUTTORI DELLA RESA — un ponteggio, non un'architettura

   Serve a rispondere a una domanda sola: **quanto vale ognuna di
   queste cose?** Il disegno del Generale sembrava povero e nessuno
   sapeva dire perché; tirare a indovinare avrebbe voluto dire
   riscrivere trenta file e scoprire dopo che il colpevole era un
   altro. Quindi ogni miglioria sta dietro a un interruttore, il banco
   (`strumenti/banco/`) li accende uno per volta, e si guarda.

   ── che ci fa un flag dentro `grafica/` ──
   Il patto del progetto è che i pittori non sappiano niente del gioco,
   e questo file non lo rompe: qui non c'è una regola, non c'è un
   prezzo e non c'è un'ondata. C'è **come si dipinge**, che è affare
   di questa cartella e di nessun altro.

   ── e va tolto ──
   È roba di cantiere. Quando si sarà deciso cosa vale, quello che
   resta si mette a `true` per sempre e il flag sparisce insieme al suo
   `if`; quello che non vale sparisce col codice che lo serviva. Un
   file che nessuno importa più è il segno che il lavoro è finito.

   ── quello che è già stato giudicato ──
   Tre sono stati provati e scartati, e non stanno più qui perché il
   codice che li serviva se n'è andato con loro:

     · **occlusione ai contatti** — il velo scuro sotto il mento e ai
       piedi. Si vedeva solo sull'orco, e appena: a queste dimensioni
       non paga il conto.
     · **tinta d'ambiente** — la stanza che tinge tutti. Uniformava,
       ma si mangiava l'identità cromatica dei personaggi, che è
       proprio quello che li fa riconoscere a colpo d'occhio.
     · **andatura** (easing e sfasamento del passo) — non era una
       miglioria: le partenze ammorbidite facevano sembrare i
       personaggi indecisi.

   Il valore di partenza è **spento**: acceso di suo, il banco non
   potrebbe più far vedere il «prima».
   ═══════════════════════════════════════════════════════════════════ */

export const RESA = {
  /* la posa della camminata viene dalla frazione di passo invece che
     dal numero di celle percorse: le gambe si muovono mentre si
     scivola, invece di scattare all'arrivo */
  camminata: false,

  /* i personaggi prendono la luce della stanza in cui stanno: dorati
     dentro la pozza di una torcia, blu notte fuori. È quello che
     toglie l'aria di adesivo incollato sopra la fotografia */
  luce: false,

  /* l'ombra si allunga dalla parte opposta alla fiamma più vicina e
     sfuma, invece di essere la stessa ellissi per tutti */
  ombra: false,

  /* le campiture piatte diventano volumi: un gradiente che segue la
     direzione della luce invece di una tinta sola */
  volume: false,

  /* LA GRANA DEL PAVIMENTO, che è la scoperta più grossa di tutte.
     Un lastrone era largo da una a due celle e un personaggio è alto
     poco più di una: si camminava su pietre larghe il doppio di chi
     ci passava sopra. A quella scala un pavimento non è un pavimento,
     è un muro sdraiato — pochi pezzi enormi, ognuno grande abbastanza
     da farsi guardare da solo, e nessuna trama.

     Il metro giusto ce l'avevamo già in casa: **la muratura**. È
     fatta di tanti pezzi piccoli, ognuno di una tinta un filo diversa,
     e legge come materia proprio per quello. Qui il pavimento va alla
     stessa grana. */
  grana: false,

  /* LA DENSITÀ DI DETTAGLIO, cioè la risposta a «sono quattro cerchi
     e finita lì».

     È vero, e si vede meglio di tutto nello scudo del cavaliere: tre
     ellissi concentriche, una dentro l'altra, e quello era lo scudo.
     Non è che manchi il volume o la luce — manca proprio **la roba da
     guardare**. Un occhio che si posa su un oggetto cerca i punti in
     cui il fatto è costruito: il bordo che è un pezzo a parte, i
     chiodi che lo tengono, la piega dove due lastre si accavallano, il
     graffio. Toglili tutti e resta un logo.

     Questo interruttore aggiunge quel secondo livello. Non cambia
     nessuna forma grande — la silhouette resta identica, e a mappa
     rimpicciolita non si vede niente di diverso — ma da vicino c'è di
     che guardare invece che una campitura.

     Per ora tocca **il solo cavaliere**: è la prova. Se paga si porta
     agli altri dodici, che è lavoro d'illustrazione, non di sistema. */
  dettaglio: false,

  /* LA MATERIA, cioè la risposta a «se è piatto, tanti poligoni non
     aiutano». Non aiutano davvero: il difetto non è quanti pezzi ci
     sono, è che ogni pezzo è riempito con **una tinta uniforme**, e
     una tinta uniforme è carta colorata. Cento ritagli di carta fanno
     una figura complicata, non una figura di ferro.

     Qui la figura si dipinge su una tela di scorta e ci si passa
     sopra una grana minuta, in una volta sola per personaggio. Il
     come sta in `materia.js`. */
  materia: false,

  /* L'OMBRA CHE UN MURO GETTA PER TERRA. Senza, un blocco appoggiato
     in mezzo alla stanza è un rettangolo incollato sopra il
     pavimento: i bordi sono netti, niente dice che ha uno spessore e
     che sta *sopra* qualcosa. È il difetto che fa sembrare la
     scenografia una collezione di adesivi. */
  ombraMuri: false,
}

/* Il banco accende e spegne; il gioco non chiama mai questa. */
export function accendi(quali) {
  for (const k in quali) if (k in RESA) RESA[k] = !!quali[k]
  return RESA
}
