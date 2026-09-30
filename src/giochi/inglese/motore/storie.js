// Le storie del libro sulla mappa: quando se ne apre una, quale si legge
// adesso e quale dopo. Le storie lette stanno in profile.campagne.inglese,
// accanto alle tappe vinte: `lette: { <id capitolo>: <quando> }`, l'ultima
// volta che si è arrivati al cartello di fine. Le regole (`r`) sono quelle
// di motore/mappa.js. Il perché: docs/lingue/libro.md («Quale storia»).
import { MONDI, mondoDi, tappaDi } from '../dati/mondi.js'
import { mondoAperto, mondoPassato, vinta } from './mappa.js'
import { tappaDellaStoria } from './libro.js'

const regole = r => (typeof r === 'boolean' ? { tutto: r } : r || {})

export const lette = c => (c && c.lette && typeof c.lette === 'object' ? c.lette : {})

// Segna una storia letta adesso: conta l'ultima volta, perché la prossima
// da rileggere è quella letta da più tempo.
export function segnaLetta(c, id, ora = Date.now()) {
  if (!c.lette || typeof c.lette !== 'object') c.lette = {}
  c.lette[id] = ora
}

// l'ordine delle storie: per mondo, poi dalla tappa da cui si aprono, poi per id
const posto = cap => {
  const m = mondoDi(cap.mondo)
  const i = m ? m.tappe.findIndex(t => t.id === tappaDellaStoria(cap)) : -1
  return [MONDI.indexOf(m), i]
}
export function inOrdine(capitoli) {
  return capitoli.slice().sort((a, b) => {
    const [ma, ta] = posto(a), [mb, tb] = posto(b)
    return ma - mb || ta - tb || a.id.localeCompare(b.id)
  })
}

// Una storia si legge quando la sua tappa è vinta, come la tappa dopo;
// «Sblocca tutti» e un mondo passato per età aprono tutto.
export function storiaAperta(c, cap, r) {
  const { tutto = false, eta = null } = regole(r)
  if (!mondoAperto(c, cap.mondo, r)) return false
  if (tutto || mondoPassato(cap.mondo, eta)) return true
  const t = tappaDellaStoria(cap)
  return !!t && vinta(c, t)
}

export const storieAperte = (capitoli, c, r, mondo) =>
  inOrdine(capitoli).filter(cap => cap.mondo === mondo && storiaAperta(c, cap, r))

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
// mondo che non sia quella. Null se non c'è niente da offrire.
export function unAltraStoria(capitoli, c, r, mondo, appena) {
  const qui = storieAperte(capitoli, c, r, mondo).filter(x => x.id !== appena)
  const nuova = qui.find(nonLetta(c))
  if (nuova) return nuova
  const anno = (mondoDi(mondo) || {}).anno || 0
  const altri = MONDI.filter(m => m.id !== mondo && m.tappe.length)
    .sort((a, b) => Math.abs(a.anno - anno) - Math.abs(b.anno - anno) || b.anno - a.anno)
  for (const m of altri) {
    const x = storieAperte(capitoli, c, r, m.id).find(nonLetta(c))
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
