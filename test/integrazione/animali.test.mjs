/* ═══════════════════════════════════════════════════════════════════
   LA CAMERETTA, GIOCATA DAVVERO

   Le regole (fame, prezzi, doppioni) sono già provate senza browser da
   `unita/animali` e `unita/capsule`. Qui si prova quello che quei test
   non possono vedere: che i gesti arrivino allo schermo, che quello che
   si compra sopravviva a una ricarica, e che dalla stanza si riesca a
   uscire.

   Da quando cameretta, negozio e animali sono una stanza sola, la
   navigazione È il disegno: si entra nel negozio dalla porta, si tocca
   la macchina per le sorprese, si tocca un animale per occuparsene. Sono
   tre bersagli disegnati, e se uno smette di rispondere non c'è più
   nessun elenco di riserva da cui arrivarci: per questo si provano tutti
   e tre.

   Due punti valgono più degli altri, perché sono già stati rotti:

   · IL SALVATAGGIO. Aprire una capsula si paga: se il gesto non arriva
     su disco, quelle monete sono buttate. È già successo — `apriCapsula`
     chiamava `flush()` senza `persist()`, e `flush()` scrive solo quello
     che `save()` ha accodato, cioè niente.

   · LO SCORRIMENTO DEL NEGOZIO. `.centro` è una colonna flex centrata:
     quello che non ci sta finisce SOPRA l'inizio dell'area scrollabile,
     dove nessuna barra ci arriva più. Su una finestra alta non si vede —
     il negozio ci sta tutto — quindi quella parte si prova a misura di
     telefono.

   ATTENZIONE ai controlli sulle monete: il salvadanaio non lo muove solo
   la spesa. Adottare fa scattare "Famiglia" e il "Salvadanaio", che ne
   rimettono dentro. Perciò il prelievo secco si misura su un acquisto
   che non premia nessuno.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { uguale, controlla, nota, riassunto } from '../aiuto/verifica.mjs'

/* la scheda di un animale è alta: per arrivare in fondo senza scorrere di
   continuo si gioca su una finestra generosa, e si torna al telefono per
   la parte in cui la misura dello schermo È la cosa da provare */
const ALTA = { width: 430, height: 1500 }

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: ALTA })
await azzera(page)
await page.goto((await page.url()).split('#')[0] + '#monete=3000')
await page.waitForSelector('.carte', { timeout: 10000 })
await attendi(page, 400)

const monete = () => page.locator('.gettone b').innerText().then(Number)
/* dove siamo: in casa lo dice la barra in cima, fuori ci sono le carte */
const dove = async () => {
  if (await page.locator('.carte').count()) return 'home'
  return (await page.locator('.barra-app .dove').innerText()).trim()
}
const tocca = (nome, opzioni) => page.getByRole('button', { name: nome }).click(opzioni)

await tocca(/La cameretta/)
await attendi(page, 400)

/* ══════════ 1. la stanza appena aperta ══════════ */
const prima = await monete()
controlla('le monete di scorta sono arrivate', prima >= 3000, `ne vedo ${prima}`)
uguale('ci sono tre posti sul tappeto', await page.locator('.posto').count(), 3)
uguale('e sono tutti e tre liberi', await page.locator('.posto.libero').count(), 3)
/* il posto vuoto non è un punto interrogativo: è la sagoma di chi manca,
   col nome e quanto costa */
uguale('e si vedono le tre sagome', await page.locator('.fantasma svg.bestia').count(), 3)
const cartellini = (await page.locator('.chi-manca').allInnerTexts()).join(' / ')
controlla('con nome e prezzo di ciascuno',
          /Watson.*40.*Sherlock.*70.*Irene.*70/s.test(cartellini), cartellini)

/* ══════════ 2. adottare, entrando dalla porta ══════════ */
await page.locator('.porta').click()
await attendi(page, 350)
uguale('la porta porta al negozio', await dove(), 'Negozio')
await page.locator('.reparti button').nth(1).click()
await attendi(page, 250)

const cartellino = await page.locator('.adozione', { hasText: 'Watson' }).locator('.prezzo').innerText()
controlla('Watson è in vetrina a 40 🪙', cartellino.includes('40'), cartellino)
await tocca(/Watson.*bobtail/s)
await attendi(page, 400)
uguale('adottato, si torna nella stanza', await dove(), 'La cameretta')
uguale('e il posto libero è diventato Watson', await page.locator('.posto.libero').count(), 2)
uguale('il disegno di Watson è sul tappeto', await page.locator('.posto:not(.libero) svg.bestia').count(), 1)
/* nella stanza si dice UNA cosa sola, con un'icona: le barre e le parole
   stanno nella scheda, e tre animali con quattro barrette ciascuno erano
   dodici numeri addosso a un disegno */
uguale('nella stanza non ci sono barre', await page.locator('.posto .sbarra').count(), 0)

/* ══════════ 3. comprare e usare, un bisogno per volta ══════════ */
await page.locator('.porta').click()
await attendi(page, 300)
await page.locator('.reparti button').nth(1).click()
await attendi(page, 250)
const primaDellaSpesa = await monete()
for (const nome of ['Pollo', 'Palla', 'Spazzola', 'Carota']) {
  await page.locator('.scheda', { hasText: nome }).first().click()
  await attendi(page, 150)
}
// pollo 4 + palla 7 + spazzola 4 + carota 5, e comprare non premia nessuno
uguale('la spesa toglie esattamente 20 🪙', await monete(), primaDellaSpesa - 20)

await page.locator('.barra-app button[aria-label="indietro"]').click()
await attendi(page, 300)
await page.locator('.posto:not(.libero)').click()
await attendi(page, 400)
uguale('toccando l\'animale si apre la sua scheda', await dove(), 'Watson')
uguale('con le sue quattro barre', await page.locator('.cartellino .sbarra').count(), 4)

/* i quattro riquadri devono DIRE di cosa si tratta: quattro barrette senza
   nome si guardano e non si capiscono, ed è il motivo per cui esistono */
const bisogni = page.locator('.bisogno:not(.vestiti)')
uguale('ci sono quattro riquadri', await bisogni.count(), 4)
const nomi = await bisogni.locator('.testa-bisogno b').allInnerTexts()
uguale('e dicono quale bisogno sono', nomi.join(',').toLowerCase(), 'pancia,allegria,pulito,forma')
const frasi = await bisogni.locator('.testa-bisogno i').allInnerTexts()
controlla('ognuno dice come sta a parole', frasi.length === 4 && frasi.every(f => f.length > 5),
          frasi.join(' / '))
nota('per esempio:', frasi.join(' · '))

const barre = () => page.locator('.cartellino .sbarra i').evaluateAll(
  els => els.map(e => Math.round(parseFloat(e.style.width))))
const bPrima = await barre()
// ogni porzione usata sparisce dalla dispensa: si ripesca sempre la prima
for (let i = 0; i < 4; i++) {
  await page.locator('.piatto').first().click()
  await attendi(page, 1500)
}
const bDopo = await barre()
controlla('tutte e quattro le barre sono salite', bDopo.every((v, i) => v > bPrima[i]),
          `${bPrima} → ${bDopo}`)
uguale('e la dispensa si è svuotata', await page.locator('.piatto').count(), 0)
await scatto(page, 'animali-scheda')

/* ══════════ 4. la macchina delle sorprese ══════════ */
await page.locator('.barra-app button[aria-label="indietro"]').click()
await attendi(page, 300)
await page.locator('.macchina').click()
await attendi(page, 350)
uguale('la macchina si tocca dalla stanza', await dove(), 'Sorprese')
controlla('la prima capsula è in regalo',
          (await page.locator('.capsula .prezzo').innerText()).includes('regalo'))
const soldiPrima = await monete()
await page.locator('.capsula').click()
await attendi(page, 600)
uguale('esce un pezzo', await page.locator('.carta-sorpresa').count(), 1)
nota('è uscito:', await page.locator('.carta-sorpresa b').innerText())
uguale('e non è costato niente', await monete(), soldiPrima)
await page.locator('.colpo').click()
await attendi(page, 250)
uguale('la vetrina lo mostra', await page.locator('.pezzo.mio').count(), 1)
uguale('e il contatore lo conta', await page.locator('.conta').innerText(), '1 di 12')

await page.locator('.capsula').click()
await attendi(page, 500)
await page.locator('.colpo').click()
await attendi(page, 250)
uguale('la seconda si paga', await monete(), soldiPrima - 30)
uguale('due pezzi diversi in vetrina', await page.locator('.pezzo.mio').count(), 2)

/* ══════════ 5. i vestiti, in coda ai bisogni ══════════ */
await page.locator('.barra-app button[aria-label="indietro"]').click()
await attendi(page, 300)
await page.locator('.posto:not(.libero)').click()
await attendi(page, 400)
uguale('i riquadri sono cinque', await page.locator('.bisogni > .bisogno').count(), 5)
controlla('e l\'ultimo è quello dei vestiti',
          await page.locator('.bisogni > .bisogno').last().evaluate(
            el => el.classList.contains('vestiti')))
// il punto: vestire NON deve nascondere i bisogni, come faceva l'interruttore
uguale('i bisogni restano tutti visibili', await page.locator('.bisogno:not(.vestiti)').count(), 4)

uguale('ci sono due capi nell\'armadio', await page.locator('.capo').count(), 2)
await page.locator('.capo').first().click()
await attendi(page, 300)
uguale('il capo risulta scelto', await page.locator('.capo.addosso').count(), 1)
uguale('e compare sul disegno grande', await page.locator('.vetrina svg text.addosso').count(), 1)
await page.locator('.capo.addosso').click()
await attendi(page, 300)
uguale('ritoccandolo si toglie', await page.locator('.vetrina svg text.addosso').count(), 0)
await page.locator('.capo').first().click()
await attendi(page, 300)
uguale('e si rimette', await page.locator('.vetrina svg text.addosso').count(), 1)
// e si rivede anche di là, sul tappeto
await page.locator('.barra-app button[aria-label="indietro"]').click()
await attendi(page, 350)
uguale('l\'accessorio si vede anche nella stanza',
       await page.locator('.posto svg text.addosso').count(), 1)

/* ══════════ 6. lo slider fra gli animali ══════════ */
await page.locator('.porta').click()
await attendi(page, 300)
await page.locator('.reparti button').nth(1).click()
await attendi(page, 250)
await tocca(/Sherlock.*tuxedo/s)
await attendi(page, 400)
await page.locator('.posto:not(.libero)').first().click()
await attendi(page, 400)
uguale('si apre Watson', await dove(), 'Watson')
uguale('e adesso i pallini sono due', await page.locator('.punto').count(), 2)
await page.getByRole('button', { name: 'animale successivo' }).click()
await attendi(page, 450)
uguale('la freccia porta a Sherlock', await dove(), 'Sherlock')
uguale('il pallino acceso è il secondo',
       await page.locator('.punto').nth(1).evaluate(el => el.classList.contains('on')), true)
await page.getByRole('button', { name: 'animale precedente' }).click()
await attendi(page, 450)
uguale('e si torna indietro a Watson', await dove(), 'Watson')

/* ══════════ 7. dopo una ricarica ══════════
   il salvataggio è accorpato con 350 ms di ritardo: ricaricare prima
   proverebbe il debounce, non la persistenza */
await attendi(page, 600)
const monetePrima = await monete()
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
await attendi(page, 400)
await tocca(/La cameretta/)
await attendi(page, 400)
uguale('le monete sono rimaste', await monete(), monetePrima)
uguale('gli animali adottati sono ancora lì', await page.locator('.posto:not(.libero)').count(), 2)
uguale('con addosso il loro accessorio', await page.locator('.posto svg text.addosso').count(), 1)
await page.locator('.macchina').click()
await attendi(page, 350)
uguale('e la collezione è salva', await page.locator('.pezzo.mio').count(), 2)

/* ══════════ 8. andare e tornare, a misura di telefono ══════════ */
await page.setViewportSize(TELEFONO)
await page.locator('.barra-app button[aria-label="indietro"]').click()
await attendi(page, 300)
await page.locator('.porta').click()
await attendi(page, 400)

const misura = () => page.evaluate(() => {
  const c = document.querySelector('.centro'), t = document.querySelector('.reparti')
  return { scrollabile: c.scrollHeight - c.clientHeight,
           diff: Math.round(t.getBoundingClientRect().top - c.getBoundingClientRect().top) }
})
const su = await misura()
controlla('su un telefono il negozio deve scorrere davvero', su.scrollabile > 0,
          `scrollabile ${su.scrollabile}px`)
controlla('e i banchi non finiscono sopra l\'area visibile', su.diff >= -20, `distano ${su.diff}px`)

await page.evaluate(() => { document.querySelector('.centro').scrollTop = 99999 })
await attendi(page, 300)
const giu = await misura()
controlla('restano in cima anche scorrendo in fondo', giu.diff < 30, `distano ${giu.diff}px`)
await scatto(page, 'animali-negozio-in-fondo')

await page.locator('.reparti button').nth(1).click()
await attendi(page, 350)
uguale('cambiando banco si riparte dall\'alto',
       await page.evaluate(() => document.querySelector('.centro').scrollTop), 0)

// la freccia torna indietro di un passo, non a casa
await tocca('indietro')
await attendi(page, 300)
uguale('← dal negozio riporta nella stanza', await dove(), 'La cameretta')
await scatto(page, 'cameretta')
await tocca('indietro')
await attendi(page, 350)
uguale('← dalla stanza esce davvero', await dove(), 'home')

const sottotitolo = await page.locator('.carta.room i').innerText()
controlla('e la home dice come stanno', sottotitolo.length > 3, sottotitolo)
nota('la home dice:', sottotitolo)

controlla('nessun errore in pagina', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('La cameretta')
