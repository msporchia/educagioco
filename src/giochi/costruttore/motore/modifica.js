// Le modifiche al programma: funzioni pure, la vista non tocca mai il programma direttamente.
// La forma di un "posto" (progetto/dopo/prima/dentro/ramo): docs/costruttore/progetti.md.
import { fai, N, istruzioni, dentro as sottoRighe } from '../dati/scrivi.js'

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

// Dove sta una riga: l'elenco che la contiene e la posizione (cerca in principale, progetti e blocchi).
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

// Una riga nasce senza scegliere al posto del bambino: verso/posto/colore nascono vuoti, i numeri N (i passi di
// «vai» nascono 1, l'unica eccezione). Vedi docs/costruttore/linguaggio.md.
export function rigaNuova(tipo, { colore = null, verso = null, dove = null, lato = null, lavagnette = [], progetto = null } = {}) {
  switch (tipo) {
    case 'vai': return fai.vai(verso, 1)
    case 'metti': return fai.metti(colore, dove)
    case 'prendi': return fai.prendi(lato)
    case 'posa': return fai.posa(lato)
    case 'ripeti': return fai.ripeti(N(), [])
    case 'finche': return fai.finche(null, [])
    case 'sempre': return fai.sempre([])
    case 'aspetta': return fai.aspetta(null)
    case 'pausa': return fai.pausa()
    case 'se': return fai.se(null, [], null)
    case 'assegna': return fai.assegna(lavagnette[0] || null, N())
    case 'chiama': {
      const misure = (progetto && progetto.misure) || []
      return { tipo: 'chiama', progetto: progetto ? progetto.id : null, argomenti: misure.map(() => N()) }
    }
    default: return null
  }
}

// La prima casella da scegliere di una riga appena nata, o null se non c'è niente da scegliere.
export function primaDaScegliere(riga, prog = null) {
  const vuoto = e => !e || !!e.vuoto || (!!e.op && (vuoto(e.a) || vuoto(e.b)))
  if (!riga) return null
  if (riga.tipo === 'vai') return !riga.verso ? { campo: 'verso', tipo: 'verso' }
    : vuoto(riga.quanto) ? { campo: 'quanto', tipo: 'numero' } : null
  // `dove` vuoto è solo `null`: una riga di prima senza il campo è «sotto».
  if (riga.tipo === 'metti') return riga.dove === null ? { campo: 'dove', tipo: 'posto' }
    : !riga.colore || riga.colore.vuoto ? { campo: 'colore', tipo: 'colore' } : null
  if (riga.tipo === 'prendi' || riga.tipo === 'posa') return !riga.lato ? { campo: 'lato', tipo: 'lato' } : null
  if (riga.tipo === 'ripeti') return vuoto(riga.volte) ? { campo: 'volte', tipo: 'numero' } : null
  if (riga.tipo === 'finche' || riga.tipo === 'se' || riga.tipo === 'aspetta')
    return !riga.cond ? { campo: 'cond', tipo: 'cond' } : null
  if (riga.tipo === 'assegna') return !riga.nome ? { campo: 'nome', tipo: 'lavagnetta' }
    : vuoto(riga.valore) ? { campo: 'valore', tipo: 'valore' } : null
  if (riga.tipo === 'chiama') {
    const k = (riga.argomenti || []).findIndex(a => typeof a !== 'string' && vuoto(a))
    if (k < 0) return null
    const p = prog && (prog.progetti || []).find(q => q.id === riga.progetto)
    const m = p && (p.misure || [])[k]
    return { campo: `argomenti.${k}`, tipo: p && (p.tipi || {})[m] === 'colore' ? 'colore' : 'numero' }
  }
  return null
}

// Inserisce una riga (con i suoi figli) e torna il suo id; gli id di quello che entra sono sempre nuovi.
export function inserisci(prog, posto, riga) {
  rinumera(prog, riga)
  return metti(prog, posto, riga)
}

function metti(prog, posto, riga) {
  const { progetto = null, prima = null, dopo = null, dentro = null, ramo = 'corpo', inFondo = false } = posto || {}
  if (prima) {
    const t = trova(prog, prima)
    if (!t) return null
    t.elenco.splice(t.indice, 0, riga)
    return riga.id
  }
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

// Su e giù dentro lo stesso elenco; per entrare in un blocco o uscirne c'è `trasloca`.
export function sposta(prog, id, verso) {
  const t = trova(prog, id)
  if (!t) return false
  const j = t.indice + verso
  if (j < 0 || j >= t.elenco.length) return false
  const [r] = t.elenco.splice(t.indice, 1)
  t.elenco.splice(j, 0, r)
  return true
}

// La mano: sposta una riga (con tutto quello che ha dentro) tenendo i suoi id, senza posarla dentro sé stessa.
export function trasloca(prog, id, posto) {
  const t = trova(prog, id)
  if (!t || !posto) return false
  const dentroDiLei = new Set(sottoRighe([t.nodo]).map(i => i.id))
  if ([posto.prima, posto.dopo, posto.dentro].some(x => x && dentroDiLei.has(x))) return false
  if (posto.prima === id || posto.dopo === id) return false
  t.elenco.splice(t.indice, 1)
  if (metti(prog, posto, t.nodo)) return true
  t.elenco.splice(t.indice, 0, t.nodo)       // il posto non c'era: torna dov'era
  return false
}

export function incollaCopia(prog, id, posto) {
  const t = trova(prog, id)
  if (!t) return null
  return inserisci(prog, posto, JSON.parse(JSON.stringify(t.nodo)))
}

export function duplica(prog, id) {
  const t = trova(prog, id)
  if (!t) return null
  const copia = JSON.parse(JSON.stringify(t.nodo))
  rinumera(prog, copia)
  t.elenco.splice(t.indice + 1, 0, copia)
  return copia.id
}

// Cambia un campo di una riga; il valore arriva già nella forma giusta (un numero è {n} / {v} / {op,a,b}).
export function imposta(prog, id, campo, valore) {
  const t = trova(prog, id)
  if (!t) return false
  const [testa, coda] = String(campo).split('.')
  if (coda !== undefined) {
    if (!Array.isArray(t.nodo[testa])) t.nodo[testa] = []
    t.nodo[testa][Number(coda)] = valore
  } else t.nodo[testa] = valore
  if (t.nodo.tipo === 'se' && campo === 'altrimenti' && valore === true) t.nodo.altrimenti = []
  return true
}

export function nuovoProgetto(prog, { nome, icona = '🧱', misure = [] }) {
  if (!Array.isArray(prog.progetti)) prog.progetti = []
  let id = 'p-' + (nome || 'progetto').toLowerCase().replace(/[^a-zà-ù0-9]+/g, '-').replace(/^-|-$/g, '') || 'p'
  while (prog.progetti.some(p => p.id === id)) id += '-bis'
  // Le misure arrivano come nomi o come { nome, tipo }.
  const voci = misure.map(m => (typeof m === 'string' ? { nome: m } : m))
  const nuovo = { id, nome: nome || 'progetto', icona, misure: voci.map(m => m.nome), corpo: [] }
  const colori = voci.filter(m => m.tipo === 'colore').map(m => m.nome)
  if (colori.length) nuovo.tipi = Object.fromEntries(colori.map(n => [n, 'colore']))
  prog.progetti.push(nuovo)
  return id
}

// Rinominare una misura si porta dietro le righe che la usano; aggiungerne o toglierne una sistema tutte le chiamate.
export function aggiornaProgetto(prog, id, { nome, icona, misure }) {
  const p = (prog.progetti || []).find(q => q.id === id)
  if (!p) return false
  if (nome) p.nome = nome
  if (icona) p.icona = icona
  if (Array.isArray(misure)) {
    const vecchie = p.misure || []
    // `misure` arriva come [{ nome, da }], dove `da` è il nome di prima (o null se è nuova).
    const nuove = misure.map(m => (typeof m === 'string' ? { nome: m, da: m } : m))
    for (const m of nuove)
      if (m.da && m.da !== m.nome) rinominaNumero(p.corpo, m.da, m.nome)
    p.misure = nuove.map(m => m.nome)
    // Una misura è un numero se non si dice altro; un colore lo dice `tipi`.
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
  // Le chiamate a un progetto che non c'è più se ne vanno con lui.
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

// I nomi leggibili in un punto del programma (misure del progetto, lavagnette, numeri dell'ordine), divisi per specie
// (una casella di numeri offre solo numeri, una di colori solo colori): è l'elenco che offre la casella di un valore.
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

// Quello che si sa già prima di premere ▶ (lavagnetta inesistente, progetto tolto, misura fuori posto): la vista
// li segna in rosso, prima che il robot ci si fermi davvero.
export function problemi(prog, lavagnetteOrdine = {}) {
  const trovati = []
  const corpi = [{ progetto: null, corpo: prog.principale }, ...(prog.progetti || []).map(p => ({ progetto: p.id, corpo: p.corpo }))]
  for (const { progetto, corpo } of corpi) {
    const noti = nomiLeggibili(prog, progetto, lavagnetteOrdine)
    const numeri = new Set([...noti.misure, ...noti.lavagnette, ...noti.ordine])
    // Una lavagnetta del bambino può portare un colore: di lei si sa la specie solo mentre gira.
    const colori = new Set([...noti.misureColore, ...noti.ordineColore, ...noti.lavagnette])
    const nomi = e => !e || typeof e !== 'object' ? [] : e.v ? [e.v] : e.op ? [...nomi(e.a), ...nomi(e.b)] : []
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
      const letti = [...nomi(i.quanto), ...nomi(i.volte), ...nomi(i.valore), ...argNumeri.flatMap(nomi)]
      controlla(letti, numeri, colori, 'non-un-numero', i.id)
      // «è uguale a» ammette anche due colori; minore e maggiore vogliono numeri.
      if (i.cond && i.cond.tipo === 'confronta') {
        const confrontati = [...nomi(i.cond.a), ...nomi(i.cond.b)]
        controlla(confrontati, i.cond.cmp === '=' ? new Set([...numeri, ...colori]) : numeri, colori, 'non-un-numero', i.id)
      }
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
      const scelta = primaDaScegliere(i, prog)
      if (scelta) trovati.push({ id: i.id, motivo: {
        numero: 'n-da-scegliere', valore: 'n-da-scegliere', colore: 'colore-da-scegliere', cond: 'condizione-da-scegliere',
        verso: 'verso-da-scegliere', lato: 'verso-da-scegliere', posto: 'posto-da-scegliere',
        lavagnetta: 'lavagnetta-mancante' }[scelta.tipo], ...scelta })
    }
  }
  return trovati
}

// Importa un progetto da un altro livello con quelli che chiama (vedi docs/costruttore/progetti.md);
// quelli già presenti per nome non si raddoppiano.
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
  // id di là → id di qua, per rifare le chiamate.
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
