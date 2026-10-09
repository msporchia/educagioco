/* I capi di Survivors e la carta Calamita (`CFG.capo`, `CFG.calamita`).

   Si prova quello che il bambino vede:
     · il capo arriva a una quota della tappa, è molto più grosso e più
       duro del suo mostro, e se ne va lasciando una pioggia di gemme e
       un oggetto;
     · la bomba non lo abbatte d'un colpo: gli toglie metà della vita;
     · uscendo e rientrando resta un capo;
     · la Calamita alterna: le copie dispari allargano il raggio, le pari
       tirano più forte, e resta più piccola di quella trovata a terra.
   `node test/esegui.mjs survivors-capi --niente-build` */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/survivors/dati/campagna.js'
import { CFG } from '../../src/giochi/survivors/dati/taratura.js'
import { MOSTRI } from '../../src/giochi/survivors/dati/mostri.js'
import { OGGETTI } from '../../src/giochi/survivors/dati/oggetti.js'
import { Partita, Regole } from '../../src/giochi/survivors/motore/partita.js'
import { caso as casoFisso } from '../../src/giochi/survivors/motore/banco.js'
import { spostaSemi } from '../aiuto/semi.mjs'
const caso = spostaSemi(casoFisso)
import { scrivi, leggi } from '../../src/giochi/survivors/motore/sosta.js'

const t = CAMPAGNA[4]
const nuova = () => {
  const p = new Partita(new Regole(t), { rnd: caso(8) })
  p.aNascere = -1e9; p.tMuro = 1e9; p.tOggetto = 1e9; p.tBomba = 1e9
  return p
}

/* ── quando arriva, e com'è ── */
{
  const p = nuova()
  while (p.tempo < t.durata * CFG.capo.da - 0.5) { p.avanza(1 / 30); p.offerta = null }
  controlla('prima della sua quota non c\'è', !p.nemici.some(n => n.capo))
  p.svuotaEventi()
  for (let i = 0; i < 30; i++) { p.avanza(1 / 30); p.offerta = null }
  const capo = p.nemici.find(n => n.capo)
  controlla('alla sua quota arriva', !!capo)
  controlla('e si annuncia', p.svuotaEventi().includes('capo'))
  const base = MOSTRI[capo.tipo]
  controlla('è molto più grosso del suo mostro', capo.r >= base.r * 2.2, `${capo.r} contro ${base.r}`)
  controlla('e molto più duro', capo.vitaMax >= base.vita * CFG.capo.vita, `${capo.vitaMax}`)
  const prossimo = p.tCapo
  uguale('il prossimo fra il suo intervallo', Math.round(prossimo - p.tempo), CFG.capo.ogni)

  /* la bomba gli toglie metà della vita, non tutta */
  p.eroe.bombe = 1
  capo.x = p.eroe.x + 50; capo.y = p.eroe.y
  p.lanciaBomba()
  controlla('la bomba non lo abbatte d\'un colpo', capo.vita > 0 && capo.vita <= capo.vitaMax / 2 + 0.01,
            `${capo.vita.toFixed(1)} su ${capo.vitaMax}`)

  /* e uscendo resta un capo */
  const b = leggi(scrivi(p, 4), t, { rnd: caso(9) })
  const ripreso = b.nemici.find(n => n.capo)
  controlla('riprendendo è ancora un capo, grande uguale', !!ripreso && ripreso.r === capo.r)
  uguale('e il prossimo arriva quando doveva', b.tCapo, p.tCapo)

  /* abbattuto, lascia la pioggia */
  const gemme = p.gemme.length, oggetti = p.oggetti.length
  capo.vita = 0
  p.avanza(1 / 30)
  uguale('lascia una pioggia di gemme', p.gemme.length - gemme, CFG.capo.gemme)
  uguale('e un oggetto', p.oggetti.length - oggetti, 1)
}

/* ── la Calamita a turni ── */
{
  const p = nuova()
  const giro = []
  for (let k = 1; k <= 5; k++) {
    p.potenziamenti.magnete = k
    p.ricalcola()
    giro.push([p.f.calamita, p.f.forzaCalamita])
  }
  const raggi = giro.map(g => g[0]), forze = giro.map(g => g[1])
  controlla('la seconda copia tira più forte, non più lontano', raggi[1] === raggi[0] && forze[1] > forze[0])
  controlla('la terza allarga il raggio', raggi[2] > raggi[1] && forze[2] === forze[1])
  controlla('la quarta tira più forte', forze[3] > forze[2])
  controlla('la quinta allarga ancora', raggi[4] > raggi[3])
  controlla('anche piena resta più piccola di quella trovata a terra',
            Math.max(...raggi) < OGGETTI.calamita.raggio, `${Math.max(...raggi)} contro ${OGGETTI.calamita.raggio}`)
}

riassunto('survivors — i capi e la calamita')
