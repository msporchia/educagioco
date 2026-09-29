/* ═══════════════════════════════════════════════════════════════════
   IL CASTELLO A SPRITE, GIOCATO

   Il gioco `castello` è il tower defense vero con un'altra pelle
   (`src/giochi/castello/scena/pelle.js`). Le regole le provano già
   `unita/castello` e `integrazione/torri`; qui si prova quello che la
   pelle può rompere:

     · la carta compare in home coi giochi in prova accesi, e apre la
       mappa delle tappe di sempre;
     · il motore ha **le piazzole della carta**, cioè quelle dipinte sul
       fondale — se fossero altre, il dito toccherebbe una pietra e la
       torre nascerebbe sul prato — e un tocco vero su una di loro apre
       il foglio;
     · una torre si costruisce, l'ondata parte e i mostri camminano;
     · il campo si vede, e non è il ripiego a tinta unita: la scena
       vestita ha colori che il ripiego non ha;
     · il nastro e la scheda dicono il nome della **figura** che si vede
       (`scena/bestiario.js`): nel bosco lo slime è la «Melma»;
     · la radura grande, l'unica carta scritta a mano, si gioca: il
       motore ha le sue piazzole, e i mostri scendono per tutti e due i
       bracci;
     · le cose nuove si vedono anche con questa pelle: il preavviso
       dice le immunità, la torre non spreca colpi su chi le è immune,
       la prossima ondata si chiama a battaglia in corso, e il
       blocchetto dei potenziamenti si apre e si chiude con la ✕;
     · il capo è la figura del bestiario di quel vestito, gigante: la
       scheda lo chiama col nome della figura e «gigante»;
     · l'ondata mista (in fondo a una tappa delle Mura): il preavviso la
       annuncia con due facce e due immunità, in campo scendono i due
       tipi mescolati, e la scheda li chiama coi nomi delle figure;
     · nessun errore in console, in quattro vestiti diversi.

   Con `--scatti` lascia una foto per vestito (`castello-sprite-*`),
   una della radura (`castello-sprite-radura`), una del blocchetto
   (`castello-sprite-blocchetto`), una del capo (`castello-sprite-capo`) e
   una dell'ondata mista (`castello-sprite-mista`).
   `node test/esegui.mjs castello-sprite`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { TAPPE, LIBERE, MONDO } from '../../src/data/castello.js'
import { cartaDi, percorsoDi } from '../../src/motore/castello/carta.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { settings: { sperimentali: true } })

/* ---------- 1. la carta, e la mappa ---------- */
const carta = page.locator('.carta.gioco[data-gioco="castello"]')
controlla('la carta è in home coi giochi in prova accesi', await carta.count() === 1)
await carta.click()
await page.waitForSelector('.tappe', { timeout: 5000 })
controlla('la barra dice che è il castello a sprite',
          (await page.locator('.barra-app .dove').textContent()).includes('sprite'))

/* le cose da fare dentro la pagina: si gioca col gancio dei test del
   tower defense, lo stesso di `integrazione/torri` */
const costruisci = (tipo) => page.evaluate(async tipo => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.scegliTorre(tipo)
  await attesa(80)
  const tasti = [...document.querySelectorAll('.tastiera button')]
  T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
  await attesa(200)
  return T.torri().length
}, tipo)

/* quanto del canvas è colorato come un vestito e non come il suo
   ripiego: si contano i colori diversi su una griglia di campioni — il
   ripiego è una tinta sola, e un canvas nero ne ha una sola anche lui */
const colori = () => page.evaluate(() => {
  const c = document.querySelector('.campo canvas')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  const visti = new Set()
  for (let i = 0; i < d.length; i += 4 * 97) visti.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`)
  return visti.size
})

/* i cartelli dei traguardi (una torre costruita, trenta conti senza
   errori) coprono il campo: si chiudono come li chiude un bambino, e
   solo per la foto — il campo sotto intanto è fermo, e va bene */
async function togliCartelli() {
  for (let i = 0; i < 6 && await page.locator('.velo .cartello').count(); i++) {
    await page.locator('.velo').first().click()
    await attendi(page, 350)
  }
}

/* ---------- 2. una partita nel bosco ---------- */
nota('il bosco')
await page.evaluate(() => window.__td.inizia(0))
await attendi(page, 900)

const attese = percorsoDi(cartaDi(TAPPE[0])).percorso.posti
  .map(([fx, fy]) => [Math.round(fx * MONDO.W), Math.round(fy * MONDO.H)])
const motore = (await page.evaluate(() => window.__td.postazioni().map(p => [p.x, p.y])))
  .map(([x, y]) => [Math.round(x), Math.round(y)])
uguale('il motore ha le piazzole della carta', JSON.stringify(motore), JSON.stringify(attese))

/* un tocco vero sulla prima piazzola: dal mondo allo schermo con la
   telecamera del campo, e il foglio deve chiedere che torre */
const dove = await page.evaluate(() => {
  const T = window.__td
  const p = T.postazioni()[0]
  const q = T.versoLoSchermo(p.x, p.y)
  const r = document.querySelector('.campo canvas').getBoundingClientRect()
  return { x: r.left + q.x, y: r.top + q.y }
})
await page.mouse.click(dove.x, dove.y)
await attendi(page, 300)
uguale('toccata la piazzola, il foglio chiede che torre',
       await page.evaluate(() => window.__td.foglio.value && window.__td.foglio.value.che), 'costruisci')
/* le carte del foglio mostrano la figura del campo, non la torre a
   poligoni: si vede solo a occhio, quindi uno scatto (il foglio di
   figure si carica da sé, e i ritratti si ridipingono quando c'è) */
await attendi(page, 500)
await scatto(page, 'castello-sprite-scelta')

uguale('la torre si costruisce', await costruisci('add'), 1)
controlla('ed è nata sulla piazzola toccata', await page.evaluate(() => {
  const T = window.__td, t = T.torri()[0], p = T.postazioni()[0]
  return Math.hypot(t.x - p.x, t.y - p.y) < 2
}))

const cammino = await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.chiamaOnda()
  T.velocita.value = 3
  const fine = Date.now() + 5000
  while (!T.nemici().length && Date.now() < fine) await attesa(100)
  const prima = T.nemici().length ? T.nemici()[0].d : null
  await attesa(1200)
  const dopo = T.nemici().length ? Math.max(...T.nemici().map(n => n.d)) : null
  return { onda: T.hud.onda, prima, dopo, uccisi: T.hud.uccisi }
})
controlla('l\'ondata parte', cammino.onda >= 1, JSON.stringify(cammino))
controlla('e i mostri camminano', cammino.prima != null &&
          (cammino.dopo > cammino.prima || cammino.uccisi > 0), JSON.stringify(cammino))
/* il nome sulla scheda del mostro in campo è quello della figura */
const nome = await page.locator('.scheda .dati b').first().textContent().catch(() => '')
uguale('la scheda dice il nome della figura, non quello del gioco', nome, 'Melma')
const nelBosco = await colori()
controlla('il campo è vestito, non una tinta sola', nelBosco > 60, `${nelBosco} colori`)
await togliCartelli()
await scatto(page, 'castello-sprite-bosco')

/* ---------- 3. gli altri vestiti ----------
   Il sotterraneo si veste di lava, le mura di neve e la palude del suo
   (`VESTITO_DI`): tre immagini diverse da decodificare, e tre carte
   diverse da comporre. La palude ha un foglio suo, con più decori grandi
   e meno alberi del bosco: `QUANTI` li conta, e il campo non ne
   presuppone un numero. */
for (const [i, nome] of [[TAPPE.findIndex(t => t.campagna === 'sotterraneo'), 'lava'],
                         [TAPPE.findIndex(t => t.campagna === 'mura'), 'neve'],
                         [TAPPE.findIndex(t => t.campagna === 'palude'), 'palude']]) {
  nota(`${TAPPE[i].nome}, vestito di ${nome}`)
  await page.evaluate(i => window.__td.inizia(i), i)
  await attendi(page, 900)
  const n = await page.evaluate(() => window.__td.postazioni().length)
  uguale(`${TAPPE[i].nome}: le piazzole della tappa`, n, TAPPE[i].posti)
  await costruisci('add')
  await costruisci('sub')
  await page.evaluate(async () => {
    const T = window.__td
    T.chiamaOnda()
    T.velocita.value = 3
    await new Promise(r => setTimeout(r, 2500))
  })
  const quanti = await colori()
  controlla(`${TAPPE[i].nome}: il campo è vestito`, quanti > 60, `${quanti} colori`)
  await togliCartelli()
  await attendi(page, 600)
  await scatto(page, `castello-sprite-${nome}`)
}

/* ---------- 4. la radura grande, scritta a mano ---------- */
nota('la radura grande')
const radura = LIBERE.find(l => l.chiave === 'libera-bosco')
await page.evaluate(() => window.__td.iniziaLibera('libera-bosco'))
await attendi(page, 900)
const attesaRadura = percorsoDi(cartaDi(radura)).percorso.posti
  .map(([fx, fy]) => [Math.round(fx * MONDO.W), Math.round(fy * MONDO.H)])
const inRadura = (await page.evaluate(() => window.__td.postazioni().map(p => [p.x, p.y])))
  .map(([x, y]) => [Math.round(x), Math.round(y)])
uguale('la radura: il motore ha le piazzole della carta a mano', JSON.stringify(inRadura), JSON.stringify(attesaRadura))
await costruisci('add')
await costruisci('sub')
const bracci = await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  const vie = new Set()
  T.velocita.value = 3
  /* la terza ondata arriva da tutte e due le parti: se ne chiamano
     tre, e si guarda da quali bracci è passato qualcuno */
  for (let o = 0; o < 3; o++) {
    const fine = Date.now() + 8000
    while (!T.inAttesa.value && Date.now() < fine) await attesa(100)
    T.chiamaOnda()
    for (let i = 0; i < 25; i++) { T.nemici().forEach(n => vie.add(n.via)); await attesa(100) }
  }
  return [...vie].sort()
})
uguale('la radura: i mostri scendono per tutti e due i bracci', JSON.stringify(bracci), '[0,1]')
await togliCartelli()
await attendi(page, 400)
await scatto(page, 'castello-sprite-radura')

/* ---------- 5. immunità, fretta e blocchetto ----------
   La grotta apre coi pipistrelli, che le bombe non toccano: la bomba
   non deve sparargli nemmeno un colpo — ci pensa l'arciere — e il
   segno «immune» non deve comparire, perché nessuno ha tirato a vuoto. Poi la
   prossima ondata si chiama con questa ancora in campo, e il gettone ⬆️
   apre il blocchetto. */
{
  const i = TAPPE.findIndex(t => t.nome === 'La grotta')
  nota(`${TAPPE[i].nome}: immunità, fretta e blocchetto`)
  await page.evaluate(i => window.__td.inizia(i), i)
  await attendi(page, 900)
  /* il preavviso c'è fra un'ondata e l'altra con almeno una torre in
     campo: prima si costruisce la bomba */
  await costruisci('div')
  /* un traguardo (le torri costruite in tutto, i conti senza errori) può
     scattare proprio qui — dipende da quante tappe si sono giocate prima,
     e con la palude sono una di più — e il suo cartello ferma il campo:
     niente attesa, niente preavviso */
  await togliCartelli()
  await attendi(page, 300)
  const preavviso = await page.evaluate(() =>
    [...document.querySelectorAll('[data-onda-preavviso]')].map(e => e.dataset.immune))
  uguale('il preavviso dice a cosa è immune la prima ondata (bombe e ghiaccio)',
         (preavviso[0] || '').split(',').sort().join(','), 'div,mul')
  await costruisci('add')
  const partita = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.chiamaOnda()
    T.velocita.value = 2
    /* chi ha sparato si vede dalla ricarica: una torre che non ha mai
       tirato la tiene sotto zero (è pronta), una che ha tirato la
       rimette in positivo. I colpi volano troppo in fretta per
       contarli guardando ogni tanto */
    const sparato = tipo => T.torri().some(t => t.tipo === tipo && t.ricarica > 0)
    let respinto = false, chiama = false, bombe = false, frecce = false
    const fine = Date.now() + 9000
    while (Date.now() < fine && !(chiama && frecce)) {
      respinto ||= T.nemici().some(n => n.respinto > 0)
      bombe ||= sparato('div')
      frecce ||= sparato('add')
      chiama ||= !!document.querySelector('[data-azione="chiama-prossima"]')
      await attesa(60)
    }
    const prima = T.hud.onda
    document.querySelector('[data-azione="chiama-prossima"]')?.click()
    await attesa(200)
    return { respinto, chiama, bombe, frecce, prima, dopo: T.hud.onda }
  })
  uguale('la bomba non spara ai pipistrelli, che le sono immuni', partita.bombe, false)
  controlla('l\'arciere sì', partita.frecce, JSON.stringify(partita))
  controlla('e nessuno ha il segno «immune»: nessun colpo è andato a vuoto', !partita.respinto)
  controlla('a ondata uscita tutta c\'è il tasto per chiamare la prossima', partita.chiama)
  uguale('e toccarlo la manda subito', partita.dopo, partita.prima + 1)
  await togliCartelli()
  await page.locator('[data-azione="potenziamenti"]').click()
  await attendi(page, 400)
  controlla('il gettone ⬆️ apre il blocchetto', await page.locator('[data-blocchetto]').isVisible())
  controlla('con una riga per le bombe e una per gli arcieri',
            await page.locator('[data-blocchetto-torre="div"]').count() === 1 &&
            await page.locator('[data-blocchetto-torre="add"]').count() === 1)
  await scatto(page, 'castello-sprite-blocchetto')
  await page.locator('.foglio:not(.via) button[aria-label="chiudi"]').click()
  await attendi(page, 400)
  uguale('e la ✕ lo chiude', await page.evaluate(() => window.__td.blocchetto.value), null)
}

/* ---------- 6. il capo ----------
   L'ultima ondata della gola (vestita di lava) è un capo. Giocarle
   tutte costerebbe minuti: il tabellone si porta alla penultima, e il
   capo si chiama come un'ondata qualunque. */
{
  const i = TAPPE.findIndex(t => t.campagna === 'sotterraneo' && t.capo)
  nota(`${TAPPE[i].nome}: il capo`)
  await page.evaluate(i => window.__td.inizia(i), i)
  await attendi(page, 900)
  await costruisci('add')
  await costruisci('div')
  /* un cartello aperto ferma il campo: prima si chiudono */
  await togliCartelli()
  const capo = await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td, m = T.motore()
    /* il campo pulito, se nel frattempo l'attesa ha mandato la prima */
    m.nemici.length = 0; m.daGenerare = 0; m.prossimo = 0
    m.tabellone.stato.onda = m.tappa.ondate - 1
    T.chiamaOnda()
    const fine = Date.now() + 8000
    while (!T.nemici().some(n => n.capo) && Date.now() < fine) await attesa(100)
    /* un pezzo di strada, così nella foto è tutto dentro il campo, con
       la corona e la barra della vita sopra la testa */
    const via = Date.now() + 8000
    while ((T.nemici().find(n => n.capo)?.d ?? 999) < 220 && Date.now() < via) await attesa(100)
    const n = T.nemici().find(n => n.capo)
    return { capo: !!n, taglia: n ? n.taglia : 0, bestia: n && n.bestia,
             onda: T.hud.onda }
  })
  controlla('il capo è in campo, grande', capo.capo && capo.taglia > 2, JSON.stringify(capo))
  const scheda = await page.locator('.scheda .dati b').first().textContent().catch(() => '')
  const { NOMI, figuraDi } = await import('../../src/giochi/castello/scena/bestiario.js')
  uguale('la scheda lo chiama col nome della figura, gigante', scheda,
         `👑 ${NOMI[figuraDi('lava', capo.bestia)]} gigante`)
  await togliCartelli()
  await attendi(page, 300)
  await scatto(page, 'castello-sprite-capo')
}

/* ---------- 7. l'ondata mista ----------
   La prima tappa delle Mura chiude con due tipi mescolati (`coppiaDellOnda`
   in `data/mostri.js`). Come per il capo, il tabellone si porta avanti:
   prima a due ondate dalla mista, per leggerla nel preavviso, poi alla
   vigilia, e la si chiama. */
{
  const { Ondate } = await import('../../src/motore/castello/ondate.js')
  const { vestitoDi } = await import('../../src/giochi/castello/scena/vestito.js')
  const { NOMI, figuraDi } = await import('../../src/giochi/castello/scena/bestiario.js')
  const i = TAPPE.findIndex(t => t.campagna === 'mura')
  const t = TAPPE[i], o = t.capo ? t.ondate - 1 : t.ondate
  const attesa = new Ondate(t).bestiaDi(o)
  nota(`${t.nome}: l'ondata mista (${attesa.id} e ${attesa.con?.id})`)
  controlla(`l'ondata ${o} del ${t.nome} è mista`, !!attesa.con)
  await page.evaluate(i => window.__td.inizia(i), i)
  await attendi(page, 900)
  await costruisci('add')
  await costruisci('div')
  await togliCartelli()
  const preavviso = await page.evaluate(async o => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td, m = T.motore()
    m.nemici.length = 0; m.daGenerare = 0; m.prossimo = 0
    m.tabellone.stato.onda = o - 2
    await attesa(400)
    const e = document.querySelector(`[data-onda-preavviso="${o}"]`)
    return e && { mista: e.dataset.mista, immune: e.dataset.immune, con: e.dataset.immuneCon,
                  facce: e.querySelectorAll('.faccia').length }
  }, o)
  controlla('il preavviso annuncia la mista', !!preavviso?.mista, JSON.stringify(preavviso))
  uguale('con due facce', preavviso?.facce, 2)
  uguale('e le immunità di tutti e due, ognuna sulla sua faccia',
         [preavviso?.immune, preavviso?.con].join(' | '),
         [attesa.immune.join(','), attesa.con.immune.join(',')].join(' | '))
  await attendi(page, 300)
  await scatto(page, 'castello-sprite-mista-preavviso')
  const campo = await page.evaluate(async o => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td, m = T.motore()
    m.nemici.length = 0; m.daGenerare = 0; m.prossimo = 0
    m.tabellone.stato.onda = o - 1
    T.chiamaOnda()
    /* un pezzo di strada: nella foto i due tipi devono stare dentro il
       campo, mescolati */
    const fine = Date.now() + 12000
    while (Date.now() < fine &&
           !(new Set(T.nemici().filter(n => n.d > 60).map(n => n.bestia)).size >= 2 &&
             T.nemici().filter(n => n.d > 0).length >= 6)) await attesa(100)
    return { onda: T.hud.onda, tipi: [...new Set(T.nemici().map(n => n.bestia))].sort() }
  }, o)
  uguale('in campo scendono i due tipi, mescolati', campo.tipi.join(), [attesa.id, attesa.con.id].sort().join())
  const nomi = await page.locator('[data-scheda-mista] .dati b').first().textContent().catch(() => '')
  const figura = id => NOMI[figuraDi(vestitoDi(t), id)]
  uguale('la scheda li chiama coi nomi delle figure', nomi,
         `${figura(attesa.id)} e ${figura(attesa.con.id)}`)
  uguale('con una riga di immunità per ciascuno',
         await page.locator('[data-scheda-mista] [data-scheda-immune]').count(), 2)
  await togliCartelli()
  await attendi(page, 300)
  await scatto(page, 'castello-sprite-mista')
}

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('il castello a sprite, giocato')
