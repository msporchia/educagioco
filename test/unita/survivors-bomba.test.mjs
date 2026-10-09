/* La bomba di Survivors: si raccoglie, va in tasca, si lancia col
   pulsante (`Partita.lanciaBomba`, `CFG.bomba`).

   Si prova quello che il bambino vede:
     · toglie di mezzo tutti quelli vicini, grossi compresi, e lascia le
       loro gemme; quelli lontani li spinge via e basta;
     · in tasca ne stanno tre, e a tasca piena non ne compaiono più;
     · senza bombe il pulsante non fa niente, e sotto le carte nemmeno;
     · uscendo e rientrando la tasca resta piena.
   `node test/esegui.mjs survivors-bomba --niente-build` */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/survivors/dati/campagna.js'
import { CFG } from '../../src/giochi/survivors/dati/taratura.js'
import { pescaOggetto, guastiDegliOggetti } from '../../src/giochi/survivors/dati/oggetti.js'
import { Partita, Regole } from '../../src/giochi/survivors/motore/partita.js'
import { caso as casoFisso } from '../../src/giochi/survivors/motore/banco.js'
import { spostaSemi } from '../aiuto/semi.mjs'
const caso = spostaSemi(casoFisso)
import { scrivi, leggi } from '../../src/giochi/survivors/motore/sosta.js'

uguale('gli oggetti stanno in piedi', guastiDegliOggetti().join('; '), '')

const nuova = () => {
  const p = new Partita(new Regole(CAMPAGNA[6]), { rnd: caso(5) })
  p.tempo = 30
  return p
}
const mostro = (p, tipo, x, y) => {
  const n = p.mostroNuovo(tipo, x, y)
  p.nemici.push(n)
  return n
}

/* ── lo scoppio ── */
{
  const p = nuova()
  uguale('senza bombe non scoppia niente', p.lanciaBomba(), null)
  p.eroe.bombe = 1
  const vicini = [mostro(p, 'melma', 60, 0), mostro(p, 'colosso', 0, -150), mostro(p, 'ragno', -200, 30)]
  const lontano = mostro(p, 'melma', CFG.bomba.raggio * 1.4, 0)
  const lontanissimo = mostro(p, 'melma', 0, CFG.bomba.raggio * 3)
  uguale('li prende tutti e tre', p.lanciaBomba(), 3)
  controlla('anche il colosso', vicini.every(n => n.vita <= 0))
  controlla('quello appena fuori resta vivo, e viene spinto via', lontano.vita > 0 && lontano.spx > 0)
  controlla('quello lontano non si accorge di niente', lontanissimo.vita > 0 && !lontanissimo.spx)
  uguale('la tasca si svuota', p.eroe.bombe, 0)
  controlla('lo scoppio si vede', p.effetti.some(e => e.che === 'esplosione'))
  controlla('e si sente', p.eventi.includes('bomba'))
  p.avanza(1 / 30)
  uguale('i caduti lasciano le gemme', p.gemme.length, 3)
}

/* ── sotto le carte non si lancia ── */
{
  const p = nuova()
  p.eroe.bombe = 2
  p.offerta = p.offri()
  uguale('con le carte aperte il pulsante non fa niente', p.lanciaBomba(), null)
  uguale('e la bomba resta in tasca', p.eroe.bombe, 2)
}

/* ── la tasca ── */
{
  const p = nuova()
  for (let k = 0; k < 5; k++) p.prendiOggetto({ tipo: 'bomba' })
  uguale(`in tasca ne stanno ${CFG.bomba.tasca}`, p.eroe.bombe, CFG.bomba.tasca)
  const rnd = caso(3)
  let pescate = 0
  for (let i = 0; i < 200; i++) if (pescaOggetto(rnd) === 'bomba') pescate++
  uguale('la bomba non ruba il posto agli altri oggetti', pescate, 0)
  /* l'orologio suo: a tasca piena aspetta, a tasca vuota ne posa una */
  p.oggetti = []
  p.tBomba = 0
  p.bombaATerra(1 / 30)
  uguale('a tasca piena non ne compaiono', p.oggetti.filter(o => o.tipo === 'bomba').length, 0)
  p.eroe.bombe = 0
  p.bombaATerra(1 / 30)
  uguale('a tasca vuota sì', p.oggetti.filter(o => o.tipo === 'bomba').length, 1)
  p.tBomba = 0
  p.bombaATerra(1 / 30)
  uguale('una alla volta', p.oggetti.filter(o => o.tipo === 'bomba').length, 1)
}

/* ── uscire e rientrare ── */
{
  const p = nuova()
  p.eroe.bombe = 2
  const b = leggi(scrivi(p, 6), CAMPAGNA[6], { rnd: caso(9) })
  uguale('la tasca si salva', b.eroe.bombe, 2)
}

riassunto('survivors — la bomba')
