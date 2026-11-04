/* Il guerriero di Passo passo: le regole di grate, nemici e spada su mappe
   piccole, e le venti tappe della sua strada. Vedi docs/passo-passo/guerriero.md. */
import { CAMPAGNA, SCALINI, delGuerriero, FINE_STRADA, guastiDellaCampagna } from '../../src/giochi/passo-passo/dati/campagna.js'
import { guastiDellaMappa } from '../../src/giochi/passo-passo/dati/mondo.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { esegui, Mondo, TANA, SBATTE, CADUTO, eErrore } from '../../src/giochi/passo-passo/motore/mondo.js'
import { risolvi, misura, serveLaRegola, suggerisci } from '../../src/giochi/passo-passo/motore/risolutore.js'
import { pensieroDi } from '../../src/giochi/passo-passo/motore/aiuti.js'
import { seguiConsiglio } from '../../src/giochi/passo-passo/motore/fila.js'
import { STRADE, aperture, cosaManca } from '../../src/giochi/passo-passo/motore/strade.js'
import { Proiezione, fotogrammaIniziale } from '../../src/giochi/passo-passo/scena/proiezione.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const L = (mappa, opz = {}) => new Livello(mappa, opz)
const gioca = (mappa, fila, opz) => esegui(L(mappa, opz), fila)
const eventi = r => r.passi.flatMap(p => p.eventi.map(e => e.che))

/* ══════════ i pulsanti e le grate ══════════ */
{
  const G = ['P.R.Q', 'W4WcW']
  uguale('una grata chiusa ferma come un muro', gioca(G, ['destra', 'destra']).esito, SBATTE)
  const r = gioca(G, ['destra', 'giu', 'su', 'destra', 'destra', 'destra'])
  uguale('il pulsante apre la grata del suo colore', r.esito, TANA)
  controlla('e lo dice una volta sola', eventi(r).filter(e => e === 'pulsante').length === 1)
  uguale('la grata resta aperta ripassando sul pulsante',
         gioca(G, ['destra', 'giu', 'su', 'giu', 'su', 'destra', 'destra', 'destra']).esito, TANA)
  const A = ['P.5.Rc.Q', 'WWWWWWWW']
  uguale('il pulsante di un altro colore non la apre', gioca(['P5.4Rc.Q', 'WWWWWWWW'], ['destra', 'destra', 'destra', 'destra', 'destra']).mondo.aperte, 3)
  controlla('una grata senza il suo pulsante è un guasto', guastiDellaMappa(A).some(g => g.includes('rossa')) === true)
  uguale('il salto non scavalca una grata', gioca(['P.Rc.Q', 'WWWWWW'], ['destra', 'salto-destra'], { salti: true }).esito, SBATTE)
  const S = ['P.4c.R.Q', 'WWWWWWWW']
  const salto = gioca(S, ['destra', 'salto-destra', 'destra', 'destra', 'destra'], { salti: true })
  uguale('saltandoci sopra il pulsante non si preme', salto.esito, SBATTE)
  const masso = gioca(['Pm4.Rc.Q', 'WWWWWWWW'], ['destra'])
  uguale('un masso che ci finisce sopra lo preme', masso.mondo.aperte, 1)
  controlla('il mondo col pulsante premuto non è lo stesso punto della partita',
            new Mondo(L(G)).chiave() !== esegui(L(G), ['destra', 'giu']).mondo.chiave())
}

/* ══════════ i nemici e la spada ══════════ */
{
  const N = ['P...nQ', 'WWWcWW']
  uguale('fermarsi accanto a un nemico senza spada è la fine', gioca(N, ['destra', 'destra', 'destra']).esito, CADUTO)
  controlla('è un errore come sbattere', eErrore(CADUTO))
  const lontano = gioca(N, ['destra', 'destra'])
  controlla('a due caselle non succede niente', !eErrore(lontano.esito))
  const D = ['P.n', '...', 'Qc.']
  controlla('in diagonale non ti vede', !eErrore(gioca(D, ['giu', 'destra']).esito))
  const S = ['Ps..n.Q', 'WWWcWWW']
  const r = gioca(S, ['destra', 'destra', 'destra', 'destra', 'destra', 'destra'])
  uguale('con la spada il nemico si batte', r.esito, TANA)
  controlla('e sparisce dalla scena', r.mondo.nemici.length === 0 && eventi(r).includes('duello'))
  const due = ['Ps.n.', '.....', 'Qc.n.']
  uguale('contro due insieme nemmeno la spada basta', gioca(due, ['destra', 'giu', 'destra', 'destra']).esito, CADUTO)
  const scivola = gioca(['WnW.W', 'P***.', 'WWWWc', 'QWWWW'], ['destra'])
  controlla('chi scivola davanti a un nemico non si è fermato', !eErrore(scivola.esito))
  const salta = gioca(['Wn.WWWc', 'P~.~.Q.'], ['salto-destra', 'salto-destra'], { salti: true })
  controlla('conta solo dove finisce', eventi(salta).length >= 2)
  uguale('la principessa vince anche con un nemico accanto', gioca(['P.Qn', 'WcWW'], ['destra', 'destra']).esito, TANA)
}

/* ══════════ la scena ══════════ */
{
  const S = L(['Ps..n.Q', 'WWWcWWW'])
  const pro = new Proiezione(S, esegui(S, ['destra', 'destra', 'destra', 'destra', 'destra', 'destra']))
  const inizio = fotogrammaIniziale(S)
  uguale('all\'inizio il nemico c\'è e la spada è per terra', inizio.nemici.length + (inizio.spada.presa ? 1 : 0), 1)
  const fine = pro.fotogramma(pro.durata)
  controlla('alla fine il nemico non c\'è più', fine.nemici[0].alfa === 0)
  controlla('e il guerriero ha la spada in mano', fine.armato)
  controlla('e fa festa con la principessa', fine.festa && fine.coniglio.alfa === 1)
  const G = L(['P.R.Q', 'W4WcW'])
  const pg = new Proiezione(G, esegui(G, ['destra', 'giu']))
  uguale('la grata si alza del tutto', pg.fotogramma(pg.durata).grate[0].su, 1)
  const C = L(['P...nQ', 'WWWcWW'])
  const pc = new Proiezione(C, esegui(C, ['destra', 'destra', 'destra']))
  controlla('chi cade ha la sua scenetta, e si torna alla partenza', pc.errore && pc.fotogramma(pc.tScenetta + 0.1).scenetta === 'caduto')
  uguale('e il mondo torna com\'era', pc.fotogramma(pc.durata).nemici[0].alfa, 1)
}

/* ══════════ la strada ══════════ */
{
  const g = guastiDellaCampagna()
  controlla('la campagna non ha guasti', g.length === 0, g.join(' · '))
  const sua = CAMPAGNA.map((t, i) => i).filter(i => delGuerriero(CAMPAGNA[i]))
  uguale('venti tappe, cinque per isola', STRADE.guerriero.length, 20)
  uguale('quattro isole', STRADE.isole.filter(s => s.animale === 'guerriero').map(s => `${s.scalino}:${s.tappe.length}`).join(' '),
         'grate:5 nemici:5 due:5 castello:5')
  controlla('stanno in coda: nessuna muove la fine della strada del coniglio', sua.every(i => i >= FINE_STRADA))
  const finitiIPiccoli = i => i <= STRADE.apreIlCane
  uguale('comincia quando comincia il cane', aperture(STRADE, { fatta: finitiIPiccoli }).aperta(STRADE.guerriero[0]), true)
  uguale('e prima no', aperture(STRADE, { fatta: i => i < STRADE.apreIlCane }).aperta(STRADE.guerriero[0]), false)
  const chiusa = aperture(STRADE, { fatta: () => false })
  controlla('chiusa dice chi deve finire prima',
            cosaManca(STRADE, STRADE.guerriero[0], { fatta: () => false, aperta: chiusa.aperta }).startsWith('Il guerriero comincia'))
}

/* ══════════ le tappe ══════════ */
for (const t of CAMPAGNA.filter(delGuerriero)) {
  const liv = Livello.da(t)
  const s = SCALINI.find(x => x.chiave === t.scalino)
  const m = misura(liv)
  controlla(`${t.chiave}: si vince con la corona`, !!m.conCarota)
  if (!m.conCarota) continue
  const regole = [s.regola, ...(t.regole || [])].filter(Boolean)
  controlla(`${t.chiave}: dichiara almeno una regola`, regole.length > 0)
  for (const r of regole) controlla(`${t.chiave}: ha bisogno della regola «${r}»`, serveLaRegola(liv, r))
  // nessuno parte con un nemico addosso
  controlla(`${t.chiave}: la partenza non sta accanto a un nemico`, liv.nemici.every(n => {
    const a = liv.xy(n), b = liv.xy(liv.partenza)
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 1
  }))
  /* le false piste: la mossa ingenua fa un pezzo di strada e poi si ferma male */
  if (liv.nemici.length) controlla(`${t.chiave}: dichiara le sue trappole`, (t.trappole || []).length > 0)
  for (const tr of t.trappole || []) {
    const r = esegui(liv, tr)
    controlla(`${t.chiave}: la trappola non vince, dopo almeno due passi`, eErrore(r.esito) && r.passi.length >= 2, `${r.esito} dopo ${r.passi.length}`)
  }
  // chi segue soltanto gli aiuti arriva dalla principessa
  let fila = [], cursore = 0
  for (let k = 0; k < 60; k++) {
    const c = suggerisci(liv, fila)
    if (!c || c.che === 'via') break
    ;({ fila, cursore } = seguiConsiglio(fila, cursore, c))
  }
  uguale(`${t.chiave}: chi segue gli aiuti arriva`, esegui(liv, fila, { eventi: false }).esito, TANA)
  uguale(`${t.chiave}: l'aiuto ha due frasi`, pensieroDi(liv).length, 2)
}

riassunto('passo passo — il guerriero')
