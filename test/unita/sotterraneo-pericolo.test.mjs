/* Lo stop dello scontro quando l'eroe rischia di cadere (docs/sotterraneo/pericolo.md).

   Quando tocca all'eroe, se altri due giri di colpi in arrivo lo farebbero cadere (o la vita è sotto il 30%) lo scontro si
   ferma: la domanda non viene chiesta finché non si sceglie bevi / scappa / continua. Una volta per scontro, e
   una seconda solo se si sceglie di continuare e un giro di colpi basta a farlo cadere. Mai sopra una domanda già a
   schermo, mai quando l'ultimo mostro cade, e chi risponde da fuori (il banco) non ne è fermato.
   `node test/esegui.mjs sotterraneo-pericolo --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { COLPO_DEL_MOSTRO } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { pericoloDi, DETTO_DEL_PERICOLO, FERMATE_PER_SCONTRO } from '../../src/giochi/sotterraneo/motore/pericolo.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. la soglia, pura ══════════ */
{
  const p = (vita, male, fermate = 0, vitaMax = 30) => pericoloDi({ vita, vitaMax, male, fermate })
  uguale('vita piena: niente stop', p(30, 4), null)
  uguale('fuori pericolo: tre colpi pieni ancora sopportati', p(13, 4), null)
  uguale('due colpi pieni lo farebbero cadere: si ferma', p(8, 4), 'duro')
  uguale('un colpo pieno solo: si ferma lo stesso', p(3, 4), 'duro')
  uguale('sotto il 30% con un mostro tenero: si ferma', p(8, 1), 'poca')
  uguale('al 30% esatto non ancora', p(9, 1), null)
  uguale('vita a zero: non c\'è niente da fermare (è svenuto)', p(0, 4), null)
  uguale('secondo stop: ancora due colpi di margine, no', p(8, 4, 1), null)
  uguale('secondo stop: un colpo pieno basta a cadere, sì', p(4, 4, 1), 'ultimo')
  uguale('due stop sono il tetto', p(1, 4, FERMATE_PER_SCONTRO), null)
  for (const perche of ['duro', 'poca', 'ultimo']) controlla(`la frase per «${perche}» c'è`, !!DETTO_DEL_PERICOLO[perche])
}

/* ══════════ 2. nello scontro ══════════
   Lo stop si guarda quando tocca all'eroe, sulla somma dei colpi che arrivano prima del suo prossimo turno: con un mostro
   solo e veloce come lui (a parità tocca all'eroe: un turno per uno) è il colpo di quel mostro. */
// un eroe sano davanti a un mostro che non cade mai, con un colpo di `male`; la vita si abbassa dopo l'apertura, così il
// primo turno non si ferma già
function scontro({ male = 3, vita = null, zaino = [], vitaPiu = 0 } = {}) {
  const c = new Corsa(CAMPAGNA[1], { seme: 11, rnd: seminato(11) })
  c.consumaIlDanno = () => {}   // colpo fisso: qui il resto del danno non conta
  c.vitaPiu += vitaPiu   // un colpo forte davanti a poca vita fermerebbe già il primo turno
  c.vita = c.vitaMax
  const m = c.livello.robe.find(r => r.che === 'mostro')
  let att = c.dif + 1
  while (Math.max(1, Math.round(COLPO_DEL_MOSTRO * (att - c.dif))) < male) att++
  Object.assign(m, { att, dif: 0, ossa: 9999, ossaMax: 9999, sveglio: true, velocita: c.velocita, stati: null })
  c.zaino = [...zaino]
  c.scontro(m, { solo: true, tocco: true })
  if (vita != null) c.vita = vita
  return { c, m }
}

{
  // un eroe sano non viene fermato dai primi colpi, poi sì, e a metà strada non c'è
  const { c, m } = scontro({ male: 3 })
  uguale('il colpo del mostro è quello detto', c.danno(m), 3)
  uguale('e la somma in arrivo è quel colpo solo', c.colpiInArrivo(), 3)
  const sbaglia = () => c.rispondi(false)
  let giri = 0
  let e = null
  while (giri++ < 60) {
    controlla('finché non si è in pericolo c\'è sempre una domanda', !!c.chiesta)
    e = sbaglia()
    if (e.ringhia || e.che === 'svenuto') break
  }
  uguale('si ferma dopo un colpo del mostro, con la ragione «duro»', e.ringhia, 'duro')
  uguale('lo dice anche il foglio', c.foglio.pericolo, 'duro')
  controlla('fermo: nessuna domanda in attesa', c.chiesta === null)
  controlla('si è fermato quando altri due colpi lo avrebbero fatto cadere', c.vita <= 2 * c.danno(m) && c.vita > c.danno(m), `vita ${c.vita}`)
  controlla('lo scontro è ancora aperto (è una scelta, non una fine)', c.foglio && c.foglio.che === 'scontro')

  // continua: si torna a domandare, e non si ferma di nuovo finché non basta un colpo a farlo cadere
  const v = c.vita
  uguale('continua riprende', c.continua().che, 'continua')
  controlla('dopo «continuo» la domanda c\'è di nuovo', !!c.chiesta && !c.foglio.pericolo)
  uguale('continuare non costa vita', c.vita, v)
  uguale('una seconda «continua» a vuoto non fa niente', c.continua().che, 'niente')
}

{
  // una volta per scontro: al secondo stop (un colpo e cade) e basta. Con una pozione in tasca: a 1 di vita
  // scappare farebbe cadere, e senza niente da bere lo stop non avrebbe scelte (vedi sotto)
  const { c } = scontro({ male: 3, vita: 7, zaino: [Object.keys(COSE).find(k => COSE[k].usa === 'cura')] })
  let stop = 0
  let ultimo = null
  for (let i = 0; i < 6 && c.foglio && c.foglio.che === 'scontro'; i++) {
    const e = c.rispondi(false)
    if (e.ringhia) { stop++; ultimo = e.ringhia; c.continua() }
  }
  uguale('da 7 di vita: un colpo lo porta a 4, due stop in tutto', stop, 2)
  uguale('il secondo è l\'ultimo colpo', ultimo, 'ultimo')
  controlla('poi non si ferma più: cade', c.foglio === null || c.foglio.che !== 'scontro' || c.vita <= 0)
}

{
  // sotto il 30% con un mostro tenero: un colpo è 1, due non lo farebbero cadere, ma le forze sono poche
  const { c } = scontro({ male: 1 })
  c.vita = Math.ceil(0.3 * c.vitaMax)
  const e = c.rispondi(false)
  uguale(`${c.vita} su ${c.vitaMax}: nessun colpo lo farebbe cadere, ma è poca vita`, e.ringhia, 'poca')
}

{
  // non interrompe una domanda già a schermo: lo stop viene dal turno dell'eroe, mai dal tempo
  const { c } = scontro({ male: 3, vita: 7 })
  controlla('appena aperto lo scontro c\'è la domanda, non lo stop', !!c.chiesta && !c.foglio.pericolo)
  const id = c.chiesta.id
  c.passo(0.5)
  uguale('col tempo che passa la domanda resta quella', c.chiesta && c.chiesta.id, id)
  controlla('e lo stop non compare', !c.foglio.pericolo)
}

{
  // se il mostro cade con quella risposta non c'è nessun colpo e nessuno stop
  const { c, m } = scontro({ male: 3, vita: 7 })
  m.ossa = 1
  const e = c.rispondi(true)
  uguale('mostro caduto', e.che, 'caduto')
  controlla('niente stop', !e.ringhia && c.foglio === null)
}

{
  // lo stop si guarda anche al primo turno: chi entra già malconcio può bere subito
  const c = new Corsa(CAMPAGNA[1], { seme: 11, rnd: seminato(11) })
  const m = c.livello.robe.find(r => r.che === 'mostro')
  Object.assign(m, { att: c.dif + 4, dif: 0, ossa: 9999, ossaMax: 9999, sveglio: true, velocita: c.velocita, stati: null })
  c.zaino = ['pozione-piccola']
  c.vita = 5
  c.scontro(m, { solo: true, tocco: true })
  uguale('entrando con 5 di vita davanti a un colpo di 3, si ferma subito', c.foglio.pericolo, 'duro')
  controlla('e non c\'è nessuna domanda in attesa', c.chiesta === null)
}

/* ══════════ 3. le tre scelte ══════════ */
{
  // bevi: la più adatta, come la 🧪 della barra, costa il turno (il mostro colpisce), e si riprende
  const { c, m } = scontro({ male: 3, vita: 9, zaino: ['pozione-piccola', 'pozione'] })
  uguale('si ferma', c.rispondi(false).ringhia, 'duro')
  const prima = c.vita
  const tasche = c.zaino.length
  const giusta = c.zaino[c.pozioneGiusta()]
  const cura = c.curaDi(giusta)
  const e = c.beviNelPericolo()
  uguale('bevuto', e && e.che, 'bevuto')
  uguale('la vita sale della cura, meno il colpo del turno perso', c.vita, Math.min(c.vitaMax, prima + cura) - c.danno(m))
  uguale('una pozione in meno', c.zaino.length, tasche - 1)
  controlla('beve quella che beverebbe la barra', !c.zaino.includes(giusta) || c.zaino.filter(k => k === giusta).length < 2)
  controlla('la battaglia riprende: domanda in attesa, stop spento', !!c.chiesta && !c.foglio.pericolo && c.foglio.che === 'scontro')
}

{
  // senza pozioni «bevi» non fa niente e lo stop resta
  const { c } = scontro({ male: 3, vita: 9 })
  uguale('si ferma', c.rispondi(false).ringhia, 'duro')
  uguale('senza pozioni: niente', c.beviNelPericolo(), null)
  controlla('lo stop è ancora lì', c.foglio.pericolo === 'duro' && c.chiesta === null)
}

{
  // scappa: si esce con un colpo del mostro più forte
  const { c } = scontro({ male: 3, vita: 9 })
  uguale('si ferma', c.rispondi(false).ringhia, 'duro')
  const v = c.vita
  const costo = c.costoFuga()
  const e = c.scappa()
  uguale('scappato', e.che, 'scappato')
  uguale('il costo è il colpo', v - c.vita, costo)
  controlla('lo scontro è chiuso', c.foglio === null)
}

{
  // chi risponde da fuori senza guardare (il banco) non è fermato: lo stop si scioglie da sé, lo scontro va avanti
  const { c } = scontro({ male: 3, vita: 9 })
  uguale('si ferma', c.rispondi(false).ringhia, 'duro')
  const e = c.rispondi(true)
  controlla('rispondere continua', e && e.che !== undefined && !c.foglio?.pericolo)
}

{
  // senza pozioni e con un colpo che farebbe cadere, lo stop offrirebbe solo «continuo»: non si ferma
  const { c } = scontro({ male: 10, vita: 12 })
  const e = c.rispondi(false)
  controlla('la vita è sotto il colpo della fuga', c.vita <= c.costoFuga(), `${c.vita} contro ${c.costoFuga()}`)
  uguale('scappare non si può', c.puoScappare(), false)
  uguale('niente stop', e.ringhia, null)
  controlla('e la domanda dopo arriva', c.chiesta !== null && !c.foglio.pericolo)
}

{
  // con una pozione invece lo stop c'è, anche se scappare non si può (il riquadro mostra solo bevi e continuo)
  const pozione = Object.keys(COSE).find(k => COSE[k].usa === 'cura')
  const { c } = scontro({ male: 10, vita: 12, zaino: [pozione], vitaPiu: 40 })
  uguale('si ferma', c.rispondi(false).ringhia, 'duro')
  uguale('ma scappare non si può', c.puoScappare(), false)
}

{
  // con vita a sufficienza scappare si può
  const { c } = scontro({ male: 3, vita: 9 })
  uguale('il colpo non fa cadere: si scappa', c.puoScappare(), true)
}

riassunto('lo stop dello scontro')
