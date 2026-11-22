/* ═══════════════════════════════════════════════════════════════════
   IL CASTELLO NEL BROWSER: LE MISURE DA GUARDARE
   perché: le misure del castello da guardare, giocando la prima tappa col motore della pagina (`window.__td`) a telefono e a schermo grande: attese, velocità ×3, potenziamenti, penale del conto sbagliato, il dito sul campo
   a parte perché: non è un test: stampa e fallisce solo per un errore in console; i controlli veri (pausa, barra) stanno in integrazione/torri

   Non è un test: gioca la prima tappa col motore della pagina
   (`window.__td`) al telefono e allo schermo grande e **stampa** quello
   che vede — la prima tappa che aspetta la torre, l'attesa fra le
   ondate, la velocità ×3, i potenziamenti, la penale di un conto
   sbagliato, il dito che trascina sul campo, i segni delle operazioni,
   il campo e il foglio dentro lo schermo — perché lo guardi chi tocca il
   castello. I controlli veri (la pausa, la barra) stanno in
   `integrazione/torri`. Fallisce solo per un errore in console.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, attendi, scatto, SCATTI_ACCESI, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { tracciato } from '../../src/grafica/geometria.js'

/* ══════════ il gioco nel browser ══════════ */
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
  await scegli(page, 'torri')
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
    const strada = { posti: T.postazioni().map(p => ({ x: p.x, y: p.y })),
                     torre: { x: T.torri()[0].x, y: T.torri()[0].y },
                     punti: T.motore().via.punti.map(p => ({ x: p.x, y: p.y })) }
    return { tappe: T.TAPPE.length, chiuse, primaDellaTorre, bloccataRifiutata,
             strada, energiaSpesa, attesaDopoLaTorre,
             dopoLaChiamata: { onda: T.hud.onda, nemici: T.nemici().length } }
  })

  /* quanto è avanti lungo la strada: si campiona il tracciato vero — la
     strada a squadra della carta, presa dal motore — e si prende il punto
     più vicino. È l'unico modo onesto di dire «più vicino al castello». */
  const { posti, torre, punti } = campagna.strada
  const via = tracciato(punti)
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
    // sonda una condizione invece di dormire alla cieca: finisce appena è
    // vera, e non oltre `tetto` ms — lo stesso margine di sicurezza di
    // un'attesa fissa, ma pagato solo quando serve davvero
    const finche = async (cond, tetto, passo = 100) => {
      const fine = Date.now() + tetto
      while (!cond() && Date.now() < fine) await attesa(passo)
      return cond()
    }
    const T = window.__td
    T.inizia(0)
    T.velocita.value = 6
    await attesa(100)
    T.scegliTorre('add')                       // un'operazione aperta ferma il conto
    await attesa(60)
    const ondaConCalcolo = T.hud.onda
    // il conto resta fermo finché il calcolo è aperto: qui non c'è una
    // condizione da sondare (si prova un'ASSENZA di cambiamento), quindi
    // resta un'attesa a tempo — ma 3,5 s bastano lo stesso a smascherare
    // un'onda che ripartisse da sola, senza pagare i 9 s di prima
    await attesa(3500)
    const restaFermo = T.hud.onda === ondaConCalcolo
    const tasti = [...document.querySelectorAll('.tastiera button')]
    T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
    await attesa(120)
    const primaDiAspettare = T.hud.onda
    // la prima tappa lascia 45 secondi di calma, che a velocità 6 sono sette
    // e mezzo: qui la condizione c'è (l'onda che parte da sola), quindi si
    // sonda invece di dormire fino al tetto anche quando parte prima
    const partitaDaSola = await finche(() => T.hud.onda > primaDiAspettare, 9000)
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
    const prezzoNuova = T.costoNuova('add')
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
    const prezzo = T.costoNuova('add')
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
      /* il dito si posa sui pixel dello schermo, non sulle unità del
         campo: da quando c'è una telecamera fra i due, la conversione
         va chiesta al gioco invece di darla per scontata */
      return { torre: T.versoLoSchermo(t.x, t.y), meta: T.versoLoSchermo(liberi[0].x, liberi[0].y),
               dove: { x: liberi[0].x, y: liberi[0].y },
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
             atterrata: Math.hypot(dove.x - posto.dove.x, dove.y - posto.dove.y) < 3 }
  })()

  /* Niente deve debordare. Il banco dei bottoni non c'è più: adesso si
     guardano il campo, che si prende tutta l'arena, e il foglio che sale
     — quando è aperto, perché chiuso sta apposta sotto il bordo. */
  const layout = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    const c = document.querySelector('canvas').getBoundingClientRect()
    T.apriPiazzola(T.liberi()[0])
    await attesa(320)
    const f = document.querySelector('.foglio').getBoundingClientRect()
    const carte = document.querySelector('.carte').getBoundingClientRect()
    T.chiudi()
    return { campoDentro: c.bottom <= innerHeight + 1,
             foglioDentro: f.bottom <= innerHeight + 1,
             carteDentro: carte.bottom <= innerHeight + 1 && carte.top >= 0 }
  })

  console.log(nome, JSON.stringify({ campagna, attesaOndata, veloce, potenziamento, gioco,
                                     conErrore, dito, segni, layout }))
  await page.close()
}

for (const [nome, suoi] of raccolti) errori.push(...suoi.map(e => `[${nome}] ${e}`))
uguale('nessun errore in console', errori.join(' · '), '')
console.log(errori.length ? 'ERRORI:\n' + errori.join('\n') : 'nessun errore JS')
await browser.close()
/* Il grosso di questo file misura e stampa — è roba da guardare, non da
   confrontare con un numero. Quello che invece un guasto lo fa davvero
   passa da `verifica`, e il riassunto è quello che rende rosso il test. */
riassunto('il castello: le misure da guardare')
