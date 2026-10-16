/* ═══════════════════════════════════════════════════════════════════
   LA PIANTA DEL MONDO APERTO — il mondo generato visto dall'alto, senza
   browser: in caratteri sul terminale (a colori per regione se il
   terminale li ha) e in un PNG in tmp/scatti/, coi guasti, la firma, le
   distanze e quanto ci mette. docs/sotterraneo/mondo-aperto-generatore.md

     npm run pianta -- --mondo                  # il seme della scheda
     npm run pianta -- --mondo --seme 12        # un altro seme
     npm run pianta -- --mondo --semi 1-16      # una riga per seme, e un PNG ciascuno: per scegliere
     npm run pianta -- --mondo --senza-caratteri  # solo il PNG e i numeri
     npm run pianta -- --mondo --scala 8        # il PNG più grande (pixel per cella, di difetto 4)

   La lancia strumenti/sotterraneo-pianta.mjs quando trova `--mondo`.
   ═══════════════════════════════════════════════════════════════════ */
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { generaMondoAperto, ERBA, ACQUA, ROCCIA } from '../src/giochi/sotterraneo/motore/mondo-aperto.js'
import { MONDO_APERTO } from '../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { Tela } from './png.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const FUORI = resolve(QUI, '../tmp/scatti')
const args = process.argv.slice(2)
const opz = (nome, difetto) => { const i = args.indexOf('--' + nome); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : difetto }

// i colori delle regioni: il villaggio caldo, l'anello 1 verdi e gialli, le marche ognuna la sua tinta
const TINTA_MARCA = { nord: [96, 112, 140], est: [124, 96, 140], sud: [80, 128, 120], ovest: [150, 116, 80] }
function coloreDi(q, i) {
  const v = ((i * 37) % 5) * 9 - 18
  const base = q.anello === 0 ? [176, 160, 110] : q.anello === 1 ? [104 + ((i * 53) % 4) * 14, 146 - ((i * 29) % 3) * 10, 84] : TINTA_MARCA[q.marca]
  return base.map(c => Math.max(0, Math.min(255, c + v)))
}
const COLORI_POSTO = { citta: [255, 230, 150], ingresso: [230, 60, 50], pietra: [120, 220, 255], antro: [40, 30, 30], mercante: [255, 200, 40],
  persona: [255, 140, 220], minatore: [255, 140, 220], bacheca: [200, 150, 90], cartello: [200, 150, 90], portale: [150, 90, 255], mulino: [230, 230, 230] }
const corto = nome => nome.replace(/^(il |la |le |lo |i |gli |l')/i, '').split(' ').slice(0, 2).join(' ')

// la mappa in una tela, a `C` pixel per cella da (ox, oy); `nomi`: le etichette di regioni, dungeon e città (nel foglio dei
// semi no: c'è solo il numero dei dungeon)
function pianta(t, m, ox, oy, C, nomi = true) {
  const colori = m.regioni.map(coloreDi)
  const r = (x, y, w, h, c, a) => t.rettangolo(ox + x * C, oy + y * C, w * C, h * C, c, a)
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
    const k = y * m.W + x
    let c = colori[m.reg[k]]
    if (m.ponte[k] >= 0) c = [150, 100, 50]
    else if (m.terreno[k] === ACQUA) c = m.isola[k] ? [70, 120, 170] : [50, 100, 170]
    else if (m.terreno[k] === ROCCIA) { const q = Math.min(1, 0.4 + m.quota[k] / 6); c = [90 * q + 40, 86 * q + 40, 80 * q + 40] }
    else if (m.varco[k] >= 0) c = [190, 180, 160]
    else if (m.strada[k] === 3) c = [205, 190, 160]
    else if (m.strada[k]) c = [196, 176, 130]
    else if (m.campo[k]) c = [220, 200, 90]
    else if (m.blocco[k] === 2) c = c.map(v => v * 0.55)
    else if (m.blocco[k]) c = [70, 60, 55]
    else if (m.isola[k]) c = c.map(v => v * 0.8)
    r(x, y, 1, 1, c)
    if (C >= 4 && m.zonaCitta[k] && m.terreno[k] === ERBA && !m.strada[k] && !m.blocco[k]) t.rettangolo(ox + x * C + 1, oy + y * C + 1, 2, 2, [255, 240, 200], 0.35)
  }
  // la grata dei passaggi che la storia apre: rossa, col numero delle discese che servono (arancio, E: solo l'età)
  for (const q of m.passaggi) {
    if (!q.grata || !q.grata.length) continue
    for (const c of q.grata) r(c.x, c.y, 1, 1, q.apre ? [220, 40, 40] : [220, 140, 40], 0.7)
    const c = q.grata[0]
    if (nomi) t.testo(ox + c.x * C + 6, oy + c.y * C - 14, q.apre ? String(q.apre) : 'E', [255, 255, 255], { fondo: q.apre ? [160, 20, 20] : [150, 90, 20] })
  }
  // le case, i lotti dei posti
  for (const z of m.case) r(z.x, z.y, z.w, z.h, [150, 80, 60])
  for (const z of m.posti) {
    if (z.tipo === 'citta') { t.cornice(ox + z.x * C, oy + z.y * C, z.w * C, z.h * C, [255, 230, 150]); continue }
    r(z.x, z.y, z.w, z.h, COLORI_POSTO[z.tipo] || [255, 255, 255])
    if (C >= 4) t.rettangolo(ox + z.accanto.x * C + 1, oy + z.accanto.y * C + 1, 2, 2, [255, 255, 255])
  }
  t.rettangolo(ox + m.partenza.x * C - 2, oy + m.partenza.y * C - 2, C + 4, C + 4, [255, 255, 255])
  for (const z of m.ingressi) {
    const s = nomi ? `${z.indice >= 0 ? z.indice + 1 : 'A'} ${corto(z.nome)}` : `${z.indice >= 0 ? z.indice + 1 : 'A'}`
    t.testo(ox + z.x * C - 4, oy + z.y * C + z.h * C + 4, s, [255, 220, 200], { fondo: [120, 20, 20], s: nomi ? 2 : 1 })
  }
  if (!nomi) return
  // i nomi: le regioni (col livello), le città
  m.regioni.forEach(q => {
    const s = `${corto(q.nome)}${q.livello ? ' ' + q.livello : ''}`
    t.testo(ox + q.cx * C - s.length * 4, oy + q.cy * C - 20, s, [255, 255, 255], { fondo: [0, 0, 0] })
  })
  for (const c of m.citta) t.testo(ox + c.centro.x * C - 20, oy + (c.centro.y - c.raggio) * C - 12, corto(c.nome), [40, 30, 0], { fondo: [255, 230, 150] })
}

// il foglio dei semi: una pianta piccola per seme, col numero, i guasti e i passi dei dungeon sotto
function foglio(mondi, file) {
  const C = 2, colonne = Math.min(4, mondi.length), w = 160 * C + 12, h = 140 * C + 30
  const t = new Tela(colonne * w, Math.ceil(mondi.length / colonne) * h, [20, 18, 16])
  mondi.forEach((m, i) => {
    const ox = (i % colonne) * w + 6, oy = Math.floor(i / colonne) * h + 4
    pianta(t, m, ox, oy, C, false)
    t.testo(ox, oy + m.H * C + 4, `SEME ${m.seme}  GUASTI ${m.guasti.length}  ${Math.min(...m.regioni.map(q => q.celle))}-${Math.max(...m.regioni.map(q => q.celle))}`,
      m.guasti.length ? [255, 140, 120] : [150, 240, 150], { s: 1 })
    t.testo(ox, oy + m.H * C + 13, m.distanze.dungeon.map(d => d.passi).join(' '), [220, 210, 190], { s: 1 })
  })
  t.scrivi(file)
}

function disegna(m, file) {
  const C = Number(opz('scala', 4)), LEG = 330
  const t = new Tela(m.W * C + LEG, Math.max(m.H * C, 640), [20, 18, 16])
  pianta(t, m, 0, 0, C)
  // la legenda
  let y = 8
  const x0 = m.W * C + 10
  const riga = (s, colore = [230, 220, 200]) => { t.testo(x0, y, s, colore, { s: 1 }); y += 8 }
  t.testo(x0, y, `MONDO SEME ${m.seme}`, [255, 230, 150]); y += 16
  riga(`FIRMA ${m.firma}  ${m.ms} MS`)
  riga(`GUASTI ${m.guasti.length}`, m.guasti.length ? [255, 120, 100] : [140, 230, 140])
  y += 4
  for (const [nome, col] of [['ROSSO: INGRESSO', COLORI_POSTO.ingresso], ['AZZURRO: PIETRA', COLORI_POSTO.pietra], ['NERO: ANTRO', COLORI_POSTO.antro],
    ['GIALLO: MERCANTE', COLORI_POSTO.mercante], ['ROSA: CHI STA FERMO', COLORI_POSTO.persona], ['VIOLA: PORTALE', COLORI_POSTO.portale],
    ['MARRONE: PONTE', [150, 100, 50]], ['GRATA ROSSA: SI APRE A N DISCESE', [220, 40, 40]], ['GRATA ARANCIO E: SOLO L\'ETA', [220, 140, 40]]]) { t.rettangolo(x0, y, 6, 6, col); t.testo(x0 + 10, y, nome, [230, 220, 200], { s: 1 }); y += 9 }
  y += 4
  riga('DUNGEON (PASSI DALLA PIAZZA)', [255, 230, 150])
  for (const d of m.distanze.dungeon) riga(`${d.chiave} ${d.passi}`)
  riga(`ANELLO 1: ${m.distanze.anello1.min}-${m.distanze.anello1.max} MEDIA ${m.distanze.anello1.media}`)
  riga(`ANELLO 2: ${m.distanze.anello2.min}-${m.distanze.anello2.max} MEDIA ${m.distanze.anello2.media}`)
  y += 4
  riga('REGIONI (CELLE, LIVELLO)', [255, 230, 150])
  for (const q of m.regioni) riga(`${q.anello} ${q.chiave} ${q.celle} ${q.fascia ? q.fascia.join('-') : ''}`)
  y += 4
  for (const g of m.guasti.slice(0, 12)) riga(g.slice(0, 80), [255, 120, 100])
  t.scrivi(file)
}

// in caratteri: una lettera per cella, il fondo colorato per regione se il terminale li ha
function caratteri(m) {
  const colori = args.includes('--colori') || process.stdout.isTTY
  const segno = new Array(m.W * m.H)
  for (let k = 0; k < m.W * m.H; k++) {
    segno[k] = m.ponte[k] >= 0 ? '=' : m.terreno[k] === ACQUA ? '~' : m.terreno[k] === ROCCIA ? '^' : m.varco[k] >= 0 ? ':'
      : m.strada[k] === 3 ? 'o' : m.campo[k] ? ',' : m.blocco[k] === 2 ? 't' : m.blocco[k] ? '#' : m.strada[k] ? '+' : '.'
  }
  const SEGNI = { citta: null, ingresso: null, pietra: 'P', antro: 'a', mercante: '$', persona: '@', minatore: 'M', bacheca: 'B', cartello: 'T', portale: 'O', mulino: 'W' }
  for (const z of m.posti) {
    const s = z.tipo === 'ingresso' ? (z.indice >= 0 ? String(z.indice + 1) : 'A') : SEGNI[z.tipo]
    if (s) segno[z.piede.y * m.W + z.piede.x] = s
  }
  segno[m.partenza.y * m.W + m.partenza.x] = '*'
  const fondo = m.regioni.map((q, i) => { const [r, g, b] = coloreDi(q, i).map(v => Math.round(v / 255 * 5)); return 16 + 36 * r + 6 * g + b })
  for (let y = 0; y < m.H; y++) {
    let s = ''
    for (let x = 0; x < m.W; x++) { const k = y * m.W + x; s += colori ? `\x1b[48;5;${fondo[m.reg[k]]}m${segno[k]}` : segno[k] }
    console.log(s + (colori ? '\x1b[0m' : ''))
  }
  console.log('legenda: . erba  ~ acqua  ^ roccia  = ponte  : valico  + strada  o piazza  , campo  t albero/masso  # lotto  * partenza')
  console.log('         1-7 i dungeon della storia, A l\'abisso, P pietra, a antro, $ mercante, @ chi sta fermo, M minatore, B bacheca, T cartello, O portale, W mulino')
}

function racconta(m) {
  console.log(`\nmondo seme ${m.seme} · ${m.W}×${m.H} · ${m.ms} ms · firma ${m.firma}${m.seme === MONDO_APERTO.seme ? (m.firma === MONDO_APERTO.firma ? ' (quella della scheda)' : ` (la scheda dice ${MONDO_APERTO.firma})`) : ''}`)
  const conta = tipo => m.posti.filter(z => z.tipo === tipo).length
  console.log(`${m.regioni.length} regioni · ${m.passaggi.length} passaggi (${m.passaggi.filter(q => q.tipo === 'ponte').length} ponti, ${m.passaggi.filter(q => q.tipo === 'valico').length} valichi, ${m.passaggi.filter(q => q.apre).length} con la grata) · ${m.posti.length} posti: ${m.citta.length} città, ${conta('ingresso')} ingressi, ${conta('pietra')} pietre, ${conta('antro')} antri, ${conta('mercante')} mercanti, ${conta('persona') + conta('minatore')} che stanno fermi · ${m.case.length} case · ${m.campi.length} campi · ${m.decoro.length} decori`)
  console.log('regioni: ' + m.regioni.map(q => `${q.chiave} ${q.celle}${q.fascia ? ` [${q.fascia.join('–')}]` : ''}`).join(' · '))
  console.log('passi dalla piazza: ' + m.distanze.dungeon.map(d => `${d.chiave} ${d.passi}`).join(' · '))
  console.log(`anello 1: ${m.distanze.anello1.min}–${m.distanze.anello1.max} (media ${m.distanze.anello1.media}) · anello 2: ${m.distanze.anello2.min}–${m.distanze.anello2.max} (media ${m.distanze.anello2.media})`)
  for (const [f, l] of Object.entries(m.perTappa)) console.log(`con ${f} discese finite: ${l.length} regioni`)
  console.log(m.guasti.length ? 'GUASTI:\n  ' + m.guasti.join('\n  ') : 'nessun guasto')
}

mkdirSync(FUORI, { recursive: true })
if (opz('semi')) {
  const [a, b] = opz('semi').split('-').map(Number)
  let mondi = []
  const chiudi = () => {
    if (!mondi.length) return
    const file = resolve(FUORI, `mondo-semi-${mondi[0].seme}-${mondi[mondi.length - 1].seme}.png`)
    foglio(mondi, file); console.log(`✓ ${file}`); mondi = []
  }
  for (let s = a; s <= (b ?? a); s++) {
    const m = generaMondoAperto(s)
    disegna(m, resolve(FUORI, `mondo-${s}.png`))
    const d = m.distanze
    console.log(`seme ${String(s).padStart(3)} · ${String(m.ms).padStart(4)} ms · ${m.guasti.length} guasti · firma ${m.firma} · dungeon ${d.dungeon.map(x => x.passi).join(' ')} · anelli ${d.anello1.media}/${d.anello2.media} · celle ${Math.min(...m.regioni.map(q => q.celle))}–${Math.max(...m.regioni.map(q => q.celle))}`)
    for (const g of m.guasti) console.log(`      ${g}`)
    mondi.push(m)
    if (mondi.length === 16) chiudi()
  }
  chiudi()
  console.log(`le piante una per una: ${resolve(FUORI, 'mondo-<seme>.png')}`)
} else {
  const m = generaMondoAperto(Number(opz('seme', MONDO_APERTO.seme)))
  if (!args.includes('--senza-caratteri')) caratteri(m)
  racconta(m)
  const file = resolve(FUORI, `mondo-${m.seme}.png`)
  disegna(m, file)
  console.log(`✓ ${file}`)
}
