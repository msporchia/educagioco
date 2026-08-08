/* ═══════════════════════════════════════════════════════════════════
   I PERSONAGGI — l'indice

   Un file per personaggio, e qui la sola riga che li mette insieme.
   Aggiungerne uno è: un file nuovo qui dentro, un `import` e una voce
   in `PERSONE`. Nessun file esistente da allungare.

   Chi cammina su due gambe finisce a `persona()`, chi ne ha quattro a
   `bestia()` — lo dice la scheda con `quadrupede: true`, non l'indice:
   così un giorno un ragno o un cavallo si aggiungono senza toccare
   niente qui.

   Il gatto e l'orso hanno più di un manto (`MANTI` nel loro file): è
   un dato scelto da chi mette in scena — `{ che: 'gatto', manto:
   'nero' }` — non un personaggio diverso, quindi `PITTORI_PERSONE`
   sceglie la tavolozza giusta prima di passare il resto a `bestia()`,
   invece di usare sempre e solo quella di default.
   ═══════════════════════════════════════════════════════════════════ */
import { persona, bestia } from '../corpo.js'
import { CAVALIERE } from './cavaliere.js'
import { LADRA } from './ladra.js'
import { ELFO } from './elfo.js'
import { MAGO } from './mago.js'
import { ORCO } from './orco.js'
import { GUARDIA } from './guardia.js'
import { CAPITANO } from './capitano.js'
import { GOBLIN } from './goblin.js'
import { SCHELETRO } from './scheletro.js'
import { LUPO } from './lupo.js'
import { GATTO, MANTI as MANTI_GATTO } from './gatto.js'
import { ORSO, MANTI as MANTI_ORSO } from './orso.js'
import { PAPERA, MANTI as MANTI_PAPERA } from './papera.js'

/* gli eroi prima, i mostri poi, gli animali per ultimi: è l'ordine in
   cui compaiono nella vetrina, e non conta per nient'altro */
export const PERSONE = {
  cavaliere: CAVALIERE, ladra: LADRA, elfo: ELFO, mago: MAGO,
  orco: ORCO, guardia: GUARDIA, capitano: CAPITANO,
  goblin: GOBLIN, scheletro: SCHELETRO, lupo: LUPO,
  gatto: GATTO, orso: ORSO, papera: PAPERA,
}

export const PERSONAGGI = Object.keys(PERSONE)

/* chi ha più di un manto: nome → { manto: tavolozza } */
const MANTI = { gatto: MANTI_GATTO, orso: MANTI_ORSO, papera: MANTI_PAPERA }

/* la tabella dei pittori: nome → funzione(pennello, cosa) */
export const PITTORI_PERSONE = {}
for (const [nome, cfg] of Object.entries(PERSONE)) {
  const manti = MANTI[nome]
  PITTORI_PERSONE[nome] = cfg.quadrupede
    ? (p, c, S = p.S) => bestia(p, c, S, manti && manti[c.manto] ? { ...cfg, col: manti[c.manto] } : cfg)
    : (p, c, S = p.S) => persona(p, c, S, cfg)
}
