// Il nemico: gioca con le stesse regole e le stesse monete del giocatore, e
// decide ogni tanto (`pensa`). Non bara: non vede niente che a schermo non
// si veda. Una mossa per volta, e la prima che gli va bene.
import { TRUPPE } from '../dati/regole.js'

export function pensaNemico(p, dt) {
  p.pensa -= dt
  if (p.pensa > 0) return
  p.pensa = p.nemicoCfg.pensa
  const l = p.lati.nem

  // 0. la bomba in regalo, quando ha davanti un ammasso che vale la pena spazzare
  const colpo = l.bombe > 0 ? p.puntoDellaBomba('nem') : null
  if (colpo && colpo.peso >= 700 && p.rnd() < 0.7) { p.fai('nem', 'bomba'); return }

  // 1. ripara quello che è messo male (il muro crollato per primo)
  const ferite = p.riparabili('nem').filter(e => e.hp < e.max * 0.55)
  if (ferite.length && p.puoFare('nem', 'ripara') && p.rnd() < 0.5) { p.fai('nem', 'ripara'); return }

  // 2. la miniera, ma non prima di aver respirato
  if (p.t > 15 && p.puoFare('nem', 'miniera') && p.rnd() < 0.3) { p.fai('nem', 'miniera'); return }

  // 3. il castello
  if (p.t > 12 && p.puoFare('nem', 'castello') && p.rnd() < 0.2) { p.fai('nem', 'castello'); return }

  // 5. una caserma nuova (le prime sempre, poi a volte), o la più indietro sale
  const mie = p.casermeDi('nem')
  const nuove = Object.keys(TRUPPE).filter(id => p.puoFare('nem', 'costruisci', id))
  if (nuove.length && (mie.length < 3 || p.rnd() < 0.4)) {
    p.fai('nem', 'costruisci', nuove[p.casuale(0, nuove.length - 1)])
    return
  }
  const salgono = mie.filter(c => p.puoFare('nem', 'potenzia', c.id))
  if (!salgono.length) return
  const minimo = Math.min(...salgono.map(c => c.liv))
  const indietro = salgono.filter(c => c.liv === minimo)
  p.fai('nem', 'potenzia', indietro[p.casuale(0, indietro.length - 1)].id)
}
