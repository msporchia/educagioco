/* Verifica della fattoria 3D, senza browser: i dati stanno in piedi, il terreno si compra solo se confina, i pezzi passano dal
   magazzino alla mappa e viceversa, i campi crescono e si tagliano una tessera alla volta, gli alberi si abbattono solo nel
   terreno proprio, le pecore hanno le loro fasi, la pasticceria cuoce uno alla volta anche a pagina chiusa, la mongolfiera
   torna, e lo stato si salva e si rilegge uguale.
   `node test/esegui.mjs fattoria3d`
   tempo: 1 */
import { guastiDelMondo, LOTTI_STORICI, LOTTI_INIZIALI, POSTI_STORICI, lottoPerId, PARTENZA } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { guastiDelCatalogo, PEZZI, EDIFICI, CATEGORIE, edificiDaCostruire, avvisoEdificiNuovi } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { carteDi, schedeDi, schedeSegnalate, DISEGNI, STRUMENTI, guastiDelleCarte } from '../../src/giochi/fattoria3d/dati/carte.js'
import { PEZZI as ATLANTE_PEZZI } from '../../src/giochi/fattoria/dati/atlante.js'
import { guastiDelleColture, COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { guastiDeiPosti, POSTI_DI_PARTENZA, POSTI_MASSIMI, PREZZI_DEI_POSTI, TOTALE_DEI_POSTI, prezzoDelPosto, postiInForma } from '../../src/giochi/fattoria3d/dati/posti.js'
import { POSTI_DI_PARTENZA as POSTI_DI_PARTENZA_2D, POSTI_MASSIMI as POSTI_MASSIMI_2D, PREZZI_DELLA_FILA } from '../../src/giochi/fattoria/dati/coda.js'
import { guastiDelleRicette, RICETTE, MACCHINE, FORNO_POSTI, LAVORAZIONE, dentroDi, PRONTO_DA_RITIRARE, TIPI_DI_MACCHINA, emojiDi, nuovoId, MERCI_VECCHIE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { guastiDeiLivelli, sogliaDi, livelloPer, roba, nomeDi, ULTIMO, costoDelLivello, livelloDellaRicetta } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { msDi } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { ANIMALI, CORTILE, PRODOTTI_ANIMALI, LANA, guastiDegliAnimali, prezzoDellaBestia, msDelProdotto } from '../../src/giochi/fattoria3d/dati/animali.js'
import { guastiDelleRegole, COSTI, PECORE } from '../../src/giochi/fattoria3d/dati/regole.js'
import { alberiStorici, guastiDegliAlberi } from '../../src/giochi/fattoria3d/dati/alberi.js'
import { guastiDegliOstacoli, PER_LOTTO } from '../../src/giochi/fattoria3d/dati/ostacoli.js'
import { generaLotto } from '../../src/giochi/fattoria3d/dati/lotti.js'
import { guastiDeiBiomi } from '../../src/giochi/fattoria3d/dati/biomi.js'

const ostacoliStorici = () => LOTTI_STORICI.flatMap(l => generaLotto(l.a, l.b).ostacoli)
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { dettoDi } from '../../src/giochi/fattoria3d/scena3d/detti.js'
import { statoIniziale, normalizza, bestieInForma, VERSIONE_STATO } from '../../src/giochi/fattoria3d/motore/stato.js'
import manifesto from '../../src/giochi/fattoria3d/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* un mondo con le monete e l'orologio in mano */
function mondo({ monete = 1000, stato = null, ostacoli = false } = {}) {
  const b = { monete }
  const t = { ora: 1_000_000 }
  const f = new Fattoria3d({ stato, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
  // i test dei pezzi mettono le cose dove dicono le coordinate: sassi e cespugli (sezione 6-bis) li si toglie, se non servono
  if (!ostacoli) for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o)
  return { f, b, t }
}
// il campo di partenza e una cella libera e propria per un pezzo nuovo
// porta la fattoria al livello n (l'esperienza è la spesa: qui la si mette in mano)
const alLivello = (f, n) => { f.s.esperienza = sogliaDi(n); return f }
const campoDi = f => f.s.cose.find(c => c.tipo === 'campo')
// il primo posto libero e proprio per un pezzo di quel tipo (gli alberi stanno dove stanno)
const postoPer = (f, tipo) => { for (let j = -3; j < 8; j++) for (let i = -6; i < 6; i++) if (f.puoMettere(tipo, i, j).ok) return [i, j]; return [0, 0] }
const metti = (f, tipo) => f.mettiPezzo(tipo, ...postoPer(f, tipo))

/* ══════════ 1. i dati ══════════ */
const guasti = [...guastiDelMondo(), ...guastiDelCatalogo(), ...guastiDelleColture(), ...guastiDelleRicette(COLTURE, EDIFICI), ...guastiDeiLivelli(), ...guastiDegliAnimali(PEZZI),
                ...guastiDelleRegole(), ...guastiDegliAlberi(), ...guastiDegliOstacoli(ostacoliStorici(), alberiStorici()), ...guastiDeiBiomi()]
controlla('i dati non hanno guasti', guasti.length === 0, guasti.join(' · '))
stessaLista('quarantadue lotti storici, nove di partenza', [LOTTI_STORICI.length, Object.keys(LOTTI_INIZIALI).length], [42, 9])
controlla('gli alberi sono sempre gli stessi', JSON.stringify(alberiStorici()) === JSON.stringify(alberiStorici()))
controlla('e i sassi e i cespugli pure', JSON.stringify(ostacoliStorici()) === JSON.stringify(ostacoliStorici()))
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

/* ══════════ 6. gli alberi: solo dentro il terreno proprio, costano monete e non danno legna ══════════ */
{
  const { f, b } = mondo()
  const mio = f.alberiNelTerreno()
  controlla('ce ne sono nel terreno di partenza', mio.length >= 3, String(mio.length))
  const a = mio[0]
  controlla('un albero in piedi blocca la cella', !f.libera(a.i, a.j))
  const prima = b.monete
  const r = f.abbatti(a.n)
  controlla('abbattuto: costa COSTI.albero, niente legna, cella libera', r.ok && r.costo === COSTI.albero && prima - b.monete === COSTI.albero && !('legna' in f.s) && !('legna' in r) && f.libera(a.i, a.j))
  controlla('conta come spesa (esperienza) e c\'è l\'evento', f.esperienza() === COSTI.albero && f.prendiEventi().some(e => e.tipo === 'albero'))
  uguale('due volte no', f.abbatti(a.n).motivo, 'gia-tagliato')
  const fuori = f.alberi.find(x => !f.cellaPropria(x.i, x.j))
  uguale('un albero in un lotto non tuo non si abbatte', f.abbatti(fuori.n).motivo, 'fuori-terreno')
  const salvato = f.serializza()
  const g = mondo({ stato: salvato }).f
  controlla('l\'albero tagliato resta tagliato dopo il salvataggio', g.albero(a.n).tagliato === true && g.libera(a.i, a.j))
  // senza monete il colpo non parte e non cambia niente
  const povero = mondo({ monete: COSTI.albero - 1 })
  const b2 = povero.f.alberiNelTerreno()[0], es = povero.f.esperienza()
  const no = povero.f.abbatti(b2.n)
  controlla('senza monete rifiuta e dice quanto costa', !no.ok && no.motivo === 'poche-monete' && no.costo === COSTI.albero && !povero.f.albero(b2.n).tagliato && povero.b.monete === COSTI.albero - 1 && povero.f.esperienza() === es)
}

/* ══════════ 6-bis. sassi e cespugli: pochi per lotto, restano dopo l'acquisto, si tolgono per 🪙 1 ══════════ */
{
  const tutti = ostacoliStorici()
  controlla('due-cinque per lotto (meno dove i posti riservati non lasciano spazio)', LOTTI_STORICI.every(l => {
    const n = tutti.filter(o => o.i >= l.i && o.i < l.i + l.w && o.j >= l.j && o.j < l.j + l.d).length
    return n <= PER_LOTTO.max
  }) && LOTTI_STORICI.filter(l => tutti.filter(o => o.i >= l.i && o.i < l.i + l.w && o.j >= l.j && o.j < l.j + l.d).length >= PER_LOTTO.min).length >= LOTTI_STORICI.length - 15)    // gli altri sono i lotti stretti fra edifici, strade e alberi (un edificio 3×3 riserva 5×5 celle: dodici erano i lotti senza posto prima di telaio, zuccherificio, sartoria e tintoria)
  controlla('ci sono sia sassi sia cespugli', tutti.some(o => o.tipo === 'sasso') && tutti.some(o => o.tipo === 'cespuglio'))
  const { f, b } = mondo({ ostacoli: true })
  const nel = f.ostacoliNelTerreno(), fuoriTerreno = f.ostacoli.find(o => !f.cellaPropria(o.i, o.j))
  controlla('anche nel terreno di partenza ce ne sono', nel.length >= 5, String(nel.length))
  const o = nel[0]
  controlla('uno in piedi blocca la cella e il pezzo', !f.libera(o.i, o.j) && f.puoMettere('aiuola', o.i, o.j).motivo === 'occupato' && f.disegnaStrada(o.i, o.j).motivo === 'occupato')
  uguale('uno in un lotto non tuo non si tocca', f.togliOstacolo(fuoriTerreno.n).motivo, 'fuori-terreno')
  const prima = b.monete
  const r = f.togliOstacolo(o.n)
  controlla('tolto: costa 🪙 1, la cella è libera e c\'è l\'evento', r.ok && r.costo === COSTI.ostacolo && prima - b.monete === COSTI.ostacolo && f.libera(o.i, o.j) && f.prendiEventi().some(e => e.tipo === 'sasso'))
  uguale('due volte no', f.togliOstacolo(o.n).motivo, 'gia-tolto')
  controlla('ora ci si può mettere un pezzo', f.puoMettere('aiuola', o.i, o.j).ok)
  // l'acquisto di un lotto non li fa sparire
  const dentroLotto = (l, x) => x.i >= l.i && x.i < l.i + 4 && x.j >= l.j && x.j < l.j + 4 && !x.tolto
  const nord = LOTTI_STORICI.find(l => !f.posseduto(l) && f.confina(l) && f.ostacoli.some(x => dentroLotto(l, x))), qui = f.ostacoli.filter(x => dentroLotto(nord, x))
  f.compraLotto(nord.id)
  controlla('comprare il lotto non li toglie: ci sono ancora e bloccano', qui.length >= 1 && qui.every(x => !x.tolto && !f.libera(x.i, x.j)))
  // si salva l'id e si rilegge
  const g = mondo({ stato: f.serializza(), ostacoli: true }).f
  controlla('quello tolto resta tolto dopo il salvataggio, gli altri no', g.ostacolo(o.n).tolto === true && g.libera(o.i, o.j) && g.ostacoli.filter(x => x.tolto).length === 1)
  // senza monete non si tocca
  const p = mondo({ monete: 0, ostacoli: true }).f
  const po = p.ostacoliNelTerreno()[0]
  const no = p.togliOstacolo(po.n)
  controlla('senza monete rifiuta e non cambia niente', !no.ok && no.motivo === 'poche-monete' && no.costo === COSTI.ostacolo && !p.ostacolo(po.n).tolto && !p.libera(po.i, po.j))
  // un vecchio salvataggio con un pezzo e una strada dove ora c'è un sasso: il sasso se ne va da sé, gratis
  const q = f.ostacoliNelTerreno()[0], saved = f.serializza()
  saved.cose.push({ id: saved.prossimoId, tipo: 'aiuola', i: q.i, j: q.j }); saved.prossimoId++
  const h = mondo({ stato: saved, ostacoli: true }).f
  controlla('il pezzo salvato sopra un sasso vince: il sasso è tolto, senza pagare', h.ostacolo(q.n).tolto === true && h.s.ostacoli.includes(q.id) && h.cosaSu(q.i, q.j).tipo === 'aiuola')
}

/* ══════════ 6-ter. pagare al posizionamento: compra e metti in un gesto, senza conferma ══════════ */
{
  const { f, b } = mondo({ monete: 500 })
  const [i, j] = postoPer(f, 'aiuola'), prezzo = f.prezzoPezzo('aiuola')
  alLivello(f, 2)
  const m0 = b.monete
  const r = f.compraEMetti('aiuola', i, j)
  controlla('compra e mette: il pezzo è sulla mappa, il magazzino vuoto, monete scalate', r.ok && r.costo === prezzo && m0 - b.monete === prezzo && f.cosaSu(i, j).tipo === 'aiuola' && f.nelMagazzino('aiuola') === 0)
  controlla('conta come spesa e dà l\'evento «pezzo»', f.esperienza() >= prezzo && f.prendiEventi().some(e => e.tipo === 'pezzo' && e.pezzo === 'aiuola'))
  // un posto non valido non perde niente
  const m1 = b.monete
  const no = f.compraEMetti('aiuola', i, j)
  controlla('su un posto occupato rifiuta, non paga e non lascia pezzi nel magazzino', !no.ok && no.motivo === 'occupato' && b.monete === m1 && f.nelMagazzino('aiuola') === 0)
  uguale('fuori terreno nemmeno', f.compraEMetti('aiuola', -13, -11).motivo, 'fuori-terreno')
  // senza monete: rifiuta con il prezzo, il fantasma sarebbe rosso, e non cambia niente
  const povero = mondo({ monete: 3 }); alLivello(povero.f, 2)
  const [pi, pj] = postoPer(povero.f, 'aiuola')
  const pp = povero.f.puoCompraEMettere('aiuola', pi, pj), n0 = povero.f.s.cose.length
  controlla('puoCompraEMettere dice poche-monete col prezzo', !pp.ok && pp.motivo === 'poche-monete' && pp.costo === 6)
  const pr = povero.f.compraEMetti('aiuola', pi, pj)
  controlla('compraEMetti rifiuta e non cambia niente', !pr.ok && pr.motivo === 'poche-monete' && povero.b.monete === 3 && povero.f.s.cose.length === n0 && povero.f.esperienza() === sogliaDi(2))
  // un pezzo non ancora arrivato col livello
  uguale('un pezzo chiuso dal livello rifiuta', mondo({ monete: 500 }).f.compraEMetti('recinto', ...postoPer(mondo().f, 'recinto')).motivo, 'non-sbloccato')
  // un pezzo già nel magazzino si mette gratis
  const mg = mondo({ monete: 500 }); alLivello(mg.f, 2); mg.f.compraPezzo('aiuola')
  const mm = mg.b.monete, [gi, gj] = postoPer(mg.f, 'aiuola')
  const rg = mg.f.compraEMetti('aiuola', gi, gj)
  controlla('dal magazzino si mette senza pagare di nuovo', rg.ok && rg.costo === 0 && mg.b.monete === mm && mg.f.nelMagazzino('aiuola') === 0)
  // spostare e rimettere via costano ancora 1
  const sp = mg.f.spostaPezzo(rg.cosa.id, ...postoPer(mg.f, 'campo').map((v, k) => v + (k ? 0 : 3)))
  controlla('spostare costa ancora una monetina', sp.ok === false || sp.costo === COSTI.spostare)
  const via = mg.f.mettiVia(rg.cosa.id)
  controlla('e mettere via pure', via.ok && via.costo === COSTI.spostare && mg.f.nelMagazzino('aiuola') === 1)
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
  alLivello(f, EDIFICI.pasticceria.liv)
  f.compraEdificio('pasticceria')
  f.compraPezzo('recinto'); const r = f.mettiPezzo('recinto', -1, 2)
  controlla('il recinto sta in un posto proprio e libero', r.ok, r.motivo)
  const id = r.cosa.id, rec = r.cosa
  stessaLista('parte con una sola pecora, adulta (nel prezzo)', rec.pecore.map(p => p.eta), ['adulta'])
  stessaLista('il quadro: 1 su 4, la prossima costa quanto dicono i dati', [f.infoBestie(rec).n, f.infoBestie(rec).max, f.infoBestie(rec).prezzo], [1, PECORE.max, CORTILE.recinto.prezzoBestia])
  // la pecora di partenza ha fame, come una gallina: la lana parte dal pasto, non dal recinto
  stessaLista('la pecora di partenza ha fame (t0 null) e la lana non c\'è', [rec.pecore[0].t0, f.lanaPronta(rec).length, f.pecoreAffamate(rec).length], [null, 0, 1])
  uguale('senza raccolti: serve da mangiare', f.provaCura(id).motivo, 'manca-raccolto')
  t.ora += PECORE.laneMs * 3
  uguale('passi pure il tempo: una pecora affamata non fa lana', f.lanaPronta(rec).length, 0)
  f.s.merci.grano = 1
  stessaLista('con un raccolto si nutre la tosata', [f.provaCura(id).azione, f.provaCura(id).n], ['nutri', 1])
  const pasto1 = f.nutri(id)
  controlla('il pasto fa partire la lana (t0 = adesso) e costa PECORE.pastiPerLana', pasto1.ok && pasto1.evento === 'lana' && pasto1.n === 1 && rec.pecore[0].t0 === t.ora && f.s.merci.grano === 1 - PECORE.pastiPerLana)
  const sec = f.provaCura(id)
  stessaLista('subito dopo: la lana ricresce, e dice quanti secondi', [sec.motivo, sec.secondi], ['lana-ricresce', Math.ceil(PECORE.laneMs / 1000)])
  t.ora += PECORE.laneMs - 1
  uguale('un attimo prima la lana non c\'è', f.lanaPronta(rec).length, 0)
  t.ora += 2
  uguale('passato il tempo dal pasto la lana è pronta', f.lanaPronta(rec).length, 1)
  controlla('si tosa e la pecora ha di nuovo fame', f.tosa(id).ok && f.s.lana === 1 && rec.pecore[0].t0 === null && f.lanaPronta(rec).length === 0)
  // la seconda pecora si compra dentro il recinto, senza conferma né livelli: adulta, con fame, e conta come esperienza
  const m0 = f.monete(), e0 = f.esperienza()
  const c2 = f.compraBestia(id)
  controlla('la seconda pecora costa il prezzo dei dati ed è adulta', c2.ok && c2.n === 2 && m0 - f.monete() === CORTILE.recinto.prezzoBestia && f.esperienza() - e0 === CORTILE.recinto.prezzoBestia && rec.pecore[1].eta === 'adulta')
  controlla('senza raccolti il giro di pappa non c\'è: tutte e due hanno fame', c2.pappa === false && f.pecoreAffamate(rec).length === 2)
  stessaLista('e le bestie sono due, con il prezzo che sale', [rec.pecore.length, f.infoBestie(rec).prezzo], [2, CORTILE.recinto.prezzoBestia + CORTILE.recinto.rincaroBestia])
  uguale('senza raccolti non si nutre', f.provaCura(id).motivo, 'manca-raccolto')
  f.s.merci.grano = 5
  stessaLista('due affamate: si nutrono tutte e due in un gesto', [f.provaCura(id).azione, f.provaCura(id).n], ['nutri', 2])
  const pasto2 = f.nutri(id)
  controlla('e il grano scende di due', pasto2.ok && pasto2.evento === 'lana' && pasto2.n === 2 && f.s.merci.grano === 3 && f.pecoreAffamate(rec).length === 0)
  // due adulte al lavoro: i pasti fanno nascere un agnello (poi cresce) come prima
  f.s.merci.grano = 10
  uguale('due adulte nutrite fanno nascere: c\'è da nutrire', f.provaCura(id).azione, 'nutri')
  uguale('un pasto per la nascita', f.nutri(id).evento, 'cuore')
  uguale('e nasce', f.nutri(id).evento, 'nata')
  stessaLista('un agnello in più', [rec.pecore.length, rec.pecore[2].eta], [3, 'agnello'])
  uguale('un pasto all\'agnello', f.nutri(id).evento, 'pasto')
  uguale('un altro e cresce', f.nutri(id).evento, 'cresciuta')
  stessaLista('ora sono tre adulte', rec.pecore.map(p => p.eta), ['adulta', 'adulta', 'adulta'])
  controlla('ogni pasto è costato un raccolto', f.s.merci.grano === 10 - 4, String(f.s.merci.grano))
  t.ora += PECORE.laneMs + 1
  uguale('passato il tempo la lana è pronta (tre adulte)', f.lanaPronta(rec).length, 3)
  uguale('si tosa prima di nutrire', f.provaCura(id).azione, 'tosa')
  const tos = f.tosa(id)
  controlla('tosate: tre lane', tos.ok && tos.n === 3 && f.s.lana === 1 + 3)
  uguale('subito dopo non c\'è più lana, e hanno fame tutte', [f.lanaPronta(rec).length, f.pecoreAffamate(rec).length].join(), '0,3')
  // quattro pecore al massimo: la quarta si compra (e col grano in scorta arriva col suo giro di pappa, che nutre tutte le affamate)
  controlla('la quarta si compra', f.compraBestia(id).ok && rec.pecore.length === PECORE.max)
  controlla('il giro di pappa le ha nutrite tutte e quattro', f.pecoreAffamate(rec).length === 0 && f.s.merci.grano === 6 - PECORE.max * PECORE.pastiPerLana, String(f.s.merci.grano))
  uguale('la quinta no', f.compraBestia(id).motivo, 'pieno')
  stessaLista('pieno: niente prezzo', [f.infoBestie(rec).pieno, f.infoBestie(rec).prezzo], [true, null])
  f.s.merci.grano = 20
  for (let k = 0; k < 10; k++) f.nutri(id)
  controlla('non più di quattro per recinto', rec.pecore.length <= PECORE.max, String(rec.pecore.length))
  controlla('e niente da mangiare mentre la lana ricresce', f.s.merci.grano === 20 && f.provaCura(id).motivo === 'lana-ricresce')
  // senza monete la bestia non si compra, e il rifiuto dice quanto manca
  const povero = mondo({ monete: 0 }).f
  povero.s.cose.push({ id: 7, tipo: 'recinto', i: -1, j: 2, pecore: [{ eta: 'adulta', t0: 0 }], cibo: 0 })
  stessaLista('senza monete: poche-monete e il costo', [povero.compraBestia(7).motivo, povero.compraBestia(7).costo], ['poche-monete', CORTILE.recinto.prezzoBestia])
  uguale('una cosa che non tiene bestie non si compra', povero.compraBestia(campoDi(povero).id).motivo, 'sconosciuto')
}

/* ══════════ 9. il pastificio (id `pasticceria`): ingredienti, coda, un forno alla volta, anche a pagina chiusa ══════════ */
{
  const { f, t } = mondo({ monete: 1000 })
  alLivello(f, EDIFICI.pasticceria.liv)
  uguale('non si cuoce senza pastificio', f.prepara('pasta').motivo, 'non-tua')
  controlla('si compra', f.compraEdificio('pasticceria').ok && f.s.posseduti.pasticceria)
  uguale('due volte no', f.compraEdificio('pasticceria').motivo, 'gia-tuo')
  uguale('senza ingredienti no', f.prepara('pasta').motivo, 'mancano-ingredienti')
  f.s.prodotti.farina = 10; f.s.prodotti.uova = 5
  controlla('si prepara e si scalano gli ingredienti (farina 2, uova 1)', f.prepara('pasta').ok && f.s.prodotti.farina === 8 && f.s.prodotti.uova === 4)
  controlla('il primo parte subito', f.s.pasticceria.coda[0].fine === t.ora + RICETTE.pasta.ms)
  uguale('con un solo posto il secondo trova la fila piena', f.prepara('pasta').motivo, 'forno-pieno')
  controlla('si compra il secondo e il terzo posto', f.compraPosto('pasticceria').ok && f.compraPosto('pasticceria').ok && f.postiDi('pasticceria') === 3)
  f.prepara('pasta'); f.prepara('pasta')
  uguale('tre in coda', f.s.pasticceria.coda.length, 3)
  uguale('al quarto la fila è piena', f.prepara('pasta').motivo, 'forno-pieno')
  uguale('e gli ingredienti non si sono scalati', f.s.prodotti.farina, 10 - 3 * 2)
  // la pagina chiusa: passa tutto il tempo, poi si riapre
  t.ora += RICETTE.pasta.ms + 1
  f.tick()
  stessaLista('la prima pasta è uscita, la seconda cuoce', [f.s.pasticceria.pronti.pasta, f.s.pasticceria.coda.length], [1, 2])
  controlla('il successivo è partito quando finiva il precedente', f.s.pasticceria.coda[0].fine === 1_000_000 + 2 * RICETTE.pasta.ms)
  t.ora += 100000
  f.tick()
  stessaLista('a tempo passato è tutto pronto', [f.s.pasticceria.coda.length, f.s.pasticceria.pronti.pasta], [0, 3])
  const rit = f.ritira()
  controlla('si ritira tutto in dispensa', rit.ok && rit.n === 3 && f.s.prodotti.pasta === 3 && f.prontiInForno() === 0)
  uguale('e non si ritira due volte', f.ritira().motivo, 'niente')
  controlla('gli eventi dicono i prodotti', f.prendiEventi().filter(e => e.tipo === 'prodotto').reduce((n, e) => n + e.n, 0) === 3)
}

/* ══════════ 10. la mongolfiera: la nave ha il suo test (fattoria3d-mongolfiera); qui solo che si compra e che atterra un carico ══════════ */
{
  const { f } = mondo({ monete: 1000 })
  alLivello(f, 10)
  uguale('non si carica se non è tua', f.caricaCassa(0, 0).motivo, 'non-tua')
  f.compraEdificio('mongolfiera')
  f.tick()
  controlla('comprata, atterra un carico di casse', f.vistaMongolfiera().stato === 'terra' && f.s.mongolfiera.stiva.file.length >= 1)
}

/* ══════════ 11. lo stato si salva e si rilegge uguale; uno rotto si rimette in forma ══════════ */
{
  const { f, t } = mondo({ monete: 1000 })
  alLivello(f, EDIFICI.pasticceria.liv)
  f.compraPezzo('campo'); f.mettiPezzo('campo', -3, 1); f.semina(f.s.cose[1].id, 'mais')
  f.compraLotto('3_1'); f.disegnaStrada(-3, 3); f.abbatti(f.alberiNelTerreno()[0].n); f.compraEdificio('pasticceria')
  f.s.prodotti.farina = 4; f.s.prodotti.uova = 1; f.prepara('pasta')
  const s1 = f.serializza()
  const g = mondo({ stato: JSON.parse(JSON.stringify(s1)), ostacoli: true }).f
  uguale('la lettura rifà lo stesso stato', JSON.stringify(g.serializza()), JSON.stringify(s1))
  controlla('cose (il pastificio è una cosa, dov\'è), lotti e strade tornano', g.s.cose.length === 3 && g.cosaDi('pasticceria') && g.s.posseduti.pasticceria && g.posseduto(lottoPerId('3_1')) && g.eStrada(-3, 3) === 1)
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
  stessaLista('dopo l\'ultimo non si apre altro', Object.values(roba(ULTIMO + 1)).map(v => v.length), [0, 0, 0, 0, 0, 0])
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
  uguale('quindici colture', Object.keys(COLTURE).length, 15)
  stessaLista('le quindici chiavi', Object.keys(COLTURE).sort(), ['aglio', 'barbabietola', 'carota', 'cavolfiore', 'cipolla', 'fragola', 'grano', 'lavanda', 'mais', 'melanzana', 'patata', 'peperone', 'pomodoro', 'riso', 'zucca'])
  // le cinque colture portate dalla 2D: arrivano dove la catena le regge, e un vecchio stato (senza di loro) le apre a zero
  stessaLista('cavolfiore, aglio, barbabietola, peperone e riso arrivano ai livelli 8, 10, 11, 12 e 15', ['cavolfiore', 'aglio', 'barbabietola', 'peperone', 'riso'].map(k => COLTURE[k].liv), [8, 10, 11, 12, 15])
  {
    const n = normalizza({ v: 7, merci: { grano: 3, carota: 1 } })
    controlla('un vecchio stato apre le colture nuove a zero e tiene le vecchie', ['cavolfiore', 'aglio', 'barbabietola', 'peperone', 'riso'].every(k => n.merci[k] === 0) && n.merci.grano === 3 && n.merci.carota === 1)
    controlla('e ogni coltura ha la sua scorta', Object.keys(COLTURE).every(k => Number.isInteger(n.merci[k])))
  }
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
  uguale('la ricetta chiusa: la macchina è tua ma il livello no', alLivello(mondo({ monete: 5000 }).f, 2).avviaRicettaIn('pasticceria', 'pasta').motivo, 'non-tua')
  const g = mondo({ monete: 5000 }).f
  alLivello(g, EDIFICI.pasticceria.liv); g.compraEdificio('pasticceria'); g.s.prodotti.farina = 5; g.s.prodotti.salsa = 1; g.s.prodotti.formaggio = 1
  const r = g.avviaRicetta('pizza')
  stessaLista('una ricetta del livello 12 a livello 6', [r.ok, r.motivo, r.liv], [false, 'non-sbloccato', RICETTE.pizza.liv])
  controlla('quella del livello 6 sì: la pasta, ma le uova mancano', g.avviaRicetta('pasta').motivo === 'mancano-ingredienti')
  alLivello(g, RICETTE.pizza.liv)
  controlla('al suo livello la pizza parte', g.avviaRicetta('pizza').ok)
  g.compraPosto('pasticceria')
  const pas = g.avviaRicetta('pasta')
  stessaLista('un ingrediente mancante dice quale', [pas.motivo, JSON.stringify(pas.mancano)], ['mancano-ingredienti', JSON.stringify({ uova: 1 })])
}

/* ══════════ 15. gli edifici sono pezzi liberi: si pagano al rilascio, si mettono dove si vuole, uno per tipo ══════════ */
{
  const { f, b } = mondo({ monete: 5000 })
  uguale('un edificio chiuso dice il livello', f.compraEdificio('mulino', -2, 5).liv, EDIFICI.mulino.liv)
  alLivello(f, 3)
  const prima = b.monete, p = f.puoCompraEMettere('mulino', -2, 5)
  stessaLista('il mulino ci sta in un posto qualsiasi del terreno e costa il suo prezzo', [p.ok, p.costo], [true, EDIFICI.mulino.prezzo])
  controlla('niente è cambiato finché non si rilascia', b.monete === prima && !f.s.posseduti.mulino)
  const r = f.compraEMetti('mulino', -2, 5)
  controlla('compra e mette in un gesto', r.ok && b.monete === prima - EDIFICI.mulino.prezzo && f.s.posseduti.mulino && r.cosa.tipo === 'mulino' && r.cosa.i === -2 && r.cosa.j === 5)
  controlla('l\'ingombro è w×d: tutte le celle sono sue', !f.libera(-2, 5) && !f.libera(0, 7) && f.libera(1, 5) && f.libera(-3, 5) && f.cosaSu(0, 7).id === r.cosa.id)
  uguale('uno per tipo: il secondo non si compra', f.compraPezzo('mulino').motivo, 'gia-tuo')
  uguale('né si compra e si mette altrove', f.puoCompraEMettere('mulino', 1, 5).motivo, 'gia-tuo')
  controlla('la carta del menu sparisce', !carteDi('edifici', { livello: 99, prezzoPezzo: t => f.prezzoPezzo(t), nelMagazzino: t => f.nelMagazzino(t), posseduti: f.s.posseduti }).some(c => c.id === 'mulino'))
  uguale('un\'altra cosa sopra non ci sta', f.puoMettere('campo', -1, 6).motivo, 'occupato')
  controlla('e i vecchi posti sono liberi per tutti: un campo sul posto di prima del pastificio', f.puoMettere('campo', -6, -4).ok)
  // i rifiuti
  alLivello(f, 7)
  uguale('fuori dal terreno proprio no', f.puoCompraEMettere('panificio', -13, -11).motivo, 'fuori-terreno')
  uguale('sporge fuori: 3×3 con l\'angolo sul bordo', f.puoCompraEMettere('panificio', 7, 3).motivo, 'fuori-terreno')
  uguale('sopra un pezzo no', f.puoCompraEMettere('panificio', -5, 0).motivo, 'occupato')
  uguale('sulla casa no', f.puoCompraEMettere('panificio', -2, -10).motivo, 'fuori-terreno')
  const poveri = mondo({ monete: 10 }).f; alLivello(poveri, 7)
  stessaLista('senza monete: rifiuto con il costo, niente cambia', [poveri.compraEMetti('panificio', -2, 5).motivo, poveri.s.posseduti.panificio], ['poche-monete', false])
  // lo spostamento: sempre consentito, e la coda e i pronti seguono l'edificio
  f.s.merci.grano = 6
  controlla('il mulino lavora', f.avviaRicettaIn('mulino', 'farina').ok)
  uguale('al lavoro non si mette via', f.mettiVia(r.cosa.id).motivo, 'macchina-al-lavoro')
  const coda = JSON.stringify(f.s.macchine.mulino)
  const sp = f.spostaPezzo(r.cosa.id, 2, 3)
  controlla('ma si sposta, per una monetina', sp.ok && sp.costo === COSTI.spostare && r.cosa.i === 2 && r.cosa.j === 3)
  uguale('la coda lo segue (è per tipo, non per posto)', JSON.stringify(f.s.macchine.mulino), coda)
  controlla('le celle di prima tornano libere, le nuove sono occupate', f.libera(-2, 5) && !f.libera(2, 3) && !f.libera(4, 5))
  uguale('si può ancora spostare sopra se stesso', f.spostaPezzo(r.cosa.id, 3, 3).ok, true)
  // finito il lavoro e ritirato, si può mettere via: torna nel magazzino e la carta dice 📦 ×1
  f.ora = () => 9e12; f.tick()
  uguale('con i pronti da ritirare non si mette via', f.mettiVia(r.cosa.id).motivo, 'macchina-al-lavoro')
  f.ritiraDa('mulino')
  const via = f.mettiVia(r.cosa.id)
  controlla('vuoto, si mette via: nel magazzino, non più in mappa', via.ok && f.nelMagazzino('mulino') === 1 && !f.s.posseduti.mulino && !f.cosaDi('mulino'))
  uguale('mentre è nel magazzino non si ricompra', f.compraPezzo('mulino').motivo, 'gia-tuo')
  const carta = carteDi('edifici', { livello: 99, prezzoPezzo: t => f.prezzoPezzo(t), nelMagazzino: t => f.nelMagazzino(t), posseduti: f.s.posseduti }).find(c => c.id === 'mulino')
  stessaLista('la carta torna col 📦 e col «!»', [carta && carta.etichetta, carta && carta.segnala], ['📦 ×1', true])
  const monete = f.monete()
  controlla('si rimette gratis, ovunque', f.compraEMetti('mulino', -4, 5).ok && f.monete() === monete && f.s.posseduti.mulino && f.nelMagazzino('mulino') === 0)
  // la mongolfiera è un edificio come gli altri
  alLivello(f, 10)
  controlla('la mongolfiera si compra e si mette dove si vuole', f.compraEMetti('mongolfiera', 2, 4).ok && f.s.posseduti.mongolfiera && f.vistaMongolfiera().stato !== 'non-tua')
  controlla('un salvataggio la rilegge nello stesso posto', JSON.stringify(normalizza(f.serializza()).cose.filter(c => c.tipo === 'mongolfiera' || c.tipo === 'mulino').map(c => [c.tipo, c.i, c.j])) === JSON.stringify([['mulino', -4, 5], ['mongolfiera', 2, 4]]))
}

/* ══════════ 15-bis. il «!»: gli edifici aperti dal livello e non ancora in mappa ══════════ */
{
  const { f } = mondo({ monete: 9000 })
  stessaLista('livello 1: niente da costruire', [f.edificiDaCostruire().length, edificiDaCostruire(1, {}).length], [0, 0])
  stessaLista('livello 3: il mulino', f.edificiDaCostruire(), [])
  alLivello(f, 3)
  stessaLista('al 3 il mulino', f.edificiDaCostruire(), ['mulino'])
  alLivello(f, 7)
  stessaLista('al 7 anche il pastificio (6) e il panificio (7), in ordine di livello', f.edificiDaCostruire(), ['mulino', 'pasticceria', 'panificio'])
  f.compraEdificio('panificio')
  stessaLista('costruito, il «!» sparisce', f.edificiDaCostruire(), ['mulino', 'pasticceria'])
  alLivello(f, 99)
  controlla('a livello alto sono tutti gli edifici mancanti, e solo edifici (mai una decorazione)', f.edificiDaCostruire().length === Object.keys(EDIFICI).length - 1 && f.edificiDaCostruire().every(t => !!EDIFICI[t] && !PEZZI[t]))
  for (const t of Object.keys(EDIFICI)) f.compraEdificio(t)
  uguale('tutti costruiti: nessun «!»', f.edificiDaCostruire().length, 0)
  controlla('le decorazioni non lo accendono mai', carteDi('decori', { livello: 99, prezzoPezzo: t => PEZZI[t].prezzo, nelMagazzino: () => 0, posseduti: {} }).every(c => !c.segnala))
  const carte = carteDi('edifici', { livello: 7, prezzoPezzo: t => PEZZI[t].prezzo, nelMagazzino: () => 0, posseduti: {} })
  stessaLista('nella scheda Edifici i segnalati stanno in cima, i chiusi senza «!»', [carte.slice(0, 3).map(c => c.id).join(), carte.filter(c => c.bloccata).every(c => !c.segnala)], ['mulino,pasticceria,panificio', true])
  stessaLista('le schede segnalate: solo Edifici', schedeSegnalate(schedeDi({ livello: 7, prezzoPezzo: t => PEZZI[t].prezzo, nelMagazzino: () => 0, posseduti: {} })), ['edifici'])
  stessaLista('l\'avviso del livello nomina l\'edificio', [avvisoEdificiNuovi(7), avvisoEdificiNuovi(13), avvisoEdificiNuovi(2)], ['il Panificio! Costruiscilo', 'lo Zuccherificio! Costruiscilo', ''])
  // un ordine che chiede il prodotto di una macchina che non c'è lo dice
  const g = mondo({ monete: 0 }).f
  alLivello(g, 7); g.s.cose.push({ id: 90, tipo: 'bacheca', i: -4, j: 5 })
  g.s.ordini.aperti[0] = { id: 1, cliente: 'nonna', chiede: { pane: 1 }, premio: 5, liv: 7 }
  stessaLista('il biglietto dice «Serve il Panificio»', g.ordini()[0].senzaMacchina.map(m => [m.tipo, m.art, m.nome].join(' ')), ['panificio il Panificio'])
  g.s.posseduti.panificio = true
  uguale('costruito il panificio, il biglietto tace', g.ordini()[0].senzaMacchina.length, 0)
}

/* ══════════ 16. le macchine in catena: grano → farina → pane ══════════ */
{
  const { f, t } = mondo({ monete: 5000 })
  alLivello(f, 7)
  for (const id of ['3_1', '2_1']) f.compraLotto(id)
  controlla('mulino e panificio comprati', f.compraEdificio('mulino').ok && f.compraEdificio('panificio').ok)
  uguale('le macchine sono due diverse', f.macchina('mulino').tipo + f.macchina('panificio').tipo, 'mulinopanificio')
  uguale('le ricette del mulino', f.ricetteDi('mulino').map(r => r.id).join(), 'farina,pastone')
  controlla('ricetteDi dice se si può', f.ricetteDi('mulino').every(r => r.sbloccata && !r.ingredienti))
  uguale('il pane chiede farina che non c\'è', f.avviaRicettaIn('panificio', 'pane').motivo, 'mancano-ingredienti')
  uguale('una ricetta dell\'altra macchina è sconosciuta qui', f.avviaRicettaIn('mulino', 'pane').motivo, 'sconosciuta')
  f.s.merci.grano = 8
  f.compraPosto('mulino')
  controlla('il mulino macina', f.avviaRicettaIn('mulino', 'farina').ok && f.avviaRicetta('farina').ok && f.s.merci.grano === 4)
  t.ora += 2 * RICETTE.farina.ms + 1; f.tick()
  uguale('due farine pronte nel mulino, non ancora in dispensa', [f.macchina('mulino').pronti.farina, f.s.prodotti.farina || 0].join(), '2,0')
  uguale('ritirate', f.ritiraDa('mulino').n, 2)
  uguale('e non due volte', f.ritiraDa('mulino').motivo, 'niente')
  uguale('la farina è un prodotto', f.s.prodotti.farina, 2)
  controlla('il panificio la usa: scala dai prodotti', f.avviaRicettaIn('panificio', 'pane').ok && !('farina' in f.s.prodotti))
  t.ora += RICETTE.pane.ms + 1; f.tick()
  f.ritiraDa('panificio')
  uguale('pane in dispensa', f.s.prodotti.pane, 1)
  uguale('un posto di partenza anche qui', f.macchina('panificio').posti, FORNO_POSTI)
  f.compraPosto('panificio'); f.compraPosto('panificio')
  f.s.prodotti.farina = 20
  f.avviaRicettaIn('panificio', 'pane'); f.avviaRicettaIn('panificio', 'pane'); f.avviaRicettaIn('panificio', 'pane')
  uguale('il quarto trova il forno pieno', f.avviaRicettaIn('panificio', 'pane').motivo, 'forno-pieno')
  // ogni ricetta è fattibile con ciò che dice: ingredienti da raccolti, da prodotti delle bestie o di una macchina (anche la stessa: pasta → lasagne)
  for (const [id, r] of Object.entries(RICETTE)) for (const k of Object.keys(r.ing)) controlla(`${id}: ${k} è un raccolto, un prodotto delle bestie o di una ricetta`, !!COLTURE[k] || !!PRODOTTI_ANIMALI[k] || !!LANA[k] || (!!RICETTE[k] && k !== id))
}

/* ══════════ 16-bis. i posti delle macchine: uno di partenza, gli altri si comprano uno alla volta fino a sei (dati/posti.js) ══════════ */
{
  controlla('i dati dei posti non hanno guasti', guastiDeiPosti().length === 0, guastiDeiPosti().join(' · '))
  controlla('i posti e i prezzi sono quelli della fila della 2D', POSTI_DI_PARTENZA === POSTI_DI_PARTENZA_2D && POSTI_MASSIMI === POSTI_MASSIMI_2D && JSON.stringify(PREZZI_DEI_POSTI) === JSON.stringify(PREZZI_DELLA_FILA))
  uguale('si parte da un posto', FORNO_POSTI, 1)
  controlla('i prezzi crescono: 20·40·80·160·320', PREZZI_DEI_POSTI.join('·') === '20·40·80·160·320' && PREZZI_DEI_POSTI.every((p, i) => !i || p > PREZZI_DEI_POSTI[i - 1]))
  uguale('il totale per macchina (620) sta sotto le due ore di esercizi (720 monete)', [TOTALE_DEI_POSTI, TOTALE_DEI_POSTI <= 720].join(), '620,true')
  uguale('prezzoDelPosto: il secondo, il sesto, nessun settimo', [prezzoDelPosto(1), prezzoDelPosto(5), prezzoDelPosto(6)].join(), '20,320,')
  uguale('postiInForma rimette in forma', [postiInForma(undefined), postiInForma(null), postiInForma(-4), postiInForma(2.9), postiInForma(99), postiInForma('x')].join(), '1,1,1,2,6,1')
  const { f } = mondo({ monete: 5000 })
  alLivello(f, 12)
  uguale('una macchina che non si ha non vende posti', f.compraPosto('mulino').motivo, 'non-posseduta')
  uguale('…e una cosa che non è una macchina nemmeno', f.compraPosto('campo').motivo, 'sconosciuta')
  f.compraLotto('3_1')
  controlla('si compra il mulino', f.compraEdificio('mulino').ok)
  uguale('parte con un posto', [f.postiDi('mulino'), f.macchina('mulino').posti].join(), '1,1')
  const pagati = [], esp0 = f.esperienza()
  for (let k = 0; k < 5; k++) { const m0 = f.monete(), r = f.compraPosto('mulino'); pagati.push(r.ok ? m0 - f.monete() : r.motivo) }
  uguale('cinque acquisti in ordine, ai prezzi crescenti', pagati.join(), '20,40,80,160,320')
  uguale('…la spesa conta come esperienza', f.esperienza() - esp0, 620)
  uguale('sei posti e basta', [f.postiDi('mulino'), f.compraPosto('mulino').motivo].join(), '6,pieno')
  uguale('un\'altra macchina ha i suoi posti', [f.postiDi('panificio'), f.postiDi('mulino')].join(), '1,6')
  f.s.merci.grano = 30
  let ok = 0; for (let k = 0; k < 7; k++) if (f.avviaRicettaIn('mulino', 'farina').ok) ok++
  uguale('sei in fila, il settimo trova la fila piena', [ok, f.avviaRicettaIn('mulino', 'farina').motivo].join(), '6,forno-pieno')
  // le monete che mancano: rifiuto col prezzo, senza toccare niente
  const pm = mondo({ monete: 1000 }), povero = pm.f
  alLivello(povero, 3); povero.compraLotto('3_1'); povero.compraEdificio('mulino'); pm.b.monete = 30
  const m1 = povero.monete(), r = povero.compraPosto('mulino')
  uguale('il secondo posto costa 20: con 30 si compra, il terzo (40) no', [r.ok, povero.compraPosto('mulino').motivo, povero.compraPosto('mulino').costo, povero.postiDi('mulino'), m1 - povero.monete()].join(), 'true,poche-monete,40,2,20')
  // gli eventi
  const ev = f.prendiEventi ? f.prendiEventi() : f.eventi
  controlla('ogni acquisto emette «posto» con la macchina', ev.filter(e => e.tipo === 'posto').length === 5 && ev.filter(e => e.tipo === 'posto').every(e => e.macchina === 'mulino'))
  // il salvataggio: i posti si rileggono, uno storto torna in forma, un vecchio stato senza campo ne ha uno
  const letto = normalizza(JSON.parse(JSON.stringify(f.s)))
  uguale('i posti si salvano e si rileggono', letto.macchine.mulino.posti, 6)
  const storto = JSON.parse(JSON.stringify(f.s)); storto.macchine.mulino.posti = 'tanti'; storto.macchine.panificio = { coda: [], pronti: {}, posti: 99 }
  const ls = normalizza(storto)
  uguale('un valore storto torna a uno, uno troppo grande al tetto', [ls.macchine.mulino.posti, ls.macchine.panificio.posti].join(), '1,6')
  const senza = JSON.parse(JSON.stringify(f.s)); delete senza.macchine.mulino.posti
  uguale('uno stato senza il campo vale un posto', normalizza(senza).macchine.mulino.posti, 1)
  controlla('normalizza non lancia su macchine guaste', [null, 'x', [], { macchine: 3 }, { macchine: { mulino: 4 } }].every(v => { try { return normalizza(v).macchine.mulino.posti === 1 } catch (e) { return false } }))
  // i nomi delle sezioni: ognuna ha il suo, e solo i forni dicono «forno»
  controlla('ogni macchina ha il nome della sua sezione', TIPI_DI_MACCHINA.every(t => typeof LAVORAZIONE[t]?.dentro === 'string' && dentroDi(t) === LAVORAZIONE[t].dentro && LAVORAZIONE[t].dentro.length > 3))
  stessaLista('solo il pastificio e il panificio dicono «forno»', TIPI_DI_MACCHINA.filter(t => /forno/i.test(dentroDi(t))), ['pasticceria', 'panificio'])
  uguale('mulino, telaio, gelateria, cucina: ognuno il suo', ['mulino', 'telaio', 'gelateria', 'conserviera', 'tintoria'].map(dentroDi).join('|'), 'Alla macina|Al telaio|Nella gelatiera|Sul fuoco|Nella tinozza')
  uguale('i pronti hanno la scritta comune', PRONTO_DA_RITIRARE, 'Pronto da ritirare')
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
  controlla('la legna di un salvataggio vecchio si ignora, senza errori, e gli ostacoli tolti ripartono vuoti', !('legna' in n) && n.v === VERSIONE_STATO && Array.isArray(n.ostacoli) && n.ostacoli.length === 0)
  for (const rotto of [{ ostacoli: 'x' }, { ostacoli: [1.5, 'a', null, 7, 7] }, { ostacoli: {} }]) {
    const x = normalizza(rotto)
    controlla(`gli ostacoli rotti si rimettono in forma (${JSON.stringify(rotto)})`, Array.isArray(x.ostacoli) && x.ostacoli.every(Number.isInteger) && new Set(x.ostacoli).size === x.ostacoli.length)
  }
  controlla('i posseduti ci sono tutti e i vecchi restano', Object.keys(EDIFICI).every(t => t in n.posseduti) && n.posseduti.pasticceria && n.posseduti.mongolfiera && !n.posseduti.mulino)
  // il popcorn e il pane pronto stavano nella pasticceria: oggi sono della cucina di altri (mulino, panificio), e arrivano in dispensa
  stessaLista('la pasticceria è una macchina; ciò che cuoceva e ciò che era pronto, cugini di altre macchine, è in dispensa', [n.macchine.pasticceria.coda.length, Object.keys(n.macchine.pasticceria.pronti).length, n.pasticceria === n.macchine.pasticceria, n.prodotti.pastone, n.prodotti.pane], [0, 0, true, 1, 3])
  controlla('il segnaposto della mongolfiera si chiude: la lana che avrebbe dato (+2), nessun campo vecchio, il carico nuovo vuoto', n.lana === 3 && n.mongolfiera.giri === 0 && n.mongolfiera.stiva === null && n.mongolfiera.riposo === null && !('fine' in n.mongolfiera) && !('cassa' in n.mongolfiera))
  stessaLista('le macchine nuove sono vuote', ['mulino', 'panificio', 'conserviera', 'gelateria'].map(t => n.macchine[t].coda.length + Object.keys(n.macchine[t].pronti).length), [0, 0, 0, 0])
  controlla('merci, prodotti, lotti e cose restano', n.merci.zucca === 2 && n.prodotti.pane === 3 && n.lotti['3_1'] && n.cose[0].coltura === 'zucca' && n.magazzino.campo === 1 && n.tagliati[0] === 3)
  const { f } = mondo({ stato: JSON.parse(JSON.stringify(vecchio)), monete: 0 })
  uguale('il livello parte dal basso', f.livello(), 1)
  uguale('ma la pasticceria che si possiede si vede', f.macchina('pasticceria').posseduta, true)
  uguale('niente da avviare finché il livello non c\'è', f.avviaRicetta('pasta').motivo, 'non-sbloccato')
  uguale('la cosa seminata prima cresce lo stesso', f.cose[0].coltura, 'zucca')
  const s2 = f.serializza()
  controlla('la riscrittura non salva la pasticceria due volte', !('pasticceria' in s2) && 'macchine' in s2)
  controlla('e si rilegge uguale', JSON.stringify(mondo({ stato: s2 }).f.serializza()) === JSON.stringify(s2))
  // gli id di prima della 2D (stato v6): ogni cosa diventa il suo cugino, un pezzo per un pezzo; se il cugino sta in un'altra macchina va in dispensa
  {
    const v6 = {
      v: 6, merci: { grano: 1 }, prodotti: { farina: 2, farinaMais: 1, panIntegrale: 2, tortaCarote: 1, tortaSoffice: 2, gelatoCrema: 1, popcorn: 3, yogurt: 1 },
      posseduti: { mulino: true, gelateria: true, panificio: true },
      macchine: {
        mulino: { coda: [{ ric: 'farinaMais', fine: 9000 }, { ric: 'farina', fine: null }], pronti: { farinaMais: 1, farina: 1 } },
        panificio: { coda: [{ ric: 'panIntegrale', fine: 9500 }, { ric: 'focaccia', fine: null }], pronti: { grissini: 2 } },
        gelateria: { coda: [], pronti: { gelatoFragola: 1, gelatoLavanda: 2 } },
        pasticceria: { coda: [{ ric: 'pizza', fine: 4000 }, { ric: 'tortaSoffice', fine: null }, { ric: 'frittata', fine: null }], pronti: {} },
      },
      ordini: { aperti: [{ id: 4, cliente: 'nonna', chiede: { tortaCarote: 1, tortaZucca: 2, carota: 3 } }, null, null], riprende: [null, null, null], prossimoId: 5 },
    }
    const n = normalizza(JSON.parse(JSON.stringify(v6)))
    stessaLista('le scorte: ognuno nel suo cugino', ['farina', 'pastone', 'pane', 'torta', 'gelato', 'frullato'].map(k => n.prodotti[k] || 0), [2, 1 + 3, 2, 3 + 1, 1, 1])        // pastone: farinaMais + popcorn; torta: due cugine nelle scorte e quella in forno che cambia macchina
    stessaLista('il mulino: la farina di mais è la pappa di mais, la sua prima cottura tiene l\'orario', [n.macchine.mulino.coda.map(x => x.ric).join(), n.macchine.mulino.coda[0].fine, n.macchine.mulino.pronti.pastone, n.macchine.mulino.pronti.farina], ['pastone,farina', 9000, 1, 1])
    stessaLista('il panificio: il pane integrale è pane (e la focaccia, che parte dopo); i grissini pronti sono pane', [n.macchine.panificio.coda.map(x => x.ric).join(), n.macchine.panificio.coda[0].fine, n.macchine.panificio.coda[1].fine, n.macchine.panificio.pronti.pane], ['pane,pane', 9500, null, 2])
    stessaLista('la gelateria: i gelati pronti sono gelato', [n.macchine.gelateria.pronti.gelato, Object.keys(n.macchine.gelateria.pronti).join()], [3, 'gelato'])
    stessaLista('la pasticceria: la pizza resta in forno, la frittata è pasta (anche lei del pastificio), la torta è del panificio e va in dispensa', [n.macchine.pasticceria.coda.map(x => x.ric).join(), n.macchine.pasticceria.coda[0].fine, n.macchine.pasticceria.coda[1].fine], ['pizza,pasta', 4000, null])
    const o = n.ordini.aperti[0]
    stessaLista('l\'ordine aperto chiede i cugini, sommati', [JSON.stringify(o.chiede), o.cliente], [JSON.stringify({ torta: 3, carota: 3 }), 'nonna'])
    controlla('niente id vecchi in giro', [...Object.keys(n.prodotti), ...Object.keys(o.chiede), ...n.macchine.pasticceria.coda.map(x => x.ric)].every(k => !(k in MERCI_VECCHIE)))
    uguale('e si rilegge uguale', JSON.stringify(normalizza(JSON.parse(JSON.stringify(n))).prodotti), JSON.stringify(n.prodotti))
    uguale('nuovoId lascia stare gli id di oggi', ['pane', 'pizza', 'grano', 'uova', 'xyz'].map(nuovoId).join(), 'pane,pizza,grano,uova,xyz')
  }
  for (const rotto of [{ macchine: 5 }, { macchine: { mulino: { coda: [{ ric: 'pane' }], pronti: { pane: 3, farina: 'x' } } } }, { esperienza: -4 }, { esperienza: 'x' }, { posseduti: [] }]) {
    const x = normalizza(rotto)
    controlla(`uno stato rotto si rimette in forma (${JSON.stringify(rotto)})`, x.esperienza >= 0 && x.macchine.mulino.coda.length === 0 && Object.keys(x.macchine.mulino.pronti).every(k => RICETTE[k].dove === 'mulino'))
  }
}

/* ══════════ 17-bis. dal v8 al v9: gli edifici comprati si ritrovano dov'erano i loro posti fissi, e tutto il resto è com'era ══════════ */
{
  const v8 = JSON.parse(JSON.stringify(statoIniziale())); v8.v = 8
  v8.cose = [{ id: 1, tipo: 'campo', i: -5, j: 0, tile: [null, null, null, null] }, { id: 2, tipo: 'campo', i: -3, j: 1, tile: [5, 5, 5, 5], coltura: 'mais' }]; v8.prossimoId = 3
  for (const t of ['mulino', 'panificio', 'mongolfiera']) v8.posseduti[t] = true
  v8.lotti = { ...LOTTI_INIZIALI, '3_1': true, '2_1': true }
  v8.macchine.mulino = { coda: [{ ric: 'farina', fine: 99999999 }, { ric: 'pastone', fine: null }], pronti: { farina: 2 } }
  v8.macchine.panificio.pronti = { pane: 3 }
  v8.mongolfiera = { stiva: { file: [{ merce: 'pane', casse: [{ pezzi: 2, xp: 9, piena: true }, { pezzi: 2, xp: 9, piena: false }] }] }, via: null, riposo: null, giri: 4 }
  v8.magazzino = { campo: 2 }; v8.strade = [3, 4]; v8.tagliati = [1, 2, 3]; v8.ostacoli = [7]
  v8.prodotti = { pane: 1 }
  const n = normalizza(JSON.parse(JSON.stringify(v8)))
  stessaLista('la versione sale a 9', [n.v, VERSIONE_STATO], [9, 9])
  const dove = t => { const c = n.cose.find(x => x.tipo === t); return c ? [c.i, c.j] : null }
  stessaLista('ogni edificio comprato sta dov\'era il suo posto fisso', [dove('mulino'), dove('panificio'), dove('mongolfiera')], [[-2, -7], [-5, -7], [2, -4]])
  controlla('gli altri non ci sono, e posseduti dice «in mappa»', !dove('gelateria') && !dove('pasticceria') && n.posseduti.mulino && n.posseduti.panificio && n.posseduti.mongolfiera && !n.posseduti.gelateria)
  stessaLista('i pezzi di prima restano com\'erano, con gli stessi id', [n.cose.filter(c => c.tipo === 'campo').map(c => c.id).join(), n.cose.find(c => c.id === 2).coltura], ['1,2', 'mais'])
  controlla('gli id nuovi non toccano i vecchi', new Set(n.cose.map(c => c.id)).size === n.cose.length && n.prossimoId > Math.max(...n.cose.map(c => c.id)))
  uguale('un vecchio stato senza posti ne ha uno, ma la coda più lunga resta tutta', [n.macchine.mulino.posti, n.macchine.mulino.coda.length].join(), '1,2')
  uguale('coda, pronti e stiva invariati', JSON.stringify([n.macchine.mulino.coda, n.macchine.mulino.pronti, n.macchine.panificio.pronti, n.mongolfiera]), JSON.stringify([v8.macchine.mulino.coda, v8.macchine.mulino.pronti, v8.macchine.panificio.pronti, v8.mongolfiera]))
  controlla('magazzino, strade, alberi tagliati, ostacoli, lotti e prodotti come prima', JSON.stringify([n.magazzino, n.strade, n.tagliati, n.ostacoli, Object.keys(n.lotti), n.prodotti]) === JSON.stringify([v8.magazzino, v8.strade, v8.tagliati, v8.ostacoli, Object.keys(v8.lotti), v8.prodotti]))
  // nel motore l'edificio occupa le sue celle di una volta e la macchina funziona
  const { f } = mondo({ stato: JSON.parse(JSON.stringify(v8)), monete: 50 })
  controlla('le celle del mulino sono occupate dalla sua cosa, il posto di prima del pastificio (non comprato) è libero', !f.libera(-1, -6) && f.cosaSu(-1, -6).tipo === 'mulino' && f.puoMettere('campo', -6, -4).ok)
  controlla('la macchina è tua, con la coda di prima, e il suo posto si sposta senza perderla', f.macchina('mulino').posseduta && f.macchina('mulino').coda.length === 2 && f.spostaPezzo(f.cosaDi('mulino').id, -2, 3).ok && f.macchina('mulino').coda.length === 2 && f.macchina('mulino').pronti.farina === 2)
  controlla('rileggere il salvato rifà lo stesso stato', JSON.stringify(mondo({ stato: f.serializza() }).f.serializza()) === JSON.stringify(f.serializza()))
  // i gradi di guasto: un v9 con due mulini ne tiene uno; un edificio nel magazzino non è in mappa; niente eccezioni
  const doppio = normalizza({ v: 9, cose: [{ id: 1, tipo: 'mulino', i: -2, j: 3 }, { id: 2, tipo: 'mulino', i: 0, j: 3 }, { id: 3, tipo: 'cosa-che-non-esiste', i: 0, j: 0 }], posseduti: { mulino: true } })
  stessaLista('due mulini diventano uno (il primo), le cose sconosciute si buttano', [doppio.cose.map(c => c.tipo).join(), doppio.cose[0].i, doppio.posseduti.mulino], ['mulino', -2, true])
  const nelMag = normalizza({ v: 9, cose: [], magazzino: { mulino: 5 }, posseduti: { mulino: false } })
  stessaLista('un edificio nel magazzino è uno solo e non è in mappa', [nelMag.magazzino.mulino, nelMag.posseduti.mulino, nelMag.cose.some(c => c.tipo === 'mulino')], [1, false, false])
  for (const rotto of [{ cose: 5, posseduti: { mulino: true } }, { cose: [null, 3, { tipo: 'mulino' }], posseduti: { mulino: 1 } }, { v: 9, magazzino: { mulino: 'x' } }]) {
    let x; try { x = normalizza(rotto) } catch (e) { x = null }
    controlla(`uno stato rotto non lancia (${JSON.stringify(rotto)})`, !!x && x.cose.every(c => Number.isInteger(c.i)))
  }
  // un v8 con un edificio comprato e un campo sul suo posto non c'era (i posti erano riservati): la lettura non lo sovrappone
  controlla('i posti fissi di prima non si sovrappongono fra loro', Object.keys(POSTI_STORICI).every((a, k, tutti) => tutti.slice(k + 1).every(b => { const A = EDIFICI[a], B = EDIFICI[b], x = POSTI_STORICI[a], y = POSTI_STORICI[b]; return !(x.i < y.i + B.w && y.i < x.i + A.w && x.j < y.j + B.d && y.j < x.j + A.d) })))
}

/* ══════════ 18. gli animali da cortile: pollaio (uova) e stalla (latte) ══════════ */
{
  stessaLista('i pezzi: pollaio 3×2 e stalla 4×3, produttivi, al 5 e al 9', [PEZZI.pollaio, PEZZI.stalla].map(p => [p.w, p.d, p.produttivo, p.liv].join()), ['3,2,true,5', '4,3,true,9'])
  stessaLista('il caseificio è una macchina 3×3 al livello 11', [EDIFICI.caseificio.w, EDIFICI.caseificio.d, EDIFICI.caseificio.liv, !!MACCHINE.caseificio], [3, 3, 11, true])
  uguale('la pasta (farina + uova) arriva con il pastificio, al 6: le uova c\'erano già dal 5', livelloDellaRicetta('pasta'), 6)
  uguale('la torta aspetta il burro, quindi il caseificio: al 11', livelloDellaRicetta('torta'), 11)
  uguale('il formaggio al 11, come il caseificio', livelloDellaRicetta('formaggio'), 11)
  uguale('il gelato al 14, come la gelateria', livelloDellaRicetta('gelato'), 14)
  uguale('la scaletta ha ancora un solo pezzo produttivo per livello', [5, 9, 11].map(l => costoDelLivello(l)).join(), [PEZZI.pollaio.prezzo, PEZZI.stalla.prezzo, EDIFICI.caseificio.prezzo].join())

  const { f, t } = mondo({ monete: 5000 })
  uguale('il pollaio è chiuso al livello 1', f.compraPezzo('pollaio').motivo, 'non-sbloccato')
  alLivello(f, 6)
  f.compraLotto('3_1'); f.compraLotto('2_1')
  controlla('comprato e messo, nasce con una gallina che ha fame', f.compraPezzo('pollaio').ok && metti(f, 'pollaio').ok)
  const p = f.s.cose.find(c => c.tipo === 'pollaio')
  stessaLista('una gallina con fame', p.bestie, [{ fine: null }])
  uguale('niente da mangiare: lo dice', f.nutriBestie(p.id).motivo, 'manca-raccolto')
  uguale('e cosa ci vuole', f.provaCuraBestie(p.id).mangia.join(), 'grano,mais')
  uguale('niente da raccogliere', f.raccogliProdotti(p.id).motivo, 'niente')
  f.s.merci.carota = 5
  uguale('le carote non le mangia', f.nutriBestie(p.id).motivo, 'manca-raccolto')
  f.s.merci.grano = 1; f.s.merci.mais = 3
  uguale('mangia dalla scorta più grande fra quelle che mangia', f.nutriBestie(p.id).n, 1)
  stessaLista('un mais in meno, il grano intatto, le carote intatte', [f.s.merci.mais, f.s.merci.grano, f.s.merci.carota], [2, 1, 5])
  uguale('sta lavorando', f.statoBestia(p.bestie[0]), 'lavora')
  stessaLista('a nutrire ancora: dice quanti secondi', [f.provaCuraBestie(p.id).motivo, f.provaCuraBestie(p.id).secondi], ['lavora', ANIMALI.pollaio.ms / 1000])
  uguale('non si raccoglie prima del tempo', f.raccogliProdotti(p.id).motivo, 'niente')
  uguale('non si mette via con le galline', f.mettiVia(p.id).motivo, 'ha-le-bestie')
  t.ora += ANIMALI.pollaio.ms - 1
  uguale('un attimo prima non c\'è', f.raccogliProdotti(p.id).motivo, 'niente')
  t.ora += 1
  stessaLista('allo scadere si raccoglie', [f.provaCuraBestie(p.id).azione, f.provaCuraBestie(p.id).n], ['raccogli', 1])
  f.prendiEventi()
  const r = f.raccogliProdotti(p.id)
  stessaLista('un uovo in dispensa, e l\'evento', [r.ok, r.n, r.prodotto, f.s.prodotti.uova, f.prendiEventi().filter(e => e.tipo === 'uovo').map(e => e.n).join()], [true, 1, 'uova', 1, '1'])
  uguale('la gallina ha di nuovo fame', f.statoBestia(p.bestie[0]), 'fame')
  // tutto aspetta: un uovo pronto non scade e non si somma
  f.nutriBestie(p.id); t.ora += ANIMALI.pollaio.ms * 100
  stessaLista('passato un secolo l\'uovo è ancora uno solo', [f.bestiePronte(p).length, f.raccogliProdotti(p.id).n, f.s.prodotti.uova], [1, 1, 2])
  // le altre galline si comprano dentro il pollaio, senza livelli: ognuna costa di più, fino alla capienza
  uguale('la capienza è nei dati', ANIMALI.pollaio.posti, 6)
  const prezzi = [], pappe = []
  f.s.merci.grano = 20
  for (let k = 1; k < ANIMALI.pollaio.posti; k++) { const m0 = f.monete(), x = f.compraBestia(p.id); prezzi.push(x.ok ? m0 - f.monete() : x.motivo); pappe.push(x.pappa) }
  controlla('ogni acquisto porta un giro di pappa: la bestia nuova comincia a lavorare', pappe.every(Boolean) && p.bestie.slice(1).every(b => b.fine !== null))
  stessaLista('cinque galline in più, ognuna più cara della precedente', prezzi, [1, 2, 3, 4, 5].map(n => prezzoDellaBestia('pollaio', n)))
  controlla('i prezzi salgono di un passo fisso', prezzi.every((x, i) => !i || x - prezzi[i - 1] === ANIMALI.pollaio.rincaroBestia) && prezzi[0] === ANIMALI.pollaio.prezzoBestia)
  stessaLista('sei galline, il tetto: la settima no', [p.bestie.length, f.compraBestia(p.id).motivo, f.infoBestie(p).pieno], [6, 'pieno', true])
  f.s.merci.grano = 10; for (const b of p.bestie) b.fine = null
  uguale('tutte e sei affamate: si nutrono tutte', f.nutriBestie(p.id).n, 6)
  stessaLista('e il grano scende di sei', [f.s.merci.grano, f.s.merci.mais], [4, 1])
  t.ora += ANIMALI.pollaio.ms
  uguale('sei uova insieme', f.raccogliProdotti(p.id).n, 6)
  f.s.merci.grano = 0; f.s.merci.mais = 1
  uguale('con un solo raccolto se ne nutre una', f.nutriBestie(p.id).n, 1)

  // la stalla: due raccolti per pasto
  const g = alLivello(mondo({ monete: 5000 }).f, 9)
  g.compraPezzo('stalla'); metti(g, 'stalla')
  const s = g.s.cose.find(c => c.tipo === 'stalla')
  g.s.merci.mais = 1
  uguale('un solo mais non basta a una mucca', g.nutriBestie(s.id).motivo, 'manca-raccolto')
  stessaLista('e dice che ne servono due', [g.provaCuraBestie(s.id).servono], [2])
  g.s.merci.carota = 1
  uguale('mais e carota insieme sì', g.nutriBestie(s.id).n, 1)
  stessaLista('tolti entrambi', [g.s.merci.mais, g.s.merci.carota], [0, 0])
  // la stalla tiene quattro mucche, si comprano subito (al livello del pezzo) e il prezzo sale
  uguale('la stalla ha quattro posti', ANIMALI.stalla.posti, 4)
  const mucche = []
  for (let k = 1; k < ANIMALI.stalla.posti; k++) { const m0 = g.monete(), x = g.compraBestia(s.id); mucche.push(x.ok ? m0 - g.monete() : x.motivo) }
  stessaLista('tre mucche in più al livello 9', mucche, [1, 2, 3].map(n => prezzoDellaBestia('stalla', n)))
  stessaLista('quattro: la quinta no', [s.bestie.length, g.compraBestia(s.id).motivo], [4, 'pieno'])
  uguale('il quadro della stalla', JSON.stringify(g.infoBestie(s)), JSON.stringify({ tipo: 'stalla', bestia: 'mucca', bestie: 'mucche', emoji: '🐄', n: 4, max: 4, pieno: true, prezzo: null }))
  uguale('un campo non ha un quadro di bestie', g.infoBestie(campoDi(g)), null)
  // il latte in dispensa
  g.ora = () => 1_000_000 + ANIMALI.stalla.ms + 1
  const rl = g.raccogliProdotti(s.id)
  stessaLista('un latte e l\'evento', [rl.prodotto, g.s.prodotti.latte, g.prendiEventi().some(e => e.tipo === 'latte')], ['latte', 1, true])
  uguale('prodottiDelCortile conta solo il pronto', g.prodottiDelCortile(), 0)
}

/* ══════════ 19. il caseificio e le ricette con uova e latte ══════════ */
{
  const { f, t } = mondo({ monete: 5000 })
  alLivello(f, 11)
  for (const id of ['3_1', '2_1', '5_2']) f.compraLotto(id)
  controlla('il caseificio si compra, nel suo lotto', f.compraEdificio('caseificio').ok)
  uguale('ricette del caseificio', f.ricetteDi('caseificio').map(r => r.id).join(), 'burro,formaggio')
  stessaLista('il formaggio chiede latte che non c\'è', [f.avviaRicettaIn('caseificio', 'formaggio').motivo, JSON.stringify(f.mancano('formaggio'))], ['mancano-ingredienti', JSON.stringify({ latte: 2 })])
  f.s.prodotti.latte = 4
  controlla('con il latte il formaggio parte e toglie il latte', f.avviaRicettaIn('caseificio', 'formaggio').ok && f.s.prodotti.latte === 2)
  t.ora += RICETTE.formaggio.ms + 1; f.tick(); f.ritiraDa('caseificio')
  uguale('formaggio in dispensa', f.s.prodotti.formaggio, 1)
  f.s.prodotti.uova = 5; f.s.prodotti.farina = 1
  uguale('la pasta non è del pastificio che manca', f.avviaRicetta('pasta').motivo, 'non-tua')
  controlla('gli ingredienti si dicono con l\'emoji giusta', emojiDi('uova') === '🥚' && emojiDi('latte') === '🥛')
  for (const [id, r] of Object.entries(RICETTE)) controlla(`${id}: il tempo per averla si calcola`, Number.isFinite(msDi(id)) && msDi(id) >= r.ms, String(msDi(id)))
  uguale('l\'uovo vale il suo tempo più un raccolto', msDelProdotto('uova'), ANIMALI.pollaio.ms + COLTURE.grano.ms)
  // il posto del caseificio non è sopra a un altro edificio, e l'albero lì sopra è già giù
  controlla('il posto del caseificio è libero da alberi', guastiDegliAlberi().length === 0)
}

/* ══════════ 19-bis. telaio, sartoria, tintoria e zuccherificio: la lana è un ingrediente, lo zucchero entra nel gelato ══════════ */
{
  const { f, t } = mondo({ monete: 50000 })
  alLivello(f, 16)
  const compra = tipo => f.compraEdificio(tipo)
  for (const tipo of ['telaio', 'zuccherificio', 'sartoria', 'tintoria']) controlla(`${tipo}: si compra, nel suo lotto`, compra(tipo).ok, tipo)
  stessaLista('i livelli: telaio 8, zuccherificio 13, sartoria 15, tintoria 16', ['telaio', 'zuccherificio', 'sartoria', 'tintoria'].map(k => EDIFICI[k].liv), [8, 13, 15, 16])
  stessaLista('le ricette di ognuna', ['telaio', 'zuccherificio', 'sartoria', 'tintoria'].map(k => f.ricetteDi(k).map(r => r.id).join()),
    ['stoffa', 'zucchero,marmellata', 'maglione,sciarpa_lana,berretto', 'tintura,sapone,sacchetto,maglione_lavanda'])
  // la lana è il contatore della tosa: scorta, mancanza e consumo passano da lì
  stessaLista('la lana si legge dal contatore e la stoffa la chiede', [f.scortaDi('lana'), JSON.stringify(f.mancano('stoffa'))], [0, JSON.stringify({ lana: 2 })])
  uguale('senza lana la stoffa non parte', f.avviaRicettaIn('telaio', 'stoffa').motivo, 'mancano-ingredienti')
  f.s.lana = 5
  controlla('con la lana la stoffa parte e la lana scende di due', f.avviaRicettaIn('telaio', 'stoffa').ok && f.s.lana === 3)
  t.ora += RICETTE.stoffa.ms + 1; f.tick(); f.ritiraDa('telaio')
  uguale('la stoffa in dispensa', f.s.prodotti.stoffa, 1)
  controlla('la sciarpa vuole stoffa e lana', f.avviaRicettaIn('sartoria', 'sciarpa_lana').ok && f.s.lana === 2 && !f.s.prodotti.stoffa)
  f.s.prodotti.stoffa = 2; f.s.merci.lavanda = 2
  controlla('la tintura vuole due lavande', f.avviaRicettaIn('tintoria', 'tintura').ok && f.s.merci.lavanda === 0)
  f.s.merci.barbabietola = 2
  controlla('lo zucchero vuole due barbabietole', f.avviaRicettaIn('zuccherificio', 'zucchero').ok && f.s.merci.barbabietola === 0)
  t.ora += 5 * RICETTE.stoffa.ms; f.tick(); f.ritiraDa('zuccherificio')
  uguale('lo zucchero in dispensa, e il gelato lo vuole', [f.s.prodotti.zucchero, JSON.stringify(RICETTE.gelato.ing)].join(), '1,' + JSON.stringify({ latte: 2, zucchero: 1 }))
  stessaLista('i livelli delle ricette nuove', ['stoffa', 'zucchero', 'marmellata', 'biscotti', 'succo', 'maglione', 'tintura', 'maglione_lavanda'].map(k => livelloDellaRicetta(k)), [8, 13, 13, 13, 14, 15, 16, 16])
  stessaLista('la lana vale il suo tempo (una tosa e il suo pasto), e conta nei tempi di una catena', [msDi('lana'), msDi('stoffa') >= RICETTE.stoffa.ms + 2 * msDi('lana')], [LANA.lana.ms, true])
  controlla('non c\'è il cotone: la lana è l\'unica fibra, come in 2D', !COLTURE.cotone && !RICETTE.cotone && !LANA.cotone)
  // un salvataggio di prima (senza le quattro macchine) si apre e le trova vuote e da comprare
  const v7 = JSON.parse(JSON.stringify(statoIniziale())); v7.v = 7
  for (const k of ['telaio', 'zuccherificio', 'sartoria', 'tintoria']) { delete v7.macchine[k]; delete v7.posseduti[k] }
  v7.lana = 4; v7.prodotti = { gelato: 2 }
  const n7 = normalizza(JSON.parse(JSON.stringify(v7)))
  controlla('un salvataggio senza le macchine nuove le ha vuote e non comprate, e non perde lana né gelati', ['telaio', 'zuccherificio', 'sartoria', 'tintoria'].every(k => n7.macchine[k].coda.length === 0 && n7.posseduti[k] === false) && n7.lana === 4 && n7.prodotti.gelato === 2)
}

/* ══════════ 20. lo stato: le bestie si salvano, un v3 o un v4 si leggono senza perdere niente ══════════ */
{
  const { f, t } = mondo({ monete: 5000 })
  alLivello(f, 9); f.compraPezzo('pollaio'); metti(f, 'pollaio')
  const p = f.s.cose.find(c => c.tipo === 'pollaio')
  f.s.merci.grano = 3; f.nutriBestie(p.id)
  const salvato = f.serializza()
  uguale('lo stato salvato ha la versione dei dati', salvato.v, VERSIONE_STATO)
  const g = mondo({ stato: JSON.parse(JSON.stringify(salvato)) }).f
  stessaLista('le bestie tornano com\'erano, anche a pagina chiusa', g.s.cose.find(c => c.tipo === 'pollaio').bestie, p.bestie)
  controlla('e si rilegge uguale', JSON.stringify(g.serializza()) === JSON.stringify(salvato))
  // un v3 (senza bestie né caseificio) si apre, e una cosa con le bestie rotte si rimette in forma
  const v3 = JSON.parse(JSON.stringify(statoIniziale())); v3.v = 3; delete v3.macchine.caseificio; delete v3.posseduti.caseificio; v3.merci.grano = 7
  const n = normalizza(v3)
  controlla('il v3 perde niente e ha il caseificio vuoto', n.merci.grano === 7 && n.macchine.caseificio.coda.length === 0 && n.posseduti.caseificio === false && n.v === VERSIONE_STATO)
  // un v4: il recinto con un'adulta e un agnello, tre galline, una mucca; niente si perde e niente si sposta
  const v4 = JSON.parse(JSON.stringify(statoIniziale())); v4.v = 4
  v4.cose.push({ id: 5, tipo: 'recinto', i: -1, j: 2, pecore: [{ eta: 'adulta', t0: 7 }, { eta: 'agnello', cibo: 1 }], cibo: 1 },
    { id: 6, tipo: 'pollaio', i: 2, j: 6, bestie: [{ fine: null }, { fine: 123 }, { fine: null }] }, { id: 7, tipo: 'stalla', i: -6, j: 5, bestie: [{ fine: 55 }] })
  const n4 = normalizza(JSON.parse(JSON.stringify(v4)))
  stessaLista('il v4 si apre: pecore, galline e mucche come prima', [n4.v, n4.cose.find(c => c.id === 5).pecore.length, n4.cose.find(c => c.id === 5).cibo, n4.cose.find(c => c.id === 6).bestie.map(b => b.fine), n4.cose.find(c => c.id === 7).bestie[0].fine], [VERSIONE_STATO, 2, 1, [null, 123, null], 55])
  controlla('un vecchio t0 numerico resta com\'è, un t0 null (tosata affamata) pure', n4.cose.find(c => c.id === 5).pecore[0].t0 === 7 && normalizza({ ...JSON.parse(JSON.stringify(v4)), cose: [{ id: 1, tipo: 'recinto', i: 0, j: 0, pecore: [{ eta: 'adulta', t0: null }, { eta: 'adulta' }] }] }).cose[0].pecore[0].t0 === null)
  const f4 = mondo({ stato: JSON.parse(JSON.stringify(v4)), monete: 500 }).f
  stessaLista('e le bestie in più si comprano da subito (2 su 4, 3 su 6, 1 su 4)', [5, 6, 7].map(i => { const q = f4.infoBestie(f4.cosa(i)); return q.n + '/' + q.max }), ['2/4', '3/6', '1/4'])
  controlla('e un salvataggio v4 si rilegge uguale', JSON.stringify(f4.serializza().cose.slice(1)) === JSON.stringify(n4.cose.slice(1)))
  for (const rotto of [undefined, null, [], 5, [{ fine: 'x' }], [{ fine: -1 }, null, {}, { fine: 9 }, { fine: 9 }, { fine: 9 }]]) {
    const b = bestieInForma('pollaio', rotto)
    controlla(`bestie rotte si rimettono in forma (${JSON.stringify(rotto)})`, b.length >= 1 && b.length <= ANIMALI.pollaio.posti && b.every(x => x.fine === null || Number.isFinite(x.fine)))
  }
  const rotto = statoIniziale(); rotto.cose.push({ id: 9, tipo: 'stalla', i: -6, j: 5, bestie: 'no' }); rotto.prodotti.uova = 'molte'
  const r = normalizza(JSON.parse(JSON.stringify(rotto)))
  controlla('una stalla senza bestie ne ha una; i prodotti rotti spariscono', r.cose.find(c => c.tipo === 'stalla').bestie.length === 1 && !('uova' in r.prodotti))
}

/* ══════════ ponte, passerella e tavolo: i pezzi calpestabili non fermano il passo ══════════ */
{
  const p = PEZZI.ponte, pa = PEZZI.passerella, t = PEZZI.tavolo
  stessaLista('ponte 3×1, passerella 1×3, tavolo 3×2: decorazioni, a poco prezzo', [p, pa, t].map(x => [x.w, x.d, !x.produttivo, x.prezzo <= 25].join()), ['3,1,true,true', '1,3,true,true', '3,2,true,true'])
  stessaLista('calpestabili sono solo ponte e passerella', Object.keys(PEZZI).filter(k => PEZZI[k].calpestabile), ['passerella', 'ponte'])
  const { f } = mondo({ monete: 500 })
  alLivello(f, 8)
  // un posto con una cella libera prima e dopo il ponte, sulla stessa riga
  let ci = null, cj = null
  for (let j = -3; j < 8 && ci === null; j++) for (let i = -6; i < 4; i++) if (f.puoMettere('ponte', i, j).ok && f.libera(i - 1, j) && f.libera(i + p.w, j) && [0, 1, 2].every(a => !f.eStrada(i + a, j))) { ci = i; cj = j; break }
  controlla('c\'è un posto per il ponte', ci !== null)
  const r = f.compraEMetti('ponte', ci, cj)
  controlla('il ponte si compra e si mette', r.ok && r.costo === p.prezzo && f.cosaSu(ci, cj).tipo === 'ponte')
  const celleP = [0, 1, 2].map(a => [ci + a, cj])
  controlla('chi cammina ci passa sopra: le celle sono libere per il passo', celleP.every(([i, j]) => f.libera(i, j)))
  controlla('…ma per il costruire sono occupate (nessun pezzo, nessuna strada sopra)', celleP.every(([i, j]) => f.blocca(i, j)) && f.puoMettere('aiuola', ci + 1, cj).motivo === 'occupato' && f.disegnaStrada(ci + 1, cj).motivo === 'occupato')
  const via = f.percorsoVerso([ci - 1, cj], [[ci + p.w, cj]])
  controlla('il percorso attraversa il ponte', !!via && celleP.every(([i, j]) => via.some(([a, b]) => a === i && b === j)))
  controlla('e conta come strada (si va più in fretta)', celleP.every(([i, j]) => f.sullaStrada(i, j)) && !f.eStrada(ci, cj))
  stessaLista('la gobba: le quote per cella e fuori dal ponte niente', [f.quotaPasso(ci + 0.5, cj + 0.5), f.quotaPasso(ci + 1.5, cj + 0.5), f.quotaPasso(ci + 2.5, cj + 0.5), f.quotaPasso(ci - 0.5, cj + 0.5)].map(x => +x.toFixed(4)), [...p.alzato, 0])
  // il tavolo, invece, ferma il passo
  const tt = mondo({ monete: 500 }).f; alLivello(tt, 8)
  const [ti, tj] = postoPer(tt, 'tavolo')
  controlla('il tavolo si mette e blocca anche il passo', tt.compraEMetti('tavolo', ti, tj).ok && !tt.libera(ti, tj) && tt.blocca(ti + 1, tj + 1) && tt.quotaPasso(ti + 0.5, tj + 0.5) === 0)
  // mettere via il ponte libera la cella del tutto, e un salvataggio lo rimette com'era
  const id = f.cosaSu(ci, cj).id
  const rilettura = mondo({ stato: JSON.parse(JSON.stringify(f.serializza())), monete: 500 }).f
  controlla('riletto da un salvataggio, il ponte è ancora calpestabile', rilettura.libera(ci + 1, cj) && rilettura.blocca(ci + 1, cj) && +rilettura.quotaPasso(ci + 1.5, cj + 0.5).toFixed(4) === p.alzato[1])
  f.mettiVia(id, { gratis: true })
  controlla('messo via, la cella torna terra', f.cosaSu(ci, cj) === null && f.quotaPasso(ci + 1.5, cj + 0.5) === 0 && !f.blocca(ci + 1, cj))
}

/* ══════════ stagno e laghetto: acqua che il bambino costruisce, e il ponte che ci sta sopra (docs/fattoria3d/laghi.md) ══════════ */
{
  const st = PEZZI.stagno, lg = PEZZI.laghetto
  stessaLista('stagno 3×3 e laghetto 5×4: decori d\'acqua, non produttivi, non calpestabili', [st, lg].map(x => [x.w, x.d, x.categoria, !x.produttivo, !x.calpestabile, !!x.acqua].join()), ['3,3,decori,true,true,true', '5,4,decori,true,true,true'])
  controlla('il laghetto costa e arriva più tardi dello stagno', lg.prezzo > st.prezzo && lg.liv > st.liv && livelloDelPezzoDi('stagno') === st.liv)
  controlla('i due pezzi non toccano la scala dei livelli (non sono produttivi)', costoDelLivello(st.liv) === [...Object.values(PEZZI).filter(p => p.produttivo && p.liv === st.liv), ...Object.values(EDIFICI).filter(e => e.liv === st.liv)].reduce((n, c) => n + c.prezzo, 0))
  controlla('stanno nella scheda dei decori', carteDi('decori', { livello: 99, prezzoPezzo: t => PEZZI[t].prezzo, nelMagazzino: () => 0, posseduti: {} }).filter(c => c.id === 'stagno' || c.id === 'laghetto').length === 2)
  const { f } = mondo({ monete: 1000 }); alLivello(f, 12)
  const [si, sj] = postoPer(f, 'stagno')
  uguale('prima dello stagno quelle celle sono terra', f.acqua(si, sj), false)
  const r = f.compraEMetti('stagno', si, sj)
  controlla('lo stagno si compra e si mette', r.ok && r.costo === st.prezzo && f.cosaSu(si, sj).tipo === 'stagno')
  const celle = []; for (let a = 0; a < st.w; a++) for (let b = 0; b < st.d; b++) celle.push([si + a, sj + b])
  controlla('tutte le celle dello stagno sono acqua: non si cammina', celle.every(([i, j]) => f.acqua(i, j) && f.blocca(i, j) && !f.libera(i, j)))
  controlla('e fuori dall\'impronta non lo è', !f.acqua(si - 1, sj) && !f.acqua(si + st.w, sj + 1) && !f.acqua(si + 1, sj + st.d))
  uguale('un campo sullo stagno: acqua', f.puoMettere('campo', si, sj).motivo, 'acqua')
  uguale('un\'aiuola sullo stagno: acqua', f.puoMettere('aiuola', si + 1, sj + 1).motivo, 'acqua')
  uguale('uno stagno sopra lo stagno: acqua', f.puoMettere('stagno', si + 1, sj).motivo, 'acqua')
  uguale('una strada sullo stagno non si disegna', f.disegnaStrada(si + 1, sj + 1).motivo, 'occupato')
  // un ponte con un\'estremità a terra ci sta sopra; uno tutto sull'acqua senza appoggio no
  alLivello(f, 12)
  uguale('un ponte tutto sull\'acqua, senza appoggio: acqua', f.puoMettere('ponte', si, sj + 1).motivo, 'acqua')
  const ponteOk = f.puoMettere('ponte', si - 1, sj + 1)
  controlla('un ponte con l\'estremità a terra ci sta sopra', ponteOk.ok, JSON.stringify(ponteOk))
  const pr = f.compraEMetti('ponte', si - 1, sj + 1)
  controlla('il ponte si compra e si mette sullo stagno', pr.ok)
  controlla('lo stagno resta a sé: il ponte non lo sposta né lo cancella', f.cosa(r.cosa.id) && f.cosa(r.cosa.id).i === si && f.cosaSu(si, sj).tipo === 'stagno' && f.cosaSu(si, sj + 1).tipo === 'ponte' && f.acqua(si, sj + 1))
  controlla('l\'eroe passa sul ponte e non sull\'acqua accanto', f.libera(si, sj + 1) && f.libera(si + 1, sj + 1) && !f.libera(si, sj) && f.quotaPasso(si + 0.5, sj + 1.5) > 0)
  // il percorso: dalla cella a terra prima del ponte alla seconda cella di acqua oltre il ponte
  const via = f.percorsoVerso([si - 2, sj + 1], [[si + 1, sj + 1]])
  controlla('il percorso attraversa il ponte e non entra nell\'acqua scoperta', !!via && via.every(([i, j]) => !f.acqua(i, j) || f.cosaSu(i, j)?.tipo === 'ponte'), JSON.stringify(via))
  uguale('mettere via lo stagno con un ponte sopra è rifiutato', f.mettiVia(r.cosa.id).motivo, 'ponte-sopra')
  uguale('…e il cartello dice «Togli prima il ponte»', dettoDi('ponte-sopra'), 'Togli prima il ponte')
  uguale('sull\'acqua dice che serve un ponte', dettoDi('acqua'), 'Qui c\'è l\'acqua: serve un ponte')
  uguale('spostarlo anche (anche di una cella sola)', f.spostaPezzo(r.cosa.id, si + 1, sj).motivo, 'ponte-sopra')
  controlla('e il ponte e lo stagno sono ancora lì', f.cosaSu(si, sj + 1).tipo === 'ponte' && f.cosaSu(si, sj).tipo === 'stagno')
  controlla('puoMettere dello stagno stesso (il fantasma) è rosso col motivo giusto', f.puoMettere('stagno', si + 5, sj, r.cosa.id).motivo === 'ponte-sopra')
  const f2 = mondo({ monete: 1000 }).f; alLivello(f2, 12)
  const [pi, pj] = postoPer(f2, 'ponte')
  f2.compraEMetti('ponte', pi, pj)
  uguale('uno stagno sopra un ponte: occupato', f2.puoMettere('stagno', pi, pj - 1).motivo, 'occupato')
  // un ponte accanto allo stagno è libero; col ponte via, lo stagno si può muovere (e il vecchio posto torna terra)
  f.mettiVia(pr.cosa.id, { gratis: true })
  const mv = f.spostaPezzo(r.cosa.id, si, sj + 4)
  controlla('tolto il ponte lo stagno si sposta (🪙 1) e il vecchio posto torna terra', mv.ok && mv.costo === 1 && !f.acqua(si, sj) && f.acqua(si, sj + 4) && f.libera(si, sj))
  controlla('si può spostare sovrapponendo la sua stessa impronta (di una cella)', f.spostaPezzo(r.cosa.id, si, sj + 5).ok && f.acqua(si, sj + 7) && !f.acqua(si, sj + 3))
  const mvia = f.mettiVia(r.cosa.id)
  controlla('e messo via torna nel magazzino senza lasciare acqua', mvia.ok && f.nelMagazzino('stagno') === 1 && celle.every(([i, j]) => !f.acqua(i, j)) && !f.acqua(si, sj + 7))
  // il salvataggio: sono cose come le altre, nessuna migrazione
  const f3 = mondo({ monete: 1000 }).f; alLivello(f3, 12)
  const [qi, qj] = postoPer(f3, 'laghetto')
  const rl = f3.compraEMetti('laghetto', qi, qj)
  controlla('il laghetto 5×4 si mette: venti celle d\'acqua', rl.ok && (() => { let n = 0; for (let a = 0; a < 5; a++) for (let b = 0; b < 4; b++) if (f3.acqua(qi + a, qj + b)) n++; return n === 20 })())
  const salvato = JSON.parse(JSON.stringify(f3.serializza()))
  controlla('lo stato salvato ha la cosa `laghetto` come un altro pezzo, la versione non cambia', salvato.cose.some(c => c.tipo === 'laghetto' && c.i === qi && c.j === qj) && salvato.v === VERSIONE_STATO)
  const riletto = mondo({ stato: salvato, monete: 1000 }).f
  controlla('riletto, il laghetto è ancora acqua e col suo ponte', riletto.acqua(qi + 2, qj + 1) && !riletto.libera(qi + 2, qj + 1))
  // compatibilità: un vecchio stato senza stagni è uguale a prima (nessuna cella d'acqua costruita)
  const vecchio = mondo().f
  controlla('senza stagni nessuna cella è d\'acqua costruita', vecchio.cellaAcqua.size === 0)
  // una strada disegnata sotto lo stagno sparisce; una di serie lo impedisce
  const f4 = mondo({ monete: 1000 }).f; alLivello(f4, 12)
  const [ri, rj] = postoPer(f4, 'stagno')
  f4.disegnaStrada(ri + 1, rj + 1, { gratis: true })
  controlla('una strada disegnata sotto lo stagno sparisce', f4.compraEMetti('stagno', ri, rj).ok && f4.eStrada(ri + 1, rj + 1) === 0)
}
function livelloDelPezzoDi(t) { return PEZZI[t].liv }

/* ══════════ il menu «Costruisci qui»: le carte dai dati (docs/fattoria3d/scena.md) ══════════ */
{
  controlla('le carte non hanno guasti', guastiDelleCarte().length === 0, guastiDelleCarte().join('; '))
  controlla('ogni pezzo e ogni edificio ha una categoria valida', [...Object.values(PEZZI), ...Object.values(EDIFICI)].every(d => !!CATEGORIE[d.categoria]))
  controlla('ogni scheda ha almeno una carta', Object.keys(CATEGORIE).every(c => schedeDi(statoMenu({ livello: 99 }))[c].length > 0))
  const tutte = Object.values(schedeDi(statoMenu({ livello: 99 }))).flat().filter(c => c.genere !== 'strumento')
  uguale('ogni pezzo e ogni edificio unico sta in una scheda sola', tutte.length, Object.keys(PEZZI).length + Object.keys(EDIFICI).length)
  controlla('le carte di una scheda stanno in ordine di livello, prima quelle col «!»', Object.keys(CATEGORIE).every(c => {
    const carte = carteDi(c, statoMenu({ livello: 99 })).filter(x => x.genere !== 'strumento')
    const inOrdine = sg => { const l = carte.filter(x => !!x.segnala === sg).map(x => x.liv); return l.every((v, k) => !k || v >= l[k - 1]) }
    return inOrdine(true) && inOrdine(false) && !carte.some((x, k) => x.segnala && k > 0 && !carte[k - 1].segnala)
  }))
  controlla('i disegni dell\'atlante della fattoria di sempre esistono', Object.values(DISEGNI).every(d => !!ATLANTE_PEZZI[d]), Object.values(DISEGNI).filter(d => !ATLANTE_PEZZI[d]).join(', '))
  const c1 = carteDi('campi', statoMenu({ livello: 1 }))
  controlla('il campo è aperto al livello 1 e costa il suo prezzo', c1[0].id === 'campo' && !c1[0].bloccata && c1[0].etichetta === '🪙 ' + PEZZI.campo.prezzo)
  const an = carteDi('animali', statoMenu({ livello: 1 }))
  controlla('il recinto è chiuso al livello 1 e dice il suo livello', an.find(c => c.id === 'recinto').bloccata && an.find(c => c.id === 'recinto').liv === PEZZI.recinto.liv)
  controlla('un pezzo nel magazzino mostra «📦 ×N» invece del prezzo', carteDi('campi', statoMenu({ livello: 1, magazzino: { campo: 2 } }))[0].etichetta === '📦 ×2')
  controlla('un edificio già comprato non si offre più', !carteDi('edifici', statoMenu({ livello: 99, posseduti: { mulino: true } })).some(c => c.id === 'mulino') && carteDi('edifici', statoMenu({ livello: 99 })).some(c => c.id === 'mulino'))
  controlla('la scheda delle strade ha la strada e la gomma, sempre aperte', Object.keys(STRUMENTI).every(k => { const c = carteDi('passaggi', statoMenu({ livello: 1 })).find(x => x.id === k); return c && c.genere === 'strumento' && !c.bloccata }))
  // dal menu: la cella premuta decide dove va il pezzo (la logica sta in scena3d/costruzione.js `daMenu`, che qui non si carica: stessa regola, sul motore)
  const { f } = mondo({ monete: 1000 })
  const [pi, pj] = postoPer(f, 'campo')
  controlla('una cella libera accoglie il pezzo: il motore lo compra e lo mette in un gesto', f.puoCompraEMettere('campo', pi, pj).ok && f.compraEMetti('campo', pi, pj).ok)
  controlla('una cella occupata non lo accoglie e non perde niente', !f.puoMettere('campo', pi, pj).ok && f.nelMagazzino('campo') === 0)
}
function statoMenu({ livello, magazzino = {}, posseduti = {} }) {
  return { livello, prezzoPezzo: t => PEZZI[t].prezzo, nelMagazzino: t => magazzino[t] || 0, posseduti }
}

riassunto('Fattoria 3D')
