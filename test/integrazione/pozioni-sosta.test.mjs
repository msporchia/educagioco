/* La tappa delle pozioni lasciata a metà, nel browser: si esce con ←, si
   rientra, la mappa offre in cima «torno da dove ero» e la pozione è com'era
   (misurini, gettoni, listino, macchie). Anche dopo aver ricaricato la
   pagina, anche uscendo mentre il mercante versa, e mai in silenzio: una
   tappa nuova chiede prima di buttarla. Vedi docs/pozioni/sosta.md.
   perché: la tappa delle pozioni lasciata a metà: misurini, gettoni, listino e macchie come prima, anche dopo la ricarica e uscendo mentre il mercante versa; una tappa nuova chiede prima di buttarla
   a parte perché: POTREBBE stare dentro pozioni (stessa tappa): sta a parte perché ricarica la pagina, e insieme (55 s più 15) passerebbero il minuto che pozioni non deve superare
   `node test/esegui.mjs pozioni-sosta`
   tempo: 60 */
import { apriBrowser, apriGioco, semina, leggiProfilo, scatto, scegli, archivioFermo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { MONETE_A_DOSE, CAMPAGNA } from '../../src/giochi/pozioni/dati/campagna.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
/* la tappa 1 («Arriva il chilo») è già la prossima: le prime due sono aperte */
await semina(page, { settings: { eta: 9 },
                     campagne: { pozioni: { tappa: 1, libera: false, stelle: {}, cfg: {} } } })

async function entra() {
  await scegli(page, 'pozioni')
  await page.waitForSelector('.pz-mappa')
}
const indietro = () => page.click('button[aria-label="indietro"]')

/* i gesti passano dalla porta del gioco (`window.__poz`), come li farebbe un
   dito: la più piccola che ci sta per il primo ingrediente non finito, così
   la pozione non finisce sotto gli occhi della prova. Il banco non prende
   niente mentre è cieco o il mercante versa: si riprova finché l'ordine è
   pagato, invece di contare i millisecondi */
const ordina = () => page.evaluate(async () => {
  const Z = window.__poz, b = Z.bottega.value, prima = b.speso
  for (let n = 0; n < 400 && b.speso === prima; n++) {
    if (!Z.occupato.value) {
      const i = b.ingredienti.findIndex(g => g.messo < g.dose), g = b.ingredienti[i]
      const k = g.offerte.map((o, n) => n).filter(n => g.messo + g.offerte[n].base <= g.dose)
        .sort((x, y) => g.offerte[x].base - g.offerte[y].base || g.offerte[x].prezzo - g.offerte[y].prezzo)[0]
      if (!Z.bozza.value.length) Z.aggiungi(i, k)
      Z.ordina()
    }
    await new Promise(r => setTimeout(r, 25))
  }
})
const fermo = () => page.waitForFunction(() => {
  const el = document.querySelector('[data-azione="mercante"], [data-fase="procedimento"], [data-fine]')
  return el && !el.disabled
}, null, { timeout: 25000 })

const stato = () => page.evaluate(() => {
  const b = window.__poz.bottega.value
  return b && {
    vista: window.__poz.vista.value, pozione: b.pozione.nome, speso: b.speso, gettoni: b.gettoni,
    voci: b.ingredienti.map(g => `${g.nome} ${g.messo}/${g.dose} ${g.offerte.map(o => o.base + o.unita).join()}`),
    macchie: [...b.macchie],
  }
})

await entra()
await page.click('.pz-tappa[data-tappa="1"]')
await page.waitForSelector('.pz-mercante')
uguale('senza una sosta la tappa comincia subito', await page.locator('[data-chiede]').count(), 0)

await ordina()
await fermo()
const lasciata = await stato()
controlla('la prova parte da una pozione a metà', lasciata.speso > 0, JSON.stringify(lasciata))

/* ← dal banco porta alla mappa, e la carta c'è */
await indietro()
await page.waitForSelector('[data-ripresa]')
controlla('la carta dice a che punto si era', /ingredienti su 2/.test(await page.locator('[data-ripresa]').textContent()))
await scatto(page, 'pozioni-ripresa')
const profilo0 = await leggiProfilo(page)
uguale('la sosta sta in profile.campagne.pozioni', profilo0.campagne.pozioni.sosta.chiave, 'massa-grande')

/* la pagina che sparisce (il telefono in tasca): si ricarica e la carta c'è ancora */
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
await archivioFermo(page)
await page.reload()
await page.waitForSelector('.carte')
await entra()
uguale('anche dopo aver ricaricato la pagina', await page.locator('[data-ripresa]').count(), 1)

/* toccare un'altra tappa non la butta in silenzio */
await page.click('.pz-tappa[data-tappa="0"]')
uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="riprendi-invece"]')
await page.waitForSelector('.pz-mercante')
uguale('«no, torno a quella di prima» riprende la pozione',
       JSON.stringify(await stato()), JSON.stringify(lasciata))

/* si esce mentre il mercante versa: quello che è deciso è già scritto */
await ordina()
const inVolo = await stato()
controlla('l\'ordine è già scritto mentre vola', inVolo.speso > lasciata.speso)
controlla('e si esce col mercante che versa', await page.evaluate(() => window.__poz.occupato.value))
await indietro()
await page.waitForSelector('[data-ripresa]')
await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.pz-mercante', { timeout: 5000 })
uguale('uscendo a metà consegna l\'ordine resta fatto', JSON.stringify((await stato()).voci), JSON.stringify(inVolo.voci))

/* il resto della spesa col tasto dei grandi (gli ordini li prova `integrazione/pozioni`): le monete dicono il totale, anche
   quelle prima dell'uscita */
const saltaFinche = fatto => page.evaluate(async fatto => {
  const Z = window.__poz, b = Z.bottega.value
  for (let n = 0; n < 400 && !(fatto === 'pronta' ? b.pronta : b.finita); n++) { Z.salta(); await new Promise(r => setTimeout(r, 25)) }
}, fatto)
await saltaFinche('pronta')
await page.waitForSelector('[data-fase="procedimento"]', { timeout: 8000 })
/* a metà procedimento si esce e si rientra: il passo fatto resta */
let passi = 0
{
  /* un gesto conta solo a banco libero: mentre la scena suona il passo di prima (`occupato`) o il banco è cieco il tocco
     si perde, quindi si riprova finché il passo è andato */
  const unPasso = () => page.evaluate(async () => {
    const Z = window.__poz, b = Z.bottega.value, n = b.passo
    for (let g = 0; g < 800 && b.passo === n && !b.finita; g++) {
      const p = b.passi[b.passo]
      if (!Z.occupato.value) {
        if (p.azione === 'pesta' && b.mancaAl(p).length) Z.fai('metti', b.mancaAl(p))
        else Z.fai(p.azione, p.azione === 'pesta' ? [] : [...p.cosa])
      }
      await new Promise(r => setTimeout(r, 25))
    }
  })
  // un passo è fatto quando il banco va al passo dopo (o la pozione è finita)
  const passoFatto = n => page.waitForFunction(n => {
    const b = window.__poz.bottega.value
    return document.querySelector('[data-fine]') || (b && b.passo > n)
  }, n, { timeout: 8000 })
  passi = await page.evaluate(() => window.__poz.bottega.value.passi.length)
  await unPasso()
  await passoFatto(0)
  await indietro()
  await page.waitForSelector('[data-ripresa]')
  await page.click('[data-ripresa] [data-azione="riprendi"]')
  await page.waitForSelector('[data-fase="procedimento"]', { timeout: 5000 })
  uguale('si riparte dal passo dov\'era', await page.evaluate(() => window.__poz.bottega.value.passo), 1)
  /* il passo dopo l'uscita col dito della porta, gli altri col tasto dei grandi: pagano uguale */
  await unPasso()
  await passoFatto(1)
  await saltaFinche('finita')
  await page.waitForSelector('[data-fine]', { timeout: 8000 })
}
uguale('la tappa finisce', await page.locator('[data-fine="tappa"]').count(), 1)
uguale('le monete sono quelle di tutta la tappa, anche prima dell\'uscita',
       (await page.locator('[data-monete]').innerText()).trim(), `+${CAMPAGNA[1].ingredienti * MONETE_A_DOSE + passi} 🪙`)
await page.click('[data-fine] [data-azione="mappa"]')
await page.waitForSelector('.pz-mappa')
uguale('finita la tappa la carta non c\'è', await page.locator('[data-ripresa]').count(), 0)
uguale('e la sosta nemmeno', (await leggiProfilo(page)).campagne.pozioni.sosta, undefined)

/* una tappa nuova a metà, poi un'altra: chiede, e scegliendola la vecchia si butta */
await page.click('.pz-tappa[data-tappa="0"]')
await page.waitForSelector('.pz-mercante')
await ordina()
await indietro()
await page.waitForSelector('[data-ripresa]')
await page.click('.pz-tappa[data-tappa="1"]')
uguale('chiede anche dalla tappa a metà', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="comincia"]')
await page.waitForSelector('.pz-mercante')
uguale('e scelta la nuova si comincia da capo', (await stato()).speso, 0)
await ordina()
await indietro()
await page.waitForSelector('[data-ripresa]')
controlla('la carta è quella della tappa nuova',
          new RegExp(CAMPAGNA[1].nome).test(await page.locator('[data-ripresa]').textContent()))
/* dalla home «riprendi da qui» non passa dalla carta: la partita riparte e basta
   (docs/core/ripresa.md, «Dalla home») */
await indietro()
await page.waitForSelector('.carte')
uguale('in home «riprendi da qui» è il laboratorio',
       await page.locator('[data-riprendi]').getAttribute('data-riprendi'), 'pozioni')
await page.click('[data-riprendi]')
await page.waitForSelector('.pz-mercante', { timeout: 5000 })
uguale('«riprendi» riapre la pozione a metà', (await stato()).pozione !== undefined, true)
await indietro()
await page.waitForSelector('[data-ripresa]')
uguale('tornati alla mappa non riparte da sola', await page.locator('.pz-mercante').count(), 0)
await page.click('[data-ripresa] [data-azione="scorda"]')
uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)
uguale('e la sosta', (await leggiProfilo(page)).campagne.pozioni.sosta, undefined)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('pozioni — la tappa lasciata a metà, nel browser')
