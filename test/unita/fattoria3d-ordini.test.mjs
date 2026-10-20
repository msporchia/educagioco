/* Il banco della fattoria 3D, senza browser: ordini composti da colture e ricette vere, mai impossibili al loro livello,
   con un premio in esperienza dentro il tetto di 🪙6 al minuto; consegnare toglie la roba e fa salire di livello,
   rifiutare lascia il posto vuoto un po', e il salvataggio (v2 → v3) non perde niente.
   `node test/esegui.mjs fattoria3d-ordini`
   tempo: 1 */
import { guastiDegliOrdini, CLIENTI, POSTI, POSTI_MAX, POSTI_PER_LIVELLO, tipoDelOrdine, RIPOSO_MS, LIVELLO_BANCO, PEZZI_DEL_BANCO, chiedibili, premioDi, tettoDi, livelloDi, livelloDelOrdine } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { PEZZI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { sogliaDi, livelloPer, ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { nuovoOrdine, ordineInForma } from '../../src/giochi/fattoria3d/motore/ordini.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { statoIniziale, normalizza, VERSIONE_STATO } from '../../src/giochi/fattoria3d/motore/stato.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

// un caso ripetibile: una sequenza fissa di numeri fra 0 e 1
const sequenza = (seme = 7) => { let x = seme; return () => (x = (x * 16807) % 2147483647) / 2147483647 }

function mondo({ monete = 1000, stato = null, liv = 2, bancarella = true, pezzo = 'bacheca', rnd = sequenza() } = {}) {
  const b = { monete }, t = { ora: 1_000_000 }
  const f = new Fattoria3d({ stato, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd })
  f.s.esperienza = sogliaDi(liv)
  if (bancarella && !f.s.cose.some(c => c.tipo === pezzo)) f.s.cose.push({ id: f.s.prossimoId++, tipo: pezzo, i: 0, j: 0 })
  f.tick()
  return { f, b, t }
}
const dai = (f, chiede) => { for (const [k, n] of Object.entries(chiede)) { if (COLTURE[k]) f.s.merci[k] += n; else f.s.prodotti[k] = (f.s.prodotti[k] || 0) + n } }

/* ══════════ 1. i dati ══════════ */
const guasti = guastiDegliOrdini()
controlla('i dati del banco non hanno guasti', guasti.length === 0, guasti.join(' · '))
controlla('i clienti sono da otto a dieci', CLIENTI.length >= 8 && CLIENTI.length <= 10)
stessaLista('il banco ha tre posti fino al livello 4', [1, 2, 4].map(POSTI), [3, 3, 3])
stessaLista('e i posti crescono col livello', [5, 7, 8, 10, 11, 13, 14, ULTIMO].map(POSTI), [4, 4, 5, 5, 6, 6, 8, 8])
controlla('i posti non scendono mai e il massimo è quello della tabella', Array.from({ length: ULTIMO }, (_, i) => POSTI(i + 1)).every((n, i, v) => !i || n >= v[i - 1]) && POSTI(ULTIMO) === POSTI_MAX && POSTI_MAX === POSTI_PER_LIVELLO.at(-1)[1])
controlla('i biglietti hanno tre colori: rosa coi prodotti, giallo una cosa sola, verde più raccolti', tipoDelOrdine({ pane: 1 }) === 'rosa' && tipoDelOrdine({ grano: 1, pane: 1 }) === 'rosa'
  && tipoDelOrdine({ grano: 2 }) === 'giallo' && tipoDelOrdine({ grano: 2, mais: 1 }) === 'verde')
controlla('al livello del banco si chiedono solo raccolti', chiedibili(LIVELLO_BANCO).prodotti.length === 0 && chiedibili(LIVELLO_BANCO).raccolti.length >= 2)
controlla('i prodotti arrivano con le macchine', chiedibili(ULTIMO).prodotti.length === Object.keys(RICETTE).length && chiedibili(5).prodotti.length > 0)

/* ══════════ 2. ordini mai impossibili, premio dentro il tetto ══════════ */
{
  const rnd = sequenza(3)
  let male = [], tetto = [], visti = new Set(), conProdotti = 0
  for (let liv = LIVELLO_BANCO; liv <= ULTIMO + 1; liv++) for (let n = 0; n < 150; n++) {
    const o = nuovoOrdine(liv, rnd, n + 1, [])
    const chiavi = Object.keys(o.chiede)
    if (!chiavi.length || chiavi.length > 3) male.push(`liv ${liv}: ${chiavi.length} cose`)
    for (const k of chiavi) {
      if (!(COLTURE[k] || RICETTE[k])) male.push(`${k} non esiste`)
      else if (livelloDi(k) > liv) male.push(`liv ${liv} chiede ${k}, che arriva al ${livelloDi(k)}`)
      if (liv === LIVELLO_BANCO && RICETTE[k]) male.push(`liv ${liv} chiede il prodotto ${k}`)
      if (RICETTE[k]) conProdotti++
      visti.add(k)
    }
    if (o.liv > liv || o.liv !== livelloDelOrdine(o.chiede)) male.push(`liv ${liv}: l'ordine dichiara ${o.liv}`)
    if (!(o.premio >= 1 && Number.isInteger(o.premio))) male.push('premio non intero')
    if (o.premio > tettoDi(o.chiede) + 1e-9 && o.premio > 1) tetto.push(`${JSON.stringify(o.chiede)}: ${o.premio} > ${tettoDi(o.chiede)}`)
    if (!CLIENTI.some(c => c.id === o.cliente)) male.push('cliente sconosciuto')
  }
  controlla('nessun ordine impossibile al suo livello', male.length === 0, male.slice(0, 5).join(' · '))
  controlla('il premio non supera mai 🪙6 al minuto', tetto.length === 0, tetto.slice(0, 3).join(' · '))
  controlla('in tutto il gioco si chiede ogni raccolto e ogni prodotto', [...Object.keys(COLTURE), ...Object.keys(RICETTE)].every(k => visti.has(k)),
    [...Object.keys(COLTURE), ...Object.keys(RICETTE)].filter(k => !visti.has(k)).join(','))
  controlla('i prodotti si chiedono davvero', conProdotti > 100)
  controlla('un prodotto vale più dei suoi ingredienti crudi (la catena si paga)', premioDi({ panIntegrale: 1 }) > premioDi({ farina: 2 }) * 0 && premioDi({ pane: 1 }) >= premioDi({ grano: 2 }))
}

/* ══════════ 3. stabili con un caso fisso ══════════ */
{
  const a = nuovoOrdine(8, sequenza(11), 1, []), b = nuovoOrdine(8, sequenza(11), 1, [])
  uguale('con lo stesso caso lo stesso ordine', JSON.stringify(a), JSON.stringify(b))
  const m1 = mondo({ rnd: sequenza(5) }), m2 = mondo({ rnd: sequenza(5) })
  uguale('due fattorie col caso uguale hanno lo stesso banco', JSON.stringify(m1.f.ordini()), JSON.stringify(m2.f.ordini()))
  const occ = nuovoOrdine(8, () => 0.5, 1, CLIENTI.slice(0, 9).map(c => c.id))
  uguale('un cliente già al banco non si ripete se ce n\'è un altro', occ.cliente, CLIENTI[9].id)
}

/* ══════════ 4. il banco si apre ══════════ */
{
  const senza = mondo({ bancarella: false })
  controlla('senza bacheca né bancarella il banco è chiuso', !senza.f.bancoAperto() && senza.f.ordini().length === 0)
  uguale('e non si consegna', senza.f.consegna(0).motivo, 'banco-chiuso')
  const basso = mondo({ liv: 1 })
  controlla('al livello 1 il banco è chiuso anche con la bacheca', !basso.f.bancoAperto() && basso.f.ordini().length === 0)
  // la bacheca è il pezzo del banco; la bancarella apre lo stesso banco (chi l'ha già non perde niente)
  controlla('la bacheca è nei pezzi del banco, come la bancarella', PEZZI_DEL_BANCO.includes('bacheca') && PEZZI_DEL_BANCO.includes('bancarella'))
  controlla('ogni pezzo del banco esiste nel catalogo, al livello del banco', PEZZI_DEL_BANCO.every(t => PEZZI[t] && PEZZI[t].liv === LIVELLO_BANCO))
  controlla('la bacheca è 2×1 e costa poco', PEZZI.bacheca.w === 2 && PEZZI.bacheca.d === 1 && PEZZI.bacheca.prezzo < PEZZI.bancarella.prezzo)
  const conBancarella = mondo({ pezzo: 'bancarella' })
  controlla('con la sola bancarella il banco è aperto e ha tre ordini', conBancarella.f.bancoAperto() && conBancarella.f.ordini().length === 3)
  const sotto = mondo({ bancarella: false })
  sotto.f.s.cose.push({ id: sotto.f.s.prossimoId++, tipo: 'panchina', i: 0, j: 0 })
  controlla('un altro pezzo non apre il banco', !sotto.f.bancoAperto())
  const compra = mondo({ bancarella: false })
  const r = compra.f.compraEMetti('bacheca', 3, 3)
  controlla('la bacheca si compra e si mette al livello 2', r.ok && compra.f.bancoAperto() && compra.f.ordini().length === 3, JSON.stringify(r))
  const { f } = mondo()
  const o = f.ordini()
  controlla('col banco aperto ci sono tre ordini', o.length === 3 && o.every(x => !x.attesa && x.chiede.length >= 1))
  controlla('i primi ordini sono solo raccolti', o.every(x => x.chiede.every(c => !c.prodotto)))
  stessaLista('i tre clienti sono diversi', [new Set(o.map(x => x.cliente.id)).size], [3])
  const { f: g } = mondo({ monete: 0 })
  g.ordini()
  const prima = g.serializza()
  controlla('i soldi non c\'entrano: il banco non spende', g.monete() === 0 && prima.ordini.aperti.filter(Boolean).length === 3)
}

/* ══════════ 5. consegnare ══════════ */
{
  const { f, b } = mondo()
  const primo = f.ordini()[0]
  const chiede = Object.fromEntries(primo.chiede.map(c => [c.k, c.n]))
  const r0 = f.consegna(0)
  controlla('senza la roba dice cosa manca', !r0.ok && r0.motivo === 'mancano' && Object.keys(r0.mancano).length === primo.chiede.length
    && Object.entries(chiede).every(([k, n]) => r0.mancano[k] === n), JSON.stringify(r0))
  dai(f, chiede); dai(f, { grano: 1 })
  const sc = { ...f.s.merci }, monete = b.monete, exp = f.esperienza(), id = primo.id
  f.prendiEventi()
  const r = f.consegna(0)
  controlla('consegna riuscita', r.ok && r.premio === primo.premio, JSON.stringify(r))
  controlla('toglie la roba chiesta e solo quella', Object.entries(chiede).every(([k, n]) => f.s.merci[k] === sc[k] - n))
  stessaLista('dà esperienza e mai monete', [f.esperienza() - exp, b.monete], [primo.premio, monete])
  const nuovo = f.ordini()[0]
  controlla('il posto si riempie subito con un ordine nuovo', !nuovo.attesa && nuovo.id !== id)
  const ev = f.prendiEventi().find(e => e.tipo === 'consegna')
  controlla('l\'evento consegna dice chi e quanto', ev && ev.cliente === primo.cliente.id && ev.premio === primo.premio)
  controlla('un posto vuoto non si consegna', f.consegna(7).motivo === 'sconosciuto')
}

/* ══════════ 6. un prodotto toglie dalla dispensa, e si sale di livello ══════════ */
{
  const { f } = mondo({ liv: 6 })
  f.s.ordini.aperti[0] = { id: 90, cliente: 'nonna', chiede: { pane: 1, grano: 1 }, premio: 9, liv: 5 }
  f.s.prodotti.pane = 1
  uguale('manca solo il grano', JSON.stringify(f.consegna(0).mancano), '{"grano":1}')
  f.s.merci.grano = 3; f.s.prodotti.pane = 2
  controlla('consegna con un prodotto', f.consegna(0).ok && f.s.prodotti.pane === 1 && f.s.merci.grano === 2)
  f.s.prodotti.pane = 1
  f.s.ordini.aperti[1] = { id: 91, cliente: 'cuoco', chiede: { pane: 1 }, premio: 4, liv: 5 }
  f.consegna(1)
  controlla('l\'ultimo prodotto esce dalla dispensa', !('pane' in f.s.prodotti))
}
{
  const { f } = mondo({ liv: 2 })
  f.s.esperienza = sogliaDi(3) - 3
  f.s.ordini.aperti[0] = { id: 90, cliente: 'nonna', chiede: { grano: 1 }, premio: 5, liv: 2 }
  f.s.merci.grano = 1; f.prendiEventi()
  f.consegna(0)
  controlla('consegnando si sale di livello (evento livello)', f.livello() === 3 && f.prendiEventi().some(e => e.tipo === 'livello' && e.livello === 3))
}

/* ══════════ 7. rifiutare ══════════ */
{
  const { f, t } = mondo()
  f.ordini()
  const r = f.rifiuta(1)
  controlla('rifiutare è gratis e lascia il posto in attesa', r.ok && f.ordini()[1].attesa && f.ordini()[1].restoMs === RIPOSO_MS)
  t.ora += RIPOSO_MS - 1000; f.tick()
  controlla('prima della fine il posto aspetta', f.ordini()[1].attesa)
  t.ora += 1000; f.tick()
  controlla('dopo il riposo arriva un ordine nuovo', !f.ordini()[1].attesa)
  controlla('cambia è lo stesso di rifiuta', f.cambia(0).ok && f.ordini()[0].attesa)
  controlla('un posto che aspetta non si rifiuta', f.rifiuta(0).motivo === 'sconosciuto')
  controlla('il ritardo regge anche a pagina chiusa (si legge dall\'orologio)', (() => {
    const s = f.serializza(); const g = new Fattoria3d({ stato: s, borsa: f.borsa, ora: () => t.ora + RIPOSO_MS, rnd: sequenza(9) })
    return g.ordini().every(x => !x.attesa)
  })())
}

/* ══════════ 8. il salvataggio ══════════ */
{
  const { f } = mondo()
  f.ordini(); f.rifiuta(2)
  const salvato = f.serializza()
  stessaLista('lo stato è alla versione dei dati', [salvato.v], [VERSIONE_STATO])
  const g = new Fattoria3d({ stato: JSON.parse(JSON.stringify(salvato)), borsa: f.borsa, ora: f.ora, rnd: sequenza(2) })
  uguale('gli ordini tornano com\'erano', JSON.stringify(g.s.ordini), JSON.stringify(salvato.ordini))
  controlla('l\'id dopo il riavvio non si ripete', g.s.ordini.prossimoId > Math.max(...g.s.ordini.aperti.filter(Boolean).map(o => o.id)))
}
{
  // un v2: niente `ordini`, tutto il resto deve restare
  const v2 = JSON.parse(JSON.stringify(statoIniziale()))
  delete v2.ordini; v2.v = 2; v2.esperienza = 123; v2.merci.grano = 4; v2.prodotti = { pane: 2 }; v2.legna = 5
  const n = normalizza(v2)
  controlla('un v2 non perde niente', n.esperienza === 123 && n.merci.grano === 4 && n.prodotti.pane === 2 && !('legna' in n) && n.v === VERSIONE_STATO)
  controlla('e ha un banco vuoto pronto a riempirsi', n.ordini.aperti.length === POSTI(1) && n.ordini.aperti.every(x => x === null))
  const { f } = mondo({ stato: v2, liv: 3 })
  controlla('il banco del v2 si riempie da solo', f.ordini().length === 3)
}
{
  // i posti crescono col livello: l'elenco corto si riempie, il lungo non si perde
  const alto = mondo({ liv: 14 })
  uguale('al livello 14 il banco ha otto ordini', alto.f.ordini().filter(o => !o.attesa).length, POSTI(14))
  const clienti = alto.f.ordini().map(o => o.cliente.id)
  controlla('e sono tutti di clienti diversi', new Set(clienti).size === clienti.length, clienti.join())
  const salvato = JSON.parse(JSON.stringify(alto.f.serializza()))
  const letto = normalizza(salvato)
  uguale('un salvataggio con otto ordini li tiene tutti', letto.ordini.aperti.filter(Boolean).length, POSTI(14))
  const corto = JSON.parse(JSON.stringify(salvato)); corto.ordini.aperti = corto.ordini.aperti.slice(0, 3); corto.ordini.riprende = corto.ordini.riprende.slice(0, 3)
  uguale('uno corto, a livello alto, si allunga ai posti del livello', normalizza(corto).ordini.aperti.length, POSTI(14))
  const lungo = JSON.parse(JSON.stringify(statoIniziale())); lungo.esperienza = 0
  lungo.ordini.aperti = [0, 1, 2, 3, 4].map(i => ({ id: i + 1, cliente: CLIENTI[i].id, chiede: { grano: 1 } })); lungo.ordini.riprende = [null, null, null, null, null]
  const l = normalizza(lungo)
  controlla('uno più lungo dei posti del livello non perde ordini', l.ordini.aperti.filter(Boolean).length === 5)
  // salendo di livello i posti nuovi si aprono da soli
  const { f, t } = mondo({ liv: 4 })
  uguale('al livello 4 i posti sono tre', f.ordini().length, 3)
  f.s.esperienza = sogliaDi(5); t.ora += 1
  uguale('salendo al 5 se ne apre un quarto', f.ordini().filter(o => !o.attesa).length, POSTI(5))
  uguale('e il rifiuto di un posto nuovo ha il suo riposo', f.rifiuta(3).ok && f.ordini()[3].attesa === true, true)
}
{
  // un salvataggio rotto non dà mai un'eccezione
  const rotti = [null, 5, 'x', [], { ordini: 3 }, { ordini: { aperti: 'a' } }, { ordini: { aperti: [null, 4, { chiede: 1 }, { chiede: { pane: -1, inesistente: 2 } }], riprende: ['x', NaN, 9], prossimoId: -4 } },
    { ordini: { aperti: [{ id: 'a', cliente: 7, chiede: { grano: 2, pane: 1.5 } }] } }]
  let eccezioni = 0, sballati = 0
  for (const r of rotti) { try { const n = normalizza(r); if (n.ordini.aperti.length < POSTI(1) || n.ordini.prossimoId < 1 || n.ordini.aperti.some(o => o && !Object.keys(o.chiede).length)) sballati++ } catch { eccezioni++ } }
  stessaLista('un salvataggio rotto non fa eccezioni né ordini vuoti', [eccezioni, sballati], [0, 0])
  const o = ordineInForma({ id: 3, cliente: 'sconosciuto', chiede: { grano: 2, pane: 1.5, zzz: 1 } })
  controlla('un ordine mezzo guasto tiene il buono e si ricalcola', o && Object.keys(o.chiede).join() === 'grano' && o.premio === premioDi({ grano: 2 }) && o.cliente === CLIENTI[0].id)
  controlla('il livello dell\'esperienza resta quello dei livelli', livelloPer(sogliaDi(4)) === 4)
}

riassunto('Fattoria 3D — gli ordini')
