/* I campi col dito (docs/fattoria3d/campi.md), senza browser: il tocco sceglie l'attrezzo, una passata fa uno o tanti campi e ognuno una volta sola,
   i semi solo sui vuoti e il falcetto solo sui pronti, un rifiuto ferma il giro e l'attrezzo resta lì, fatto qualcosa si posa.
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
  const detti = [], aperti = []
  const w = {
    m, rect: { width: 390, height: 700 }, proietta: () => [100, 200, true], pezzi: { centroDi: () => ({}) }, puntaSuolo: (x, y) => ({ x, z: y }),
    ui: { attrezzi: x => aperti.push(x) },
    azioni: {
      campo: () => detti.push('cresce'),
      semina: (c, k) => m.semina(c.id, k).ok,
      raccogli: c => { if (!m.provaRaccolta(c.id).ok) return false; c.tile.forEach((_, k) => m.raccogliTessera(c.id, k)); return true },
    },
  }
  return { w, m, t, uno, due, detti, aperti, a: new Attrezzi(w) }
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
/* fuori dai campi */
{
  const { a, uno, m } = mondo()
  a.tocco(uno); a.prendi('grano'); a.passa(-40, -40); a.lascia()
  controlla('un dito che non passa sui campi non fa niente e l\'attrezzo resta', m.campoVuoto(uno) && a.aperto !== null)
}
riassunto('I campi col dito')
