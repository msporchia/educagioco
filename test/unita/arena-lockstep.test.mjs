/* Due copie della stessa partita, lo stesso seme e gli stessi comandi alle stesse fette di tempo, devono restare
   identiche fino all'ultimo bit: è la condizione per giocare in due scambiandosi solo le mosse (docs/arena/multigiocatore.md).
   Il nemico automatico è spento (`umano`): lo muove l'altro giocatore. */
import { Partita } from '../../src/giochi/arena/motore/partita.js'
import { caso } from '../../src/giochi/arena/motore/banco.js'
import { CAMPAGNA } from '../../src/giochi/arena/dati/campagna.js'
import { TRUPPE } from '../../src/giochi/arena/dati/regole.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const FETTA = 0.05                                          // la fetta di tempo del motore: un tick
const sfida = { truppe: CAMPAGNA[11].truppe, nemico: 'normale', umano: true, monete: 300 }

/* l'impronta di tutto quello che conta, senza arrotondare niente */
const impronta = p => JSON.stringify({
  t: p.t, fine: p.fine, lati: p.lati,
  castelli: p.castelli.map(c => [c.hp, c.liv]), muri: p.muri.map(m => [m.hp, m.crollato]),
  caserme: p.caserme.map(c => [c.lato, c.id, c.posto, c.liv, c.hp, c.t]),
  unita: p.unita.map(u => [u.id, u.lato, u.x, u.y, u.hp]),
})

/* una partita finta ma fitta di scelte: costruisce, potenzia, ripara e lancia la bomba, dall'una e dall'altra parte */
function copione(seme, ticks) {
  const r = caso(seme), cmd = []
  const ids = Object.keys(TRUPPE)
  for (let k = 0; k < ticks; k++) {
    if (r() > 0.04) continue
    const lato = r() < 0.5 ? 'io' : 'nem'
    const a = r()
    if (a < 0.4) cmd.push({ k, lato, azione: 'costruisci', chi: ids[Math.floor(r() * ids.length)], dove: Math.floor(r() * 6) })
    else if (a < 0.7) cmd.push({ k, lato, azione: 'potenzia', chi: Math.floor(r() * 6) })
    else if (a < 0.8) cmd.push({ k, lato, azione: 'miniera' })
    else if (a < 0.9) cmd.push({ k, lato, azione: 'ripara' })
    else cmd.push({ k, lato, azione: 'bomba' })
  }
  return cmd
}

function gioca(seme, cmd, ticks, raggruppa = 1) {
  const p = new Partita({ rnd: caso(seme), sfida })
  let i = 0
  for (let k = 0; k < ticks && !p.fine; k++) {
    while (i < cmd.length && cmd[i].k === k) {
      const c = cmd[i++]
      p.lati[c.lato].monete = Math.max(p.lati[c.lato].monete, 40)   // i comandi si pagano: il copione non deve fermarsi per le monete
      p.fai(c.lato, c.azione, c.chi, c.dove)
    }
    p.avanza(FETTA)
  }
  return p
}

const TICKS = 4000                                         // tre minuti e mezzo di partita
for (const seme of [3, 11, 29]) {
  const cmd = copione(seme, TICKS)
  const a = gioca(seme, cmd, TICKS), b = gioca(seme, cmd, TICKS)
  controlla(`seme ${seme}: la partita è piena di cose (${cmd.length} comandi, ${a.unita.length} unità in campo)`, cmd.length > 40 && a.t > 100)
  uguale(`seme ${seme}: due copie con gli stessi comandi sono identiche al bit`, impronta(a) === impronta(b), true)
}
{
  const cmd = copione(5, TICKS)
  const a = gioca(5, cmd, TICKS)
  const spostato = cmd.map(c => ({ ...c, k: c.k + 40 }))      // due secondi di ritardo su tutto
  const b = gioca(5, spostato, TICKS)
  controlla('comandi applicati in ritardo fanno un\'altra partita (per questo ogni comando ha un tick d\'applicazione concordato)', impronta(a) !== impronta(b))
}
{
  const p = new Partita({ rnd: caso(1), sfida })
  const monete = p.lati.nem.monete
  p.avanza(5)
  controlla('con `umano` il nemico non fa nulla da sé', p.casermeDi('nem').length === 0 && p.lati.nem.monete >= monete)
}
riassunto('arena in due: le copie restano identiche')
