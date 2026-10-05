// I due rami valgono lo stesso (cambia la forma del danno, non la
// quantità): vedi docs/castello/torri.md. Questo test è l'unico posto dove
// quella promessa viene contata, con la stima del modello (`dpsDi`) contro
// cui `npm run dps` confronta il motore vero.
import { TORRI, ramiDi } from '../../src/data/ops.js'
import { RAMI, RAMI_DA, tiroDi, geloDi, dpsDi, raggioDi } from '../../src/data/castello.js'
import { Nemico } from '../../src/motore/castello/nemico.js'
import { Colpo } from '../../src/motore/castello/colpo.js'
import { Torre } from '../../src/motore/castello/torre.js'
import { Cassa } from '../../src/views/castello/cassa.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i due rami valgono lo stesso ══════════
   Il danno al secondo del ramo, veleno e rimbalzi compresi: quello che
   il modello crede di avere in campo deve essere quello che c'è
   davvero. La catena sul bersaglio singolo perde apposta, e quello che
   le manca lo ritrova su chi sta vicino: la stima conta i rimbalzi
   (`BERSAGLI.rimbalzo`), e un'ondata è una fila di mostri. */
for (const [k, T] of Object.entries(TORRI)) {
  if (!T.danno) continue                       // il ghiaccio si misura altrove
  for (const lv of [RAMI_DA, 7, 10]) {
    const base = dpsDi(k, lv)
    for (const r of ramiDi(k)) {
      const suo = dpsDi(k, lv, r.id)
      dentro(`${T.nome} liv.${lv} · ${r.nome} vale quanto il tronco`,
             suo / base, 0.82, 1.22)
    }
  }
}
/* il veleno si scrive **in tutto**: quanto fa il male che continua, in
   multipli del colpo, spalmato sulla durata. Al secondo, com'era prima,
   il napalm lo moltiplicava per quattro secondi e per tutti quelli
   presi nello scoppio */
{
  const t = tiroDi('sub', 5, 'veleno'), liscio = tiroDi('sub', 5)
  const colpoPieno = liscio.danno
  dentro('il veleno fa in tutto quello che dice il ramo, non di più',
         t.veleno * t.durata / colpoPieno, RAMI.veleno.veleno * 0.99, RAMI.veleno.veleno * 1.01)
}

/* la catena è l'unica che perde sul bersaglio singolo, e deve: quello
   che le manca lo ritrova sui rimbalzi, cioè solo dove ci sono gruppi */
controlla('la catena da sola fa meno del tronco',
          tiroDi('sub', 5, 'catena').danno < tiroDi('sub', 5).danno)

/* ══════════ 2. il gelo: largo o fragile, e tutti e due meglio del tronco ══════════
   La bufera arriva più lontano e gela più a lungo, senza frenare meno; la
   brina frena al massimo e rende fragili, ma arriva meno lontano. Misurati
   col motore valgono entrambi più del ghiaccio semplice (`npm run dps`):
   un ramo che vale meno del tronco è un tranello. */
const bufera = geloDi(6, 'bufera'), brina = geloDi(6, 'brina'), liscio = geloDi(6)
controlla('la bufera non frena meno del ghiaccio semplice', bufera.freno >= liscio.freno)
controlla('ma gela molto più a lungo', bufera.durata > liscio.durata * 1.3)
controlla('e arriva più lontano', raggioDi('bufera') >= 1.2)
controlla('la brina frena almeno quanto il ghiaccio semplice', brina.freno >= liscio.freno)
controlla('ma la brina arriva meno lontano: è stretta e cattiva', raggioDi('brina') < 1)
uguale('solo la brina rende fragili', bufera.fragile, 1)
controlla('la brina sì, e in modo che si sente', brina.fragile >= 1.1)
nota(`bufera ${bufera.freno.toFixed(2)} · brina ${brina.freno.toFixed(2)} ×${brina.fragile}`)

/* ══════════ 3. il veleno fa male da solo ══════════ */
{
  const n = new Nemico({ vita: 100, vel: 0, bestia: 'slime' })
  n.avvelena(10, 2)                    // dieci al secondo per due secondi
  for (let i = 0; i < 30; i++) n.cammina(0.1, 1e9)
  uguale('il veleno consuma esattamente quello che promette', Math.round(n.vita), 80)
  controlla('e poi si spegne da solo', n.perQuanto === 0)

  const doppio = new Nemico({ vita: 100, vel: 0, bestia: 'slime' })
  doppio.avvelena(10, 2); doppio.avvelena(4, 5)
  uguale('due dosi non si sommano: vale la più forte', doppio.male, 10)
  uguale('e la più lunga', doppio.perQuanto, 5)
}

/* ══════════ 4. la brina fa male senza fare danno ══════════ */
{
  const sano = new Nemico({ vita: 100, vel: 0, bestia: 'slime' })
  const gelato = new Nemico({ vita: 100, vel: 0, bestia: 'slime' })
  gelato.gela(2, brina.freno, brina.fragile)
  sano.ferisci(20, 'add'); gelato.ferisci(20, 'add')
  controlla('chi è gelato dalla brina incassa di più', gelato.vita < sano.vita)
  nota(`stesso colpo: sano ${sano.vita} · imbrinato ${gelato.vita}`)
}

/* ══════════ 5. la catena rimbalza sui vicini ══════════ */
{
  const via = { puntoA: d => ({ x: d, y: 0 }) }
  const nemici = [0, 40, 80, 400].map(d =>
    new Nemico({ d, vita: 500, vel: 0, bestia: 'slime' }))
  const colpo = new Colpo({ x: 0, y: 0, tx: 0, ty: 0, t: 1, tipo: 'sub',
                            preso: nemici[0], danno: 40, rimbalzi: 2 })
  const esito = colpo.impatto(nemici, via)
  uguale('due rimbalzi, due colpi nuovi', esito.rimbalzi.length, 2)
  controlla('e ognuno pesa la metà del precedente',
            esito.rimbalzi[0].danno === 20 && esito.rimbalzi[1].danno === 10)
  controlla('chi è troppo lontano resta fuori',
            !esito.rimbalzi.some(c => c.preso === nemici[3]))
}

/* ══════════ 6. il cecchino vede più lontano ══════════ */
{
  const nudo = new Torre({ x: 0, y: 0, tipo: 'add', lv: RAMI_DA })
  const lungo = new Torre({ x: 0, y: 0, tipo: 'add', lv: RAMI_DA, ramo: 'cecchino' })
  controlla('il cecchino ha più gittata di un arciere pari livello',
            lungo.raggio(1) > nudo.raggio(1) * 1.2)
  uguale('e il ramo si porta dietro nell\'istantanea', Torre.da(lungo.dati()).ramo, 'cecchino')
  const salita = new Torre({ x: 0, y: 0, tipo: 'add', lv: 3 })
  salita.sale('raffica'); salita.sale('cecchino')
  uguale('il ramo si sceglie una volta sola', salita.ramo, 'raffica')
}

/* ══════════ 7. il bivio compare quando deve ══════════ */
{
  const cassa = new Cassa()
  const torre = tipo => new Torre({ x: 0, y: 0, tipo, lv: RAMI_DA - 1 })

  cassa.perTappa({ cap: 8, rami: true })
  uguale('nella tappa che li offre, al gradino giusto ci sono due strade',
         cassa.rami(torre('sub')).length, 2)
  uguale('un gradino prima, nessuna',
         cassa.rami(new Torre({ x: 0, y: 0, tipo: 'sub', lv: RAMI_DA - 2 })).length, 0)
  uguale('e una torre che ha già scelto non riscegli',
         cassa.rami(new Torre({ x: 0, y: 0, tipo: 'sub', lv: RAMI_DA - 1, ramo: 'veleno' })).length, 0)

  cassa.perTappa({ cap: 8 })
  uguale('nel bosco, dove i rami sono spenti, nessuna strada',
         cassa.rami(torre('sub')).length, 0)

  cassa.perTappa({ cap: RAMI_DA - 1, rami: true })
  uguale('e una tappa che non arriva al bivio non lo mostra',
         cassa.rami(torre('sub')).length, 0)
}

/* ogni ramo dichiarato in `ops.js` deve avere i suoi numeri in
   `castello.js`, e viceversa: sono due file e una cosa sola */
for (const k of Object.keys(TORRI))
  for (const r of ramiDi(k))
    controlla(`${r.nome} ha i suoi numeri`, !!RAMI[r.id])
uguale('e non ci sono numeri senza una torre che li usi',
       Object.keys(RAMI).length,
       Object.keys(TORRI).reduce((s, k) => s + ramiDi(k).length, 0))

riassunto('i due rami di una torre')
