// Il conto puro del foglio di un magazzino (Magazzino.vue), senza DOM: le sue merci e la proposta per avere più posto, in parole da
// bambino. Vedi docs/fattoria3d/magazzini.md.
import { SILOS, siloDi, postiPerMerce, PASSI_PER_EDIFICIO, EDIFICI_PER_SILO } from '../dati/silos.js'
import { schedeDellInventario } from './inventario-puro.js'

/** Il foglio del silo `silo` dal motore: { silo, nome, emoji, merci, posti, passo, prezzo, puoi, mancano, taglie, titolo, testo, tasto }.
    `passo`: 'ingrandisci' | 'nuovo' (tutti grandi al massimo: se ne costruisce un altro) | 'basta'. `taglie`: per ogni edificio quanto è
    cresciuto, da 0 a `PASSI_PER_EDIFICIO`. */
export function vistaDelMagazzino(m, silo) {
  const S = SILOS[silo], n = m.livelloDelSilo(silo), posti = postiPerMerce(n), dopo = postiPerMerce(n + 1)
  const sch = schedeDellInventario(m.s, m.livello(), k => m.capienzaDi(k))
  const merci = [...sch.raccolti, ...sch.prodotti, ...sch.altro].filter(v => siloDi(v.k) === silo)
  const passo = m.passoDelSilo(silo), prezzo = passo === 'basta' ? null : m.prezzoIngrandimento(silo), monete = m.monete()
  const ed = m.edificiDelSilo(silo), il = `${S.art} ${S.nome.toLowerCase()}`, un = S.art === 'la' ? 'un\'altra' : 'un altro'
  const quanti = Math.max(1, m.quantiMagazzini(silo))
  let titolo, testo, tasto = null
  if (passo === 'ingrandisci') {
    titolo = `⬆️ Ingrandisci ${il}`
    testo = `Ogni ${S.cosa} avrà più posto: da ${posti} a ${dopo} per tipo. E ${il} diventa più grande!`
    tasto = `Ingrandisci · 🪙 ${prezzo}`
  } else if (passo === 'nuovo') {
    titolo = `🏗 ${quanti > 1 ? 'Sono grandi' : 'È grande'} al massimo`
    testo = `Costruisci ${un} ${S.nome.toLowerCase()} accanto: ogni ${S.cosa} avrà posto per 2 in più, da ${posti} a ${dopo}.`
    tasto = `Costruisci ${un} · 🪙 ${prezzo}`
  } else {
    titolo = '🏆 Più grande di così non si può'
    testo = `Hai ${EDIFICI_PER_SILO} ${S.edificio === 'dispensa' ? 'dispense' : 'silos'} grandi al massimo: ogni ${S.cosa} ha posto per ${posti}.`
  }
  return {
    silo, nome: S.nome, emoji: S.emoji, merci, posti, passo, prezzo, puoi: prezzo !== null && monete >= prezzo, mancano: prezzo !== null ? Math.max(0, prezzo - monete) : 0,
    taglie: ed.map(c => m.tagliaDi(c)), massimo: PASSI_PER_EDIFICIO, titolo, testo, tasto,
  }
}
