/* ═══════════════════════════════════════════════════════════════════
   LA MISSIONE SI VEDE: LA FRECCINA, IL BERSAGLIO, LA CONSEGNA SOPRA
   (docs/sotterraneo/missioni.md, «La freccina» e «Dove sta»)

   perché: la freccina della missione giù: la punta cade sulla retta eroe-bersaglio (misurata con `aSchermo`), il bersaglio più grande e il «?» sul bordo
   a parte perché: semina piani col seme in Node e scende col cheat, una missione per piano; sotterraneo-sopra-missioni parte da una sola semina sul villaggio con tre missioni in mano, e la sua freccina segue la scelta del diario, non un bersaglio messo dove serve

   Chi gioca poco spesso non si ricorda cosa aveva preso tre giorni fa. Giù, attorno all'eroe, una freccina punta verso la
   missione presa e non fatta: il forziere d'oro se sta su questo piano, la scala se è più in basso. La direzione non si crede
   al gioco: si misura sullo schermo (la punta deve cadere sulla retta dall'eroe alla cosa, che la scena 3D mette sullo schermo
   con `aSchermo`). Il bersaglio di una missione in vista è più grande (1,4 volte) e la freccina dice «qui». Sopra, chi aspetta
   una consegna lontano ha il «?» d'oro sul bordo. Quale direzione e quale verso (qui o scala) li dà il motore (`rotta`,
   unita/sotterraneo-missioni); i piani si scelgono qui in Node, col seme, e ci si scende col cheat dell'indirizzo.
   `node test/esegui.mjs sotterraneo-rotta`
   tempo: 100
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, scegli, mondoPronto } from '../aiuto/browser.mjs'
import { viaLaFesta } from '../aiuto/sotterraneo-sopra.mjs'
import { controlla, uguale, dentro, nota, blocco, riassunto } from '../aiuto/verifica.mjs'
import { profiloDelSotterraneo, fermoGiu, aCasa, scendiColCheat, riprendiLaSosta } from '../aiuto/sotterraneo-discesa.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { presePer, PRESA, rotta } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { scrivi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'

const indiceDi = chiave => CAMPAGNA.findIndex(t => t.chiave === chiave)
const TORRE = indiceDi('torre'), CANTINE = indiceDi('cantine')
const DISCESE = TORRE + 1   // tutte le discese fino alla torre sono finite o aperte
const roba = robaAttesa('cavaliere', TORRE, { gemme: 5 })
// la forza dell'eroe atteso è sotto il livello (docs/sotterraneo/forza.md): due livelli in più perché la torre non abbia la sentinella
const crescita = crescitaAttesa('cavaliere', TORRE + 2)
const profilo = (missioni, extra = {}) => profiloDelSotterraneo({ tappa: DISCESE, avventura: { missioni, roba, crescita, ...extra } })

/* ── il piano: un seme dove la cosa non sta troppo vicina né troppo lontana dall'eroe, così si vede la freccina ── */
function scegliIlPiano(chiave, missione, voluto, [min, max]) {
  const i = indiceDi(chiave)
  let meglio = null
  for (let seme = 1; seme < 300; seme++) {
    const c = new Corsa(CAMPAGNA[i], { seme, eroe: 'cavaliere', roba, missioni: presePer({ [missione]: PRESA }, chiave) })
    const r = rotta(c)
    if (r && r.verso === voluto && r.distanza > min && r.distanza < max && (!meglio || r.distanza < meglio.r.distanza))
      meglio = { seme, c, r }
  }
  return meglio
}
// il forziere sta nella stanza più lontana dall'arrivo: il più vicino fra i semi provati è a una dozzina di celle, fuori dallo
// schermo, e la freccina serve proprio a questo
const forziere = scegliIlPiano('cantine', 'collana', 'qui', [4, 20])
const allaScala = scegliIlPiano('torre', 'chiavi', 'scala', [4, 40])
controlla('c\'è un piano della scalinata con la collana non troppo lontana', !!forziere)
controlla('e uno della torre con la scala a pochi passi', !!allaScala)

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const gradi = (da, a) => Math.atan2(a.y - da.y, a.x - da.x) * 180 / Math.PI
// la differenza fra due angoli, in gradi, da 0 a 180
const scarto = (a, b) => Math.abs(((a - b + 540) % 360) - 180)
/* Dove cade sulla pagina la cosa del piano (in celle, a terra), e dove stanno l'attacco della freccina (l'origine della sua rotazione,
   attorno all'eroe) e la sua punta */
async function geometria(cosa) {
  const b = await page.locator('[data-tela="3d"]').boundingBox()
  const [sx, sy] = await page.evaluate(([x, y]) => window.__sotterraneo3d.aSchermo(x, 0.05, y), [cosa.x, cosa.y])
  const anello = await page.locator('[data-rotta]').boundingBox()
  const punta = await page.locator('[data-rotta] i').boundingBox()
  return { anello: { x: anello.x, y: anello.y }, verso: { x: b.x + sx, y: b.y + sy },
           punta: { x: punta.x + punta.width / 2, y: punta.y + punta.height / 2 } }
}
const rottaDice = async k => page.locator('[data-rotta]').getAttribute(k)
const giuConLaMissione = async (missioni, i, seme) => {
  await aCasa(page)
  await semina(page, profilo(missioni))
  await scendiColCheat(page, `sotterraneo=${i}&seme=${seme}&torcia=accesa&dpr=1`)
  await page.waitForSelector('[data-rotta]', { state: 'attached', timeout: 5000 })
  await fermoGiu(page)
}

/* ---------- giù, verso il forziere d'oro della collana ---------- */
await blocco('la freccina verso il forziere', async () => {
  await giuConLaMissione({ collana: 'presa' }, CANTINE, forziere.seme)
  uguale('la freccina c\'è, e segue la collana', await rottaDice('data-missione-rotta'), 'collana')
  uguale('il forziere è su questo piano: «qui»', await rottaDice('data-verso'), 'qui')
  controlla('la riga in cima dice di cercare il forziere d\'oro',
            (await page.locator('[data-promemoria] li[data-segui]').innerText()).includes('cerca il forziere d\'oro'))
  const g = await geometria(forziere.r)
  const voluto = gradi(g.anello, g.verso)
  dentro('la freccina guarda il forziere (scarto in gradi)', scarto(Number(await rottaDice('data-gradi')), voluto), 0, 2)
  dentro('e la sua punta sta sulla stessa retta, attorno all\'eroe', scarto(gradi(g.anello, g.punta), voluto), 0, 4)
  dentro('a pochi passi dall\'eroe, non sul bordo dello schermo', Math.hypot(g.punta.x - g.anello.x, g.punta.y - g.anello.y), 30, 90)
  nota(`forziere a ${forziere.r.distanza.toFixed(1)} celle, a ${Math.round(voluto)}°; la punta a ${Math.round(gradi(g.anello, g.punta))}°`)
  uguale('non intralcia il dito: la freccina non prende i tocchi', await page.locator('[data-rotta]').evaluate(e => getComputedStyle(e).pointerEvents), 'none')
  await scatto(page, 'rotta-forziere')
})

/* ---------- giù, la missione è più in basso: la freccina punta alla scala ---------- */
await blocco('la freccina verso la scala', async () => {
  await giuConLaMissione({ chiavi: 'presa' }, TORRE, allaScala.seme)
  uguale('la freccina segue le chiavi', await rottaDice('data-missione-rotta'), 'chiavi')
  uguale('sono al terzo piano: «scala»', await rottaDice('data-verso'), 'scala')
  controlla('la riga in cima dice di scendere: «al terzo piano: scendi»',
            /è al terzo piano: scendi/.test(await page.locator('[data-promemoria] li[data-segui]').innerText()),
            await page.locator('[data-promemoria]').innerText())
  const scala = allaScala.c.livello.robe.find(r => r.che === 'scala')
  const g = await geometria({ x: scala.x + 0.5, y: scala.y + 0.5 })
  const voluto = gradi(g.anello, g.verso)
  // la scala è a trentatré celle, fuori dallo schermo: la prospettiva schiaccia la profondità e la direzione sullo schermo si scosta di
  // qualche grado da quella della mappa; la freccina dice la direzione, non la strada
  dentro('la freccina guarda la scala (scarto in gradi)', scarto(Number(await rottaDice('data-gradi')), voluto), 0, 8)
  dentro('e la sua punta sta sulla stessa retta', scarto(gradi(g.anello, g.punta), voluto), 0, 8)
  nota(`scala a ${allaScala.r.distanza.toFixed(1)} celle, a ${Math.round(voluto)}°`)
  await scatto(page, 'rotta-scala')
  // una cosa aperta (lo zaino) nasconde la freccina: è dentro il campo, non sopra un foglio
  await page.click('[data-azione="zaino"]')
  await page.waitForSelector('[data-zaino]', { timeout: 3000 })
  uguale('con lo zaino aperto la freccina non c\'è', await page.locator('[data-rotta]').count(), 0)
  await page.click('[data-azione="chiudi"]')
  await page.waitForSelector('[data-rotta]', { state: 'attached', timeout: 3000 }).catch(() => {})
  uguale('e chiuso torna', await page.locator('[data-rotta]').count(), 1)
})

/* ---------- il bersaglio di una missione in vista: più grande, e la freccina dice «qui» ----------
   L'aura e il nome sono disegnati nella scena WebGL, che non si rilegge (si guardano con `--scatti`): si misura la grandezza
   della figura (`statoDi(...).alto`) con la missione e, un attimo dopo, senza. La sosta mette l'eroe a due celle dal goblin */
await blocco('il bersaglio in vista', async () => {
  const m = new Corsa(CAMPAGNA[TORRE], { seme: 11, eroe: 'cavaliere', roba, missioni: presePer({ goblin: PRESA }, 'torre') })
  const g = m.livello.robe.find(r => r.missione === 'goblin')
  let accanto = null
  for (const d of [-2, 2, -3, 3]) if (m.livello.calpestabile(g.x + d, g.y)) { accanto = { x: g.x + d, y: g.y }; break }
  m.eroe = { x: accanto.x + 0.5, y: accanto.y + 0.5 }
  m.aggiornaLuce()
  await riprendiLaSosta(page, profiloDelSotterraneo({ tappa: TORRE, avventura: { roba, missioni: { goblin: 'presa' }, sosta: scrivi(m, TORRE) } }))
  const colorato = await page.evaluate(() => { const S = window.__sotterraneo3d, r = S.corsa.livello.robe.find(q => q.missione === 'goblin'); return S.statoDi(r).alto })
  const normale = await page.evaluate(async () => {
    const S = window.__sotterraneo3d, r = S.corsa.livello.robe.find(q => q.missione === 'goblin'), m = r.missione
    r.missione = null
    // la scena ridisegna la figura a ogni fotogramma, e cresce o cala morbida: si aspetta che smetta
    let a = S.statoDi(r).alto
    for (let i = 0; i < 40; i++) { await new Promise(f => setTimeout(f, 100)); const b = S.statoDi(r).alto; if (Math.abs(b - a) < 1e-3 && i > 2) break; a = b }
    r.missione = m
    return a
  })
  controlla('in vista il bersaglio è più grande: 1,4 volte la sua figura normale', colorato > normale * 1.25 && colorato < normale * 1.55, `${colorato} contro ${normale}`)
  uguale('la freccina lo indica', await rottaDice('data-verso'), 'qui')
  await scatto(page, 'bersaglio-in-vista')
})

/* ---------- sopra: chi aspetta una consegna lontano ha il «?» d'oro sul bordo ---------- */
await blocco('la consegna sopra', async () => {
  await aCasa(page)
  await semina(page, profilo({ badessa: 'fatta', rosicchione: 'presa' }))
  await viaLaFesta(page)
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
  await page.waitForSelector('[data-consegna-fuori="eremita"]', { timeout: 5000 }).catch(() => {})
  uguale('chi aspetta la consegna è lontano: il «?» d\'oro sul bordo', await page.locator('[data-consegna-fuori="eremita"]').count(), 1)
  await scatto(page, 'rotta-consegna-fuori')
})

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('la missione si vede: la freccina, il bersaglio, la consegna sopra')
