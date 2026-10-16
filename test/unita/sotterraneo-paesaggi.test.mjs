/* I paesaggi del Sotterraneo 3D senza browser (docs/sotterraneo/paesaggi-3d.md): la parte pura dei generatori.

   Ogni paesaggio ha tutto (forma di parete, disegno di pavimento e parete, colonne, aria, arredo) e i nomi esistono; il cheat
   veste una discesa senza cambiarne i numeri; le pareti scolpite sono chiuse (un punto condiviso fra due celle si sposta uguale),
   le cime stanno nei limiti (un parapetto non copre l'eroe), le normali guardano fuori; i disegni del pavimento sono diversi
   davvero fra un paesaggio e l'altro (non solo la tinta); l'arredo non sta mai sulla roba del piano né sulle porte.
   `node test/esegui.mjs sotterraneo-paesaggi --niente-build` */
import { CAMPAGNA, L_ABISSO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { PAESAGGI, inPaesaggio } from '../../src/giochi/sotterraneo/dati/paesaggi.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { ASPETTI_3D, aspettoDi, paesaggioDi, guastiDegliAspetti, baseDi } from '../../src/giochi/sotterraneo/scena3d/aspetti.js'
import { piantaDi } from '../../src/giochi/sotterraneo/scena3d/pianta.js'
import { scolpisciPareti, STILI_PARETE } from '../../src/giochi/sotterraneo/scena3d/pareti.js'
import { PAVIMENTI, MURI } from '../../src/giochi/sotterraneo/scena3d/pitture.js'
import { postiDellArredo, POSE_ARREDO } from '../../src/giochi/sotterraneo/scena3d/arredo3d.js'
import { postiDeiRaggi } from '../../src/giochi/sotterraneo/scena3d/raggi.js'
import { ARIA } from '../../src/giochi/sotterraneo/scena3d/particelle.js'
import { ALTO_MURO, PARAPETTO } from '../../src/giochi/sotterraneo/scena3d/costanti.js'
import { ACQUA } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const corsaDi = (tappa, seme) => new Corsa(tappa, { seme, rnd: seminato(seme) })

/* ══════════ 1. i dati: ogni paesaggio ha tutto, ogni nome esiste ══════════ */
{
  uguale('gli aspetti non hanno guasti', guastiDegliAspetti().join(' · '), '')
  controlla('almeno dieci paesaggi', Object.keys(ASPETTI_3D).length >= 10, Object.keys(ASPETTI_3D).length)
  for (const [k, a] of Object.entries(ASPETTI_3D)) {
    controlla(`${k}: l'aria esiste`, !!ARIA[a.aria])
    controlla(`${k}: almeno due tipi d'arredo`, (a.arredo || []).length >= 2)
    for (const [t] of a.arredo) controlla(`${k}: l'arredo «${t}» sa dove si posa`, !!POSE_ARREDO[t])
  }
  // forma e disegno: due paesaggi non hanno la stessa coppia di parete e pavimento
  const coppie = new Set(Object.values(ASPETTI_3D).map(a => `${a.parete.stile}/${a.trama}/${a.pav}`))
  uguale('ogni paesaggio ha la sua combinazione di parete e pavimento', coppie.size, Object.keys(ASPETTI_3D).length)
}

/* ══════════ 2. il cheat veste la discesa, senza cambiarne i numeri ══════════ */
{
  const t = CAMPAGNA[1]
  for (const k of Object.keys(PAESAGGI)) {
    const v = inPaesaggio(t, k)
    uguale(`${k}: lo scenario del motore è la base`, v.scenario, baseDi(k))
    uguale(`${k}: la stessa durezza`, JSON.stringify([v.dif, v.forza, v.mostri, v.piani]), JSON.stringify([t.dif, t.forza, t.mostri, t.piani]))
    const c = corsaDi(v, 11)
    uguale(`${k}: il piano si disegna in quel paesaggio`, paesaggioDi(c), k)
    uguale(`${k}: la famiglia di piante`, c.livello.pianta, PAESAGGI[k].pianta)
  }
  uguale('senza cheat il paesaggio è lo scenario', paesaggioDi(corsaDi(CAMPAGNA[0], 3)), 'cripta')
  uguale('un nome che non c\'è lascia la discesa com\'è', inPaesaggio(t, 'luna'), t)
  uguale('nell\'abisso, senza paesaggio, lo scenario del tratto', paesaggioDi(corsaDi(L_ABISSO, 5)), 'cantine')
  uguale('l\'aspetto di un paesaggio ha la roccia della sua base', aspettoDi('ghiaccio').roccia !== undefined, true)
}

/* ══════════ 3. le pareti scolpite: chiuse, nei limiti, girate verso fuori ══════════ */
const piani = [corsaDi(CAMPAGNA[1], 11), corsaDi(inPaesaggio(CAMPAGNA[1], 'grotta'), 11), corsaDi(CAMPAGNA[4], 7)]
for (const stile of Object.keys(STILI_PARETE)) {
  let triangoli = 0, peggio = 0, alto = 0, basso = 0, fuori = 0, facce = 0
  const t0 = performance.now()
  for (const c of piani) {
    const p = piantaDi(c.livello)
    const sc = scolpisciPareti(p, { stile, seme: 5 })
    triangoli += sc.triangoli
    // il campo che sposta è continuo: due punti a cavallo del confine fra due celle si spostano quasi uguale (niente crepe)
    for (const m of p.muri.slice(0, 200)) {
      const a = sc.sposta(m.x + 1 - 1e-4, 0.4, m.y + 0.5, m.basso), b = sc.sposta(m.x + 1 + 1e-4, 0.4, m.y + 0.5, m.basso)
      peggio = Math.max(peggio, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - 2e-4)
      const h = sc.altezza(m.x + 0.5, m.y + 0.5, m.basso)
      if (m.basso) basso = Math.max(basso, h); else alto = Math.max(alto, h)
    }
    // le normali delle facce di lato guardano via dalla cella
    for (let i = 0; i < sc.posizioni.length / 3; i++) {
      const ny = sc.normali[i * 3 + 1]
      if (Math.abs(ny) > 0.7) continue
      facce++
      const cella = sc.celle[i], cx = cella % p.W + 0.5, cz = Math.floor(cella / p.W) + 0.5
      const dx = sc.posizioni[i * 3] - cx, dz = sc.posizioni[i * 3 + 2] - cz
      if (dx * sc.normali[i * 3] + dz * sc.normali[i * 3 + 2] < -0.05) fuori++
    }
  }
  nota(`${stile}: ${triangoli} triangoli su tre piani, ${Math.round(performance.now() - t0)} ms`)
  dentro(`${stile}: niente crepe fra due celle`, peggio, -1, 0.002)
  dentro(`${stile}: un muro alto non supera il doppio`, alto, 0, ALTO_MURO * 2)
  dentro(`${stile}: un parapetto resta basso (l'eroe dietro si vede)`, basso, 0, PARAPETTO * 1.5)
  controlla(`${stile}: le facce guardano fuori dalla loro cella`, fuori / Math.max(1, facce) < 0.04, `${fuori} su ${facce}`)
  dentro(`${stile}: costa poco (meno di 60k triangoli a piano)`, triangoli / piani.length, 1, 60000)
}
{
  // la roccia non è liscia: fra due punti vicini della stessa faccia lo spostamento cambia; i blocchi quasi niente
  const p = piantaDi(piani[0].livello)
  const scarto = stile => { const sc = scolpisciPareti(p, { stile, seme: 5 }); let s = 0; for (const m of p.muri.slice(0, 100)) { const a = sc.sposta(m.x + 0.5, 0.6, m.y + 1); s += Math.hypot(a[0] - m.x - 0.5, a[2] - m.y - 1) } return s / 100 }
  controlla('la roccia è irregolare', scarto('roccia') > 0.08, scarto('roccia'))
  controlla('i blocchi sono quasi a filo', scarto('blocchi') < 0.05, scarto('blocchi'))
  controlla('il ghiaccio è a facce', scolpisciPareti(p, { stile: 'cristallo' }).faccette)
}

/* ══════════ 4. i disegni: diversi davvero, non solo nella tinta ══════════ */
{
  // il disegno in grigio di ogni pavimento, ridotto a 32×32: due paesaggi non si somigliano più di tanto
  const grigio = t => { const L = t.w, k = L / 32, o = new Float32Array(32 * 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { let s = 0; for (let j = 0; j < k; j += 4) for (let i = 0; i < k; i += 4) { const q = ((y * k + j) * L + x * k + i) * 4; s += t.col[q] * 0.3 + t.col[q + 1] * 0.59 + t.col[q + 2] * 0.11 } o[y * 32 + x] = s } const m = o.reduce((a, b) => a + b) / o.length; let v = 0; for (const x of o) v += (x - m) ** 2; v = Math.sqrt(v / o.length) || 1; return o.map(x => (x - m) / v) }
  const disegni = Object.entries(ASPETTI_3D).map(([k, a]) => [k, grigio(PAVIMENTI[a.pav](a, 256))])
  let peggio = -1, chi = ''
  for (let i = 0; i < disegni.length; i++) for (let j = i + 1; j < disegni.length; j++) {
    let s = 0; for (let q = 0; q < 1024; q++) s += disegni[i][1][q] * disegni[j][1][q]
    if (s / 1024 > peggio) { peggio = s / 1024; chi = `${disegni[i][0]}/${disegni[j][0]}` }
  }
  nota(`i pavimenti più simili: ${chi} (${peggio.toFixed(2)})`)
  controlla('due pavimenti non hanno lo stesso disegno', peggio < 0.6, `${chi}: ${peggio.toFixed(2)}`)
  for (const [k, f] of Object.entries(MURI)) { const t = f(ASPETTI_3D.cantine, 64, 80); controlla(`la parete «${k}» si disegna`, t.col.length === 64 * 80 * 4 && t.alt.every(Number.isFinite)) }
  controlla('il pavimento del ghiaccio è lucido, la terra no', PAVIMENTI.ghiaccio(ASPETTI_3D.ghiaccio, 64).rug[1] < PAVIMENTI.terra(ASPETTI_3D.grotta, 64).rug[1])
  controlla('il basalto arde nelle fessure', PAVIMENTI.basalto(ASPETTI_3D.inferno, 128).em.some(x => x > 100))
}

/* ══════════ 5. l'arredo: fitto, mai sulla roba, sulle porte o nell'acqua ══════════ */
{
  for (const k of Object.keys(ASPETTI_3D)) {
    const c = corsaDi(inPaesaggio(CAMPAGNA[2], k), 21), liv = c.livello, p = piantaDi(liv)
    const posti = postiDellArredo(p, liv, aspettoDi(k).arredo, 9)
    const tutti = Object.values(posti).flat()
    const occupate = new Set(liv.robe.map(r => p.id(r.x, r.y)))
    controlla(`${k}: l'arredo c'è, ed è fitto`, tutti.length >= (liv.stanze || []).length * 2, `${tutti.length} pezzi per ${liv.stanze.length} stanze`)
    controlla(`${k}: mai sulla roba del piano`, tutti.every(o => !occupate.has(p.id(o.cella.x, o.cella.y))))
    const sullAcqua = Object.entries(posti).filter(([t]) => POSE_ARREDO[t].dove === 'acqua').flatMap(([, l]) => l)
    controlla(`${k}: sempre su pavimento calpestabile (o sull'acqua, le ninfee)`, tutti.every(o => sullAcqua.includes(o) ? p.tipo[p.id(o.cella.x, o.cella.y)] === ACQUA : p.calpestabile(o.cella.x, o.cella.y)))
    controlla(`${k}: mai accanto a una porta`, tutti.every(o => liv.robe.every(r => r.che !== 'porta' || Math.max(Math.abs(r.x - o.cella.x), Math.abs(r.y - o.cella.y)) > 2)))
    uguale(`${k}: lo stesso piano ha lo stesso arredo`, JSON.stringify(postiDellArredo(p, liv, aspettoDi(k).arredo, 9)), JSON.stringify(posti))
  }
  const c = corsaDi(inPaesaggio(CAMPAGNA[1], 'tempio'), 11), p = piantaDi(c.livello)
  const raggi = postiDeiRaggi(p, c.livello.stanze, 3)
  controlla('il tempio ha le sue lame di luce, lontane dai muri', raggi.length > 0 && raggi.every(r => !p.roccia(r.cella.x, r.cella.y - 1)), raggi.length)
}

riassunto('sotterraneo paesaggi')
