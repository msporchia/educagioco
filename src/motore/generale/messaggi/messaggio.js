/* ═══════════════════════════════════════════════════════════════════
   MESSAGGIO — qualcosa che è successo, e che qualcuno può cogliere

   Prima la consegna era un blocco cablato dentro il battito: decideva i
   destinatari, faceva scattare a parte chi «accorre» con un `if` che
   scavalcava gli ascolti, e componeva la riga di registro con tre
   ternari annidati. Tutto in un punto che doveva conoscere ogni caso.

   Adesso il messaggio sa da sé a chi arriva, e chi lo riceve sa da sé
   se gli interessa. Il mondo fa una cosa sola: **propaga**.

   ── UN MESSAGGIO NON SCEGLIE I DESTINATARI ──
   Non c'è una lista di iscritti: c'è una domanda, `arrivaA(chi)`, e
   ognuno la fa a sé. Un rumore arriva a chi è abbastanza vicino, una
   voce solo a chi il mittente ha davanti. Aggiungere un modo nuovo di
   comunicare è aggiungere una classe, non un ramo nel battito.

   ── E PORTA SEMPRE UN POSTO ──
   Il segnale dice anche DA DOVE è partito. A chi lo ascolta e basta
   serve solo per sapere che è successo; a chi corre a vedere serve
   eccome. È quello che rende «fai rumore lontano da dove devi passare»
   una mossa scrivibile invece di una speranza.
   ═══════════════════════════════════════════════════════════════════ */
export class Messaggio {
  constructor (segnale, da) {
    this.segnale = segnale
    this.da = da.id
    /* dove è successo: si copia adesso, perché fra un battito chi l'ha
       mandato si sarà mosso e il rumore no */
    this.x = da.x
    this.y = da.y
  }

  /* arriva a questo qui? */
  arrivaA (mondo, chi) { return false }

  /* fa alzare la testa a chi è fatto per correre al rumore? Una voce
     no: è una cosa detta a chi hai davanti, non un allarme. */
  get eRumore () { return false }

  /* come lo racconta chi l'ha mandato, in prima persona e visto da
     fuori */
  racconto (nome, destati) {
    return destati.length
      ? { penso: `arriva «${nome}»: si sveglia ${destati.join(' e ')}`, siVede: `manda ${nome}` }
      : { penso: `arriva «${nome}», ma non lo ascolta nessuno`, siVede: 'grida nel vuoto' }
  }
}
