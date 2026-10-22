/* I vicini della fattoria 3D, senza browser: lo snapshot di una fattoria visitabile (formato, normalizzazione che non si fida di
   niente), i quattro villaggi del computer, le regole di una visita a orologio finto (cassa, mercato che vende e che compra, rifiuti
   con il motivo), lo stato dei vicini che si salva a parte, la scena di sola lettura che nasce dallo snapshot, e l'esportazione della
   fattoria di chi gioca (oggi non la usa nessuno: domani la userà la visita di un amico). Docs: docs/fattoria3d/vicini.md.
   `node test/esegui.mjs fattoria3d-vicini`
   tempo: 1 */
import { VICINI, VERSIONE_VISITA, normalizzaFattoriaVisitabile, guastiDeiVicini, vicinoPerId, POSTO_CASSA, POSTO_MERCATO, MISURE_POSTI,
         premioMassimo, donoMassimo, prezzoMinimo, livelloDellaMerce, FACCE, QUANTI_MAX } from '../../src/giochi/fattoria3d/dati/vicini.js'
import { Vicini, normalizzaVicini, statoVicini, motoreDiVisita, esportaLaMiaFattoria, VOLTE_PER_BARATTO } from '../../src/giochi/fattoria3d/motore/vicini.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { PEZZI, EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { sogliaDi, livelloDelPezzo } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { premioDi, tettoDi } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { PARTENZA, lottoDi, dentro } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* una fattoria di casa, con le monete e l'orologio in mano; `liv` la porta a quel livello */
function casa({ monete = 500, liv = 25 } = {}) {
  const b = { monete }, t = { ora: 1_000_000 }
  const m = new Fattoria3d({ stato: null, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
  m.s.esperienza = sogliaDi(liv)
  const v = new Vicini({ motore: m })
  const dai = (k, n) => { if (COLTURE[k]) m.s.merci[k] += n; else m.s.prodotti[k] = (m.s.prodotti[k] || 0) + n }
  return { m, b, t, v, dai }
}
const rita = vicinoPerId('nonna-rita'), tonio = vicinoPerId('mugnaio-tonio')

/* ══════════ 1. i dati: i quattro villaggi ══════════ */
const guasti = guastiDeiVicini()
controlla('i villaggi non hanno guasti', guasti.length === 0, guasti.join(' · '))
uguale('i villaggi del computer sono quattro', VICINI.length, 4)
controlla('il livello d\'ingresso sale e comincia col trattore', VICINI.every((v, n) => n === 0 ? v.liv >= PEZZI.trattore.liv : v.liv > VICINI[n - 1].liv), VICINI.map(v => v.liv).join())
controlla('ogni villaggio ha la sua storia di due righe, col nome del vicino', VICINI.every(v => v.storia.length === 2 && v.proprietario.nome.length > 0))
controlla('ogni villaggio ha cassa, mercato che vende e mercato che compra', VICINI.every(v => v.cassa.chiede.length && v.mercato.vende.length && v.mercato.compra.length))
controlla('i villaggi sono composti con i pezzi veri del catalogo', VICINI.every(v => v.cose.length >= 5 && v.cose.every(c => PEZZI[c.tipo])))
controlla('le facce dei vicini sono nel font del gioco', VICINI.every(v => FACCE.includes(v.proprietario.emoji)))
controlla('lo snapshot dei villaggi è piccolo (sotto i 4 KB) e serializzabile', VICINI.every(v => JSON.stringify(v).length < 4000), VICINI.map(v => JSON.stringify(v).length).join())
controlla('un villaggio con un edificio ha i lotti dell\'edificio',
  tonio.lotti.includes('3_1') && vicinoPerId('villa-dolce').lotti.includes('1_3'))
controlla('il trattore è nel catalogo, di un livello che lascia entrare nel primo villaggio', !!PEZZI.trattore && livelloDelPezzo('trattore') === PEZZI.trattore.liv && !PEZZI.trattore.produttivo)

/* nessun baratto o dono vale più del banco (premio 0,5 del tetto): esperienza + metà in roba */
{
  let male = []
  for (const v of VICINI) {
    for (const b of v.mercato.compra) {
      const valore = tettoDi({ [b.k]: b.n }), potenziale = b.premio + 0.5 * (b.da ? b.da.n * tettoDi({ [b.da.k]: 1 }) : 0)
      if (potenziale > 0.5 * valore + 0.5) male.push(`${v.id} ${b.k}: ${potenziale.toFixed(1)} > ${(0.5 * valore).toFixed(1)}`)
    }
    for (const x of v.mercato.vende) if (x.prezzo < prezzoMinimo(x.k)) male.push(`${v.id} vende ${x.k} troppo a buon mercato`)
    const dono = v.cassa.dono, tot = v.cassa.chiede.reduce((n, c) => n + tettoDi({ [c.k]: c.n }), 0)
    if (dono && dono.n * tettoDi({ [dono.k]: 1 }) > 0.5 * tot + 1e-9) male.push(`${v.id}: il dono della cassa vale troppo`)
  }
  controlla('nessun baratto o dono rende più dell\'ordine al banco', male.length === 0, male.join(' · '))
}

/* ══════════ 2. la normalizzazione: non lancia mai, non si fida di niente ══════════ */
for (const brutto of [null, undefined, 0, 'ciao', [], {}, { v: 1 }, { v: 99, id: 'x' }, { v: 1, id: 'Brutto Id!' }, { v: 1, id: 'a'.repeat(40) }]) {
  let r, errore = null
  try { r = normalizzaFattoriaVisitabile(brutto) } catch (e) { errore = e }
  controlla(`un dato brutto non lancia e non è una fattoria (${JSON.stringify(brutto)})`, !errore && r === null)
}
controlla('uno snapshot di una versione più nuova non si legge', normalizzaFattoriaVisitabile({ ...rita, v: VERSIONE_VISITA + 1 }) === null)
{
  const n = normalizzaFattoriaVisitabile(JSON.parse(JSON.stringify(rita)))
  stessaLista('normalizzare due volte non cambia niente', normalizzaFattoriaVisitabile(n), n)
  stessaLista('uno snapshot mandato come testo e riletto è lo stesso', normalizzaFattoriaVisitabile(JSON.parse(JSON.stringify(n))), n)
}
{
  // dati ostili: numeri enormi, testi lunghi e con marcatori, emoji che il gioco non disegna, merci inventate, doni troppo grossi
  const ostile = normalizzaFattoriaVisitabile({
    v: 1, id: 'amico-1', nome: '<b>' + 'Nome lunghissimo '.repeat(10) + '</b>', proprietario: { nome: 'x'.repeat(100), emoji: '💣' },
    tema: 'boh', liv: 9999, storia: ['<script>alert(1)</script>', 'b', 'c', 'd'], lotti: ['0_0', 'finto', '3_3'], edifici: ['mulino', 'inventato'],
    cose: [{ tipo: 'campo', i: 0, j: 0, coltura: 'inventata', cresc: 99 }, { tipo: 'inventato', i: 0, j: 0 }, { tipo: 'recinto', i: 2, j: 0, pecore: 1e9 }, null, 7, { tipo: 'campo', i: 1000, j: 1000 }],
    posti: { cassa: { i: 1e6, j: 0 } },
    mercato: { vende: [{ k: 'grano', n: 1e9, prezzo: 0 }, { k: 'inventato', n: 1, prezzo: 1 }, { k: 'grano', n: 2, prezzo: 5 }], compra: [{ k: 'grano', n: 3, premio: 99999, da: { k: 'brioche', n: 500 } }, { k: 'carota', n: 3, premio: 0, da: { k: 'lavanda', n: 1 } }] },
    cassa: { chiede: [{ k: 'grano', n: 1e9 }, { k: 'x', n: 1 }, { k: 'mais', n: 2 }, { k: 'carota', n: 1 }, { k: 'pane', n: 1 }], dono: { k: 'brioche', n: 1000 } },
  })
  controlla('uno snapshot ostile si rimette in forma', !!ostile)
  controlla('il nome è tagliato e senza marcatori', ostile.nome.length <= 24 && !/[<>]/.test(ostile.nome) && ostile.proprietario.nome.length <= 16)
  controlla('un\'emoji che il gioco non disegna diventa la faccia di serie', FACCE.includes(ostile.proprietario.emoji))
  controlla('la storia di un altro è al più di due righe e senza marcatori', ostile.storia.length <= 2 && ostile.storia.every(r => !/[<>]/.test(r)))
  controlla('il livello e il tema sono sani', ostile.liv <= 99 && ['orto', 'mulino', 'pecore', 'frutteto', 'misto'].includes(ostile.tema))
  controlla('i lotti sono solo quelli veri, con il quadrato di partenza e quello dell\'edificio', ostile.lotti.includes('3_3') && ostile.lotti.includes('3_1') && !ostile.lotti.includes('finto') && ostile.lotti.length >= 9)
  controlla('gli edifici sono solo quelli veri (un nome solo sta al suo posto di una volta)', stessaLista('', ostile.edifici, [{ tipo: 'mulino', i: -2, j: -7 }]))
  controlla('le cose sono solo del catalogo, dentro i lotti', ostile.cose.every(c => PEZZI[c.tipo] && lottoDi(c.i, c.j)), JSON.stringify(ostile.cose))
  controlla('la coltura e la crescita sono sane', ostile.cose.filter(c => c.tipo === 'campo').every(c => COLTURE[c.coltura] && c.cresc >= 0 && c.cresc <= 1))
  controlla('le pecore sono al più quattro', ostile.cose.filter(c => c.tipo === 'recinto').every(c => c.pecore >= 1 && c.pecore <= 4))
  controlla('il posto detto fuori dai lotti torna quello di serie', stessaLista('', ostile.posti.cassa, POSTO_CASSA))
  controlla('il mercato non vende cose inventate né due volte la stessa, e non regala', ostile.mercato.vende.length === 1 && ostile.mercato.vende[0].k === 'grano'
    && ostile.mercato.vende[0].n <= QUANTI_MAX && ostile.mercato.vende[0].prezzo >= prezzoMinimo('grano'), JSON.stringify(ostile.mercato.vende))
  const b0 = ostile.mercato.compra[0]
  controlla('il premio di un baratto si ricalcola dalle regole, mai sopra il massimo', b0.premio <= premioMassimo('grano', 3) && b0.premio >= 1)
  controlla('un dono troppo grosso si scarta (brioche vale più di metà del baratto)', b0.da === null, JSON.stringify(b0))
  controlla('un premio a zero sale a 1; un dono che ci sta si tiene', ostile.mercato.compra[1].premio >= 1)
  uguale('la cassa chiede al più tre cose, senza inventate', ostile.cassa.chiede.length, 3)
  controlla('le quantità sono tenute sotto il tetto', ostile.cassa.chiede.every(c => c.n >= 1 && c.n <= QUANTI_MAX))
  controlla('un dono di cassa troppo grosso si scarta', ostile.cassa.dono === null)
}

/* ══════════ 3. lo stato dei vicini: a parte, mai un'eccezione ══════════ */
{
  for (const brutto of [null, 'ciao', 3, [], { visite: 'x', cassa: 4, mercato: [] }, { visite: { a: -3, b: 'x', c: 2.7 } }]) {
    let r, errore = null
    try { r = normalizzaVicini(brutto) } catch (e) { errore = e }
    controlla(`uno stato dei vicini brutto si rimette in forma (${JSON.stringify(brutto)})`, !errore && r && r.v === 1 && typeof r.visite === 'object')
  }
  stessaLista('uno stato vuoto è quello iniziale', normalizzaVicini(null), statoVicini())
  uguale('i contatori sono interi e positivi', normalizzaVicini({ visite: { a: 2.7, b: -1, c: 'x' } }).visite.a, 2)
  controlla('un contatore negativo o non numerico sparisce', Object.keys(normalizzaVicini({ visite: { a: 2.7, b: -1, c: 'x' } }).visite).join() === 'a')
}

/* ══════════ 4. entrare ══════════ */
{
  const { m, v } = casa({ liv: 5 })
  const r = v.entra('nonna-rita')
  controlla('sotto il livello d\'ingresso non si entra, e il rifiuto dice il livello', !r.ok && r.motivo === 'non-sbloccato' && r.liv === rita.liv, JSON.stringify(r))
  uguale('una visita rifiutata non si conta', v.serializza().visite['nonna-rita'], undefined)
  controlla('un villaggio sconosciuto si rifiuta', v.entra('boh').motivo === 'sconosciuto')
  controlla('la mappa dice quali si possono visitare', v.elenco().every(x => x.aperto === (x.liv <= m.livello())) && v.elenco()[0].id === 'nonna-rita')
}
{
  const { m, v } = casa({ liv: rita.liv })
  const r = v.entra('nonna-rita'); v.entra('nonna-rita')
  controlla('al livello giusto si entra e si riceve lo snapshot', r.ok && r.fattoria.id === 'nonna-rita')
  uguale('ogni entrata è una visita', v.serializza().visite['nonna-rita'], 2)
  uguale('e un evento per i contatori', m.prendiEventi().filter(e => e.tipo === 'visita').length, 2)
  controlla('i villaggi più avanti sono ancora grigi', v.elenco().filter(x => x.aperto).length === 1)
}

/* ══════════ 5. la cassa ══════════ */
{
  const { m, b, t, v, dai } = casa({ liv: 25 })
  const xp0 = m.esperienza(), mon0 = b.monete
  controlla('senza roba la cassa rifiuta e dice cosa manca', (() => { const r = v.aiuta('nonna-rita', 'grano'); return !r.ok && r.motivo === 'mancano' && r.mancano.grano === 4 })())
  controlla('una merce che non chiede si rifiuta', v.aiuta('nonna-rita', 'lavanda').motivo === 'non-chiesto')
  controlla('un villaggio sconosciuto si rifiuta', v.aiuta('boh', 'grano').motivo === 'sconosciuto')
  uguale('un rifiuto non cambia niente: esperienza', m.esperienza(), xp0)
  dai('grano', 3)
  let r = v.aiuta('nonna-rita', 'grano')
  controlla('si consegna quel che c\'è, anche se non basta', r.ok && r.n === 3 && !r.completa && r.premio === premioDi({ grano: 3 }), JSON.stringify(r))
  uguale('le scorte scendono', m.s.merci.grano, 0)
  uguale('l\'esperienza sale del premio', m.esperienza(), xp0 + r.premio)
  uguale('le monete non si toccano mai', b.monete, mon0)
  dai('grano', 5)
  r = v.aiuta('nonna-rita', 'grano')
  controlla('non si dà più di quanto la cassa chiede', r.ok && r.n === 1 && m.s.merci.grano === 4, JSON.stringify(r))
  controlla('una voce già piena si rifiuta', v.aiuta('nonna-rita', 'grano').motivo === 'gia-pronto')
  dai('carota', 3); dai('mais', 2)
  const sc = v.scheda('nonna-rita')
  controlla('la scheda dice a che punto è la cassa', sc.cassa.righe.find(x => x.k === 'grano').finita && !sc.cassa.righe.find(x => x.k === 'carota').finita && sc.cassa.righe.find(x => x.k === 'carota').puoi)
  v.aiuta('nonna-rita', 'carota')
  const dono0 = m.scortaDi(rita.cassa.dono.k)           // il dono di Rita è un raccolto (non più l'uovo: vale due becchimi)
  r = v.aiuta('nonna-rita', 'mais')
  controlla('l\'ultima consegna chiude la cassa e dà il dono del vicino', r.ok && r.completa && r.dono && r.dono.k === rita.cassa.dono.k && m.scortaDi(r.dono.k) === dono0 + r.dono.n, JSON.stringify(r))
  controlla('la cassa piena si rifiuta e dice quando riapre', (() => { dai('grano', 1); const x = v.aiuta('nonna-rita', 'grano'); return !x.ok && x.motivo === 'cassa-piena' && x.restoMs > 0 })())
  uguale('le monete restano quelle anche a cassa piena', b.monete, mon0)
  t.ora += rita.cassa.rinnovoMs - 1
  controlla('un attimo prima del rinnovo è ancora piena', v.aiuta('nonna-rita', 'grano').motivo === 'cassa-piena')
  t.ora += 2
  controlla('passato il tempo riapre, vuota', v.cassaAperta('nonna-rita') && v.aiuta('nonna-rita', 'grano').ok)
  const eventi = m.prendiEventi()
  controlla('ogni consegna è un aiuto per i contatori, e la cassa piena è un evento', eventi.filter(e => e.tipo === 'aiuto' && e.come === 'cassa').length >= 5 && eventi.some(e => e.tipo === 'cassa-piena'))
  // lo stato si salva e si rilegge, anche dopo il riavvio: il tempo è dell'orologio
  const salvato = JSON.parse(JSON.stringify(v.serializza()))
  const v2 = new Vicini({ motore: m, stato: salvato })
  controlla('lo stato riletto è lo stesso', JSON.stringify(v2.serializza()) === JSON.stringify(v.serializza()))
}
{
  // la cassa piena resta piena a pagina chiusa e riapre da sola
  const { m, t, v, dai } = casa({ liv: 25 })
  for (const c of rita.cassa.chiede) { dai(c.k, c.n); v.aiuta('nonna-rita', c.k) }
  controlla('riempita in una volta sola la cassa si chiude', !v.cassaAperta('nonna-rita'))
  const v2 = new Vicini({ motore: m, stato: v.serializza() })
  controlla('riletta, la cassa è ancora piena', !v2.cassaAperta('nonna-rita'))
  t.ora += rita.cassa.rinnovoMs + 1
  controlla('e riapre col tempo', v2.cassaAperta('nonna-rita'))
}

/* ══════════ 6. il mercato: comprare ══════════ */
{
  const { m, b, t, v } = casa({ liv: 25, monete: 5000 })
  const voce = rita.mercato.vende[0], xp0 = m.esperienza()
  let r = v.compra('nonna-rita', voce.k, 2)
  controlla('si compra al prezzo scritto sul banco, per pezzo', r.ok && r.n === 2 && r.costo === voce.prezzo * 2 && b.monete === 5000 - voce.prezzo * 2, JSON.stringify(r))
  uguale('la roba finisce nelle scorte', m.scortaDi(voce.k), 2)
  uguale('comprare non è esperienza (le monete cambiano forma, non si creano)', m.esperienza(), xp0)
  r = v.compra('nonna-rita', voce.k, 99)
  uguale('non si compra più di quel che c\'è sul banco', r.n, voce.n - 2)
  controlla('finito, il banco lo dice e dice quando torna', (() => { const x = v.compra('nonna-rita', voce.k); return !x.ok && x.motivo === 'esaurito' && x.restoMs > 0 })())
  t.ora += rita.mercato.rinnovoMs + 1
  controlla('dopo il rinnovo si ricompra', v.compra('nonna-rita', voce.k).ok)
  b.monete = 1
  const prima = m.scortaDi(rita.mercato.vende[1].k)
  r = v.compra('nonna-rita', rita.mercato.vende[1].k)
  controlla('senza monete rifiuta, dice il costo e quanto manca, e non cambia niente', !r.ok && r.motivo === 'poche-monete' && r.costo > 1 && r.mancano === r.costo - 1 && b.monete === 1 && m.scortaDi(rita.mercato.vende[1].k) === prima, JSON.stringify(r))
  controlla('una cosa che non vende si rifiuta', v.compra('nonna-rita', 'lavanda').motivo === 'non-venduto')
  controlla('un villaggio ancora chiuso si rifiuta', (() => { const c = casa({ liv: 5 }); return c.v.compra('nonna-rita', voce.k).motivo === 'non-sbloccato' })())
}

/* ══════════ 7. il mercato: vendere (mai monete) ══════════ */
{
  const { m, b, t, v, dai } = casa({ liv: 25 })
  const b0 = rita.mercato.compra[0], mon0 = b.monete, xp0 = m.esperienza()
  let r = v.vendi('nonna-rita', 0)
  controlla('senza la roba rifiuta e dice quanto manca', !r.ok && r.motivo === 'mancano' && r.mancano[b0.k] === b0.n, JSON.stringify(r))
  dai(b0.k, b0.n * 3)
  const uova0 = m.scortaDi(b0.da.k)
  r = v.vendi('nonna-rita', 0)
  controlla('un baratto toglie la roba, dà esperienza e la roba del vicino', r.ok && m.scortaDi(b0.k) === b0.n * 2 && m.esperienza() === xp0 + b0.premio && m.scortaDi(b0.da.k) === uova0 + b0.da.n, JSON.stringify(r))
  uguale('vendere non dà monete', b.monete, mon0)
  r = v.vendi('nonna-rita', 0)
  controlla('lo stesso baratto si fa due volte', r.ok)
  controlla('alla terza il vicino aspetta e dice quando', (() => { const x = v.vendi('nonna-rita', 0); return !x.ok && x.motivo === 'esaurito' && x.restoMs > 0 })())
  uguale('le volte sono due', VOLTE_PER_BARATTO, 2)
  t.ora += rita.mercato.rinnovoMs + 1
  dai(b0.k, b0.n)
  controlla('rinnovato il banco, il baratto riparte', v.vendi('nonna-rita', 0).ok)
  controlla('un baratto che non c\'è si rifiuta', v.vendi('nonna-rita', 9).motivo === 'non-comprato')
  const sc = v.scheda('nonna-rita')
  controlla('la scheda mostra i baratti con quanto manca', sc.mercato.compra.length === rita.mercato.compra.length && sc.mercato.compra.every(x => typeof x.puoi === 'boolean' && x.rimasti >= 0))
}

/* ══════════ 8. la scena di una visita: un motore di sola lettura dallo snapshot ══════════ */
for (const f of VICINI) {
  const m = motoreDiVisita(f)
  controlla(`${f.id}: il motore della visita è di sola lettura`, m.soloLettura === true)
  uguale(`${f.id}: nessuna moneta`, m.monete(), 0)
  // niente si sovrappone: tante celle occupate quante ne dicono le misure
  let atteso = 0, occupate = 0
  for (const c of f.cose) { const d = PEZZI[c.tipo]; atteso += d.w * d.d }
  for (const e of f.edifici) atteso += EDIFICI[e.tipo].w * EDIFICI[e.tipo].d
  for (let j = -24; j < 24; j++) for (let i = -24; i < 24; i++) if (dentro(i, j) && m.cosaSu(i, j)) occupate++
  uguale(`${f.id}: nessuna cosa sopra un'altra`, occupate, atteso)
  uguale(`${f.id}: tante cose quante ne dice lo snapshot (gli edifici sono cose)`, m.cose.length, f.cose.length + f.edifici.length)
  controlla(`${f.id}: dentro la sua terra niente alberi né sassi che si sovrappongano`, m.alberiNelTerreno().length === 0 && m.ostacoliNelTerreno().length === 0)
  controlla(`${f.id}: gli edifici sono quelli dello snapshot, tutti posseduti`, Object.keys(EDIFICI).every(t => !!m.s.posseduti[t] === f.edifici.some(e => e.tipo === t)))
  controlla(`${f.id}: i lotti sono quelli dello snapshot`, Object.keys(m.s.lotti).sort().join() === [...f.lotti].sort().join())
  // la cassa e il banco sono due ostacoli: niente ci passa sopra, ma si arriva a servirli
  const cella = [Math.floor(PARTENZA.x), Math.floor(PARTENZA.z)]
  for (const [nome, p] of Object.entries(f.posti)) {
    const d = MISURE_POSTI[nome], intorno = []
    for (let a = -1; a <= d.w; a++) for (let b = -1; b <= d.d; b++) if (a < 0 || a >= d.w || b < 0 || b >= d.d) intorno.push([p.i + a, p.j + b])
    controlla(`${f.id}: la ${nome} blocca le sue celle`, !m.libera(p.i, p.j))
    controlla(`${f.id}: la ${nome} ha una cella libera attorno e il visitatore ci arriva dalla partenza`, !!m.percorsoVerso(cella, intorno.filter(([i, j]) => m.libera(i, j))))
    controlla(`${f.id}: la ${nome} sta nella terra del vicino`, d && lottoDi(p.i, p.j) && f.lotti.includes(lottoDi(p.i, p.j).id))
  }
  // ogni edificio si raggiunge dal davanti
  for (const { tipo: t, i: ei, j: ej } of f.edifici) {
    const e = EDIFICI[t], davanti = []
    for (let a = 0; a < e.w; a++) davanti.push([ei + a, ej + e.d])
    controlla(`${f.id}: il ${t} sta dove dice lo snapshot e si raggiunge`, !!m.cosaSu(ei, ej) && m.cosaSu(ei, ej).tipo === t && !!m.percorsoVerso(cella, davanti.filter(([i, j]) => m.libera(i, j))))
  }
  controlla(`${f.id}: la partenza è libera`, m.libera(cella[0], cella[1]))
  // i campi: l'età è la crescita dello snapshot, e l'orologio non va avanti (niente scade in una visita)
  for (const c of f.cose.filter(x => x.tipo === 'campo')) {
    const cosa = m.cose.find(x => x.tipo === 'campo' && x.i === c.i && x.j === c.j)
    controlla(`${f.id}: il campo in ${c.i},${c.j} cresce quanto dice lo snapshot`, Math.abs(m.crescita(cosa)[0] - c.cresc) < 0.01, `${m.crescita(cosa)[0]} invece di ${c.cresc}`)
  }
  const prima = JSON.stringify(m.s.cose)
  m.tick()
  uguale(`${f.id}: il tempo non cambia la scena`, JSON.stringify(m.s.cose), prima)
}

/* ══════════ 9. la fattoria di chi gioca diventa uno snapshot (per domani) ══════════ */
{
  const { m, v, dai } = casa({ liv: 25, monete: 5000 })
  const postoDelMulino = mm => { for (let j = 1; j < 8; j++) for (let i = -6; i < 6; i++) if (mm.puoMettere('mulino', i, j).ok && mm.puoMettere('campo', 2, 2).ok && !(i < 5 && i + 3 > 2 && j < 4 && j + 3 > 2) && !(i < 6 && i + 3 > 3 && j < 5 && j + 3 > 4)) return [i, j]; return [0, 0] }
  // una fattoria con qualche cosa
  for (const o of m.ostacoli) if (!o.tolto) m._togliSenzaPagare(o)
  m.compraLotto('3_1'); m.compraPezzo('campo'); m.compraEdificio('mulino', ...postoDelMulino(m))      // il mulino sta dove l'ha messo chi gioca (non al suo posto di una volta)
  m.mettiPezzo('campo', 2, 2); m.mettiPezzo('aiuola', 3, 4)
  dai('grano', 5)
  const prima = JSON.stringify(m.serializza())
  const snap = esportaLaMiaFattoria(m, { id: 'amico-test', nome: 'La fattoria di prova', proprietario: { nome: 'Prova', emoji: '👵' } })
  uguale('esportare non cambia la fattoria di chi gioca', JSON.stringify(m.serializza()), prima)
  controlla('lo snapshot esportato è uno snapshot valido e stabile', !!snap && stessaLista('', normalizzaFattoriaVisitabile(JSON.parse(JSON.stringify(snap))), snap))
  controlla('porta le cose, i lotti e gli edifici di chi gioca', snap.cose.length === m.s.cose.filter(c => PEZZI[c.tipo]).length && snap.lotti.length === Object.keys(m.s.lotti).length && snap.edifici.length === 1 && snap.edifici[0].tipo === 'mulino' && snap.edifici[0].j >= 1,
    `${snap && snap.cose.length}/${m.s.cose.length}`)
  controlla('porta il livello e un mercato e una cassa fatti con ciò che si fa a quel livello',
    snap.liv === 25 && snap.mercato.vende.length > 0 && snap.mercato.compra.length > 0 && snap.cassa.chiede.length > 0
    && [...snap.mercato.vende, ...snap.mercato.compra, ...snap.cassa.chiede].every(x => livelloDellaMerce(x.k) <= 25))
  controlla('lo snapshot è piccolo (sotto i 6 KB)', JSON.stringify(snap).length < 6000, String(JSON.stringify(snap).length))
  controlla('la cassa e il banco non stanno sopra una cosa', (() => {
    const mo = motoreDiVisita(snap); let occ = 0, att = 0
    for (const c of snap.cose) att += PEZZI[c.tipo].w * PEZZI[c.tipo].d
    for (const e of snap.edifici) att += EDIFICI[e.tipo].w * EDIFICI[e.tipo].d
    for (let j = -24; j < 24; j++) for (let i = -24; i < 24; i++) if (dentro(i, j) && mo.cosaSu(i, j)) occ++
    const cassa = snap.posti.cassa, mer = snap.posti.mercato
    return occ === att && !mo.cosaSu(cassa.i, cassa.j) && !mo.cosaSu(mer.i, mer.j)
  })())
  // gli edifici di un amico stanno dove li ha messi, anche in un posto che per i villaggi del computer non è mai stato di nessuno
  {
    const mo = motoreDiVisita(snap)
    const { i: mi, j: mj } = snap.edifici[0]
    controlla('nella visita il mulino sta dove l\'ha messo chi gioca', mo.cosaDi('mulino').i === mi && mo.cosaDi('mulino').j === mj && !mo.libera(mi + 1, mj + 1))
    const ostile = normalizzaFattoriaVisitabile({ ...JSON.parse(JSON.stringify(snap)), edifici: [{ tipo: 'mulino', i: 'x', j: 2 }, { tipo: 'mulino', i: 9, j: 9 }, { tipo: 'panificio', i: 1e9, j: 0 }, 'telaio', { tipo: 'inventato', i: 0, j: 0 }, null] })
    stessaLista('un edificio senza posto vero sta al suo posto di una volta, uno per tipo, e l\'inventato si scarta', ostile.edifici, [{ tipo: 'mulino', i: -2, j: -7 }, { tipo: 'panificio', i: -5, j: -7 }, { tipo: 'telaio', i: -9, j: -4 }])
    controlla('i lotti dell\'edificio sono suoi', ostile.lotti.includes(lottoDi(-2, -7).id) && ostile.lotti.includes(lottoDi(-9, -4).id))
  }
  // e una visita di un amico funziona come quella di un vicino del computer
  const altro = casa({ liv: 25 })
  controlla('un altro giocatore la aggiunge dai dati e la visita', !!altro.v.aggiungi(JSON.parse(JSON.stringify(snap))) && altro.v.entra('amico-test').ok)
  altro.dai('carota', 3)
  const voce = snap.cassa.chiede[0]
  altro.dai(voce.k, voce.n)
  controlla('e riempie la sua cassa', altro.v.aiuta('amico-test', voce.k).ok)
  controlla('senza id lo snapshot non si esporta', esportaLaMiaFattoria(m, {}) === null)
}

riassunto('Fattoria 3D — i vicini')
