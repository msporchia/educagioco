/* ═══════════════════════════════════════════════════════════════════
   IL LABORATORIO DELLE POZIONI, GIOCATO DAVVERO
     node test/integrazione/pozioni.test.mjs   (dopo `npm run build`)

   Il test di unità dice che le ricette sono possibili. Qui si guarda
   quello che solo il gioco vero può dire:
     · dalla home ci si arriva, e col tasto ‹ si torna indietro
     · la campagna è chiusa e si apre una tappa per volta
     · i tre gesti (versa, pesa, taglia) portano davvero a una pozione
     · il cliente esigente lascia la mancia, e la mancia ridà un cuore
     · sbagliare per eccesso fa 💥 ma non costa un cuore
     · quello che si è fatto finisce nel profilo: contatori e motore
     · il cartellino dice in che unità conta quell'attrezzo lì
     · il procedimento della virgola alla prima volta, e come sfuma
     · e finché c'è, il cliente non ha fretta né barra
     · la pausa ferma la pazienza, e anche il foglio del `?`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi,
         TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { SCALE, TAPPE } from '../../src/data/pozioni.js'

/* Un bambino che le conversioni le ha già viste tutte: il residuo degli
   aiuti a zero, per bambino e per conversione. Serve a spegnere gli
   aiuti — e con loro la calma del cliente — perché la pausa si prova su
   un cliente che ha fretta, se no si sta misurando un orologio già
   fermo. */
const IMPARATE = Object.fromEntries(SCALE.map(s => [s.id, 0]))

/* e la mano del motore nel laboratorio libero: pesca la conversione che
   si sa peggio, quindi seminare tutto saputo tranne una è il modo di
   ordinare al banco proprio quella, senza sperarci */
const sapute = (tranne = []) => Object.fromEntries(
  SCALE.filter(s => !tranne.includes(s.id))
    .map(s => ['pozioni:' + s.id, { s: 6, ok: 9, err: 0, last: Date.now(), seen: 9, t: 900 }]))

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. dalla home si entra, e si arriva alla mappa ---------- */
await page.getByText('Il laboratorio delle pozioni').click()
await page.waitForSelector('.lab', { timeout: 5000 })
const intro = await page.evaluate(() => document.body.innerText)
controlla('la mappa spiega il gioco', /litri|La bilancia/i.test(intro))

const quante = await page.locator('.tappa').count()
uguale('tutte le tappe sono in mappa', quante, TAPPE.length)
uguale('solo la prima è aperta', await page.locator('.tappa.chiusa').count(), quante - 1)
controlla('il laboratorio libero non c\'è ancora',
          await page.locator('.tappa.libera').count() === 0)
/* una tappa chiusa non si apre a forza: è la promessa della campagna */
await page.locator('.tappa[data-tappa="righello"]').click()
await page.waitForTimeout(150)
uguale('una tappa chiusa non parte', await page.evaluate(() => window.__poz.fase.value), 'mappa')

/* la barra è quella comune: il tasto per uscire sta sempre nello stesso posto */
uguale('c\'è un solo tasto per tornare indietro',
       await page.locator('button[aria-label="indietro"]').count(), 1)
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte', { timeout: 5000 })
await page.getByText('Il laboratorio delle pozioni').click()
await page.waitForSelector('.lab', { timeout: 5000 })

/* ---------- 2. il cartellone delle misure ---------- */
await page.locator('button[title="scala delle misure"]').click()
await page.waitForSelector('.cartellone', { timeout: 3000 })
const muro = await page.evaluate(() => document.querySelector('.cartellone').innerText)
controlla('il cartellone mostra le tre famiglie di unità',
          /Lunghezza/.test(muro) && /Massa/.test(muro) && /Capacità/.test(muro))
controlla('e non scrive il fattore fra le due unità in gioco', !/×100|×1000/.test(muro),
          muro.split('\n').find(r => /×/.test(r)))
await page.locator('.cartellone .bottone').click()

/* ---------- 3. la prima tappa, giocata fino in fondo ----------
   Si gioca dall'API del gioco e non a colpi di dito: interessa che il
   giro completo funzioni, non che il dito arrivi (quello lo dicono già
   i test del castello). Ogni gesto però è quello vero: si sceglie
   l'attrezzo, si dosa e si conferma. */

/* Fra un ingrediente e l'altro il banco resta occupato: l'esito va mostrato,
   e a pozione finita il cliente successivo arriva dopo un secondo. Aspettare
   a tempo vorrebbe dire dosare nel vuoto, quindi si aspetta il banco. */
const giocaTappa = (max = 40) => page.evaluate(async (max) => {
  const P = window.__poz
  const dormi = ms => new Promise(r => setTimeout(r, ms))
  const pronto = async () => {
    for (let n = 0; n < 80; n++) {
      if (P.fase.value !== 'gioco') return false
      if (P.ing.value && !P.ing.value.fatto && !P.esito.value) return true
      await dormi(50)
    }
    return false
  }
  const gesti = new Set(), scale = [], mance = []
  let ingredienti = 0

  for (let giro = 0; giro < max && P.fase.value === 'gioco'; giro++) {
    if (!await pronto()) break
    const r = P.ricetta.value
    const ultimo = r.ingredienti.filter(x => !x.fatto).length === 1
    const cuoriPrima = P.hud.cuori
    const i = P.ing.value
    const buono = i.attrezzi.find(a => P.vaBene(a, i.piccolo))
    if (!buono) return { errore: 'nessun attrezzo buono per ' + i.testo }
    P.scegliStrumento(buono)
    gesti.add(i.scala.tipo); scale.push(i.scala.id)

    if (i.scala.tipo === 'polvere') for (const p of P.scomponi(i.piccolo, buono.pesi)) P.metti(p)
    else P.versa(i.piccolo)

    if (P.dentro.value !== i.piccolo)
      return { errore: `dosato ${P.dentro.value} invece di ${i.piccolo} ${i.scala.a}` }
    P.conferma()
    ingredienti++
    await dormi(r.esigente && ultimo ? 1000 : 70)
    if (r.esigente && ultimo)
      mance.push({ cuoriPrima, cuoriDopo: P.hud.cuori, cartello: P.cartello.value,
                   ingredienti: r.ingredienti.length })
  }
  return { gesti: [...gesti], scale, mance, ingredienti, pozioni: P.hud.pozioni,
           perfette: P.hud.perfette, cuori: P.hud.cuori, fase: P.fase.value,
           premio: P.premio.value, tappa: P.progresso.value.tappa }
}, max)

await page.locator('.tappa[data-tappa="bilancia"]').click()
await page.waitForTimeout(200)
const t1 = await giocaTappa()

if (!controlla('la prima tappa non si è inceppata', !t1.errore, t1.errore)) {
  nota(JSON.stringify(t1))
} else {
  uguale('la tappa è superata', t1.fase, 'vinta')
  uguale('i cinque clienti sono passati tutti', t1.pozioni, 5)
  uguale('e nessuno se n\'è andato', t1.cuori, 3)
  controlla('la prima tappa chiede solo di pesare in chili',
            t1.scale.every(s => s === 'kg-g'), [...new Set(t1.scale)].join(' · '))
  uguale('un ingrediente per cliente, non di più', t1.ingredienti, 5)
  controlla('la tappa paga in monete', t1.premio >= 1, `premio ${t1.premio}`)
  uguale('e resta segnata nel profilo', t1.tappa, 1)
}
await scatto(page, 'pozioni-banco')

/* ---------- 4. la seconda tappa si è aperta, e ha il cliente esigente ---------- */
await page.evaluate(() => window.__poz.allaMappa())
await page.waitForTimeout(150)
uguale('adesso le tappe chiuse sono una di meno',
       await page.locator('.tappa.chiusa').count(), quante - 2)

await page.locator('.tappa[data-tappa="peso"]').click()
await page.waitForTimeout(200)

/* sbagliare per eccesso costa tempo, non un cuore: si prova sul primo cliente */
const boom = await page.evaluate(async () => {
  const P = window.__poz
  const i = P.ing.value
  const buono = i.attrezzi.find(a => P.vaBene(a, i.piccolo))
  P.scegliStrumento(buono)
  const cuoriPrima = P.hud.cuori
  const pazienzaPrima = P.restaPazienza.value
  P.versa(i.piccolo + buono.grana)          // una tacca di troppo
  if (i.scala.tipo === 'polvere') P.metti(buono.pesi[buono.pesi.length - 1] * 99)
  const traboccato = P.esito.value === 'boom' || P.troppo.value
  P.conferma()
  await new Promise(r => setTimeout(r, 60))
  return { traboccato, esito: P.esito.value, cuoriPrima, cuoriDopo: P.hud.cuori,
           pazienzaPrima, pazienzaDopo: P.restaPazienza.value }
})
controlla('la dose di troppo fa 💥', boom.traboccato || boom.esito === 'boom',
          `esito "${boom.esito}"`)
uguale('ma non costa un cuore', boom.cuoriDopo, boom.cuoriPrima)
controlla('costa tempo', boom.pazienzaDopo < boom.pazienzaPrima,
          `${boom.pazienzaPrima.toFixed(1)}s → ${boom.pazienzaDopo.toFixed(1)}s`)

const t2 = await giocaTappa()
if (!controlla('la seconda tappa non si è inceppata', !t2.errore, t2.errore)) {
  nota(JSON.stringify(t2))
} else {
  uguale('anche la seconda è superata', t2.fase, 'vinta')
  controlla('qui entra l\'ettogrammo', t2.scale.includes('hg-g'),
            [...new Set(t2.scale)].join(' · '))
  uguale('un cliente esigente, come dice la tappa', t2.mance.length, 1)
  const m = t2.mance[0] || {}
  controlla('l\'esigente chiede un ingrediente in più', m.ingredienti === 3, `${m.ingredienti}`)
  controlla('e servito bene lascia la mancia', /Mancia/.test(m.cartello || ''), m.cartello)
  uguale('che è un cuore in più', m.cuoriDopo, m.cuoriPrima + 1)
  nota(`tappa 2: ${t2.ingredienti} dosi · ${[...new Set(t2.scale)].join(' · ')} · mancia ${m.cartello}`)
}

/* ---------- 5. quello che si è fatto è finito nel profilo ---------- */
const p = await leggiProfilo(page)
dentro('gli ingredienti dosati sono contati', p.totals.misure, 14, 20)
dentro('e le pozioni pure', p.totals.pozioni, 9, 11)
controlla('le pozioni perfette sono segnate a parte',
          p.totals.pozioniPerfette >= 9 && p.totals.pozioniPerfette <= p.totals.pozioni,
          `${p.totals.pozioniPerfette} su ${p.totals.pozioni}`)
uguale('la campagna è avanti di due tappe', p.lab.tappa, 2)
controlla('e il laboratorio libero è ancora chiuso', !p.lab.libera)
const chiavi = Object.keys(p.items).filter(k => k.startsWith('pozioni:'))
controlla('il motore di apprendimento ha visto le conversioni', chiavi.length >= 2,
          'chiavi: ' + chiavi.join(' · '))
nota('conversioni incontrate: ' + chiavi.join(' · '))

/* la home racconta a che punto è la campagna */
const home = await page.evaluate(() => {
  document.querySelector('button[aria-label="indietro"]').click()
  return new Promise(r => setTimeout(() => r(document.body.innerText), 400))
})
controlla('la home racconta a che punto si è',
          new RegExp('tappa 3 di ' + TAPPE.length).test(home),
          home.split('\n').find(r => /preparate|tappa|pozioni/i.test(r)) || 'niente sulle pozioni')

/* ---------- 6. l'ultima tappa apre il laboratorio libero ----------
   Giocarsi tutta la fila qui dentro vorrebbe dire parecchi minuti di
   test: si semina il profilo davanti all'ultima, che è l'unica cosa che
   il resto della campagna non può dire. */
await semina(page, { lab: { tappa: TAPPE.length - 1, libera: false, v: 3 } })
await page.getByText('Il laboratorio delle pozioni').click()
await page.waitForSelector('.lab', { timeout: 5000 })
uguale('con tutte le altre fatte non resta niente di chiuso',
       await page.locator('.tappa.chiusa').count(), 0)
await page.locator('.tappa[data-tappa="calderone"]').click()
await page.waitForTimeout(200)
const t8 = await giocaTappa(60)

if (!controlla('l\'ultima tappa non si è inceppata', !t8.errore, t8.errore)) {
  nota(JSON.stringify(t8))
} else {
  uguale('finire l\'ultima tappa è un trionfo', t8.fase, 'trionfo')
  controlla('il grande calderone mescola tutti e tre i gesti',
            t8.gesti.length === 3, t8.gesti.join(' · '))
  nota(`ultima tappa: ${t8.ingredienti} dosi · ${[...new Set(t8.scale)].sort().join(' · ')}`)
}
const dopo = await leggiProfilo(page)
controlla('e apre il laboratorio libero', dopo.lab.libera, JSON.stringify(dopo.lab))

/* nel libero non si finisce mai, e la conversione la sceglie il motore */
await page.evaluate(() => window.__poz.allaMappa())
await page.waitForTimeout(150)
uguale('in mappa compare il laboratorio libero',
       await page.locator('.tappa.libera').count(), 1)
await page.locator('.tappa[data-tappa="libero"]').click()
await page.waitForTimeout(200)
const libero = await page.evaluate(() => ({
  campagna: window.__poz.campagna.value,
  clienti: window.__poz.tappa.value.clienti,
  scale: window.__poz.tappa.value.scale.length,
}))
controlla('il libero non è una tappa', !libero.campagna)
controlla('e non finisce mai', libero.clienti === Infinity || libero.clienti === null,
          String(libero.clienti))
uguale('con tutte le conversioni in gioco', libero.scale, SCALE.length)

/* ---------- 7. la bilancia che conta in etti ----------
   Il cartellino dice **in che unità conta quell'attrezzo**, e non è
   sempre il fondo della scala: se lo fosse, tutto il gioco chiederebbe
   una cosa sola — scendi in fondo. Nel libero la conversione la sceglie
   il motore e sceglie la più debole, quindi seminare tutto saputo
   tranne kg→hg è il modo di ordinare al banco proprio quella. */
await semina(page, { items: sapute(['kg-hg']), lab: { tappa: TAPPE.length, libera: true, v: 3 } })
await page.getByText('Il laboratorio delle pozioni').click()
await page.waitForSelector('.lab', { timeout: 5000 })
await page.locator('.tappa[data-tappa="libero"]').click()
await page.waitForTimeout(300)
const etti = await page.evaluate(() => ({
  scala: window.__poz.ing.value.scala.id,
  dose: window.__poz.ing.value.testo,
  targhe: [...document.querySelectorAll('.scelta .targa')].map(t => t.innerText.replace(/\n/g, ' · ')),
}))
uguale('il motore consegna la conversione che si sa peggio', etti.scala, 'kg-hg')
controlla('e il cartellino dice che quella bilancia conta in etti',
          etti.targhe.some(t => /pesi da \d+ hg/.test(t)), etti.targhe.join(' | '))
nota(`${etti.dose} sulla bilancia: ` + etti.targhe.join(' | '))

/* ---------- 8. la pausa: la pazienza è la cosa da fermare ----------
   Qui il tempo È l'avversario, quindi la misura giusta è la pazienza del
   cliente: se scende, il gioco sta camminando. Si prova col dito perché
   è l'unico modo di vedere il fantasma — il `click` che il dito si
   lascia dietro dopo aver premuto ⏸, che arriva al velo appena nato e lo
   toglierebbe da solo.

   Il banco di prova ha gli aiuti spenti (`saltaLeSpiegazioni`), quindi
   il cliente ha fretta da sé: fermare un orologio già fermo non
   dimostrerebbe niente. */
const pazienza = () => page.evaluate(() => Math.round(window.__poz.restaPazienza.value * 10))
const veli = () => page.locator('[data-pausa]').count()

controlla('senza aiuti il cliente ha la barra, e la fretta',
          await page.evaluate(() => !window.__poz.calma.value) &&
          await page.locator('[data-pazienza]').count() === 1)
uguale('in laboratorio il ⏸ c\'è', await page.locator('button[aria-label="pausa"]').count(), 1)
await attendi(page, 600)
const prima = await pazienza()
controlla('e intanto il cliente si spazientisce', prima > 0)

await page.locator('button[aria-label="pausa"]').click()
uguale('il velo compare', await veli(), 1)
await page.evaluate(() => document.querySelector('[data-azione="riprendi"]')?.click())
uguale('il click che il dito si lascia dietro non la toglie', await veli(), 1)
const ferma = await pazienza()
await attendi(page, 1400)
uguale('e la pazienza non scende di un decimo', await pazienza(), ferma)
await scatto(page, 'pozioni-pausa')
controlla('la pausa dice che ricetta si aveva in mano',
          (await page.locator('[data-pausa]').textContent()).includes(
            await page.evaluate(() => window.__poz.ricetta.value.nome)))

/* la finestra cieca è passata da un pezzo: adesso il tocco vale */
await page.locator('[data-azione="riprendi"]').click()
uguale('il velo sparisce', await veli(), 0)
await attendi(page, 700)
controlla('e il cliente ricomincia ad aspettare', await pazienza() < ferma,
          `${await pazienza()} contro ${ferma}`)

/* ---------- 9. leggere come si gioca non costa il cliente ----------
   Il `?` c'era da sempre e non fermava niente: si apriva «come si
   gioca» e intanto il cliente se ne andava, cioè leggere le istruzioni
   costava il cuore che quelle istruzioni servivano a non perdere. */
await page.locator('button[aria-label="aiuto"]').click()
await attendi(page, 300)
const conIlFoglio = await pazienza()
await attendi(page, 1400)
uguale('col `?` aperto la pazienza sta ferma', await pazienza(), conIlFoglio)
uguale('e il velo della pausa non ci si mette sopra', await veli(), 0)
await page.locator('[data-azione="chiudi-aiuto"]').click()
await attendi(page, 700)
controlla('chiuso il foglio si riparte', await pazienza() < conIlFoglio,
          `${await pazienza()} contro ${conIlFoglio}`)

/* la 🪜 invece non ferma niente: è un attrezzo del banco, si consulta
   mentre si lavora e il cliente aspetta */
await page.locator('button[title="scala delle misure"]').click()
await attendi(page, 300)
const conLaScala = await pazienza()
await attendi(page, 1200)
controlla('la scala al muro invece non ferma il cliente', await pazienza() < conLaScala,
          `${await pazienza()} contro ${conLaScala}`)
await page.locator('.cartellone .bottone').click()

/* a campagna finita la home smette di contare le tappe e dice il libero */
const homeDopo = await page.evaluate(() => {
  document.querySelector('button[aria-label="indietro"]').click()
  return new Promise(r => setTimeout(() => r(document.body.innerText), 400))
})
controlla('e la home lo racconta', /laboratorio libero/i.test(homeDopo),
          homeDopo.split('\n').find(r => /pozioni|laboratorio/i.test(r)) || 'niente sulle pozioni')

/* ---------- 10. l'introduzione guidata, che il banco di solito salta ----------
   Il difetto segnalato da un genitore: il gioco chiedeva di convertire
   dalla prima ricetta della prima tappa e non insegnava mai come si fa.
   Adesso la tappa che porta una conversione nuova comincia guidata, e
   siccome è una spiegazione che compare da sola il banco la spegne
   (`saltaLeSpiegazioni`): tutto quello che si è giocato fin qui è il
   gioco senza aiuti, ed è così che deve restare. Qui si apre una seconda
   pagina che le chiede, perché una scaletta che nessuno prova è una
   scaletta che un giorno smette di comparire senza dirlo. */
const { page: guidata, errori: erroriGuida } =
  await apriGioco(browser, { viewport: TELEFONO, spiegazioni: true })
await azzera(guidata)
await guidata.getByText('Il laboratorio delle pozioni').click()
await guidata.waitForSelector('.lab', { timeout: 5000 })
await guidata.locator('.tappa[data-tappa="bilancia"]').click()
await guidata.waitForTimeout(200)

const cartello = await guidata.evaluate(() => ({
  testo: document.querySelector('[data-promemoria]')?.innerText || '',
  dose: window.__poz.ing.value.testo,
  guida: window.__poz.ing.value.guida,
  chiede: window.__poz.ing.value.chiede,
  spinta: window.__poz.spinta.value,
  risultato: window.__poz.spiegazione.value && window.__poz.spiegazione.value.risultato,
  vera: window.__poz.ing.value.piccolo + ' ' + window.__poz.ing.value.scala.a,
  calma: window.__poz.calma.value,
  barra: !!document.querySelector('[data-pazienza]'),
  calmo: !!document.querySelector('[data-calmo]'),
  pazienza: Math.round(window.__poz.restaPazienza.value * 10),
}))
controlla('la conversione sta scritta sopra il banco, non dietro un tasto',
          /1 kg = 1000 g/.test(cartello.testo), JSON.stringify(cartello).slice(0, 160))
/* ── il pezzo nuovo: non solo l'uguaglianza, il **procedimento** ──
   «1 kg = 1000 g» è un fatto e dà per scontato il gesto. Alla prima
   dosatura di una conversione il conto sta svolto sulla dose in mano —
   scalini, verso della virgola, e la catena fino al numero. */
uguale('alla prima dosatura la spinta è piena', cartello.spinta, 3)
controlla('dice quanti scalini sono e da che parte va la virgola',
          /3 scalini in giù/.test(cartello.testo) &&
          /(virgola va a destra|aggiungi)/.test(cartello.testo),
          cartello.testo.replace(/\n/g, ' · '))
controlla('e il procedimento arriva fino alla dose vera',
          cartello.risultato === cartello.vera && /→/.test(cartello.testo),
          `${cartello.risultato} per ${cartello.vera}`)
uguale('la prima dose non chiede nessuna conversione', cartello.guida, 'diretta')
controlla('è scritta nell\'unità del banco', / g$/.test(cartello.dose), cartello.dose)
controlla('e non si segna al motore di apprendimento, perché nessuno l\'ha chiesta',
          cartello.chiede === false)
/* ── e finché c'è da leggere, il cliente non ha fretta ──
   Una barra che scende sopra tre righe da leggere non insegna a essere
   veloci, insegna a non leggere. Al suo posto lo dice: «senza fretta»,
   perché una barra ferma sarebbe indistinguibile da un tasto rotto. */
controlla('il cliente non ha fretta, e al posto della barra lo dice',
          cartello.calma && !cartello.barra && cartello.calmo,
          `calma ${cartello.calma} · barra ${cartello.barra}`)
await scatto(guidata, 'pozioni-guidata')
await attendi(guidata, 1500)
uguale('e la pazienza non scende di un decimo',
       await guidata.evaluate(() => Math.round(window.__poz.restaPazienza.value * 10)),
       cartello.pazienza)

/* si gioca la tappa dosando giusto, e si guarda la scaletta scendere */
const scaletta = await guidata.evaluate(async () => {
  const P = window.__poz
  const dormi = ms => new Promise(r => setTimeout(r, ms))
  const passi = []
  for (let giro = 0; giro < 12 && P.fase.value === 'gioco'; giro++) {
    for (let n = 0; n < 80 && (!P.ing.value || P.ing.value.fatto || P.esito.value); n++)
      await dormi(50)
    if (P.fase.value !== 'gioco') break
    const i = P.ing.value
    const el = document.querySelector('[data-promemoria]')
    passi.push({ guida: i.guida, testo: i.testo, cartello: !!el,
                 scritto: el ? el.innerText.replace(/\n/g, ' · ') : '',
                 spinta: P.spinta.value, calma: P.calma.value })
    P.scegliStrumento(i.attrezzi.find(a => P.vaBene(a, i.piccolo)))
    for (const p of P.scomponi(i.piccolo, P.strumento.value.pesi)) P.metti(p)
    P.conferma()
    await dormi(70)
  }
  return passi
})
uguale('le prime dosature sono guidate e poi non lo sono più',
       scaletta.map(p => p.guida || 'nuda').join(' '),
       'diretta diretta accanto accanto promemoria')
controlla('il cartello resta finché la conversione è fresca',
          scaletta.every(p => p.cartello), JSON.stringify(scaletta.map(p => p.cartello)))
/* la scaletta del cartello, gradino per gradino: prima il conto svolto
   col risultato, poi scalini e verso senza il numero, poi la sola
   uguaglianza — ed è lì che torna la riga di quanto sono grandi le due
   unità, che col procedimento a schermo era solo altra roba da leggere */
uguale('il procedimento si accorcia gradino per gradino',
       scaletta.map(p => p.spinta).join(''), '33221')
controlla('al primo gradino c\'è la catena col risultato',
          /→/.test(scaletta[0].scritto), scaletta[0].scritto)
controlla('al secondo restano scalini e verso, senza il numero',
          /scalin/.test(scaletta[2].scritto) && !/→/.test(scaletta[2].scritto),
          scaletta[2].scritto)
controlla('e col solo promemoria torna quanto sono grandi le due unità',
          !/scalini in giù/.test(scaletta[4].scritto) && /graffetta/.test(scaletta[4].scritto),
          scaletta[4].scritto)
uguale('la fretta entra quando la spiegazione esce',
       scaletta.map(p => (p.calma ? 'calmo' : 'fretta')).join(' '),
       'calmo calmo calmo calmo fretta')
nota('la scaletta della prima tappa: ' + scaletta.map(p => `${p.testo} [${p.guida}]`).join(' · '))

const dopoTappa = await leggiProfilo(guidata)
controlla('il conto delle conversioni fresche è sceso, e sta nel profilo del bambino',
          (dopoTappa.settings.misureNuove || {})['kg-g'] === 1,
          JSON.stringify(dopoTappa.settings.misureNuove))
uguale('e al motore sono arrivate solo le dosature che una conversione la chiedevano',
       (dopoTappa.items['pozioni:kg-g'] || {}).ok, 1)

/* ── e uno sbaglio lo rimette ──
   La metà che conta: chi ha imparato la conversione non vede più niente,
   ma chi ci ricasca deve ritrovarsela davanti senza doverla cercare. */
await semina(guidata, { lab: { tappa: 0, libera: false, v: 3 },
                        settings: { ...dopoTappa.settings, misureNuove: IMPARATE } })
await guidata.getByText('Il laboratorio delle pozioni').click()
await guidata.waitForSelector('.lab', { timeout: 5000 })
await guidata.locator('.tappa[data-tappa="bilancia"]').click()
await guidata.waitForTimeout(200)
const ricaduta = await guidata.evaluate(async () => {
  const P = window.__poz
  const prima = !!document.querySelector('[data-promemoria]')
  const barraPrima = !!document.querySelector('[data-pazienza]')
  const i = P.ing.value
  const buono = i.attrezzi.find(a => P.vaBene(a, i.piccolo))
  P.scegliStrumento(buono)
  P.metti(buono.pesi[buono.pesi.length - 1])
  P.metti(buono.pesi[buono.pesi.length - 1])
  P.conferma()                                   // dose sbagliata: 💥
  await new Promise(r => setTimeout(r, 900))
  const el = document.querySelector('[data-promemoria]')
  return { prima, barraPrima, dopo: !!el, scritto: el ? el.innerText.replace(/\n/g, ' · ') : '',
           spinta: P.spinta.value,
           guida: (P.promemoria.value || {}).guida || '',
           dose: P.ing.value && P.ing.value.testo }
})
controlla('a conversione imparata il cartello non c\'è più', !ricaduta.prima)
controlla('e il cliente ha di nuovo la sua barra', ricaduta.barraPrima)
/* e torna sulla dose che si sta sbagliando, non sulla prossima: la
   ricetta è già nata, quindi il cartello lo decide il conto com'è
   adesso e non quello che era quando la ricetta è stata scritta */
controlla('ma uno sbaglio lo riporta, subito e su questa dose',
          ricaduta.dopo, JSON.stringify(ricaduta).slice(0, 180))
uguale('e quello che torna è il promemoria, non la dose già convertita',
       ricaduta.guida, 'promemoria')
/* il perché E come si fa: dopo uno sbaglio non torna il cartellino
   scarno, torna il procedimento per intero — è la regola di casa, e su
   una conversione sbagliata il metodo è proprio quello che manca */
uguale('e col procedimento per intero, non con la sola uguaglianza',
       ricaduta.spinta, 3)
controlla('cioè scalini, verso della virgola e catena',
          /scalin/.test(ricaduta.scritto) && /→/.test(ricaduta.scritto), ricaduta.scritto)
controlla('la dose infatti resta da convertire', / kg$/.test(ricaduta.dose || ''), ricaduta.dose)
await scatto(guidata, 'pozioni-promemoria')

uguale('nessun errore in console con le spiegazioni accese', erroriGuida.length, 0)
if (erroriGuida.length) erroriGuida.forEach(e => nota(e))

/* ---------- 11. niente errori per strada ---------- */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('Il laboratorio delle pozioni')
