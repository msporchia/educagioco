// Le strade di una classe (dati/strade.js, docs/sotterraneo/strade.md) messe in moto: la roba con cui si entra in una discesa, i
// punti dati come la strada li dà, e il vincolo che tiene l'arma e lo scudo della strada anche quando il gioco ne propone altri.
// Le usa il banco (`--strada`); gira in Node.
import { COSE, CHIAVI_COSE, aLivello } from '../dati/cose.js'
import { eroeDi, portaLa } from '../dati/eroi.js'
import { PASSI, CASELLE, POZIONI_ATTESE } from '../dati/storia.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { GROSSI, GROSSO_DELLA_DISCESA } from '../dati/grossi.js'
import { Corredo, VERSIONE_ROBA } from './corredo.js'
import { crescitaA } from './crescita.js'
import { livelloAtteso, livelloDeiPezzi } from './storia.js'
import { pezzoDelGrosso } from './bottino.js'
import { STRADE, stradeDi, stradaDi } from '../dati/strade.js'
import { NODI } from '../dati/abilita.js'

export { STRADE, stradeDi, stradaDi }

// le armi di base che una strada può impugnare, per gradino: non quelle col nome (senza gradino) né quelle dei grossi
const armiDellaStrada = (classe, s) => CHIAVI_COSE.filter(k => {
  const c = COSE[k]
  return c.dove === 'mano' && c.grado && !c.deiGrossi && s.arma.famiglie.includes(c.famiglia) &&
    portaLa(eroeDi(classe), c) && (c.mani || 1) === s.arma.mani
})

// l'arma di un gradino: quella del gradino, o la più alta sotto (nessuno ha uno spadone al primo piano). null se la strada non ne ha
function armaDelGradino(classe, s, grado) {
  const sotto = armiDellaStrada(classe, s).filter(k => COSE[k].grado <= grado).sort((a, b) => COSE[b].grado - COSE[a].grado)
  return sotto.length ? sotto[0] : null
}

// lo scudo del gradino: il più economico che para quanto il gradino (legno, ferro, teschio)
const scudoDelGradino = grado => CHIAVI_COSE.filter(k => COSE[k].dove === 'mancina' && COSE[k].dif >= grado && !COSE[k].deiGrossi)
  .sort((a, b) => COSE[a].dif - COSE[b].dif || COSE[a].prezzo - COSE[b].prezzo)[0] || null

// Le righe della storia di una strada (come PASSI[classe]): la riga della classe, con l'arma della strada al posto della sua
// e lo scudo (o la seconda arma, o niente) che la strada vuole. Dove la strada non ha ancora un'arma (nessuno ha lo spadone al
// primo piano) resta la riga della classe com'è
export function filaDellaStrada(classe, s) {
  return PASSI[classe].map(riga => {
    if (!riga.mano) return { ...riga }
    const grado = COSE[riga.mano].grado || 3
    const arma = armaDelGradino(classe, s, grado)
    if (!arma) return { ...riga }
    let mancina = null
    if (s.mancina === 'scudo') {
      // lo scudo della classe in quella riga, o quello del gradino se para di più (la classe può aver lasciato lo scudo per un'arma a due mani)
      const suo = riga.mancina && COSE[riga.mancina].dove === 'mancina' ? riga.mancina : null
      const del = scudoDelGradino(grado)
      mancina = suo && (COSE[suo].dif || 0) >= (COSE[del].dif || 0) ? suo : del
    }
    return { ...riga, mano: arma, mancina: COSE[arma].mani === 2 ? null : mancina }
  })
}

// Il vincolo del banco (Corredo.vincoloDelBanco): il gioco propone un pezzo migliore e il banco di una strada non lo prende se
// è di un'altra strada. L'arma sta nelle famiglie della strada, a una o a due mani come dice (una a una mano si tiene finché non
// ce n'è una a due, che nei primi piani non si trova); lo scudo solo se la strada lo vuole, e mai una seconda arma al suo posto
export function ammette(s) {
  return (corredo, k) => {
    const c = COSE[k]
    if (!c || !c.dove) return true
    if (c.dove === 'mano') {
      if (!s.arma.famiglie.includes(c.famiglia)) return false
      if (corredo.postoDellArma(k).dove === 'mancina') return false
      return s.arma.mani === 2 ? c.mani === 2 || !corredo.aDueMani(corredo.mano) : c.mani !== 2
    }
    if (c.dove === 'mancina') return s.mancina === 'scudo'
    return true
  }
}

// I punti delle caratteristiche di chi è arrivato alla discesa `k` (col livello atteso, più `piu` livelli) dati come la strada
// li dà
export const crescitaDellaStrada = (classe, s, k, piu = 0) => crescitaA(eroeDi(classe), Math.max(1, livelloAtteso(k) + piu), s.punti)

// La roba con cui si entra nella discesa `k` andando per una strada (come robaAttesa in motore/storia.js): la riga della strada
// a un livello sotto quello atteso, al livello più alto che l'eroe impugna con i punti che ha; i pezzi che i grossi hanno
// lasciato prima, ma non le loro armi (cambierebbero la strada); le pozioni attese
export function robaDellaStrada(classe, s, k, { piu = 0, pozioni = true } = {}) {
  const fila = filaDellaStrada(classe, s)
  const dove = Math.max(0, Math.min(k, fila.length - 1))
  const c = new Corredo({ eroe: classe, roba: { v: VERSIONE_ROBA, gemme: 0, zaino: [], torcia: 0, torce: 0 }, crescita: crescitaDellaStrada(classe, s, k, piu) })
  const L = Math.max(1, livelloDeiPezzi(dove) + piu)
  for (const x of CASELLE) {
    const p = fila[dove][x]
    if (p) c.metti(x, aLivello(p, c.livelloPortabile(p, L)))
  }
  for (let j = 0; j < Math.min(k, CAMPAGNA.length); j++) {
    const g = GROSSI[GROSSO_DELLA_DISCESA[CAMPAGNA[j].chiave]]
    const p = g && pezzoDelGrosso(g.pezzo, Math.max(1, livelloDeiPezzi(j + 1) + piu))
    if (p && COSE[p] && COSE[p].dove !== 'mano' && c.posso(p) && c.vaAddosso(p)) { c.metti(c.confronto(p).dove, p); c.sistemaLeMani() }
  }
  c.sistemaIlCorredo()
  const roba = c.roba
  roba.zaino = pozioni ? [...POZIONI_ATTESE[Math.max(0, Math.min(k, POZIONI_ATTESE.length - 1))]] : []
  return roba
}

// i guasti di una strada: l'arma e lo scudo che una classe non porta, un nodo che non c'è o è di un'altra classe, un ramo che vuole
// un'arma che la strada non impugna
export function guastiDelleStrade() {
  const g = []
  for (const [classe, tre] of Object.entries(STRADE)) {
    const e = eroeDi(classe)
    if (e.chiave !== classe) { g.push(`${classe}: una classe che non c'è`); continue }
    if (Object.keys(tre).length !== 3) g.push(`${classe}: ${Object.keys(tre).length} strade, ne servono tre`)
    for (const [chiave, s] of Object.entries(tre)) {
      const nome = `${classe}:${chiave}`
      if (!s.nome || !s.dice) g.push(`${nome}: senza nome o senza frase`)
      if (!armiDellaStrada(classe, s).length) g.push(`${nome}: nessuna arma che la classe porti e la strada impugni`)
      if (s.arma.mani === 2 && s.mancina) g.push(`${nome}: un'arma a due mani e qualcosa nell'altra`)
      if (s.arma.mani === 1 && !s.mancina) g.push(`${nome}: un'arma a una mano e la mancina vuota`)
      if (!Array.isArray(s.punti) || !s.punti.length) g.push(`${nome}: senza punti da dare`)
      if (s.abilita.length !== new Set(s.abilita).size) g.push(`${nome}: un nodo due volte nella fila`)
      for (const id of s.abilita) {
        const n = NODI[id]
        if (!n) { g.push(`${nome}: il nodo "${id}" non c'è`); continue }
        if (n.classe !== classe) g.push(`${nome}: "${id}" è di un'altra classe`)
        if (n.arma && n.arma.famiglie && !n.arma.famiglie.some(f => s.arma.famiglie.includes(f))) g.push(`${nome}: "${id}" vuole un'arma che la strada non impugna`)
        if (n.arma && n.arma.scudo && s.mancina !== 'scudo') g.push(`${nome}: "${id}" vuole lo scudo, e la strada non lo porta`)
      }
    }
  }
  return g
}
