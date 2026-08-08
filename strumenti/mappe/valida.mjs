#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   IL VALIDATORE DEI LIVELLI, DA RIGA DI COMANDO

   Un livello è un dato scritto a mano, e i dati scritti a mano sono
   sbagliati: una riga più corta delle altre, una chiave citata da tre
   ordini e cancellata dalla mappa, una zona dichiarata e mai disegnata.
   Nessuna di queste cose si vede rileggendo; tutte fanno un livello che
   non si può finire.

   Le regole stanno in `nucleo.js`, che è lo stesso file che gira dentro
   `editor.html`: il validatore che parla mentre disegni e quello che
   passa nei test devono essere lo stesso, o uno dei due mente.

   Uso:
     node strumenti/mappe/valida.mjs              gli esempi + src/data/generale.js
     node strumenti/mappe/valida.mjs uno.mjs      un file che esporta LIVELLI
     node strumenti/mappe/valida.mjs liv.txt      un livello scritto come testo
     node strumenti/mappe/valida.mjs --muto       solo il verdetto, per gli script

   Esce con 0 se va tutto bene, con 1 se c'è anche un solo errore. Gli
   avvisi non fanno fallire niente: sono sospetti, non sentenze.
   ═══════════════════════════════════════════════════════════════════ */
import './nucleo.js'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve, relative } from 'node:path'

const { valida, validaTutto, versioni, leggi, scrivi } = globalThis.MAPPE
export { valida, validaTutto, versioni, leggi, scrivi }
export const MAPPE = globalThis.MAPPE

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '../..')

/* Tira fuori i livelli da un modulo, comunque li abbia esportati: un
   elenco `LIVELLI`, un default, o un livello solo. */
export function livelliDi(modulo) {
  const cose = [modulo.LIVELLI, modulo.default, modulo.livelli, modulo.LIVELLO, modulo]
  for (const c of cose) {
    if (Array.isArray(c) && c.some(x => x && x.mappa)) return c.filter(x => x && x.mappa)
    if (c && c.mappa) return [c]
  }
  return []
}

export async function caricaFile(percorso) {
  if (/\.(txt|livello)$/.test(percorso))
    return [leggi(readFileSync(percorso, 'utf8'))]
  if (/\.json$/.test(percorso)) {
    const dentro = JSON.parse(readFileSync(percorso, 'utf8'))
    return Array.isArray(dentro) ? dentro : [dentro]
  }
  return livelliDi(await import(pathToFileURL(resolve(percorso)).href))
}

/* ── quando è chiamato a mano ── */
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2)
  const muto = argv.includes('--muto')
  const dati = argv.filter(a => !a.startsWith('--'))

  const fonti = []
  if (dati.length) {
    for (const p of dati) fonti.push([p, await caricaFile(p)])
  } else {
    fonti.push(['strumenti/mappe/esempi/livelli.mjs',
                await caricaFile(resolve(QUI, 'esempi/livelli.mjs'))])
    const gioco = resolve(RADICE, 'src/data/generale.js')
    if (existsSync(gioco)) fonti.push(['src/data/generale.js', await caricaFile(gioco)])
    else console.log('· `src/data/generale.js` non c\'è ancora: guardo solo gli esempi\n')
  }

  let errori = 0, avvisi = 0, quanti = 0
  for (const [nome, livelli] of fonti) {
    console.log(`── ${relative(RADICE, resolve(nome)) || nome} — ${livelli.length} livelli`)
    if (!livelli.length) console.log('   (nessun livello dentro: esporta `LIVELLI`)')
    for (const [i, liv] of livelli.entries()) {
      quanti++
      const esito = validaTutto(liv)
      errori += esito.errori.length
      avvisi += esito.avvisi.length
      const titolo = `${i + 1}. ${liv.nome || liv.id || 'senza nome'}`
      const versi = versioni(liv).length
      if (esito.ok && !esito.avvisi.length) {
        if (!muto) console.log(`   ✅ ${titolo} — ${versi} versioni, par ${liv.par}`)
      } else {
        console.log(`   ${esito.ok ? '⚠️ ' : '❌'} ${titolo}`)
        for (const m of esito.errori) console.log(`      · ${m}`)
        for (const m of esito.avvisi) console.log(`      ~ ${m}`)
      }
    }
  }
  console.log('═'.repeat(60))
  console.log(errori ? `❌ ${errori} error${errori === 1 ? 'e' : 'i'} in ${quanti} livelli` +
                       (avvisi ? ` (e ${avvisi} avvisi)` : '')
                     : `✅ ${quanti} livelli in ordine` + (avvisi ? ` — ${avvisi} avvisi da guardare` : ''))
  process.exit(errori ? 1 : 0)
}
