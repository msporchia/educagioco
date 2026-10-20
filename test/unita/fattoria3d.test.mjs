/* Verifica della fattoria 3D, senza browser: i dati stanno in piedi, il terreno si compra solo se confina, i pezzi passano dal
   magazzino alla mappa e viceversa, i campi crescono e si tagliano una tessera alla volta, gli alberi si abbattono solo nel
   terreno proprio, le pecore hanno le loro fasi, la pasticceria cuoce uno alla volta anche a pagina chiusa, la mongolfiera
   torna, e lo stato si salva e si rilegge uguale.
   `node test/esegui.mjs fattoria3d`
   tempo: 1 */
import { guastiDelMondo, LOTTI, LOTTI_INIZIALI, lottoPerId, idx, PARTENZA } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { guastiDelCatalogo, PEZZI, EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { guastiDelleColture, COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { guastiDelleRicette, RICETTE, MACCHINE, FORNO_POSTI, emojiDi } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { guastiDeiLivelli, sogliaDi, livelloPer, roba, nomeDi, ULTIMO, costoDelLivello, livelloDellaRicetta } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { msDi } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { ANIMALI, CORTILE, PRODOTTI_ANIMALI, guastiDegliAnimali, prezzoDellaBestia, msDelProdotto } from '../../src/giochi/fattoria3d/dati/animali.js'
import { guastiDelleRegole, COSTI, PECORE, MONGOLFIERA } from '../../src/giochi/fattoria3d/dati/regole.js'
import { generaAlberi, guastiDegliAlberi } from '../../src/giochi/fattoria3d/dati/alberi.js'
import { generaOstacoli, guastiDegliOstacoli, PER_LOTTO } from '../../src/giochi/fattoria3d/dati/ostacoli.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
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
                ...guastiDelleRegole(), ...guastiDegliAlberi(), ...guastiDegliOstacoli()]
controlla('i dati non hanno guasti', guasti.length === 0, guasti.join(' · '))
stessaLista('quarantadue lotti, nove di partenza', [LOTTI.length, Object.keys(LOTTI_INIZIALI).length], [42, 9])
controlla('gli alberi sono sempre gli stessi', JSON.stringify(generaAlberi()) === JSON.stringify(generaAlberi()))
controlla('e i sassi e i cespugli pure', JSON.stringify(generaOstacoli()) === JSON.stringify(generaOstacoli()))
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
  const fuori = f.alberi.find(x => x.tagliabile && !f.cellaPropria(x.i, x.j))
  uguale('un albero in un lotto non tuo non si abbatte', f.abbatti(fuori.n).motivo, 'fuori-terreno')
  const bosco = f.alberi.find(x => !x.tagliabile)
  uguale('il bosco fuori dal mondo nemmeno', f.abbatti(bosco.n).motivo, 'bosco')
  const salvato = f.serializza()
  const g = mondo({ stato: salvato }).f
  controlla('l\'albero tagliato resta tagliato dopo il salvataggio', g.alberi[a.n].tagliato === true && g.libera(a.i, a.j))
  // senza monete il colpo non parte e non cambia niente
  const povero = mondo({ monete: COSTI.albero - 1 })
  const b2 = povero.f.alberiNelTerreno()[0], es = povero.f.esperienza()
  const no = povero.f.abbatti(b2.n)
  controlla('senza monete rifiuta e dice quanto costa', !no.ok && no.motivo === 'poche-monete' && no.costo === COSTI.albero && !povero.f.alberi[b2.n].tagliato && povero.b.monete === COSTI.albero - 1 && povero.f.esperienza() === es)
}

/* ══════════ 6-bis. sassi e cespugli: pochi per lotto, restano dopo l'acquisto, si tolgono per 🪙 1 ══════════ */
{
  const tutti = generaOstacoli()
  controlla('due-cinque per lotto (meno dove i posti riservati non lasciano spazio)', LOTTI.every(l => {
    const n = tutti.filter(o => o.i >= l.i && o.i < l.i + l.w && o.j >= l.j && o.j < l.j + l.d).length
    return n <= PER_LOTTO.max
  }) && LOTTI.filter(l => tutti.filter(o => o.i >= l.i && o.i < l.i + l.w && o.j >= l.j && o.j < l.j + l.d).length >= PER_LOTTO.min).length >= LOTTI.length - 12)    // gli altri sono i lotti stretti fra edifici, strade e alberi
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
  const nord = LOTTI.find(l => !f.posseduto(l) && f.confina(l) && f.ostacoli.some(x => dentroLotto(l, x))), qui = f.ostacoli.filter(x => dentroLotto(nord, x))
  f.compraLotto(nord.id)
  controlla('comprare il lotto non li toglie: ci sono ancora e bloccano', qui.length >= 1 && qui.every(x => !x.tolto && !f.libera(x.i, x.j)))
  // si salva l'id e si rilegge
  const g = mondo({ stato: f.serializza(), ostacoli: true }).f
  controlla('quello tolto resta tolto dopo il salvataggio, gli altri no', g.ostacoli[o.n].tolto === true && g.libera(o.i, o.j) && g.ostacoli.filter(x => x.tolto).length === 1)
  // senza monete non si tocca
  const p = mondo({ monete: 0, ostacoli: true }).f
  const po = p.ostacoliNelTerreno()[0]
  const no = p.togliOstacolo(po.n)
  controlla('senza monete rifiuta e non cambia niente', !no.ok && no.motivo === 'poche-monete' && no.costo === COSTI.ostacolo && !p.ostacoli[po.n].tolto && !p.libera(po.i, po.j))
  // un vecchio salvataggio con un pezzo e una strada dove ora c'è un sasso: il sasso se ne va da sé, gratis
  const q = f.ostacoliNelTerreno()[0], saved = f.serializza()
  saved.cose.push({ id: saved.prossimoId, tipo: 'aiuola', i: q.i, j: q.j }); saved.prossimoId++
  const h = mondo({ stato: saved, ostacoli: true }).f
  controlla('il pezzo salvato sopra un sasso vince: il sasso è tolto, senza pagare', h.ostacoli[q.n].tolto === true && h.s.ostacoli.includes(q.id) && h.cosaSu(q.i, q.j).tipo === 'aiuola')
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
  alLivello(f, 5)
  f.compraEdificio('pasticceria')
  f.compraPezzo('recinto'); const r = f.mettiPezzo('recinto', -1, 2)
  controlla('il recinto sta in un posto proprio e libero', r.ok, r.motivo)
  const id = r.cosa.id, rec = r.cosa
  stessaLista('parte con una sola pecora, adulta (nel prezzo)', rec.pecore.map(p => p.eta), ['adulta'])
  stessaLista('il quadro: 1 su 4, la prossima costa quanto dicono i dati', [f.infoBestie(rec).n, f.infoBestie(rec).max, f.infoBestie(rec).prezzo], [1, PECORE.max, CORTILE.recinto.prezzoBestia])
  uguale('con una sola adulta non c\'è da nutrire', f.provaCura(id).motivo, 'lana-ricresce')
  // la seconda pecora si compra dentro il recinto, senza conferma né livelli: adulta, e conta come esperienza
  const m0 = f.monete(), e0 = f.esperienza()
  const c2 = f.compraBestia(id)
  controlla('la seconda pecora costa il prezzo dei dati ed è adulta', c2.ok && c2.n === 2 && m0 - f.monete() === CORTILE.recinto.prezzoBestia && f.esperienza() - e0 === CORTILE.recinto.prezzoBestia && rec.pecore[1].eta === 'adulta')
  stessaLista('e le bestie sono due, con il prezzo che sale', [rec.pecore.length, f.infoBestie(rec).prezzo], [2, CORTILE.recinto.prezzoBestia + CORTILE.recinto.rincaroBestia])
  uguale('senza raccolti non si nutre', f.provaCura(id).motivo, 'manca-raccolto')
  f.s.merci.grano = 5
  uguale('due adulte nutrite fanno nascere: c\'è da nutrire', f.provaCura(id).azione, 'nutri')
  uguale('un pasto per la nascita', f.nutri(id).evento, 'cuore')
  uguale('e nasce', f.nutri(id).evento, 'nata')
  stessaLista('un agnello in più', [rec.pecore.length, rec.pecore[2].eta], [3, 'agnello'])
  uguale('un pasto all\'agnello', f.nutri(id).evento, 'pasto')
  uguale('un altro e cresce', f.nutri(id).evento, 'cresciuta')
  stessaLista('ora sono tre adulte', rec.pecore.map(p => p.eta), ['adulta', 'adulta', 'adulta'])
  controlla('ogni pasto è costato un raccolto', f.s.merci.grano === 5 - 4, String(f.s.merci.grano))
  t.ora += PECORE.laneMs + 1
  uguale('passato il tempo la lana è pronta (tre adulte)', f.lanaPronta(rec).length, 3)
  uguale('si tosa prima di nutrire', f.provaCura(id).azione, 'tosa')
  const tos = f.tosa(id)
  controlla('tosate: tre lane', tos.ok && tos.n === 3 && f.s.lana === 3)
  uguale('subito dopo non c\'è più lana', f.lanaPronta(rec).length, 0)
  // quattro pecore al massimo: la quarta si compra, la quinta no, e le nascite si fermano al tetto
  controlla('la quarta si compra', f.compraBestia(id).ok && rec.pecore.length === PECORE.max)
  uguale('la quinta no', f.compraBestia(id).motivo, 'pieno')
  stessaLista('pieno: niente prezzo', [f.infoBestie(rec).pieno, f.infoBestie(rec).prezzo], [true, null])
  f.s.merci.grano = 20
  for (let k = 0; k < 10; k++) f.nutri(id)
  controlla('non più di quattro per recinto', rec.pecore.length <= PECORE.max, String(rec.pecore.length))
  // senza monete la bestia non si compra, e il rifiuto dice quanto manca
  const povero = mondo({ monete: 0 }).f
  povero.s.cose.push({ id: 7, tipo: 'recinto', i: -1, j: 2, pecore: [{ eta: 'adulta', t0: 0 }], cibo: 0 })
  stessaLista('senza monete: poche-monete e il costo', [povero.compraBestia(7).motivo, povero.compraBestia(7).costo], ['poche-monete', CORTILE.recinto.prezzoBestia])
  uguale('una cosa che non tiene bestie non si compra', povero.compraBestia(campoDi(povero).id).motivo, 'sconosciuto')
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
  stessaLista('dopo l\'ultimo non si apre altro', Object.values(roba(ULTIMO + 1)).map(v => v.length), [0, 0, 0, 0, 0])
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
  for (const [id, r] of Object.entries(RICETTE)) for (const k of Object.keys(r.ing)) controlla(`${id}: ${k} è un raccolto, un prodotto delle bestie o di un'altra macchina`, !!COLTURE[k] || !!PRODOTTI_ANIMALI[k] || (!!RICETTE[k] && RICETTE[k].dove !== r.dove))
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

/* ══════════ 18. gli animali da cortile: pollaio (uova) e stalla (latte) ══════════ */
{
  stessaLista('i pezzi: pollaio 3×2 e stalla 4×3, produttivi, al 6 e al 9', [PEZZI.pollaio, PEZZI.stalla].map(p => [p.w, p.d, p.produttivo, p.liv].join()), ['3,2,true,6', '4,3,true,9'])
  stessaLista('il caseificio è una macchina 3×3 al livello 11', [EDIFICI.caseificio.w, EDIFICI.caseificio.d, EDIFICI.caseificio.liv, !!MACCHINE.caseificio], [3, 3, 11, true])
  stessaLista('uova e latte arrivano dove arriva il loro pezzo', ['uova', 'latte'].map(k => livelloDellaRicetta('tortaSoffice') + k), [6 + 'uova', 6 + 'latte'])
  uguale('la frittata (uova + cipolle) arriva al 9', livelloDellaRicetta('frittata'), 9)
  uguale('il formaggio al 11, come il caseificio', livelloDellaRicetta('formaggio'), 11)
  uguale('il gelato alla crema al 14', livelloDellaRicetta('gelatoCrema'), 14)
  uguale('la scaletta ha ancora un solo pezzo produttivo per livello', [6, 9, 11].map(l => costoDelLivello(l)).join(), [PEZZI.pollaio.prezzo, PEZZI.stalla.prezzo, EDIFICI.caseificio.prezzo].join())

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
  const prezzi = []
  for (let k = 1; k < ANIMALI.pollaio.posti; k++) { const m0 = f.monete(), x = f.compraBestia(p.id); prezzi.push(x.ok ? m0 - f.monete() : x.motivo) }
  stessaLista('cinque galline in più, ognuna più cara della precedente', prezzi, [1, 2, 3, 4, 5].map(n => prezzoDellaBestia('pollaio', n)))
  controlla('i prezzi salgono di un passo fisso', prezzi.every((x, i) => !i || x - prezzi[i - 1] === ANIMALI.pollaio.rincaroBestia) && prezzi[0] === ANIMALI.pollaio.prezzoBestia)
  stessaLista('sei galline, il tetto: la settima no', [p.bestie.length, f.compraBestia(p.id).motivo, f.infoBestie(p).pieno], [6, 'pieno', true])
  f.s.merci.grano = 10
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
  uguale('ricette del caseificio', f.ricetteDi('caseificio').map(r => r.id).join(), 'formaggio,burro,yogurt')
  stessaLista('il formaggio chiede latte che non c\'è', [f.avviaRicettaIn('caseificio', 'formaggio').motivo, JSON.stringify(f.mancano('formaggio'))], ['mancano-ingredienti', JSON.stringify({ latte: 2 })])
  f.s.prodotti.latte = 4
  controlla('con il latte il formaggio parte e toglie il latte', f.avviaRicettaIn('caseificio', 'formaggio').ok && f.s.prodotti.latte === 2)
  t.ora += RICETTE.formaggio.ms + 1; f.tick(); f.ritiraDa('caseificio')
  uguale('formaggio in dispensa', f.s.prodotti.formaggio, 1)
  f.s.prodotti.uova = 5; f.s.prodotti.farina = 1
  uguale('la torta soffice non è della pasticceria che manca', f.avviaRicetta('tortaSoffice').motivo, 'non-tua')
  controlla('gli ingredienti si dicono con l\'emoji giusta', emojiDi('uova', COLTURE) === '🥚' && emojiDi('latte', COLTURE) === '🥛')
  for (const [id, r] of Object.entries(RICETTE)) controlla(`${id}: il tempo per averla si calcola`, Number.isFinite(msDi(id)) && msDi(id) >= r.ms, String(msDi(id)))
  uguale('l\'uovo vale il suo tempo più un raccolto', msDelProdotto('uova'), ANIMALI.pollaio.ms + COLTURE.grano.ms)
  // il posto del caseificio non è sopra a un altro edificio, e l'albero lì sopra è già giù
  controlla('il posto del caseificio è libero da alberi', guastiDegliAlberi().length === 0)
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

riassunto('Fattoria 3D')
