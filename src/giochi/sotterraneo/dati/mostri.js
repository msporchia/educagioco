/* ═══════════════════════════════════════════════════════════════════
   CHI ABITA IL SOTTERRANEO

   `ossa` è la vita, `att` quanto picchia, `dif` quanto para. Il costo in
   domande **non sta qui e non ci deve stare**: è la vita divisa il tuo
   attacco, cioè cambia con quello che hai trovato. È tutto il motivo per
   cui si va a cercare una spada.

   ── LA DIFESA È LA MANOPOLA VELENOSA ─────────────────────────────
   Va tenuta bassa. Con attacco 3 e difesa 2 il colpo scende a 1, e
   abbattere un golem costa **diciotto risposte di fila**. Un numero così
   non si vede leggendo la tabella: si vede solo contando, ed è il motivo
   per cui il conto sta nel banco di prova (`motore/banco.js`) e non a
   occhio. Il tetto è: nessun mostro deve costare più di ~8 risposte a
   chi lo incontra quando è il suo momento, e `guastiDeiMostri()` lo
   controlla contro l'eroe nudo.

   ── I NOMI DEGLI SPRITE SONO QUELLI CHE IL FOGLIO SA DISEGNARE ────
   0x72 disegna goblin, scheletri, orchi e un mostro grosso, e basta: i
   mostri del gioco erano diventati quelli. È il buco che decide se un
   set basta, e va guardato **prima** di innamorarsene — vale anche per
   le armature, che infatti non ci sono (vedi `cose.js`).

   Adesso il buco è tappato, e con la cura che il difetto chiedeva: non
   una leva che allunga i piani, **un bestiario**. Undici creature
   arrivano da due fogli nuovi (`sorgenti/sotterraneo/generati/mostri-1.png`
   e `mostri-2.png`), e vanno a riempire le fasce — non a fare da capi
   alternativi. Il conto non cambia: chi entra dichiara ossa, attacco e
   difesa come gli altri, e `guastiDeiMostri()` lo misura come gli altri.

   Una cosa sola è diversa, ed è dichiarata: quei fogli disegnano una
   **posa sola**, quattro fotogrammi di respiro e basta — non c'è una
   corsa separata come per goblin e scheletro. Chi è così scrive
   `unaPosa: true`, e `scena/tela.js` non va a cercare un `-corsa-` che
   nell'atlante non c'è. Da sveglio cambia il ritmo dei fotogrammi e
   pulsa l'alone: è già tutto quello che serve a dire «questo ti ha
   visto», e infatti era già così che lo si diceva.
   ═══════════════════════════════════════════════════════════════════ */
import { EROE } from './mondo.js'
import { ARMI_DI } from './cose.js'

/* ── quanto spesso lasciano qualcosa ──
   Era una probabilità sola per tutti (sette volte su dieci), e il conto
   che ne usciva non tornava: il goblin è il mostro più comune del
   sotterraneo e **lascia sempre e solo una boccetta**, quindi bastavano
   quattro goblin per uscire da un piano con lo zaino pieno di pozioni
   che non si berranno mai. Una pozione che avanza non è un premio, è
   una tasca occupata — e quando ne hai sei, il momento in cui una
   pozione ti salva non arriva più.

   Adesso la dichiara ogni mostro: chi è debole e frequente lascia di
   rado, chi è grosso quasi sempre. Il bottino torna a essere una cosa
   che capita invece di una tassa che il gioco ti paga. */
export const MOSTRI = {
  goblin: {
    em: '👺', sprite: 'goblin', nome: 'Un goblin',
    ossa: 4, att: 2, dif: 0, gemme: 2,
    droppa: 0.22,
    lascia: ['pozione-piccola'],
  },
  scheletro: {
    em: '💀', sprite: 'scheletro', nome: 'Uno scheletro',
    ossa: 8, att: 3, dif: 1, gemme: 5,
    droppa: 0.45,
    /* le armi si chiedono per **gradino**: una famiglia nuova entra nel
       bottino senza che nessuno debba ricordarsi di aggiungerla qui */
    lascia: [...ARMI_DI(1), 'panciotto', 'pozione-piccola'],
  },
  orco: {
    em: '👹', sprite: 'orco', nome: 'Un orco',
    ossa: 12, att: 4, dif: 1, gemme: 8,
    droppa: 0.6,
    /* L'armatura di mezzo **nelle due stoffe**, e non è simmetria per la
       simmetria: da quando la corazza è ferro, un mago che batte un
       orco non ne ricava niente da mettersi addosso, e il ferro lo
       lascia solo l'orco. Con la corazza sola il mago arrivava in fondo
       diciassette volte su venti invece di diciotto, che è appena sotto
       il patto — ed era tutto lì. Il cuoio invece resta senza famiglia
       (`dati/cose.js`), quindi lo scheletro non ha bisogno di questo. */
    lascia: [...ARMI_DI(2), 'corazza', 'saio', 'pozione'],
  },
  gigante: {
    em: '🗿', sprite: 'mostro-grosso', nome: 'Il gigante',
    ossa: 17, att: 5, dif: 1, gemme: 12, capo: true,
    droppa: 0.85,
    lascia: [...ARMI_DI(3), 'manto', 'amuleto-rosso'],
  },

  /* ═════ IL BESTIARIO NUOVO ═════════════════════════════════════
     Undici creature dai due fogli di mostri. Sono lette per **fascia**
     (vedi `BRANCO` più sotto): dentro una fascia si equivalgono, e
     quello che cambia è la faccia. Perciò i numeri qui sotto stanno
     stretti attorno a quelli del mostro di 0x72 che gli fa da metro —
     il ratto vale un goblin, il fungo vale uno scheletro, il lupo vale
     un orco — e le differenze sono di **forma**, non di quantità: il
     serpente ha poca vita e picchia forte, il granchio para e il
     bottino è di scudi, la vespa è la stessa cosa del serpente in una
     fascia più bassa. Due mostri che costano lo stesso ma si sbagliano
     in modi diversi sono due mostri; due che costano diverso nella
     stessa fascia sono un difetto di taratura mascherato da varietà. */

  /* ── la fascia dei piccoli, accanto al goblin ── */
  ratto: {
    em: '🐀', sprite: 'ratto', nome: 'Un ratto', unaPosa: true,
    ossa: 3, att: 2, dif: 0, gemme: 2,
    droppa: 0.22,
    lascia: ['pozione-piccola'],
  },
  pipistrello: {
    em: '🦇', sprite: 'pipistrello', nome: 'Un pipistrello', unaPosa: true,
    ossa: 3, att: 1, dif: 0, gemme: 2,
    /* la torcia è la cosa più utile che si possa trovare al primo
       piano — fa vedere il doppio — e il pipistrello è l'unico che la
       lasci: una cosa che si trova solo comprandola non insegna a
       guardarsi intorno */
    droppa: 0.22,
    lascia: ['torcia', 'pozione-piccola'],
  },
  melma: {
    em: '🟢', sprite: 'melma', nome: 'Una melma', unaPosa: true,
    ossa: 6, att: 1, dif: 0, gemme: 3,
    droppa: 0.22,
    lascia: ['pozione-piccola'],
  },

  /* ── la fascia di mezzo, accanto allo scheletro ── */
  fantasma: {
    em: '👻', sprite: 'fantasma', nome: 'Un fantasma', unaPosa: true,
    ossa: 5, att: 2, dif: 0, gemme: 4,
    droppa: 0.22,
    lascia: ['torcia', 'pozione-piccola'],
  },
  vespa: {
    em: '🐝', sprite: 'vespa', nome: 'Un vespone', unaPosa: true,
    /* poca vita e una puntura che fa male quanto quella di un orco:
       è il mostro che conviene togliere di mezzo subito, e il primo
       posto dove quella scelta si presenta */
    ossa: 7, att: 3, dif: 0, gemme: 5,
    droppa: 0.45,
    lascia: [...ARMI_DI(1), 'panciotto', 'pozione-piccola'],
  },
  fungo: {
    em: '🍄', sprite: 'fungo', nome: 'Un fungo che morde', unaPosa: true,
    ossa: 9, att: 2, dif: 0, gemme: 5,
    droppa: 0.45,
    lascia: ['panciotto', 'pozione', 'pozione-piccola'],
  },

  /* ── la fascia tosta, accanto all'orco ── */
  lupo: {
    em: '🐺', sprite: 'lupo', nome: 'Un lupo', unaPosa: true,
    ossa: 13, att: 4, dif: 0, gemme: 7,
    droppa: 0.6,
    lascia: [...ARMI_DI(2), 'corazza', 'saio', 'pozione'],
  },
  granchio: {
    em: '🦀', sprite: 'granchio', nome: 'Un granchio', unaPosa: true,
    /* para come un orco e lascia scudi: è l'unico posto del gioco dove
       la mano debole si riempie senza passare dal banco */
    ossa: 12, att: 3, dif: 1, gemme: 7,
    droppa: 0.6,
    lascia: [...ARMI_DI(2), 'corazza', 'scudo-legno', 'scudo-borchiato', 'pozione'],
  },
  serpente: {
    em: '🐍', sprite: 'serpente', nome: 'Un serpente', unaPosa: true,
    ossa: 10, att: 4, dif: 0, gemme: 7,
    droppa: 0.6,
    lascia: [...ARMI_DI(2), 'saio', 'corazza', 'pozione'],
  },

  /* ── la fascia che prima non c'era ──
     È quella che serviva all'abisso: `BRANCO` finiva sull'orco, quindi
     dal quinto piano in giù cambiavano solo le cifre e non più chi si
     incontrava. Il golem sta un gradino sopra l'orco e un gradino
     sotto un capo: sette risposte a mani nude, che è dentro il tetto,
     e chi ci arriva a mani nude ha sbagliato strada da un pezzo. */
  golem: {
    em: '🪨', sprite: 'golem', nome: 'Un golem', unaPosa: true,
    ossa: 14, att: 5, dif: 1, gemme: 10,
    droppa: 0.7,
    lascia: [...ARMI_DI(2), 'corazza', 'scudo-ferro'],
  },

  /* ── e un secondo capo ──
     Non è potenza in più: è che i capi erano uno solo, e le ultime tre
     discese finivano tutte con lo stesso gigante. Un capo è **la** cosa
     che non si può aggirare (`guardianoDi`), quindi è anche l'unica
     faccia che un bambino è sicuro di vedere in una tappa: averne una
     sola voleva dire che metà campagna finiva uguale. */
  troll: {
    em: '🧌', sprite: 'troll', nome: 'Il troll', unaPosa: true,
    ossa: 15, att: 5, dif: 1, gemme: 11, capo: true,
    droppa: 0.8,
    lascia: [...ARMI_DI(3), 'scudo-crociato', 'amuleto-osso'],
  },
}

export const CHIAVI_MOSTRI = Object.keys(MOSTRI)

/* ── CHI SI INCONTRA PER STRADA, DAL PIÙ TENERO ────────────────────
   `tipoPer()` in `motore/livello.js` pesca qui dentro secondo la
   profondità. Il guardiano invece è dichiarato dalla tappa, perché è
   **la** cosa che non si può aggirare.

   Ogni riga è **una fascia di forza**, e dentro una fascia i mostri si
   equivalgono: si sceglie a caso, e quello che cambia è la faccia.
   Prima era una fila di quattro nomi — `['goblin', 'goblin',
   'scheletro', 'orco']` — e quella fila faceva due mestieri insieme:
   diceva *quanto è forte* questo piano e *chi ci abita*. Il risultato
   è che un piano aveva un mostro, uno solo, e per tutta la sua
   larghezza: le cantine erano goblin, il fondo era orchi. Il goblin
   compariva due volte per pesare di più; adesso non serve, perché le
   fasce basse si incontrano di più semplicemente restando in alto più
   a lungo.

   L'ordine dentro una riga non conta. L'ordine **delle** righe sì: è
   la scala, e va guardata come si guarda la scaletta di una campagna. */
export const BRANCO = [
  ['ratto', 'pipistrello'],
  ['goblin', 'melma', 'fantasma'],
  ['scheletro', 'fungo', 'vespa'],
  ['orco', 'lupo', 'serpente', 'granchio'],
  ['golem'],
]

/* ── quanto in fretta si scende nelle fasce ───────────────────────
   `tipoPer()` faceva `BRANCO.length * 0.6`, e quel `length` era un
   difetto silenzioso: la velocità con cui la profondità porta a mostri
   più tosti finiva **legata a quante fasce ci sono scritte**, cioè
   aggiungerne una in fondo ritarava anche il primo piano delle
   cantine. Misurato quando le fasce sono passate da quattro a cinque:
   la cisterna da 36 a 58 risposte obbligate, e nessuna riga diceva di
   volerlo — il banco l'ha visto, la tabella no.

   Adesso è una manopola sua, e 2.4 è il numero che c'era prima
   (quattro fasce per 0.6). Il tetto lo mette `min(BRANCO.length - 1,
   …)`: una fascia in più si raggiunge solo dove si arrivava già in
   cima, cioè in fondo all'abisso. */
export const PASSO_DEL_BRANCO = 2.4

/* Tutti i nomi del branco, senza fasce: serve ai controlli e a chi
   vuole sapere «chi può capitare», non «quando». */
export const NEL_BRANCO = [...new Set(BRANCO.flat())]

/* Quante risposte costa abbattere un mostro con un dato attacco. È il
   conto vero del gioco (`Corsa.colpiPer`), qui perché possa provarlo
   anche chi guarda solo i dati. */
export const colpiPer = (m, attacco) =>
  Math.max(1, Math.ceil(m.ossa / Math.max(1, attacco - m.dif)))

export function guastiDeiMostri() {
  const g = []
  for (const [k, m] of Object.entries(MOSTRI)) {
    if (!m.sprite) g.push(`${k}: senza sprite`)
    if (m.ossa < 1) g.push(`${k}: senza ossa`)
    if (m.dif >= EROE.att) g.push(`${k}: difesa ${m.dif} contro attacco nudo ${EROE.att}, il colpo si azzera`)
    /* Il tetto è ~8 risposte di fila contro chi lo incontra **quando è
       il suo momento**: i mostri di strada si incontrano a mani nude, un
       capo dopo aver trovato almeno una spada — e infatti il suo bottino
       è quello che paga l'ascia per il capo dopo. Contarli tutti a mani
       nude direbbe che il gigante è fuori misura quando non lo è. */
    const braccio = EROE.att + (m.capo ? 2 : 0)
    const costo = colpiPer(m, braccio)
    if (costo > 8) g.push(`${k}: ${costo} risposte di fila con attacco ${braccio}, troppe`)
    for (const c of m.lascia || []) if (typeof c !== 'string') g.push(`${k}: lascia una cosa senza nome`)
    if (m.droppa == null) g.push(`${k}: non dice quanto spesso lascia qualcosa`)
    else if (m.droppa < 0 || m.droppa > 1) g.push(`${k}: droppa ${m.droppa}, e non è una probabilità`)
  }
  for (const t of NEL_BRANCO) if (!MOSTRI[t]) g.push(`nel branco c'è "${t}", che non esiste`)
  /* ── una fascia deve essere una fascia ──
     Il patto del branco è che dentro una riga i mostri si equivalgano:
     se non è vero, la faccia smette di essere la sola cosa che cambia e
     il piano diventa una lotteria — lo stesso corridoio, e a seconda di
     chi esce sono due risposte o otto. Il metro è il costo a mani nude,
     che è quello che il gioco chiede davvero; due di scarto è la
     differenza fra un goblin e una melma, e ci sta. */
  BRANCO.forEach((fascia, i) => {
    if (!fascia.length) return g.push(`la fascia ${i + 1} del branco è vuota`)
    const costi = fascia.filter(t => MOSTRI[t]).map(t => colpiPer(MOSTRI[t], EROE.att))
    const largo = Math.max(...costi) - Math.min(...costi)
    if (largo > 2)
      g.push(`la fascia ${i + 1} del branco va da ${Math.min(...costi)} a ${Math.max(...costi)} ` +
             'risposte: non è una fascia, è due')
    for (const t of fascia)
      if (MOSTRI[t] && MOSTRI[t].capo) g.push(`"${t}" è un capo e sta anche per strada`)
  })
  /* e le fasce devono salire: due di fila che costano uguale sono la
     stessa fascia scritta due volte, e scendere non si sentirebbe */
  const scala = BRANCO.map(f => Math.max(...f.filter(t => MOSTRI[t])
    .map(t => colpiPer(MOSTRI[t], EROE.att))))
  for (let i = 1; i < scala.length; i++)
    if (scala[i] <= scala[i - 1])
      g.push(`la fascia ${i + 1} del branco non chiede più della ${i}`)
  return g
}
