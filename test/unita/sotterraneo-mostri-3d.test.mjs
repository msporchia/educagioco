/* ═══════════════════════════════════════════════════════════════════
   I MOSTRI E GLI EFFETTI 3D DEL SOTTERRANEO — docs/sotterraneo/mostri-3d.md

   Il registro (scena3d/mostri3d/registro.js): ogni specie e ogni grosso
   del gioco dichiara il suo modello o lo sprite (null), nessuna chiave
   punta a un prototipo che non c'è, ogni modello si costruisce in Node e
   ha `anima` (e, se dichiara un attacco, `attacca` con tempi sensati), e
   la saldatura dei pezzi fermi non lo svuota. Gli effetti: ogni effetto
   del gioco ha il suo 3D, i proiettili e gli stati pure. E le copie in
   src/ sono quelle dei prototipi (`npm run promuovi3d -- --controlla`).
   ═══════════════════════════════════════════════════════════════════ */
import { existsSync } from 'node:fs'
import { Vector3 } from 'three'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { GROSSI } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { GRADI } from '../../src/giochi/sotterraneo/dati/varianti.js'
import { EFFETTI, SEGNI } from '../../src/giochi/sotterraneo/dati/effetti.js'
import { MODELLO_DI_SPECIE, MODELLO_DEL_GROSSO, MODELLO_DELLA_VARIANTE, voceDi, idDi, costruisci } from '../../src/giochi/sotterraneo/scena3d/mostri3d/registro.js'
import { ELENCHI } from '../../src/giochi/sotterraneo/scena3d/mostri3d/elenchi.js'
import { ferme, studia, saldaTutto, vertici, disegnate } from '../../src/giochi/sotterraneo/scena3d/salda3d.js'
import { effettoDi, segnoDi, statoDi, PROIETTILE, SEGNO_COLPO } from '../../src/giochi/sotterraneo/scena3d/effetti3d/gestore.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

/* ── il registro copre il gioco ── */
{
  const senza = Object.keys(MOSTRI).filter(k => !(k in MODELLO_DI_SPECIE))
  controlla('ogni specie dichiara modello o sprite', senza.length === 0, senza.join(', '))
  const inPiu = Object.keys(MODELLO_DI_SPECIE).filter(k => !MOSTRI[k])
  controlla('ogni specie del registro c\'è nel gioco', inPiu.length === 0, inPiu.join(', '))
  const grossi = Object.keys(GROSSI).filter(k => !(k in MODELLO_DEL_GROSSO))
  controlla('ogni grosso dichiara il suo modello', grossi.length === 0, grossi.join(', '))
  // nessuna chiave orfana: ogni nome scritto nel registro è una voce di un elenco (o una zona non ancora promossa, detta)
  const tutti = [...Object.values(MODELLO_DI_SPECIE).flat(), ...Object.values(MODELLO_DEL_GROSSO), ...Object.values(MODELLO_DELLA_VARIANTE).flatMap(Object.values)].filter(Boolean)
  const orfani = tutti.filter(id => !voceDi(id) && (id.startsWith('proprio/') || ELENCHI[id.split('/')[0]]))
  controlla('nessuna chiave del registro senza prototipo', orfani.length === 0, orfani.join(', '))
  const zoneMancanti = [...new Set(tutti.filter(id => !voceDi(id)).map(id => id.split('/')[0]))]
  if (zoneMancanti.length) nota(`zone non promosse, restano sprite: ${zoneMancanti.join(', ')}`)
  const con = Object.keys(MOSTRI).filter(k => idDi({ tipo: k, grado: 'comune' }))
  controlla('ogni specie ha un modello 3D (nessuna resta allo sprite)', con.length === Object.keys(MOSTRI).length, Object.keys(MOSTRI).filter(k => !con.includes(k)).join(', '))
  nota(`${con.length}/${Object.keys(MOSTRI).length} specie in 3D; allo sprite: ${Object.keys(MOSTRI).filter(k => !con.includes(k)).join(', ')}`)
}

/* ── ogni modello si costruisce, si anima, attacca e si salda ── */
// dove stanno nel mondo i vertici delle mesh che si disegnano (somme e quadrati), pelle compresa: saldare non toglie né sposta vertici
function impronta(g) {
  const s = [0, 0, 0, 0]
  vertici(g, v => { s[0] += v.x; s[1] += v.y; s[2] += v.z; s[3] += v.lengthSq() })
  return s
}
// la pelle di un modello, nella posa di adesso: ogni vertice della SkinnedMesh sta dove il suo osso porterebbe il pezzo di prima (che
// resta lì, spento). Vale anche per i modelli che pescano a caso animandosi, dove due gemelli non si confrontano
const _a = new Vector3(), _b = new Vector3()
function scartoPelle(g) {
  g.updateMatrixWorld(true)
  if (g.userData.scheletro) g.userData.scheletro.update()
  let peggio = 0
  g.traverse(o => {
    if (!o.isSkinnedMesh) return
    const si = o.geometry.attributes.skinIndex
    let i = 0
    while (i < si.count) {
      const osso = o.skeleton.bones[si.getX(i)], p = osso.geometry.attributes.position, m = o.material, mo = osso.material
      // fuso coi colori nei vertici: il materiale dell'osso, com'è adesso, ha quel colore e il resto uguale (nessuno l'ha animato)
      const fusa = m.userData.fusa, vc = fusa && mo.vertexColors && osso.geometry.attributes.color, col = fusa && o.geometry.attributes.color
      // il largo porta nei vertici anche ruvidezza, metallo ed emissivo (aMat, aEmis); il fuso di colore li ha nel materiale
      const larga = fusa === 'larga', am = larga && o.geometry.attributes.aMat, ae = larga && o.geometry.attributes.aEmis
      if (fusa && !larga) peggio = Math.max(peggio, Math.abs(m.emissiveIntensity - mo.emissiveIntensity || 0), m.emissive ? m.emissive.clone().sub(mo.emissive).r ** 2 : 0)
      if (fusa) peggio = Math.max(peggio, Math.abs(m.opacity - mo.opacity), m.side !== mo.side ? 1 : 0)
      for (let j = 0; j < p.count; j++, i++) {
        o.getVertexPosition(i, _a).applyMatrix4(o.matrixWorld)
        _b.fromBufferAttribute(p, j).applyMatrix4(osso.matrixWorld)
        peggio = Math.max(peggio, _a.distanceTo(_b))
        if (fusa) {
          const k = vc ? [vc.getX(j), vc.getY(j), vc.getZ(j)] : [1, 1, 1]
          peggio = Math.max(peggio, Math.abs(col.getX(i) - mo.color.r * k[0]), Math.abs(col.getY(i) - mo.color.g * k[1]), Math.abs(col.getZ(i) - mo.color.b * k[2]))
          if (larga) peggio = Math.max(peggio, Math.abs(am.getX(i) - mo.roughness), Math.abs(am.getY(i) - mo.metalness), Math.abs(am.getZ(i) - mo.emissiveIntensity),
            Math.abs(ae.getX(i) - mo.emissive.r), Math.abs(ae.getY(i) - mo.emissive.g), Math.abs(ae.getZ(i) - mo.emissive.b))
        }
      }
    }
  })
  return peggio
}
const vicine = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-3 + 1e-6 * a[3])   // a[3] dà la misura: le matrici composte sbagliano di poco
// due istanze uguali: qualche modello pesca a caso costruendosi
const casuale = Math.random
const conSeme = (n, f) => { let s = n; Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647); try { return f() } finally { Math.random = casuale } }
{
  const ids = new Set()
  for (const tipo of Object.keys(MOSTRI)) for (const grado of GRADI) for (const variante of [null, 'arciere', 'guerriero', 'mago']) {
    const id = idDi({ tipo, grado, variante }); if (id) ids.add(id)
  }
  for (const k of Object.keys(GROSSI)) { const id = idDi({ grosso: k }); if (id) ids.add(id) }
  let prima = 0, dopo = 0
  for (const id of ids) {
    const g = conSeme(7, () => costruisci(id))
    controlla(`${id}: si costruisce`, !!g && g.isObject3D)
    if (!g) continue
    const u = g.userData
    controlla(`${id}: ha anima`, typeof u.anima === 'function')
    try { u.anima(1.3); u.anima(4.2) } catch (e) { controlla(`${id}: anima non si rompe`, false, e.message) }
    if (u.attacco) {
      const a = u.attacco
      controlla(`${id}: l'attacco ha durata e arrivo`, a.durata > 0 && a.durata < 3 && a.arrivo > 0 && a.arrivo < 1, JSON.stringify({ d: a.durata, a: a.arrivo }))
      controlla(`${id}: dichiara l'attacco e sa farlo`, typeof u.attacca === 'function')
      if (u.attacca) try { u.anima(0.5); u.attacca(0.3); u.attacca(a.arrivo); u.attacca(1) } catch (e) { controlla(`${id}: attacca non si rompe`, false, e.message) }
      if (a.proiettile && a.proiettile.tipo !== 'soffio') controlla(`${id}: il proiettile «${a.proiettile.tipo}» ha un effetto`, !!PROIETTILE[a.proiettile.tipo] && !!effettoDi(PROIETTILE[a.proiettile.tipo].chiave))
      if (!a.proiettile && SEGNO_COLPO[a.tipo]) controlla(`${id}: il segno del colpo «${a.tipo}» c'è`, !!segnoDi(SEGNO_COLPO[a.tipo]))
    }
    const conta = () => { let n = 0; disegnate(g, o => { if (o.isMesh) n++ }); return n }
    const n0 = conta()
    try { saldaTutto(g, studia(g)) } catch (e) { controlla(`${id}: si salda`, false, e.message) }
    const n1 = conta()
    controlla(`${id}: saldato resta qualcosa`, n1 > 0 && n1 <= n0, `${n0} → ${n1}`)
    prima += n0; dopo += n1
    // saldato e no, nelle stesse pose, hanno i vertici negli stessi posti: nessun pezzo che si muove è finito in una saldatura. I
    // gemelli hanno la stessa storia (qualche modello ricorda: la stessa sequenza di anima e attacca del saldato) e la stessa fase
    const gemello = () => {
      const n = conSeme(7, () => costruisci(id))
      if (!n) return null
      if ('fase' in g.userData) n.userData.fase = g.userData.fase   // la fase va col numero dell'istanza
      try { const nu = n.userData; nu.anima(1.3); nu.anima(4.2); if (nu.attacco && nu.attacca) { nu.anima(0.5); nu.attacca(0.3); nu.attacca(nu.attacco.arrivo); nu.attacca(1) }; ferme(n) } catch (e) { /* già detto sopra */ }
      return n
    }
    const nudo = gemello(), altro = gemello()
    if (nudo && altro) {
      let diverse = 0, capricci = 0, peggio = '', scarto = 0
      for (let k = 0; k < 20; k++) {   // istanti e colpi fuori dalla griglia di `ferme`
        const t = 0.53 + k * 1.37, p = ((k * 3) % 11) / 10
        for (const m of [nudo, altro, g]) { m.userData.anima(t); if (k % 2 && m.userData.attacca) m.userData.attacca(p) }
        scarto = Math.max(scarto, scartoPelle(g))
        const a = impronta(nudo)
        if (!vicine(a, impronta(altro))) capricci++
        else { const b = impronta(g); if (!vicine(a, b)) { diverse++; peggio = a.map((x, i) => (x - b[i]).toExponential(1)).join(' ') } }
      }
      if (capricci) nota(`${id}: due gemelli non saldati non vengono uguali, la saldatura non si confronta (la pelle sì, sotto)`)
      controlla(`${id}: saldato, i vertici stanno dove stavano`, diverse === 0, `${diverse} pose diverse (${peggio})`)
      controlla(`${id}: la pelle segue le ossa`, scarto < 1e-4, `scarto ${scarto.toExponential(1)}`)
    }
  }
  nota(`${ids.size} modelli, mesh ${prima} → ${dopo} saldando i pezzi fermi e con la pelle`)
}

/* ── gli effetti del gioco hanno il loro 3D ── */
{
  const senza = Object.entries(EFFETTI).filter(([k, s]) => !effettoDi(k, s.via)).map(([k]) => k)
  controlla('ogni effetto del gioco ha il 3D', senza.length === 0, senza.join(', '))
  const segni = SEGNI.filter(k => !segnoDi(k))
  controlla('ogni segno del gioco ha il 3D', segni.length === 0, segni.join(', '))
  for (const [tipo, p] of Object.entries(PROIETTILE)) controlla(`il proiettile ${tipo} ha l'effetto ${p.chiave}`, !!effettoDi(p.chiave))
  for (const chiave of ['veleno', 'debole', 'fermo', 'sanguina', 'esposto', 'rotto']) {
    for (const extra of [{}, { fuoco: true }, { gelo: true }]) {
      const k = statoDi({ chiave, ...extra })
      controlla(`lo stato ${chiave} ${JSON.stringify(extra)} ha il 3D`, !!k && !!effettoDi(k, 'stato'), k)
    }
  }
}

/* ── ogni modello del registro sta nel catalogo 3D (docs/core/catalogo-3d.md) ── */
{
  const { VOCI, ID_DEI_MOSTRI } = await import('../../strumenti/banco/catalogo-3d/sotterraneo.js')
  const ids = new Set(VOCI.map(v => v.id))
  const tutti = [...Object.values(MODELLO_DI_SPECIE).flat(), ...Object.values(MODELLO_DEL_GROSSO), ...Object.values(MODELLO_DELLA_VARIANTE).flatMap(Object.values)].filter(id => id && voceDi(id))
  const fuori = [...new Set(tutti)].filter(id => !ids.has(ID_DEI_MOSTRI(id)))
  controlla('ogni mostro 3D del registro è nel catalogo', fuori.length === 0, fuori.join(', '))
}

/* ── le copie sono quelle dei prototipi ── */
if (existsSync(new URL('../../poc/mostri-3d/mostri.js', import.meta.url))) {
  const { promuovi } = await import('../../strumenti/promuovi-3d.mjs')
  const log = console.log; console.log = () => {}
  const diversi = await promuovi({ scrivi: false })
  console.log = log
  controlla('le copie in src/ sono quelle di poc/ (npm run promuovi3d)', diversi.length === 0, diversi.join(', '))
  // la roba (docs/sotterraneo/roba-3d.md): ogni famiglia che ha il prototipo è fra i moduli del gioco (se no non si costruisce)
  const { FAMIGLIE_ROBA } = await import('../../strumenti/promuovi-3d.mjs')
  const { MODULI } = await import('../../src/giochi/sotterraneo/scena3d/roba3d/moduli.js')
  const conPrototipo = FAMIGLIE_ROBA.filter(f => existsSync(new URL(`../../poc/roba-3d/${f}.js`, import.meta.url)))
  const fuoriRoba = conPrototipo.filter(f => !MODULI[f])
  controlla('ogni famiglia della roba col prototipo è fra i moduli del gioco', fuoriRoba.length === 0, fuoriRoba.join(', '))
} else nota('poc/ non c\'è: il confronto con i prototipi si salta')

riassunto('mostri ed effetti 3d del sotterraneo')
