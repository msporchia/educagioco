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
   (`immune`): zero danno, e per il ghiaccio niente gelo. È una regola
   che cambia la mossa: un'ondata di volanti passa sopra le bombe come
   se non ci fossero, un'ondata di corazzati si fa grattare dalle
   frecce e basta — e nessuna torre, da sola, vince una tappa.

   ── ma solo alcuni: di base tutte le torri fanno effetto ──
   Goblin, orco, ragno, lupo, balestriere, slime e verme sono **comuni**:
   li ferisce tutto (`comune`). Per un po' erano immuni anche loro, a
   una torre ciascuno, e il difetto era doppio: non c'era più niente di
   normale da cui distinguere l'eccezione, e ogni tappa chiedeva la
   torre giusta fin dalla prima ondata, quando le risorse non bastano
   per essere variegati. Adesso le tappe si aprono coi comuni
   (`APERTURA_COPRE` in `data/castello.js`) e gli immuni arrivano dopo.

   ── quattro famiglie di immuni, e si indovinano ──
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
     💀 **chi è fatto d'ossa** (lo scheletro): nella testa vuota la
        magia non trova niente, e non c'è sangue da gelare;
     🌿 **il rovo e la blatta**: nel groviglio di spine la freccia si
        perde e lo scoppio sfoltisce e basta; la blatta sopravvive a
        tutto, anche a una bomba, e non ha una mente per la magia.

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
   dà, e dal Sotterraneo in poi (e in tutte le libere) ogni torre che fa
   danno ha almeno un mostro immune — così nessuna torre vince la tappa
   da sola. Il Bosco no: lì si impara cosa fa una torre
   (`IMPARA_LE_TORRI`).

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
  /* ── i comuni, e gli speciali ──
     **Di base tutte le torri fanno effetto** (l'ha detto l'utente, ed è
     la regola da cui si parte): goblin, orco, ragno, lupo, balestriere,
     slime e verme non sono immuni a niente. Sono i mostri con cui si
     apre ogni tappa (`APERTURA_COPRE` in `data/castello.js`): all'inizio
     le risorse non bastano per essere variegati, e con due torri in
     campo tutto quello che arriva si deve poter fermare. Slime e verme
     restano speciali per l'abilità, non per l'immunità.
     Le immunità ce l'hanno **solo alcuni**, e sono quelli che si
     riconoscono a colpo d'occhio: chi vola, chi è di pietra o di
     piastre, chi è fatto d'ossa, il groviglio del rovo e la blatta.
     Prima ce l'avevano tutti, e un'ondata di goblin chiedeva una torre
     precisa quanto un'ondata di golem: la regola c'era, ma non c'era
     più niente di normale da cui distinguerla. */
  /* ✂️ una gelatina: nessuna immunità, e tagliata fa due gelatine. È
     speciale per quello che fa quando cade, non per quello che regge */
  slime:      { nome: 'Slime',      immune: [], abilita: 'dividi' },
  // un goblin: lo ferisce tutto
  goblin:     { nome: 'Goblin',     immune: [] },
  // 🪽 vola: sopra le bombe e sopra il gelo
  pipistrello:{ nome: 'Pipistrello', vola: true, immune: ['bombe', 'ghiaccio'] },
  /* 🪽 vola, e le frecce lo attraversano come lui attraversa i muri: dei
     colpi lo prende solo la magia, che è la stessa roba di cui è fatto.
     Il gelo sì — è nebbia, e col freddo si fa brina */
  fantasma:   { nome: 'Fantasma',   vola: true, immune: ['bombe', 'arciere'] },
  ragno:      { nome: 'Ragno',      immune: [] },
  orco:       { nome: 'Orco',       immune: [] },
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
  lupo:        { nome: 'Lupo',        immune: [] },
  // 🪽 vola stretto fra i canneti
  corvo:       { nome: 'Corvo',       vola: true, immune: ['bombe', 'ghiaccio'] },
  /* 🏹💣 un groviglio di spine: la freccia ci si perde dentro, e lo
     scoppio lo sfoltisce e basta. Lo prende la magia. */
  rovo:        { nome: 'Rovo',        immune: ['arciere', 'bombe'] },
  // ✂️ come lo slime: nessuna immunità, e tagliato in due fa due vermi
  verme:       { nome: 'Verme',       immune: [], abilita: 'dividi' },
  // 💣🔮 sopravvive a tutto — anche a una bomba — e non ha una mente: solo le frecce
  blatta:      { nome: 'Blatta',      immune: ['bombe', 'magica'] },
  /* 🛡 pelle di sasso, come il golem. E un troll ferito si rialza: è la
     cosa che dei troll sanno tutti. */
  troll:       { nome: 'Troll',       immune: ['arciere', 'magica'], abilita: 'risorge' },
  // 🛡 armatura di piastre: le frecce le sente come sassolini, la magia le scivola addosso
  corazziere:  { nome: 'Corazziere',  immune: ['arciere', 'magica'] },
  balestriere: { nome: 'Balestriere', immune: [] },
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
/* un mostro che tutte le torri toccano (vedi «i comuni» in testa a MOSTRI) */
export const comune = id => !(MOSTRI[id]?.immune || []).length

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
       gira in tondo, quindi anche l'ultima con la prima) — tranne due
       comuni, che non ne hanno nessuna.
   La seconda non vale nel Bosco (`IMPARA_LE_TORRI`). */
/* ── il Bosco è dove si imparano le torri ──
   Nelle sue tappe la regola «ogni torre ha un mostro immune» non vale:
   lì si impara cosa fa una torre, e una tappa di goblin e slime che
   tutte le torri feriscono è quello che serve. Dal Sotterraneo in poi —
   e nelle quattro partite libere, anche quella del bosco — la regola
   torna. Una libera si riconosce dai capi a ritmo fisso (`capi`). */
export const IMPARA_LE_TORRI = ['bosco']
const esente = t => IMPARA_LE_TORRI.includes(t.campagna) && !t.capi

export function guastiDelleImmunita(tappa) {
  const { mostri = [], torri = [] } = tappa
  const g = []
  for (const m of mostri) if (!MOSTRI[m]) g.push(`mostro sconosciuto: ${m}`)
  if (g.length) return g
  const feriscono = torri.filter(k => TORRI[k]?.danno)
  for (const m of mostri)
    if (!feriscono.some(k => feritoDa(m, k)))
      g.push(`${m} è immune a tutte le torri che la tappa dà (${torri.join(' ')}): quell'ondata non si ferma`)
  if (feriscono.length > 1 && !esente(tappa))
    for (const k of feriscono)
      if (mostri.every(m => feritoDa(m, k)))
        g.push(`nessun mostro è immune a «${TORRI[k].nome}»: da sola vince la tappa`)
  if (torri.includes('add') && mostri.length && !feritoDa(mostri[0], 'add'))
    g.push(`la prima ondata (${mostri[0]}) è immune all'arciere, che è la prima torre che si compra`)
  if (mostri.length > 1)
    for (let i = 0; i < mostri.length; i++) {
      const a = mostri[i], b = mostri[(i + 1) % mostri.length]
      /* due comuni di fila vanno bene: non c'è niente da ripensare */
      if (comune(a) && comune(b)) continue
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

/* ═══════════ le ondate miste ═══════════

   Un'ondata di un tipo solo è una domanda con una risposta: «golem →
   bombe». Si impara così, ed è giusto che si cominci così. Ma a forza
   di rispondere la domanda smette di esserlo, e il campo si riduce a
   cambiare torre a ogni preavviso. L'ondata mista è la domanda dopo:
   **due tipi insieme, mescolati nella stessa fila, con immunità che si
   incastrano** — un golem (frecce e magia non lo toccano) insieme a un
   pipistrello (bombe e gelo no). Nessuna torre li ferisce tutti e due,
   quindi una torre sola non basta: ci vuole un campo con dentro un po'
   di tutto, ed è la lezione che le ondate di un tipo solo non danno.

   ── la regola della coppia (`tieneMista`) ──
     · **nessuna torre della tappa li ferisce tutti e due** — se no non
       è mista, è un'ondata normale con due vestiti;
     · almeno **due** torri della tappa feriscono qualcuno dell'ondata,
       e ognuno dei due lo ferisce almeno una torre: una mista che una
       torre sola può toccare è un'ondata che passa a metà per forza.
   Le coppie non si scrivono a mano: si cercano fra i mostri che la
   tappa manda già (`coppieDi`), così un mostro nuovo in una tappa porta
   con sé le sue coppie e nessuno deve ricordarsi di aggiornarle. Le
   controllano il validatore e `unita/immunita-castello`.

   ── dove arrivano (`ondataMista`) ──
     · **nella partita infinita** una ondata su cinque, dalla decima in
       poi: la 13ª, la 18ª, la 23ª… (`MISTA`). A ritmo fisso e deciso dal
       numero dell'ondata, come il capo e il ritmo, così il preavviso la
       annuncia e la taratura la rigioca uguale. Mai sull'ondata del
       capo, che è già un'altra eccezione;
     · **nella campagna** solo nelle ultime due campagne (Mura e
       Palude), e una sola, in fondo alla tappa: l'ultima ondata, o
       quella prima (`mista` della tappa, la sceglie `mistaDelPiano` in
       `data/castello.js` guardando le torri del piano). Mai l'ondata
       del capo, e mai dentro le prime otto. Prima si impara un tipo alla volta; la
       mista arriva quando il bambino ha già visto tutti i mostri della
       tappa da soli, e chiude la tappa chiedendoli insieme.

   ── quanti, e quanto valgono ──
   Metà e metà, alternati nella fila; chi si divide o si rialza arriva
   in meno secondo la sua `folla`, come in un'ondata sua. L'energia e il
   numero dell'ondata sono quelli di un'ondata normale, e la vita è una
   sola per tutti e due: la taratura la cerca **per ondata** (le miste
   fanno gruppo a sé, come i capi), perché un golem e un pipistrello
   insieme non stanno sulla scala di nessuno dei due da soli. */
export const MISTA = { da: 10, ogni: 5, resto: 3, campagne: ['mura', 'palude'] }

/* se la coppia `a`, `b` fa un'ondata mista con le torri che feriscono
   di questa tappa */
function tieneMista(a, b, sparano) {
  const ferisce = k => feritoDa(a, k) || feritoDa(b, k)
  return a !== b &&
    sparano.every(k => !(feritoDa(a, k) && feritoDa(b, k))) &&
    sparano.filter(ferisce).length >= 2 &&
    sparano.some(k => feritoDa(a, k)) && sparano.some(k => feritoDa(b, k))
}

/* tutte le coppie buone fra i mostri della tappa, nell'ordine della fila */
export function coppieDi({ mostri = [], torri = [] }) {
  const sparano = torri.filter(k => TORRI[k]?.danno)
  const ms = [...new Set(mostri)].filter(m => MOSTRI[m])
  const out = []
  for (let i = 0; i < ms.length; i++)
    for (let j = i + 1; j < ms.length; j++)
      if (tieneMista(ms[i], ms[j], sparano)) out.push([ms[i], ms[j]])
  return out
}

/* se l'ondata `o` di questa tappa è una mista (al netto delle coppie:
   quella la sceglie `coppiaDellOnda`). Una partita infinita si
   riconosce dai capi a ritmo fisso (`capi`), anche quando la taratura
   la gioca a venti ondate. */
export function ondataMista(tappa, o) {
  if (tappa.capi) return o >= MISTA.da && o % MISTA.ogni === MISTA.resto && o % tappa.capi !== 0
  if (!tappa.miste || !Number.isFinite(tappa.ondate)) return false
  /* la campagna dice quale (`mista`, vedi `mistaDelPiano` in
     `data/castello.js`); di suo è l'ultima prima del capo */
  return o === (tappa.mista ?? (tappa.capo ? tappa.ondate - 1 : tappa.ondate))
}

/* I due mostri dell'ondata `o`, o `null` se è un'ondata di un tipo
   solo. Il primo è quello che la fila avrebbe mandato comunque, se sta
   in una coppia buona: la mista **allarga** l'ondata che il preavviso
   racconterebbe, non la cambia. Se no, una coppia a giro. */
export function coppiaDellOnda(tappa, o) {
  if (!ondataMista(tappa, o)) return null
  /* una tappa della campagna porta le sue (`coppie`, vedi `coppieDelPiano`
     in `data/castello.js`): quelle che le torri del suo piano feriscono */
  const coppie = tappa.coppie || coppieDi(tappa)
  if (!coppie.length) return null
  const primo = mostroDiOnda(tappa.mostri || [], o)
  const c = coppie.find(x => x.includes(primo)) ||
            coppie[Math.floor(o / MISTA.ogni) % coppie.length]
  return c[1] === primo ? [c[1], c[0]] : c
}

/* Le regole delle miste di una tappa, come `guastiDelleImmunita`:
   l'elenco dei guasti, vuoto se è tutto a posto. `fino` è fin dove
   guardare in una partita infinita (le ondate tarate). */
export function guastiDelleMiste(tappa, fino = tappa.ondate) {
  const g = []
  const sparano = (tappa.torri || []).filter(k => TORRI[k]?.danno)
  const n = Number.isFinite(fino) ? fino : 20
  let quante = 0
  for (let o = 1; o <= n; o++) {
    if (!ondataMista(tappa, o)) continue
    quante++
    const c = coppiaDellOnda(tappa, o)
    if (!c) { g.push(`l'ondata ${o} dovrebbe essere mista, e fra i mostri della tappa non c'è una coppia`); continue }
    if (!tieneMista(c[0], c[1], sparano))
      g.push(`l'ondata ${o} mescola ${c[0]} e ${c[1]}, che non fanno una mista con ${sparano.join(' ')}`)
    if ((tappa.capi && o % tappa.capi === 0) || (tappa.capo && o === tappa.ondate))
      g.push(`l'ondata ${o} è del capo, e non può essere anche mista`)
  }
  if (tappa.miste && !quante) g.push('la tappa dichiara le miste, e nessuna ondata lo è')
  return g
}

/* Le torri che non toccano **nessuno** di un'ondata: per un'ondata di un
   tipo solo sono le sue immunità, per una mista quelle che hanno tutti e
   due — che per la regola della coppia non sono mai una torre che fa
   danno (al massimo il ghiaccio). È la domanda che fa la carta di una
   torre («questa, per chi arriva, serve?»), e chi la fa riceve
   un'ondata, non un mostro. */
export const immuniDellOnda = b =>
  (b ? (b.con ? b.immune.filter(k => b.con.immune.includes(k)) : b.immune) : [])
