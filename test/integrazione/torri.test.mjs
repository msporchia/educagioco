/* ═══════════════════════════════════════════════════════════════════
   IL CASTELLO NEL BROWSER: LA PAUSA, E LA BARRA CHE NON SFONDA

   perché: in battaglia il ⏸ ferma nemici e castello, il click fantasma non toglie il velo, e a 360 px la barra tiene tutti i tasti
   a parte perché: parte da una battaglia in corso; torri-figure prova come si vede il campo, e questo è piccolo (127 righe) (candidato a fondersi con torri-figure)

   Al telefono e allo schermo grande: in battaglia il ⏸ ferma i nemici
   e il castello, il click che il dito si lascia dietro non toglie il
   velo, e a 360 px la barra tiene tutti i suoi tasti. Le misure del
   motore che prima stavano qui e si stampavano soltanto (l'attesa fra
   le ondate, la velocità, i potenziamenti, il dito sul campo, i segni
   delle operazioni) stanno in `verifiche/torri-motore`; i generatori delle
   operazioni in `unita/torri-colonne`.
   `node test/esegui.mjs integrazione/torri --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, attendi, scatto, SCATTI_ACCESI, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ il gioco nel browser (i generatori delle operazioni: `unita/torri-colonne`) ══════════ */
const browser = await apriBrowser()
const errori = []
const raccolti = []   // [nome dello schermo, elenco che si riempie da sé]

for (const [nome, size] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 800 }]]) {
  /* dagli helper e non a mano: è lì che sta il giocatore di prova, senza
     il quale l'app si ferma a chiedere «come ti chiami?» */
  const { page, errori: suoi } = await apriGioco(browser, { viewport: size })
  /* l'elenco si riempie mentre il test va avanti: si tiene il riferimento
     e si legge alla fine, copiarlo adesso vorrebbe dire copiarlo vuoto */
  raccolti.push([nome, suoi])
  await scegli(page, 'torri')
  await page.waitForSelector('.tappe')

  /* ══════ la pausa ══════
     Il campo camminava sempre: il `?` lo fermava già, ma non c'era modo
     di fermarsi **volendo**, e soprattutto il telefono posato lo
     lasciava correre. È il gioco dove costa di più, perché è l'unico
     dove si sta fermi a fare una divisione in colonna: chi metteva giù
     il telefono a metà conto lo ritrovava con l'ondata passata.

     La misura è la strada fatta dai nemici (`d`, metri percorsi): si
     somma su tutti, così un nemico che arriva in fondo non fa sparire
     il numero da guardare. */
  const passi = () => page.evaluate(() => {
    const T = window.__td
    return { quanti: T.nemici().length, cuori: T.hud.cuori,
             strada: Math.round(T.nemici().reduce((s, n) => s + n.d, 0)) }
  })
  const veli = () => page.locator('[data-pausa]').count()

  /* Una tappa pulita, una torre in piedi e l'ondata chiamata a mano.
     La torre non è un vezzo: senza, `inAttesa()` è falsa e l'ondata non
     parte — né a comando né da sola. È la promessa della prima tappa,
     che non manda nessuno finché non c'è qualcuno a difendere. */
  await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.inizia(0)
    await attesa(150)
    while (T.velocita.value !== 1) T.cambiaVelocita()   // a 1×: la misura resta leggibile
    T.scegliTorre('add')
    await attesa(80)
    T.operazioneFinita({ errori: 0, ms: 900 })
    await attesa(150)
    T.chiamaOnda()
  })

  /* Il ⏸ si aspetta invece di contarlo subito, e l'attesa dice una cosa
     vera: costruire una torre può far scattare un traguardo, e sotto
     quel cartello il ⏸ non c'è — il campo è già fermo dietro un velo
     suo, e due veli uno sull'altro sono un gioco rotto. */
  await page.waitForSelector('button[aria-label="pausa"]', { timeout: 9000 })
  uguale(`[${nome}] in battaglia il ⏸ c'è`,
         await page.locator('button[aria-label="pausa"]').count(), 1)
  // il primo nemico nasce prima dell'inizio della strada (metri negativi): si aspetta che ci entri, non un tempo fisso
  let camminando = await passi()
  for (let k = 0; k < 25 && camminando.strada <= 0; k++) { await attendi(page, 200); camminando = await passi() }
  controlla(`[${nome}] e i nemici camminano`, camminando.strada > 0,
            `${camminando.quanti} nemici, ${camminando.strada} metri`)

  await page.locator('button[aria-label="pausa"]').click()
  uguale(`[${nome}] il velo compare`, await veli(), 1)
  /* il fantasma: il dito che ha premuto ⏸ si lascia dietro un click, che
     arriva a chi sta sotto **in quel momento**, cioè al velo appena
     nato, che si toglierebbe da solo */
  await page.evaluate(() => document.querySelector('[data-azione="riprendi"]')?.click())
  uguale(`[${nome}] il click che il dito si lascia dietro non la toglie`, await veli(), 1)

  const fermi = await passi()
  await attendi(page, 1500)
  const ancora = await passi()
  uguale(`[${nome}] e i nemici non fanno un metro`, ancora.strada, fermi.strada)
  uguale(`[${nome}] né il castello perde un cuore`, ancora.cuori, fermi.cuori)
  controlla(`[${nome}] la pausa dice a che ondata si era`,
            /ondata/.test(await page.locator('[data-pausa]').textContent()))
  await scatto(page, `torri-pausa-${nome}`)

  /* passata la finestra cieca il tocco vale, e la battaglia riprende */
  await page.locator('[data-azione="riprendi"]').click()
  uguale(`[${nome}] il velo sparisce`, await veli(), 0)
  await attendi(page, 900)
  const ripartiti = await passi()
  controlla(`[${nome}] e la battaglia riparte`, ripartiti.strada !== fermi.strada,
            `${ripartiti.strada} metri contro ${fermi.strada}`)

  /* il ⏸ è il sesto tondo di una barra che nel castello porta anche i
     gettoni: è già successo una volta che il tasto per tornare indietro
     finisse fuori dallo schermo, ed è il motivo per cui la barra è una
     sola */
  await page.setViewportSize({ width: 360, height: 640 })
  await attendi(page, 400)
  const barra = await page.evaluate(() => {
    const b = document.querySelector('.barra-app')
    return { fuori: b.scrollWidth - b.clientWidth,
             tasti: [...b.querySelectorAll('button')].map(t => t.getAttribute('aria-label'))
                      .filter(Boolean) }
  })
  controlla(`[${nome}] a 360 px la barra del castello non sfonda`, barra.fuori <= 0,
            `${barra.fuori} px di troppo`)
  stessaLista(`[${nome}] e i tasti ci sono tutti, nell'ordine di sempre`, barra.tasti,
              ['indietro', 'pausa', 'aiuto', 'suono'])

  await page.close()
}

for (const [nome, suoi] of raccolti) errori.push(...suoi.map(e => `[${nome}] ${e}`))
uguale('nessun errore in console', errori.join(' · '), '')
console.log(errori.length ? 'ERRORI:\n' + errori.join('\n') : 'nessun errore JS')
await browser.close()
riassunto('il castello: la pausa, e la barra che non sfonda')
