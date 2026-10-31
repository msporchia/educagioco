/* La mongolfiera della fattoria 3D, la nave, senza browser: tre file di casse (una merce per fila) che si riempiono un po' alla volta,
   solo prodotti finiti e mai impossibili al livello, esperienza (mai monete) dentro il tetto di 🪙6 al minuto, bonus fila e tutto pieno,
   la sorpresa della fiera (un decoro nel magazzino), la partenza e il ritorno col riposo, lo stato vecchio che si legge.
   `node test/esegui.mjs fattoria3d-mongolfiera`
   tempo: 1 */
import {
  guastiDellaMongolfiera, FILE, FILE_MAX, fileAl, LIVELLO_QUARTA_FILA, CASSE_MIN, CASSE_MAX, PEZZI_MAX, RIPOSO_MS, SALITA_MS, BONUS_FILA, BONUS_TUTTO, SORPRESE, LIVELLO_MONGOLFIERA,
  merceDaCassa, merciDelLivello, fasiDi, pezziMaxAl, premioDellaCassa, bonusDellaFila, bonusDelTutto,
} from '../../src/giochi/fattoria3d/dati/mongolfiera.js'
import { nuovaStiva, stivaInForma, scegliLaSorpresa } from '../../src/giochi/fattoria3d/motore/mongolfiera.js'
import { livelloDi, tettoDi, MONETE_AL_MINUTO } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { EDIFICI, PEZZI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { sogliaDi, ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { LIVELLO_GRANDE as LIVELLO_GRANDE_2D } from '../../src/giochi/fattoria3d/da2d/dati/mongolfiera.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { normalizza, statoIniziale } from '../../src/giochi/fattoria3d/motore/stato.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const sequenza = (seme = 7) => { let x = seme; return () => (x = (x * 16807) % 2147483647) / 2147483647 }

/** Una fattoria al livello `liv` con la mongolfiera comprata; `t.ora` è l'orologio, `b.monete` le monete (non devono muoversi). */
function mondo({ liv = LIVELLO_MONGOLFIERA, stato = null, rnd = sequenza(), nave = true } = {}) {
  const b = { monete: 500 }, t = { ora: 1_000_000 }
  const f = new Fattoria3d({ stato, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd })
  f.s.esperienza = sogliaDi(liv)
  if (nave) f.s.posseduti.mongolfiera = true
  f.tick()
  return { f, b, t }
}
const dai = (f, k, n) => { f.s.prodotti[k] = (f.s.prodotti[k] || 0) + n }
const riempi = (f, i, c) => { const cassa = f.s.mongolfiera.stiva.file[i].casse[c]; dai(f, f.s.mongolfiera.stiva.file[i].merce, cassa.pezzi); return f.caricaCassa(i, c) }

/* ══════════ 1. i dati ══════════ */
const guasti = guastiDellaMongolfiera()
controlla('i dati della mongolfiera non hanno guasti (il tetto compreso)', guasti.length === 0, guasti.join(' · '))
uguale('il livello d\'ingresso è quello dell\'edificio', LIVELLO_MONGOLFIERA, EDIFICI.mongolfiera.liv)
controlla('il crudo non sale in una cassa', Object.keys(COLTURE).every(k => !merceDaCassa(k)))
controlla('né i mangimi (la pappa di mais)', !merceDaCassa('pastone'))
controlla('né una lavorazione sola (la farina)', fasiDi('farina') === 1 && !merceDaCassa('farina'))
controlla('sì un prodotto finito (la pasta, il pane)', merceDaCassa('pasta') && merceDaCassa('pane') && fasiDi('pasta') === 2)
controlla('una merce dichiarata mangime non sale', (() => { RICETTE.pasta.mangime = true; const no = !merceDaCassa('pasta'); delete RICETTE.pasta.mangime; return no })())
controlla('al livello d\'ingresso ci sono almeno due merci, tutte già fattibili', merciDelLivello(LIVELLO_MONGOLFIERA).length >= 2 && merciDelLivello(LIVELLO_MONGOLFIERA).every(k => livelloDi(k) <= LIVELLO_MONGOLFIERA))
controlla('prima del livello d\'ingresso non c\'è niente da fare in più del livello', merciDelLivello(1).length === 0)
controlla('i pezzi per cassa crescono col livello e non scendono', pezziMaxAl(1) === PEZZI_MAX - 1 && pezziMaxAl(ULTIMO) === PEZZI_MAX)
controlla('la sorpresa ha le otto decorazioni della fiera da regalare (come in 2D), nessuna calpestabile', SORPRESE.length === 8 && SORPRESE.every(t => PEZZI[t].fiera && PEZZI[t].categoria === 'feste' && !PEZZI[t].calpestabile))

/* ══════════ 1b. la quarta fila (M17): dal livello della mongolfiera grande della 2D ══════════ */
uguale('tre file sotto il livello 66, quattro da lì (come in 2D)', [fileAl(1), fileAl(LIVELLO_QUARTA_FILA - 1), fileAl(LIVELLO_QUARTA_FILA), fileAl(ULTIMO)].join(), [FILE, FILE, FILE_MAX, FILE_MAX].join())
uguale('il livello è quello della 2D', LIVELLO_QUARTA_FILA, LIVELLO_GRANDE_2D)
controlla('un carico al livello 66 ha quattro file, di merci diverse', (() => { const st = nuovaStiva(mondo({ liv: LIVELLO_QUARTA_FILA, rnd: sequenza(3) }).f); return st.file.length === 4 && new Set(st.file.map(x => x.merce)).size === 4 })())
controlla('un carico sotto il 66 ne ha al più tre', nuovaStiva(mondo({ liv: LIVELLO_QUARTA_FILA - 1 }).f).file.length === 3)
controlla('un carico a quattro file si rilegge intero', (() => { const f = mondo({ liv: ULTIMO }).f; return stivaInForma(JSON.parse(JSON.stringify(f.s.mongolfiera.stiva))).file.length === 4 })())

/* ══════════ 2. un carico è sempre fattibile e dentro il tetto, a ogni livello ══════════ */
{
  let giri = 0, fuori = ''
  for (let liv = LIVELLO_MONGOLFIERA; liv <= ULTIMO; liv++) {
    for (let seme = 1; seme <= 12; seme++) {
      const { f } = mondo({ liv, rnd: sequenza(liv * 31 + seme) })
      const st = nuovaStiva(f); giri++
      if (!st) { fuori = `liv ${liv}: nessun carico`; break }
      const merci = st.file.map(x => x.merce)
      if (st.file.length < 1 || st.file.length > fileAl(liv) || st.file.length !== Math.min(fileAl(liv), merciDelLivello(liv).length)) fuori = `liv ${liv}: ${st.file.length} file`
      if (new Set(merci).size !== merci.length) fuori = `liv ${liv}: una merce in due file`
      for (const x of st.file) {
        if (!merceDaCassa(x.merce) || livelloDi(x.merce) > liv) fuori = `liv ${liv}: ${x.merce} impossibile`
        if (x.casse.length < CASSE_MIN || x.casse.length > CASSE_MAX) fuori = `liv ${liv}: ${x.casse.length} casse`
        if (new Set(x.casse.map(c => c.pezzi)).size !== 1 || x.casse[0].pezzi < 1 || x.casse[0].pezzi > pezziMaxAl(liv)) fuori = `liv ${liv}: pezzi ${x.casse.map(c => c.pezzi)}`
        if (x.casse.some(c => c.piena || c.xp !== premioDellaCassa(x.merce, c.pezzi) || c.xp < 1)) fuori = `liv ${liv}: premio o cassa piena`
      }
      // con tutti i bonus un carico non rende mai più del tempo che costa (🪙6 al minuto): per merce, e quindi in tutto
      const chiede = {}; let xp = 0
      for (const x of st.file) for (const c of x.casse) { chiede[x.merce] = (chiede[x.merce] || 0) + c.pezzi; xp += c.xp }
      const reso = xp + st.file.reduce((n, x) => n + bonusDellaFila(x.casse.reduce((a, c) => a + c.xp, 0)), 0) + bonusDelTutto(xp)
      if (reso > tettoDi(chiede) + 1e-9) fuori = `liv ${liv}: rende ${reso} sopra il tetto ${tettoDi(chiede)}`
    }
  }
  controlla(`${giri} carichi, dal livello ${LIVELLO_MONGOLFIERA} all'ultimo: fattibili, una merce per fila, dentro il tetto`, fuori === '', fuori)
}
{
  const { f } = mondo({ liv: LIVELLO_MONGOLFIERA })
  controlla('all\'ingresso si chiede solo ciò che a quel livello si fa', f.s.mongolfiera.stiva.file.every(x => livelloDi(x.merce) <= LIVELLO_MONGOLFIERA))
  const t = mondo({ liv: LIVELLO_MONGOLFIERA, rnd: () => 0.99 }).f
  controlla('con il caso al massimo le casse sono tre e i pezzi sono quelli del livello', t.s.mongolfiera.stiva.file.every(x => x.casse.length === CASSE_MAX && x.casse[0].pezzi === pezziMaxAl(LIVELLO_MONGOLFIERA)))
}

/* ══════════ 3. senza mongolfiera, o sotto il livello ══════════ */
{
  const { f } = mondo({ nave: false })
  const v = f.vistaMongolfiera()
  stessaLista('non tua: la vista lo dice e dà il prezzo', [v.stato, v.prezzo, v.posseduta, v.aperta], ['non-tua', EDIFICI.mongolfiera.prezzo, false, true])
  uguale('non si carica niente', f.caricaCassa(0, 0).motivo, 'non-tua')
  uguale('né si parte', f.partiMongolfiera().motivo, 'non-tua')
  controlla('e il cielo resta com\'è', f.s.mongolfiera.stiva === null)
  controlla('sotto il livello d\'ingresso non è «aperta»', mondo({ liv: 3, nave: false }).f.vistaMongolfiera().aperta === false)
}

/* ══════════ 4. una cassa alla volta: serve la roba, rende subito, non costa monete ══════════ */
{
  const { f, b } = mondo()
  const st = f.s.mongolfiera.stiva, fila = st.file[0], cassa = fila.casse[0]
  const v0 = f.vistaMongolfiera()
  stessaLista('la vista: a terra, nessuna cassa pronta, tutte vuote', [v0.stato, v0.pronte, v0.piene, v0.totale], ['terra', 0, 0, st.file.reduce((n, x) => n + x.casse.length, 0)])
  const r0 = f.caricaCassa(0, 0)
  controlla('senza roba non si carica: dice cosa manca', !r0.ok && r0.motivo === 'mancano' && r0.mancano[fila.merce] === cassa.pezzi)
  controlla('e non cambia niente', !cassa.piena && f.s.esperienza === sogliaDi(LIVELLO_MONGOLFIERA))
  dai(f, fila.merce, cassa.pezzi - 1)
  uguale('con un pezzo di meno ne manca uno', f.caricaCassa(0, 0).mancano[fila.merce], 1)
  dai(f, fila.merce, 1)
  controlla('la vista dice che è pronta', f.vistaMongolfiera().pronte >= 1 && f.vistaMongolfiera().file[0].casse[0].pronta)
  const prima = f.s.esperienza
  const r = f.caricaCassa(0, 0)
  controlla('si carica: rende la sua esperienza, toglie i pezzi, non tocca le monete', r.ok && r.xp === cassa.xp + r.bonusFila + r.bonusTutto && f.s.esperienza === prima + r.xp && !f.s.prodotti[fila.merce] && b.monete === 500)
  controlla('la cassa è piena e non si ricarica', cassa.piena && f.caricaCassa(0, 0).motivo === 'gia-piena')
  stessaLista('una cassa che non c\'è', [f.caricaCassa(9, 0).motivo, f.caricaCassa(0, 9).motivo], ['sconosciuta', 'sconosciuta'])
  const e = f.prendiEventi().filter(x => x.tipo === 'cassa')
  controlla('l\'evento «cassa» dice merce, pezzi ed esperienza', e.length === 1 && e[0].merce === fila.merce && e[0].pezzi === cassa.pezzi && e[0].xp === r.xp)
  controlla('non serve avere tutto: la mongolfiera aspetta con le altre casse', f.s.mongolfiera.stiva === st && f.s.mongolfiera.riposo === null)
}

/* ══════════ 5. fila piena +25%, tutto pieno +50% e la sorpresa; poi parte e torna ══════════ */
{
  const { f, b, t } = mondo()
  const st = f.s.mongolfiera.stiva, file = st.file
  // la prima fila: tutte le casse meno l'ultima senza bonus, l'ultima col bonus della fila
  const casse0 = file[0].casse
  for (let c = 0; c < casse0.length - 1; c++) { const r = riempi(f, 0, c); controlla(`fila 0, cassa ${c}: niente bonus`, r.ok && r.bonusFila === 0 && r.bonusTutto === 0 && !r.pieno) }
  const somma0 = casse0.reduce((n, c) => n + c.xp, 0)
  const r1 = riempi(f, 0, casse0.length - 1)
  controlla('chiusa la fila c\'è il bonus del 25%', r1.ok && r1.bonusFila === bonusDellaFila(somma0) && r1.bonusFila === Math.round(BONUS_FILA * somma0) && r1.bonusTutto === 0 && !r1.pieno)
  controlla('la vista accende la fila', f.vistaMongolfiera().file[0].piena && f.vistaMongolfiera().file[0].bonus === bonusDellaFila(somma0))
  // le altre file, fino all'ultima cassa
  let ultima = null
  for (let i = 1; i < file.length; i++) for (let c = 0; c < file[i].casse.length; c++) {
    const ultimaCassa = i === file.length - 1 && c === file[i].casse.length - 1
    if (ultimaCassa) { ultima = { i, c }; break }
    riempi(f, i, c)
  }
  controlla('a una cassa dalla fine non è partita', f.s.mongolfiera.riposo === null && f.s.mongolfiera.stiva === st)
  f.prendiEventi()
  const totale = file.reduce((n, x) => n + x.casse.reduce((a, c) => a + c.xp, 0), 0)
  const prima = f.s.esperienza, magazzino = { ...f.s.magazzino }
  const r2 = riempi(f, ultima.i, ultima.c)
  controlla('l\'ultima cassa: bonus fila, bonus tutto (+50% del totale) e la sorpresa', r2.ok && r2.pieno && r2.parte && r2.bonusTutto === bonusDelTutto(totale) && r2.bonusTutto === Math.round(BONUS_TUTTO * totale) && r2.bonusFila > 0)
  controlla('l\'esperienza sale esattamente di quel che dice', f.s.esperienza === prima + r2.xp)
  controlla('la sorpresa è una decorazione della fiera, ora nel magazzino', SORPRESE.includes(r2.sorpresa) && (f.s.magazzino[r2.sorpresa] || 0) === (magazzino[r2.sorpresa] || 0) + 1)
  const ev = f.prendiEventi()
  controlla('gli eventi: la cassa e la fiera', ev.some(x => x.tipo === 'cassa') && ev.filter(x => x.tipo === 'fiera').length === 1 && ev.find(x => x.tipo === 'fiera').pezzo === r2.sorpresa)
  controlla('le monete non si sono mosse in tutto il giro', b.monete === 500)
  // è partita
  const M = f.s.mongolfiera
  controlla('è partita: niente carico, il ritorno fra il riposo, un viaggio in più', M.stiva === null && M.via === t.ora && M.riposo === t.ora + RIPOSO_MS && M.giri === 1)
  const v = f.vistaMongolfiera()
  controlla('la vista dice «viaggio» e quanto manca', v.stato === 'viaggio' && v.restoMs === RIPOSO_MS)
  stessaLista('in viaggio non si carica né si riparte', [f.caricaCassa(0, 0).motivo, f.partiMongolfiera().motivo], ['in-viaggio', 'in-viaggio'])
  t.ora += RIPOSO_MS - 1; f.tick()
  controlla('un attimo prima del ritorno è ancora via', f.s.mongolfiera.stiva === null && f.vistaMongolfiera().stato === 'viaggio')
  t.ora += 1; f.tick()
  controlla('torna con un nuovo carico, da riempire', f.s.mongolfiera.stiva !== null && f.s.mongolfiera.riposo === null && f.s.mongolfiera.via === null && f.vistaMongolfiera().stato === 'terra' && f.vistaMongolfiera().piene === 0)
  // pagina chiusa a lungo: al ritorno c'è un carico solo (niente si accumula)
  const g = mondo()
  g.t.ora = 1_000_000
  riempi(g.f, 0, 0); g.f.partiMongolfiera()
  g.t.ora += 24 * 3_600_000; g.f.tick()
  controlla('dopo un giorno a pagina chiusa: un carico, un viaggio contato', g.f.s.mongolfiera.giri === 1 && g.f.s.mongolfiera.stiva.file.length >= 1)
  controlla('il tempo del viaggio sta nel tempo della salita', RIPOSO_MS > 2 * SALITA_MS)
}

/* ══════════ 6. «Parti subito»: restano le casse messe, niente bonus del tutto né sorpresa ══════════ */
{
  const { f, t } = mondo()
  const r = riempi(f, 0, 0)
  const prima = f.s.esperienza, mag = JSON.stringify(f.s.magazzino)
  const p = f.partiMongolfiera()
  controlla('parte a metà e dice quante casse c\'erano', p.ok && p.piene === 1 && p.di >= CASSE_MIN && p.di <= FILE_MAX * CASSE_MAX)
  controlla('non dà altro: l\'esperienza delle casse c\'è già', f.s.esperienza === prima && r.ok && JSON.stringify(f.s.magazzino) === mag)
  uguale('torna dopo il riposo come a tutto pieno', f.s.mongolfiera.riposo, t.ora + RIPOSO_MS)
  uguale('a vuoto non c\'è niente da far partire', mondo({ nave: false }).f.partiMongolfiera().motivo, 'non-tua')
}

/* ══════════ 7. la sorpresa preferisce ciò che hai di meno, a caso solo a parità ══════════ */
{
  const { f } = mondo({ rnd: () => 0 })
  const aperti = SORPRESE.filter(t => PEZZI[t].liv <= f.livello())
  controlla('all\'ingresso i decori sorprendono solo fra quelli già comprabili', aperti.length >= 1)
  const dueVolte = new Set()
  for (let n = 0; n < aperti.length * 2; n++) {
    const s = scegliLaSorpresa(f); dueVolte.add(s)
    controlla(`regalo ${n}: un decoro comprabile`, aperti.includes(s))
    f.s.magazzino[s] = (f.s.magazzino[s] || 0) + 1
  }
  stessaLista('ruota: dopo due giri ognuno ne ha due', aperti.map(t => f.s.magazzino[t]), aperti.map(() => 2))
  // chi ha messo in mappa un decoro lo conta fra quelli che ha
  const g = mondo({ rnd: () => 0 }).f
  for (const t of aperti.slice(1)) g.s.cose.push({ id: g.s.prossimoId++, tipo: t, i: 0, j: 0 })
  uguale('manca solo il primo: è lui', scegliLaSorpresa(g), aperti[0])
  controlla('ha un decoro per ogni tipo e uno solo ne manca: con più caso il caso sceglie fra i pari', scegliLaSorpresa(mondo({ rnd: () => 0.99 }).f) === aperti[aperti.length - 1])
}

/* ══════════ 8. lo stato: si salva, si rilegge, un segnaposto vecchio si chiude ══════════ */
{
  const { f, t } = mondo()
  riempi(f, 0, 0)
  const salvato = JSON.parse(JSON.stringify(f.serializza()))
  const g = new Fattoria3d({ stato: salvato, borsa: { quante: () => 0, paga: () => true }, ora: () => t.ora, rnd: sequenza(3) })
  uguale('il carico si rilegge identico (casse piene comprese)', JSON.stringify(g.s.mongolfiera), JSON.stringify(f.s.mongolfiera))
  g.partiMongolfiera()
  const h = new Fattoria3d({ stato: JSON.parse(JSON.stringify(g.serializza())), borsa: { quante: () => 0, paga: () => true }, ora: () => t.ora, rnd: sequenza(3) })
  stessaLista('anche il viaggio si rilegge', [h.s.mongolfiera.via, h.s.mongolfiera.riposo, h.s.mongolfiera.giri, h.s.mongolfiera.stiva], [g.s.mongolfiera.via, g.s.mongolfiera.riposo, 1, null])
  uguale('la versione dello stato non è salita', salvato.v, statoIniziale().v)

  // il segnaposto di prima: { fine, cassa }
  for (const [nome, vecchia, lana] of [['un viaggio in corso', { fine: 9000, cassa: false }, 5], ['una cassa da ritirare', { fine: null, cassa: true }, 5], ['a terra, vuota', { fine: null, cassa: false }, 3]]) {
    const n = normalizza({ ...statoIniziale(), lana: 3, mongolfiera: vecchia })
    controlla(`${nome}: si legge, vale la lana che avrebbe dato (${lana - 3 ? '+2' : 'niente'}) e il resto è nuovo`,
      n.lana === lana && n.mongolfiera.stiva === null && n.mongolfiera.riposo === null && n.mongolfiera.via === null && n.mongolfiera.giri === 0 && !('fine' in n.mongolfiera) && !('cassa' in n.mongolfiera))
  }
  const dopo = normalizza(JSON.parse(JSON.stringify({ ...statoIniziale(), lana: 3, mongolfiera: { fine: 1, cassa: true } })))
  const ancora = normalizza(JSON.parse(JSON.stringify(dopo)))
  uguale('e non si paga due volte, rileggendo', ancora.lana, dopo.lana)
  const vecchio = mondo({ stato: { ...statoIniziale(), esperienza: sogliaDi(LIVELLO_MONGOLFIERA), posseduti: { ...statoIniziale().posseduti, mongolfiera: true }, mongolfiera: { fine: 1, cassa: false } }, nave: false }).f
  controlla('una fattoria col segnaposto riceve il suo primo carico', vecchio.vistaMongolfiera().stato === 'terra')
  // stati rotti
  for (const rotto of [null, 5, 'x', [], { stiva: 'x' }, { stiva: { file: 'x' } }, { stiva: { file: [null, 1, { merce: 'grano', casse: [{ pezzi: 1 }] }, { merce: 'pasta', casse: 'x' }, { merce: 'pasta', casse: [{ pezzi: 99 }, { pezzi: -1 }, null] }] } }, { riposo: 'x', giri: -4 }, { giri: 2.5 }]) {
    const n = normalizza({ mongolfiera: rotto }).mongolfiera
    controlla(`un carico rotto si rimette in forma (${JSON.stringify(rotto)})`, n.stiva === null && n.riposo === null && n.giri === 0)
  }
  const buona = stivaInForma({ file: [{ merce: 'pasta', casse: [{ pezzi: 2, xp: 9999, piena: true }, { pezzi: 2 }] }, { merce: 'pasta', casse: [{ pezzi: 1 }] }, { merce: 'pastone', casse: [{ pezzi: 1 }] }] })
  controlla('di un carico quasi buono si tiene il valido: premio ricalcolato, merce doppia e mangime scartati', buona.file.length === 1 && buona.file[0].casse.length === 2 && buona.file[0].casse[0].xp === premioDellaCassa('pasta', 2) && buona.file[0].casse[0].piena && !buona.file[0].casse[1].piena)
  const nuovoViaggio = normalizza({ mongolfiera: { riposo: 5000, giri: 3 } }).mongolfiera
  stessaLista('un viaggio senza partenza la ricava dal riposo', [nuovoViaggio.riposo, nuovoViaggio.via, nuovoViaggio.giri, nuovoViaggio.stiva], [5000, 5000 - RIPOSO_MS, 3, null])
}

/* ══════════ 9. il premio non è mai monete e non supera il tetto ══════════ */
controlla('il cambio è 🪙6 al minuto', MONETE_AL_MINUTO === 6)
riassunto('La mongolfiera della fattoria 3D')
