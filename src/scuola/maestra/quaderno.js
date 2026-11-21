/* Il quaderno della maestra: classi, lezioni, storico e la lezione in corso, solo nel suo browser. Funzioni pure (lo
   storage si passa da fuori); quelle che cambiano il quaderno lo cambiano sul posto. Vedi docs/scuola/quaderno.md. */
import * as L from '../comune/lezione.js'

export const CHIAVI = { classi: 'scuola:classi', lezioni: 'scuola:lezioni', storico: 'scuola:storico', inCorso: 'scuola:in-corso' }
export const FORMATO = 'educagioco-quaderno'
export const VERSIONE = 1
export const MAX_ALUNNI = 40          // i tetti del servizio (docs/scuola/protocollo.md)
export const MAX_NOME = 24
export const MAX_NOME_LEZIONE = L.MAX_NOME_LEZIONE
export const MAX_NOME_CLASSE = 40
const MAX_SBAGLIATE = 20              // per alunno e lezione: le più sbagliate, le altre si lasciano
const ULTIME = 3
const DETTE = 3

const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)
const testo = (x, max) => typeof x === 'string' && x.length <= max
const conta = x => (Number.isInteger(x) && x >= 0 ? x : 0)
const ID = /^[A-Za-z0-9_-]{1,40}$/
const ID_ALUNNO = /^[A-Za-z0-9_-]{1,32}$/

export const vuoto = () => ({ classi: [], lezioni: [], storico: [], inCorso: null })

export function nuovoId(prefisso) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const r = globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint8Array(10)) : Array.from({ length: 10 }, () => Math.floor(Math.random() * 256))
  return prefisso + Array.from(r, n => c[n % c.length]).join('')
}

/* ══════════════ i nomi e le classi ══════════════ */

// come il servizio: spazi in fila, niente caratteri di controllo, al massimo `max` caratteri
export const nomePulito = (s, max = MAX_NOME) => String(s ?? '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max).trim()
const perConfronto = s => nomePulito(s, 999).toLocaleLowerCase('it')

/* Un nome per riga, anche incollato da un foglio di calcolo (le colonne diventano spazi) o da un elenco numerato.
   Chi riscrive gli stessi nomi tiene gli stessi id: lo storico del bambino resta suo. */
export function alunniDaTesto(testoScritto, vecchi = []) {
  const liberi = vecchi.slice()
  const alunni = [], accorciati = [], doppi = [], visti = new Set()
  for (const riga of String(testoScritto ?? '').split(/\r?\n/)) {
    const senzaNumero = riga.replace(/\t/g, ' ').replace(/^\s*(?:\d+\s*[.):-]|[-•*·–])\s*/, '')
    const intero = nomePulito(senzaNumero, 999)
    if (!intero) continue
    const nome = nomePulito(intero)
    if (nome !== intero) accorciati.push(nome)
    const k = perConfronto(nome)
    if (visti.has(k)) doppi.push(nome)
    visti.add(k)
    const i = liberi.findIndex(a => perConfronto(a.nome) === k)
    const id = i >= 0 ? liberi.splice(i, 1)[0].id : nuovoId('a')
    alunni.push({ id, nome })
  }
  return { alunni, accorciati, doppi, troppi: alunni.length > MAX_ALUNNI }
}

export const testoDegliAlunni = classe => classe.alunni.map(a => a.nome).join('\n')

// l'anno della primaria (1..5), facoltativo: una classe senza anno non ha il campo
export const annoValido = a => Number.isInteger(a) && a >= 1 && a <= 5
const conAnno = (id, nome, anno, alunni) => ({ id, nome, ...(annoValido(anno) ? { anno } : {}), alunni })

export function nuovaClasse(nome = '', anno = null) { return conAnno(nuovoId('c'), nomePulito(nome, MAX_NOME_CLASSE), anno, []) }

const sostituisci = (lista, voce) => {
  const i = lista.findIndex(x => x.id === voce.id)
  if (i >= 0) lista.splice(i, 1, voce)
  else lista.push(voce)
  return i >= 0
}

export function salvaClasse(q, classe) { sostituisci(q.classi, classe) }
export function cancellaClasse(q, id) { q.classi = q.classi.filter(c => c.id !== id) }        // lo storico resta

/* un «nuovo» di una lezione entra nella classe con l'id che aveva nella lezione: lo storico lo ritrova */
export function aggiungiAllaClasse(q, classeId, alunno) {
  const c = q.classi.find(x => x.id === classeId)
  if (!c || c.alunni.some(a => a.id === alunno.id) || c.alunni.length >= MAX_ALUNNI) return false
  c.alunni.push({ id: alunno.id, nome: nomePulito(alunno.nome) })
  return true
}

/* ══════════════ le lezioni ══════════════ */

// un blocco che passa da solo dopo le giuste: la scelta di partenza (docs/scuola/lezione.md)
export const passaDiBase = (modo = 'maestra') => {   // di base la maestra: «Avanti tutti» (scelta dell'utente)
  const m = L.MODI_PASSA.find(x => x.id === modo)
  return m?.unita ? { [m.id]: m.base } : null
}

export function nuovaLezione(esercizio) {
  return { id: nuovoId('l'), nome: '', blocchi: [{ esercizio, passa: passaDiBase() }], inTondo: false }
}

// la lezione a blocchi di comune/lezione.js, con un nome che non sia solo spazi e un id che sta in un attributo
export const lezioneValida = l => L.lezioneValida(l) && ID.test(l.id) && !!nomePulito(l.nome, MAX_NOME_LEZIONE)

export function salvaLezione(q, l) {
  if (!lezioneValida(l)) return false
  sostituisci(q.lezioni, JSON.parse(JSON.stringify(l)))
  return true
}

export function duplicaLezione(q, id) {
  const l = q.lezioni.find(x => x.id === id)
  if (!l) return null
  const copia = { ...JSON.parse(JSON.stringify(l)), id: nuovoId('l'), nome: nomePulito(`${l.nome} (copia)`, MAX_NOME_LEZIONE) }
  q.lezioni.splice(q.lezioni.indexOf(l) + 1, 0, copia)
  return copia
}

export function cancellaLezione(q, id) { q.lezioni = q.lezioni.filter(l => l.id !== id) }

/* ══════════════ il link di una lezione ══════════════ */

function aBase64url(s) {
  let bin = ''
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function daBase64url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)))
}

export const linkDellaLezione = (l, pagina) => `${String(pagina).split('#')[0]}#lezione=${aBase64url(JSON.stringify(l))}`
// «Prova la lezione»: la pagina dei bambini con la lezione dentro, che la fa partire su quel PC senza servizio (docs/scuola/quaderno.md)
export const linkDiProva = (l, paginaBambini) => `${String(paginaBambini).split('#')[0]}#prova=${aBase64url(JSON.stringify(l))}`

/* da un indirizzo intero o dal solo `#…`; null se manca o se la lezione non è valida (un link manomesso non entra) */
export function lezioneDalLink(indirizzo) {
  const m = /#(?:.*&)?lezione=([A-Za-z0-9_-]+)/.exec(String(indirizzo ?? ''))
  if (!m) return null
  try {
    const l = L.convertiLezione(JSON.parse(daBase64url(m[1])))       // un link di prima porta obiettivo e «se hai finito»
    return lezioneValida(l) ? l : null
  } catch { return null }
}

/* ══════════════ lo storico: un riassunto per alunno, non ogni risposta ══════════════ */

/* `blocchi[i]`: fatte e giuste del blocco i, sommate su tutti i giri se la lezione è in tondo */
const contoVuoto = () => ({ fatte: 0, giuste: 0 })
export const riassuntoVuoto = (n = 1) => ({ presente: false, blocchi: Array.from({ length: n }, contoVuoto), sbagliate: [], ultime: [] })
const quantiBlocchi = voce => Math.max(1, voce?.lezione?.blocchi?.length | 0)

/* il blocco di una risposta: `blocco` è la posizione del bambino (in tondo cresce a ogni giro); una risposta di prima
   dei blocchi ha `parte` ('obiettivo' o 'dopo') */
export function bloccoDellaRisposta(r, n) {
  if (Number.isInteger(r?.blocco) && r.blocco >= 0) return r.blocco % n
  return r?.parte === 'dopo' ? Math.min(1, n - 1) : 0
}

/* la voce dello storico nasce all'avvio, con gli alunni della classe; codice e chiave restano finché il servizio la tiene */
export function nuovaVoce({ classe, lezione, codice, chiave, scade, ora }) {
  return {
    id: nuovoId('v'), classe: classe.id, nomeClasse: classe.nome, lezione: JSON.parse(JSON.stringify(lezione)),
    avviata: ora, codice, chiave, scade, chiusa: false,
    alunni: classe.alunni.map(a => ({ id: a.id, nome: a.nome, nuovo: false })),
    esiti: {},
  }
}

function conta1(es, r, n) {
  const b = bloccoDellaRisposta(r, n)
  const conto = (es.blocchi[b] ||= contoVuoto())
  const chiude = r.ultima !== false            // un colpo sbagliato con la domanda ancora aperta: è fra le sbagliate, non fra le fatte
  if (chiude) conto.fatte++
  if (r.giusta) { if (chiude) conto.giuste++; return }
  const fatto = String(r.fatto ?? ''), attesa = String(r.attesa ?? ''), data = String(r.data ?? '')
  let s = es.sbagliate.find(x => x.fatto === fatto && x.attesa === attesa)
  if (!s) { s = { fatto, attesa, volte: 0, dette: [] }; es.sbagliate.push(s) }
  s.volte++
  if (data && !s.dette.includes(data)) { s.dette.push(data); if (s.dette.length > DETTE) s.dette.shift() }
  es.sbagliate.sort((a, b) => b.volte - a.volte)
  if (es.sbagliate.length > MAX_SBAGLIATE) es.sbagliate.length = MAX_SBAGLIATE
  es.ultime.unshift({ blocco: b, fatto, data, attesa })
  if (es.ultime.length > ULTIME) es.ultime.length = ULTIME
}

const esitoDi = (voce, id) => (voce.esiti[id] ||= riassuntoVuoto(quantiBlocchi(voce)))

export function aggiungiRisposta(voce, alunnoId, r) {
  if (!voce || typeof alunnoId !== 'string' || !oggetto(r)) return
  const es = esitoDi(voce, alunnoId)
  es.presente = true
  conta1(es, r, quantiBlocchi(voce))
}

/* per il pannello: fatte e giuste di ogni alunno a ogni posizione (il blocco di questo giro, non la somma dei giri).
   Non si salva: `tutto` lo rifà da capo. `conti`: { <alunno>: { <posizione>: { fatte, giuste } } } */
export function contaPosizione(conti, alunnoId, r) {
  if (!oggetto(conti) || typeof alunnoId !== 'string' || !oggetto(r)) return
  const p = Number.isInteger(r.blocco) && r.blocco >= 0 ? r.blocco : 0
  const c = ((conti[alunnoId] ||= {})[p] ||= contoVuoto())
  if (r.ultima === false) return
  c.fatte++
  if (r.giusta) c.giuste++
}
export function contiDelleRisposte(risposte) {
  const conti = {}
  for (const [id, lista] of Object.entries(oggetto(risposte) ? risposte : {}))
    if (Array.isArray(lista)) for (const r of lista) contaPosizione(conti, id, r)
  return conti
}

const segnaPresenti = (voce, alunni) => {
  for (const a of alunni) if (a.collegato || a.dove) esitoDi(voce, a.id).presente = true
}

/* a ogni cambio di nomi: i nuovi entrano, quelli tolti dalla maestra escono con le loro risposte */
export function aggiornaAlunni(voce, alunni) {
  if (!voce || !Array.isArray(alunni)) return
  voce.alunni = alunni.map(a => ({ id: a.id, nome: a.nome, nuovo: !!a.nuovo }))
  for (const id of Object.keys(voce.esiti)) if (!alunni.some(a => a.id === id)) delete voce.esiti[id]
  segnaPresenti(voce, alunni)
}

/* `tutto` è tutto quello che il servizio sa: il riassunto si rifà da capo (un rientro non conta due volte) */
export function ricalcola(voce, tutto) {
  if (!voce || !oggetto(tutto)) return
  const prima = voce.esiti
  voce.esiti = {}
  aggiornaAlunni(voce, Array.isArray(tutto.alunni) ? tutto.alunni : voce.alunni)
  for (const a of voce.alunni) {
    const lista = tutto.risposte?.[a.id]
    if (prima[a.id]?.presente) esitoDi(voce, a.id).presente = true
    if (!Array.isArray(lista)) continue
    const es = esitoDi(voce, a.id)
    es.presente = true
    for (const r of [...lista].sort((x, y) => (x.n ?? 0) - (y.n ?? 0))) conta1(es, r, quantiBlocchi(voce))
  }
  if (Number.isFinite(tutto.scade)) voce.scade = tutto.scade
}

/* oltre la scadenza il servizio ha cancellato tutto: la lezione si chiude qui, e la chiave non serve più */
export function pulisciScadute(q, ora) {
  let cambiato = false
  for (const v of q.storico) {
    if (v.chiave && !(ora < v.scade)) { v.chiave = null; v.chiusa = true; cambiato = true }
  }
  if (q.inCorso && !(ora < q.inCorso.scade)) {
    const v = q.storico.find(x => x.id === q.inCorso.voce)
    if (v) v.chiusa = true
    q.inCorso = null
    cambiato = true
  }
  return cambiato
}

export const recuperabile = (v, ora) => !!v?.chiave && ora < v.scade

/* ══════════════ il resoconto e lo storico ══════════════ */

// i conti di un alunno, uno per blocco della lezione (anche per chi non ha risposto: zero)
const contiPerBlocco = (voce, es) => Array.from({ length: quantiBlocchi(voce) }, (_, i) => ({ ...contoVuoto(), ...es?.blocchi?.[i] }))
const ha = conti => conti.some(c => c.fatte > 0)

export function righeResoconto(voce) {
  return voce.alunni.map(a => {
    const es = voce.esiti[a.id] || riassuntoVuoto()
    const blocchi = contiPerBlocco(voce, es)
    return { id: a.id, nome: a.nome, nuovo: a.nuovo, presente: es.presente || ha(blocchi), blocchi,
             sbagliate: es.sbagliate.slice(0, 3), ultime: es.ultime }
  })
}

// le domande sbagliate di più bambini, poi di più volte
/* `gruppi`: [{ nome?, lista }] (un bambino, o una lezione). `chi`: chi l'ha sbagliata, con cosa ha detto; `dette`: tutte le
   risposte date (la maestra vede l'errore, non solo il conto: l'utente) */
function sommaSbagliate(gruppi, quante) {
  const m = new Map()
  for (const { nome, lista } of gruppi) {
    for (const s of lista) {
      const k = s.fatto + '\u0000' + s.attesa
      const x = m.get(k) || { fatto: s.fatto, attesa: s.attesa, volte: 0, quanti: 0, dette: [], chi: [] }
      x.volte += s.volte
      x.quanti++
      for (const d of s.dette || []) if (!x.dette.includes(d)) x.dette.push(d)
      if (nome) x.chi.push({ nome, dette: [...(s.dette || [])], volte: s.volte })
      m.set(k, x)
    }
  }
  return [...m.values()].sort((a, b) => b.quanti - a.quanti || b.volte - a.volte).slice(0, quante)
}

/* `quanti`: i bambini che l'hanno sbagliata, `chi` i loro nomi */
export const piuSbagliate = (voce, quante = 10) =>
  sommaSbagliate(voce.alunni.map(a => ({ nome: a.nome, lista: voce.esiti[a.id]?.sbagliate || [] })), quante)

export const vociDellaClasse = (q, classeId) =>
  q.storico.filter(v => v.classe === classeId).sort((a, b) => b.avviata - a.avviata)

/* le classi che hanno uno storico, anche se cancellate (il nome lo tiene la voce) */
export function classiNelloStorico(q) {
  const m = new Map()
  for (const c of q.classi) m.set(c.id, { id: c.id, nome: c.nome, lezioni: 0, cancellata: false })
  for (const v of q.storico) {
    if (!m.has(v.classe)) m.set(v.classe, { id: v.classe, nome: v.nomeClasse, lezioni: 0, cancellata: true })
    m.get(v.classe).lezioni++
  }
  return [...m.values()].filter(c => c.lezioni > 0)
}

/* lezione per lezione (la più recente prima), e `quanti` qui sono le lezioni in cui l'ha sbagliata */
export function storicoDelBambino(q, classeId, alunnoId) {
  const voci = vociDellaClasse(q, classeId).filter(v => v.alunni.some(a => a.id === alunnoId))
  const lezioni = voci.map(v => {
    const es = v.esiti[alunnoId]
    const blocchi = contiPerBlocco(v, es)
    return { voce: v.id, avviata: v.avviata, nome: v.lezione.nome, presente: !!es?.presente || ha(blocchi), blocchi }
  })
  return { lezioni, sbaglia: sommaSbagliate(voci.map(v => ({ lista: v.esiti[alunnoId]?.sbagliate || [] })), 8) }
}

/* ══════════════ il CSV del resoconto ══════════════ */

// punto e virgola (il foglio di calcolo italiano), e un nome che comincia con = + - @ non diventa una formula
const cella = v => {
  let s = String(v ?? '')
  if (/^[=+\-@]/.test(s)) s = "'" + s
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const dettaSbagliata = s => `${s.fatto} → ${s.attesa}${s.volte > 1 ? ` (${s.volte} volte)` : ''}`

export function csvResoconto(voce) {
  const blocchi = Array.from({ length: quantiBlocchi(voce) }, (_, i) => [`Blocco ${i + 1}: fatte`, `Blocco ${i + 1}: giuste`]).flat()
  const righe = [['Bambino', 'Nuovo', ...blocchi, 'Domande sbagliate']]
  for (const r of righeResoconto(voce)) {
    const es = voce.esiti[r.id]
    righe.push([r.nome, r.nuovo ? 'sì' : '', ...r.blocchi.flatMap(c => [c.fatte, c.giuste]),
      (es?.sbagliate || []).map(dettaSbagliata).join(', ')])
  }
  return righe.map(r => r.map(cella).join(';')).join('\r\n') + '\r\n'
}

/* ══════════════ la forma: da localStorage e dal file ══════════════ */

function normalizzaClasse(c) {
  if (!oggetto(c) || typeof c.id !== 'string' || !ID.test(c.id) || typeof c.nome !== 'string' || !Array.isArray(c.alunni)) return null
  const alunni = [], visti = new Set()
  for (const a of c.alunni) {
    if (!oggetto(a) || typeof a.id !== 'string' || !ID_ALUNNO.test(a.id) || visti.has(a.id) || !nomePulito(a.nome)) return null
    visti.add(a.id)
    alunni.push({ id: a.id, nome: nomePulito(a.nome) })
  }
  return conAnno(c.id, nomePulito(c.nome, MAX_NOME_CLASSE), c.anno, alunni)
}

/* la forma e basta: una lezione il cui esercizio non c'è più nel catalogo si tiene (si vede «non valido» e non si avvia).
   Una lezione di prima (obiettivo e «se hai finito») diventa a blocchi. */
function normalizzaLezione(x) {
  const l = L.convertiLezione(x)
  if (!oggetto(l) || typeof l.id !== 'string' || !ID.test(l.id) || typeof l.nome !== 'string') return null
  if (!Array.isArray(l.blocchi) || !l.blocchi.length || l.blocchi.length > L.MAX_BLOCCHI) return null
  if (!l.blocchi.every(b => oggetto(b) && oggetto(b.esercizio) && 'passa' in b && L.passaValido(b.passa))) return null
  return JSON.parse(JSON.stringify({ id: l.id, nome: l.nome.slice(0, MAX_NOME_LEZIONE),
    blocchi: l.blocchi.map(b => ({ esercizio: b.esercizio, passa: b.passa })), inTondo: l.inTondo === true }))
}

function normalizzaSbagliata(s) {
  if (!oggetto(s) || !testo(s.fatto, 200) || !testo(s.attesa, 200)) return null
  return { fatto: s.fatto, attesa: s.attesa, volte: Math.max(1, conta(s.volte)),
           dette: Array.isArray(s.dette) ? s.dette.filter(d => testo(d, 200)).slice(-DETTE) : [] }
}

/* `n`: i blocchi della lezione. Un riassunto di prima ha `obiettivo` e `dopo`: sono i blocchi 0 e 1 */
function normalizzaRiassunto(e, n) {
  if (!oggetto(e)) return null
  const conto1 = p => { const f = conta(p?.fatte); return { fatte: f, giuste: Math.min(f, conta(p?.giuste)) } }
  const prima = Array.isArray(e.blocchi) ? e.blocchi : [e.obiettivo, e.dopo]
  const bloccoDi = u => (Number.isInteger(u.blocco) && u.blocco >= 0 && u.blocco < n ? u.blocco : u.parte === 'dopo' ? Math.min(1, n - 1) : 0)
  return {
    presente: !!e.presente, blocchi: Array.from({ length: n }, (_, i) => conto1(prima[i])),
    sbagliate: (Array.isArray(e.sbagliate) ? e.sbagliate : []).map(normalizzaSbagliata).filter(Boolean).slice(0, MAX_SBAGLIATE),
    ultime: (Array.isArray(e.ultime) ? e.ultime : []).filter(u => oggetto(u) && testo(u.fatto, 200) && testo(u.data, 200) && testo(u.attesa, 200))
      .slice(0, ULTIME).map(u => ({ blocco: bloccoDi(u), fatto: u.fatto, data: u.data, attesa: u.attesa })),
  }
}

function normalizzaVoce(v) {
  if (!oggetto(v) || typeof v.id !== 'string' || !ID.test(v.id) || typeof v.classe !== 'string' || !Number.isFinite(v.avviata)) return null
  const lezione = L.convertiLezione(v.lezione)          // una voce di prima ha la lezione con obiettivo e «se hai finito»
  if (!oggetto(lezione) || typeof lezione.nome !== 'string' || !Array.isArray(lezione.blocchi) || !lezione.blocchi.length || !Array.isArray(v.alunni)) return null
  const n = lezione.blocchi.length
  const alunni = []
  for (const a of v.alunni) {
    if (!oggetto(a) || typeof a.id !== 'string' || !ID_ALUNNO.test(a.id) || typeof a.nome !== 'string') return null
    alunni.push({ id: a.id, nome: a.nome.slice(0, MAX_NOME), nuovo: !!a.nuovo })
  }
  const esiti = {}
  for (const [id, e] of Object.entries(oggetto(v.esiti) ? v.esiti : {})) {
    const r = normalizzaRiassunto(e, n)
    if (r && alunni.some(a => a.id === id)) esiti[id] = r
  }
  const chiave = typeof v.chiave === 'string' && /^[a-z0-9]{32}$/.test(v.chiave) ? v.chiave : null
  return {
    id: v.id, classe: v.classe, nomeClasse: typeof v.nomeClasse === 'string' ? v.nomeClasse : '', lezione: JSON.parse(JSON.stringify(lezione)),
    avviata: v.avviata, codice: typeof v.codice === 'string' ? v.codice : '', chiave, scade: Number.isFinite(v.scade) ? v.scade : v.avviata,
    chiusa: !!v.chiusa, alunni, esiti,
  }
}

function normalizzaInCorso(c, storico) {
  if (!oggetto(c) || !/^\d{4}$/.test(c.codice || '') || !/^[a-z0-9]{32}$/.test(c.chiave || '') || !Number.isFinite(c.scade)) return null
  if (!storico.some(v => v.id === c.voce)) return null
  return { codice: c.codice, chiave: c.chiave, scade: c.scade, avviata: Number.isFinite(c.avviata) ? c.avviata : 0,
           classe: String(c.classe ?? ''), lezione: L.convertiLezione(c.lezione), voce: c.voce }
}

// una lista di voci: le storte si contano e si lasciano, le altre passano (e un id doppio vale una volta, l'ultima)
function lista(x, normalizza) {
  if (!Array.isArray(x)) return { voci: [], scartate: x === undefined ? 0 : 1 }
  const voci = [], scartate = { n: 0 }
  for (const v of x) {
    const n = normalizza(v)
    if (n) sostituisci(voci, n)
    else scartate.n++
  }
  return { voci, scartate: scartate.n }
}

/* ══════════════ localStorage ══════════════ */

function leggi(storage, k) {
  try { const v = storage?.getItem(k); return v == null ? undefined : JSON.parse(v) } catch { return undefined }
}

export function carica(storage) {
  const q = vuoto()
  q.classi = lista(leggi(storage, CHIAVI.classi) ?? [], normalizzaClasse).voci
  q.lezioni = lista(leggi(storage, CHIAVI.lezioni) ?? [], normalizzaLezione).voci
  q.storico = lista(leggi(storage, CHIAVI.storico) ?? [], normalizzaVoce).voci
  q.inCorso = normalizzaInCorso(leggi(storage, CHIAVI.inCorso), q.storico)
  return q
}

/* torna false se il browser non ha scritto (pieno, o vietato) */
export function salva(q, storage, parti = Object.keys(CHIAVI)) {
  let ok = true
  for (const p of parti) {
    try {
      if (p === 'inCorso' && !q.inCorso) storage.removeItem(CHIAVI.inCorso)
      else storage.setItem(CHIAVI[p], JSON.stringify(q[p]))
    } catch { ok = false }
  }
  return ok
}

/* ══════════════ il file del quaderno ══════════════ */

// la lezione in corso non viaggia: codice e chiave stanno già nella sua voce dello storico, finché servono
export function esporta(q, ora = Date.now()) {
  return { formato: FORMATO, versione: VERSIONE, salvato: new Date(ora).toISOString(),
           classi: q.classi, lezioni: q.lezioni, storico: q.storico }
}

export const nomeDelFile = (ora = Date.now()) => `quaderno-scuola-${new Date(ora).toISOString().slice(0, 10)}.json`

/* il testo di un file: { ok: true, quaderno, scartate } o { ok: false, errore } con la frase per la maestra */
export function leggiQuaderno(testoFile) {
  let d
  try { d = JSON.parse(String(testoFile ?? '')) } catch { return { ok: false, errore: 'Questo file non è un quaderno: non si riesce a leggerlo.' } }
  if (!oggetto(d) || d.formato !== FORMATO) return { ok: false, errore: 'Questo file non è un quaderno della scuola.' }
  if (!(Number.isInteger(d.versione) && d.versione >= 1 && d.versione <= VERSIONE))
    return { ok: false, errore: 'Questo quaderno è stato salvato da una versione più nuova della pagina: aggiorna la pagina e riprova.' }
  const classi = lista(d.classi ?? [], normalizzaClasse)
  const lezioni = lista(d.lezioni ?? [], normalizzaLezione)
  const storico = lista(d.storico ?? [], normalizzaVoce)
  return { ok: true, quaderno: { classi: classi.voci, lezioni: lezioni.voci, storico: storico.voci },
           scartate: classi.scartate + lezioni.scartate + storico.scartate }
}

/* una voce con lo stesso id si sostituisce, le altre si aggiungono */
export function unisci(q, altro) {
  const conto = { nuove: 0, sostituite: 0 }
  for (const k of ['classi', 'lezioni', 'storico']) {
    for (const v of altro[k] || []) {
      if (q.inCorso && k === 'storico' && v.id === q.inCorso.voce) continue      // quella che sta arrivando adesso vince
      if (sostituisci(q[k], JSON.parse(JSON.stringify(v)))) conto.sostituite++
      else conto.nuove++
    }
  }
  return conto
}

/* ══════════════ come si dice una lezione ══════════════ */

// una riga per blocco, numerata se sono più d'uno, e il giro se è in tondo
export function righeDellaLezione(l) {
  const blocchi = Array.isArray(l?.blocchi) ? l.blocchi : []
  const righe = blocchi.map((b, i) => (blocchi.length > 1 ? `${i + 1}. ` : '') + L.descriviBlocco(b))
  if (l?.inTondo) righe.push('In tondo: dopo l\'ultimo blocco si ricomincia dal primo')
  return righe
}
