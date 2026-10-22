/* Le decorazioni della 2D portate in 3D (giro G8, parità L20/W7–W14, docs/fattoria3d/decorazioni.md): ogni voce delle cinque famiglie (verde, recinti e
   cartelli, raccolto, case e lampioni, bestiole) è un pezzo 3D con lo stesso id (salvo il `recinto` di legno) e gli stessi prezzo e livello della 2D,
   ha un modello che si costruisce, pesa poco (una o due mesh, pochi triangoli), la bandiera sventola sul clone; le voci della 2D non ancora portate
   sono elencate con il perché. Senza browser. `node test/esegui.mjs fattoria3d-decori`
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

/** Le famiglie 2D che non sono (ancora) in 3D, con il perché: ogni decorazione della 2D o è portata o sta qui. */
const NON_PORTATE = {
  fiori: 'W8: i 34 fiori e vasi sono ancora l\'aiuola sola (famiglia dopo, riusando le forme del verde)',
  acqua: 'W9: fontana, pozzo, ponte, stagno e laghetto ci sono; mancano fontana grande, cantina, pozzo coperto, mulino ad acqua, ninfee e canne',
  arredo: 'W12: panchina e tavolo ci sono; mancano le altre 27 (sedie, amache, barili, girandole, lucine)',
  feste: 'W15: le due zucche ci sono; manca l\'albero di Natale',
  fiera: 'W15: la fiera non si compra, si vince: aspetta le feste',
}
/** Gli id 2D che in 3D sono già presi (le pecore, le merci): il pezzo decorativo ha un altro id. */
const ECCEZIONI = { recinto: 'recinto_legno', pane: 'pane_decoro', torta: 'torta_decoro', marmellata: 'marmellata_decoro', latte: 'latte_decoro' }
const GIA_PEZZO = ['spaventapasseri']                       // c'era già, sta sotto «decori»

/* ══════════ 1. ogni voce delle famiglie portate c'è, con prezzo e livello della 2D ══════════ */
{
  const da2d = CATEGORIE_2D.filter(c => FAMIGLIE_DECORI.includes(c.chiave)).flatMap(c => c.voci.map(v => ({ ...v, fam: c.chiave })))
  controlla('le famiglie portate sono cinque', FAMIGLIE_DECORI.length === 5)
  let ok = 0
  for (const v of da2d) {
    if (GIA_PEZZO.includes(v.id)) { controlla(`${v.id}: c'era già come pezzo`, !!PEZZI[v.id]); continue }
    const id3 = Object.keys(VOCE_DECORI).find(k => VOCE_DECORI[k] === v.id)
    const p = PEZZI[id3 || '']
    if (!p) { controlla(`${v.id}: è un pezzo 3D`, false); continue }
    ok++
    uguale(`${v.id}: stesso prezzo`, p.prezzo, v.prezzo)
    uguale(`${v.id}: stesso livello`, p.liv, livelloDellaVoce(v))
    uguale(`${v.id}: nella scheda della sua famiglia`, p.categoria, v.fam)
    controlla(`${v.id}: stesso id (o l'eccezione dichiarata)`, id3 === v.id || ECCEZIONI[v.id] === id3)
  }
  uguale('130 decorazioni portate (le cinque famiglie meno lo spaventapasseri)', ok, 130)
  uguale('i decori portati sono tutti nei dati di ingombro', JSON.stringify(guastiDeiDecori()), '[]')
  uguale('il catalogo non ha guasti', JSON.stringify(guastiDelCatalogo()), '[]')
  controlla('le schede del menu ci sono tutte', FAMIGLIE_DECORI.every(f => CATEGORIE[f]))
  // le altre famiglie «da bello» della 2D: tutte con il perché scritto
  const altre = CATEGORIE_2D.filter(c => !FAMIGLIE_DECORI.includes(c.chiave) && c.zona === 'bello')
  for (const c of altre) controlla(`la famiglia 2D «${c.chiave}» è portata o ha il perché scritto`, !!NON_PORTATE[c.chiave])
  controlla('il recinto delle pecore non è stato sovrascritto dal recinto di legno', PEZZI.recinto.produttivo === true && PEZZI.recinto_legno.decoro === true)
  controlla('le decorazioni non sono produttive (non spostano il livello)', IDS_DECORI.every(id => !PEZZI[id].produttivo))
  controlla('nessun decoro portato è calpestabile (i calpestabili sono ponti e moli)', IDS_DECORI.every(id => !PEZZI[id].calpestabile))
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
  uguale('la scheda Recinti ha le 29 voci dei recinti', s.recinti.length, 29)
  uguale('la scheda Raccolto ha le 38 voci (lo spaventapasseri sta sotto Decori)', s.raccolto.length, 38)
  uguale('la scheda Case ha le 19 voci', s.case.length, 19)
  uguale('la scheda Bestiole ha le 17 voci', s.bestiole.length, 17)
  uguale('Decori resta com\'era (le 2 zucche di stagione non si vedono fuori stagione)', s.decori.length, 8)
  uguale('una voce 2D con equivalente si converte in quel pezzo', pezzoPer('siepe'), 'siepe')
  uguale('il recinto di legno 2D diventa recinto_legno, non il recinto delle pecore', pezzoPer('recinto'), 'recinto_legno')
  uguale('l\'ovile 2D resta il recinto delle pecore', pezzoPer('ovile'), 'recinto')
  uguale('un fiore 2D resta un\'aiuola', pezzoPer('fiori0'), 'aiuola')
  controlla('ogni id 2D delle famiglie portate ha un pezzo per la migrazione', Object.values(VOCE_DECORI).every(id2 => PEZZI[pezzoPer(id2)] && PEZZI[pezzoPer(id2)].decoro))
  controlla('tutti gli id 2D esistono davvero', Object.values(VOCE_DECORI).every(id2 => VOCI_2D[id2]))
}
riassunto('fattoria3d-decori')
