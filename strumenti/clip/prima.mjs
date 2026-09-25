/* Prima e dopo: «Che forma prende», con tre storie vere
   rimesse in fila una dopo l'altra — ogni vignetta toccata nell'ordine
   giusto, e il segno ✔️ che chiude ciascuna.

   L'ordine giusto **non si scrive mai a mano**. `motore/quesito.js`
   (`QuesitoOrdina`) mescola le vignette da pescare ma non tocca il
   contenuto: `sequenza` resta `storia.passi` così com'è scritto in
   `dati/storie.js`, e ogni vignetta porta il suo passo nell'attributo
   `aria-label` (`Storia.vue`: `'vignetta ' + v.emoji`, dove «emoji» è
   il passo stesso — un carattere o il nome di una scena disegnata).
   Quindi: si legge il gruppo di `aria-label` in pesca, si cerca fra le
   `STORIE` importate quella con esattamente quei passi, e si clicca
   nell'ordine in cui *quella storia* li elenca — che è sempre l'ordine
   giusto, perché `QuesitoOrdina.posate[i]` vince solo se l'id in buca
   `i` è `i`, e l'id di un passo è la sua posizione in `storia.passi`.
   Se un giorno `Storia.vue` smettesse di scrivere l'aria-label,  o le
   storie a tre passi delle sue categorie sparissero, la clip non
   troverebbe corrispondenze e si fermerebbe lì, in silenzio.

   `profilo` porta `campagne.prima.tappa` oltre la tappa della clip: `store/progressi.js`
   calcola il traguardo «Passo dopo passo» leggendo proprio quel campo
   (`tappeDi`), e portare a casa una tappa mai fatta prima aprirebbe il
   cartello globale dei traguardi sopra la scena — lo stesso guasto
   scoperto scrivendo `conta.mjs`, vedi il commento lì. */
import { STORIE } from '../../src/giochi/prima-dopo/dati/storie.js'
import { CAMPAGNA } from '../../src/giochi/prima-dopo/dati/campagna.js'

/* «Che forma prende»: il latte, la mela, le patate. Fra le sue storie le
   disegnate sono poche (vedi `IN_VETRINA`), quindi di solito se ne
   risolvono tre di fila; nella prima tappa erano una su tre, e la clip
   si chiudeva dopo una storia sola. Per chiave, non per posizione. */
const TAPPA = CAMPAGNA.findIndex(t => t.chiave === 'cambia-forma')

/* `QuesitoOrdina.sequenza` è `storia.passi.slice(0, verboDef.n)`: per
   «ordina3» sono le **prime tre** di una storia, che può averne di più
   (`uovo-gallina` ne ha quattro). Il confronto va fatto sulla stessa
   fetta, non sull'intero elenco — altrimenti una storia più lunga di
   quella mostrata non si troverebbe mai. */
function trovaStoria (passiVisti) {
  const n = passiVisti.length
  return STORIE.find(s => s.passi.length >= n &&
    passiVisti.every(p => s.passi.slice(0, n).includes(p))) || null
}

/* la storia a schermo adesso, dalle vignette da pescare */
async function storiaOra (page) {
  const etichette = await page.locator('.pd-pesca .pd-vignetta')
    .evaluateAll(els => els.map(e => e.getAttribute('aria-label') || ''))
  const passiVisti = etichette.map(e => e.replace(/^vignetta /, ''))
  const storia = passiVisti.length ? trovaStoria(passiVisti) : null
  return storia && { storia, sequenza: storia.passi.slice(0, passiVisti.length) }
}

/* Solo le storie a emoji: le **disegnate** (`disegnata: true` in
   `dati/storie.js`, le persone che piantano, si sbucciano, litigano)
   in una casella piccola non vengono bene, e in vetrina non ci vanno —
   è il giudizio dell'utente guardando la clip. La tappa pesca a caso,
   quindi prima di registrare si rientra finché la prima storia non è a
   emoji, e durante ci si ferma alla prima disegnata. */
const IN_VETRINA = s => !!s && !s.storia.disegnata
const TENTATIVI = 30

async function aspettaUnaDaVetrina (page) {
  for (let i = 0; i < TENTATIVI; i++) {
    await page.waitForSelector('.pd-pesca .pd-vignetta', { timeout: 4000 })
    if (IN_VETRINA(await storiaOra(page))) return
    await page.click('button[aria-label="indietro"]')
    await page.click(`.pd-tappa[data-tappa="${TAPPA}"]`)
  }
  throw new Error(`in ${TENTATIVI} ingressi nessuna storia a emoji`)
}

async function risolviUnaStoria (page) {
  await page.waitForTimeout(400)                      // oltre la finestra cieca, si legge la consegna
  const ora = await storiaOra(page)
  if (!IN_VETRINA(ora)) return false                  // è uscita una disegnata: si chiude qui
  const { sequenza } = ora

  for (const passo of sequenza) {
    await page.locator(`.pd-pesca .pd-vignetta[aria-label="vignetta ${passo}"]`)
      .click({ timeout: 1500 }).catch(() => {})
    await page.waitForTimeout(320)                    // una vignetta alla volta, non tutte insieme
  }
  await page.waitForTimeout(550)                      // il segno ✔️, poi la storia dopo
  return true
}

export default {
  file: 'clip-prima', dove: 'prima', attesa: '.pd-tappe',
  profilo: p => {
    p.campagne = { ...p.campagne, prima: { tappa: TAPPA + 1, libera: false, stelle: {}, cfg: {} } }
    return p
  },
  passi: [[`.pd-tappa[data-tappa="${TAPPA}"]`, 900], aspettaUnaDaVetrina],
  clip: {
    secondi: 8,
    coda: 900,
    async durante (page) {
      for (let i = 0; i < 3; i++) {
        const ok = await risolviUnaStoria(page)
        if (!ok) break
      }
    },
  },
}
