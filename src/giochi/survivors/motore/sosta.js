/* ═══════════════════════════════════════════════════════════════════
   LA PARTITA LASCIATA A METÀ

   Stessa promessa del sotterraneo: **uscire non butta via niente**. Qui
   una tappa dura fra i quarantacinque secondi e i tre minuti, quindi
   quello che si salva è meno — ma la Sopravvivenza non finisce mai, e
   lì una partita può durare quanto un pomeriggio. E soprattutto la
   regola vale la pena tenerla uguale in tutti i giochi: un bambino che
   ha imparato che nel sotterraneo si può uscire non deve scoprire che
   qui no.

   ── QUASI TUTTO SI RIFÀ, POCO SI SCRIVE ───────────────────────────
   Non c'è nessun mondo da rigenerare: lo scenario sta nella tappa e la
   `Regole` si rifà dall'indice. I numeri dell'eroe (`f`) sono una
   funzione dei potenziamenti — `ricalcola()` li rimette a posto — e la
   prossima soglia è una funzione del livello. Resta da scrivere solo
   quello che è **successo**: dove si era arrivati, cosa si è preso, e
   chi c'è in campo.

   ── QUELLO CHE DURA MEZZO SECONDO NON SI SALVA ────────────────────
   Frecce in volo, briciole, palle giranti, saette: in mezzo secondo si
   rifanno da soli, e salvarli vorrebbe dire scrivere trecento oggetti
   per riavere una scintilla. Nemici e gemme invece sì: sono quello che
   c'è addosso e quello che si è guadagnato.

   ── I MOSTRI NON SI CANCELLANO, SI SPINGONO VIA ───────────────────
   È la scelta che tiene in piedi tutto il resto. Riaprire il gioco a
   campo pulito sarebbe comodissimo — e diventerebbe **una mossa**:
   quando sei circondato esci, rientri, e la marea ricomincia da capo
   mentre l'orologio no. In campagna quei secondi valgono un cuore, cioè
   una stella (`stellePerFerite`); nella Sopravvivenza valgono il
   primato. Quindi i nemici si riprendono dov'erano, e solo quelli
   addosso all'eroe fanno un passo indietro fino a `SPAZIO` — perché
   riaprire il gioco con la melma già sul naso e mezzo cuore in meno è
   il modo più rapido di far pentire qualcuno di aver ripreso. È la
   stessa regola del sotterraneo, dove chi inseguiva si ritrova a casa
   sua.

   ── DOPO IL TRAGUARDO NON SI SALVA PIÙ ────────────────────────────
   Al traguardo stelle e monete sono già state contate e messe via
   (`chiudiPartita` gira prima che il cartello offra «resto in campo»).
   Chi resta gioca tempo regalato: se lo interrompe perde qualche
   monetina e nient'altro. Salvare anche quello vorrebbe dire portarsi
   dietro *che i premi sono già stati pagati* — e un salvataggio che si
   scorda quella riga paga la tappa due volte.

   ── SE LA FORMA CAMBIA, SI BUTTA ──────────────────────────────────
   `VERSIONE` sale ogni volta che questo formato cambia, e un
   salvataggio di ieri non si legge: si ricomincia la tappa. Una partita
   persa è un dispiacere, una partita ripresa con dei campi che non
   tornano è un gioco rotto in un modo che nessuno sa spiegare.
   ═══════════════════════════════════════════════════════════════════ */
import { Partita, Regole } from './partita.js'
import { MOSTRI } from '../dati/mostri.js'
import { soglia } from '../dati/taratura.js'

export const VERSIONE = 1

/* Quanto spazio si trova davanti chi riprende. Poco più della metà
   della gittata dell'arco (275): l'eroe li vede arrivare e comincia a
   tirare, ma non sono già addosso. */
export const SPAZIO = 170

/* Tetti, perché un salvataggio è un dato che si scrive su un telefono
   ogni pochi secondi. In campagna non si arriva mai a tanto; è la
   Sopravvivenza al decimo minuto che può avere duecento bestie in
   campo. Si tengono **i più vicini**, che sono quelli che contano: i
   lontani, riprendendo, sarebbero arrivati comunque. */
export const MAX_NEMICI = 140
const MAX_GEMME = 120

const vicini = (roba, eroe, quanti) => roba.length <= quanti ? roba : [...roba]
  .sort((a, b) => (a.x - eroe.x) ** 2 + (a.y - eroe.y) ** 2
                - ((b.x - eroe.x) ** 2 + (b.y - eroe.y) ** 2))
  .slice(0, quanti)

const arrotonda = n => Math.round(n * 10) / 10

/* ── quello che si scrive ──
   `tappa` è l'indice nella campagna (−1 è la Sopravvivenza), non la
   tappa intera: la tabella sta nel codice e cambia con le versioni,
   l'indice no. */
export function scrivi(partita, tappa) {
  const p = partita
  if (!p || p.finita || p.conquistata) return null
  const e = p.eroe
  return {
    v: VERSIONE,
    tappa,
    tempo: arrotonda(p.tempo),
    livello: p.livello,
    xp: p.xp,
    uccisi: p.uccisi,
    ferite: p.ferite,
    eroe: { x: arrotonda(e.x), y: arrotonda(e.y), cuori: e.cuori,
            cuoriMax: e.cuoriMax, guarda: e.guarda, passi: arrotonda(e.passi) },
    potenziamenti: { ...p.potenziamenti },
    /* Le tre carte in attesa di essere scelte si salvano **per chiave**
       e si rivestono riprendendo. Rigenerarle sarebbe una riga in meno
       e un tiro nuovo a ogni uscita: chi non gradisce l'offerta esce e
       rientra finché non gliene capita una migliore. */
    offerta: p.offerta ? p.offerta.map(c => c.chiave) : null,
    nemici: vicini(p.nemici, e, MAX_NEMICI).map(n => ({
      t: n.tipo, x: arrotonda(n.x), y: arrotonda(n.y),
      vita: arrotonda(n.vita), max: arrotonda(n.vitaMax),
      passo: arrotonda(n.passo), massa: arrotonda(n.massa),
    })),
    gemme: vicini(p.gemme, e, MAX_GEMME)
      .map(g => ({ x: arrotonda(g.x), y: arrotonda(g.y), val: g.val })),
  }
}

/* ── quello che si rilegge ──
   Torna una `Partita` pronta a giocare, o `null` se il salvataggio non
   si può leggere: chi chiama in quel caso comincia una partita nuova, e
   non deve saperne il perché. */
export function leggi(dato, tappa, { rnd = Math.random, campo = null, mazzo } = {}) {
  if (!dato || dato.v !== VERSIONE || !tappa || !dato.eroe) return null
  try {
    const opzioni = { rnd, campo }
    if (mazzo) opzioni.mazzo = mazzo
    const p = new Partita(new Regole(tappa), opzioni)

    /* prima i potenziamenti, poi i numeri che ne dipendono: `ricalcola`
       legge i livelli delle carte, e con lo zaino vuoto darebbe all'eroe
       la velocità e la gittata di partenza */
    p.potenziamenti = { ...(dato.potenziamenti || {}) }
    p.ricalcola()

    p.tempo = dato.tempo || 0
    p.livello = Math.max(1, dato.livello || 1)
    p.prossima = soglia(p.livello)
    p.xp = Math.max(0, Math.min(dato.xp || 0, p.prossima))
    p.uccisi = dato.uccisi || 0
    p.ferite = dato.ferite || 0

    const e = dato.eroe
    Object.assign(p.eroe, {
      x: e.x || 0, y: e.y || 0,
      cuoriMax: Math.max(1, e.cuoriMax || p.regole.cuori),
      guarda: e.guarda === -1 ? -1 : 1,
      passi: e.passi || 0,
      vx: 0, vy: 0, invuln: 0, mira: 0,
    })
    p.eroe.cuori = Math.max(1, Math.min(e.cuori || 1, p.eroe.cuoriMax))

    /* un tipo di mostro che non esiste più si butta, invece di
       portarselo dietro come una bestia senza scheda che nessuno può
       né disegnare né uccidere */
    p.nemici = (dato.nemici || [])
      .filter(n => n && MOSTRI[n.t])
      .map(n => ({
        tipo: n.t, x: n.x, y: n.y,
        r: MOSTRI[n.t].r,
        vita: n.vita, vitaMax: n.max || n.vita,
        passo: n.passo || MOSTRI[n.t].passo, massa: n.massa || 1,
        spx: 0, spy: 0, lampo: 0, gelato: 0, freno: 1, attesa: 0,
        fase: rnd() * 6.3,
      }))
    for (const n of p.nemici) faiSpazio(n, p.eroe, rnd)

    p.gemme = (dato.gemme || []).map(g => ({
      x: g.x, y: g.y, vx: 0, vy: 0, val: g.val || 1, fase: rnd() * 6.3,
    }))

    if (dato.offerta?.length) {
      const carte = dato.offerta
        .map(k => p.mazzo.find(c => c.chiave === k))
        .filter(Boolean)
        .map(c => p.vestiCarta(c))
        .sort((a, b) => a.prezzo - b.prezzo)
      p.offerta = carte.length ? carte : null
    }
    return p
  } catch {
    /* un salvataggio storto non porta giù il gioco: si ricomincia. È la
       stessa scelta dell'archivio, che non lancia mai. */
    return null
  }
}

/* Chi era addosso all'eroe fa un passo indietro, lungo la direzione da
   cui stava arrivando: resta suo il vantaggio di essere vicino, ma non
   quello di essere già arrivato. */
function faiSpazio(n, eroe, rnd) {
  let dx = n.x - eroe.x, dy = n.y - eroe.y
  let d = Math.sqrt(dx * dx + dy * dy)
  if (d < 1) {                       // esattamente sopra: da qualche parte va
    const a = rnd() * 6.3
    dx = Math.cos(a); dy = Math.sin(a); d = 1
  }
  if (d >= SPAZIO) return
  n.x = eroe.x + dx / d * SPAZIO
  n.y = eroe.y + dy / d * SPAZIO
}

/* Due righe per la carta «riprendi»: cosa si sta lasciando in sospeso.
   Le legge la mappa, che di `Partita` non sa niente. */
export function dice(dato, campagna, libero) {
  if (!dato || dato.v !== VERSIONE) return null
  const t = dato.tappa < 0 ? libero : campagna[dato.tappa]
  if (!t) return null
  return {
    tappa: dato.tappa,
    nome: t.nome,
    scenario: t.scenario,
    libera: dato.tappa < 0,
    tempo: Math.floor(dato.tempo || 0),
    /* quanto manca, che è la cosa che si vuole sapere prima di dire di
       sì: nella Sopravvivenza non manca niente, si va avanti */
    restano: Number.isFinite(t.durata)
      ? Math.max(0, Math.ceil(t.durata - (dato.tempo || 0))) : 0,
    livello: dato.livello || 1,
    cuori: dato.eroe?.cuori || 0,
    cuoriMax: dato.eroe?.cuoriMax || 0,
    uccisi: dato.uccisi || 0,
  }
}
