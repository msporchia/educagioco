/* ═══════════════════════════════════════════════════════════════════
   IL SOTTERRANEO 3D VA COL TEMPO, A OGNI FREQUENZA DELLO SCHERMO
   (docs/sotterraneo/grafica-3d.md, «Il tempo, non i fotogrammi»)

   Il gioco vero, coi suoi due giri di fotogrammi (il motore in Gioco.vue e il disegno in scena3d/indice.js): qui
   `requestAnimationFrame` e `performance.now` sono finti, e ogni «fotogramma» fa passare 1/60, 1/120 o 1/144 di secondo
   (il tempo virtuale corre quanto la CPU disegna: SwiftShader è lento, il gioco no). In un secondo simulato si conta quante
   volte cambia lo sprite dell'eroe e di due mostri addormentati in luce, e quanto si muove la telecamera dopo un passo:
   deve venire uguale a 60, 120 e 144 Hz. È la prova di quello che l'utente vedeva su un monitor a 120 Hz.
   `node test/esegui.mjs sotterraneo-3d-tempo`
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco } from '../aiuto/browser.mjs'
import { dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()

async function misura(hz) {
  const { page, errori } = await apriGioco(browser, { attesa: null, viewport: { width: 300, height: 520 } })
  await page.addInitScript(f => {
    let t = 0, id = 0
    const attese = new Map()
    performance.now = () => t
    window.requestAnimationFrame = cb => { attese.set(++id, cb); return id }
    window.cancelAnimationFrame = k => { attese.delete(k) }
    window.__fotogrammi = 0
    const giro = () => {
      t += 1000 / f
      const l = [...attese.values()]; attese.clear()
      for (const cb of l) { try { cb(t) } catch (e) { console.error(e) } }
      window.__fotogrammi++
      if (window.__dopo) window.__dopo(t)
      setTimeout(giro, 0)
    }
    setTimeout(giro, 0)
  }, hz)
  // il cambio del solo indirizzo dopo il # non ricarica la pagina: si ricarica, perché l'orologio finto entri prima del gioco
  await page.evaluate(() => { location.hash = 'sotterraneo3d=2&eroe=elfa&seme=7&stanza=sala&luce=stanza&sotterraneo=branco&mostri=2&campo=1&dpr=0.6&spegni=nebbia,polvere,ombre' })
  await page.reload()
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 2, null, { timeout: 60000 })
  // un secondo simulato: i cambi di sprite, e dove va la telecamera mentre l'eroe resta fermo (da subito ferma)
  const r = await page.evaluate(() => new Promise(fine => {
    const s3 = window.__sotterraneo3d, c = s3.corsa
    const mostri = c.livello.robe.filter(q => q.che === 'mostro' && !q.morto && s3.statoDi(q).nome).slice(0, 2)
    const conti = { eroe: 0, mostri: mostri.map(() => 0) }
    let prima = null, t0 = null
    window.__dopo = t => {
      if (t0 == null) t0 = t
      const ora = { eroe: s3.eroe.nome, mostri: mostri.map(q => s3.statoDi(q).nome) }
      if (prima) { if (ora.eroe !== prima.eroe) conti.eroe++; ora.mostri.forEach((n, i) => { if (n !== prima.mostri[i]) conti.mostri[i]++ }) }
      prima = ora
      if (t - t0 >= 1000) { window.__dopo = null; fine({ ...conti, quanti: mostri.length, fotogrammi: window.__fotogrammi }) }
    }
  }))
  await page.close()
  return { ...r, errori }
}

const esiti = {}
for (const hz of [60, 120, 144]) {
  esiti[hz] = await misura(hz)
  nota(`${hz} Hz, un secondo: l'eroe cambia sprite ${esiti[hz].eroe} volte, i mostri ${esiti[hz].mostri.join(' e ')}`)
}
const a = esiti[60]
dentro('ci sono due mostri da guardare', a.quanti, 2, 2)
for (const hz of [120, 144]) {
  dentro(`${hz} Hz: l'eroe cambia sprite quanto a 60 Hz`, esiti[hz].eroe, a.eroe - 1, a.eroe + 1)
  esiti[hz].mostri.forEach((n, i) => dentro(`${hz} Hz: il mostro ${i + 1} cambia sprite quanto a 60 Hz`, n, a.mostri[i] - 1, a.mostri[i] + 1))
}
// quanto il 2D: chi dorme respira a 4 fotogrammi al secondo (scena/tela.js)
a.mostri.forEach((n, i) => dentro(`il mostro ${i + 1} che dorme respira come nel 2D (4 al secondo)`, n, 2, 5))
dentro('nessun errore in console', Object.values(esiti).flatMap(e => e.errori).length, 0, 0)
await browser.close()
riassunto('il sotterraneo 3d a ogni frequenza')
