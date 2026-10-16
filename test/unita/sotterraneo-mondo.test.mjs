/* ═══════════════════════════════════════════════════════════════════
   IL MONDO APERTO DEL SOTTERRANEO — il generatore e la sua scheda

   Il mondo si genera da un seme fisso e non cambia mai: la mappa si
   impara, e la nebbia salvata vale solo su quella mappa. Una cella
   sbagliata non dà errori: dà un dungeon che non si raggiunge, una
   marca dove si entra senza passare dal ponte, una città senza posto
   per il fabbro. Qui la pianta del seme scelto senza guasti, la firma,
   gli anelli con le loro fasce, i dungeon coi nomi nuovi e in fila,
   i passaggi con la grata, le città coi mercanti, le pietre, gli antri,
   chi sta fermo che non chiude strade.
   docs/sotterraneo/mondo-aperto-generatore.md
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generaMondoAperto, mascheraDelMondo, ERBA, ACQUA } from '../../src/giochi/sotterraneo/motore/mondo-aperto.js'
import { MONDO_APERTO, REGIONI_DEL_MONDO, PASSAGGI, DUNGEON, CITTA, MARCHE, FASCE_DEGLI_ANELLI, LARGA_REGIONE,
  passaggioAperto, regolaDi, anelloDi } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { LIVELLI_ATTESI } from '../../src/giochi/sotterraneo/dati/storia.js'
import { MERCANTI } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { PERSONAGGI } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { creaTerra } from '../../src/giochi/sotterraneo/motore/terra.js'
import { passiDa } from '../../src/giochi/sotterraneo/motore/mondo-aperto-strade.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const m = generaMondoAperto()
const { W, H } = m
const id = (x, y) => y * W + x
const regione = k => m.regioni.find(q => q.chiave === k)

/* ── la pianta del seme scelto ── */
stessaLista('il seme scelto non ha guasti', m.guasti, [])
uguale('la firma è quella della scheda (cambiare il generatore cambia il mondo dei bambini: si riguarda la pianta e si aggiorna)',
  m.firma, MONDO_APERTO.firma)
const m2 = generaMondoAperto()
uguale('lo stesso seme dà lo stesso mondo', m2.firma, m.firma)
controlla('cella per cella', m.terreno.every((v, k) => v === m2.terreno[k] && m.reg[k] === m2.reg[k] && m.strada[k] === m2.strada[k]))
stessaLista('e gli stessi posti', m2.posti.map(z => [z.tipo, z.chiave, z.x, z.y]), m.posti.map(z => [z.tipo, z.chiave, z.x, z.y]))
controlla('un altro seme dà un altro mondo', generaMondoAperto(MONDO_APERTO.seme + 1).firma !== m.firma)
uguale('160 celle in largo', W, 160)
uguale('140 in alto', H, 140)
dentro('si genera in meno di un secondo e mezzo (ms)', m.ms, 0, 1500)
nota(`seme ${m.seme}, firma ${m.firma}, ${m.ms} ms`)

/* ── il generatore è un dato puro: niente Vue, three o DOM in quello che importa ── */
{
  const QUI = dirname(fileURLToPath(import.meta.url))
  const visti = new Set(), coda = [resolve(QUI, '../../src/giochi/sotterraneo/motore/mondo-aperto.js')]
  const fuori = []
  while (coda.length) {
    const f = coda.pop(); if (visti.has(f)) continue; visti.add(f)
    const testo = readFileSync(f, 'utf8')
    for (const [, dove] of testo.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)) {
      if (dove.startsWith('.')) coda.push(resolve(dirname(f), dove)); else fuori.push(dove)
    }
    controlla(`${f.split('/src/')[1]} non tocca il DOM`, !/\b(document|window)\./.test(testo))
  }
  stessaLista('nessun import fuori dal repo (niente vue, niente three)', fuori, [])
  nota(`${visti.size} file nel generatore e nei suoi dati`)
}

/* ── le regioni: 5×5, gli anelli, le fasce ── */
uguale('venticinque regioni', m.regioni.length, 25)
{
  const posti = new Set(m.regioni.map(q => `${q.colonna},${q.riga}`))
  uguale('una per casella della griglia 5×5', posti.size, 25)
  for (const q of m.regioni) controlla(`${q.chiave} sta nella griglia`, q.colonna >= 0 && q.colonna < 5 && q.riga >= 0 && q.riga < 5)
  const per = [0, 1, 2].map(a => m.regioni.filter(q => q.anello === a).length)
  stessaLista('il villaggio, otto terre vicine, sedici delle marche', per, [1, 8, 16])
  uguale('il villaggio sta in mezzo', regione('villaggio').anello, 0)
  for (const [marca] of Object.entries(MARCHE)) uguale(`la ${marca} ha quattro regioni`, m.regioni.filter(q => q.marca === marca).length, 4)
  controlla('le marche sono tutte e sole le regioni dell\'anello 2', m.regioni.every(q => !!q.marca === (q.anello === 2)))
}
for (const q of m.regioni) {
  if (!q.anello) { uguale('il villaggio non ha mostri né fascia', q.fascia, null); continue }
  const [da, a] = FASCE_DEGLI_ANELLI[q.anello]
  controlla(`${q.chiave}: la fascia ${q.fascia} sta in quella dell'anello ${q.anello} (${da}–${a})`, q.fascia[0] >= da && q.fascia[1] <= a)
  uguale(`${q.chiave}: la fascia è larga ${LARGA_REGIONE}`, q.fascia[1] - q.fascia[0] + 1, LARGA_REGIONE)
  controlla(`${q.chiave} ha le domande del suo livello`, q.dif > 0 && q.dif < 1)
  dentro(`${q.chiave} è una regione, non un angolo (celle d'erba e di lago)`, q.area, 300, 2000)
  controlla(`${q.chiave} ha la tana del suo signore`, !!q.tana)
}
// gli abitanti che vengono dalle terre selvagge esistono nel catalogo
for (const q of m.regioni) for (const k of [...(q.abitanti || []), ...(q.caporale ? [q.caporale] : [])])
  controlla(`${q.chiave}: ${k} è nel catalogo dei mostri`, !!MOSTRI[k])

/* ── i dungeon: le chiavi di sempre, i nomi nuovi, la regione, la fila ── */
{
  const NOMI = { altare: 'La cripta dei re', cantine: 'Le cantine dei goblin', torre: 'La torre bruciata', gallerie: 'La tana dei ragni',
    cisterna: 'Le sale allagate', labirinto: 'La porta dell\'inferno', fondo: 'Le miniere di brace', abisso: 'Il pozzo senza fondo' }
  const DOVE = { altare: 'cimitero', cantine: 'colle', torre: 'brughiera', gallerie: 'bosco', cisterna: 'palude', labirinto: 'ceneri', fondo: 'monte', abisso: 'landa' }
  stessaLista('i sette della storia nell\'ordine della campagna, poi l\'abisso', m.ingressi.map(q => q.chiave), [...CAMPAGNA.map(t => t.chiave), 'abisso'])
  for (const q of m.ingressi) {
    uguale(`${q.chiave}: il nome nuovo`, q.nome, NOMI[q.chiave])
    uguale(`${q.chiave}: la regione del progetto`, q.regione, DOVE[q.chiave])
    uguale(`${q.chiave}: l'indice della campagna`, q.indice, q.chiave === 'abisso' ? -1 : CAMPAGNA.findIndex(t => t.chiave === q.chiave))
    const R = regione(q.regione)
    uguale(`${q.chiave}: la sua regione lo sa`, R.dungeon, q.chiave)
    const atteso = Math.max(1, LIVELLI_ATTESI[q.indice >= 0 ? q.indice : CAMPAGNA.length] - 1)
    uguale(`${q.chiave}: la regione parte un livello sotto quello atteso`, R.livello, atteso)
    uguale(`${q.chiave}: le prime quattro nell'anello 1, le altre nelle marche`, R.anello, q.indice >= 0 && q.indice < 4 ? 1 : 2)
  }
  const passi = m.ingressi.map(q => m.passi[id(q.accanto.x, q.accanto.y)])
  for (let i = 1; i < passi.length; i++)
    controlla(`${m.ingressi[i].chiave} sta più lontano dalla piazza di ${m.ingressi[i - 1].chiave}`, passi[i] > passi[i - 1], `${passi[i]} contro ${passi[i - 1]}`)
  nota('passi dalla piazza:', m.ingressi.map((q, i) => `${q.chiave} ${passi[i]}`).join(' · '))
  // la maschera va a motore/terra.js così com'è: l'eroe trova la strada fino al primo dungeon e all'abisso
  const terra = creaTerra(mascheraDelMondo(m))
  for (const q of [m.ingressi[0], m.ingressi[m.ingressi.length - 1]])
    controlla(`creaTerra trova la strada dalla piazza a ${q.chiave}`, !!terra.strada(m.partenza, q.accanto))
}

/* ── tutto si raggiunge dalla piazza, e solo attraverso i passaggi ── */
for (const z of m.posti) controlla(`${z.tipo} ${z.chiave}: ci si arriva`, m.passi[id(z.accanto.x, z.accanto.y)] >= 0)
{
  // con k discese finite le regioni raggiunte a piedi sono quelle che il grafo dei passaggi aperti dice, né una di più né una di meno
  const grafo = new Map(m.regioni.map(q => [q.chiave, []]))
  for (const q of m.passaggi) { grafo.get(q.da).push(q); grafo.get(q.a).push(q) }
  const perEta = (finite, apertaPerEta) => {
    const libera = m.calpestabileCon(q => passaggioAperto(q, { finite, apertaPerEta }))
    const d = passiDa(W, H, libera, m.partenza)
    const viste = new Set()
    for (let k = 0; k < W * H; k++) if (d[k] >= 0) viste.add(m.regioni[m.reg[k]].chiave)
    const vuole = new Set(['villaggio']), coda = ['villaggio']
    while (coda.length) {
      const qui = coda.shift()
      for (const q of grafo.get(qui)) {
        const altra = q.da === qui ? q.a : q.da
        if (!vuole.has(altra) && passaggioAperto(q, { finite, apertaPerEta })) { vuole.add(altra); coda.push(altra) }
      }
    }
    return { viste: [...viste].sort(), vuole: [...vuole].sort() }
  }
  for (const finite of [0, 3, 4, 5, 6, 7]) {
    const { viste, vuole } = perEta(finite)
    stessaLista(`con ${finite} discese finite si arriva dove portano i passaggi aperti`, viste, vuole)
  }
  const a = perEta(3).viste, b = perEta(4).viste, c = perEta(6).viste, d = perEta(7).viste
  uguale('prima del ponte del guado: il villaggio e le otto terre vicine', a.length, 9)
  stessaLista('battuto il quarto si aprono il sud e l\'ovest', b.filter(k => !a.includes(k)).map(k => regione(k).marca).filter((v, i, l) => l.indexOf(v) === i).sort(), ['ovest', 'sud'])
  stessaLista('battuto il sesto il nord', c.filter(k => !b.includes(k)).map(k => regione(k).marca).filter((v, i, l) => l.indexOf(v) === i), ['nord'])
  stessaLista('a storia finita l\'est, con l\'abisso', d.filter(k => !c.includes(k)).map(k => regione(k).marca).filter((v, i, l) => l.indexOf(v) === i), ['est'])
  uguale('a storia finita tutto il mondo', d.length, 25)
  // l'età chiude un passaggio, non una regione: chiuse per l'età le discese dalla quinta in poi (l'età è in fila), si resta
  // nell'anello 1 anche a storia finita; chiusa la settima, il nord resta fuori ma il sud e l'ovest no
  const giovane = perEta(7, k => k < 4)
  stessaLista('chiuse per l\'età dalla quinta in poi: il villaggio e le terre vicine', giovane.viste, giovane.vuole)
  uguale('cioè nove regioni', giovane.viste.length, 9)
  const senzaNord = perEta(7, k => k < 6)
  stessaLista('chiusa la settima: si arriva dove portano i passaggi aperti', senzaNord.viste, senzaNord.vuole)
  controlla('e il nord resta fuori (l\'est no: come l\'abisso, non ha età, e dal bosco secco ci si arriva)', senzaNord.viste.every(k => regione(k).marca !== 'nord'))
  controlla('ma il sud e l\'ovest no', ['guado', 'palude', 'ceneri', 'lupi'].every(k => senzaNord.viste.includes(k)))
}
{
  // ogni passaggio fra anelli o fra marche ha la sua grata; dentro una marca o un anello no
  for (const q of m.passaggi) {
    const A = regione(q.da), B = regione(q.a)
    const diverse = A.anello !== B.anello || A.marca !== B.marca
    controlla(`${q.da}–${q.a}: ${diverse ? 'ha la grata' : 'non ha la grata'}`, diverse === q.grata.length > 0)
    uguale(`${q.da}–${q.a}: due rive`, q.rive.length, 2)
    if (q.tipo === 'ponte') controlla(`il ponte ${q.da}–${q.a} sta sull'acqua`, q.celle.some(c => m.terreno[id(c.x, c.y)] === ACQUA))
    else controlla(`il valico ${q.da}–${q.a} è aperto nella roccia`, q.celle.length > 6 && q.celle.every(c => m.terreno[id(c.x, c.y)] === ERBA))
  }
  uguale('i passaggi sono quelli della scheda', m.passaggi.length, PASSAGGI.length)
  stessaLista('le regole: il guado si apre col quarto, il nord col sesto, l\'est a storia finita',
    ['Il ponte del guado', 'Il valico del nord', 'Il valico del passo'].map(n => regolaDi(PASSAGGI.find(q => q.nome === n)).apre), [4, 6, 7])
  controlla('passaggioAperto: col terzo finito il guado è chiuso', !passaggioAperto(PASSAGGI.find(q => q.nome === 'Il ponte del guado'), { finite: 3 }))
  controlla('col quarto si apre', passaggioAperto(PASSAGGI.find(q => q.nome === 'Il ponte del guado'), { finite: 4 }))
}

/* ── i posti non si pestano, e chi sta fermo non chiude le strade ── */
{
  const occupato = new Map()
  for (const z of m.posti) {
    if (z.tipo === 'citta' || z.tipo === 'portale') continue
    for (let j = 0; j < z.h; j++) for (let i = 0; i < z.w; i++) {
      const k = id(z.x + i, z.y + j)
      controlla(`${z.tipo} ${z.chiave} non sta sopra ${occupato.get(k)}`, !occupato.has(k))
      occupato.set(k, `${z.tipo} ${z.chiave}`)
    }
  }
  for (const z of m.posti) if (z.tipo !== 'citta') controlla(`chi va da ${z.tipo} ${z.chiave} non si ferma su un altro posto`, !occupato.has(id(z.accanto.x, z.accanto.y)))
  const fermi = new Set(m.posti.filter(z => ['persona', 'mercante', 'minatore'].includes(z.tipo)).map(z => id(z.piede.x, z.piede.y)))
  const base = m.calpestabileCon(() => true)
  const senza = passiDa(W, H, (x, y) => base(x, y) || fermi.has(id(x, y)), m.partenza)
  let chiude = 0
  for (let k = 0; k < W * H; k++) if (senza[k] >= 0 && m.passi[k] < 0 && !fermi.has(k)) chiude++
  uguale('togliendo chi sta fermo si arriva in più solo dove sta lui', chiude, 0)
}

/* ── le città, coi mercanti, il portale, la pietra, la bacheca ── */
uguale('tre città', m.citta.length, 3)
for (const C of CITTA) {
  const c = m.citta.find(z => z.chiave === C.chiave)
  if (!controlla(`la città ${C.chiave} c'è`, !!c)) continue
  uguale(`${C.chiave} sta nella sua regione`, c.regione, C.regione)
  stessaLista(`${C.chiave}: i suoi mercanti`, c.mercanti.map(z => z.chiave), C.mercanti)
  for (const z of c.mercanti) {
    const M = MERCANTI.find(q => q.chiave === z.chiave)
    uguale(`${C.chiave}: ${z.chiave} è quello di dati/mercanti.js`, z.nome, M.nome)
    controlla(`${C.chiave}: ${z.chiave} sta nella zona dei mercanti`, Math.hypot(z.piede.x - c.centro.x, z.piede.y - c.centro.y) <= c.raggio + 3)
  }
  for (const t of ['portale', 'pietra', 'bacheca', 'cartello']) controlla(`${C.chiave} ha ${t}`, !!c[t])
  uguale(`${C.chiave}: il minatore`, c.minatore ? c.minatore.dalla : undefined, C.minatore)
  stessaLista(`${C.chiave}: chi ci sta in più`, c.persone.map(z => z.chiave), C.persone)
  uguale(`${C.chiave}: la piazza è nella zona dei mercanti`, m.zonaCitta[id(c.centro.x, c.centro.y)], CITTA.indexOf(C) + 1)
}
{
  const forte = m.citta.find(c => c.chiave === 'forte'), ponte = m.passaggi.find(q => q.nome === 'Il ponte del guado')
  const riva = ponte.rive.find(r => r.regione === 'guado')
  dentro('il forte sta all\'ingresso, a due passi dal ponte del guado', Math.hypot(forte.centro.x - riva.x, forte.centro.y - riva.y), 0, 20)
  const rifugio = m.citta.find(c => c.chiave === 'rifugio'), valico = m.passaggi.find(q => q.nome === 'Il valico del nord')
  const r2 = valico.rive.find(r => r.regione === 'passo')
  dentro('il rifugio sta in cima al valico del nord', Math.hypot(rifugio.centro.x - r2.x, rifugio.centro.y - r2.y), 0, 20)
  uguale('si parte nella piazza del villaggio', m.reg[id(m.partenza.x, m.partenza.y)], m.regioni.findIndex(q => q.chiave === 'villaggio'))
  for (const z of m.persone) controlla(`${z.chiave} è uno di quelli delle missioni`, !!PERSONAGGI[z.chiave])
}

/* ── le pietre del viaggio e gli antri ── */
uguale('undici pietre: una per città e una davanti a ogni dungeon', m.pietre.length, 11)
for (const q of m.ingressi) {
  const p = m.pietre.find(z => z.chiave === q.chiave)
  if (controlla(`la pietra di ${q.chiave} c'è`, !!p)) dentro(`la pietra di ${q.chiave} sta davanti all'ingresso`, Math.hypot(p.x - q.accanto.x, p.y - q.accanto.y), 0, 9)
}
for (const R of REGIONI_DEL_MONDO) {
  const suoi = m.antri.filter(z => z.regione === R.chiave)
  uguale(`${R.chiave}: ${R.antri} antri`, suoi.length, R.antri)
  for (const z of suoi) controlla(`l'antro ${z.chiave} sta fuori dalle città`, !m.zonaCitta[id(z.x, z.y)])
}
uguale('nel villaggio niente antri', m.antri.filter(z => anelloDi(regione(z.regione)) === 0).length, 0)

/* ── le distanze fra gli anelli ── */
controlla('l\'anello 2 sta molto più in là dell\'anello 1', m.distanze.anello2.media > m.distanze.anello1.media * 1.6,
  `${m.distanze.anello2.media} contro ${m.distanze.anello1.media}`)
nota(`anello 1 a ${m.distanze.anello1.min}–${m.distanze.anello1.max} passi, anello 2 a ${m.distanze.anello2.min}–${m.distanze.anello2.max}`)

riassunto('il mondo aperto del sotterraneo')
