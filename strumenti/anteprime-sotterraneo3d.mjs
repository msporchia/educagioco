/* ═══════════════════════════════════════════════════════════════════
   LE ANTEPRIME DEL SOTTERRANEO 3D, FOTOGRAFATE SUL COMPUTER

     npm run anteprime sotterraneo      riscrive src/giochi/sotterraneo/dati/anteprime-fatte.js (il comando: strumenti/anteprime.mjs)
     ANTEPRIME_DEBUG=1 npm run anteprime sotterraneo   e lascia i WebP in tmp/scatti/anteprime-sotterraneo3d/

   Apre il Sotterraneo 3D nel file costruito e chiede al servizio delle anteprime (`__anteprime3d.viva`) ogni chiave che il gioco può
   chiedere tranne il ritratto dell'eroe vestito: la roba (ogni figura con ogni rarità ed elemento a cui può uscire, l'armatura su
   ognuno dei quattro eroi), i copricapi, i consumabili, i mostri con gradi e varianti, i grossi, le persone. Le chiavi le dà il
   codice del gioco (`chiaveDellaCosa` su ogni pezzo possibile), non un elenco a mano. Il file è GENERATO con la firma delle foto e
   quella dei sorgenti dei modelli, che `unita/sotterraneo-anteprime-fatte` ricalcola. Vedi docs/sotterraneo/anteprime-3d.md.
   ═══════════════════════════════════════════════════════════════════ */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COSE, CHIAVI_COSE, chiaveDelPezzo } from '../src/giochi/sotterraneo/dati/cose.js'
import { ABILITA_DEI_PEZZI, UNICI, ORDINE_RARITA } from '../src/giochi/sotterraneo/dati/pezzi.js'
import { MOSTRI } from '../src/giochi/sotterraneo/dati/mostri.js'
import { GROSSI } from '../src/giochi/sotterraneo/dati/grossi.js'
import { VARIANTI } from '../src/giochi/sotterraneo/dati/varianti.js'
import { MODELLI_PERSONE } from '../src/giochi/sotterraneo/dati/persone3d.js'
import { chiaveDellaCosa, chiaveDelMostro, EROI } from '../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const FILE_FATTE = resolve(RADICE, 'src/giochi/sotterraneo/dati/anteprime-fatte.js')
const DEBUG = resolve(RADICE, 'tmp/scatti/anteprime-sotterraneo3d')
const QUALITA = 0.82
const LIVELLI = 120          // la figura la sceglie un hash della chiave, che porta il livello: oltre i 100 non ne escono di nuove

/** Le chiavi da fotografare, ordinate. Il ritratto dell'eroe (`eroe:`, `busto:`) dipende da cosa porta: resta vivo. */
export function chiaviDaFotografare() {
  const s = new Set(), metti = k => { if (k) s.add(k) }
  for (const b of CHIAVI_COSE) {
    const c = COSE[b]
    if (!c.dove) { metti(chiaveDellaCosa({ chiave: b })); continue }
    const ab = Object.keys(ABILITA_DEI_PEZZI).filter(a => ABILITA_DEI_PEZZI[a].dove.includes(c.dove))
    const insiemi = [[], ...ab.map(a => [a]), ...ab.flatMap(a => ab.filter(x => x !== a).map(x => [a, x]))]
    const eroi = c.dove === 'corpo' ? EROI : ['cavaliere']
    for (const r of ORDINE_RARITA) for (const a of (r === 'comune' ? [[]] : insiemi)) for (let L = 1; L <= LIVELLI; L++) {
      const k = chiaveDelPezzo(b, L, r, a)
      for (const e of eroi) metti(chiaveDellaCosa({ chiave: k }, e))
    }
  }
  for (const [u, v] of Object.entries(UNICI)) for (const e of EROI) metti(chiaveDellaCosa({ chiave: chiaveDelPezzo(v.base, 9, v.rarita, [], u) }, e))
  for (const tipo of Object.keys(MOSTRI)) for (const grado of ORDINE_RARITA)
    for (const v of [null, ...(VARIANTI[tipo] || []).filter(x => x.nome).map(x => x.chiave)]) metti(chiaveDelMostro({ tipo, grado, variante: v }))
  for (const g of Object.keys(GROSSI)) metti(chiaveDelMostro({ grosso: g }))
  for (const p of MODELLI_PERSONE) metti(`persona:${p}`)
  return [...s].sort()
}

/** I file da cui viene la faccia di una figura: il servizio e la posa, la roba, gli eroi (l'armatura sta su di loro), i mostri, le persone. */
const SCENA = resolve(RADICE, 'src/giochi/sotterraneo/scena3d')
const tutti = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? tutti(p) : [p] })
export const fileDeiModelli = () => [
  ...['anteprime3d.js', 'anteprime3d-pura.js', 'roba3d.js', 'roba3d-pura.js', 'eroe3d.js'].map(f => join(SCENA, f)),
  ...['roba3d', 'eroi3d', 'mostri3d', 'persone3d'].flatMap(d => tutti(join(SCENA, d))),
].filter(f => /\.js$/.test(f)).map(f => relative(SCENA, f)).sort()
export const firmaSorgenti = () => {
  const h = createHash('sha1')
  for (const f of fileDeiModelli()) h.update(f + '\n' + readFileSync(join(SCENA, f), 'utf8').replace(/\r\n/g, '\n'))
  return h.digest('hex').slice(0, 12)
}
export const firmaDi = foto => createHash('sha1').update(JSON.stringify(foto)).digest('hex').slice(0, 12)

export function scriviFatte(foto, senza) {
  const righe = Object.entries(foto).map(([k, v]) => `  ${JSON.stringify(k)}: '${v}',`)
  writeFileSync(FILE_FATTE, `/* GENERATO da strumenti/anteprime-sotterraneo3d.mjs (\`npm run anteprime sotterraneo\`) — non si scrive a mano.

   Le anteprime 3D del Sotterraneo (la roba, i mostri, le persone) fotografate sul computer col servizio vero, in WebP alla misura
   delle viste: ${Object.keys(foto).length} immagini. Le legge viste/anteprima3d.js, a parte dal resto; il ritratto dell'eroe vestito
   lo disegna il telefono. \`SENZA\`: le chiavi senza modello (resta lo sprite). Vedi docs/sotterraneo/anteprime-3d.md.
   firma: ${firmaDi(foto)}
*/

export const FIRMA = '${firmaDi(foto)}'
export const SORGENTI = '${firmaSorgenti()}'
export const SENZA = ${JSON.stringify(senza)}

export const ANTEPRIME = {
${righe.join('\n')}
}
`)
}

/** `browser` di Playwright col file costruito. → { foto, senza } */
export async function fotografaSotterraneo(browser) {
  const { apriGioco, GIOCO } = await import('../test/aiuto/browser.mjs')
  const { page, errori } = await apriGioco(browser, { hash: 'sotterraneo=1&eroe=cavaliere&dpr=1&seme=11', attesa: null, indirizzo: GIOCO })
  await page.waitForFunction(() => !!window.__anteprime3d, null, { timeout: 30000 })
  if (process.env.ANTEPRIME_DEBUG) mkdirSync(DEBUG, { recursive: true })
  const chiavi = chiaviDaFotografare(), foto = {}, senza = []
  for (let i = 0; i < chiavi.length; i += 40) {
    const parte = chiavi.slice(i, i + 40)
    const uri = await page.evaluate(async ([ks, q]) => Promise.all(ks.map(async k => {
      const t = await window.__anteprime3d.viva(k)
      return t ? t.toDataURL('image/webp', q) : null
    })), [parte, QUALITA])
    parte.forEach((k, j) => {
      if (!uri[j]) { senza.push(k); return }
      foto[k] = uri[j]
      if (process.env.ANTEPRIME_DEBUG) writeFileSync(resolve(DEBUG, k.replace(/[:/]/g, '_') + '.webp'), Buffer.from(uri[j].split(',')[1], 'base64'))
    })
    process.stdout.write(`\r  sotterraneo: ${Math.min(chiavi.length, i + 40)} di ${chiavi.length}`)
  }
  process.stdout.write('\n')
  await page.close()
  if (errori.length) console.warn('  errori della pagina:', errori.slice(0, 3).join(' | '))
  return { foto, senza }
}
