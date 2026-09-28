// Le conversioni: tutto in unità base e in interi. Una dose è
// { unita, base }, un attrezzo conta in `unita` e ha `limite` e `pezzi`
// (in base). Il perché delle parole del cartello è in docs/pozioni/regole.md.
import { VALE, famigliaDi, inUnita, numero, scrivi } from '../dati/misure.js'

export { inUnita, scrivi }

// quanti scalini da `da` ad `a`: positivo in giù (kg→g = 3), negativo in
// su (g→hg = -2), zero se sono la stessa unità
export function scalini(da, a) {
  const f = famigliaDi(da)
  if (!f || !f.scala.includes(a)) return null
  return f.scala.indexOf(a) - f.scala.indexOf(da)
}

// la chiave del motore di apprendimento: kg-g e g-kg sono due cose
// diverse da sapere
export const chiaveDi = (da, a) => (da === a ? null : `pozioni:${da}-${a}`)

// deve stare nel limite e cadere su un multiplo del pezzo più piccolo (il
// più piccolo divide tutti gli altri, guastiDelleMisure lo controlla)
export const componibile = (base, str) =>
  !!str && base > 0 && base <= str.limite && base % str.pezzi[0] === 0

// i pezzi che compongono `base` col minor numero di pezzi: prendere
// sempre il più grande dà il minimo, perché ogni pezzo divide il successivo
export function scomponi(base, pezzi) {
  const out = []
  let r = base
  for (const p of [...pezzi].sort((a, b) => b - a)) while (r >= p) { out.push(p); r -= p }
  return r === 0 ? out : null
}

export function verdetto(dose, str, messo) {
  if (!str) return 'niente'
  if (famigliaDi(dose.unita).chiave !== str.famiglia) return 'famiglia'
  if (!componibile(dose.base, str)) return 'nonCiSta'
  if (messo === dose.base) return 'giusto'
  return messo > dose.base ? 'troppo' : 'poco'
}

// sempre dalla grande alla piccola («1 hg = 100 g»), anche quando la
// conversione da fare è al contrario: è la riga del cartellone, che non
// cambia verso a seconda della domanda
export function regola(da, a) {
  const n = scalini(da, a)
  if (n == null || n === 0) return null
  const [grande, piccola] = n > 0 ? [da, a] : [a, da]
  return `1 ${grande} = ${VALE[grande] / VALE[piccola]} ${piccola}`
}

// `livello`: 'svolto' tutto col risultato, 'regola' solo l'uguaglianza,
// altro → niente. Con la stessa unità non c'è niente da convertire.
export function spiegazione(dose, unitaAttrezzo, livello = 'svolto') {
  if (!dose || !unitaAttrezzo || !livello || livello === 'gioco') return null
  const da = dose.unita, a = unitaAttrezzo
  const n = scalini(da, a)
  if (n == null) return null
  if (n === 0) return { uguale: true, testo: `La dose è già in ${a}: si mette così com'è.` }
  const uguaglianza = regola(da, a)
  const scala = scaliniFra(da, a)
  if (livello === 'regola') return { uguale: false, regola: uguaglianza, da, a, scala }

  const giu = n > 0, quanti = Math.abs(n)
  const f = famigliaDi(da)
  const i0 = f.scala.indexOf(da)
  // la catena: il numero riscritto a ogni scalino, 1,5 → 15 → 150 → 1500
  const catena = []
  for (let k = 0; k <= quanti; k++) {
    const u = f.scala[i0 + (giu ? k : -k)]
    catena.push(numero(inUnita(dose.base, u)))
  }
  catena[catena.length - 1] += ' ' + a
  const intero = Number.isInteger(inUnita(dose.base, da))
  const posti = quanti === 1 ? 'un posto' : `${quanti} posti`
  const zeri = quanti === 1 ? 'uno zero' : `${quanti} zeri`
  // in giù con un intero si aggiungono zeri; in su gli zeri si tolgono
  // solo se ci sono tutti (6000 → 60), se no si sposta la virgola
  const finisceConZeri = intero && inUnita(dose.base, da) % 10 ** quanti === 0
  const come = giu
    ? (intero ? `aggiungi ${zeri}` : `la virgola va a destra di ${posti}`)
    : (finisceConZeri ? `togli ${zeri}` : `la virgola va a sinistra di ${posti}`)
  return {
    uguale: false, da, a, regola: uguaglianza, scala,
    scalini: quanti, giu,
    passi: `Da ${da} a ${a} ${quanti === 1 ? 'è uno scalino' : `sono ${quanti} scalini`} in ${giu ? 'giù' : 'su'}`,
    come, catena, risultato: catena[catena.length - 1],
  }
}

// la riga della scala, tagliata sul pezzo che serve: ['kg','hg','dag','g']
export function scaliniFra(da, a) {
  const f = famigliaDi(da)
  if (!f || !f.scala.includes(a)) return []
  const i = f.scala.indexOf(da), j = f.scala.indexOf(a)
  return f.scala.slice(Math.min(i, j), Math.max(i, j) + 1)
}

const GESTO = { versa: 'si versa', pesa: 'si pesa', taglia: 'si taglia' }
export function perche(dose, str, esito) {
  const f = famigliaDi(dose.unita)
  if (esito === 'famiglia') {
    const cosa = f.di[0].toUpperCase() + f.di.slice(1)
    return `${cosa} ${GESTO[f.gesto]}, non ${GESTO[str.gesto]}: serve ${f.cosa}.`
  }
  if (esito === 'nonCiSta') {
    const troppo = dose.base > str.limite
    return troppo
      ? `Qui non ci sta: ${str.nome} arriva fino a ${scrivi(str.limite, f.unita.G)}.`
      : `Qui non si segna: ${str.nome} ha ${str.gesto === 'pesa' ? 'pesi' : 'pezzi'} da ${scrivi(str.pezzi[0], str.unita)} e ${dose.testo} non cade sul segno.`
  }
  if (esito === 'troppo') return `Troppo: ne serve ${dose.testo}, e ne hai messo di più.`
  if (esito === 'poco') return `Poco: ne serve ${dose.testo}, e ne hai messo di meno.`
  return ''
}
