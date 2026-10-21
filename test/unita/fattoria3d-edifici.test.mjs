/* Gli edifici sono pezzi liberi (docs/fattoria3d/edifici-liberi.md), dal lato della scena: nessun fantasma finché non si costruiscono, poi un
   gruppo come gli altri pezzi, dove sta la cosa; si sposta, si mette via, si tocca dal davanti (o da un altro lato se è murato), e il suo
   cartello di lavoro dice i pronti. Senza browser (three senza WebGL). `node test/esegui.mjs fattoria3d-edifici`
   tempo: 1 */
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const { Pezzi } = await import('../../src/giochi/fattoria3d/scena3d/pezzi.js')
const { Mondo3d } = await import('../../src/giochi/fattoria3d/scena3d/mondo3d.js')
const { dettoDi } = await import('../../src/giochi/fattoria3d/scena3d/detti.js')
const { Fattoria3d } = await import('../../src/giochi/fattoria3d/motore/fattoria3d.js')
const { sogliaDi } = await import('../../src/giochi/fattoria3d/dati/livelli.js')
const { EDIFICI } = await import('../../src/giochi/fattoria3d/dati/catalogo.js')
const { chiave } = await import('../../src/giochi/fattoria3d/dati/mondo.js')

const testi = []
const badge = () => ({ el: { hidden: false, style: {} }, testo: '', imposta(t) { this.testo = t; testi.push(t) }, togli() {}, metti() {}, bestie() {} })
const fx = { nuovoBadge: badge, nuovoCartello: badge, fumata() {} }
const b = { monete: 5000 }, t = { ora: 1_000_000 }
const f = new Fattoria3d({ stato: null, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
f.s.esperienza = sogliaDi(12)
for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o)
const scena = new THREE.Scene()
const p = new Pezzi(scena, f, fx, { proietta: () => [0, 0, true] }, { vento: false })
const edificiInScena = () => [...p.voci.values()].filter(v => v.edificio)

/* ══════════ 1. niente fantasmi: un edificio non costruito non è in scena ══════════ */
uguale('a inizio partita c\'è solo il campo', [...p.voci.values()].map(v => v.tipo).join(), 'campo')
controlla('nessun gruppo, nessun cartello per gli edifici aperti dal livello ma non costruiti', edificiInScena().length === 0 && f.edificiDaCostruire().length > 5 && scena.children.length === 1)

/* ══════════ 2. costruito, è un gruppo come gli altri, dove sta la cosa ══════════ */
const r = f.compraEMetti('mulino', -2, 5)
p.sincronizza()
{
  const v = p.voce(r.cosa.id)
  controlla('il mulino è in scena, marcato edificio, col bersaglio di una cosa', !!v && v.edificio === true && v.grp.userData.bersaglio.kind === 'cosa' && v.grp.userData.bersaglio.id === r.cosa.id)
  stessaLista('il gruppo sta al centro del suo ingombro 3×3', [v.grp.position.x, v.grp.position.z], [-2 + EDIFICI.mulino.w / 2, 5 + EDIFICI.mulino.d / 2])
  stessaLista('centroDi per cosa e per tipo è lo stesso punto', [p.centroDi({ kind: 'cosa', id: r.cosa.id }).x, p.centroDi({ kind: 'edificio', tipo: 'mulino' }).z], [-0.5, 6.5])
  p.fanNascere(r.cosa.id); p.aggiorna(0.5, 1); p.aggiorna(0.5, 1.5)
  controlla('rimbalza e si assesta a scala 1 senza errori', Math.abs(v.grp.scale.x - 1) < 1e-9 && v.nasce === undefined)
  // una macchina che lavora dice i pronti sul cartello
  f.s.merci.grano = 4; f.avviaRicettaIn('mulino', 'farina')
  p.aggiorna(0.016, 2)
  controlla('il cartello dice la cottura', /🔥/.test(v.badge.testo), v.badge.testo)
  t.ora += 1e7; f.tick(); p.aggiorna(0.016, 3)
  controlla('e poi i pronti', /pront/.test(v.badge.testo), v.badge.testo)
}

/* ══════════ 3. spostato, il gruppo lo segue; messo via, sparisce; rimesso, torna ══════════ */
{
  const id = r.cosa.id
  f.spostaPezzo(id, 2, 4); p.sincronizza()
  stessaLista('spostato, il gruppo va al nuovo centro', [p.voce(id).grp.position.x, p.voce(id).grp.position.z], [3.5, 5.5])
  uguale('con i pronti da ritirare non si mette via', f.mettiVia(id).motivo, 'macchina-al-lavoro')
  f.ritiraDa('mulino')
  controlla('ritirato, si mette via: il gruppo sparisce dalla scena', f.mettiVia(id).ok && (p.sincronizza(), true) && edificiInScena().length === 0 && scena.children.length === 1)
  const r2 = f.compraEMetti('mulino', 3, 3)
  p.sincronizza()
  controlla('rimesso gratis, torna in scena', r2.ok && edificiInScena().length === 1 && f.monete() === b.monete)
}

/* ══════════ 4. si tocca dal davanti; se è murato, da un altro lato ══════════ */
{
  const c = f.cosaDi('mulino')               // 3,3 .. 5,5
  const davanti = Mondo3d.prototype.celleDiServizio.call({ m: f }, { kind: 'cosa', id: c.id })
  const fronte = [0, 1, 2].map(a => [c.i + a, c.j + 3]).filter(([i, j]) => f.libera(i, j))
  controlla('il servizio sta davanti (verso +z), sul bordo basso, nelle celle libere', davanti.length === fronte.length && davanti.length > 0 && davanti.every(([i, j]) => j === c.j + 3 && i >= c.i && i < c.i + 3), JSON.stringify([c, davanti]))
  const murato = Mondo3d.prototype.celleDiServizio.call({ m: f }, { kind: 'edificio', tipo: 'mulino' })
  stessaLista('anche `{ kind: \'edificio\', tipo }` arriva alla stessa cosa', murato, davanti)
  for (const [i, j] of fronte) f.bloccoFisso.add(chiave(i, j))           // un muro di alberi davanti
  const dopo = Mondo3d.prototype.celleDiServizio.call({ m: f }, { kind: 'cosa', id: c.id })
  controlla('murato davanti, ci si arriva da un altro lato', dopo.length > 0 && dopo.every(([i, j]) => f.libera(i, j)) && dopo.every(([i, j]) => j !== c.j + 3))
}

/* ══════════ 5. le parole ══════════ */
controlla('il rifiuto di mettere via una macchina che lavora è chiaro, e non dice di spostarla', /Finisci prima/.test(dettoDi('macchina-al-lavoro')))
controlla('«ce n\'è già uno» e «costruisci prima» ci sono', /già/.test(dettoDi('gia-tuo')) && /Costruisci prima/.test(dettoDi('non-tua')))
controlla('non esiste più il motivo del lotto', dettoDi('lotto-non-tuo') === 'Non si può')

riassunto('Fattoria 3D — gli edifici liberi nella scena')
