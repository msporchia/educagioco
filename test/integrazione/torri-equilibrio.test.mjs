/* ═══════════════════════════════════════════════════════════════════
   DIFENDI IL CASTELLO — la controprova sul campo.


   L'equilibrio lo calcola `data/castello.js` e lo verifica, in aritmetica
   e in un lampo, `test/unita/castello.test.mjs`. Quello che il modello non
   può sapere è se il gioco vero si comporta come il conto dice: i nemici
   camminano, le torri hanno un raggio, i colpi viaggiano. Qui si gioca
   davvero, per vedere se le due cose combaciano.

   Costa minuti, quindi di serie prova la prima tappa (con le due strategie
   opposte) e l'ultima. Per farle tutte:  TAPPE_PROVA=tutte node …

   Se questo test litiga con il modello, non si toccano i numeri a mano:
   si aggiusta il modello — la RESA del danno o la durata dell'ondata sono
   lì apposta — e si rilancia. I numeri delle tappe non si scrivono.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco } from '../aiuto/browser.mjs'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const errori = []

/* Una pagina nuova per ogni partita: diverse tappe di fila nello stesso tab
   facevano cadere il browser a metà prova, e un test che muore non dice niente. */
async function tavolo() {
  const { page, errori: suoi } = await apriGioco(browser)
  page.setDefaultTimeout(0)
  await page.click('.carta.td')
  await page.waitForSelector('.tappe')
  return { page, suoi }
}

/* Il finto giocatore: risolve sempre giusto — qui si misura l'equilibrio, non
   la bravura — spende appena può e chiama l'ondata appena il campo è pulito. */
async function gioca(tappa, strategia) {
  const { page, suoi } = await tavolo()
  const esito = await page.evaluate(async ({ tappa, strategia }) => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.inizia(tappa)
    /* Il gioco avanza dentro requestAnimationFrame: a ogni fotogramma fa
       `velocita` passi del tempo davvero trascorso. Simulare una partita
       costava quindi la durata della partita divisa per la velocità — con 6
       erano 34 secondi reali a partita, tre partite, un minuto e mezzo.
       Con 60 la fisica è identica (il `dt` è lo stesso, solo ripetuto più
       volte per fotogramma) ma la prova dura dieci volte meno. */
    T.velocita.value = 60                   // molto oltre il massimo del gioco
    await attesa(200)
    const posti = T.TAPPE[tappa].posti, tipi = T.TAPPE[tappa].torri
    const storia = []
    for (let giro = 0; giro < 5000 && T.fase.value === 'gioco'; giro++) {
      /* Il cartello di un traguardo **ferma il campo** finché sta davanti
         (è il velo di `components/Traguardo.vue`, che copre tutto per tre
         secondi): un premio non deve costare cuori a chi non vede più i
         nemici. Il finto giocatore fa quello che farebbe un bambino —
         tocca per continuare — se no qui la partita resta in pausa a
         ogni traguardo e la prova finisce i giri prima delle ondate. */
      document.querySelector('.velo')?.click()
      if (!T.scelta.value) {
        /* Cosa comprerebbe adesso: **la stessa regola del simulatore**
           (`mossa()` in strumenti/simula-castello.mjs). Deve essere la
           stessa, se no questo test non confronta più il gioco vero col
           modello ma con un giocatore inventato qui. Le due righe che
           contano: due torri prima di alzarne una — una torre sola al
           massimo perde comunque, e con quattro postazioni sole ci si
           arriva presto — e poi si sale la più bassa finché la salita
           costa meno di una torre nuova. */
        const torri = T.torri()
        const cistanno = torri.length < posti
        const bassa = torri.filter(t => t.lv < T.massimo.value).sort((a, b) => a.lv - b.lv)[0]
        const prezzoSalita = bassa ? T.costoSalita(bassa) : Infinity
        const prezzoNuova = T.costoNuova.value
        const che = torri.length < 2 && cistanno ? 'nuova'
          : strategia === 'costruisci' && cistanno ? 'nuova'
          : !bassa ? (cistanno ? 'nuova' : null)
          : !cistanno ? 'salita'
          : prezzoSalita <= prezzoNuova ? 'salita' : 'nuova'
        if (che === 'salita' && T.hud.energia >= prezzoSalita) T.potenzia(bassa)
        else if (che === 'nuova' && T.hud.energia >= prezzoNuova)
          T.scegliTorre(tipi[torri.length % tipi.length])
        if (T.op.value) {
          await attesa(25)
          const tasti = [...document.querySelectorAll('.tastiera button')]
          T.op.value.passi.forEach(s => tasti.find(x => +x.textContent === s.atteso).click())
          await attesa(50)
        }
      }
      if (T.inAttesa.value && !T.scelta.value) {
        storia.push(`o${T.hud.onda}:${T.hud.cuori}❤${T.hud.energia}⚡[${T.torri().map(t => t.lv).join('')}]`)
        T.chiamaOnda()
      }
      await attesa(4)     // il gioco ora finisce in pochi fotogrammi: si sonda più spesso
    }
    return { esito: T.fase.value, onda: T.hud.onda, ondate: T.TAPPE[tappa].ondate,
             cuori: T.hud.cuori, livelli: T.torri().map(t => t.lv), storia }
  }, { tappa, strategia })
  errori.push(...suoi)
  await page.close()
  return esito
}

const vinta = r => r.esito === 'vinta' || r.esito === 'trionfo'
/* quanto lontano è arrivato: superare vale più di qualunque ondata, e a parità
   di ondate vince chi ha lasciato passare meno nemici */
const quantoLontano = r => (vinta(r) ? 1000 : r.onda * 10) + r.cuori

const { page: prima, suoi } = await tavolo()
const NOMI = await prima.evaluate(() => window.__td.TAPPE.map(t => t.nome))
errori.push(...suoi)
await prima.close()

const tutte = process.env.TAPPE_PROVA === 'tutte'
const daProvare = tutte ? NOMI.map((_, i) => i) : [0, NOMI.length - 1]

for (const i of daProvare) {
  const nome = `${i + 1}. ${NOMI[i]}`
  const alto = await gioca(i, 'potenzia')
  controlla(`${nome}: chi potenzia e non sbaglia supera la tappa`, vinta(alto),
            `finita all'ondata ${alto.onda}/${alto.ondate} con torri [${alto.livelli}]`)
  controlla(`${nome}: la prima ondata non è un muro`, alto.onda > 1 || vinta(alto),
            `persa subito, con ${alto.storia[0] || '—'}`)
  nota(`${nome}: potenzia → ${vinta(alto) ? 'superata' : 'persa a o' + alto.onda}` +
       ` [${alto.livelli}] ${alto.cuori}❤`)

  // il confronto fra le due strategie basta farlo dove la difesa conta di più
  if (i === 0 || tutte) {
    const largo = await gioca(i, 'costruisci')
    controlla(`${nome}: potenziare rende almeno quanto spargere torri deboli`,
              quantoLontano(alto) >= quantoLontano(largo),
              `alte [${alto.livelli}] ondata ${alto.onda} ${alto.cuori}❤ · ` +
              `basse [${largo.livelli}] ondata ${largo.onda} ${largo.cuori}❤`)
    nota(`${nome}: costruisci → ${vinta(largo) ? 'superata' : 'persa a o' + largo.onda}` +
         ` [${largo.livelli}] ${largo.cuori}❤`)
  }
}

controlla('nessun errore JS durante le partite', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('il castello giocato davvero')
