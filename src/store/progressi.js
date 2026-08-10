/* ═══════════════════════════════════════════════════════════════════
   PROGRESSI — la base comune della gamification.

   Tre domande, tre risposte, tutte ricavate dal solo profilo:

   1. QUANTO HO GIOCATO?  → esperienza e livello, per gioco e in totale.
      Cresce e basta: è il premio per esserci stato.

   2. QUANTO SO ADESSO?   → `abilita()`, la padronanza di una materia
      letta dalla forza EFFICACE del motore di apprendimento. Questa può
      scendere: se non si ripassa per un mese, si sa di meno. È il numero
      da cui i giochi devono pescare la difficoltà, con `difficolta()`,
      invece di ripartire da zero a ogni partita.

   3. COSA HO OTTENUTO?   → i traguardi di `data/traguardi.js`.

   Questo file non importa il profilo: riceve l'oggetto profilo e basta.
   Così gira anche fuori dal browser (`node progressi-test.mjs`) e non
   crea cicli di import con store/profile.js, che invece importa lui.
   ═══════════════════════════════════════════════════════════════════ */
import { strength, isMastered, SRS, MAX_S } from './srs.js'
import { TRAGUARDI, AREE, MEDAGLIE, PREMI, GENERALE_ATTIVO } from '../data/traguardi.js'
import { XP_GIOCHI, MATERIE_GIOCHI, giochiNuoviProvati } from '../giochi/albo.js'
import { CAMPAGNA, calcoliTabellina } from '../data/tabelline.js'
import { TOTALE_ELEMENTI } from '../data/calcolo.js'
import { concettiSaldi as concettiSaldiDi } from './calcolo.js'
import { CAMPAGNA as TAPPE_EN } from '../data/campagna-inglese.js'
import { CAMPAGNA as TAPPE_ES } from '../data/campagna-spagnolo.js'
import { TAPPE as TAPPE_POZ } from '../data/pozioni.js'
import { WORDS } from '../data/words.js'
import { VERBI } from '../data/verbi.js'
import { FRASI } from '../data/frasi.js'
import { PAROLE_ES } from '../data/parole-es.js'
import { VERBI_ES } from '../data/verbi-es.js'
import { FRASI_ES } from '../data/frasi-es.js'
import { PETS, SOGLIE, sazietaDi, contento } from '../data/pets.js'
import { SERIE } from '../data/capsule.js'
import { SCALE } from '../data/pozioni.js'
import { FASCE } from '../data/bancarella.js'

export { AREE, MEDAGLIE, PREMI, TRAGUARDI }

const GIORNO = 86400000

/* ═══════════ le materie che si possono davvero sapere ═══════════
   `totale` è quanti elementi esistono in tutto: serve per dire "37 su
   188" e per calcolare la padronanza. Le tabelline sono 55 e non 100
   perché 6×8 e 8×6 sono lo stesso fatto e il motore usa una chiave sola. */
const MATERIE_TUTTE = [
  { id: 'mate',    prefisso: 'math:',  nome: 'Tabelline',    emoji: '✖️', totale: 55 },
  /* nel calcolo a mente l'elemento non è sempre un calcolo: dove i casi
     sono infiniti è la strategia (vedi data/calcolo.js), e il totale li
     conta insieme — i fatti uno per uno, i concetti uno ciascuno */
  { id: 'mente',   prefisso: 'calc:',  nome: 'Calcolo a mente', emoji: '🧠',
    totale: TOTALE_ELEMENTI },
  { id: 'inglese', prefisso: 'en:',    nome: 'Parole inglesi', emoji: '🔤', totale: WORDS.length },
  { id: 'verbi',   prefisso: 'verbo:', nome: 'Verbi inglesi', emoji: '🎧', totale: VERBI.length },
  { id: 'frasi',   prefisso: 'frase:', nome: 'Frasi inglesi', emoji: '💬', totale: FRASI.length },
  { id: 'parole-es', prefisso: 'es:',       nome: 'Parole spagnole', emoji: '🔤', totale: PAROLE_ES.length },
  { id: 'verbi-es',  prefisso: 'verbo-es:', nome: 'Verbi spagnoli', emoji: '🎧', totale: VERBI_ES.length },
  { id: 'frasi-es',  prefisso: 'frase-es:', nome: 'Frasi spagnole', emoji: '💬', totale: FRASI_ES.length },
  { id: 'torri',   prefisso: 'op:',    nome: 'Operazioni in colonna', emoji: '➗', totale: 4 },
  /* le nove conversioni fra unità grandi e piccole del laboratorio */
  { id: 'misure',  prefisso: 'pozioni:',    nome: 'Misure e conversioni', emoji: '⚗️', totale: SCALE.length },
  /* nel resto l'elemento non è la cifra ma il pezzo più piccolo che serve
     per comporla: cinque fasce, dagli euro tondi ai centesimi */
  { id: 'soldi',   prefisso: 'bancarella:', nome: 'Euro e resto', emoji: '🪙', totale: FASCE.length },
  /* dal generale non si impara un vocabolario ma cinque modi di dare un
     ordine: sequenza, condizione, ciclo, evento, attesa. Sono pochi e
     fissi come le quattro operazioni del castello, quindi il totale sta
     scritto qui: il catalogo vero arriverà in data/generale.js e allora
     questo 5 diventerà la lunghezza di quell'elenco. */
  { id: 'ordini',  prefisso: 'gen:',   nome: 'Ordini e programmi', emoji: '🎖️', totale: 5 },
]
/* stesso interruttore dei traguardi (data/traguardi.js): finché il
   generale non è in home, la sua riga non compare fra "cosa so fare" —
   una barra a zero di un gioco che non si può aprire è un buco */
/* i giochi nuovi che insegnano elementi con l'SRS aggiungono la loro riga
   dal manifesto (`albo.materia`); chi non insegna niente di misurabile —
   il Codice Segreto, per dire, dove non c'è un vocabolario ma un modo di
   ragionare — semplicemente non la dichiara e non compare qui */
export const MATERIE = [...MATERIE_TUTTE.filter(m => m.id !== 'ordini' || GENERALE_ATTIVO),
                        ...MATERIE_GIOCHI]
export const materiaDi = id => MATERIE.find(m => m.id === id) || null

/* ═══════════ 1. ESPERIENZA E LIVELLO ═══════════
   Un livello costa 50 punti più del precedente: il 2 arriva presto, il
   10 si vede da lontano. Nessun tetto, ma la curva si allarga da sola. */
export const PASSO_XP = 50
export const xpPerLivello = n => PASSO_XP * n * (n + 1) / 2   // xp totale per arrivare al livello n+1

export function livelloDa(xp) {
  let n = 1
  while (xp >= xpPerLivello(n)) n++
  const base = n > 1 ? xpPerLivello(n - 1) : 0
  const prossimo = xpPerLivello(n)
  return { n, xp, da: base, a: prossimo, quota: (xp - base) / (prossimo - base) }
}

export const TITOLI = ['Novellino', 'Apprendista', 'In gamba', 'Bravo', 'Esperto',
                       'Campione', 'Maestro', 'Leggenda']
export const titoloDi = n => TITOLI[Math.min(TITOLI.length - 1, Math.max(0, n - 1))]

/* Quanta esperienza ha fruttato ogni gioco. Le voci sono pesate perché
   un'ondata di nemici non vale una risposta a una tabellina: le cose che
   costano tempo e testa valgono di più. */
export const XP_AREA = {
  /* i pianeti e le stazioni sono lo stesso gioco: una voce sola, come per
     parole/verbi/frasi. Un concetto vale più di un fatto — dietro ce ne
     stanno infiniti — ma la moneta resta quella degli altri giochi. */
  mate:      m => m.tot('math') + m.imparati('math:') * 8 + Math.floor(m.best('math') / 10)
                  + m.tappeMate() * 40
                  + m.tot('mente') + m.concettiSaldi() * 10 + m.tappeMente() * 40,
  /* parole, verbi e frasi sono lo stesso gioco: una voce sola, altrimenti
     l'albo mostrerebbe tre livelli per una carta sola in home */
  inglese:   m => m.tot('en') + m.imparati('en:') * 8
                  + m.tot('verbi') + m.imparati('verbo:') * 8
                  + m.tot('frasi') + m.imparati('frase:') * 10
                  + m.tappeEn() * 40,
  /* lo spagnolo pesa come l'inglese: è lo stesso gioco con dentro la
     lingua di casa, e non c'è ragione perché una valga meno dell'altra */
  spagnolo:  m => m.tot('es') + m.imparati('es:') * 8
                  + m.tot('verbiEs') + m.imparati('verbo-es:') * 8
                  + m.tot('frasiEs') + m.imparati('frase-es:') * 10
                  + m.tappeEs() * 40,
  torri:     m => m.tot('torri') * 3 + m.tot('ondate') * 2 + m.tappe() * 40,
  /* nel laboratorio l'unità di lavoro è l'ingrediente, non la pozione: è lì
     che si fa una conversione, e vale come una risposta altrove. La pozione
     finita è il di più per averle azzeccate tutte di fila. */
  pozioni:   m => m.tot('misure') + m.tot('pozioni') * 3 + m.tot('pozioniPerfette') * 2
                  + m.imparati('pozioni:') * 10 + m.tappePoz() * 40,
  /* alla bancarella l'unità è il cliente: raccogliere la spesa e comporre il
     resto è un giro solo, e costa più di una risposta a quiz */
  bancarella: m => m.tot('clienti') * 3 + m.tot('restiPerfetti') * 2
                  + m.imparati('bancarella:') * 10,
  /* dal generale l'unità di lavoro è l'ordine firmato, che costa più di
     una risposta a quiz ma si scrive a mazzi: vale un quarto l'uno. Il
     resto sono le cose che si portano a casa una volta sola — il livello,
     la stella, il tipo di ordine capito. */
  generale: m => Math.floor(m.tot('ordini') / 4) + m.stelleGen() * 5
                 + m.imparati('gen:') * 10 + m.tappeGen() * 40,
  animali:   m => m.tot('pasti') * 3 + m.animali() * 30,
  cameretta: m => m.oggetti() * 12,
  /* i giochi nuovi (`src/giochi/`) portano la loro formula nel manifesto:
     qui non c'è una riga per ognuno, e aggiungerne uno non si fa più qui */
  ...XP_GIOCHI,
}

/* ATTENZIONE prima di aggiungere una voce qui sopra: il livello totale è
   il MOLTIPLICATORE DELLE MONETE (vedi store/profile.js). Dare esperienza
   anche alle cure, alle capsule o agli accessori vorrebbe dire aprire il
   rubinetto proprio mentre si scava lo scarico: più si spende, più si
   guadagna, e l'economia torna a sgonfiarsi. Le cose che si comprano
   danno traguardi, non esperienza. */

/* ═══════════ 2. QUANTO SO ADESSO ═══════════ */
export const GRADI = [
  { s: '🌱', nome: 'Si comincia' },
  { s: '🐣', nome: 'Ci siamo' },
  { s: '💪', nome: 'Ci prendo la mano' },
  { s: '🌟', nome: 'Vado forte' },
  { s: '👑', nome: 'Lo so davvero' },
]

/* Padronanza 0..1 di una materia: quanto della forza possibile è in
   cassa, adesso. Il massimo utile è `masterS` e non la forza massima:
   arrivati lì l'elemento è imparato, chiedere di più sarebbe irreale. */
export function abilita(p, materia, now = Date.now()) {
  const def = typeof materia === 'string' ? materiaDi(materia) : materia
  if (!def) return null
  const items = p.items || {}
  let visti = 0, imparati = 0, somma = 0
  for (const [k, it] of Object.entries(items)) {
    if (!k.startsWith(def.prefisso)) continue
    visti++
    const s = strength(it, now)
    somma += Math.min(SRS.masterS, s)
    if (isMastered(it, now)) imparati++
  }
  const padronanza = Math.max(0, Math.min(1, somma / (def.totale * SRS.masterS)))
  return {
    ...def, visti, imparati, padronanza,
    /* la forza media di quello che si è già incontrato: dice se il poco
       che si sa è saldo, mentre la padronanza dice quanto se ne è fatto */
    forzaMedia: visti ? somma / visti : 0,
    grado: gradoDi(padronanza),
    difficolta: difficoltaDa(padronanza),
  }
}

const gradoDi = q => GRADI[Math.min(GRADI.length - 1, Math.floor(q * GRADI.length + 1e-9))]

/* 1..5, il numero che un gioco può usare per scegliere quanto strizzare.
   Sta qui e non nei giochi così tutti misurano la stessa cosa allo stesso
   modo; ogni gioco poi ci fa quello che deve (taglia dei numeri, quante
   risposte fra cui scegliere, velocità). */
const difficoltaDa = q => 1 + Math.min(4, Math.floor(q * 5))
export const difficolta = (p, materia, now = Date.now()) => {
  const a = abilita(p, materia, now)
  return a ? a.difficolta : 1
}

/* ═══════════ i giorni di fila ═══════════
   Il giorno è quello del calendario locale: chi gioca alle 23 e poi alle
   00:30 ha giocato due giorni, ed è giusto così — è quello che vede lui. */
export const giornoDi = (now = Date.now()) => {
  const d = new Date(now)
  const p = n => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

/* Segna che oggi si è giocato. Torna true se è un giorno nuovo. */
export function segnaGiorno(p, now = Date.now()) {
  const g = p.giorni
  const oggi = giornoDi(now)
  if (g.ultimo === oggi) return false
  const ieri = giornoDi(now - GIORNO)
  g.serie = g.ultimo === ieri ? (g.serie || 0) + 1 : 1
  g.record = Math.max(g.record || 0, g.serie)
  g.totali = (g.totali || 0) + 1
  g.ultimo = oggi
  return true
}

/* La serie va letta, non solo scritta: se l'ultima volta è stata l'altro
   ieri la serie è già rotta anche se nessuno l'ha ancora azzerata. */
export function serieViva(p, now = Date.now()) {
  const g = p.giorni || {}
  if (!g.ultimo) return 0
  const oggi = giornoDi(now), ieri = giornoDi(now - GIORNO)
  return g.ultimo === oggi || g.ultimo === ieri ? (g.serie || 0) : 0
}

/* ═══════════ le misure che i traguardi leggono ═══════════ */
export function misure(p, now = Date.now()) {
  const items = p.items || {}
  const conta = pre => Object.entries(items)
    .filter(([k, v]) => k.startsWith(pre) && isMastered(v, now)).length

  const m = {
    p, now,
    tot: k => (p.totals && p.totals[k]) || 0,
    best: k => (p.best && p.best[k]) || 0,
    imparati: conta,
    oggetti: () => (p.owned || []).length,
    /* gli animali ADOTTATI, non quelli in cameretta adesso: chi è al
       rifugio è stato scelto e pagato lo stesso, e una medaglia già
       presa non si toglie perché si è fatto posto a un altro */
    animali: () => PETS.filter(x => p.pets && p.pets[x.id]).length,
    /* quante specie diverse: è il traguardo che spinge a provare il
       pappagallo invece del quarto gatto */
    specie: () => new Set(PETS.filter(x => p.pets && p.pets[x.id])
      .map(x => x.specie)).size,
    tappe: () => (p.td && p.td.tappa) || 0,
    tappeMate: () => (p.mate && p.mate.tappa) || 0,
    tappeMente: () => (p.calc && p.calc.tappa) || 0,
    /* le strategie che reggono ADESSO: come le tabelline intere, può
       scendere se non si ripassa */
    concettiSaldi: () => concettiSaldiDi(items, now),
    tappeEn: () => (p.eng && p.eng.tappa) || 0,
    tappeEs: () => (p.esp && p.esp.tappa) || 0,
    tappePoz: () => (p.lab && p.lab.tappa) || 0,
    tappeGen: () => (p.gen && p.gen.tappa) || 0,

    /* ---------- le campagne dei giochi nuovi ----------
       Stanno tutte in `profile.campagne[<chiave>]` con la stessa forma
       (vedi `src/giochi/campagne.js`), quindi qui bastano tre misure per
       tutti invece di tre righe per gioco: quante tappe, quante stelle,
       se la campagna è finita. Un gioco nuovo non aggiunge niente qui. */
    campagna: ch => (p.campagne && p.campagne[ch]) || {},
    tappeDi: ch => m.campagna(ch).tappa || 0,
    stelleDi: ch => Object.values(m.campagna(ch).stelle || {})
      .reduce((s, n) => s + (Number(n) || 0), 0),
    finita: ch => (m.campagna(ch).libera ? 1 : 0),

    /* le stelle del generale non sono un contatore che sale a ogni
       partita ma la somma dei primati: due per ogni livello chiuso nel
       par, una per gli altri. Rigiocare non ne aggiunge. */
    stelleGen: () => Object.values((p.gen && p.gen.stelle) || {})
      .reduce((s, n) => s + (Number(n) || 0), 0),
    campagnaGen: () => (p.gen && p.gen.libera ? 1 : 0),
    /* le tabelline sapute per intero: è il traguardo che un bambino
       racconta a voce ("so la tabellina del 7"), e vale solo se tutti e
       dieci i calcoli reggono adesso, decadimento compreso */
    tabellineIntere: () => tabellineIntereDi(p, now).length,
    livello: () => livelloTotale(p, now).n,

    /* categorie in cui si sanno almeno `k` parole, per lingua */
    categorieDi: (parole, pre, k = 3) => {
      const c = {}
      for (const [str, , , cat] of parole) {
        const it = items[pre + str]
        if (it && isMastered(it, now)) c[cat] = (c[cat] || 0) + 1
      }
      return Object.values(c).filter(n => n >= k).length
    },
    categorieEn: (k = 3) => m.categorieDi(WORDS, 'en:', k),
    categorieEs: (k = 3) => m.categorieDi(PAROLE_ES, 'es:', k),

    /* Chi sta in CAMERETTA adesso: i bisogni li ha solo lui. Di quelli
       al rifugio se ne occupano là, e farli pesare sui traguardi
       vorrebbe dire punire chi ha adottato tanti amici. */
    inCasa: () => (Array.isArray(p.casa) ? p.casa : Object.keys(p.pets || {}))
      .filter(id => p.pets && p.pets[id]),

    /* tutti gli animali di casa sopra la soglia della fame, adesso.
       Vale 1 solo se un animale ce l'hai: a casa vuota nessuno ha fame,
       ma non è un traguardo. */
    tuttiSazi: () => {
      const casa = m.inCasa()
      if (!casa.length) return 0
      return casa.every(id => sazietaDi(p.pets[id], now) >= SOGLIE.basso) ? 1 : 0
    },

    /* più difficile del precedente: tutte e quattro le barre in alto, per
       tutti gli animali di casa. Vuol dire essere passati oggi e aver
       pensato a tutto, non solo alla ciotola. */
    tuttiContenti: () => {
      const casa = m.inCasa()
      if (!casa.length) return 0
      return casa.every(id => contento(p.pets[id], now)) ? 1 : 0
    },

    accessori: () => (p.accessori || []).length,
    serieComplete: () => Math.min((p.serie || 0), SERIE.length),
    /* vestiti addosso adesso, contati una volta sola anche se lo stesso
       posto è occupato su animali diversi */
    vestiti: () => PETS.reduce((n, x) => {
      const a = p.pets && p.pets[x.id]
      return n + (a && a.addosso ? Object.values(a.addosso).filter(Boolean).length : 0)
    }, 0),

    /* i giochi vecchi si riconoscono dal loro contatore, uno per uno; i
       nuovi lo dichiarano nel manifesto (`albo.provato`) e si contano da
       soli. Le soglie del traguardo «Tuttofare» NON si alzano quando
       arriva un gioco: la medaglia mostrata si ricalcola ogni volta, e
       chi ha l'oro se lo vedrebbe tornare indietro sotto gli occhi. */
    giochiProvati: () => {
      const t = p.totals || {}
      return [t.math > 0, t.en > 0 || t.verbi > 0, t.es > 0, t.torri > 0, t.pasti > 0,
              t.pozioni > 0, t.clienti > 0, t.missioni > 0]
        .filter(Boolean).length + giochiNuoviProvati(m)
    },
  }
  return m
}

/* ═══════════ le tabelline sapute per intero ═══════════
   Quali delle dieci tabelline sono imparate tutte e dieci le caselle,
   adesso. Torna i numeri e non un conteggio perché la campagna deve
   sapere *quale* pianeta ha la stella, non quanti. */
export function tabellineIntereDi(p, now = Date.now()) {
  const items = p.items || {}
  const out = []
  for (let n = 1; n <= 10; n++)
    if (calcoliTabellina(n).every(k => items[k] && isMastered(items[k], now))) out.push(n)
  return out
}

/* Allinea la campagna delle tabelline a quello che il bambino già sa.
   Serve a chi giocava prima che la campagna esistesse: ritrovarsi a
   rifare il pianeta del 2 dopo mesi di partite sarebbe una punizione per
   aver giocato presto. Apre le tappe, non le regala: superarle — e
   prendersi le monete — resta da fare. */
/* Stessa cosa per English, con una differenza: le tappe non portano un
   fatto solo (la tabellina del 7) ma decine di parole, e pretendere che
   siano TUTTE imparate lascerebbe la campagna chiusa per sempre. Basta
   che la tappa sia in gran parte saputa — due terzi — perché quella e le
   precedenti risultino già fatte. */
export function allineaInglese(p, now = Date.now()) {
  if (!p.eng) p.eng = { tappa: 0, libera: false }
  const items = p.items || {}
  const sa = k => items[k] && isMastered(items[k], now)
  let t = 0
  while (t < TAPPE_EN.length) {
    const nuove = TAPPE_EN[t].nuove
    const sapute = nuove.filter(sa).length
    if (!nuove.length || sapute / nuove.length < 0.66) break
    t++
  }
  p.eng.tappa = Math.max(p.eng.tappa || 0, t)
  if (p.eng.tappa >= TAPPE_EN.length) p.eng.libera = true
  return p.eng
}

/* Lo spagnolo è arrivato dopo, e nessuno può averlo già giocato: questa
   serve per simmetria e per il giorno in cui una tappa cambierà di
   contenuto. Funziona come quella dell'inglese — apre quello che si sa
   già, e non fa mai retrocedere chi era più avanti. */
export function allineaSpagnolo(p, now = Date.now()) {
  if (!p.esp) p.esp = { tappa: 0, libera: false }
  const items = p.items || {}
  const sa = k => items[k] && isMastered(items[k], now)
  let t = 0
  while (t < TAPPE_ES.length) {
    const nuove = TAPPE_ES[t].nuove
    const sapute = nuove.filter(sa).length
    if (!nuove.length || sapute / nuove.length < 0.66) break
    t++
  }
  p.esp.tappa = Math.max(p.esp.tappa || 0, t)
  if (p.esp.tappa >= TAPPE_ES.length) p.esp.libera = true
  return p.esp
}

/* Il laboratorio, che invece qualcuno l'ha già giocato per intero quando
   ancora non aveva tappe: chi sa già convertire non deve ricominciare dalla
   bilancia. Una tappa risulta fatta se **tutte** le sue conversioni sono
   sapute — sono una, due o tre, mica decine di parole come nelle lingue,
   quindi qui si può pretendere tutto. */
export function allineaPozioni(p, now = Date.now()) {
  if (!p.lab) p.lab = { tappa: 0, libera: false }
  const items = p.items || {}
  const sa = k => items[k] && isMastered(items[k], now)
  let t = 0
  while (t < TAPPE_POZ.length && TAPPE_POZ[t].scale.every(s => sa('pozioni:' + s))) t++
  p.lab.tappa = Math.max(p.lab.tappa || 0, t)
  if (p.lab.tappa >= TAPPE_POZ.length) p.lab.libera = true
  return p.lab
}

export function allineaMate(p, now = Date.now()) {
  if (!p.mate) p.mate = { tappa: 0, libera: false }
  const intere = new Set(tabellineIntereDi(p, now))
  let t = 0
  while (t < CAMPAGNA.length && CAMPAGNA[t].nuova && intere.has(CAMPAGNA[t].nuova)) t++
  p.mate.tappa = Math.max(p.mate.tappa || 0, t)
  return p.mate
}

/* ═══════════ esperienza per gioco e in totale ═══════════ */
export function progressoArea(p, area, now = Date.now()) {
  const m = misure(p, now)
  const def = AREE.find(a => a.id === area)
  const xp = Math.max(0, Math.round((XP_AREA[area] || (() => 0))(m)))
  return { ...def, xp, ...livelloDa(xp), titolo: titoloDi(livelloDa(xp).n) }
}

export function livelloTotale(p, now = Date.now()) {
  const m = misure(p, now)
  let xp = 0
  for (const k of Object.keys(XP_AREA)) xp += Math.max(0, Math.round(XP_AREA[k](m)))
  const l = livelloDa(xp)
  return { ...l, titolo: titoloDi(l.n) }
}

/* ═══════════ 3. I TRAGUARDI ═══════════
   Stato di uno: a che grado si è arrivati, quanto manca al prossimo.
   `grado` è 0 se non se n'è preso ancora nessuno. */
export function statoTraguardo(t, m) {
  const valore = Math.max(0, t.valore(m) || 0)
  let grado = 0
  while (grado < t.soglie.length && valore >= t.soglie[grado]) grado++
  const preso = grado > 0
  const finito = grado >= t.soglie.length
  const meta = finito ? t.soglie[t.soglie.length - 1] : t.soglie[grado]
  const da = finito ? (t.soglie[t.soglie.length - 2] || 0) : (grado > 0 ? t.soglie[grado - 1] : 0)
  return {
    def: t, id: t.id, area: t.area, emoji: t.emoji, nome: t.nome,
    valore, grado, preso, finito, meta,
    /* più di un grado: la medaglia dice a che punto sei */
    medaglia: preso && t.soglie.length > 1 ? MEDAGLIE[grado - 1] : '',
    come: t.come(meta),
    quota: Math.max(0, Math.min(1, (valore - da) / Math.max(1, meta - da))),
  }
}

export function statoTraguardi(p, now = Date.now()) {
  const m = misure(p, now)
  const presi = p.badge || {}
  return TRAGUARDI.map(t => {
    const s = statoTraguardo(t, m)
    s.quando = presi[t.id] ? presi[t.id].t : 0
    return s
  })
}

/* Confronta lo stato con i gradi già registrati nel profilo e segna i
   nuovi. Torna la lista dei traguardi appena raggiunti (uno per grado
   salito) e le monete che portano. Non tocca le monete: le assegna
   store/profile.js, che è l'unico posto da cui passa il salvadanaio. */
export function riscuotiTraguardi(p, now = Date.now()) {
  if (!p.badge) p.badge = {}
  const nuovi = []
  let monete = 0
  for (const s of statoTraguardi(p, now)) {
    const prima = p.badge[s.id] ? p.badge[s.id].g : 0
    if (s.grado <= prima) continue
    p.badge[s.id] = { g: s.grado, t: now }
    /* saltare due gradi in un colpo solo è raro ma possibile (e succede
       di sicuro la prima volta, sui traguardi già meritati): si paga
       ogni gradino, non solo l'ultimo */
    let premio = 0
    for (let g = prima + 1; g <= s.grado; g++) premio += PREMI[Math.min(g - 1, PREMI.length - 1)]
    monete += premio
    nuovi.push({ ...s, gradoPrima: prima, premio })
  }
  return { nuovi, monete }
}

export const quantiPresi = p => Object.keys(p.badge || {}).length
export const quantiTotali = TRAGUARDI.length
