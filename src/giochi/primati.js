// I primati dei giochi senza fine: vedi docs/core/primati.md. Parte pura
// (nessun Vue, nessuno store): gira in Node e i manifesti la importano.
// Chi scrive nel profilo è giochi/campagne.js.

export const ULTIME = 5   // gli ultimi risultati tenuti: una riga sola, colpo d'occhio

export const VUOTO = () => ({ best: 0, quando: 0, partite: 0, ultime: [] })

// Risultato e scarto non si scrivono uguale: 125s è «2:05», ma 32s di
// differenza sono «32s» (non «0:32», che sembrerebbe un orario).
export const MISURE = {
  metri: {
    nome: 'metri',
    scrivi: v => `${v} m`,
    scarto: v => `${v} m`,
  },
  tempo: {
    nome: 'tempo',
    scrivi: v => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`,
    scarto: v => `${v}s`,
  },
  quanti: {
    nome: 'quanti',
    scrivi: v => `${v}`,
    scarto: v => `${v}`,
  },
  fila: {
    nome: 'di fila',
    scrivi: v => `${v} di fila`,
    scarto: v => `${v}`,
  },
  ondate: {
    nome: 'ondate',
    scrivi: v => `${v} ondat${v === 1 ? 'a' : 'e'}`,
    scarto: v => `${v}`,
  },
  punti: {
    nome: 'punti',
    scrivi: v => `${v} punt${v === 1 ? 'o' : 'i'}`,
    scarto: v => `${v}`,
  },
}

const misuraDi = m => MISURE[m] || MISURE.quanti

export const inParole = (valore, misura) => misuraDi(misura).scrivi(intero(valore))
export const scartoInParole = (valore, misura) => misuraDi(misura).scarto(intero(valore))

// sempre intero e mai negativo: «311.9999 m» è un difetto di arrotondamento, non un record
function intero(v) {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n > 0 ? n : 0
}

// Sempre un elenco, anche per una sfida sola (chiave: null, che è come
// apriQuaderno sa di dover leggere `primato` e non `primati`).
export function sfideDi(senzaFine) {
  if (!senzaFine || typeof senzaFine !== 'object') return []
  if (!Array.isArray(senzaFine.sfide)) return [{ ...senzaFine, chiave: null }]
  const { sfide, ...comune } = senzaFine
  return sfide.map(s => ({ ...comune, ...s }))
}

export const sfidaDi = (senzaFine, chiave = null) =>
  sfideDi(senzaFine).find(s => (s.chiave || null) === (chiave || null)) || null

export const chiaveSfida = sfida =>
  (sfida && typeof sfida === 'object' ? sfida.chiave : sfida) || null

function leggi(q) {
  return {
    best: intero(q.best),
    quando: Number(q.quando) || 0,
    partite: Number(q.partite) || 0,
    ultime: Array.isArray(q.ultime)
      ? q.ultime.slice(0, ULTIME).map(u => ({ v: intero(u && u.v), t: Number(u && u.t) || 0 }))
      : [],
    dettagli: q.dettagli && typeof q.dettagli === 'object' ? { ...q.dettagli } : null,
  }
}

// `sfida`: chiave o voce intera (che sa anche `eredita`); senza, la sfida sola.
// `vecchio`: un record fuori dalla campagna (es. profile.best.math per gli
// asteroidi), passato da campagne.js; vale finché un quaderno non c'è.
export function apriQuaderno(av = {}, sfida = null, vecchio = 0) {
  const chiave = chiaveSfida(sfida)
  if (chiave) {
    const tutti = av && av.primati
    const suo = tutti && typeof tutti === 'object' ? tutti[chiave] : null
    if (suo && typeof suo === 'object') return leggi(suo)
    return sfida && typeof sfida === 'object' && sfida.eredita
      ? apriQuaderno(av, null, vecchio) : VUOTO()
  }
  const q = av && av.primato
  if (q && typeof q === 'object') return leggi(q)
  const prima = intero((av && av.cfg || {}).primato) || intero(vecchio)
  return prima ? { ...VUOTO(), best: prima } : VUOTO()
}

// Il record più recente, non il più alto: vedi docs/core/primati.md.
// Torna { sfida, quaderno }, o niente se non c'è ancora nessun record.
export function recordPiuRecente(av, senzaFine) {
  let scelto = null
  for (const sfida of sfideDi(senzaFine)) {
    const quaderno = apriQuaderno(av, sfida)
    if (!quaderno.best) continue
    if (!scelto || quaderno.quando > scelto.quaderno.quando) scelto = { sfida, quaderno }
  }
  return scelto
}

// Torna il quaderno nuovo e cosa dire (due cose: una si salva, l'altra si
// mostra); il quaderno non si modifica sul posto. `primo` non è `record`:
// la prima partita non batte niente (vedi docs/core/primati.md).
export function conRisultato(quaderno, valore, quando = Date.now(), dettagli = null) {
  const q = apriQuaderno({ primato: quaderno || VUOTO() })
  const v = intero(valore)
  const primo = q.partite === 0 && q.best === 0
  const record = v > q.best
  const esito = {
    valore: v,
    record,
    primo,
    prima: q.best,
    meglio: record ? v - q.best : 0,
    mancano: record ? 0 : q.best - v,
    partite: q.partite + 1,
    dettagli: dettagli && typeof dettagli === 'object' ? { ...dettagli } : null,
  }
  return {
    esito,
    quaderno: {
      best: record ? v : q.best,
      quando: record ? quando : q.quando,
      partite: q.partite + 1,
      ultime: [{ v, t: quando }, ...q.ultime].slice(0, ULTIME),
      dettagli: record ? esito.dettagli : q.dettagli,   // solo della partita del record
    },
  }
}

export function fraseDiFine(esito, misura) {
  if (!esito) return ''
  const ora = inParole(esito.valore, misura)
  if (esito.primo) return `Il tuo primo risultato: ${ora}`
  if (esito.record)
    return `Nuovo record! ${ora} (${scartoInParole(esito.meglio, misura)} meglio di prima)`
  if (!esito.prima) return ''
  if (!esito.mancano) return `Il tuo record resta ${inParole(esito.prima, misura)}`
  return `Il tuo record è ${inParole(esito.prima, misura)}` +
         ` · ti sono mancati ${scartoInParole(esito.mancano, misura)}`
}

// vuota se non c'è ancora niente: un «primato 0 m» inviterebbe a non provarci
export const primatoInParole = (quaderno, misura) =>
  quaderno && quaderno.best ? inParole(quaderno.best, misura) : ''

export function dettagliInParole(quaderno, sfida) {
  const d = quaderno && quaderno.dettagli
  if (!d || !sfida || typeof sfida.dettagli !== 'function') return ''
  const parti = sfida.dettagli(d)
  return (Array.isArray(parti) ? parti : [parti]).filter(Boolean).join(' · ')
}

export const recordInParole = (quaderno, sfida) =>
  [primatoInParole(quaderno, sfida && sfida.misura), dettagliInParole(quaderno, sfida)]
    .filter(Boolean).join(' · ')

// I guasti di un manifesto senzaFine: chiavi duplicate, misura sconosciuta,
// più di una sfida che eredita. Il test di ogni gioco fa girare questo sul
// proprio manifesto (vedi docs/core/primati.md).
export function guastiDelleSfide(giochi = []) {
  const guasti = []
  for (const g of giochi) {
    const s = g && g.senzaFine
    if (!s) continue
    const sfide = sfideDi(s)
    const piu = Array.isArray(s.sfide)
    if (piu && !sfide.length) guasti.push(`senzaFine di «${g.chiave}»: l'elenco delle sfide è vuoto`)
    if (piu && sfide.filter(x => x.eredita).length > 1)
      guasti.push(`senzaFine di «${g.chiave}»: più di una sfida eredita il record vecchio`)
    const chiavi = sfide.map(x => x.chiave)
    if (piu && new Set(chiavi).size !== chiavi.length)
      guasti.push(`senzaFine di «${g.chiave}»: due sfide con la stessa chiave`)
    for (const x of sfide) {
      const dove = piu ? `sfida «${x.chiave}» di «${g.chiave}»` : `senzaFine di «${g.chiave}»`
      if (piu && (typeof x.chiave !== 'string' || !x.chiave))
        guasti.push(`senzaFine di «${g.chiave}»: una sfida senza chiave`)
      if (!x.nome) guasti.push(`${dove}: manca il nome`)
      if (!x.icona) guasti.push(`${dove}: manca l'icona`)
      if (!x.che) guasti.push(`${dove}: manca la riga che dice cosa si misura`)
      if (!MISURE[x.misura])
        guasti.push(`${dove}: misura «${x.misura}» sconosciuta (${Object.keys(MISURE).join(', ')})`)
      if (x.dettagli !== undefined && typeof x.dettagli !== 'function')
        guasti.push(`${dove}: «dettagli» dev'essere una funzione (dettagli salvati → frasi)`)
      if (x.vecchio !== undefined && typeof x.vecchio !== 'function')
        guasti.push(`${dove}: «vecchio» dev'essere una funzione (profilo → record di prima)`)
    }
  }
  return guasti
}
