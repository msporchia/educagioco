/* ═══════════════════════════════════════════════════════════════════
   SURVIVORS — LA PARTITA LASCIATA A METÀ, COL DITO

   Il test unitario gioca le nove tappe e prova che un salvataggio si
   rilegge; questo dice che **il giro completo funziona dall'archivio
   vero**: si esce a metà, la mappa offre la partita in sospeso, si
   riprende e si ritrova l'orologio dov'era. Quel pezzo passa dal
   profilo, e il test unitario non lo tocca.

   Le due cose che si provano e che da fuori non somigliano a un
   salvataggio:

   - **il campo ripreso si vede.** Tornando alla mappa il `v-if` smonta
     il campo, quindi la partita ripresa trova *un altro canvas*: un
     pittore rimasto agganciato al primo continuerebbe a dipingere su
     una tela staccata dal DOM. Nessun errore, niente di rotto in
     nessun altro controllo — solo lo schermo nero.
   - **il campo ripreso sta fermo** finché non lo si tocca. Chi riapre
     il gioco sta ancora guardando dov'era rimasto, e la marea non
     aspetta nessuno.

   Si gioca con le frecce e non col dito: qui non c'è nessun pannello
   che si apre da un `pointerup`, quindi il fantasma del click non
   c'entra e la tastiera dice le stesse cose in metà tempo.
   `node test/esegui.mjs survivors --niente-build`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { settings: { eta: 8 } })

/* l'orologio del cruscotto: prima del traguardo conta alla rovescia, ed
   è il modo più diretto di chiedere «a che punto era questa partita» */
const quandoSiamo = () => page.locator('.sv-gettone').first().textContent()
const secondi = async () => {
  const [m, s] = (await quandoSiamo()).replace(/\D+/, '').split(':')
  return Number(m) * 60 + Number(s)
}
/* si gioca davvero per qualche secondo, con le frecce */
async function gioca(ms) {
  await page.keyboard.down('ArrowRight')
  await attendi(page, ms)
  await page.keyboard.up('ArrowRight')
}

/* ---------- 1. si entra e si gioca un pezzo ---------- */
const carta = page.locator('.carta.gioco[data-gioco="survivors"]')
uguale('la carta è in home', await carta.count(), 1)
await carta.click()
await page.waitForSelector('.sv-mappa', { timeout: 5000 })
await page.locator('.sv-tappa[data-tappa="0"]').click()
await page.waitForSelector('.sv-tela', { timeout: 5000 })
await gioca(3000)
const aMeta = await secondi()
controlla('dopo qualche secondo l\'orologio è sceso', aMeta > 0 && aMeta < 44,
          `mancano ${aMeta}s`)

/* ---------- 2. si esce, e la partita resta lì ---------- */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.sv-mappa', { timeout: 5000 })
uguale('uscendo a metà la partita resta in sospeso',
       await page.locator('[data-ripresa]').count(), 1)
controlla('e la carta dice quanto manca',
          (await page.locator('.sv-ripresa .sv-dove').textContent()).includes('mancano'))

/* ---------- 3. cominciarne un'altra avverte ----------
   Il dito di un bambino sulla mappa ci finisce comunque, e quello che
   si perde sono le carte già pagate rispondendo. */
await page.locator('.sv-tappa[data-tappa="0"]').click()
await page.waitForSelector('.sv-modale', { timeout: 3000 })
controlla('toccare una tappa avendo una partita a metà chiede prima',
          await page.locator('[data-azione="comincia"]').count() === 1)
await page.locator('[data-azione="riprendi-invece"]').click()
await page.waitForSelector('.sv-tela', { timeout: 5000 })

/* ---------- 4. si riprende da dove si era ---------- */
uguale('il campo ripreso aspetta un tocco', await page.locator('[data-attesa]').count(), 1)
const ripreso = await secondi()
controlla('e l\'orologio è quello di prima', Math.abs(ripreso - aMeta) <= 1,
          `mancano ${ripreso}s invece di ${aMeta}s`)

/* il campo ripreso si disegna davvero: un canvas nero non dà nessun
   errore e sembra a posto in ogni altro controllo */
await attendi(page, 400)
const acceso = await page.evaluate(() => {
  const c = document.querySelector('.sv-tela')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let n = 0
  for (let i = 0; i < d.length; i += 160) if (d[i] > 24 || d[i + 1] > 24) n++
  return n
})
controlla('e si vede', acceso > 200, `${acceso} campioni accesi`)

/* ---------- 5. sta fermo finché non lo tocchi, e poi riparte ---------- */
await attendi(page, 1500)
uguale('il tempo non passa mentre aspetta', await secondi(), ripreso)
/* tre secondi e non uno: il tetto della giostra (50 ms) fa perdere
   tempo quando un fotogramma è lento, e in un browser senza schermo
   succede — un secondo solo non basta a far girare la cifra */
await gioca(3000)
uguale('e il cartello sparisce al primo dito', await page.locator('[data-attesa]').count(), 0)
const ripartito = await secondi()
controlla('l\'orologio riparte', ripartito < ripreso, `${ripartito}s contro ${ripreso}s`)
nota(`ripresa a ${aMeta}s dal traguardo, ripartita fino a ${ripartito}s`)

/* ---------- 6. e si può anche lasciar perdere ---------- */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.sv-mappa', { timeout: 5000 })
await page.locator('[data-azione="scorda"]').click()
await attendi(page, 300)
uguale('lasciata perdere, la carta sparisce', await page.locator('[data-ripresa]').count(), 0)
await page.locator('.sv-tappa[data-tappa="0"]').click()
await page.waitForSelector('.sv-tela', { timeout: 5000 })
uguale('e si ricomincia senza che nessuno chieda niente',
       await page.locator('.sv-modale').count(), 0)
uguale('da capo', await page.locator('[data-attesa]').count(), 0)
controlla('con tutto l\'orologio davanti', await secondi() >= 43)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('survivors — la partita lasciata a metà, col dito')
