import { chromium } from 'playwright'
import { colonnaAdd, colonnaSub, colonnaMul, colonnaMul2, colonnaDiv, generaAdd, generaSub, generaMul, generaDiv }
  from './src/data/ops.js'

/* ══════════ 1. la matematica delle colonne, fuori dal browser ══════════ */
const guasti = []
for (let i = 0; i < 4000; i++) {
  const lv = 1 + (i % 5)
  for (const op of [generaAdd(lv), generaSub(lv), generaMul(lv), generaDiv(lv)]) {
    if (op.tipo === 'div') {
      const q = Number(op.quoziente.join(''))
      if (q * op.b + op.resto !== op.a) guasti.push(`div ${op.a}:${op.b} -> ${q} r${op.resto}`)
      if (op.resto >= op.b) guasti.push(`resto troppo grande ${op.a}:${op.b}`)
      if (op.b < 2) guasti.push('divisore < 2')
    } else {
      const atteso = op.tipo === 'add' ? op.a + op.b : op.tipo === 'sub' ? op.a - op.b : op.a * op.b
      const letto = Number([...op.ris].reverse().join(''))
      if (letto !== atteso) guasti.push(`${op.tipo} ${op.a}${op.segno}${op.b} -> ${letto} invece di ${atteso}`)
      if (op.tipo === 'sub' && op.a < op.b) guasti.push(`sottrazione negativa ${op.a}-${op.b}`)
      if (op.passi.some(p => p.atteso < 0 || p.atteso > 9)) guasti.push(`passo non cifra in ${op.tipo}`)
      if (!op.passi.length) guasti.push('nessun passo')
      // NESSUN riporto o prestito da scrivere: solo cifre di risultato o prodotti parziali
      const tipiAmmessi = new Set(['ris', 'p1', 'p2'])
      if (op.passi.some(p => !tipiAmmessi.has(p.k))) guasti.push(`casella non ammessa in ${op.tipo}: ` +
        op.passi.filter(p => !tipiAmmessi.has(p.k)).map(p => p.k).join(','))
      // il numero di passi deve corrispondere alle cifre da scrivere
      const attesiPassi = op.doppia ? op.p1.length + op.p2.length + op.ris.length : op.ris.length
      if (op.passi.length !== attesiPassi) guasti.push(`passi ${op.passi.length} invece di ${attesiPassi}`)
      // prodotti parziali coerenti
      if (op.doppia) {
        const v1 = Number([...op.p1].reverse().join('')), v2 = Number([...op.p2].reverse().join(''))
        if (v1 !== op.a * (op.b % 10)) guasti.push(`parziale1 ${op.a}x${op.b} = ${v1}`)
        if (v2 !== op.a * Math.floor(op.b / 10)) guasti.push(`parziale2 ${op.a}x${op.b} = ${v2}`)
        if (v1 + v2 * 10 !== op.a * op.b) guasti.push(`somma parziali ${op.a}x${op.b}`)
        if (String(op.b).length !== 2) guasti.push('doppia con moltiplicatore a una cifra')
      } else if (op.tipo === 'mul' && String(op.b).length > 1) {
        guasti.push(`moltiplicatore a due cifre senza parziali: ${op.a}x${op.b}`)
      }
    }
  }
}
console.log('operazioni generate: 16000 · guasti:', guasti.length ? guasti.slice(0, 5) : 'nessuno')

/* riporti e prestiti attesi in casi noti */
const casi = [
  ['add  47+38', colonnaAdd(47, 38), { ris: [5, 8] }],
  ['sub  52-27', colonnaSub(52, 27), { ris: [5, 2] }],
  ['mul  47x6',  colonnaMul(47, 6),  { ris: [2, 8, 2] }],
  ['mul2 47x23', colonnaMul2(47, 23),{ p1: [1, 4, 1], p2: [4, 9], ris: [1, 8, 0, 1] }],
  ['div  97:4',  colonnaDiv(97, 4),  { quoziente: [2, 4], resto: 1 }],
]
for (const [nome, r, atteso] of casi) {
  const ok = Object.entries(atteso).every(([k, v]) => JSON.stringify(r[k]) === JSON.stringify(v))
  console.log(`  ${nome}:`, ok ? 'OK' : `ATTESO ${JSON.stringify(atteso)} OTTENUTO ${JSON.stringify(r)}`)
}

/* ══════════ 2. il gioco nel browser ══════════ */
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errori = []

for (const [nome, size] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 800 }]]) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 2 })
  page.on('pageerror', e => errori.push(`[${nome}] ${e.message}`))
  page.on('console', m => m.type() === 'error' && errori.push(`[${nome}] ${m.text()}`))
  await page.goto('file:///home/claude/giochi/dist/index.html')
  await page.waitForSelector('.carte')
  await page.click('.carta.td')
  await page.waitForSelector('.torri')

  const gioco = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.inizia()
    await attesa(100)

    const esiti = []
    // costruisce una torre per tipo risolvendo l'operazione con la tastiera
    for (const tipo of ['add', 'sub', 'mul', 'div']) {
      T.scegliTorre(tipo)
      await attesa(80)
      const op = T.op.value
      const tasti = [...document.querySelectorAll('.tastiera button')]
      if (!tasti.length) { esiti.push({ tipo, errore: 'tastiera assente' }); continue }
      let passiFatti = 0
      for (const p of op.passi) {
        const b = tasti.find(x => +x.textContent === p.atteso)
        b.click(); passiFatti++
        await attesa(12)
      }
      await attesa(60)
      esiti.push({ tipo, passi: passiFatti, torreCostruita: T.torri().length,
                   livelloTorre: T.torri().at(-1)?.lv })
    }

    // lascia correre la battaglia
    await attesa(3500)
    return { esiti, torri: T.torri().length, onda: T.hud.onda,
             nemiciInCampo: T.nemici().length, cuori: T.hud.cuori, uccisi: T.hud.uccisi }
  })

  // errore volontario: la torre deve nascere non potenziata
  const conErrore = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.scegliTorre('add')
    await attesa(80)
    const op = T.op.value
    const tasti = [...document.querySelectorAll('.tastiera button')]
    const primo = op.passi[0]
    const sbagliato = tasti.find(x => +x.textContent === (primo.atteso + 1) % 10)
    sbagliato.click(); await attesa(40)
    for (const p of op.passi) {
      tasti.find(x => +x.textContent === p.atteso).click()
      await attesa(12)
    }
    await attesa(60)
    return { livelloTorre: T.torri().at(-1)?.lv, torri: T.torri().length }
  })

  await page.screenshot({ path: `td-${nome}.png` })
  // foto con un'operazione aperta, per controllare le colonne
  for (const t of ['add', 'div', 'mul2']) {
    await page.evaluate(t => {
      const T = window.__td
      if (t === 'mul2') {                 // livello 3+: moltiplicatore a due cifre
        T.scegliTorre('mul')
        if (String(T.op.value.b).length < 2) T.forzaOp('mul', 3)
      } else T.scegliTorre(t)
    }, t)
    await page.waitForTimeout(150)
    await page.evaluate(() => {
      const T = window.__td, op = T.op.value
      const tasti = [...document.querySelectorAll('.tastiera button')]
      // riempie solo i primi passi, per fotografare le colonne a metà
      op.passi.slice(0, Math.max(1, op.passi.length - 2))
        .forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
    })
    await page.waitForTimeout(150)
    await page.screenshot({ path: `td-${nome}-${t}.png` })
    await page.evaluate(() => {
      const T = window.__td, op = T.op.value
      if (!op) return
      const tasti = [...document.querySelectorAll('.tastiera button')]
      op.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
    })
    await page.waitForTimeout(120)
  }

  // il segno dell'operazione deve essere sempre visibile
  const segni = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td, out = []
    for (const [t, lv] of [['add',1],['add',3],['sub',1],['sub',4],['mul',1],['mul',3],['mul',5]]) {
      for (let i = 0; i < 20; i++) {
        T.forzaOp(t, lv)
        await attesa(0)
        const visibile = !!document.querySelector('.griglia .segno')
        if (!visibile) { out.push(`${t} liv${lv}: ${T.op.value.a}${T.op.value.segno}${T.op.value.b}`); break }
      }
    }
    return out.length ? out : 'sempre visibile'
  })

  // il campo non deve mai debordare
  const layout = await page.evaluate(() => {
    const c = document.querySelector('canvas').getBoundingClientRect()
    const banco = document.querySelector('.banco').getBoundingClientRect()
    const tast = document.querySelector('.tastiera')?.getBoundingClientRect()
    return { campoDentro: c.bottom <= innerHeight + 1,
             bancoDentro: banco.bottom <= innerHeight + 1,
             tastieraDentro: tast ? tast.bottom <= innerHeight + 1 : 'assente' }
  })

  console.log(nome, JSON.stringify({ gioco, conErrore, segni, layout }))
  await page.close()
}

console.log(errori.length ? 'ERRORI:\n' + errori.join('\n') : 'nessun errore JS')
await browser.close()
