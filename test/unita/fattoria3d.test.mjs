/* Verifica della fattoria 3D, senza browser: i dati stanno in piedi, il terreno si compra solo se confina, i pezzi passano dal
   magazzino alla mappa e viceversa, i campi crescono e si tagliano una tessera alla volta, gli alberi si abbattono solo nel
   terreno proprio, le pecore hanno le loro fasi, la pasticceria cuoce uno alla volta anche a pagina chiusa, la mongolfiera
   torna, e lo stato si salva e si rilegge uguale.
   `node test/esegui.mjs fattoria3d`
   tempo: 1 */
import { guastiDelMondo, LOTTI, LOTTI_INIZIALI, lottoPerId, idx, PARTENZA } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { guastiDelCatalogo, PEZZI, EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { guastiDelleColture, COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { guastiDelleRicette, RICETTE, MACCHINE, FORNO_POSTI } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { guastiDeiLivelli, sogliaDi, livelloPer, roba, nomeDi, ULTIMO, costoDelLivello, livelloDellaRicetta } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { guastiDelleRegole, COSTI, PECORE, MONGOLFIERA, LEGNA_PER_ALBERO } from '../../src/giochi/fattoria3d/dati/regole.js'
import { generaAlberi, guastiDegliAlberi } from '../../src/giochi/fattoria3d/dati/alberi.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { statoIniziale, normalizza } from '../../src/giochi/fattoria3d/motore/stato.js'
import manifesto from '../../src/giochi/fattoria3d/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* un mondo con le monete e l'orologio in mano */
function mondo({ monete = 1000, stato = null } = {}) {
  const b = { monete }
  const t = { ora: 1_000_000 }
  const f = new Fattoria3d({ stato, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
  return { f, b, t }
}
// il campo di partenza e una cella libera e propria per un pezzo nuovo
// porta la fattoria al livello n (l'esperienza è la spesa: qui la si mette in mano)
const alLivello = (f, n) => { f.s.esperienza = sogliaDi(n); return f }
const campoDi = f => f.s.cose.find(c => c.tipo === 'campo')

/* ══════════ 1. i dati ══════════ */
const guasti = [...guastiDelMondo(), ...guastiDelCatalogo(), ...guastiDelleColture(), ...guastiDelleRicette(COLTURE, EDIFICI), ...guastiDeiLivelli(),
                ...guastiDelleRegole(), ...guastiDegliAlberi()]
controlla('i dati non hanno guasti', guasti.length === 0, guasti.join(' · '))
stessaLista('quarantadue lotti, nove di partenza', [LOTTI.length, Object.keys(LOTTI_INIZIALI).length], [42, 9])
controlla('gli alberi sono sempre gli stessi', JSON.stringify(generaAlberi()) === JSON.stringify(generaAlberi()))
controlla('il manifesto è in prova e senza tappe', manifesto.sperimentale === true && manifesto.tappe === 0 && manifesto.chiave === 'fattoria3d')
const gA = guastiDellAlbo([manifesto])
controlla('l\'albo del manifesto sta in piedi', gA.length === 0, gA.join(' · '))

/* ══════════ 2. si parte da un campo vuoto, dentro il terreno ══════════ */
{
  const { f } = mondo()
  stessaLista('un campo, vuoto', [f.s.cose.length, f.campoVuoto(campoDi(f))], [1, true])
  controlla('l\'eroe parte su una cella libera', f.libera(Math.floor(PARTENZA.x), Math.floor(PARTENZA.z)))
  stessaLista('da fare: un campo da seminare', f.daFare(), { semina: 1, raccogli: 0 })
}

/* ══════════ 3. il terreno si compra solo se confina, e il prezzo sale ══════════ */
{
  const { f, b } = mondo({ monete: 500 })
  const nord = lottoPerId('3_1'), lontano = lottoPerId('0_0'), mio = lottoPerId('3_2')
  controlla('un lotto che confina si può comprare', f.confina(nord) && !f.confina(lontano))
  uguale('un lotto lontano non si compra', f.compraLotto(lontano.id).motivo, 'non-confina')
  uguale('uno già tuo nemmeno', f.compraLotto(mio.id).motivo, 'gia-tuo')
  uguale('il primo costa il prezzo base', f.prezzoLotto(), COSTI.lottoBase)
  const r = f.compraLotto(nord.id)
  controlla('comprato: tolte le monete e c\'è l\'evento', r.ok && b.monete === 500 - COSTI.lottoBase && f.prendiEventi().some(e => e.tipo === 'terra'))
  uguale('il secondo costa di più', f.prezzoLotto(), COSTI.lottoBase + COSTI.lottoRincaro)
  controlla('ora il confine si è spostato: il lotto più a nord confina', f.confina(lottoPerId('3_0')))
  const poche = mondo({ monete: 5 }).f.compraLotto(nord.id)
  stessaLista('senza monete non si compra', [poche.ok, poche.motivo], [false, 'poche-monete'])
  controlla('e si può camminare dove prima si era chiusi fuori', f.libera(2, -10) === false || f.cellaPropria(nord.i, nord.j))
}

/* ══════════ 4. il magazzino: si compra, si mette, si sposta, si rimette via ══════════ */
{
  const { f, b } = mondo({ monete: 500 })
  uguale('un campo non in magazzino non si mette', f.mettiPezzo('campo', -3, 1).motivo, 'non-in-magazzino')
  const prezzo = f.prezzoPezzo('campo')
  uguale('il secondo campo costa quanto dice il rincaro', prezzo, PEZZI.campo.prezzo + PEZZI.campo.rincaro)
  controlla('si compra', f.compraPezzo('campo').ok && b.monete === 500 - prezzo && f.nelMagazzino('campo') === 1)
  uguale('il prezzo sale anche col pezzo nel magazzino', f.prezzoPezzo('campo'), PEZZI.campo.prezzo + 2 * PEZZI.campo.rincaro)
  uguale('fuori dal terreno proprio no', f.mettiPezzo('campo', -13, -11).motivo, 'fuori-terreno')
  uguale('sopra un altro pezzo no', f.mettiPezzo('campo', -5, 0).motivo, 'occupato')
  uguale('sopra il posto di un edificio unico no', f.mettiPezzo('campo', -6, -4).motivo, 'occupato')
  const r = f.mettiPezzo('campo', -3, 1)
  controlla('in un posto libero sì, e il magazzino si svuota', r.ok && f.nelMagazzino('campo') === 0 && f.s.cose.length === 2)
  controlla('la cella ora è occupata', !f.libera(-3, 1) && f.cosaSu(-3, 1).id === r.cosa.id)
  const sp = f.spostaPezzo(r.cosa.id, -3, 2)
  controlla('spostarlo costa una monetina', sp.ok && sp.costo === COSTI.spostare)
  uguale('spostarlo dov\'è è gratis', f.spostaPezzo(r.cosa.id, -3, 2).costo, 0)
  controlla('la cella di prima torna libera', f.libera(-3, 1) && !f.libera(-3, 2))
  const via = f.mettiVia(r.cosa.id)
  controlla('rimesso via torna nel magazzino', via.ok && f.nelMagazzino('campo') === 1 && f.s.cose.length === 1)
  f.mettiPezzo('campo', -3, 1)
  const c = f.s.cose[1]; f.semina(c.id, 'grano')
  uguale('un campo che cresce non si mette via', f.mettiVia(c.id).motivo, 'sta-crescendo')
  const m2 = mondo({ monete: 3 }).f
  controlla('con una monetina sola si compra un pezzo da 15 solo se c\'è', !m2.compraPezzo('bancarella').ok)
}

/* ══════════ 5. i campi crescono col tempo e si tagliano una tessera alla volta ══════════ */
{
  const { f, t } = mondo()
  const c = campoDi(f)
  controlla('si semina', f.semina(c.id, 'carota').ok && !f.campoVuoto(c))
  uguale('un campo seminato non si semina', f.semina(c.id, 'grano').motivo, 'non-vuoto')
  uguale('una coltura sconosciuta non esiste', mondo().f.semina(campoDi(mondo().f).id, 'cavolo').motivo, 'coltura')
  uguale('appena seminato non è maturo', f.campoMaturo(c), false)
  uguale('manca quasi tutto il tempo', f.restoSecondi(c), Math.ceil(COLTURE.carota.ms / 1000))
  uguale('una tessera acerba non si taglia', f.raccogliTessera(c.id, 0).motivo, 'non-matura')
  t.ora += COLTURE.carota.ms + 1
  controlla('dopo il tempo è maturo', f.campoMaturo(c))
  stessaLista('da fare: un campo da raccogliere', f.daFare(), { semina: 0, raccogli: 1 })
  for (let k = 0; k < 4; k++) controlla(`la tessera ${k} si taglia`, f.raccogliTessera(c.id, k).ok)
  uguale('quattro carote in scorta', f.s.merci.carota, 4)
  controlla('il campo è di nuovo vuoto', f.campoVuoto(c))
  uguale('e non si taglia due volte', f.raccogliTessera(c.id, 0).motivo, 'vuota')
  uguale('quattro eventi di raccolto', f.prendiEventi().filter(e => e.tipo === 'raccolto').length, 4)
}

/* ══════════ 6. gli alberi: solo dentro il terreno proprio, e danno legna ══════════ */
{
  const { f } = mondo()
  const mio = f.alberiNelTerreno()
  controlla('ce ne sono nel terreno di partenza', mio.length >= 3, String(mio.length))
  const a = mio[0]
  controlla('un albero in piedi blocca la cella', !f.libera(a.i, a.j))
  const r = f.abbatti(a.n)
  controlla('abbattuto: legna e cella libera', r.ok && r.legna === LEGNA_PER_ALBERO && f.s.legna === LEGNA_PER_ALBERO && f.libera(a.i, a.j))
  uguale('due volte no', f.abbatti(a.n).motivo, 'gia-tagliato')
  const fuori = f.alberi.find(x => x.tagliabile && !f.cellaPropria(x.i, x.j))
  uguale('un albero in un lotto non tuo non si abbatte', f.abbatti(fuori.n).motivo, 'fuori-terreno')
  const bosco = f.alberi.find(x => !x.tagliabile)
  uguale('il bosco fuori dal mondo nemmeno', f.abbatti(bosco.n).motivo, 'bosco')
  const salvato = f.serializza()
  const g = mondo({ stato: salvato }).f
  controlla('l\'albero tagliato resta tagliato dopo il salvataggio', g.alberi[a.n].tagliato === true && g.libera(a.i, a.j))
}

/* ══════════ 7. le strade ══════════ */
{
  const { f, b } = mondo({ monete: 10 })
  const prima = b.monete
  controlla('si disegna dove è libero e proprio', f.disegnaStrada(-3, 2).ok && b.monete === prima - COSTI.strada)
  uguale('due volte no', f.disegnaStrada(-3, 2).motivo, 'qui-no')
  uguale('sopra un pezzo no', f.disegnaStrada(-5, 0).motivo, 'occupato')
  uguale('fuori dal terreno no', f.disegnaStrada(-13, -11).motivo, 'occupato')
  uguale('si toglie quella disegnata', f.togliStrada(-3, 2).ok, true)
  uguale('quella di serie no', f.togliStrada(0, 3).motivo, 'qui-no')
  const p = mondo({ monete: 0 }).f.disegnaStrada(-3, 2)
  uguale('senza monete no', p.motivo, 'poche-monete')
}

/* ══════════ 8. le pecore: agnello → adulta → tosata, e nascono ══════════ */
{
  const { f, t } = mondo({ monete: 1000 })
  alLivello(f, 5)
  f.compraEdificio('pasticceria')
  f.compraPezzo('recinto'); const r = f.mettiPezzo('recinto', -1, 2)
  controlla('il recinto sta in un posto proprio e libero', r.ok, r.motivo)
  const id = r.cosa.id, rec = r.cosa
  stessaLista('parte con un\'adulta e un agnello', rec.pecore.map(p => p.eta), ['adulta', 'agnello'])
  uguale('senza raccolti non si nutre', f.provaCura(id).motivo, 'manca-raccolto')
  f.s.merci.grano = 5
  uguale('c\'è da nutrire l\'agnello', f.provaCura(id).azione, 'nutri')
  uguale('un pasto', f.nutri(id).evento, 'pasto')
  uguale('un\'altra e cresce', f.nutri(id).evento, 'cresciuta')
  stessaLista('ora sono due adulte', rec.pecore.map(p => p.eta), ['adulta', 'adulta'])
  uguale('lana non ancora pronta', f.provaCura(id).azione, 'nutri')   // due adulte: si può far nascere
  uguale('un pasto per la nascita', f.nutri(id).evento, 'cuore')
  uguale('e nasce', f.nutri(id).evento, 'nata')
  uguale('un agnello in più', rec.pecore.length, 3)
  const grano = f.s.merci.grano
  controlla('ogni pasto è costato un raccolto', grano === 5 - 4, String(grano))
  t.ora += PECORE.laneMs + 1
  uguale('passato il tempo la lana è pronta (due adulte)', f.lanaPronta(rec).length, 2)
  uguale('si tosa prima di nutrire', f.provaCura(id).azione, 'tosa')
  const tos = f.tosa(id)
  controlla('tosate: due lane', tos.ok && tos.n === 2 && f.s.lana === 2)
  uguale('subito dopo non c\'è più lana', f.lanaPronta(rec).length, 0)
  // quattro pecore al massimo
  f.s.merci.grano = 20
  for (let k = 0; k < 10; k++) f.nutri(id)
  controlla('non più di quattro per recinto', rec.pecore.length <= PECORE.max, String(rec.pecore.length))
}

/* ══════════ 9. la pasticceria: ingredienti, coda, un forno alla volta, anche a pagina chiusa ══════════ */
{
  const { f, t } = mondo({ monete: 1000 })
  alLivello(f, 5)
  uguale('non si cuoce senza pasticceria', f.prepara('pane').motivo, 'non-tua')
  controlla('si compra', f.compraEdificio('pasticceria').ok && f.s.posseduti.pasticceria)
  uguale('due volte no', f.compraEdificio('pasticceria').motivo, 'gia-tuo')
  uguale('senza ingredienti no', f.prepara('pane').motivo, 'mancano-ingredienti')
  f.s.merci.grano = 10; f.s.merci.mais = 2
  controlla('si prepara e si scalano gli ingredienti', f.prepara('pane').ok && f.s.merci.grano === 8)
  controlla('il primo parte subito', f.s.pasticceria.coda[0].fine === t.ora + RICETTE.pane.ms)
  f.prepara('popcorn'); f.prepara('pane')
  uguale('tre in coda', f.s.pasticceria.coda.length, 3)
  uguale('al quarto il forno è pieno', f.prepara('pane').motivo, 'forno-pieno')
  uguale('e gli ingredienti non si sono scalati', f.s.merci.grano, 10 - 2 - 2)
  // la pagina chiusa: passa tutto il tempo, poi si riapre
  t.ora += RICETTE.pane.ms + 1
  f.tick()
  stessaLista('il pane è uscito, il popcorn cuoce', [f.s.pasticceria.pronti.pane, f.s.pasticceria.coda[0].ric], [1, 'popcorn'])
  controlla('il successivo è partito quando finiva il precedente', f.s.pasticceria.coda[0].fine === 1_000_000 + RICETTE.pane.ms + RICETTE.popcorn.ms)
  t.ora += 100000
  f.tick()
  stessaLista('a tempo passato è tutto pronto', [f.s.pasticceria.coda.length, f.s.pasticceria.pronti.pane, f.s.pasticceria.pronti.popcorn], [0, 2, 1])
  const rit = f.ritira()
  controlla('si ritira tutto in dispensa', rit.ok && rit.n === 3 && f.s.prodotti.pane === 2 && f.s.prodotti.popcorn === 1 && f.prontiInForno() === 0)
  uguale('e non si ritira due volte', f.ritira().motivo, 'niente')
  controlla('gli eventi dicono i prodotti', f.prendiEventi().filter(e => e.tipo === 'prodotto').reduce((n, e) => n + e.n, 0) === 3)
}

/* ══════════ 10. la mongolfiera parte e torna con la cassa ══════════ */
{
  const { f, t } = mondo({ monete: 1000 })
  alLivello(f, 10)
  uguale('non parte se non è tua', f.carica().motivo, 'non-tua')
  f.compraEdificio('mongolfiera')
  uguale('né vuota', f.carica().motivo, 'manca-raccolto')
  f.s.merci.mais = MONGOLFIERA.carico
  controlla('si carica e parte', f.carica().ok && f.s.merci.mais === 0 && f.s.mongolfiera.fine === t.ora + MONGOLFIERA.viaggioMs)
  uguale('in viaggio non riparte', f.carica().motivo, 'in-viaggio')
  t.ora += MONGOLFIERA.viaggioMs + 1
  f.tick()
  controlla('tornata con la cassa', f.s.mongolfiera.cassa && f.s.mongolfiera.fine === null)
  const r = f.ritiraCassa()
  controlla('la cassa dà la lana', r.ok && f.s.lana === MONGOLFIERA.premioLana)
  uguale('una volta sola', f.ritiraCassa().motivo, 'niente')
}

/* ══════════ 11. lo stato si salva e si rilegge uguale; uno rotto si rimette in forma ══════════ */
{
  const { f, t } = mondo({ monete: 1000 })
  alLivello(f, 5)
  f.compraPezzo('campo'); f.mettiPezzo('campo', -3, 1); f.semina(f.s.cose[1].id, 'mais')
  f.compraLotto('3_1'); f.disegnaStrada(-3, 3); f.abbatti(f.alberiNelTerreno()[0].n); f.compraEdificio('pasticceria')
  f.s.merci.grano = 4; f.prepara('pane')
  const s1 = f.serializza()
  const g = mondo({ stato: JSON.parse(JSON.stringify(s1)) }).f
  uguale('la lettura rifà lo stesso stato', JSON.stringify(g.serializza()), JSON.stringify(s1))
  controlla('cose, lotti e strade tornano', g.s.cose.length === 2 && g.posseduto(lottoPerId('3_1')) && g.eStrada(-3, 3) === 1)
  for (const rotto of [null, undefined, 7, 'x', [], {}, { cose: 'no' }, { merci: 5, lotti: [1], strade: 'a', pasticceria: { coda: [{}] } }]) {
    const n = normalizza(rotto)
    controlla(`uno stato rotto si rimette in forma (${JSON.stringify(rotto)})`, Array.isArray(n.cose) && n.lotti && typeof n.merci.grano === 'number' && Array.isArray(n.pasticceria.coda))
  }
  uguale('lo stato iniziale ha il campo di partenza', statoIniziale().cose.length, 1)
  controlla('il riassunto del manifesto sa leggere lo stato', /terra|cose/.test(manifesto.riassunto({ cfg: { stato: s1 } })) && /campo/.test(manifesto.riassunto()))
}

/* ══════════ 12. le prove di stress non si salvano ══════════ */
{
  const { f } = mondo()
  const n = f.aggiungiProve('campo', 5)
  controlla('si aggiungono cose di prova', n > 0 && f.cose.length === 1 + n)
  uguale('ma non finiscono nello stato salvato', f.serializza().cose.length, 1)
  stessaLista('e si tolgono tutte', [f.togliProve(), f.cose.length], [n, 1])
}

/* ══════════ 13. i livelli: l'esperienza è la spesa, le soglie salgono, la roba la dicono le cose ══════════ */
{
  controlla('almeno quindici livelli', ULTIMO >= 15, String(ULTIMO))
  for (let l = 2; l <= ULTIMO + 3; l++) controlla(`la soglia del ${l} sale`, sogliaDi(l) > sogliaDi(l - 1))
  controlla('il livello 2 sta intorno a 60 monete', sogliaDi(2) >= 40 && sogliaDi(2) <= 80, String(sogliaDi(2)))
  controlla('il salto aggiunge il costo della roba produttiva (mulino al 3 → il 4 costa 60 in più)', costoDelLivello(3) === EDIFICI.mulino.prezzo && sogliaDi(4) - sogliaDi(3) >= EDIFICI.mulino.prezzo)
  for (let l = 1; l <= ULTIMO + 2; l++) controlla(`livelloPer è l'inversa di sogliaDi (${l})`, livelloPer(sogliaDi(l)) === l && (l === 1 || livelloPer(sogliaDi(l) - 1) === l - 1))
  uguale('dopo l\'ultimo si continua a salire', livelloPer(sogliaDi(ULTIMO + 5)), ULTIMO + 5)
  stessaLista('dopo l\'ultimo non si apre altro', Object.values(roba(ULTIMO + 1)).map(v => v.length), [0, 0, 0, 0])
  // roba: ogni cosa arriva una volta sola, al livello che dice
  const viste = new Set()
  for (let l = 1; l <= ULTIMO; l++) {
    const r = roba(l)
    controlla(`al livello ${l} arriva qualcosa e ha un nome`, Object.values(r).some(v => v.length) && !!nomeDi(l) && !/^Livello/.test(nomeDi(l)), nomeDi(l))
    for (const p of r.pezzi) controlla(`il pezzo ${p.id} dichiara ${l}`, PEZZI[p.id].liv === l && !viste.has('p' + p.id) && !!viste.add('p' + p.id))
    for (const e of r.edifici) controlla(`l'edificio ${e.id} dichiara ${l}`, EDIFICI[e.id].liv === l && !viste.has('e' + e.id) && !!viste.add('e' + e.id))
    for (const c of r.colture) controlla(`la coltura ${c.id} dichiara ${l}`, COLTURE[c.id].liv === l && !viste.has('c' + c.id) && !!viste.add('c' + c.id))
    for (const c of r.ricette) controlla(`la ricetta ${c.id} si fa dal ${l}`, livelloDellaRicetta(c.id) === l && !viste.has('r' + c.id) && !!viste.add('r' + c.id))
  }
  uguale('tutto quello che esiste arriva a un livello', viste.size, Object.keys(PEZZI).length + Object.keys(EDIFICI).length + Object.keys(COLTURE).length + Object.keys(RICETTE).length)
  uguale('dieci colture', Object.keys(COLTURE).length, 10)
  stessaLista('le dieci chiavi', Object.keys(COLTURE).sort(), ['carota', 'cipolla', 'fragola', 'grano', 'lavanda', 'mais', 'melanzana', 'patata', 'pomodoro', 'zucca'])
  // l'esperienza: la spesa fatta qui dentro, e non scende mai
  const { f, b } = mondo({ monete: 500 })
  uguale('si parte da zero, livello 1', [f.esperienza(), f.livello()].join(), '0,1')
  f.compraPezzo('campo'); uguale('comprare un campo è esperienza', f.esperienza(), PEZZI.campo.prezzo + PEZZI.campo.rincaro)
  const m = f.mettiPezzo('campo', -3, 1).cosa
  f.spostaPezzo(m.id, -3, 2); f.mettiVia(m.id)
  uguale('spostare e mettere via non contano', f.esperienza(), PEZZI.campo.prezzo + PEZZI.campo.rincaro)
  const prima = f.esperienza(); f.rimborsa(1)
  uguale('un rimborso non la riduce', f.esperienza(), prima)
  f.disegnaStrada(-3, 3); f.compraLotto('3_1')
  uguale('strade e terra contano', f.esperienza(), prima + COSTI.strada + COSTI.lottoBase)
  f.prendiEventi()
  f.s.esperienza = sogliaDi(2) - 1; f.compraPezzo('aiuola') // liv 2: ancora chiusa a livello 1
  uguale('a un soldo dal livello 2 si è ancora al 1', f.livello(), 1)
  f.disegnaStrada(-3, 4)
  controlla('con la spesa che passa la soglia si sale e c\'è l\'evento', f.livello() === 2 && f.prendiEventi().some(e => e.tipo === 'livello' && e.livello === 2))
  controlla('l\'esperienza si salva', mondo({ stato: f.serializza() }).f.esperienza() === f.esperienza())
}

/* ══════════ 14. il gating: ciò che non è arrivato rifiuta, e dice a che livello arriva ══════════ */
{
  const { f } = mondo({ monete: 5000 })
  for (const [tipo, d] of Object.entries(PEZZI)) {
    if (d.liv === 1) continue
    const r = f.compraPezzo(tipo)
    controlla(`il pezzo ${tipo} è chiuso al livello 1`, !r.ok && r.motivo === 'non-sbloccato' && r.liv === d.liv)
  }
  stessaLista('un edificio chiuso', [f.compraEdificio('mulino').motivo, f.compraEdificio('mulino').liv], ['non-sbloccato', 3])
  uguale('niente è stato pagato', f.monete(), 5000)
  const c = campoDi(f)
  uguale('il mais è chiuso al 1', f.semina(c.id, 'mais').motivo, 'non-sbloccato')
  uguale('e dice il livello', f.semina(c.id, 'mais').liv, 2)
  uguale('il campo è rimasto vuoto', f.campoVuoto(c), true)
  uguale('la coltura sconosciuta resta sconosciuta', f.semina(c.id, 'cavolo').motivo, 'coltura')
  uguale('seminaCampo è la stessa cosa', f.seminaCampo(c.id, 'lavanda').motivo, 'non-sbloccato')
  controlla('al livello giusto si semina', alLivello(f, 2) && f.seminaCampo(c.id, 'mais').ok)
  alLivello(f, 3)
  f.compraEdificio('mulino')
  uguale('la ricetta chiusa: la macchina è tua ma il livello no', alLivello(mondo({ monete: 5000 }).f, 2).avviaRicettaIn('pasticceria', 'pane').motivo, 'non-tua')
  const g = mondo({ monete: 5000 }).f
  alLivello(g, 5); g.compraEdificio('pasticceria'); g.s.merci.pomodoro = 5; g.s.merci.grano = 5
  const r = g.avviaRicetta('tortaCarote')
  stessaLista('una ricetta del livello 8 a livello 5', [r.ok, r.motivo, r.liv], [false, 'non-sbloccato', 8])
  controlla('quella del livello 6 non ancora', g.avviaRicetta('pizza').motivo === 'non-sbloccato')
  alLivello(g, 6)
  controlla('al 6 la pizza parte', g.avviaRicetta('pizza').ok)
  const pop = g.avviaRicetta('popcorn')
  stessaLista('un ingrediente mancante dice quale', [pop.motivo, JSON.stringify(pop.mancano)], ['mancano-ingredienti', JSON.stringify({ mais: 2 })])
}

/* ══════════ 15. gli edifici fuori dal quadrato di partenza chiedono i loro lotti ══════════ */
{
  const { f } = mondo({ monete: 5000 })
  alLivello(f, 3)
  const r = f.compraEdificio('mulino')
  stessaLista('il mulino vuole il suo lotto', [r.ok, r.motivo, r.lotti.join()], [false, 'lotto-non-tuo', '3_1'])
  uguale('nessuna moneta spesa', f.monete(), 5000)
  controlla('compro il lotto e poi il mulino', f.compraLotto('3_1').ok && f.compraEdificio('mulino').ok && f.s.posseduti.mulino)
  controlla('le celle del mulino non si possono usare', !f.libera(-2, -7) && f.mettiPezzo('campo', -2, -7).motivo === 'non-in-magazzino')
  for (const [tipo, e] of Object.entries(EDIFICI)) {
    const lotti = f.lottiMancanti(tipo)
    controlla(`i lotti mancanti di ${tipo} sono lotti veri e confinanti col terreno`, lotti.every(id => lottoPerId(id)))
  }
}

/* ══════════ 16. le macchine in catena: grano → farina → pane integrale ══════════ */
{
  const { f, t } = mondo({ monete: 5000 })
  alLivello(f, 7)
  for (const id of ['3_1', '2_1']) f.compraLotto(id)
  controlla('mulino e panificio comprati', f.compraEdificio('mulino').ok && f.compraEdificio('panificio').ok)
  uguale('le macchine sono due diverse', f.macchina('mulino').tipo + f.macchina('panificio').tipo, 'mulinopanificio')
  uguale('le ricette del mulino', f.ricetteDi('mulino').map(r => r.id).join(), 'farina,farinaMais')
  controlla('ricetteDi dice se si può', f.ricetteDi('mulino').every(r => r.sbloccata && !r.ingredienti))
  uguale('il pane integrale chiede farina che non c\'è', f.avviaRicettaIn('panificio', 'panIntegrale').motivo, 'mancano-ingredienti')
  uguale('una ricetta dell\'altra macchina è sconosciuta qui', f.avviaRicettaIn('mulino', 'panIntegrale').motivo, 'sconosciuta')
  f.s.merci.grano = 8
  controlla('il mulino macina', f.avviaRicettaIn('mulino', 'farina').ok && f.avviaRicetta('farina').ok && f.s.merci.grano === 4)
  t.ora += 2 * RICETTE.farina.ms + 1; f.tick()
  uguale('due farine pronte nel mulino, non ancora in dispensa', [f.macchina('mulino').pronti.farina, f.s.prodotti.farina || 0].join(), '2,0')
  uguale('ritirate', f.ritiraDa('mulino').n, 2)
  uguale('e non due volte', f.ritiraDa('mulino').motivo, 'niente')
  uguale('la farina è un prodotto', f.s.prodotti.farina, 2)
  controlla('il panificio la usa: scala dai prodotti', f.avviaRicettaIn('panificio', 'panIntegrale').ok && !('farina' in f.s.prodotti))
  t.ora += RICETTE.panIntegrale.ms + 1; f.tick()
  f.ritiraDa('panificio')
  uguale('pane integrale in dispensa', f.s.prodotti.panIntegrale, 1)
  uguale('tre posti anche qui', f.macchina('panificio').posti, FORNO_POSTI)
  f.s.prodotti.farina = 20; f.s.merci.patata = 1
  f.avviaRicettaIn('panificio', 'panIntegrale'); f.avviaRicettaIn('panificio', 'panIntegrale'); f.avviaRicettaIn('panificio', 'focaccia')
  uguale('il quarto trova il forno pieno', f.avviaRicettaIn('panificio', 'panIntegrale').motivo, 'forno-pieno')
  // ogni ricetta è fattibile con ciò che dice: ingredienti da raccolti o da prodotti di un'altra macchina
  for (const [id, r] of Object.entries(RICETTE)) for (const k of Object.keys(r.ing)) controlla(`${id}: ${k} è un raccolto o un prodotto di un'altra macchina`, !!COLTURE[k] || (!!RICETTE[k] && RICETTE[k].dove !== r.dove))
}

/* ══════════ 17. il vecchio stato (versione 1) si apre senza perdere niente ══════════ */
{
  const vecchio = {
    v: 1, merci: { grano: 3, carota: 1, mais: 0, pomodoro: 0, zucca: 2 }, prodotti: { pane: 2 }, lana: 1, legna: 4,
    posseduti: { pasticceria: true, mongolfiera: true },
    lotti: { ...LOTTI_INIZIALI, '3_1': true }, strade: [], magazzino: { campo: 1 }, tagliati: [3],
    cose: [{ id: 1, tipo: 'campo', i: -5, j: 0, tile: [null, null, null, null], coltura: 'zucca' }], prossimoId: 2,
    pasticceria: { coda: [{ ric: 'popcorn', fine: 5000 }], pronti: { pane: 1 } },
    mongolfiera: { fine: 7000, cassa: false },
  }
  const n = normalizza(JSON.parse(JSON.stringify(vecchio)))
  controlla('l\'esperienza manca: parte da zero', n.esperienza === 0 && n.v >= 2)
  controlla('i posseduti ci sono tutti e i vecchi restano', Object.keys(EDIFICI).every(t => t in n.posseduti) && n.posseduti.pasticceria && n.posseduti.mongolfiera && !n.posseduti.mulino)
  stessaLista('la pasticceria è diventata una macchina, intera', [n.macchine.pasticceria.coda.length, n.macchine.pasticceria.pronti.pane, n.pasticceria === n.macchine.pasticceria], [1, 1, true])
  controlla('la mongolfiera è com\'era', n.mongolfiera.fine === 7000)
  stessaLista('le macchine nuove sono vuote', ['mulino', 'panificio', 'conserviera', 'gelateria'].map(t => n.macchine[t].coda.length + Object.keys(n.macchine[t].pronti).length), [0, 0, 0, 0])
  controlla('merci, prodotti, lotti e cose restano', n.merci.zucca === 2 && n.prodotti.pane === 2 && n.lotti['3_1'] && n.cose[0].coltura === 'zucca' && n.magazzino.campo === 1 && n.tagliati[0] === 3)
  const { f } = mondo({ stato: JSON.parse(JSON.stringify(vecchio)), monete: 0 })
  uguale('il livello parte dal basso', f.livello(), 1)
  uguale('ma la pasticceria che si possiede si vede', f.macchina('pasticceria').posseduta, true)
  uguale('niente da avviare finché il livello non c\'è', f.avviaRicetta('pane').motivo, 'non-sbloccato')
  uguale('la cosa seminata prima cresce lo stesso', f.cose[0].coltura, 'zucca')
  const s2 = f.serializza()
  controlla('la riscrittura non salva la pasticceria due volte', !('pasticceria' in s2) && 'macchine' in s2)
  controlla('e si rilegge uguale', JSON.stringify(mondo({ stato: s2 }).f.serializza()) === JSON.stringify(s2))
  for (const rotto of [{ macchine: 5 }, { macchine: { mulino: { coda: [{ ric: 'pane' }], pronti: { pane: 3, farina: 'x' } } } }, { esperienza: -4 }, { esperienza: 'x' }, { posseduti: [] }]) {
    const x = normalizza(rotto)
    controlla(`uno stato rotto si rimette in forma (${JSON.stringify(rotto)})`, x.esperienza >= 0 && x.macchine.mulino.coda.length === 0 && Object.keys(x.macchine.mulino.pronti).every(k => RICETTE[k].dove === 'mulino'))
  }
}

riassunto('Fattoria 3D')
