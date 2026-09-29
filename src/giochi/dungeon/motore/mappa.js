// La mappa: file dal basso al guardiano, legate da una scaletta (archi che
// salgono di un gradino per parte, mai in ordine sparso) così ogni stanza ha
// sempre una via che entra e una che esce. `guastiDellaMappa()` lo riverifica
// e chi genera riprova finché non torna pulita. Stanze confrontate per `id`,
// mai `===` (nel gioco arrivano avvolte da Vue).
import { STANZE, SACCHI, saccoDellaRiga, rischioDi, pianoDi, eFinePiano,
         QUANTI_PIANI } from '../dati/stanze.js'
import { TARATURA } from '../dati/taratura.js'
import { difficoltaDi } from '../dati/campagna.js'

export class Stanza {
  constructor({ id, riga, col, tipo, quante, xn, difficolta = 1 }) {
    this.id = id
    this.riga = riga
    this.col = col
    this.tipo = tipo
    this.quante = quante        // quante stanze ci sono in questa fila
    this.xn = xn                // 0..1 sulla larghezza
    // decisa una volta alla nascita della mappa, e riusata dal bollino ⚡ e dalla sfida
    this.difficolta = difficolta
    this.verso = []             // le stanze della fila sopra
    this.da = []                // quelle della fila sotto
    this.curve = []             // la pancia di ogni sentiero che parte da qui
    this.vista = false          // il bambino sa cosa c'è?
    this.fatta = false
  }

  get scheda() { return STANZE[this.tipo] }
  get icona() { return this.scheda.icona }
  get colore() { return this.scheda.colore }
  get rischio() { return rischioDi(this.tipo, this.difficolta) }
  profondita(file) { return file > 1 ? this.riga / (file - 1) : 1 }   // 0 in cima, 1 davanti al guardiano
}

export class Mappa {
  constructor(file) {
    this.file = file                       // [[Stanza]]
    this.tutte = file.flat()
  }

  get quanteFile() { return this.file.length }
  get boss() { return this.file[this.file.length - 1][0] }
  get ingressi() { return this.file[0] }

  per(id) { return this.tutte.find(s => s.id === id) || null }

  // il guardiano si vede sempre, da subito: è il motivo per cui si scende
  illumina(rigaOra, quanto, tutto = false) {
    for (const s of this.tutte)
      if (tutto || s.riga <= rigaOra + quanto || s.riga === this.quanteFile - 1) s.vista = true
  }
}

// gli archi fra una fila di `a` e una di `b`
export function scaletta(a, b, rnd = Math.random) {
  const archi = [[0, 0]]
  const esce = new Array(a).fill(0), entra = new Array(b).fill(0)
  esce[0] = 1; entra[0] = 1
  let i = 0, j = 0
  while (i < a - 1 || j < b - 1) {
    let saleI
    if (i >= a - 1) saleI = false
    else if (j >= b - 1) saleI = true
    // più di due sentieri che escono (o entrano) dalla stessa stanza fanno una ragnatela
    else if (esce[i] >= 2) saleI = true
    else if (entra[j] >= 2) saleI = false
    else saleI = rnd() < 0.5
    if (saleI) i++; else j++
    esce[i]++; entra[j]++
    archi.push([i, j])
  }
  return archi
}

const interoFra = (a, b, rnd) => a + Math.floor(rnd() * (b - a + 1))
const pesca = (elenco, rnd) => elenco[Math.floor(rnd() * elenco.length)]

// il capo di ogni piano sta da solo nella sua fila: è il collo di bottiglia che non si aggira
function quanteStanze(riga, file, rnd) {
  if (riga === 0) return interoFra(2, 3, rnd)
  if (eFinePiano(riga, file)) return 1
  if (eFinePiano(riga + 1, file)) return interoFra(2, 3, rnd)   // la fila del fuoco
  return interoFra(2, 4, rnd)
}

// dal sacco della fila, mai due negozi o due scrigni affiancati (le gemme non basterebbero)
function tipoStanza(riga, file, giaNellaFila, rnd) {
  const sacco = SACCHI[saccoDellaRiga(riga, file)]
  let tipo = pesca(sacco, rnd)
  for (let giri = 0; giri < 12 && ['negozio', 'scrigno'].includes(tipo)
                     && giaNellaFila.includes(tipo); giri++)
    tipo = pesca(sacco, rnd)
  return tipo
}

function costruisci(tappa, rnd) {
  const quanteFile = tappa.file
  const file = []
  let id = 0
  for (let r = 0; r < quanteFile; r++) {
    const n = quanteStanze(r, quanteFile, rnd)
    const fila = []
    for (let i = 0; i < n; i++) {
      // scarto quanto basta per non sembrare una griglia, mai tanto da toccarsi
      const scarto = (rnd() * 2 - 1) * 0.22 / n
      const xn = Math.max(0.16, Math.min(0.84, (i + 0.5) / n + scarto))
      fila.push(new Stanza({
        id: id++, riga: r, col: i, quante: n, xn,
        tipo: tipoStanza(r, quanteFile, fila.map(s => s.tipo), rnd),
      }))
    }
    file.push(fila)
  }

  for (let r = 0; r < quanteFile - 1; r++)
    for (const [i, j] of scaletta(file[r].length, file[r + 1].length, rnd)) {
      const a = file[r][i], b = file[r + 1][j]
      a.verso.push(b); b.da.push(a)
    }

  const mappa = new Mappa(file)

  // una vetrina e uno scrigno per piano: mai zero, mai più di TARATURA.mercantiPerPiano
  const dentro = s => !eFinePiano(s.riga, quanteFile) && !eFinePiano(s.riga + 1, quanteFile) && s.riga >= 1
  for (let p = 0; p < QUANTI_PIANI; p++) {
    const suoi = mappa.tutte.filter(s => pianoDi(s.riga, quanteFile) === p)
    const negozi = suoi.filter(s => s.tipo === 'negozio')
    for (const s of negozi.slice(TARATURA.mercantiPerPiano)) s.tipo = rnd() < 0.5 ? 'mostro' : 'bivio'

    // si sacrifica sempre la stanza meno preziosa: prima un mostro, poi una stranezza, poi un mostro grosso
    for (const garantita of ['scrigno', 'negozio']) {
      if (suoi.some(s => s.tipo === garantita)) continue
      for (const sacrificabile of ['mostro', 'bivio', 'grosso']) {
        const candidate = suoi.filter(s => s.tipo === sacrificabile && dentro(s))
        if (!candidate.length) continue
        pesca(candidate, rnd).tipo = garantita
        break
      }
    }
  }

  // va fatto dopo i mercanti/scrigni garantiti, o una stanza porterebbe in giro il rincaro di quella che era prima
  for (const s of mappa.tutte)
    s.difficolta = difficoltaDi(tappa, s.riga, STANZE[s.tipo].rincaro)

  // decisa una volta per tutte: se cambiasse a ogni fotogramma la mappa respirerebbe
  for (const s of mappa.tutte) s.curve = s.verso.map(() => (rnd() * 2 - 1) * 0.22)
  return mappa
}

// si arriva a tutte le stanze partendo dal basso? e da ognuna si arriva al guardiano?
export function guastiDellaMappa(mappa) {
  const guasti = []
  const avanti = new Set()
  const coda = mappa.ingressi.slice()
  coda.forEach(s => avanti.add(s.id))
  while (coda.length) {
    const s = coda.shift()
    for (const v of s.verso) if (!avanti.has(v.id)) { avanti.add(v.id); coda.push(v) }
  }
  const indietro = new Set([mappa.boss.id])
  const coda2 = [mappa.boss]
  while (coda2.length) {
    const s = coda2.shift()
    for (const d of s.da) if (!indietro.has(d.id)) { indietro.add(d.id); coda2.push(d) }
  }
  for (const s of mappa.tutte) {
    if (!avanti.has(s.id)) guasti.push(`alla stanza ${s.id} (fila ${s.riga + 1}) non ci si arriva`)
    if (!indietro.has(s.id)) guasti.push(`dalla stanza ${s.id} (fila ${s.riga + 1}) non si arriva al guardiano`)
  }
  if (mappa.file[mappa.quanteFile - 1].length !== 1) guasti.push('i guardiani sono più di uno')
  if (mappa.boss.tipo !== 'boss') guasti.push("l'ultima stanza non è il guardiano")
  for (let r = 0; r < mappa.quanteFile; r++) {
    if (!eFinePiano(r, mappa.quanteFile)) continue
    const fila = mappa.file[r]
    if (fila.length !== 1) guasti.push(`la fila ${r + 1} chiude un piano ma ha ${fila.length} stanze`)
    else if (!['capo', 'boss'].includes(fila[0].tipo))
      guasti.push(`la fila ${r + 1} chiude un piano ma dentro c'è "${fila[0].tipo}"`)
  }
  if (!mappa.file.every((f, r) => f.every(s => s.riga === r)))
    guasti.push('una stanza sta in una fila che non è la sua')
  return guasti
}

export function generaMappa(tappa, rnd = Math.random) {
  let ultima = null
  for (let tentativo = 0; tentativo < 30; tentativo++) {
    ultima = costruisci(tappa, rnd)
    if (!guastiDellaMappa(ultima).length) return ultima
  }
  return ultima
}
