// Le forze del mondo di sopra (docs/sotterraneo/mondo-aperto-mostri.md, «La scena»): la vita e l'energia che lo scontro sul prato
// lascia in `mondo.sopra.forze` quando non si è saliti dal portale, come le leggono la barra e chi cura in città. Un file piccolo, senza
// il mondo generato: lo legge anche Gioco.vue, che il mondo lo carica a richiesta. Puro.

// le forze per la barra e per chi cura: quelle salvate coi massimi della roba di adesso; null se sono piene (o se non ce ne sono)
export function forzeDiSopra(f, vitaMax, energiaMax) {
  if (!f || !Number.isFinite(f.vita) || !Number.isFinite(f.energia)) return null
  const vita = Math.max(1, Math.min(vitaMax, f.vita)), energia = Math.max(0, Math.min(energiaMax, f.energia))
  return vita >= vitaMax && energia >= energiaMax ? null : { vita, vitaMax, energia, energiaMax }
}
// chi cura in città (la guaritrice la vita, l'incantatrice l'energia, la fontana tutte e due: 'vita', 'energia', 'tutto'): le forze
// nuove da rimettere nello stato del motore (null: piene)
export function curaDiSopra(f, risorsa, vitaMax, energiaMax) {
  if (!f) return null
  const n = { vita: risorsa === 'energia' ? f.vita : vitaMax, energia: risorsa === 'vita' ? f.energia : energiaMax }
  return n.vita >= vitaMax && n.energia >= energiaMax ? null : n
}

// «Il villaggio» → «al villaggio», «La …» → «alla …»: dove ci si risveglia
const ARTICOLI = { il: 'al', la: 'alla', lo: 'allo', i: 'ai', le: 'alle', gli: 'agli', "l'": "all'" }
export const allaCitta = nome => nome.replace(/^(Il|La|Lo|I|Le|Gli|L')\s*/, (_, a) => `${ARTICOLI[a.toLowerCase()]}${a.endsWith("'") ? '' : ' '}`)
