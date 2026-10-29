/* Gli amici sulla rotta degli asteroidi, dalla loro bacheca (docs/core/amici-bacheca.md): un pallino con l'iniziale sotto la
   tappa di ognuno, in cima chi è da raggiungere, nel fumetto chi c'è e da quando, nel volo i loro record, e a fine volo la
   notizia contro di loro. Gli amici sono già salvati sul telefono, come dopo una lettura: il servizio non serve (l'indirizzo
   punta a una porta chiusa, e una richiesta fallita non deve rompere niente). Un amico senza nome non si vede.
   `node test/esegui.mjs amici-rotta --niente-build` */
import { apriBrowser, apriGioco, semina, seminaArchivio, attendi, scegli, scatto, GIOCATORE } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { SCALETTA } from '../../src/data/asteroidi.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))

const due = n => String(n).padStart(2, '0')
const giorno = fa => { const d = new Date(Date.now() - fa * 86_400_000); return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}` }
const amico = (lettera, id, nome, fa, tappa, record) => ({
  chiave: lettera.repeat(32), id, nome, visto: 1, bacheca: { v: 1, giorno: giorno(fa), giochi: { mate: { tappa, record } } },
})
async function conAmici(amici) {
  await seminaArchivio(page, 'amici:' + GIOCATORE, { id: 'bancouno00', deciso: true, attivo: true, online: true, amici })
}
async function allaRotta() {
  await scegli(page, 'mate')
  await page.waitForSelector('[data-rotta] [data-tappa]')
  await attendi(page, 300)
}
const pallini = () => page.$$eval('[data-amico-in-rotta]', l => l.map(e => ({ al: e.dataset.al, testo: e.textContent.trim() })))

/* ══════════ 1. a metà della fila: chi è avanti, chi è con me ══════════ */
await semina(page, { mate: { tappa: 0, fila: 3, libera: false }, settings: { eta: 9 } })
await conAmici([
  amico('a', 'leonardo1', 'Leonardo', 0, 5, 0),
  amico('b', 'melody001', 'Melody', 2, 3, 0),
  amico('c', null, '', 0, 8, 0),                         // abbinato ma mai incontrato: senza nome
])
await allaRotta()
const p1 = await pallini()
uguale('un pallino per amico col nome, non per quello senza', p1.length, 2)
controlla('Leonardo sotto la tappa 5, con la sua iniziale', p1.some(p => p.al === '5' && p.testo === 'L'), JSON.stringify(p1))
controlla('Melody sotto la mia, la 3', p1.some(p => p.al === '3' && p.testo === 'M'), JSON.stringify(p1))
uguale('in cima chi è da raggiungere', (await page.textContent('[data-amico-davanti]')).trim(), 'Leonardo è 2 tappe più avanti di te.')
const colori = await page.$$eval('[data-amico-in-rotta]', l => l.map(e => getComputedStyle(e).backgroundColor))
controlla('due amici, due colori', colori[0] !== colori[1], colori.join(' / '))

// i pallini non coprono il nome della tappa né la stella
const sovrapposti = await page.evaluate(() => {
  const dentro = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  const p = [...document.querySelectorAll('[data-amico-in-rotta]')].map(e => e.getBoundingClientRect())
  const altri = [...document.querySelectorAll('.nome b, [data-stelle-tappa]')].map(e => e.getBoundingClientRect())
  return p.filter(r => altri.some(a => dentro(r, a))).length
})
uguale('i pallini non coprono nomi e stelle', sovrapposti, 0)

await page.click('[data-tappa="5"]')
await page.waitForSelector('[data-fumetto] [data-amici-qui]')
uguale('nel fumetto chi c\'è e da quando', (await page.textContent('[data-fumetto] [data-amici-qui]')).replace(/\s+/g, ' ').trim(), 'LLeonardo è qui · oggi')
await attendi(page, 300)
await scatto(page, 'amici-rotta-tappa')
await page.click('[data-tappa="3"]')
await attendi(page, 300)
controlla('e Melody dice da quanti giorni', /Melody è qui · 2 giorni fa/.test(await page.textContent('[data-fumetto]')))

/* ══════════ 2. fila finita: i record del volo e la notizia a fine partita ══════════ */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await semina(page, { mate: { tappa: 10, fila: SCALETTA.length, libera: true }, settings: { eta: 9 } })
await conAmici([amico('a', 'leonardo1', 'Leonardo', 1, SCALETTA.length, 3400), amico('b', 'melody001', 'Melody', 0, 4, 1)])
await allaRotta()
uguale('nessuno è più avanti di chi è al volo: in cima non si dice niente', await page.locator('[data-amico-davanti]').count(), 0)
uguale('il suo pallino sta al volo', (await pallini()).find(p => p.testo === 'L')?.al, String(SCALETTA.length))
await page.click('[data-volo]')
await page.waitForSelector('[data-fumetto] [data-record-amici]')
const righe = await page.$$eval('[data-fumetto] [data-record-amici] .chi', l => l.map(e => e.textContent.replace(/\s+/g, ' ').trim()))
uguale('nel volo i record degli amici, dal più alto', righe.join(' | '), 'LLeonardo: 3400 punti | MMelody: 1 punto')
uguale('chi ha un record non si ripete come «è qui»', await page.locator('[data-fumetto] [data-amici-qui]').count(), 0)
await attendi(page, 300)
await scatto(page, 'amici-rotta-volo')

await page.click('[data-fumetto] [data-azione="parti"]')
await page.waitForFunction(() => window.__mate && window.__mate.fase.value === 'gioco', null, { timeout: 5000 })
const fine = await page.evaluate(async () => {
  const m = window.__mate
  // qualche giusta per fare punti, poi si sbaglia fino alla fine
  for (let i = 0; i < 80 && m.fase.value === 'gioco'; i++) {
    const vivi = m.asteroidi().filter(x => !x.morto)
    if (!vivi.length) { await new Promise(r => setTimeout(r, 50)); continue }
    const giusto = vivi.find(x => x.ok)
    m.colpisci(i < 4 || !vivi.find(x => !x.ok) ? giusto : vivi.find(x => !x.ok))
    await new Promise(r => setTimeout(r, 15))
  }
  await new Promise(r => setTimeout(r, 300))
  return { fase: m.fase.value, punti: m.hud.punti, frase: document.querySelector('[data-contro-amici]')?.textContent.trim() || '' }
})
uguale('la partita finisce', fine.fase, 'fine')
// i cartelli dei traguardi coprono il velo: qui si tolgono
await page.evaluate(() => document.querySelectorAll('.velo').forEach(v => v.querySelector('.occhiello') && v.click()))
await attendi(page, 400)
await scatto(page, 'amici-rotta-fine')
controlla('a fine volo: superata Melody, con la misura', /^Hai superato Melody \(1 punto\)!$/.test(fine.frase), `${fine.punti} punti: «${fine.frase}»`)

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca sulla rotta degli asteroidi')
