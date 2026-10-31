/* Le decorazioni della 2D portate in 3D (giri G8 e G9, parità L20/W7–W15, docs/fattoria3d/decorazioni.md): ogni voce delle dieci famiglie (verde, fiori, recinti e
   cartelli, raccolto, case e lampioni, arredo, acqua, bestiole, feste, fiera) è un pezzo 3D con lo stesso id (salvo le eccezioni dichiarate) e gli stessi prezzo e
   livello della 2D, ha un modello che si costruisce, pesa poco (una o due mesh, pochi triangoli), la bandiera sventola sul clone; ciò che la 2D ha nelle famiglie
   «da bello» e non è una decorazione sta in una lista col perché. L'acqua (ninfee, canne, mulino), la fiera (non si compra) e l'albero di Natale (solo in stagione). Senza browser. `node test/esegui.mjs fattoria3d-decori`
   tempo: 1 */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CATEGORIE as CATEGORIE_2D, PER_ID as VOCI_2D } from '../../src/giochi/fattoria/dati/catalogo.js'
import { livelloDellaVoce } from '../../src/giochi/fattoria/dati/livelli.js'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const { PEZZI, CATEGORIE, guastiDelCatalogo } = await import('../../src/giochi/fattoria3d/dati/catalogo.js')
const { VOCE_DECORI, FAMIGLIE_DECORI } = await import('../../src/giochi/fattoria3d/dati/parita2d.js')
const { IDS_DECORI, guastiDeiDecori } = await import('../../src/giochi/fattoria3d/dati/decori.js')
const { schedeDi } = await import('../../src/giochi/fattoria3d/dati/carte.js')
const { DECORI_CREA } = await import('../../src/giochi/fattoria3d/scena3d/modelli-decori.js')
const { pezzoPer } = await import('../../src/giochi/fattoria3d/motore/migra.js')

/** Le voci della 2D che non sono decorazioni e quindi non hanno un pezzo decorativo: il perché (parità: sono altrove). */
const NON_DECORAZIONI = {
  silo: 'i silos non sono decorazioni: sono i magazzini, edifici che crescono (docs/fattoria3d/magazzini.md)',
  silo_bianco: 'idem: il magazzino della stalla',
  dispensa: 'idem: il magazzino della bottega',
  peschiera: 'la pesca della 3D (molo, porticciolo) ne prende il posto, allo stesso livello (dati/parita2d.js LIVELLO_PESCA)',
}
/** Le voci della 2D che in 3D c'erano già come pezzi dei primi giri, col loro id 3D (sotto «Decori» o «Strade»). */
const GIA_C_ERANO = { spaventapasseri: 'spaventapasseri', boccio: 'aiuola', panchina: 'panchina', tavolo: 'tavolo', fontana: 'fontana', pozzo: 'pozzo', stagno: 'stagno', laghetto: 'laghetto', ponte: 'ponte', zucca_intagliata: 'zucca_intagliata', zucche_mucchio: 'zucche_mucchio' }
/** La scheda del menu di ogni famiglia 2D: quasi sempre la stessa chiave; la fiera sta con le feste. */
const SCHEDA = { fiera: 'feste' }
/** Gli id 2D che in 3D sono già presi (le pecore, le merci): il pezzo decorativo ha un altro id. */
const ECCEZIONI = { recinto: 'recinto_legno', pane: 'pane_decoro', torta: 'torta_decoro', marmellata: 'marmellata_decoro', latte: 'latte_decoro' }

/* ══════════ 1. ogni voce delle famiglie portate c'è, con prezzo e livello della 2D ══════════ */
{
  const da2d = CATEGORIE_2D.filter(c => FAMIGLIE_DECORI.includes(c.chiave)).flatMap(c => c.voci.map(v => ({ ...v, fam: c.chiave })))
  controlla('le famiglie portate sono dieci', FAMIGLIE_DECORI.length === 10)
  uguale('le decorazioni della 2D sono 217', da2d.length, 217)
  let ok = 0
  for (const v of da2d) {
    if (GIA_C_ERANO[v.id]) { controlla(`${v.id}: c'era già come pezzo (${GIA_C_ERANO[v.id]})`, !!PEZZI[GIA_C_ERANO[v.id]]); continue }
    const id3 = Object.keys(VOCE_DECORI).find(k => VOCE_DECORI[k] === v.id)
    const p = PEZZI[id3 || '']
    if (!p) { controlla(`${v.id}: è un pezzo 3D`, false); continue }
    ok++
    uguale(`${v.id}: stesso prezzo`, p.prezzo, v.prezzo)
    uguale(`${v.id}: stesso livello`, p.liv, livelloDellaVoce(v))
    uguale(`${v.id}: nella scheda della sua famiglia`, p.categoria, SCHEDA[v.fam] || v.fam)
    controlla(`${v.id}: stesso id (o l'eccezione dichiarata)`, id3 === v.id || ECCEZIONI[v.id] === id3)
    uguale(`${v.id}: la stagione è quella della 2D`, p.stagione || null, v.stagione || null)
    uguale(`${v.id}: la fiera è quella della 2D`, !!p.fiera, !!v.fiera)
  }
  uguale('206 decorazioni portate in questi giri (217 meno le 11 che c\'erano già)', ok, 206)
  uguale('i decori portati sono tutti nei dati di ingombro', JSON.stringify(guastiDeiDecori()), '[]')
  uguale('il catalogo non ha guasti', JSON.stringify(guastiDelCatalogo()), '[]')
  controlla('le schede del menu ci sono tutte', FAMIGLIE_DECORI.every(f => CATEGORIE[SCHEDA[f] || f]))
  // le famiglie «da bello» della 2D sono tutte portate; ciò che non è una decorazione ha il perché scritto
  const altre = CATEGORIE_2D.filter(c => !FAMIGLIE_DECORI.includes(c.chiave) && c.zona === 'bello')
  controlla('nessuna famiglia «da bello» della 2D resta fuori', altre.length === 0, altre.map(c => c.chiave).join())
  for (const [id, perche] of Object.entries(NON_DECORAZIONI)) controlla(`${id}: è una voce 2D che non è una decorazione (${perche.slice(0, 50)}…)`, !!VOCI_2D[id] && !VOCE_DECORI[id])
  controlla('il recinto delle pecore non è stato sovrascritto dal recinto di legno', PEZZI.recinto.produttivo === true && PEZZI.recinto_legno.decoro === true)
  controlla('le decorazioni non sono produttive (non spostano il livello)', IDS_DECORI.every(id => !PEZZI[id].produttivo))
  controlla('nessun decoro portato è calpestabile (i calpestabili sono ponti e moli)', IDS_DECORI.every(id => !PEZZI[id].calpestabile))
  controlla('solo i pezzi d\'acqua stanno sull\'acqua: ninfee e canne (e il mulino, sulla riva)', IDS_DECORI.filter(id => PEZZI[id].suAcqua).sort().join() === 'canne,mulino_acqua,ninfee,ninfee_piccole')
  controlla('le ninfee galleggiano (soloAcqua), le canne stanno anche nell\'acqua bassa (anfibio), il mulino vuole la riva', PEZZI.ninfee.soloAcqua && PEZZI.ninfee_piccole.soloAcqua && PEZZI.canne.anfibio && PEZZI.mulino_acqua.riva)
  controlla('la fiera è otto pezzi, tutti con `fiera: true`, nella scheda feste', IDS_DECORI.filter(id => PEZZI[id].fiera).length === 8 && IDS_DECORI.filter(id => PEZZI[id].fiera).every(id => PEZZI[id].categoria === 'feste'))
  controlla('l\'albero di Natale è di stagione (natale), nella scheda feste', PEZZI.albero_natale.stagione === 'natale' && PEZZI.albero_natale.categoria === 'feste')
}

/* ══════════ 2. ogni modello si costruisce e pesa poco ══════════ */
{
  const meshes = g => { const a = []; g.traverse(o => { if (o.isMesh) a.push(o) }); return a }
  const tri = g => meshes(g).reduce((n, o) => n + (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3, 0)
  let tutteLeVoci = true, peso = true, maxMesh = 0, maxTri = 0, somma = 0
  for (const id of IDS_DECORI) {
    if (!DECORI_CREA[id]) { tutteLeVoci = false; continue }
    const g = DECORI_CREA[id](), n = meshes(g).length, t = tri(g)
    maxMesh = Math.max(maxMesh, n); maxTri = Math.max(maxTri, t); somma += n
    if (n < 1 || n > 3 || t > 1300) { peso = false; console.log('   troppo pesante:', id, n, t) }
    controlla(`${id}: l'altezza di riferimento c'è`, g.userData.altezza > 0)
  }
  controlla('ogni decorazione ha il suo modello', tutteLeVoci)
  controlla('nessun modello supera 3 mesh e 1300 triangoli', peso, `max ${maxMesh} mesh, ${maxTri} triangoli`)
  controlla('in media meno di 1,5 mesh a decorazione (una draw call, due con l\'ombra)', somma / IDS_DECORI.length < 1.5, String(somma / IDS_DECORI.length))
  const a = DECORI_CREA.albero(), b = DECORI_CREA.albero()
  controlla('due alberi condividono la geometria (cache dei modelli)', meshes(a)[0].geometry === meshes(b)[0].geometry)
  const bandiera = DECORI_CREA.bandiera(), nodo = bandiera.userData.drappo
  const prima = nodo.rotation.y; bandiera.userData.anima(1.3)
  controlla('la bandiera sventola sul clone che la possiede', nodo.rotation.y !== prima)
  const altra = DECORI_CREA.bandiera(); const r0 = altra.userData.drappo.rotation.y; bandiera.userData.anima(2.1)
  controlla('e non muove le altre bandiere', altra.userData.drappo.rotation.y === r0)
}

/* ══════════ 3. il menu, la migrazione ══════════ */
{
  const stato = { livello: 70, prezzoPezzo: id => PEZZI[id].prezzo, nelMagazzino: () => 0, posseduti: {}, stagione: null }
  const s = schedeDi(stato)
  uguale('la scheda Verde ha le 27 voci del verde', s.verde.length, 27)
  uguale('la scheda Fiori ha le 33 voci nuove dei fiori e vasi (il bocciolo è l\'aiuola, sta sotto Decori)', s.fiori.length, 33)
  uguale('la scheda Recinti ha le 29 voci dei recinti', s.recinti.length, 29)
  uguale('la scheda Raccolto ha le 38 voci (lo spaventapasseri sta sotto Decori)', s.raccolto.length, 38)
  uguale('la scheda Case ha le 19 voci', s.case.length, 19)
  uguale('la scheda Arredo ha le 27 voci (panchina e tavolo stanno sotto Decori)', s.arredo.length, 27)
  uguale('la scheda Acqua ha le 7 voci nuove (fontana, pozzo, stagno e laghetto stanno sotto Decori, il ponte fra le Strade)', s.acqua.length, 7)
  uguale('la scheda Bestiole ha le 17 voci', s.bestiole.length, 17)
  uguale('fuori stagione e senza regali la scheda Feste è vuota (la linguetta si nasconde)', s.feste.length, 0)
  uguale('a Natale ci sono l\'albero e il pupazzo di neve, solo quelli', schedeDi({ ...stato, stagione: 'natale' }).feste.map(c => c.id).sort().join(), 'albero_natale,pupazzo_neve')
  uguale('a Halloween nella scheda Feste non c\'è niente (le zucche stanno sotto Decori)', schedeDi({ ...stato, stagione: 'halloween' }).feste.length, 0)
  const regalo = schedeDi({ ...stato, nelMagazzino: id => id === 'fiera_giostra' ? 2 : 0 }).feste
  uguale('chi ha una giostrina in magazzino la vede nella scheda Feste, con 📦 ×2', regalo.map(c => c.id + ':' + c.etichetta).join(), 'fiera_giostra:📦 ×2')
  uguale('Decori resta com\'era (le 2 zucche di stagione non si vedono fuori stagione)', s.decori.length, 8)
  uguale('una voce 2D con equivalente si converte in quel pezzo', pezzoPer('siepe'), 'siepe')
  uguale('il recinto di legno 2D diventa recinto_legno, non il recinto delle pecore', pezzoPer('recinto'), 'recinto_legno')
  uguale('l\'ovile 2D resta il recinto delle pecore', pezzoPer('ovile'), 'recinto')
  uguale('il bocciolo 2D resta un\'aiuola', pezzoPer('boccio'), 'aiuola')
  uguale('un fiore 2D ha il suo pezzo', pezzoPer('fiori0'), 'fiori0')
  uguale('la fontana grande 2D non è più la fontana piccola', pezzoPer('fontana_grande'), 'fontana_grande')
  uguale('una voce della fiera 2D si converte nella fiera 3D', pezzoPer('fiera_palco'), 'fiera_palco')
  controlla('ogni id 2D delle famiglie portate ha un pezzo per la migrazione', Object.values(VOCE_DECORI).every(id2 => PEZZI[pezzoPer(id2)] && PEZZI[pezzoPer(id2)].decoro))
  controlla('tutti gli id 2D esistono davvero', Object.values(VOCE_DECORI).every(id2 => VOCI_2D[id2]))
}

/* ══════════ 4. le regole nuove nel motore: ninfee sull'acqua, canne, mulino sulla riva, la fiera non si compra ══════════ */
{
  const { Fattoria3d } = await import('../../src/giochi/fattoria3d/motore/fattoria3d.js')
  const { statoIniziale } = await import('../../src/giochi/fattoria3d/motore/stato.js')
  const { sogliaDi } = await import('../../src/giochi/fattoria3d/dati/livelli.js')
  const { eLagoDolce } = await import('../../src/giochi/fattoria3d/dati/biomi.js')
  const { chiave } = await import('../../src/giochi/fattoria3d/dati/mondo.js')
  const st = statoIniziale(); st.esperienza = sogliaDi(70)
  const b = { monete: 1e7 }
  const f = new Fattoria3d({ stato: st, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
  const r = f.compraPezzo('fiera_palco')
  controlla('la fiera non si compra', !r.ok && r.motivo === 'non-in-vendita')
  controlla('un fiore si compra e si mette sul prato', f.compraPezzo('fiori0').ok)
  // una cella di prato e una d'acqua: l'acqua è una funzione della cella, i lotti si comprano per vicinanza (laghi.md): qui si prova solo la regola del pezzo
  let acqua = null
  for (let j = -60; j < 60 && !acqua; j++) for (let i = -12; i < 16 && !acqua; i++) if (eLagoDolce(i, j) && eLagoDolce(i + 1, j) && eLagoDolce(i, j + 1) && eLagoDolce(i + 1, j + 1) && eLagoDolce(i - 1, j) && eLagoDolce(i, j - 1)) acqua = [i, j]
  controlla('si trova una cella in mezzo a un lago per la prova', !!acqua)
  if (acqua) {
    const [i, j] = acqua
    f.cellaPropria = () => true          // la regola del pezzo, non la proprietà dei lotti
    f._bloccaSenzaAcqua = () => false
    controlla('le ninfee stanno su una cella d\'acqua', f.puoMettere('ninfee', i, j).ok)
    controlla('anche le piccole', f.puoMettere('ninfee_piccole', i, j).ok)
    controlla('il fiore normale sull\'acqua no', f.puoMettere('fiori0', i, j).motivo === 'acqua')
    controlla('le canne stanno nell\'acqua bassa, senza ponte accanto', f.puoMettere('canne', i, j).ok)
    // un prato: una cella senza acqua
    let prato = null
    for (let k = 0; k < 40 && !prato; k++) if (!f.acqua(i + k, j) && !f.acqua(i + k + 1, j)) prato = [i + k, j]
    if (prato) {
      controlla('le ninfee sul prato no: galleggiano', f.puoMettere('ninfee', prato[0], prato[1]).motivo === 'serve-acqua')
      controlla('le canne sul prato sì', f.puoMettere('canne', prato[0], prato[1]).ok)
    }
  }
}
riassunto('fattoria3d-decori')
