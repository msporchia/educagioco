// I checkpoint della taratura del sotterraneo (docs/sotterraneo/fine-discesa-e-strade.md): dopo ogni discesa si salva lo stato di tutte le
// storie (la roba e la crescita con cui si esce) e i passi giocati, con la firma dei sorgenti che li hanno prodotti. Una discesa si rifà da
// sé se la sua firma non torna, e con lei tutte quelle dopo; quelle prima restano; un giro con meno storie si serve da quelle salvate. Libreria: la usano
// lo strumento e la sua unità.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'

export const FORMATO = 3
const sha = testo => createHash('sha1').update(testo).digest('hex').slice(0, 16)

// i file che un modulo importa, di qua e di là: le dipendenze relative (le altre, come vue, non fanno parte del gioco misurato)
export function dipendenze(entrate, radice) {
  const visti = new Set()
  const vai = file => {
    if (visti.has(file) || !existsSync(file)) return
    visti.add(file)
    const testo = readFileSync(file, 'utf8')
    for (const m of testo.matchAll(/(?:^|\n)\s*(?:import|export)\b[^'"]*?(?:from\s*)?['"](\.{1,2}\/[^'"]+)['"]/g)) vai(resolve(dirname(file), m[1]))
  }
  entrate.forEach(e => vai(resolve(radice, e)))
  return [...visti].sort()
}

// il testo di un sorgente senza le righe di commento: ritoccare un commento non rifà niente
const senzaCommenti = testo => testo.replace(/^[ \t]*\/\*[\s\S]*?\*\/[ \t]*\n/gm, '').replace(/^[ \t]*\/\/.*\n/gm, '')

// JSON che ricorda anche il codice delle funzioni: un dato del gioco può essere una funzione
const serializza = dato => JSON.stringify(dato, (_, v) => (typeof v === 'function' ? v.toString() : v))

/* La firma di ogni discesa k: il testo dei file importati, le righe della campagna fino alla k, `generale` (i valori provati a mano che valgono per
   tutte) ed `extra`; i file in `escludi` entrano per il loro dato (`extra`) e non per il testo. Una riga ritoccata cambia la firma di quella
   discesa e delle dopo, non delle prima. La logica del giro (`eseguiLavoro` nello strumento) non c'è: se cambia come si gioca, si alza FORMATO. */
export function firmeDelleDiscese({ entrate, radice, campagna, righe, generale = '', propri = [], escludi = [], extra = null }) {
  const esclusi = new Set(escludi.map(e => resolve(radice, e)))
  const file = dipendenze(entrate, radice).filter(f => !esclusi.has(f))
  const comune = sha([FORMATO, generale, ...file.map(f => `${relative(radice, f)}\n${senzaCommenti(readFileSync(f, 'utf8'))}`), ...propri.map(f => senzaCommenti(readFileSync(resolve(radice, f), 'utf8'))), serializza(extra)].join('\n'))
  const { CAMPAGNA, ...altro } = campagna
  return Array.from({ length: righe }, (_, k) => sha(`${comune}\n${serializza(altro)}\n${serializza(CAMPAGNA.slice(0, k + 1))}`))
}

const percorso = (dir, k) => resolve(dir, `checkpoint-${k}.json`)

// la chiave di una storia in un checkpoint: l'eroe e il seme
export const chiaveDi = x => `${x.passo.eroe}|${x.passo.seme}`

// un file è una riga di testa (formato, k, firma, storie di ogni linea) e il corpo: per sapere se un checkpoint vale non si rilegge tutto.
// `linee`: { id: [{ passo, stato }] }
export function scrivi(dir, k, { firma, linee }) {
  mkdirSync(dir, { recursive: true })
  const copertura = Object.fromEntries(Object.entries(linee).map(([id, l]) => [id, l.map(chiaveDi)]))
  writeFileSync(percorso(dir, k), `${JSON.stringify({ formato: FORMATO, k, firma, copertura })}\n${JSON.stringify(linee)}`)
}

export function leggi(dir, k, { soloLaTesta = false } = {}) {
  const f = percorso(dir, k)
  if (!existsSync(f)) return null
  try {
    const testo = readFileSync(f, 'utf8'), a = testo.indexOf('\n')
    const testa = JSON.parse(testo.slice(0, a))
    return soloLaTesta ? testa : { ...testa, linee: JSON.parse(testo.slice(a + 1)) }
  } catch { return null }
}

/* Quanti checkpoint di fila, da 0, sono validi: la firma torna e ci sono tutte le storie richieste (`richieste`: { id: ['eroe|seme', …] }; un giro
   più piccolo di quello salvato vale, uno più grande no). Quelli dopo il primo che non torna non contano, anche se la loro firma sembrerebbe a
   posto: sono stati giocati da uno stato che non esiste più. */
export function validi(dir, firme, richieste = {}) {
  let n = 0
  for (; n < firme.length; n++) {
    const c = leggi(dir, n, { soloLaTesta: true })
    if (!c || c.formato !== FORMATO || c.firma !== firme[n]) break
    if (!Object.entries(richieste).every(([id, chiavi]) => { const ci = new Set(c.copertura[id] || []); return chiavi.every(x => ci.has(x)) })) break
  }
  return n
}

// le storie richieste di una linea, nell'ordine in cui si chiedono, prese da quelle salvate
export function scegli(salvate, chiavi) {
  const per = new Map(salvate.map(x => [chiaveDi(x), x]))
  return chiavi.map(c => per.get(c))
}
