/* ═══════════════════════════════════════════════════════════════════
   LE PERSONE 3D DEL MONDO DI SOPRA — docs/sotterraneo/persone-3d.md

   Chi sta sulla terra di sopra (le persone fuori dalle città, quelle
   nuove, i quattro mercanti, i personaggi delle missioni, i viandanti,
   il minatore, la sentinella) ha un modello in scena3d/persone3d/; la
   lista senza three delle viste (dati/persone3d.js) è quella dei
   modelli; ogni modello si costruisce in Node, sta sotto i 2500
   triangoli, ha i piedi a terra, un'altezza da persona e si anima e
   saluta senza rompersi, in poche mesh (la pelle fusa).
   ═══════════════════════════════════════════════════════════════════ */
import { Box3 } from 'three'
import { creaPersona, CHIAVI } from '../../src/giochi/sotterraneo/scena3d/persone3d/persone.js'   // in Node la faccia è senza trama
import { PERSONE, PERSONE_NUOVE } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { MERCANTI } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { PERSONAGGI_DI_SOPRA } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { VIANDANTI } from '../../src/giochi/sotterraneo/dati/missioni-modelli.js'
import { MODELLI_PERSONE } from '../../src/giochi/sotterraneo/dati/persone3d.js'
import { controlla, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'


stessaLista('dati/persone3d.js è l\'elenco dei modelli', [...MODELLI_PERSONE].sort(), [...CHIAVI].sort())

/* ── chi sta sopra ha un modello (il nome dello sprite; il capitano il suo) ── */
{
  const modelloDi = k => (k === 'capitano' ? 'capitano' : (PERSONAGGI_DI_SOPRA[k] || {}).sprite || k)
  const chi = [
    ...PERSONE.map(p => ['PERSONE', p.chiave, modelloDi(p.chiave)]),
    ...Object.keys(PERSONE_NUOVE).map(k => ['PERSONE_NUOVE', k, modelloDi(k)]),
    ...MERCANTI.map(m => ['mercanti', m.chiave, m.sprite]),
    ...Object.keys(PERSONAGGI_DI_SOPRA).map(k => ['missioni', k, modelloDi(k)]),
    ...VIANDANTI.map(v => ['viandanti', v.chiave, v.sprite]),
    ['minatore', 'minatore', 'minatore'], ['sentinella', 'sentinella', 'guardia'],
  ]
  const senza = chi.filter(([, , m]) => !CHIAVI.includes(m))
  controlla('ognuno ha il suo modello 3D', senza.length === 0, senza.map(x => x.join(':')).join(', '))
  nota(`${chi.length} persone, ${new Set(chi.map(x => x[2])).size} modelli`)
}

/* ── ogni modello si costruisce, sta nel tetto, ha i piedi a terra, si anima e saluta ── */
for (const k of CHIAVI) {
  let g
  try { g = creaPersona(k) } catch (e) { controlla(`${k}: si costruisce`, false, e.message); continue }
  const u = g.userData
  controlla(`${k}: chiave, anima, saluta`, u.chiave === k && typeof u.anima === 'function' && typeof u.saluta === 'function')
  dentro(`${k}: triangoli`, u.triangoli, 300, 2500)
  dentro(`${k}: altezza (senza gli arnesi)`, u.altezza, 0.85, 1.4)
  try {
    for (const t of [0, 1.3, 4.2, 9.7]) u.anima(t)
    u.saluta(10); for (const t of [10.2, 11, 12.3]) u.anima(t)
    controlla(`${k}: si anima e saluta`, true)
  } catch (e) { controlla(`${k}: si anima e saluta`, false, e.message) }
  // fermo (fuori dal gesto), i piedi a terra
  u.anima(0); g.updateMatrixWorld(true)
  const b = new Box3().expandByObject(g, true)          // preciso: i pezzi fermi sono nella pelle (SkinnedMesh), seguono i perni
  dentro(`${k}: i piedi a terra`, Math.round(b.min.y * 1000) / 1000, -0.03, 0.03)
  let mesh = 0; g.traverse(o => { if (o.isMesh) mesh++ })
  dentro(`${k}: poche chiamate di disegno (mesh)`, mesh, 2, 9)
}

riassunto('persone 3d del sotterraneo')
