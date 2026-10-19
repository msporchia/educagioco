/* ═══════════════════════════════════════════════════════════════════
   I MOSTRI DI SOPRA A SCHERMO, SENZA SCHERMO — docs/sotterraneo/mondo-aperto-mostri.md («La scena»)

   La parte pura della scena dei mostri di sopra: chi si disegna (il cerchio di luce attorno all'eroe, la nebbia, chi sta nello
   scontro), con quale figura (dorme, corre, il signore più grande), dove cade il palco nel mondo, il passo di ogni fotogramma col
   tempo vero (a 120 Hz non va il doppio), il tocco su un mostro lontano, lo scontro lasciato con la ✕ (i morti restano morti, i
   rimasti tornano accanto all'eroe, svegli e feriti), le forze di sopra per la barra e chi cura, e il conto delle taglie della
   bacheca (la caccia aperta, il signore, la tana) dai mostri caduti.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondo, terraDelMondo, aperturaDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { popolaMondo, incontro, muoviMostri, apriLoScontro, esitoDelloScontro, inSalvo, tanaDi, alSicuro } from '../../src/giochi/sotterraneo/motore/aperta.js'
import { fotoDelloScontro, lasciaLoScontro, rimettiLoScontro, doveToccare, taglieDelloScontro } from '../../src/giochi/sotterraneo/motore/aperta-scena.js'
import { forzeDiSopra, curaDiSopra, allaCitta } from '../../src/giochi/sotterraneo/motore/forze-sopra.js'
import { luceDelCerchio, figuraDiSopra, mostriDaDisegnare, coseDaDisegnare, PIU_GRANDE } from '../../src/giochi/sotterraneo/scena3d/mondo/mostri.js'
import { creaMostriSopra } from '../../src/giochi/sotterraneo/viste/mondo-mostri.js'
import { EROE_SUL_PALCO } from '../../src/giochi/sotterraneo/motore/palco.js'
import { SOPRA } from '../../src/giochi/sotterraneo/dati/mondo-aperto-mostri.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { diario } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondo()
const terra = terraDelMondo(m, aperturaDi([]).aperto)
const forte = { eroe: 'cavaliere', roba: robaAttesa('cavaliere', 7), crescita: crescitaAttesa('cavaliere', 7) }
const giocaFinoInFondo = (corsa, giusto = () => true) => { for (let i = 0; i < 400 && corsa.foglio && corsa.foglio.che === 'scontro'; i++) corsa.rispondi(giusto()) }
// una cella da cui il branco di `q` arriva addosso: a cinque o sei passi, nella sua regione, fuori dalla cintura, e senza niente in
// mezzo (si prova: in quattro secondi c'è l'incontro)
function cellaVicina(q) {
  for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) {
    const x = q.casa.x + dx, y = q.casa.y + dy, d = Math.hypot(dx, dy)
    if (d < 5 || d > 6 || !terra.passa(x, y) || m.reg[y * m.W + x] !== q.regione || alSicuro(m, x + 0.5, y + 0.5)) continue
    const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
    let inc = null
    for (let t = 0; t < 4 && !inc; t += 0.05) { muoviMostri(s, { x: x + 0.5, y: y + 0.5 }, 0.05); inc = incontro(s, { x: x + 0.5, y: y + 0.5 }) }
    if (inc && inc.campo.includes(q.i)) return { x: x + 0.5, z: y + 0.5 }
  }
  return null
}

/* ── il cerchio di luce ── */
{
  uguale('dentro il cerchio si vede tutto', luceDelCerchio(2), 1)
  uguale('fuori niente', luceDelCerchio(SOPRA.vista + 0.1), 0)
  uguale('sul bordo niente', luceDelCerchio(SOPRA.vista), 0)
  const a = luceDelCerchio(SOPRA.vista - 0.5), b = luceDelCerchio(SOPRA.vista - 1)
  controlla('nell\'orlo sfuma, piano', a > 0 && a < b && b < 1, `${a} ${b}`)
}

/* ── chi si disegna, e come ── */
const s0 = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
{
  const q = s0.mostri.find(x => !x.caporale && !x.signore && m.regioni[x.regione].chiave === 'campi')
  const sig = s0.mostri.find(x => x.signore)
  const f = figuraDiSopra(q, 0), fc = figuraDiSopra(q, 0, true)
  controlla('chi dorme respira (la posa da fermo)', f.pezzo.includes('-fermo-'), f.pezzo)
  controlla('chi corre corre', fc.pezzo.includes('-corsa-') || fc.pezzo.includes('-fermo-'), fc.pezzo)
  const finto = { ...sig, signore: false, caporale: false }
  uguale('il signore è più grande della sua specie', Math.round(figuraDiSopra(sig, 0).scala / figuraDiSopra(finto, 0).scala * 100) / 100, PIU_GRANDE.signore)
  // i fotogrammi vanno col tempo: lo stesso istante, lo stesso fotogramma (a qualsiasi frequenza)
  uguale('lo stesso istante, la stessa figura', figuraDiSopra(q, 1.234, true).pezzo, figuraDiSopra(q, 1.234, true).pezzo)
  const io = { x: q.fx + 3, z: q.fy }
  const l = mostriDaDisegnare([q, sig], { x: io.x, z: io.z, t: 0 })
  uguale('il lontano non si disegna (fuori dal cerchio)', l.map(x => x.i).join(), String(q.i))
  uguale('e nemmeno nella nebbia', mostriDaDisegnare([q], { x: io.x, z: io.z, t: 0, visto: () => false }).length, 0)
  uguale('né chi sta nello scontro', mostriDaDisegnare([q], { x: io.x, z: io.z, t: 0, salta: new Set([q.i]) }).length, 0)
  uguale('un morto mai', mostriDaDisegnare([{ ...q, morto: true }], { x: io.x, z: io.z, t: 0 }).length, 0)
  controlla('fermo, guarda l\'eroe', l[0].specchio === false, String(l[0].specchio))
  const mem = new Map()
  mostriDaDisegnare([q], { x: io.x, z: io.z, t: 0, memoria: mem })
  const va = { ...q, fx: q.fx - 0.3 }
  controlla('andando a sinistra guarda a sinistra', mostriDaDisegnare([va], { x: io.x, z: io.z, t: 0.1, memoria: mem })[0].specchio === true)
  uguale('il nome lo hanno il signore e i caporali', mostriDaDisegnare([sig], { x: sig.fx, z: sig.fy, t: 0 })[0].nome, sig.scheda.nome)
  const cose = coseDaDisegnare([{ cosa: 'pozione', x: 3, y: 4 }, { cosa: 'non-esiste', x: 1, y: 1 }], { cose: COSE })
  uguale('il bottino per terra: le cose vere, al centro della cella', JSON.stringify(cose.map(c => [c.i, c.x, c.z])), JSON.stringify([[0, 3.5, 4.5]]))
}

/* ── il palco nel mondo ── */
{
  const { palcoNelMondo } = await import('../../src/giochi/sotterraneo/scena3d/mondo/palco.js')
  const io = { x: 90.5, z: 43.5 }
  const p = palcoNelMondo(io, (x, y) => terra.passa(x, y))
  uguale('l\'eroe sul palco cade sui suoi piedi', [EROE_SUL_PALCO.x + 0.5 + p.O.x, EROE_SUL_PALCO.y + 0.5 + p.O.z].join(), [io.x, io.z].join())
  uguale('la sua cella si calpesta come nel mondo', p.pianta.calpestabile(EROE_SUL_PALCO.x, EROE_SUL_PALCO.y), terra.passa(90, 43))
  const ids = new Set()
  for (let y = -5; y < 15; y++) for (let x = -5; x < 25; x++) ids.add(p.pianta.id(x, y))
  uguale('ogni cella del palco ha il suo nome, anche fuori', ids.size, 20 * 30)
}

/* ── il passo a ogni fotogramma: col tempo vero, non coi fotogrammi ── */
{
  const q = s0.mostri.find(x => !x.caporale && m.regioni[x.regione].chiave === 'campi' && cellaVicina(x))
  const io = cellaVicina(q)
  const a = creaMostriSopra({ m, eroe: 'cavaliere', giro: 0 }), b = creaMostriSopra({ m, eroe: 'cavaliere', giro: 0 })
  const qa = a.stato.mostri[q.i], qb = b.stato.mostri[q.i]
  let ia = null, ib = null
  for (let i = 0; i < 30 && !ia; i++) ia = a.passo(1 / 60, io)
  for (let i = 0; i < 60 && !ib; i++) ib = b.passo(1 / 120, io)
  controlla('mezzo secondo a 60 Hz e a 120 Hz: lo stesso cammino', Math.abs(qa.fx - qb.fx) < 0.08 && Math.abs(qa.fy - qb.fy) < 0.08 && Math.hypot(qa.fx - q.fx, qa.fy - q.fy) > 0.5, `${qa.fx},${qa.fy} · ${qb.fx},${qb.fy}`)
  uguale('e tutti e due svegli', [qa.sveglio, qb.sveglio].join(), 'true,true')
  let inc = ia
  for (let i = 0; i < 400 && !inc; i++) inc = a.passo(1 / 60, io)
  controlla('il branco arriva addosso: lo scontro si apre', inc && inc.campo.includes(q.i))
  const c = creaMostriSopra({ m, eroe: 'cavaliere', giro: 0 })
  uguale('fermo (una domanda aperta) nessuno si muove', c.passo(1, io, { fermo: true }), null)
  uguale('…e nessuno si è svegliato', c.stato.mostri[q.i].sveglio, false)
  // il tocco su un mostro lontano: l'eroe ci va, e arrivato a portata lo scontro si apre col tocco
  const t = c.tocca(q.i, { x: q.fx + 9, z: q.fy }, (x, y) => terra.passa(x, y))
  controlla('lontano: una cella dove andare', t && t.cella && terra.passa(t.cella.x, t.cella.y))
  const vicino = { x: c.stato.mostri[q.i].fx - 1, z: c.stato.mostri[q.i].fy }
  const it = c.passo(1e-3, vicino)
  controlla('arrivato a portata: lo scontro, col tocco', it && it.chi === q.i && it.tocco === true, JSON.stringify(it))
  uguale('dove toccare un mostro: la sua cella, se ci si cammina', JSON.stringify(doveToccare({ fx: 90.2, fy: 43.7 }, (x, y) => x === 90 && y === 43)), JSON.stringify({ x: 90, y: 43 }))
  uguale('se no accanto', JSON.stringify(doveToccare({ fx: 90.2, fy: 43.7 }, (x, y) => x === 89 && y === 43)), JSON.stringify({ x: 89, y: 43 }))
}

/* ── la ✕ a metà: una fuga senza il graffio, e i rimasti che aspettano ── */
{
  const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
  const q = s.mostri.find(x => !x.caporale && m.regioni[x.regione].chiave === 'colle' && s.branchi[x.branco].length >= 2 && cellaVicina(x))
  const io = cellaVicina(q)
  const inc = incontro(s, { x: q.fx - 1, y: q.fy }, { tocco: q.i })
  const corsa = apriLoScontro(s, inc, forte)
  const foto = fotoDelloScontro(corsa)
  uguale('la foto all\'inizio: tutti quelli in campo', foto.campo.length, inc.campo.length)
  // un colpo solo: si risponde finché il primo cade, poi la ✕
  for (let i = 0; i < 40 && corsa.foglio && corsa.foglio.che === 'scontro' && !corsa.livello.robe.some(r => r.che === 'mostro' && r.morto); i++) corsa.rispondi(true)
  const vita = corsa.vita
  const { esito, scontro } = lasciaLoScontro(s, corsa)
  const caduti = corsa.livello.robe.filter(r => r.che === 'mostro' && r.morto).map(r => r.mondo)
  if (inc.campo.length > caduti.length) {
    uguale('lasciato a metà vale come una fuga', esito.come, 'scappato')
    uguale('senza il graffio: la vita è quella di prima', esito.forze.vita, vita)
    controlla('chi è caduto resta morto', caduti.every(i => s.mostri[i].morto))
    uguale('i rimasti nella foto', scontro.campo.length, inc.campo.length - caduti.length)
    const r = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
    const salvo = JSON.parse(JSON.stringify({ ...inSalvo(s), scontro }))
    const v = creaMostriSopra({ m, eroe: 'cavaliere', giro: 0, salvato: salvo })
    const rimessi = scontro.campo.map(([i]) => v.stato.mostri[i])
    controlla('rientrando i rimasti sono svegli', rimessi.every(x => x.sveglio))
    controlla('accanto all\'eroe', rimessi.every(x => Math.hypot(x.fx - (scontro.x + 0.5), x.fy - (scontro.y + 0.5)) <= 3.5), rimessi.map(x => `${x.fx},${x.fy}`).join(' '))
    stessaLista('con le loro ferite', rimessi.map(x => x.ossa), scontro.campo.map(([, o]) => o))
    controlla('e i caduti ancora morti', caduti.every(i => v.stato.mostri[i].morto))
    let ri = null
    for (let i = 0; i < 200 && !ri; i++) ri = v.passo(1 / 30, { x: scontro.x + 0.5, z: scontro.y + 0.5 })
    controlla('lo scontro si riapre da sé', ri && scontro.campo.some(([i]) => ri.campo.includes(i)), JSON.stringify(ri))
    controlla('un altro eroe non li trova', creaMostriSopra({ m, eroe: 'mago', giro: 0, salvato: salvo }).stato.mostri.every(x => !x.sveglio))
    void r
  } else controlla('(lo scontro è finito al primo colpo: niente da lasciare)', true)
  // svenuti resta svenuto anche con la ✕
  const s2 = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
  const inc2 = incontro(s2, { x: q.fx - 1, y: q.fy }, { tocco: q.i })
  const debole = apriLoScontro(s2, inc2, { eroe: 'cavaliere', forze: { vita: 1, energia: 0 } })
  giocaFinoInFondo(debole, () => false)
  uguale('(svenuti)', debole.foglio && debole.foglio.che, 'svenuto')
  const l2 = lasciaLoScontro(s2, debole, { terra })
  uguale('la ✕ sul foglio dello svenimento non salva nessuno', l2.esito.come, 'svenuto')
  uguale('e non lascia nessuno ad aspettare', l2.scontro, null)
  void io
}

/* ── le forze di sopra ── */
{
  uguale('piene: niente da dire', forzeDiSopra({ vita: 30, energia: 10 }, 30, 10), null)
  uguale('null: piene', forzeDiSopra(null, 30, 10), null)
  stessaLista('ferito: la vita e i massimi di adesso', forzeDiSopra({ vita: 12, energia: 10 }, 30, 10), { vita: 12, vitaMax: 30, energia: 10, energiaMax: 10 })
  stessaLista('mai sopra il massimo della roba', forzeDiSopra({ vita: 50, energia: 3 }, 30, 10), { vita: 30, vitaMax: 30, energia: 3, energiaMax: 10 })
  stessaLista('la guaritrice cura la vita', curaDiSopra({ vita: 5, energia: 2 }, 'vita', 30, 10), { vita: 30, energia: 2 })
  stessaLista('l\'incantatrice l\'energia', curaDiSopra({ vita: 5, energia: 2 }, 'energia', 30, 10), { vita: 5, energia: 10 })
  uguale('la fontana tutto: piene', curaDiSopra({ vita: 5, energia: 2 }, 'tutto', 30, 10), null)
  uguale('al villaggio', allaCitta('Il villaggio'), 'al villaggio')
  uguale('al forte del guado', allaCitta('Il forte del guado'), 'al forte del guado')
  uguale('alla …', allaCitta('La rocca'), 'alla rocca')
}

/* ── le taglie della bacheca: la caccia aperta, il signore, la tana ── */
{
  const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
  const caccia = 't:villaggio:caccia-aperta:rovine.zombie:0', sig = 't:villaggio:signore:rovine:0', tana = 't:villaggio:tana:rovine:0', altra = 't:villaggio:caccia-aperta:rovine.fantasma:0'
  const stati = { [caccia]: 'presa', [sig]: 'presa', [tana]: 'presa', [altra]: 'presa' }
  const z = { specie: 'zombie', regione: 'rovine', anello: 2, livello: 7, caporale: false, signore: false, id: 'rovine:1' }
  let t = taglieDelloScontro([z, z], { stati, conti: { [caccia]: 3 }, stato: s })
  uguale('due zombie: la caccia conta (3 + 2)', t.conti[caccia], 5)
  uguale('l\'altra specie no', t.conti[altra], undefined)
  stessaLista('niente ancora fatto', t.fatte, [])
  t = taglieDelloScontro([z], { stati, conti: { [caccia]: 5 }, stato: s })
  stessaLista('il sesto: la caccia è fatta', t.fatte, [caccia])
  uguale('e il conto si ferma a sei', t.conti[caccia], 6)
  uguale('una caccia non presa non conta', taglieDelloScontro([z], { stati: {}, conti: {}, stato: s }).fatte.length, 0)
  // il signore della regione, e la tana col suo branco tutto a terra
  const tn = tanaDi(s, 'rovine')
  const delSignore = s.branchi[tn.branco]
  const signore = s.mostri.find(x => x.branco === tn.branco && x.signore)
  const tg = { specie: signore.tipo, regione: 'rovine', anello: 2, livello: signore.livello, caporale: true, signore: true, id: signore.id }
  for (const i of delSignore) if (i !== signore.i) s.mostri[i].morto = false
  signore.morto = true
  t = taglieDelloScontro([tg], { stati, conti: {}, stato: s })
  controlla('il signore caduto: la sua taglia è fatta', t.fatte.includes(sig))
  uguale('la tana, con le guardie in piedi, no', t.fatte.includes(tana), delSignore.length === 1)
  for (const i of delSignore) s.mostri[i].morto = true
  t = taglieDelloScontro([tg], { stati, conti: {}, stato: s })
  controlla('tutto il branco del signore a terra: la tana è ripulita', t.fatte.includes(tana))
  // con lo scontro vero: l'esito dà le taglie, e la caccia le conta
  const q = s.mostri.find(x => !x.caporale && m.regioni[x.regione].chiave === 'rovine' && x.tipo === 'zombie' && !x.morto)
  const inc = incontro(s, { x: q.fx - 1, y: q.fy }, { tocco: q.i })
  const corsa = apriLoScontro(s, inc, forte)
  giocaFinoInFondo(corsa)
  const e = esitoDelloScontro(s, corsa)
  const n = e.uccisi.filter(x => x.specie === 'zombie').length
  uguale('lo scontro vero: la caccia conta gli zombie caduti', taglieDelloScontro(e.uccisi, { stati, conti: {}, stato: s }).conti[caccia], n)
  // il diario le sa mostrare: la caccia col suo conto, il signore e la tana col loro caporale
  const d = diario({ [caccia]: 'presa', [sig]: 'presa', [tana]: 'fatta' }, [], null, { [caccia]: 4 }, true)
  const v = id => d.inMano.find(x => x.id === id)
  stessaLista('la caccia aperta: 4 di 6', v(caccia).progresso, { fatti: 4, quanti: 6 })
  controlla('il signore ha la faccia del suo caporale', !!v(sig).cosa.sprite && v(sig).cosa.nome.startsWith('Il signore'), JSON.stringify(v(sig).cosa))
  uguale('la tana fatta si consegna', v(tana).stato, 'fatta')
}

riassunto('i mostri di sopra a schermo')
