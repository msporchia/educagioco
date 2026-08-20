/* ═══════════════════════════════════════════════════════════════════
   IL QUADRO DI UN'ETÀ, COL DITO — l'elenco e i modi di provarlo.

   Era `integrazione/catalogo`, e provava la scheda «Le domande»: un
   elenco di duecento righe con quattro tondi ciascuna e una seconda
   tacca dell'età in cima. Quella scheda non c'è più — si tara nel
   quadro, sotto la manopola — ma **le domande che si facevano lì
   restano le stesse**, e sono le uniche che un test senza browser non
   può fare: il pannello si apre davvero? mostra quello che il tasto
   prometteva? il giro conta giusto?

   Quattro gesti, che sono i quattro modi di arrivare a una domanda:

     · aprire un blocco e vedere i pezzi di scuola, e dentro le loro
       domande con l'età di fianco;
     · il ▶ di una domanda: si apre **quella**, non una a caso — che è
       il difetto da cui nasce tutto l'elenco;
     · il ▶ di un pezzo di scuola: le sue di quella fascia, una per una,
       col contatore;
     · «pescane una come farebbe un gioco»: si pesca a quella
       difficoltà, e quello che arriva può essere di un modulo qualunque.

   L'attesa dopo l'apertura non è un contorno: una domanda appena
   comparsa non si lascia toccare per 320 ms (`quiz/Domanda.vue`), e
   senza il test racconterebbe che rispondere non fa niente.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const CIECA = 400          // la finestra cieca di Domanda.vue, con margine

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await semina(page, { coins: 100, settings: { eta: 8 } })

/* ── dentro la pagina dei grandi, scheda dove si tara ── */
await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('.carte', { timeout: 5000 })

controlla('le domande stanno con i giochi, in una scheda sola',
  await page.isVisible('.schede button[data-scheda="giochi"]'))
await page.click('.schede button[data-scheda="giochi"]')
await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })

const apriBlocco = async k => {
  const sel = `[data-manopola] [data-apri="${k}"]`
  if ((await page.locator(sel).count()) === 0) return false
  if (!(await page.locator(sel).evaluate(el => el.classList.contains('aperta')))) {
    await page.click(sel)
    await page.waitForTimeout(150)
  }
  return true
}

/* ── 1. i blocchi ci sono, e dicono quanti sono ── */
const conta = async () => Object.fromEntries(await page.evaluate(() =>
  [...document.querySelectorAll('[data-manopola] [data-apri]')]
    .map(b => [b.dataset.apri, Number(b.querySelector('.tit > b')?.textContent) || 0])))

controlla('c\'è la manopola dell\'età in cima', await page.isVisible('[data-eta="su"]'))
const blocchi = await conta()
controlla('e sotto i blocchi: i giochi in casa, e le domande per come cadono',
  ['giochi', 'facili', 'medie', 'toste'].every(k => k in blocchi),
  Object.keys(blocchi).join(','))
controlla('con dentro un bel po\' di domande',
  (blocchi.facili || 0) + (blocchi.medie || 0) + (blocchi.toste || 0) > 50,
  JSON.stringify(blocchi))

/* ── 2. due livelli: i pezzi di scuola, e dentro le domande ── */
await apriBlocco('medie')
const pezzi = await page.locator('[data-manopola] [data-apri="medie"] .elenco > li').count()
controlla('aperto un blocco ci sono i pezzi di scuola', pezzi > 0, `${pezzi} pezzi`)
await page.locator('[data-manopola] [data-apri="medie"] .elenco > li .voce-riga').first().click()
await page.waitForTimeout(250)
controlla('e aperto un pezzo di scuola, le sue domande rientrate sotto',
  (await page.locator('[data-manopola] [data-apri="medie"] .voce-riga.dentro').count()) > 0)
await scatto(page, 'quadro-blocchi')

/* ── 3. il ▶ di una domanda apre QUELLA domanda ──
   È il difetto da cui nasce tutto l'elenco: prima si poteva chiedere
   «una domanda a caso», e per farsi un'idea di una tipologia bisognava
   insistere finché non ricapitava. */
const riga = page.locator('[data-manopola] [data-apri="medie"] .voce-riga.dentro').first()
const nomeRiga = (await riga.locator('.testo b').innerText()).trim()
await riga.locator('.prova').click()
await page.waitForSelector('.prova-velo .qz-consegna', { timeout: 5000 })
await page.waitForTimeout(CIECA)
const titolo = (await page.locator('.prova-chi').innerText()).trim()
controlla('il ▶ di una domanda apre proprio quella', titolo.toLowerCase().includes(nomeRiga.toLowerCase()),
          `«${titolo}» invece di «${nomeRiga}»`)
uguale('e non è un giro, quindi niente contatore', await page.locator('[data-conta]').count(), 0)

/* si risponde come nel gioco: la barra si riempie e poi si prosegue da
   soli, senza premere niente fra una domanda e l'altra */
await page.click('.prova-velo .qz-tasto')
await page.waitForSelector('.qz-avanti', { timeout: 3000 })
controlla('rispondendo compare la stessa barra del gioco',
  await page.isVisible('.qz-avanti.saltabile'))
/* ── e l'attesa qui si salta ──
   Nel gioco l'attesa dopo una risposta serve, e si vede apposta. Qui
   chi guarda è un grande che sta scorrendo venti domande per
   giudicarle: aspettare un secondo e mezzo per ognuna è solo tempo. */
controlla('nel pannello l\'attesa si può saltare',
  await page.isVisible('.qz-avanti.saltabile') ||
  (await page.locator('.prova-velo .qz-esito').count()) > 0)
await page.click('.prova-fine')
await page.waitForTimeout(250)

/* ── 4. il ▶ di un pezzo di scuola: le sue, una per una ──
   E **non pesca fuori**: scorre le sue domande di quella fascia e
   nient'altro. Se pescasse nel gruppo intero, il ▶ della riga «sta
   imparando» aprirebbe anche le toste, e il riquadro direbbe una cosa
   mentre il tasto ne apre un'altra. */
const pezzo = page.locator('[data-manopola] [data-apri="medie"] .elenco > li').first()
/* le domande di un pezzo sono **righe sorelle** rientrate, non figlie
   della sua: l'elenco è piatto e il rientro è quello che dice a chi
   appartengono. Aperto un pezzo solo, le rientrate sono le sue. */
const quante = await page.locator('[data-manopola] [data-apri="medie"] .voce-riga.dentro').count()
await pezzo.locator('.voce-riga').first().locator('.prova').click()
await page.waitForSelector('.prova-velo .qz-consegna', { timeout: 5000 })
await page.waitForTimeout(CIECA)
uguale('il giro parte dalla prima',
       (await page.locator('[data-conta]').innerText()).trim(), `1 di ${quante}`)
const prima = (await page.locator('.prova-chi').innerText()).trim()

if (quante > 1) {
  await page.click('.prova-altra')
  await page.waitForTimeout(CIECA)
  uguale('«la prossima» avanza',
         (await page.locator('[data-conta]').innerText()).trim(), `2 di ${quante}`)
  controlla('e cambia domanda',
    (await page.locator('.prova-chi').innerText()).trim() !== prima)

  await page.click('[data-indietro]')
  await page.waitForTimeout(CIECA)
  uguale('il tasto indietro torna a quella di prima',
         (await page.locator('[data-conta]').innerText()).trim(), `1 di ${quante}`)
}

/* e in fondo si ricomincia, invece di finire in un vicolo cieco */
for (let i = 0; i < quante; i++) { await page.click('.prova-altra'); await page.waitForTimeout(120) }
uguale('dopo l\'ultima si torna alla prima',
       (await page.locator('[data-conta]').innerText()).trim(), `1 di ${quante}`)

/* rispondere fa avanzare da solo, e toccare la barra accorcia l'attesa:
   sono le due cose che rendono possibile scorrerne venti di fila, e il
   contatore le conta — è così che si vede se una risposta ne facesse
   saltare due */
await page.waitForTimeout(CIECA)
const daDove = Number((await page.locator('[data-conta]').innerText()).trim().split(' ')[0])
await page.click('.prova-velo .qz-tasto')
await page.waitForSelector('.qz-avanti.saltabile', { timeout: 3000 })
await page.click('.qz-avanti.saltabile')
await page.waitForTimeout(300)
uguale('toccando la barra si va avanti di UNA domanda',
       (await page.locator('[data-conta]').innerText()).trim(),
       `${(daDove % quante) + 1} di ${quante}`)
await scatto(page, 'quadro-giro')
await page.click('.prova-fine')
await page.waitForTimeout(250)

/* ── 5. come le vede il bambino: si pesca ──
   L'altra domanda, quella che dall'elenco non si deduce: *cosa gli
   capita davvero?* Si pesca a quella difficoltà come farebbe un gioco,
   con la stessa campana e gli stessi saperi spenti — una riga che
   esiste può uscire una volta su trenta. */
await apriBlocco('facili')
await page.click('[data-fascia-pesca="facili"]')
await page.waitForSelector('.prova-velo .qz-consegna', { timeout: 5000 })
await page.waitForTimeout(CIECA)
uguale('pescando non c\'è nessun contatore', await page.locator('[data-conta]').count(), 0)
const dove = (await page.locator('.prova-chi').innerText()).trim()
controlla('e si legge da dove è arrivata', /grado \d/.test(dove), dove)
nota(`blocco «le sa fare» → ${dove.replace(/\n+/g, ' · ')}`)

await page.click('.prova-altra')
await page.waitForTimeout(CIECA)
controlla('e se ne può chiedere un\'altra',
  (await page.locator('.prova-velo .qz-consegna').innerText()).trim().length > 0)
await page.click('.prova-fine')
await page.waitForTimeout(250)

/* ── 6. guardare non ha cambiato niente ──
   Il quadro è anche il posto dove si tara, quindi la prova che serve è
   che **guardare non tari**: dopo venti domande aperte e richiuse, nel
   profilo non deve esserci comparso niente. */
const settings = await page.evaluate(async () => {
  const p = await window.__profilo?.()
  return p ? p.settings : null
}).catch(() => null)
if (settings) {
  uguale('dopo tutto questo guardare, nessun ritocco è comparso',
         Object.keys(settings.ritocchi || {}).length, 0)
}
uguale('e nessuna riga si è colorata',
       await page.locator('[data-manopola] .voce-riga.ritoccata').count(), 0)

uguale('nessun errore in console', errori.length, 0, errori.join(' | '))
await browser.close()
riassunto('il quadro di un\'età, col dito')
