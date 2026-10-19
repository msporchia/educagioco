// Le taglie della bacheca, lo stato e le consegne, senza schermo (docs/sotterraneo/mondo-aperto-quest.md, «Le taglie»). I modelli e i
// testi stanno in dati/missioni-modelli.js; la bacheca col mondo davanti (quali fogli appende, il posto sul prato) in
// motore/taglie-bacheca.js. Lo stato è `mondo.quest` dell'avventura: `{ stati: { [id]: 'presa' | 'fatta' | 'consegnata' }, fatte: <quante
// consegnate in tutto> }`; le quest si rifanno dall'id. Gira in Node (unita/sotterraneo-quest-modelli).
import { rifaDaId, eTaglia, modelloAcceso, TETTO_TAGLIE, GIRI_RICORDATI, PREFISSO } from '../dati/missioni-modelli.js'

const PRESA = 'presa', FATTA = 'fatta', CONSEGNATA = 'consegnata'
const statoDi = (stati, id) => (stati && typeof stati === 'object' ? stati[id] || null : null)

/* ═══════════ lo stato ═══════════ */
export const QUEST_NUOVA = () => ({ stati: {}, fatte: 0 })
// il campo `mondo.quest` rimesso in forma alla lettura (mai scritto è nuovo; un valore storto non rompe niente)
export function questDi(mondo) {
  const q = mondo && typeof mondo === 'object' && mondo.quest && typeof mondo.quest === 'object' ? mondo.quest : null
  const stati = {}
  if (q && q.stati && typeof q.stati === 'object' && !Array.isArray(q.stati))
    for (const [id, v] of Object.entries(q.stati)) if (rifaDaId(id) && [PRESA, FATTA, CONSEGNATA].includes(v)) stati[id] = v
  return { stati, fatte: q && Number.isFinite(q.fatte) && q.fatte > 0 ? Math.floor(q.fatte) : 0 }
}

// tutte le taglie che lo stato nomina, rifatte dall'id (un id che non si legge più non c'è)
export const delleTaglie = stati => (stati ? Object.keys(stati).filter(eTaglia).map(rifaDaId).filter(Boolean) : [])
export const taglieInMano = stati => delleTaglie(stati).filter(t => [PRESA, FATTA].includes(statoDi(stati, t.id)))

// si prende una taglia che si legge, mai toccata, se in mano ce ne sono meno di TETTO_TAGLIE
export function prendiTaglia(stati, id) {
  const t = rifaDaId(id)
  if (!t || statoDi(stati, id) || !modelloAcceso(t.modello)) return null
  if (taglieInMano(stati).length >= TETTO_TAGLIE) return null
  return { ...(stati || {}), [id]: PRESA }
}

// Le consegnate dei giri più vecchi si dimenticano (se no lo stato cresce a ogni taglia di una vita), e così gli id che non si leggono
// più. `fatte` conta tutte le consegne. `vecchi` è lo stato di prima: la differenza dice quante consegne sono nuove
export function ripulisci(stati, giro, vecchi = null, fatte = 0) {
  const nuovi = {}
  let consegne = 0
  for (const [id, v] of Object.entries(stati || {})) {
    const t = rifaDaId(id)
    if (!t) continue
    if (v === CONSEGNATA && statoDi(vecchi, id) !== CONSEGNATA) consegne++
    if (v === CONSEGNATA && giro - t.giro >= GIRI_RICORDATI) continue
    nuovi[id] = v
  }
  return { stati: nuovi, fatte: fatte + consegne }
}
// i conti di una «sconfiggi N» o di una caccia: sparisce quello delle taglie che non ci sono più
export const contiVivi = (conti, stati) =>
  Object.fromEntries(Object.entries(conti || {}).filter(([id]) => !eTaglia(id) || statoDi(stati, id) === PRESA || statoDi(stati, id) === FATTA))

/* ═══════════ cosa è fatto da sé ═══════════ */
// Le «esplora» prese il cui posto adesso è visto. `visto(bersaglio)`: { tipo: 'regione' | 'ingresso' | 'pietra', chiave } → sì o no
export function esploratePronte(stati, visto) {
  return delleTaglie(stati).filter(t => t.tipo === 'esplora' && statoDi(stati, t.id) === PRESA && visto(t.bersaglio)).map(t => t.id)
}
// le prese di un tipo in una regione (il viandante, la mappa del tesoro): il mondo le mette sul prato
export const prese = (stati, tipo) => delleTaglie(stati).filter(t => t.tipo === tipo && statoDi(stati, t.id) === PRESA)

/* ═══════════ l'aggancio per i mostri di sopra ═══════════ */
// Quando il motore dei mostri di sopra (docs/sotterraneo/mondo-aperto-quest.md, «L'aggancio coi mostri») fa cadere un mostro di una
// `specie` nella `regione`, chiede quali caccie aperte lo contano: `{ id, quanti }`; il conto lo scrive lui in `conti[id]`, e a `quanti`
// dice `azioneMissione(id, 'fatta')`. Il signore della regione e la tana: `taglieDaBattere`. Spente finché MOTORI['mostri-sopra'] è
// falso (nessuna taglia di questi tipi si appende, e quindi nessuna è in mano)
export function taglieDaContare(stati, specie, regione) {
  return delleTaglie(stati).filter(t => t.tipo === 'cacciaAperta' && statoDi(stati, t.id) === PRESA && t.specie === specie && t.regione === regione)
    .map(t => ({ id: t.id, quanti: t.quanti }))
}
export function taglieDaBattere(stati, tipo, regione) {
  return delleTaglie(stati).filter(t => t.tipo === tipo && statoDi(stati, t.id) === PRESA && t.regione === regione).map(t => t.id)
}

export { PREFISSO }
