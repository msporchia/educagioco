/* ═══════════════════════════════════════════════════════════════════
   L'EROE 3D SALDATO — docs/sotterraneo/prestazioni-3d.md

   L'eroe vestito di tutto si salda come i mostri: le mesh ferme con lo
   stesso perno e lo stesso materiale diventano una, e il resto va nella
   pelle (una SkinnedMesh per materiale). Qui: le chiamate scendono sotto
   il tetto, e in ogni posa (guardia coi gesti, marcia, colpo) l'eroe
   saldato ha i vertici dove li ha quello non saldato: nessun pezzo che
   si muove è finito in una saldatura, la pelle segue le ossa.
   ═══════════════════════════════════════════════════════════════════ */
import { creaEroe } from '../../src/giochi/sotterraneo/scena3d/eroi3d/eroi.js'
import { vestiEroe, posa, saldaEroe } from '../../src/giochi/sotterraneo/scena3d/eroe3d.js'
import { vertici, disegnate } from '../../src/giochi/sotterraneo/scena3d/salda3d.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

// l'eroe disegna la faccia su una tela: in Node ne basta una finta
const c2d = new Proxy({}, { get: (_, k) => (k === 'canvas' ? {} : () => ({ data: [] })), set: () => true })
globalThis.document = globalThis.document || { createElement: () => ({ width: 0, height: 0, getContext: () => c2d }) }

const comune = { corpo: 'corazza@2.u.corazza-del-drago', collo: 'amuleto-rosso@2.u.amuleto-della-fenice', testa: 'cuffia@2.r.rigenera.fortuna' }
const VESTITI = {
  cavaliere: { mano: 'spada@2.u.zanna-del-drago', mancina: 'scudo-ferro@2.u.scudo-del-gigante' },
  mago: { mano: 'bastone-magico@2.u.bastone-della-tempesta', corpo: 'manto@2.u.manto-della-notte' },
  elfa: { mano: 'arco-lungo@2.u.arco-della-luna' },
  nano: { mano: 'ascia@2.u.ascia-del-re-nano' },
}
const chiamate = g => { let n = 0; disegnate(g, () => n++); return n }
// dove stanno nel mondo tutti i vertici delle mesh che si disegnano (somme e quadrati), pelle compresa: saldare non toglie né sposta
// vertici
function impronta(g) {
  const s = [0, 0, 0, 0]
  vertici(g, v => { s[0] += v.x; s[1] += v.y; s[2] += v.z; s[3] += v.lengthSq() })
  return s
}
// il tetto delle chiamate dell'eroe vestito di tutto (docs/sotterraneo/prestazioni-3d.md, «Meno chiamate»): può solo scendere
const TETTO = 40
const vicine = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-3 * Math.max(1, Math.abs(x)))

// le pose hanno memoria (la barba del nano si somma): ogni posa si prova su due eroi nuovi con la stessa storia, uno saldato (con gli
// indici già trovati) e uno no
const vestito = (chi, roba) => { const g = creaEroe(chi); vestiEroe(g, roba); return g }
for (const [chi, v] of Object.entries(VESTITI)) {
  const roba = { ...comune, ...v }, chiave = `prova|${chi}`
  const primo = vestito(chi, roba), prima = chiamate(primo)
  saldaEroe(primo, chiave)
  const dopo = chiamate(primo)
  nota(`${chi}: ${prima} → ${dopo} mesh`)
  controlla(`${chi}: saldato ha meno mesh (${prima} → ${dopo})`, dopo < prima * 0.8)
  controlla(`${chi}: saldato sta nel tetto (${dopo} ≤ ${TETTO})`, dopo <= TETTO)
  let diverse = 0
  for (let i = 0; i < 24; i++) {
    const t = i * 31.7, cammina = i % 3 === 1, colpo = i % 4 === 2 ? (i % 7) / 6 : null
    const nudo = vestito(chi, roba), saldato = vestito(chi, roba)
    posa(nudo, 0, false, null); saldaEroe(saldato, chiave)
    posa(nudo, t, cammina, colpo); posa(saldato, t, cammina, colpo)
    if (!vicine(impronta(nudo), impronta(saldato))) diverse++
  }
  controlla(`${chi}: in ogni posa i vertici stanno dove stavano`, diverse === 0, `${diverse} pose diverse`)
}

riassunto("l'eroe 3D saldato")
