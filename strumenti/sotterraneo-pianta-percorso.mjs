/* ═══════════════════════════════════════════════════════════════════
   LA PIANTA DEL MONDO A PERCORSO — il prototipo del mondo nuovo di sopra
   (strumenti/sotterraneo-percorso/), visto dall'alto senza browser: un PNG
   con le zone colorate, la strada maestra, i confini (ponti e valichi), il
   villaggio con la sua pianta, gli avamposti, le pietre runiche, i dungeon,
   le tane e la cintura; e sul terminale le misure, la pianta del villaggio
   in caratteri e i guasti. docs/sotterraneo/mondo-a-percorso.md

     npm run pianta -- --percorso               # il seme della scheda
     npm run pianta -- --percorso --seme 9      # un altro seme
     npm run pianta -- --percorso --semi 1-12   # una riga per seme, per scegliere
     npm run pianta -- --percorso --terra 2     # le fasce della seconda terra
     npm run pianta -- --percorso --scala 5     # pixel per cella (di difetto 4)

   La lancia strumenti/sotterraneo-pianta.mjs quando trova `--percorso`.
   ═══════════════════════════════════════════════════════════════════ */
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { generaPercorso, ERBA, ACQUA, ROCCIA } from './sotterraneo-percorso/genera.mjs'
import { PERCORSO } from './sotterraneo-percorso/scheda.mjs'
import { Tela } from './png.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const FUORI = resolve(QUI, '../tmp/scatti')
const args = process.argv.slice(2)
const opz = (nome, difetto) => { const i = args.indexOf('--' + nome); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : difetto }

const COLORI = { ingresso: [225, 50, 45], nuovo: [255, 150, 40], pietra: [110, 230, 255], mercante: [255, 205, 40], persona: [255, 140, 220],
  minatore: [255, 140, 220], bacheca: [200, 150, 90], cartello: [200, 150, 90], portale: [160, 100, 255], pozzo: [120, 160, 220], fontana: [120, 200, 255], mulino: [235, 235, 235], terre: [255, 255, 255] }
const corto = nome => nome.replace(/^(il |la |le |lo |i |gli |l')/i, '')

function pianta(t, m, C) {
  const r = (x, y, w, h, c, a) => t.rettangolo(x * C, y * C, w * C, h * C, c, a)
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
    const k = y * m.W + x
    const z = m.zona[k]
    let c = z >= 0 ? m.zone[z].colore.map(v => v + (m.luogo[k] % 2 ? 12 : 0)) : [176, 160, 110]
    if (m.ponte[k] >= 0) c = [150, 100, 50]
    else if (m.terreno[k] === ACQUA) c = [50, 100, 175]
    else if (m.terreno[k] === ROCCIA) c = [70, 66, 62]
    else if (m.varco[k] >= 0) c = [200, 190, 165]
    else if (m.strada[k] === 3) c = [210, 195, 165]
    else if (m.strada[k] === 2) c = [214, 186, 120]
    else if (m.strada[k] === 1) c = [190, 168, 120]
    else if (m.blocco[k] === 2) c = c.map(v => v * 0.55)
    else if (m.blocco[k]) c = [80, 66, 58]
    r(x, y, 1, 1, c.map(v => Math.max(0, Math.min(255, v))))
    if (m.cintura[k] && m.terreno[k] === ERBA && (x + y) % 4 === 0) r(x, y, 1, 1, [255, 255, 255], 0.35)
  }
  for (const q of m.case) r(q.x, q.y, q.w, q.h, [150, 80, 60])
  for (const q of m.tane) t.rettangolo(q.x * C - 3, q.y * C - 3, 7, 7, [30, 20, 20])
  for (const c of m.citta_) t.cornice(c.x * C, c.y * C, c.w * C, c.h * C, [255, 230, 150])
  for (const z of m.posti) {
    const col = z.tipo === 'ingresso' ? (z.storia ? COLORI.ingresso : COLORI.nuovo) : COLORI[z.tipo] || [255, 255, 255]
    r(z.x, z.y, z.w, z.h, col)
    if (z.tipo === 'pietra') t.cornice(z.x * C - 2, z.y * C - 2, z.w * C + 4, z.h * C + 4, [255, 255, 255])
  }
  t.rettangolo(m.partenza.x * C - 2, m.partenza.y * C - 2, C + 4, C + 4, [255, 255, 255])
  // i nomi: le zone col numero e la fascia, i dungeon, le città, i confini
  m.zone.forEach((Z, i) => {
    const p = m.aLato((Z.s0 + Z.s1) / 2, -1, 15)
    const s = `${i + 1} ${corto(Z.nome)} ${Z.fascia[0]}-${Z.fascia[1]}`
    t.testo(p.x * C - s.length * 4, p.y * C - 6, s, [255, 255, 255], { fondo: [0, 0, 0] })
  })
  for (const q of m.ingressi) {
    const s = `${q.storia ? q.indice + 1 : q.indice === -1 ? 'A' : '+'} ${corto(q.nome)} ${q.livello}`
    t.testo(q.x * C - 6, q.y * C + q.h * C + 4, s, [255, 230, 210], { fondo: q.storia ? [120, 20, 20] : [130, 70, 10], s: 1 })
  }
  for (const c of m.citta_) t.testo(c.x * C, c.y * C - 12, corto(c.nome), [40, 30, 0], { fondo: [255, 230, 150], s: 1 })
  for (const q of m.confini) t.testo(q.x * C + 8, q.y * C + 8, q.tipo === 'ponte' ? '=' : ':', [255, 255, 255], { fondo: [60, 40, 20], s: 2 })
}

// la pianta del villaggio ingrandita, coi nomi di chi ci sta
function villaggio(t, m, ox, oy, C) {
  const v = m.villaggio
  for (let y = 0; y < v.h; y++) for (let x = 0; x < v.w; x++) {
    const k = (v.y + y) * m.W + v.x + x
    let c = [150, 175, 105]
    if (m.strada[k] === 3) c = [210, 195, 165]
    else if (m.strada[k]) c = [214, 186, 120]
    else if (m.blocco[k] === 2) c = [70, 110, 60]
    else if (m.blocco[k]) c = [150, 80, 60]
    t.rettangolo(ox + x * C, oy + y * C, C - 1, C - 1, c)
  }
  for (const z of m.posti.filter(p => p.citta === 'villaggio')) {
    const col = COLORI[z.tipo] || [255, 255, 255]
    t.rettangolo(ox + (z.x - v.x) * C, oy + (z.y - v.y) * C, z.w * C - 1, z.h * C - 1, col)
    t.rettangolo(ox + (z.piede.x - v.x) * C + 2, oy + (z.piede.y - v.y) * C + 2, C - 5, C - 5, [255, 255, 255])
    t.rettangolo(ox + (z.accanto.x - v.x) * C + 3, oy + (z.accanto.y - v.y) * C + 3, C - 7, C - 7, [40, 40, 40])
    t.testo(ox + (z.x - v.x) * C, oy + (z.y - v.y) * C - 8, z.chiave.replace(/:.*/, '').slice(0, 9), [255, 255, 255], { fondo: [0, 0, 0], s: 1 })
  }
  t.rettangolo(ox + (m.partenza.x - v.x) * C + 1, oy + (m.partenza.y - v.y) * C + 1, C - 2, C - 2, [255, 255, 255])
  t.testo(ox, oy - 20, 'IL VILLAGGIO 40X26 (BIANCO: CHI STA FERMO, NERO: DOVE SI FERMA L\'EROE)', [255, 230, 150], { s: 1 })
}

function disegna(m, file) {
  const C = Number(opz('scala', 4)), LEG = 460, VC = 11
  const t = new Tela(m.W * C + LEG, Math.max(m.H * C, 300 + 26 * VC + 330), [20, 18, 16])
  pianta(t, m, C)
  let y = 8
  const x0 = m.W * C + 12
  const riga = (s, colore = [230, 220, 200]) => { t.testo(x0, y, s, colore, { s: 1 }); y += 8 }
  t.testo(x0, y, `MONDO A PERCORSO SEME ${m.seme} TERRA ${m.terra}`, [255, 230, 150]); y += 16
  riga(`${m.W}X${m.H} CELLE  STRADA MAESTRA ${m.lunghezza}  ${m.ms} MS  FIRMA ${m.firma}`)
  riga(`GUASTI ${m.guasti.length}`, m.guasti.length ? [255, 120, 100] : [140, 230, 140])
  y += 4
  for (const [nome, col] of [['ROSSO: DUNGEON DELLA STORIA (N = CAPITOLO)', COLORI.ingresso], ['ARANCIO: DUNGEON NUOVO (+), A: IL POZZO', COLORI.nuovo],
    ['AZZURRO BORDATO: PIETRA RUNICA', COLORI.pietra], ['CORNICE GIALLA: CITTA', [255, 230, 150]], ['GIALLO: MERCANTE  ROSA: CHI STA FERMO', COLORI.mercante],
    ['NERO: TANA DEL SIGNORE', [30, 20, 20]], ['= PONTE  : VALICO (NESSUNA GRATA)', [150, 100, 50]], ['PUNTINI BIANCHI: LA CINTURA', [255, 255, 255]]]) {
    t.rettangolo(x0, y, 6, 6, col); t.testo(x0 + 10, y, nome, [230, 220, 200], { s: 1 }); y += 9
  }
  y += 4
  riga('PASSI DA PIETRA A PIETRA (A 4,5 CELLE AL SECONDO)', [255, 230, 150])
  for (const f of m.fraPietre) riga(`${f.da} > ${f.a}: ${f.passi}  (${Math.round(f.passi / 4.5)} S)`)
  y += 4
  riga('DUNGEON: PASSI DALLA PIAZZA, LIVELLO', [255, 230, 150])
  for (const q of m.ingressi) riga(`${q.zona} ${q.chiave} ${m.passi[q.accanto.y * m.W + q.accanto.x]}  LIV ${q.livello}`)
  y += 4
  riga('ZONE: CELLE D\'ERBA, FASCIA', [255, 230, 150])
  m.zone.forEach((Z, i) => riga(`${i + 1} ${Z.chiave} ${Z.area}  ${Z.fascia.join('-')}`))
  y += 4
  for (const g of m.guasti.slice(0, 10)) riga(g.slice(0, 90), [255, 120, 100])
  villaggio(t, m, x0, Math.max(y + 28, m.H * C - 26 * VC - 10), VC)
  t.scrivi(file)
}

// la pianta del villaggio in caratteri: la stessa del documento
function villaggioInCaratteri(m) {
  const v = m.villaggio, SEGNI = { mercante: '$', persona: '@', minatore: 'M', bacheca: 'B', cartello: 'T', portale: 'O', pietra: 'P', pozzo: 'W' }
  const righe = []
  for (let y = 0; y < v.h; y++) {
    let s = ''
    for (let x = 0; x < v.w; x++) {
      const k = (v.y + y) * m.W + v.x + x
      s += m.strada[k] === 3 ? 'o' : m.strada[k] ? '+' : m.blocco[k] === 2 ? 't' : m.blocco[k] ? '#' : '.'
    }
    righe.push([...s])
  }
  for (const z of m.posti.filter(p => p.citta === 'villaggio')) {
    const segno = z.tipo === 'mercante' ? z.chiave[0].toUpperCase() : SEGNI[z.tipo] || '?'
    righe[z.piede.y - v.y][z.piede.x - v.x] = segno
  }
  righe[m.partenza.y - v.y][m.partenza.x - v.x] = '*'
  console.log('     ' + [...Array(v.w).keys()].map(i => (i % 10 ? ' ' : String(i / 10))).join(''))
  console.log('     ' + [...Array(v.w).keys()].map(i => i % 10).join(''))
  righe.forEach((r, y) => console.log(String(y).padStart(3) + '  ' + r.join('')))
  console.log('o piazza  + strada  # lotto  t albero  * partenza  I incantatrice  E erborista  M minatore  R rigattiere  A armaiolo  W pozzo  @ ragazza  O portale  B bacheca  T cartello  P pietra')
}

function racconta(m) {
  console.log(`\nmondo a percorso · seme ${m.seme} · terra ${m.terra} (${m.terraDi.nome}) · ${m.W}×${m.H} · strada maestra ${m.lunghezza} celle · ${m.ms} ms · firma ${m.firma}`)
  console.log('zone: ' + m.zone.map((Z, i) => `${i + 1} ${Z.chiave} ${Z.area} celle [${Z.fascia.join('–')}]`).join(' · '))
  console.log('da pietra a pietra: ' + m.fraPietre.map(f => `${f.da}→${f.a} ${f.passi}`).join(' · '))
  console.log('dungeon (passi dalla piazza): ' + m.ingressi.map(q => `${q.chiave} ${m.passi[q.accanto.y * m.W + q.accanto.x]}`).join(' · '))
  console.log('confini: ' + m.confini.map(q => `${q.da}→${q.a} ${q.tipo}${q.modello ? ' ' + q.modello : ''}`).join(' · '))
  console.log(`celle d'erba tolte perché non si raggiungevano: ${m.tolte}`)
  console.log(m.guasti.length ? 'GUASTI:\n  ' + m.guasti.join('\n  ') : 'nessun guasto')
}

mkdirSync(FUORI, { recursive: true })
const terra = Number(opz('terra', 1))
if (opz('semi')) {
  const [a, b] = opz('semi').split('-').map(Number)
  for (let s = a; s <= (b ?? a); s++) {
    const m = generaPercorso({ seme: s, terra })
    disegna(m, resolve(FUORI, `percorso-${s}.png`))
    console.log(`seme ${String(s).padStart(3)} · ${String(m.ms).padStart(4)} ms · ${m.guasti.length} guasti · pietre ${m.fraPietre.map(f => f.passi).join(' ')}`)
    for (const g of m.guasti) console.log(`      ${g}`)
  }
} else {
  const m = generaPercorso({ seme: Number(opz('seme', PERCORSO.seme)), terra })
  villaggioInCaratteri(m)
  racconta(m)
  const file = resolve(FUORI, `percorso-${m.seme}${terra > 1 ? '-terra' + terra : ''}.png`)
  disegna(m, file)
  console.log(`✓ ${file}`)
}
