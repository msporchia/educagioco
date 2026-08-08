/* ═══════════════════════════════════════════════════════════════════
   DAL MOTORE ALLA SCENA

   Chi gioca non disegna. Il campo non chiama mai un contesto 2D: dice
   *cosa* c'è e dove, e chi lo dipinge sta in `grafica/`. Questo file è
   quel travaso, e sta fuori dal componente perché è una traduzione —
   niente Vue, niente eventi, nessuno stato: entra un motore, esce una
   lista.

   Lo strato dice solo il piano: −1 per terra, 0 in piedi (e lì la tela
   ordina da sola per profondità), 1 in volo.

   L'unica regola di gioco che passa di qui è la più piccola possibile:
   se una torre può ancora salire e se l'energia basta. Sono due
   booleani già decisi — in `grafica/` non entrano prezzi.
   ═══════════════════════════════════════════════════════════════════ */
import { costoSalita } from '../../data/castello.js'

export function scenaDi(motore, { S, trascino = null, tetto = 10, energia = 0, occupato = false }) {
  const roba = []
  if (!motore) return roba

  /* Piazzole e raggio d'azione si accendono soltanto mentre si sposta
     una torre: è l'unico momento in cui uno si sta chiedendo «dove ci
     sta?» e «fin dove arriva?». Sempre accesi erano aloni colorati che
     sporcavano il prato senza dire niente di nuovo. */
  if (trascino && trascino.mosso) {
    for (const p of motore.postazioni) {
      if (motore.torri.some(t => t !== trascino.torre && Math.hypot(t.x - p.x, t.y - p.y) < 2)) continue
      roba.push({ che: 'piazzola', strato: -1, x: p.x, y: p.y, scelta: trascino.posto === p })
    }
    const t = trascino.torre
    roba.push({ che: 'raggio', strato: -1, x: t.x, y: t.y, tipo: t.tipo, r: t.raggio(S) })
  }

  for (const s of motore.schizzi)
    roba.push({ che: 'schizzo', strato: -1, x: s.x, y: s.y, r: s.r,
                vita: s.vita, tipo: s.tipo, gelo: s.gelo })

  for (const t of motore.torri)
    roba.push({ che: 'torre', x: t.x, y: t.y, tipo: t.tipo, lv: t.lv,
                potenziabile: t.lv < tetto && !occupato,
                posso: energia >= costoSalita(t.lv) })

  for (const n of motore.nemici) {
    const p = motore.via.puntoA(n.d)
    roba.push({ che: 'mostro', x: p.x, y: p.y, bestia: n.bestia, vola: n.vola,
                debole: n.debole, vita: n.quota, gelo: n.gelo })
  }

  const via = motore.via
  roba.push({ che: 'castello', x: via.fine.x - 2 * S, y: via.fine.y + 4 * S })
  for (const c of motore.colpi)
    roba.push({ che: 'colpo', strato: 1, x: c.x, y: c.y, tx: c.tx, ty: c.ty, t: c.t, tipo: c.tipo })
  return roba
}
