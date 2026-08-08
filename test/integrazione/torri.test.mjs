import { apriBrowser, apriGioco, scatto, SCATTI_ACCESI } from '../aiuto/browser.mjs'
import { smussa, tracciato } from '../../src/grafica/geometria.js'
import { colonnaAdd, colonnaSub, colonnaMul, colonnaMul2, colonnaDiv, generaAdd, generaSub,
         generaMul, generaDiv, LIVELLI } from '../../src/data/ops.js'

/* ══════════ 1. la matematica delle colonne, fuori dal browser ══════════ */
const guasti = []
for (let i = 0; i < 4000; i++) {
  const lv = 1 + (i % LIVELLI)
  for (const op of [generaAdd(lv), generaSub(lv), generaMul(lv), generaDiv(lv)]) {
    if (op.tipo === 'div') {
      const q = Number(op.quoziente.join(''))
      if (q * op.b + op.resto !== op.a) guasti.push(`div ${op.a}:${op.b} -> ${q} r${op.resto}`)
      if (op.resto >= op.b) guasti.push(`resto troppo grande ${op.a}:${op.b}`)
      if (op.b < 2) guasti.push('divisore < 2')
    } else {
      const atteso = op.tipo === 'add' ? op.numeri.reduce((s, n) => s + n, 0)
        : op.tipo === 'sub' ? op.a - op.b : op.a * op.b
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

/* ══════ la scaletta: dieci gradini, uno per volta ══════
   Il controllo è dichiarativo: per ogni livello si dice cosa DEVE avere
   l'operazione, e si guarda che i generatori lo rispettino sempre. */
const cifreDi = n => String(n).split('').reverse().map(Number)
const quantiRiporti = ns => {
  const colonne = Math.max(...ns.map(n => String(n).length))
  let quanti = 0, r = 0
  for (let c = 0; c < colonne; c++) {
    const somma = ns.reduce((s, n) => s + (cifreDi(n)[c] || 0), 0) + r
    r = Math.floor(somma / 10)
    if (r > 0) quanti++
  }
  return quanti
}
const quantiPrestiti = (a, b) => {
  const A = cifreDi(a), B = cifreDi(b)
  let quanti = 0, p = 0
  for (let c = 0; c < A.length; c++) {
    if ((A[c] || 0) - p < (B[c] || 0)) { quanti++; p = 1 } else p = 0
  }
  return quanti
}

// per ogni livello: quanti addendi, quanti riporti almeno (0 = nessuno mai)
const ATTESE_ADD = [[2, 0], [2, 1], [2, 0], [2, 1], [3, 0], [3, 1], [2, 1], [3, 2], [4, 1], [3, 2]]
const ATTESE_SUB = [0, 1, 0, 1, 1, 2, 1, 2, 2, 2]        // prestiti almeno
const ATTESE_MUL = [false, false, false, false, false, true, true, true, true, true]  // doppia?
const ATTESE_DIV = [false, true, false, true, false, true, true, false, true, true]   // resto?

const scaletta = []
for (let lv = 1; lv <= LIVELLI; lv++) {
  const [addendi, riportiMin] = ATTESE_ADD[lv - 1]
  for (let i = 0; i < 200; i++) {
    const a = generaAdd(lv), r = quantiRiporti(a.numeri)
    if (a.numeri.length !== addendi)
      scaletta.push(`add liv${lv}: ${a.numeri.length} addendi invece di ${addendi}`)
    if (riportiMin === 0 ? r > 0 : r < riportiMin)
      scaletta.push(`add liv${lv}: ${r} riporti (attesi ${riportiMin === 0 ? 'zero' : '≥' + riportiMin}) in ${a.numeri.join('+')}`)

    const b = generaSub(lv), pr = quantiPrestiti(b.a, b.b), atteso = ATTESE_SUB[lv - 1]
    if (atteso === 0 ? pr > 0 : pr < atteso)
      scaletta.push(`sub liv${lv}: ${pr} prestiti (attesi ${atteso === 0 ? 'zero' : '≥' + atteso}) in ${b.a}-${b.b}`)

    const m = generaMul(lv)
    if (!!m.doppia !== ATTESE_MUL[lv - 1])
      scaletta.push(`mul liv${lv}: ${m.a}x${m.b} ${m.doppia ? 'con' : 'senza'} prodotti parziali`)
    if (lv <= 4 && !ATTESE_MUL[lv - 1]) {
      const conRiporto = String(m.a).split('').some(d => +d * m.b > 9)
      const vuoleRiporto = lv === 2 || lv === 4
      if (conRiporto !== vuoleRiporto)
        scaletta.push(`mul liv${lv}: ${m.a}x${m.b} ${conRiporto ? 'con' : 'senza'} riporti`)
    }

    const d = generaDiv(lv)
    if ((d.resto > 0) !== ATTESE_DIV[lv - 1])
      scaletta.push(`div liv${lv}: ${d.a}:${d.b} resto ${d.resto}`)
    if (String(d.a).length !== [2, 2, 3, 3, 3, 3, 3, 4, 4, 4][lv - 1])
      scaletta.push(`div liv${lv}: dividendo ${d.a} di lunghezza sbagliata`)
  }
}
console.log(`scaletta dei ${LIVELLI} livelli:`, scaletta.length ? scaletta.slice(0, 6) : 'rispettata')

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
const browser = await apriBrowser()
const errori = []
const raccolti = []   // [nome dello schermo, elenco che si riempie da sé]

for (const [nome, size] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 800 }]]) {
  /* dagli helper e non a mano: è lì che sta il giocatore di prova, senza
     il quale l'app si ferma a chiedere «come ti chiami?» */
  const { page, errori: suoi } = await apriGioco(browser, { viewport: size })
  /* l'elenco si riempie mentre il test va avanti: si tiene il riferimento
     e si legge alla fine, copiarlo adesso vorrebbe dire copiarlo vuoto */
  raccolti.push([nome, suoi])
  await page.click('.carta.td')
  await page.waitForSelector('.tappe')

  /* la campagna: dalla mappa si apre solo la prima tappa, che dà una torre sola
     e non manda nemici finché quella torre non è in piedi */
  const campagna = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    const chiuse = [...document.querySelectorAll('.tap')].map(b => b.classList.contains('chiusa'))
    T.inizia(0)
    await attesa(1600)                       // il gioco aspetta: nessuna ondata da sola
    const primaDellaTorre = { onda: T.hud.onda, nemici: T.nemici().length,
                              energia: T.hud.energia }
    T.scegliTorre('div')                     // non ancora sbloccata: deve essere rifiutata
    const bloccataRifiutata = T.op.value === null
    T.scegliTorre('add')
    await attesa(80)
    const tasti = [...document.querySelectorAll('.tastiera button')]
    T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
    await attesa(200)
    const energiaSpesa = T.hud.energia            // la torre ha mangiato l'energia iniziale
    const attesaDopoLaTorre = { onda: T.hud.onda, inAttesa: T.inAttesa.value }
    T.chiamaOnda()                                // la battaglia parte a comando
    await attesa(1400)
    /* la prima torre deve nascere sulla postazione più vicina al castello.
       «Vicina» si misura **lungo la strada**, non in linea d'aria: i
       percorsi tornano su sé stessi, e due punti a un passo l'uno
       dall'altro possono essere a mezza tappa di distanza per chi cammina.
       Il conto lo fa Node, qui si portano fuori solo i numeri. */
    const c = document.querySelector('.campo canvas').getBoundingClientRect()
    const strada = { posti: T.postazioni().map(p => ({ x: p.x, y: p.y })),
                     torre: { x: T.torri()[0].x, y: T.torri()[0].y },
                     forma: T.TAPPE[0].forma, W: c.width, H: c.height }
    return { tappe: T.TAPPE.length, chiuse, primaDellaTorre, bloccataRifiutata,
             strada, energiaSpesa, attesaDopoLaTorre,
             dopoLaChiamata: { onda: T.hud.onda, nemici: T.nemici().length } }
  })

  /* quanto è avanti lungo la strada: si campiona il tracciato vero — lo
     stesso `smussa` + `tracciato` che usa il motore — e si prende il punto
     più vicino. È l'unico modo onesto di dire «più vicino al castello». */
  const { posti, torre, forma, W, H } = campagna.strada
  const via = tracciato(smussa(forma.map(([x, y]) => ({ x: x * W, y: y * H }))))
  const avanzamento = p => {
    let migliore = 0, minima = Infinity
    for (let d = 0; d <= via.lunghezza; d += 3) {
      const q = via.puntoA(d), dd = Math.hypot(q.x - p.x, q.y - p.y)
      if (dd < minima) { minima = dd; migliore = d }
    }
    return migliore
  }
  campagna.vicinoAlCastello = posti.every(p => avanzamento(torre) >= avanzamento(p) - 1)
  delete campagna.strada

  /* l'attesa fra le ondate: infinita mentre si calcola, non mentre si guarda.
     A velocità 6 il conto del gioco scorre sei volte più in fretta, quindi il
     limite arriva in pochi secondi invece che in venti. */
  const attesaOndata = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.inizia(0)
    T.velocita.value = 6
    await attesa(100)
    T.scegliTorre('add')                       // un'operazione aperta ferma il conto
    await attesa(60)
    const ondaConCalcolo = T.hud.onda
    await attesa(9000)                         // ben oltre il limite, ma sta calcolando
    const restaFermo = T.hud.onda === ondaConCalcolo
    const tasti = [...document.querySelectorAll('.tastiera button')]
    T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
    await attesa(120)
    const primaDiAspettare = T.hud.onda
    // la prima tappa lascia 45 secondi di calma, che a velocità 6 sono sette e mezzo
    await attesa(9000)                         // adesso sta solo a guardare
    const partitaDaSola = T.hud.onda > primaDiAspettare
    T.velocita.value = 1
    return { restaFermo, partitaDaSola, primaDiAspettare, onda: T.hud.onda }
  })

  /* avanti veloce: a ×3 il campo deve muoversi circa il triplo */
  const veloce = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    const passo = async () => {
      const prima = T.nemici()[0]?.d ?? 0
      await attesa(600)
      return (T.nemici()[0]?.d ?? 0) - prima
    }
    T.velocita.value = 1
    const a = await passo()
    T.cambiaVelocita(); T.cambiaVelocita()          // ×2 poi ×3
    const tre = T.velocita.value
    const b = await passo()
    T.velocita.value = 1
    return { cicloVelocita: tre, avanzaX1: Math.round(a), avanzaX3: Math.round(b),
             piuVeloce: b > a * 2 }
  })

  /* il potenziamento: la torre nasce al livello 1 e sale toccandola, un
     gradino per volta, finché non tocca il tetto della tappa */
  const potenziamento = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    const risolvi = async () => {
      await attesa(60)
      const op = T.op.value
      if (!op) return null
      const tasti = [...document.querySelectorAll('.tastiera button')]
      op.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
      await attesa(120)
      return op
    }
    T.inizia(0)                              // tappa 1: tetto al livello 3
    await attesa(100)
    const senzaEnergia = (T.hud.energia = 0, T.scegliTorre('add'), T.op.value === null)
    T.hud.energia = 500
    const prezzoNuova = T.costoNuova.value
    T.scegliTorre('add')
    const opNuova = await risolvi()
    const torre = T.torri()[0]
    const livelli = [torre.lv], prezzi = []
    // sale finché il tetto della tappa lo consente, un gradino per volta
    for (let i = 0; i < T.massimo.value + 1; i++) {
      const prima = torre.lv
      prezzi.push(T.costoSalita(torre))
      T.potenzia(torre)
      if (!T.op.value) break                 // tetto raggiunto: niente operazione
      await risolvi()
      livelli.push(torre.lv)
      if (torre.lv === prima) break
    }
    const oltreIlTetto = T.op.value === null
    return { livelli, oltreIlTetto, tetto: T.massimo.value, senzaEnergia,
             prezzoNuova, prezzoSalita: prezzi[0], salitaCostaMeno: prezzi[0] < prezzoNuova,
             addendiNuova: opNuova.numeri.length, cuori: T.hud.cuori }
  })

  const gioco = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.iniziaLibera()                         // tutte le torri, nessun traguardo
    T.hud.energia = 500
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

    // manda l'ondata e lascia correre la battaglia
    T.chiamaOnda()
    await attesa(3500)
    return { esiti, torri: T.torri().length, onda: T.hud.onda,
             nemiciInCampo: T.nemici().length, cuori: T.hud.cuori, uccisi: T.hud.uccisi }
  })

  // errore volontario: la torre si costruisce lo stesso, ma costa un cuore
  const conErrore = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.hud.energia = 500
    const cuoriPrima = T.hud.cuori, energiaPrima = T.hud.energia
    const prezzo = T.costoNuova.value
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
    return { livelloTorre: T.torri().at(-1)?.lv, torri: T.torri().length,
             cuoriPrima, cuoriDopo: T.hud.cuori,
             pagato: energiaPrima - T.hud.energia, prezzoSenzaErrori: prezzo,
             penaleApplicata: energiaPrima - T.hud.energia > prezzo }
  })

  /* Le foto delle colonne: nessuno le controlla a macchina, servono a
     un occhio umano. Sono spente se non le chiedi (`--scatti`), perché
     tutto questo pezzo esiste solo per farle — e finivano in radice,
     dove il caso del gioco le rendeva diverse a ogni build. */
  if (SCATTI_ACCESI) {
    await scatto(page, `td-${nome}`)
    for (const t of ['add', 'div', 'mul2']) {
      await page.evaluate(t => {
        const T = window.__td
        /* la borsa piena: qui si fotografano le colonne, non si misura
           l'economia. Il prezzo di una torre nuova sale con quelle già in
           campo, e dopo tre foto di fila l'energia non basterebbe più —
           il tasto verrebbe rifiutato e non ci sarebbe niente da ritrarre. */
        T.hud.energia = 5000
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
      await scatto(page, `td-${nome}-${t}`)
      await page.evaluate(() => {
        const T = window.__td, op = T.op.value
        if (!op) return
        const tasti = [...document.querySelectorAll('.tastiera button')]
        op.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
      })
      await page.waitForTimeout(120)
    }
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

  /* Il trascinamento col dito, non col mouse: sul telefono il difetto era che
     il browser si prendeva il gesto come scorrimento e annullava tutto a metà.
     Qui si usano eventi touch veri (via CDP), che è l'unico modo per accorgersi
     della differenza: con il mouse funzionava anche quando sul telefono no. */
  const dito = await (async () => {
    const posto = await page.evaluate(async () => {
      const attesa = ms => new Promise(r => setTimeout(r, ms))
      const T = window.__td
      T.inizia(0); T.hud.energia = 200
      await attesa(150)
      T.scegliTorre('add')
      await attesa(60)
      const tasti = [...document.querySelectorAll('.tastiera button')]
      T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
      await attesa(150)
      const t = T.torri()[0]
      // la piazzola libera più lontana dalla torre: le tappe hanno pochi posti
      // e una scelta a indice fisso resta senza piazzola appena cambiano i dati
      const liberi = T.postazioni()
        .filter(p => !T.torri().some(x => Math.hypot(x.x - p.x, x.y - p.y) < 2))
        .sort((a, b) => Math.hypot(b.x - t.x, b.y - t.y) - Math.hypot(a.x - t.x, a.y - t.y))
      // un traguardo appena vinto copre lo schermo col suo velo, e si mangia i
      // tocchi: va chiuso, o il test misura il velo invece del gioco
      for (let i = 0; i < 5 && document.querySelector('.velo'); i++) {
        document.querySelector('.velo').click()
        await attesa(120)
      }
      window.__conta = { down: 0, move: 0, up: 0 }
      const cv = document.querySelector('canvas')
      cv.addEventListener('pointerdown', () => window.__conta.down++)
      cv.addEventListener('pointermove', () => window.__conta.move++)
      cv.addEventListener('pointerup', () => window.__conta.up++)
      return { torre: { x: t.x, y: t.y }, meta: liberi[0],
               touchAction: getComputedStyle(cv).touchAction }
    })
    const box = await (await page.$('canvas')).boundingBox()
    const cdp = await page.context().newCDPSession(page)
    const punto = (x, y) => [{ x: Math.round(box.x + x), y: Math.round(box.y + y) }]
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: punto(posto.torre.x, posto.torre.y) })
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: punto(
        posto.torre.x + (posto.meta.x - posto.torre.x) * i / 6,
        posto.torre.y + (posto.meta.y - posto.torre.y) * i / 6) })
      await page.waitForTimeout(40)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(250)
    const dove = await page.evaluate(() => {
      const t = window.__td.torri()[0]
      return { x: t.x, y: t.y, lv: t.lv }
    })
    const conta = await page.evaluate(() => window.__conta)
    return { touchAction: posto.touchAction, livelloIntatto: dove.lv,
             tocchiArrivati: conta.down > 0 && conta.move > 0,
             atterrata: Math.hypot(dove.x - posto.meta.x, dove.y - posto.meta.y) < 3 }
  })()

  // il campo non deve mai debordare
  const layout = await page.evaluate(() => {
    const c = document.querySelector('canvas').getBoundingClientRect()
    const banco = document.querySelector('.banco').getBoundingClientRect()
    const tast = document.querySelector('.tastiera')?.getBoundingClientRect()
    return { campoDentro: c.bottom <= innerHeight + 1,
             bancoDentro: banco.bottom <= innerHeight + 1,
             tastieraDentro: tast ? tast.bottom <= innerHeight + 1 : 'assente' }
  })

  console.log(nome, JSON.stringify({ campagna, attesaOndata, veloce, potenziamento, gioco,
                                     conErrore, dito, segni, layout }))
  await page.close()
}

for (const [nome, suoi] of raccolti) errori.push(...suoi.map(e => `[${nome}] ${e}`))
console.log(errori.length ? 'ERRORI:\n' + errori.join('\n') : 'nessun errore JS')
await browser.close()
