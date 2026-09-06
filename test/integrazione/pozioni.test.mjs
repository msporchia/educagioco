/* ═══════════════════════════════════════════════════════════════════
   IL LABORATORIO DELLE POZIONI, GIOCATO DAVVERO
     node test/integrazione/pozioni.test.mjs   (dopo `npm run build`)

   Il test di unità dice che le ricette sono possibili. Qui si guarda
   quello che solo il gioco vero può dire:
     · dalla home ci si arriva, e col tasto ‹ si torna indietro
     · la campagna è chiusa e si apre una tappa per volta
     · i tre gesti (versa, pesa, taglia) portano davvero a una pozione
     · il cliente esigente lascia la mancia, e la mancia ridà un cuore
     · sbagliare per eccesso fa 💥 ma non costa un cuore
     · quello che si è fatto finisce nel profilo: contatori e motore
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto,
         TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. dalla home si entra, e si arriva alla mappa ---------- */
await page.getByText('Il laboratorio delle pozioni').click()
await page.waitForSelector('.lab', { timeout: 5000 })
const intro = await page.evaluate(() => document.body.innerText)
controlla('la mappa spiega il gioco', /litri|La bilancia/i.test(intro))

const quante = await page.locator('.tappa').count()
uguale('le undici tappe sono in mappa', quante, 11)
uguale('solo la prima è aperta', await page.locator('.tappa.chiusa').count(), quante - 1)
controlla('il laboratorio libero non c\'è ancora',
          await page.locator('.tappa.libera').count() === 0)
/* una tappa chiusa non si apre a forza: è la promessa della campagna */
await page.locator('.tappa[data-tappa="righello"]').click()
await page.waitForTimeout(150)
uguale('una tappa chiusa non parte', await page.evaluate(() => window.__poz.fase.value), 'mappa')

/* la barra è quella comune: il tasto per uscire sta sempre nello stesso posto */
uguale('c\'è un solo tasto per tornare indietro',
       await page.locator('button[aria-label="indietro"]').count(), 1)
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte', { timeout: 5000 })
await page.getByText('Il laboratorio delle pozioni').click()
await page.waitForSelector('.lab', { timeout: 5000 })

/* ---------- 2. il cartellone delle misure ---------- */
await page.locator('button[title="scala delle misure"]').click()
await page.waitForSelector('.cartellone', { timeout: 3000 })
const muro = await page.evaluate(() => document.querySelector('.cartellone').innerText)
controlla('il cartellone mostra le tre famiglie di unità',
          /Lunghezza/.test(muro) && /Massa/.test(muro) && /Capacità/.test(muro))
controlla('e non scrive il fattore fra le due unità in gioco', !/×100|×1000/.test(muro),
          muro.split('\n').find(r => /×/.test(r)))
await page.locator('.cartellone .bottone').click()

/* ---------- 3. la prima tappa, giocata fino in fondo ----------
   Si gioca dall'API del gioco e non a colpi di dito: interessa che il
   giro completo funzioni, non che il dito arrivi (quello lo dicono già
   i test del castello). Ogni gesto però è quello vero: si sceglie
   l'attrezzo, si dosa e si conferma. */

/* Fra un ingrediente e l'altro il banco resta occupato: l'esito va mostrato,
   e a pozione finita il cliente successivo arriva dopo un secondo. Aspettare
   a tempo vorrebbe dire dosare nel vuoto, quindi si aspetta il banco. */
const giocaTappa = (max = 40) => page.evaluate(async (max) => {
  const P = window.__poz
  const dormi = ms => new Promise(r => setTimeout(r, ms))
  const pronto = async () => {
    for (let n = 0; n < 80; n++) {
      if (P.fase.value !== 'gioco') return false
      if (P.ing.value && !P.ing.value.fatto && !P.esito.value) return true
      await dormi(50)
    }
    return false
  }
  const gesti = new Set(), scale = [], mance = []
  let ingredienti = 0

  for (let giro = 0; giro < max && P.fase.value === 'gioco'; giro++) {
    if (!await pronto()) break
    const r = P.ricetta.value
    const ultimo = r.ingredienti.filter(x => !x.fatto).length === 1
    const cuoriPrima = P.hud.cuori
    const i = P.ing.value
    const buono = i.attrezzi.find(a => P.vaBene(a, i.piccolo))
    if (!buono) return { errore: 'nessun attrezzo buono per ' + i.testo }
    P.scegliStrumento(buono)
    gesti.add(i.scala.tipo); scale.push(i.scala.id)

    if (i.scala.tipo === 'polvere') for (const p of P.scomponi(i.piccolo, buono.pesi)) P.metti(p)
    else P.versa(i.piccolo)

    if (P.dentro.value !== i.piccolo)
      return { errore: `dosato ${P.dentro.value} invece di ${i.piccolo} ${i.scala.a}` }
    P.conferma()
    ingredienti++
    await dormi(r.esigente && ultimo ? 1000 : 70)
    if (r.esigente && ultimo)
      mance.push({ cuoriPrima, cuoriDopo: P.hud.cuori, cartello: P.cartello.value,
                   ingredienti: r.ingredienti.length })
  }
  return { gesti: [...gesti], scale, mance, ingredienti, pozioni: P.hud.pozioni,
           perfette: P.hud.perfette, cuori: P.hud.cuori, fase: P.fase.value,
           premio: P.premio.value, tappa: P.progresso.value.tappa }
}, max)

await page.locator('.tappa[data-tappa="bilancia"]').click()
await page.waitForTimeout(200)
const t1 = await giocaTappa()

if (!controlla('la prima tappa non si è inceppata', !t1.errore, t1.errore)) {
  nota(JSON.stringify(t1))
} else {
  uguale('la tappa è superata', t1.fase, 'vinta')
  uguale('i cinque clienti sono passati tutti', t1.pozioni, 5)
  uguale('e nessuno se n\'è andato', t1.cuori, 3)
  controlla('la prima tappa chiede solo di pesare in chili',
            t1.scale.every(s => s === 'kg-g'), [...new Set(t1.scale)].join(' · '))
  uguale('un ingrediente per cliente, non di più', t1.ingredienti, 5)
  controlla('la tappa paga in monete', t1.premio >= 1, `premio ${t1.premio}`)
  uguale('e resta segnata nel profilo', t1.tappa, 1)
}
await scatto(page, 'pozioni-banco')

/* ---------- 4. la seconda tappa si è aperta, e ha il cliente esigente ---------- */
await page.evaluate(() => window.__poz.allaMappa())
await page.waitForTimeout(150)
uguale('adesso le tappe chiuse sono una di meno',
       await page.locator('.tappa.chiusa').count(), quante - 2)

await page.locator('.tappa[data-tappa="peso"]').click()
await page.waitForTimeout(200)

/* sbagliare per eccesso costa tempo, non un cuore: si prova sul primo cliente */
const boom = await page.evaluate(async () => {
  const P = window.__poz
  const i = P.ing.value
  const buono = i.attrezzi.find(a => P.vaBene(a, i.piccolo))
  P.scegliStrumento(buono)
  const cuoriPrima = P.hud.cuori
  const pazienzaPrima = P.restaPazienza.value
  P.versa(i.piccolo + buono.grana)          // una tacca di troppo
  if (i.scala.tipo === 'polvere') P.metti(buono.pesi[buono.pesi.length - 1] * 99)
  const traboccato = P.esito.value === 'boom' || P.troppo.value
  P.conferma()
  await new Promise(r => setTimeout(r, 60))
  return { traboccato, esito: P.esito.value, cuoriPrima, cuoriDopo: P.hud.cuori,
           pazienzaPrima, pazienzaDopo: P.restaPazienza.value }
})
controlla('la dose di troppo fa 💥', boom.traboccato || boom.esito === 'boom',
          `esito "${boom.esito}"`)
uguale('ma non costa un cuore', boom.cuoriDopo, boom.cuoriPrima)
controlla('costa tempo', boom.pazienzaDopo < boom.pazienzaPrima,
          `${boom.pazienzaPrima.toFixed(1)}s → ${boom.pazienzaDopo.toFixed(1)}s`)

const t2 = await giocaTappa()
if (!controlla('la seconda tappa non si è inceppata', !t2.errore, t2.errore)) {
  nota(JSON.stringify(t2))
} else {
  uguale('anche la seconda è superata', t2.fase, 'vinta')
  controlla('qui entra l\'ettogrammo', t2.scale.includes('hg-g'),
            [...new Set(t2.scale)].join(' · '))
  uguale('un cliente esigente, come dice la tappa', t2.mance.length, 1)
  const m = t2.mance[0] || {}
  controlla('l\'esigente chiede un ingrediente in più', m.ingredienti === 3, `${m.ingredienti}`)
  controlla('e servito bene lascia la mancia', /Mancia/.test(m.cartello || ''), m.cartello)
  uguale('che è un cuore in più', m.cuoriDopo, m.cuoriPrima + 1)
  nota(`tappa 2: ${t2.ingredienti} dosi · ${[...new Set(t2.scale)].join(' · ')} · mancia ${m.cartello}`)
}

/* ---------- 5. quello che si è fatto è finito nel profilo ---------- */
const p = await leggiProfilo(page)
dentro('gli ingredienti dosati sono contati', p.totals.misure, 14, 20)
dentro('e le pozioni pure', p.totals.pozioni, 9, 11)
controlla('le pozioni perfette sono segnate a parte',
          p.totals.pozioniPerfette >= 9 && p.totals.pozioniPerfette <= p.totals.pozioni,
          `${p.totals.pozioniPerfette} su ${p.totals.pozioni}`)
uguale('la campagna è avanti di due tappe', p.lab.tappa, 2)
controlla('e il laboratorio libero è ancora chiuso', !p.lab.libera)
const chiavi = Object.keys(p.items).filter(k => k.startsWith('pozioni:'))
controlla('il motore di apprendimento ha visto le conversioni', chiavi.length >= 2,
          'chiavi: ' + chiavi.join(' · '))
nota('conversioni incontrate: ' + chiavi.join(' · '))

/* la home racconta a che punto è la campagna */
const home = await page.evaluate(() => {
  document.querySelector('button[aria-label="indietro"]').click()
  return new Promise(r => setTimeout(() => r(document.body.innerText), 400))
})
controlla('la home racconta a che punto si è', /tappa 3 di 11/.test(home),
          home.split('\n').find(r => /preparate|tappa|pozioni/i.test(r)) || 'niente sulle pozioni')

/* ---------- 6. l'ultima tappa apre il laboratorio libero ----------
   Giocarsi tutte e otto le tappe qui dentro vorrebbe dire tre minuti di
   test: si semina il profilo davanti all'ultima, che è l'unica cosa che
   il resto della campagna non può dire. */
await semina(page, { lab: { tappa: 10, libera: false, v: 2 } })
await page.getByText('Il laboratorio delle pozioni').click()
await page.waitForSelector('.lab', { timeout: 5000 })
uguale('con dieci tappe fatte non resta niente di chiuso',
       await page.locator('.tappa.chiusa').count(), 0)
await page.locator('.tappa[data-tappa="calderone"]').click()
await page.waitForTimeout(200)
const t8 = await giocaTappa(60)

if (!controlla('l\'ultima tappa non si è inceppata', !t8.errore, t8.errore)) {
  nota(JSON.stringify(t8))
} else {
  uguale('finire l\'ultima tappa è un trionfo', t8.fase, 'trionfo')
  controlla('il grande calderone mescola tutti e tre i gesti',
            t8.gesti.length === 3, t8.gesti.join(' · '))
  nota(`ultima tappa: ${t8.ingredienti} dosi · ${[...new Set(t8.scale)].sort().join(' · ')}`)
}
const dopo = await leggiProfilo(page)
controlla('e apre il laboratorio libero', dopo.lab.libera, JSON.stringify(dopo.lab))

/* nel libero non si finisce mai, e la conversione la sceglie il motore */
await page.evaluate(() => window.__poz.allaMappa())
await page.waitForTimeout(150)
uguale('in mappa compare il laboratorio libero',
       await page.locator('.tappa.libera').count(), 1)
await page.locator('.tappa[data-tappa="libero"]').click()
await page.waitForTimeout(200)
const libero = await page.evaluate(() => ({
  campagna: window.__poz.campagna.value,
  clienti: window.__poz.tappa.value.clienti,
  scale: window.__poz.tappa.value.scale.length,
}))
controlla('il libero non è una tappa', !libero.campagna)
controlla('e non finisce mai', libero.clienti === Infinity || libero.clienti === null,
          String(libero.clienti))
uguale('con tutte e nove le conversioni in gioco', libero.scale, 9)

/* a campagna finita la home smette di contare le tappe e dice il libero */
const homeDopo = await page.evaluate(() => {
  document.querySelector('button[aria-label="indietro"]').click()
  return new Promise(r => setTimeout(() => r(document.body.innerText), 400))
})
controlla('e la home lo racconta', /laboratorio libero/i.test(homeDopo),
          homeDopo.split('\n').find(r => /pozioni|laboratorio/i.test(r)) || 'niente sulle pozioni')

/* ---------- 7. l'introduzione guidata, che il banco di solito salta ----------
   Il difetto segnalato da un genitore: il gioco chiedeva di convertire
   dalla prima ricetta della prima tappa e non insegnava mai come si fa.
   Adesso la tappa che porta una conversione nuova comincia guidata, e
   siccome è una spiegazione che compare da sola il banco la spegne
   (`saltaLeSpiegazioni`): tutto quello che si è giocato fin qui è il
   gioco senza aiuti, ed è così che deve restare. Qui si apre una seconda
   pagina che le chiede, perché una scaletta che nessuno prova è una
   scaletta che un giorno smette di comparire senza dirlo. */
const { page: guidata, errori: erroriGuida } =
  await apriGioco(browser, { viewport: TELEFONO, spiegazioni: true })
await azzera(guidata)
await guidata.getByText('Il laboratorio delle pozioni').click()
await guidata.waitForSelector('.lab', { timeout: 5000 })
await guidata.locator('.tappa[data-tappa="bilancia"]').click()
await guidata.waitForTimeout(200)

const cartello = await guidata.evaluate(() => ({
  testo: document.querySelector('[data-promemoria]')?.innerText || '',
  dose: window.__poz.ing.value.testo,
  guida: window.__poz.ing.value.guida,
  chiede: window.__poz.ing.value.chiede,
}))
controlla('la conversione sta scritta sopra il banco, non dietro un tasto',
          /1 kg = 1000 g/.test(cartello.testo), JSON.stringify(cartello).slice(0, 140))
controlla('e dice anche quanto sono grandi le due unità',
          /graffetta/.test(cartello.testo), cartello.testo.replace(/\n/g, ' · '))
uguale('la prima dose non chiede nessuna conversione', cartello.guida, 'diretta')
controlla('è scritta nell\'unità del banco', / g$/.test(cartello.dose), cartello.dose)
controlla('e non si segna al motore di apprendimento, perché nessuno l\'ha chiesta',
          cartello.chiede === false)
await scatto(guidata, 'pozioni-guidata')

/* si gioca la tappa dosando giusto, e si guarda la scaletta scendere */
const scaletta = await guidata.evaluate(async () => {
  const P = window.__poz
  const dormi = ms => new Promise(r => setTimeout(r, ms))
  const passi = []
  for (let giro = 0; giro < 12 && P.fase.value === 'gioco'; giro++) {
    for (let n = 0; n < 80 && (!P.ing.value || P.ing.value.fatto || P.esito.value); n++)
      await dormi(50)
    if (P.fase.value !== 'gioco') break
    const i = P.ing.value
    passi.push({ guida: i.guida, testo: i.testo,
                 cartello: !!document.querySelector('[data-promemoria]') })
    P.scegliStrumento(i.attrezzi.find(a => P.vaBene(a, i.piccolo)))
    for (const p of P.scomponi(i.piccolo, P.strumento.value.pesi)) P.metti(p)
    P.conferma()
    await dormi(70)
  }
  return passi
})
uguale('le prime dosature sono guidate e poi non lo sono più',
       scaletta.map(p => p.guida || 'nuda').join(' '),
       'diretta diretta accanto accanto promemoria')
controlla('il cartello resta finché la conversione è fresca',
          scaletta.every(p => p.cartello), JSON.stringify(scaletta.map(p => p.cartello)))
nota('la scaletta della prima tappa: ' + scaletta.map(p => `${p.testo} [${p.guida}]`).join(' · '))

const dopoTappa = await leggiProfilo(guidata)
controlla('il conto delle conversioni fresche è sceso, e sta nel profilo del bambino',
          (dopoTappa.settings.misureNuove || {})['kg-g'] === 1,
          JSON.stringify(dopoTappa.settings.misureNuove))
uguale('e al motore sono arrivate solo le dosature che una conversione la chiedevano',
       (dopoTappa.items['pozioni:kg-g'] || {}).ok, 1)

/* ── e uno sbaglio lo rimette ──
   La metà che conta: chi ha imparato la conversione non vede più niente,
   ma chi ci ricasca deve ritrovarsela davanti senza doverla cercare. */
await semina(guidata, { lab: { tappa: 0, libera: false, v: 2 },
                        settings: { ...dopoTappa.settings, misureNuove: { 'kg-g': 0 } } })
await guidata.getByText('Il laboratorio delle pozioni').click()
await guidata.waitForSelector('.lab', { timeout: 5000 })
await guidata.locator('.tappa[data-tappa="bilancia"]').click()
await guidata.waitForTimeout(200)
const ricaduta = await guidata.evaluate(async () => {
  const P = window.__poz
  const prima = !!document.querySelector('[data-promemoria]')
  const i = P.ing.value
  const buono = i.attrezzi.find(a => P.vaBene(a, i.piccolo))
  P.scegliStrumento(buono)
  P.metti(buono.pesi[buono.pesi.length - 1])
  P.metti(buono.pesi[buono.pesi.length - 1])
  P.conferma()                                   // dose sbagliata: 💥
  await new Promise(r => setTimeout(r, 900))
  return { prima, dopo: !!document.querySelector('[data-promemoria]'),
           guida: (P.promemoria.value || {}).guida || '',
           dose: P.ing.value && P.ing.value.testo }
})
controlla('a conversione imparata il cartello non c\'è più', !ricaduta.prima)
/* e torna sulla dose che si sta sbagliando, non sulla prossima: la
   ricetta è già nata, quindi il cartello lo decide il conto com'è
   adesso e non quello che era quando la ricetta è stata scritta */
controlla('ma uno sbaglio lo riporta, subito e su questa dose',
          ricaduta.dopo, JSON.stringify(ricaduta))
uguale('e quello che torna è il promemoria, non la dose già convertita',
       ricaduta.guida, 'promemoria')
controlla('la dose infatti resta da convertire', / kg$/.test(ricaduta.dose || ''), ricaduta.dose)
await scatto(guidata, 'pozioni-promemoria')

uguale('nessun errore in console con le spiegazioni accese', erroriGuida.length, 0)
if (erroriGuida.length) erroriGuida.forEach(e => nota(e))

/* ---------- 8. niente errori per strada ---------- */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('Il laboratorio delle pozioni')
