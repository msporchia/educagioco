/* I mostri morti tornano col tempo (docs/sotterraneo/ricomparsa.md): il tempo sono i passi dell'eroe, il ritardo va da una a due volte
   RICOMPARSA_BASE ed è diverso per ognuno ma sempre lo stesso a parità di seme; non tornano i bersagli, i grossi, i caporali, la chiave;
   non tornano nella stanza dell'eroe né in luce; si salva con la sosta (anche nei piani alle spalle) e una sosta di prima non cambia;
   il banco la tiene spenta.
   `node test/esegui.mjs sotterraneo-ricomparsa --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { RICOMPARSA_BASE, guastiDelMondo } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { puoTornare } from '../../src/giochi/sotterraneo/motore/ricomparsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { gioca } from '../../src/giochi/sotterraneo/motore/banco.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const TAPPA = CAMPAGNA[1]
const nuova = (seme = 5, piano = 0) => {
  const c = new Corsa(TAPPA, { seme, rnd: seminato(seme), eroe: 'cavaliere' })
  if (piano) { c.piano = piano; c.nuovoPiano() }
  return c
}
// i mostri che possono tornare, in ordine di indice
const comuni = c => c.livello.robe.map((r, i) => ({ r, i })).filter(({ i }) => puoTornare(c.robeDelSeme, i))
// l'eroe in un posto lontano da `m` (la stanza d'ingresso), con la luce rifatta lì
function eroeLontanoDa(c, m) {
  const dentro = c.livello.stanze[0]
  c.eroe = { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
  c.aggiornaLuce()
  return c.livello.stanzaDi(m.x, m.y) !== dentro && !c.inLuce(m.y * c.livello.largo + m.x)
}
const lontano = c => comuni(c).find(({ r }) => eroeLontanoDa(c, r))

uguale('la manopola è a posto per i guasti del mondo', guastiDelMondo().filter(g => /ricomparsa/.test(g)).length, 0)

/* ══════════ 1. il ritardo: da BASE a due volte BASE, diverso per ognuno, sempre lo stesso ══════════ */
{
  const c = nuova()
  const lista = comuni(c)
  controlla('il piano ha mostri qualunque', lista.length >= 6, String(lista.length))
  for (const { r } of lista) c.cade(r)
  const ritardi = lista.map(({ r }) => r.torna - c.passi)
  controlla('ogni ritardo sta fra BASE e due volte BASE',
    ritardi.every(t => t >= RICOMPARSA_BASE && t < 2 * RICOMPARSA_BASE), ritardi.join(','))
  controlla('e non sono tutti uguali', new Set(ritardi.map(t => Math.round(t))).size > ritardi.length / 2, ritardi.join(','))
  const ordine = lista.map(({ r }) => r.torna)
  controlla('né tornano nell\'ordine in cui sono morti', ordine.join() !== [...ordine].sort((a, b) => a - b).join())

  const d = nuova()
  for (const { r } of comuni(d)) d.cade(r)
  stessaLista('a parità di seme sono gli stessi', comuni(d).map(({ r }) => r.torna), ordine)

  // la seconda volta che cade è un altro ritardo
  const { r } = lista[0]
  c.passi = 1000
  Object.assign(r, { morto: false })
  c.cade(r)
  controlla('la volta dopo è un altro tiro', r.torna - 1000 !== ritardi[0], `${r.torna}`)
  uguale('e conta quante volte è caduto', r.morti, 2)
  nota('ritardi della prima volta:', ritardi.map(Math.round).join(' '))
}

/* ══════════ 2. chi ha un ruolo non torna ══════════ */
{
  const c = nuova(5, TAPPA.piani - 1)   // l'ultimo piano: il grosso, la sua anticamera coi caporali
  const mostri = c.livello.robe.filter(r => r.che === 'mostro')
  const chiave = mostri.filter(r => r.chiave), grossi = mostri.filter(r => r.grosso), caporali = mostri.filter(r => r.caporale)
  controlla('l\'ultimo piano ha il grosso, la chiave e i caporali', chiave.length && grossi.length && caporali.length,
    `${chiave.length} ${grossi.length} ${caporali.length}`)
  const branchoDelGrosso = mostri.filter(r => r.branco && r.branco === grossi[0].branco && !r.grosso)
  controlla('il grosso ha i suoi scagnozzi', branchoDelGrosso.length > 0)
  for (const r of mostri) if (!r.morto) c.cade(r)
  controlla('chiave, grosso, caporali e scagnozzi non prenotano nessun ritorno',
    mostri.filter(r => r.chiave || r.grosso || r.caporale || r.branco === grossi[0].branco).every(r => r.torna == null))
  controlla('gli altri sì', mostri.some(r => r.torna != null))
  c.passi += 100 * RICOMPARSA_BASE
  eroeLontanoDa(c, mostri[0])
  c.faiTornareIMostri()
  controlla('dopo mille passi quelli di un ruolo sono ancora morti',
    mostri.filter(r => r.chiave || r.grosso || r.caporale || r.branco === grossi[0].branco).every(r => r.morto))

  // un bersaglio di missione è una cosa nata dopo il piano, col suo `missione`: nessun ritorno
  const b = c.livello.robe.find(r => r.che === 'mostro' && !r.morto)
  const prima = c.livello.robe.length
  c.livello.robe.push({ ...b, missione: 'm1', morto: false, x: b.x, y: b.y })
  c.cade(c.livello.robe[prima])
  controlla('un bersaglio di missione non prenota', c.livello.robe[prima].torna == null)
}

/* ══════════ 3. quando torna: al suo posto, intero, e non sotto gli occhi dell'eroe ══════════ */
{
  const c = nuova()
  const { r: m, i } = lontano(c) || {}
  controlla('c\'è un mostro lontano dall\'ingresso e fuori dalla luce', !!m)
  const nato = c.robeDelSeme[i]
  m.ossa = 1; m.x = nato.x + 1; m.sveglio = true
  c.cade(m)
  uguale('morto, aspetta', m.morto, true)
  c.passi = m.torna - 1
  c.faiTornareIMostri()
  uguale('un passo prima non torna', m.morto, true)
  c.passi = m.torna
  // l'eroe nella sua stanza: aspetta
  const sua = c.livello.stanzaDi(nato.x, nato.y)
  c.eroe = { x: sua.cx + 0.5, y: sua.cy + 0.5 }
  c.aggiornaLuce()
  c.faiTornareIMostri()
  uguale('nella stanza dell\'eroe non torna', m.morto, true)
  // l'eroe in un\'altra stanza ma con il suo posto in luce: aspetta anche così
  eroeLontanoDa(c, m)
  c.luce.add(nato.y * c.livello.largo + nato.x)
  c.faiTornareIMostri()
  uguale('in luce non torna', m.morto, true)
  c.aggiornaLuce()
  c.faiTornareIMostri()
  uguale('fuori dalla stanza e dalla luce torna', m.morto, false)
  uguale('al suo posto di partenza', `${m.x},${m.y}`, `${nato.x},${nato.y}`)
  uguale('con la vita piena', m.ossa, nato.ossa)
  controlla('come uno nuovo: senza ritorno prenotato né stato di fuga', m.torna == null && m.fx == null && !m.sveglio)
  uguale('si ricorda di essere già caduto', m.morti, 1)

  // il premio è quello di uno nuovo: cade di nuovo, esperienza e gemme come la prima volta
  const esp = c.espPresa
  c.cade(m)
  controlla('e se cade ancora dà esperienza', c.espPresa > esp)
  uguale('con un altro ritorno prenotato', m.morti, 2)
}

/* ══════════ 4. si salva con la sosta; una sosta di prima non cambia ══════════ */
{
  const c = nuova()
  const lista = comuni(c).slice(0, 3)
  for (const { r } of lista) c.cade(r)
  c.passi = 77
  const dato = JSON.parse(JSON.stringify(scrivi(c, 1)))
  const letta = leggi(dato, TAPPA)
  controlla('la sosta si rilegge', !!letta)
  stessaLista('il ritorno di ogni morto è lo stesso', lista.map(({ i }) => letta.livello.robe[i].torna), lista.map(({ r }) => r.torna))
  stessaLista('e quante volte è morto', lista.map(({ i }) => letta.livello.robe[i].morti), [1, 1, 1])

  // una sosta di prima: nessuno dei campi nuovi, e i morti restano morti da sempre
  const vecchio = JSON.parse(JSON.stringify(dato))
  for (const d of Object.values(vecchio.robe.cambi)) { delete d.torna; delete d.morti }
  const l2 = leggi(vecchio, TAPPA)
  controlla('una sosta di prima si rilegge', !!l2)
  uguale('con i morti morti', lista.every(({ i }) => l2.livello.robe[i].morto), true)
  l2.passi += 100 * RICOMPARSA_BASE
  eroeLontanoDa(l2, lista[0].r)
  l2.faiTornareIMostri()
  uguale('e dopo mille passi non ne torna nessuno', lista.some(({ i }) => !l2.livello.robe[i].morto), false)

  // rileggendo dopo molti passi (la sosta ha passi più avanti del ritorno): tornano subito, se non nella stanza d'arrivo
  const tardi = JSON.parse(JSON.stringify(dato))
  tardi.passi = 100 * RICOMPARSA_BASE
  const l3 = leggi(tardi, TAPPA)
  const tornati = lista.filter(({ i }) => !l3.livello.robe[i].morto)
  const stanzaEroe = l3.livello.stanzaDi(Math.floor(l3.eroe.x), Math.floor(l3.eroe.y))
  controlla('rileggendo dopo tanti passi tornano gli scaduti', tornati.length > 0 || lista.every(({ i }) => {
    const n = l3.robeDelSeme[i]
    return l3.livello.stanzaDi(n.x, n.y) === stanzaEroe || l3.inLuce(n.y * l3.livello.largo + n.x)
  }))
}

/* ══════════ 5. rientrando in un piano: i passi fatti altrove contano ══════════ */
{
  const c = nuova()
  const { r: m, i } = lontano(c) || {}
  c.cade(m)
  const torna = m.torna
  // si scende, si cammina un po' di là e si risale: nel frattempo il tempo è passato
  c.lasciaIlPiano(); c.piano++; c.entraNelPiano({ dal: 'sopra' })
  uguale('scendendo prima del tempo, di sopra resta morto', c.piani.get(0).livello.robe[i].morto, true)
  c.passi = torna + 1
  const dato = JSON.parse(JSON.stringify(scrivi(c, 1)))
  const l = leggi(dato, TAPPA)
  const dietro = l.piani.get(0)
  controlla('il piano alle spalle ricorda il ritorno', dietro.livello.robe[i].torna === torna)
  l.lasciaIlPiano(); l.piano--; l.entraNelPiano({ dal: 'sotto' })
  const n = l.robeDelSeme[i]
  const arrivo = l.livello.stanzaDi(Math.floor(l.eroe.x), Math.floor(l.eroe.y))
  const doveEra = l.livello.stanzaDi(n.x, n.y)
  uguale('risalendo, lo scaduto torna (se non è nella stanza d\'arrivo né in luce)',
    !l.livello.robe[i].morto, doveEra !== arrivo && !l.inLuce(n.y * l.livello.largo + n.x))

  // chi è ancora in attesa non torna
  const e = nuova()
  const { r: k } = lontano(e) || {}
  e.cade(k)
  e.lasciaIlPiano(); e.piano++; e.entraNelPiano({ dal: 'sopra' })
  e.passi = k.torna - 1
  e.lasciaIlPiano(); e.piano--; e.entraNelPiano({ dal: 'sotto' })
  uguale('un passo prima del tempo, rientrando, resta morto', k.morto, true)
}

/* ══════════ 6. il banco la tiene spenta ══════════ */
{
  const da = nuova()
  uguale('una Corsa vera ha la ricomparsa', da.ricomparsa, true)
  gioca(TAPPA, { da, seme: 5 })
  uguale('il banco la spegne', da.ricomparsa, false)
  controlla('e nessun mostro morto ha un ritorno', da.livello.robe.every(r => r.torna == null))
  const f = new Corsa(TAPPA, { seme: 5, ricomparsa: false })
  const m = f.livello.robe.find(r => r.che === 'mostro')
  f.cade(m)
  controlla('spenta, cadere non prenota niente', m.torna == null && m.morti == null)
  dentro('il banco misura un passaggio solo: base in passi', RICOMPARSA_BASE, 1, 100000)
}

riassunto('la ricomparsa dei mostri')
