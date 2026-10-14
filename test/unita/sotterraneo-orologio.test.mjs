/* L'orologio del sotterraneo e gli incanti preparati dal campo (docs/sotterraneo/orologio.md).

   Il tempo si conta in passi dell'eroe: fermo, in pausa o sotto una domanda non scorre. Camminando il mana torna della stessa quota
   del globo massimo per tutte le classi. Alcune abilità che proteggono si lanciano anche dal campo, restano addosso per un numero di
   passi, e lo scontro comincia con loro già attive; un turno dell'eroe consuma qualche passo. Si salvano con la discesa, e una sosta
   senza i campi nuovi si rilegge.
   `node test/esegui.mjs sotterraneo-orologio --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { NODI, RAMI, preparabile, aGrado, guastiDelleAbilita } from '../../src/giochi/sotterraneo/dati/abilita.js'
import { PASSI_PER_TURNO, MANA_PER_PASSO, guastiDelMondo } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { COLPO_DEL_MOSTRO } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { incantiAddosso, statiMiei } from '../../src/giochi/sotterraneo/viste/campo.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const CLASSI = ['cavaliere', 'elfa', 'mago', 'nano']
// un eroe di quella classe al livello 8, con questi nodi imparati (e la roba che serve: lo scudo del cavaliere)
function eroeA(k, classe, ...ids) {
  const cr = crescitaAttesa(classe, k)
  const c = new Corsa(CAMPAGNA[1], { seme: 11, rnd: seminato(11), eroe: classe,
    crescita: { ...cr, albero: { ...(cr.albero || {}), ...Object.fromEntries(ids.map(id => [id, 1])) } } })
  c.mancina = 'scudo-ferro'
  c.sistemaIlCorredo()
  c.energia = c.energiaMax
  c.consumaIlDanno = () => {}   // colpo fisso: qui il resto del danno non conta (docs/sotterraneo/scontro.md, «Il danno è continuo»)
  return c
}
const eroe = (classe, ...ids) => eroeA(3, classe, ...ids)
// uno scontro contro un mostro che non cade mai e colpisce di `male`
function scontro(c, { male = 6 } = {}) {
  const m = c.livello.robe.find(r => r.che === 'mostro')
  let att = c.dif + 1
  while (Math.max(1, Math.round(COLPO_DEL_MOSTRO * (att - c.dif))) < male) att++
  Object.assign(m, { att, dif: 0, ossa: 99999, ossaMax: 99999, sveglio: true, velocita: c.velocita, stati: null })
  c.rnd = () => 0.99   // niente schivata: il colpo arriva
  c.scontro(m, { solo: true, tocco: true })
  return m
}

/* ══════════ 1. i dati ══════════ */
{
  const g = [...guastiDelleAbilita(), ...guastiDelMondo()]
  controlla('i dati delle abilità e del mondo tornano', !g.length, g.join(' · '))
  for (const classe of CLASSI) {
    const prep = RAMI[classe].flatMap(r => r.nodi).filter(preparabile)
    controlla(`${classe}: almeno un'abilità che si prepara dal campo`, prep.length >= 1, `${prep.length}`)
    for (const n of prep) controlla(`${n.id}: non è una passiva`, !n.sempre, n.id)
  }
  nota('si preparano:', Object.values(NODI).filter(preparabile).map(n => `${n.id} ${n.preparabile[0]}`).join(' · '))
}

/* ══════════ 2. l'orologio: i passi dell'eroe ══════════ */
{
  const c = eroe('mago')
  uguale('si parte da zero passi', c.passi, 0)
  // un cammino di sei celle, a piedi: sei passi
  const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
  const dove = [...c.livello.stanze[0].suolo].sort((a, b) => Math.hypot(b.x - da.x, b.y - da.y) - Math.hypot(a.x - da.x, a.y - da.y))[0]
  c.vaiVerso(dove, false)
  const lunga = c.strada.length
  for (let i = 0; i < 4000 && c.strada && !c.foglio; i++) c.passo(0.03)
  controlla('camminare conta una cella un passo', c.passi === lunga && lunga > 3, `${c.passi} passi per ${lunga} celle`)
  uguale('i passi camminati sono quelli dell\'orologio', c.camminati, c.passi)
  const fermo = c.passi
  for (let i = 0; i < 200; i++) c.passo(0.03)
  uguale('fermo l\'orologio non scorre', c.passi, fermo)
  // col foglio aperto (una domanda, uno scontro) non si cammina e non si conta
  c.foglio = { che: 'porta', chi: {} }
  c.vaiVerso(da, false)
  c.passo(0.05)
  uguale('sotto una domanda non scorre', c.passi, fermo)
}

/* ══════════ 3. il mana torna camminando ══════════ */
{
  // la stessa quota del globo massimo per tutte le classi: mille passi lo riempiono, cinquecento ne ridanno la metà
  const righe = []
  for (const classe of CLASSI) {
    const c = eroe(classe)
    c.energia = 0
    for (let i = 0; i < 500; i++) c.faiPassi(1, true)
    const meta = c.energia / c.energiaMax
    dentro(`${classe}: cinquecento passi ridanno circa metà del globo`, meta, 0.45, 0.55)
    for (let i = 0; i < 500; i++) c.faiPassi(1, true)
    uguale(`${classe}: mille passi lo riempiono`, c.energia, c.energiaMax)
    for (let i = 0; i < 100; i++) c.faiPassi(1, true)
    uguale(`${classe}: a globo pieno resta pieno`, c.energia, c.energiaMax)
    controlla(`${classe}: e il resto non si accumula`, c.manaCammino === 0)
    righe.push(`${classe} ${c.energiaMax}`)
  }
  nota('globo (mille passi per riempirlo):', righe.join(' · '), `· ${MANA_PER_PASSO * 100}% a passo`)
  // il resto fra un punto e l'altro passa al passo dopo: il mago (globo grande) ne dà uno ogni pochi passi, il cavaliere ogni cento
  const k = eroe('cavaliere')
  k.energia = 0
  for (let i = 0; i < 99; i++) k.faiPassi(1, true)
  uguale('il cavaliere (globo 10) non ha ancora un punto dopo 99 passi', k.energia, 0)
  k.faiPassi(1, true)
  uguale('e ne ha uno al centesimo', k.energia, 1)
  // i turni dello scontro fanno passare il tempo ma non danno mana: la ricarica è delle risposte
  const c = eroe('cavaliere')
  scontro(c)
  c.energia = 2
  for (let i = 0; i < 4; i++) c.rispondi(false)
  uguale('quattro turni di scontro non ridanno mana', c.energia, 2)
  uguale('ma hanno fatto passare i loro passi', c.passi, 4 * PASSI_PER_TURNO)
}

/* ══════════ 4. lanciare dal campo ══════════ */
{
  const c = eroe('mago', 'scudo-arcano')
  const nodo = NODI['scudo-arcano']
  uguale('il mago può preparare lo scudo arcano', c.preparabili().map(n => n.id).join(), 'scudo-arcano')
  uguale('si può', c.perchéNonPrepari('scudo-arcano'), '')
  const prima = c.energia
  controlla('lo lancia', c.preparaDalCampo('scudo-arcano'))
  uguale('paga l\'energia di sempre', c.energia, prima - c.costoDi(nodo))
  uguale('resta addosso per i suoi passi', c.preparati[0].passi, aGrado(nodo, 'preparabile', 1))
  controlla('con la barriera piena', c.preparati[0].assorbe > 0)
  uguale('e un secondo tocco non lo butta via', c.perchéNonPrepari('scudo-arcano'), 'ce l\'hai già')
  const e = c.energia
  controlla('infatti non lo rilancia', !c.preparaDalCampo('scudo-arcano') && c.energia === e)
  // camminando cala, e a zero se ne va
  const passi = c.preparati[0].passi
  c.faiPassi(10, true)
  uguale('cala di un passo a passo', c.preparati[0].passi, passi - 10)
  c.faiPassi(passi, true)
  uguale('finiti i passi se ne va', c.preparati.length, 0)
  // rilanciabile quando sta per finire
  c.energia = c.energiaMax
  c.preparaDalCampo('scudo-arcano')
  c.faiPassi(c.preparati[0].passi - 5, true)
  uguale('con pochi passi addosso si rinnova', c.perchéNonPrepari('scudo-arcano'), '')
  // senza energia no, e non la sa chi non l'ha imparata
  c.energia = 0
  controlla('senza energia non si lancia', !!c.perchéNonPrepari('scudo-arcano') && !c.preparaDalCampo('scudo-arcano'))
  uguale('chi non la sa non la lancia', eroe('mago').perchéNonPrepari('scudo-arcano'), 'non la sai')
  uguale('un\'abilità che colpisce non si prepara', eroe('mago', 'dardo-di-fuoco').perchéNonPrepari('dardo-di-fuoco'), 'non si prepara')
  // dentro uno scontro il campo non c'è
  const k = eroe('mago', 'scudo-arcano')
  scontro(k)
  uguale('nello scontro non si prepara dal campo', k.perchéNonPrepari('scudo-arcano'), 'adesso no')
}

/* ══════════ 5. lo scontro comincia con l'incanto addosso ══════════ */
{
  // la barriera para per prima: un colpo da 6 con una barriera da `assorbe` non toglie vita finché regge
  const c = eroe('mago', 'scudo-arcano')
  c.preparaDalCampo('scudo-arcano')
  const barriera = c.preparati[0].assorbe
  c.vita = c.vitaMax
  const m = scontro(c, { male: 6 })
  const f = c.foglio
  const mie = statiMiei(f.io, c)
  controlla('la barriera preparata si vede fra gli stati dell\'eroe', mie.some(x => x.chiave === 'scudo' && x.preparato === 'scudo-arcano' && x.passi > 0), JSON.stringify(mie))
  controlla('e fra gli incanti, coi passi', incantiAddosso(c).some(x => x.id === 'scudo-arcano' && x.passi > 0))
  const prima = c.vita
  c.rispondi(false)   // il mostro colpisce: arriva alla barriera, non alla vita
  controlla('il primo colpo lo para la barriera', c.vita === prima, `${prima} → ${c.vita}`)
  controlla('e la barriera cala di quel colpo', !c.preparati.length || c.preparati[0].assorbe < barriera, `${barriera} → ${c.preparati[0] && c.preparati[0].assorbe}`)
  controlla('un turno dell\'eroe ha consumato i suoi passi', c.passi === PASSI_PER_TURNO, `${c.passi}`)
  // esaurita la barriera se ne va, e i colpi arrivano
  for (let i = 0; i < 40 && c.preparati.length && c.vita > 0; i++) c.rispondi(false)
  controlla('esaurita la barriera se ne va', !c.preparati.length)
  void m
}
{
  // la parata dimezza i colpi per tutto il tempo che ha addosso, e un turno vale PASSI_PER_TURNO passi
  const c = eroe('cavaliere', 'scudo-alzato')
  uguale('il cavaliere con lo scudo la può preparare', c.perchéNonPrepari('scudo-alzato'), '')
  const m = scontro(c, { male: 8 })
  const pieno = c.botta(m)
  c.foglio = null
  const d = eroe('cavaliere', 'scudo-alzato')
  d.preparaDalCampo('scudo-alzato')
  const m2 = scontro(d, { male: 8 })
  uguale('con la parata preparata il colpo è la metà', d.botta(m2), Math.ceil(pieno / 2))
  const turni = Math.floor(d.preparati[0].passi / PASSI_PER_TURNO)
  for (let i = 0; i < turni; i++) d.rispondi(false)
  uguale('a ogni turno i suoi passi calano', d.preparati.length, 0)
  uguale('e finiti i passi il colpo torna intero', d.botta(m2), pieno)
}
{
  // l'invulnerabilità (Montagna) e lo specchio: l'invulnerabile non prende niente, lo specchio rimanda il primo colpo
  const c = eroe('nano', 'montagna')
  c.preparaDalCampo('montagna')
  const m = scontro(c, { male: 6 })
  uguale('Montagna preparata: nessun colpo arriva', c.botta(m), 0)
  const s = eroeA(6, 'mago', 'specchio')   // alla fine della storia: Specchio costa tutto il globo
  s.crescita = { ...s.crescita, intelligenza: s.crescita.intelligenza + 3 }   // e per pagarlo ci vuole più globo di quello della strada
  s.energia = s.energiaMax
  s.preparaDalCampo('specchio')
  const n = scontro(s, { male: 6 })
  const ossa = n.ossa
  s.rispondi(false)
  controlla('lo specchio rimanda il primo colpo al mostro', n.ossa < ossa, `${ossa} → ${n.ossa}`)
  controlla('e si consuma', !s.preparati.some(p => p.id === 'specchio'))
}
{
  // la linfa guarisce a ogni turno dell'eroe, al più quante volte dice il nodo
  const c = eroe('elfa', 'linfa')
  c.preparaDalCampo('linfa')
  uguale('la linfa preparata ha i suoi giri', c.preparati[0].tick, aGrado(NODI.linfa, 'linfa', 1))
  c.vita = Math.floor(c.vitaMax / 2)
  const m = scontro(c, { male: 1 })
  m.att = 0
  const v = c.vita
  controlla('entrando nello scontro guarisce', c.vita > v - 1 && c.vita >= v, `${v} → ${c.vita}`)
}
{
  // Rovi, il Ruggito e il Grido partono con lo scontro: i mostri cominciano deboli, e l'incanto si consuma
  const c = eroe('cavaliere', 'ruggito', 'grido')
  c.preparaDalCampo('ruggito')
  c.preparaDalCampo('grido')
  controlla('il Ruggito e il Grido si lanciano dal campo', c.preparati.length === 2)
  const m = scontro(c, { male: 6 })
  controlla('il mostro comincia indebolito', (m.stati || {}).debole > 0, JSON.stringify(m.stati))
  uguale('con i turni del più lungo dei due', (m.stati || {}).debole, Math.max(aGrado(NODI.ruggito, 'debole', 1), aGrado(NODI.grido, 'debole', 1)) - 0)
  uguale('e gli incanti che aprono lo scontro si sono consumati', c.preparati.length, 0)
  uguale('lo dice il foglio', c.foglio.partiti.length, 2)
}
{
  // due eroi con le stesse regole: Rovi sul primo mostro
  const c = eroe('elfa', 'rovi')
  c.preparaDalCampo('rovi')
  const m = scontro(c, { male: 6 })
  controlla('Rovi indebolisce il mostro che ha aperto lo scontro', (m.stati || {}).debole > 0)
}

/* ══════════ 6. la discesa lasciata a metà ══════════ */
{
  const c = eroe('mago', 'scudo-arcano')
  c.preparaDalCampo('scudo-arcano')
  c.faiPassi(7, true)
  const dato = JSON.parse(JSON.stringify(scrivi(c, 1)))
  controlla('la sosta porta i passi e gli incanti', dato.passi === 7 && dato.preparati.length === 1, JSON.stringify(dato.preparati))
  const r = leggi(dato, CAMPAGNA[1], null, [], c.crescita)
  controlla('si rilegge', !!r)
  uguale('con i passi di prima', r.passi, 7)
  uguale('e l\'incanto, coi passi che restavano', r.preparati[0].passi, c.preparati[0].passi)
  uguale('e la barriera intera', r.preparati[0].assorbe, c.preparati[0].assorbe)
  // una sosta di prima non ha i campi nuovi
  const vecchia = { ...dato }
  delete vecchia.passi; delete vecchia.preparati; delete vecchia.mana
  const q = leggi(vecchia, CAMPAGNA[1], null, [], c.crescita)
  controlla('una sosta senza i campi nuovi si rilegge', !!q && q.passi === 0 && q.preparati.length === 0)
  // un dato storto si butta
  const storta = { ...dato, preparati: [{ id: 'dardo-di-fuoco', passi: 10 }, { id: 'non-esiste', passi: 3 }, { id: 'scudo-arcano', passi: -4 }, null] }
  uguale('gli incanti storti si buttano', leggi(storta, CAMPAGNA[1], null, [], c.crescita).preparati.length, 0)
  // lo svenimento li porta via
  c.rimettiInPiedi()
  uguale('svenuti, gli incanti si perdono', c.preparati.length, 0)
}

riassunto('l\'orologio a passi e gli incanti preparati')
