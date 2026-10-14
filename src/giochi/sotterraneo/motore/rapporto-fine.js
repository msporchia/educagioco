// Le tabelle di «a che punto è l'eroe alla fine di ogni discesa» e delle strade di spesa (docs/sotterraneo/fine-discesa-e-strade.md): dai passi di
// una linea (motore/storie.js) alla mediana e alle code accanto all'atteso, dove si ferma, chi vince bevendo. Funzioni pure. Gira in Node.
import { CAMPAGNA } from '../dati/campagna.js'
import { QUOTA_CHE_SI_FERMA, POZIONI_DA_BEONE } from '../dati/giocatori-tipo.js'
import { attesoA } from './fine.js'

const mediana = v => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const media = v => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null)
const quantile = (v, p) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null }

// le righe della tabella; le percentuali sono dell'eroe atteso della stessa classe (100 è l'atteso)
export const RIGHE_FINE = [
  { chiave: 'liv', nome: 'livello', segno: false },
  { chiave: 'scarto', nome: 'forza sull\'atteso', segno: true },
  { chiave: 'dpa', nome: 'danno a risposta %', segno: false },
  { chiave: 'dif', nome: 'difesa %', segno: false },
  { chiave: 'vita', nome: 'vita massima %', segno: false },
  { chiave: 'valore', nome: 'valore roba %', segno: false },
  { chiave: 'gemme', nome: 'gemme avanzate', segno: false },
  { chiave: 'poz', nome: 'pozioni rimaste', segno: false },
  { chiave: 'bevute', nome: 'pozioni bevute', segno: false },
]

/* Le letture a fine discesa di una linea: `passi` sono i suoi passi (uno per storia e per discesa k; k = 7 è la spesa in uscita). La fine
   della discesa j è l'ingresso della j+1: l'eroe com'è tornato su, dopo la spesa. Torna una voce per discesa con il valore di ogni storia. */
export function fineDi(passi) {
  const storie = new Map()
  for (const p of passi) { const c = `${p.eroe}|${p.seme}`; if (!storie.has(c)) storie.set(c, []); storie.get(c)[p.k] = p }
  const nuovo = () => ({ n: 0, passa: [], allaPrima: [], dopoAllaPrima: [], ...Object.fromEntries(RIGHE_FINE.map(r => [r.chiave, []])) })
  const per = CAMPAGNA.map(nuovo)
  for (const s of storie.values()) CAMPAGNA.forEach((_, j) => {
    const dentro = s[j], dopo = s[j + 1]
    if (!dentro || !dopo) return
    const a = attesoA(dopo.eroe, j + 1), i = dopo.ingresso, f = per[j]
    f.n++
    f.passa.push(dentro.tentativi.some(t => t.v) ? 1 : 0)
    f.allaPrima.push(dentro.tentativi[0] && dentro.tentativi[0].v ? 1 : 0)
    f.liv.push(i.liv)
    f.scarto.push(i.forza - a.liv)
    f.dpa.push(100 * i.dpa / a.dpa)
    f.dopoAllaPrima.push(s[j + 2] && s[j + 2].tentativi[0] ? (s[j + 2].tentativi[0].v ? 1 : 0) : null)
    f.dif.push(100 * i.dif / a.dif)
    f.vita.push(100 * i.vita / a.vita)
    f.valore.push(100 * i.valore / a.valore)
    f.gemme.push(i.gemme)
    f.poz.push(dopo.prima.poz)
    f.bevute.push(dentro.tentativi.reduce((x, t) => x + t.pz, 0))
  })
  return per
}

// l'atteso in assoluto: la media dei quattro eroi attesi all'ingresso della discesa dopo
export function attesoDellaFine(j, eroi = ['cavaliere', 'elfa', 'mago', 'nano']) {
  const l = eroi.map(e => attesoA(e, j + 1))
  return { liv: l[0].liv, dpa: media(l.map(x => x.dpa)), dif: media(l.map(x => x.dif)), vita: media(l.map(x => x.vita)), valore: media(l.map(x => x.valore)) }
}

// 10° · mediana · 90° percentile di una riga, per ogni discesa
export const quantili = (F, chiave) => F.map(f => [quantile(f[chiave], 0.1), mediana(f[chiave]), quantile(f[chiave], 0.9)])
const cifra = (x, segno) => (x == null ? '-' : Math.abs(x) >= 1000 ? `${(x / 1000).toFixed(1)}k` : `${segno && x > 0 ? '+' : ''}${Math.round(x)}`)
const intestazione = () => ' '.repeat(22) + CAMPAGNA.map(t => t.chiave.slice(0, 6).padStart(14)).join('')

// la tabella di una linea: una riga per misura, tre numeri per discesa (le code e la mediana); `solo` sceglie le righe
export function tabellaFine(F, nome, { solo = null } = {}) {
  const righe = [`${nome} (a fine discesa, dopo la spesa: 10° · mediana · 90° percentile di ${Math.max(...F.map(f => f.n))} storie)`, intestazione()]
  for (const r of RIGHE_FINE.filter(x => !solo || solo.includes(x.chiave)))
    righe.push(r.nome.padEnd(22) + quantili(F, r.chiave).map(v => v.map(x => cifra(x, r.segno)).join('·').padStart(14)).join(''))
  return righe.join('\n')
}

// l'atteso in assoluto, una riga per misura
export function tabellaAtteso() {
  const a = CAMPAGNA.map((_, j) => attesoDellaFine(j))
  const riga = (nome, f) => nome.padEnd(22) + a.map(x => f(x).padStart(14)).join('')
  return ['L\'atteso a fine discesa (la media dei quattro eroi attesi, all\'ingresso della discesa dopo)', intestazione(),
    riga('livello', x => String(x.liv)), riga('danno a risposta', x => x.dpa.toFixed(1)), riga('difesa', x => x.dif.toFixed(1)),
    riga('vita massima', x => x.vita.toFixed(0)), riga('valore roba', x => x.valore.toFixed(0))].join('\n')
}

/* La riga di una strada: per discesa quanti vincono alla prima e quanti restano bloccati (nessuna vittoria in TENTATIVI giri); dove si ferma
   (la prima discesa con almeno QUOTA_CHE_SI_FERMA bloccati), con che forza arriva lì e alla fine (l'ultima discesa giocata), il danno e il valore della roba */
export function rigaDellaStrada(F) {
  const bloccati = F.map(f => (f.n ? 1 - media(f.passa) : null))
  const ferma = bloccati.findIndex(b => b != null && b >= QUOTA_CHE_SI_FERMA)
  const fine = F.reduce((u, f, j) => (f.n ? j : u), -1)
  const ultima = F[Math.max(0, fine)]
  return { fine, allaPrima: F.map(f => (f.n ? media(f.allaPrima) : null)), bloccati, ferma: ferma >= 0 ? ferma : null,
           forzaLa: ferma >= 0 ? mediana(F[ferma].scarto) : null, forzaFine: mediana(ultima.scarto), dpaFine: mediana(ultima.dpa),
           valoreFine: mediana(ultima.valore), bevute: F.map(f => (f.n ? media(f.bevute) : null)) }
}

// Chi vince bevendo (almeno POZIONI_DA_BEONE pozioni nella discesa) contro chi vince bevendo meno: com'esce e come va la discesa dopo

export function chiVinceBevendo(F) {
  const beve = [], altri = []
  F.forEach(f => f.passa.forEach((p, i) => { if (p) (f.bevute[i] >= POZIONI_DA_BEONE ? beve : altri).push({ scarto: f.scarto[i], dpa: f.dpa[i], dopo: f.dopoAllaPrima[i] }) }))
  const riassunto = xs => ({ n: xs.length, scarto: mediana(xs.map(x => x.scarto)), dpa: mediana(xs.map(x => x.dpa)), dopo: media(xs.filter(x => x.dopo != null).map(x => x.dopo)) })
  return { quota: beve.length + altri.length ? beve.length / (beve.length + altri.length) : null, beve: riassunto(beve), altri: riassunto(altri) }
}
