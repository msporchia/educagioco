/* L'inglese dentro i quiz: i dati e i pezzi che condividono i due moduli
   `ing-parole` e `ing-frasi` (moduli/). Un grado per isola dell'inglese a mondi
   (`giochi/inglese/dati/mondi.js`): le parole e le frasi sono quelle che
   l'isola insegna, e il livello (scala 0-100) viene dall'anno di scuola
   dell'isola, così l'età del bambino taglia il mazzo con le finestre di
   sempre. Tutti insieme pesano una domanda su 20 (QUOTA_INGLESE, vedi
   docs/apprendimento/quote.md). Vive fuori da moduli/ perché il registro
   raccoglie un modulo per file. */
import { MONDI, tappaDi } from '../giochi/inglese/dati/mondi.js'
import { FRASI } from '../giochi/inglese/dati/frasi.js'
import { contesto, costruisci } from '../giochi/inglese/motore/formati.js'
import { trappoleDi } from '../giochi/inglese/motore/trappole.js'
import { parole } from '../giochi/inglese/motore/testo.js'
import { FORME } from '../giochi/inglese/dati/forme.js'
import { voceDi, compagne } from '../data/lessico.js'

export const QUOTA_INGLESE = 1 / 20
export const QUOTA = { gruppo: 'inglese', quota: QUOTA_INGLESE }
export const GRADI = MONDI.filter(m => m.tappe.length).length

// metà dell'anno di scuola dell'isola: l'anno n va da 12,5·(n+1) a 12,5·(n+2); le frasi sono un po' più dure delle parole
export const livelloParole = grado => Math.round(12.5 * (grado + 1) + 6)
export const livelloFrasi = grado => Math.min(100, livelloParole(grado) + 4)

export const mondoDelGrado = grado => MONDI[Math.min(GRADI, Math.max(1, grado)) - 1]

// le parole (voci del lessico) che insegna una sola isola; quelle senza voce nel lessico non si chiedono
const perIsola = MONDI.map(m => [...new Set(m.tappe.flatMap(t => t.parole || []))]
  .map(p => voceDi('en:' + p)).filter(v => v && v.genere === 'parola'))

// fino a quell'isola compresa: serve ai distrattori, che non devono essere parole mai viste
export const vociFinoA = grado => perIsola.slice(0, grado).flat()
export const vociDell = grado => perIsola[grado - 1] || []

/* la parola da chiedere: quasi sempre dell'isola, ogni tanto di una prima (il ripasso che l'età già conosce) */
export function vocePer(grado, sorte, vale = () => true) {
  const nuove = vociDell(grado).filter(vale)
  const vecchie = vociFinoA(grado - 1).filter(vale)
  return sorte.forse(0.3) && vecchie.length ? sorte.uno(vecchie) : sorte.uno(nuove.length ? nuove : vociFinoA(grado).filter(vale))
}

/* i distrattori: della stessa categoria, fra quelle già viste, mai uno che si confonde con la giusta
   (stessa emoji o stessa famiglia visiva, stessa traduzione) */
export function altreVoci(voce, grado, sorte, quante = 3, { figure = false } = {}) {
  const note = new Set(vociFinoA(grado).map(v => v.chiave))
  const buona = x => x.chiave !== voce.chiave && x.str.toLowerCase() !== voce.str.toLowerCase() &&
    x.it !== voce.it && (!figure || (x.emoji && x.emoji !== voce.emoji &&
      !(voce.famiglia && x.famiglia === voce.famiglia)))
  const vicine = compagne(voce, quante).filter(x => note.has(x.chiave) && buona(x))
  const tutte = vociFinoA(grado).filter(x => !vicine.includes(x) && buona(x))
  const scelte = sorte.alcuni(vicine, quante)
  if (scelte.length < quante) scelte.push(...sorte.alcuni(tutte, quante - scelte.length))
  return scelte
}

/* Una frase dell'isola con le sue opzioni, dal motore dell'inglese a mondi
   (`costruisci`): `scegli` dà l'italiano e quattro frasi inglesi con le
   trappole vere, `senso` l'inglese e quattro frasi italiane. Si riprova se
   le opzioni non bastano (una frase senza trappole e senza compagne). */
export function frasePer(grado, sorte, formato) {
  const mondo = mondoDelGrado(grado).id
  const delMondo = FRASI.filter(f => f.mondo === mondo)
  for (let giro = 0; giro < 30; giro++) {
    const frase = sorte.uno(delMondo)
    const ctx = contesto(frase, { tappa: tappaDi(frase.tappa), altre: delMondo, rnd: () => sorte.frazione })
    const d = costruisci(frase, formato, ctx)
    if (d.opzioni.length >= 4) return d
  }
  return null
}

/* Il buco: una frase con una parola sola da rimettere, scelta fra la giusta e
   gli sbagli veri della stessa posizione. Le alternative sono le trappole del
   motore che cambiano UNA parola e basta (is/are, in/on, a/an): sono sbagliate
   di sicuro, e ognuna ha il suo perché. Serve una posizione con almeno due
   sbagli diversi, se no si riprova con un'altra frase. */
export function bucoPer(grado, sorte) {
  const mondo = mondoDelGrado(grado).id
  const delMondo = FRASI.filter(f => f.mondo === mondo)
  for (let giro = 0; giro < 60; giro++) {
    const frase = sorte.uno(delMondo)
    const ctx = contesto(frase, { tappa: tappaDi(frase.tappa), altre: delMondo, rnd: () => sorte.frazione })
    const T = parole(frase.en)
    const posti = new Map()
    for (const t of trappoleDi(frase, ctx)) {
      const U = parole(t.en)
      const diverse = U.length === T.length ? U.map((w, i) => (w === T[i] ? -1 : i)).filter(i => i >= 0) : []
      if (diverse.length !== 1) continue
      const i = diverse[0]
      if (!posti.has(i)) posti.set(i, new Map())
      if (!posti.get(i).has(U[i].toLowerCase())) posti.get(i).set(U[i].toLowerCase(), { parola: U[i], perche: t.perche })
    }
    const buoni = [...posti.entries()].filter(([i, m]) => m.size >= 2 && !m.has(T[i].toLowerCase()))
    if (!buoni.length) continue
    const [i, m] = sorte.uno(buoni)
    return {
      frase, giusta: T[i], regola: FORME[frase.forma].regola,
      riga: T.map((w, k) => (k === i ? '___' : w)).join(' '),
      falsi: sorte.alcuni([...m.values()], 3),
    }
  }
  return null
}
