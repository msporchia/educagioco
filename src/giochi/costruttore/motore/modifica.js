/* ═══════════════════════════════════════════════════════════════════
   LE MODIFICHE AL PROGRAMMA — quello che fa un tocco nell'editor

   La vista non tocca il programma: dice cosa vuole fare («metti un
   ripeti dopo la riga n4», «cambia il verso di n7 in su») e chi coordina
   chiama una di queste funzioni. Sono pure e lavorano sul posto, così si
   provano in Node e la vista non ha niente di suo da sbagliare.

   ── DOVE SI INSERISCE ─────────────────────────────────────────────
   Un posto nel programma si dice con `{ progetto, dopo, dentro, ramo }`:

     progetto   null = la principale, se no l'id del progetto
     dopo       l'id della riga dopo cui inserire (stesso elenco)
     dentro     l'id di un blocco (ripeti, se, …) in cima al cui corpo
                inserire; `ramo` dice quale corpo: corpo|allora|altrimenti,
                e `inFondo` lo mette in fondo invece che in cima (è il «＋
                qui dentro» che chiude ogni corpo)
     niente     in fondo al corpo del progetto (o della principale)
   ═══════════════════════════════════════════════════════════════════ */
import { fai, N, istruzioni, dentro as sottoRighe } from '../dati/scrivi.js'

/* un id mai usato in questo programma */
export function nuovoId(prog) {
  const n = Math.max(prog.prossimo || 1, 1)
  prog.prossimo = n + 1
  return 'n' + n
}

export const corpoDi = (prog, progetto) => {
  if (!progetto) return prog.principale
  const p = (prog.progetti || []).find(q => q.id === progetto)
  return p ? p.corpo : null
}

/* Dove sta una riga: l'elenco che la contiene e la posizione. Si cerca
   dappertutto, principale e progetti, dentro i blocchi compresi. */
export function trova(prog, id) {
  const corpi = [{ progetto: null, corpo: prog.principale }, ...(prog.progetti || []).map(p => ({ progetto: p.id, corpo: p.corpo }))]
  for (const { progetto, corpo } of corpi) {
    const r = cercaIn(corpo, id)
    if (r) return { ...r, progetto }
  }
  return null
}

function cercaIn(elenco, id, genitore = null, ramo = null) {
  for (let k = 0; k < elenco.length; k++) {
    const i = elenco[k]
    if (i.id === id) return { nodo: i, elenco, indice: k, genitore, ramo }
    for (const r of ['corpo', 'allora', 'altrimenti']) {
      if (Array.isArray(i[r])) {
        const t = cercaIn(i[r], id, i, r)
        if (t) return t
      }
    }
  }
  return null
}

/* ── le righe nuove ──
   **Una riga nuova non sceglie al posto del bambino.** La prima versione
   nasceva già eseguibile — `vai a destra 1`, `ripeti 2 volte` — e un
   valore di comodo si leggeva come l'unico possibile: «vai a destra»
   diceva che si va solo a destra. Adesso le scelte vere arrivano dalla
   cassetta (il verso, il posto del mattone: un tasto ciascuno) e i
   numeri nascono **N**, da scegliere: la vista apre la scelta appena la
   riga c'è, e il robot si rifiuta di partire con una N dentro.

   Il colore è l'eccezione, ed è voluta: con un colore solo nel livello
   non c'è niente da scegliere, e con più colori si propone quello usato
   per ultimo (`colore`), che è una scelta del bambino e non nostra. */
export function rigaNuova(tipo, { colore = null, verso = null, dove = 'sotto', lato = null, lavagnette = [], progetto = null } = {}) {
  switch (tipo) {
    case 'vai': return fai.vai(verso, N())
    case 'metti': return fai.metti(colore, dove)
    /* nel porto il lato lo sceglie la cassetta, un tasto per freccia */
    case 'prendi': return fai.prendi(lato)
    case 'posa': return fai.posa(lato)
    case 'ripeti': return fai.ripeti(N(), [])
    case 'finche': return fai.finche(null, [])
    case 'sempre': return fai.sempre([])
    case 'aspetta': return fai.aspetta(null)
    case 'se': return fai.se(null, [], null)
    case 'assegna': return fai.assegna(lavagnette[0] || null, N())
    case 'chiama': {
      const misure = (progetto && progetto.misure) || []
      return { tipo: 'chiama', progetto: progetto ? progetto.id : null, argomenti: misure.map(() => N()) }
    }
    default: return null
  }
}

/* La prima casella da scegliere di una riga appena nata: è quella che la
   vista apre da sola. `null` se non c'è niente da scegliere. */
export function primaDaScegliere(riga, prog = null) {
  const vuoto = e => !e || !!e.vuoto || (!!e.op && (vuoto(e.a) || vuoto(e.b)))
  if (!riga) return null
  if (riga.tipo === 'vai') return !riga.verso ? { campo: 'verso', tipo: 'verso' }
    : vuoto(riga.quanto) ? { campo: 'quanto', tipo: 'numero' } : null
  if (riga.tipo === 'metti') return !riga.colore || riga.colore.vuoto ? { campo: 'colore', tipo: 'colore' } : null
  if (riga.tipo === 'prendi' || riga.tipo === 'posa') return !riga.lato ? { campo: 'lato', tipo: 'lato' } : null
  if (riga.tipo === 'ripeti') return vuoto(riga.volte) ? { campo: 'volte', tipo: 'numero' } : null
  if (riga.tipo === 'finche' || riga.tipo === 'se' || riga.tipo === 'aspetta')
    return !riga.cond ? { campo: 'cond', tipo: 'cond' } : null
  /* il valore di una lavagnetta è di qualunque specie: nel porto ci va
     anche un colore, o quello che il robot legge */
  if (riga.tipo === 'assegna') return !riga.nome ? { campo: 'nome', tipo: 'lavagnetta' }
    : vuoto(riga.valore) ? { campo: 'valore', tipo: 'valore' } : null
  if (riga.tipo === 'chiama') {
    const k = (riga.argomenti || []).findIndex(a => typeof a !== 'string' && vuoto(a))
    if (k < 0) return null
    /* la casella di una misura che è un colore apre la scelta dei colori */
    const p = prog && (prog.progetti || []).find(q => q.id === riga.progetto)
    const m = p && (p.misure || [])[k]
    return { campo: `argomenti.${k}`, tipo: p && (p.tipi || {})[m] === 'colore' ? 'colore' : 'numero' }
  }
  return null
}

/* Inserisce una riga (con i suoi figli, se ne ha) e torna il suo id.
   Gli id di tutto quello che entra sono nuovi: una riga duplicata non
   deve accendersi insieme all'originale. */
export function inserisci(prog, posto, riga) {
  rinumera(prog, riga)
  const { progetto = null, dopo = null, dentro = null, ramo = 'corpo', inFondo = false } = posto || {}
  if (dentro) {
    const t = trova(prog, dentro)
    if (!t) return null
    if (!Array.isArray(t.nodo[ramo])) t.nodo[ramo] = []
    if (inFondo) t.nodo[ramo].push(riga)
    else t.nodo[ramo].unshift(riga)
    return riga.id
  }
  if (dopo) {
    const t = trova(prog, dopo)
    if (!t) return null
    t.elenco.splice(t.indice + 1, 0, riga)
    return riga.id
  }
  const corpo = corpoDi(prog, progetto)
  if (!corpo) return null
  corpo.push(riga)
  return riga.id
}

function rinumera(prog, riga) {
  riga.id = nuovoId(prog)
  for (const r of ['corpo', 'allora', 'altrimenti'])
    for (const figlia of riga[r] || []) rinumera(prog, figlia)
}

export function togli(prog, id) {
  const t = trova(prog, id)
  if (!t) return false
  t.elenco.splice(t.indice, 1)
  return true
}

/* su e giù dentro lo stesso elenco: chi vuole portare una riga dentro
   un blocco la toglie e la rimette — spostare attraverso i livelli con
   un dito, su un telefono, è il trascinamento che qui non esiste */
export function sposta(prog, id, verso) {
  const t = trova(prog, id)
  if (!t) return false
  const j = t.indice + verso
  if (j < 0 || j >= t.elenco.length) return false
  const [r] = t.elenco.splice(t.indice, 1)
  t.elenco.splice(j, 0, r)
  return true
}

export function duplica(prog, id) {
  const t = trova(prog, id)
  if (!t) return null
  const copia = JSON.parse(JSON.stringify(t.nodo))
  rinumera(prog, copia)
  t.elenco.splice(t.indice + 1, 0, copia)
  return copia.id
}

/* Cambia un campo di una riga: `verso`, `colore`, `quanto`, `volte`,
   `cond`, `nome`, `valore`, `argomenti.0`… Il valore arriva già nella
   forma giusta (un numero è `{n}` / `{v}` / `{op,a,b}`). */
export function imposta(prog, id, campo, valore) {
  const t = trova(prog, id)
  if (!t) return false
  const [testa, coda] = String(campo).split('.')
  if (coda !== undefined) {
    if (!Array.isArray(t.nodo[testa])) t.nodo[testa] = []
    t.nodo[testa][Number(coda)] = valore
  } else t.nodo[testa] = valore
  /* un «se» a cui si toglie l'altrimenti lo perde, e uno a cui lo si
     chiede ne riceve uno vuoto */
  if (t.nodo.tipo === 'se' && campo === 'altrimenti' && valore === true) t.nodo.altrimenti = []
  return true
}

/* ═══════════ i progetti ═══════════ */
export function nuovoProgetto(prog, { nome, icona = '🧱', misure = [] }) {
  if (!Array.isArray(prog.progetti)) prog.progetti = []
  let id = 'p-' + (nome || 'progetto').toLowerCase().replace(/[^a-zà-ù0-9]+/g, '-').replace(/^-|-$/g, '') || 'p'
  while (prog.progetti.some(p => p.id === id)) id += '-bis'
  /* le misure arrivano come nomi o come { nome, tipo } */
  const voci = misure.map(m => (typeof m === 'string' ? { nome: m } : m))
  const nuovo = { id, nome: nome || 'progetto', icona, misure: voci.map(m => m.nome), corpo: [] }
  const colori = voci.filter(m => m.tipo === 'colore').map(m => m.nome)
  if (colori.length) nuovo.tipi = Object.fromEntries(colori.map(n => [n, 'colore']))
  prog.progetti.push(nuovo)
  return id
}

/* Rinominare le misure si porta dietro le righe che le usano, dentro il
   progetto; aggiungerne o toglierne una sistema anche **tutte le
   chiamate**, così una chiamata non resta mai con il numero sbagliato
   di caselle — che sarebbe un errore del gioco, non del bambino. */
export function aggiornaProgetto(prog, id, { nome, icona, misure }) {
  const p = (prog.progetti || []).find(q => q.id === id)
  if (!p) return false
  if (nome) p.nome = nome
  if (icona) p.icona = icona
  if (Array.isArray(misure)) {
    const vecchie = p.misure || []
    /* una misura rinominata tiene il suo posto: `misure` arriva come
       [{ nome, da }] dove `da` è il nome di prima (o null se è nuova) */
    const nuove = misure.map(m => (typeof m === 'string' ? { nome: m, da: m } : m))
    for (const m of nuove)
      if (m.da && m.da !== m.nome) rinominaNumero(p.corpo, m.da, m.nome)
    p.misure = nuove.map(m => m.nome)
    /* una misura è un numero, se non si dice altro; un colore lo dice `tipi` */
    const colori = nuove.filter(m => (m.tipo || (m.da && (p.tipi || {})[m.da])) === 'colore').map(m => m.nome)
    if (colori.length) p.tipi = Object.fromEntries(colori.map(n => [n, 'colore']))
    else delete p.tipi
    for (const i of istruzioni(prog)) {
      if (i.tipo !== 'chiama' || i.progetto !== id) continue
      const prima = i.argomenti || []
      i.argomenti = nuove.map(m => {
        const k = m.da ? vecchie.indexOf(m.da) : -1
        return k >= 0 && prima[k] ? prima[k] : N()
      })
    }
  }
  return true
}

export function togliProgetto(prog, id) {
  const k = (prog.progetti || []).findIndex(p => p.id === id)
  if (k < 0) return false
  prog.progetti.splice(k, 1)
  /* le chiamate a un progetto che non c'è più se ne vanno con lui */
  const via = elenco => {
    for (let j = elenco.length - 1; j >= 0; j--) {
      const i = elenco[j]
      if (i.tipo === 'chiama' && i.progetto === id) { elenco.splice(j, 1); continue }
      for (const r of ['corpo', 'allora', 'altrimenti']) if (Array.isArray(i[r])) via(i[r])
    }
  }
  via(prog.principale)
  for (const p of prog.progetti) via(p.corpo)
  return true
}

/* ═══════════ le lavagnette ═══════════ */
export function nuovaLavagnetta(prog, nome) {
  if (!Array.isArray(prog.lavagnette)) prog.lavagnette = []
  const pulito = String(nome || '').trim().toLowerCase().replace(/\s+/g, '-').slice(0, 12)
  if (!pulito || prog.lavagnette.includes(pulito)) return pulito || null
  prog.lavagnette.push(pulito)
  return pulito
}

export function togliLavagnetta(prog, nome) {
  const k = (prog.lavagnette || []).indexOf(nome)
  if (k < 0) return false
  prog.lavagnette.splice(k, 1)
  return true
}

/* ═══════════ chi usa cosa ═══════════ */
function rinominaNumero(corpo, da, a) {
  const cambia = e => {
    if (!e || typeof e !== 'object') return e
    if (e.v === da) return { v: a }
    if (e.op) return { ...e, a: cambia(e.a), b: cambia(e.b) }
    return e
  }
  for (const i of sottoRighe(corpo)) {
    for (const campo of ['quanto', 'volte', 'valore']) if (i[campo]) i[campo] = cambia(i[campo])
    if (i.tipo === 'metti' && i.colore && typeof i.colore === 'object') i.colore = cambia(i.colore)
    if (i.argomenti) i.argomenti = i.argomenti.map(cambia)
    if (i.cond && i.cond.tipo === 'confronta') { i.cond.a = cambia(i.cond.a); i.cond.b = cambia(i.cond.b) }
    if (i.cond && i.cond.colore && typeof i.cond.colore === 'object') i.cond.colore = cambia(i.cond.colore)
    if (i.tipo === 'assegna' && i.nome === da) i.nome = a
  }
}

/* I nomi che si possono leggere in un punto del programma: dentro un
   progetto le sue misure, dappertutto le lavagnette del bambino e i
   numeri dell'ordine. È l'elenco che la casella di un numero offre.
   Le lavagnette del bambino non hanno una specie fissa: nel cantiere ci
   finiscono solo numeri, nel porto anche i colori letti su una cassa, e
   quali caselle le offrono lo decide la vista. */
/* `lavagnetteOrdine` sono i numeri (o i colori) di un ordine, come li
   dichiara il livello: `{ lungo: 7 }`, `{ sinistra: 'verde' }`. Qui se ne
   guarda la specie, perché una casella di numeri offre solo numeri e una
   di colori solo colori. */
export function nomiLeggibili(prog, progetto, lavagnetteOrdine = {}) {
  const p = progetto ? (prog.progetti || []).find(q => q.id === progetto) : null
  const tipi = (p && p.tipi) || {}
  const ordine = Array.isArray(lavagnetteOrdine)
    ? Object.fromEntries(lavagnetteOrdine.map(n => [n, 0])) : (lavagnetteOrdine || {})
  const misure = p ? [...(p.misure || [])] : []
  return {
    misure: misure.filter(m => tipi[m] !== 'colore'),
    misureColore: misure.filter(m => tipi[m] === 'colore'),
    lavagnette: [...(prog.lavagnette || [])],
    ordine: Object.keys(ordine).filter(n => typeof ordine[n] !== 'string'),
    ordineColore: Object.keys(ordine).filter(n => typeof ordine[n] === 'string'),
  }
}

/* ═══════════ i controlli prima di partire ═══════════
   Quello che si sa già prima di premere ▶: una riga che nomina una
   lavagnetta che non esiste, una chiamata a un progetto tolto, una
   misura usata fuori dal suo progetto. La vista li segna in rosso; il
   robot, se si parte lo stesso, si fermerebbe lì. */
export function problemi(prog, lavagnetteOrdine = {}) {
  const trovati = []
  const corpi = [{ progetto: null, corpo: prog.principale }, ...(prog.progetti || []).map(p => ({ progetto: p.id, corpo: p.corpo }))]
  for (const { progetto, corpo } of corpi) {
    const noti = nomiLeggibili(prog, progetto, lavagnetteOrdine)
    const numeri = new Set([...noti.misure, ...noti.lavagnette, ...noti.ordine])
    /* una lavagnetta del bambino può portare un colore (nel porto lo
       legge su una cassa): di lei si sa la specie solo mentre gira */
    const colori = new Set([...noti.misureColore, ...noti.ordineColore, ...noti.lavagnette])
    const nomi = e => !e || typeof e !== 'object' ? [] : e.v ? [e.v] : e.op ? [...nomi(e.a), ...nomi(e.b)] : []
    /* un nome dove ci va un numero deve essere un numero, e viceversa */
    const controlla = (lista, giusti, altri, sbaglio, id) => {
      for (const n of lista) {
        if (giusti.has(n)) continue
        trovati.push({ id, motivo: altri.has(n) ? sbaglio : 'lavagnetta-sconosciuta', nome: n })
      }
    }
    for (const i of sottoRighe(corpo)) {
      const tipiChiamato = i.tipo === 'chiama'
        ? (((prog.progetti || []).find(q => q.id === i.progetto) || {}).tipi || {}) : {}
      const misureChiamato = i.tipo === 'chiama'
        ? (((prog.progetti || []).find(q => q.id === i.progetto) || {}).misure || []) : []
      const argNumeri = (i.argomenti || []).filter((_, k) => tipiChiamato[misureChiamato[k]] !== 'colore')
      const argColori = (i.argomenti || []).filter((_, k) => tipiChiamato[misureChiamato[k]] === 'colore')
      const letti = [
        ...nomi(i.quanto), ...nomi(i.volte), ...nomi(i.valore),
        ...argNumeri.flatMap(nomi),
        ...(i.cond && i.cond.tipo === 'confronta' ? [...nomi(i.cond.a), ...nomi(i.cond.b)] : []),
      ]
      controlla(letti, numeri, colori, 'non-un-numero', i.id)
      const lettiColori = [...(i.tipo === 'metti' ? nomi(i.colore) : []), ...argColori.flatMap(nomi),
                           ...(i.cond && i.cond.tipo === 'guarda' ? nomi(i.cond.colore) : [])]
      controlla(lettiColori, colori, numeri, 'non-un-colore', i.id)
      if (i.tipo === 'assegna' && !i.nome) trovati.push({ id: i.id, motivo: 'lavagnetta-mancante' })
      if (i.tipo === 'assegna' && i.nome && !noti.lavagnette.includes(i.nome))
        trovati.push({ id: i.id, motivo: noti.ordine.includes(i.nome) ? 'lavagnetta-ordine' : 'lavagnetta-sconosciuta', nome: i.nome })
      if (i.tipo === 'chiama') {
        const p = (prog.progetti || []).find(q => q.id === i.progetto)
        if (!p) trovati.push({ id: i.id, motivo: 'progetto-sconosciuto' })
      }
      /* quello che resta da scegliere: la N, il colore, la domanda */
      const scelta = primaDaScegliere(i, prog)
      if (scelta) trovati.push({ id: i.id, motivo: {
        numero: 'n-da-scegliere', valore: 'n-da-scegliere', colore: 'colore-da-scegliere', cond: 'condizione-da-scegliere',
        verso: 'verso-da-scegliere', lato: 'verso-da-scegliere', lavagnetta: 'lavagnetta-mancante' }[scelta.tipo], ...scelta })
    }
  }
  return trovati
}

/* ═══════════ i progetti degli altri cantieri ═══════════
   Un progetto scritto in un livello resta del bambino: da un altro
   livello lo si riprende, e arriva **con i progetti che chiama** — una
   casa che usa «muro» senza «muro» sarebbe una casa che si ferma alla
   prima riga. Quelli che il programma ha già (per nome) non si
   raddoppiano: si usa quello che c'è. Gli id delle righe sono nuovi,
   perché nel programma d'arrivo devono essere unici. */
export function importaProgetto(prog, sorgente, idProgetto) {
  const tutti = sorgente.progetti || []
  const serve = []
  const guarda = id => {
    const p = tutti.find(q => q.id === id)
    if (!p || serve.includes(p)) return
    serve.push(p)
    for (const i of sottoRighe(p.corpo)) if (i.tipo === 'chiama') guarda(i.progetto)
  }
  guarda(idProgetto)
  if (!serve.length) return null
  if (!Array.isArray(prog.progetti)) prog.progetti = []
  /* id di là → id di qua, per rifare le chiamate */
  const mappa = {}
  for (const p of serve) {
    const gia = prog.progetti.find(q => q.nome === p.nome)
    if (gia) { mappa[p.id] = gia.id; continue }
    let id = p.id
    while (prog.progetti.some(q => q.id === id)) id += '-bis'
    mappa[p.id] = id
  }
  for (const p of serve) {
    if (prog.progetti.some(q => q.id === mappa[p.id])) continue
    const copia = JSON.parse(JSON.stringify(p))
    copia.id = mappa[p.id]
    for (const i of sottoRighe(copia.corpo)) {
      if (i.tipo === 'chiama' && mappa[i.progetto]) i.progetto = mappa[i.progetto]
    }
    for (const r of copia.corpo) rinumera(prog, r)
    prog.progetti.push(copia)
  }
  return mappa[idProgetto]
}
