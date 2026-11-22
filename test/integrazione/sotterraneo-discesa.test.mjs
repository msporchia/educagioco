/* ═══════════════════════════════════════════════════════════════════
   LA DISCESA DEL SOTTERRANEO SI DISEGNA E SI CAMMINA, COL DITO
   (docs/sotterraneo/grafica-3d.md)

   perché: la discesa 3D si disegna e si cammina: tela non nera, il tocco sul pavimento, lo zaino, lo scontro nella scena senza WebGL, la torcia e la botte
   a parte perché: si arriva col cheat dell'indirizzo (`scendiColCheat`) a una discesa vuota; lo scontro a gruppi lo prova sotterraneo-scontro

   Quello che solo il browser vede, su una pagina sola: la carta e la prima scelta dell'eroe, la discesa che si scalda col
   fumetto dell'ingresso e scende disegnata (una tela WebGL nera non dà nessun errore: la scena dice quante chiamate fa e
   quante figure ha), il tocco sul pavimento che porta l'eroe lì, lo zaino; lo scontro nella scena (il tocco che sceglie il
   bersaglio, gli shader che non si ricompilano colpo dopo colpo, la fascia bassa, l'entrata a passi), senza WebGL, i paesaggi
   solo del 3D, la torcia appesa e la botte toccate col dito. Le regole (la luce, i colpi, i premi delle botti) le provano le
   unità `sotterraneo-*`; le larghezze dello schermo sono una misura (`sotterraneo-3d-larghezze-misura`).
   Si tocca come un telefono (`ditoDi`); al punto da provare si arriva col cheat dell'indirizzo (`scendiColCheat`).
   `node test/esegui.mjs sotterraneo-discesa`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo, scegliAttacco, leggiProfilo, ditoDi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, blocco, riassunto } from '../aiuto/verifica.mjs'
import { ROBA_NUDA, profiloDelSotterraneo, giuPronto, fermoGiu, cellaGiu, schermoDi, toccaLaCella, nelCampo, aCasa, scendiColCheat,
         contaICompilati } from '../aiuto/sotterraneo-discesa.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { STANZE_TORCIA } from '../../src/giochi/sotterraneo/dati/cose.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const { tocca } = await ditoDi(page)
const g3d = () => page.evaluate(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica())
const piede = async () => (await page.locator('.sot-piede').innerText()).replace(/\s+/g, ' ')
// entrando gli shader nascono uno per fotogramma e non si disegna (docs/sotterraneo/prestazioni-3d.md): si aspetta il primo disegno
const disegnata = () => page.waitForFunction(() => { const g = window.__sotterraneo3d && window.__sotterraneo3d.grafica(); return g && !g.entrando && g.chiamate > 0 }, null, { timeout: 20000 })

/* ---------- la carta, e la prima volta si sceglie chi scende ---------- */
await blocco('la carta e chi scende', async () => {
  uguale('coi giochi in prova spenti la carta c\'è', await page.locator('[data-indice="sotterraneo"]').count(), 1)
  uguale('e non c\'è un secondo sotterraneo', await page.locator('[data-indice="sotterraneo3d"]').count(), 0)
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('.sot-eroe[data-eroe]', { timeout: 30000 })
  // entrare in un gioco di ruolo senza sapere chi si è non ha senso: la prima volta la scelta si presenta da sé
  uguale('al primo ingresso si sceglie chi scende', await page.locator('.sot-eroe[data-eroe]').count(), 4)
  uguale('e sono quattro avventure nuove', await page.locator('.sot-eroe[data-nuova="1"]').count(), 4)
  await page.locator('[data-eroe="cavaliere"]').click()
  await page.waitForSelector('[data-mondo3d][data-pronto="1"]', { timeout: 30000 })
  uguale('scelto, la scelta sparisce', await page.locator('.sot-eroe[data-eroe]').count(), 0)
  await page.locator('[data-azione="eroe-pagina"]').click()
  await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
  // il sesso parte da quello della persona del profilo
  controlla('la pagina dell\'eroe dice con chi si scende', /Cavaliere|Guerriera/.test(await page.locator('[data-pagina-eroe] .sot-eroe-nome b').textContent()))
  await page.locator('[data-pagina-eroe] [data-chiudi]').click()
  await page.waitForSelector('[data-pagina-eroe]', { state: 'detached', timeout: 3000 })
})

/* ---------- col fumetto dell'ingresso la discesa si scalda, e scende disegnata ----------
   (docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»): una tela fuori dalla pagina compila il primo piano un
   programma per fotogramma; scendendo è lei che entra, e l'entrata non ne chiede quasi */
await blocco('la discesa scaldata e disegnata', async () => {
  // un seme con una porta chiusa a pochi passi dall'arrivo (lo legge chi scende, come `#seme=` dei cheat)
  await page.evaluate(() => { location.hash = 'sotterraneo&seme=11' })
  await scendiNelSotterraneo(page, 0, { tocca, scendi: false })
  await page.waitForFunction(() => window.__sotterraneo3dCaldo && window.__sotterraneo3dCaldo.anticipato.daScaldare === 0, null, { timeout: 60000 }).catch(() => {})
  const caldo = await page.evaluate(() => window.__sotterraneo3dCaldo ? window.__sotterraneo3dCaldo.anticipato : null)
  controlla('col fumetto aperto la discesa si scalda prima di scendere', !!caldo && caldo.programmi >= 15 && caldo.daScaldare === 0, JSON.stringify(caldo))
  await page.click(`[data-fumetto-di="${CAMPAGNA[0].chiave}"] [data-azione="scendi"]`)
  await giuPronto(page, 15000)
  const g = await g3d(), ing = await page.evaluate(() => window.__sotterraneo3d.ingresso())
  controlla('scendendo, la tela scaldata è quella della discesa', await page.evaluate(() => window.__sotterraneo3dCaldo === undefined && window.__sotterraneo3d.canvas.isConnected &&
    window.__sotterraneo3d.canvas.nextElementSibling === document.querySelector('[data-tela="3d"]')))
  // restano quelli dell'ombra (quattro, al primo disegno: `compile` non li fa; la fascia bassa non ha ombre) e qualcosa nato disegnando
  controlla('e il primo piano non chiede quasi programmi nuovi', !!caldo && g.programmi - caldo.programmi <= 6, `${caldo && caldo.programmi} → ${g.programmi}`)
  nota(`discesa scaldata: ${caldo && caldo.programmi} programmi prima di scendere, ${g.programmi} giù; fotogrammi prima del disegno ${ing && ing.attesa}`)
  await disegnata()
  const d = await g3d()
  uguale('giù la discesa si disegna in 3D', d.tre, true)
  uguale('nello scenario della discesa', d.scenario, CAMPAGNA[0].scenario)
  dentro('poche chiamate per fotogramma, ma non una tela vuota', d.chiamate, 10, 120)
  nota(`un fotogramma: ${d.chiamate} chiamate, ${Math.round(d.triangoli / 1000)}k triangoli, ${d.figure} figure, pixel ratio ${d.dpr}, ${d.ms} ms, JS ${d.msJs} ms`)
  uguale('la barra in basso è quella vera', await page.locator('[data-barra="giu"]').count(), 1)
  uguale('e la mappina c\'è', await page.locator('.sot3d-mappina').count(), 1)
  controlla('e la fascia dice a che piano si è', (await piede()).includes('piano 1'), await piede())
  await scatto(page, 'sotterraneo-3d-giu')
})

/* ---------- un tocco sul pavimento porta l'eroe lì ---------- */
await blocco('un tocco sul pavimento', async () => {
  const meta = await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, buona = c.buona()
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    const visti = new Map([[da.x + ',' + da.y, 0]]), coda = [da]
    let mig = null
    for (let i = 0; i < coda.length; i++) {
      const q = coda[i], d = visti.get(q.x + ',' + q.y)
      if (d >= 2 && d <= 4 && c.livello.robeSu(q.x, q.y).length === 0 && (!mig || d > mig.d)) mig = { ...q, d }
      if (d >= 4) continue
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = q.x + dx, y = q.y + dy
        if (buona(x, y) && !visti.has(x + ',' + y)) { visti.set(x + ',' + y, d + 1); coda.push({ x, y }) }
      }
    }
    return mig
  })
  controlla('c\'è una cella vuota a qualche passo', !!meta)
  await fermoGiu(page)
  await toccaLaCella(page, tocca, meta.x, meta.y)
  await page.waitForFunction(k => document.querySelector('[data-tela="3d"]').dataset.eroe === k, `${meta.x},${meta.y}`, { timeout: 15000 }).catch(() => {})
  uguale('l\'eroe è arrivato dove si è toccato', await cellaGiu(page), `${meta.x},${meta.y}`)
})

/* ---------- lo zaino si apre in mezzo, e si chiude ----------
   In mezzo e non in fondo: mentre è aperto il gioco sta fermo, e un pannello incollato al bordo di sotto non lo dice */
await blocco('lo zaino', async () => {
  await page.locator('[data-azione="zaino"]').click()
  await page.waitForSelector('[data-zaino]', { timeout: 3000 })
  uguale('lo zaino ha sei tasche', await page.locator('[data-zaino] [data-tasca]').count(), 6)
  uguale('e sette caselle addosso: le due mani, la testa, il corpo, la collana e i due anelli', await page.locator('[data-casella]').count(), 7)
  uguale('e non è il foglio che sale dal basso', await page.locator('.sot-foglio').count(), 0)
  await page.locator('[data-azione="chiudi"]').click()
  await page.waitForSelector('[data-zaino]', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('e si richiude', await page.locator('[data-zaino]').count(), 0)
})

/* ---------- lo scontro: il motore vero, la scena che lo mette in scena ----------
   Un eroe che regge (livello 10, tempra 6): qui si guarda la scena, non chi vince */
await aCasa(page)
await semina(page, profiloDelSotterraneo({ tappa: 1, avventura: {
  roba: { ...ROBA_NUDA, zaino: ['pozione'] },
  crescita: { v: 2, esp: sogliaDi(10), forza: 2, destrezza: 0, intelligenza: 0, tempra: 6, albero: {}, caselle: [null, null, null] } } }))
async function rispondi(giusto) {
  await scegliAttacco(page)
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  await attendi(page, 400)   // la domanda è cieca 320 ms
  await page.locator(giusto ? '.sot-domanda .qz-tasto[data-giusta]' : '.sot-domanda .qz-tasto:not([data-giusta])').first().click()
}
// un colpo: il racconto parte e finisce, e si torna a scegliere
async function unColpo() {
  await rispondi(true)
  await page.waitForSelector('[data-scontro-3d][data-racconto]', { timeout: 8000 }).catch(() => {})
  await page.waitForFunction(() => !document.querySelector('[data-scontro-3d][data-racconto]'), null, { timeout: 20000 })
}

await blocco('lo scontro nella scena', async () => {
  await scendiColCheat(page, 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=2&tipo=ratto,goblin&stanza=sala', { pronto: false })
  await page.waitForSelector('[data-scontro-3d]', { timeout: 15000 })
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
  await disegnata()
  const g = await g3d()
  uguale('lo scontro sta nella scena (il palco 3D)', g.palco, true)
  uguale('niente palco 2D', await page.locator('.sot-duello').count(), 0)
  uguale('le scritte sopra i due mostri', await page.locator('[data-scontro-3d] [data-mostro]').count(), 2)
  uguale('la fila dei turni c\'è', await page.locator('[data-scontro-3d] [data-fila]').count(), 1)
  // coi mostri 3D (docs/sotterraneo/mostri-3d.md, «Quanto costa») ogni modello aggiunge una cinquantina di chiamate
  dentro('lo scontro costa poco', g.chiamate, 10, 260)
  nota(`nello scontro: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli, ${g.ms} ms`)
  // i fogli dell'esplorazione sono un velo (la telecamera resta), nello scontro invece la telecamera alza i combattenti sopra il
  // pannello: ci arriva morbida
  const sopraIlPannello = () => {
    const p = document.querySelector('[data-pannello3d]').getBoundingClientRect(), c = document.querySelector('[data-tela="3d"]').getBoundingClientRect()
    const s3 = window.__sotterraneo3d, st = s3.palco.stati[0], e = s3.aSchermo(st.x, 0, st.z)
    return c.y + e[1] < p.top
  }
  await page.waitForFunction(sopraIlPannello, null, { timeout: 8000 }).catch(() => {})
  uguale('nello scontro l\'eroe sta sopra il pannello', await page.evaluate(sopraIlPannello), true)
  // toccare il secondo mostro nella scena lo fa bersaglio
  const s = await page.evaluate(() => { const s = window.__sotterraneo3d.palco.stati[1]; return { x: s.x, z: s.z, alto: s.alto } })
  const pt = await schermoDi(page, s.x, s.z, s.alto * 0.5)
  await tocca(pt.x, pt.y)
  await page.waitForSelector('[data-scontro-3d] [data-mostro][data-bersaglio][data-i="1"]', { timeout: 3000 }).catch(() => {})
  uguale('toccato nella scena, il secondo è il bersaglio', await page.locator('[data-scontro-3d] [data-mostro][data-bersaglio]').getAttribute('data-i'), '1')
  await scatto(page, 'sotterraneo-3d-scontro')
  // fino a sei risposte giuste: un mostro cade. Gli shader compilati dopo ogni colpo: un colpo non ne compila di nuovi (sull'Adreno è un
  // fermo di 50-300 ms). Si contano i `linkProgram`, non i programmi vivi: un effetto che butta i suoi materiali li ricompila uguali
  await contaICompilati(page)
  const programmi = []
  let morti = 0
  for (let n = 0; n < 6 && morti === 0; n++) {
    await unColpo()
    programmi.push(await page.evaluate(() => window.__compilati))
    morti = await page.evaluate(() => window.__sotterraneo3d.corsa.livello.robe.filter(r => r.che === 'mostro' && r.morto).length)
    if (!morti) await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
  }
  controlla('rispondendo giusto un mostro cade', morti >= 1, morti)
  controlla('dopo il primo colpo nessuno shader nuovo', programmi.length < 2 || programmi.slice(1).every(x => x === programmi[0]), programmi.join())
  controlla('e la sua figura nella scena svanisce', await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, m = c.livello.robe.find(r => r.che === 'mostro' && r.morto)
    return window.__sotterraneo3d.statoDi(m).morente > 0
  }))
})

/* ---------- lo stesso scontro nella fascia bassa (docs/sotterraneo/grafica-3d-costi.md): meno luci, il pixel ratio a 1 ---------- */
await blocco('lo scontro nella fascia bassa', async () => {
  await scendiColCheat(page, 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=2&tipo=ratto,goblin&stanza=sala&qualita=bassa', { pronto: false })
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
  await disegnata()
  uguale('bassa: lo scontro sta nella scena', (await g3d()).palco, true)
  await unColpo()
  const dopo = await g3d()
  controlla('bassa: dopo un colpo il pixel ratio non passa 1', dopo.dpr <= 1, dopo.dpr)
  nota(`fascia bassa nello scontro: ${dopo.chiamate} chiamate, ${dopo.programmi} shader, ${dopo.ms} ms`)
})

/* ---------- tre attacchi contro gli scheletri armati: dopo il primo giro nessuno shader si ricompila ----------
   (gli effetti tengono i programmi, docs/sotterraneo/limiti-3d.md). `spegni=parallelo`: come il Redmi Note 7, senza
   KHR_parallel_shader_compile (l'entrata a passi) */
await blocco('gli scheletri armati', async () => {
  await scendiColCheat(page, 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=3&tipo=scheletro&variante=guerriero,arciere,mago&grado=leggendario&stanza=sala&qualita=bassa&spegni=parallelo', { pronto: false })
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
  // il riscaldamento (docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»): finito, il primo attacco trova gli shader pronti
  await page.waitForFunction(() => window.__sotterraneo3d.grafica().daScaldare === 0, null, { timeout: 30000 })
  const ing = await page.evaluate(() => window.__sotterraneo3d.ingresso())
  controlla('entrando, al più due programmi nuovi per fotogramma', ing.picco <= 2, `picco ${ing.picco}, ${ing.fotogrammi.join('')} (${ing.troppi.join('; ')})`)
  controlla('il primo disegno arriva coi programmi già chiesti', ing.primoDisegno <= 2 && ing.attesa >= 10, `primo disegno +${ing.primoDisegno}, dopo ${ing.attesa} fotogrammi`)
  nota(`entrata a passi: ${ing.attesa} fotogrammi prima del disegno, picco ${ing.picco} programmi per fotogramma, ${(await g3d()).programmi} in tutto`)
  await contaICompilati(page)
  const compilati = []
  for (let n = 0; n < 3; n++) {
    await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; if (c && c.vitaMax) c.vita = c.vitaMax })
    await unColpo()
    await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
    compilati.push(await page.evaluate(() => window.__compilati))
  }
  // un effetto visto la prima volta si compila (una mossa nuova di un mostro): al più qualcuno; buttando i programmi erano 15-19 a giro
  controlla('scheletri armati: dopo il primo attacco quasi nessuno shader compilato', compilati[1] - compilati[0] <= 6 && compilati[2] - compilati[1] <= 6, compilati.join())
  controlla('scaldati gli shader, il primo attacco non ne compila quasi (senza riscaldamento erano una decina)', compilati[0] <= 2, compilati.join())
})

/* ---------- senza WebGL 2 si dice e si esce, senza toccare niente ---------- */
await blocco('senza WebGL', async () => {
  await aCasa(page)
  await page.evaluate(() => { location.hash = 'sotterraneo&tela=niente' })
  await page.waitForSelector('[data-senza-3d]', { timeout: 8000 })
  const prima = JSON.stringify((await leggiProfilo(page))?.campagne || {})
  await page.locator('[data-senza-3d] [data-azione="esci-3d"]').click()
  await page.waitForSelector('.carte', { timeout: 8000 })
  uguale('senza WebGL il profilo resta com\'era', JSON.stringify((await leggiProfilo(page))?.campagne || {}), prima)
})

/* ---------- i paesaggi solo del 3D: il cheat `#scenario=` veste la discesa (docs/sotterraneo/paesaggi-3d.md) ----------
   il paesaggio da solo: l'eroe e i mostri 3D si misurano a parte. La famiglia di piante la prova unita/sotterraneo-paesaggi */
for (const k of ['ghiaccio', 'tempio']) {
  await blocco(`il paesaggio ${k}`, async () => {
    await scendiColCheat(page, `sotterraneo=1&eroe=cavaliere&seme=11&stanza=grande&luce=stanza&scenario=${k}&spegni=mostri3d,eroe`)
    await disegnata()
    const g = await g3d()
    uguale(`${k}: la scena è nel paesaggio chiesto`, g.scenario, k)
    dentro(`${k}: costa poco (chiamate), ma si disegna`, g.chiamate, 11, 69)
    await scatto(page, `sotterraneo-3d-${k}`)
  })
}

/* ---------- la torcia appesa (docs/sotterraneo/luce.md, «Le torce appese»): si vede nella staffa, la si tocca, diventa la propria ----------
   Al buio nelle cantine col seme 1, che al primo piano ne ha una a tre celle. Che faccia luce e che presa sia piena lo dice
   unita/sotterraneo-luce; qui il modello nella staffa e il tocco */
await blocco('la torcia appesa', async () => {
  await scendiColCheat(page, 'sotterraneo=1&seme=1&stanza=appesa&pensieri=no')
  await fermoGiu(page)
  const appesa = () => page.evaluate(() => {
    const s3 = window.__sotterraneo3d, c = s3.corsa, q = (c.livello.torce || []).find(x => x.prendi)
    let scala = null
    s3.scena.traverse(o => { if (o.isInstancedMesh && o.userData.elemento3d === 'arredo' && o.material && o.material.vertexColors && o.count === 1 && scala == null) { const m = new o.matrix.constructor(); o.getMatrixAt(0, m); scala = Math.round(Math.hypot(m.elements[0], m.elements[1], m.elements[2]) * 100) / 100 } })
    return { appesa: !!c.torciaAppesa, x: q && q.x, y: q && q.y, accesa: c.torciaAccesa, mano: !!(s3.eroe && s3.eroe.mano), scala }
  })
  let a = await appesa()
  uguale('al buio, nel primo piano c\'è una torcia appesa da prendere', `${a.appesa}|${a.accesa}`, 'true|false')
  uguale('e al buio l\'eroe non ha la torcia in mano', a.mano, false)
  controlla('appesa si vede il suo modello nella staffa', a.scala > 0, String(a.scala))
  await scatto(page, 'torce-appesa')
  // un tocco sulla torcia (la cella di muro): l'eroe va sotto, e la stacca
  const p = await schermoDi(page, a.x + 0.5, a.y + 1, 0.8)
  await tocca(p.x, p.y)
  await page.waitForFunction(() => !window.__sotterraneo3d.corsa.torciaAppesa, null, { timeout: 15000 }).catch(() => {})
  // la scena toglie il modello dalla staffa al suo fotogramma dopo
  for (let i = 0; i < 20 && (a = await appesa()).scala !== 0; i++) await attendi(page, 150)
  uguale('toccata, l\'eroe ci va sotto e la prende', a.appesa, false)
  uguale('sul muro resta la staffa vuota', a.scala, 0)
  uguale('e la torcia è in mano all\'eroe', a.mano, true)
  await page.locator('[data-azione="eroe-pagina"]').click()
  await page.waitForSelector('[data-pagina-eroe] [data-torcia-eroe]', { timeout: 5000 })
  const r = await page.locator('[data-torcia-eroe]').evaluate(e => `${e.dataset.torce}|${e.dataset.resta}`)
  uguale('la pagina dell\'eroe la conta, accesa e piena', r, `1|${STANZE_TORCIA}`)
  await page.locator('[data-pagina-eroe] [data-chiudi]').click()
  await page.waitForSelector('[data-pagina-eroe]', { state: 'detached', timeout: 3000 })
})

/* ---------- la botte si rompe col dito (motore/botti.js): toccata da lontano, l'eroe ci va e la rompe, e resta a pezzi ----------
   Quanto lascia, e che si raccolga, lo prova unita/sotterraneo-botti. L'eroe va nella stanza della botte, a tre passi (la stanza
   accesa tutta), coi mostri spenti: qui si prova la botte, non lo scontro */
await blocco('la botte', async () => {
  await scendiColCheat(page, 'sotterraneo=1&eroe=cavaliere&seme=11&scenario=cantine')
  const n = await page.evaluate(() => window.__sotterraneo3d.corsa.bottiQui().length)
  controlla('nelle cantine del seme 11 ci sono botti', n > 0, String(n))
  const lontana = await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, b = c.bottiQui()[0], liv = c.livello
    // non si tolgono dalla lista (la sosta conta le cose per indice): si spengono
    c.ricomparsa = false
    for (const m of liv.robe) if (m.che === 'mostro') { m.presa = true; m.morto = true; m.sveglio = false }
    const s = liv.stanze.find(q => q.id === b.stanza)
    const libere = s.suolo.filter(q => !liv.robeSu(q.x, q.y).length && !c.bottiQui().some(o => o.x === q.x && o.y === q.y))
    const d = libere.map(q => ({ ...q, d: Math.abs(Math.hypot(q.x - b.x, q.y - b.y) - 3) + (q.y < b.y ? 1 : 0) })).sort((u, v) => u.d - v.d)[0]
    c.eroe = { x: d.x + 0.5, y: d.y + 0.5 }; c.strada = []
    const base = c.aggiornaLuce.bind(c)
    c.aggiornaLuce = () => { base(); for (const [x, y] of liv.celleDellaLuce(s)) { const q = y * liv.largo + x; c.luce.add(q); c.forzaLuce.set(q, 1); c.visto[q] = 1 } }
    c.segnaLaStanza(); c.aggiornaLuce()
    return Math.hypot(d.x - b.x, d.y - b.y)
  })
  await fermoGiu(page)
  const b = (await page.evaluate(() => window.__sotterraneo3d.botti()))[0]
  const p = await schermoDi(page, b.x, b.z, 0.3)
  controlla('la botte è nel campo', nelCampo(p), JSON.stringify(p))
  // un po' fuori dal centro: il bersaglio è generoso come per le altre cose (MARGINE_DITO)
  await tocca(p.x + 8, p.y - 6)
  await page.waitForFunction(() => window.__sotterraneo3d.botti()[0].rotta, null, { timeout: 20000 }).catch(() => {})
  const dopo = (await page.evaluate(() => window.__sotterraneo3d.botti()))[0]
  controlla('toccata da lontano, l\'eroe ci va e la rompe', lontana >= 2 && dopo.rotta, `a ${lontana.toFixed(1)} celle, rotta ${dopo.rotta}`)
  controlla('e resta a terra a pezzi', dopo.pezzi > 0, String(dopo.pezzi))
  await scatto(page, 'sotterraneo-3d-botte')
})

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('la discesa del sotterraneo si disegna e si cammina')
