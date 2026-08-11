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
     ricevi   un comando da un'unità → { esito, dice, fatto }, con
              `esito` nel vocabolario che `passoFilo` già capisce:
              fatto / lavora / salta / attesa / subito
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

  /* un comando da un'unità già a portata. Risponde con un oggetto che
     riusa il vocabolario di `passoFilo`:
       { esito: 'fatto'|'lavora'|'salta'|'attesa'|'subito',
         dice: 'quello che l'unità pensa' (prima persona),
         fatto: 'quello che si vede da fuori' (facoltativo) }
     `null` vuol dire «questo comando non mi riguarda»: chi chiama
     decide cosa farne (di solito è già filtrato da `accetta`). */
  ricevi (cmd, chi, ctx) { return null }

  /* quello che una condizione può chiedergli (`{cond:'aperta', …}`) */
  chiedi (q) { return null }

  /* dov'è ADESSO: la porta sta ferma, un oggetto preso segue chi lo
     tiene. `mondo` è facoltativo e serve solo a chi ne ha bisogno. */
  dove (mondo) { return this }

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
