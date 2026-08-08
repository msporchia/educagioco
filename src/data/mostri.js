/* ═══════════════════════════════════════════════════════════════════
   CHI ATTACCA IL CASTELLO

   Qui c'è chi sono, non come sono disegnati: il disegno delle dieci
   bestie di sempre sta in `grafica/castello.js`, quello delle otto
   nuove in `grafica/mostri/` — due cantieri paralleli, non ancora
   ricuciti insieme — entrambi indicizzati per lo stesso `id`.

   Ogni mostro ha una **debolezza**: un tipo di torre che gli fa doppio
   danno. È il motivo per cui non ci si può difendere con una torre
   sola potenziata all'infinito — che era la strategia migliore e anche
   la più noiosa, perché faceva ripetere sempre la stessa operazione.
   Le debolezze girano tutte e tre le torri che fanno danno, quindi
   arrivare in fondo vuol dire aver fatto addizioni, moltiplicazioni e
   divisioni. Il ghiaccio non compare: non fa danno, e una debolezza al
   gelo non vorrebbe dire niente.

   Non tutti ce l'hanno, e non fin da subito. Nella primissima tappa,
   quella con una sola torre, indicare un punto debole non servirebbe
   a niente: con un solo tipo da comprare non è una scelta, è
   un'etichetta. Da lì in poi — quattordici tappe su quindici, più la
   partita libera — le debolezze sono accese: il bambino le vede
   prima che l'ondata arrivi, e la torre giusta si sceglie in
   anticipo invece di scoprirla a battaglia già iniziata.

   `vola` non cambia le regole — nessuno passa sopra le torri — ma
   cambia il disegno: chi vola sta staccato da terra, con la sua
   ombra sotto. Serve a rendere i branchi riconoscibili a colpo
   d'occhio, che è tutto quello che chiediamo a un nemico.
   ═══════════════════════════════════════════════════════════════════ */

/* La debolezza si scrive con il nome della **torre**, non con quello
   dell'operazione: quale conto compri quella torre può cambiare — è già
   successo — e un mostro «debole alle divisioni» diventerebbe di colpo
   debole a un'altra torre senza che nessuno se ne accorga. Il ghiaccio
   non compare mai: non fa danno, e il doppio di zero è zero. */
import { TORRI } from './ops.js'

export const MOSTRI = {
  slime:      { nome: 'Slime',      debole: 'magica' },
  goblin:     { nome: 'Goblin',     debole: 'arciere' },
  pipistrello:{ nome: 'Pipistrello', vola: true, debole: 'arciere' },
  fantasma:   { nome: 'Fantasma',   vola: true, debole: 'magica' },
  ragno:      { nome: 'Ragno',      debole: 'arciere' },
  orco:       { nome: 'Orco',       debole: 'bombe' },
  scheletro:  { nome: 'Scheletro',  debole: 'bombe' },
  golem:      { nome: 'Golem',      debole: 'magica' },
  arpia:      { nome: 'Arpia',      vola: true, debole: 'arciere' },
  drago:      { nome: 'Drago',      vola: true, debole: 'bombe' },

  /* le otto bestie nuove, una per ciascuno dei tre terreni: bosco,
     sotterraneo, mura. Il disegno sta in `grafica/mostri/`. */
  lupo:        { nome: 'Lupo',        debole: 'arciere' },
  corvo:       { nome: 'Corvo',       vola: true, debole: 'arciere' },
  rovo:        { nome: 'Rovo',        debole: 'bombe' },
  verme:       { nome: 'Verme',       debole: 'bombe' },
  blatta:      { nome: 'Blatta',      debole: 'magica' },
  troll:       { nome: 'Troll',       debole: 'magica' },
  corazziere:  { nome: 'Corazziere',  debole: 'magica' },
  balestriere: { nome: 'Balestriere', debole: 'bombe' },
}

export const ELENCO = Object.keys(MOSTRI)

/* da «magica» alla torre che in questo momento si compra con la
   sottrazione: è l'unico punto in cui i due mondi si toccano */
export const torreDebole = id => {
  const aspetto = MOSTRI[id]?.debole
  return aspetto ? Object.keys(TORRI).find(k => TORRI[k].aspetto === aspetto) : null
}

/* quanto vale colpire il punto debole: il doppio, che è un numero che
   un bambino vede senza doverlo misurare */
export const DOPPIO = 2

/* Il branco di un'ondata. Un tipo solo per ondata: così la scheda in
   alto a destra parla di *questa* ondata e la scelta della torre è una
   domanda con una risposta, non una media. */
export const mostroDiOnda = (elenco, onda) => elenco[(Math.max(1, onda) - 1) % elenco.length]

/* La partita libera pesca da tutti, e via via che le ondate salgono
   allarga il repertorio: le prime sono quelle facili da guardare, il
   drago arriva quando si è capito il gioco. */
export const mostroLibero = onda => {
  const quanti = Math.min(ELENCO.length, 2 + Math.floor(onda / 3))
  return ELENCO[(Math.max(1, onda) - 1) % quanti]
}
