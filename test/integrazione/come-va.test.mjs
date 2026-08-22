/* ═══════════════════════════════════════════════════════════════════
   COME VA — la terza scheda, col dito

   Era sospesa e adesso c'è di nuovo, rifatta: prima mostrava **solo i
   segnali** — le tre righe fuori soglia — e tre righe senza il resto non
   dicono se sono tre su dieci o tre su centoventi. Adesso ci sono tutte
   le domande, ordinate da quella che va peggio, e il **punteggio è il
   tasto**: si preme, si aprono i numeri, si decide.

   Le cose da non rompere:

     · **l'ordine**, che è tutto il contenuto: la peggiore in cima. Un
       elenco alfabetico chiederebbe di leggerlo tutto per trovare le tre
       righe che contano;
     · **una tipologia si dice una volta sola** anche se nel catalogo ha
       più gradi — il conto è uno, e vederlo due volte fa credere a due
       problemi;
     · **i tre tasti fanno quello che dicono**, e si vede nel profilo.

   `node test/esegui.mjs come-va`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* Due tipologie vere, una per verso. `ora:intere` ha più di un grado nel
   catalogo, ed è apposta: è quella che senza il raggruppamento
   comparirebbe due volte. La forma dell'item è quella di
   `store/srs.js`: `{ s, ok, err, seen, t, last }`. */
const MURO = 'num:confronto'      // ne sbaglia 8 su 10
const BENE = 'ora:intere'         // le indovina tutte
await semina(page, {
  coins: 100,
  settings: { eta: 8 },
  items: {
    [MURO]: { s: 1, ok: 2, err: 8, seen: 10, t: 9000, last: Date.now() },
    [BENE]: { s: 5, ok: 12, err: 0, seen: 12, t: 2500, last: Date.now() },
  },
})

const entra = async () => {
  await page.click('[data-azione="grandi"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
  for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
  await page.waitForSelector('.carte', { timeout: 5000 })
  await page.waitForTimeout(300)
}
await entra()

await page.click('.schede button[data-scheda="comeva"]')
await page.waitForSelector('[data-come-va]', { timeout: 5000 })
await page.waitForTimeout(300)

/* ── 0. una scheda è una scheda sola ──
   Finché le schede erano due il ramo di «Giochi e domande» era un
   `v-else`, cioè «tutto quello che non è bambini»: con la terza è
   rimasto vero anche per lei, e «Come va» apriva **la manopola
   dell'età** col suo quadro alto due schermate, mentre il tempo di
   gioco e l'elenco delle domande finivano sotto, dove non li vedeva
   nessuno. Non dava nessun errore e i controlli per selettore passavano
   lo stesso, perché la roba giusta c'era — solo in fondo a quella
   sbagliata. Da qui i due controlli incrociati. */
uguale('«Come va» non apre il quadro dell\'età',
       await page.locator('[data-manopola]').count(), 0)
controlla('e comincia dal tempo di gioco',
          await page.isVisible('[data-tempo]'))
{
  const primo = await page.evaluate(() => {
    const dentro = document.querySelector('[data-tempo]') ? 1 : 0
    const y = document.querySelector('[data-tempo]')?.getBoundingClientRect().top
    return { dentro, y }
  })
  controlla('che sta in cima e non due schermate più giù',
            primo.dentro === 1 && primo.y < 900, JSON.stringify(primo))
}

/* ── 1. il sommario, che è la misura di tutto il resto ── */
const sommario = await page.locator('[data-sommario]').innerText()
controlla('in cima dice quante risposte ha dato in tutto',
          sommario.includes('22'), sommario.replace(/\n/g, ' '))

/* ── 2. l'ordine ── */
const righe = () => page.evaluate(() =>
  [...document.querySelectorAll('[data-come-va] li[data-riga]')].map(r => r.dataset.riga))
const prime = await righe()
uguale('la peggiore è la prima riga', prime[0], MURO)
controlla('e quella che va bene sta più sotto', prime.indexOf(BENE) > 0,
          prime.slice(0, 4).join(', '))
uguale('una tipologia con più gradi si dice una volta sola',
       prime.filter(k => k === BENE).length, 1)

const riga = await page.locator(`[data-voto="${MURO}"]`).innerText()
controlla('la riga porta il conto, non un giudizio', /2 su 10/.test(riga), riga)
await scatto(page, 'come-va-elenco')

/* ── 3. si apre toccando la riga, non solo il punteggio ──
   Il punteggio da solo è un bersaglio di novanta pixel in fondo a una
   riga larga tutto lo schermo: chi lo manca conclude che quella riga
   non si apre. Si tocca **il nome**, che è il posto più lontano dal
   punteggio, e deve succedere la stessa cosa. */
await page.click(`[data-voto="${MURO}"] .testo b`)
await page.waitForSelector('[data-scheda-domanda]', { timeout: 5000 })
await page.click('[data-scheda-domanda] button[aria-label="chiudi"]')
await page.waitForSelector('[data-scheda-domanda]', { state: 'detached', timeout: 5000 })

await page.click(`[data-voto="${MURO}"]`)
await page.waitForSelector('[data-scheda-domanda]', { timeout: 5000 })
const scheda = await page.locator('[data-scheda-domanda]').innerText()
for (const [che, dice] of [['le volte', '10'], ['le giuste', '2'], ['la percentuale', '20%']])
  controlla(`la scheda dice ${che}`, scheda.includes(dice), scheda.replace(/\n/g, ' · '))
controlla('e quanto ci mette', /9s|9\.0s/.test(scheda), scheda.replace(/\n/g, ' · '))
await scatto(page, 'come-va-scheda')

/* ── 4. spostarla la scrive nel profilo ──
   La tacca è la stessa del quadro dell'età (`components/eta/Taratura.vue`),
   quindi qui non si prova come funziona: si prova che è attaccata. */
await page.click('[data-scheda="tara"]')
await page.waitForSelector('[data-taratura]', { timeout: 5000 })
await page.click('[data-tara="giu"]')          // «più facile»
await page.click('[data-tara="applica"]')
await page.waitForTimeout(700)                 // `save()` raggruppa a 350 ms
{
  const prof = await leggiProfilo(page)
  uguale('il ritocco è scritto, di un gradino solo',
         (prof.settings?.ritocchi || {})[MURO], 1)
}

/* ── 5. e ricominciare a contare butta il conto, non il ripasso ──
   È la mossa che serve **dopo** un ritocco: il vecchio «2 su 10» parla
   delle domande di prima, e senza azzerarlo l'elenco continua a mettere
   in cima una riga già sistemata. La scheda è ancora quella di prima —
   applicare un ritocco non la chiude, i numeri restano sotto gli occhi. */
await page.click('[data-scheda="azzera"]')
await page.click('[data-scheda="azzera-si"]')
await page.waitForTimeout(700)
{
  const prof = await leggiProfilo(page)
  const it = prof.items[MURO]
  uguale('le risposte contate tornano a zero', (it.ok || 0) + (it.err || 0), 0)
  controlla('ma il ripasso resta dov\'era: se no quella cosa ricomparirebbe domani',
            (it.s || 0) > 0 && (it.last || 0) > 0, JSON.stringify(it))
}

/* ── 6. il ▶ porta al pannello di prova di sempre ── */
const chiudiScheda = async () => {
  await page.click('[data-scheda-domanda] button[aria-label="chiudi"]')
  await page.waitForSelector('[data-scheda-domanda]', { state: 'detached', timeout: 5000 })
}
await chiudiScheda()
await page.click(`[data-voto="${BENE}"]`)
await page.waitForSelector('[data-scheda-domanda]', { timeout: 5000 })
await page.click('[data-scheda="prova"]')
await page.waitForTimeout(600)
controlla('il ▶ apre una domanda vera', await page.isVisible('.qz-carta'))

/* il pannello di prova copre tutto lo schermo: finché è aperto, un
   click su una scheda finisce sul suo velo */
await page.click('[data-prova] .prova-x')
await page.waitForSelector('[data-prova]', { state: 'detached', timeout: 5000 })

/* ── e il verso contrario ──
   Nella scheda dove si tara non deve comparire il grafico del tempo: è
   l'altra metà dello stesso guasto, e senza questo controllo la
   correzione regge solo da una parte. */
await page.click('.schede button[data-scheda="giochi"]')
await page.waitForSelector('[data-manopola]', { timeout: 5000 })
uguale('e in «Giochi e domande» non c\'è il tempo di gioco',
       await page.locator('[data-tempo]').count(), 0)

uguale('nessun errore in console', errori.length, 0, errori.join('\n'))
await browser.close()
riassunto('come va')
