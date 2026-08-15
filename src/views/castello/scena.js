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
   se una torre può ancora salire, se una piazzola è libera, e se
   l'energia basta. Sono booleani già decisi — in `grafica/` non entrano
   prezzi.

   ── quando si accendono le piazzole ──
   Da quando il banco non c'è più, il campo è l'unico posto dove si
   compra: se le piazzole restassero spente come prima, chi gioca non
   avrebbe nessun modo di sapere che lì si può costruire. Si accendono
   quando l'energia basta per una torre nuova — cioè quando toccarle
   serve a qualcosa — e restano spente quando non basta. È la stessa
   promessa che il bollino verde fa già sulle torri: acceso vuol dire
   «adesso puoi».
   ═══════════════════════════════════════════════════════════════════ */
import { costoSalita } from '../../data/castello.js'

export function scenaDi(motore, { S, trascino = null, tetto = 10, energia = 0,
                                  occupato = false, costoNuova = Infinity, mira = null }) {
  const roba = []
  if (!motore) return roba

  /* La piazzola che il dito sta guardando: quella sotto il foglio
     aperto, o quella dove sta per cadere la torre trascinata. */
  const inMano = trascino && trascino.mosso ? trascino.torre : null
  const mirata = mira && mira.piazzola != null ? mira.piazzola : -1
  /* si accendono quando toccarle serve a qualcosa: c'è l'energia per una
     torre nuova, oppure una torre sta cercando dove posarsi */
  const posso = (energia >= costoNuova && !occupato) || !!(mira && mira.muovendo)

  const sciolta = inMano || (mira && mira.muovendo ? mira.torre : null)
  motore.postazioni.forEach((p, i) => {
    if (!motore.libera(i, sciolta)) return
    const scelta = inMano ? trascino.posto === i : i === mirata
    // spenta: c'è la piazzola sul fondale, ma niente che inviti a toccarla
    if (!scelta && !posso && !inMano) return
    roba.push({ che: 'piazzola', strato: -1, x: p.x, y: p.y, scelta, viva: !inMano && !scelta })
  })

  /* Il raggio d'azione si vede in tre momenti, e sono tutti e tre lo
     stesso momento: quando uno si sta chiedendo «fin dove arriva?».
     Mentre sposta una torre, mentre guarda la scheda di una torre,
     mentre sceglie che cosa costruire su una piazzola. */
  const anteprima = mira && mira.raggio
    ? { x: mira.x, y: mira.y, r: mira.raggio, tipo: mira.tipo }
    : inMano ? { x: inMano.x, y: inMano.y, r: inMano.raggio(S), tipo: inMano.tipo } : null
  if (anteprima) roba.push({ che: 'raggio', strato: -1, ...anteprima })

  /* le bocche da cui scendono, quando sono più d'una: quella da cui sta
     per arrivare l'ondata è accesa, l'altra no */
  if (motore.percorso.quanteVie > 1) {
    const bocca = motore.bocca
    motore.percorso.vie.forEach((v, k) => {
      const q = v.puntoA(0)
      roba.push({ che: 'ingresso', strato: -1, x: q.x, y: q.y - 16 * S,
                  acceso: bocca === k || bocca < 0 })
    })
  }

  for (const s of motore.schizzi)
    roba.push({ che: 'schizzo', strato: -1, x: s.x, y: s.y, r: s.r,
                vita: s.vita, tipo: s.tipo, gelo: s.gelo })

  for (const t of motore.torri)
    roba.push({ che: 'torre', x: t.x, y: t.y, tipo: t.tipo, lv: t.lv, ramo: t.ramo,
                potenziabile: t.lv < tetto && !occupato,
                posso: energia >= costoSalita(t.lv),
                /* la torre di cui è aperta la scheda si stacca dal campo:
                   è quella di cui si sta parlando */
                alone: !!(mira && mira.torre === t) })

  for (const n of motore.nemici) {
    const p = motore.viaDi(n).puntoA(n.d)
    roba.push({ che: 'mostro', x: p.x, y: p.y, bestia: n.bestia, vola: n.vola,
                debole: n.debole, vita: n.quota, gelo: n.gelo })
  }

  const via = motore.via
  roba.push({ che: 'castello', x: via.fine.x - 2 * S, y: via.fine.y + 4 * S })
  for (const c of motore.colpi)
    roba.push({ che: 'colpo', strato: 1, x: c.x, y: c.y, tx: c.tx, ty: c.ty, t: c.t, tipo: c.tipo })
  return roba
}
