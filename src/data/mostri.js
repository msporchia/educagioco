/* ═══════════════════════════════════════════════════════════════════
   CHI ATTACCA IL CASTELLO

   Qui c'è chi sono, non come sono disegnati: il disegno delle dieci
   bestie di sempre sta in `grafica/castello.js`, quello delle otto
   nuove in `grafica/mostri/` — due cantieri paralleli, non ancora
   ricuciti insieme — entrambi indicizzati per lo stesso `id`.

   ── si dice a cosa è IMMUNE ──
   Prima ogni mostro **resisteva** a una torre: gli faceva un terzo del
   danno. Era la terza versione della stessa idea (prima c'era la
   debolezza, poi la resistenza) e aveva lo stesso difetto delle altre
   due: un terzo di tanto è ancora tanto. Le bombe di livello alto
   facevano otto volte l'arciere allo stesso prezzo, e un terzo di otto
   è più di uno — quindi la regola del gioco era «costruisci bombe», e
   il preavviso era una cosa da leggere per curiosità.

   Adesso un mostro dichiara le torri che **non lo toccano affatto**
   (`immune`): zero danno, e per il ghiaccio niente gelo. Una o due, e
   ognuno ha il suo profilo. È una regola che cambia la mossa: un'ondata
   di volanti passa sopra le bombe come se non ci fossero, un'ondata di
   corazzati si fa grattare dalle frecce e basta — e nessuna torre, da
   sola, vince una tappa.

   ── quattro famiglie, e si indovinano ──
   Come prima, le ragioni non sono diciotto ragioni diverse: sono poche
   regole, e un bambino che le ha capite indovina l'immunità di un
   mostro che non ha mai visto.

     🪽 **chi vola** passa sopra le bombe — scoppiano per terra. Tutti e
        cinque, ed è la regola che non cambia. La seconda immunità la
        dice la bestia: chi ha le ali (pipistrello, arpia, corvo) passa
        sopra anche il gelo, che si posa sul sentiero; il fantasma il
        gelo lo sente — è nebbia, e la nebbia col freddo si fa brina —
        ma le frecce gli passano attraverso; il drago vola basso, col
        suo peso, e il gelo gli arriva alle ali, ma la magia dei draghi
        è più vecchia di quella delle torri.
     🛡 **chi è corazzato** (pietra, piastre, pelle di sasso) si fa
        rimbalzare addosso le frecce e la magia: lo apre solo lo
        scoppio, e il gelo lo frena come frena tutti.
     🏹 **la freccia** la ferma chi è coperto (cuoio, carapace, uno
        scudo) e la manca chi è troppo svelto o non ha un corpo;
     🔮 **la magia** cerca una mente su cui fare presa: non la trova in
        una gelatina, in una blatta, in una testa vuota.

   ── al massimo due ──
   Nessun mostro è immune a più di due torri (`IMMUNITA_MAX`, e lo conta
   `unita/immunita-castello`). Il fantasma e il drago ne avevano tre, e
   tre su quattro — con una delle quattro, il ghiaccio, che il danno non
   lo fa comunque — voleva dire un mostro che aveva **una risposta
   sola** e in più non si poteva nemmeno frenare: non una scelta, un
   indovinello con una soluzione. Con due il gelo torna a prenderli, e
   la torre che manca si compensa tenendoli più a lungo sotto le altre.

   Il vincolo che rende giusta la cosa lo controllano
   `strumenti/valida-percorsi.mjs` e `unita/castello`: in ogni tappa
   ogni mostro si può ferire con almeno una delle torri che la tappa
   dà, e ogni torre che fa danno ha almeno un mostro immune — così
   nessuna torre vince la tappa da sola.

   ── le abilità ──
   Oltre all'immunità, quattro mostri **fanno una cosa** (`abilita`):
   due si dividono quando cadono e due si rialzano una volta. Le fa il
   motore (`motore/castello/nemico.js`), il preavviso le dice a parole,
   e la taratura le conta da sé perché gioca le ondate col motore vero.
   Non ci sono dappertutto: le tappe le accendono dal Sotterraneo in poi
   (`abilita: true`, come i rami), e le partite libere sempre — è lì
   che il gioco vive di varietà.

   `vola` cambia anche il disegno: chi vola sta staccato da terra, con
   la sua ombra sotto.
   ═══════════════════════════════════════════════════════════════════ */

/* L'immunità si scrive con l'**aspetto** della torre, non con
   l'operazione che la compra: quale conto compri quale torre può
   cambiare — è già successo — e un mostro «immune alle divisioni»
   diventerebbe di colpo immune a un'altra torre senza che nessuno se
   ne accorga. */
import { TORRI } from './ops.js'

export const MOSTRI = {
  /* 🔮 gelatina senza mente e senza forma: l'incantesimo non trova su
     cosa fare presa. E una gelatina tagliata fa due gelatine. */
  slime:      { nome: 'Slime',      immune: ['magica'], abilita: 'dividi' },
  // 🏹 lo scudo di legno rattoppato è tutto quello che ha, e per le frecce basta
  goblin:     { nome: 'Goblin',     immune: ['arciere'] },
  // 🪽 vola: sopra le bombe e sopra il gelo
  pipistrello:{ nome: 'Pipistrello', vola: true, immune: ['bombe', 'ghiaccio'] },
  /* 🪽 vola, e le frecce lo attraversano come lui attraversa i muri: dei
     colpi lo prende solo la magia, che è la stessa roba di cui è fatto.
     Il gelo sì — è nebbia, e col freddo si fa brina */
  fantasma:   { nome: 'Fantasma',   vola: true, immune: ['bombe', 'arciere'] },
  // 🏹 carapace e otto zampe: la freccia rimbalza o ci passa in mezzo
  ragno:      { nome: 'Ragno',      immune: ['arciere'] },
  // 🏹 cuoio e grasso: la freccia si pianta e lui nemmeno se ne accorge
  orco:       { nome: 'Orco',       immune: ['arciere'] },
  /* 🔮❄️ ossa e basta: nella testa vuota l'incantesimo non trova niente,
     e non c'è sangue da gelare. E le ossa si rimettono insieme. */
  scheletro:  { nome: 'Scheletro',  immune: ['magica', 'ghiaccio'], abilita: 'risorge' },
  // 🛡 pietra animata: frecce e incantesimi le rimbalzano addosso
  golem:      { nome: 'Golem',      immune: ['arciere', 'magica'] },
  // 🪽 vola alta e vira
  arpia:      { nome: 'Arpia',      vola: true, immune: ['bombe', 'ghiaccio'] },
  /* 🪽 due ali e mezza tonnellata, e la magia dei draghi è più vecchia di
     quella delle torri: lo abbattono solo le frecce. Ma vola basso, col
     suo peso, e il gelo gli arriva alle ali */
  drago:      { nome: 'Drago',      vola: true, immune: ['bombe', 'magica'] },

  /* le otto bestie nuove, disegnate in `grafica/mostri/` */
  // 🏹❄️ corre a zig-zag, e con quella pelliccia il freddo non lo ferma
  lupo:        { nome: 'Lupo',        immune: ['arciere', 'ghiaccio'] },
  // 🪽 vola stretto fra i canneti
  corvo:       { nome: 'Corvo',       vola: true, immune: ['bombe', 'ghiaccio'] },
  /* 🏹💣 un groviglio di spine: la freccia ci si perde dentro, e lo
     scoppio lo sfoltisce e basta. Lo prende la magia. */
  rovo:        { nome: 'Rovo',        immune: ['arciere', 'bombe'] },
  /* 💣 tutto molle, senza un osso: l'urto se lo mangia. E tagliato in
     due fa due vermi. */
  verme:       { nome: 'Verme',       immune: ['bombe'], abilita: 'dividi' },
  // 💣🔮 sopravvive a tutto — anche a una bomba — e non ha una mente: solo le frecce
  blatta:      { nome: 'Blatta',      immune: ['bombe', 'magica'] },
  /* 🛡 pelle di sasso, come il golem. E un troll ferito si rialza: è la
     cosa che dei troll sanno tutti. */
  troll:       { nome: 'Troll',       immune: ['arciere', 'magica'], abilita: 'risorge' },
  // 🛡 armatura di piastre: le frecce le sente come sassolini, la magia le scivola addosso
  corazziere:  { nome: 'Corazziere',  immune: ['arciere', 'magica'] },
  // 💣 l'unico che sa cos'è un'artiglieria: al fischio si butta dietro il pavese
  balestriere: { nome: 'Balestriere', immune: ['bombe'] },
}

export const ELENCO = Object.keys(MOSTRI)

/* quante torri, al massimo, possono non toccare un mostro (vedi «al
   massimo due» in testa) */
export const IMMUNITA_MAX = 2

/* ── dall'aspetto alla torre ──
   L'unico punto in cui i due mondi si toccano: «bombe» diventa la
   torre che in questo momento si compra con la divisione. */
const torreDi = aspetto => Object.keys(TORRI).find(k => TORRI[k].aspetto === aspetto) || null

/* le torri (chiavi di `TORRI`) che non toccano questo mostro */
export const immuniDi = id => (MOSTRI[id]?.immune || []).map(torreDi).filter(Boolean)
/* se la torre `k` lo ferisce — il ghiaccio non ferisce mai nessuno, e si
   chiede a parte con `gelabile` */
export const feritoDa = (id, k) => !!TORRI[k]?.danno && !immuniDi(id).includes(k)
export const gelabile = id => !(MOSTRI[id]?.immune || []).includes('ghiaccio')
/* un'etichetta stabile di «chi non lo tocca»: due mostri con la stessa
   firma chiudono le stesse torri, e due ondate di fila con la stessa
   firma sono una ripetizione */
export const firmaImmunita = id => [...(MOSTRI[id]?.immune || [])].sort().join('+') || '—'

/* ── le regole di una fila di mostri ──
   Quello che una tappa (o una partita libera) deve rispettare perché le
   immunità siano una scelta e non una trappola. Torna l'elenco dei
   guasti, vuoto se è tutto a posto; lo chiamano il validatore
   (`strumenti/valida-percorsi.mjs`) e `unita/castello`, così la regola
   è scritta una volta sola.

     · ogni mostro si può **ferire** con una torre della tappa;
     · dove le torri che feriscono sono più d'una, **ognuna ha un
       mostro immune**: nessuna vince da sola;
     · la **prima ondata** la ferisce l'arciere, se la tappa lo dà —
       è la torre che si compra per prima;
     · due ondate di fila non hanno **le stesse immunità** (la fila
       gira in tondo, quindi anche l'ultima con la prima). */
export function guastiDelleImmunita({ mostri = [], torri = [] }) {
  const g = []
  for (const m of mostri) if (!MOSTRI[m]) g.push(`mostro sconosciuto: ${m}`)
  if (g.length) return g
  const feriscono = torri.filter(k => TORRI[k]?.danno)
  for (const m of mostri)
    if (!feriscono.some(k => feritoDa(m, k)))
      g.push(`${m} è immune a tutte le torri che la tappa dà (${torri.join(' ')}): quell'ondata non si ferma`)
  if (feriscono.length > 1)
    for (const k of feriscono)
      if (mostri.every(m => feritoDa(m, k)))
        g.push(`nessun mostro è immune a «${TORRI[k].nome}»: da sola vince la tappa`)
  if (torri.includes('add') && mostri.length && !feritoDa(mostri[0], 'add'))
    g.push(`la prima ondata (${mostri[0]}) è immune all'arciere, che è la prima torre che si compra`)
  if (mostri.length > 1)
    for (let i = 0; i < mostri.length; i++) {
      const a = mostri[i], b = mostri[(i + 1) % mostri.length]
      if (firmaImmunita(a) === firmaImmunita(b))
        g.push(`${a} e ${b} arrivano di fila con le stesse immunità (${firmaImmunita(a)})`)
    }
  return g
}

/* ═══════════ le abilità ═══════════

   Due, e sono i numeri che il motore applica — `motore/` non ne scrive
   nessuno.

   **si divide** (`dividi`) — quando cade si spacca in `quanti` pezzi
   più piccoli, ognuno con una parte della sua vita. La vita in più
   che l'ondata porta è `quanti × vita`: con due pezzi da un terzo fa
   due terzi in più. I pezzi non si dividono ancora — un'ondata che
   raddoppia a ogni morte non finisce — e **l'energia non cresce**:
   il mostro intero ne dava due, i due pezzi ne danno uno a testa.
   Se no un'ondata di slime pagherebbe il doppio delle altre, e la
   promessa dei `calcoli` salterebbe senza che nessuno se ne accorga.

   **risorge** (`risorge`) — la prima volta che cade resta a terra
   `dopo` secondi, e si rialza con `vita` della sua vita. Mentre è a
   terra non cammina e non si può colpire: si vede che non è finita, e
   le torri non sprecano colpi su di lui. Paga l'energia una volta
   sola, quando cade davvero.

   Tutte e due allungano la vita **vera** di un'ondata, ed è il numero
   che `vitaEffettiva` dice al modello e al preavviso. La taratura non
   ne ha bisogno: gioca le ondate col motore, e le abilità ci sono.

   **E arrivano in meno** (`folla`): quattro su dieci per chi si divide,
   sette su dieci per chi si rialza. Perché chi si divide fa tre bersagli di uno
   e chi si rialza due, e un'ondata piena di bersagli in più non la
   ferma la vita ma la cadenza: con i vermi a ondata intera l'arciere
   non ce la faceva nemmeno con cinque punti di vita a testa, e la
   taratura non trovava una vita abbastanza bassa. In meno, e ognuno
   paga di più: l'energia dell'ondata è quella di sempre. */
export const ABILITA = {
  dividi:  { emoji: '✂️', nome: 'si divide', che: 'quando cade, si divide in due più piccoli',
             quanti: 2, vita: 1 / 3, taglia: 0.72, folla: 0.4 },
  risorge: { emoji: '💫', nome: 'si rialza', che: 'la prima volta che cade, si rialza',
             vita: 0.5, dopo: 1.4, folla: 0.7 },
}
export const abilitaDi = id => (MOSTRI[id]?.abilita ? ABILITA[MOSTRI[id].abilita] : null)

/* quanta vita porta davvero un mostro, contando quello che fa quando
   cade: 1 per chi non fa niente */
export function vitaEffettiva(id) {
  const a = MOSTRI[id]?.abilita
  if (a === 'dividi') return 1 + ABILITA.dividi.quanti * ABILITA.dividi.vita
  if (a === 'risorge') return 1 + ABILITA.risorge.vita
  return 1
}

/* ═══════════ il capo ═══════════

   Ogni tanto, al posto di un'ondata di tanti mostri piccoli, ne arriva
   **uno solo gigante**: lo stesso mostro dell'ondata — con le sue
   immunità e la sua abilità — in grande.

     vita     quella dell'ondata intera che sostituisce, e un decimo in
              più: `vita × nemiciDiOnda`. Non di più, perché contro un
              bersaglio solo l'area non conta niente — le bombe e l'onda
              magica, che su un'ondata prendono tre mostri per colpo, qui
              ne prendono uno — e la stessa vita in un pezzo solo è già
              più dura di quella spalmata
     passo    metà della velocità: si vede arrivare, e ci si fa il conto
     taglia   il doppio e mezzo, disegnato — nessuno sprite nuovo
     cuori    se arriva al castello se ne porta via quattro su cinque:
              un'ondata intera che passa ne toglie ben di più, e un capo
              che ne toglie uno solo sarebbe l'ondata più comoda da
              lasciar passare. Quattro e non tre è misurato: con tre, chi
              teneva in tasca un quarto dell'energia finiva la Radice
              lasciando passare il capo, cioè l'ultima ondata della
              campagna non chiedeva niente a nessuno
     energia  quella dell'ondata intera: la promessa dei `calcoli` conta
              i nemici fermati, e un capo è un'ondata

   **Dove arriva.** Nella partita infinita ogni `ogni` ondate, a ritmo
   fisso — la decima, la ventesima… — e il preavviso lo annuncia come
   annuncia tutto il resto. Nella campagna solo come ultima ondata
   delle tappe che lo dichiarano (`capo: true`): l'ultima di ogni
   campagna, che è già il momento in cui il campo si vede per quello
   che è. */
export const CAPO = { vita: 1.1, passo: 0.5, taglia: 2.5, cuori: 4, ogni: 10 }

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
