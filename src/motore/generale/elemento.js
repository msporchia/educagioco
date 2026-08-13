/* ═══════════════════════════════════════════════════════════════════
   ELEMENTO — la classe base di tutto quello che sta sul campo e non
   cammina

   Prima ogni cosa nuova del mondo era un `case` in più dentro il grande
   `switch` di `fai()` (`generale.js`): dentro `case 'apri'` c'era la
   serratura, le spallate, il fracasso — tutto insieme, e la logica di
   UNA cosa (la porta) stava scritta nel posto che dovrebbe conoscere
   TUTTE le cose. `Elemento` rovescia il verso: chi esegue un ordine non
   apre una porta, le *dice* `apri`, e la porta decide da sé e risponde.

   Sette canali, e sono tutti quelli che servono:
     tipo     'porta' | 'oggetto' | 'posto' | … — i verbi filtrano su questo
     accetta  quali comandi capisce
     ricevi   un comando da un'unità → { esito, penso, siVede } (o
              `null`): il CONTRATTO è tutto qui sotto
     chiedi   le condizioni lo interrogano ('aperta', …)
     dove     dov'è adesso (la porta sta ferma, un oggetto preso segue
              chi lo tiene)
     faccia   il descrittore per la tela, IN CELLE non in pixel: se
              rispondesse in pixel il motore saprebbe di uno schermo e
              smetterebbe di girare in Node
     scheda   le righe che il bambino legge toccandolo
     azzera   rigiocare la scena: si rimette com'era

   LA COSA NON CAMMINA. Avvicinarsi resta un mestiere dell'unità — il
   motore la porta a portata e SOLO ALLORA consegna il comando
   all'elemento: `prendi` e `apri` continuano a camminare da soli
   perché quel comportamento è dell'ordine, non della cosa.

   Le unità NON sono un Elemento, non ancora: hanno fili, vista e
   memoria, ed è una tappa a parte (§8 del piano). Qui dentro stanno
   solo le cose passive: `Porta`, `Oggetto`, `Posto`.
   ═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   IL CONTRATTO DI `ricevi` — cinque modi di rispondere, e sono tutti
   quelli che servono

   Una cosa non ESEGUE un comando: RISPONDE a un comando, e la risposta
   dice sia cosa è successo sia se il battito ci è costato. A chiamare
   `ricevi(cmd, chi, ctx)` per conto di chi ha camminato fin qui è
   `Contesto.consegna` (`contesto.js`): lui traduce la risposta in una
   riga di registro e in quello che l'azione chiamante deve fare dopo —
   un elemento non scrive mai lui stesso a registro.

   La risposta è `{ esito, penso, siVede }`, oppure `null` — «questo
   comando non mi riguarda», di solito già escluso da `accetta` prima
   ancora di arrivare qui. `esito` è un `Esito` (`azioni/esiti.js`):
   `penso` è la frase in prima persona che finisce a registro, `siVede`
   quella per chi guarda da fuori (facoltativa: senza, il registro non
   scrive niente). Cinque casi, con la porta come esempio di ciascuno:

     ERA GIÀ COSÌ            Esito.finitoSubito()
       «era già aperta»: non è successo niente, e il battito resta
       intatto — chi chiede «apri» a una porta già aperta non perde il
       turno per scoprirlo.
     L'HO FATTO               Esito.finito()
       «l'ho aperta»: fatto, e il battito è speso.
     CI STO LAVORANDO         Esito.inCorso()
       «sto sfondando»: non ho finito, ma il battito è speso lo
       stesso — richiamami al prossimo, e la prossima volta magari
       finisco.
     NON SI PUÒ, E LO DICO    Esito.finito() con un `penso` che spiega
       «non si apre: mi manca la chiave»: il battito è speso — ci si è
       provato — ma quello che si voleva NON succede. È `finito()`, non
       `rotto()`: chi ha chiesto resta in piedi e la sua fila prosegue
       con l'ordine dopo, come chi si accorge di una porta chiusa e va
       a provare un'altra strada. `Esito.rotto()` è un'altra cosa —
       ferma il RAMO INTERO di chi stava eseguendo — ed è per un guasto
       da cui non si riparte, non per «oggi questa chiave non ce l'ho».
     STO ASPETTANDO           Esito.inAttesa()
       «aspetto che la aprano dall'altra parte»: non è successo niente
       e il battito resta intatto — è la differenza fra chi avanza
       piano e chi non si muove affatto (vedi `speso` in
       `azioni/esiti.js`). Nessuno dei quattro elementi di oggi la usa:
       resta per il giorno in cui una cosa dovrà dire «non tocca a me,
       aspetto un segnale».

   ── IL BUCO CHE «NON SI PUÒ» LASCIA APERTO ──
   `Contesto.consegna` oggi non distingue, fra le risposte finite, chi
   ha avuto successo da chi si è solo dovuto fermare: per qualunque
   `Esito.finito()` chiama sempre `registro.fatto` (riga verde, «fa»).
   Il vecchio motore aveva un quarto colore — `salta`, riga ROSSA, «non
   ho potuto, ma vado avanti» — che oggi non è più esprimibile da un
   elemento: `rotto()` è rosso ma ferma tutto il ramo, `finito()`
   prosegue ma esce verde. Chi legge «apre il cancello» in verde quando
   in realtà la porta ha appena rifiutato la chiave sbagliata sta
   leggendo un difetto del registro, non di questo file — dipende da
   `Contesto.consegna`, che è fuori dai file che questa tappa tocca.
   ═══════════════════════════════════════════════════════════════════ */
export class Elemento {
  constructor (id, d) {
    this.id = id
    this.x = d.x
    this.y = d.y
    /* il dato grezzo del livello (già patchato con la variante): resta
       a disposizione delle sottoclassi che vogliono leggerci altro
       senza che la classe base debba conoscerne i nomi */
    this.d = d
  }

  /* 'porta' | 'oggetto' | 'posto' — da qui discendono i verbi che
     accettano questa cosa (VERBI[v].accetta.includes(tipo)) */
  get tipo () { return 'elemento' }

  /* l'icona di scorta, quando l'elemento (o il dato) non ne dichiara
     una sua: la chiave resta il ripiego più comune */
  get em () { return '❓' }

  /* quali comandi questo elemento capisce, a prescindere da chi lo
     manda: serve a chi assembla la cassetta prima ancora di provare */
  accetta (cmd) { return false }

  /* un comando da un'unità già a portata (o `null`, per un congegno che
     ne aziona un altro da lontano: vedi il CONTRATTO qui sopra e
     `Porta.ricevi`). Risponde con:
       { esito: un Esito (azioni/esiti.js),
         penso: 'quello che l'unità pensa' (prima persona),
         siVede: 'quello che si vede da fuori' (facoltativo) }
     `null` vuol dire «questo comando non mi riguarda»: chi chiama
     decide cosa farne (di solito è già filtrato da `accetta`). */
  ricevi (cmd, chi, ctx) { return null }

  /* quello che una condizione può chiedergli (`{cond:'aperta', …}`) */
  chiedi (q) { return null }

  /* dov'è ADESSO: la porta sta ferma, un oggetto preso segue chi lo
     tiene. `mondo` è facoltativo e serve solo a chi ne ha bisogno. */
  dove (mondo) { return this }

  /* ── LE CELLE DA CUI LA SI TOCCA QUANDO NON CI SI PUÒ STARE SOPRA ──
     Su una porta chiusa non si cammina, quindi per chi misura le
     distanze a passi la sua cella è irraggiungibile: chi le era
     appoggiato «non la vedeva». Non è un caso speciale del raggio — è
     una cosa che la cosa sa di sé, e questa è la risposta buona per
     tutti: le quattro caselle attorno. */
  bordi () {
    return [{ x: this.x + 1, y: this.y }, { x: this.x - 1, y: this.y },
            { x: this.x, y: this.y + 1 }, { x: this.x, y: this.y - 1 }]
  }

  /* il descrittore per la tela, in CELLE: sempre una lista, anche
     quando è una sola cosa o nessuna — un elemento può voler dire più
     di un pittore in una volta (la porta col suo sigillo, domani il
     totem con le sue tacche) */
  faccia () { return [] }

  /* le righe che si leggono toccandolo. `ctx` porta quello che serve a
     tradurre un id in un nome (di solito `{ m }`) */
  scheda (ctx) { return [] }

  /* rigiocare la scena: ognuno si rimette com'era. Sostituisce il
     rimettere-a-mano che faceva `avvia()`, riga per riga: un elemento
     nuovo non può dimenticarsi di azzerarsi, perché il metodo sta
     accanto al suo stato */
  azzera () {}

  /* il nome che si legge: quello che il livello ha dichiarato per
     questo id (`livello.nomi`), o l'id stesso */
  nomeIn (mondo) { return ((mondo.livello.nomi || {})[this.id]) || this.id }
}
