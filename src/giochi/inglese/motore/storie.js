// Le storie del libro sulla mappa: quando se ne apre una, quale si legge
// adesso e quale dopo. Le storie lette stanno in profile.campagne.inglese,
// accanto alle tappe vinte: `lette: { <id capitolo>: <quando> }`, l'ultima
// volta che si è arrivati al cartello di fine; le storie a puntate tengono
// lì le variabili della serie: `serie: { <id>: { valori, fatte } }`. Le
// regole (`r`) sono quelle di motore/mappa.js. Il perché:
// docs/lingue/libro.md («Quale storia») e docs/lingue/libro-domande.md.
import { MONDI, mondoDi, tappaDi } from '../dati/mondi.js'
import { mondoAperto, mondoPassato, vinta } from './mappa.js'
import { tappaDellaStoria, tira, tiraConFissi, chiaveDelValore } from './libro.js'

const regole = r => (typeof r === 'boolean' ? { tutto: r } : r || {})
const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)

export const lette = c => (c && oggetto(c.lette) ? c.lette : {})

// Segna una storia letta adesso: conta l'ultima volta, perché la prossima
// da rileggere è quella letta da più tempo.
export function segnaLetta(c, id, ora = Date.now()) {
  if (!oggetto(c.lette)) c.lette = {}
  c.lette[id] = ora
}

// l'ordine delle storie: per mondo, poi dalla tappa da cui si aprono, poi per
// id; le puntate di una serie in fila, col nome della serie al posto dell'id
const posto = cap => {
  const m = mondoDi(cap.mondo)
  const i = m ? m.tappe.findIndex(t => t.id === tappaDellaStoria(cap)) : -1
  return [MONDI.indexOf(m), i, cap.serie ? `${cap.serie}#${String(cap.puntata).padStart(3, '0')}` : cap.id]
}
export function inOrdine(capitoli) {
  return capitoli.slice().sort((a, b) => {
    const [ma, ta, ka] = posto(a), [mb, tb, kb] = posto(b)
    return ma - mb || ta - tb || ka.localeCompare(kb)
  })
}

/* ═══════════ le storie a puntate ═══════════ */
export const serieDi = c => (c && oggetto(c.serie) ? c.serie : {})
export const puntataDi = (capitoli, serie, n) => capitoli.find(x => x.serie === serie && x.puntata === n) || null

// Una storia si legge quando la sua tappa è vinta, come la tappa dopo;
// «Sblocca tutti» e un mondo passato per età aprono tutto. Una puntata dopo
// la prima vuole anche la puntata prima letta, sempre: una serie si legge in fila.
export function storiaAperta(c, cap, r, capitoli = []) {
  const { tutto = false, eta = null } = regole(r)
  if (!mondoAperto(c, cap.mondo, r)) return false
  if (cap.serie && cap.puntata > 1) {
    const prima = puntataDi(capitoli, cap.serie, cap.puntata - 1)
    if (!prima || !lette(c)[prima.id]) return false
  }
  if (tutto || mondoPassato(cap.mondo, eta)) return true
  const t = tappaDellaStoria(cap)
  return !!t && vinta(c, t)
}

// Il mondo tirato di una storia. Per una puntata: le variabili già tirate
// dalla serie restano quelle, le nuove si tirano adesso e si aggiungono. La
// prima puntata ritira tutto: rileggere una serie da capo è un'altra avventura.
export function tiraLaStoria(c, cap, rnd = Math.random) {
  if (!cap.serie) return tira(cap, rnd)
  if (!oggetto(c.serie)) c.serie = {}
  let s = c.serie[cap.serie]
  if (cap.puntata === 1 || !oggetto(s) || !oggetto(s.valori)) s = c.serie[cap.serie] = { valori: {}, fatte: 0 }
  const v = tiraConFissi(cap, s.valori, rnd)
  for (const nome of Object.keys(cap.variabili)) s.valori[nome] = chiaveDelValore(v[nome])
  return v
}

// Letta una puntata: la serie si ricorda fin dove si è arrivati in questa avventura
export function segnaPuntata(c, cap) {
  if (!cap.serie) return
  const s = serieDi(c)[cap.serie]
  if (oggetto(s)) s.fatte = Math.max(Number(s.fatte) || 0, cap.puntata)
}

// La puntata dopo quella appena letta, se c'è e si può leggere
export function puntataDopo(capitoli, c, r, cap) {
  const dopo = cap.serie ? puntataDi(capitoli, cap.serie, cap.puntata + 1) : null
  return dopo && storiaAperta(c, dopo, r, capitoli) ? dopo : null
}

/* ═══════════ quale storia ═══════════ */
export const storieAperte = (capitoli, c, r, mondo) =>
  inOrdine(capitoli).filter(cap => cap.mondo === mondo && storiaAperta(c, cap, r, capitoli))

const nonLetta = c => cap => !lette(c)[cap.id]
const piuVecchia = (c, caps) => caps.reduce((a, b) => (lette(c)[b.id] < lette(c)[a.id] ? b : a), caps[0])

// La storia che il libro di un mondo apre: la prima non letta; se sono
// tutte lette, quella letta da più tempo. Null se nessuna è aperta.
export function prossimaStoria(capitoli, c, r, mondo) {
  const aperte = storieAperte(capitoli, c, r, mondo)
  if (!aperte.length) return null
  return aperte.find(nonLetta(c)) || piuVecchia(c, aperte)
}

// «Un'altra storia», dal cartello di fine di `appena`: la prima non letta
// del suo mondo, se no la prima non letta del mondo aperto più vicino per
// anno (a pari distanza il più avanti), se no la meno recente del suo
// mondo che non sia quella. Null se non c'è niente da offrire. Mai un'altra
// puntata della serie di `appena`: quella il cartello la offre a parte.
export function unAltraStoria(capitoli, c, r, mondo, appena) {
  const serie = (capitoli.find(x => x.id === appena) || {}).serie
  const tutte = serie ? capitoli.filter(x => x.serie !== serie) : capitoli
  const qui = storieAperte(capitoli, c, r, mondo).filter(x => x.id !== appena && (!serie || x.serie !== serie))
  const nuova = qui.find(nonLetta(c))
  if (nuova) return nuova
  const anno = (mondoDi(mondo) || {}).anno || 0
  const altri = MONDI.filter(m => m.id !== mondo && m.tappe.length)
    .sort((a, b) => Math.abs(a.anno - anno) - Math.abs(b.anno - anno) || b.anno - a.anno)
  for (const m of altri) {
    const x = storieAperte(capitoli, c, r, m.id).find(y => tutte.includes(y) && nonLetta(c)(y))
    if (x) return x
  }
  return qui.length ? piuVecchia(c, qui) : null
}

// Cosa serve per aprire il libro di un mondo: vincere la tappa della prima storia
export function cosaServeAlLibro(capitoli, mondo) {
  const prima = inOrdine(capitoli).find(cap => cap.mondo === mondo)
  const t = prima && tappaDi(tappaDellaStoria(prima))
  return t ? `Si apre quando vinci «${t.nome}»` : ''
}
