/* ═══════════════════════════════════════════════════════════════════
   LA CAMERETTA, GIOCATA DAVVERO

   Le regole (fame, prezzi, diete, rifugio) sono già provate senza
   browser da `unita/animali` e `unita/capsule`. Qui si prova quello che
   quei test non possono vedere: che i gesti arrivino allo schermo, che
   quello che si compra sopravviva a una ricarica, e che dalla stanza si
   riesca a uscire.

   Da quando cameretta, negozio e animali sono una stanza sola, la
   navigazione È il disegno: si entra nel negozio dalla porta, si tocca
   la macchina per le sorprese, si tocca un animale per occuparsene. Sono
   tre bersagli disegnati, e se uno smette di rispondere non c'è più
   nessun elenco di riserva da cui arrivarci: per questo si provano tutti
   e tre.

   Tre punti valgono più degli altri, perché sono già stati rotti o
   perché sono la parte nuova:

   · IL SALVATAGGIO. Aprire una capsula si paga: se il gesto non arriva
     su disco, quelle monete sono buttate. È già successo — `apriCapsula`
     chiamava `flush()` senza `persist()`, e `flush()` scrive solo quello
     che `save()` ha accodato, cioè niente.

   · LO SCORRIMENTO DEL NEGOZIO. `.centro` è una colonna flex centrata:
     quello che non ci sta finisce SOPRA l'inizio dell'area scrollabile,
     dove nessuna barra ci arriva più. Su una finestra alta non si vede —
     il negozio ci sta tutto — quindi quella parte si prova a misura di
     telefono.

   · I QUATTRO POSTI. Adottare è un gesto in due tempi (il nome, e se la
     casa è piena chi va al rifugio), e nessuno dei due deve poter
     lasciare la cameretta con un buco o il salvadanaio vuoto per
     niente.

   ATTENZIONE ai controlli sulle monete: il salvadanaio non lo muove solo
   la spesa. Adottare fa scattare "Famiglia" e il "Salvadanaio", che ne
   rimettono dentro. Perciò il prelievo secco si misura su un acquisto
   che non premia nessuno.

   Le attese fisse dopo un gesto (`attendi(page, N)`) proteggono per lo
   più una transizione fra stanze o l'apertura/chiusura di un cartello:
   sono tante — un censimento (`docs/tempi-dei-test.md`) ne conta 58 — ma
   non sono tutte uguali, e riscriverle a occhio senza guardare ogni
   animazione una per una rischia di rendere il test capriccioso invece
   che veloce (l'unico scambio che *non* vale la pena: un test che a volte
   passa e a volte no costa più caro di uno lento e affidabile). Dov'era
   ovvio sostituire un'attesa con una condizione l'abbiamo fatto (il ciclo
   che dà da mangiare, qui sotto, sonda la dispensa invece di dormire 1500
   ms per quattro volte); il resto resta così finché non tocca davvero
   questo file — che oggi non è più il prezzo di ogni `npm test`, vedi
   `test/README.md`.
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
const annuncio = () => page.locator('.annuncio').innerText()

/* il negozio, banco degli animali: ci si torna un sacco di volte */
async function alBancoAnimali() {
  await page.locator('.porta').click()
  await attendi(page, 350)
  await page.locator('.reparti button').nth(1).click()
  await attendi(page, 300)
}

/* adottare in due tempi: si tocca la carta, si scrive il nome, si conferma */
async function adotta(chi, nome, esce = null) {
  await page.locator('.adozione', { hasText: chi }).first().click()
  await attendi(page, 300)
  if (nome) await page.locator('.cartello input').fill(nome)
  if (esce) {
    await page.locator('.chi-esce', { hasText: esce }).click()
    await attendi(page, 150)
  }
  await page.locator('.cartello .ok').click()
  await attendi(page, 450)
}

await tocca(/La cameretta/)
await attendi(page, 400)

/* ══════════ 1. la stanza appena aperta ══════════ */
const prima = await monete()
controlla('le monete di scorta sono arrivate', prima >= 3000, `ne vedo ${prima}`)
uguale('ci sono quattro posti sul tappeto', await page.locator('.posto').count(), 4)
uguale('e sono tutti e quattro liberi', await page.locator('.posto.libero').count(), 4)
/* il posto vuoto non è un punto interrogativo: è la sagoma di chi
   potrebbe starci, col nome e quanto costa */
uguale('e si vedono quattro sagome', await page.locator('.fantasma svg.bestia').count(), 4)
const cartellini = (await page.locator('.chi-manca').allInnerTexts()).join(' / ')
controlla('a partire dal più economico', /Bolla/.test(cartellini), cartellini)
nota('in vetrina:', cartellini)

/* ══════════ 2. adottare, entrando dalla porta ══════════ */
await alBancoAnimali()
uguale('la porta porta al negozio', await dove(), 'Negozio')
const cartellino = await page.locator('.adozione', { hasText: 'Watson' }).locator('.prezzo').innerText()
controlla('Watson è in vetrina col suo prezzo', /\d{2,}/.test(cartellino), cartellino)
controlla('e il cartellino dice cosa mangia',
          (await page.locator('.adozione', { hasText: 'Watson' }).locator('.menu').innerText())
            .startsWith('mangia'))
/* il catalogo è diviso per famiglia: cani, gatti, pappagalli, pesci e
   bestie che non esistono */
controlla('ci sono almeno cinque famiglie di animali',
          await page.locator('.titolino').count() >= 5)
controlla('e più di dieci amici fra cui scegliere',
          await page.locator('.adozione').count() >= 10)

/* il nome lo sceglie chi adotta: è l'unica cosa di un animale che è sua */
await page.locator('.adozione', { hasText: 'Watson' }).click()
await attendi(page, 300)
uguale('toccando un animale si apre il cartello', await page.locator('.cartello').count(), 1)
uguale('col nome già proposto',
       await page.locator('.cartello input').inputValue(), 'Watson')
await page.locator('.cartello .annulla').click()
await attendi(page, 250)
uguale('e si può cambiare idea', await page.locator('.cartello').count(), 0)

await adotta('Watson', 'Fuffi')
uguale('adottato, si torna nella stanza', await dove(), 'La cameretta')
uguale('e un posto libero è diventato Fuffi', await page.locator('.posto.libero').count(), 3)
uguale('il disegno è sul tappeto', await page.locator('.posto:not(.libero) svg.bestia').count(), 1)
/* nella stanza si dice UNA cosa sola, con un'icona: le barre e le parole
   stanno nella scheda, e quattro animali con quattro barrette ciascuno
   sarebbero sedici numeri addosso a un disegno */
uguale('nella stanza non ci sono barre', await page.locator('.posto .sbarra').count(), 0)

await page.locator('.posto:not(.libero)').click()
await attendi(page, 400)
uguale('e si chiama come ha deciso lui', await dove(), 'Fuffi')

/* rinominare: si tocca il nome e si riscrive */
await page.locator('.suo-nome').click()
await attendi(page, 250)
await page.locator('.campo-nome').fill('Watson')
await page.keyboard.press('Enter')
await attendi(page, 400)
uguale('il nome si può correggere', await dove(), 'Watson')

/* ══════════ 3. comprare e usare, un bisogno per volta ══════════ */
await page.locator('.barra-app button[aria-label="indietro"]').click()
await attendi(page, 300)
await alBancoAnimali()
const primaDellaSpesa = await monete()
for (const nome of ['Pollo', 'Palla', 'Spazzola', 'Carota']) {
  await page.locator('.scheda', { hasText: nome }).first().click()
  await attendi(page, 150)
}
// pollo 6 + palla 11 + spazzola 6 + carota 8, e comprare non premia nessuno
uguale('la spesa toglie esattamente 31 🪙', await monete(), primaDellaSpesa - 31)

/* Gli scaffali che non servono a nessuno dei tuoi restano da parte: con
   un cane in casa il sushi non si vede, e chi lo vuole lo va a cercare. */
uguale('il sushi non è in vista: in casa c\'è un cane',
       await page.locator('.scheda', { hasText: 'Nigiri' }).count(), 0)
await page.locator('.altro').click()
await attendi(page, 250)
controlla('ma gli altri scaffali si aprono a richiesta',
          await page.locator('.scheda', { hasText: 'Nigiri' }).count() === 1)
/* e se ne compra una porzione apposta, per provare a darla a un cane */
await page.locator('.scheda', { hasText: 'Nigiri' }).first().click()
await attendi(page, 200)

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
controlla('la pancia dice anche cosa mangia questo qui',
          (await page.locator('.menu').first().innerText()).includes('mangia'))

/* ── il sushi al cane: si vede, è spento, e provarci non costa niente ── */
uguale('il sushi comprato si vede lo stesso, spento',
       await page.locator('.piatto.storto').count(), 1)
await page.locator('.piatto.storto').click()
await attendi(page, 400)
controlla('e chi ci prova se lo sente dire', (await annuncio()).includes('non piace'),
          await annuncio())
uguale('la porzione resta in dispensa', await page.locator('.piatto.storto').count(), 1)

const barre = () => page.locator('.cartellino .sbarra i').evaluateAll(
  els => els.map(e => Math.round(parseFloat(e.style.width))))
const bPrima = await barre()
// ogni porzione usata sparisce dalla dispensa: si ripesca sempre la prima.
// La condizione c'è (la dispensa si accorcia di uno), quindi si sonda
// invece di dormire 1500 ms alla cieca quattro volte — il tetto resta lo
// stesso, così un rallentamento vero si vede ancora, non si nasconde
for (let i = 0; i < 4; i++) {
  const primaConta = await page.locator('.piatto:not(.storto)').count()
  await page.locator('.piatto:not(.storto)').first().click()
  await page.waitForFunction(
    n => document.querySelectorAll('.piatto:not(.storto)').length < n,
    primaConta, { timeout: 1500 }
  ).catch(() => {})  // se non scende, ci pensa l'asserzione sulle barre a dirlo
}
const bDopo = await barre()
controlla('tutte e quattro le barre sono salite', bDopo.every((v, i) => v > bPrima[i]),
          `${bPrima} → ${bDopo}`)
uguale('e la dispensa si è svuotata di quello che gli piace',
       await page.locator('.piatto:not(.storto)').count(), 0)
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
uguale('la seconda si paga', await monete(), soldiPrima - 45)
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
await alBancoAnimali()
await adotta('Sherlock', 'Sherlock')
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

/* ══════════ 7. i quattro posti, e il rifugio ══════════
   Il gesto delicato di tutta la cameretta: la casa è piena, ne arriva
   uno nuovo, e uno deve andare ad aspettare. Non si butta via nessuno e
   non si paga due volte. */
await page.locator('.barra-app button[aria-label="indietro"]').click()
await attendi(page, 300)
await alBancoAnimali()
await adotta('Bolla', 'Bolla')
await alBancoAnimali()
await adotta('Kiwi', 'Kiwi')
uguale('la cameretta è piena', await page.locator('.posto:not(.libero)').count(), 4)
uguale('e non ci sono più posti liberi', await page.locator('.posto.libero').count(), 0)
await scatto(page, 'cameretta-piena')

await alBancoAnimali()
await page.locator('.adozione', { hasText: 'Irene' }).click()
await attendi(page, 300)
controlla('a casa piena il cartello chiede chi lascia il posto',
          await page.locator('.chi-esce').count() === 4)
controlla('e non si conferma finché non lo si è scelto',
          await page.locator('.cartello .ok').isDisabled())
const primaDelloScambio = await monete()
await page.locator('.chi-esce', { hasText: 'Kiwi' }).click()
await attendi(page, 150)
await page.locator('.cartello .ok').click()
await attendi(page, 500)
uguale('lo scambio è avvenuto, e i posti restano quattro',
       await page.locator('.posto:not(.libero)').count(), 4)
/* si paga il nuovo e basta: salutare non costa. Il saldo può risalire un
   po' — i traguardi premiano — ma non deve mai scendere più del prezzo. */
const dopoLoScambio = await monete()
controlla('si è pagato il nuovo arrivato, e nient\'altro',
          dopoLoScambio < primaDelloScambio && dopoLoScambio >= primaDelloScambio - 105,
          `${primaDelloScambio} → ${dopoLoScambio}`)

await alBancoAnimali()
uguale('chi è uscito aspetta al rifugio', await page.locator('.adozione.mio').count(), 1)
const rientro = await page.locator('.adozione.mio .prezzo').innerText()
controlla('e riprenderlo costa una quota, non il prezzo pieno',
          /riprendilo/.test(rientro) && /\b[5-9]\b|\b1[0-9]\b/.test(rientro), rientro)
await page.locator('.adozione.mio').click()
await attendi(page, 300)
controlla('il suo nome non si tocca: torna com\'era',
          await page.locator('.cartello input').isDisabled())
await page.locator('.chi-esce', { hasText: 'Bolla' }).click()
await attendi(page, 150)
await page.locator('.cartello .ok').click()
await attendi(page, 500)
uguale('e torna a casa', await dove(), 'La cameretta')
const chiCe = (await page.locator('.posto:not(.libero)').evaluateAll(
  els => els.map(e => e.getAttribute('aria-label')))).join(' ')
controlla('al posto di chi è andato ad aspettare', chiCe.includes('Kiwi') && !chiCe.includes('Bolla'),
          chiCe)

/* ══════════ 8. dopo una ricarica ══════════
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
uguale('gli animali in casa sono ancora quattro',
       await page.locator('.posto:not(.libero)').count(), 4)
uguale('con addosso il loro accessorio', await page.locator('.posto svg text.addosso').count(), 1)
await page.locator('.macchina').click()
await attendi(page, 350)
uguale('e la collezione è salva', await page.locator('.pezzo.mio').count(), 2)
await page.locator('.barra-app button[aria-label="indietro"]').click()
await attendi(page, 300)
await alBancoAnimali()
uguale('e chi aspetta al rifugio aspetta ancora', await page.locator('.adozione.mio').count(), 1)

/* ══════════ 9. salutarne uno, senza comprarne un altro ══════════
   Prima l'unico modo di far uscire un amico dalla cameretta era
   adottarne uno nuovo: chi ne aveva quattro e ne voleva tre restava con
   quattro. Adesso il gesto sta in fondo alla sua scheda e passa da un
   cartello — e il rifugio non è un cestino: chi saluta resta adottato,
   col suo nome. */
await page.locator('.barra-app button[aria-label="indietro"]').click()
await attendi(page, 300)
const chiSaluta = await page.locator('.posto:not(.libero)').first().getAttribute('aria-label')
await page.locator('.posto:not(.libero)').first().click()
await attendi(page, 400)
await page.locator('.saluta').click()
await attendi(page, 300)
uguale('salutare passa da un cartello', await page.locator('.cartello').count(), 1)
await page.locator('.cartello .annulla').click()
await attendi(page, 250)
uguale('e annullare non muove niente', await page.locator('.cartello').count(), 0)

await page.locator('.saluta').click()
await attendi(page, 250)
await page.locator('.cartello .ok').click()
await attendi(page, 500)
uguale('confermando si torna nella stanza', await dove(), 'La cameretta')
uguale('e in cameretta ne resta uno in meno',
       await page.locator('.posto:not(.libero)').count(), 3)
await alBancoAnimali()
uguale('chi ha salutato aspetta al rifugio, non è sparito',
       await page.locator('.adozione.mio').count(), 2)
controlla('e ci aspetta col suo nome',
          (await page.locator('.adozione.mio').allInnerTexts()).join(' ').includes(chiSaluta),
          chiSaluta)

/* ══════════ 10. andare e tornare, a misura di telefono ══════════ */
await page.setViewportSize(TELEFONO)
await attendi(page, 300)

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

await page.locator('.reparti button').nth(0).click()
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
