/* ═══════════════════════════════════════════════════════════════════
   LA BANCARELLA, GIOCATA DAVVERO
     node test/integrazione/bancarella.test.mjs   (dopo `npm run build`)

   Il test di unità dice che ogni resto è componibile. Qui si guarda il
   giro completo, che nessun conto può dire:
     · dalla home ci si arriva, e col tasto ‹ si torna indietro
     · le giornate di mercato: la prima è aperta, le altre no
     · **niente da aprire**: la merce della tappa è tutta in vista nelle
       ceste, e quello che il cliente chiede è sempre lì davanti
     · la cassa arriva da sola quando la spesa è completa, ed è
       disegnata: scontrino, display col resto, cassetto a scomparti
     · sbagliare costa tempo, non un cuore
     · una giornata intera si finisce, e il profilo se ne accorge
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. dalla home si entra e si torna ---------- */
await page.getByText('La bancarella').click()
await page.waitForSelector('.negozio', { timeout: 5000 })
uguale('c\'è un solo tasto per tornare indietro',
       await page.locator('button[aria-label="indietro"]').count(), 1)
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte', { timeout: 5000 })
await page.getByText('La bancarella').click()
await page.waitForSelector('.giornate', { timeout: 5000 })

/* ---------- 2. le giornate di mercato ---------- */
const mappa = await page.evaluate(() => ({
  quante: document.querySelectorAll('.giornata').length,
  chiuse: document.querySelectorAll('.giornata.chiusa').length,
  libera: !!document.querySelector('.giornata.libera'),
  nomi: [...document.querySelectorAll('.giornata b')].map(b => b.textContent),
}))
controlla('le giornate sono più di una', mappa.quante >= 3, `${mappa.quante} giornate`)
uguale('a profilo vuoto solo la prima è aperta', mappa.chiuse, mappa.quante - 1)
controlla('la giornata libera non c\'è ancora', !mappa.libera)
nota('giornate: ' + mappa.nomi.join(' · '))

await page.locator('.giornata').first().click()
await page.waitForSelector('.banco', { timeout: 5000 })

/* il cartello di arrivo al banco: finché è su il tempo non scorre */
const fermo = await page.evaluate(async () => {
  const S = window.__shop
  const prima = S.cliente.value.restaPazienza
  await new Promise(r => setTimeout(r, 700))
  return { cartello: !!document.querySelector('.cartello-tappa'),
           prima, dopo: S.cliente.value.restaPazienza }
})
controlla('arrivando al banco c\'è il cartello della tappa', fermo.cartello)
uguale('e mentre è su il cliente non si spazientisce', fermo.dopo, fermo.prima)

await page.waitForSelector('.cesta', { timeout: 3000 })
await page.waitForFunction(() => !window.__shop.cambio.value, { timeout: 4000 })

/* ---------- 3. la merce è tutta in vista: niente da aprire ---------- */
const banco = await page.evaluate(() => {
  const S = window.__shop
  const ceste = [...document.querySelectorAll('.cesta')]
  const vis = e => { const r = e.getBoundingClientRect()
                     return r.width > 30 && r.top >= 0 && r.bottom <= innerHeight + 1 }
  return {
    esposti: S.esposti.value.length,
    ceste: ceste.length,
    tutteVisibili: ceste.every(vis),
    pezziPerCesta: ceste.map(c => c.querySelectorAll('.roba i').length),
    righe: [...document.querySelectorAll('.rigacesta')].map(r => r.children.length),
    /* niente scacchiera: i centri delle ceste di due file vicine non devono
       cadere in colonna, e nessuna cesta sta dritta come le altre */
    colonne: [...document.querySelectorAll('.rigacesta')].map(r =>
      [...r.children].map(c => Math.round(c.getBoundingClientRect().left +
                                          c.getBoundingClientRect().width / 2))),
    storte: new Set([...document.querySelectorAll('.cesta')]
      .map(c => getComputedStyle(c).transform)).size,
    banchiSuBanco: new Set(S.esposti.value.map(p => p.banco)).size,
    chiesti: S.cliente.value.articoli.flatMap(a => Array(a.quanti).fill(a.emoji)),
    inVetrina: S.cliente.value.articoli.every(a => ceste.some(c => c.dataset.em === a.emoji)),
    cartellini: ceste.filter(c => /€/.test(c.querySelector('.cartello')?.textContent || '')).length,
  }
})
uguale('sul banco ci sono tutte le ceste della tappa', banco.ceste, banco.esposti)
controlla('e si vedono tutte insieme, senza aprire niente', banco.tutteVisibili,
          `${banco.ceste} ceste`)
uguale('la tappa è un banco solo', banco.banchiSuBanco, 1)
controlla('quello che il cliente chiede è sempre lì davanti', banco.inVetrina,
          banco.chiesti.join(' '))
controlla('ogni cesta è un mucchio, non un oggetto solo',
          banco.pezziPerCesta.every(n => n >= 3), banco.pezziPerCesta.join(','))
const inColonna = banco.colonne.slice(1).some((riga, i) =>
  riga.length === banco.colonne[i].length &&
  riga.every((x, k) => Math.abs(x - banco.colonne[i][k]) < 3))
controlla('le ceste non stanno in colonna come una scacchiera', !inColonna,
          'righe da ' + banco.righe.join('+') + ': ' + JSON.stringify(banco.colonne))
controlla('e ognuna sta storta a modo suo', banco.storte >= banco.ceste - 1,
          `${banco.storte} pose diverse su ${banco.ceste} ceste`)
uguale('ogni cesta ha il suo cartellino del prezzo', banco.cartellini, banco.ceste)
await scatto(page, 'bancarella-banco')

/* ---------- 4. il primo cliente, servito col dito ---------- */
for (const em of banco.chiesti) {
  await page.locator(`.cesta[data-em="${em}"]`).click()
  await page.waitForTimeout(120)
}

const allaCassa = await page.evaluate(() => {
  const S = window.__shop
  const d = document.querySelector('.cassa .display b')
  return { momento: S.momento.value, mancano: S.daPrendere.value.length,
           display: d ? d.textContent.trim() : '',
           resto: S.cliente.value.resto,
           scontrino: (document.querySelector('.scontrino .somma b') || {}).textContent,
           scomparti: document.querySelectorAll('.cassetto .scomparto').length,
           tagli: S.cliente.value.monete.length,
           scrittaCassa: /\bCASSA\b/.test(document.body.innerText) }
})
uguale('presa tutta la merce si va in cassa da soli', allaCassa.momento, 'cassa')
uguale('non manca più niente', allaCassa.mancano, 0)
controlla('il registratore è disegnato e dice il resto sul display',
          allaCassa.display.includes(String(Math.floor(allaCassa.resto / 100))), allaCassa.display)
controlla('lo scontrino porta il totale della spesa', /€/.test(allaCassa.scontrino || ''),
          allaCassa.scontrino)
uguale('il cassetto ha uno scomparto per taglio', allaCassa.scomparti, allaCassa.tagli)
controlla('e da nessuna parte c\'è scritto "CASSA"', !allaCassa.scrittaCassa)
await scatto(page, 'bancarella-cassa')

const daDare = await page.evaluate(() => {
  const S = window.__shop
  return S.scomponi(S.cliente.value.resto, S.cliente.value.monete)
})
for (const v of daDare) {
  await page.locator(`.scomparto[data-v="${v}"]`).first().click()
  await page.waitForTimeout(80)
}
await page.waitForTimeout(1100)      // il cliente ringrazia e lascia il posto

const dopoPrimo = await page.evaluate(() => ({
  serviti: window.__shop.hud.serviti, perfetti: window.__shop.hud.perfetti,
  cuori: window.__shop.hud.cuori, momento: window.__shop.momento.value,
  inFila: window.__shop.coda.value.length,
  personeAVista: document.querySelectorAll('.fila .persona').length,
}))
uguale('il primo cliente è servito', dopoPrimo.serviti, 1)
uguale('col minimo di monete, quindi perfetto', dopoPrimo.perfetti, 1)
uguale('nessun cuore perso', dopoPrimo.cuori, 3)
uguale('e si riparte dalla raccolta', dopoPrimo.momento, 'raccolta')
uguale('chi aspetta si vede, uno per persona in coda',
       dopoPrimo.personeAVista, dopoPrimo.inFila - 1)
nota(`primo resto: ${daDare.length} monete [${daDare.join(' ')}]`)

/* ---------- 5. sbagliare costa tempo, non un cuore ---------- */
const sbagli = await page.evaluate(async () => {
  const S = window.__shop
  const c = S.cliente.value
  const cuoriPrima = S.hud.cuori
  const pazienzaPrima = c.restaPazienza

  // roba che il cliente non ha chiesto, presa dal banco che ha davanti
  const suoi = new Set(c.articoli.map(a => a.emoji))
  const estraneo = S.esposti.value.find(p => !suoi.has(p.emoji))
  if (estraneo) S.prendi(estraneo)
  return { cuoriPrima, cuoriDopo: S.hud.cuori, pazienzaPrima,
           pazienzaDopo: c.restaPazienza, presi: S.presi.value.length,
           avevaEstraneo: !!estraneo }
})
uguale('il prodotto sbagliato non entra nel sacchetto', sbagli.presi, 0)
uguale('e non costa un cuore', sbagli.cuoriDopo, sbagli.cuoriPrima)
controlla('costa tempo', sbagli.pazienzaDopo < sbagli.pazienzaPrima - 1,
          `${sbagli.pazienzaPrima.toFixed(1)}s → ${sbagli.pazienzaDopo.toFixed(1)}s`)

/* la moneta troppo grande viene rifiutata, non accettata per sbaglio */
const troppo = await page.evaluate(async () => {
  const S = window.__shop
  const c = S.cliente.value
  for (const a of [...S.daPrendere.value]) S.prendi(a)   // spesa completa, si va in cassa
  const grossa = [...c.monete].reverse().find(m => m > c.resto)
  if (!grossa) return { saltato: true }
  const cuoriPrima = S.hud.cuori
  S.metti(grossa)
  return { saltato: false, grossa, resto: c.resto, sulPiatto: S.piatto.value.length,
           cuoriPrima, cuoriDopo: S.hud.cuori }
})
if (troppo.saltato) nota('nessuna moneta più grande del resto in questo cassetto')
else {
  uguale('la moneta più grande del resto viene rifiutata', troppo.sulPiatto, 0)
  uguale('e nemmeno quella costa un cuore', troppo.cuoriDopo, troppo.cuoriPrima)
  nota(`rifiutati ${troppo.grossa}c su un resto di ${troppo.resto}c`)
}

/* ---------- 6. la giornata intera: tre clienti a banco, poi si cambia ---------- */
const giornata = await page.evaluate(async () => {
  const S = window.__shop
  const dormi = ms => new Promise(r => setTimeout(r, ms))
  const banchi = []
  const invisibili = []
  for (let giro = 0; giro < 400 && S.fase.value === 'gioco'; giro++) {
    if (S.cambio.value) { await dormi(80); continue }      // cartello di cambio banco
    const c = S.cliente.value
    if (!c) { await dormi(50); continue }
    const b = S.T.value.banco
    if (banchi[banchi.length - 1] !== b) banchi.push(b)
    if (S.momento.value === 'raccolta') {
      /* IL CONTROLLO CHE CONTA: quello che chiede deve stare sul banco che ha
         davanti, nel DOM e non solo nei dati. Al cambio tappa le ceste vecchie
         non devono restare appese: se succede, il cliente chiede roba che il
         negoziante non ha. */
      const ceste = new Set([...document.querySelectorAll('.cesta')].map(e => e.dataset.em))
      for (const a of c.articoli)
        if (!ceste.has(a.emoji)) invisibili.push(`${a.emoji} al banco ${b}`)
      for (const a of [...S.daPrendere.value])
        for (let k = 0; k < a.quanti; k++) S.prendi(a)   // «due angurie»: due tocchi
    }
    if (S.momento.value !== 'cassa') { await dormi(50); continue }

    const prima = S.hud.serviti
    for (const v of S.scomponi(c.resto - S.dato.value, c.monete)) S.metti(v)
    /* fra un cliente e l'altro il banco resta occupato mentre quello servito
       ringrazia: si aspetta che lasci il posto, non l'orologio — altrimenti
       il giro dopo si ritrova lo stesso cliente col resto già dato */
    for (let n = 0; n < 60; n++) {
      if (S.hud.serviti > prima && (S.momento.value === 'raccolta' || S.fase.value !== 'gioco')) break
      await dormi(50)
    }
    if (S.hud.serviti === prima)
      return { errore: `cliente non servito: resto ${c.resto}c, dato ${S.dato.value}c, ` +
                       `momento ${S.momento.value}, monete [${c.monete}], cuori ${S.hud.cuori}` }
  }
  return { serviti: S.hud.serviti, perfetti: S.hud.perfetti, cuori: S.hud.cuori,
           incasso: S.hud.incasso, fase: S.fase.value, esito: S.esito.value,
           banchi, tappe: S.camp.value.tappe, invisibili }
})
controlla('la giornata non si è inceppata', !giornata.errore, giornata.errore)
if (giornata.errore) nota('inceppata: ' + giornata.errore)
uguale('per tutta la giornata non chiedono mai roba che non è sul banco',
       (giornata.invisibili || []).length, 0)
uguale('la giornata finisce vinta', giornata.esito, 'vinta')
uguale('e si è girato tutto il percorso', (giornata.banchi || []).join(' → '),
       (giornata.tappe || []).join(' → '))
uguale('tre clienti per banco', giornata.serviti, (giornata.tappe || []).length * 3)
dentro('e l\'incasso è una cifra da spesa vera', giornata.incasso, 500, 40000)
nota(`percorso: ${giornata.banchi.join(' → ')} · ${giornata.serviti} clienti · ` +
     `${giornata.perfetti} resti perfetti`)

await page.waitForTimeout(600)          // il salvataggio è accodato, non immediato
const p = await leggiProfilo(page)
uguale('la prima giornata risulta superata', p.mercato.tappa, 1)
uguale('i clienti sono contati nel profilo', p.totals.clienti, giornata.serviti)
uguale('l\'incasso segnato è quello del banco', p.totals.incasso, giornata.incasso)
const chiavi = Object.keys(p.items).filter(k => k.startsWith('bancarella:'))
controlla('il motore di apprendimento ha visto le fasce del resto', chiavi.length >= 1,
          'nessuna chiave bancarella: nel profilo')
controlla('ogni tanto arriva una moneta', p.coins > 0, `${p.coins} monete`)
nota('fasce incontrate: ' + chiavi.join(' · ') + ` · ${p.coins} monete guadagnate`)

/* la giornata dopo adesso è aperta */
await page.locator('.bottone.chiaro').click()
await page.waitForSelector('.giornate', { timeout: 3000 })
const dopo = await page.evaluate(() => ({
  chiuse: document.querySelectorAll('.giornata.chiusa').length,
  fatte: document.querySelectorAll('.giornata.fatta').length,
  quante: document.querySelectorAll('.giornata').length,
}))
uguale('la giornata finita si vede come fatta', dopo.fatte, 1)
uguale('e quella dopo si è aperta', dopo.chiuse, dopo.quante - 2)

/* ---------- 7. una giornata avanzata: «due angurie» e resti da più monete ----------
   La prima giornata non ha copie né monete piccole per scelta: quello che
   cresce si vede solo più avanti, e va provato lì. */
await semina(page, { mercato: { tappa: 4, libera: false } })
await page.getByText('La bancarella').click()
await page.waitForSelector('.giornate', { timeout: 5000 })
await page.locator('.giornata[data-camp="fiera"]').click()
await page.waitForSelector('.banco', { timeout: 5000 })
await page.waitForFunction(() => !window.__shop.cambio.value, { timeout: 5000 })

const fiera = await page.evaluate(async () => {
  const S = window.__shop
  const dormi = ms => new Promise(r => setTimeout(r, ms))
  const quanti = [], monete = []
  let badge = 0, cassetto = { scomparti: 0, tagli: [] }
  for (let n = 0; n < 4; n++) {
    for (let g = 0; g < 200; g++) {
      if (S.cambio.value) { await dormi(80); continue }
      const c = S.cliente.value
      if (!c) { await dormi(50); continue }
      if (S.momento.value === 'raccolta') {
        quanti.push(...c.articoli.map(a => a.quanti))
        for (const a of [...S.daPrendere.value])
          for (let k = 0; k < a.quanti; k++) {
            S.prendi(a)
            await dormi(30)
            // dopo il primo pezzo di una coppia, la cesta deve dirlo
            if (a.quanti > 1 && k === 0 &&
                document.querySelector(`.cesta[data-em="${a.emoji}"] .ancora`)) badge++
          }
        continue
      }
      monete.push(c.minimo)
      cassetto = { scomparti: document.querySelectorAll('.cassetto .scomparto').length,
                   tagli: [...c.monete] }
      const prima = S.hud.serviti
      for (const v of S.scomponi(c.resto - S.dato.value, c.monete)) S.metti(v)
      for (let k = 0; k < 60; k++) {
        if (S.hud.serviti > prima && (S.momento.value === 'raccolta' || S.fase.value !== 'gioco')) break
        await dormi(50)
      }
      break
    }
  }
  return { quanti, monete, badge, ...cassetto }
})
controlla('alla fiera qualcuno vuole due o tre cose uguali',
          fiera.quanti.some(q => q > 1), fiera.quanti.join(','))
controlla('e la cesta ricorda quante ne mancano', fiera.badge > 0,
          `${fiera.badge} promemoria visti`)
controlla('i resti chiedono più monete che al banchetto',
          fiera.monete.some(m => m >= 3), fiera.monete.join(','))
controlla('nel cassetto ci sono anche 1c, 2c e la banconota da 10 €',
          fiera.tagli.includes(1) && fiera.tagli.includes(2) && fiera.tagli.includes(1000),
          fiera.tagli.join(' '))
uguale('e ogni taglio ha il suo scomparto', fiera.scomparti, fiera.tagli.length)
await scatto(page, 'bancarella-fiera')
nota(`fiera: pezzi per articolo [${fiera.quanti.join(',')}] · ` +
     `monete a resto [${fiera.monete.join(',')}]`)

/* ---------- 8. l'ultima giornata: la cassa non calcola ----------
   Qui l'aiuto sparisce: il display non dice il resto, le monete si posano
   tutte (anche troppe) e la risposta la dà il bambino col tasto ✓. */
await semina(page, { mercato: { tappa: 5, libera: false } })
await page.getByText('La bancarella').click()
await page.waitForSelector('.giornate', { timeout: 5000 })
await page.locator('.giornata[data-camp="mente"]').click()
await page.waitForSelector('.banco', { timeout: 5000 })
await page.waitForFunction(() => !window.__shop.cambio.value, { timeout: 5000 })

const rotta = await page.evaluate(async () => {
  const S = window.__shop
  const dormi = ms => new Promise(r => setTimeout(r, ms))
  const c = S.cliente.value
  for (const a of [...S.daPrendere.value])
    for (let k = 0; k < a.quanti; k++) { S.prendi(a); await dormi(20) }
  await dormi(60)
  const display = (document.querySelector('.cassa .display b') || {}).textContent || ''
  const quanto = (document.querySelector('.piatto .quanto') || {}).innerText || ''
  const tasto = () => document.querySelector('.eccolo')

  // 1. una moneta più grande del resto NON viene rifiutata: qui si può sbagliare
  const grossa = [...c.monete].reverse().find(m => m > c.resto)
  S.metti(grossa)
  const accettata = S.piatto.value.length
  await dormi(80)                       // il tasto compare al render dopo
  const tastoDopoUnaMoneta = !!tasto()

  // 2. e proporre un resto sbagliato costa tempo, non un cuore
  const cuoriPrima = S.hud.cuori, pazienzaPrima = c.restaPazienza, servitiPrima = S.hud.serviti
  S.proponi()
  await dormi(60)
  const sbagliato = { cuori: S.hud.cuori, pazienza: c.restaPazienza,
                      serviti: S.hud.serviti, battuta: S.battuta.value,
                      restoSvelato: /\d/.test(document.querySelector('.cassa .display b').textContent) }

  // 3. il resto giusto invece passa, ma solo dopo il ✓
  S.togli()
  for (const v of S.scomponi(c.resto, c.monete)) S.metti(v)
  await dormi(120)
  const primaDelSi = S.hud.serviti
  S.proponi()
  for (let k = 0; k < 40 && S.hud.serviti === primaDelSi; k++) await dormi(50)

  return { aMente: S.aMente ? S.aMente.value : null, display, quanto,
           accettata, grossa, resto: c.resto, tastoDopoUnaMoneta,
           cuoriPrima, cuoriDopo: sbagliato.cuori, pazienzaPrima,
           pazienzaDopo: sbagliato.pazienza, servitiPrima, dopoSbaglio: sbagliato.serviti,
           battuta: sbagliato.battuta, restoSvelato: sbagliato.restoSvelato,
           primaDelSi, serviti: S.hud.serviti }
})
controlla('nella cassa rotta il gioco lo sa', rotta.aMente === true)
controlla('il display non dice più il resto', !/\d/.test(rotta.display), rotta.display)
controlla('e nemmeno il piatto dice quanto manca', !/manca/i.test(rotta.quanto), rotta.quanto)
uguale('qui la moneta troppo grande si può posare: sbagliare è permesso',
       rotta.accettata, 1)
controlla('e c\'è il tasto per dire "ecco il resto"', rotta.tastoDopoUnaMoneta)
uguale('un resto sbagliato non serve il cliente', rotta.dopoSbaglio, rotta.servitiPrima)
uguale('e non costa un cuore', rotta.cuoriDopo, rotta.cuoriPrima)
controlla('costa tempo', rotta.pazienzaDopo < rotta.pazienzaPrima - 2,
          `${rotta.pazienzaPrima.toFixed(1)}s → ${rotta.pazienzaDopo.toFixed(1)}s`)
controlla('la cassa dice solo se è giusto o sbagliato, non la cifra',
          !rotta.restoSvelato && /troppi|pochi/i.test(rotta.battuta), rotta.battuta)
uguale('col resto giusto il cliente è servito', rotta.serviti, rotta.primaDelSi + 1)
await scatto(page, 'bancarella-cassa-rotta')
nota(`cassa rotta: resto ${rotta.resto}c, rifiutata a mente nessuna moneta ` +
     `(posata anche una da ${rotta.grossa}c)`)

/* ---------- 9. niente errori per strada ---------- */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('La bancarella')
