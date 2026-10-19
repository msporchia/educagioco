/* Verifica della fattoria 3D, senza browser: i dati stanno in piedi, il terreno si compra solo se confina, i pezzi passano dal
   magazzino alla mappa e viceversa, i campi crescono e si tagliano una tessera alla volta, gli alberi si abbattono solo nel
   terreno proprio, le pecore hanno le loro fasi, la pasticceria cuoce uno alla volta anche a pagina chiusa, la mongolfiera
   torna, e lo stato si salva e si rilegge uguale.
   `node test/esegui.mjs fattoria3d`
   tempo: 1 */
import { guastiDelMondo, LOTTI, LOTTI_INIZIALI, lottoPerId, idx, PARTENZA } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { guastiDelCatalogo, PEZZI, EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { guastiDelleColture, COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { guastiDelleRicette, RICETTE, FORNO_POSTI } from '../../src/giochi/fattoria3d/dati/ricette.js'
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
const campoDi = f => f.s.cose.find(c => c.tipo === 'campo')

/* ══════════ 1. i dati ══════════ */
const guasti = [...guastiDelMondo(), ...guastiDelCatalogo(), ...guastiDelleColture(), ...guastiDelleRicette(COLTURE),
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

riassunto('Fattoria 3D')
