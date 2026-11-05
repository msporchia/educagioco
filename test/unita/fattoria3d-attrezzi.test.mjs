/* Il dito che trascina (docs/fattoria3d/campi.md, docs/fattoria3d/cura-sul-prato.md), senza browser: il tocco sceglie l'attrezzo, una passata fa uno o tanti campi e ognuno una volta sola,
   i semi solo sui vuoti e il falcetto solo sui pronti, un rifiuto ferma il giro e l'attrezzo resta lì, fatto qualcosa si posa. Ciotola, tinozza e recinto: quello che si porta va dentro
   solo sopra il bersaglio, senza fame la ciotola non si apre, chi è pulito non è in vignetta, la nuvoletta dice il mangime anche se non ne hai.
   `node test/esegui.mjs fattoria3d-attrezzi`
   tempo: 1 */
import { Attrezzi } from '../../src/giochi/fattoria3d/scena3d/attrezzi.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { controlla, stessaLista as uguale, riassunto } from '../aiuto/verifica.mjs'

function mondo() {
  const b = { monete: 500 }, t = { ora: 1_000_000 }
  const m = new Fattoria3d({ borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora })
  const metti = () => {
    m.s.magazzino.campo = 1
    for (let i = -14; i < 14; i++) for (let j = -12; j < 12; j++) if (m.puoMettere('campo', i, j).ok) { const r = m.mettiPezzo('campo', i, j); if (r.ok) return m.s.cose.at(-1) }
    throw new Error('nessun posto per il campo')
  }
  const uno = metti(), due = metti()
  const detti = [], aperti = [], fatti = [], rifiuti = []
  const w = {
    m, rect: { width: 390, height: 700 }, proietta: () => [100, 200, true], pezzi: { centroDi: () => ({}), salta: () => {} }, puntaSuolo: (x, y) => ({ x, z: y }),
    fx: { parla: t => detti.push(t) },
    ui: { cartello: t => rifiuti.push(t), attrezzi: x => aperti.push(x), riempi: (id, k) => { fatti.push(['riempi', id, k]); return k !== 'no' }, lava: id => { fatti.push(['lava', id]); return true } },
    azioni: {
      campo: () => detti.push('cresce'),
      dici: t => detti.push(t),
      nutriRecinto: c => { fatti.push(['nutri', c.id]); return true },
      semina: (c, k) => m.semina(c.id, k).ok,
      raccogli: c => { if (!m.provaRaccolta(c.id).ok) return false; c.tile.forEach((_, k) => m.raccogliTessera(c.id, k)); return true },
    },
  }
  return { w, b, m, t, uno, due, detti, aperti, fatti, rifiuti, a: new Attrezzi(w) }
}
const su = c => [c.i + 0.5, c.j + 0.5]

/* il tocco */
{
  const { a, uno, aperti, t, m, detti } = mondo()
  a.tocco(uno)
  uguale('un campo vuoto porta i semi', [a.aperto.tipo, aperti.at(-1).tipo], ['semi', 'semi'])
  a.chiudi()
  uguale('chiuso lo dice alla vista', aperti.at(-1), null)
  m.semina(uno.id, 'grano'); a.tocco(uno)
  uguale('su uno che cresce niente attrezzo: dice quanto manca', [a.aperto, detti.length], [null, 1])
  t.ora += 6 * 60000; a.tocco(uno)
  uguale('uno pronto porta il falcetto', a.aperto.tipo, 'falce')
}
/* una passata */
{
  const { a, m, uno, due, aperti } = mondo()
  a.tocco(uno); a.prendi('grano')
  a.passa(...su(uno)); a.passa(...su(uno)); a.passa(...su(due))
  controlla('una passata semina due campi', !m.campoVuoto(uno) && !m.campoVuoto(due))
  a.lascia()
  uguale('fatto qualcosa, l\'attrezzo si posa', [a.aperto, aperti.at(-1)], [null, null])
}
{
  const { a, m, uno, due, t } = mondo()
  m.semina(uno.id, 'grano'); t.ora += 6 * 60000
  m.semina(due.id, 'grano')
  a.tocco(uno); a.prendi('falce')
  a.passa(...su(due)); a.passa(...su(uno))
  controlla('il falcetto taglia il pronto e attraversa quello che cresce', m.campoVuoto(uno) && !m.campoVuoto(due))
}
/* un rifiuto */
{
  const { a, m, uno, t } = mondo()
  m.semina(uno.id, 'grano'); t.ora += 6 * 60000; m.s.merci.grano = 8
  a.tocco(uno); a.prendi('falce'); a.passa(...su(uno))
  controlla('lo scomparto pieno lascia il campo intero', !m.campoVuoto(uno) && uno.tile.every(x => x !== null))
  a.lascia()
  uguale('e l\'attrezzo resta lì', a.aperto?.tipo, 'falce')
  m.s.merci.grano = 0; a.prendi('falce'); a.passa(...su(uno)); a.lascia()
  controlla('liberato lo scomparto si riprova', m.campoVuoto(uno) && a.aperto === null)
}
/* una passata che non serve a niente lo dice */
{
  const { a, m, uno, due, detti, t } = mondo()
  m.semina(uno.id, 'grano'); a.tocco(due); a.prendi('grano'); a.passa(...su(uno)); a.lascia()
  uguale('i semi su un campo che cresce: lo dice e l\'attrezzo resta', [detti.at(-1), a.aperto?.tipo], ['cresce', 'semi'])
  a.chiudi(); detti.length = 0
  m.semina(due.id, 'grano'); t.ora += 6 * 60000; a.aperto = { tipo: 'semi' }; a.prendi('grano'); a.passa(...su(due)); a.lascia()
  uguale('i semi su un campo pronto: dice di usare il falcetto', detti, ['È già pronto: raccoglilo col falcetto'])
}
{
  const { a, uno, due, m, detti } = mondo()
  m.semina(uno.id, 'grano'); a.tocco(uno); controlla('un campo che cresce non porta attrezzo', a.aperto === null)
  m.semina(due.id, 'grano'); m.s.merci.grano = 0
  a.aperto = { tipo: 'falce' }; a.prendi('falce'); a.passa(...su(due)); a.lascia()
  uguale('il falcetto su un campo che cresce non fa finta di niente', detti.at(-1), 'cresce')
  const v = m.cosa(due.id); v.tile.fill(null); a.aperto = { tipo: 'falce' }; a.prendi('falce'); a.passa(...su(due)); a.lascia()
  uguale('il falcetto su un campo vuoto dice di seminare', detti.at(-1), 'È vuoto: prima semina qualcosa')
}
/* fuori dai campi */
{
  const { a, uno, m } = mondo()
  a.tocco(uno); a.prendi('grano'); a.passa(-40, -40); a.lascia()
  controlla('un dito che non passa sui campi non fa niente e l\'attrezzo resta', m.campoVuoto(uno) && a.aperto !== null)
}
/* la ciotola: i cibi solo a chi ha fame, e va dentro solo se la lasci sopra */
{
  const { a, m, b, aperti, fatti, detti, rifiuti } = mondo()
  b.monete = 5000; m.s.esperienza = 1e6; m.cura.compra('beagle')
  const k = m.cura.ciotolaDi('beagle')
  m.cura.casa.beagle.pancia = 0.9
  a.ciotola(k)
  uguale('e lo dice anche in cima alla scena', rifiuti.at(-1), detti.at(-1))
  uguale('senza fame non si apre: lo dice', [a.aperto, detti.at(-1)], [null, `${m.cura.nomeDi('beagle')} non ha fame: quando ne avrà, ti chiamerà dalla sua ciotola`])
  m.cura.casa.beagle.pancia = 0.2
  a.ciotola(k)
  uguale('con la fame porta i cibi', [a.aperto.tipo, a.aperto.bestia, a.aperto.voci.some(v => v.id === 'osso')], ['ciotola', 'beagle', true])
  controlla('la riga dice cosa vorrebbe', a.aperto.riga.includes('vorrebbe'))
  a.prendi('osso'); a.passa(300, 600)
  a.lascia()
  uguale('lasciato lontano non va dentro e resta aperta', [fatti.length, a.aperto.tipo], [0, 'ciotola'])
  a.prendi('osso'); a.passa(120, 210)
  uguale('sopra la ciotola la vista lo sa', aperti.at(-1).sopra, true)
  a.lascia()
  uguale('lasciato sopra va dentro e si chiude', [fatti.at(-1), a.aperto], [['riempi', 'beagle', 'osso'], null])
  a.ciotola(k); a.metti('no')
  controlla('un rifiuto la lascia aperta', !!a.aperto)
  a.chiudi(); a.ciotola(k); a.prendi('osso'); a.passa(120, 262)
  controlla('la figura sta sopra il dito: vale anche lei', a.sopra)
}
/* la tinozza: gli sporchi in vignetta, uno portato dentro comincia il bagno */
{
  const { a, m, b, fatti, detti, rifiuti } = mondo()
  b.monete = 5000; m.s.esperienza = 1e6; m.cura.compra('beagle'); m.cura.compra('coniglio')
  const t = m.cura.tinozza()
  a.tinozza(t)
  uguale('e lo dice anche in cima alla scena', rifiuti.at(-1), detti.at(-1))
  uguale('tutti puliti: lo dice', [a.aperto, detti.at(-1)], [null, 'Sono tutti puliti: la tinozza serve quando qualcuno si sporca'])
  m.cura.casa.beagle.pelo = 0.2
  a.tinozza(t)
  uguale('in vignetta solo chi è sporco', a.aperto.voci.map(v => v.id), ['beagle'])
  a.prendi('beagle'); a.passa(100, 200); a.lascia()
  uguale('portato dentro comincia il bagno', [fatti.at(-1), a.aperto], [['lava', 'beagle'], null])
}
/* il recinto: la nuvoletta col mangime, anche senza scorte */
{
  const { a, m, fatti } = mondo()
  const c = { id: 77, tipo: 'pollaio', bestie: [{ fine: null }] }
  m.s.prodotti.becchime = 3
  a.recinto(c)
  uguale('la nuvoletta dice cosa mangia e quanto ne hai', [a.aperto.tipo, a.aperto.voci[0].id, a.aperto.voci[0].n, a.aperto.voci[0].ok], ['recinto', 'becchime', 3, true])
  m.cosa = id => (id === 77 ? c : null)
  a.prendi('becchime'); a.passa(100, 200); a.lascia()
  uguale('portato dentro il contadino lo dà', [fatti.at(-1), a.aperto], [['nutri', 77], null])
  m.s.prodotti.becchime = 0
  a.recinto(c, 'Serve il becchime')
  uguale('senza scorte si vede lo stesso, spento, e la riga dice cosa manca', [a.aperto.voci[0].ok, a.aperto.riga], [false, 'Serve il becchime'])
}

/* le opzioni: quello che una cosa ha in più sta nello stesso arco, e si tocca */
{
  const { a, w, m, uno, aperti, detti, b } = mondo()
  w.azioni.dici = t => detti.push(t); w.cambiato = () => {}
  m.s.magazzino.tavolo = 1
  let tavolo = null
  for (let i = -14; i < 14 && !tavolo; i++) for (let j = -12; j < 12 && !tavolo; j++) if (m.puoMettere('tavolo', i, j).ok && m.puoMettere('tavolo', i + 1, j - 1, 0, 1).ok) tavolo = m.mettiPezzo('tavolo', i, j).cosa
  uguale('un campo non si gira: niente opzioni', [a.opzioni(uno), a.aperto], [false, null])
  controlla('un tavolo ha ↻', a.opzioni(tavolo) && a.aperto.tipo === 'opzioni' && a.aperto.opzioni[0].id === 'gira')
  const monete = b.monete
  a.opzione('gira')
  uguale('l\'opzione lo gira e costa come spostarlo', [m.cosa(tavolo.id).rot, monete - b.monete], [1, 1])
  controlla('e l\'arco resta lì', !!a.aperto)
  const prima = aperti.length
  a.opzioni(tavolo)
  uguale('sulla stessa cosa non si riapre', aperti.length, prima)
  b.monete = 0
  a.opzione('gira')
  uguale('senza monete resta com\'è e lo dice', [m.cosa(tavolo.id).rot, detti.length], [1, 1])
}

/* le opzioni di un animale: ci sono solo quelle che gli servono */
{
  const { a, w, m } = mondo(), aperti = []
  m.s.esperienza = 1e6
  w.ui.apriBestia = id => aperti.push(['foglio', id]); w.ui.apriAddobbi = id => aperti.push(['vesti', id])
  m.cura.compra('beagle')
  const c = { def: { id: 'beagle' }, x: 0, z: 0 }, ids = () => a.aperto.opzioni.map(o => o.id)
  m.cura.casa.beagle.pancia = 1; m.cura.casa.beagle.pelo = 1
  a.bestia(c)
  controlla('sazia e pulita: niente pappa né bagno', !ids().includes('pappa') && !ids().includes('bagno') && ids().includes('come'))
  m.cura.casa.beagle.pancia = 0.1; m.cura.casa.beagle.pelo = 0.1
  a.bestia(c)
  controlla('con fame e sporca ci sono', ids().includes('pappa') && ids().includes('bagno'))
  a.opzione('come')
  uguale('«Come sta» apre il foglio e chiude l\'arco', [aperti, a.aperto], [[['foglio', 'beagle']], null])
  a.bestia({ def: { id: 'nessuno' }, x: 0, z: 0 })
  uguale('chi non è tuo non ha opzioni', a.aperto, null)
}

riassunto('I campi col dito')
