/* Il castello: un campo già giocato a metà, con torri di tipi e livelli
   diversi — un cecchino alto, il ghiaccio, la catena, le bombe al napalm —
   e i draghi che arrivano. È la foce, l'ultima tappa della Palude, perché
   è la tappa che apre coi draghi: il drago è l'unico mostro coi passi
   veri (`mostro:drago:lato/fronte` in `giochi/castello/dati/figure.js`),
   in tutti i vestiti.

   Il cuore del gioco resta che ogni torre si paga con un'operazione in
   colonna, non con un tasto «compra»: prima dei draghi si costruisce
   ancora un arciere toccando una piazzola libera e premendo la tastiera
   una cifra alla volta, leggendo i passi attesi da `T.op.value.passi`
   (mai una cifra scritta a mano, così la clip regge se la scaletta delle
   operazioni cambia). Poi arriva l'ondata (`T.chiamaOnda`) e si alza la
   velocità (lo stesso ⏩ della barra), così nel tempo della clip i draghi
   entrano, scendono e le torri sparano.

   Le torri già in campo si mettono **prima di registrare**, dal motore
   (`costruisci` e `potenzia` a prezzo zero) sulle piazzole **di mezzo**:
   vicino alla bocca fermavano i draghi appena usciti, vicino al castello
   la clip finiva prima che ci arrivassero, e nessuna torre sparava.
   E sono torri che **possono** sparare: il drago è immune alle bombe e
   alla magica, quindi sui draghi lavorano arcieri e ghiaccio, e subito
   dopo si chiama la seconda ondata col tasto «Manda la prossima» — i
   troll, che solo le bombe feriscono — così lavora anche il mortaio, e
   nella clip si vede la chiamata anticipata.
   L'energia in cima allo schermo resta quella
   vera della tappa, e un 999 sarebbe un gioco che non esiste. Quali torri
   e che livelli lo dice `CAMPO` qui sotto.

   I gesti che si vedono sono tocchi veri, perché il cerchietto dei tocchi
   (`mostraITocchi` in `scatti.mjs`) li segni: la piazzola si tocca sul
   canvas nel punto che dà `T.versoLoSchermo` (lo stesso conto di
   `integrazione/torri`), la torre su `[data-torre]`, le cifre sulla
   `.tastiera`. Dal gancio `window.__td` si leggono solo i fatti e si fanno
   le cose che nel filmato non sono un tocco (`inizia`, le torri di
   partenza, `chiamaOnda`, `velocita`): se uno di questi cambia forma, è
   qui che va aggiornata la ricetta.

     npm run scatti clip-castello */
const attesa = ms => new Promise(r => setTimeout(r, ms))

const TAPPA = 'La foce'
// tipo, livello e ramo delle torri già in campo, dalla bocca in giù
// (dal castello in su, così i draghi fanno mezzo campo prima dello scontro)
const CAMPO = [
  { tipo: 'add', lv: 5, ramo: 'cecchino' },  // i draghi
  { tipo: 'mul', lv: 4, ramo: 'brina' },     // gela draghi e troll
  { tipo: 'div', lv: 5, ramo: 'mortaio' },   // i troll: i draghi volano e le bombe non li toccano
  { tipo: 'add', lv: 4, ramo: 'raffica' },   // i draghi
  { tipo: 'div', lv: 2 },                    // i troll
]

/* la tappa, e le torri già in piedi sulla strada dei draghi */
async function preparaIlCampo (page) {
  await page.evaluate(async ({ TAPPA, CAMPO }) => {
    const aspetta = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.inizia(T.TAPPE.findIndex(t => t.nome === TAPPA))
    await aspetta(1200)
    const m = T.motore()
    // le piazzole di mezzo, dall'alto in basso: fra il terzo e i tre
    // quarti del campo, dove le due strade si sono già unite o quasi
    const tutte = m.percorso.postazioni.map((p, i) => ({ ...p, i })).sort((a, b) => a.y - b.y)
    const mezzo = tutte.slice(Math.floor(tutte.length / 3))
    CAMPO.forEach(({ tipo, lv, ramo }, k) => {
      const posto = mezzo[k] ? mezzo[k].i : null
      const torre = m.costruisci(tipo, { posto })
      for (let l = 1; l < lv; l++) m.potenzia(torre, { ramo: l + 1 >= 4 ? ramo : null })
    })
  }, { TAPPA, CAMPO })
  await attesa(600)
}

/* una torre: la piazzola, la carta dell'arciere, il conto cifra per cifra */
async function costruisci (page, ritmo) {
  const punto = await page.evaluate(() => {
    const T = window.__td
    // a metà campo: vicino alla bocca fermerebbe i draghi appena usciti
    const lib = T.liberi().map(i => ({ i, y: T.postazioni()[i].y })).sort((a, b) => a.y - b.y)
    const i = lib.length ? lib[Math.floor(lib.length / 2)].i : undefined
    if (i === undefined) return null
    const p = T.postazioni()[i]
    return T.versoLoSchermo(p.x, p.y)
  })
  const tela = await page.locator('canvas').first().boundingBox()
  if (!punto || !tela) return false
  await page.mouse.click(tela.x + punto.x, tela.y + punto.y)
  await attesa(ritmo)
  /* col mouse sul punto e non con `locator.click`: quello scorre la pagina
     per portare in vista la carta, e la clip resterebbe scorsa di mezzo
     dito, con la barra fuori e il fondo del foglio chiuso dentro */
  const carta = await page.locator('[data-torre="add"]').boundingBox({ timeout: 1500 }).catch(() => null)
  if (!carta) return false
  await page.mouse.click(carta.x + carta.width / 2, carta.y + carta.height / 2)
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
  passi: [['.tap:not(.chiusa)', 1500], preparaIlCampo],
  clip: {
    secondi: 9,
    /* il campo a sprite è fitto di dettagli e ogni quadro costa: un po' più
       svelto del vero (nove secondi registrati in sette) tiene la clip
       sotto il mega, e il conto si legge lo stesso */
    accelera: 1.3,
    async durante (page) {
      await attesa(400)                           // il campo si vede, poi si tocca
      await costruisci(page, 170)                 // una torre in più: si paga col conto
      await attesa(250)
      await page.evaluate(() => {
        window.__td.chiamaOnda()                  // i draghi
        window.__td.velocita.value = 3            // ⏩: arrivano in tempo per lo scontro
      })
      await attesa(300)
      /* la seconda subito, col tasto: i troll, per il mortaio */
      const manda = await page.locator('[data-azione="chiama-prossima"]').boundingBox().catch(() => null)
      if (manda) await page.mouse.click(manda.x + manda.width / 2, manda.y + manda.height / 2)
      await attesa(6400)                          // scendono, e le torri sparano
    },
  },
}
