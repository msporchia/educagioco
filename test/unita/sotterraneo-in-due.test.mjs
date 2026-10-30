/* La discesa con due alleati (src/giochi/sotterraneo/motore/in-due.js, docs/sotterraneo/in-due.md), senza rete: un copione che fa
   le cose una per una. Il secondo nasce accanto al primo, la luce è dei due, non ci si allontana oltre LONTANO, una domanda non
   ferma l'altro e chi risponde non si tocca, lo scontro tira dentro tutti e ognuno ha i suoi turni, i mostri puntano il più forte,
   l'esperienza va a tutti, si scende insieme, il bottino si pesca a turno, il livello si fa sulla coppia e sulla difficoltà. Lo
   stesso copione due volte dà la stessa partita.
   `node test/esegui.mjs sotterraneo-in-due --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { LONTANO } from '../../src/giochi/sotterraneo/motore/in-due.js'
import { giocaInDue } from '../../src/giochi/sotterraneo/motore/banco-in-due.js'
import { robaPer, crescitaPer } from '../../src/giochi/sotterraneo/motore/banco.js'
import { eroeAtteso, livelloDiForza, livelloDellaCoppia, DIFFICOLTA } from '../../src/giochi/sotterraneo/motore/forza.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const FETTA = 0.05
const cella = e => `${Math.floor(e.x)},${Math.floor(e.y)}`
const nuova = (seme = 11) => {
  const c = new Corsa(CAMPAGNA[1], { seme, rnd: seminato(seme), eroe: 'cavaliere' })
  c.persona.nome = 'Leo'
  c.aggiungiAlleato({ eroe: 'mago', nome: 'Melody' })
  return c
}
const avanti = (c, n) => { for (let i = 0; i < n; i++) c.passo(FETTA) }
// un mostro vivo del piano messo accanto all'eroe `i`, sveglio e di casa nella sua stanza
function mostroAccanto(c, i) {
  const e = c.persone[i].eroe, m = c.livello.robe.find(r => r.che === 'mostro' && !r.morto && !r.grosso)
  const x = Math.floor(e.x), y = Math.floor(e.y)
  const dove = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: x + dx, y: y + dy })).find(q => c.livello.calpestabile(q.x, q.y))
  Object.assign(m, { x: dove.x, y: dove.y, fx: dove.x + 0.5, fy: dove.y + 0.5, casa: { x, y }, calmo: 0, sveglio: true })
  return m
}
// risponde chi ha la domanda dello scontro, giusto, finché lo scontro non finisce
function combatti(c, { giusto = () => true } = {}) {
  const chi = []
  for (let g = 0; g < 400 && c.scontroAperto(); g++) {
    const i = c.persone.findIndex(p => p.foglio && p.foglio.che === 'scontro' && p.chiesta)
    if (i < 0) {
      const j = c.persone.findIndex(p => p.foglio && p.foglio.che === 'scontro' && p.foglio.pericolo)
      if (j < 0) break
      c.come(j, () => c.continua())
      continue
    }
    chi.push(i)
    c.come(i, () => c.rispondi(giusto(i)))
  }
  return chi
}

/* ══════════ 1. il secondo alleato ══════════ */
{
  const c = nuova()
  const [a, b] = c.persone
  uguale('due alleati', c.persone.length, 2)
  uguale('il secondo è il mago', b.chiEro, 'mago')
  const mancano = Object.keys(a).filter(k => !(k in b) && k !== 'nome')
  uguale('il secondo ha tutti i campi del primo', mancano.join(' '), '')
  controlla('nasce accanto, non sopra', cella(a.eroe) !== cella(b.eroe) && Math.abs(a.eroe.x - b.eroe.x) <= 3 && Math.abs(a.eroe.y - b.eroe.y) <= 3)
  controlla('in piedi e carico', b.vita === c.come(1, () => c.vitaMax) && b.energia === c.come(1, () => c.energiaMax) && b.vita > 0)
  const kb = Math.floor(b.eroe.y) * c.livello.largo + Math.floor(b.eroe.x)
  controlla('la luce prende anche la cella del secondo', c.luce.has(kb))
}

/* ══════════ 2. una domanda non ferma l'altro, e non ci si allontana troppo ══════════ */
{
  const c = nuova()
  const [a, b] = c.persone
  a.foglio = { che: 'porta', chi: null }
  const fermo = cella(a.eroe), prima = cella(b.eroe)
  const lontana = c.livello.stanze.reduce((m, s) => (Math.abs(s.cx - a.eroe.x) + Math.abs(s.cy - a.eroe.y) > Math.abs(m.cx - a.eroe.x) + Math.abs(m.cy - a.eroe.y) ? s : m))
  c.come(1, () => c.vaiVerso({ x: lontana.cx, y: lontana.cy }, false))
  avanti(c, 400)
  controlla('chi risponde resta fermo', cella(a.eroe) === fermo)
  controlla("l'altro cammina", cella(b.eroe) !== prima)
  const dx = Math.abs(a.eroe.x - b.eroe.x), dy = Math.abs(a.eroe.y - b.eroe.y)
  controlla(`non oltre ${LONTANO} celle dal compagno (${dx.toFixed(1)}, ${dy.toFixed(1)})`, dx <= LONTANO + 0.5 && dy <= LONTANO + 0.5)
  nota(`la stanza più lontana è a ${Math.abs(lontana.cx - a.eroe.x).toFixed(0)}, ${Math.abs(lontana.cy - a.eroe.y).toFixed(0)}`)
  if (Math.abs(lontana.cx - a.eroe.x) > LONTANO + 2 || Math.abs(lontana.cy - a.eroe.y) > LONTANO + 2)
    controlla('e lo dice', b.avvisi.some(t => t.includes('non mi allontano da Leo')))
}

/* ══════════ 3. il mostro aspetta chi risponde, poi lo scontro è di tutti ══════════ */
function partita(seme) {
  const c = nuova(seme)
  const [a, b] = c.persone
  a.foglio = { che: 'porta', chi: null }
  mostroAccanto(c, 0)
  avanti(c, 60)
  const aspetta = !c.scontroAperto()
  c.come(0, () => c.chiudi())
  avanti(c, 60)
  const f = a.foglio
  const tirato = !!f && f.che === 'scontro' && b.foglio === f
  const fila = f ? f.coda.map(x => x.id).filter(id => typeof id === 'string').sort().join(' ') : ''
  const esp = [a.espPresa, b.espPresa]
  const turni = combatti(c)
  return { c, aspetta, tirato, fila, esp, turni, f }
}
{
  const { c, aspetta, tirato, fila, esp, turni } = partita(11)
  const [a, b] = c.persone
  controlla('il mostro non tocca chi sta rispondendo', aspetta)
  controlla('finita la domanda parte lo scontro, e il compagno è tirato dentro', tirato)
  uguale('nella fila ci sono tutti e due', fila, 'eroe eroe1')
  controlla('rispondono tutti e due, ognuno al suo turno', turni.includes(0) && turni.includes(1))
  controlla('lo scontro si chiude per tutti', !c.scontroAperto() && !a.foglio && !b.foglio)
  controlla("l'esperienza va a tutti e due", a.espPresa > esp[0] && b.espPresa > esp[1])
  nota(`turni: ${turni.join('')}`)
  uguale('lo stesso copione, la stessa partita', JSON.stringify(partita(11).turni), JSON.stringify(turni))
}

/* ══════════ 4. il mostro punta il più forte ══════════ */
{
  const c = nuova()
  const [a, b] = c.persone
  a.foglio = null
  const m = mostroAccanto(c, 0)
  avanti(c, 60)
  const f = a.foglio
  controlla('lo scontro è aperto', f && f.che === 'scontro')
  if (f) {
    const peso = i => c.come(i, () => c.colpo(m) * c.vita / c.vitaMax)
    uguale('punta chi pesa di più (colpo × vita in proporzione)', c.bersaglioDelMostro(f, m), peso(0) >= peso(1) ? 0 : 1)
    const forte = c.bersaglioDelMostro(f, m)
    c.persone[forte].vita = 1
    uguale('ferito il più forte, tocca all\'altro', c.bersaglioDelMostro(f, m), 1 - forte)
  }
}

/* ══════════ 5. si scende insieme ══════════ */
{
  const c = nuova()
  c.chiaveDelPiano = true
  c.come(0, () => c.allaScala())
  uguale('il primo alla scala aspetta', JSON.stringify(c.come(0, () => c.scendi())), JSON.stringify({ che: 'aspetta' }))
  uguale('e il piano è quello', c.piano, 0)
  controlla('chi aspetta ha un foglio: è al riparo', c.persone[0].foglio && c.persone[0].foglio.che === 'aspetta')
  c.come(1, () => c.allaScala())
  uguale('arriva il secondo: si scende', c.come(1, () => c.scendi()).che, 'sceso')
  uguale('un piano più giù', c.piano, 1)
  const [a, b] = c.persone
  controlla('tutti e due nel piano nuovo, vicini, coi fogli chiusi', !a.foglio && !b.foglio && cella(a.eroe) !== cella(b.eroe) &&
    Math.abs(a.eroe.x - b.eroe.x) <= 3 && Math.abs(a.eroe.y - b.eroe.y) <= 3)
}

/* ══════════ 6. il bottino a turno ══════════ */
{
  const c = nuova()
  const chi = [0, 1, 2, 3].map(() => { const tua = c.tuaDelBottino(); return [tua('ascia'), tua('verga')] })
  nota(`chi può portare l'ascia (il cavaliere) e la verga (il mago), caduta dopo caduta: ${chi.map(x => x.map(Number).join('')).join(' ')}`)
  controlla('una caduta per uno: non sempre la stessa classe', new Set(chi.map(x => x.join())).size > 1)
}

/* ══════════ 7. il livello della coppia, con la difficoltà ══════════ */
for (const [a, b] of [[14, 14], [8, 15]]) {
  const ca = eroeAtteso('cavaliere', a), cb = eroeAtteso('mago', b)
  const soli = [livelloDiForza(ca), livelloDiForza(cb)]
  const livelli = Object.keys(DIFFICOLTA).map(d => livelloDellaCoppia([ca, cb], d))
  nota(`cavaliere del ${a} e mago del ${b}: da soli ${soli.join(' e ')}, in due ${Object.keys(DIFFICOLTA).map((d, i) => `${d} ${livelli[i]}`).join(', ')}`)
  controlla(`${a} e ${b}: in due valgono più del più forte da solo`, livelli[1] > Math.max(...soli))
  controlla(`${a} e ${b}: più difficile, mai più basso`, livelli.every((l, i) => i === 0 || l >= livelli[i - 1]))
  controlla(`${a} e ${b}: facile sotto impossibile`, livelli[0] < livelli[3])
}

/* ══════════ 8. discese intere coi giocatori finti in due ══════════ */
for (const k of [0, 1, 3]) {
  const t = CAMPAGNA[k]
  const opz = { eroi: ['cavaliere', 'mago'], roba: [robaPer(k), robaPer(k, { eroe: 'mago' })], crescite: [crescitaPer(k), crescitaPer(k, { eroe: 'mago' })], seme: 5 + k, bravura: 0.9 }
  const g = giocaInDue(t, opz)
  nota(`${t.chiave}: ${g.esito.vinta ? 'vinta' : 'persa'} al piano ${g.corsa.piano + 1}, turni di scontro ${g.turni.join(' e ')}, esperienza ${g.persone.map(p => p.esp).join(' e ')}, svenimenti ${g.persone.map(p => p.svenimenti).join(' e ')}`)
  controlla(`${t.chiave}: la discesa in due finisce`, !g.guasto, g.guasto)
  controlla(`${t.chiave}: combattono tutti e due`, g.turni.every(n => n > 0))
  uguale(`${t.chiave}: la stessa discesa due volte`, JSON.stringify(giocaInDue(t, opz).persone), JSON.stringify(g.persone))
}

riassunto('Il sotterraneo in due, senza rete')
