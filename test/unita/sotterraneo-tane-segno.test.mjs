/* ═══════════════════════════════════════════════════════════════════
   IL SEGNO DI OGNI TANA — docs/sotterraneo/mondo-3d.md, «La tana»

   Ogni luogo del mondo di sopra ha una tana (la cella `tana`, dove
   motore/aperta.js mette il signore e le sue guardie): attorno al suo
   cuore sta un segno che cambia con l'habitat, e sotto una macchia di
   terra smossa. Qui: ogni tana ha il suo, sempre lo stesso per la stessa
   zona, mai su una strada, un ponte, l'acqua, un lotto, un ingresso, dentro
   la zona caricata e il quadrato che il generatore le riserva; la pianta
   non cambia; un segno per ogni famiglia di habitat; il fumo e le braci
   portano il nome del luogo, così si spengono col signore morto.
   ═══════════════════════════════════════════════════════════════════ */
import { scheletroDelMondo, caricaZona, scaricaZona, caricaTutto, ERBA } from '../../src/giochi/sotterraneo/motore/mondo-percorso.js'
import { propsDellaZona, propsDelPezzo } from '../../src/giochi/sotterraneo/scena3d/mondo/props-dove.js'
import { disegnaPropsAperti } from '../../src/giochi/sotterraneo/scena3d/mondo/props-aperto.js'
import { FAMIGLIA_DI, RICETTE, ricettaDi, forzaDellaTana } from '../../src/giochi/sotterraneo/scena3d/mondo/props-tana-dati.js'
import { Cantiere } from '../../src/giochi/sotterraneo/scena3d/mondo/kit.js'
import { pezzoDi, grigliaDi } from '../../src/giochi/sotterraneo/scena3d/mondo/pezzi.js'
import { popolaMondo, allineaZone, tanaDi, signoreVivo, inSalvo, riprendiMondo } from '../../src/giochi/sotterraneo/motore/aperta.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const m = caricaTutto(scheletroDelMondo())
const firme = () => JSON.stringify([m.firma, m.carico.map(c => c.firma), Array.from(m.strada).reduce((s, v) => (Math.imul(s, 31) + v) | 0, 7), Array.from(m.blocco).reduce((s, v) => (Math.imul(s, 31) + v) | 0, 7)])
const prima = firme()
const tutti = m.zone.flatMap((_, k) => propsDellaZona(m, k))
const luoghi = m.regioni.filter(R => R.tana)
const W = m.W
const suoi = R => tutti.filter(o => o.tana === R.chiave)

/* ── ogni tana ha il suo segno ── */
uguale('i luoghi con una tana sono ventiquattro (tutti tranne il villaggio)', luoghi.length, 24)
uguale('derivare i segni non cambia né le celle né la mappa di blocco né le firme', firme(), prima)
for (const R of luoghi) {
  const l = suoi(R)
  controlla(`${R.chiave} (${R.habitat}): ha una famiglia di segno`, !!FAMIGLIA_DI[R.habitat])
  dentro(`${R.chiave}: il segno ha almeno sei pezzi`, l.length, 6, 20)
  controlla(`${R.chiave}: tutto nella sua zona e attorno al suo cuore (a meno di quattro celle)`, l.every(o => o.zona === R.zona && Math.hypot(o.x - (R.tana.x + 0.5), o.z - (R.tana.y + 0.5)) < 4), l.map(o => o.tipo).join(','))
  const tipi = new Set(l.map(o => o.tipo))
  controlla(`${R.chiave}: ha almeno tre forme diverse`, tipi.size >= 3, [...tipi].join(','))
}

/* ── dove stanno ── */
{
  let strada = 0, acqua = 0, fuoriBox = 0, ponte = 0, campo = 0, altra = 0, doppie = 0, porta = 0, citta = 0, lotto = 0
  const celle = new Set()
  for (const o of tutti.filter(q => q.tana)) {
    const R = m.regioni.find(r => r.chiave === o.tana), cx = Math.floor(o.x), cy = Math.floor(o.z), k = cy * W + cx
    if (m.terreno[k] !== ERBA) acqua++
    if (m.strada[k]) strada++
    if (m.ponte[k] >= 0 || m.varco[k] >= 0) ponte++
    if (m.campo[k] || m.blocco[k] === 1 || m.isola[k]) campo++
    if (m.zona[k] !== o.zona) altra++
    if (Math.abs(cx - R.tana.x) > 4 || Math.abs(cy - R.tana.y) > 4) fuoriBox++
    if (m.riservato[k] && (Math.abs(cx - R.tana.x) > 3 || Math.abs(cy - R.tana.y) > 3)) lotto++
    if (m.zonaCitta[k]) citta++
    for (const p of m.posti) if (p.w && cx >= p.x - 1 && cy >= p.y - 1 && cx <= p.x + p.w && cy <= p.y + p.h) lotto++
    for (const p of m.posti) if (p.accanto && Math.hypot(p.accanto.x + 0.5 - o.x, p.accanto.y + 0.5 - o.z) < 1.2) porta++
    if (celle.has(k)) doppie++
    celle.add(k)
  }
  uguale('nessun segno su acqua o roccia (solo erba)', acqua, 0)
  uguale('nessun segno su una strada', strada, 0)
  uguale('nessun segno su un ponte o un valico', ponte, 0)
  uguale('nessun segno su un campo, un blocco o un\'isola', campo, 0)
  uguale('ognuno su una cella della sua zona', altra, 0)
  uguale('mai oltre il quadrato che il generatore riserva alla tana (una cella di margine)', fuoriBox, 0)
  uguale('mai sul riservato di un altro posto, né su un lotto, un ingresso o una porta', lotto + porta, 0)
  uguale('mai nel villaggio', citta, 0)
  uguale('due segni non stanno mai nella stessa cella', doppie, 0)
}

/* ── lo stesso ogni volta, e solo nelle zone caricate ── */
{
  const solo = scheletroDelMondo()
  caricaZona(solo, 2); scaricaZona(solo, 2); caricaZona(solo, 3)
  const dellaZona3 = luoghi.filter(R => R.zona === 3)
  uguale('palude, guado e compagni: la zona da sola dà gli stessi segni che con tutto caricato', JSON.stringify(propsDellaZona(solo, 3).filter(o => o.tana)), JSON.stringify(propsDellaZona(m, 3).filter(o => o.tana)))
  controlla('la zona 3 ha le sue tane', dellaZona3.length >= 3 && propsDellaZona(solo, 3).some(o => o.tana))
  uguale('una zona non caricata non ha segni', propsDellaZona(solo, 2).length, 0)
  const R = dellaZona3[0], p = pezzoDi(solo, R.tana.x + 0.5, R.tana.y + 0.5)
  controlla('il pezzo della tana prende i suoi segni', propsDelPezzo(solo, p).some(o => o.tana === R.chiave))
  scaricaZona(m, 3)
  controlla('scaricata la zona, i segni se ne vanno col resto', !tutti.filter(o => o.tana && o.zona === 3).some(o => propsDelPezzo(m, o.pezzo).includes(o)))
  caricaZona(m, 3)
  uguale('ricaricata, tornano gli stessi', JSON.stringify(propsDellaZona(m, 3).filter(o => o.tana)), JSON.stringify(tutti.filter(o => o.tana && o.zona === 3)))
}

/* ── un segno per ogni habitat usato ── */
{
  const famiglieUsate = new Set(luoghi.map(R => FAMIGLIA_DI[R.habitat]))
  uguale('le famiglie dei segni sono sette (prato, bosco, brughiera, palude, ceneri, monte, landa)', famiglieUsate.size, 7)
  uguale('ogni famiglia ha la sua ricetta', [...famiglieUsate].every(f => RICETTE[f] && RICETTE[f].length >= 6), true)
  const FIRMA = { prato: 'sassiTana', bosco: 'bozzoliTesi', brughiera: 'menhir', palude: 'nidoFango', ceneri: 'braciTana', monte: 'carcassa', landa: 'croceStorta' }
  for (const R of luoghi) {
    const f = FAMIGLIA_DI[R.habitat]
    controlla(`${R.chiave} (${R.habitat} → ${f}): c'è la sua forma che lo dice (${FIRMA[f]})`, suoi(R).some(o => o.tipo === FIRMA[f]), suoi(R).map(o => o.tipo).join(','))
  }
  controlla('il cimitero ha anche la croce storta e le rovine le macerie', ricettaDi('cimitero').some(r => r[0] === 'croceStorta') && ricettaDi('rovine').some(r => r[0] === 'macerieTana'))
  // le famiglie si distinguono: nessuna ricetta è uguale a un'altra
  const firmeRicette = Object.values(RICETTE).map(r => [...new Set(r.map(x => x[0]))].sort().join())
  uguale('nessuna famiglia ha lo stesso repertorio di un\'altra', new Set(firmeRicette).size, firmeRicette.length)
}

/* ── i signori stanno dove il segno li aspetta ── */
{
  const st = popolaMondo({ mondo: m, eroe: 'prova', giro: 0 })
  uguale('il motore mette una tana per luogo', st.tane.length, 24)
  controlla('la tana del motore è la cella `tana` del luogo (il segno sta dove sta il signore)', st.tane.every(t => m.regioni[t.regione].tana.x === t.x && m.regioni[t.regione].tana.y === t.y))
}

/* ── la macchia di terra attorno ── */
{
  for (const R of luoghi) {
    const c = forzaDellaTana(m, R.tana.x, R.tana.y), lontano = forzaDellaTana(m, R.tana.x + 6, R.tana.y)
    controlla(`${R.chiave}: la terra smossa è piena al cuore e finita a sei celle`, c > 0.99 && lontano === 0, `${c} ${lontano}`)
    let n = 0, max = 0
    for (let i = -6; i <= 6; i++) { if (forzaDellaTana(m, R.tana.x + i, R.tana.y) > 0) n++; max = Math.max(max, Math.abs(i) * (forzaDellaTana(m, R.tana.x + i, R.tana.y) > 0 ? 1 : 0)) }
    controlla(`${R.chiave}: il raggio è di tre o quattro celle`, max >= 3 && max <= 5, `raggio ${max}`)
  }
  // una zona non caricata la ha lo stesso: si vede da lontano
  const solo = scheletroDelMondo(), R = luoghi[10]
  uguale('anche con la zona non caricata (la macchia sta nella pianta)', forzaDellaTana(solo, R.tana.x, R.tana.y) > 0.99, true)
}

/* ── il disegno: costo, materiali, e chi si spegne ── */
{
  const { n } = grigliaDi(m)
  const cose = { camini: [], braci: [], fuochi: [], spruzzi: [] }
  let triTana = 0
  const mats = new Set()
  for (let p = 0; p < n; p++) {
    const sue = propsDelPezzo(m, p)
    const soloTane = sue.filter(o => o.tana)
    if (!soloTane.length) continue
    const c = new Cantiere()
    disegnaPropsAperti(m, p, c, cose, soloTane)
    for (const nome of Object.keys(c.liste)) mats.add(nome)
    triTana += c.tri
  }
  controlla('solo materiali che i pezzi hanno già', [...mats].every(x => ['pietra', 'legno', 'liscio', 'luce'].includes(x)), [...mats].join(','))
  dentro('un segno costa in media meno di 1800 triangoli', triTana / luoghi.length, 300, 1800)
  controlla('il fumo e le braci dei segni portano il nome del luogo (si spengono col signore)', [...cose.camini, ...cose.braci, ...cose.fuochi].every(v => typeof v.tana === 'string' && luoghi.some(R => R.chiave === v.tana)))
  const conFumo = new Set(cose.camini.map(v => v.tana)), conBraci = new Set(cose.braci.map(v => v.tana))
  for (const R of luoghi) {
    const f = FAMIGLIA_DI[R.habitat]
    if (f === 'prato') controlla(`${R.chiave}: un filo di fumo dal focolare`, conFumo.has(R.chiave))
    if (f === 'ceneri') controlla(`${R.chiave}: le braci accese`, conBraci.has(R.chiave))
  }
  nota(`${luoghi.length} tane, ${Math.round(triTana / luoghi.length)} triangoli l'una (${Math.round(triTana / 1000)}k in tutto il mondo)`)

  // i dischi accesi della fossa di braci si ritrovano nella mesh unita col nome della tana: la scena li fa cenere senza rifare il pezzo
  const R = luoghi.find(x => FAMIGLIA_DI[x.habitat] === 'ceneri')
  const fossa = tutti.filter(o => o.tana === R.chiave && o.tipo === 'braciTana')
  const c = new Cantiere()
  disegnaPropsAperti(m, 0, c, { camini: [], braci: [], fuochi: [], spruzzi: [] }, fossa)
  const finte = { pietra: {}, legno: {}, liscio: {}, luce: {} }
  const luce = c.chiudi(finte).find(me => me.material === finte.luce)
  const segni = (luce && luce.userData.segni) || []
  uguale(`${R.chiave}: i quattro dischi accesi portano il segno della tana`, segni.filter(sg => sg.segno === R.chiave).length, 4 * fossa.length)
  const col = luce.geometry.attributes.color, sg = segni[0]
  controlla('e i vertici segnati sono quelli accesi (rossi)', Array.from({ length: sg.quanti }, (_, i) => col.getX(sg.da + i)).every(r => r > 0.99))
  uguale('i vertici segnati stanno dentro la mesh', segni.every(s => s.da + s.quanti <= col.count), true)
}

/* ── il signore morto: il segno di vita si spegne, la tana resta, anche dopo che la zona è stata dimenticata ── */
{
  const mondo = scheletroDelMondo()
  caricaZona(mondo, 1)
  const st = popolaMondo({ mondo, eroe: 'prova', giro: 0 })
  uguale('il signore del bosco è vivo', signoreVivo(st, 'bosco'), true)
  uguale('di una tana mai caricata non si sa', signoreVivo(st, 'palude'), null)
  const q = st.mostri.find(x => x && x.signore && x.regione === mondo.regioni.findIndex(r => r.chiave === 'bosco'))
  q.morto = true; q.torna = null
  uguale('morto, lo dice la tana', signoreVivo(st, 'bosco'), false)
  controlla('la tana c\'è ancora', !!tanaDi(st, 'bosco'))
  scaricaZona(mondo, 1); allineaZone(st)
  uguale('la zona è dimenticata: non c\'è più la tana in memoria', tanaDi(st, 'bosco'), null)
  uguale('ma si ricorda che il suo signore è morto', signoreVivo(st, 'bosco'), false)
  caricaZona(mondo, 1); allineaZone(st)
  uguale('ricaricata, il signore resta morto', signoreVivo(st, 'bosco'), false)

  // il salvataggio ricorda il signore anche di una zona lontana, mai rivista dopo la ripresa
  const salvo = JSON.parse(JSON.stringify(inSalvo(st)))
  controlla('il salvato porta il signore morto', salvo.signori.includes('bosco'))
  scaricaZona(mondo, 1)
  const ripreso = riprendiMondo({ mondo, eroe: 'prova', giro: 0, salvato: salvo })
  uguale('ripreso, la zona lontana non è caricata', tanaDi(ripreso, 'bosco'), null)
  uguale('ma il signore è morto', signoreVivo(ripreso, 'bosco'), false)
  uguale('un altro giro è un mondo nuovo: il signore è tornato', signoreVivo(riprendiMondo({ mondo, eroe: 'prova', giro: 1, salvato: salvo }), 'bosco'), null)
  uguale('un nome sconosciuto nel salvato non entra', riprendiMondo({ mondo, eroe: 'prova', giro: 0, salvato: { ...salvo, signori: ['xx'] } }).signoriMorti.size, 0)
}

riassunto('il segno di ogni tana')
