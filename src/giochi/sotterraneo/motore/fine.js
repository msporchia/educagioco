// Le misure dell'eroe a fine discesa (docs/sotterraneo/fine-discesa-e-strade.md): il danno che toglie una risposta giusta, quanto vale la roba,
// e l'eroe atteso letto allo stesso modo. Finiscono nel passo di ogni storia (motore/storie.js); le tabelle sono in rapporto-fine.js. Gira in Node.
import { COSE } from '../dati/cose.js'
import { Corredo } from './corredo.js'
import { colpoContro, dannoDell, abilitaDelloScontro, mostroDiRiferimento, eroeAtteso, ABILITA_A_SCONTRO } from './forza.js'
import { livelloAtteso } from './storia.js'

// uno scontro lungo, in risposte giuste: su cui si media il danno (un mostro di riferimento cade in due, e il danno non si leggerebbe più)
export const RISPOSTE_DELLO_SCONTRO = 10

// quanto toglie in media una risposta giusta al mostro di riferimento del livello L, abilità comprese: le due più forti (una volta ciascuna,
// come in forza.js) e il colpo di sempre per le altre risposte dello scontro
export function dannoPerRisposta(c, L, risposte = RISPOSTE_DELLO_SCONTRO) {
  const m = mostroDiRiferimento(L), colpo = colpoContro(c, m, null)
  const forti = abilitaDelloScontro(c).map(nodo => ({ nodo, danno: dannoDell(c, nodo, m) })).filter(x => x.danno > colpo)
    .sort((a, b) => b.danno - a.danno).slice(0, ABILITA_A_SCONTRO)
  const dopo = forti.some(x => x.nodo.rompe) ? colpoContro(c, m, null, { rotto: true }) : colpo
  return (forti.reduce((a, x) => a + x.danno, 0) + (risposte - forti.length) * dopo) / risposte
}

// il colpo di sempre (senza abilità) al mostro di riferimento del livello L: quanto toglie una risposta giusta a un mostro di strada
export const colpoBase = (c, L) => colpoContro(c, mostroDiRiferimento(L), null)

// quanto vale la roba: il prezzo pieno dei pezzi addosso e nello zaino (le pozioni si contano a parte)
export const valoreDellaRoba = c => [c.mano, c.mancina, c.corpo, c.collo, c.dito, c.dito2, c.testa, ...c.zaino].filter(k => k && COSE[k] && COSE[k].dove).reduce((s, k) => s + c.prezzoDi(k), 0)

// l'eroe atteso all'ingresso della discesa k (la roba e la crescita della storia), letto con le stesse misure
const attesi = new Map()
export function attesoA(eroe, k) {
  const chiave = `${eroe}|${k}`
  if (!attesi.has(chiave)) {
    const L = livelloAtteso(k), c = eroeAtteso(eroe, L)
    attesi.set(chiave, { liv: L, dpa: dannoPerRisposta(c, L), dif: c.dif, vita: c.vitaConLaRoba, valore: valoreDellaRoba(c) })
  }
  return attesi.get(chiave)
}

// i pezzi addosso (mano, mancina, corpo, collo, i due anelli) e quanto vale tutto, per contare le armi nuove che migliorano davvero l'eroe
export const addossoDi = c => ({ pezzi: [c.mano, c.mancina, c.corpo, c.collo, c.dito, c.dito2, c.testa].filter((k, i) => i < 6 || k), punti: c.punteggio() })

// i pezzi entrati addosso fra due letture, se insieme alzano il valore dell'eroe (un pezzo che finisce nello zaino, o che non alza niente, non conta)
export function nuoviUtili(prima, dopo) {
  const nuovi = dopo.pezzi.filter(k => k && !prima.pezzi.includes(k))
  return nuovi.length && dopo.punti > prima.punti ? nuovi.length : 0
}

// quanti pezzi utili ha comprato una spesa: la roba prima e dopo, con la stessa crescita
export function utiliComprati(eroe, crescita, prima, dopo) {
  const leggi = roba => { const c = new Corredo({ eroe, roba, crescita }); c.sistemaIlCorredo(); return addossoDi(c) }
  return nuoviUtili(leggi(prima), leggi(dopo))
}
