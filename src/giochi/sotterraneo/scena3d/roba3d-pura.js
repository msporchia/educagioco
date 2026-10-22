// La roba in 3D, la parte senza three (docs/sotterraneo/roba-3d.md): da un oggetto (anche «spada@7.m.fuoco») la figura dei fogli che
// lo disegna (la stessa dello sprite: aspettoDi, i pezzi col nome) e il suo aspetto (rarità, elemento, materia, pregio); e il gettone
// che lo porta nelle chiavi delle anteprime. Chi costruisce il modello è roba3d.js.
import { COSE } from '../dati/cose.js'
import { FIGURE3D, SPRITE_FIGURA } from '../dati/figure3d.js'
import { RARITA, RARITA_DA_LETTERA } from '../dati/pezzi.js'

const cosaDi = k => (k ? COSE[k] || null : null)

/** La figura dei fogli di un oggetto (`spada-28`), o null (le pozioni, gli sprite che non vengono dai fogli: `arma-1`, `ossa`…). */
export function figuraDi(k) {
  const c = cosaDi(k)
  if (!c || !c.sprite) return null
  if (FIGURE3D[c.sprite]) return c.sprite
  return SPRITE_FIGURA[c.sprite] || null
}

/**
 * L'aspetto: la rarità dell'oggetto; l'elemento della figura (la figura è già scelta per richiamare le abilità: dati/cose.js
 * `aspettoDi`), o il fuoco se il pezzo ha l'abilità e la figura nessun elemento; materia e pregio della figura (il pregio, senza
 * figura, dalla rarità). → { rarita, elemento, materia, pregio } o null.
 */
export function lookDi(k) {
  const c = cosaDi(k)
  if (!c) return null
  const rarita = RARITA[c.rarita] ? c.rarita : 'comune'
  const f = FIGURE3D[figuraDi(k)] || null
  let elemento = f && f.elemento ? f.elemento : 'nessuno'
  if (elemento === 'nessuno' && c.abilita && c.abilita.fuoco) elemento = 'fuoco'
  return { rarita, elemento, materia: f ? f.materia || null : null, pregio: f ? f.pregio || 1 : 1 + Math.min(3, ['comune', 'magico', 'raro', 'leggendario'].indexOf(rarita)) }
}

/** La famiglia 3D di una figura (il modulo che la disegna: lame, bastoni, scudi, vesti, gioielli), o null. */
export const famigliaDi = figura => (FIGURE3D[figura] ? FIGURE3D[figura].famiglia : null)

/** Una collana (un gioiello che si porta al collo, non un anello): solo queste stanno sull'eroe in scena. */
export const eUnaCollana = figura => famigliaDi(figura) === 'gioielli' && !/anello/.test(FIGURE3D[figura].cosa || '')

// ── il gettone nelle chiavi delle anteprime: `<figura>.<id della collezione>.<lettera della rarità>.<elemento>`, `-` dove manca ──
const nulla = x => (x === '-' || x === '' || x == null ? null : x)

/** `p` = { figura, id, rarita, elemento } → il gettone (null se non c'è né figura né id). */
export function gettone(p) {
  if (!p || (!p.figura && !p.id)) return null
  return `${p.figura || '-'}.${p.id || '-'}.${(RARITA[p.rarita] || RARITA.comune).lettera}.${p.elemento || 'nessuno'}`
}

/** Il contrario di `gettone`, o null. */
export function daGettone(s) {
  const p = String(s || '').split('.')
  if (p.length !== 4) return null
  const figura = nulla(p[0]), id = nulla(p[1])
  if (!figura && !id) return null
  return { figura: FIGURE3D[figura] ? figura : null, id, rarita: RARITA_DA_LETTERA[p[2]] || 'comune', elemento: nulla(p[3]) || 'nessuno' }
}
