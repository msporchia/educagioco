/* ═══════════════════════════════════════════════════════════════════
   PORTE, SCALE E USCITE DEL SOTTERRANEO, COL DITO
   (docs/sotterraneo/grafica-3d.md «I fogli sono un velo» e «Uscire dal 3D», docs/sotterraneo/scala-che-sale.md,
   docs/sotterraneo/dungeon-che-si-rigenerano.md, il tasto «salta» di docs/core/comandi.md)


   perché: la porta che chiede, la scala che sale e l'uscita dal primo piano, l'uscita dal 3D svenendo, e un dungeon ripulito che si rigenera
   a parte perché: parte da una sosta scritta in Node e da una discesa dal cheat, non dal portale; la ripresa col gemello sta in sotterraneo-portale
   Una porta: il foglio della domanda è un velo (la telecamera non si sposta né cambia zoom, aprendolo o chiudendolo), il tasto
   «salta» la apre e paga senza lasciare altro nel profilo, e toccata col dito l'eroe ci va e lei chiede. La scala che sale, da
   una sosta scritta in Node: toccata apre il suo foglio, porta al piano di sopra e la sosta lo scrive; dal primo piano è
   l'uscita, col foglio di «lascio perdere». Si esce dal 3D senza errori anche svenendo all'ultima occasione; e un dungeon del
   mondo ripulito scrive un rifatti in più, e rientrando è un altro. Dove si ricompare, cosa resta del piano e quale seme ha
   un dungeon lo dicono le unità (`sotterraneo-scala-su`, `-sosta`, `-rigenera`, `salto`): qui il dito, lo schermo e il
   salvataggio riletto.
   `node test/esegui.mjs sotterraneo-porte-scale`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, seminaArchivio, scatto, attendi, leggiProfilo, ditoDi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, blocco, riassunto } from '../aiuto/verifica.mjs'
import { ROBA_NUDA, profiloDelSotterraneo, giuPronto, fermoGiu, cellaGiu, schermoDi, toccaLaCella, nelCampo, eroeIn, aCasa, scendiColCheat,
         riprendiLaSosta } from '../aiuto/sotterraneo-discesa.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { semeDelDungeon } from '../../src/giochi/sotterraneo/motore/rigenera.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const { tocca, toccaIl } = await ditoDi(page)
const piede = async () => (await page.locator('.sot-piede').innerText()).replace(/\s+/g, ' ')
const avventura = async () => (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere
// sopra: il mondo di sopra, nessuna tela della discesa rimasta, e la console pulita (il ciclo di disegno che continuava dopo aver
// buttato il piano dava «O is null»)
async function sopra(chi) {
  await page.waitForSelector('[data-mondo3d]', { timeout: 60000 })
  await page.waitForSelector('[data-tela="3d"]', { state: 'detached', timeout: 5000 }).catch(() => {})
  uguale(`${chi}: si arriva sopra, senza la discesa in 3D`, await page.locator('[data-tela="3d"]').count(), 0)
  await attendi(page, 300)   // qualche fotogramma di sopra, dove un pittore rimasto agganciato si rompeva
  uguale(`${chi}: nessun errore in console`, errori.splice(0).join(' | '), '')
}

// la leva del «salta» (da `#admin`): la sua chiave in archivio
await seminaArchivio(page, 'tasto-salta', { acceso: true })
await semina(page, profiloDelSotterraneo({ tappa: 1, avventura: { roba: { ...ROBA_NUDA, gemme: 60, mano: 'spada', corpo: 'corazza' } } }))

/* ---------- una porta: il foglio è un velo, e «salta» la apre e paga ----------
   Il foglio si apre dal motore, con l'eroe fermo: si misura dove cade a schermo la cella dell'eroe e un punto a tre celle prima,
   con la domanda aperta e dopo. Il pixel ratio fisso: quello che si adatta ai fotogrammi lenti cambierebbe la scala da sé */
const SCENA = 'sotterraneo=0&seme=11&torcia=accesa&dpr=1'
const dove = () => page.evaluate(() => {
  const s3 = window.__sotterraneo3d, e = s3.corsa.eroe
  return [...s3.aSchermo(e.x, 0, e.y), ...s3.aSchermo(e.x + 3, 0, e.y - 2)]
})
const scarto = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))
await blocco('il foglio della porta è un velo, e «salta» la apre e paga', async () => {
  await scendiColCheat(page, SCENA)
  await fermoGiu(page)
  const prima = await dove()
  const p = await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, p = c.livello.robe.find(r => r.che === 'porta' && !r.aperta)
    c.interagisci(p)
    return { x: p.x, y: p.y }
  })
  await page.waitForSelector('.sot-foglio .sot-domanda .qz-tasto', { timeout: 10000 })
  await attendi(page, 450)   // la domanda è cieca 320 ms, e il foglio arriva
  const durante = await dove()
  await scatto(page, 'sotterraneo-3d-fogli-domanda')
  const salta = page.locator('.sot-domanda [data-azione="salta"]')
  controlla('la domanda della porta ha il suo «salta»', await salta.isVisible())
  const foto = async () => {
    const q = (await leggiProfilo(page)) || {}
    const { monete, ...totals } = q.totals || {}   // quanto è entrato nel salvadanaio sale col salto, come le monete
    return { resto: JSON.stringify({ items: q.items || {}, totals, best: q.best || {} }), coins: q.coins || 0 }
  }
  const f0 = await foto()
  await salta.click()
  await page.waitForSelector('.sot-domanda', { state: 'detached', timeout: 5000 }).catch(() => {})
  uguale('saltata, la domanda se ne va', await page.locator('.sot-domanda').count(), 0)
  uguale('e la porta è aperta', await page.evaluate(([x, y]) => window.__sotterraneo3d.corsa.livello.robe.some(r => r.che === 'porta' && r.x === x && r.y === y && r.aperta), [p.x, p.y]), true)
  const f1 = await foto()
  uguale('né ripasso, né contatori, né record: il resto del profilo è identico', f1.resto, f0.resto)
  controlla('e la porta ha pagato come una giusta', f1.coins > f0.coins, `${f0.coins} → ${f1.coins}`)
  await fermoGiu(page)
  const dopo = await dove()
  nota(`a schermo: prima ${prima.map(Math.round)}, con la domanda ${durante.map(Math.round)}, dopo ${dopo.map(Math.round)}`)
  dentro('con la domanda aperta la scena non si muove (px)', scarto(prima, durante), 0, 0.5)
  dentro('e chiusa nemmeno', scarto(prima, dopo), 0, 0.5)
})

/* ---------- la porta toccata col dito: l'eroe ci va, lei chiede, e rispondendo giusto si apre ----------
   L'eroe parte a tre passi dalla porta, sulla strada (il salto delle prove), con la torcia accesa che la illumina */
await blocco('la porta toccata col dito', async () => {
  await scendiColCheat(page, SCENA)
  const p = await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, liv = c.livello
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    const prima = new Map([[da.x + ',' + da.y, null]]), coda = [da]
    for (let i = 0; i < coda.length; i++) {
      const q = coda[i]
      const p = liv.robe.find(r => r.che === 'porta' && !r.aperta && r.x === q.x && r.y === q.y)
      if (p) {
        const via = []; for (let k = q.x + ',' + q.y; k; k = prima.get(k)) via.unshift(k.split(',').map(Number))
        const [x, y] = via[Math.max(0, via.length - 4)]
        c.eroe = { x: x + 0.5, y: y + 0.5 }; c.strada = []; c.segnaLaStanza(); c.aggiornaLuce()
        return { x: p.x, y: p.y, passi: via.length - 1 - Math.max(0, via.length - 4) }
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = q.x + dx, y = q.y + dy
        if (liv.calpestabile(x, y) && !prima.has(x + ',' + y)) { prima.set(x + ',' + y, q.x + ',' + q.y); coda.push({ x, y }) }
      }
    }
    return null
  })
  controlla('nella prima discesa c\'è una porta chiusa, e l\'eroe è a qualche passo', !!p && p.passi >= 2, JSON.stringify(p))
  await fermoGiu(page)
  const q = await schermoDi(page, p.x + 0.5, p.y + 0.5, 0.6)
  controlla('la porta è nel campo', nelCampo(q), JSON.stringify(q))
  await scatto(page, 'sotterraneo-3d-verso-la-porta')
  await tocca(q.x, q.y)
  await page.waitForSelector('.sot-foglio .sot-domanda .qz-tasto', { timeout: 15000 })
  controlla('toccata la porta, l\'eroe ci è andato e la porta chiede', (await page.locator('.sot-foglio h2').innerText()).includes('porta'))
  await scatto(page, 'sotterraneo-3d-porta')
  await attendi(page, 400)   // la domanda è cieca 320 ms
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
  await page.waitForFunction(([x, y]) => window.__sotterraneo3d.corsa.livello.robe.some(r => r.che === 'porta' && r.x === x && r.y === y && r.aperta), [p.x, p.y], { timeout: 8000 }).catch(() => {})
  uguale('rispondendo giusto la porta si apre', await page.evaluate(([x, y]) => window.__sotterraneo3d.corsa.livello.robe.some(r => r.che === 'porta' && r.x === x && r.y === y && r.aperta), [p.x, p.y]), true)
})

/* ---------- la scala che sale, da una sosta scritta in Node ----------
   La torre (tre piani): il primo piano col mostro battuto, e la sosta al secondo, sulla scala che sale. Dove si ricompare lo dice
   il motore, rileggendo la sosta come farà il gioco */
const TORRE = CAMPAGNA.findIndex(t => t.chiave === 'torre')
const roba = robaAttesa('cavaliere', TORRE, { gemme: 5 })
const giu = c => c.livello.robe.find(r => r.che === 'scala')
const su = c => c.livello.robe.find(r => r.che === 'scala-su')
const cella = c => ({ x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) })
const nuova = () => new Corsa(CAMPAGNA[TORRE], { seme: 11, eroe: 'cavaliere', roba })
const dellaTorre = sosta => profiloDelSotterraneo({ tappa: TORRE, avventura: { roba, sosta } })

await blocco('la scala che sale', async () => {
  const sotto = nuova()
  sotto.livello.robe.find(r => r.che === 'mostro' && !r.chiave).morto = true
  sotto.chiaveDelPiano = true
  sotto.interagisci(giu(sotto)); sotto.scendi()
  const salita = scrivi(sotto, TORRE), scalaSu = cella(sotto)
  const prova = leggi(salita, CAMPAGNA[TORRE], roba)
  prova.interagisci(su(prova)); prova.sali()
  const attesa = cella(prova), scalaGiu = { x: giu(prova).x, y: giu(prova).y }

  await riprendiLaSosta(page, dellaTorre(salita))
  controlla('si è al secondo piano', (await piede()).includes('piano 2 di 3'), await piede())
  uguale('dove la scala che sale c\'è', await cellaGiu(page), `${scalaSu.x},${scalaSu.y}`)
  await fermoGiu(page)
  await toccaLaCella(page, tocca, scalaSu.x, scalaSu.y, 0.4)
  await page.waitForSelector('[data-azione="sali"]', { timeout: 5000 })
  controlla('il foglio dice a che piano si torna', (await page.locator('[data-azione="sali"]').innerText()).includes('piano 1'))
  uguale('non è l\'uscita: niente «lascio perdere»', await page.locator('[data-lascio-perdere]').count(), 0)
  await scatto(page, 'scala-su-foglio')
  await attendi(page, 400)   // il foglio è cieco 320 ms
  await page.locator('[data-azione="dopo"]').click()
  await page.waitForSelector('[data-azione="sali"]', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('«resto qui» chiude il foglio', await page.locator('[data-azione="sali"]').count(), 0)
  controlla('e si resta al secondo piano', (await piede()).includes('piano 2 di 3'), await piede())
  await toccaLaCella(page, tocca, scalaSu.x, scalaSu.y, 0.4)
  await page.waitForSelector('[data-azione="sali"]', { timeout: 5000 })
  await attendi(page, 400)
  await page.locator('[data-azione="sali"]').click()
  await page.waitForFunction(() => document.querySelector('.sot-piede')?.innerText.includes('piano 1 di 3'), null, { timeout: 8000 }).catch(() => {})
  controlla('salendo si è al primo piano', (await piede()).includes('piano 1 di 3'), await piede())
  await eroeIn(page, `${attesa.x},${attesa.y}`)
  uguale('accanto alla scala che scende, dove dice il motore', await cellaGiu(page), `${attesa.x},${attesa.y}`)
  await scatto(page, 'scala-su-risalito')
  const s = (await avventura())?.sosta
  uguale('la sosta riletta dice che si è al primo piano', s?.piano, 0)
  uguale('col secondo alle spalle', s?.dietro?.map(d => d.p).join(), '1')
  // si riscende toccando la scala che scende, e si ricompare sulla scala che sale
  await fermoGiu(page)
  await toccaLaCella(page, tocca, scalaGiu.x, scalaGiu.y, 0.4)
  await page.waitForSelector('[data-azione="scendi"]', { timeout: 8000 })
  await attendi(page, 400)
  await page.locator('[data-azione="scendi"]').click()
  await page.waitForFunction(() => document.querySelector('.sot-piede')?.innerText.includes('piano 2 di 3'), null, { timeout: 8000 }).catch(() => {})
  controlla('riscendendo si torna al secondo', (await piede()).includes('piano 2 di 3'), await piede())
  await eroeIn(page, `${scalaSu.x},${scalaSu.y}`)
  uguale('e si ricompare sulla scala che sale', await cellaGiu(page), `${scalaSu.x},${scalaSu.y}`)
})

/* ---------- dal primo piano la scala è l'uscita, col foglio di «lascio perdere» (mai un modo gratis di saltare il portale) ---------- */
await blocco('dal primo piano la scala è l\'uscita', async () => {
  const primo = nuova(), nascita = cella(primo)
  await riprendiLaSosta(page, dellaTorre(scrivi(primo, TORRE)))
  controlla('al primo piano', (await piede()).includes('piano 1 di 3'), await piede())
  await fermoGiu(page)
  await toccaLaCella(page, tocca, nascita.x, nascita.y, 0.4)
  await page.waitForSelector('[data-lascio-perdere]', { timeout: 5000 })
  uguale('è il foglio di «lascio perdere», non una scorciatoia', await page.locator('[data-azione="sali"]').count(), 0)
  const frase = await page.locator('[data-lascio-perdere]').innerText()
  controlla('che dice che la roba resta e la discesa ricomincia da capo', /resta tutto tuo/.test(frase) && /ricomincia da capo/.test(frase), frase)
  await scatto(page, 'scala-su-primo-piano')
  await attendi(page, 400)
  await page.locator('[data-lascio-perdere] [data-azione="scorda-no"]').click()
  await page.waitForSelector('[data-lascio-perdere]', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('«no, tengo la discesa»: il foglio se ne va', await page.locator('[data-lascio-perdere]').count(), 0)
  uguale('e si resta giù', await page.locator('[data-tela="3d"]').count(), 1)
  await toccaLaCella(page, tocca, nascita.x, nascita.y, 0.4)
  await page.waitForSelector('[data-lascio-perdere] [data-azione="scorda-si"]', { timeout: 5000 })
  await toccaIl('[data-lascio-perdere] [data-azione="scorda-si"]')
  await sopra('dalla scala che sale')
  uguale('sul mondo di sopra non c\'è la carta per tornare giù', await page.locator('[data-ripresa]').count(), 0)
  uguale('e la discesa è buttata', (await avventura())?.sosta ?? null, null)
})

/* ---------- svenuti all'ultima occasione: il cartello di fine, «esci», e si torna su ----------
   Le occasioni prima dell'ultima si spendono nel motore (ci si rialza all'ingresso, sempre giù); l'ultima col dito */
await blocco('svenuti all\'ultima occasione', async () => {
  await aCasa(page)
  await semina(page, profiloDelSotterraneo({ tappa: 1, avventura: { roba: { ...ROBA_NUDA, corpo: 'corazza' } } }))
  await scendiColCheat(page, 'sotterraneo=1&seme=11&stanza=sala')
  const prove = await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa
    let n = 0
    for (; n < 12; n++) { c.svieni(); if (c.foglio.ultimo) break; c.riprendi() }
    return n
  })
  controlla('si arriva all\'ultima occasione', prove < 12, String(prove))
  await page.waitForSelector('[data-azione="riprendi"]', { timeout: 10000 })
  await toccaIl('[data-azione="riprendi"]')
  await page.waitForSelector('[data-fine="esci"]', { timeout: 10000 })
  await toccaIl('[data-fine="esci"]')
  await sopra('dallo svenimento')
})

/* ---------- un dungeon del mondo ripulito si rifà (docs/sotterraneo/dungeon-che-si-rigenerano.md) ----------
   Il cerchio di pietre col cheat (`#sotterraneo=cerchio`, senza `&seme=`: il seme è quello della volta): il grosso battuto nel
   motore, la scala in fondo e «esco dal sotterraneo» toccati col dito. La storia non si muove */
await blocco('ripulito, il dungeon si rifà', async () => {
  await aCasa(page)
  await semina(page, profiloDelSotterraneo({ tappa: 1, avventura: { roba: { ...ROBA_NUDA, mano: 'spada', mancina: 'scudo-ferro', corpo: 'corazza' } } }))
  await scendiColCheat(page, 'sotterraneo=cerchio&eroe=cavaliere&piano=3')
  uguale('la prima volta, il seme della volta 0', await page.evaluate(() => window.__sotterraneo3d.corsa.seme), semeDelDungeon('cavaliere', 'cerchio', 0, 1))
  const g = await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa
    const grosso = c.livello.robe.find(r => r.che === 'mostro' && r.grosso)
    grosso.morto = true
    c.chiaveDelPiano = true
    c.allaScala()
    return { piano: c.piano, grosso: grosso.grosso }
  })
  uguale('sull\'ultimo piano, col grosso di Roccaverde battuto', `${g.piano}|${g.grosso}`, '2|barbamuschio')
  await page.waitForSelector('[data-azione="scendi"]', { timeout: 10000 })
  await toccaIl('[data-azione="scendi"]')
  await page.waitForSelector('[data-fine="ancora"]', { timeout: 15000 })
  // la prima discesa vinta senza svenire è un traguardo (components/Traguardo.vue): il suo velo si chiude toccandolo
  await page.waitForSelector('.velo', { timeout: 3000 }).catch(() => {})
  if (await page.locator('.velo').count()) { await attendi(page, 400); await toccaIl('.velo') }
  await page.waitForSelector('.velo', { state: 'detached', timeout: 10000 })
  await toccaIl('[data-fine="ancora"]')
  await page.waitForSelector('[data-mondo3d]', { timeout: 15000 })
  const av = await avventura()
  uguale('ripulito: il mondo scrive un rifatti in più', av?.mondo?.dungeon?.cerchio?.rifatti, 1)
  uguale('la storia non si muove', `${av?.tappa}|${JSON.stringify(av?.stelle)}`, `1|${JSON.stringify({ 0: 3 })}`)
  await scendiColCheat(page, 'sotterraneo=cerchio&eroe=cavaliere')
  uguale('rientrando è un altro: il seme della volta 1', await page.evaluate(() => window.__sotterraneo3d.corsa.seme), semeDelDungeon('cavaliere', 'cerchio', 1, 1))
  await scatto(page, 'sotterraneo-rigenera-altra')
})

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('porte, scale e uscite del sotterraneo, col dito')
