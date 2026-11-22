/* ═══════════════════════════════════════════════════════════════════
   IL CASTELLO NEL BROWSER: COM'È DISEGNATO, LE LIBERE, LA PAUSA

   perché: il castello come lo vede il bambino: una carta sola in home, piazzole del motore uguali a quelle dipinte, scena vestita in quattro vestiti, nomi delle figure sullo stendardo e nelle schede (capo, ondata mista, abilità), preavviso delle immunità, la prossima ondata a battaglia in corso, il blocchetto; le quattro libere sul regno col loro record; il ⏸ e la barra a 360 px
   a parte perché: le regole del campo stanno nelle unità (`unita/immunita-castello`: chi è immune non prende colpi; `unita/torri-figure`: i due bracci della radura; `unita/ingressi-castello`) e l'equilibrio in `misure/castello`; `castello-sosta` prova l'uscita a metà

   Lo stesso castello, un blocco per prova: com'è disegnato, le quattro
   libere, la pausa e la barra. Si gioca col gancio delle prove (`window.__td`) e il campo
   si porta avanti a mano (`motore().tabellone.stato.onda`) invece di
   giocare le ondate fino al capo o alla mista.

   Con `--scatti` lascia una foto per vestito (`castello-*`), del capo,
   della mista, del blocchetto, della scheda di chi si divide due volte,
   del bastione e della pausa.
   `node test/esegui.mjs integrazione/torri-figure --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, difendi, fumettoDel, leggiProfilo, SCATTI_ACCESI }
  from '../aiuto/browser.mjs'
import { chiudiTraguardi, GIA_FESTEGGIATI } from '../aiuto/traguardi.mjs'
import { controlla, uguale, stessaLista, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { TAPPE, LIBERE, MONDO } from '../../src/data/castello.js'
import { sullaCarta } from '../../src/motore/castello/carta.js'
import { segnoDi } from '../../src/data/mostri.js'
import { Ondate } from '../../src/motore/castello/ondate.js'
import { vestitoDi } from '../../src/giochi/castello/scena/vestito.js'
import { NOMI, figuraDi } from '../../src/giochi/castello/scena/bestiario.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { settings: { sperimentali: true }, ...GIA_FESTEGGIATI })

// le foto vogliono la scena ferma e i cartelli chiusi; senza foto non si aspetta niente
const foto = async (nome, ms = 0) => { if (!SCATTI_ACCESI) return; await chiudiTraguardi(page); await attendi(page, ms); await scatto(page, nome) }

/* si costruisce col gancio delle prove: la torre, poi il suo conto sulla tastiera del foglio */
const costruisci = tipo => page.evaluate(async tipo => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.scegliTorre(tipo)
  await attesa(80)
  const tasti = [...document.querySelectorAll('.tastiera button')]
  T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
  await attesa(200)
  return T.torri().length
}, tipo)

/* una tappa (o una libera) aperta dal gancio: si aspetta che il motore abbia le sue piazzole */
const apri = async (i, libera = null) => {
  await page.evaluate(([i, l]) => (l ? window.__td.iniziaLibera(l) : window.__td.inizia(i)), [i, libera])
  await page.waitForFunction(() => window.__td.fase.value === 'gioco' && window.__td.postazioni().length > 0, null, { timeout: 5000 })
}
const piazzole = () => page.evaluate(() => window.__td.postazioni().map(p => [Math.round(p.x), Math.round(p.y)]))
const dallaCarta = t => sullaCarta(t).posti.map(([fx, fy]) => [Math.round(fx * MONDO.W), Math.round(fy * MONDO.H)])

/* quanto del canvas è colorato come un vestito e non come il suo ripiego: il ripiego è una tinta sola, e un canvas nero ne ha
   una sola anche lui. Si aspetta che la scena vestita arrivi (il foglio di figure si carica da sé), poi si conta */
const colori = () => page.evaluate(() => {
  const c = document.querySelector('.campo canvas')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  const visti = new Set()
  for (let i = 0; i < d.length; i += 4 * 97) visti.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`)
  return visti.size
})
const vestito = async () => {
  await page.waitForFunction(() => {
    const c = document.querySelector('.campo canvas')
    if (!c) return false
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    const visti = new Set()
    for (let i = 0; i < d.length; i += 4 * 97) visti.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`)
    return visti.size > 60
  }, null, { timeout: 5000, polling: 100 }).catch(() => {})
  return colori()
}
// l'ondata chiamata, a velocità tre, finché in campo c'è qualcuno sulla strada (disegnato nel suo vestito)
const ondataInCampo = () => page.evaluate(async () => {
  const T = window.__td
  T.chiamaOnda()
  T.velocita.value = 3
  const fine = Date.now() + 8000
  while (!T.nemici().some(n => n.d > 0) && Date.now() < fine) await new Promise(r => setTimeout(r, 50))
  return T.nemici().length
})

/* ═══════════ 1. la carta, e la mappa ═══════════ */
await blocco('la carta in home', async () => {
  uguale('il castello a sprite non è più un gioco a parte, nemmeno coi giochi in prova',
         await page.locator('.carta.gioco[data-gioco="castello"]').count(), 0)
  uguale('in home il castello è una carta sola', await page.locator('.carta.gioco[data-gioco="torri"]').count(), 1)
  await scegli(page, 'torri')
  await page.waitForSelector('.tappe', { timeout: 5000 })
  uguale('la barra dice «Castello»', (await page.locator('.barra-app .dove').textContent()).trim(), 'Castello')
})

/* ═══════════ 2. una partita nel bosco ═══════════ */
await blocco('il bosco', async () => {
  await apri(0)
  uguale('il motore ha le piazzole della carta', JSON.stringify(await piazzole()), JSON.stringify(dallaCarta(TAPPE[0])))
  /* un tocco vero sulla prima piazzola: dal mondo allo schermo con la telecamera del campo, e il foglio chiede che torre */
  const dove = await page.evaluate(() => {
    const T = window.__td, p = T.postazioni()[0], q = T.versoLoSchermo(p.x, p.y)
    const r = document.querySelector('.campo canvas').getBoundingClientRect()
    return { x: r.left + q.x, y: r.top + q.y }
  })
  await page.mouse.click(dove.x, dove.y)
  await page.waitForFunction(() => window.__td.foglio.value, null, { timeout: 3000 }).catch(() => {})
  uguale('toccata la piazzola, il foglio chiede che torre',
         await page.evaluate(() => window.__td.foglio.value && window.__td.foglio.value.che), 'costruisci')
  await foto('castello-scelta', 500)   // le carte del foglio mostrano la figura del campo: si vede solo a occhio
  uguale('la torre si costruisce', await costruisci('add'), 1)
  controlla('ed è nata sulla piazzola toccata', await page.evaluate(() => {
    const T = window.__td, t = T.torri()[0], p = T.postazioni()[0]
    return Math.hypot(t.x - p.x, t.y - p.y) < 2
  }))
  controlla('l\'ondata scende', (await ondataInCampo()) > 0)
  /* il nome sullo stendardo, per chi è in campo, è quello della figura */
  await page.waitForSelector('[data-stendardo] [data-in-campo]', { timeout: 3000 })
  uguale('lo stendardo dice il nome della figura, non quello del gioco',
         await page.locator('[data-stendardo] [data-in-campo]').first().getAttribute('aria-label'), 'Melma')
  const quanti = await vestito()
  controlla('il campo è vestito, non una tinta sola', quanti > 60, `${quanti} colori`)
  await foto('castello-bosco')
})

/* ═══════════ 3. gli altri vestiti ═══════════
   Il sotterraneo si veste di lava, le mura di neve e la palude del suo (`VESTITO_DI`): tre immagini da decodificare e tre carte
   da comporre, con una torre e i mostri in campo (la palude ha un foglio suo, e il campo non presuppone un numero di decori) */
for (const [campagna, nome] of [['sotterraneo', 'lava'], ['mura', 'neve'], ['palude', 'palude']]) {
  const i = TAPPE.findIndex(t => t.campagna === campagna)
  await blocco(`${TAPPE[i].nome}, vestito di ${nome}`, async () => {
    await apri(i)
    uguale(`${TAPPE[i].nome}: le piazzole della tappa`, (await piazzole()).length, TAPPE[i].posti)
    await costruisci('add')
    controlla(`${TAPPE[i].nome}: l'ondata scende`, (await ondataInCampo()) > 0)
    const quanti = await vestito()
    controlla(`${TAPPE[i].nome}: il campo è vestito`, quanti > 60, `${quanti} colori`)
    await foto(`castello-${nome}`, 600)
  })
}

/* ═══════════ 4. la radura grande, scritta a mano ═══════════
   I due bracci per cui scendono i mostri sono una regola del motore (`unita/torri-figure`); qui che il gioco usi la carta a mano */
await blocco('la radura grande', async () => {
  await apri(null, 'libera-bosco')
  uguale('la radura: il motore ha le piazzole della carta a mano', JSON.stringify(await piazzole()),
         JSON.stringify(dallaCarta(LIBERE.find(l => l.chiave === 'libera-bosco'))))
  await foto('castello-radura', 400)
})

/* ═══════════ 5. il preavviso delle immunità, la fretta, il blocchetto ═══════════
   La grotta apre coi pipistrelli, che le bombe non toccano: il preavviso lo dice (che la bomba non gli spari lo prova
   `unita/immunita-castello`). Poi la prossima ondata si chiama con questa ancora in campo, e il gettone ⬆️ apre il blocchetto. */
await blocco('la grotta: preavviso, fretta e blocchetto', async () => {
  const i = TAPPE.findIndex(t => t.nome === 'La grotta')
  await apri(i)
  /* il preavviso c'è fra un'ondata e l'altra con almeno una torre in campo: prima si costruisce la bomba */
  await costruisci('div')
  await chiudiTraguardi(page)   // un traguardo (le torri costruite in tutto) ferma il campo: niente preavviso
  await page.waitForSelector('[data-onda-preavviso]', { timeout: 3000 })
  const preavviso = await page.evaluate(() => [...document.querySelectorAll('[data-onda-preavviso]')].map(e => e.dataset.immune))
  uguale('il preavviso dice a cosa è immune la prima ondata (bombe e ghiaccio)', (preavviso[0] || '').split(',').sort().join(','), 'div,mul')
  await costruisci('add')
  await page.evaluate(() => { const T = window.__td; T.chiamaOnda(); T.velocita.value = 3 })
  await page.waitForSelector('[data-azione="chiama-prossima"]', { timeout: 12000 })
  const prima = await page.evaluate(() => window.__td.hud.onda)
  controlla('a ondata uscita tutta c\'è il tasto per chiamare la prossima, con questa ancora in campo',
            await page.evaluate(() => window.__td.nemici().length > 0))
  await page.click('[data-azione="chiama-prossima"]')
  controlla('e toccarlo la manda subito', await page.waitForFunction(p => window.__td.hud.onda === p + 1, prima, { timeout: 2000 })
    .then(() => true, () => false), `ondata ${await page.evaluate(() => window.__td.hud.onda)} dopo la ${prima}`)
  await chiudiTraguardi(page)
  await page.locator('[data-azione="potenziamenti"]').click()
  controlla('il gettone ⬆️ apre il blocchetto',
            await page.waitForSelector('[data-blocchetto]', { state: 'visible', timeout: 3000 }).then(() => true, () => false))
  controlla('con una riga per le bombe e una per gli arcieri',
            await page.locator('[data-blocchetto-torre="div"]').count() === 1 &&
            await page.locator('[data-blocchetto-torre="add"]').count() === 1)
  await foto('castello-blocchetto')
  await page.locator('.foglio:not(.via) button[aria-label="chiudi"]').click()
  controlla('e la ✕ lo chiude', await page.waitForFunction(() => window.__td.blocchetto.value === null, null, { timeout: 2000 })
    .then(() => true, () => false))
})

/* ═══════════ 6. il capo ═══════════
   L'ultima ondata della gola (vestita di lava) è un capo: il tabellone si porta alla penultima, e il capo si chiama come
   un'ondata qualunque. */
await blocco('il capo', async () => {
  const i = TAPPE.findIndex(t => t.campagna === 'sotterraneo' && t.capo)
  nota(`${TAPPE[i].nome}: il capo`)
  await apri(i)
  await costruisci('add')
  await costruisci('div')
  await chiudiTraguardi(page)
  const capo = await page.evaluate(async foto => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td, m = T.motore()
    m.nemici.length = 0; m.daGenerare = 0; m.prossimo = 0   // il campo pulito, se nel frattempo è partita la prima
    m.tabellone.stato.onda = m.tappa.ondate - 1
    T.chiamaOnda()
    T.velocita.value = 3
    const fine = Date.now() + 8000
    while (!T.nemici().some(n => n.capo && n.d > 0) && Date.now() < fine) await attesa(50)
    // per la foto un pezzo di strada, con la corona e la barra della vita dentro il campo
    if (foto) while ((T.nemici().find(n => n.capo)?.d ?? 999) < 220 && Date.now() < fine + 8000) await attesa(100)
    const n = T.nemici().find(n => n.capo)
    return { capo: !!n, taglia: n ? n.taglia : 0, bestia: n && n.bestia }
  }, SCATTI_ACCESI)
  controlla('il capo è in campo, grande', capo.capo && capo.taglia > 2, JSON.stringify(capo))
  /* il medaglione del capo, aperto: la scheda lo chiama col nome della figura, gigante */
  await page.click('[data-stendardo] [data-in-campo][data-capo]')
  await page.waitForSelector('[data-scheda-grande] .nome', { timeout: 3000 })
  uguale('la scheda lo chiama col nome della figura, gigante', await page.locator('[data-scheda-grande] .nome').textContent(),
         `${NOMI[figuraDi('lava', capo.bestia)]} gigante`)
  await page.click('[data-azione="chiudi-scheda"]')
  await foto('castello-capo', 300)
})

/* ═══════════ 7. l'ondata mista ═══════════
   La prima tappa delle Mura chiude con due tipi mescolati (`coppiaDellOnda` in `data/mostri.js`): il tabellone si porta a due
   ondate dalla mista, per leggerla nel preavviso, poi alla vigilia, e la si chiama. */
await blocco('l\'ondata mista', async () => {
  const i = TAPPE.findIndex(t => t.campagna === 'mura')
  const t = TAPPE[i], o = t.capo ? t.ondate - 1 : t.ondate
  const attesa = new Ondate(t).bestiaDi(o)
  nota(`${t.nome}: l'ondata mista (${attesa.id} e ${attesa.con?.id})`)
  controlla(`l'ondata ${o} del ${t.nome} è mista`, !!attesa.con)
  await apri(i)
  await costruisci('add')
  await costruisci('div')
  await chiudiTraguardi(page)
  await page.evaluate(o => {
    const m = window.__td.motore()
    m.nemici.length = 0; m.daGenerare = 0; m.prossimo = 0
    m.tabellone.stato.onda = o - 2
  }, o)
  await page.waitForSelector(`[data-onda-preavviso="${o}"]`, { timeout: 3000 })
  const preavviso = await page.evaluate(o => {
    const e = document.querySelector(`[data-onda-preavviso="${o}"]`)
    return { mista: e.dataset.mista, immune: e.dataset.immune, con: e.dataset.immuneCon, facce: e.querySelectorAll('.faccia').length }
  }, o)
  controlla('il preavviso annuncia la mista', !!preavviso.mista, JSON.stringify(preavviso))
  uguale('con due facce', preavviso.facce, 2)
  uguale('e le immunità di tutti e due, ognuna sulla sua faccia', [preavviso.immune, preavviso.con].join(' | '),
         [attesa.immune.join(','), attesa.con.immune.join(',')].join(' | '))
  await foto('castello-mista-preavviso', 300)
  const campo = await page.evaluate(async ([o, foto]) => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td, m = T.motore()
    m.nemici.length = 0; m.daGenerare = 0; m.prossimo = 0
    m.tabellone.stato.onda = o - 1
    T.chiamaOnda()
    T.velocita.value = 3
    // finché in campo ci sono i due tipi (per la foto: mescolati e dentro il campo)
    const basta = () => new Set(T.nemici().filter(n => n.d > (foto ? 60 : 0)).map(n => n.bestia)).size >= 2 &&
                        (!foto || T.nemici().filter(n => n.d > 0).length >= 6)
    const fine = Date.now() + 12000
    while (Date.now() < fine && !basta()) await attesa(50)
    return { tipi: [...new Set(T.nemici().map(n => n.bestia))].sort() }
  }, [o, SCATTI_ACCESI])
  uguale('in campo scendono i due tipi, mescolati', campo.tipi.join(), [attesa.id, attesa.con.id].sort().join())
  /* lo stendardo: il primo medaglione è chi è in campo, e toccato apre la sua scheda */
  await page.click('[data-stendardo] [data-in-campo]')
  await page.waitForSelector('[data-scheda-mista] .nome', { timeout: 3000 })
  const figura = id => NOMI[figuraDi(vestitoDi(t), id)]
  uguale('la scheda li chiama coi nomi delle figure', await page.locator('[data-scheda-mista] .nome').first().textContent(),
         `${figura(attesa.id)} e ${figura(attesa.con.id)}`)
  uguale('con una riga di immunità per ciascuno', await page.locator('[data-scheda-mista] [data-scheda-immune]').count(), 2)
  await foto('castello-scheda-mista')
  await page.click('[data-azione="chiudi-scheda"]')
  await foto('castello-mista', 300)
})

/* ═══════════ 8. la riga dell'abilità si legge ═══════════
   Si chiamava `.fa`, e `.fa` è la radice della fattoria: un foglio globale le dava un fondo verde quasi nero. Tre abilità, ognuna
   chiamata con la sua ondata: si divide (il guado), si divide due volte (il corridoio delle mura), si rialza (la gola). */
const casi = [
  ['palude', t => t.nome === 'Il guado', b => b.abilita === 'dividi' && b.divisioni === 1, segnoDi('dividi', 1).che],
  ['mura', t => t.divisioni === 2, b => b.abilita === 'dividi' && b.divisioni === 2, segnoDi('dividi', 2).che],
  ['sotterraneo', t => t.nome === 'La gola', b => b.abilita === 'risorge', segnoDi('risorge').che],
]
for (const [campagna, quale, chi, frase] of casi) {
  const i = TAPPE.findIndex(t => t.campagna === campagna && quale(t))
  const t = TAPPE[i], ondate = new Ondate(t)
  let o = 1
  while (o < t.ondate && !(chi(ondate.bestiaDi(o)) && !ondate.bestiaDi(o).con && !ondate.bestiaDi(o).capo)) o++
  await blocco(`${t.nome}: la riga «${frase}»`, async () => {
    nota(`${t.nome}: l'ondata ${o}, ${ondate.bestiaDi(o).id} che ${frase}`)
    await apri(i)
    await costruisci('add')
    await chiudiTraguardi(page)
    const riga = await page.evaluate(async o => {
      const attesa = ms => new Promise(r => setTimeout(r, ms))
      const T = window.__td, m = T.motore()
      m.nemici.length = 0; m.daGenerare = 0; m.prossimo = 0
      m.tabellone.stato.onda = o - 1
      T.chiamaOnda()
      const fine = Date.now() + 8000
      let e = null, med = null
      // si apre la scheda di chi è in campo, toccando il suo medaglione sullo stendardo
      while (!(med = document.querySelector('[data-stendardo] [data-in-campo]')) && Date.now() < fine) await attesa(50)
      if (med) med.click()
      while (!(e = document.querySelector('[data-scheda-abilita]')) && Date.now() < fine) await attesa(50)
      if (!e) return null
      const fondo = n => getComputedStyle(n).backgroundColor
      /* il fondo che si vede: il primo non trasparente risalendo fino alla scheda */
      let n = e, visto = 'rgba(0, 0, 0, 0)'
      while (n && !n.classList.contains('pergamena')) {
        if (!/rgba\(0, 0, 0, 0\)|transparent/.test(fondo(n))) { visto = fondo(n); break }
        n = n.parentElement
      }
      return { testo: e.textContent.trim(), fondo: fondo(e), visto, divisioni: e.dataset.divisioni || null }
    }, o)
    controlla(`${t.nome}: la scheda dice «${frase}»`, !!riga && riga.testo === frase, JSON.stringify(riga))
    uguale(`${t.nome}: la riga dell'abilità non ha un fondo suo`, riga?.fondo, 'rgba(0, 0, 0, 0)')
    const chiaro = c => { const v = (c.match(/\d+/g) || []).map(Number); return v[3] === 0 || v.slice(0, 3).reduce((s, x) => s + x, 0) > 600 }
    controlla(`${t.nome}: e sotto c'è un fondo chiaro`, !!riga && chiaro(riga.visto), riga?.visto)
    if (frase === segnoDi('dividi', 2).che) {
      uguale('e il segno lo dice: data-divisioni', riga?.divisioni, '2')
      await foto('castello-scheda-abilita', 600)
    }
    await page.click('[data-azione="chiudi-scheda"]').catch(() => {})
  })
}

/* ═══════════ 9. le quattro partite libere, dal dito ═══════════
   Quello che `misure/castello` non può vedere: sul regno quattro torrioni, uno per terreno, ognuno col suo record; toccarne
   uno apre proprio quella libera; a fine partita il record finisce nel quaderno di quel terreno, e quello della vecchia
   libera (una sola, a strada singola) si ritrova sotto il bosco senza migrazione. Un bambino che ha finito la campagna,
   col record di quando la libera era una sola e due regali in tasca. */
await blocco('le quattro libere', async () => {
  await page.evaluate(() => history.replaceState(null, '', location.pathname))
  await semina(page, {
    td: { tappa: 20, libera: true, v: 2 },
    campagne: { torri: { tappa: 0, libera: false, stelle: {}, cfg: {},
                         primato: { best: 21, quando: 5, partite: 3, ultime: [{ v: 21, t: 5 }], dettagli: { uccisi: 400, torri: 4 } },
                         regali: { frecce: 2 } } },
    ...GIA_FESTEGGIATI,
  })
  const rigaHome = await page.locator('.carta.gioco[data-gioco="torri"]').textContent()
  controlla('in home il record di ieri sta sotto il bosco', /radura grande.*21 ondate/i.test(rigaHome), rigaHome)
  await scegli(page, 'torri')
  await page.waitForSelector('.tappe')
  // sul regno le libere sono i quattro torrioni; il record lo dice il fumetto
  const chiavi = await page.$$eval('[data-tappa^="libera-"]', bs => bs.map(b => b.dataset.tappa))
  const tasti = []
  for (const chiave of chiavi) tasti.push({ chiave, testo: await fumettoDel(page, `[data-tappa="${chiave}"]`) })
  uguale('sulla mappa ci sono quattro partite libere, nell\'ordine dei terreni', tasti.map(t => t.chiave).join(','),
         'libera-bosco,libera-sotterraneo,libera-mura,libera-palude')
  const bosco = tasti.find(t => t.chiave === 'libera-bosco')
  controlla('il bosco porta il record della vecchia libera', /21 ondate/.test(bosco.testo), bosco.testo)
  controlla('e com\'era fatta quella partita', /400 nemici fermati/.test(bosco.testo), bosco.testo)
  const mura = tasti.find(t => t.chiave === 'libera-mura')
  controlla('le mura non hanno ancora un record', !/record/.test(mura.testo), mura.testo)
  controlla('i regali si vedono, una volta per tutte e quattro', /2 potenziamenti/.test(await page.locator('[data-regali]').textContent()))

  /* toccato il torrione delle mura, il cavaliere ci va a piedi per il ponte; poi «Gioca ▶» nel fumetto */
  await page.click('[data-tappa="libera-mura"]')
  controlla('il cavaliere è andato a piedi fino al torrione delle mura',
            await page.waitForSelector('[data-eroe][data-dove="libera-mura"][data-in-viaggio="0"]', { timeout: 15000 }).then(() => true, () => false),
            `è a ${await page.locator('[data-eroe]').getAttribute('data-dove')}`)
  await page.click('[data-fumetto] [data-azione="gioca"]')
  const dentro = await page.evaluate(() => ({ fase: window.__td.fase.value, idx: window.__td.tappaIdx.value, quale: window.__td.liberaScelta.value }))
  uguale('la partita è cominciata, ed è la libera delle mura', `${dentro.fase} ${dentro.idx} ${dentro.quale}`, 'gioco -1 libera-mura')
  await foto('torri-libere-bastione')
  /* si perde in fretta: un arciere (senza torri il gioco non manda l'ondata), ondate chiamate appena si può, campo a tutta
     velocità; un regalo in sospeso blocca la chiamata, quindi si prende il primo. `daOnda` spinge il contatore delle ondate */
  const perdi = (daOnda = 0) => page.evaluate(async daOnda => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.scegliTorre('add')
    T.operazioneFinita({ errori: 0, ms: 900 })   // il conto, pagato senza tastiera
    await attesa(100)
    T.velocita.value = 60
    if (daOnda) T.hud.onda = daOnda
    for (let giro = 0; giro < 600 && T.fase.value === 'gioco'; giro++) {
      if (T.regaloAperto.value) T.prendiRegalo('frecce')
      if (T.inAttesa.value) T.chiamaOnda()
      await attesa(25)
    }
    return { fase: T.fase.value, onda: T.hud.onda, monete: T.monete.prese }
  }, daOnda)
  /* il contatore si spinge a tre: la prima ondata del bastione la taratura la fa per due torri, e un record zero il tasto non lo scrive */
  const caduta = await perdi(3)
  uguale('con un arciere solo il castello cade', caduta.fase, 'fine')
  // il conto dell'arciere si è pagato quando la torre è salita, anche in una partita persa (docs/apprendimento/calibrazione.md)
  uguale('un conto senza errori, tre monete', caduta.monete, 3)
  uguale('e il cartello di fine le dice', await page.locator('[data-monete-prese]').first().innerText(), '+3 🪙')
  const cartello = await page.locator('[data-primato]').textContent()
  controlla('e il cartello dice del primo risultato su questo terreno', /primo risultato/.test(cartello), cartello)
  const torri = (await leggiProfilo(page)).campagne.torri
  controlla('il record è scritto sotto le mura', !!(torri.primati && torri.primati['libera-mura']), JSON.stringify(torri.primati))
  uguale('con una partita contata', torri.primati['libera-mura'].partite, 1)
  uguale('e il record di ieri è ancora lì per il bosco, intatto', torri.primato && torri.primato.best, 21)
  controlla('il bosco non ha ancora un quaderno suo', !torri.primati['libera-bosco'])
  await chiudiTraguardi(page)
  await page.click('.banco .bottone.chiaro')
  await page.waitForSelector('[data-tappa="libera-mura"]')
  controlla('tornati al regno, le mura hanno il loro record', /record/.test(await fumettoDel(page, '[data-tappa="libera-mura"]')))

  /* il record si aggiorna subito, senza ricaricare: si batte il 21 del bosco (l'ondata spinta a 30), e il torrione e la home
     dicono il nuovo */
  await difendi(page, '[data-tappa="libera-bosco"]')
  await page.waitForFunction(() => window.__td.fase.value === 'gioco', null, { timeout: 5000 })
  const cadutaBosco = await perdi(30)
  uguale('anche nel bosco il castello cade, a un\'ondata oltre la trentesima', cadutaBosco.fase === 'fine' && cadutaBosco.onda >= 30, true)
  const cartelloBosco = await page.locator('[data-primato]').textContent()
  controlla('e il cartello festeggia il record', /record/i.test(cartelloBosco), cartelloBosco)
  await chiudiTraguardi(page)
  await page.click('.banco .bottone.chiaro')
  await page.waitForSelector('[data-tappa="libera-bosco"]')
  const subito = await fumettoDel(page, '[data-tappa="libera-bosco"]')
  const nuovo = `${cadutaBosco.onda - 1} ondate`
  controlla(`il torrione del bosco dice subito il record nuovo (${nuovo}), non più quello di ieri`,
            subito.includes(nuovo) && !/21 ondate/.test(subito), subito)
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carta.gioco[data-gioco="torri"]')
  const rigaDopo = await page.locator('.carta.gioco[data-gioco="torri"]').textContent()
  controlla('e la home racconta il record appena fatto', rigaDopo.includes(nuovo), rigaDopo)
})

/* ═══════════ 10. la pausa, e la barra che non sfonda ═══════════
   Al telefono e allo schermo grande: in battaglia il ⏸ ferma i nemici e il castello (la misura è la strada fatta da tutti,
   `d`), il click che il dito si lascia dietro non toglie il velo, e a 360 px la barra tiene tutti i suoi tasti (il tasto per
   tornare indietro è già finito una volta fuori dallo schermo). */
const grande = await apriGioco(browser, { viewport: { width: 1280, height: 800 } })
for (const [nome, p] of [['mobile', page], ['desktop', grande.page]]) {
  await blocco(`la pausa, ${nome}`, async () => {
    const passi = () => p.evaluate(() => {
      const T = window.__td
      return { cuori: T.hud.cuori, strada: Math.round(T.nemici().reduce((s, n) => s + n.d, 0)) }
    })
    const veli = () => p.locator('[data-pausa]').count()
    if (!(await p.locator('.tappe').count())) {
      await scegli(p, 'torri')
      await p.waitForSelector('.tappe')
    }
    /* una tappa pulita a 1×, una torre in piedi (senza, l'ondata non parte) e l'ondata chiamata a mano */
    await p.evaluate(async () => {
      const attesa = ms => new Promise(r => setTimeout(r, ms))
      const T = window.__td
      T.inizia(0)
      await attesa(150)
      while (T.velocita.value !== 1) T.cambiaVelocita()
      T.scegliTorre('add')
      await attesa(80)
      T.operazioneFinita({ errori: 0, ms: 900 })
      await attesa(150)
      T.chiamaOnda()
    })
    await chiudiTraguardi(p)   // sotto il cartello di un traguardo il ⏸ non c'è: il campo è già fermo dietro un velo suo
    await p.waitForSelector('button[aria-label="pausa"]', { timeout: 9000 })
    // il primo nemico nasce prima dell'inizio della strada (metri negativi): si aspetta che ci entri
    controlla(`[${nome}] in battaglia i nemici camminano`, await p.waitForFunction(() =>
      window.__td.nemici().reduce((s, n) => s + n.d, 0) > 0, null, { timeout: 5000 }).then(() => true, () => false))
    await p.locator('button[aria-label="pausa"]').click()
    uguale(`[${nome}] il velo compare`, await veli(), 1)
    await p.evaluate(() => document.querySelector('[data-azione="riprendi"]')?.click())   // il click fantasma
    uguale(`[${nome}] il click che il dito si lascia dietro non la toglie`, await veli(), 1)
    const fermi = await passi()
    await attendi(p, 1000)
    const ancora = await passi()
    uguale(`[${nome}] e i nemici non fanno un metro`, ancora.strada, fermi.strada)
    uguale(`[${nome}] né il castello perde un cuore`, ancora.cuori, fermi.cuori)
    controlla(`[${nome}] la pausa dice a che ondata si era`, /ondata/.test(await p.locator('[data-pausa]').textContent()))
    await scatto(p, `torri-pausa-${nome}`)
    await p.locator('[data-azione="riprendi"]').click()
    uguale(`[${nome}] il velo sparisce`, await veli(), 0)
    controlla(`[${nome}] e la battaglia riparte`, await p.waitForFunction(s =>
      Math.round(window.__td.nemici().reduce((t, n) => t + n.d, 0)) !== s, fermi.strada, { timeout: 3000 }).then(() => true, () => false))
    /* il ⏸ è il sesto tondo di una barra che nel castello porta anche i gettoni */
    await p.setViewportSize({ width: 360, height: 640 })
    await p.waitForFunction(() => innerWidth === 360)
    const barra = await p.evaluate(() => {
      const b = document.querySelector('.barra-app')
      return { fuori: b.scrollWidth - b.clientWidth,
               tasti: [...b.querySelectorAll('button')].map(t => t.getAttribute('aria-label')).filter(Boolean) }
    })
    controlla(`[${nome}] a 360 px la barra del castello non sfonda`, barra.fuori <= 0, `${barra.fuori} px di troppo`)
    stessaLista(`[${nome}] e i tasti ci sono tutti, nell'ordine di sempre`, barra.tasti, ['indietro', 'pausa', 'aiuto', 'suono'])
  })
}

const tutti = [...errori, ...grande.errori.map(e => `[desktop] ${e}`)]
controlla('nessun errore in console', tutti.length === 0, tutti.join(' · '))
await browser.close()
riassunto('il castello: com\'è disegnato, le libere, la pausa')
