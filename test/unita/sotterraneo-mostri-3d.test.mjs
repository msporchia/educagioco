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
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { GROSSI } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { GRADI } from '../../src/giochi/sotterraneo/dati/varianti.js'
import { EFFETTI, SEGNI } from '../../src/giochi/sotterraneo/dati/effetti.js'
import { MODELLO_DI_SPECIE, MODELLO_DEL_GROSSO, MODELLO_DELLA_VARIANTE, voceDi, idDi, costruisci } from '../../src/giochi/sotterraneo/scena3d/mostri3d/registro.js'
import { ELENCHI } from '../../src/giochi/sotterraneo/scena3d/mostri3d/elenchi.js'
import { ferme, salda } from '../../src/giochi/sotterraneo/scena3d/salda3d.js'
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
{
  const ids = new Set()
  for (const tipo of Object.keys(MOSTRI)) for (const grado of GRADI) for (const variante of [null, 'arciere', 'guerriero', 'mago']) {
    const id = idDi({ tipo, grado, variante }); if (id) ids.add(id)
  }
  for (const k of Object.keys(GROSSI)) { const id = idDi({ grosso: k }); if (id) ids.add(id) }
  let prima = 0, dopo = 0
  for (const id of ids) {
    const g = costruisci(id)
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
    const conta = () => { let n = 0; g.traverse(o => { if (o.isMesh && o.visible) n++ }); return n }
    const n0 = conta()
    try { salda(g, ferme(g)) } catch (e) { controlla(`${id}: si salda`, false, e.message) }
    const n1 = conta()
    controlla(`${id}: saldato resta qualcosa`, n1 > 0 && n1 <= n0, `${n0} → ${n1}`)
    prima += n0; dopo += n1
  }
  nota(`${ids.size} modelli, mesh ${prima} → ${dopo} saldando i pezzi fermi`)
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
