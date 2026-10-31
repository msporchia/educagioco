/* Le stagioni della fattoria 3D (docs/fattoria3d/stagioni.md): quando (il calendario della 2D e `#stagione=`), come si vede (i dati), gli
   addobbi di Natale scelti come nella 2D, i ghiaccioli, le zucche di Halloween e il pupazzo di Natale nel menu solo in stagione, e la scena
   che si tinge (la neve sui materiali, il fiato) e si rimette a posto senza lasciare niente. Senza browser (three senza WebGL). `node test/esegui.mjs fattoria3d-stagioni`
   tempo: 1 */
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const S = await import('../../src/giochi/fattoria3d/dati/stagioni3d.js')
const D2 = await import('../../src/giochi/fattoria/dati/stagioni.js')
const { Stagione } = await import('../../src/giochi/fattoria3d/scena3d/stagione.js')
const { Pezzi } = await import('../../src/giochi/fattoria3d/scena3d/pezzi.js')
const { Fattoria3d } = await import('../../src/giochi/fattoria3d/motore/fattoria3d.js')
const { sogliaDi, roba } = await import('../../src/giochi/fattoria3d/dati/livelli.js')
const { PEZZI } = await import('../../src/giochi/fattoria3d/dati/catalogo.js')
const { schedeDi } = await import('../../src/giochi/fattoria3d/dati/carte.js')
const { SORPRESE } = await import('../../src/giochi/fattoria3d/dati/mongolfiera.js')

/* ══════════ 1. quando: il calendario è quello della 2D, l'indirizzo lo forza ══════════ */
uguale('Halloween il 31 ottobre', S.stagioneAttiva(new Date(2026, 9, 31)), 'halloween')
uguale('Natale il primo novembre (il giorno dopo)', S.stagioneAttiva(new Date(2026, 10, 1)), 'natale')
uguale('Natale scavalca l\'anno: il 6 gennaio sì', S.stagioneAttiva(new Date(2027, 0, 6)), 'natale')
uguale('il 7 gennaio no', S.stagioneAttiva(new Date(2027, 0, 7)), null)
uguale('a settembre niente', S.stagioneAttiva(new Date(2026, 8, 15)), null)
uguale('è la stessa funzione della 2D', S.stagioneDi, D2.stagioneDi)
uguale('#stagione=natale a settembre', S.stagioneAttiva(new Date(2026, 8, 15), '#stagione=natale'), 'natale')
uguale('anche in mezzo ad altro, in maiuscolo', S.stagioneAttiva(new Date(2026, 8, 15), '#tela=niente&stagione=HALLOWEEN'), 'halloween')
uguale('una stagione che non c\'è si ignora (vale il calendario)', S.stagioneAttiva(new Date(2026, 9, 5), '#stagione=pasqua'), 'halloween')
uguale('senza frammento vale il calendario', S.stagioneAttiva(new Date(2026, 10, 20), ''), 'natale')
uguale('un frammento che contiene stagione= solo dentro un altro nome non conta', S.stagioneDaIndirizzo('#mestagione=natale'), null)
stessaLista('i dati di ogni festa sono completi', S.guastiDelleStagioni3d(), [])
controlla('le due feste della 2D hanno un aspetto e le particelle', Object.keys(D2.FINESTRE).every(n => !!S.ASPETTI[n] && !!S.PARTICELLE[n]))
controlla('ogni voce stagionale del catalogo ha una stagione che esiste', Object.entries(PEZZI).every(([, d]) => !d.stagione || !!D2.FINESTRE[d.stagione]))

/* ══════════ 2. gli addobbi di Natale: una scelta della 2D, in celle del mondo ══════════ */
{
  const edifici = [{ i: 0, j: 0, w: 3, d: 3, alto: 2.6 }, { i: 6, j: 0, w: 3, d: 3, alto: 3 }, { i: 12, j: 2, w: 4, d: 3, alto: 2.4 }]
  const libera = () => true
  const a = S.addobbiNatale(edifici, libera, 20261105), b = S.addobbiNatale(edifici, libera, 20261105)
  stessaLista('la stessa giornata è la stessa scena', a, b)
  uguale('una stella o una campana su ogni edificio', a.stelle.length, 3)
  controlla('le stelle sono sopra i tetti e al centro', a.stelle.every((s, n) => Math.abs(s.x - (edifici[n].i + edifici[n].w / 2)) < 1e-9 && s.y > 1.5 && s.y < edifici[n].alto))
  // la 2D dà la stessa scelta: la ricalcolo da lì
  edifici.forEach((e, n) => {
    const d = D2.addobbiStagionali('natale', { libere: [], edifici: [{ x: e.i, y: e.j, w: e.w, h: e.d, alto: 3 }], seme: 20261105 })
    controlla('edificio ' + n + ': ⭐/🔔 come nella 2D', (d[0].testo === '🔔') === a.stelle[n].campana)
  })
  controlla('gli alberelli stanno accanto, su celle libere, mai dentro un edificio', a.alberelli.every(t => edifici.every(e => !(t.x >= e.i && t.x <= e.i + e.w && t.z >= e.j && t.z <= e.j + e.d))))
  const nessuna = S.addobbiNatale(edifici, () => false, 20261105)
  uguale('senza una cella libera niente alberelli (ma stelle e lucine sì)', nessuna.alberelli.length === 0 && nessuna.stelle.length === 3 && nessuna.luci.length > 10, true)
  controlla('le lucine sono rosse e gialle a turno, tutte attorno agli edifici e sotto la gronda', a.luci.some(l => l.rosso) && a.luci.some(l => !l.rosso) && a.luci.every(l => l.y > 0.3 && l.y <= 1.5))
  stessaLista('senza edifici non c\'è niente', S.addobbiNatale([], libera, 1), { stelle: [], alberelli: [], luci: [] })
}
{
  const vuota = (i, j) => i < 4 || j < 4
  const c = S.chiazzeDiNeve(-10, -10, 10, 10, vuota, 99), c2 = S.chiazzeDiNeve(-10, -10, 10, 10, vuota, 99)
  stessaLista('le chiazze sono quelle del giorno', c, c2)
  controlla('ce ne sono, non troppe', c.length > 10 && c.length <= S.CHIAZZE.massimo)
  controlla('mai dove non è vuoto', c.every(x => vuota(Math.floor(x.x), Math.floor(x.z))))
  controlla('ogni giorno ha le sue', JSON.stringify(c) !== JSON.stringify(S.chiazzeDiNeve(-10, -10, 10, 10, vuota, 100)))
  uguale('il tetto vale', S.chiazzeDiNeve(-200, -200, 200, 200, () => true, 1).length, S.CHIAZZE.massimo)
}
{
  const edifici = [{ i: 0, j: 0, w: 3, d: 3, alto: 2.6 }, { i: 6, j: 0, w: 2, d: 2, alto: 3 }]
  const luci = S.addobbiNatale(edifici, () => true, 7).luci, g = S.ghiaccioli(luci)
  stessaLista('i ghiaccioli stanno sempre allo stesso posto', g, S.ghiaccioli(luci))
  controlla('ce ne sono, ma non uno per ogni coppia di lucine (la fila non è un pettine)', g.length > 5 && g.length < luci.length - 1)
  controlla('sotto la gronda, fra due lucine vicine, corti', g.every(x => luci.some(l => Math.hypot(l.x - x.x, l.z - x.z) < 0.3 && x.y > l.y)) && g.every(x => x.lungo >= 0.12 && x.lungo <= 0.35))
  controlla('mai a cavallo di due edifici', g.every(x => edifici.some(e => x.x >= e.i - 0.1 && x.x <= e.i + e.w + 0.1 && x.z >= e.j - 0.1 && x.z <= e.j + e.d + 0.1)))
  stessaLista('senza lucine niente ghiaccioli', S.ghiaccioli([]), [])
}

/* ══════════ 3. Halloween: le zucche si offrono solo in stagione ══════════ */
{
  const statoMenu = (stagione, mag = {}) => ({ stagione, livello: 99, prezzoPezzo: t => PEZZI[t].prezzo, nelMagazzino: t => mag[t] || 0, posseduti: {} })
  const ids = st => Object.values(schedeDi(st)).flat().map(c => c.id)
  controlla('fuori stagione le zucche non sono nel menu', !ids(statoMenu('')).includes('zucca_intagliata') && !ids(statoMenu(null)).includes('zucche_mucchio'))
  controlla('a Natale neanche', !ids(statoMenu('natale')).includes('zucca_intagliata'))
  controlla('a Halloween ci sono, nei decori', ids(statoMenu('halloween')).includes('zucca_intagliata') && schedeDi(statoMenu('halloween')).decori.some(c => c.id === 'zucche_mucchio'))
  controlla('comprata e finita la festa, nel magazzino si offre ancora (si rimette gratis)', ids(statoMenu('', { zucca_intagliata: 1 })).includes('zucca_intagliata'))
  controlla('il pupazzo di neve c\'è solo a Natale, fra le feste', schedeDi(statoMenu('natale')).feste.some(c => c.id === 'pupazzo_neve') && !ids(statoMenu('halloween')).includes('pupazzo_neve') && !ids(statoMenu(null)).includes('pupazzo_neve'))
  uguale('e costa come una zucca', PEZZI.pupazzo_neve.prezzo, 8)
  // W20: il segnalino 🎃/🎄 (come quello del baule 2D) finché non si possiede nessun pezzo della festa
  {
    const { festaDaScoprire } = await import('../../src/giochi/fattoria3d/dati/carte.js')
    const fe = (stagione, liv = 99, ha = () => false) => festaDaScoprire({ stagione, livello: liv, haPosato: ha })
    uguale('fuori stagione nessun segnalino', fe(null), null)
    controlla('a Halloween il segnalino è la zucca, sui decori', fe('halloween').icona === '🎃' && fe('halloween').scheda === 'decori')
    controlla('a Natale è l\'albero, sulle feste', fe('natale').icona === '🎄' && fe('natale').scheda === 'feste')
    uguale('posata una zucca il segnalino se ne va', fe('halloween', 99, t => t === 'zucca_intagliata'), null)
    uguale('se il livello non ha aperto niente della festa non si indica niente', fe('halloween', 0), null)
    controlla('le carte indicate sono solo pezzi di quella festa', fe('halloween').ids.every(id => PEZZI[id].stagione === 'halloween') && fe('halloween').ids.includes('zucche_mucchio'))
  }
  controlla('i prezzi sono quelli della 2D (6 e 10)', PEZZI.zucca_intagliata.prezzo === 6 && PEZZI.zucche_mucchio.prezzo === 10)
  controlla('non sono roba di un livello né sorprese della mongolfiera', !roba(2).pezzi.some(p => p.stagione) && !SORPRESE.includes('zucca_intagliata') && !SORPRESE.includes('zucche_mucchio'))
  const b = { monete: 500 }
  const f = new Fattoria3d({ stato: null, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
  f.s.esperienza = sogliaDi(3)
  for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o)
  let r = null
  for (let j = -3; j < 8 && !r; j++) for (let i = -7; i < 5 && !r; i++) if (f.puoMettere('zucche_mucchio', i, j).ok) r = f.compraEMetti('zucche_mucchio', i, j)
  controlla('si compra e si mette come un decoro, per 10 monete', !!r && r.ok && r.costo === 10 && b.monete === 490)
  controlla('e si può girare', f.ruotaPezzo(r.cosa.id).ok && f.cosa(r.cosa.id).rot === 1)
  const badge = () => ({ el: { hidden: false, style: {} }, testo: '', imposta() {}, togli() {}, metti() {}, bestie() {} })
  const p = new Pezzi(new THREE.Scene(), f, { nuovoBadge: badge, nuovoCartello: badge, fumata() {} }, { proietta: () => [0, 0, true] }, { vento: false })
  p.sincronizza()
  const g = p.voce(r.cosa.id).grp
  controlla('il modello c\'è e non è la scatola grigia di ripiego', g.children.length > 0 && !g.userData.segnaposto && p.modello('zucca_intagliata').children.length > 0)
  let tri = 0, mesh = 0; g.traverse(o => { if (o.isMesh) { mesh++; tri += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3 } })
  controlla('pesa poco (poche mesh, pochi triangoli)', mesh <= 10 && tri < 800, `mesh ${mesh}, triangoli ${tri}`)
}

/* ══════════ 4. la scena: si tinge, disegna poco, e quando finisce non resta niente ══════════ */
{
  const b = { monete: 5000 }
  const f = new Fattoria3d({ stato: null, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
  f.s.esperienza = sogliaDi(14)
  for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o)
  const badge = () => ({ el: { hidden: false, style: {} }, testo: '', imposta() {}, togli() {}, metti() {}, bestie() {} })
  const scena = new THREE.Scene()
  const p = new Pezzi(scena, f, { nuovoBadge: badge, nuovoCartello: badge, fumata() {} }, { proietta: () => [0, 0, true] }, { vento: false })
  let mi = null
  for (let j = -3; j < 8 && !mi; j++) for (let i = -7; i < 5 && !mi; i++) if (f.puoMettere('mulino', i, j).ok) mi = [i, j]
  f.compraEMetti('mulino', mi[0], mi[1]); p.sincronizza()
  scena.background = new THREE.Color(0xbfe0f0); scena.fog = new THREE.Fog(0xbfe0f0, 38, 90)
  const emisfero = new THREE.HemisphereLight(0xdff1ff, 0x7a9a5a, 1.05), sole = new THREE.DirectionalLight(0xfff0d0, 2.3)
  scena.add(emisfero, sole)
  const camera = { x: mi[0], z: mi[1] }
  const figli0 = scena.children.length
  const crea = (nome, q = { particelle: true }) => new Stagione({ scena, emisfero, sole, motore: f, pezzi: p, camera, qualita: q, nome })

  const n = crea('natale')
  uguale('a Natale il cielo si tinge di grigio-azzurro', scena.background.getHex(), S.ASPETTI.natale.cielo)
  uguale('e la nebbia con lui, più corta', scena.fog.color.getHex() === S.ASPETTI.natale.cielo && n.nebbia[1] < 90, true)
  controlla('la luce cambia', sole.color.getHex() === S.ASPETTI.natale.sole[0] && Math.abs(sole.intensity - S.ASPETTI.natale.sole[1]) < 1e-9)
  controlla('ci sono chiazze, una stella, le lucine', n.chiazze.count > 5 && n.stelle.count === 1 && n.lucine.count > 5)
  const disegni = []; n.gruppo.traverse(o => { if (o.isMesh) disegni.push(o) }); disegni.push(n.punti)
  controlla('i disegni di Natale sono pochi: una sola draw call per famiglia (≤ 8 oggetti: sette famiglie e i fiocchi)', disegni.length <= 8, 'oggetti ' + disegni.length)
  // la neve: le facce in alto del mulino prendono la copia innevata del loro materiale, una per materiale
  const mulino = [...p.voci.values()].find(v => v.tipo === 'mulino').grp, innevate = []
  mulino.traverse(o => { if (o.isMesh && o.visible) innevate.push(o.material.userData.innevato === true) })
  controlla('a Natale il mulino ha la neve sui materiali', innevate.length > 0 && innevate.every(Boolean), innevate.join())
  const copie = n.neve.copie.size; n.sporca(); n.aggiorna(0.5, 1)
  uguale('rifare non moltiplica le copie', n.neve.copie.size, copie)
  // il fiato: un solo Points, spento col basso, e butta una nuvoletta quando è il momento
  const chi = new THREE.Group(); chi.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.3).translate(0, 0.8, 0)))
  n.respira(() => [{ grp: chi, tipo: 'contadino' }])
  controlla('il fiato è un solo Points', n.fiato.punti.isPoints && n.fiato.punti.visible)
  n.aggiorna(10, 1); n.aggiorna(14, 1)
  const nate = Array.from(n.fiato.nata.array).filter(t => t > 0)
  controlla('respira: una nuvoletta davanti alla bocca, all\'altezza della testa', nate.length === 1 && n.fiato.pos.getY(0) > 1.1 && n.fiato.pos.getZ(0) > 0.2, n.fiato.pos.array.slice(0, 3).join())
  controlla('e istanziati, non mesh una per una', disegni.filter(o => o.isMesh).every(o => o.isInstancedMesh))
  controlla('i fiocchi sono un solo Points', n.punti.isPoints && n.punti.visible)
  n.applica({ particelle: false })
  uguale('col preset basso i fiocchi e il fiato si spengono (il resto resta)', n.punti.visible === false && n.fiato.punti.visible === false && n.chiazze.count > 5, true)
  n.applica({ particelle: true })
  const c1 = n.chiazze.count
  camera.x += 40; n.aggiorna(1, 1)
  controlla('spostando la camera di molto le chiazze si rifanno attorno a lei', n.quadrato[0] === Math.floor(camera.x / 6))
  void c1
  n.aggiorna(2, 1)
  uguale('il tempo è un uniform', n.punti.material.uniforms.uT.value, 2)
  controlla('il centro dei fiocchi segue la camera', n.punti.material.uniforms.uCentro.value.x === camera.x)
  f.compraEMetti('fienile', 0, 0)                                   // anche un rifiuto va bene: il punto è che `sporca()` non rompe
  n.sporca(); n.aggiorna(3, 1)
  n.via()
  const tornate = []; mulino.traverse(o => { if (o.isMesh && o.visible) tornate.push(!o.material.userData.innevato) })
  controlla('finita la festa il mulino ha di nuovo i suoi materiali', tornate.every(Boolean))
  uguale('finita la festa il cielo torna com\'era', scena.background.getHex(), 0xbfe0f0)
  controlla('e la nebbia e le luci', scena.fog.color.getHex() === 0xbfe0f0 && sole.color.getHex() === 0xfff0d0 && Math.abs(sole.intensity - 2.3) < 1e-9 && Math.abs(emisfero.intensity - 1.05) < 1e-9)
  uguale('e la scena non ha più niente di suo', scena.children.length, figli0)

  const h = crea('halloween')
  uguale('a Halloween il cielo è al tramonto', scena.background.getHex(), S.ASPETTI.halloween.cielo)
  uguale('le lucciole sono un solo Points, e il resto è vuoto', h.punti.isPoints && h.gruppo.children.length === 0, true)
  h.aggiorna(1, 1); h.sporca(); h.aggiorna(2, 1)
  h.via()
  uguale('anche Halloween non lascia niente', scena.children.length, figli0)
  controlla('e il cielo è tornato', scena.background.getHex() === 0xbfe0f0)
}

riassunto('Fattoria 3D — le stagioni')
