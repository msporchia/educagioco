/* ═══════════════════════════════════════════════════════════════════
   LE QUOTE — l'inglese e le tabelline in mezzo agli altri giochi
   tempo: 10

   I moduli `ing-*` e `tabelline` dichiarano una `quota`: pesano insieme
   una frazione del mazzo (inglese 1/20, tabelline 1/40), qualunque sia
   il numero dei loro moduli e dei loro gradi (`conQuote` in
   nucleo/classi.js, docs/apprendimento/quote.md). Si controlla che:
     · la frazione regga a ogni età e a ogni manopola, con un po' di
       margine (è un'indicazione, non un conto esatto);
     · un gioco che nomina solo l'inglese non venga scalato a niente;
     · l'inglese abbia i gradi dell'età: a 5 anni solo l'isola prima.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { nota, controlla, riassunto } from '../aiuto/verifica.mjs'
import { classiDi, pescaClasse, finestraDi } from '../../src/quiz/nucleo/classi.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'

const CARTELLA = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/quiz/moduli')
const moduli = []
for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
  const m = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
  if (m && !m.soloSuRichiesta) moduli.push(m)
}

const quota = (elenco, eta, difficolta, gruppo, tiri = 12000) => {
  const classi = classiDi(elenco, { difficolta, regole: { eta, finestra: finestraDi(eta) } })
  const sorte = new Sorte(11)
  let dentro = 0
  for (let i = 0; i < tiri; i++) if (pescaClasse(sorte, classi).modulo.quota?.gruppo === gruppo) dentro++
  return dentro / tiri
}

for (const eta of [6.5, 8, 10, 12]) for (const d of [0.2, 0.5, 0.8]) {
  const ing = quota(moduli, eta, d, 'inglese')
  const tab = quota(moduli, eta, d, 'tabelline')
  controlla(`a ${eta} anni (manopola ${d}) l'inglese è circa 1 su 20`, ing > 0.035 && ing < 0.07, `${(ing * 100).toFixed(1)}%`)
  controlla(`a ${eta} anni (manopola ${d}) le tabelline sono circa 1 su 40`, tab > 0.015 && tab < 0.04, `${(tab * 100).toFixed(1)}%`)
}
nota('inglese e tabelline: la frazione dichiarata regge a ogni età provata')

const soloInglese = moduli.filter(m => m.materia === 'inglese')
controlla('un mazzo di solo inglese non viene scalato', soloInglese.length >= 2 &&
  quota(soloInglese, 8, 0.5, 'inglese', 2000) === 1)

const grado = (eta) => classiDi(soloInglese, { difficolta: 0.5, regole: { eta, finestra: finestraDi(eta) } })
  .map(c => c.grado)
controlla('a 6,5 anni l\'inglese non arriva al passato', Math.max(...grado(6.5)) <= 3, 'gradi: ' + [...new Set(grado(6.5))])
controlla('a 11 anni l\'inglese non torna ai colori', Math.min(...grado(11)) >= 2, 'gradi: ' + [...new Set(grado(11))])

riassunto('le quote')
