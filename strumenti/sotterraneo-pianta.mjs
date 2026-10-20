/* ═══════════════════════════════════════════════════════════════════
   LA PIANTA DI UN PIANO DEL SOTTERRANEO — per guardare un piano intero
   senza giocarlo: le stanze colorate per forma, le colonne, le nicchie, i
   relitti (macerie, statue rotte, sarcofagi, rocce, carri) e l'acqua, le
   porte, i ruoli (ingresso, scala, anticamera, tesoro…) e i mostri con la
   specie, i caporali, gli appostati e il mostro grosso. La famiglia del
   piano (costruita o caverna) sta nella prima riga della legenda.

     npm run pianta                                   # le sette discese, ultimo piano, seme 7
     npm run pianta -- --discesa 3 --piano 0 --seme 12
     npm run pianta -- --discesa 5 --zona 20          # la zona rinata al livello 20
     npm run pianta -- --discesa 2 --png              # anche un PNG accanto all'SVG
     npm run pianta -- --conta --semi 1-20            # le stanze per discesa: quante hanno 0, 1, 2-3, 4+ mostri (tutti i piani, nessun disegno)
     npm run pianta -- --conta --discesa 3 --semi 1-40 --zona 20   # e sotto la tabella dei muri obliqui per scena
     npm run pianta -- --percorso [--seme 5 | --terra 2]  # il mondo a percorso: strumenti/sotterraneo-pianta-percorso.mjs

   `--discesa` è l'indice della storia (0 la cripta … 6 la miniera), o
   `abisso`; `--piano` da 0, o `ultimo` (quello del mostro grosso, il
   difetto). Scrive in tmp/piante/. Lo stesso piano del gioco: lo fa
   `Corsa` col seme, come lo fa `#seme=` nell'indirizzo.
   ═══════════════════════════════════════════════════════════════════ */

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { CAMPAGNA, L_ABISSO } from '../src/giochi/sotterraneo/dati/campagna.js'
import { zonaDi } from '../src/giochi/sotterraneo/dati/zone.js'
import { Corsa } from '../src/giochi/sotterraneo/motore/corsa.js'
import { MOSTRI } from '../src/giochi/sotterraneo/dati/mostri.js'
import { ROCCIA, PORTA, RELITTO, ACQUA } from '../src/giochi/sotterraneo/dati/mondo.js'
import { diagonaliDelPiano, trattiDelAngolo } from '../src/giochi/sotterraneo/scena/muri.js'
import { SCENARI } from '../src/giochi/sotterraneo/dati/tessere.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const FUORI = resolve(QUI, '../tmp/piante')
const args = process.argv.slice(2)
// il mondo a percorso (strumenti/sotterraneo-pianta-percorso.mjs)
if (args.includes('--percorso')) { await import('./sotterraneo-pianta-percorso.mjs'); process.exit(0) }
const opz = (nome, difetto) => { const i = args.indexOf('--' + nome); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : difetto }

const seme = Number(opz('seme', 7))
// i semi di --conta: "1-20" (da 1 a 20) o "5" (solo il 5)
const semi = (t => { const [a, b] = String(t).split('-').map(Number); return Array.from({ length: (b ?? a) - a + 1 }, (_, i) => a + i) })(opz('semi', '1-20'))
const zona = opz('zona', null)
const qualiDiscese = opz('discesa', null) == null ? CAMPAGNA.map((_, i) => i)
  : [opz('discesa') === 'abisso' ? 'abisso' : Number(opz('discesa'))]

const C = 10   // pixel per cella
const FORME = { rettangolo: '#6b6255', smussata: '#6b7d8f', sala: '#9a7a3c', elle: '#3f7f73', tu: '#4a6a9a', croce: '#7a4f8a', cappella: '#8a4a5a', doppia: '#8a5a3a',
  grotta: '#55704a', bilobata: '#6f8a3c', galleria: '#3c8a78', antro: '#8a8a2f' }
const TINTE = ['#e0644f', '#4fb0e0', '#e0c04f', '#8fe04f', '#e04fb8', '#4fe0c0', '#b08fe0', '#e09a4f', '#cfcfcf', '#7f9fff', '#ff9f7f', '#9fff7f', '#ff7fd0', '#7fffe0']
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

function pianta(i) {
  const tappa = i === 'abisso' ? L_ABISSO : zona != null ? zonaDi(i, Number(zona)) : CAMPAGNA[i]
  const c = new Corsa(tappa, { seme })
  const p = opz('piano', 'ultimo')
  const n = p === 'ultimo' ? (tappa.abisso ? 4 : c.quantiPiani - 1) : Number(p)
  if (n > 0) { c.piano = Math.min(n, tappa.abisso ? n : c.quantiPiani - 1); c.nuovoPiano() }
  const L = c.livello
  const H = L.alto * C, W = Math.max(L.largo * C, 900)   // la legenda vuole spazio anche sui piani stretti
  const specie = [...new Set(L.robe.filter(r => r.che === 'mostro' && !r.grosso).map(r => r.tipo))]
  const tinta = t => TINTE[specie.indexOf(t) % TINTE.length]
  const out = []
  out.push(`<rect width="${W}" height="${H}" fill="#14110e"/>`)
  for (let y = 0; y < L.alto; y++) for (let x = 0; x < L.largo; x++) {
    const v = L.a(x, y)
    if (v === ROCCIA) continue
    const s = L.stanzaDi(x, y)
    const f = v === PORTA ? '#c9a24a' : v === ACQUA ? '#2a6f9a' : s ? FORME[s.forma] || FORME.rettangolo : '#3a342c'
    out.push(`<rect x="${x * C}" y="${y * C}" width="${C}" height="${C}" fill="${f}" stroke="#14110e" stroke-width="0.5"/>`)
  }
  for (const s of L.stanze) for (const col of s.colonne || []) {
    const [x, y] = Array.isArray(col) ? col : [col.x, col.y]
    out.push(`<rect x="${x * C + 1}" y="${y * C + 1}" width="${C - 2}" height="${C - 2}" fill="#0a0806"/>`)
  }
  // i relitti: un blocco chiaro col suo nome (la prima lettera) sopra; le nicchie: un contorno
  for (const q of L.relitti || []) {
    out.push(`<rect x="${q.x * C + 1}" y="${q.y * C + 1}" width="${q.w * C - 2}" height="${q.h * C - 2}" fill="#b9b2a4" stroke="#fff" stroke-width="0.8" rx="2"/>` +
             `<text x="${q.x * C + q.w * C / 2}" y="${q.y * C + q.h * C / 2 + 3}" fill="#222" font-size="8" text-anchor="middle" font-family="sans-serif">${esc(q.id[0])}</text>`)
  }
  for (const s of L.stanze) for (const n of s.nicchie || [])
    out.push(`<rect x="${n.x * C + 0.5}" y="${n.y * C + 0.5}" width="${C - 1}" height="${C - 1}" fill="none" stroke="#ffe9a8" stroke-width="1.2"/>`)
  for (const s of L.stanze) if (s.ruolo)
    out.push(`<text x="${s.cx * C + C / 2}" y="${s.y * C + 9}" fill="#fff" font-size="9" text-anchor="middle" font-family="sans-serif">${esc(s.ruolo)}</text>`)
  for (const r of L.robe) {
    const x = r.x * C + C / 2, y = r.y * C + C / 2
    if (r.che === 'mostro') {
      if (r.grosso) { out.push(`<circle cx="${x + C / 2}" cy="${y + C / 2}" r="${C}" fill="#b0221b" stroke="#ffd23f" stroke-width="2"/><text x="${x + C / 2}" y="${y + C / 2 + 3}" fill="#fff" font-size="9" text-anchor="middle" font-family="sans-serif">♛</text>`); continue }
      out.push(`<circle cx="${x}" cy="${y}" r="${C * 0.38}" fill="${tinta(r.tipo)}" stroke="${r.caporale ? '#ffd23f' : '#000'}" stroke-width="${r.caporale ? 2 : 0.8}"${r.appostato ? ' stroke-dasharray="2 1.5"' : ''}/>`)
      if (r.chiave) out.push(`<text x="${x + 5}" y="${y - 3}" fill="#ffd23f" font-size="8" font-family="sans-serif">⚷</text>`)
    } else if (r.che === 'forziere') out.push(`<rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="#e0b040"/>`)
    else if (r.che === 'porta') out.push(`<rect x="${r.x * C + 1}" y="${r.y * C + 1}" width="${C - 2}" height="${C - 2}" fill="${r.pelle === 'bella' ? '#d23a2a' : '#7a4a1a'}" stroke="#fff" stroke-width="1.2"/>`)
    else if (r.che === 'scala') out.push(`<text x="${x}" y="${y + 4}" fill="#fff" font-size="11" text-anchor="middle" font-family="sans-serif">▼</text>`)
    else if (r.che === 'scala-su') out.push(`<text x="${x}" y="${y + 4}" fill="#fff" font-size="11" text-anchor="middle" font-family="sans-serif">▲</text>`)
    else if (r.che === 'fonte') out.push(`<circle cx="${x}" cy="${y}" r="3" fill="#4fb0e0"/>`)
  }
  // la legenda: specie coi numeri, poi i segni
  const conta = t => L.robe.filter(r => r.che === 'mostro' && !r.grosso && r.tipo === t).length
  const righe = [
    `${tappa.nome || tappa.chiave} · piano ${c.piano + 1}${tappa.abisso ? '' : ` di ${c.quantiPiani}`} · seme ${seme}${zona != null ? ` · zona ${zona}` : ''} · ${L.stanze.length} stanze · pianta ${L.pianta}${L.acqua ? ' con acqua' : ''} · ${(L.relitti || []).length} relitti`,
    specie.map(t => `● ${(MOSTRI[t] && MOSTRI[t].nome) || t} ${conta(t)}`).join('   '),
    `cerchio d'oro caporale · tratteggio appostato · ♛ grosso · ⚷ chiave · ▼ scala · ▲ si risale · ■ forziere`,
    `blocco chiaro con l'iniziale: relitto (m macerie, c crollo/carro, r roccia, s sarcofago…) · contorno giallo: nicchia · azzurro: acqua · cella d'oro: passaggio · riquadro bianco: porta (rossa: portone)`,
    Object.entries(FORME).map(([k]) => k).join(' · '),
  ]
  const HL = 16 * righe.length + 8
  const leg = righe.map((t, j) => `<text x="6" y="${H + 16 + j * 16}" fill="#ddd" font-size="11" font-family="sans-serif">${esc(t)}</text>`)
  // i colori delle forme accanto ai loro nomi, nell'ultima riga
  const forme = []
  let fx = 6
  for (const k of Object.keys(FORME)) {
    forme.push(`<rect x="${fx}" y="${H + 16 + 4 * 16 - 9}" width="9" height="9" fill="${FORME[k]}"/>` +
               `<text x="${fx + 12}" y="${H + 16 + 4 * 16}" fill="#ddd" font-size="11" font-family="sans-serif">${k}</text>`)
    fx += k.length * 6.5 + 22
  }
  leg.pop()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + HL}" viewBox="0 0 ${W} ${H + HL}">` +
    `<rect width="${W}" height="${H + HL}" fill="#0c0a08"/>${out.join('')}${leg.join('')}${forme.join('')}</svg>`
  mkdirSync(FUORI, { recursive: true })
  const nome = `${i === 'abisso' ? 'abisso' : `${i}-${tappa.chiave}`}${zona != null ? `-z${zona}` : ''}-p${c.piano + 1}-s${seme}`
  const file = resolve(FUORI, nome + '.svg')
  writeFileSync(file, svg)
  return { file, nome, svg, W, H: H + HL }
}

// ─── --conta: i mostri per stanza, senza disegnare ───────────────────────────────────────────────────────────
// Le stanze ordinarie (quelle dove il piano mette i mostri: senza ruolo, o del portale e della fonte; l'ingresso, la scala, il tesoro e
// l'anticamera hanno il loro posto e i loro mostri) contate per
// quanti mostri hanno: 0, 1, 2-3, 4+; poi quanti mostri ha in media una stanza che ne ha, il branco più grosso, quanti scagnozzi ha il
// mostro grosso nella sua stanza, le porte chiuse per piano e quelle che non stanno su un muro dritto. Tutti i piani di ogni discesa.
function conta() {
  const righe = []
  const tot = { st: 0, b: [0, 0, 0, 0], mostri: 0, piani: 0, nonVuote: 0, soloMostri: 0, max: 0, scag: [], porte: 0, storte: 0, impilate: 0, grossi: 0, portoni: 0, nic: 0, nicVuote: 0 }
  for (const i of qualiDiscese) {
    const t = { st: 0, b: [0, 0, 0, 0], mostri: 0, piani: 0, nonVuote: 0, soloMostri: 0, max: 0, scag: [], porte: 0, storte: 0, impilate: 0, grossi: 0, portoni: 0, nic: 0, nicVuote: 0 }
    const tappa = i === 'abisso' ? L_ABISSO : zona != null ? zonaDi(i, Number(zona)) : CAMPAGNA[i]
    for (const sm of semi) {
      const c = new Corsa(tappa, { seme: sm })
      const quanti = tappa.abisso ? 8 : c.quantiPiani
      for (let p = 0; p < quanti; p++) {
        const L = c.faiIlPiano(p)
        t.piani++
        for (const s of L.stanze) for (const n of s.nicchie) { t.nic++; if (!L.robeSu(n.x, n.y).length) t.nicVuote++ }
        const mostri = L.robe.filter(r => r.che === 'mostro')
        t.mostri += mostri.length
        for (const s of L.stanze) {
          const dentro = mostri.filter(m => L.dentroStanza(m, s))
          if (s.ruolo === 'uscita' && L.grosso) t.scag.push(dentro.filter(m => !m.grosso).length)
          if (['ingresso', 'uscita', 'anticamera', 'tesoro'].includes(s.ruolo)) continue
          t.st++
          const n = dentro.length
          t.b[n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3]++
          if (n) { t.nonVuote++; t.soloMostri += n; t.max = Math.max(t.max, n) }
        }
        const porte = L.robe.filter(r => r.che === 'porta')
        t.porte += porte.length
        if (L.grosso) { t.grossi++; if (porte.some(r => r.pelle === 'bella')) t.portoni++ }
        for (const r of porte) {
          const pietra = (x, y) => L.a(x, y) === ROCCIA
          const dritta = (pietra(r.x - 1, r.y) && pietra(r.x + 1, r.y) && !pietra(r.x, r.y - 1) && !pietra(r.x, r.y + 1)) ||
                         (pietra(r.x, r.y - 1) && pietra(r.x, r.y + 1) && !pietra(r.x - 1, r.y) && !pietra(r.x + 1, r.y))
          if (!dritta) t.storte++
          if (porte.some(q => q !== r && Math.max(Math.abs(q.x - r.x), Math.abs(q.y - r.y)) <= 2)) t.impilate++
        }
      }
    }
    const pc = x => (t.st ? Math.round(100 * x / t.st) : 0) + '%'
    const media = t.nonVuote ? (t.soloMostri / t.nonVuote).toFixed(1) : '-'
    const scag = t.scag.length ? (t.scag.reduce((a, b) => a + b, 0) / t.scag.length).toFixed(1) + ` (${Math.min(...t.scag)}-${Math.max(...t.scag)})` : '-'
    const nome = i === 'abisso' ? 'abisso' : `${i} ${(tappa.nome || tappa.chiave).slice(0, 24)}`
    righe.push([nome, t.st, pc(t.b[0]), pc(t.b[1]), pc(t.b[2]), pc(t.b[3]), media, t.max, (t.mostri / t.piani).toFixed(1), scag, (t.porte / t.piani).toFixed(1), t.storte, t.impilate, t.grossi ? `${t.portoni}/${t.grossi}` : '-', `${t.nicVuote}/${t.nic}`])
    for (const k of ['st', 'mostri', 'piani', 'nonVuote', 'soloMostri', 'porte', 'storte', 'impilate', 'grossi', 'portoni', 'nic', 'nicVuote']) tot[k] += t[k]
    t.b.forEach((x, k) => { tot.b[k] += x }); tot.max = Math.max(tot.max, t.max); tot.scag.push(...t.scag)
  }
  const pc = x => (tot.st ? Math.round(100 * x / tot.st) : 0) + '%'
  if (qualiDiscese.length > 1) righe.push(['TUTTE', tot.st, pc(tot.b[0]), pc(tot.b[1]), pc(tot.b[2]), pc(tot.b[3]), tot.nonVuote ? (tot.soloMostri / tot.nonVuote).toFixed(1) : '-', tot.max,
    (tot.mostri / tot.piani).toFixed(1), tot.scag.length ? (tot.scag.reduce((a, b) => a + b, 0) / tot.scag.length).toFixed(1) : '-', (tot.porte / tot.piani).toFixed(1), tot.storte, tot.impilate, `${tot.portoni}/${tot.grossi}`, `${tot.nicVuote}/${tot.nic}`])
  const testa = ['discesa', 'stanze', '0', '1', '2-3', '4+', 'media', 'max', 'mostri/piano', 'scagnozzi', 'porte/piano', 'storte', 'impilate', 'portoni', 'nicchie vuote']
  const larghe = testa.map((h, k) => Math.max(h.length, ...righe.map(r => String(r[k]).length)))
  const riga = r => r.map((v, k) => (k === 0 ? String(v).padEnd(larghe[k]) : String(v).padStart(larghe[k]))).join('  ')
  console.log(`semi ${semi[0]}-${semi[semi.length - 1]}${zona != null ? ` · zona ${zona}` : ''} · stanze ordinarie (senza ruolo, portale, fonte), tutti i piani`)
  console.log(riga(testa)); console.log(larghe.map(l => '-'.repeat(l)).join('  '))
  for (const r of righe) console.log(riga(r))
  console.log('media = mostri in una stanza che ne ha · scagnozzi = mostri (non il grosso) nella stanza del grosso · storte = porte chiuse non su un muro dritto · impilate = porte chiuse con un\'altra a due celle · portoni = piani col grosso che hanno la porta bella sulla sua stanza · nicchie vuote = nicchie senza niente dentro (né mostro, né gemma, né un pezzo) su tutte le nicchie')
}
// ─── --conta, i muri obliqui: quanti tagli e angoli interni, e quanti stanno male (accanto a una nicchia o a una porta, su un tratto dritto corto) ──
function contaMuri() {
  const per = {}
  for (const i of qualiDiscese) {
    const tappa = i === 'abisso' ? L_ABISSO : zona != null ? zonaDi(i, Number(zona)) : CAMPAGNA[i]
    for (const sm of semi) {
      const c = new Corsa(tappa, { seme: sm })
      const quanti = tappa.abisso ? 8 : c.quantiPiani
      for (let p = 0; p < quanti; p++) {
        const L = c.faiIlPiano(p)
        const sc = SCENARI[L.scenario]
        if (!sc || !sc.diagonali) continue
        const t = per[L.scenario] ||= { piani: 0, tagli: 0, tagliVicini: 0, interni: 0, interniVicini: 0, interniCorti: 0 }
        t.piani++
        const pietra = (x, y) => L.a(x, y) === ROCCIA
        const nicchie = new Set(L.stanze.flatMap(r => r.nicchie || []).map(n => n.y * L.largo + n.x))
        const vicino = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (nicchie.has((y + dy) * L.largo + x + dx) || L.a(x + dx, y + dy) === PORTA) return true; return false }
        const { tagli, interni, buona } = diagonaliDelPiano(L, ['smussata', 'cappella', 'sala'])
        for (const k of tagli.keys()) { t.tagli++; if (vicino(k % L.largo, Math.floor(k / L.largo))) t.tagliVicini++ }
        for (const [k, tipo] of interni) {
          const x = k % L.largo, y = Math.floor(k / L.largo)
          t.interni++
          if (vicino(x, y)) t.interniVicini++
          if (trattiDelAngolo(pietra, x, y, tipo, buona).some(n => n < 2)) t.interniCorti++
        }
      }
    }
  }
  const testa = ['scena', 'piani', 'tagli', 'a nicchia/porta', 'interni', 'a nicchia/porta', 'su tratto corto']
  const righe = Object.entries(per).map(([n, t]) => [n, t.piani, t.tagli, t.tagliVicini, t.interni, t.interniVicini, t.interniCorti])
  const larghe = testa.map((h, k) => Math.max(h.length, ...righe.map(r => String(r[k]).length)))
  const riga = r => r.map((v, k) => (k === 0 ? String(v).padEnd(larghe[k]) : String(v).padStart(larghe[k]))).join('  ')
  console.log(`\nmuri obliqui · semi ${semi[0]}-${semi[semi.length - 1]}${zona != null ? ` · zona ${zona}` : ''} · tutti i piani`)
  console.log(riga(testa)); console.log(larghe.map(l => '-'.repeat(l)).join('  '))
  for (const r of righe) console.log(riga(r))
  console.log('a nicchia/porta = una nicchia o una porta fra le otto celle intorno · su tratto corto = un angolo interno con meno di due celle di muro dritto oltre l\'angolo su uno dei due lati')
}
// ─── --passi: quanti passi (celle percorse) fa un piano ──────────────────────────────────────────────────────────
// L'orologio del sotterraneo conta i passi dell'eroe (docs/sotterraneo/orologio.md): serve sapere quanti ne fa un piano. Su ogni piano
// di ogni discesa, per ogni seme, da una cella all'altra col cammino più corto (quattro direzioni, le porte si aprono): «dritto» è
// dall'ingresso a chi porta la chiave e da lui alla scala (quello che fa chi va dritto), «giro» è un giro di tutte le stanze (ognuna
// la più vicina dopo l'altra, come lo fa chi non vuole perdersi niente) e poi la chiave e la scala. Sono i passi minimi: chi gira a
// occhio ne fa di più (il banco ne conta di veri: `npm run sotterraneo -- --passi`).
function passi() {
  const righe = []
  const dist = (L, da) => {
    const d = new Int32Array(L.largo * L.alto).fill(-1)
    const coda = [da.y * L.largo + da.x]
    d[coda[0]] = 0
    for (let i = 0; i < coda.length; i++) {
      const k = coda[i], x = k % L.largo, y = Math.floor(k / L.largo)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= L.largo || ny >= L.alto || !L.calpestabile(nx, ny)) continue
        const q = ny * L.largo + nx
        if (d[q] >= 0) continue
        d[q] = d[k] + 1
        coda.push(q)
      }
    }
    return d
  }
  const tra = (L, d, a) => d[a.y * L.largo + a.x]
  const tot = { piani: 0, stanze: 0, dritto: 0, giro: 0 }
  const tutte = []
  for (const i of qualiDiscese) {
    const tappa = i === 'abisso' ? L_ABISSO : zona != null ? zonaDi(i, Number(zona)) : CAMPAGNA[i]
    const t = { piani: 0, stanze: 0, dritto: 0, giro: 0, giroMax: 0, discese: 0, perDiscesa: 0 }
    for (const sm of semi) {
      const c = new Corsa(tappa, { seme: sm })
      const quanti = tappa.abisso ? 8 : c.quantiPiani
      let discesa = 0
      for (let p = 0; p < quanti; p++) {
        const L = c.faiIlPiano(p)
        const ingresso = { x: L.stanze[0].cx, y: L.stanze[0].cy }
        const scala = L.robe.find(r => r.che === 'scala')
        const chi = L.robe.find(r => r.che === 'mostro' && r.chiave)
        if (!scala) continue
        const fine = { x: scala.x, y: scala.y }
        const mete = chi ? [{ x: chi.x, y: chi.y }, fine] : [fine]
        // il cammino che passa per le mete, in fila
        const per = (da, lista) => lista.reduce((n, m) => { const d = dist(L, n.a); return { a: m, passi: n.passi + Math.max(0, tra(L, d, m)) } }, { a: da, passi: 0 }).passi
        const dritto = per(ingresso, mete)
        // il giro: le stanze una dopo l'altra, sempre la più vicina; poi chi ha la chiave e la scala
        let qui = ingresso, giro = 0
        const restano = L.stanze.map(s => ({ x: s.cx, y: s.cy })).filter(s => s.x !== ingresso.x || s.y !== ingresso.y)
        while (restano.length) {
          const d = dist(L, qui)
          let meglio = 0
          restano.forEach((s, k) => { if (tra(L, d, s) >= 0 && (tra(L, d, restano[meglio]) < 0 || tra(L, d, s) < tra(L, d, restano[meglio]))) meglio = k })
          const s = restano.splice(meglio, 1)[0]
          giro += Math.max(0, tra(L, d, s))
          qui = s
        }
        giro += per(qui, mete)
        t.piani++; t.stanze += L.stanze.length; t.dritto += dritto; t.giro += giro; t.giroMax = Math.max(t.giroMax, giro)
        discesa += dritto
        if (args.includes('--per-piano') && sm === semi[0]) righe.push([`${i === 'abisso' ? 'abisso' : i} p${p + 1}`, L.stanze.length, dritto, giro])
      }
      t.discese++; t.perDiscesa += discesa
    }
    for (const k of ['piani', 'stanze', 'dritto', 'giro']) tot[k] += t[k]
    tutte.push([i === 'abisso' ? 'abisso' : `${i} ${(tappa.nome || tappa.chiave).slice(0, 24)}`, (t.piani / t.discese).toFixed(1), (t.stanze / t.piani).toFixed(1),
      Math.round(t.dritto / t.piani), Math.round(t.giro / t.piani), t.giroMax, Math.round(t.perDiscesa / t.discese)])
  }
  if (qualiDiscese.length > 1) tutte.push(['TUTTE', '-', (tot.stanze / tot.piani).toFixed(1), Math.round(tot.dritto / tot.piani), Math.round(tot.giro / tot.piani), '-', '-'])
  const testa = ['discesa', 'piani', 'stanze', 'dritto', 'giro', 'giro max', 'discesa dritta']
  const larghe = testa.map((h, k) => Math.max(h.length, ...tutte.map(r => String(r[k]).length)))
  const riga = r => r.map((v, k) => (k === 0 ? String(v).padEnd(larghe[k]) : String(v).padStart(larghe[k]))).join('  ')
  console.log(`semi ${semi[0]}-${semi[semi.length - 1]}${zona != null ? ` · zona ${zona}` : ''} · passi per piano (media), dall'ingresso: dritto = la chiave e la scala, giro = tutte le stanze poi la chiave e la scala`)
  console.log(riga(testa)); console.log(larghe.map(l => '-'.repeat(l)).join('  '))
  for (const r of tutte) console.log(riga(r))
  console.log('discesa dritta = i passi di tutta la discesa andando dritti, piano dopo piano')
  if (righe.length) { console.log(''); for (const r of righe) console.log(r.join('\t')) }
}
if (args.includes('--passi')) { passi(); process.exit(0) }
if (args.includes('--conta')) { conta(); contaMuri(); process.exit(0) }

const fatti = qualiDiscese.map(pianta)
for (const f of fatti) console.log(`✓ ${f.file}`)

if (args.includes('--png')) {
  const { apriBrowser } = await import('../test/aiuto/browser.mjs')
  const browser = await apriBrowser()
  for (const f of fatti) {
    const page = await browser.newPage({ viewport: { width: f.W, height: f.H }, deviceScaleFactor: 2 })
    await page.setContent(`<body style="margin:0;background:#0c0a08">${f.svg}</body>`)
    const png = f.file.replace(/\.svg$/, '.png')
    await page.screenshot({ path: png, fullPage: true })
    await page.close()
    console.log(`✓ ${png}`)
  }
  await browser.close()
}
