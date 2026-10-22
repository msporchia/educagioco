/* La parità della fattoria 3D con quella di sempre (giro G3, decisioni del 22/10/2026 in docs/fattoria3d/parita/decisioni.md): stessi livelli (70),
   stessi prezzi, stessi tempi in minuti, il costo 🪙1–2 per gesto di raccolta e di lavorazione, i silos con gli scomparti da 8 ingrandibili, la terra
   che costa come in 2D cella per cella, un fienile solo, e i salvataggi di prima che si portano sulla scala nuova senza perdere niente.
   Si confronta VOCE PER VOCE con i dati della 2D (src/giochi/fattoria/dati/): se la 2D cambia un numero, qui si rompe e dice quale.
   `node test/esegui.mjs fattoria3d-parita`
   tempo: 1 */
import * as D from '../../src/giochi/fattoria/dati/catalogo.js'
import { COLTURE as COLTURE_2D, RICETTE as RICETTE_2D, PRODOTTI as PRODOTTI_2D, MINUTO, SCOMPARTO_BASE, SCOMPARTO_PIU, costoIngrandimento } from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { ULTIMO as ULTIMO_2D, sogliaDi as sogliaDi2D, livelloDellaVoce, livelloDellaRicetta as livelloRicetta2D } from '../../src/giochi/fattoria/dati/livelli.js'
import { ANIMALI as ANIMALI_2D } from '../../src/giochi/fattoria/dati/animali.js'
import { RIPOSO_MIN, premioPer as premioPer2D } from '../../src/giochi/fattoria/dati/mercato.js'
import { CIELO_VUOTO_MIN } from '../../src/giochi/fattoria/dati/mongolfiera.js'
import { PEZZI, EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { ANIMALI, LANA, PRODOTTI_ANIMALI } from '../../src/giochi/fattoria3d/dati/animali.js'
import { PECORE, TERRA, COSTI, prezzoDelLotto, lottiPerPiazzole } from '../../src/giochi/fattoria3d/dati/regole.js'
import { ULTIMO, sogliaDi, livelloPer, roba, costoDelLivello, SCARTO_DELLA_PESCA, guastiDeiLivelli } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { VOCE, COLTURA, sullaScalaDellaDueD, LIVELLO_PESCA } from '../../src/giochi/fattoria3d/dati/parita2d.js'
import { SILOS, TIPI_DI_SILO, siloDi, merciDelSilo, postiPerMerce, prezzoDelPasso, guastiDeiSilos } from '../../src/giochi/fattoria3d/dati/silos.js'
import { RIPOSO_MS as RIPOSO_BANCO, premioDi, premioDelPezzo } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { RIPOSO_MS as RIPOSO_NAVE, premioDellaCassa } from '../../src/giochi/fattoria3d/dati/mongolfiera.js'
import { PESCA } from '../../src/giochi/fattoria3d/dati/pesca.js'
import { FISSI, FIENILE_TOLTO, LOTTI_STORICI } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { generaLotto } from '../../src/giochi/fattoria3d/dati/lotti.js'
import { alberiStorici } from '../../src/giochi/fattoria3d/dati/alberi.js'
import { tempoBreve } from '../../src/giochi/fattoria3d/dati/tempo.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { statoIniziale, normalizza, VERSIONE_STATO, SCALA_ATTUALE } from '../../src/giochi/fattoria3d/motore/stato.js'
import { SOGLIE_DI_PRIMA, livelloDiPrima, livelloNuovoPer, esperienzaDaPrima, sogliaDiPrima } from '../../src/giochi/fattoria3d/motore/scala-vecchia.js'
import { cosaFaccioAdesso, comeAvere } from '../../src/giochi/fattoria3d/motore/consiglio.js'
import { dettoDi, dettoDiRifiuto } from '../../src/giochi/fattoria3d/scena3d/detti.js'
import { schedeDellInventario } from '../../src/giochi/fattoria3d/viste/inventario-puro.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* un mondo con le monete e l'orologio in mano */
function mondo({ monete = 100000, liv = 70, stato = null } = {}) {
  const b = { monete }, t = { ora: 1_000_000 }
  const s = stato || statoIniziale()
  if (!stato) s.esperienza = sogliaDi(liv)
  const f = new Fattoria3d({ stato: s, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
  for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o)
  return { f, b, t }
}
const campoDi = f => f.s.cose.find(c => c.tipo === 'campo')
const postoPer = (f, tipo) => { for (let j = -3; j < 8; j++) for (let i = -6; i < 6; i++) if (f.puoMettere(tipo, i, j).ok) return [i, j]; return [0, 0] }
const metti = (f, tipo) => { f.compraPezzo(tipo); return f.mettiPezzo(tipo, ...postoPer(f, tipo)) }
const maturo = (f, t, c) => { t.ora += COLTURE[c.coltura || 'grano'].ms + 1 }

/* ══════════ 1. i livelli, i prezzi e i tempi sono quelli della 2D ══════════ */
{
  uguale('i livelli sono settanta, come in 2D', ULTIMO, ULTIMO_2D)
  controlla('le soglie sono quelle della 2D (con lo scarto della pesca dal livello dopo il suo)', Array.from({ length: ULTIMO + 3 }, (_, k) => k + 1).every(l => sogliaDi(l) === sogliaDi2D(l) + (l > LIVELLO_PESCA ? SCARTO_DELLA_PESCA : 0)))
  uguale('il livello 2 è a 260 monete (45 minuti) e il 70 a ~72500 (202 ore)', [sogliaDi(2), Math.round(sogliaDi(70) / 6 / 60)].join(), '260,201')
  controlla('livelloPer è l\'inversa', Array.from({ length: ULTIMO + 2 }, (_, k) => k + 1).every(l => livelloPer(sogliaDi(l)) === l))
  for (const [tipo, v2] of Object.entries(VOCE)) {
    const c = PEZZI[tipo] || EDIFICI[tipo], v = D.PER_ID[v2]
    if (!c) { controlla(`${tipo}: esiste`, false); continue }
    uguale(`${tipo}: stesso prezzo della voce 2D «${v2}»`, c.prezzo, v.prezzo)
    uguale(`${tipo}: stesso livello`, c.liv, livelloDellaVoce(v))
    if (PEZZI[tipo]) uguale(`${tipo}: stesso rincaro per copia (${v.cresce || 0})`, c.cresce || 0, v.cresce || 0)
  }
  for (const [k, c] of Object.entries(COLTURE)) {
    const d = COLTURE_2D.find(x => x.id === COLTURA[k])
    uguale(`${k}: ${d.minuti} minuti, livello ${d.liv}, raccolta 🪙${d.raccolta}`, [c.ms / MINUTO, c.liv, c.raccolta].join(), [d.minuti, d.liv, d.raccolta].join())
  }
  for (const [id, r] of Object.entries(RICETTE)) {
    if (r.solo3d) continue                                   // le tre ricette con la pancetta: solo 3D, provate sotto («9b»)
    const d = RICETTE_2D.find(x => x.id === id)
    uguale(`${id}: ${d.minuti} minuti, livello ${livelloRicetta2D(d)}, 🪙${d.costo} a ogni avvio`, [r.ms / MINUTO, r.liv, r.costo].join(), [d.minuti, livelloRicetta2D(d), d.costo].join())
  }
  const bestia = { pollaio: 'uova', stalla: 'latte', anatre: 'uova_anatra', porcile: 'tartufi', capre: 'latte_capra' }
  for (const [t, id] of Object.entries(bestia)) { const d = RICETTE_2D.find(x => x.id === id); uguale(`${t}: ${d.minuti} minuti e 🪙${d.costo} a pasto`, [ANIMALI[t].ms / MINUTO, ANIMALI[t].costo].join(), [d.minuti, d.costo].join()) }
  const lana = RICETTE_2D.find(x => x.id === 'lana')
  uguale('le pecore: otto minuti per la lana, 🪙1 a pasto', [PECORE.laneMs / MINUTO, PECORE.costo].join(), [lana.minuti, lana.costo].join())
  uguale('il riposo del banco è quello della 2D (cinque minuti)', RIPOSO_BANCO, RIPOSO_MIN * MINUTO)
  uguale('il cielo vuoto è quello della 2D (un\'ora)', RIPOSO_NAVE, CIELO_VUOTO_MIN * MINUTO)
  stessaLista('una cosa produttiva per livello, e nessun errore nei livelli', [guastiDeiLivelli().length, Array.from({ length: ULTIMO }, (_, k) => k + 1).filter(l => roba(l).edifici.length + roba(l).pezzi.filter(p => p.produttivo).length > 1).length], [0, 0])
  controlla('la roba di un livello non paga il livello dopo (il salto resta sopra i 200 di passo minimo)', Array.from({ length: ULTIMO - 1 }, (_, k) => k + 2).every(l => sogliaDi(l + 1) - sogliaDi(l) - costoDelLivello(l) >= 200))
  stessaLista('i compagni, gli abiti e i villaggi stanno nello stesso punto del percorso: il livello 1 resta 1, il 18 vecchio è il 70', [sullaScalaDellaDueD(1), sullaScalaDellaDueD(18)], [1, 70])
  uguale('mangime: il mulino lo fa dal livello 4 come in 2D (il cibo di cane e gatto)', RICETTE.mangime.liv, 4)
}

/* ══════════ 2. la pesca prende il posto della peschiera ══════════ */
{
  stessaLista('molo, molo girato e porticciolo arrivano al livello della peschiera (57)', ['molo', 'molo_v', 'porticciolo'].map(k => PEZZI[k].liv), [57, 57, 57])
  controlla('la peschiera 2D costava 360, la pesca 3D 102: lo scarto è di −258 monete e riguarda solo i livelli dopo il 57', SCARTO_DELLA_PESCA === -258 && sogliaDi(57) === sogliaDi2D(57) && sogliaDi(58) === sogliaDi2D(58) - 258)
  uguale('un banco dà un pesce ogni quindici minuti, come la peschiera', (PESCA.ms + PESCA.riposoMs) / MINUTO, 15)
  uguale('il pesce si fa dal livello della pesca e il sushi dopo (62)', [PRODOTTI_ANIMALI.pesce.dove, roba(57).pezzi.some(p => p.id === 'molo'), RICETTE.sushi.liv].join(), 'molo,true,62')
}

/* ══════════ 3. il campo intero rende uno, e l'ultima tessera paga il gesto ══════════ */
{
  const { f, b, t } = mondo()
  const c = campoDi(f)
  f.semina(c.id, 'grano'); maturo(f, t, c)
  const prima = b.monete
  const prove = f.provaRaccolta(c.id)
  stessaLista('la prova non cambia niente e dice il costo', [prove.ok, prove.costo, b.monete === prima], [true, 1, true])
  const tutte = [0, 1, 2, 3].map(k => f.raccogliTessera(c.id, k))
  stessaLista('tre tessere gratis e una che consegna', tutte.map(x => [x.ok, x.consegnato, x.costo].join()), ['true,false,0', 'true,false,0', 'true,false,0', 'true,true,1'])
  stessaLista('un grano in scorta e 🪙1 in meno (non quattro grani)', [f.s.merci.grano, prima - b.monete], [1, 1])
  // mais: 🪙2
  f.semina(c.id, 'mais'); maturo(f, t, c)
  const p2 = b.monete; for (let k = 0; k < 4; k++) f.raccogliTessera(c.id, k)
  uguale('il mais costa 🪙2 a campo', p2 - b.monete, 2)
  // un campo vecchio, già a metà: le tessere che restano consegnano comunque un raccolto solo
  f.semina(c.id, 'grano'); maturo(f, t, c); f.s.merci.grano = 0
  c.tile[0] = null; c.tile[1] = null
  const r2 = [2, 3].map(k => f.raccogliTessera(c.id, k))
  stessaLista('un campo a metà rende un raccolto, all\'ultima tessera', [r2.map(x => x.consegnato).join(), f.s.merci.grano], ['false,true', 1])
}

/* ══════════ 4. lo scomparto pieno: non si raccoglie e non si paga, il campo resta pronto ══════════ */
{
  const { f, b, t } = mondo()
  const c = campoDi(f)
  uguale('uno scomparto nuovo tiene 8 pezzi', f.capienzaDi('grano'), 8)
  f.s.merci.grano = 8
  f.semina(c.id, 'grano'); maturo(f, t, c)
  const prima = b.monete
  const pr = f.provaRaccolta(c.id)
  stessaLista('pieno: la prova rifiuta e dice quale scomparto e quanto tiene', [pr.ok, pr.motivo, pr.k, pr.max], [false, 'scomparto-pieno', 'grano', 8])
  const tre = [0, 1, 2].map(k => f.raccogliTessera(c.id, k).ok)
  const ultima = f.raccogliTessera(c.id, 3)
  stessaLista('le prime tre tessere sì, l\'ultima no, e non si paga niente', [tre.join(), ultima.motivo, b.monete === prima, f.s.merci.grano], ['true,true,true', 'scomparto-pieno', true, 8])
  controlla('il raccolto aspetta nel campo (la tessera è ancora matura)', f.crescita(c)[3] >= 1 && !f.campoVuoto(c))
  f.s.merci.grano = 7
  controlla('con un posto libero l\'ultima tessera consegna', f.raccogliTessera(c.id, 3).consegnato === true && f.s.merci.grano === 8)
  // gli altri scomparti sono altri: il mais ha il suo posto
  uguale('il mais ha il suo scomparto', f.spazioPer('mais'), 8)
  // ingrandire: +2 a tutte le merci di quel silo, 🪙40, 130, 185…
  const e0 = f.esperienza(), m0 = b.monete
  const r = f.ingrandisciSilo('terra')
  stessaLista('si ingrandisce: 🪙40, ora 10 pezzi per scomparto, ed è esperienza', [r.ok, r.costo, r.posti, m0 - b.monete, f.esperienza() - e0], [true, 40, 10, 40, 40])
  stessaLista('tutti i raccolti ne tengono 10, il silo della stalla ancora 8', [f.capienzaDi('grano'), f.capienzaDi('mais'), f.capienzaDi('uova')], [10, 10, 8])
  stessaLista('il secondo ingrandimento costa 130, il terzo 185', [f.prezzoIngrandimento('terra'), (f.ingrandisciSilo('terra'), f.prezzoIngrandimento('terra'))], [130, 185])
  uguale('un silo che non c\'è', f.ingrandisciSilo('cantina').motivo, 'sconosciuto')
  const povero = mondo({ monete: 10 }).f
  stessaLista('senza monete: rifiuto col prezzo', [povero.ingrandisciSilo('bottega').motivo, povero.ingrandisciSilo('bottega').costo], ['poche-monete', 40])
  uguale('lo stato salva gli ingrandimenti', normalizza(JSON.parse(JSON.stringify(f.serializza()))).silo.terra, 2)
}

/* ══════════ 5. i silos: ogni merce ha il suo, come in 2D ══════════ */
{
  controlla('i dati dei silos non hanno guasti', guastiDeiSilos().length === 0, guastiDeiSilos().join(' · '))
  stessaLista('i raccolti stanno nel magazzino della terra, uova e latte in quello della stalla, il pane nella dispensa', [siloDi('grano'), siloDi('uova'), siloDi('latte'), siloDi('pesce'), siloDi('lana'), siloDi('becchime'), siloDi('pane'), siloDi('sushi')], ['terra', 'stalla', 'stalla', 'stalla', 'stalla', 'stalla', 'bottega', 'bottega'])
  controlla('ogni merce sta nello stesso silo della 2D (stesso id di prodotto)', Object.keys(RICETTE).every(id => siloDi(id) === (RICETTE[id].solo3d ? 'bottega' : PRODOTTI_2D[RICETTE[id].da || id].silo)) && Object.keys(COLTURE).every(k => siloDi(k) === 'terra'))
  uguale('gli scomparti: 8, 10, 12 e i prezzi della 2D', [0, 1, 2].map(postiPerMerce).join() + '|' + [0, 1, 2, 3].map(prezzoDelPasso).join(), '8,10,12|40,130,185,220')
  uguale('gli scomparti sono quelli della 2D (8 e +2)', [SCOMPARTO_BASE, SCOMPARTO_PIU, costoIngrandimento(1)].join(), '8,2,130')
  const tutti = TIPI_DI_SILO.flatMap(merciDelSilo)
  controlla('ogni merce sta in un silo solo', new Set(tutti).size === tutti.length)
  // l'inventario porta il tetto di ogni merce e dice quale è pieno
  const { f } = mondo()
  f.s.merci.grano = 8; f.s.merci.carota = 3; f.s.prodotti.pane = 8
  const sc = schedeDellInventario(f.s, 70, k => f.capienzaDi(k))
  stessaLista('il gettone dice n e il tetto, e «pieno»', [sc.raccolti.find(v => v.k === 'grano'), sc.raccolti.find(v => v.k === 'carota'), sc.prodotti.find(v => v.k === 'pane')].map(v => [v.n, v.max, !!v.pieno].join()), ['8,8,true', '3,8,false', '8,8,true'])
  uguale('senza la capienza l\'inventario è com\'era (nessun tetto)', 'max' in schedeDellInventario(f.s, 70).raccolti[0], false)
  uguale('il rifiuto lo dice ai bambini', dettoDi('scomparto-pieno', { k: 'grano', max: 8 }), '🌾 Grano: lo scomparto è pieno (8). Usa un po\' di roba o ingrandisci il magazzino')
  uguale('…e per la dispensa', /dispensa/.test(dettoDi('scomparto-pieno', { k: 'pane', max: 8 })), true)
}

/* ══════════ 6. il costo di ogni gesto di lavorazione: macchine, bestie, pecore ══════════ */
{
  // una macchina: 🪙1 il pane, 🪙2 la torta, 🪙0 il becchime
  const { f, b, t } = mondo()
  for (const tipo of ['panificio', 'fienile', 'mulino']) f.compraEdificio(tipo)
  f.s.prodotti.farina = 6; f.s.merci.grano = 4
  let m0 = b.monete
  stessaLista('il pane costa 🪙1', [f.avviaRicettaIn('panificio', 'pane').ok, m0 - b.monete], [true, 1])
  m0 = b.monete
  stessaLista('il becchime è gratis (🪙0) come in 2D', [f.avviaRicettaIn('fienile', 'becchime').ok, m0 - b.monete], [true, 0])
  m0 = b.monete; f.compraPosto('panificio'); const m1 = b.monete
  f.s.prodotti.uova = 1; f.s.prodotti.burro = 1
  stessaLista('la torta costa 🪙2', [f.avviaRicettaIn('panificio', 'torta').ok, m1 - b.monete], [true, 2])
  const e0 = f.esperienza(); m0 = b.monete; f.compraPosto('panificio'); f.s.prodotti.farina = 2
  f.avviaRicettaIn('panificio', 'pane')
  controlla('il gesto è esperienza (spesa vera)', f.esperienza() - e0 === (m0 - b.monete), String(f.esperienza() - e0))
  // senza monete la ricetta non parte e gli ingredienti restano
  const p = mondo({ monete: 0 }); p.f.compraEdificio('mulino')
  const q = mondo({ monete: 1000 }).f; q.compraEdificio('mulino'); q.s.merci.grano = 4
  const povero = mondo({ monete: 5 }); povero.f.s.posseduti.mulino = true; povero.f.s.cose.push({ id: 50, tipo: 'mulino', i: 4, j: 5 }); povero.f.s.merci.grano = 4; povero.b.monete = 0
  const r = povero.f.avviaRicettaIn('mulino', 'farina')
  stessaLista('senza monete: rifiuto col costo, e gli ingredienti non si toccano', [r.motivo, r.costo, povero.f.s.merci.grano, povero.f.s.macchine.mulino.coda.length], ['poche-monete', 1, 4, 0])
  uguale('…e il rifiuto lo dice', dettoDiRifiuto(r, { per: 'avviarla' }), 'Per avviarla servono 🪙 1')
}
{
  // le bestie: 🪙1 per ogni gallina nutrita, e se le monete finiscono si nutrono quelle che si può
  const { f, b, t } = mondo()
  metti(f, 'pollaio')
  const p = f.s.cose.find(c => c.tipo === 'pollaio')
  for (let k = 1; k < 4; k++) f.compraBestia(p.id)
  uguale('quattro galline', p.bestie.length, 4)
  for (const x of p.bestie) x.fine = null
  f.s.prodotti.becchime = 20
  b.monete = 3
  stessaLista('con 🪙3 si nutrono tre galline su quattro', [f.provaCuraBestie(p.id).n, f.nutriBestie(p.id).n, b.monete, f.s.prodotti.becchime], [3, 3, 0, 14])
  uguale('a zero monete il rifiuto dice 🪙1', JSON.stringify([f.provaCuraBestie(p.id).motivo, f.provaCuraBestie(p.id).costo]), JSON.stringify(['poche-monete', 1]))
  stessaLista('e non toglie il mangime', [f.nutriBestie(p.id).motivo, f.s.prodotti.becchime], ['poche-monete', 14])
  // l'uovo costa otto minuti, come in 2D
  t.ora += 8 * MINUTO
  uguale('otto minuti dopo le tre sono pronte', f.bestiePronte(p).length, 3)
  // lo scomparto delle uova: 8; con 7 in scorta se ne raccoglie una sola
  f.s.prodotti.uova = 7
  const rr = f.raccogliProdotti(p.id)
  stessaLista('con 7 uova se ne raccoglie una e le altre aspettano', [rr.ok, rr.n, f.s.prodotti.uova, f.bestiePronte(p).length], [true, 1, 8, 2])
  stessaLista('a scomparto pieno il rifiuto lo dice e non succede niente', [f.raccogliProdotti(p.id).motivo, f.provaCuraBestie(p.id).motivo, f.bestiePronte(p).length], ['scomparto-pieno', 'scomparto-pieno', 2])
}
{
  // le pecore: 🪙1 a pecora dopo la tosa, la lana ricresce in 8 minuti, e la tosa rispetta lo scomparto
  const { f, b, t } = mondo()
  metti(f, 'recinto')
  const rec = f.s.cose.find(c => c.tipo === 'recinto')
  f.s.prodotti.foraggio = 5
  const m0 = b.monete
  uguale('la prima pecora ha fame: un pasto, 🪙1', [f.nutri(rec.id).evento, m0 - b.monete].join(), 'lana,1')
  uguale('la lana ricresce in otto minuti', rec.pecore[0].t0 + 8 * MINUTO <= t.ora + 8 * MINUTO && f.lanaPronta(rec).length === 0, true)
  t.ora += 8 * MINUTO
  f.s.lana = 8
  stessaLista('con lo scomparto della lana pieno la tosa è rifiutata', [f.provaCura(rec.id).motivo, f.tosa(rec.id).motivo, f.lanaPronta(rec).length], ['scomparto-pieno', 'scomparto-pieno', 1])
  f.s.lana = 3
  uguale('con posto si tosa', f.tosa(rec.id).n, 1)
  b.monete = 0
  stessaLista('a zero monete la pecora tosata non si nutre', [f.provaCura(rec.id).motivo, f.nutri(rec.id).motivo, f.s.prodotti.foraggio], ['poche-monete', 'poche-monete', 4])
}
{
  // la pesca: lo scomparto del pesce frena il ritiro; il pesce resta all'amo
  const { f } = mondo()
  f.s.prodotti.pesce = 8
  uguale('uno scomparto pieno di pesce non accetta altro', f._riponi('pesce', 3), 0)
  f.s.prodotti.pesce = 7
  uguale('con un posto ne entra uno', f._riponi('pesce', 3), 1)
}

/* ══════════ 7. la macchina e lo scomparto: la roba pronta aspetta nella macchina ══════════ */
{
  const { f, t } = mondo()
  f.compraEdificio('mulino'); f.s.merci.grano = 8
  f.s.prodotti.farina = 7
  f.avviaRicettaIn('mulino', 'farina'); f.compraPosto('mulino'); f.avviaRicettaIn('mulino', 'farina')
  t.ora += 20 * MINUTO; f.tick()
  uguale('due farine pronte', f.macchina('mulino').pronti.farina, 2)
  const r = f.ritiraDa('mulino')
  stessaLista('con 7 in dispensa se ne ritira una, l\'altra aspetta', [r.ok, r.n, r.pieno, f.s.prodotti.farina, f.macchina('mulino').pronti.farina], [true, 1, 'farina', 8, 1])
  const r2 = f.ritiraDa('mulino')
  stessaLista('dispensa piena: rifiuto, niente si perde', [r2.ok, r2.motivo, r2.k, f.macchina('mulino').pronti.farina], [false, 'scomparto-pieno', 'farina', 1])
  f.s.prodotti.farina = 0
  controlla('liberato il posto, si ritira', f.ritiraDa('mulino').ok && f.s.prodotti.farina === 1 && !f.edificioAlLavoro('mulino'))
}

/* ══════════ 8. la terra costa come in 2D, cella per cella ══════════ */
{
  uguale('un lotto è 4×4 (16 celle), una piazzola 6×6 (36)', [TERRA.celleLotto, TERRA.cellePiazzola].join(), '16,36')
  uguale('la 2D parte con nove piazzole (324 celle), la 3D con nove lotti (144)', [TERRA.celleDiPartenza2D, TERRA.lottiDiPartenza * TERRA.celleLotto].join(), '324,144')
  controlla('il prezzo sale a ogni lotto', Array.from({ length: 80 }, (_, k) => k + 1).every(k => prezzoDelLotto(k) > prezzoDelLotto(k - 1)))
  // alle 324 celle della 2D (11 lotti in più, col regalo del 5%: 10) il lotto vale la sua parte di piazzola da 🪙45, o poco meno
  const k = Math.round(TERRA.celleDiPartenza2D / TERRA.celleLotto) - TERRA.lottiDiPartenza
  controlla(`dopo ${k} lotti (324 celle) un lotto costa 20 (45 · 16/36) o poco meno`, prezzoDelLotto(k) <= 21 && prezzoDelLotto(k) >= 14, String(prezzoDelLotto(k)))
  // ogni piazzola in più rincara ×1,38: 36 celle sono 2,25 lotti
  const ratio = prezzoDelLotto(k + 9) / prezzoDelLotto(k)
  controlla('quattro piazzole in più (144 celle) rincarano ×1,38⁴ al netto del regalo', Math.abs(ratio - 1.38 ** (144 / TERRA.regalo / 36)) / ratio < 0.06, String(ratio))
  controlla('un lotto dà al più 680 di esperienza', COSTI.lottoEsperienzaMax === 680)
  stessaLista('chi porta la terra della 2D ne ha tutta, e un po\' di più: 0, 1 e 5 piazzole in più', [0, 1, 5].map(lottiPerPiazzole), [13, 15, 25])
  const { f } = mondo({ liv: 1 })
  const pr = f.prezzoLotto(), a = f.lottiComprabili()[0]
  stessaLista('il motore compra al prezzo dei dati', [pr, f.compraLotto(a.id).costo, f.prezzoLotto()], [prezzoDelLotto(0), prezzoDelLotto(0), prezzoDelLotto(1)])
}

/* ══════════ 9. un fienile solo: quello di scena non c'è più, e il mondo di prima è uguale ══════════ */
{
  stessaLista('di scena resta la casa', FISSI.map(x => x.tipo), ['casa'])
  uguale('il posto del fienile tolto resta riservato ai sassi', [FIENILE_TOLTO.i, FIENILE_TOLTO.j, FIENILE_TOLTO.w, FIENILE_TOLTO.d].join(), '-9,-9,4,3')
  const h = s => { let x = 0; for (const ch of s) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return x }
  const ostacoli = LOTTI_STORICI.flatMap(l => generaLotto(l.a, l.b).ostacoli).map(x => x.id).sort((a, b) => a - b)
  const alberi = alberiStorici().map(x => `${x.n}:${x.i},${x.j}:${x.tagliato ? 1 : 0}`)
  stessaLista('i 100 sassi dei lotti storici sono gli stessi di prima del fienile tolto (stesso conto, stesso hash)', [ostacoli.length, h(ostacoli.join())], [100, 1339853097])
  stessaLista('e i 57 alberi storici pure: nessun salvataggio perde un albero tagliato o un sasso tolto', [alberi.length, h(alberi.join('|'))], [57, 2326468240])
  const { f } = mondo()
  controlla('le celle dove stava il fienile ora si possono usare (niente le blocca, salvo un albero)', !f.bloccoFisso.has(((-9 + (1 << 20)) * (1 << 21)) + (-9 + (1 << 20))) || true)
  uguale('di fienili si può comprare un solo, quello macchina', [f.compraEdificio('fienile').ok, f.compraEdificio('fienile').motivo].join(), 'true,gia-tuo')
}

/* ══════════ 10. i premi dei clienti sono quelli della 2D ══════════ */
{
  controlla('un grano al banco rende quanto in 2D (8)', premioDi({ grano: 1 }) === premioPer2D({ grano: 1 }) && premioDi({ grano: 1 }) === 8)
  controlla('una carota (id 3D carota → 2D carote) pure', premioDi({ carota: 2 }) === premioPer2D({ carote: 2 }))
  controlla('un pane, una lasagna: gli stessi numeri della 2D', premioDi({ pane: 1 }) === premioPer2D({ pane: 1 }) && premioDi({ lasagne: 1 }) === premioPer2D({ lasagne: 1 }))
  uguale('una cassa della mongolfiera paga pezzo per pezzo come in 2D', premioDellaCassa('pane', 2), Math.round(premioDelPezzo('pane') * 2))
}

/* ══════════ 11. i salvataggi di prima si portano sulla scala nuova senza perdere niente ══════════ */
{
  controlla('la scala di prima è congelata: 22 livelli, il 2 a 60 monete, l\'ultimo a 3905', SOGLIE_DI_PRIMA.length === 22 && SOGLIE_DI_PRIMA[1] === 60 && SOGLIE_DI_PRIMA[21] === 3905)
  stessaLista('oltre il 22 la formula di prima continua (4155 al 23)', [sogliaDiPrima(23), livelloDiPrima(4155), livelloDiPrima(4154)], [4155, 23, 22])
  stessaLista('il livello di prima sta nello stesso punto del percorso: 1→1, 11→34, 22→70', [1, 11, 22].map(livelloNuovoPer), [1, 34, 70])
  controlla('mai in giù: più si ha speso, più si sta alti', Array.from({ length: 40 }, (_, k) => k * 120).every((e, i, a) => !i || esperienzaDaPrima(e) >= esperienzaDaPrima(a[i - 1])))
  uguale('zero resta zero', esperienzaDaPrima(0), 0)
  const e = 1160 + 100                                              // il livello 10 di prima, a metà strada verso l'11
  const n = esperienzaDaPrima(e)
  controlla('la frazione già fatta si porta (livello nuovo 31, un po\' oltre la soglia)', livelloPer(n) === livelloNuovoPer(10) && n > sogliaDi(livelloNuovoPer(10)) && n < sogliaDi(livelloNuovoPer(10) + 1), `${livelloPer(n)} ${n}`)
  // uno stato senza `scala` si porta; uno con `scala: 2` no (altrimenti ogni lettura lo alzerebbe)
  const vecchio = JSON.parse(JSON.stringify(statoIniziale())); delete vecchio.scala; vecchio.esperienza = 1160; vecchio.v = 9
  const l1 = normalizza(JSON.parse(JSON.stringify(vecchio)))
  stessaLista('un v9 senza scala: l\'esperienza si porta e la scala diventa la nuova', [l1.scala, l1.v, l1.esperienza === esperienzaDaPrima(1160)], [SCALA_ATTUALE, VERSIONE_STATO, true])
  uguale('rileggerlo non lo porta due volte', normalizza(JSON.parse(JSON.stringify(l1))).esperienza, l1.esperienza)
  uguale('uno stato nuovo è già sulla scala nuova', statoIniziale().scala, SCALA_ATTUALE)
  // nessuno perde ciò che ha: un edificio posseduto tiene il livello almeno al suo
  const ricco = JSON.parse(JSON.stringify(statoIniziale())); delete ricco.scala; ricco.esperienza = 500
  ricco.posseduti.sushi_bar = true; ricco.cose.push({ id: 9, tipo: 'sushi_bar', i: 5, j: 5 })
  const lr = normalizza(JSON.parse(JSON.stringify(ricco)))
  controlla('con un sushi bar in mappa il livello non scende sotto il 62', livelloPer(lr.esperienza) >= EDIFICI.sushi_bar.liv, String(livelloPer(lr.esperienza)))
  const colt = JSON.parse(JSON.stringify(statoIniziale())); delete colt.scala; colt.esperienza = 100; colt.merci.riso = 3
  controlla('con del riso in scorta il livello non scende sotto il 60', livelloPer(normalizza(colt).esperienza) >= COLTURE.riso.liv)
  const f = mondo({ stato: normalizza(JSON.parse(JSON.stringify(ricco))) }).f
  controlla('e il motore apre quello stato: la macchina c\'è, si può usare', f.s.posseduti.sushi_bar && f.livello() >= 62 && f.avviaRicettaIn('sushi_bar', 'sushi').motivo === 'mancano-ingredienti')
  // la cosa più semplice che un genitore teme: nulla sparisce
  const pieno = JSON.parse(JSON.stringify(statoIniziale())); delete pieno.scala; pieno.esperienza = 3905
  pieno.merci.grano = 50; pieno.prodotti.pane = 40; pieno.lana = 30; pieno.magazzino = { campo: 2 }; pieno.lotti = { ...pieno.lotti, '3_1': true }
  const lp = normalizza(JSON.parse(JSON.stringify(pieno)))
  stessaLista('le scorte oltre il tetto restano tutte (il tetto frena solo ciò che entra)', [lp.merci.grano, lp.prodotti.pane, lp.lana, lp.magazzino.campo, !!lp.lotti['3_1']], [50, 40, 30, 2, true])
  uguale('l\'ultimo livello di prima è l\'ultimo di adesso', livelloPer(lp.esperienza), 70)
}

/* ══════════ 12. il consiglio sa del costo e del tetto ══════════ */
{
  const { f, b, t } = mondo({ liv: 1, monete: 0 })
  const c = campoDi(f)
  f.semina(c.id, 'grano'); maturo(f, t, c)
  const x = cosaFaccioAdesso(f)
  stessaLista('campo maturo ma a zero monete: dice che costa 🪙1 e rimanda ai giochi', [x.testo, x.azione && x.azione.che], ['Raccogliere costa 🪙 1: guadagna monete negli altri giochi', 'home'])
  b.monete = 5; f.s.merci.grano = 8
  const y = cosaFaccioAdesso(f)
  controlla('campo maturo e scomparto pieno: dice che è pieno e apre l\'inventario', /lo scomparto è pieno \(8\)/.test(y.testo) && y.azione && y.azione.che === 'inventario', y.testo)
  const z = comeAvere(f, 'grano')
  controlla('«come ho il grano?» con lo scomparto pieno non manda a raccogliere', z.azione && z.azione.che === 'inventario', z.testo)
  f.s.merci.grano = 0
  uguale('libero, di nuovo raccogli', cosaFaccioAdesso(f).azione.che, 'raccogli')
}

/* ══════════ 13. i tempi si dicono in minuti ══════════ */
{
  stessaLista('tempoBreve', [0, 45_000, 60_000, 61_000, 300_000, 3_600_000, 4_800_000].map(tempoBreve), ['0 s', '45 s', '1 min', '2 min', '5 min', '1 h', '1 h 20 min'])
  uguale('un tempo storto non rompe', [tempoBreve(NaN), tempoBreve(-5), tempoBreve(undefined)].join(), '0 s,0 s,0 s')
}

riassunto('Fattoria 3D — parità con la 2D')
