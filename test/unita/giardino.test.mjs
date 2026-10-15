/* Verifica del motore del giardino, senza browser: i dati stanno in piedi, la
   partita è identica a parità di seme, le piante costano quello che dicono e
   ogni tipo fa la sua cosa (il girasole fa soli, la noce tiene, il gelo
   rallenta, il carretto salva una volta), la sosta torna com'era, e il
   giocatore finto vince le tappe facili e fatica in quelle dure.
   `node test/esegui.mjs giardino`
   tempo: 5 */
import { guastiDelleRegole, CAMPO, ALTEZZA } from '../../src/giochi/giardino/dati/regole.js'
import { PIANTE, guastiDellePiante } from '../../src/giochi/giardino/dati/piante.js'
import { ZOMBI } from '../../src/giochi/giardino/dati/zombi.js'
import { CAMPAGNA, QUANTE_TAPPE, guastiDellaCampagna, operazioniDi, corsieDi, sfidaDi, stellePer }
  from '../../src/giochi/giardino/dati/campagna.js'
import { Partita } from '../../src/giochi/giardino/motore/partita.js'
import { caso, gioca } from '../../src/giochi/giardino/motore/banco.js'
import { scrivi, leggi, dice, VERSIONE } from '../../src/giochi/giardino/motore/sosta.js'
import manifesto from '../../src/giochi/giardino/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const sfida = (extra = {}) => ({ chiave: 't', piante: Object.keys(PIANTE), soli: 1000, corsie: [0, 1, 2, 3, 4],
                                  zombi: { n: 1, durata: 40, tipi: ['normale'] }, capo: false, ...extra })
const nuova = (extra, seme = 1) => new Partita({ sfida: sfida(extra), rnd: caso(seme) })
// niente zombi in campo, ma uno che arriva tardi: se no la tappa finisce subito, vinta
const senzaZombi = p => { p.arrivi = [{ t: 9999, col: 1, tipo: 'normale' }]; p.zombi = []; return p }

/* ══════════ 1. i dati ══════════ */
const guasti = [...guastiDelleRegole(), ...guastiDellePiante(), ...guastiDellaCampagna()]
controlla('i dati non hanno guasti', guasti.length === 0, guasti.join(' · '))
uguale('nove tappe', QUANTE_TAPPE, 9)
uguale('la prima chiede solo addizioni', operazioniDi(CAMPAGNA[0]).join(''), '+')
uguale('l\'ultima le chiede tutte', operazioniDi(CAMPAGNA[QUANTE_TAPPE - 1]).length, 4)
uguale('tre corsie sono le centrali', corsieDi(CAMPAGNA[0]).join(','), '1,2,3')
uguale('cinque corsie le prendono tutte', corsieDi(CAMPAGNA[2]).join(','), '0,1,2,3,4')
uguale('senza carretti partiti: tre stelle', stellePer({ vinto: true, carretti: 0 }), 3)
uguale('con uno: due', stellePer({ vinto: true, carretti: 1 }), 2)
uguale('con di più: una', stellePer({ vinto: true, carretti: 3 }), 1)
uguale('persa: nessuna', stellePer({ vinto: false, carretti: 0 }), 0)

/* ══════════ 2. la partita è determinata dal seme ══════════ */
const giro = () => JSON.stringify(gioca({ sfida: sfidaDi(CAMPAGNA[2]), seme: 7 }))
controlla('stesso seme, stessa partita', giro() === giro())

/* ══════════ 3. comprare e piantare ══════════ */
{
  const p = nuova({ soli: 100 })
  uguale('si parte coi soli della tappa', p.soli, 100)
  controlla('il girasole si può comprare', p.puoComprare('girasole'))
  controlla('lo si pianta in una cella libera', p.pianta('girasole', 2, 6))
  uguale('e costa i suoi soli', p.soli, 50)
  uguale('e parte la ricarica fissa', p.cd.girasole, PIANTE.girasole.ricarica)
  controlla('finché si ricarica non se ne pianta un altro', !p.puoComprare('girasole') && !p.pianta('girasole', 3, 6))
  p.avanza(PIANTE.girasole.ricarica + 0.1)
  controlla('poi si può di nuovo', p.puoComprare('girasole'))
  controlla('ma non nella stessa cella', !p.pianta('girasole', 2, 6))
  controlla('né nelle righe d\'ingresso degli zombi', !p.libera(2, CAMPO.rigaMin - 1))
  p.soli = 0
  controlla('senza soli non si compra', !p.puoComprare('tiratore') && !p.pianta('tiratore', 1, 6))
  const stretta = nuova({ corsie: [1, 2, 3] })
  controlla('una corsia chiusa non si pianta', !stretta.libera(0, 5) && stretta.libera(1, 5))
  uguale('il conto lo dice la pianta: il tiratore chiede una somma', stretta.calcoloDi('tiratore').op, '+')
  uguale('la noce una sottrazione', stretta.calcoloDi('noce').op, '−')
  controlla('un conto più caro pesa di più', stretta.calcoloDi('doppio').peso > stretta.calcoloDi('noce').peso)
}

/* ══════════ 4. cosa fa ogni pianta ══════════ */
{
  const p = senzaZombi(nuova({ soli: 0 }))
  p.piante.push({ id: 'girasole', c: 1, r: 7, vita: 8, tempo: 0 })
  p.avanza(PIANTE.girasole.ogni + 0.2)
  controlla('il girasole lascia un sole da prendere', p.raccolte.some(s => s.v === PIANTE.girasole.sole && s.ty > 400))
  const prima = p.soli
  const i = p.raccolte.findIndex(s => s.v === PIANTE.girasole.sole)
  controlla('toccato, il sole si prende', p.raccogli(i) && p.soli === prima + PIANTE.girasole.sole)
}
{
  const p = nuova({ soli: 0 })
  p.piante.push({ id: 'tiratore', c: 2, r: 6, vita: 8, tempo: 0 })
  p.arrivi = []
  p.zombi.push({ tipo: 'normale', c: 2, y: 100, vita: 7, lento: 0 })
  p.zombi.push({ tipo: 'normale', c: 3, y: 100, vita: 7, lento: 0 })
  p.avanza(4)
  const dentro = p.zombi.find(z => z.c === 2), fuori = p.zombi.find(z => z.c === 3)
  controlla('il tiratore colpisce chi sta nella sua corsia', !dentro || dentro.vita < 7)
  uguale('e non quello di un\'altra corsia', fuori.vita, 7)
}
{
  const p = nuova({ soli: 0 })
  p.arrivi = []
  p.piante.push({ id: 'noce', c: 2, r: 5, vita: 40, tempo: 0 })
  p.zombi.push({ tipo: 'normale', c: 2, y: 200, vita: 7, lento: 0 })
  p.avanza(30)
  const z = p.zombi[0]
  controlla('uno zombi si ferma davanti alla pianta e la mangia', z.y < 5 * CAMPO.cella + 22 && p.piante[0].vita < 40)
}
{
  const p = nuova({ soli: 0 })
  p.arrivi = []
  p.piante.push({ id: 'gelo', c: 2, r: 6, vita: 8, tempo: 0 })
  p.zombi.push({ tipo: 'normale', c: 2, y: 100, vita: 14, lento: 0 })
  p.avanza(2.5)
  controlla('il gelo rallenta chi colpisce', p.zombi[0].lento > 0)
  const normale = nuova({ soli: 0 }); normale.arrivi = []
  normale.zombi.push({ tipo: 'normale', c: 2, y: 100, vita: 14, lento: 0 })
  normale.avanza(2.5)
  controlla('e lo zombi rallentato è andato meno lontano', p.zombi[0].y < normale.zombi[0].y)
}

/* ══════════ 5. il carretto, la vittoria e la sconfitta ══════════ */
{
  const p = nuova({ soli: 0 })
  p.arrivi = []
  p.zombi.push({ tipo: 'normale', c: 2, y: ALTEZZA - 1, vita: 7, lento: 0 })
  p.zombi.push({ tipo: 'normale', c: 2, y: 100, vita: 7, lento: 0 })
  p.avanza(0.5)
  controlla('il carretto spazza la corsia', p.zombi.filter(z => z.c === 2).length === 0)
  uguale('e conta', p.usati, 1)
  controlla('una volta sola', p.carretti[2] === false && p.carretti[1] === true)
  uguale('la partita non è persa', p.fine, 'vinto')   // niente più zombi: la corsia è salva
  const q = nuova({ soli: 0, zombi: { n: 1, durata: 40, tipi: ['normale'] } })
  q.carretti[2] = false
  q.zombi.push({ tipo: 'normale', c: 2, y: ALTEZZA - 1, vita: 7, lento: 0 })
  q.avanza(0.5)
  uguale('senza carretto, uno zombi in casa perde', q.fine, 'perso')
}
{
  const p = nuova({ soli: 0 })
  controlla('finché ne arrivano non si vince', p.fine === null && p.restano === 1)
  p.avanza(120)
  controlla('chi non fa niente prima o poi finisce: il carretto ne salva uno, non di più', p.fine !== null)
}

/* ══════════ 6. la sosta ══════════ */
{
  const p = new Partita({ sfida: sfidaDi(CAMPAGNA[2]), rnd: caso(3) })
  p.pianta('girasole', 1, 7)
  p.avanza(30)
  const dato = JSON.parse(JSON.stringify(scrivi(p, 2)))
  controlla('si scrive dopo qualche secondo', dato && dato.v === VERSIONE)
  const letto = leggi(dato)
  controlla('e si rilegge', !!letto && letto.indice === 2)
  uguale('con le piante', letto.partita.piante.length, p.piante.length)
  uguale('i soli', letto.partita.soli, Math.floor(p.soli))
  uguale('e gli zombi che devono ancora arrivare', letto.partita.arrivi.length, p.arrivi.length)
  uguale('la carta in cima alla mappa dice la tappa', dice(dato).nome, CAMPAGNA[2].nome)
  controlla('una partita appena cominciata non si salva', scrivi(new Partita({ sfida: sfidaDi(CAMPAGNA[0]) }), 0) === null)
  controlla('una versione di un\'altra epoca si butta', leggi({ ...dato, v: VERSIONE + 1 }) === null)
  controlla('una pianta in una cella impossibile si butta', leggi({ ...dato, piante: [{ id: 'girasole', c: 9, r: 1, vita: 8, tempo: 0 }] }) === null)
  controlla('una tappa che non esiste si butta', leggi({ ...dato, chiave: 'boh' }) === null)
  controlla('l\'immondizia non fa cadere il gioco', leggi('boh') === null && leggi(null) === null && leggi({ v: VERSIONE }) === null)
}

/* ══════════ 7. il giocatore finto ══════════ */
{
  const SEMI = 12
  const vinte = (i, giocatore) => {
    let v = 0
    for (let s = 1; s <= SEMI; s++) v += gioca({ sfida: sfidaDi(CAMPAGNA[i]), seme: s, giocatore }).vinto ? 1 : 0
    return v / SEMI
  }
  controlla('chi gioca bene vince la prima tappa quasi sempre', vinte(0, 'attento') >= 0.9)
  controlla('e anche chi è sbadato la porta a casa', vinte(0, 'sbadato') >= 0.6)
  controlla('l\'ultima tappa chiede di giocare bene: lo sbadato non basta', vinte(QUANTE_TAPPE - 1, 'sbadato') <= vinte(QUANTE_TAPPE - 1, 'attento'))
  controlla('ma si può vincere', vinte(QUANTE_TAPPE - 1, 'attento') >= 0.4)
}

/* ══════════ 8. il manifesto ══════════ */
controlla('il manifesto è in prova (sperimentale)', manifesto.sperimentale === true)
uguale('e dice quante tappe ha', manifesto.tappe, QUANTE_TAPPE)
const guastiAlbo = guastiDellAlbo([manifesto])
controlla('l\'albo non ha guasti', guastiAlbo.length === 0, guastiAlbo.join(' · '))
controlla('il riassunto parla della tappa', manifesto.riassunto({ tappa: 1, stelle: { 0: 3 } }).includes(CAMPAGNA[1].nome))
controlla('gli zombi del capo esistono', !!ZOMBI.gigante)

riassunto('giardino')
