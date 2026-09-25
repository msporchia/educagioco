/* Il castello: il cuore del gioco è che ogni torre si paga con un'operazione
   in colonna, non con un tasto «compra». Si tocca una piazzola libera, si
   sceglie l'arciere e si preme la tastiera una cifra alla volta leggendo i
   passi attesi da `T.op.value.passi`: mai una cifra scritta a mano, così la
   clip regge se la scaletta delle operazioni cambia. La prima torre nasce a
   ritmo umano (~300 ms a cifra), la seconda più in fretta — il gioco si
   impara, e la seconda paga si fa più veloce della prima — poi arriva
   l'ondata (`T.chiamaOnda`).

   La prima torre nasce sulla piazzola più vicina al castello (è
   `T.liberi()[0]`, come nei test), cioè lontana da dove i mostri entrano:
   a velocità normale la clip finirebbe prima che il primo colpo parta.
   Si alza `T.velocita` (lo stesso ⏩ della barra) subito dopo l'ondata,
   cosa che un giocatore fa davvero, così nel tempo che resta si vede
   anche lo scontro e non solo l'avvicinarsi.

   I gesti che si vedono sono tocchi veri, perché il cerchietto dei tocchi
   (`mostraITocchi` in `scatti.mjs`) li segni: la piazzola si tocca sul
   canvas nel punto che dà `T.versoLoSchermo` (lo stesso conto di
   `integrazione/torri`), la torre su `[data-torre]`, le cifre sulla
   `.tastiera`. Dal gancio `window.__td` si leggono solo i fatti (`liberi`,
   `postazioni`, `op`) e si fanno le cose che nel filmato non sono un tocco
   (`inizia`, `chiamaOnda`, `velocita`): se uno di questi cambia forma, è
   qui che va aggiornata la ricetta. */
const attesa = ms => new Promise(r => setTimeout(r, ms))

/* una torre: la piazzola, la carta dell'arciere, il conto cifra per cifra */
async function costruisci (page, ritmo) {
  const punto = await page.evaluate(() => {
    const T = window.__td
    const i = T.liberi()[0]
    if (i === undefined) return null
    const p = T.postazioni()[i]
    return T.versoLoSchermo(p.x, p.y)
  })
  const tela = await page.locator('canvas').first().boundingBox()
  if (!punto || !tela) return false
  await page.mouse.click(tela.x + punto.x, tela.y + punto.y)
  await attesa(ritmo)
  if (!await page.locator('[data-torre="add"]').click({ timeout: 1500 }).then(() => true, () => false))
    return false
  await attesa(ritmo)
  const cifre = await page.evaluate(() => window.__td.op.value?.passi.map(p => p.atteso) || [])
  for (const c of cifre) {
    await page.evaluate(c => [...document.querySelectorAll('.tastiera button')]
      .find(b => +b.textContent === c)?.click(), c)
    await attesa(ritmo)
  }
  return cifre.length > 0
}

export default {
  file: 'clip-castello', dove: 'torri', attesa: '.tappe',
  /* la prima tappa, cominciata prima di registrare: l'energia resta
     quella vera — la si legge in cima allo schermo, e un 999 sarebbe un
     gioco che non esiste. Se l'equilibrio un giorno non paga più due
     torri, la seconda semplicemente non nasce. */
  passi: [['.tap:not(.chiusa)', 1500],
          async page => { await page.evaluate(() => window.__td.inizia(0)); await attesa(1200) }],
  clip: {
    secondi: 8,
    async durante (page) {
      await attesa(300)                          // il campo si vede, poi si tocca
      await costruisci(page, 300)                 // la prima torre: a ritmo umano
      await attesa(400)
      await costruisci(page, 140)                 // la seconda: più svelta, si è capito il gioco
      await attesa(300)
      await page.evaluate(() => {
        window.__td.chiamaOnda()
        window.__td.velocita.value = 2            // ⏩: i mostri arrivano in tempo per lo scontro
      })
      await attesa(4500)                          // l'ondata arriva e le torri sparano
    },
  },
}
