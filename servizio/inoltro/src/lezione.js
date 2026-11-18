/* La lezione della scuola (docs/scuola/protocollo.md), senza niente di Cloudflare: così si prova con collegamenti finti.
   Le funzioni cambiano `stato` sul posto e tornano cosa mandare e a chi (`invii: [{ a, msg }]`) e cosa salvare
   (`meta`: lo stato senza le risposte; `risposte`: gli alunni di cui riscrivere l'elenco; `elimina`: quelli da buttare).
   `collegati`: i fili aperti adesso, [{ ws, ruolo: 'bambino' | 'maestra', posto }], senza i sostituiti. */
export const DURATA = 3 * 60 * 60 * 1000
export const POSTO = /^[a-z0-9]{8,24}$/
export const CHIAVE = /^[a-z0-9]{32}$/
export const MAX_BYTE = 2048
export const MAX_BYTE_LEZIONE = 8192
export const MAX_ALUNNI = 40
export const MAX_NUOVI = 10
export const MAX_NOME = 24
export const MAX_RISPOSTE = 600
export const MAX_AL_SECONDO = 20
export const MAX_COLLEGAMENTI = 60
export const MAX_POSTI = 200
export const CODICI_SBAGLIATI_AL_MINUTO = 60
export const LEZIONI_ORA = 20
const MAX_TESTO = 40

const CARATTERI = 'abcdefghijklmnopqrstuvwxyz0123456789'
export const nuovaChiave = casuali => Array.from(casuali, n => CARATTERI[n % CARATTERI.length]).join('')
export async function hashChiave(chiave) {
  const b = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(chiave))
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
}
export function chiaveGiusta(stato, hash) {
  const v = stato?.chiaveHash
  if (typeof v !== 'string' || typeof hash !== 'string' || v.length !== hash.length) return false
  let d = 0
  for (let i = 0; i < v.length; i++) d |= v.charCodeAt(i) ^ hash.charCodeAt(i)
  return d === 0
}

/* spazi in fila, niente caratteri di controllo, al massimo `max` caratteri */
export const nomePulito = (s, max = MAX_NOME) => String(s ?? '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max).trim()
const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)
const intero = (x, max) => Number.isInteger(x) && x >= 1 && x <= max
const MAX_BLOCCHI = 8, MAX_AVANTI = 1000, MAX_POSIZIONE = 10000
const TETTI_PASSA = { giuste: 500, domande: 500, minuti: 180 }
/* `passa`: null (lo dice la maestra) o un oggetto con una sola chiave fra giuste/domande/minuti */
const passaGiusto = p => {
  if (p === null) return true
  if (!oggetto(p)) return false
  const k = Object.keys(p)
  return k.length === 1 && k[0] in TETTI_PASSA && intero(p[k[0]], TETTI_PASSA[k[0]])
}
const blocchiGiusti = b => Array.isArray(b) && b.length >= 1 && b.length <= MAX_BLOCCHI
  && b.every(x => oggetto(x) && oggetto(x.esercizio) && x.passa !== undefined && passaGiusto(x.passa) && Object.keys(x).every(k => k === 'esercizio' || k === 'passa'))

/* il corpo di `POST /scuola/lezione`: torna la lezione e gli alunni ripuliti, o l'errore */
export function leggiCreazione(corpo) {
  if (!oggetto(corpo) || !oggetto(corpo.lezione) || !Array.isArray(corpo.alunni)) return { ok: false, errore: 'richiesta storta' }
  const l = corpo.lezione
  if (typeof l.id !== 'string' || !l.id || l.id.length > 40 || typeof l.nome !== 'string') return { ok: false, errore: 'lezione storta' }
  if (typeof l.inTondo !== 'boolean' || !blocchiGiusti(l.blocchi) || !Object.keys(l).every(k => ['id', 'nome', 'blocchi', 'inTondo'].includes(k))) return { ok: false, errore: 'lezione storta' }
  if (corpo.alunni.length > MAX_ALUNNI) return { ok: false, errore: 'troppi alunni' }
  const vistiId = new Set(), alunni = []
  for (const a of corpo.alunni) {
    const nome = nomePulito(a?.nome)
    if (!oggetto(a) || typeof a.id !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(a.id) || !nome || vistiId.has(a.id)) return { ok: false, errore: 'alunno storto' }
    vistiId.add(a.id)
    alunni.push({ id: a.id, nome })
  }
  return { ok: true, alunni, lezione: { id: l.id, nome: nomePulito(l.nome, 60), blocchi: l.blocchi.map(x => ({ esercizio: x.esercizio, passa: x.passa })), inTondo: l.inTondo } }
}

export const nuovaLezione = ({ lezione, alunni }, ora, chiaveHash) => ({
  nato: ora, scade: ora + DURATA, fase: 'attesa', avanti: 0, chiaveHash, lezione,
  alunni: alunni.map(a => ({ id: a.id, nome: a.nome, nuovo: false, posto: null, dove: null })),
  risposte: {}, presi: {},
})

/* ── cosa si racconta ── */
const alunnoDi = (stato, posto) => stato.alunni.find(a => a.posto === posto) || null
export const msgStato = (stato, posto) => {
  const io = alunnoDi(stato, posto)
  return { t: 'stato', fase: stato.fase, lezione: stato.lezione, avanti: stato.avanti || 0, alunni: stato.alunni.map(a => ({ id: a.id, nome: a.nome, preso: a.posto !== null })),
           io: io ? { id: io.id, nome: io.nome } : null, preso: stato.presi[posto] || 0 }
}
const collegatoA = (collegati, a) => a.posto !== null && collegati.some(c => c.ruolo === 'bambino' && c.posto === a.posto)
const elencoMaestra = (stato, collegati) => stato.alunni.map(a => ({ id: a.id, nome: a.nome, nuovo: a.nuovo, preso: a.posto !== null, collegato: collegatoA(collegati, a), dove: a.dove }))
export const msgAlunni = (stato, collegati) => ({ t: 'alunni', alunni: elencoMaestra(stato, collegati) })
export const msgTutto = (stato, collegati) => ({ t: 'tutto', fase: stato.fase, lezione: stato.lezione, scade: stato.scade, avanti: stato.avanti || 0, alunni: elencoMaestra(stato, collegati), risposte: stato.risposte })

const bambini = collegati => collegati.filter(c => c.ruolo === 'bambino')
const aMaestre = (collegati, msg) => collegati.filter(c => c.ruolo === 'maestra').map(c => ({ a: c.ws, msg }))
const stati = (stato, collegati) => bambini(collegati).map(c => ({ a: c.ws, msg: msgStato(stato, c.posto) }))
const nomiCambiati = (stato, collegati) => [...stati(stato, collegati), ...aMaestre(collegati, msgAlunni(stato, collegati))]

/* ── collegamenti ── */
export function entraBambino(stato, collegati, ws, posto) {
  const sostituiti = collegati.filter(c => c.ruolo === 'bambino' && c.posto === posto).map(c => c.ws)
  const dopo = [...collegati.filter(c => !sostituiti.includes(c.ws)), { ws, ruolo: 'bambino', posto }]
  return { sostituiti, invii: [{ a: ws, msg: msgStato(stato, posto) }, ...aMaestre(dopo, msgAlunni(stato, dopo))] }
}
export const entraMaestra = (stato, collegati, ws) => ({ invii: [{ a: ws, msg: msgTutto(stato, collegati) }] })
/* `collegati` senza quello che si chiude; se il posto è rientrato da un altro filo non cambia niente */
export function esceBambino(stato, collegati, posto) {
  if (collegati.some(c => c.ruolo === 'bambino' && c.posto === posto)) return { invii: [] }
  return { invii: aMaestre(collegati, msgAlunni(stato, collegati)) }
}

/* ── i messaggi ── */
const no = (ws, perche, n) => ({ invii: [{ a: ws, msg: n === undefined ? { t: 'no', perche } : { t: 'no', perche, n } }] })
const testo = x => typeof x === 'string' && x.length <= MAX_TESTO

export function daBambino(stato, collegati, ws, posto, dato, azzardo = () => Math.random().toString(36).slice(2, 8)) {
  if (dato.k === 'sono') {
    if (stato.fase === 'chiusa') return no(ws, 'chiusa')
    const io = alunnoDi(stato, posto)
    if (io) return io.id === dato.alunno ? { invii: [{ a: ws, msg: msgStato(stato, posto) }] } : no(ws, 'storto')
    if (typeof dato.alunno === 'string') {
      const a = stato.alunni.find(x => x.id === dato.alunno)
      if (!a) return no(ws, 'storto')
      if (a.posto !== null) return no(ws, 'preso')
      a.posto = posto
    } else {
      const nome = nomePulito(dato.nome)
      if (!nome || stato.alunni.filter(a => a.nuovo).length >= MAX_NUOVI) return no(ws, 'storto')
      let id
      do id = 'n' + azzardo(); while (stato.alunni.some(a => a.id === id))
      stato.alunni.push({ id, nome, nuovo: true, posto, dove: null })
    }
    return { meta: true, invii: nomiCambiati(stato, collegati) }
  }
  if (dato.k === 'risposta') {
    const n = Number.isInteger(dato.n) && dato.n >= 1 ? dato.n : undefined
    const io = alunnoDi(stato, posto)
    if (n === undefined || !io || !Number.isInteger(dato.blocco) || dato.blocco < 0 || dato.blocco > MAX_POSIZIONE || !['chiave', 'fatto', 'data', 'attesa'].every(c => testo(dato[c]))
        || typeof dato.giusta !== 'boolean' || !(dato.ultima === undefined || typeof dato.ultima === 'boolean') || !Number.isFinite(dato.ms) || dato.ms < 0 || dato.ms > 3600000) return no(ws, 'storto', n)
    if (stato.fase === 'chiusa') return no(ws, 'chiusa', n)
    if (stato.fase !== 'via') return no(ws, 'storto', n)
    const ultima = stato.presi[posto] || 0
    if (n <= ultima) return { invii: [{ a: ws, msg: { t: 'preso', n } }] }               // già presa: solo la conferma
    if (!(posto in stato.presi) && Object.keys(stato.presi).length >= MAX_POSTI) return no(ws, 'storto', n)
    stato.presi[posto] = n
    const lista = stato.risposte[io.id] ||= []
    const invii = [{ a: ws, msg: { t: 'preso', n } }]
    if (lista.length < MAX_RISPOSTE) {                                                  // oltre il tetto: ignorata, ma confermata
      const r = { n, blocco: dato.blocco, chiave: dato.chiave, fatto: dato.fatto, data: dato.data, attesa: dato.attesa, giusta: dato.giusta, ms: Math.round(dato.ms), ...(dato.ultima === false ? { ultima: false } : {}) }
      lista.push(r)
      invii.push(...aMaestre(collegati, { t: 'risposta', alunno: io.id, r }))
    }
    return { meta: true, risposte: [io.id], invii }
  }
  if (dato.k === 'dove') {
    const io = alunnoDi(stato, posto)
    if (!io || !(dato.dove === 'finito' || (Number.isInteger(dato.dove) && dato.dove >= 0 && dato.dove <= MAX_POSIZIONE))) return no(ws, 'storto')
    if (io.dove === dato.dove) return { invii: [] }
    io.dove = dato.dove
    return { meta: true, invii: aMaestre(collegati, msgAlunni(stato, collegati)) }
  }
  return { invii: [] }
}

export function daMaestra(stato, collegati, dato) {
  if (dato.k === 'via' && stato.fase === 'attesa') { stato.fase = 'via'; return { meta: true, invii: [...aMaestre(collegati, { t: 'fase', fase: 'via' }), ...stati(stato, collegati)] } }
  if (dato.k === 'avanti' && stato.fase === 'via') {
    stato.avanti = Math.min(MAX_AVANTI, (stato.avanti || 0) + 1)
    return { meta: true, invii: [...aMaestre(collegati, { t: 'avanti', avanti: stato.avanti }), ...stati(stato, collegati)] }
  }
  if (dato.k === 'chiudi' && stato.fase !== 'chiusa') { stato.fase = 'chiusa'; return { meta: true, invii: [...aMaestre(collegati, { t: 'fase', fase: 'chiusa' }), ...stati(stato, collegati)] } }
  const a = typeof dato.alunno === 'string' ? stato.alunni.find(x => x.id === dato.alunno) : null
  if (dato.k === 'libera' && a && a.posto !== null) { a.posto = null; a.dove = null; return { meta: true, invii: nomiCambiati(stato, collegati) } }
  if (dato.k === 'togli' && a && a.nuovo) {
    stato.alunni = stato.alunni.filter(x => x !== a)
    delete stato.risposte[a.id]
    return { meta: true, elimina: [a.id], invii: nomiCambiati(stato, collegati) }
  }
  return { invii: [] }
}

/* un messaggio in arrivo: di testo, piccolo, un oggetto con `k`, e non più di `MAX_AL_SECONDO` al secondo.
   `recenti`: gli istanti (ms) dei messaggi di questo collegamento nell'ultimo secondo */
export function leggiMessaggio(messaggio, recenti, ora) {
  if (typeof messaggio !== 'string' || messaggio.length > MAX_BYTE) return { ok: false, codice: 1009, ragione: 'messaggio troppo grande' }
  const r = recenti.filter(t => ora - t < 1000)
  r.push(ora)
  if (r.length > MAX_AL_SECONDO) return { ok: false, codice: 1008, ragione: 'troppi messaggi' }
  let dato
  try { dato = JSON.parse(messaggio) } catch { return { ok: false, codice: 1003, ragione: 'non è un messaggio' } }
  if (!oggetto(dato) || typeof dato.k !== 'string') return { ok: false, codice: 1003, ragione: 'non è un messaggio' }
  return { ok: true, recenti: r, dato }
}
