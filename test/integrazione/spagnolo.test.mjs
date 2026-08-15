/* ═══════════════════════════════════════════════════════════════════
   ESPAÑOL, NEL BROWSER
     node test/esegui.mjs spagnolo         (la build la fa il lanciatore)

   Quattro cose che i test unitari non possono dire:
     · in home c'è la carta dello spagnolo, e sta accanto a quella inglese
     · la mappa apre una tappa alla volta
     · giocando davvero la tappa si supera, paga, e resta superata anche
       dopo aver richiuso il gioco
     · le due lingue non si toccano: giocare in spagnolo non fa avanzare
       la campagna di English, e la voce che parla è quella spagnola
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, leggiProfilo,
         TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/data/campagna-spagnolo.js'
import { PAROLE_ES } from '../../src/data/parole-es.js'

const browser = await apriBrowser()

/* Si spegne la sintesi del dispositivo e si segna ogni fettina di sprite
   suonata: sono le due cose da sapere sulla voce, e non si vedono dal DOM. */
const spia = page => page.addInitScript(() => {
  window.__parlato = []
  Object.defineProperty(window, 'speechSynthesis', {
    value: { getVoices: () => { window.__sintesi = true; return [] }, cancel() {},
             speak() { window.__sintesi = true } },
    configurable: true,
  })
  const start = window.AudioBufferSourceNode.prototype.start
  window.AudioBufferSourceNode.prototype.start = function (quando, offset, durata) {
    if (durata !== undefined) window.__parlato.push({ offset, durata })
    return start.apply(this, arguments)
  }
})

const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await spia(page)
await azzera(page)

/* ---------- 1. la home ---------- */
uguale('in home c’è la carta dello spagnolo', await page.locator('.carta.esp').count(), 1)
uguale('e quella inglese è rimasta al suo posto', await page.locator('.carta.eng').count(), 1)
/* `i` è cosa insegna e non cambia mai, `.modo` è come si gioca più dove
   sei arrivato: due righe, due cose diverse */
const insegna = await page.locator('.carta.esp i').textContent()
controlla('la carta dice cosa si impara', /parole, verbi e frasi/.test(insegna), insegna)
const inHome = await page.locator('.carta.esp .modo').textContent()
controlla('la carta dice a che tappa si è', /tappa 1 di 13/.test(inHome), inHome)

/* ---------- 2. la mappa ---------- */
await page.locator('.carta.esp').click()
await page.waitForSelector('.tappa', { timeout: 5000 })
uguale('ci sono tutte le tappe', await page.locator('.tappa').count(), CAMPAGNA.length)
uguale('solo la prima è aperta', await page.locator('.tappa:not(.chiusa)').count(), 1)

/* ---------- 3. una tappa giocata davvero ---------- */
await page.locator('.tappa').first().click()
await attendi(page, 400)

const primo = await page.evaluate(() => ({
  fase: window.__es.fase.value,
  lingua: window.__es.lingua,
  tipo: window.__es.turno.value.tipo,
  chiave: window.__es.turno.value.chiave,
  opzioni: window.__es.turno.value.opzioni.length,
}))
uguale('si entra nel gioco', primo.fase, 'gioco')
uguale('ed è davvero lo spagnolo', primo.lingua, 'es')
uguale('la prima tappa comincia dalle figure', primo.tipo, 'figura')
controlla('e chiede una parola spagnola', primo.chiave.startsWith('es:'), primo.chiave)
uguale('con sei figure fra cui scegliere', primo.opzioni, 6)
uguale('e sullo schermo ci sono davvero', await page.locator('.scelte.figure .scelta').count(), 6)

/* si risponde sempre giusto, aspettando che il turno cambi: fra una
   risposta e l'altra il gioco fa vedere l'esito, e correre di più
   vorrebbe dire misurare la propria fretta invece del gioco */
const partita = await page.evaluate(async () => {
  const g = window.__es
  const bersaglio = g.tappa.value.bersaglio
  let turni = 0
  while (g.fase.value === 'gioco' && turni < 120) {
    turni++
    const prima = g.turno.value
    g.rispondi(g.giusta())
    for (let i = 0; i < 60 && g.turno.value === prima && g.fase.value === 'gioco'; i++)
      await new Promise(r => setTimeout(r, 50))
  }
  return { turni, fase: g.fase.value, bersaglio, giuste: g.hud.giuste,
           tappa: g.progresso.value.tappa }
})
uguale('la tappa si supera', partita.fase, 'vinta')
controlla('centrando il bersaglio', partita.giuste >= partita.bersaglio,
          `${partita.giuste} giuste su ${partita.bersaglio}`)
uguale('e la tappa dopo si apre', partita.tappa, 1)
uguale('con il premio in monete', await page.locator('.finale .premio').count(), 1)
nota(`tappa superata in ${partita.turni} turni`)

/* ---------- 4. le due lingue non si mescolano ----------
   È la ragione per cui lo spagnolo ha chiavi sue: un bambino che sa
   `perro` non ha imparato `dog`, e la campagna inglese non deve
   muoversi di un passo per una partita giocata in spagnolo. */
await page.locator('.finale .grosso.chiaro').click()      // torna alla mappa
await page.waitForSelector('.tappa')
const p = await leggiProfilo(page)
uguale('la campagna inglese non si è mossa', p.eng.tappa, 0)
uguale('mentre quella spagnola sì', p.esp.tappa, 1)
uguale('le risposte non sono finite nel contatore inglese', p.totals.en, 0)
controlla('ma in quello spagnolo', p.totals.es > 0, String(p.totals.es))
controlla('e le chiavi imparate sono tutte spagnole',
          Object.keys(p.items).every(k => /^(es:|verbo-es:|frase-es:)/.test(k)),
          Object.keys(p.items).filter(k => !/^(es:|verbo-es:|frase-es:)/.test(k)).join(', '))

/* ---------- 5. la voce ---------- */
controlla('non si usa speechSynthesis', !(await page.evaluate(() => !!window.__sintesi)))

/* Il testo si toglie quando la parola è saputa: a un bambino che ha appena
   incontrato `manzana` il gioco la mostra scritta, a uno che la conosce
   gliela fa solo sentire. Forza 3 e non 6: a 4 il motore le considera
   imparate e le manda fuori dal giro fino al ripasso. */
const CIBO = PAROLE_ES.filter(w => w[3] === 'f').map(w => 'es:' + w[0])
const forte = { s: 3, ok: 5, err: 0, last: Date.now(), seen: 5, t: 0 }
await semina(page, {
  esp: { tappa: 1, libera: false },
  items: Object.fromEntries(CIBO.map(k => [k, { ...forte }])),
})
await spia(page)
await page.locator('.carta.esp').click()
await page.waitForSelector('.tappa')
await page.locator('.tappa').nth(1).click()              // la seconda tappa: il cibo
await attendi(page, 400)

const ascolto = await page.evaluate(async () => {
  const g = window.__es
  let dopoTurno = -1, turni = 0
  for (let i = 0; i < 25; i++) {
    if (g.turno.value.domanda.ascolta) {
      await new Promise(r => setTimeout(r, 600))         // deve suonare da sola
      dopoTurno = window.__parlato.length
      break
    }
    turni++
    const prima = g.turno.value
    window.__parlato = []                    // si azzera PRIMA: quello che conta
    g.rispondi(g.giusta())                   // è ciò che suona il turno nuovo
    for (let j = 0; j < 60 && g.turno.value === prima && g.fase.value === 'gioco'; j++)
      await new Promise(r => setTimeout(r, 50))
    if (g.fase.value !== 'gioco') break
  }
  if (dopoTurno < 0) return { trovato: false, turni }
  return { trovato: true, turni, dopoTurno }
})
if (controlla('a parole già sapute il gioco toglie il testo e le fa sentire',
              ascolto.trovato, `${ascolto.turni} turni senza mai un ascolto`)) {
  controlla('la parola spagnola si sente da sola a inizio turno', ascolto.dopoTurno > 0)
  nota(`primo ascolto dopo ${ascolto.turni} turni`)
}

/* ---------- 6. i progressi restano ---------- */
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
const dopo = await page.locator('.carta.esp .modo').textContent()
const numero = Number((dopo.match(/tappa (\d+)/) || [])[1])
controlla('riaprendo il gioco le tappe superate sono ancora aperte', numero >= 2, dopo)

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Español nel browser')
